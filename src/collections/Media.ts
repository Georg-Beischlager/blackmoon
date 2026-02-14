import type { CollectionConfig } from 'payload'
import { hexTransformBuffer } from '../utils/hexTransformCanvas'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'isHexImage',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Transform this image into a hexagon shape',
        position: 'sidebar',
      },
    },
    {
      name: 'transformStatus',
      type: 'select',
      options: [
        { label: 'Not Transformed', value: 'none' },
        { label: 'Success', value: 'success' },
        { label: 'Failed', value: 'failed' },
      ],
      defaultValue: 'none',
      admin: {
        readOnly: true,
        condition: (data) => data?.isHexImage === true,
      },
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
  upload: true,
  hooks: {
    beforeChange: [
      async ({ req, data, operation }) => {
        if (operation !== 'create' || !req.file || !data.isHexImage) {
          return data
        }

        try {
          // Transform image to hexagon
          const transformedBuffer = await hexTransformBuffer(req.file.data)

          // Validate PNG magic bytes
          const pngMagic = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
          if (!transformedBuffer.subarray(0, 8).equals(pngMagic)) {
            throw new Error('Transformation did not produce valid PNG')
          }

          // Replace file data with transformed buffer
          req.file.data = transformedBuffer
          req.file.mimetype = 'image/png'

          // Update document fields
          data.mimeType = 'image/png'
          data.filesize = transformedBuffer.length
          data.transformStatus = 'success'
          data.transformError = ''

          return data
        } catch (error: any) {
          data.transformStatus = 'failed'
          data.transformError = error.message
          return data
        }
      },
    ],
  },
}
