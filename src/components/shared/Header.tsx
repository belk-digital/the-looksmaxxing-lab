import Link from 'next/link'
import { Heart, ShoppingCart, User } from 'lucide-react'
import { auth } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import configPromise from '@/payload.config'
import { ClientHeader } from './ClientHeader'

export async function Header() {
  const { userId } = await auth()
  let cartItemCount = 0
  let wishlistItemCount = 0

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
        cartItemCount = carts.docs[0].items.reduce((sum, item) => sum + (item.quantity || 1), 0)
      }
      
      const wishlists = await payload.find({
        collection: 'wishlists',
        where: { user: { equals: payloadUser.id } },
        limit: 1,
        overrideAccess: true,
      })
      if (wishlists.docs[0]?.items) {
        wishlistItemCount = wishlists.docs[0].items.length
      }
    }
  }

  return <ClientHeader cartItemCount={cartItemCount} wishlistItemCount={wishlistItemCount} isLoggedIn={!!userId} />
}
