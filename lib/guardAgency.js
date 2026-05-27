import { cookies } from 'next/headers'
import { verifyJWT, AGENCY_COOKIE_NAME } from '@/lib/auth'

export async function guardAgency() {
  const cookieStore = await cookies()
  const token = cookieStore.get(AGENCY_COOKIE_NAME)?.value
  if (!token) return null
  try {
    const payload = await verifyJWT(token)
    if (payload.role !== 'agency') return null
    return payload
  } catch {
    return null
  }
}
