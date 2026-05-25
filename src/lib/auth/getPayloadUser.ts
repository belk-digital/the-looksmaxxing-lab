import { auth, currentUser } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { User } from '@/payload-types'
import { cache } from 'react'

export const getPayloadUser = cache(async (): Promise<User | null> => {
  const { userId } = await auth()
  if (!userId) return null

  const payload = await getPayload({ config })

  // 1. Try to find user by clerkUserId
  const existingUsers = await payload.find({
    collection: 'users',
    where: { clerkUserId: { equals: userId } },
    limit: 1,
    overrideAccess: true,
  })

  let user = existingUsers.docs[0] as User | undefined

  if (!user) {
    // 2. If not found, try to find by email
    const clerkUser = await currentUser()
    const email = clerkUser?.emailAddresses[0]?.emailAddress
    if (!email) return null

    const existingByEmail = await payload.find({
      collection: 'users',
      where: { email: { equals: email } },
      limit: 1,
      overrideAccess: true,
    })
    
    if (existingByEmail.docs.length > 0) {
      // Link existing Payload user to Clerk ID
      try {
        user = (await payload.update({
          collection: 'users',
          id: existingByEmail.docs[0].id,
          data: { clerkUserId: userId } as any,
          overrideAccess: true,
        })) as User
      } catch (err) {
        // Handle race condition
        const retry = await payload.find({ collection: 'users', where: { clerkUserId: { equals: userId } }, limit: 1, overrideAccess: true })
        user = retry.docs[0] as User | undefined
      }
    } else {
      // Create new Payload user
      try {
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
      } catch (err) {
        // Handle race condition: another parallel component might have just created it
        const retry = await payload.find({ collection: 'users', where: { clerkUserId: { equals: userId } }, limit: 1, overrideAccess: true })
        user = retry.docs[0] as User | undefined
      }
    }
  }

  return user || null
})
