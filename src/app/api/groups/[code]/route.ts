import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { publicGroup, getEffectiveGroupStatus } from '@/lib/group-state'

/** GET /api/groups/[code] - public group info */
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
  const status = await getEffectiveGroupStatus(group)
  const participantCount = await db.participant.count({
    where: { groupId: group.id, active: true },
  })
  return NextResponse.json({
    ok: true,
    group: { ...publicGroup(group), status },
    participantCount,
  })
}
