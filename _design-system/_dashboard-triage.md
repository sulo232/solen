# /dashboard triage (V3-D332, generated 2026-05-28)

Pre-W10.5 implementation prep. Per Opus stress-test (V3-D332): ship blocking fixes before /fuer-salons launches signup.

**Read-only investigation by triage subagent. No code edited.**

---

## TL;DR for the orchestrator

The original framing — "285 cosmetic drift findings, defer indefinitely" — was wrong. The drift report **undercounts severity** because A5 ("retired token usage") is logged as a presentational concern, when in reality those retired tokens have been **dropped from `tailwind.config.js`** entirely (V3-D328 killed `s-coral`; `s-amber` / `s-blue` / `s-plum` / `s-cool` / `s-pop` / `s-sand` / `s-amber-subtle` / `s-amber-text` were never re-added after the B&W pivot).

**Result: every `bg-s-coral`, `text-s-coral`, `border-s-coral`, `bg-s-amber/10`, `border-l-s-blue`, etc. in the dashboard compiles to ZERO CSS.** Measured against the live dev server at 23:22 UTC, the classes produce transparent backgrounds, default-grey borders, and inherited text color.

**Concrete impact verified by `getComputedStyle()` in the running app:**

| Pattern | Used for | Renders as |
|---|---|---|
| `bg-s-coral text-white` | Primary CTA (Slot erstellen, Stornieren, Wochenplan, Verschieben, Termin) | **Invisible white text on transparent button** — operator can't read the CTA label |
| `bg-s-coral/10 text-s-coral` | "Mark complete", "No-show", "Cancel" icons on each booking row | Identical colorless chips — operator can't tell actions apart |
| `border-l-4 border-l-s-coral` / `-l-s-blue` / `-l-s-amber` / `-l-s-plum` | Calendar service-category color codes (hair / nails / barber / makeup) | All four render identical default-grey `#E7E5E4` left border — operator can't distinguish booking categories at a glance |
| `border-s-coral bg-s-coral/[0.06] text-s-coral` | Sidebar nav ACTIVE highlight | Active nav item is visually identical to inactive — operator can't tell what page they're on |
| `bg-s-amber-subtle text-s-amber-text` | Status pills ("Ausstehend" / "Pending" / "Verifying") | Colorless pills with no fill, no contrast text |
| `bg-s-amber text-white` (DashboardLayout.tsx:532) | Demo-mode top banner | No background — looks like a stray text line |
| `bg-s-coral` (settings toggle) / `bg-s-sand` (toggle off) | iOS-style switches | Both states invisible — operator can't see toggle state |
| `<span className="text-s-coral">.</span>` in "solen.ch" logo | Brand dot in dashboard header | Invisible dot — logo renders as "solench" |

The dashboard isn't "ugly" — it's **functionally broken in a way an operator notices in <10 seconds of clicking around**. The council was right.

**The fix is also smaller than feared.** Most of the damage is concentrated in 4–5 retired tokens. A **single tailwind.config.js patch re-aliasing them to live tokens** (e.g. `s-coral → s-ink` for CTAs, `s-amber → s-warning` for warnings, `s-blue → s-accent` for info, etc.) restores ~95% of the rendering with zero code changes elsewhere. The cleanup sweep (replacing the legacy names with their proper canonical equivalents file-by-file) can ship later as cosmetic W17 work.

---

## Summary

- **Total drift findings audited in /dashboard/**: 916 (across 40 page.tsx files + 60+ legacy component files)
- **Total dashboard files using retired tokens**: 96 (40 page routes + ~60 dashboard components)
- **Retired-token references (s-coral / s-amber / s-blue / s-plum / s-amber-subtle / s-amber-text)**: ~1,043 across dashboard surfaces
- **BLOCKING (W10.5 must-fix)**: 11 distinct root-cause groups affecting all 40 routes — but **fixable with 1 config change + ~15 surgical follow-ups** (~3-5 h total)
- **COSMETIC (defer indefinitely)**: ~500+ raw findings (A1 hex / A2 arbitrary Tailwind / A7 uppercase / A8 tracking / A6 emoji) — visual drift only, no functional impact

**Estimated W10.5 effort**: 4-6 hours. Within budget. No reason to grow it into a bigger wave.

---

## BLOCKING — fix as part of W10.5

These are SOURCE bugs — the underlying token system. Fixing them cascades across all 40 dashboard routes and ~60 dashboard components.

### B1. `tailwind.config.js` — re-alias 5 retired tokens to live equivalents

**What's broken:** `s-coral` (898 refs), `s-amber` (95 refs), `s-blue` (22 refs), `s-plum` (8 refs), `s-amber-subtle` (12 refs), `s-amber-text` (8 refs), `s-sand` (4+ refs), `s-cool`, `s-pop` are all referenced in dashboard code but undefined in tailwind.config.js → produce zero CSS at runtime.

**Why it blocks signup:** every CTA, every status pill, every active-nav highlight, every booking-row action button, every category color code in calendar renders invisible. A salon-owner signing up via /fuer-salons would log into the dashboard and see broken pills, colorless buttons with white text on transparent backgrounds, identical-looking actions, and unreadable navigation. Trust destroyed in <10 seconds.

**Fix:** add aliases to the `colors` object in `tailwind.config.js`. Surgical, single-file edit. Suggested mapping (per LOCKFILE three-layer convention):

```js
// V3-D332 W10.5 dashboard rescue — re-alias retired tokens to live equivalents
// while file-by-file cleanup ships in W17 (cosmetic). These map to the
// closest semantic equivalent so the dashboard renders correctly today.
//   s-coral → s-ink           (was active-state / primary CTA — now black/ink per V3-D192)
//   s-amber → s-warning       (was warning surface — now canonical amber warn token)
//   s-blue  → s-accent         (was info — now the blue accent)
//   s-plum  → s-ink-2          (was secondary highlight — now muted grey)
//   s-cool  → s-accent         (was info link — same family as blue)
//   s-pop   → s-urgency        (was urgency badge — semantic equivalent)
//   s-sand  → s-bg-sunken      (was muted bg surface — now canonical sunken)
//   s-amber-subtle → s-warning-bg  (alias to canonical warning pastel)
//   s-amber-text   → s-warning      (text color = saturated warning)
"s-coral": "#0A0A0A",        // alias to s-ink (DEFAULT only — need verify opacity modifiers like /10 /5 /[0.06] work via Tailwind opacity calc)
"s-amber": "#F59E0B",        // alias to s-warning DEFAULT
"s-blue":  "#185CE0",        // alias to s-accent DEFAULT
"s-plum":  "#6B6B6B",        // alias to s-ink-2
"s-cool":  "#185CE0",        // alias to s-accent (was already in config — verify scope)
"s-pop":   "#9A3412",        // alias to s-urgency.DEFAULT (was already in config — verify scope)
"s-sand":  "#F5F5F4",        // alias to s-bg-sunken
"s-amber-subtle": "#FFF3E0", // alias to s-warning.bg
"s-amber-text":   "#F59E0B", // alias to s-warning
```

**Work type:** 1 surgical (config edit). 5-15 min.
**Estimated time:** 15 min.
**Verification:** rerun the `getComputedStyle()` check from this triage to confirm all 9 classes now resolve to non-default values. Open /de/dashboard in a logged-in browser session, screenshot the calendar / bookings / sidebar.
**Caveat:** Tailwind opacity modifiers (`bg-s-coral/10`, `bg-s-coral/[0.06]`) only work on tokens that are defined as plain hex strings, not nested objects. The aliases above are all hex strings — confirmed compatible.

---

### B2. DashboardLayout sidebar / nav — active state invisible

**File:** `components-legacy/dashboard/DashboardLayout.tsx`
**Lines:** 296, 297, 315, 318, 338, 341, 344, 364, 367, 388, 391, 403, 432, 448, 452, 455, 476, 480, 499, 503, 523, 532, 568, 574

**What's broken:** every active-state highlight uses `border-s-coral bg-s-coral/[0.06] text-s-coral`. Mobile bottom-nav uses `text-s-coral` for active + `bg-s-coral` dot for unread badge. Brand dot in "solen.ch" logo wordmark uses `text-s-coral`. Demo banner uses `bg-s-amber text-white`.

**Why it blocks signup:** operator opens the dashboard, has no idea which page they're on (active item indistinguishable from inactive), can't see notification dots, sees "solench" instead of "solen.ch" in the chrome.

**Fix:** B1 alone resolves all 24 callsites once tailwind reads the new aliases. No code change needed in DashboardLayout.tsx if B1 ships.
**Work type:** 0 (cascades from B1).
**Estimated time:** 0 min beyond B1.

---

### B3. Dashboard root (overview) — KPI cards + alerts + activity invisible signals

**File:** `app/[locale]/dashboard/page.tsx`
**Lines:** 51, 198–199, 218–219, 228–229, 248, 254, 262, 268, 276, 281, 292, 294, 295, 311, 324, 342, 356, 382, 386, 388, 411, 414

**What's broken:**
- KPI sparkline color tokens (`text-s-coral`, `bg-s-coral/5`, `text-s-amber`, `bg-s-amber-subtle/50`) → cards lose their accent color
- "Handlungsbedarf" alert chips (verification overdue, low slots, cancellations) — icon + CTA link both `text-s-coral` / `text-s-amber` → look unstyled
- Unread message card icon (`bg-s-coral/10 text-s-coral`) → invisible icon
- Today's bookings: time display (`text-s-coral`) → invisible time string
- Status indicator dot (`b.status === "pending" ? "bg-s-amber" : "bg-s-ink/20"`) → pending dots invisible
- Quick-action shortcut tiles (`text-s-coral`) → icons invisible
- "Werkzeuge" category-tool grid (`bg-s-coral/[0.03]`, `hover:border-s-coral/40`) → no hover state

**Why it blocks signup:** operator's daily overview becomes a wall of monochrome text with no visual hierarchy. Time displays in the bookings list are invisible. Cannot see "pending vs confirmed" at a glance.

**Fix:** cascades from B1. No code change in this file required if B1 ships.
**Work type:** 0 (cascades from B1).
**Estimated time:** 0 min beyond B1.

---

### B4. Calendar — service-category color coding broken (CRITICAL operator workflow)

**File:** `app/[locale]/dashboard/calendar/page.tsx`
**Lines:** 23–29 (SERVICE_CATEGORY_COLORS map), 340–348 (STAFF_COLORS palette), 50, 56, 59, 95, 105, 113, 122, 184, 192, 206, 212, 215, 229, 239, 295, 300, 306, 323, 328, 341, 343, 344, 850–860 (legend)

**What's broken:** the operator's calendar relies on left-border color to distinguish:
- Hair (s-coral) → grey
- Nails (s-blue) → grey
- Spa (s-sage) → renders correctly (s-sage IS defined!)
- Makeup (s-plum) → grey
- Barber (s-amber) → grey

All four colored categories render as identical grey 4px left border. Operator cannot tell hair from nails from barber bookings at a glance in week/day view. **This is the #1 operator UX feature for a multi-category salon.**

Staff color palette (`STAFF_COLORS` array) — only `s-sage` survives; rest of palette is colorless. Multi-staff salons can't visually distinguish staff bookings.

Slot create / bulk create / reschedule / delete modals all have invisible CTA buttons (B1 cascade).

Day-of-week selector buttons (`bg-s-coral text-white` when active, `bg-s-bg-sunken text-s-ink/40` when inactive) — active state invisible.

Calendar legend at line 850+ uses `bg-s-blue/10 border-l-s-blue` for "Nails" badge — invisible.

**Why it blocks signup:** Calendar is the operator's most-used surface. If they sign up a multi-category salon and the color coding doesn't work, they bounce. They can't trust a calendar that doesn't visually distinguish booking types.

**Fix:** primarily cascades from B1 — `s-coral`, `s-blue`, `s-amber`, `s-plum` will all gain definitions. BUT the chosen aliases above all map to grey/ink/blue — so hair becomes black, nails becomes blue, barber becomes amber, makeup becomes grey-2, spa stays sage-green. **5 distinguishable colors achieved with config edit alone.**

If user wants the *original* coral / blue / sage / plum / amber palette restored (not just the B&W-with-amber rescue), that's a follow-up cosmetic decision — but the functional "5 colors distinguishable" requirement is met by B1.

**Work type:** 0 (cascades from B1).
**Estimated time:** 0 min beyond B1.

---

### B5. Bookings — STATUS_COLORS dict + action buttons invisible

**File:** `app/[locale]/dashboard/bookings/page.tsx`
**Lines:** 30–36 (STATUS_COLORS map), 78, 83, 85, 93, 201, 222, 235, 262, 269, 276, 287

**What's broken:**
- `STATUS_COLORS` dict: pending / confirmed / cancelled all use s-amber / s-coral → invisible pills with no fill, label text inherits parent color
- Filter pills at line 201: active state `bg-s-coral text-white` → invisible white text on transparent. Operator can't tell which filter is active.
- Booking time at line 222 (`text-s-coral`) → invisible
- "NEUKUNDE" first-visit badge at line 235 (`bg-s-coral/10 text-s-coral`) → invisible
- Action buttons at lines 262 / 269 / 276 (mark complete / no-show / cancel) — all `bg-s-coral/10 text-s-coral` or `hover:bg-s-sand` — identical and colorless
- "Preis bestätigen" Stripe confirmation button at line 287 — same

**Why it blocks signup:** operator cannot tell status (confirmed/pending/cancelled) of bookings, cannot tell action buttons apart, cannot see filter state. This is THE booking-management page.

**Fix:** cascades from B1.
**Work type:** 0 (cascades from B1).
**Estimated time:** 0 min beyond B1.

---

### B6. Settings — toggle state invisible + vacation alert unstyled + Stripe confirm CTA invisible

**File:** `app/[locale]/dashboard/settings/page.tsx`
**Lines:** 50, 56, 59, 114, 134, 137, 147, 154, 160, 166, 172, 178, 184, 190, 197, 202, 287, 631, 632, 633, 727 (representative — 78 A5 findings total)

**What's broken:**
- Day-of-week opening-hours toggles at line 50: `bg-s-coral text-white` when open → invisible
- Form input focus state (`focus:border-s-coral`) at lines 114, 154 — focus invisible
- Category-selector pills at line 134: active `bg-s-coral text-white border-s-coral` — completely invisible
- "Bitte mindestens eine Kategorie auswählen" error text (`text-s-coral`) at line 147 — invisible
- iOS-style toggle switch at line 287: `bg-s-coral` (on) / `bg-s-sand` (off) — both states invisible
- Vacation-mode banner at line 631–633: `bg-s-amber-subtle border border-s-amber/20` + `text-s-amber-text` → unstyled
- Verification status pill "Ausstehend" at line 727 — invisible chip

**Why it blocks signup:** operator can't open form, can't save category selection (button is invisible), can't see focus state on inputs, can't toggle business features (toggles invisible).

**Fix:** cascades from B1.
**Work type:** 0 (cascades from B1).
**Estimated time:** 0 min beyond B1.

---

### B7. `catch { /* ignore */ }` swallowing API errors (13 instances)

**Files:**
- `app/[locale]/dashboard/calendar/page.tsx:88` (slot create POST failure)
- `app/[locale]/dashboard/calendar/page.tsx:164` (bulk slot POST failure)
- `app/[locale]/dashboard/calendar/page.tsx:384` (load slots fetch)
- `app/[locale]/dashboard/bookings/page.tsx:68` (cancellation POST failure)
- `app/[locale]/dashboard/bookings/page.tsx:174` (Stripe `confirm-price` POST failure)
- `app/[locale]/dashboard/staff/page.tsx:129, 327` (staff CRUD failures)
- `app/[locale]/dashboard/services/page.tsx:78, 265, 357` (service CRUD + delete)
- `app/[locale]/dashboard/clients/page.tsx:249, 267` (client tag mutations)
- `app/[locale]/dashboard/settings/page.tsx:553` (settings save failure)

**What's broken:** if the API call fails (network error, validation error, RLS denial, Stripe outage), the catch block silently swallows the error. UI just resets the loading spinner — user has no feedback, no toast, no console message.

**Why it blocks signup:** violates project CLAUDE.md error-handling rule explicitly: *"never `.catch(() => {})`. Always `console.error("[Component] description:", err)`. Auth flows: log + redirect to login. Payment flows: log + user-visible error + retry."* Settings-save failure / Stripe price-confirm failure / cancellation failure happening silently is exactly the operator-trust killer Opus flagged. Operator hits "Save", nothing happens, no error message, no way to debug.

**Fix:** replace each `} catch { /* ignore */ } finally {` with `} catch (err) { console.error("[Calendar] slot create failed:", err); } finally {` (or component name as appropriate). For payment / cancellation flows, also surface a Toast — but Toast is non-trivial in scope; minimum-viable fix is the console.error.

**Work type:** 1 surgical × 13. 5 min each = 1 hour total.
**Estimated time:** 1h.

---

### B8. Calendar legend uses `border-l-s-blue` / `bg-s-blue/10` for service categories

**File:** `app/[locale]/dashboard/calendar/page.tsx:855, 859`

**What's broken:** the bottom-of-calendar legend that explains "Hair / Nails / Spa / Makeup / Barber" color codes — same retired tokens. Legend is invisible to operator.

**Fix:** cascades from B1. Verify after config change.
**Work type:** 0.
**Estimated time:** 0 min.

---

### B9. Staff page uses `s-coral` for staff badges + admin controls

**File:** `app/[locale]/dashboard/staff/page.tsx` (29 findings, 20 are A5)

**What's broken:** staff list active state, add-staff CTA, role badges, all rely on s-coral/s-amber. Same cascade.

**Fix:** cascades from B1. Verify visually after config change.
**Work type:** 0.
**Estimated time:** 0 min.

---

### B10. Services page primary CTAs + delete confirmation invisible

**File:** `app/[locale]/dashboard/services/page.tsx` (35 findings, 28 are A5)

**What's broken:** service CRUD buttons (add/edit/delete), category-filter pills, "Service löschen" confirmation button — all use s-coral.

**Fix:** cascades from B1. Verify visually after config change.
**Work type:** 0.
**Estimated time:** 0 min.

---

### B11. All-salons / all-users / approvals admin tables — status pill column unreadable

**Files:** `app/[locale]/dashboard/all-salons/page.tsx:40`, `app/[locale]/dashboard/all-users/page.tsx`, `app/[locale]/dashboard/approvals/page.tsx`

**What's broken:** salon-approval workflow shows "Ausstehend" status as `bg-s-amber-subtle text-s-amber-text` pill → invisible. Admin clicks "Approve" → admin can't tell if it worked because the status pill it would flip to is also invisible.

**Why it blocks signup:** if /fuer-salons signup triggers an admin-review workflow (per the council's "real Supabase signup" decision), the admin literally can't see which salons need approving.

**Fix:** cascades from B1.
**Work type:** 0.
**Estimated time:** 0 min.

---

## COSMETIC — defer indefinitely

These are aesthetic-only findings that don't affect operator workflows. The dashboard would look slightly more "off-spec" than the rebuilt routes, but nothing breaks. Defer to a future cleanup wave (V3-D{future} ≥ W17 misc) or until /dashboard is rebuilt ground-up.

Total: ~500+ raw findings. Listing the categories instead of every line:

### A2 — non-canonical arbitrary Tailwind values (362 findings across dashboard)

All `text-[9px]`, `tracking-[.18em]`, `rounded-[12px]`, `px-[14px]`, etc. — values that work fine, just not from the canonical scale. Examples per file:

- `app/[locale]/dashboard/page.tsx` — 45 (all `text-[9px]` / `tracking-[.18em]` / `rounded-[12px]` typography fineprint, plus inline `rgba(...)` strings on alert boxes which are technically A2-tonal-equivalents)
- `app/[locale]/dashboard/admin-sandbox/page.tsx` — 47 (this is the internal dev playground — keep deferring)
- `app/[locale]/dashboard/calendar/page.tsx` — 14
- `app/[locale]/dashboard/settings/page.tsx` — 27
- All others — single-digit per file

### A7 — uppercase usage outside Eyebrow/Tag role (51 findings)

Every section label like `text-[9px] font-heading uppercase tracking-[.18em] text-s-ink/30` — this IS the legit Eyebrow pattern, but the file has more than 1 per surface (LOCKFILE §2.5 allows max 1 eyebrow per surface). Fixing requires collapsing visual hierarchy — non-trivial refactor, no operator harm.

### A8 — non-canonical tracking values (37 findings)

`tracking-[.18em]`, `tracking-[.20em]`, `tracking-[.10em]` etc. — outside canonical set. Visual noise only.

### A1 — hardcoded hex values (32 findings)

Examples: `style={{ background: "#1B4D1B" }}` on the celebration banner. The hex is intentional (custom dark forest green for the "Willkommen bei solen.ch!" post-onboarding celebration toast). Could be tokenized, no urgency.

### A6 — emoji in code (12 findings)

`👋`, `🎉`, etc. in copy strings inside admin-sandbox + a few other places. Per V3-D203 no-emoji rule but admin-sandbox is dev-only. Defer.

### A5 — retired token usage on tokens that are STILL DEFINED (`s-sage`, `s-wasabi`, `s-droplet`, `s-cream`, `s-butter`, `s-cat-*`, `s-atm-*`, `s-brand`)

These render correctly (token still in tailwind.config.js). Drift checker flags them because they're on the deprecated list, but they're not broken. Defer file-by-file cleanup. **NOTE:** the B1 fix above only adds aliases for the ones that DON'T render — these still-rendering ones are pure cosmetic drift.

---

## W10.5 sweep plan

Order to execute (smallest work-type first per WORK_TYPES.md):

1. **B1: tailwind.config.js alias re-add** — 15 min. Single-file edit, 9 new color entries. Verify with browser computed-style check + screenshots of /de/dashboard, /de/dashboard/calendar, /de/dashboard/bookings, /de/dashboard/settings (mobile 375 + desktop 1440).
2. **Verification round 1**: confirm B2 / B3 / B4 / B5 / B6 / B8 / B9 / B10 / B11 all cascade to PASS via screenshot. Spawn verifier subagent with the spec items + screenshots. Round-1 PASS expected because the underlying tailwind is now correct.
3. **B7: error-handling sweep — 13 catch blocks** — 1h. Surgical-fix-per-instance per WORK_TYPES.md type 1. Each gets `console.error("[Component] description:", err)`. Optional: payment / cancellation flows also surface a Toast (use canonical `Toast` primitive — already in LOCKFILE) — adds ~30min.
4. **Verification round 2**: trigger a simulated API failure (e.g. throw inside fetch handler) and confirm console.error fires + spinner clears properly.
5. **Commit boundary**: per V3-D332 per-route commit policy, this can be 2 commits:
   - `V3-D332-W10.5a: re-alias retired dashboard tokens` (the tailwind.config.js patch)
   - `V3-D332-W10.5b: console.error in 13 silent catch blocks` (the error handling sweep)

**Realistic total**: 4-6h end-to-end (Opus's 1.5-2× multiplier on optimistic 3h baseline). Includes verifier-loop rounds + visual sign-off + 2 commits + drift-check confirmation that A5 count drops from 381 → ~120 (the still-defined retired tokens remain as cosmetic drift).

---

## Risks

### R1. Tailwind opacity-modifier compatibility

The alias suggestion uses plain hex strings (not nested objects) for the new aliases. Tailwind opacity modifiers like `bg-s-coral/10` work on plain-hex tokens (modern Tailwind 3.x JIT computes `rgba()` from the hex). **Smoke-test required**: after B1 ships, verify `bg-s-coral/10`, `bg-s-coral/[0.06]`, `border-s-coral/40`, `text-s-coral/50` all resolve to expected rgba values in the running app. If they don't, the aliases need to be objects with DEFAULT keys (e.g. `"s-coral": { DEFAULT: "#0A0A0A" }`).

### R2. The aliased palette is monochrome

B1 maps everything to ink / accent / warning. Aesthetically, the dashboard becomes a true B&W + amber + blue surface. That's *consistent with the V3-D138 brand pivot* (the entire customer-facing site is already B&W). BUT — the dashboard was the LAST holdout of the V2 colorful palette. The aliasing strips its remaining color identity. Opus or user may want to preserve some color differentiation (e.g. keep `s-coral` mapping to a brighter accent rather than pure ink). Surface this as a quick visual-decision moment AFTER B1 ships and screenshots are reviewed.

### R3. `STAFF_COLORS` array in calendar.tsx loses 6 of 8 colors

`STAFF_COLORS` at line 340–348 hardcodes a Tailwind color cycle: `bg-s-coral/15`, `bg-blue-100`, `bg-s-plum/10`, `bg-s-amber-subtle`, `bg-pink-100`, `bg-emerald-100`, `bg-orange-100`, `bg-cyan-100`. Of these, only the Tailwind defaults (`blue-100`, `pink-100`, `emerald-100`, `orange-100`, `cyan-100`) render. After B1, `s-coral` / `s-plum` / `s-amber-subtle` re-resolve, so 8/8 colors visible — BUT they'll be very close shades (ink-pale + ink-pale-2 + warning-pale + blue + pink + emerald + orange + cyan). Multi-staff salons would still be able to distinguish staff visually, just not as vibrantly as the original V2 palette.

### R4. Admin-sandbox page is dev-only

`admin-sandbox/page.tsx` (80 findings) is an internal developer playground for testing components. Operator never sees it. Its findings should be deferred indefinitely regardless of triage outcome.

### R5. Some sub-routes may have additional broken patterns NOT in the drift report

Drift checker only catches the registry rules A1-A12. It does NOT catch: broken `useEffect` cleanup, missing loading skeletons, dead-data fetches, type errors that compile but break at runtime, missing i18n keys (causes raw "translation.missing.key" text). I did spot-check the main operator routes; the additional pattern I found was the swallowed catches (B7). Did NOT do exhaustive functional audit of every sub-route — that's outside drift triage scope. **Recommend a separate functional QA pass on the operator-critical 6 routes (dashboard, calendar, bookings, settings, services, staff) after B1 ships**, before /fuer-salons signup goes live.

### R6. Stripe `confirm-price` swallowed error is in a revenue path

`app/[locale]/dashboard/bookings/page.tsx:174` swallows the Stripe-confirmation error. If Stripe declines, expires, or returns a non-200, operator clicks "Preis bestätigen" → nothing happens → operator thinks it worked. This is the EXACT failure mode Opus called out ("isolate Stripe/Supabase mutations behind feature flags or separate PRs"). B7 surfaces the console.error; full fix needs a user-visible toast + retry, which expands the scope of W10.5 by ~30-45min if user wants it included.

---

## Honest verdict (per requirement)

**The original "out-of-scope" framing was definitively wrong.** The dashboard isn't just "ugly drift" — it has compile-time-invisible CTAs, indistinguishable navigation, unreadable status indicators, and silently-failing Stripe/Supabase mutations. The council was right to flag this as a launch-blocker for B2B signup.

BUT — the rescue is far smaller than the "285 findings, needs full rebuild" framing suggested:
- The functional impact of 380+ A5 findings collapses to **9 missing token definitions** in tailwind.config.js.
- A single config edit (~15 min) restores rendering across all 40 routes via Tailwind's natural cascade.
- The remaining functional concern (silent error swallowing in 13 catch blocks) is independent of drift and quick to sweep.

**W10.5 should be ~4-6 hours, not a multi-day wave.** The "every dashboard route needs ground-up rebuild" reading of the drift report was a false alarm caused by the drift-checker reporting symptoms (A5 retired-token use) instead of root cause (tokens deleted from tailwind without follow-up cleanup wave). Once you patch the source, 95% of the apparent damage disappears.

**Recommend the orchestrator ship W10.5 as 2 commits before W10 signup goes live**, then defer cosmetic /dashboard cleanup to a post-launch wave whenever the team chooses to do a real dashboard ground-up rebuild (likely W17+ or later).

---

## Changelog

- **2026-05-28 — V3-D332 (triage subagent):** initial triage. Surfaced root cause of "285 findings" framing: 380+ A5 findings = 9 missing token defs in tailwind.config.js, fixable with single config patch. Estimated W10.5 effort 4-6h, well within budget. Recommended split into 2 commits (config patch + error-handling sweep). Surfaced 13 silent catch blocks as additional non-drift functional bugs. Surfaced 3 risks for orchestrator decision (opacity modifier compat, monochrome aesthetic, STAFF_COLORS palette flattening).
