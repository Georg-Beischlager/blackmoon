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
  ],

  hooks: {
    afterRead: [
      async ({ doc, req }) => {
        // Sync transformStatus from the related Media document
        if (doc.media) {
          try {
            const mediaDoc = await req.payload.findByID({
              collection: 'media',
              id: typeof doc.media === 'string' ? doc.media : doc.media.id,
              depth: 0,
            })
            doc.transformStatus = mediaDoc.transformStatus || 'pending'
          } catch (e) {
            doc.transformStatus = 'failed'
          }
        }
        return doc
      },
    ],
  },
}
