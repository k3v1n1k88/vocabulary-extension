/**
 * Highlight Settings Component
 * Allows users to configure text highlight color.
 */

import { useState } from 'react'
import type { UserSettings } from '@/types'

// Preset highlight colors
const HIGHLIGHT_COLORS = [
  { value: '#ffeb3b', name: 'Yellow', class: 'bg-yellow-300' },
  { value: '#a5d6a7', name: 'Green', class: 'bg-green-300' },
  { value: '#90caf9', name: 'Blue', class: 'bg-blue-300' },
  { value: '#f48fb1', name: 'Pink', class: 'bg-pink-300' },
  { value: '#ffcc80', name: 'Orange', class: 'bg-orange-300' },
  { value: '#ce93d8', name: 'Purple', class: 'bg-purple-300' }
]

interface HighlightSettingsProps {
  settings: UserSettings
  onSettingsUpdate: (updates: Partial<UserSettings>) => void
}

export function HighlightSettings({
  settings,
  onSettingsUpdate
}: HighlightSettingsProps) {
  const currentColor = settings.highlightColor || '#ffeb3b'
  const [clearStatus, setClearStatus] = useState<string | null>(null)

  const handleClearAllHighlights = async () => {
    if (!confirm('Clear all saved highlights from all pages? This cannot be undone.')) {
      return
    }

    try {
      // Clear all highlights from storage
      await chrome.storage.local.remove('text-highlights')
      setClearStatus('All highlights cleared!')
      setTimeout(() => setClearStatus(null), 3000)
    } catch (error) {
      console.error('Failed to clear highlights:', error)
      setClearStatus('Failed to clear highlights')
      setTimeout(() => setClearStatus(null), 3000)
    }
  }

  return (
    <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Highlight Settings</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Highlight Color
          </label>
          <p className="text-sm text-gray-500 mb-3">
            Choose your preferred color for text highlighting
          </p>

          <div className="flex flex-wrap gap-3">
            {HIGHLIGHT_COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => onSettingsUpdate({ highlightColor: color.value })}
                className={`
                  w-10 h-10 rounded-lg border-2 transition-all
                  ${currentColor === color.value
                    ? 'border-gray-800 ring-2 ring-gray-400 ring-offset-2'
                    : 'border-gray-200 hover:border-gray-400'
                  }
                `}
                style={{ backgroundColor: color.value }}
                title={color.name}
                aria-label={`Select ${color.name} highlight color`}
              />
            ))}
          </div>

          {/* Custom color picker */}
          <div className="mt-4 flex items-center gap-3">
            <label className="text-sm text-gray-600">Custom color:</label>
            <input
              type="color"
              value={currentColor}
              onChange={(e) => onSettingsUpdate({ highlightColor: e.target.value })}
              className="w-10 h-10 rounded cursor-pointer border border-gray-200"
            />
            <span className="text-sm text-gray-500 font-mono">{currentColor}</span>
          </div>
        </div>

        {/* Preview */}
        <div className="border-t border-gray-100 pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preview
          </label>
          <p className="text-gray-700">
            This is how your{' '}
            <span
              style={{ backgroundColor: currentColor, borderRadius: '2px', padding: '0 4px' }}
            >
              highlighted text
            </span>{' '}
            will appear on web pages.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
          <h4 className="font-medium text-amber-800 text-sm mb-1">How to use highlights</h4>
          <ul className="text-sm text-amber-700 space-y-1">
            <li>• Select text and click the highlighter icon in the floating menu</li>
            <li>• Highlights persist and restore when you revisit the page</li>
            <li>• Hover over highlight and click × to remove, or double-click</li>
          </ul>
        </div>

        {/* Clear All Highlights */}
        <div className="border-t border-gray-100 pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Manage Highlights
          </label>
          <p className="text-sm text-gray-500 mb-3">
            Remove all saved highlights from all pages
          </p>
          <button
            onClick={handleClearAllHighlights}
            className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
          >
            Clear All Highlights
          </button>
          {clearStatus && (
            <p className={`mt-2 text-sm ${clearStatus.includes('Failed') ? 'text-red-600' : 'text-green-600'}`}>
              {clearStatus}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
