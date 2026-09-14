#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="$ROOT_DIR/dist/local-build"
NODE_BIN="${NODE_BIN:-}"

if [[ -z "$NODE_BIN" ]]; then
  NODE_BIN="$(command -v node || true)"
fi

if [[ -z "$NODE_BIN" && -x /usr/local/bin/node ]]; then
  NODE_BIN="/usr/local/bin/node"
fi

if [[ -z "$NODE_BIN" || ! -x "$NODE_BIN" ]]; then
  echo "Node.js غير متاح. ثبّت Node.js أو مرّر مساره عبر NODE_BIN." >&2
  exit 1
fi

export PATH="$(dirname "$NODE_BIN"):$PATH"
cd "$ROOT_DIR"

echo "تجهيز Prisma..."
"$ROOT_DIR/node_modules/.bin/prisma" generate

echo "بناء الواجهة..."
NX_DAEMON=false "$NODE_BIN" "$ROOT_DIR/node_modules/nx/dist/bin/nx.js" build web

echo "بناء خدمات API..."
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

for service in auth-service people-service academic-service api-gateway; do
  "$ROOT_DIR/node_modules/.bin/tsc" \
    -p "$ROOT_DIR/$service/tsconfig.app.json" \
    --outDir "$BUILD_DIR/$service"
  echo "✓ اكتمل $service"
done

echo
echo "اكتمل البناء. المخرجات في: $BUILD_DIR"
