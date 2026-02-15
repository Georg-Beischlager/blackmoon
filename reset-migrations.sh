#!/bin/bash

# Reset Payload migration tracking without losing data
# This fixes "migrations no longer working" by clearing migration history

set -e

echo "🔄 Resetting Payload migration tracking..."
echo ""

# Start postgres
docker compose up -d postgres
sleep 5

echo "📋 Current migration status:"
docker compose exec postgres psql -U blackmoon -d blackmoon -c "SELECT * FROM payload_migrations ORDER BY created_at DESC;" || echo "No migrations table found"

echo ""
read -p "Reset all migration tracking? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Aborted"
    exit 0
fi

echo ""
echo "🗑️  Clearing migration history..."
docker compose exec postgres psql -U blackmoon -d blackmoon -c "TRUNCATE TABLE payload_migrations;" || echo "Creating migrations table..."

echo ""
echo "✅ Migration tracking reset!"
echo ""
echo "Next steps:"
echo "1. Start the application: docker compose up -d"
echo "2. Payload will auto-sync schema if needed"
echo "3. Create a fresh baseline: docker compose exec payload npx payload migrate:create"
echo ""
echo "Your data is safe - only migration history was cleared."
