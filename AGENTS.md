# Solen.ch

Swiss beauty and wellness booking marketplace. Next.js App Router, Supabase, and Stripe. Netlify deploys from `main`. Scheduled production work runs through `.github/workflows/cron-jobs.yml`. Supported locales are de, en, fr, and it.

## Current decisions and boundaries

This file applies within system and developer instructions. A later explicit user instruction wins. The precedence chain at the end orders Solen sources within that hierarchy.

The current visual direction is settled: use Fresha as the base for structure and placement, and Airbnb for look and motion, within Solen's locked values, statutory floors, and dated decisions. Capture the exact reference surface; do not infer it from another screen or from memory.

The current focus decision is also settled. Pointer click and tap cause no visible focus change. Keyboard navigation keeps a visible ink focus indicator on every interactive element, including inputs. This decision governs even where its implementation has not merged; repeating the instruction does not prove the code is present. The filled-ink empty-state CTA remains locked.

Two September 6 rejections remain settled: keep code sign-in as it is, and keep the entire home page as it is without visual changes. These do not prohibit a separately authorized functional bug fix, and a later explicit owner instruction can supersede either decision. The source records are [D, code sign-in](/Users/sulo/Documents/solen/_plans/R2_FEEDBACK_2026-09-06.md:21) and [J, home page](/Users/sulo/Documents/solen/_plans/R2_FEEDBACK_2026-09-06.md:64). Both decisions are preserved in the integrated dated record; its historical implementation claims still require current-source verification.

One radius choice remains open. The general button and chip lock is 16px, while the approved payment lift screen uses a capsule CTA. Do not change radii while inferring a resolution. The owner must decide whether that payment CTA is a named exception or the 16px lock governs it.

The phone CTA label size is also open in `_design-system/LOCKFILE.md`. Use its current working default of 14px on phone and 15px on desktop until the owner resolves 14px against the four-size screen budget; do not present either value as a final new lock.

## Check what exists before creating

Before creating or proposing a page, endpoint, component, migration, library utility, or mockup, run `npm run exists <keyword>` with the concept and its synonyms.

- A hit means reuse or extend. Read `_inventory/STATUS.md` for partial and deprecated flags.
- Check `_design-system/REMOVED.md`. An owner-deleted or rejected idea requires explicit owner approval before it returns.
- DB tables, row counts, and RLS come from `_inventory/_db-snapshot.json`. Columns come from `_inventory/_db-columns.json`; the snapshot and `npm run exists` do not establish columns.
- `_inventory/SURFACE.md` is the full inventory.
- Every new mockup records an `Exists-check:` line naming the existing target surface, any removed hits, and the genuinely new part.
- When the owner rejects or deletes a feature, add its keywords, description, reason, and decision record to `_design-system/REMOVED.md` in the same turn.

## Finish the job

Finish an authorized multi-step task before reporting. Do not stop after each item for another "ok." Pause only for a blocking user-owned decision, a design or taste choice that requires a mockup, a credential, or an unauthorized destructive or irreversible effect.

Park a non-blocking decision in `_plans/ACTIVE.md` under its current workstream, continue independent work, and surface it at close. "Ok," "continue," and "go" mean finish the authorized list.

## Taste rules

These rules are the compact in-context layer. `_design-system/SOURCE.md` owns the full system, `_design-system/LOCKFILE.md` owns frozen literals, and `_design-system/TASTE_LOG.md` owns dated screen decisions. On an aesthetic conflict, LOCKFILE wins unless a later owner decision explicitly supersedes it.

1. **No fabricated data.** Never render a number or status without a live source. Omit it and name the wiring gap. Seeding the database is valid and expected when a real section is empty: data read through the normal query is sourced data. Hardcoded JSX or component values with no source remain fabrication.
2. **No decorative artifacts.** Remove separator dots, status pips, duplicate price text, and filler. When color or weight already separates adjacent facts, do not add another separator.
3. **Use neutral surfaces and sparse blue.** Aim for roughly 80 percent white or cool `#F4F4F5` surfaces, roughly 17 percent ink and supporting imagery, and sparse `#276EF1` only on small clickable accents such as text links, small buttons or chips, and tappable review counts. Big CTAs stay ink. See-all arrows stay ink. Secondary buttons are neutral outlines. Filters are neutral: selected is `bg-s-bg-sunken`, `text-s-ink`, semibold; never blue or ink-filled. Booking date and slot selections may use blue.
4. **Use semantic color by role and contrast.** Against white and `#F4F4F5`, respectively: star `#FFC32B` is 1.60/1.46, warning `#F1AE27` is 1.94/1.77, success `#16A34A` is 3.30/3.00, heart `#FF3366` is 3.55/3.23, accent `#276EF1` is 4.58/4.17, and error `#DC2626` is 4.83/4.39. Star and warning need a stroke or darker companion when they carry meaning alone. Success and heart are icon colors, not body text. Accent and error fail AA body text on the sunken surface. Keep universal colors: yellow star, normal green success disc with white check, availability green, red error, and pink save heart.
5. **Keep focal color vivid and emphasis coherent.** Never use dark `.text` tokens such as `#906309` or `#9A3412` as a focal fill. Use a vivid default token or surcharge orange `#EA580C` on a light tint. Apply emphasis to the complete meaningful unit. If a card has both an ink name and price, the name is larger.
6. **Use refined pastel status treatments.** Inline chips use pastel backgrounds, ink text, and a saturated icon. The success disc is `#16A34A` with a white check, not deep green or a pale disc.
7. **Elevation depends on context.** The one primary commit action uses ink fill. Controls over photos use `FROST_GLASS` from `lib/frost-glass.ts`. Calm controls on white or stone are flat with no shadow. Do not place a white shadowed control on a calm white surface.
8. **Use the locked fonts.** Inter Tight for display and headings, Inter for body, and Inter Tight with tabular numbers for codes. Never use Geist.
9. **Ground every value in the system.** Take size, affordance, selected state, copy, and tokens from a locked component or current owner. Refine an existing affordance instead of replacing it by eye. Ask when a required value remains unlocked after investigation.
10. **No long dashes or product emoji.** Do not use em dash or en dash characters in UI copy, code, comments, or commits. Emoji and playful tone are chat-only.

## Visual acceptance floors

Name the screen class before applying these rules. Customer screens include discovery, search, PDP, booking, checkout, profile, and Inspo. Operator screens include `/dashboard/*`, merchant terminal, and queue display.

Operator screens follow the current merchant rules in `_design-system/TASTE_LOG.md`: one carded hero per screen; remaining content is bare text on the canvas; gaps use 16 or 32; one pill specification per context; no colored edge bars; a person or event appears exactly once. A container is earned only when it does something whitespace cannot. Operator screens have no imagery, semantic-color, or sunken-tray floor. Their life source is live data.

For every customer UI or mockup, the working assistant runs a measured check against the correct screen scope. Inspect the rendered screenshot, DOM, interaction, accessibility, and real data. Measure font sizes and weights, focus state, content density, container boundaries, and the scroll distance from the last required input to the commit action. Ordinary low-risk reversible visual work does not require a separate reviewer. Add one independent reviewer only when actual consequence, uncertainty, or reach requires it; that reviewer can cover all applicable visual, code, and security criteria. A customer UI that violates a floor is not ready.

### Never-again floors

1. **Web has one light theme.** No `prefers-color-scheme: dark`, `data-theme="dark"`, or dark-mode CSS in web files. iOS may retain dark mode.
2. **Type budget:** use 3 to 4 distinct font sizes and no more than 2 weights on one rendered screen.
3. **Empty state:** icon, message, and CTA form one vertically centered unit. Message-to-CTA gap is at most 24px. Trapped space below the primary action is less than 30 percent of the viewport.
4. **Dense commit screen:** the primary commit action is sticky/fixed or appears within roughly one additional viewport height after the last required input is satisfied, regardless of preceding content.
5. **Focal treatment:** use clean ink or a vivid default semantic token. Never use a washed-out gray disc or dark text-token fill as the focal.
6. **Measured reference:** pixel-measure the exact supplied reference. Use `pixel-spec-auto`; if borderless geometry defeats detection, sample pixels directly. Match measured size, ratio, gutter, and type. Record a `measured:` note.

### Customer finished-screen pass

Every customer screen and mockup answers all six in a `floors:` note:

1. A photographic focal is present unless the screen is an exempt form, checkout payment step, legal page, or receipt.
2. Exactly one element is clearly the biggest.
3. At least one real tabular number is present.
4. At least one semantic-color moment is present.
5. There is no dead-gray zone.
6. The longest plausible salon name, full review, and longest service name do not break the two-ink-anchor card rule, the 28px display anchor, or load-bearing copy.

### Customer density and hierarchy

- Imagery is satisfied by real salon content, never by a decorative hardcoded hero or banner. At 390x844, customer browse, discovery, and PDP screens carry roughly one-third photographic area. A SalonCard photo is its largest element. Missing imagery uses the specified sunken background, category icon, and initial fallback rather than an empty gray box. Mockups use real seeded photography.
- Design the populated state first. PDP gallery has at least 5 photos, reviews show at least 3, services show at least 6 rows, and home has at least 4 sections. A first viewport shows at least 4 content units on mobile or 6 on desktop plus a visibly cropped next item. Cards render their full data-backed information stack. Loading, empty, and error states derive from that layout.
- A real thin salon may fall below count floors. It keeps no-fabrication, the missing-photo fallback, and one honest sub-state for each below-floor section.
- Above roughly three times the floors, group and cap: 80 or more services by duration or category, more than 12 visible reviews behind recent-plus-distribution treatment, and more than 12 inline gallery photos behind a lightbox.
- Every elevated container needs a visible boundary on its actual background: sunken tray, flush photo edge, hairline on white, or elevation 2. Grouped content on white with no photo anchor uses a sunken tray. Alternate gray and white for rhythm. Cool chrome needs photography or semantic color in the viewport.
- A deletion must name the cue that remains. It is legal only when the survivor has a between-group gap at least twice the in-group gap or a full weight, size, or color step. Every new ceiling states its paired floor or states that none exists.
- Every customer screen has a display anchor at least 28px unless photography is the focal. Card name is larger at weight 600; price is smaller, weight 600, and tabular; rating is ink-2 beside a yellow star. `#9CA3AF` is chart-only. Chevrons, placeholders, timestamps, and hints use `#6B6B6B`; load-bearing copy does not.
- At most roughly 30 percent of visible text may be weight 600 or above. This is a house threshold with no external study; cite it as a Solen guardrail, not research. The anchor is at least 1.8 times body size, derived from the 28px anchor over the 16px body and rounded from 1.75. Count both type variety and total spread.
- Every paid commit action shows the base, surcharge, and VAT where applicable; the cancellation or refund term in the DOM above the action; and the salon or stylist identity above the action.

### Composition

- The same entity uses the same component and anatomy across screens. Different densities are named variants of one component.
- If `_design-system/COMPONENT_REGISTRY.md` owns an element, compose that component. Do not recreate it inline in a page or feature file.
- Name the screen's one job and justify every element against it. Remove an element that serves another screen's job.

## Locked design contract

Do not reopen a frozen row without the owner naming it. `public/solen-styleguide.html` is the visual rulebook. `_design-system/LOCKFILE.md` is the current literal owner.

| Axis | Current rule |
|---|---|
| Selected and active | Gray `bg-s-bg-sunken`, `text-s-ink`, semibold over white; menu/list options add a check. Content tabs use title plus 2px ink underline, active 600 ink, inactive 400 ink-2. Named exceptions: the one commit button stays ink; booking date/slot stays blue; `SelectedCheckBadge` stays ink over a photo; booking services-step category pills use ink fill. |
| Mockup base | Follow `public/_mockups/_BASE.md`: 402 device constant, full bleed, no fake phone, fonts measured by word width, full-coverage box diff, `-webkit-text-size-adjust:100%`, `100dvh`, safe area for fixed bars, real self-hosted salon photos, and no remote dependencies. Final visual comparison uses a full screenshot diff at the owner's viewport. |
| Links and buttons | Text links use `#276EF1` with underline on hover. See-all arrows and the primary CTA are ink. Secondary buttons are neutral outlines. |
| Depth | SalonCard uses photo plus `shadow-whisper` and no border. Grouped list card uses whisper. PDP/booking sidebar uses hairline only. A tile on gray is white with no shadow. Overlays use elevation 2 or 3. A card has either elevation or border, never both. Over-photo controls use frost; sticky bars use gradient fade. |
| Type | Name 14; meta 12; section H2 `clamp(18px,2vw,20px)`; body 14; CTA 14 on phone as the current working default and 15 on desktop while the phone value remains open; eyebrow 11; customer display anchor at least 28. For a fixed-height one-line control, measure the longest de/en/fr/it string against its maximum width; allow an intentional two-line design or prove it fits. |
| Imagery | Customer browse/discovery/PDP at 390x844 is roughly one-third photographic. SalonCard photo is largest. Missing-photo fallback is sunken plus category icon plus initial. Mockups use seeded photos. Forms, payment checkout, legal pages, and receipts are exempt. |
| Density | Populated target: gallery 5, reviews 3, services 6, home 4 sections; first viewport 4 mobile or 6 desktop plus cropped next item. Above roughly 80 services, 100 reviews, or 40 photos, group and cap. Real thin salons use honest below-floor substates. |
| Hierarchy | Name leads by size. Price is bold ink but smaller. Rating uses a yellow star. Category, city, and distance recede. |
| Availability | Plain ink text, never a green pill. |
| Radius | Form/summary card 16 with `rounded-card` and `shadow-elevation-1`; grouped category-member list card 24 with `rounded-[24px]` and `shadow-whisper`; individual entity card 16, flat with border and gaps; input 12; sheet 28; image flush 0. Button/chip remains 16 except for the unresolved approved payment-screen capsule choice stated above. |
| Spacing | 4px scale; card padding `p-4` or `p-3`; page maximum 1280px, PDP 1180px. |
| Wrapping | Name and meta truncate; title wraps; body clamps; price and rating do not wrap. |
| Icon button | `h-11 w-11`. |
| Hairline | `border-s-border` is `#E4E4E7`. |
| States | Loading uses `<Skeleton>` matching final geometry. Empty uses `<EmptyState>` with an 18/600 promise headline, gesture subline, filled ink CTA to the filling action, and a 3D category icon or ghost preview on a sunken tray. Error uses `<ErrorState>` inline or `ErrorFallback` for a route. Use registered components. |
| Focus | Inputs rest on white with a 1px `#E4E4E7` line, height 48, radius 12. Pointer click and tap change nothing visible. Keyboard focus uses a visible ink indicator on inputs, buttons, links, and other interactive elements. No halo. This decision may be ahead of merged implementation; verify the current code and rendered behavior. |
| Disabled | `opacity-50 cursor-not-allowed`. |
| Touch target | At least 44px, normally `h-11`. |
| Filter pill | Selected gray `bg-s-bg-sunken`, `text-s-ink`, semibold; unselected white with hairline; hover deepens text. Never blue-bordered or black. |
| Category tag | Neutral `bg-s-bg-sunken` plus `text-s-ink-2`; no per-category color. On-photo eyebrow is white. |
| Date/time | Use one `DateTimePicker` primitive with booking strip or search calendar layout. Do not build bespoke date UI. |
| Navigation | Sub-page navigation is single. Do not stack home and back. The city/category breadcrumb replacement is incomplete: current code can suppress the global breadcrumb without rendering the passed local chain. A visible restoration requires a mockup first. |
| Sticky CTA | A commit action is sticky/fixed or within roughly one viewport after the last required input. Reuse `SalonMobileBookBar` on PDP and the booking running-summary treatment where applicable. |
| Theme | Web is light-only. iOS may keep dark mode. |

States are componentized and locked. Use the registered components rather than hand-building equivalents.

## Design system and references

Before UI work, read `_design-system/PRINCIPLES.md`, then `_design-system/SOURCE.md`. `_design-system/LOCKFILE.md` wins literal conflicts. Read `_design-system/TASTE_LOG.md` for the covered surface and `_design-system/TASTE_AUTHORITY.md` to determine DECIDE, SHOW, ASK, or PARK. Mockup-first still governs every visible choice the owner can distinguish.

Confirm a named skill is present in the current available-skills catalog before relying on it; a pointer alone is not runtime readiness. Use the current `reference-lock` skill for any named visual reference. Use `fresha-section-capture` first for a Fresha-based rebuild. Structure and placement come from the exact Fresha surface; look and motion come from the exact Airbnb surface; Solen primitives, tokens, fonts, floors, accessibility, sparse blue, light-only web, and ink CTA discipline remain in force. Named reference capture never overrides a legal, safety, or dated owner decision.

Read `_design-system/COMPONENT_REGISTRY.md` before building a component. A new shared component requires `_design-system/components/<Name>.md` and a registry entry in the same authorized change. Components have the required Layer 1, 2, and 3 definitions. Do not add category-specific branches.

Customer-facing screens must reach 6/6 Pass in the current `_design-system/SENIOR_SCORECARD.md`: Copy, Emphasis, Color, Type, Structure, and Floors. Use `_design-system/WORK_TYPES.md` for task classification and `_design-system/WAVE_PLAN.md` for the current roadmap. The scorecard is an acceptance criterion, not proof by itself; inspect the rendered screenshot and measured DOM.

Other current owners: `_design-system/CONTROL_ELEVATION.md` for elevation, `_design-system/MOTION.md` for motion, `_design-system/PROCESS.md` for design scope and review, `solen-drift-check` for static drift, `_design-system/components/<Name>.md` for components, `_design-system/QUESTIONS.md` for open choices, and `_design-system/TASTE_LOG.md` for dated decisions.

## Mockup first

Before any visual or design change reaches product code, show a mockup or preview and obtain approval. A complaint is input to a new round; it is never approval.

1. Copy the real page or component and apply only the proposed change. Use real components, data, tokens, and dimensions. Never substitute a from-scratch HTML redraw.
2. Change treatment only unless the authorized decision is structural. Do not silently change layout, copy, icons, or content while presenting a treatment choice.
3. Match the mockup scope to the decision. One element or section uses real-size stacked variants in one viewport. Whole-page decisions use whole-page mockups. Preview routes carry no unrelated product chrome.
4. Hardcoded mockup copy is English. Real components that render translated copy through i18n are exempt. Provide `/en/` review links.
5. After approval, edit the real component within the authorized task, then verify the same scenario again.

## Visual triggers

Use the named current skill before editing or offering an opinion:

| Input | Required first procedure |
|---|---|
| Reference image or screenshot | Read `pixel-spec-auto` and run its documented extractor. If detection misses borderless geometry, sample pixels directly; use `screenshot-spec` when the measured spec remains incomplete. |
| Selected-element context | Initialize the documented CUA entry point. Measure `getBoundingClientRect()` and `getComputedStyle()` on the element, its container, and siblings. Report the numbers, then one fix. |
| Overlap, clipping, imbalance, mismatch, different heights, comparison, or "still wrong" | Measure the real UI through documented CUA controls and measure the reference before editing. Do not assume the recently changed element is the cause. |
| Fresha-named structure rebuild | Read `fresha-section-capture`; capture the exact live surface. Use Fresha for structure/placement and Airbnb for look/motion within Solen rules. |
| Any other named brand, platform, surface, or liked aspect | Read `reference-lock`; resolve the brand, platform, exact surface, and aspect; capture the real behavior and measurements; save the captured specification under `_design-system/references/<brand>--<surface>.md`; record that path in the existing brief or workstream and re-read it before building. |
| Any visual change completed | The working assistant checks the rendered screenshots, measured DOM, interaction, accessibility, real-data scenario, relevant reference, and current design owners. Ordinary low-risk reversible visual work needs no separate reviewer. Add one native reviewer such as `design-verifier` only when actual consequence, uncertainty, or reach requires it; one reviewer can cover every applicable criterion. Do not add Gemini, an automatic external-provider fallback, or a renamed substitute. |
| Owner says the result looks bad without naming the cause | Read `solen-taste-diagnosis`; measure hierarchy, type, grouping, contrast, and applicable floors before proposing a fix. |

Capture costs less than repeated correction. A named brand is a direction, not authority to copy a solution to a different problem.

## Copy economy

Read `_design-system/COPY_LAW.md` before writing product copy in any locale. It owns formal register, sentence shape, warmth, punctuation, money/date formatting, string types, translations, and evidence. These rules own length:

1. Delete words the local context already supplies. Use "Mehr laden," not "Weitere Bewertungen laden," inside a reviews list.
2. Clamp long descriptions and reviews to roughly 150 characters or 3 lines with inline blue "Mehr lesen" that expands in place.
3. Use icon-only for an unambiguous action beside its object and keep an `aria-label`; icon plus label for a rarer action; label-only for commitments. Use one primary commit phrase per screen.
4. A tag, badge, or metadata item must add a decision-relevant fact not already present.
5. These rules bind mockups. Use normal-case 13px semibold labels, Lucide icons rather than hand-drawn paths, real status-bar glyphs, the 38px circled close control, and no fabricated product claim.

## Missing things

When a feature, column, table, route, component, file, or check is absent:

1. Say what is missing plainly in the reply.
2. Determine why before restoring it. Check `_design-system/REMOVED.md` and `_design-system/TASTE_LOG.md` for deliberate removal; search for a replacement; establish whether work never landed, only half landed, or was blocked.
3. Fix according to the cause. Leave a deliberate removal alone without new approval; point to the replacement; recover authorized unmerged work; complete the missing half; or name the exact blocker.

## Last-mile completion

A feature is complete only when its final path is connected:

- Every new copy key has a render site. Locale-key parity does not prove rendered copy or behavior.
- A printed deadline is computed, enforced, and acted on by an owner.
- A new column, table, flag, or consent toggle is read by every behavior it claims to control.
- A rendered control has a real handler or destination.
- One real end-to-end path proves the final effect: the thing renders, the guard refuses the forbidden case, or the scheduled job performs its action.

## Measurement rules

1. Treat an error on the exact route under investigation as related until a discriminator shows the symptom survives after the error stops.
2. Measure the exact named reference surface. If it has not been captured, say so and capture it before using it.
3. For a preview, use one question per screen. Show the control and its effect together in the same measured viewport at the owner's width. Put evidence and reasoning below the thing being judged. Remove unrelated product chrome.
4. Before sharing a preview, verify the fixture rows and names. Count the records and confirm they are suitable for the scenario.
5. A complaint is never approval. Do not reinterpret it into permission to ship.
6. Label every recommendation as measured from the reference, the owner's stated preference, or your own judgment.
7. Verify under the user's real conditions: fresh load through the exact link at the target width. When the task authorizes a shareable production preview and it will not disturb a shared server, use a production build with `next start`; do not restart or replace a shared server, and do not run a build outside the authorized task. If those conditions cannot be established, report the evidence gap.
8. Search the symptom in current memory and decision records before diagnosing it.
9. Exercise silent failure modes. Click the control, inspect the resulting state, and measure the affected box or data.
10. Treat a taste complaint as a possible plumbing symptom. Check font loading, hydration, data, and build/runtime errors before assigning a purely aesthetic cause.

## Surgical edits

1. Change only the lines that cause the reported issue.
2. Match the exact request scope.
3. Read and confirm the target before editing.
4. Run a build only when it is authorized by the task and will not disturb shared services. Use the narrowest adequate validation otherwise.
5. Inspect only the owned diff and accommodate concurrent edits.

## Silent no-ops

Do not assume how a missing column fails. Inspect actual returned errors, current schema, payload, and discriminating results.

- A filter must return the correct subset, not merely render or return 200. Confirm columns in `_inventory/_db-columns.json`, not only in a TypeScript type.
- Resolve computed-filter IDs before pagination, then apply `.in("id", ids)` before `.range()`. Do not filter one client-side page and claim correct counts or pagination. See `app/api/salons/route.ts`.
- `opening_hours` uses short day keys from `mon` through `sun`. Read `_rules/LESSONS_LEARNED.md` for current pitfalls.
- For every consent or notification preference, identify each real sender for that channel and prove it reads the exact preference column before sending.

## Screenshot folder

When the user says an image is in their screenshot folder, look first in `/Users/sulo/solen/screenshots/`. This is outside the project and separate from `_audits/screenshots/`. Phone images commonly use `IMG_XXXX.png`; desktop and generated images may use UUID filenames.

## Repository and external-action authorization

- Within already authorized routine repository work, use npm/npx, read-only Git inspection, type checks, and file operations as needed. Commit each verified chunk autonomously when the active task includes repository changes.
- Verify owner/auth-gated dev surfaces with `GET /api/dev/login?to=<path>` when the task authorizes local product testing.
- Never push unless the user explicitly authorizes it. Avoid unsolicited Git or push chatter. If the user directly asks whether changes were pushed, answer truthfully.
- Force push, hard reset, database data deletion, and environment-file edits require explicit authorization unless the current instruction already authorizes that exact action.
- Respect every actual tool or runtime denial. Do not seek a bypass.

## Workflow rules

- Functional rules live in `_rules/*`. Read the relevant current rule before code safety, structure, i18n, security, database, or known-pitfall work.
- Before changing a surface, search `_rules/LESSONS_LEARNED.md` by the affected paths, component or feature and symptom. Read the matching entries in full and follow current governing rules when historical advice conflicts. Reuse relevant entries already read when their source and task conditions are unchanged. In the same turn as fixing a non-obvious bug or footgun, update its existing entry or add the missing lesson with file bindings, the observed failure, supported cause and a concrete prevention step. Keep bindings current when files move. Routine typos and failures already fully explained by an existing compiler check do not need duplicate lessons.
- Append incomplete features to `_tasks/INCOMPLETE_FEATURES.md` with file, line, blocker, and next step. Never delete an entry without a separately authorized resolution.
- Never use an empty `.catch(() => {})`. Log errors with component and action context. Auth failures log and redirect to login. Payment failures log, show a user-visible error, and offer retry.

## Solen precedence

Within Solen documents, higher items win. None outranks system/developer instructions or tool policy. A later explicit owner decision supersedes an older one.

1. The owner's current literal instruction.
2. Statutory and safety floors: WCAG 2.2 A and AA on published customer surfaces; Swiss nFADP; GDPR for EU data subjects, including special-category allergy and treatment notes; Swiss PBV total-price rules; and claims made by the Terms of Service. When taste conflicts with a floor, surface both and propose a treatment that preserves the taste intent while satisfying the floor.
3. An actual current tool or runtime denial.
4. `_design-system/LOCKFILE.md` frozen literals.
5. This file's pinned taste, design-contract, trigger, and exists-check rules.
6. `_design-system/TASTE_LOG.md` dated decisions, then `_design-system/TASTE_AUTHORITY.md` for DECIDE, SHOW, ASK, or PARK.
7. Current project memory, reverified against files before use.
8. Global `~/.codex/AGENTS.md` and applicable current skills.
9. Generic checklists and `_rules/*` where higher sources do not supersede them.

Use the current `fable-reasoning` skill for the full conflict-resolution procedure.
