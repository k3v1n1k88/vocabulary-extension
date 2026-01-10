# Tech Stack: Vocabulary Chrome Extension

**Date:** January 10, 2026 | **Status:** Approved

---

## Core Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Runtime** | Chrome Extension (Manifest V3) | Modern, secure, required by Chrome Web Store |
| **Language** | TypeScript 5.x | Type safety for chrome.* APIs |
| **UI Framework** | React 18 | Component-based, ecosystem, team familiarity |
| **Build Tool** | Vite + CRXJS | Zero-config, HMR for all extension contexts |
| **State** | Zustand | Lightweight (2KB), hooks API, chrome.storage adapter |
| **Styling** | Tailwind CSS | Utility-first, purges unused styles |
| **Backend** | Firebase | Auth + Firestore, generous free tier |
| **Algorithm** | SM-2 | Simple, proven spaced repetition |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Chrome Extension                  │
├─────────────────────────────────────────────────────┤
│  Content Script     │  Background Worker │  Popup   │
│  (DOM interaction)  │  (Firebase, APIs)  │  (React) │
│         ↓           │         ↓          │    ↓     │
│  Right-click menu   │  Auth, Firestore   │  UI/UX   │
│  Word detection     │  Message routing   │  State   │
└─────────────────────────────────────────────────────┘
                          │
                          ↓
                  ┌───────────────┐
                  │   Firebase    │
                  │ Auth+Firestore│
                  └───────────────┘
```

---

## Key Decisions

### Why Vite + CRXJS over Webpack?
- True HMR for popup, content scripts, and background worker
- Zero manual manifest configuration
- 3-5x faster builds

### Why Zustand over Redux?
- 2KB vs 40KB bundle
- Simpler API for extension scope
- Built-in persistence adapter for chrome.storage

### Why Firebase over Supabase?
- User requested Firebase
- Mature Chrome extension integration docs
- `firebase/auth/web-extension` solves MV3 CSP issues

### Why SM-2 over FSRS?
- Simpler implementation (~50 lines)
- No ML training required
- Sufficient for 100-1000 vocabulary cards
- Can upgrade to FSRS later if needed

---

## Dependencies

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "zustand": "^4.5.0",
    "firebase": "^10.14.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "vite": "^5.4.0",
    "@crxjs/vite-plugin": "^2.0.0",
    "@types/chrome": "^0.0.270",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

---

## File Structure

```
src/
├── manifest.ts           # MV3 manifest (CRXJS)
├── background/
│   └── service-worker.ts # Firebase init, message handlers
├── content/
│   └── content-script.ts # Context menu, word detection
├── popup/
│   ├── index.html
│   ├── App.tsx           # Main popup UI
│   └── components/       # React components
├── options/
│   └── Options.tsx       # Settings page
├── shared/
│   ├── store.ts          # Zustand + chrome.storage
│   ├── firebase.ts       # Firebase config
│   └── spaced-repetition.ts # SM-2 algorithm
└── types/
    └── index.ts          # TypeScript definitions
```

---

## Browser Support

- Chrome 88+ (Manifest V3 baseline)
- Edge 88+ (Chromium-based)
- Brave (Chromium-based)

---

## Constraints

1. **MV3 Service Workers**: Ephemeral (terminate after ~30s idle)
2. **Firebase CSP**: Must use `firebase/auth/web-extension`
3. **Storage Limits**: chrome.storage.sync = 100KB, local = 10MB
4. **Offline**: Firestore IndexedDB persistence in popup only
