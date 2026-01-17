---
title: "Fix MacOS Chrome Notifications"
description: "Fix notifications not appearing on MacOS due to unsupported options"
status: completed
priority: P1
effort: 30m
branch: master
tags: [bugfix, notifications, macos, chrome-extension]
created: 2026-01-15
---

# Fix MacOS Chrome Notifications

## Overview

Chrome extension notifications don't appear on MacOS. Root cause identified: `requireInteraction: true` option is **not supported on MacOS** and causes silent failures.

## Root Cause Analysis

| Issue | Location | Impact |
|-------|----------|--------|
| `requireInteraction: true` | `notifications.ts:93` | Fails silently on MacOS |
| No error handling | `notifications.ts:87-94` | No fallback when creation fails |

### Technical Details

From Chrome docs:
> `requireInteraction` - Boolean. Indicates that the notification should remain visible on screen until the user activates or dismisses the notification. This defaults to false. **Note: Not supported on Mac OS X.**

## Solution

1. Detect MacOS platform
2. Conditionally omit `requireInteraction` on MacOS
3. Add user guidance for MacOS notification permissions

## Phases

| # | Phase | Status | Effort | Link |
|---|-------|--------|--------|------|
| 1 | Fix Notification Options | Pending | 30m | [phase-01](./phase-01-fix-notification-options.md) |

## Files to Modify

- `src/shared/notifications.ts` - Remove/conditionally set `requireInteraction`

## Success Criteria

1. Notifications appear on MacOS Chrome
2. Notifications still work on Windows/Linux
3. No console errors on any platform
