/**
 * Text-to-Speech service using Web Speech API
 */

export interface TTSOptions {
  rate?: number // 0.1 to 10, default 1
  pitch?: number // 0 to 2, default 1
  volume?: number // 0 to 1, default 1
  lang?: string // BCP 47 language tag, default 'en-US'
}

const defaultOptions: TTSOptions = {
  rate: 0.9,
  pitch: 1,
  volume: 1,
  lang: 'en-US'
}

/**
 * Speak text using Web Speech API
 */
export function speak(text: string, options: TTSOptions = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!window.speechSynthesis) {
      reject(new Error('Speech synthesis not supported'))
      return
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    const opts = { ...defaultOptions, ...options }

    utterance.rate = opts.rate!
    utterance.pitch = opts.pitch!
    utterance.volume = opts.volume!
    utterance.lang = opts.lang!

    // Try to find a good voice for the language
    const voices = window.speechSynthesis.getVoices()
    const preferredVoice = voices.find(
      (v) => v.lang.startsWith(opts.lang!.split('-')[0]) && v.localService
    )
    if (preferredVoice) {
      utterance.voice = preferredVoice
    }

    utterance.onend = () => resolve()
    utterance.onerror = (e) => reject(e)

    window.speechSynthesis.speak(utterance)
  })
}

/**
 * Stop any ongoing speech
 */
export function stopSpeaking(): void {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
}

/**
 * Check if TTS is available
 */
export function isTTSAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

/**
 * Get available voices
 */
export function getVoices(): SpeechSynthesisVoice[] {
  if (!window.speechSynthesis) return []
  return window.speechSynthesis.getVoices()
}

/**
 * Play pronunciation from URL or fallback to TTS
 */
export async function playPronunciation(
  word: string,
  audioUrl?: string
): Promise<void> {
  if (audioUrl) {
    try {
      const audio = new Audio(audioUrl)
      await audio.play()
      return
    } catch {
      // Fallback to TTS if audio URL fails
      console.warn('Audio URL failed, falling back to TTS')
    }
  }

  // Use TTS as fallback
  await speak(word, { rate: 0.8 })
}
