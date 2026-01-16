# Phase 01: Configure Obfuscation

## Context

- **Parent Plan:** [plan.md](./plan.md)
- **Dependencies:** None
- **Docs:** [Vite Build](https://vite.dev/guide/build), [javascript-obfuscator](https://github.com/javascript-obfuscator/javascript-obfuscator)

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-01-16 |
| Description | Add rollup-plugin-obfuscator to Vite build |
| Priority | P2 |
| Implementation Status | pending |
| Review Status | pending |

## Key Insights

1. Chrome MV3 forbids `eval()` - must disable `selfDefending` and `debugProtection`
2. Service workers have strict CSP - avoid string array encoding that uses eval
3. Vite uses Rollup under hood - use rollup-plugin-obfuscator
4. Source maps should be `hidden` type (generated but not referenced in output)

## Requirements

- [x] Obfuscate production builds only
- [x] Keep dev builds readable
- [x] Generate source maps for debugging
- [x] MV3/CSP compatible settings
- [x] Don't break extension functionality

## Architecture

```
Build Flow:
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ TypeScript  │───▶│   Rollup    │───▶│ Obfuscator  │───▶ dist/
│   Source    │    │   Bundle    │    │   Plugin    │
└─────────────┘    └─────────────┘    └─────────────┘
                                            │
                                            ▼
                                      Source Maps
                                    (separate folder)
```

## Related Code Files

| File | Purpose |
|------|---------|
| `vite.config.ts` | Add obfuscator plugin config |
| `package.json` | Add devDependency |

## Implementation Steps

### Step 1: Install Dependencies

```bash
npm install -D rollup-plugin-obfuscator javascript-obfuscator
```

### Step 2: Update vite.config.ts

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import obfuscatorPlugin from 'rollup-plugin-obfuscator'
import manifest from './src/manifest'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, existsSync } from 'fs'

const copyContentCss = () => ({
  name: 'copy-content-css',
  closeBundle() {
    const srcCss = resolve(__dirname, 'src/content/content-style.css')
    const destDir = resolve(__dirname, 'dist/src/content')
    const destCss = resolve(destDir, 'content-style.css')
    if (!existsSync(destDir)) {
      mkdirSync(destDir, { recursive: true })
    }
    copyFileSync(srcCss, destCss)
    console.log('Copied content-style.css to dist')
  }
})

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    crx({ manifest }),
    copyContentCss(),
    // Only obfuscate in production
    mode === 'production' && obfuscatorPlugin({
      options: {
        // MV3 compatible settings (no eval)
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.5,
        deadCodeInjection: true,
        deadCodeInjectionThreshold: 0.3,
        identifierNamesGenerator: 'hexadecimal',
        renameGlobals: false,
        stringArray: true,
        stringArrayEncoding: ['base64'], // NOT 'rc4' (uses eval)
        stringArrayThreshold: 0.5,
        // MUST disable for Chrome MV3
        selfDefending: false,
        debugProtection: false,
        disableConsoleOutput: false,
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    sourcemap: 'hidden', // Generate but don't reference in output
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/index.html'),
        options: resolve(__dirname, 'src/options/index.html')
      }
    }
  }
}))
```

### Step 3: Update Build Script (Optional)

Add separate scripts for clarity in `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "build:debug": "tsc && vite build --mode development"
  }
}
```

### Step 4: Test Build

```bash
npm run build
```

Verify:
1. Check `dist/*.js` files are obfuscated
2. Check `.map` files exist in `dist/` (for debugging)
3. Load extension in Chrome and test all features

## Todo List

- [ ] Install rollup-plugin-obfuscator and javascript-obfuscator
- [ ] Update vite.config.ts with obfuscator plugin
- [ ] Set sourcemap to 'hidden'
- [ ] Test production build
- [ ] Verify extension functionality
- [ ] Remove .map files before publishing (manual step)

## Success Criteria

1. `npm run build` produces obfuscated JS
2. `npm run dev` produces readable JS
3. Extension loads and works correctly
4. Source maps generated in dist/
5. No CSP errors in Chrome DevTools

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Extension crashes | Medium | High | Test all features after build |
| Build too slow | Low | Medium | Reduce obfuscation thresholds |
| Maps leak to users | Low | Low | Add .map to .gitignore, exclude from zip |

## Security Considerations

- Source maps contain original code - NEVER include in published extension
- Add `dist/*.map` to `.gitignore`
- Create zip without .map files for Chrome Web Store

## Next Steps

After implementation:
1. Add pre-publish script to remove .map files
2. Document the build process
3. Consider adding build script that auto-excludes maps
