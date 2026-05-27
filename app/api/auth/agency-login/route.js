import { NextResponse } from 'next/server'
import { getAgencyByEmail } from '@/lib/db'
import { verifyPassword, signJWT, agencyCookieOptions } from '@/lib/auth'

export async function POST(request) {
  const { email, password } = await request.json()
  if (!email || !password) {
    return Response.json({ error: 'Email and password are required' }, { status: 400 })
  }

  const agency = await getAgencyByEmail(email.trim().toLowerCase())
  if (!agency) {
    return Response.json({ error: 'Invalid credentials' }, { status: 401 })
  }
  if (agency.status !== 'approved') {
    return Response.json({ error: agency.status === 'pending' ? 'Your application is still under review' : 'Your agency account has been rejected' }, { status: 403 })
  }

  const valid = await verifyPassword(password, agency.password)
  if (!valid) {
    return Response.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const token = await signJWT({ role: 'agency', agencyId: agency.id, agencyName: agency.name })
  const res = NextResponse.json({ ok: true, name: agency.name })
  res.cookies.set(agencyCookieOptions(token))
  return res
}
