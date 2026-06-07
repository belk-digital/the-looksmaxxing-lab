import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { toggleWishlistInPayload } from '@/app/(frontend)/actions/wishlist'

export interface WishlistItem {
  id: string | number
  name: string
  slug: string
  image: string
  priceRange?: string
}

interface WishlistState {
  items: WishlistItem[]
  addItem: (item: WishlistItem) => void
  removeItem: (id: string | number) => void
  hasItem: (id: string | number) => boolean
  setItems: (items: WishlistItem[]) => void
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      setItems: (items) => set({ items }),
      addItem: (item) => {
        const currentItems = get().items
        if (!currentItems.find((i) => i.id === item.id)) {
          set({ items: [...currentItems, item] })
          // Fire and forget server sync
          toggleWishlistInPayload(item.id, true).catch(console.error)
        }
      },
      removeItem: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) })
        // Fire and forget server sync
        toggleWishlistInPayload(id, false).catch(console.error)
      },
      hasItem: (id) => get().items.some((i) => i.id === id)
    }),
    {
      name: 'wishlist-storage',
    }
  )
)
