import type { CollectionConfig } from 'payload'

export const HexImages: CollectionConfig = {
  slug: 'hexImages',
  admin: {
    useAsTitle: 'title',
    description: 'Hexagon-transformed images from the Media library',
  },

  access: {
    read: () => true,
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
  },

  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'Display name for this hex image',
      },
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'media',
      type: 'relationship',
      relationTo: 'media',
      required: true,
      filterOptions: {
        isHexImage: {
          equals: true,
        },
      },
      admin: {
        description: 'Select a Media file marked as Hex Image',
      },
    },
    {
      name: 'transformStatus',
      type: 'select',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Success', value: 'success' },
        { label: 'Failed', value: 'failed' },
      ],
      defaultValue: 'pending',
      admin: {
        readOnly: true,
        description: 'Status from the associated Media file',
      },
    },
    {
      name: 'hexUrl',
      type: 'text',
      virtual: true,
      admin: {
        readOnly: true,
        description: 'URL to access the hex-transformed image',
      },
      hooks: {
        afterRead: [
          async ({ siblingData, req }) => {
            if (!siblingData.media) {
              return null
            }
            try {
              const mediaId =
                typeof siblingData.media === 'string' ? siblingData.media : siblingData.media.id
              const mediaDoc = (await req.payload.findByID({
                collection: 'media',
                id: mediaId,
                depth: 0,
              })) as any

              if (mediaDoc?.hexFilename) {
                const baseUrl = req.payload.config.serverURL || ''
                return `${baseUrl}/api/media/file/${mediaDoc.hexFilename}`
              }
              return null
            } catch (_error) {
              return null
            }
          },
        ],
      },
    },
  ],

  hooks: {
    afterRead: [
      async ({ doc, req }) => {
        // Sync transformStatus from the related Media document
        if (doc.media) {
          try {
            const mediaDoc = (await req.payload.findByID({
              collection: 'media',
              id: typeof doc.media === 'string' ? doc.media : (doc.media as any).id,
              depth: 0,
            })) as any
            doc.transformStatus = mediaDoc?.transformStatus || 'pending'
          } catch (_e) {
            doc.transformStatus = 'failed'
          }
        }
        return doc
      },
    ],
  },
}
