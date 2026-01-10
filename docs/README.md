# Vocabulary Builder Documentation

## Overview

Chrome extension for vocabulary learning with word lookup, flashcards, and spaced repetition.

## Documents

- [Tech Stack](./tech-stack.md) - Technology decisions
- [Design Guidelines](./design-guidelines.md) - UI/UX specifications
- [Wireframes](./wireframes/) - HTML wireframe prototypes

## Quick Links

| Resource | Description |
|----------|-------------|
| `../README.md` | Getting started guide |
| `../plans/` | Implementation plans |
| `../src/` | Source code |

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Chrome Extension                    │
├──────────────────┬──────────────────┬───────────────┤
│  Content Script  │  Background      │  Popup/UI     │
│  - Word detect   │  - Firebase*     │  - React      │
│  - Tooltip UI    │  - Message hub   │  - Zustand    │
│  - Save word     │  - Context menu  │  - Tailwind   │
└──────────────────┴──────────────────┴───────────────┘
                           │
                   chrome.storage
                   (local/sync)
```

*Firebase integration planned for future phase

## Core Features

1. **Word Lookup** - Right-click context menu
2. **Flashcards** - SM-2 spaced repetition
3. **Gamification** - Streaks, XP, badges
4. **Vietnamese Translation** - EN-VN support
5. **Audio** - TTS pronunciation

## Development Status

| Phase | Status |
|-------|--------|
| Project Setup | Done |
| Extension Skeleton | Done |
| Firebase Integration | Pending |
| Gamification | Partial |
| Testing | Pending |
