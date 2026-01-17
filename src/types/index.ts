// Word and Vocabulary types
export interface Word {
  id: string
  word: string
  definition: string
  pronunciation?: string
  partOfSpeech?: string
  vietnameseTranslation?: string
  examples?: string[]
  synonyms?: string[]
  antonyms?: string[]
  audioUrl?: string
  createdAt: number
  lastReviewed?: number
  source?: string
  isFreeTranslation?: boolean // true = free API, false = AI translation
}

// Spaced repetition (SM-2) types
export interface FlashcardData {
  wordId: string
  repetitions: number // n: consecutive correct recalls
  easinessFactor: number // EF: multiplier for interval (min 1.3, default 2.5)
  interval: number // days until next review
  nextReview: number // timestamp
  quality?: number // last quality rating 1-5
}

// Gamification types
export interface UserStats {
  totalWords: number
  wordsLearned: number // mastery threshold met
  totalReviews: number
  accuracy: number // percentage
  currentStreak: number
  longestStreak: number
  lastStudyDate: string // ISO date
  totalStudyTime: number // minutes
  xp: number
  level: number
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlockedAt?: number
  progress?: number
  maxProgress?: number
}

// LLM Provider types
export type LLMProvider = 'openai' | 'gemini' | 'grok'

export interface ModelInfo {
  id: string
  description: string // Short description for users
}

export interface ProviderConfig {
  id: LLMProvider
  name: string
  endpoint: string
  defaultModel: string
  models: ModelInfo[]
  authType: 'bearer' | 'header' // header = x-goog-api-key for Gemini
  apiKeyStorageKey: string
  registerUrl: string
}

// Settings types
export interface UserSettings {
  dailyGoal: number // words per day
  notificationsEnabled: boolean
  reminderInterval?: number // interval in minutes (default: 60)
  theme: 'light' | 'dark' | 'system'
  autoPlayAudio: boolean
  showVietnamese: boolean
  lookupShortcutEnabled: boolean // enable keyboard shortcut mode (disables floating menu)
  lookupShortcut: string // e.g., 'Ctrl+Shift+D', 'Ctrl+D', 'Alt+T'
  targetLanguage: string // e.g., 'vi', 'zh', 'ja', 'ko', 'es', 'fr'
  sourceLanguage?: string // source language for free translation (default: 'en')
  useLLMTranslation: boolean // true = use LLM provider, false = use free API
  llmProvider: LLMProvider // selected LLM provider
  llmModel?: string // selected model for current provider
}

// Supported translation languages
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
] as const

// Translation types
export interface TranslationResult {
  originalText: string
  translatedText: string
  sourceLanguage: string
  targetLanguage: string
  sourceLangCode?: string  // For swap functionality
  targetLangCode?: string  // For swap functionality
  isPhrase: boolean
  synonyms?: string[]
  antonyms?: string[]
  note?: string
  isFreeTranslation?: boolean
}

// Message types for Chrome runtime messaging
export type MessageType =
  | 'LOOKUP_WORD'
  | 'LOOKUP_SELECTED'
  | 'TRANSLATE_TEXT'
  | 'TRANSLATE_SWAP'
  | 'SAVE_WORD'
  | 'GET_WORDS'
  | 'DELETE_WORD'
  | 'UPDATE_FLASHCARD'
  | 'GET_STATS'
  | 'UPDATE_STATS'
  | 'PLAY_AUDIO'
  | 'SHOW_LOADING'
  | 'UPDATE_REMINDER'
  | 'TEST_NOTIFICATION'
  | 'OPEN_OPTIONS_PAGE'

export interface Message<T = unknown> {
  type: MessageType
  payload?: T
}

export interface LookupWordPayload {
  word: string
  context?: string
}

export interface SaveWordPayload {
  word: Word
}

// Dictionary API response types
export interface DictionaryResponse {
  word: string
  phonetic?: string
  phonetics?: Array<{
    text?: string
    audio?: string
  }>
  meanings?: Array<{
    partOfSpeech: string
    definitions: Array<{
      definition: string
      example?: string
      synonyms?: string[]
      antonyms?: string[]
    }>
  }>
}

// App state types
export type TabType = 'dashboard' | 'study' | 'vocabulary'

export interface AppState {
  activeTab: TabType
  isLoggedIn: boolean
  isLoading: boolean
  error?: string
}
