import { SUPPORTED_LANGUAGES } from '@/types'
import type { LLMProvider, UserSettings } from '@/types'
import { LLM_PROVIDERS, getProviderConfig } from '@/shared/llm-provider-config'
import { ApiKeyInput } from './api-key-input'
import { AiTranslationToggle } from './ai-translation-toggle'

interface TestResult {
  status: 'idle' | 'testing' | 'success' | 'error'
  message?: string
}

interface TranslationSettingsProps {
  settings: UserSettings
  onSettingsUpdate: (updates: Partial<UserSettings>) => void
  providerApiKeys: Record<LLMProvider, { value: string; saved: boolean }>
  onApiKeyChange: (value: string) => void
  testResult: TestResult | null
  onTestConnection: () => Promise<void>
  onSaveApiKey: () => Promise<void>
  onClearApiKey: () => void
  onApiKeyFocus: () => void
  onApiKeyBlur: () => void
  onProviderChange: (provider: LLMProvider) => void
}

export function TranslationSettings({
  settings,
  onSettingsUpdate,
  providerApiKeys,
  onApiKeyChange,
  testResult,
  onTestConnection,
  onSaveApiKey,
  onClearApiKey,
  onApiKeyFocus,
  onApiKeyBlur,
  onProviderChange
}: TranslationSettingsProps) {
  const currentProvider = getProviderConfig(settings.llmProvider || 'openai')
  const currentKeyState = providerApiKeys[currentProvider.id]

  return (
    <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Translation Settings</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Translation Language
          </label>
          <p className="text-sm text-gray-500 mb-3">
            Choose your preferred language for translations
          </p>
          <select
            value={settings.targetLanguage}
            onChange={(e) => onSettingsUpdate({ targetLanguage: e.target.value })}
            className="w-full max-w-xs px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.nativeName} ({lang.name})
              </option>
            ))}
          </select>
        </div>

        {/* AI Translation Toggle */}
        <AiTranslationToggle
          enabled={settings.useLLMTranslation !== false}
          onToggle={() => onSettingsUpdate({ useLLMTranslation: !(settings.useLLMTranslation !== false) })}
        />

        {/* LLM Provider Dropdown - only show when AI enabled */}
        {settings.useLLMTranslation !== false && (
          <div className="border-t border-gray-100 pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              LLM Provider
            </label>
            <p className="text-sm text-gray-500 mb-3">
              Choose AI provider for translations
            </p>
            <select
              value={settings.llmProvider || 'openai'}
              onChange={(e) => onProviderChange(e.target.value as LLMProvider)}
              className="w-full max-w-xs px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {LLM_PROVIDERS.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Model Dropdown - only show when AI enabled */}
        {settings.useLLMTranslation !== false && (
          <div className="border-t border-gray-100 pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model
            </label>
            <p className="text-sm text-gray-500 mb-3">
              Select model for {currentProvider.name}
            </p>
            <select
              value={settings.llmModel || currentProvider.defaultModel}
              onChange={(e) => onSettingsUpdate({ llmModel: e.target.value })}
              className="w-full max-w-md px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {currentProvider.models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.id} — {model.description}{model.id === currentProvider.defaultModel ? ' ★' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* API Key Input - only show when AI enabled */}
        {settings.useLLMTranslation !== false && (
          <ApiKeyInput
            provider={currentProvider}
            currentKeyState={currentKeyState}
            onKeyChange={onApiKeyChange}
            testResult={testResult}
            onTest={onTestConnection}
            onSave={onSaveApiKey}
            onClear={onClearApiKey}
            onFocus={onApiKeyFocus}
            onBlur={onApiKeyBlur}
          />
        )}

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 text-sm mb-1">How translation works</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>Single word</strong> → Dictionary lookup (Free)</li>
            <li>• <strong>Multiple words</strong> → {settings.useLLMTranslation !== false
              ? `${currentProvider.name} translation (Requires API key)`
              : 'Free translation API (no key required)'}</li>
          </ul>
        </div>
      </div>
    </section>
  )
}
