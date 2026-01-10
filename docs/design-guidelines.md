# Vocabulary Chrome Extension - Design Guidelines

**Version:** 1.0.0 | **Last Updated:** January 10, 2026

---

## 1. Design Philosophy

### Core Principles
- **Minimalist**: Clean, focused interfaces that reduce cognitive load
- **Accessible**: WCAG 2.1 AA compliant, supports screen readers
- **Consistent**: Unified visual language across all extension surfaces
- **Performant**: Smooth 60fps animations, optimized for extension constraints

### Design Constraints
- **Popup dimensions**: 420px (width) x 600px (max height)
- **Tooltip**: Max 320px width, dynamic height
- **Extension context**: Must work on any webpage without CSS conflicts

---

## 2. Color Palette

### Primary Colors
| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `primary-50` | `#EFF6FF` | 239, 246, 255 | Hover backgrounds |
| `primary-100` | `#DBEAFE` | 219, 234, 254 | Selected states |
| `primary-200` | `#BFDBFE` | 191, 219, 254 | Progress fills |
| `primary-500` | `#3B82F6` | 59, 130, 246 | Primary actions, links |
| `primary-600` | `#2563EB` | 37, 99, 235 | Hover state |
| `primary-700` | `#1D4ED8` | 29, 78, 216 | Active/pressed state |

### Semantic Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `success-500` | `#22C55E` | Success states, correct answers |
| `success-600` | `#16A34A` | Success hover |
| `warning-500` | `#F59E0B` | Warning states |
| `error-500` | `#EF4444` | Error states, wrong answers |
| `error-600` | `#DC2626` | Error hover |
| `streak-500` | `#F97316` | Streak fire, gamification |
| `streak-600` | `#EA580C` | Streak hover |

### Neutral Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `gray-50` | `#F9FAFB` | Page backgrounds |
| `gray-100` | `#F3F4F6` | Card backgrounds |
| `gray-200` | `#E5E7EB` | Borders, dividers |
| `gray-300` | `#D1D5DB` | Disabled borders |
| `gray-400` | `#9CA3AF` | Placeholder text |
| `gray-500` | `#6B7280` | Secondary text |
| `gray-600` | `#4B5563` | Body text |
| `gray-700` | `#374151` | Headings |
| `gray-800` | `#1F2937` | Primary text |
| `gray-900` | `#111827` | High emphasis text |

### Dark Mode (Future)
Reserved tokens for dark mode implementation:
- `dark-bg`: `#1F2937`
- `dark-surface`: `#374151`
- `dark-border`: `#4B5563`

---

## 3. Typography

### Font Family
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

**Google Fonts Import:**
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

**Vietnamese Support:** Inter supports Vietnamese diacritical marks (a, e, o, u with circumflex, horn, breve, and tone marks).

### Type Scale (8px baseline)
| Token | Size | Line Height | Weight | Usage |
|-------|------|-------------|--------|-------|
| `text-xs` | 12px | 16px (1.33) | 400 | Captions, labels |
| `text-sm` | 14px | 20px (1.43) | 400 | Body secondary |
| `text-base` | 16px | 24px (1.5) | 400 | Body primary |
| `text-lg` | 18px | 28px (1.56) | 500 | Subheadings |
| `text-xl` | 20px | 28px (1.4) | 600 | Card titles |
| `text-2xl` | 24px | 32px (1.33) | 600 | Section headers |
| `text-3xl` | 30px | 36px (1.2) | 700 | Page titles |

### Font Weights
| Token | Weight | Usage |
|-------|--------|-------|
| `font-normal` | 400 | Body text |
| `font-medium` | 500 | Labels, navigation |
| `font-semibold` | 600 | Buttons, headings |
| `font-bold` | 700 | Emphasis, titles |

---

## 4. Spacing System

### Base Unit: 8px

| Token | Value | Usage |
|-------|-------|-------|
| `space-0` | 0px | - |
| `space-0.5` | 2px | Tight icon gaps |
| `space-1` | 4px | Icon padding |
| `space-2` | 8px | Element gaps |
| `space-3` | 12px | Button padding (vertical) |
| `space-4` | 16px | Card padding, section gaps |
| `space-5` | 20px | Component margins |
| `space-6` | 24px | Section separation |
| `space-8` | 32px | Large gaps |
| `space-10` | 40px | Page sections |
| `space-12` | 48px | Major divisions |

### Layout Grid
- **Popup**: 16px padding, 12px gap between elements
- **Cards**: 16px internal padding
- **Lists**: 8px gap between items

---

## 5. Border & Radius

### Border Radius
| Token | Value | Usage |
|-------|-------|-------|
| `rounded-none` | 0px | - |
| `rounded-sm` | 4px | Input fields, small buttons |
| `rounded` | 6px | Default components |
| `rounded-md` | 8px | Cards, modals |
| `rounded-lg` | 12px | Large cards, containers |
| `rounded-xl` | 16px | Hero sections |
| `rounded-full` | 9999px | Pills, avatars, badges |

### Border Width
| Token | Value | Usage |
|-------|-------|-------|
| `border` | 1px | Default borders |
| `border-2` | 2px | Focus rings, emphasis |

---

## 6. Shadows & Elevation

| Token | CSS Value | Usage |
|-------|-----------|-------|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `shadow` | `0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)` | Cards |
| `shadow-md` | `0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)` | Dropdowns |
| `shadow-lg` | `0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)` | Modals, tooltips |
| `shadow-xl` | `0 20px 25px rgba(0,0,0,0.1), 0 10px 10px rgba(0,0,0,0.04)` | Floating elements |

---

## 7. Component Specifications

### Buttons

#### Primary Button
```css
.btn-primary {
  background: #3B82F6;
  color: white;
  padding: 10px 16px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 14px;
  transition: all 300ms ease-out;
}
.btn-primary:hover { background: #2563EB; }
.btn-primary:active { background: #1D4ED8; transform: scale(0.98); }
.btn-primary:focus { box-shadow: 0 0 0 3px rgba(59,130,246,0.4); }
```

#### Secondary Button
```css
.btn-secondary {
  background: white;
  color: #374151;
  border: 1px solid #E5E7EB;
  padding: 10px 16px;
  border-radius: 6px;
  font-weight: 500;
}
.btn-secondary:hover { background: #F9FAFB; border-color: #D1D5DB; }
```

#### Sizes
| Size | Padding | Font Size | Min Width |
|------|---------|-----------|-----------|
| `sm` | 6px 12px | 12px | 64px |
| `md` | 10px 16px | 14px | 80px |
| `lg` | 12px 24px | 16px | 96px |

### Cards
```css
.card {
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.card:hover {
  border-color: #D1D5DB;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}
```

### Flashcard
```css
.flashcard {
  width: 100%;
  aspect-ratio: 3/2;
  perspective: 1000px;
}
.flashcard-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 600ms cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
}
.flashcard.flipped .flashcard-inner {
  transform: rotateY(180deg);
}
.flashcard-front, .flashcard-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.flashcard-back {
  transform: rotateY(180deg);
}
```

### Input Fields
```css
.input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  font-size: 14px;
  transition: all 200ms ease-out;
}
.input:focus {
  outline: none;
  border-color: #3B82F6;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.2);
}
.input::placeholder {
  color: #9CA3AF;
}
```

### Badges
```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
}
.badge-primary { background: #EFF6FF; color: #3B82F6; }
.badge-success { background: #DCFCE7; color: #16A34A; }
.badge-warning { background: #FEF3C7; color: #D97706; }
.badge-streak { background: #FFF7ED; color: #EA580C; }
```

### Tabs
```css
.tab {
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #6B7280;
  border-bottom: 2px solid transparent;
  transition: all 200ms ease-out;
}
.tab:hover { color: #374151; }
.tab.active {
  color: #3B82F6;
  border-bottom-color: #3B82F6;
}
```

### Tooltip (Word Lookup)
```css
.tooltip {
  max-width: 320px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05);
  padding: 12px 16px;
  animation: tooltip-enter 200ms ease-out;
}
@keyframes tooltip-enter {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
```

---

## 8. Animation Guidelines

### Duration Scale
| Token | Duration | Usage |
|-------|----------|-------|
| `duration-fast` | 150ms | Micro-interactions |
| `duration-normal` | 300ms | Standard transitions |
| `duration-slow` | 500ms | Complex animations |
| `duration-card` | 600ms | Card flip |

### Easing Functions
| Token | Value | Usage |
|-------|-------|-------|
| `ease-out` | `cubic-bezier(0.0, 0, 0.2, 1)` | Entering elements |
| `ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Exiting elements |
| `ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Morphing |
| `ease-bounce` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Playful emphasis |

### Standard Transitions
```css
/* Default transition */
transition: all 300ms ease-out;

/* Hover transitions */
transition: background-color 200ms ease-out, border-color 200ms ease-out;

/* Focus ring */
transition: box-shadow 150ms ease-out;
```

### Prefers Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 9. Icons

### Icon Library
Use **Heroicons** (https://heroicons.com) for consistency with Tailwind ecosystem.

### Icon Sizes
| Size | Dimensions | Usage |
|------|------------|-------|
| `xs` | 16x16px | Inline with text |
| `sm` | 20x20px | Buttons, inputs |
| `md` | 24x24px | Navigation, actions |
| `lg` | 32x32px | Feature icons |

### Common Icons
| Action | Icon Name |
|--------|-----------|
| Search | `magnifying-glass` |
| Audio | `speaker-wave` |
| Save | `bookmark` |
| Saved | `bookmark-solid` |
| Close | `x-mark` |
| Back | `arrow-left` |
| Settings | `cog-6-tooth` |
| Streak | `fire` |
| Achievement | `trophy` |
| Flashcard | `rectangle-stack` |

---

## 10. Accessibility

### Focus States
- All interactive elements must have visible focus indicators
- Focus ring: `box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.4)`
- Tab order must follow logical reading order

### Color Contrast
- Normal text (< 18px): minimum 4.5:1 ratio
- Large text (>= 18px bold): minimum 3:1 ratio
- Interactive elements: minimum 3:1 against adjacent colors

### Screen Readers
- Use semantic HTML (`<button>`, `<nav>`, `<main>`)
- Include `aria-label` for icon-only buttons
- Use `aria-live` for dynamic content updates
- Provide text alternatives for all visual content

### Touch Targets
- Minimum size: 44x44px for mobile/touch interactions
- Spacing between targets: minimum 8px

---

## 11. Responsive Breakpoints

| Breakpoint | Width | Usage |
|------------|-------|-------|
| Popup | 420px | Extension popup width |
| Tooltip | 320px max | Word lookup tooltip |
| Mobile | 320px+ | Content script overlays |

---

## 12. Component Inventory

### Popup Components
1. **Header** - Logo, settings button
2. **TabBar** - Dashboard, Study, Vocabulary
3. **StreakCounter** - Fire icon, day count
4. **ProgressBar** - Daily goal indicator
5. **WordCard** - Word preview in lists
6. **FlashCard** - Flippable study card
7. **RatingButtons** - Hard/Good/Easy
8. **SearchInput** - Filter vocabulary
9. **EmptyState** - No words/no streak

### Tooltip Components
1. **WordHeader** - Word, phonetic, audio
2. **Definition** - English definition
3. **Translation** - Vietnamese translation
4. **Examples** - Usage examples
5. **SaveButton** - Add to vocabulary

### Gamification Components
1. **StreakBadge** - Current streak display
2. **AchievementCard** - Badge with description
3. **StatsOverview** - Words learned, accuracy
4. **LevelProgress** - XP bar

---

## 13. Design Tokens (Tailwind Config)

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
        },
        success: {
          500: '#22C55E',
          600: '#16A34A',
        },
        streak: {
          500: '#F97316',
          600: '#EA580C',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'flip': 'flip 600ms ease-in-out',
        'tooltip-enter': 'tooltip-enter 200ms ease-out',
        'streak-pulse': 'streak-pulse 2s ease-in-out infinite',
      },
      keyframes: {
        flip: {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(180deg)' },
        },
        'tooltip-enter': {
          from: { opacity: '0', transform: 'translateY(-4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'streak-pulse': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' },
        },
      },
    },
  },
}
```

---

## 14. File Naming Conventions

### Components
- PascalCase: `FlashCard.tsx`, `StreakCounter.tsx`
- Index exports: `components/index.ts`

### Styles
- Tailwind utilities preferred
- Custom CSS in `*.module.css` if needed

### Assets
- Icons: `icon-{name}.svg`
- Images: `{feature}-{description}.{ext}`

---

## 15. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-10 | Initial design system |

---

*End of Design Guidelines*
