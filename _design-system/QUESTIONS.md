# Solen Design System — Open Questions

**Purpose.** Accumulating decision log. Every drift / unresolved choice /
deferred call gets a numbered entry here. The user reviews in batch (not
mid-build) and picks an option per entry. Resolution flows back into the owning file (LOCKFILE for literals, TASTE_LOG for dated
decisions); precedence is owned by the project CLAUDE.md. This file is the queue.

**Entry shape (all entries follow this):**

```
### Q{n} — short title
**Severity:** HIGH / MED / LOW
**SOURCE.md anchor:** §{n} or N/A
**Question:** one sentence, picks-the-decision form
**Observation:** what's in the code / docs today, with file:line if possible
**Options:**
- A. ... (consequence)
- B. ... (consequence)
- C. ... (consequence)
**Recommendation:** {one option} — {one-sentence why}
**Status:** OPEN / RESOLVED ({date}) / DEFERRED ({reason})
```

**Severity legend:**

- **HIGH** — blocks new work, causes user-visible drift, or rule that future routes will silently violate
- **MED** — will produce design rot if unresolved within ~1 month; not blocking
- **LOW** — stylistic polish, naming, deferred-feature scaffolding

**Process notes:**

- Open questions are sorted Severity → ID. Resolved ones move to bottom of section, marked `RESOLVED ({date}): {decision}`.
- When you add a new question mid-build, append (don't insert mid-list) — keep IDs stable so links don't rot.
- Anything user dictates at runtime that contradicts SOURCE.md goes here as `Q{n}` immediately, severity HIGH.
- Drift checker (when built) cross-references this file by anchor — it skips token usage that has a `Q{n}` saying "live exception until resolved."

---

## Open

### Q35 — Marketplace pitch link destination
**Severity:** LOW · **Status:** OPEN
**SOURCE.md anchor:** N/A
**Question:** Where should /business's "So findest du Solen-Kund:innen →" link route to?
**Observation:** Currently `href="/"` (Solen consumer homepage). Spec §2.5 didn't specify. Surfaced by /business agent (Wave 2).
**Options:**
- A. `/` (current) — sends partners to the consumer surface so they SEE the marketplace
- B. `/search` or `/de/coiffeur` — drops them into a category landing
- C. A dedicated "for partners" content page (doesn't exist yet)
**Recommendation:** A for now — Wave 2 already shipped this. Re-route when a dedicated partner content page exists.

---

### Q34 — Hero overlay CTA: `bg-white` exception lock
**Severity:** MED · **Status:** OPEN (Wave 2 surfaced)
**SOURCE.md anchor:** §2.1 + V3-D192-fix
**Question:** Should the /business hero's primary CTA (`bg-white text-s-ink` on dark image) be documented as a permitted "Hero overlay variant" exception to the V3-D192-fix "primary CTAs stay `bg-s-ink`" lock?
**Observation:** Wave 2 /business spec §5 Q25 deferred this. Currently the hero overlay CTA is white-on-dark for legibility against the cover image — same pattern Fresha uses. Without an explicit exception in SOURCE.md, future agents + drift-checker will flag it as a V3-D192 violation.
**Options:**
- A. Document "Hero overlay variant" exception in SOURCE.md §2.1 + annotate V3-D192-fix lock
- B. Restructure /business hero so primary CTA sits on white substrate (not over image)
- C. Leave as-is, treat each future flag as a known false-positive
**Recommendation:** A — formalize the variant. Add §2.1 note: "when primary CTA sits on dark/photo background, `bg-white text-s-ink` is permitted (Fresha pattern, mirrored)." This is one half-line of doc — keep V3-D192-fix lock intact for non-overlay contexts.

---

### Q33 — RESOLVED: drift checker RETIRED_TOKENS still listed s-accent
**Severity:** HIGH (drift checker correctness) → CLOSED 2026-05-26
**SOURCE.md anchor:** drift-check skill
**Decision:** removed `s-accent`, `s-accent-mid`, `s-accent-deep`, `s-accent-pale`, `s-accent-subtle` from `RETIRED_TOKENS` in `.claude/skills/solen-drift-check/scripts/check.py:95-119`. V3-D204 made `s-accent` the LIVE Solen royal blue brand accent — the previous list was flagging every legitimate Layer 2 use as drift (7+ false positives on /business alone). Marker V3-D221. Old entries kept as commented-out archeology in the script.

---

### Q32 — Salon sticky tab nav: minimal tabs-only, or Fresha-parity name+icons+tabs?
**Severity:** MED · **Status:** OPEN
**SOURCE.md anchor:** N/A (component-level)
**Question:** When the salon sticky tab nav fades in past the hero, should it stay minimal (just tabs) or adopt Fresha's pattern of `← Salon Name · Share · Heart` row + tab strip below?

**Observation:**
- Current Solen impl (`SalonStickyTabNav.tsx`, V3-D206): single row of tabs only, ~50px tall, `z-[60]` so it eclipses the site header on scroll
- Fresha (`/Users/sulo/solen/screenshots/IMG_4729.png`): two-row bar — top row has back-arrow + salon name (truncated) + share + heart icons; bottom row is the tab strip. Total height ~90-100px
- Bumping to Fresha pattern adds ~50px of fixed-top chrome but provides "in-app deep-link page" feel — back arrow + share+heart are useful right next to the tab strip (especially on long pages where user can't see the hero overlay icons anymore)
- Side-effect: site header still sits at z-50 — even with our z-[60] tab nav, when scrolled the user effectively loses the Solen logo+menu access. Adding salon name to the nav would compensate

**Options:**
- A. Keep minimal tabs-only (current). Trade-off: cleaner but no quick "share/heart/back" at scroll position
- B. Adopt Fresha 2-row pattern (name + icons + tabs). Trade-off: matches reference, more useful at scroll, but +50px of always-visible chrome and the site header below is fully occluded
- C. Single row hybrid: shrink site header to nothing on `/salon/[slug]` route — let the salon tab nav fully replace the site header chrome. Out of scope (touches Header.tsx)

**Recommendation:** B — adopt Fresha 2-row pattern. Justified because (1) on a long detail page the user IS in a "deep page" mode where the salon-specific affordances (share/heart) matter more than site nav, and (2) it eliminates the visual ambiguity of "where did the Solen header go" by clearly replacing it with a salon-specific bar.

**Implementation note (when resolved):** Add a top sub-row inside `SalonStickyTabNav` w `← Salon name [Share][Heart]`. Pass salon prop from orchestrator. Keep tabs below.

---

### Wave 1 open questions — to resolve INLINE during their respective rebuild
**Severity:** MED · **Status:** OPEN (user picked inline-resolve, not batch)
**SOURCE.md anchor:** N/A — per-route

These came out of Wave 1 audits. User picked Path B (resolve inline as each rebuild encounters them). Tracking here so they're not forgotten:

**From Agent A (`/salon/[slug]` spec) — `_tasks/rebuild-specs/salon-detail.md`:**
- **R1** — open/closed status color. Agent recommends `text-s-success` for "Geöffnet" + `text-s-ink-3` for "Geschlossen." V3-D197 confirms this (Layer 3 semantic UI). Resolve during StatusPill build.
- **R10** — SalonAppCta chips link to `/de/{city.toLowerCase()}` (e.g. `/de/basel`) which may 404. Agent recommends safe-fallback to `/search?city=X` until those routes exist. Resolve during Phase A SalonAppCta touch.

**From Agent B (`/business` spec) — `_tasks/rebuild-specs/business.md`:**
- **Q22** Marketplace visual: SalonCards stack OR CH map (rec: SalonCards — proves marketplace concretely)
- **Q23** Testimonials: ship empty section OR omit (rec: omit — §18 voice rule: never invent claims)
- **Q24** Hero second CTA destination (rec: anchor)
- **Q25** Hero primary CTA white-on-dark OR bg-s-ink (rec: document exception with V3-D{n} comment)
- **Q26** /business sub-routes: single-page anchors OR separate routes (rec: anchors — fixes ghost 404s)
- **Q27** BentoCard 3D tilt keep/downgrade/remove (rec: keep + document)
- **Q28** V3-D{n} reservation V3-D194-V3-D213 for /business rebuild — RESERVED for Wave 2 work
- **Q29** BusinessTeaser leave alone (rec: yes, defer per separate scope)

**From Agent C (category routes spec) — `_tasks/rebuild-specs/category-routes.md`:**
- Map default state on desktop (rec: closed — Swiss city density)
- Directory cards (Google non-bookable): separate "Auch in Basel" section OR mixed grid (rec: separate section, §8 card grammar)
- Favorites server-side wiring: new `FavoritesContext` provider (rec: yes)

---

### Q31 — RESOLVED: saturation contract (HSL bands for `.DEFAULT` + `.bg`)
**Severity:** MED (system rigor) → CLOSED 2026-05-26
**SOURCE.md anchor:** §1 (after universal colors table)
**Question:** When we add ANY new color token, what's the rule for saturation + lightness so it fits the visual language?
**Decision (V3-D199):** Every semantic color must come in two forms:
- `.DEFAULT` — saturated signal — L 36-51%, S 65-92% (Tailwind-500/600 range)
- `.bg` / `.pale` — pastel surface — L 93-96%, S 25-100% (Tailwind-50 range)

When introducing a new token, both forms must be defined together. Pastel computed by keeping the hue and pushing L → ~93%, lowering S as needed for tint perception.

**Why:** Without this rule, future tokens (e.g. `s-premium`, `s-verified`, `s-live`) would land at arbitrary HSL — some too dark to read as signal, some too light to register as surface tint. Locked HSL bands make additions automatic.

**Tested against existing tokens:** s-success / s-error / s-warning / s-accent all sit inside the band correctly. The bands describe the visual language already shipping.

---

### Q30 — RESOLVED: three-layer color system + universal-color convention
**Severity:** HIGH (rule clarification) → CLOSED 2026-05-26
**SOURCE.md anchor:** §1, §2.5, §14.0
**Trigger:** Agent D shipped Toast with "all ink chrome + 5px semantic dot" — read SOURCE.md §1 literally and applied "B&W chrome + sanctioned signals only." User: "this is gnna happen again this is not a fundemental fix bro."

**Diagnosis:** §1 rule was structurally incomplete. It had Layer 1 (chrome) + Layer 2 (3% accent) + 4 listed signal pinpoints. **Missing: Layer 3 — surfaces whose color IS the meaning** (Toast tones, StatusPill open/closed, AlertBanner, FormFieldError, ProgressBar state, urgency badges). Every component in that class would re-hit the same wall.

**Decision (V3-D197):** Rewrite §1 as a **three-layer system**:
- **Layer 1 Chrome** (~97% — 80 white + 17 ink) — color is NOT the message
- **Layer 2 Brand accent** (~3%) — royal blue, Apple-style highlight moments
- **Layer 3 Semantic UI** (unbudgeted, each instance small) — color IS the message, use universal hues

**Plus codify universal-color convention:** Solen uses the colors humans already recognize from a lifetime of UI exposure. We do NOT invent custom semantic hues. Standard mapping:
- success → green `s-success #16A34A`
- error → red `s-error #DC2626` (one-red V3-D421; hex corrected 2026-07-12)
- warning → amber `s-warning #F59E0B`
- info / brand → blue `s-accent #1638C4`
- rating → yellow `s-star #FFC32B`
- save → hot pink `--heart-active #FF3366`
- urgency → vermilion `s-urgency #C2410C on #FFF1E6` (V3-D424; hex corrected 2026-07-12)
- disabled → muted grey `s-ink-3`

**Plus §14.0 decision tree:** before writing ANY color class, answer 3 questions in order (does color = meaning? → brand? → default chrome). Every new component's .md must declare `Layer: 1 / 2 / 3` so it's grep-able.

**Plus §2.5 semantic UI surfaces catalog:** every Layer-3 surface listed with token + class. Adding to catalog requires QUESTIONS.md proposal before inventing.

**What this prevents going forward:**
- Future StatusPill, AlertBanner, FormFieldError, ProgressBar, validation states — automatically use universal hues, not Agent-D-style "B&W + dot"
- Sub-agents in route rebuilds inherit the decision tree in their brief
- Universal color convention means we ride humans' existing UI intuition instead of inventing

**Files updated:** `_design-system/SOURCE.md` §1, §2.3, §2.5, §14.0

---

### Q21 — RESOLVED: Royal Blue activated as Solen accent (Apple-style, NOT primary-CTA)
**Severity:** HIGH (color law change) → CLOSED 2026-05-26
**SOURCE.md anchor:** §1, §2.1
**Decision:** Royal Blue `#1638C4` is THE Solen accent. Activated as `s-accent` token in `tailwind.config.js` with `.deep` (hover) and `.pale` (wash) variants. **Used Apple-style on small highlight moments, NOT on primary CTAs (V3-D192-fix correction):**
- Section eyebrow text + bullet `●` (Bei dir zuletzt / Profis in deiner Nähe / etc.) ✓
- Future: link colors, "NEW"/status pills, active/selected tab state, SectionTitle arrow

**NOT used on:**
- Primary CTAs (Hero "Termine finden", Picker "Suchen") — these stay `bg-s-ink`. Per user: "no accent color not primary bro." Accent ≠ primary action surface. If blue IS the dominant button, the eye has nowhere to "land as accent."

**First-attempt mistake (V3-D192, reverted):** I initially applied blue to the primary CTA assuming Uber-pattern. User clarified: accent is the SECONDARY highlight role (Apple's blue links, not Uber's green CTA). Reverted within minutes.

**Supersedes:** V3-D189 "no accent" lock (pure B&W experiment, 2026-05-25 → 2026-05-26). Verdict on the experiment: too restrained for a beauty/wellness register, no place for the eye to land.

**Does NOT supersede:** V3-D146 retiring `s-brand` (green). Green stays retired. Blue replaces it as the brand accent.

**Single-token revert path:** Change `s-accent.DEFAULT` in `tailwind.config.js` from `#1638C4` → `#0A0A0A` (or comment out the token). All callsites collapse back to ink-on-white.

**Why royal blue specifically (vs alternatives):**
- Reserved per 2026-05-25 palette-pivot memory — already in the system
- Swiss-modern default (UBS / Postfinance / Swisscom convention)
- AAA contrast on white (9.6:1) — exceeds the AA Normal `s-ink` reached
- Domain-neutral: works for booking/wellness without leaning corporate-cold (beauty register stays warm through photography + signal colors)

**User reference image:** "NEW" pill in royal blue from a generic UI mockup, attached 2026-05-26. Color sampled to match the reserved `#1638C4` token (close enough; user can dial if needed).

---

## Resolved (2026-05-26 batch)

### Q1 — RESOLVED: Star yellow is locked, universal signal
**Severity:** HIGH (was) → CLOSED
**SOURCE.md anchor:** §2.1, §9.4
**Decision (option B):** Yellow `#FFC32B` is the universal star-rating color. It's a SIGNAL color (like heart pink), NOT in the 3% accent band. Update `tailwind.config.js` `s-star` token from `#1A1A1A` (ink) → `#FFC32B`, and supersede V3-D95 ("never yellow") explicitly in SOURCE.md §9.4.
**Why:** User: "always yellow tf universal color principal bro." Yellow star is industry-universal (Google/Yelp/Airbnb/TripAdvisor) and shipping cleanly across SalonCard, Reviews, FeaturedStylists. V3-D95 was an aspirational moment that didn't survive contact with reality.
**Action follow-ups:** (1) update `tailwind.config.js` `s-star: "#FFC32B"`; (2) drop the V3-D95 provenance comment language across files; (3) SOURCE.md §9 already calls yellow a signal exception — make explicit in §2.1.

### Q2 — RESOLVED: Audit-then-delete retired easings
**Severity:** HIGH (was) → CLOSED, transitions into multi-step plan
**SOURCE.md anchor:** §6
**Decision (option C):** Run drift-checker pilot to surface all retired-easing callsites, fix each one, THEN delete from `tailwind.config.js`. Safe migration: no risk of silent breakage.
**Why:** User picked C. Matches the same audit-first pattern as Q3 + Q5.
**Action follow-ups:** (1) drift-checker rule A4 already flags retired easings; (2) run on full informational scope; (3) PR-by-PR migrate the callsites; (4) delete the 7 retired aliases from config once usage drops to zero.

### Q3 — RESOLVED: Audit-then-batch-delete retired color tokens
**Severity:** HIGH (was) → CLOSED, transitions into multi-step plan
**SOURCE.md anchor:** §2.2
**Decision (option C):** Drift-checker reports usage; dedicated PR deletes all retired tokens from `tailwind.config.js` once usage drops to zero. Same pattern as Q2.
**Why:** User picked C. Non-breaking + clean endpoint.
**Action follow-ups:** drift-checker rule A5 flags retired tokens; once `_pending-migration.md` shows zero usage, batch-delete in single PR. Hard backstop date: **2026-08-26** (Q15).

### Q4 — RESOLVED: Plus Jakarta → Hanken in globals.css
**Severity:** HIGH (was) → CLOSED, code already changed
**SOURCE.md anchor:** §3
**Decision (option A):** Fixed immediately. `app/globals.css` lines 273 (input rule), 699, 705 (driver-popover) all migrated from `"Plus Jakarta Sans"` → `"Hanken Grotesk"`. V3-D189 provenance comment added.
**Why:** Straight bug, 1-line per occurrence, no risk. Form inputs now match body font.
**Verified:** preview_eval reports `input` computed `fontFamily: '"Hanken Grotesk", system-ui, -apple-system, sans-serif'`.

### Q5 — RESOLVED: Focus ring → `s-ink` `#0A0A0A`
**Severity:** HIGH (was) → CLOSED, code already changed
**SOURCE.md anchor:** §16
**Decision (option A):** Focus ring migrated from pre-B&W teal `#043338` → `s-ink #0A0A0A`. `app/globals.css` outline (line 302), input border (line 312), input box-shadow (line 313), driver-popover theme-color (line 689), next-btn bg (line 727) all updated. V3-D189 provenance added.
**Why:** B&W pivot means chrome is ink-only. 2px ink on white = ~5.8:1 contrast (passes WCAG 1.4.11 / 2.4.7 AA Normal — exceeds AA Large).
**Verified:** preview_eval reports `button:focus-visible` outline: `rgb(10, 10, 10) solid 2px`.

### Q6 — RESOLVED: Fix dead clicks as touched
**Severity:** HIGH (was) → CLOSED
**SOURCE.md anchor:** §11
**Decision (option A):** Fix dead clicks one at a time as routes are touched. Slowest path but never breaks unrelated routes. No upfront sweep.
**Why:** User picked A. Pragmatic — drift-checker logs them all, fixes happen during natural route work.
**Action follow-ups:** drift-checker rule B1 catches `onClick={() => {}}`; rule B2 catches `href="#"` / `href=""`. Known instances: Bell icon in Header (already wired post-V3-D188), SaveHeart in FeaturedStylists (local state, awaiting Q11 backend wiring).

### Q7 — RESOLVED: Storybook-lite at hidden Next.js dev route
**Severity:** MED (was) → CLOSED, scheduled for future session
**SOURCE.md anchor:** N/A
**Decision (option A):** Path 1 — `app/[locale]/dev/design-system/page.tsx` that renders REAL components, gated by `process.env.NODE_ENV !== "production"`. Live motion + interactivity come free because components ARE the showcase.
**Why:** User picked A. Real components > screenshots of components per council. Worth the ~4hr build because drift cost over time crushes the upfront delta.
**Action follow-ups:** Schedule for a dedicated future session. Skill stub TBD.

### Q8 — RESOLVED: Central `_rebuilt_routes.json` allowlist
**Severity:** MED (was) → CLOSED
**SOURCE.md anchor:** N/A
**Decision (option A):** Use `_design-system/_rebuilt_routes.json` `strict_globs` as central allowlist. Already implemented + verified.
**Why:** Simplest mental model. PR-friendly. Per-file markers tend to rot when devs don't know about them.
**Status:** Already shipped — drift-checker reads the JSON, splits scope into strict vs informational. Pilot on SalonCard returned 44 strict findings.

### Q9 — RESOLVED: Batch-audit all `z-[X]` arbitrary values
**Severity:** MED (was) → CLOSED, scheduled
**SOURCE.md anchor:** §12
**Decision (option B):** Audit all `z-[X]` arbitrary values in the codebase, migrate to `z-nav / z-overlay / z-modal / z-sheet / z-toast / z-tooltip` tokens in batch.
**Why:** User picked B. Finds all instances (MobileMenu, CityTopBar, Modal, etc.) and unifies in one pass instead of trickling.
**Action follow-ups:** (1) `grep -rn "z-\[" app/` for full audit; (2) PR replaces each with the right semantic token; (3) drift-checker rule A2 will catch new arbitrary z-values going forward.

### Q10 — RESOLVED: Audit SOLEN_UI.md token references now
**Severity:** MED (was) → CLOSED, scheduled for follow-up
**SOURCE.md anchor:** §0
**Decision (option A):** Audit + refresh `_rules/SOLEN_UI.md` for retired token references now (not deferred). Universal UI rules with stale token examples mislead readers.
**Why:** User picked A. Examples that reference retired tokens (`s-coral` etc.) actively confuse — better to fix early than let them rot.
**Action follow-ups:** Run a SOLEN_UI.md pass — every code snippet referencing a token gets verified against current `tailwind.config.js`.

### Q11 — RESOLVED: Wire stylist_id to /api/favorites/toggle
**Severity:** MED (was) → CLOSED, scheduled
**SOURCE.md anchor:** §11
**Decision (option A):** Add `stylist_id` column to favorites table + accept it in the toggle endpoint. Wire SaveHeart to persist via real API. Restores §11 Clickable Surface Contract integrity for the stylist save flow.
**Why:** User picked A. Small backend lift; "documented exception" was acceptable short-term but expensive over time.
**Action follow-ups:** (1) SQL migration adding `favorites.stylist_id`; (2) /api/favorites/toggle handler updated; (3) SaveHeart in FeaturedStylists wired to API.

### Q12 — RESOLVED: Audit + build out current Toast.tsx
**Severity:** MED (was) → CLOSED, scheduled
**SOURCE.md anchor:** §11 (Coming Soon affordance) + §10 (error/rollback)
**Decision (option A):** Read current `app/[locale]/_components/primitives/Toast.tsx`, build out if missing/incomplete. Custom (no library) — ~40 lines matches our motion + B&W look better than third-party defaults.
**Why:** User picked A. Aligns with the "no unnecessary dependencies" pattern + own-the-motion principle.
**Action follow-ups:** Read Toast.tsx → assess state → flesh out the primitive → write `_design-system/components/Toast.md` in same turn (CLAUDE.md rule).

### Q13 — RESOLVED: Dynamic year (already shipped)
**Severity:** LOW (was) → CLOSED, no action needed
**SOURCE.md anchor:** N/A
**Decision (option A):** Already implemented. `app/[locale]/_components/layout/Footer.tsx:210` uses `© {new Date().getFullYear()} Solen.ch`.
**Note:** Decorative "SOLEN · SCHWEIZ · 2026" on the SolenStamp SVG (line 256) is intentional brand-mark copy and stays hardcoded — it's not a copyright statement.

### Q14 — RESOLVED: Utility class + `<Skeleton>` primitive
**Severity:** MED (was) → CLOSED, scheduled
**SOURCE.md anchor:** §10
**Decision (option C):** Both — utility class for ad-hoc (already in globals.css), plus a `<Skeleton width height rounded />` wrapper component for the common case.
**Why:** User picked C. Wrapper covers the 80% case while the utility stays available for one-off layouts.
**Action follow-ups:** (1) confirm `.skeleton-shimmer` keyframe + animation defined; (2) build `<Skeleton>` primitive at `app/[locale]/_components/primitives/Skeleton.tsx`; (3) write `_design-system/components/Skeleton.md`.

### Q15 — RESOLVED: Soft + hard deletion timeline for retired tokens
**Severity:** MED (was) → CLOSED
**SOURCE.md anchor:** §2.2
**Decision (option C):** Soft deletion when drift-checker hits zero usage (per Q3); HARD backstop **2026-08-26** (3 months). Anything still using a retired token by 2026-08-26 becomes a build-breaking error.
**Why:** User picked C. Best of both: gradual migration target + hard endpoint prevents indefinite zombie tokens.

### Q16 — RESOLVED: Build `<ComingSoon>` HOC/wrapper component
**Severity:** MED (was) → CLOSED, scheduled
**SOURCE.md anchor:** §11 (option D)
**Decision (option C):** Build a `<ComingSoon>` wrapper component that applies the standard pattern (`opacity-50 cursor-not-allowed` + toast on click + aria-label suffix). Single source of truth.
**Why:** User picked C. Wraps the pattern in one component so callers can't accidentally diverge.
**Action follow-ups:** (1) build `app/[locale]/_components/primitives/ComingSoon.tsx`; (2) write `_design-system/components/ComingSoon.md`; (3) update §11 with the wrapper as the canonical option D implementation.

### Q17 — RESOLVED: Sweep i18n strings as touched
**Severity:** LOW (was) → CLOSED
**SOURCE.md anchor:** §17
**Decision (option B):** Move hardcoded German strings to `messages/de.json` only as files are naturally touched. No upfront sweep. No drift-checker rule for hardcoded German (false-positive risk).
**Why:** User picked B. Pragmatic — full sweep right now is busywork; gradual happens organically.

### Q18 — RESOLVED: Global V3-D{n} counter
**Severity:** LOW (was) → CLOSED
**SOURCE.md anchor:** §15
**Decision (option A):** Global incrementing counter. Numbers stay grep-able across the codebase. No reset per file.
**Why:** User picked A. Current behavior. Numbers are cheap; greppability is the whole point.

### Q19 — RESOLVED: Brand-chrome-B&W + content-color
**Severity:** LOW (was) → CLOSED
**SOURCE.md anchor:** §9
**Decision (option A):** Current behavior is correct — brand chrome (cards, buttons, UI) stays B&W; user-uploaded photos stay in their natural color. SaveHeart pink + star yellow are signal-color exceptions, not chrome.
**Why:** User picked A. Photographs are content; chrome is brand. Desaturating user photos would lose salon identity (matters for a beauty-booking app).
**Status:** Already shipping correctly. No code change; SOURCE.md §9 lockable.

### Q20 — RESOLVED: Incremental IA reference index + Chrome as Mobbin fallback
**Severity:** LOW (was) → CLOSED
**SOURCE.md anchor:** §21
**Decision (option B + addition):** Build `_design-system/_ia_reference.md` incrementally as routes are rebuilt — each new route adds its Fresha IA reference. **AND**: when Mobbin doesn't have a screen, capture from Fresha live in Chrome (Playwright or manual). Use both sources.
**Why:** User picked B + added the Chrome fallback. Mobbin is curated but incomplete; Fresha live in Chrome covers everything Mobbin doesn't.
**Action follow-ups:** Update SOURCE.md §21 with the Chrome-live capture pattern. Note that Playwright headless can scrape Fresha at standard viewports (375/768/1440) for measurement-grade references.

---

### Q21 — Notification-count badge color: red or ink?
**Severity:** LOW
**SOURCE.md anchor:** LOCKFILE §13.3 (badge taxonomy)
**Question:** Should the unread-notification count badge (the small numeral pill on the bell/tab) be red `s-error #DC2626` or neutral ink?
**Observation:** Every other badge color is locked in §13.3 (selected=ink, done/success=green, rating=yellow, saved=pink). The count badge is the one open slot. Near-universal mobile convention (iOS springboard, Instagram) is a RED count pill.
**Options:**
- A. **Red `s-error #DC2626`** + white numeral, `99+` cap (recommended). Matches every reference; reads as "unread count," not "error," because shape+context differ from an inline error message.
- B. **Ink** count pill. Calmer, on-brand B&W, but loses the instant "you have new things" signal — a neutral count is easy to miss.
- C. **Blue `s-accent`.** Ties the count to the interactivity layer, but blue=interactivity not count, and it competes with real links.
**Recommendation:** A (red) — the convention is strong enough that a tiny numeral pill on a bell reads as count, not error; the §13.3 default is already red pending this confirmation.
**Status:** OPEN

When you (Claude) discover a new drift/decision during a build:

1. Append the next `Q{n}` to the **Open** section above.
2. Don't insert mid-list; just append. IDs stay stable.
3. Cross-reference from `SOURCE.md` if relevant (e.g. add `(Q{n})` next to the line that triggered the entry).
4. If user makes a runtime decision that contradicts SOURCE.md, log immediately + flag in next turn.

When the user resolves a question:

1. Mark `Status: RESOLVED ({date}): {decision text}`.
2. Move to **Resolved** section at bottom.
3. Update `SOURCE.md` to bake the decision in.
4. If a drift-checker rule encoded the open question (e.g. `// suppressed: Q1`), update the rule.

## Q-2026-06-11-slot-radius
Booking mockup 04 draws time slots as 12px-radius rectangles; the shared DateTimePicker
primitive renders 999px pills (both booking + search use it). Changing the primitive
would also restyle search (owner-approved as-is). Which shape is canonical for slots?
Until answered: pills stay (primitive untouched), mockup 04 diverges on this one detail.

## Q-2026-06-12-deep-page-title-pattern + i18n debt
PATTERN (owner 2026-06-12 "you didn't apply it everywhere"): deep profile sub-pages
show their title in the GLOBAL Header beside the back tile (`deepPageTitle` map in
Header.tsx), and each page's own body `<h1>` is removed — title appears once, in the
bar, mirroring the booking Zahlung/Bestätigen step header. Rolled out to all live
profile pages (settings/bookings/gift-cards/haarprofil/vouchers/intake-forms/referral
+ the original favorites/stamps/looks). Redundant breadcrumbs (vouchers, referral) were
removed in the same pass (the back tile replaces them). NEW profile sub-page → add a
TITLES entry in Header.tsx AND omit a body h1 (don't reintroduce the stacked title).
DEBT: the 10 chip labels are HARDCODED German on purpose — the span renders on the
global header for EVERY route, so a missing i18n key there would throw and white-screen
the whole app. fr/it/en currently see German chips. Fix later as ONE guarded pass (a
`pageTitles` namespace with a literal fallback), not piecemeal. Non-profile deep pages
(e.g. /notifications, /help) are NOT yet covered — extend the same way if owner wants.

### Q22 — Team section: grouped list-card or individual entity-cards? (a real LOCKFILE contradiction)
**Severity:** MED
**SOURCE.md anchor:** N/A (LOCKFILE radius table)
**Question:** Is the salon-PDP Team section a §427 grouped list-card (staff as category members) or §428 individual entity-cards (each stylist their own card)?
**Observation:** Both LOCKFILE rows are dated 2026-07-19 and contradict for Team: the grouped row lists "staff", the entity row says "stylists are individual not groups". Today Team ships as ONE §427 group card wrapping the avatar-scroll (consistent with Services/Reviews, verified rendered).
**Options:**
- A. Keep §427 group card (as shipped , consistent PDP section rhythm; the "individual" rule applies to the booking stylist PICKER, not the PDP showcase row).
- B. Individual entity-cards per stylist on the PDP too (consistent with the booking picker; breaks the 3-section rhythm).
**Recommendation:** A — the PDP Team row is a SHOWCASE of category members inside one section; the booking picker is where each stylist is a selectable ENTITY.

### Q23 — PDP map: tap behavior + pin accuracy
**Severity:** MED
**SOURCE.md anchor:** N/A
**Question:** When the customer taps the map, what happens , and is the pin location wrong?
**Observation:** Today: static Mapbox image (hover-scale removed per owner), whole image is an `<a>` to a Google-Maps ADDRESS SEARCH. Owner: "not accurate + not clickable". Pin renders at the salon's stored coords (seed data). An inline interactive mini-map was tried before and felt "stuck" (code comment).
**Options:**
- A. Keep static; tap opens Google Maps pinned to the EXACT coords (not address search); make tappability obvious (a small "open in Maps" chip on the image). Fix seed coords if wrong.
- B. Tap expands an inline interactive map (re-tries the approach that previously felt stuck).
**Recommendation:** A — keeps the calm static section, fixes accuracy + affordance, avoids re-shipping the known-bad inline map.

### Q24 — Reviews section content direction
**Severity:** HIGH (owner called the current one broken)
**SOURCE.md anchor:** N/A
**Question:** Which direction for the salon-PDP reviews content (the bare blue "(11)" + long stack must die)?
**Options:**
- A. Summary-first compact: star + value, count folded into the ink see-all ("Alle 11 Bewertungen ›"), then the 2 best reviews, gap-separated. Shortest.
- B. Distribution-led: 5-bar star histogram + one featured review. NOTE: a code comment says the histogram was dropped per owner , needs an explicit un-drop.
- C. Featured-voice: one hero review + a chrome-less horizontal peek row.
**Recommendation:** A — kills both named defects (bare count, too long) with zero re-proposal risk.

### Q25 — French register: `tu` (matching German/Italian) or `vous` (current default)? (copy-i18n-03)
**Severity:** HIGH (brand-voice decision, touches messages/fr.json site-wide)
**SOURCE.md anchor:** §18 (Voice register), §20 locked-decisions table
**Question:** German is locked `du` (informal) "per audience research" (§18) and Italian independently converged the same way (245 informal `tuo/tua/tu` tokens vs 1 formal `Suo`). French never got an explicit decision and defaulted to formal: `messages/fr.json` measures 229 formal (`votre`/`vos`) tokens vs 46 informal (`tu`/`ton`/`ta`/`tes`), the inverse ratio of German and Italian, including on core marketing surfaces (home.hero_title "Votre salon a Bale", home.partner.subtitle). Does the same warmth/distance rationale that locked German and Italian to informal apply to French, or is there a real reason (French `tu` can read more presumptuous to a French-Swiss audience than German `du` does) that French should stay `vous`?
**Options:**
- A. Switch French to `tu`, matching German/Italian and the stated warmth rationale (RATIONALE.md:524, "informal address reads warmer and faster; formality signals distance"). Requires a full pass over `messages/fr.json` (5669 leaf keys) converting `votre/vos/vous` to `ton/ta/tes/tu`, the same scale of work as the German du-not-Sie sweep but across the WHOLE file, not a handful of drifted keys.
- B. Keep French `vous`, decide it is a deliberate, named exception (French-Swiss audience research or a different distance convention), and record that reasoning in §18/§20 so it stops looking like undecided drift.
**Recommendation:** A, on the evidence (both other non-English locales converged there independently, and the app's own stated rationale for the choice is audience-general, not German-specific) , but this is a real brand-voice call, not a mechanical fix: it changes how ~5,600 French strings sound and is the kind of decision rule 5 (goal, not action) and the verifier-loop's "brand voice needs owner sign-off" carve-out both flag as needing the owner's yes before a site-wide rewrite, not an agent's unilateral judgment call.
**Status:** OPEN, queued for owner (2026-07-27, copy-i18n-03). Not implemented pending the decision.

### Q26 — "ab CHF X" on a single flat-priced service: legal, or needs a data gate? (copy-i18n-11)
**Severity:** MEDIUM (Swiss consumer-protection exposure once salons enter live prices, pre-launch today)
**SOURCE.md anchor:** N/A (LOCKFILE "ab CHF" typography rows, `_rules/LEGAL_COPY.md`)
**Question:** `app/[locale]/_components/search/SearchOverlay.tsx:667` shows "ab {price}" for ONE named service's single flat `price` (e.g. "Herrenschnitt, ab CHF 45") in the search-suggestion list. The Service row has no price-tier array; a salon's `PricingRule` rows (weekend/peak/holiday surcharge, last-minute/off-peak discount) can move the final charged price up or down from that base. Does Swiss price-display law (Preisbekanntgabeverordnung) require this to be data-gated (only show "ab" when a discount PricingRule could make it cheaper; otherwise show a flat "CHF 45", no "ab"), or is showing "ab" uniformly fine given surcharge/discount rules already introduce real variance?
**Options:**
- A. Data-gate: "ab" only when the service has an applicable discount-type PricingRule; otherwise flat price, no prefix. Needs a backend join (service -> its salon's active discount PricingRules) before render.
- B. Keep uniform "ab": PricingRule-driven variance (surcharges can push price up, discounts can pull it down) is treated as sufficient "the floor can move" justification for every priced service.
- C. Get actual legal read (not an agent guess) on whether the PBV cares about the DIRECTION of variance (a floor that can only go UP via surcharge is arguably NOT a legitimate "from" price) before picking A or B.
**Recommendation:** C first, this turns on a real regulatory reading this codebase cannot resolve by itself (confidence: assume, not verified, per the original research finding); A is the safer default if a decision is needed without legal review, since it never OVERSTATES a floor that surcharges could push above the displayed number.
**Status:** OPEN, queued for owner (2026-07-27, copy-i18n-11). Not implemented pending the decision; full writeup in `_rules/LEGAL_COPY.md`.

### Q27 — SMS/email reminder window (23.5-24.5h, 0.5-1.5h): parked as a global constant until a real per-salon need shows up (seo-comms-11)
**Severity:** LOW (deliberately parked, not a bug)
**SOURCE.md anchor:** N/A
**Question:** `app/api/cron/sms-reminders/route.ts:44-45` hardcodes the 24h reminder window (`win24hStart`/`win24hEnd`, 23.5h-24.5h before the booking) and the matching 1h window (0.5h-1.5h, line 21 comment) as literal numeric constants, not a `salons.*` column. Whether-to-send-at-all is already a per-salon toggle (`sms_reminder_24h`/`sms_reminder_1h`); only the timing itself is global. Should this become a per-salon or per-category configurable window?
**Options:**
- A. Leave it a global constant. At 28 seed salons with no evidence any category wants a different cadence, a settings UI for reminder timing is premature machinery.
- B. Add a `salons.sms_reminder_window_hours` (or per-category default) column now, ahead of any demonstrated need.
**Recommendation:** A. This is a scale-discipline call, not a criticism of the current value: build the settings column the moment a salon owner asks for a different window, or once a category (spa/nails with longer service times wanting more notice) or booking-cancellation-due-to-late-reminder complaints appear in support data. Until one of those triggers fires, the global constant is correct, not merely tolerated.
**Status:** PARKED (2026-07-27, seo-comms-11). No code change; this note names the trigger so the next person who touches sms-reminders/route.ts does not have to re-derive whether the hardcoding was a decision or an oversight.
