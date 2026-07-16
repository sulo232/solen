# Mobile design system: philosophy, do/don'ts, native channels, port system, gate

Owner ask (2026-07-11, verbatim intent): "how should we design the design system and philosophy and do and donts like a system to copy over stuff but have like haptic or [smth] or sounds n stuff for mobile yk and how should it be different etc can u ask me alot of question and find the way and make a system or gate idk tgthr"

Read: design the mobile (solen-mobile, Expo iOS) design system TOGETHER: elicit decisions via a question battery first, then build the doc + porting system + enforcement gate.

## Phase 1: research existing state (rule 12, no duplicate systems)

- [x] Inventory solen-mobile design docs (workflow wf_4e014d5d-59d, agent mobile-docs, done 2026-07-11; verified: structured result in the task output file cited below, 23 docsFound entries incl. PLAN.md D5 axis + THEMING.md token table)
- [x] Inventory solen-mobile code: haptics / sound / motion / tokens / native extras (agent mobile-code; verified: same output file, haptics wrapper src/lib/haptics.ts 97 call sites, sound NOT INSTALLED, motion presets src/lib/motion.tsx, tokens src/lib/theme.ts)
- [x] Inventory web DS structure + portable-vs-web-only split (agent web-ds-structure; verified: same output file, 22 SOURCE sections + 12 gates listed + 12-item portable1to1 / 11-item webOnly split)
- [x] Find any existing cross-repo sync mechanism + measure divergence (agent sync-precedent; verified: same output file, existingSyncMechanisms=[] and divergences cited at tailwind.config.js:170/178 vs theme.ts:39/41)

Evidence file for all four boxes: /private/tmp/claude-501/-Users-sulo-Documents-solen--claude-worktrees-hungry-thompson-412d27/8f41a95a-e116-41fc-8d33-addb123f09d4/tasks/wz2hpfetf.output (4 agents done, 0 errored, 388k tokens, 100 tool calls; key facts re-cited in the findings block below so this plan survives the tmp file's deletion)

### Phase 1 findings (full agent output: the wz2hpfetf task output file; key facts re-cited below)

ALREADY SETTLED (do not re-litigate, feedback_dont_redesign_approved):
- Philosophy EXISTS: PLAN.md D5 three-source axis (STRUCTURE = Fresha Mobbin, BRAND = web DS verbatim, FEEL = Apple-native: SF Symbols, native sheets, springs, glass) + the "one brand rule" + MODERN_BAR.md principles (hierarchy > filled actions > semantic-only color).
- THEMING.md approved 2026-06-15: light Uber / dark Revolut (not inversion), full token map in src/lib/theme.ts, 5-tier button system.
- Haptics WRAPPER exists: src/lib/haptics.ts, 6 verbs (select/light/medium/success/warning/error), 97 call sites. But NO law doc.
- Motion presets exist: src/lib/motion.tsx (springs snappy/gentle/bouncy/smooth; press tiers 0.98/0.97/0.94). Aby motion spec = onboarding-only. No app-wide MOTION law.
- Mobile mockup law: edit the real Expo screen, simulator screenshot, never HTML.

GENUINE GAPS (the new system fills these):
- SOUND: zero. No lib, no assets, no doc mention anywhere. Greenfield.
- SYNC: no porting system; theme.ts hand-copied and ALREADY diverged (web successBg #E8F5E9 vs mobile #F0FDF4 at theme.ts:39; errorBg #FEE2E2 vs #FEF2F2 at :41; radius naming incompatible).
- CONTRADICTION (rule 18): docs say haptics Apple-sparse ("nothing on plain buttons or tab switches") but code fires haptics.light() on most taps / card opens and medium() on primary buttons. Owner must pick.
- Enforcement: mobile has 1 hook (no-decorative-dots) vs web's ~12 gates; no mobile LOCKFILE; foundations-onepager.html still labeled "proposal", tab-bar block stale vs D1.
- No law for: gestures, states doc, accessibility (Dynamic Type deferred, ink3 WCAG flagged unresolved), notifications.

## Phase 2: elicitation

- [x] Send the owner a numbered question battery (sent 2026-07-11, Q1-Q13, recommendation-first; verified: delivered as the closing message of the 2026-07-11 session turn that made commit 0bf7c1efe; the Q1-Q13 text is mirrored verbatim in the BATTERY section below; answers pending)

### BATTERY (verbatim copy of what was sent, so answers can be matched after any compaction)

A. System shape: Q1 consolidate into MOBILE_LOCKFILE.md (rec yes) · Q2 type scale 34/22/17/15/13/11 lock as-is or review screen · Q3 sync = (a) checker script rec / (b) generator / (c) hand-copy · Q4 drifted success/error tints: web wins (rec)
B. Haptics: Q5 (a) Apple-sparse rec / (b) bless generous code / (c) richer · Q6 rule "haptic only on state change or commitment, never navigation/scroll/reveal" approve or reword
C. Sound: Q7 (a) none v1 rec / (b) success-only / (c) rich · Q8 custom vs system chime (only if Q7 not none)
D. Motion: Q9 port list shimmer/SuccessMark/heart-burst/count-bump/cascade/stagger, add or cut · Q10 Aby stays onboarding-only (rec yes) · Q11 Reduce Motion honored app-wide (default yes)
E. Do/don'ts + gate: Q12 pinned CLAUDE.md block (rec) vs separate doc · Q13 gates multi-pick (a) token drift (b) raw-haptics-import (c) inline-spring (d) registry same-turn (e) tokens:check CI (rec all five)
Passing confirm: "nth" in the original ask = typo for "smth"? If it meant notifications/NFC it gets its own box.

### OWNER ANSWERS (2026-07-11, verbatim: "for 1 acc look into it and show me mockups cz rn its ass how it looks like in the app n ion like it 2 no 3 idk 4 show me 5 a 6 ye like haptic everywhere like apple and any modern apps 7 a 8 wdym 9 i want rich motion everywhere 10 i want rich and 11 huh 12 idk 13 idk gimme reccomendation a")

- Q1 PIVOT: no consolidate-first. Owner dislikes the CURRENT look ("rn its ass"): audit the live app + show mockups of a better direction FIRST; LOCKFILE freeze happens after the look is re-approved.
- Q2 = no (don't lock type scale as-is; review it inside the mockups).
- Q3 = idk -> rec stands: checker script (npm run tokens:check).
- Q4 = show me -> tint A/B visual owed.
- Q5 = a (Apple-tier) + Q6 = "ye like haptic everywhere like apple and any modern apps" -> rule approved with pervasive-Apple reading: every state change/selection/commitment ticks; plain navigation taps do not (that IS Apple's model). Consequence flagged to owner: card-open taps lose their tick.
- Q7 = a (no sound in v1). Q8 moot ("wdym" answered in chat: it asked custom-recorded chime vs Apple's built-in system sound, only relevant if sound existed).
- Q9 + Q10 = RICH MOTION EVERYWHERE, app-wide (Aby-tier richness NOT confined to onboarding; the gradient-mesh SKIN still stays onboarding-only, richness of movement goes app-wide).
- Q11 = "huh" -> explained in chat (iOS accessibility setting Reduce Motion); defaulting YES honor it.
- Q12 = idk -> rec stands: pinned block in solen-mobile CLAUDE.md.
- Q13 = idk gimme rec -> all five gates.

## Phase 3a: LOOK FIRST (owner priority: "rn its ass, show me mockups")

- [x] Capture the app's current key screens (verified: 13 PNGs at /Users/sulo/Documents/solen-mobile/_design-system/captures/2026-07-11-current/ , home x3, suche x2, inspo, karte, profil x2, pdp x4; simctl sandbox-blocked so capture = Expo web via metro.config.js maps-stub, both files uncommitted in solen-mobile)
- [x] Diagnose "looks ass" concretely (verified: sonnet agent a4502379cc8f5bd6c full report 2026-07-11 + discriminating greps. REAL defects: PDP Buchen = outline pill violating THEMING tier-2 grey-chip law (SalonServicesSection.tsx:141), Home first fold 44% text/form zero imagery, Home category grid mixes 3+ icon styles incl. D21-rejected 3D, PDP tier headers carry ranges "Express 15-30 Min" vs D8, list monotony, service rows 3 stacked lines. WEB ARTIFACTS (not defects, expo-symbols/SF glyphs do not render on web): "missing" rating stars (SalonCard.tsx:143-146 has star.fill colors.star), "iconless" Profil rows (profil.tsx:95-108 all have SF icons), empty header circles, empty avatar ring. Karte pins-in-flow = maps-stub artifact.)
- [x] Build 3 genuinely distinct treatment directions as mockups of the anchor screen (verified: coder agent a297a4c0d9d226697 built ?v=1/2/3 variant switch on the REAL screens: HomeHeroV1/HomeDenseHeaderV2/HomeCalmHeroV3 + index.tsx wiring + SalonServicesSection PDP fix, tsc clean, ALL UNCOMMITTED in solen-mobile; loop-reviewer a3ace442ca1f264e3 round 2 = PASS on V2/V3/PDP/tint; V1 hero initially showed the stale purple illustration from Metro transform cache, fixed via expo start --clear, re-verified by pixel test purple-ratio 0.0 + main-thread approval view of home-v1-light.png)
- [x] Tint A/B visual for Q4 (verified: src/app/mocks/tint-ab.tsx renders 4 chips, reviewer round-2 item 6 PASS, capture tint-ab-light.png)
- [x] Deliver capture + diagnosis + variants to owner as clickable links (verified: delivery page _design-system/captures/index.html served on :3210, cloudflare tunnel https://latest-bar-jacket-court.trycloudflare.com loads it, checked through the tunnel in the Browser pane 2026-07-11). WAITING on owner picks: Home A/B/C, tint A/B, PDP after ok (mockup-first hard stop, everything uncommitted)

### Round-2 owner picks (2026-07-11, verbatim: "home c more like uber eats idk u get me make me mockups but c and for 3 idk and 4 wtf is ths")

- Home = C direction, evolved "more like Uber Eats" -> C4/C5/C6 sub-variant mockup round (below). Reference forks covered by building 3 interpretations instead of asking (owner: "idk u get me make me mockups").
- Item 3 (PDP before/after) = "idk" -> ADOPT the after (it enforces the already-approved THEMING tier-2 law), flagged for veto in the reply, still uncommitted.
- Item 4 (tint A/B) = "wtf is ths" -> explained in plain words in the reply; DEFAULT = A (web values win, brand source), applied in build phase unless vetoed.

## Phase 3a round 2: C x Uber Eats sub-variants

- [x] Extract Uber Eats home anatomy from _design-system/references/uber-eats-ios (verified: agent ac61590a6ec55d3fe zone spec from the 5 webp captures: 48pt single search pill, 4-tile contained row vs bare carousel, header+arrow rhythm, 64pt dense favorite rows, color-only-in-badges; note its "first content 180-200pt" figure OVERPROMISED, reviewer measured 235-274pt on our build, do not re-cite)
- [x] Build v=4 C-UberTop / v=5 C-Tiles / v=6 C-Dense on the real Home screen (verified: coder a297a4c0d9d226697 report, new HomeUberTopC/HomeUberTilesC/HomeUberDenseC + shared CategoryTextChips/GreetingHeadline extractions, v=0-3 untouched (reviewer pixel-diff: v3 top region byte-identical in c6), tsc clean, ALL UNCOMMITTED)
- [x] Capture + reviewer grade + staleness check (verified: expo restarted with --clear first; 4 capture MD5s all distinct vs v3 (85008b/ac93c4/fadd9e/73a2d6 vs 4b3ef4); loop-reviewer a3ace442ca1f264e3 round 3 = PASS on all items, ranking C6 > C5 > C4; flag raised: "In deiner Nähe" dense list heading nearly duplicates the existing "In der Nähe" map teaser, rename one before ship)
- [x] Update delivery page + same tunnel (verified: index.html section 2b live, fetched THROUGH https://latest-bar-jacket-court.trycloudflare.com via get_page_text 2026-07-11). Owner picked C6 with revisions -> round-3 corrections below

### Round-3 owner corrections (2026-07-11 evening, 7 ss attached IMG_6455-6461: 6x Uber Eats home Basel + 1x Airbnb home; rejection streak 3, all refs read + pixel-extract attempted, auto-detect failed on borderless UI so measurements from direct viewing)

- [x] CORRECTION: tint A/B , owner rejects BOTH ("white and black text inside of a red pill thats so ass, i told you more apple/uber"). Status-chip treatment reopened as Apple/Uber family (Uber refs show tone-on-tone: red-on-pale-red "Great value"); PLAN.md D8b two-tone ban is under owner revision, contradiction surfaced not silently flipped. Delivered: DRIFT_LEDGER entry (status chip) + next mockup round carries ONE status-chip strip in the Uber family. Verified: ledger self-test fired on "status chip tint" prompt.
- [x] CORRECTION: item 3 PDP = "keep current" , the adoption is CANCELLED (owner veto outranks the law argument). The v>=1 variant code stays on disk as a dev-only mock, v=0 ships unchanged. Verified: variant gating confirmed by reviewer round 2 (v=0 byte-identical).
- [x] CORRECTION: mobile search bar must embed the map icon inside-right like the web SearchTemplate bar ("in acc web we have a map icon inside of the search ba, why do u keep forgetting"). Delivered: DRIFT_LEDGER entry (search bar/karte) + binds the next mockup round. Verified: ledger self-test fired on "search bar karte" prompt.
- [x] HARDEN (owner: "cant we make a gate hook or rule abt it, fix the system"): 3 new DRIFT_LEDGER.md entries (status-chip, search-bar-map-icon, mobile-decisions-digest with broad mobile keywords) riding the EXISTING drift-ledger-inject.py UserPromptSubmit channel (reused, not a new hook). verified: commit fc4c903e2 (_design-system/DRIFT_LEDGER.md, entries at lines 12/19/26); self-test run 2026-07-11 with CLAUDE_PROJECT_DIR set: "status chip tint" prompt FIRED, "search bar karte" prompt FIRED, "booking webhook retry" prompt stayed silent. KNOWN GAP: main-repo checkout copy not writable from this sandbox (cp returned Operation not permitted), so main-repo sessions see the entries only after this branch merges (worktree sessions covered now).
- [x] Owner direction question answered ("uber vibrancy + airbnb simplicity + smoothness, conflicting?"): NO , they live on different layers: vibrancy in CONTENT (colorful category icons, promo tags on photos, tone-on-tone chips), simplicity in CHROME (calm white, Airbnb top search placement, soft-shadow depth on pills/filters), smoothness in MOTION (Apple springs). verified: answered in the 2026-07-11 round-3 chat reply AND durably recorded as the "Direction addendum" inside _design-system/DRIFT_LEDGER.md:27 (commit fc4c903e2).
- [x] C7 mockup round (C6 revised): FORK ANSWERED (owner: "the card not search") = hero card dropped, search pill stays. Built behind ?v=7 (HomeUberC7 + SearchPillWithMap map-btn-inside-right + CategoryTileRow treatment="shadow"; tint-ab extended with the Uber-family strip). Verified: fresh loop-reviewer a2f6b4cd00ca84fac graded ALL items PASS, empty punch list (source-cited SearchPillWithMap.tsx:73-80, CategoryTileRow.tsx:94-107, index.tsx:182-207); captures MD5-distinct (c7 d765b758 vs c6 fadd9e80); delivery page section 2c live through the tunnel (get_page_text check). Reviewer chip judgment: (a) tonal, matches the -10% pill family; its "add ink-text variant per web rule 6" nuance SKIPPED, the owner's live rejection of ink-on-pale outranks web rule 6 on mobile. WAITING on owner: C7 ok? chip a/b/c?

### Round-4 owner correction (2026-07-11 late, verbatim gist: "the shapes in In deiner Nähe, making nonexistent weird shit; the icons, you make that up, you didn't even check; what happened to the aspect ratios")

- [x] CORRECTION: "In deiner Nähe" invented 64pt SQUARE thumbnail rows -> REGISTERED SalonCard variant="list". verified: coder a7dd39e1c1ced046a applied it (prior coder was killed before applying), HomeUberDenseC.tsx:58-91 now renders <SalonCard variant="list">, invented row styles deleted; loop-reviewer a3d923508f6bdae32 Part B B2 = PASS (home-c7b-light-scroll1.png shows full-width cards vs old square thumbs).
- [x] CORRECTION: invented glyphs -> SearchPillWithMap.tsx:38 "map"->"mappin"; "Alle" ellipsis tile dropped; CategoryTileRow rebuilt on CategoryRow's exported CATEGORIES. verified: reviewer B1 = PASS (home-c7b shows Karte tile + no Alle). CONTRADICTIONS SURFACED (rule 18, both flagged to owner, NOT silently resolved): (1) suche.tsx:237 has the same invalid name="map" (out of fix scope, flagged); (2) CATEGORIES uses the assets/categories 3D icons that PLAN.md D21 partially rejected , the glass-disc round-5 restyle supersedes the icon question so parked, not forced.
- [x] HARDEN round 4: DRIFT_LEDGER entry "C7 mockup INVENTED shapes + glyphs". verified: entry in _design-system/DRIFT_LEDGER.md, self-test 2026-07-11 "thumbnail aspect ratio nearby list" FIRED / "cron batching reminders" silent.
- [x] Recapture c7 + reviewer re-grade + delivery page update. verified: home-c7b-light.png/scroll1 captured, reviewer a3d923508f6bdae32 Part B all PASS, delivery index.html section 2c repointed to c7b, served through https://calendar-chat-lodging-newark.trycloudflare.com (get_page_text confirmed).

### Round-5 owner ask (2026-07-11 latest, inline reference image: saturated coral-red icon DISC with lighter same-hue RIM, white glyph, gel/glass depth, on sky photo; a pale-blue sibling disc at frame edge confirms a multi-hue SET)

Verbatim gist: "i want more of these color and saturation, even if its blue green yellow, bake that into design system but FIRST make mockup and acc look into it. do u see this two tone thing, the border is a bit clearer, and its giving glass overall. i need this style everywhere."

Reference anatomy (read from the inline image; file not yet synced to ss folder, so no PIL hex sampling , hues will come from LOCKED Solen tokens instead of sampled values, which also satisfies the closed-palette contract):
- saturated hue FILL disc + ~2-3% width RIM of the SAME hue lightened (the "two tone border")
- subtle top-light gradient + soft drop shadow = the "glass/gel" read
- white glyph centered; multiple hues across the set (red seen, blue sibling)
- existing Solen carriers to EXTEND (no new component): GlassCircle / Glass (expo-glass-effect, registry-listed), semantic color tokens (accent #276EF1, success #16A34A, star #FFC32B, save #FF3366, error, surcharge orange)

- [x] Style mockup FIRST (owner order). verified: coder a5cae8fe564126874 built mocks/glass-discs.tsx (6 locked hues x 56/40/32 + status-chip rim section) + GlassCircle.tsx fillTint prop (solid disc, lightenHex rim, expo-linear-gradient top highlight, white glyph; fillTint-unset path byte-identical) + settings.tsx ?v=1 in-context demo; loop-reviewer a3d923508f6bdae32 Part A A1-A4 PASS with PIL rim verification; refinement pass (rim borderWidth 2->3, lighten 0.35->0.42) recaptured, rim now reads as a second tone at 56px (main-thread approval view glass-discs-light.png). On delivery page section 0 + tunnel.
- [x] "acc look into it": style family = tinted extension of the LOCKED GlassCircle, NOT a new component. verified against source: GlassCircle.tsx fillTint prop path (solid disc backgroundColor=fillTint), rim = lightenHex(fillTint,0.42) at borderWidth:3 (line 76 + line 183 per coder a5cae8fe564126874 report), expo-linear-gradient top highlight + existing s.lift shadow, glyph tint=colors.white; the fillTint-unset branch stays byte-identical (reviewer a3d923508f6bdae32 A1-A4 PASS confirms the glass/frost default unchanged). Hues = the 6 locked theme.ts tokens only (closed-palette contract holds).
- [ ] Bake into design system (THEMING.md addendum + registry note + gate keywords) , BLOCKED on owner mockup approval (mockup-first law: not baking until the owner signs off on the glass-disc look). Also carries an EXPLICIT owner-visible caveat: "this style everywhere" REVERSES the mobile 80/17 blue-sparse restraint (THEMING.md / taste rule 3); needs a stated owner yes to the palette-expansion before it becomes law.

### Round-6 owner asks (2026-07-12, verbatim gist: "Everywhere, explain it, everywhere / the c seven expand to seven two with actual mockups / the everywhere thing too / this mockup page I can't zoom or open or click, why did you make this weird ass mockup")

- [x] ASK 4 (delivery blocker): static PNG gallery retired, replaced with the LIVE interactive app via tunnel. verified: cloudflared -> port 8081 up (launch.json "Tunnel (live Expo app 8081)"), https://learning-material-external-passing.trycloudflare.com/mocks/glass-discs loaded live in the Browser pane (get_page_text returned the real screen), owner can click/zoom/navigate the real app.
- [x] ASK 1+3 EXPLAIN + SHOW: "everywhere" scoped concretely (in the reply + built). Applied to the SF-glyph GlassCircle carriers only: search map button = blue disc (mappin), save hearts = pink disc (heart), see-all = ink disc (arrow.right, kept INK per the locked see-all-arrows-ink contract, flagged), discount pill = same-hue green rim. NOT text (names/prices/ratings stay ink, star stays star). Category tiles DELIBERATELY left as tiles (no per-category SF glyph exists; making them glyph-discs = inventing icons, the exact round-4 rejection) , this is a fork surfaced to the owner, not silently forced. verified: coder ab94ba14c9cbfa798 glyph audit (mappin/heart/arrow.right each cited to pre-existing call sites), tsc clean.
- [x] ASK 2: C7 -> C7.2 = v=8. verified: index.tsx variant===8 branch + discMode threading through HomeUberC7(discs)/SalonCard(heartDiscTint,discRim)/SectionHeader(discTint)/UberNearbyList; v=0-7 byte-identical (props default undefined); capture home-c72-light.png MD5 9cde1043 distinct from c7b d41404a1; renders clean (main-thread view: discount pill shows the green rim, hearts are disc-shaped [pink on device, glyph-empty on web]).
- [x] Live tunnel is the delivery. Owner interacts, then picks. Deep links given: /?v=7 (C7), /?v=8 (C7.2), /mocks/glass-discs.

### Round-7 correction (2026-07-12): "why would icons become colored glass" + "we lit have icons in web look into it" + "no push back its obviously weird"

- Note (rule 17, not a deliverable, no file evidence by nature): the icon->colored-disc idea was MINE and wrong; should have self-rejected it (rule 3). Category icons were never the issue.
- [x] INVESTIGATED "we have icons in web". verified: web app/[locale]/_components/homepage/MobileCategoriesRow.tsx:43-48 uses /icons/categories/{scissors,clippers,nails,map,walkin,spa}.png; mobile src/components/home/CategoryRow.tsx:24-29 requires src/assets/categories/ (same 6 files, confirmed via ls); C7's CategoryTileRow.tsx:36 maps over those CATEGORIES. Onboarding-photo usage only in UNPICKED old variants (categoryPhotos.ts importers: HomeHeroV1/HomeDenseHeaderV2/HomeUberTilesC); C7 clean.
- [x] HARDEN: DRIFT_LEDGER entry "STYLE reference read as a literal COMPONENT TRANSFORM". verified: entry present in _design-system/DRIFT_LEDGER.md (top block after header); self-test 2026-07-12 via drift-ledger-inject.py: "apply this glass style everywhere" FIRED, "category icon not a photo" FIRED, "stripe webhook signature" silent.
- [x] OWNER DECISION scope = "Only existing color bits" (most restrained). verified: AskUserQuestion 2026-07-12 returned exactly "Only existing color bits". Means: glossy two-tone ONLY on already-semantic-color elements (save heart pink, discount pill green, status chips). NOT category tiles, NOT palette-wide, NOT icons-to-discs.
- [x] Build v=9 "restrained glossy". verified: coder aeb7fb8df9d4e9843, SalonCard.tsx glossyHeart prop (saved-only pink disc) + discRim, index.tsx variant===9 reuses HomeUberC7 WITHOUT discs (no map/see-all/category discs), glyph audit heart.fill pre-exists, tsc clean; capture home-v9-light.png 657k non-white px (renders, earlier blank was a dying server not a v9 bug), scroll1 shows restrained cards (frosted hearts since nothing saved, treatment shows on save + discounted cards).
- [x] Built the interactive delivery. verified: `expo export -p web` exit 0, /Users/sulo/Documents/solen-mobile/dist/index.html exists (60821 bytes, references _expo/static/js/web/entry-*.js); served on :3211 via `serve --single`; rendered /?v=9 in the Browser pane screenshot (real category icons scissors/clippers/nails/mappin/walkin/spa + C7 structure visible). Interactive build DONE, locally reachable.
- [x] Deliver v=9 interactively on a phone-reachable link. verified: after the session limit-reset RELAXED the egress policy, cloudflared registered an edge connection ("Registered tunnel connection" in cf-try.log) and https://parallel-portfolio-gave-cliff.trycloudflare.com/?v=9 rendered the real app in the Browser pane (screenshot: real category icons scissors/clippers/nails/mappin/walkin/spa + C7 structure, NOT the Cloudflare error page). Confirms the earlier ROOT CAUSE was correct , the sandbox denies cloudflared's edge sockets (port 7844) while allowing curl (443); it was policy, tightened mid-session and relaxed on reset, exactly as diagnosed. Links given to owner: /?v=9 (restrained glossy) + /?v=7 (plain C7). NOTE: static server on :3211 gets reaped on each session boundary; restart it (preview_start "Expo static build (dist)") + the tunnel before promising the link again.

### Round-8 owner correction (2026-07-12: "why is the mockup in dark mode wtf / what is this mockup i cant even see other versions or there is residue of other version even tho i rejected / whats this sloppiness")

Root cause named: index.tsx has a 9-variant ?v= switch (v0-v9) with 7 rejected variant components still imported (index.tsx:11-17); the owner can't navigate versions and rejected ones linger = residue. Dark mode = ThemeProvider.tsx:22 useColorScheme() follows the OS/browser setting; my Browser pane was dark.

- [x] CONSOLIDATE: approved direction is now the SINGLE default home, no ?v= switch. verified: coder a4edd1dab60e5d326 committed solen-mobile f3c063a "Consolidate Home to the approved C7 direction, drop the ?v= mock maze"; index.tsx renders HomeUberC7 (no discs) + SalonCard glossyHeart+discRim + UberNearbyList unconditionally; tsc clean; rendered at plain URL (no param) in the Browser pane.
- [x] DELETE rejected-variant residue. verified: rm'd HomeHeroV1/HomeDenseHeaderV2/HomeCalmHeroV3/HomeUberTopC/HomeUberTilesC/categoryPhotos.ts + orphaned CategoryTextChips.tsx (grep confirmed zero importers); removed v8 disc props (UberHeroCard/discMode/heartDiscTint/mapDiscTint/discTint); grep for all deleted symbols = zero code refs. KEPT HomeUberC7/CategoryTileRow/GreetingHeadline/CategoryRow/GlassCircle/SalonCard glossyHeart+discRim/UberNearbyList/mocks. (REMOVED.md line still owed , note.)
- [x] LIGHT for review: non-destructive ?theme=light|dark override. verified: src/lib/ThemeProvider.tsx:29 reads `useLocalSearchParams<{theme?}>()`, :31 `const scheme = forcedScheme ?? (mode === "system" ? system : mode)` (prod default unchanged = OS-follow when no param). Behavior verified by DISCRIMINATING test: Browser pane forced DARK + localhost/?theme=light rendered LIGHT white bg; tunnel/?theme=light renders light once hydrated (first dark shot was a pre-hydration transient).
- [x] Rebuild + serve + tunnel, ONE clean light link. verified: expo export exit 0, served :3211, tunnel https://butter-recording-cingular-memory.trycloudflare.com/?theme=light rendered the consolidated light home (real category icons as soft-shadow tiles, Top auf Solen + In deiner Nähe, -10% pill with green rim) in the Browser pane. Delivered to owner.

## Phase 3b: build (BLOCKED on the owner's v=9 look sign-off via the LIVE tunnel; tint adoption REOPENED per round-3, PDP adoption VETOED per round-3)

- [ ] MOBILE_LOCKFILE.md consolidation (AFTER the look is re-approved; includes resolving foundations-onepager proposal status + stale tab-bar block + type-scale sign-off)
  - [ ] Philosophy section (D5 axis + one-brand-rule, written up, not re-invented)
  - [ ] Mobile do/don'ts pinned block in solen-mobile CLAUDE.md (Q12 rec)
- [ ] Token checker script npm run tokens:check, web tailwind.config vs mobile theme.ts, CI-wired (Q3 rec + Q13e; divergence winners come from the Q4 tint pick)
- [ ] Haptic law doc: locked moment->verb table, pervasive-Apple rule (Q5a+Q6)
  - [ ] Code sweep to match (strip light() from plain navigation taps; keep selection/commit/outcome ticks; separate loop-run)
- [ ] Sound: record "none in v1" in the law doc (Q7a), revisit note post-launch
- [ ] Mobile MOTION law: rich-everywhere (Q9/Q10), port the web vocabulary as native springs (shimmer/SuccessMark/heart-burst/count-bump/cascade/stagger + entrance recipes), Aby richness app-wide
- [ ] Reduce Motion honored app-wide (Q11 default yes): motion presets + haptics respect the OS setting
- [ ] Five gates for solen-mobile (Q13 rec): (a) token drift (b) raw-haptics-import (c) inline-spring (d) registry same-turn (e) tokens:check CI; each self-tested should-block + should-pass per rule 12.5

## Parked / notes

- "nth" in the owner message read as a typo for "smth" (filler); confirm-in-passing included in the battery close. If it meant notifications/NFC, it gets its own box.
- Mockup-first law binds phase 3 visual outputs; haptic/motion verification needs simulator video or on-device run (Preview tab throttles rAF, reference_preview_tab_raf_throttle).
- Dark mode has no web source; sync system must treat darkColors as mobile-owned (never "synced" from web).
