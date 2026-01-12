---
title: "Vocabulary Chrome Extension"
description: "Chrome extension for word lookup, flashcards with SM-2 spaced repetition, EN/VN translation, gamification"
status: pending
priority: P1
effort: 38h
branch: main
tags: [chrome-extension, react, typescript, firebase, spaced-repetition, gamification]
created: 2026-01-10
---

# Vocabulary Chrome Extension - Implementation Plan

## Overview

Build Chrome Extension (MV3) with: word lookup via context menu, SM-2 flashcards, EN/VN translation, Firebase backend, audio pronunciation, and gamification (streaks, points, achievements).

**Tech Stack:** React 18, TypeScript, Vite + CRXJS, Zustand, Tailwind CSS, Firebase (Auth + Firestore), Web Speech API

## Architecture

```
Content Script -> Background Worker -> Firebase
     |                  |
Right-click       Auth, Firestore
Word detect       Message routing
TTS audio              |
                    Popup (React)
                    Options Page
                    Gamification Store
```

## Phases

| # | Phase | Status | Effort | Link |
|---|-------|--------|--------|------|
| 01 | Project Setup | pending | 2h | [phase-01-project-setup.md](./phase-01-project-setup.md) |
| 02 | Extension Skeleton | pending | 3h | [phase-02-extension-skeleton.md](./phase-02-extension-skeleton.md) |
| 03 | Firebase Integration | pending | 4h | [phase-03-firebase-integration.md](./phase-03-firebase-integration.md) |
| 04 | Word Lookup Feature | pending | 5h | [phase-04-word-lookup.md](./phase-04-word-lookup.md) |
| 05 | Vocabulary Storage | pending | 4h | [phase-05-vocabulary-storage.md](./phase-05-vocabulary-storage.md) |
| 06 | Flashcard System | pending | 8h | [phase-06-flashcard-system.md](./phase-06-flashcard-system.md) |
| 07 | Gamification System | pending | 6h | [phase-07-gamification.md](./phase-07-gamification.md) |
| 08 | Settings & Options | pending | 3h | [phase-08-settings-options.md](./phase-08-settings-options.md) |
| 09 | Testing & Polish | pending | 3h | [phase-09-testing-polish.md](./phase-09-testing-polish.md) |

## Key Dependencies

- Phases 01-02: Foundation (must complete first)
- Phase 03: Required before 04-07 (Firebase needed for auth/storage)
- Phases 04-06: Can partially parallel after Phase 03
- Phase 07: Requires Phase 06 (gamification built on review data)
- Phases 08-09: Final polish

## Success Criteria

- [ ] Context menu word lookup works on any webpage
- [ ] Words saved to Firestore with user auth
- [ ] SM-2 flashcard review functional
- [ ] EN/VN translation working
- [ ] Audio pronunciation (TTS) works for English words
- [ ] Gamification: streaks, points, achievements functional
- [ ] Chrome Web Store ready

## Constraints

1. MV3 Service Workers: Ephemeral (~30s idle timeout)
2. Firebase CSP: Must use `firebase/auth/web-extension`
3. Storage: chrome.storage.sync = 100KB, local = 10MB
4. Offline: Firestore IndexedDB persistence in popup only

## File Structure Target

```
src/
├── manifest.ts
├── background/service-worker.ts
├── content/content-script.ts
├── popup/{index.html, App.tsx, components/}
├── options/Options.tsx
├── shared/{store.ts, firebase.ts, spaced-repetition.ts}
└── types/index.ts
```
