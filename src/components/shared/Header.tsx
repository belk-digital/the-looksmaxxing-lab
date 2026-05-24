import Link from 'next/link'
import { Heart, ShoppingCart, User } from 'lucide-react'
import { auth } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import configPromise from '@/payload.config'

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
    })
    
    const payloadUser = payloadUsers.docs[0]
    
    if (payloadUser) {
      const carts = await payload.find({
        collection: 'carts',
        where: { user: { equals: payloadUser.id } },
        limit: 1,
      })
      if (carts.docs[0]?.items) {
        cartItemCount = carts.docs[0].items.reduce((sum, item) => sum + (item.quantity || 1), 0)
      }
      
      const wishlists = await payload.find({
        collection: 'wishlists',
        where: { user: { equals: payloadUser.id } },
        limit: 1,
      })
      if (wishlists.docs[0]?.items) {
        wishlistItemCount = wishlists.docs[0].items.length
      }
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/40 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-xl font-extrabold tracking-tight text-transparent">
            Looksmaxxing Lab
          </span>
        </Link>
        
        <nav className="flex items-center gap-2 sm:gap-4">
          <Link 
            href="/wishlist" 
            className="group relative flex items-center justify-center rounded-full p-2.5 text-gray-300 transition-all duration-300 hover:bg-white/10 hover:text-pink-400"
            aria-label="Wishlist"
          >
            <Heart className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
            {wishlistItemCount > 0 && (
              <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-pink-500 text-[10px] font-bold text-white shadow-[0_0_8px_rgba(236,72,153,0.8)]">
                {wishlistItemCount > 99 ? '99+' : wishlistItemCount}
              </span>
            )}
          </Link>
          
          <Link 
            href="/checkout" 
            className="group relative flex items-center justify-center rounded-full p-2.5 text-gray-300 transition-all duration-300 hover:bg-white/10 hover:text-indigo-400"
            aria-label="Cart"
          >
            <ShoppingCart className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
            {cartItemCount > 0 ? (
              <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white shadow-[0_0_8px_rgba(99,102,241,0.8)]">
                {cartItemCount > 99 ? '99+' : cartItemCount}
              </span>
            ) : (
              <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-indigo-500/50"></span>
            )}
          </Link>
          
          <div className="mx-2 h-6 w-px bg-white/10"></div>
          
          <Link 
            href="/account" 
            className="group relative flex items-center justify-center rounded-full p-2.5 text-gray-300 transition-all duration-300 hover:bg-white/10 hover:text-white"
            aria-label="Profile"
          >
            <User className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
          </Link>
        </nav>
      </div>
    </header>
  )
}
