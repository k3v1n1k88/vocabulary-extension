# Phase 2: Options Page Refactoring

## Context Links

- [Main Plan](./plan.md)
- [Phase 1: Content Script](./phase-01-content-script-refactoring.md)
- Related: `src/options/Options.tsx`

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-01-18 |
| Priority | P1 (High - second largest) |
| Status | **completed** |
| Effort | 2h |
| Current LOC | 887 |
| Target LOC | <100 (main) + components |

## Problem Analysis

### Current Issues

1. **Monolithic SettingsContent** (~700 lines)
   - Learning settings, translation settings, API key management, data export
   - All in one function with complex state

2. **Inline API key handling** (~100 lines)
   - Test connection, save, clear logic mixed with JSX
   - Same pattern needed if adding more providers

3. **Duplicated components**
   - `Toggle` and `StatItem` defined inline
   - Could be shared across app

4. **Large about/support section** (~80 lines)
   - Donate links duplicated in popup, sidepanel

## Architecture

### Proposed Component Structure

```
src/options/
  Options.tsx                    # Shell + sidebar (~100 lines)
  components/
    settings-content.tsx         # Settings orchestration (~80 lines)
    learning-settings.tsx        # Daily goal, audio, notifications (~100 lines)
    translation-settings.tsx     # Language, AI toggle, provider (~120 lines)
    api-key-input.tsx            # API key management (~150 lines)
    data-management.tsx          # Export/import (~60 lines)
    about-section.tsx            # About & support (~80 lines)
```

### Component Responsibilities

**Options.tsx** (Main)
- Sidebar navigation
- Tab state management
- Render active tab content

**settings-content.tsx**
- Stats overview section
- Orchestrate settings sections
- Layout coordination

**learning-settings.tsx**
- Daily goal input
- Auto-play toggle
- Show translation toggle
- Notification settings (with interval)
- Keyboard shortcut settings

**translation-settings.tsx**
- Target language dropdown
- AI translation toggle
- LLM provider dropdown
- Model selection dropdown
- How translation works info box

**api-key-input.tsx**
- API key input with masking
- Test connection button
- Save/Clear buttons
- Status messages (success/error)
- Privacy notice

**data-management.tsx**
- Export data button
- Import functionality (future)

**about-section.tsx**
- Developer info
- Rate/Issue/Donate links
- Version info

## Related Code Files

- `src/shared/store.ts` - useSettingsStore, useStatsStore
- `src/shared/translation-service.ts` - saveApiKey, testConnection
- `src/shared/llm-provider-config.ts` - LLM_PROVIDERS, getProviderConfig
- `src/popup/components/Dashboard.tsx` - Reuses stats display

## Implementation Steps

### Step 1: Extract Toggle and StatItem (15 min)
- [ ] Move `Toggle` to `src/shared/components/toggle.tsx`
- [ ] Move `StatItem` to `src/shared/components/stat-item.tsx`
- [ ] Update imports in Options.tsx

### Step 2: Extract About Section (15 min)
- [ ] Create `src/options/components/about-section.tsx`
- [ ] Move developer info, donate links
- [ ] Import in settings-content

### Step 3: Extract Data Management (15 min)
- [ ] Create `src/options/components/data-management.tsx`
- [ ] Move export logic
- [ ] Add placeholder for future import

### Step 4: Extract API Key Input (30 min)
- [ ] Create `src/options/components/api-key-input.tsx`
- [ ] Props: `provider`, `onKeyChange`, `onTest`, `onSave`, `onClear`
- [ ] Move masking, test, save/clear logic
- [ ] Include status messages

### Step 5: Extract Translation Settings (30 min)
- [ ] Create `src/options/components/translation-settings.tsx`
- [ ] Move AI toggle, provider dropdown, model dropdown
- [ ] Conditionally render API key input
- [ ] Include info box

### Step 6: Extract Learning Settings (30 min)
- [ ] Create `src/options/components/learning-settings.tsx`
- [ ] Move daily goal, toggles
- [ ] Move notification interval section
- [ ] Move keyboard shortcut section

### Step 7: Refactor SettingsContent (15 min)
- [ ] Create `src/options/components/settings-content.tsx`
- [ ] Import all section components
- [ ] Keep stats overview
- [ ] Clean layout orchestration

### Step 8: Cleanup Options.tsx (10 min)
- [ ] Remove SettingsContent from file
- [ ] Import from components
- [ ] Verify sidebar and tabs work

## Success Criteria

- [ ] Options.tsx under 100 lines
- [ ] Each component under 150 lines
- [ ] Toggle and StatItem in shared
- [ ] All API key operations work
- [ ] Settings persist correctly
- [ ] Build succeeds

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| State management broken | Keep hooks at SettingsContent level, pass down |
| API key masking fails | Test save -> reload -> shows masked |
| Test connection broken | Verify with valid/invalid keys |
| Notification setup fails | Test reminder toggle + interval change |

## Testing Checklist

- [ ] Navigate between Dashboard/Study/Vocabulary/Settings tabs
- [ ] Change daily goal -> persists on refresh
- [ ] Toggle auto-play audio -> persists
- [ ] Enable notifications -> test button works
- [ ] Change reminder interval -> alarm updates
- [ ] Enable keyboard shortcut -> record new shortcut
- [ ] Change target language -> persists
- [ ] Toggle AI translation on/off
- [ ] Change LLM provider -> API key section updates
- [ ] Enter API key -> test -> save -> shows masked
- [ ] Clear API key -> input clears
- [ ] Export data -> JSON file downloads
