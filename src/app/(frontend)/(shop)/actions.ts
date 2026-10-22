'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getPayloadUser } from '@/lib/auth/getPayloadUser'
import { revalidatePath } from 'next/cache'
import { couponRuleForCart } from '@/lib/subscriptions/couponRules'

export async function addToCart(productId: string | number, quantity: number = 1, providedVariantSku?: string, providedPriceSnapshot?: number) {
  try {
    const user = await getPayloadUser()
    if (!user) return { success: false, error: 'Must be logged in to add to cart' }

    const payload = await getPayload({ config: configPromise })

    // Fetch product details to get variantSku and priceSnapshot
    const product = await payload.findByID({ collection: 'products', id: productId as any })
    if (!product) return { success: false, error: 'Product not found' }

    // Normalize the product ID to a number so relationship fields and comparisons work
    const numericProductId = Number(product.id)

    const variantSku = providedVariantSku || product.sku || (product.variants && product.variants[0]?.sku) || `${product.id}`
    const priceSnapshot = providedPriceSnapshot !== undefined ? providedPriceSnapshot : (typeof product.salePrice === 'number' ? product.salePrice : (typeof product.price === 'number' ? product.price : 0))

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

export async function addToWishlist(productId: string | number, providedVariantSku?: string, providedPriceSnapshot?: number) {
  try {
    const user = await getPayloadUser()
    if (!user) return { success: false, error: 'Must be logged in to add to wishlist' }

    const payload = await getPayload({ config: configPromise })

    // Fetch product details for SKU and price snapshot
    const product = await payload.findByID({ collection: 'products', id: productId as any })
    if (!product) return { success: false, error: 'Product not found' }

    // Normalize the product ID to a number so comparisons never fail due to type mismatch
    const numericProductId = Number(product.id)

    const variantSku = providedVariantSku || product.sku || (product.variants && product.variants[0]?.sku) || `${product.id}`;
    const priceSnapshot = providedPriceSnapshot !== undefined ? providedPriceSnapshot : (typeof product.salePrice === 'number' ? product.salePrice : (typeof product.price === 'number' ? product.price : 0));

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

async function findProductByRef(payload: any, ref: any) {
  try {
    return await payload.findByID({ collection: 'products', id: ref })
  } catch {
    // Some cart lines store the slug as the product id
    if (typeof ref === 'string' && ref) {
      const res = await payload.find({ collection: 'products', where: { slug: { equals: ref } }, limit: 1 })
      return res.docs[0] || null
    }
    return null
  }
}

async function calculateCartTotals(cartItems: any[], payload: any, coupon?: any) {
  let eligibleSubtotal = 0;
  let totalSubtotal = 0;

  for (const item of cartItems) {
    let product = item.product;
    if (typeof product !== 'object' || product === null) {
      product = await findProductByRef(payload, product);
      if (!product) {
        throw new Error('Some items in your cart are no longer available. Please remove them and try again.')
      }
    }
    const itemPrice = typeof item.priceSnapshot === 'number' 
      ? item.priceSnapshot 
      : (typeof product.salePrice === 'number' ? product.salePrice : (typeof product.price === 'number' ? product.price : 0));
    const itemQuantity = item.quantity || 1;
    const itemTotal = itemPrice * itemQuantity;
    totalSubtotal += itemTotal;

    if (coupon) {
      let eligible = true;
      if (coupon.excludeSaleItems && typeof product.salePrice === 'number' && product.salePrice > 0) {
        eligible = false;
      }

      // Check applicableProductTypes
      if (coupon.applicableProductTypes && coupon.applicableProductTypes !== 'all') {
        const isBulkBundle = typeof item.variantSku === 'string' && item.variantSku.includes(' - ');
        if (coupon.applicableProductTypes === 'normal_only' && isBulkBundle) {
          eligible = false;
        } else if (coupon.applicableProductTypes === 'bulk_only' && !isBulkBundle) {
          eligible = false;
        }
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
        const discountValueDollars = coupon.value / 100;
        discount = Math.min(discountValueDollars, eligibleSubtotal);
        description = `$${discountValueDollars.toFixed(2)} off eligible items`;
      } else if (coupon.type === 'free_shipping') {
        discount = 0;
        description = 'Free shipping';
      } else if (coupon.type === 'buy_one_get_one') {
        description = 'Buy one get one free';
      } else if (coupon.type === 'store_credit' && coupon.remainingBalance) {
        const remainingDollars = coupon.remainingBalance / 100;
        discount = Math.min(remainingDollars, eligibleSubtotal);
        description = `$${remainingDollars.toFixed(2)} store credit applied`;
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

/**
 * Checks a coupon code against a cart. On a subscription cart the coupon must be switched on for subscriptions
 * ("Can be used on subscriptions"); `options.recurringInvoice` re-checks it for a LATER invoice of a
 * subscription that was started with an "every order" coupon (expiry/usage limits no longer apply then:
 * the discount was promised when the customer subscribed).
 */
export async function verifyCoupon(couponCode: string, subtotal: number, clientCartItems?: any[], options: { recurringInvoice?: boolean } = {}) {
  try {
    const recurring = options.recurringInvoice === true
    const user = await getPayloadUser()

    if (!couponCode || !couponCode.trim()) return { valid: false, error: 'Please enter a coupon code' }

    const payload = await getPayload({ config: configPromise })
    const normalizedCode = couponCode.trim().toLowerCase()
    const coupons = await payload.find({
      collection: 'coupons',
      where: { code: { like: normalizedCode } },
      limit: 10,
      overrideAccess: true,
    })

    const coupon = coupons.docs.find((c: any) => String(c.code).toLowerCase() === normalizedCode)
    if (!coupon) return { valid: false, error: 'Coupon code not found' }

    // Check expiration
    if (!recurring && coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return { valid: false, error: 'This coupon has expired' }
    }

    // Check usage limit
    if (!recurring && coupon.usageLimit && (coupon.usageCount || 0) >= coupon.usageLimit) {
      return { valid: false, error: 'This coupon has reached its usage limit' }
    }

    // Verify actual items
    let cartItems: any[] = []
    if (clientCartItems && clientCartItems.length > 0) {
      cartItems = clientCartItems.map((item: any) => ({
        product: item.productId || item.product?.id || item.product,
        quantity: item.quantity || 1,
        priceSnapshot: item.priceSnapshot,
        variantSku: item.variantSku,
        planMonths: item.planMonths || null,
      }))
    } else if (user) {
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

    // Subscriptions: only coupons switched on for subscriptions may be used on a cart that holds a plan.
    const isSubscriptionCart = cartItems.some((i: any) => Number(i.planMonths) > 0)
    const rule = couponRuleForCart(coupon as any, { isSubscriptionCart, recurringInvoice: recurring })
    if (!rule.ok) return { valid: false, error: rule.error }

    const { discount, description, eligibleSubtotal, totalSubtotal } = await calculateCartTotals(cartItems, payload, coupon)

    // Check minimum spend (minSpend is in cents, totalSubtotal is in dollars)
    if (!recurring && coupon.minSpend && (totalSubtotal * 100) < coupon.minSpend) {
      return { valid: false, error: `Minimum spend of $${(coupon.minSpend / 100).toFixed(2)} required` }
    }

    // Block affiliates from using their own coupon code
    if (user && !recurring) {
      const affiliateRes = await payload.find({
        collection: 'affiliates',
        where: { couponCode: { equals: couponCode.trim().toUpperCase() } },
        limit: 1,
        overrideAccess: true,
      })
      const ownerAffiliate = affiliateRes.docs[0]
      if (ownerAffiliate) {
        const affiliateUserId = typeof ownerAffiliate.user === 'object' && ownerAffiliate.user !== null
          ? ownerAffiliate.user.id
          : ownerAffiliate.user
        if (String(affiliateUserId) === String(user.id)) {
          return { valid: false, error: 'You cannot use your own affiliate coupon code' }
        }
      }
    }

    // Check locked emails
    if (!recurring && coupon.lockedEmails && coupon.lockedEmails.length > 0) {
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
      // 'first_month' | 'every_month' on a subscription cart, null on a normal purchase
      subscriptionScope: rule.scope,
    }
  } catch (error: any) {
    return { valid: false, error: error.message || 'An unexpected error occurred' }
  }
}

export async function getShopProducts(params: {
  page?: number
  limit?: number
  categories?: string[]
  inStock?: boolean
  onSale?: boolean
  isBestSeller?: boolean
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
      const allCats = await payload.find({
        collection: 'categories',
        limit: 1000,
        depth: 0,
        overrideAccess: true,
      })
      
      const paramCatsLower = params.categories.map(c => c.toLowerCase())
      
      const matchedCats = allCats.docs.filter(c => 
        paramCatsLower.includes(c.name.toLowerCase()) || 
        (c.slug && paramCatsLower.includes(c.slug.toLowerCase()))
      )
      
      const catIds = matchedCats.map(c => c.id)
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

    if (params.isBestSeller) {
      where.and.push({ isBestSeller: { equals: true } })
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
    if (params.sort === 'name-asc') sortParam = 'name'

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
      let hoverImageUrl: string | undefined = undefined

      if (doc.images && doc.images.length > 0) {
        if (typeof doc.images[0].image === 'object' && doc.images[0].image !== null) {
          imageUrl = (doc.images[0].image as any).url || imageUrl
        }
        if (doc.images.length > 1 && typeof doc.images[1].image === 'object' && doc.images[1].image !== null) {
          hoverImageUrl = (doc.images[1].image as any).url
        }
      }

      let categoryName = 'Research'
      if (doc.categories && doc.categories.length > 0 && typeof doc.categories[0] === 'object') {
        categoryName = (doc.categories[0] as any).name || categoryName
      }


      let displayPrice = typeof doc.price === 'number' ? doc.price : 0
      let displaySalePrice = typeof doc.salePrice === 'number' && doc.salePrice > 0 ? doc.salePrice : undefined
      let isFrom = false

      if (doc.hasVariants && doc.variants && doc.variants.length > 0) {
        const prices = doc.variants.map((v: any) => typeof v.salePrice === 'number' && v.salePrice > 0 ? v.salePrice : v.price).filter(Boolean)
        if (prices.length > 0) {
          const minVariantPrice = Math.min(...prices)
          // If the variants have different prices, we can add "From " prefix
          const maxVariantPrice = Math.max(...prices)
          if (minVariantPrice !== maxVariantPrice) {
            isFrom = true
          }
          displayPrice = minVariantPrice
          
          // Try to find the original price of the cheapest variant to show the discount
          const cheapestVariant = doc.variants.find((v: any) => (v.salePrice || v.price) === minVariantPrice)
          if (cheapestVariant && typeof cheapestVariant.salePrice === 'number' && cheapestVariant.salePrice > 0) {
             displaySalePrice = cheapestVariant.salePrice
             displayPrice = cheapestVariant.price
          } else {
             displaySalePrice = undefined
          }
        }
      }

      const variantCount = doc.hasVariants && doc.variants ? doc.variants.length : 0
      const firstVariantName = doc.hasVariants && doc.variants && doc.variants.length > 0
        ? doc.variants[0].options?.map((o: any) => o.value).join(' ') || null
        : null
      const firstVariantSku = doc.hasVariants && doc.variants && doc.variants.length > 0
        ? doc.variants[0].sku
        : null

      return {
        id: doc.id as number,
        name: doc.name,
        slug: doc.slug || '',
        image: imageUrl,
        hoverImage: hoverImageUrl,
        shortDescription: doc.description || '',
        priceRange: displaySalePrice
          ? `${isFrom ? 'From ' : ''}$${displaySalePrice.toFixed(2)}`
          : `${isFrom ? 'From ' : ''}$${displayPrice.toFixed(2)}`,
        originalPrice: (displaySalePrice && !isFrom)
          ? `$${displayPrice.toFixed(2)}`
          : undefined,
        discountPercentage: (displaySalePrice && displayPrice > 0)
          ? Math.round(((displayPrice - displaySalePrice) / displayPrice) * 100)
          : undefined,
        category: categoryName,
        hasVariants: doc.hasVariants || false,
        variantCount,
        firstVariantName,
        firstVariantSku,
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

export async function getUserDefaultAddress() {
  try {
    const user = await getPayloadUser()
    if (!user) return null

    const payload = await getPayload({ config: configPromise })
    const addresses = await payload.find({
      collection: 'addresses',
      where: { 
        user: { equals: user.id },
        isDefaultShipping: { equals: true }
      },
      limit: 1,
      overrideAccess: true,
    })

    if (addresses.docs.length > 0) {
      return addresses.docs[0]
    }

    const anyAddress = await payload.find({
      collection: 'addresses',
      where: { user: { equals: user.id } },
      limit: 1,
      overrideAccess: true,
    })

    return anyAddress.docs.length > 0 ? anyAddress.docs[0] : null
  } catch (err) {
    return null
  }
}

export async function getUserMaxxPoints() {
  try {
    const user = await getPayloadUser()
    if (!user) return 0

    const payload = await getPayload({ config: configPromise })
    const payloadUser = await payload.findByID({
      collection: 'users',
      id: user.id as any,
    })

    return typeof payloadUser?.maxxPoints === 'number' ? payloadUser.maxxPoints : 0
  } catch (err) {
    return 0
  }
}

export async function syncGuestOrdersToUser(payload: any, user: any) {
  try {
    const guestOrders = await payload.find({
      collection: 'orders',
      where: {
        and: [
          { guestEmail: { equals: user.email } },
          { owner: { exists: false } }
        ]
      },
      limit: 100,
      overrideAccess: true,
    });

    for (const order of guestOrders.docs) {
      // 1. Save Address if it exists
      if (order.shippingAddress && order.shippingAddress.line1) {
        const existingAddr = await payload.find({
          collection: 'addresses',
          where: {
            and: [
              { user: { equals: user.id } },
              { line1: { equals: order.shippingAddress.line1 } },
              { postalCode: { equals: order.shippingAddress.postalCode } }
            ]
          },
          limit: 1,
          overrideAccess: true,
        });

        if (existingAddr.docs.length === 0) {
          await payload.create({
            collection: 'addresses',
            data: {
              user: user.id,
              label: 'Imported Address',
              firstName: order.customerFirstName || 'Customer',
              lastName: order.customerLastName || 'User',
              line1: order.shippingAddress.line1,
              line2: order.shippingAddress.line2 || '',
              city: order.shippingAddress.city || '',
              state: order.shippingAddress.state || '',
              postalCode: order.shippingAddress.postalCode || '',
              country: order.shippingAddress.country || 'US',
              phone: order.customerPhone || '',
              isDefaultShipping: false,
            },
            overrideAccess: true,
          });
        }
      }

      // 2. Claim Order
      await payload.update({
        collection: 'orders',
        id: order.id,
        data: { owner: user.id },
        overrideAccess: true,
      });
    }
  } catch (e) {
    console.error('Failed to sync guest orders', e);
  }
}

export async function getUserAddresses() {
  try {
    const user = await getPayloadUser()
    if (!user) return []

    const payload = await getPayload({ config: configPromise })
    
    // Auto-claim any unowned guest orders and import their addresses
    await syncGuestOrdersToUser(payload, user)

    const addresses = await payload.find({
      collection: 'addresses',
      where: { user: { equals: user.id } },
      limit: 50,
      overrideAccess: true,
    })

    return addresses.docs || []
  } catch (err) {
    return []
  }
}
