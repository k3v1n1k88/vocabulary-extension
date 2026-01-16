# Phase 04: GitHub Actions CI

## Context

- **Parent Plan:** [plan.md](./plan.md)
- **Dependencies:** Phase 01, 02, 03
- **Docs:** [GitHub Actions](https://docs.github.com/en/actions), [Conventional Commits](https://www.conventionalcommits.org/)

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-01-16 |
| Description | Configure GitHub Actions for testing, version tagging, and changelog |
| Priority | P2 |
| Implementation Status | pending |
| Review Status | pending |

## Key Insights

1. Run unit tests first (fast feedback)
2. E2E tests need `xvfb-run` for headful Chrome on Linux
3. Cache Playwright browsers for speed
4. Separate workflows: test.yml (CI) + release.yml (CD)
5. Use conventional commits for auto-changelog
6. Version from package.json, auto-tag on release
7. Chrome Web Store API for auto-publish (optional flag)
8. First CWS submission must be manual to get extension ID

## Requirements

- [ ] Create .github/workflows/test.yml (CI)
- [ ] Create .github/workflows/release.yml (CD)
- [ ] Auto version tagging from package.json
- [ ] Auto changelog generation
- [ ] Cache dependencies for speed
- [ ] Chrome Web Store auto-publish (optional)
- [ ] GitHub Secrets for CWS credentials

## Architecture

```
Workflows:
┌──────────────────────────────────────────────────────────┐
│ test.yml (on push/PR)                                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │   Lint   │  │  Unit    │  │   E2E    │  (parallel)   │
│  │          │  │  Tests   │  │  Tests   │               │
│  └──────────┘  └──────────┘  └──────────┘               │
└──────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ release.yml (manual trigger)                                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────┐ │
│  │  Tests   │─▶│  Build   │─▶│ Changelog│─▶│  Tag &   │─▶│  CWS  │ │
│  │  Pass    │  │ Release  │  │  Update  │  │ Release  │  │Publish│ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └───────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                                              (optional)
```

## Related Code Files

| File | Purpose |
|------|---------|
| `commitlint.config.js` | Commit message rules |
| `.husky/commit-msg` | Git hook for validation |
| `.github/workflows/test.yml` | CI - runs on push/PR |
| `.github/workflows/release.yml` | CD - manual release with tagging |

## Implementation Steps

### Step 0: Setup Conventional Commits (commitlint + husky)

**Install dependencies:**
```bash
npm install -D @commitlint/cli @commitlint/config-conventional husky
```

**Initialize husky:**
```bash
npx husky init
```

**Create commitlint.config.js:**
```javascript
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', [
      'feat',     // New feature
      'fix',      // Bug fix
      'docs',     // Documentation
      'style',    // Formatting (no code change)
      'refactor', // Code change (no feature/fix)
      'test',     // Adding tests
      'chore',    // Maintenance
      'perf',     // Performance
      'ci',       // CI/CD changes
      'build',    // Build system
      'revert'    // Revert commit
    ]],
    'subject-case': [2, 'always', 'lower-case'],
    'subject-empty': [2, 'never'],
    'type-empty': [2, 'never']
  }
}
```

**Create .husky/commit-msg:**
```bash
npx --no -- commitlint --edit $1
```

**Add prepare script to package.json:**
```json
{
  "scripts": {
    "prepare": "husky"
  }
}
```

**Commit message examples:**
```
feat: add vocabulary export feature
fix: resolve storage quota error
docs: update README with installation steps
chore: bump version to 1.0.2
refactor: extract translation logic to service
test: add unit tests for spaced repetition
ci: add GitHub Actions workflow
```

### Step 1: Create .github/workflows/test.yml

```yaml
name: Tests

on:
  push:
    branches: [master, main]
  pull_request:
    branches: [master, main]

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run test:unit
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage
          path: coverage/

  e2e-tests:
    name: E2E Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci

      # Cache Playwright browsers
      - uses: actions/cache@v4
        with:
          path: ~/.cache/ms-playwright
          key: playwright-${{ runner.os }}-${{ hashFiles('**/package-lock.json') }}

      - run: npx playwright install chromium --with-deps
      - run: npm run build
      - run: xvfb-run -a npx playwright test

      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

### Step 2: Create .github/workflows/release.yml

```yaml
name: Release

on:
  workflow_dispatch:
    inputs:
      release_type:
        description: 'Release type'
        required: true
        default: 'patch'
        type: choice
        options:
          - patch
          - minor
          - major
      publish_to_store:
        description: 'Publish to Chrome Web Store'
        type: boolean
        default: false

permissions:
  contents: write

jobs:
  release:
    name: Create Release
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history for changelog
          token: ${{ secrets.GITHUB_TOKEN }}

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - run: npm ci

      # Run tests first
      - run: npm run test:unit

      # Get current version from package.json
      - name: Get version
        id: version
        run: |
          VERSION=$(node -p "require('./package.json').version")
          echo "version=$VERSION" >> $GITHUB_OUTPUT
          echo "Current version: $VERSION"

      # Build release version
      - run: npm run build:release

      # Generate changelog from commits
      - name: Generate changelog
        id: changelog
        run: |
          # Get commits since last tag
          LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
          if [ -z "$LAST_TAG" ]; then
            COMMITS=$(git log --pretty=format:"- %s" --no-merges)
          else
            COMMITS=$(git log ${LAST_TAG}..HEAD --pretty=format:"- %s" --no-merges)
          fi

          # Save to file for release notes
          echo "$COMMITS" > /tmp/changelog.txt

          # Format for output (escape newlines)
          CHANGELOG=$(echo "$COMMITS" | head -20)
          echo "changelog<<EOF" >> $GITHUB_OUTPUT
          echo "$CHANGELOG" >> $GITHUB_OUTPUT
          echo "EOF" >> $GITHUB_OUTPUT

      # Update CHANGELOG.md
      - name: Update CHANGELOG.md
        run: |
          VERSION="${{ steps.version.outputs.version }}"
          DATE=$(date +%Y-%m-%d)

          # Create new changelog entry
          NEW_ENTRY="## [$VERSION] - $DATE\n\n$(cat /tmp/changelog.txt)\n\n"

          # Insert after header in CHANGELOG.md
          if [ -f docs/CHANGELOG.md ]; then
            sed -i "s/# Changelog/# Changelog\n\n${NEW_ENTRY}/" docs/CHANGELOG.md
          fi

      # Create zip for Chrome Web Store
      - name: Package extension
        run: |
          cd dist && zip -r ../vocabulary-extension-v${{ steps.version.outputs.version }}.zip .

      # Commit changelog update
      - name: Commit changelog
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add docs/CHANGELOG.md || true
          git diff --staged --quiet || git commit -m "docs: update changelog for v${{ steps.version.outputs.version }}"
          git push

      # Create git tag
      - name: Create tag
        run: |
          VERSION="${{ steps.version.outputs.version }}"
          git tag -a "v$VERSION" -m "Release v$VERSION"
          git push origin "v$VERSION"

      # Create GitHub release
      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          tag_name: v${{ steps.version.outputs.version }}
          name: v${{ steps.version.outputs.version }}
          body: |
            ## Changes

            ${{ steps.changelog.outputs.changelog }}

            ## Installation

            Download `vocabulary-extension-v${{ steps.version.outputs.version }}.zip` and load as unpacked extension, or install from Chrome Web Store.
          files: |
            vocabulary-extension-v${{ steps.version.outputs.version }}.zip
          draft: false
          prerelease: false

      # Publish to Chrome Web Store (optional)
      - name: Publish to Chrome Web Store
        if: ${{ inputs.publish_to_store }}
        uses: mnao305/chrome-extension-upload@v5.0.0
        with:
          file-path: vocabulary-extension-v${{ steps.version.outputs.version }}.zip
          extension-id: ${{ secrets.EXTENSION_ID }}
          client-id: ${{ secrets.CWS_CLIENT_ID }}
          client-secret: ${{ secrets.CWS_CLIENT_SECRET }}
          refresh-token: ${{ secrets.CWS_REFRESH_TOKEN }}
          publish: true
```

### Step 3: Add npm scripts for versioning

```json
{
  "scripts": {
    "version:patch": "npm version patch --no-git-tag-version",
    "version:minor": "npm version minor --no-git-tag-version",
    "version:major": "npm version major --no-git-tag-version"
  }
}
```

### Step 4: Setup Chrome Web Store API (for auto-publish)

**Prerequisites:**
- First manual submission completed (to get extension ID)
- Google Cloud project with Chrome Web Store API enabled

**Setup Steps:**

1. **Enable API in Google Cloud Console:**
   - Go to [Google Cloud Console](https://console.developers.google.com)
   - Create/select project → Search "Chrome Web Store API" → Enable

2. **Create OAuth Credentials:**
   - Go to Credentials → Create Credentials → OAuth client ID
   - Select "Web application"
   - Add redirect URI: `https://developers.google.com/oauthplayground`
   - Save client_id and client_secret

3. **Get Refresh Token:**
   - Open [OAuth Playground](https://developers.google.com/oauthplayground)
   - Settings → Enable "Use your own OAuth credentials"
   - Enter client_id and client_secret
   - Scope: `https://www.googleapis.com/auth/chromewebstore`
   - Authorize → Exchange for tokens → Copy refresh_token

4. **Add GitHub Secrets:**

| Secret | Value |
|--------|-------|
| `EXTENSION_ID` | 32-char extension ID from CWS dashboard |
| `CWS_CLIENT_ID` | OAuth client ID |
| `CWS_CLIENT_SECRET` | OAuth client secret |
| `CWS_REFRESH_TOKEN` | OAuth refresh token |

## Release Workflow

1. **Update version locally:**
   ```bash
   npm run version:patch  # or minor/major
   ```

2. **Update manifest version** (should sync with package.json)

3. **Commit version bump:**
   ```bash
   git add package.json src/manifest.ts
   git commit -m "chore: bump version to x.x.x"
   git push
   ```

4. **Trigger release workflow:**
   - Go to Actions → Release → Run workflow
   - Select release type
   - Check "Publish to Chrome Web Store" if desired
   - Workflow will: test → build → changelog → tag → release → (optional) CWS publish

## Todo List

- [ ] Install commitlint + husky
- [ ] Create commitlint.config.js
- [ ] Setup .husky/commit-msg hook
- [ ] Create .github/workflows/test.yml
- [ ] Create .github/workflows/release.yml
- [ ] Add version scripts to package.json
- [ ] Test CI workflow on push
- [ ] Test release workflow manually
- [ ] Verify changelog auto-update
- [ ] Setup Chrome Web Store API credentials (optional)
- [ ] Add CWS secrets to GitHub repository (optional)
- [ ] Test CWS auto-publish (optional)

## Success Criteria

1. Commitlint blocks invalid commit messages
2. Test workflow triggers on push/PR
3. All test jobs pass
4. Release workflow creates git tag
5. Changelog auto-updates with commits
6. GitHub release created with zip artifact
7. Version synced: package.json ↔ manifest.ts
8. CWS publish uploads extension when enabled (optional)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| E2E flaky in CI | Medium | Medium | Retries, xvfb |
| Changelog format issues | Low | Low | Review before release |
| Tag already exists | Low | Medium | Check before creating |
| Version mismatch | Medium | Medium | Sync package.json + manifest |
| CWS review rejection | Medium | Low | Review takes 1-3 days, fix issues |
| Refresh token expired | Low | Medium | Scheduled token refresh or regenerate |

## Security Considerations

- Use GITHUB_TOKEN (automatic) for releases
- Don't expose API keys in logs
- Review changelog for sensitive info
- Store CWS credentials as GitHub Secrets only
- Rotate refresh_token periodically (expires if unused 6 months)
- Limit repository access - only maintainers can trigger release

## Next Steps

After CI/CD working:
1. Add status badge to README
2. Consider semantic-release for full automation
3. Add Chrome Web Store API publishing (optional)
