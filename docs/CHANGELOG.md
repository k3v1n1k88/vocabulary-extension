# Changelog

## [1.0.2] - 2026-01-17

What's New:
- Add chrome web store changelog and human-readable format


## [1.0.1] - 2026-01-17

- fix(ci): replace broken sed with temp file approach for changelog
- feat: add google translate tts and xss security hardening
- feat: add free translation api fallback and ai translation toggle
- docs: simplify cws credentials guide with working oauth flow
- docs: replace deprecated oob flow with service account auth
- ci: remove coverage artifact upload
- test: add automation testing infrastructure
- feat: add code obfuscation for release builds
- docs: update changelog for v1.0.1
- chore: bump version to 1.0.1
- chore: update feedback links for published extension
- docs: add implementation plans and review reports
- feat: add multi-LLM provider support and fix edge cases
- fix: fix bugs
- fix: add error handling for 7 critical edge cases
- feat(vocabulary-extension): implement React Chrome extension with spaced repetition
- chore: initial commit


All notable changes to Vocabulary Builder Chrome Extension.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

---

## [1.0.1] - 2026-01-15

### Added
- **Multi-LLM Provider Support**: Choose between OpenAI, Google Gemini, and xAI Grok
- **Model Selection**: Pick specific models for each provider (gpt-4o-mini, gemini-2.0-flash, grok-2, etc.)
- **API Key Test Button**: Verify your API key works before saving
- **Network Offline Detection**: Clear error message when no internet connection
- Model descriptions to help users choose the right model

### Fixed
- Multi-line translation truncation bug (regex pattern fix)
- MacOS notifications not appearing (requireInteraction not supported)
- Storage quota exceeded error handling
- Flashcard data validation with safe defaults for corrupted data
- Interval overflow protection (capped at 10 years)
- JSON parse error handling in dictionary API

### Changed
- Replaced OpenAI-only translation with generic multi-provider service
- Updated feedback links to Chrome Web Store and GitHub Issues

### Security
- Empty LLM response validation
- Network connectivity checks before API calls

---

## [1.0.0] - 2026-01-11

### Added
- **Word Lookup**: Right-click any word to look up definition
- **Multi-language Translation**: Support for 12 languages (Vietnamese, Chinese, Japanese, Korean, Spanish, French, German, Portuguese, Russian, Thai, Indonesian)
- **Flashcards**: Spaced repetition learning with SM-2 algorithm
- **Gamification**: Streaks, XP, levels, and progress tracking
- **Audio Pronunciation**: Text-to-speech for all words
- **Keyboard Shortcuts**: Optional shortcut mode for power users
- **Study Reminders**: Configurable notification intervals
- **Offline Support**: All data stored locally
- **Settings Page**: Full-featured options page with data export

### Technical
- Chrome Extension Manifest V3
- React 18 + TypeScript
- Zustand state management with chrome.storage persistence
- Vite + CRXJS build system
- Tailwind CSS styling

---

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| 1.0.1 | 2026-01-15 | Multi-LLM providers (Gemini, Grok), bug fixes |
| 1.0.0 | 2026-01-11 | Initial release |

---

## Upgrade Notes

### From Beta to 1.0.0
- No breaking changes
- All vocabulary data preserved
- Settings automatically migrated
