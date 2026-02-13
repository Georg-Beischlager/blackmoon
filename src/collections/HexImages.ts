import type { CollectionConfig } from 'payload'
import { hexTransformBuffer } from '../utils/hexTransformCanvas'

// Custom error classes for better error handling
class HexTransformError extends Error {
  constructor(message: string, public code: string, public statusCode: number = 500) {
    super(message)
    this.name = 'HexTransformError'
  }
}

class InvalidImageError extends HexTransformError {
  constructor(message?: string) {
    super(message || 'Invalid image file or unsupported format', 'INVALID_IMAGE', 400)
  }
}

class TransformationError extends HexTransformError {
  constructor(originalError: Error) {
    super(`Image transformation failed: ${originalError.message}`, 'TRANSFORMATION_FAILED', 500)
  }
}

export const HexImages: CollectionConfig = {
  slug: 'hexImages',
  admin: {
    useAsTitle: 'filename',
    description: 'All images uploaded here are automatically transformed into hexagons',
  },
  upload: {
    staticDir: 'hex-images',
    mimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'],
    // Disable image size variants since we're applying custom transformation
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
        // Ensure doc exists
        if (!doc) {
          return doc
        }

        // Only process on create with a file upload
        if (operation !== 'create' || !req.file || !doc.filename) {
          console.log('Skipping transformation - not a create operation or no file')
          return doc
        }

        console.log('Starting hex transformation in afterChange...')
        console.log('Saved file:', doc.filename)

        try {
          const fs = await import('fs/promises')
          const path = await import('path')
          
          // Get the upload directory
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

          // Validate that the output is a valid PNG
          const pngMagicNumber = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
          if (!transformedBuffer.subarray(0, 8).equals(pngMagicNumber)) {
            throw new Error('Transformation did not produce valid PNG')
          }

          // Generate new filename
          const baseName = doc.filename.replace(/\.(jpe?g|png|gif|webp)$/i, '')
          const newFilename = `${baseName}_hex.png`
          const newFilePath = path.join(uploadsDir, newFilename)

          console.log('Writing transformed file to:', newFilePath)

          // Write the transformed file
          await fs.writeFile(newFilePath, transformedBuffer)

          // Delete the original file
          await fs.unlink(filePath)
          console.log('Deleted original file:', filePath)

          // Update the document with the new filename
          const updatedDoc = await req.payload.update({
            collection: 'hexImages',
            id: doc.id,
            data: {
              filename: newFilename,
              mimeType: 'image/png',
              filesize: transformedBuffer.length,
              width: null,
              height: null,
              transformStatus: 'success',
              transformError: null,
            },
          })

          console.log('✅ Hex transformation successful! Updated doc:', updatedDoc.filename)
          req.payload.logger.info({ message: `Successfully transformed hex image: ${newFilename}` })

          return updatedDoc

        } catch (error: any) {
          // Log the full error for debugging
          console.error('Hex transformation error:', error)
          req.payload.logger.error({
            message: 'Hex transformation error',
            error: error.message,
            stack: error.stack,
          })

          // Update document with error
          try {
            await req.payload.update({
              collection: 'hexImages',
              id: doc.id,
              data: {
                transformStatus: 'failed',
                transformError: `Error: ${error.message}`,
              },
            })
          } catch (updateError) {
            console.error('Failed to update error status:', updateError)
          }

          // Don't throw - let the upload succeed but mark as failed
          return doc
        }
      },
    ],
  },
}