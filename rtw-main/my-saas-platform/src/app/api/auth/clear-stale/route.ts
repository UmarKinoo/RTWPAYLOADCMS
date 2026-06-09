/**
 * Clear auth cookies when session is stale (logged in elsewhere).
 * Route Handlers can delete cookies; Server Components cannot during redirect.
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
  const next = request.nextUrl.searchParams.get('next') || '/login'
  const res = NextResponse.redirect(new URL(next, request.url))
  res.cookies.set('payload-token', '', opts)
  res.cookies.set('rtw-sid', '', opts)
  res.cookies.set('payload-token-candidates', '', opts)
  res.cookies.set('payload-token-employers', '', opts)
  return res
}
