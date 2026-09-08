import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getParticipantFromRequest } from '@/lib/session'
import {
  isRevealAvailable,
  publicParticipant,
  getEffectiveGroupStatus,
} from '@/lib/group-state'

/**
 * GET /api/groups/[code]/mine
 * Returns the calling participant's info plus, if reveal is available,
 * their personal score and a per-target breakdown.
 */
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

  const status = await getEffectiveGroupStatus(group)
  const reveal = await isRevealAvailable(group)
  const allParticipants = await db.participant.findMany({
    where: { groupId: group.id, active: true },
    orderBy: { joinedAt: 'asc' },
  })

  const baseResponse: any = {
    ok: true,
    status,
    reveal,
    self: publicParticipant(participant),
  }

  if (!reveal) {
    return NextResponse.json(baseResponse)
  }

  // After reveal, return personal results.
  const ownGuesses = await db.guess.findMany({
    where: { groupId: group.id, participantId: participant.id },
  })
  const answerKey = new Map<string, string>(
    allParticipants.map((p) => [p.id, p.realName])
  )
  const aliasById = new Map<string, { alias: string; avatar: string }>(
    allParticipants.map((p) => [p.id, { alias: p.alias, avatar: p.avatar }])
  )
  const total = allParticipants.length - 1 // exclude self
  let correct = 0
  const predictions = ownGuesses
    .map((g) => {
      const target = aliasById.get(g.targetParticipantId)
      const guessed = g.guessedParticipantId ? aliasById.get(g.guessedParticipantId) : null
      const targetReal = answerKey.get(g.targetParticipantId)
      const guessedReal = g.guessedParticipantId ? answerKey.get(g.guessedParticipantId) : null
      const isCorrect = !!(guessedReal && targetReal && guessedReal === targetReal)
      if (isCorrect) correct++
      return {
        target: target
          ? { id: g.targetParticipantId, alias: target.alias, avatar: target.avatar }
          : null,
        myAnswer: guessed
          ? { id: g.guessedParticipantId!, alias: guessed.alias, avatar: guessed.avatar }
          : null,
        realName: targetReal ?? null,
        correct: isCorrect,
      }
    })
    .filter((p) => p.target)

  // Get ranking to find this participant's position
  const rankingUrl = new URL(`/api/groups/${encodeURIComponent(code)}/ranking`, req.url)
  const rankResponse = await fetch(rankingUrl, { headers: { cookie: req.headers.get('cookie') ?? '' } })
  let rank: number | null = null
  let totalRanked = 0
  if (rankResponse.ok) {
    const rankData = await rankResponse.json()
    const me = rankData.ranking?.find((r: any) => r.participantId === participant.id)
    if (me) rank = me.rank
    totalRanked = rankData.ranking?.length ?? 0
  }

  return NextResponse.json({
    ...baseResponse,
    score: {
      correct,
      total,
      percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
      rank,
      totalRanked,
    },
    predictions,
  })
}
