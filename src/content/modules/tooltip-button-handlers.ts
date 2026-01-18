/* global Element */
/**
 * Tooltip Button Handlers Module
 * Reusable click handlers for tooltip buttons (audio, copy, save, settings).
 */

import { playGoogleTTSAudio, showTTSError } from './tts-player'

// SVG icons for button state updates
const ICONS = {
  checkmark: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <polyline points="20 6 9 17 4 12"/>
  </svg>`,
  copy: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>`,
  bookmarkFilled: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
  </svg>`
}

/**
 * Request TTS audio from background and play it.
 */
export async function playAudioFromBackground(text: string, lang: string): Promise<void> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({
      type: 'PLAY_AUDIO',
      payload: { text, lang }
    }, async (response) => {
      if (response?.success && response.audioDataUrl) {
        try {
          await playGoogleTTSAudio(response.audioDataUrl)
        } catch {
          showTTSError('Audio playback failed. Check your internet connection.')
        }
      } else if (response?.error) {
        showTTSError(response.error)
      }
      resolve()
    })
  })
}

/**
 * Open settings page with optional hash.
 */
export function openSettingsPage(hash?: string): void {
  chrome.runtime.sendMessage({
    type: 'OPEN_OPTIONS_PAGE',
    payload: { hash: hash || 'settings-ai-translation' }
  })
}

/**
 * Copy text to clipboard and update button state.
 */
export async function copyToClipboard(text: string, button: Element): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
    button.innerHTML = `${ICONS.checkmark} Copied!`
    setTimeout(() => {
      button.innerHTML = `${ICONS.copy} Copy`
    }, 2000)
  } catch (error) {
    console.error('Failed to copy:', error)
  }
}

/**
 * Save word and update button state.
 */
export async function saveWordAndUpdateButton(word: unknown, button: Element): Promise<void> {
  try {
    await chrome.runtime.sendMessage({
      type: 'SAVE_WORD',
      payload: { word }
    })
    button.innerHTML = `${ICONS.bookmarkFilled} Saved!`
    button.classList.add('saved')
    ;(button as HTMLButtonElement).disabled = true
  } catch (error) {
    console.error('Failed to save word:', error)
  }
}

/**
 * Setup audio button click handler.
 */
export function setupAudioButtonHandler(
  tooltip: HTMLDivElement,
  text: string,
  lang: string
): void {
  const audioBtn = tooltip.querySelector('.vocab-audio-btn')
  audioBtn?.addEventListener('click', (e) => {
    e.stopPropagation()
    playAudioFromBackground(text, lang)
  })
}

/**
 * Setup copy button click handler.
 */
export function setupCopyButtonHandler(
  tooltip: HTMLDivElement,
  textToCopy: string
): void {
  // Support both full copy button and icon-only copy button
  const copyBtn = tooltip.querySelector('.vocab-copy-btn, .vocab-copy-icon-btn')
  copyBtn?.addEventListener('click', async (e) => {
    e.stopPropagation()
    if (copyBtn) {
      await copyToClipboard(textToCopy, copyBtn)
    }
  })
}

/**
 * Setup save button click handler.
 */
export function setupSaveButtonHandler(
  tooltip: HTMLDivElement,
  word: unknown
): void {
  const saveBtn = tooltip.querySelector('.vocab-save-btn')
  saveBtn?.addEventListener('click', async (e) => {
    e.stopPropagation()
    if (saveBtn) {
      await saveWordAndUpdateButton(word, saveBtn)
    }
  })
}

/**
 * Setup settings button/link click handler.
 */
export function setupSettingsHandler(
  tooltip: HTMLDivElement,
  selector: string,
  onClickCallback?: () => void
): void {
  const settingsEl = tooltip.querySelector(selector)
  settingsEl?.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    openSettingsPage('settings-ai-translation')
    onClickCallback?.()
  })
}

/**
 * Setup AI hint link click handler.
 */
export function setupAiHintHandler(tooltip: HTMLDivElement): void {
  setupSettingsHandler(tooltip, '.vocab-ai-hint')
}
