# Changelog

## [1.0.5] - 2026-01-21

Bug Fixes:
- Disable obfuscation for release builds


## [1.0.4] - 2026-01-19

Bug Fixes:
- Improve tooltip buttons and floating menu styling


All notable changes to Vocabulary Builder Chrome Extension.

---

## [1.0.4] - 2026-01-19

### Improved
- **Tooltip UI/UX**: Flat icon buttons for audio and copy
- **Floating Menu**: Compact height with reduced padding
- **AI Mode**: Speak button defaults to English TTS

### Fixed
- Button border conflicts with page CSS
- Copy button positioning in translation tooltip

---

## [1.0.3] - 2026-01-18

### Added
- **Text Highlighting**: Highlight selected text on any webpage
- **Color Picker**: Choose from 6 highlight colors (yellow, green, blue, pink, orange, purple)
- **Persistent Highlights**: Highlights are saved and restored when you revisit the page
- **Multi-paragraph Support**: Highlight text across multiple paragraphs
- **Highlight Settings**: Configure default highlight color in options page
- **Quick Remove**: Click X button on any highlight to remove it

---

## [1.0.2] - 2026-01-17

### Added
- **PDF Support**: Look up words in PDF files via Chrome side panel
- **API Key Validation**: Test your API key before saving
- **Settings Sync**: Better synchronization of settings across tabs

### Improved
- Enhanced donate section with clearer options
- Better AI translation hints and guidance
- Cleaner codebase for faster performance

---

## [1.0.1] - 2026-01-15

### Added
- **Multi-LLM Provider Support**: Choose between OpenAI, Google Gemini, xAI Grok, OpenRouter, Groq, or Mistral
- **Model Selection**: Pick specific models (gpt-4o-mini, gemini-2.0-flash, grok-2, etc.)
- **Free Translation**: MyMemory API fallback when AI is disabled
- **Google TTS**: High-quality text-to-speech pronunciation
- **API Key Test**: Verify your API key works before saving
- **Network Detection**: Clear error message when offline

### Fixed
- Multi-line translation no longer gets truncated
- macOS notifications now work correctly
- Better handling of storage quota limits
- Improved flashcard data validation

### Security
- XSS protection for safe HTML rendering
- Network connectivity checks before API calls

---

## [1.0.0] - 2026-01-11

### Features
- **Word Lookup**: Right-click any word to look up its definition
- **12 Languages**: Vietnamese, Chinese, Japanese, Korean, Spanish, French, German, Portuguese, Russian, Thai, Indonesian, Arabic
- **Flashcards**: Study with spaced repetition (SM-2 algorithm)
- **Gamification**: Streaks, XP, levels, and progress tracking
- **Audio Pronunciation**: Listen to word pronunciation
- **Keyboard Shortcuts**: Quick access for power users
- **Study Reminders**: Configurable notification alerts
- **Offline Support**: All data stored locally
- **Export Data**: Backup your vocabulary anytime

---

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| 1.0.4 | 2026-01-19 | Tooltip UI/UX improvements, flat buttons |
| 1.0.3 | 2026-01-18 | Text highlighting with color picker |
| 1.0.2 | 2026-01-17 | PDF support, API validation, UX improvements |
| 1.0.1 | 2026-01-15 | Multi-LLM providers, Google TTS, security fixes |
| 1.0.0 | 2026-01-11 | Initial release |
