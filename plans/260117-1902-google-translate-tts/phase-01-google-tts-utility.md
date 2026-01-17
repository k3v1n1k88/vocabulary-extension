# Phase 1: Create Google TTS Utility Function

## Context
- Parent: [plan.md](./plan.md)
- Dependencies: None

## Overview
- Date: 2026-01-17
- Description: Create utility to generate Google Translate TTS audio URLs
- Priority: P1
- Implementation: ✅ Complete
- Review: ✅ Complete

## Key Insights
- Google Translate TTS endpoint is publicly accessible
- Returns MP3 audio data
- Language codes: `en`, `vi`, `th`, `zh-CN`, `ja`, `ko`, `es`, `fr`, `de`, `pt`, `ru`, `id`
- Text must be URL-encoded
- Max ~200 characters per request for reliability

## Requirements
1. Create function to build TTS URL
2. Map our language codes to Google's format
3. Handle text chunking for long text

## Architecture
```
src/shared/
└── google-tts.ts  # New file - TTS URL builder
```

## Related Files
- `src/background/service-worker.ts` - Will use this utility
- `src/manifest.ts` - Need to add host permission

## Implementation Steps

### Step 1: Create google-tts.ts
```typescript
// src/shared/google-tts.ts

// Map our lang codes to Google Translate codes
const GOOGLE_LANG_MAP: Record<string, string> = {
  'en': 'en',
  'vi': 'vi',
  'th': 'th',
  'zh': 'zh-CN',
  'ja': 'ja',
  'ko': 'ko',
  'es': 'es',
  'fr': 'fr',
  'de': 'de',
  'pt': 'pt',
  'ru': 'ru',
  'id': 'id'
}

export function getGoogleTTSUrl(text: string, lang: string): string {
  const googleLang = GOOGLE_LANG_MAP[lang] || 'en'
  const encodedText = encodeURIComponent(text.slice(0, 200))
  return `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${googleLang}&q=${encodedText}`
}
```

### Step 2: Update manifest.ts
Add to host_permissions:
```typescript
'https://translate.google.com/*'
```

Remove from permissions (optional cleanup):
```typescript
// Remove 'tts' - no longer needed
```

## Todo
- [ ] Create `src/shared/google-tts.ts`
- [ ] Add host permission to manifest
- [ ] Remove unused `tts` permission

## Success Criteria
- [ ] `getGoogleTTSUrl()` returns valid URL
- [ ] URL works when accessed (returns audio/mpeg)
- [ ] Build passes with new code

## Risk Assessment
- **Low**: Google may block requests if rate limited - mitigate with error handling
- **Low**: URL structure may change - monitor and update if needed

## Security Considerations
- Text sent to Google servers (privacy note)
- No sensitive data expected (just words/phrases for pronunciation)

## Next Steps
→ Phase 2: Integrate into service worker and content script
