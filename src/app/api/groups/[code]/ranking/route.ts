import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  isRevealAvailable,
  publicParticipant,
} from '@/lib/group-state'

interface RankRow {
  participantId: string
  alias: string
  avatar: string
  correct: number
  total: number
  percentage: number
  rank: number
}

/** GET /api/groups/[code]/ranking - compute and return ranking (only available after reveal) */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ code: string }> }
) {
  const { code } = await ctx.params
  const group = await db.group.findFirst({ where: { code } })
  if (!group) {
    return NextResponse.json(
      { ok: false, error: 'Grupo no encontrado' },
      { status: 404 }
    )
  }
  if (!(await isRevealAvailable(group))) {
    return NextResponse.json(
      {
        ok: false,
        error: 'El ranking estará disponible después de la revelación',
      },
      { status: 403 }
    )
  }

  // All active participants
  const participants = await db.participant.findMany({
    where: { groupId: group.id, active: true },
  })
  const ids = participants.map((p) => p.id)

  // All guesses
  const guesses = await db.guess.findMany({
    where: { groupId: group.id, participantId: { in: ids } },
  })

  // Build map: participantId -> realName (the answer key)
  const realNameById = new Map<string, string>(participants.map((p) => [p.id, p.realName]))
  // Build map: participantId -> alias & avatar
  const aliasById = new Map<string, { alias: string; avatar: string }>(
    participants.map((p) => [p.id, { alias: p.alias, avatar: p.avatar }])
  )

  // For each guess, determine if it's correct (guessed participant's realName == target's realName).
  // Note: a participant cannot guess themselves (no self target), but a guess could be empty (null).
  // total = number of OTHER active participants (i.e., the targets the participant should have guessed)
  const total = participants.length - 1 // exclude self

  const correctByParticipant = new Map<string, number>()
  for (const g of guesses) {
    if (!g.guessedParticipantId) continue
    const targetRealName = realNameById.get(g.targetParticipantId)
    const guessedRealName = realNameById.get(g.guessedParticipantId)
    if (!targetRealName || !guessedRealName) continue
    if (targetRealName === guessedRealName) {
      correctByParticipant.set(
        g.participantId,
        (correctByParticipant.get(g.participantId) ?? 0) + 1
      )
    }
  }

  const rows: RankRow[] = participants.map((p) => {
    const correct = correctByParticipant.get(p.id) ?? 0
    const t = Math.max(total, 1)
    const percentage = Math.round((correct / t) * 100)
    return {
      participantId: p.id,
      alias: p.alias,
      avatar: p.avatar,
      correct,
      total,
      percentage,
      rank: 0,
    }
  })

  // Sort by correct desc, then percentage desc
  rows.sort((a, b) => {
    if (b.correct !== a.correct) return b.correct - a.correct
    return b.percentage - a.percentage
  })

  // Assign ranks. Ties share position.
  let prevCorrect: number | null = null
  let prevPercentage: number | null = null
  let prevRank = 0
  rows.forEach((r, idx) => {
    if (
      prevCorrect !== null &&
      prevCorrect === r.correct &&
      prevPercentage === r.percentage
    ) {
      r.rank = prevRank
    } else {
      r.rank = idx + 1
      prevRank = r.rank
      prevCorrect = r.correct
      prevPercentage = r.percentage
    }
  })

  return NextResponse.json({ ok: true, ranking: rows })
}
