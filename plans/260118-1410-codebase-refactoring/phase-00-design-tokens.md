# Phase 0: Design Tokens & Styling Consistency

## Context Links

- [Main Plan](./plan.md)
- Related: `src/content/content-style.css`, `tailwind.config.js`, `src/index.css`

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-01-18 |
| Priority | P0 (Foundation - do first) |
| Status | **completed** |
| Effort | 1h |
| Purpose | Establish consistent design system before component refactoring |

## Problem Analysis

### Current Inconsistencies

1. **Colors defined in multiple places**
   - `content-style.css`: `#3b82f6`, `#22c55e`, `#dc2626`
   - Tailwind: `primary-600`, `green-500`, `red-600`
   - Inline: Various hex values

2. **No single source of truth**
   - Updating primary blue requires changes in 3+ files
   - Easy to introduce inconsistency during updates

3. **React vs Vanilla CSS split**
   - React: Uses Tailwind classes
   - Content-script: Uses custom CSS classes
   - No shared tokens between them

## Solution: CSS Custom Properties

### Architecture

```
src/
├── styles/
│   └── design-tokens.css    # CSS variables (single source of truth)
├── content/
│   └── content-style.css    # Uses var(--vocab-*)
├── index.css                # Imports tokens, Tailwind uses them
└── tailwind.config.js       # References CSS variables
```

### Design Tokens Schema

```css
/* src/styles/design-tokens.css */
:root {
  /* Colors - Primary */
  --vocab-primary-50: #eff6ff;
  --vocab-primary-100: #dbeafe;
  --vocab-primary-500: #3b82f6;
  --vocab-primary-600: #2563eb;
  --vocab-primary-700: #1d4ed8;

  /* Colors - Success */
  --vocab-success-50: #f0fdf4;
  --vocab-success-500: #22c55e;
  --vocab-success-600: #16a34a;
  --vocab-success-700: #166534;

  /* Colors - Error */
  --vocab-error-50: #fef2f2;
  --vocab-error-500: #ef4444;
  --vocab-error-600: #dc2626;
  --vocab-error-700: #991b1b;

  /* Colors - Warning/Amber */
  --vocab-warning-50: #fef3c7;
  --vocab-warning-500: #f59e0b;
  --vocab-warning-700: #92400e;

  /* Colors - Neutral */
  --vocab-gray-50: #f9fafb;
  --vocab-gray-100: #f3f4f6;
  --vocab-gray-200: #e5e7eb;
  --vocab-gray-400: #9ca3af;
  --vocab-gray-500: #6b7280;
  --vocab-gray-700: #374151;
  --vocab-gray-900: #1f2937;

  /* Colors - AI/Purple */
  --vocab-ai-gradient: linear-gradient(135deg, #818cf8, #6366f1);
  --vocab-ai-500: #6366f1;

  /* Typography */
  --vocab-font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --vocab-font-size-xs: 10px;
  --vocab-font-size-sm: 12px;
  --vocab-font-size-base: 14px;
  --vocab-font-size-lg: 16px;
  --vocab-font-size-xl: 20px;
  --vocab-font-size-2xl: 22px;

  /* Spacing */
  --vocab-space-1: 4px;
  --vocab-space-2: 8px;
  --vocab-space-3: 12px;
  --vocab-space-4: 16px;
  --vocab-space-5: 20px;

  /* Border Radius */
  --vocab-radius-sm: 4px;
  --vocab-radius-md: 8px;
  --vocab-radius-lg: 12px;
  --vocab-radius-full: 9999px;

  /* Shadows */
  --vocab-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --vocab-shadow-md: 0 4px 16px rgba(0, 0, 0, 0.15);
  --vocab-shadow-lg: 0 4px 20px rgba(0, 0, 0, 0.15);

  /* Z-Index */
  --vocab-z-dropdown: 10;
  --vocab-z-tooltip: 999999;
  --vocab-z-menu: 999998;
}
```

## Implementation Steps

### Step 1: Create Design Tokens File (15 min)
- [ ] Create `src/styles/design-tokens.css`
- [ ] Define all color, typography, spacing tokens
- [ ] Add comments for each category

### Step 2: Update Tailwind Config (15 min)
- [ ] Import design tokens in tailwind.config.js
- [ ] Map Tailwind colors to CSS variables
- [ ] Test that Tailwind classes still work

### Step 3: Update content-style.css (20 min)
- [ ] Import design-tokens.css at top
- [ ] Replace hardcoded colors with `var(--vocab-*)`
- [ ] Replace hardcoded sizes with variables
- [ ] Test tooltip/menu appearance

### Step 4: Update index.css (10 min)
- [ ] Import design-tokens.css
- [ ] Verify React components render correctly

## Tailwind Config Update

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'var(--vocab-primary-50)',
          100: 'var(--vocab-primary-100)',
          500: 'var(--vocab-primary-500)',
          600: 'var(--vocab-primary-600)',
          700: 'var(--vocab-primary-700)',
        },
        // ... other colors
      },
    },
  },
}
```

## Content-Style.css Migration Example

```css
/* Before */
.vocab-save-btn {
  background: #3b82f6;
  border-radius: 8px;
  font-size: 14px;
}

/* After */
.vocab-save-btn {
  background: var(--vocab-primary-500);
  border-radius: var(--vocab-radius-md);
  font-size: var(--vocab-font-size-base);
}
```

## Success Criteria

- [ ] All colors reference CSS variables
- [ ] Tailwind config uses CSS variables
- [ ] content-style.css uses CSS variables
- [ ] No visual changes (colors match exactly)
- [ ] Build succeeds
- [ ] Future color changes require only 1 file edit

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Visual regression | Screenshot before/after comparison |
| CSS variable not supported | Modern browsers all support (Chrome 49+) |
| Tailwind conflict | Test each color class works |

## Benefits

1. **Single source of truth** - Change `--vocab-primary-500` once, updates everywhere
2. **Consistency enforced** - Developers use tokens, not arbitrary values
3. **Easy theming** - Future dark mode just overrides variables
4. **Shared across React + Vanilla** - Same colors in both systems
