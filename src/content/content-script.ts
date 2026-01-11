import type { Word, TranslationResult } from '@/types'
import { SUPPORTED_LANGUAGES } from '@/types'

// Element references
let tooltip: HTMLDivElement | null = null
let floatingButton: HTMLDivElement | null = null

// Store absolute position for tooltip positioning after menu click
let savedTooltipPosition: { left: number; top: number } | null = null

// Cached target language for floating menu display
let cachedTargetLanguage = 'Vietnamese'

// Load target language from storage
chrome.storage.local.get('settings-storage', (result) => {
  if (result['settings-storage']) {
    try {
      const parsed = JSON.parse(result['settings-storage'])
      const langCode = parsed.state?.settings?.targetLanguage || parsed.state?.targetLanguage || 'vi'
      const lang = SUPPORTED_LANGUAGES.find(l => l.code === langCode)
      if (lang) {
        cachedTargetLanguage = lang.name
      }
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
      const langCode = parsed.state?.settings?.targetLanguage || parsed.state?.targetLanguage || 'vi'
      const lang = SUPPORTED_LANGUAGES.find(l => l.code === langCode)
      if (lang) {
        cachedTargetLanguage = lang.name
      }
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
      // Ensure nested structure exists
      if (!stored.state) stored.state = {}
      if (!stored.state.settings) stored.state.settings = {}
      stored.state.settings.targetLanguage = langCode
      chrome.storage.local.set({ 'settings-storage': JSON.stringify(stored) })
    } catch (e) {
      console.warn('[VocabExt] Failed to save target language:', e)
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

  // Build language options HTML
  const langOptionsHtml = SUPPORTED_LANGUAGES.map(lang =>
    `<div class="vocab-lang-option${lang.name === cachedTargetLanguage ? ' active' : ''}" data-lang-code="${lang.code}" data-lang-name="${lang.name}">${lang.nativeName} (${lang.name})</div>`
  ).join('')

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
      </div>
      <div class="vocab-menu-item" data-action="speak" title="Speak">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 5L6 9H2v6h4l5 4V5z"/>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
        </svg>
      </div>
      ${isPhrase ? `
      <div class="vocab-menu-divider"></div>
      <div class="vocab-menu-item vocab-lang-trigger" data-action="change-lang" title="Change language">
        <span class="vocab-lang-short">${cachedTargetLanguage.slice(0, 2).toUpperCase()}</span>
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M6 9l6 6 6-6"/></svg>
      </div>
      ` : ''}
    </div>
    ${isPhrase ? `<div class="vocab-lang-dropdown" style="display:none;">${langOptionsHtml}</div>` : ''}
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

  // Handle menu clicks - use captured selectedText directly
  floatingButton.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    const clickedEl = e.target as HTMLElement

    // Check if clicked on language trigger or its children
    const langTrigger = clickedEl.closest('.vocab-lang-trigger')
    if (langTrigger) {
      const dropdown = floatingButton?.querySelector('.vocab-lang-dropdown') as HTMLElement
      if (dropdown) {
        const isVisible = dropdown.style.display !== 'none'
        dropdown.style.display = isVisible ? 'none' : 'block'
      }
      return
    }

    // Check if clicked on a language option
    const langOption = clickedEl.closest('.vocab-lang-option') as HTMLElement
    if (langOption) {
      const langCode = langOption.dataset.langCode
      const langName = langOption.dataset.langName
      if (langCode && langName) {
        // Update cached language
        cachedTargetLanguage = langName
        // Save to storage
        saveTargetLanguage(langCode)
        // Update UI
        const trigger = floatingButton?.querySelector('.vocab-lang-trigger')
        if (trigger) {
          trigger.innerHTML = `${langName} <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M6 9l6 6 6-6"/></svg>`
        }
        // Update active state
        floatingButton?.querySelectorAll('.vocab-lang-option').forEach(opt => opt.classList.remove('active'))
        langOption.classList.add('active')
        // Hide dropdown
        const dropdown = floatingButton?.querySelector('.vocab-lang-dropdown') as HTMLElement
        if (dropdown) dropdown.style.display = 'none'
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
      } catch (e) {
        console.warn('[VocabExt] Extension context invalidated, please refresh page')
      }
    } else if (action === 'speak') {
      try {
        chrome.runtime.sendMessage({
          type: 'PLAY_AUDIO',
          payload: { text: selectedText }
        })
      } catch (e) {
        console.warn('[VocabExt] Extension context invalidated, please refresh page')
      }
      removeFloatingButton()
    }
  })

  document.body.appendChild(floatingButton)
  console.log('[VocabExt] Floating menu appended to body, style:', floatingButton.style.cssText)
}

function removeFloatingButton() {
  // Remove click listener to prevent memory leaks
  document.removeEventListener('click', handleOutsideClick)

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
    if (!selection || selection.rangeCount === 0) return
    const rect = selection.getRangeAt(0).getBoundingClientRect()
    left = rect.left + window.scrollX
    top = rect.bottom + window.scrollY + 10
  }

  // Save position for subsequent updates
  savedTooltipPosition = { left, top }

  const maxWidth = window.innerWidth >= 1200 ? 500 : 450
  if (left + maxWidth > window.innerWidth) {
    left = Math.max(10, window.innerWidth - maxWidth - 20)
  }

  tooltip = document.createElement('div')
  tooltip.id = 'vocabulary-tooltip'
  tooltip.innerHTML = `
    <div class="vocab-tooltip-content">
      <div class="vocab-header">
        <div class="vocab-word-row">
          <span class="vocab-word">${isPhrase ? text.substring(0, 50) + (text.length > 50 ? '...' : '') : text}</span>
          <span class="vocab-type-badge">${isPhrase ? 'Translating...' : 'Looking up...'}</span>
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
    if (!selection || selection.rangeCount === 0) return
    const rect = selection.getRangeAt(0).getBoundingClientRect()
    left = rect.left + window.scrollX
    top = rect.bottom + window.scrollY + 10
    console.log('[VocabExt] Calculated from selection:', left, top)
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
        ${word.synonyms.map((s) => `<span class="vocab-tag vocab-tag-syn">${s}</span>`).join('')}
       </div>`
    : ''

  const antonymsHTML = word.antonyms?.length
    ? `<div class="vocab-antonyms">
        <span class="vocab-label">Antonyms:</span>
        ${word.antonyms.map((a) => `<span class="vocab-tag vocab-tag-ant">${a}</span>`).join('')}
       </div>`
    : ''

  const exampleHTML = word.examples?.[0]
    ? `<div class="vocab-example">
        <span class="vocab-label">Example:</span>
        <em>"${word.examples[0]}"</em>
       </div>`
    : ''

  const translationHTML = word.vietnameseTranslation
    ? `<div class="vocab-vietnamese">
        <span class="vocab-label">Translation:</span>
        ${word.vietnameseTranslation}
       </div>`
    : ''

  return `
    <div class="vocab-tooltip-content">
      <div class="vocab-header">
        <div class="vocab-word-row">
          <span class="vocab-word">${word.word}</span>
          <button class="vocab-audio-btn" data-word="${word.word}" title="Play pronunciation">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 5L6 9H2v6h4l5 4V5z"/>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
            </svg>
          </button>
        </div>
        ${word.pronunciation ? `<span class="vocab-pronunciation">${word.pronunciation}</span>` : ''}
        ${word.partOfSpeech ? `<span class="vocab-pos">${word.partOfSpeech}</span>` : ''}
      </div>

      <div class="vocab-definition">
        <span class="vocab-label">Definition:</span>
        ${word.definition}
      </div>

      ${translationHTML}
      ${exampleHTML}
      ${synonymsHTML}
      ${antonymsHTML}

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
    if (!selection || selection.rangeCount === 0) return
    const rect = selection.getRangeAt(0).getBoundingClientRect()
    left = rect.left + window.scrollX
    top = rect.bottom + window.scrollY + 10
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

  // Build language options HTML
  const langOptionsHtml = SUPPORTED_LANGUAGES.map(lang =>
    `<div class="vocab-lang-option${lang.name === cachedTargetLanguage ? ' active' : ''}" data-lang-code="${lang.code}" data-lang-name="${lang.name}">${lang.nativeName}</div>`
  ).join('')

  return `
    <div class="vocab-tooltip-content vocab-translation">
      <div class="vocab-header">
        <div class="vocab-word-row">
          <span class="vocab-word">${translation.originalText}</span>
          <span class="vocab-type-badge">${typeLabel}</span>
        </div>
        <span class="vocab-lang-info">
          ${translation.sourceLanguage} →
          <span class="vocab-target-lang-trigger">${translation.targetLanguage} <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M6 9l6 6 6-6"/></svg></span>
          <div class="vocab-target-lang-dropdown" style="display:none;">${langOptionsHtml}</div>
        </span>
      </div>

      <div class="vocab-translation-result">
        <span class="vocab-label">Translation:</span>
        <div class="vocab-translated-text">${translation.translatedText.replace(/\n/g, '<br>')}</div>
      </div>

      <div class="vocab-actions">
        <button class="vocab-copy-btn" title="Copy translation">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          Copy
        </button>
        <button class="vocab-audio-btn" data-text="${translation.originalText}" title="Play pronunciation">
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

  // Audio button
  const audioBtn = tooltip.querySelector('.vocab-audio-btn')
  audioBtn?.addEventListener('click', (e) => {
    e.stopPropagation()
    chrome.runtime.sendMessage({
      type: 'PLAY_AUDIO',
      payload: { text: translation.originalText }
    })
  })

  // Language trigger - toggle dropdown
  const langTrigger = tooltip.querySelector('.vocab-target-lang-trigger')
  const langDropdown = tooltip.querySelector('.vocab-target-lang-dropdown') as HTMLElement
  langTrigger?.addEventListener('click', (e) => {
    e.stopPropagation()
    if (langDropdown) {
      langDropdown.style.display = langDropdown.style.display === 'none' ? 'block' : 'none'
    }
  })

  // Language options - select and re-translate
  tooltip.querySelectorAll('.vocab-lang-option').forEach(option => {
    option.addEventListener('click', (e) => {
      e.stopPropagation()
      const langCode = (option as HTMLElement).dataset.langCode
      const langName = (option as HTMLElement).dataset.langName
      if (langCode && langName) {
        // Update cached language
        cachedTargetLanguage = langName
        // Save to storage
        saveTargetLanguage(langCode)
        // Hide dropdown
        if (langDropdown) langDropdown.style.display = 'none'
        // Show loading and re-translate with explicit target language
        showLoadingTooltip(translation.originalText, translation.isPhrase)
        chrome.runtime.sendMessage({
          type: 'TRANSLATE_TEXT',
          payload: { text: translation.originalText, targetLanguage: langName }
        }, (response) => {
          if (response?.success && response.data) {
            updateTooltipWithTranslation(response.data)
          }
        })
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
    if (!selection || selection.rangeCount === 0) return
    const rect = selection.getRangeAt(0).getBoundingClientRect()
    left = rect.left + window.scrollX
    top = rect.bottom + window.scrollY + 10
  }

  tooltip = document.createElement('div')
  tooltip.id = 'vocabulary-tooltip'
  tooltip.innerHTML = `
    <div class="vocab-tooltip-content vocab-error">
      <p>${message}</p>
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

  // Auto-remove after 3 seconds
  setTimeout(removeTooltip, 3000)
}

function setupTooltipEventListeners(word: Word) {
  if (!tooltip) return

  // Audio button
  const audioBtn = tooltip.querySelector('.vocab-audio-btn')
  audioBtn?.addEventListener('click', (e) => {
    e.stopPropagation()
    chrome.runtime.sendMessage({
      type: 'PLAY_AUDIO',
      payload: { text: word.word, audioUrl: word.audioUrl }
    })
  })

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

console.log('Vocabulary Builder content script loaded')
