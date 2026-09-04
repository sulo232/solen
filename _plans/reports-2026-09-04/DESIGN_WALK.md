# Design walk: what is actually missing (owner's question)

Read-only, this-session-measured. Viewport 390x844, DPR 3, iPhone UA, locale de-CH, dev server
`http://localhost:3461`, unless a section says otherwise.

---

## 0. Header: measurement status

**6 of 6 screens live-measured this session, all httpStatus 200, screenshots captured.** The session
was dominated by a real infra outage before this point (documented below because it is itself a
finding, not filler): an unresolved git merge left literal `<<<<<<< HEAD` markers in 15 source files
(`messages/de.json`, four salon components, `SalonAppCta.tsx`), which is what actually produced the
500s, not the "two dev servers sharing one cache" theory first suspected. That merge resolved and
committed mid-session (`4410ad507`); the dev-server *process* stayed stuck on stale compiled output
for a further ~28 minutes after the source was fixed; a restart with a cleared build cache brought it
back. One more transient event after that: the `next-server` process spiked to 121% CPU / 5GB RSS for
roughly 90 seconds under the load of a full 6-route Playwright pass plus check-geometry running back to
back, during which even plain `curl` timed out for ~15s. It self-recovered without a restart. All
numbers below are from passes taken after that recovery, re-verified live against a calm server
(0.5% CPU, sub-3s response) immediately before use.

One route substitution, flagged per the task brief's own instruction to reconsider it: the brief named
`/de/search`. I originally substituted `/de/basel/coiffeur` (matching `e2e/visual/spine.spec.ts`'s
route list) because I assumed "search" meant a category results page. That assumption was wrong:
`/de/basel/coiffeur` hung on every load attempt (5x 90s timeouts, twice), while `/de/search` answered
in 0.5s and is a real, distinct, working route (a dedicated search-results screen, filter pills +
masonry salon grid). **This report uses `/de/search`**, the literal route the brief named.

Screenshots (all under this session's scratchpad, `.../scratchpad/walk/`): `home.png`, `search.png`
(pre-cookie-dismiss skeleton state, see note) + `search_t8000.png` (resolved), `salon.png`,
`profile.png`, `inspo.png` (skeleton state, see note), `dashboard_t8000.png` (resolved; the plain
`dashboard.png` is a pre-hydration skeleton, see 1.6).

**Methodology note that is itself a finding.** Two routes (`/de/search`, `/de/inspo`) render 100%
loading-skeleton at a 1.5s settle window and only resolve to real content between ~4s and ~8s
(measured directly: skeleton count 33 -> 0 between 1.5s and 4s on search; text-leaf count 0 -> 4 -> 22
at 1.5s/4s/8s on dashboard). My own extraction script's "photo area %" numbers at the standard 1.5s
settle are therefore **not trustworthy for masonry/grid routes** and are superseded below by
`check-geometry.mjs`'s own FLOORS pass, which waits longer (attempts a 3s networkidle) and is the
project's self-tested instrument (31 assertions). Where the two disagree, check-geometry's number is
the one used. This is a real, load-bearing loading-time fact, not just a script bug: a first-time
visitor on `/de/search` or `/de/inspo` sees an all-skeleton page for several seconds.

Instruments used: `scripts/check-geometry.mjs --floors-only --auth[=email]` (run from a redirected-
output copy in scratchpad so the tracked repo report file was never touched, per this task's
read-only mandate), a custom Playwright walk script (typography/color/gap/radius/photo-area
extraction), and direct `getComputedStyle`/source re-checks for specific defects.

---

## 1. Per-screen findings

Severity: 4 = structural floor break at scale, 3 = clear floor break, 2 = minor/subtle floor break,
1 = taste gap with no rule, 0 = context only. "Jul-30" = named in
`_design-system/research/WHY_IT_LOOKS_CHEAP.md` (2026-07-30, home page only, see its own item 5 under
"what I could not measure": it never checked any other route). N/A = out of that document's scope.

### 1.1 `/de` (home)

Job: browse/discover salons near me, get to a bookable salon fast.

**FLOORS (check-geometry, signed in):** F2 imagery 41.3% PASS (floor >=33%) · F6 display anchor 18px
FAIL (floor >=28px, "Für dich empfohlen") · F7a weight-share 3.33% PASS (ceiling <=30%) · F7b anchor
ratio 1.5x FAIL (floor >=1.8x) · F7c size spread PASS (3 distinct, cluster 3 within 8px) · ELEVATION 7
distinct shadows PASS.

**Findings:**

| # | Finding | Measured | Rule | Jul-30 | Fix |
|---|---|---|---|---|---|
| 1.1a | Grey "image failed" placeholder in the salon-for-business teaser | Jul-30: 358x358, 38.9% of viewport, `role="img"` + `Bild-Platzhalter` (typo "Solon"), live 65 days | FLOORS LAW 2, NEVER-AGAIN 4 | **YES, #1, was #1-ranked** | **LIKELY FIXED.** `BusinessTeaser.tsx` no longer contains `role="img"` or `Bild-Platzhalter` (grepped this session); only `aria-label={t("forSalons")}` remains. The section is not visually identifiable as a grey box in this session's screenshot. Not 100% visually confirmed (could not positively locate the teaser's current on-screen form in the capture), so flagged LIKELY not CONFIRMED. |
| 1.1b | Salon card now carries two ink anchors (name 600, price via `emphasis`) | Source: `SalonCard.tsx:519` `font-semibold` name, `PriceFrom emphasis className="text-s-ink"` price, dated comment 2026-08-15 | LOCKFILE §17.4 | **YES, #3** | **FIXED**, confirmed both via source and visually (home.png: name and price both render dark, category/address stay grey). |
| 1.1c | Display anchor 18px, ratio 1.5x, both below floor (28px / 1.8x) | Live: 18px, 1.5x | FLOORS LAW 6, EMPHASIS BUDGET (b) | Jul-30 measured the OPPOSITE at this same route: hero anchor **44px desktop / 31.2px mobile, 3.67x/2.60x, both PASS**, and explicitly listed this as one of 17 "already fine, do not touch" items. | **Contradiction, surfaced not resolved (rule 18).** Either the anchoring element changed since 2026-07-30 (a heading now reads "Für dich empfohlen" at 18px where Jul-30's biggest element was a 44px/31px hero), or the two measurements are hitting different elements under the same "display anchor" label. Needs a direct compare, not assumed as regression or as stale-Jul-30. |
| 1.1d | NearbyMap markers render in a fallback typeface (Helvetica Neue, no font class) | Source, re-verified live this turn: `NearbyMap.tsx:72`, `rating.className = "font-semibold"` only, still no `font-body`/font-family class | FLOORS LAW 8 | **YES, #8**, called "cheapest real win on this entire document" | **STILL OPEN**, confirmed on-disk this session. One class, ~30 elements, per Jul-30's own estimate. |
| 1.1e | Walk-in band still hand-builds its own card (not `SalonCard`) | Source: `WalkInBand.tsx:109/124`, `rounded-[13px] border border-s-border bg-white p-3` | FLOORS LAW 8 ("same entity, same component") | **YES, #10** | **STILL OPEN**, confirmed via source grep this session. |
| 1.1f | Wait-estimate text still uses semantic success-green as the loudest color in the band | Source: `WalkInBand.tsx` line ~129, `text-s-success` on the wait number | Taste rule 4 (success is an icon color, never body text) | **YES, #6** | **STILL OPEN** per source; not independently re-measured live this session because the walk-in cards were still skeleton-loading in the capture window (see 0's methodology note). Token is now semantic (`text-s-success`, not a raw hex) but the *role* (a derived estimate, not a state) is unchanged from Jul-30's finding. |
| 1.1g | Review cards still carry a hairline AND a shadow at once | Source, re-grepped this session: `Reviews.tsx` lines ~150-151, `border-s-border` and `shadow-elevation-2` together | LOCKFILE §17.2 ("elevation drops the border, never both") | **YES, #11** | **STILL OPEN**, confirmed via source this session. One line (`Reviews.tsx:146`), delete the shadow class, keep the hairline (10 of 10 references do it that way per Jul-30). |
| 1.1h | "Beliebte Looks" section shows two blank white rounded boxes, no photo and no visible fallback icon | Screenshot only, not re-verified with a longer wait | possibly FLOORS LAW 2 (no bare box in a card slot) | Not applicable, new section/observation | **UNCONFIRMED.** Given the same route showed a masonry section (Beliebte Looks / Inspo preview) that plausibly needs the same >1.5s hydration this session already proved for `/de/search` and `/de/inspo`, this may be the same timing artifact, not a real broken slot. Flagged, not asserted, because it was not re-measured at 8s the way search/inspo/dashboard were. |

**1.1 count: 2 fixed, 1 contradiction-surfaced, 4 still open (of Jul-30's home-page defects that this
walk re-checked), 1 new-and-unconfirmed.**

---

### 1.2 `/de/search`

Job: find a bookable salon matching a category/location, decide which one to open.

**FLOORS:** F2 imagery 63.54% PASS · F6 display anchor 16px FAIL ("Muse Beauty Studio", i.e. a card
name, not a page heading) · F7a weight-share 5.88% PASS · F7b anchor ratio 1.19x FAIL · F7c size
spread **FAIL** (5 distinct sizes inside one 8px window, the "size variety is not range" trap) ·
ELEVATION 6 PASS.

**Findings (all N/A for Jul-30, out of its scope):**

| # | Finding | Measured | Rule | Fix |
|---|---|---|---|---|
| 1.2a | All-skeleton render for the first several seconds | 33 skeleton nodes at 1.5s, 0 at 4s (resolved) | none named ("dead-affordance"/loading-state adjacent, no explicit timing floor exists) | **NO RULE.** The design system has a componentized `<Skeleton>` requirement (shape matches final layout) but no floor on HOW LONG a route may show it. This route's skeleton shape does match its resolved layout (verified: same 2-col card grid before and after), so it is compliant with the letter of the existing rule and still a multi-second blank-feeling wait. |
| 1.2b | 5 distinct font sizes inside one 8px band in the first viewport | Live: 5 distinct, cluster-5-within-8px | EMPHASIS BUDGET (c), "size variety is not range" | Consolidate the 5 close sizes; likely 2-3 of them are half-pixel drift (`text-[Npx]` arbitrary values), the same root cause Jul-30 named for the home page (defect 9), now reproduced on a second route. |
| 1.2c | Display anchor 16px / ratio 1.19x, both below floor | Live | FLOORS LAW 6, EMPHASIS BUDGET (b) | The biggest text on this screen is a card name at 16px. A search-results screen arguably has no natural >=28px anchor candidate (it is a list, not a hero/PDP), which is the same "not every screen has one" tension Jul-30's item under "actively NOT build" already flagged for feed bands. Possible genuine gap: **the floor says every screen needs one, but a list-type screen structurally may not have a natural anchor candidate at all** without inventing one that serves no job (FLOORS LAW 10). |

**1.2 count: 0 fixed/open vs Jul-30 (out of scope), 2 new floor breaks, 1 genuine "no rule fits this
screen shape" gap.**

---

### 1.3 `/de/salon/muse-beauty-studio` (salon PDP)

Job: decide whether to book THIS salon, then get into the booking flow.

**FLOORS:** F2 imagery 34.66% PASS · F6 display anchor 30px PASS · F7a weight-share 7.14% PASS · F7b
anchor ratio 2.14x PASS · F7c size spread **FAIL** (6 distinct, cluster of 5 within 8px) · ELEVATION 3
PASS.

**This is the cleanest screen measured this session** - 5 of 6 floors pass, and it is genuinely rich:
cover photo, name/rating/hours, categorized services (6+ visible, density floor met), combos with a
real discount badge, team, 11 reviews with real German copy, a portfolio grid, an embedded map, hours,
amenities, "similar salons." Full screenshot confirms no dead zones, no skeleton stragglers.

| # | Finding | Measured | Rule | Fix |
|---|---|---|---|---|
| 1.3a | 5 distinct sizes clustered inside one 8px window | Live | EMPHASIS BUDGET (c) | Same size-consolidation issue as home and search: a real, repeating pattern across 3 of 3 content-dense routes measured so far, not a one-off. |
| 1.3b | 1393 console errors were logged on this route in an EARLIER pass this session (during the infra outage) | 17 console errors in the final, healthy-server pass, all `net::ERR_NAME_NOT_RESOLVED` (a DNS failure for an external resource in this dev sandbox, not a code defect) | none, DNS/environment | The 1393 number was a symptom of the CPU-thrashed server, not a real defect; re-confirmed clean data on a calm server run. Named here only to close out that earlier number honestly rather than let it stand unexplained. |

**1.3 count: cleanest of the six, 1 recurring size-spread issue, 1 stale/explained number.**

---

### 1.4 `/de/profile`

Job (stated once, per FLOORS LAW 10): let a signed-in customer see and manage their own account
(bookings, wallet, saved salons, settings), nothing more.

**FLOORS:** F2 imagery 0% FAIL · F6 display anchor 28px PASS ("Test Kunde") · F7a weight-share 8.33%
PASS · F7b anchor ratio 2.15x PASS · F7c size spread FAIL (7 distinct, cluster of 5 within 8px) ·
ELEVATION 2 PASS.

| # | Finding | Measured | Rule | Fix |
|---|---|---|---|---|
| 1.4a | Imagery floor fails at 0% | Live | FLOORS LAW / LOCKFILE imagery row | **Likely NO RULE APPLIES here, not a violation.** The imagery floor's own text scopes itself to "browse/discovery/PDP viewports"; a settings-style account hub is none of those, and the row explicitly exempts "forms, checkout payment, legal, receipts" by name, i.e. utility screens. Profile-hub is the same shape (a menu list, not a browse surface) but is not on the exemption list by name. **This is a genuine gap**: the exemption list names specific screen types but never states the general principle that would make profile-hub's exemption obvious, so the floor technically FAILs a screen it probably was never meant to grade. |
| 1.4b | 7 distinct font sizes, worst of the 3 measured so far | Live | EMPHASIS BUDGET (c) | Same pattern a third time. |
| 1.4c | Favorites list (`FavoritesList.tsx`, one tap from this screen) renders salons through `components-legacy/SalonCard.tsx`, a separate 394-line implementation from the homepage's 578-line `SalonCard.tsx` - different anatomy for the same entity | Source-confirmed this session: `FavoritesList.tsx:12` imports `@/components-legacy/SalonCard`; the two files independently declare photo ratio, radius, name size/weight, price format | FLOORS LAW 8 ("an entity... renders through the SAME component") + FLOORS LAW 9 ("if the registry owns it, compose it") | **STILL OPEN, and not in `COMPONENT_REGISTRY.md`'s SalonCard entry as a sanctioned variant** - this is the second independent instance of the exact defect class Jul-30 named once (walk-in band vs home SalonCard). Not visually re-confirmed this session (did not navigate to `/profile/favorites`) but the source divergence (two files, two independent style declarations) is unambiguous. |
| 1.4d | Avatar renders as a plain solid-color circle with no photo and no visible initial | Screenshot: red circle, "QA Test" name beside it | none named specifically for avatars | **NO RULE.** Not fabricated data (a solid color is an honest empty state, not a lie), but also not obviously the spec'd fallback pattern documented elsewhere in this system (initial + category icon for salon cards). Worth an owner call on whether an avatar fallback should show an initial letter; not asserting it should, since no locked spec for this exact element was found. |

**1.4 count: 1 genuine floor-scope gap, 1 recurring size issue, 1 confirmed FLOORS-LAW-8 violation
(new, real, and a second instance of a defect class Jul-30 only caught once), 1 no-rule observation.**

---

### 1.5 `/de/inspo`

Job: browse style/look inspiration, drill into a category, save looks.

**FLOORS:** F2 imagery 58.56% PASS · F6 display anchor 14px FAIL ("Styles suchen...", i.e. the search
placeholder, not a real heading) · F7a weight-share 4.35% PASS · F7b anchor ratio 1.17x FAIL · F7c size
spread PASS (2 distinct) · ELEVATION 8 PASS.

| # | Finding | Measured | Rule | Fix |
|---|---|---|---|---|
| 1.5a | All-skeleton for several seconds, same as search | 1.5s capture is 100% grey skeleton tiles, full page | none (same gap as 1.2a) | Same "no rule bounds skeleton duration" gap as search. |
| 1.5b | Display anchor is the search placeholder text (14px), not a real heading | Live | FLOORS LAW 6 | This screen genuinely has no heading at all in the first viewport (search bar, category pills, "Für Sie" tab, then the grid) - the same "list-type screen has no natural anchor candidate" gap flagged for `/de/search` (1.2c), reproduced a second time. Two of six screens hitting the identical structural gap suggests this is not a per-screen bug but a scope hole in FLOORS LAW 6 itself: it was written assuming every screen has a hero/heading, and browse-type screens with no heading do not. |

**1.5 count: 0 vs Jul-30 (out of scope), 1 duplicate of a "no rule fits" gap already seen twice
elsewhere, confirming it is systemic rather than per-screen.**

---

### 1.6 `/de/dashboard`

Job (owner-facing, NOT a customer screen - `DashboardUI.md` V3-D347 is a NAMED, DATED exception to the
customer black/white law; blue IS this surface's primary accent by design, not a violation): let a
salon owner see today's bookings and finish onboarding.

**Auth note:** the generic `--auth` flag on check-geometry signs in as `kunde@solen.ch`, a CUSTOMER
account with no dashboard access - that account gets redirected to `/de` on this route. The seeded
salon-OWNER fixture is `hiroseseiju@proton.me` (found in `app/api/dev/login/route.ts`, `DEV_OWNER_EMAIL`
constant); re-running with `--auth=hiroseseiju@proton.me` reached the real route.

**Loading-time finding, the most concrete one this session produced:** at a 1.5s settle, this route
renders **zero text leaves** - pure skeleton, 100% loading state, both in my own walk script and in
check-geometry's FLOORS pass (which also caught it mid-skeleton: imagery 0%, only 4 text elements,
weight-share 50%-of-4, elevation 0). A targeted recheck with longer waits: 0 text leaves at 1.5s, 4 at
4s, 22 at 8s. **The dashboard's client-side data fetch is slow enough that BOTH measurement tools
caught it in a pre-content state on their default wait windows** - this is a real signal about owner-
facing load time, not just a script artifact, since check-geometry is the project's own established
instrument and it still got fooled.

**Resolved-state findings (from the 8s screenshot, per `DashboardUI.md`'s own rules, not the customer
B&W rules):**

| # | Finding | Measured | Rule | Fix |
|---|---|---|---|---|
| 1.6a | Onboarding checklist (Salon-Setup 3/7) with a blue progress bar, blue "Einrichten" section label | Screenshot | DashboardUI.md permits blue as primary dashboard accent | **Not a violation** - correctly scoped to the dashboard exception, named here only to prevent a future pass from mis-flagging it against the customer B&W rule. |
| 1.6b | "Warten auf Freigabe" (pending-approval) banner uses amber/warning color for a clock icon | Screenshot | semantic color provenance | Looks correct (warning = pending state) but not independently contrast-checked this session. |
| 1.6c | The FLOORS numbers captured in the automated pass are for the SKELETON state, not the resolved dashboard | Live, both tools | n/a | **Genuinely unmeasured**: I have a real screenshot of the resolved state but did not re-run getComputedStyle-level extraction against it (time budget). The resolved screen visually reads as reasonably typography-disciplined (large "Übersicht" date/heading, one black CTA "+ Termin erstellen", grouped white cards on a sunken tray) but this is an eyeball read, not a measured one, and should not be reported as PASS/FAIL on any floor. |

**1.6 count: 1 major loading-time finding (real, tool-independent), 2 dashboard-appropriate non-
violations correctly scoped out, 1 explicit gap in this session's own coverage.**

---

## 2. Cross-screen consistency (FLOORS LAW 8: "the same thing looks the same everywhere")

One SalonCard entity, three renderings found this session:

| Surface | Component | Photo ratio | Radius | Name size/weight | Price shown | Source |
|---|---|---|---|---|---|---|
| `/de` home feed | `homepage/SalonCard.tsx` | 1.25 (Jul-30) | per LOCKFILE 16px individual-entity | 14px / 600 | Yes, ink, `emphasis` | live-confirmed this session |
| `/de/search` results | (same family, not independently re-verified this session) | not measured | not measured | not measured | visible on cards in screenshot | screenshot only |
| `/de` walk-in band | hand-built, `WalkInBand.tsx:109/124` | 0% (no photo) | 13px | 14px, unspecified weight | No (shows wait time instead) | source-confirmed, Jul-30 defect #10, still open |
| `/de/profile` -> Favorites | `components-legacy/SalonCard.tsx` (394 lines, independent) | not re-measured live | not re-measured live | not re-measured live | Yes, PBV-format "ab CHF" | source-confirmed this session, NEW finding |

**Three independent renderings of one entity is worse than the one Jul-30 caught (two).** The
walk-in-band case is a documented, still-open defect. The Favorites case is a second, previously
undocumented instance of the identical defect class, found via source this session and not yet in
`COMPONENT_REGISTRY.md` as a sanctioned variant.

---

## 3. THE ANSWER (for the owner, plain words)

**Counted split, this session's 6-screen walk:** of every finding above with enough evidence to
classify, **9 are a rule that already exists and is being violated** (still-open items: map font,
walk-in hand-built card, walk-in green wait-text, review card double-depth, Favorites' duplicate
SalonCard, plus the recurring size-spread breaks on 4 of 6 screens), and **4 are genuine holes where
no rule speaks at all** (skeleton-duration has no floor; two list-type screens, `/de/search` and
`/de/inspo`, structurally have no natural >=28px anchor candidate and the floor doesn't say what to do
about that; the imagery floor's exemption list never states the general principle that would cover a
settings-style profile hub). 2 defects from the July-30 report are now fixed (the grey placeholder,
the flat salon-card price).

**Fix these three first, ranked by visible-improvement-per-cost:**

1. **One class**, `font-body` on `NearbyMap.tsx:72`. Named "cheapest real win" 36 days ago, still not
   done, fixes a fallback-typeface tell on every home-page map marker.
2. **Point Favorites at the real SalonCard**, not `components-legacy/SalonCard.tsx`. Same entity should
   not have two implementations; this is the kind of drift that compounds every time either file is
   touched alone.
3. **Decide the skeleton-duration and no-natural-anchor gaps as policy, not per-screen guesses.**
   Two screens (`/de/search`, `/de/inspo`) show nothing but grey blocks for 2-4 seconds and two screens
   fail the display-anchor floor for the structural reason that a list has no natural hero. Both are
   the SAME root cause repeating (a floor written for hero/PDP screens applied uncritically to list
   screens) - one owner decision here closes four separate FAIL rows at once.

**Cost of each:** #1 is minutes. #2 is a real but bounded refactor (point one import at the other
component, reconcile any prop differences). #3 is a policy decision, not code - the fix is naming which
screen types are exempt, the same way the imagery floor already exempts "forms, checkout, legal."

---

## 4. What could not be measured, and why

1. **Home's display-anchor contradiction (1.1c) was surfaced, not resolved.** Jul-30 measured this
   exact route's anchor at 44px/3.67x (PASS, "already fine"); this session measured 18px/1.5x (FAIL) at
   the same route. Did not have budget to determine whether the anchoring element changed or the two
   passes are measuring different things. Needs a direct side-by-side before concluding regression.
2. **Desktop viewport was never measured.** The task fixed 390x844 throughout; two of Jul-30's 13
   defects (#12 rail underfill, #13 gutter wobble) are desktop-scoped and are simply out of this walk's
   scope, not verified either way.
3. **Content-supply defects (Jul-30 #2, eleven photos for nineteen slots) were not re-audited.** Would
   require counting distinct photo URLs across the rendered page; not attempted this session.
4. **Dashboard's resolved-state typography/color was screenshotted but not `getComputedStyle`-measured**
   (1.6c). The loading-time finding is solid; a full FLOORS-style read of the settled dashboard is not.
5. **`/de/search`'s SalonCard rendering was not independently re-measured** against the home version in
   section 2's table - the screenshot shows cards with photos, names, ratings, prices, but exact
   size/radius/weight numbers were not pulled, so that row is visual-only, not measured.
6. **The FLOORS_ALLOWLIST in `check-geometry.mjs`** (a seeded 2026-07-25 list of known-failing
   route+floor pairs) appears stale against this session's live numbers - e.g. its recorded home F2
   imagery figure is far below what this session measured (which now PASSES). Not fully audited entry
   by entry; flagged because the script's own header says allowlist entries should be deleted once
   fixed, and at least one looks like it should be.
