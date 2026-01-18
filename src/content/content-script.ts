import type { Word, TranslationResult } from '@/types'
import { SUPPORTED_LANGUAGES } from '@/types'

/**
 * Escape HTML special characters to prevent XSS attacks.
 * Used for all user-controlled content inserted via innerHTML.
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * Escape HTML for use in data attributes.
 * Escapes quotes in addition to HTML special characters.
 */
function escapeAttr(text: string): string {
  return escapeHtml(text).replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

// Element references
let tooltip: HTMLDivElement | null = null
let floatingButton: HTMLDivElement | null = null

// Store absolute position for tooltip positioning after menu click
let savedTooltipPosition: { left: number; top: number } | null = null

// Cached languages for floating menu display and TTS
let cachedTargetLanguage = 'Vietnamese'
let cachedSourceLanguage = 'English'
let cachedSourceLangCode = 'en'
let cachedUseLLMTranslation = false // AI mode flag

// Load languages from storage
chrome.storage.local.get('settings-storage', (result) => {
  if (result['settings-storage']) {
    try {
      const parsed = JSON.parse(result['settings-storage'])
      const settings = parsed.state?.settings || parsed.state || {}
      const targetCode = settings.targetLanguage || 'vi'
      const targetLang = SUPPORTED_LANGUAGES.find(l => l.code === targetCode)
      if (targetLang) {
        cachedTargetLanguage = targetLang.name
      }
      cachedSourceLangCode = settings.sourceLanguage || 'en'
      const sourceLang = SUPPORTED_LANGUAGES.find(l => l.code === cachedSourceLangCode)
      if (sourceLang) {
        cachedSourceLanguage = sourceLang.name
      }
      cachedUseLLMTranslation = settings.useLLMTranslation ?? false
    } catch (e) {
      console.warn('[VocabExt] Failed to parse settings:', e)
    }
  }
})

// Listen for settings changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes['settings-storage']?.newValue) {
    try {
      const parsed = JSON.parse(changes['settings-storage'].newValue)
      const settings = parsed.state?.settings || parsed.state || {}
      const targetCode = settings.targetLanguage || 'vi'
      const targetLang = SUPPORTED_LANGUAGES.find(l => l.code === targetCode)
      if (targetLang) {
        cachedTargetLanguage = targetLang.name
      }
      cachedSourceLangCode = settings.sourceLanguage || 'en'
      const sourceLang = SUPPORTED_LANGUAGES.find(l => l.code === cachedSourceLangCode)
      if (sourceLang) {
        cachedSourceLanguage = sourceLang.name
      }
      cachedUseLLMTranslation = settings.useLLMTranslation ?? false
    } catch (e) {
      console.warn('[VocabExt] Failed to parse settings change:', e)
    }
  }
})

// Save target language to storage (updates Zustand persist format)
function saveTargetLanguage(langCode: string) {
  chrome.storage.local.get('settings-storage', (result) => {
    try {
      const stored = result['settings-storage'] ? JSON.parse(result['settings-storage']) : { state: { settings: {} }, version: 0 }
      if (!stored.state) stored.state = {}
      if (!stored.state.settings) stored.state.settings = {}
      stored.state.settings.targetLanguage = langCode
      chrome.storage.local.set({ 'settings-storage': JSON.stringify(stored) })
    } catch (e) {
      console.warn('[VocabExt] Failed to save target language:', e)
    }
  })
}

// Save source language to storage (for free translation)
function saveSourceLanguage(langCode: string) {
  chrome.storage.local.get('settings-storage', (result) => {
    try {
      const stored = result['settings-storage'] ? JSON.parse(result['settings-storage']) : { state: { settings: {} }, version: 0 }
      if (!stored.state) stored.state = {}
      if (!stored.state.settings) stored.state.settings = {}
      stored.state.settings.sourceLanguage = langCode
      chrome.storage.local.set({ 'settings-storage': JSON.stringify(stored) })
    } catch (e) {
      console.warn('[VocabExt] Failed to save source language:', e)
    }
  })
}

// Cached shortcut settings
let lookupShortcutEnabled = false
let lookupShortcut = ''

// Load shortcut settings from storage
chrome.storage.local.get('settings-storage', (result) => {
  if (result['settings-storage']) {
    try {
      const parsed = JSON.parse(result['settings-storage'])
      const settings = parsed.state?.settings || parsed.state
      lookupShortcutEnabled = settings?.lookupShortcutEnabled ?? false
      lookupShortcut = settings?.lookupShortcut || 'Ctrl+Shift+D'
      console.log('[VocabExt] Loaded shortcut settings:', { enabled: lookupShortcutEnabled, shortcut: lookupShortcut })
    } catch (e) {
      console.warn('[VocabExt] Failed to parse settings:', e)
    }
  }
})

// Listen for settings changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes['settings-storage']?.newValue) {
    try {
      const parsed = JSON.parse(changes['settings-storage'].newValue)
      const settings = parsed.state?.settings || parsed.state
      const wasEnabled = lookupShortcutEnabled
      lookupShortcutEnabled = settings?.lookupShortcutEnabled ?? false
      lookupShortcut = settings?.lookupShortcut || 'Ctrl+Shift+D'
      console.log('[VocabExt] Shortcut settings updated:', { enabled: lookupShortcutEnabled, shortcut: lookupShortcut })

      // If shortcut mode just got enabled, hide any existing floating menu
      if (!wasEnabled && lookupShortcutEnabled) {
        const existingButton = document.getElementById('vocab-floating-menu')
        if (existingButton) existingButton.remove()
      }
    } catch (e) {
      console.warn('[VocabExt] Failed to parse settings change:', e)
    }
  }
})

// Check if shortcut is a single modifier key
function isSingleModifier(shortcut: string): boolean {
  return ['ALT', 'CTRL', 'SHIFT'].includes(shortcut.toUpperCase())
}

// Parse shortcut string to check against event
function matchesShortcut(e: KeyboardEvent, shortcut: string): boolean {
  const parts = shortcut.toUpperCase().split('+')
  const key = parts[parts.length - 1]
  const needsCtrl = parts.includes('CTRL')
  const needsAlt = parts.includes('ALT')
  const needsShift = parts.includes('SHIFT')

  const hasCtrl = e.ctrlKey || e.metaKey
  const pressedKey = e.key.toUpperCase()

  // Handle function keys (F1-F12)
  const isFunctionKey = /^F\d+$/.test(key)
  const keyMatches = pressedKey === key ||
    (isFunctionKey && e.code.toUpperCase() === key)

  return (
    hasCtrl === needsCtrl &&
    e.altKey === needsAlt &&
    e.shiftKey === needsShift &&
    keyMatches
  )
}

// Track modifier key for single-modifier shortcuts
let modifierPressed: string | null = null
let modifierUsed = false

// Keyboard shortcut listener
document.addEventListener('keydown', (e) => {
  // Skip if shortcut mode is disabled
  if (!lookupShortcutEnabled) return

  const key = e.key.toUpperCase()

  // Handle single modifier shortcuts
  if (isSingleModifier(lookupShortcut)) {
    const shortcutKey = lookupShortcut.toUpperCase()
    if (
      (shortcutKey === 'ALT' && (key === 'ALT' || key === 'META')) ||
      (shortcutKey === 'CTRL' && key === 'CONTROL') ||
      (shortcutKey === 'SHIFT' && key === 'SHIFT')
    ) {
      modifierPressed = shortcutKey
      modifierUsed = false
      return
    }
    // If another key pressed while modifier held, mark as used (combo, not single)
    if (modifierPressed) {
      modifierUsed = true
    }
    return
  }

  // Handle normal shortcuts (modifier + key)
  if (matchesShortcut(e, lookupShortcut)) {
    e.preventDefault()
    showFloatingMenuForSelection()
  }
})

document.addEventListener('keyup', (e) => {
  // Skip if shortcut mode is disabled
  if (!lookupShortcutEnabled) return

  // Handle single modifier shortcut on release
  if (isSingleModifier(lookupShortcut) && modifierPressed && !modifierUsed) {
    const key = e.key.toUpperCase()
    const shortcutKey = lookupShortcut.toUpperCase()
    if (
      (shortcutKey === 'ALT' && (key === 'ALT' || key === 'META')) ||
      (shortcutKey === 'CTRL' && key === 'CONTROL') ||
      (shortcutKey === 'SHIFT' && key === 'SHIFT')
    ) {
      showFloatingMenuForSelection()
    }
  }
  modifierPressed = null
  modifierUsed = false
})

// Show floating menu for selected text (triggered by keyboard shortcut)
function showFloatingMenuForSelection() {
  const selection = window.getSelection()
  const selectedText = selection?.toString().trim()

  if (selectedText && selection) {
    showFloatingButton(selection)
  }
}

// Show floating menu when text is selected (only if shortcut mode is disabled)
document.addEventListener('mouseup', (e) => {
  console.log('[VocabExt] mouseup event triggered')

  // If shortcut mode is enabled, don't show floating menu - use keyboard instead
  if (lookupShortcutEnabled) {
    console.log('[VocabExt] Shortcut mode enabled, skipping floating menu')
    return
  }

  // Ignore if clicking on our elements
  if (tooltip?.contains(e.target as Node) || floatingButton?.contains(e.target as Node)) {
    console.log('[VocabExt] Ignoring - clicked on existing element')
    return
  }

  // Small delay to let selection finalize
  setTimeout(() => {
    const selection = window.getSelection()
    const selectedText = selection?.toString().trim()
    console.log('[VocabExt] Selection:', selectedText)

    if (selectedText && selectedText.length > 0) {
      console.log('[VocabExt] Showing floating menu for:', selectedText)
      showFloatingButton(selection!)
    } else {
      removeFloatingButton()
    }
  }, 10)
})

// Hide button when clicking elsewhere
document.addEventListener('mousedown', (e) => {
  if (!floatingButton?.contains(e.target as Node) && !tooltip?.contains(e.target as Node)) {
    removeFloatingButton()
  }
})

function showFloatingButton(selection: Selection) {
  console.log('[VocabExt] showFloatingButton called')
  removeFloatingButton()

  // Guard: Verify selection still exists
  if (!selection || selection.rangeCount === 0) {
    console.log('[VocabExt] Selection cleared, skipping floating button')
    return
  }

  const range = selection.getRangeAt(0)
  const rect = range.getBoundingClientRect()
  console.log('[VocabExt] Selection rect:', rect)

  // Save absolute position for tooltip (rect is viewport-relative, add scroll to get absolute)
  savedTooltipPosition = {
    left: rect.left + window.scrollX,
    top: rect.bottom + window.scrollY + 10
  }
  console.log('[VocabExt] Saved tooltip position:', savedTooltipPosition)

  const selectedText = selection.toString().trim()
  const isPhrase = selectedText.split(/\s+/).length > 1

  // Build language options HTML for source and target
  const sourceLangOptionsHtml = SUPPORTED_LANGUAGES.map(lang =>
    `<div class="vocab-lang-option${lang.name === cachedSourceLanguage ? ' active' : ''}" data-lang-code="${lang.code}" data-lang-name="${lang.name}">${lang.nativeName} (${lang.name})</div>`
  ).join('')
  const targetLangOptionsHtml = SUPPORTED_LANGUAGES.map(lang =>
    `<div class="vocab-lang-option${lang.name === cachedTargetLanguage ? ' active' : ''}" data-lang-code="${lang.code}" data-lang-name="${lang.name}">${lang.nativeName} (${lang.name})</div>`
  ).join('')

  // AI mode: hide source language dropdown (LLM auto-detects), show AI icon
  // Non-AI mode: show both source and target dropdowns
  const sourceLangHtml = cachedUseLLMTranslation
    ? '' // AI mode - no source dropdown needed
    : `<div class="vocab-menu-item vocab-source-lang-trigger" data-action="change-source-lang" title="Source language">
        <span class="vocab-lang-short">${cachedSourceLanguage.slice(0, 2).toUpperCase()}</span>
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M6 9l6 6 6-6"/></svg>
      </div>
      <span class="vocab-lang-arrow">→</span>`

  const aiIconHtml = cachedUseLLMTranslation
    ? `<span class="vocab-ai-badge" title="AI-powered translation">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
        AI
      </span>`
    : ''

  floatingButton = document.createElement('div')
  floatingButton.id = 'vocab-floating-menu'
  floatingButton.className = 'vocab-menu-horizontal'
  floatingButton.innerHTML = `
    <div class="vocab-menu-row">
      <div class="vocab-menu-item" data-action="lookup">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
        <span>${isPhrase ? 'Translate' : 'Look up'}</span>
        ${aiIconHtml}
      </div>
      <div class="vocab-menu-item" data-action="speak" title="Speak">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 5L6 9H2v6h4l5 4V5z"/>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
        </svg>
      </div>
      <div class="vocab-menu-divider"></div>
      ${sourceLangHtml}
      <div class="vocab-menu-item vocab-target-lang-trigger" data-action="change-target-lang" title="Target language">
        <span class="vocab-lang-short">${cachedTargetLanguage.slice(0, 2).toUpperCase()}</span>
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M6 9l6 6 6-6"/></svg>
      </div>
    </div>
    ${cachedUseLLMTranslation ? '' : `<div class="vocab-source-lang-dropdown vocab-lang-dropdown" style="display:none;">${sourceLangOptionsHtml}</div>`}
    <div class="vocab-target-lang-dropdown vocab-lang-dropdown" style="display:none;">${targetLangOptionsHtml}</div>
  `

  // Position near selection
  let left = rect.left + window.scrollX
  const top = rect.bottom + window.scrollY + 5

  // Adjust if menu would go off-screen
  if (left + 140 > window.innerWidth) {
    left = window.innerWidth - 150
  }

  floatingButton.style.cssText = `
    position: absolute;
    left: ${Math.max(left, 10)}px;
    top: ${Math.max(top, 10)}px;
    z-index: 999998;
  `

  // Track which dropdown is open (source or target)
  let activeDropdown: 'source' | 'target' | null = null

  // Handle menu clicks - use captured selectedText directly
  floatingButton.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    const clickedEl = e.target as HTMLElement

    // Check if clicked on source language trigger
    const sourceLangTrigger = clickedEl.closest('.vocab-source-lang-trigger')
    if (sourceLangTrigger) {
      const sourceDropdown = floatingButton?.querySelector('.vocab-source-lang-dropdown') as HTMLElement
      const targetDropdown = floatingButton?.querySelector('.vocab-target-lang-dropdown') as HTMLElement
      if (sourceDropdown) {
        const isVisible = sourceDropdown.style.display !== 'none'
        sourceDropdown.style.display = isVisible ? 'none' : 'block'
        if (targetDropdown) targetDropdown.style.display = 'none'
        activeDropdown = isVisible ? null : 'source'
      }
      return
    }

    // Check if clicked on target language trigger
    const targetLangTrigger = clickedEl.closest('.vocab-target-lang-trigger')
    if (targetLangTrigger) {
      const sourceDropdown = floatingButton?.querySelector('.vocab-source-lang-dropdown') as HTMLElement
      const targetDropdown = floatingButton?.querySelector('.vocab-target-lang-dropdown') as HTMLElement
      if (targetDropdown) {
        const isVisible = targetDropdown.style.display !== 'none'
        targetDropdown.style.display = isVisible ? 'none' : 'block'
        if (sourceDropdown) sourceDropdown.style.display = 'none'
        activeDropdown = isVisible ? null : 'target'
      }
      return
    }

    // Check if clicked on a language option
    const langOption = clickedEl.closest('.vocab-lang-option') as HTMLElement
    if (langOption) {
      const langCode = langOption.dataset.langCode
      const langName = langOption.dataset.langName
      if (langCode && langName) {
        if (activeDropdown === 'source') {
          // Update source language
          cachedSourceLanguage = langName
          cachedSourceLangCode = langCode
          saveSourceLanguage(langCode)
          // Update UI
          const trigger = floatingButton?.querySelector('.vocab-source-lang-trigger .vocab-lang-short')
          if (trigger) {
            trigger.textContent = langName.slice(0, 2).toUpperCase()
          }
          // Update active state in source dropdown
          floatingButton?.querySelectorAll('.vocab-source-lang-dropdown .vocab-lang-option').forEach(opt => opt.classList.remove('active'))
          langOption.classList.add('active')
          // Hide dropdown
          const dropdown = floatingButton?.querySelector('.vocab-source-lang-dropdown') as HTMLElement
          if (dropdown) dropdown.style.display = 'none'
        } else if (activeDropdown === 'target') {
          // Update target language
          cachedTargetLanguage = langName
          saveTargetLanguage(langCode)
          // Update UI
          const trigger = floatingButton?.querySelector('.vocab-target-lang-trigger .vocab-lang-short')
          if (trigger) {
            trigger.textContent = langName.slice(0, 2).toUpperCase()
          }
          // Update active state in target dropdown
          floatingButton?.querySelectorAll('.vocab-target-lang-dropdown .vocab-lang-option').forEach(opt => opt.classList.remove('active'))
          langOption.classList.add('active')
          // Hide dropdown
          const dropdown = floatingButton?.querySelector('.vocab-target-lang-dropdown') as HTMLElement
          if (dropdown) dropdown.style.display = 'none'
        }
        activeDropdown = null
      }
      return
    }

    const target = clickedEl.closest('.vocab-menu-item')
    if (!target) return

    const action = target.getAttribute('data-action')

    if (action === 'lookup') {
      removeFloatingButton()
      try {
        chrome.runtime.sendMessage({
          type: 'LOOKUP_SELECTED',
          payload: { text: selectedText }
        })
      } catch {
        console.warn('[VocabExt] Extension context invalidated, please refresh page')
      }
    } else if (action === 'speak') {
      try {
        chrome.runtime.sendMessage({
          type: 'PLAY_AUDIO',
          payload: { text: selectedText, lang: cachedSourceLangCode || 'en' }
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
        })
      } catch {
        console.warn('[VocabExt] Extension context invalidated, please refresh page')
      }
      removeFloatingButton()
    }
  })

  document.body.appendChild(floatingButton)
  console.log('[VocabExt] Floating menu appended to body, style:', floatingButton.style.cssText)
}

function removeFloatingButton() {
  // Note: Don't remove handleOutsideClick here - it's for tooltip, not floating button
  // The listener is properly cleaned up in removeTooltip()

  if (floatingButton) {
    console.log('[VocabExt] Removing floating menu')
    floatingButton.remove()
    floatingButton = null
  }
  // Fallback: remove by ID in case variable was reset or race condition
  const existingButton = document.getElementById('vocab-floating-menu')
  if (existingButton) {
    existingButton.remove()
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
  removeFloatingButton() // Hide button when showing any tooltip

  if (message.type === 'SHOW_LOADING') {
    showLoadingTooltip(message.payload.text, message.payload.isPhrase)
  } else if (message.type === 'SHOW_TOOLTIP') {
    updateTooltipWithWord(message.payload as Word)
  } else if (message.type === 'SHOW_TRANSLATION') {
    updateTooltipWithTranslation(message.payload as TranslationResult)
  } else if (message.type === 'SHOW_TOOLTIP_ERROR') {
    showErrorTooltip(message.payload.message)
  }
})

// Show loading tooltip immediately
function showLoadingTooltip(text: string, isPhrase: boolean) {
  // Save position BEFORE removeTooltip() clears it
  const position = savedTooltipPosition

  removeTooltip()

  let left: number
  let top: number

  if (position) {
    left = position.left
    top = position.top
  } else {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const rect = selection.getRangeAt(0).getBoundingClientRect()
      left = rect.left + window.scrollX
      top = rect.bottom + window.scrollY + 10
    } else {
      // Fallback: show in center of viewport if no position available
      left = window.innerWidth / 2 - 200
      top = window.innerHeight / 3 + window.scrollY
    }
  }

  // Save position for subsequent updates
  savedTooltipPosition = { left, top }

  const maxWidth = window.innerWidth >= 1200 ? 500 : 450
  if (left + maxWidth > window.innerWidth) {
    left = Math.max(10, window.innerWidth - maxWidth - 20)
  }

  // AI badge for loading state
  const loadingAiBadge = cachedUseLLMTranslation
    ? `<span class="vocab-ai-badge" title="AI-powered translation">
         <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
           <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
           <circle cx="7.5" cy="14.5" r="1.5"/>
           <circle cx="16.5" cy="14.5" r="1.5"/>
         </svg>
         AI
       </span>`
    : ''

  tooltip = document.createElement('div')
  tooltip.id = 'vocabulary-tooltip'
  tooltip.innerHTML = `
    <div class="vocab-tooltip-content">
      <div class="vocab-header">
        <div class="vocab-word-row">
          <span class="vocab-word">${escapeHtml(isPhrase ? text.substring(0, 50) + (text.length > 50 ? '...' : '') : text)}</span>
          <span class="vocab-type-badge">${isPhrase ? 'Translating...' : 'Looking up...'}</span>
          ${loadingAiBadge}
        </div>
      </div>
      <div class="vocab-loading">
        <div class="vocab-loading-spinner"></div>
        <span>${isPhrase ? 'Translating...' : 'Fetching definition...'}</span>
      </div>
    </div>
  `

  tooltip.style.cssText = `
    position: absolute;
    left: ${left}px;
    top: ${top}px;
    z-index: 999999;
  `

  document.body.appendChild(tooltip)
  document.addEventListener('click', handleOutsideClick)
}

// Update existing tooltip with word data (no position change)
function updateTooltipWithWord(word: Word) {
  if (!tooltip) {
    // Fallback: show tooltip normally if no loading tooltip exists
    showTooltip(word)
    return
  }

  tooltip.innerHTML = createTooltipHTML(word)
  setupTooltipEventListeners(word)
}

// Update existing tooltip with translation (no position change)
function updateTooltipWithTranslation(translation: TranslationResult) {
  if (!tooltip) {
    // Fallback: show tooltip normally if no loading tooltip exists
    showTranslationTooltip(translation)
    return
  }

  tooltip.innerHTML = createTranslationTooltipHTML(translation)
  setupTranslationEventListeners(translation)
}

// Create and show tooltip with word data
function showTooltip(word: Word) {
  // Save position BEFORE removeTooltip() clears it
  const position = savedTooltipPosition
  console.log('[VocabExt] showTooltip called, savedPosition:', position)

  removeTooltip()

  // Use saved position from floating menu, or calculate from current selection
  let left: number
  let top: number

  if (position) {
    left = position.left
    top = position.top
    console.log('[VocabExt] Using saved position:', left, top)
  } else {
    const selection = window.getSelection()
    console.log('[VocabExt] No saved position, trying selection:', selection?.toString())
    if (selection && selection.rangeCount > 0) {
      const rect = selection.getRangeAt(0).getBoundingClientRect()
      left = rect.left + window.scrollX
      top = rect.bottom + window.scrollY + 10
      console.log('[VocabExt] Calculated from selection:', left, top)
    } else {
      // Fallback: show in center of viewport if no position available
      left = window.innerWidth / 2 - 200
      top = window.innerHeight / 3 + window.scrollY
      console.log('[VocabExt] Using fallback center position:', left, top)
    }
  }

  tooltip = document.createElement('div')
  tooltip.id = 'vocabulary-tooltip'
  tooltip.innerHTML = createTooltipHTML(word)

  // Adjust if tooltip would go off-screen (responsive)
  const maxWidth = window.innerWidth >= 1200 ? 500 : 450

  // Adjust if tooltip would go off-screen
  if (left + maxWidth > window.innerWidth) {
    left = Math.max(10, window.innerWidth - maxWidth - 20)
  }

  tooltip.style.cssText = `
    position: absolute;
    left: ${left}px;
    top: ${top}px;
    z-index: 999999;
  `

  document.body.appendChild(tooltip)

  // Add event listeners
  setupTooltipEventListeners(word)

  // Close on click outside
  document.addEventListener('click', handleOutsideClick)
}

function createTooltipHTML(word: Word): string {
  const synonymsHTML = word.synonyms?.length
    ? `<div class="vocab-synonyms">
        <span class="vocab-label">Synonyms:</span>
        ${word.synonyms.map((s) => `<span class="vocab-tag vocab-tag-syn">${escapeHtml(s)}</span>`).join('')}
       </div>`
    : ''

  const antonymsHTML = word.antonyms?.length
    ? `<div class="vocab-antonyms">
        <span class="vocab-label">Antonyms:</span>
        ${word.antonyms.map((a) => `<span class="vocab-tag vocab-tag-ant">${escapeHtml(a)}</span>`).join('')}
       </div>`
    : ''

  const exampleHTML = word.examples?.[0]
    ? `<div class="vocab-example">
        <span class="vocab-label">Example:</span>
        <em>"${escapeHtml(word.examples[0])}"</em>
       </div>`
    : ''

  // Translation or error message
  const translationHTML = word.translationError
    ? `<div class="vocab-translation-error">
        <span class="vocab-label">⚠️ Translation Error:</span>
        <span class="vocab-error-msg">${escapeHtml(word.translationError)}</span>
        <a href="#" class="vocab-settings-link" data-action="open-settings">Open Settings →</a>
       </div>`
    : word.vietnameseTranslation
    ? `<div class="vocab-vietnamese">
        <span class="vocab-label">Translation:</span>
        ${escapeHtml(word.vietnameseTranslation)}
       </div>`
    : ''

  // Translation badge: AI or Free (just badge, no upsell in header)
  const translationBadgeHTML = word.translationError
    ? '' // No badge if there's an error
    : word.isFreeTranslation === false
    ? `<span class="vocab-ai-badge" title="AI-powered translation">
         <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
           <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
           <circle cx="7.5" cy="14.5" r="1.5"/>
           <circle cx="16.5" cy="14.5" r="1.5"/>
         </svg>
         AI
       </span>`
    : word.isFreeTranslation === true
    ? `<span class="vocab-free-badge">Free</span>`
    : ''

  // AI upsell hint (shown below content for free users, not if there's an error)
  const aiUpsellHTML = word.isFreeTranslation === true && !word.translationError
    ? `<div class="vocab-ai-upsell">
         <a href="#" class="vocab-ai-hint" data-action="open-settings">✨ Get better results with AI →</a>
       </div>`
    : ''

  return `
    <div class="vocab-tooltip-content">
      <div class="vocab-header">
        <div class="vocab-word-row">
          <span class="vocab-word">${escapeHtml(word.word)}</span>
          ${translationBadgeHTML}
          <button class="vocab-audio-btn" data-word="${escapeAttr(word.word)}" title="Play pronunciation">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 5L6 9H2v6h4l5 4V5z"/>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
            </svg>
          </button>
        </div>
        ${word.pronunciation ? `<span class="vocab-pronunciation">${escapeHtml(word.pronunciation)}</span>` : ''}
        ${word.partOfSpeech ? `<span class="vocab-pos">${escapeHtml(word.partOfSpeech)}</span>` : ''}
      </div>

      <div class="vocab-definition">
        <span class="vocab-label">Definition:</span>
        ${escapeHtml(word.definition)}
      </div>

      ${translationHTML}
      ${exampleHTML}
      ${synonymsHTML}
      ${antonymsHTML}

      ${aiUpsellHTML}

      <div class="vocab-actions">
        <button class="vocab-save-btn" data-word-id="${word.id}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
          Save to Vocabulary
        </button>
      </div>
    </div>
  `
}

// Show translation tooltip for phrases
function showTranslationTooltip(translation: TranslationResult) {
  // Save position BEFORE removeTooltip() clears it
  const position = savedTooltipPosition

  removeTooltip()

  // Use saved position from floating menu, or calculate from current selection
  let left: number
  let top: number

  if (position) {
    left = position.left
    top = position.top
  } else {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const rect = selection.getRangeAt(0).getBoundingClientRect()
      left = rect.left + window.scrollX
      top = rect.bottom + window.scrollY + 10
    } else {
      // Fallback: show in center of viewport if no position available
      left = window.innerWidth / 2 - 200
      top = window.innerHeight / 3 + window.scrollY
    }
  }

  tooltip = document.createElement('div')
  tooltip.id = 'vocabulary-tooltip'
  tooltip.innerHTML = createTranslationTooltipHTML(translation)

  // Adjust if tooltip would go off-screen (responsive)
  const maxWidth = window.innerWidth >= 1200 ? 600 : 520

  // Adjust if tooltip would go off-screen
  if (left + maxWidth > window.innerWidth) {
    left = Math.max(10, window.innerWidth - maxWidth - 20)
  }

  tooltip.style.cssText = `
    position: absolute;
    left: ${left}px;
    top: ${top}px;
    z-index: 999999;
  `

  document.body.appendChild(tooltip)

  // Add copy button listener
  setupTranslationEventListeners(translation)

  document.addEventListener('click', handleOutsideClick)
}

function createTranslationTooltipHTML(translation: TranslationResult): string {
  const typeLabel = translation.isPhrase ? 'Phrase' : 'Word'

  // Build language options HTML for target language
  const targetLangOptionsHtml = SUPPORTED_LANGUAGES.map(lang =>
    `<div class="vocab-lang-option${lang.name === cachedTargetLanguage ? ' active' : ''}" data-lang-code="${lang.code}" data-lang-name="${lang.name}">${lang.nativeName}</div>`
  ).join('')

  // Translation source badge: AI or Free (just badge, no upsell link in header)
  const translationBadgeHtml = translation.isFreeTranslation
    ? `<span class="vocab-free-badge">Free</span>`
    : `<span class="vocab-ai-badge" title="AI-powered translation">
         <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
           <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
           <circle cx="7.5" cy="14.5" r="1.5"/>
           <circle cx="16.5" cy="14.5" r="1.5"/>
         </svg>
         AI
       </span>`

  // AI upsell hint (shown below translation for free users)
  const aiUpsellHtml = translation.isFreeTranslation
    ? `<div class="vocab-ai-upsell">
         <a href="#" class="vocab-ai-hint" data-action="open-settings">✨ Get better results with AI →</a>
       </div>`
    : ''

  // Source language dropdown for free translations (since no auto-detect)
  const sourceLangCode = translation.sourceLangCode || 'en'
  const targetLangCode = translation.targetLangCode || 'vi'
  const sourceLangOptionsHtml = SUPPORTED_LANGUAGES.map(lang =>
    `<div class="vocab-lang-option${lang.code === sourceLangCode ? ' active' : ''}" data-lang-code="${lang.code}" data-lang-name="${lang.name}">${lang.nativeName}</div>`
  ).join('')

  // Source language: dropdown for free, static text for LLM
  const sourceLangHtml = translation.isFreeTranslation
    ? `<span class="vocab-source-lang-trigger" data-original-text="${encodeURIComponent(translation.originalText)}" data-target-code="${escapeAttr(targetLangCode)}">${escapeHtml(translation.sourceLanguage)} <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M6 9l6 6 6-6"/></svg></span>
       <div class="vocab-source-lang-dropdown" style="display:none;">${sourceLangOptionsHtml}</div>`
    : `<span>${escapeHtml(translation.sourceLanguage)}</span>`

  return `
    <div class="vocab-tooltip-content vocab-translation">
      <div class="vocab-header">
        <div class="vocab-word-row">
          <span class="vocab-word">${escapeHtml(translation.originalText)}</span>
          <span class="vocab-type-badge">${typeLabel}</span>
          ${translationBadgeHtml}
        </div>
        <span class="vocab-lang-info">
          ${sourceLangHtml} →
          <span class="vocab-target-lang-trigger">${escapeHtml(translation.targetLanguage)} <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M6 9l6 6 6-6"/></svg></span>
          <div class="vocab-target-lang-dropdown" style="display:none;">${targetLangOptionsHtml}</div>
        </span>
      </div>

      <div class="vocab-translation-result">
        <span class="vocab-label">Translation:</span>
        <div class="vocab-translated-text">${escapeHtml(translation.translatedText).replace(/\n/g, '<br>')}</div>
      </div>

      ${aiUpsellHtml}

      <div class="vocab-actions">
        <button class="vocab-copy-btn" title="Copy translation">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          Copy
        </button>
        <button class="vocab-audio-btn" data-text="${escapeAttr(translation.originalText)}" title="Play pronunciation">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 5L6 9H2v6h4l5 4V5z"/>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
          </svg>
        </button>
      </div>
    </div>
  `
}

function setupTranslationEventListeners(translation: TranslationResult) {
  if (!tooltip) return

  // AI hint link - open settings to API key section
  if (translation.isFreeTranslation) {
    const aiHint = tooltip.querySelector('.vocab-ai-hint')
    aiHint?.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      chrome.runtime.sendMessage({ type: 'OPEN_OPTIONS_PAGE', payload: { hash: 'settings-ai-translation' } })
    })

    // Source language dropdown - select source language and re-translate
    const sourceLangTrigger = tooltip.querySelector('.vocab-source-lang-trigger')
    const sourceLangDropdown = tooltip.querySelector('.vocab-source-lang-dropdown')

    sourceLangTrigger?.addEventListener('click', (e) => {
      e.stopPropagation()
      const isVisible = sourceLangDropdown?.getAttribute('style')?.includes('block')
      // Hide target dropdown if open
      const targetDropdown = tooltip?.querySelector('.vocab-target-lang-dropdown')
      if (targetDropdown) targetDropdown.setAttribute('style', 'display:none;')
      // Toggle source dropdown
      sourceLangDropdown?.setAttribute('style', isVisible ? 'display:none;' : 'display:block;')
    })

    // Source language option selection
    sourceLangDropdown?.querySelectorAll('.vocab-lang-option').forEach(option => {
      option.addEventListener('click', async (e) => {
        e.stopPropagation()
        const el = e.currentTarget as HTMLElement
        const newSourceCode = el.dataset.langCode || 'en'
        const newSourceName = el.dataset.langName || 'English'

        // Save source language preference
        saveSourceLanguage(newSourceCode)

        // Get data from trigger
        const trigger = tooltip?.querySelector('.vocab-source-lang-trigger') as HTMLElement
        const originalText = decodeURIComponent(trigger?.dataset.originalText || '')
        const targetCode = trigger?.dataset.targetCode || 'vi'

        // Hide dropdown and update trigger text
        sourceLangDropdown?.setAttribute('style', 'display:none;')
        if (trigger) {
          trigger.innerHTML = `${newSourceName} <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M6 9l6 6 6-6"/></svg>`
        }

        // Show loading state
        const translatedDiv = tooltip?.querySelector('.vocab-translated-text')
        if (translatedDiv) {
          translatedDiv.innerHTML = '<div class="vocab-loading"><div class="vocab-loading-spinner"></div>Translating...</div>'
        }

        try {
          // Re-translate with new source language
          const result = await chrome.runtime.sendMessage({
            type: 'TRANSLATE_SWAP',
            payload: { text: originalText, sourceLangCode: newSourceCode, targetLangCode: targetCode }
          }) as TranslationResult

          if (result && tooltip) {
            tooltip.innerHTML = createTranslationTooltipHTML(result)
            setupTranslationEventListeners(result)
          }
        } catch (error) {
          console.error('[VocabExt] Source language change failed:', error)
          if (translatedDiv) {
            translatedDiv.innerHTML = '<span style="color: #dc2626;">Translation failed. Try again.</span>'
          }
        }
      })
    })
  }

  // Copy button
  const copyBtn = tooltip.querySelector('.vocab-copy-btn')
  copyBtn?.addEventListener('click', async (e) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(translation.translatedText)
      if (copyBtn) {
        copyBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Copied!
        `
        setTimeout(() => {
          if (copyBtn) {
            copyBtn.innerHTML = `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              Copy
            `
          }
        }, 2000)
      }
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  })

  // Audio button - pass source language for correct TTS
  const audioBtn = tooltip.querySelector('.vocab-audio-btn')
  audioBtn?.addEventListener('click', (e) => {
    e.stopPropagation()
    chrome.runtime.sendMessage({
      type: 'PLAY_AUDIO',
      payload: { text: translation.originalText, lang: translation.sourceLangCode || 'en' }
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
    })
  })

  // Target language trigger - toggle dropdown
  const targetLangTrigger = tooltip.querySelector('.vocab-target-lang-trigger')
  const targetLangDropdown = tooltip.querySelector('.vocab-target-lang-dropdown') as HTMLElement
  targetLangTrigger?.addEventListener('click', (e) => {
    e.stopPropagation()
    // Hide source dropdown if open
    const sourceDropdown = tooltip?.querySelector('.vocab-source-lang-dropdown') as HTMLElement
    if (sourceDropdown) sourceDropdown.style.display = 'none'
    // Toggle target dropdown
    if (targetLangDropdown) {
      targetLangDropdown.style.display = targetLangDropdown.style.display === 'none' ? 'block' : 'none'
    }
  })

  // Target language options - select and re-translate
  targetLangDropdown?.querySelectorAll('.vocab-lang-option').forEach(option => {
    option.addEventListener('click', async (e) => {
      e.stopPropagation()
      const newTargetCode = (option as HTMLElement).dataset.langCode
      const newTargetName = (option as HTMLElement).dataset.langName
      if (newTargetCode && newTargetName) {
        // Update cached language
        cachedTargetLanguage = newTargetName
        // Save to storage
        saveTargetLanguage(newTargetCode)
        // Hide dropdown
        if (targetLangDropdown) targetLangDropdown.style.display = 'none'

        // For free translations, preserve source language
        if (translation.isFreeTranslation) {
          const currentSourceCode = translation.sourceLangCode || 'en'

          // Show loading
          const translatedDiv = tooltip?.querySelector('.vocab-translated-text')
          if (translatedDiv) {
            translatedDiv.innerHTML = '<div class="vocab-loading"><div class="vocab-loading-spinner"></div>Translating...</div>'
          }

          try {
            const result = await chrome.runtime.sendMessage({
              type: 'TRANSLATE_SWAP',
              payload: { text: translation.originalText, sourceLangCode: currentSourceCode, targetLangCode: newTargetCode }
            }) as TranslationResult

            if (result && tooltip) {
              tooltip.innerHTML = createTranslationTooltipHTML(result)
              setupTranslationEventListeners(result)
            }
          } catch (error) {
            console.error('[VocabExt] Target language change failed:', error)
            if (translatedDiv) {
              translatedDiv.innerHTML = '<span style="color: #dc2626;">Translation failed. Try again.</span>'
            }
          }
        } else {
          // LLM translation - use normal flow
          showLoadingTooltip(translation.originalText, translation.isPhrase)
          chrome.runtime.sendMessage({
            type: 'TRANSLATE_TEXT',
            payload: { text: translation.originalText, targetLanguage: newTargetName }
          }, (response) => {
            if (response?.success && response.data) {
              updateTooltipWithTranslation(response.data)
            }
          })
        }
      }
    })
  })
}

function showErrorTooltip(message: string) {
  // Save position BEFORE removeTooltip() clears it
  const position = savedTooltipPosition

  removeTooltip()

  // Use saved position from floating menu, or calculate from current selection
  let left: number
  let top: number

  if (position) {
    left = position.left
    top = position.top
  } else {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const rect = selection.getRangeAt(0).getBoundingClientRect()
      left = rect.left + window.scrollX
      top = rect.bottom + window.scrollY + 10
    } else {
      // Fallback: show in center of viewport if no position available
      left = window.innerWidth / 2 - 200
      top = window.innerHeight / 3 + window.scrollY
    }
  }

  // Check if this is an API key error - show settings button
  const isApiKeyError = message.toLowerCase().includes('api key')

  tooltip = document.createElement('div')
  tooltip.id = 'vocabulary-tooltip'
  tooltip.innerHTML = `
    <div class="vocab-tooltip-content vocab-error">
      <p>${escapeHtml(message)}</p>
      ${isApiKeyError ? `
        <button class="vocab-settings-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          Open Settings
        </button>
      ` : ''}
    </div>
  `

  tooltip.style.cssText = `
    position: absolute;
    left: ${left}px;
    top: ${top}px;
    z-index: 999999;
  `

  document.body.appendChild(tooltip)
  document.addEventListener('click', handleOutsideClick)

  // Add settings button listener if API key error
  if (isApiKeyError) {
    const settingsBtn = tooltip.querySelector('.vocab-settings-btn')
    settingsBtn?.addEventListener('click', (e) => {
      e.stopPropagation()
      // Content scripts can't call openOptionsPage directly, send message to background
      chrome.runtime.sendMessage({ type: 'OPEN_OPTIONS_PAGE', payload: { hash: 'settings-ai-translation' } })
      removeTooltip()
    })
  } else {
    // Auto-remove after 3 seconds only for non-API key errors
    setTimeout(removeTooltip, 3000)
  }
}

function setupTooltipEventListeners(word: Word) {
  if (!tooltip) return

  // Audio button - use user's configured source language for TTS
  const audioBtn = tooltip.querySelector('.vocab-audio-btn')
  audioBtn?.addEventListener('click', (e) => {
    e.stopPropagation()
    chrome.runtime.sendMessage({
      type: 'PLAY_AUDIO',
      payload: { text: word.word, lang: cachedSourceLangCode || 'en' }
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
    })
  })

  // AI hint link - open settings to API key section
  if (word.isFreeTranslation) {
    const aiHint = tooltip.querySelector('.vocab-ai-hint')
    aiHint?.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      chrome.runtime.sendMessage({ type: 'OPEN_OPTIONS_PAGE', payload: { hash: 'settings-ai-translation' } })
    })
  }

  // Settings link for translation errors - open settings to API key section
  if (word.translationError) {
    const settingsLink = tooltip.querySelector('.vocab-settings-link')
    settingsLink?.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      chrome.runtime.sendMessage({ type: 'OPEN_OPTIONS_PAGE', payload: { hash: 'settings-ai-translation' } })
    })
  }

  // Save button
  const saveBtn = tooltip.querySelector('.vocab-save-btn')
  saveBtn?.addEventListener('click', async (e) => {
    e.stopPropagation()
    try {
      await chrome.runtime.sendMessage({
        type: 'SAVE_WORD',
        payload: { word }
      })

      // Update button state
      if (saveBtn) {
        saveBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
          Saved!
        `
        saveBtn.classList.add('saved')
        ;(saveBtn as HTMLButtonElement).disabled = true
      }
    } catch (error) {
      console.error('Failed to save word:', error)
    }
  })
}

function handleOutsideClick(e: MouseEvent) {
  if (tooltip && !tooltip.contains(e.target as Node)) {
    removeTooltip()
  }
}

function removeTooltip() {
  if (tooltip) {
    tooltip.remove()
    tooltip = null
    document.removeEventListener('click', handleOutsideClick)
  }
  // Clear saved position
  savedTooltipPosition = null
}

// Global audio element for Google TTS playback
let ttsAudio: HTMLAudioElement | null = null

// Play audio from Google Translate TTS URL
function playGoogleTTSAudio(audioUrl: string): Promise<void> {
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

// Show TTS error as a temporary toast notification
function showTTSError(message: string) {
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

console.log('Vocabulary Builder content script loaded')
