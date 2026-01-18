/**
 * Keyboard Shortcuts Module
 * Manages keyboard shortcut settings and event handling.
 */

// Cached shortcut settings
let lookupShortcutEnabled = false
let lookupShortcut = ''

// Modifier key tracking for single-modifier shortcuts
let modifierPressed: string | null = null
let modifierUsed = false

// Callback for shortcut trigger
let onShortcutTriggered: (() => void) | null = null

/**
 * Initialize keyboard shortcut settings and listeners.
 */
export function initKeyboardShortcuts(callback: () => void): void {
  onShortcutTriggered = callback

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

  // Keyboard shortcut listeners
  document.addEventListener('keydown', handleKeydown)
  document.addEventListener('keyup', handleKeyup)
}

/**
 * Check if shortcut mode is enabled.
 */
export function isShortcutModeEnabled(): boolean {
  return lookupShortcutEnabled
}

/**
 * Check if shortcut is a single modifier key.
 */
function isSingleModifier(shortcut: string): boolean {
  return ['ALT', 'CTRL', 'SHIFT'].includes(shortcut.toUpperCase())
}

/**
 * Parse shortcut string to check against event.
 */
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

/**
 * Handle keydown event for shortcuts.
 */
function handleKeydown(e: KeyboardEvent): void {
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
    onShortcutTriggered?.()
  }
}

/**
 * Handle keyup event for single-modifier shortcuts.
 */
function handleKeyup(e: KeyboardEvent): void {
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
      onShortcutTriggered?.()
    }
  }
  modifierPressed = null
  modifierUsed = false
}
