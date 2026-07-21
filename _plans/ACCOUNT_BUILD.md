<!-- batch: account restructure BUILD (owner 2026-07-21 "build each one as all full loop ima go sleep") -->
# Account restructure , autonomous overnight build

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
- [ ] BUILD payment screen , real code (approved). IN PROGRESS.
- [ ] BACK-BUTTON / POST-LOGIN principle: after login, ALWAYS land on the HOMEPAGE, ignore the pre-login deep link (redirect param). Owner: "even if the link they clicked before logging in was profile, it should go to homepage when they log in." -> a behavior fix (login redirect -> /[locale]) + a documented principle. (Note: this partly conflicts with the existing ?redirect= UX; owner's call is homepage-always.)
- [ ] DEEP-RESEARCH principle: we have none. Owner wants plain-English IDEAS for what a "deep research" principle/process should be. -> propose.
- [ ] OTHER principles: propose a few (plain English).
- [ ] Then GO ANALYZE.
- [x] WHITE-ONLY-WEB gate built + self-tested 5/5 at ~/.claude/hooks/white-only-web-gate.py. Wiring into settings.json is SANDBOX-WRITE-DENIED (global + worktree + main-checkout .claude all locked). Rule made LAW in CLAUDE.md instead; the executable gate is ready to wire with one line when settings is editable.

## ALL 5 ITEMS DONE (2026-07-21 overnight). Each verified + committed. No push.
Parked for owner: (a) profile third tab built as D1 Looks per my rec, swap to D2/D3 is trivial; (b) Payment methods needs sign-off + a set-default/remove endpoint before real build; (c) Security screen (2FA/pw-last-changed) + verified/unverified chips are the next analysis gaps, not built.
