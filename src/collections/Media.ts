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
        description: 'Transform this image into a hexagon shape (creates separate file)',
        position: 'sidebar',
      },
    },
    {
      name: 'hexFilename',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Filename of the hex-transformed version',
        condition: (data) => data?.isHexImage === true && data?.hexFilename,
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
  admin: {
    components: {
      beforeList: ['/components/MediaFilterTabs'],
    },
  },
  hooks: {
    beforeChange: [
      async ({ req, data, operation, originalDoc }) => {
        const fs = await import('fs/promises')
        const path = await import('path')

        // Handle disabling hex image - delete hex file
        if (operation === 'update' && originalDoc?.isHexImage && !data.isHexImage) {
          try {
            if (originalDoc.hexFilename) {
              const hexFilePath = path.join('media', originalDoc.hexFilename)
              await fs.unlink(hexFilePath)
              console.log(`[Media] Deleted hex file: ${originalDoc.hexFilename}`)
            }
          } catch (_error) {
            // File might not exist, ignore error
          }

          // Clear hex-related fields
          data.hexFilename = null
          data.transformStatus = 'none'
          data.transformError = null

          return data
        }

        // Skip if not enabling hex image
        if (!data.isHexImage) {
          return data
        }

        // Handle CREATE operation with new file
        if (operation === 'create' && req.file) {
          try {
            // Transform image to hexagon
            const transformedBuffer = await hexTransformBuffer(req.file.data)

            // Validate PNG magic bytes
            const pngMagic = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
            if (!transformedBuffer.subarray(0, 8).equals(pngMagic)) {
              throw new Error('Transformation did not produce valid PNG')
            }

            // Generate hex filename
            const originalFilename = req.file.name || ''
            const baseName = originalFilename.replace(/\.[^/.]+$/, '')
            const hexFilename = `${baseName}_hex.png`

            // Write hex file separately (don't modify req.file - keep original)
            const hexFilePath = path.join('media', hexFilename)
            await fs.writeFile(hexFilePath, transformedBuffer)

            // Update document fields
            data.hexFilename = hexFilename
            data.transformStatus = 'success'
            data.transformError = ''

            return data
          } catch (error) {
            data.transformStatus = 'failed'
            data.transformError = error instanceof Error ? error.message : 'Unknown error'
            return data
          }
        }

        // Handle UPDATE operation when isHexImage is being enabled
        if (operation === 'update' && originalDoc && !originalDoc.isHexImage && data.isHexImage) {
          try {
            // Read existing file from disk
            const filePath = path.join('media', originalDoc.filename)
            const fileBuffer = await fs.readFile(filePath)

            // Transform image to hexagon
            const transformedBuffer = await hexTransformBuffer(fileBuffer)

            // Validate PNG magic bytes
            const pngMagic = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
            if (!transformedBuffer.subarray(0, 8).equals(pngMagic)) {
              throw new Error('Transformation did not produce valid PNG')
            }

            // Generate hex filename
            const originalFilename = originalDoc.filename || ''
            const baseName = originalFilename.replace(/\.[^/.]+$/, '')
            const hexFilename = `${baseName}_hex.png`

            // Write hex file separately (keep original intact)
            const hexFilePath = path.join('media', hexFilename)
            await fs.writeFile(hexFilePath, transformedBuffer)

            // Update document fields
            data.hexFilename = hexFilename
            data.transformStatus = 'success'
            data.transformError = ''

            return data
          } catch (error) {
            data.transformStatus = 'failed'
            data.transformError = error instanceof Error ? error.message : 'Unknown error'
            return data
          }
        }

        return data
      },
    ],

    afterChange: [
      async ({ doc, req, operation, previousDoc }) => {
        // Only proceed if this is a hex image
        if (!doc.isHexImage) {
          return doc
        }

        // Only create HexImage on CREATE or when UPDATE enables isHexImage
        const shouldCreateHexImage =
          operation === 'create' ||
          (operation === 'update' && previousDoc && !previousDoc.isHexImage)

        if (!shouldCreateHexImage) {
          return doc
        }

        try {
          // Check if HexImage already exists for this media
          const existingHexImages = await req.payload.find({
            collection: 'hexImages',
            where: {
              media: {
                equals: doc.id,
              },
            },
            depth: 0,
          })

          // If HexImage already exists, don't create another
          if (existingHexImages.docs.length > 0) {
            return doc
          }

          // Extract filename without extension for title
          const filename = doc.filename || ''
          const title = filename.replace(/\.[^/.]+$/, '') || 'Untitled'

          // Create HexImage entry
          await req.payload.create({
            collection: 'hexImages',
            data: {
              title: title,
              description: '',
              media: doc.id,
              transformStatus: doc.transformStatus === 'success' ? 'success' : 'pending',
            },
            req,
          })
        } catch (_error) {
          // Log error but don't fail the media upload
          console.error('Failed to create HexImage entry:', _error)
        }

        return doc
      },
    ],
  },
}
