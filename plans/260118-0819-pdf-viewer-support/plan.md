---
title: "PDF Viewer Support"
description: "Enable vocabulary lookup on PDF files via context menu with popup display"
status: completed
priority: P2
effort: 2h
branch: master
tags: [feature, pdf, context-menu, popup]
created: 2026-01-18
completed: 2026-01-18
---

# PDF Viewer Support Implementation Plan

## Overview

Enable vocabulary lookup/translation on PDF files opened in Chrome. Since content scripts cannot inject into Chrome's native PDF viewer, we use alternative display via popup.

## Problem Statement

- Context menu correctly captures selected text from PDFs (OS-level selection)
- However, `chrome.tabs.sendMessage()` fails on PDF pages - content script cannot inject DOM
- User selects text, right-clicks, selects "Look up / Translate", but nothing happens

## Solution

Detect PDF context and route results to **Side Panel** instead of content script tooltip.

> **Updated:** Implemented Side Panel (Chrome 114+) instead of popup for better UX - stays visible alongside PDF for continuous lookups.

## Architecture

```
[PDF Page] → [Context Menu Click] → [Service Worker]
                                          ↓
                                    [Detect PDF URL]
                                          ↓
                            ┌─────────────┴─────────────┐
                            ↓                           ↓
                      [Non-PDF]                      [PDF]
                            ↓                           ↓
                [Send to Content Script]    [Store in session + open Side Panel]
                            ↓                           ↓
                    [Show Tooltip]          [Side Panel displays result]
                                                        ↓
                                          [History + continuous lookups]
```

## Implementation Phases

| Phase | Description | Status | Est. |
|-------|-------------|--------|------|
| [Phase 01](./phase-01-pdf-detection-and-routing.md) | PDF detection + result routing | completed | 45m |
| [Phase 02](./phase-02-popup-pdf-result-display.md) | Popup PDF result display component | completed | 45m |
| [Phase 03](./phase-03-testing-and-polish.md) | Testing and edge case handling | completed | 30m |

## Files Modified

1. `src/manifest.ts` - Added `sidePanel` permission and `side_panel` config
2. `src/background/service-worker.ts` - PDF detection, `lookupForPdf()`, side panel opening
3. `src/sidepanel/index.html` - Side panel entry point (new)
4. `src/sidepanel/main.tsx` - React entry (new)
5. `src/sidepanel/SidePanel.tsx` - Main component with history (new)
6. `src/types/index.ts` - Added `PdfLookupResult` type
7. `vite.config.ts` - Added sidepanel to build inputs
8. `src/popup/App.tsx` - Fallback PDF result check (retained)
9. `src/popup/components/PdfLookupResult.tsx` - Fallback modal (retained)

## Success Criteria

- [ ] Context menu lookup works on remote PDFs (`https://*.pdf`)
- [ ] Context menu lookup works on local PDFs (`file://*.pdf`)
- [ ] Popup displays word definition/translation correctly
- [ ] User can save words to vocabulary from popup
- [ ] Graceful fallback when popup cannot open

## Dependencies

- Research: `plans/reports/research-260118-0758-pdf-viewer-support.md`

## Risks

| Risk | Mitigation |
|------|------------|
| `chrome.action.openPopup()` may fail in some contexts | Use notification as fallback |
| Session storage may not persist | Use local storage with cleanup |
