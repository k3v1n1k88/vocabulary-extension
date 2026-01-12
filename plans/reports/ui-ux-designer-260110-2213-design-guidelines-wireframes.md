# Design Report: Vocabulary Chrome Extension

**ID:** a206995 | **Date:** 2026-01-10 22:13
**Designer:** ui-ux-designer | **Status:** Complete

---

## Summary

Created comprehensive design system and 4 interactive HTML wireframes for Vocabulary Chrome Extension. All deliverables follow minimalist design principles with smooth animations, gamification elements, and bilingual (EN/VI) support.

---

## Deliverables

### 1. Design Guidelines
**Path:** `D:\vanntl\vocabulary-extension\docs\design-guidelines.md`

| Section | Contents |
|---------|----------|
| Colors | Primary blue (#3B82F6), Success green (#22C55E), Streak orange (#F97316), 10 gray shades |
| Typography | Inter font, 7 size tokens (12-30px), 4 weight levels |
| Spacing | 8px grid system, 13 spacing tokens |
| Components | Buttons, Cards, Flashcards, Inputs, Badges, Tabs, Tooltips |
| Animations | 4 duration tokens (150-600ms), easing functions, reduced-motion support |
| Accessibility | WCAG 2.1 AA contrast, 44px touch targets, focus states |

### 2. Wireframes

| File | Description | Key Features |
|------|-------------|--------------|
| `popup-main.html` | Main popup (420x600px) | 3-tab navigation, streak counter, progress bar, flashcard flip, word list |
| `lookup-tooltip.html` | Word lookup overlay | Definition, VN translation, audio button, save action, 4 states (default, saved, loading, error) |
| `flashcard-review.html` | Study session UI | 3D card flip, Hard/Good/Easy rating, progress indicator, session complete modal |
| `achievements.html` | Gamification panel | Streak hero, XP level bar, 9-badge grid, activity feed |

---

## Design Decisions

### Color Rationale
- **Primary blue** - Trust, focus, learning context
- **Streak orange** - Urgency, motivation, fire metaphor
- **Success green** - Positive reinforcement for correct answers

### Animation Timing
- **300ms ease-out** - Standard transitions (buttons, hovers)
- **600ms cubic-bezier** - Card flip (dramatic, satisfying)
- **200ms** - Tooltips (quick, non-intrusive)

### Gamification Elements
- Streak fire with pulse animation
- XP progress with level system
- 12 achievement badges (5 unlocked states designed)
- Activity feed with XP rewards

### Typography for Vietnamese
- Inter font selected - full Vietnamese character support
- Line height 1.5 for body text (accommodates diacritical marks)
- Example Vietnamese text included in all wireframes

---

## Component Inventory

| Category | Components |
|----------|------------|
| Navigation | Header, TabBar, BackButton |
| Data Display | WordCard, FlashCard, StreakCounter, ProgressBar, Badge |
| Forms | SearchInput, FilterPills |
| Actions | PrimaryButton, SecondaryButton, RatingButtons, SaveButton, AudioButton |
| Feedback | Tooltip, Modal, LoadingSpinner, EmptyState |
| Gamification | AchievementCard, LevelProgress, ActivityFeed |

---

## Technical Notes

### CSS Architecture
- Tailwind CSS via CDN for wireframes
- Custom CSS for complex animations (3D flip, streak pulse)
- Scoped styles prevent conflicts on host pages

### Extension Constraints Addressed
- Fixed popup dimensions (420x600px)
- Tooltip max-width 320px
- Custom scrollbar styling
- Shadow isolation for overlays

### Tailwind Config
Extended colors and animations provided in design-guidelines.md for production use.

---

## File Structure

```
D:\vanntl\vocabulary-extension\docs\
├── design-guidelines.md          (Comprehensive design system)
└── wireframes\
    ├── popup-main.html           (Main extension popup)
    ├── lookup-tooltip.html       (Word lookup overlay)
    ├── flashcard-review.html     (Study session)
    └── achievements.html         (Gamification panel)
```

---

## Next Steps

1. **Development** - Convert wireframes to React components
2. **Assets** - Export icons as SVG sprite or use Heroicons
3. **Testing** - Validate on different screen sizes and color schemes
4. **Accessibility** - Add ARIA labels and keyboard navigation

---

## Unresolved Questions

- Dark mode color tokens defined but not wireframed - needed for v1?
- Sound effects for gamification - any audio design needed?
- Offline state designs - how should extension behave without network?
