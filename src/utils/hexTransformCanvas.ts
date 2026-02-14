import sharp from 'sharp'

/**
 * Transform an image buffer into a hexagon shape with transparent corners
 * Image is first resized to fit within 150x150, then hexagon mask is applied
 * @param inputBuffer - The input image buffer (any format sharp supports)
 * @returns A PNG buffer with hexagon mask applied at 150x150
 */
export async function hexTransformBuffer(inputBuffer: Buffer): Promise<Buffer> {
  console.log('[hexTransform] Starting transformation, input size:', inputBuffer.length)

  // First, resize the image to 150x150
  console.log('[hexTransform] Resizing to 150x150...')
  const resized = await sharp(inputBuffer)
    .resize(150, 150, {
      fit: 'cover', // Cover the entire area (crop if needed)
      position: 'center',
    })
    .toBuffer()

  // Load resized image and get metadata
  const image = sharp(resized)
  const metadata = await image.metadata()
  console.log('[hexTransform] Resized metadata:', metadata)

  const { width = 150, height = 150 } = metadata

  // Use the smaller dimension as the size for our square crop
  const size = Math.min(width, height)
  const radius = size / 2
  const halfWidth = radius * 0.8660254 // sqrt(3)/2 for hexagon geometry

  console.log('[hexTransform] Dimensions:', { width, height, size, radius, halfWidth })

  // Crop to center square and convert to raw pixel data
  console.log('[hexTransform] Cropping and converting to raw pixels...')
  const { data, info } = await image
    .extract({
      left: Math.floor((width - size) / 2),
      top: Math.floor((height - size) / 2),
      width: size,
      height: size,
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  console.log('[hexTransform] Raw pixel data:', {
    width: info.width,
    height: info.height,
    channels: info.channels,
    dataSize: data.length,
  })

  // Helper function to check if a point is inside the hexagon
  function isInsideHexagon(x: number, y: number): boolean {
    const cx = radius
    const cy = radius

    // Translate to center
    const dx = Math.abs(x - cx)
    const dy = Math.abs(y - cy)

    // Hexagon equation: check if point is within the six-sided boundary
    // For a flat-top hexagon centered at (cx, cy):
    if (dx > halfWidth) return false
    if (dy > radius) return false
    if (dx + dy * 0.5773502692 > radius) return false // tan(30°) = 1/sqrt(3)

    return true
  }

  // Apply hexagon mask by setting alpha channel to 0 for pixels outside hexagon
  console.log('[hexTransform] Applying hexagon mask...')
  let transparentCount = 0

  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const idx = (y * info.width + x) * 4 // RGBA = 4 bytes per pixel

      if (!isInsideHexagon(x, y)) {
        data[idx + 3] = 0 // Set alpha to 0 (transparent)
        transparentCount++
      }
    }
  }

  console.log('[hexTransform] Pixels made transparent:', transparentCount)

  // Convert back to PNG (already at 150x150)
  console.log('[hexTransform] Converting back to PNG...')
  const outputBuffer = await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  })
    .png()
    .toBuffer()

  console.log('[hexTransform] ✅ Transformation complete, output size:', outputBuffer.length)

  return outputBuffer
}