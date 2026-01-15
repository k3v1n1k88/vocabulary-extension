# Phase 02: Translation Service Refactor

## Context Links

- Parent: [plan.md](./plan.md)
- Depends on: [Phase 01](./phase-01-types-and-config.md)
- Research: [Gemini API](./research/researcher-gemini-api.md), [Grok API](./research/researcher-grok-api.md)

## Overview

- **Priority:** P1
- **Status:** Pending
- **Description:** Refactor translation service to support multiple LLM providers with unified interface

## Key Insights

1. **OpenAI & Grok**: Same request format (OpenAI-compatible)
   - `messages: [{ role, content }]`
   - Bearer token auth
   - Response: `choices[0].message.content`

2. **Gemini**: Different format
   - `contents: [{ parts: [{ text }] }]`
   - API key via `x-goog-api-key` header (validated)
   - Response: `candidates[0].content.parts[0].text`

3. **Same prompt works for all** - only request/response wrapping differs

## Requirements

### Functional
- Read selected provider from settings
- Route translation to correct provider adapter
- Unified response parsing to `TranslationResult`
- Per-provider API key retrieval

### Non-functional
- Keep existing prompt logic
- 30s timeout for all providers
- Clear error messages per provider

## Architecture

```
translateToTargetLanguage(text)
        │
        ▼
getSelectedProvider() → LLMProvider
        │
        ▼
getApiKey(provider) → string
        │
        ▼
buildRequest(provider, prompt) → { url, options }
        │
        ├── OpenAI/Grok: buildOpenAIRequest()
        │
        └── Gemini: buildGeminiRequest()
        │
        ▼
fetch(url, options)
        │
        ▼
parseResponse(provider, data) → string
        │
        ├── OpenAI/Grok: data.choices[0].message.content
        │
        └── Gemini: data.candidates[0].content.parts[0].text
        │
        ▼
parseTranslationResult(responseText) → TranslationResult
```

## Related Code Files

| File | Action | Description |
|------|--------|-------------|
| `src/shared/openai-translation.ts` | Delete | Replace with new service |
| `src/shared/translation-service.ts` | Create | New unified translation service |
| `src/options/Options.tsx` | Modify | Update import path |
| `src/background/service-worker.ts` | Modify | Update import path |

## Implementation Steps

### Step 1: Create `src/shared/translation-service.ts`

```typescript
import type { TranslationResult, LLMProvider } from '../types'
import { SUPPORTED_LANGUAGES } from '../types'
import { getProviderConfig } from './llm-provider-config'

/**
 * Get API key for specified provider from chrome.storage
 */
async function getApiKey(provider: LLMProvider): Promise<string | null> {
  const config = getProviderConfig(provider)
  return new Promise((resolve) => {
    chrome.storage.local.get([config.apiKeyStorageKey], (result) => {
      resolve(result[config.apiKeyStorageKey] || null)
    })
  })
}

/**
 * Get selected LLM provider from settings
 */
async function getSelectedProvider(): Promise<LLMProvider> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['settings-storage'], (result) => {
      try {
        const parsed = result['settings-storage'] ? JSON.parse(result['settings-storage']) : null
        const provider = parsed?.state?.settings?.llmProvider || 'openai'
        resolve(provider as LLMProvider)
      } catch {
        resolve('openai')
      }
    })
  })
}

/**
 * Get target language from settings
 */
async function getTargetLanguage(): Promise<string> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['settings-storage'], (result) => {
      try {
        const parsed = result['settings-storage'] ? JSON.parse(result['settings-storage']) : null
        const langCode = parsed?.state?.settings?.targetLanguage || 'vi'
        const lang = SUPPORTED_LANGUAGES.find(l => l.code === langCode)
        resolve(lang ? lang.name : 'Vietnamese')
      } catch {
        resolve('Vietnamese')
      }
    })
  })
}

/**
 * Save API key for specified provider
 */
export async function saveApiKey(apiKey: string, provider: LLMProvider = 'openai'): Promise<void> {
  const config = getProviderConfig(provider)
  return new Promise((resolve) => {
    chrome.storage.local.set({ [config.apiKeyStorageKey]: apiKey }, resolve)
  })
}

/**
 * Detect if text is a phrase (multiple words)
 */
export function isPhrase(text: string): boolean {
  return text.trim().split(/\s+/).length > 1
}

/**
 * Test API key connection for a provider (validates key works)
 * Returns true if connection successful, throws error otherwise
 */
export async function testConnection(provider: LLMProvider, apiKey: string): Promise<boolean> {
  const config = getProviderConfig(provider)

  // Simple test request - ask for a minimal response
  const testPrompt = { system: 'Reply only with: OK', user: 'Test' }

  const { url, options } = provider === 'gemini'
    ? buildGeminiRequest(config.endpoint, config.defaultModel, apiKey, testPrompt.system, testPrompt.user)
    : buildOpenAIRequest(config.endpoint, config.defaultModel, apiKey, testPrompt.system, testPrompt.user)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout for test

  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    clearTimeout(timeoutId)

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      const errorMsg = (error as { error?: { message?: string } }).error?.message
      throw new Error(errorMsg || `${config.name} API error: ${response.status}`)
    }

    return true
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Connection test timed out.')
    }
    throw error
  }
}

/**
 * Build translation prompt (same for all providers)
 */
function buildPrompt(text: string, targetLanguage: string, isTextPhrase: boolean): { system: string; user: string } {
  const system = isTextPhrase
    ? `You are a translator. Detect the source language and translate the given text to ${targetLanguage}.
Format your response as:
Source: [detected language]
Translation: [translation]`
    : `You are a translator and language expert. For the given word:
1. Detect the source language
2. Translate to ${targetLanguage}
3. Provide 2-4 synonyms (similar words in the SOURCE language)
4. Provide 2-4 antonyms (opposite words in the SOURCE language) if applicable
5. Brief usage note if the word has multiple meanings

Format your response EXACTLY as:
Source: [detected language]
Translation: [translation in ${targetLanguage}]
Synonyms: [comma-separated synonyms in source language]
Antonyms: [comma-separated antonyms in source language, or "none" if not applicable]
Note: [brief note, or "none" if straightforward]`

  return { system, user: text }
}

/**
 * Build request for OpenAI/Grok (same format)
 */
function buildOpenAIRequest(
  endpoint: string,
  model: string,
  apiKey: string,
  system: string,
  user: string
): { url: string; options: RequestInit } {
  return {
    url: endpoint,
    options: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    }
  }
}

/**
 * Build request for Gemini (uses x-goog-api-key header auth)
 */
function buildGeminiRequest(
  endpoint: string,
  model: string,
  apiKey: string,
  system: string,
  user: string
): { url: string; options: RequestInit } {
  return {
    url: `${endpoint}/${model}:generateContent`,
    options: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ parts: [{ text: user }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 500
        }
      })
    }
  }
}

/**
 * Parse response text from provider-specific format
 */
function parseProviderResponse(provider: LLMProvider, data: unknown): string {
  if (provider === 'gemini') {
    // Gemini: candidates[0].content.parts[0].text
    const geminiData = data as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
    return geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
  } else {
    // OpenAI/Grok: choices[0].message.content
    const openaiData = data as { choices?: Array<{ message?: { content?: string } }> }
    return openaiData.choices?.[0]?.message?.content?.trim() || ''
  }
}

/**
 * Parse translation result from LLM response text
 */
function parseTranslationResult(
  responseText: string,
  originalText: string,
  targetLanguage: string,
  isTextPhrase: boolean
): TranslationResult {
  const sourceMatch = responseText.match(/^Source:\s*(.+)$/m)
  const sourceLanguage = sourceMatch?.[1]?.trim() || 'Auto-detected'

  // Fixed regex: capture multi-line translation until next field marker
  const translationMatch = responseText.match(/Translation:\s*([\s\S]+?)(?=\n(?:Synonyms|Antonyms|Note):|$)/m)
  const translatedText = translationMatch?.[1]?.trim() || responseText

  const synonymsMatch = responseText.match(/Synonyms:\s*(.+?)(?:\n|$)/m)
  const synonymsText = synonymsMatch?.[1]?.trim()
  const synonyms = synonymsText && synonymsText.toLowerCase() !== 'none'
    ? synonymsText.split(',').map(s => s.trim()).filter(s => s.length > 0)
    : undefined

  const antonymsMatch = responseText.match(/Antonyms:\s*(.+?)(?:\n|$)/m)
  const antonymsText = antonymsMatch?.[1]?.trim()
  const antonyms = antonymsText && antonymsText.toLowerCase() !== 'none'
    ? antonymsText.split(',').map(a => a.trim()).filter(a => a.length > 0)
    : undefined

  const noteMatch = responseText.match(/Note:\s*(.+?)$/m)
  const noteText = noteMatch?.[1]?.trim()
  const note = noteText && noteText.toLowerCase() !== 'none' ? noteText : undefined

  return {
    originalText,
    translatedText,
    sourceLanguage,
    targetLanguage,
    isPhrase: isTextPhrase,
    synonyms,
    antonyms,
    note
  }
}

/**
 * Translate text using selected LLM provider
 */
export async function translateText(
  text: string,
  targetLanguage: string
): Promise<TranslationResult> {
  const provider = await getSelectedProvider()
  const config = getProviderConfig(provider)
  const apiKey = await getApiKey(provider)

  if (!apiKey) {
    throw new Error(`${config.name} API key not configured. Please set it in extension settings.`)
  }

  const isTextPhrase = isPhrase(text)
  const { system, user } = buildPrompt(text, targetLanguage, isTextPhrase)

  // Build provider-specific request
  const { url, options } = provider === 'gemini'
    ? buildGeminiRequest(config.endpoint, config.defaultModel, apiKey, system, user)
    : buildOpenAIRequest(config.endpoint, config.defaultModel, apiKey, system, user)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    clearTimeout(timeoutId)

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      const errorMsg = (error as { error?: { message?: string } }).error?.message
      throw new Error(errorMsg || `${config.name} API error: ${response.status}`)
    }

    const data = await response.json()
    const responseText = parseProviderResponse(provider, data)

    return parseTranslationResult(responseText, text, targetLanguage, isTextPhrase)
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Translation timed out. Please try again.')
    }
    throw error
  }
}

/**
 * Translate text to user's configured target language
 */
export async function translateToTargetLanguage(text: string): Promise<TranslationResult> {
  const targetLanguage = await getTargetLanguage()
  return translateText(text, targetLanguage)
}
```

### Step 2: Update imports in `src/options/Options.tsx`

Change:
```typescript
import { saveApiKey } from '@/shared/openai-translation'
```
To:
```typescript
import { saveApiKey } from '@/shared/translation-service'
```

### Step 3: Update imports in `src/background/service-worker.ts`

Change:
```typescript
import { translateToTargetLanguage } from '@/shared/openai-translation'
```
To:
```typescript
import { translateToTargetLanguage } from '@/shared/translation-service'
```

### Step 4: Delete old file

Delete `src/shared/openai-translation.ts`

## Todo List

- [ ] Create `src/shared/translation-service.ts` with header auth for Gemini
- [ ] Add `testConnection()` function for API key validation
- [ ] Update import in `src/options/Options.tsx`
- [ ] Update import in `src/background/service-worker.ts`
- [ ] Delete `src/shared/openai-translation.ts`
- [ ] Build and verify no TypeScript errors

## Success Criteria

1. Build succeeds with no errors
2. Translation works with OpenAI (default provider)
3. Correct provider-specific error messages
4. Multi-line translation bug is fixed (see regex on line ~100)

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Wrong Gemini request format | High | Tested format in research report |
| Import path breaks | Medium | Search all imports before delete |

## Security Considerations

- API keys never logged
- Keys stored separately per provider
- No keys in request logs

## Next Steps

After this phase: Phase 03 - Settings UI Updates
