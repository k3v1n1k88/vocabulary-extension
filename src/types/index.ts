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
  audioUrl?: string
  createdAt: number
  lastReviewed?: number
  source?: string
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

// Settings types
export interface UserSettings {
  dailyGoal: number // words per day
  notificationsEnabled: boolean
  reminderTime?: string // HH:mm format
  theme: 'light' | 'dark' | 'system'
  autoPlayAudio: boolean
  showVietnamese: boolean
}

// Message types for Chrome runtime messaging
export type MessageType =
  | 'LOOKUP_WORD'
  | 'SAVE_WORD'
  | 'GET_WORDS'
  | 'DELETE_WORD'
  | 'UPDATE_FLASHCARD'
  | 'GET_STATS'
  | 'UPDATE_STATS'
  | 'PLAY_AUDIO'

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
