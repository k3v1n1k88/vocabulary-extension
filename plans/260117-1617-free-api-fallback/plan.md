---
title: "Free Translation API Fallback"
description: "Use free translation API when LLM provider key is missing"
status: completed
priority: P2
effort: 1h
branch: master
tags: [translation, fallback, ux]
created: 2026-01-17
---

# Free Translation API Fallback

## Overview

When user attempts to translate phrases/sentences without configured LLM API key, fallback to free translation API instead of showing error.

## Current Behavior

- User selects text → triggers translation
- No API key → Error: "OpenAI API key not configured..."
- User must configure key before using translation

## Target Behavior

- User selects text → triggers translation
- No API key → Uses free MyMemory API automatically
- Shows "Free" badge + "Get better results with AI →" link in tooltip
- Clicking AI link opens settings page (API key section)
- LLM translation preferred when key available

## Implementation Phases

| Phase | Description | Status | Effort |
|-------|-------------|--------|--------|
| [Phase 01](./phase-01-free-api-integration.md) | Add Lingva free translation API | completed | 30m |
| [Phase 02](./phase-02-fallback-indicator.md) | Add fallback logic + UI indicator | completed | 30m |

## Key Files

- `src/shared/translation-service.ts` - Main translation logic (lines 256-317)
- `src/types/index.ts` - TranslationResult interface (lines 103-112)
- `src/content/content-script.ts` - Translation tooltip display

## Architecture

```
User selects phrase
       ↓
translateToTargetLanguage()
       ↓
Check API key exists?
   ├── YES → LLM translation (current flow)
   └── NO  → Free API translation (new)
              ↓
         MyMemory API call
              ↓
         Return TranslationResult with isFreeTranslation=true
              ↓
         Tooltip shows "Free translation" badge
```

## Free API Choice: Lingva Translate

- Google Translate frontend (open source)
- No API key required, no daily limits
- Built-in auto-detect source language
- Supports all target languages
- REST API: `https://lingva.ml/api/v1/{source}/{target}/{text}`
- Fallback instances: lingva.thedaviddelta.com, lingva.garudalinux.org

## Success Criteria

- [ ] Translation works without API key configured
- [ ] Free translation result displayed correctly
- [ ] "Free" badge + "Get better results with AI →" visible
- [ ] Clicking AI link opens settings → API key section
- [ ] LLM translation used when key available
