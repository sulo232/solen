# Work-type taxonomy

**Why this exists:** sessions kept conflating "tiny surgical edit" with "ground-up rebuild" and budgeting + verifying them the same way. Each work-type has different effort, different risk, different verification requirement, different commit granularity. Pick the right type BEFORE starting — don't discover mid-session you're doing more than you scoped.

User flag 2026-05-28: "we also got waves or system for example like amazing rebuild or surgical fixes ig to existing sub sites like we've done yk there should be a system."

---

## The 6 work-types

| # | Type | One-liner | Time (per unit) | Visual diff | Commit unit |
|---|---|---|---|---|---|
| 1 | **Surgical fix** | 1-3 line targeted edit, single concern | 5-15 min | Barely visible / invisible | 1 commit per fix |
| 2 | **Route sweep** | Apply registry recipes across one existing route, same structure | 30-45 min | Noticeable but not transformative | 1 commit per route |
| 3 | **Component sweep** | Apply registry to a shared primitive — cascades to N callers | 30-60 min | Cascading change visible across N routes | 1 commit + walk all consumers |
| 4 | **Ground-up rebuild** | Compose a new page from primitives, fresh against registry | 1-2 hours | Major — new layout possible | 1 commit per page, often with iteration |
| 5 | **New primitive** | Build a new shared component from scratch | Half-day to full day | New feature surface | Multi-commit with doc + registry entry |
| 6 | **Major IA shift** | Restructure information architecture (fuse pages, add/drop routes, redirect) | Half-day to full day | Navigation changes + redirects | Multi-commit + link audit + 301s |

---

## Per-type detail

### 1. Surgical fix

**Definition:** 1-3 lines of code, single concern, no structural visual change. The smallest unit of change.

**Examples (from V3-D330/D331 sessions):**
- Hex swap on a single element (`#F3A864` → `#FFC32B`)
- Letter-spacing normalization (`tracking-[0.16em]` → `tracking-[0.08em]`)
- Comment rephrase to dodge a drift-check false-positive
- Font-weight class swap on one element (`font-black` → `font-bold`)
- Dropping one decorative dot span

**Effort budget:** 5-15 min including verification.

**Verification:**
- Read the file → make edit → confirm no other unintended change in `git diff`
- For pure-CSS edits: visual eyeball in browser (no need for screenshot comparison)
- For a string change (copy / hex / class), use the verification that proves the affected behavior; a static drift report alone is not visual proof

**Commit granularity:** 1 commit per fix is fine for single-concern fixes. Batch multiple surgical fixes into one commit ONLY if they share a V3-D{n} marker (same intent).

**Drift-check expectation:** ↓ 1-3 findings per fix. Should never INCREASE drift.

**Anti-pattern:** Treating a sweep as "just a surgical fix." If you find yourself making the same surgical fix in >3 places in one session, stop and treat it as a route sweep or component sweep instead.

---

### 2. Route sweep

**Definition:** Apply LOCKFILE registry recipes (type roles, accent rules, eyebrow policy, etc.) across one existing route. Same components, same structure, same content — just registry-compliant classes throughout.

**Examples:**
- V3-D330 /warum-solen sweep (124 INFO findings → 59, 7 eyebrows → 0, all decorative accent → ink-3)
- V3-D330 /de homepage sweep (subtle refinements + SectionHeader eyebrow normalize)
- V3-D331 /fuer-salons dot-eyebrow sweep

**Effort budget:** 30-45 min per route including before/after screenshots.

**Verification:**
- Before screenshot at 375 mobile (always) + 1440 desktop (if route has desktop layout)
- Apply sweep
- After screenshot at same viewports
- Visual diff via eyeball — confirm transformation matches intent
- Drift-check on the route to confirm findings dropped
- Show user the before/after screenshots; wait for visual sign-off

**Commit granularity:** 1 commit per route. V3-D{n} marker in code comments + commit message body.

**Drift-check expectation:** ↓ 30-100+ findings depending on route size.

**Anti-pattern:** Sweeping a route without first doing the role-recipe audit. Without the registry as the ground truth, "sweep" devolves into ad-hoc eyeballing — the original drift cause.

---

### 3. Component sweep

**Definition:** Apply registry to a shared primitive that's used by N callers. The change cascades to every page that imports the component.

**Examples:**
- V3-D330 SolenExclusiveBadge text-s-accent → text-s-ink-3 (cascades to all "Nur bei Solen" pills)
- V3-D331 BentoBusiness "Bereit dazuzukommen?" dot drop (cascades to all 3 usage variants)
- V3-D331 SectionMeta primitive dot drop (cascades to homepage "FÜR SALONS" divider + any future use)

**Effort budget:** 30-60 min including walking ALL consumers to confirm no visual breakage.

**Verification:**
- `grep -rn ComponentName` to enumerate ALL callers
- Before screenshot of EACH caller route
- Apply the component change
- After screenshot of EACH caller route
- Visual diff per route — confirm no unexpected regression in any consumer
- Component doc updated in `_design-system/components/<Name>.md` if signature changes

**Commit granularity:** 1 commit covering the component + consumer-route updates if needed.

**Drift-check expectation:** ↓ N × per-route findings (where N = number of consumers).

**Anti-pattern:** Editing a shared component without checking all consumers. Component sweeps look surgical but their impact is multiplicative — a 3-line change can break 6 routes if you don't audit consumers.

---

### 4. Ground-up rebuild

**Definition:** Compose a NEW page from existing primitives, fresh against the registry. May invent new sections or reorganize IA. Not a copy of an old page.

**Examples:**
- V3-D330 /fuer-salons V1 build — fresh composition of Hero + Trust + How + Bento + Marketplace + Pricing + FAQ + JoinUsCard, all registry-compliant from line 1
- V3-D220 /business V3 rebuild (earlier work — full page from scratch with Fresha bones + Solen skin)

**Effort budget:** 1-2 hours per page including iteration + screenshots.

**Verification:**
- Spec out the section IA BEFORE writing code (8-10 sections enumerated)
- Read all imported primitives to know what's available
- Write the page top-to-bottom in one Write call (acceptable for new files, NOT for existing-file edits)
- Build verifies (no compile error)
- Screenshot mobile + desktop
- Apply the current consequence, uncertainty, and reach threshold. The working assistant always checks the rendered route directly; add one independent native verifier only when that threshold requires it, and let that reviewer cover all applicable visual, code, and security criteria.
- User visual sign-off

**Commit granularity:** 1 commit per page-rebuild. Often followed by 1-3 iteration commits as user gives feedback.

**Targeted drift expectation:** review all applicable candidates on the new file; the report does not establish rendered fidelity or broad cleanliness.

**Anti-pattern:** Calling a "ground-up rebuild" what is actually a heavy route sweep with imports unchanged. If you're using all the same primitives in the same order as an existing page, it's a sweep, not a rebuild.

---

### 5. New primitive

**Definition:** Build a new shared component from scratch that other routes will use.

**Examples (pending):**
- MapView (Section H of master plan — Mapbox-based map for /search)
- Future imagery primitives if Pattern 2 / Pattern 5 surface need wrapping

**Effort budget:** Half-day to full day.

**Verification:**
- Component file written at correct location (`app/[locale]/_components/<area>/<Name>.tsx`)
- TypeScript public API typed
- Per LOCKFILE §5 — primitive prop signature frozen
- Component doc written at `_design-system/components/<Name>.md` IN THE SAME TURN
- COMPONENT_REGISTRY.md updated with file path, Layer (1/2/3), public API, status
- Per-consumer integration tested
- Storybook-equivalent demo if applicable
- Drift-check passes on the new file

**Commit granularity:** Multi-commit:
1. Primitive + doc + registry entry
2. First-consumer wiring
3. Additional consumers if applicable

**Drift-check expectation:** 0 on the new file. May surface new findings on consumer files if integration reveals gaps.

**Anti-pattern:** Building a new component without writing its doc + registry entry in the same turn. New components without docs become orphan drift sources.

---

### 6. Major IA shift

**Definition:** Restructure information architecture — fuse pages, add new routes, drop deprecated routes, set up 301 redirects, audit cross-page links.

**Examples:**
- V3-D330 Section G fusion: /business + /partner → /fuer-salons (V1 done, V2 + redirects pending)
- Future: /search/map carve-out (Section H if user picks separate route)

**Effort budget:** Half-day to full day.

**Verification:**
- All old route content captured in new route OR explicitly dropped with reason
- 301 redirects in place for old routes
- `next.config.js` redirect rules tested (curl old URL → confirm 301 → new URL)
- Header dropdown / sitemap / footer / sitemap.xml audited for stale links
- Marketing emails / social bios / external links — surfaced as risk if can't be controlled
- Per LOCKFILE §10 conflict resolution — if old route had unique semantic value, that must be preserved or explicitly killed

**Commit granularity:** Multi-commit:
1. New canonical route built
2. Redirects added
3. Cross-link audit + updates
4. Sitemap + SEO alternates update

**Drift-check expectation:** May spike temporarily during transition (both old + new routes flagged), then drop as old routes are deprecated.

**Anti-pattern:** Building a "fused" page without 301 redirects. Users land on old URLs from bookmarks / search engines / external links — without redirects, they 404 or hit a stale page.

---

## Pick the right type — decision tree

```
Is the change just 1-3 lines, single concern, single file?
├─ Yes → Surgical fix (type 1)
└─ No
   │
   Is it the same pattern applied across many places in one route?
   ├─ Yes → Route sweep (type 2)
   └─ No
      │
      Is it editing a shared primitive that's imported by N routes?
      ├─ Yes → Component sweep (type 3) — audit ALL N consumers
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
1. **Tag each item with its work-type number.** This sets the effort budget + verification requirement upfront.
2. **Order within a wave: smallest type first.** Surgical fixes ship first because they're cheapest to verify and lowest-risk to revert.
3. **Major IA shifts get their own wave.** Don't mix a Wave 1 "Sweep + Fusion" — the fusion will dominate the verification cost.
4. **New primitives get their own wave.** Same reason.
5. **One wave = one shipping unit.** When the wave's items are all green + verified, that's a commit boundary.

---

## Context-sensitive source and verification check

At the start of a Type 2 sweep, Type 3 component change, Type 4 rebuild, Type 5 primitive, or Type 6 IA shift, identify the relevant axis, current owner, and post-edit evidence. Revisit that context when the governing source or task evidence changes, is missing, or a failure calls the premise into doubt. Record the answers in the active summary when the work requires a durable evidence trail.

See LOCKFILE §10.8d for the full script. Short version:

```
Q1: AXIS?              (structure / aesthetic / both)
Q2: SOURCE OF TRUTH?   (Fresha SPEC.md for structure, LOCKFILE §X.Y for aesthetic)
Q3: IS THE SOURCE EVIDENCE CHANGED OR MISSING? (if yes → re-read the relevant owner now)
Q4: EDIT MATCH SOURCE? (if no → revise OR surface conflict per §10.5)
Q5: POST-EDIT VERIFY?  (targeted drift candidates / screenshot / Fresha comparison / Lighthouse as applicable)
```

If Q1-Q5 exposes a broader concern, reclassify or split the work under the decision tree above. Per LOCKFILE §10.8d.

**Drift signals — STOP the edit if any of these fire** (full list in LOCKFILE §10.8b):
- Eyeballing a Fresha screenshot to "rebuild" instead of firing `fresha-section-capture`
- Inventing a new design token not in LOCKFILE
- Picking a layout pattern based on "what feels right" instead of "what does Fresha do"
- Applying a LOCKFILE §11 aesthetic pattern as if it were structural
- Marking a route done without screenshot diff

**Source and verification triggers — act when the evidence calls for it** (full list in LOCKFILE §10.8c):
- At the start of a non-trivial work item, or when its scope materially changes → identify the applicable current owner and planned evidence
- At the close of a route sweep, when the current drift skill accepts the explicit touched targets → review its report-only candidates; check the Fresha SPEC when the change is structural
- When source evidence changes, is missing, or a failure calls the premise into doubt → re-anchor on the relevant owner
- When pivoting a mockup variant → ask "am I pivoting on data or on taste"
- When sweep > 30 min → re-anchor mid-sweep
- When console errors appear → trace to the last edit; if the cause remains uncertain, use the current reasoning procedure and the risk-appropriate native perspective

---

## Per-wave verifier gates (V3-D332 — Opus's sharper framing, V3-D338 dual-axis added)

Every wave / route sweep / component sweep / ground-up rebuild must pass BOTH axes' verification gates before being marked done. Per LOCKFILE §10.0 dual-axis rule.

### Axis 1 — STRUCTURE (Fresha) gates

| Gate | Threshold | Tool |
|---|---|---|
| **Fresha capture exists for the section** | SPEC.md in `public/_pixel-refs/fresha/<section>/` is ≤30 days old OR explicitly skipped with justification | `fresha-section-capture` skill |
| **Solen IA matches captured Fresha SPEC** | Section order, count, affordance set, hero pattern, copy density all match | Manual diff vs SPEC.md |
| **No structural drift mid-sweep** | Aesthetic sweeps don't restructure (no new sections added, no sections moved, no affordances dropped without explicit user pick) | Visual diff of before/after screenshots |

### Axis 2 — AESTHETIC (Uber/LOCKFILE) gates

| Gate | Threshold | Tool |
|---|---|---|
| **Senior Scorecard** (customer-facing screens) | **6/6 Pass** on Copy / Emphasis / Color / Type / Structure / Floors (Floors dim added 2026-07-27, hierarchy-density-02) | `_design-system/SENIOR_SCORECARD.md` — drift + `npm run check:floors` for the countable dims + a verifier-agent pass (with screenshot) for the judgment dims |
| **Targeted drift candidates** | Review A/B candidates that apply to the touched files; a report does not prove rendered fidelity or broad cleanliness | `solen-drift-check` skill with explicit targets |
| **Lighthouse accessibility** | ≥95 | Lighthouse CLI or Chrome DevTools |
| **LCP (Largest Contentful Paint)** | ≤2.5s on mobile | Lighthouse / Web Vitals |
| **Contrast failures** | 0 | Lighthouse / axe DevTools |
| **Keyboard nav reach** | Every interactive reachable | Manual tab-through |
| **Screen reader landmark order** | H1 → H2 → H3 (no skips) | VoiceOver / NVDA |

**Rationale (per user feedback 2026-05-28):** the dual-axis rule prevents the failure mode where a "drift sweep" silently restructures (because the agent eyeballed an aesthetic pattern as if it were structural), and where a "structure rebuild" ignores aesthetic rules (because the agent followed Fresha verbatim including Fresha's RoobertPRO + purple accent). Both axes verified before ship = no silent drift either direction.

**Both axes must be resolved before shipping the wave.** Record the failed criterion and its evidence in the current work record. Repair authorized defects, diagnose failed methods, and ask the owner only for a material decision that remains after applying the current authority.

---

## Commit cadence rule (V3-D332)

Per Opus: **per-route commits inside wave-as-PR.**

- Every route sweep / rebuild = its own commit (V3-D{n} marker in commit message)
- Wave merged as single PR (squash optional for clean main; preserve commits if you want bisection history)
- Stripe / Supabase mutations behind feature flag OR separate PR even within a single route
- Commit overhead: ~5 min per route. Rollback overhead at wave-granularity: hours.

**Anti-pattern (was the V3-D331 default):** "1 wave = 1 commit." Bisection on a regression in a 5-route wave is impossible at wave-commit granularity.

---

## Rollback procedure per work-type (V3-D332)

| Type | Rollback |
|---|---|
| 1 Surgical | `git revert <commit>` — single concern, low blast radius |
| 2 Route sweep | `git revert <route-commit>` — other routes in wave keep their fixes (per-route commit granularity makes this safe) |
| 3 Component sweep | `git revert <component-commit>` — note: consumers may render with stale styles for one commit, screenshot each consumer to confirm |
| 4 Ground-up rebuild | `git revert <merge-commit>` — reopen wave branch, iterate, re-merge |
| 5 New primitive | `git revert <primitive + consumer commits>` — component doc + registry entry can stay (zombie OK; registry forgiving) |
| 6 Major IA shift | `git revert <redirect-config-commit>` + clear Netlify edge cache (`netlify deploy --prod --build`) + verify old URLs work again |

---

## Anti-pattern catalogue (things we've actually done wrong)

| Pattern | Failure mode | Type the work actually was |
|---|---|---|
| "Just dropping a few dots" → ended up sweeping 8 callsites across 5 files | Underestimated effort by 4× | Component sweep (type 3) |
| "Copy /business with adjustments" → /fuer-salons V1 took an hour because of full registry application | Treated as ground-up rebuild (correctly), but initially scoped as a sweep | Ground-up rebuild (type 4) |
| Adding a `{/* */}` JSX comment outside JSX → build break | "Surgical fix" had hidden compile failure | Still surgical (type 1), but verification step was skipped |
| Phantom `#F3A864` finding in unused WhySolen — mockup overstated impact | Reported a "visible change" that wasn't visible | Audit step missed: confirm component is imported before counting findings |
| **Spacing audit bundled with the fix (V3-D332 anti-pattern, predicted by Opus)** | Audit reopens already-swept routes mid-stream — momentum-damaging | Discovery is a separate work-type from fix. Make audits read-only, log to `_drift.md`, treat fixes as a SEPARATE wave/sweep |
| **Optimistic estimates ignoring i18n + a11y + perf integration cost** | Wave slip → cascade slip on dependent waves | Multiply ideal-case estimates by 1.5-2× to absorb i18n; bake a11y + perf into per-wave gates so they don't compound |

---

## See also

- `LOCKFILE.md` — the registries the sweeps/rebuilds apply
- `COMPONENT_REGISTRY.md` — every shared primitive's status + Layer (1/2/3)
- `AGENT_BRIEF_TEMPLATE.md` — Fresha-clone rebuild brief for sub-agents
- `QUESTIONS.md` — open questions + decisions
- `_pending-migration.md` — drift findings queue for incremental sweeps
- Project `CLAUDE.md` — Section "🎨 Design system" includes a pointer to this file
