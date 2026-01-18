# Phase 03: Testing and Edge Case Handling

## Context

- Parent: [plan.md](./plan.md)
- Depends on: [phase-02-popup-pdf-result-display.md](./phase-02-popup-pdf-result-display.md)

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-01-18 |
| Priority | P2 |
| Implementation | pending |
| Review | pending |

## Description

Test PDF support across different scenarios and handle edge cases for robustness.

## Key Insights

1. `file://` URLs require extension to have "Allow access to file URLs" enabled
2. Blob URLs (`blob:https://...`) common for dynamically generated PDFs
3. `chrome.action.openPopup()` only works with user gesture (context menu click qualifies)
4. Session storage may not be available in all contexts

## Test Scenarios

### URL Patterns to Test

| Pattern | Example | Expected Behavior |
|---------|---------|-------------------|
| HTTPS PDF | `https://example.com/doc.pdf` | Detect as PDF, popup |
| HTTP PDF | `http://example.com/doc.pdf` | Detect as PDF, popup |
| PDF with query | `https://example.com/doc.pdf?v=1` | Detect as PDF, popup |
| Local file | `file:///C:/doc.pdf` | Detect as PDF, popup (if allowed) |
| Blob URL | `blob:https://...` | May not detect - fallback gracefully |
| Chrome viewer | `chrome-extension://*/viewer.html?file=*` | Detect as PDF, popup |
| Non-PDF | `https://example.com/page` | Use normal tooltip flow |

### Test Cases

1. **Basic remote PDF lookup**
   - Open any `.pdf` URL
   - Select text, right-click, "Look up / Translate"
   - Popup should open with result

2. **Local PDF lookup**
   - Enable "Allow access to file URLs" in extension settings
   - Open local PDF via `file://` URL
   - Select text, right-click, "Look up / Translate"
   - Popup should open with result

3. **Phrase translation**
   - Select multiple words in PDF
   - Should show translation result, not word definition

4. **Popup already open**
   - Open popup first
   - Do PDF lookup
   - Popup should update with new result

5. **Network error handling**
   - Disconnect network
   - Do PDF lookup
   - Should show notification with error

6. **Rapid consecutive lookups**
   - Do multiple lookups quickly
   - Should show latest result, no crashes

## Implementation Steps

### Step 1: Improve PDF detection for edge cases

```typescript
function isPdfUrl(url: string | undefined): boolean {
  if (!url) return false

  // Normalize URL
  const lowerUrl = url.toLowerCase()

  // Direct .pdf extension
  if (lowerUrl.endsWith('.pdf')) return true

  // PDF with query parameters
  if (lowerUrl.match(/\.pdf[?#]/)) return true

  // Common PDF viewer patterns
  if (lowerUrl.includes('pdfviewer')) return true
  if (lowerUrl.includes('/viewer.html?file=')) return true
  if (lowerUrl.includes('/pdfjs/')) return true

  // Chrome PDF viewer extension pattern
  if (lowerUrl.includes('chrome-extension://') && lowerUrl.includes('pdf')) return true

  // Note: blob: URLs can't be reliably detected as PDF by URL alone
  // They would need content-type checking which isn't available here

  return false
}
```

### Step 2: Add error handling for session storage

```typescript
async function lookupForPdf(text: string) {
  try {
    // ... existing lookup logic ...

    // Store result with error handling
    try {
      await chrome.storage.session.set({ pdfLookupResult: result })
    } catch (storageError) {
      // Fallback to local storage with timestamp
      await chrome.storage.local.set({
        pdfLookupResult: result,
        pdfLookupResultExpiry: Date.now() + 60000 // 1 minute expiry
      })
    }

    // ... rest of function ...
  } catch (error) {
    // ... error handling ...
  }
}
```

### Step 3: Add storage cleanup in popup

```typescript
// In App.tsx useEffect
const checkPdfResult = async () => {
  try {
    // Try session storage first
    const sessionResult = await chrome.storage.session.get('pdfLookupResult')
    if (sessionResult.pdfLookupResult) {
      setPdfResult(sessionResult.pdfLookupResult)
      return
    }

    // Fallback to local storage with expiry check
    const localResult = await chrome.storage.local.get(['pdfLookupResult', 'pdfLookupResultExpiry'])
    if (localResult.pdfLookupResult && localResult.pdfLookupResultExpiry > Date.now()) {
      setPdfResult(localResult.pdfLookupResult)
      // Clean up local storage fallback
      await chrome.storage.local.remove(['pdfLookupResult', 'pdfLookupResultExpiry'])
    } else if (localResult.pdfLookupResult) {
      // Expired, clean up
      await chrome.storage.local.remove(['pdfLookupResult', 'pdfLookupResultExpiry'])
    }
  } catch (error) {
    console.warn('Storage check failed:', error)
  }
}
```

### Step 4: Add loading state to popup modal

```typescript
// In PdfLookupResult.tsx, add loading indicator while saving
{saving && (
  <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
    <div className="animate-spin h-6 w-6 border-2 border-primary-600 border-t-transparent rounded-full" />
  </div>
)}
```

## Todo List

- [ ] Enhance `isPdfUrl()` with more patterns
- [ ] Add session storage fallback to local storage
- [ ] Add storage cleanup for expired results
- [ ] Add loading indicator to modal
- [ ] Manual test: remote HTTPS PDF
- [ ] Manual test: local file:// PDF
- [ ] Manual test: phrase translation
- [ ] Manual test: network error
- [ ] Manual test: rapid lookups
- [ ] Update extension docs about PDF support

## Success Criteria

- [ ] All test scenarios pass
- [ ] No console errors during normal usage
- [ ] Graceful degradation when features unavailable
- [ ] Clean storage - no orphaned data

## Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Blob URLs not detected | Low | Medium | Document limitation |
| File URLs without permission | Low | Low | User must enable manually |

## Security Considerations

- No changes to security model
- Session storage auto-clears
- Local storage fallback has 1min expiry

## Next Steps

After this phase:
1. Mark plan as complete
2. Update CHANGELOG.md
3. Consider adding PDF icon indicator in popup
