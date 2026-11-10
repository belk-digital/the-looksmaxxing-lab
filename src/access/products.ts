import { publicProductsClause } from '../lib/access/restrictedQuery'

export const productsAccess: any = {
  read: async ({ req }: any) => {
    // Admin or staff can read all; public can read only active products
    const isAdmin = ['admin', 'staff'].includes(req?.user?.role as string)
    if (isAdmin) return {}

    const activeOnly = { status: { equals: 'active' } }

    // Nasal sprays are for logged-in customers only. This rule covers Payload's own public REST and GraphQL
    // API (/api/products, /api/graphql); without it anyone could list the sprays there even though the pages
    // are hidden. Customers log in through the site's own login, which Payload does not see, so for this API
    // everyone who is not signed in to the admin is treated as logged out. (The site's own pages do not use
    // this rule: they use the Local API, which skips access rules and applies the restriction itself.)
    if (!req?.user && req?.payload) {
      const publicOnly = await publicProductsClause(req.payload)
      if (publicOnly) return { and: [activeOnly, publicOnly] }
    }

    return activeOnly
  },
  create: ({ req }: any) => req?.user?.role === 'admin',
  update: ({ req }: any) => req?.user?.role === 'admin',
  delete: ({ req }: any) => req?.user?.role === 'admin',
}
