import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { publicParticipant, canJoinGroup } from '@/lib/group-state'

/** GET /api/groups/[code]/participants - list public participants */
export async function GET(
  _req: NextRequest,
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
  const participants = await db.participant.findMany({
    where: { groupId: group.id, active: true },
    orderBy: { joinedAt: 'asc' },
  })
  return NextResponse.json({
    ok: true,
    participants: participants.map(publicParticipant),
  })
}
