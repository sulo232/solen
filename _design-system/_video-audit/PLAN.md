# Video-driven design-system upgrade — THE BIG PLAN

> Owner directive 2026-06-11 (verbatim intent): watch the 8 YouTube design videos, audit every claim
> in detail, mock up the claims applied to OUR pages (multiple mockups per page, sometimes multiple
> options), get approval, update the design system + CLAUDE.md + memory, then mock up EVERY state of
> every page with the new system, fix the design inconsistencies that exist everywhere, then implement.
> Constraints: **NO dark mode** (we don't have one), **we are a WEBSITE** — NO bottom nav bar, NO haptic
> feedback. Small details matter. Context will compress → this file is the anchor. Mockups in ENGLISH.

## The 8 videos (all by design YouTubers, ~56 min total)

| # | ID | Title | Status |
|---|----|-------|--------|
| V1 | EcbgbKtOELY | Every UI/UX Concept Explained in Under 10 Minutes | ✅ watched |
| V2 | 66oOi9OLMCw | Why the 60-30-10 Rule is RUINING Your UI Designs | ✅ watched |
| V3 | 7cTdCu8HMgM | The DEFINITIVE process to present UIs like a pro | ✅ watched |
| V4 | SfX43uIubj4 | 4 UI Design Hacks to KILL boring designs | ✅ watched |
| V5 | HE4rLEQpiXY | How to think like a GENIUS UI/UX designer | ✅ watched |
| V6 | AH_ugxmLeUM | 7 UI/UX mistakes that SCREAM you're a beginner | ✅ watched |
| V7 | c1TvOcKdBVE | The 8 UI/UX Cheat Codes for INSTANTLY Better Designs | ✅ watched |
| V8 | 14h1VnkQvIc | Master the 3 Types of CRAZY Mobile UI Swipe Interactions | ✅ watched |

(One URL was pasted twice — SfX43uIubj4 — watch once.)

## Phases (in order, with gates)

### Phase 1 — WATCH + AUDIT  ✅ DONE (AUDIT.md complete, 12 ADOPTs synthesized)
- Watch each video (transcript + frames). After EACH video, append its full claim list to
  `_design-system/_video-audit/AUDIT.md` (persist immediately — compaction-proof).
- Each claim gets: what the video says (detail), whether Solen already has it (cite LOCKFILE/SOURCE/CANON
  section or code), gap or conflict, and applicability verdict (ADOPT / ADAPT / REJECT-with-reason /
  ALREADY-HAVE). Filter through locked Solen rules: B&W chrome + sparse blue #276EF1, no dark mode,
  no bottom nav, no haptics, Inter Tight/Inter, ink CTAs, Fresha structure × Uber aesthetic.
- Deliverable: the BIG AUDIT (owner reads this).

### Phase 2 — CLAIM-VERIFICATION MOCKUPS ✅ BUILT (public/_mockups/video-audit/, 6 files) ← AWAITING OWNER APPROVAL
- For each major page, make mockups showing the video claims APPLIED to our real design so the owner
  can judge: home/search, salon PDP, booking wizard (incl. new hair+pay steps), queue tracker,
  walk-in-pay, profile, confirmation, reviews. Multiple options per mockup where the call isn't obvious.
- Also: a "design-system site" mockup (a single reference page showing the system itself — tokens,
  type roles, components — like a living styleguide page).
- Mockup rules (BINDING, from memory): copy of the REAL page with only the treatment changed, never
  a from-scratch redraw; ENGLISH; Lucide CDN icons; kit statusbar glyphs; circled X; no fake data;
  no tracked-uppercase; rich not bland; no dark mode / bottom nav / haptics.
- STOP. Owner approves/punch-lists each.

### Phase 3 — CODIFY (after approval)
- Update `_design-system/` (LOCKFILE/SOURCE/CANON/SCORECARD etc.), CLAUDE.md, and memory with the
  approved rules. New components → component .md + COMPONENT_REGISTRY entry.

### Phase 4 — EVERY-STATE MOCKUPS (gate: owner approval)
- Mock up every state of every page with the new system (empty/loading/error/success/edge), fixing
  the existing cross-page inconsistencies. LOTS of mockups; multiple options where useful.

### Phase 5 — IMPLEMENT EVERYWHERE
- Route-by-route implementation waves per WORK_TYPES.md, commit per verified chunk, verifier loops.

## Standing notes
- Working dir for ALL real edits: `/Users/sulo/Documents/solen` (main checkout, dev :3000).
- Mockups live in `public/_mockups/video-audit/`.
- Tunnel: cloudflared quick tunnel; give clickable links.
- Known inconsistency hotspots to fold into Phase 4 (from prior sessions): mixed card radii/shadows,
  heading sizes drift per page, section spacing rhythm varies, icon sizes inconsistent, empty states
  unstyled on some routes, button height variance, divider vs gap-only lists mixed.

## Phase 3 — CODIFY ✅ DONE (2026-06-11, commit fc04ee3dc)
All approved rules written into LOCKFILE (§1, §1.5, §2.5, §3, §3.5, §11, §13.2/.3/.5/.7, §14, §15, §16),
tailwind (s-accent.deep #1E54B7), CLAUDE.md pointer, memory (project_video_audit_ds_upgrade). Owner picks
logged: sheet bg Option B, 404 Option A typographic, View Transition direct-build. Stepper flipped to
UNIFIED BLUE (supersedes the green default; green = state only).

## Phase 4 — EVERY-STATE MOCKUP INVENTORY (next; one HTML file per page, all states in one scroll)
Per page: default + loading (skeleton) + empty + error + long-content (DS-9) + key interaction states.
1. Home (logged in/out, skeletons, no-results city)
2. Search results (+filters sheet, empty, map)
3. Salon PDP (gallery, services long-names, reviews, closed-salon, walk-in tab)
4. Booking wizard ×4 steps (incl. guest form, slot-taken error, 3DS processing)
5. Confirmation (paid/confirming/in-person + add-calendar)
6. Walk-in-pay (+payBlocked variants) & queue tracker (all 4 nodes + done + tip + review)
7. Profile hub + subpages (haarprofil, vouchers empty/full, notifications, bookings list + cancel sheet)
8. Favorites (empty per DS-12 + filled)
9. 404 / error / offline set (typographic language)
10. Auth (login/magic-link sent/expired)
Each file states which DS rules it exercises; long-content + empty are MANDATORY per §14.3. Owner
approves per page → Phase 5 implements route-by-route.

## Phase 4 punch list (owner, 2026-06-11) ✅ APPLIED (same day) — edits in place, nothing deleted
- 01 home: APPROVED except (a) Walk-in section: keep the CURRENT live style (icon tile + salon cards row), mine was too simplified; (b) Discover/inspiration: study the REAL discover feature and mirror it faithfully.
- 02 search: APPROVED except widget sizes: match the REAL page sizes (measure, don't eyeball).
- 03 salon page: NOT approved (reviews section approved). Keep ALL current live features/sections, full page, new design system applied.
- 04 booking: NOT approved. All features of the real steps, full pages (the datetime step esp. — real calendar, not 5 chips).
- 05 confirmation: "remove the body" + I mix things up — investigate the real BookingConfirmation component, mirror it exactly; ask only if still unclear.
- 06 walk-in+queue: remake as FULL pages incl. the widget (time-progress) — mirror the real queue/[token] + walk-in-pay pages.
- 07 profile: APPROVED.
- 08 subpages: APPROVED except notifications list — redo, "not good at all" (richer).
- 09 favorites: APPROVED except empty-state icons — use the real 3D icons.
- 10 errors: APPROVED; iterate the offline (no-wifi) one a bit.
- 11 login: APPROVED; use ACTUAL brand icons (real Apple/Google logos, not Lucide).
- Then: update design rules + memory, ensure zero contradictions.

### Punch-list application notes (2026-06-11)
- Live-app investigation captures in /tmp/inv (home/search/pdp/booking/walkinpay/queue, full-page).
- "Remove the body" on confirmation decoded: my mockup had invented a grey-tray layout; the REAL
  BookingConfirmation is a white page w/ ONE card (salon row, date block, service, grey total strip)
  + ink Add-to-calendar. Mockup now mirrors the component 1:1.
- Notifications v2 pattern (owner: old one "not good at all"): salon-photo-led cards, blue unread dot +
  inset edge, time right, inline actions (calendar/directions, tap-to-rate stars), New/Earlier groups.
- Walk-in home section: LIVE style kept (compact cards w/ green "Free in ~X" from the real ETA engine +
  "N ahead" + All-walk-ins button). Discover cards: TikTok attribution chip + heart + caption + clap.
- Search widget sizes matched to measured live values (hero 400px, pill 52, chips smaller).

## Phase 4 punch list ROUND 2 (owner, 2026-06-11, late) + SELF-IMPROVEMENT PROTOCOL
**Protocol (owner-demanded, applies from now on):** think as you go; when a live feature is found that a
mockup forgot, FLAG it + ADD a new frame instead of rewriting everything; analyze (measure) instead of
guessing; wire back buttons so mockups navigate; keep annotation text lean.
- 01 home: APPROVED except discovery: keep EXACTLY like live + header arrow opens the discover page.
- 02 search: measure the LIVE widget dimensions precisely (getBoundingClientRect) + apply exactly.
- 03 salon: NO structure changes. 1:1 live order/sections (incl. histogram + verified-booking star rows,
  team-in-card, full-bleed hero). Treatment-only: tokens, blue counts, dots+scrim, normal-case.
- 04 booking ("we already have all of it, iterate"): align frames to the LIVE shipped steps, no inventions.
- Links: ALL interactive text links = DS blue (no grey links, no ink-underline links). Sweep.
- Error copy: every error names the exact cause (email mismatch, password too short). Generic = banned.
- iPhone fit: frames must fit real iPhone viewports (≤390px incl. mini 375) — kit responsive fix.
  Confirmation specifically flagged.
- 06 walk-in/queue: APPROVED.
- 08 notifications: structure ok, TOO MUCH TEXT — one-line bodies, drop extra rows.
- 09 favorites: APPROVED except empty "your first" tile: why blue? → pink heart (save semantic), neutral bg.
- 10 errors: APPROVED; offline: drop the wifi animation, plain typographic "Offline."
- 11 login: APPROVED (final statement; earlier "not good" item read as booking, flagged to owner).

---

# 🧭 HANDOFF / COMPACTION ANCHOR (written 2026-06-11 late, read this FIRST after compaction)

## Where everything lives
- Rules: ALL codified + committed. LOCKFILE §1/§1.5/§2.5/§3/§3.5/§11/§13.2-.8/§14/§15/§16,
  tailwind `s-accent.deep #1E54B7`, CLAUDE.md pointer block, memory
  (`project_video_audit_ds_upgrade` + sharpened `feedback_mockup_first_always` + clarified
  `feedback_no_decorative_artifacts`). §14.4 now also carries the specific-error-copy rule.
- Mockups: `public/_mockups/everystate-v2/` (11 pages + index hub + kit.css). ALL real edits in the
  MAIN checkout `/Users/sulo/Documents/solen`. Mockups committed through `894607f15`.
- Capture tooling: `_design-system/_video-audit/capture/` (capture-home.mjs, investigate.mjs);
  live-page measurement = Playwright `getBoundingClientRect` (NEVER estimate from crops — owner burned me).
  Measured search values: hero/result photos 358×286, cat chips 40px/15px font, filter chips 36px/13.5px,
  search pill 54px.
- Dev server :3000 was RESTARTED (new preview serverId; serves main checkout). The old cloudflare tunnel
  likely DIED with it — start a fresh `cloudflared tunnel --url http://localhost:3000` before sending links.

## Approval matrix (after round-2, owner 2026-06-11 late)
| Page | Status |
|---|---|
| 01 Home | ✅ approved (discovery kept live-style + arrow; walk-in live-style) |
| 02 Search | ✅ fixed to measured live sizes — awaiting re-look |
| 03 Salon | structure locked to live 1:1, treatment-only — awaiting re-look ("you're gonna fuck it up" risk page, touch nothing structural) |
| 04 Booking | aligned to live shipped steps — awaiting re-look ⚠️ plus the open ambiguity below |
| 05 Confirmation | mirrors real component — iPhone-fit fixed — awaiting re-look |
| 06 Walk-in+queue | ✅ approved ("actually quite good") |
| 07 Profile | ✅ approved |
| 08 Subpages | ✅ (notifications text trimmed per round-2) |
| 09 Favorites | ✅ (first-fav tile now pink/neutral) |
| 10 Errors | ✅ (offline = plain typographic) |
| 11 Login | ✅ approved (+ flagged register-errors frame added) |

## OPEN QUESTION for owner (asked, unanswered)
Round-2 said "[X] tab... not good at all, we already have all of it, just iterate" right after the salon
item, then later "login: approved". I interpreted X = BOOKING (iterate on live shipped steps, which I did).
If owner says it was login, redo login as iteration-of-live instead.

## Owner process rules now BINDING (from round-2, don't relearn the hard way)
1. Think as you go; when a live feature is missing from a mockup, FLAG + ADD a frame, never rewrite the file.
2. Measure with the browser, never guess from screenshots/crops.
3. Back/X buttons in mockups must navigate (history.back()).
4. All text links = DS blue, no grey/ink-underline links.
5. Error copy names the exact cause (now LOCKFILE §14.4).
6. Frames must fit real iPhone viewports (kit media query handles it).
7. Lean annotation text; no walls of words in mockup cards (notifications lesson).

## NEXT STEPS in order
1. Owner re-look at 02/03/04/05 (the four reworked pages) + answer the booking-vs-login question.
2. Any punch list → surgical edits only (protocol above).
3. When pages are green → **Phase 5 implementation**, route-by-route waves per WORK_TYPES.md, suggested
   order: (a) global token/link/hover sweep (s-accent-deep hover, blue links, eyebrow deletions, middot
   removals), (b) home (walk-in section is already live-correct; mainly card details row + rhythm),
   (c) search sizes stay AS LIVE (mockup matched live, so little to do), (d) salon PDP treatments
   (dots+scrim, blue counts, normal-case nearby labels), (e) confirmation (already mirrors shipped
   component — verify only), (f) sheets physics (grabber + drag + scale-back into the Sheet primitive),
   (g) 404/error/empty personality set, (h) auth error-copy + brand SVGs, (i) notifications trim,
   (j) View Transitions card→PDP flagship. Commit per verified chunk, verifier loops per CLAUDE.md rule 7.
4. Drift-checker additions queued in LOCKFILE (closed neutral set, radius set, middot, eyebrows) — wire
   into `_design-system/check.py` during Phase 5.

## Phase 5 progress (2026-06-11, autonomous run)
SHIPPED + live-verified, each its own commit:
- DS-6 global blue hover step (globals.css single-point rule; verified computed transition on .text-s-accent links)
- DS-7 SalonCard details row: calendar glyph + bold time/price (homepage/search/favorites callers inherit)
- Banned BARBERSHOP eyebrow removed from WalkInBand
- Typographic 404 (not-found.tsx) + copy x4 locales; typographic crash page (app/error.tsx, killed retired s-coral)
- PDP mobile gallery: dots over DS-10 band replace the n/N counter (SalonHero.tsx)
- Notifications: one-line bodies (line-clamp-1)
- Sheet primitive §16.1: drag-to-dismiss grabber + Option-B page scale-back (#main-content matrix(0.965,…,10) verified live on the reviews sort sheet)
- Middot sweep: no rendered meta middots in live code (only avatar-initial fallbacks, fine)
- Login: already uses official brand SVGs (no change needed)

REMAINING for next session (in order):
1. View Transitions card→PDP flagship (needs Next experimental.viewTransition + React flag — own session, don't bolt on blind)
2. Register/auth: specific error copy per §14.4 in real validation messages (component + i18n x4)
3. DS-5 spacing-rhythm sweep across pages (32/12/16) — mechanical but wide; verify per route
4. DS-9 truncation hardening on remaining surfaces (search result names/addresses)
5. Drift-checker rules: closed neutral set, radius set, middot, eyebrow count (check.py)
6. Scrim recipe on category cards (home discover band already has one; category landings pending)

## Phase 5 run 2 (2026-06-11, autonomous)
1. ✅ 16.3 View-Transitions flagship: next-view-transitions installed, provider in root layout,
   SalonCard photo + PDP first hero photo share `vt-salon-<slug>`; verified live (names match, morph
   path clean). BONUS pre-existing bug fixed: SalonCard hrefs now locale-prefixed (were landing /de
   users on /en via middleware guess + the redirect was killing the transition).
2. ✅ 14.4 register validation: specific password errors (min 8 / digit / uppercase) x4 locales.
3. ◐ DS-5 rhythm: MEASURED — FeedZone box-gaps are uniformly 8px; visual rhythm lives inside each
   section's own padding. Full normalization = per-section verified pass (V3-D322/326 history says
   blind global spacing changes on home get rejected). Queued as its own work item.
4. ✅ DS-9 search truncation: already implemented in SalonResultCard (verified, no change needed).
5. ✅ Drift-checker: A21 tracked-uppercase-eyebrow rule added (A15/A20 middot existed; my dup removed);
   s-accent-deep allowlisted. 26 eyebrows found; the 4 real customer-surface ones FIXED same run
   (SolenStory kicker, Modal + Sheet eyebrow slots de-uppercased, reviews-landing blue eyebrow).
   Footer legal caps / booking-ref code field / LIVE status pill = legit exemptions.
6. ✅ DS-10: search hero gradient top-wash removed (photo clean above the text zone).
REMAINING QUEUE: DS-5 per-section rhythm pass (homepage sections), remaining ~20 eyebrow findings on
dashboard/dev surfaces, A21+A1 sweep of _pending-migration backlog.

## Phase 4b — mockups for the NOT-YET-MOCKED surfaces (owner, 2026-06-11)
Same format as everystate-v2 (kit, full-page, real structure, new rules, states). Files 12+:
12 register (customer + salon variants, birthday, §14.4 errors) · 13 discover/entdecken feed ·
14 category landing (/coiffeur representative) · 15 staff profile page · 16 gift card + packages ·
17 booking lookup + guest manage · 18 walk-in-join + walk-in-tip · 19 reviews landing + salon reviews
subpage states · 20 customer onboarding · 21 account + reset-password · 22 last-minute +
recently-viewed + loyalty. Protocol: capture live route FIRST (Playwright full-page), then draw.

### Phase 4b results (2026-06-11)
Built (everystate-v2): 12 register · 13 discover · 14 gift-card+packages · 15 lookup+onboarding ·
16 account+last-minute · 17 walk-in-tip. All grounded in fresh live captures (/tmp/inv2).
DELIBERATELY NOT MOCKED (flagged, not invented): category landings (same template as 02 search —
live /coiffeur confirmed identical anatomy), staff profile page (needs a real staff id to capture —
capture+mock next session), reviews landing (live page already matches the system post-de-eyebrow),
recently-viewed (built this session, current), loyalty (ComingSoon primitive, fine), reset-password
(trivial form, covered by 11-auth patterns), walk-in-join (route redirects home without params).
LIVE BUGS FLAGGED from captures: packages price renders "24.000 CHF" for CHF 240 (de-CH formatting);
last-minute carries a banned tracked eyebrow + decorative orange dot + uppercase chips; gift-card has
tracked-uppercase EIGENER BETRAG/VORSCHAU buttons; register/lookup "Anmelden" links are ink-underline
(should be DS blue). All queued for Phase-5 run 3.
