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
