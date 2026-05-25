

export const couponsAccess: any = {
  read: () => true, // public read for validation lookups
  create: ({ req }: any) => req?.user?.role === 'admin',
  update: ({ req }: any) => req?.user?.role === 'admin',
  delete: ({ req }: any) => req?.user?.role === 'admin',
}
