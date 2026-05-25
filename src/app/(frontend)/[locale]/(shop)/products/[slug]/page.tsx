import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { notFound, redirect } from 'next/navigation'
import { addToCart, addToWishlist } from '../../actions'
import { Heart, ShoppingCart, Zap } from 'lucide-react'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return { title: `${slug} | Test Store` }
}

export default async function ProductDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const payload = await getPayload({ config: configPromise })
  
  const result = await payload.find({
    collection: 'products',
    where: { slug: { equals: slug } },
    limit: 1,
  })

  const product = result.docs[0]
  if (!product) notFound()

  // Inline forms for Server Actions
  const handleAddToCart = async (formData: FormData) => {
    'use server'
    const productId = formData.get('productId') as string
    await addToCart(productId, 1)
  }

  const handleAddToWishlist = async (formData: FormData) => {
    'use server'
    const productId = formData.get('productId') as string
    await addToWishlist(productId)
  }

  const handleBuyNow = async (formData: FormData) => {
    'use server'
    const productId = formData.get('productId') as string
    await addToCart(productId, 1)
    redirect('/checkout')
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-8">
        
        {/* Mock Image */}
        <div className="aspect-w-1 aspect-h-1 w-full rounded-lg bg-gray-800 flex items-center justify-center">
           <span className="text-gray-500 text-2xl">Image Placeholder</span>
        </div>

        {/* Product Info */}
        <div className="mt-10 px-4 sm:px-0 lg:mt-0">
          <h1 className="text-3xl font-bold tracking-tight text-white">{product.name}</h1>
          <div className="mt-3">
            <h2 className="sr-only">Product information</h2>
            <p className="text-3xl tracking-tight text-white">
              ${((product.salePrice || product.price) / 100).toFixed(2)}
            </p>
            {product.salePrice && (
              <p className="text-sm text-gray-400 line-through">
                ${(product.price / 100).toFixed(2)}
              </p>
            )}
          </div>

          <div className="mt-6">
            <h3 className="sr-only">Description</h3>
            <div className="space-y-6 text-base text-gray-300">
              <p>{product.description || 'No description available for this product.'}</p>
            </div>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row sm:items-center gap-4">
            <form action={handleAddToCart} className="flex-1">
              <input type="hidden" name="productId" value={product.id} />
              <button
                type="submit"
                className="flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-8 py-3 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none"
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Add to Cart
              </button>
            </form>

            <form action={handleBuyNow} className="flex-1">
              <input type="hidden" name="productId" value={product.id} />
              <button
                type="submit"
                className="flex w-full items-center justify-center rounded-md border border-transparent bg-pink-600 px-8 py-3 text-base font-medium text-white hover:bg-pink-700 focus:outline-none"
              >
                <Zap className="mr-2 h-5 w-5" />
                Buy Now
              </button>
            </form>

            <form action={handleAddToWishlist}>
              <input type="hidden" name="productId" value={product.id} />
              <button
                type="submit"
                className="flex items-center justify-center rounded-md border border-white/10 bg-white/5 p-3 text-gray-400 hover:bg-white/10 hover:text-white focus:outline-none"
                title="Add to Wishlist"
              >
                <Heart className="h-6 w-6" />
                <span className="sr-only">Add to Wishlist</span>
              </button>
            </form>
          </div>
          
          {/* Bundle Information (if applicable) */}
          {product.isBundle && product.bundleItems && (
            <div className="mt-10 border-t border-white/10 pt-8">
              <h3 className="text-lg font-medium text-white">This Kit Includes:</h3>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-gray-300">
                {product.bundleItems.map((item: any, idx) => (
                  <li key={idx}>
                    {item.quantity}x {typeof item.product === 'object' ? item.product.name : `Product ID: ${item.product}`}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
        </div>
      </div>
    </div>
  )
}
