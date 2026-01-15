# Phase 01: Fix Regex Pattern

## Context Links

- Parent: [plan.md](./plan.md)
- Bug file: `src/shared/openai-translation.ts`
- Display: `src/content/content-script.ts` (already handles newlines)

## Overview

- **Priority:** P1
- **Status:** Pending
- **Description:** Fix regex pattern to capture multi-line translation text

## Key Insights

1. **LLM Response Format:**
   ```
   Source: English
   Translation: Line 1 of translation
   Line 2 of translation
   Synonyms: word1, word2
   Antonyms: opposite1
   Note: usage note
   ```

2. **Current Regex Problem:**
   - Pattern: `/Translation:\s*(.+?)(?:\n|$)/m`
   - `.+?` = non-greedy, stops at first newline
   - Only captures "Line 1 of translation"

3. **Display Layer OK:**
   - `content-script.ts:692` already converts `\n` to `<br>`
   - CSS supports multi-line display
   - Problem is upstream in parsing

## Requirements

### Functional
- Capture all lines between "Translation:" and next field marker
- Preserve newlines in `translatedText` string
- Don't break existing single-line translations

### Non-functional
- Maintain regex performance
- Keep code simple

## Architecture

```
LLM Response (multi-line)
    ↓
openai-translation.ts:125 (FIX HERE)
    ↓
TranslationResult.translatedText (now has \n)
    ↓
content-script.ts:692 (.replace(/\n/g, '<br>'))
    ↓
Tooltip displays full translation
```

## Related Code Files

| File | Action | Description |
|------|--------|-------------|
| `src/shared/openai-translation.ts` | Modify | Fix regex on line 125 |

## Implementation Steps

### Step 1: Fix Translation Regex

**File:** `src/shared/openai-translation.ts`
**Line:** 125

**Before:**
```typescript
const translationMatch = responseText.match(/Translation:\s*(.+?)(?:\n|$)/m)
```

**After:**
```typescript
const translationMatch = responseText.match(/Translation:\s*([\s\S]+?)(?=\n(?:Synonyms|Antonyms|Note):|$)/m)
```

**Explanation:**
- `[\s\S]+?` = match any char including newlines (non-greedy)
- `(?=\n(?:Synonyms|Antonyms|Note):|$)` = lookahead: stop at next field marker or end
- Handles both phrases (no synonyms) and single words (has synonyms)

### Step 2: Build & Manual Test

```bash
npm run build
```

Test scenarios:
1. Single word lookup → should show translation + synonyms
2. Phrase with multi-line response → should show all lines
3. Phrase with single-line response → should work as before

## Todo List

- [ ] Modify regex in `openai-translation.ts:125`
- [ ] Run build to verify no syntax errors
- [ ] Manual test with multi-line translation
- [ ] Manual test single-word lookup still works

## Success Criteria

1. Multi-line translations display completely with line breaks
2. Single-line translations unchanged
3. Synonyms/antonyms/notes still parse correctly
4. Build succeeds without errors

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Regex too greedy | Low | Lookahead constrains match |
| Break synonym parsing | Low | Same field markers used |

## Security Considerations

- None - internal string parsing only
- No user input in regex pattern

## Next Steps

After fix:
1. Run `npm run build`
2. Load extension in Chrome
3. Test translation with long text
4. Commit if successful
