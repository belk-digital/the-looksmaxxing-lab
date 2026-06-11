'use server'

import { auth } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import configPromise from '@/payload.config'
import { CartLine } from '@/lib/cart/store'

export async function syncCartToPayload(items: CartLine[]) {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: 'Not authenticated' }

    const payload = await getPayload({ config: configPromise })

    const payloadUsers = await payload.find({
      collection: 'users',
      req: { payload } as any,
      where: { clerkUserId: { equals: userId } },
      limit: 1,
      overrideAccess: true,
    })

    const payloadUser = payloadUsers.docs[0]
    if (!payloadUser) return { success: false, error: 'User not found' }

    const carts = await payload.find({
      collection: 'carts',
      req: { payload } as any,
      where: { user: { equals: payloadUser.id } },
      limit: 1,
      overrideAccess: true,
    })

    const mappedItems = items.map(item => ({
      product: (!isNaN(Number(item.productId)) ? Number(item.productId) : item.productId) as any,
      variantSku: item.variantSku || 'default',
      quantity: item.quantity,
      priceSnapshot: item.priceSnapshot,
      addedAt: new Date().toISOString(),
    }))

    let cart = carts.docs[0]

    if (!cart) {
      if (mappedItems.length === 0) return { success: true }
      
      // Create new cart
      await payload.create({
        collection: 'carts',
        req: { payload } as any,
        data: {
          user: payloadUser.id,
          // @ts-ignore
          items: mappedItems
        },
        overrideAccess: true,
      })
      return { success: true }
    }

    if (mappedItems.length === 0) {
      await payload.delete({
        collection: 'carts',
        id: cart.id,
        req: { payload } as any,
        overrideAccess: true,
      })
    } else {
      await payload.update({
        collection: 'carts',
        id: cart.id,
        req: { payload } as any,
        data: {
          // @ts-ignore
          items: mappedItems
        },
        overrideAccess: true,
      })
    }

    return { success: true }
  } catch (error) {
    console.error('Error syncing cart to payload:', error)
    return { success: false, error: 'Internal Server Error' }
  }
}
