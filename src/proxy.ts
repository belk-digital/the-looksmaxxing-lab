import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

const intlMiddleware = createIntlMiddleware(routing)

const isProtectedRoute = createRouteMatcher([
  '/(.*)/account(.*)',
  '/account(.*)',
  '/(.*)/affiliates/dashboard(.*)',
  '/affiliates/dashboard(.*)',
])

const isAdminRoute = createRouteMatcher(['/admin(.*)'])

export default clerkMiddleware(async (auth, req) => {
  const path = req.nextUrl.pathname

  // Let Payload admin and API routes bypass next-intl
  if (isAdminRoute(req) || path.startsWith('/api')) {
    return NextResponse.next()
  }

  // Bypass next-intl for auth routes so it doesn't prefix them
  if (path.startsWith('/login') || path.startsWith('/register')) {
    return NextResponse.next()
  }

  // Protect customer routes
  if (isProtectedRoute(req)) {
    await auth.protect() // Redirects to sign-in if not logged in
  }

  // Run i18n middleware for frontend routes
  return intlMiddleware(req)
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
}
