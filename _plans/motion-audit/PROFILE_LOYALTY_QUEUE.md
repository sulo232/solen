# Motion audit , PROFILE / ACCOUNT / LOYALTY / QUEUE / WALK-IN / AUTH / REFUND

Read-only audit, 2026-07-25. Fourth and final slice: the customer-facing surfaces the first three
audits did not reach. Graded against exactly two authorities: `_design-system/MOTION.md` (THE SPEED
LAW, THE ENTER RECIPE, Motion sheet 22, the §4 easing set) and
`_design-system/research/TASTE_MOTION.md`. Cross-checked against `_plans/motion-audit/RANKED.md` so a
known pattern is reported as "another instance of RANK N", never as new. Where neither authority
covers a case, the row says **NO RULE COVERS THIS** rather than proposing a number.

**Summary.** 162 rows across 21 files, of which **156 are graded** (6 are pointers to components graded
elsewhere or server-only routes with nothing to grade). Those 156 rows cover ~190 distinct elements,
because a row that names several call sites of one shared class (`secondaryBtn` ×5, `Row` ×10) is graded
once. Verdict tokens , **185 over 156 rows**, since 29 rows honestly carry two (e.g. "OK on the hover
flip, MISSING press"):

| verdict | count |
|---|---|
| **OK** | 35 |
| **WRONG-TIER** | 47 |
| **MISSING** | 67 |
| **WCAG-2.2.2** | 26 |
| **NO RULE COVERS THIS** | 8 |
| **RULE-2** (as the sole verdict) | 2 |

Plus **4** rows tagged `+RULE-2` on top of another verdict (6 rows break hard rule 2 in total) and **13**
tagged `+RECIPE`. Thirteen further components are named as pointers at the end, five of them **not yet
audited by any of the four audits**.

The dominant finding here is **MISSING, not WRONG-TIER**, which inverts the shared-layer result. These
are the product's quiet screens (settings rows, refund links, auth links, stamp cards) and they were
built with hover-colour transitions and **no press feedback at all**: 67 rows ship nothing for a moment
the law names. The single worst concentration is the settings hub `app/[locale]/profile/settings/page.tsx`,
where **all ~17 of its navigation rows** are bare `<Link>`s with no transition class and no
`active:scale` , the whole screen is a list you tap and nothing acknowledges the tap.

The second finding confirms the brief: **the queue tracker carries FOUR independent infinite loops, not
two.** RANKED flagged the `animate-ping` and `.walkin-ring-pulse` pair; the screen also runs a
**700ms `transition-[width]`** progress bar (SPEED LAW hard rule 2 forbids animating width outright, and
700ms is the longest non-full-screen duration found anywhere in this audit) and a conditional
`animate-spin`. Precise locations are confirmed below at `:398`, `:446`, `:425`, `:560`.

Third, **`animate-pulse` is a WCAG 2.2.2 shape that RANKED's offender list does not name.** Tailwind's
default `pulse` is `2s cubic-bezier(0.4,0,0.6,1) infinite` and is not overridden in `tailwind.config.js`.
It ships as a three-dot page loader in three places (`walk-in-pay:369`, `walk-in-pay:384`,
`loyalty/stamp:66`), each of which also contradicts Motion sheet 22 ("Anything loading → skeleton
SHIMMER, content-shaped; spinners only INSIDE buttons").

Fourth, **the loyalty stamp fires a fake earned-moment on every mount.** Motion sheet 22 has an explicit
row for exactly this: *"Earned moment without a client event (e.g. stamp) | DO NOT fake on load | wire
`.animate-stamp-slam` only behind a real 'just earned' signal."* `StampCard.tsx:97-98` runs a 500ms
overshoot scale on the newest stamp keyed off `isNewest`, which is derived from the stamp COUNT, not from
any just-earned event , so it replays every time you open `/profile/stamps`. The component's real
celebration (`CelebrationRing`, gated on a `celebrate` prop) is **dead**: `stamps/page.tsx:153` and `:177`
never pass the prop, so it defaults to `false` and the actual reward-unlock peak has no celebration at all.

Fifth, **two success peaks hand-roll what MOTION.md says must never be rebuilt per surface.**
`queue/[token]:220` renders the walk-in completion check as a fully static disc, and
`loyalty/stamp:105-111` uses an inline `animation: fade-in-up 0.35s`. MOTION.md: *"Success peak →
SuccessMark + `.celebrate-rise` staggers | never a static check"* and *"Reuse on every success peak , do
not re-build the animation per surface."*

Sixth, **`AnimatePresence mode="wait"` appears a second time.** `auth/register:295` pairs it with
`slideSwitch` (`lib/animations.ts:113-127`: 400ms in, 250ms out), serialising the role→form step swap to
~650ms and making it non-interruptible , the same defect RANKED RANK 5 recorded at `BookingWizard.tsx:213`,
against SPEED LAW hard rule 4.

Seventh, the refund lane is the **best-behaved code in the product**: `RefundCaseView`,
`ReportRefundEntry` and `UpchargeApproveView` all declare `transition-transform duration-100 ease-snap`
on their commit buttons. That is the press tier, correct, with a named primary source (Miller 1968).
These four constants are the pattern the other ~100 presses should copy. Their secondary and ghost
buttons still ship no press feedback.

---

## ⚠️ Provenance , and the concurrent-fix delta (read this before acting on a row)

Every row below was read off the working tree as it stood **at the start of this audit**. **While the
audit was running, a concurrent session began landing the RANK 1 WCAG fixes** in files this audit
covers. Recording the delta rather than silently shipping stale rows:

**Already fixed since capture (these rows are DISCHARGED, do not re-fix):**

| row as captured | what it is now | effect |
|---|---|---|
| `queue/[token]:398` `animate-ping` infinite | `style={{animation:"ping 1s cubic-bezier(0,0,.2,1) 3 forwards"}}` , 3 cycles, 3s, holds final frame | **WCAG-2.2.2 discharged** |
| `.walkin-ring-pulse` (globals.css:920) infinite `box-shadow` | rebuilt: static inset ring on the base class, halo moved to `::after` animating **transform + opacity**, `2 forwards` (4.2s) | **WCAG-2.2.2 AND `+RULE-2` both discharged** for `queue:446` |
| `animate-shimmer` (tailwind.config.js:340) `1.5s infinite` | `1.5s ease-in-out 3 forwards` (4.5s) | **discharges the shimmer rows** at `profile/loading.tsx`, `profile/vouchers:106-108`, `profile/referral:51-57` |
| `.skeleton-shimmer` (globals.css:982) `infinite` | `1.5s ease-in-out 2 forwards`; its lying "(2 cycles, then stops)" comment corrected | discharges RANKED's contradiction #1 (no call sites in this scope) |

**Line numbers in `app/[locale]/queue/[token]/page.tsx` have since shifted by +7 below line 395** (the
fix added a 7-line comment). Current locations of the rows in section 1: `:398`→**`:402`** ·
`:412`→**`:419`** · `:425`→**`:432`** · `:446`→**`:453`** · `:560`→**`:567`**. Everything above line 395
(`:173`, `:186`, `:189`, `:220`, `:242`, `:265`, `:280`, `:288`, `:291`, `:309`, `:361`, `:370`) is
unmoved. All other files in this audit are unmodified.

**NOT fixed, still live as captured:** `animate-pulse` (`walk-in-pay:369`, `:384`,
`loyalty/stamp:66`), every `animate-spin` / `<Spinner>` row, `RefundCaseView:520`'s `animate-ping`,
`queue:432`'s `transition-[width] duration-700`, and **all 47 WRONG-TIER + 67 MISSING rows** , the
concurrent work is scoped to WCAG 2.2.2 only. Net after the delta: **21 of the 26 WCAG-2.2.2 rows remain
open.**

---

## Legend

| token | meaning |
|---|---|
| **OK** | duration matches the tier the law assigns for that job |
| **WRONG-TIER** | duration is in a different tier than the job calls for, or in the forbidden gap between tiers |
| **MISSING** | the law names a motion for this moment and the element ships none |
| **WCAG-2.2.2** | auto-starting looping motion, >5s possible, beside other content, no pause/stop mechanism |
| **NO RULE** | neither MOTION.md nor TASTE_MOTION.md covers this case , recorded, not invented |
| `+RULE-2` | SPEED LAW hard rule 2 also broken (animates something other than transform / opacity / filter) |
| `+RECIPE` | the locked ENTER RECIPE is hand-rolled per surface instead of imported from `primitives/motion.ts` |

Tier reference (MOTION.md, THE SPEED LAW): **press 80-100ms** · **snap 150ms** · **reveal 250-300ms** ·
**above 300ms = full-screen only**. Tier follows the JOB, never the surface.

**Reading the durations.** A bare `transition-colors` / `transition-transform` with no `duration-*`
resolves to Tailwind's default **150ms on cubic-bezier(0.4,0,0.2,1)**, which IS the snap tier , so for a
job whose tier is snap (hover colour, in-place chip flip) an implicit 150 is graded **OK**. For a job
whose tier is **press**, an implicit 150 is still WRONG-TIER, because the law assigns 80-100ms to press
and RANKED RANK 2 already names this exact mechanism: *"`active:scale-*` silently INHERITS the duration
of the colour transition it shares a class with."* Rows below say "(implicit 150ms)" wherever the number
is Tailwind's default rather than a declared one.

**`active:scale-*` with NO `transition-*` at all** applies instantly (0ms in and out). That is inside
Miller's 0.1s ceiling but is not the law's stated 80-100ms band. The law does not say whether 0ms is
legal, so those rows are graded **OK** with the fact recorded , not flagged, and not invented into a defect.

---

## 1 · `app/[locale]/queue/[token]/page.tsx` , THE QUEUE TRACKER

The brief's priority. **Confirmed and located: this screen carries FOUR independent auto-starting loops**
(`:398` ping, `:446` ring-pulse, `:425` a 700ms width transition that re-runs on every poll, `:560` a
conditional spin), on a screen whose entire purpose is to be watched for minutes while the poller at
`:126` refreshes every 8-25s. It is also the screen where a success peak is rendered fully static.

| file:line | element | its JOB | tier the LAW assigns | what it does TODAY | verdict |
|---|---|---|---|---|---|
| `:398` | LIVE badge twin dot | live status indicator | Motion sheet 22 blesses `animate-ping` for a REAL live status | `animate-ping` = Tailwind `ping 1s cubic-bezier(0,0,0.2,1) infinite`; runs the entire wait | **WCAG-2.2.2** , another instance of RANK 1 (RANKED names `queue/[token]:398`; **confirmed at that exact line**). Unconditional: no fetch gates it, it starts on render and never stops. |
| `:446` | active step node ring | current-step indicator | Motion sheet 22 has no row for a stepper node | `.walkin-ring-pulse` (globals.css:920) = `walkinRingPulse 2.1s glide infinite`, animating `box-shadow` | **WCAG-2.2.2 +RULE-2** , another instance of RANK 1. RANKED cited the utility at globals.css:920; **this is its call site, line 446.** `box-shadow` is not transform/opacity/filter (hard rule 2) and is the worst paint case (TASTE_MOTION finding 25). It renders 48px from the `:398` ping. |
| `:425` | wait-progress bar fill | progress feedback | in-place state flip → snap 150ms | `transition-[width] duration-700` | **WRONG-TIER +RULE-2 , NEW.** Two violations at once: hard rule 2 says *"Never animate width, height or top"*, and 700ms is 2.3x the 300ms ceiling on an element that is not a full-screen transition. It is also re-triggered on every poll (rule 5). **Longest non-full-screen duration in this audit.** |
| `:560` | refresh icon while fetching | loading indicator | Motion sheet 22: spinners only INSIDE buttons | `animate-spin` (`spin 1s linear infinite`) while `refreshing` | **WCAG-2.2.2** , another instance of RANK 1 (`animate-spin`, 62 occurrences). Bounded by a fast fetch in practice; unbounded in principle. |
| `:173` | full-screen page loader | route loading | Motion sheet 22: skeleton SHIMMER, content-shaped, NOT a bare spinner | bare `<Spinner>` = `animate-[spin_0.7s_linear_infinite]`, centred on an empty screen | **WCAG-2.2.2** , another instance of RANK 1, and a direct contradiction of the sheet-22 loading row. |
| `:220` | success disc + white check on the completed visit | THE success peak of the walk-in flow | MOTION.md: `<SuccessMark>` + `.celebrate-rise` staggers, *"never a static check"* | fully static `<div>` + `<Check>`; **zero motion** | **MISSING** , the named celebration component exists (`primitives/SuccessMark.tsx`) and is documented "reuse on every success peak, do not re-build per surface". This peak rebuilt it as a static div. |
| `:412` | `aheadCount` number | live position update | Motion sheet 22: "Live position/number updates → departure-board flip" | `.animate-num-flip` (globals.css:1163) = `num-flip 0.45s cubic-bezier(0.34,1.56,0.64,1)` | **WRONG-TIER** , correct vocabulary, wrong duration: 450ms exceeds the 300ms ceiling on an in-place number change. Rule 5 bites: it re-fires on every poll for the whole wait. |
| `:442-452` | step node fill/colour on advance | in-place state flip | snap 150ms | no transition class , colour jumps instantly | **MISSING** |
| `:456` | step connector line fill | in-place state flip | snap 150ms | no transition class , jumps instantly | **MISSING** |
| `:186` | "Zur Startseite" (not-found) | commit press | press 80-100ms | `transition-transform active:scale-[0.98]` (implicit 150ms) | **WRONG-TIER** , another instance of RANK 2 |
| `:189` | "Hilfe" link (not-found) | press | press 80-100ms | `transition-opacity active:opacity-60` (implicit 150ms) | **WRONG-TIER** , another instance of RANK 2 |
| `:242` | the 5 rating stars | press acknowledgement on the rating tap | press 80-100ms | `transition-transform active:scale-90` (implicit 150ms) | **WRONG-TIER** , another instance of RANK 2. Also `scale-90` (0.90) is outside the SOURCE §6 3-tier press convention entirely (CTA/card 0.97 · row 0.98 · icon 0.94). |
| `:247` | sentiment label after rating | element entrance | ENTER RECIPE / reveal 250-300ms | no motion, appears instantly | **MISSING +RECIPE** |
| `:251-267` | tip card block (rating ≥3) | element entrance | ENTER RECIPE / reveal | no motion | **MISSING +RECIPE** |
| `:265` | "Kein Trinkgeld, danke" | press | press 80-100ms | `transition-colors hover:text-s-ink-2`, no press feedback | **MISSING** (press) |
| `:270-294` | low-rating feedback card | element entrance | ENTER RECIPE / reveal | no motion | **MISSING +RECIPE** |
| `:275` | feedback textarea | focus edge | , | no transition; global ink-edge focus law applies | **NO RULE COVERS THIS** , no authority assigns a duration to the focus edge. |
| `:280` | help row link (low path) | row press | press 80-100ms | `transition-transform active:scale-[0.98]` (implicit 150ms) | **WRONG-TIER** |
| `:288` | "Feedback senden" | commit press | press 80-100ms | `transition-transform active:scale-[0.98]` (implicit 150ms) | **WRONG-TIER** |
| `:291` | "Überspringen" | press | press 80-100ms | no transition, no `active:` | **MISSING** |
| `:309` | home link (cancelled / no-show) | press | press 80-100ms | `transition-transform active:scale-[0.98]` (implicit 150ms) | **WRONG-TIER** |
| `:348-356` | salon photo carousel | finger-driven scroll | LOCKFILE §16.5 (gesture 1:1, interruptible) | native `snap-x snap-mandatory` scroll, no JS | **OK** , native scroll-snap is 1:1, velocity-aware and grabbable mid-settle by construction. |
| `:379-382` | photo counter "n / N" | count change | Motion sheet 22: "Count/badge changes → spring bump (`.animate-count-bump`)" | plain text swap, no key, no bump | **MISSING** |
| `:361` | frosted back button | icon press | press 80-100ms | `active:scale-95`, **no `transition-*`** → instant | **OK** (instant; inside Miller's 0.1s, outside the stated 80-100 band , the law is silent on 0ms) |
| `:370` | frosted help button | icon press | press 80-100ms | `active:scale-95`, no transition → instant | **OK** (same note) |
| `:467` | "while you wait" inspo card | card press | press 80-100ms | `transition-transform active:scale-[0.98]` (implicit 150ms) | **WRONG-TIER** |
| `:525` | address → maps row | row press | press 80-100ms | `transition-transform active:scale-[0.98]` (implicit 150ms) | **WRONG-TIER** |
| `:546` | "Wegbeschreibung" CTA | commit press | press 80-100ms | `transition-transform active:scale-[0.98]` (implicit 150ms) | **WRONG-TIER** |
| `:550` | home CTA (no-maps fallback) | commit press | press 80-100ms | `transition-transform active:scale-[0.98]` (implicit 150ms) | **WRONG-TIER** |
| `:555` | cancel-ticket X (destructive) | icon press | press 80-100ms | `transition active:scale-[0.98]` (implicit 150ms) | **WRONG-TIER +RULE-2** , bare `transition` = `transition-all`, so it animates every changed property including `box-shadow` and any geometry. |
| `:559` | refresh button | icon press | press 80-100ms | `active:scale-[0.98]`, no transition → instant | **OK** (instant) |
| `:566` | cancel-confirm `<Modal>` | overlay enter/exit | reveal 250-300 / exit `thud` | shared Modal primitive | pointer , graded in `PRIMITIVES_SHARED.md` (RANK 4: Modal exit runs on `snap`, the wrong shape) |
| `:572` | "Ticket behalten" | press | press 80-100ms | `transition-colors hover:bg-s-bg-sunken`, no press | **MISSING** (press) |
| `:580` | confirm-cancel (destructive) | press | press 80-100ms | `transition-colors hover:brightness-[1.06]`, no press | **MISSING** (press) |
| `:586` | in-button spinner while cancelling | in-button loading | Motion sheet 22 permits spinners INSIDE buttons | `animate-[spin_0.7s_linear_infinite]` | **WCAG-2.2.2** , blessed by sheet 22 and short-lived, but still an unbounded loop with no stop mechanism. Another instance of RANK 1. |

---

## 2 · `app/[locale]/walk-in-pay/page.tsx`

| file:line | element | its JOB | tier the LAW assigns | what it does TODAY | verdict |
|---|---|---|---|---|---|
| `:348` (used at `:373`, `:388`, `:396`) | `fade` variant on every branch | screen / block entrance | ENTER RECIPE 420ms glide (opacity+scale 0.96+blur 8px), SPEED LAW reveal 250-300ms | hand-rolled `{opacity:0, y:16}` → `{opacity:1, y:0}`, **400ms**, `cubic-bezier(0.25,1,0.5,1)` | **WRONG-TIER +RECIPE** , 400ms is over the 300 ceiling and is not a full-screen transition; and it animates opacity+y with **no scale and no blur**, the exact shape `motion-recipe-gate.py` blocks for net-new code. MOTION.md: *"Never hand-roll `initial`/`animate` per surface , import the variants."* |
| `:369` | three-dot page loader | route loading | Motion sheet 22: skeleton shimmer, content-shaped | `animate-pulse` ×3 with staggered `animationDelay`; Tailwind default `pulse 2s cubic-bezier(0.4,0,0.6,1) infinite`, **not overridden in `tailwind.config.js`** | **WCAG-2.2.2 , NEW SHAPE.** `animate-pulse` is not in RANKED RANK 1's offender list (shimmer / spin / ping / bounce / breathe / walkin-ring-pulse). Same conformance failure, unrecorded pattern. |
| `:384` | three-dot loader (paid → redirect) | loading | same | same `animate-pulse` ×3 | **WCAG-2.2.2** , another instance of `:369` |
| `:356` | back button | icon press | press 80-100ms | `transition-transform duration-200 active:scale-[0.94]` | **WRONG-TIER** , 200ms sits in the gap the law forbids ("three, and nothing between them"); another instance of RANK 5's de-facto fourth tier. Scale 0.94 is correct for the icon tier. |
| `:438` | salon review-count `(54)` | small tappable metadata press | press 80-100ms | `transition-opacity active:opacity-60` (implicit 150ms) | **WRONG-TIER** |
| `:449` | salon address → maps | link press | press 80-100ms | `transition-colors hover:text-s-ink` (implicit 150ms) | **OK** on the hover flip (snap), **MISSING** press |
| `:483` | barber review-count `(N)` | small tappable metadata press | press 80-100ms | `transition-opacity active:opacity-60` (implicit 150ms) | **WRONG-TIER** |
| `:503` | service-info (i) toggle | icon press | press 80-100ms | `transition active:scale-90` (implicit 150ms) | **WRONG-TIER +RULE-2** , bare `transition` = `transition-all`; and 0.90 is off the 3-tier press scale (icon = 0.94). |
| `:509` | service description disclosure | reveal | reveal 250-300ms | instant show/hide, no motion | **MISSING** |
| `:566` | `<Spinner>` while awaiting clientSecret | loading | Motion sheet 22: skeleton, not a bare spinner | `animate-[spin_0.7s_linear_infinite]` | **WCAG-2.2.2** , another instance of RANK 1 |
| `:578` | demo pay CTA | commit press | press 80-100ms | `transition-[transform,filter] hover:brightness active:scale-[0.98]` (implicit 150ms) | **WRONG-TIER** |
| `:584` | in-button pay spinner | in-button loading | permitted by sheet 22 | `animate-[spin_0.7s_linear_infinite]` | **WCAG-2.2.2** (blessed, unbounded) |
| `:602` | "anderen Salon wählen" CTA | commit press | press 80-100ms | `transition-[transform,filter] ... active:scale-[0.98]` (implicit 150ms) | **WRONG-TIER** |
| `:609` | "Salon ansehen" secondary | press | press 80-100ms | `transition-colors hover:text-s-ink active:opacity-60` (implicit 150ms) | **WRONG-TIER** |
| `:555` | `<WalkInPaymentForm>` (Stripe Elements) | third-party payment UI | , | Stripe-owned DOM | **NO RULE COVERS THIS** , the SPEED LAW governs our motion; a third-party iframe's is not ours to tier. |

---

## 3 · `app/[locale]/profile/settings/**`

### 3a · `SettingsForm.tsx`

The `duration-200` here is systemic: **12 of its controls run at 200ms**, the tier the SPEED LAW says
does not exist. Every submit button then makes its `active:scale-[0.97]` inherit that 200ms , the RANK 2
mechanism, five times in one file.

| file:line | element | its JOB | tier the LAW assigns | what it does TODAY | verdict |
|---|---|---|---|---|---|
| `:265` | "Foto ändern" button | press + hover | press 80-100ms / snap 150ms | `transition-colors duration-200 hover:bg-s-bg-sunken`, **no press** | **WRONG-TIER** (200 gap) **+ MISSING** press |
| `:267` | avatar-upload spinner | in-button loading | permitted by sheet 22 | `animate-spin` | **WCAG-2.2.2** , another instance of RANK 1 |
| `:282` | bio textarea | focus colour flip | snap 150ms | `transition-colors duration-150` | **OK** |
| `:300` | "Profil speichern" (identity) | commit press | press 80-100ms | `transition-opacity duration-200 active:scale-[0.97]` | **WRONG-TIER** , the press scale inherits the opacity transition's 200ms. Textbook RANK 2. |
| `:302` | saving spinner | in-button loading | permitted | `animate-spin` | **WCAG-2.2.2** |
| `:333` | "Profil speichern" (personal branch) | commit press | press 80-100ms | `transition-opacity duration-200 active:scale-[0.97]` | **WRONG-TIER** (dead branch , the route redirects , but the code ships) |
| `:334` | saving spinner (personal) | in-button loading | permitted | `animate-spin` | **WCAG-2.2.2** |
| `:362` | locale pills (4) | chip select, in-place flip | snap 150ms | `transition-colors duration-200`, **no press** | **WRONG-TIER** (200 gap) **+ MISSING** press |
| `:378` | "Profil speichern" (language) | commit press | press 80-100ms | `transition-opacity duration-200 active:scale-[0.97]` | **WRONG-TIER** |
| `:379` | saving spinner (language) | in-button loading | permitted | `animate-spin` | **WCAG-2.2.2** |
| `:390`, `:393` | `<Switch>` ×2 (notifications) | toggle flip | snap 150ms | shared Switch primitive | pointer , graded in `PRIMITIVES_SHARED.md` (`Switch.tsx:98`, the repo's only `thud` call site) |
| `:399` | "Profil speichern" (notifications) | commit press | press 80-100ms | `transition-opacity duration-200 active:scale-[0.97]` | **WRONG-TIER** |
| `:400` | saving spinner (notifications) | in-button loading | permitted | `animate-spin` | **WCAG-2.2.2** |
| `:412` | "Konto löschen" (destructive) | press + hover | press 80-100ms | `transition-colors duration-200 hover:bg-s-error-bg`, no press | **WRONG-TIER** (200) **+ MISSING** press |
| `:454` | bio textarea (default branch) | focus colour flip | snap 150ms | `transition-colors duration-150` | **OK** |
| `:463` | locale pills (default branch) | chip select | snap 150ms | `transition-colors duration-200`, no press | **WRONG-TIER + MISSING** |
| `:489` | "Profil speichern" (default) | commit press | press 80-100ms | `transition-opacity duration-200 active:scale-[0.97]` | **WRONG-TIER** |
| `:490` | saving spinner (default) | in-button loading | permitted | `animate-spin` | **WCAG-2.2.2** |
| `:526` | "Konto löschen" (default branch) | press | press 80-100ms | `transition-colors duration-200`, no press | **WRONG-TIER + MISSING** |
| `:566` | `ActionButton` (email + password update) | press + hover | press 80-100ms | `transition-colors duration-200 hover:bg-s-bg-sunken`, no press | **WRONG-TIER** (200) **+ MISSING** press |
| `:567` | ActionButton spinner | in-button loading | permitted | `animate-spin` | **WCAG-2.2.2** |
| `:600` | delete-modal cancel | press | press 80-100ms | `transition-colors` (implicit 150ms), no press | **MISSING** (press) |
| `:604` | delete-modal confirm (destructive) | press | press 80-100ms | `transition-colors hover:brightness-[1.06]` (implicit 150ms), no press | **MISSING** (press) |
| `:605` | deleting spinner | in-button loading | permitted | `animate-spin` | **WCAG-2.2.2** |

### 3b · `BeautyProfileForm.tsx`

| file:line | element | its JOB | tier the LAW assigns | what it does TODAY | verdict |
|---|---|---|---|---|---|
| `:106` | category tiles (multi-select) | in-place select flip | snap 150ms | `transition-colors` (implicit 150ms), no press | **OK** on tier, **MISSING** press |
| `:117-121` | selected check badge appearing | reveal of a selection mark | , | instant, no motion | **NO RULE COVERS THIS** , Motion sheet 22 has no row for a selection check-badge reveal. |
| `:134` | interest cards (multi-select) | in-place select flip | snap 150ms | `transition-colors` (implicit 150ms), no press | **OK** on tier, **MISSING** press |
| `:158` | "Beauty-Profil speichern" | commit press | press 80-100ms | `transition-opacity duration-200 active:scale-[0.97]` | **WRONG-TIER** , press inherits 200ms |
| `:159` | saving spinner | in-button loading | permitted | `animate-spin` | **WCAG-2.2.2** |
| `:188` | `ChipGroup` pills | chip select | snap 150ms | `transition-colors duration-200`, no press | **WRONG-TIER** (200 gap) **+ MISSING** press |

### 3c · `app/[locale]/profile/settings/page.tsx` , the settings hub

**The single worst MISSING concentration in this audit.** The whole screen is a tap-list and not one row
acknowledges a tap.

| file:line | element | its JOB | tier the LAW assigns | what it does TODAY | verdict |
|---|---|---|---|---|---|
| `:140` | `Row` `<Link>` (~10 call sites: `:88-103`) | list-row press | press 80-100ms, row tier `active:scale-[0.98]` | **no transition class, no `active:`** , nothing | **MISSING** |
| `:160` | `ExternalRow` `<Link>` (×3, `:123-125`) | list-row press | press 80-100ms | nothing | **MISSING** |
| `:111` | sign-out submit | press (destructive-ish) | press 80-100ms | nothing | **MISSING** |
| `:115` | "Konto löschen" link row | press | press 80-100ms | nothing | **MISSING** |
| `:190`, `:193` | identity pill links ×2 | press | press 80-100ms | nothing | **MISSING** |

---

## 4 · `app/[locale]/profile/**` , the rest

| file:line | element | its JOB | tier the LAW assigns | what it does TODAY | verdict |
|---|---|---|---|---|---|
| `haarprofil/HaarprofilForm.tsx:29` | hair-attribute pills | chip select | snap 150ms | `transition-colors duration-150`, no press | **OK** on tier, **MISSING** press |
| `haarprofil/HaarprofilForm.tsx:86` | "Speichern" | commit press | press 80-100ms | `transition-transform duration-150 active:scale-[0.98]` | **WRONG-TIER** , another instance of RANK 2 (correct property, wrong tier) |
| `loading.tsx:13-37` | 10 `<Skeleton>` blocks | route loading | Motion sheet 22: skeleton shimmer | `animate-shimmer` (tailwind.config.js:340) = `shimmer 1.5s ease-in-out infinite` ×**10 concurrent** | **WCAG-2.2.2** , another instance of RANK 1, and the highest concurrent shimmer count in this scope. |
| `vouchers/page.tsx:106-108` | 3 `<Skeleton>` | loading | same | `animate-shimmer` ×3 infinite | **WCAG-2.2.2** , another instance of RANK 1 |
| `vouchers/page.tsx:146` | `<EmptyState>` | block entrance | ENTER RECIPE / reveal 250-300 | `EmptyState.tsx:51-52`: opacity+scale, **250ms** | **OK** on tier, **+RECIPE** (no blur, hand-rolled rather than `motion.ts`) |
| `vouchers/page.tsx:151` | "Neuen kaufen" (empty-state CTA) | commit press | press 80-100ms | `transition-[filter] duration-150 hover:brightness active:scale-[0.98]` | **WRONG-TIER** , the press scale inherits the 150ms filter transition |
| `vouchers/page.tsx:191` | "Neuen kaufen" (bottom) | press | press 80-100ms | `transition-colors duration-150 hover:bg-s-bg-sunken`, no press | **OK** on the hover flip, **MISSING** press |
| `vouchers/page.tsx:226` | `VoucherCard` | not interactive | , | static | n/a |
| `referral/page.tsx:51-57` | 5 `<Skeleton>` | loading | Motion sheet 22 | `animate-shimmer` ×5 infinite | **WCAG-2.2.2** , another instance of RANK 1 |
| `referral/page.tsx:73` | "Anmelden" CTA | press + hover | press 80-100ms / snap 150ms | `hover:brightness-[1.06] transition-colors` | **MISSING , property mismatch.** `transition-colors` does **not** cover `filter`, so the declared brightness hover snaps instantly. A declared transition that transitions nothing. No press feedback either. |
| `referral/page.tsx:108` | copy-code button | press + hover | press 80-100ms | `hover:brightness-[1.06] transition-colors`, no press | **MISSING** , same `filter`/`colors` mismatch, plus no press |
| `referral/page.tsx:108` | Copy→Check icon swap on copy | confirmation of a completed micro-action | , | instant icon swap, no motion | **NO RULE COVERS THIS** , sheet 22's success row is for emotional PEAKS (`SuccessMark`); nothing covers a copy-confirm. |
| `referral/page.tsx:119` | WhatsApp share | press | press 80-100ms | `transition-colors hover:bg-[#25D366]/90` (implicit 150ms) | **OK** hover, **MISSING** press |
| `referral/page.tsx:127` | "Link kopieren" | press | press 80-100ms | `transition-colors hover:bg-s-ink/10` (implicit 150ms) | **OK** hover, **MISSING** press |
| `intake-forms/page.tsx:104` | accordion header | disclosure press | press 80-100ms | `hover:bg-s-bg-sunken transition-colors` (implicit 150ms), no press | **OK** hover, **MISSING** press |
| `intake-forms/page.tsx:122` | accordion body | reveal | reveal 250-300ms | instant show/hide, no motion | **MISSING** (note: an animated version must not use height , hard rule 2) |
| `intake-forms/page.tsx` (Spinner) | loading | Motion sheet 22 | `animate-[spin_0.7s_linear_infinite]` | **WCAG-2.2.2** , another instance of RANK 1 |
| `stamps/page.tsx:134` → `HeroStampCard.tsx:49` | hero stamp card | card press | press 80-100ms, card tier 0.97 | `transition-[transform] duration-150 active:scale-[0.99]` | **WRONG-TIER** , 150 on a press; and 0.99 is off the SOURCE §6 3-tier scale entirely. |
| `stamps/page.tsx:153`,`:177` → `StampCard.tsx:55` | stamp-card salon link | press | press 80-100ms | `transition-[background-color,color] duration-150` on properties that **never change** (no hover/active colour declared), no press | **MISSING** press , the declared transition is dead code. |
| `StampCard.tsx:97-98` | newest stamp pop | earned moment | **Motion sheet 22: "Earned moment without a client event (e.g. stamp) → DO NOT fake on load; wire `.animate-stamp-slam` only behind a real 'just earned' signal"** | `animate={isNewest ? {scale:[0.7,1.15,1]}}`, **500ms** , `isNewest` is derived from the stamp COUNT, so it replays on **every mount** | **WRONG-TIER + rule violation , NEW.** 500ms exceeds the 300ms ceiling on a non-full-screen element, and it is precisely the fake-on-load sheet 22 forbids by name. It is also a hand-rolled substitute for `.animate-stamp-slam`, which RANK 5 records as defined with zero call sites. |
| `StampCard.tsx:46` | `<CelebrationRing>` on reward unlock | THE loyalty success peak | MOTION.md: celebration on emotional peaks | gated on `celebrate`, which **`stamps/page.tsx:153` and `:177` never pass** → always `false` | **MISSING** , the reward-unlock peak ships no celebration. The wiring exists and is dead. |

---

## 5 · `app/[locale]/loyalty/stamp/page.tsx`

| file:line | element | its JOB | tier the LAW assigns | what it does TODAY | verdict |
|---|---|---|---|---|---|
| `:63-68` | three-dot loader | route loading | Motion sheet 22: skeleton shimmer | `animate-pulse` ×3 (`pulse 2s infinite`) | **WCAG-2.2.2** , same NEW shape as `walk-in-pay:369` |
| `:93` | "Stempel vergeben" | commit press | press 80-100ms | `hover:brightness active:scale-[0.97] transition-[transform,filter]` (implicit 150ms) | **WRONG-TIER** |
| `:105-111` | "Gestempelt!" icon | success peak | MOTION.md: `<SuccessMark>` + `.celebrate-rise` | inline `style={{animation: "fade-in-up 0.35s cubic-bezier(0.25,1,0.5,1) both"}}` | **WRONG-TIER + MISSING +RECIPE** , 350ms over the ceiling on a non-full-screen element, hand-rolled per surface against the explicit "do not re-build the animation per surface" rule, and it bypasses the locked celebration component. |
| `:135-152` | error state block | block entrance | ENTER RECIPE / reveal | no motion | **MISSING +RECIPE** |

---

## 6 · `app/[locale]/auth/**`

| file:line | element | its JOB | tier the LAW assigns | what it does TODAY | verdict |
|---|---|---|---|---|---|
| `register/page.tsx:295` | `AnimatePresence mode="wait"` + `slideSwitch` step swap | in-card step swap | reveal 250-300ms, hard rule 4 (interruptible) | `lib/animations.ts:113-127`: enter **400ms**, exit **250ms**, x ±40 , `mode="wait"` serialises them to ~650ms wall time | **WRONG-TIER +RECIPE**, **hard rule 4 broken** , another instance of RANK 5's `BookingWizard.tsx:213` finding. 400ms is over the ceiling for a swap inside a card (not full-screen), the swap cannot be interrupted, and the variant is x+opacity with no scale/blur. |
| `register/page.tsx:29` | "Kunde" role card | press + hover | press 80-100ms | `transition-colors duration-150`, no press | **OK** hover, **MISSING** press |
| `register/page.tsx:42` | "Salon" role card | press + hover | press 80-100ms | `transition-colors duration-150`, no press | **OK** hover, **MISSING** press |
| `register/page.tsx:38`,`:51` | chevron colour on group-hover | hover colour flip | snap 150ms | `transition-colors` (implicit 150ms) | **OK** |
| `register/page.tsx:149` | "Weiter" after email-sent | press | press 80-100ms | `transition-colors` (implicit 150ms), no press | **MISSING** press |
| `register/page.tsx:161`,`:169`,`:199`,`:213` | 4 inputs | focus colour flip | snap 150ms | `transition-colors` (implicit 150ms) | **OK** |
| `register/page.tsx:183` | password-strength bar | progress feedback | snap/reveal | `transition-[width] duration-300` | **RULE-2** , hard rule 2: *"Never animate width, height or top."* Tier itself (300) is inside reveal. |
| `register/page.tsx:223` | signup submit | commit press | press 80-100ms | `active:scale-[0.97] transition-transform duration-150` | **WRONG-TIER** , another instance of RANK 2 |
| `register/page.tsx:233`,`:322` | "Anmelden" links | press | press 80-100ms | no transition, no press | **MISSING** |
| `reset-password/page.tsx:111` | logo link | press + hover | press 80-100ms | `hover:opacity-80 transition-opacity` (implicit 150ms) | **OK** hover, **MISSING** press |
| `reset-password/page.tsx:141` | "Neuen Link anfordern" | commit press | press 80-100ms | `transition-transform active:scale-[0.97]` (implicit 150ms) | **WRONG-TIER** |
| `reset-password/page.tsx:149` | `<Spinner>` while verifying the link | loading | Motion sheet 22 | `animate-[spin_0.7s_linear_infinite]` | **WCAG-2.2.2** , another instance of RANK 1 |
| `reset-password/page.tsx:155`,`:189` | password inputs ×2 | focus colour flip | snap 150ms | `transition-colors` (implicit 150ms) | **OK** |
| `reset-password/page.tsx:163` | show/hide password toggle | icon press | press 80-100ms | `transition-colors hover:text-s-ink` (implicit 150ms), no press | **OK** hover, **MISSING** press |
| `reset-password/page.tsx:177` | password-strength bar | progress | snap/reveal | `transition-[width] duration-300` | **RULE-2** , another instance of `register:183` |
| `reset-password/page.tsx:198` | "Passwörter stimmen nicht überein" error | block entrance | ENTER RECIPE / reveal | no motion, appears instantly | **MISSING +RECIPE** |
| `reset-password/page.tsx:204` | "Passwort ändern" submit | commit press | press 80-100ms | `active:scale-[0.97] transition-[transform,filter] duration-150` | **WRONG-TIER** |
| `reset-password/page.tsx:216` | "Zurück zur Anmeldung" | press | press 80-100ms | `transition-colors hover:text-s-ink` (implicit 150ms), no press | **OK** hover, **MISSING** press |
| `login/page.tsx:27` | "Registrieren" link | press | press 80-100ms | no transition, no press | **MISSING** |
| `login/page.tsx:21` | `<SignIn>` | the login form itself | , | `components-legacy/auth/SignIn.tsx` | pointer , **NOT AUDITED** (outside the named scope; see the gap list) |
| `signup/page.tsx` | , | server redirect only | , | no rendered elements | n/a |

---

## 7 · `app/[locale]/referral/[code]/` + `app/[locale]/reviews/**`

| file:line | element | its JOB | tier the LAW assigns | what it does TODAY | verdict |
|---|---|---|---|---|---|
| `referral/[code]/page.tsx:88` | claim CTA (the page's only control) | commit press | press 80-100ms | `hover:brightness-[1.06] active:scale-[0.97] transition-[transform,filter] duration-150` | **WRONG-TIER** , another instance of RANK 2 |
| `reviews/page.tsx:100-113` | empty-state block | block entrance | ENTER RECIPE / reveal | no motion (also hand-rolls the locked `<EmptyState>` primitive) | **MISSING +RECIPE** |
| `reviews/_components/MarketplaceReviewsList.tsx:65` | "Mehr lesen / weniger" | text-clamp expansion | , | instant expand, no transition | **NO RULE COVERS THIS** , another instance of RANK 6 (*"text-clamp expansion has no vocabulary row"*). |
| `MarketplaceReviewsList.tsx:79` | salon link on a review card | press + hover | press 80-100ms | `transition-colors duration-150 hover:text-s-accent` | **OK** hover, **MISSING** press |
| `MarketplaceReviewsList.tsx:59` | `<RatingStars>` (display) | not interactive here | , | primitive | pointer , RANK 5 records its 450ms star-pop |
| `MarketplaceReviewsList.tsx:97-103` | the review list on first load | list first-load | Motion sheet 22: "List first-load → stagger rise-in (`.salon-card-stagger`)" | no stagger, no entrance | **MISSING** |

---

## 8 · `components-legacy/refund/**`

**The best-behaved motion code in the product.** All three files declare
`transition-transform duration-100 ease-snap active:scale-[0.985]` on their commit buttons , 100ms IS the
press tier, the only tier with a named primary source. Their secondary/ghost buttons and every `<Link>`
still ship no press feedback. The `0.985` value is off the SOURCE §6 3-tier scale (0.97 / 0.98 / 0.94).

| file:line | element | its JOB | tier the LAW assigns | what it does TODAY | verdict |
|---|---|---|---|---|---|
| `RefundCaseView.tsx:73` | `ctaAccent` (used `:192`, `:802`, `:864`) | commit press | press 80-100ms | `transition-transform duration-100 ease-snap active:scale-[0.985]` | **OK** , correct tier, correct property. Scale 0.985 is off the 3-tier convention (note, not a tier defect). |
| `RefundCaseView.tsx:520` | timeline "now" dot | live status indicator | Motion sheet 22 blesses ping for a **REAL** live status | `animate-ping` (`1s infinite`) , a refund case status does not change while the screen is open, and the screen has no endpoint | **WCAG-2.2.2** , another instance of RANK 1. RANKED named `RefundCaseView` without a line; **it is at `:520`.** |
| `RefundCaseView.tsx:75` | `secondaryBtn` (`:879`, `:892`, `:909`, `:929`, `:940`) | press + hover | press 80-100ms | `transition-colors duration-150 ease-snap hover:bg-s-bg-sunken`, no press | **OK** hover, **MISSING** press (5 call sites) |
| `RefundCaseView.tsx:77` | `ghostBtn` (`:812`, `:897`, `:913`) | press | press 80-100ms | `transition-colors duration-150 ease-snap`, no press | **OK** hover, **MISSING** press (3 call sites) |
| `RefundCaseView.tsx:278` | header back link | press | press 80-100ms | no transition, no press | **MISSING** |
| `RefundCaseView.tsx:763` | escalate reason pills | chip select | snap 150ms | `transition-colors` (implicit 150ms), no press | **OK** on tier, **MISSING** press |
| `RefundCaseView.tsx:776` | escalate note textarea | focus edge | , | no transition | **NO RULE COVERS THIS** |
| `RefundCaseView.tsx:~745-820` | the escalate form appearing on `setEscalating(true)` | block entrance | ENTER RECIPE / reveal | no motion | **MISSING +RECIPE** |
| `ReportRefundEntry.tsx:85` | `ctaAccent` (`:547`) | commit press | press 80-100ms | `duration-100 ease-snap active:scale-[0.985]` | **OK** |
| `ReportRefundEntry.tsx:87` | `ctaInk` (`:274`) | commit press | press 80-100ms | `duration-100 ease-snap active:scale-[0.985]` | **OK** |
| `ReportRefundEntry.tsx:89` | `ghostBtn` (`:252`, `:324`) | press | press 80-100ms | `transition-colors duration-150 ease-snap`, no press | **OK** hover, **MISSING** press |
| `ReportRefundEntry.tsx:388` | reason radio-cards | in-place select flip | snap 150ms | `transition-colors duration-150 ease-snap`, no press | **OK** on tier, **MISSING** press |
| `ReportRefundEntry.tsx:416` | description textarea | focus edge | , | no transition | **NO RULE COVERS THIS** |
| `ReportRefundEntry.tsx:466` | refund toggle track (`role="switch"`) | toggle flip | snap 150ms | `transition-colors duration-200` | **WRONG-TIER** , 200ms gap; another instance of RANK 5. It also hand-rolls the locked `<Switch>` primitive instead of importing it. |
| `ReportRefundEntry.tsx:472` | refund toggle knob | toggle travel | snap 150ms | `transition-transform duration-200 ease-spring` | **WRONG-TIER** , 200 gap; and `ease-spring` on a non-gesture element is **NO RULE** territory (LOCKFILE §16.5 covers gesture-driven springs only; RANK 6 records the gap). |
| `ReportRefundEntry.tsx:~490-530` | partial-amount block appearing on toggle-on | block entrance | ENTER RECIPE / reveal | no motion | **MISSING +RECIPE** |
| `ReportRefundEntry.tsx:499` | partial-amount input | focus edge | , | no transition | **NO RULE COVERS THIS** |
| `ReportRefundEntry.tsx:549` | in-button submit spinner | in-button loading | permitted by sheet 22 | `animate-[spin_0.7s_linear_infinite]` | **WCAG-2.2.2** , another instance of RANK 1 |
| `ReportRefundEntry.tsx:583` | `Shell` back button | icon press | press 80-100ms | no transition, no press | **MISSING** |
| `ReportRefundEntry.tsx:597` | `Shell` close X | close press | **Motion sheet 22: "Any close/X → press-collapse, icon tier (`active:scale-[0.94]`)"** | nothing at all | **MISSING** , a named, locked sheet-22 micro-moment left unwired. |
| `UpchargeApproveView.tsx:88` | `ctaSurcharge` (`:529`, `:639`) | the money commit press | press 80-100ms | `duration-100 ease-snap active:scale-[0.985]` | **OK** , the correct press on the surcharge approval, this product's second-most-consequential button. |
| `UpchargeApproveView.tsx:90` | `secondaryBtn` (`:335`, `:422`, `:471`) | press | press 80-100ms | `transition-colors duration-150 ease-snap`, no press | **OK** hover, **MISSING** press (3 call sites) |
| `UpchargeApproveView.tsx:94` | `declineBtn` (`:654`) | press | press 80-100ms | `transition-colors duration-150 ease-snap`, no press | **OK** hover, **MISSING** press |
| `UpchargeApproveView.tsx:692` | `Frame` back link | press | press 80-100ms | no transition, no press | **MISSING** |
| `UpchargeApproveView.tsx:~330-530` | outcome view swap (pending → approved / declined / failed) | full view change after the commit | reveal 250-300ms | instant re-render, no motion | **MISSING +RECIPE** , this is the peak of the flow (money approved) and it arrives with no transition and no `<SuccessMark>`. |
| `UpchargeApproveView.tsx:645`,`:660` | in-button Spinners ×2 | in-button loading | permitted | `animate-[spin_0.7s_linear_infinite]` | **WCAG-2.2.2** , another instance of RANK 1 |

---

## 9 · Routes with no motion surface of their own

Graded as zero rows: they are server wrappers, redirects, or thin shells that delegate every interactive
element to a component outside this scope.

`account/page.tsx` (redirect) · `account/messages/page.tsx` (redirect) · `profile/gift-cards/page.tsx`
(redirect) · `profile/settings/personal/page.tsx` (redirect) · `auth/signup/page.tsx` (redirect) ·
`bookings/[id]/refund/page.tsx`, `bookings/[id]/report/page.tsx`, `bookings/[id]/upcharge/page.tsx`
(server wrappers around the three `components-legacy/refund/**` components graded in section 8) ·
`profile/edit/page.tsx`, `profile/settings/{password,language,notifications,delete,beauty}/page.tsx`
(wrappers around `SettingsForm`, section 3a) · `profile/haarprofil/page.tsx` (wrapper around
`HaarprofilForm`) · `profile/error.tsx` (`ErrorFallback` primitive).

## 10 · Pointers , components reached from this scope but graded elsewhere, or NOT YET GRADED anywhere

| component | reached from | status |
|---|---|---|
| `primitives/Modal`, `Toast`, `Switch`, `TextInput`, `Skeleton`, `Avatar`, `RatingStars` | throughout | graded in `PRIMITIVES_SHARED.md` |
| `_components/profile/EmptyStateDiscovery.tsx:90` (`.animate-breathe`, 3.4s infinite) | `profile/stamps:109`, `profile/favorites:82`, `profile/looks:46` | graded (RANK 1 / PRIMITIVES_SHARED row 6). **Three more call sites found in this scope**, all customer-facing empty states with no endpoint. |
| `components-legacy/ui/EmptyState.tsx:51`, `ErrorState.tsx:47` | `profile/vouchers`, `profile/referral` | 250ms opacity+scale entrance , OK tier, `+RECIPE` (hand-rolled, no blur) |
| `components-legacy/ui/Spinner.tsx:24` | 9 call sites in this scope | `animate-[spin_0.7s_linear_infinite]` , the shared source of most WCAG rows above |
| **`_components/profile/ProfileTabs.tsx`** | `profile/page.tsx:185` | **NOT AUDITED , GAP.** Owns the /profile tab switch, the search filter and the sort toggle: three of the highest-frequency in-place flips on a customer screen (rule 5 territory). It sits in `app/[locale]/_components/profile/`, which falls between this audit's scope and `PRIMITIVES_SHARED.md`. |
| **`_components/profile/FavoritesList.tsx`** | `profile/favorites:?` | **NOT AUDITED , GAP** (same directory) |
| **`components-legacy/booking/BookingsList`** | `profile/bookings/page.tsx:3` | **NOT AUDITED , GAP** |
| **`components-legacy/auth/SignIn.tsx`** | `auth/login/page.tsx:21` | **NOT AUDITED , GAP.** The actual login form; this audit only reached its wrapper. |
| **`_components/tips/TipFlow.tsx`** | `queue/[token]:254` | **NOT AUDITED , GAP.** The Stripe tip flow rendered on the walk-in success peak. |

---

## 11 · Contradictions found in our own docs (stated, not silently fixed)

1. **Motion sheet 22 mandates spinners "only INSIDE buttons"**, yet five surfaces in this scope render a
   bare full-screen `<Spinner>` as the route loader (`queue/[token]:173`, `walk-in-pay:566`,
   `intake-forms`, `reset-password:149`, plus the `animate-pulse` three-dot loaders). The same sheet's
   loading row says the answer is a content-shaped skeleton. Two of the surfaces in this scope
   (`profile/loading.tsx`, `profile/vouchers`) do it correctly, so the pattern exists and is simply not
   applied consistently.
2. **Motion sheet 22 blesses `animate-ping` for a "Live status dot (REAL state only)"** while
   TASTE_MOTION finding 14 makes any such unbounded loop a Level A conformance failure. `queue:398` and
   `RefundCaseView:520` sit exactly on that contradiction: both are following the sheet.
3. **Motion sheet 22 forbids faking an earned moment on load** and names the stamp as its example, yet
   `StampCard.tsx:97` does precisely that , and `.animate-stamp-slam`, the utility the sheet says to use,
   still has zero call sites (RANK 5).
4. **`ReportRefundEntry.tsx:466-472` is a second `<Switch>`.** The design contract says the states are
   componentised and locked, "USE them, don't hand-roll". This one runs at 200ms against the primitive's
   own timing, so the same control has two different speeds in the product.
5. **`profile/referral/page.tsx:73` and `:108` declare `hover:brightness-[1.06]` with
   `transition-colors`.** `filter` is not a colour property, so the transition covers nothing the hover
   changes. `StampCard.tsx:55` has the mirror problem: it transitions `background-color,color` on an
   element whose colours never change. Both are transitions that transition nothing.
