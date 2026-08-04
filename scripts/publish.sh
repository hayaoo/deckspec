#!/usr/bin/env bash
# scripts/publish.sh — npm publish は廃止した (2026-08-04)。
#
# 全パッケージが private:true になったため、公開すべきものは何もない。
# 本来は .github/workflows/release.yml の changesets/action から
# `publish:` 指定ごと外すのが筋だが、workflow ファイルの更新には別途
# 権限が要るため、暫定でこのスクリプトが publish 段を無効化している。
#
# workflow 側を更新したらこのファイルは削除してよい。
set -euo pipefail

echo "npm publish is disabled: all @deckspec/* packages are private."
echo "Distribution is via the GitHub source tree only (see README > Distribution)."
exit 0
