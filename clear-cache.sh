#!/bin/bash

# Clear all Next.js and browser caches
echo "Stopping web service..."
docker compose stop web

echo "Removing Next.js cache..."
docker compose run --rm web sh -c "rm -rf /app/apps/web/.next"

echo "Starting web service..."
docker compose up -d web

echo "Waiting for service to be ready..."
sleep 15

echo "✅ Cache cleared! Please do the following in your browser:"
echo ""
echo "1. Open DevTools (F12)"
echo "2. Right-click the refresh button and select 'Empty Cache and Hard Reload'"
echo "   OR press Ctrl+Shift+Delete and clear cached images and files"
echo ""
echo "3. Navigate to: http://localhost:3000/dashboard/cards/cmik2dv0m0003wmhgkspllldc/customize"
echo ""
echo "You should now see the new component-based design with 'Customize Your Card' heading."
