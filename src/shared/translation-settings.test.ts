import { describe, it, expect } from 'vitest'
import { getSelectedModel } from './translation-settings'
import { getProviderConfig } from './llm-provider-config'
import { SETTINGS_KEY } from './settings-storage-access'

/** Seed the synced settings record with a chosen model. */
async function seedSelectedModel(llmModel: string): Promise<void> {
  await chrome.storage.sync.set({
    [SETTINGS_KEY]: JSON.stringify({ state: { settings: { llmModel } }, version: 0 })
  })
}

describe('getSelectedModel', () => {
  it('returns the selected model when it belongs to the provider', async () => {
    const config = getProviderConfig('openai')
    // Pick a valid non-default model so the assertion proves the selection is honored.
    const validNonDefault = config.models.find(m => m.id !== config.defaultModel)!.id
    await seedSelectedModel(validNonDefault)

    expect(await getSelectedModel('openai')).toBe(validNonDefault)
  })

  it('falls back to provider default when selected model is foreign to the provider', async () => {
    // A Gemini model id selected while resolving for OpenAI must be rejected.
    await seedSelectedModel('gemini-2.5-flash')

    const config = getProviderConfig('openai')
    expect(await getSelectedModel('openai')).toBe(config.defaultModel)
  })

  it('falls back to provider default when no model is set', async () => {
    const config = getProviderConfig('grok')
    expect(await getSelectedModel('grok')).toBe(config.defaultModel)
  })
})
