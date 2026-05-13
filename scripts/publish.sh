#!/usr/bin/env bash
# scripts/publish.sh — workspace 内の各パッケージを npm CLI で publish する。
#
# changesets/action から呼ばれる。npm Trusted Publisher (OIDC) を使うため、
# pnpm publish ではなく npm publish を直接実行する (pnpm 9.x の OIDC 実装
# は npm Trusted Publisher と組み合わせると 404 を返すバグがあるため)。
#
# 同じバージョンが既に npm に公開されている場合はスキップする。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

for pkg_json in "$ROOT"/packages/*/package.json "$ROOT"/themes/*/package.json; do
  pkg_dir="$(dirname "$pkg_json")"
  name="$(node -p "require('$pkg_json').name")"
  version="$(node -p "require('$pkg_json').version")"

  if [[ "$(node -p "require('$pkg_json').private || false")" == "true" ]]; then
    echo "▸ skip $name (private)"
    continue
  fi

  if npm view "$name@$version" version >/dev/null 2>&1; then
    echo "▸ skip $name@$version (already published)"
    continue
  fi

  echo "▸ publish $name@$version"
  (cd "$pkg_dir" && npm publish --provenance --access public)
done
