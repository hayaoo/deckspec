#!/bin/bash
# test-distribution.sh — ユーザー環境を再現して init → validate → render を検証
#
# Usage: ./scripts/test-distribution.sh
#
# publish 前に実行し、ユーザーが体験するフローを再現する。
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

# ─── Step 1: Build ──────────────────────────────────────────────────
log "Step 1: Building packages"
cd "$REPO_ROOT"
pnpm build > /dev/null 2>&1
pass "pnpm build succeeded"

# ─── Step 2: Pack all packages (simulate npm publish) ────────────────
log "Step 2: Packing all packages"
cd "$REPO_ROOT/packages/cli"
CLI_TGZ_PATH=$(pnpm pack --pack-destination "$TEST_DIR" 2>/dev/null | tail -1)

# Verify dist/ in CLI tarball
if tar tzf "$CLI_TGZ_PATH" | grep -q "package/dist/cli.js"; then
  pass "CLI: dist/cli.js in tarball"
else
  fail "CLI: dist/cli.js NOT in tarball"
fi

# Verify templates/ in CLI tarball
if tar tzf "$CLI_TGZ_PATH" | grep -q "package/templates/noir-display"; then
  pass "CLI: templates/noir-display in tarball"
else
  fail "CLI: templates/noir-display NOT in tarball"
fi

if tar tzf "$CLI_TGZ_PATH" | grep -q "package/templates/skills/deckspec-make-slides"; then
  pass "CLI: skills in tarball"
else
  fail "CLI: skills NOT in tarball"
fi

# Pack dependency packages
for pkg in schema dsl renderer; do
  cd "$REPO_ROOT/packages/$pkg"
  PKG_TGZ_PATH=$(pnpm pack --pack-destination "$TEST_DIR" 2>/dev/null | tail -1)
  if tar tzf "$PKG_TGZ_PATH" | grep -q "package/dist/"; then
    pass "@deckspec/$pkg: dist/ in tarball"
  else
    fail "@deckspec/$pkg: dist/ NOT in tarball"
  fi
done

# ─── Step 3: deckspec init in isolated directory ─────────────────────
log "Step 3: Testing deckspec init"

# Install CLI from tarball in a temp location to get the binary
TOOL_DIR="$TEST_DIR/tool"
mkdir -p "$TOOL_DIR"
cd "$TOOL_DIR"
npm init -y > /dev/null 2>&1
if ! npm install "$CLI_TGZ_PATH" > /dev/null 2>&1; then
  fail "CLI tarball install failed"
  npm install "$CLI_TGZ_PATH" 2>&1 | tail -10
else
  pass "CLI installed from tarball"
fi

# Run init
INIT_DIR="$TEST_DIR/init-project"
npx deckspec init "$INIT_DIR" --theme noir-display 2>&1 || true

# Check generated files
for f in CLAUDE.md .gitignore "decks/sample/deck.yaml" package.json; do
  if [ -f "$INIT_DIR/$f" ]; then
    pass "init: $f generated"
  else
    fail "init: $f NOT generated"
  fi
done

for d in "themes/noir-display/patterns" ".claude/skills"; do
  if [ -d "$INIT_DIR/$d" ]; then
    pass "init: $d/ exists"
  else
    fail "init: $d/ NOT found"
  fi
done

# No dist/ leaked
if [ -d "$INIT_DIR/themes/noir-display/dist" ]; then
  fail "init: dist/ leaked into theme"
else
  pass "init: no dist/ in theme"
fi

# ─── Step 4: Check package.json has theme dependencies ───────────────
log "Step 4: Checking init package.json dependencies"
cd "$INIT_DIR"

for dep in "lucide-react" "@phosphor-icons/react" "react" "react-dom" "zod"; do
  if grep -q "\"$dep\"" package.json; then
    pass "package.json: $dep listed"
  else
    fail "package.json: $dep MISSING"
  fi
done

# ─── Step 5: Install deps + local CLI tarballs ──────────────────────
log "Step 5: Installing dependencies in init project"
npm install > /dev/null 2>&1

# Also install CLI + core from local tarballs (override npm registry versions)
for tgz in "$TEST_DIR"/deckspec-*.tgz; do
  npm install "$tgz" > /dev/null 2>&1
done
pass "Dependencies installed"

# ─── Step 6: Validate sample deck ───────────────────────────────────
log "Step 6: Testing validate (sample deck)"
if npx deckspec validate decks/sample/deck.yaml 2>&1; then
  pass "validate: sample deck OK"
else
  fail "validate: sample deck FAILED"
fi

# ─── Step 7: Render sample deck ─────────────────────────────────────
log "Step 7: Testing render (sample deck)"
if npx deckspec render decks/sample/deck.yaml -o "$TEST_DIR/output" 2>&1; then
  if [ -f "$TEST_DIR/output/index.html" ]; then
    pass "render: output/index.html created"
  else
    fail "render: no index.html in output"
  fi
else
  fail "render: command failed"
fi

# ─── Step 8: Validate all-patterns deck (catches missing deps) ──────
log "Step 8: Testing validate with ALL patterns"

# Generate a deck that uses every pattern
PATTERNS_DIR="$INIT_DIR/themes/noir-display/patterns"
ALL_DECK="$INIT_DIR/decks/all-patterns/deck.yaml"
mkdir -p "$(dirname "$ALL_DECK")"

echo "meta:" > "$ALL_DECK"
echo "  title: All Patterns Test" >> "$ALL_DECK"
echo "  theme: noir-display" >> "$ALL_DECK"
echo "slides:" >> "$ALL_DECK"

PATTERN_COUNT=0
for patternDir in "$PATTERNS_DIR"/*/; do
  pname=$(basename "$patternDir")
  if [ "$pname" = "_lib" ]; then continue; fi
  echo "  - file: $pname" >> "$ALL_DECK"
  echo "    vars: {}" >> "$ALL_DECK"
  PATTERN_COUNT=$((PATTERN_COUNT + 1))
done

echo "  Generated deck with $PATTERN_COUNT patterns"

# Validate — we expect schema errors (empty vars) but NOT import errors
VALIDATE_OUT=$(npx deckspec validate "$ALL_DECK" 2>&1 || true)
if echo "$VALIDATE_OUT" | grep -qi "cannot find module\|module not found\|ERR_MODULE_NOT_FOUND"; then
  fail "validate: missing module dependency detected"
  echo "$VALIDATE_OUT" | grep -i "cannot find\|not found\|ERR_MODULE" | head -5
else
  pass "validate: all patterns loadable (no missing deps)"
fi

# ─── Step 9: Test patterns command ──────────────────────────────────
log "Step 9: Testing patterns command"
PATTERNS_OUT=$(npx deckspec patterns 2>&1 || true)
LOADED=$(echo "$PATTERNS_OUT" | grep -c ":" || true)
FAILED=$(echo "$PATTERNS_OUT" | grep -c "failed to load" || true)

if [ "$FAILED" -gt 0 ]; then
  fail "patterns: $FAILED pattern(s) failed to load"
  echo "$PATTERNS_OUT" | grep "failed to load"
else
  pass "patterns: all $LOADED patterns loaded"
fi

# ─── Step 10: Data leak check ────────────────────────────────────────
log "Step 10: Checking for data leaks"
if grep -rq "hashimotoya\|clean-slate" "$INIT_DIR/" --include="*.md" --include="*.yaml" --include="*.json" --include="*.ts" --include="*.tsx" --include="*.mjs" 2>/dev/null; then
  fail "Client-specific references found!"
  grep -rn "hashimotoya\|clean-slate" "$INIT_DIR/" --include="*.md" --include="*.yaml" --include="*.json" --include="*.ts" --include="*.tsx" --include="*.mjs" 2>/dev/null | head -5
else
  pass "No client-specific references"
fi

# ─── Summary ────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════"
echo "  Results: $PASS passed, $FAIL failed"
echo "════════════════════════════════════════"

if [ $FAIL -gt 0 ]; then
  echo "  ⚠ Fix failures before publishing!"
  exit 1
else
  echo "  ✓ All checks passed. Safe to publish."
  exit 0
fi
