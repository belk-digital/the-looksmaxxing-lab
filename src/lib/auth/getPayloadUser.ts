import { auth } from '@clerk/nextjs/server'
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
  })

  return (result.docs[0] as User) ?? null
}
