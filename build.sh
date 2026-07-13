#!/usr/bin/env bash
# Builds the React app and drops it into backend/pb_public, so a single
# `pocketbase serve` in backend/ serves both the app and the API.
set -euo pipefail
cd "$(dirname "$0")"

echo "==> Installing frontend dependencies"
cd frontend
npm install

echo "==> Building frontend"
npm run build

echo "==> Copying build into backend/pb_public"
rm -rf ../backend/pb_public
cp -r dist ../backend/pb_public

echo "==> Done. Run the backend with:"
echo "    cd backend && ./pocketbase serve"
