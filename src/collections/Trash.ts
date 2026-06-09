import { CollectionConfig } from 'payload'

export const Trash: CollectionConfig = {
  slug: 'trash',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'collectionSlug', 'createdAt'],
    description: 'Deleted documents are stored here. You can restore them or delete them permanently.',
  },
  access: {
    read: ({ req }) => req.user?.role === 'admin',
    create: () => false, // Only created via hook
    update: () => false, // No editing trash
    delete: ({ req }) => req.user?.role === 'admin',
  },
  endpoints: [
    {
      path: '/:id/restore',
      method: 'post',
      handler: async (req) => {
        try {
          const { id } = req.routeParams as { id: string }
          
          if (!req.user || req.user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 })
          }

          // 1. Fetch the trash document
          const trashDoc = await req.payload.findByID({
            collection: 'trash',
            id,
          })

          if (!trashDoc) {
            return Response.json({ error: 'Trash document not found' }, { status: 404 })
          }

          const { collectionSlug, originalId, documentData } = trashDoc

          // 2. Remove standard fields that payload auto-generates so we can re-insert cleanly
          const dataToRestore = { ...(documentData as Record<string, any>) }
          delete dataToRestore.createdAt
          delete dataToRestore.updatedAt
          // Note: we KEEP the original 'id' if possible, but payload Postgres auto-generates numeric IDs.
          // For Postgres, if id is a number, forcing the ID on create might fail if it's auto-incrementing,
          // but Payload allows specifying id if it's explicitly allowed. If it fails, Payload will just assign a new ID.
          // Let's explicitly try to restore with the original ID.
          dataToRestore.id = originalId

          // 3. Re-insert into original collection
          const restoredDoc = await req.payload.create({
            collection: collectionSlug as any,
            data: dataToRestore,
            disableVerificationEmail: true,
          })

          // 4. Delete the trash document
          await req.payload.delete({
            collection: 'trash',
            id,
          })

          return Response.json({
            success: true,
            collectionSlug,
            restoredId: restoredDoc.id,
          })
        } catch (error: any) {
          console.error('Error restoring document:', error)
          return Response.json({ error: error.message || 'Unknown error' }, { status: 500 })
        }
      },
    },
  ],
  fields: [
    {
      name: 'restoreButton',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/admin/RestoreTrashButton#RestoreTrashButton',
        },
        position: 'sidebar',
      },
    },
    {
      name: 'title',
      type: 'text',
      admin: { readOnly: true },
    },
    {
      name: 'collectionSlug',
      type: 'text',
      required: true,
      admin: { readOnly: true },
    },
    {
      name: 'originalId',
      type: 'text',
      required: true,
      admin: { readOnly: true },
    },
    {
      name: 'documentData',
      type: 'json',
      required: true,
      admin: { readOnly: true },
    },
  ],
}
