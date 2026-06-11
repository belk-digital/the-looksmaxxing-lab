// src/hooks/users.ts
import type { CollectionBeforeChangeHook, CollectionAfterChangeHook } from 'payload'

/**
 * Lower‑case the email on create / update.
 */
export const beforeChangeEmailLowercase: CollectionBeforeChangeHook = async ({ data, originalDoc }) => {
  if (data.email) {
    data.email = (data.email as string).toLowerCase()
  }
  // Preserve existing email on updates if not changed
  if (!data.email && originalDoc?.email) {
    data.email = (originalDoc.email as string).toLowerCase()
  }
  return data
}

/**
 * Placeholder hook after a new user is created.
 * TODO: create Stripe customer + send welcome email.
 */
export const afterCreateUserTodo: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation === 'create') {
    console.log(
      `[TODO] After user creation – add Stripe customer & welcome email for user ${doc.id}`,
    )

    // Retroactive Order Binding
    if (doc.email) {
      setTimeout(() => {
        (async () => {
          try {
            const payload = req.payload
            const orders = await payload.find({
              collection: 'orders',
              where: {
                and: [
                  { guestEmail: { equals: doc.email.toLowerCase() } },
                  {
                    or: [
                      { owner: { exists: false } },
                      { owner: { equals: null } }
                    ]
                  }
                ]
              },
              overrideAccess: true,
              req,
              sort: '-createdAt',
            })
            
            if (orders.docs.length > 0) {
              // Bind all guest orders to this user
              await Promise.all(orders.docs.map(order => 
                payload.update({
                  collection: 'orders',
                  id: order.id,
                  data: {
                    owner: doc.id
                  },
                  overrideAccess: true,
                  req,
                })
              ))

              // Sync user details from the most recent guest order if the user profile is empty
              const recentOrder = orders.docs[0] as any
              if (!doc.firstName && !doc.lastName && recentOrder.customerFirstName) {
                let addressId = null
                
                // Create default address from the order's shipping address
                if (recentOrder.shippingAddress && recentOrder.shippingAddress.line1) {
                  const newAddress = await payload.create({
                    collection: 'addresses',
                    data: {
                      user: doc.id,
                      label: 'Default Shipping',
                      firstName: recentOrder.customerFirstName,
                      lastName: recentOrder.customerLastName || '',
                      line1: recentOrder.shippingAddress.line1,
                      line2: recentOrder.shippingAddress.line2 || '',
                      city: recentOrder.shippingAddress.city || '',
                      state: recentOrder.shippingAddress.state || '',
                      postalCode: recentOrder.shippingAddress.postalCode || '',
                      country: recentOrder.shippingAddress.country || '',
                      phone: recentOrder.customerPhone || '',
                      isDefaultShipping: true
                    },
                    overrideAccess: true,
                    req,
                  })
                  addressId = newAddress.id
                }

                // Update User Profile
                await payload.update({
                  collection: 'users',
                  id: doc.id,
                  data: {
                    firstName: recentOrder.customerFirstName,
                    lastName: recentOrder.customerLastName || '',
                    phone: recentOrder.customerPhone || '',
                    ...(addressId ? { defaultShippingAddress: addressId as any } : {})
                  },
                  overrideAccess: true,
                  req,
                })
              }
              console.log(`Retroactively bound ${orders.docs.length} guest orders to user ${doc.id}`)
            }
          } catch (err) {
            console.error('Error retroactively binding orders:', err)
          }
        })()
      }, 0)
    }
  }
}
