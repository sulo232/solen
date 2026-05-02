# Batch 32 Audit — a2ed51 to 81a202

Date range: 2026-03-29 20:59 → 2026-03-29 23:22  
Branch: claude/vigorous-spence-0e9aa7

| # | sha | date | message | files | +/- | kind | lost? | alive? | drill? | notes |
|---|-----|------|---------|-------|-----|------|-------|--------|--------|-------|
| 1 | a2ed51 | 2026-03-29 20:59 | fix(header): hide ThemeToggle/Bell/Messages for logged-out users | 1 | +15/-10 | bug-fix | NO | YES | NO | Conditional rendering guard added to Header.tsx; no design token changes. Auth-state-dependent UI gating pattern. |
| 2 | 08a400 | 2026-03-29 21:03 | phase 1.4: TikTok thumbnail fallback when embed fails or times out | 1 | +28/-9 | add | NO | YES | NO | VideoCard.tsx gains error/timeout fallback for TikTok embeds; no design changes. Resilience improvement only. |
| 3 | 4841174 | 2026-03-29 21:07 | phase 2.2: remove duplicate city selector and orphaned ANGEBOTE link from hero | 1 | +6/-16 | cleanup | NO | YES | YES | HomePage.tsx cleanup — removes duplicate CitySelector and orphan nav link. Net deletion; marks phase 2.2 of hero overhaul. |
| 4 | 767b31b | 2026-03-29 21:12 | phase 2.3: add trust chips inline below search bar in hero | 1 | +19/-0 | add | NO | YES | YES | Adds inline trust-signal chips (e.g. ratings count, security badges) beneath hero search bar in HomePage.tsx. Pure addition, no removals. |
| 5 | 1aecdda | 2026-03-29 23:13 | fix: audit fixes — cancel error handling, Stripe guard, packages buy flow | 3 | +230/-34 | bug-fix | NO | YES | YES | Large (+264 lines net) bug-fix batch: packages/page.tsx gets full Stripe purchase flow wired; BookingCalendar gets Stripe key guard; TerminePage cancel modal gets error display. |
| 6 | cba28e0 | 2026-03-29 23:16 | phase 2.5: hide map CTA when fewer than 3 salons have coordinates | 2 | +86/-66 | bug-fix | NO | YES | YES | HomePage.tsx restructured (+145 lines changed) plus small page.tsx addition to suppress map CTA on sparse data. Net rewrite of HomePage section logic. |
| 7 | e554c03 | 2026-03-29 23:17 | fix: code review - wire CitySelector, remove dead itemVariants, fix hero-cinematic var(--bg), retire section-alt | 2 | +3/-9 | cleanup | YES | YES | YES | Removes `.section-alt` CSS class (V4 banding pattern) from globals.css; fixes `.hero-cinematic` hardcoded bg colors to use `var(--bg)` token. The retired `.section-alt` class is a genuine design token loss. |
| 8 | a21011 | 2026-03-29 23:18 | fix(loyalty): query stamps_needed/reward_text from loyalty_cards not loyalty_stamps | 1 | +23/-4 | bug-fix | NO | YES | NO | ProfilePage.tsx loyalty card query corrected to use `loyalty_cards` table for `stamps_needed`/`reward_text`; data-layer bug fix only. |
| 9 | 3b69ec8 | 2026-03-29 23:21 | phase 3.1+3.2: discover after featured salons; unified category icon containers | 1 | +28/-28 | rewrite | NO | YES | YES | HomePage.tsx section ordering changed (discover section moved after featured salons) and category icon containers unified. Equal lines changed — structural reorganization. |
| 10 | 81a202 | 2026-03-29 23:22 | phase 1: commit production-ready untracked ui components, pages, and roadmaps | 22 | +3389/-0 | add | YES | PARTIAL | YES | Massive batch add: 8 V5 "zone" roadmap files + airbnb-overhaul roadmap (all deleted at HEAD — lost), compare/referral pages (alive), UI primitives (button, card, tabs, input, label, border-beam, tracing-beam — partially alive), WaitlistModal, guided-search-data, sitewide-audit-supplement (deleted at HEAD). V5 "zone" language (Zone 1–8) is explicitly retired in CLAUDE.md. |

---

## Summary

**Date range:** 2026-03-29 20:59 → 2026-03-29 23:22 (all within a single evening sprint)

**Defining theme:** Late-March hero section overhaul (phases 1.4–3.2) combined with a parallel bug-fix sweep (audit fixes: Stripe, loyalty, cancel modal) and a large batch commit of previously untracked files. This batch represents a densely packed single-session push.

### Components introduced
- `components/ui/WaitlistModal.tsx` — alive at HEAD
- `components/ui/border-beam.tsx` — alive at HEAD
- `components/ui/button.tsx`, `card.tsx`, `input.tsx`, `label.tsx`, `tabs.tsx` — alive at HEAD
- `components/ui/tracing-beam.tsx` — alive at HEAD
- `app/[locale]/compare/ComparePageClient.tsx` + `page.tsx` — alive at HEAD
- `app/[locale]/referral/[code]/page.tsx` — alive at HEAD
- `lib/guided-search-data.ts` — alive at HEAD

### Components rewritten
- `components/HomePage.tsx` — touched in commits 3, 4, 6, 9 (cumulative hero restructure)
- `app/[locale]/salon/[slug]/packages/page.tsx` — large rewrite (+230 lines) with Stripe flow

### Design tokens added
- None explicitly added via CSS variables

### Design tokens removed / retired
- `.section-alt` CSS class deleted from `app/globals.css` (V4 section banding — commit 7). This is a genuine token loss.
- `.hero-cinematic` hardcoded hex backgrounds (`#F7F7F7` / `#1a1209`) replaced with `var(--bg)` — correct alignment with design system.

### Patterns adopted
- Auth-gated UI elements in header (ThemeToggle/Bell/Messages hidden for logged-out users)
- Trust chips pattern inline beneath hero search bar
- Map CTA suppression when geo data is sparse (data-quality guard)
- TikTok embed timeout/error fallback in VideoCard

### Patterns rejected / lost
- V5 "Zone 1–8" roadmap language (8 zone files + airbnb-overhaul roadmap all deleted at HEAD; CLAUDE.md explicitly retires this language)
- `_audits/sitewide-audit-supplement.md` — deleted at HEAD
- `.section-alt` banding class — deleted

---

## Commits flagged for drill-down

| sha | reason |
|-----|--------|
| 4841174 | `design:` adjacent — hero cleanup, remove duplicate city selector |
| 767b31b | trust chips addition to hero — design pattern change |
| 1aecdda | >200 lines changed across 3 files (packages/page.tsx +230 lines) |
| cba28e0 | >200 lines changed in HomePage.tsx restructure |
| e554c03 | touches `app/globals.css` — retires `.section-alt`, fixes `var(--bg)` |
| 3b69ec8 | rewrite keyword — section ordering change in HomePage.tsx |
| 81a202 | >200 lines (3389 added), adds/commits large batch including V5 zone files later deleted |
