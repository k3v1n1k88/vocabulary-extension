/**
 * Custom hook for handling retranslation with language changes.
 */

import { useState } from 'react'
import type { PdfLookupResult, TranslationResult } from '@/types'
import { SUPPORTED_LANGUAGES } from '@/types'

interface UseRetranslateParams {
  result: PdfLookupResult | null
  useLLMTranslation: boolean
  sourceLang: string
  targetLang: string
  setResult: (result: PdfLookupResult) => void
  setSourceLang: (lang: string) => void
  setTargetLang: (lang: string) => void
}

interface UseRetranslateReturn {
  isRetranslating: boolean
  retranslateError: string | null
  handleSourceLangChange: (newLang: string) => void
  handleTargetLangChange: (newLang: string) => void
}

/**
 * Get original text from result for retranslation.
 */
function getOriginalText(result: PdfLookupResult | null): string | null {
  if (!result) return null
  if (result.type === 'word') return result.data.word
  if (result.type === 'translation') return result.data.originalText
  return null
}

/**
 * Get language name from code.
 */
function getLangName(code: string): string {
  return SUPPORTED_LANGUAGES.find(l => l.code === code)?.name || code
}

export function useRetranslate({
  result,
  useLLMTranslation,
  sourceLang,
  targetLang,
  setResult,
  setSourceLang,
  setTargetLang
}: UseRetranslateParams): UseRetranslateReturn {
  const [isRetranslating, setIsRetranslating] = useState(false)
  const [retranslateError, setRetranslateError] = useState<string | null>(null)

  const handleRetranslate = async (newSourceLang: string, newTargetLang: string) => {
    const originalText = getOriginalText(result)
    if (!originalText) return

    setIsRetranslating(true)
    setRetranslateError(null)

    try {
      if (useLLMTranslation) {
        // AI mode: use TRANSLATE_TEXT with target language
        const response = await chrome.runtime.sendMessage({
          type: 'TRANSLATE_TEXT',
          payload: { text: originalText, targetLanguage: newTargetLang }
        })

        if (response?.success && response.data) {
          const newResult: PdfLookupResult = {
            type: 'translation',
            timestamp: Date.now(),
            data: response.data as TranslationResult
          }
          setResult(newResult)
          await chrome.storage.session.set({ pdfLookupResult: newResult })
        } else if (response?.error) {
          setRetranslateError(response.error)
        }
      } else {
        // Free API mode: use TRANSLATE_SWAP for language swap
        const response = await chrome.runtime.sendMessage({
          type: 'TRANSLATE_SWAP',
          payload: {
            text: originalText,
            sourceLangCode: newSourceLang,
            targetLangCode: newTargetLang
          }
        })

        if (response?.translatedText) {
          const newResult: PdfLookupResult = {
            type: 'translation',
            timestamp: Date.now(),
            data: {
              originalText,
              translatedText: response.translatedText,
              sourceLanguage: getLangName(newSourceLang),
              targetLanguage: getLangName(newTargetLang),
              sourceLangCode: newSourceLang,
              targetLangCode: newTargetLang,
              isPhrase: originalText.trim().includes(' '),
              isFreeTranslation: true
            }
          }
          setResult(newResult)
          await chrome.storage.session.set({ pdfLookupResult: newResult })
        } else if (response?.error) {
          setRetranslateError(response.error)
        }
      }
    } catch (error) {
      console.error('[VocabExt] Retranslate failed:', error)
      setRetranslateError(error instanceof Error ? error.message : 'Translation failed')
    } finally {
      setIsRetranslating(false)
    }
  }

  const handleSourceLangChange = (newLang: string) => {
    setSourceLang(newLang)
    handleRetranslate(newLang, targetLang)
  }

  const handleTargetLangChange = (newLang: string) => {
    setTargetLang(newLang)
    handleRetranslate(sourceLang, newLang)
  }

  return {
    isRetranslating,
    retranslateError,
    handleSourceLangChange,
    handleTargetLangChange
  }
}
