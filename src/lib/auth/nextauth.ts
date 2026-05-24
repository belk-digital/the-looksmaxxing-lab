// src/lib/auth/nextauth.ts

import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { payloadAdapter } from './payloadAdapter'
import type { NextAuthOptions } from 'next-auth'
import type { User } from '@/payload-types'

/**
 * NextAuth configuration that integrates with Payload CMS.
 * - Uses Google OAuth as an external provider.
 * - All users are stored in Payload's `users` collection.
 * - Email/password login is handled by Payload (see auth API utilities).
 */
export const authOptions: NextAuthOptions = {
  // Secret for signing JWTs – must match NEXTAUTH_SECRET env variable.
  secret: process.env.NEXTAUTH_SECRET,
  // URL of the app – required for callback URLs.
  pages: {
    signIn: '/login', // custom sign‑in page
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
    // Email/password flow will be handled manually via Payload API utilities.
  ],
  // Use httpOnly cookies – aligns with Payload's auth strategy.
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    /** Attach the Payload user id to the JWT token */
    async jwt({ token, user, account, profile }) {
      if (account?.provider === 'google') {
        // Google sign‑in – ensure we have a Payload user.
        const email = profile?.email as string
        let payloadUser = await payloadAdapter.getUserByEmail(email)
        if (!payloadUser) {
          // Create a new Payload user with Google details.
          payloadUser = await payloadAdapter.createUser({
            email,
            firstName: profile?.given_name ?? '',
            lastName: profile?.family_name ?? '',
            provider: 'google',
            googleId: profile?.sub,
            emailVerified: true,
          } as Partial<User>)
        }
        // Store the Payload user id in the JWT token.
        token.sub = (payloadUser as any).id
      } else if (user) {
        // When using Payload's native login utilities we set the id manually.
        token.sub = (user as any).id
      }
      return token
    },
    /** Make the user data available in `session` */
    async session({ session, token }) {
      if (token?.sub) {
        // Fetch the full user from Payload for the session.
        const payloadUser = await payloadAdapter.getUser(token.sub as string)
        session.user = {
          ...session.user,
          id: token.sub as string,
          email: (payloadUser as any).email,
          name: `${(payloadUser as any).firstName} ${(payloadUser as any).lastName}`.trim(),
          image: (payloadUser as any).avatar,
          role: (payloadUser as any).role,
        } as any
      }
      return session
    },
    /** Called before sign‑in – can reject login if needed */
    async signIn({ account, profile }) {
      if (account?.provider === 'google') {
        // Allow all Google accounts – Payload user creation happens in jwt callback.
        return true
      }
      // For other providers (future) you could add extra checks.
      return true
    },
  },
  // Use httpOnly secure cookies – aligns with Payload auth.
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        // `secure` is automatically set in production when NEXTAUTH_URL is https.
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
}

/** Export the handler for the App Router */
export const handler = NextAuth(authOptions)

export default handler
