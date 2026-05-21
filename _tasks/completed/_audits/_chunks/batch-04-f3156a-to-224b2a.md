# Audit Batch 04 — f3156a → 224b2a

Date range: 2026-03-24 17:29 → 2026-03-24 21:09  
Branch: claude/vigorous-spence-0e9aa7

| # | sha | date | message | files | +/- | kind | lost? | alive? | drill? | notes |
|---|-----|------|---------|-------|-----|------|-------|--------|--------|-------|
| 1 | f3156a | 2026-03-24 17:29 | feat(booking): V3 tokens, strip glassmorphism, InteractiveHoverButton CTAs | 11 | +284/-46 | add | NO | YES | YES | Adds `rounded-btn` (99px) and `rounded-input` (12px) to tailwind config as V3 tokens; strips glassmorphism from 4 checkout cards to solid bg-white; upgrades CTAs to InteractiveHoverButton. Token values later adjusted (input to 16px) but keys survive at HEAD. |
| 2 | 6e4a8c | 2026-03-24 17:59 | feat(homepage): Phase 1-8 — hero rework, section toggle, UI fixes, category tiles, footer, locale | 7 | +842/-135 | rewrite | YES | PARTIAL | YES | Major HomePage.tsx overhaul: category tiles gain per-brand semantic tokens (s-coral-subtle, s-plum-subtle, s-sage-subtle etc.), admin section toggle API wired, WeatherBanner removed (non-converting), footer redesigned with SO.LEN banner. Roadmap file `_roadmaps/roadmap-homepage-improvements.md` added but no longer present at HEAD (stripped out). HomePage.tsx itself is alive but greatly reduced (193 lines vs 264 added here — further rewrites followed). |
| 3 | 144963 | 2026-03-24 19:49 | feat(coiffeur): wire up hair-type pills, trending strip, AI matcher modal | 1 | +18/-1 | add | NO | YES | NO | Minimal page.tsx wiring: adds CoiffeurAboveGrid (Suspense-wrapped URL-synced pills), CoiffeurBelowGrid (trending + AI CTA), AiMatcherModal imports, and OG metadata. No design-system changes. |
| 4 | c971d6 | 2026-03-24 19:51 | fix(checkout): replace banned rounded-button tokens with V3 design tokens | 1 | +6/-6 | bug-fix | NO | YES | NO | Follow-up to commit 1: swaps 6 remaining `rounded-button` instances in checkout/page.tsx to `rounded-btn`/`rounded-input`. Pure token normalization, no layout change. |
| 5 | 49b64c | 2026-03-24 19:59 | feat(barbershop): URL-synced filters, V3 design tokens, WalkinQueue UX | 4 | +88/-29 | add | NO | YES | YES | URL-synced filter pills (fade/texture/style) via useSearchParams; eyebrow labels 11px amber uppercase; rounded-btn on Walk-ins; hover:-translate-y-[5px]+shadow-warm-xl on cards; tier-2 glassmorphism on walk-in teaser (pulsing sage dot). CategoryPage gains aboveGrid/belowGrid slots. WalkinQueue gets rounded-card entries. |
| 6 | 85fb77 | 2026-03-24 19:59 | feat(cleanup): R08 dead code removal + coming-soon wrappers | 6 | +31/-427 | cleanup | YES | NO | YES | Deletes 3 discovery components (DiscoveryGrid, InfoTabs, PriceRangeBadge — 126 lines total). Spa/waxing/makeup sections stripped of actual UI, replaced with EmptyState "Kommt bald" wrappers. Significant loss of WIP UI for 3 categories. All 3 deleted components confirmed absent at HEAD. |
| 7 | c9bc4f | 2026-03-24 20:13 | feat(onboarding): salon registration overhaul — auth guard, draft persistence, Zone 3 design | 11 | +413/-81 | rewrite | NO | PARTIAL | YES | 7-step onboarding wizard redesigned to Zone 3 spec (solid StepContainer, no glass blur, cream bg). 41 banned rounded-button tokens replaced. Adds salon_drafts DB migration, /api/salon-draft endpoint, SalonDraft type, auth guard with intent=salon redirect, and i18n keys across 4 locales. NOTE: this 7-step version is then immediately replaced by commit 10 (3-step flow). |
| 8 | 0bfc69 | 2026-03-24 21:00 | feat(dashboard): Zone 3 purity — strip glassmorphism, fix token confusion, 82+ violations | 20 | +83/-82 | cleanup | NO | YES | YES | Bulk pass across 14 dashboard files: removes backdrop-blur/bg-white/80/shadow-glass (Phase 1), fixes rounded-button→rounded-input on inputs/selects/textareas (70+ instances), rounded-button→rounded-btn on CTA buttons. Also fixes discover page and salon profile page. Purely token normalization with no layout changes. |
| 9 | 99dbde | 2026-03-24 21:01 | fix(api): remove edge runtime from admin review routes | 2 | +0/-2 | bug-fix | NO | YES | NO | Removes `export const runtime = 'edge'` from 2 admin review API routes that caused build failures due to incompatible imports. No design or UI impact. |
| 10 | 224b2a | 2026-03-24 21:09 | phase 1: rebuild wizard as 3-step flow (basics → OTP → AI quick win) | 4 | +365/-1146 | rewrite | YES | YES | YES | Immediately rewrites the 7-step onboarding wizard from commit 7 to a 3-step flow (basics → phone OTP → AI service suggestion). Removes 1,146 lines: all of profile/services/team/hours/extras/review steps, service templates, ImageUploader, staff management, opening hours grid. Adds /api/ai/suggest-service (Gemini integration). New i18n keys for OTP and quickwin steps. This is the current HEAD state (~740 lines). |

---

## Summary

**Date range:** 2026-03-24 17:29 – 2026-03-24 21:09 (single afternoon sprint)

**Defining theme:** V3 design token enforcement sweep + glassmorphism purge across all consumer-facing and dashboard pages, followed by a dramatic onboarding wizard pivot from 7-step to 3-step lean flow.

### Components introduced
- `InteractiveHoverButton` wired into checkout CTAs (commit 1)
- `CoiffeurAboveGrid`, `CoiffeurBelowGrid`, `AiMatcherModal` wired to coiffeur page (commit 3)
- `aboveGrid`/`belowGrid` slots added to `CategoryPage` (commit 5)
- `/api/salon-draft` endpoint (commit 7)
- `/api/ai/suggest-service` endpoint with Gemini integration (commit 10)
- `app/api/homepage-sections/route.ts` + admin toggle API (commit 2)
- `supabase/migrations/080_salon_drafts.sql` (commit 7)

### Components rewritten
- `components/HomePage.tsx` — category tiles, section toggle, hero clamp, footer (commit 2; further reduced later)
- `app/[locale]/onboarding/salon/page.tsx` — twice: 7-step Zone 3 overhaul (commit 7), then 3-step pivot (commit 10)

### Components deleted (lost at HEAD)
- `components/discovery/DiscoveryGrid.tsx` (50 lines)
- `components/discovery/InfoTabs.tsx` (52 lines)
- `components/discovery/PriceRangeBadge.tsx` (24 lines)
- Spa, waxing, makeup section UI gutted → EmptyState placeholders (commits 6)
- Full 7-step onboarding logic (profile/team/hours/extras steps) — 1,146 lines deleted (commit 10)
- `_roadmaps/roadmap-homepage-improvements.md` added then removed (commit 2)

### Design tokens added
- `rounded-btn: 99px` (V3 CTA pill) — added in commit 1, alive at HEAD
- `rounded-input: 12px` → later revised to `16px` at HEAD (commit 1; adjusted later)
- Category semantic color token pairing: `bg-s-coral-subtle/border-s-coral/20` etc. per category (commit 2)

### Design tokens removed / retired
- `rounded-button` — eliminated across all touched files (commits 1, 4, 7, 8)
- Glassmorphism (`backdrop-blur`, `bg-white/80`, `shadow-glass`) purged from checkout, dashboard, onboarding (commits 1, 7, 8)

### Patterns adopted
- Zone 3 = solid white/cream backgrounds, no blur, `shadow-warm-lg` — dashboard and onboarding
- URL-synced filter pills via `useSearchParams` + `Suspense` boundary — barbershop, coiffeur
- `InteractiveHoverButton` for all primary CTAs
- Eyebrow labels: 11px amber uppercase tracking
- hover microinteraction: `hover:-translate-y-[5px] + shadow-warm-xl` on cards (translateY replaces scale)
- Lean onboarding: defer deep config to dashboard, capture only minimal viable data upfront

### Patterns rejected
- Scale-based card hover (`hover:scale-*`) → replaced by translateY
- `blob` CTA shapes → replaced by pill (`rounded-btn`)
- 7-step onboarding wizard flow → replaced by 3-step

---

## Commits flagged for drill-down

| sha | reason |
|-----|--------|
| f3156a | touches tailwind.config.js, adds V3 tokens; affects Stripe Elements styling |
| 6e4a8c | 842 lines added to homepage, WeatherBanner deleted, roadmap doc created; large UI pivot |
| 49b64c | WalkinQueue glassmorphism *retained* as tier-2 (contrast with purge elsewhere — intentional exception worth verifying) |
| 85fb77 | 427 lines deleted incl. 3 discovery components; spa/waxing/makeup UI gutted |
| c9bc4f | Large onboarding overhaul (413 lines) immediately superseded by commit 10 — may have left dead i18n keys |
| 0bfc69 | 82+ token violations fixed across 14 dashboard files — broad surface area |
| 224b2a | Largest single commit in batch: 1,146 lines deleted; onboarding pivot; AI service suggestion introduced |
