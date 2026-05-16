import { hashPassword } from '@/lib/auth'
import { createUser, getUserByEmail } from '@/lib/db'

export async function POST(request) {
  const { email, password } = await request.json()

  if (!email || !password) {
    return Response.json({ error: 'Email and password are required' }, { status: 400 })
  }

  if (password.length < 8) {
    return Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const existing = await getUserByEmail(email)
  if (existing) {
    return Response.json({ error: 'Email already registered' }, { status: 409 })
  }

  const hashed = await hashPassword(password)
  const user = await createUser(email, hashed)

  return Response.json({ ok: true, user: { id: user.id, email: user.email, role: user.role } }, { status: 201 })
}
