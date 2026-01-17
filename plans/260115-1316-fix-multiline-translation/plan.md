---
title: "Fix Multi-line Translation Truncation"
description: "Fix regex pattern truncating LLM translations at first newline"
status: completed
priority: P1
effort: 30m
branch: master
tags: [bugfix, translation, regex]
created: 2026-01-15
---

# Fix Multi-line Translation Truncation

## Overview

Translation responses from OpenAI containing multiple lines are truncated - only first line displays. Root cause: regex pattern in `openai-translation.ts` captures only until first `\n`.

## Bug Example

**Input:** `"Bạn được cho một chuỗi s chỉ bao gồm các chữ cái tiếng Anh viết thường.\n\nMột tiền tố của s được gọi là dư..."`

**Actual:** `"Bạn được cho một chuỗi s chỉ bao gồm các chữ cái tiếng Anh viết thường."`

**Expected:** Full multi-line text displayed

## Root Cause

```typescript
// src/shared/openai-translation.ts:125-126
const translationMatch = responseText.match(/Translation:\s*(.+?)(?:\n|$)/m)
```

Regex `(.+?)(?:\n|$)` stops at first newline due to non-greedy `.+?` matching.

## Solution

Replace regex with pattern capturing until next field marker:
```typescript
const translationMatch = responseText.match(/Translation:\s*([\s\S]+?)(?=\n(?:Synonyms|Antonyms|Note):|$)/m)
```

## Phases

| # | Phase | Status | Effort | Link |
|---|-------|--------|--------|------|
| 1 | Fix Regex + Test | Pending | 30m | [phase-01](./phase-01-fix-regex-pattern.md) |

## Dependencies

- None - isolated bug fix
