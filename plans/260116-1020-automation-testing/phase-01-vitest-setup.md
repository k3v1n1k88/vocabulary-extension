# Phase 01: Vitest Setup

## Context

- **Parent Plan:** [plan.md](./plan.md)
- **Dependencies:** None
- **Docs:** [Vitest](https://vitest.dev), [vitest-chrome](https://www.npmjs.com/package/vitest-chrome)

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-01-16 |
| Description | Configure Vitest with chrome API mocking |
| Priority | P1 |
| Implementation Status | pending |
| Review Status | pending |

## Key Insights

1. Vitest preferred over Jest for Vite projects - shared config, faster
2. `vitest-chrome` provides comprehensive chrome API mocks
3. jsdom environment required for React component testing
4. Separate config file to not pollute vite.config.ts

## Requirements

- [ ] Install Vitest and related dependencies
- [ ] Create vitest.config.ts
- [ ] Create vitest.setup.ts with chrome mocking
- [ ] Add test scripts to package.json
- [ ] Update tsconfig for vitest types

## Related Code Files

| File | Purpose |
|------|---------|
| `vitest.config.ts` | New - Vitest configuration |
| `vitest.setup.ts` | New - Chrome API mocks |
| `package.json` | Add devDependencies and scripts |
| `tsconfig.json` | Add vitest types |

## Implementation Steps

### Step 1: Install Dependencies

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event vitest-chrome jsdom
```

### Step 2: Create vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'dist/', '*.config.*']
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
```

### Step 3: Create vitest.setup.ts

```typescript
import '@testing-library/jest-dom'
import * as chrome from 'vitest-chrome'

// Assign mocked chrome to global
Object.assign(global, chrome)

// Reset mocks before each test
beforeEach(() => {
  chrome.reset()
})
```

### Step 4: Update package.json scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

### Step 5: Update tsconfig.json

Add to compilerOptions.types:
```json
{
  "compilerOptions": {
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  }
}
```

## Todo List

- [ ] Install vitest, @testing-library/*, vitest-chrome, jsdom
- [ ] Create vitest.config.ts
- [ ] Create vitest.setup.ts
- [ ] Add test scripts to package.json
- [ ] Update tsconfig.json types
- [ ] Verify setup with simple test

## Success Criteria

1. `npm run test` starts Vitest in watch mode
2. `npm run test:unit` runs all tests once
3. chrome.* APIs available and mockable in tests
4. React components render in jsdom

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| vitest-chrome incomplete API | Low | Medium | Manual mock fallback |
| Config conflicts with vite | Low | High | Separate config file |

## Next Steps

After setup complete, proceed to Phase 02 to write unit tests.
