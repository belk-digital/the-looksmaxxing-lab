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
  addItem: (item: WishlistItem) => Promise<void>
  removeItem: (id: string | number) => Promise<void>
  hasItem: (id: string | number) => boolean
  setItems: (items: WishlistItem[]) => void
}

const withTimeout = <T>(promise: Promise<T>, ms: number = 10000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Server action timed out after 10s')), ms))
  ])
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      setItems: (items) => set({ items }),
      addItem: async (item) => {
        const currentItems = get().items
        if (!currentItems.find((i) => String(i.id) === String(item.id))) {
          const res = await withTimeout(toggleWishlistInPayload(item.id, true))
          if (res && !res.success) throw new Error(res.error || 'Failed to sync with server')
          set({ items: [...get().items, item] })
        }
      },
      removeItem: async (id) => {
        const res = await withTimeout(toggleWishlistInPayload(id, false))
        if (res && !res.success) throw new Error(res.error || 'Failed to sync with server')
        set({ items: get().items.filter((i) => String(i.id) !== String(id)) })
      },
      hasItem: (id) => get().items.some((i) => String(i.id) === String(id))
    }),
    {
      name: 'wishlist-storage',
    }
  )
)
