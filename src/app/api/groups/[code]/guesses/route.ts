import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getParticipantFromRequest } from '@/lib/session'
import {
  canModifyGuesses,
  isRevealAvailable,
  publicParticipant,
} from '@/lib/group-state'

/** GET /api/groups/[code]/guesses - returns the caller's guesses, plus target list */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ code: string }> }
) {
  const { code } = await ctx.params
  const auth = await getParticipantFromRequest(req)
  if (!auth) {
    return NextResponse.json(
      { ok: false, error: 'No autenticado' },
      { status: 401 }
    )
  }
  const { group, participant } = auth
  if (group.code !== code) {
    return NextResponse.json(
      { ok: false, error: 'Grupo incorrecto' },
      { status: 403 }
    )
  }
  const reveal = await isRevealAvailable(group)

  // Public participants list (without real names)
  const allParticipants = await db.participant.findMany({
    where: { groupId: group.id, active: true },
    orderBy: { joinedAt: 'asc' },
  })

  // Own guesses
  const ownGuesses = await db.guess.findMany({
    where: { groupId: group.id, participantId: participant.id },
  })

  // After reveal, also return full answer key (so client can show results)
  let answerKey: Record<string, { alias: string; realName: string; avatar: string }> | null = null
  if (reveal) {
    answerKey = {}
    for (const p of allParticipants) {
      answerKey[p.id] = {
        alias: p.alias,
        realName: p.realName,
        avatar: p.avatar,
      }
    }
  }

  // Build response:
  // - participants: list of all participants (public only) for the picker
  // - myGuesses: map targetParticipantId -> guessedParticipantId
  // - canModify: whether guesses can still be changed
  return NextResponse.json({
    ok: true,
    reveal,
    canModify: await canModifyGuesses(group),
    participants: allParticipants
      .filter((p) => p.id !== participant.id)
      .map(publicParticipant),
    self: publicParticipant(participant),
    myGuesses: ownGuesses.reduce(
      (acc, g) => {
        acc[g.targetParticipantId] = g.guessedParticipantId
        return acc
      },
      {} as Record<string, string | null>
    ),
    answerKey,
  })
}

const SaveGuessSchema = z.object({
  targetParticipantId: z.string(),
  guessedParticipantId: z.string().nullable(),
})

import { z } from 'zod'

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ code: string }> }
) {
  const { code } = await ctx.params
  const auth = await getParticipantFromRequest(req)
  if (!auth) {
    return NextResponse.json(
      { ok: false, error: 'No autenticado' },
      { status: 401 }
    )
  }
  const { group, participant } = auth
  if (group.code !== code) {
    return NextResponse.json(
      { ok: false, error: 'Grupo incorrecto' },
      { status: 403 }
    )
  }

  if (!(await canModifyGuesses(group))) {
    return NextResponse.json(
      { ok: false, error: 'Ya no se pueden modificar las respuestas' },
      { status: 403 }
    )
  }

  const body = await req.json().catch(() => null)
  const parsed = SaveGuessSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
      { status: 400 }
    )
  }
  const { targetParticipantId, guessedParticipantId } = parsed.data

  // Can't target self
  if (targetParticipantId === participant.id) {
    return NextResponse.json(
      { ok: false, error: 'No puedes adivinarte a ti mismo' },
      { status: 400 }
    )
  }
  // Can't guess self
  if (guessedParticipantId === participant.id) {
    return NextResponse.json(
      { ok: false, error: 'No puedes votar por ti mismo' },
      { status: 400 }
    )
  }
  // Validate target belongs to this group and is active
  const target = await db.participant.findFirst({
    where: { id: targetParticipantId, groupId: group.id, active: true },
  })
  if (!target) {
    return NextResponse.json(
      { ok: false, error: 'Objetivo inválido' },
      { status: 400 }
    )
  }
  // Validate guessed participant belongs to this group and is active
  if (guessedParticipantId) {
    const guessed = await db.participant.findFirst({
      where: { id: guessedParticipantId, groupId: group.id, active: true },
    })
    if (!guessed) {
      return NextResponse.json(
        { ok: false, error: 'Selección inválida' },
        { status: 400 }
      )
    }
  }

  // Upsert
  const guess = await db.guess.upsert({
    where: {
      groupId_participantId_targetParticipantId: {
        groupId: group.id,
        participantId: participant.id,
        targetParticipantId,
      },
    },
    update: { guessedParticipantId: guessedParticipantId ?? null },
    create: {
      groupId: group.id,
      participantId: participant.id,
      targetParticipantId,
      guessedParticipantId: guessedParticipantId ?? null,
    },
  })

  return NextResponse.json({ ok: true, guess })
}
