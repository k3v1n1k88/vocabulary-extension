# Deployment Guide

Complete guide for building, testing, and publishing Vocabulary Builder Chrome Extension.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Build for Production](#build-for-production)
- [Local Testing](#local-testing)
- [CI/CD Pipeline](#cicd-pipeline)
- [Chrome Web Store Publishing](#chrome-web-store-publishing)
- [Version Management](#version-management)
- [Release Checklist](#release-checklist)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Development Environment
- Node.js 18+
- npm or yarn
- Chrome browser (latest stable)

### Accounts Required
- [Chrome Web Store Developer Account](https://chrome.google.com/webstore/devconsole) ($5 one-time fee)
- [OpenAI Platform Account](https://platform.openai.com) (for translation API)

---

## Build for Production

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Type Check
```bash
npx tsc --noEmit
```

### 3. Build Extension
```bash
npm run build
```

**Output:** `dist/` folder containing:
```
dist/
├── manifest.json          # Extension manifest (MV3)
├── service-worker-loader.js
├── icons/
│   ├── icon-16.png
│   ├── icon-32.png
│   ├── icon-48.png
│   └── icon-128.png
├── src/
│   ├── popup/index.html
│   └── options/index.html
└── assets/
    ├── *.js               # Bundled JavaScript
    └── *.css              # Bundled CSS
```

### 4. Create ZIP for Upload
```bash
# Windows (PowerShell)
Compress-Archive -Path dist\* -DestinationPath vocabulary-builder-v1.0.0.zip

# Linux/macOS
cd dist && zip -r ../vocabulary-builder-v1.0.0.zip .
```

---

## Local Testing

### Load Unpacked Extension

1. Open Chrome → `chrome://extensions/`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `dist/` folder
5. Extension icon appears in toolbar

### Test Checklist

| Feature | Test Steps |
|---------|------------|
| Word Lookup | Select text → Right-click → "Look up / Translate" |
| Translation | Select multiple words → Floating menu → Translate |
| Save Word | Look up word → Click "Save to Vocabulary" |
| Flashcards | Open popup → Study tab → Review cards |
| Audio | Click speaker icon on any word |
| Notifications | Settings → Enable reminders → Test |
| Keyboard Shortcut | Settings → Enable shortcut → Select text → Press keys |

### Debugging

```bash
# Service worker logs
chrome://extensions/ → Vocabulary Builder → "Inspect views: service worker"

# Content script logs
Right-click page → Inspect → Console (filter: [VocabExt])

# Popup logs
Right-click extension icon → Inspect popup
```

---

## CI/CD Pipeline

GitHub Actions automates testing on every push/PR and releases via manual trigger.

### Workflows Overview

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `test.yml` | Push/PR to master | Lint, unit tests, E2E tests |
| `release.yml` | Manual dispatch | Create GitHub release, optional CWS publish |

### Test Workflow (Automatic)

**No manual setup required.** Runs automatically on:
- Push to `master`/`main` branch
- Pull requests targeting `master`/`main`

**Jobs:**
1. **Lint** - ESLint checks
2. **Unit Tests** - Vitest with coverage
3. **E2E Tests** - Playwright with Chromium

### Release Workflow (Manual Setup Required)

#### Step 1: No Setup for Basic Releases

Basic GitHub releases work out-of-the-box:
- Creates git tag
- Generates changelog from commits
- Uploads extension ZIP to GitHub Releases

**To trigger:** Actions → Release → Run workflow → Select release type

#### Step 2: Chrome Web Store Auto-Publish (Optional)

To enable automatic publishing to Chrome Web Store, configure these secrets:

**Required Secrets** (Settings → Secrets → Actions → New repository secret):

| Secret | Description | How to Get |
|--------|-------------|------------|
| `EXTENSION_ID` | Your CWS extension ID | CWS Developer Dashboard → Your extension → URL contains ID |
| `CWS_CLIENT_ID` | Google Cloud OAuth client ID | See below |
| `CWS_CLIENT_SECRET` | Google Cloud OAuth client secret | See below |
| `CWS_REFRESH_TOKEN` | OAuth refresh token | See below |

#### Step 3: Generate Chrome Web Store API Credentials

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create new project (e.g., "Vocabulary Extension CI")
   - Enable "Chrome Web Store API"

2. **Create OAuth Credentials**
   ```
   APIs & Services → Credentials → Create Credentials → OAuth client ID
   Application type: Desktop app
   Name: CI/CD Publisher
   ```
   Save the **Client ID** and **Client Secret**

3. **Get Refresh Token**
   ```bash
   # Replace YOUR_CLIENT_ID with actual value
   # Open this URL in browser:
   https://accounts.google.com/o/oauth2/auth?response_type=code&scope=https://www.googleapis.com/auth/chromewebstore&client_id=YOUR_CLIENT_ID&redirect_uri=urn:ietf:wg:oauth:2.0:oob

   # After authorization, you get an authorization code
   # Exchange it for refresh token:
   curl -X POST "https://oauth2.googleapis.com/token" \
     -d "client_id=YOUR_CLIENT_ID" \
     -d "client_secret=YOUR_CLIENT_SECRET" \
     -d "code=YOUR_AUTH_CODE" \
     -d "grant_type=authorization_code" \
     -d "redirect_uri=urn:ietf:wg:oauth:2.0:oob"
   ```
   Save the **refresh_token** from response

4. **Add Secrets to GitHub**
   - Go to repo Settings → Secrets and variables → Actions
   - Add each secret with exact names above

#### Running a Release

```bash
# 1. Bump version locally first
npm run version:patch  # or version:minor, version:major

# 2. Commit version change
git add package.json
git commit -m "chore: bump version to X.X.X"
git push

# 3. Trigger release workflow
# GitHub → Actions → Release → Run workflow
# Select release type and whether to publish to CWS
```

### Pre-commit Hooks (Local)

Husky runs automatically on commit:
- **lint-staged** - ESLint fix on staged `.ts/.tsx` files
- **tsc --noEmit** - TypeScript type checking

First-time setup (automatic via `npm install`):
```bash
npm install  # Runs "prepare" script which installs husky
```

### Commit Message Format

Commitlint enforces [Conventional Commits](https://conventionalcommits.org):

```
type(scope): description

# Examples:
feat(popup): add dark mode toggle
fix(storage): handle quota exceeded error
docs: update deployment guide
chore: bump dependencies
```

**Allowed types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

---

## Chrome Web Store Publishing

### First-Time Setup

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Pay $5 registration fee
3. Complete developer verification

### Required Assets

| Asset | Size | Format |
|-------|------|--------|
| Extension ZIP | < 100MB | .zip |
| Store Icon | 128x128 px | PNG |
| Screenshot 1-5 | 1280x800 or 640x400 | PNG/JPG |
| Promotional Tile (Small) | 440x280 px | PNG |
| Promotional Tile (Large) | 920x680 px | PNG (optional) |
| Marquee | 1400x560 px | PNG (optional) |
| **Privacy Policy URL** | - | Hosted webpage |

### Privacy Policy

Host your privacy policy at a public URL. Options:

1. **GitHub Pages** (free):
   - Push `docs/PRIVACY_POLICY.md` to repo
   - Enable GitHub Pages in repo settings
   - URL: `https://username.github.io/vocabulary-extension/PRIVACY_POLICY`

2. **GitHub Gist** (quick):
   - Create gist at [gist.github.com](https://gist.github.com)
   - Paste content from `docs/PRIVACY_POLICY.md`
   - Use raw gist URL

3. **Notion/Google Docs** (easy):
   - Create public page
   - Copy privacy policy content
   - Use share link

Enter the URL in Chrome Web Store → Privacy practices → Privacy policy

### Store Listing Content

**Title:** Vocabulary Builder

**Summary (132 chars max):**
> Learn vocabulary with flashcards, spaced repetition (SM-2), and instant word lookup. Translate to 12+ languages.

**Description:**
```
Vocabulary Builder helps you learn new words efficiently with:

🔍 INSTANT WORD LOOKUP
• Right-click any word to look it up
• See definition, pronunciation, synonyms, antonyms
• Hear audio pronunciation

🌐 MULTI-LANGUAGE TRANSLATION
• Translate to Vietnamese, Chinese, Japanese, Korean, Spanish, French, and more
• Auto-detect source language
• Works with phrases and sentences

📚 SMART FLASHCARDS
• Spaced repetition (SM-2 algorithm)
• Review cards at optimal intervals
• Track your progress

🎮 GAMIFICATION
• Daily streaks to keep you motivated
• XP and level system
• Achievement badges

🔒 PRIVACY FOCUSED
• All data stored locally
• No account required
• Works offline

PERMISSIONS EXPLAINED:
• Storage: Save your vocabulary locally
• Context Menus: Add "Look up" to right-click menu
• Active Tab: Access selected text on pages
• TTS: Pronounce words aloud
• Notifications: Study reminders
• Alarms: Schedule notifications

Free and open source. No ads.
```

**Category:** Education

**Language:** English

### Privacy Practices Tab (Required)

**Single Purpose Description:**
```
This extension helps users learn English vocabulary by looking up word definitions, saving words to flashcards, and studying with spaced repetition.
```

**Permission Justifications:**

| Permission | Justification (copy-paste) |
|------------|---------------------------|
| **activeTab** | Required to read selected text on the current webpage when user right-clicks to look up a word definition. Only accesses text the user explicitly selects. |
| **alarms** | Used to schedule periodic study reminder notifications. No data is collected; alarms only trigger local notifications to remind users to study. |
| **contextMenus** | Adds a "Look up / Translate" option to the right-click menu so users can quickly look up selected words. |
| **host permission** | Required to display word lookup tooltips on any webpage where the user selects text. The extension only reads user-selected text and does not collect browsing data. |
| **notifications** | Displays optional study reminders to help users maintain their learning streak. Users can disable notifications in settings. |
| **storage** | Stores vocabulary words, flashcard progress, and user settings locally on the device. No data is sent to external servers. |
| **tts** | Pronounces English words aloud using the browser's built-in text-to-speech to help users learn correct pronunciation. |

**Remote Code Justification:**
```
This extension does not use remote code. All JavaScript is bundled locally. The only external network requests are:
1. Free Dictionary API (dictionaryapi.dev) - to fetch word definitions
2. OpenAI API (optional, user-provided API key) - for phrase translation

No code is downloaded or executed from remote sources.
```

**Data Usage Certification:**
- ✅ Check: "I certify that my data usage complies with the Developer Program Policies"

### Publish Steps

1. **Upload Package**
   - Dashboard → Add new item → Upload ZIP

2. **Add Store Listing**
   - Fill title, summary, description
   - Upload screenshots
   - Set category and language

3. **Privacy Practices** (see above)
   - Fill Single Purpose Description
   - Fill all permission justifications
   - Fill remote code justification
   - Check data usage certification

4. **Account Tab**
   - Enter contact email
   - Verify email (check inbox)

5. **Submit for Review**
   - Click "Submit for review"
   - Review takes 1-3 business days

### Update Existing Extension

1. Increment version in `package.json` and `src/manifest.ts`
2. Build and create new ZIP
3. Dashboard → Your extension → Package → Upload new package
4. Submit for review

---

## Version Management

### Semantic Versioning

```
MAJOR.MINOR.PATCH
1.0.0 → 1.0.1 (bug fix)
1.0.1 → 1.1.0 (new feature)
1.1.0 → 2.0.0 (breaking change)
```

### Update Version

**Files to update:**
1. `package.json` → `"version": "X.X.X"`
2. `src/manifest.ts` → `version: 'X.X.X'`

```bash
# Update both files
npm version patch  # 1.0.0 → 1.0.1
npm version minor  # 1.0.1 → 1.1.0
npm version major  # 1.1.0 → 2.0.0
```

### Changelog

Maintain `CHANGELOG.md`:
```markdown
## [1.1.0] - 2026-01-15
### Added
- Multi-language translation support
- Keyboard shortcut mode

### Fixed
- Network timeout handling
- Selection race condition
```

---

## Release Checklist

### Pre-Release

- [ ] All tests passing
- [ ] Build succeeds (`npm run build`)
- [ ] Version bumped in `package.json` and `manifest.ts`
- [ ] Changelog updated
- [ ] Local testing complete

### Build & Package

- [ ] Clean build (`rm -rf dist && npm run build`)
- [ ] Create ZIP with version number
- [ ] Verify ZIP contents match `dist/`

### Chrome Web Store

- [ ] Upload new package
- [ ] Update screenshots if UI changed
- [ ] Update description if features changed
- [ ] Submit for review

### Post-Release

- [ ] Create git tag (`git tag v1.1.0`)
- [ ] Push tag (`git push origin v1.1.0`)
- [ ] Create GitHub release with changelog
- [ ] Monitor reviews and crash reports

---

## Troubleshooting

### Build Errors

**TypeScript errors:**
```bash
npx tsc --noEmit  # Check for type errors
```

**Vite build fails:**
```bash
rm -rf node_modules dist
npm install
npm run build
```

### Chrome Web Store Rejection

| Reason | Solution |
|--------|----------|
| "Broad host permissions" | Justify `<all_urls>` - needed for word lookup on any page |
| "Missing privacy policy" | Add privacy policy URL to listing |
| "Functionality not working" | Test all features, check service worker logs |
| "Missing branding" | Ensure icons are distinct, not mimicking other brands |

### Extension Not Loading

1. Check `chrome://extensions/` for errors
2. Click "Errors" button on extension card
3. Reload extension after fixing

### Service Worker Issues

```javascript
// Check if service worker is running
chrome.runtime.getBackgroundPage() // Returns null for MV3

// Debug in DevTools
chrome://extensions/ → service worker → Inspect
```

---

## Quick Commands

```bash
# Development
npm run dev          # Start dev server with HMR

# Production
npm run build        # Build for production
npx tsc --noEmit     # Type check only

# Package
zip -r extension.zip dist/  # Create ZIP (Linux/macOS)

# Version bump
npm version patch    # Bump patch version
```

---

## Support

- **Issues:** [GitHub Issues](#)
- **Documentation:** [README.md](../README.md)
- **Chrome Web Store:** [Extension Page](#)
