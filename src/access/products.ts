

export const productsAccess: any = {
  read: ({ req }: any) => {
    // Admin or staff can read all; public can read only active products
    const isAdmin = ['admin', 'staff'].includes(req?.user?.role as string)
    if (isAdmin) return {}
    return { status: { equals: 'active' } }
  },
  create: ({ req }: any) => req?.user?.role === 'admin',
  update: ({ req }: any) => req?.user?.role === 'admin',
  delete: ({ req }: any) => req?.user?.role === 'admin',
}
