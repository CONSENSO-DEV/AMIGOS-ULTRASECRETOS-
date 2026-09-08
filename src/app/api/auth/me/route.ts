import { NextRequest, NextResponse } from 'next/server'
import { getParticipantFromRequest } from '@/lib/session'
import { publicParticipant } from '@/lib/group-state'

export async function GET(req: NextRequest) {
  const auth = await getParticipantFromRequest(req)
  if (!auth) {
    return NextResponse.json({ ok: false, authenticated: false }, { status: 200 })
  }
  const { participant, group } = auth
  return NextResponse.json({
    ok: true,
    authenticated: true,
    groupCode: group.code,
    participant: publicParticipant(participant),
  })
}
