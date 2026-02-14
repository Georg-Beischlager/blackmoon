import type { CollectionConfig } from 'payload'
import { hexTransformBuffer } from '../utils/hexTransformCanvas'

export const HexImages: CollectionConfig = {
  slug: 'hexImages',
  admin: {
    useAsTitle: 'originalFilename',
    description: 'All images uploaded here are automatically transformed into hexagons',
  },

  access: {
    read: () => true,
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
  },

  upload: {
    staticDir: 'hex-images',
    mimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'],
  },

  fields: [
    {
      name: 'originalFilename',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Original uploaded filename',
      },
    },
    {
      name: 'filename',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Stored filename',
      },
    },
    {
      name: 'description',
      type: 'text',
      required: false,
    },
    {
      name: 'transformStatus',
      type: 'select',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Processing', value: 'processing' },
        { label: 'Success', value: 'success' },
        { label: 'Failed', value: 'failed' },
      ],
      defaultValue: 'pending',
      admin: { readOnly: true },
    },
    {
      name: 'transformError',
      type: 'text',
      admin: {
        readOnly: true,
        condition: (data) => data?.transformStatus === 'failed',
      },
    },
  ],

  hooks: {
    beforeChange: [
      async ({ req, data, operation }) => {
        if (operation !== 'create' || !req.file) return data

        try {
          // Save original filename
          data.originalFilename = req.file.name

          // Transform image to hexagon
          const transformedBuffer = await hexTransformBuffer(req.file.data)

          // Validate PNG magic bytes
          const pngMagic = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
          if (!transformedBuffer.subarray(0, 8).equals(pngMagic)) {
            throw new Error('Transformation did not produce valid PNG')
          }

          // Generate hex filename
          const finalFilename = req.file.name.replace(/\.[^/.]+$/, '') + '_hex.png'

          // Replace file data with transformed buffer
          req.file.data = transformedBuffer
          req.file.mimetype = 'image/png'
          req.file.name = finalFilename

          // Set document fields
          data.filename = finalFilename
          data.mimeType = 'image/png'
          data.filesize = transformedBuffer.length
          data.transformStatus = 'success'
          data.transformError = ''

          return data
        } catch (error: any) {
          // Set error status but still return data to save the document
          data.transformStatus = 'failed'
          data.transformError = error.message
          return data
        }
      },
    ],
  },
}
