'use server'

import { getPayloadUser } from '@/lib/auth/getPayloadUser'
import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
  const user = await getPayloadUser()
  if (!user) throw new Error('Unauthorized')

  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string
  const phone = formData.get('phone') as string

  const payload = await getPayload({ config })

  await payload.update({
    collection: 'users',
    id: user.id,
    data: {
      firstName,
      lastName,
      phone,
    } as any,
    overrideAccess: true,
  })

  revalidatePath('/account/settings')
  revalidatePath('/account')
  return { success: true }
}
