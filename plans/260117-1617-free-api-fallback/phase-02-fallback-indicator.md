# Phase 02: Add Fallback Logic + UI Indicator

## Context

- Parent: [plan.md](./plan.md)
- Dependencies: Phase 01 (free-translation-api.ts)
- Docs: None

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-01-17 |
| Priority | P2 |
| Implementation | pending |
| Review | pending |

Modify translation-service.ts to use free API when no LLM key, add visual indicator in tooltip.

## Key Insights

1. `translateText()` throws error at line 270 when no API key
2. Modify to catch missing key → call `translateWithFreeApi()` instead
3. Tooltip renders translation at content-script.ts `showTranslationTooltip()`
4. Add badge showing "Free translation" when `isFreeTranslation=true`

## Requirements

- [ ] Modify `translateText()` to fallback to free API
- [ ] Add "Free translation" badge to tooltip CSS
- [ ] Show badge when `isFreeTranslation=true`

## Architecture

```
translateText()
    ↓
Check API key
    ├── Key exists → LLM translation (unchanged)
    └── No key → translateWithFreeApi()
                      ↓
                 Return result with isFreeTranslation=true
                      ↓
            Tooltip shows "Free" badge
```

## Related Code Files

| File | Lines | Purpose |
|------|-------|---------|
| `src/shared/translation-service.ts` | 256-317 | Add fallback logic |
| `src/content/content-script.ts` | ~700-800 | showTranslationTooltip |
| `src/content/content-style.css` | - | Add free badge style |

## Implementation Steps

### Step 1: Modify translateText() fallback

```typescript
// In translation-service.ts, modify translateText()
import { translateWithFreeApi } from './free-translation-api'

export async function translateText(
  text: string,
  targetLanguage: string
): Promise<TranslationResult> {
  // Network check...

  const provider = await getSelectedProvider()
  const config = getProviderConfig(provider)
  const apiKey = await getApiKey(provider)

  // NEW: Fallback to free API if no key
  if (!apiKey) {
    const targetLangCode = await getTargetLanguageCode()
    return translateWithFreeApi(text, targetLangCode)
  }

  // ... rest unchanged
}
```

### Step 2: Add getTargetLanguageCode helper

```typescript
// Add to translation-service.ts
async function getTargetLanguageCode(): Promise<string> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['settings-storage'], (result) => {
      try {
        const parsed = result['settings-storage'] ? JSON.parse(result['settings-storage']) : null
        resolve(parsed?.state?.settings?.targetLanguage || 'vi')
      } catch {
        resolve('vi')
      }
    })
  })
}
```

### Step 3: Update tooltip to show free badge with AI upsell

```typescript
// In content-script.ts showTranslationTooltip(), add badge with hint
const freeBadge = translation.isFreeTranslation
  ? `<div class="vocab-free-hint">
       <span class="vocab-free-badge">Free</span>
       <a href="#" class="vocab-ai-hint" data-action="open-settings">
         Get better results with AI →
       </a>
     </div>`
  : ''

// Insert in header section after type-badge
// Add click listener for data-action="open-settings"
```

### Step 4: Add CSS for free badge + AI hint

```css
/* In content-style.css */
.vocab-free-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.vocab-free-badge {
  display: inline-block;
  background: #fef3c7;
  color: #92400e;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
}

.vocab-ai-hint {
  font-size: 11px;
  color: #6366f1;
  text-decoration: none;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.vocab-ai-hint:hover {
  opacity: 1;
  text-decoration: underline;
}
```

### Step 5: Add click handler for AI hint

```typescript
// In content-script.ts, after creating tooltip
if (translation.isFreeTranslation) {
  const aiHint = tooltip.querySelector('.vocab-ai-hint')
  aiHint?.addEventListener('click', (e) => {
    e.preventDefault()
    chrome.runtime.sendMessage({ type: 'OPEN_OPTIONS_PAGE', payload: { hash: 'settings-apikey' } })
  })
}
```

## Todo List

- [ ] Add `getTargetLanguageCode()` helper function
- [ ] Modify `translateText()` to use free API fallback
- [ ] Add free badge + AI hint HTML to `showTranslationTooltip()`
- [ ] Add `.vocab-free-badge` and `.vocab-ai-hint` CSS styles
- [ ] Add click handler for AI hint → open settings
- [ ] Test fallback works when no API key

## Success Criteria

- [ ] Translation works without API key configured
- [ ] "Free" badge visible in tooltip for free translations
- [ ] LLM translation still used when key exists
- [ ] No regression in existing translation flow

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Free API quality lower | Medium | Low | Badge indicates free tier |
| Both APIs fail | Very Low | Medium | Show error message |

## Security Considerations

- User text sent to MyMemory (third-party)
- No credentials exposed

## Next Steps

Implementation complete after this phase.
