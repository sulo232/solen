# Solen — Phase 0 Detailed Map

> Foundation work derived from the 6-agent audit (`_audits/_chunks/audit-{1..6}-*.md`). Executes BEFORE Phase 1 in `_tasks/SOLEN_BUILD_MAP.md`.
>
> **Scope:** source-of-truth reconciliation + token contract + rules alignment + mechanical dark-mode purge. **No new components built in Phase 0.** Component build starts in Phase 1.
>
> **Working principle:** every step lands as its own commit. Verify after each. If anything breaks, stop, diagnose, do not paper over.

---

## Sub-phase index

| # | Sub-phase | Files touched | Risk | ETA | Blocks |
|---|---|---|---|---|---|
| **0a** | Source-of-truth reconciliation | `_tasks/SOLEN_DESIGN.md` (§2, §18, 3 Q-locks) | very low | ~15 min | 0b–0d |
| **0b** | Token contract migration | `tailwind.config.js`, `app/globals.css`, `app/layout.tsx` | medium | ~45 min | Phases 1–7 |
| **0c** | Rules alignment | 8 `_rules/*.md` files | low | ~45 min | — |
| **0d** | Dark-mode mechanical purge | ~254 `components/**` files + `app/[locale]/layout.tsx` | low (mechanical) | ~30 min | Phase 1+ visual QA |
| **0e** | Verification + smoke test | n/a (read-only) | n/a | ~15 min | — |

**Total Phase 0 estimate: ~2.5 hours wall-clock.**

---

## Sub-phase 0a — Source-of-truth reconciliation

**Why first:** `SOLEN_DESIGN.md` §2 and §18 still declare Bebas Neue / Fraunces / DM Sans, contradicting §20 Q23 + Q48. Three Q-locks cite file paths that don't exist. Fixing the source of truth must precede aligning rule files or migrating token configs — otherwise we're aligning to half-correct data.

### Step 0a.0 — Pre-edit recon

Before editing §2/§18, grep to see what's actually there (the audit only flagged that it's wrong, didn't quote the exact text):

```bash
grep -n "Bebas Neue\|Fraunces\|DM Sans\|Plus Jakarta\|Outfit\|Syne\|Anton\|Figtree" _tasks/SOLEN_DESIGN.md | head -40
```

This confirms what to replace and where. Adjust step 0a.1 + 0a.2 content based on what actually exists.

### Step 0a.1 — Reconcile `SOLEN_DESIGN.md` §2 (typography) with §20 Q23/Q48

**File:** `_tasks/SOLEN_DESIGN.md` §2

**Action:** find the §2 typography block. If it lists Bebas Neue / Fraunces / DM Sans / Plus Jakarta / Outfit / Syne, replace with:
- Display: **Anton** (Google Fonts; uppercase headlines per Q48)
- Body: **Figtree** (Google Fonts; 400/500/600/700 weights per Q26)

Add a §2 footer note: *"Earlier values (Bebas Neue / Fraunces / DM Sans / Syne / Plus Jakarta / Outfit) retired per §20 Q23 (2026-04-XX) and Q48 (2026-04-XX). See §20 for the canonical lock."*

**Exit:** §2 says Anton + Figtree only. No retired font names in §2.

### Step 0a.2 — Reconcile `SOLEN_DESIGN.md` §18 with §20

**File:** `_tasks/SOLEN_DESIGN.md` §18

**Action:** §18 covers fonts/scale (per audit). Same fix as §2 — replace any retired font reference with Anton + Figtree. Add the same supersession footer note.

**Exit:** §18 self-consistent with §20 Q23 + Q48 + Q26.

### Step 0a.3 — Fix Q59 false file citations

**File:** `_tasks/SOLEN_DESIGN.md` §20 (Q59 row)

**Issue:** Q59 cites `components/loyalty/LoyaltyCard.tsx (164L)` and `LoyaltyCardList.tsx (87L)` — neither exists. Only `StampCard.tsx` is in `components/loyalty/`.

**Action:** edit the Q59 row to remove the fabricated `LoyaltyCard.tsx` + `LoyaltyCardList.tsx` references. Replace with: *"Existing components: `StampCard.tsx` (137L) keeps anatomy, drop confetti animation block + import; `/loyalty/stamp` HMAC-signed QR route per `KEY_FEATURES.md` #53 untouched. **NEW:** `LoyaltyCard.tsx` + `LoyaltyCardList.tsx` if needed for the closest-to-reward hero variant + active list view (deferred — `StampCard.tsx` may be reusable with a `variant="hero"` prop)."*

**Exit:** Q59 cites only paths that exist + clearly marks new components as "to-build" not "existing."

### Step 0a.4 — Fix Q52 wrong API path

**File:** `_tasks/SOLEN_DESIGN.md` §20 (Q52 row)

**Issue:** Q52 cites `/api/analytics/solen-score` — actual path is `/api/admin/solen-score/`.

**Action:** edit the Q52 row, replace `/api/analytics/solen-score` with `/api/admin/solen-score`.

**Exit:** Q52 cites the correct API path.

### Sub-phase 0a commit

(Q59 `/profil/stempel` route status is already covered in step 0a.3 — Q59 row already labels it "NEW" so no separate step needed. Verify during 0a.3 edit.)


Single commit: `docs(design): reconcile §2/§18 with §20 + fix 3 false Q-lock citations`

---

## Sub-phase 0b — Token contract migration

**Why second:** every component built in Phase 1+ consumes tokens. If tokens drift, we'd touch every component twice. Lock the contract now.

**Risk note:** changing `s-coral` from `#E8735A` → `#E8624A` shifts every coral surface in production. Visual diff is small (both are coral, ~10% hue shift). **Amber is a much bigger shift:** `#D4870A` (honey-mustard, dark, saturated yellow-brown) → `#F3A864` (peach-amber, warm, soft). Side-by-side these read as different colors, not different shades. Every amber surface — status pills, eyebrows, badges, secondary CTAs — will look noticeably different post-migration. **Expected, not a regression.** Plan a visual eyeball pass on a Vercel preview deploy before merging.

### Pre-edit recon

Before deleting legacy tokens (`s-blue`, `s-plum`, `s-sage`, `s-sand`, `s-dm.*`), grep to see if any component still uses them:

```bash
grep -rn "s-blue\|s-plum\|s-sage\|s-sand\|s-dm-" components/ app/ | head -30
```

If hits exist:
- Few hits (≤5): fix inline during this sub-phase (replace with locked equivalent like `s-ink-3` or `s-bg-sunken`)
- Many hits (>5): defer the token deletion to Phase 7 (mechanical sweep); only retire fonts + fix color hexes in this sub-phase

Same recon for `darkMode: 'class'` removal — confirm 0d strips `dark:*` classes BEFORE this removal, otherwise classes silently no-op.

### Step 0b.1 — `tailwind.config.js`

**File:** `tailwind.config.js`

**Changes:**
1. **Fonts** (`theme.extend.fontFamily`):
   - Remove: `display: ["Bebas Neue", ...]` + `body: ["DM Sans", ...]` + any `Fraunces` reference
   - Add:
     ```js
     fontFamily: {
       display: ["Anton", "Impact", "sans-serif"],
       body: ["Figtree", "system-ui", "sans-serif"],
       heading: ["Anton", "Impact", "sans-serif"], // alias used by some Q-lock anatomy
     }
     ```
2. **Colors** (`theme.extend.colors.s`):
   - `coral.DEFAULT`: `#E8735A` → **`#E8624A`**
   - `amber.DEFAULT`: `#D4870A` → **`#F3A864`**
   - `ink.DEFAULT`: `#222222` → **`#1A1209`**
   - `bg.sunken`: `#EDE5D8` → **`#FAF7F3`**
   - `success`: `#2E7D32` → **`#16A34A`**
   - **ADD missing tokens:**
     - `border.DEFAULT`: `#EFE7DD`
     - `bg.cream`: `#FFF4E8`
     - `ink-2.DEFAULT` (or `ink.2`): `#56463E`
     - `ink-3.DEFAULT` (or `ink.3`): `#9F8A7E`
   - **REMOVE legacy palette:** `s-blue`, `s-plum`, `s-sage`, `s-sand`, `s-dm.*` (entire block)
3. **Shadows** (`theme.extend.boxShadow`):
   - Remove: `warm-xl`, `coral-glow`, `coral-glow-hover` (per Q30 retired list)
4. **Dark mode:**
   - Change `darkMode: 'class'` → remove the line entirely (default is media query, which we'll override in 0d)

**Exit:** `s-coral`, `s-amber`, `s-ink`, `s-bg-sunken`, `s-success` resolve to locked hex; `s-border`, `s-bg-cream`, `s-ink-2`, `s-ink-3` exist; legacy palette gone; retired shadows gone.

### Step 0b.2 — `app/globals.css`

**File:** `app/globals.css`

**Changes:**
1. Top of file — `@import url('https://fonts.googleapis.com/css2?family=...')` line:
   - Remove: any `Bebas+Neue`, `Fraunces`, `DM+Sans`, `Plus+Jakarta+Sans`, `Outfit`, `Syne` imports
   - Add: `@import url('https://fonts.googleapis.com/css2?family=Anton&family=Figtree:wght@400;500;600;700&display=swap');`
   - **NOTE:** if `app/layout.tsx` uses `next/font/google` (Step 0b.3), the CSS @import is REDUNDANT — pick one source. Recommended: use `next/font` only, remove the @import line entirely.
2. `:root` block — verify hex values match `tailwind.config.js`:
   - `--coral`: `#E8624A`
   - `--amber`: `#F3A864`
   - `--ink`: `#1A1209`
   - `--ink-2`: `#56463E`
   - `--ink-3`: `#9F8A7E`
   - `--bg`: `#ffffff`
   - `--bg-sunken`: `#FAF7F3`
   - `--bg-cream`: `#FFF4E8`
   - `--border`: `#EFE7DD`
   - `--success`: `#16A34A`
3. Delete the `.dark { ... }` block entirely.
4. Delete the 14 dark-mode utility branches (per audit — search for `.dark .` selectors).
5. Delete the `s-dm.*` token block (any CSS variable starting with `--s-dm-` or `--dm-`).

**Exit:** globals.css `:root` matches §20 hex values; `.dark` block + dark-mode utility branches gone; only Anton + Figtree referenced as fonts.

### Step 0b.3 — `app/layout.tsx`

**File:** `app/layout.tsx`

**Changes:**
1. Replace `next/font/google` imports:
   - Remove: `Bebas_Neue`, `DM_Sans`, `Fraunces`, etc.
   - Add:
     ```ts
     import { Anton, Figtree } from "next/font/google";
     const anton = Anton({ subsets: ["latin"], weight: "400", variable: "--font-anton", display: "swap" });
     const figtree = Figtree({ subsets: ["latin"], weight: ["400","500","600","700"], variable: "--font-figtree", display: "swap" });
     ```
2. Replace `<body>` className:
   - Remove: `dark:bg-s-dm-bg dark:text-s-dm-text` and any other `dark:*` classes
   - Add: `${anton.variable} ${figtree.variable}` to className so CSS vars are available
3. Verify `<html>` does not have `class="dark"` server-rendered or hard-coded.

**Exit:** layout.tsx loads Anton + Figtree via `next/font`; `<body>` has no `dark:*` classes; CSS variables `--font-anton` + `--font-figtree` are available globally.

### Step 0b.4 — `app/[locale]/layout.tsx` (if it exists)

**File:** `app/[locale]/layout.tsx`

**Action:** check if this file exists. If yes, audit for any `dark:*` classes or retired font references. Strip same as 0b.3.

**Exit:** locale layout matches root layout's font + dark-mode posture.

### Sub-phase 0b commit

Single commit: `feat(tokens): migrate to Anton + Figtree + corrected coral/amber/ink hex per §20`

**Visual QA after this commit:** `localhost:3000/solen-coral` should still render correctly (preview is HTML+inline styles; not affected by Tailwind config). The live app will show the new coral/amber shade — expected, normal.

---

## Sub-phase 0c — Rules alignment

**Why third:** rule files reference design specs. Once tokens are correct (0b), align rule files to point at the correct values. Order = most-contradicted first per audit.

**Hard rule:** if a rule file says something `SOLEN_DESIGN.md` doesn't lock, leave the rule alone (don't delete just because it's not in §20). Only fix CONTRADICTIONS, not gaps.

### Step 0c.1 — `_rules/STRUCTURAL_RULES.md` (12 hits — most contradicted)

**File:** `_rules/STRUCTURAL_RULES.md`

**Specific contradictions to fix (per `_audits/_chunks/audit-4-rules-contradictions.md`):**
- **Rule 47** — wholesale V5-era spec. Rewrite to match §20: page bg = white (Q15), display = Anton (Q23/Q48), body = Figtree, no glass-frost-everywhere (Q23 anti-pattern), correct coral hex `#E8624A` (Q23). Or simpler: **delete Rule 47** and add a single line *"For visual specs see `_tasks/SOLEN_DESIGN.md` §20"* — single source of truth.
- **Rule 46** — mandates `dark:*` utilities + zone props. Delete the `dark:*` part. If zone props were a V5 concept retired, delete Rule 46 entirely.
- **Rule 43** — active filter pill = `bg-s-coral text-white` brand-color flood. Replace with: per Q23 + SOLEN_UI #2c, active filter pill uses weight + ink shift, not coral flood.
- 9 other smaller hits — open the audit chunk file, fix each line.

**Exit:** STRUCTURAL_RULES.md has zero references to retired fonts/colors/dark-mode/V5 specs.

### Step 0c.2 — `_rules/SYSTEMS.md` (7 hits)

**File:** `_rules/SYSTEMS.md`

**Specific contradictions:**
- Quick-match table points at 4 missing files (`UI_RULES.md`, `DESIGN_SPEC.md`, `SOLEN_DESIGN_SYSTEM.md`, `FIGMA_CODE_SYNC.md`) — delete those rows; replace with `_tasks/SOLEN_DESIGN.md`.
- Coral hex `#E8735A` → `#E8624A`.
- Ink hex `#222222` → `#1A1209`.
- "bg-white is banned" → delete; Q15 locks page bg = white.
- Other dangling pointers (`FIGMA.md`, `FIGMA_DEVIATIONS.md`, `GENERATION_TOOLS.md`, `search-bar-rules.md`) — delete.

**Exit:** SYSTEMS.md only points at files that exist; no wrong hexes.

### Step 0c.3 — `_rules/CODE_SAFETY.md`

**File:** `_rules/CODE_SAFETY.md`

**Contradictions:**
- **Rule 12** — "ONE design system: V5" + fonts "Bebas Neue / Syne / DM Sans". Replace: "Single source of truth = `_tasks/SOLEN_DESIGN.md` §20. Fonts = Anton (display) + Figtree (body). Earlier values retired."

**Exit:** Rule 12 reflects current locks.

### Step 0c.4 — `_rules/KEY_FEATURES.md`

**File:** `_rules/KEY_FEATURES.md`

**Contradictions:**
- **Line 3** — V5 hero spec ("cinematic warm gradient + floating glass pill"). Replace with Q49 spec: "Stacked above-fold (no hero photo, no decorative gradient), 3 quick-action chips, Q48 signature lockup."
- **Item 11** — "Dark Mode" listed as a feature. Delete or change to "Reduced motion" (Q35-relevant).

**Exit:** KEY_FEATURES.md doesn't claim retired features.

### Step 0c.5 — `_rules/ROADMAP_RULES.md`

**File:** `_rules/ROADMAP_RULES.md`

**Action:** open audit chunk, find ROADMAP_RULES contradictions. Fix per audit notes. Likely: dangling file pointers + V5 references.

**Exit:** clean.

### Step 0c.6 — `_rules/LESSONS_LEARNED.md`

**File:** `_rules/LESSONS_LEARNED.md`

**Contradictions:**
- **Line 321** — coral on hearts, stars, open-now, active-filter pills cited as "legitimate." Replace with current semantic-color discipline: heart = `#FF4A6B` love-red; stars = amber `#F3A864`; open-now = `#16A34A`; active filter = weight + ink (no coral flood).

**Exit:** LESSONS_LEARNED.md aligned with semantic-color discipline.

### Step 0c.7 — `_rules/I18N_ROUTING.md`

**File:** `_rules/I18N_ROUTING.md`

**Action:** open audit, fix contradictions. Likely: dangling pointers + retired font references.

**Exit:** clean.

### Step 0c.8 — `_rules/SOLEN_UI.md`

**File:** `_rules/SOLEN_UI.md`

**Contradictions:**
- **#5c + #shadows** — says shadows = neutral grayscale `rgba(0,0,0,0.x)`. Replace per `SOLEN_DESIGN.md` §5: warm-ink-tinted `rgba(26,18,9,x)`.

**Exit:** SOLEN_UI.md shadows match §5.

### Sub-phase 0c commit

One commit per rule file (8 commits total). Pattern: `docs(rules): align <FILE> with §20 lock`.

This makes review easier per CLAUDE.md surgical-edits rule.

---

## Sub-phase 0d — Dark-mode mechanical purge

**Why fourth:** can't be done before 0b (token contract first). Can't wait for Phase 1+ because every component touched in Phase 1+ would still inherit `dark:*` classes that will silently no-op (Tailwind drops them) but pollute the codebase.

**Mostly mechanical**, but the regex is fragile in 4 places — see "fragile cases" below. Realistic ETA: **1 hour** (not 30 min). 3,665 invocations across ~254-346 files.

### Step 0d.1 — Bulk strip `dark:*` utility classes (2-pass)

**Pass 1 — automated regex sweep (catches ~90%):**

Pattern: `\s+dark:[a-zA-Z0-9-/.\[\]\(\)]+` (note added paren handling for arbitrary values like `dark:bg-[rgb(...)]`)

Approach:
1. Test on ONE file first: pick a high-hit component (e.g. from audit-2 top-30 list), apply regex, eyeball diff. Confirm no false positives.
2. Generate file list: `grep -rl 'dark:' components/ app/ | grep -v node_modules`
3. Apply regex to each file. Use a Node script `scripts/strip-dark-mode.mjs` (one-shot, delete after) — `sed` is fine but Node handles edge cases more predictably.
4. Verify with: `grep -rn 'dark:' components/ app/ | wc -l`

**Pass 2 — manual review of leftovers:**

Anything that survives Pass 1 is in one of these fragile cases:
- **Template literals:** `` className={`bg-white ${cond ? 'dark:bg-black' : ''}`} `` — strip the conditional class, may need to drop the conditional entirely
- **`cn()` / `clsx()` / `cva()` arguments:** `cn("bg-white", "dark:bg-black")` — strip the second arg
- **Conditional spreads:** `cn(isDark && "dark:bg-black")` — drop the conditional branch
- **Test snapshots / fixture files:** likely safe to leave (not user-facing)
- **JSDoc comments:** `// dark:bg-black retired` — should NOT be stripped (it's documentation of the change)

For each leftover: read context, fix manually. Don't run Pass 1 regex on the leftover file — it'll either no-op or break something.

**Exit criteria:** `grep -rn 'dark:' components/ app/ | grep -v "// " | grep -v ".test." | grep -v ".snap"` returns 0 results, OR each remaining hit is justified in a follow-up note.

### Step 0d.2 — Manual fixes for special cases

**Per audit:**
- `components/dashboard/barber/FadeBlueprint.tsx:217` — inline `style={{ fontFamily: "DM Sans, sans-serif" }}`. Replace with `fontFamily: "var(--font-figtree, system-ui)"` (or just remove — Figtree inherits via body).
- `components/dashboard/nail/NailClientTab.tsx:226` — `bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300`. Replace with `bg-s-bg-sunken text-s-ink-2`. Drop the `dark:*` entirely (covered by 0d.1).

### Step 0d.3 — Strip dark-mode utility branches in `app/globals.css`

**Action:** done in 0b.2. Re-verify zero `.dark` selectors remain.

### Sub-phase 0d commit

One bulk commit: `chore(theme): strip dark-mode classes (3,665 hits across ~254 files) — dark mode retired per Q62`

Optional: split into 2 commits — one for the bulk strip + one for the special-case fixes — for cleaner review.

---

## Sub-phase 0e — Verification

**No file edits in this sub-phase.** Read-only checks before declaring Phase 0 complete.

### Step 0e.1 — Token sanity grep

```bash
grep -rn "Bebas Neue\|Fraunces\|DM Sans\|Plus Jakarta\|Outfit\|Syne" tailwind.config.js app/ _rules/ _tasks/SOLEN_DESIGN.md
# expect: 0 hits in tailwind.config.js + app/
# expect: 0 hits in _rules/
# expect: 0 hits in SOLEN_DESIGN.md (or only "earlier values retired" footer notes)

grep -rn "#E8735A\|#D4870A\|#222222\|#EDE5D8\|#2E7D32" tailwind.config.js app/globals.css _rules/
# expect: 0 hits

grep -rn "dark:" components/ app/ | wc -l
# expect: 0 (or very small number — manual review of any leftovers)

grep -c "#E8735A\|#D4870A\|#EDE5D8\|#2E7D32" public/solen-coral.html
# expect: 0 (preview should already use locked hexes; verifies preview-as-truth holds)
```

### Step 0e.2 — Visual smoke test

1. `localhost:3000/solen-coral.html` — preview should look unchanged (HTML doesn't depend on Tailwind config)
2. `localhost:3000/de` (or whatever locale routes exist) — should render without TypeScript errors. Compare a few surfaces visually:
   - Coral CTA buttons should be visibly slightly more saturated than before (closer to `#E8624A`)
   - Amber accents should be visibly brighter (closer to `#F3A864`)
   - Body text should look the same width-wise but feel slightly more humanist (Figtree vs DM Sans)
   - No layout breaks
3. If any page errors out → diagnose. Don't paper over.

### Step 0e.3 — `_tasks/SOLEN_BUILD_MAP.md` status update

Mark Phase 0 status table:
- Sub-phase 0a–0e all checkmark
- Phase 0 overall: ✓ verified

### Step 0e.4 — Move Phase 0 sub-plan to completed

`mv _tasks/SOLEN_BUILD_PHASE_0.md _tasks/completed/SOLEN_BUILD_PHASE_0.md`

This file's job is done.

---

## Hard rules during Phase 0

1. **No new components built.** Phase 0 is foundation. Phase 1 builds primitives.
2. **No `npm run build`** unless explicitly requested. CLAUDE.md surgical-edits rule.
3. **One commit per logical change.** Easier to revert a single sub-step if something breaks.
4. **Preview-as-truth:** if `solen-coral.html` shows X and the live app shows Y, the live app is wrong.
5. **`SOLEN_DESIGN.md` §20 wins** over §2/§18/§other. After 0a these should agree, but if a discrepancy is found later, §20 is authoritative.
6. **Don't delete files you didn't audit personally.** The 8 dangling pointers in 0c.2 — only delete the *pointers*, not the (non-existent) target files.
7. **Build errors during Phase 0 = stop.** Diagnose. Don't bypass with `--no-verify` or `as any`.
8. **Push to a Vercel preview branch before merging to main.** This worktree (`vigorous-spence-0e9aa7`) is already a non-main branch, so Vercel auto-creates a preview URL — eyeball coral + amber surfaces on preview before merging. If amber-shift looks too jarring on a real surface, can adjust the locked hex in §20 before going to production (rare, but possible).

---

## What this Phase 0 does NOT do

- Build any new component (deferred to Phase 1)
- Refactor any page surface (deferred to Phases 3–6)
- Touch the booking wizard, profile page, dashboard chrome (deferred to Phases 3–6)
- Add any new Q-locks (deferred to V4 questionnaire round)
- Build the V4 questionnaire (separate task; the 6 audit chunks include suggested topics)

---

## Out-of-Phase-0 backlog

These came up in the audit but are NOT Phase 0 work:

| Item | Where it goes |
|---|---|
| Build EmptyState family (Q60) | Phase 1 |
| Build LiveActivityCard (Q58) | Phase 3 |
| Build dashboard chrome (Q61) | Phase 6 |
| Build PayConfirmStep (Q55) | Phase 5 |
| Drift-fix `StampCard.tsx:54` confetti | Phase 3 (when StampCard refactored) |
| Build line-coral SVG empty illustrations (Q21) | Phase 1 |
| Add scripts/contrast-check.ts CI lint (Q45) | Phase 7 |
| Build claim ribbon + watermark (Q13) | TBD — phase that touches scraped salon profiles |
| Resolve route duplications (signup/register, profile/account, legal triplets) | Phase 7 cleanup |
| Resolve `/checkout` orphan route | Phase 5 (during booking flow refactor) |
| ~55 new Q-locks (Q64–Q118) | V4 questionnaire round (separate, future) |
| Chat surface design (#1 moat priority) | V4 questionnaire round |
| Allergy banner design (#2 moat priority) | V4 questionnaire round |
| Salon-card sub-system (badges, deal overlay, availability pill) | V4 questionnaire round |

---

## Status table

| Sub-phase | Started | Verified | Notes |
|---|---|---|---|
| 0a — SOT reconciliation | — | — | next up |
| 0b — Token contract | — | — | |
| 0c — Rules alignment | — | — | |
| 0d — Dark-mode purge | — | — | |
| 0e — Verification | — | — | |

_Status updated as sub-phases complete._
