# Phase 01: Types & Configuration

## Context Links

- Parent: [plan.md](./plan.md)
- Research: [Gemini API](./research/researcher-gemini-api.md), [Grok API](./research/researcher-grok-api.md)

## Overview

- **Priority:** P1 (foundation for other phases)
- **Status:** Pending
- **Description:** Add TypeScript types and configuration constants for multi-provider support

## Key Insights

1. All 3 providers use similar request/response patterns
2. Gemini uses different body structure (contents[].parts[]) vs OpenAI-style (messages[])
3. Grok is OpenAI-compatible - same format as OpenAI
4. Need provider-specific API key storage keys

## Requirements

### Functional
- Define `LLMProvider` type with OpenAI | Gemini | Grok values
- Define provider configuration (endpoints, models, auth methods)
- Add `llmProvider` field to `UserSettings`
- Define storage keys for each provider's API key

### Non-functional
- Type-safe provider selection
- Centralized configuration for easy maintenance

## Architecture

```typescript
type LLMProvider = 'openai' | 'gemini' | 'grok'

interface ProviderConfig {
  id: LLMProvider
  name: string
  endpoint: string
  defaultModel: string
  models: string[]  // Available models for user selection
  authType: 'bearer' | 'header'  // header = x-goog-api-key for Gemini
  apiKeyStorageKey: string
  registerUrl: string
}
```

## Related Code Files

| File | Action | Description |
|------|--------|-------------|
| `src/types/index.ts` | Modify | Add LLMProvider type, ProviderConfig, update UserSettings |
| `src/shared/llm-provider-config.ts` | Create | Provider configurations array |

## Implementation Steps

### Step 1: Add Types to `src/types/index.ts`

Add after line 63 (after UserSettings interface):

```typescript
// LLM Provider types
export type LLMProvider = 'openai' | 'gemini' | 'grok'

export interface ProviderConfig {
  id: LLMProvider
  name: string
  endpoint: string
  defaultModel: string
  models: string[]  // User can select from available models
  authType: 'bearer' | 'header'  // header = x-goog-api-key for Gemini
  apiKeyStorageKey: string
  registerUrl: string
}
```

### Step 2: Update UserSettings interface

Add `llmProvider` field:

```typescript
export interface UserSettings {
  // ... existing fields
  llmProvider: LLMProvider  // Add this
}
```

### Step 3: Create `src/shared/llm-provider-config.ts`

```typescript
import type { ProviderConfig, LLMProvider } from '../types'

export const LLM_PROVIDERS: ProviderConfig[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'],
    authType: 'bearer',
    apiKeyStorageKey: 'openaiApiKey',
    registerUrl: 'https://platform.openai.com/api-keys'
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    defaultModel: 'gemini-2.0-flash',
    models: ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'],
    authType: 'header',  // Use x-goog-api-key header (validated)
    apiKeyStorageKey: 'geminiApiKey',
    registerUrl: 'https://aistudio.google.com/apikey'
  },
  {
    id: 'grok',
    name: 'xAI Grok',
    endpoint: 'https://api.x.ai/v1/chat/completions',
    defaultModel: 'grok-2',
    models: ['grok-2', 'grok-beta'],
    authType: 'bearer',
    apiKeyStorageKey: 'grokApiKey',
    registerUrl: 'https://console.x.ai'
  }
]

export function getProviderConfig(providerId: LLMProvider): ProviderConfig {
  return LLM_PROVIDERS.find(p => p.id === providerId) || LLM_PROVIDERS[0]
}
```

### Step 4: Update default settings in `src/shared/store.ts`

```typescript
const defaultSettings: UserSettings = {
  // ... existing defaults
  llmProvider: 'openai'  // Add this - backward compatible default
}
```

## Todo List

- [ ] Add `LLMProvider` type to `src/types/index.ts`
- [ ] Add `ProviderConfig` interface to `src/types/index.ts`
- [ ] Add `llmProvider` field to `UserSettings` interface
- [ ] Create `src/shared/llm-provider-config.ts` with provider configs
- [ ] Update `defaultSettings` in `src/shared/store.ts`

## Success Criteria

1. TypeScript compiles without errors
2. `LLMProvider` type exported from types
3. Provider configs accessible via `getProviderConfig()`
4. Default provider is 'openai' for backward compatibility

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Type changes break existing code | Low | Only adding new optional field |
| Wrong endpoint URLs | Medium | Verified in research reports |

## Security Considerations

- API keys stored separately per provider
- No keys in source code - all from chrome.storage

## Next Steps

After this phase: Phase 02 - Translation Service Refactor
