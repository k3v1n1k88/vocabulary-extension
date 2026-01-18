/**
 * Audio Handler Module
 * Handles text-to-speech (TTS) audio playback via Google Translate.
 */

// Map our lang codes to Google Translate codes
const googleLangMap: Record<string, string> = {
  'en': 'en', 'vi': 'vi', 'th': 'th', 'zh': 'zh-CN',
  'ja': 'ja', 'ko': 'ko', 'es': 'es', 'fr': 'fr',
  'de': 'de', 'pt': 'pt', 'ru': 'ru', 'id': 'id'
}

/**
 * Handle PLAY_AUDIO message - fetch TTS audio from Google Translate.
 * Service worker has host_permissions to bypass CORS.
 */
export async function handlePlayAudio(
  payload: { text: string; lang?: string },
  sendResponse: (response: unknown) => void
): Promise<void> {
  const { text, lang } = payload
  const googleLang = googleLangMap[lang || 'en'] || 'en'

  // Build Google Translate TTS URL (limit text to 200 chars)
  const encodedText = encodeURIComponent(text.slice(0, 200))
  const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${googleLang}&q=${encodedText}`

  try {
    const response = await fetch(audioUrl)
    if (!response.ok) {
      sendResponse({ success: false, error: 'Failed to fetch audio' })
      return
    }

    const blob = await response.blob()
    const reader = new FileReader()

    reader.onloadend = () => {
      sendResponse({ success: true, audioDataUrl: reader.result as string })
    }
    reader.onerror = () => {
      sendResponse({ success: false, error: 'Failed to process audio' })
    }

    reader.readAsDataURL(blob)
  } catch (error) {
    console.error('[VocabExt] TTS fetch error:', error)
    sendResponse({ success: false, error: 'Network error fetching audio' })
  }
}
