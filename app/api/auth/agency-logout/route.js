import { NextResponse } from 'next/server'
import { clearAgencyCookieOptions } from '@/lib/auth'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(clearAgencyCookieOptions())
  return res
}
