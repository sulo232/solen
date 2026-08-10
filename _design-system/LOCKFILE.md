# Solen LOCKFILE — frozen literal values

**Status:** load-bearing. Every agent reads this verbatim. If a captured Fresha spec contradicts a value here, **the LOCKFILE wins.** Surface the conflict in your return message; never resolve it yourself.

**Why this file exists.** Without literal locked values, parallel subagents independently re-decide "what's the blue moment here" / "how dense is the spacing" / "what does Closed look like" hundreds of times across a sweep. The result: every section is locally "Fresha-accurate" but the whole site feels stitched together by 14 different designers. This file factors all global decisions out of the parallel work.

**When the LOCKFILE updates.** Only the orchestrator (not subagents) writes here. Subagents propose changes in their return message; orchestrator merges centrally between waves.

**V3-D origin.** Created 2026-05-27 (V3-D235). Council recommendation post-pre-mortem of the full-site sweep — both Opus and Grok independently identified the missing lockfile as the single highest-leverage thing.

---

## §0 — Hard rules (NEVER allowed)

1. **No emoji.** Anywhere in code / files / UI / commits. `lucide-react` icons only. (Allowed typographic glyphs: `→` `★`. The `·` middot is BANNED as a meta-separator — owner repeated flag; use spacing/comma/connector word per §6 + §13.5. The `●` status dot is banned as decoration except the live-status carve-out in §0.11.)
2. **Primary CTAs stay `bg-s-ink` (#0A0A0A)** — V3-D192-fix lock. Accent blue NEVER FILLS a primary action button (never a blue-filled primary, never two ink primaries). Blue is the HYPERLINK color, not the clickability color (v3 BALANCE, §1.5 — supersedes the v2 "generous on every interactive affordance" wording): blue lands on hyperlink-reading text only (review counts, inline body links, Mehr lesen, the one Passwort vergessen, Ändern jump-links, map/directions links — In Maps öffnen / Route, owner 2026-06-12, matches Fresha accent usage); See-all / tertiary / secondary buttons / icon tints stay INK. Blue stays OFF non-interactive text (eyebrows, body, prices, headings stay ink/grey). The one outcome/status-screen CTA exception is V3-D426.
3. **No category branches** in components — `if (category === 'X')` is forbidden. Same component renders for Coiffeur / Barber / Nails / Spa / Makeup / Waxing without conditionals. (Drift-checker rule B5.)
4. **No new semantic hues invented.** Use the §3 universal-color table. Success=green / error=red / warning=amber / info=blue / rating=yellow / save=pink / urgency=burnt-amber / disabled=ink-3. Don't pick a "nice teal" for a status. (V3-D197.)
5. **No `onClick={() => {}}` dead clicks.** Every interactive surface has a working handler OR uses `<ComingSoon>` wrapper.
6. **No hardcoded hex in JSX/TSX.** Use the Tailwind tokens below. Only exceptions: the per-token literal definitions in `tailwind.config.js` itself and the universal-color star/heart values that ARE the spec.
7. **Strict TypeScript.** No `any` without justification comment. No `// @ts-ignore`.
8. **No `git commit` or `git push` automatically** — user controls all commits.
9. **No `.env.local` edits** without explicit ask.
10. **No `npm run build`** unless asked — dev runs on port 3000.
11. **No decorative dots / pips.** (V3-D421L, owner: _"stop adding dotts everywhere"_.) No leading/trailing status dot on chips, toggles, eyebrows, list items, segmented controls, or any control. A toggle's ON state is shown by its active fill (blue tint) ALONE; a dropdown's affordance is its chevron. The ONLY exception is a universal-color status dot that IS the message and carries real live meaning — e.g. a `bg-s-success` "geöffnet" indicator or the `bg-s-accent` walk-in availability pulse ON A CARD. Decoration is never a valid reason for a dot. (Extends §2.5 eyebrow no-dot + §1 accent decorative-dot ban to ALL controls.)
12. **Copy minimalism (owner round 7, 2026-06-12).** (a) **SUPERSEDED 2026-07-24 by the owner's shipped decision (45b1d8a8c "Walk-in wait: show the FLOOR 'ab 55 Min', not the '55-70 Min' range", followed by 46cba1e58 purging the last range literal): a walk-in wait is a FLOOR, `ab {n} Min`, NOT a range and NOT a point estimate with "ca." / "~".** A range invited the customer to read the worst number and leave; the floor states the commitment. The old rule read: "Wait times are RANGES, never point estimates" with `20-35 Min` , that is history, kept here so the reversal is legible. The en-dash carve-out only ever existed for numeric ranges, so with ranges gone the plain no-dash rule stands everywhere. (b) Status labels are ONE word where possible: `Offen`, not "Walk-ins offen". (c) A module never repeats the name its entry control already gave it (the Termin/Walk-in toggle names the mode → the card shows NO "Walk-in" header) and carries NO tagline. (d) Queue/people visualization: at most 4 ahead-icons then `+N`, the customer's own spot blue-outlined; caption is the count only ("3 vor dir"). (e) No middot `·` separators in running copy — commas or stacked lines (extends rule 11).
13. **One canonical Mapbox map style, everywhere (owner 2026-07-23).** `mapbox://styles/solen32/cmpshru31000801s751e55735` (the Solen Studio style, solen32 account) is THE ONLY Mapbox style used anywhere in Solen — env-overridable via `NEXT_PUBLIC_MAPBOX_STYLE_LIGHT`, falling back to this id. Every map surface imports it from `lib/map-style.ts` (`SOLEN_MAP_STYLE` / `toStaticStylePath()`) — no component may define its own inline `mapboxgl.StyleSpecification`, hardcode a `mapbox://styles/...` literal, or fall back to a stock `mapbox/*` style. Measured: this style renders BLANK via the Mapbox Static Images API at every zoom 12-16 (~4KB response, no tiles) — it only renders through mapbox-gl, so every map surface must use live mapbox-gl, never the Static Images API, with this style.
    **Basemap config, everywhere (owner 2026-07-24).** The style is Mapbox Standard-based with one import, id `"basemap"`, and ships with `showPointOfInterestLabels`, `showPlaceLabels`, `showRoadLabels`, `showLandmarkIcons`, `showPedestrianRoads` all `false` (only `showTransitLabels` defaults `true`) — SUPERSEDED 2026-07-24: the owner reviewed the labelled map and rejected it — street names, store/POI names, place labels and 3D landmark objects are all OFF. `applySolenBasemapConfig` now sets those 5 flags plus `show3dObjects`/`show3dBuildings`/`show3dFacades`/`show3dTrees` to `false` explicitly, so a future style edit cannot silently re-enable them. The map is a quiet locator, not a wayfinding map. `lib/map-style.ts` exports `applySolenBasemapConfig(map)`, THE single place that sets them via `map.setConfigProperty("basemap", <key>, false)` — call it from every map surface's `"load"` (or `"style.load"`) handler (setConfigProperty before the style has loaded throws), never duplicate the flag list inline in a component. **Land/building contrast (owner 2026-07-24, round 3).** The owner reported the label-free map read "so empty, like all white". MEASURED cause: `colorLand` is `hsl(20,0%,100%)` (pure white) and `colorBuildings` was `#E4E4E7` (s-border) - a ~5.9pp lightness delta, so footprints were invisible against the ground. `applySolenBasemapConfig` now sets `colorLand` = `#F4F4F5` (s-bg-sunken) and `colorBuildings` = `#6B6B6B` (s-ink-2), a ~53.9pp delta. Both are design-system neutrals. Wired into `SalonLocation.tsx`, `NearbyMap.tsx`, and `components-legacy/MapView.tsx`. **SUPERSEDED (owner reference IMG_6693, round 4/5, 2026-07-24).** The owner then rejected BOTH the label-free look and the dark `#6B6B6B` buildings, and gave a reference image: labels + POI back ON, LIGHT-grey buildings, white roads. Current law: `showPointOfInterestLabels`/`showPlaceLabels`/`showRoadLabels`/`showLandmarkIcons`/`showPedestrianRoads` = `true`; `show3dObjects`/`show3dFacades`/`show3dTrees` = `false` but `show3dBuildings` = `true` (buildings must render to be coloured); `colorLand` = `#FFFFFF` (white), `colorBuildings` = `#E4E4E7` (s-border, light grey). CRITICAL MECHANISM: these are applied via the exported `SOLEN_BASEMAP_CONFIG` object passed to the mapbox-gl **Map constructor** (`config: { basemap: SOLEN_BASEMAP_CONFIG }`), NOT only via `setConfigProperty` on `"load"` — the on-load path RACES the Standard basemap import and silently no-ops (root cause of the map rendering dark sometimes, near-white other times). Never rely on the on-load setConfigProperty alone for basemap config.

    **Distance-calibrated zoom (owner 2026-07-24).** A single fixed `maxZoom` is wrong - a 189 m stop and a 900 m stop cannot share a framing. `SalonLocation.tsx` exports `maxZoomForStopDistance(distanceMeters)`: `<=150m -> 16.0`, `<=250m -> 15.5`, `<=400m -> 15.0`, `<=600m -> 14.5`, `>600m -> 14.0` (floor clamp), fed by the real `distanceMeters` from `/api/transit/nearest-stop`. Never reintroduce a hardcoded map zoom constant.

---

## §1 — Color tokens (literal hex)

### Chrome (Layer 1 — neutral)

| Token | Hex | Usage |
|---|---|---|
| `s-ink` | `#0A0A0A` | Primary text + primary CTA bg |
| `s-ink-2` | `#6B6B6B` | Secondary text |
| `s-ink-3` | `#6B6B6B` | Tertiary text (collapsed onto ink-2 per V3-D138) |
| `s-ink-disabled` | `#C5C8C4` | Disabled state |
| `s-border` | `#E4E4E7` | Hairline borders — COOL neutral (v2 rule 4; reverses warm V3-D447 #E0DDDB / V3-D460 #E8E4DF) |
| `s-bg.base` | `#FFFFFF` | Page base |
| `s-bg.surface` | `#FFFFFF` | Card surface |
| `s-bg.raised` | `#FFFFFF` | Raised / modal surface |
| `s-bg.sunken` | `#F4F4F5` | Hover bg, input active, inert surface — COOL light grey (v2 rule 4; reverses warm #F8F5F2) |
| `s-bg.active` | `#F4F4F5` | Input typing active state |
| `white` | `#FFFFFF` | Pure white (text on dark) |
| `black` | `#000000` | NEVER use (eye strain). Use `s-ink` instead. |

**Closed-inventory rule (DS-3, video-audit 2026-06-11, owner-approved):** the table above is the ENTIRE
neutral vocabulary. Every grey in code must be one of these tokens — no new `rgba()` greys, no one-off
`#`-hex neutrals, no ad-hoc `/40`-style opacity neutrals (the in-card divider `border-s-border/60` and
the locked FROST_GLASS/scrim recipes are the only sanctioned alpha uses). Ad-hoc neutrals are where
"inconsistent everywhere" starts; drift-checker should flag any hex/rgba neutral outside this set.

### Brand accent (Layer 2 — royal blue = THE HYPERLINK COLOR, v3 2026-06-11, SPARSE; heading corrected 2026-07-12, the old v2 "generous on anything tappable" wording was superseded by §1.5 v3 below)

| Token | Hex | Usage |
|---|---|---|
| `s-accent.DEFAULT` | `#276EF1` | **v3 (2026-06-11, council): BLUE = THE HYPERLINK COLOR, not the clickability color (supersedes v2 "generous").** Lands ONLY on text that reads as an `<a href>` inside prose — review counts "(12)", inline body links, Mehr lesen, the one Passwort vergessen, checkout Ändern jump-links — plus locked system states (focus-visible rings, `<Spinner>` arc, form-input focus, §13.2 stepper discs). See-all / Skip / tertiary links / secondary buttons / icon tints = INK. Squint test ~3 blue strings per viewport, 0-1 on forms. GUARDRAIL: OFF non-interactive text; never FILLS a primary CTA. See §1.5 v3. Hex collapsed to #276EF1 (DEFAULT = deep = bright, matches code + CANON). |
| `s-accent.deep` | `#1E54B7` | **DS-6 (2026-06-11, video-audit, owner-approved): the hover/pressed step for interactive blue.** Any blue text link / chip / inline action darkens to this on hover + active (150ms). Re-activated from the flattened alias; supersedes the old #185CE0 value (shown + approved on the ds-site mockup). NOT a second accent — never used at rest. |
| `s-accent.bright` | `#276EF1` | The OLD royal #276EF1 preserved for places that need the punchier hit (large icons, hero accent moments). Use sparingly. |
| `s-accent.pale` | `#EAEFFE` | Pale wash for selected-tab bg / focus glow. Unchanged. |

### Semantic UI (Layer 3 — universal-color convention, color IS the message)

| Semantic | Token | Hex | Light bg |
|---|---|---|---|
| Success / open (inline chips/pills) | `s-success.DEFAULT` / `.bg` | `#16A34A` | `#E8F5E9` |
| OPEN-status ONLY (Geöffnet text + open dot: StatusPill / StatusInline / Öffnungszeiten) | `s-open.DEFAULT` | `#1F8900` | — (Fresha's calmer open-green, owner 2026-06-12 "make the green more like fresha"; s-success stays the universal success green everywhere else) |
| Success FOCAL (confirm / paid / done-step) | `s-success.DEFAULT` | `#16A34A` | white check on a solid **normal-green** disc. **Deep `#15803D` REVERTED 2026-06-10** (owner: normal green, not deep) — focal + inline now share `#16A34A`. The disc reads confident via SIZE + solid fill + white check + spring-pop, not via a darker hue. |
| Error | `s-error.DEFAULT` / `.bg` | `#DC2626` | `#FEE2E2` | <!-- V3-D421 consolidated error onto the locked red (error == closed, ONE red system); code-verified tailwind.config.js:178; doc corrected 2026-07-12, was stale #D32F2F/#FFEBEE -->
| Warning | `s-warning.DEFAULT` / `.bg` / `.text` | `#F1AE27` / `#FDF6E7` | `.text` `#B45309` (text-on-pale ONLY; de-muddied from #906309 V3-D424). Derivation (folded from CANON §1/§8): amber = the accent's twin, same HSL S+L (88%/55%), hue 40°; if it ever reads too golden for a warning, the sanctioned deeper sibling is `#E09A0C` (same hue+sat, L ~46%) , owner pick required before swapping. |
| Info | use `s-accent` | `#276EF1` | `#EAEFFE` |
| Rating star | `s-star` | `#FFC32B` | — |
| Save / heart | `--heart-active` | `#FF3366` | — |
| Urgency (last-min / off-peak) | `s-urgency.DEFAULT` / `.bg` / `.border` | `#C2410C` | `#FFF1E6` / `rgba(194,65,12,0.22)` |
| Surcharge / extra-charge (FOCAL) | `s-surcharge.DEFAULT` / `.bg` | `#EA580C` | `#FFEDD5` |
| Escalated / urgency badge (vivid) | `s-pop` | `#C03001` | — |
| Closed | `s-closed` | `#DC2626` | (same hex as `s-error` since V3-D421 — one red system; kept as a named alias in code) |
| Disabled | `s-ink-3` | `#6B6B6B` | — |

**🟠 Focal-vs-text rule (V3-D424, 2026-06-02):** the dark amber/orange tokens — `s-warning.text` (`#B45309`), `s-urgency` (`#C2410C`) — exist for **small text on a pale bg** (readability), and must **NEVER** be used as a focal/hero color (a big number, a status band): as a focal they read muddy/muted. For a vivid warm focal use **`s-surcharge`** (`#EA580C`) on its light `.bg`. General pattern: **focal/hero = the vivid `DEFAULT` token; small-text-on-pale = the dark `.text` token.** (Origin: repeatedly shipping muted oranges by grabbing `.text` tokens as focal fills.)

**🟥 Outcome-driven color rule (V3-D425, 2026-06-02):** color IS the message — a case/order's focal amount + state elements inherit their OUTCOME automatically, never a neutral default: **declined / canceled / void → red (`s-error`)**, **refunded / approved / charged → green (`s-success`)**, **pending (open / in-review / escalated) → blue (`s-accent`)**, closed/unknown → neutral. A declined refund must NOT show its amount in neutral blue. Codified: `components-legacy/refund/shared.ts` → `caseAmountColor(status)` (returns the text-color class from the status).

**🎨 Outcome-colored PRIMARY CTA (V3-D426, 2026-06-02):** extends V3-D425 to the *action itself* — on OUTCOME / RESULT / STATUS screens (payment result, refund status, 3-D Secure verification, dispute outcome), the primary CTA inherits the screen's semantic state colour: **verify / info / pending → blue (`s-accent`)**, **success / done → green (`s-success`)**, **error / failed → red (`s-error`)**, **surcharge / pay-the-extra → orange (`s-surcharge`)**. This is a **scoped EXCEPTION to the default ink primary CTA** (the V3-D192-fix marketing-CTA discipline + §3): it applies ONLY on outcome/status screens, never on marketing or standard booking CTAs (those stay `s-ink`). Reference: `public/solen-upcharge-payflow-states.html`. ⚠️ Caveat (owner discretion): a **red CTA on a constructive *retry* action** is debatable — red conventionally signals destructive/stop, so the alternative is to keep the error icon+message red but use ink/blue for the "try again" button.

### Chart-grey (Layer 4 — data visualization, V3-D315 2026-05-27)

| Token | Hex | Usage |
|---|---|---|
| `s-chart-1` | `#0A0A0A` | Primary chart row (alias of `s-ink` — use for the Solen brand bar in any competitor-comparison chart) |
| `s-chart-2` | `#9CA3AF` | Secondary chart row (e.g. main competitor / Treatwell bar in /partner pricing chart) **PLUS, since the owner-approved FLOORS LAW of 2026-07-21 (§17.4 below), the reinstated TERTIARY TEXT grey: chevrons, placeholders, timestamps, hints. NON-load-bearing text ONLY , forbidden on any copy the user has to read to decide.** This row previously named only the chart role, so the text role read as an undefined token. |
| `s-chart-3` | `#D1D5DB` | Tertiary chart row (e.g. competitor range / "others" bar in /partner pricing chart) |

**Why discrete tokens (not opacity-modifier):** opacity-modifier-on-ink-2 (`bg-s-ink-2/40` / `bg-s-ink-2/30`) is a smell — it conflates hierarchy with transparency. Discrete chart-grey tokens make data-vis intent explicit + readable to drift-checker. Use this scale ONLY for bar/line/area charts (NOT for general UI grey).

**Multi-series + legibility (DS-A3, video-audit 2026-06-11, dashboard-only):** when a dashboard chart
needs >2 DISTINCT series (not hierarchy), derive hues in OKLCH from `s-accent` — fixed lightness+chroma,
hue stepped +25–30 per series (perceptually even, no neon-green-next-to-dull-blue). Customer surfaces
keep the grey scale above. Legibility rules for every chart: visible axis labels, FLAT bar tops (no
rounded caps that hide the value), bar count = datum count. "Dribbble-pretty but unreadable" is drift.

### RETIRED — never use in new code

- `s-coral`, `s-cream`, `s-butter`, `s-sage`, `s-wasabi`, `s-droplet`, `s-cool`
- ~~`s-pop`~~ — **UN-RETIRED V3-D424 (2026-06-02):** it's a vivid vermilion `#C03001`, actively used as the escalated/urgency badge dot+text (dashboard `DashStatusPill` `urgent` tone). Distinct from `s-surcharge` orange + `s-error` red. Tailwind keeps it ("urgency badges only") — this reconciles the doc with reality.
- `s-amber` — **PERMANENTLY KILLED V3-D320 (2026-05-27)** per user pick on Q-W7-A. Was an orphan reference rendering invisible. All callsites swept: star/rating context → `s-star` (#FFC32B yellow), warning/alert context → `s-warning` (#F1AE27 amber per LOCKFILE §1 universal-color table). NO alias added — drift-checker will reject any new `s-amber` usage. If you need amber for warnings use `s-warning`; if for rating-yellow use `s-star`.
- `s-atm-*` family (warm / cool / cream / terra / sage / bone / butter)
- `s-cat-*` family (coiffeur / barbershop / nails / spa — and their `-text` variants)
- `s-love` family (replaced by `--heart-active` for save, `s-error` for error)
- `Geist` — **REJECTED 2026-05-30** ("no Geist anywhere"); V3-D317 swap reverted. `Hanken Grotesk` — **REPLACED by `Inter` V3-D410 (2026-05-31)**. `JetBrains Mono` — **RETIRED 2026-06-10 (V3-D470)** for codes (owner: "the W-047 font is different"); codes now Inter Tight tabular (§13.4). Active type = Inter Tight + Inter only. See §2.

Drift-check `RETIRED_TOKENS` list flags any new usage.

---

## §1.5 — Accent Application Rules (V3-D330, 2026-05-28)

**Rule:** `s-accent` (any shade — DEFAULT / deep / bright / pale) may only be applied to surfaces in the ALLOWED list. The FORBIDDEN list is enforced by drift-check rule A9.

**Rationale:** Measured Uber inventory + feedback-blue research (cited as `public/_pixel-refs/uber/feedback-blue/UBER-FEEDBACK-BLUE.md` + `UBER-BLUE-INVENTORY.md`; **flagged 2026-08-03: neither file is on disk , `public/_pixel-refs/uber/` is an empty directory , and neither appears anywhere in git history, so this rationale's evidence is currently unverifiable. The RULE above is unaffected and stays locked; only its citation is dangling**) confirms Uber gates DECORATIVE blue tightly. **UPDATE v2 (2026-06-09):** the owner reversed this for INTERACTIVE elements — "use blue a lot for links/clickable stuff." The Uber-minimal-blue evidence still governs NON-interactive decoration (no blue eyebrows / hero spans / decorative dots / body emphasis — that is the "vibrating blue text" complaint), but links, see-all/view-all, active tabs, secondary & ghost buttons, and inline action labels are now blue. Blue marks INTERACTION, not emphasis. (Solen's old failure was painting blue on ~8-12% of pixels via NON-interactive eyebrows / hero spans / decorative dots — that part stays forbidden.)

### §1.5.0 — THE COLOR MODEL (V3-D460, 2026-06-09, council + owner-approved) — read first

**The root insight (resolves the "too dead-grey" ↔ "too much blue" oscillation):** a non-interactive area reads *dead* when it has no imagery, motion, or semantic colour — NOT because it lacks blue. Surfaces are WHITE-FIRST + COOL (white #FFFFFF, cool sunken #F4F4F5, cool hairline #E4E4E7) — the warm-cream "stone" foundation is DROPPED (rule 4). Life on a non-interactive area comes from imagery + motion + semantic colour on a clean cool surface, never from warm cream and never from painting blue on a non-tappable thing. **v3 (2026-06-11) scope for blue: the HYPERLINK colour** (~~v2's "generous interactivity colour" is retired~~ — it flooded the chrome). Adding blue to NON-interactive decoration to fake life remains the #1 colour mistake; the #2 is painting blue on tappable-but-not-hyperlink chrome (See-alls, secondaries, icon tints).

**Where "life"/colour comes from, in priority order:**
1. **Cool neutrals + whitespace** — the surface itself (white #FFFFFF default, cool sunken `#F4F4F5`, cool hairline `#E4E4E7`; v2 rule 4 reverses the V3-D460 warm #F8F5F2/#E8E4DF). The clean B&W base; whitespace + restraint carry *every* screen with zero accent.
2. **Real photography** — salon photos. On any screen with a photo, the photo IS the colour. Keep adjacent UI neutral and let the image lead.
3. **Semantic colour (Layer 3)** — green=paid/confirmed/open, yellow=rating, pink=saved, red=error, amber=warning. Colour ONLY where it carries meaning/state.
4. **Motion** — the dynamic delight layer (SuccessMark, press feedback). Premium feel without a single hue.
5. **Accent blue** — the HYPERLINK layer (v3 2026-06-11, supersedes the v2 "generous interactivity" framing). Reserved for text that reads as a hyperlink inside prose (review counts, inline body links, Mehr lesen, Passwort vergessen, Ändern jump-links) plus the system states (focus ring / spinner / input focus / stepper discs). Everything else tappable signals with AFFORDANCE (chevron / weight / position), in ink. Stays OFF non-interactive text/decoration.

**Per-element decision rule** (ask in order, stop at first yes):
1. Carries state/meaning? → semantic colour.
2. Strong photo adjacent? → keep neutral, let the photo carry it.
3. The one primary commit action? → ink fill (`bg-s-ink`).
4. A system focus/loading state? → blue (ring / spinner / input focus).
5. Would this text read as an `<a href>` inside prose (review count, inline body link, Mehr lesen, the one form helper, Ändern jump-link)? → **BLUE** `text-s-accent`. Everything else tappable — secondary/ghost buttons, See-all, Skip/Später, tertiary under-CTA links, icon tints, tappable rows → **INK** with affordance (chevron / weight / position), per v3. Only the ONE primary commit button is ink-FILLED. Steppers / icon controls sitting OVER a photo still follow CONTROL_ELEVATION (frosted glass).

~~v2 reversal (2026-06-09): ALL text links blue, generous, blue-ghost secondaries~~ **RETIRED by v3 BALANCE below (2026-06-11)** — the generous model produced the owner's "you made everything blue" rejection. Standing guardrail survives: blue stays OFF non-interactive text — a blue word must be a real link, never emphasis; eyebrows / prices / body / headings stay ink/grey. The one primary commit button stays ink-filled.

### ✓ ALLOWED accent applications (v3 BALANCE, 2026-06-11 — council-ruled, supersedes the v2 "generous" model)

**Philosophy (Opus council, owner-triggered): BLUE IS THE HYPERLINK COLOR, NOT THE CLICKABILITY COLOR.**
Nearly everything on a dense booking screen is tappable — if blue marks "tappable", blue eats the chrome
(the exact owner complaint, twice). Affordance (chevron / weight / position) signals tappable
universally; blue is reserved for text that would read as an `<a href>` inside prose. The v2 "generous,
no cap" model is RETIRED (it contradicted the 2026-06-10 sparse owner lock in CANON §0 / memory — this
rewrite resolves that contradiction).

**v3.1 (owner, 2026-06-11): NO UNDERLINES on ink links.** The ink-link affordance is weight
(`font-semibold`) + the lighter `text-s-ink-2` shade + position (centered under a CTA / trailing a
sentence), NEVER `underline` at rest. Hover may darken to `text-s-ink`. Blue inline links also sit
bare at rest (no resting underline).

**Squint test (per screen):** zoom out — blue must disappear into the prose. Soft ceiling ~3 blue strings
per viewport on content screens, 0–1 on forms/full-page states. If one blue string repeats inside the
same component, or 3+ blues line up vertically ("blue staircase"), demote the weakest to ink.

| Surface | Verdict | Recipe |
|---|---|---|
| Review counts "(12)" / small tappable metadata in text | **BLUE** | `text-s-accent` semibold, `hover:text-s-accent-deep` |
| Inline "Mehr lesen" expander (owner-ordered) | **BLUE** | inline, semibold |
| Inline links inside body sentences | **BLUE** | the canonical case; bare at rest, hover darkens to deep |
| "Passwort vergessen?" (the ONE auth helper) | **BLUE** | only blue string on the form |
| Ändern jump-links in checkout summary | **BLUE** (owner-approved exception to no-repeat) | right-aligned 13px semibold |
| Bare inline action label attached to data (Wegbeschreibung next to an address, as TEXT not a button) | **BLUE** | text-as-link; if given button geometry → ink |
| See-all / Alle ansehen section links | **SPLIT by intent (owner 2026-07-19, supersedes the blanket ink-chevron)** | Services + Reviews see-all = the gray PILL (`bg-s-bg-sunken px-8 py-3`, owner-approved 2026-07-15, reconfirmed 2026-07-19 , it is a booking-flow ENTRY, so it earns button affordance). Team/stylist see-all = INK text + `ChevronRight text-s-ink-3` (light , it sits beside a busy avatar row and read too big as a pill). `SeeAllButton` variants: default `pill` / `link`. LESSON: the pill was blanket-"fixed" to ink once by applying this row over the component's dated approval , a dated owner decision on a component ALWAYS outranks a blanket row here. |
| Skip / Später / tertiary under a primary CTA | **INK-2/3** lighter weight, centered | never blue |
| "Zur Startseite" / "Stattdessen anmelden" under CTAs (404/success/auth) | **INK-2** semibold, NO underline (v3.1) | weight + position carry it; hover → `text-s-ink` |
| Secondary / ghost buttons | **INK** outline (never blue-filled, never blue-ghost) | CONTROL_ELEVATION B |
| Feature-row icon tints (gift, voucher, …) | **INK** on `bg-s-bg-sunken` | icons are content, not actions |
| `:focus-visible` ring / `<Spinner>` arc / form-input focus | **BLUE** (locked system states) | unchanged |
| Stepper discs (§13.2) / walk-in LIVE pill | **BLUE** (locked progress language) | unchanged |

**GUARDRAIL:** blue stays OFF non-interactive text (eyebrows, body, prices, headings) AND off
button-geometry elements (anything padded / right-aligned / centered-under-a-CTA / arrowed). Drift A9
flags blue on non-interactive text + blue-filled primaries; the squint test catches the rest.

### ✗ FORBIDDEN — sweep to ink/semantic instead

| Current usage | Sweep to |
|---|---|
| `text-s-accent` on eyebrow / label | `text-s-ink-3` |
| `text-s-accent` on a real tappable link | v3 split: hyperlink-reading text (review counts, inline body links, Mehr lesen, Passwort vergessen, Ändern) KEEPS blue (bare at rest, hover → deep); See-all / Skip / tertiary / button-geometry links sweep to INK + affordance, no underline (v3.1) |
| `text-s-accent` on NON-interactive emphasis (a word that is not a link) | `text-s-ink` + bold weight — blue means tappable, not emphasis (v2 rule 2) |
| `text-s-accent` on hero accent span | `text-s-ink` (single word can use weight contrast instead) |
| `bg-s-accent-pale text-s-accent` pill | Either `bg-white text-s-accent` OR `bg-s-accent-pale text-s-ink` — never both blue |
| ~~`bg-s-accent` step circle (blue is banned on steppers)~~ **SUPERSEDED 2026-06-11:** steppers ARE blue (owner-approved booking mockups + shipped walk-in tracker + BookingWizard). Recipe in §13.2: done = `bg-s-accent` + white icon, current = white + inset blue ring + 5px halo, future = `bg-s-bg-sunken`. Green stays a STATE color (success/confirmed), never progress. | use the §13.2 blue recipe |
| `text-s-accent` decorative dot / icon tint | `text-s-ink-3` or `text-s-success` (if completion-coded) |
| `border-s-accent` on resting card | `border-s-border` |

---

## §2 — Typography (literal values)

### Font families (V3-D410, 2026-05-31 — current; this section had drifted, corrected)

```ts
display: ["'Inter Tight'", "system-ui", "-apple-system", "sans-serif"]
heading: ["'Inter Tight'", "system-ui", "-apple-system", "sans-serif"]
body:    ["'Inter'", "system-ui", "-apple-system", "sans-serif"]
// NO mono family. Codes (W-047 / GIFT-7K2M / refs) = Inter Tight tabular — see §13.4. JetBrains Mono RETIRED 2026-06-10.
```

**Codes are NOT a monospace.** Owner rejected the mono code-face 2026-06-10 (the "W-047 font is different"). Ticket numbers, voucher/gift codes, and booking refs use **`Inter Tight` 600–700 + `font-variant-numeric: tabular-nums` + `-0.01em`** (the `.num` recipe), giving aligned digits + a code feel without a foreign mono texture. JetBrains Mono is retired; no `mono` font key. See §13.4.

**History (doc was stale — fixed 2026-05-31):** V3-D317 swapped everything to single-family **Geist**; that was **reverted app-wide 2026-05-30** per user ("no Geist anywhere") back to Inter Tight + Hanken Grotesk. V3-D410 (2026-05-31) then swapped **body Hanken → Inter**: Hanken's 400 read thin, and Inter mirrors Uber's own structure — one family in two optical cuts (`Inter Tight` + `Inter` ≈ Uber Move + Uber Move Text, verified against uber.com computed styles). Hierarchy = weight + size, not family contrast.

**NEVER:** Geist (rejected by user — "no Geist anywhere"), Hanken Grotesk (replaced by Inter, V3-D410), JetBrains Mono / any monospace for codes (rejected V3-D470 2026-06-10 — codes → Inter Tight tabular per §13.4), Peace Sans (retired), Plus Jakarta Sans (retired V3-D189), Bricolage Grotesque (retired V3-D190), system-default-only (must specify family).
**ACTIVE:** Inter Tight (display/headings + codes-as-tabular) · Inter (body). Two optical cuts of one family — no third face.

### Scale (role × size × weight × line-height × tracking)

**V3-D325 (2026-05-27): Uber-aligned scale** — applied to Page H2, Section H2, Subsection H3, body, eyebrow, CTA. All heading weights uniformly 600 EXCEPT Hero H1 (see next note).

**V3-D327 (2026-05-27): Hero H1 = Fresha-exact** — overrides Uber for hero only. Per council (Grok 2× consistent): Solen's actual category peer is Fresha (salon-booking marketplace), not Uber (transport). Hero gets editorial weight (40-64 / 700), rest of site keeps Uber-aligned discipline. This hybrid is intentional — the hero is a self-contained editorial block that benefits from larger type + heavier weight; sections below it benefit from the tighter Uber scale.

| Role | Mobile | Desktop | Weight | LH | Tracking | Font |
|---|---|---|---|---|---|---|
| **Hero H1** (homepage hero "Termin in 30 Sekunden.") — V3-D327 Fresha-exact | **40px** | **64px** | **700** | **1.1** | **-0.02em** | display |
| **Salon-PDP H1** (salon name in hero) | 30px | 34px | 600 | 1.1 | -0.02em | display |
| **Salon-sidebar H2** (salon name in right rail) | 22px | 26px | 600 | 1.15 | -0.02em | display |
| **Page H2** (section titles on /business) | 22px | 26px | 600 | 1.2 | -0.015em | display |
| **Section H2** (homepage / PDP section heading) | 18px | 20px | 600 | 1.25 | -0.01em | display |
| **Subsection H3** (card name in BentoCard) | 16px | 18px | 600 | 1.3 | -0.01em | display |
| **Eyebrow** (small label over sections) | 11px | 12px | 600 | — | 0.08em | body |
| **Body large** (sub-headlines, lead text) | 14px | 16px | 400 | 1.4 | -0.015em | body |
| **Body** (default paragraph) | 14px | 15px | 400 | 1.55 | normal | body |
| **Body small** (meta rows, secondary) | 13px | 14px | 400 | 1.4 | normal | body |
| **Caption** (tiny labels, badge text) | 11px | 12px | 500 | — | 0.06em (~~uppercase~~ sentence case) | body |
| **CTA** (button label) | 14px | 15px | 500 | — | -0.005em | body |
| **Service-row name** | 15px | 16px | 600 | — | — | body |
| **Service-row duration** | 13px | 14px | 400 | — | — | body |
| **Service-row price** | 14px | 15px | 600 | — | — | body |
| **Team-card name** | 14px | 15px | 500 | tight | — | body |
| **Team-card role** | 12px | 13px | 400 | snug | — | body |
| **Star rating large** (sidebar 5.0) | 18px | 20px | 600 | 1.0 | — | body |
| **Star rating small** (card 4.8) | 14px | 14px | 600 | — | — | body |

**Common clamp() patterns (use these literal values for new code):**

```
Hero H1:      text-[clamp(40px,10vw,64px)]     font-bold leading-[1.1] tracking-[-0.02em]   (V3-D327 Fresha-exact)
Hero sub:     text-[clamp(16px,4vw,22px)]      font-normal leading-[1.3] tracking-[-0.015em] (V3-D327 Fresha-exact)
Page H2:      text-[clamp(22px,2.8vw,26px)]    font-semibold leading-[1.2] tracking-[-0.015em]
Section H2:   text-[clamp(18px,2vw,20px)]      font-semibold leading-[1.25] tracking-[-0.01em]
Subsection:   text-[clamp(16px,1.6vw,18px)]    font-semibold leading-[1.3] tracking-[-0.01em]
Eyebrow:      text-[11px] md:text-[12px]       font-semibold tracking-[0.08em]      (sentence case , see the NO-CAPS note below)
Body:         text-[clamp(14px,3.5vw,16px)]    font-normal leading-[1.55]
```

**Hero spacing chain (V3-D327 Fresha-exact, mobile 375):**
```
Header bottom → H1 top:           64px (pt-16 on hero outer)
H1 → Sub:                          12px (mb-3)
Sub → Search card:                 64px (mt-16 on SearchCard wrapper)
Search card shadow:                NONE (was 4-layer white-glass rim — drift drop)
```

### Weight scale (V3-D410, 2026-05-31 — Geist refs corrected to current fonts)

Hierarchy uses **size** + **position** + **tracking** — NOT compound family contrast. Uber-aligned: body 400, 500 for emphasis chips / CTAs / nav / labels, headings 600. (uber.com itself runs 400 body / 500 nav-labels / 700 headings; Solen holds headings at 600 per V3-D325 — Inter Tight 600 carries section weight without going press-shouty.)

- Body default = **400** (normal) — **Inter 400 reads solid. This is the V3-D410 fix: Hanken's 400 read thin, Inter's does not.**
- CTA / chip / tile label / nav / interactive = **500** (medium)
- ALL headings (Hero H1 / Page H2 / Section H2 / Subsection H3) = **600** (semibold)
- Service-row price + star rating + secondary emphasis within text = **600** ⚠️ code drifted to 400 on service price — bump to 600 to match this lock (PDP file; coordinate with the PDP worktree)
- NEVER below 500 for nav / labels / prices / buttons — that's the thin look the user flagged
- NEVER 800 / extrabold — clumsy · NEVER 300 / light — reads thin on mobile

**Weight class sweeps applied:**
- V3-D317: `font-extrabold` (800) → `font-bold` (700) — 82 callsites
- V3-D317: `font-light` (300) → `font-normal` (400) — included
- V3-D325: `font-bold` (700) → `font-semibold` (600) ONLY in heading contexts (`font-display` / `font-heading` classes) — 74 callsites → 129 total semibold headings

---

## §2.5 — Type Role Registry (V3-D330, 2026-05-28) — ENFORCED

**Rule:** Every typography callsite maps to ONE of the 11 enumerated roles. Each role has ONE locked recipe (size, weight, case, tracking, color). Drift-check rule A7 flags any `uppercase` Tailwind class outside `Eyebrow` or `Tag/Status` role. Rule A8 flags any `tracking-[*em]` outside the canonical set. Rule A9 enforces accent rules from §1.5.

**Rationale (root cause fix):** Audit found 19 distinct "primary CTA" variants, 20 distinct letter-spacing values, 733 uppercase usages across rebuilt routes. No upstream policy enforced role→recipe pairing. Every component invented its own variant. Each user-reported symptom ("cheap CTA fonts" / "blue text vibrates" / "busy hierarchy") traces to this missing layer. Registry + drift rules close the loop.

### The 11 roles

| Role | Size (mobile→desktop) | Weight | Case | Tracking | Color | Max/surface |
|---|---|---|---|---|---|---|
| **Hero H1** | clamp(28,7vw,64)px | 700 | sentence | -0.02em | `s-ink` | 1 |
| **Hero sub** | clamp(15,4vw,22)px | 400 | sentence | -0.005em | `s-ink-2` | 1 |
| **Page H2** | clamp(22,2.8vw,26)px | 600 | sentence | -0.015em | `s-ink` | unlimited |
| **Section H2** | clamp(18,2vw,20)px | 600 | sentence | -0.01em | `s-ink` | unlimited |
| **Subsection H3** | 16→18px | 600 | sentence | -0.01em | `s-ink-2` | unlimited |
| **Body** | clamp(14,3.5vw,15)px | 400 | sentence | 0 | `s-ink-2` | unlimited |
| **Meta** | 12→13px | 400 | sentence | 0 | `s-ink-3` | unlimited |
| **Primary CTA** | 15px | 500 | sentence | -0.005em | white on `s-ink` | 1-2 |
| **Secondary CTA** | 15px | 500 | sentence | -0.005em | `s-ink` + `border-s-border` | 1-2 |
| **Tab label** | 14px | 500 | sentence | 0 | `s-ink-2` (active: gray fill `bg-s-bg-sunken` + `text-s-ink` + semibold — the TabPill treatment per the 2026-06-29 selected/active law; corrected 2026-07-12, the old blue-underline note cited dead v2 rule 1. A distinct top-nav underline TabNav does not exist; if one is ever built its active color needs its own dated owner call) | (one nav per route) |
| **Eyebrow** | 11→12px | 600 | **UPPERCASE** | 0.08em | `s-ink-3` | **max 1** |
| **Tag / Status** | 10-12px | 600 | **UPPERCASE** | 0.06-0.08em | semantic (success/warn/error) | small footprint |

### Core ramp , the everyday default (2026-06-09, owner-approved; Tim Gabe "random sizing kills cohesion")

The 11 roles above are the full set; **day-to-day, ~90% of text is just these 6.** A salon-page audit found the rest was drift (body scattered across 12/13/14px, micro-text at 11px). Always pick a role, never an ad-hoc `text-[Npx]`:

| Use | Role | Px / weight |
|---|---|---|
| Page title | Page H2 | 22 / 600 Inter Tight |
| Section heading | Section H2 | 18 / 600 Inter Tight |
| Card title / anchor | Subsection H3 | 16 / 600 |
| Body | Body | 14 / 400 |
| Secondary / meta | Meta | 13 / 400 |
| Label / eyebrow | Eyebrow | 12 / 600 UPPERCASE |

**Hard rules:** nothing below **12px** (legibility); titles anchor at **16** (not a stray 15); body is **14** flat (drop the desktop-15 bump). 15px stays reserved for the CTA roles only. Drift-checker flags off-ramp sizes so the sprawl can't return.

**Per-screen budget (HARD, the Tim Gabe "4 levels" senior bar; was a soft "aim for" in SOLEN_UI §199):** the 11 roles are the *app-wide* vocabulary; on any **single screen**, draw from **≤4 distinct sizes and ≤2 weights**. Count them before shipping. This is dimension 4 of `SENIOR_SCORECARD.md`, verified by **DOM measurement** of the rendered screen (count distinct computed font-size/weight on the screen's own container; a static per-file count is too noisy to gate on, so it is NOT a drift rule). Sub-12px specifically IS a static drift rule (A19, INFO until the sub-12px sweep clears the ~102 legacy instances). The confirmation page shipped with ~11 sizes — exactly the failure this closes; the rebuild measures 4 sizes / 2 weights. More: a screen ships only at 5/5 on the scorecard.

### Canonical tracking values (rule A8 enforces this set)

```
-0.02em   — Hero H1
-0.015em  — Page H2 / Body large
-0.01em   — Section H2 / Subsection H3
-0.005em  — Hero sub / Primary CTA / Secondary CTA
0         — Body / Meta / Tab label / Subsection inline
0.06em    — Tag/Status compact
0.08em    — Eyebrow / Tag/Status default
```

Everything else (`.04em`, `.07em`, `.10em`, `.12em`, `.14em`, `.15em`, `.16em`, `.18em`, `.1em`, `.20em`, `.22em` — currently 20 distinct values in use) → drift rule A8 logs to `_pending-migration.md`. Phase 2 sweep collapses callsites onto canonical set.

**Display-type recipe (DS-A1, video-audit 2026-06-11):** any text ≥22px takes `-0.02em` tracking +
line-height 110–120% (`leading-[1.1]`–`leading-tight`) as ONE recipe — no per-page improvising.
Dashboard surfaces cap at 24px (information density); customer marketing/heroes may go larger.

### Uppercase application policy (rule A7) — **SUPERSEDED 2026-06-18: uppercase is banned outright**

**Current law (owner, 2026-06-18, emphatic, verbatim): "stop using caps... use them fucking text.
Never fucking caps lock."** ZERO roles allow uppercase in product UI — not the Eyebrow, not
Tag/Status. Sentence case everywhere ("Dein Haar", never "DEIN HAAR"). This **supersedes** the
two-role carve-out preserved below, and it is not advice: `~/.claude/hooks/copy-lint-gate.py`
(NO-CAPS, merged from `no-caps-gate.py` 2026-07-07) is a wired PreToolUse gate that BLOCKS a
Tailwind `uppercase` class or `text-transform:uppercase` in any UI/style file. `COPY_LAW.md` §4.4
states the same rule for copy. A small label stays small, tracked and muted (`s-ink-3`) — it just
is not uppercased. Recorded here 2026-08-03 by the weekly law pass, because this table was still
handing new work a recipe a live gate refuses.

*Superseded text, kept so the reversal is legible:* ~~Only TWO roles allow `uppercase`: (1) Eyebrow,
max 1 per surface, drift rule A7 counts eyebrows per file, >1 = log violation; (2) Tag/Status,
semantic states (success / error / warning / urgency / open / closed / new / discount), small
footprint, always paired with a colored bg or icon. ALL other uppercase usage = drift violation.
Sweep target: 733 → ~50-80 legit Tag/Status + ~30-50 Eyebrow.~~ What survives from it: **the
one-eyebrow-per-surface ceiling and the A7 per-file eyebrow count still bind** (a deletion names
what it keeps, FLOORS LAW 5) — only the uppercasing died. The sweep target is now 0 uppercase, and
**65 files under `app/` + `components/` still carry `uppercase` as of 2026-08-03**: live code debt,
not law debt, listed in the 2026-08-03 law-pass report.

### Eyebrow decoration policy (V3-D331, 2026-05-28) — rule A12

**Rule:** Eyebrows are **plain text only**. No leading coloured dot. No leading icon. No `before:` pseudo-element decoration. The eyebrow text IS the entire element.

**Rationale (measured 2026-05-28 against matched-surface peers):** Neither Fresha nor Uber decorate eyebrows with leading dots/icons on their B2B pages. Fresha business + Uber business both go **straight from section break to H2** — zero eyebrow, zero dot, zero icon. The "5px coloured dot → uppercase eyebrow → H2" stack is a 2018-2022 SaaS template trope (Webflow / Notion / early-Linear) that reads "AI-generated landing page." User flagged this 2026-05-28: "u love to use alot of dots for attention like start of category etc that looks ai and not real."

**Preferred:** drop the eyebrow entirely. Section break (white-space + bg-color change) IS the divider. The H2 itself is the entry point. Use eyebrows ONLY when a surface needs a magazine-style identity label ("OPINION" / "GUIDE" / "FÜR SALONS") AND the section break alone wouldn't communicate the transition.

**FORBIDDEN patterns (drift rule A12 flags):**

| Pattern | Sweep to |
|---|---|
| `<span ...rounded-full bg-s-*></span> Eyebrow text` (inline span dot prefix) | Drop the dot span; if eyebrow stays, just the text |
| `before:rounded-full before:bg-s-*` (pseudo-element dot) on eyebrow span | Drop the `before:*` classes |
| `<Icon /> Eyebrow text` (leading lucide icon as decoration) | Drop the icon; if it has semantic role, justify with V3-D{n} comment |
| Eyebrow + H2 stack on a section that has no section-identity content above | Drop the eyebrow entirely |
| **ANY separator glyph between meta values** — a middle-dot `·` (`Basel · 4.9★`) OR a pipe `\|` (`Basel \| 4.9★`). V3-D462→V3-D463 (2026-06-09): owner rejected dots many times, then the pipe ("how does Apple do it" — Apple uses *space + hierarchy*, no glyph; the pipe reads as a Material/web form-field). The old "KEEP separator dots" entry here was the root cause. | **No glyph.** Use `<MetaDot />` (renders a ~14px GAP, single source) between elements, or an **em-space `U+2003`** inside a string. Apple-style: space + lighter-grey secondary value, fewer values. NEVER a `·` or a `\|`. Drift rule **A20** flags literal `·`. |

**KEEP (semantic, not decoration):**
- Status indicator dots: `<StatusPill open=true>` (semantic = open/closed signal)
- Animated typing-indicator dots in chat mockups
- Notification count badges (circle around a number)
- Icon container circles (bg circle around an actual icon)

### Card / list-item text hierarchy (V3-D346, 2026-05-28) — rule A13

> **AMENDED BY NAME by V3-D442, adopted as THE card-emphasis law in §17.4 below (owner-approved FLOORS
> LAW, 2026-07-21). A card carries TWO ink anchors, name (larger, 600) + price (600, tabular) , size,
> not colour, marks which one is the anchor.** CLAUDE.md taste rule 5 has carried "(V3-D442, amends
> A13)" since that decision; this file never said so, and the two rules sat ~1150 lines apart giving
> flatly opposite instructions. Read the paragraph below as the ONE-anchor original: still correct that
> filler (category, city, distance, duration, review count, address, open/closed) recedes to `s-ink-2`,
> now wrong that the PRICE must. The drift-rule A13 flag inherits this amendment.

**Rule:** Inside any repeating card or list item (salon card, stylist card, service row, review item, package card, venue-nearby card, search result), there is **exactly ONE ink anchor**: the entity NAME = `text-s-ink font-medium` (500). It is the only `text-s-ink` element in the item body. **Every other value recedes: all meta = `text-s-ink-2 font-normal`** (grey, 400). Meta = rating value + star, distance, next-slot time, price, duration, review count, address, open/closed text, category label, "ab CHF" amounts.

**Rationale (user, 2026-05-28): "using too bold ... multiple times that destroys my eye."** The failure mode is over-emphasis: a card with the name bold-ink AND the time bold-ink AND the rating bold-ink AND the distance bold-ink has four competing anchors, so the eye has nowhere to rest and the card reads "busy / cheap / AI-generated." Uber's cards (measured `public/_pixel-refs/uber/`) carry exactly ONE darker anchor (the name) and let rating / eta / price sit in calm grey. **Restraint, not loudness.** AESTHETIC axis (Uber contrast model per §10) — it supersedes any per-component instinct to bold a value "so it stands out." Bolding everything bolds nothing.

**FORBIDDEN inside a card / list-item body (drift rule A13 flags):**

| Pattern | Sweep to |
|---|---|
| A 2nd `text-s-ink` + (`font-semibold`\|`font-bold`) element beside the name | `text-s-ink-2 font-normal` |
| `font-semibold text-s-ink` on next-slot time / distance / rating / duration | `text-s-ink-2 font-normal` |
| `font-medium text-s-ink` on a meta value (rating, count, eta, price) | `text-s-ink-2 font-normal` |

**KEEP (not flagged):**
- The single name anchor at `text-s-ink font-medium`.
- Semantic Layer-3 color on status (`StatusPill` open=green, discount badge, urgency `s-urgency`) — color IS the message, not weight noise.
- A commerce card's PRIMARY price (gift-card amount, package total) MAY stay `text-s-ink` for color anchoring but drops to `font-normal` — never bold.
- The CTA button label inside the card (Primary/Secondary CTA recipe) — that's a button, not body meta.

**Self-check before shipping any card:** count the elements in one item body that are BOTH `text-s-ink` AND (`font-semibold`\|`font-bold`\|`font-medium`). Excluding the name anchor and any CTA button, that count must be **0**. If >0, pull the extras to `text-s-ink-2 font-normal`.

### Migration mapping (phase 2 sweep table)

| Current Tailwind pattern (regex-matchable) | Role | New recipe |
|---|---|---|
| `bg-s-ink text-white text-xs uppercase tracking-[.0Xem]` | Primary CTA | `bg-s-ink text-white text-[15px] font-medium tracking-[-0.005em]` |
| `border border-s-border text-xs uppercase tracking-[.0Xem]` | Secondary CTA | `border border-s-border text-s-ink text-[15px] font-medium tracking-[-0.005em]` |
| `text-[10-12px] uppercase tracking-[.1Xem] text-s-accent` | Eyebrow (drop) | **Drop entirely** per V3-D331 — sections go straight to H2. Keep only if magazine-style identity label needed |
| `<span ...rounded-full bg-s-*>` immediately before eyebrow text | Decoration dot (forbidden A12) | **Drop the dot span** — eyebrow is plain text only |
| `text-[9-12px] uppercase tracking-[.16-.22em]` | Tag/Status | `text-[10-12px] font-semibold uppercase tracking-[0.08em] text-<semantic>` |
| `text-s-accent` on a real link | Body link | KEEP `text-s-accent` (links are blue, v2 rule 1) + `hover:underline`. Sweep to ink ONLY if it is non-interactive emphasis, not a link. |

### Escape hatch

One-off campaign-style decorative type → use `style={{}}` inline + `// V3-D{n}: justification` comment + put **`drift-ok: <reason>` on the same line**. (Pointer corrected 2026-08-03: `_design-system/_drift-acks.json` does not exist and no tool has ever read it , the real acknowledgement mechanism is the inline `drift-ok` marker, honoured by `.claude/skills/solen-drift-check/scripts/check.py:775`, `.claude/hooks/pre-edit-drift-gate.sh` and `.claude/hooks/card-radius-gate.py`. For a hex specifically, the second mechanism is the `ALLOWED_HEX` set in that same `check.py`.)

---

## §3 — Spacing + Radius + Shadow

### Border radius

| Token | Value | Usage |
|---|---|---|
| `card` | 16px | Salon cards, listing cards, content blocks |
| `card-lg` | 20px | Hero cards, feature cards, modals |
| `panel` | 16px | Inner panels within a card, review cards |
| `search` | 99px | Search bar outer container (fully rounded) |
| `pill` | 9999px | Availability pills, tags |
| `btn` | 99px | CTA buttons, action buttons |
| `input` | 12px | Form inputs (stable, NOT pill). Owner kept shipped 12 over 16, 2026-06-08 — LOCKFILE had drifted ahead of code. |
| `sheet` | 28px | Bottom sheets |
| `rounded-full` | 9999px | Avatars, icon buttons |
| `rounded-2xl` | 16px | Sidebar card, info cards |
| `rounded-3xl` | 24px | Bento cards, larger surfaces |
| grouped list-card | 24px (`rounded-[24px]`) | The **grouped LIST-card grammar for CATEGORY MEMBERS**: `overflow-hidden rounded-[24px] border border-s-border bg-white shadow-whisper`, rows hairline-divided (`border-t first:border-t-0`). Salon services / Produkte / Pakete / staff / dashboard (owner-confirmed 2026-07-19, "pick whichever the services use"). ONE radius, gate-enforced (`.claude/hooks/card-radius-gate.py`, whisper-only). For a list of DISTINCT ENTITIES (a stylist, a salon) use the individual entity-card below, NOT this. Do NOT confuse with `rounded-card` (16) = FORM/summary card (`shadow-elevation-1`). |
| individual entity-card | 16px (`rounded-card`) | ONE card per DISTINCT ENTITY (a person/stylist, a salon): `rounded-card border border-s-border bg-white`, FLAT, gap-separated (`SalonResultCard` grammar). Selected = `bg-s-bg-sunken`. Use for the stylist picker, salon result lists , anything where each item is its own entity, NOT a category member. GROUP card = category members in one card; INDIVIDUAL card = one card per entity. Owner 2026-07-19: "stylists are individual not groups." Enforced by `.claude/hooks/entity-card-gate.py`. |

### Nested radius formula (DS-4, video-audit 2026-06-11, owner-approved)

When a rounded element sits INSIDE a rounded container: **inner radius = outer radius − gap.**
(18px card with 14px padding → inner thumb/chip ≈ 4px; if the math goes ≤0 use 4px minimum or square.)
Pills (`9999px`) are exempt — their distance is constant around the curve. Same-radius-inside-same-radius
makes the corner gap visibly bulge; this is the #1 "small detail" amateur tell.

**Twin-control rule (DS-4):** two controls with the same purpose (back/skip, the two Ändern links, paired
filters) are the SAME component instance — identical size, radius, weight, color. Styling twins
differently is drift.

**Button padding ratio (DS-2 detail):** standalone buttons aim for horizontal padding ≈ 2× vertical
(e.g. 12px/24px). Full-width CTAs are exempt (height-driven, 52-54px).

### Spacing rhythm (DS-5, video-audit 2026-06-11, owner-approved)

Three numbers, sitewide. Everything vertical maps to one of them:

| Tier | Value | Between |
|---|---|---|
| **Section** | `32px` (`mt-8` / `space-y-8`) | page sections (heading-to-heading blocks) |
| **Card** | `12px` (`gap-3` / `mt-3`) | sibling cards / list items in a section |
| **Group** | `16px` (`mt-4`) | groups INSIDE a card (e.g. pill groups in HairStep) |

Mobile gets MORE air, never less. Larger one-off dimensions round to clean 5/10s (8pt pedantry above
~100px buys nothing). Drift signal: any `mt-5/mt-6/mt-7/space-y-5/...` between sections or cards.

**HOME-FEED EXCEPTION (measured 2026-06-11):** the homepage feed keeps the OWNER-TUNED Airbnb-tight
rhythm from V3-D132 (2026-05-25, owner: "gap too big vs Airbnb") — ~24px visible section gap
(Section `mb-2` + `py-2` + SectionFrame `pt-1 pb-2`), 12px heading top, 4px heading-to-ScrollRow.
The 32px Section tier applies to CONTENT pages (profile, PDP sections, legal, wizard steps), not the
dense home feed. Measured pass 2026-06-11 confirmed home is internally consistent at the tuned
values; apparent outliers (Walk-in band, Für dich bento) were icon-row / hero-overlap measurement
artifacts, not drift. Do NOT re-inflate home gaps to 32px.

### 🔒 Grouped list cards (owner-approved 2026-06-11, Atelier service-grouping mockup)

**Rule:** any LIST of same-kind rows (services, per-staff Leistungen, selectable booking
services) renders as **ONE grouped card per group** — `rounded-[24px] border border-s-border
bg-white shadow-whisper overflow-hidden` — with ROWS inside (`px-5 py-[18px]`, `border-t
border-s-border first:border-t-0`). NEVER separate bordered/shadowed cards per row.
- `shadow-whisper` = `0 1px 3px rgba(10,10,10,.04), 0 10px 28px -14px rgba(10,10,10,.10)`
  (tailwind token). It is the ONLY sanctioned at-rest shadow for these cards; elevation-2/3
  on a list card is the banned grey-haze (CONTROL_ELEVATION B). Hover = `bg-s-bg-sunken/40`
  wash or `border-s-ink/30`, never a shadow bump.
- Selection inside a grouped row = ToggleCircle/check disc + `bg-s-bg-sunken/60` wash; no
  border-2 jumps (rows share the card's chrome).
- Group header sits ABOVE the card: name + range baseline row (16px/600 + 13px ink-3 tabular).
- Applied 2026-06-11: SalonServices, SalonServicesSheet, booking ServicesStaffStep,
  StaffProfilePage Leistungen. Reference: `public/_mockups/restraint/service-grouping.html`.

### Box shadow (3-level system + legacy aliases)

| Token | Value |
|---|---|
| `elevation-1` (= `warm-sm` = `card`) | `0 1px 3px rgba(50,47,44,0.04), 0 1px 2px rgba(50,47,44,0.03)` |
| `elevation-2` (= `warm-md` = `card-hover` = `surface`) | `0 4px 12px rgba(50,47,44,0.08), 0 2px 4px rgba(50,47,44,0.04)` |
| `elevation-3` (= `warm-xl` = `surface-hover` = `warm-float`) | `0 8px 28px rgba(50,47,44,0.12), 0 4px 10px rgba(50,47,44,0.06)` |
| `pressed` | `0 1px 1px rgba(50,47,44,.12), inset 0 1px 2px rgba(50,47,44,.06)` |

**Warm tint is intentional (folded from CANON §7, decided 2026-06-01):** shadow tokens stay warm-tinted `rgba(50,47,44, …)` even though surfaces/hairlines went COOL (v2 rule 4) , a deliberate beauty-domain softening. `FROST_GLASS` keeps its pure-black over-photo shadow (imperceptible over images, no conflict). Don't "fix" shadows to cool grey.

**Fresha pattern lock (V3-D230):** the salon sidebar card has **NO box-shadow** — `boxShadow: none`. Only `border + radius`. Use shadow sparingly on Layer 1 surfaces; many cards in Fresha are flat.

**Control elevation lock (V3-D420):** white + shadow on a CONTROL is allowed in exactly TWO places: (1) a control sitting OVER a photo (the `FROST_GLASS` recipe at `lib/frost-glass.ts`), and (2) the ONE ink primary CTA per region (`bg-s-ink` + at most `shadow-elevation-2`). On a flat white / `s-bg-sunken` surface a control casts NO shadow: text controls → `bg-s-bg-sunken` no shadow; icon-only controls → `bg-white border-s-border` no shadow (borderless grey on white is ~1.03:1, a contrast trap that also reads "inert"). Never stack fill + shadow + border at rest. The elevation-1-at-rest rule above is for SURFACES (cards), not controls. Full rule + decision tree: `_design-system/CONTROL_ELEVATION.md`.

### Z-index scale

```
sheet-bg: 400 / sheet: 410 / modal-bg: 500 / modal: 510 / toast: 600 / tooltip: 700
header / tab-nav: z-50 / sticky-rail: z-30
```

---

## §3.5 — Depth System (surfaces + state matrix) — 2026-06-09

The app read "flat / 2018" because surface depth was suppressed (§3 "use shadow sparingly, many cards flat"). This section flips the default to **consistent soft depth on surfaces** (Apple-style), composing the EXISTING §3 shadow tokens + §4 easings — no new tokens. It does NOT change CONTROL_ELEVATION: controls stay calm; depth is for SURFACES. Visual spec (mockups): `public/solen-depth-system.html` + `public/solen-states-motion.html`.

> **CALIBRATED 2026-06-09 (Tim Gabe "4 levels" + "addictive apps" videos; owner: "overmade the depths").** The pendulum overshot from flat into heavy. The fix is restraint, not more shadow:
> - Depth here is **subtle**, not the wide float that shipped first. Heavy/wide shadows on resting content = "visual overworking" (the named mid-level mistake). The `shadow-float` token was **softened** to a quiet lift (`0 1px 2px` + `0 4px 12px -6px`, ~0.05 to 0.10 alpha); it cascades to the homepage tiles + salon section cards.
> - Resting cards take a **quiet lift OR a hairline** (both fine; Fresha leans on hairlines + whitespace, per §3). **Only overlays** (sheets, lightbox, gallery, dropdowns) earn strong elevation (elevation-2 / elevation-3). Never stack a heavy shadow on a resting surface.
> - **Premium feel is bought with MOTION, not shadow weight** , the §4 easings used purposefully on every interaction, celebratory moments on key wins (booking confirmed), and haptics on mobile. "Polish builds trust." That is the real lever; static depth stays quiet.

### Surface rule — gray tray vs white (the "where" of depth)

`s-bg-sunken` (#F4F4F5, COOL light grey — v2 rule 4, reverses the V3-D460 warm #F8F5F2) is a **grouping tray, not a global wash.** Put gray UNDER: grouped lists / settings / forms, dashboard panels, and any section that clusters a group of cards. The gray tray is what "earns" the white card's lift (consistent with "elevation earned by the background").

Keep **white** for: the feed (Discover), content + profile pages, heroes, and modals / sheets.

Alternate gray ↔ white down a page for rhythm. **Never** the whole app gray; never the whole app pure-white-on-white-with-borders (that is the flat tell).

### Default surface depth (shifts §3 "use sparingly")

- Product cards / surfaces: **`elevation-1` at rest** by default (was "sparingly"). Radius `card` (16px), `card-lg` (20px) for hero/feature.
- Separate with **shadow + gray tray, NOT hairline borders.** Drop `border-s-border` on any card that now carries elevation (1px-border + flat = the dated tell). Hairlines stay only as dividers INSIDE a grouped list.
- Controls unchanged: calm/flat per CONTROL_ELEVATION. Depth is for surfaces, not "shadows on everything."

### State matrix (ENFORCED — every interactive primitive)

> **TWO COLUMNS OF THIS TABLE ARE SUPERSEDED. Read this before copying a cell (noted 2026-08-03,
> weekly law pass; no value elsewhere in the table changed).**
>
> - **`focus` column — DEAD, all rows.** Every cell says `ring-2 s-accent`. The owner killed focus
>   rings three times (2026-07-01, 2026-07-02, and finally 2026-07-17, verbatim on the input-fill
>   decision: *"for input decision both a and b2 was the problem i hated that sh"*), and
>   `~/.claude/hooks/no-focus-ring-gate.py` is wired PreToolUse and BLOCKS any `ring-*` utility in a
>   UI file. **Current law, which supersedes this column:** inputs get ONE ink edge,
>   `border-s-ink` (#0A0A0A) + white fill, no halo, set globally in `globals.css`
>   (`input:focus-visible`, unlayered on purpose) and primitives add no extra `outline`; buttons and
>   links get the global 2px **ink** `outline`. Same wording as the CLAUDE.md `focus` contract row.
> - **`selected` column — dead for Card and List row.** `ring-2 s-ink` (Card) and
>   `bg-s-accent-bg` + accent text (List row) both predate the owner's 2026-06-29 selected/active
>   law, which this same file already states at §13.1 item 3: every selected state except four named
>   exceptions is calm GRAY fill `bg-s-bg-sunken` + `text-s-ink` + semibold over white, menu/list
>   options adding a check. That §13.1 paragraph **supersedes** these two cells; the four exceptions
>   (the ONE commit button, booking date/slot blue, the avatar `SelectedCheckBadge`, the booking
>   category pill) are listed there, not here. The Photo chip scrim and the pressed/hover/rest/
>   disabled columns are unaffected.

| Element | rest | hover | pressed | selected | focus | disabled |
|---|---|---|---|---|---|---|
| **Card** | white + `elevation-1` | `translateY(-2px)` + `elevation-2` | `scale(.985)` + `elevation-1` | `ring-2` s-ink + `elevation-2` | `ring-2` s-accent, offset-2 | `opacity .45`, no shadow |
| **Primary button** | `bg-s-ink` + `elevation-2` + inset top-highlight | `elevation-3` + `translateY(-1px)` | `scale(.97)` + `pressed` shadow | n/a | `ring-2` s-accent, offset-2 | muted-grey fill, no shadow |
| **Photo chip** | vibrant + `elevation-1` | `elevation-2` | `scale(.96)` | scrim `bg-s-ink/70` (option E) | `ring-2` s-accent | `opacity .45` |
| **List row** | transparent | `bg-s-bg-sunken` | `bg-s-bg-sunken` | `bg-s-accent-bg` + accent text + check | inset ring | `opacity .5` |
| **Input** | filled `bg-s-bg-sunken`, radius `input` (12px) | same | n/a | n/a | white bg + `ring-2` s-accent | `opacity .5` |

### Loading + outcome confirmation (DS-1, video-audit 2026-06-11, owner-approved)

The matrix above covers rest/hover/pressed/selected/focus/disabled. Two more are MANDATORY:

- **Loading:** any control that triggers async work shows it inline — button keeps its label + a 15px
  spinner (`opacity .85`, pointer-events none); pressed-grey-out the instant a navigation is triggered
  (a laggy route change with zero feedback reads as broken). Skeletons for content, spinner for actions.
- **Outcome confirmation:** completing an action confirms at BOTH ends —
  | Action | At the control | At the destination |
  |---|---|---|
  | Save/favorite | heart fills + spring-pop | Favorites entry point gets a dot/badge |
  | Add to cart / select service | row check + count pill updates | sticky CTA total updates |
  | Copy (codes/links) | icon swaps to check 1.2s | toast "Kopiert" |
  | Booking/payment success | SuccessMark spring-pop | confirmation screen (the ONE delight peak) |
  | Note/profile saved | toast | pre-filled next time (provenance chip) |
- **No gesture-only actions, ever** (DS-11): every swipe/drag affordance has a visible button twin.

### Motion per transition (uses §4 tokens — no new values)

| Transition | duration | easing |
|---|---|---|
| Hover lift (cards) | 200ms | `glide` |
| Press (button / chip / card) | 150ms | `thud` |
| Sheet / modal open | 300ms | `glide` |
| Select toggle / scrim swap | 200ms | `snap` |
| Color / focus ring | 150ms | `snap` |

Animate `transform` + `box-shadow` only (compositor-friendly). Honor §4 anti-patterns (no will-change at rest; gate backdrop-blur on scroll containers).

### Enforcement (how this survives — anti-drift)

- The matrix + surface rule live INSIDE 6 primitives (`Surface`, `Card`, `Sheet`, `ListGroup`, `Button`, chip). Components consume them; never re-derive shadow / state / transition inline.
- Drift-checker rules to add: flag raw `box-shadow`, hand-coded `transition`, off-token radius, `border-s-border` on an elevated card, white-card-on-white-without-a-tray.

---

## §4 — Motion (timing + easing)

### Durations (only these — non-canonical = drift)

```
80ms / 100ms / 150ms / 200ms / 250ms / 300ms / 500ms
<!-- 100ms registered 2026-07-12 (consolidation): code-derived, 10 live usages incl. primitives Switch.tsx:98 (active press) + Sheet.tsx:47 (reduced-motion) + booking CTAs; the drift gate had allowed it since V3-D450-era with a mislabeled citation, LOCKFILE now records it -->
```

### Easing functions

```ts
"snap":   cubic-bezier(0.4, 0, 0.2, 1)        // standard UI (focus, color)
"spring": cubic-bezier(0.34, 1.56, 0.64, 1)   // bouncy reveal (toggle, check)
"glide":  cubic-bezier(0.16, 1, 0.3, 1)       // long-distance smooth (sheet open)
"thud":   cubic-bezier(0.7, 0, 0.84, 0)       // press-down feel (button scale)
```

### Fresha-measured motion patterns

- **Book CTA hover/press:** press → `scale(.97)` with a pressed shadow (~150ms `thud`) per v2 rule 7 + the §3.5 state matrix. The Fresha width-morph (`max-inline-size 0.2s cubic-bezier(0.85,0,0.15,1)`) is an optional hover flourish, NOT a replacement for press-scale.
- **TabPill active swap:** `transition-colors duration-200 ease-glide`
- **Sheet open/close:** `300ms ease-glide`
- **Hover lift on cards:** `transform translateY(-1px) + shadow-elevation-2`, `duration-200 ease-glide`

### Anti-patterns (NEVER)

- Will-change on resting elements (forces permanent compositor layer, blurry text)
- Backdrop-filter inside scrolling containers (mobile perf killer — `md:` gate it)
- Custom duration / easing values not in the lists above

---

## §5 — Primitive prop signatures (TypeScript-exact, frozen)

### Toast / Toaster

```ts
toast.success(msg: string, opts?: { description?: string }): void
toast.error(msg: string, opts?: { description?: string }): void
toast.warning(msg: string, opts?: { description?: string }): void
toast.info(msg: string, opts?: { description?: string }): void
// V3-D462 (2026-06-13, owner-locked Chime/Google-Photos recipe): a CLEAN LIGHT
// pill (bg-white, border-s-border, shadow-elevation-3), a colored CIRCLE BADGE
// icon (26px tint-bg circle + saturated glyph), ink text, one blue text action
// (no underline/chevron), docked at the BOTTOM. Replaces the earlier pastel
// whole-pill tint (read too heavy). Auto-dismiss 4s. Max 3 visible.
// The FOCAL booking/payment-confirmation moment is NOT a toast: it uses a normal-green s-success #16A34A disc + WHITE check (SuccessMark / §1 success-FOCAL / §13.2). Deep #15803D reverted 2026-06-10.
```

### Skeleton

```ts
interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  rounded?: boolean | "sm" | "md" | "lg" | "full";
  aspect?: string;  // e.g. "16/9", "4/3"
  className?: string;
}
```

### ComingSoon

```ts
interface ComingSoonProps {
  label?: string;  // appears in toast on click
  toastTitle?: string;
  toastDescription?: string;
  children: React.ReactNode;  // any clickable surface
}
// Wraps with opacity-50 + cursor-not-allowed + aria-label suffix " — bald verfügbar"
```

### TabPill

```ts
interface TabPillProps {
  active: boolean;
  onClick: () => void;
  size?: "sm" | "md";  // sm=32px, md=40px
  variant?: "outline" | "ghost";
  children: React.ReactNode;
}
// Active = ink-fill + white text; Inactive = white + hairline border + ink text.
```

### StatusPill — DELETED (2026-06-30, REMOVED.md:46)

`salon/StatusPill.tsx` no longer exists (superseded by StatusInline, both SalonHeader + SalonSidebar
switched; only remaining reference was the /dev/new-primitives showcase). Any open/closed status use
goes through **StatusInline** below — do not rebuild StatusPill.

### StatusInline

```ts
interface StatusInlineProps {
  isOpen: boolean;
  label: string;  // "Geöffnet · Schliesst um HH:MM" or "Geschlossen · Öffnet Mittwoch um 09:00"
  size?: "sm" | "md" | "lg";  // sm=13, md=15, lg=16
}
// Split-color inline. First word "Geöffnet" green / "Geschlossen" red (s-closed, V3-D421).
// Rest of label in muted ink-2. NO pill chrome.
```

### MetaDot

```ts
function MetaDot(): JSX.Element  // No props. Renders the `·` typographic separator. text-s-ink-3, aria-hidden.
```

### SalonCard

```ts
interface SalonCardProps {
  slug: string;
  name: string;
  rating?: number;
  reviewCount?: number;
  photoUrl?: string;
  category?: SalonCategory;
  variant?: "default" | "service";  // service = compact in SearchTemplate
  discountPercent?: number | null;
  priceFromCHF?: number | null;
  address?: string;
  city?: string;
  isSaved?: boolean;
  className?: string;
}
// Photo + 3-row text below. Used across homepage feeds, search, /favorites.
```

### HeartButton

```ts
interface HeartButtonProps {
  isSaved?: boolean;
  salonId?: string;
  salonName: string;
  tone?: "light" | "dark";
  className?: string;
}
// Pink #FF3366 fill when saved, ink stroke unsaved. 44px hit area, 32px visible circle.
```

### SearchTemplate

```ts
interface SearchTemplateProps {
  locale: string;
  serviceFilter?: SalonCategory | null;
  cityFilter?: CitySlug | null;
  breadcrumb?: { label: string; href?: string }[];
  hero?: { title: string; subtitle?: string } | null;
  aboveSlot?: React.ReactNode;
  belowSlot?: React.ReactNode;
}
// Universal-components compliant. Used by /search + 4 category routes.
```

### BentoCard / Step / FAQItem / MarketplaceVisual

See `_design-system/components/{BentoCard,Step,FAQItem,MarketplaceVisual}.md`.

---

## §6 — Copy patterns (verbatim strings)

Subagents may NOT paraphrase. If a captured Fresha spec needs a phrase variation, surface in return message.

### Status

- Open: `"Geöffnet"` (alone) or `"Geöffnet · Schliesst um HH:MM"` (with detail)
- Closed: `"Geschlossen"` (alone) or `"Geschlossen · Öffnet HH:MM"` (today) or `"Geschlossen · Öffnet {Weekday} um HH:MM"` (later in week)

### CTAs

**The book label follows the JOB, not the surface (owner 2026-07-25, "we have so many variations of it,
like book... we need consistencies and we don't have that"). This SUPERSEDES BY NAME the two rows below
that pinned `"Jetzt buchen"` to the PDP/sidebar and told new work to prefer it. `"Jetzt buchen"` is
RETIRED and graveyarded (REMOVED.md line "jetzt buchen cta label variant"): it was `"Termin buchen"` with
an adverb that added nothing. Applied in 62f14b274; only the salon-owner dashboard rebook-nudge copy (a
different actor) and one transactional email sentence still carry the old phrase, both named exceptions.**

- Page-level book commit (PDP, sidebar, sticky mobile bar, a modal's single ink action): `"Termin buchen"`
- Row inside a services / bundles list: `"Buchen"` (the list heading already supplies the noun)
- Picker row (choose one of several): `"Auswählen"`
- Walk-in queue: `"Anstehen"` (joining a queue is genuinely a different action, not a booking)
- ~~Primary book on PDP / sidebar: `"Jetzt buchen"` (used 2026-05-27+)~~ , RETIRED 2026-07-25, see above
- ~~Primary book on legacy / sticky mobile: `"Termin buchen"` (kept for back-compat surfaces, prefer "Jetzt buchen" on new work)~~ , the label is now the rule, not a back-compat fallback
- Homepage hero CTA: `"Termine finden"`
- Service-row CTA: `"Buchen"`
- Buy buttons (gift card / vouchers): `"Kaufen"`
- Reset filters: `"Filter zurücksetzen"`
- Empty state CTA: `"Zur Startseite"`
- Show-all: `"Alle ansehen"` (preferred) or `"Mehr anzeigen"` (in-place expand)
- See/show more: `"Mehr"` (compact)
- Get directions: `"Wegbeschreibung"` (preferred) — `"Route"` (compact in sidebar)
- Read more (long text): `"Mehr lesen"`
- Back: `"Zurück"`

### Copy economy (V3-D460, 2026-06-09, council + owner) — SENIOR_SCORECARD dim 1

- **Button labels: shortest grammatical form.** Drop articles, prepositions, infinitive scaffolding. ≤3 words.
  - `"Zum Kalender hinzufügen"` → **`"Kalender hinzufügen"`**. `"Termin teilen"` → `"Teilen"` when context is clear.
- **Icon-only** when the icon is universal AND the action repeats or space is tight: copy, share, calendar, map-pin, heart/save, edit, trash, close, back. (Keep an `aria-label` + `title` for a11y.) Example: the "Kopieren" button beside an access link → copy icon only.
- **Icon + label** only when the icon is non-obvious or the label adds unique meaning (≤3 words).
- **Label-only** when the action is unique on the screen and clarity matters more than space.
- **Never repeat a word already in an adjacent heading/label** (SOLEN_UI §2a). If the card says "Gesamt (inkl. MWST)", the pill says `"Bezahlt"`, not `"Bezahlt inkl. MWST"`.

### Service-row format (V3-D227 lock)

```
Line 1: {name_de}           (15-16 / 600 / ink)
Line 2: {duration}          (13-14 / 400 / muted ink-2)
Line 3: ab {price} CHF      (14-15 / 700 / ink)        ← "ab N CHF" not "CHF N"
```

Duration format (German): `"{n} Min."` if <60, `"{h} Std."` if exact hours, `"{h} Std., {rem} Min."` if mixed.

### Empty / loading / error

- Empty salon list: `"Keine Salons gefunden."` + sub `"Versuche eine andere Stadt, einen anderen Service oder lass die Filter weg."`
- Empty reviews: `"Noch keine Bewertungen."` (zero count) or `"Bewertungstexte folgen."` (rating but no text)
- Loading: skeleton shimmer pattern (no spinner)
- Error: `"Etwas ist schiefgelaufen."` + retry button

### Salon-card secondary line patterns

- Urgency badge: `"Nur noch {N} heute"` (with lucide `Flame` icon)
- Featured: `"EMPFOHLEN"` — ONLY in listings, NOT on PDP hero
- Price line on card: `"ab CHF {N}"` (note: card uses "CHF N" prefix, service-row uses "ab N CHF" suffix — different surfaces, different patterns)

### Tab nav (PDP sticky)

Always German: `Fotos · Über uns · Services · Bewertungen · Portfolio · Treueprogramm`

(Note: SalonStickyTabNav German labels live in `_shared.ts` `TAB_SECTIONS` constant.)

### Brand voice (always)

- ~~`"du"` not `"Sie"` (informal Swiss)~~ , **DEAD, superseded by name** by the owner decision of
  2026-07-29 (*"make it the Sie instead of the du"*), which took the whole product formal: `Sie` (de),
  `Lei` (it), `vous` (fr). Register is owned by `COPY_LAW.md` §1 and stated nowhere else, so there is
  one place to change it. 491 German strings, plus the Italian and French sweeps, already shipped
  formal (commits `69fc74d65`, `a0423867d`). Struck rather than deleted so the reversal stays legible.
- No exclamation marks (confidence over enthusiasm)
- No emoji (V3-D203 hard rule)
- No over-cap (don't shout)
- "Termin in 30 Sek." pattern signals speed; "Nur noch X heute" pattern signals urgency

---

## §7 — Layout invariants

### Container widths

| Surface | Max width | Mobile padding | Desktop padding |
|---|---|---|---|
| Page outer | `max-w-[1280px]` | `px-4` | `px-6` to `px-8` |
| Hero content | `max-w-[1280px]` | `px-7` | `md:px-8` |
| Salon PDP grid | `max-w-[1180px]` | `px-4` | `md:px-6` |
| /business hero | `max-w-[1400px]` | `px-4` | `md:px-8` |
| Search bar (collapsed, desktop) | `md:max-w-[820px]` | — | — |
| SearchBar (mobile) | `max-w-[540px]` | — | — |
| FAQ section | `max-w-[820px]` | `px-4` | `md:px-8` |

### Sticky header offset

- Site header: `sticky top-0`, h=79px, z-50
- CityTopBar (above header when mounted): `sticky top-0`, h=52px
- Salon sticky tab nav: `fixed top-0`, h=~52px, z-[60] (above site header per V3-D206)
- Sidebar sticky-pinned: `sticky top-24` (24 = 6rem = 96px clearance for site header + breathing room)
- Scroll-margin for anchor jumps: `scroll-mt-24`

### Breakpoints

```
sm: 640px / md: 768px / lg: 1024px / xl: 1280px / 2xl: 1536px
```

Mobile = below md (768). Desktop = md and up. Most components mobile-first.

### Grid TYPE classification (owner-approved 2026-07-16, "all approves", IG round 1 ig10)

Before laying out ANY new section, name its grid type in one line, in the design note or the plan box, BEFORE the first markup. A grid is structure, not decoration: it must match the shape of the content, and the recorded failure this closes is a modular equal-weight card grid applied to content that was actually hierarchical (the 2026-07-15 dashboard-home clutter complaint, TASTE_LOG Round D1).

| type | content shape it fits | Solen example |
|---|---|---|
| manuscript | one continuous block of reading | legal/static pages, the salon description (capped at the 68ch measure) |
| column | repeated peers scanned in one axis | search results, service rows, review lists |
| modular | many EQUAL-weight units, no anchor | category tiles, the photo gallery grid |
| hierarchical | one dominant thing plus minor facts | the operator dashboard home, a PDP hero, any KPI-plus-detail panel |

Rule: if you cannot name the type, you do not know the content shape yet, go look at the real data first. If the type is hierarchical, an equal-weight modular grid is a violation regardless of how tidy it looks. The type is a STRUCTURE decision (§10 dual-axis), so a Fresha capture can settle it; the aesthetic of the resulting cells still comes from this file.

### Grid patterns

- Salon-card horizontal carousel: `grid-flow-col` with `gap-3` (12px) mobile, `gap-5` (20px) desktop
- Search result grid: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4` (2-col when map open)
- Team carousel: cards `w-[112px] md:w-[120px]`, gap-6
- Photo gallery (3+ photos): 1 big left + 2 stacked right (1+2 layout)
- Photo gallery (2 photos): 1+1 horizontal split
- Bento (4-card feature grid): `grid-cols-1 md:grid-cols-2 lg:grid-cols-2`

---

## §8 — Reference sources (in priority order)

When capturing a section, use these sources in this order:

1. **`fresha-section-capture` skill** (primary) — Playwright live capture of fresha.com
2. **User's curated screenshots** at `/Users/sulo/solen/screenshots/IMG_47*.png` — ground-truth Fresha refs the user manually selected; cross-check against fresh capture
3. **`pixel-ref-collect`** — when starting fresh on a brand-shaped surface, multi-source brand capture (Playwright + Mobbin + measurements in one shot)
4. **Mobbin MCP** (`mcp__mobbin__search_screens`) — fallback when Fresha capture is paywalled / auth-gated / structurally broken
5. **`pixel-spec-auto`** — extra pixel measurements from any saved screenshot when computed-style data is incomplete
6. **`site-teardown`** — full-URL teardown for global chrome or unfamiliar route shapes
7. **`gemini-visual-check`** — multimodal second-eye on contested verifier verdicts

For Solen-original surfaces (Entdecken / loyalty / referral) where no Fresha equivalent exists: **first-principles design with these locked primitives + tokens.** Don't force a Fresha-shaped wrapper on Solen content (uncanny valley).

**CANON.md folded into this file (owner-approved 2026-07-10, design-governance audit finding 11).** CANON's live content is fully represented here: tokens = §1 (this file is FRESHER , s-accent.deep #1E54B7, s-open, s-urgency #C2410C, s-warning.text #B45309 all post-date CANON); restraint/blue = §1.5 v3 (supersedes CANON §0's 2026-06-10 lock AND CANON §2's dead "generous" model); typography = §2 + §13.4; closed-red = §1; control elevation = §3 + CONTROL_ELEVATION.md; staff selected badge = §13.3 + components/SelectedCheckBadge.md; warm shadows = §3. CANON's old self-claimed precedence ("CANON > LOCKFILE") is retired: precedence is code reality + THIS FILE > SOURCE-as-prose, per the CLAUDE.md chain. CANON.md remains only as a tombstone pointer. Still-open CANON housekeeping carried to the design-governance audit PARKED list: R4 (archive the pre-B&W Hanken-era mockups out of the served `public/` root).

---

## §9 — Provenance ranges in use

| Range | Owner |
|---|---|
| V3-D1 to V3-D234 | Already used (latest: D234 salon-team austerity) |
| V3-D235 | THIS FILE |
| V3-D236-D239 | Reserved for golden-route fixes |
| V3-D240-D250 | Reserved for Phase 2 W2 (browse) |
| V3-D251-D261 | Reserved for W3 (sub-PDPs) |
| V3-D262-D269 | Reserved for W4 (landings) |
| V3-D270-D275 | Reserved for W5 (marketing) |
| V3-D276-D280 | Reserved for W6 (commerce side) |
| V3-D281-D295 | Reserved for W7 (profile + account) |
| V3-D296-D310 | Reserved for W8 (help + legal) |
| V3-D311-D315 | Reserved for W9 (global chrome polish) |
| V3-D316+ | Reserved for aesthetic-coherence pass + carve-outs |

Subagents take their block from this table to avoid collisions.

---

## §10 — Conflict-resolution rule + DUAL-AXIS SOURCE-OF-TRUTH (V3-D338, 2026-05-28)

### §10.0 — The dual-axis rule (THE MOST IMPORTANT RULE — read first)

User flag 2026-05-28: "structure n evrth like fresha but colorways typography contrast like ubers."

Every design decision sits on ONE of two axes. Each axis has its own source-of-truth. Conflating them = the failure mode that's bitten this project ≥4 times.

| Axis | Source of truth | Examples |
|---|---|---|
| **STRUCTURE** (IA, layout, components, sections, hero pattern, sticky nav, grid layouts, what-section-goes-where, what-affordances-exist, copy density, primitive composition) | **Fresha** (via `fresha-section-capture` skill → `public/_pixel-refs/fresha/<section>/SPEC.md`) | "PDP hero = 3-photo grid not full-bleed-with-floating-card", "Services has category sub-sections", "Sticky tab nav after hero", "Team carousel below services not above", "Pricing-per-hour shows ab CHF X format" |
| **AESTHETIC** (colors, type role recipes, contrast pairings, accent application, eyebrow policy, imagery rules, spacing rhythm, motion timing, hover affordances) | **Uber** (via LOCKFILE §1.5 / §2.5 / §11 / §6, all measured from Uber web + iOS via `public/_pixel-refs/uber/`) | "Accent only on focus-visible + Spinner", "No eyebrow decoration dots", "Sentence case CTAs not uppercase", "Border-radius 0 on images", "Lighthouse a11y ≥95 per wave" |

**Both axes apply to every change. Never apply one without verifying the other.**

#### Wrong (what bit us in T4):
- Saw "Pattern 3 hero" in §11 imagery registry
- Built mockup with full-bleed photo + floating booking card (= Uber Eats hero pattern)
- That's an AESTHETIC pattern from Uber. Applied as if it were a STRUCTURE pattern.
- Fresha's PDP hero is a 3-photo grid. Structure was already correct. Should have done aesthetic-polish only (rounded-none per §11), not restructure.

#### Right:
1. **Identify the axis:** is this a structure question (where does X go, what does X contain) or an aesthetic question (what color is X, what tracking, what radius)?
2. **Hit the right source:** Fresha for structure, Uber/LOCKFILE for aesthetic.
3. **Verify both before shipping:** structure-match against Fresha SPEC + aesthetic-match against LOCKFILE registries.

#### Concrete decision tree (apply before any non-trivial edit):

```
Is this change about WHAT or WHERE?     → STRUCTURE → fire fresha-section-capture
Is this change about HOW IT LOOKS?      → AESTHETIC → check LOCKFILE §1-§11
Both?                                    → both. Structure first, then aesthetic.
```

#### Concrete examples of each axis:

| Change | Axis | Source |
|---|---|---|
| "Add a Highlights section between hero and Services" | STRUCTURE | Fresha (does Fresha PDP have Highlights? where? what content?) |
| "Drop the eyebrow dot decoration" | AESTHETIC | Uber/LOCKFILE §2.5 V3-D331 |
| "Hero photo aspect ratio 3:2" | AESTHETIC | Uber/LOCKFILE §11 canonical aspects |
| "Hero should be 3-photo grid not single photo" | STRUCTURE | Fresha PDP hero pattern |
| "Primary CTA = sentence case 15px" | AESTHETIC | Uber/LOCKFILE §2.5 type roles |
| "Booking card lives in sidebar not overlay" | STRUCTURE | Fresha PDP layout |
| "Sticky tab nav after hero" | STRUCTURE | Fresha PDP IA |
| "Tab labels = sentence case not uppercase" | AESTHETIC | Uber/LOCKFILE §2.5 Tab label role |

### §10.5 — Conflict resolution (refined per dual-axis rule)

When a captured Fresha SPEC.md contradicts LOCKFILE:

1. **Identify which axis the conflict is on.**
   - Fresha says "use RoobertPRO" → AESTHETIC axis → LOCKFILE wins (Geist Sans per §2)
   - Fresha says "PDP hero is 3-photo grid" → STRUCTURE axis → Fresha wins (LOCKFILE doesn't override structure)
2. **Apply the correct source per axis.** Don't make LOCKFILE win on structure or Fresha win on aesthetic.
3. **Surface conflicts in return message:** `"CONFLICT [axis]: Fresha says X, LOCKFILE says Y. Applied [Fresha if STRUCTURE | LOCKFILE if AESTHETIC]."`
4. **Orchestrator decides** only when the axis is genuinely ambiguous (e.g. "what color is the floating card" — color = aesthetic, but card-existence = structure).

Examples (refined):

| Conflict | Old rule (wrong) | New rule (V3-D338) |
|---|---|---|
| Fresha uses `RoobertPRO` | LOCKFILE wins (Geist) | LOCKFILE wins — AESTHETIC axis |
| Fresha uses purple `#6950F3` accent | LOCKFILE wins (royal blue) | LOCKFILE wins — AESTHETIC axis |
| Fresha PDP has 3-photo grid hero | "LOCKFILE wins" (but LOCKFILE has §11 Pattern 3 = floating-card) → CONFUSION | **Fresha wins** — STRUCTURE axis. §11 Pattern 3 is the Uber Eats AESTHETIC pattern for *what kind of card*, not a STRUCTURE rule for PDP hero |
| Fresha PDP has separate Highlights section | n/a | Fresha wins — STRUCTURE axis. Add the section, then aesthetic-polish per LOCKFILE |
| Fresha sidebar uses thin border | LOCKFILE wins (s-border token) | Both — STRUCTURE: sidebar has a border (Fresha). AESTHETIC: token = s-border (LOCKFILE) |

### §10.6 — Verification checklist (per route / per component edit)

Every non-trivial edit gets BOTH checks:

1. **Structure check (Fresha):**
   - Have I run `fresha-section-capture` against the matching Fresha route recently?
   - Does the Solen IA match Fresha's section order + count + affordance set?
   - Are sections in the right place (hero before sticky-tab before services before team etc.)?
   - If unsure → run capture, don't guess.

2. **Aesthetic check (LOCKFILE):**
   - Every class string traces to LOCKFILE §1-§11 OR has a V3-D{n} comment justifying inline value?
   - Drift rules A1-A12 pass on the touched file?
   - Per-wave verifier gates (Lighthouse a11y ≥95, LCP ≤2.5s, contrast 0 failures) pass?

If either check fails: don't ship. Document the failure + axis in summary doc as PENDING.

### §10.7 — The wrong way (anti-pattern catalogue)

| Failure | Why it's wrong | Right move |
|---|---|---|
| Apply LOCKFILE §11 "Pattern 3" to PDP hero | §11 patterns are AESTHETIC (about card appearance, image rules), NOT structural (where hero goes). PDP hero structure = Fresha 3-photo grid. | Use Fresha PDP capture for hero structure, apply LOCKFILE §11 imagery rules (rounded-none) within whatever structure Fresha defines |
| Sweep tracking values without checking Fresha section uses them | Drift rule fires on canonical-tracking but the Fresha section may genuinely use a non-canonical value for a reason | Run capture, see if Fresha's actual value matches canonical. If yes, sweep. If no, surface conflict. |
| Build a route ground-up using only LOCKFILE | Resulting route is aesthetically correct but structurally invented — won't match user's "Fresha-clone" expectation | Capture Fresha equivalent first, then compose per Fresha IA + LOCKFILE aesthetic |
| Pivot a mockup variant choice based on "what feels right" instead of "what does Fresha do here" | Aesthetics pivot becomes structural drift over time | Anchor structure decisions to Fresha capture. Anchor aesthetic decisions to LOCKFILE. |

---

### §10.8 — Operations: skills, signals, self-auto-verification (V3-D338-ops)

User flag 2026-05-28: "u need to put in how to achieve wich skill to use when to know when ur drifitng or maiking self auto verifications etc bro."

This is the operational layer of the dual-axis rule. The rule above says WHAT. This says HOW.

#### §10.8a — Skill / tool stack per axis

**STRUCTURE axis (Fresha source-of-truth):**

| When | Tool | Output path | Notes |
|---|---|---|---|
| Before any route rebuild OR major section change | `fresha-section-capture` skill | `public/_pixel-refs/fresha/<section>/SPEC.md` + `<section>/static-{mobile|desktop}-{viewport}.png` | Fires Playwright at fresha.com URL. Captures DOM + computed CSS + interactive states + screenshots. FIRST tool to fire for any structural work. |
| Cross-reference for prior captures | Read `public/_pixel-refs/fresha/<section>/SPEC.md` | (read-only) | If section already captured AND <30 days old, reuse. Otherwise re-capture. |
| Pattern reference | Read `_design-system/AGENT_BRIEF_TEMPLATE.md` | (read-only) | "Fresha bones + Solen skin" formula for sub-agent dispatch. |

**AESTHETIC axis (Uber/LOCKFILE source-of-truth):**

| When | Tool | Output path | Notes |
|---|---|---|---|
| Before any non-trivial edit | Read `_design-system/LOCKFILE.md` §1.5 / §2.5 / §11 / §6 | (read-only) | Token + type role + imagery + copy rules. Never stale. |
| After any sweep | `/solen-drift-check` skill | `_design-system/_drift-report.md` + `_design-system/_pending-migration.md` | Python scanner. Validates aesthetic gates A1-A12. |
| Pattern reference (Uber-measured) | Read `public/_pixel-refs/uber/{blue,feedback-blue,imagery}/UBER-*.md` | (read-only) | Measured Uber patterns underlying the LOCKFILE rules. |
| Per-wave gates | Read `_design-system/WORK_TYPES.md` | (read-only) | Lighthouse a11y ≥95, LCP ≤2.5s, contrast 0 failures. |

**Cross-axis (both):**

| When | Tool | Output | Notes |
|---|---|---|---|
| End of every wave | Compare BOTH SPEC.md + drift-report → screenshot | `_audits/screenshots/<wave>/` | Visual diff catches what neither axis-1 nor axis-2 check alone would catch. |
| Multi-model second opinion on ambiguous calls | `llm-council` skill | console | Per Ambiguity-Resolution Ladder Rung 4 in WAVE_PLAN F9. |
| Read-only investigation of consumer impact | `Agent` tool with `Explore` subagent type | Subagent return message | Use when "which routes import X" / "does Y exist anywhere" type questions arise. |

#### §10.8b — Drift signals (concrete tells you're conflating axes)

If ANY of these fires, STOP the edit. Re-anchor via §10.0 decision tree.

| Signal | What it means | Recovery |
|---|---|---|
| **Eyeballing a Fresha screenshot to "rebuild"** instead of firing `fresha-section-capture` | You're guessing structure from a pixel image. Will miss interactive states, computed CSS, copy density. | STOP. Fire the skill. Wait for SPEC.md. Then proceed. |
| **Inventing a new design token** not in LOCKFILE §1-§11 | You've made an aesthetic decision unilaterally. Will cascade into drift across consumers. | STOP. Either find the existing token that fits OR raise as design-system addition (mockup + recommendation in summary). Never invent inline. |
| **Picking a layout pattern based on "what feels right"** instead of "what does Fresha do here?" | You've made a structure decision unilaterally. Will diverge from Fresha-clone mission. | STOP. Check Fresha SPEC.md. If missing, fire capture. If present, follow it. |
| **Building variants for a visual decision** without first checking Fresha or LOCKFILE | You're framing as a user-choice when the source-of-truth already answers it. | STOP. Read SPEC.md (structure) or LOCKFILE (aesthetic) first. Only build variants if BOTH sources are silent OR conflict requires user pick. |
| **Asking user for a design choice** that Fresha already answered | You're shifting cognitive cost to user instead of doing the homework. | STOP. Fire capture / read LOCKFILE. Surface to user only if both sources are silent. |
| **Applying a LOCKFILE §11 pattern as if it were structural** | You're using AESTHETIC rules to make a STRUCTURE decision. T4 of overnight run made this exact mistake. | STOP. Re-read §10.0 decision tree. Identify the right axis. Hit the right source. |
| **Skipping the drift-check after a sweep** because "it's just a small fix" | Surgical fixes still need axis-2 verification. The "just small" frame is how drift sneaks in. | STOP. Run drift-check. Confirm 0 hard breakages on touched files. |
| **Marking a route done without screenshot diff** | You're claiming completion without visual evidence. Both axes need visual verification. | STOP. Screenshot before-AND-after. Eyeball diff. Only then mark done. |

#### §10.8c — Self-auto-verification triggers (when to run each check)

| Trigger | Action | Skill / tool |
|---|---|---|
| **Before every non-trivial edit** | 60-second pre-edit check (§10.8d below) | Mental script |
| **After every route sweep** | (a) drift-check on touched files (b) confirm Fresha SPEC.md exists & is current | `/solen-drift-check` + ls check |
| **After every component sweep** | (a) drift-check (b) screenshot each consumer route | `/solen-drift-check` + Playwright |
| **After every ground-up rebuild** | (a) Fresha SPEC.md re-read (b) drift-check = 0 hard (c) screenshot mobile + desktop (d) verifier subagent PASS | Multi-tool |
| **Every 60 min in autonomous runs** | Re-anchor by re-reading LOCKFILE §10 + the active wave's task description | Read |
| **When pivoting a mockup variant** | Stop. Ask: "am I pivoting on axis (data tells me to) or eyeballing (taste tells me to)?" If eyeballing → re-anchor before pivoting | Mental script |
| **When a sweep > 30 min** | Re-anchor mid-sweep: re-read the relevant §X.Y rule for the pattern being swept | Read |
| **When console errors appear** | (a) Read the error (b) trace to last edit (c) if root cause unclear after 15 min, fire `llm-council` | Bash + Playwright + (optional) llm-council |
| **When tempted to invent a token / pattern** | STOP. Check if existing fits. If not, file as design-system recommendation in summary doc | Read LOCKFILE first |

#### §10.8d — The 60-second pre-edit check (mental script)

Before any edit that's NOT a 1-3 line surgical fix, run this script in order. Write the answers in the summary doc (or mentally for trivial cases). Skipping this = the failure mode that bit T4.

```
Q1: WHAT AXIS is this change on?
   - STRUCTURE (IA / layout / section / affordance / "what or where")
   - AESTHETIC (color / type / contrast / accent / radius / "how it looks")
   - BOTH (most non-trivial edits)

Q2: WHERE'S THE SOURCE OF TRUTH?
   - For STRUCTURE: Fresha SPEC.md at public/_pixel-refs/fresha/<section>/
     → if SPEC.md missing or stale, FIRE `fresha-section-capture` first
   - For AESTHETIC: LOCKFILE §1.5/§2.5/§11/§6
     → cite the section number explicitly

Q3: HAVE I READ THE SOURCE IN THE LAST HOUR?
   - If no → re-read NOW before editing
   - If yes → cite the rule/spec line in the V3-D{n} comment

Q4: DOES MY PROPOSED EDIT MATCH IT?
   - If yes → proceed
   - If no → either revise to match OR surface as conflict per §10.5

Q5: WHAT'S THE POST-EDIT VERIFICATION?
   - Drift-check on touched files (always)
   - Screenshot diff if visual change
   - Fresha-diff if structural change
   - Lighthouse a11y if a11y could regress

If Q1-Q5 takes >2 min, the work is bigger than you scoped. Reclassify per WORK_TYPES.md.
```

#### §10.8e — Cache invalidation: when is a Fresha SPEC.md stale?

Default TTL: **30 days** (Fresha doesn't redesign frequently; 30 days is the safety window before assumed-stale).

INVALIDATE EARLY (re-capture immediately) if ANY of:

1. User flags "Fresha changed" or "doesn't look like Fresha anymore"
2. A visual diff comparing current fresha.com against the SPEC.md screenshot shows ≥10% pixel difference
3. The section being rebuilt has no SPEC.md yet (initial capture)
4. The component being rebuilt has structural questions the existing SPEC.md doesn't answer (e.g. SPEC.md captured the hero but not the sticky tab; rebuild needs sticky tab → re-capture extended scope)
5. Fresha announces a public redesign (rare; check Fresha changelog / blog before assuming)

**LOCKFILE never goes stale** — it's the project's truth. Updates to LOCKFILE are intentional + dated with V3-D{n} markers.

#### §10.8f — Concrete drift-or-not test (for the moment of ambiguity)

When you're about to make a decision and unsure if it's structure or aesthetic:

**Ask: "If I open Fresha right now and look at the same section, would my proposed change MATCH what I see or DIVERGE?"**

- If MATCH → you're on axis 2 (aesthetic refinement of a structurally-correct surface). Proceed.
- If DIVERGE → you're on axis 1 (structural change). STOP. Either don't change OR fire capture to verify your divergence is intentional.
- If "I don't know what Fresha does here" → that's the answer. Fire `fresha-section-capture` BEFORE editing.

This single test catches 80% of axis-confusion mistakes.

---

## §11 — Imagery Pattern Registry (V3-D330, 2026-05-28)

**Rule:** All imagery on Solen surfaces uses one of 5 enumerated patterns + obeys 5 non-negotiable rules. Inspired by measured Uber inventory (cited as `public/_pixel-refs/uber/imagery/UBER-IMAGERY-PATTERN.md` — 116 desktop images across 8 surfaces; **same 2026-08-03 flag: the file is not on disk and not in git history. The 5 patterns + 5 rules stay locked; the numbers below are quoted from a source no one can currently re-open**). Sourced finding: Uber is illustration-first (34%), photo-as-trust-layer (28%), chrome (38%). Zero video. 0px border-radius on every image.

### The 5 patterns

| # | Pattern | Layout | Solen surfaces |
|---|---|---|---|
| 1 | **Split-hero** | Text+CTA LEFT, 1:1 or 3:2 visual RIGHT. No overlay. | Homepage (add salon photo RIGHT of search), `/fuer-salons` hero, `/warum-solen` hero |
| 2 | **Full-bleed editorial photo** | 1440×700 art-directed photo, text in natural empty negative space. No rgba scrim. | Category landings (`/coiffeur` / `/barbershop` / `/nails` / `/spa` / `/makeup` / `/waxing`) — ~6 photos |
| 3 | **Search-card over full-bleed photo** | Solid white card on top of lifestyle photo. Card is opaque (not glass). | Salon PDP `/salon/[slug]` — promote salon's cover photo to full-bleed, float booking card |
| 4 | **Alternating image-text rows** | One ~558×372 image + adjacent text+CTA, alternating sides. | `/fuer-salons` features (upper funnel), `/business` alt layout |
| 5 | **Magazine grid** | 3-col 16:9 thumbnails + one feature card 2× others. 1-col vertical on mobile (same count). | `/entdecken` mode-2 (toggle: stream-feed / magazine-grid) |

### Non-negotiable rules (drift rule A10 enforces)

| Rule | Why |
|---|---|
| **`border-radius: 0` on all images** | Uber doesn't round photos. Rounding implies avatar/icon. Exceptions: (1) avatar circles in `Avatar` primitive; (2) **V3-D350 (2026-05-28): search-result cards (`SalonResultCard`) use rounded photo corners (`rounded-card`), an explicit exception to the rounded-none imagery rule, per user direction 2026-05-28 — these are Airbnb-style result cards, not editorial/hero imagery. All other images stay flush.** |
| **No FLAT `rgba(0,0,0,*)` overlay washes** | For MARKETING/editorial photos: art-direct so text falls on naturally-empty zones (unchanged). For UI that must overlay **arbitrary user-uploaded photos** (PDP hero gallery dots/counters, photo-card titles, category cards): a flat wash is still banned, but the **DS-10 gradient scrim** below is the sanctioned tool (2026-06-11, owner-approved — refines this rule, doesn't break it). |
| **No `<video>` on marketing surfaces** | Uber's 8 surfaces use zero. Stills + Lottie illustrations only. (Carve-out: `/entdecken` TikTok-stream feature exempt — that's content, not chrome.) |
| **Single image-CDN pipeline** | All images route through `next/image` + Supabase Storage. Mirror Uber's `cn-geo1.uber.com/image-proc` pattern. |
| **Same images mobile + desktop, stacked** | Don't hide images on mobile. Crop/resize the same asset. Hero photos resize from 1440×700 desktop → 375×480 mobile (same image, different crop). |

### Text-on-photo scrim recipe (DS-10, video-audit 2026-06-11, owner-approved)

When text or controls MUST sit over an arbitrary photo (salon uploads — brightness unknowable), ONE recipe:

```css
/* bottom-anchored gradient: photo stays clean, text zone earns contrast */
background: linear-gradient(180deg, rgba(0,0,0,0) 38%, rgba(0,0,0,.62) 100%);
/* scope it: full-card for photo-card titles; bottom 64px band when only dots/chips need backing */
```

- Premium variant (heroes only): progressive blur UNDER the gradient —
  `backdrop-filter: blur(7px)` masked with `linear-gradient(transparent, black 70%)` on the bottom band.
- Never a flat full wash (kills the photo), never text on a bare photo (fails on bright uploads, DS-9).
- Small floating controls over photos keep using `FROST_GLASS` discs (CONTROL_ELEVATION A) — the scrim
  is for text/indicator ZONES, the disc is for tappable CONTROLS.

### Sourcing policy (V3-D330)

User locked path: **AI placeholders during sweep, swap real photos lazily.** Pattern 2 (full-bleed) + Pattern 5 (magazine grid) both depend on photography. During phase 2 sweep, use AI-generated salon-scene placeholders. Real Swiss salon shoot scheduled lazily (out of scope for this sweep). When real photos arrive, swap by uploading to Supabase Storage + replacing the `src` — no code change.

### Migration mapping (phase 2 sweep)

| Surface | Current state | Pattern to apply | Photo source |
|---|---|---|---|
| Homepage hero | Search card alone on grey | Pattern 1 split-hero | AI placeholder 1:1 |
| `/fuer-salons` (new) | (being built) | Pattern 1 hero + Pattern 4 features | AI placeholders |
| `/warum-solen` | Text-only hero | Pattern 1 split-hero | AI placeholder 3:2 |
| `/coiffeur` etc (6 categories) | Plain grey hero | Pattern 2 full-bleed editorial | AI placeholders × 6 |
| `/salon/[slug]` | Static grey hero band | Pattern 3 search-card-over-photo | Salon's existing cover photo |
| `/entdecken` (mode 2) | TikTok stream only | Pattern 5 magazine grid (toggle) | Stylist work photos |

### Aspect ratios (canonical set, drift rule A11)

Per Uber measurement: `1:1` (split-hero squares), `3:2` (alternating rows + card thumbs), `16:9` (magazine grid + newsroom), `21:9` (full-bleed wide heroes). Allowed values: `aspect-square`, `aspect-[3/2]`, `aspect-video`, `aspect-[21/9]`, `aspect-[4/3]` (PDP cover photos only). Anything else = drift A11.
Example: Fresha closes "Closed" in burnt amber `#B7570B`. LOCKFILE has `s-urgency #C2410C` as the urgency accent (V3-D424; this §11 aside previously said #9A3412, corrected 2026-07-12 to match §1 + live tailwind.config.js:186). → LOCKFILE wins (visually equivalent, our token is the source).

---

## §12 — Operator dashboard skin (VIBRANT — distinct from customer B&W) (V3-D347, 2026-05-29)

User flag 2026-05-29: dashboard "too monochrome … I want vibrancy, same saturation as the blue … if the pill is green I don't want black text inside … more rounded, modern." Reframe: **the customer-facing marketplace stays B&W (§1–§11); the OPERATOR dashboard (`/dashboard/*`) is a separate, vibrant skin.** Customers never see the dashboard, so its vibrancy doesn't touch the public brand.

### §12.1 — Structure source = Fresha B2B (Mobbin-captured)
Dashboard IA mirrors Fresha for Business (verified via Mobbin web screens, 2026-05-29): **icon rail** (Übersicht · Kalender · Katalog · Kund:innen · Marketing · Verkäufe · Team · Berichte · Einstellungen) + topbar (location switcher · setup · search · notifications · avatar). **Calendar = staff-as-columns** (day/week), blocks colored by **service type**, slide-in detail panel. **Verkäufe** consolidates sales/payments/gift-cards/memberships. Home = KPI overview (sales line chart · upcoming bar chart · activity · today · top services · top team). Multi-category support stays **conditional/hybrid** (a salon's `categories[]`), folded into Katalog/Team — NOT per-category nav soup. **No makeup** (dropped from `SalonCategory`).

### §12.2 — Vibrant palette (full saturation, consistent with accent blue)
| Role | Token | Notes |
|---|---|---|
| Primary CTA + active nav | `s-accent` `#276EF1` | The vibrant blue. Hover → darken to `s-accent.deep #1E54B7` (DS-6, 2026-06-11, owner-approved; corrected 2026-07-12 — the old "folded into #276EF1" note predates the DS-6 re-activation). (Dashboard ONLY — customer site keeps ink CTAs per §0.2.) |
| Status pill text | **saturated semantic** (`text-s-success`/`s-error`/`s-warning.text`/`s-ink-2`) | NEVER ink/black text on a colored pill. Resolves the §1 "pastel+ink" vs §2.5 "semantic text" conflict in favor of **§2.5 semantic text** for dashboard. |
| `s-warning.text` | `#B45309` | Readable darker amber for warning text on `s-warning.bg` (amber DEFAULT fails contrast as text). |
| Charts (data-vis) | accent-blue + universal semantics | Line/bar charts use `#276EF1` / `#16A34A` / `#DC2626` (one-red V3-D421; corrected 2026-07-12) — NOT chart-grey. (Chart-grey §1 Layer-4 is for the *customer* competitor-chart only.) |
| Calendar service colors | service palette (W3, to be locked) | blue cut / pink color / orange beard / violet nails / green spa — vibrant, store-defined service types, tinted block bg + colored border. |

### §12.3 — Radii (rounder/modern)
Dashboard cards/panels = `rounded-card-lg` (20px). Calendar blocks = 12px. Pills/buttons = `rounded-btn`/`rounded-full`. Softer than the customer-site 16px.

### §12.4 — Drift-checker scope
Files under `app/[locale]/dashboard/**` and `app/[locale]/_components/dashboard/**` are **exempt from A9** (accent-restriction) and may use `s-accent-bright` as primary + the vibrant semantics/service palette. They are NOT exempt from A4 (retired easings), A5 (RETIRED tokens like s-coral/s-amber/makeup), A6 (emoji). Primitives: `DashButton` (primary=`s-accent-bright`), `DashStatusPill` (semantic colored text). See `_components/dashboard/DashboardUI.tsx` + `_design-system/components/DashboardUI.md`.

---

## §13 — Icons · Steppers · Badges (the grey/black system) (V3-D470, 2026-06-10, owner-demanded + Mobbin-grounded)

Owner 2026-06-10: _"will they research how apple does it by using grey and black … go fix that and put it in your design system … in the walk-in we have icon and underneath text, should be like that everywhere … the black check mark, isn't it green … fix the fucking design system too."_ This section is the canonical spec for **every icon, step indicator, and badge**, on the AESTHETIC axis (companion to §1.5 color model + CONTROL_ELEVATION). Grounded in measured Mobbin references (citations at end), reconciled with §1 tokens, §1.5 accent rule, SelectedCheckBadge.md, SuccessMark.md.

**The one-line philosophy: _color is earned, not default._** An icon's job is to aid scanning, not to decorate. If every icon is tinted, color stops carrying information and the eye can't find the one icon that means something. So the DEFAULT for any glyph is monochrome (ink/grey), and color is spent only where it buys meaning, interactivity, or selection. This is the same root principle as 80/17/3 and "blue = interactivity" — applied to glyphs. (First-principles, not imitation: Apple / Beli / Instagram / Uber all converge here because the principle is sound, not because they're the reference.)

### §13.1 — Icon color model (monochrome-default; 4 earned overrides)

**Default (no override applies): the icon is monochrome and matches its paired text role.**

| Icon context | Color | Token |
|---|---|---|
| Glyph paired with primary text (row title, header) | ink | `text-s-ink` |
| Glyph paired with secondary/meta text | grey | `text-s-ink-2` |
| Navigation / disclosure affordance (chevron-right, the faint trailing glyph) | faint grey | `text-s-ink-3` |
| Decorative glyph inside a tappable row (the ROW is the target, not the icon) | ink / grey (per its text), **never tinted** | `text-s-ink` / `text-s-ink-2` |

**Color OVERRIDES the monochrome default ONLY in these four cases (check in order, stop at first match):**

1. **State / meaning (semantic, Layer 3)** — the icon IS the message. Green check = done/paid/confirmed (`s-success` #16A34A). Red = error/destructive (`s-error`, e.g. a "Logout"/"Löschen" glyph). Yellow star = rating (`s-star` #FFC32B). Pink heart = saved (`#FF3366`). Amber triangle = warning (`s-warning`). Never invent a hue (§0.4).
2. **The tap target IS an icon-only control** — blue (`text-s-accent` #276EF1). A standalone icon-button or inline action icon whose whole job is to be tapped (a bare directions pin-button, a "copy" icon-button). NOT a decorative icon that merely sits inside a larger tappable row — that stays monochrome (this is the drift-A9 boundary; getting it wrong is the #1 icon mistake).
3. **Selection (avatar check-badge ONLY)** — ink (`bg-s-ink` disc + white check), Solen's `SelectedCheckBadge`, for staff/barber pickers where the marker sits on a photo and needs contrast (parked at ink, owner 2026-06-29). EVERY OTHER selected state (filter pill, chip, menu/list option, segmented control) = calm GRAY fill `bg-s-bg-sunken` (#F4F4F5) + `text-s-ink` + semibold over a white unselected, the TabPill treatment, NEVER black/ink (owner 2026-06-29, gate `no-black-selected`; supersedes the prior ink-fill selection). **FOURTH NAMED EXCEPTION, owner override 2026-07-19 (TASTE_LOG "booking category pills: BLACK selected + scroll-spy"): the BOOKING services-step category pills are `bg-s-ink text-white` when selected. The owner picked black after being told the lock and the gate both block it; the line carries a `selected-ok:` escape. Scoped to those custom pills only , they are not the shared TabPill, so nothing else's selected state moves, and this does NOT reopen ink-fill anywhere else.** The exception list is now: the ONE commit button, the booking date/slot blue, this avatar check-badge, and the booking category pill.
4. **On a photo** — frosted white glass (`FROST_GLASS`), per CONTROL_ELEVATION (A). A glyph over imagery is never bare-tinted.

**Hard "never":** never tint a decorative/inline icon blue "to add life" (that is the §1.5 dead-grey trap inverted — life comes from imagery/motion/semantic, not from painting chevrons blue), never give a row three colored icons, never color an icon a hue it doesn't earn from the table above. Stroke width: Lucide default `1.9` for inline glyphs, `2.8–3` only on a check inside a filled disc (so the white check reads against the fill).

### §13.2 — Progress stepper / step tracker (the icon-above-text pattern)

The booking flow indicator (Service → Zeit → Haare → Bezahlen) and the walk-in live tracker (Bezahlt → In der Schlange → Fast dran → Dran). Owner locked the **icon-ABOVE-text** form ("should be like that everywhere") — the DoorDash/Uber delivery-tracker shape, not the old icon-beside-text inline chip.

**Three node states — LITERAL recipes (UNIFIED BLUE, 2026-06-11):**

> **Supersession note (2026-06-11, owner-approved booking-pay/-hair mockups, shipped in `BookingWizard.tsx`):** the 2026-06-10 green-family stepper + walk-in-blue-exception model is REPLACED by ONE blue stepper language everywhere. Owner on the green booking stepper: _"green doesn't really align with the design system… like in walk-in."_ **Blue = progress, green = state (success/confirmed), never the reverse.** The walk-in "exception" is now simply the rule.
>
> **Boundary vs the gray selected/active law (clarified 2026-07-12, consolidation):** the 2026-06-29 gray-fill rule governs SELECTION (a user choosing among options: pills, chips, list options, segments). A stepper communicates PROGRESS, not a choice — it is a different semantic class and stays blue per this section. Derivation: the 2026-06-29 contract row lists its own exceptions by choice-semantics (commit button, booking date/slot, avatar badge) and never names progress components; §1 already carries "§13.2 stepper discs" in the locked blue system-states list.

| State | Disc | Glyph | Label |
|---|---|---|---|
| **Done** (completed step) | `bg-s-accent` #276EF1, 42px | white step-icon, 18px, stroke 2 | `text-s-ink`, 10.5px, weight 600 |
| **Current** (active step) | white disc, 42px, **inset 2px blue ring + 5px halo** (`box-shadow: inset 0 0 0 2px #276EF1, 0 0 0 5px rgba(39,110,241,.14)`) | blue step-icon, 18px | `text-s-ink`, 10.5px, weight 700 |
| **Upcoming** (future step) | `bg-s-bg-sunken` #F4F4F5, 42px | `text-s-ink-3` step-icon | `text-s-ink-3`, 10.5px, weight 600 |

- **Connector line:** `bg-s-border` #E4E4E7, 2px, `border-radius: 2px`, vertically centered on the discs (`margin-top: 20px` for a 42px disc). Done-portion renders `bg-s-accent`; future stays grey. One connector per gap (no doubling).
- **Distinct icon per node** when the steps have real identity (the DoorDash pattern the owner liked): booking = `scissors` (Service) → `clock` (Zeit) → `brush` (Haare) → `credit-card` (Bezahlen); walk-in = `check` → `users` → `clock` → `armchair`. Each node keeps its own glyph at every state (state is shown by the disc treatment, not by swapping to a check). Hand-drawn glyphs + `sparkles` are banned. **Only the current node's label is weighted up.**
- **Green on a stepper node = NEVER.** Green remains the success/confirmed STATE color (SuccessMark, paid pills); a live tracker's "done" disc is blue. (Historical: the green-family recipe V3-D470b lived 2026-06-10 → 2026-06-11.)
- Done discs stay tappable for jump-back when the flow allows editing previous steps (shipped BookingWizard behavior).

**Orientation rule:**
- **Horizontal, icon-above-text** — the default for a top-of-screen tracker with **≤4 nodes** (booking step bar, walk-in live tracker). Discs 36px, labels under, `si-line` connectors between.
- **Vertical, icon-left-of-text** — for a longer onboarding/setup CHECKLIST (5+ items, N26/Monzo style): disc on the left, title + 1-line description to the right, vertical connector. Same three node-state recipes.

**One progress indicator per screen.** Owner flagged a screen showing both a step tracker AND a separate time/progress bar — _"why two."_ Pick the step tracker OR a single bar, never both.

### §13.3 — Badge taxonomy (when a small mark is which color)

| Badge | Visual | Token | Layer | Used for |
|---|---|---|---|---|
| **Selected** (picker) | ink disc + white check, `border-2 border-white` | `bg-s-ink` | 1 (chrome) | staff/barber pickers — `SelectedCheckBadge` |
| **Done** (stepper node) | blue disc + white step-icon, 42px | `bg-s-accent` #276EF1 | 2 (progress) | completed step in §13.2 (unified blue, 2026-06-11) |
| **Success focal** (confirm/paid) | green disc + white check, ~58px, spring-pop | `bg-s-success` #16A34A | 3 (semantic) | the ONE delight peak — `SuccessMark` (one per screen) |
| **Status** (open/closed/pending) | pastel `.bg` + ink/semantic text pill | `StatusPill` | 3 (semantic) | inline live state |
| **Rating** | filled star | `fill-s-star` #FFC32B | 3 (semantic) | review counts, ratings |
| **Saved** | filled heart | `--heart-active` #FF3366 | 3 (semantic) | save/favourite |
| **Notification count** | small filled pill on a bell/tab, white numeral | **red `s-error` #DC2626** (recommended) | 3 (semantic) | unread count — see note |

**Notification-count note (owner-flag, OPEN):** the near-universal mobile convention is a **red count badge** (iOS springboard, Instagram, etc.). It reads as "unread count," NOT as "error," because context + shape differ (a tiny numeral pill riding a bell/tab icon, never an inline message). Recommended: red `s-error` #DC2626, white `font-num` numeral, `99+` cap. The ink alternative (neutral count) is calmer but loses the instant "you have new things" signal. **Flagged for owner confirmation in QUESTIONS.md (Q-stepper-1)** — until confirmed, red is the default since it matches every reference.

### §13.4 — Codes are NOT mono (Inter Tight tabular)

Owner 2026-06-10 rejected the code font hard: _"the font is not correct about … W-047 … that w thingy the font is different."_ Ticket numbers (`W-047`), voucher/gift codes (`GIFT-7K2M`), booking refs render in **`Inter Tight`, weight 600–700, `font-variant-numeric: tabular-nums`, slight `-0.01em`** — the `.num`/`.mono` mock-kit class now points at Inter Tight, NOT JetBrains Mono. JetBrains Mono is **RETIRED** (see §2 + §1 retired list). Rationale: a mono code-face was a foreign texture against an all-Inter-Tight UI; tabular Inter Tight gives aligned digits + a code feel without the texture clash.

### §13.5 — Drift signals (you are violating §13 if…)
- a chevron / disclosure glyph is anything other than `text-s-ink-3` grey;
- a decorative row icon is `text-s-accent` blue (blue is only for an icon that IS the tap target);
- a SUCCESS disc (SuccessMark, paid/confirmed) is anything but green `#16A34A`; a STEPPER done-disc is anything but blue `bg-s-accent` (unified blue 2026-06-11);
- a current step circle is a solid fill of any color, instead of the **blue ring + halo** on white (`inset 0 0 0 2px #276EF1, 0 0 0 5px rgba(39,110,241,.14)`);
- a stepper node renders green (green = state, never progress — supersedes V3-D470b);
- a screen shows two progress indicators (a stepper AND a bar);
- a code (`W-047`, `GIFT-7K2M`) renders in JetBrains Mono / any monospace;
- a `·` middot separates meta (banned — §0.1 / §6 service-row format).

### §13.6 — References (Mobbin, captured 2026-06-10)
- Steppers: [Minna Bank](https://mobbin.com/screens/ee0764da-eba8-4c79-8fa0-7f3d262e71fe) (B&W box-check / ink-numeral / dotted-future) · [N26](https://mobbin.com/screens/b6ec6a4b-56c2-49f7-b46d-ddbd62bf1096) (**green-check done / filled current / grey-outline future** — closest to ours) · [Monzo](https://mobbin.com/screens/858f6b4b-d550-46c5-9134-95e3c9a34f61) (green-check done / highlighted current card / greyed future) · [Booking.com](https://mobbin.com/screens/863aee66-2ec7-45fc-8c0d-72f66afa243a) (horizontal check / filled / grey-number).
- Icon-color (monochrome glyphs + grey chevrons; color only for state/selection): [Beli](https://mobbin.com/screens/e2647ce3-56f4-436e-a69d-35891ddd99f9) (red ONLY on Logout) · [Instagram](https://mobbin.com/screens/83c9dde8-a66e-4860-bfd4-dfc1c070827d) (grey trailing counts) · [Flighty](https://mobbin.com/screens/da15e520-056a-4a1c-a086-5f1ce25bea11) · [Afterpay](https://mobbin.com/screens/e55375ea-44d7-4290-8cad-738fcfead73d).

### §13.7 — Icon-size pairing table (DS-2, video-audit 2026-06-11, owner-approved)

Icon size is DERIVED from the text it rides with — never eyeballed. Lucide only, `strokeWidth 2`
(1.75 at ≥24px). Rule of thumb from the audit: icon ≤ the text's line-height, then tighten the gap.

| Context | Text size | Icon size | Gap |
|---|---|---|---|
| Meta line / chips / counts | 12–13px | **14px** | 4–5px |
| Body rows / buttons / inline actions | 14–15px | **16–18px** | 6–8px |
| List-row leading icon | 15px title | **18–20px** inside a 38–44px `bg-s-bg-sunken` box (radius per nesting formula) | 12–13px |
| Stepper / hero discs | — | **18px** inside 42px disc | — |
| Empty-state / focal | — | **22–26px** inside a 56px+ disc | — |

- **Label ladder (with §6 copy economy):** famous icons (house, heart, search, bell, share, X) ride
  label-free; anything less iconic gets a visible label on mobile (tooltips are desktop-only).
- **Ghost control recipe:** rows/sidebar items are ghost buttons — transparent at rest,
  `bg-s-bg-sunken` on hover/pressed (the §3.5 list-row recipe). Never give them borders.
- **Zone rule:** different icon STYLES may coexist only in visually separate zones (3D category tiles
  vs Lucide UI glyphs is sanctioned; mixing within one zone is drift).

---

## §14 — Card grammar + content resilience (DS-7 / DS-8 / DS-9, video-audit 2026-06-11, owner-approved)

### §14.1 — Card grammar (the 5-step recipe)

Every card/list-item is built in this order — "Label: value" pairs are a spreadsheet, not a card:

1. **Group** related facts (name+address; price+rating; time+duration).
2. **Rank** the groups — the user's scan order, most important top-left.
3. **De-label** — the UI implies labels (a star implies rating; CHF implies price). A label survives
   ONLY where genuinely ambiguous (check-in vs check-out class of problems).
4. **Icon the details row** — one row of icon+value pairs (14px icons per §13.7) instead of label text.
5. **One differentiated element** per card (size/weight/photo) — if everything is 13px/regular, the
   card is a spreadsheet again. Photos whenever honest (rich-not-bland).

### §14.2 — Divider decision rule (DS-8)

Whitespace FIRST. The ladder: (1) gap-only separation (default for menus, profile rows, review lists —
the §3 "hairlines stay only as dividers INSIDE a grouped list" rule narrows further); (2) hairline
`border-s-border/60` only inside dense receipt-style clusters (price breakdowns, booking summaries);
(3) alternating row tint only in true data tables (dashboard). A divider next to generous padding =
delete the divider.

### §14.3 — Content resilience (DS-9)

Design for the WORST content, not the demo content:

| Role | Rule |
|---|---|
| Salon/service names | 1 line, `truncate` (word-safe ellipsis). Never mid-word clips ("Old Town Bar…"-class bugs). |
| Addresses / meta | 1 line, `truncate` |
| Review/body text | clamp + blue "Mehr lesen" expander (§6) |
| Icons over photos | ALWAYS on a backed disc (frost-glass or white 92%) — never bare on an unknown photo |
| Numbers | `tabular-nums` so columns don't dance |

Phase-4+ mockups MUST include a long-content variant per card type. Empty/edge states are first-class:
every list ships empty + loading + error designed (not an afterthought).

### §14.4 — Flow escape hatches (DS-A6)

Every optional step is skippable (visible "Überspringen"); every preset-choice list has an escape hatch
(free-text/"other"/search); every async transition shows feedback (§3.5 loading). A flow with a dead end
is a bug, not a design choice.
 **Error copy names the exact cause (owner, 2026-06-11 round-2):** "The email addresses
don't match." / "Password needs at least 8 characters." — never a generic "Invalid input"/"Error". One
sentence: the cause, and when not obvious, the fix. Field errors sit UNDER the field (red border + 11.5px
red line w/ alert icon); banner errors only for whole-form failures (wrong password).

---

## §15 — Vibe statement + personality zones (DS-12, video-audit 2026-06-11, owner-approved)

### §15.1 — The vibe statement (test every decision against it)

> "Solen is premium-warm. Photography carries the emotion; the chrome stays quiet. Personality lives in
> the dead zones — empty states, errors, success moments — never in the funnel. Human, never corporate.
> Rich, never cluttered."

### §15.2 — Personality zones

| Zone | Personality allowed? |
|---|---|
| 404 / error pages | ✅ YES — the sanctioned playground |
| Empty states | ✅ YES (light) |
| Success moments (confirmation, queue-done) | ✅ YES (SuccessMark + one warm line) |
| Onboarding | ✅ YES (light) |
| Booking flow / checkout / pay | ❌ NO — funnel stays quiet |
| Queue tracker / search results / PDP chrome | ❌ NO |

### §15.3 — The 404/empty language (Option A typographic, owner pick 2026-06-11)

Locked direction: **typographic** — oversized Inter Tight number/word (ink→grey gradient fade), one
subtle Lucide accent animation (e.g. the scissors snip), human one-liner, single ink CTA. The same
voice carries to empty states (bold human headline + one explanatory line + ghost CTA + small
illustrative icon tiles). NO mascots, NO games, NO photographic 404 (Options B/C rejected).
Reference mockup: `public/_mockups/video-audit/personality.html`.

### §15.4 — Voice: human, not corporate (DS-A5)

German register examples (test new copy against these):
| ❌ Corporate | ✅ Solen |
|---|---|
| "Wir legen grossen Wert auf Details." | "Wir feilen an den Details." |
| "Ihre Anfrage wurde erfolgreich übermittelt." | "Geschafft. Wir melden uns gleich." |
| "Keine Einträge vorhanden." | "Noch nichts gespeichert. Tipp aufs Herz und es landet hier." |

Du-form everywhere (existing rule), no exclamation-mark cheer, no jargon.

---

## §16 — Sheet physics + motion additions (DS-11 / DS-A4, video-audit 2026-06-11, owner-approved)

### §16.1 — Bottom sheets (every sheet, no exceptions)

- **Grabber:** 38×4.5px `bg-s-border` pill, centered, 6px from top.
- **Drag-to-dismiss:** sheet follows the finger (transition off while dragging), releases home under
  ~90px, dismisses past it. Tap-outside + a visible control still work — gesture never the only way.
- **Background = Option B (owner pick):** page scales back behind the sheet —
  `translateY(10px) scale(.965)` + `border-radius 22px` + `brightness(.96)`, 320ms `glide`,
  reversing on close. Dim layer `rgba(10,10,10,.42)` as today.
- Open/close timing stays §3.5 (300ms glide). z-index per §3 scale.

### §16.2 — Gallery position indicators (DS-A4)

Any swipeable image gallery (PDP hero, review photos) shows position dots: 6px white 55% dots,
active stretches to 18px white 100%, 250ms glide; dots sit in a bottom 64px DS-10 scrim band.
Replaces lone "1/6" counters. CSS scroll-snap carries the momentum (no JS physics).

### §16.3 — The ONE shared-element transition (DS-A4 flagship, approved direct-build)

Salon card → PDP via the **View Transitions API**: the tapped card's photo expands into the PDP hero;
content fades up after (§4 glide). Progressive enhancement — browsers without support get the normal
navigation. This is the only shared-element moment; every other route change keeps slide/fade.
Subtle parallax is permitted on home/category heroes only. No scrolljacking, ever.

### §16.4 — Entrance recipes (extends §4)

| Element | Entrance |
|---|---|
| Badges / SuccessMark | pop-rotate (scale .6→1 + slight rotate, spring) |
| Card grids | 40ms stagger rise-in |
| Hero imagery (marketing only) | fly-in + slow bob (4s ease-in-out loop), ONE element max |
| Toast / chips | slide-up + settle (§4 glide) |

### §16.5 — Gesture-release physics (owner-approved 2026-07-10; source: Apple "Designing Fluid Interfaces" WWDC 2018 via the emilkowalski apple-design skill)

**SCOPE (read first).** This section governs ONLY elements a pointer gesture drives 1:1: the Sheet drag-to-dismiss, the SearchMorph drag expansion, and any future draggable surface. It does NOT reopen §4: non-gesture transitions (entrances, route changes, hovers, toggles) keep the locked 4-easing + canonical-duration set, and swipe galleries keep native CSS scroll-snap (§16.2, no JS physics there). The principle: a scripted transition has a duration; a gesture release has a VELOCITY, and discarding it is what reads as "web-janky" vs "native".

**16.5.1 Tracking (during the gesture).**
- 1:1 with the pointer, respecting the GRAB OFFSET (where the finger landed on the element, never re-centering on grab).
- `setPointerCapture` on the handle so tracking survives leaving the element's bounds.
- Keep a short position+timestamp history (last ~5 `pointermove` events or ~100ms) — release velocity comes from this history, not from the last event pair (a single pair is noise).
- ~10px hysteresis before committing to a drag (protects taps and scroll); `touch-action: none` on the handle only.
- Feedback is continuous DURING the gesture; never animate only at the end.

**16.5.2 Release decision — velocity first, position second.** At pointer-up, with `vy` = release velocity (px/s, + = downward) and `dy` = current offset:
- `vy > +250` → DISMISS, regardless of position (a real flick commits).
- `vy < -250` → RETURN home, regardless of position (the user changed their mind mid-drag; the old bare `dy > 90px` rule wrongly dismissed here).
- otherwise → project momentum and decide from where the gesture is GOING, not where it stopped:
  `project(v) = (v / 1000) * d / (1 - d)` with `d = 0.998` (Apple's exponential-decay form, NOT the physics-textbook v²/2a);
  `projected = dy + project(vy)`; DISMISS when `projected > 0.25 * sheetHeight`, else return home.

**16.5.3 Velocity handoff.** The settle animation starts FROM the current dragged position AT the release velocity (the `motion` package `animate(..., { type: "spring", velocity })` — `motion@12` is already a dependency). A fixed-duration CSS transition from the release point discards the velocity and shows a seam; that is the exact defect this section removes.

**16.5.4 Spring house values** (Apple's two-parameter model: damping ratio + response, not mass/stiffness):
| Case | Damping (bounce) | Response |
|---|---|---|
| Return home / any default UI spring | 1.0 (bounce 0 — critically damped, no overshoot) | 0.35–0.4s |
| Momentum release (a flick preceded it) | ~0.8 (bounce ~0.2) | 0.3s |
Overshoot is EARNED by gesture momentum only — a bounce on something that merely faded in is banned. This composes with the §15 personality zones: functional zones stay damping 1.0.

**16.5.5 Rubber-band at boundaries.** Dragging past a hard edge (sheet above its home position) resists progressively, never hard-stops:
`follow = (over * dim * c) / (dim + c * |over|)` with `c = 0.55`, `dim` = the element's relevant dimension. A hard stop reads frozen; graduated resistance reads "alive, but there's nothing more here".

**16.5.6 Interruptibility.** Never lock pointer input during an entry/exit; grabbing a settling element captures it FROM ITS LIVE on-screen transform (the presentation value), never from the logical start/end — restarting from a logical value is a visible jump. When a gesture re-targets, the spring carries the current velocity through (no hard-cut "brick wall"). 2D drags use independent X and Y springs.

**16.5.7 Spatial consistency (small additions to existing law).** Enter and exit along the SAME path (a sheet born at the bottom dies to the bottom — already true, now law). Popovers/menus scale from their TRIGGER (`transform-origin` at the trigger), never from their own center. A reversible non-gesture transition mirrors its easing on the way back (inverse bezier), so out matches in.

**16.5.8 Reduced motion.** 1:1 gesture tracking STAYS under `prefers-reduced-motion` (user-driven motion is not vestibular risk); only the RELEASE animation collapses — short opacity fade per the existing sheet law, no spring, no overshoot.

**Verification law:** gesture physics is verified by a Playwright pointer-event script + video (the Preview tab throttles rAF and lies about motion — memory `reference_preview_tab_raf_throttle`). The two discriminating cases any implementation must pass: (a) fast small flick (~30px in 50ms) DISMISSES; (b) slow 150px drag released while moving UPWARD returns home. The old position-threshold code fails both.


### §13.8 — Brand + 3D icon assets (owner punch list, 2026-06-11)

- **Third-party brand marks use the OFFICIAL brand SVG** (Apple logo, Google G, TWINT, etc.) — never a
  Lucide lookalike (`apple` icon) or a styled letter. Lucide stays the UI glyph set (§13.1); brands are
  brands.
- **The 3D category icon set** (`/icons/categories/*.png`) is a sanctioned separate icon ZONE (per the
  §13.7 zone rule): category tiles, section headers (walk-in), and empty-state accents may use it.
  Never mix 3D icons into rows/buttons where Lucide glyphs live.

---

## §17 · FLOORS (owner-approved 2026-07-21 , the missing half; ceilings unchanged)

Source + evidence: `research/UNFINISHED_AUDIT_2026-07-21.md`. Co-equal with every ceiling in this file.

- **§17.1 Imagery presence:** customer browse/discovery/PDP viewports at 390x844 (corrected 2026-07-25,
  was 375x812; this section was the last straggler after the same correction landed in CLAUDE.md twice
  and in the EMPHASIS BUDGET block below, and `scripts/check-geometry.mjs` already renders the FLOORS
  pass at 390x844 fixed, regardless of `--viewport`) carry roughly >= 1/3
  photographic area; the photo is the largest element of every SalonCard; a missing photo renders the
  spec'd fallback (s-bg-sunken + 3D category icon + salon initial), NEVER a bare grey box, never
  slot-omission. Mockups use real seeded photography. Exempt by name: forms, checkout payment step,
  legal, receipts.
- **§17.2 Depth table (supersedes §3 "sparingly" + §3.5 "both fine"):** SalonCard = photo +
  shadow-whisper + NO border · grouped list card = whisper · PDP/booking sidebar card = hairline only ·
  tile on a gray tray = white, no shadow · overlays/sheets/dropdowns = elevation-2/3 · a card carrying
  elevation drops its border, never both. Edge-visibility floor: every elevated container needs a
  perceivable boundary against its ACTUAL background ((a) on s-bg-sunken, (b) flush photo edge, or
  (c) on white keep the hairline OR step to elevation-2); a white card with only a 4% shadow on white
  is INVALID. The gray tray is RULE, not CONV: grouped/list/panel content on white with no photo anchor
  requires the sunken tray; alternate gray and white down a page.
- **§17.3 Warmth carrier:** cool chrome is legal only when photography OR a semantic-color moment
  shares the viewport; a customer screen with zero warm/chromatic pixels outside pure chrome is the
  dead-grey FAIL, not restraint.
- **§17.4 Card two-anchor rule (V3-D442 adopted as THE card-emphasis law):** TWO ink anchors per card ,
  name (larger, 600) + price (600, tabular); rating value ink-2 beside the yellow star; card titles/H3
  are s-ink, not grey. Display floor: one display anchor >= 28px per customer screen unless the
  photograph is the focal. Tertiary grey #9CA3AF (s-chart-2) reinstated for NON-load-bearing text only
  (chevrons, placeholders, timestamps, hints); forbidden on load-bearing copy.
- **§17.5 The finished-screen pass (ship condition):** (1) photographic focal present, (2) exactly one
  biggest element, (3) >= 1 tabular/real number, (4) >= 1 semantic-color moment, (5) no dead-grey zone.
  All five = Pass before a customer screen or mockup reaches the owner; mockups carry a `floors:` note
  answering all five.

---

## EMPHASIS BUDGET , frozen literals (2026-07-25, FLOORS LAW 7)

Added after the measured flatness diagnosis (`research/FLATNESS_DIAGNOSIS_2026-07-25.md`) found the system
had a size CEILING but no RANGE FLOOR. These are the numbers a customer screen is checked against, on the
RENDERED first viewport at 390x844, not on source.

| literal | value | why |
|---|---|---|
| max share of visible text at weight >= 600 | **30%** | measured PDP was 86%; above ~30% weight stops being a signal |
| min anchor-to-body size ratio | **1.8x** | measured PDP was 1.57x; below ~1.8 the step reads as a wobble |
| min display anchor | **28px** | already law (FLOORS LAW 6); this table sets the RATIO that pairs with it |
| min imagery share, browse/discovery/PDP first viewport | **33%** | already law (FLOORS LAW 2); measured home was 4.7% |
| min distinct elevation steps per screen | **2** | one shadow value = no depth vocabulary, everything on one plane |

Exempt BY NAME (same carve-out as the imagery floor): forms, the checkout payment step, legal pages,
receipts. An ADMIN surface may exceed the weight share, it is a density tool, not a customer screen.

**EVIDENCE TIER (added 2026-07-25 after `research/TASTE_RANGE.md`): every number in this table is a HOUSE
CONVENTION, not a published finding.** The research pass found no external source for a weight-share
threshold, the 1.8x ratio, the 33% imagery share, the 2-elevation-step floor or the 28px anchor. What IS
externally grounded is the MECHANISM: a target sharing its visual properties with the field stops popping
out preattentively and drops into slow serial search (Healey, NCSU), and misplaced emphasis measurably
hurts comprehension rather than merely wasting ink (Gier et al. 2011, 82.59% vs 75.39%, p<.03). Note the
published size figure is 30-50%, i.e. 1.3x-1.5x, so our 1.8x is deliberately STRICTER than the literature,
by choice, not by evidence. Treat these as tunable house settings; do not cite them as research.

**IMAGERY QUALITY CLAUSE (same research, finding 4):** the 33% share is necessary, not sufficient. NN/g
eyetracking found SMALL thumbnails lose to the text beside them (0.9 vs 4.4 fixations) while enlarged
photographs win (12 fixations), and decorative imagery raises cognitive load with no benefit. A screen that
reaches 33% with a grid of small tiles or a mood banner passes the gate and fails the intent: the imagery
must be the screen's largest single element and must show the THING being bought.

These are FLOORS, not targets. Nothing here licenses decoration, fake data, or a second ink CTA; the
existing ceilings (4 sizes, 2 weights, sparse blue, no decorative artifacts) all still bind.

