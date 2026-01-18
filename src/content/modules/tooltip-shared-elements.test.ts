import { describe, it, expect } from 'vitest'
import {
  createAiBadgeHtml,
  createFreeBadgeHtml,
  createTranslationBadgeHtml,
  createTypeBadgeHtml,
  createAiUpsellHtml,
  createLangDropdownHtml,
  createAudioButtonHtml,
  createCopyButtonHtml,
  createSaveButtonHtml,
  createSettingsButtonHtml,
  createErrorCodeBadgeHtml,
  TOOLTIP_ICONS
} from './tooltip-shared-elements'

describe('TOOLTIP_ICONS', () => {
  it('contains all expected icon SVGs', () => {
    expect(TOOLTIP_ICONS.speaker).toContain('<svg')
    expect(TOOLTIP_ICONS.speakerSmall).toContain('<svg')
    expect(TOOLTIP_ICONS.bookmark).toContain('<svg')
    expect(TOOLTIP_ICONS.copy).toContain('<svg')
    expect(TOOLTIP_ICONS.settings).toContain('<svg')
    expect(TOOLTIP_ICONS.error).toContain('<svg')
    expect(TOOLTIP_ICONS.chevronDown).toContain('<svg')
    expect(TOOLTIP_ICONS.robot).toContain('<svg')
  })
})

describe('createAiBadgeHtml', () => {
  it('creates AI badge with default title', () => {
    const html = createAiBadgeHtml()
    expect(html).toContain('vocab-ai-badge')
    expect(html).toContain('AI-powered translation')
    expect(html).toContain('AI')
  })

  it('creates AI badge with custom title', () => {
    const html = createAiBadgeHtml('Custom AI Title')
    expect(html).toContain('Custom AI Title')
  })
})

describe('createFreeBadgeHtml', () => {
  it('creates Free badge', () => {
    const html = createFreeBadgeHtml()
    expect(html).toContain('vocab-free-badge')
    expect(html).toContain('Free')
  })
})

describe('createTranslationBadgeHtml', () => {
  it('returns empty string when hasError is true', () => {
    const html = createTranslationBadgeHtml(true, true)
    expect(html).toBe('')
  })

  it('returns AI badge when isFreeTranslation is false', () => {
    const html = createTranslationBadgeHtml(false)
    expect(html).toContain('vocab-ai-badge')
  })

  it('returns Free badge when isFreeTranslation is true', () => {
    const html = createTranslationBadgeHtml(true)
    expect(html).toContain('vocab-free-badge')
  })

  it('returns empty string when isFreeTranslation is undefined', () => {
    const html = createTranslationBadgeHtml(undefined)
    expect(html).toBe('')
  })
})

describe('createTypeBadgeHtml', () => {
  it('creates type badge with label', () => {
    const html = createTypeBadgeHtml('Word')
    expect(html).toContain('vocab-type-badge')
    expect(html).toContain('Word')
  })

  it('escapes HTML in label', () => {
    const html = createTypeBadgeHtml('<script>alert(1)</script>')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })
})

describe('createAiUpsellHtml', () => {
  it('returns empty string when showUpsell is false', () => {
    const html = createAiUpsellHtml(false)
    expect(html).toBe('')
  })

  it('creates upsell HTML when showUpsell is true', () => {
    const html = createAiUpsellHtml(true)
    expect(html).toContain('vocab-ai-upsell')
    expect(html).toContain('vocab-ai-hint')
    expect(html).toContain('Get better results with AI')
    expect(html).toContain('data-action="open-settings"')
  })
})

describe('createLangDropdownHtml', () => {
  it('creates dropdown with language options', () => {
    const html = createLangDropdownHtml('Vietnamese', 'name')
    expect(html).toContain('vocab-lang-option')
    expect(html).toContain('data-lang-code')
    expect(html).toContain('data-lang-name')
  })

  it('marks active language by name', () => {
    const html = createLangDropdownHtml('Vietnamese', 'name')
    expect(html).toContain('active')
  })

  it('marks active language by code', () => {
    const html = createLangDropdownHtml('vi', 'code')
    expect(html).toContain('active')
  })
})

describe('createAudioButtonHtml', () => {
  it('creates audio button with word data attribute', () => {
    const html = createAudioButtonHtml('hello')
    expect(html).toContain('vocab-audio-btn')
    expect(html).toContain('data-word="hello"')
    expect(html).toContain('Play pronunciation')
  })

  it('uses custom attribute name', () => {
    const html = createAudioButtonHtml('hello', 'text')
    expect(html).toContain('data-text="hello"')
  })

  it('escapes HTML in text', () => {
    const html = createAudioButtonHtml('test"onclick="alert(1)')
    // Escaping converts " to &quot; preventing XSS
    expect(html).toContain('&quot;')
    expect(html).not.toContain('data-word="test"onclick')
  })
})

describe('createCopyButtonHtml', () => {
  it('creates copy button', () => {
    const html = createCopyButtonHtml()
    expect(html).toContain('vocab-copy-btn')
    expect(html).toContain('Copy translation')
    expect(html).toContain('Copy')
  })
})

describe('createSaveButtonHtml', () => {
  it('creates save button with word ID', () => {
    const html = createSaveButtonHtml('word-123')
    expect(html).toContain('vocab-save-btn')
    expect(html).toContain('data-word-id="word-123"')
    expect(html).toContain('Save to Vocabulary')
  })
})

describe('createSettingsButtonHtml', () => {
  it('creates settings button with default label', () => {
    const html = createSettingsButtonHtml()
    expect(html).toContain('vocab-settings-btn')
    expect(html).toContain('Check Settings')
  })

  it('creates settings button with custom label', () => {
    const html = createSettingsButtonHtml('Open Settings')
    expect(html).toContain('Open Settings')
  })
})

describe('createErrorCodeBadgeHtml', () => {
  it('returns empty string when errorCode is undefined', () => {
    const html = createErrorCodeBadgeHtml(undefined)
    expect(html).toBe('')
  })

  it('creates error code badge', () => {
    const html = createErrorCodeBadgeHtml('401')
    expect(html).toContain('vocab-error-code')
    expect(html).toContain('401')
  })
})
