#!/bin/bash

echo "Testing admin login flow..."
echo ""

# Login and save cookies
echo "1. Logging in as admin..."
RESPONSE=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nexus.cards","password":"Admin123!"}' \
  -c /tmp/admin_test_cookies.txt \
  -s)

echo "Response:"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""

# Extract role
ROLE=$(echo "$RESPONSE" | grep -o '"role":"[^"]*"' | cut -d'"' -f4)
echo "User role: $ROLE"
echo ""

# Test /users/me endpoint
echo "2. Testing /api/users/me with cookies..."
ME_RESPONSE=$(curl http://localhost:3001/api/users/me \
  -b /tmp/admin_test_cookies.txt \
  -s)

echo "Response:"
echo "$ME_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$ME_RESPONSE"
echo ""

ME_ROLE=$(echo "$ME_RESPONSE" | grep -o '"role":"[^"]*"' | cut -d'"' -f4)
echo "User role from /me: $ME_ROLE"
echo ""

if [ "$ME_ROLE" = "ADMIN" ]; then
  echo "✓ API correctly returns ADMIN role"
else
  echo "✗ API does not return ADMIN role"
fi
