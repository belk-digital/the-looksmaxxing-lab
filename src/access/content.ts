export const accessContent: any = {
  create: ({ req }: any) => req.user?.role === 'admin',
  read: ({ req, data }: any) => {
    if (req.user?.role === 'admin') return true
    return data?.status === 'published'
  },
  update: ({ req }: any) => req.user?.role === 'admin',
  delete: ({ req }: any) => req.user?.role === 'admin',
}
