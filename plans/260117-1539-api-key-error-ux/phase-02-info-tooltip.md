# Phase 02: Add Info Tooltip to API Key Input

## Context

- Parent: [plan.md](./plan.md)
- Dependencies: Phase 01 (optional)
- Docs: None

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-01-17 |
| Priority | P3 |
| Implementation | pending |
| Review | pending |

Add info icon (?) next to API key input label with tooltip explaining why API key is needed.

## Key Insights

1. API key input at Options.tsx:508-598
2. Current label: `"{Provider} API Key"` with no explanation
3. Add (?) icon with native `title` attribute (KISS - no custom tooltip component)
4. Explain: translation feature requires API key, link to get one already exists

## Requirements

- [x] Add info icon (?) next to API key label
- [x] Show tooltip on hover explaining purpose
- [x] Keep implementation minimal (use `title` attribute)

## Architecture

```
Label: "OpenAI API Key" + (?) icon
                          ↓
              title="Required for translating phrases and sentences.
                     Single words use free dictionary lookup."
```

## Related Code Files

| File | Lines | Purpose |
|------|-------|---------|
| `src/options/Options.tsx` | 508-512 | API key label section |

## Implementation Steps

### Step 1: Add info icon next to label

```tsx
// In Options.tsx, update the API key label section (around line 510-512)

<label className="block text-sm font-medium text-gray-700 mb-2">
  {currentProvider.name} API Key
  <span
    className="ml-1 inline-flex items-center justify-center w-4 h-4 text-xs text-gray-400 border border-gray-300 rounded-full cursor-help"
    title="Required for translating phrases and sentences. Single words use the free dictionary API."
  >
    ?
  </span>
</label>
```

### Step 2: Alternative - Use SVG info icon

```tsx
<label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
  {currentProvider.name} API Key
  <span
    className="text-gray-400 cursor-help"
    title="Required for translating phrases and sentences. Single words use the free dictionary API."
  >
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  </span>
</label>
```

## Todo List

- [ ] Add info icon next to API key label
- [ ] Add `title` attribute with explanation text
- [ ] Style icon to be subtle (gray, small)

## Success Criteria

- [ ] Info icon (?) visible next to API key label
- [ ] Hovering shows native browser tooltip with explanation
- [ ] Icon is subtle and doesn't clutter the UI

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Native tooltip not visible enough | Low | Low | Could enhance later with custom tooltip |

## Security Considerations

- None

## Next Steps

Implementation complete after this phase.
