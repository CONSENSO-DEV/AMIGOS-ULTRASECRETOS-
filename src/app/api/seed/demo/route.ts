import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  generateGroupCode,
  generateAdminCode,
  hashToken,
} from '@/lib/codes'
import { publicGroup } from '@/lib/group-state'

/**
 * POST /api/seed/demo
 * Creates a demo group "Amigos Ultrasecretos Demo" with 5 pre-set participants,
 * pre-loaded chat messages and guesses. Returns the group code + each
 * participant's personal code and the admin code, so the user can log in
 * as any of them.
 *
 * The demo group's presentation date is set to NOW + 2 hours by default,
 * but the admin can force reveal via the admin panel.
 */
export async function POST(req: NextRequest) {
  try {
    // Cleanup any previous demo group(s) so we don't accumulate
    const prevDemos = await db.group.findMany({
      where: { name: 'Amigos Ultrasecretos Demo' },
    })
    for (const g of prevDemos) {
      await db.guess.deleteMany({ where: { groupId: g.id } })
      await db.message.deleteMany({ where: { groupId: g.id } })
      await db.participant.deleteMany({ where: { groupId: g.id } })
      await db.group.delete({ where: { id: g.id } })
    }

    // Build date 2 hours in the future (America/Bogota is UTC-5, no DST)
    const future = new Date(Date.now() + 2 * 60 * 60 * 1000)
    // Convert to America/Bogota wall-clock
    const dtf = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    const parts = dtf.formatToParts(future)
    const map: Record<string, string> = {}
    for (const p of parts) if (p.type !== 'literal') map[p.type] = p.value
    const presentationDate = `${map.year}-${map.month}-${map.day}`
    const presentationTime = `${map.hour}:${map.minute}`

    const adminToken = generateAdminCode()
    const group = await db.group.create({
      data: {
        name: 'Amigos Ultrasecretos Demo',
        description:
          'Grupo de demostración para probar todas las funcionalidades de la app.',
        // Use a custom demo code if available, otherwise generate one
        code: await getDemoCode(),
        presentationDate,
        presentationTime,
        timezone: 'America/Bogota',
        status: 'ACTIVE',
        adminTokenHash: hashToken(adminToken),
        // Admin is NOT a participant; we don't store organizer name on the group.
      },
    })

    // Demo participants with their real names and pre-set passwords (so the
    // user can log in as any of them to test the app).
    const demo = [
      { alias: 'El Zorro', avatar: '🦊', realName: 'Carlos Pérez', password: 'zorro123' },
      { alias: 'La Rana', avatar: '🐸', realName: 'María Gómez', password: 'rana123' },
      { alias: 'El Misterioso', avatar: '🎩', realName: 'Juan Rodríguez', password: 'misterio123' },
      { alias: 'El Fantasma', avatar: '👻', realName: 'Laura Sánchez', password: 'fantasma123' },
      { alias: 'El León', avatar: '🦁', realName: 'Andrés Torres', password: 'leon123' },
    ]

    const participants: any[] = []
    const passwords: string[] = []
    for (const d of demo) {
      const p = await db.participant.create({
        data: {
          groupId: group.id,
          alias: d.alias,
          realName: d.realName,
          avatar: d.avatar,
          personalCodeHash: hashToken(d.password),
        },
      })
      participants.push(p)
      passwords.push(d.password)
    }

    // Add some demo chat messages
    const demoMessages = [
      { idx: 0, content: '¿Ya saben quién soy? 😎' },
      { idx: 1, content: 'Yo tengo una sospecha... 🤔' },
      { idx: 2, content: 'Van muy mal 😂' },
      { idx: 3, content: 'El Fantasma es misterioso 👻' },
      { idx: 4, content: '¡Aguanten los detectives! 🕵️' },
      { idx: 1, content: 'Mañana es la revelación 🔥' },
      { idx: 0, content: 'Yo creo que soy el mejor detective 😏' },
      { idx: 2, content: 'Yo también tengo mis teorías 🎭' },
    ]
    for (let i = 0; i < demoMessages.length; i++) {
      const m = demoMessages[i]
      const p = participants[m.idx]
      await db.message.create({
        data: {
          groupId: group.id,
          participantId: p.id,
          content: m.content,
          createdAt: new Date(Date.now() - (demoMessages.length - i) * 60000),
        },
      })
    }

    // Add guesses: each participant guesses each other participant with some randomness,
    // but ensure correct guesses for the first two participants.
    for (let i = 0; i < participants.length; i++) {
      for (let j = 0; j < participants.length; j++) {
        if (i === j) continue
        const target = participants[j]
        let guessedIdx: number
        if (i < 2) {
          // High accuracy for first 2
          guessedIdx = Math.random() < 0.85 ? j : pickOtherIdx(j, participants.length)
        } else if (i < 4) {
          guessedIdx = Math.random() < 0.5 ? j : pickOtherIdx(j, participants.length)
        } else {
          guessedIdx = pickOtherIdx(j, participants.length)
        }
        await db.guess.create({
          data: {
            groupId: group.id,
            participantId: participants[i].id,
            targetParticipantId: target.id,
            guessedParticipantId: participants[guessedIdx].id,
          },
        })
      }
    }

    return NextResponse.json({
      ok: true,
      group: publicGroup(group),
      adminToken,
      participants: participants.map((p: any, idx: number) => ({
        id: p.id,
        alias: p.alias,
        avatar: p.avatar,
        realName: p.realName, // visible because this is the demo seed (no real participants)
        password: passwords[idx],
      })),
    })
  } catch (e: any) {
    console.error('[POST /api/seed/demo] error', e)
    return NextResponse.json(
      { ok: false, error: 'No se pudo crear el grupo demo' },
      { status: 500 }
    )
  }
}

function pickOtherIdx(exclude: number, total: number): number {
  let i = Math.floor(Math.random() * total)
  while (i === exclude) i = Math.floor(Math.random() * total)
  return i
}

/**
 * Returns a memorable demo code, falling back to a generated one if all
 * the obvious candidates are taken.
 */
async function getDemoCode(): Promise<string> {
  const candidates = ['DEMO', 'DEMO2026', 'ULTRA', 'ULTRADEMO']
  for (const c of candidates) {
    const exists = await db.group.findUnique({ where: { code: c } })
    if (!exists) return c
  }
  return generateGroupCode()
}

