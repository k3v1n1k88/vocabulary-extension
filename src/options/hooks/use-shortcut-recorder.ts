/**
 * Shortcut Recorder Hook
 * Captures keyboard shortcuts for the lookup feature.
 */

import { useState, useEffect } from 'react'

interface UseShortcutRecorderReturn {
  isRecordingShortcut: boolean
  startRecording: () => void
  stopRecording: () => void
}

/**
 * Hook for recording keyboard shortcuts.
 * @param onShortcutCapture - Callback when a valid shortcut is captured
 */
export function useShortcutRecorder(
  onShortcutCapture: (shortcut: string) => void
): UseShortcutRecorderReturn {
  const [isRecordingShortcut, setIsRecordingShortcut] = useState(false)

  useEffect(() => {
    if (!isRecordingShortcut) return

    let lastModifier: string | null = null

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const key = e.key.toUpperCase()

      // Track modifier-only presses
      if (key === 'ALT' || key === 'META') {
        lastModifier = 'Alt'
        return
      }
      if (key === 'CONTROL') {
        lastModifier = 'Ctrl'
        return
      }
      if (key === 'SHIFT') {
        lastModifier = 'Shift'
        return
      }

      lastModifier = null
      const parts: string[] = []

      // Build modifier combination
      if (e.ctrlKey || e.metaKey) parts.push('Ctrl')
      if (e.altKey) parts.push('Alt')
      if (e.shiftKey) parts.push('Shift')

      // Add the key
      const isFunctionKey = /^F\d+$/.test(key)
      const keyName = key.length === 1 ? key : e.code.replace('Key', '').replace('Digit', '')
      parts.push(keyName)

      // Validate: need at least modifier+key or function key
      const isValid = parts.length >= 2 || isFunctionKey
      if (isValid) {
        onShortcutCapture(parts.join('+'))
        setIsRecordingShortcut(false)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase()
      // Allow single modifier as shortcut
      if (lastModifier && ['ALT', 'CONTROL', 'SHIFT', 'META'].includes(key)) {
        onShortcutCapture(lastModifier)
        setIsRecordingShortcut(false)
        lastModifier = null
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [isRecordingShortcut, onShortcutCapture])

  return {
    isRecordingShortcut,
    startRecording: () => setIsRecordingShortcut(true),
    stopRecording: () => setIsRecordingShortcut(false)
  }
}
