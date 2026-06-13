# Chrome Web Store Listing — Vocabulary Builder v1.0.5+ Refresh

> Copy-paste fields straight into the Chrome Web Store Developer Console.
> Validated against `chrome-extension-listing` skill (all char limits OK).

---

## 1. Title (Extension Name)

> Already set in manifest. Keep as-is.

```
Vocabulary Builder
```

**Chars:** 18 / 45

> If you ever want to retitle for SEO without changing the manifest name, the dashboard allows a separate "Listing title" of up to 75 chars in newer console versions — but we recommend keeping it identical to manifest.

---

## 2. Short Summary (≤132 chars)

```
Right-click any word to define, translate, and save it. Build vocabulary with flashcards and spaced repetition while you browse.
```

**Chars:** 128 / 132

---

## 3. Detailed Description (≤16,000 chars)

```
Build vocabulary while you read. Right-click any word on any web page to define, translate, and save it — then review with flashcards and spaced repetition.

Vocabulary Builder turns the web itself into your study material. Look up unfamiliar words inline, translate to 12 languages, and save them to a personal deck that resurfaces on the right schedule. Works on regular pages and PDFs, in light and dark mode.

KEY FEATURES
✓ Right-click word lookup — definitions and pronunciations from the free Dictionary API
✓ Translate in 12 languages — VI, ZH, JA, KO, ES, FR, DE, PT, RU, TH, ID, AR
✓ Bring-your-own AI translation — plug in OpenAI, Gemini, Grok, OpenRouter, Groq, or Mistral with your own key
✓ Flashcards with SM-2 spaced repetition — review at the optimal interval
✓ Audio pronunciation — hear words spoken via Google TTS
✓ PDF side panel — look up words while reading PDFs in Chrome
✓ Highlight & remember — saved words stay highlighted next time you visit the page
✓ Streaks, XP, and daily goals — gentle gamification keeps you coming back
✓ Daily reminders — configurable notifications for study sessions
✓ Keyboard shortcuts — Alt+M / Cmd+Shift+M and customizable hotkeys
✓ Dark mode — system-aware with a manual toggle
✓ Cross-device settings sync — preferences and API keys roam across your Chrome browsers
✓ Export & import — back up your vocabulary as JSON anytime

PERFECT FOR
- Language learners reading articles, blogs, and documentation in a non-native language
- Students studying for TOEFL, IELTS, JLPT, HSK, or any vocabulary-heavy exam
- Researchers and professionals encountering domain-specific jargon
- Bilingual readers who want an instant, unobtrusive translator
- Anyone trying to build a daily reading habit and remember more of what they read

HOW IT WORKS
1. Install Vocabulary Builder and pin it to your toolbar
2. Browse any web page or PDF and select a word
3. Right-click → "Look up word" — definition, translation, and audio appear inline
4. Save the word with one click; it joins your flashcard deck
5. Review later — the SM-2 algorithm shows each word at the right interval

PRIVACY
- Vocabulary, study statistics, and progress are stored locally on your device using chrome.storage.local. They are never uploaded.
- Settings (theme, language pairs, hotkeys) and your AI-provider API keys sync across your signed-in Chrome browsers via chrome.storage.sync, so you don't have to re-enter them on a new machine.
- Selected text is sent to translation and dictionary APIs only when you trigger a lookup. We never read or transmit full page contents.
- AI translation uses YOUR OWN API key going directly to your chosen provider (OpenAI, Gemini, etc.). The extension does not host or proxy this traffic.
- No analytics, no telemetry, no account required.
- Privacy policy: <PRIVACY_POLICY_URL>

PERMISSIONS EXPLAINED
- "Storage" — saves your vocabulary, stats, and settings on your device
- "Context menus" — adds the right-click "Look up word" item
- "Active tab" — reads the focused tab only when you invoke a lookup
- "Notifications" — shows daily study reminders (you can turn them off)
- "Alarms" — schedules the daily reminder time
- "Side panel" — opens the lookup panel for PDFs (Chrome 114+)
- Network access is limited to dictionary, translation, and AI endpoints listed in the manifest. AI endpoints are only contacted when you opt in.

SUPPORT
- Email: nkevin1088@gmail.com
- Source & issues: see the project's GitHub repository
- Changelog: in-extension Options → About

Free, open source, and ad-free. Install Vocabulary Builder and start turning every page you read into vocabulary you actually remember.
```

**Chars:** ~3,100 / 16,000 (estimate; validator will report exact count)

---

## 4. Single Purpose Statement (≤1,000 chars)

```
This extension helps users learn vocabulary by looking up, translating, and saving words from web pages and PDFs, then reviewing them with flashcards and spaced repetition.
```

**Chars:** 173 / 1,000

---

## 5. Per-Permission Justifications (≤1,000 chars each)

### `storage`
```
Stores the user's saved vocabulary, study statistics, and learning settings locally on the device using chrome.storage.local. Settings (preferences, theme, language pairs) and the user's encrypted AI-provider API keys also sync across signed-in Chrome browsers via chrome.storage.sync so users don't have to reconfigure on a new machine. Vocabulary and statistics never leave the device unless the user explicitly exports them as a JSON backup.
```

### `contextMenus`
```
Adds a "Look up word" item to the right-click menu. When the user selects text and right-clicks, this item triggers the lookup, translation, and save-to-flashcard actions without requiring the user to open any UI. The menu item is the primary way users invoke the extension on a page.
```

### `activeTab`
```
Reads the URL and selected text of the currently focused tab only when the user invokes the extension — via the toolbar icon, the "Look up word" right-click item, or a configured keyboard shortcut. Used to identify the selected word and to re-apply per-page highlights for previously saved words. No other tabs or windows are accessed.
```

### `notifications`
```
Shows desktop notifications for daily study reminders so the user is alerted when their scheduled review session is due. Frequency and time are configured by the user in Options; notifications can be disabled at any time. No notifications are sent for any other purpose.
```

### `alarms`
```
Schedules the daily study reminder using chrome.alarms. The alarm fires at the user-configured time once per day to trigger the reminder notification described above. No other recurring tasks or background work is scheduled.
```

### `sidePanel`
```
Opens a Chrome Side Panel (Chrome 114+) showing word lookup and translation results while the user reads PDFs in the browser, where DOM-based tooltips are not available. The side panel only opens when the user invokes it via the toolbar icon, keyboard shortcut, or right-click menu.
```

---

## 6. Host Permission Justifications (≤1,000 chars each)

### `<all_urls>` (content script match — required by content_scripts.matches)
```
The content script runs on any web page so users can right-click any word on any site to look it up, translate it, save it to flashcards, or restore previously saved highlights. The script only reads the user's text selection and the page URL when the user actively invokes a lookup. It never reads or transmits the full page content, scripts, or DOM data to any third party.
```

### `https://api.dictionaryapi.dev/*`
```
Calls the free public Dictionary API to fetch English word definitions, parts of speech, and pronunciations. Only the looked-up word is sent. No personal data, no page content, no API key required.
```

### `https://api.mymemory.translated.net/*`
```
Calls the MyMemory public translation API as the default (free, no-key) translation pipeline. Only the selected text and the target language code are sent. Used when the user has not configured an AI provider.
```

### `https://translate.google.com/*`
```
Fetches text-to-speech audio from Google for word pronunciation playback, and serves as a translation fallback. Only the word and language code are transmitted. No user account or page content is accessed.
```

### `https://api.openai.com/*`
```
Used ONLY when the user opts into AI translation with OpenAI as the provider AND supplies their own OpenAI API key in Options. The selected text is sent directly to OpenAI under the user's own key. The extension does not host, proxy, or log this traffic.
```

### `https://generativelanguage.googleapis.com/*`
```
Used ONLY when the user opts into AI translation with Google Gemini AND supplies their own Gemini API key. The selected text is sent directly to Google's Generative Language API under the user's own key.
```

### `https://api.x.ai/*`
```
Used ONLY when the user opts into AI translation with Grok (xAI) AND supplies their own xAI API key. The selected text is sent directly to xAI under the user's own key.
```

> Note: providers OpenRouter, Groq, and Mistral mentioned in the listing copy reach those services via origins not declared in `host_permissions`. If you want to keep them as user options, add the corresponding origins to the manifest before resubmitting. Otherwise, drop them from the description.

---

## 7. Remote Code Justification

> Not applicable — extension bundles all JavaScript locally. Leave this field blank.

---

## 8. Data Usage Disclosure (dashboard checkboxes)

Tick these and provide the listed purpose:

- [x] **Authentication info** — User-supplied AI provider API keys; stored locally and synced via chrome.storage.sync; never sent anywhere except to the user's chosen provider when they invoke AI translation.
- [x] **Website content** — Only the user's text selection (a word or short phrase) is sent to dictionary/translation/AI endpoints, only when the user invokes a lookup.
- [x] **User activity** — Study statistics (XP, streaks, levels, review history) are stored locally only.

Do NOT tick: PII, financial info, health info, personal communications, location, web history.

---

## 9. Promo Assets — Copy

### Small Promo Tile (440×280)
**Tagline (≤6 words):**
```
Lookup. Translate. Remember.
```

### Marquee Promo Tile (1400×560)
**Headline (≤8 words):**
```
Build vocabulary while you read.
```

**Subhead (≤14 words):**
```
Right-click lookup, AI translation, and spaced-repetition flashcards — in your browser.
```

### Screenshot Captions (5 slots, ≤8 words each)

| # | Visual | Caption |
|---|---|---|
| 1 | Right-click context menu over a selected word | Right-click any word to look it up |
| 2 | Tooltip showing translation in target language | Translate instantly to 12 languages |
| 3 | Flashcard review session with quality buttons | Review with spaced repetition |
| 4 | Options page showing AI-provider list | Choose your own AI provider |
| 5 | Privacy section + local storage diagram | Your vocabulary stays on your device |

### YouTube Preview Script (45 seconds)

```
[0–3s]   HOOK
  Visual: User scrolling an English article, pausing on an unfamiliar word
  No narration

[3–10s]  PROMISE
  VO: "Vocabulary Builder turns every web page into your study material — in one right-click."

[10–25s] DEMO
  10–15s: Right-click a word → tooltip with definition + translation
  15–20s: Click "Save" → word added to flashcard deck
  20–25s: Open flashcards → review session with SM-2 spaced repetition

[25–35s] SOCIAL PROOF / DIFFERENTIATOR
  VO: "Twelve languages. Six AI providers. Spaced repetition that actually works."
  Visual: cycling through language pairs and provider logos

[35–42s] PRIVACY + CTA
  VO: "Your vocabulary stays on your device. Add Vocabulary Builder to Chrome — link in description."

[42–45s] LOGO
  Full-frame Vocabulary Builder logo + name, hold 2s
```

---

## 10. Listing Metadata

| Field | Value |
|---|---|
| Category | Education |
| Secondary category | Productivity |
| Languages | English (UK/US) |
| Privacy policy URL | `<PRIVACY_POLICY_URL>` (replace before submit) |
| Support email | nkevin1088@gmail.com |
| Support URL | (optional — link to GitHub Issues) |
| Single purpose statement | See section 4 |
| Open-source license | MIT |

---

## 11. Pre-Submit Checklist

- [ ] Replace `<PRIVACY_POLICY_URL>` everywhere
- [ ] Verify privacy policy at that URL covers all 9 host_permissions and the chrome.storage.sync of API keys
- [ ] Resolve OpenRouter/Groq/Mistral mismatch (either add hosts to manifest or remove from listing copy)
- [ ] Run `python "C:\Users\vanntl-PC-Window11\.claude\skills\chrome-extension-listing\scripts\validate_listing.py" store-listing.json`
- [ ] Confirm 5 screenshots match the captions in section 9
- [ ] Verify nkevin1088@gmail.com is reachable
- [ ] Compare detailed description against `references/review-pitfalls.md` checklist

---

## 12. Open Questions

1. **OpenRouter / Groq / Mistral hosts:** README and Options describe them as supported providers, but `host_permissions` only lists OpenAI, Gemini, and xAI/Grok. Either (a) declare the additional hosts in the manifest before submitting, or (b) trim the description and Options UI to only the three currently declared. Listing AI providers that the manifest cannot reach is a rejection trigger.
2. **`<all_urls>` host scope:** Used by `content_scripts.matches`, not declared in `host_permissions`. The dashboard sometimes asks for justification anyway — section 6 includes one defensively.
3. **Privacy policy URL:** Placeholder used. Final URL must be live and publicly accessible before submission.
4. **Screenshots:** Captions assume 5 specific scenes — confirm the actual screenshot set in the repo matches, or rewrite captions to match the existing screenshots.
