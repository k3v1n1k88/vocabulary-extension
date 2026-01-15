# Google Gemini API Research Report
**Date:** 2026-01-15 | **Model:** gemini-2.0-flash

## 1. API Endpoint URL

**Base URL:** `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`

**For gemini-2.0-flash:**
```
https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=$GEMINI_API_KEY
```

**Streaming Alternative:**
- `streamGenerateContent` endpoint uses Server-Sent Events (SSE) for chunked responses

---

## 2. Request Format

### Headers
```javascript
{
  "Content-Type": "application/json",
  "x-goog-api-key": "$GEMINI_API_KEY"
}
```

### Body Structure
```json
{
  "contents": [
    {
      "parts": [
        {
          "text": "Your prompt here"
        }
      ]
    }
  ],
  "generationConfig": {
    "temperature": 0.7,
    "topP": 0.9,
    "maxOutputTokens": 1024
  },
  "safetySettings": [],
  "systemInstruction": "Optional system prompt"
}
```

### Fetch Request Example
```javascript
const response = await fetch(
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + API_KEY,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: 'Translate "hello" to Spanish'
        }]
      }]
    })
  }
);
```

---

## 3. Response Format

**Structure:**
```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "Generated response text here"
          }
        ]
      },
      "finishReason": "STOP",
      "safetyRatings": []
    }
  ],
  "promptFeedback": {
    "safetyRatings": []
  },
  "usageMetadata": {
    "promptTokenCount": 10,
    "candidatesTokenCount": 25,
    "totalTokenCount": 35
  }
}
```

**Extract Text:**
```javascript
const text = response.candidates[0].content.parts[0].text;
```

**Key Fields:**
- `candidates[]`: Generated options (typically 1)
- `finishReason`: "STOP" (complete) or "MAX_TOKENS" (truncated)
- `usageMetadata`: Token counts for billing

---

## 4. Authentication

### API Key Retrieval
1. Navigate to: **[aistudio.google.com/apikey](https://aistudio.google.com/apikey)**
2. Sign in with Google account
3. Click "Create API key" (auto-creates new Google Cloud Project)
4. Key appears in management interface

### Implementation
```javascript
// Option A: Query Parameter (shown above)
?key=$GEMINI_API_KEY

// Option B: Header (not preferred by Google, use query param)
headers: { 'x-goog-api-key': '$GEMINI_API_KEY' }

// Option C: Environment Variable
process.env.GEMINI_API_KEY // Auto-picked up by client libraries
```

### Security
- **NEVER commit API keys to git**
- Use environment variables or secure vaults
- Call API from server-side for sensitive use
- Consider API key restrictions in Google Cloud Console

---

## 5. Registration & Setup URL

**API Key Creation:** https://aistudio.google.com/apikey

**Documentation:** https://ai.google.dev/gemini-api/docs/api-key

**Quickstart Guide:** https://ai.google.dev/gemini-api/docs/quickstart

---

## Translation Example

```javascript
async function translateText(text, targetLang = 'es') {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Translate to ${targetLang}: "${text}"`
          }]
        }],
        generationConfig: {
          maxOutputTokens: 256,
          temperature: 0.1
        }
      })
    }
  );

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}
```

---

## Integration Notes

1. **Model Selection:** Use `gemini-2.0-flash` for speed; `gemini-1.5-pro` for complex tasks
2. **Token Limits:** Response includes `usageMetadata` for cost tracking
3. **Rate Limits:** Check Google Cloud Console for quota settings
4. **Streaming:** Use `streamGenerateContent` for real-time responses
5. **Error Handling:** Responses include `safetyRatings` (potential content issues)

---

## Unresolved Questions

- Exact rate limiting and quota defaults for free tier
- Whether translation-specific parameters exist vs. generic prompting
- Best practices for managing API key rotation in production

---

**Sources:**
- [Gemini API Reference](https://ai.google.dev/api)
- [Generating Content Guide](https://ai.google.dev/api/generate-content)
- [Using Gemini API Keys](https://ai.google.dev/gemini-api/docs/api-key)
- [Quickstart Documentation](https://ai.google.dev/gemini-api/docs/quickstart)
- [Google AI Studio API Key Management](https://aistudio.google.com/app/apikey)
