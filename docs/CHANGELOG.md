# Changelog

All notable changes to Vocabulary Builder Chrome Extension.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Network timeout handling for API calls (10s dictionary, 30s OpenAI)
- Error handling for chrome.storage operations
- Runtime validation for SM-2 quality parameter

### Fixed
- JSON.parse crash on corrupted storage data (9 locations protected)
- Context menu creation error on extension reload
- Selection race condition in content script
- Event listener memory leak in floating menu cleanup
- Spaced repetition algorithm NaN from invalid quality values

### Security
- Added try-catch to all storage read/write operations
- Protected against storage quota exceeded errors

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
| 1.0.0 | 2026-01-11 | Initial release |

---

## Upgrade Notes

### From Beta to 1.0.0
- No breaking changes
- All vocabulary data preserved
- Settings automatically migrated
