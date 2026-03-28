#!/bin/bash
# test-distribution.sh — ユーザー環境を再現して init → validate → render → dev を検証
#
# Usage: ./scripts/test-distribution.sh
#
# このスクリプトは publish 前に実行し、ユーザーが体験するフローを再現する。
# モノレポの symlink や dist/ に依存しない、クリーンな環境でテストする。
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TEST_DIR=$(mktemp -d)
PASS=0
FAIL=0

cleanup() {
  rm -rf "$TEST_DIR"
}
trap cleanup EXIT

log() { echo -e "\n\033[1;34m▸ $1\033[0m"; }
pass() { echo "  ✓ $1"; PASS=$((PASS + 1)); }
fail() { echo "  ✗ $1"; FAIL=$((FAIL + 1)); }

log "Test directory: $TEST_DIR"

# ─── Step 1: Build the CLI locally ──────────────────────────────────
log "Step 1: Building packages"
cd "$REPO_ROOT"
pnpm build > /dev/null 2>&1
pass "pnpm build succeeded"

# ─── Step 2: Pack CLI (simulate npm publish) ────────────────────────
log "Step 2: Packing @deckspec/cli"
cd "$REPO_ROOT/packages/cli"
CLI_TGZ=$(npm pack --pack-destination "$TEST_DIR" 2>/dev/null)
CLI_TGZ_PATH="$TEST_DIR/$CLI_TGZ"

# Verify dist/ is in the tarball
if tar tzf "$CLI_TGZ_PATH" | grep -q "package/dist/cli.js"; then
  pass "dist/cli.js included in package"
else
  fail "dist/cli.js NOT in package (files field missing?)"
fi

# Verify templates/ is in the tarball
if tar tzf "$CLI_TGZ_PATH" | grep -q "package/templates/noir-display"; then
  pass "templates/noir-display included in package"
else
  fail "templates/noir-display NOT in package"
fi

# Verify skills are in the tarball
if tar tzf "$CLI_TGZ_PATH" | grep -q "package/templates/skills/deckspec-make-slides"; then
  pass "skills templates included in package"
else
  fail "skills templates NOT in package"
fi

# ─── Step 3: Pack all dependency packages ───────────────────────────
log "Step 3: Packing dependency packages"
for pkg in schema dsl renderer; do
  cd "$REPO_ROOT/packages/$pkg"
  PKG_TGZ=$(npm pack --pack-destination "$TEST_DIR" 2>/dev/null)
  if tar tzf "$TEST_DIR/$PKG_TGZ" | grep -q "package/dist/"; then
    pass "@deckspec/$pkg has dist/ in tarball"
  else
    fail "@deckspec/$pkg missing dist/ in tarball"
  fi
done

cd "$REPO_ROOT/themes/noir-display"
THEME_TGZ=$(npm pack --pack-destination "$TEST_DIR" 2>/dev/null)
pass "Theme packed"

# ─── Step 4: Create isolated user project ───────────────────────────
log "Step 4: Simulating user environment"
USER_PROJECT="$TEST_DIR/user-project"
mkdir -p "$USER_PROJECT"
cd "$USER_PROJECT"

# Install CLI from local tarball (not from npm registry)
npm init -y > /dev/null 2>&1
npm install "$CLI_TGZ_PATH" > /dev/null 2>&1
pass "CLI installed from tarball"

# Verify deckspec binary exists
if [ -f "node_modules/.bin/deckspec" ]; then
  pass "deckspec binary linked"
else
  fail "deckspec binary NOT linked"
fi

# ─── Step 5: Run deckspec init ──────────────────────────────────────
log "Step 5: Testing deckspec init"
INIT_DIR="$TEST_DIR/init-project"
npx deckspec init "$INIT_DIR" --theme noir-display 2>&1 || true

if [ -f "$INIT_DIR/CLAUDE.md" ]; then
  pass "CLAUDE.md generated"
else
  fail "CLAUDE.md NOT generated"
fi

if [ -d "$INIT_DIR/themes/noir-display/patterns" ]; then
  pass "Theme patterns copied"
else
  fail "Theme patterns NOT copied"
fi

if [ -d "$INIT_DIR/.claude/skills" ]; then
  pass "Claude skills copied"
else
  fail "Claude skills NOT copied"
fi

if [ -f "$INIT_DIR/decks/sample/deck.yaml" ]; then
  pass "Sample deck created"
else
  fail "Sample deck NOT created"
fi

# Verify no dist/ leaked into copied theme
if [ -d "$INIT_DIR/themes/noir-display/dist" ]; then
  fail "dist/ leaked into copied theme (should be excluded)"
else
  pass "No dist/ in copied theme"
fi

# ─── Step 6: Test validate in user environment ──────────────────────
log "Step 6: Testing deckspec validate"
cd "$INIT_DIR"
npm install > /dev/null 2>&1

# Install local tarballs as dependencies for the init project
for tgz in "$TEST_DIR"/deckspec-*.tgz; do
  npm install "$tgz" > /dev/null 2>&1
done

if npx deckspec validate decks/sample/deck.yaml 2>&1 | grep -qi "valid\|ok\|pass"; then
  pass "validate passed on sample deck"
else
  # Try anyway — some CLIs output differently
  if npx deckspec validate decks/sample/deck.yaml 2>&1; then
    pass "validate completed without error"
  else
    fail "validate failed on sample deck"
  fi
fi

# ─── Step 7: Test render in user environment ────────────────────────
log "Step 7: Testing deckspec render"
if npx deckspec render decks/sample/deck.yaml -o "$TEST_DIR/output" 2>&1; then
  if [ -f "$TEST_DIR/output/index.html" ] || [ -f "$TEST_DIR/output" ]; then
    pass "render produced output"
  else
    fail "render ran but no output file found"
  fi
else
  fail "render failed"
fi

# ─── Step 8: Check for client-specific data leaks ───────────────────
log "Step 8: Checking for data leaks"
if grep -rq "hashimotoya\|clean-slate" "$INIT_DIR/" 2>/dev/null; then
  fail "Client-specific references found in init output!"
  grep -rn "hashimotoya\|clean-slate" "$INIT_DIR/" 2>/dev/null | head -5
else
  pass "No client-specific references in init output"
fi

# ─── Summary ────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════"
echo "  Results: $PASS passed, $FAIL failed"
echo "════════════════════════════════════════"

if [ $FAIL -gt 0 ]; then
  echo "  ⚠ Fix the failures before publishing!"
  exit 1
else
  echo "  ✓ All checks passed. Safe to publish."
  exit 0
fi
