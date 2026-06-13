import { describe, it, expect } from 'vitest'
import { createErrorHTML } from './tooltip-error-template'

describe('createErrorHTML — model unavailable', () => {
  it('classifies a shut-down model error and points to Settings', () => {
    const html = createErrorHTML('models/gemini-2.0-flash is no longer available.')
    expect(html).toContain('Model Unavailable')
    expect(html).toContain('Choose a different model in Settings.')
    // Settings affordance present.
    expect(html.toLowerCase()).toContain('settings')
  })

  it('classifies "The model does not exist" as a model error', () => {
    const html = createErrorHTML('The model `gpt-9-turbo` does not exist or you do not have access.')
    expect(html).toContain('Model Unavailable')
  })

  it('does NOT misclassify a generic "not available" error that omits "model"', () => {
    const html = createErrorHTML('This feature is not available in your region.')
    expect(html).not.toContain('Model Unavailable')
  })

  it('does NOT misclassify an unsupported-parameter error', () => {
    const html = createErrorHTML('response_format is not supported with this configuration.')
    expect(html).not.toContain('Model Unavailable')
  })

  it('still treats API-key errors as key errors, not model errors', () => {
    const html = createErrorHTML('OpenAI API key not configured. Add your key in Settings or disable AI translation.')
    expect(html).toContain('API Key Required')
    expect(html).not.toContain('Model Unavailable')
  })
})
