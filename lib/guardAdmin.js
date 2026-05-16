import { cookies } from 'next/headers'
import { verifyJWT, COOKIE_NAME } from '@/lib/auth'

export async function guardAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return false
  try {
    await verifyJWT(token)
    return true
  } catch {
    return false
  }
}
