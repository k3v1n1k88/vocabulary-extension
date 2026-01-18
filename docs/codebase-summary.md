# Codebase Summary

## Overview

Vocabulary Builder is a Chrome Extension (MV3) built with React, TypeScript, Vite, and Tailwind CSS. Supports word lookup, AI-powered translation, and spaced repetition learning.

## Architecture

```
src/
├── background/          # Service worker
├── content/             # Content script + modules
│   ├── modules/         # Modular tooltip system
│   └── utils/           # HTML escape utilities
├── options/             # Settings page
│   ├── components/      # UI components
│   └── hooks/           # Custom React hooks
├── popup/               # Main popup UI
│   └── components/      # Dashboard, Study, Vocabulary
├── shared/              # Cross-module utilities
│   └── components/      # Reusable UI components
├── sidepanel/           # PDF lookup sidebar
│   ├── components/      # Result cards, error states
│   └── hooks/           # Sidepanel data hooks
└── types/               # TypeScript definitions
```

## Key Modules

### Background (`src/background/`)
- `service-worker.ts` - Context menu, message routing, TTS, notifications

### Content Script (`src/content/`)
Modular tooltip system for webpage word lookup:
- `content-script.ts` - Entry point, coordinates modules
- **Floating Menu**: `floating-menu.ts`, `floating-menu-lang-handlers.ts`, `floating-menu-template.ts`
- **Tooltip Core**: `tooltip-manager.ts`, `tooltip-positioning.ts`, `tooltip-event-handlers.ts`
- **Tooltip UI**: `tooltip-templates.ts`, `tooltip-error-template.ts`, `tooltip-shared-elements.ts`
- **Handlers**: `tooltip-button-handlers.ts`, `tooltip-dropdown-handlers.ts`
- **Utilities**: `settings-manager.ts`, `keyboard-shortcuts.ts`, `tts-player.ts`

### Options Page (`src/options/`)
Settings UI with extracted components and hooks:
- **Components**: `settings-content.tsx`, `translation-settings.tsx`, `learning-settings.tsx`, `ai-translation-toggle.tsx`, `api-key-input.tsx`, `data-management.tsx`, `about-section.tsx`
- **Hooks**: `use-api-key-management.ts`, `use-shortcut-recorder.ts`

### Popup (`src/popup/`)
- `Dashboard.tsx` - Progress stats, recent words
- `StudyView.tsx` - Flashcard review (SM-2 algorithm)
- `VocabularyList.tsx` - Word list with search/filter

### Shared (`src/shared/`)
- `store.ts` - Zustand stores with Chrome storage
- `chrome-storage-adapter.ts` - Storage persistence adapter
- `translation-service.ts` - Multi-provider LLM translation
- `llm-provider-config.ts` - Provider configurations
- `spaced-repetition.ts` - SM-2 algorithm
- `dictionary-api.ts` - Free Dictionary API client
- `notifications.ts` - Study reminder notifications
- **Components**: `icons.tsx`, `lang-dropdown.tsx`, `ai-badge.tsx`, `toggle.tsx`, `stat-item.tsx`, `donate-bar.tsx`, `footer-credits.tsx`

### Sidepanel (`src/sidepanel/`)
PDF lookup sidebar with result display:
- `SidePanel.tsx` - Main container
- **Components**: `translation-result-card.tsx`, `word-result-card.tsx`, `error-state.tsx`
- **Hooks**: `use-sidepanel-data.ts`

## Configuration

- `src/manifest.ts` - Chrome extension manifest (CRXJS)
- `vite.config.ts` - Build configuration
- `tailwind.config.js` - Styling configuration
- `tsconfig.json` - TypeScript configuration

## Commands

```bash
npm run dev      # Development with HMR
npm run build    # Production build
npm run test     # Run Vitest tests
npm run lint     # ESLint check
```

## Build Output

Production build → `dist/`:
- `manifest.json`, `service-worker-loader.js`
- `assets/` - JS bundles, CSS
- `icons/` - Extension icons (16, 32, 48, 128)
- `src/{popup,options,sidepanel}/index.html`
