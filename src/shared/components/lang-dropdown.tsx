/**
 * Language Dropdown Component
 * Reusable dropdown for selecting source/target language.
 */

import { useState, useEffect, useRef } from 'react'
import { SUPPORTED_LANGUAGES } from '@/types'

interface LangDropdownProps {
  value: string
  onChange: (lang: string) => void
  disabled?: boolean
}

/**
 * Language dropdown with search and native name display.
 */
export function LangDropdown({
  value,
  onChange,
  disabled = false
}: LangDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Get language name from code
  const selectedLang = SUPPORTED_LANGUAGES.find(l => l.code === value)
  const displayName = selectedLang?.name || value

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleSelect = (langCode: string) => {
    onChange(langCode)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="inline-flex items-center gap-0.5 text-xs text-primary-600 font-medium cursor-pointer px-1.5 py-0.5 rounded hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {displayName}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="opacity-60">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-44 overflow-y-auto z-50 min-w-[120px]">
          {SUPPORTED_LANGUAGES.map(lang => (
            <button
              key={lang.code}
              type="button"
              onClick={() => handleSelect(lang.code)}
              className={`w-full px-3 py-1.5 text-left text-xs transition-colors ${
                lang.code === value
                  ? 'bg-primary-50 text-primary-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {lang.nativeName}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
