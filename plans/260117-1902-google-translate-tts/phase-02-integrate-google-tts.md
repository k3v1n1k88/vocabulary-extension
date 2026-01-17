# Phase 2: Integrate Google TTS into Extension

## Context
- Parent: [plan.md](./plan.md)
- Dependencies: Phase 1

## Overview
- Date: 2026-01-17
- Description: Replace Chrome TTS with Google Translate TTS in service worker and content script
- Priority: P1
- Implementation: ✅ Complete
- Review: ✅ Complete

## Key Insights
- Service worker cannot play audio directly (no Audio API)
- Must send audio URL to content script for playback
- Content script creates hidden Audio element and plays

## Requirements
1. Update PLAY_AUDIO handler in service worker
2. Add audio playback in content script
3. Handle network errors gracefully

## Architecture
```
Flow:
1. User clicks audio button → content script
2. Content script sends PLAY_AUDIO message → service worker
3. Service worker builds Google TTS URL
4. Service worker sends PLAY_GOOGLE_AUDIO message → content script
5. Content script plays audio via HTML5 Audio element
```

## Related Files
- `src/background/service-worker.ts` - Update PLAY_AUDIO handler
- `src/content/content-script.ts` - Add audio playback

## Implementation Steps

### Step 1: Update service-worker.ts

Replace current PLAY_AUDIO handler:

```typescript
case 'PLAY_AUDIO': {
  const { text, lang } = message.payload as { text: string; lang?: string }

  // Build Google TTS URL
  const googleLangMap: Record<string, string> = {
    'en': 'en', 'vi': 'vi', 'th': 'th', 'zh': 'zh-CN',
    'ja': 'ja', 'ko': 'ko', 'es': 'es', 'fr': 'fr',
    'de': 'de', 'pt': 'pt', 'ru': 'ru', 'id': 'id'
  }
  const googleLang = googleLangMap[lang || 'en'] || 'en'
  const encodedText = encodeURIComponent(text.slice(0, 200))
  const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${googleLang}&q=${encodedText}`

  // Send audio URL back to content script for playback
  sendResponse({ success: true, audioUrl })
  break
}
```

### Step 2: Update content-script.ts

Add audio playback function:

```typescript
// Global audio element for TTS playback
let ttsAudio: HTMLAudioElement | null = null

function playGoogleTTSAudio(audioUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Stop any existing audio
    if (ttsAudio) {
      ttsAudio.pause()
      ttsAudio = null
    }

    ttsAudio = new Audio(audioUrl)
    ttsAudio.onended = () => resolve()
    ttsAudio.onerror = () => reject(new Error('Audio playback failed'))
    ttsAudio.play().catch(reject)
  })
}
```

Update audio button handlers to use response:

```typescript
chrome.runtime.sendMessage({
  type: 'PLAY_AUDIO',
  payload: { text, lang }
}, async (response) => {
  if (response?.success && response.audioUrl) {
    try {
      await playGoogleTTSAudio(response.audioUrl)
    } catch (error) {
      showTTSError('Audio playback failed. Check your internet connection.')
    }
  } else if (response?.error) {
    showTTSError(response.error)
  }
})
```

### Step 3: Update manifest.ts

Add host permission:
```typescript
host_permissions: [
  // ... existing
  'https://translate.google.com/*'
]
```

Optionally remove 'tts' from permissions array.

## Todo
- [ ] Update PLAY_AUDIO handler to return audio URL
- [ ] Add `playGoogleTTSAudio()` function in content script
- [ ] Update all audio button handlers to use new flow
- [ ] Add host permission for Google Translate
- [ ] Test with Thai, Vietnamese, and other languages

## Success Criteria
- [ ] Clicking audio button plays correct pronunciation
- [ ] Works for all supported languages (en, vi, th, zh, ja, ko, es, fr, de, pt, ru, id)
- [ ] Error message shown on network failure
- [ ] No console errors

## Risk Assessment
- **Medium**: CORS may block audio fetch - Google Translate allows cross-origin for TTS
- **Low**: Rate limiting - unlikely for normal usage

## Security Considerations
- Audio fetched from Google servers
- No auth required, public endpoint

## Next Steps
→ Build and test all languages
→ Remove debug console.log statements
→ Commit changes
