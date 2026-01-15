# xAI Grok API Research Report

**Date:** 2026-01-15 | **Project:** Multi-LLM Providers Integration

---

## Executive Summary

xAI Grok API is fully OpenAI-compatible REST API for text generation and translation. Base URL `https://api.x.ai/v1` with Bearer token auth. Supports Grok-2, Grok-4, and beta models.

---

## 1. API Endpoint & Architecture

**Base URL:** `https://api.x.ai/v1`

**Chat Completions Endpoint:** `POST https://api.x.ai/v1/chat/completions`

**API Key Registration:** [console.x.ai](https://console.x.ai) - Create API keys in xAI Console dashboard

**Service Type:** RESTful, OpenAI-compatible with 16+ endpoints

---

## 2. Authentication

**Method:** Bearer Token (HTTP header)

**Header Format:**
```
Authorization: Bearer YOUR_XAI_API_KEY
```

**Key Acquisition:**
1. Visit https://console.x.ai
2. Create new API key in dashboard
3. Copy and store securely

---

## 3. Request Format (Text Generation)

**Endpoint:** `POST /v1/chat/completions`

**Request Body Structure:**
```json
{
  "model": "grok-4",
  "messages": [
    {
      "role": "system",
      "content": "You are a translation assistant."
    },
    {
      "role": "user",
      "content": "Translate 'hello' to Vietnamese"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 1024,
  "stream": false
}
```

**Fetch Request Example:**
```javascript
const response = await fetch('https://api.x.ai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'grok-4',
    messages: [
      { role: 'system', content: 'You are a translator.' },
      { role: 'user', content: 'Translate "hello" to Vietnamese' }
    ],
    max_tokens: 100
  })
});

const data = await response.json();
```

---

## 4. Response Format

**Structure:**
```json
{
  "id": "chatcmpl-xxx",
  "object": "chat.completion",
  "created": 1705334400,
  "model": "grok-4",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "xin chào"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 15,
    "completion_tokens": 5,
    "total_tokens": 20
  }
}
```

**Text Extraction:**
```javascript
const generatedText = data.choices[0].message.content;
```

---

## 5. Available Models

| Model | Status | Use Case |
|-------|--------|----------|
| `grok-4` | Production | Advanced reasoning, translations, complex tasks |
| `grok-2` | Production | Standard generation, faster responses |
| `grok-beta` | Beta | Latest experimental features |

**Recommendation for Translation:** Use `grok-2` for speed or `grok-4` for accuracy.

---

## 6. SDK Compatibility

**OpenAI SDK (Recommended):**
```javascript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1'
});

const response = await client.chat.completions.create({
  model: 'grok-4',
  messages: [{ role: 'user', content: 'Translate to Vietnamese: hello' }]
});
```

**Anthropic SDK:**
- Base URL: `https://api.x.ai` (no `/v1`)
- Full compatibility with minor adjustments

---

## 7. Error Handling

**Common Response Codes:**
- `200 OK` - Success
- `401 Unauthorized` - Invalid/missing API key
- `429 Too Many Requests` - Rate limit exceeded
- `500 Server Error` - xAI service issue

**Example Error Response:**
```json
{
  "error": {
    "message": "Unauthorized",
    "type": "invalid_request_error",
    "code": "invalid_api_key"
  }
}
```

---

## 8. Integration for Vocabulary Extension

**For Translation Feature:**
1. Set `model: 'grok-2'` for low-latency Vietnamese translations
2. Use system prompt: `"You are an English-Vietnamese translator. Translate only the word given."`
3. Handle API key securely in extension background service worker
4. Cache translations locally to reduce API calls

**Rate Limits:** Standard tier ~60 req/min (verify in console)

---

## Sources

- [xAI REST API Reference](https://docs.x.ai/docs/api-reference)
- [xAI API Overview](https://docs.x.ai/docs/overview)
- [xAI Migration Guide](https://docs.x.ai/docs/guides/migration)
- [Grok Voice Agent API](https://x.ai/news/grok-voice-agent-api)

---

**Report Generated:** 2026-01-15 | **Status:** Complete
