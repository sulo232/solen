# PSYCHOLOGY.md , the behavioral law layer of the Solen design system

<!-- exists-check: net-new vs _design-system/SOURCE.md (aesthetic/component canon, no psych layer) and _rules/SOLEN_UI.md; built 2026-07-07 from the workstream-11 research fleets (80 web researchers + 8 claim-checkers + video brief). Evidence base: _design-system/research/PSYCH_*.md + VIDEO_UXPEAK_PSYCHOLOGY.md. -->

**What this is.** The WHY/WHEN layer: evidence-verified psychology laws for every conversion, retention, and engagement decision. SOURCE.md and LOCKFILE.md say what things look like; this file says what makes users act, stay, and return. On any aesthetic conflict, LOCKFILE wins. On copy/behavior levers, this file is canonical until a dated owner decision in TASTE_LOG supersedes a row.

**How to use it.** Before designing or changing any customer surface: scan the 15 laws, apply the ones the surface touches, and respect the hard lines. Every law names its evidence tier so you know how hard you may lean on it. Full sources: [research/PSYCH_PSYCHOLOGY.md](research/PSYCH_PSYCHOLOGY.md), [research/PSYCH_CONVERSION.md](research/PSYCH_CONVERSION.md), [research/PSYCH_RETENTION.md](research/PSYCH_RETENTION.md), [research/PSYCH_BUSINESS_IMPACT.md](research/PSYCH_BUSINESS_IMPACT.md), [research/VIDEO_UXPEAK_PSYCHOLOGY.md](research/VIDEO_UXPEAK_PSYCHOLOGY.md).

Evidence tiers: **T1** = replicated / meta-analytic / causal design. **T2** = one strong study or converging independent sources. **T3** = directional (vendor / single case), A/B on our own data before trusting magnitude.

---

## The 15 laws

**1. Peak-end: the confirmation screen is the highest-memory-weight surface in the app (T1).**
People judge a whole experience by its peak and its ending, not its average (meta-analysis r=.58; duration barely matters). Our booking confirmation is the one fully-controlled ending. It must be a warm closing moment: staff name, one clear success state, the cycle-timed "book again" prompt. Never stack promos/upsells on it.

**2. Defaults read as recommendations, so pre-select the most common choice (T1).**
Defaults shift choice massively (meta-analysis d=0.68, n=73k; organ-donation 42%→82%). Pre-select "Anyone" staff, highlight the soonest real slot, reuse saved contact/payment for returning users. Hard line: never pre-check anything that costs money or subscribes; that is the dark-pattern twin of the same mechanism.

**3. Never start a user at zero (T2).**
Endowed progress + goal gradient: a stated head start raises completion (19%→34% in the original field study; pace acceleration replicated). Any progress UI credits what is already done (account = step 1 done, not 0%). Loyalty shows a numeric distance to the next tier and seeds head starts only WITH a stated reason ("Willkommensbonus"). After a reward, immediately show the next goal (post-reward slump is real).

**4. Value before auth, guest-first everywhere (T2).**
Forced account creation before value is a top abandonment cause (Baymard: ~19-24% cite it). Browsing, PDP, service/staff/time selection, and favoriting work logged out; the ask at pay is phone/email framed as "save/complete your booking", full account optional after confirmation. Never blur/lock content a user already earned.

**5. Total price transparency from step one (T1 for the harm).**
Late-revealed costs are the single largest abandonment driver (~39-48% cite surprise costs). The full CHF total (service + surcharge + promo + credits) renders on every booking step, not first at Bezahlen. Add-on prices may use a relative label ("2.9% des Preises") ONLY directly next to the visible absolute price, only when genuinely small and fair; relative-only framing of a big charge measurably burns trust.

**6. Stars never render bare (T2).**
Count matters as much as score; a thin 5.0 is suspicious (purchase likelihood peaks ~4.0-4.7; users prefer 4.5 with 57 reviews over 5.0 with 4). Every star shows its count "4.8 (54)". Any ranking/badge weights score x volume (Bayesian average), never raw average. Reviews carry a verified-booking marker (we have the data: every review comes from a real booking). Review ask goes out 1-3 days post-visit, never same-day (two large field experiments: immediate asks produce fewer, worse reviews).

**7. Photos are the decision input, not decoration (T1, causal).**
Professional photos caused +9% occupancy on Airbnb (diff-in-diff, Management Science); 56% of users hit images first. The photo stays the largest card element; hero/card image paint is the LCP priority; no lingering blur. Salon onboarding sets a photo-quality floor.

**8. The first 100ms is the brand (T2).**
Aesthetic and trust judgments form in 50-100ms and barely update. Fast first paint of the hero/cards outranks secondary chrome. Feedback within ~100ms on every tap; ~1s is the flow ceiling; any wait that can exceed ~10s (TWINT/card confirm) gets staged progress copy, never a bare spinner. Skeletons ONLY for full-module loads matching final layout; small inline fetches keep small spinners (skeleton superiority is contested, do not over-apply).

**9. Real numbers only, forever (T1 for the backfire).**
Fabricated/stale scarcity and social proof trigger reactance, anger, and switching once noticed (multiple studies + public shamings). Only server-computed live counts may render. This is already Solen law (no fabricated data); psychology adds: even REAL urgency raises stress, so use it sparingly and only where it genuinely helps the user decide.

**10. Loss-framing only for what is truly theirs, with grace (T1 mechanism, magnitude contested).**
Loss aversion is real but ~1.3-2x, not a fixed 2x, and fades at trivial stakes. Allowed: "Guthaben läuft ab", "Gold halten: 1 Buchung bis 31.08" for at-risk tiers, WITH a named grace mechanic (one missed cycle never silently drops a tier). Banned: loss-framing invented stakes, countdowns on trivia, dishonest dismiss copy. Gain-framing for users still climbing; loss-framing only near a real loss.

**11. Comparability beats trimming (T1 against naive trimming).**
Choice overload is a myth at population level (meta-analysis d≈0.02; jam study failed replication). Do not cap service/staff lists on "paradox of choice" grounds. Instead: group into 3-5 labeled categories, price + duration inline, easy side-by-side comparison. Overload only appears with hard-to-compare options, complexity, time pressure, novice choosers , fix THOSE.

**12. Effort beats delight for repeat behavior (T2).**
Low effort predicts repurchase far better than delight scores (CEB/HBR n=75k; NPS correlates with individual repeat behavior at only r≈.2). The one-tap "Nochmals buchen" (same staff, same service, slot at the service's typical cycle) on confirmation + salon page + bookings list is worth more than any delight flourish. Do not add an NPS survey next to the star rating (redundant, r=.83).

**13. Booking cannot be a habit; Inspo is the habit surface (T2).**
A 3-8 week cycle is below the habit-formation floor (Eyal's own criterion; habit automaticity takes a median 66 days of frequent repetition). Streaks/variable-reward mechanics on booking are miscalibrated by design; reliability IS the booking retention lever (accurate availability: stale calendars cut booking probability 43-70% per the Airbnb rejection study). Habit-design budget goes to Inspo (open-at-will, no purchase intent), with deterministic, not surprise, rewards.

**14. Reminders work; cadence and framing decide how much (T1).**
SMS reminders cut no-shows in RCTs (21.1%→14.2%, n=161k, consequence-framed copy; neutral copy did nothing); a second closer touch adds more. Rebooking nudges fire off behavioral signals (days-since-visit crossing the service's own median cycle, derived per category from our data), never a hardcoded global interval. Non-transactional pushes cap at 2-3/week; settings split by category (Buchungen ON, Angebote/Inspo OFF by default). Volume, not content, drives opt-outs (46% opt out at 2-5/week).

**15. Personalization is additive, never a silent filter (T2).**
Boost and label ("Für dich"), keep the full catalog reachable; one behavioral signal predicts intent too weakly to hide inventory. Applies to the dormant service_categories personalization backend and the Inspo feed ranking.

---

## Hard lines (the ethics bar, all gate-relevant)

1. No fabricated numbers, counts, urgency, or social proof , ever (existing Solen law; psychology adds the evidence it also backfires commercially).
2. No pre-checked paid add-ons or subscriptions.
3. No relative-only price framing that hides the absolute price.
4. No loss-framing of invented stakes; grace before any tier drop.
5. No lock/blur walls before delivered value; no forced account before pay.
6. No dark-pattern countdown on real inventory unless the count is live and user-relevant.
7. Left-digit pricing (.90/.95 endings) is a VALUES call (conflicts with Swiss round-CHF trust convention); never introduce silently, owner decision only.

## Numbers we must never cite (verified myths, full receipts in the research files)

| Popular claim | Status | What we may say instead |
|---|---|---|
| "2,000% from free samples" | refuted, untraceable | sampling lifts short-term purchases; magnitude category-dependent (real range ~70-600% same-day) |
| "70-90% never change defaults" | unsourced blend | defaults are directionally powerful (d=0.68 meta-analysis) |
| "Losses hurt exactly 2x" | contested | ~1.3-2.0, stake-dependent, weak at small stakes |
| Jam study as "fewer options convert better" | failed replication | overload needs moderators; fix comparability |
| "$300M button" / ASOS guest checkout | marketing anecdote | Baymard's 19-24% forced-account abandonment |
| "5% retention = +25-95% profit" | 1990s banking, no beauty basis | measure Solen's own cohort margins |
| "Retention 5-25x cheaper than acquisition" | untraceable range | use our own CAC vs repeat-margin data |
| "Amazon 100ms = 1% sales" | unpublished anecdote | Google/Deloitte 2020: +0.1s ≈ +8.4% conversion (37 sites, production) |
| Duolingo "+20% DAU from delayed signup" | single self-report | directional; A/B on our own funnel |
| "UGC contributors return 4x more" | untraceable | Zhihu/Marketing Science: engaged contributors 11% vs 42% dormancy |

## The improve loop (this file is a basis, not a monument)

- Every A/B result, owner decision, or new study that touches a law gets a dated line appended to the law it affects (same pattern as TASTE_LOG).
- A law proven wrong for Solen gets struck with a dated note, never silently deleted.
- The fable-psychology skill loads this file at task start for design/conversion/retention work; keep the 15 laws tight enough to scan in one read.
- Audit findings live in `_audits/2026-07-07-psychology-audit.md`; when a finding ships, tick it there and cross-reference the law.
