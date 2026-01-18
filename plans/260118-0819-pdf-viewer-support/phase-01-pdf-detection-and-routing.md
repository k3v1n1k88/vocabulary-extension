# Phase 01: PDF Detection and Result Routing

## Context

- Parent: [plan.md](./plan.md)
- Research: [research-260118-0758-pdf-viewer-support.md](../reports/research-260118-0758-pdf-viewer-support.md)

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-01-18 |
| Priority | P2 |
| Implementation | pending |
| Review | pending |

## Description

Add PDF URL detection in service worker and route lookup results to popup instead of content script when on PDF pages.

## Key Insights

1. `tab.url` available in context menu callback provides page URL
2. PDF detection: URL ends with `.pdf` or contains `viewer.html?file=` (Chrome's internal viewer)
3. `chrome.action.openPopup()` requires Chrome 99+ and user gesture context
4. `chrome.storage.session` provides temporary storage (cleared when browser closes)

## Requirements

- Detect PDF pages by URL pattern
- Perform dictionary lookup/translation same as current flow
- Store result in session storage instead of sending to content script
- Open popup to display result
- Handle case when popup already open (send message)

## Related Code Files

| File | Purpose |
|------|---------|
| `src/background/service-worker.ts:27-70` | `lookupOrTranslate()` function |
| `src/background/service-worker.ts:73-77` | Context menu click handler |
| `src/shared/dictionary-api.ts` | Dictionary lookup logic |

## Architecture

```typescript
// PDF detection utility
function isPdfUrl(url: string | undefined): boolean {
  if (!url) return false
  const lowerUrl = url.toLowerCase()
  return lowerUrl.endsWith('.pdf') ||
         lowerUrl.includes('viewer.html?file=') ||
         lowerUrl.includes('/pdfjs/') ||
         lowerUrl.startsWith('chrome-extension://') && lowerUrl.includes('pdf')
}

// Modified context menu handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'vocabulary-lookup' && info.selectionText && tab?.id) {
    const isPdf = isPdfUrl(tab.url)

    if (isPdf) {
      await lookupForPdf(info.selectionText.trim())
    } else {
      await lookupOrTranslate(info.selectionText.trim(), tab.id)
    }
  }
})
```

## Implementation Steps

### Step 1: Add PDF detection utility
```typescript
// Add to service-worker.ts
function isPdfUrl(url: string | undefined): boolean {
  if (!url) return false
  const lowerUrl = url.toLowerCase()
  return (
    lowerUrl.endsWith('.pdf') ||
    lowerUrl.includes('.pdf?') ||  // PDF with query params
    lowerUrl.includes('/pdf/') ||   // Common PDF path pattern
    lowerUrl.includes('pdfviewer') ||
    (lowerUrl.startsWith('blob:') && document?.contentType === 'application/pdf')
  )
}
```

### Step 2: Add PDF lookup result type to types/index.ts
```typescript
// PDF lookup result for popup display
export interface PdfLookupResult {
  type: 'word' | 'translation'
  timestamp: number
  data: Word | TranslationResult
}
```

### Step 3: Add new message type
```typescript
// Add to MessageType union
| 'PDF_LOOKUP_RESULT'
```

### Step 4: Create lookupForPdf function
```typescript
async function lookupForPdf(text: string) {
  try {
    const isPhraseText = isPhrase(text)
    let result: PdfLookupResult

    if (isPhraseText) {
      const translation = await translateToTargetLanguage(text)
      result = { type: 'translation', timestamp: Date.now(), data: translation }
    } else {
      const wordData = await lookupWordWithTranslation(text)
      if (wordData) {
        result = { type: 'word', timestamp: Date.now(), data: wordData }
      } else {
        const translation = await translateToTargetLanguage(text)
        result = { type: 'translation', timestamp: Date.now(), data: translation }
      }
    }

    // Store result for popup
    await chrome.storage.session.set({ pdfLookupResult: result })

    // Try to open popup (may fail if no user gesture)
    try {
      await chrome.action.openPopup()
    } catch {
      // Fallback: Show notification with basic info
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon-128.png',
        title: 'Vocabulary Lookup',
        message: `Open extension popup to see result for "${text.slice(0, 30)}..."`
      })
    }
  } catch (error) {
    console.error('[VocabExt] PDF lookup failed:', error)
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon-128.png',
      title: 'Lookup Failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
```

### Step 5: Modify context menu handler
```typescript
// Update existing handler at line 73-77
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'vocabulary-lookup' && info.selectionText && tab?.id) {
    const text = info.selectionText.trim()

    if (isPdfUrl(tab.url)) {
      await lookupForPdf(text)
    } else {
      await lookupOrTranslate(text, tab.id)
    }
  }
})
```

## Todo List

- [ ] Add `isPdfUrl()` utility function
- [ ] Add `PdfLookupResult` type to types/index.ts
- [ ] Add `PDF_LOOKUP_RESULT` message type
- [ ] Implement `lookupForPdf()` function
- [ ] Update context menu click handler with PDF detection
- [ ] Test with `.pdf` URLs

## Success Criteria

- [ ] PDF URLs correctly detected
- [ ] Lookup result stored in session storage
- [ ] Popup opens (or notification shows as fallback)
- [ ] Non-PDF pages continue working as before

## Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| `openPopup()` fails silently | Medium | Medium | Notification fallback |
| Session storage unavailable | Low | Low | Use local storage + timestamp cleanup |

## Security Considerations

- No new permissions required
- Session storage auto-clears on browser close
- Text sanitization already in place from existing flow

## Next Steps

After this phase, proceed to Phase 02 to implement popup display component.
