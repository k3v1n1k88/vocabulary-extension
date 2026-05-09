# Issue #4 Tooltip Bubble Fix — Shipped

**Date**: 2026-05-09  
**Severity**: High  
**Component**: Tooltip positioning & dismiss behavior (translate/lookup bubble)  
**Status**: Resolved (unit tests green; manual QA pending)

## What Happened

Fixed two distinct UX bugs in the translate tooltip shipped inside `vocabulary-extension` submodule:
1. Bottom-of-page cutoff — tooltip was never repositioned when it overflowed below viewport.
2. Auto-dismiss on outside-click — too aggressive; every stray click closed it, breaking interaction.

Branch `fix/tooltip-bubble-issue-4` merged with commit `943f3a1`. 144/144 tests passing (+16 new). All files under 200 LOC. Build clean.

## The Brutal Truth

Validation caught a CSS token mistake before implementation (plan was using nonexistent `--vocab-primary`), which saved a re-roll. But validation also _claimed_ dark-mode CSS existed at line 270 when it was actually responsive sizing — cost 4 reverts. Pre-implementation grep doesn't trump actual code.

More painful: code-reviewer found H1 (high severity) — the close-button handler was inert after first load because every `innerHTML` replace (spinner→loaded, error cases, dropdown re-translate) orphaned the direct DOM binding. Would have shipped broken. Delegated listener fix saved the UX.

Phase 05 manual QA not done yet. Until Chrome extension loads on a real Wikipedia article with selections at bottom-of-page, "fix complete" is only a unit-test claim.

## Technical Details

**Vertical Flip Implementation**:
- Added `adjustForViewportVertical(position, height, selectionRect)` to `tooltip-positioning.ts`.
- Flips above selection if room exists; else clamps to viewport top.
- Uses `requestAnimationFrame` post-mount to measure actual rendered height (jsdom returns 0 by default, tests had to mock `getBoundingClientRect`).
- Fixed M1 regression: flip branch needed upper-bound check (`flippedTop + tooltipHeight <= viewportBottom`) for selections scrolled below viewport.

**Dismiss Model Replace**:
- Deleted `setupOutsideClickHandler` entirely — was grepping all document clicks.
- Added `setupCloseButtonHandler` (X button click) + `setupEscapeKeyHandler` (document keydown).
- Esc handler intentionally does NOT `stopPropagation` — host page Esc handlers (e.g. Wikipedia) still fire.
- Handler binding switched to delegated listener on tooltip ROOT (survives `innerHTML` swaps) instead of direct bind to close button (was inert after content reload).

**Validation Decision (Reverted)**:
- Plan claimed dark-mode CSS existed; actually didn't. Added zero dark-mode rules (YAGNI) — only rule would be `.vocab-close-btn` override, isolated and weird. Deferred to stylesheet-wide dark-mode follow-up.

**Test Coverage**:
- 16 new tests: vertical positioning edge cases, close-button click (including post-innerHTML), Esc key propagation, M1 off-screen flip clamp.
- Regression tests: handler fires after content reload, target-children delegation works.

## What We Tried

- Decision 1: Use CSS token validation to catch naming errors → worked (found `--vocab-primary` mistake).
- Decision 2: Verify dark-mode CSS exists before adding close-btn overrides → failed silently (grep said "line 270" but was wrong selector); reverted at implementation.
- Decision 3: Defer dropdown clipping risk to Phase 05 QA → still valid; M2 unresolved.

## Root Cause Analysis

**Bug 1 (vertical cutoff)**: `tooltip-positioning.ts:adjustForViewport` only handled horizontal overflow. Vertical was never considered. Missing feature, not a bug in existing logic.

**Bug 2 (aggressive dismiss)**: `setupOutsideClickHandler` attached to `document` with no filtering — any click anywhere fired it. No affordance for user to interact with tooltip (e.g., hovering over a hyperlink inside). Original author didn't test on real pages with interactive content.

**H1 handler regression**: Original code directly bound to close button via `document.querySelector`. That node reference became stale after every `innerHTML` replace. No delegation pattern = DOM mutation kills the handler silently. Wouldn't have caught without code-review on a complex event-handling file.

## Lessons Learned

1. **Validation grep is fast but fallible** — always re-verify critical assumptions at implementation time. Line numbers can be right, selectors wrong.
2. **Event handler durability matters** — direct DOM binds don't survive mutations. Always use delegation or re-bind after `innerHTML` updates. Could have caught this with a mutation observer test.
3. **Outside-click dismiss is UX trap** — breaks any tooltip with interactive content (links, forms). Consider Escape key + explicit close button by default; outside-click only on simple read-only popovers.
4. **Validation saves differently at different steps** — CSS token validation (lexical) catches typos. Dark-mode validation (semantic) requires reading the actual code, not grep. Pre-implementation validation is valuable but not sufficient.

## Next Steps

1. **Phase 05 manual QA**: Load extension in Chrome, test on long Wikipedia article (bottom-of-page selection, dark theme site). Verify M2 (dropdown clipping) doesn't surface. If clean, clear to merge submodule PR.
2. **Submodule pointer bump**: After QA passes, parent repo bumps `vocabulary-extension` commit reference. Issue #4 closes via submodule PR merge.
3. **Stylesheet dark-mode** (separate issue): Add global `@media (prefers-color-scheme: dark)` block covering all `.vocab-*` classes. Not this fix's scope.
4. **Touch/mobile behavior**: Chrome on Android, iOS Safari. Not in scope; backlog item.

## Unresolved Questions

- Does M2 (dropdown clipping under `overflow-y: auto`) actually surface on tall translations? Pending Phase 05 QA.
- Should Escape handler call `stopPropagation` if tooltip is the only modal-ish thing active? (Currently doesn't — lets host page Esc handlers still fire.)
- Will parent repo submodule bump be manual or CI-gated?
