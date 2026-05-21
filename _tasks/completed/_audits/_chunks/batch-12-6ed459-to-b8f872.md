# Batch 12 Audit — 6ed459 to b8f872

Date range: 2026-03-25 15:48 → 17:03  
Branch: claude/vigorous-spence-0e9aa7

| # | sha | date | message | files | +/- | kind | lost? | alive? | drill? | notes |
|---|-----|------|---------|-------|-----|------|-------|--------|--------|-------|
| 1 | 6ed459 | 2026-03-25 15:48 | SHARED-P1+P2: EmptyState → remove scale-[1.8] NEVER violation, add eyebrow prop, remove italic | 1 | +13/-7 | bug-fix | NO | YES | YES | Removes `scale-[1.8]` halo (a documented "NEVER" violation), adds optional `eyebrow` label prop, strips italic from message text; aligns component with V3 design spec. Dark mode variants added to text classes. |
| 2 | f3841f | 2026-03-25 15:48 | SHARED-P3: Spinner → add coral variant for light surface loading states | 1 | +4/-1 | add | NO | YES | NO | Adds `coral` boolean prop to Spinner, producing `border-s-coral/20 border-t-s-coral` ring; non-breaking additive change. Fills gap where white spinner on light bg was invisible. |
| 3 | a61f1a | 2026-03-25 15:56 | fix: ui bug audit v1 — 14 fixes across 6 sub-sites | 5 | +478/-41 | bug-fix | YES | PARTIAL | YES | Bulk audit: creates roadmap doc (now deleted from HEAD), fixes Tailwind opacity-modifier syntax (`/08` → `/[0.08]`), cosmetic label change in HomePage ("In deiner Nähe" → "Standort"), and multiple salon/checkout/login page fixes. Roadmap file `_roadmaps/roadmap-ui-bug-audit-v1.md` was added here but no longer exists at HEAD. |
| 4 | c77dfaf | 2026-03-25 16:35 | fix: ui bug audit v1 - 14 fixes across 6 sub-sites | 6 | +223/-113 | rewrite | YES | NO | YES | Rewrites `_rules/UI_RULES.md` substantially — dark mode mechanism changed from `dark:` Tailwind class to `[data-theme="dark"]`, glassmorphism rules restructured into three tiers, animation system respecified, blob-interactive class retired. The file itself no longer exists at HEAD (not in `_rules/` at current HEAD), making all these rule changes lost. Also fixes messages page and minor component tweaks. |
| 5 | 3b5236 | 2026-03-25 16:47 | chore(design): Apply V3 Design Sweep to ProfilePage (R04) | 1 | +100/-100 | rewrite | NO | YES | YES | Full V3 button typography sweep on ProfilePage: all buttons converted to `text-[11px] font-heading font-bold uppercase tracking-[.06em]` pattern; hover changed from `hover:bg-s-coral/90` to `hover:brightness-[1.06]`; `SolenExclusiveBadge` prop API updated to `featureDescription`; Discovery + Referral sections removed from profile layout (significant structural reduction). |
| 6 | cb7e39 | 2026-03-25 16:53 | chore(design): Apply V3 Design Sweep to Dashboard (R05) | 25 | +66/-65 | cleanup | NO | YES | NO | Broad but shallow dashboard sweep — mostly colour token and class name normalisation across ~24 dashboard components. Also adds `"moduleResolution": "bundler"` to tsconfig.json. No component added or deleted; changes are cosmetic consistency fixes. |
| 7 | 334849 | 2026-03-25 16:55 | fix: resolve TS errors breaking production build | 2 | +7/-8 | bug-fix | NO | YES | NO | Post-sweep TypeScript fixes on checkout and salon pages: button text classes normalised to `text-[11px]` pattern (continuing R06 work), `hover:brightness-[1.06]` added. No structural change; pure build-break repair. |
| 8 | 40cd3b | 2026-03-25 16:56 | chore(design): Apply V3 Design Sweep to Booking/Checkout (R06) | 1 | +2/-2 | cleanup | NO | YES | NO | Minimal sweep on GroupBookingModal only — two class changes. Very small scope despite R06 label suggesting broader Booking/Checkout coverage. |
| 9 | 9bbee0 | 2026-03-25 16:59 | chore(design): Apply V3 Design Sweep to Discovery/Salon (R07) | 19 | +49/-49 | cleanup | NO | YES | YES | Broad Discovery/Salon sweep across 19 files: `rounded-card` replaced with explicit `rounded-[16px]` across gift-card, packages, and barber portfolio pages; all buttons converted to V3 typography system (`text-[11px] font-heading font-bold uppercase tracking-[.06em]`); 14 discovery components receive minor token updates. |
| 10 | b8f872 | 2026-03-25 17:03 | fix: resolve SWC JSX parse error in RemoteQueueJoin | 1 | +11/-7 | bug-fix | NO | YES | NO | Fixes SWC/JSX parse error in RemoteQueueJoin.tsx introduced during the R05 sweep (likely malformed JSX). Component survives at HEAD. Pure correctness fix. |

---

## Summary

**Date range:** 2026-03-25 15:48 – 17:03 (75-minute burst)

**Defining theme:** V3 Design Sweep rollout — a coordinated multi-site application of the V3 typography and component spec, preceded by two shared-component fixes and followed by build-break repairs. The session covers R04 (ProfilePage), R05 (Dashboard), R06 (Booking/Checkout), and R07 (Discovery/Salon) sweeps within a single afternoon.

### Components introduced
- `eyebrow` prop added to `EmptyState`
- `coral` variant added to `Spinner`

### Components rewritten
- `components/ProfilePage.tsx` — V3 button typography, Discovery + Referral sections removed, `SolenExclusiveBadge` prop API change

### Components patched (cosmetic sweep)
- 24 dashboard components (R05)
- 1 booking component: `GroupBookingModal.tsx` (R06)
- 14 discovery components + 4 app pages (R07)
- `components/barber/RemoteQueueJoin.tsx` — JSX parse error fix

### Design tokens added/changed
- V3 button typography pattern locked: `text-[11px] font-heading font-bold uppercase tracking-[.06em]`
- Hover brightness pattern: `hover:brightness-[1.06]` replaces `hover:bg-s-coral/90`
- `rounded-card` utility replaced by explicit `rounded-[16px]` in Discovery/Salon pages
- Tailwind opacity-modifier syntax fixed: `/08` → `/[0.08]` where needed

### Rules / docs changed
- `_rules/UI_RULES.md` substantially rewritten in commit c77dfaf (dark mode mechanism, glassmorphism tiers, animation spec, blob-interactive retirement) — **THIS FILE NO LONGER EXISTS AT HEAD** (not tracked in `_rules/`), meaning these rule changes are effectively lost.
- `_roadmaps/roadmap-ui-bug-audit-v1.md` added in commit a61f1a but also no longer exists at HEAD.
- `tsconfig.json` gained `"moduleResolution": "bundler"` (commit cb7e39).

### Patterns adopted
- V3 universal button typography: `text-[11px] font-heading font-bold uppercase tracking-[.06em]`
- Coral Spinner variant for light-surface loading
- Explicit border-radius values over `rounded-card` utility in some pages
- Dark mode tokens on EmptyState text

### Patterns rejected / retired
- `scale-[1.8]` on decorative halos (NEVER violation — removed)
- `hover:bg-s-coral/90` (replaced by brightness filter)
- `.blob-interactive` class on interactive elements (retired per UI_RULES rewrite, though that file is now lost)
- Italic body text in EmptyState message

---

## Commits flagged for drill-down

| sha | reason |
|-----|--------|
| 6ed459 | EmptyState NEVER-violation fix; eyebrow prop addition; design-spec compliance |
| a61f1a | Large audit commit (478 lines); roadmap doc added then deleted at HEAD |
| c77dfaf | UI_RULES.md major rewrite — file no longer exists at HEAD, rule changes may be lost |
| 3b5236 | ProfilePage structural reduction (Discovery + Referral sections removed); prop API change |
| 9bbee0 | R07 sweep: `rounded-card` → `rounded-[16px]` semantic drift across 19 files |
