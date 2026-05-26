import { create } from 'zustand'

export interface CartItem {
  id: string
  productId: string
  name: string
  variantId: string
  variantName: string
  price: number
  quantity: number
  image: string
}

interface CartState {
  isOpen: boolean
  items: CartItem[]
  openCart: () => void
  closeCart: () => void
  addItem: (item: Omit<CartItem, 'id'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
}

// Stub data based on COMPONENTS.md design specs
const STUB_ITEMS: CartItem[] = [
  {
    id: 'item-1',
    productId: 'prod-tb-500',
    name: 'TB-500',
    variantId: 'v-5mg',
    variantName: '5MG',
    price: 80,
    quantity: 1,
    image: '/temp-products/tb-500.png'
  },
  {
    id: 'item-2',
    productId: 'prod-nad-plus',
    name: 'NAD+',
    variantId: 'v-500mg',
    variantName: '500MG',
    price: 150,
    quantity: 1,
    image: '/temp-products/product-image.png'
  }
]

export const useCartStore = create<CartState>((set) => ({
  isOpen: false,
  items: STUB_ITEMS,
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  addItem: (item) => set((state) => {
    // Combine quantities if the same variant exists
    const existingIndex = state.items.findIndex(i => i.variantId === item.variantId)
    if (existingIndex >= 0) {
      const newItems = [...state.items]
      newItems[existingIndex].quantity += item.quantity
      return { items: newItems, isOpen: true }
    }
    return { 
      items: [...state.items, { ...item, id: `item-${Date.now()}` }],
      isOpen: true 
    }
  }),
  removeItem: (id) => set((state) => ({
    items: state.items.filter(i => i.id !== id)
  })),
  updateQuantity: (id, quantity) => set((state) => ({
    items: state.items.map(i => i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i)
  }))
}))
