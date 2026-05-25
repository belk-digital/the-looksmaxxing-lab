import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getPayloadUser } from '@/lib/auth/getPayloadUser'
import { redirect } from 'next/navigation'
import { processCheckout } from '../actions'
import CheckoutSummary from './CheckoutSummary'

export const metadata = {
  title: 'Checkout | Test Store',
}

export default async function CheckoutPage() {
  const user = await getPayloadUser()
  // Allow guest checkout, no redirect needed

  const payload = await getPayload({ config: configPromise })
  
  // Get cart and default address
  let cart = null
  let defaultAddress = null
  if (user) {
    const carts = await payload.find({
      collection: 'carts',
      where: { user: { equals: user.id } },
      limit: 1,
      overrideAccess: true,
    })
    cart = carts.docs[0]

    const addresses = await payload.find({
      collection: 'addresses',
      where: { user: { equals: user.id }, isDefaultShipping: { equals: true } },
      limit: 1,
      overrideAccess: true,
    })
    defaultAddress = addresses.docs[0]
  } else {
    // Dummy cart for guest checkout testing
    cart = {
      items: [{ product: 1, quantity: 1 }] // Assuming product ID 1 exists
    }
  }

  // Get shipping zones
  const shippingZonesReq = await payload.find({
    collection: 'shippingzones',
    limit: 10,
    overrideAccess: true,
  })
  const shippingZones = shippingZonesReq.docs || []

  // Get active processing fees
  const processingFeesReq = await payload.find({
    collection: 'processing-fees',
    where: { isActive: { equals: true } },
    limit: 20,
    overrideAccess: true,
  })
  const processingFees = processingFeesReq.docs || []

  const hasItems = cart && cart.items && cart.items.length > 0
  
  let subtotal = 0
  if (hasItems) {
    for (const item of cart?.items || []) {
      // In a real app we'd fetch missing product details here or heavily populate the cart
      if (typeof item.product === 'object' && item.product !== null) {
        subtotal += (item.product.price || 0) * (item.quantity || 1)
      } else {
         const p = await payload.findByID({ collection: 'products', id: item.product as number })
         subtotal += (p.price || 0) * (item.quantity || 1)
      }
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 text-white">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Checkout</h1>
      
      {!hasItems ? (
        <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 p-4 rounded-md">
          Your cart is empty. <a href="/products" className="underline">Go add some products.</a>
        </div>
      ) : (
        <form action={async (formData) => { "use server"; await processCheckout(formData) }} className="space-y-8">
          
          {/* Order Summary */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h2 className="text-xl font-medium mb-4">Order Summary</h2>
            <div className="flex justify-between border-b border-white/10 pb-4 mb-4">
              <span>Subtotal</span>
              <span>${(subtotal / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-b border-white/10 pb-4 mb-4">
              <span>Shipping (Dummy Standard)</span>
              <span>$5.00</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Estimated Total (Before Coupon)</span>
              <span>${((subtotal + 500) / 100).toFixed(2)}</span>
            </div>
          </div>

          {/* Contact Information (Guest only) */}
          {!user && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h2 className="text-xl font-medium mb-4">Contact Information</h2>
              <div>
                <label htmlFor="guestEmail" className="block text-sm font-medium text-gray-300">Email Address (for order updates)</label>
                <input type="email" id="guestEmail" name="guestEmail" required className="mt-1 block w-full rounded-md border border-white/10 bg-gray-900 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
            </div>
          )}

          {/* Contact Info */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h2 className="text-xl font-medium mb-4">Contact Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-300">First Name</label>
                <input type="text" id="firstName" name="firstName" defaultValue={user?.firstName || ''} required className="mt-1 block w-full rounded-md border border-white/10 bg-gray-900 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-300">Last Name</label>
                <input type="text" id="lastName" name="lastName" defaultValue={user?.lastName || ''} required className="mt-1 block w-full rounded-md border border-white/10 bg-gray-900 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
              {user && (
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-300">Email Address (Read Only)</label>
                  <input type="text" disabled value={user.email} className="mt-1 block w-full rounded-md border-white/10 bg-white/5 px-3 py-2 text-gray-400 opacity-70" />
                </div>
              )}
              <div className="sm:col-span-2">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-300">Phone Number</label>
                <input type="tel" id="phone" name="phone" defaultValue={user?.phone || ''} required className="mt-1 block w-full rounded-md border border-white/10 bg-gray-900 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                {user && <p className="mt-1 text-xs text-gray-500">Will be saved to your profile</p>}
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h2 className="text-xl font-medium mb-4">Shipping Address</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="line1" className="block text-sm font-medium text-gray-300">Street Address</label>
                <input type="text" id="line1" name="line1" defaultValue={defaultAddress?.line1 || ''} required className="mt-1 block w-full rounded-md border border-white/10 bg-gray-900 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-300">City</label>
                <input type="text" id="city" name="city" defaultValue={defaultAddress?.city || ''} required className="mt-1 block w-full rounded-md border border-white/10 bg-gray-900 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-300">State / Province</label>
                <input type="text" id="state" name="state" defaultValue={defaultAddress?.state || ''} required className="mt-1 block w-full rounded-md border border-white/10 bg-gray-900 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div>
                <label htmlFor="postalCode" className="block text-sm font-medium text-gray-300">Postal Code</label>
                <input type="text" id="postalCode" name="postalCode" defaultValue={defaultAddress?.postalCode || ''} required className="mt-1 block w-full rounded-md border border-white/10 bg-gray-900 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-300">Country</label>
                <input type="text" id="country" name="country" defaultValue={defaultAddress?.country || 'USA'} required className="mt-1 block w-full rounded-md border border-white/10 bg-gray-900 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
            </div>
          </div>

          <CheckoutSummary subtotal={subtotal} shippingZones={shippingZones} processingFees={processingFees as any} />

          {/* Payment Method */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h2 className="text-xl font-medium mb-4">Dummy Payment Gateway</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <input id="payment-online" name="paymentMethod" type="radio" value="online" defaultChecked className="h-4 w-4 border-white/10 bg-gray-900 text-indigo-600 focus:ring-indigo-600 focus:ring-offset-gray-900" />
                <label htmlFor="payment-online" className="ml-3 block text-sm font-medium text-white">
                  Mock Online Payment (Marks Order as Paid)
                </label>
              </div>
              <div className="flex items-center">
                <input id="payment-cod" name="paymentMethod" type="radio" value="cod" className="h-4 w-4 border-white/10 bg-gray-900 text-indigo-600 focus:ring-indigo-600 focus:ring-offset-gray-900" />
                <label htmlFor="payment-cod" className="ml-3 block text-sm font-medium text-white">
                  Pay on Delivery (Marks Order as Unpaid)
                </label>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex justify-center rounded-md border border-transparent bg-indigo-600 px-8 py-4 text-lg font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors"
          >
            Place Dummy Order
          </button>
        </form>
      )}
    </div>
  )
}
