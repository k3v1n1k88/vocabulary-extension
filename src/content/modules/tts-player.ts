/**
 * TTS Player Module
 * Handles Google TTS audio playback and error notifications.
 */

import { escapeHtml } from '../utils/html-escape'

// Global audio element for Google TTS playback
let ttsAudio: HTMLAudioElement | null = null

/**
 * Play audio from Google Translate TTS URL.
 */
export function playGoogleTTSAudio(audioUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Stop any existing audio
    if (ttsAudio) {
      ttsAudio.pause()
      ttsAudio.currentTime = 0
    }

    ttsAudio = new Audio(audioUrl)
    ttsAudio.onended = () => resolve()
    ttsAudio.onerror = () => reject(new Error('Audio playback failed'))
    ttsAudio.play().catch(reject)
  })
}

/**
 * Show TTS error as a temporary toast notification.
 */
export function showTTSError(message: string): void {
  // Remove any existing TTS error toast
  const existing = document.getElementById('vocab-tts-error')
  if (existing) existing.remove()

  const toast = document.createElement('div')
  toast.id = 'vocab-tts-error'
  toast.innerHTML = `
    <div style="
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #1f2937;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      z-index: 999999;
      max-width: 400px;
      text-align: center;
    ">
      <span style="margin-right: 8px;">🔇</span>${escapeHtml(message)}
    </div>
  `
  document.body.appendChild(toast)

  // Auto-remove after 5 seconds
  setTimeout(() => toast.remove(), 5000)
}
