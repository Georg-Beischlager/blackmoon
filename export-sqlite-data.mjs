/**
 * Export SQLite database to JSON for migration to PostgreSQL
 * Run this locally with: npm run export-data
 * (Add to package.json: "export-data": "tsx export-sqlite-data.mjs")
 * 
 * Or install tsx globally: npm install -g tsx
 * Then run: tsx export-sqlite-data.mjs
 */

import { getPayload } from 'payload'
import fs from 'fs/promises'

async function exportData() {
  console.log('🚀 Starting SQLite data export...')
  
  // Import the compiled config from the build
  const configModule = await import('./dist/payload.config.js')
  const config = configModule.default
  
  const payload = await getPayload({ config })
  
  const collections = [
    'logs',
    'database', 
    'characters',
    'mapTiles',
    'hexImages',
    'tags',
    'users',
    'media'
  ]
  
  const exportData = {}
  
  for (const collection of collections) {
    try {
      console.log(`📦 Exporting ${collection}...`)
      
      const { docs } = await payload.find({
        collection,
        limit: 10000, // adjust if you have more
        depth: 0, // don't populate relationships
      })
      
      exportData[collection] = docs
      console.log(`✅ Exported ${docs.length} ${collection}`)
      
    } catch (error) {
      console.error(`❌ Error exporting ${collection}:`, error.message)
      exportData[collection] = []
    }
  }
  
  // Save to file
  const filename = `migration-export-${new Date().toISOString().split('T')[0]}.json`
  await fs.writeFile(filename, JSON.stringify(exportData, null, 2))
  
  console.log(`\n✅ Export complete! Saved to ${filename}`)
  console.log('\nNext steps:')
  console.log('1. Copy your media/ and hex-images/ directories')
  console.log('2. Update payload.config.ts to use PostgreSQL')
  console.log('3. Run: pnpm build')
  console.log('4. Run the import script with the new database')
  
  process.exit(0)
}

exportData().catch(console.error)
