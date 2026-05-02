# Solen Design Audit — Every Iteration That Has Ever Existed

Generated 2026-04-21 from forensic git archaeology.
All findings sourced from commits, branches, and resurrected HTML files.

---

## TL;DR — 6 distinct design systems have lived in this repo

| # | Design system | Era | Key markers | Status |
|---|--------------|-----|-------------|--------|
| 1 | **"Vite-era home.html"** (wine + gold) | earliest | Wine `#9B1D30` · Gold `#D4AF77` · DM Serif Display + Caveat + Space Grotesk · 14,612-line monolithic HTML | **Archived** — now at `public/home-archive.html` |
| 2 | **"V5 Component Map"** (coral + Syne + glass) | Mar 2026 | Coral `#E8624A` · Syne · glass-frost everywhere · Zone 1/2/3/4 | Superseded |
| 3 | **"R7/R8 homepage redesign"** (glass header, inline trust stats) | Mar 2026 | Glass header, trust stats, grain bg, cinematic hero | Superseded |
| 4 | **"Fresha-inspired clean"** (flat white, no glass) | Apr 13 2026 | White bg, no glass, no blobs, no Syne (phase-2 removed), coral as only accent | **Active on fresha-overhaul branch** |
| 5 | **"Claude-main white-first slop-free"** (parallel sesh) | Apr 21 2026 | White, kill blobs+Syne+coral-glow, add PageState primitive | **Active on origin/main (now merged)** |
| 6 | **"Agitated-Kapitsa coral revert"** (current — what we built) | Apr 20-21 2026 | Coral `#E8624A` + cream `#FAF6EF` + Bebas + Fraunces + DM Sans · single SOLEN_DESIGN.md · `public/solen-coral.html` preview · square cards | **Active on main after merge** |

**Current state on `main`: #6** (our coral revert) — merged over #5. But the **production code** (`app/globals.css`, `components/SalonCard.tsx`, `HomePage.tsx`) still contains remnants of **#3 + #4** because we never ported #6 into Next.js.

---

## 📜 Chronological design-iteration log (last 40 design-related commits)

| Commit | Date | Summary | Bucket |
|--------|------|---------|--------|
| `b08e2345` | 2026-04-21 | Merge: reconcile parallel design sessions | #5+#6 |
| `25d04c1d` | 2026-04-21 | design: consolidate to single coral source of truth | **#6** |
| `6cbbafd5` | 2026-04-21 | design: strip cream/blob/Syne — white-first slop-free rewrite | **#5** |
| `1f81b5ca` | 2026-04-20 | design: add canonical interaction utility classes | #5 |
| `01887328` | 2026-04-20 | design: rewrite DESIGN_SYSTEM.md as defaults+escape-hatch, split reference | #5 |
| `8fbc24cd` | 2026-04-20 | design: add `/design-system` visual reference route | #5 |
| `40387d62` | 2026-04-20 | design: consolidate system + lock salon cards to 1:1 | #5 |
| `0de8582c` | 2026-04-20 | design: enforce system-wide — active:scale, motion tokens, coral lock | #5 |
| `cb6eaaa0` | 2026-04-17 | VISIBLE: transparent header on homepage | **#4** |
| `df6c3e88` | 2026-04-17 | VISIBLE: hero gradient + enhanced gradient depth | #4 |
| `9b535dda` | 2026-04-17 | VISIBLE: hero 44px, section headings 28px, card padding 20px | #4 |
| `18cacc62` | 2026-04-16 | phase 2: SalonOpeningHours — glass → solid white card | #4 |
| `8f018e0e` | 2026-04-16 | phase 2: remove shadow-coral-glow from all buttons (69 files) | #4 |
| `84b9e98c` | 2026-04-16 | phase 2: remove img-hover-zoom from SalonCard | #4 |
| `af1699d9` | 2026-04-16 | phase 2: homepage spacing 64px + remove ALL hover translateY (15 files) | #4 |
| `eb4bef61` | 2026-04-13 | **feat: redesign homepage with Fresha-inspired clean aesthetic** (the big one) | #4 |
| `1df35be3` | 2026-04-13 | phase 1.1-1.2: button radius 12px, Fresha shadows, card hover shadow-only | #4 |
| `e1d73fbe` | 2026-04-13 | phase 1.3: strip entrance animations from card grids | #4 |
| `f7ed0a99` | 2026-04-12 | session: coral sweep + card 4:3 + CSS vars | #3→#4 transition |
| `688347bf` | 2026-04-11 | fix: polish pass — spacing, typography, hero sizing | #3 |
| `f07a3c28` | 2026-04-11 | fix: design token compliance — white bg, correct coral, **Syne titles** | #3 |
| `85d4b37b` | 2026-04-10 | fix: full design spec compliance — colors, card structure, animations | #3 |
| `32049aed` | 2026-04-09 | feat(R7-8): homepage redesign — glass header, inline trust stats | **#3** |
| `45fa17b8` | 2026-04-09 | feat(R7-7): partner CTA dark card — coral glow, frosted stats | #3 |
| `5e80927d` | 2026-04-08 | Homepage component map V5 rebuild | **#2** |
| `f39d5128` | 2026-04-08 | fix: complete Component Map V2 audit fixes | #2 |
| `6fe332e4` | 2026-04-07 | feat(R7-3): wire HomepageHero + LastMinuteStrip + hero-cinematic bg | #2 |
| `c64fc3d6` | 2026-04-06 | Reapply grain background | #2 |
| `67dfb345` | 2026-04-05 | fix: complete hex color migration to design tokens (Rule 48) | #2 |
| `7a625d1b` | 2026-04-04 | refactor: standardize hover/active interaction patterns (R6 Phase 6.3) | #2 |
| `ff70b2d9` | 2026-04-02 | feat(homepage): **Airbnb-style redesign** — search bar, icon category row, per-city carousels, sticky text tabs | pre-#2 |
| `5f31c5c0` | 2026-04-01 | docs: add Airbnb/Fresha homepage polish design spec | pre-#2 |
| `86b4af09` | 2026-03-30 | docs: archive monolith, unify design system, organize tasks, add UI roadmap | pre-#2 |
| `b2a9cb67` | 2026-03-15 | fix: restore homepage by serving Vite app via iframe from public/home.html | **#1** |
| `e8b43558` | 2026-03-13 | feat: integrate React micro-frontends via Vite | #1 |

---

## 🌿 All branches that have design divergence

| Branch | Latest commit | What's distinct |
|--------|--------------|-----------------|
| `main` (current) | `b08e2345` | Merged state — has our #6 coral + main's #5 additions |
| `fresha-overhaul` | `cb6eaaa0` | **#4 Fresha-clean** — white bg, transparent header, gradient hero, no Syne |
| `claude/agitated-kapitsa` | `b08e2345` | Our session (same as main after merge) |
| `origin/modern-ui-design` | `269a8408` | Parallel #4 attempt — different HomePage.tsx w/ framer-motion, TrustStatsBanner re-added |
| `origin/claude/frosted-glass-components-EiGsa` | `8dcc9f87` | Glass-forward variant (Figma MCP) |
| `origin/claude/homepage-component-map-Wkrsu` | `f39d5128` | **#2 V5 Component Map** |
| `origin/backup/2026-03-08-ui-features` | `4ea3c588` | Pre-redesign state w/ Beliebt sort, max-price slider |
| `origin/backup/2026-03-08-bugfixes` | — | Pre-redesign bug fixes |
| `origin/backup/2026-03-08` | — | Earliest full backup |
| `origin/feature/customer-frontend` | `28c4e5f9` | Phase 6/7/8 customer features (ChatWindow, TutorialTour) |
| `origin/feature/salon-dashboard` | `0915a9d6` | Dashboard Dev 1/2/3 backend |
| `origin/moat/session3` | `58087b67` | Review reply badges, chat CRM tags, moat features |
| `origin/feature/salon-booking-phase2-7` | (local worktree) | Booking phase 2-7 |
| `origin/feature/salon-detail-page` | (local worktree) | Salon detail redesign |
| `skill-consolidation` | — | Agent skill housekeeping |
| `origin/vercel/react-server-components-cve-vu-w30cgd` | — | Vercel security patch branch |

---

## 📄 Archived HTML previews (resurrected from git)

### `public/home-archive.html` — the Vite-era monolith (**#1**)
- **14,612 lines** of self-contained HTML/CSS/JS — was the entire homepage
- Committed 2026-03-15 (`b2a9cb67`)
- Lifted into `public/` **right now** so you can view at `http://localhost:3000/home-archive.html`
- Design language — **completely different from today**:
  - Background: `#F9F5F0` (creamier, more beige)
  - Primary: wine red `#9B1D30`
  - Secondary: gold `#D4AF77`
  - Teal accent `#4ECDC4` + coral `#FF6B6B` (for chat/badges/commission)
  - Fonts: **DM Serif Display** (display) + **Caveat** (cursive accent) + **DM Sans** + **Space Grotesk** + **JetBrains Mono**
  - Glass tokens baked in: `--glass-bg:rgba(var(--surface-rgb),0.88)` + `blur(20px) saturate(160%)`
  - 7 category tokens: hair/barber/nails/spa/makeup/cosmetik/tattoo (tattoo is gone in current system)
  - Trust-green `#0f766e`, mustard `#ca8a04`, sage `#8FAF8F`, urgency-green `#2d7a4f`
- **This is a totally different visual universe.** Worth opening to see what was once considered.

### `public/solen-coral.html` — our current Phase 1 preview (**#6**)
- Current coral+Bebas+Fraunces+DM Sans system
- 900 lines
- Square 1:1 cards, blobs on hero/dark sections/Instagram only, grain overlay
- Live design lab

### `public/variations.html` — card variants A-E (built last round)
- 5 card layouts side-by-side
- Stack preview of 3 category rows using Variant B (no-box cards)

### `public/offline.html` — PWA fallback (unrelated)

---

## 🔬 Notable deep-dives

### The "Fresha Redesign" (commit `eb4bef61`, Apr 13) — 10 files, -1450/+1078
Rewrote:
- `app/globals.css` (324 line delta)
- `app/layout.tsx`
- `components/HomePage.tsx` (250 lines changed)
- `components/BrowseByCitySection.tsx` (201 lines changed)
- `components/TestimonialCarousel.tsx` (150 lines changed)
- `components/TrustStatsBanner.tsx` (214 lines changed)
- `components/layout/Footer.tsx` (245 lines changed)
- `components/layout/Header.tsx` (**628 lines changed** — biggest single-file delta)
- `components/ui/FeaturedSalonCarousel.tsx` (232 lines changed — the per-category carousel)
- `components/ui/HomepageHero.tsx` (276 lines changed)

**This commit is your Fresha-clean version.** Everything that followed (`phase 1.1-1.2`, `phase 2:*`, `phase 2a-2b`, `VISIBLE:*`) was polish.

### The "Component Map V5" (commit `5e80927d`, Apr 8)
An earlier attempted system — coral + Syne + glass everywhere. `f39d5128` did audit fixes. Superseded within 5 days by Fresha redesign.

### The "Airbnb-style homepage redesign" (commit `ff70b2d9`, Apr 2)
`feat(homepage): Airbnb-style redesign — search bar, icon category row, per-city carousels, sticky text tabs` — this is when **the per-category carousel pattern first landed**. It's what `FeaturedSalonCarousel.tsx` still reflects today.

### The 20-commit "phase 2" cleanup sweep (Apr 13-16)
Touching almost every file to strip the old glow-heavy system:
- `phase 2: bg-s-coral → bg-s-coral-button across 57 app/ page files`
- `phase 2: remove shadow-coral-glow from 20 app/ page files`
- `phase 2: remove shadow-coral-glow from all buttons (69 files)`
- `phase 2: replace coral glow boxShadow with var(--shadow-rest) on 15 files`
- `phase 2: remove img-hover-zoom from SalonCard`
- `phase 2: homepage spacing 64px + remove ALL hover translateY (15 files)`

**Translation:** the codebase was *aggressively de-glowed* a week ago. The glow complaint from today suggests some of those phase-2 changes haven't propagated everywhere.

### The 9 `DESIGN_SYSTEM.md` rewrites in a month
The canonical doc has been fully rewritten 9 times between March 30 and April 21. Each "rewrite" represented a significant direction change. No wonder things feel "tangled."

---

## 📂 HomePage.tsx line counts across branches (proxy for scope)

| Branch | HomePage.tsx lines |
|--------|-------------------|
| HEAD (ours) | 192 |
| origin/modern-ui-design | 217 |
| origin/claude/homepage-component-map-Wkrsu | 263 |
| origin/fresha-overhaul | — (empty / uses different pattern) |

Different structures across branches. Worth comparing side-by-side if we want to steal good ideas.

---

## 🧭 What you should take away

1. **The per-category carousel pattern is fully built** (`FeaturedSalonCarousel` + `HomePage.tsx`'s `visibleSections.map` loop) since April 2. User memory accurate.
2. **The Entdecken page is fully built** at `/discover` + `/discover/[id]` + `/discover/nails`. 42 components in `components/discovery/`. Masonry grid, category filter tab, like/save/share buttons, AI descriptions, style pills, salon scripts, cut guides — all exist.
3. **Category-specific signature features exist** — Barber walk-in queue with Supabase Realtime, Nail AI art generator via fal.ai, Coiffeur formula book, Makeup face chart, Spa body diagram, Waxing body zones.
4. **The design system has been aggressively de-glowed already** (20+ phase-2 commits). The "too much glow" you see on `solen-coral.html` is because **our coral revert preview re-introduced warm glow explicitly** — it's not in the production code.
5. **There are at least 6 distinct homepage designs in git history.** We can cherry-pick from any of them.
6. **Production Next.js code currently reflects the Fresha-clean direction (#4)** — white bg, no glass, no glow, coral as only accent. It's NOT in sync with our coral+cream revert (#6).

## 🔧 Realistic options from here

| Option | What it means |
|--------|---------------|
| **A** — Accept Fresha-clean prod code (#4), update `solen-coral.html` to match, abandon our coral+cream revert | The fastest to ship — just sync docs to code |
| **B** — Keep our coral+cream direction (#6), port it into Next.js production code | The longest path — rewrites 10+ files |
| **C** — Pick best of both — use coral brand + Bebas + Fraunces (ours) but white bg + no glass + no blow (fresha's) | Middle ground — edit `app/globals.css` + keep structure |
| **D** — Fork from `modern-ui-design` branch, start there | Reset to the most-polished production codebase |
| **E** — Fork from old `public/home-archive.html` (#1) — different universe | Nuclear option — wine+gold vibe |

My take: **Option C.** Keep coral as the brand anchor (your original reason), adopt Fresha-clean discipline (white/no glass/no glow — matches your "too much glow" feedback), and add Fraunces for headings. Best of everything you've already reacted to positively.

---

## 📦 Ready to view on localhost

| URL | Description |
|-----|-------------|
| `http://localhost:3000/solen-coral.html` | Our #6 coral revert preview (current) |
| `http://localhost:3000/variations.html` | 5 card variants + 3-row homepage stack (last round) |
| `http://localhost:3000/home-archive.html` | **NEW** — the wine+gold Vite-era homepage (14,612 lines, totally different universe) |

Open `home-archive.html` in your browser to see a completely different direction that once existed. You might hate it, you might love parts of it. Either way — you now have the full history.
