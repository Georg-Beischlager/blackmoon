import sharp from 'sharp'

/**
 * Check if a point is inside the hexagon
 */
function isInsideHexagon(x: number, y: number, cx: number, cy: number, radius: number, halfWidth: number): boolean {
  // Transform to hexagon center coordinates
  const dx = Math.abs(x - cx)
  const dy = y - cy
  
  // Check if point is inside the hexagon using the standard hexagon equation
  return dx <= halfWidth && Math.abs(dy) <= radius && 
         (halfWidth * radius - halfWidth * Math.abs(dy) - radius * dx / 2) >= 0
}

/**
 * Transform an image into a hexagon shape with transparent corners
 * @param inputBuffer - Input image buffer
 * @returns PNG buffer with hexagon transformation
 */
export async function hexTransformBuffer(inputBuffer: Buffer): Promise<Buffer> {
  console.log('[hexTransform] Starting transformation, input size:', inputBuffer.length)
  
  // Load image and get metadata
  const image = sharp(inputBuffer)
  const metadata = await image.metadata()

  console.log('[hexTransform] Image metadata:', metadata)

  if (!metadata.width || !metadata.height) {
    throw new Error('Could not parse image dimensions')
  }

  const width = metadata.width
  const height = metadata.height

  // Use smallest dimension for the hexagon
  const size = Math.min(width, height)
  const radius = size / 2

  // sqrt(3)/2 ≈ 0.8660254
  const halfWidth = Math.round(radius * 0.8660254)

  console.log('[hexTransform] Dimensions:', { width, height, size, radius, halfWidth })

  // Center coordinates
  const cx = radius
  const cy = radius

  console.log('[hexTransform] Cropping and converting to raw pixels...')

  // Crop the image to center square and convert to raw pixel data
  const { data, info } = await sharp(inputBuffer)
    .extract({
      left: Math.floor((width - size) / 2),
      top: Math.floor((height - size) / 2),
      width: size,
      height: size,
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  console.log('[hexTransform] Raw pixel data:', { width: info.width, height: info.height, channels: info.channels, dataSize: data.length })

  // Create a copy of the pixel data to modify
  const pixels = Buffer.from(data)

  console.log('[hexTransform] Applying hexagon mask...')

  // Apply hexagon mask by setting alpha to 0 for pixels outside the hexagon
  let pixelsChanged = 0
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const idx = (y * info.width + x) * info.channels
      
      // Check if pixel is inside hexagon
      if (!isInsideHexagon(x, y, cx, cy, radius, halfWidth)) {
        // Set alpha to 0 (transparent)
        pixels[idx + 3] = 0
        pixelsChanged++
      }
    }
  }

  console.log('[hexTransform] Pixels made transparent:', pixelsChanged)
  console.log('[hexTransform] Converting back to PNG...')

  // Convert back to PNG
  const transformedBuffer = await sharp(pixels, {
    raw: {
      width: info.width,
      height: info.height,
      channels: info.channels,
    },
  })
    .png()
    .toBuffer()

  console.log('[hexTransform] ✅ Transformation complete, output size:', transformedBuffer.length)

  return transformedBuffer
}

/**
 * Transform an image file into a hexagon shape and save to output path
 * @param inputPath - Path to input image
 * @param outputPath - Path to save the hexagon-transformed PNG
 */
export async function hexTransformCanvas(
  inputPath: string,
  outputPath: string
): Promise<void> {
  const inputBuffer = await sharp(inputPath).toBuffer()
  const transformedBuffer = await hexTransformBuffer(inputBuffer)
  await sharp(transformedBuffer).toFile(outputPath)
}