import { ClientHeader } from './ClientHeader'

// Deliberately static: no cookies()/headers()/getServerSession() calls here.
// Login state and cart/wishlist hydration happen client-side in ClientHeader
// so this component (rendered on every page via the root layout) never
// forces the route into dynamic (uncached) rendering.
export function Header() {
  return <ClientHeader categories={[]} />
}
