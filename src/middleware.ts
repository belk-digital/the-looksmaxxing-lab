import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
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
