'use server'

import { getPayloadUser } from '@/lib/auth/getPayloadUser'
import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'

export async function addAddress(formData: FormData) {
  const user = await getPayloadUser()
  if (!user) throw new Error('Unauthorized')

  const payload = await getPayload({ config })

  const isDefault = formData.get('isDefault') === 'on'

  if (isDefault) {
    // If setting as default, unset other defaults first
    const existing = await payload.find({
      collection: 'addresses',
      where: { user: { equals: user.id } },
      overrideAccess: true,
    })

    for (const addr of existing.docs) {
      if (addr.isDefaultShipping) {
        await payload.update({
          collection: 'addresses',
          id: addr.id,
          data: { isDefaultShipping: false, isDefaultBilling: false },
          overrideAccess: true,
        })
      }
    }
  }

  await payload.create({
    collection: 'addresses',
    data: {
      user: user.id,
      label: formData.get('line1') as string,
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      line1: formData.get('line1') as string,
      line2: (formData.get('line2') as string) || undefined,
      city: formData.get('city') as string,
      state: formData.get('state') as string,
      postalCode: formData.get('zip') as string,
      country: 'US', // Hardcoded to US for this lab
      phone: formData.get('phone') as string,
      isDefaultShipping: isDefault,
      isDefaultBilling: isDefault,
    },
    overrideAccess: true,
  })

  revalidatePath('/account/addresses')
  revalidatePath('/account')
  return { success: true }
}

export async function deleteAddress(addressId: string) {
  const user = await getPayloadUser()
  if (!user) throw new Error('Unauthorized')

  const payload = await getPayload({ config })

  // Verify ownership
  const address = await payload.findByID({
    collection: 'addresses',
    id: addressId,
    overrideAccess: true,
  })

  if (typeof address.user === 'object' ? address.user.id !== user.id : address.user !== user.id) {
    throw new Error('Unauthorized')
  }

  await payload.delete({
    collection: 'addresses',
    id: addressId,
    overrideAccess: true,
  })

  revalidatePath('/account/addresses')
  revalidatePath('/account')
  return { success: true }
}

export async function updateAddress(addressId: string, formData: FormData) {
  const user = await getPayloadUser()
  if (!user) throw new Error('Unauthorized')

  const payload = await getPayload({ config })

  // Verify ownership
  const address = await payload.findByID({
    collection: 'addresses',
    id: addressId,
    overrideAccess: true,
  })

  if (typeof address.user === 'object' ? address.user.id !== user.id : address.user !== user.id) {
    throw new Error('Unauthorized')
  }

  const isDefault = formData.get('isDefault') === 'on'

  if (isDefault && !address.isDefaultShipping) {
    // If setting as default, unset other defaults first
    const existing = await payload.find({
      collection: 'addresses',
      where: { user: { equals: user.id } },
      overrideAccess: true,
    })

    for (const addr of existing.docs) {
      if (addr.isDefaultShipping && String(addr.id) !== String(addressId)) {
        await payload.update({
          collection: 'addresses',
          id: addr.id,
          data: { isDefaultShipping: false, isDefaultBilling: false },
          overrideAccess: true,
        })
      }
    }
  }

  await payload.update({
    collection: 'addresses',
    id: addressId,
    data: {
      label: formData.get('line1') as string,
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      line1: formData.get('line1') as string,
      line2: (formData.get('line2') as string) || undefined,
      city: formData.get('city') as string,
      state: formData.get('state') as string,
      postalCode: formData.get('zip') as string,
      country: 'US', // Hardcoded to US for this lab
      phone: formData.get('phone') as string,
      isDefaultShipping: isDefault,
      isDefaultBilling: isDefault,
    },
    overrideAccess: true,
  })

  revalidatePath('/account/addresses')
  revalidatePath('/account')
  return { success: true }
}
