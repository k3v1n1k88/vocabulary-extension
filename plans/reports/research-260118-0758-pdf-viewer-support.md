# Research Report: PDF Viewer Support for Chrome Extensions

**Date:** 2026-01-18
**Context:** Vocabulary Builder Chrome Extension (MV3, React, TypeScript)

---

## Executive Summary

Chrome extensions cannot directly access text content within Chrome's native PDF viewer due to its isolated plugin architecture. Three viable approaches exist:

1. **Context Menu API** - Simplest; captures selected text via `chrome.contextMenus` (works on native viewer)
2. **Custom PDF.js Viewer** - Full control; redirect PDFs to extension-hosted viewer
3. **Hybrid Approach** - Use context menu for basic selection + optional PDF.js for advanced features

For vocabulary lookup extensions, **Context Menu API is the recommended starting point** as it already works with Chrome's native PDF viewer without additional complexity.

---

## Research Methodology

- Sources: 5 parallel Gemini searches
- Focus: Chrome MV3 PDF handling, PDF.js integration, vocabulary extension patterns
- Date: January 2026

---

## Key Findings

### 1. Chrome Native PDF Viewer Limitations

**Why content scripts fail on PDFs:**
- Native PDF viewer uses Pepper Plugin API (PPAPI) - isolated from DOM
- Content scripts run in "isolated world" - no access to plugin internals
- No `chrome.pdfViewer` API exists (confirmed as of 2026)
- `navigator.pdfViewerEnabled` only indicates support, no programmatic control

**What DOES work:**
- `chrome.contextMenus` API captures selected text from PDF pages
- `info.selectionText` returns highlighted text when user right-clicks
- This works because selection is handled at OS level, not DOM level

### 2. Implementation Approaches

#### Approach A: Context Menu (Recommended for MVP)

**Pros:**
- Works immediately with native PDF viewer
- Zero additional dependencies
- Minimal code changes
- Best performance

**Cons:**
- Requires right-click action (no hover tooltips)
- Cannot inject UI into PDF pages
- Limited to user-selected text only

**Implementation:**

```typescript
// manifest.ts additions
{
  permissions: ["contextMenus", "activeTab"],
}

// background/service-worker.ts
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "lookupWord",
    title: "Look up '%s'",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "lookupWord" && info.selectionText) {
    // Send to popup or process directly
    chrome.runtime.sendMessage({
      type: "LOOKUP_WORD",
      word: info.selectionText
    });
  }
});
```

#### Approach B: Custom PDF.js Viewer (Full Control)

**Pros:**
- Full DOM access to rendered PDF
- Can inject tooltips, highlights, annotations
- Text layer enables standard `window.getSelection()`
- Consistent behavior across all PDF sources

**Cons:**
- Significant implementation effort
- Must bundle PDF.js (~500KB+ gzipped)
- Must handle PDF viewer UX (zoom, scroll, search)
- `file://` URLs require user permission grant
- CORS issues with cross-origin PDFs

**Architecture:**

```
1. Detect PDF navigation (background script)
2. Redirect to extension's pdf-viewer.html
3. pdf-viewer.html loads PDF.js
4. PDF.js renders PDF + text layer
5. Content script injects into viewer HTML
6. Standard DOM APIs work (getSelection, event listeners)
```

**Manifest requirements:**

```typescript
{
  permissions: ["declarativeNetRequest"],
  web_accessible_resources: [{
    resources: ["pdf-viewer.html", "pdf.js/*"],
    matches: ["<all_urls>"]
  }],
  declarative_net_request: {
    rule_resources: [{
      id: "pdf_redirect",
      enabled: true,
      path: "rules.json"
    }]
  }
}
```

**PDF.js text extraction:**

```typescript
async function extractText(pdfUrl: string): Promise<string> {
  const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    fullText += content.items.map(item => item.str).join(' ') + '\n';
  }
  return fullText;
}
```

#### Approach C: Hybrid (Progressive Enhancement)

**Strategy:**
1. Start with Context Menu API (immediate PDF support)
2. Optionally add PDF.js viewer toggle in settings
3. Users who want tooltips/highlights can enable custom viewer

### 3. Security Considerations

- **CSP compliance:** All PDF.js scripts must be bundled locally (MV3 requirement)
- **CORS:** Cross-origin PDFs may require proxy or `fetch` with appropriate headers
- **File URLs:** Extension must request `file://` access separately
- **XSS:** Sanitize any PDF metadata displayed in UI

### 4. Performance Insights

| Approach | Initial Load | Memory | Bundle Size |
|----------|-------------|--------|-------------|
| Context Menu | None | Minimal | 0 KB |
| PDF.js | 200-500ms | 50-100MB/PDF | ~500 KB |

### 5. Real-World Examples

**Google Translate Extension:**
- Uses context menu for PDF text selection
- Does NOT replace native PDF viewer
- Simple, effective approach

**Hypothesis (annotation tool):**
- Full PDF.js integration
- Custom viewer with annotation layer
- Significant codebase complexity

---

## Implementation Recommendations

### Quick Win: Context Menu Integration

**Estimated changes:**
- `manifest.ts`: Add `contextMenus` permission
- `background/service-worker.ts`: Add context menu handler
- Connect to existing dictionary lookup flow

**Files to modify:**
1. `src/manifest.ts` - permissions
2. `src/background/service-worker.ts` - context menu logic
3. Potentially `src/shared/` - message types

### Code Example (TypeScript)

```typescript
// src/background/pdf-support.ts
export function setupPdfContextMenu() {
  chrome.contextMenus.create({
    id: 'vocab-lookup-pdf',
    title: 'Look up "%s"',
    contexts: ['selection'],
    documentUrlPatterns: ['*://*/*.pdf', 'file://*/*.pdf']
  });
}

export function handlePdfContextClick(
  info: chrome.contextMenus.OnClickData,
  tab?: chrome.tabs.Tab
) {
  if (info.menuItemId !== 'vocab-lookup-pdf') return;
  if (!info.selectionText) return;

  const word = info.selectionText.trim();
  // Reuse existing lookup logic
  lookupWord(word);
}
```

---

## Common Pitfalls

1. **Assuming content scripts work on PDFs** - They don't access PDF content
2. **Forgetting `file://` permissions** - Requires user opt-in
3. **Overengineering** - Context menu covers 90% of use cases
4. **PDF.js bundle bloat** - Consider lazy loading if implementing
5. **Not testing blob URLs** - PDFs opened via `blob:` have unique handling

---

## Resources & References

### Official Documentation
- [Chrome Extensions Manifest V3](https://developer.chrome.com/docs/extensions/mv3/)
- [chrome.contextMenus API](https://developer.chrome.com/docs/extensions/reference/contextMenus/)
- [declarativeNetRequest API](https://developer.chrome.com/docs/extensions/reference/declarativeNetRequest/)
- [PDF.js Documentation](https://mozilla.github.io/pdf.js/)

### GitHub Repositories
- [Mozilla PDF.js](https://github.com/niclaslindstedt/pdfjs-dist) - PDF rendering library
- [PDF.js Extension Examples](https://github.com/niclaslindstedt/niclaslindstedt-pdf-viewer)

---

## Decision Matrix

| Requirement | Context Menu | PDF.js Viewer |
|------------|--------------|---------------|
| Quick implementation | Yes | No |
| Works with native viewer | Yes | Replaces it |
| Tooltip on hover | No | Yes |
| Text highlighting | No | Yes |
| Bundle size impact | None | +500KB |
| Maintenance burden | Low | High |

---

## Recommended Next Steps

1. **Immediate:** Implement Context Menu approach
   - Add `contextMenus` permission
   - Create menu item for text selection
   - Wire to existing dictionary API

2. **Future (if needed):** PDF.js integration
   - Only if users specifically request hover tooltips in PDFs
   - Consider as separate optional feature

---

## Unresolved Questions

1. Should PDF support be enabled by default or opt-in via settings?
2. How should the extension handle blob URLs (in-memory PDFs)?
3. Is there demand for annotation/highlighting features in PDFs?
