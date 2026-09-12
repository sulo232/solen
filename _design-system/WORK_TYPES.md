# Work-type taxonomy

Work-types describe the shape of authorized work and its affected consumers. They do not set risk, spending, scanner quotas, mandatory wave boundaries or a second review. Global instructions own those decisions; this guide supplies Solen-specific verification.

Routine styling, copy and component edits, and deterministic small bug fixes with a known cause and bounded effect, use focused direct behavioral checks. This applies across multiple files and to ordinary delegated implementation using the existing brief. A one-line auth bypass, a payment calculation, a data-integrity change, or uncertain coupled behavior can be consequential. Name the concrete consequence or material uncertainty in the existing brief before invoking structured handoff and independent acceptance. Category, line count and file count alone are not risk. Preserve user design approval and main rendered fidelity checks; do not downgrade already-enrolled consequential work.

## The 6 work-types

Commit examples below describe possible organization; the shared Commit cadence rule determines the actual boundary. Historical examples are context, not new requirements for the current task.

| # | Type | One-liner | Visual diff | Commit unit |
|---|---|---|---|---|
| 1 | **Surgical fix** | Targeted edit, single concern | Barely visible / invisible | 1 commit per fix |
| 2 | **Route sweep** | Apply registry recipes across one existing route, same structure | Noticeable but not transformative | 1 commit per route |
| 3 | **Component sweep** | Apply registry to a shared primitive — cascades to N callers | Cascading change visible across N routes | 1 commit + walk all consumers |
| 4 | **Ground-up rebuild** | Compose a new page from primitives, fresh against registry | Major — new layout possible | 1 commit per page, often with iteration |
| 5 | **New primitive** | Build a new shared component from scratch | New feature surface | Multi-commit with doc + registry entry |
| 6 | **Major IA shift** | Restructure information architecture (fuse pages, add/drop routes, redirect) | Navigation changes + redirects | Multi-commit + link audit + 301s |

---

## Per-type detail

### 1. Surgical fix

**Definition:** A bounded single-concern change with a known cause and effect. Classify its actual behavior and risk independently of line count.

**Examples (from V3-D330/D331 sessions):**
- Hex swap on a single element (`#F3A864` → `#FFC32B`)
- Letter-spacing normalization (`tracking-[0.16em]` → `tracking-[0.08em]`)
- Comment rephrase to dodge a drift-check false-positive
- Font-weight class swap on one element (`font-black` → `font-bold`)
- Dropping one decorative dot span

**Verification:**
- Read the file → make edit → confirm no other unintended change in `git diff`
- For CSS edits: perform the project-required rendered checks and reference comparison appropriate to the approved change
- For a string change (copy / hex / class), use the verification that proves the affected behavior; a static drift report alone is not visual proof

**Commit granularity:** one coherent verified outcome. Related fixes may share a commit; historical tracking markers are not required.

**Static evidence:** inspect applicable candidates on the touched scope. A correct fix need not change a scanner count; do not add unrelated edits to make a count fall.

**Anti-pattern:** Letting a bounded fix expand into unrelated work. Reclassify the work shape when the requested scope changes; repeating the same known fix across files does not itself require heavier review.

---

### 2. Route sweep

**Definition:** Apply LOCKFILE registry recipes (type roles, accent rules, eyebrow policy, etc.) across one existing route. Same components, same structure, same content — just registry-compliant classes throughout.

**Examples:**
- V3-D330 /warum-solen sweep (124 INFO findings → 59, 7 eyebrows → 0, all decorative accent → ink-3)
- V3-D330 /de homepage sweep (subtle refinements + SectionHeader eyebrow normalize)
- V3-D331 /fuer-salons dot-eyebrow sweep

**Verification:**
- Before screenshots at the approved phone viewport and applicable desktop layout; retain those same viewports for comparison
- Apply sweep
- After screenshot at same viewports
- Visual diff via eyeball — confirm transformation matches intent
- Review applicable static candidates on the touched route; the count alone does not establish correctness
- Show user the before/after screenshots; wait for visual sign-off

**Commit granularity:** use the coherent change and rollback boundary described below; do not add tracking-marker comments solely for process.

**Static evidence:** resolve applicable defects within the authorized sweep. No fixed number of removed findings is required.

**Anti-pattern:** Sweeping a route without first doing the role-recipe audit. Without the registry as the ground truth, "sweep" devolves into ad-hoc eyeballing — the original drift cause.

---

### 3. Component sweep

**Definition:** Apply registry to a shared primitive that's used by N callers. The change cascades to every page that imports the component.

**Examples:**
- V3-D330 SolenExclusiveBadge text-s-accent → text-s-ink-3 (cascades to all "Nur bei Solen" pills)
- V3-D331 BentoBusiness "Bereit dazuzukommen?" dot drop (cascades to all 3 usage variants)
- V3-D331 SectionMeta primitive dot drop (cascades to homepage "FÜR SALONS" divider + any future use)

**Verification:**
Check every distinct affected consumer contract. Equivalent accepted instances may share evidence when their component inputs, state, layout context and expected result are the same.
- Use `rg` to enumerate callers and identify distinct affected contracts
- Before screenshot of each distinct affected caller contract; group equivalent accepted instances
- Apply the component change
- After screenshot of each distinct affected caller contract using the same grouping
- Visual diff per distinct contract — confirm no unexpected regression; do not repeat identical evidence for equivalent accepted instances
- Component doc updated in `_design-system/components/<Name>.md` if signature changes

**Commit granularity:** 1 commit covering the component + consumer-route updates if needed.

**Static evidence:** inspect applicable shared-component and consumer candidates; do not multiply expected finding reductions by caller count.

**Anti-pattern:** Editing a shared component without checking every distinct affected consumer contract. Component sweeps look surgical but their impact is multiplicative — a 3-line change can break 6 routes if you ignore different inputs, states, or layout contexts.

---

### 4. Ground-up rebuild

**Definition:** Compose a NEW page from existing primitives, fresh against the registry. May invent new sections or reorganize IA. Not a copy of an old page. When the owner explicitly commissions multiple genuinely different directions or net-new exploration, the mockup directions may vary product anatomy, layout, type, shape, hierarchy, decorative treatment, and responsive motion within that commission. Use actual data, behavior, and accessible primitives where useful; do not force every direction onto the same full-page copy, component anatomy, or one reference layout. Production locks remain unchanged until the owner explicitly approves implementation or adoption as design law.

**Examples:**
- V3-D330 /fuer-salons V1 build — fresh composition of Hero + Trust + How + Bento + Marketplace + Pricing + FAQ + JoinUsCard, all registry-compliant from line 1
- V3-D220 /business V3 rebuild (earlier work — full page from scratch with Fresha bones + Solen skin)

**Verification:**
- Use the commissioned section and step scope in the existing brief; do not invent a fixed section count or extra infrastructure/polish prerequisite
- Read the relevant primitive contracts; reuse unchanged accepted source and evidence rather than rereading every import
- Run the narrowest authorized compile or type check that proves the changed scope; run a full build only when the task authorizes it and it will not disturb shared services
- Screenshot mobile + desktop
- Apply the current consequence, uncertainty, and reach threshold. The working assistant always checks the rendered route directly; add one independent native verifier only when that threshold requires it, and let that reviewer cover all applicable visual, code, and security criteria.
- User visual sign-off

**Commit granularity:** keep the approved page change coherent; group or split iterations according to the actual review and rollback boundary.

**Targeted drift expectation:** review all applicable candidates on the new file; the report does not establish rendered fidelity or broad cleanliness.

**Anti-pattern:** Calling a "ground-up rebuild" what is actually a heavy route sweep with imports unchanged. If you're using all the same primitives in the same order as an existing page, it's a sweep, not a rebuild.

---

### 5. New primitive

**Definition:** Build a new shared component from scratch that other routes will use.

**Examples (pending):**
- MapView (Section H of master plan — Mapbox-based map for /search)
- Future imagery primitives if Pattern 2 / Pattern 5 surface need wrapping

**Verification:**
- Component file placed according to the current component registry and neighboring source ownership
- TypeScript public API typed
- Per LOCKFILE §5 — primitive prop signature frozen
- Component doc written at `_design-system/components/<Name>.md` IN THE SAME TURN
- COMPONENT_REGISTRY.md updated with file path, Layer (1/2/3), public API, status
- Per-consumer integration tested
- Storybook-equivalent demo if applicable
- Review applicable static candidates on the new file and consumer changes

**Integration sequence, without mandatory separate commits:**
1. Primitive + doc + registry entry
2. First-consumer wiring
3. Additional consumers if applicable

**Static evidence:** resolve applicable findings and document valid exceptions; zero raw findings is not a substitute for acceptance.

**Anti-pattern:** Building a new component without writing its doc + registry entry in the same turn. New components without docs become orphan drift sources.

---

### 6. Major IA shift

**Definition:** Restructure information architecture — fuse pages, add new routes, drop deprecated routes, set up 301 redirects, audit cross-page links.

**Examples:**
- V3-D330 Section G fusion: /business + /partner → /fuer-salons (V1 done, V2 + redirects pending)
- Future: /search/map carve-out (Section H if user picks separate route)

**Verification:**
- All old route content captured in new route OR explicitly dropped with reason
- 301 redirects in place for old routes
- `next.config.js` redirect rules tested (curl old URL → confirm 301 → new URL)
- Header dropdown / sitemap / footer / sitemap.xml audited for stale links
- Marketing emails / social bios / external links — surfaced as risk if can't be controlled
- Per LOCKFILE §10 conflict resolution — if old route had unique semantic value, that must be preserved or explicitly killed

**Integration sequence, without mandatory separate commits:**
1. New canonical route built
2. Redirects added
3. Cross-link audit + updates
4. Sitemap + SEO alternates update

**Static evidence:** distinguish active-route defects from transitional duplicates; prove final destinations and redirect behavior.

**Anti-pattern:** Building a "fused" page without 301 redirects. Users land on old URLs from bookmarks / search engines / external links — without redirects, they 404 or hit a stale page.

---

## Pick the right type — decision tree

```
Is the change a bounded single concern with a known cause and effect?
├─ Yes → Surgical fix (type 1)
└─ No
   │
   Is it the same pattern applied across many places in one route?
   ├─ Yes → Route sweep (type 2)
   └─ No
      │
      Is it editing a shared primitive that's imported by N routes?
      ├─ Yes → Component sweep (type 3) — check distinct affected consumer contracts
      └─ No
         │
         Are you building a new page (or rewriting an existing page top-to-bottom)?
         ├─ Yes, existing primitives only → Ground-up rebuild (type 4)
         ├─ Yes, also building a new component → New primitive (type 5) THEN rebuild
         └─ No
            │
            Are you adding / removing / fusing routes?
            ├─ Yes → Major IA shift (type 6) — redirects + link audit
            └─ Re-scope. The work doesn't fit a type — split it.
```

---

## Wave-planning rule

When building a wave plan:
1. **Identify the work shape in the existing plan when useful.** Choose verification from the actual consequence and affected behavior, without a new classification ledger or fixed effort budget.
2. **Order within a wave by the requested useful milestone and its dependencies.** Preserve every requested item and count; do not substitute easier unrelated work for the requested outcome.
3. **Group by the useful milestone, dependencies and rollback boundary.** Split navigation changes or primitives when their independent risk or dependencies warrant it; do not create extra waves solely from the work-type label.
4. **Commit verified coherent outcomes.** A wave is planning context, not automatic permission to merge, push or deploy.

---

## Context-sensitive source and verification check

At the start of a Type 2 sweep, Type 3 component change, Type 4 rebuild, Type 5 primitive, or Type 6 IA shift, identify the relevant axis, current owner, and post-edit evidence. Revisit that context when the governing source or task evidence changes, is missing, or a failure calls the premise into doubt. Record the answers in the active summary when the work requires a durable evidence trail.

See LOCKFILE §10.8d for the full script. Short version:

```
Q1: AXIS?              (structure / aesthetic / both)
Q2: SOURCE OF TRUTH?   (production: Fresha SPEC.md for structure and LOCKFILE §X.Y for aesthetic;
                        commissioned exploration: the commission, grounded by applicable captures)
Q3: IS THE SOURCE EVIDENCE CHANGED OR MISSING? (if yes → re-read the relevant owner now)
Q4: EDIT MATCH SOURCE? (if no → revise OR surface conflict per §10.5)
Q5: POST-EDIT VERIFY?  (targeted drift candidates / screenshot / Fresha comparison / Lighthouse as applicable)
```

If Q1-Q5 exposes a broader concern, reclassify or split the work under the decision tree above. Per LOCKFILE §10.8d.

**Drift signals — STOP the edit if any of these fire** (full list in LOCKFILE §10.8b):
- Eyeballing a Fresha screenshot to "rebuild" instead of firing `fresha-section-capture`
- Inventing or adopting a production design token not in LOCKFILE without owner approval; an explicit commissioned exploration may test scoped values in its mockups without adopting them as production law
- Picking a production layout pattern based on "what feels right" instead of the applicable captured evidence; an explicit multi-direction exploration may vary layouts within its commission
- Applying a LOCKFILE §11 aesthetic pattern as if it were structural
- Marking a route done without screenshot diff

**Source and verification triggers — act when the evidence calls for it** (full list in LOCKFILE §10.8c):
- At the start of a non-trivial work item, or when its scope materially changes → identify the applicable current owner and planned evidence
- At the close of a route sweep, when the current drift skill accepts the explicit touched targets → review its report-only candidates; check the Fresha SPEC when the change is structural
- When source evidence changes, is missing, or a failure calls the premise into doubt → re-anchor on the relevant owner
- When pivoting a mockup variant → ask "am I pivoting on data or on taste"
- When console errors appear → trace to the last edit; if the cause remains uncertain, use the current reasoning procedure and the risk-appropriate native perspective

---

## Per-wave evidence gates (V3-D332, V3-D338 dual-axis added)

Every wave / route sweep / component sweep / ground-up rebuild needs evidence for BOTH axes before being marked done. The working assistant performs the rendered direct checks. Add one independent verifier only when the current consequence, uncertainty, or reach threshold requires it; do not add a verifier layer merely because a work-type was selected. Per LOCKFILE §10.0 dual-axis rule.

### Axis 1 — STRUCTURE (Fresha) gates

| Gate | Threshold | Tool |
|---|---|---|
| **Fresha capture exists for the section** | SPEC.md in `public/_pixel-refs/fresha/<section>/` is ≤30 days old OR explicitly skipped with justification | `fresha-section-capture` skill |
| **Structure matches its authority** | A production candidate follows the captured Fresha structure unless an explicit owner decision changes it. An owner-commissioned multi-direction exploration may vary anatomy and layout within the commission; compare each direction with its stated intent and applicable captured evidence instead of forcing one shared reference layout. | Manual comparison vs current authority |
| **No structural drift mid-sweep** | Aesthetic sweeps don't restructure (no new sections added, no sections moved, no affordances dropped without explicit user pick) | Visual diff of before/after screenshots |

### Axis 2: AESTHETIC (Airbnb/current Solen owners) gates

| Gate | Threshold | Tool |
|---|---|---|
| **Senior Scorecard** (customer-facing screens) | Production candidate: **6/6 Pass** on Copy / Emphasis / Color / Type / Structure / Floors. Explicit owner-commissioned exploration: diagnostic score and tradeoffs; aesthetic ceilings/floors do not reject authorized variation. | `_design-system/SENIOR_SCORECARD.md` — drift + `npm run check:floors` for countable dims + direct screenshot, DOM, interaction, accessibility, and real-data judgment; independent verifier only when risk warrants |
| **Targeted drift candidates** | Review A/B candidates that apply to the touched files; a report does not prove rendered fidelity or broad cleanliness | `solen-drift-check` skill with explicit targets |
| **Lighthouse accessibility** | ≥95 | Lighthouse CLI or Chrome DevTools |
| **LCP (Largest Contentful Paint)** | ≤2.5s on mobile | Lighthouse / Web Vitals |
| **Contrast failures** | 0 | Lighthouse / axe DevTools |
| **Keyboard nav reach** | Every interactive reachable | Manual tab-through |
| **Screen reader landmark order** | H1 → H2 → H3 (no skips) | VoiceOver / NVDA |

**Rationale (per user feedback 2026-05-28):** the dual-axis rule prevents the failure mode where a "drift sweep" silently restructures (because the agent eyeballed an aesthetic pattern as if it were structural), and where a "structure rebuild" ignores aesthetic rules (because the agent followed Fresha verbatim including Fresha's RoobertPRO + purple accent). Both axes verified before ship = no silent drift either direction.

**Both axes must be resolved before shipping the wave.** Exploration evidence does not authorize production implementation or adoption as design law; those require explicit owner approval, and a complaint is never approval. Record the failed production criterion or exploration tradeoff and its evidence in the current work record. Repair authorized defects, diagnose failed methods, and ask the owner only for a material decision that remains after applying the current authority.

---

## Commit cadence rule

Commit each verified coherent outcome within current repository authorization. Use separate commits when they materially improve review or rollback; group related fixes when splitting would fragment one outcome. A route count or historical marker does not determine granularity.

Keep payment, database and other consequential changes reviewable with their relevant dependencies. Use a feature flag or separate change when the actual deployment/rollback contract requires it, not automatically because a provider name appears. A commit does not authorize a merge, push or deployment. Do not attach unsupported time estimates to committing or rollback.

## Rollback procedure per work-type

First inspect the exact diff, dependencies and current shared-tree state. Select a reversal that restores the intended behavior without discarding others' work. Do not blindly substitute a commit or merge commit into a generic command.

- **Surgical or route changes:** reverse the coherent change and recheck its actual scenario.
- **Shared components:** include affected consumer contracts and check distinct inputs/states/layouts.
- **New primitives:** keep component, consumer wiring and registry/docs consistent; do not leave an undocumented or misleading orphan.
- **Navigation changes:** restore compatible destinations, redirects and links together; verify old and new URLs. Changing redirect configuration alone may not restore a removed page.
- **Database/payment changes:** honor the actual data, migration and external-effect contract; a code revert is not evidence of data rollback.

Production deployment, cache changes, destructive data operations and other external effects require their own existing authorization. Never use a production deploy command as a generic cache-clear step.

---

## Anti-pattern catalogue (things we've actually done wrong)

| Pattern | Failure mode | Type the work actually was |
|---|---|---|
| A small shared-component edit reaches several callers | Missed distinct consumer contracts | Component sweep (type 3) |
| "Copy /business with adjustments" → /fuer-salons V1 took an hour because of full registry application | Treated as ground-up rebuild (correctly), but initially scoped as a sweep | Ground-up rebuild (type 4) |
| Adding a `{/* */}` JSX comment outside JSX → build break | "Surgical fix" had hidden compile failure | Still surgical (type 1), but verification step was skipped |
| Phantom `#F3A864` finding in unused WhySolen — mockup overstated impact | Reported a "visible change" that wasn't visible | Audit step missed: confirm component is imported before counting findings |
| **Spacing audit bundled with the fix (V3-D332 anti-pattern, predicted by Opus)** | Audit reopens already-swept routes mid-stream — momentum-damaging | Discovery is a separate work-type from fix. Make audits read-only, log to `_drift.md`, treat fixes as a SEPARATE wave/sweep |
| **Optimistic estimates ignoring i18n + accessibility + performance** | Unexamined dependencies delay the requested result | Include applicable checks in the original scope and estimate from evidence; do not apply an unsupported multiplier. |

---

## See also

- `LOCKFILE.md` — the registries the sweeps/rebuilds apply
- `COMPONENT_REGISTRY.md` — every shared primitive's status + Layer (1/2/3)
- `PROCESS.md` — current brief and evidence procedure
- `QUESTIONS.md` — open questions + decisions
- `_pending-migration.md` — drift findings queue for incremental sweeps
- Project `CLAUDE.md` — Section "🎨 Design system" includes a pointer to this file
