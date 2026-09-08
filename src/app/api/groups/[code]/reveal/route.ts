import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  isRevealAvailable,
  getEffectiveGroupStatus,
  publicParticipant,
} from '@/lib/group-state'

interface RevealEntry {
  participant: ReturnType<typeof publicParticipant>
  realName: string
}

interface RevealResponse {
  ok: boolean
  reveal: boolean
  entries?: RevealEntry[]
}

/** GET /api/groups/[code]/reveal - returns reveal data only if available */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ code: string }> }
): Promise<NextResponse<RevealResponse>> {
  const { code } = await ctx.params
  const group = await db.group.findFirst({ where: { code } })
  if (!group) {
    return NextResponse.json(
      { ok: false, error: 'Grupo no encontrado', reveal: false },
      { status: 404 }
    )
  }
  const status = await getEffectiveGroupStatus(group)
  const reveal = await isRevealAvailable(group)
  if (!reveal) {
    return NextResponse.json({
      ok: true,
      reveal: false,
      status,
      presentationDate: group.presentationDate,
      presentationTime: group.presentationTime,
      timezone: group.timezone,
    })
  }
  const participants = await db.participant.findMany({
    where: { groupId: group.id, active: true },
    orderBy: { joinedAt: 'asc' },
  })
  const entries: RevealEntry[] = participants.map((p) => ({
    participant: publicParticipant(p),
    realName: p.realName,
  }))
  return NextResponse.json({
    ok: true,
    reveal: true,
    status,
    entries,
  })
}
