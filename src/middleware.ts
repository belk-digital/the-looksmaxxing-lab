import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import { gateRestrictedPath } from "@/lib/access/restrictedProducts"

export default withAuth(
  function middleware(req) {
    // Members-only product pages (nasal sprays, GLP-3RTA, Tirzepatide, Semaglutide) are for logged-in customers only. This runs BEFORE a page is served, so the
    // cached copy of a spray page can never reach a logged-out visitor: they are sent to the login page and
    // brought back to the product afterwards.
    const decision = gateRestrictedPath({
      pathname: req.nextUrl.pathname,
      hasToken: Boolean(req.nextauth?.token),
    })
    if (decision.action === 'redirect') {
      const response = NextResponse.redirect(new URL(decision.to, req.url))
      // The answer depends on who is asking, so it must never be stored and reused for someone else.
      response.headers.set('Cache-Control', 'private, no-store')
      return response
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const path = req.nextUrl.pathname

        // Admin routes are not handled by NextAuth (handled by Payload config)
        if (path.startsWith('/admin')) {
          return true
        }

        // Protect specific frontend routes
        if (path.startsWith('/account') || path.startsWith('/affiliates/dashboard')) {
          return !!token
        }

        // Everything else goes through to the function above (which gates the members-only product pages).
        return true
      },
    },
    pages: {
      signIn: '/login',
    }
  }
)

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
}
