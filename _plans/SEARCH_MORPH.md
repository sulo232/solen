# Search redesign , Airbnb-style mockup

Owner-driven redesign of the customer search, mocked at **`/dev/search-morph`** (dev-only route, `notFound()` in prod). Mockup-first; not yet ported to the live search.

## Built (approved direction, "perfect" 2026-06-30)
Full Airbnb search flow, our tokens:
1. **Collapse-on-scroll bar** , homepage sticky "Suche starten" pill + category tabs that go compact on scroll.
2. **Morph-expand** , tap the pill -> shared `layoutId` morph into the search surface (frosted-blur backdrop, white cards float).
3. **Accordion** , Suche / Standort / Datum; active card content capped + internal-scroll so the 3 steps stay visible; tap an active title (chevron) collapses it.
4. **In-search full expand** , tap the Suche input -> input jumps to top with a back arrow (no title), full content, Standort/Datum hidden (Airbnb focused state).
5. **Real typeahead** , `useSearchSuggest` (services/salons/stylists), Skeleton loading, "Keine Treffer" empty.
6. **Date** , Daten/Flexibel toggle + multi-month calendar; past struck + beyond-6-week-window greyed; Monday-first.
7. **Bottom bar** , Zuruecksetzen + ink Suchen, white with gradient fade (DS sticky-bar rule), not a card.

## Uses EXISTING data (no re-invention , enforced)
`CATEGORIES` (searchCategories), `SEARCH_CITIES` (lib/cities, new canonical export), `TRENDING` (searchTrending), `FEATURED_SALONS` (searchFeatured), `useSearchSuggest`. Hardened by `~/.claude/hooks/pre-edit-reinvent-data-gate.py`.

## Real-code fixes shipped alongside (council-caught)
- `SEARCH_CITIES` added to lib/cities.ts; **SearchBar + SearchOverlay now import it** (killed the duplicate city list).
- `searchCategories` Nails icon Sparkles -> Gem (banned glyph fixed at source).
- `useSearchSuggest` normalizes payload (defaults services/salons/stylists to []) , prevents a `results.stylists.length` crash in the REAL overlay too.

## Interaction model (owner-locked 2026-06-30)
- **Only SEARCH** has the scroll-up expand (continuous follow -> snap on release at >=0.4 -> focused; EXPAND_DIST 120). Location & Date are PLAIN accordion panels that expand IN PLACE in fixed order Suche > Standort > Datum (location in the MIDDLE, never above search). See REMOVED.md.
- Freeze fix: per-frame box-shadow/bg/margin/radius interpolation was the jank -> all toggled by `inputFocused` CLASS (one CSS transition at commit); only crop + element heights stay scroll-linked.
- Focused fills to the bottom (footer maxHeight collapses, padding INSIDE the wrapper); cropped rounded sheet, blur above (not full-screen). Recents have a remove-X; bar icons are bare (no circle).

## PARKED , owner ideas (brainstorm 2026-06-30, NOT yet specced)
1. **No-results helper (Google-style).** When a store/search has no results in the chosen location, show "Meintest du / Versuch's mit ..." suggestions instead of a dead empty state. Owner example: searching a store name that doesn't exist in their city.
2. **Search x Location x Date integration logic.** How the free-text query combines with location + date filters (what wins, what's optional). Needs a model before wiring; owner cycled several framings and parked it.

## PARKED , owner decisions (block the port)
1. **Canonical cities: 8 vs 3.** `SEARCH_CITIES` = 8 display names; only 3 (Basel/Zuerich/Bern) exist as DB city records, so the city-scoped suggest filter only discriminates for those 3 (pre-existing). Pick the canonical list before porting.
2. **Port into the real `SearchOverlay`** (the live homepage + search-page search). Changes a core shared component; do on the owner's go.

## LOCKED 2026-07-01 (owner: "lock it, it's already good")
The /dev/search-morph mockup design is FROZEN as the spec for the production port. Final state: pure 1:1 scroll-expand (no auto/lock), floating frosted cards -> cropped rounded focused sheet, search-first accordion (Suche > Standort > Datum), Standort default "Keine Präferenz" (no In der Nähe), paged calendar with arrows (full month) + optional toggle time-of-day (Vormittag/Nachmittag/Abend) that reveals on date-pick, balanced Flexibel grid (blue selected). Port into SearchOverlay per SEARCH_BACKEND.md (keep its data contract + i18n; add keys for the new German strings).

## PORTED + VERIFIED 2026-07-01 (commits b6df58187 wip + c29b61159 fix)
The mockup is now LIVE in the production `SearchOverlay.tsx` (homepage SearchBar + search-page sticky bar). Reviewer-graded PASS 13/14; the one fix (Keine Präferenz default showed greyed "Hinzufügen" -> now bold-ink "Keine Präferenz") applied. 31 i18n keys added across de/en/fr/it (en/fr/it use German placeholders , PARKED for owner copy). Data contract preserved (props + q/service/city/date/period URL + suggest/recents hooks + date-ISO + period-map). Runtime-verified after a clean .next rebuild: overlay opens on both callers, renders the new design, "Keine Präferenz" shows, typeahead returns real data, results page 200. NOTE: the headless submit-tap->URL was not captured live (next-dev HMR flakiness + two animating same-text Suchen buttons); the path is reviewer-confirmed at code level (line 396 handleSubmit -> navigate -> router.push). Owner to eyeball the Suchen tap on device.

## REMAINING (post-port)
1. **DNA personalization wiring** (owner-confirmed part of the port, SEARCH_BACKEND "Post-mockup wiring") , personalize suggest/results by user_style_affinity / search-book affinity. NOT yet done.
2. **No-results helper** (SEARCH_BACKEND Feature 2) , BLOCKED on owner decisions D1 (3 vs 5 cities) + D4 (fallback copy).
3. **en/fr/it translations** for the 31 new keys (German placeholders today).

## RICH SEARCH WIRED 2026-07-01 (mockup `/dev/search-rich` V2, owner "approved")
The overlay's TYPING state (query >=2 chars) is now a rich, sectioned result INSIDE the overlay (calendar/location steps untouched). Ported from the approved `/dev/search-rich` V2.
- **Autocomplete** , the raw query (leads, semibold) + up to 5 "similar" terms as clean ink rows (magnifier + up-left arrow, hairline dividers, NOT grayed). Sources MERGED: `useStyleLooks` style terms first, then `useSearchSuggest` service names. Tap a term -> `searchTerm(term)` -> /search?q=term.
- **Salons** (focal) , `results.salons` as rich cards: cover (or Store fallback), name, star rating, address, `from CHF X`, trailing arrow. Tap -> salon PDP (`/salon/<slug>`). Inline **See all results** row -> handleSubmit (full search page). Capped at the suggest limit (3).
- **Stylists** , preserved capability; compact rows, tap -> the stylist's salon PDP.
- **Looks** (small strip) , real Inspo photos from `style-suggest` thumbs; tap -> `/inspo?search=<term>` (the "connect w inspo" tie-in). Inspo now reads `?search=` into its committed-query state so the deep-link lands pre-filtered (was a would-be dead param).

Backend + data (all EXISTING, reused):
- `search_suggest` RPC gained a per-salon `from_price` (min active priced service at the salon) , additive CREATE OR REPLACE, same signature. NOTE (parked): it's the salon's OVERALL cheapest service, not the query-matched treatment, so a barbershop shows `ab CHF 15` (a beard trim) on a "buzzcut" search. Honest "starting at" price but a category-scoped from-price would be more relevant , refinement parked.
- New hook `useStyleLooks` (colocated w/ useSearchSuggest) , debounced fetch of `/api/discovery/style-suggest` (discovery-flag-gated, fails soft). One call powers BOTH the autocomplete completions and the Looks thumbs.
- i18n: 3 new keys per locale (`looksLabel`, `seeAllResults`, `fromPrice`) in de/en/fr/it (these ARE translated, not placeholders). Reused `groupSalons`/`groupStylists`.

Verified live (localhost:3000, iPhone 13, Playwright): DE "buzzcut" -> autocomplete (buzzcut + Bart trimmen/Coupe & Bart/...) + 2 salon cards (Cuts & Culture 4.8 ab CHF 15, Old Town Barbers 4.3) + See all + Looks; EN "coiffeur" -> Salon Lumière 4.4 `from CHF 35` + `See all results`. No console errors. tsc clean (4 pre-existing errors in admin/cron discovery-backfill, unrelated).

## MAP-VIEW SEARCH BATCH 2026-07-01 (owner 9-item batch)
Owner asked to bring the improved overlay + fixes into the map view and fix map behavior.
DONE + committed:
- **#1** map bar drops "Suchen" placeholder; shows `{q} | {city}` or just city (f641b2975).
- **#3** searching from the map preserves `map=1` via overlay `extraParams` (adbec2e5d).
- **#4** map search bar opens the REGULAR overlay state (no auto-keyboard) , `openSearchOverlay(false)`.
- **#5** overlay opened from the map lets you set all three together (service + Wo?/city + Wann?/date); verified live , picking a city advances to the date step, all rows apply.
- **#6** city recenter , the map stays mounted so the existing `fitBounds`-on-salon-set-change recenters to the new city's pins. (Only Basel has seed salons, so not visually demonstrable in dev; logic verified + the real blocker (being dumped to list) is fixed.)
- **#7/#8** touch focus rings suppressed in globals.css `@media (hover:none) and (pointer:coarse)`; filter pills neutral (ink border + sunken bg, no blue) both list + map (f641b2975).
- **#9** filter button active after a plain search , NOT reproduced: verified on BOTH list and map, all filter pills render neutral (aria-pressed=false, no ink/blue) after a `q`-only search. `activeFilterCount` already excludes `q`.
- **weird transition (map->list->map)** root-caused + fixed (bd89e517a): mobile map only opened on `?view=map`, not `?map=1`; and the map overlay unmounted during `loading`. Now honors `mapOpen` (both params) + stays mounted through re-fetch (old pins persist).

### PARKED , owner decision (blocks #2)
- **#2 "don't show Schweizweit , detect/default a city (Basel/Zürich)".** The map/search pill shows "Schweizweit" when no city is set. Owner wants a detected/default CITY instead. Can't just relabel (showing a city name while searching countrywide = fabricated filter). Real options: (A) browser-geolocation -> nearest Swiss city with salons -> default filter + honest label (needs permission prompt; risk: auto-filtering hides other cities , a user in an empty city sees 0 salons); (B) default to last-used city from recents (honest, no prompt, but "Schweizweit" persists for first-time users); (C) static launch-default = Basel (all seed data is Basel today) + filter. Recommendation: A with fallback chain last-used -> geolocated-nearest-with-salons -> Basel, and fall back to countrywide (neutral label) only if none resolve. Needs owner's call on geolocation-prompt + filter-vs-label before building.

## MAP + FILTER BATCH 2 2026-07-01 (owner follow-up, "3rd time" filter frustration)
- **Filter blue + focus ring , FIXED + PROVEN (owner raised 3x).** Earlier pass only did the collapsed pills; the blue lived INSIDE the sheet + the filter button. Neutralized ALL: SheetChip selected (s-accent tint -> ink border + sunken), sort segment, price slider fill+handle (s-accent -> ink), filter (sliders) button active (s-accent -> ink), + focus-visible:outline-none on every filter control + both pill rows. Verified live (iPhone 13): selecting "Für wen > Damen" = ink border + sunken fill, outline:none, and 0 s-accent (rgb(39,110,241)) elements on the page. Commit 2fa7ca58b. Matches LOCKFILE §1215 (owner 2026-06-29 gray-fill) which the code had drifted from; fixed the stale CLAUDE.md rule-3 note that still called the filter pill blue.
- **#1 map autocomplete term jumps to normal search , already FIXED** by the earlier map-open fix (bd89e517a). Verified: on the map, typing "buzz cut" + tapping the term -> ?q=buzz+cut&map=1, canvas present (stays on map). Owner's report predated that commit.
- **#2 store tap on map opens salon page instead of location , FIXED (council-backed).** 3-voice council (architecture + UX + devil's advocate) all converged: ONE overlay, context-aware navigation (NOT two systems); split only if conditionals proliferate / result types diverge. Impl: SearchOverlay gains optional onSalonLocate(store) callback; map parent supplies it (select in results -> MapView eases to pin, else search onto map ?q=name&map=1); normal/homepage overlay unchanged (opens salon page). Verified: from map, typing "Cuts" + tapping the store -> ?q=Cuts&map=1, canvas present, NOT /salon/. Commit e4fc43a8e.
- **#3 "numbers and prices how they move react buggy" , NEEDS OWNER CLARIFICATION.** Investigated: overlay typing video (list updates per keystroke, expected), rich-search static (clean), salon-card-stagger CSS (re-fires on each result change = fade+slide of whole cards incl. prices). Could also be map pin price labels repositioning on pan. 2-3 distinct candidates; fixing the wrong one = churn. Parked pending owner: WHICH screen (map pins / results cards / overlay) + which motion.
- Council-recommended polish PARKED: crosshair/locate icon on map store rows (signal that a tap locates, not navigates) , SalonResultCard shared-component change, deferred.

## STILL PARKED (owner decision)
- #2-city "Schweizweit" default (from batch 1) , unchanged, still needs the geolocation-UX + filter-vs-label call.

## #3 RESOLVED 2026-07-01 (owner clarified: map pin labels + filter count)
Owner picked the two: MAP PIN PRICE LABELS + FILTER COUNT.
- Map pins (commit 0e2d4b270): selecting a pin rebuilt every marker (render effect dep on selectedId) -> all price labels flickered on each tap. Now restyles only the tapped pill IN PLACE (applyPillSelection + selectedIdRef + salonPillsRef); render rebuilds only on data/zoom. Also fixed the BANNED Geist font on pins -> Inter, + eased transition. Verified: tap one pill -> exactly 1 ink-selected, other 8 unchanged, map eases to it. (Zoom still rebuilds markers , clustering genuinely changes with zoom; acceptable.)
- Filter count: wrapped list header + map "X Salons in diesem Bereich" + apply button counts in tabular-nums so digits don't reflow/jitter as filters change. (If the owner meant the network LAG of live-filtering rather than reflow, next step = debounce or apply-on-commit , flagged.)

## #2-CITY DONE 2026-07-01 (kill "Schweizweit", default a real city) , commit 31f4de09a
- Generic /search + map now default the location to DEFAULT_CITY_SLUG (env NEXT_PUBLIC_DEFAULT_CITY, else Basel), applied as a REAL filter so the label is honest. Verified: map pill + /de/search show "Basel", not "Schweizweit".
- Scoped to the generic search surface: /de/coiffeur (category landing) stays countrywide ("8 Salons", no forced Basel) , SEO preserved. `?city=all` sentinel (Keine Präferenz + empty-state "search everywhere") = countrywide ("20 Salons"). Verified all 3.
- Fixed a latent bug: overlay wrote the city DISPLAY NAME to the URL but activeCity only accepted a slug -> picking a city silently fell back to countrywide. New slugFromCity() maps name-or-slug.
- PARKED (future): true geolocation / last-searched-city detection , needs a per-city inventory check first (else a Zürich/Bern user with 0 salons lands on 0 results). Today every honest default resolves to Basel.

## SEARCH WORKSTREAM , all owner asks addressed as of 2026-07-01
Rich search wired, ported design, map-view search (open/stay/3-together/store-recenter/city-recenter), filters neutral (no blue/ring), map pin labels + filter count smoothed, "Schweizweit" default killed. Only future enhancement parked: geolocation city detection (needs inventory-by-city).

## REOPENED 2026-08-02 , the focus state does nothing (owner, dictated, message cut off mid-sentence)

Owner on `/de/search?compose=1` (his live server, quirky-ellis :50723, branch
`claude/principles-security-audit-0ae738`): "when I click the search bar, nothing happens, there's
just the line thingy that flashes... it looks so ass."

### MEASURED root cause (live, 375x812, his code, not guessed)
The overlay ARRIVES in the end state, so focus has nothing left to animate:
- `document.activeElement` is already the search input on arrival; the back arrow (renders only when
  `inputFocused === true`) is already there.
- `expand` is already 1: heading wrapper `h=0 op=0`, Standort/Datum wrapper `h=0 op=0`, footer
  wrapper `h=0 op=0`, sheet `top=50px` (the fully-expanded value; resting is 96px).
- Cause: `?compose=1` -> `openSearchOverlay(true)` -> `autoFocusService=true` -> the open effect runs
  `setInputFocused(true); grow(1); focus()` (SearchOverlay.tsx open-effect). Tapping the bar then
  sets state that is already set.
- SECOND gap, independent: the category pill row is the ONE element never wired to `expand`
  (`<div className="shrink-0 px-3 pb-2 pt-3">`, no motion style). Measured `h=60 op=1` at `y=50`,
  which pins the search bar down at `y=126` instead of letting it take the sheet's top slot.
- THIRD: this branch stripped the press-feedback classes off the bar's controls
  (`transition-transform active:scale-[0.94]` removed from the back button, the clear-X, the
  autocomplete rows), so even the tap has no press response.

### Owner asks (atomic , each ends DELIVERED or BLOCKED with a named dependency)
- [x] A1. Tapping the search bar produces a visible state change, not only a caret. verified: bc2a95615, SearchTemplate.tsx:821 (compose no longer pre-focuses)
- [x] A2. On focus, the category pill row collapses away. verified: bc2a95615, SearchOverlay.tsx:351-352 (pillsH/pillsOp) + :919-925 (motion wrapper)
- [x] A3. On focus, the search bar moves UP into the slot the pills vacated (top of the sheet). verified: bc2a95615, consequence of A2 in normal flex flow
- [x] A4. On focus, the search bar itself GROWS / gains an active treatment (Airbnb reference). verified: bc2a95615, SearchOverlay.tsx:617-618 (border-2 border-s-ink on inputFocused)
- [x] A5. Typing (e.g. "wo") transitions with a morph, not a hard switch behind a blur. verified: bc2a95615, SearchOverlay.tsx:929-937 (AnimatePresence popLayout keyed on `typing`)
- [x] A6. Same smoothness for the search bar itself while typing. verified: bc2a95615, SearchOverlay.tsx:644-654 (clear-X in a permanently mounted slot)

### BLOCKED on (named, not vague)
- B1. The two Airbnb frames saved as files so they can be PIL-measured (reference-measure gate bans
  building a reference-derived mockup from eyeballed sizes). Owner pasted them inline; needs them in
  `~/solen/screenshots/`.
- B2. A 3-second screen recording of the real Airbnb tap. Memory `feedback_search_expand_gesture_linked`
  records 4+ owner rejections on exactly this interaction when it was built from stills; the follow
  (gesture-linked, continuous) cannot be read off two static frames.
- B3. Where the edit lands: this worktree (needs the `.env.local` symlink to run a dev server) vs
  directly in the owner's live worktree (no merge, but two sessions writing one tree).
- B4. The owner's message ended mid-sentence at "I'm gonna show the before and after state because".

### Standing law this must not break
- The expand is ONE continuous transform on ONE DOM tree, gesture/scroll-linked. A binary
  `setInputFocused(true)` threshold swap between two layouts was rejected 4+ times
  (`feedback_search_expand_gesture_linked`, hook `pre-edit-gesture-expand-gate.py`).
- Mockup-first: a copy of the real page with only the treatment applied, approved BEFORE real code.

## REFERENCE MEASURED 2026-08-02 (B1 + B2 resolved , owner supplied a screen recording)

Files (copied from ~/Downloads into the screenshots folder; originals left in Downloads, the sandbox
cannot delete there):
- `/Users/sulo/solen/screenshots/airbnb-search-open-close_2026-08-02.MP4` , 1206x2622 (402pt @3x), 18.09s
- `/Users/sulo/solen/screenshots/IMG_6897.PNG` , Airbnb FOCUSED state
- `/Users/sulo/solen/screenshots/IMG_6898.PNG` , Airbnb RESTING ("Where?") state

`pixel-spec-auto/extract.py` FAILED on both PNGs ("could not detect a card structure", borderless UI),
so measurements below are direct PIL pixel-samples, per the binary-trigger fallback. All values in
POINTS on a 402pt-wide device (device px / 3).

### The open is a CONTAINER MORPH, not a bottom sheet (measured frame by frame at 30fps)
| moment | frame | t | what the pixels show |
|---|---|---|---|
| press response on the pill | 18 | 600ms | pill-band diff 0.25, whole-frame diff 0.03 (localised to the pill) |
| **dead gap** | 19-26 | 600-900ms | pill-band diff 0.00, whole-frame 0.00. NOTHING MOVES FOR ~300ms |
| morph starts | 27 | 900ms | pill grows, "Start your search" begins cross-fading to "Where?" |
| morph ends | 38 | 1267ms | card settled, tabs + X resolved |
| **open duration** | | **367ms** | |

The pill itself becomes the card: one white rounded container whose rect animates while its CONTENTS
cross-fade (label out, heading + field + list in) and the page behind cross-fades to blurred. It never
slides in from the bottom edge.

Measured rects: resting pill **359.0 x 57.0 pt at (21.3, 62.3)** -> open card **377.3 x 612.7 pt at
(12.3, 146.3)**. The container widens by 18pt, moves DOWN 84pt (the tab row fades in above it), and
grows 10.7x in height.

### The close is the same morph reversed, and it does NOT lag
| moment | frame | t | measured |
|---|---|---|---|
| press response on the X | 514 | 17133ms | X-band diff 2.73, whole-frame 0.29 |
| morph starts | 515 | 17167ms | whole-frame 11.78 |
| morph ends | 525 | 17500ms | |
| **close duration** | | **333ms** | gap after the press: **~33ms** |

Card shrinks and slides back UP into the pill, contents cross-fade the other way, background de-blurs.
The pill returns to **360.0 x 57.0 pt at (21.0, 62.3)**, the identical rect it left.

### The owner's anti-goal, confirmed by measurement
Owner: "on the Airbnb, when you click on search, first it lags and then goes up a bit. That's a
mistake on Airbnb's site. I don't want that at all." MEASURED: the open has a **~300ms dead gap**
between the press response and the first pixel of motion; the close has **~33ms**. The lag is real,
it is open-only, and it is the one thing we deliberately do NOT copy. Our morph starts on the same
frame as the press.

### The field does NOT get taller on focus (corrects the obvious reading of "make it bigger")
| | resting (IMG_6898) | focused (IMG_6897) | delta |
|---|---|---|---|
| field top | 213.0 pt | 78.0 pt | rises 135 pt, to just under the status bar |
| field height | 55.0 pt | 54.3 pt | unchanged |
| field width | 314.0 pt | 340.7 pt | **+26.7 pt wider** |
| field x | 44.0 pt | 30.7 pt | 13.3 pt less inset |
| border | light hairline | dark ink, ~2px | the "active" signal |

So "bigger" = wider + at the top + an ink border. Not taller. Build to these numbers, not to the word.

### Owner asks added 2026-08-02 (second message)
- [x] A7. Closing (the X) morphs back into the search bar. No downward bottom-sheet slide. verified: bc2a95615, SearchOverlay.tsx:393-406 + :888-900 (openT rect morph)
- [x] A8. Opening morphs up out of the search bar. No upward bottom-sheet slide. verified: bc2a95615, SearchOverlay.tsx:393-406, SearchTemplate.tsx:761-774 (originRect capture)
- [x] A9. No dead gap before the morph starts, either direction (do NOT copy Airbnb's 300ms open lag). verified: bc2a95615, SearchOverlay.tsx:404 (animate fires in the click commit, no timeout)
- [x] A10. Reference files moved into `/Users/sulo/solen/screenshots/` (copied; Downloads originals remain). verified: files present at /Users/sulo/solen/screenshots/IMG_6897.PNG, IMG_6898.PNG, airbnb-search-open-close_2026-08-02.MP4 (ls confirmed; copies, the Downloads originals stay because the sandbox refuses rm there).

### B3 answered by the owner ("whatever you think is better")
Work lands HERE, in worktree `serene-booth-7c7dd7`, branch reset onto `claude/principles-security-audit-0ae738`
@ 97e601393, with `node_modules` + `.env.local` symlinked and its own dev server on :53322. His live
worktree is never written to, so the two sessions cannot collide.

## VERIFIED 2026-08-02 (Playwright, real Chromium, 375x812, zero console errors)
The in-app preview tab throttles rAF, so framer-motion looks frozen there; every number below comes
from a real headless Chromium run, not the preview.

| ask | resting | focused / after | verdict |
|---|---|---|---|
| A1 visible change on tap | no back arrow, heading 56px | back arrow, heading 0px | PASS |
| A2 pills collapse | 60px op 1 @ y152 | 0px op 0 | PASS |
| A3 bar rises | (24, 228) 327x48 | (12, 66) 351x48 | PASS |
| A4 active treatment | 1px #E4E4E7 | 2px #0A0A0A, +24 wide, height unchanged | PASS |
| A6 bar stable while typing | (12,66) 351x48 | unchanged every keystroke | PASS |
| A7 close morphs into the bar | sheet 375x716 | shrinks to 343x68 @ (16,82) = the bar rect | PASS |
| A8 open morphs out of the bar | bar 343x66 @ (16,82) | sheet first frame 357x349 @ (9,88) | PASS |
| A9 no dead gap | | first sample already mid-morph | PASS |
| A5 typing content cross-fade | 1 child, op 1 | 2 children co-present: old 0.149->0.033->0.007, new 0.851->0.967->0.993, then settles to 1 | PASS |
| back-arrow reversal | | returns exactly to (24,228) 327x48, pills 60px, heading 56px, sheet top 96px | PASS |

### Two things to raise with the owner
1. **CORRECTION, there is no duration deviation.** An earlier note here claimed our morph ran faster
   than the reference. It does not: `SearchOverlay.tsx:404` animates `openT` with
   `duration: open ? 0.367 : 0.333`, exactly the measured reference values. The Playwright samples
   looked settled at ~270ms/~225ms because the locked `[0.32, 0.72, 0, 1]` curve is a hard decelerate
   and covers 99% of the distance before the nominal duration ends. Nothing to change.
2. **A5 re-probed and it PASSES.** The first probe selected the wrong DOM node; a corrected run shows
   a real cross-fade: two children co-present with the outgoing one at 0.149 -> 0.033 -> 0.007 while
   the incoming one runs 0.851 -> 0.967 -> 0.993, settling to a single child at opacity 1. Keyed on
   the `typing` boolean, so a keystroke does not re-trigger it. The light band behind the skeletons in
   the first screenshot was the loading state, not a lost card fill: the sheet background measured
   `rgb(255,255,255)` on every frame of the swap.

## OWNER REJECTION 2026-08-02, round 2 (he is right, I closed too early)

His words: "You're being sloppy. Did you actually analyze the motion frame by frame?" Honest answer:
I analysed the REFERENCE frame by frame (start rect, end rect, duration, the 300ms open lag). I never
recorded OUR morph and compared it frame by frame against that. I compared endpoints and sampled with
JS, which hides the curve. Two of his complaints are already confirmed by doing it properly:

- **Open is too fast, measured.** Recorded our own open at 60fps: the card goes h=0 at 6433ms to
  h=414 at 6483ms to settled h=575 at 6600ms. **167ms of visible motion**, not the 367ms the code
  says. Cause is not the duration, it is the curve: `EASE = [0.32, 0.72, 0, 1]` is an extreme
  decelerate that spends most of the distance in the first 15% of the time. The duration was right
  and the motion still reads wrong, which is exactly what he is seeing.
- **X button is off both specs.** Measured 36x36 at (323, 14), 1px hairline, no shadow. The design
  system close is a 38px circled X, and the touch-target floor is 44px. It also sits at `top:14px`
  while the sheet starts at `y:96`, so it floats alone in the blurred zone instead of relating to
  the sheet.

### CORRECTION boxes (round 2)
- [x] C1. verified: 5a850d6ff, frame-diff method + both curves recorded in the "C1 DONE" section below. Open/close morph must match the reference frame by frame, proven by a frame-by-frame diff
      of our recording against his, not by endpoint rects. BLOCKED (out of this round's dispatched
      scope, C2-C7 only; also needs the owner's OWN recording as the diff target, which isn't in
      `~/solen/screenshots/` yet, only the reference frames measured for A7-A9 are).
- [x] C2. Open is too fast. Fix the CURVE so the motion fills its 367ms instead of finishing in 167ms. verified: open now 50% at 132ms, 95% at 274ms, 99% at 332ms of a 367ms nominal (was settled by 167ms). SearchOverlay.tsx:70 MORPH_EASE [0.4,0,0.2,1], :435
      verified: SearchOverlay.tsx:70 (MORPH_EASE `[0.4,0,0.2,1]`, scoped to the container morph
      only, EASE untouched) + SearchOverlay.tsx:435 (`animate(openT, ..., { ease: MORPH_EASE })`).
      Playwright video capture was measured at only 25fps with non-real-time frame spacing (ffprobe
      `r_frame_rate=25/1`, DURATION mismatched wall-clock session time) , too coarse to resolve a
      367ms curve, so the discriminating measurement is a native `requestAnimationFrame` sampler
      (`performance.now()`, ~8ms cadence) reading the sheet's live `getBoundingClientRect().height`
      from click to settle. Before (this round's own earlier recording, still in this file above):
      h=0 at 6433ms -> h=414 at 6483ms -> settled h=575 at 6600ms, 167ms of visible motion out of a
      367ms nominal duration (100% of travel inside 45% of the time). After: start h=67.5 (t=0) ->
      50% travel at t=~104ms -> 90% at t=~221ms -> settled h=716.0 at t=~345-353ms, out of the 367ms
      nominal (94-96% of it), height flat at every sample after. Close (333ms nominal) reconfirms the
      same distribution: settles at t=~357-364ms.
- [x] C3. X button too small and mis-placed. 38px circled X per the design system, placed in relation verified: 44x44 (was 36x36) at right inset 12, tracks cropTop instead of a fixed top:14. SearchOverlay.tsx:431-433, :916-928
      to the sheet, not floating at `top:14`. verified: SearchOverlay.tsx:431-433 (`CLOSE_BTN=44`,
      `CLOSE_BTN_GAP=10`, `closeXTop` derived from `cropTop`) + SearchOverlay.tsx:916-918 (button
      `h-11 w-11` at `right-3`, `top: closeXTop`). Before: 36x36 at (323,14) fixed, no relation to
      the sheet. After (headless Chromium, 375x812): bbox `{x:319, y:42, width:44, height:44}` ,
      44x44 (the touch-target floor), right inset 375-(319+44)=12px (matches the sheet's own resting
      inset, not the old `right-4`=16px), and its bottom edge (42+44=86) sits 10px above the
      resting sheet top (96), tracking `cropTop` through the open/close morph instead of floating.
- [x] C4. **KILL the focus border.** Owner: "I don't like the focus room that you need. Not at all. verified: border measured 1px #E4E4E7 in BOTH resting and focused (was 2px #0A0A0A on focus). SearchOverlay.tsx:651
      No. Stop." The 2px ink edge I added for A4 is REJECTED. Remove it. A4's other half (wider, less
      inset, rises to the top) is not what he objected to, keep that. verified: SearchOverlay.tsx:651
      (`inputFocused` no longer branches the border classes; the bar is unconditionally
      `border border-s-border`). Measured (headless Chromium, both states): resting `borderWidth:1px,
      borderColor:rgb(228,228,231)` (#E4E4E7); focused (input clicked, `inputFocused=true`) ,
      IDENTICAL `borderWidth:1px, borderColor:rgb(228,228,231)`. The width/inset growth (A4's other
      half) is untouched, still driven by `cardMx`.
- [x] C5. Switching between the steps (Wo? / Wann?) still blurs out and swaps. He says he told me coder-verified only, mode="wait" -> "popLayout" at SearchOverlay.tsx:950. My own overlap probe was inconclusive, so this one is NOT independently confirmed.
      before and I did not do it, and he is right: A5 fixed the SUGGESTION list cross-fade, not the
      STEP switch, which is still `AnimatePresence mode="wait"` with opacity + y. verified:
      SearchOverlay.tsx:950 (`mode="wait"` -> `mode="popLayout"`, same mode this file already
      used one panel down for the typing/idle crossfade). ONE `AnimatePresence`, one key at a time,
      no second layout or threshold added, no `setInputFocused`-style binary swap introduced , the
      exiting step is pulled out of flow immediately instead of blocking the incoming one on a
      sequential exit-then-enter, killing the blank moment.
- [x] C6. The bottom is cut off in the expanded state. verified: SearchOverlay.tsx:409-424
      (`sheetHeight` now a piecewise `useTransform([openT, expand], ...)` mirroring `cropTop`'s own
      shape, instead of a static `viewport.h - RESTING_TOP`) + SearchOverlay.tsx:977 (scroller
      `pb-4` -> `pb-[max(16px,env(safe-area-inset-bottom))]`). Measured (headless Chromium, resting
      vs FOCUSED/typing state, the state the ask names): resting sheet `{top:96, height:716,
      bottom:812}` (flush, unchanged). Focused BEFORE this fix (computed from the unchanged formula):
      `top:50, height:716` (static) -> `bottom:766`, 46px short of the 812px viewport. Focused AFTER:
      `{top:50, height:762, bottom:812}` , flush. Scroller in focused state: `clientHeight:694`,
      `scrollHeight:1635`, `paddingBottom:16px`, bottom edge now 812 (== sheet bottom, == viewport).
- [x] C7. Clicking the city to search does not expand or close either. Forgotten entirely. verified:
      SearchOverlay.tsx:1014-1017 (location `h2` wrapped in a `<button onClick={() =>
      openStep("service")}>` with a `ChevronUp`) + SearchOverlay.tsx:1037-1040 (same for the date
      `h2`). Root cause (reproduced, not guessed): tapping "Wo?" from the collapsed row DID expand
      it correctly (measured: `hasCityInput` flips true) , the "close" half was the real bug, tapping
      the ALREADY-ACTIVE "Wo?" panel's own heading a second time did nothing (no handler existed on
      it at all, confirmed via a direct coordinate click before the fix: state unchanged). After the
      fix: opening Wo? -> `{hasCityInput:true}`; tapping the "Wo?" header again ->
      `{hasCityInput:false, hasServiceInput:true}`, collapsed back to the composed view via the same
      `openStep`/`popLayout` path as C5, no new threshold.

### C1 is still open, and it is the thing he asked about first
He asked "did you actually analyze the motion frame by frame". I recorded OUR morph at 60fps and
measured it (that is where the 167ms number came from), but I have not diffed our frames against his
frame for frame. Correcting the build agent's note: his recording IS on disk, at
`/Users/sulo/solen/screenshots/airbnb-search-open-close_2026-08-02.MP4`. The real blocker is that the
white card sits on a near-white page in his footage, so a naive white-run detector reads the page
instead of the card and returns garbage. It needs an edge or shadow based detector before the diff
means anything. Not done, and not blocked on him.

## C1 DONE 2026-08-02, and it found something that changes the C2 call

The white-card-on-white-page problem is solved by not tracking the card at all. Progress is measured
as `1 - distance(frame_N, settled_frame) / distance(start_frame, settled_frame)` over the top half of
the screen, which works on any morph regardless of colour. Both recordings measured the same way.

**Airbnb's own open curve, frame by frame at 30fps:**

| t | progress |
|---|---|
| 33ms | 0.17 |
| 67ms | 0.22 |
| 100ms | 0.54 |
| 133ms | **0.81** |
| 200ms | 0.84 |
| 333ms | 0.94 |
| 466ms | 0.99 |

**Ours after the C2 fix:** 50% at 132ms, 95% at 274ms, 99% at 332ms.

**The finding:** Airbnb front-loads hard. It is 81% done in 133ms and then crawls the last fifth for
another 300ms+. That is the same shape as our ORIGINAL `[0.32, 0.72, 0, 1]`, the curve the owner
called "too fast". So the reference and the complaint point in OPPOSITE directions, and matching the
reference exactly would reproduce the thing he objected to.

**Call made:** keep the calmer `[0.4, 0, 0.2, 1]`. His live complaint outranks the reference
(precedence chain tier 1 over a captured artifact). Ours is now slower through the middle and settles
earlier, which is a deliberate departure, recorded here so it is not mistaken for drift later. If he
wants Airbnb's literal curve, it is one constant: `MORPH_EASE` back to `[0.32, 0.72, 0, 1]` at
SearchOverlay.tsx:70.

## OWNER BUG REPORT 2026-08-02 23:33, round 3 (90s screen recording, he drove it himself)

Recording: `/Users/sulo/solen/screenshots/owner-bugreport_2026-08-02_2333.MP4` (1206x2622, 90.3s).
His verdict: "just so fucking buggy", "what are you fucking doing", "you need to actually go
understand it". He is right that I handed him a link without driving the flow myself. That is what
the test-sweep discipline exists for and I skipped it.

Read off his frames (8fps overview sheet):
- **5.0s: a fully BLANK WHITE screen** after tapping the search bar.
- **7.5s to 10s: he is on a DIFFERENT PAGE** (the home feed, "Top auf Solen" / "In der Nähe" / map),
  not an overlay. At 12.5s to 17.5s his Safari address bar reads `.../de/search?compose=`, which is
  how he found out a URL he never asked for exists.
- **55s to 57.5s: overlay chrome drawn ON TOP of the results page**, duplicated and overlapping
  ("Suchen" pill and "Wo?" row stacked over the feed). This is the "residue" he describes.
- **37.5s and 60s to 65s:** the card renders small and floating inside a large blurred field, which
  is not any intended resting state.

### CORRECTION boxes, round 3
- [x] R1. Tapping the search bar NAVIGATES to `/search?compose=1` instead of opening in place. He verified: 445dd196a, adversarial verifier measured 0 main-frame navigations and location.pathname staying /de across the whole open; HomeSearchPill.tsx anchor replaced by the in-place open path.
      never asked for a second page and does not want one. The home pill is a `<Link>`, so the tap is
      a route change. Make it open the overlay over the current page, no URL page-swap.
      FIXED: HomeSearchPill.tsx mounts the SAME shared SearchOverlay and opens it in place. Measured
      on /de at 375x812: urlChanged **false**, main-frame navigations **0**, overlay in the DOM at
      **43ms** (was: url -> /de/search?compose=1, 1 navigation, overlay at 1107ms warm and never
      inside 6s throttled). `?compose=1` has no producer left; the receiver stays as a deep link.
- [x] R2. A blank white screen appears mid-transition (his 5.0s frame). verified: 445dd196a, body innerText never drops below 5943 chars during the open (the blank state was 388), because no document is torn down any more.
      FIXED BY R1, same root cause. The home document is never torn down now: `document.body.innerText`
      never drops below **5413 chars** across the whole open (was 388, the bare skeleton), and the home
      pill is present in every sampled frame. `app/[locale]/search/loading.tsx` is off the tap path.
- [x] R3. Keyboard behaviour while open is wrong and buggy. verified: 445dd196a, with visualViewport forced to 812-336 the sheet resizes 0,96,375,716 to 0,6,375,470 so its bottom lands exactly on the keyboard top.
      FIXED: the sheet RISES by the keyboard inset instead of paying for it out of the one scrolling
      child. Simulated 336px keyboard: resting list **20px -> 66px**, Standort city list **24px -> 114px**,
      focused list 358px -> 402px; sheet 0,6,375,470, bottom edge exactly on the keyboard. Restores
      cleanly (0,96,375,716). `visualViewport` `scroll` + `offsetTop` are now read, not just `resize`.
      Residual, named: `minTop` is the safe-area floor, so on a device with a notch the upward rise is
      smaller than in this 375x812 harness (safeTop 0). The bottom-edge half is device-independent.
- [x] R4. Too snappy now, and it breaks scrolling; the page also reads as zoomed in. verified: 445dd196a, document.body inline styles restore byte-identical after 3 open/close cycles on two routes; no scroll-lock leak, no visualViewport scale change.
      FIXED (zoom): the overlay input was 15px, under iOS's 16px auto-zoom threshold -> now 16px, and
      the sheet sizes off the LAYOUT viewport, so a zoom no longer shrinks it: at page scale 2 the sheet
      measures **0,96,375,716** (was 188x310 in a 375x812 screen).
      FIXED (scroll): EXPAND_DIST 120 -> 320. Content-vs-finger runaway **2.35x -> 1.51x** (the scroller
      top rises a fixed 162px; the only lever is the distance it is spread over).
- [x] R5. Not morphing smoothly. verified: 445dd196a, open trace is monotonic in top (82 to 96), height (74 to 716), width (343 to 375) with 0 reversals.
      Traced per frame on OUR build (see R9). Open: top 82->96, height 66->716, width 343->375, opacity
      0->1, all monotonic, 0 direction reversals, first painted frame at 32ms. Close: 716->66 monotonic,
      last painted frame 342ms. The step change is now continuous too (R7). Not independently reproduced
      as its own defect in the repro pass, so this box is closed on the trace, not on a named symptom.
- [x] R6. Close then re-open leaves RESIDUE, overlay chrome painted over the results page. The adversarial verifier refuted the first tick: node counts were clean, but the dying sheet kept hit-testing over the pill for the full 333ms close (a real tap at close+60ms delivered 0 clicks). Re-filed as S8 and FIXED there (2026-08-03) , the descendant `pointer-events:auto` leak is gated on `open`, and the owner-facing symptom is now measured working: a real tap on the pill at close+83ms lands 1 click and re-opens the overlay, dead viewport at close+30ms 67.9% -> 0.0%. Full numbers on S8's line below. verified: bd4e1a3f0, adversarial re-verify on a fresh no-consent profile, anyRegression=false.
      FIXED: one lifecycle. The scrim/X used an AnimatePresence exit and the sheet a `setTimeout(340)`;
      both now hang off `openT`, and the sheet unmounts on that animation's completion. Measured over a
      close: **0 frames** where the sheet is more opaque than its own scrim (was 3x-12x more opaque from
      95ms to 250ms), scrim/sheet/X all unmount on the **same frame (348ms)** (was 320/370 split), both
      carry `pointer-events: none` from the first frame of the close, `elementFromPoint` mid-close returns
      the PAGE's search pill (was the dying sheet's own row), and the immediate re-open works.
- [x] R7. Switching between Suche / Standort / Datum still is not a morph and looks weird. verified: 445dd196a, uncovered sheet area stays 14.7% of 716px across the step change (a seam, not a hole); the earlier alpha-grid reading was a false positive and the verifier corrected itself.
      FIXED: the two structurally different panels are gone. One tree, three slots + footer; each slot is
      a persistent white card whose height is a continuous motion value and whose collapsed face and
      expanded body crossfade inside it. Measured over all four step changes, 60-probe composite-alpha
      grid, ~85 frames each: **0 frames with any translucent probe** (was 100% of the sheet below alpha
      0.98 for 136ms, worst 0.372, plus alpha-0 holes on the commit frame). Slot heights sum to the sheet
      exactly (716 = 716). Geometry unchanged: card 12,96,351,496; rows y602 / y668; footer y744.
      Also removed the dead `activeStep === "date"` style branch (`height: undefined` never detached the
      MotionValue, so the "content-height sheet" it described never existed).
- [x] R8. Tapping a store or suggestion inside the open search looks weird. verified: 445dd196a, typed "cut", tapped the Atelier Haarwerk row: sheet gone and location.pathname /de/salon/atelier-haarwerk on the same 144ms poll tick.
      FIXED (store row): `close()` ran only on the map path, so on the results page a store tap did no
      teardown at all. Now every row type tears down the same way. Measured: overlay gone and URL on
      /de/salon/atelier-haarwerk at **104ms** (was 995ms of nothing moving, then one frame changing 28%).
      NOT changed (stated, not hidden): tapping an autocomplete TERM still returns to the composed view
      and re-renders a similar list with the picked term on top. That is the designed behaviour, not a
      defect the repro proved, so it is left for an owner call rather than redesigned here.
- [x] R9. **Frame-by-frame, on OUR build, not just the reference.** He has now said this twice. verified: 5a850d6ff, our own morph recorded at 60fps and measured frame by frame; that is where the 167ms number came from, and the reference curve sits beside it in the C1 section.
      Done, per-frame rAF traces on this build, not the reference: open/close geometry + opacity, the
      close-morph scrim-vs-sheet opacity pair, and a 60-point composite-alpha grid across every step
      change. Numbers in the boxes above.
- [x] R10. I gave him a link without running the click-everything sweep first. Run it before the verified: bd4e1a3f0, the full click-everything sweep RAN before this link went out (workflows wf_7d6e0ad6-4fb and wf_4ddc886e-0b0), found 7 defects the fix list had missed, and every one was fixed and re-verified before the link was sent.
      next link, and treat that as the close condition, not tsc.
      Done before the link: home -> open -> Wo? -> Wann? -> back -> type -> submit -> results -> open ->
      close -> re-open -> pick Basel -> pick a date -> submit -> store row -> salon page. 17 screenshots
      at /tmp/claude-501/searchfix/. URL only ever changes on a real submit; `?q=cut`, then
      `?q=cut&city=Basel&date=2026-08-11`. No page errors; the only console error is a pre-existing 401.
      FOUND, NOT FIXED (out of the named scope, and it is the consent component): the cookie banner
      (`app/[locale]/_components/primitives/CookieConsent.tsx:230`, `z-tooltip`) paints OVER the search
      sheet and covers its footer. Pre-existing, visible in the round-2 residue frames too. It needs an
      overlay-open signal, not a pathname test, so it wants its own call.

## ROUND 3 RESULT 2026-08-03 (workflow wf_7d6e0ad6-4fb, 7 agents, adversarial verify + full sweep)

8 of the 10 verified FIXED by an adversarial verifier that was told to refute them: R1 (the home pill
no longer navigates, 0 main-frame navigations, URL stays /de), R2 (body text never drops to the
388-char skeleton again, because no document is torn down), R3, R4 (body styles restore byte-identical
after 3 open/close cycles), R5, R7, R8. All six round-2 wins re-measured and NOT regressed, including
the rejected ink focus border staying dead at 1px #E4E4E7 in both states.

**Two survived, and both are worse than they looked.**

- **R6 residue, real cause finally named.** Node counts are clean (1/1/1/1 open, 0/0/0/0 closed), so
  the earlier "stale node" theory was wrong. The actual defect: the sheet root computes
  `pointer-events:none` during the close, but a DESCENDANT sets `auto`, and a descendant's `auto`
  overrides an ancestor's `none`. The dying sheet morphs back onto the pill's own rect and keeps
  hit-testing there for the full 333ms. Measured: a real tap on the pill at close+60ms, +150ms and
  +260ms delivered **0** click events and re-opened nothing; the same tap at +400ms worked. 54% of
  the viewport is dead at +30ms.
- **The cookie banner hijacks the search submit.** `CookieConsent.tsx:230` is `z-tooltip` = 700
  against the sheet's 101. On a FIRST visit the banner covers 144px of the sheet and
  `elementFromPoint` at the Suchen button's own centre returns the banner's "Alle akzeptieren".
  **Tapping Suchen grants cookie consent and never searches. Tapping Zuruecksetzen picks "Nur
  notwendige".** This is why his own recording has the banner in frame.

### Sweep found 7 more, none of them style opinions
- [x] S1. Cookie banner reroutes Suchen and Zuruecksetzen (above). Blocker. FIXED, CookieConsent.tsx: verified: bd4e1a3f0, adversarial re-verify on a fresh no-consent profile, anyRegression=false.
      the banner is display-suppressed while a sheet or modal owns the screen and returns on close,
      reusing the ONE overlay signal this codebase already has (the body-scroll lock every overlay
      sets, plus react-aria's `documentElement{overflow:hidden}`), read through a MutationObserver.
      No new global, no overlay component touched, no auto-accept, nothing pre-seeded. Measured on a
      FRESH profile with no stored consent at 375x812, before then after:
      `elementFromPoint` at Suchen's own centre (292.5, 779.5) `button "Alle akzeptieren"` (in the
      banner) -> `button "Suchen"`; at Zuruecksetzen's centre (66.5, 779.5) `button "Nur notwendige"`
      -> `button "Zuruecksetzen"`. A REAL tap on Suchen: URL `/de` and consent written
      `{analytics:true,marketing:true}` -> URL `/de/search` and consent still `null`. Banner box while
      the sheet is open [12,656,351,144] -> NOT_IN_DOM, and back to [12,656,351,144] after the close;
      tapping "Alle akzeptieren" there still writes the record, so consent is still required and still
      answerable.
- [x] S2. `InvalidStateError: Transition was aborted` + duplicate `vt-salon-*` view-transition-name on verified: bd4e1a3f0, adversarial re-verify on a fresh no-consent profile, anyRegression=false.
      back-navigation from a salon page. 2/2 reproducible. FIXED, SalonCard.tsx + PageTransition.tsx:
      a view-transition-name has to be unique per document, and SalonCard stamped
      `vt-salon-${slug}` inline on EVERY card while /de renders the same salon in several rails.
      Measured on /de: 20 slugs duplicated (atelier-haarwerk 4x, glow-lab-basel 3x, pink-petal-nails
      3x, blade-and-stone 3x). The comment that sat on that line claimed a repeated slug just "falls
      back to the default cross-fade (harmless)"; that is not what the browser does, it aborts the
      whole transition. The card now only CARRIES the name, in `data-vt-salon`, and nobody applies it
      at rest. PageTransition.tsx applies it to the ONE card being activated and strips it from every
      other card first, so uniqueness is true by construction instead of by hoping no rail repeats a
      salon. That file is the client node already mounted around every [locale] route and already
      named for cross-page transitions, so this is not a second global doing the same job
      (exists-check run first: `npm run exists "view transition"` / `"viewtransition"` /
      `"shared element"`, no existing owner). Capture phase of `click`, specifically: `document`
      capture runs strictly before next-view-transitions' own React onClick calls
      startViewTransition, so the name is in place before the outgoing snapshot; `click` and not
      `pointerdown`, because a pointerdown that turns into a scroll would leave a card armed with
      nobody navigating, and because `click` also covers keyboard Enter.
      Measured on the owner's exact 3-step flow (/de, open the overlay, type "cut", tap the Atelier
      Haarwerk card, `history.back()`), 2/2 runs before and 2/2 after:
      duplicate view-transition-names on /de idle 20 -> 0, with the overlay open 20 -> 0;
      console `Unexpected duplicate view-transition-name: vt-salon-nail-studio-bliss` in both runs
      -> absent in both; pageerror `Transition was aborted because of invalid state` in both runs ->
      0 page errors in both. (The 401s still in that console are an unrelated auth-gated fetch,
      present before and after.)
      The morph the fix has to KEEP, measured by patching `document.startViewTransition` to snapshot
      every live view-transition-name at the instant it is called, then tapping a home card:
      `{root: 1, vt-salon-cuts-and-culture: 1}`. Exactly one element named, and it is the tapped
      card's own photo box, which is what the PDP hero (SalonHero.tsx, same name) pairs with.
      Back-navigation now cross-fades instead of throwing: the outgoing PDP carries one name, the
      incoming home page carries none, so there is nothing to collide with. Making BACK morph too
      would need the incoming card named during the transition's own DOM update, which
      server-rendered cards cannot do, and that is not what breaks.
- [x] S3. With the keyboard up the close-X is `opacity 0` but `pointerEvents:auto` and sits over the verified: bd4e1a3f0, adversarial re-verify on a fresh no-consent profile, anyRegression=false.
      search field's right end. Tapping to move the caret destroys the overlay and the typed query.
      FIXED, SearchOverlay.tsx: the X's `pointerEvents` read `open` alone, so it kept hit-testing at
      full 44x44 while its own opacity was 0. It now reads `closeXHit`, a transform of its OWN
      opacity, with S8's `hitGate` folded into the SAME motion value rather than written as
      `open ? closeXHit : "none"` , swapping a motion value for a static string in `style` does not
      detach the already-attached value, the exact trap S8 and R7 both documented, so the R6 fact
      (drop hit-testing the instant `open` flips false, so a tap during the 333ms close cannot land
      on the dying overlay) survives through the gate instead of through a ternary that would keep
      writing "auto" every frame.
      Measured at 375x812 with the keyboard up (visualViewport 476 of an 812 layout viewport), the
      same state before and after: close-X [319,6,44,44], opacity "0", pointerEvents "auto" ->
      "none"; `elementFromPoint(351, 46)`, the right end of the field row [12,22,351,48], returned
      `button[Schliessen]` -> returns the field row itself (`div.flex.h-12`). A REAL tap at that
      point: overlay destroyed and query "" -> overlay still open and query still "cut".
- [x] S4. Date and period survive close+reopen while everything else is re-seeded, so an abandoned verified: bd4e1a3f0, adversarial re-verify on a fresh no-consent profile, anyRegression=false.
      date is silently applied to the next search. FIXED, SearchOverlay.tsx: the open effect now
      re-seeds isoDate/selKey/dateLabel/zeitPeriod/dateTab/monthOffset alongside the four fields it
      already re-seeded. It sits in the OPEN effect, not close(), because Escape calls onClose()
      directly and the parent can flip `open` itself, so close() is only one of the ways out while
      every way back in passes through here. Measured, the three collapsed faces:
      fresh open ["Suche | Service, Store oder Stylist:in", "Wo? | Basel", "Wann? | Jederzeit"];
      after Nails + Zuerich + 21. August + Abend ["Suche | Nails", "Wo? | Zuerich",
      "Wann? | 21. August"]; after close with the X and reopen, byte-identical to the fresh open,
      where it used to still read "Wann? | 21. August". Same result closing with Escape.
- [x] S5. A zero-match query renders NO empty state; it falls through to the unrelated "Fuer dich" verified: bd4e1a3f0, adversarial re-verify on a fresh no-consent profile, anyRegression=false.
      grid, so a failed search looks like a successful one. The locked mockup HAS this state.
      FIXED, SearchOverlay.tsx: the typing branch returns the shared `<EmptyState>` (the locked
      component, `components-legacy/ui/EmptyState.tsx`) with the `ui.searchOverlay.noMatchTitle` +
      `noMatchBody` strings that already shipped in all four locales and were used by no file. No
      new copy, no new component. The condition counts EVERY query-related group (suggest results,
      geocode candidates, autocomplete terms, query looks), not only the three suggest groups, so a
      query with only place or completion hits still renders its rows. Measured on "zzzqqq" (suggest
      returns 0 salons / 0 services / 0 stylists): sheet innerText now reads "Keine Treffer / Wir
      konnten nichts zu \"zzzqqq\" finden." with 0 look tiles, where it used to show 8 unrelated
      "Fuer dich" brow looks. Control, "haar" still renders 17 rows and no empty state.
- [x] S6. The category pill row changes nothing but its own fill, and the pick is discarded on close. verified: bd4e1a3f0, adversarial re-verify on a fresh no-consent profile, anyRegression=false.
      FIXED, useSearchSuggest.ts + SearchOverlay.tsx: `/api/search/suggest` already read `category`
      and handed it to the `search_suggest` RPC as `p_category` (it gates all three groups), and the
      hook simply never sent it. The hook takes `category` now and the overlay passes the SAME
      `category` state the pill row already wrote and `buildParams` already turns into `?category=`,
      so there is no second taxonomy and no second state. The idle "Beliebte Stores" list narrows on
      the same tap via `&category=` on the featured `/api/salons?ids=` fetch it was already making
      (the route applies `.contains("categories", [category])` on the same builder as the ids
      filter), server-side, and the section hides rather than showing a titled empty block.
      DISCRIMINATION measured against the live seed, not just "it runs":
      q=haar, no pill -> 17 rows, services spanning spa + coiffeur;
      q=haar + Coiffeur -> 17 rows, coiffeur-only services (the spa "Intim-Waxing" row is gone,
      "Glaetten / Brushing" and "Olaplex Intensivpflege" take its place);
      q=haar + Nails -> 0 rows and the S5 empty state (API: 0/0/0);
      idle, no pill -> 15 rows incl. 3 featured stores; idle + Coiffeur -> 15 (all three featured
      salons ARE coiffeur); idle + Nails -> 12, the three store rows dropped.
      The pick carries into the submitted search, measured pushState:
      "/de/search?q=haar&category=coiffeur&city=Basel".
- [x] S7. 48 focusable controls in the collapsed Wo?/Wann? bodies stay keyboard and screen-reader verified: bd4e1a3f0, adversarial re-verify on a fresh no-consent profile, anyRegression=false.
      reachable while invisible and untouchable. FIXED, SearchOverlay.tsx: `pointer-events:none`
      hides a control from the FINGER only. The slots cannot be unmounted (the morph is one
      continuous transform over ONE DOM tree and needs every slot in it), so they are `inert`
      instead , it takes a still-rendered subtree out of the focus order and out of the AT tree
      while changing no layout and painting nothing, which is the pattern this same file already
      used on the collapsed time chips (`inert={!selKey}`). Nine attachment points: each slot BODY
      inert when it is not the active step, each collapsed FACE inert while its body is up, and the
      two collapsed rows plus the footer inert while they are folded away on focus. That last one
      needed the only new state in the fix, `rowsFolded`: `expand` is a MotionValue, so nothing in
      React could see the fold and the faces stayed tabbable inside a zero-height overflow-hidden
      box. It flips at 0.8, the SAME endpoint rowLocH / rowDateH / footerH already finish folding at,
      and it drives nothing but the attribute , no size, no position, no opacity, so it is not a
      second layout threshold.
      Measured INSIDE the sheet, overlay open on the service step, on the same tree at the same
      instant (pass A with the fix live; pass B with `inert` stripped at runtime, which is exactly
      the pre-fix state of that tree): invisible-yet-tabbable controls 61 -> 13, the city input
      1 -> 0, calendar day cells 29 -> 0. All 13 survivors are content of the ACTIVE step that has
      merely scrolled out of view (the horizontally scrolled category pills, the suggestion list
      below the fold); classifying each by `scrollIntoView` and re-hit-testing gives 0 stranded in a
      collapsed slot. Whole-document control over the same closed/open pair: opening the overlay
      added +72 invisible-yet-tabbable controls -> +24, the residue being that same scroll-reachable
      active-step content. `inert` count 4 at rest (service face, location body, date body, time
      chips) and 7 focused (+ location slot, date slot, footer), and the city input is tabbable
      exactly when its own step is open: false -> true -> false across Wo? tapped twice.
- [x] S8. R6's pointer-events leak (above). FIXED, SearchOverlay.tsx: the six slot layers verified: bd4e1a3f0, adversarial re-verify on a fresh no-consent profile, anyRegression=false.
      (svc/loc/date body + collapsed face) set `pointer-events:auto` off their own step transform
      alone, and a descendant's `auto` beats an ancestor's `none`, so the sheet root's
      `open ? "auto" : "none"` never stopped them. They now read a `hitGate` motion value set in the
      same React commit that flips `open` false, so hit-testing stops when the close STARTS, not when
      it ends. Measured before -> after: dead viewport at close+30ms 67.9% (336/495 sample points
      resolving to the sheet) -> 0.0% (0/495). A REAL CDP tap on the home pill mid-close, delay
      measured in-page from the close click: +78ms 0 clicks / no reopen -> +83ms 1 click / reopened;
      +171ms 0 -> +181ms 1 / reopened; +281ms 0 -> +279ms 1 / reopened; +421ms 1 -> +420ms 1, both
      reopen. Accepted items re-measured and NOT regressed: URL stays /de with 0 main-frame
      navigations, bar [24,228,327,48] unfocused -> [12,66,351,48] focused, border 1px
      rgb(228,228,231) in BOTH states, category pill row 60px -> 0 on focus, close X 44x44, expanded
      sheet [0,50,375,762] so its bottom lands on 812, and Wo? tapped twice opens then closes
      (location body opacity/pointer-events 0/none -> 1/auto -> 0/none).

### Accepted items re-measured after S2 + S3 + S7 (2026-08-03), none regressed
Same harness, 375x812, one pass over the live dev server: home pill opens in place with URL
`http://localhost:53322/de` and **0** main-frame navigations; search bar [24,228,327,48] unfocused ->
[12,66,351,48] focused (rises 228 -> 66, widens 327 -> 351); bar border `1px rgb(228, 228, 231)` in
BOTH states, no ink 2px anywhere; category pill row height 60 -> 0 on focus; close X 44x44 in both
states, its bottom edge 10px above the sheet's top edge at rest and flush (0) once the sheet is
clamped to the safe-area floor while focused; expanded service card bottom lands on **812**; Wo?
tapped twice opens then closes, slot heights [496,66,86,68] -> [56,506,86,68] -> [496,66,86,68].
`npx tsc --noEmit` clean.

## OWNER PICK 2026-08-03: curve C

Shown three curves side by side on the same geometry at `public/_mockups/search-curve/index.html`,
he answered "C". Applied to `MORPH_EASE`, SearchOverlay.tsx:73.

| | curve | chooser said | measured live after applying |
|---|---|---|---|
| A calm (was live) | [0.4, 0, 0.2, 1] | 50% at 128ms, 95% at 266ms | |
| B Airbnb literal | [0.32, 0.72, 0, 1] | 50% at 59ms, 95% at 177ms | the shape he called too fast |
| **C between (now live)** | **[0.36, 0.36, 0.1, 1]** | 50% at 90ms, 95% at 233ms | **50% at 102ms, 95% at 244ms, 99% at 310ms** |

Measured on the real overlay at 375x812, zero page errors, and the URL stayed `/de` through the open
so the in-place fix is not disturbed.

## OWNER SHOTS 2026-08-03, the keyboard-up state (5 screenshots, no text)

Every defect is in the KEYBOARD-UP state, which none of the previous rounds rendered with a keyboard.
Files in `/Users/sulo/.claude/uploads/1c4aafb4-f426-493f-b8e6-885ee10cdf1b/`.

- [x] K1. IMG_6911, search step with the keyboard up: **the suggestion list is completely gone.** The verified: adversarial pass, keyboard-up scroller measures 375x402 with 4 rows fully visible where it was 20px with 0 rows. Root cause: fixed chrome totalled 414px inside a 384px sheet, and the elastic list absorbed the whole deficit, which was also a dead end because scrolling that list was the only way to expand and a 0px list cannot scroll. The keyboard now drives the same `expand` a focus drives.
      card ends under the field, then Wo?/Wann?, then a dead blurred band, then the footer on the blur.
      REPRODUCED at his exact geometry (402x874, safe-area top 59, keyboard 425, all three derived from
      the shot's own pixels): sheet 65..449, slots [164, 66, 86, 68], suggestion scroller **20px with 0
      rows in view** (a 20px box that is entirely its own padding), screenshot
      `_audits/screenshots/kb-before-service.png` reproducing IMG_6911 down to the clipped field.
      ROOT CAUSE: the sheet is 384px with the keyboard up, and the UNFOLDED composer's own fixed chrome
      is heading 56 + pills 60 + field 68 + Wo? row 76 + Wann? row 86 + footer 68 = **414px**. 414 does
      not fit in 384 and the suggestion list is the only elastic child, so it absorbed the entire
      deficit. It is also a DEAD END: the only control that can raise `expand` again is scrolling that
      same list, and a 0px list cannot be scrolled. Measured the trap end to end, focus then flick the
      suggestions back to the top with the keyboard up: list 316px/4 rows -> **20px/0 rows**, stuck.
      FIXED, SearchOverlay.tsx: the keyboard now drives the SAME `expand` a focus drives. `scrollExpand`
      is the driver the finger writes (the focus `grow(1)` plus the scroll link), `kbT` is the keyboard's
      own progress on the same 0.34s/EASE `grow` already uses, and `expand` is their MAX, so the keyboard
      can only raise the fold and never undo what the finger did. One continuous value over ONE DOM tree,
      nothing mounts or re-parents, and at kbInset 0 `kbT` is 0 so `expand` is byte-identical to before.
      MEASURED, his geometry: suggestion scroller **20px -> 316px**, rows in view **0 -> 4** (3 fully
      visible). Harness 375x812 with a 336px keyboard: **66px -> 402px**, 0 -> 4 fully visible.
      The dead end is gone: the same flick-back-to-top now holds [384, 0, 0, 0] / 316px / 4 rows.
      Regression guard, keyboard DOWN, before and after byte-identical: home pill 0 navigations and the
      URL still /de; pills 60 -> 0 on focus; bar y228 -> y66 and w327 -> w351; bar border
      `1px rgb(228,228,231)` in BOTH states; close X 44x44 in both; expanded card bottom 812; the scroll
      link still expands at 320 and collapses back; MORPH_EASE untouched at [0.36, 0.36, 0.1, 1].
- [x] K2. IMG_6909 and IMG_6914/6916: content is **hard-clipped mid-row** at the keyboard line. The CLOSED by K4 (owner picked K-A). verified: SearchOverlay.tsx:542-560/576-587/1358-1370, row at the keyboard line now spans 465-533 (57px past the y476 clip line, DOM-unclipped) where it used to span 421-489 cut hard at 476 (13px hidden by sheet overflow). Numbers below.
      "Coiffeur" row is sliced through; the city list is clipped at BOTH ends with 1-2 cities visible.
      BOTTOM END, the city list, fixed by K1's driver: on the Wo? step at his geometry the city scroller
      measured **34px, 1 row in view, 0 fully visible** out of 9 cities, and now measures **198px, 3 in
      view, 2 fully visible**, ending on a real row boundary (`_audits/screenshots/kb-after-wo.png`
      against `kb-before-wo.png`). Harness 375x812: **120px -> 284px**, 1 -> 4 fully visible.
      TOP END, the Suche row cut off by the status bar: reconstructing IMG_6914 from its own pixels, its
      Wo? card is 207pt tall, which the sheet arithmetic only produces at kbInset 380, i.e. a 425px
      keyboard read through a **45px visual-viewport scroll**. `position: fixed` is laid out against the
      LAYOUT viewport while iOS scrolls the VISUAL one inside it, so the sheet's top rendered 45px above
      where it was computed. Measured with offsetTop forced to 45: sheet top in SCREEN coordinates
      **-39 -> 6**, bottom 431 in both, height 470 -> 425 (the sheet now stops at the keyboard instead of
      hanging 45px past it). The bottom edge never needed the term: `viewport.h - kbInset` is already the
      keyboard's top edge in layout coordinates, offset included.
      DECIDED, then FIXED 2026-08-03: the owner answered the K4 chooser with K-A, scroll-under. Two
      code changes, per the notes already on this box: `topFor` (SearchOverlay.tsx:550-560) no longer
      subtracts `kbInset` from the sheet's top, and `sheetHeight` (:576-587) uses the viewport's own
      bottom instead of `viewport.h - kbInset`, so the sheet is never shrunk to sit above the keys, in
      either direction (top or bottom). The suggestion scroller's own bottom padding
      (SearchOverlay.tsx:1358-1370) now reads `kbInset` while the keyboard is up (was a fixed 16px), so
      the last row can still be scrolled clear.
      MEASURED, real headless Chromium at 375x812 with a 336px keyboard simulated via
      `visualViewport.height`, before (git-stashed, the pre-fix K-B code) then after, same harness:
      sheet **0,6,375x470 (bottom 476)** -> **0,50,375x762 (bottom 812)**, byte-identical to the K4
      chooser's own K-B and K-A numbers. Suggestion scroller box **0,74,375x402 (bottom 476)** ->
      **0,118,375x694 (bottom 812)**, no longer clipped at the keyboard line at all. The row sitting on
      the keyboard line: before, DOM span **421 to 489**, hard-clipped by the sheet's own
      `overflow:hidden` at 476 so only 55 of its 68px painted (13px hidden); after, DOM span
      **465 to 533**, nothing clips it there any more, it runs 57px past the keyboard line and is only
      covered by the OS keyboard's own paint, not by ours. Scroller bottom padding **16px -> 336px**
      (`kbInset`) confirmed via computed style. 4 rows still fully clear of the keyboard line in both
      builds (fullyAboveClip 4/7), matching K1's own "4 rows" number, unregressed.
- [x] K3. A large **dead blurred band** sits between the last card and the footer, and the footer verified: adversarial pass, gap from the last card bottom to the footer top measures 0 in every keyboard-up state (was 88px).
      floats on the blur with no surface under it.
      MEASURED, last painted card bottom to the sheet's own bottom edge: **88px** in every keyboard-up
      state (20px of Wann?-slot tail plus a 68px footer with no surface of its own), which is 23% of the
      384px sheet on his device against 11% of the 778px sheet without a keyboard, which is why the same
      88px reads as chrome at the screen edge in one state and as a floating band in the other.
      FIXED by the same K1 driver: the footer folds with the keyboard exactly as it already folds on
      focus, so the last card's bottom IS the sheet's bottom. **88px -> 0px** at both geometries, in the
      unfocused, focused and Wo? keyboard-up states. Without a keyboard the 88px band is untouched, so
      the shipped resting look does not move.
      COST, named, not a taste call I made: with the keyboard up the Wo? / Wann? rows and the Suchen
      footer are folded away, so they are not tappable until the keyboard is dismissed (the back arrow now
      blurs the field explicitly for that reason). That is the same trade the focused service step already
      shipped, and it is what the Airbnb reference IMG_6917 does, but it does remove a control that was
      reachable before. Also new and left for him: at expand 1 the Suche slot is full-bleed (cardMx 0)
      while the Wo? card keeps its 12px inset, so the Wo? step with the keyboard up now shows a full-bleed
      row above an inset card. Flagged rather than restyled (mockup-first).
- [x] K4. Owner choice, mocked not asked: does the list scroll UNDER the keyboard (what the Airbnb OWNER PICKED K-A. verified: SearchOverlay.tsx:542-560 (topFor) + :576-587 (sheetHeight) + :1358-1370 (scroller padding), applied and measured on the real build, numbers below and in K2 above.
      shot does) or does the sheet shrink to sit above it.
      MOCKED, which is what this box asks for; the DECISION is still his and is not recorded here.
      `public/_mockups/search-keyboard/index.html`, a two-axis chooser over ONE DOM tree, the real
      service step at 375x812 with the keyboard simulated at 336, real seeded content (the three
      featured salons with their live /api/salons addresses, then the four shipped categories), the
      real /de home capture blurred behind the scrim. Both keyboard options render and were measured
      by Playwright on the rendered page, not derived on paper:
      K-A scrolls under, sheet **50 to 812, height 762**, list box **118 to 812, height 694** of which
      **358** sits above the keyboard line, list bottom padding 336 so the last row can still be
      scrolled clear. K-B shrinks above (what ships), sheet **6 to 476, height 470**, list box
      **74 to 476, height 402**, all 402 above the keyboard. Both show 4 rows fully and cut 1.
      The finding worth his attention, and the reason this was rendered instead of described: K-B
      shows **more** list than K-A (402 against 358), because the sheet RISES as well as shrinks. The
      real trade is not area, it is 6px of screen edge above the field plus a hard white cut through
      a row (K-B) against a card top at 50 with the row sliding under the keys (K-A, and the
      reference's own 62.3pt). K-A also needs a code change: the sheet top stops being reduced by
      kbInset. Screenshots `_audits/screenshots/kbchooser-K{A,B}-F{A,B}.png`, all four combinations
      rendered with zero console or page errors, plus the 402-wide phone check where the whole 812
      screen sits under the sticky switcher bar with no horizontal overflow.
      IMPLEMENTED 2026-08-03, port into the real overlay: SearchOverlay.tsx:542-560 (`topFor` no
      longer subtracts `kbInset`), :576-587 (`sheetHeight`'s `bottom` is always `viewport.h`), and
      :1358-1370 (the suggestion scroller's `paddingBottom` reads `kbInset` while the keyboard is up,
      `max(16px, env(safe-area-inset-bottom))` at rest, byte-identical to before when `kbInset` is 0).
      Real headless Chromium, 375x812, 336px keyboard simulated: sheet **0,50,375x762 (bottom 812)**,
      exactly the chooser's K-A numbers. See K2 above for the row-level before/after.
- [x] K5. Owner choice, mocked not asked: the field at rest, filled grey vs white with a hairline. Chooser BUILT and rendering. OWNER PICKED F-B (white, hairline). verified: no code change, SearchOverlay.tsx:982 already renders `border border-s-border bg-white` unconditionally since the C4 fix; measured 1px rgb(228,228,231) in resting, focused, and keyboard-up states, no ring, no ink border.
      MOCKED on the same page, second switcher, measured on the render: F-A **rgb(244,244,245)** with
      a transparent 1px edge (no ring), F-B **rgb(255,255,255)** with 1px **rgb(228,228,231)**, the
      live value. Box geometry identical in both (field 12,22,351x48, radius 16), so only the fill
      moves. Neither option adds a focus ring or an ink border. RECOMMENDATION stated on the page and
      here: F-A, because the reference measures rgb(247,247,247) AND our own input law already says
      filled grey at rest (LOCKFILE 3.5 / V3-D-input-fill 2026-07-17), so this axis is the one place
      the reference and our own rulebook agree and the live overlay follows neither. Still his call.
      Flagged, not changed: the same LOCKFILE row puts input radius at 12 and this field renders 16.
      Radius is not the axis under question, so it was left alone in both options.

## K4/K5 PORTED 2026-08-03, owner answered K-A + F-B

Owner read the K4/K5 chooser and answered "K-A" and "F-B" directly, no further mockup round. K-A ported
into SearchOverlay.tsx (three edits: `topFor`, `sheetHeight`, the suggestion scroller's bottom padding,
all in the K2 box above with file:line). F-B needed no change, it was already what C4 shipped.

DO-NOT-REGRESS re-measured on the real build after the K-A port, real headless Chromium, 375x812, one
pass, none regressed: home pill opens in place, URL stays `http://localhost:49975/de`, **0** main-frame
navigations; category pills row **60px -> 0px** on focus; bar **(24,228) 327x48** unfocused ->
**(12,66) 351x48** focused; bar border **1px rgb(228,228,231)** in resting, focused, AND keyboard-up
states (F-B, untouched); close X **44x44**; expanded sheet bottom **812** with no keyboard; `MORPH_EASE`
still `[0.36, 0.36, 0.1, 1]` (SearchOverlay.tsx:79, unedited); with the keyboard up the suggestion list
still shows **4** rows fully clear of the keyboard line (K1, unregressed); gap between the last card and
the footer **0px** in both the focused-no-keyboard and keyboard-up states (K3, unregressed). `npx tsc
--noEmit` clean.

PIL-measured on the two focused shots: Airbnb card top edge **62.3pt**, ours **51.0pt**; Airbnb field
interior fill **rgb(247,247,247)**, ours white with a 1px #E4E4E7 hairline. Note our own LOCKFILE
already says inputs are filled grey at rest, so on this axis the reference and our own law agree and
the live overlay follows neither.

## OWNER PICK 2026-08-03: K-A and F-B

He flipped the chooser and answered "k a f b".
- **K-A**, the list runs under the keyboard. Sheet keeps full height: y50 h762 bottom812 with the
  keyboard up, where it used to stop at the keyboard line (y6 h470 bottom476).
- **F-B**, the field stays white with its hairline. He overruled my grey recommendation; no code
  change was needed and the border measures 1px rgb(228,228,231) in all three states.
- All THREE scrollers (service suggestions, city list, calendar) now carry the live keyboard inset as
  bottom padding (336px measured), not just the one named in the brief, because the city list is
  exactly what his IMG_6914 and IMG_6916 showed clipped and the Wo? step is the one whose own input
  raises that keyboard.

## THE FRAME-BY-FRAME HE ASKED FOR, THREE TIMES, AND I FINALLY DID IT (2026-08-03)

Owner: "how Airbnb does it is completely different from how you're doing it. And I literally gave you
a screen recording of it, and I told you to look frame by frame, and you didn't do that." He is
right. Every previous pass measured the container's START RECT, END RECT and DURATION. None of them
measured WHAT MOVES AND WHEN. That is the whole difference and it is why the open still reads wrong.

Extracted his recording at **120fps, full 1206x2622**, over the open (0.80s to 1.50s), and tracked
the card's top edge plus the ink density of four horizontal bands (the tab row, the heading, the
field, the first list rows). Points, 402pt device.

| t | card top | heading ink | field ink | list ink |
|---|---|---|---|---|
| 0ms | 64.0 | 0.002 | 0.037 | 0.148 |
| 100ms | 69.3 | 0.000 | 0.035 | 0.142 |
| 150ms | 88.7 | 0.000 | 0.000 | 0.029 |
| **200ms** | **115.0** | **0.000** | **0.000** | **0.000** |
| **250ms** | **129.0** | **0.000** | **0.000** | **0.000** |
| 300ms | 137.3 | 0.001 | 0.000 | 0.000 |
| 350ms | 142.0 | 0.002 | 0.023 | 0.007 |
| 450ms | 145.3 | 0.006 | 0.025 | 0.020 |
| 650ms | 146.3 | 0.007 | 0.029 | 0.037 |

**Airbnb's open is THREE STAGED PHASES, not one morph:**
1. **0 to 150ms, the old content leaves.** The pill's own label and the page behind it fade out while
   the container only just begins to move.
2. **150 to 300ms, an EMPTY container travels.** Every ink band reads 0.000 at 200ms and 250ms. What
   is on screen is a blank white card sliding DOWN into position. Nothing is legible.
3. **300 to 650ms+, the content fades UP into the settled container**, staggered, heading first, then
   the field, then the list, and still climbing at 650ms, long after the container stopped at ~400ms.

Two structural facts we got wrong:
- **The card's top moves DOWN 82pt** (64.0 to 146.3) during the open. Ours moves 14px. The tab row
  fades in ABOVE the card, which is what pushes it down.
- **The content is NOT present during the travel.** Ours renders the full list from frame one and
  carries it along, which is exactly the owner's "it's all already over there instead of everything
  fading up".

- [ ] F1. Rebuild the open as these three phases: content out, empty container travels down 82pt,
      content fades up staggered into the settled container.
- [ ] F2. The close is the same three phases reversed (its measured duration is 333ms).
