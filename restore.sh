#!/bin/bash

# Blackmoon Database Restore Script
# WARNING: This will OVERWRITE existing data!

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if backup file provided
if [ $# -eq 0 ]; then
    echo -e "${RED}Error: No backup file specified${NC}"
    echo "Usage: ./restore.sh <backup_file.zip>"
    ls -1 /mnt/HC_Volume_102781745/blackmoon/blackmoon_*.zip 2>/dev/null | tail -5 || echo "No backups found"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: Backup file not found: $BACKUP_FILE${NC}"
    exit 1
fi

echo -e "${YELLOW}Restore from: $BACKUP_FILE${NC}"
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Cancelled"
    exit 0
fi

# Create temp directory
TEMP_DIR="/tmp/blackmoon_restore_$(date +%s)"
mkdir -p "$TEMP_DIR"

# Extract backup
unzip -q "$BACKUP_FILE" -d "$TEMP_DIR" || {
    echo -e "${RED}Error: Failed to extract backup${NC}"
    rm -rf "$TEMP_DIR"
    exit 1
}

cd /node/blackmoon

# Stop application
docker compose down > /dev/null 2>&1

# Start postgres
docker compose up -d postgres > /dev/null 2>&1
sleep 5

# Wait for postgres
until docker compose exec postgres pg_isready -U blackmoon > /dev/null 2>&1; do
    sleep 2
done

# Restore database
docker compose exec -T postgres psql -U blackmoon -d blackmoon < "$TEMP_DIR/blackmoon.sql" || {
    echo -e "${RED}Error: Database restore failed${NC}"
    rm -rf "$TEMP_DIR"
    exit 1
}

# Reset migration tracking
docker compose exec postgres psql -U blackmoon -d blackmoon -c "TRUNCATE TABLE payload_migrations;" > /dev/null 2>&1 || true

# Restore media files
if [ -d "$TEMP_DIR/media" ]; then
    [ -d "/node/blackmoon/media" ] && mv /node/blackmoon/media "/node/blackmoon/media_backup_$(date +%s)"
    cp -r "$TEMP_DIR/media" /node/blackmoon/
fi

if [ -d "$TEMP_DIR/hex-images" ]; then
    [ -d "/node/blackmoon/hex-images" ] && mv /node/blackmoon/hex-images "/node/blackmoon/hex-images_backup_$(date +%s)"
    cp -r "$TEMP_DIR/hex-images" /node/blackmoon/
fi

# Cleanup
rm -rf "$TEMP_DIR"

# Start application
docker compose up -d > /dev/null 2>&1

echo -e "${GREEN}Restore complete!${NC}"
echo "Site: https://blackmoon-api.democrify.xyz"
