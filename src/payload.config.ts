// storage-adapter-import-placeholder
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Tags } from './collections/Tags'
import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Logs } from './collections/Logs'
import { Database } from './collections/Database'
import { Characters } from './collections/Characters'
import { MapTiles } from './collections/MapTiles'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Logs, Database, Characters, MapTiles, Tags, Media, Users ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URI || '',
    },
  }),
  sharp,
  plugins: [
    payloadCloudPlugin(),
    // storage-adapter-placeholder
  ],
  serverURL: process.env.LOCAL === 'true' ? 'http://localhost:3002' : 'https://blackmoon-api.democrify.xyz',
  cors: {
    origins: ['http://localhost:3002', 'http://localhost:3001', 'https://blackmoon.democrify.xyz', 'https://blackmoon-api.democrify.xyz'],
  },
  csrf: ['http://localhost:3002', 'http://localhost:3001', 'https://blackmoon.democrify.xyz', 'https://blackmoon-api.democrify.xyz'],
})
