# Phase 03: Settings UI Updates

## Context Links

- Parent: [plan.md](./plan.md)
- Depends on: [Phase 01](./phase-01-types-and-config.md), [Phase 02](./phase-02-translation-service-refactor.md)

## Overview

- **Priority:** P1
- **Status:** Pending
- **Description:** Update Options.tsx settings page with provider dropdown and dynamic API key management

## Key Insights

1. Current UI has single OpenAI API key input
2. Need provider dropdown that changes:
   - Which API key input is shown
   - Registration link URL and text
3. Must load/save correct API key per provider
4. Add model selection dropdown per provider (validated)
5. Add Test button to verify API key works (validated)
6. Prompt for missing API key when switching providers (validated)

## Requirements

### Functional
- Provider dropdown: OpenAI | Google Gemini | xAI Grok
- Model dropdown per provider (from `ProviderConfig.models[]`)
- API key input for selected provider only
- Test button to verify API key works before saving
- Dynamic registration link per provider
- Prompt inline when switching to provider with no API key
- Persist provider selection and selected model in settings

### Non-functional
- Smooth transition when switching providers
- Mask saved API keys with dots
- Show test result feedback (success/error)

## Architecture

```
┌─────────────────────────────────────────────────┐
│ Translation Settings                             │
├─────────────────────────────────────────────────┤
│ Translation Language: [Vietnamese ▼]            │
├─────────────────────────────────────────────────┤
│ LLM Provider: [OpenAI ▼]                        │
├─────────────────────────────────────────────────┤
│ Model: [gpt-4o-mini ▼]                          │
├─────────────────────────────────────────────────┤
│ OpenAI API Key                                  │
│ Required for translating phrases. Get your key  │
│ from [OpenAI Platform →]                        │
│ [sk-••••••••••••xxxx    ] [Test] [Clear]       │
│ ✓ API key saved securely                       │
├─────────────────────────────────────────────────┤
│ ⚠ No API key for this provider                 │
│ [Enter API key to use Gemini →]                │
├─────────────────────────────────────────────────┤
│ ℹ How translation works                        │
│ • Single word → Dictionary lookup (Free)       │
│ • Multiple words → LLM translation (API key)   │
└─────────────────────────────────────────────────┘
```

## Related Code Files

| File | Action | Description |
|------|--------|-------------|
| `src/options/Options.tsx` | Modify | Add provider dropdown, dynamic API key UI |

## Implementation Steps

### Step 1: Add imports and state

At top of `SettingsContent` function, add:

```typescript
import { LLM_PROVIDERS, getProviderConfig } from '@/shared/llm-provider-config'
import { testConnection } from '@/shared/translation-service'
import type { LLMProvider } from '@/types'

function SettingsContent() {
  const { settings, updateSettings } = useSettingsStore()
  // ... existing state

  // Add new state for provider-specific API keys
  const [providerApiKeys, setProviderApiKeys] = useState<Record<LLMProvider, { value: string; saved: boolean }>>({
    openai: { value: '', saved: false },
    gemini: { value: '', saved: false },
    grok: { value: '', saved: false }
  })

  // Test connection state
  const [testResult, setTestResult] = useState<{ status: 'idle' | 'testing' | 'success' | 'error'; message?: string }>({ status: 'idle' })
```

### Step 2: Update useEffect to load all API keys

Replace existing API key loading:

```typescript
useEffect(() => {
  // Load API keys for all providers
  LLM_PROVIDERS.forEach(provider => {
    chrome.storage.local.get([provider.apiKeyStorageKey], (result) => {
      const key = result[provider.apiKeyStorageKey]
      if (key) {
        setProviderApiKeys(prev => ({
          ...prev,
          [provider.id]: {
            value: '••••••••••••••••••••' + key.slice(-4),
            saved: true
          }
        }))
      }
    })
  })
}, [])
```

### Step 3: Add handler functions

```typescript
const currentProvider = getProviderConfig(settings.llmProvider || 'openai')
const currentKeyState = providerApiKeys[currentProvider.id]

const handleSaveProviderApiKey = async () => {
  const keyValue = currentKeyState.value
  if (keyValue && !keyValue.startsWith('••••')) {
    await saveApiKey(keyValue, currentProvider.id)
    setProviderApiKeys(prev => ({
      ...prev,
      [currentProvider.id]: {
        value: '••••••••••••••••••••' + keyValue.slice(-4),
        saved: true
      }
    }))
    setTestResult({ status: 'idle' })
  }
}

const handleClearProviderApiKey = async () => {
  await chrome.storage.local.remove(currentProvider.apiKeyStorageKey)
  setProviderApiKeys(prev => ({
    ...prev,
    [currentProvider.id]: { value: '', saved: false }
  }))
  setTestResult({ status: 'idle' })
}

const handleApiKeyChange = (value: string) => {
  setProviderApiKeys(prev => ({
    ...prev,
    [currentProvider.id]: { value, saved: false }
  }))
  setTestResult({ status: 'idle' })
}

// Test API key connection
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

// Model selection handler
const handleModelChange = (model: string) => {
  updateSettings({ llmModel: model })
}
```

### Step 4: Update JSX in Translation Settings section

Replace the existing "OpenAI API Key" section with:

```tsx
{/* Translation Settings */}
<section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
  <h2 className="text-lg font-semibold text-gray-800 mb-4">Translation Settings</h2>

  <div className="space-y-4">
    {/* Target Language - existing */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Translation Language
      </label>
      <p className="text-sm text-gray-500 mb-3">
        Choose your preferred language for translations
      </p>
      <select
        value={settings.targetLanguage}
        onChange={(e) => updateSettings({ targetLanguage: e.target.value })}
        className="w-full max-w-xs px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.nativeName} ({lang.name})
          </option>
        ))}
      </select>
    </div>

    {/* LLM Provider Dropdown - NEW */}
    <div className="border-t border-gray-100 pt-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        LLM Provider
      </label>
      <p className="text-sm text-gray-500 mb-3">
        Choose AI provider for translations
      </p>
      <select
        value={settings.llmProvider || 'openai'}
        onChange={(e) => updateSettings({ llmProvider: e.target.value as LLMProvider })}
        className="w-full max-w-xs px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      >
        {LLM_PROVIDERS.map((provider) => (
          <option key={provider.id} value={provider.id}>
            {provider.name}
          </option>
        ))}
      </select>
    </div>

    {/* Model Dropdown - NEW (per validation) */}
    <div className="border-t border-gray-100 pt-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Model
      </label>
      <p className="text-sm text-gray-500 mb-3">
        Select model for {currentProvider.name}
      </p>
      <select
        value={settings.llmModel || currentProvider.defaultModel}
        onChange={(e) => handleModelChange(e.target.value)}
        className="w-full max-w-xs px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      >
        {currentProvider.models.map((model) => (
          <option key={model} value={model}>
            {model}{model === currentProvider.defaultModel ? ' (default)' : ''}
          </option>
        ))}
      </select>
    </div>

    {/* Dynamic API Key Input - NEW */}
    <div className="border-t border-gray-100 pt-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {currentProvider.name} API Key
      </label>
      <p className="text-sm text-gray-500 mb-3">
        Required for translating phrases. Get your key from{' '}
        <a
          href={currentProvider.registerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-500 hover:underline"
        >
          {currentProvider.name} Console
        </a>
      </p>
      <div className="flex gap-2">
        <input
          type={currentKeyState.saved ? 'text' : 'password'}
          value={currentKeyState.value}
          onChange={(e) => handleApiKeyChange(e.target.value)}
          placeholder={currentProvider.id === 'openai' ? 'sk-...' : 'Enter API key...'}
          className="flex-1 max-w-md px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm font-mono"
        />
        {/* Test Button - NEW (per validation) */}
        <button
          onClick={handleTestConnection}
          disabled={!currentKeyState.value || currentKeyState.value.startsWith('••••') || testResult.status === 'testing'}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {testResult.status === 'testing' ? 'Testing...' : 'Test'}
        </button>
        {currentKeyState.saved ? (
          <button
            onClick={handleClearProviderApiKey}
            className="px-4 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
          >
            Clear
          </button>
        ) : (
          <button
            onClick={handleSaveProviderApiKey}
            disabled={!currentKeyState.value}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
        )}
      </div>
      {/* Test Result Feedback - NEW */}
      {testResult.status === 'success' && (
        <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {testResult.message}
        </p>
      )}
      {testResult.status === 'error' && (
        <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
          {testResult.message}
        </p>
      )}
      {currentKeyState.saved && (
        <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          API key saved securely
        </p>
      )}
      {/* Missing API Key Prompt - NEW (per validation) */}
      {!currentKeyState.saved && !currentKeyState.value && (
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800 flex items-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            No API key configured for {currentProvider.name}.{' '}
            <a
              href={currentProvider.registerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-900 underline font-medium"
            >
              Get one here
            </a>
          </p>
        </div>
      )}
    </div>

    {/* Info box - updated */}
    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
      <h4 className="font-medium text-blue-800 text-sm mb-1">How translation works</h4>
      <ul className="text-sm text-blue-700 space-y-1">
        <li>• <strong>Single word</strong> → Dictionary lookup (Free)</li>
        <li>• <strong>Multiple words</strong> → {currentProvider.name} translation (Requires API key)</li>
      </ul>
    </div>
  </div>
</section>
```

### Step 5: Clean up old state variables

Remove old state that's replaced:
```typescript
// REMOVE these:
const [apiKey, setApiKey] = useState('')
const [apiKeySaved, setApiKeySaved] = useState(false)
// And their handlers: handleSaveApiKey, handleClearApiKey
```

## Todo List

- [ ] Add imports for `LLM_PROVIDERS`, `getProviderConfig`, `LLMProvider`, `testConnection`
- [ ] Add `providerApiKeys` state and `testResult` state
- [ ] Update useEffect to load all provider keys
- [ ] Add handler functions for provider-specific API key management
- [ ] Add `handleTestConnection` and `handleModelChange` handlers
- [ ] Replace Translation Settings JSX with new provider dropdown UI
- [ ] Add model dropdown per provider
- [ ] Add Test button with feedback display
- [ ] Add missing API key inline prompt
- [ ] Remove old apiKey state and handlers
- [ ] Update UserSettings type with `llmModel` field
- [ ] Build and test UI

## Success Criteria

1. Provider dropdown shows all 3 providers
2. Model dropdown shows models for selected provider
3. Switching provider shows correct API key state
4. Test button validates API key and shows result
5. Missing API key prompt appears when no key for provider
6. API key for each provider saved/loaded independently
7. Registration link changes per provider
8. Existing OpenAI users see their key preserved

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| State management complexity | Medium | Single state object for all keys |
| UI flicker on provider switch | Low | Keys pre-loaded on mount |

## Security Considerations

- API keys masked after save
- Keys stored separately in chrome.storage
- No cross-provider key exposure

## Next Steps

After all phases complete:
1. `npm run build`
2. Manual test all 3 providers
3. Code review
4. Commit
