import { NextRequest, NextResponse } from 'next/server'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Early exit for API routes, admin routes, and static files
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.') // Skip files with extensions (images, etc.)
  ) {
    return NextResponse.next()
  }

  // 1. Get the session (Payload usually uses a cookie like 'payload-token')
  const token = request.cookies.get('payload-token')?.value

  // 2. Homepage and public pages are always accessible (logged in or not)
  // Allow homepage, register, and other public pages
  const publicPaths = ['/', '/register', '/employer/register', '/candidates', '/pricing', '/blog', '/about', '/contact']
  if (publicPaths.includes(pathname) || pathname.startsWith('/candidates/') || pathname.startsWith('/posts/')) {
    return NextResponse.next()
  }

  // 3. If the user is logged in and trying to access login/auth pages, redirect to dashboard
  if (token && (pathname === '/login' || pathname === '/forgot-password' || pathname === '/reset-password')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // 4. If the user is NOT logged in and trying to access a protected route
  if (!token && pathname.startsWith('/dashboard')) {
    // Store the original URL to redirect back after login
    const url = new URL('/login', request.url)
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }

  // 5. Otherwise, continue without redirecting
  return NextResponse.next()
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
     */
    '/((?!api|_next/static|_next/image|favicon.ico|admin).*)',
  ],
}
