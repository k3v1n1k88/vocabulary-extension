---
title: "Code Obfuscation for Chrome Extension"
description: "Add JavaScript obfuscation to production builds for code protection"
status: pending
priority: P2
effort: 1h
branch: master
tags: [security, build, obfuscation, vite]
created: 2026-01-16
---

# Code Obfuscation Plan

## Objective

Add JavaScript obfuscation to Chrome extension production builds to protect source code while maintaining debuggability via source maps.

## Requirements

| Requirement | Description |
|-------------|-------------|
| Obfuscation | String encryption, control flow flattening, dead code injection |
| Minification | Remove whitespace, shorten variable names |
| Source Maps | Generate for debugging, exclude from published extension |
| Dev Mode | Keep readable for development |
| MV3 Compat | No eval(), CSP compliant |

## Technical Approach

**Tool:** `rollup-plugin-obfuscator` (wraps javascript-obfuscator)

**Why this choice:**
- Works with Vite's Rollup bundler
- Highly configurable
- MV3 compatible with proper settings
- Active maintenance

## Implementation Phases

| # | Phase | Status | Effort | Link |
|---|-------|--------|--------|------|
| 01 | Configure Obfuscation | pending | 1h | [phase-01-configure-obfuscation.md](./phase-01-configure-obfuscation.md) |

## Key Files

- `vite.config.ts` - Add obfuscator plugin
- `package.json` - Add devDependency

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Extension breaks | Test thoroughly, use MV3-safe settings |
| Build time increase | Set reasonable obfuscation level |
| Debug difficulty | Keep source maps locally |

## Success Criteria

- [ ] Production build is obfuscated
- [ ] Dev build remains readable
- [ ] Extension works correctly after obfuscation
- [ ] Source maps generated but not in dist/
