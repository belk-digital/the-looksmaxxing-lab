import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type MinimalProduct = {
  id: string
  name: string
  imageUrl: string | null
}

export type CartLine = {
  lineId: string
  productId: string
  variantSku: string | null
  quantity: number
  priceSnapshot: number
  product: MinimalProduct
}

interface CartState {
  items: CartLine[]
  couponCode: string | null
  isOpen: boolean

  addItem: (
    product: MinimalProduct,
    variantSku: string | null,
    quantity: number,
    priceSnapshot: number,
  ) => void
  removeItem: (lineId: string) => void
  updateQuantity: (lineId: string, quantity: number) => void
  clear: () => void
  setCoupon: (code: string | null) => void
  toggleDrawer: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: null,
      isOpen: false,

      addItem: (product, variantSku, quantity, priceSnapshot) => {
        set((state) => {
          const existingItemIndex = state.items.findIndex(
            (item) => item.productId === product.id && item.variantSku === variantSku,
          )

          if (existingItemIndex > -1) {
            const newItems = [...state.items]
            newItems[existingItemIndex].quantity += quantity
            // Update price snapshot to the latest when adding more
            newItems[existingItemIndex].priceSnapshot = priceSnapshot
            return { items: newItems, isOpen: true } // Auto open drawer on add
          }

          const lineId =
            typeof crypto !== 'undefined' && crypto.randomUUID
              ? crypto.randomUUID()
              : Math.random().toString(36).substring(2, 15)
          return {
            items: [
              ...state.items,
              {
                lineId,
                productId: product.id,
                variantSku,
                quantity,
                priceSnapshot,
                product,
              },
            ],
            isOpen: true, // Auto open drawer on add
          }
        })
      },

      removeItem: (lineId) => {
        set((state) => ({
          items: state.items.filter((item) => item.lineId !== lineId),
        }))
      },

      updateQuantity: (lineId, quantity) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.lineId === lineId ? { ...item, quantity: Math.max(1, quantity) } : item,
          ),
        }))
      },

      clear: () => set({ items: [], couponCode: null }),

      setCoupon: (code) => set({ couponCode: code }),

      toggleDrawer: () => set((state) => ({ isOpen: !state.isOpen })),
    }),
    {
      name: 'looksmaxxing-cart-storage',
    },
  ),
)

export const useCartSubtotal = () => {
  return useCartStore((state) =>
    state.items.reduce((total, item) => total + item.priceSnapshot * item.quantity, 0),
  )
}

export const useCartItemCount = () => {
  return useCartStore((state) => state.items.reduce((count, item) => count + item.quantity, 0))
}
