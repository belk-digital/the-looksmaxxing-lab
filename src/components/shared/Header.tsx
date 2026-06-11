import Link from 'next/link'
import { Heart, ShoppingCart, User } from 'lucide-react'
import { auth } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import configPromise from '@/payload.config'
import { ClientHeader } from './ClientHeader'

export async function Header() {
  try {
    const { userId } = await auth()
    let cartItemCount = 0
    let wishlistItemCount = 0
    let initialWishlistItems: any[] = []
    let initialCartItems: any[] = []

    if (userId) {
      const payload = await getPayload({ config: configPromise })
      
      const payloadUsers = await payload.find({
        collection: 'users',
        where: { clerkUserId: { equals: userId } },
        limit: 1,
        overrideAccess: true,
      })
      
      const payloadUser = payloadUsers.docs[0]
      
      if (payloadUser) {
        const carts = await payload.find({
          collection: 'carts',
          where: { user: { equals: payloadUser.id } },
          limit: 1,
          overrideAccess: true,
        })
        if (carts.docs[0]?.items) {
          cartItemCount = carts.docs[0].items.reduce((sum: any, item: any) => sum + (item.quantity || 1), 0)
          initialCartItems = carts.docs[0].items.map((item: any) => {
            const prod = item.product || {}
            return {
              lineId: item.id || Math.random().toString(36).substring(2, 15),
              productId: String(prod.id || item.product),
              variantSku: item.variantSku || 'default',
              quantity: item.quantity || 1,
              priceSnapshot: item.priceSnapshot || 0,
              product: {
                id: String(prod.id || item.product),
                name: prod.name || '',
                imageUrl: prod.images?.[0]?.image?.url || null,
              }
            }
          })
        }
        
        const wishlists = await payload.find({
          collection: 'wishlists',
          where: { user: { equals: payloadUser.id } },
          limit: 1,
          overrideAccess: true,
        })
        if (wishlists.docs[0]?.items) {
          wishlistItemCount = wishlists.docs[0].items.length
          initialWishlistItems = wishlists.docs[0].items.map((item: any) => {
            const prod = item.product || {}
            return {
              id: prod.id || item.product,
              name: prod.name || '',
              slug: prod.slug || '',
              image: prod.images?.[0]?.image?.url || '',
              priceRange: prod.price ? `$${prod.price}` : '',
              descriptor: prod.descriptor || '',
              price: prod.price ? `$${prod.price}` : '',
            }
          })
        }
      }
    }

    return <ClientHeader cartItemCount={cartItemCount} wishlistItemCount={wishlistItemCount} isLoggedIn={!!userId} categories={[]} initialWishlistItems={initialWishlistItems} initialCartItems={initialCartItems} />
  } catch (error) {
    console.error('Error in Header Server Component:', error);
    return <ClientHeader cartItemCount={0} wishlistItemCount={0} isLoggedIn={false} categories={[]} initialWishlistItems={[]} initialCartItems={[]} />
  }
}
