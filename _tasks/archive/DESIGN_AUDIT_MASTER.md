# SOLEN — MASTER AUDIT (Forensic)

Generated 2026-04-21 via parallel research agents against git history, Vercel deployments, branch divergence, and feature-area commit timelines.

---

## 🚨 CRITICAL FINDING — READ FIRST

**The last 3 commits on this branch FAIL TO BUILD on Vercel:**
- `feff9e17` (Option C — coral/Fraunces port) — **ERROR**
- `b08e2345` (merge reconcile parallel sessions) — **ERROR**
- `25d04c1d` (consolidate coral source of truth) — **ERROR**

**Production is frozen at `688347bf` (2026-04-06) — ~15 days stale.** Auto-deploy-from-main was intentionally disabled in commit `1f3036de` ("chore: disable Vercel auto-deploy from main") to hold production steady during the redesign.

**Next action:** Before merging Option C to main, pull the build log:
```
Vercel MCP → get_deployment_build_logs dpl_6XEJtrpWHJRrf1fD1XHSHSat83w7
```
The likely cause: our `tailwind.config.js` swap `Syne → Fraunces` may have broken a font class reference elsewhere in code, OR `--bg: #FFFFFF → #FAF6EF` broke a component that hardcoded white.

---

## 📅 VERCEL DEPLOYMENT TIMELINE (latest 20)

Dual projects: `solen` (`prj_o5ikKICjwIdl01glHXdQUq7xEiez`) + `solen.ch` (`prj_4NIHlVH0Qto9pde35eleKsyzo0Tq`) — every commit double-deploys. **Suggested cleanup:** alias one to the other, save build minutes.

| Date | SHA | Branch | State | Prod? | Notes |
|------|-----|--------|-------|-------|-------|
| 2026-04-21 | feff9e17 | claude/agitated-kapitsa | ❌ ERROR | — | Option C — our coral port |
| 2026-04-21 | b08e2345 | claude/agitated-kapitsa | ❌ ERROR | — | merge reconcile parallel sessions |
| 2026-04-21 | 25d04c1d | claude/agitated-kapitsa | ❌ ERROR | — | consolidate coral SOT |
| 2026-04-20 | ec9ae7f6 | claude/review-solen-design-rules-9yQ1s | ✅ READY | — | BRAND_BRIEF.md |
| 2026-04-19 | 1f3036de | claude/debug-api-errors-mh2yT | ❌ ERROR | — | **disable Vercel auto-deploy from main** |
| 2026-04-19 | f8af51a8 | claude/debug-api-errors-mh2yT | ❌ ERROR | — | PageState primitive |
| 2026-04-19 | 8fbc24cd | claude/debug-api-errors-mh2yT | ✅ READY | — | /design-system route |
| 2026-04-19 | e162ceaa | claude/debug-api-errors-mh2yT | ✅ READY | — | flexibility questionnaire |
| 2026-04-19 | 33ce3e9f | claude/review-solen-design-rules-9yQ1s | ✅ READY | — | consolidate UI_RULES |
| 2026-04-19 | 40387d62 | claude/debug-api-errors-mh2yT | ✅ READY | — | lock salon cards 1:1 |
| 2026-04-11 | 269a8408 | modern-ui-design (v0 bot) | ❌ ERROR | — | v0 Fresha attempt failed i18n |
| 2026-04-11 | eb4bef61 | modern-ui-design (v0 bot) | ❌ ERROR | — | **v0 Fresha-clean homepage** |
| 2026-04-07 | 8dcc9f87 | claude/frosted-glass-components | ✅ READY | — | Figma MCP config |
| **2026-04-06** | **688347bf** | **main** | **✅ READY** | **🟢 PROD** | **LAST prod promote** |
| 2026-04-06 | f07a3c28 | main | ✅ READY | PROD | white bg + coral token compliance |

---

## 🏛️ 5 DESIGN ERAS (chronological)

### Era 1 — Legacy V-Series / R-Phases (pre-Mar 2026)
- **185 commits** (pre-full-history cutoff)
- R08-R33 numbered phases — each tackled one subsystem (staff, dark mode, animations, reviews)
- **Outcome:** Foundation. Superseded by unified approach in Era 2.

### Era 2 — Airbnb-inspired Homepage Overhaul (Mar 20-30)
- **427 commits** (one massive sprint)
- Key commits: `ff70b2d9` (Airbnb search + icon categories + per-city carousels), `8a531a12` (slim header + partner teaser), `a9deaa08` (GuidedSearch bottom sheet), `d74ab07d` (4-step discovery funnel)
- **Shipped:** sticky category nav, bottom-sheet search, per-city carousels, referral tracking, PostHog funnels, error boundaries on 11+ routes
- **Still in code today.** This is where the per-category carousel pattern originated — the one you remember.

### Era 3 — R7 Glass Header & Trust Stats (Apr 4-8)
- **8 commits** (focused refinement)
- Key commits: `32049aed` (R7-8 glass header + inline trust stats), `35da0f24` (R7-1 HomepageHero), `a4b7e6f7` (R7-2 LastMinuteStrip), `6fe332e4` (R7-3 cinematic bg), `68a823f7` (R7-4 TrustStatsBanner), `8d83f1bc` (R7-5 dark Bebas 76px city list), `83e1412b` (R7-6 3-col testimonials), `45fa17b8` (R7-7 partner dark card + coral glow)
- **Partially reverted.** Glass header + dark trust stats rejected; Bebas Neue city list survived.

### Era 4 — Fresha-Clean (Apr 13, single commit)
- **1 commit, 2.5× churn** (+1078 / −1450 lines)
- `eb4bef61` — pivots everything: solid white bg, no glass, no dark sections, no decorative glow, no warm shadows
- **Followed by 20+ "phase 2" commits** stripping remnants across 69+ files
- **Status:** Mostly in production code but without Syne (replaced by Fraunces now), now cream bg (our Option C), no white-box cards (our Option C)

### Era 5 — Design System Lock (Apr 13-21)
- **14 commits**
- Key commits: `6cbbafd5` (white-first slop-free), `25d04c1d` (consolidate to coral SOT), `b08e2345` (reconcile merge), `0de8582c` (enforce system-wide: active:scale, motion tokens, coral lock), `8fbc24cd` (/design-system reference route), `01887328` (DESIGN_SYSTEM.md defaults+escape-hatch), `44e317a1` (PR template + CLAUDE.md pointer)
- **Outcome:** Canonical tokens, Q15-Q22 questionnaire framework, design-system route, anti-slop animation rules in CLAUDE.md + PR template
- **Status:** Docs shipped, production code broken (current state)

### **Top 10 biggest single commits** (by file delta)

| SHA | Date | Message | Delta |
|-----|------|---------|-------|
| `ff70b2d9` | Mar 30 | Airbnb-style redesign | +428 / −312 |
| `eb4bef61` | Apr 13 | Fresha clean aesthetic | +1078 / −1450 |
| `32049aed` | Apr 4 | R7-8 glass header + 7 roadmaps | +500 / −120 |
| `5e80927d` | Apr 6 | Component Map V5 rebuild | +400 / −280 |
| `f0c993e2` | Apr 3 | i18n + a11y: R4 sweep (250+ keys) | +380 / −95 |
| `958cbe28` | Apr 3 | Final UI audit (FIX 10, 13-14, 17) | +250 / −180 |
| `f7ed0a99` | Apr 13 | Coral sweep + 4:3 cards + CSS vars | +180 / −95 |
| `6cbbafd5` | Apr 21 | Strip cream/blob/wash — white rewrite | +118 / −1827 |
| `688347bf` | Apr 8 | Polish pass (spacing, typography) | +160 / −140 |
| `01887328` | Apr 21 | DESIGN_SYSTEM.md rewrite | +277 / −194 |

---

## 🌿 BRANCH AUDIT

| Branch | Commits ahead of main | Direction | Verdict |
|--------|-----------------------|-----------|---------|
| `origin/modern-ui-design` | 2 | v0-generated Fresha-clean homepage (HomePage + globals + Header + Footer refactor) | **Cherry-pick** (low risk, 2 clean commits) |
| `origin/claude/frosted-glass-components-EiGsa` | 1 | Figma MCP config only | **Delete** (tooling, no design work) |
| `origin/claude/homepage-component-map-Wkrsu` | 0 | Identical to main | **Delete** |
| `origin/backup/2026-03-08*` (×3) | 71-75 | Old Fresha HTML backend (pre-Next.js) | **Delete** (superseded) |
| `origin/feature/customer-frontend` | 384 | Dev 2 Phases 1-7: ChatWindow (Realtime API), BookingCalendar, FilterBar, MapView, ProfilePage, 20+ new components | **Keep** — mostly ALREADY MERGED to main but branch lives |
| `origin/feature/salon-dashboard` | 387 | Supersedes customer-frontend, adds DashboardLayout (230 loc), onboarding/salon page (852 loc) | **Keep** (most of it is on main) |
| `origin/moat/session3` | **535 commits** | **Experimental advanced features**: CompareBar, CompareDrawer, StaffPortfolio, TerminePage, upcharge disputes, CRM tags (allergy warnings, color labels), chat intelligence (QuickReplyChips, AISuggestion), photo quoting gallery, off-peak countdown, compare table, reply badges ("Salon hat geantwortet") | **🔥 REVIEW URGENTLY** — highest feature density, NEVER MERGED |

### 🔥 Biggest unmerged work: `moat/session3` (535 commits behind)
Components that **exist ONLY on this branch** worth looking at:
- `CompareBar.tsx` / `CompareDrawer.tsx` — salon comparison UX
- `StaffPortfolio.tsx` — detailed staff portfolio view
- `TerminePage.tsx` — appointments page variant
- Upcharge dispute flow (backend + UI)
- AI-enhanced `QuickReplyChips` / `AISuggestion` for chat
- CRM tag system (allergy warnings, color labels)
- Reply badges for review system

**If you want to steal ideas:** this is the goldmine.

---

## 📦 FEATURE-AREA STATE TABLE

| Feature | Components | Lead LOC | Latest Touch | State |
|---------|-----------|----------|--------------|-------|
| **Homepage** | 3 | 192 | Apr 21 (feff9e17) | 🔄 Under active iteration (5+ redesign passes in 5 months) |
| Discovery | 42 | 4,281 | Apr 21 (0de8582c) | ✅ Stable with polish |
| Salon detail | 14 | 1,708 | Mar (bdfda180) | ✅ Stable |
| Booking flow | 18 | 3,243 | Apr 21 (0de8582c) | ✅ Stable |
| Checkout | 1 | ~500 | Feb (cc00b8d4) | ✅ Stable (since Aug 2024) |
| **Dashboard** | 72 | 13,369 | Apr 21 (0de8582c) | 🔄 Under active iteration (largest area) |
| Barber | 8 | 1,199 | Oct (f0c993e2) | ✅ Stable |
| Chat | 5 | 537 | Apr 21 (0de8582c) | ✅ Stable (M1 chat intelligence live) |
| Search + filters | 9 | ~800 | Apr 21 (0de8582c) | ✅ Stable |
| Auth + Profile | 10 | 1,455 | Feb (842bf675) | ✅ Stable |
| Loyalty / Referral | 2 | ~400 | Oct 2024 | ⚠️ Underdeveloped |
| Vouchers | 2 | ~300 | Jan (81a20253) | ✅ Stable |
| **Admin tools** | 13+ | ~2,000 | Apr 21 (b08e2345) | 🔄 Under active iteration |

**Total codebase:** ~30,000 LOC across 339 components + 101 pages + 325 API routes.

---

## 📂 RECOVERABLE DELETED DOCS

All still in git history — can be resurrected:

| Doc | Deleted in | Recover command |
|-----|-----------|-----------------|
| `.agent-comms.md` | `522ee507` (Mar 18) | `git show 522ee507^:.agent-comms.md` |
| `SOLEN_HANDOFF.md` | later commits | `git show 85494af4:SOLEN_HANDOFF.md` |
| `_tasks/roadmap-R25-chat-polish.md` | `25d04c1d` (Apr 21) | `git show 25d04c1d^ -- _tasks/roadmap-R25-chat-polish.md` |
| `_prompts/` tree (23 multi-phase planning docs) | `25d04c1d` | `git checkout bd67f9e4 -- _prompts/` |
| `_tasks/PROMPT-*.md` (foundation/polish/i18n/consistency/moat×3/post-moat×3/ui-redesign-v3/features-v4/hair-protocol/token-sweep) | `25d04c1d` | `git show bd67f9e4 -- _tasks/PROMPT-*` |
| `_tasks/screenshots/session-final.png` | lives on `f7ed0a99` | `git show f7ed0a99:_tasks/screenshots/session-final.png > session-final.png` |

**No** chat transcripts or AI-session dumps ever lived in-repo. Only commit messages reference session URLs.

---

## 🎯 TOP 5 PAST SESSIONS WORTH KNOWING

1. **`bd67f9e4` — "Full restore: all source files synced from local backup" (Mar 23)** — huge replay after a working-copy loss. Includes `_audits/*` (type-system, validations, design-tokens, onboarding_wizard, payments), `_prompts/` tree, chat components, migrations 056+060. Most still live.

2. **`8dd783d5` — "Massive Partner Page Overhaul (All 12 Topics)" (Mar 23)** — the FIRST CLAUDE.md (1,079 lines), plus `CLAUDE_MOBILE_UI_PLAN.md`, `CLAUDE_UX_ROADMAP.md`, `.agents/workflows/ui-audit.md`. Foundation of the entire AI-agent workflow. CLAUDE.md has been slimmed 1079 → 1903 (grew) → 194 (our consolidation).

3. **`c76a5770` — "phase M1: chat intelligence" (Mar 18)** — shipped `QuickReplyChips`, `AISuggestion`, `PhotoGallery`, `/api/chat-templates`, `/api/chat/suggest`, migration 056 (chat_templates). **Live in current code.**

4. **`25d04c1d` — "consolidate to single coral source of truth" (Apr 21)** — our session. Nuked 30+ design files, .agents/skills, V2 green+peach artifacts, R-roadmaps. CLAUDE.md 1903→194. Currently breaking builds.

5. **`feff9e17` — "Option C" (Apr 21, HEAD)** — only 4 production files touched. Breaking builds.

---

## ⚠️ ANOMALIES

1. **Our last 3 commits fail to build.** Prod frozen at `688347bf` by `1f3036de` auto-deploy disable. Fix the build before merging to main.
2. **Dual Vercel projects** (`solen` + `solen.ch`) double-deploy everything — wasting minutes. Consolidate.
3. **v0 bot branch `modern-ui-design`** errored both times, never merged. Prune.
4. **Parallel-session collision**: 3 concurrent Claude branches rewrote design system in 48h. Our reconcile merge (`b08e2345`) kept coral, rejected main's white-first. Still two SOT files exist: `_rules/DESIGN_SYSTEM.md` (from main) vs `_tasks/SOLEN_DESIGN.md` (ours).
5. **Orphan feature**: chat intelligence (M1 from `c76a5770`) is live in code but not mentioned in CLAUDE.md or SOLEN_DESIGN.md — verify still wired.
6. **23 `_prompts/` planning docs** wiped during our consolidation. If you want roadmaps back, restore from `bd67f9e4`.
7. **`moat/session3` branch** (535 commits unmerged) has major advanced features — Compare UX, CRM tags, staff portfolio, reply badges. NEVER MERGED. Review before deleting.

---

## 🔧 IMMEDIATE NEXT ACTIONS (priority order)

1. **🚨 Fix the broken build.** Pull Vercel logs for `dpl_6XEJtrpWHJRrf1fD1XHSHSat83w7`. Likely culprits: Tailwind font reference mismatch (Syne → Fraunces), or globals.css `--bg` change broke a component.
2. **Merge Option C to main** once build is green.
3. **Manually promote** `main` to production via Vercel UI (auto-deploy is disabled by design).
4. **Review `moat/session3`** — steal or delete.
5. **Delete dead branches**: `homepage-component-map-Wkrsu` (0 commits), `backup/2026-03-08*` ×3 (fully superseded), `modern-ui-design` (errored v0 attempt).
6. **Alias dual Vercel projects** — kill duplicate deploys.
7. **Restore `_prompts/` tree** from `bd67f9e4` if you want session roadmaps back.
8. **Document chat intelligence M1/M2** in SOLEN_DESIGN.md — currently orphaned.

---

## 🧭 CONCLUSIONS

1. **The visual system has been redesigned ~6 times in 6 weeks.** Every redesign partially reverted the previous. Current direction (coral + cream + Bebas + Fraunces + DM Sans + no-box square cards) is the 6th. Stabilization is the single biggest product risk.

2. **The BUILT feature surface is vast** — 30k LOC, 339 components, 101 pages, 325 API routes, AI features (Gemini + fal.ai), Realtime chat, Stripe Connect, pgvector, loyalty stamps, per-category dashboards. **You have a full product. You don't need to build more — you need to stabilize what's there and ship.**

3. **Critical blocker right now: broken build.** Nothing ships until it's green. That's the ONE actual thing to do today.

4. **Biggest unrealized asset: `moat/session3`** with 535 unmerged commits containing Compare flow + CRM features. Decide: merge, cherry-pick, or delete.

5. **Minor organizational debt**: dual Vercel projects, 6+ dead branches, orphan chat M1/M2 docs, 23 lost `_prompts/` planning docs.
