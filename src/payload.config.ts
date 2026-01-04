import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Tags } from './collections/Tags'
import { Logs } from './collections/Logs'
import { Database } from './collections/Database'
import { Characters } from './collections/Characters'
import { MapTiles } from './collections/MapTiles'
import { Users } from './collections/Users'
import { Media } from './collections/Media'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Logs, Database, Characters, MapTiles, Tags, Users, Media],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URL || '',
    },
  }),
  sharp,
  plugins: [],
  serverURL: process.env.LOCAL === 'true' ? 'http://localhost:3002' : 'https://blackmoon-api.democrify.xyz',
  cors: {
    origins: ['http://localhost:3002', 'https://blackmoon.democrify.xyz', 'https://blackmoon-api.democrify.xyz'],
  },
  csrf: ['http://localhost:3002','https://blackmoon.democrify.xyz', 'https://blackmoon-api.democrify.xyz'],
})
