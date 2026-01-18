# Vocabulary Builder Documentation

## Overview

Chrome extension for vocabulary learning with word lookup, AI-powered translation, flashcards, and spaced repetition.

## Documents

- [Code Standards](./code-standards.md) - Coding conventions and patterns
- [Codebase Summary](./codebase-summary.md) - Architecture and module overview
- [Tech Stack](./tech-stack.md) - Technology decisions
- [Design Guidelines](./design-guidelines.md) - UI/UX specifications
- [Deployment Guide](./DEPLOY.md) - Chrome Web Store publishing
- [Changelog](./CHANGELOG.md) - Version history
- [Privacy Policy](./PRIVACY_POLICY.md) - Data handling

## Quick Links

| Resource | Description |
|----------|-------------|
| `../README.md` | Getting started guide |
| `../plans/` | Implementation plans |
| `../src/` | Source code |

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     Chrome Extension                          │
├────────────────┬─────────────────┬─────────────┬─────────────┤
│ Content Script │ Background      │ Popup/UI    │ Side Panel  │
│ - Floating menu│ - Context menu  │ - Dashboard │ - PDF lookup│
│ - Tooltip UI   │ - TTS audio     │ - Study     │ - Results   │
│ - Word detect  │ - Notifications │ - Vocabulary│ - Translate │
│ - Save word    │ - Message hub   │ - Settings  │             │
└────────────────┴─────────────────┴─────────────┴─────────────┘
                              │
                      chrome.storage.local
```

## Core Features

| Feature | Description |
|---------|-------------|
| **Word Lookup** | Right-click context menu, Free Dictionary API |
| **Translation** | 12 languages, Free API + AI providers |
| **AI Translation** | OpenAI, Gemini, xAI Grok, OpenRouter, Groq, Mistral |
| **Flashcards** | SM-2 spaced repetition algorithm |
| **Gamification** | Streaks, XP, levels, progress tracking |
| **Audio** | Google TTS pronunciation |
| **Side Panel** | PDF lookup results (Chrome 114+) |
| **Shortcuts** | Optional keyboard shortcut mode |
| **Reminders** | Configurable study notifications |

## Settings Page

| Section | Options |
|---------|---------|
| **Learning** | Daily goal, notifications, keyboard shortcuts |
| **Translation** | Target language, AI toggle, provider, model, API key |
| **Data** | Export/import, clear data |

## Development Status

| Component | Status |
|-----------|--------|
| Word Lookup | ✅ Complete |
| Multi-language | ✅ Complete (12 languages) |
| AI Translation | ✅ Complete (6 providers) |
| Flashcards | ✅ Complete |
| Gamification | ✅ Complete |
| Side Panel | ✅ Complete |
| Settings | ✅ Complete |
| Notifications | ✅ Complete |
| Testing | ✅ 127 tests |
