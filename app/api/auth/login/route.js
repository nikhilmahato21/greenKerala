import { cookies } from 'next/headers'
import { signJWT, tokenCookieOptions, verifyPassword } from '@/lib/auth'
import { getUserByEmail } from '@/lib/db'

export async function POST(request) {
  const { email, password } = await request.json()

  if (!email || !password) {
    return Response.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const user = await getUserByEmail(email)
  if (!user) {
    return Response.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const valid = await verifyPassword(password, user.password)
  if (!valid) {
    return Response.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const token = await signJWT({ email: user.email, role: user.role })
  const cookieStore = await cookies()
  const opts = tokenCookieOptions(token)
  cookieStore.set(opts.name, opts.value, opts)

  return Response.json({ ok: true })
}
