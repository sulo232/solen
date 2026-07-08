# Frontend audit , full estate, WAVE 1 (customer surfaces), 2026-07-08

<!-- exists-check: extends _design-system/research/PSYCH_AUDIT_2026-07-07.md + AUDIT_CHANGELIST_2026-07-07.md (psychology, 12 surfaces) and CONSISTENCY_AUDIT.md (design drift, code-grep). Net-new: full-surface coverage incl. never-audited surfaces, and the design-system/consistency/copy/icons/states axes per surface. Nothing here duplicates a still-valid existing finding; those are reconciled below. -->

**Method.** 14 customer-surface buckets. Each read by a sonnet audit agent against the whole law stack (PSYCHOLOGY.md 15 laws, LOCKFILE design contract, CLAUDE.md 10 taste rules + copy economy, CONSISTENCY_AUDIT canonicals, states/a11y, icons, motion), then every finding re-checked at file:line by a separate read-only verifier. 28 agents, 0 errors, 230 files read. Workflow `wf_1927222c-801`.

**Tally.** 187 verified findings , **71 high**, 96 medium, 20 low. 187 are net-new (not in the 2026-07-07 changelist). Fix class: 166 code, 21 mockup-first.

**Verification caveat (stated, not hidden).** The verifier pass dropped 0 of 187 findings. That is not a normal adversarial yield, so the orchestrator independently spot-checked 7 high findings against source: 7/7 confirmed verbatim. Treat `verdict: PLAUSIBLE` rows as needing a second look before they are actioned; `CONFIRMED` rows carry a quoted line.

**Reconciliation of the 2026-07-07 psychology audit.** 66 still-valid, 7 not-applicable, 1 wrong-line, 0 already-fixed. Confirms the 77-item changelist was never applied. Those items are NOT re-listed here as new; this file adds what that audit did not cover.

---

## Cross-cutting patterns (fix the pattern, not the file)

These are the same defect repeated. Fixing them at the primitive kills most of the 187.

| pattern | count | files |
|---|---:|---|
| Ink/black fill on a selected state (banned) | 20 | 18 |
| Arbitrary radius (off the scale) | 20 | 18 |
| Sub-44px touch targets | 16 | 15 |
| Tracked-uppercase / all-caps labels | 14 | 13 |
| Bare star rating, no review count (law 6) | 12 | 11 |
| Hardcoded German / missing i18n | 12 | 12 |
| Fabricated data rendered as fact | 10 | 10 |
| Bare spinner instead of Skeleton | 9 | 9 |
| Banned icons (Sparkles/Star glyph) | 7 | 7 |
| Decorative dots (banned) | 7 | 6 |
| Dead-end empty/error states | 4 | 4 |
| Dead / orphaned code | 3 | 3 |
| Raw hex instead of token | 2 | 2 |
| Other / one-offs | 51 | 35 |


---

## Root cause of the biggest finding class: a phantom gate

The audit found 20 ink/black-fill selected states on customer surfaces. A grep of the
whole tree puts the real number at **62 across 44 files** (18 customer, 5 dashboard,
39 components-legacy), plus 6 `ring-s-ink` / `border-s-ink` dialects of the same defect.

This is not a taste question. The owner settled it by voice on **2026-06-29**: every
selected/active state is the calm gray TabPill treatment (`bg-s-bg-sunken` + `text-s-ink`
+ semibold), never black/ink. It supersedes ink-fill (V3-D421) and blue-border (V3-D450).
The approved mockup already exists at `public/_mockups/selected-states-redesign.html`.

**Why it never got enforced:** three canonical documents cite a gate named
`no-black-selected` as the enforcement.

- `CLAUDE.md:53` , "NEVER black/ink fill on a selected state (gate `no-black-selected`)"
- `_design-system/LOCKFILE.md:1215` , "(owner 2026-06-29, gate `no-black-selected`)"
- `_design-system/REMOVED.md:41` , "hook no-black-selected-gate.py"

**That gate did not exist.** Not as a file, not inside another hook, not in
`.claude/settings.json`. Verified 2026-07-08 by `find`, by grep across `.claude/hooks/`,
and by reading the settings `PreToolUse` chain. Three documents asserted an enforcement
that had never been built, so the decision read as enforced and drifted for ~5 weeks.

This is the exact failure mode the estate keeps hitting (memory `feedback_rules_are_hooks`:
a rule that keeps getting broken has to become a hook, not advice) and it is precisely why
rule 16 exists (a mention is not proof of existence). A doc citing a gate is not a gate.

**Fixed 2026-07-08.** `.claude/hooks/no-black-selected-gate.py` now exists, self-tested
14/14 (4 real audit violations block; commit-CTA, `variant === "primary"`, the correct gray
treatment, the calendar `today` marker, `disabled`, the `Avatar` SelectedCheckBadge
exception, the `selected-ok:` escape, the net-new rule, out-of-scope files, and border-only
ink all pass). Wired into `PreToolUse` for Edit / Write / MultiEdit. The three citations
above are now true.

**Consequence for the mockup queue:** the selected-state sweep needs **no mockup**. The
treatment is already owner-approved and a mockup already exists. It is a `[code]` sweep of
62 call-sites, best done at the primitive. This removes the single largest block from the
mockup list and moves it to the layered loop.

---

## Surface-by-surface plan

Every surface, every aspect. `[code]` = mechanical (honesty, a11y, token swap, dead code) , ships via the layered loop, no mockup needed. `[mockup]` = visual treatment , mockup-first, owner approval before code.

### Homepage + global chrome  `home`

*21 files read · 14 findings (9 high) · 0 mockup-class · prior psych coverage: homepage*

**Fabricated data (no-fabrication law)**

- **HIGH** `[code]` `app/[locale]/_components/homepage/Nearby.tsx:130` ·  net-new · confirmed
    - rule: PSYCH law 9 (real numbers only, no fabricated scarcity/urgency) + PSYCH law 10 ethics line (no invented stakes) + taste rule 1 (no fabricated data)
    - problem: resolveAvailability() manufactures an urgency count with no data source: `const slotsLeft = (idx % 3) + 1; return { state: "urgent", label: `Nur ${slotsLeft} heute` };`. Every homepage visitor sees "Nur 1/2/3 heute" cycling purely by array index, not real slot inventory. Code's own comment admits: "Demo cycles 1/2/3 by idx; Phase 2 derives from real booking density."
    - fix: Remove the urgency pill entirely until a real booking-density query exists, or gate it behind a genuinely live slotsLeft field computed server-side.
- **HIGH** `[code]` `app/[locale]/_components/homepage/Reviews.tsx:44` ·  net-new · confirmed
    - rule: PSYCH law 9 (real numbers only, no fabricated social proof) + taste rule 1 (no fabricated data)
    - problem: REVIEWS array (lines 44-117) is entirely invented testimonials (fake names, relative dates, quote text) attributed to real salon slugs, rendered via useState<Review[]>(REVIEWS) as the default. The fetch handler explicitly does `if (items.length === 0) return; // keep fallback`, so fabricated reviews stay live indefinitely, not just during a brief load flash, whenever /api/reviews/featured returns empty or errors.
    - fix: Use an EmptyState ("Noch keine Bewertungen") instead of invented testimonials when the real API returns empty, or seed the DB with real launch reviews.
- **HIGH** `[code]` `app/[locale]/_components/homepage/BusinessTeaser.tsx:73` ·  net-new · confirmed
    - rule: PSYCH law 9 (real numbers only) + taste rule 1 (no fabricated data)
    - problem: "Mehr Buchungen, weniger Aufwand. Über 1'200 Schweizer Salons sind schon dabei." is a hardcoded literal count with no query behind it anywhere in this file or a data prop.
    - fix: Either compute the real live salon count server-side and interpolate it, or drop the specific number for qualitative copy until a real count exists.
- **HIGH** `[code]` `app/[locale]/_components/homepage/forYouSalons.ts:43` ·  net-new · confirmed
    - rule: PSYCH law 9 (real numbers only) + taste rule 1 (no fabricated data)
    - problem: FORYOU_SALONS (same pattern as Nearby.tsx's DEMO/NEARBY_ADDRESSES) attaches real salon UUIDs/slugs to hand-authored priceFromCHF and address constants (e.g. Nail Studio Bliss shows "Bahnhofstrasse 28" / "CHF 45") that are not the salon's real DB address or price. These values render directly on homepage SalonCards via ForYouSalonRows.tsx and Nearby.tsx.
    - fix: Fetch real salon address + service floor price from the DB for these curated rows instead of hand-authored placeholder constants, or gate the sections as curated placeholder content until wired.
- **HIGH** `[code]` `app/[locale]/_components/homepage/ForYouSalonRows.tsx:25` ·  net-new · confirmed
    - rule: CLAUDE.md silent no-ops ("a control that renders but does nothing") + PSYCH law 15 (personalization is additive, never silent)
    - problem: wantsDeals is computed from prefs.interests.includes("deals") (line 84) and threaded into ForYouRow as a prop (line 25), but it is never referenced anywhere in ForYouRow's body (lines 22-68), no discount badge, no different sort, nothing happens. FORYOU_DEALS (forYouSalons.ts:71) is never imported anywhere in the app. A user who picks "deals" gets an identical homepage to one who didn't.
    - fix: Either wire FORYOU_DEALS into an actual "Deals für dich" ForYouRow when wantsDeals is true, or remove the dead wantsDeals prop and FORYOU_DEALS export.

**Design contract**

- **HIGH** `[code]` `app/[locale]/_components/homepage/SearchBar.tsx:452` ·  net-new · confirmed
    - rule: LOCKFILE selected/active contract: filter pill / chip / sort segment = neutral sunken selected, never blue, never black (gate no-black-selected)
    - problem: Both the service-chip picker (line 452-453) and the period-of-day chip picker (line 567-568) use a literal ink/black fill for the selected state: `isPicked ? "border-s-ink bg-s-ink text-white" : ...`. This is the pattern the design contract bans by name for filter/chip selection.
    - fix: Replace `border-s-ink bg-s-ink text-white` with the locked TabPill treatment: `bg-s-bg-sunken text-s-ink font-semibold`, matching every other selected pill/chip in the design system.
- **HIGH** `[code]` `app/[locale]/_components/homepage/MobileCategoriesRow.tsx:98` ·  net-new · confirmed
    - rule: LOCKFILE selected/active contract: calm gray fill only, never ink border/fill (supersedes ink-fill V3-D421 AND blue-border V3-D450)
    - problem: The picked category tile uses `isPick ? "bg-white border-[1.5px] border-s-ink" : "bg-white shadow-float"`, a white bg + ink border for selected, not the locked bg-s-bg-sunken gray fill.
    - fix: Swap the isPick branch to bg-s-bg-sunken fill (drop the border, keep the existing ink check badge), matching the TabPill selected recipe used everywhere else.

**Consistency / drift**

- **HIGH** `[code]` `app/[locale]/_components/homepage/SalonCard.tsx:346` ·  net-new · confirmed
    - rule: feedback_no_times_in_listings: never a TIME on cards/listings; Heute/Morgen or TT.MM only, times live in the booking picker
    - problem: NextSlotText bolds a literal clock time out of the label: `const m = label.match(/^(.*?)(\d{1,2}:\d{2})$/); ... <strong>{m[2]}</strong>`. It's fed HH:MM strings from Nearby.tsx's formatNextSlot() (e.g. "15:30", "14:30") and similar callers, so homepage SalonCards render specific clock times, which the project's own locked rule bans.
    - fix: Strip the time portion before it reaches the card (show only "Heute", "Morgen", or a weekday/date), never HH:MM; reserve exact times for the booking picker.
- **MEDIUM** `[code]` `app/[locale]/_components/homepage/SearchBar.tsx:363` ·  net-new · confirmed
    - rule: CONSISTENCY_AUDIT.md canonical: rounded-[13px] phantom, not on the radius scale, should be rounded-btn/rounded-input
    - problem: The main search CTA (rounded-[13px] md:rounded-full, line 363) and every CollapsedRow (rounded-[13px], line 666) use an arbitrary 13px radius instead of a design-system token.
    - fix: Replace rounded-[13px] with the locked pill/rounded-btn token per the button/chip radius rule.
- **MEDIUM** `[code]` `app/[locale]/_components/homepage/SalonCard.tsx:486` ·  net-new · plausible
    - rule: CONSISTENCY_AUDIT.md canonical: card photo radius = rounded-card(16), kill 18/22
    - problem: The card photo uses rounded-[22px] (line 486), banned drift against the locked rounded-card(16) token. The trailing comment reads `// mockup-ok: /dev/card-ratio approved 3/2 (owner 2026-07-02)`, which names the 3/2 aspect ratio as approved, not the 22px radius, so this reads as unreconciled drift.
    - fix: If the 22px radius was not part of the owner's 3/2 aspect-ratio approval, change it to rounded-card (16px). If it was approved, add an explicit radius note to the comment.

**States + accessibility**

- **HIGH** `[code]` `app/[locale]/_components/layout/Header.tsx:584` ·  net-new · confirmed
    - rule: LOCKFILE icon-button = h-11 w-11 (44px) + a11y touch-target floor (44px minimum)
    - problem: The home-icon button (line 584), the back button (line 606), and the hamburger menu button (line 778) all use h-10 w-10 (40px), under both the locked icon-button spec and the 44px floor. All render on every page including the homepage's global header.
    - fix: Bump all three to h-11 w-11, matching the icon-button spec used correctly elsewhere.
- **MEDIUM** `[code]` `app/[locale]/_components/layout/CityTopBar.tsx:185` ·  net-new · confirmed
    - rule: a11y touch-target floor (44px minimum), LOCKFILE icon-button spec
    - problem: The dismiss X button is h-6 w-6 (24px, line 185) and the confirm arrow button is h-8 w-8 (32px, line 258), both well under the 44px floor. CityTopBar mounts in app/[locale]/layout.tsx, so it renders site-wide above Header on every route including the homepage.
    - fix: Wrap each in a min-h-11 min-w-11 tappable outer element, keeping the smaller visible glyph centered inside.
- **MEDIUM** `[code]` `app/[locale]/_components/homepage/Entdecken.tsx:91` ·  net-new · confirmed
    - rule: CLAUDE.md silent no-ops / broken-link risk
    - problem: const [looks, setLooks] = React.useState<Look[]>(DEMO) renders DEMO cards immediately on mount as real, clickable <Link> elements (line 189-193) to /${locale}/inspo/${look.slug} with invented slugs ("voluminous-layers", "cool-hair-life", etc, defined at line 58-64) that don't correspond to real discovery_items rows; the /inspo/[id] route (app/[locale]/inspo/[id]/page.tsx) expects a real DB id. The real fetch to /api/discovery/feed only swaps these out after it resolves. A user who taps a card before that resolves lands on a broken page.
    - fix: Either render a loading skeleton until the real fetch resolves, or make DEMO cards non-interactive placeholders until real data arrives.

**Icons**

- **MEDIUM** `[code]` `app/[locale]/_components/homepage/SearchBar.tsx:111` ·  net-new · confirmed
    - rule: feedback_icon_rules: real Lucide icons only; no sparkles/star glyph
    - problem: The service-chip picker uses the Lucide Sparkles icon for both "Nails" (line 111) and "Maniküre" (line 114), the sparkles glyph is explicitly on the project's banned-icon list.
    - fix: Swap Sparkles for a category-appropriate Lucide icon (e.g. reuse the Hand icon already imported in this file for Massage).


### Auth + onboarding  `auth-onboarding`

*11 files read · 20 findings (9 high) · 2 mockup-class · prior psych coverage: auth*

**Design contract**

- **HIGH** `[code]` `app/[locale]/onboarding/OnboardingFlow.tsx:171` ·  net-new · confirmed
    - rule: Design contract 'selected/active': calm GRAY fill bg-s-bg-sunken, NEVER black/ink fill on a selected state (gate no-black-selected)
    - problem: The single-select chip step (gender/hair/skin) renders the selected chip with `on ? "bg-s-ink text-white" : "border border-s-border bg-white text-s-ink hover:bg-s-bg-sunken"` , a solid ink/black fill on the chosen chip, verified verbatim at this line.
    - fix: Swap the selected branch to `bg-s-bg-sunken text-s-ink font-semibold`, matching the locked TabPill treatment used everywhere else.
- **HIGH** `[code]` `app/[locale]/onboarding/salon/page.tsx:116` ·  net-new · confirmed
    - rule: Design contract 'selected/active': calm GRAY fill, NEVER black/ink fill on a selected state (gate no-black-selected)
    - problem: Salon-registration category pills: selected branch is `bg-s-ink text-white border-s-ink shadow-elevation-2`, verified verbatim at this line, solid ink fill on the chosen category.
    - fix: Replace the selected branch with `bg-s-bg-sunken text-s-ink font-semibold border-s-ink/[0.08]` (no ink fill).
- **HIGH** `[code]` `app/[locale]/onboarding/salon/page.tsx:87` ·  net-new · confirmed
    - rule: Taste rule 4 (semantic colour independent of interactive-blue: error = red, blue = interactive-only)
    - problem: Validation-error borders use `errors.name ? "border-s-accent" : "border-s-border"` (line 87), `errors.email ? "border-s-accent" : "border-s-border"` (line 99), and `errors.city ? "border-s-accent" : "border-s-ink/5"` (line 133), verified verbatim. The blue s-accent link colour signals an invalid field, while the error text below correctly uses text-s-error (red) , border and message disagree on what colour means error.
    - fix: Swap `border-s-accent` to `border-s-error` on all three conditional borders (lines 87, 99, 133).
- **MEDIUM** `[code]` `components-legacy/auth/SignIn.tsx:209` ·  net-new · confirmed
    - rule: Design contract 'focus': inputs get ONE ink edge + soft halo, set globally; primitives add NO extra outline/ring (V3-D449, no double ring)
    - problem: Email input: `focus:outline-none focus:bg-white focus:border-s-accent focus:ring-2 focus:ring-s-accent/15`, verified verbatim at line 209. Identical pattern also present at the password input (line 218) and the reset-mode email input (line 180): `focus:outline-none focus:border-s-accent focus:ring-2 focus:ring-s-accent/15`.
    - fix: Drop the local `focus:border-s-accent focus:ring-2 focus:ring-s-accent/15` overrides at lines 180, 209, 218; let the global :focus-visible ink-halo apply.
- **MEDIUM** `[code]` `app/[locale]/auth/register/page.tsx:164` ·  net-new · confirmed
    - rule: Design contract 'focus': inputs get ONE ink edge + soft halo, set globally; primitives add NO extra outline/ring (V3-D449)
    - problem: All four StepRegister inputs (email 164, password 172, salon-name 186, birthday 199) carry `focus:outline-none focus:border-s-accent focus:ring-2 focus:ring-s-accent/15`, verified verbatim at each line. The same pattern verified present in app/[locale]/auth/reset-password/page.tsx at lines 156 and 183, and in app/[locale]/onboarding/salon/page.tsx at lines 87, 99, 133, 236, 263, 279.
    - fix: Remove the local blue focus classes from all listed inputs; rely on the global focus-visible ink+halo.
- **MEDIUM** `[code]` `components-legacy/auth/TosPrompt.tsx:84` ·  net-new · confirmed
    - rule: Taste rule 3: blue is SPARSE, small clickable bits only, never a decorative/non-clickable element
    - problem: Header icon circle: `<FileText size={24} className="text-s-accent" />` inside a non-interactive `bg-s-ink/10` disc, verified verbatim , a purely decorative icon coloured with the sparse interactive blue.
    - fix: Change the icon colour to text-s-ink, reserving blue for the actual clickable Weiterlesen links below it.
- **MEDIUM** `[code]` `app/[locale]/onboarding/OnboardingFlow.tsx:186` ·  net-new · confirmed
    - rule: Design contract 'selected/active': calm GRAY fill applies to every pill/chip/option, not just single-select chips
    - problem: The GRID (categories, line 186) and CARDS (interests, line 203) multi-select steps mark selection only with `border-s-ink shadow-[inset_0_0_0_1px_var(--s-ink,#0A0A0A)]` over a white background, verified verbatim , no gray fill, unlike the locked TabPill treatment.
    - fix: Add bg-s-bg-sunken to the selected branch of both the grid-card and interest-card buttons.

**Consistency / drift**

- **MEDIUM** `[code]` `components-legacy/auth/TosPrompt.tsx:82` ·  net-new · confirmed
    - rule: Hairline canonical: border-s-border (#E4E4E7) is the one divider token, border-s-ink/{opacity} is drift
    - problem: Dividers use raw ink-opacity borders instead of the token, verified verbatim: `border-b border-s-ink/5` (82), `border border-s-ink/10` (94, 98), `border-t border-s-ink/5` (105).
    - fix: Replace all four with border-s-border.
- **MEDIUM** `[code]` `app/[locale]/staff-invite/page.tsx:91` ·  net-new · confirmed
    - rule: Semantic icon-container background should use the named token (bg-s-success-bg for a success/confirmation icon), not a raw ink-opacity fill
    - problem: Success-state icon circle is `bg-s-ink/10` with a `text-s-success` check inside, verified verbatim. The correct token bg-s-success-bg is verified used correctly for the same kind of moment at app/[locale]/onboarding/salon/page.tsx:594.
    - fix: Swap bg-s-ink/10 to bg-s-success-bg on line 91.
- **MEDIUM** `[code]` `app/[locale]/onboarding/salon/page.tsx:594` ·  net-new · confirmed
    - rule: Radius canonical: card/block = rounded-card (16); arbitrary rounded-[12px]/[14px]/[22px] is drift, 18/22 explicitly named to kill
    - problem: Celebration icon box uses `rounded-[22px]`, verified verbatim. Same arbitrary-radius pattern verified present at salon/page.tsx lines 285, 329, 557, 561 (rounded-[12px]); components-legacy/auth/TosPrompt.tsx line 80 (rounded-[12px]); app/[locale]/staff-invite/page.tsx line 87 (rounded-[12px]); app/[locale]/auth/register/page.tsx lines 29, 30, 42, 43 (rounded-[12px]/rounded-[10px]).
    - fix: Replace the arbitrary radii with rounded-card (16) across all listed files.
- **MEDIUM** `[code]` `app/[locale]/onboarding/salon/page.tsx:638` ·  net-new · confirmed
    - rule: The same brand lockup element must render identically everywhere it appears
    - problem: The solen.ch logotype dot is blue here: `solen<span className="text-s-accent">.</span>ch`, verified verbatim. The identical lockup renders with an ink dot in app/[locale]/auth/reset-password/page.tsx:108: `solen<span className="text-s-ink">.</span>ch`, also verified.
    - fix: Make salon/page.tsx:638 match reset-password.tsx:108 (ink dot).

**States + accessibility**

- **HIGH** `[mockup]` `app/[locale]/staff-invite/page.tsx:101` ·  net-new · confirmed
    - rule: Empty/error states must offer a computed, tappable recovery action, never a dead end
    - problem: The error branch (lines 101-107) renders only an icon and a message string with zero link or button, verified verbatim , not to the dashboard, not to login, not to a request-new-invite path.
    - fix: Add a tappable recovery action in the error branch: link to login for the auth-required redirect case, otherwise link home or to a contact-salon path.
- **HIGH** `[code]` `components-legacy/auth/TosPrompt.tsx:62` ·  net-new · confirmed
    - rule: Error handling: never silently swallow a failure the user is blocked on; a modal with no dismiss cannot fail silently
    - problem: handleAccept (lines 54-69) only does `if (res.ok) setShow(false)`, verified verbatim , on a non-OK response nothing happens: no toast, no inline error. The modal has no close/X and blocks the whole app (fixed inset-0 z-[100], line 74), so a real accept-TOS failure leaves the user stuck with zero explanation.
    - fix: On !res.ok, surface toast.error(...) with a retry-able message.
- **MEDIUM** `[code]` `app/[locale]/auth/reset-password/page.tsx:158` ·  net-new · confirmed
    - rule: Touch target floor: interactive controls at least 44px (h-11)
    - problem: The password show/hide toggle button (lines 158-165) has no size classes at all, verified verbatim , tap target is just the 16px icon with zero padding. Line 161 has a dead hover state, verified verbatim: `text-s-ink-2 hover:text-s-ink-2` (identical resting and hover colour). The identical unsized icon-only toggle also verified in components-legacy/auth/SignIn.tsx lines 220-227 (18px icon, no size classes).
    - fix: Wrap both eye-toggle buttons in a h-11 w-11 tappable area, and fix the dead hover class in reset-password.tsx to hover:text-s-ink.

**Copy economy + i18n**

- **HIGH** `[code]` `app/[locale]/auth/login/page.tsx:13` ·  net-new · confirmed
    - rule: Project is de/en/fr/it; a core auth screen rendering only one hardcoded language is broken for 3 of 4 supported locales
    - problem: The whole login page is hardcoded German with zero useTranslations/getTranslations calls in the 35-line file: "Willkommen zurück" (line 13), "Melde dich an, um Termine zu buchen und zu verwalten." (line 16), "Noch kein Konto?" (line 26), "Registrieren" (line 29), verified verbatim. `locale` is used only to build the /register href, never to select copy.
    - fix: Move this copy into next-intl message files (an authLogin namespace) and render via getTranslations, matching the correct i18n pattern already used in app/[locale]/auth/register/page.tsx.
- **HIGH** `[code]` `app/[locale]/auth/reset-password/page.tsx:121` ·  net-new · confirmed
    - rule: Project is de/en/fr/it; account-recovery is a critical flow that must not silently fall back to one language
    - problem: Password-reset page is almost entirely hardcoded German, verified verbatim: "Neues Passwort" (121), "Konto-Wiederherstellung" (119), "Passwort geändert" (83), "Link ungültig oder abgelaufen" (132), "Passwörter stimmen nicht überein" (188), requirement labels (171-173), CTA labels (138, 197). Only one error toast (line 65) routes through tc().
    - fix: Move all literal strings into next-intl messages under an authReset namespace and replace with t() calls, mirroring register/page.tsx.
- **HIGH** `[code]` `app/[locale]/onboarding/OnboardingFlow.tsx:37` ·  net-new · confirmed
    - rule: Project is de/en/fr/it; personalization-quiz copy that determines the whole home feed cannot be German-only, and the code's own claim that this gap is tracked is false
    - problem: STEPS (lines 36-59) and the done-screen copy are entirely hardcoded German with no useTranslations import in the file, verified verbatim (e.g. "Wie identifizierst du dich?" at line 37). beautyFields.tsx's own comment (lines 6-8) claims 'Option-label i18n is a follow-up , tracked in QUESTIONS.md'; grepping _design-system/QUESTIONS.md for onboarding/beautyFields/option-label returns zero hits , the tracking claim is verified false.
    - fix: Wire OnboardingFlow's question/sub/button copy and beautyFields' option labels into next-intl messages (an onboarding namespace), and either add the real QUESTIONS.md entry or close this out directly.
- **HIGH** `[code]` `app/[locale]/staff-invite/page.tsx:58` ·  net-new · confirmed
    - rule: Project is de/en/fr/it; app's own i18n system (next-intl) exists and is used everywhere else, this file bypasses it
    - problem: Team-invite acceptance uses a hand-rolled labels dict covering only de and en (lines 58-79), then `labels[locale as "de"|"en"] ?? labels.de` (line 80), verified verbatim. A French or Italian staff member accepting an invite gets German copy; the component bypasses next-intl.
    - fix: Replace the labels object with real next-intl messages (a staffInvite namespace covering de/en/fr/it) and useTranslations("staffInvite").
- **MEDIUM** `[mockup]` `app/[locale]/onboarding/salon/page.tsx:83` ·  net-new · confirmed
    - rule: Copy economy rule 5: no tracked-uppercase labels/eyebrows, use normal-case 13px semibold; CTA text floor is 15px, never below 14 on a button
    - problem: Field labels use `text-[12px] font-heading uppercase tracking-[.14em] text-s-ink/40`, verified verbatim at line 83 and repeated at 94, 106, 129, 145, 229, 257, 271. Category pills (line 114) and, more seriously, the wizard's nav buttons (line 712: `text-xs font-heading uppercase tracking-[.06em]`, line 719: `text-xs font-heading uppercase tracking-[.04em]`) render the actual step-advance CTAs at 12px uppercase, under the locked 14px CTA floor.
    - fix: Replace tracked-uppercase labels with normal-case 13px semibold across the file, and bump the nav buttons to at least 14px (target 15px) non-tracked text.
- **MEDIUM** `[code]` `app/[locale]/onboarding/salon/page.tsx:129` ·  net-new · confirmed
    - rule: No hardcoded English/German copy left in a form field alongside translated siblings; don't ship a self-admitted TODO
    - problem: City field label is a literal code comment plus hardcoded text: `{/* will add translations later if needed */} Stadt`, verified verbatim at line 129, with a hardcoded 3-city option list (Zürich/Basel/Bern, lines 135-138) while every sibling field on the same step correctly uses t("step1.X").
    - fix: Add step1.city/step1.cityPlaceholder translation keys and route the label through t(); flag the 3-city cap to the owner as a separate product decision if intentional.


### Search / results / map / filters  `search`

*13 files read · 7 findings (6 high) · 1 mockup-class · prior psych coverage: search*

**Psychology laws**

- **HIGH** `[code]` `app/[locale]/_components/search/SalonResultCard.tsx:511` ·  net-new · confirmed
    - rule: PSYCH law 6 (stars never bare - every star must show its count, e.g. "4.8 (54)")
    - problem: The 'suggest' variant (line 284: `{rating != null && <RatingStars value={rating} size="sm" />}`) and both branches of the 'feed' variant (line 511 searched-state, line 554 browse-state) render RatingStars with no `count` prop, producing a bare rating with zero review count, even though reviewCount is destructured at line 191 and correctly threaded into the grid/list/card variants of the SAME component (line 324, 390, 622: `count={reviewCount ?? undefined}`). The 'feed' variant is the default mobile results-list rendering path, so this ships to every mobile visitor.
    - fix: Pass `count={reviewCount ?? undefined}` into the three RatingStars calls at lines 284, 511, and 554, matching the pattern already correct at lines 324/390/622 in the same file.
- **HIGH** `[code]` `app/[locale]/_components/search/MapSalonDetail.tsx:158` ·  net-new · confirmed
    - rule: PSYCH law 6 (stars never bare)
    - problem: `<RatingStars value={salon.average_rating} size="md" />` (gated by `salon.average_rating != null` at line 156) renders with no count prop, even though `salon.review_count` is available and already used two lines earlier (lines 101-105) to build the 'category, N reviews' meta line. This is the header rating in the mobile map's salon-detail sheet.
    - fix: Pass `count={salon.review_count ?? undefined}` into the RatingStars call at line 158.
- **HIGH** `[code]` `app/[locale]/_components/search/CategoryHeroCarousel.tsx:149` ·  net-new · confirmed
    - rule: PSYCH law 6 (stars never bare)
    - problem: The rating block (`s.average_rating != null && (<div>...<RatingStars value={s.average_rating} size="md" />{s.review_count ? `(${s.review_count})` : ""}</div>)`, lines 149-154) gates on average_rating alone; review_count is separately and independently guarded, rendering an empty string when absent/0 rather than omitting the whole rating block or passing a real count. A top-rated salon with no review_count renders a bare star. This is the featured 'Top bewertet' carousel above the results grid on every category browse page.
    - fix: Either require s.review_count != null && s.review_count > 0 alongside s.average_rating != null before rendering the star block at all, or pass count={s.review_count ?? undefined} into RatingStars (it already supports a count prop rendering '(N)' correctly, confirmed in RatingStars.tsx line 197) instead of the manual string-concat sibling.

**Design contract**

- **HIGH** `[mockup]` `app/[locale]/_components/search/SearchOverlay.tsx:769` ·  net-new · confirmed
    - rule: LOCKFILE design-contract row "date / time": ONE DateTimePicker primitive (dateLayout strip for booking, calendar for search); booking + search SHARE it; NO bespoke date UI (V3-D445)
    - problem: The overlay's date step (lines ~769-848) is fully hand-rolled: its own MonthGrid function (lines 932-966), its own flex-date chip grid (lines 834-844), and its own period chip row (lines 811-830). Grepping the search bucket for DateTimePicker returns zero hits, confirmed by direct grep. By contrast, app/[locale]/_components/homepage/SearchBar.tsx correctly imports and uses the shared DateTimePicker primitive (which does expose exactly the calendar/strip dateLayout modes the contract describes, confirmed in DateTimePicker.tsx lines 114-119). This duplicates calendar math, state, and selected-state styling independently of the locked primitive.
    - fix: Replace the hand-rolled date step (MonthGrid + flex-date chips + period chips) with the shared DateTimePicker primitive in calendar mode, the same integration SearchBar.tsx already uses. Needs a mockup-first pass (before/after of the real overlay) before landing since it is a visible structural change.

**Consistency / drift**

- **HIGH** `[code]` `app/[locale]/_components/search/SearchResults.tsx:1` ·  net-new · confirmed
    - rule: exists-check / graveyard anti-duplication protocol (CLAUDE.md): dead/orphaned surface left live in the route tree
    - problem: This 405-line component is dead code: /search is served by SearchTemplate (per app/[locale]/search/page.tsx, confirmed by reading the file), and grepping the whole repo for any import of this file or a bare `SearchResults` symbol returns zero hits outside this file itself (the only other `SearchResults` hits are an unrelated `useSearchSuggest.ts` type of the same name and stale comments in API route files). The file's own header comment describes obsolete V3 branding ('emerald action color, terracotta heartbeat, cream substrate', lines 28-30) and its render body (confirmed by reading lines 203-220) contains a decorative accent dot plus an ALL-CAPS tracked eyebrow ('SUCHERGEBNISSE', lines 208-211) and a `font-black` heading, none of which match the current locked design contract.
    - fix: Confirm with the owner this route is dead (it appears unambiguously so), then delete the file and add a _design-system/REMOVED.md line per the exists-check/graveyard protocol.
- **LOW** `[code]` `app/[locale]/_components/search/FilterSheet.tsx:276` ·  net-new · confirmed
    - rule: dead/unused prop wiring - simplification (don't thread data nothing reads)
    - problem: FilterSheetLabels declares rating45 and rating40 (lines 276-277, with the interface's own comment at line 275 calling them 'legacy'), and SearchTemplate.tsx resolves and passes both (rating45: tFilter("rating45"), rating40: tFilter("rating40"), lines 2084-2085 confirmed), but the actual rating UI is the RatingBar component (lines 513-517) which only reads labels.ratingAny and labels.ratingAndUp. Grepping the file confirms rating45/rating40 have zero read sites outside the interface declaration and its own comment.
    - fix: Delete the rating45/rating40 fields from FilterSheetLabels and the two corresponding tFilter() calls in SearchTemplate.tsx's labels object.

**States + accessibility**

- **HIGH** `[code]` `app/[locale]/_components/search/FilterSheet.tsx:369` ·  net-new · confirmed
    - rule: LOCKFILE design contract: touch target floor - interactive controls >= 44px (h-11)
    - problem: SheetChip (used for every gender chip, amenity chip, and the deals chip in the filter sheet, confirmed at lines 493-548) is built with `"inline-flex min-h-[36px] items-center gap-1.5 rounded-pill px-3.5"` (line 369) and no vertical padding, so its rendered height sits at ~36px, 8px under the 44px floor. The Sortieren segmented buttons in the same file (lines 442-467) use `"...px-2 py-2..."` with `"font-body text-[12.5px] leading-none"` (lines 448-449), computing to roughly 28px tall, well under the floor. Both are on the full-screen filter sheet every search/category-page visitor opens.
    - fix: Bump SheetChip's min-h-[36px] to min-h-11 (44px), and give the Sortieren segmented buttons a min-h-11 wrapper so the visible pill can stay slim while the tap target reaches 44px.


### Salon PDP + reviews + team  `pdp`

*38 files read · 17 findings (6 high) · 6 mockup-class · prior psych coverage: pdp + reviews*

**Fabricated data (no-fabrication law)**

- **HIGH** `[code]` `app/[locale]/salon/[slug]/barber/[barberSlug]/page.tsx:165` ·  net-new · confirmed
    - rule: Solen law 9 / silent no-op: only render values wired to a live source
    - problem: `{barber.cut_count}` is rendered at line 165, but GET /api/barber/[slug] (app/api/barber/[slug]/route.ts:50) returns the field as `totalCuts`, not `cut_count`. Verified: the API response object has no `cut_count` key at all. barber.cut_count is therefore always undefined, rendering 'undefined Schnitte' on every barber profile visit.
    - fix: Read data.barber.totalCuts on the client and update the BarberProfile interface, or rename the API field to cut_count.

**Psychology laws**

- **LOW** `[mockup]` `app/[locale]/_components/primitives/Avatar.tsx:85` ·  net-new · confirmed
    - rule: law 6: stars never bare, every star shows its count
    - problem: Verified: Avatar's rating badge at lines 84-88 renders `<Star size={9} .../>{badge.rating.toFixed(1)}` with no count. Consumed directly on the PDP team carousel at SalonTeam.tsx:181-186 (`badge={showRating ? { rating: displayRating } : undefined}`), so every stylist avatar on the PDP shows a bare rating with no review count.
    - fix: Add an optional count to the Avatar badge prop and render it in parentheses when available, or drop the badge when a count isn't known.

**Design contract**

- **HIGH** `[code]` `app/[locale]/salon/[slug]/barber/[barberSlug]/page.tsx:189` ·  net-new · confirmed
    - rule: design-contract selected-state: never ink fill, always gray-sunken (TabPill locked pattern)
    - problem: Hand-rolled portfolio style filter buttons use `bg-s-ink text-white` for the active state (lines 189-206), contradicting the code's own comment claiming TabPill parity. The real TabPill primitive (app/[locale]/_components/primitives/TabPill.tsx:66-68) locks active = bg-s-bg-sunken text-s-ink, never ink.
    - fix: Replace the two hand-rolled <button> filter chips with the shared <TabPill> primitive so selected = gray-sunken + ink text.
- **HIGH** `[code]` `components-legacy/staff/StaffProfilePage.tsx:287` ·  net-new · confirmed
    - rule: design-contract selected-state: gray-sunken fill only, never ink
    - problem: The sticky tab bar (About/Leistungen/Portfolio/Bewertungen) hand-rolls `on ? "bg-s-ink text-white" : "border border-s-border text-s-ink hover:border-s-ink/25"`, an ink-fill selected state on a tab control, verified verbatim at line 287.
    - fix: Swap the active branch to bg-s-bg-sunken text-s-ink font-semibold, matching TabPill's compoundVariants.
- **HIGH** `[code]` `components-legacy/salon/SalonReviews.tsx:194` ·  net-new · confirmed
    - rule: filter/menu selected state: neutral gray, never blue
    - problem: The rating-filter checkbox on the standalone /salon/[slug]/reviews page uses `on ? "border-s-accent bg-s-accent text-white" : "border-s-border bg-white"` (verified exact string at line 194); the sort-sheet radio at lines 440-441 repeats the same blue-fill selected pattern (`border-s-accent` ring + `bg-s-accent` dot).
    - fix: Change both selected states from blue accent to the locked neutral pattern (gray-sunken chip fill + ink check, or ink-filled radio dot on a neutral ring).
- **HIGH** `[code]` `app/[locale]/_components/salon/SalonImageGallery.tsx:208` ·  net-new · confirmed
    - rule: design-contract selected-state: never ink fill on a selected pill/segment
    - problem: The full-screen gallery's Salon/Team Pill component uses `active ? "bg-s-ink text-white" : "border border-s-border bg-white text-s-ink hover:bg-s-bg-sunken"`, verified exact at line 208, a fourth hand-rolled ink-fill selected pill on the PDP that doesn't reuse TabPill.
    - fix: Replace the local Pill component with <TabPill>, or at minimum change the active branch to bg-s-bg-sunken text-s-ink.
- **MEDIUM** `[code]` `app/[locale]/_components/salon/SalonServices.tsx:139` ·  net-new · confirmed
    - rule: radius: card/block = rounded-card (16); no arbitrary rounded-[Npx]
    - problem: Verified `rounded-[24px]` at line 139 (and 147), an off-token radius. Also confirmed the identical literal at SalonBundles.tsx:138, SalonProducts.tsx:102 and :182, and SalonServicesSheet.tsx:255 (grep-verified across all four files).
    - fix: Drop to the locked rounded-card (16px) token, or promote 24px to a named grouped-card token if intentionally distinct.
- **LOW** `[code]` `app/[locale]/_components/salon/SalonServices.tsx:215` ·  net-new · confirmed
    - rule: cta text floor: never below 14px on a button
    - problem: Verified exact: `text-[13px] font-semibold ... md:text-[14px]` on the per-service 'Buchen' link at line 215, meaning the mobile CTA text sits at 13px, under the 14px floor.
    - fix: Change the mobile class to text-[14px], keeping the existing md variant.

**Consistency / drift**

- **HIGH** `[code]` `lib/salon-detail.ts:152` ·  net-new · confirmed
    - rule: silent no-op: a control/section that looks wired but does nothing
    - problem: Verified: loadSalonDetail() selects parent_salon_id (line 65) but the returned object at lines 152-157 (`{...publicSalon, services, staff, reviews}`) never includes a siblings key, and no sibling-salon fetch exists anywhere in this file or in the route/page that call it (grep confirms zero other siblings/parent_salon_id references). salon.siblings is always undefined, so SalonOtherLocations (gated on `salon.siblings && salon.siblings.length > 0` in SalonDetailV3.tsx:325) can never render.
    - fix: When salon.parent_salon_id is set, fetch sibling salons and attach them as `siblings` on the returned object.
- **MEDIUM** `[code]` `app/[locale]/_components/salon/SalonReviews.tsx:98` ·  net-new · confirmed
    - rule: ground in the system: use RatingStars primitive, don't hand-roll star loops
    - problem: Verified: the reviews summary hand-rolls a 5-star loop at lines 98-105 (size 28) using raw <Star>, while ReviewCard in the same file uses <RatingStars mode="five" size="md"> at line 195. Identical hand-rolled duplication confirmed at StaffProfilePage.tsx:407-409 (size 18) and SalonServicesSheet.tsx:413-424 (size 12).
    - fix: Replace all three hand-rolled star loops with <RatingStars mode="five">, adding a size token for the 28px summary treatment if needed.
- **MEDIUM** `[mockup]` `app/[locale]/_components/salon/SalonTeam.tsx:119` ·  net-new · confirmed
    - rule: no duplicate hand-rolled component patterns for the same affordance
    - problem: Verified: SalonTeam.tsx:119-124 'Alle ansehen' is a bare ink text Link with no button chrome; SalonServices.tsx:161-167 is a bg-s-bg-sunken gray-fill pill; SalonReviews.tsx (app):144-159 is a border-s-ink ink-outline pill that inverts on hover; StaffProfilePage.tsx:437-443 is a full-width bordered pill. Four distinct visual treatments for the same 'see all' action on one PDP surface, confirmed.
    - fix: Extract one shared SeeAllButton/SecondaryPill primitive and use it at every call site.
- **MEDIUM** `[mockup]` `components-legacy/salon/SalonReviews.tsx:1` ·  net-new · confirmed
    - rule: one component per surface, not divergent duplicate implementations of the same content
    - problem: Verified two separate SalonReviews implementations exist: app/[locale]/_components/salon/SalonReviews.tsx (PDP inline, 56px avatars, no filter/sort) vs this file (standalone /salon/[slug]/reviews page, confirmed only import site via grep, has rating-filter checkboxes + sort sheet + flag, 56px accent-pale avatars, character-slice truncation). Structurally and visually different UIs for the same underlying reviews data.
    - fix: Unify shared primitives (avatar treatment, empty-state, truncation copy, anonymous fallback) across both surfaces; route through design review before consolidating structure.

**States + accessibility**

- **MEDIUM** `[code]` `app/[locale]/salon/[slug]/barber/[barberSlug]/page.tsx:118` ·  net-new · confirmed
    - rule: icon-button = h-11 w-11 (44px a11y floor)
    - problem: Verified: back button (line 118-123, p-2 rounded-full wrapping an 18px icon, ~34px total) and share button (124-129, identical pattern) are under the 44px floor. Also verified identical h-9 w-9 (36px) undersizing at SalonStickyTabNav.tsx:183 and :194, StaffProfilePage.tsx:216, :220, :239, and SalonImageGallery.tsx:100.
    - fix: Bump each icon button to h-11 w-11 (or wrap the smaller glyph in an h-11 w-11 hit area).
- **MEDIUM** `[mockup]` `components-legacy/staff/StaffProfilePage.tsx:167` ·  net-new · confirmed
    - rule: loading = <Skeleton> shape-matching the final layout, not a bare spinner
    - problem: Verified exact: `if (loading) return (<div className="grid min-h-[60vh] place-items-center bg-white"><Spinner /></div>)` at lines 165-171. The barber profile page has the identical bare-spinner pattern at barber/[barberSlug]/page.tsx:73-78.
    - fix: Replace both bare spinners with a <Skeleton> shaped like the final layout.

**Copy economy + i18n**

- **MEDIUM** `[code]` `components-legacy/staff/StaffProfilePage.tsx:420` ·  net-new · confirmed
    - rule: consistent copy for the same semantic state across a surface
    - problem: Verified: `r.profiles?.display_name ?? "Solen-Kund:in"` at line 420, while both SalonReviews components on the PDP surface use "Anonym" for the identical anonymous-reviewer case (app/[locale]/_components/salon/SalonReviews.tsx:183/186 and components-legacy/salon/SalonReviews.tsx:261, both verified exact).
    - fix: Standardize on "Anonym" in all three places.
- **MEDIUM** `[mockup]` `app/[locale]/_components/salon/SalonAbout.tsx:35` ·  net-new · confirmed
    - rule: long text truncates with an inline 'Mehr lesen' expand, never a full wall of text
    - problem: Verified: `<p className="whitespace-pre-line">{text}</p>` at line 36 with no line-clamp or expand affordance, unlike the review comments elsewhere on the PDP which truncate with an inline 'Mehr lesen'.
    - fix: Add the same line-clamp-3 + inline text-s-accent 'Mehr lesen' expand-in-place pattern used for review comments.

**Icons**

- **MEDIUM** `[mockup]` `app/[locale]/salon/[slug]/barber/[barberSlug]/page.tsx:169` ·  net-new · confirmed
    - rule: star glyph reserved for rating signal only
    - problem: Verified: the specialties row renders `<Star size={14} className="fill-s-star text-s-star" />` at line 169, reusing the filled-yellow rating glyph for an unrelated meaning (specialty list). SalonAdditionalInfo.tsx:60 confirmed to reuse a Star icon for the 'Frauengeführt' amenity too.
    - fix: Swap the barber-page specialties icon for Scissors (already imported/used on the page); swap SalonAdditionalInfo's amenity icon for a distinct glyph (e.g. UserCheck).


### Category landings / brand / nail-tech / behandlungen  `category-landings`

*13 files read · 13 findings (6 high) · 3 mockup-class · prior psych coverage: none (new coverage)*

**Fabricated data (no-fabrication law)**

- **HIGH** `[code]` `app/[locale]/behandlungen/[...slug]/TreatmentsClient.tsx:37` ·  net-new · confirmed
    - rule: no dead/orphaned code shipped in the route tree (exists-check/graveyard protocol)
    - problem: Verified: grep -rn TreatmentsClient app finds only its own export at line 37, no importer anywhere. It has drifted from the live page.tsx: H1 is uppercase text-4xl sm:text-5xl (line 171) vs live page's text-2xl capitalize (page.tsx:170), and adds an ambient-v5 background class (line 128, stale comment at line 16) the live page doesn't have.
    - fix: Delete the file and add a _design-system/REMOVED.md line per the graveyard protocol.

**Psychology laws**

- **HIGH** `[code]` `app/[locale]/nail-tech/[id]/page.tsx:118` ·  net-new · confirmed
    - rule: PSYCH law 6 (stars never bare, every star shows its count)
    - problem: Star row is gated on `tech.avg_rating != null` alone (line 118); the count is gated on an independent nested `tech.review_count != null` (line 122). When avg_rating exists but review_count is null, a bare '4.8' renders with no count.
    - fix: Gate the whole block on `tech.avg_rating != null && tech.review_count != null` so a star never renders without its count.
- **HIGH** `[mockup]` `app/[locale]/behandlungen/[...slug]/page.tsx:7` ·  net-new · confirmed
    - rule: PSYCH law 7 (photos are the decision input, photo stays largest card element)
    - problem: Both app/[locale]/behandlungen/[...slug]/page.tsx:7 and app/[locale]/brand/[slug]/page.tsx:7 import SalonCard from components-legacy/SalonCard, which carries the comment 'A3 LOCKED 2026-05-03: photos killed pre-launch, solid category color + Anton name only' (verified at components-legacy/SalonCard.tsx:105,152). Verified the photo-first replacement app/[locale]/_components/homepage/SalonCard.tsx is real and actively imported elsewhere (CategoryBrowseRails.tsx, SearchResults.tsx), and the existing audit already prescribes the identical fix for FavoritesList.tsx (AUDIT_CHANGELIST_2026-07-07.md), confirming this is the same unresolved pattern at two additional call sites.
    - fix: Swap the import in both files to the photo-first app/[locale]/_components/homepage/SalonCard, matching the FavoritesList precedent fix.

**Design contract**

- **HIGH** `[code]` `app/[locale]/nail-tech/[id]/page.tsx:68` ·  net-new · confirmed
    - rule: no retired-but-defined token usage; taste rule 3 (blue is sparse, small clickable bits only, never a decorative status fill)
    - problem: TIER_COLORS (lines 68-73) uses s-sand/s-blue/s-plum, verified as retired aliases in tailwind.config.js (lines 83-85: s-blue aliases to s-accent DEFAULT #276EF1, s-plum to s-ink-2, s-sand to s-bg.sunken). Verified text-s-sand-text is not defined anywhere in tailwind.config.js, so the junior-tier badge text color silently falls back to inherited color. The senior tier renders bg-s-blue/20 text-s-blue as a decorative non-clickable status badge (line 105 usage), contradicting the blue-is-sparse/clickable-only rule.
    - fix: Replace TIER_COLORS with neutral tokens (bg-s-bg-sunken text-s-ink-2) per the category-tag rule; delete the non-existent text-s-sand-text class.
- **MEDIUM** `[code]` `app/[locale]/coiffeur/loading.tsx:7` ·  net-new · confirmed
    - rule: consistency canonical: card/block radius = 16 (rounded-card), arbitrary rounded-[12px]/rounded={12} is drift
    - problem: Verified rounded={12} at coiffeur/loading.tsx:7, app/[locale]/loading.tsx:7 and :11, and rounded-[12px] at app/[locale]/brand/[slug]/page.tsx:69 and :73. None use the locked 16px token.
    - fix: Change all occurrences to rounded={16} / rounded-card.
- **LOW** `[code]` `app/[locale]/behandlungen/[...slug]/page.tsx:130` ·  net-new · confirmed
    - rule: consistency canonical: hairline = one border-s-border token, raw border-s-ink/{opacity} is drift
    - problem: Verified className="max-w-7xl mx-auto px-4 sm:px-6 py-3 bg-white border-b border-s-ink/[0.06]" at line 130 uses a raw opacity-modified ink border instead of the locked border-s-border token.
    - fix: Replace border-s-ink/[0.06] with border-s-border.

**Consistency / drift**

- **HIGH** `[code]` `app/[locale]/behandlungen/[...slug]/page.tsx:145` ·  net-new · confirmed
    - rule: design-contract nav row: sub-page nav is single, no stacked home+back (V3-D449)
    - problem: Page renders its own hand-rolled breadcrumb <nav> (lines 145-160). Verified in components-legacy/ui/Breadcrumb.tsx: the EXCLUDED prefix array (line 30) has no /behandlungen entry, and the CATEGORY_SLUGS last-segment check (line 51) only covers coiffeur/barbershop/nails/spa. The global <Breadcrumb /> is mounted unconditionally in app/[locale]/layout.tsx:110, so both breadcrumbs render stacked on every /behandlungen/* URL.
    - fix: Add "/behandlungen" to the EXCLUDED array in components-legacy/ui/Breadcrumb.tsx, or delete the page's own hand-rolled nav block.
- **MEDIUM** `[code]` `app/[locale]/nail-tech/[id]/page.tsx:119` ·  net-new · confirmed
    - rule: consistency canonical: star = the canonical RatingStars primitive, not a hand-rolled <Star> block
    - problem: Lines 119-125 hand-roll exactly the pattern the canonical primitive replaces. Verified app/[locale]/_components/primitives/RatingStars.tsx:11 doc comment states it 'Replaces ~14 hand-rolled <Star className="fill-s-star" /> {value} blocks', and the component's compact mode (props value/count/mode/size) matches this exact use case.
    - fix: Replace with <RatingStars value={tech.avg_rating} count={tech.review_count ?? undefined} mode="compact" size="sm" />.

**States + accessibility**

- **MEDIUM** `[mockup]` `app/[locale]/brand/[slug]/page.tsx:46` ·  net-new · confirmed
    - rule: design-contract states row: loading = <Skeleton> shape-matching the final layout, not a bare spinner
    - problem: if (loading) return (<div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>) at lines 46-51 is a full-screen bare spinner with zero layout structure. Same pattern verified at app/[locale]/nail-tech/[id]/page.tsx:49-55.
    - fix: Replace both bare Spinners with a Skeleton-composed layout matching the final render.
- **MEDIUM** `[mockup]` `app/[locale]/coiffeur/loading.tsx:7` ·  net-new · confirmed
    - rule: design-contract states row: Skeleton shape must match the FINAL layout
    - problem: coiffeur/loading.tsx renders a hero-banner Skeleton + 3-col grid, but the live coiffeur/page.tsx explicitly comments (verified verbatim at page.tsx lines 98-102) that 'the unified Airbnb-style search IS the default render... CategoryHero + the SEO above/below slots are dropped unconditionally.' Verified no loading.tsx exists for barbershop/spa/nails, so the shared app/[locale]/loading.tsx (also hero+category-tiles shape) is the de facto fallback for all three.
    - fix: Rebuild both loading.tsx files to match SearchTemplate's real shape (search-bar skeleton, filter-pill row, result-count line, card grid); drop hero-banner and category-tile blocks.
- **MEDIUM** `[code]` `app/[locale]/brand/[slug]/page.tsx:54` ·  net-new · confirmed
    - rule: design-contract states row: empty/error = the locked <EmptyState>/<ErrorState> component, don't hand-roll
    - problem: if (!group) return (<div className="min-h-screen flex items-center justify-center"><p className="text-s-ink-2">Marke nicht gefunden</p></div>) at lines 54-59 is a hand-rolled not-found state with no icon or recovery action. Verified components-legacy/ui/EmptyState.tsx exists with icon/title/message/action props that would fit. Same pattern verified at app/[locale]/nail-tech/[id]/page.tsx:57-65.
    - fix: Render the locked EmptyState component with icon, title, message, and a recovery action instead of the hand-rolled <p> blocks.
- **MEDIUM** `[code]` `app/[locale]/nail-tech/[id]/page.tsx:141` ·  net-new · confirmed
    - rule: design-contract touch target: interactive controls >= 44px (h-11)
    - problem: Verified py-2.5 (10px top+bottom) on text-sm (20px line-height) yields roughly 40px total height on the primary 'Bei {tech.name} buchen' commit CTA, under the 44px a11y floor.
    - fix: Bump vertical padding to reach 44px (e.g. py-3.5 or add min-h-11 flex items-center).

**Icons**

- **HIGH** `[code]` `app/[locale]/nail-tech/[id]/page.tsx:143` ·  net-new · confirmed
    - rule: icon rule: real Lucide icons only, no sparkles/star glyph, no zap/lightning
    - problem: Primary booking CTA renders <Sparkles size={16} /> (line 143) next to "Bei {tech.name} buchen"; Sparkles imported at line 8. Sparkles is an explicitly banned glyph.
    - fix: Remove the Sparkles icon from the CTA, or swap for a neutral non-banned icon (e.g. Calendar).


### Profile + account  `profile`

*22 files read · 15 findings (5 high) · 2 mockup-class · prior psych coverage: profile*

**Psychology laws**

- **HIGH** `[code]` `app/[locale]/profile/page.tsx:88` ·  net-new · confirmed
    - rule: PSYCH law 3 (never start at zero)
    - problem: stampCount (from the loyalty_stamps count query) and totalBookings are destructured from Promise.all at line 88 but grep confirms neither identifier is referenced anywhere else in the file; the Loyalty Row at line 205 (`<Row href={p("/rewards")} icon={Award} label={t("tileLoyalty")} />`) passes no meta, so a customer with real stamp progress sees the same bare row as a first-time visitor.
    - fix: Pass meta into the Loyalty Row (e.g. stamp progress text when stampCount > 0) so returning customers see real progress instead of a zero-state; use totalBookings meaningfully or drop the query.

**Design contract**

- **HIGH** `[code]` `app/[locale]/profile/haarprofil/HaarprofilForm.tsx:30` ·  net-new · confirmed
    - rule: design-contract selected-state (no-black-selected gate)
    - problem: Selected Haartyp/Länge/Dicke pill: `on ? "border-s-ink bg-s-ink text-white" : "border-s-border bg-white text-s-ink hover:border-s-ink/30"` fills solid ink with white text on selection, banned by the design contract's selected/active row.
    - fix: Swap the selected branch to bg-s-bg-sunken + text-s-ink + font-semibold over a white unselected state, no ink fill (the locked TabPill/gray-sunken treatment).
- **HIGH** `[code]` `app/[locale]/profile/settings/BeautyProfileForm.tsx:188` ·  net-new · confirmed
    - rule: design-contract selected-state (no-black-selected gate)
    - problem: ChipGroup selected branch: `on ? "bg-s-ink text-white" : "border border-s-border text-s-ink hover:bg-s-bg-sunken"` used for Gender/Hair/Skin single-select chips is ink-fill selection, banned by the design contract.
    - fix: Replace bg-s-ink text-white with bg-s-bg-sunken text-s-ink font-semibold for the selected chip.
- **HIGH** `[code]` `app/[locale]/profile/settings/SettingsForm.tsx:193` ·  net-new · confirmed
    - rule: design-contract selected-state (no-black-selected gate)
    - problem: Language picker: `form.locale === l.value ? "bg-s-ink text-white" : "border border-s-border text-s-ink hover:bg-s-bg-sunken"` is the same ink-fill selected state on the profile surface.
    - fix: Swap to bg-s-bg-sunken text-s-ink font-semibold for the selected locale button.
- **HIGH** `[code]` `components-legacy/booking/BookingsList.tsx:145` ·  net-new · confirmed
    - rule: design-contract selected-state / TabPill treatment (not reusing the locked primitive)
    - problem: Upcoming/Past/Cancelled tab bar is hand-rolled (lines 143-172): active tab gets `border-s-ink text-s-ink` ink underline + ink text instead of the shared TabPill primitive (app/[locale]/_components/primitives/TabPill.tsx, confirmed to exist and already used by SalonServices, SalonServicesSheet, FilterSheet, the barber page, and help/page.tsx).
    - fix: Replace the three hand-rolled <button> tabs with <TabPill active={tab==='upcoming'} onClick={...}>{t('upcoming')}</TabPill> (and same for past/cancelled).
- **MEDIUM** `[code]` `components-legacy/booking/BookingCard.tsx:152` ·  net-new · confirmed
    - rule: design-contract text size (CTA 15, never ≤13 on a button)
    - problem: `className="rounded-pill bg-s-ink px-4 py-2 text-[13px] font-semibold text-white..."` puts the Rebook CTA text at 13px on an ink-filled button, flagged explicitly by the consistency canonicals.
    - fix: Bump to text-[15px] (or 14px minimum) and adjust padding to keep the pill proportioned.
- **MEDIUM** `[mockup]` `app/[locale]/profile/settings/BeautyProfileForm.tsx:108` ·  net-new · confirmed
    - rule: design-contract selected-state (no-black-selected gate)
    - problem: Category cards' selected state at line 108 (`on ? "border-s-ink shadow-[inset_0_0_0_1px_var(--s-ink,#0A0A0A)]" : "border-s-border hover:bg-s-bg-sunken"`) and the interest-card trailing check circle at line 147 (`on ? "bg-s-ink border border-s-ink text-white" : "border-[1.5px] border-s-border"`) both key selection off ink border/ink-fill instead of the locked calm-gray-fill treatment; the card body stays white regardless of selection.
    - fix: Give selected cards a bg-s-bg-sunken fill in place of the ink border + inset shadow; keep the check badge but confirm with the owner whether the ink circle rides the SelectedCheckBadge exception.

**Consistency / drift**

- **LOW** `[code]` `app/[locale]/profile/settings/SettingsForm.tsx:182` ·  net-new · confirmed
    - rule: consistency canonical (radius token, kill phantom rounded-[12px])
    - problem: The bio <textarea> (line 182) and ActionButton (line 291) both use an arbitrary rounded-[12px], while sibling containers in the same file (Section at line 274, the danger-zone card) use the rounded-card token (16px) for the same form-container role.
    - fix: Standardize both on rounded-card (16, also the locked 'input 16' value), removing the arbitrary rounded-[12px] literal.

**States + accessibility**

- **MEDIUM** `[mockup]` `app/[locale]/profile/intake-forms/page.tsx:59` ·  net-new · confirmed
    - rule: design-contract states (loading = Skeleton shape-matching, not a bare spinner)
    - problem: `if (loading) { return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>; }` renders a bare full-screen spinner for the whole module's first load instead of a layout-matching Skeleton.
    - fix: Render 2-3 skeleton rows shaped like the template-grouped form cards while loading is true.

**Copy economy + i18n**

- **MEDIUM** `[code]` `app/[locale]/profile/haarprofil/HaarprofilForm.tsx:19` ·  net-new · confirmed
    - rule: copy rule 5 (no tracked-uppercase / all-caps eyebrows)
    - problem: `<p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-s-ink-3">{label}</p>` is a tracked all-caps eyebrow above each pill row, directly banned by copy rule 5.
    - fix: Drop uppercase tracking-[0.08em]; use normal-case ~13px semibold, matching the FieldLabel primitive used in BeautyProfileForm for the identical role.
- **MEDIUM** `[code]` `app/[locale]/profile/intake-forms/page.tsx:82` ·  net-new · confirmed
    - rule: copy rule 5 (no tracked-uppercase / all-caps eyebrows)
    - problem: `<h2 className="text-sm font-bold text-s-ink mb-3 uppercase tracking-wide">{TEMPLATE_NAMES[templateKey]...}</h2>` is another tracked all-caps eyebrow, for the template-group header.
    - fix: Remove uppercase tracking-wide; render the template name normal-case semibold.
- **MEDIUM** `[code]` `app/[locale]/profile/stamps/page.tsx:145` ·  net-new · confirmed
    - rule: copy rule 5 (no tracked-uppercase / all-caps eyebrows)
    - problem: `<h2 className="font-body text-[12px] font-bold uppercase tracking-[.22em] text-s-ink/40 mb-3">Aktiv</h2>` and the identical pattern at line 168 for 'Eingelöst {redeemed.length}' are tracked all-caps section eyebrows.
    - fix: Drop uppercase tracking-[.22em] on both headers; normal-case 13px semibold.
- **LOW** `[code]` `app/[locale]/_components/profile/EmptyStateDiscovery.tsx:134` ·  net-new · confirmed
    - rule: taste rule 2 (no decorative separator dots when colour already differentiates)
    - problem: `{s.review_count != null && s.review_count > 0 && (<span className="tabular-nums text-s-accent">({s.review_count})</span>)}{s.quartier && <span>· {capitalize(s.quartier)}</span>}` inserts a middot before the quartier text, but the review count (blue accent, parenthesized) and the quartier (default grey) already differ by colour, which per taste rule 2 IS the separator.
    - fix: Drop the leading '· ' and let the flex gap + colour contrast do the separating work.

**Icons**

- **MEDIUM** `[code]` `app/[locale]/profile/page.tsx:213` ·  net-new · confirmed
    - rule: icon rule (no sparkles/star glyph)
    - problem: `<Row href={p("/profile/looks")} icon={Sparkles} label={t("looks")} />` uses the banned Sparkles glyph (imported at line 24) for the Looks tile.
    - fix: Swap Sparkles for a non-banned Lucide icon, e.g. Image or Bookmark.
- **MEDIUM** `[code]` `app/[locale]/profile/intake-forms/page.tsx:118` ·  net-new · confirmed
    - rule: icon rule (no sparkles/star glyph)
    - problem: `<Sparkles size={12} /> AI Analyse` badge on the expanded intake-form AI recommendation block uses the same banned glyph.
    - fix: Swap to a non-banned Lucide icon (e.g. Wand2 or Bot) or drop the icon and keep the text label.


### Walk-in + queue  `walkin-queue`

*4 files read · 15 findings (5 high) · 2 mockup-class · prior psych coverage: walkin*

**Psychology laws**

- **HIGH** `[code]` `app/[locale]/walk-in-pay/page.tsx:432` ·  net-new · confirmed
    - rule: PSYCHOLOGY law 6 — stars never bare, every star shows its count
    - problem: The rating gate (salon_rating>0) and the review-count gate (salon_review_count!=null) are separate/nested conditions; whenever review_count is null while rating>0, the star+number renders with no count. Same pattern repeats for the barber block (478-490).
    - fix: Merge into one gate: only render the star block when both rating>0 AND review_count!=null, for both the salon block (432-444) and barber block (478-490).

**Design contract**

- **MEDIUM** `[code]` `app/[locale]/queue/[token]/page.tsx:242` ·  net-new · confirmed
    - rule: Design contract radius: card/block=16 (rounded-card), sheet=28; arbitrary rounded-[18px]/[20px]/[22px] is drift
    - problem: Multiple arbitrary radii found exactly as cited: rounded-[22px] on the tip card (242) and low-rating feedback card (261), rounded-t-[20px] on the content panel (383), rounded-[18px] on the Inspo card (457), rounded-[20px] on the barber/service card (475) and location row (512).
    - fix: Swap each to the locked token: rounded-card (16px) for the tip/feedback/barber/location cards, rounded-sheet (28px) for the bottom content panel.
- **MEDIUM** `[code]` `app/[locale]/queue/[token]/page.tsx:242` ·  net-new · confirmed
    - rule: Design contract shadow: card=shadow-elevation-2/-3, calm control=flat; arbitrary shadow-[...] where an elevation token exists is drift
    - problem: shadow-[0_8px_26px_-16px_rgba(10,10,10,.16)] is repeated on the tip card (242), feedback card (261), Inspo card (457), barber/service card (475), location row (512); shadow-[0_2px_8px_rgba(10,10,10,.12)] on the back/help buttons (353, 362), all confirmed present verbatim.
    - fix: Replace the repeated arbitrary shadow-[...] literals with shadow-elevation-2 for the cards.
- **MEDIUM** `[code]` `app/[locale]/queue/[token]/page.tsx:266` ·  net-new · confirmed
    - rule: LOCKFILE focus law (V3-D449): inputs get ONE ink border + halo from the global :focus-visible rule; primitives add no extra ring
    - problem: The feedback textarea adds a local focus:outline-none focus:ring-2 focus:ring-s-accent/30, duplicating the global focus system with a blue ring instead of the locked ink halo.
    - fix: Remove focus:outline-none/focus:ring-2/focus:ring-s-accent/30 and let the global :focus-visible ink-border+halo apply.
- **MEDIUM** `[code]` `app/[locale]/queue/[token]/page.tsx:441` ·  net-new · confirmed
    - rule: LOCKFILE §13.2 progress stepper (verified present, line 1235): only the current node's label is weighted up
    - problem: font-semibold is applied uniformly to done, current, and upcoming step labels (only text color varies); there is no weight bump for the current node.
    - fix: Add a conditional font-bold (700) when st === 'current', keep font-semibold (600) for done/future.

**States + accessibility**

- **HIGH** `[code]` `app/[locale]/walk-in-pay/page.tsx:226` ·  net-new · confirmed
    - rule: Design contract: a control that renders but does nothing / cannot be reached is a broken feature, not a UI.
    - problem: handleCancel (226-263) DELETEs the queue entry and reflects a real refund/release outcome, and cancelBtn/cancelPolicy/cancelling/cancelError copy exists in all 4 locales, but grep confirms zero references to handleCancel/cancelBtn/cancelPolicy anywhere in the JSX (no onClick wired). Additionally booking.queue_id/tracking_token only populate after payment (onPaid, 288-296), and the moment paid becomes true the page immediately router.replace()s to /queue/[token] (173-177), so the subsystem is structurally unreachable in every state.
    - fix: Either wire a real Stornieren button using l.cancelBtn for a reachable pre-payment state, or delete the dead subsystem (handleCancel, cancelling/cancelError state, cancelBtn/cancelPolicy and the other confirmed-unused translation keys) since cancellation already works on /queue/[token].
- **HIGH** `[code]` `app/[locale]/walk-in-pay/page.tsx:505` ·  net-new · confirmed
    - rule: a11y: an interactive control's aria-label must name its action, not repeat unrelated visible content
    - problem: The Info-disclosure toggle button uses aria-label={booking.service_name}, so a screen reader reads the service name (already visible right next to it) instead of an action description for what the button does (reveal a description).
    - fix: Set aria-label to a localized action string (e.g. l.serviceInfoToggle), not booking.service_name.
- **HIGH** `[code]` `app/[locale]/walk-in-pay/page.tsx:360` ·  net-new · confirmed
    - rule: Design contract: icon-button = h-11 w-11 (44px); a11y touch-target floor = 44px
    - problem: The page's only back button uses h-10 w-10 (40px), under the locked 44px icon-button floor.
    - fix: Bump to h-11 w-11 (44px), keeping the icon size/visual treatment unchanged.
- **HIGH** `[code]` `app/[locale]/queue/[token]/page.tsx:353` ·  net-new · confirmed
    - rule: Design contract: icon-button = h-11 w-11 (44px); a11y touch-target floor = 44px
    - problem: Both hero controls are undersized: the back Link (350-356, className on 353) and the help Link (359-366, className on 362) are both h-10 w-10 (40px), under the 44px floor, sitting over a photo where a mis-tap is easy.
    - fix: Bump both to h-11 w-11 (44px), keeping the frosted white-glass treatment.
- **MEDIUM** `[code]` `app/[locale]/queue/[token]/page.tsx:231` ·  net-new · confirmed
    - rule: a11y: accessible names must be localized to the active locale, not hardcoded to one language
    - problem: The star-rating buttons' aria-label is hardcoded German ('Stern'/'Sterne') regardless of the active locale, on an otherwise fully localized done-screen (l.ask/l.r1-r5 correctly translated around it).
    - fix: Build the label from the existing per-locale l object or a small inline map keyed by locale.
- **MEDIUM** `[mockup]` `app/[locale]/queue/[token]/page.tsx:140` ·  net-new · confirmed
    - rule: Design contract: states are componentised + locked (Modal exists at app/[locale]/_components/primitives/Modal.tsx) — use them, don't hand-roll native browser UI
    - problem: Cancelling a paid walk-in ticket (real refund/hold-release consequence) is gated behind a bare native window.confirm() dialog, which cannot be styled and breaks the visual system on a money-affecting action. Confirmed a Modal primitive already exists in the codebase.
    - fix: Replace window.confirm with the design system's Modal primitive, framed with the actual refund/release consequence copy (cancelledRefunded/cancelledReleased strings already exist for this exact scenario in the sibling walk-in-pay page).
- **LOW** `[mockup]` `app/[locale]/walk-in-tip/[token]/page.tsx:41` ·  net-new · confirmed
    - rule: Design contract states row: loading = Skeleton shape-matching the final layout, not a bare spinner
    - problem: A full-screen centered bare Spinner is shown for the queue-status fetch that precedes the TipSheet, with nothing hinting at the sheet's eventual layout.
    - fix: Swap for a skeleton shaped like the TipSheet's recipient-row + amount-grid (single-record fetch, so this stays low priority).

**Copy economy + i18n**

- **MEDIUM** `[code]` `app/[locale]/walk-in-pay/page.tsx:392` ·  net-new · confirmed
    - rule: Taste rule 10 / copy economy rule 5 — no tracked-uppercase / all-caps eyebrows
    - problem: The error-state eyebrow uses uppercase tracking-[.20em], the exact banned tracked-uppercase pattern.
    - fix: Drop uppercase + tracking-[.20em]; render normal-case at the locked eyebrow size (11px) or 13px semibold.
- **MEDIUM** `[code]` `app/[locale]/queue/[token]/page.tsx:385` ·  net-new · confirmed
    - rule: Taste rule 10 / copy economy rule 5 — no tracked-uppercase / all-caps labels
    - problem: The LIVE status badge is uppercase + tracking-[0.1em], the same banned pattern.
    - fix: Render normal-case ('Live') at the same size/weight; the pulsing dot already carries the live signal.

**Icons**

- **MEDIUM** `[code]` `app/[locale]/queue/[token]/page.tsx:270` ·  net-new · confirmed
    - rule: LOCKFILE §13.1 icon color model rule 2 + §13.5 drift signal (verified present in LOCKFILE.md): decorative icon inside a larger tappable row stays monochrome; blue reserved for icon-only standalone tap targets
    - problem: Two decorative icons sit inside rows where the whole row is already the tap target (Link), yet both are tinted blue (bg-s-accent-pale/text-s-accent): the help-card icon at line 270 inside the salon Link (269-274), and the Inspo-card icon at line 460 inside the whole-card Link (455-469). Confirmed against LOCKFILE.md line 1214/1265 which explicitly bans this pattern.
    - fix: Make both icons monochrome per §13.1's default table (bg-s-bg-sunken box + text-s-ink-2 icon).


### Booking wizard  `booking`

*22 files read · 8 findings (4 high) · 0 mockup-class · prior psych coverage: booking*

**Design contract**

- **HIGH** `[code]` `components-legacy/booking/ServicesStaffStep.tsx:334` ·  net-new · confirmed
    - rule: LOCKFILE selected/active row: 'NEVER black/ink fill on a selected state' (gate no-black-selected); exceptions are only the one commit CTA, booking date/slot, and the avatar SelectedCheckBadge
    - problem: The category tab's own code comment (lines 330-331) documents the CORRECT locked behavior ('Matches the SalonServices TabPill: active = soft gray fill (s-bg-sunken) + ink, NOT pure black') but the className on line 334 does the opposite: `isActive ? 'border-s-ink bg-s-ink text-white' : 'border-s-border bg-white text-s-ink-2 ...'`. The tab renders solid ink/black when selected, contradicting its own documented spec and the locked design contract.
    - fix: Change the isActive branch to `'border-s-bg-sunken bg-s-bg-sunken text-s-ink font-semibold'` (or drop the border entirely and just fill s-bg-sunken), matching the comment's own description and the locked TabPill treatment used elsewhere (e.g. SalonServices).
- **HIGH** `[code]` `components-legacy/booking/StaffStep.tsx:58` ·  net-new · confirmed
    - rule: LOCKFILE selected/active row: calm gray fill only; never ink fill/ring outside the one commit button
    - problem: Both the staff-card selection state and its 'Auswählen' pick button use ink, not the locked gray-sunken fill: `cardCls = active ? 'ring-2 ring-s-ink' : 'ring-0'` (58-61) and `pickBtnCls = active ? 'bg-s-ink text-white' : 'border border-s-border bg-white text-s-ink'` (62-65). This is a per-item selection choice among many staff, not the flow's one commit CTA (that is the bottom 'Weiter' button), so it falls under the general selected/active rule, not the ink exception.
    - fix: Swap the active branch of cardCls to a gray-sunken card treatment (`bg-s-bg-sunken` fill or a thin ink-free ring token) and the active branch of pickBtnCls to `bg-s-bg-sunken text-s-ink font-semibold` (matching the locked TabPill/filter-pill selected recipe), keeping the unselected white/outline state as-is.
- **HIGH** `[code]` `components-legacy/booking/HairStep.tsx:43` ·  net-new · confirmed
    - rule: LOCKFILE selected/active row: calm gray fill only; never ink fill outside the one commit button
    - problem: The shared PillGroup used for hair type / length / thickness (and beard, when shown) fills solid ink on selection: `on ? "border-s-ink bg-s-ink text-white" : "border-s-border bg-white text-s-ink hover:border-s-ink/30"`. These are multi-option choice pills (the exact 'filter pill / chip' pattern the design contract locks to a neutral sunken fill), not the flow's commit button. Notably the file's own header comment claims 'NO tracked-uppercase labels' compliance but says nothing about the pill fill, which does violate the selected-state law.
    - fix: Change the `on` branch to `"border-s-bg-sunken bg-s-bg-sunken text-s-ink font-semibold"`, matching the locked filter-pill/TabPill selected recipe used elsewhere.
- **MEDIUM** `[code]` `components-legacy/booking/PayConfirmStep.tsx:514` ·  net-new · confirmed
    - rule: LOCKFILE selected/active row (ink reserved for the one commit CTA), reaffirmed dated 2026-07-03 in TASTE_LOG.md: 'the ONE global commit CTA rule ... still holds everywhere else (booking pay, checkout, etc)'
    - problem: The online/in-person payment-method selector cards use a 2px ink border for the selected choice: `payChoice === 'online' ? 'border-2 border-s-ink' : 'border border-s-border'` (514-516, repeated for in_person at 531-533). The in-code comment cites 'Mockup 24d (ink, owner-approved 2026-06-12)' as justification, but TASTE_LOG.md line 158-159 has a later, explicitly-dated 2026-07-03 entry that re-confirms 'the ONE global commit CTA rule (LOCKFILE selected/active row: "ink ONLY for the one commit button") still holds everywhere else (booking pay, checkout, etc)' -- verified verbatim in TASTE_LOG.md. Under this repo's own precedence rule (latest dated decision wins), the 2026-06-12 in-code comment reads as stale versus the later dated log entry.
    - fix: Replace the selected-state ink border with the locked gray-sunken selected treatment (`bg-s-bg-sunken border-s-bg-sunken` or an ink-free selected ring), keeping the icon-disc colors as-is. If the owner intends mockup 24d's ink border to stand as a genuine carve-out for payment-method choice specifically, log that explicitly so it stops reading as contradicted by the 2026-07-03 entry.

**Consistency / drift**

- **MEDIUM** `[code]` `components-legacy/booking/StaffPicker.tsx:32` ·  net-new · confirmed
    - rule: exists-check/graveyard protocol: a component that duplicates a shipped surface and is never rendered is dead code, not a live variant; feed REMOVED.md on deletion
    - problem: StaffPicker.tsx and its sibling StaffListSheet.tsx are not imported anywhere in the active app: `grep -rln "StaffPicker" app components-legacy` and the same for `StaffListSheet` return no hits outside the files' own definitions. The live booking flow's staff step is StaffStep.tsx (imported by ServicesStaffStep.tsx / BookingWizard). Verified drift inside the orphaned files: raw hex star fill `fill="#FFC32B"` at StaffPicker.tsx:32 (instead of the `s-star` token) and bare star ratings with no review count.
    - fix: Confirm with the owner these are dead, then delete both files and add a `_design-system/REMOVED.md` line per the exists-check protocol.
- **MEDIUM** `[code]` `components-legacy/booking/PayConfirmStep.tsx:327` ·  net-new · confirmed
    - rule: consistency canonical: card/block radius = rounded-card(16); kill arbitrary rounded-[12px]/[13px]/[18px]/[22px] bracket values
    - problem: Multiple radii in this file use an arbitrary bracket value that matches no locked token: the salon photo/fallback tile (`rounded-[12px]` at 327, 330), the online/in-person payment cards (`rounded-[12px]` at 514, 531), and the deposit/prepay cards (`rounded-[12px]` at 548, 570) -- all verified present. None equals the locked card/block value (16, `rounded-card`) or the input value (16, `rounded-input`); 12px matches nothing in the locked radius scale. The same arbitrary-12px pattern also verified to recur in app/[locale]/_components/primitives/DateTimePicker.tsx (lines 375, 512, 537, 555 -- note: correct path differs from the finding's stated 'components-legacy/booking/DateTimePicker.tsx', the file actually lives under app/[locale]/_components/primitives/), BookingCard.tsx:111, BookingConfirmation.tsx:277, and CancelBookingSheet.tsx:101/140/142 -- all confirmed present at those lines.
    - fix: Replace `rounded-[12px]` with the token that matches the element's role: `rounded-card` (16px) for card-like tiles/blocks, or `rounded-input` (16px) for input-adjacent chrome, across all the cited locations so a future change to the radius token actually propagates.

**States + accessibility**

- **HIGH** `[code]` `components-legacy/booking/BookingExitButton.tsx:43` ·  net-new · confirmed
    - rule: design contract icon-button spec: h-11 w-11 (44px); a11y touch-target floor >=44px for interactive controls
    - problem: The booking flow's X exit control, present on every wizard step via BookingWizard.tsx, is 36px: `className="grid h-9 w-9 shrink-0 place-items-center rounded-full transition-colors hover:bg-s-bg-sunken"`. Verified recurrence of the same under-floor pattern in LIVE (imported/rendered) files: the same component's own exit-confirm modal close button (line 66, h-9 w-9), BookingWizard.tsx:189 and 204 (back arrow, h-10 w-10 = 40px, confirmed live in the wizard header), ServiceDetailSheet.tsx close button (h-10 w-10, confirmed used by ServicesStaffStep.tsx), CancelBookingSheet.tsx:88-96 (policy-help button, h-9 w-9, confirmed used by BookingsList.tsx), and WaitlistModal.tsx:125 (`p-1` wrapping a 20px icon, confirmed used by DateTimeStep.tsx). StaffListSheet.tsx:52 is a real 36px close button too, but that file is orphaned dead code (see the separate dead-code finding) so it should not be counted as a live-surface instance.
    - fix: Bump every one of these icon buttons to `h-11 w-11` (44px), keeping the same visual icon size (18-22px) centered inside via `place-items-center`, matching the locked icon-button spec already used correctly elsewhere in the design system.

**Copy economy + i18n**

- **MEDIUM** `[code]` `components-legacy/booking/CancelBookingSheet.tsx:113` ·  net-new · confirmed
    - rule: taste rule 10 / copy economy rule 5: no tracked-uppercase / all-caps eyebrows, use normal-case 13px semibold
    - problem: The refund amount's label literally names itself the banned pattern: `<div className="font-body text-[11.5px] font-semibold uppercase tracking-[0.07em] text-s-ink-3">{t("refundEyebrow")}</div>`. The same banned pattern appears in WaitlistModal.tsx:152 for the 'preferred time' label: `className="mb-2 font-heading text-xs font-bold uppercase tracking-[.04em] text-s-ink-2"`. Both files are confirmed live (rendered from BookingsList.tsx and DateTimeStep.tsx respectively).
    - fix: Drop `uppercase tracking-[...]` and render both labels normal-case at 13px semibold (`text-[13px] font-semibold text-s-ink-2`), matching the rest of the booking flow's label treatment (e.g. PayConfirmStep's `paymentEyebrow` label at line 502-504, which is already correctly normal-case).


### Inspo (feed, detail, saved)  `inspo`

*29 files read · 11 findings (4 high) · 1 mockup-class · prior psych coverage: inspo*

**Psychology laws**

- **HIGH** `[code]` `components-legacy/discovery/SearchAutocomplete.tsx:100` ·  net-new · confirmed
    - rule: PSYCH law 6 (stars never bare — every rating shows its count)
    - problem: Salon rows in the search-autocomplete dropdown render RatingStars with a value but no count prop; SalonHit interface (line 20) has no review_count field, so no count data is even fetched. RatingStars.tsx confirms count is optional and renders "(n)" only when passed (lines 22-23, 147, 197).
    - fix: Add review_count to the /api/search/suggest salon payload and the SalonHit interface, then pass count={s.review_count} into RatingStars here.
- **MEDIUM** `[code]` `app/[locale]/inspo/saved/[id]/page.tsx:28` ·  net-new · confirmed
    - rule: PSYCH law 12/N (retention loops — no dead-end, no killed-feature routes left live)
    - problem: REMOVED.md line 33 documents named-Collections/boards as reverted 2026-06-23 ("Heart now does a plain save toggle; /inspo/saved is a flat Gespeichert grid", FeaturedBoards kept dormant not dropped). Confirmed FeaturedBoards.tsx (the only in-app source of a /inspo/board/[id] link) has zero importers/render sites, and /inspo/saved/page.tsx routes cards straight to /inspo/{id}, never to /inspo/saved/{id}. Both /inspo/saved/[id] and /inspo/board/[id] remain live, fetching, reachable-only-by-stale-link dead ends.
    - fix: Either delete both routes (mirroring the REMOVED.md decision) or redirect them to /inspo/saved per the current flat-save model.

**Design contract**

- **MEDIUM** `[code]` `components-legacy/discovery/ProgressiveFilter.tsx:84` ·  net-new · confirmed
    - rule: Locked radius scale (card 16 / pill / input 16 / sheet 28) — arbitrary rounded-[Npx] is drift
    - problem: Confirmed five arbitrary bracket radii at the exact cited lines: rounded-[12px] (line 84), rounded-[9px] (lines 89, 105), rounded-[14px] (line 137), rounded-[18px] (line 175), rounded-[20px] (line 123). FilterDrawer.tsx's own filter trigger is rounded-[14px] (line 62) while sibling icon-buttons in the same file use rounded-full (lines 77, 110).
    - fix: Consolidate onto the locked scale: pill controls to rounded-pill, tiles/chips to rounded-card, align FilterDrawer's trigger to rounded-full.
- **MEDIUM** `[code]` `components-legacy/discovery/DiscoveryEmptyState.tsx:19` ·  net-new · confirmed
    - rule: Hairline/token canonical: border-s-border is the one divider token; border-s-ink/{op} and raw opacity utilities are drift
    - problem: Confirmed border-s-ink/15 and text-s-ink/70 at line 19, none marked drift-ok. Confirmed the same raw-opacity pattern (text-s-ink/30, /40, /45; border-s-ink/[0.06-0.08]; bg-s-ink/5, /10, /40) recurs across ProfileSetupModal.tsx, InlinePrefsPanel.tsx, and PostFromDiscover.tsx, unlike the legitimately-documented drift-ok #D7D7DB exception at ProgressiveFilter.tsx:138,176.
    - fix: Replace border-s-ink/{op} with border-s-border and text-s-ink/{op} with text-s-ink-2/-3 across the four files.

**Consistency / drift**

- **HIGH** `[code]` `components-legacy/discovery/ShareButton.tsx:1` ·  net-new · confirmed
    - rule: Dead code / unreachable UI (extends the existing BookCTA finding)
    - problem: Verified via grep that none of ShareButton.tsx, ReportButton.tsx (only referenced by the equally-orphaned CommentSection.tsx), CommentSection.tsx, SimilarStyles.tsx, StyleNamePills.tsx, GenderToggle.tsx, PatternSelector.tsx, DescriptionCard.tsx, RelatedTikToks.tsx, ProductRecommendations.tsx, ProfileDiscoverySections.tsx, UserPostsSection.tsx (only imported by the orphaned ProfileDiscoverySections.tsx), SourceBadge.tsx, CategoryPills.tsx, PickStylistFlow.tsx (and its sole importer of components-legacy/discovery/StaffPortfolio.tsx), SalonScript.tsx have any external importer. CategoryTabBar.tsx's own <CategoryTabBar> JSX component (lines 19-56) has zero render sites anywhere in the app; only its re-exported DISCOVERY_CATEGORIES constant is used. None logged in REMOVED.md.
    - fix: Confirm with the owner whether any of this cluster is still planned; if not, delete the whole set and log one consolidated REMOVED.md line.

**States + accessibility**

- **HIGH** `[code]` `app/[locale]/inspo/loading.tsx:19` ·  net-new · confirmed
    - rule: Design contract: loading state = <Skeleton> shape-matching the final layout, not a bare/mismatched placeholder
    - problem: The route-level loading boundary renders grid-cols-2/3/4 with gap-4 and rounded=20 tiles, which contradicts the real feed's CSS-columns masonry (MasonryGrid.tsx: columns-2/3/4, gap-1.5) and the correctly-built DiscoveryGridSkeleton.tsx (already used at page.tsx:558 and :629), which shape-matches with gap-1.5, rounded-2xl, and varied aspect ratios. Confirmed the two skeletons diverge structurally.
    - fix: Delete the bespoke grid in loading.tsx and render DiscoveryGridSkeleton instead.
- **MEDIUM** `[code]` `components-legacy/discovery/DetailPage.tsx:253` ·  net-new · confirmed
    - rule: Design contract touch target: interactive controls >= 44px (h-11 floor)
    - problem: Confirmed both the back button (line 253) and heart/save button (line 263) are h-9 w-9 (36px), under the 44px floor, on the two most-tapped controls of the look-detail hero. SearchBar.tsx's inline clear (X) button (lines 58-65) confirmed to have no size class at all around the bare 14px glyph.
    - fix: Bump DetailPage.tsx:253 and :263 to h-11 w-11; wrap SearchBar.tsx's clear button in a h-11 w-11 tappable area.
- **LOW** `[code]` `components-legacy/discovery/RecentSearches.tsx:144` ·  net-new · confirmed
    - rule: Design contract touch target: interactive controls >= 44px (h-11 floor)
    - problem: Confirmed the per-term remove (X) button is h-8 w-8 (32px) at exactly line 144. DiscoveryEmptyState.tsx's reset button (px-5 py-2.5 text-sm, line 19, no explicit height) is also under 44px in practice.
    - fix: Bump RecentSearches.tsx:144 to h-11 w-11; give DiscoveryEmptyState.tsx:19's button a min-h-11 wrapper.

**Copy economy + i18n**

- **HIGH** `[mockup]` `components-legacy/discovery/ProfileSetupModal.tsx:111` ·  net-new · confirmed
    - rule: Copy economy rule 5 (no tracked-uppercase/all-caps eyebrows or labels) + design contract CTA text (never <=13px on a button)
    - problem: pillClass (line 111) sets text-[12px] uppercase tracking-[.06em] on every selectable pill; the eyebrow at line 140-141 repeats the pattern; and the primary commit button at line 205-207 renders the save CTA at text-xs (12px) uppercase tracked, well under the locked 15px/never-<=13px CTA floor. Confirmed the identical uppercase-12px pattern recurs in InlinePrefsPanel.tsx (pillClass line 66, labels 117/141/157/174/192/198) and PostFromDiscover.tsx (lines 199, 206).
    - fix: Swap every uppercase-tracked label/pill/CTA in these three files to normal-case 13-15px semibold; bump ProfileSetupModal.tsx's commit button to the locked 15px CTA size.
- **MEDIUM** `[code]` `components-legacy/discovery/RecentSearches.tsx:109` ·  net-new · confirmed
    - rule: i18n integrity for a de/en/fr/it product — no hardcoded single-locale copy shipped
    - problem: Confirmed hardcoded German at the exact cited lines: "Zuletzt gesucht" (109), "Alle löschen" (116), and the aria-label template literal with a hardcoded word (141). Confirmed the same gap in SearchAutocomplete.tsx ("Styles" line 87, "Salons" line 96, "Suche nach" line 123).
    - fix: Move these strings into the discover next-intl namespace and translate for en/fr/it.

**Icons**

- **MEDIUM** `[code]` `components-legacy/discovery/InlinePrefsPanel.tsx:109` ·  net-new · confirmed
    - rule: Icon rule: no sparkles/star glyph (Lucide-only, no banned decorative glyphs)
    - problem: Confirmed Sparkles import (line 4) and render (line 109) on the personalize-feed banner, and the same banned glyph in DiscoveryAdmin.tsx (import line 6, renders at lines 44 and 191). LOCKFILE.md:1235 explicitly bans sparkles.
    - fix: Replace the Sparkles icon with a real Lucide icon or drop it entirely, in both files.


### Loyalty / rewards / vouchers / referral  `loyalty-rewards`

*10 files read · 17 findings (4 high) · 2 mockup-class · prior psych coverage: none (new coverage)*

**Psychology laws**

- **HIGH** `[code]` `app/[locale]/profile/stamps/page.tsx:101` ·  net-new · confirmed
    - rule: PSYCH law 6: stars/rankings weight score x volume (Bayesian), never raw average
    - problem: The empty-state "Beliebt in Basel" rail is built from a raw unweighted average_rating sort with no review_count floor, verified verbatim: `.from("salons").select("slug, name, cover_photo_url, average_rating, review_count, quartier").eq("is_active", true).order("average_rating", { ascending: false }).limit(6)` (lines 97-102, .order call at line 101). A salon with a single 5-star review outranks one with hundreds of 4.8-star reviews.
    - fix: Add a minimum review_count floor (e.g. .gte("review_count", 5)) before sorting by rating, or weight the sort with a Bayesian/Wilson-score expression.
- **LOW** `[code]` `app/[locale]/rewards/page.tsx:22` ·  net-new · confirmed
    - rule: PSYCH law 4: value before auth, guest-first (soften a hard redirect with legible copy)
    - problem: A logged-out visitor hitting /rewards (or /profile/stamps, same pattern at profile/stamps/page.tsx:57-59) is hard-redirected with zero explanation: `if (!session?.user) { redirect(...) }`. Verified the target login page (app/[locale]/auth/login/page.tsx) renders fully generic, hardcoded copy ('Willkommen zurück' / 'Melde dich an, um Termine zu buchen und zu verwalten') that never reflects the redirect param, so a shared loyalty link silently becomes an unexplained login wall.
    - fix: Add a short explanatory line above the login form when the redirect param points at these two routes ('Melde dich an, um deinen Treuestatus zu sehen').

**Design contract**

- **MEDIUM** `[code]` `app/[locale]/loyalty/stamp/page.tsx:93` ·  net-new · confirmed
    - rule: design contract: CTA text size never below 14px on a button
    - problem: The only commit action on this token-based QR flow is 12px: `className="w-full rounded-pill bg-s-ink text-white text-xs font-heading uppercase tracking-[.04em] py-3.5 ..."` (text-xs = 12px). Verified verbatim at line 93.
    - fix: Change text-xs to text-[15px] to match the locked CTA size used elsewhere (e.g. RewardsView's CTA at text-[15.5px]).
- **MEDIUM** `[mockup]` `app/[locale]/referral/[code]/page.tsx:60` ·  net-new · confirmed
    - rule: taste rule 3: 80/17 surfaces+ink, no warm cream
    - problem: The page renders `<div className="ambient-v5 pointer-events-none" aria-hidden="true" />`. Verified `.ambient-v5` in app/globals.css:750-754 blends `rgba(243,168,100,0.03)` amber, a warm decorative wash on a customer surface, contradicting the B&W-pivot 80/17 rule the rest of the app follows.
    - fix: Remove the .ambient-v5 div (or swap to a neutral/cool wash with no amber component) so legacy pre-pivot styling doesn't reintroduce warmth on a live route.
- **LOW** `[code]` `app/[locale]/referral/[code]/page.tsx:66` ·  net-new · confirmed
    - rule: design contract: card shadow-elevation-2 at rest, -3 only on hover
    - problem: The static (never-hovered) landing card is given `"rounded-card-lg shadow-elevation-3"` at rest, verified verbatim at line 66, one level above the locked resting elevation. This uses the rounded-card-lg card token, so it falls under the card-shadow contract row, and the page has no hover interaction on this element.
    - fix: Change shadow-elevation-3 to shadow-elevation-2 for the resting state, since this page has no hover interaction.

**Consistency / drift**

- **HIGH** `[code]` `app/[locale]/profile/stamps/page.tsx:17` ·  net-new · confirmed
    - rule: app-wide i18n law (de/en/fr/it); next-intl is the established pattern (RewardsView.tsx uses useTranslations correctly)
    - problem: `import { getTranslations } from "next-intl/server";` is imported but never called anywhere in the file (verified: no `getTranslations(` call and no `t(` usage exists in the file). Every string is a hardcoded German literal: title="Noch keine Stempel." (line 109), lead (line 110), bannerTitle="So funktioniert's" (line 112), `{allCards.length} Karten` (line 128), `Aktiv` (line 145/146), `Eingelöst {redeemed.length}` (line 168/169). A logged-in EN/FR/IT user sees German-only copy.
    - fix: Call const t = await getTranslations("profileStamps") and replace every hardcoded string with t(...) keys, adding de/en/fr/it entries to the locale JSON files.
- **HIGH** `[code]` `app/[locale]/loyalty/stamp/page.tsx:1` ·  net-new · confirmed
    - rule: app-wide i18n law (de/en/fr/it)
    - problem: This file has no next-intl import at all (verified, file has no import of next-intl anywhere). Every string, including error copy shown to whoever scanned the QR code ("Kein Token vorhanden" line 22, "Netzwerkfehler" line 54, "Unbekannter Fehler" line 48, "Etwas ist schiefgelaufen" line 144), is a hardcoded German literal, so a non-German-speaking customer scanning a salon's stamp QR gets an untranslated page.
    - fix: Add useTranslations/locale-aware copy the same way RewardsView.tsx does, so all four supported languages render correctly.
- **MEDIUM** `[code]` `app/[locale]/rewards/RewardsView.tsx:35` ·  net-new · confirmed
    - rule: consistency canonical: star/error use tokens, not raw hex; extends to all color usage
    - problem: `if (kind === "pink") return `${base} bg-[#FF3366]/10 text-[#FF3366]`;` hardcodes a raw hex instead of a token. Verified tailwind.config.js:169 the current s-love token is `DEFAULT: "#CC4A60"` (comment at line 164-165: "Muted from #FF4A6B -> #CC4A60" during a color-reduction consolidation), a different hex from #FF3366 used here, confirming this is a stale pre-consolidation raw hex, not a current token.
    - fix: Replace with the s-love token (bg-s-love/10 text-s-love) if that's still the intended semantic pink, or confirm with the owner which hex is canonical for the birthday perk before wiring a token.
- **MEDIUM** `[code]` `app/[locale]/rewards/RewardsView.tsx:32` ·  net-new · confirmed
    - rule: consistency canonical: radius = locked tokens only (card 16 / pill / input 16 / sheet 28), kill arbitrary rounded-[Npx]
    - problem: Multiple arbitrary pixel radii with no matching locked token, verified verbatim: `const base = "grid h-9 w-9 shrink-0 place-items-center rounded-[11px]";` (line 32, perk icon chips) and rounded-[14px] on both active/inactive perk-row wrappers (lines 200-201).
    - fix: Round the icon chips and perk rows to rounded-card (16px) so both match the locked radius scale instead of inventing 11/14.
- **MEDIUM** `[code]` `app/[locale]/loyalty/stamp/page.tsx:79` ·  net-new · confirmed
    - rule: consistency canonical: radius = locked tokens only, kill arbitrary rounded-[Npx]
    - problem: Every icon box uses an arbitrary rounded-[18px] instead of the locked 16px card token, verified at line 79 (ready state), line 107 (stamped state), and line 141 (error state). The reward-unlocked pill also uses an arbitrary rounded-[10px] (line 126).
    - fix: Change all three icon-box instances to rounded-card (16px) and the reward pill to rounded-pill or the nearest locked chip radius.
- **LOW** `[code]` `app/[locale]/referral/[code]/page.tsx:58` ·  net-new · confirmed
    - rule: design contract: use the s-* Tailwind token system, not raw CSS-var bracket syntax
    - problem: `<main className="min-h-screen bg-[--base] flex items-center justify-center px-4 py-16">` and bg-[--raised] (line 65) reference legacy pre-B&W-pivot CSS custom properties (verified globals.css:76 --base: #FFFFFF, globals.css:86 --raised: rgba(255,255,255,.95)) via arbitrary-value bracket syntax instead of the bg-white/bg-s-bg-sunken tokens the rest of the loyalty-rewards surface uses.
    - fix: Replace bg-[--base] with bg-white and bg-[--raised] with bg-white (or the nearest s-* surface token), matching the rest of the loyalty-rewards surface.

**States + accessibility**

- **HIGH** `[mockup]` `app/[locale]/referral/[code]/page.tsx:36` ·  net-new · confirmed
    - rule: WCAG 2.2.1 Timing Adjustable (a11y floor) + no aria-live on a changing, redirect-triggering countdown
    - problem: A 5-second auto-redirect fires with no way to pause, stop, or extend (verified useEffect at lines 36-51: setInterval decrements secondsLeft then calls router.push). The countdown text (line 126, `{t("redirect", { seconds: secondsLeft })}`) is a plain `<p>` with no aria-live, so a screen-reader user gets no warning before being involuntarily navigated away, and there is no visible pause/stay control anywhere in the component.
    - fix: Add a visible 'Bleiben' / 'Stay here' control that calls clearInterval, and wrap the countdown text in aria-live="polite" so assistive tech announces the pending redirect.

**Copy economy + i18n**

- **MEDIUM** `[code]` `app/[locale]/loyalty/stamp/page.tsx:82` ·  net-new · confirmed
    - rule: feedback_ui_copy_rules / copy economy rule 5: no tracked-uppercase, never ALL-CAPS
    - problem: Three separate text elements use uppercase + tracking: the eyebrow `text-[12px] font-heading uppercase tracking-[.08em]` "Stempelkarte" (line 82), the CTA button `text-xs font-heading uppercase tracking-[.04em]` "Stempel vergeben" (line 93), and the confirmed-state eyebrow `text-[12px] font-heading uppercase tracking-[.08em]` "Gestempelt" (line 115). Verified all three exist verbatim.
    - fix: Drop uppercase and the letter-spacing on all three; use normal-case 13px semibold for the eyebrows and a normal-case 15px label on the CTA button.
- **MEDIUM** `[code]` `app/[locale]/referral/[code]/page.tsx:81` ·  net-new · confirmed
    - rule: feedback_ui_copy_rules / copy economy rule 5: no tracked-uppercase, never ALL-CAPS
    - problem: The headline is forced ALL CAPS: `<h1 className="font-display text-4xl sm:text-5xl text-s-ink leading-none tracking-wide uppercase">{t("headline")}</h1>`, repeated on the code-label chip: `<span className="font-body text-xs font-semibold text-s-ink-2 uppercase tracking-widest mr-1">{t("codeLabel")}</span>` (line 98). Both verified verbatim.
    - fix: Drop uppercase/tracking-wide/tracking-widest on both; render the headline in sentence case and the code label as normal-case 13px semibold.
- **MEDIUM** `[code]` `app/[locale]/profile/stamps/page.tsx:145` ·  net-new · confirmed
    - rule: feedback_ui_copy_rules / copy economy rule 5: no tracked-uppercase eyebrows, never ALL-CAPS
    - problem: Section headers and a status badge are set in tracked ALL CAPS, verified verbatim: `<h2 className="font-body text-[12px] font-bold uppercase tracking-[.22em] text-s-ink/40 mb-3">Aktiv</h2>` (line 145), repeated for "Eingelöst {redeemed.length}" (line 168), and the redeemed-card badge `className="... uppercase tracking-[.08em] bg-s-success/10 text-s-success"` "Belohnung verfügbar" (line 186).
    - fix: Drop uppercase and the tracking on all three; use normal-case 13px semibold section labels and normal-case badge text.

**Icons**

- **MEDIUM** `[code]` `app/[locale]/rewards/RewardsView.tsx:28` ·  net-new · confirmed
    - rule: feedback_icon_rules: real Lucide icons only, no zap/lightning icon
    - problem: The platinum-tier perk 'angebote48' (48h-early-access offers) is rendered with the Lucide Zap icon: `{ key: "angebote48", Icon: Zap, chip: "mut", min: "platinum" as Tier }` (Zap imported at line 7). Zap/lightning is an explicitly banned glyph.
    - fix: Swap Zap for an unbanned Lucide icon that reads as 'early access' (e.g. Clock, Rocket, or another CalendarClock-family icon), keeping the same chip treatment.
- **MEDIUM** `[code]` `app/[locale]/referral/[code]/page.tsx:97` ·  net-new · confirmed
    - rule: feedback_icon_rules: no sparkles/star glyph
    - problem: The referral-code badge renders `<Sparkles className="w-4 h-4 text-s-ink-2 ..." />` (imported line 6). Sparkles is an explicitly banned glyph.
    - fix: Replace with a neutral, meaning-carrying icon (e.g. Gift again, or Tag/Hash for a code chip), or drop the icon entirely since the code text is self-explanatory.


### Reviews / booking-lookup / notifications  `reviews-lookup-notif`

*9 files read · 14 findings (4 high) · 1 mockup-class · prior psych coverage: reviews + retention(notifications)*

**Psychology laws**

- **MEDIUM** `[code]` `app/[locale]/recently-viewed/RecentlyViewedClient.tsx:109` ·  net-new · confirmed
    - rule: PSYCHOLOGY law 6, stars never bare (every star shows its count)
    - problem: The star+rating renders when average_rating > 0, with the review-count span gated by a SEPARATE inner condition (`s.review_count != null && s.review_count > 0`). Verified: if average_rating is set but review_count is null/0, the star renders with no count, a bare rating.
    - fix: Merge into one gate: only render the star block when both average_rating > 0 AND review_count > 0 are true.

**Design contract**

- **LOW** `[code]` `app/[locale]/recently-viewed/RecentlyViewedClient.tsx:80` ·  net-new · confirmed
    - rule: design-contract states: empty = EmptyState (componentised, locked), don't hand-roll
    - problem: The empty state (icon disc + title + body + CTA, lines 80-92) is hand-rolled inline JSX instead of importing the shared `components-legacy/ui/EmptyState.tsx` primitive (verified to exist, exporting an icon/title/message/action prop shape) that other surfaces use.
    - fix: Swap the hand-rolled block for <EmptyState icon={Clock} title={t('emptyTitle')} message={t('emptyBody')} action={<Link href={...}>{t('emptyCta')}</Link>} />.

**Consistency / drift**

- **MEDIUM** `[code]` `app/[locale]/booking/lookup/page.tsx:413` ·  net-new · confirmed
    - rule: consistency canonical: card/block radius = rounded-card(16), no phantom rounded-[Npx]
    - problem: Info/strip boxes on this page use one-off arbitrary bracket radii matching no locked token: rounded-[14px] (security note L413, sent-validity L465, order-number strip L586, refund-window note L610), rounded-[12px] (AppBar L258), rounded-[10px] (copy button L599). All verified present at cited lines; none equal the locked card(16)/pill tokens.
    - fix: Standardize the info-box family to rounded-card (16px) or rounded-panel; standardize the small icon buttons to rounded-pill.
- **MEDIUM** `[code]` `app/[locale]/booking/resend-link/page.tsx:356` ·  net-new · confirmed
    - rule: consistency canonical: card/block radius = rounded-card(16), no phantom rounded-[Npx]
    - problem: Same drift pattern as the sibling lookup page, verified at all four cited lines: rounded-[12px] (channel tab wrapper L356), rounded-[9px] (individual tab pill L366), rounded-[11px] (destination-card icon disc L470), rounded-[12px] (privacy note L480). None match the locked 16/pill tokens.
    - fix: Fold into rounded-card/rounded-panel (16) for boxes and rounded-pill for the tab segment control.
- **MEDIUM** `[code]` `app/[locale]/reviews/_components/MarketplaceReviewsList.tsx:50` ·  net-new · confirmed
    - rule: LOCKFILE hairline: border-s-border is the ONE token every divider uses; border-s-ink/{op} = drift
    - problem: The review card's outer border uses an ink-opacity hack instead of the locked hairline token: `<article className="border border-s-ink/5 rounded-[16px] p-4">`. Verified exactly at line 50.
    - fix: Swap border-s-ink/5 for border-s-border.
- **LOW** `[code]` `app/[locale]/recently-viewed/RecentlyViewedClient.tsx:100` ·  net-new · confirmed
    - rule: consistency canonical: card photo radius = rounded-card(16); kill phantom rounded-[13px]/[12px] etc
    - problem: Both the photo (L100) and photo-fallback avatar (L102) use an arbitrary bracket radius rounded-[14px] instead of the locked rounded-card token. Verified at both lines.
    - fix: Swap rounded-[14px] for rounded-card on both the image and the fallback-initial disc.
- **LOW** `[code]` `app/[locale]/reviews/_components/MarketplaceReviewsList.tsx:50` ·  net-new · confirmed
    - rule: design-contract radius: card/block = rounded-card (16px token), not a bracket literal of the same value
    - problem: Same line uses rounded-[16px], the correct pixel value but as an arbitrary bracket instead of the rounded-card utility. Verified.
    - fix: Replace rounded-[16px] with rounded-card.

**States + accessibility**

- **HIGH** `[code]` `app/[locale]/booking/lookup/page.tsx:258` ·  net-new · confirmed
    - rule: design-contract icon-button = h-11 w-11 (44px touch floor)
    - problem: AppBar back/close control (the only nav affordance on every view of this guest flow) is h-9 w-9 (36px): `className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-s-bg-sunken text-s-ink transition-colors duration-150 ease-snap hover:brightness-[0.97]"`. 8px under the locked 44px floor.
    - fix: Change h-9 w-9 to h-11 w-11, keep the glyph size, grow the tappable box.
- **HIGH** `[code]` `app/[locale]/booking/resend-link/page.tsx:166` ·  net-new · confirmed
    - rule: design-contract icon-button = h-11 w-11 (44px touch floor)
    - problem: Sticky header back button, the only way to leave this page, is h-[34px] w-[34px]: `className="flex h-[34px] w-[34px] items-center justify-center rounded-pill border border-s-border bg-white text-s-ink transition-colors duration-150 ease-snap hover:bg-s-bg-sunken"`. 10px under the 44px floor.
    - fix: Bump to h-11 w-11, keep the 18px ArrowLeft glyph centered.
- **HIGH** `[code]` `app/[locale]/reviews/_components/MarketplaceReviewsList.tsx:85` ·  net-new · confirmed
    - rule: WCAG AA text contrast floor (4.5:1 for text under 18px)
    - problem: The review date is rendered at text-s-ink/30: `<span className="shrink-0 text-xs text-s-ink/30 tabular-nums">`. Recomputed independently: 30% opacity of #0A0A0A over white blends to roughly rgb(182,182,182), which yields a contrast ratio of approximately 2:1 against white, well under the 4.5:1 floor for 12px text (an even worse ratio than the auditor's own estimate).
    - fix: Replace the opacity modifier with a named low-emphasis token that meets contrast, e.g. text-s-ink-2.
- **MEDIUM** `[code]` `app/[locale]/booking/lookup/page.tsx:599` ·  net-new · confirmed
    - rule: design-contract icon-button = h-11 w-11 (44px touch floor)
    - problem: The order-number copy button in OpenedView is h-[34px] w-[34px]: `className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-[10px] border border-s-border bg-white"`. Under the 44px floor.
    - fix: Bump to h-11 w-11 (or wrap the visible 34px circle in a padded 44px hit area).
- **MEDIUM** `[mockup]` `app/[locale]/recently-viewed/RecentlyViewedClient.tsx:77` ·  net-new · confirmed
    - rule: design-contract states: loading = Skeleton shape-matching the final layout, never a bare spinner
    - problem: The full-list load renders `{loading ? (<div className="flex justify-center py-16"><Spinner /></div>) : ...}`, a bare centered spinner rather than a Skeleton shaped like the incoming salon-row list. Verified at line 77 exactly.
    - fix: Replace with 3-4 Skeleton rows shaped like the real row (56px photo disc + two text lines).

**Copy economy + i18n**

- **HIGH** `[code]` `app/[locale]/reviews/_components/MarketplaceReviewsList.tsx:67` ·  net-new · confirmed
    - rule: copy economy rule 2: long text truncates with an inline text-s-accent 'Mehr lesen' that expands in place; never grey/underlined read-more
    - problem: The read-more/read-less toggle uses exactly the banned styling: `className="ml-1 text-s-ink-2 font-medium hover:text-s-ink hover:underline"`, grey text-s-ink-2 that turns ink + underlined on hover instead of the mandated inline blue text-s-accent. Verified; adjusted line to the className attribute (67) rather than the button's opening tag (64).
    - fix: Swap to className="ml-1 text-s-accent font-medium" (drop grey/underline-on-hover).
- **MEDIUM** `[code]` `app/[locale]/notifications/NotificationsClient.tsx:150` ·  net-new · confirmed
    - rule: taste rule 10 / copy rule 5: no tracked-uppercase eyebrows; use normal-case 13px semibold
    - problem: The HEUTE / FRÜHER section-group labels use the banned pattern, verified exactly: `className="px-4 text-[12px] font-semibold uppercase tracking-[0.08em] text-s-ink-3"`, uppercase transform plus tracked letter-spacing.
    - fix: Drop uppercase tracking-[0.08em], keep the label normal-case 13px semibold.


### Static + legal + help  `static-legal`

*23 files read · 10 findings (4 high) · 0 mockup-class · prior psych coverage: none (new coverage)*

**Fabricated data (no-fabrication law)**

- **MEDIUM** `[code]` `app/[locale]/terms/components/TermsContent.tsx:124` ·  net-new · confirmed
    - rule: no fabricated/stale claims: a legally-binding document must not assert a payment method that is not actually offered
    - problem: Section 5.1 'Zahlungsmethoden' lists <li>TWINT</li> (line 124, under the 5.1 Article header at line 120) as an accepted payment method. Per project memory (project_money_features_shipped.md), TWINT is currently OFF platform-wide pending Stripe review; verified no active TWINT payment-intent wiring in app/api/stripe/booking-pay-intent/route.ts (only a comment excluding redirect/BNPL methods like TWINT). The Terms of Service asserts a payment option not currently live at checkout.
    - fix: Remove the TWINT line item from the accepted-methods list until re-enabled, or add a parenthetical '(vorübergehend deaktiviert / temporarily unavailable)'.

**Design contract**

- **HIGH** `[code]` `app/[locale]/help/page.tsx:92` ·  net-new · confirmed
    - rule: design contract selected/active row (LOCKFILE, gate no-black-selected): filter pill/segment selected = bg-s-bg-sunken + text-s-ink, NEVER ink/black fill
    - problem: The category filter tabs use ink fill for the selected state: activeCategory === null ? "bg-s-ink text-white" : "bg-s-bg-sunken text-s-ink-2 hover:bg-s-border" (line 92, repeated at line 105 for the per-category buttons). The code comment at line 56 claims this is 'per LOCKFILE TabPill pattern', but ink-fill (V3-D421) was superseded by the calm-gray-sunken selected state on 2026-06-29 and is gate-enforced (no-black-selected) - this is exactly the banned pattern.
    - fix: Swap both button className ternaries to activeCategory === X ? "bg-s-bg-sunken text-s-ink font-semibold" : "bg-white text-s-ink-2 border border-s-border hover:text-s-ink", matching the locked TabPill treatment used elsewhere.
- **MEDIUM** `[code]` `app/[locale]/privacy/page.tsx:41` ·  net-new · confirmed
    - rule: design contract radius row: card/block = 16 (rounded-card); arbitrary rounded-[12px]/[8px]/[24px] = drift
    - problem: Arbitrary pixel radii used instead of the locked token, verified at every cited location: rounded-[12px] on the warning banner (privacy/page.tsx:41, terms/page.tsx:43, TermsContent.tsx:424), rounded-[12px] on the sidebar mobile-toggle button and dropdown (PrivacySidebar.tsx:62,75; identical TermsSidebar.tsx:73,86), rounded-[8px] on the sidebar nav buttons (PrivacySidebar.tsx:81,105; TermsSidebar.tsx:92,117), rounded-[12px] on the processor table (PrivacyContent.tsx:47), rounded-[24px] on the coming-soon icon disc (coming-soon/page.tsx:64), and rounded-[12px] on the help hero icon square and article rows (help/page.tsx:60,149).
    - fix: Replace every rounded-[12px] block-level instance with rounded-card (16px token) and every rounded-[8px] nav-item instance with the standard rounded-btn/rounded-lg token.

**Consistency / drift**

- **HIGH** `[code]` `app/[locale]/legal/terms/page.tsx:4` ·  net-new · confirmed
    - rule: exists-check dedup / duplicate-diverging-legal-surfaces (no-duplication law + legal accuracy)
    - problem: This route (5 flat sections via getTranslations("legal")) is the document users actually tap 'I agree' to: linked from the salon-onboarding TOS checkbox (app/[locale]/onboarding/salon/page.tsx:167,169 -> /${locale}/legal/terms and /${locale}/legal/privacy) and from components-legacy/auth/TosPrompt.tsx:94,98. The canonical footer-linked /terms page (app/[locale]/terms/components/TermsContent.tsx, verified 489 lines, 5 numbered top-level sections with many sub-articles including 15% commission, 50% late-cancellation fee, no-show charging, refund matrix, account-suspension rules) is a materially different, far more complete document at a different URL. Two documents both purporting to be Terms of Service.
    - fix: Point every TOS-acceptance entry point (onboarding/salon/page.tsx:167,169 and TosPrompt.tsx:94,98) at the canonical /terms and /privacy routes instead of /legal/terms and /legal/privacy. Then delete the legal/terms and legal/privacy stub routes (and orphaned legal.* message keys) and log the removal in _design-system/REMOVED.md.
- **HIGH** `[code]` `app/[locale]/terms/page.tsx:16` ·  net-new · confirmed
    - rule: i18n completeness (project is de/en/fr/it; a legal surface must render per the active locale)
    - problem: export default async function TermsPage() takes no params/locale, never calls getTranslations/useLocale; the entire content (TermsContent.tsx, verified fully hardcoded German+English via ParDe/ParEn helpers, no locale branching anywhere in the file) is identical regardless of URL locale. Verified messages/fr.json:4057 and messages/it.json:4039 already contain a 'legal' key tree with fr/it strings, proving fr/it legal-text infrastructure exists and is simply unused here. A user on /fr/terms or /it/terms gets German+English only.
    - fix: Either migrate TermsContent.tsx/PrivacyContent.tsx to next-intl with full fr/it message trees, or make DE+EN-only an explicit product decision and stop presenting /fr/terms, /it/terms as localized (e.g. redirect with a visible language notice) rather than silently rendering German/English to French/Italian users.

**States + accessibility**

- **MEDIUM** `[code]` `app/[locale]/help/page.tsx:118` ·  net-new · confirmed
    - rule: design contract states row: loading = <Skeleton> shape-matching the final layout, not a bare spinner
    - problem: {loading ? (<div className="flex justify-center py-20"><Spinner size="lg" /></div>) : ...} renders a bare centered spinner for the entire help-article-list module load. Verified the sibling app/[locale]/help/[slug]/page.tsx:44-49 has the identical bare full-viewport Spinner pattern for the single-article fetch.
    - fix: Replace both with a <Skeleton> shaped like the final content: category-group blocks for the list page, title-bar + paragraph-line skeleton for the article page.
- **MEDIUM** `[code]` `app/[locale]/help/page.tsx:87` ·  net-new · confirmed
    - rule: design contract touch target: interactive controls >= 44px (h-11 a11y floor)
    - problem: The 'Alle' and per-category filter pills use px-3 py-1.5 with text-xs (12px font / 16px line-height + 12px vertical padding = roughly 28px tall), clearly under the 44px floor. Verified at lines 87-97 and 98-112.
    - fix: Bump the help-page filter pills to min-h-11 with vertically-centered content, keeping the small 12px text/icon but padding the hit area to reach 44px.
- **MEDIUM** `[code]` `app/[locale]/help/page.tsx:123` ·  net-new · confirmed
    - rule: design contract states row / empty states: recovery action required, never a dead end
    - problem: When search/category filtering returns zero articles, <EmptyState icon={BookOpen} title="Keine Artikel gefunden" message={...} /> is rendered with no action prop. Verified EmptyState.tsx exposes an optional action?: React.ReactNode prop that is simply not passed here, leaving no way back to the full article list when a search/category filter zeroes out results.
    - fix: Pass an action that clears the active filter/search (e.g. an 'Alle Artikel anzeigen' button calling setSearch(""); setActiveCategory(null)).

**Copy economy + i18n**

- **MEDIUM** `[code]` `app/[locale]/terms/components/TermsContent.tsx:200` ·  net-new · confirmed
    - rule: taste rule 10: no em-dashes anywhere in UI copy, metadata, or rendered code
    - problem: Em-dashes verified in visible rendered body copy at lines 200-203 and 270-274 (e.g. <strong>Verwarnung</strong> — schriftliche Benachrichtigung...), in © {new Date().getFullYear()} solen.ch — Basel, Switzerland (terms/discovery/page.tsx:33), and in every page <title> metadata across the surface: terms/page.tsx:8, privacy/page.tsx:8, impressum/page.tsx:4, sicherheit/page.tsx:5, kontakt/page.tsx:5, karriere/page.tsx:4, presse/page.tsx:4, ueber-uns/page.tsx:5, blog/page.tsx:5 - all verified present verbatim.
    - fix: Replace every em-dash with a colon, comma, or parenthesis: e.g. 'Verwarnung: schriftliche Benachrichtigung...', '© 2026 solen.ch, Basel, Switzerland', and 'Impressum | Solen' for titles.

**Icons**

- **HIGH** `[code]` `app/[locale]/coming-soon/page.tsx:24` ·  net-new · confirmed
    - rule: feedback_icon_rules: never use the Lucide Sparkles or Star glyph as a decorative/filler/fallback icon, anywhere
    - problem: const meta = FEATURE_MAP[feature] ?? { Icon: Sparkles }; uses Sparkles as the generic fallback glyph for any unrecognized feature. Star is used decoratively as the loyalty-feature icon in FEATURE_MAP (line 14), and Sparkles appears again as filler next to the success copy: <Sparkles size={16} />{t("notifySuccess")} (line 96). All three verified present in the file exactly as described.
    - fix: Replace the Sparkles fallback with a context icon (e.g. Clock) or no icon. Replace the loyalty Star icon with a non-star glyph (e.g. Award or Crown). Drop the Sparkles next to notifySuccess and use a CheckCircle pattern instead.


### Business / fuer-salons / partner  `business-marketing`

*5 files read · 15 findings (4 high) · 0 mockup-class · prior psych coverage: none (new coverage)*

**Fabricated data (no-fabrication law)**

- **HIGH** `[code]` `app/[locale]/business/page.tsx:241` ·  net-new · confirmed
    - rule: PSYCHOLOGY.md law 9 (real numbers only) / CLAUDE.md taste rule 1 (no fabricated data)
    - problem: The trust strip (lines 233-243) renders '1'200+ Schweizer Salons' and '4.9 · 1'200+ Partner' as static hardcoded JSX literals with no server-side aggregate behind them: a specific numeric average rating (4.9) and repeated counts presented as fact with no live source.
    - fix: Wire these numbers to a real server-computed aggregate (active salon count, Bayesian-weighted average rating) passed into the page, or drop the specific figures for qualitative copy until a live source exists.
- **HIGH** `[code]` `app/[locale]/fuer-salons/page.tsx:261` ·  net-new · confirmed
    - rule: PSYCHOLOGY.md law 9 (real numbers only) / CLAUDE.md taste rule 1 (no fabricated data)
    - problem: Same duplicated fabricated-stat block: '1'200+ Schweizer Salons' (lines 253-254) and '4.9 · 1'200+ Partner' (lines 259-263) hardcoded as static JSX, unwired to any live source, on the page documented as the canonical successor to /business.
    - fix: Wire to a real live aggregate or soften to unquantified copy until one exists.

**Design contract**

- **MEDIUM** `[code]` `app/[locale]/business/page.tsx:236` ·  net-new · confirmed
    - rule: CLAUDE.md taste rule 2 (no decorative artifacts, no separator/status dots) + LOCKFILE.md line 25
    - problem: Two purely decorative circular dot spans separate trust-strip items: `<span aria-hidden className="h-1 w-1 rounded-full bg-s-ink-3" />` at lines 236 and 238, between the salon count, the city list, and the star rating. Whitespace/gap already separates the flex items; the dots add no information.
    - fix: Delete both decorative dot spans; rely on the existing gap between flex items.
- **MEDIUM** `[code]` `app/[locale]/fuer-salons/page.tsx:256` ·  net-new · confirmed
    - rule: CLAUDE.md taste rule 2 (no decorative artifacts, no separator/status dots) + LOCKFILE.md line 25
    - problem: Same two decorative dot spans duplicated from /business at lines 256 and 258 (`<span aria-hidden className="h-1 w-1 rounded-full bg-s-ink-3" />`).
    - fix: Delete both dot spans on this page too.
- **MEDIUM** `[code]` `app/[locale]/business/page.tsx:297` ·  net-new · confirmed
    - rule: LOCKFILE.md §1.5 link-color rule: tertiary under-CTA links / See-all links stay ink with affordance; only inline-prose links stay blue
    - problem: The marketplace section's standalone arrow link is still blue: `className="mt-6 inline-flex items-center gap-1 font-body text-[14px] font-semibold text-s-accent transition-colors duration-150 ease-glide hover:text-s-accent-deep"`. fuer-salons/page.tsx:307 already fixed the identical element to `text-s-ink underline underline-offset-2 hover:text-s-ink-2` with an explicit code comment ("Link text-s-accent → text-s-ink underline per §1.5"), proving this is known-fixed drift /business never received.
    - fix: Apply the same fix already shipped in fuer-salons.tsx: swap `text-s-accent ... hover:text-s-accent-deep` to `text-s-ink underline underline-offset-2 hover:text-s-ink-2`.
- **MEDIUM** `[code]` `app/[locale]/partner/page.tsx:47` ·  net-new · confirmed
    - rule: LOCKFILE.md §2.5 Eyebrow role recipe: 11-12px / 600 (semibold) / uppercase / 0.08em tracking, already the canonical value implemented in fuer-salons.tsx and warum-solen.tsx
    - problem: Every eyebrow label on this page still uses the pre-sweep recipe `font-bold uppercase tracking-[0.16em]` at lines 47, 61, 98, 130, 163, 251, 286, 403, 485 (9 occurrences verified), instead of the canonical `font-semibold uppercase tracking-[0.08em]` that fuer-salons.tsx explicitly documents as the fix (line 213: `font-semibold uppercase tracking-[0.08em]`, comment "Tracking 0.16 → 0.08 canonical"). /partner never received the same eyebrow-tracking sweep its sibling B2B pages did.
    - fix: Sweep all 9 eyebrow instances from `font-bold uppercase tracking-[0.16em]` to `font-semibold uppercase tracking-[0.08em]`, matching the already-shipped fix in fuer-salons.tsx.
- **MEDIUM** `[code]` `app/[locale]/fuer-salons/page.tsx:341` ·  net-new · confirmed
    - rule: LOCKFILE.md §1.5 (decorative text-s-accent tint on a non-interactive icon is forbidden) — already correctly implemented as text-s-ink in the source this section was ported from
    - problem: The v2-flagged Categories grid renders `<cat.icon className="w-6 h-6 text-s-accent mb-3" />` on a non-interactive info card (no href/onClick) at line 341, and the v2 Social Proof trust-badge block does the same at line 421. Both sections are documented as ported directly from /partner, but the source (partner/page.tsx:150 and :271, verified) correctly uses `text-s-ink` on these same decorative icons — the port introduced a blue-on-non-interactive-icon regression.
    - fix: Change both text-s-accent occurrences back to text-s-ink, matching partner/page.tsx:150 and :271.
- **LOW** `[code]` `app/[locale]/partner/page.tsx:389` ·  net-new · confirmed
    - rule: CLAUDE.md taste rule 6 ("inline status chips/badges = pastel .bg + ink text + saturated icon", not saturated-colored body text)
    - problem: The pricing-comparison savings callout renders its entire message in saturated s-success (#16A34A) text on a pale s-success-bg background with no icon at all (lines 388-393, verified): `<p className="text-sm font-body text-s-success">`. The locked pastel-chip recipe is pastel bg + ink text + a saturated icon carrying the color, not colored body copy.
    - fix: Switch the paragraph text to text-s-ink and add a small saturated-green Lucide icon (e.g. CheckCircle) next to it, so only the icon carries the color.

**Consistency / drift**

- **MEDIUM** `[code]` `app/[locale]/business/page.tsx:240` ·  net-new · confirmed
    - rule: Consistency canonical: "star = s-star token (not raw fill=#FFC32B)" (CONSISTENCY_AUDIT.md)
    - problem: `<Star size={12} fill="#FFC32B" stroke="none" aria-hidden />` uses a raw hex literal instead of the locked s-star token (tailwind.config.js:199, "s-star": "#FFC32B"). warum-solen/page.tsx:131 correctly uses `fill-s-star text-s-star`, proving the token is the established pattern this file skipped.
    - fix: Replace `fill="#FFC32B"` with `className="fill-s-star"`, dropping the inline fill prop.
- **MEDIUM** `[code]` `app/[locale]/fuer-salons/page.tsx:260` ·  net-new · confirmed
    - rule: Consistency canonical: "star = s-star token (not raw fill=#FFC32B)"
    - problem: Same raw-hex star duplicated at line 260 (`<Star size={12} fill="#FFC32B" stroke="none" aria-hidden />`) on the page meant to supersede /business.
    - fix: Same token swap: `className="fill-s-star"`.
- **MEDIUM** `[code]` `app/[locale]/fuer-salons/page.tsx:216` ·  net-new · confirmed
    - rule: LOCKFILE.md §2.5 Type Role Registry — content-page Hero H1 desktop scale-up, already used by warum-solen.tsx:201 and partner.tsx:50
    - problem: fuer-salons.tsx:216 is missing `md:text-[46px]` on the H1: `text-[clamp(26px,7vw,30px)] font-bold leading-[1.1] tracking-[-0.02em]` caps at 30px on desktop, while sibling B2B/content pages partner.tsx:50 and warum-solen.tsx:201 both add `md:text-[46px]` for the identical semantic role. Note: partner.tsx and warum-solen.tsx themselves disagree on weight/leading/tracking (semibold/1.0/-0.03em vs bold/1.1/-0.02em), so there isn't one fully-locked recipe across all four pages, but fuer-salons.tsx already matched weight/leading/tracking to warum-solen's values and only omitted the desktop size bump, which reads as an oversight rather than a deliberate variant.
    - fix: Add `md:text-[46px]` to the H1 className on fuer-salons.tsx:216 (and business.tsx:194 if that page stays live), matching partner.tsx:50 and warum-solen.tsx:201.
- **LOW** `[code]` `app/[locale]/partner/page.tsx:110` ·  net-new · confirmed
    - rule: Design contract radius row: "card/block 16 (rounded-card) ... arbitrary rounded-[13px]/[12px]/[18px]/[22px] = drift"
    - problem: Arbitrary non-token corner radii scattered across the page instead of the locked rounded-card (16px) token: rounded-[12px] (lines 75, 85, 388), rounded-[14px] (lines 110, 149, 270), rounded-[18px] (line 299), rounded-[16px] (line 336), rounded-[10px] (line 116) — all verified present at these exact lines.
    - fix: Replace each arbitrary rounded-[Npx] with the rounded-card token (or rounded-btn/rounded-pill where the element is a button/chip).

**Copy economy + i18n**

- **HIGH** `[code]` `app/[locale]/business/page.tsx:95` ·  net-new · confirmed
    - rule: Project i18n law (CLAUDE.md header: "i18n: de / en / fr / it") — every rendered surface must localize, not just <head> metadata
    - problem: STEPS, PRICING_CHECKS and FAQS are hardcoded German-only module-level constants (lines 95-148), and the trust-strip text (lines 233-243) is also static German JSX. BusinessPage() takes no params/locale, only generateMetadata branches by locale, so an EN/FR/IT visitor gets a translated <title> but all visible body copy stays German.
    - fix: Move STEPS/PRICING_CHECKS/FAQS/trust-strip strings into next-intl message catalogs and render via getTranslations/useTranslations keyed by the route's actual locale, mirroring the working pattern in app/[locale]/partner/page.tsx (useTranslations("partner")).
- **HIGH** `[code]` `app/[locale]/fuer-salons/page.tsx:119` ·  net-new · confirmed
    - rule: Project i18n law (CLAUDE.md header: "i18n: de / en / fr / it") — every rendered surface must localize, not just <head> metadata
    - problem: Identical defect to /business: STEPS/PRICING_CHECKS/FAQS (lines 119-172) and the trust strip (lines 253-263) are hardcoded German literals with no locale branching. FuerSalonsPage() destructures only searchParams, never locale/params, so body content stays German for every locale even though this file already calls getTranslations("partner") for its v2-flagged sections, proving the plumbing exists but wasn't used for V1 core content.
    - fix: Migrate STEPS/PRICING_CHECKS/FAQS/trust-strip into message keys and render through the existing getTranslations call already present in this file.

**Icons**

- **LOW** `[code]` `app/[locale]/partner/page.tsx:459` ·  net-new · confirmed
    - rule: CLAUDE.md taste rule 8 / consistency canonical: real Lucide icons only, no hand-drawn or unicode glyphs standing in for icons
    - problem: The sticky bottom CTA renders only `{t("sticky_cta")}` with no icon element (lines 454-460), but the underlying translation string (messages/de.json:4236, messages/en.json:4226, verified) is "Kostenlos starten →" / "Get started free →" — a unicode arrow baked into the copy string instead of a Lucide icon, unlike fuer-salons.tsx:230 and warum-solen.tsx:424, both of which render a real `<ArrowRight>` component (verified) next to the label.
    - fix: Strip the trailing arrow from the translation strings and add `<ArrowRight size={16} strokeWidth={2.5} aria-hidden />` as a sibling element next to {t("sticky_cta")}.


### Checkout / payment / confirmation  `pay-confirm`

*10 files read · 11 findings (1 high) · 1 mockup-class · prior psych coverage: pay + confirmation*

**Design contract**

- **HIGH** `[code]` `app/[locale]/checkout/page.tsx:87` ·  net-new · confirmed
    - rule: Taste rule 4 (semantic colour independent of accent: error = red s-error, never blue/green) applied to a payment-failure message
    - problem: Error box (payment failed) is styled with text-s-accent (blue) text/icon on a dark-green rgba(27,77,27,.06) background instead of s-error/s-error-bg tokens. Same pattern recurs at promo error (555-561), voucher error (627-633), and at-salon confirm error (672-677).
    - fix: Swap text-s-accent / border-s-accent/20 / the green rgba background for text-s-error / bg-s-error-bg / border-s-error/20 on all four error blocks (lines 87-93, 555-561, 627-633, 672-677).
- **MEDIUM** `[code]` `app/[locale]/checkout/page.tsx:707` ·  net-new · confirmed
    - rule: Taste rule 8 (fonts: Inter Tight + Inter + JetBrains Mono, never another family) / no raw arbitrary hex outside tokens
    - problem: Stripe Elements appearance object uses retired coral-palette hex (colorPrimary #C05038, colorDanger #A32D2D) and DM Sans font (lines 707-710), not the locked ink/#0A0A0A, s-error/#DC2626, and Inter used correctly in components-legacy/booking/BookingPaymentForm.tsx:227-233. Note: an inline comment at line 690 warns "DO NOT touch Elements/appearance" so this may be an intentional legacy freeze; still a real drift from current tokens.
    - fix: Match BookingPaymentForm.tsx's appearance object: colorPrimary #0A0A0A, colorDanger #DC2626, fontFamily 'Inter', load the same Inter Google Fonts cssSrc into Elements.
- **MEDIUM** `[code]` `app/[locale]/checkout/page.tsx:99` ·  net-new · confirmed
    - rule: Design contract text size: CTA 15px, never below 14 on a button
    - problem: Primary "Jetzt buchen" CTA renders at text-[11px] uppercase (line 99), well under the 14px floor. Same text-[11px] pattern recurs on the promo Anwenden button (549), voucher Anwenden button (621), and at-salon confirm button (683).
    - fix: Bump these four CTA classNames from text-[11px] to text-[15px] and drop the uppercase/tracking treatment per copy rule 5.
- **MEDIUM** `[code]` `app/[locale]/booking-action/page.tsx:59` ·  net-new · confirmed
    - rule: Design contract states (componentized states, use them, do not hand-roll) + taste rule 4 (never monochrome a semantic element to ink)
    - problem: The "confirmed" success icon is hand-rolled: <div className="w-14 h-14 rounded-full ... bg-s-ink/10"><Check size={24} className="text-s-success" /></div> (lines 58-61). Disc is grey ink-tint, check is green-on-grey, not the locked solid-green-disc + white-check. The correct <SuccessMark> primitive (app/[locale]/_components/primitives/SuccessMark.tsx: solid bg-s-success disc + white check) is already used correctly at components-legacy/booking/BookingConfirmation.tsx:166.
    - fix: Replace the hand-rolled div with <SuccessMark size={56} /> from app/[locale]/_components/primitives/SuccessMark.tsx.
- **MEDIUM** `[code]` `app/[locale]/booking-action/page.tsx:51` ·  net-new · confirmed
    - rule: Taste rule 4: error = red (s-error), warning != error
    - problem: The genuine error branch (missing token/id params, quick-action API failure, network failure) uses bg-s-warning-bg / text-s-warning with an AlertTriangle icon (lines 51-53), not the red error tokens, even though these are real failures (invalid/expired link, failed confirm/cancel).
    - fix: Swap bg-s-warning-bg/text-s-warning for bg-s-error-bg/text-s-error on this branch.

**Consistency / drift**

- **LOW** `[code]` `components-legacy/booking/PayConfirmStep.tsx:514` ·  net-new · confirmed
    - rule: Design contract radius: card/block 16 (rounded-card) / input 16 (rounded-input); no phantom rounded-[12px]
    - problem: Payment-method selector cards use rounded-[12px] (line 514, and again 531 for in-person option, 548 for deposit summary, 570 for prepay summary), while the same file correctly uses rounded-input at lines 435, 452, 483, 612, and the salon-avatar thumbnail at lines 327/330 uses rounded-[12px] too, all confirmed present verbatim.
    - fix: Replace rounded-[12px] with rounded-input (or rounded-card) on all payment-card blocks so the file uses one consistent radius token.
- **LOW** `[code]` `components-legacy/booking/BookingConfirmation.tsx:277` ·  net-new · confirmed
    - rule: Consistency canonical: radius tokens only, no phantom rounded-[9px]/[11px]/[12px]
    - problem: Three different arbitrary radii on this screen with no matching locked token: salon avatar thumbnail rounded-[11px] (lines 191, 195), access-link input box rounded-[12px] (line 277), copy button rounded-[9px] (line 287). All confirmed present verbatim.
    - fix: Standardize all three to rounded-input (16) to match the rest of the design-system radius scale.

**States + accessibility**

- **MEDIUM** `[code]` `app/[locale]/tip/[bookingId]/page.tsx:26` ·  net-new · confirmed
    - rule: Design contract states: error = <ErrorState> (inline); a failed data fetch must not silently render a broken form
    - problem: fetch(...).then((d) => setBooking(d.booking ?? d)).catch((err) => console.error(...)).finally(() => setLoading(false)) has no not-found/error guard (lines 24-29). If the booking fetch 404s or throws, booking stays null but the component still falls through past the loading check (line 36) to render <TipSheet> (line 55) with the generic "Stylist" fallback and no context line, no error message shown anywhere.
    - fix: Track a notFound/loadError boolean and render an <ErrorState> instead of <TipSheet> when the fetch fails or booking is null.
- **MEDIUM** `[code]` `components-legacy/booking/PayConfirmStep.tsx:360` ·  net-new · confirmed
    - rule: Design contract touch target: interactive controls >= 44px (h-11)
    - problem: The "Ändern" (change) links are bare text buttons with no padding: <button type="button" onClick={() => goToStep('services-staff')} className="shrink-0 text-[13px] font-semibold text-s-accent">{tp('changeLabel')}</button>. Confirmed recurring at line 378 (services), line 394 (date/time), and lines 442-448 (contactChange) - all identically unpadded 13px text with no min-height wrapper.
    - fix: Wrap each in a min-h-11 flex items-center (or add py-3 -my-3) so the visible text stays 13px but the tap target reaches 44px.
- **LOW** `[mockup]` `app/[locale]/booking-action/page.tsx:48` ·  net-new · confirmed
    - rule: Design contract states: loading = <Skeleton> shape-matching the final layout, not a bare spinner
    - problem: The single-record loading state is a bare centered spinner: {loading ? (<div className="py-12"><Spinner size="lg" /></div>) : ...} with no layout-matching Skeleton.
    - fix: Swap the bare Spinner for a Skeleton shaped like the icon-disc + heading + body-line card that follows.

**Copy economy + i18n**

- **MEDIUM** `[code]` `app/[locale]/tip/[bookingId]/page.tsx:45` ·  net-new · confirmed
    - rule: Project i18n law (de/en/fr/it); copy must run through next-intl, never a hardcoded literal in one language
    - problem: The staff-name fallback is a hardcoded English literal regardless of locale: const staffName = booking?.staff_name ?? booking?.staff_member_name ?? booking?.staff?.name ?? "Stylist";. A de/fr/it user whose booking is missing staff data sees the literal English word "Stylist" in an otherwise localized tip sheet. Note: this page has no useTranslations call currently wired at all, so the fix needs a new hook call, not just a key swap.
    - fix: Route the fallback through useTranslations with a per-locale key (e.g. tp('genericStaffFallback')) instead of the bare string "Stylist".


---

## Mockup queue (21 visual findings needing owner approval)

Built as real-page copies with only the proposed treatment changed. Sequential, high first.

| # | surface | severity | file:line | what changes |
|---:|---|---|---|---|
| 1 | auth-onboarding | HIGH | `app/[locale]/staff-invite/page.tsx:101` | Add a tappable recovery action in the error branch: link to login for the auth-required redirect case, otherwise link home or to a contact-salon path. |
| 2 | category-landings | HIGH | `app/[locale]/behandlungen/[...slug]/page.tsx:7` | Swap the import in both files to the photo-first app/[locale]/_components/homepage/SalonCard, matching the FavoritesList precedent fix. |
| 3 | inspo | HIGH | `components-legacy/discovery/ProfileSetupModal.tsx:111` | Swap every uppercase-tracked label/pill/CTA in these three files to normal-case 13-15px semibold; bump ProfileSetupModal.tsx's commit button to the lo |
| 4 | loyalty-rewards | HIGH | `app/[locale]/referral/[code]/page.tsx:36` | Add a visible 'Bleiben' / 'Stay here' control that calls clearInterval, and wrap the countdown text in aria-live="polite" so assistive tech announces  |
| 5 | search | HIGH | `app/[locale]/_components/search/SearchOverlay.tsx:769` | Replace the hand-rolled date step (MonthGrid + flex-date chips + period chips) with the shared DateTimePicker primitive in calendar mode, the same int |
| 6 | auth-onboarding | MEDIUM | `app/[locale]/onboarding/salon/page.tsx:83` | Replace tracked-uppercase labels with normal-case 13px semibold across the file, and bump the nav buttons to at least 14px (target 15px) non-tracked t |
| 7 | category-landings | MEDIUM | `app/[locale]/brand/[slug]/page.tsx:46` | Replace both bare Spinners with a Skeleton-composed layout matching the final render. |
| 8 | category-landings | MEDIUM | `app/[locale]/coiffeur/loading.tsx:7` | Rebuild both loading.tsx files to match SearchTemplate's real shape (search-bar skeleton, filter-pill row, result-count line, card grid); drop hero-ba |
| 9 | loyalty-rewards | MEDIUM | `app/[locale]/referral/[code]/page.tsx:60` | Remove the .ambient-v5 div (or swap to a neutral/cool wash with no amber component) so legacy pre-pivot styling doesn't reintroduce warmth on a live r |
| 10 | pdp | MEDIUM | `components-legacy/staff/StaffProfilePage.tsx:167` | Replace both bare spinners with a <Skeleton> shaped like the final layout. |
| 11 | pdp | MEDIUM | `app/[locale]/_components/salon/SalonTeam.tsx:119` | Extract one shared SeeAllButton/SecondaryPill primitive and use it at every call site. |
| 12 | pdp | MEDIUM | `components-legacy/salon/SalonReviews.tsx:1` | Unify shared primitives (avatar treatment, empty-state, truncation copy, anonymous fallback) across both surfaces; route through design review before  |
| 13 | pdp | MEDIUM | `app/[locale]/salon/[slug]/barber/[barberSlug]/page.tsx:169` | Swap the barber-page specialties icon for Scissors (already imported/used on the page); swap SalonAdditionalInfo's amenity icon for a distinct glyph ( |
| 14 | pdp | MEDIUM | `app/[locale]/_components/salon/SalonAbout.tsx:35` | Add the same line-clamp-3 + inline text-s-accent 'Mehr lesen' expand-in-place pattern used for review comments. |
| 15 | profile | MEDIUM | `app/[locale]/profile/intake-forms/page.tsx:59` | Render 2-3 skeleton rows shaped like the template-grouped form cards while loading is true. |
| 16 | profile | MEDIUM | `app/[locale]/profile/settings/BeautyProfileForm.tsx:108` | Give selected cards a bg-s-bg-sunken fill in place of the ink border + inset shadow; keep the check badge but confirm with the owner whether the ink c |
| 17 | reviews-lookup-notif | MEDIUM | `app/[locale]/recently-viewed/RecentlyViewedClient.tsx:77` | Replace with 3-4 Skeleton rows shaped like the real row (56px photo disc + two text lines). |
| 18 | walkin-queue | MEDIUM | `app/[locale]/queue/[token]/page.tsx:140` | Replace window.confirm with the design system's Modal primitive, framed with the actual refund/release consequence copy (cancelledRefunded/cancelledRe |
| 19 | pay-confirm | LOW | `app/[locale]/booking-action/page.tsx:48` | Swap the bare Spinner for a Skeleton shaped like the icon-disc + heading + body-line card that follows. |
| 20 | pdp | LOW | `app/[locale]/_components/primitives/Avatar.tsx:85` | Add an optional count to the Avatar badge prop and render it in parentheses when available, or drop the badge when a count isn't known. |
| 21 | walkin-queue | LOW | `app/[locale]/walk-in-tip/[token]/page.tsx:41` | Swap for a skeleton shaped like the TipSheet's recipient-row + amount-grid (single-record fetch, so this stays low priority). |

---

## Coverage

WAVE 1 (customer) and WAVE 2 (dashboard + /dev triage) are both complete. The whole frontend estate is now audited.

---

# WAVE 2 , dashboard (owner + admin) surfaces and /dev route triage

**Method.** 7 dashboard buckets + 1 `/dev` triage bucket. Same law stack, same audit-then-adversarial-verify structure. 16 agents, 0 errors, 111 files read. Workflow `wf_732cda98-10e`.

**Tally.** 89 raw findings, **5 dropped by the verifier**, 84 confirmed , 34 high, 38 medium, 12 low. Fix class: 83 code, 1 mockup.

The hardened verifier prompt worked: WAVE 2 dropped 5 findings where WAVE 1 dropped 0. Yield is now visible rather than hidden.

**Psychology laws barely bind here** (owner-facing surface, little customer-derived data), which is why `fabrication`, `states-a11y` and `design-system` dominate instead.

| dimension | findings |
|---|---:|
| States + accessibility | 22 |
| Design contract | 20 |
| Consistency / drift | 17 |
| Fabricated data / dead controls | 11 |
| Copy economy + i18n | 9 |
| Icons | 3 |
| Motion | 1 |
| Dead route | 1 |

## Dashboard, surface by surface

### Dashboard money (earnings, revenue, analytics, commission, refunds, upcharge)  `dash-money`

*12 files read · 11 findings (7 high) · 1 dropped by verifier*

**Fabricated data / dead controls**

- **HIGH** `[code]` `app/[locale]/dashboard/revenue/page.tsx:133` · confirmed
    - rule: A visual encoding meant to reflect real data must actually vary with it; a conditional that always resolves to the same output is a dead control.
    - problem: Verified verbatim: `color: data.growth_percent >= 0 ? "text-s-coral" : "text-s-coral", bg: data.growth_percent >= 0 ? "bg-s-coral/5" : "bg-s-coral/5"` at lines 133-134. Both ternary branches are identical strings, so the growth KPI card's color never differentiates positive from negative growth; only the +/- sign in the text carries the real signal.
    - fix: Give the two branches distinct classes, e.g. data.growth_percent >= 0 ? "text-s-success" : "text-s-error".
- **HIGH** `[code]` `app/[locale]/dashboard/commission-admin/page.tsx:32` · confirmed
    - rule: No fabricated data: a value must be wired to a live source, not silently substituted by an unlabeled default on a failed fetch (CLAUDE.md rule 1).
    - problem: Verified: rate/loadedRate both seed at 15 (line 32-33). The fetch at line 38 only checks r.ok to throw, and the .catch at line 48 just console.errors with no error state set. loading still flips to false via .finally, so the form renders the stale 15% default with zero error banner. Because dirty = rate !== loadedRate (line 52) and both stay at the unchanged default, the admin could edit the rate off a false baseline and PUT a new platform-wide commission (line 60-64) with no optimistic-concurrency check against the real live value. This is the single most sensitive control in the bucket.
    - fix: On fetch failure, set an explicit error flag and render the locked ErrorState component instead of the form, so the admin can never act on an unloaded default.

**Design contract**

- **HIGH** `[code]` `app/[locale]/dashboard/revenue/page.tsx:71` · confirmed
    - rule: Selected/active state must be calm gray fill, NEVER black/ink fill (gate no-black-selected, LOCKFILE §1215 / CLAUDE.md design contract).
    - problem: The period picker's selected branch is `period === p ? "bg-s-coral text-white" : "text-s-ink-2 hover:text-s-ink"`. tailwind.config.js:81 aliases s-coral to `#0A0A0A` (pure ink), so the selected week/month/year pill is a solid black fill with white text, exactly the pattern the no-black-selected gate exists to block. The gate itself (.claude/hooks/no-black-selected-gate.py) matches on literal `bg-s-ink`, not the `s-coral` alias, so it silently escapes the gate. LOCKFILE §12.4 only exempts dashboard files from A9/accent-restriction, not from the selected-state contract, and this control is none of the three named exceptions (commit button, booking date/slot, avatar check-badge).
    - fix: Swap the selected branch to bg-s-accent-bright text-white (verified this matches DashButton's primary variant at DashboardUI.tsx:233) or the calm-gray TabPill treatment, and drop the s-coral alias from this callsite.
- **HIGH** `[code]` `app/[locale]/dashboard/earnings/page.tsx:108` · confirmed
    - rule: LOCKFILE §12.4: dashboard files are exempt from A9 but explicitly NOT exempt from A5 (RETIRED tokens like s-coral).
    - problem: Verified every cited line: earnings.tsx 108-109 (Wallet badge), 161 (fee text), 172 (invoice link icon+hover), 194 (Users icon), 220 (avatar circle), 228 (staff share text) all use s-coral/text-s-coral, which resolves to flat ink #0A0A0A per tailwind.config.js:81. Same pattern verified in revenue.tsx (KPI cards lines 98-134, top-salons badge 218, staff-commission cell 257, gift-card/tips icons 272-284) and platform-analytics.tsx (StatCard props lines 112/114/115/124). Every one of these was meant to carry a distinct accent color and instead renders muddy black, contradicting §12.2's vibrant-skin requirement.
    - fix: Bulk-replace s-coral with the intended token per role: s-accent-bright (#276EF1) for primary/active accents, s-success/s-warning/s-error for semantic amounts.
- **HIGH** `[code]` `app/[locale]/dashboard/revenue/page.tsx:159` · confirmed
    - rule: Locked chart palette (V3-D204/D421), documented verbatim in this codebase's own sibling file.
    - problem: Verified: stopColor="#1B4D1B" at 159-160, stroke="#1B4D1B" at line 186, activeDot fill="#1B4D1B" at line 190. Verified analytics/page.tsx carries the exact code comment at line 40: 'Locked chart palette (V3-D204/D421): primary series = accent-bright #276EF1 ... Replaces the old dark-green (#1B4D1B) + amber (#F3A864) hexes,' with ACCENT="#276EF1" defined at line 43. revenue.tsx renders the exact hex its own sibling file documents as retired.
    - fix: Replace #1B4D1B with the locked #276EF1 accent (and #EAEFFE pale for any comparison series), matching analytics.tsx's ACCENT/ACCENT_PALE constants.

**Consistency / drift**

- **MEDIUM** `[code]` `app/[locale]/dashboard/earnings/page.tsx:107` · confirmed
    - rule: LOCKFILE §12.3: 'Dashboard cards/panels = rounded-card-lg (20px) ... Softer than the customer-site 16px.'
    - problem: Verified LOCKFILE §12.3 wording matches the finding's quote exactly, and tailwind.config.js:249 defines card-lg as 20px. Verified rounded-[12px] at earnings.tsx lines 107, 118, 130, 192, and at revenue.tsx lines 140/153/199/234/271/282 and platform-analytics.tsx lines 65/122 (arbitrary value, matching neither 16px nor 20px). Verified the canonical DashPanel/DashStatCard/DashQuickAction primitives in DashboardUI.tsx (lines 99, 136, 195) already use rounded-card-lg for the identical card role, so a reusable canonical exists and is bypassed by hand-rolled markup.
    - fix: Swap every rounded-[12px] card wrapper for rounded-card-lg, or replace the hand-rolled card markup with the existing DashPanel/DashStatCard primitives.

**States + accessibility**

- **HIGH** `[code]` `app/[locale]/dashboard/earnings/page.tsx:101` · confirmed
    - rule: Loading = <Skeleton> (shape matches final layout), NOT a bare spinner (LOCKED design contract table; COMPONENT_REGISTRY.md Skeleton entry).
    - problem: Verified all 7 cited spinners exist exactly as claimed: earnings.tsx:101, revenue.tsx:81, analytics.tsx:174, platform-analytics.tsx:107 (all identical `<div className="flex justify-center py-..."><Spinner size="lg" /></div>`), commission-admin.tsx:85-88 (`<Loader2 ... className="animate-spin" />`), refunds.tsx:180 and upcharge.tsx:187 (both bare `<Spinner />`). None import Skeleton/SkeletonCard, which the registry defines specifically for shape-matched loading placeholders.
    - fix: Replace each bare spinner with <Skeleton> blocks shaped like the page's KPI-card grid + table rows.
- **HIGH** `[code]` `app/[locale]/dashboard/platform-analytics/page.tsx:93` · confirmed
    - rule: Error uses ErrorState (inline); a failed fetch must never be visually indistinguishable from genuine empty data (COMPONENT_REGISTRY.md ErrorState entry).
    - problem: Verified verbatim: `.catch(() => setStats(null)).finally(() => setLoading(false))` at line 93, then StatCard renders unconditionally with `stats?.total_salons ?? 0` etc at lines 112-116. A failed API call renders identically to a genuinely-zeroed marketplace, no error banner, no retry. Same root pattern verified present in earnings.tsx, revenue.tsx and analytics.tsx (all swallow the fetch error and fall through to a no-data or zero-filled success UI); none of these four pages render ErrorState.
    - fix: Track a separate error boolean per page (as refunds.tsx and upcharge.tsx already do) and render the locked ErrorState with a retry action instead of falling through to a zero-filled UI.
- **MEDIUM** `[code]` `app/[locale]/dashboard/earnings/page.tsx:168` · confirmed
    - rule: Interactive controls must be at least 44px (h-11), the a11y touch-target floor (LOCKED design contract table).
    - problem: Verified: the invoice-download `<a>` at lines 168-176 is `p-2` (8px) padding around a 16px FileText icon, ~32px tap target. Verified the same under-44px pattern in revenue.tsx's period-picker buttons (px-3 py-1.5 text-xs, lines 66-76) and analytics.tsx's compare toggle (px-3 py-1.5, ~line 151) and tab buttons (px-3 py-2, ~line 166). Verified by contrast that refunds.tsx and upcharge.tsx correctly wrap actionable controls in min-h-[44px] (e.g. refunds.tsx:234/240/244/252, upcharge.tsx:162/208/272), proving the law is known and applied inconsistently within this same bucket.
    - fix: Bump each control's padding/height to meet h-11/44px, matching the min-h-[44px] convention already used in refunds.tsx and upcharge.tsx.

**Copy economy + i18n**

- **MEDIUM** `[code]` `app/[locale]/dashboard/earnings/page.tsx:153` · confirmed
    - rule: i18n: user-facing strings/formats must go through the active locale, not be hardcoded to one language (project is de/en/fr/it).
    - problem: Verified verbatim: `new Date(p.created_at).toLocaleDateString("de-CH")` at line 153, while `locale` from useLocale() is already in scope and correctly threaded into formatCurrency(p.gross_amount, locale) at line 159 on the very next line. Verified the same hardcoded "de-CH" in revenue.tsx's chart formatters (lines 167, 180) and the shared fmtDate helpers in refunds.tsx (lines 50-51) and upcharge.tsx (lines 51-52). All four pages otherwise use next-intl t() and have locale in scope, so this is a real, avoidable inconsistency, not a deliberate German-only design.
    - fix: Pass the already-available locale variable into toLocaleDateString(locale, {...}) in place of the literal "de-CH" in all four files.

**Motion**

- **LOW** `[code]` `app/[locale]/dashboard/earnings/page.tsx:39` · confirmed
    - rule: Motion-22 locked vocabulary; reuse the canonical easings/variants rather than hand-rolling divergent ones per file.
    - problem: Verified earnings.tsx defines local containerVariants/itemVariants at lines 39-47 with a spring transition (stiffness 300, damping 24), while revenue.tsx (line 13) and platform-analytics.tsx (line 10) both import containerVariants/itemVariants from @/lib/animations. Verified lib/animations.ts's canonical itemVariants uses duration-based EASE_SOLEN ([0.23,1,0.32,1]), not a spring; the closest locked spring is EASE_BOUNCE (400/25), reserved for hearts/stamps. earnings.tsx's spring(300,24) is off-vocabulary and diverges from its sibling pages' reveal timing.
    - fix: Delete the local variants and import containerVariants/itemVariants from @/lib/animations, matching the other pages in this bucket.

**Dropped by the verifier** (kept for audit trail)

- `app/[locale]/dashboard/commission-admin/page.tsx` , already-correct , Focus ring finding: claims the commission-rate input's outline-none (line 112) leaves keyboard users with zero visible focus indicator becau


### Dashboard content (reviews, messages, products, bundles)  `dash-content`

*7 files read · 9 findings (6 high) · 1 dropped by verifier*

**Design contract**

- **MEDIUM** `[code]` `app/[locale]/dashboard/reviews/page.tsx:186` · confirmed
    - rule: Design contract 'focus' row: inputs get ONE global ink edge + halo set in globals.css; 'primitives add NO extra outline (V3-D449 — no double ring)'; convention explicitly documented + followed in bundles/page.tsx:20-22 ('Inputs: NO per-input focus override')
    - problem: Both textareas manually add a per-input focus override instead of inheriting the global recipe: `focus:outline-none focus:border-s-ink resize-none` (reply textarea, line 186) and `focus:outline-none focus:border-s-error resize-none` (flag textarea, line 229). CORRECTION to the auditor's mechanism: checked app/globals.css:367-377 — the global rule targets `textarea:focus-visible` and sets outline:none + border-color:#0A0A0A + box-shadow halo; the Tailwind `focus:` utilities here target `:focus` (higher specificity on border-color only) but never touch box-shadow, so the halo is likely NOT actually stripped visually. The real defect is that this is a redundant, inconsistent per-input override of a convention the codebase documents and follows elsewhere (bundles/page.tsx's own top comment + zero-focus-class inputClass at line 70) — exactly the drift V3-D449 exists to prevent, even if the visible halo survives today.
    - fix: Remove focus:outline-none focus:border-s-ink / focus:border-s-error from both textareas and let the global :focus-visible recipe apply; keep the error-state red border as an unconditional (non-focus) class on the flag textarea if the red framing is still wanted.

**Consistency / drift**

- **MEDIUM** `[code]` `app/[locale]/dashboard/reviews/page.tsx:130` · confirmed
    - rule: Design contract: card shadow = shadow-elevation-2 rest / -3 hover; tailwind.config.js labels warm-* shadow aliases 'Legacy warm aliases (mapped to 3-level system)' and warm-md/warm-lg are byte-identical retired duplicates that map to neither elevation-2 nor elevation-3
    - problem: Review cards use `shadow-warm-md` (`bg-white rounded-2xl border border-s-border shadow-warm-md p-4`). Verified in tailwind.config.js:266-267: warm-md and warm-lg are both `"0 4px 12px rgba(50,47,44,0.08), 0 2px 4px rgba(50,47,44,0.04)"` (byte-identical to each other) under the explicit comment '── Legacy warm aliases (mapped to 3-level system) ──', and neither matches elevation-2 (`0 2px 8px rgba(50,47,44,0.09)`, line 278) or elevation-3 (`0 6px 16px rgba(50,47,44,0.12)`, line 279). Same pattern recurs in app/[locale]/dashboard/bundles/page.tsx:170 and :516 (shadow-warm-lg on the bundle-form and delete-confirm modals).
    - fix: Swap shadow-warm-md → shadow-elevation-2 on the review card (reviews/page.tsx:130), and shadow-warm-lg → shadow-elevation-3 on the two bundles.tsx modals (lines 170, 516).
- **MEDIUM** `[code]` `app/[locale]/dashboard/bundles/page.tsx:170` · confirmed
    - rule: CONSISTENCY_AUDIT.md §A: 'rounded-[12px] blocks → rounded-card / rounded-2xl (16); 169 uses for content blocks / option-cards / inputs' is a named, already-documented drift pattern
    - problem: The modal panel (line 170: `rounded-[12px]`) and the service-checkbox list panel (line 195: `rounded-[12px]`) use the exact arbitrary-12px content-block radius CONSISTENCY_AUDIT.md already names as drift that should be rounded-card/16. NOTE: the auditor's broader claim of 'five different arbitrary radii, none routing through the token' is overstated — the preview panel's rounded-[20px]/rounded-[24px] (lines 335, 337, 373) and the segmented-button/chip rounded-[10px] (lines 246, 294) are NOT the same drift: the 24px preview card is an intentional 1:1 copy of the real customer BundleCard (app/[locale]/_components/salon/SalonBundles.tsx:138, also rounded-[24px], grounded per the file's own top comment), and 10px is a distinct smaller control-scale radius, not a 'content block'. Only the two 12px instances are the documented drift.
    - fix: Change the two rounded-[12px] content-block containers (modal panel line 170, checkbox-list panel line 195) to rounded-card (16px) / rounded-2xl, matching the bundle-list panel's already-correct rounded-[16px] at line 560. Leave the preview panel (20/24px, grounded in the real customer card) and the 10px chip/segmented-button radius alone — they are not the same drift.

**States + accessibility**

- **HIGH** `[code]` `app/[locale]/dashboard/reviews/page.tsx:118` · confirmed
    - rule: Design contract 'states' row: loading = <Skeleton> (shape matches the final layout, NOT a bare spinner)
    - problem: Full-page loading state is a bare centered spinner: `(!salonReady || loading) ? <div className="flex justify-center py-20"><Spinner size="lg" /></div> : ...`. No shape-matched skeleton for the review-card list that is about to render.
    - fix: Replace with shape-matched <Skeleton> review-card placeholders, mirroring the pattern already used correctly in the same bucket at app/[locale]/dashboard/bundles/page.tsx:549-554 (`Array.from({length:3}).map(...) => <Skeleton key={i} height={72} rounded={16} />`).
- **HIGH** `[code]` `app/[locale]/dashboard/products/page.tsx:45` · confirmed
    - rule: Design contract 'states' row: loading = <Skeleton>, not a bare spinner
    - problem: `loading ? <div className="flex justify-center py-12"><Spinner size="lg" /></div> : ...` is the page's only loading state, no skeleton shaped like the RetailManager panel that follows.
    - fix: Swap for a <Skeleton>-based placeholder shaped like the RetailManager panel (header row + a few list rows), the same primitive bundles/page.tsx already uses correctly.
- **HIGH** `[code]` `app/[locale]/dashboard/products/page.tsx:49` · confirmed
    - rule: 'empty uses EmptyState with a real recovery action (never a dead end); error uses ErrorState' (COMPONENT_REGISTRY ErrorState/EmptyState rows)
    - problem: `!salonId ? null : <RetailManager salonId={salonId} />` — if /api/profile fails (network error, 500, non-ok response) or returns a profile with no salon_id, the page silently renders nothing below the h1: no error message, no retry. The `.catch` only logs to console; it never sets any UI-visible error flag. A real fetch failure is a dead end the owner can't recover from without a blind reload.
    - fix: Track a load-error boolean set in the .catch/`!r.ok` path and render <ErrorState> (profile/salon could not be resolved, with a retry that re-runs the /api/profile fetch) instead of null in the !salonId branch.
- **HIGH** `[code]` `app/[locale]/dashboard/reviews/page.tsx:153` · confirmed
    - rule: Design contract: touch target ≥44px (h-11), the a11y floor; icon-button wrapper canonical = h-11 w-11 (CONSISTENCY_AUDIT.md §A); aria-labels meaningful
    - problem: The flag-review icon button is `className="text-s-ink/30 hover:text-s-error p-1 transition-colors"` wrapping a 14px Flag icon — total hit area is roughly 22x22px (14px icon + 4px padding each side), well under the 44px floor. It carries only a `title` attribute at line 156, no aria-label, so screen readers get no reliable accessible name.
    - fix: Wrap the icon in an h-11 w-11 grid place-items-center hit target and add aria-label={t("flagTitle")} alongside (or instead of) title.
- **HIGH** `[code]` `app/[locale]/dashboard/bundles/page.tsx:173` · confirmed
    - rule: Design contract: touch target ≥44px (h-11); icon-button wrapper canonical = h-11 w-11
    - problem: Modal close button has no size/padding classes: `<button onClick={onClose} aria-label={t("cancel")}><X size={18} className="text-s-ink/30" /></button>` — hit area is the bare 18px icon. Same pattern on the bundle-row edit button at line 585: `<button onClick={() => setEditTarget(b)} aria-label={t("edit")} className="text-s-ink shrink-0 grid place-items-center"><Pencil size={19} /></button>` — no width/height/padding, hit area ~19px. Both carry correct aria-labels but are far under the 44px floor.
    - fix: Add an explicit h-11 w-11 grid place-items-center (or equivalent min-height/min-width) wrapper to both the modal close button (line 173) and the row edit button (line 585).

**Copy economy + i18n**

- **HIGH** `[code]` `app/[locale]/dashboard/products/page.tsx:41` · confirmed
    - rule: i18n: any user-facing string hardcoded in one language instead of going through next-intl is a finding
    - problem: `<h1 ...>Produkte</h1>` is a hardcoded German literal. The file has no useTranslations import at all (imports are only useEffect/useState/DashboardLayout/RetailManager/Spinner), unlike the sibling page it was copied from. Confirmed against app/[locale]/dashboard/services/page.tsx:449, which renders the identical h1 treatment via `{t('title')}` under useTranslations('dashboard.services') — the i18n wiring was dropped in the copy, the visual treatment wasn't.
    - fix: Add useTranslations('dashboard.products') (new key in messages/{de,en,fr,it}.json) and render {t('title')} instead of the literal string.

**Dropped by the verifier** (kept for audit trail)

- `app/[locale]/dashboard/reviews/page.tsx` , not-real , text-s-ink/40, /30, /20, /70 opacity fractions used for de-emphasized text instead of text-s-ink-2


### Dashboard ops (bookings, calendar, clients, staff, services, queue)  `dash-ops`

*6 files read · 12 findings (5 high) · 0 dropped by verifier*

**Fabricated data / dead controls**

- **HIGH** `[code]` `app/[locale]/dashboard/calendar/page.tsx:1104` · confirmed
    - rule: no fabricated / non-functional data-driven controls (CLAUDE.md taste rule 1 + silent-no-op law)
    - problem: Desktop calendar legend (lines 1098-1118, category swatches at 1104-1106) advertises category colors via s-coral/s-blue/s-sage (defined, retired-aliased tokens), but the actual grid rendering uses SERVICE_CATEGORY_COLORS (lines 25-30, applied via catBorder at 572-583) which references s-cal-hair/s-cal-nails/s-cal-spa/s-cal-barber. Grepping tailwind.config.js and globals.css confirms these 4 tokens plus s-star-text are undefined anywhere, so Tailwind emits no CSS for them: the category-colored borders on booked slots silently do not render as intended. Legend also omits barber (only lists Hair/Nails/Spa) while the map covers 4 categories.
    - fix: Wire the legend and SERVICE_CATEGORY_COLORS to the same, actually-defined tokens (e.g. the existing s-cat-coiffeur/barbershop/nails/spa set), add the missing barber legend entry, and verify visually that category-colored left borders render on booked slots.
- **HIGH** `[code]` `app/[locale]/dashboard/clients/page.tsx:429` · confirmed
    - rule: a control that renders yet does nothing counts as fabrication and is always high severity (task brief)
    - problem: The client-tag color picker (options at lines 429-432) offers 6 named colors, but tagColor() (lines 225-235) maps blue, purple, and gray all to the identical class string "bg-s-bg-sunken text-s-ink-2". Picking blue or purple for a client tag saves a distinct string to the DB but produces a visually identical result to gray.
    - fix: Give each named color a genuinely distinct swatch, or collapse the picker to only the colors that render differently (gray/red/orange/teal).

**Design contract**

- **HIGH** `[code]` `app/[locale]/dashboard/bookings/page.tsx:50` · confirmed
    - rule: the Avatar primitive is locked NOT colour-coded (deterministic B&W stone-ramp, V3-D202, COMPONENT_REGISTRY.md); reuse the primitive, don't hand-roll a duplicate
    - problem: Bookings (lines 50-54), Clients (54-61), and Staff (17-21) each hand-roll an identical initials-avatar with a 5-hue colored gradient (AV_GRADS array + avGrad hash function, verified byte-identical in structure across all 3 files). COMPONENT_REGISTRY.md's locked Avatar primitive (primitives/Avatar.tsx) explicitly specifies a deterministic B&W stone-ramp background, NOT colour-coded, and none of the 3 pages import or use it.
    - fix: Replace the 3 duplicated AV_GRADS/avGrad/initials blocks with <Avatar name={...} src={...} size="sm|md" /> from primitives/Avatar.tsx, or escalate the colour-coded-ops-avatar idea to the owner as a registry amendment rather than a silent triplicate.
- **HIGH** `[code]` `app/[locale]/dashboard/calendar/page.tsx:353` · confirmed
    - rule: LOCKFILE.md §12.4: dashboard is exempt from A9 (accent-restriction) but explicitly NOT exempt from A5 (RETIRED tokens like s-coral/s-amber) or A15 (raw Tailwind palette colour)
    - problem: STAFF_COLORS (lines 353-362) mixes explicitly retired tokens (s-coral aliased to s-ink, s-plum aliased to s-ink-2, s-amber/s-amber-subtle aliased to s-warning, all commented "was X -> alias to Y" in tailwind.config.js) and the fully undefined s-star-text, with 5 raw Tailwind palette colors (blue-100/blue-300/blue-700, pink-*, emerald-*, orange-*, cyan-*). LOCKFILE §12.4 states dashboard files are explicitly NOT exempt from A5. s-coral alone recurs roughly 18 more times through the file as active UI color at the exact lines cited (336, 341, 583, 839, 845, 849, 874, 876, 880, 907, 932, 988, 1009, 1021, 1076, 1083, 1098, 1104).
    - fix: Sweep calendar/page.tsx: s-coral -> s-ink or s-accent-bright per context, s-plum -> s-ink-2, s-amber* -> s-warning*, drop the undefined s-star-text, and replace the 5 raw Tailwind palette entries in STAFF_COLORS with token equivalents or the existing s-cat-* set.
- **MEDIUM** `[code]` `app/[locale]/dashboard/services/page.tsx:181` · confirmed
    - rule: Toast is the locked confirmation/error/warning primitive (COMPONENT_REGISTRY.md); native browser dialogs are unstyled and invisible to the design system
    - problem: Three error paths use native alert() confirmed verbatim at exactly the cited lines: photo-upload failure (181), photo-upload catch (185), CSV-import failure (590). primitives/Toast.tsx exists and is locked in COMPONENT_REGISTRY.md.
    - fix: Replace all three alert(...) calls with toast.error(...) from primitives/Toast.tsx.

**Consistency / drift**

- **LOW** `[code]` `app/[locale]/dashboard/queue-display/page.tsx:29` · confirmed
    - rule: raw hex where a token exists (CONSISTENCY_AUDIT.md canonical A); hairline token = border-s-border, not border-s-ink/{opacity}
    - problem: queue-display uses raw hex bg-[#0A0A0A] (line 29) and bg-[#16A34A] (line 49) which exactly match the already-defined s-ink (#0A0A0A) and s-success (#16A34A) tokens. calendar/page.tsx's mobile agenda hardcodes raw hex pastel backgrounds at line 588 where an existing s-cat-* token set (coiffeur/barbershop/nails/spa) could be used instead. calendar grid's border-s-ink/5 occurrences confirmed exactly at all cited lines (865,867,873,893,907,949,951,954,970,988,1021,1076) instead of the canonical border-s-border hairline token; CONSISTENCY_AUDIT.md itself names this exact pattern as the single most-duplicated inconsistency in the app.
    - fix: Swap the raw hexes for their token equivalents; swap border-s-ink/5 for border-s-border across the calendar grid.

**States + accessibility**

- **HIGH** `[code]` `app/[locale]/dashboard/bookings/page.tsx:91` · confirmed
    - rule: interactive controls >= 44px (h-11), the a11y floor (design contract table, CLAUDE.md)
    - problem: Every modal close (X) button across the audited files is an unsized, unpadded <button> wrapping only an 18px icon: verified verbatim at bookings/page.tsx:91, calendar/page.tsx:108,190,300, services/page.tsx:89,570, staff/page.tsx:154,299 (8 occurrences, all matching the exact pattern <button onClick={onClose}><X size={18}.../></button>). The clickable target is roughly 18x18px, well under the locked 44px floor.
    - fix: Wrap each close icon in a 44px hit-area, e.g. className="grid place-items-center h-11 w-11 -m-2.5 rounded-full hover:bg-s-bg-sunken", or extract a shared ModalCloseButton given the 8x duplication.
- **MEDIUM** `[code]` `app/[locale]/dashboard/staff/page.tsx:562` · confirmed
    - rule: icon-button wrapper = h-11 w-11 (44px, a11y min), CONSISTENCY_AUDIT.md canonical
    - problem: The 3 per-staff-card action buttons (toggle active, edit, delete) are w-10 h-10 (40px) at lines 562, 566, 570, all confirmed verbatim, under the locked 44px floor.
    - fix: Bump w-10 h-10 -> w-11 h-11 on all three buttons; adjust the row gap if the card gets tight.
- **MEDIUM** `[code]` `app/[locale]/dashboard/bookings/page.tsx:273` · confirmed
    - rule: loading = <Skeleton> shape-matching the final layout, NOT a bare spinner; empty = <EmptyState> with a real recovery action (design contract table + COMPONENT_REGISTRY.md)
    - problem: Full-list loading states are bare, non-shape-matching Spinner blocks confirmed identically at bookings/page.tsx:274, services/page.tsx:512, staff/page.tsx:525, clients/page.tsx:157. Empty states are hand-rolled <p> text with no recovery action, verified at bookings:276-277, services:514,516, staff:527-529, clients:159-161. Both primitives.Skeleton and components-legacy/ui/EmptyState.tsx exist in the codebase (Skeleton locked in COMPONENT_REGISTRY.md) but are unused in all 4 files.
    - fix: Swap the bare Spinner blocks for Skeleton-based list placeholders shaped like the real rows, and swap the hand-rolled empty <p> blocks for EmptyState with a recovery action (e.g. open the add modal).

**Copy economy + i18n**

- **MEDIUM** `[code]` `app/[locale]/dashboard/calendar/page.tsx:705` · confirmed
    - rule: i18n: any user-facing string/format hardcoded to one locale instead of the active next-intl locale is a finding
    - problem: Every date/time display is hardcoded to de-CH regardless of the salon owner's dashboard locale, confirmed at all cited lines across bookings/page.tsx (146,290,293), calendar/page.tsx (280,281,330,677,705,706,827,829,830), clients/page.tsx (199,374,413), queue-display/page.tsx (14). The same files correctly thread useLocale() into formatCurrency(amount, locale) (bookings/page.tsx:149,318), proving the locale variable is already in scope and the de-CH hardcoding is a real inconsistency, not an intentional design choice.
    - fix: Thread the existing locale variable into every toLocaleDateString/toLocaleTimeString call, mapping next-intl locale codes to Intl locale tags (e.g. fr -> fr-CH).
- **LOW** `[code]` `app/[locale]/dashboard/clients/page.tsx:378` · confirmed
    - rule: i18n: user-facing text goes through next-intl, not a hardcoded raw enum
    - problem: Client-detail booking-history tab prints the raw status enum directly, confirmed verbatim at lines 378-380 (<DashStatusPill tone={...}>{b.status}</DashStatusPill>), while bookings/page.tsx:319 has the correct pattern one file over using STATUS_LABEL_KEYS run through t().
    - fix: Reuse the STATUS_LABEL_KEYS-style lookup (extract to a shared helper) instead of rendering b.status raw.
- **LOW** `[code]` `app/[locale]/dashboard/queue-display/page.tsx:36` · confirmed
    - rule: never ALL-CAPS (feedback_ui_copy_rules); this binds production UI, not only mockups
    - problem: queue-display renders 4 separate uppercase tracking-[...] labels, all confirmed verbatim: back link (36), date subtitle (43), LIVE badge (50), empty state (65).
    - fix: Drop uppercase and letter-tracking on all 4, matching normal-case sentence copy used elsewhere in the dashboard.


### Dashboard category (barber, coiffeur, nail, spa)  `dash-category`

*6 files read · 11 findings (5 high) · 0 dropped by verifier*

**Fabricated data / dead controls**

- **HIGH** `[code]` `app/[locale]/dashboard/coiffeur-crm/page.tsx:114` · confirmed
    - rule: Solen no-fabrication law (CLAUDE.md taste rule 1: no fabricated data / a control that renders yet does nothing)
    - problem: `<AllergyAlert allergies={null} />` is a literal hardcoded null on every render of the Consultations tab, even though `clientId` state exists (line 36) and the sibling `ConsultationNotes` component (rendered right below it, same tab) fetches a real per-client `allergies` field from `/api/dashboard/coiffeur/consultations?client_id=...` and displays it itself (ConsultationNotes.tsx lines 37-48, 200-203). AllergyAlert.tsx line 18 (`if (!hasAllergen) return null;`) means the safety alert can never fire for any client since the prop is a constant.
    - fix: Fetch (or lift from ConsultationNotes' already-fetched data) the selected client's allergies/chemical-sensitivity/patch-test fields keyed by clientId and pass them to AllergyAlert instead of the literal null; don't render the slot at all when no client is selected.
- **HIGH** `[code]` `app/[locale]/dashboard/spa-admin/page.tsx:100` · confirmed
    - rule: Solen no-fabrication law (CLAUDE.md taste rule 1); silent no-op pattern (CLAUDE.md 'Silent no-ops' section)
    - problem: `<ContraindicationAlert intakeData={null} />` is a literal hardcoded null in the Intake tab, gated behind `clientId ? (...) : <EmptyClientPrompt/>` (lines 98-105) so clientId is known at this point but never used to fetch intake data. ContraindicationAlert.tsx line 25 (`if (!intakeData) return null;`) means the pregnancy/heart-condition/recent-surgery warning silently never displays. Note: the real intake data (via IntakeFormTab -> /api/clients/{id}/intake, lib/intake-templates.ts spa_consultation template) uses different field names/types than ContraindicationAlert expects (`pregnant` boolean not `pregnancy`, `contraindications` free-text not a `heart_condition` boolean, `recent_surgery` is free-text not boolean) so the real fix needs a mapping layer, not just a passthrough - but the core defect (a safety alert wired to a constant that always resolves to 'no risk') is real.
    - fix: Fetch the selected client's intake responses by clientId, map the relevant fields (pregnant/contraindications/recent_surgery text) into the IntakeData shape ContraindicationAlert expects (or extend ContraindicationAlert to read the raw responses shape), and pass real data instead of null.

**Design contract**

- **HIGH** `[code]` `app/[locale]/dashboard/coiffeur-crm/page.tsx:94` · confirmed
    - rule: LOCKFILE.md line 1215 (no-black-selected gate): every selected state other than the avatar check-badge = calm GRAY fill bg-s-bg-sunken + text-s-ink + semibold, NEVER black/ink; CLAUDE.md design-contract 'selected/active' row
    - problem: Active tab class is `activeTab === id ? "bg-s-ink text-white hover:bg-black" : ...` (ternary spans lines 92-96, the ink branch is line 94), a literal black fill on a selected tab, exactly what the no-black-selected gate exists to block. Confirmed the barber-ops sibling page (same file family) correctly uses the dashboard-blue active-nav treatment (`bg-s-accent-bright/10 text-s-accent-bright`) per LOCKFILE §12.2, so this is a real inconsistency, not an intentional dashboard exception.
    - fix: Swap the selected-tab classes to the dashboard active-nav blue (`bg-s-accent-bright/10 text-s-accent-bright`, matching barber-ops/page.tsx) or the calm-gray TabPill treatment; remove the ink/black fill.
- **HIGH** `[code]` `app/[locale]/dashboard/nail-admin/page.tsx:65` · confirmed
    - rule: LOCKFILE.md §12.4 (dashboard NOT exempt from A5 retired tokens incl. s-coral); RETIRED list; no-black-selected gate
    - problem: Selected tab uses `bg-s-coral text-white shadow-elevation-2` (line 65). `s-coral` is on LOCKFILE's RETIRED list and §12.4 states dashboards are NOT exempt from that ban. Confirmed in tailwind.config.js line 81: `"s-coral": "#0A0A0A"` (comment: "was CTAs / active state / brand -> alias to s-ink (B&W pivot)") so this literally renders as ink black, the same banned fill as finding 3. `app/[locale]/dashboard/spa-admin/page.tsx` line 64 has the identical `bg-s-coral text-white shadow-elevation-2` bug.
    - fix: Replace `bg-s-coral` with the calm-gray selected treatment (`bg-s-bg-sunken text-s-ink font-semibold`) or the dashboard blue active-nav treatment in both nail-admin/page.tsx:65 and spa-admin/page.tsx:64.
- **MEDIUM** `[code]` `app/[locale]/dashboard/barber-ops/page.tsx:78` · confirmed
    - rule: LOCKFILE.md §12.3: 'Dashboard cards/panels = rounded-card-lg (20px)... Softer than the customer-site 16px'
    - problem: Confirmed dashboard/page.tsx and DashboardUI.tsx consistently use `rounded-card-lg` (token = 20px in tailwind.config.js:249) for cards/panels. Confirmed none of the six audited pages use it: barber-ops uses `rounded-[16px]` (lines 78-79, 106); barber-clients/coiffeur-crm/nail-clients use `rounded-2xl` (16px); nail-admin/spa-admin use `rounded-[12px]`. Three different wrong values across the bucket, none matching the locked token.
    - fix: Standardize all card/panel containers and skeleton placeholders on rounded-card-lg across the six pages.

**Consistency / drift**

- **MEDIUM** `[code]` `app/[locale]/dashboard/spa-admin/page.tsx:76` · confirmed
    - rule: CONSISTENCY_AUDIT.md: 'Hairlines: border-s-border (#E7E5E4)... the single most-duplicated treatment in the app'; flags `border-s-ink/[0-9.]+` -> use border-s-border
    - problem: `<div className="bg-white rounded-[12px] border border-s-ink/[0.06] p-4 mb-4">` (line 76) and EmptyClientPrompt at line 127 (`border border-s-ink/[0.06] border-dashed`) both use the arbitrary ink-opacity border CONSISTENCY_AUDIT names by pattern. Confirmed sibling files in this bucket (barber-ops:106, coiffeur-crm:73/130/136/142/150) correctly use border-s-border.
    - fix: Replace border-s-ink/[0.06] with border-s-border at both spots (lines 76 and 127).

**States + accessibility**

- **HIGH** `[code]` `app/[locale]/dashboard/barber-ops/page.tsx:34` · confirmed
    - rule: COMPONENT_REGISTRY.md ErrorState entry: 'Use: any dashboard panel whose fetch can fail, so it never shows an indefinite spinner'; CLAUDE.md states row
    - problem: `fetch("/api/profile")...catch((err) => console.error(...)).finally(() => setLoading(false))` (lines 34-44) has no failure UI; if it rejects, `salonId` stays undefined and render falls to `!salonId ? null` (line 81), rendering nothing with no retry. Confirmed on coiffeur-crm:106, nail-admin:77, spa-admin:93 which have the identical `!salonId ? null` construct. Correction: the auditor's claim that barber-clients and nail-clients repeat this 'verbatim' is not accurate; those two pages instead use `{salonId && <Component/>}` per-section (same missing-error-state defect, different code shape), not the `!salonId ? null` ternary.
    - fix: On fetch failure (or missing salon_id after load), render the locked ErrorState primitive with a retry action instead of silently rendering null, in barber-ops.tsx and the other pages sharing this pattern (coiffeur-crm, nail-admin, spa-admin).
- **MEDIUM** `[code]` `app/[locale]/dashboard/barber-ops/page.tsx:77` · confirmed
    - rule: COMPONENT_REGISTRY.md Skeleton entry (locked primitive); CLAUDE.md states row: loading = <Skeleton>, USE it, don't hand-roll
    - problem: Loading state is hand-rolled `animate-pulse` divs instead of the locked `<Skeleton>` primitive (primitives/Skeleton.tsx, registry-locked). Verified the same hand-rolled pattern repeats: barber-clients:41-44, coiffeur-crm:105/126, nail-admin:76, nail-clients:38-41, spa-admin:90-92 (all confirmed by direct read).
    - fix: Replace the hand-rolled pulse divs with <Skeleton> (or <SkeletonCard>) across all six pages.

**Copy economy + i18n**

- **MEDIUM** `[code]` `app/[locale]/dashboard/barber-ops/page.tsx:50` · confirmed
    - rule: i18n: next-intl must wrap all user-facing strings (de/en/fr/it product)
    - problem: The category eyebrow is a hardcoded literal, not translated: `<p ...>Barber</p>` (line 50) while the h1 two lines below correctly uses `{t("pageTitle")}`. Confirmed the identical bug in coiffeur-crm/page.tsx:66 ('Coiffeur'), nail-admin/page.tsx:50 ('Nails'), spa-admin/page.tsx:49 ('Spa'). Strong supporting evidence: sibling files in the same category bucket (barber-clients/page.tsx:31, nail-clients/page.tsx:31) correctly use `{t("eyebrow")}` for the identical UI slot, proving this is a real, fixable inconsistency with an existing correct pattern to copy.
    - fix: Add an `eyebrow` translation key to each of the four namespaces (dashboardBarber, dashboardCoiffeur, nail_dashboard, dashboardSpa) and route the literal through t("eyebrow"), matching the barber-clients/nail-clients pattern.

**Icons**

- **MEDIUM** `[code]` `app/[locale]/dashboard/nail-admin/page.tsx:4` · confirmed
    - rule: Owner-named icon ban (memory feedback_icon_rules.md, 2026-06-23 dated): 'Never use the Lucide Sparkles (or Star) glyph as a decorative placeholder... not anywhere'
    - problem: `Sparkles` is imported and used as the tab icon for the AI-art-generation feature (`{ id: "ai", labelKey: "tabAI", icon: Sparkles }`, line 18). The rule text is a blanket ban ('not anywhere') dated after an emphatic owner rejection. Caveat: this specific usage labels a genuine AI-generation feature (not a decorative filler on an image-less content tile, which was the original violation context), and Sparkles-for-AI already appears elsewhere in the live codebase (e.g. profile/intake-forms/page.tsx:118 'AI Analyse'), so this may be a pre-existing accepted convention rather than fresh drift. Flagging as confirmed on the letter of the rule, with reduced confidence on intent.
    - fix: Swap Sparkles for a different Lucide icon not on the banned list (e.g. Wand2) for the AI tab, per the rule's letter.
- **LOW** `[code]` `app/[locale]/dashboard/nail-admin/page.tsx:22` · confirmed
    - rule: Icon-as-scanning-aid principle: distinct icon per meaningfully distinct thing
    - problem: `{ id: "retail", labelKey: "tabRetail", icon: ShoppingBag }` and `{ id: "sales", labelKey: "tabSales", icon: ShoppingBag }` (lines 22-23) assign the identical icon to two adjacent, distinct tabs (Retail inventory vs. Sales dashboard).
    - fix: Give the Sales tab a distinct icon, e.g. BarChart3 or TrendingUp, to differentiate it from Retail's ShoppingBag.


### Dashboard admin (salons, users, approvals, cities, moderation, verification, cases)  `dash-admin`

*14 files read · 16 findings (5 high) · 1 dropped by verifier*

**Fabricated data / dead controls**

- **HIGH** `[code]` `app/[locale]/dashboard/approvals/page.tsx:37` · confirmed
    - rule: Silent no-ops ("prove behavior, not existence") + no .catch(() => {})
    - problem: approve() (lines 37-42) and reject() (44-56) never check response.ok and have no try/catch. The fetch to /api/admin/salons/${id}/approve (and /reject) is awaited unconditionally, then setSalons filters the row out regardless of the PATCH result. A 500/403/network failure still makes the salon vanish from the pending queue as if approved/rejected, with no revert path.
    - fix: Check res.ok before mutating state, wrap in try/catch, console.error on failure, show a toast.error and leave the row in place. cities-admin/page.tsx:58-81 in the same bucket already does this correctly (optimistic update + revert-on-error) — mirror that pattern.
- **HIGH** `[code]` `app/[locale]/dashboard/all-users/page.tsx:108` · confirmed
    - rule: Silent no-ops
    - problem: handleRoleChange (lines 108-115) has no try/catch and no response.ok check: it awaits the PATCH then unconditionally updates the role in local state. A failed PATCH (permission/validation error) still shows the new role selected. Note the sibling handleSuspendToggle in the SAME file (117-136) correctly wraps in try/catch — this is an internal inconsistency, not a stylistic choice.
    - fix: Check res.ok, revert the select on failure, log + toast the error. Same shape as handleSuspendToggle two functions below it in this file.
- **HIGH** `[code]` `app/[locale]/dashboard/all-salons/page.tsx:295` · confirmed
    - rule: A control that renders yet does the wrong thing
    - problem: Verified: each salon row's "Bearbeiten" link is href={`/${locale}/dashboard/settings`} (line 295-296), no salon id. settings/page.tsx:1414-1424 always loads the salon via fetch("/api/profile") -> fetch(`/api/salons/${p.salon_id}`), and I confirmed there is no useSearchParams-based salon override anywhere in that file (only a "verified" query param is read, at line 1406). Clicking Bearbeiten on any salon in the admin list opens the logged-in admin's OWN salon settings, never the clicked salon's.
    - fix: Either wire settings/page.tsx to accept a ?salon_id= override for admin use, or point this link at a real admin-scoped salon-edit route if one exists (npm run exists salon edit admin first per the exists-check protocol).
- **MEDIUM** `[code]` `app/[locale]/dashboard/badge-manager/page.tsx:257` · confirmed
    - rule: Never .catch(() => {}) — always console.error("[Component] description:", err)
    - problem: Verified: three fetch chains swallow errors with zero logging: .catch(() => setBadges([])) (line 257), .catch(() => setSalonResults([])) (line 270), .catch(() => setSalonBadges([])) (line 281). Every other data-fetch in this bucket logs via console.error before falling back.
    - fix: Add console.error("[BadgeManager] failed to fetch badges:", err) (etc.) inside each catch.

**Design contract**

- **HIGH** `[code]` `app/[locale]/dashboard/badge-manager/page.tsx:368` · confirmed
    - rule: RETIRED tokens list (LOCKFILE §1 + §12.4 line 1190): s-coral is retired; dashboard is exempt from A9 (accent-restriction) but explicitly NOT exempt from A5 (retired tokens)
    - problem: bg-s-coral is the page's entire primary-action color (line 368, the "+ Neues Badge" CTA), plus focus:border-s-coral (109, 119, 455, 509), text-s-coral/ring-s-coral (134, 411, 421, 429), bg-s-coral (186, 224, 521). Verified against LOCKFILE.md:1190 which names s-coral by name as a retired token dashboard files are NOT exempt from. Same pattern recurs pervasively in verification/page.tsx (78, 97, 126) and admin-sandbox/page.tsx (262, 269, 294, 307, 350, 351, 458).
    - fix: Replace every s-coral reference in these three files with the dashboard's locked vibrant primitives: DashButton variant="primary" (accent-blue) for CTAs, text-s-accent/border-s-accent for focus/active states, matching cases/page.tsx which already uses bg-s-accent-bright/focus:border-s-accent correctly.
- **MEDIUM** `[code]` `app/[locale]/dashboard/all-salons/page.tsx:182` · confirmed
    - rule: Selected/active state must be calm gray fill (bg-s-bg-sunken + text-s-ink + semibold), never ink/black — design contract table, gate no-black-selected
    - problem: Verified: the status tab filter uses ink/black fill for the selected state: tab === value ? "bg-s-ink text-white hover:bg-black" : "bg-white border border-s-border text-s-ink-2..." (ternary at line 182-184, not 180 as originally cited — 180 is the opening of the className array). No dashboard exemption for this rule exists in LOCKFILE §12.4 (only A9 is exempted). Identical bug in review-moderation/page.tsx:156.
    - fix: Selected tab = bg-s-bg-sunken text-s-ink font-semibold; unselected stays white + hairline (the TabPill treatment).
- **MEDIUM** `[code]` `app/[locale]/dashboard/review-moderation/page.tsx:186` · confirmed
    - rule: No decorative separators — taste rule #2
    - problem: Verified: bare | characters at lines 186 and 190 between customer name / salon name / date in the review header row, identical to the banned middot-separator pattern with a different glyph.
    - fix: Delete the | spans; use flex-wrap gap spacing to separate the fields instead.

**Consistency / drift**

- **MEDIUM** `[code]` `app/[locale]/dashboard/badge-manager/page.tsx:29` · confirmed
    - rule: A label must match the thing it labels (no fabricated/mismatched data)
    - problem: Verified: COLOR_PRESETS maps { value: "#1B4D1B", labelKey: "colorCoral" } (line 29). #1B4D1B = RGB(27,77,27), a dark forest green, not coral. It is also the default color state for a new badge (line 76: useState(badge?.color ?? "#1B4D1B")). Any admin picking "Coral" gets a green swatch and a green badge.
    - fix: Fix the hex to an actual coral value (e.g. #FF6B4A) or rename the label to match the green it actually renders.
- **MEDIUM** `[code]` `app/[locale]/dashboard/approvals/page.tsx:71` · confirmed
    - rule: Use registered primitives, don't hand-roll — COMPONENT_REGISTRY.md (EmptyState is already imported and used by 4 sibling files in this exact bucket)
    - problem: Verified: the empty state is hand-rolled (lines 71-74: bg-white rounded-2xl border p-12 text-center + ShieldCheck + text) instead of the EmptyState component. Confirmed EmptyState is imported and used in all-users.tsx:185, all-salons.tsx:208, review-moderation.tsx:169, badge-manager.tsx:383 — all in the same admin bucket. verification.tsx:139-141 independently hand-rolls a THIRD, differently-styled (dashed border) empty box for the same role.
    - fix: Replace both hand-rolled blocks with <EmptyState icon={...} title={...} message={...} />, matching the other four files in this bucket.
- **MEDIUM** `[code]` `app/[locale]/dashboard/verification/page.tsx:68` · confirmed
    - rule: One destructive-confirm pattern per app; every other file in this bucket uses a custom ConfirmModal/DeleteModal
    - problem: Verified: if (!confirm(t('confirmDelete'))) return; at line 68 uses the native browser confirm() for a destructive delete, while all-salons.tsx (ConfirmModal, lines 51-93), all-users.tsx (ConfirmModal, lines 35-77), review-moderation.tsx (DeleteModal, 43-72) and badge-manager.tsx (DeleteModal, 198-233) all build a proper ink-branded modal for the identical action. admin-sandbox.tsx:110 does the same with confirm(t("confirmDeleteAll")), and cases/page.tsx:190/193 uses native alert() instead of the registered Toast primitive.
    - fix: Route these through the existing ConfirmModal pattern and toast.error(...) instead of confirm()/alert().
- **MEDIUM** `[code]` `app/[locale]/dashboard/cases/page.tsx:282` · confirmed
    - rule: Raw hex/arbitrary shadow where a token exists — CONSISTENCY_AUDIT.md (arbitrary shadow-[...] and rounded-[Npx]/border-[hex] canonicals, lines 36-42)
    - problem: Verified: the escalated-case card at line 282 uses border-[#dcd9d6] p-5 shadow-[0_1px_2px_rgba(0,0,0,.04),0_10px_28px_rgba(10,10,10,.07)] instead of tokens. The timeline dot border repeats the pattern at line 330: bg-white border-[#BBB8B5].
    - fix: Map #dcd9d6/#BBB8B5 to the nearest s-border/s-ink-3 token and the arbitrary shadow to shadow-elevation-2/-3.
- **MEDIUM** `[code]` `app/[locale]/dashboard/admin-sandbox/page.tsx:234` · confirmed
    - rule: Error colour = s-error token, never raw Tailwind red-* — CONSISTENCY_AUDIT.md line 43 ("50+ raw red-* in booking/profile/ui, parallel to ~180 s-error")
    - problem: Verified: raw Tailwind red used directly instead of s-error: bg-red-50 text-red-500 hover:bg-red-100 (line 234, delete-all button), text-red-500 (248, 253), hover:bg-red-50 hover:text-red-500 (387, 393), bg-red-50 text-red-500 (425).
    - fix: Replace with bg-s-error-bg text-s-error / hover:bg-s-error-bg, matching the correct s-error usage already in this bucket (e.g. cases.tsx:353 border-s-error/40 text-s-error).
- **LOW** `[code]` `app/[locale]/dashboard/all-salons/page.tsx:200` · confirmed
    - rule: Use a real token, not an undefined Tailwind color name
    - problem: Verified: placeholder-dark/30 at line 200. tailwind.config.js has no "dark" color key (darkMode was removed 2026-05-02, confirmed via grep) so this compiles to nothing. Same dead class reused verbatim in all-users.tsx:177 and badge-manager.tsx:455.
    - fix: Replace placeholder-dark/30 with placeholder-s-ink/30 (or placeholder:text-s-ink-3) in all three files.

**States + accessibility**

- **HIGH** `[code]` `app/[locale]/dashboard/admin-sandbox/page.tsx:371` · confirmed
    - rule: Icon-button wrapper locked to h-11 w-11 (44px, the a11y floor) / general "touch target: interactive controls >= 44px" row — design contract table
    - problem: Verified: the reset/delete/expand icon-only buttons on every seeded-salon row are w-8 h-8 (32px) at lines 371, 384, and 397. badge-manager.tsx's color-swatch buttons are the same w-8 h-8 at line 152 (exact match for the "icon-button" rule since these are pure icon buttons, no label). The broader claim that px-3 py-1.5 text-xs action buttons elsewhere (all-salons.tsx:281/288, all-users.tsx:262/269, review-moderation.tsx:241-261) also fall short is true as code but is really the separate "touch target >= 44px" row, not the "icon-button" row, and that h-9/text-xs pattern is the near-universal convention across almost every admin page in this bucket (including cases/page.tsx's own h-9 action buttons) — it reads like a deliberate admin-density convention rather than an isolated miss, so treat that part as lower-confidence than the clean icon-button violations.
    - fix: Bump the pure icon-only buttons (admin-sandbox 371/384/397, badge-manager 152) to h-11 w-11 first — that is the unambiguous violation. For the smaller text-label buttons across the bucket, escalate to the owner whether the admin-density convention is an intentional, undocumented exemption before mass-editing every file.
- **MEDIUM** `[code]` `app/[locale]/dashboard/approvals/page.tsx:69` · confirmed
    - rule: Loading = <Skeleton> shape-matching the final layout, never a bare spinner — design contract table + COMPONENT_REGISTRY.md
    - problem: Verified: {loading ? <div className="flex justify-center py-16"><Spinner size="lg" /></div> : ...} at line 69, a bare centered spinner not shaped like the pending-salon-card layout. Same pattern recurs at all-salons.tsx:206, all-users.tsx:183, review-moderation.tsx:167, cities-admin.tsx:94, badge-manager.tsx:376, cases.tsx:262/320/377 — this is a bucket-wide convention, not isolated to this file.
    - fix: Swap the loading branch for a composite Skeleton shaped like the card list.

**Copy economy + i18n**

- **MEDIUM** `[code]` `app/[locale]/dashboard/admin-sandbox/page.tsx:198` · confirmed
    - rule: No em-dashes in UI copy (taste rule #10) + all user-facing strings go through next-intl
    - problem: Verified: the "Platform Test-Salons" banner copy is hardcoded English at lines 197-200, bypassing t() even though every other string on the page is translated. The result/error strings a few lines down are hardcoded German AND contain em-dashes: "{n} Fehler — siehe Konsole" (line 248) and "Fehler beim Seeden — Console prüfen" (line 253).
    - fix: Move all four strings into the adminSandbox i18n namespace and replace the em-dashes with a period/colon.

**Dropped by the verifier** (kept for audit trail)

- `app/[locale]/dashboard/badge-manager/page.tsx` , not-real , Sparkles/Zap in the badge icon picker (ICON_MAP, lines 18-22)


### Dashboard growth (marketing, segments, loyalty, discovery, homepage-admin, gallery)  `dash-growth`

*15 files read · 14 findings (4 high) · 0 dropped by verifier*

**Fabricated data / dead controls**

- **HIGH** `[code]` `app/[locale]/dashboard/segments/page.tsx:127` · confirmed
    - rule: dead-click contract (CLAUDE.md taste rule 1 / no-op controls)
    - problem: The per-segment button (Mail icon + t("sendEmail")) has full hover-affordance styling (hover:border-s-coral hover:text-s-coral) but no onClick at all, verified by direct read of the file. It looks tappable and does nothing.
    - fix: Wire the button to a real send-email action for the segment, or remove it until the feature ships.

**Design contract**

- **HIGH** `[code]` `app/[locale]/dashboard/discovery-admin/page.tsx:54` · confirmed
    - rule: retired-token ban (LOCKFILE §12.4 + RETIRED list: dashboard is exempt from A9 accent-restriction but NOT from A5 retired tokens s-coral/s-amber/s-sage) and no-black-selected gate intent (LOCKFILE line 1215)
    - problem: Verified: tailwind.config.js:81 aliases s-coral to #0A0A0A (pure ink) with an explicit comment 'was CTAs/active state/brand', and LOCKFILE's RETIRED list (line 106) explicitly lists s-coral, s-sage, s-amber as 'never use in new code'. discovery-admin/page.tsx:54 renders the active tab as activeTab === tab ? "bg-s-coral text-white" : ... (spot-checked exact line, matches verbatim). Spot-checked and confirmed the same s-coral/s-amber pattern repeats widely: discovery-admin:182,185,202,218,223,308,313,376,392,491,509,516,545,567,706,716; discovery-posts:146,149,162,171,183; homepage-admin:88,111,129,135; help-editor:117-250; loyalty:94,109,114 (bg-s-coral CTA/icon) and loyalty:119 (text-s-sage for a success message, also on the RETIRED list).
    - fix: Per LOCKFILE §12.2, dashboard active-nav/CTA should use s-accent-bright (#276EF1, confirmed defined in tailwind.config.js:224); a genuinely selected pill/tab (not nav/CTA) should use the calm-gray TabPill treatment (bg-s-bg-sunken text-s-ink font-semibold) per LOCKFILE line 1215. Replace s-sage success text with s-success. Route new call sites through DashButton/TabPill registry primitives.
- **MEDIUM** `[code]` `app/[locale]/dashboard/segments/page.tsx:99` · confirmed
    - rule: no per-category/per-row raw colour (CLAUDE.md design contract: category tag = neutral bg-s-bg-sunken + text-s-ink-2, no per-category colour)
    - problem: Verified against the LIVE database: customer_segments currently has 5 real rows each with a distinct raw hex color (#F59E0B, #D4AF77, #EC4899, #4ECDC4, #FF6B6B). segments/page.tsx:99-101 renders style={{ backgroundColor: seg.color + "15", color: seg.color }} on the icon chip and style={{ color: seg.color }} on the member count at line 111 (verified), bypassing every design token.
    - fix: Drop the per-row inline hex; render the icon chip and count in the standard neutral treatment (bg-s-bg-sunken / text-s-ink), reserving color for the semantic icon table if a genuine distinction is needed.
- **MEDIUM** `[code]` `app/[locale]/dashboard/help-editor/page.tsx:145` · confirmed
    - rule: focus-ring law (CLAUDE.md design contract: focus is a single global ink halo; primitives add no extra outline)
    - problem: Verified: form inputs hand-roll focus:outline-none focus:ring-2 focus:ring-s-coral/30 at lines 145, 150, 161, 168, 176-177 (all grepped and confirmed), duplicating the global :focus-visible system already defined in app/globals.css (confirmed lines 358-369) and using the retired s-coral token. Same pattern confirmed at loyalty/page.tsx:109.
    - fix: Delete the custom focus:ring-* classes; let the global :focus-visible ink-border + halo apply. If a dashboard-specific override is genuinely needed, use a non-retired token.
- **MEDIUM** `[code]` `app/[locale]/dashboard/marketing/page.tsx:70` · confirmed
    - rule: shadow token canonical (CONSISTENCY_AUDIT.md: legacy shadow alias names -> elevation-1/2/3, flagged 'safe to collapse, churn-vs-tidy call')
    - problem: Verified: shadow-warm-md is used at marketing/page.tsx:70, segments/page.tsx:93, homepage-admin/page.tsx:91 plus its toggle-thumb shadow-warm-sm at line 117, and help-editor/page.tsx:136 (all grepped and confirmed). warm-sm/warm-md are still defined tokens in tailwind.config.js (lines 265-266), not broken CSS, and CONSISTENCY_AUDIT.md explicitly frames the elevation-alias collapse as a lower-urgency 'churn-vs-tidy call', so this is real drift but softer than a hard-locked violation.
    - fix: Swap shadow-warm-md/shadow-warm-sm to shadow-elevation-2/shadow-elevation-3 per the LOCKFILE design contract, as a tidy-up pass rather than an urgent fix.

**Consistency / drift**

- **MEDIUM** `[code]` `app/[locale]/dashboard/segments/page.tsx:93` · confirmed
    - rule: radius token canonical (CONSISTENCY_AUDIT.md: 'rounded-[12px] blocks -> rounded-card/rounded-2xl (16)'); NOTE: LOCKFILE §12.3 sets a dashboard-specific radius that differs from the customer-site canon the auditor cited
    - problem: Verified: segments/page.tsx:93 uses rounded-[12px] on the card and rounded-[8px] on the icon chip (line 99), both grepped and confirmed. Same rounded-[12px] pattern confirmed at loyalty/page.tsx:92, discovery-admin/page.tsx:192,217,308,376,392,491,545,706, help-editor/page.tsx:117,136,218, homepage-admin/page.tsx:91. However, the auditor's cited target token (rounded-card/16px) is the CUSTOMER-facing canon; LOCKFILE §12.3 sets a SEPARATE, dashboard-specific rule: 'Dashboard cards/panels = rounded-card-lg (20px)' (confirmed token exists: tailwind.config.js:249, "card-lg": "20px"). The bracket-notation drift is real; the auditor's proposed replacement token is wrong for this surface.
    - fix: Replace rounded-[12px] on dashboard cards/panels with rounded-card-lg (20px) per LOCKFILE §12.3, not rounded-card/16px (that canon is customer-site only). Pick a fixed small-chip radius token for the 8px icon-chip case.
- **MEDIUM** `[code]` `app/[locale]/dashboard/marketing/page.tsx:70` · confirmed
    - rule: hairline token canonical (CONSISTENCY_AUDIT.md: 'border-s-ink/{op} -> border-s-border', ~480 stray uses vs 201 canonical, no dashboard exemption noted)
    - problem: Verified: className="bg-white rounded-[16px] border border-s-ink/5 shadow-warm-md p-5" at line 70. Same border-s-ink/5 pattern confirmed at segments/page.tsx:93,119,135, loyalty/page.tsx:92, discovery-admin/page.tsx:545,706, homepage-admin/page.tsx:95 (all grepped and confirmed).
    - fix: Replace border-s-ink/5 with border-s-border (#E4E4E7) at every cited call site.

**States + accessibility**

- **HIGH** `[code]` `app/[locale]/dashboard/gallery/page.tsx:31` · confirmed
    - rule: componentised states law (CLAUDE.md design contract: error = <ErrorState> inline, never an indefinite/blank state)
    - problem: Verified: fetchSalon()'s .catch((err) => { console.error("Gallery page error:", err); }) (line 31-33) only logs, then .finally(() => setLoading(false)). With salon still null, if (!salon) return null; at line 53 renders a fully blank page with no error UI or retry. ErrorState exists at components-legacy/ui/ErrorState.tsx (registered, locked) and IS correctly used with onRetry in dashboard/marketing/page.tsx:74, confirming the fix pattern is real and adjacent.
    - fix: On fetch failure set an error state and render <ErrorState onRetry={fetchSalon} .../>, mirroring marketing/page.tsx:73-74.
- **HIGH** `[code]` `app/[locale]/dashboard/help-editor/page.tsx:236` · confirmed
    - rule: touch-target floor (CLAUDE.md design contract: interactive controls >= 44px, h-11, the a11y floor)
    - problem: Verified: the article row action buttons (publish/edit/delete) use className="p-1.5 rounded-btn ..." around a 14px Lucide icon at lines 236-237, 243-244, 249-250 (auditor cited 235, actual first button opens at 236) - roughly 26x26px hit box, well under the 44px floor. Also verified: discovery-admin drag-handle is w-7 h-7 at line 555, archive button w-6 h-6 at line 560, and the bulk-import-result dismiss button at line 195 (<button onClick={...} className="ml-auto text-s-ink/30 hover:text-s-ink-2">) has no padding class at all around a 14px XCircle icon.
    - fix: Wrap each icon action in a >=40-44px hit area, keeping the visible icon small inside the larger tappable box, per the locked icon-button spec.
- **MEDIUM** `[code]` `app/[locale]/dashboard/marketing/page.tsx:72` · confirmed
    - rule: componentised loading state (CLAUDE.md design contract: loading = <Skeleton> shape-matching, not a bare spinner)
    - problem: Verified: {loadingSalon ? (<div className="flex justify-center py-8"><Spinner size="md" /></div>) : ...} at line 71-72. Same bare-spinner pattern confirmed at segments/page.tsx:79-80, loyalty/page.tsx:72-77 (a full DashboardLayout wraps a lone <Spinner />), homepage-admin/page.tsx:86-88 (<Loader2 className="animate-spin">, auditor cited 87-89, off by one line, same block), and help-editor/page.tsx:207-208. gallery/page.tsx:41-51 correctly uses <Skeleton> shapes for its own load, confirming the primitive is available and simply unused elsewhere.
    - fix: Replace the centered Spinner/Loader2 block with <Skeleton> shapes matching each panel's final layout, following gallery/page.tsx's own pattern.
- **MEDIUM** `[code]` `app/[locale]/dashboard/discovery-admin/page.tsx:235` · confirmed
    - rule: componentised empty state (CLAUDE.md design contract: empty = <EmptyState>, don't hand-roll)
    - problem: Verified exact matches: <p className="text-center text-s-ink/30 py-12">{t("stockEmpty")}</p> at line 235, and identical hand-rolled pattern at lines 527 (stagingEmpty), 663 (publishedEmpty), 736 (flaggedEmpty) - all four grepped and confirmed. discovery-posts/page.tsx:195 (emptyHistory) and help-editor/page.tsx:210-212 (emptyState) confirmed hand-rolled with no icon/action. marketing/page.tsx:76 and segments/page.tsx:82 confirmed correctly use the locked <EmptyState> primitive, proving it's available and adopted inconsistently.
    - fix: Replace each hand-rolled <p>/<div> with <EmptyState icon title message />, adding a real recovery action where one exists (e.g. reload).
- **LOW** `[code]` `app/[locale]/dashboard/discovery-admin/page.tsx:487` · confirmed
    - rule: keyboard-path consistency (CLAUDE.md design contract: no missing keyboard path)
    - problem: Verified: the Stock Import tab's tile div has role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && toggleSelect(photo.id)} at lines 209-215. The Staging tab's functionally identical tile at lines 487-490 (<div key={item.id} onClick={() => toggleSelect(item.id)} className={...}>) has no role, tabIndex, or onKeyDown - confirmed by direct read.
    - fix: Add role="button" tabIndex={0} onKeyDown to the Staging tab's tile div, mirroring the Stock Import tab's pattern.

**Copy economy + i18n**

- **LOW** `[code]` `app/[locale]/dashboard/segments/page.tsx:139` · confirmed
    - rule: i18n hardcode ban (project i18n contract: every user-facing string goes through next-intl, de/en/fr/it)
    - problem: Verified: <p className="text-xs text-s-ink/30 text-center py-2">Keine Mitglieder</p> at line 139, hardcoded German inside a component that sources every other string via t(...). The member fallback {m.display_name ?? "Anonym"} is confirmed at line 147.
    - fix: Add t("noMembers") and t("anonymous") translation keys and use them in place of the literals.

**Icons**

- **MEDIUM** `[code]` `app/[locale]/dashboard/segments/page.tsx:16` · confirmed
    - rule: banned-icon law (feedback_icon_rules memory, verbatim: 'Never use the lightning/zap icon [Lucide zap]')
    - problem: Verified against the LIVE production database (Supabase project tocfnsmxmdxkrcmjzzdw, table customer_segments): a real, live row has name="Power Bookers", icon="Zap", color="#FF6B6B". ICON_MAP at segments/page.tsx:16-18 maps seg.icon strings straight to Lucide glyphs including Zap (imported line 7). This is stronger than the auditor's migration-file citation: the banned icon is confirmed live, not just seeded.
    - fix: Update the live row's icon column (and/or the ICON_MAP fallback logic) to an allowed Lucide glyph, e.g. TrendingUp, for the Power Bookers segment.


### Dashboard core (home, setup, settings, editors, layout/nav)  `dash-core`

*17 files read · 9 findings (2 high) · 0 dropped by verifier*

**Design contract**

- **MEDIUM** `[code]` `app/[locale]/dashboard/settings/page.tsx:52` · confirmed
    - rule: LOCKFILE Section 1 RETIRED list: s-coral never use in new code; LOCKFILE line 1190 confirms dashboard files are exempt from A9 (accent-restriction) but explicitly NOT exempt from A5 (retired-token enforcement, naming s-coral/s-amber by name)
    - problem: Verified s-coral used at settings/page.tsx line 52 (hours-editor day toggle: bg-s-coral text-white) and dozens more times through the same file (lines 256, 266, 269, 274, 277, 282, 320, 336, 370, 379, 388, 572, 594, 609, 612, 638-643, 699-743, and more), alternating in the SAME file with s-accent-bright for the identical selected/primary role (lines 137-138, 451-462, 852-943). Repo-wide grep confirms s-coral appears 288 times across 48 files under app/[locale]/dashboard + components-legacy/dashboard (auditor's narrower dash-core count of 180/33 is plausible as a subset; actual scope is at least as large, not smaller).
    - fix: Sweep s-coral to s-accent-bright (the dashboard-scope token) across the flagged files; component-first via the shared DashboardUI primitives rather than file-by-file.
- **LOW** `[code]` `components-legacy/dashboard/ActivityFeed.tsx:23` · confirmed
    - rule: LOCKFILE Section 1 RETIRED list: s-amber PERMANENTLY KILLED V3-D320, drift-checker will reject any new s-amber usage
    - problem: Verified EVENT_ICON_MAP.booking_cancelled (line 23) and .review_new (line 24) use iconBg: bg-s-amber/10. Verified components-legacy/dashboard/NotificationCenter.tsx TYPE_CONFIG.cancellation (line 26) and .low_slots (line 27) use the identical retired token. LOCKFILE line 108 confirms s-amber was permanently killed V3-D320 and the drift-checker rejects any new usage; line 1190 confirms dashboard files are NOT exempt from this rule.
    - fix: Swap bg-s-amber/10 to bg-s-warning-bg (or bg-s-warning/10) in both files.
- **LOW** `[code]` `components-legacy/dashboard/StatCard.tsx:68` · confirmed
    - rule: CONSISTENCY_AUDIT.md rule A15: raw palette hex bypassing a semantic token; CLAUDE.md taste rule 4 (never use a dark .text token as a focal fill)
    - problem: Verified deltaColors.up at line 68 is text-[#15803D] bg-[#16A34A]/10, a raw hex pair. LOCKFILE line 70 confirms #15803D was explicitly REVERTED 2026-06-10 (owner: normal green not deep) in favor of the single #16A34A used for both focal and inline success treatments, and a live s-success token exists for this exact purpose (LOCKFILE line 68: s-success.DEFAULT #16A34A / s-success.bg #E8F5E9).
    - fix: Replace with text-s-success bg-s-success-bg (or bg-s-success/10 if the pale-10% variant is intentional).

**Consistency / drift**

- **MEDIUM** `[code]` `app/[locale]/dashboard/settings/page.tsx:255` · confirmed
    - rule: CONSISTENCY_AUDIT.md: the same situation gets a different treatment + don't hand-roll, reuse the locked primitive
    - problem: Verified LastMinuteTab's toggle at lines 255-259 is a bare <button> with no role or aria-checked, filled with retired tokens bg-s-coral / bg-s-sand. Verified SchedulingTab's daily-limit toggle at lines 1168-1172 IS aria-correct (role=switch aria-checked={limitEnabled}) but is an independent w-[38px] h-[23px] reimplementation. Verified the locked Switch primitive exists at app/[locale]/_components/primitives/Switch.tsx: w-11 h-6 (44x24px) track, role=switch, aria-checked, bg-s-ink when checked (not s-coral). Neither hand-rolled toggle reuses it.
    - fix: Replace both hand-rolled toggles with <Switch checked={...} onCheckedChange={...} /> from the primitives library.
- **MEDIUM** `[code]` `components-legacy/dashboard/DashboardLayout.tsx:181` · confirmed
    - rule: Don't leave superseded/duplicate config in a live file; a component's data source of truth should be singular
    - problem: Verified OWNER_NAV_GROUPS (lines 56-100) feeds filteredOwnerNavGroups (useMemo, lines 181-199) and categoryNavGroups (useMemo, lines 202-205, backed by getCategoryNavGroups import at line 21). Grepped the whole file and the rest of the repo: filteredOwnerNavGroups and OWNER_NAV_GROUPS are never referenced anywhere else (not passed as a prop, not destructured into JSX, not rendered). The live nav is driven entirely by RAIL_NAV (lines 114-131), a second, differently-grouped taxonomy (Verkauf & Kunden/Abrechnung vs OWNER_NAV_GROUPS's Spezial/Mehr). Confirmed dead code computed on every render.
    - fix: Delete OWNER_NAV_GROUPS, filteredOwnerNavGroups, and categoryNavGroups (and the now-unused getCategoryNavGroups import) since RAIL_NAV is confirmed the sole live source; if categoryNavGroups was meant to drive a category-specific rail section, that wiring is missing and should be restored instead.
- **LOW** `[code]` `components-legacy/dashboard/NotificationCenter.tsx:95` · confirmed
    - rule: No malformed/no-op Tailwind classes; a hover state must actually apply
    - problem: Verified line 95: className includes hover:bg-s-bg-sunken:bg-white/[0.06] transition-colors. A bare colon appended after a real utility name is not a recognized Tailwind variant, so this class never compiles to any CSS rule and the hover state silently does nothing.
    - fix: Replace with a single valid class, e.g. hover:bg-s-bg-sunken.

**States + accessibility**

- **HIGH** `[code]` `components-legacy/dashboard/DashboardLayout.tsx:288` · confirmed
    - rule: Design contract: 'touch target: interactive controls >= 44px (h-11), the a11y floor' / 'icon-button h-11 w-11'
    - problem: Verified every icon-only control cited: desktop rail links w-10 h-10 = 40px at lines 288, 302, 311; desktop search trigger w-[38px] h-[38px] = 38px at line 430; mobile hamburger p-1.5 around a 20px Menu icon (~32px total) at lines 437-439; mobile search trigger p-1.5 around a 16px icon (~28px total) at lines 441-443. Companion file components-legacy/dashboard/NotificationCenter.tsx confirmed: bell trigger w-8 h-8 = 32px at line 95, close button p-1 around a 12px icon (~20px) at lines 131-133. CONSISTENCY_AUDIT.md line 39 states the canonical is h-11 w-11 (44px, a11y min) with no dashboard-chrome exemption (LOCKFILE line 1190 only exempts dashboard from A9 accent-restriction, not the a11y touch-target floor).
    - fix: Bump every icon-only chrome control to h-11 w-11 (or pad the hit area to 44px while the icon stays visually smaller inside it), matching the locked icon-button spec.
- **LOW** `[code]` `app/[locale]/dashboard/page.tsx:172` · confirmed
    - rule: Design contract: loading = <Skeleton> (shape matches the final layout, NOT a bare spinner); COMPONENT_REGISTRY: use the locked primitive, don't hand-roll
    - problem: Verified the loading branch: {loading ? (<div className=grid...>{[...Array(2)].map((_, i) => <div key={i} className=rounded-card-lg border border-s-border bg-white h-56 animate-pulse />)}</div>) : (...)}. This is a hand-rolled div (mapped twice), not the locked Skeleton primitive from app/[locale]/_components/primitives, even though DashboardLayout.tsx's own auth-loading skeleton (lines 253-267, one level up in the wrapper) correctly uses <Skeleton>. Line corrected from the auditor's cited 170-173 to the actual hand-rolled element at line 172 (170 is only the ternary opening).
    - fix: Replace the bare animate-pulse div with <Skeleton height={224} rounded={16} /> (matching rounded-card-lg) for each of the two chart placeholders.

**Copy economy + i18n**

- **HIGH** `[code]` `components-legacy/dashboard/DashboardLayout.tsx:114` · confirmed
    - rule: i18n: every user-facing string must go through next-intl (de/en/fr/it); a hardcoded single-language string is a finding
    - problem: RAIL_NAV (lines 114-131, the file's own comment at 111-113 calls it the SINGLE source of truth for both the desktop rail and the mobile sidebar) hardcodes German label/group strings (Übersicht, Kalender, Warteschlange, Katalog, Pakete, Kund:innen, Marketing, Verkäufe, Team, Berichte, Rückerstattungen, Mehrbelastung, Fälle, Einstellungen, plus group labels Betrieb/Verkauf & Kunden/Business/Abrechnung/Mehr) and renders them verbatim: {label} at line 291 (desktop tooltip), {groupLabel} at line 373, {label} at line 380 (mobile sidebar row). ADMIN_NAV and STAFF_NAV in the same file correctly call t(key) at lines 304 and 357. Verified messages/en.json has dashboard.nav keys for the OLD taxonomy (overview, calendar, clients, services, marketing, team, settings) but is missing keys for the NEW RAIL_NAV taxonomy items (queue, catalog, bundles, sales, reports, refunds, upcharge, cases) and all five group labels, confirming this is an unfinished migration, not an intentional exception (the file's own comment at line 109-110 says i18n keys for the new taxonomy land in the i18n pass).
    - fix: Add the missing dashboard.nav keys (RAIL_NAV items + 5 group labels) to messages/de.json, en.json, fr.json, it.json, then render t(key)/t(groupKey) instead of the literal label/groupLabel fields at lines 291, 373, 380.


## /dev route triage

37 routes triaged: **22** keep-referenced, **10** dead-delete, **5** keep-active-mockup

| route | verdict | evidence |
|---|---|---|
| `/dev/confirm-preview` | dead-delete | Zero references anywhere in app/components/components-legacy/lib/_plans/_design-system. The file's own header states: 'Dev demo (m |
| `/dev/map-browse` | dead-delete | Zero references outside its own file. Its own header states 'Exists-check: npm run exists map-browse = 0; the SEARCHED state is /d |
| `/dev/map-interact` | dead-delete | Its core idea (floating store-preview popup on pin tap) is explicitly REJECTED and ALREADY logged: _design-system/REMOVED.md:50 'O |
| `/dev/map-single` | dead-delete | Only reference is a comment in map-behavior/page.tsx:9 (dev-to-dev, not real code) and its own _plans log ('[x] MOCKUPS built at / |
| `/dev/new-primitives` | dead-delete | Only historical mention is _design-system/REMOVED.md:46 ('only reference was dev/new-primitives showcase' for a now-deleted Status |
| `/dev/no-results` | dead-delete | Its own header describes the C1 (single-CTA, cause-aware) no-results shape as 'owner-picked.' app/[locale]/_components/search/Sear |
| `/dev/review-preview` | dead-delete | Zero references in app/components/components-legacy/lib/_plans/_design-system. Its own header: 'Not linked in nav... Dev-only rend |
| `/dev/search-balance` | dead-delete | Zero references anywhere including _plans and _design-system. Proposes wiring the rich Inspo feed into the search overlay typing s |
| `/dev/search-fixes` | dead-delete | Zero references anywhere including _plans and _design-system. An Inspo-look-card treatment proposal with no plan tracking and no r |
| `/dev/search-trending` | dead-delete | Zero references anywhere including _plans and _design-system. Proposes 3 'liftup' redesigns for the search overlay's Trending chip |
| `/dev/audit-fixes` | keep-active-mockup | Created 2026-07-08 as item 6a of the CURRENTLY ACTIVE _plans/FRONTEND_AUDIT.md (workstream #13 in ACTIVE.md). Index page for the a |
| `/dev/audit-fixes/fabrication` | keep-active-mockup | Linked from /dev/audit-fixes (same file, same turn's work). Grounded-in comment lists 9 real source files read in full; part of op |
| `/dev/category-flow` | keep-active-mockup | _plans/MAP_SEARCH_REFINE.md:518 has an OPEN '[ ] A2 (MOCKUP): /dev/category-flow Model B refine...' task, not yet closed. _plans/S |
| `/dev/confirm-full` | keep-active-mockup | Owner-locked per _plans/MAP_SEARCH_REFINE.md:316,335 ('LOCKED/approved, dont change your locked in stuff') and protected in approv |
| `/dev/search-morph` | keep-active-mockup | _plans/ACTIVE.md row 4 names this workstream and _plans/SEARCH_MORPH.md is its detail file; the mockup is described as the FROZEN  |
| `/dev/bundle-builder` | keep-referenced | app/[locale]/dashboard/bundles/page.tsx:7,25 cite it verbatim ('promoted from the APPROVED mockup app/[locale]/dev/bundle-builder/ |
| `/dev/bundles-products` | keep-referenced | app/[locale]/_components/salon/SalonBundles.tsx:5,11 and SalonProducts.tsx:5,11 cite it as the APPROVED grounding grammar (mockup- |
| `/dev/card-ratio` | keep-referenced | app/[locale]/_components/homepage/SalonCard.tsx:462,486 cite it as owner-approved (2026-07-02/03). Still the live grounding refere |
| `/dev/checkout-confirm` | keep-referenced | Linked from app/[locale]/dev/mockups/page.tsx:36 ('Checkout beats... kept for reference'). _plans/MAP_SEARCH_REFINE.md:232,259,261 |
| `/dev/filter-menus` | keep-referenced | app/[locale]/_components/search/FilterSheet.tsx:40,55,141,432,585 cite it repeatedly as owner-approved grounding (R4-1). _design-s |
| `/dev/filter-refine` | keep-referenced | FilterSheet.tsx:375 cites it directly. _plans/MAP_SEARCH_REFINE.md:313 'FILTER: IMPLEMENTED in the REAL FilterSheet.tsx.' Also in  |
| `/dev/map-bar` | keep-referenced | Linked from app/[locale]/dev/mockups/page.tsx:37 (Component boards group, 'kept for reference'). No production citation beyond tha |
| `/dev/map-behavior` | keep-referenced | app/[locale]/_components/search/SearchTemplate.tsx:544,1910 and MapSalonDetail.tsx:20,37,43 cite it repeatedly as the owner-approv |
| `/dev/map-extras` | keep-referenced | Linked from app/[locale]/dev/mockups/page.tsx:38. Also cited by app/[locale]/dev/map-interact/page.tsx:5 as a sibling reference. I |
| `/dev/map-full` | keep-referenced | Cited as 'the approved map' by map-single:10, map-motion:14,53, map-interact:6,10, map-browse:5, map-behavior:9,133, map-zoom:12.  |
| `/dev/map-motion` | keep-referenced | SearchTemplate.tsx:40,94,416,1794,1837,1863,1907 cite it 6+ times as the owner-approved (2026-07-02) grounding for the unified sea |
| `/dev/map-v2` | keep-referenced | Linked from app/[locale]/dev/mockups/page.tsx:35 ('Map experience v2... kept for reference', Component boards group). |
| `/dev/map-zoom` | keep-referenced | components-legacy/MapView.tsx:35,259,267,316 cite it 4 times as 'owner-picked' grounding for the M2 Soft zoom-enter motion. Fully  |
| `/dev/mockups` | keep-referenced | Functions as the owner's live navigation hub: its own header states 'owner 2026-07-02: all mockup link dead... ONE stable entry po |
| `/dev/pin-label` | keep-referenced | Linked from app/[locale]/dev/mockups/page.tsx:29 ('Pin label, settled'). _plans/MAP_SEARCH_REFINE.md:219,245 record it SETTLED. co |
| `/dev/primitives` | keep-referenced | _design-system/components/Toast.md:61,206 and DateTimePicker.md:27 cite it explicitly as the canonical live demo ('dev/primitives/ |
| `/dev/results-browse` | keep-referenced | app/[locale]/_components/search/SalonResultCard.tsx:72,83,442,541 and SearchTemplate.tsx:150,1552 cite it repeatedly as the ground |
| `/dev/results-full` | keep-referenced | SalonResultCard.tsx:71,83,171,442,502 and SearchTemplate.tsx:150,1552 cite it as the owner-approved (2026-07-02) grounding for the |
| `/dev/search-model-b` | keep-referenced | app/[locale]/_components/search/SearchOverlay.tsx:870 cites it directly as 'design source of truth.' _plans/SEARCH_MAP_OVERHAUL.md |
| `/dev/search-rich` | keep-referenced | _plans/SEARCH_MORPH.md:47-48 explicitly documents it as shipped: 'RICH SEARCH WIRED 2026-07-01 (mockup /dev/search-rich V2, owner  |
| `/dev/spec-chip` | keep-referenced | SalonResultCard.tsx:86,480,483 and SearchTemplate.tsx:196 cite it as the owner-approved (2026-07-03, size M, no icon) grounding fo |
| `/dev/suggest-full` | keep-referenced | Linked from /dev/mockups:22. _plans/MAP_SEARCH_REFINE.md:305,309 track it including the fabrication fix ('removed the FABRICATED p |

Routes marked `dead-delete` or `graveyard-record` need a `_design-system/REMOVED.md` line in the same turn they are deleted (`npm run removed`), per the exists-check protocol.
