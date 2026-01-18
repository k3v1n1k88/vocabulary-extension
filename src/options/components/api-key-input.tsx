import type { LLMProvider } from '@/types'

interface TestResult {
  status: 'idle' | 'testing' | 'success' | 'error'
  message?: string
}

interface ApiKeyInputProps {
  provider: { id: LLMProvider; name: string; registerUrl: string }
  currentKeyState: { value: string; saved: boolean }
  onKeyChange: (value: string) => void
  testResult: TestResult | null
  onTest: () => Promise<void>
  onSave: () => Promise<void>
  onClear: () => void
  onFocus: () => void
  onBlur: () => void
}

export function ApiKeyInput({
  provider,
  currentKeyState,
  onKeyChange,
  testResult,
  onTest,
  onSave,
  onClear,
  onFocus,
  onBlur
}: ApiKeyInputProps) {
  return (
    <div id="settings-apikey" className="border-t border-gray-100 pt-4">
      <label className="text-sm font-medium text-gray-700 mb-2 block">
        {provider.name} API Key
      </label>

      {/* Privacy notice */}
      <div className="flex items-start gap-2 p-3 mb-3 bg-green-50 border border-green-200 rounded-lg">
        <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <div className="text-sm">
          <p className="text-green-800 font-medium">🔒 Your API key is private</p>
          <p className="text-green-700 mt-1">
            Keys are stored locally in your browser only. We never send or store your API key on any server.
          </p>
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-3">
        Get your key from{' '}
        <a
          href={provider.registerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-500 hover:underline"
        >
          {provider.name} Console
        </a>
      </p>

      <div className="flex gap-2">
        <input
          type={currentKeyState.saved ? 'text' : 'password'}
          value={currentKeyState.value}
          onChange={(e) => onKeyChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={provider.id === 'openai' ? 'sk-...' : 'Enter API key...'}
          className="flex-1 max-w-md px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm font-mono"
        />
        <button
          onClick={onTest}
          disabled={!currentKeyState.value || currentKeyState.value.startsWith('••••') || testResult?.status === 'testing'}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {testResult?.status === 'testing' ? 'Testing...' : 'Test'}
        </button>
        {currentKeyState.saved ? (
          <button
            onClick={onClear}
            className="px-4 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
          >
            Clear
          </button>
        ) : (
          <button
            onClick={onSave}
            disabled={!currentKeyState.value || testResult?.status === 'testing'}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testResult?.status === 'testing' ? 'Verifying...' : 'Save'}
          </button>
        )}
      </div>

      {/* Status messages */}
      {testResult?.status === 'success' && (
        <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {testResult.message}
        </p>
      )}
      {testResult?.status === 'error' && (
        <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
          {testResult.message}
        </p>
      )}
      {currentKeyState.saved && testResult?.status === 'idle' && (
        <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          API key saved securely
        </p>
      )}
      {!currentKeyState.saved && !currentKeyState.value && (
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800 flex items-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            No API key configured for {provider.name}.{' '}
            <a
              href={provider.registerUrl}
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
  )
}
