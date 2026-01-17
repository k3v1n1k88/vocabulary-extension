import { describe, it, expect } from 'vitest'
import { isPhrase, languageNameToCode } from './translation-service'

describe('isPhrase', () => {
  describe('single words', () => {
    it('returns false for single word', () => {
      expect(isPhrase('hello')).toBe(false)
    })

    it('returns false for single word with leading/trailing spaces', () => {
      expect(isPhrase('  hello  ')).toBe(false)
    })

    it('returns false for hyphenated word', () => {
      expect(isPhrase('well-known')).toBe(false)
    })

    it('returns false for word with apostrophe', () => {
      expect(isPhrase("don't")).toBe(false)
    })
  })

  describe('multiple words (phrases)', () => {
    it('returns true for two words', () => {
      expect(isPhrase('hello world')).toBe(true)
    })

    it('returns true for multiple words', () => {
      expect(isPhrase('this is a phrase')).toBe(true)
    })

    it('returns true for phrase with extra whitespace', () => {
      expect(isPhrase('  hello   world  ')).toBe(true)
    })

    it('returns true for phrase with tabs', () => {
      expect(isPhrase('hello\tworld')).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('returns false for empty string', () => {
      expect(isPhrase('')).toBe(false)
    })

    it('returns false for whitespace only', () => {
      expect(isPhrase('   ')).toBe(false)
    })

    it('handles newlines as word separators', () => {
      expect(isPhrase('hello\nworld')).toBe(true)
    })
  })
})

describe('languageNameToCode', () => {
  describe('exact matches', () => {
    it('returns correct code for English', () => {
      expect(languageNameToCode('english')).toBe('en')
      expect(languageNameToCode('English')).toBe('en')
    })

    it('returns correct code for Vietnamese', () => {
      expect(languageNameToCode('vietnamese')).toBe('vi')
      expect(languageNameToCode('Vietnamese')).toBe('vi')
    })

    it('returns correct code for Asian languages', () => {
      expect(languageNameToCode('chinese')).toBe('zh')
      expect(languageNameToCode('japanese')).toBe('ja')
      expect(languageNameToCode('korean')).toBe('ko')
      expect(languageNameToCode('thai')).toBe('th')
    })

    it('returns correct code for European languages', () => {
      expect(languageNameToCode('spanish')).toBe('es')
      expect(languageNameToCode('french')).toBe('fr')
      expect(languageNameToCode('german')).toBe('de')
      expect(languageNameToCode('portuguese')).toBe('pt')
      expect(languageNameToCode('russian')).toBe('ru')
    })
  })

  describe('partial matches', () => {
    it('handles language with suffix', () => {
      expect(languageNameToCode('Thai language')).toBe('th')
      expect(languageNameToCode('Vietnamese (Auto-detected)')).toBe('vi')
    })
  })

  describe('edge cases', () => {
    it('returns en for unknown language', () => {
      expect(languageNameToCode('unknown')).toBe('en')
      expect(languageNameToCode('')).toBe('en')
    })

    it('is case insensitive', () => {
      expect(languageNameToCode('ENGLISH')).toBe('en')
      expect(languageNameToCode('ViEtNaMeSe')).toBe('vi')
    })
  })
})

// Note: translateText, testConnection, saveApiKey require mocking fetch and chrome.storage
// These are integration tests that would need more complex setup
// For now, we focus on pure function tests as per YAGNI
