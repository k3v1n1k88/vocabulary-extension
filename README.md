# Vocabulary Builder Chrome Extension

A Chrome extension for learning vocabulary with flashcards, spaced repetition (SM-2), AI-powered translation, and context menu word lookup.

## Features

- **Word Lookup**: Right-click any word on a webpage to look it up via Free Dictionary API
- **Multi-Language Translation**: Support for 12 languages (Vietnamese, Chinese, Japanese, Korean, Spanish, French, German, Portuguese, Russian, Thai, Indonesian, Arabic)
- **AI Translation**: Optional high-quality translation via OpenAI, Google Gemini, xAI Grok, OpenRouter, Groq, or Mistral
- **Side Panel**: PDF lookup results displayed in Chrome side panel (Chrome 114+)
- **Flashcards**: Study with spaced repetition (SM-2 algorithm)
- **Gamification**: Streaks, XP, levels, and progress tracking
- **Audio Pronunciation**: Google TTS for word pronunciation
- **Keyboard Shortcuts**: Optional shortcut mode for power users
- **Study Reminders**: Configurable notification intervals
- **Offline Support**: All data stored locally in chrome.storage

## Tech Stack

- React 18 + TypeScript
- Vite + CRXJS
- Zustand (state management with chrome.storage persistence)
- Tailwind CSS
- Chrome Extension Manifest V3

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd vocabulary-extension

# Install dependencies
npm install

# Build for development
npm run dev

# Build for production
npm run build

# Run tests
npm run test
```

### Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `dist` folder from this project

## Project Structure

```
src/
├── manifest.ts           # Extension manifest (MV3)
├── background/           # Service worker (context menu, TTS, notifications)
├── content/              # Content script + modular tooltip system
│   ├── modules/          # Floating menu, tooltips, handlers
│   └── utils/            # HTML escape utilities
├── popup/                # Main popup UI (Dashboard, Study, Vocabulary)
├── options/              # Settings page with components and hooks
├── sidepanel/            # PDF lookup side panel
├── shared/               # Shared utilities and components
│   ├── components/       # Reusable UI components
│   ├── store.ts          # Zustand stores
│   ├── translation-service.ts  # Multi-provider LLM translation
│   └── spaced-repetition.ts    # SM-2 algorithm
└── types/                # TypeScript definitions
```

## Usage

1. **Look up words**: Right-click any selected text and choose "Look up / Translate"
2. **Save words**: Click "Save to Vocabulary" in the tooltip
3. **Study flashcards**: Open popup → Study tab
4. **Review progress**: Open popup → Dashboard tab
5. **Manage vocabulary**: Open popup → Vocabulary tab
6. **Configure settings**: Right-click extension icon → Options
7. **Enable AI translation**: Settings → Translation → Enable AI Mode → Add API key

## Settings

Access via extension options page:

- **Learning**: Daily goal, notifications, keyboard shortcuts
- **Translation**: Target language, AI translation toggle, LLM provider/model selection, API key management
- **Data**: Export/import vocabulary, clear data

## Development

```bash
# Start development server with hot reload
npm run dev

# Type check
npx tsc --noEmit

# Run tests
npm run test

# Build production
npm run build

# Lint
npm run lint
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

MIT License
