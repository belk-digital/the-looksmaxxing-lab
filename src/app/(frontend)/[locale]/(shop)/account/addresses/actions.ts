'use server'

import { getPayloadUser } from '@/lib/auth/getPayloadUser'
import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'

export async function addAddress(formData: FormData) {
  try {
    const user = await getPayloadUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const payload = await getPayload({ config })

    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const line1 = formData.get('line1') as string
    const city = formData.get('city') as string
    const state = formData.get('state') as string
    const zip = formData.get('zip') as string
    const phone = formData.get('phone') as string

    if (!firstName || !lastName || !line1 || !city || !state || !zip || !phone) {
      return { success: false, error: 'Please fill in all required fields' }
    }

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
        label: line1,
        firstName,
        lastName,
        line1,
        line2: (formData.get('line2') as string) || undefined,
        city,
        state,
        postalCode: zip,
        country: 'US', // Hardcoded to US for this lab
        phone,
        isDefaultShipping: isDefault,
        isDefaultBilling: isDefault,
      },
      overrideAccess: true,
    })

    revalidatePath('/account/addresses')
    revalidatePath('/account')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'An unexpected error occurred' }
  }
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
  try {
    const user = await getPayloadUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const payload = await getPayload({ config })

    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const line1 = formData.get('line1') as string
    const city = formData.get('city') as string
    const state = formData.get('state') as string
    const zip = formData.get('zip') as string
    const phone = formData.get('phone') as string

    if (!firstName || !lastName || !line1 || !city || !state || !zip || !phone) {
      return { success: false, error: 'Please fill in all required fields' }
    }

    // Verify ownership
    const address = await payload.findByID({
      collection: 'addresses',
      id: addressId,
      overrideAccess: true,
    })

    if (typeof address.user === 'object' ? address.user.id !== user.id : address.user !== user.id) {
      return { success: false, error: 'Unauthorized' }
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
        label: line1,
        firstName,
        lastName,
        line1,
        line2: (formData.get('line2') as string) || undefined,
        city,
        state,
        postalCode: zip,
        country: 'US', // Hardcoded to US for this lab
        phone,
        isDefaultShipping: isDefault,
        isDefaultBilling: isDefault,
      },
      overrideAccess: true,
    })

    revalidatePath('/account/addresses')
    revalidatePath('/account')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'An unexpected error occurred' }
  }
}
