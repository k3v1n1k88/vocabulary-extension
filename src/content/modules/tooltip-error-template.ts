/**
 * Tooltip Error Template Module
 * Error tooltip HTML generation and error parsing utilities.
 */

import { escapeHtml } from '../utils/html-escape'
import {
  TOOLTIP_ICONS,
  createSettingsButtonHtml,
  createErrorCodeBadgeHtml
} from './tooltip-shared-elements'

/**
 * Get human-readable description for HTTP error codes.
 */
function getErrorDescription(errorCode: string | null): string | null {
  if (!errorCode) return null
  const descriptions: Record<string, string> = {
    '400': 'Bad request. The API rejected the request.',
    '401': 'Authentication failed. Check your API key.',
    '403': 'Access denied. Check API key permissions.',
    '500': 'Server error. Try again later.',
    '502': 'Gateway error. Service temporarily unavailable.',
    '503': 'Service unavailable. Try again later.',
  }
  return descriptions[errorCode] || null
}

/**
 * Parse error message to extract provider and error code.
 */
function parseError(message: string): { provider?: string; errorCode?: string; isApiKeyError: boolean } {
  const providerMatch = message.match(/^(Google Gemini|OpenAI|Anthropic|xAI Grok|OpenRouter|Groq|Mistral)/i)
  const errorCodeMatch = message.match(/:\s*(400|401|403|500|502|503)/)
  const lowerMsg = message.toLowerCase()

  return {
    provider: providerMatch ? providerMatch[1] : undefined,
    errorCode: errorCodeMatch ? errorCodeMatch[1] : undefined,
    isApiKeyError: lowerMsg.includes('api key not configured') || lowerMsg.includes('key is required')
  }
}

/**
 * Detect an "unavailable model" provider error (deprecated/removed/unknown model).
 * Provider wording varies, so match loosely and case-insensitively — but require the
 * message to mention "model" so generic API errors ("feature not available",
 * "parameter not supported", endpoint 404 "not found") aren't misclassified.
 * Provider model-not-found errors reliably include the word "model"
 * (e.g. "models/gemini-2.0-flash is no longer available", "The model `x` does not exist").
 */
function isModelUnavailableError(lowerMsg: string): boolean {
  if (!lowerMsg.includes('model')) return false
  return (
    lowerMsg.includes('no longer available') ||
    lowerMsg.includes('not available') ||
    lowerMsg.includes('does not exist') ||
    lowerMsg.includes('not found') ||
    lowerMsg.includes('is not supported') ||
    lowerMsg.includes('decommissioned') ||
    lowerMsg.includes('deprecated')
  )
}

/**
 * Create error tooltip HTML.
 */
export function createErrorHTML(message: string): string {
  const { provider, errorCode, isApiKeyError } = parseError(message)
  const lowerMsg = message.toLowerCase()
  const isApiError = lowerMsg.includes('api error') || errorCode !== undefined
  // Only treat as a model problem when it isn't an API-key issue (those have their own copy).
  const isModelError = !isApiKeyError && isModelUnavailableError(lowerMsg)

  // Determine title and description
  let title = 'Lookup Failed'
  let description = escapeHtml(message)

  if (isApiKeyError) {
    title = 'API Key Required'
    description = provider
      ? `${escapeHtml(provider)} API key is not configured. Add your key in Settings or disable AI translation.`
      : 'API key is not configured. Add your key in Settings or disable AI translation.'
  } else if (isModelError) {
    title = 'Model Unavailable'
    // Keep the provider's own message (it names the model), then point to Settings.
    description = `${escapeHtml(message)}<br>Choose a different model in Settings.`
  } else if (isApiError && errorCode) {
    title = `API Error`
    const errorDesc = getErrorDescription(errorCode)
    description = provider
      ? `<span class="vocab-error-provider">${escapeHtml(provider)}</span>${errorDesc || 'Request failed.'}`
      : errorDesc || 'The API request failed.'
  }

  const actionButton = (isApiKeyError || isApiError || isModelError) ? createSettingsButtonHtml() : ''

  return `
    <div class="vocab-tooltip-content vocab-error-card">
      <div class="vocab-error-header">
        <div class="vocab-error-icon">
          ${TOOLTIP_ICONS.error}
        </div>
        <span class="vocab-error-title">${title}</span>
        ${createErrorCodeBadgeHtml(errorCode)}
      </div>
      <p class="vocab-error-message">${description}</p>
      ${actionButton}
    </div>
  `
}
