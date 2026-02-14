# SQLite to PostgreSQL Migration Guide

## Prerequisites

Install tsx (TypeScript executor):
```bash
npm install -g tsx
# or use with npx
```

## Step 1: Export SQLite Data (Locally)

```bash
# Build your current app first (to compile TypeScript)
pnpm build

# Run export script
tsx export-sqlite-data.mjs
```

This creates `migration-export-YYYY-MM-DD.json`

## Step 2: Install PostgreSQL Adapter

```bash
pnpm add @payloadcms/db-postgres
pnpm remove @payloadcms/db-sqlite
```

## Step 3: Update Configuration

Replace `src/payload.config.ts` with `payload.config.postgres.ts`

Update `.env`:
```env
# Remove old SQLite URL
# DATABASE_URL=file:./data/blackmoon-db.db

# Add PostgreSQL connection
DATABASE_URL=postgres://blackmoon:YOUR_SECURE_PASSWORD@postgres:5432/blackmoon
POSTGRES_PASSWORD=YOUR_SECURE_PASSWORD
PAYLOAD_SECRET=your-secret-here
```

## Step 4: Update Docker Setup

Replace `docker-compose.yml` with `docker-compose.postgres.yaml`

## Step 5: Deploy to Server

```bash
# On your server
cd /node/blackmoon

# Pull latest changes
git pull

# Build and start with PostgreSQL
docker compose down
docker compose up -d

# Wait for postgres to be healthy (check logs)
docker compose logs -f postgres

# Once healthy, the app will auto-create tables
```

## Step 6: Import Data

```bash
# Copy your export file to the server
scp migration-export-YYYY-MM-DD.json root@your-server:/node/blackmoon/

# On the server, exec into the app container
docker compose exec app sh

# Inside container, install tsx
npm install -g tsx

# Run import
tsx import-to-postgres.mjs migration-export-YYYY-MM-DD.json

# Exit container
exit
```

## Step 7: Verify

1. Check that your collections have data in the admin panel
2. Verify uploads are working (media/ and hex-images/ should be mounted)
3. Test hex image transformation

## Rollback Plan

If something goes wrong, you can rollback:

```bash
# Stop containers
docker compose down

# Restore old config
git checkout HEAD~1 src/payload.config.ts docker-compose.yml

# Restore SQLite database from backup
cp /mnt/HC_Volume_102781745/blackmoon/blackmoon_LATEST.zip .
unzip -o blackmoon_LATEST.zip "node/blackmoon/data/*"

# Restart with SQLite
docker compose up -d
```

## Benefits of PostgreSQL

✅ Works perfectly in Docker (no native module issues)
✅ Better performance for complex queries
✅ More robust for production workloads
✅ Easier backups with pg_dump
✅ Better concurrent access handling

## Notes

- IDs will change during migration (they're auto-generated)
- Upload files (media/, hex-images/) are preserved
- Update any frontend code that hardcodes document IDs
- PostgreSQL backup: `docker compose exec postgres pg_dump -U blackmoon blackmoon > backup.sql`
