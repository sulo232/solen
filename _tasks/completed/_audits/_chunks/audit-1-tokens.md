# Token drift audit

Sources of truth referenced:
- `_tasks/SOLEN_DESIGN.md` Q23 (line 557), Q26 (560), Q43 (569), Q45 (570), Q48 (573), Q49 (574), Q62 (587), Q63 (588).
- `CLAUDE.md` "Retired" list (line 16).

Verdict in one line: **the production token contract is V2/V3-era. None of the Q23/Q26/Q48/Q62 locks are wired in code yet.**

---

## Fonts wired in production

- **Display:** `Bebas Neue` via `tailwind.config.js:37` (`display: ["Bebas Neue", "sans-serif"]`) and `app/globals.css:172` (`.font-display`).
- **Heading (serif):** `Fraunces` via `tailwind.config.js:35` (`heading: ["Fraunces", "Georgia", "serif"]`) and `app/globals.css:137,166,740`.
- **Body:** `DM Sans` via `tailwind.config.js:36` (`body: ["DM Sans", "sans-serif"]`) and `app/globals.css:131,169,179,324,728`.
- **Font-loading sources:**
  - `app/layout.tsx:21` preloads `Bebas+Neue` + `Fraunces` + `DM+Sans` from Google Fonts.
  - `app/globals.css:2` `@import` of `Bebas+Neue` + `JetBrains+Mono` + `Fraunces` + `DM+Sans`.
- **Locked (per Q23, Q26, Q48, Q62):** display = **Anton**, body = **Figtree**.
- **Status:** ✗ **DRIFT.** None of the locked fonts (Anton, Figtree) are loaded, declared in Tailwind, or used anywhere. Q26's "Figtree 14/700" card-text rule is unsatisfiable today. Q48's "Anton uppercase headline" signature is unsatisfiable today.

## Retired fonts still referenced

| File | Line | Token | Locked replacement |
|---|---|---|---|
| `app/layout.tsx` | 21 | preload `family=Bebas+Neue&family=Fraunces&family=DM+Sans` | Anton + Figtree |
| `app/globals.css` | 2 | `@import` `Bebas+Neue&JetBrains+Mono&Fraunces&DM+Sans` | Anton + Figtree (drop JetBrains Mono unless re-locked) |
| `app/globals.css` | 131, 169, 179, 324, 728 | `font-family: "DM Sans", sans-serif` | Figtree |
| `app/globals.css` | 137, 166, 740 | `font-family: "Fraunces", Georgia, serif` | Anton (display) or Figtree (body); Fraunces serif role retired |
| `app/globals.css` | 172 | `font-family: "Bebas Neue", sans-serif` | Anton |
| `tailwind.config.js` | 35 | `heading: ["Fraunces", "Georgia", "serif"]` | drop / replace with Figtree |
| `tailwind.config.js` | 36 | `body: ["DM Sans", "sans-serif"]` | Figtree |
| `tailwind.config.js` | 37 | `display: ["Bebas Neue", "sans-serif"]` | Anton |
| `app/[locale]/checkout/page.tsx` | 703 | inline `fontFamily: "DM Sans, sans-serif"` | Figtree |
| `app/api/loyalty/award/route.ts` | 114, 115 | email HTML — `DM Sans`, `Syne` | Figtree (email-safe fallback) |
| `app/api/dashboard/barber-reminders/send/route.ts` | 63, 64 | email HTML — `DM Sans`, `Syne` | Figtree |
| `app/api/notifications/off-peak/route.ts` | 88, 89 | email HTML — `DM Sans`, `Syne` | Figtree |
| `app/api/cron/review-prompt/route.ts` | 140, 141, 168, 169 | email HTML — `DM Sans`, `Syne` (×2) | Figtree |
| `lib/booking-email.ts` | 90, 92 | email HTML — `DM Sans`, `Syne` | Figtree |
| `scripts/send-outreach-emails.ts` | 82 | email HTML — `DM Sans` | Figtree |
| `lib/editor-prompts.ts` | 97 | LLM prompt mentions `Bebas Neue, Syne, DM Sans` as the brand fonts | rewrite to Anton + Figtree |
| `components/dashboard/barber/FadeBlueprint.tsx` | 217 | inline `fontFamily: "DM Sans, sans-serif"` | Figtree |
| `components/BrowseByCitySection.tsx` | 15, 17 | comment header advertises Bebas Neue + Syne | Anton |
| `components/CategoryPage.tsx` | 352 | comment "pure white + Bebas Neue H1" | Anton |
| `components/ui/HomepageHero.tsx` | 14 | comment "DM Sans 13px" | Figtree |
| `components/ui/HeroVisualCard.tsx` | 26 | comment "Bebas Neue salon name watermark" | Anton |
| `components/ui/HowItWorks.tsx` | 13–17 | comment block — DM Sans 28/700, Syne, DM Sans 16/600, DM Sans 13/400 | Anton + Figtree |
| `components/ui/FeaturedSalonCarousel.tsx` | 70, 223, 243, 248 | comment block — DM Sans 28/700, Fraunces 15/700, DM Sans 14/400 (×2) | Anton + Figtree |
| `components/TrustStatsBanner.tsx` | 14, 15 | comment "Bebas Neue 28px (counts), DM Sans 16px/700" | Anton + Figtree |
| `components/TestimonialCarousel.tsx` | 15, 17, 18, 19 | comment — Syne avatars, DM Sans 15/400 italic, DM Sans 28/700, Syne 12/700 | Anton + Figtree |
| `components/layout/Footer.tsx` | 14, 15 | comment "Bebas Neue 24px brand wordmark, DM Sans 14/400 tagline" | Anton + Figtree |
| `remotion/src/tokens.ts` | 6, 7 | `fontDisplay: 'Bebas Neue'`, `fontBody: 'DM Sans'` | Anton + Figtree |
| `src/styles/variables.css` | 27, 28 | `--font-display: 'Bebas Neue'`, `--font-body: 'DM Sans'` | Anton + Figtree |
| `src/styles/components.css` | 790, 798, 802 | `font-family: 'DM Sans'` (×3) | Figtree |
| `tmp3.tsx` | 78 | comment "Bebas Neue name" | scratch file — delete |

Note: `Plus Jakarta`, `Outfit` — **0 references in code** (clean).

## Brand colors in `tailwind.config.js`

| Token | Hex | Matches Q-lock? | Lock |
|---|---|---|---|
| `s-coral.DEFAULT` | `#E8735A` | ✗ | Q23/Q45/Q62 → `#E8624A` |
| `s-coral.hover` | `#D4654E` | n/a | (lock specifies brightness shift, no separate hover hex; Q23) |
| `s-coral.subtle` | `#FAECE7` | n/a | not locked yet |
| `s-coral.text` | `#B84A35` | partial | Q48/Q49 specify coral-text token = `#C95A3A` (not present) |
| `s-coral.button` | `#C05038` | drift | not in lock; should be `s-coral.DEFAULT` |
| `s-coral.button-hover` | `#A8442F` | drift | brightness shift, not hex |
| `s-amber.DEFAULT` | `#D4870A` | ✗ | Q23/Q62 → `#F3A864` |
| `s-amber.hover` | `#B3700A` | n/a | brightness shift only |
| `s-amber.subtle` | `#FEF4E0` | drift | locked cream is `#FFF4E8` (Q63) |
| `s-amber.text` | `#6B4005` | n/a | Q45 says use ink `#1A1108` on amber, not amber-text-on-white |
| `s-blue.*` | `#6BA3C8` | ✗ | Q23: "no blue-cool tones in UI accents" — token must be removed or marked legacy |
| `s-plum.*` | `#4A1E3C` | ✗ | Q23: "no purple" — remove |
| `s-yellow.DEFAULT` | `#F2C144` | ✓ ish | Q26: Solen Favorit badge `#F2C144` — keep, but rename to align with usage |
| `s-sage.*` | `#7BA688` | ✗ | Q23: "no green" except status; this is decorative — remove or merge into status |
| `s-sand.*` | `#C9A96E` | ✗ | not in Q-lock palette; legacy V2/V3 |
| `s-ink.DEFAULT` | `#222222` | ✗ | Q23/Q62 → `#1A1209` ("warm-ink, NOT pure black") |
| `s-ink.secondary` | `#767676` | ✗ | Q62 → ink-2 `#56463E` |
| `s-ink.tertiary` | `#8A7A66` | ✗ | Q62 → ink-3 `#9F8A7E` |
| `s-ink.disabled` | `#C4B8A6` | n/a | not locked, decorative |
| `s-bg.base` | `#FAFAF8` | ✗ | Q15 / Q62 → page bg `#FFFFFF`; sunken `#FAF7F3` |
| `s-bg.surface` | `#F3EDE2` | ✗ | not in lock — drift |
| `s-bg.raised` | `#FFFFFF` | ✓ | matches |
| `s-bg.sunken` | `#EDE5D8` | ✗ | Q62/Q63 → `#FAF7F3` |
| `s-dm.*` | dark-mode tokens | ✗ | Q62: "dark mode stays retired"; CLAUDE.md retired list |
| `s-success.DEFAULT` | `#2E7D32` | ✗ | Q62 status green = `#16A34A` |
| `s-success.bg` | `#E8F5E9` | n/a | not locked |
| `s-warning.DEFAULT` | `#E65100` | ✗ | Q62 amber-warn = `#F3A864` |
| `s-error.DEFAULT` | `#C62828` | n/a | not explicitly locked, keep |

Missing tokens required by Q62 contract: `s-border` (`#EFE7DD`) and `s-cream` / `s-bg-cream` (`#FFF4E8`). Neither exists in `tailwind.config.js`.

## Brand colors in `globals.css :root`

`globals.css` does NOT expose Q-lock tokens as CSS variables. It defines:

| Token | Hex/HSL | Matches Q-lock? | Lock |
|---|---|---|---|
| `--color-heading` (line 51) | `#222222` | ✗ | should be `#1A1209` |
| `--color-body` (52) | `#222222` | ✗ | should be `#1A1209` |
| `--color-muted` (53) | `#767676` | ✗ | should be `#9F8A7E` (ink-3) |
| `--color-border` (54) | `#EBEBEB` | ✗ | should be `#EFE7DD` |
| `--color-hover-bg` (55) | `#F7F7F7` | ✗ | should be `#FAF7F3` |
| `--color-success` (57) | `#2E7D32` | ✗ | should be `#16A34A` |
| `--color-warning` (58) | `#ED6C02` | ✗ | should be `#F3A864` |
| `--bg` / `--base` (61, 62) | `#FFFFFF` | ✓ | matches Q15 |
| HSL `--ring` (12) | `10 78% 60%` ≈ `#E8735A` | ✗ | drifted coral, should derive from `#E8624A` |
| Hardcoded coral in CSS — `#E8735A` (374, 718, 766), `#C05038` (focus ring 885, 890), `#7A2415`/`#F07560` (glass-pill-active 298, 303), `#FAECE7` (375) | ✗ | All should use `#E8624A` family + `#FFF4E8` cream |
| `rgba(232, 98, 74, ...)` (159, 297, 364, 379, 389, 627, 633, 640, 645, 651, 658, 803, 808) | partial | `rgba(232,98,74)` IS `#E8624A` — these match Q23 lock | These are correct — but inconsistent with the `s-coral` Tailwind token (`#E8735A`). Two corals coexist in the codebase. |

**Critical observation:** `globals.css` already uses `rgba(232, 98, 74, …)` (which is `#E8624A`, the locked coral) for animations/focus/gradients while `tailwind.config.js` exposes `#E8735A` as the `s-coral.DEFAULT` Tailwind class. These are **different reds**. Coral has split-brain right now.

## Retired colors still referenced

| File | Line | Hex | Notes |
|---|---|---|---|
| (none in `.ts`/`.tsx`/`.js`/`.css`/`.html`) | — | `#1B4D1C` | ✓ V2 green absent from production code |
| (none in `.ts`/`.tsx`/`.js`/`.css`/`.html`) | — | `#F5A962` | ✓ V2 peach absent from production code |
| `_tasks/*.md`, `_audits/*.md`, `CLAUDE.md` | various | both | Doc-only references in retirement lists — leave |

## `dark:*` class references

- `tailwind.config.js:3` declares `darkMode: 'class'`.
- `app/layout.tsx:26` body className: `... bg-s-bg-base text-s-ink dark:bg-s-dm-bg dark:text-s-dm-text`.
- `app/globals.css` defines `.dark` block at line 86 plus 14 dark-mode utility overrides (glass, glass-strong, glass-subtle, glass-frost, glass-search, glass-toolbar, glass-pill, glass-pill-active, card-v4, ambient-v4, ambient-v5, hero-cinematic, inputs at 344, focus-visible at 379+385, solen-tour-popover at 733+752+778).
- Component-level `dark:*` classes: **3,665 occurrences across ~346 component/app files** (e.g. `components/BookingSuccess.tsx`, `components/BookingCalendar.tsx` heavily). Spot-checked a half-dozen — all use `dark:bg-s-dm-*`, `dark:text-s-dm-text`, `dark:border-white/10` patterns.
- **Status:** ✗ DRIFT. Q62 lock + CLAUDE.md retired list both say dark mode is retired. Tailwind's dark variant remains active and 3,665 class invocations rely on it.

## Phosphor icon imports

- `package.json` deps — **no `phosphor-icons` / `@phosphor-icons/*` package** (✓ removed).
- `grep -rn "phosphor"` across `**/*.{ts,tsx,js,json}` — **0 results** (✓ clean).
- `lucide-react` is present (`package.json:43` → `"lucide-react": "^0.577.0"`). ✓ matches Q-lock.
- **Status:** ✓ Phosphor fully retired.

## Summary

- **Fonts:** ✗ DRIFT (Bebas Neue + Fraunces + DM Sans live in config, layout, globals, remotion, src/styles, several inline emails — Anton + Figtree are nowhere).
- **Colors:** ✗ DRIFT (coral, amber, ink, ink-2, ink-3, border, bg-sunken, success-green, amber-warn — every locked brand hex is wrong in `tailwind.config.js`; `globals.css :root` is also drifted; `s-bg-cream`/`s-border` tokens missing entirely; coral is split between `#E8735A` (Tailwind) and `#E8624A` (CSS rgba)).
- **Class names:** partial — `s-coral`, `s-amber`, `s-ink` (DEFAULT/secondary/tertiary), `s-bg.*` exist as Tailwind classes; **missing:** `s-ink-2`, `s-ink-3` (Q-lock names), `s-border`, `s-bg-cream`. Also lingering retired tokens `s-blue`, `s-plum`, `s-sand`, `s-sage`, `s-dm.*` are still wired.
- **Retired V2 colors `#1B4D1C` / `#F5A962`:** ✓ absent from code.
- **Dark mode references:** ✗ 3,665 `dark:*` class hits across ~346 files + active `darkMode: 'class'` config + `.dark` CSS bloc; all tagged for retirement by Q62 + CLAUDE.md.
- **Phosphor:** ✓ 0 references; `lucide-react` is the icon library.

## Recommended Phase 0 fixes

Surgical, file-by-file, in the order that makes the token contract correct without touching component markup:

1. **`tailwind.config.js`**
   - Line 19: `s-coral.DEFAULT` `#E8735A` → `#E8624A`. Drop `.button` / `.button-hover` (Q23 locks brightness shifts, not hex variants); keep `.subtle` `#FAECE7` (or rename to `cream`/`#FFF4E8`); add `.text` = `#C95A3A` (per Q48/Q49 eyebrow color).
   - Line 20: `s-amber.DEFAULT` `#D4870A` → `#F3A864`. Drop `.text` (Q45 forbids amber-on-white text); keep `.subtle` if needed but realign hex.
   - Lines 21–25: Remove or move under `legacy.*`: `s-blue`, `s-plum`, `s-sage`, `s-sand`. (`s-yellow #F2C144` may stay — it's the Q26 Solen Favorit badge.)
   - Line 26: split `s-ink` into separate keys: `s-ink: #1A1209`, `s-ink-2: #56463E`, `s-ink-3: #9F8A7E`. Drop `s-ink.secondary/tertiary/disabled`.
   - Line 27: `s-bg.base` `#FAFAF8` → `#FFFFFF`; `s-bg.surface` `#F3EDE2` → drop or remap; `s-bg.sunken` `#EDE5D8` → `#FAF7F3`. Add `s-bg.cream: #FFF4E8`.
   - Line 28: delete `s-dm.*` block (dark mode retired per Q62).
   - Line 30: `s-success.DEFAULT` `#2E7D32` → `#16A34A`.
   - Line 31: `s-warning.DEFAULT` `#E65100` → `#F3A864` (or remove and reuse `s-amber`).
   - Add `s-border: #EFE7DD` token.
   - Lines 35–37: replace `heading`/`body`/`display` with `display: ["Anton", "Impact", "sans-serif"]`, `body: ["Figtree", "system-ui", "sans-serif"]`. Drop the `heading: Fraunces` slot (no Fraunces in lock).
   - Line 3: change `darkMode: 'class'` to `darkMode: ['class', '.theme-dark-disabled']` or just remove. (Q62 retires dark mode.)

2. **`app/globals.css`**
   - Line 2: replace Google Fonts import with `Anton:wght@400` + `Figtree:wght@400;500;600;700;800` (drop Bebas Neue, JetBrains Mono, Fraunces, DM Sans).
   - Lines 51–58: rebase `:root` color vars to Q-lock hexes (`--color-heading: #1A1209`, `--color-body: #1A1209`, `--color-muted: #9F8A7E`, `--color-border: #EFE7DD`, `--color-hover-bg: #FAF7F3`, `--color-success: #16A34A`, `--color-warning: #F3A864`).
   - Line 12: HSL `--ring: 10 78% 60%` (≈ `#E8735A`) → HSL of `#E8624A` (≈ `9 78% 60%`).
   - Lines 86–119: delete the `.dark { … }` block (Q62 retires dark mode).
   - Lines 131, 137, 166, 169, 172, 179, 324, 728, 740: swap font-family declarations to Anton (display) + Figtree (body). Remove `Fraunces` and `Bebas Neue` font-families. The h1–h6 rule at line 137 should map to Figtree for now (Anton is reserved for the Q48 signature lockup, not every heading).
   - Lines 374, 718, 766, 374 etc.: replace `#E8735A` with `#E8624A`; replace `#FAECE7` with `#FFF4E8` cream (or keep as coral subtle if intentional).
   - Lines 885, 890: swap focus-ring `#C05038` → `#E8624A`.
   - Lines 207–219, 245, 261, 273, 287, 300, 344–356, 379, 385, 506–512, 631, 643, 656, 733–780: delete dark-mode override branches.
   - Optional Phase 0.5: collapse the legacy V4/V5 `card-v4` / `card-listing` / glass utilities to the Q-lock card grammar (Q26).

3. **`app/layout.tsx`**
   - Lines 19–23: replace Google Fonts preload URL with the Anton + Figtree combo.
   - Line 26: drop `dark:bg-s-dm-bg dark:text-s-dm-text` from body className — only `bg-s-bg-base text-s-ink` (and update class names if `s-ink` is split).

4. **`app/[locale]/checkout/page.tsx:703`** — inline `fontFamily: "DM Sans, sans-serif"` → `"Figtree, sans-serif"`.

5. **`components/dashboard/barber/FadeBlueprint.tsx:217`** — same swap.

6. **Email-template font-family swaps (DM Sans + Syne):**
   - `app/api/loyalty/award/route.ts:114–115`
   - `app/api/dashboard/barber-reminders/send/route.ts:63–64`
   - `app/api/notifications/off-peak/route.ts:88–89`
   - `app/api/cron/review-prompt/route.ts:140–141, 168–169`
   - `lib/booking-email.ts:90, 92`
   - `scripts/send-outreach-emails.ts:82`
   Replace `DM Sans` → `Figtree`, `Syne` → `Figtree` (or `Anton` if the email design wants the display weight). Email clients won't load Anton without an explicit `<link>` — keep a system fallback (`Arial, sans-serif`).

7. **`lib/editor-prompts.ts:97`** — rewrite the LLM prompt's brand-fonts line: `Bebas Neue, Syne, DM Sans` → `Anton (display), Figtree (body)`.

8. **`remotion/src/tokens.ts:6–7`** + **`src/styles/variables.css:27–28`** + **`src/styles/components.css:790, 798, 802`** — same DM Sans / Bebas Neue → Figtree / Anton swap. (`src/` and `remotion/` may be out of the Next.js build; confirm before editing.)

9. **Comment-only references** (no runtime impact, but they document a retired vocabulary; either leave for Phase 1 or sweep here):
   `components/BrowseByCitySection.tsx:15, 17`, `components/CategoryPage.tsx:352`, `components/ui/HomepageHero.tsx:14`, `components/ui/HeroVisualCard.tsx:26`, `components/ui/HowItWorks.tsx:13–17`, `components/ui/FeaturedSalonCarousel.tsx:70, 223, 243, 248`, `components/TrustStatsBanner.tsx:14, 15`, `components/TestimonialCarousel.tsx:15, 17, 18, 19`, `components/layout/Footer.tsx:14, 15`, `tmp3.tsx:78`.

10. **Dark-mode purge (separate large pass — Phase 0.b):**
    - 3,665 `dark:*` class references across ~346 files; `app/globals.css` `.dark` blocks; `s-dm.*` Tailwind tokens; `tailwind.config.js darkMode: 'class'` line; `ThemeScript` (referenced from `app/layout.tsx:2`).
    - Treat as its own surgical batch — too large for the same diff as 1–9.

After fixes 1–3 land, the token contract in `tailwind.config.js` + `globals.css` + `app/layout.tsx` matches Q23/Q26/Q43/Q45/Q48/Q49/Q62/Q63. Component-level surface drift (Bebas/Fraunces/DM-Sans usage in components, dark-mode classes) becomes a separate, larger Phase 1 pass.
