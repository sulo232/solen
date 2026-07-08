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

## Not yet covered (WAVE 2)

- ~55 `/dashboard/*` owner+admin routes (design contract + consistency + states; psychology laws mostly n/a)
- ~40 `/dev/*` internal mockup routes (triage: dead / graveyard / keep)
