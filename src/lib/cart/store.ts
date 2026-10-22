import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { toast } from 'sonner'
import { syncCartToPayload } from '@/app/(frontend)/actions/cart'

export type MinimalProduct = {
  id: string
  name: string
  slug?: string
  imageUrl: string | null
}

export type CartLine = {
  lineId: string
  productId: string
  variantSku: string | null
  variantTitle?: string | null
  quantity: number
  priceSnapshot: number
  product: MinimalProduct
  /** Set when this line is a subscription plan (an order every 1 / 3 / 6 months); priceSnapshot is then the discounted price of one order. */
  planMonths?: number | null
}

export type CartConflict = 'cart_has_one_time' | 'cart_has_plan' | 'different_plan_length'

/**
 * A subscription is checked out on its own: a cart holds either one-time items, or plan items that all share
 * the same plan length. Returns why adding this item would break that rule (or null if it is fine).
 */
export function cartConflict(items: CartLine[], planMonths?: number | null): CartConflict | null {
  if (items.length === 0) return null
  const incoming = planMonths || 0
  const existingPlans = new Set(items.map((i) => i.planMonths || 0))
  if (incoming === 0) return existingPlans.has(0) && existingPlans.size === 1 ? null : 'cart_has_plan'
  if (existingPlans.has(0)) return 'cart_has_one_time'
  return existingPlans.size === 1 && existingPlans.has(incoming) ? null : 'different_plan_length'
}

export const CART_CONFLICT_MESSAGE: Record<CartConflict, string> = {
  cart_has_one_time: 'Your cart has other items. A subscription is checked out on its own.',
  cart_has_plan: 'Your cart has a subscription. Subscriptions are checked out on their own.',
  different_plan_length: 'Your cart has a subscription with a different plan length. Subscriptions are checked out on their own.',
}

interface CartState {
  items: CartLine[]
  couponCode: string | null
  isOpen: boolean

  setItems: (items: CartLine[]) => void
  addItem: (
    product: MinimalProduct,
    variantSku: string | null,
    quantity: number,
    priceSnapshot: number,
    variantTitle?: string | null,
    planMonths?: number | null,
  ) => void
  removeItem: (lineId: string) => void
  updateQuantity: (lineId: string, quantity: number) => void
  clear: () => void
  setCoupon: (code: string | null) => void
  toggleDrawer: () => void
  openCart: () => void
  closeCart: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: null,
      isOpen: false,

      setItems: (items) => set({ items }),

      addItem: (product, variantSku, quantity, priceSnapshot, variantTitle, planMonths) => {
        set((state) => {
          // Hard guard: callers that don't pre-check (quick-add buttons, reorder...) can never create a mixed cart.
          const conflict = cartConflict(state.items, planMonths)
          if (conflict) {
            toast.error(CART_CONFLICT_MESSAGE[conflict], {
              description: 'Check out or clear your cart first, then add this item.',
            })
            return {}
          }

          const existingItemIndex = state.items.findIndex(
            (item) =>
              String(item.productId) === String(product.id) &&
              item.variantSku === variantSku &&
              (item.planMonths || 0) === (planMonths || 0),
          )

          if (existingItemIndex > -1) {
            const newItems = [...state.items]
            newItems[existingItemIndex].quantity += quantity
            newItems[existingItemIndex].priceSnapshot = priceSnapshot
            if (variantTitle) newItems[existingItemIndex].variantTitle = variantTitle
            syncCartToPayload(newItems).catch(console.error)
            return { items: newItems, isOpen: true }
          }

          const lineId =
            typeof crypto !== 'undefined' && crypto.randomUUID
              ? crypto.randomUUID()
              : Math.random().toString(36).substring(2, 15)

          const newItems = [
            ...state.items,
            {
              lineId,
              productId: product.id,
              variantSku,
              variantTitle: variantTitle || variantSku,
              quantity,
              priceSnapshot,
              product,
              planMonths: planMonths || null,
            },
          ]

          syncCartToPayload(newItems).catch(console.error)

          return {
            items: newItems,
            isOpen: true,
          }
        })
      },

      removeItem: (lineId) => {
        set((state) => {
          const newItems = state.items.filter((item) => item.lineId !== lineId)
          syncCartToPayload(newItems).catch(console.error)
          return { items: newItems }
        })
      },

      updateQuantity: (lineId, quantity) => {
        set((state) => {
          const newItems = state.items.map((item) =>
            item.lineId === lineId ? { ...item, quantity: Math.max(1, quantity) } : item,
          )
          syncCartToPayload(newItems).catch(console.error)
          return { items: newItems }
        })
      },

      clear: () => {
        set({ items: [], couponCode: null })
        syncCartToPayload([]).catch(console.error)
      },

      setCoupon: (code) => set({ couponCode: code }),

      toggleDrawer: () => set((state) => ({ isOpen: !state.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
    }),
    {
      name: 'longevia-cart-storage',
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
