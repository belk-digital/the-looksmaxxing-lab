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

export async function revalidateCartPrices(items: CartLine[]): Promise<CartLine[]> {
  try {
    const payload = await getPayload({ config: configPromise })
    const updatedItems = await Promise.all(items.map(async (item) => {
      try {
        const product = await payload.findByID({
          collection: 'products',
          id: (!isNaN(Number(item.productId)) ? Number(item.productId) : item.productId) as any,
          depth: 0,
        })
        if (!product) return item

        let livePrice = item.priceSnapshot

        // 1. Check Bulk Bundles
        if (product.bulkBundles && product.bulkBundles.length > 0) {
          const bundle = product.bulkBundles.find(b => b.name === item.variantSku)
          if (bundle) {
            const bPrice = typeof bundle.price === 'number' ? bundle.price : parseFloat(String(bundle.price).replace(/[^0-9.]/g, ''))
            const bSale = bundle.salePrice ? (typeof bundle.salePrice === 'number' ? bundle.salePrice : parseFloat(String(bundle.salePrice).replace(/[^0-9.]/g, ''))) : null
            livePrice = bSale || bPrice
            return { ...item, priceSnapshot: livePrice }
          }
        }

        // 2. Check Variants
        if (product.variants && product.variants.length > 0) {
          const variant = product.variants.find((v: any) => {
            const computedTitle = v.options?.map((o: any) => o.value).join(' ') || `Variant ${v.sku}`
            return computedTitle === item.variantSku || v.sku === item.variantSku
          })
          if (variant) {
            const vPrice = typeof variant.price === 'number' ? variant.price : parseFloat(String(variant.price).replace(/[^0-9.]/g, ''))
            const vSale = variant.salePrice ? (typeof variant.salePrice === 'number' ? variant.salePrice : parseFloat(String(variant.salePrice).replace(/[^0-9.]/g, ''))) : null
            livePrice = vSale || vPrice
            return { ...item, priceSnapshot: livePrice }
          }
        }

        // 3. Fallback to base product price
        const pPrice = typeof product.price === 'number' ? product.price : parseFloat(String(product.price).replace(/[^0-9.]/g, ''))
        const pSale = product.salePrice ? (typeof product.salePrice === 'number' ? product.salePrice : parseFloat(String(product.salePrice).replace(/[^0-9.]/g, ''))) : null
        livePrice = pSale || pPrice

        return { ...item, priceSnapshot: livePrice }
      } catch (err) {
        return item
      }
    }))
    
    return updatedItems
  } catch (error) {
    console.error('Error revalidating cart prices:', error)
    return items
  }
}

