---
title: "API Key Error UX Enhancement"
description: "Add settings link to API key errors and info tooltip on settings page"
status: completed
priority: P3
effort: 30m
branch: master
tags: [ux, settings, error-handling]
created: 2026-01-17
---

# API Key Error UX Enhancement

## Overview

Improve user experience when API key is missing/invalid by:
1. Adding clickable "Open Settings" link in error tooltips
2. Adding info tooltip (?) next to API key input explaining why it's needed

## Current Behavior

- Error: `"OpenAI API key not configured. Please set it in extension settings."` (plain text)
- No direct link to settings from error
- No explanation of why API key is needed on settings page

## Target Behavior

- Error with clickable link: `"OpenAI API key not configured."` + [Open Settings] button
- Info tooltip on API key input explaining purpose and linking to provider console

## Implementation Phases

| Phase | Description | Status | Effort |
|-------|-------------|--------|--------|
| [Phase 01](./phase-01-error-link.md) | Add settings link to error tooltip | pending | 15m |
| [Phase 02](./phase-02-info-tooltip.md) | Add info tooltip to API key input | pending | 15m |

## Key Files

- `src/content/content-script.ts` - Error tooltip display (lines 795-836)
- `src/options/Options.tsx` - Settings page, API key input (lines 508-598)
- `src/shared/translation-service.ts` - Error message generation (line 270)

## Architecture

```
Error Flow:
translation-service.ts → throws error with message
  ↓
service-worker.ts → catches, sends SHOW_TOOLTIP_ERROR
  ↓
content-script.ts → showErrorTooltip() → enhanced with "Open Settings" button
                                          ↓
                                    chrome.runtime.openOptionsPage()
```

## Success Criteria

- [ ] Error tooltip shows "Open Settings" button when API key missing
- [ ] Clicking button opens extension options page
- [ ] Info icon (?) appears next to API key input
- [ ] Hovering info icon shows explanation tooltip
