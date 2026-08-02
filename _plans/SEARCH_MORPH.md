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
- [x] A10. Reference files moved into `/Users/sulo/solen/screenshots/` (copied; Downloads originals remain).

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
