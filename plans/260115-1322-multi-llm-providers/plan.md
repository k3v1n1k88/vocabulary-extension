---
title: "Multi-LLM Provider Support"
description: "Add Gemini and Grok as translation provider options alongside OpenAI"
status: completed
priority: P2
effort: 4h
branch: master
tags: [feature, translation, api, settings]
created: 2026-01-15
---

# Multi-LLM Provider Support

## Overview

Add support for Google Gemini and xAI Grok as alternative LLM providers for translation, alongside existing OpenAI integration. Users select provider in settings with per-provider API key management.

## User Requirements

- Same prompt format across all providers
- Dropdown in settings to select provider
- Default Gemini model: gemini-2.0-flash
- Registration links for each provider's API key

## Provider Summary

| Provider | Endpoint | Auth | Model |
|----------|----------|------|-------|
| OpenAI | `api.openai.com/v1/chat/completions` | Bearer | gpt-4o-mini |
| Gemini | `generativelanguage.googleapis.com/v1beta/models/...` | Header (`x-goog-api-key`) | gemini-2.0-flash |
| Grok | `api.x.ai/v1/chat/completions` | Bearer | grok-2 |

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Settings UI                        │
│  [Provider Dropdown] [API Key Input] [Register Link]│
└────────────────────────┬────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────┐
│              translation-service.ts                  │
│  translateText() → routes to provider adapter        │
└────────────────────────┬────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
   ┌─────────┐     ┌──────────┐     ┌─────────┐
   │ OpenAI  │     │  Gemini  │     │  Grok   │
   │ Adapter │     │  Adapter │     │ Adapter │
   └─────────┘     └──────────┘     └─────────┘
```

## Phases

| # | Phase | Status | Effort | Link |
|---|-------|--------|--------|------|
| 1 | Types & Configuration | Pending | 30m | [phase-01](./phase-01-types-and-config.md) |
| 2 | Translation Service Refactor | Pending | 1.5h | [phase-02-translation-service-refactor.md](./phase-02-translation-service-refactor.md) |
| 3 | Settings UI Updates | Pending | 1h | [phase-03-settings-ui-updates.md](./phase-03-settings-ui-updates.md) |

## Research Reports

- [Gemini API Research](./research/researcher-gemini-api.md)
- [Grok API Research](./research/researcher-grok-api.md)

## Dependencies

- Existing `openai-translation.ts` (refactor target)
- `Options.tsx` settings page
- `src/types/index.ts` type definitions
- `src/shared/store.ts` Zustand stores

## Success Criteria

1. User can select OpenAI, Gemini, or Grok from settings dropdown
2. API key input shows registration link for selected provider
3. Translation works with all three providers using same prompt format
4. Backward compatible - existing OpenAI users unaffected

## Validation Summary

**Validated:** 2026-01-15
**Questions asked:** 5

### Confirmed Decisions

| Decision | User Choice |
|----------|-------------|
| Gemini API auth method | Use `x-goog-api-key` header (not query param) |
| Migration strategy | Delete old file, git provides rollback |
| Missing API key UX | Prompt modal to enter key immediately |
| Test connection button | Yes, add test button before save |
| Model selection | Yes, add model dropdown per provider |

### Action Items (Plan Revisions Completed)

- [x] **Phase 01**: Add `models: string[]` array to ProviderConfig for model options
- [x] **Phase 02**: Change Gemini auth from query param to `x-goog-api-key` header
- [x] **Phase 02**: Add `testConnection(provider, apiKey)` function
- [x] **Phase 03**: Add "Test" button next to Save button
- [x] **Phase 03**: Add model dropdown that populates from provider config
- [x] **Phase 03**: Add inline prompt when user has no key for selected provider

### Effort Adjustment

Original: 3h → Revised: **4h** (additional UI features)
