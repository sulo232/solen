<!-- exists-check: net-new vs REMOVED.md (that graveyard = DELETED/rejected things; this ledger = RE-INVENTED structure) + scripts/removed.mjs. Different purpose, checked both. -->

# 🧭 Drift Ledger , re-invented / regressed UI structure (owner-flagged recurrences)

Like `REMOVED.md` (the graveyard for DELETED things), but for **RE-INVENTION**: cases where I rebuilt
a structure that already had an approved version. Fed on every recurrence. A UserPromptSubmit hook
(`~/.claude/hooks/drift-ledger-inject.py`) matches each entry's `keywords:` line against the incoming
prompt and INJECTS the entry, so the next relevant turn is forced to see it (same mechanism as the
binary-triggers table + REMOVED graveyard). Format: one `##` block per drift; the `keywords:` line is
machine-matched. Feed a new entry whenever the owner flags "you rebuilt/re-invented X again."

## 2026-07-02 , map salon card re-invented (compact thumbnail instead of the approved feed card)
- existing (REUSE THIS): `app/[locale]/dev/map-full/page.tsx` StoreCard + the real `app/[locale]/_components/search/SalonResultCard.tsx` variant="feed" , BORDERLESS: full-width `aspect-[3/2]` photo + heart + dots + name + inline star + "distance, address" + "category, N reviews" + up-to-3 service rows + "View N services".
- invented instead (WRONG): a compact 76x100 horizontal thumbnail card, no `aspect-[3/2]`, no service rows (in /dev/map-behavior list / not-selected state).
- owner: "on the normal not selected state that isnt what we have, you keep making up structure over and over."
- fix rule: on ANY map/search salon card, REUSE SalonResultCard or copy the map-full StoreCard structure verbatim. Enforced by `no-invented-ui-gate.py` (structural: requires the canonical signature or an import, not a comment).
- keywords: salon card, result card, feed card, bottom sheet, list card, map-behavior, map-single, map-full, salon list, store card, map sheet

## 2026-07-02 , map live-list: built a BUTTON (council rec) over the owner's repeated "auto-update on zoom"
- what the owner asked (REPEATEDLY): the map bottom sheet must AUTO-update to the VISIBLE viewport as you zoom/pan , zoom into an EMPTY area -> sheet EMPTY; zoom to a place with stores -> THOSE stores, never random far-away ones. No manual button.
- what I built instead (WRONG): a "In diesem Bereich suchen" BUTTON (the design council's rec), and I verified the MECHANISM (API bounds call fires) not the owner's DESCRIBED scenario (zoom-to-empty -> empty). It "passed" the verifier while failing the owner's actual use.
- owner: "why is it still the same problem over and over, i told you to fix the map function... is it the subagents or you not prompting them good?"
- fix rule: (1) the owner's LITERAL repeated ask OVERRIDES a council/subagent recommendation , when they conflict, do what the owner said and flag the council disagreement. (2) VERIFY THE OWNER'S EXACT DESCRIBED SCENARIO (reproduce zoom-into-empty -> sheet-empty), not a proxy mechanism. (3) Don't redesign an already-approved element (the search-this-area pill / the map bar).
- keywords: map, live list, search this area, zoom, viewport, bounds, auto update, in diesem bereich, map sheet, map function, empty area

## 2026-07-03 , search-model-b mockup INVENTED a search bar (not the real one)
- existing (REUSE THIS): the REAL category-page top in `app/[locale]/_components/search/SearchTemplate.tsx`: header (home icon-btn + city selector + burger), the LARGE category pills row (3D icons, gray-sunken active), the 67px TWO-LINE search bar (`rounded-pill border-s-border bg-white px-3.5`, "Suchen"/subline + map icon-btn inside right), then the filter-pill row. Measured live 380x67 at 412px.
- invented instead (WRONG): a "Category" label + small segmented 4-tab control + a generic single-line search field , nothing like the real anatomy.
- owner: "what the fuck is wrong with your search bar? that shit is not what we have."
- fix rule: ANY mockup of the search/category page MUST copy the real SearchTemplate top verbatim (extract the real JSX; screenshot the real /de/coiffeur as reference). Model-B deltas are BEHAVIORAL (param separation), not a new bar.
- keywords: search bar, suchleiste, category page, model b, composer, segmented, suchen, schweizweit, category pills, search template

## 2026-07-15 , resurrected a REJECTED treatment by copying dormant source code into a mockup
- what happened: the taste-lab mockup replicated the web DiscountBadge (rose photo tag, SalonCard.tsx V3-D85) straight from source. That badge NEVER renders live (no data feeds it) and the owner had already rejected rose/red photo tags in the mobile decision (memory project_card_badges). Owner rejected it again on sight ("the 15 percent off thing it doesnt match at all") and flagged the PATTERN: "you keep reading from the source code... you keep making it in over and over again", across sessions.
- the rule: SOURCE CODE IS NOT RENDER TRUTH. Ground every mockup element in what the live page RENDERS (screenshot/DOM of the real route). A dormant branch is a graveyard candidate, not a spec.
- enforcement: _design-system/REJECTED_TREATMENTS.json (signature list, extend on every rejection, same turn) + scripts/hooks/mockup-resurrection-gate.py (PreToolUse on _mockups writes; self-tested 2026-07-15: badge=BLOCK, clean=PASS). Also in the fable-frontend skill trap list.
## 2026-07-12 , STYLE reference read as a literal COMPONENT TRANSFORM (turned every icon into a colored glass disc) + used onboarding PHOTOS when real category ICONS existed
- what the owner shared: a saturated red glossy DISC with a lighter same-hue rim, white glyph, on a sky bg. Ask: "more color and saturation, this two-tone thing, giving glass, i need this STYLE everywhere."
- what I did (WRONG, twice): (1) interpreted "this style everywhere" as "wrap every icon in a solid colored GlassCircle disc" and BUILT it (v=8) , the owner: "why would icons become a colored glass bro wtf are u on about... no push back its obviously so weird abt what u thought abt replacing icons." (2) used categoryPhotos.ts onboarding PHOTOS for category tiles when the real category ICONS already exist in BOTH repos.
- ground truth (VERIFIED 2026-07-12): the category icon set is identical + already correct , web app/[locale]/_components/homepage/MobileCategoriesRow.tsx uses public/icons/categories/{scissors,clippers,nails,map,walkin,spa}.png; mobile src/components/home/CategoryRow.tsx uses src/assets/categories/ (same 6 files); C7 (v=7) via CategoryTileRow already renders these real icons. There was nothing to invent.
- fix rule: a shared STYLE/vibe reference (color, gloss, saturation, "this look everywhere") is a TREATMENT to apply to existing elements, NOT a license to invent a new component or transform every element's shape. Before acting on "this style everywhere", (a) name the 2-3 concrete surfaces it could land on and CONFIRM the surface with the owner, do not pick the most aggressive transform; (b) for any icon/asset, REUSE the web's existing asset set (icons/categories, illustrations) , never onboarding photos, never a from-scratch glyph. Push back on your OWN weird interpretation before building it (global rule 3).
- keywords: style everywhere, this style, saturation, glass, two-tone, colored disc, icon, category icon, photo illustration, categoryphotos, vibe, look everywhere, glass disc

## 2026-07-11 , C7 mockup INVENTED shapes + glyphs (square thumbnails, "map"/"ellipsis" icons) over registered anatomy
- existing (REUSE THIS): solen-mobile COMPONENT_REGISTRY.md: SalonCard (owner-locked H: 5:4 photo r22 borderless glass-heart; variant="list" = the full-width row) and CategoryRow (the ONE category grid/row; its registry line literally bans "inventing a second category grid/row elsewhere"; tiles use assets/categories/*.png incl. the existing Karte tile). App glyph inventory (grep SymbolView): mappin, magnifyingglass, star.fill, chevrons, bell, calendar. NO "map", NO "ellipsis".
- what happened (WRONG): the C6/C7 "In deiner Nähe" list invented 64pt SQUARE thumbnails (vs the locked 5:4/photoAspect law), the search pill got an invented SF "map" glyph (app uses "mappin"), the tile row invented an "Alle" ellipsis tile and used onboarding photos instead of the existing assets/categories images. Same class as the 2026-07-02 map-salon-card re-invention.
- owner: "the shapes... in deiner Nähe or anywhere, making fucking nonexistent weird shit. the icons, you make that up. You didn't even check. What happened to the aspect ratios?"
- fix rule: reference DNA (Uber/Airbnb zones) maps onto REGISTERED components; NEVER spec raw geometry (square thumbs, new tiles) when a registry row covers the slot. Icons ONLY from the app's existing glyph/asset inventory: grep SymbolView names + assets/categories BEFORE any icon appears in a brief.
- keywords: thumbnail, dense row, in deiner nähe, nearby list, icon, glyph, sf symbol, symbolview, aspect ratio, tile row, alle tile, ellipsis, category tile

## 2026-07-11 , mobile STATUS-CHIP treatment: proposed web pale-tint + ink text, owner rejected BOTH options ("so ass")
- what happened (WRONG): the mobile tint A/B mockup offered web pale tints vs mobile pale tints, both with INK text on the colored pill, without checking solen-mobile's settled law first (PLAN.md D8b no-two-tone was the prior law) and without asking what treatment class the owner wants at all.
- owner: "i dont like how white and black text inside of a red pill sh thats so ass wtf. i told you more apple/uber bro."
- settled direction now: mobile status/badge treatment = Apple/Uber family, NOT ink-on-pale. Uber Eats reference (owner ss 2026-07-11, IMG_6455-6460): tone-on-tone chips (red text on pale red "Great value", green on pale green), solid red overlay tags with white text on PHOTOS only, colored icons. Final pick needs ONE small mockup; D8b's blanket two-tone ban is under owner revision, do not cite it as license for ink-on-pale.
- fix rule: before ANY mobile status/badge/chip proposal, read solen-mobile/_design-system/PLAN.md D-log + THEMING.md section 2 AND this entry; propose only within the Apple/Uber family.
- keywords: status chip, tint, badge, pale, success chip, error chip, bestätigt, pill text, two-tone, statuspill, great value, mobile chip

## 2026-07-11 , mobile SEARCH BAR mockups omitted the web map-icon-inside pattern (owner: "why do u keep forgetting")
- existing (REUSE THIS): the web SearchTemplate bar (app/[locale]/_components/search/SearchTemplate.tsx): 67px two-line pill, "Suchen"/subline, MAP ICON-BUTTON INSIDE the bar right side. The map entry lives INSIDE the search bar on web.
- what happened (WRONG): all mobile home mockup rounds (v1-v6) rendered plain search pills with no map affordance; the Karte entry stayed a separate tab concern, ignoring the settled web anatomy.
- owner: "for karte and stuff look into search baar in acc web we have a map icon inside of the search ba n stuff why do u keep forgetting stuff."
- fix rule: ANY mobile search bar (home, suche, mockup or real) embeds the map icon-btn inside-right, web parity, unless the owner explicitly drops it. Read the real SearchTemplate.tsx anatomy before drawing any search bar.
- keywords: search bar, suchleiste, searchbar, search pill, karte, map icon, mobile search, home search, expo search, suche tab

## 2026-07-11 , mobile design turns must load the settled-decision digest FIRST (recurrence class, owner: "fix the system")
- existing (READ THESE BEFORE PROPOSING): solen-mobile/_design-system/PLAN.md (D1-D22 owner decision log + three-source axis D5: STRUCTURE=Fresha, BRAND=web tokens, FEEL=Apple-native), THEMING.md (approved token map + 5-tier buttons), MODERN_BAR.md, COMPONENT_REGISTRY.md. Direction addendum (owner 2026-07-11, ss IMG_6455-6461): Uber Eats vibrancy in CONTENT (colorful category icons, promo tags on photos, tone-on-tone chips) + Airbnb simplicity in CHROME (calm white, top search pill placement, soft-shadow DEPTH on pills/filters) + Apple smoothness in MOTION. These are layers, not conflicts.
- what happened (WRONG, twice in one day): proposals were made from web law or from scratch while the mobile settled decisions answered the question already; the owner had to correct it and asked for a systemic fix ("cant we make a gate hook or rule abt it").
- fix rule: the FIRST read on any solen-mobile design turn is PLAN.md's D-log + this ledger; a proposal that contradicts a D-entry must NAME the entry and ask, never silently offer it.
- keywords: mobile, solen-mobile, expo, app design, mobile mockup, haptic, tab bar, dark mode, mobile home, mobile design, ios app, app screen


## 2026-07-13 , decision mockups built as isolated A/B component panels (owner: "makes no sense")
- existing (USE THIS FORMAT): mockup = a preview of the WHOLE real page with only the treatment applied (the real route's full chrome: header, content, footer), variant-switchable (?v=), hardcoded copy ALWAYS ENGLISH (corrected 2026-07-13 second message: the first message's "always in german" was a mis-dictation, owner: "i told you mockups always always in english"; real i18n components exempt, link /en/). The owner reacts to pages, not swatch boards.
- invented instead (WRONG): /dev/decision-* routes showing the component cropped into labeled A/B panels on a bare page (glass button on a photo box, two bells in cards, two isolated result cards).
- owner: "those mockup makes no sence and there should be a hook abt saying maiking the mockup a preview of the whole page and also always in german" (2026-07-13).
- fix rule: **AMENDED 2026-08-15** (owner: "Stop, like, doing this, like, a whole page mock up. Make you, like, one section of it"). Scope now matches the ask: a section decision shows the SECTION, a page decision shows the page. ENGLISH hardcoded copy is unchanged.
  **Two enforcement claims on this line were false and are corrected here.** `mockup-english-gate.py` blocks hardcoded German and does NOTHING else: it has no scope check and never required `Mockup-scope: whole-page` or a real import. The gate that actually forced the format was `mockup-fullscreen-gate.py`, which now exempts a section-scoped file whose claim is CORROBORATED by a Grounded-in component path that exists on disk (an independent reviewer broke the first, assertion-only version of that exemption in 8 ways).
- keywords: mockup, decision, a/b, panel, vergleich, preview, variante, entscheidung, swatch, side-by-side
