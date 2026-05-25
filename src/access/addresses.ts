// src/access/addresses.ts

export const access: any = {
  create: ({ req: { user } }: any) => !!user && ['admin', 'staff'].includes(user.role),
  read: ({ req: { user } }: any) => !!user && ['admin', 'staff'].includes(user.role),
  update: ({ req: { user } }: any) => !!user && ['admin', 'staff'].includes(user.role),
  delete: ({ req: { user } }: any) => !!user && ['admin', 'staff'].includes(user.role),
}
