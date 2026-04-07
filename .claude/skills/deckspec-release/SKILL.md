---
name: deckspec-release
description: "Use this skill when the user asks to release, publish, version bump, or create a changeset. Triggers on: 'release', 'publish', 'version bump', 'changeset', 'リリース', 'バージョン', '公開'."
---

# Release Skill

Create a changeset, publish to npm, and create a GitHub Release.

## Prerequisites

- On `main` branch with latest changes pulled
- All PRs to be included are already merged to `main`

## Workflow

### 1. Collect changes since last release

```bash
git pull origin main
LAST_TAG=$(gh release view --json tagName --jq '.tagName')
gh pr list --search "is:merged base:main merged:>=$(gh release view --json publishedAt --jq '.publishedAt' | cut -dT -f1)" --json number,title,labels --jq '.[] | "#\(.number) \(.title)"'
```

Review the merged PRs and categorize:
- **feat**: new features → `minor`
- **fix**: bug fixes → `patch`
- **chore/ci/docs**: infrastructure → usually no version bump needed, but include in release notes if user-facing

### 2. Create changeset

Create `.changeset/<descriptive-name>.md`:

```markdown
---
"@deckspec/renderer": patch
"@deckspec/cli": patch
---

Short description of changes
```

**Rules:**
- All 5 packages are in a fixed group (`cli`, `dsl`, `schema`, `renderer`, `theme-noir-display`), so listing any one will bump all — but list only the packages that actually changed
- Choose `patch` for fixes, `minor` for features, `major` for breaking changes
- Keep the description concise (1-3 lines)
- Security-related changes: describe the user-facing benefit, not the vulnerability details

### 3. Commit & push

```bash
git add .changeset/<name>.md
git commit -m "chore: add changeset for <description>"
git push origin main
```

### 4. Wait for Version PR

GitHub Actions (release.yml) will automatically:
1. Run `changeset version` to bump package versions
2. Create a "Version Packages" PR on `changeset-release/main` branch

Check for it:
```bash
gh pr list --head changeset-release/main
```

If it doesn't appear within 2 minutes, check the release workflow:
```bash
gh run list --workflow=release.yml --limit 1
```

### 5. Merge Version PR

```bash
gh pr merge <number> --merge --admin
```

This triggers the release workflow again, which runs `pnpm -r publish --provenance`.

### 6. Verify npm publish

```bash
npm view @deckspec/cli version
```

Confirm the new version is live.

### 7. Create GitHub Release

```bash
gh release create v<version> --title "v<version> — <summary>" --notes "$(cat <<'EOF'
## Highlights

- **Feature/fix name** — brief description
- ...

## What's Changed (since v<prev>)

See [CHANGELOG](https://github.com/hayaoo/deckspec/blob/main/packages/cli/CHANGELOG.md)
EOF
)"
```

**Release notes policy:**
- Security fixes: describe the improvement from user's perspective (e.g., "ダッシュボードクラッシュ修正"), NOT the vulnerability
- Infrastructure changes (CI, dependabot, etc.): omit unless user-facing
- Dependency updates: summarize as one bullet ("依存パッケージの更新")

## Troubleshooting

| Problem | Solution |
|---|---|
| Version PR not created | Check Settings → Actions → General → "Allow GitHub Actions to create and approve pull requests" |
| npm publish fails with ENEEDAUTH | Set `NPM_TOKEN` in Settings → Secrets → Actions |
| Version PR has merge conflict | Delete `changeset-release/main` branch and re-run release workflow |
