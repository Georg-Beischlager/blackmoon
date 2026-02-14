/**
 * Import JSON data into PostgreSQL
 * Run this after switching to PostgreSQL: tsx import-to-postgres.mjs migration-export-YYYY-MM-DD.json
 */

import { getPayload } from 'payload'
import fs from 'fs/promises'

async function importData(filename) {
  console.log('🚀 Starting data import to PostgreSQL...')
  
  // Import the compiled config from the build
  const configModule = await import('./dist/payload.config.js')
  const config = configModule.default
  
  const payload = await getPayload({ config })
  
  // Read export file
  const data = JSON.parse(await fs.readFile(filename, 'utf-8'))
  
  const collections = Object.keys(data)
  
  for (const collection of collections) {
    const docs = data[collection]
    
    if (!docs || docs.length === 0) {
      console.log(`⏭️  Skipping ${collection} (no data)`)
      continue
    }
    
    console.log(`\n📦 Importing ${docs.length} ${collection}...`)
    
    for (const doc of docs) {
      try {
        // Remove id to let Payload generate new ones
        const { id, ...docData } = doc
        
        await payload.create({
          collection,
          data: docData,
        })
        
      } catch (error) {
        console.error(`  ❌ Error importing ${collection} doc:`, error.message)
      }
    }
    
    console.log(`✅ Imported ${collection}`)
  }
  
  console.log('\n✅ Import complete!')
  console.log('\nDon\'t forget to:')
  console.log('1. Copy your media/ and hex-images/ directories to the server')
  console.log('2. Update any hardcoded IDs in your frontend')
  
  process.exit(0)
}

const filename = process.argv[2]
if (!filename) {
  console.error('Usage: tsx import-to-postgres.mjs <export-file.json>')
  process.exit(1)
}

importData(filename).catch(console.error)
