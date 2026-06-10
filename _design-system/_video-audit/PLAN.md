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
| V1 | EcbgbKtOELY | Every UI/UX Concept Explained in Under 10 Minutes | pending |
| V2 | 66oOi9OLMCw | Why the 60-30-10 Rule is RUINING Your UI Designs | pending |
| V3 | 7cTdCu8HMgM | The DEFINITIVE process to present UIs like a pro | pending |
| V4 | SfX43uIubj4 | 4 UI Design Hacks to KILL boring designs | pending |
| V5 | HE4rLEQpiXY | How to think like a GENIUS UI/UX designer | pending |
| V6 | AH_ugxmLeUM | 7 UI/UX mistakes that SCREAM you're a beginner | pending |
| V7 | c1TvOcKdBVE | The 8 UI/UX Cheat Codes for INSTANTLY Better Designs | pending |
| V8 | 14h1VnkQvIc | Master the 3 Types of CRAZY Mobile UI Swipe Interactions | pending |

(One URL was pasted twice — SfX43uIubj4 — watch once.)

## Phases (in order, with gates)

### Phase 1 — WATCH + AUDIT  ← current
- Watch each video (transcript + frames). After EACH video, append its full claim list to
  `_design-system/_video-audit/AUDIT.md` (persist immediately — compaction-proof).
- Each claim gets: what the video says (detail), whether Solen already has it (cite LOCKFILE/SOURCE/CANON
  section or code), gap or conflict, and applicability verdict (ADOPT / ADAPT / REJECT-with-reason /
  ALREADY-HAVE). Filter through locked Solen rules: B&W chrome + sparse blue #276EF1, no dark mode,
  no bottom nav, no haptics, Inter Tight/Inter, ink CTAs, Fresha structure × Uber aesthetic.
- Deliverable: the BIG AUDIT (owner reads this).

### Phase 2 — CLAIM-VERIFICATION MOCKUPS (gate: owner approval)
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
