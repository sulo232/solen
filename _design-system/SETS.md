<!-- Owner decision 4 (2026-08-07): a set is all three shapes, each with its own pipeline. -->
<!-- READ THE CORRECTION BELOW BEFORE USING THE FOLDER PATHS IN THIS FILE. -->

> **CORRECTION, same day, and it outranks the layout in section 3.**
>
> This was drafted before owner decision 17, which came a few hours later: **mockups are REAL PAGES
> under `app/[locale]/dev/`, not standalone files under `public/_mockups/`.** He asked "if we aren't
> using HTML, what are we even using? I don't really like HTML though", and picked real pages,
> because a standalone copy cannot be tapped, has no animation, and goes stale the moment the real
> screen changes.
>
> So: **the three pipelines, the manifest, the fan-out shape and the consistency check all stand.
> The folder paths in section 3 do not.** A set lives beside the routes it is made of, and the
> compare hub is the existing `app/[locale]/dev/mockups/page.tsx`, which this file already says to
> extend rather than rebuild. `public/_mockups/**` is legacy: it still renders, it is not where new
> work goes.
>
> The evidence in section 0 is unaffected and worth keeping: 98 files under `public/_mockups` still
> load a remote font or CDN script that `_BASE.md` has banned since 2026-07-21, which is its own
> argument for not adding more of them.

# SETS: the three pipelines

Owner decision, 2026-08-07 (SYSTEM_DECISIONS row 4): a set is all three shapes, each with its own
pipeline. This is the procedure, the manifest, and the layout.

---

## 0. What I verified before designing this

| Claim | Status | Evidence |
|---|---|---|
| No set or variant machinery exists | TRUE | `public/_mockups` has 121 entries and exactly one non-HTML file in the whole tree: `_BASE.md`. No manifest, no spec, no shared file binds any multi-file set. |
| `mockup-variations.py` never blocks | TRUE, and it IS armed | `~/.claude/hooks/mockup-variations.py:60-70` prints `additionalContext` then `sys.exit(0)` on every path. Registered once in `~/.claude/settings.json` as a UserPromptSubmit injector. It asks for 3 directions. Nothing counts them. |
| Existing sets were hand-assembled | TRUE | `everystate-v2` 40 files, `discovery` 85, `restraint` 26, `taste-audit-w1` 27. No shared spec in any of them. |
| everystate-v2 breaks the base law | TRUE, and it is not alone | `everystate-v2/index.html:6-7` loads Google Fonts and unpkg Lucide. So does `everystate-v2/compare/index.html:5`. **98 mockup files across `public/_mockups` still load a remote font or CDN script**, banned by `_BASE.md:35-36` since 2026-07-21. |
| Prior art for directions | EXISTS, all one-offs | `app/[locale]/dev/stylist-directions/page.tsx` (3 directions in one file), `dev/home-search/_variants.tsx` (VariantA/B/C), `dev/search-rich`, `dev/walkin-number-options`, `dev/walkin-statusbar-options`. None share a spec, none record a pick. |
| Prior art for a compare hub | EXISTS, must be extended not rebuilt | `app/[locale]/dev/mockups/page.tsx` already reads `app/[locale]/dev/*` and `public/_mockups/**` from disk on every request. Its own docstring says it was rebuilt in July because a hand-listed index of 11 rotted while ~310 files existed. |
| A rendered per-member instrument exists | EXISTS | `npm run check:floors` is `node scripts/check-geometry.mjs --floors-only`, and it accepts arbitrary routes plus `--gate`. Measures imagery share, display anchor, weight share, anchor ratio, size spread, elevation, at 390x844. |

**The one-line diagnosis:** a mockup is written once and never read again. Sets make that worse,
because a set is the unit where drift between members is the whole point, and nothing today can
even enumerate a set's members.

---

## 1. The three shapes are genuinely different. Naming the difference first.

| | A. FLOW | B. DIRECTIONS | C. FAMILY |
|---|---|---|---|
| What varies across members | the screen | the treatment | the surface |
| What is held fixed | the design decision | the screen and its content | one shared decision |
| Boundary | one user goal, entry to exit | one screen, N takes | one rule, every surface it binds |
| Members are | real routes | mockup files or dev routes | mockup files or real routes |
| Owner action | walks it on his phone | picks one | confirms nothing diverged |
| The set is done when | he has walked every step | he says a letter | every member asserts identical |
| Failure mode it exists to kill | dead ends and lost state between screens | three shades of one idea | member 1 changed, members 2..N silently did not |

**Honest cost of one manifest for all three (owner should know this):** A and B/C barely share
machinery. B and C are about 80% the same pipeline. A has no mockup files at all, it points at
real routes. Forcing A into the same manifest buys exactly one thing: there is one directory to
look in and one command to run. It costs a `type` switch in the index renderer and the check
script. I think that trade is right, because "where is the set" is the question that killed
everystate-v2. But it is a real cost and it is not zero.

---

## 2. The manifest: `set.json`

One file per set. It is the only hand-written file in a set. Everything else is generated or
built by a subagent from it.

```jsonc
{
  "id": "booking-flow",                    // kebab, matches the folder name
  "type": "flow",                          // "flow" | "directions" | "family"
  "title": "Booking, guest to confirmation",
  "created": "2026-08-07",
  "owner_question": "Does the booking flow hold together end to end on my phone?",
  "status": "building",                    // building | ready | decided | parked
  "render": "real-route",                  // real-route | iframe-injection | dev-route

  "surface": {
    "route": "/de/salon/muse-beauty-studio/booking",
    "component": "components-legacy/booking/BookingWizard.tsx",
    "seed_entity": "muse-beauty-studio",
    "seed_verified": "2026-08-07 via GET /api/salons/muse-beauty-studio"
  },

  "shared": {                              // copied VERBATIM into every member brief
    "decision": "one-line statement of what every member must obey",
    "law_refs": ["_design-system/LOCKFILE.md §17", "TASTE_LOG.md 2026-07-21 empty states"],
    "assert": [                            // machine-checkable, family sets require this
      { "selector": "[data-empty] h2", "prop": "fontSize",   "equals": "18px" },
      { "selector": "[data-empty] h2", "prop": "fontWeight", "equals": "600" }
    ]
  },

  "members": [ /* shape depends on type, see 2.1-2.3 */ ],

  "checks": {
    "floors": true,                        // check-geometry --floors-only --gate per member
    "type_budget": true,                   // <=4 sizes, <=2 weights per member
    "no_remote": true,                     // no http(s) font/script/image in a member file
    "cross_member": true                   // the type-specific comparison in section 8
  },

  "verdict": null                          // filled the turn he answers, see 6.5
}
```

### 2.1 FLOW member

```jsonc
{
  "id": "03-time",
  "step": 3,
  "route": "/de/salon/muse-beauty-studio/booking",
  "enter": "direct",                       // "direct" | "dev-login"
  "arrive_by": "tap Weiter on the staff step",
  "carries": ["salonId", "serviceIds", "staffId"],
  "produces": ["slotIso"],
  "precondition": null,                    // e.g. "user has one past booking"
  "boundary": null                         // e.g. "does not submit a live charge"
}
```

`carries` and `produces` are what makes this a flow rather than a list of URLs. The check proves
every key a step carries was produced by an earlier step. A step that carries a key nobody
produces is a screen you cannot actually reach by walking, which is the dead end this pipeline
exists to find.

### 2.2 DIRECTIONS member

```jsonc
{
  "id": "b-one-column",
  "label": "B, one column",
  "file": "b-one-column.html",
  "differs_by": "layout: two-column tile grid becomes full-width rows",
  "answers": {
    "anchor":   "the stylist name is the biggest thing",
    "grouping": "one row per person, hairline separated",
    "idiom":    "individual entity card",
    "deleted":  "the specialty chips"
  },
  "keeps": ["real seeded photos", "rating always with its count"]
}
```

### 2.3 FAMILY member

```jsonc
{
  "id": "favorites-empty",
  "route": "/de/profile/favorites",
  "component": "app/[locale]/profile/favorites/page.tsx",
  "enter": "dev-login",
  "state_recipe": "seed user with zero favorites",
  "file": null                             // null when the member IS the real route
}
```

---

## 3. Exact folder and file layout

```
public/_mockups/_sets/
  _TEMPLATE/
    set.json                 the schema above, with every field commented
    member.html              the validated iframe shell, copied from
                             public/_mockups/sweep-salon-sections/index.html
    BRIEF.md                 the member-brief template from section 7
  <set-id>/
    set.json                 hand-written, the only hand-written file
    index.html               GENERATED by `npm run set -- index <id>`. Never hand-edit.
    <member-id>.html         one per member, built by one subagent each
```

Rules that fall out of what already broke:

- **`index.html` is generated, never typed.** `dev/mockups/page.tsx` was rebuilt in July for
  exactly this reason. A hand-typed index rots the moment a member is added.
- **Members reuse `/_mockups/_assets/salon-photos/pNN.jpg`.** That path is absolute and already
  served, so it resolves unchanged from one level deeper. No new asset folder per set.
- **Fonts follow the passing template, not the rotted one.** `sweep-salon-sections/index.html:21`
  declares `--font:'Inter Tight',system-ui,-apple-system,sans-serif` with no `<link>` and no
  `@font-face`. Copy that. The 98 files with a Google Fonts link are the failure, not the pattern.

**Flow sets keep their manifest here and nothing else.** They have no member files, because a
flow set drives the real app. `FLOW_HARNESS.md:12` already rejected the alternative by name:
"Static copies were the rejected model, and they rot."

```
app/[locale]/dev/flows/
  page.tsx                   CHANGE: delete the hardcoded FLOWS array (page.tsx:67-89),
                             read public/_mockups/_sets/*/set.json where type === "flow"
  layout.tsx                 unchanged
  _components/FlowBar.tsx    unchanged
  [setId]/page.tsx           NEW: the step list for one flow, generated from its manifest
```

---

## 4. The command: `npm run set`

One script, `scripts/set.mjs`, wired as `"set": "node scripts/set.mjs"`. Exists-check run
2026-08-07: `node scripts/exists.mjs set` and `... variant` return only unrelated settings
pages, motion variants, and the one-off dev variant routes. Nothing to extend, so this is new.

```
npm run set -- new flow|directions|family <id>   scaffold the folder from _TEMPLATE
npm run set -- brief <id>                        print one brief per member, ready to fan out
npm run set -- check <id>                        the consistency check (section 8)
npm run set -- index <id>                        regenerate index.html from set.json
npm run set -- list                              every set, its type, member count, status
```

`check` prints a report and exits non-zero on a failure. It is a command the orchestrator runs.
**It is not a hook and must not become one.** SYSTEM_DECISIONS row 1 froze new gates, and
LAW_SYSTEM.md 6.9 records that the three most-repeated failure themes were the three with the
most gates. A check nobody wired is not enforcement, it is an instrument, and calling it what it
is keeps it honest.

---

## 5. PIPELINE A: the FLOW set

### 5.1 Why the existing harness stalled, before extending it

`_plans/FLOW_HARNESS.md` shipped the hub plus Booking on 2026-07-08 and has not moved since.
Two causes, both in the file:

1. **Line 22, item H:** "Awaiting owner eyeball of the booking pattern before wiring the other 11
   flows." That is a hard stop on a non-blocking approval. Wiring the walk-in flow does not depend
   on him approving Booking's card layout. The project's own dependency test in CLAUDE.md says
   park it and keep going. This one parked the whole workstream instead.
2. **Line 21, item G:** the tunnel died. "the `next dev` background process is REAPED between tool
   calls in this session (origin went 200 to 000)... A persistent tunnel must be run from a real
   terminal." So the thing he was supposed to eyeball had no working link to eyeball it through.

The stall was not a design problem. It was a report-and-wait on an approval that was physically
undeliverable. **Extending it means deleting the wait, not rebuilding the harness.**

### 5.2 The procedure

1. **Pick the flow and write its boundary.** A flow starts where the user forms the intent and
   ends where the goal is met or abandoned. Booking starts at the PDP book button, not at the
   homepage, and ends at the confirmation screen, not at the receipt email. Write that sentence
   into `owner_question` before anything else.
2. **Walk it yourself once, in the browser, and write down every screen you actually land on.**
   Not the screens you expect. The manifest is a record of a walk, not a plan.
3. **Write `set.json`.** One member per screen, in order, with `carries`, `produces`,
   `precondition`, `enter`.
4. **Name every precondition you cannot enter cold.** A review flow needs a past booking. A
   loyalty flow needs stamps. Write the seed recipe into `precondition`. This is the real work in
   the remaining 11 flows and it is why they are not a copy-paste of Booking.
5. **Wire it.** For a flow whose routes already exist, this is manifest-only: no component is
   written. For a flow with a missing screen, that missing screen is a punch item, not a mockup.
6. **Run `npm run set -- check <id>`.** Every step returns its expected status with no unexpected
   auth redirect, every carried key is produced upstream, floors pass on every step.
7. **Deliver one link**, the hub, over a tunnel started from a real terminal.
8. **Never wait on step 7 to start the next flow.** The approval gate is on the SET, not on the
   member, and not on the previous set.

### 5.3 How state carries and how he walks it

The real app carries the state, which is the entire point of driving real routes. The manifest
only records what the state IS at each boundary so the check can prove continuity. He walks it by
opening the hub on his phone and tapping one card. The FlowBar already gives "All flows" and
"Restart".

**One addition, and only one:** the hub card shows the step count from the manifest ("Booking, 5
steps") so a flow that silently lost a screen is visible without walking it.

---

## 6. PIPELINE B: the DIRECTIONS set

### 6.1 The format, reconciled with what he rejected

`_plans/MOCKUP_FORMAT_CORRECTION.md:8` rejects "abstract Direction A / B gray comparison panels"
by name and calls them the banned from-scratch redraw. Lines 13-21 define what he approved: both
panes are a live iframe of the SAME real route, the After has the change INJECTED, validated in
`public/_mockups/sweep-salon-sections/index.html`.

A directions set is that, with N afters instead of one:

- One fullscreen pane at a time, 402 wide, full bleed.
- A segmented toggle at the top: `Now | A | B | C`.
- `Now` is a live iframe of the real route, untouched.
- Each direction is the same live iframe with that direction's `applyChange(doc)` run against it.
- **Nothing is ever shown shrunken side by side on the phone.** Two 390px panes on a 402px
  screen is exactly the rejected format, reinvented.

**The cost of that call, named:** he compares from memory across a toggle instead of seeing two
things at once. That is a real loss. I chose it because the alternative is the format he has
already rejected twice, and because a flick between two fullscreen states is how he picked the
280ms motion timing (TASTE_LOG, 2026-07-26, "picked off a live three-column side-by-side"). If he
wants true side-by-side, it belongs on desktop, as a second generated view off the same manifest,
and that is his call to make, not mine to assume.

**When the surface has no real route yet** (a screen that does not exist), directions are built
as a dev route under `app/[locale]/dev/<set-id>/`, using real primitives and real seeded data.
That is what `dev/stylist-directions/page.tsx` did and it was not rejected. Set `render` to
`dev-route`. The manifest still lives in `_sets/<id>/set.json` so there is one place to look.

### 6.2 What makes two directions genuinely different

The failure this prevents: three shades of one idea, delivered as a choice. The test is
structural, not verbal.

**Rule 1: each direction changes a different structural variable, and names it in `differs_by`.**
The variables, taken from what he actually reacts to in TASTE_LOG:
- **anchor**: which element is clearly the biggest
- **grouping**: what is wrapped with what (group card vs individual entity card is a settled
  distinction, TASTE_LOG 2026-07-19)
- **idiom**: card, bare row, tile, carousel
- **emphasis**: what carries the weight, and what got demoted to quiet text
- **deletion**: what is removed, and what survives to carry its meaning

**Rule 2: two directions may not differ only in token values.** Color, radius, shadow, and
spacing are locked. A direction that only moves locked literals is either drift or a shade.

**Rule 3: the grayscale test.** Screenshot each direction, desaturate, blur. If two are
indistinguishable, they are one direction. This is the squint step the taste-diagnosis skill
already uses, applied across members instead of within one screen.

**Rule 4: every direction shows identical content.** Same salon, same service count, same photos.
He is picking a treatment. If the data differs he is picking data.

**Three directions. Cap at four.** The variations injector already asks for at least 3, and
`stylist-directions` built 3. Past four he is filling in a survey.

### 6.3 The procedure

1. State the question in one sentence: what is actually wrong with the screen now, measured.
   `Diagnosis:` marker, same as a single mockup.
2. Write `set.json` with 3 members. **Fill `differs_by` and `answers` for all three before any
   member is built.** This is the whole design decision and it belongs to the orchestrator.
3. `npm run set -- brief <id>` and fan out, one subagent per direction, in parallel (section 7).
4. `npm run set -- check <id>`. Duplicate `differs_by` fails. A member that pulls a remote font
   fails. Floors run per member.
5. `npm run set -- index <id>` generates the toggle page.
6. Deliver one tunnel link. One page. Not three.
7. Record the pick the same turn it arrives (6.5).

### 6.4 How the pick is recorded

Three places, all of which already exist, all in the same turn he answers:

1. **`_design-system/TASTE_LOG.md`**: a dated row with his verbatim words. This is the ledger of
   what he actually said and it is what stops re-litigation.
2. **`_design-system/REJECTED_TREATMENTS.json`**: an entry for any losing direction that could
   resurrect from dormant code. That file exists for exactly this and its own `_doc` says to add
   the entry the same turn.
3. **`set.json` gets its `verdict`**, so the folder describes itself:

```jsonc
"verdict": {
  "picked": "b-one-column",
  "quote":  "b, the list one, the tiles are too small",
  "date":   "2026-08-08",
  "logged": ["_design-system/TASTE_LOG.md", "_design-system/REJECTED_TREATMENTS.json"]
}
```

Point 3 closes the complaint that got `/dev/mockups` rebuilt in July: pages presented as "needs
your approval" that were already decided. With a verdict in the manifest, the index renders
"PICKED: B" instead of "needs your eyes", from disk, with nothing to remember.

---

## 7. PIPELINE C: the FAMILY set

### 7.1 What it is for

One decision, every surface it binds. The empty-state anatomy (TASTE_LOG 2026-07-21) binds every
empty state. The content-tab underline was sanctioned "for ALL content tabs". The PDP section
wrapper lock bound Services, Team, and Reviews, and Team and Reviews had both silently drifted off
it (TASTE_LOG 2026-07-19/20: Team was `rounded-3xl shadow-float`, Reviews `rounded-2xl`).

That drift is the failure this pipeline exists to catch, and it is why the family manifest carries
`shared.assert` while the other two do not have to.

### 7.2 The member list is derived, never typed

A typed member list is wrong the day a new surface ships. So the manifest records the command
that produced it:

```jsonc
"membership": {
  "derived_by": "node scripts/exists.mjs empty && grep -rl 'EmptyState' app/",
  "derived_on": "2026-08-07",
  "count": 9
}
```

Re-running that command is how you find out the family grew. `npm run set -- check` re-runs it and
reports any surface on disk that is not a member.

### 7.3 The procedure

1. Name the shared decision in one sentence and cite the law file that owns it.
2. Derive the member list with a real command. Record the command.
3. Write `shared.assert`: the decision as selector plus property plus expected value. If you
   cannot write the assertion, the decision is not specific enough to propagate, and that is the
   finding, not a reason to skip it.
4. Fan out, one subagent per member (section 7). Every brief carries the `shared` block verbatim.
5. `npm run set -- check <id>`. Two comparisons, not one:
   - **against the target**: every member matches every assertion.
   - **against each other**: at each asserted selector, report every computed property that
     differs across members, as INFO. This catches drift on properties nobody thought to assert,
     which is how Team and Reviews drifted while still passing whatever anyone was checking.
6. `npm run set -- index <id>` generates a grid of members with a pass or fail chip per member.

### 7.4 How a changed decision propagates

Edit `shared` in `set.json`. Re-run the fan-out with only the changed assertion in the brief.
`check` proves every member moved. **The set is the propagation unit.** Today propagation is a
person remembering, which is the mechanism that produced the PDP drift sweep.

---

## 8. Who builds each member: the parallel fan-out

Decision 14: the orchestrator writes precise briefs and dispatches. It does not hand-build. And
it fans out MANY subagents, never one at a time.

### 8.1 The rule that makes parallel design safe

The concern behind the superseded no-parallel-frontend rule was design by committee. The structural
answer:

> **Every shared value is decided by the orchestrator BEFORE the fan-out and copied verbatim into
> every brief. A subagent that needs a shared value it was not given returns `blocked`. It never
> picks one.**

Subagents execute. They do not decide anything that crosses a member boundary.

### 8.2 The member brief template

`npm run set -- brief <id>` emits one of these per member, filled from `set.json`.

```
SET: <id> (<type>) , member <member-id>, one of <n>.
You build EXACTLY ONE FILE: public/_mockups/_sets/<id>/<member-id>.html
Touch nothing else. Do not edit set.json. Do not edit any sibling member.

THE SHARED DECISION, obey it literally, do not reinterpret:
<shared.decision verbatim>
Law: <shared.law_refs>
Assertions your member must satisfy: <shared.assert>

YOUR MEMBER, and the only thing that makes it different from its siblings:
<differs_by>
It answers: anchor=<...> grouping=<...> idiom=<...> emphasis=<...> deleted=<...>
It keeps: <keeps>

FORMAT, non negotiable:
- Copy the shell from public/_mockups/_sets/_TEMPLATE/member.html
- 402 CSS px design width, full bleed, no drawn phone frame
- NO remote fonts, NO CDN scripts, NO remote images. Fonts exactly as the template
  declares them. 98 existing mockups break this. Yours does not.
- Real photos from /_mockups/_assets/salon-photos/pNN.jpg
- Real Lucide markup, never a hand-drawn SVG path
- English chrome, no em-dashes, at most 4 font sizes and 2 weights
- Real seeded data only. Never fabricate a number, a time, or a count.

DATA: <surface.seed_entity>, verified <surface.seed_verified>.
If a field you want does not exist in that data, OMIT the element and say so in
`blocked`. Never invent it.

RETURN: { file, differs_by_implemented, sizes_used, weights_used, blocked[] }
```

### 8.3 The workflow

The workflow API is verified from `~/.claude/workflows/refine.workflow.js:90` and
`council.workflow.js:86`: `agent(prompt, { label, phase, agentType, model, schema })`, plus
`args`, `log()`, and a returned object. `council.workflow.js:105` shows per-agent model routing.

`scripts/workflows/set-build.workflow.js`, launched by scriptPath with `{ setId }`:

```js
export const meta = {
  name: 'set-build',
  description: 'Build every member of a set in parallel from orchestrator briefs.',
  phases: [{ title: 'Build', detail: 'one subagent per member, all at once' }],
}

const MEMBER_SCHEMA = {
  type: 'object',
  required: ['file', 'differs_by_implemented', 'blocked'],
  properties: {
    file: { type: 'string' },
    differs_by_implemented: { type: 'string' },
    sizes_used: { type: 'array', items: { type: 'number' } },
    weights_used: { type: 'array', items: { type: 'number' } },
    blocked: { type: 'array', items: { type: 'string' } },
  },
}

const set = JSON.parse(read(`public/_mockups/_sets/${args.setId}/set.json`))
log(`fanning out ${set.members.length} members of ${set.id}`)

const built = await Promise.all(
  set.members.map((m) =>
    agent(brief(set, m), {
      label: m.id,
      phase: 'Build',
      agentType: 'coder',
      model: 'sonnet',
      schema: MEMBER_SCHEMA,
    })
  )
)

return { setId: set.id, count: built.filter(Boolean).length, blocked: built.flatMap(b => b?.blocked || []) }
```

Notes that matter, from `reference_workflow_large_fanout`:
- Chunk at roughly 25 to 30 agents. A set will rarely exceed that; a family sweep might.
- Return a COUNT, not the payloads. Read details from the run journal if needed.
- A transient rate limit is a wait, not a loss. Resume with `resumeFromRunId`.

**Fallback if the Workflow tool is not available in the session:** dispatch N subagents in ONE
message with the same briefs. The briefs are the mechanism; the workflow is only the runner.

### 8.4 Who does what

| Step | Who |
|---|---|
| Boundary, question, diagnosis | orchestrator |
| `set.json`, including every `differs_by` and the whole `shared` block | orchestrator, before any fan-out |
| Each member file | one subagent, in parallel, from its brief |
| `npm run set -- check` | orchestrator |
| Fixing a check failure | a subagent, re-briefed with the single failing item |
| `index.html` | generated |
| Grading the set against the owner's taste | never a subagent. Him. |

---

## 9. `npm run set -- check <id>`: the consistency check

**Every type:**
1. Every member in `set.json` exists on disk, and every file on disk is a member. No phantoms, no
   orphans.
2. No `http://` or `https://` font, script, or image in any member file. This is the check that
   would have caught all 98 rotted files.
3. `node scripts/check-geometry.mjs --floors-only --gate <member urls>` over every member.
4. Type budget per member: at most 4 distinct sizes, at most 2 distinct weights.

**FLOW adds:**
5. Every step URL returns its expected status with no unexpected auth redirect.
6. Every key in a step's `carries` appears in an earlier step's `produces`. A key with no producer
   is a screen you cannot reach by walking.
7. Step count on disk matches the manifest.

**DIRECTIONS adds:**
8. Every `differs_by` string is unique.
9. Every member renders the same content: same seed entity, same item count. He compares
   treatments, not data.
10. INFO: the grayscale similarity of each member pair, so two near-identical directions surface
    as a number instead of as his disappointment.

**FAMILY adds:**
11. Every member satisfies every `shared.assert`.
12. Cross-member spread: at each asserted selector, every computed property that differs across
    members, reported as INFO. This is the check that finds drift nobody thought to assert.
13. `membership.derived_by` re-runs, and any surface on disk that is not a member is reported.

Exit non-zero on a numbered failure. INFO never fails the run.

---

## 10. Tomorrow, in order

1. `scripts/set.mjs` with `new`, `brief`, `check`, `index`, `list`, plus the `"set"` package
   script.
2. `public/_mockups/_sets/_TEMPLATE/`, with `member.html` copied from
   `public/_mockups/sweep-salon-sections/index.html` and the CDN links stripped.
3. `scripts/workflows/set-build.workflow.js`.
4. **One proving set per pipeline, built end to end before any of this is called done:**
   - FLOW: `walkin`, the next unwired flow on the hub. Proves the manifest replaces the
     hardcoded array and that a second flow ships without waiting on approval of the first.
   - DIRECTIONS: the reviews section, which TASTE_LOG 2026-07-19/20 leaves OPEN with three
     directions already defined and an owner pick pending. It is a real open question, not a
     manufactured one.
   - FAMILY: empty states. The anatomy is settled law from 2026-07-21 and the members are
     derivable.
5. Extend `dev/mockups/page.tsx` to collapse a `_sets/<id>/` folder into ONE row showing type,
   member count, and verdict, instead of N loose file rows.
6. Only then wire the remaining flows.

**Not in scope, on purpose:** zero new hooks. `set check` is a command.
