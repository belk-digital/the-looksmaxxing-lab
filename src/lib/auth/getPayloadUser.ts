import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { User } from '@/payload-types'
import { cache } from 'react'

export const getPayloadUser = cache(async (): Promise<User | null> => {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) return null

  const payload = await getPayload({ config })

  const existingUsers = await payload.find({
    collection: 'users',
    where: { email: { equals: session.user.email } },
    limit: 1,
    overrideAccess: true,
  })

  return (existingUsers.docs[0] as User) || null
})
