import type { CollectionConfig } from 'payload'
import { hexTransformBuffer } from '../utils/hexTransformCanvas'

// Simple in-memory queue to prevent overwhelming the server with parallel transformations
class TransformQueue {
  private queue: Array<() => Promise<void>> = []
  private processing = false

  async add(task: () => Promise<void>) {
    this.queue.push(task)
    if (!this.processing) {
      await this.process()
    }
  }

  private async process() {
    this.processing = true
    while (this.queue.length > 0) {
      const task = this.queue.shift()
      if (task) {
        try {
          await task()
        } catch (error) {
          console.error('Transform queue task failed:', error)
        }
      }
    }
    this.processing = false
  }
}

const transformQueue = new TransformQueue()

export const HexImages: CollectionConfig = {
  slug: 'hexImages',
  admin: {
    useAsTitle: 'filename',
    description: 'All images uploaded here are automatically transformed into hexagons',
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
    afterOperation: [
      async ({ operation, result, req }) => {
        // Only process create operations with uploads
        if (operation !== 'create' || !result || !req.file) {
          return result
        }

        const doc = result
        
        console.log(`[HexTransform] Queuing transformation for: ${doc.filename}`)

        // Add to queue instead of running immediately
        // This prevents overwhelming the server during bulk uploads
        transformQueue.add(async () => {
          try {
            const fs = await import('fs/promises')
            const path = await import('path')
            
            const uploadsDir = 'hex-images'
            const filePath = path.join(uploadsDir, doc.filename)
            
            console.log(`[HexTransform] Processing: ${doc.filename}`)

            // Read the saved file
            const fileBuffer = await fs.readFile(filePath)

            // Transform it
            const transformedBuffer = await hexTransformBuffer(fileBuffer)

            // Validate PNG
            const pngMagicNumber = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
            if (!transformedBuffer.subarray(0, 8).equals(pngMagicNumber)) {
              throw new Error('Transformation did not produce valid PNG')
            }

            // Generate new filename
            const baseName = doc.filename.replace(/\.(jpe?g|png|gif|webp)$/i, '')
            const newFilename = `${baseName}_hex.png`
            const newFilePath = path.join(uploadsDir, newFilename)

            // Write the transformed file
            await fs.writeFile(newFilePath, transformedBuffer)

            // Delete the original file
            await fs.unlink(filePath)

            // Update the database with the new filename
            await req.payload.db.updateOne({
              collection: 'hexImages',
              where: { id: { equals: doc.id } },
              data: {
                filename: newFilename,
                mimeType: 'image/png',
                filesize: transformedBuffer.length,
                transformStatus: 'success',
                transformError: null,
              },
            })

            console.log(`[HexTransform] ✅ Success: ${newFilename}`)
            req.payload.logger.info({ message: `Successfully transformed hex image: ${newFilename}` })

          } catch (error: any) {
            console.error(`[HexTransform] ❌ Error for ${doc.filename}:`, error.message)
            req.payload.logger.error({
              message: 'Hex transformation error',
              error: error.message,
              filename: doc.filename,
            })

            // Update with error status
            try {
              await req.payload.db.updateOne({
                collection: 'hexImages',
                where: { id: { equals: doc.id } },
                data: {
                  transformStatus: 'failed',
                  transformError: `Error: ${error.message}`,
                },
              })
            } catch (updateError) {
              console.error('Failed to update error status:', updateError)
            }
          }
        })

        return result
      },
    ],
  },
}