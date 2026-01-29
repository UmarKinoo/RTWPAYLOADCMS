import { NextRequest, NextResponse } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

// Create next-intl middleware for locale routing
const intlMiddleware = createMiddleware(routing)

const locales = ['en', 'ar'] as const
const defaultLocale = 'en'

// Auth and route protection logic
async function handleAuth(request: NextRequest) {
  const { pathname } = request.nextUrl
  const searchParams = request.nextUrl.searchParams.toString()
  const queryString = searchParams ? `?${searchParams}` : ''

  // Early exit for API routes, admin routes, and static files
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/assets') || // Exclude assets folder from locale routing
    pathname.includes('.') // Skip files with extensions (images, etc.)
  ) {
    return null // Let it pass through
  }

  const pathSegments = pathname.split('/').filter(Boolean)
  const locale = pathSegments[0] as string

  // Only process if pathname has a valid locale
  if (!locales.includes(locale as any)) {
    return null // Let next-intl middleware handle locale routing
  }

  // 1. Get the session (Payload usually uses a cookie like 'payload-token')
  const token = request.cookies.get('payload-token')?.value

  // 2. Homepage and public pages are always accessible (logged in or not)
  // Allow homepage, register, and other public pages (with locale prefix)
  const publicPaths = [
    `/${locale}`,
    `/${locale}/register`,
    `/${locale}/employer/register`,
    `/${locale}/candidates`,
    `/${locale}/pricing`,
    `/${locale}/blog`,
    `/${locale}/about`,
    `/${locale}/contact`,
    `/${locale}/privacy-policy`,
    `/${locale}/terms-and-conditions`,
    `/${locale}/disclaimer`,
  ]
  if (
    publicPaths.includes(pathname) ||
    pathname.startsWith(`/${locale}/candidates/`) ||
    pathname.startsWith(`/${locale}/posts/`)
  ) {
    return null // Let it pass through
  }

  // 3. If the user is logged in and trying to access login/auth pages, redirect to dashboard
  // Exception: when error=logged-out we're in the "logged out elsewhere" flow — let them through to login
  const isLoggedOutFlow = pathname === `/${locale}/login` && request.nextUrl.searchParams.get('error') === 'logged-out'
  if (
    token &&
    !isLoggedOutFlow &&
    (pathname === `/${locale}/login` ||
      pathname === `/${locale}/forgot-password` ||
      pathname === `/${locale}/reset-password`)
  ) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard${queryString}`, request.url))
  }

  // 4. If the user is NOT logged in and trying to access a protected route
  if (!token && pathname.startsWith(`/${locale}/dashboard`)) {
    // Store the original URL to redirect back after login
    const url = new URL(`/${locale}/login`, request.url)
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }

  return null // Let it pass through
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // If assets are requested with locale prefix, redirect to remove it
  if (pathname.startsWith('/en/assets/') || pathname.startsWith('/ar/assets/')) {
    const assetPath = pathname.replace(/^\/(en|ar)\//, '/')
    return NextResponse.redirect(new URL(assetPath, request.url))
  }

  // Early exit for static assets - they should never have locale prefixes
  if (
    pathname.startsWith('/assets') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    (pathname.includes('.') && !pathname.startsWith('/en/') && !pathname.startsWith('/ar/'))
  ) {
    return NextResponse.next()
  }

  // First, handle auth logic
  const authResponse = await handleAuth(request)
  if (authResponse) {
    return authResponse
  }

  // Then, handle locale routing with next-intl
  return intlMiddleware(request)
}

// 5. Use the matcher to only run on specific routes that need authentication checks
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - admin (Payload admin panel)
     * - assets (static assets folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|admin|assets).*)',
  ],
}
