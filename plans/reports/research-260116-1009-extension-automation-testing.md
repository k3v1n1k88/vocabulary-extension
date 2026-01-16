# Research Report: Chrome Extension Automation Testing

**Date:** 2026-01-16
**Research Focus:** Automation testing approaches for Chrome extensions (MV3)
**Context:** vocabulary-extension (React + TypeScript + Vite)

## Executive Summary

Chrome extension testing in 2025 requires a multi-layered approach: unit tests for isolated logic, integration tests for component interactions, and E2E tests for full user flows. For MV3 extensions, key challenges include mocking the `chrome` API and testing service workers.

**Recommended Stack for This Project:**
- **Unit/Integration:** Vitest + React Testing Library + vitest-chrome
- **E2E:** Playwright with persistent context

Vitest is preferred over Jest for Vite-based projects due to shared configuration, native ESM support, and faster execution.

## Key Findings

### 1. Testing Layers

| Layer | Purpose | Tools |
|-------|---------|-------|
| Unit | Isolated functions/components | Vitest, vitest-chrome |
| Integration | Component interactions, storage | Vitest, Testing Library |
| E2E | Full browser flows | Playwright |

### 2. Chrome API Mocking

The `chrome` API unavailable in Node.js - must be mocked.

**Recommended:** `vitest-chrome` package (Jest-compatible: `jest-chrome`)

```typescript
// vitest.setup.ts
import { vi } from 'vitest';
import * as chrome from 'vitest-chrome';

Object.assign(global, chrome);
beforeEach(() => {
  chrome.reset();
});
```

### 3. Testing Extension Components

#### Popup Pages
Treat as standard React apps:
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Popup from './Popup';
import { chrome } from 'vitest-chrome';

test('renders count from storage', async () => {
  chrome.storage.local.get.mockImplementation((keys, cb) => cb({ count: 5 }));
  render(<Popup />);
  await waitFor(() => expect(screen.getByText('Count: 5')).toBeInTheDocument());
});
```

#### Content Scripts
Test DOM manipulation in jsdom:
```typescript
beforeEach(() => {
  document.body.innerHTML = '';
  chrome.runtime.sendMessage.mockClear();
});

test('injects button and sends message', () => {
  const btn = injectButton('Test');
  btn.click();
  expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({ action: 'clicked' });
});
```

#### Service Workers
Mock event listeners and trigger them:
```typescript
import './service-worker';
import { chrome } from 'vitest-chrome';

test('handles onInstalled', () => {
  const spy = vi.spyOn(console, 'log');
  chrome.runtime.onInstalled.callListeners();
  expect(spy).toHaveBeenCalled();
});
```

#### Storage APIs
```typescript
chrome.storage.local.get.mockImplementation((keys, cb) => cb({ key: 'value' }));
chrome.storage.local.set.mockImplementation((items, cb) => cb());
```

### 4. E2E Testing with Playwright

Load extension in persistent context:
```typescript
import { test as base, chromium, BrowserContext } from '@playwright/test';
import path from 'path';

export const test = base.extend<{ context: BrowserContext; extensionId: string }>({
  context: async ({}, use) => {
    const extPath = path.join(__dirname, '../dist');
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      args: [
        `--disable-extensions-except=${extPath}`,
        `--load-extension=${extPath}`,
      ],
    });
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    let [sw] = context.serviceWorkers();
    if (!sw) sw = await context.waitForEvent('serviceworker');
    const id = sw.url().split('/')[2];
    await use(id);
  },
});

test('popup displays correctly', async ({ page, extensionId }) => {
  await page.goto(`chrome-extension://${extensionId}/src/popup/index.html`);
  await expect(page.locator('h1')).toBeVisible();
});
```

### 5. CI/CD Integration (GitHub Actions)

```yaml
name: Extension Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run test:unit
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: xvfb-run -a npx playwright test
```

**Note:** `xvfb-run` required for headful Chrome in CI.

## Implementation Recommendations

### Quick Start Setup

1. **Install dependencies:**
```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom vitest-chrome @playwright/test
```

2. **Create `vitest.config.ts`:**
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
```

3. **Create `vitest.setup.ts`:**
```typescript
import '@testing-library/jest-dom';
import * as chrome from 'vitest-chrome';

Object.assign(global, chrome);
beforeEach(() => chrome.reset());
```

4. **Add scripts to `package.json`:**
```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run",
    "test:e2e": "playwright test"
  }
}
```

### Recommended Test Structure

```
src/
├── popup/
│   ├── Popup.tsx
│   └── Popup.test.tsx
├── content/
│   ├── content-script.ts
│   └── content-script.test.ts
├── background/
│   ├── service-worker.ts
│   └── service-worker.test.ts
├── shared/
│   ├── store.ts
│   └── store.test.ts
tests/
└── e2e/
    ├── popup.spec.ts
    └── fixtures.ts
```

### Priority Test Coverage

| Component | Priority | Reason |
|-----------|----------|--------|
| Zustand stores | High | Core state logic |
| Translation service | High | External API calls |
| Storage utilities | High | Data persistence |
| Popup UI | Medium | User interaction |
| Content script | Medium | DOM injection |
| Service worker | Low | Event handling |

## Common Pitfalls

1. **Async storage APIs** - Always use `waitFor` or proper async handling
2. **Chrome API not mocked** - Ensure setup file runs before tests
3. **E2E headless mode** - Extensions need `channel: 'chromium'` flag
4. **CI virtual display** - Use `xvfb-run` for headful tests

## Resources & References

### Official Documentation
- [Playwright Chrome Extensions](https://playwright.dev/docs/chrome-extensions)
- [Vitest Getting Started](https://vitest.dev/guide/)
- [Testing Library React](https://testing-library.com/docs/react-testing-library/intro/)

### GitHub Repositories
- [playwright-chrome-extension-testing-template](https://github.com/kelseyaubrecht/playwright-chrome-extension-testing-template)
- [playwright-crx](https://github.com/ruifigueira/playwright-crx)
- [vitest-chrome](https://www.npmjs.com/package/vitest-chrome)

### Tutorials
- [How to Test Chrome Extensions with Playwright](https://railsware.com/blog/test-chrome-extensions/)
- [Playwright: Loading Chrome Extensions](https://owlfeatherworkshop.ca/tech/playwright-chrome-extensions/)

## Next Steps

1. Install testing dependencies (Vitest + vitest-chrome)
2. Create setup files for chrome API mocking
3. Write unit tests for Zustand stores first (highest value)
4. Add E2E tests for critical user flows
5. Configure GitHub Actions workflow

---

## Unresolved Questions

- Does `vitest-chrome` fully support MV3 service worker APIs (`chrome.scripting`, etc.)?
- How to test TTS (`chrome.tts`) API effectively?
- Best approach for testing content script CSS injection?
