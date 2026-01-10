# Codebase Summary

## Overview

Vocabulary Builder is a Chrome Extension (MV3) built with React, TypeScript, and Vite.

## Key Files

### Configuration
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript config
- `vite.config.ts` - Vite + CRXJS config
- `tailwind.config.js` - Tailwind CSS config

### Source Code

#### `src/manifest.ts`
Chrome extension manifest definition using CRXJS defineManifest.

#### `src/background/service-worker.ts`
Background service worker handling:
- Context menu creation
- Word lookup via Free Dictionary API
- Message routing between components
- TTS audio playback

#### `src/content/content-script.ts`
Content script for webpage interaction:
- Display word lookup tooltips
- Save words to vocabulary
- Audio pronunciation

#### `src/popup/`
React popup UI with tabs:
- `Dashboard.tsx` - Progress, stats, recent words
- `StudyView.tsx` - Flashcard review with SM-2
- `VocabularyList.tsx` - Word list management

#### `src/options/Options.tsx`
Settings page for user preferences.

#### `src/shared/`
Shared utilities:
- `store.ts` - Zustand stores with chrome.storage persistence
- `spaced-repetition.ts` - SM-2 algorithm implementation
- `dictionary-api.ts` - Free Dictionary API client
- `tts.ts` - Web Speech API wrapper

#### `src/types/index.ts`
TypeScript type definitions for Word, FlashcardData, UserStats, etc.

## Build Output

Production build outputs to `dist/`:
- `manifest.json` - Chrome manifest
- `service-worker-loader.js` - Background script
- `assets/` - JS bundles and CSS
- `icons/` - Extension icons
- `src/popup/` - Popup HTML
- `src/options/` - Options HTML

## Commands

```bash
npm run dev    # Development with HMR
npm run build  # Production build
```
