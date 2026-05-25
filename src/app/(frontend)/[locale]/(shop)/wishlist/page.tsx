import { getPayload } from 'payload';
import configPromise from '@payload-config';
import { getPayloadUser } from '@/lib/auth/getPayloadUser';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';

// Server component: Wishlist page
export default async function WishlistPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const user = await getPayloadUser();
  if (!user) {
    // Redirect to login or show a message
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        <p>Please log in to view your wishlist.</p>
      </div>
    );
  }

  const payload = await getPayload({ config: configPromise });
  const lists = await payload.find({
    collection: 'wishlists',
    where: { user: { equals: user.id } },
    limit: 1,
    overrideAccess: true,
  });
  const list = lists.docs[0];

  const items = list?.items || [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-white mb-8">Your Wishlist</h1>
      {items.length === 0 ? (
        <p className="text-gray-300">Your wishlist is empty.</p>
      ) : (
        <ul className="space-y-4">
          {items.map((item: any, idx: number) => (
            <li
              key={idx}
              className="flex items-center justify-between rounded-lg bg-gray-800 p-4 shadow-lg hover:bg-gray-700 transition"
            >
              <div className="flex-1">
                <p className="text-lg font-medium text-white">
                  {typeof item.product === 'object' ? item.product.name : `Product ID: ${item.product}`}
                </p>
                <p className="text-sm text-gray-400">
                  SKU: {item.variantSku} • Qty: {item.quantity}
                </p>
                <p className="text-sm text-gray-200 mt-1">
                  ${((item.priceSnapshot ?? 0) / 100).toFixed(2)}
                </p>
              </div>
              <form action={removeFromWishlist} className="ml-4">
                <input type="hidden" name="productId" value={typeof item.product === 'object' ? item.product.id : item.product} />
                <button
                  type="submit"
                  className="rounded-full bg-red-600 p-2 text-white hover:bg-red-700 transition"
                  title="Remove from wishlist"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-8">
        <Link
          href="/shop"
          className="inline-block rounded-md bg-indigo-600 px-6 py-3 text-base font-medium text-white hover:bg-indigo-700 transition"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}

// Server Action to remove an item from the wishlist
export async function removeFromWishlist(formData: FormData) {
  'use server';
  const productId = formData.get('productId') as string;
  const user = await getPayloadUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const payload = await getPayload({ config: configPromise });
  const existingLists = await payload.find({
    collection: 'wishlists',
    where: { user: { equals: user.id } },
    limit: 1,
    overrideAccess: true,
  });
  const list = existingLists.docs[0];
  if (!list) return { success: false, error: 'Wishlist not found' };

  const numericProductId = Number(productId);
  const items = (list.items || []).filter((i: any) => {
    const id = Number(typeof i.product === 'object' ? i.product.id : i.product);
    return id !== numericProductId;
  });

  await payload.update({
    collection: 'wishlists',
    id: list.id,
    data: { items: items as any },
    overrideAccess: true,
  });

  revalidatePath('/wishlist');
  return { success: true };
}
