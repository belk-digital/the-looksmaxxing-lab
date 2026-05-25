// src/access/categories.ts

export const access: any = {
  read: ({ req: { user } }: any) => {
    if (!user) return { isVisible: { equals: true } }
    if (['admin', 'staff'].includes(user.role)) return true
    return { isVisible: { equals: true } }
  },
  create: ({ req: { user } }: any) => !!user && ['admin', 'staff'].includes(user.role),
  update: ({ req: { user } }: any) => !!user && ['admin', 'staff'].includes(user.role),
  delete: ({ req: { user } }: any) => !!user && ['admin', 'staff'].includes(user.role),
}
