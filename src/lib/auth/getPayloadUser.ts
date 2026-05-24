import { auth, currentUser } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { User } from '@/payload-types'

export async function getPayloadUser(): Promise<User | null> {
  const { userId } = await auth()
  if (!userId) return null

  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'users',
    where: { clerkUserId: { equals: userId } },
    limit: 1,
    overrideAccess: true,
  })

  let user = result.docs[0] as User | undefined

  if (!user) {
    // Auto-sync: If webhook was missed, create/link Payload user on the fly
    const clerkUser = await currentUser()
    if (!clerkUser) return null
    
    const email = clerkUser.emailAddresses[0]?.emailAddress
    
    // Check if user exists by email first (e.g. seeded users)
    const existingByEmail = await payload.find({
      collection: 'users',
      where: { email: { equals: email } },
      limit: 1,
      overrideAccess: true,
    })
    
    if (existingByEmail.docs.length > 0) {
      // Link existing Payload user to Clerk ID
      user = (await payload.update({
        collection: 'users',
        id: existingByEmail.docs[0].id,
        data: { clerkUserId: userId } as any,
        overrideAccess: true,
      })) as User
    } else {
      // Create new Payload user
      user = (await payload.create({
        collection: 'users',
        data: {
          email,
          role: 'customer',
          clerkUserId: userId,
          password: Math.random().toString(36).slice(-8), // random password, auth handled by Clerk
        } as any,
        overrideAccess: true,
      })) as User
    }
  }

  return user
}
