import { NextRequest, NextResponse } from 'next/server'
import { getAdminFromRequest } from '@/lib/session'

export async function GET(req: NextRequest) {
  const auth = await getAdminFromRequest(req)
  if (!auth) {
    return NextResponse.json({ ok: false, authenticated: false }, { status: 200 })
  }
  const { group } = auth
  return NextResponse.json({
    ok: true,
    authenticated: true,
    groupCode: group.code,
    groupName: group.name,
  })
}
