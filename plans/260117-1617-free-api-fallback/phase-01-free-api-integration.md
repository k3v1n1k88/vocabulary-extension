# Phase 01: Add Lingva Free Translation API

## Context

- Parent: [plan.md](./plan.md)
- Dependencies: None
- Docs: https://github.com/thedaviddelta/lingva-translate

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-01-17 |
| Priority | P2 |
| Implementation | pending |
| Review | pending |

Add Lingva translation API (Google Translate frontend) as free fallback option.

## Key Insights

1. Lingva is open-source Google Translate frontend
2. Endpoint: `https://lingva.ml/api/v1/{source}/{target}/{text}`
3. Auto-detect source: use `auto` as source language
4. Response: `{ translation: "translated text" }`
5. No API key, no daily limits
6. Multiple fallback instances available

## Requirements

- [ ] Create `free-translation-api.ts` module
- [ ] Implement `translateWithFreeApi()` function
- [ ] Support auto-detect source language
- [ ] Implement fallback instances for reliability
- [ ] Handle errors gracefully

## Architecture

```
translateWithFreeApi(text, targetLangCode)
    ↓
GET https://lingva.ml/api/v1/auto/{targetLangCode}/{encodeURIComponent(text)}
    ↓
If fails → try fallback instance (lingva.thedaviddelta.com)
    ↓
Parse response.translation
    ↓
Return TranslationResult with isFreeTranslation=true
```

## Related Code Files

| File | Lines | Purpose |
|------|-------|---------|
| `src/shared/translation-service.ts` | 256-317 | Main translation flow |
| `src/types/index.ts` | 103-112 | TranslationResult interface |

## Implementation Steps

### Step 1: Update TranslationResult type

```typescript
// In src/types/index.ts, add isFreeTranslation field
export interface TranslationResult {
  originalText: string
  translatedText: string
  sourceLanguage: string
  targetLanguage: string
  isPhrase: boolean
  synonyms?: string[]
  antonyms?: string[]
  note?: string
  isFreeTranslation?: boolean  // NEW
}
```

### Step 2: Create free-translation-api.ts

```typescript
// src/shared/free-translation-api.ts
import type { TranslationResult } from '../types'
import { SUPPORTED_LANGUAGES } from '../types'

// Lingva instances (fallback if primary is down)
const LINGVA_INSTANCES = [
  'https://lingva.ml',
  'https://lingva.thedaviddelta.com',
  'https://lingva.garudalinux.org'
]

/**
 * Translate using free Lingva API (Google Translate frontend)
 */
export async function translateWithFreeApi(
  text: string,
  targetLangCode: string
): Promise<TranslationResult> {
  const targetLang = SUPPORTED_LANGUAGES.find(l => l.code === targetLangCode)
  const targetLangName = targetLang?.name || 'Vietnamese'
  const encodedText = encodeURIComponent(text)

  // Try each Lingva instance until one works
  let lastError: Error | null = null
  for (const instance of LINGVA_INSTANCES) {
    try {
      const url = `${instance}/api/v1/auto/${targetLangCode}/${encodedText}`
      const response = await fetch(url)

      if (!response.ok) continue

      const data = await response.json()

      if (data.translation) {
        return {
          originalText: text,
          translatedText: data.translation,
          sourceLanguage: 'Auto-detected',
          targetLanguage: targetLangName,
          isPhrase: text.trim().split(/\s+/).length > 1,
          isFreeTranslation: true
        }
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
    }
  }

  throw lastError || new Error('Free translation service unavailable')
}
```

## Todo List

- [ ] Add `isFreeTranslation` to TranslationResult interface
- [ ] Create `src/shared/free-translation-api.ts`
- [ ] Test Lingva API with fallback instances

## Success Criteria

- [ ] `translateWithFreeApi()` returns valid TranslationResult
- [ ] Auto-detects source language correctly
- [ ] Falls back to alternate instance if primary fails
- [ ] Works for all 12 supported languages

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Lingva instance down | Low | Low | Multiple fallback instances |
| All instances down | Very Low | Medium | Show user-friendly error |

## Security Considerations

- No API key stored/transmitted
- Text sent to third-party service (Lingva/Google Translate)

## Next Steps

Phase 02: Integrate fallback logic into translation-service.ts
