# Vocabulary Builder Chrome Extension

A Chrome extension for learning vocabulary with flashcards, spaced repetition (SM-2), and context menu word lookup.

## Features

- **Word Lookup**: Right-click any word on a webpage to look it up
- **Vietnamese Translation**: Automatic EN-VN translation for Vietnamese learners
- **Flashcards**: Study with spaced repetition (SM-2 algorithm)
- **Gamification**: Streaks, XP, levels, and achievement badges
- **Audio Pronunciation**: Text-to-speech for word pronunciation
- **Offline Support**: Works offline with local storage

## Tech Stack

- React 18 + TypeScript
- Vite + CRXJS
- Zustand (state management)
- Tailwind CSS
- Chrome Extension Manifest V3

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

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
├── background/           # Service worker
├── content/              # Content script (word lookup)
├── popup/                # Popup UI (React)
├── options/              # Settings page
├── shared/               # Shared utilities
│   ├── store.ts          # Zustand stores
│   ├── spaced-repetition.ts  # SM-2 algorithm
│   ├── dictionary-api.ts # Word lookup API
│   └── tts.ts            # Text-to-speech
└── types/                # TypeScript definitions
```

## Usage

1. **Look up words**: Right-click any selected text and choose "Look up [word]"
2. **Save words**: Click "Save to Vocabulary" in the tooltip
3. **Study flashcards**: Open popup → Study tab
4. **Review progress**: Open popup → Dashboard tab
5. **Manage vocabulary**: Open popup → Vocabulary tab

## Development

```bash
# Start development server with hot reload
npm run dev

# Type check
npx tsc --noEmit

# Build production
npm run build
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

MIT License
