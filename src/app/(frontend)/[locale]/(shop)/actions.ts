'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getPayloadUser } from '@/lib/auth/getPayloadUser'
import { revalidatePath } from 'next/cache'
import { attributeOrder } from '@/lib/affiliates/commission'
import { cookies } from 'next/headers'

export async function addToCart(productId: string | number, quantity: number = 1) {
  try {
    const user = await getPayloadUser()
    if (!user) return { success: false, error: 'Must be logged in to add to cart' }

    const payload = await getPayload({ config: configPromise })

    // Fetch product details to get variantSku and priceSnapshot
    const product = await payload.findByID({ collection: 'products', id: productId as any })
    if (!product) return { success: false, error: 'Product not found' }

    // Normalize the product ID to a number so relationship fields and comparisons work
    const numericProductId = Number(product.id)

    const variantSku = product.sku || (product.variants && product.variants[0]?.sku) || `${product.id}`
    const priceSnapshot = typeof product.salePrice === 'number' ? product.salePrice : (typeof product.price === 'number' ? product.price : 0)

    // Find existing cart — depth:0 so product comes back as raw ID
    const existingCarts = await payload.find({
      collection: 'carts',
      where: { user: { equals: user.id } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    let cart = existingCarts.docs[0]
    
    if (!cart) {
      cart = await payload.create({
        collection: 'carts',
        data: {
          user: user.id,
          items: [{
            product: numericProductId as any,
            variantSku,
            quantity,
            priceSnapshot,
            addedAt: new Date().toISOString(),
          }],
        },
        overrideAccess: true,
      })
    } else {
      const items = (cart.items || []).map((i: any) => ({
        product: Number(typeof i.product === 'object' ? i.product.id : i.product),
        variantSku: String(i.variantSku ?? ''),
        quantity: Number(i.quantity ?? 1),
        priceSnapshot: Number(i.priceSnapshot ?? 0),
      }))

      const existingItemIndex = items.findIndex((i) =>
        i.product === numericProductId && i.variantSku === variantSku
      )

      if (existingItemIndex > -1) {
        items[existingItemIndex].quantity += quantity
      } else {
        items.push({ product: numericProductId, quantity, variantSku, priceSnapshot })
      }

      cart = await payload.update({
        collection: 'carts',
        id: cart.id,
        data: { items: items as any },
        overrideAccess: true,
      })
    }

    revalidatePath('/products')
    revalidatePath('/cart')
    return { success: true, message: 'Added to cart' }
  } catch (error: any) {
    return { success: false, error: error.message || 'An unexpected error occurred' }
  }
}

export async function addToWishlist(productId: string | number) {
  try {
    const user = await getPayloadUser()
    if (!user) return { success: false, error: 'Must be logged in to add to wishlist' }

    const payload = await getPayload({ config: configPromise })

    // Fetch product details for SKU and price snapshot
    const product = await payload.findByID({ collection: 'products', id: productId as any })
    if (!product) return { success: false, error: 'Product not found' }

    // Normalize the product ID to a number so comparisons never fail due to type mismatch
    const numericProductId = Number(product.id)

    const variantSku = product.sku || (product.variants && product.variants[0]?.sku) || `${product.id}`;
    const priceSnapshot = typeof product.salePrice === 'number' ? product.salePrice : (typeof product.price === 'number' ? product.price : 0);

    // Find existing wishlist — use depth:0 so product fields come back as raw IDs, not populated objects
    const existingLists = await payload.find({
      collection: 'wishlists',
      where: { user: { equals: user.id } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    let list = existingLists.docs[0]

    if (!list) {
      // First wishlist for this user — create it
      list = await payload.create({
        collection: 'wishlists',
        data: {
          user: user.id,
          items: [{
            product: numericProductId as any,
            variantSku,
            quantity: 1,
            priceSnapshot,
            addedAt: new Date().toISOString(),
          }],
        },
        overrideAccess: true,
      })
    } else {
      const items: Array<{ product: number; variantSku: string; quantity: number; priceSnapshot: number; addedAt: string }> = (list.items || []).map((i: any) => ({
        product: Number(typeof i.product === 'object' ? i.product.id : i.product),
        variantSku: String(i.variantSku ?? ''),
        quantity: Number(i.quantity ?? 1),
        priceSnapshot: Number(i.priceSnapshot ?? 0),
        addedAt: i.addedAt ? String(i.addedAt) : new Date().toISOString(),
      }))

      // Check for duplicate using normalized numeric IDs
      const alreadyExists = items.some((i) => i.product === numericProductId)
      if (alreadyExists) {
        revalidatePath('/products')
        revalidatePath('/wishlist')
        return { success: false, error: 'Product is already in your wishlist' }
      }

      items.push({
        product: numericProductId,
        variantSku,
        quantity: 1,
        priceSnapshot,
        addedAt: new Date().toISOString(),
      })

      list = await payload.update({
        collection: 'wishlists',
        id: list.id,
        data: { items: items as any },
        overrideAccess: true,
      })
    }

    revalidatePath('/products')
    revalidatePath('/wishlist')
    return { success: true, message: 'Added to wishlist' }
  } catch (error: any) {
    return { success: false, error: error.message || 'An unexpected error occurred' }
  }
}

async function calculateCartTotals(cartItems: any[], payload: any, coupon?: any) {
  let eligibleSubtotal = 0;
  let totalSubtotal = 0;

  for (const item of cartItems) {
    let product = item.product;
    if (typeof product !== 'object' || product === null) {
      product = await payload.findByID({ collection: 'products', id: product as number });
    }
    const itemPrice = typeof product.salePrice === 'number' ? product.salePrice : (typeof product.price === 'number' ? product.price : 0);
    const itemQuantity = item.quantity || 1;
    const itemTotal = itemPrice * itemQuantity;
    totalSubtotal += itemTotal;

    if (coupon) {
      let eligible = true;
      if (coupon.excludeSaleItems && typeof product.salePrice === 'number' && product.salePrice > 0) {
        eligible = false;
      }
      if (eligible && coupon.appliesTo === 'specific_products') {
        const allowedProductIds = (coupon.products || []).map((p: any) => typeof p.product === 'object' ? p.product.id : p.product);
        if (!allowedProductIds.includes(product.id)) eligible = false;
      }
      if (eligible && coupon.appliesTo === 'specific_categories') {
        const allowedCategoryIds = (coupon.categories || []).map((c: any) => typeof c.category === 'object' ? c.category.id : c.category);
        const productCategoryIds = (product.categories || []).map((c: any) => typeof c === 'object' ? c.id : c);
        const hasIntersect = productCategoryIds.some((id: any) => allowedCategoryIds.includes(id));
        if (!hasIntersect) eligible = false;
      }
      if (eligible) eligibleSubtotal += itemTotal;
    }
  }

  let discount = 0;
  let description = '';
  
  if (coupon) {
    if (eligibleSubtotal > 0 || coupon.type === 'free_shipping') {
      if (coupon.type === 'percentage' && coupon.value) {
        discount = Math.floor(eligibleSubtotal * (coupon.value / 100));
        description = `${coupon.value}% off eligible items`;
      } else if (coupon.type === 'fixed_amount' && coupon.value) {
        discount = Math.min(coupon.value, eligibleSubtotal);
        description = `$${(coupon.value / 100).toFixed(2)} off eligible items`;
      } else if (coupon.type === 'free_shipping') {
        discount = 0;
        description = 'Free shipping';
      } else if (coupon.type === 'buy_one_get_one') {
        description = 'Buy one get one free';
      } else if (coupon.type === 'store_credit' && coupon.remainingBalance) {
        discount = Math.min(coupon.remainingBalance, eligibleSubtotal);
        description = `$${(coupon.remainingBalance / 100).toFixed(2)} store credit applied`;
      }
    } else {
      description = 'No eligible items for this coupon';
    }
  }

  let freeShipping = false;
  if (coupon && coupon.type === 'free_shipping') {
    freeShipping = true;
  }

  return { discount, description, eligibleSubtotal, totalSubtotal, freeShipping };
}

export async function verifyCoupon(couponCode: string, subtotal: number) {
  try {
    const user = await getPayloadUser()

    if (!couponCode || !couponCode.trim()) return { valid: false, error: 'Please enter a coupon code' }

    const payload = await getPayload({ config: configPromise })
    const coupons = await payload.find({
      collection: 'coupons',
      where: { code: { equals: couponCode.trim().toUpperCase() } },
      limit: 1,
      overrideAccess: true,
    })

    const coupon = coupons.docs[0]
    if (!coupon) return { valid: false, error: 'Coupon code not found' }

    // Check expiration
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return { valid: false, error: 'This coupon has expired' }
    }

    // Check usage limit
    if (coupon.usageLimit && (coupon.usageCount || 0) >= coupon.usageLimit) {
      return { valid: false, error: 'This coupon has reached its usage limit' }
    }

    // Verify actual items
    let cartItems: any[] = []
    if (user) {
      const carts = await payload.find({
        collection: 'carts',
        where: { user: { equals: user.id } },
        limit: 1,
        overrideAccess: true,
      })
      cartItems = carts.docs[0]?.items || []
    } else {
      // Dummy cart for guest testing
      cartItems = [{ product: 1, quantity: 1 }]
    }

    if (cartItems.length === 0) {
      return { valid: false, error: 'Cart is empty' }
    }

    const { discount, description, eligibleSubtotal, totalSubtotal } = await calculateCartTotals(cartItems, payload, coupon)

    // Check minimum spend
    if (coupon.minSpend && totalSubtotal < coupon.minSpend) {
      return { valid: false, error: `Minimum spend of $${(coupon.minSpend / 100).toFixed(2)} required` }
    }

    // Check locked emails
    if (coupon.lockedEmails && coupon.lockedEmails.length > 0) {
      if (!user) return { valid: false, error: 'You must log in to use this specific coupon' }
      const allowed = coupon.lockedEmails.some((e: any) => e.email === user.email)
      if (!allowed) return { valid: false, error: 'This coupon is not available for your account' }
    }

    if (eligibleSubtotal === 0 && coupon.type !== 'free_shipping') {
      return { valid: false, error: 'This coupon does not apply to any items in your cart' }
    }

    return {
      valid: true,
      code: coupon.code,
      discount,
      description,
      freeShipping: coupon.freeShipping || coupon.type === 'free_shipping',
    }
  } catch (error: any) {
    return { valid: false, error: error.message || 'An unexpected error occurred' }
  }
}

export async function processCheckout(formData: FormData) {
  try {
    const user = await getPayloadUser()
    const payload = await getPayload({ config: configPromise })

    let cartItems: any[] = []
    let cartId: any = null

    if (user) {
      const carts = await payload.find({
        collection: 'carts',
        where: { user: { equals: user.id } },
        limit: 1,
        overrideAccess: true,
      })
      if (carts.docs[0]?.items) {
        cartItems = carts.docs[0].items
        cartId = carts.docs[0].id
      }
    } else {
      const guestCartStr = formData.get('guestCart') as string
      if (guestCartStr) {
        try { cartItems = JSON.parse(guestCartStr) } catch(e) {}
      } else {
        cartItems = [{ product: 1, quantity: 1 }]
      }
    }

    if (cartItems.length === 0) {
      return { success: false, error: 'Cart is empty' }
    }

    const guestEmail = formData.get('guestEmail') as string
    if (!user && !guestEmail) {
      return { success: false, error: 'Email is required for guest checkout' }
    }

    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const phone = formData.get('phone') as string
    const addressLine1 = formData.get('line1') as string
    const city = formData.get('city') as string
    const state = formData.get('state') as string
    const postalCode = formData.get('postalCode') as string
    const country = formData.get('country') as string
    
    const couponCode = formData.get('couponCode') as string
    const paymentMethod = formData.get('paymentMethod') as string

    // Auto-save address and phone to user profile (ONLY if logged in)
    if (user) {
      let addressId = typeof user.defaultShippingAddress === 'object' ? user.defaultShippingAddress?.id : user.defaultShippingAddress;
      
      if (addressId) {
        await payload.update({
          collection: 'addresses',
          id: addressId as any,
          data: { firstName, lastName, line1: addressLine1, city, state, postalCode, country, phone },
          overrideAccess: true,
        })
      } else {
        const newAddress = await payload.create({
          collection: 'addresses',
          data: { user: user.id, label: 'Default Shipping', firstName: firstName || 'Customer', lastName: lastName || 'User', line1: addressLine1, city, state, postalCode, country, phone, isDefaultShipping: true },
          overrideAccess: true,
        })
        addressId = newAddress.id
      }

      await payload.update({
        collection: 'users',
        id: user.id,
        data: { firstName, lastName, phone, defaultShippingAddress: addressId as any },
        overrideAccess: true,
      })
    }

    let validCoupon = null
    if (couponCode) {
      const coupons = await payload.find({
        collection: 'coupons',
        where: { code: { equals: couponCode } },
        limit: 1,
      })
      validCoupon = coupons.docs[0]
    }

    const shippingMethodName = formData.get('shippingMethod') as string

    // Calculate totals
    const { discount: discountTotal, totalSubtotal: subtotal, freeShipping: couponFreeShipping } = await calculateCartTotals(cartItems, payload, validCoupon)

    // Validate shipping method against database
    const shippingZonesRes = await payload.find({
      collection: 'shippingzones',
      limit: 10,
      overrideAccess: true,
    })
    
    let baseShippingCost = 500 // fallback
    let validShippingMethodName = shippingMethodName || 'Standard Shipping'

    if (shippingMethodName) {
      for (const zone of shippingZonesRes.docs) {
        const found = zone.methods?.find((m: any) => m.method === shippingMethodName)
        if (found) {
          baseShippingCost = found.price
          validShippingMethodName = found.method
          break
        }
      }
    }

    // Determine final shipping cost
    const isFreeShipping = couponFreeShipping || validCoupon?.type === 'free_shipping' || validCoupon?.freeShipping
    const shippingTotal = isFreeShipping ? 0 : baseShippingCost

    const selectedFeeIds = formData.getAll('processingFees') as string[]
    let feeTotal = 0
    const appliedFees: any[] = []

    if (selectedFeeIds.length > 0) {
      const activeFeesRes = await payload.find({
        collection: 'processing-fees',
        where: {
          id: { in: selectedFeeIds },
          isActive: { equals: true }
        },
        overrideAccess: true,
      })

      for (const fee of activeFeesRes.docs) {
        const amount = fee.type === 'percentage' 
          ? Math.floor((subtotal * (fee.amount as number)) / 100) 
          : (fee.amount as number)
        
        feeTotal += amount
        appliedFees.push({
          feeId: fee.id,
          feeName: fee.name,
          amount
        })
      }
    }

    const taxTotal = 0
    const total = Math.max(0, subtotal - discountTotal) + shippingTotal + taxTotal + feeTotal

    // Create Order
    const order = await payload.create({
      collection: 'orders',
      data: {
        owner: user ? user.id : null,
        guestEmail: user ? user.email : guestEmail,
        customerFirstName: firstName,
        customerLastName: lastName,
        customerPhone: phone,
        status: 'pending',
        paymentStatus: paymentMethod === 'online' ? 'captured' : 'unpaid',
        fulfillmentStatus: 'unfulfilled',
        subtotal,
        discountTotal,
        shippingTotal,
        taxTotal,
        feeTotal,
        total,
        appliedFees,
        shippingMethod: validShippingMethodName,
        couponCode: validCoupon ? validCoupon.code : undefined,
        items: cartItems.map((item: any) => ({
          product: typeof item.product === 'object' ? item.product.id : item.product,
          quantity: item.quantity
        })) as any,
        shippingAddress: {
          line1: addressLine1,
          city,
          state,
          postalCode,
          country
        }
      },
      overrideAccess: true,
    })

    // Empty cart if logged in
    if (user && cartId) {
      await payload.update({
        collection: 'carts',
        id: cartId,
        data: { items: [] },
        overrideAccess: true,
      })
    }

    // Update coupon usage count and remaining balance
    if (validCoupon) {
      const updateData: any = {
        usageCount: (validCoupon.usageCount || 0) + 1,
      }
      
      if (validCoupon.type === 'store_credit' && typeof validCoupon.remainingBalance === 'number') {
        updateData.remainingBalance = Math.max(0, validCoupon.remainingBalance - discountTotal)
      }

      await payload.update({
        collection: 'coupons',
        id: validCoupon.id,
        data: updateData,
        overrideAccess: true,
      })
    }

    // Affiliate Attribution (Async)
    const cookieStore = cookies()
    const refCookie = (await cookieStore).get('affiliate_ref')
    const clickCookie = (await cookieStore).get('affiliate_click_id')
    
    if (refCookie?.value || clickCookie?.value || validCoupon) {
      attributeOrder(
        order as any,
        refCookie?.value || null,
        validCoupon ? validCoupon.code : null,
        clickCookie?.value || null
      ).catch(console.error)
    }

    revalidatePath('/checkout')
    return { success: true, orderId: order.id }
  } catch (error: any) {
    return { success: false, error: error.message || 'An unexpected error occurred' }
  }
}

export async function getShopProducts(params: {
  page?: number
  limit?: number
  categories?: string[]
  inStock?: boolean
  onSale?: boolean
  minPrice?: number
  maxPrice?: number
  sort?: string
}) {
  try {
    const payload = await getPayload({ config: configPromise })

    const where: any = {
      and: [
        { isVisible: { equals: true } },
        { status: { equals: 'active' } }
      ]
    }

    if (params.categories && params.categories.length > 0) {
      const cats = await payload.find({
        collection: 'categories',
        where: { name: { in: params.categories } }, // In FilterSidebar we filter by Category Name
        depth: 0,
        overrideAccess: true,
      })
      const catIds = cats.docs.map(c => c.id)
      if (catIds.length > 0) {
        where.and.push({ categories: { in: catIds } })
      } else {
        // If categories filter provided but none matched, return empty
        return { success: true, products: [], totalPages: 0, page: 1, hasNextPage: false }
      }
    }

    if (params.inStock) {
      where.and.push({ stock: { greater_than: 0 } })
    }

    if (params.onSale) {
      where.and.push({ salePrice: { greater_than: 0 } })
    }

    if (params.minPrice !== undefined || params.maxPrice !== undefined) {
      const priceQuery: any = {}
      if (params.minPrice !== undefined) priceQuery.greater_than_equal = params.minPrice
      if (params.maxPrice !== undefined) priceQuery.less_than_equal = params.maxPrice
      where.and.push({ price: priceQuery })
    }

    let sortParam = '-createdAt'
    if (params.sort === 'price-asc') sortParam = 'price'
    if (params.sort === 'price-desc') sortParam = '-price'
    if (params.sort === 'newest') sortParam = '-createdAt'

    const limit = params.limit || 24
    const page = params.page || 1

    const results = await payload.find({
      collection: 'products',
      where,
      limit,
      page,
      sort: sortParam,
      depth: 1, // Fetches media URLs and category names
      overrideAccess: true,
    })

    const uiProducts = results.docs.map(doc => {
      let imageUrl = '/temp-products/product-image.png'
      if (doc.images && doc.images.length > 0 && typeof doc.images[0].image === 'object' && doc.images[0].image !== null) {
        const imageDoc = doc.images[0].image as any
        imageUrl = imageDoc.url || imageUrl
      }

      let categoryName = 'Research'
      if (doc.categories && doc.categories.length > 0 && typeof doc.categories[0] === 'object') {
        categoryName = (doc.categories[0] as any).name || categoryName
      }

      return {
        id: doc.id as number,
        name: doc.name,
        slug: doc.slug || '',
        image: imageUrl,
        shortDescription: doc.description || '',
        priceRange: typeof doc.salePrice === 'number' && doc.salePrice > 0 
          ? `$${doc.salePrice}.00` 
          : `$${doc.price}.00`,
        category: categoryName
      }
    })

    return {
      success: true,
      products: uiProducts,
      totalPages: results.totalPages,
      page: results.page,
      hasNextPage: results.hasNextPage,
    }
  } catch (err: any) {
    return { success: false, error: err.message, products: [], totalPages: 0 }
  }
}
