# Phase 01: Fix Notification Options

## Context Links

- Parent: [plan.md](./plan.md)
- Chrome Notifications API: https://developer.chrome.com/docs/extensions/reference/api/notifications

## Overview

- **Priority:** P1
- **Status:** Pending
- **Description:** Fix `requireInteraction` option causing silent failures on MacOS

## Key Insights

1. **MacOS Limitation**: `requireInteraction` is not supported on MacOS - causes notification creation to fail silently
2. **Platform Detection**: Use `navigator.platform` or `navigator.userAgentData` to detect MacOS
3. **Simple Fix**: Remove `requireInteraction` or make it conditional

## Requirements

### Functional
- Notifications must appear on MacOS
- Notifications must continue working on Windows/Linux
- Error should be logged if notification creation fails

### Non-functional
- No breaking changes to existing behavior on supported platforms

## Architecture

```
showDailyReminder()
       │
       ▼
isMacOS() → boolean
       │
       ├── true: omit requireInteraction
       │
       └── false: include requireInteraction
       │
       ▼
chrome.notifications.create(options)
```

## Related Code Files

| File | Action | Description |
|------|--------|-------------|
| `src/shared/notifications.ts` | Modify | Add platform detection, fix notification options |

## Implementation Steps

### Step 1: Add Platform Detection Helper

Add at top of `notifications.ts`:

```typescript
/**
 * Detect if running on MacOS
 */
function isMacOS(): boolean {
  // Use userAgentData if available (modern browsers)
  if ('userAgentData' in navigator) {
    return (navigator as Navigator & { userAgentData?: { platform: string } })
      .userAgentData?.platform === 'macOS'
  }
  // Fallback to navigator.platform
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform)
}
```

### Step 2: Fix showDailyReminder Function

Update lines 87-94 in `showDailyReminder()`:

**Before:**
```typescript
const notificationId = await chrome.notifications.create('daily-reminder-' + Date.now(), {
  type: 'basic',
  iconUrl: chrome.runtime.getURL('icons/icon-128.png'),
  title,
  message,
  priority: 2,
  requireInteraction: true
})
```

**After:**
```typescript
const options: chrome.notifications.NotificationOptions = {
  type: 'basic',
  iconUrl: chrome.runtime.getURL('icons/icon-128.png'),
  title,
  message,
  priority: 2
}

// requireInteraction not supported on MacOS - causes silent failure
if (!isMacOS()) {
  options.requireInteraction = true
}

const notificationId = await chrome.notifications.create(
  'daily-reminder-' + Date.now(),
  options
)
```

### Step 3: Add Better Error Handling

The existing try-catch at line 96-98 is good. Add more detailed logging:

```typescript
} catch (error) {
  console.error('[VocabExt] Failed to create notification:', error)
  // Log platform info for debugging
  console.error('[VocabExt] Platform:', navigator.platform)
}
```

### Step 4: Add User Guidance Comment

Add JSDoc comment to `showDailyReminder`:

```typescript
/**
 * Show notification for daily study reminder with a random word preview
 *
 * Note for MacOS users: Ensure Chrome has notification permission in
 * System Settings > Notifications > Google Chrome
 */
```

## Todo List

- [ ] Add `isMacOS()` helper function
- [ ] Update `showDailyReminder()` to conditionally set `requireInteraction`
- [ ] Improve error logging with platform info
- [ ] Build and test on MacOS
- [ ] Verify Windows/Linux still works

## Success Criteria

1. Test button in Settings shows notification on MacOS
2. Scheduled reminders appear on MacOS
3. No console errors related to notifications
4. Windows/Linux behavior unchanged

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Platform detection incorrect | Low | Multiple detection methods |
| Other unsupported options | Low | Only `requireInteraction` is documented as unsupported |

## Security Considerations

- No security impact - only changing notification display options

## Next Steps

After fix:
1. Test on MacOS with Chrome notification permissions enabled
2. Test on Windows to verify no regression
3. Commit changes

## MacOS User Setup

If notifications still don't work after fix:

1. Open **System Settings** (or System Preferences on older MacOS)
2. Go to **Notifications**
3. Find **Google Chrome**
4. Enable:
   - Allow Notifications
   - Banners or Alerts
   - Show notifications on lock screen (optional)
