import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(req: Request) {
  const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET
  if (!CLERK_WEBHOOK_SECRET) throw new Error('CLERK_WEBHOOK_SECRET not set')

  const headerPayload = await headers()
  const svixId = headerPayload.get('svix-id')
  const svixTimestamp = headerPayload.get('svix-timestamp')
  const svixSignature = headerPayload.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Missing svix headers', { status: 400 })
  }

  const body = await req.text()
  const wh = new Webhook(CLERK_WEBHOOK_SECRET)

  let event: any
  try {
    event = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    })
  } catch {
    return new Response('Invalid signature', { status: 400 })
  }

  const payload = await getPayload({ config })

  switch (event.type) {
    case 'user.created': {
      const { id, email_addresses, first_name, last_name } = event.data
      const email = email_addresses[0]?.email_address

      // Check for existing user (idempotency)
      const existing = await payload.find({
        collection: 'users',
        where: { clerkUserId: { equals: id } },
      })
      if (existing.docs.length > 0) break

      await payload.create({
        collection: 'users',
        data: {
          clerkUserId: id,
          email,
          firstName: first_name ?? '',
          lastName: last_name ?? '',
          role: 'customer',
          emailVerified: true, // Clerk handles verification
          password: crypto.randomUUID() + crypto.randomUUID(),
        },
      })
      break
    }

    case 'user.updated': {
      const { id, email_addresses, first_name, last_name } = event.data
      const email = email_addresses[0]?.email_address

      const existing = await payload.find({
        collection: 'users',
        where: { clerkUserId: { equals: id } },
      })
      if (existing.docs.length === 0) break

      await payload.update({
        collection: 'users',
        id: existing.docs[0].id,
        data: { email, firstName: first_name ?? '', lastName: last_name ?? '' },
      })
      break
    }

    case 'user.deleted': {
      const { id } = event.data
      const existing = await payload.find({
        collection: 'users',
        where: { clerkUserId: { equals: id } },
      })
      if (existing.docs.length === 0) break

      await payload.delete({
        collection: 'users',
        id: existing.docs[0].id,
      })
      break
    }
  }

  return new Response('OK', { status: 200 })
}
