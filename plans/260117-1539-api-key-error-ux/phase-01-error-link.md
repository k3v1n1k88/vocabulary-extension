# Phase 01: Add Settings Link to Error Tooltip

## Context

- Parent: [plan.md](./plan.md)
- Dependencies: None
- Docs: None

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-01-17 |
| Priority | P3 |
| Implementation | pending |
| Review | pending |

Enhance error tooltip to include clickable "Open Settings" button when API key is missing.

## Key Insights

1. Error tooltip rendered in `showErrorTooltip()` at content-script.ts:795-836
2. Current error message comes from translation-service.ts:270
3. Need to detect "API key" errors and add special button
4. Use `chrome.runtime.openOptionsPage()` to open settings

## Requirements

- [x] Detect API key related errors (check message contains "API key")
- [x] Add "Open Settings" button to error tooltip HTML
- [x] Wire button click to `chrome.runtime.openOptionsPage()`
- [x] Style button consistently with existing UI

## Architecture

```
showErrorTooltip(message)
  ↓
  Check if message.includes('API key')
  ↓
  If yes: Add "Open Settings" button to HTML
  ↓
  Setup click listener → chrome.runtime.openOptionsPage()
```

## Related Code Files

| File | Lines | Purpose |
|------|-------|---------|
| `src/content/content-script.ts` | 795-836 | `showErrorTooltip()` function |
| `src/shared/translation-service.ts` | 269-271 | Error message generation |

## Implementation Steps

### Step 1: Modify showErrorTooltip()

```typescript
// In content-script.ts, update showErrorTooltip function

function showErrorTooltip(message: string) {
  // ... existing position logic ...

  // Check if this is an API key error
  const isApiKeyError = message.toLowerCase().includes('api key')

  tooltip.innerHTML = `
    <div class="vocab-tooltip-content vocab-error">
      <p>${message}</p>
      ${isApiKeyError ? `
        <button class="vocab-settings-btn" style="margin-top: 8px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          Open Settings
        </button>
      ` : ''}
    </div>
  `

  // ... existing positioning logic ...

  // Add settings button listener if API key error
  if (isApiKeyError) {
    const settingsBtn = tooltip.querySelector('.vocab-settings-btn')
    settingsBtn?.addEventListener('click', (e) => {
      e.stopPropagation()
      chrome.runtime.openOptionsPage()
      removeTooltip()
    })
  }
}
```

### Step 2: Add CSS for settings button

Add to content-script styles (inline or content.css):

```css
.vocab-settings-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #4F46E5;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
}

.vocab-settings-btn:hover {
  background: #4338CA;
}
```

## Todo List

- [ ] Update `showErrorTooltip()` to detect API key errors
- [ ] Add "Open Settings" button HTML when API key error
- [ ] Add click listener for `chrome.runtime.openOptionsPage()`
- [ ] Add button styles

## Success Criteria

- [ ] Error tooltip for API key issues shows "Open Settings" button
- [ ] Clicking button opens extension options page
- [ ] Button styled consistently with extension theme
- [ ] Non-API key errors unchanged

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Detection regex too broad | Low | Low | Check specifically for "API key" phrase |

## Security Considerations

- None - using official Chrome API

## Next Steps

After completion, proceed to Phase 02 for info tooltip on settings page.
