import type { CollectionConfig } from 'payload'
import { hexTransformBuffer } from '../utils/hexTransformCanvas'
import { randomUUID } from 'crypto'

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

        // Save original filename
        data.originalFilename = req.file.name

        // Mark processing
        data.transformStatus = 'processing'

        return data
      },
    ],

    afterChange: [
      async ({ doc, req, operation }) => {
        if (operation !== 'create' || !req.file) {
          return doc
        }

        const fs = await import('fs/promises')
        const path = await import('path')

        const uploadsDir = 'hex-images'
        const originalPath = path.join(uploadsDir, doc.filename)

        try {
          // 1️⃣ Rename original file to use DB id
          const ext = path.extname(doc.originalFilename || doc.filename)
          const renamedOriginal = `${doc.id}${ext}`
          const renamedOriginalPath = path.join(uploadsDir, renamedOriginal)

          await fs.rename(originalPath, renamedOriginalPath)

          // 2️⃣ Read renamed file
          const fileBuffer = await fs.readFile(renamedOriginalPath)

          // 3️⃣ Transform to hex PNG
          const transformedBuffer = await hexTransformBuffer(fileBuffer)

          // Validate PNG
          const pngMagic = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
          if (!transformedBuffer.subarray(0, 8).equals(pngMagic)) {
            throw new Error('Transformation did not produce valid PNG')
          }

          // 4️⃣ Write final hex file
          const finalFilename = `${doc.id}_hex.png`
          const finalPath = path.join(uploadsDir, finalFilename)

          await fs.writeFile(finalPath, transformedBuffer)

          // Remove intermediate renamed original
          await fs.unlink(renamedOriginalPath)

          // 5️⃣ Persist update explicitly
          await req.payload.update({
            collection: 'hexImages',
            id: doc.id,
            data: {
              filename: finalFilename,
              mimeType: 'image/png',
              filesize: transformedBuffer.length,
              transformStatus: 'success',
              transformError: '',
            },
          })

          return doc
        } catch (error: any) {
          await req.payload.update({
            collection: 'hexImages',
            id: doc.id,
            data: {
              transformStatus: 'failed',
              transformError: error.message,
            },
          })

          return doc
        }
      },
    ],
  },
}