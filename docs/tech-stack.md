# Tech Stack: Vocabulary Chrome Extension

**Updated:** January 18, 2026 | **Version:** 1.0.2

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
| **Storage** | chrome.storage.local | Offline-first, no backend needed |
| **Algorithm** | SM-2 | Simple, proven spaced repetition |
| **Testing** | Vitest | Fast, Vite-native, 127 tests |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     Chrome Extension                          │
├────────────────┬─────────────────┬─────────────┬─────────────┤
│ Content Script │ Background      │ Popup/UI    │ Side Panel  │
│ - Floating menu│ - Context menu  │ - Dashboard │ - PDF lookup│
│ - Tooltip UI   │ - TTS audio     │ - Study     │ - Results   │
│ - Word detect  │ - Notifications │ - Vocabulary│             │
│ - Save word    │ - Message hub   │ - Settings  │             │
└────────────────┴─────────────────┴─────────────┴─────────────┘
                              │
                      chrome.storage.local
                              │
              ┌───────────────┴───────────────┐
              │         External APIs          │
              ├────────────────────────────────┤
              │ • Free Dictionary API          │
              │ • MyMemory Translation API     │
              │ • Google TTS                   │
              │ • AI Providers (optional):     │
              │   OpenAI, Gemini, xAI Grok,    │
              │   OpenRouter, Groq, Mistral    │
              └────────────────────────────────┘
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

### Why Local Storage over Firebase?
- Simpler architecture, no auth needed
- Full offline support
- No privacy concerns with cloud sync
- chrome.storage.local = 10MB (sufficient for vocabulary)

### Why SM-2 over FSRS?
- Simpler implementation (~100 lines)
- No ML training required
- Sufficient for 100-1000 vocabulary cards
- Can upgrade to FSRS later if needed

### Why Multiple AI Providers?
- User choice and flexibility
- Different pricing tiers
- API redundancy if one fails

---

## Dependencies

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "vite": "^5.4.0",
    "@crxjs/vite-plugin": "^2.0.0",
    "@types/chrome": "^0.0.270",
    "tailwindcss": "^3.4.0",
    "vitest": "^2.0.0"
  }
}
```

---

## External APIs

| API | Purpose | Auth |
|-----|---------|------|
| Free Dictionary API | Word definitions | None |
| MyMemory Translation | Free translation | None |
| Google TTS | Audio pronunciation | None |
| OpenAI | AI translation | API key |
| Google Gemini | AI translation | API key |
| xAI Grok | AI translation | API key |
| OpenRouter | AI translation | API key |
| Groq | AI translation | API key |
| Mistral | AI translation | API key |

---

## Browser Support

- Chrome 114+ (Side Panel support)
- Edge 114+ (Chromium-based)
- Brave (Chromium-based, limited)

---

## Constraints

1. **MV3 Service Workers**: Ephemeral (terminate after ~30s idle)
2. **Storage Limits**: chrome.storage.local = 10MB
3. **Side Panel**: Requires Chrome 114+
4. **TTS**: Google TTS via proxy for CORS
5. **AI Translation**: Requires user-provided API keys
