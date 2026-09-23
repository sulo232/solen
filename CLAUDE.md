<!-- Claude copy of AGENTS.md, adapted 2026-09-23. AGENTS.md stays the Codex file; change both when a Solen rule changes. -->
# Solen.ch

Swiss beauty and wellness booking marketplace. Next.js App Router, Supabase, and Stripe. Netlify deploys from `main`. Scheduled production work runs through `.github/workflows/cron-jobs.yml`. Supported locales are de, en, fr, and it.

## Current decisions and boundaries

This file owns Solen product, design, repository and specialist workflow rules. General communication, questions, evidence, delegation, review and continuity are owned by [global instructions](/Users/sulo/.claude/CLAUDE.md); do not duplicate them here. System/developer instructions and the current user instruction remain higher priority. The precedence chain below orders Solen sources.

The current visual direction is settled: use Fresha as the base for structure and placement, and Airbnb for look and motion, within Solen's locked values, statutory floors, and dated decisions. Capture the exact reference surface; do not infer it from another screen or from memory.

An explicit owner commission for multiple genuinely different directions or net-new exploration is a scoped exception to that production template. Within the commission, directions may vary product anatomy, layout, type, shape, hierarchy, decorative treatment, and responsive motion without separate permission for each literal. Visually inspected Fresha, Airbnb, X, 21st, Iconly, or other named surfaces are evidence and inspiration for the commissioned aspects; they do not force every direction onto one reference layout. Reuse actual data, behavior, and accessible primitives where useful, but do not force the same full-page copy, component anatomy, or production template across every direction. The commission's calm, non-loud color preference, clean ordinary typography, and meaningful responsive reactions remain binding. This exception authorizes exploration only: production implementation and adoption as design law still require explicit owner approval, and a complaint is never approval.

The current focus decision is also settled. Pointer click and tap cause no visible focus change. Keyboard navigation keeps a visible ink focus indicator on every interactive element, including inputs. This decision governs even where its implementation has not merged; repeating the instruction does not prove the code is present. The filled-ink empty-state CTA remains locked.

Two September 6 rejections remain settled: keep code sign-in as it is, and keep the entire home page as it is without visual changes. These do not prohibit a separately authorized functional bug fix, and a later explicit owner instruction can supersede either decision. The source records are [D, code sign-in](/Users/sulo/Documents/solen/_plans/R2_FEEDBACK_2026-09-06.md:21) and [J, home page](/Users/sulo/Documents/solen/_plans/R2_FEEDBACK_2026-09-06.md:64). Both decisions are preserved in the integrated dated record; its historical implementation claims still require current-source verification.

One radius choice remains open. The general button and chip lock is 16px, while the approved payment lift screen uses a capsule CTA. Do not change radii while inferring a resolution. The owner must decide whether that payment CTA is a named exception or the 16px lock governs it.

The CTA label size is settled at 15px on phone and desktop (owner, 2026-09-23; recorded in `_design-system/LOCKFILE.md`).

## Check what exists before creating

Before creating or proposing a page, endpoint, component, migration, library utility, or mockup, run `npm run exists <keyword>` with the concept and its synonyms.

- A hit means reuse or extend. Read `_inventory/STATUS.md` for partial and deprecated flags.
- Check `_design-system/REMOVED.md`. An owner-deleted or rejected idea requires explicit owner approval before it returns.
- DB tables, row counts, and RLS come from `_inventory/_db-snapshot.json`. Columns come from `_inventory/_db-columns.json`; the snapshot and `npm run exists` do not establish columns.
- `_inventory/SURFACE.md` is the full inventory.
- Every new mockup records an `Exists-check:` line naming the existing target surface, any removed hits, and the genuinely new part.
- When the owner rejects or deletes a feature, add its keywords, description, reason, and decision record to `_design-system/REMOVED.md` in the same turn.

## Finish the job

Follow global continuity for completion, pauses and changed scope. Keep Solen workstream decisions in `_plans/ACTIVE.md`; park a non-blocking decision under its current workstream, continue independent work and surface it at close.

Migration-specific decisions and pauses belong to `_plans/EVERYTHING_TO_CODEX_2026-09-04.md` and its owning task. Verify their current scope before resuming that work; they are not a global prohibition on separately authorized product work.

## Scoped design rules

Before any visual decision, proposal, mockup, implementation or review, read the [scoped design contract](_design-system/SOURCE.md#scoped-design-contract) in the current checkout: Taste rules, Visual acceptance floors, and Locked design contract. These moved sections retain this file's pinned-rule precedence. They include customer/operator scope and the commissioned-exploration exception. Nonvisual work loads design detail only when its task depends on it.

## Design system and references

Before UI work, read `_design-system/PRINCIPLES.md`, then the three scoped contract sections linked above and the additional `_design-system/SOURCE.md` sections relevant to the surface. Read enough surrounding context to interpret each applicable rule; a new phase alone does not require rereading unchanged sources. `_design-system/LOCKFILE.md` wins literal conflicts. Read `_design-system/TASTE_LOG.md` for the covered surface and `_design-system/TASTE_AUTHORITY.md` to determine DECIDE, SHOW, ASK, or PARK. Mockup-first still governs every visible choice the owner can distinguish.

Confirm a named skill is present in the current available-skills catalog before relying on it; a pointer alone is not runtime readiness. Use the current `reference-lock` skill for any named visual reference. Use `fresha-section-capture` first for a Fresha-based production rebuild. Production structure and placement come from the exact Fresha surface; production look and motion come from the exact Airbnb surface; Solen primitives, tokens, fonts, floors, accessibility, sparse blue, light-only web, and ink CTA discipline remain in force. In an explicit owner-commissioned multi-direction or net-new exploration, captured references ground the aspects named in the commission but do not collapse the alternatives into one structure or treatment. Named reference capture never overrides a legal, safety, or dated owner decision.

Read `_design-system/COMPONENT_REGISTRY.md` before building a component. A new shared component requires `_design-system/components/<Name>.md` and a registry entry in the same authorized change. Components have the required Layer 1, 2, and 3 definitions. Do not add category-specific branches.

Customer-facing screens must reach 6/6 Pass in the current `_design-system/SENIOR_SCORECARD.md`: Copy, Emphasis, Color, Type, Structure, and Floors. Use `_design-system/WORK_TYPES.md` for task classification and `_design-system/WAVE_PLAN.md` for the current roadmap. The scorecard is an acceptance criterion, not proof by itself; inspect the rendered screenshot and measured DOM.

Other current owners: `_design-system/CONTROL_ELEVATION.md` for elevation, `_design-system/MOTION.md` for motion, `_design-system/PROCESS.md` for design scope and review, `solen-drift-check` for static drift, `_design-system/components/<Name>.md` for components, `_design-system/QUESTIONS.md` for open choices, and `_design-system/TASTE_LOG.md` for dated decisions.

## Mockup first

Main owns all Solen design: references, taste, composition, states, motion, the artifact and final rendered fidelity. Subagents may collect independent references/assets, research distinct hypotheses, faithfully implement a precisely approved design or review consequential work. Missing creative choices return to main. The global rule determines whether delegation and independent review are justified; `fable-execution` owns consequential contracts.

The next useful design milestone is a reviewable mockup with simulated payment. Real payment/backend integration and font-serving endpoints follow approval unless explicitly commissioned for that milestone. Preserve requested directions, counts, data truth, security, payment and accessibility checks. Approval binds the actual artifact and its widths, states and motion; verify the same scenario after implementation. Rejected or paused mockups remain paused.

Before any visual or design change reaches product code, show a mockup or preview and obtain approval. A complaint is input to a new round; it is never approval.

1. For a production-directed change, copy the real page or component and apply only the proposed change. Use real components, data, tokens, and dimensions. For an explicit owner-commissioned multi-direction or net-new exploration, reuse actual data, behavior, and accessible primitives where useful, but each direction may use its own full-page composition and anatomy within the commission.
2. Change treatment only unless the authorized decision is structural. An explicit commission for multiple genuinely different directions or net-new exploration authorizes structural variation inside those mockups. Do not silently change layout, copy, icons, or content outside the commissioned decision.
3. Match the mockup scope to the decision. One element or section uses real-size stacked variants in one viewport. Whole-page decisions use whole-page mockups. Preview routes carry no unrelated product chrome.
4. Hardcoded mockup copy is English. Real components that render translated copy through i18n are exempt. Provide `/en/` review links.
5. After approval, edit the real component within the authorized task, then verify the same scenario again.

After a visual change, provide a clickable Cloudflare quick-tunnel URL to the real route. Reuse a live session tunnel; never provide a LAN address as the preview.

## Visual triggers

Use the named current skill before editing or offering an opinion:

| Input | Required first procedure |
|---|---|
| Reference image or screenshot | Read `pixel-spec-auto` and run its documented extractor. If detection misses borderless geometry, sample pixels directly; use `screenshot-spec` when the measured spec remains incomplete. |
| Selected-element context | Use the available browser tools. Measure `getBoundingClientRect()` and `getComputedStyle()` on the element, its container, and siblings. Report the numbers, then one fix. |
| Overlap, clipping, imbalance, mismatch, different heights, comparison, or "still wrong" | Measure the real UI through the available browser tools and measure the reference before editing. Do not assume the recently changed element is the cause. |
| Fresha-named structure rebuild | Read `fresha-section-capture`; capture the exact live surface. Use Fresha for structure/placement and Airbnb for look/motion within Solen rules. |
| Any other named brand, platform, surface, or liked aspect | Read `reference-lock`; resolve the brand, platform, exact surface, and aspect; capture the real behavior and measurements; save the captured specification under `_design-system/references/<brand>--<surface>.md`; record that path in the existing brief or workstream and re-read it before building. |
| Any visual change completed | Perform the measured checks in [SOURCE.md, Visual acceptance floors](_design-system/SOURCE.md#visual-acceptance-floors) against the applicable reference and owners. Apply the global review threshold; no automatic Gemini critique, external-provider fallback or renamed substitute. |
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

Read and confirm the target, change only the lines required by the request, and inspect the owned diff while accommodating concurrent work. Use the narrowest adequate validation. A full build requires task authorization and must not disturb shared services.

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

Main owns Solen backend architecture, data ownership, API/authorization contracts, failure/retry/concurrency decisions and causal diagnosis. A justified delegate may implement a bounded approved contract, research a distinct hypothesis or independently review consequential work. Apply global risk/delegation rules and `fable-execution` for consequential contracts, including main-authored changes.

- Functional rules live in `_rules/*`. Read the relevant current rule before code safety, structure, i18n, security, database, or known-pitfall work.
- Before changing a surface, search `_rules/LESSONS_LEARNED.md` by the affected paths, component or feature and symptom. Read the matching entries in full and follow current governing rules when historical advice conflicts. Reuse relevant entries already read when their source and task conditions are unchanged. In the same turn as fixing a non-obvious bug or footgun, update its existing entry or add the missing lesson with file bindings, the observed failure, supported cause and a concrete prevention step. Keep bindings current when files move. Routine typos and failures already fully explained by an existing compiler check do not need duplicate lessons.
- Append incomplete features to `_tasks/INCOMPLETE_FEATURES.md` with file, line, blocker, and next step. Never delete an entry without a separately authorized resolution.
- Never use an empty `.catch(() => {})`. Log errors with component and action context. Auth failures log and redirect to login. Payment failures log, show a user-visible error, and offer retry.


## Specialist skills

Use `fable-frontend` for Solen UI, visuals, interaction and mockups; `fable-backend` for API, database, auth, payment, jobs, security and performance; and `fable-psychology` for conversion, retention, onboarding, pricing display, social proof, notifications, loyalty, defaults and waiting feedback. Load only the applicable skill and follow its current contract. General execution/reasoning and current Claude documentation routing remain global.

## Solen precedence

Within Solen documents, higher items win. None outranks system/developer instructions or tool policy. A later explicit owner decision supersedes an older one.

1. The owner's current literal instruction.
2. Statutory and safety floors: WCAG 2.2 A and AA on published customer surfaces; Swiss nFADP; GDPR for EU data subjects, including special-category allergy and treatment notes; Swiss PBV total-price rules; and claims made by the Terms of Service. When taste conflicts with a floor, surface both and propose a treatment that preserves the taste intent while satisfying the floor.
3. An actual current tool or runtime denial.
4. `_design-system/LOCKFILE.md` frozen literals.
5. This file's pinned rules, including the three relocated [scoped design contract sections](_design-system/SOURCE.md#scoped-design-contract), plus its trigger and exists-check rules. This tier covers those named sections, not all of SOURCE.md.
6. `_design-system/TASTE_LOG.md` dated decisions, then `_design-system/TASTE_AUTHORITY.md` for DECIDE, SHOW, ASK, or PARK.
7. Current project memory, reverified against files before use.
8. Global `~/.claude/CLAUDE.md` and applicable current skills.
9. Generic checklists and `_rules/*` where higher sources do not supersede them.

Use the current `fable-reasoning` skill for the full conflict-resolution procedure.
