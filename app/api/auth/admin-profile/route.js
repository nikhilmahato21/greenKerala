import { getAdminPayload } from '@/lib/guardAdmin'
import { updateAdminUsername } from '@/lib/db'
import { signJWT, tokenCookieOptions } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function GET() {
  const payload = await getAdminPayload()
  if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  return Response.json({ username: payload.username })
}

export async function PUT(request) {
  const payload = await getAdminPayload()
  if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { newUsername } = await request.json()
    if (!newUsername?.trim()) return Response.json({ error: 'Username is required' }, { status: 400 })
    if (newUsername.trim() === payload.username) return Response.json({ ok: true, username: payload.username })

    const updated = await updateAdminUsername(payload.username, newUsername.trim())
    if (!updated) return Response.json({ error: 'Failed to update username' }, { status: 500 })

    // Re-issue JWT with new username so session stays valid
    const newToken = await signJWT({ username: newUsername.trim(), role: payload.role })
    const cookieStore = await cookies()
    const opts = tokenCookieOptions(newToken)
    cookieStore.set(opts.name, opts.value, opts)

    return Response.json({ ok: true, username: newUsername.trim() })
  } catch {
    return Response.json({ error: 'Failed to update username' }, { status: 500 })
  }
}
