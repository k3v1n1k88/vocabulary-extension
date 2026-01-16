# Phase 03: Playwright E2E Setup

## Context

- **Parent Plan:** [plan.md](./plan.md)
- **Dependencies:** Phase 01 (build working)
- **Docs:** [Playwright Chrome Extensions](https://playwright.dev/docs/chrome-extensions)

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-01-16 |
| Description | Configure Playwright for extension E2E testing |
| Priority | P2 |
| Implementation Status | pending |
| Review Status | pending |

## Key Insights

1. Extensions require `chromium.launchPersistentContext`
2. Use `--load-extension` and `--disable-extensions-except` flags
3. Service worker URL provides extension ID
4. Must build extension first before E2E tests

## Requirements

- [ ] Install Playwright
- [ ] Create playwright.config.ts
- [ ] Create extension fixture for loading
- [ ] Write basic popup E2E test
- [ ] Verify extension loads correctly

## Architecture

```
tests/
└── e2e/
    ├── fixtures.ts      # Extension loading fixture
    ├── popup.spec.ts    # Popup tests
    └── global-setup.ts  # Build extension before tests
playwright.config.ts
```

## Related Code Files

| File | Purpose |
|------|---------|
| `playwright.config.ts` | Playwright configuration |
| `tests/e2e/fixtures.ts` | Extension context fixture |
| `tests/e2e/popup.spec.ts` | Popup E2E tests |

## Implementation Steps

### Step 1: Install Playwright

```bash
npm install -D @playwright/test
npx playwright install chromium
```

### Step 2: Create playwright.config.ts

```typescript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  retries: 1,
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { channel: 'chromium' },
    },
  ],
})
```

### Step 3: Create tests/e2e/fixtures.ts

```typescript
import { test as base, chromium, type BrowserContext } from '@playwright/test'
import path from 'path'

export const test = base.extend<{
  context: BrowserContext
  extensionId: string
}>({
  context: async ({}, use) => {
    const pathToExtension = path.join(__dirname, '../../dist')
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      headless: false, // Extensions don't work in old headless
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    })
    await use(context)
    await context.close()
  },
  extensionId: async ({ context }, use) => {
    // Wait for service worker to register
    let [serviceWorker] = context.serviceWorkers()
    if (!serviceWorker) {
      serviceWorker = await context.waitForEvent('serviceworker')
    }
    const extensionId = serviceWorker.url().split('/')[2]
    await use(extensionId)
  },
})

export { expect } from '@playwright/test'
```

### Step 4: Create tests/e2e/popup.spec.ts

```typescript
import { test, expect } from './fixtures'

test.describe('Popup', () => {
  test('displays dashboard by default', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/src/popup/index.html`)

    // Check dashboard tab is visible
    await expect(page.locator('text=Dashboard')).toBeVisible()
  })

  test('navigates between tabs', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/src/popup/index.html`)

    // Click vocabulary tab
    await page.click('text=Vocabulary')
    await expect(page.locator('text=Your Vocabulary')).toBeVisible()

    // Click study tab
    await page.click('text=Study')
    await expect(page.locator('text=Start')).toBeVisible()
  })
})
```

### Step 5: Add E2E script to package.json

```json
{
  "scripts": {
    "test:e2e": "npm run build && playwright test",
    "test:e2e:ui": "npm run build && playwright test --ui"
  }
}
```

## Todo List

- [ ] Install @playwright/test and chromium browser
- [ ] Create playwright.config.ts
- [ ] Create tests/e2e/fixtures.ts
- [ ] Create tests/e2e/popup.spec.ts
- [ ] Add test:e2e scripts to package.json
- [ ] Run and verify E2E tests

## Success Criteria

1. `npm run test:e2e` builds and runs E2E tests
2. Extension loads correctly in Playwright
3. Popup renders and tabs work
4. Tests pass consistently

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Extension ID changes | Low | Low | Extract from service worker |
| Headless not supported | N/A | N/A | Use `channel: 'chromium'` |
| Flaky tests | Medium | Medium | Add retries, proper waits |

## Security Considerations

- E2E tests run with full browser access
- Don't store real API keys in test fixtures

## Next Steps

After E2E setup, proceed to Phase 04 for CI workflow.
