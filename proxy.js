import { NextResponse } from 'next/server'
import { verifyJWT, COOKIE_NAME } from '@/lib/auth'

export async function proxy(request) {
  const token = request.cookies.get(COOKIE_NAME)?.value

  if (!token) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  try {
    await verifyJWT(token)
    return NextResponse.next()
  } catch {
    const response = NextResponse.redirect(new URL('/admin', request.url))
    response.cookies.delete(COOKIE_NAME)
    return response
  }
}

export const config = {
  matcher: ['/admin/dashboard/:path*'],
}
