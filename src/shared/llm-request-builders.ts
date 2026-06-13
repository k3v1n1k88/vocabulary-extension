/**
 * LLM Request Builders Module
 * Builds provider-specific API request configurations.
 */

/**
 * Build translation prompt for LLM providers.
 */
export function buildTranslationPrompt(
  text: string,
  targetLanguage: string,
  isTextPhrase: boolean
): { system: string; user: string } {
  const system = isTextPhrase
    ? `You are a translator. Detect the source language and translate the given text to ${targetLanguage}.
Format your response as:
Source: [detected language]
Translation: [translation]`
    : `You are a translator and language expert. For the given word:
1. Detect the source language
2. Translate to ${targetLanguage}
3. Provide 2-4 synonyms (similar words in the SOURCE language)
4. Provide 2-4 antonyms (opposite words in the SOURCE language) if applicable
5. Brief usage note if the word has multiple meanings

Format your response EXACTLY as:
Source: [detected language]
Translation: [translation in ${targetLanguage}]
Synonyms: [comma-separated synonyms in source language]
Antonyms: [comma-separated antonyms in source language, or "none" if not applicable]
Note: [brief note, or "none" if straightforward]`

  return { system, user: text }
}

/**
 * Build request for OpenAI/Grok (same format).
 */
export function buildOpenAIRequest(
  endpoint: string,
  model: string,
  apiKey: string,
  system: string,
  user: string
): { url: string; options: RequestInit } {
  return {
    url: endpoint,
    options: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    }
  }
}

/**
 * Build request for Gemini (uses x-goog-api-key header).
 */
export function buildGeminiRequest(
  endpoint: string,
  model: string,
  apiKey: string,
  system: string,
  user: string
): { url: string; options: RequestInit } {
  return {
    url: `${endpoint}/${model}:generateContent`,
    options: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ parts: [{ text: user }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 500
        }
      })
    }
  }
}

/**
 * Build provider-specific request based on provider type.
 */
export function buildProviderRequest(
  provider: 'openai' | 'grok' | 'gemini' | 'openrouter',
  endpoint: string,
  model: string,
  apiKey: string,
  system: string,
  user: string
): { url: string; options: RequestInit } {
  return provider === 'gemini'
    ? buildGeminiRequest(endpoint, model, apiKey, system, user)
    : buildOpenAIRequest(endpoint, model, apiKey, system, user)
}
