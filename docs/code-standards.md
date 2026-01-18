# Code Standards

Coding conventions and patterns for the Vocabulary Builder extension.

## File Naming

| Type | Convention | Example |
|------|------------|---------|
| Components | `kebab-case.tsx` | `ai-translation-toggle.tsx` |
| Modules | `kebab-case.ts` | `floating-menu-lang-handlers.ts` |
| Hooks | `use-kebab-case.ts` | `use-api-key-management.ts` |
| Tests | `*.test.ts` | `store.test.ts` |
| Types | `index.ts` in types/ | `types/index.ts` |

## File Size Guidelines

- **Target**: ≤200 lines per file
- **Maximum**: 300 lines (excluding tests)
- **Action**: Extract when approaching limit

## Directory Structure

```
src/
├── background/           # Service worker only
├── content/
│   ├── modules/          # Feature modules (kebab-case)
│   └── utils/            # Utility functions
├── options/
│   ├── components/       # UI components
│   └── hooks/            # Custom React hooks
├── popup/
│   └── components/       # UI components
├── shared/
│   └── components/       # Reusable UI components
├── sidepanel/
│   ├── components/       # UI components
│   └── hooks/            # Custom hooks
└── types/                # TypeScript definitions
```

## Module Patterns

### Handler Modules
Extract event handlers to dedicated files:
```typescript
// tooltip-button-handlers.ts
export function setupAudioButtonHandler(tooltip: HTMLDivElement, text: string, lang: string): void
export function setupCopyButtonHandler(tooltip: HTMLDivElement, textToCopy: string): void
```

### Template Modules
Separate HTML generation from logic:
```typescript
// tooltip-templates.ts - HTML generation
// tooltip-manager.ts - DOM manipulation & state
// tooltip-event-handlers.ts - Event coordination
```

### Barrel Exports
Use index.ts for clean imports:
```typescript
// hooks/index.ts
export { useApiKeyManagement } from './use-api-key-management'
export { useShortcutRecorder } from './use-shortcut-recorder'
```

## React Patterns

### Custom Hooks
Extract complex state logic to hooks:
```typescript
// use-api-key-management.ts
export function useApiKeyManagement(providerId: LLMProvider) {
  // State, effects, handlers
  return { state, handlers }
}
```

### Component Extraction
Extract when:
- Component exceeds 100 lines
- Logic is reusable
- Clear single responsibility

```typescript
// Before: inline in parent
// After: ai-translation-toggle.tsx
export function AiTranslationToggle({ enabled, onToggle }: Props) { ... }
```

### Shared Components
Place in `shared/components/` when used by multiple pages:
```typescript
// shared/components/icons.tsx - Reusable SVG icons
// shared/components/lang-dropdown.tsx - Language selector
// shared/components/ai-badge.tsx - AI/Free badge
```

## TypeScript

### Interfaces
Define props interfaces above component:
```typescript
interface TranslationSettingsProps {
  settings: UserSettings
  onSettingsUpdate: (updates: Partial<UserSettings>) => void
}

export function TranslationSettings({ settings, onSettingsUpdate }: TranslationSettingsProps) { ... }
```

### Type Exports
Centralize in `types/index.ts`:
```typescript
export type { Word, FlashcardData, UserSettings, LLMProvider }
```

## Comments

### File Headers
Brief description of module purpose:
```typescript
/**
 * Floating Menu Language Handlers
 * Source/target language dropdown handling for floating menu.
 */
```

### Function Comments
Only for non-obvious logic:
```typescript
/**
 * Parse error message to extract provider and error code.
 */
function parseError(message: string): { provider?: string; errorCode?: string }
```

## Imports

### Order
1. React/external libraries
2. Types
3. Shared utilities
4. Local modules

```typescript
import { useState, useEffect } from 'react'
import type { TranslationResult } from '@/types'
import { AiBadge, LangDropdown } from '@/shared/components'
import { createErrorHTML } from './tooltip-error-template'
```

### Path Aliases
Use `@/` for src root:
```typescript
import { useSettingsStore } from '@/shared/store'
import type { LLMProvider } from '@/types'
```

## Testing

- Co-locate tests: `module.ts` → `module.test.ts`
- Test public API only
- Use descriptive test names

```typescript
describe('spaced-repetition', () => {
  it('should increase interval after correct answer', () => { ... })
})
```

## Don'ts

- ❌ Don't create files >300 lines
- ❌ Don't inline complex logic in components
- ❌ Don't duplicate code across modules
- ❌ Don't use `any` type
- ❌ Don't skip TypeScript strict mode
- ❌ Don't add comments for obvious code
