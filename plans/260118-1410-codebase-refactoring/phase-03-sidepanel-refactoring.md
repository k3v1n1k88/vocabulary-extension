# Phase 3: SidePanel Refactoring

## Context Links

- [Main Plan](./plan.md)
- [Phase 2: Options](./phase-02-options-refactoring.md)
- Related: `src/sidepanel/SidePanel.tsx`

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-01-18 |
| Priority | P2 (Medium) |
| Status | **completed** |
| Effort | 1.5h |
| Current LOC | 849 |
| Target LOC | <200 (main) + components |

## Problem Analysis

### Current Issues

1. **ResultCard too large** (~240 lines)
   - Handles both word and translation results
   - Complex conditional rendering
   - Language dropdowns inline

2. **Duplicated UI patterns**
   - `AiRobotIcon` (already extracted, good)
   - `LangDropdown` (~70 lines) - similar to content-script
   - `HistoryItemComponent` (already extracted, good)
   - Donate bar same as popup/options

3. **Main component too long** (~460 lines)
   - Loading, error, result, history all in one
   - Many event handlers inline

## Architecture

### Proposed Component Structure

```
src/sidepanel/
  SidePanel.tsx               # Main panel (~150 lines)
  components/
    result-card.tsx           # Word + Translation results (~200 lines)
    word-result-card.tsx      # Word-specific display (~100 lines)
    translation-result-card.tsx # Translation display (~100 lines)
    history-list.tsx          # History section (~80 lines)
    panel-header.tsx          # Header with logo (~30 lines)
    empty-state.tsx           # No result placeholder (~30 lines)
    error-state.tsx           # Error display (~60 lines)
```

### Component Responsibilities

**SidePanel.tsx** (Main)
- State management (result, history, settings)
- Storage listeners
- Render appropriate state

**result-card.tsx**
- Orchestrate word vs translation display
- Props: result, handlers

**word-result-card.tsx**
- Word header with pronunciation
- Definition, translation, examples
- Synonyms/antonyms chips
- Save button
- AI upsell hint

**translation-result-card.tsx**
- Original text with audio
- Language selectors
- Translation display
- Copy button
- AI upsell hint

**history-list.tsx**
- Recent lookups section
- Clear button
- Item list with HistoryItemComponent

**panel-header.tsx**
- Logo and title
- PDF badge

**empty-state.tsx**
- Instruction text
- Icon

**error-state.tsx**
- Error icon and message
- API key error -> settings button
- Query limit error -> AI mode button

## Related Code Files

- `src/shared/store.ts` - Settings type
- `src/types/index.ts` - Word, TranslationResult, PdfLookupResult
- `src/popup/App.tsx` - Has same donate bar, footer

## Implementation Steps

### Step 1: Extract Empty and Error States (15 min)
- [ ] Create `src/sidepanel/components/empty-state.tsx`
- [ ] Create `src/sidepanel/components/error-state.tsx`
- [ ] Handle different error types (query limit, API key, generic)
- [ ] Import in SidePanel

### Step 2: Extract Panel Header (10 min)
- [ ] Create `src/sidepanel/components/panel-header.tsx`
- [ ] Move header section
- [ ] Import in SidePanel

### Step 3: Split ResultCard (45 min)
- [ ] Create `src/sidepanel/components/word-result-card.tsx`
- [ ] Create `src/sidepanel/components/translation-result-card.tsx`
- [ ] Simplify `result-card.tsx` to dispatch
- [ ] Pass handlers as props

### Step 4: Extract History List (20 min)
- [ ] Create `src/sidepanel/components/history-list.tsx`
- [ ] Move HistoryItemComponent inside or keep separate
- [ ] Handle clear action
- [ ] Import in SidePanel

### Step 5: Refactor Main SidePanel (20 min)
- [ ] Import all components
- [ ] Simplify render logic
- [ ] Keep state and handlers at top level
- [ ] Move donate bar to shared (Phase 4)

## Success Criteria

- [ ] SidePanel.tsx under 200 lines
- [ ] ResultCard split into focused components
- [ ] All error states handled properly
- [ ] History works correctly
- [ ] Build succeeds

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Language change broken | Test source/target dropdown changes |
| Save word fails | Test save button updates correctly |
| History selection broken | Test clicking history item loads result |
| Error state navigation fails | Test "Configure API Key" button |

## Testing Checklist

- [ ] Open sidepanel from PDF
- [ ] Select word in PDF -> lookup appears
- [ ] Select phrase -> translation appears
- [ ] Click speaker -> audio plays
- [ ] Change source language -> retranslates
- [ ] Change target language -> retranslates
- [ ] Click "Save to Vocabulary" -> shows saved
- [ ] History shows recent lookups
- [ ] Click history item -> loads result
- [ ] Click "Clear" -> history clears
- [ ] Trigger query limit error -> shows AI mode button
- [ ] Trigger API key error -> shows configure button
