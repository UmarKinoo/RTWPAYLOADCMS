/**
 * Route Handler: clear session cookies (payload-token, rtw-sid) and redirect.
 * Used when session is invalid (e.g. logged in elsewhere) so we can clear cookies
 * in a Route Handler (cookies cannot be modified in Server Components).
 */
import { NextRequest, NextResponse } from 'next/server'

const opts = {
  path: '/',
  maxAge: 0,
  expires: new Date(0),
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
}

export async function GET(request: NextRequest) {
  const next = request.nextUrl.searchParams.get('next') || '/'
  const res = NextResponse.redirect(new URL(next, request.url))
  res.cookies.set('payload-token', '', opts)
  res.cookies.set('rtw-sid', '', opts)
  return res
}
