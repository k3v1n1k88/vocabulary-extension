/**
 * AI Translation Toggle Component
 * Feature card for enabling/disabling AI-powered translations.
 */

import { AiRobotIcon } from '@/shared/components'

interface AiTranslationToggleProps {
  enabled: boolean
  onToggle: () => void
}

/**
 * Toggle card for AI translation feature.
 */
export function AiTranslationToggle({ enabled, onToggle }: AiTranslationToggleProps) {
  return (
    <div
      id="settings-ai-translation"
      className={`rounded-xl p-4 border-2 transition-all ${
        enabled
          ? 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200'
          : 'bg-gray-50 border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* AI Icon */}
          <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${
            enabled
              ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white'
              : 'bg-gray-200 text-gray-500'
          }`}>
            <AiRobotIcon width={20} height={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`font-semibold ${enabled ? 'text-purple-900' : 'text-gray-700'}`}>
                AI Translation
              </span>
              {enabled ? (
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-purple-600 text-white rounded-full">
                  ENABLED
                </span>
              ) : (
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-gray-400 text-white rounded-full">
                  OFF
                </span>
              )}
            </div>
            <p className={`text-sm mt-0.5 ${enabled ? 'text-purple-700' : 'text-gray-500'}`}>
              {enabled ? 'High-quality AI-powered translations' : 'Click to enable AI translations'}
            </p>
          </div>
        </div>
        {/* Toggle Switch */}
        <button
          type="button"
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer ${
            enabled
              ? 'bg-gradient-to-r from-purple-500 to-indigo-600'
              : 'bg-gray-300'
          }`}
          onClick={onToggle}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
              enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
      {!enabled && (
        <p className="text-xs text-gray-400 mt-2 pl-[52px]">
          Currently using free translation API with basic quality
        </p>
      )}
    </div>
  )
}
