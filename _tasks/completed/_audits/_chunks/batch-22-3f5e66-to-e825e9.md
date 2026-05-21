# Audit Batch 22 — Commits 3f5e66 to e825e9

Date range: 2026-03-27 18:20 → 2026-03-27 22:08  
Branch: claude/vigorous-spence-0e9aa7

| # | sha | date | message | files | +/- | kind | lost? | alive? | drill? | notes |
|---|-----|------|---------|-------|-----|------|-------|--------|--------|-------|
| 1 | 3f5e66 | 2026-03-27 18:20 | feat: wire up profile payment methods with Stripe SetupIntents | 4 | +441/-29 | add | NO | YES | YES | Introduces `PaymentMethodsSection.tsx` (208 lines) and Stripe SetupIntent API route. ProfilePage refactored to delegate payment UI. No design-system violations observed — no custom colors or rogue tokens. |
| 2 | 0a6d3b | 2026-03-27 18:25 | fix: squared search UI & raggedy tutorial popovers | 12 | +484/-8 | bug-fix | NO | YES | YES | Changes `tailwind.config.js` `search` border-radius from `18px` → `99px` (fully-rounded pill shape) — design token change still alive at HEAD. Adds `.solen-tour-popover` CSS block using correct coral/ink/DM-Sans tokens **but** also adds `.dark` selectors, which is a retired pattern per CLAUDE.md. |
| 3 | b1f170 | 2026-03-27 18:45 | phase 3: complete backend connectivity remediation phase 1-5 | 46 | +2175/-1260 | rewrite | NO | YES | YES | Massive backend wiring pass across 30+ components and API routes. i18n messages restructured (large deletions). Commits binary audit blobs (eslint.json, lint-output.txt). No direct design-spec changes but touches many TSX components; warrants drill for scope of message reorganization. |
| 4 | 68587b | 2026-03-27 19:15 | feat(onboarding): finalize onboarding wizard fixes and AI integrations | 14 | +378/-109 | add | NO | YES | YES | SetupWizard and all step components updated; new `lib/ai/translate.ts` added. AI service suggest endpoint wired. Onboarding uses existing Syne/DM Sans font classes — no new rogue tokens spotted. Drill warranted for `OpeningHoursStep.tsx` and `ServicesStep.tsx` refactors. |
| 5 | fbe6f9 | 2026-03-27 21:11 | fix: add Italian locale to all email templates, fix validation schemas | 57 | +2058/-542 | bug-fix | NO | YES | YES | Largest commit in batch — adds IT locale to email templates, three new migrations, new API routes, new `StaffAvailability.tsx` component, fixes `validations.ts`. Binary TSC error blobs committed. Dark mode references appear in new `StaffAvailability.tsx` component; needs drill for scope. |
| 6 | d41527 | 2026-03-27 21:17 | feat: STORE-P3 rating badge on staff avatars + StaffAvailability wired | 2 | +29/-14 | add | NO | YES | YES | Adds coral-filled Star rating badge on staff avatars using `fill-s-coral text-s-coral` tokens and `rounded-pill` — design-compliant. `dark:` variants present (retired pattern). Two-file surgical change; small scope. |
| 7 | 204d74 | 2026-03-27 21:23 | feat: STORE-P5-S2 green/grey dots on opening hours grid | 1 | +2/-2 | bug-fix | NO | YES | NO | Tiny one-file fix to salon page — swaps two class names. No design token changes. Alive at HEAD. |
| 8 | e4dc27 | 2026-03-27 21:28 | feat: service management — sort_order DnD reordering + CSV import modal/API | 5 | +251/-43 | add | NO | YES | YES | New `services/import` and `services/reorder` API routes; dashboard services page gets DnD UI and CSV import modal. Migration adds `sort_order` column. Dashboard services page is 154-line rewrite — drill warranted. |
| 9 | 851dc4 | 2026-03-27 21:39 | feat: CRM/RFM segmentation — materialized view, API join, segment tabs | 3 | +83/-6 | add | NO | YES | NO | Adds RFM materialized view migration, extends clients API, adds filter tabs with segment badges to clients page. Surgical and clean; no design violations noted. |
| 10 | e825e9 | 2026-03-27 22:08 | feat: staff commissions — commission_rate field, earnings API, payout table | 5 | +171/-4 | add | NO | YES | YES | New `earnings/staff` API, commission_rate migration, earnings and staff dashboard pages extended. `earnings/page.tsx` is 82-line addition — drill for design token compliance in payout table. |

---

## Summary

**Date range:** 2026-03-27 18:20 – 2026-03-27 22:08 (single afternoon sprint)

**Defining theme:** Intensive backend-connectivity remediation and feature completion sprint. All 10 commits land on the same day, working through a "STORE" roadmap ticket list. Focus is on wiring real Supabase/Stripe data to frontend components that had previously been using stub/mock data, alongside CRM, commission, and service-management features.

**Components introduced:**
- `components/profile/PaymentMethodsSection.tsx` — Stripe SetupIntent payment method management
- `components/staff/StaffAvailability.tsx` — staff availability calendar (new)
- `components/partner/PartnerSignupForm.tsx` — partner lead capture form (introduced in commit 3)

**Components rewritten/substantially modified:**
- `components/dashboard/nail/NailClientTab.tsx` (+186 lines in commit 3)
- `app/[locale]/dashboard/services/page.tsx` — DnD reorder + CSV import modal
- `app/[locale]/dashboard/earnings/page.tsx` — commission payout table
- `app/[locale]/salon/[slug]/page.tsx` — opening hours dots fix + earlier audit changes

**Design tokens added/changed:**
- `tailwind.config.js` `search` radius: `18px` → `99px` (pill shape, still alive at HEAD)
- Tour popover CSS block added to `globals.css` using correct coral/ink/DM Sans tokens

**Design patterns adopted:**
- `rounded-pill`, `fill-s-coral`, `text-s-coral`, `rounded-btn` used consistently in new UI elements
- `font-heading` (Syne) + `data-text` (DM Sans) pattern followed in rating badge

**Design patterns violated / flagged:**
- `.dark` CSS selectors added in commits 2, 5, and 6 — dark mode is **retired** per CLAUDE.md
- Binary audit blobs (`eslint.json` 4.5 MB, `lint-output.txt`, `tsc_audit.txt`) committed to repo in commits 3 and 5 — should be gitignored

---

## Commits flagged for drill-down

| sha | reason |
|-----|--------|
| 3f5e66 | PaymentMethodsSection.tsx is 208 lines; verify Stripe token handling and design compliance |
| 0a6d3b | Dark mode CSS added to globals.css — retired pattern per spec; search radius token change |
| b1f170 | Massive 46-file rewrite including binary blobs; i18n message deletions need reconciliation |
| 68587b | Onboarding wizard step components substantially rewritten; AI translate.ts introduced |
| fbe6f9 | 57-file commit; dark mode in StaffAvailability; binary audit blobs; migration correctness |
| e4dc27 | Dashboard services page DnD rewrite; CSV import modal needs design-token audit |
| e825e9 | Earnings page payout table; confirm commission_rate migration correctness |
