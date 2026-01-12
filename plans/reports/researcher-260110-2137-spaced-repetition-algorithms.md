# Research Report: Spaced Repetition Algorithms for Vocabulary Learning

**Date:** 2026-01-10 | **Sources Consulted:** 20+ articles | **Focus:** SM-2, Leitner, Anki, optimal intervals, extension implementation

---

## Executive Summary

Spaced repetition is scientifically proven to improve vocabulary retention by up to 200% vs. cramming. SM-2 algorithm (1987) remains foundational; Anki uses modified SM-2 + newer FSRS. For Chrome extensions, simple SM-2 implementation (3-5 variables per card) suffices. Optimal intervals: 1 day → 3-7 days → 1 week → 1 month. Leitner system is manual predecessor; modern approaches are computationally optimized.

---

## 1. SM-2 Algorithm Core

**Three tracked variables per card:**
- **Repetitions (n):** Count of consecutive successful recalls (grade ≥3)
- **Easiness Factor (EF):** Multiplier for interval growth; initial=2.5; minimum=1.3
- **Interval (I):** Days until next review

**Quality grades (0-5):** 0=blackout, 1-2=fail, 3=hard, 4=hesitation, 5=perfect

**Calculation (if quality ≥ 3):**
```
If n=0: I = 1 day
If n=1: I = 6 days
If n>1: I = I_prev × EF_prev
EF = EF_prev + (0.1 - (5-quality) × (0.08 + (5-quality) × 0.02))
EF = max(1.3, EF)
```

**Failure handling (quality < 3):** Reset n=0, repeat card tomorrow.

**Key insight:** EF self-adjusts; harder cards grow intervals slower, prevent "low-interval hell."

---

## 2. Leitner System vs. Computational SR

**Leitner (1970s):** Manual 3-5 box system; cards move forward/backward by recall success. Simple but inefficient—doesn't compute optimal intervals.

**Modern spaced repetition:** Algorithms calculate exact intervals based on forgetting curves + individual performance. Leitner is spaced repetition *principle* without computational optimization.

**For vocabulary:** Both effective, but digital SR requires less effort + better long-term retention. Leitner useful for offline/tactile learners.

---

## 3. Anki Implementation Details

**Two algorithms available (v23.10+):**

| Aspect | SM-2 Modified | FSRS |
|--------|---------------|------|
| Base | 1987 algorithm | 2024 DSR model |
| Learning steps | Fully customizable (default: 1m 10m 1d) | Adaptive scheduling |
| Ease floor | 130% (minimum) | N/A |
| Initial intervals | Configurable (unlike original SM-2) | Algorithm-determined |
| Data required | Simple per-card metrics | 700M+ review history (pre-trained) |

**Key modification vs. original SM-2:** Anki allows custom initial learning steps before interval-based review. This avoids early ease factor damage.

**FSRS advantage:** Requires ~30% fewer reviews for same retention (ML-optimized on massive dataset).

---

## 4. Optimal Intervals for Vocabulary

**Research consensus (cognitive science backed):**

| Phase | Interval | Notes |
|-------|----------|-------|
| Initial | 5-10 min | Encode in working memory |
| Review 1 | 1 day | Critical retention point |
| Review 2 | 3-7 days | Stabilize memory |
| Review 3 | 1 week | Long-term anchoring |
| Review 4 | 1 month | Permanent storage |
| Review 5+ | Variable | Follow forgetting curve |

**Fixed vs. expanding:** Expanding intervals slightly superior, but fixed intervals (e.g., weekly review) also effective. Spacing *principle* matters more than exact intervals.

**Science:** Review just as item approaches forgetting threshold—typically 1-2 weeks after last successful recall.

---

## 5. Chrome Extension Implementation (Simplified SM-2)

**Minimal viable data structure:**
```javascript
{
  id: string,
  word: string,
  quality: number, // 1-5
  n: number,       // repetitions
  ef: number,      // easiness (2.5 default)
  interval: number, // days
  nextReview: Date  // ISO string
}
```

**Core logic (~50 lines):**
```javascript
function scheduleCard(card, quality) {
  if (quality < 3) {
    card.interval = 1;
    card.n = 0;
  } else {
    if (card.n === 0) card.interval = 1;
    else if (card.n === 1) card.interval = 6;
    else card.interval = Math.round(card.interval * card.ef);

    card.n++;
    card.ef = Math.max(1.3,
      card.ef + (0.1 - (5-quality) * (0.08 + (5-quality) * 0.02))
    );
  }
  card.nextReview = new Date(Date.now() + card.interval * 86400000);
}
```

**Storage:** IndexedDB for offline-first architecture. Sync to cloud via extension backend.

**UI:** Show cards due today, render 1-5 rating scale, trigger `scheduleCard()` on submit.

---

## 6. Practical Recommendations

1. **Start with SM-2:** Simpler than FSRS, requires no ML training, works well for 100-1000 cards.
2. **Custom intervals:** Reduce initial learning steps (1m → 10m → 1h) for faster progression vs. Anki defaults.
3. **Quality threshold:** Enforce that <3 ratings trigger immediate re-review (next session), not next day.
4. **EF floor:** Prevent ease below 1.3 to avoid cards getting stuck.
5. **Daily review cap:** Show only N=20-30 cards/day to prevent cognitive overload; queue remainder for future days.

---

## 7. Unresolved Questions

- How to handle user context switching (e.g., offline mode, sync conflicts)?
- Should extension use fixed 1-day initial interval or allow user customization?
- Privacy approach: local-only vs. optional cloud sync?
- A/B test opportunities: fixed vs. expanding intervals for user segment?

---

## Sources

### Official & Authoritative
- [RemNote Help: Anki SM-2 Algorithm](https://help.remnote.com/en/articles/6026144-the-anki-sm-2-spaced-repetition-algorithm)
- [Anki FAQ: Spaced Repetition Algorithm](https://faqs.ankiweb.net/what-spaced-repetition-algorithm)
- [Open Spaced Repetition (FSRS GitHub)](https://github.com/open-spaced-repetition/fsrs4anki)

### Research & Learning Science
- [PMC: Right Time to Learn - Mechanisms & Optimization](https://pmc.ncbi.nlm.nih.gov/articles/PMC5126970/)
- [Traverse: Optimal Spaced Repetition Intervals](https://traverse.link/spaced-repetition/optimal-spaced-repetition-intervals)
- [Retrieval Practice Guide: Spacing Effects](https://pdf.retrievalpractice.org/SpacingGuide.pdf)

### Implementation References
- [GitHub: SM-2 ES6 Implementation](https://github.com/cnnrhill/sm-2)
- [GitHub: DolphinSR (JS SM-2)](https://github.com/yodaiken/dolphinsr)
- [GitHub: Spaced Repetition Chrome Extension](https://github.com/alecashford/spaced_repetition)
- [NPM: @flasd/spaced-repetition](https://www.npmjs.com/package/@flasd/spaced-repetition)

### Comparative Analysis
- [SuperMemo Wiki: Leitner System](https://supermemo.guru/wiki/Leitner_system)
- [Wikipedia: Spaced Repetition](https://en.wikipedia.org/wiki/Spaced_repetition)
- [QuizCat: Top 5 Spaced Repetition Algorithms](https://www.quizcat.ai/blog/top-5-spaced-repetition-algorithms-compared)
