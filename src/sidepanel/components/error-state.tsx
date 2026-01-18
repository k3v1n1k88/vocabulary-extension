import { ErrorIcon, WarningIcon, KeyIcon, SettingsIcon, AiRobotIcon } from '@/shared/components'

export interface ErrorStateProps {
  message: string
  onConfigureApiKey?: () => void
  onEnableAiMode?: () => void
}

/**
 * Get human-readable description for HTTP error codes
 */
function getErrorDescription(errorCode: string | null): string | null {
  if (!errorCode) return null
  const descriptions: Record<string, string> = {
    '400': 'Bad request. The API rejected the request format or parameters.',
    '401': 'Authentication failed. Your API key may be invalid or expired.',
    '403': 'Access denied. Your API key may lack required permissions.',
    '500': 'Server error. The API service is experiencing issues.',
    '502': 'Gateway error. The API service is temporarily unavailable.',
    '503': 'Service unavailable. The API service is overloaded or down.',
  }
  return descriptions[errorCode] || null
}

/**
 * Parse error message to extract provider name and clean message
 */
function parseErrorMessage(message: string): { provider?: string; cleanMessage: string } {
  // Extract provider from messages like "Google Gemini API key not configured"
  const providerMatch = message.match(/^(Google Gemini|OpenAI|Anthropic|xAI Grok|OpenRouter|Groq|Mistral)/i)
  const provider = providerMatch ? providerMatch[1] : undefined

  // Clean up the message
  let cleanMessage = message
    .replace(/^(Google Gemini|OpenAI|Anthropic|xAI Grok|OpenRouter|Groq|Mistral)\s*/i, '')
    .replace(/\.\s*Add your key in Settings or disable AI translation\.?/i, '')
    .replace(/API key not configured/i, 'API key is not configured')
    .trim()

  return { provider, cleanMessage }
}

/**
 * Error state component for SidePanel
 * Displays different error types with appropriate actions
 */
export function ErrorState({ message, onConfigureApiKey, onEnableAiMode }: ErrorStateProps) {
  // Check error type
  const lowerMessage = message.toLowerCase()
  const isQueryLengthError = message.includes('QUERY LENGTH LIMIT')
  const isApiKeyError = lowerMessage.includes('api key not configured') || lowerMessage.includes('key is required')
  const isApiError = lowerMessage.includes('api error') ||
    message.includes(': 400') || message.includes(': 401') || message.includes(': 500')

  // Parse error for cleaner display
  const { provider } = parseErrorMessage(message)

  // Query length limit error (amber/warning theme)
  if (isQueryLengthError) {
    return (
      <div className="m-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center w-9 h-9 bg-amber-100 rounded-full text-amber-600 flex-shrink-0">
            <WarningIcon />
          </div>
          <span className="text-sm font-semibold text-amber-700">Text Too Long</span>
        </div>
        <div className="mb-3 p-3 bg-white border border-amber-100 rounded-lg">
          <p className="text-xs text-gray-600 leading-relaxed">
            Free translation has a 500 character limit. Switch to <span className="font-medium text-purple-600">AI Mode</span> for unlimited translation.
          </p>
        </div>
        {onEnableAiMode && (
          <button
            onClick={onEnableAiMode}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors"
            style={{ background: 'linear-gradient(135deg, #818cf8, #6366f1)' }}
          >
            <AiRobotIcon />
            Enable AI Mode
          </button>
        )}
      </div>
    )
  }

  // API key not configured error (red theme - consistent with other errors)
  if (isApiKeyError) {
    return (
      <div className="m-4 p-4 bg-red-50 border border-red-200 rounded-xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center w-9 h-9 bg-red-100 rounded-full text-red-600 flex-shrink-0">
            <KeyIcon />
          </div>
          <span className="text-sm font-semibold text-red-700">API Key Required</span>
        </div>
        <div className="mb-3 p-3 bg-white border border-red-100 rounded-lg">
          <p className="text-xs text-gray-600 leading-relaxed">
            {provider ? `${provider} API key is not configured.` : 'API key is not configured.'} Add your key in Settings or disable AI translation.
          </p>
        </div>
        {onConfigureApiKey && (
          <button
            onClick={onConfigureApiKey}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gray-700 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <SettingsIcon />
            Check Settings
          </button>
        )}
      </div>
    )
  }

  // API error (red theme) - includes 400, 401, 500 errors
  if (isApiError) {
    // Extract error code from message
    const errorCodeMatch = message.match(/:\s*(400|401|403|500|502|503)/);
    const errorCode = errorCodeMatch ? errorCodeMatch[1] : null;
    const errorDescription = getErrorDescription(errorCode);

    return (
      <div className="m-4 p-4 bg-red-50 border border-red-200 rounded-xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center w-9 h-9 bg-red-100 rounded-full text-red-600 flex-shrink-0">
            <ErrorIcon />
          </div>
          <div>
            <span className="text-sm font-semibold text-red-700">API Error</span>
            {errorCode && (
              <span className="ml-2 px-1.5 py-0.5 text-[10px] font-mono bg-red-100 text-red-600 rounded">
                {errorCode}
              </span>
            )}
          </div>
        </div>
        <div className="mb-3 p-3 bg-white border border-red-100 rounded-lg">
          <p className="text-xs text-gray-700 leading-relaxed">
            {provider && <span className="font-medium text-red-600">{provider}: </span>}
            {errorDescription || 'The API request failed. Please check your settings and try again.'}
          </p>
        </div>
        {onConfigureApiKey && (
          <button
            onClick={onConfigureApiKey}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gray-700 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <SettingsIcon />
            Check Settings
          </button>
        )}
      </div>
    )
  }

  // Generic error (red theme)
  return (
    <div className="m-4 p-4 bg-red-50 border border-red-200 rounded-xl">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center justify-center w-9 h-9 bg-red-100 rounded-full text-red-600 flex-shrink-0">
          <ErrorIcon />
        </div>
        <span className="text-sm font-semibold text-red-700">Lookup Failed</span>
      </div>
      <div className="p-3 bg-white border border-red-100 rounded-lg">
        <p className="text-xs text-gray-700 leading-relaxed break-words">{message}</p>
      </div>
    </div>
  )
}
