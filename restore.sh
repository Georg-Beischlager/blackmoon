#!/bin/bash

# Blackmoon Database Restore Script
# WARNING: This will OVERWRITE existing data!

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backup file provided
if [ $# -eq 0 ]; then
    echo -e "${RED}❌ Error: No backup file specified${NC}"
    echo "Usage: ./restore.sh <backup_file.zip>"
    echo ""
    echo "Available backups:"
    ls -lh /mnt/HC_Volume_102781745/blackmoon/blackmoon_*.zip 2>/dev/null || echo "  No backups found"
    exit 1
fi

BACKUP_FILE="$1"

# Check if file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Error: Backup file not found: $BACKUP_FILE${NC}"
    exit 1
fi

echo -e "${YELLOW}⚠️  WARNING: This will DELETE all current data and restore from backup!${NC}"
echo -e "${YELLOW}   Backup file: $BACKUP_FILE${NC}"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Restore cancelled"
    exit 0
fi

# Create temp directory
TEMP_DIR="/tmp/blackmoon_restore_$(date +%s)"
mkdir -p "$TEMP_DIR"

echo ""
echo "📦 Extracting backup..."
unzip -q "$BACKUP_FILE" -d "$TEMP_DIR"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to extract backup${NC}"
    rm -rf "$TEMP_DIR"
    exit 1
fi

echo -e "${GREEN}✅ Backup extracted${NC}"

# Show what will be restored
echo ""
echo "📋 Backup contents:"
echo "  Database dump: $(ls -lh $TEMP_DIR/blackmoon.sql | awk '{print $5}')"
[ -d "$TEMP_DIR/media" ] && echo "  Media files: $(find $TEMP_DIR/media -type f | wc -l) files"
[ -d "$TEMP_DIR/hex-images" ] && echo "  Legacy hex-images: $(find $TEMP_DIR/hex-images -type f | wc -l) files"

echo ""
read -p "Proceed with restore? (yes/no): " confirm2

if [ "$confirm2" != "yes" ]; then
    echo "❌ Restore cancelled"
    rm -rf "$TEMP_DIR"
    exit 0
fi

# Change to app directory
cd /node/blackmoon

echo ""
echo "🛑 Stopping application..."
docker compose down

echo ""
echo "🗄️  Restoring database..."
docker compose up -d postgres

# Wait for postgres to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Check if postgres is running
until docker compose exec postgres pg_isready -U blackmoon > /dev/null 2>&1; do
    echo "  Waiting..."
    sleep 2
done

echo -e "${GREEN}✅ PostgreSQL is ready${NC}"

# Restore database
echo "📥 Importing database..."
docker compose exec -T postgres psql -U blackmoon -d blackmoon < "$TEMP_DIR/blackmoon.sql"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database restored successfully${NC}"
else
    echo -e "${RED}❌ Database restore failed${NC}"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# Restore media files
echo ""
echo "📁 Restoring media files..."

if [ -d "$TEMP_DIR/media" ]; then
    # Backup current media just in case
    if [ -d "/node/blackmoon/media" ]; then
        mv /node/blackmoon/media "/node/blackmoon/media_backup_$(date +%s)"
        echo "  Current media backed up"
    fi
    
    cp -r "$TEMP_DIR/media" /node/blackmoon/
    echo -e "${GREEN}✅ Media files restored ($(find /node/blackmoon/media -type f | wc -l) files)${NC}"
fi

# Restore legacy hex-images if present
if [ -d "$TEMP_DIR/hex-images" ]; then
    if [ -d "/node/blackmoon/hex-images" ]; then
        mv /node/blackmoon/hex-images "/node/blackmoon/hex-images_backup_$(date +%s)"
    fi
    cp -r "$TEMP_DIR/hex-images" /node/blackmoon/
    echo -e "${GREEN}✅ Legacy hex-images restored${NC}"
fi

# Cleanup temp directory
rm -rf "$TEMP_DIR"

echo ""
echo "🚀 Starting application..."
docker compose up -d

echo ""
echo -e "${GREEN}✅ RESTORE COMPLETE!${NC}"
echo ""
echo "📊 Summary:"
echo "  - Database: Restored from backup"
echo "  - Media files: Restored"
echo "  - Application: Restarted"
echo ""
echo "🌐 Your site should be available at: https://blackmoon-api.democrify.xyz"
echo ""
echo "⚠️  Note: Old media backups are saved as media_backup_*."
echo "   You can delete them later with: rm -rf /node/blackmoon/media_backup_*"
