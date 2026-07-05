# Solen.ch — Roadmap & Planning Doc Audit

> Forensic synthesis of every roadmap, prompt, handoff and planning doc ever committed to this repo.
> Generated 2026-04-21. Source: git history across all branches + current tree.

---

## 1. Inventory

Git history shows roughly **140 distinct planning/roadmap/prompt files** have existed. Below is the grouped inventory — every file that carries strategic signal, not just a design tweak list.

### 1.1 Strategic / brand / vision docs

| File | Purpose | Status | Recover via |
|---|---|---|---|
| `_rules/BRAND_BRIEF.md` | "The soul of Solen" — Mediterranean/terracotta vibe brief for AI design tools | **Present** (`ec9ae7f6`) | — |
| `_tasks/SOLEN-IDENTITY.md` | Position statement: "Airbnb's restraint + Fresha's focus + Solen's warmth" | Deleted `25d04c1d` | `git show f7ed0a99:_tasks/SOLEN-IDENTITY.md` |
| `SOLEN_HANDOFF.md` | Definitive Claude Code Handoff V2 — Fresha×Airbnb hybrid spec | Deleted `25d04c1d` | `git show 85494af4:SOLEN_HANDOFF.md` |
| `_docs/solen-concepts.md` | Concept gathering doc | Deleted / moved | `git log --all -- _docs/solen-concepts.md` |
| `_roadmaps/SOLEN-GTM-MASTER-PHASES.md` | 4-phase GTM: UI → Security → Scraping → Ads | **Present** | — |
| `_tasks/BRAND_BRIEF.md` earlier drafts | Earlier brand brief iterations | Superseded | git history |

### 1.2 Moat / competitive-advantage docs

| File | Purpose | Status | Recover |
|---|---|---|---|
| `_roadmaps/roadmap-moat-features.md` | 4-phase moat plan: Chat Intelligence, Client CRM, Loyalty, Solen Score/Gold Pins | Deleted `25d04c1d` | `git show 58087b67:_tasks/roadmap-moat-features.md` |
| `_tasks/roadmap-renewed-v5-moat.md` + `2`/`3` duplicates | V5 moat (glass/blob era) | Deleted | git history |
| `_tasks/roadmap-treatwell-v5.md` | Treatwell-competitor roadmap | Deleted | git history |
| `_prompts/PROMPT-moat-session{1,2,3}.md` | Session prompts for moat execution | Deleted | git history |
| `_prompts/PROMPT-post-moat-session{1,2,3}.md` | Post-moat consolidation prompts | Deleted | git history |

### 1.3 Mobile / UX roadmaps

| File | Purpose | Status |
|---|---|---|
| `CLAUDE_MOBILE_UI_PLAN.md` → `_plans/CLAUDE_MOBILE_UI_PLAN.md` | Mobile UI plan | Moved, present in `_plans/` |
| `ROADMAP_MOBILE_UI.md` | Mobile UI roadmap | Deleted |
| `_roadmaps/CLAUDE_UX_ROADMAP.md` | 4-phase UX polish (menus, glassmorphism, dark mode, micro-interactions) | **Present** |

### 1.4 V5 zone roadmaps (now retired)

Eight `_tasks/roadmap-v5-zone{1..8}-*.md` files — hero, categories, salon card, navigation, glass, motion, layout, category pages. All **deleted** in consolidation. Zones 1–8 language is formally retired per current `CLAUDE.md`.

### 1.5 Deep-dive v3 audits

~14 `_roadmaps/roadmap-*-v3-deep-dive.md` files covering auth, category page, checkout, dashboard, discover, booking flow, homepage, ki-empfehlung, last-minute, loyalty, onboarding, partner, salon-profile, global components. Largely deleted in `25d04c1d`.

### 1.6 Feature roadmaps still live in current tree

`_tasks/`: `BACKEND_NEEDS_UI.md`, `REDESIGN_INVENTORY.md`, `INCOMPLETE_FEATURES.md`, `AGENT-PROMPTS.md`, `SOLEN_DESIGN.md`, `CLAUDE_DESIGN_PROMPT.md`, `DESIGN_AUDIT.md`, `DESIGN_AUDIT_MASTER.md`, `INVENTORY_FULL.md`, `OVERNIGHT_LOG.md`.

`_roadmaps/` (present): `HOMEPAGE-COMPONENT-ROADMAP.md`, `ROADMAP_docs.md`, `roadmap-card-interactions.md`, `-critical-fixes.md`, `-css-foundation.md`, `-empty-states-discovery.md`, `-error-handling.md`, `-header-nav-polish.md`, `-homepage-v6-rebuild{,-v2}.md`, `-homepage-visual-polish.md`, `-salon-i18n.md`, `-search-flow-redesign.md`, plus `design-and-ui/`, `features/`, `tech-debt/` subfolders.

`docs/roadmaps/` (10 files, parallel tree): 01-search-and-filters → 10-vouchers-promos-deals. Clean numbered sequence — appears to be the newer, more authoritative set.

`docs/superpowers/plans/` — dated plans: `2026-03-31-airbnb-fresha-homepage-polish.md`, `2026-04-01-booking-flow-implementation.md`, `2026-04-04-homepage-vision-v2.md`, `2026-04-04-remotion-promo-reel.md`.

`docs/audit/fresha-airbnb-solen-audit-part{1..5}.md` — 5-part audit series, still present.

### 1.7 Key deleted strategic SHAs

- **`25d04c1d`** "consolidate to single coral source of truth" — mass-deleted 12 `_tasks/roadmap-*.md` + 23 `_prompts/PROMPT-*.md` + `SOLEN-IDENTITY.md` + `SOLEN_HANDOFF.md`.
- **`6cbbafd5`** "strip cream/blob/wash/syne — white-first, slop-free rewrite" — killed cream palette era.
- **`b08e2345`** merge that reconciled parallel sessions (one branch restored cream/coral, main had stripped it).

Any deleted doc is recoverable via `git show <sha>:<path>` — history is intact.

---

## 2. Market scope — what IS the target?

### 2.1 Geographic scope — consistent across every era

> "Launch market Basel, expanding to Zürich + Bern." — `CLAUDE.md` §1 (current)
> "Basel's beauty platform. Swiss intimacy at Airbnb-level quality." — `SOLEN-IDENTITY.md`
> "we're not trying to be global. We're your neighborhood." — `SOLEN-IDENTITY.md`
> "from Basel, for the Swiss." — same

GTM Phase 3: scrape **Basel** salons from Google Maps. Phase 4: Meta + Google ads targeting **"Coiffeur Basel" / "Nails Basel"** — no hint of DACH or EU expansion pre-traction.

**Verdict: Swiss-only. Basel first, Zürich + Bern second. No DACH, no EU, no global.** Every doc agrees.

### 2.2 Vertical scope — beauty/personal-care, six verticals locked

Current `CLAUDE.md`: "Categories: Coiffeur, Barbershop, Nails, Spa, Makeup, Waxing."

Per-category modules already in code: `components/barber/` (8), `components/nail/` (14), `components/coiffeur/`, `components/spa/`, `components/makeup/`, `components/waxing/`. REDESIGN_INVENTORY confirms 6 verticals. No roadmap mentions fitness, medical, tattoo, wellness-retreats — wellness lives as "spa" inside the six.

**Verdict: Beauty + personal care, six verticals. Not wellness-broad, not fitness, not a universal services marketplace.**

### 2.3 User scope — two-sided marketplace, always

- **Consumer app (`solen.ch`)**: discovery, booking, favorites, last-minute, loyalty, referral, vouchers, discover/inspo, compare.
- **Partner / dashboard (B2B)**: 28 dashboard pages, 72 `components/dashboard/` files, onboarding wizard, calendar drag-drop, CRM, notifications, analytics, staff mgmt.

GTM Phase 3 introduces a third class: **"passive / scraped profiles"** — directory listings for non-partner salons with *no booking button*, only a "claim this salon" CTA. `salons.source` column distinguishes `scraped` vs `partner`.

**Verdict: Two sides + a directory-SEO long tail that funnels into the partner side.**

### 2.4 Timeline

No dated launch in any doc. GTM phases are sequential, not dated. `docs/superpowers/plans/` uses 2026-03/04 dates — design polish and booking flow still in flight at that point. Current state (2026-04-21): in redesign, Vercel auto-deploy *disabled* from main (`1f3036de`). Pre-launch.

---

## 3. Features planned (chronological)

Derived from oldest committed roadmap to newest. Status inferred against `REDESIGN_INVENTORY.md` (325 API routes, 91 pages).

**Shipped (backend + UI working):**
- Consumer: Google+email auth, salon discovery, 6 category pages, `/salon/[slug]`, `/search` (AI-powered), booking wizard (service→staff→date→time→confirm→payment), Stripe checkout, favorites, compare, `/discover` (42 components!), `/angebote` last-minute, `/compare`, `/confirmation`, `/bookings`, `/termine`, `/profile` (+ 7 sub-routes), `/vouchers`, `/loyalty`, `/referral`, `/fuer-salons`, `/warum-solen`.
- Salon: 28 dashboard pages, calendar, bookings, staff, chat with media, client notes, price offers in chat, dispute API, loyalty stamps, reviews + replies, onboarding wizard.
- Infra: i18n (de/en/fr/it), PWA + manifest + SW, pgvector search, Mapbox, PostHog, Upstash, Resend, seven.io SMS, Gemini, fal.ai, 18 cron jobs, 7 Supabase edge functions.

**Shipped but needs UI polish** (per `BACKEND_NEEDS_UI.md`):
- Salon card badges auto-assignment (`/api/admin/badges/auto-assign`)
- Solen Score display (backend exists at `/api/analytics/solen-score`)
- Off-peak deals banner (`/api/salons/[slug]/off-peak-today`)
- Package redemption, promo/gift/referral codes in cart
- Group booking, guest checkout, service add-ons
- Beauty profile, loyalty QR, payment methods list, referral stats, GDPR-deletion modal
- Nail: material / shape / length picker, inspo boards, hand chart, allergy banner
- Barber: walk-in queue, wait-time countdown, remote join, express rebook, cut history, loyalty QR

**Planned but not started:**
- Moat Phase 1: Chat quick-reply chips, AI suggested replies, photo-based quoting, chat photo gallery tab
- Moat Phase 2: Client allergy/preference tag system + booking warning banner
- Moat Phase 3: Animated stamp card with confetti, stamp progress on SalonCard, salon-side "almost there" pop-up, email nudge
- Moat Phase 4: Solen Score (0-100), Gold map pins for top salons
- GTM Phase 3: Basel Google-Maps scraper → passive profiles → claim flow
- GTM Phase 4: Meta/Google ads, "Give 10 CHF, Get 10 CHF" referral activation

**Cancelled / retired** (explicit):
- Dark mode (killed, per `BACKEND_NEEDS_UI.md` "DECISIONS ALREADY MADE")
- Blob backgrounds everywhere (now restricted per BRAND_BRIEF §5)
- Glass everywhere (restricted to 3 contexts)
- 3:2 cover photos (now 1:1 square, locked 2026-04-20)
- V5 zone 1-8 vocabulary
- V2 green+peach palette / Plus Jakarta / Phosphor icons
- Old coral `#FF6B6B`, cream `#FAF6EF` (the extreme one), wine-red, teal, Syne for body

---

## 4. Strategic moves — the moat thinking

From `roadmap-moat-features.md`, `BRAND_BRIEF.md`, and `SOLEN-IDENTITY.md`:

**Product moats** (things Fresha/Treatwell/Planity can't copy in a sprint):

1. **Chat as a product**, not a utility. Quick-reply templates, AI suggestions, photo-based quoting ("📸 send a photo, get a price") tied directly to the Gemini key already wired in. `ChatWindow.tsx` + `price_offers` table already exist.
2. **Client safety tags** — allergy warnings surfaced to the salon on every booking detail (never to customer). Genuine liability reduction for salons.
3. **Loyalty that feels good** — per-salon stamp cards with CSS confetti + "almost there" nudge email. Driven by `/api/loyalty/` and `loyalty` page already shipping.
4. **Solen Score + Gold pins** — 6-factor quality score, top salons get gold map pins. Status/prestige layer Fresha doesn't have.
5. **AI-native discovery** — `/discover` has 42 components; `components/nail/` has fal.ai-powered nail art generation. pgvector search already live. Gemini also powers intake forms and chat suggestions. "AI-art in beauty booking" is a defensible wedge.
6. **Hyperlocal Swiss warmth** — Basel-first positioning, "dein" voice, coral+cream palette, Mediterranean/terracotta brand soul. Not a moat alone, but a brand that foreign players won't authentically replicate.

**Data / network advantages** (early):

- Scraped-directory flywheel: every Basel salon gets a passive profile → SEO traffic → claim pressure → partner conversion.
- pgvector across salon/service corpus → improves with every booking.
- PostHog event stream + 18 crons → behavioural data for ranking.

**Platform bets**: PWA + floating nav pill = "app-like web" so they never need to ship native day 1.

---

## 5. Retired directions

Documented pivots, in order:

1. **V2 palette** (green `#1B4D1C` + peach + Plus Jakarta + Outfit + Phosphor icons) → killed. Now only referenced in CLAUDE.md "DO NOT reference" list.
2. **Dark mode** — shipped partial, killed in redesign (`BACKEND_NEEDS_UI.md` "DARK MODE: KILLED").
3. **Glass-everywhere** (the "premium Apple" aesthetic from `CLAUDE_UX_ROADMAP.md` Phase 2) → restricted to 3 contexts only.
4. **Blobs in every section** → restricted per BRAND_BRIEF §5 (hero/empty-state/splash only).
5. **V5 zone vocabulary** (Zone 1/2/3/4) → retired in favour of plain section names.
6. **Cream-heavy palette + Syne headings** — stripped in `6cbbafd5` ("white-first, slop-free rewrite"), then partially restored via `b08e2345` merge. Final resting state: coral on white with cream as optional warm accent; Bebas display + Syne reference for §3.2 of old spec but BRAND_BRIEF re-embraces warm feel.
7. **Fresha-hard-pivot** ("pure white, zero shadow at rest, 40ms stagger") from `SOLEN_HANDOFF.md` was aggressively executed (commits `cc00b8d4`..`5feaa99d`, glow removal, transparent header, DM-Sans-for-headings) — then softened. Current SOLEN_DESIGN.md is the reconciliation.
8. **Separate moat roadmap execution** — planning docs (all `PROMPT-moat-session*.md`) deleted. Moat features are *not currently in flight*; they live as a backlog wish-list.

---

## 6. Open threads — planned but not shipped and not in INCOMPLETE_FEATURES.md

Current `INCOMPLETE_FEATURES.md` contains only one entry (Last-Minute Notify Me). These moat/roadmap items are NOT logged there but were clearly planned:

- **Chat**: quick-reply template chips, AI suggested replies banner, photo→price-offer linking, chat photo gallery tab
- **CRM / Safety**: `client_tags` table + API + dashboard UI + booking warning banner
- **Loyalty**: confetti stamp card animation, stamp progress pill on SalonCard, almost-there email, salon-side pop-up
- **Ranking**: Solen Score computation + display, gold map pins
- **GTM**: Basel scraper, `salons.source` column, passive-profile claim flow with business-email verification, JSON-LD injection, sitemap auto-gen + GSC submission
- **Payments safety** (GTM Phase 2.1): Stripe-before-DB race condition, double-submit debounce on confirm
- **Perf**: middleware role-check caching (300ms+ on every dashboard load)
- **I18N leaks**: `BookingCalendar.tsx` + `TerminePage.tsx` hardcoded German strings
- **Profile**: loyalty query selecting non-existent columns (silent failure)
- **Referral**: "Give 10 CHF, Get 10 CHF" wiring (page exists, program inactive)
- **Homepage**: category affinity reordering, recently-viewed carousel, section-toggle respect, tutorial tour, trending salons section, city-salon-count card
- **Barber**: walk-in queue, remote join, rebook, cut history, QR loyalty — backend shipped, UI missing
- **Nail**: material/shape/length picker, hand chart, inspo board, allergy banner, retail POS — backend shipped, UI missing
- **Dashboard extras**: activity feed, notification panel, Ctrl+K command palette, heatmap, staff comparison

`INCOMPLETE_FEATURES.md` should be expanded to reflect these. Treating one silent 400 as the only incomplete item under-represents reality by ~40 items.

---

## 7. Verdict — what IS Solen?

Five bullets, based on the totality of evidence:

1. **Solen is a Swiss-only, Basel-first, two-sided beauty-and-personal-care marketplace across six verticals (coiffeur, barber, nails, spa, makeup, waxing).** Zürich and Bern are the stated expansion, not DACH. Not a global play, not a wellness-broad play.

2. **It is a Fresha/Treatwell/Planity competitor positioned on warmth, locality, and AI depth — not price or scale.** Brand voice is "your neighborhood salon", not "1 billion appointments". The moat is product-depth (chat intelligence, client safety tags, loyalty UX, Solen Score, AI nail art, AI chat assist, pgvector search), not network size.

3. **The product is ~80% built and ~40% polished.** 325 API routes, 91 pages, 200+ components, 6 vertical modules, Stripe Connect, PWA, 4-language i18n — all shipped. The current phase is a design consolidation (coral/white/DM-Sans source-of-truth) and a long backlog of backend-without-UI features. Launch is gated on polish + Basel salon seeding, not on feature build-out.

4. **The GTM plan is explicit and conservative**: polish UI → plug payment/i18n bugs → scrape Basel salons into passive profiles → convert scraped salons into partners → only THEN turn on Meta/Google ads (with a ≥5-10 high-quality partners threshold) and the 10-CHF referral loop. Vercel auto-deploy is currently disabled from main — they are not shipping live.

5. **The defensibility thesis is Swiss warmth + chat-native AI + local SEO long-tail.** Scraped directory of every Basel salon drives organic search → only partner-claimed salons can be booked → Fresha can't copy the "Mediterranean/terracotta" brand, and Treatwell can't copy the Gemini-wired chat + fal.ai nail-art stack without rebuilding. Everything else (loyalty stamps, reviews, last-minute, compare) is table stakes they need to match the incumbents.

---

*File written to `_tasks/ROADMAP_AUDIT.md`.*
