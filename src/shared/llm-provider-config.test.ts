import { describe, it, expect } from 'vitest'
import { LLM_PROVIDERS, getProviderConfig } from './llm-provider-config'

// Model ids that providers have removed/shut down — must never ship in the config.
const BANNED_MODEL_PATTERNS: RegExp[] = [
  /^gemini-2\.0-flash$/,
  /^gemini-1\.5-/,
  /^gpt-4-turbo$/,
  /^grok-2$/,
  /^grok-beta$/
]

describe('LLM_PROVIDERS config', () => {
  it('exposes exactly the four supported providers', () => {
    const ids = LLM_PROVIDERS.map(p => p.id).sort()
    expect(ids).toEqual(['gemini', 'grok', 'openai', 'openrouter'])
  })

  it('every provider default model exists in its own model list', () => {
    for (const provider of LLM_PROVIDERS) {
      const inList = provider.models.some(m => m.id === provider.defaultModel)
      expect(inList, `${provider.id} default "${provider.defaultModel}" missing from models`).toBe(true)
    }
  })

  it('contains no removed or shut-down model ids', () => {
    const allModelIds = LLM_PROVIDERS.flatMap(p => p.models.map(m => m.id))
    for (const id of allModelIds) {
      for (const pattern of BANNED_MODEL_PATTERNS) {
        expect(pattern.test(id), `banned model id present: ${id}`).toBe(false)
      }
    }
  })

  it('falls back to the first provider for an unknown id', () => {
    expect(getProviderConfig('mistral' as never)).toBe(LLM_PROVIDERS[0])
  })
})
