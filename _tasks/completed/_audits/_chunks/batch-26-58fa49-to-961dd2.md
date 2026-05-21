# Batch 26 Audit — 58fa49 to 961dd2

Date range: 2026-03-28 18:44 → 2026-03-28 19:49 (same Saturday evening, ~65 min)

| # | sha | date | message | files | +/- | kind | lost? | alive? | drill? | notes |
|---|-----|------|---------|-------|-----|------|-------|--------|--------|-------|
| 1 | 58fa492 | 2026-03-28 18:44 | booking: fix API mismatches, cancellation guards, bg-white tokens, i18n, accessibility | 10 | +147/-37 | bug-fix | NO | YES | NO | Replaces `bg-white` with `bg-[--raised]` token across 6 booking components; fixes GroupBookingModal payload fields and adds `groupBooking` i18n namespace to all 4 locales. |
| 2 | 195e529 | 2026-03-28 18:52 | dashboard: fix missing API routes, .ok checks, bg-white tokens, i18n, accessibility | 15 | +240/-58 | bug-fix | NO | YES | NO | Creates two missing API routes (`PATCH /api/packages/[id]` and `PATCH /api/salons/mine`); propagates `bg-[--raised]` token and i18n across 9 dashboard components. |
| 3 | be9c9b3 | 2026-03-28 19:03 | fix(profile-auth): interaction consistency pass — i18n, transition-all, accessibility | 13 | +136/-44 | bug-fix | NO | YES | NO | Narrows `transition-all` to specific transition properties across 8 profile/auth components; replaces emoji (CreditCard icon) and hardcoded German strings. |
| 4 | b963f6a | 2026-03-28 19:17 | UI pass: coiffeur/nails subsite — bg-white→bg-[--raised], backdrop-blur fixes, cancellation guards, aria-labels, i18n | 27 | +400/-246 | cleanup | NO | YES | YES | Broad sweep across coiffeur/nail/discovery/layout — large diff (400 insertions) touching 27 files including HomePage.tsx and app/[locale]/page.tsx; also rewrites DiscoverCarousel. |
| 5 | 2c73438 | 2026-03-28 19:27 | UI pass: discovery subsite — backdrop-blur, bg-white, .ok checks, cancellation guards, aria-pressed, i18n | 24 | +317/-130 | cleanup | NO | YES | YES | Continues token cleanup sweep across 19 discovery components; large message additions (45+ keys per locale); SocialProofStrip substantially rewritten. |
| 6 | bcb60a5 | 2026-03-28 19:34 | Homepage audit: i18n, .ok guards, transition fixes | 8 | +115/-115 | bug-fix | NO | YES | NO | Balanced change to HomePage.tsx (same lines in/out); narrows backdrop-blur tokens, removes hardcoded German from TrustBadges, adds i18n keys. |
| 7 | 0a1d68d | 2026-03-28 19:39 | homepage: audit fixes — dark mode, i18n, grid layout, a11y, API consolidation, typography | 8 | +125/-18 | add | NO | YES | YES | Creates `/api/me` route consolidating 4 user fetches; fixes dark mode gradient token; SSR category counts; category grid always renders 6 cards with coming-soon overlay. |
| 8 | b44e6ae | 2026-03-28 19:40 | Booking flow audit: .ok guards, i18n, a11y, transition fixes | 5 | +19/-12 | bug-fix | NO | YES | NO | Minor targeted fixes to 5 booking components: safe JSON parsing on error, inline `#E8624A` replaced with `bg-s-coral` class, `aria-pressed` on gender toggles. |
| 9 | 2e07639 | 2026-03-28 19:45 | Dashboard audit: transitions, .ok guards, a11y fixes | 16 | +43/-33 | cleanup | NO | YES | NO | Normalises animation duration from 350ms → 250ms across 8 dashboard components; adds ARIA roles to tabs; `.ok` + cancellation guards on 4 fetch hooks. |
| 10 | 961dd22 | 2026-03-28 19:49 | homepage: sub-agent audit fixes — dark mode, i18n, typography | 6 | +35/-20 | bug-fix | NO | YES | NO | Replaces remaining inline `rgba` with Tailwind tokens in HomePage; fixes a missed title clamp value; adds dark mode variants to partner CTA; i18n for 4 Header strings. |

---

## Summary

**Date range:** 2026-03-28 18:44 – 19:49 (single 65-minute session)

**Defining theme:** Systematic "consistency audit" sweep — a batch of sub-agent passes enforcing three parallel concerns across the entire codebase: (1) replace `bg-white` / `text-black` / inline hex with design-token equivalents (`bg-[--raised]`, `bg-s-coral`, etc.), (2) add i18n coverage to previously hardcoded German/French strings, and (3) harden fetch calls with `.ok` checks and AbortController cancellation guards.

**Components introduced:**
- `/api/me/route.ts` — new consolidated user-data endpoint (commit 7)
- `PATCH /api/packages/[id]` — new route for is_active toggle (commit 2)
- `PATCH /api/salons/mine` — new about_text endpoint (commit 2)

**Components substantially rewritten:**
- `components/HomePage.tsx` — touched in 5 of 10 commits; net large rewrite
- `components/ui/SocialProofStrip.tsx` — restructured in commit 5
- `components/dashboard/SalonAboutEditor.tsx` — full i18n rewrite (commit 2)

**Design tokens added:**
- `bg-[--raised]` propagated broadly as replacement for `bg-white` on card/modal surfaces
- `bg-s-coral` class replacing inline `#E8624A` hex
- `backdrop-blur-[6px]` replacing `backdrop-blur-sm`
- `bg-s-coral/[0.12]` and `dark:bg-s-coral/[0.20]` for icon backgrounds

**Design tokens removed / retired in this batch:**
- Inline `rgba(...)` colour values on icon backgrounds
- Hardcoded `transition-all` replaced by specific transition properties across many components
- `duration-[350ms]` standardised down to `duration-[250ms]` for animations

**Patterns adopted:**
- AbortController + cancellation guard on all useEffect fetches
- `aria-pressed` on all toggle buttons; `role="tablist"` + `role="tab"` on tab navs
- `useTranslations` wired up on components that had hardcoded German strings

**Patterns rejected / removed:**
- Inline style attributes for colours and backdrop filters
- Emoji as UI icons (replaced by `lucide-react` CreditCard)

---

## Commits flagged for drill-down

| sha | reason |
|-----|--------|
| b963f6a | 27 files, 646 lines changed — broad sweep touching HomePage, page.tsx, nail/coiffeur/discovery/layout; risk of unintended side-effects |
| 2c73438 | 24 files, 447 lines changed — large discovery sweep including SocialProofStrip structural rewrite |
| 0a1d68d | introduces `/api/me` consolidation route + SSR category counts; architectural change worth verifying is fully wired |
