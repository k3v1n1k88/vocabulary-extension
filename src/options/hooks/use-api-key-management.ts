/**
 * API Key Management Hook
 * Handles loading, saving, testing API keys for LLM providers.
 */

import { useState, useEffect } from 'react'
import { testConnection } from '@/shared/translation-service'
import { LLM_PROVIDERS, getProviderConfig } from '@/shared/llm-provider-config'
import type { LLMProvider } from '@/types'

interface ApiKeyState {
  value: string
  saved: boolean
}

interface TestResult {
  status: 'idle' | 'testing' | 'success' | 'error'
  message?: string
}

export interface UseApiKeyManagementReturn {
  providerApiKeys: Record<LLMProvider, ApiKeyState>
  testResult: TestResult
  currentProvider: ReturnType<typeof getProviderConfig>
  currentKeyState: ApiKeyState
  handleApiKeyChange: (value: string) => void
  handleApiKeyFocus: () => void
  handleApiKeyBlur: () => void
  handleSaveApiKey: () => Promise<void>
  handleClearApiKey: () => Promise<void>
  handleTestConnection: () => Promise<void>
  handleProviderChange: (provider: LLMProvider, updateSettings: (updates: { llmProvider: LLMProvider }) => void) => void
}

/**
 * Create masked display value for saved API key.
 */
function maskApiKey(key: string): string {
  return '••••••••••••••••••••' + key.slice(-4)
}

export function useApiKeyManagement(currentProviderId: LLMProvider = 'openai'): UseApiKeyManagementReturn {
  const [providerApiKeys, setProviderApiKeys] = useState<Record<LLMProvider, ApiKeyState>>({
    openai: { value: '', saved: false },
    gemini: { value: '', saved: false },
    grok: { value: '', saved: false }
  })
  const [testResult, setTestResult] = useState<TestResult>({ status: 'idle' })

  const currentProvider = getProviderConfig(currentProviderId)
  const currentKeyState = providerApiKeys[currentProvider.id]

  // Load API keys for all providers on mount
  useEffect(() => {
    LLM_PROVIDERS.forEach(provider => {
      chrome.storage.local.get([provider.apiKeyStorageKey], (result) => {
        const key = result[provider.apiKeyStorageKey]
        if (key) {
          setProviderApiKeys(prev => ({
            ...prev,
            [provider.id]: { value: maskApiKey(key), saved: true }
          }))
        }
      })
    })
  }, [])

  const handleApiKeyChange = (value: string) => {
    // If user types while showing masked key, clear the mask and start fresh
    const currentValue = providerApiKeys[currentProvider.id].value
    const cleanValue = currentValue.startsWith('••••') ? value.replace(/^•+/, '') : value

    setProviderApiKeys(prev => ({
      ...prev,
      [currentProvider.id]: { value: cleanValue, saved: false }
    }))
    setTestResult({ status: 'idle' })
  }

  const handleApiKeyFocus = () => {
    // Clear masked value when user focuses to type new key
    if (currentKeyState.value.startsWith('••••')) {
      setProviderApiKeys(prev => ({
        ...prev,
        [currentProvider.id]: { value: '', saved: false }
      }))
      setTestResult({ status: 'idle' })
    }
  }

  const handleApiKeyBlur = () => {
    // Restore saved key if user leaves empty
    if (!currentKeyState.value && !currentKeyState.saved) {
      chrome.storage.local.get([currentProvider.apiKeyStorageKey], (result) => {
        const key = result[currentProvider.apiKeyStorageKey]
        if (key) {
          setProviderApiKeys(prev => ({
            ...prev,
            [currentProvider.id]: { value: maskApiKey(key), saved: true }
          }))
        }
      })
    }
  }

  const handleSaveApiKey = async () => {
    const keyValue = currentKeyState.value
    if (!keyValue || keyValue.startsWith('••••')) return

    // Test connection before saving
    setTestResult({ status: 'testing', message: 'Verifying API key...' })
    try {
      await testConnection(currentProvider.id, keyValue)
      // Test passed - save the key
      await chrome.storage.local.set({ [currentProvider.apiKeyStorageKey]: keyValue })
      setProviderApiKeys(prev => ({
        ...prev,
        [currentProvider.id]: { value: maskApiKey(keyValue), saved: true }
      }))
      setTestResult({ status: 'success', message: 'API key verified and saved!' })
    } catch (error) {
      setTestResult({
        status: 'error',
        message: error instanceof Error ? error.message : 'Connection failed - key not saved'
      })
    }
  }

  const handleClearApiKey = async () => {
    await chrome.storage.local.remove(currentProvider.apiKeyStorageKey)
    setProviderApiKeys(prev => ({
      ...prev,
      [currentProvider.id]: { value: '', saved: false }
    }))
    setTestResult({ status: 'idle' })
  }

  const handleTestConnection = async () => {
    const keyValue = currentKeyState.value
    if (!keyValue || keyValue.startsWith('••••')) {
      setTestResult({ status: 'error', message: 'Enter a new API key to test' })
      return
    }

    setTestResult({ status: 'testing' })
    try {
      await testConnection(currentProvider.id, keyValue)
      setTestResult({ status: 'success', message: 'Connection successful!' })
    } catch (error) {
      setTestResult({
        status: 'error',
        message: error instanceof Error ? error.message : 'Connection failed'
      })
    }
  }

  const handleProviderChange = (
    provider: LLMProvider,
    updateSettings: (updates: { llmProvider: LLMProvider }) => void
  ) => {
    updateSettings({ llmProvider: provider })
    setTestResult({ status: 'idle' })
  }

  return {
    providerApiKeys,
    testResult,
    currentProvider,
    currentKeyState,
    handleApiKeyChange,
    handleApiKeyFocus,
    handleApiKeyBlur,
    handleSaveApiKey,
    handleClearApiKey,
    handleTestConnection,
    handleProviderChange
  }
}
