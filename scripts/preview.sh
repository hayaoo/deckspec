#!/usr/bin/env bash
set -euo pipefail

DECK="${1:-}"
PORT=3002

if [ -z "$DECK" ]; then
  echo "Usage: ./scripts/preview.sh <deck.yaml>"
  echo "  e.g. ./scripts/preview.sh decks/hashimotoya-fuel/deck.yaml"
  exit 1
fi

if [ ! -f "$DECK" ]; then
  echo "Error: $DECK not found"
  exit 1
fi

# 1. Build
echo "==> pnpm build"
pnpm build

# 2. Validate
echo "==> pnpm validate $DECK"
pnpm validate "$DECK"

# 3. Dev server
if lsof -i :"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "==> Dev server already running on :$PORT"
else
  echo "==> Starting dev server on :$PORT"
  pnpm dev &
  sleep 1
fi

# 4. URL
DECK_NAME=$(basename "$(dirname "$DECK")")
echo ""
echo "==> Preview: http://localhost:$PORT/deck/$DECK_NAME"
