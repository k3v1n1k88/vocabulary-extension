# Phase 4: Shared Components

## Context Links

- [Main Plan](./plan.md)
- [Phase 3: SidePanel](./phase-03-sidepanel-refactoring.md)
- Related: `src/shared/`, `src/popup/App.tsx`

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-01-18 |
| Priority | P2 (DRY enforcement) |
| Status | **completed** |
| Effort | 2h |
| Target | Eliminate all UI duplication |

## Problem Analysis

### Current Duplication

1. **Donate Bar** - Appears in:
   - `src/popup/App.tsx` (lines 14-40)
   - `src/sidepanel/SidePanel.tsx` (lines 394-421)
   - `src/options/Options.tsx` (lines 829-850)

2. **Footer Credits** - Appears in:
   - `src/popup/App.tsx` (lines 52-87)
   - `src/sidepanel/SidePanel.tsx` (lines 423-459)
   - `src/options/Options.tsx` (lines 131-164)

3. **Toggle Component** - Currently in:
   - `src/options/Options.tsx` (lines 872-887)
   - Could be used in popup settings

4. **AI Badge** - Appears in:
   - `src/content/content-script.ts` (multiple locations)
   - `src/sidepanel/SidePanel.tsx` (lines 9-17, ResultCard)
   - Inconsistent styling

5. **Language Dropdown** - Appears in:
   - `src/content/content-script.ts` (inline HTML)
   - `src/sidepanel/SidePanel.tsx` (LangDropdown component)
   - Different implementations

6. **StatItem** - Currently in:
   - `src/options/Options.tsx` (lines 863-870)
   - Dashboard uses similar pattern

## Architecture

### Proposed Shared Components

```
src/shared/components/
  toggle.tsx          # Toggle switch (~25 lines)
  stat-item.tsx       # Stats display (~20 lines)
  donate-bar.tsx      # Donate section (~50 lines)
  footer-credits.tsx  # Footer with links (~60 lines)
  ai-badge.tsx        # AI/Free badge (~30 lines)
  lang-dropdown.tsx   # Language selector (~80 lines)
  index.ts            # Barrel export
```

### Component Specifications

**toggle.tsx**
```tsx
interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  size?: 'sm' | 'md'
}
```

**stat-item.tsx**
```tsx
interface StatItemProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
}
```

**donate-bar.tsx**
```tsx
interface DonateBarProps {
  compact?: boolean  // For sidepanel
  showMessage?: boolean
}
```

**footer-credits.tsx**
```tsx
interface FooterCreditsProps {
  variant?: 'popup' | 'sidepanel' | 'options'
}
```

**ai-badge.tsx**
```tsx
interface AiBadgeProps {
  type: 'ai' | 'free'
  size?: 'xs' | 'sm' | 'md'
}
```

**lang-dropdown.tsx**
```tsx
interface LangDropdownProps {
  value: string
  onChange: (langCode: string) => void
  disabled?: boolean
  showNativeName?: boolean
}
```

## Related Code Files

- `src/types/index.ts` - SUPPORTED_LANGUAGES array
- All UI components that use duplicated patterns

## Implementation Steps

### Step 1: Create Toggle Component (15 min)
- [ ] Create `src/shared/components/toggle.tsx`
- [ ] Add size variants
- [ ] Replace in Options.tsx
- [ ] Export from index.ts

### Step 2: Create StatItem Component (15 min)
- [ ] Create `src/shared/components/stat-item.tsx`
- [ ] Add optional icon and trend
- [ ] Replace in Options.tsx
- [ ] Consider using in Dashboard

### Step 3: Create AI Badge Component (15 min)
- [ ] Create `src/shared/components/ai-badge.tsx`
- [ ] Support 'ai' and 'free' variants
- [ ] Include robot icon for AI
- [ ] Replace in SidePanel ResultCard
- [ ] Note: content-script uses inline HTML (separate concern)

### Step 4: Create Language Dropdown (30 min)
- [ ] Create `src/shared/components/lang-dropdown.tsx`
- [ ] Support native name display
- [ ] Handle click outside
- [ ] Replace in SidePanel
- [ ] Note: content-script uses vanilla JS (keep separate)

### Step 5: Create Donate Bar (20 min)
- [ ] Create `src/shared/components/donate-bar.tsx`
- [ ] Support compact mode for sidepanel
- [ ] Include both BuyMeACoffee and PayPal
- [ ] Replace in popup/App.tsx
- [ ] Replace in SidePanel.tsx
- [ ] Replace in Options.tsx (About section)

### Step 6: Create Footer Credits (20 min)
- [ ] Create `src/shared/components/footer-credits.tsx`
- [ ] Include Rate and Issue links
- [ ] Include developer credit
- [ ] Support variant styling
- [ ] Replace in popup/App.tsx
- [ ] Replace in SidePanel.tsx
- [ ] Replace in Options.tsx sidebar

### Step 7: Create Barrel Export (5 min)
- [ ] Create `src/shared/components/index.ts`
- [ ] Export all components

### Step 8: Update All Consumers (20 min)
- [ ] Update popup/App.tsx
- [ ] Update SidePanel.tsx
- [ ] Update Options.tsx
- [ ] Verify no broken imports

## Success Criteria

- [ ] All 6 shared components created
- [ ] Donate bar used in 3 places from single source
- [ ] Footer used in 3 places from single source
- [ ] Toggle reusable with size variants
- [ ] Build succeeds
- [ ] Visual parity maintained

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Style inconsistencies | Compare before/after screenshots |
| Link targets wrong | Verify all external links work |
| Import cycles | Use barrel export carefully |
| Tailwind classes missing | Check all variants compile |

## Testing Checklist

- [ ] Open popup -> donate bar visible, links work
- [ ] Open popup -> footer visible, Rate/Issue links work
- [ ] Open sidepanel -> donate bar visible (compact)
- [ ] Open sidepanel -> footer visible
- [ ] Open options -> About section has donate
- [ ] Open options -> Sidebar has footer
- [ ] Toggle in settings works
- [ ] AI badge shows correct variant
- [ ] Language dropdown opens, selects, closes on outside click

## DRY Impact Summary

| Component | Before (instances) | After (instances) | Lines Saved |
|-----------|-------------------|------------------|-------------|
| Donate Bar | 3 | 1 | ~80 |
| Footer | 3 | 1 | ~100 |
| Toggle | 1 (inline) | 1 (shared) | ~15 |
| AI Badge | 3+ | 1 | ~40 |
| Lang Dropdown | 2 | 1 | ~70 |
| **Total** | | | **~305 lines** |

## Unresolved Questions

- Should content-script tooltip badges use React components via injection?
  - Recommendation: Keep inline HTML for content-script (simpler, no React overhead)
- Should lang-dropdown support search/filter for many languages?
  - Recommendation: YAGNI - only 10 languages currently
