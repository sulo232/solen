<!-- batch: account restructure BUILD (owner 2026-07-21 "build each one as all full loop ima go sleep") -->
# Account restructure , autonomous overnight build

## THE 5-SCREEN REFERENCE MAP (owner 2026-07-21: "i want these all build, think what we acc need to build")
Grounded in the owner's full Pinterest set (IMG_6646-6650), mapped to Solen , NOTHING invented:

| ref | Pinterest screen | Solen equivalent | state |
|---|---|---|---|
| IMG_6647 | Boards tab (collage grid + chips + suggestions) | /profile "Gespeichert" tab: saved-salon collage grid + Sortieren + "Neu fuer dich" | mockup APPROVED look (pinterest-ref-solen); build = iterate into real /profile |
| IMG_6648 | Public profile (avatar+name+handle+bio+Edit pill, Created/Saved UNDERLINE tabs, warm empty state) | /profile identity header (avatar+name+Edit) above the tabs; warm empty-state copy pattern (the "tons of potential" tone) for Looks/Termine | header placement = OPEN owner fork (minimal row vs 6648-style block); empty-state pattern demoed |
| IMG_6646 | Your account hub (identity card + View/Share profile + settings groups) | /profile/settings , BUILT this sprint (B2, approved). DELTA: add "Profil teilen" button + a Security screen (was already in the recommendations list) | delta queued |
| IMG_6649 | Your account scrolled (Settings/Login/Support groups, external-link arrows) | the same B2 taxonomy (Einstellungen/Praemien/Anmeldung/Support) , BUILT; external-link arrow affordance on Hilfe/AGB/Datenschutz = small polish | polish queued |
| IMG_6650 | Share-profile sheet (profile card + WhatsApp/Copy/Line/Messages/Email/X/Instagram grid) | the REFERRAL share sheet: "Weiterempfehlen" opens a sheet with the invite card + native share targets (navigator.share + explicit targets). Solen's referral backend EXISTS (invite/referral_code) | net-new UI, mockup-first |

Build order after the profile lands: 6648 identity header fork -> settings delta (Share + Security) -> referral share sheet mockup -> external-arrow polish.

Owner 2026-07-21: after the account-flow analysis + the approved Pinterest mockups (B2 settings, profile 3-directions rec=D1 Looks), "build each one as all full loop, ima go sleep." Autonomous: finish, verify each, commit each, never push. Layered loop (coder + loop-reviewer to PASS) per item. Frontend = one coherent pass per item, never parallel.

## Premortem (gate 3)
Top failure modes + mitigations:
1. **Silent no-op / broken data wiring on the profile rebuild.** The current /profile is a server component with careful queries (next-booking hero, counts). A tabbed rebuild could fetch wrong/phantom columns. MITIGATION: reuse the EXISTING working queries (bookings API, favorites page, looks stub) proven by the mockup; keep data fetch server-side, pass to a client tab component; verify with real seeded data + screenshot before commit.
2. **Coder dispatched into the worktree edits the wrong tree.** Files live in the MAIN checkout. MITIGATION: every coder brief uses `/Users/sulo/Documents/solen/...` absolute paths and is told the app code is there.
3. **Payment methods = new surface + Stripe + no approved mockup.** Shipping live card-management code overnight violates mockup-first AND is payment-sensitive. MITIGATION: build the MOCKUP only for approval; do NOT ship live Stripe saved-card code unreviewed.
4. **Gate misfires block coder edits (drift/lang/hue).** MITIGATION: brief coders with the LOCKFILE essentials (14px name, ink #0A0A0A, no em-dash/CAPS, Lucide, Skeleton, gray-sunken selected) so they don't trip gates.
5. **Rebuilding an approved-feeling surface the owner wakes to.** Pre-launch, no real customers, and the owner explicitly said build. MITIGATION: build faithfully to the approved mockups; verify render; commit per item so nothing half-broken lands; if an item fails 3 review rounds, STOP it, revert its commit, leave the mockup + a note.

## Load-bearing unknowns (probe first)
- Does the Skeleton primitive exist + how is it imported? (probe: grep before the bugs coder)
- Third profile tab = Looks (my rec). Owner didn't pick explicitly -> BUILD Looks, surface as a parked swap (D2/D3 trivial to switch).
- Empfehlungen anpassen destination -> /settings/beauty (closest existing). Parked if a dedicated recs page is wanted.

## Out of scope (this run)
- Live Stripe saved-card code (mockup only).
- New backend tables/columns.
- Any push.

## Build order + close conditions (binary)
- [ ] **1. Bugs** (coder loop): (a) /profile/bookings loading = `<Skeleton>` matching the list, NOT a bare spinner. (b) the duplicate "Benachrichtigungen" (hub inbox /notifications vs settings prefs /settings/notifications) disambiguated so the labels are not identical. (c) conservative dedup of hair_type if trivially duplicated (else flag). Close: bookings loading renders skeleton shapes; the two notification entries read differently; git diff surgical.
- [ ] **2. Identity merge** (coder loop): one edit screen (Konto) = Foto + Name + Bio + E-Mail + Telefon, replacing the /profile/edit vs /settings/personal split. Close: one page holds all 5 fields; the other route redirects or is removed; both save paths work; 4 locales.
- [ ] **3. Settings -> B2 list** (coder loop): rebuild /profile/settings to the approved B2 (identity block + icon rows + hairline group dividers + full taxonomy pointing at EXISTING routes: Konto, Empfehlungen, Haarprofil, Benachrichtigungen, Sprache, Formulare / Praemien: Treue, Stempel, Einladen / Anmeldung: Abmelden, Konto loeschen / Support: Hilfe, AGB, Datenschutz). Close: matches the B2 mockup; every row navigates to a real 200 route; rendered-verified.
- [ ] **4. Profile -> tabbed split** (coder loop): rebuild /profile to the approved D1 (tabs Gespeichert/Termine/Looks + search rect + live next-booking block on top + 2-col real-data grid + gear->settings); management rows move to settings (item 3). Close: tabs switch, live block shows the real next booking, grids show real bookings+favorites, gear opens settings; rendered-verified.
- [ ] **5. Payment methods MOCKUP** (orchestrator builds): v2 mockup of an account-level saved-cards screen (Airbnb masked-list + Add pattern) for owner approval. NOT live code. Close: served + in the gallery.

## Progress log
- [x] 1 Bugs , DONE (commit): Skeleton on Termine, notificationPrefs label x4, hair_type deduped. Rendered-verified.
- [x] 2 Identity merge , DONE (commit): /profile/edit = 5 fields; /settings/personal redirects. Rendered-verified.
- [x] 3 Settings B2 , DONE (commit): identity block + Einstellungen/Prämien/Anmeldung/Support, all real routes. Rendered-verified vs mockup.
- [x] 4 Profile split , DONE (commit): /profile = ProfileTabs (Gespeichert/Termine/Looks + live block + search + gear), management moved to settings, title Konto->Profil, bell deduped. Rendered-verified all 3 tabs with real data.
- [x] 5 Payment methods mockup , DONE (commit): served net-new mockup, fetches the REAL GET /api/stripe/payment-methods (backend already exists: GET+POST), honest empty state + labeled example + Add (backed by SetupIntent). set-default/remove flagged as needing a new endpoint. In the gallery. NOT built in code (payments, owner sign-off).

## CORRECTION (owner 2026-07-21): "why black i told you only white for web , harden the gate , its approved"
- [ ] Web is WHITE-ONLY (tailwind.config.js: darkMode removed 2026-05-02, Q62 single light theme). I added prefers-color-scheme:dark to the payment mockup + analysis report, which rendered BLACK in dark mode. FIX: strip all dark-mode CSS from both -> white only.
- [ ] HARDEN: a gate that blocks dark-mode CSS (prefers-color-scheme:dark / data-theme="dark" / near-black body bg) in web mockup/report/app files. Self-test block+pass, then wire.
- [ ] "its approved": build the REAL payment-methods screen (list via GET, Add via SetupIntent), white-only, Solen tokens.

## NEW asks (owner 2026-07-21, mid-turn)
- [x] BUILD payment screen , DONE + committed. /profile/settings/payment: list via GET, Add via Stripe Elements SetupIntent (reused WalkInPaymentForm), settings row + header title + registry/doc. White-only. Rendered-verified: empty state + real Stripe card sheet opens.
- Current post-login behavior (investigated, SignIn.tsx): reads ?redirect (default "/"), lands you on the pre-login deep link; line 49 uses replace (good), but line 98 uses window.location.href = redirect (NOT replace) so the login page can stay in history -> back can return to login = the trap the owner described.
- BENCHMARK (Instagram/Airbnb/Uber, Mobbin, wf_0c2fb699): all avoid the back-to-login trap ARCHITECTURALLY, not with a back handler , login is a MODAL/SHEET or a ROOT-SWAP, never a pushed page, so on success it is replaced out of history. Destination: Airbnb RESUMES the pending action (Reserve->login->back to "Request to book" with dates/price intact) or, if none, lands on explorable Home with a greeting; IG + Uber just root-swap to Home. -> SHARPENED PRINCIPLE: (1) present auth as a sheet/root-swap; (2) on success resume a pending BOOKING if one exists (slot preserved), else go to an explorable surface (home), never a dead-end deep page; (3) login NEVER sits in history. CONCRETE FIX PATH (owner-gated on the destination logic): SignIn line 98 href->replace kills the history trap now; the resume-vs-home destination split is the product fork.
- [ ] BACK-BUTTON / POST-LOGIN principle: after login, ALWAYS land on the HOMEPAGE, ignore the pre-login deep link (redirect param). Owner: "even if the link they clicked before logging in was profile, it should go to homepage when they log in." -> a behavior fix (login redirect -> /[locale]) + a documented principle. (Note: this partly conflicts with the existing ?redirect= UX; owner's call is homepage-always.)
- [x] DEEP-RESEARCH principle. `verified:` written as `_design-system/RESEARCH_METHOD.md`, ten rules R1-R10, each derived from a named case in the 2026-07-28 session rather than invented. Owner asked for it again that day verbatim: "I love the way that you're researching. I need this actually to get into a whole principle for this."
- [ ] OTHER principles: propose a few (plain English).
- [ ] Then GO ANALYZE.
- [x] WHITE-ONLY-WEB gate built + self-tested 5/5 at ~/.claude/hooks/white-only-web-gate.py. Wiring into settings.json is SANDBOX-WRITE-DENIED (global + worktree + main-checkout .claude all locked). Rule made LAW in CLAUDE.md instead; the executable gate is ready to wire with one line when settings is editable.

## CORRECTION 2 (owner 2026-07-21, dislikes what shipped + wants deeper research)
- [ ] POST-LOGIN/BACK , DEEPER: the quick 3-app Mobbin benchmark was too shallow. Owner wants: (a) actually research how other companies do it, (b) think the PSYCHOLOGY, (c) think OVERALL what WE should do. Park the quick mechanism answer; produce a real principle. Ties to the research-principle.
- [ ] RESEARCH PRINCIPLE , must EMBODY that depth (why the owner asked for it): research = deep, psychology-informed, overall reasoning, not a fast skim.
- [ ] PAYMENT EMPTY STATE , owner "dont like the empty states of payment". Look-complaint -> solen-taste-diagnosis (measured walk, named violations) FIRST, then redesign (mockup-first).
- [ ] PROFILE OVERALL DESIGN , owner "the profiles overall the design" (dislikes it). Look-complaint -> solen-taste-diagnosis on /profile FIRST, then propose. Do NOT guess-and-apply.

## DIAGNOSIS (measured this turn, solen-taste-diagnosis)
- PAYMENT EMPTY STATE: CTA at 54% down, 371px (46% of 812) trapped dead space below it; 80px gap message->CTA; muted gray icon disc. Violations: balance/collapse (top-heavy centroid + trapped negative space) + taste rule 5 (muted focal). FIX MOCKUP BUILT + verified: sweep-payment-empty-fix (one centred unit, ink icon, value line, CTA ~24px under). DONE, awaiting owner ok before code.
- PROFILE: 6 distinct font sizes on one screen (22/16/15/14/13/12; floor 3, max 4) = busy/no anchor; 2 tiles + 178px dead space = reads empty on thin data. FIX DIRECTION: collapse to 3-4 sizes; fill thin tabs with a suggestion row (Looks already does). Fix mockup = next (a real redesign, not a guess).

## DEEP POST-LOGIN RESEARCH (wf_39db7441, psychology + patterns) , THE PRINCIPLE
Psychology (Zeigarnik/goal-gradient/cognitive-load/peak-end/prospect-theory, grounded in PSYCHOLOGY.md laws 1/3/8/10): an interrupted booking is an open loop with real motivational pull; reaching the same ROUTE after login is necessary but NOT sufficient , the SELECTION (service/staff/time) must survive the round-trip or the goal-gradient momentum is lost and it feels like a LOSS (looms ~1.3-2x). New user post-login = a small peak (first-impression anchors); returning user = SPEED is the trust signal (no re-onboarding friction). Never a dead-end leaf (lost-in-hyperspace); land on the explorable root when no pending action.
PRINCIPLE: (1) resume the EXACT interrupted state (route + the in-progress booking selection via query/sessionStorage/server draft), (2) else land on the explorable home, never a dead-end, (3) never trap on login (already fixed: replace() not href), (4) differentiate new (warm) vs returning (fast) user.
Full result: tasks/w6awe8gba.output.

## ALL 5 ITEMS DONE (2026-07-21 overnight). Each verified + committed. No push.
Parked for owner: (a) profile third tab built as D1 Looks per my rec, swap to D2/D3 is trivial; (b) Payment methods needs sign-off + a set-default/remove endpoint before real build; (c) Security screen (2FA/pw-last-changed) + verified/unverified chips are the next analysis gaps, not built.
