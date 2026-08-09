import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { getPayload } from "payload"
import config from "@payload-config"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const payload = await getPayload({ config })
          
          // Use Payload's local API to authenticate the user
          const { user } = await payload.login({
            collection: "users",
            data: {
              email: credentials.email,
              password: credentials.password
            }
          })

          if (user) {
            return {
              id: user.id.toString(),
              email: user.email,
              name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || undefined,
              role: user.role || undefined,
            }
          }
          return null
        } catch (error) {
          console.error("Auth Error:", error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          const payload = await getPayload({ config })
          
          // Check if user exists in Payload
          const existingUsers = await payload.find({
            collection: 'users',
            where: { email: { equals: user.email } },
            limit: 1,
            overrideAccess: true,
          })

          if (existingUsers.docs.length === 0) {
            // Create the user in Payload if they don't exist
            const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10)
            
            const nameParts = (user.name || '').split(' ')
            const firstName = nameParts[0] || ''
            const lastName = nameParts.slice(1).join(' ') || ''
            
            const newUser = await payload.create({
              collection: 'users',
              data: {
                email: user.email!,
                password: randomPassword,
                firstName: firstName,
                lastName: lastName,
                role: 'customer'
              }
            })
            
            user.id = newUser.id.toString()
            ;(user as any).role = newUser.role
          } else {
            const existingUser = existingUsers.docs[0]
            user.id = existingUser.id.toString()
            ;(user as any).role = existingUser.role
          }
          
          return true
        } catch (error) {
          console.error("Error creating/fetching user during Google sign in:", error)
          return false
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
    newUser: '/register'
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
}
