# Work-type taxonomy

Choose the work type by the authorized change and affected consumers. It describes work shape, not risk, spending, scanner quotas, wave boundaries or an automatic second review. Use the existing plan; no classification ledger is required.

Global instructions own review depth. Ordinary reversible work uses focused direct behavioral checks, including ordinary delegated implementation. Security, authorization, money/data integrity or material uncertainty can require independent acceptance regardless of line or file count. Record the actual consequence in the existing brief; preserve already-enrolled consequential acceptance. Project [AGENTS.md](../AGENTS.md) owns design approval, exploration scope and external-action authorization.

## The six work types

### 1. Surgical fix

A bounded single-concern change with a known cause and effect. Inspect the source and owned diff for unintended changes, then check the actual affected behavior. CSS changes require the applicable rendered and reference checks; a string or class match and a static report alone do not prove the visible result. Inspect applicable static candidates on the touched scope. A correct fix need not reduce a scanner count.

Keep the authorized concern bounded. Repeating the same known fix across files does not itself require heavier review; a change to a shared consumer contract belongs under type 3.

### 2. Route sweep

Apply current registry recipes across an existing route while retaining its components, structure and content. Read the relevant recipes first. Capture before and after screenshots at the same approved phone viewport and applicable desktop layout, compare the visible change against the approved intent, and obtain user visual sign-off under project approval rules.

Review applicable static candidates and resolve authorized defects. Neither a fixed finding reduction nor tracking-marker comments are required. Structural changes need their own authorization.

### 3. Component sweep

Change a shared component used by multiple callers. Enumerate callers with `rg` and check every distinct affected consumer contract, including inputs, states and layout context. Equivalent accepted instances may share evidence only when those conditions and expected results match.

Capture before and after screenshots for each distinct visual contract and compare for regressions. Update `components/<Name>.md` when the signature changes. Inspect applicable shared-component and consumer static candidates; do not multiply expected finding reductions by caller count. Confirm the affected component actually renders before claiming a visible improvement.

### 4. Ground-up rebuild

Compose a new page from existing primitives, with new sections or arrangement inside the authorized scope. The project's commissioned-exploration exception permits distinct compositions within that commission; it does not approve production implementation or change locked design law.

Preserve the commissioned sections, steps and counts in the existing brief. Read relevant primitive contracts, reusing unchanged accepted source and evidence. Run the narrowest authorized compile/type check that proves the changed scope; a full build needs task authorization and must not disturb shared services. Check the actual mobile and desktop render, applicable static candidates and user visual sign-off. Add independent verification only at the global risk threshold.

### 5. New primitive

Create a shared component only after the project exists check finds no suitable owner. Follow the current registry and neighboring file ownership, type the public API, and apply LOCKFILE §5's frozen prop-signature contract.

In the same turn, write `components/<Name>.md` and update `COMPONENT_REGISTRY.md` with the file path, Layer 1/2/3 contract, public API and status. Wire and test each affected consumer; include a demo when applicable. Review applicable static candidates on the primitive and consumers, resolving defects and documenting valid exceptions. Keep the primitive, documentation, registry and first-consumer wiring coherent; they do not require separate commits.

### 6. Major IA shift

Change information architecture: combine pages, add/drop routes or redirect navigation. Preserve old route content and unique semantic value in the destination unless the owner explicitly authorizes dropping them with a reason, under LOCKFILE §10.

Verify the canonical destination and actual 301 redirect from each replaced URL, including `next.config.js` rules. Audit header/dropdown, footer, sitemap/sitemap.xml, cross-page links and SEO alternates for stale destinations. Surface uncontrolled marketing-email, social-bio and external links as remaining risks. Distinguish active defects from transitional duplicates. Keep destination, redirect and cross-link updates integrated; redirect configuration alone does not prove a working route.

## Source and verification scope

For types 2 through 6, identify the affected axis (structure, aesthetic or both), current source owner and post-edit evidence before editing. Record this in the existing state when a durable trail is needed. LOCKFILE §10.8d owns the detailed source-check procedure. Revisit a source when it changes, is missing, or a failure challenges the premise; reuse sufficient unchanged evidence.

Production structure follows the exact captured Fresha surface and aesthetics follow current Solen owners. Commissioned exploration follows its authorized intent and applicable captures. Stop an edit that substitutes guessed reference geometry, invents an unapproved production token/layout, treats an aesthetic recipe as structural authority, or claims a completed route without screenshot comparison. A mockup pivot must have a stated basis in data or taste. Investigate errors on the actual route before assigning a cause; use project measurement rules and the current reasoning procedure.

## Evidence for waves, route sweeps, component sweeps and rebuilds

These scopes need both structural and aesthetic evidence before completion, under LOCKFILE §10.0. Main performs rendered checks. One independent verifier is warranted only under the global consequence, uncertainty and reach threshold. This section does not impose a whole-wave check suite on every surgical edit.

Structural evidence:

- Capture the exact Fresha section with the current capture skill. Its SPEC at `public/_pixel-refs/fresha/<section>/` is at most 30 days old, or record an explicit justified skip under the current owner.
- Compare a production candidate with captured structure unless an explicit owner decision changes it. Compare each commissioned exploration with its own intent and applicable evidence; do not force one shared layout.
- Verify that an aesthetic sweep has not added/moved sections or dropped affordances without explicit owner authorization.

Aesthetic and behavioral evidence:

- Customer production screens reach 6/6 Pass on Copy, Emphasis, Color, Type, Structure and Floors in [SENIOR_SCORECARD.md](SENIOR_SCORECARD.md). Use its drift and `npm run check:floors` evidence for countable dimensions alongside actual screenshots, measured DOM, interaction, accessibility and real data. Authorized exploration records diagnostic scores and tradeoffs; aesthetic floors/ceilings do not reject permitted variation.
- Review applicable A/B drift candidates on explicit touched targets with `solen-drift-check`. A report proves neither rendered fidelity nor broad cleanliness.
- Verify Lighthouse accessibility at least 95 and mobile Largest Contentful Paint at most 2.5 seconds, using Lighthouse or Web Vitals as appropriate.
- Verify zero contrast failures with Lighthouse/axe, reach every interactive element by keyboard, and verify screen-reader landmark/heading order H1 to H2 to H3 without skips using VoiceOver/NVDA.

Record failed production criteria or exploration tradeoffs and evidence in the current work record. Repair authorized defects and resolve both axes before shipping; ask only for a material remaining owner decision. Exploration evidence and a complaint never authorize production adoption.

## Planning and commit cadence rule

Order work by the requested useful milestone and dependencies, preserving every requested item and count. Group work by coherent outcome and rollback needs. Split navigation or primitive work when its actual risk/dependencies warrant it; a type label alone does not create another wave. Keep optional audits separate from the useful milestone, without delaying a required repair.

Commit each verified coherent outcome within repository authorization. Split when review or rollback improves; group when splitting would fragment the outcome. Keep consequential changes and their dependencies reviewable. Feature flags or separate changes follow the actual deployment/rollback contract, not a provider name. No historical marker, route count or unsupported timing estimate determines commit boundaries. A plan or commit does not authorize merge, push or deployment.

## Rollback procedure per work-type

Inspect the exact diff, dependencies and current shared-tree state before selecting a reversal that preserves others' work. Never blindly substitute a commit or merge commit into a generic reversal command.

- Surgical, route or page changes: reverse the coherent change and recheck its actual scenario.
- Shared components: include affected consumer contracts and check distinct inputs, states and layouts.
- New primitives: keep component, consumer wiring, registry and documentation consistent.
- Navigation: restore compatible destinations, redirects and links together; verify old and new URLs.
- Database/payment changes: follow the actual data, migration and external-effect contract; a code revert is not evidence of data rollback.

Production deployment, cache changes, destructive data operations and other external effects require their own existing authorization. A production deploy command is not a generic cache-clear step.

Historical session examples and the old classification tree are retained in this file's Git history at revision `8ce0a5e2f`; they are not current requirements.

## See also

- [SOURCE.md, scoped design contract](SOURCE.md#scoped-design-contract): pinned taste, floors and design contract.
- [LOCKFILE.md](LOCKFILE.md): frozen values and detailed verification owners.
- [COMPONENT_REGISTRY.md](COMPONENT_REGISTRY.md): shared primitive contracts.
- [PROCESS.md](PROCESS.md): current brief and evidence procedure.
- [QUESTIONS.md](QUESTIONS.md): open choices and decisions.
- [_pending-migration.md](_pending-migration.md): incremental drift queue.
