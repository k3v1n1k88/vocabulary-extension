---
title: "Codebase Refactoring"
description: "Modularize large files, extract components, apply DRY principles"
status: completed
priority: P2
effort: 9h
branch: master
tags: [refactoring, modularization, components, dry, design-tokens]
created: 2026-01-18
---

# Codebase Refactoring Plan

## Context

- **Codebase**: Vocabulary Builder Chrome Extension
- **Tech Stack**: React 18, TypeScript, Vite, Zustand, Tailwind CSS
- **Key Issue**: Several files exceed 200-line guideline; DRY violations exist

## Problem Summary

| File | LOC | Issue |
|------|-----|-------|
| content-script.ts | 1337 | Settings duplication, tooltip sprawl, inline HTML |
| Options.tsx | 887 | Monolithic SettingsContent (~700 lines) |
| SidePanel.tsx | 849 | ResultCard too large, donate/footer duplicated |
| popup/App.tsx | 92 | Contains duplicate donate bar, footer |

## Refactoring Strategy

0. **Phase 0**: Design Tokens - CSS variables for consistency (~1h) ✅
1. **Phase 1**: content-script.ts - Split into 6 modules (~2.5h) ✅
2. **Phase 2**: Options.tsx - Extract 6+ components (~2h) ✅
3. **Phase 3**: SidePanel.tsx - Extract 3 components (~1.5h) ✅
4. **Phase 4**: Shared components - DRY across app (~2h) ✅

## Proposed File Structure

```
src/
  styles/
    design-tokens.css      # CSS variables (single source of truth)
  content/
    content-script.ts      # Main entry (orchestration only)
    settings-manager.ts    # Settings load/cache/sync
    tooltip-manager.ts     # Tooltip lifecycle
    tooltip-templates.ts   # HTML generation
    floating-menu.ts       # Floating button UI
    keyboard-shortcuts.ts  # Shortcut detection
    tts-player.ts          # Audio playback
    utils/
      html-escape.ts       # escapeHtml, escapeAttr
  options/
    Options.tsx            # Shell + tabs
    components/
      settings-content.tsx
      api-key-input.tsx
      learning-settings.tsx
      translation-settings.tsx
      data-management.tsx
  sidepanel/
    SidePanel.tsx          # Main panel
    components/
      result-card.tsx
      word-result.tsx
      translation-result.tsx
  shared/
    components/
      toggle.tsx           # Reusable toggle
      stat-item.tsx        # Stats display
      donate-bar.tsx       # Donate section
      footer-credits.tsx   # Footer with links
      ai-badge.tsx         # AI/Free badge
      lang-dropdown.tsx    # Language selector
```

## Phase Documents

- [Phase 0: Design Tokens](./phase-00-design-tokens.md) - CSS variables for consistency
- [Phase 1: Content Script Refactoring](./phase-01-content-script-refactoring.md)
- [Phase 2: Options Page Refactoring](./phase-02-options-refactoring.md)
- [Phase 3: SidePanel Refactoring](./phase-03-sidepanel-refactoring.md)
- [Phase 4: Shared Components](./phase-04-shared-components.md)

## Success Criteria

- All files under 200 lines (except complex orchestrators)
- Zero settings parsing duplication
- Shared components used across popup, options, sidepanel
- All tests pass, build succeeds
- No regressions in functionality

## Validation Summary

**Validated:** 2026-01-18
**Questions asked:** 6

### Confirmed Decisions

| Decision | User Choice |
|----------|-------------|
| Module pattern | **Singletons** - Class-based managers with internal state |
| Content-script vs React | **Keep separate** - Vanilla JS in content-script, React in popup/sidepanel/options |
| Execution order | **Phase 0 → 1 → 2 → 3 → 4** - Design tokens first, then largest files |
| Tooltip positioning | **Single shared utility** - One `calculatePosition()` for all tooltip types |
| TTS architecture | **Keep current split** - Service-worker fetches, content-script plays |
| Testing approach | **Full test coverage** - Unit tests for all extracted modules |
| Styling consistency | **CSS Custom Properties** - Design tokens shared by React + Vanilla CSS |

### Action Items

- [ ] Update Phase 1 to specify singleton pattern for managers
- [ ] Update Phase 1 to add unit tests for html-escape, settings-manager
- [ ] Update tooltip-manager spec to use shared `calculatePosition()` utility
- [ ] Add test file creation steps to each phase

### Resolved Questions

- **Lang-dropdown shared?** → Keep content-script separate (vanilla JS)
- **TTS to service-worker?** → No, keep current split
