---
title: "Replace Chrome TTS with Google Translate TTS"
description: "Use Google Translate's free TTS endpoint instead of Chrome's system-dependent TTS API"
status: completed
priority: P1
effort: 1h
branch: master
tags: [audio, tts, google-translate, enhancement]
created: 2026-01-17
---

# Replace Chrome TTS with Google Translate TTS

## Problem
Chrome TTS (`chrome.tts.speak()`) requires system-installed voices. Many languages (Thai, Vietnamese) don't have voices installed by default, causing audio playback to fail silently or show error messages.

## Solution
Replace Chrome TTS with Google Translate's free TTS endpoint that supports all languages without requiring system installation.

**Endpoint:** `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl={lang}&q={text}`

## Implementation Phases

| Phase | Description | Status | Link |
|-------|-------------|--------|------|
| 1 | Create Google TTS utility function | ✅ Complete | [phase-01-google-tts-utility.md](./phase-01-google-tts-utility.md) |
| 2 | Update service worker and content script | ✅ Complete | [phase-02-integrate-google-tts.md](./phase-02-integrate-google-tts.md) |

## Key Changes
1. Add `https://translate.google.com/*` to host_permissions in manifest
2. Create new `playGoogleTTS(text, lang)` function
3. Replace `chrome.tts` calls with new function
4. Audio plays in content script via HTML5 Audio element (service worker cannot play audio)

## Files to Modify
- `src/manifest.ts` - Add host permission
- `src/background/service-worker.ts` - Update PLAY_AUDIO handler
- `src/content/content-script.ts` - Add audio playback element

## Technical Notes
- Google Translate TTS has ~200 char limit per request
- For longer text, chunk and play sequentially
- Remove `tts` permission from manifest (no longer needed)
