# Extract backup
unzip blackmoon_YYYY-MM-DD_HH-MM-SS.zip -d /tmp/restore

# Restore database
docker compose exec -T postgres psql -U blackmoon -d blackmoon < /tmp/restore/blackmoon.sql

# Restore media files
cp -r /tmp/restore/media /node/blackmoon/
cp -r /tmp/restore/hex-images /node/blackmoon/