# Research Report: Chrome Web Store Auto-Publish

**Date:** 2026-01-16
**Topic:** Automated Chrome extension submission to Chrome Web Store

## Executive Summary

Chrome Web Store publishing can be fully automated using the Chrome Web Store API v2 with GitHub Actions. Setup requires creating OAuth credentials in Google Cloud Console and storing them as GitHub Secrets. Popular actions like `mnao305/chrome-extension-upload` handle upload + publish in one step.

**Key requirement:** First submission must be manual to get extension ID.

## Setup Steps

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.developers.google.com)
2. Create project or select existing
3. Search "Chrome Web Store API" → Enable it
4. Go to OAuth consent screen → Select "External" → Create
5. Fill app info, add your email as test user

### 2. Create OAuth Credentials

1. Go to Credentials → Create Credentials → OAuth client ID
2. Select "Web application"
3. Add redirect URI: `https://developers.google.com/oauthplayground`
4. **Save client_id and client_secret immediately** (secret only visible once after June 2025)

### 3. Get Refresh Token

1. Open [OAuth Playground](https://developers.google.com/oauthplayground)
2. Settings → Enable "Use your own OAuth credentials"
3. Enter client_id and client_secret
4. Input scope: `https://www.googleapis.com/auth/chromewebstore`
5. Click "Authorize APIs" → Sign in
6. Click "Exchange authorization code for tokens"
7. Copy the **refresh_token**

### 4. Get Extension ID & Publisher ID

- **Extension ID:** From Developer Dashboard URL after first manual upload
- **Publisher ID:** Developer Dashboard → Account section

## GitHub Actions Implementation

### Recommended Action: mnao305/chrome-extension-upload

```yaml
name: Publish to Chrome Web Store

on:
  workflow_dispatch:  # Manual trigger
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - run: npm ci
      - run: npm run build:release

      - name: Package extension
        run: cd dist && zip -r ../extension.zip .

      - name: Upload to Chrome Web Store
        uses: mnao305/chrome-extension-upload@v5.0.0
        with:
          file-path: extension.zip
          extension-id: ${{ secrets.EXTENSION_ID }}
          client-id: ${{ secrets.CWS_CLIENT_ID }}
          client-secret: ${{ secrets.CWS_CLIENT_SECRET }}
          refresh-token: ${{ secrets.CWS_REFRESH_TOKEN }}
          publish: true  # Set false to upload without publishing
```

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `EXTENSION_ID` | 32-char extension ID from dashboard |
| `CWS_CLIENT_ID` | OAuth client ID |
| `CWS_CLIENT_SECRET` | OAuth client secret |
| `CWS_REFRESH_TOKEN` | OAuth refresh token |

### Alternative Actions

| Action | Features |
|--------|----------|
| [mnao305/chrome-extension-upload](https://github.com/mnao305/chrome-extension-upload) | Upload + publish, glob support |
| [browser-actions/release-chrome-extension](https://github.com/browser-actions/release-chrome-extension) | Simple publish |
| [mobilefirstllc/cws-publish](https://github.com/marketplace/actions/publish-chrome-extension-to-chrome-web-store) | Upload/publish/testers modes |

## Review Process

### Timeline
- **Typical review:** 1-3 business days
- **First submission:** May take longer
- **Updates:** Usually faster

### Common Rejection Reasons
1. Missing privacy policy
2. Excessive permissions
3. Misleading description
4. Policy violations (ads, malware)
5. Broken functionality

### Handling Review Status

```yaml
- name: Check publish status
  run: |
    # API returns status after publish
    # PENDING_REVIEW, PUBLISHED, REJECTED
```

## Workflow Options

### Option 1: Full Auto-Publish
```yaml
publish: true  # Uploads and submits for review
```

### Option 2: Upload Only (Manual Review)
```yaml
publish: false  # Uploads as draft, manual submit
```

### Option 3: Staged Rollout
- Publish to testers first
- Gradually increase rollout percentage
- Use `publishTarget: trustedTesters`

## Security Best Practices

1. **Never commit credentials** - Use GitHub Secrets only
2. **Rotate refresh tokens** - Periodically regenerate
3. **Limit repository access** - Only maintainers can trigger
4. **Use environment protection** - Require approval for production

## Complete Release Workflow

```yaml
name: Release

on:
  workflow_dispatch:
    inputs:
      publish_to_store:
        description: 'Publish to Chrome Web Store'
        type: boolean
        default: false

permissions:
  contents: write

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - run: npm ci
      - run: npm run test:unit
      - run: npm run build:release

      - name: Get version
        id: version
        run: echo "version=$(node -p \"require('./package.json').version\")" >> $GITHUB_OUTPUT

      - name: Package extension
        run: cd dist && zip -r ../vocabulary-extension-v${{ steps.version.outputs.version }}.zip .

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          tag_name: v${{ steps.version.outputs.version }}
          files: vocabulary-extension-v${{ steps.version.outputs.version }}.zip

      - name: Publish to Chrome Web Store
        if: ${{ inputs.publish_to_store }}
        uses: mnao305/chrome-extension-upload@v5.0.0
        with:
          file-path: vocabulary-extension-v${{ steps.version.outputs.version }}.zip
          extension-id: ${{ secrets.EXTENSION_ID }}
          client-id: ${{ secrets.CWS_CLIENT_ID }}
          client-secret: ${{ secrets.CWS_CLIENT_SECRET }}
          refresh-token: ${{ secrets.CWS_REFRESH_TOKEN }}
```

## Resources

- [Chrome Web Store API Docs](https://developer.chrome.com/docs/webstore/using-api)
- [Service Accounts for CI/CD](https://developer.chrome.com/docs/webstore/service-accounts)
- [mnao305/chrome-extension-upload](https://github.com/mnao305/chrome-extension-upload)
- [Chrome Extension Publishing Guide](https://jam.dev/blog/automating-chrome-extension-publishing/)

## Checklist Before Auto-Publish

- [ ] First manual submission completed
- [ ] Extension ID obtained
- [ ] OAuth credentials created
- [ ] Refresh token generated
- [ ] GitHub Secrets configured
- [ ] Privacy policy URL set in dashboard
- [ ] Store listing completed

## Unresolved Questions

- Refresh token may expire if unused for 6 months - need scheduled token refresh?
- Service account vs OAuth for CI/CD - which is more reliable long-term?
