import { describe, it, expect } from 'vitest'
import { buildReminderContent } from './notification-content-builder'
import type { WordPreview } from './notification-helpers'

const fullWord: WordPreview = {
  word: 'example',
  definition: 'a representative form or pattern',
  translation: 'ví dụ',
  pronunciation: 'ɪɡˈzæmpəl',
  partOfSpeech: 'noun'
}

describe('buildReminderContent — card layout', () => {
  it('full word: word in title, IPA + (PoS. def) in message, contextMessage with translation + due', () => {
    const result = buildReminderContent(3, 5, fullWord)
    expect(result.title).toBe('📖 example')
    expect(result.message).toBe('/ɪɡˈzæmpəl/\nnoun. a representative form or pattern')
    expect(result.contextMessage).toBe('ví dụ · +2 more cards waiting')
  })

  it('drops IPA line when pronunciation missing', () => {
    const result = buildReminderContent(1, 0, { ...fullWord, pronunciation: undefined })
    expect(result.title).toBe('📖 example')
    expect(result.message).toBe('noun. a representative form or pattern')
  })

  it('keeps IPA line, drops PoS prefix when partOfSpeech missing', () => {
    const result = buildReminderContent(1, 0, { ...fullWord, partOfSpeech: undefined })
    expect(result.message).toBe('/ɪɡˈzæmpəl/\na representative form or pattern')
  })

  it('plain definition when both IPA and PoS missing', () => {
    const result = buildReminderContent(1, 0, {
      ...fullWord,
      pronunciation: undefined,
      partOfSpeech: undefined
    })
    expect(result.message).toBe('a representative form or pattern')
  })

  it('truncates definition longer than 100 chars', () => {
    const longDef = 'a'.repeat(150)
    const result = buildReminderContent(0, 0, { ...fullWord, definition: longDef })
    expect(result.message).toBe('/ɪɡˈzæmpəl/\nnoun. ' + 'a'.repeat(100))
  })

  it('truncates very long word in title at 50 chars', () => {
    const longWord = 'a'.repeat(60)
    const result = buildReminderContent(0, 0, { ...fullWord, word: longWord })
    expect(result.title).toHaveLength(50)
    expect(result.title.startsWith('📖 a')).toBe(true)
  })
})

describe('buildReminderContent — IPA normalization', () => {
  it('strips surrounding slashes from already-wrapped IPA (no //…//)', () => {
    const result = buildReminderContent(0, 0, { ...fullWord, pronunciation: '/ɪɡˈzæmpəl/' })
    expect(result.message.startsWith('/ɪɡˈzæmpəl/\n')).toBe(true)
  })

  it('normalizes square-bracket IPA to slash form', () => {
    const result = buildReminderContent(0, 0, { ...fullWord, pronunciation: '[ɪɡˈzæmpəl]' })
    expect(result.message.startsWith('/ɪɡˈzæmpəl/\n')).toBe(true)
  })

  it('drops IPA line when only slashes provided (empty after strip)', () => {
    const result = buildReminderContent(0, 0, { ...fullWord, pronunciation: '//' })
    expect(result.message).toBe('noun. a representative form or pattern')
  })

  it('trims whitespace around IPA', () => {
    const result = buildReminderContent(0, 0, { ...fullWord, pronunciation: '  /ɪɡˈzæmpəl/  ' })
    expect(result.message.startsWith('/ɪɡˈzæmpəl/\n')).toBe(true)
  })
})

describe('buildReminderContent — contextMessage', () => {
  it('dueCount = 1 with translation produces only translation', () => {
    const result = buildReminderContent(1, 0, fullWord)
    expect(result.contextMessage).toBe('ví dụ')
  })

  it('dueCount = 5 without translation produces only the +N suffix', () => {
    const result = buildReminderContent(5, 0, { ...fullWord, translation: undefined })
    expect(result.contextMessage).toBe('+4 more cards waiting')
  })

  it('dueCount = 1 without translation produces no contextMessage', () => {
    const result = buildReminderContent(1, 0, { ...fullWord, translation: undefined })
    expect(result.contextMessage).toBeUndefined()
  })

  it('omits contextMessage entirely when empty (no translation, due ≤ 1)', () => {
    const result = buildReminderContent(0, 0, { ...fullWord, translation: undefined })
    expect(result.contextMessage).toBeUndefined()
  })

  it('truncates translation longer than 60 chars', () => {
    const longTranslation = 'á'.repeat(80)
    const result = buildReminderContent(3, 0, { ...fullWord, translation: longTranslation })
    expect(result.contextMessage).toBe('á'.repeat(60) + ' · +2 more cards waiting')
  })
})

describe('buildReminderContent — fallbacks (no word)', () => {
  it('dueCount > 0 → due-count message', () => {
    const result = buildReminderContent(3, 0, undefined)
    expect(result.title).toBe('Time to Study!')
    expect(result.message).toBe('You have 3 cards waiting for review!')
  })

  it('no due, streak > 0 → streak message', () => {
    const result = buildReminderContent(0, 4, undefined)
    expect(result.title).toBe('Time to Study!')
    expect(result.message).toBe('Keep your 4-day streak going!')
  })

  it('no due, no streak → generic message', () => {
    const result = buildReminderContent(0, 0, undefined)
    expect(result.title).toBe('Time to Study!')
    expect(result.message).toBe('Start building your vocabulary today!')
  })
})
