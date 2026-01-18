# Phase 1: Content Script Refactoring

## Context Links

- [Main Plan](./plan.md)
- Related: `src/content/content-script.ts`

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-01-18 |
| Priority | P1 (Highest - largest file) |
| Status | **completed** |
| Effort | 2.5h |
| Current LOC | 1337 |
| Target LOC | <150 (main) + modules |

## Problem Analysis

### Current Issues

1. **Settings duplication** (lines 36-79 and 116-150)
   - Same parsing logic repeated for language and shortcut settings
   - Two separate `chrome.storage.onChanged` listeners

2. **Tooltip sprawl** (4 tooltip functions with similar patterns)
   - `showLoadingTooltip`, `showTooltip`, `showTranslationTooltip`, `showErrorTooltip`
   - Each calculates position independently
   - Similar DOM manipulation patterns

3. **Inline HTML templates** (~300 lines)
   - `createTooltipHTML` (100 lines)
   - `createTranslationTooltipHTML` (80 lines)
   - Floating menu HTML in `showFloatingButton` (60 lines)

4. **Mixed concerns**
   - Event listeners mixed with business logic
   - Keyboard handling interleaved with UI code

## Architecture

### Proposed Module Structure

```
src/content/
  content-script.ts      # Entry point (~100 lines)
  settings-manager.ts    # Settings load/cache/sync (~80 lines)
  tooltip-manager.ts     # Tooltip lifecycle (~150 lines)
  tooltip-templates.ts   # HTML generation (~180 lines)
  floating-menu.ts       # Floating button logic (~120 lines)
  keyboard-shortcuts.ts  # Shortcut detection (~80 lines)
  tts-player.ts          # Audio utilities (~40 lines)
  utils/
    html-escape.ts       # escapeHtml, escapeAttr (~15 lines)
```

### Module Responsibilities

**settings-manager.ts**
- Export: `settingsManager` singleton
- Methods: `loadSettings()`, `getLanguage()`, `getShortcut()`, `saveLanguage()`
- Manages single storage listener for all settings

**tooltip-manager.ts**
- Export: `tooltipManager` singleton
- Methods: `showLoading()`, `showWord()`, `showTranslation()`, `showError()`, `remove()`
- Single position calculation utility
- Handles outside click listener

**tooltip-templates.ts**
- Export: `createWordTooltipHTML()`, `createTranslationTooltipHTML()`, `createLoadingHTML()`, `createErrorHTML()`
- Pure functions, no side effects
- Uses `escapeHtml` from utils

**floating-menu.ts**
- Export: `floatingMenu` singleton
- Methods: `show()`, `hide()`, `handleAction()`
- Language dropdown logic encapsulated

**keyboard-shortcuts.ts**
- Export: `setupKeyboardShortcuts()`, `cleanupKeyboardShortcuts()`
- Handles modifier key tracking
- Calls `floatingMenu.show()` on trigger

**tts-player.ts**
- Export: `playAudio()`, `showTTSError()`
- Manages audio element lifecycle

## Related Code Files

- `src/shared/tts.ts` - Browser TTS (may consolidate)
- `src/background/service-worker.ts` - Handles PLAY_AUDIO messages
- `src/types/index.ts` - Word, TranslationResult types

## Implementation Steps

### Step 1: Extract Utilities (15 min)
- [ ] Create `src/content/utils/html-escape.ts`
- [ ] Move `escapeHtml`, `escapeAttr` functions
- [ ] Update imports in content-script.ts

### Step 2: Extract Settings Manager (30 min)
- [ ] Create `src/content/settings-manager.ts`
- [ ] Consolidate settings loading logic
- [ ] Merge storage listeners into single handler
- [ ] Export cached values via getter methods
- [ ] Update content-script.ts to use manager

### Step 3: Extract Tooltip Templates (30 min)
- [ ] Create `src/content/tooltip-templates.ts`
- [ ] Move `createTooltipHTML`, `createTranslationTooltipHTML`
- [ ] Create `createLoadingHTML`, `createErrorHTML`
- [ ] Accept data objects as parameters
- [ ] Import in tooltip-manager

### Step 4: Extract Tooltip Manager (30 min)
- [ ] Create `src/content/tooltip-manager.ts`
- [ ] Extract position calculation into utility
- [ ] Consolidate show* functions into single class
- [ ] Handle DOM lifecycle (create, update, remove)
- [ ] Manage outside click listener

### Step 5: Extract Floating Menu (30 min)
- [ ] Create `src/content/floating-menu.ts`
- [ ] Move `showFloatingButton`, `removeFloatingButton`
- [ ] Encapsulate language dropdown logic
- [ ] Handle click events internally

### Step 6: Extract Keyboard Shortcuts (20 min)
- [ ] Create `src/content/keyboard-shortcuts.ts`
- [ ] Move shortcut detection logic
- [ ] Move modifier key tracking
- [ ] Export setup/cleanup functions

### Step 7: Extract TTS Player (15 min)
- [ ] Create `src/content/tts-player.ts`
- [ ] Move `playGoogleTTSAudio`, `showTTSError`
- [ ] Manage audio element

### Step 8: Cleanup Main Entry (20 min)
- [ ] Reduce content-script.ts to orchestration only
- [ ] Import all modules
- [ ] Wire up message listener
- [ ] Initialize on load

## Success Criteria

- [ ] Main content-script.ts under 150 lines
- [ ] Each module under 200 lines
- [ ] No settings parsing duplication
- [ ] All tooltip types use shared position logic
- [ ] Build succeeds
- [ ] Extension works: floating menu, tooltips, shortcuts, TTS

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Breaking tooltip positioning | Test all 4 tooltip types manually |
| Settings not syncing | Verify storage listener fires correctly |
| Message handling broken | Test SHOW_TOOLTIP, SHOW_TRANSLATION messages |
| Keyboard shortcuts fail | Test Ctrl+Shift+D and single modifier modes |

## Testing Checklist

- [ ] Select word -> floating menu appears
- [ ] Click "Look up" -> loading tooltip -> word tooltip
- [ ] Select phrase -> "Translate" -> translation tooltip
- [ ] Click speaker -> audio plays
- [ ] Change language in dropdown -> persists on refresh
- [ ] Enable shortcut mode -> Ctrl+Shift+D triggers menu
- [ ] Click outside tooltip -> closes
- [ ] Save word -> button changes to "Saved"
