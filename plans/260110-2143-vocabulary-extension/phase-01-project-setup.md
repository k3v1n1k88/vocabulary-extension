---
phase: 01
title: "Project Setup"
status: pending
priority: P1
effort: 2h
dependencies: []
---

# Phase 01: Project Setup

## Context

Foundation phase. Initialize Vite + CRXJS project with TypeScript, React, and Tailwind CSS. No external dependencies yet.

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-01-10 |
| Priority | P1 (Critical Path) |
| Status | pending |
| Effort | 2h |
| Dependencies | None |

## Requirements

1. Vite project with CRXJS plugin configured
2. TypeScript 5.x with strict mode
3. React 18 with JSX runtime
4. Tailwind CSS with purge configured
5. ESLint + Prettier setup
6. Git initialized with .gitignore

## Implementation Steps

### Step 1: Initialize Vite Project (15min)

```bash
npm create vite@latest . -- --template react-ts
```

**Files created:**
- `package.json`
- `vite.config.ts`
- `tsconfig.json`
- `index.html`

### Step 2: Install Dependencies (10min)

```bash
# Core dependencies
npm install react@^18.3.0 react-dom@^18.3.0 zustand@^4.5.0

# Dev dependencies
npm install -D typescript@^5.6.0 @types/react @types/react-dom
npm install -D @crxjs/vite-plugin@^2.0.0 @types/chrome@^0.0.270
npm install -D tailwindcss@^3.4.0 autoprefixer@^10.4.0 postcss@^8.4.0
npm install -D eslint prettier eslint-config-prettier
```

**File:** `package.json`

### Step 3: Configure CRXJS (20min)

**File:** `vite.config.ts`
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './src/manifest'

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
  ],
  build: {
    rollupOptions: {
      input: {
        popup: 'src/popup/index.html',
        options: 'src/options/index.html',
      },
    },
  },
})
```

### Step 4: Configure TypeScript (15min)

**File:** `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["chrome"]
  },
  "include": ["src"]
}
```

### Step 5: Configure Tailwind CSS (15min)

**File:** `tailwind.config.js`
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,html}'],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**File:** `postcss.config.js`
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

**File:** `src/styles/globals.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Step 6: Create Directory Structure (15min)

```
src/
├── manifest.ts
├── background/
│   └── service-worker.ts
├── content/
│   └── content-script.ts
├── popup/
│   ├── index.html
│   ├── main.tsx
│   └── App.tsx
├── options/
│   ├── index.html
│   ├── main.tsx
│   └── Options.tsx
├── shared/
│   └── .gitkeep
├── types/
│   └── index.ts
└── styles/
    └── globals.css
```

### Step 7: ESLint + Prettier (10min)

**File:** `.eslintrc.cjs`
```javascript
module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': 'warn',
  },
}
```

**File:** `.prettierrc`
```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

### Step 8: Git Setup (5min)

**File:** `.gitignore`
```
node_modules/
dist/
.env
.env.local
*.log
.DS_Store
```

## Success Criteria

- [ ] `npm run dev` starts Vite dev server without errors
- [ ] TypeScript compiles with no errors
- [ ] Tailwind CSS classes work in components
- [ ] Project structure matches target layout
- [ ] ESLint passes with no errors

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| CRXJS version incompatibility | High | Pin to @crxjs/vite-plugin@2.0.0-beta.23 |
| Tailwind purge removes needed classes | Medium | Add safelist for dynamic classes |

## Output Files

```
D:\vanntl\vocabulary-extension\
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── .eslintrc.cjs
├── .prettierrc
├── .gitignore
└── src/
    ├── manifest.ts
    ├── background/service-worker.ts
    ├── content/content-script.ts
    ├── popup/{index.html, main.tsx, App.tsx}
    ├── options/{index.html, main.tsx, Options.tsx}
    ├── shared/.gitkeep
    ├── types/index.ts
    └── styles/globals.css
```
