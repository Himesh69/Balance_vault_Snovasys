#!/bin/sh
set -e

echo "Applying Prisma database migrations..."
if [ -n "$DATABASE_URL_MIGRATE" ]; then
  DATABASE_URL="$DATABASE_URL_MIGRATE" npx prisma migrate deploy
else
  npx prisma migrate deploy
fi

echo "Starting BalanceVault API server..."
exec "$@"
