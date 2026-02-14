#!/bin/bash

printf -v date '%(%Y%m%d_%H%M%S)T\n' -1
now=$(date +%F_%H-%M-%S)
echo "now: ${now}"

# Create temporary directory for backup files
TEMP_DIR="/tmp/blackmoon_backup_${now}"
mkdir -p "${TEMP_DIR}"

# Dump PostgreSQL database
echo "Dumping PostgreSQL database..."
docker compose exec -T postgres pg_dump -U blackmoon blackmoon > "${TEMP_DIR}/blackmoon.sql"

if [ $? -eq 0 ]; then
    echo "✅ Database dump successful"
else
    echo "❌ Database dump failed"
    rm -rf "${TEMP_DIR}"
    exit 1
fi

# Copy media and hex-images directories
echo "Copying media files..."
cp -r /node/blackmoon/media "${TEMP_DIR}/"
cp -r /node/blackmoon/hex-images "${TEMP_DIR}/"

# Create zip archive
echo "Creating backup archive..."
cd "${TEMP_DIR}"
zip -r "/mnt/HC_Volume_102781745/blackmoon/blackmoon_${now}.zip" .

# Cleanup temp directory
cd /
rm -rf "${TEMP_DIR}"

echo "Backup complete: /mnt/HC_Volume_102781745/blackmoon/blackmoon_${now}.zip"

# Optional: Keep only last 7 backups (uncomment to enable)
#find /mnt/HC_Volume_102781745/blackmoon/ -name "blackmoon_*.zip" -mtime +7 -delete
