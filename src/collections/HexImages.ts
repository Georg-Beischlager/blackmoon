import type { CollectionConfig } from 'payload'
import { hexTransformBuffer } from '../utils/hexTransformCanvas'


export const HexImages: CollectionConfig = {
  slug: 'hexImages',
  admin: {
    useAsTitle: 'filename',
    description: 'All images uploaded here are automatically transformed into hexagons',
  },
  access: {
    // Anyone can read/view hex images
    read: () => true,
    // Only authenticated users can create
    create: ({ req: { user } }) => !!user,
    // Only authenticated users can update
    update: ({ req: { user } }) => !!user,
    // Only authenticated users can delete
    delete: ({ req: { user } }) => !!user,
  },
  upload: {
    staticDir: 'hex-images',
    mimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'],
    disableLocalStorage: false,
  },
  fields: [
    {
      name: 'filename',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Filename of the hex-transformed image',
      },
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
      admin: {
        readOnly: true,
        description: 'Status of the hex transformation',
      },
    },
    {
      name: 'transformError',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Error message if transformation failed',
        condition: (data) => data?.transformStatus === 'failed',
      },
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, req, operation }) => {
        // Only process on create with a file upload
        if (operation !== 'create' || !req.file || !doc.filename) {
          return doc
        }

        console.log('Starting hex transformation in afterChange...')
        console.log('Saved file:', doc.filename)
        console.log('Document ID:', doc.id)

        try {
          const fs = await import('fs/promises')
          const path = await import('path')
          
          const uploadsDir = 'hex-images'
          const filePath = path.join(uploadsDir, doc.filename)
          
          console.log('Reading file from:', filePath)

          // Read the saved file
          const fileBuffer = await fs.readFile(filePath)
          console.log('File read, size:', fileBuffer.length)

          // Transform it
          console.log('Calling hexTransformBuffer...')
          const transformedBuffer = await hexTransformBuffer(fileBuffer)
          console.log('Transformation complete, output size:', transformedBuffer.length)

          // Validate PNG
          const pngMagicNumber = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
          if (!transformedBuffer.subarray(0, 8).equals(pngMagicNumber)) {
            throw new Error('Transformation did not produce valid PNG')
          }

          // Use database ID as filename to prevent overwrites
          const newFilename = `${doc.id}_hex.png`
          const newFilePath = path.join(uploadsDir, newFilename)

          console.log('Writing transformed file to:', newFilePath)

          // Write the transformed file
          await fs.writeFile(newFilePath, transformedBuffer)

          // Delete the original file
          await fs.unlink(filePath)
          console.log('Deleted original file:', filePath)

          // Modify doc and return (don't call payload.update)
          doc.filename = newFilename
          doc.mimeType = 'image/png'
          doc.filesize = transformedBuffer.length
          doc.transformStatus = 'success'
          doc.transformError = ''

          console.log('✅ Hex transformation successful! New filename:', newFilename)
          req.payload.logger.info({ message: `Successfully transformed hex image: ${newFilename}` })

          return doc

        } catch (error: any) {
          console.error('Hex transformation error:', error)
          req.payload.logger.error({
            message: 'Hex transformation error',
            error: error.message,
            stack: error.stack,
          })

          // Mark as failed and return
          doc.transformStatus = 'failed'
          doc.transformError = `Error: ${error.message}`

          return doc
        }
      },
    ],
  },
}