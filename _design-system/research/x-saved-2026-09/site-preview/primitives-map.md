# Primitive map for the "6 rules" (read-only research, 2026-10-04)

Method. Counts come from a JSX opening-tag scanner (python, brace-aware, scratchpad `scan.py` + `cls.py`) over `app/`, `components/`, `components-legacy/` .tsx. It excludes `/dev/` routes, `/primitives/` itself and four untracked Finder copies ("page 2.tsx"). 487 files, 13,393 opening tags. Dashboard = path contains `/dashboard/`, `components-legacy/dashboard`, or `_components/dashboard`; customer = everything else (includes some admin/partner/editor pages, estimate). Each "pattern" is a heuristic class-string match, so counts are lower bounds for "same thing" and upper bounds for "exactly the 6-rule target". Every row below shows a real hit in the "known positive" line of its section. The generated reports (`_dupe-report.md` 2026-09-23, `_selected-state-report.md` 2026-09-23, `_geometry-report.md` 2026-09-05) were NOT used for counts (stale, different method).

## 0. Headline
- Real primitives exist for Input, Switch/Checkbox, Sheet/Dialog. Chip has 3 competing components. Missing as shared primitives: Button, IconButton (BackButton is partial), Card/Box (ui/card.tsx has 1 external use), ListGroup+Row, StatusPill, Stepper.
- External use of the primitives is tiny: e.g. Switch 14 tag lines, TextInput 15, Sheet 8, Modal 13, Checkbox 0, TabPill 6, PillToggle 5, versus hundreds of hand-made equivalents.
- The 6-rule radii (20 / 12 / full) are not tokenised: `rounded-card` 16, `rounded-btn` 99px, `rounded-pill` 9999px, `rounded-input` 16px, sheet 28px. 688 literal `rounded-[Npx]` classes across 32 distinct values.

## 1. Radius tokens today
| Source | Value | Evidence |
|---|---|---|
| tailwind.config.js:277-291 `borderRadius` | lg=var(--radius) (12px), md=calc(-2)=10px, sm=8px, card 16px, card-lg 20px, panel 16px, search 99px, pill 9999px, btn 99px, input 16px, sheet 28px | `sed -n 277,291p tailwind.config.js` |
| Tailwind defaults still active | `rounded` 4px, xl 12, 2xl 16, 3xl 24, full 9999 (no override in config) | not overridden in the block above (inference from config) |
| app/globals.css:38-44 | `--radius:12px; --radius-card:16px; --radius-card-outer:16px; --radius-pill:9999px; --radius-input:16px` | `grep -n radius app/globals.css` |
| globals.css base layer (~line 437-440) | ALL text inputs/textarea/select: `min-height:48px; border-radius:12px; border:1px solid #E4E4E7` (hairline, comment says grey fill, the owner 2026-08-09 note switched to a hairline). Out-specifies Tailwind, so TextInput/Select radius tokens are dead. | `sed -n 405,445p app/globals.css` |
| Mismatch vs 6 rules | `card` 16 and `input` 16 vs target 20 box / 12 inside; `btn` 99px works as "full"; `rounded-input` (16) still used 39x though CSS forces 12. `card-lg` 20 is the only 20. | |

Radius class usage (command: `python3 rad.py`, regex over rounded(-side)?-(\[..\]|named), 2,281 total uses, 487-file corpus minus dev/primitives; dash = dashboard count):
| Class | Uses | Files | Dash | 6-rule target |
|---|---|---|---|---|
| rounded-full | 509 | 181 | 117 | keep (tappable) |
| rounded-btn (99px) | 315 | 102 | 162 | = full, alias |
| rounded-pill (9999) | 258 | 103 | 87 | = full, alias |
| rounded-[12px] | 257 | 107 | 118 | inside a box: keep |
| rounded (4px bare) | 162 | 63 | 46 | off-scale |
| rounded-[16px] | 123 | 57 | 71 | off: becomes 20 or 12 |
| rounded-card (16) | 96 | 40 | 6 | becomes 20 |
| rounded-2xl (16) | 81 | 38 | 44 | becomes 20 |
| rounded-[8px] | 57 | 28 | 45 | off-scale |
| rounded-[14px] | 50 | 33 | 13 | off-scale |
| rounded-[10px] | 48 | 27 | 26 | off-scale |
| rounded-input (16) | 39 | 20 | 12 | becomes 12 |
| rounded-xl (12) | 36 | 20 | 18 | ok (12) |
| rounded-[24px] | 22 | 16 | 5 | off-scale |
| rounded-sm / md / lg | 21 / 18 / 8 | | | 8 / 10 / 12 |
| rounded-[20px] | 16 | 12 | 1 | keep (20) |
| rounded-card-lg (20) | 14 | 5 | 8 | keep (20) |
| rounded-[13/18/11/22/6/9/28/40/15/4/3] | 14/13/12/11/10/8/3/4/3/6/4 | | | off-scale |
| rounded-3xl (24) | 12 | 6 | 0 | off-scale |
Arbitrary `rounded-[Npx]` (incl. side variants listed in top 60): 688 uses, 32 distinct values. Inline `style={{borderRadius}}`: 29 (6x "12px", 5x 8, 5x "8px", 3x "28px"). Known positive: `app/error.tsx` has `rounded-btn bg-s-ink`. Only a small share is already on-scale: 12px (257+36) + full-family (1,082 incl. btn/pill) + 20 (30).

## 2. Grey dashboard page
- Source: `components-legacy/dashboard/DashboardLayout.tsx:300` `<div data-surface="dashboard" className="min-h-screen bg-s-bg-sunken flex">` (and :265 for the auth-loading skeleton). `bg-s-bg-sunken` = #F4F4F5 (tailwind.config.js:91 alias comment, globals.css:67).
- Cards on it use `bg-white` + `border border-s-border` (e.g. DashPanel DashboardUI.tsx:99). Changing the one class at line 300 (+265) whitens every dashboard page that renders inside DashboardLayout (grep `DashboardLayout` mentions in app/: 55 files; 49 `dashboard/**/page.tsx` exist).
- Body bg is `var(--base)` (globals.css:124), white. Other grey full pages (same pattern `min-h-screen ... bg-s-bg-sunken`): 8 customer-side hits in 5 files (`tip/[bookingId]` 3, `walk-in-tip/[token]` 3, `booking/[id]/fee/FeePayClient.tsx` 1, `brand/[slug]` 1). Total class `bg-s-bg-sunken` anywhere: 1,295 (all roles: grey control fills + page bgs).
- Command: `grep -rnE "min-h-screen[^\"]*bg-s-bg-sunken" app components-legacy --include='*.tsx'` -> 10 hits (2 dashboard, 8 other). Known positive shown by line 300.

## 3. Per-primitive findings

### 3.1 Button
- Owner: none exists. Closest: `DashButton` (`app/[locale]/_components/dashboard/DashboardUI.tsx:209`, primary/secondary/ghost, `rounded-btn`, primary = `bg-s-accent-bright` BLUE, secondary has hairline border). External uses of `<DashButton`: 0 (`grep -rE "<DashButton"` = 0). Also `SeeAllButton` (pill/link/circle variants), `BackButton`.
- Hand-made (command `cls.py`, `<button>` tags):
| Pattern | Total | Dash | Customer |
|---|---|---|---|
| any raw `<button>` | 885 | 369 | 516 (234 files) |
| `<button>` with rounded-btn/pill/[99/9999] | 346 | 176 | 170 |
| `<button>` with bg-s-ink / bg-black (ink fill) | 233 | 74 | 159 |
| `<button>` grey fill (bg-s-bg-sunken, gray-100) | 214 | 91 | 123 |
| `<button>` rounded-full | 151 | 40 | 111 |
| `<a>/<Link>` styled as button (rounded+bg+px) | 46 | 7 | 39 |
- Top files (raw `<button>`): dashboard/calendar/page.tsx 34, dashboard/settings/page.tsx 31, search/SearchOverlay.tsx 22, dashboard/services/page.tsx 20, dashboard/staff/page.tsx 19, dashboard/discovery-admin/page.tsx 16, dashboard/badge-manager/page.tsx 13, profile/settings/SettingsForm.tsx 13, search/SearchTemplate.tsx 12.
- Known positive: `app/error.tsx` `<button ... className="rounded-btn bg-s-ink px-7 py-3.5 ... text-white">`.
- Mismatch: no ink/grey two-tone Button; DashButton primary is blue (breaks "blue only for link text"); secondary uses a border.
- Competition: DashButton vs SeeAllButton(pill) vs BackButton vs ~230 inline copies.

### 3.2 IconButton (44 grey circle / 38 grey close)
- Owner: `BackButton` (`primitives/BackButton.tsx:46`: `h-11 w-11 rounded-full`, variant flat = `border border-s-border bg-white shadow-elevation-2`: white + border + shadow, not grey). `SeeAllButton` circle variant is `h-8 w-8 bg-s-bg-sunken` (grey but 32px) / shell `h-11 w-11`. No IconButton or Close component. `<BackButton` call sites: 17 tag lines in 16 files (`grep -rE "<BackButton"`).
- Hand-made: square icon-ish buttons (h/w 8-12 or 30-49px both axes): 85 (dash 23, customer 62) in 48 files; top: dashboard/calendar 8, dashboard/staff 5, search/SearchOverlay 5, ui/PhotoLightbox 4, barber/LiveQueuePanel 4. Close buttons (aria-label close/schliessen/fermer/chiudi): 32 in 28 files (customer 25), sizes mix h-11 w-11 (44) with the 38 close rule not expressed anywhere (`grep -rn "h-\[38px\]"` is only in DashboardLayout, e.g. the search button at :453).
- Known positive: auth/reset-password `<button ... grid h-11 w-11 ... place-items-center>`; close: dashboard/bookings `aria-label={tc("close")} className="grid place-items-center h-11 w-11 -m-2.5 rounded-full hover:bg-s-bg-sunken"` (also used inside Modal/Sheet primitives: `w-11 h-11 -m-2.5 rounded-md`, Modal.tsx:221, Sheet.tsx:262 which is rounded-md, not round).
- Competition: BackButton vs SeeAllButton circle vs Modal/Sheet's own close vs ~85 inline.

### 3.3 Chip / ChipGroup
- Owners (3 compete): `TabPill` (`primitives/TabPill.tsx`, `rounded-[16px]`, h-11, outline = hairline + white, selected = grey sunken; ghost variant), `PillToggle`/`PillGroup` (`primitives/PillToggle.tsx:65-71`, `rounded-full`, `border`, selected = `bg-s-bg-sunken ... border-s-border font-semibold`, unselected white + hairline), `SeeAllButton` pill. Plus feature-local `PillGroup` in `components-legacy/booking/HairStep.tsx` and `layout/CategoryPillRow.tsx`, `ui/ScrollableFilterRow.tsx`, `discovery/AISuggestionPills.tsx`.
- Call sites (`grep -rE "<(TabPill|PillToggle|PillGroup)\b"` ext): TabPill 6 lines/4 files, PillToggle 5, PillGroup 12 (4 files; one is the HairStep local def) -> ~23 tag lines total.
- Hand-made: `button/Link` with aria-pressed/aria-selected/role tab|radio|option + rounded: 57 (dash 11, customer 46) in 43 files; rounded-full + px-3/4 + border/bg on button/Link/span/div: 58 (dash 20, customer 38). Top: booking/resend-link/page.tsx (role=tab `h-[34px] rounded-[9px]`), BeautyProfileForm 3, onboarding/OnboardingFlow 3, discovery/ProgressiveFilter 3, search/FilterSheet 2, search/SearchTemplate 2. Selected-state drift (report 2026-09-23 claims 100 hard divergences incl. 22 blue-fill) not re-verified.
- Mismatch: TabPill radius 16 not full; PillToggle uses border (hairline inside no box); selected = grey (matches rule 3 grey vs ink: rule says ink = selected, here grey).

### 3.4 Card / Box
- Owner: `components/ui/card.tsx` (`rounded-card bg-s-bg-surface shadow-[0_6px_24px_rgba(0,0,0,0.06)]`, 16px, shadow). External use: 1 file (`profile/PaymentMethods.tsx`) -> `grep -rl components/ui/card`. Domain cards: `homepage/SalonCard.tsx`, `search/SalonResultCard.tsx`, `components-legacy/SalonCard.tsx`, `BookingCard`, `StampCard`, `NailDesignCard`, `DashPanel`/`DashStatCard` (`rounded-card-lg border border-s-border bg-white`, DashboardUI.tsx:99,136), `business/BentoCard`. 
- Hand-made boxes (div/section/article/li/Link with rounded-2xl/xl/card/card-lg/panel/[12-29px] + border|shadow|bg-white|bg-s-bg): 478 (dash 230, customer 248) in 206 files. Sub-counts: `rounded-2xl` any tag 77 (dash 42), `rounded-card|panel|card-lg` 95 (dash 14), `div ... border border-s-border ... rounded` 324 (dash 173, 153 files), `shadow-elevation-*` on div 45 (dash 4). Top files: dashboard/settings 15, dashboard/analytics 13, warum-solen 7, booking/resend-link 7, dashboard/coiffeur-crm 7, discovery-admin 7, dashboard/staff 7, dashboard/bundles 7, onboarding/salon 7, DashboardLayout 7.
- Known positive: `referral/[code]/page.tsx` `rounded-card-lg shadow-elevation-3 ... bg-[--raised]`.
- Mismatch: radius 16 not 20; box uses border (324 uses) and/or shadow (45) vs rule "hairlines only inside a box" (a box itself: no border; presumably grey/white via fill - ASK owner which). ~3 competing (ui/card, DashPanel, ad hoc).

### 3.5 ListGroup + Row
- Owner: none. Local copies: `profile/settings/page.tsx:138 Row`, `ExternalRow:158`, `_components/profile/AccountHub.tsx:261 Row`, `notifications/NotificationsClient.tsx:113 Row`, `layout/MobileMenu.tsx:442 MenuRow`, `dashboard/DashboardUI.tsx:163 DashRow` (used 3x), `primitives/ServiceDisclosureRow.tsx` (2 call sites), `profile/PaymentMethods.tsx:57 CardRow`, `salon/SalonServices.tsx:188 ServiceRow`, `SalonProducts.tsx:251 ProductRow`, `search/SearchOverlay.tsx` AutocompleteRow/SuggestRow, `discovery/DetailPage.tsx:476 DetailRow`, `DashboardAdvice AdviceRow`, plus `Switch`'s own row (Switch.tsx:135 `py-[14px] border-b border-s-border last:border-b-0`). Command `grep -rnE "function (\w*Row)\b"`: ~20 distinct local Row components.
- Hand-made hairline separators: `border-b|border-t` on div/li/Link/button: 173 (dash 56, customer 117) in 96 files; `divide-y`: 10 (all customer, 8 files). Top: refund/UpchargeApproveView 8, booking/PayConfirmStep 7, BookingsList 5, DashboardLayout 5, staff/StaffProfilePage 5.
- Known positive: `privacy/page.tsx` `sticky top-0 ... border-b border-s-border`. Counts are noisy (headers/toolbars also match); real list rows maybe a third (estimate).

### 3.6 Input / Search
- Owner: `primitives/TextInput.tsx` (+ `Textarea`, `Select`, `FieldLabel`, `FieldHelper`). Visual law actually lives in `app/globals.css` base layer (all inputs 48px, radius 12, hairline) so any raw `<input>` already looks like the primitive. External uses: TextInput 15 tag lines in 2 files (`auth/register/page.tsx`, `profile/settings/SettingsForm.tsx`), Textarea 1, Select 2, FieldLabel 11.
- Hand-made: raw `<input>` 220 (dash 143, customer 77, 83 files); text-like types 188 (dash 122); raw `<textarea>` 36 (dash 24); raw `<select>` 50 (dash 43, 25 files). Top files: dashboard/settings 25 (19 text), FormulaBook 9, dashboard/services 10, dashboard/staff 8, PromoManager 6, onboarding/salon 6, booking/resend-link 5.
- Search competitors (all hand-built, none shared): `homepage/SearchBar.tsx`, `homepage/HomeSearchPill.tsx`, `discovery/SearchBar.tsx`, `search/SearchOverlay.tsx` (2,700+ lines, 22 buttons), `Header` search, dashboard CommandPalette/SalonSwitcher search (carve-out in globals.css via `!border-0 !bg-transparent`). `input type=search|role=combobox` appears only 1x.
- Known positive: `auth/reset-password` `<input type={showPassword ? "text":"password"} ...>`.
- Mismatch: css base = hairline `#E4E4E7` + radius 12 (target: grey #F4F4F5 fill under "grey = every other control", 12 inside a box; hairline-border contradicts rule 4 unless inside a box). TextInput comments claim fill/radius are dead classes (TextInput.tsx:21-25).

### 3.7 Switch / Checkbox / Stepper
- Owners: `primitives/Switch.tsx` (`w-11 h-6 rounded-full`, on = `bg-s-ink`, off = `bg-s-ink/15`; matches ink = selected), `primitives/Checkbox.tsx` (`w-5 h-5 rounded-[6px]`, `border-2 border-s-ink/25`, checked ink fill), `Radio.tsx`. Stepper: none (spec says `ProgressStepper` "not yet extracted" in the registry; a quantity +/- stepper has 2 hand-made hits in `RetailManager.tsx`).
- Call sites: `<Switch` 14 (dashboard 4 pages: cities-admin, feature-flags-admin, salon-of-month-admin, bundles; plus SettingsForm 6), `<Checkbox` 0 external (only `ToSCheckbox` uses a raw input), `<Radio` 1.
- Hand-made: `role="switch"` 4 (dashboard/settings, homepage-admin, services, refund/ReportRefundEntry), `w-11 h-6 rounded-full` toggle lookalikes 3 (dashboard/settings blue `bg-s-accent`, barber/LoyaltyConfig), raw `<input type=checkbox>` 13 (dash 9; e.g. dashboard/settings `w-5 h-5 rounded border-s-border accent-s-ink`), `<input type=radio>` 1 (dashboard/bookings).
- Competition: low. Mismatch minimal: Checkbox border 2px grey-ish + 6px radius (not on the 20/12/full scale; checkbox is tappable so full or 6?). ASK owner.

### 3.8 Sheet / Dialog
- Owners: `primitives/Sheet.tsx` (`rounded-t-[28px]`, border-b header, shadow, overlay `rgba(26,18,9,0.40)`; close `rounded-md`) and `primitives/Modal.tsx` (`rounded-2xl` 16, border header/footer, close `rounded-md`), `useResponsiveOverlay`. Call sites: `<Sheet` 8 lines in 7 files (FilterSheet, PaymentMethods, LanguageSwitcher, SalonReviews (legacy), RescheduleSheet, StaffProfileSheet, CancelBookingSheet); `<Modal` 13 lines in 6 files (dashboard calendar/reviews, SettingsForm, FilterSheet, queue/[token], ReportButton).
- Competing/bypassing overlays (own markup, no primitive; checked by `grep primitives/(Sheet|Modal)` = 0 for GlassModal, FilterBottomSheet, WalkInModal, TipSheet): `components-legacy/ui/GlassModal`, `ui/FilterBottomSheet`, `ui/FilterDrawer`, `discovery/FilterDrawer`, `ui/QuickPreviewSheet`, `discovery/SaveToBoardSheet`, `ProfileSetupModal`, `booking/ServiceDetailSheet`, `booking/WaitlistModal`, `staff/StaffReviewsSheet`, `coiffeur/AiMatcherModal`, `dashboard/WalkInModal`, `tips/TipSheet`, `components/core/morphing-dialog.tsx`, SearchTemplate bottom sheet, MobileMenu. (~16 named files.)
- Pattern counts: `role=dialog|aria-modal` 20 (dash 3, 18 files), `fixed inset-0` blocks 62 (dash 23; many are decorative backgrounds, estimate half are overlays), bottom-sheet radii `rounded-t-*` 26 (dash 4).
- Known positive: `salon/SalonLightbox.tsx` `<div role="dialog" aria-modal="true" ... fixed inset-0 z-[80] bg-black/95>`.
- Mismatch: Sheet 28 and Modal 16 vs 20; borders on header/footer (inside a box: fine); shadows.

### 3.9 StatusPill
- Owners: `StatusPill` DELETED 2026-06-30 (registry row 134, REMOVED.md:46) -> `salon/StatusInline.tsx` (word colour only, used in 2 files), `DashStatusPill` (`DashboardUI.tsx:50`, `rounded-full px-2.5 py-1 text-[12px] ... tone bg-s-success-bg etc.` + animated dot; 24 tag lines in 15 dashboard pages), `ui/SalonBadge`, `SolenExclusiveBadge`, `discovery/PriceRangeBadge`, `SalonCard` DiscountBadge (pale-green -X%).
- Hand-made: badge-like `span` (rounded + bg + text 10-13px + px 1.5-3): 83 (dash 43, customer 40) in 53 files; tone-coloured status spans (bg-green/red/amber...): 8. Top: dashboard/discovery-admin 7, partner/page 4, dashboard/settings 4, dashboard/earnings 4, components-legacy/SalonCard 4.
- Known positive: `dashboard/bundles/page.tsx` `<span className="rounded-full bg-s-success-bg px-2.5 py-1 ... text-s-success">`.
- Mismatch: coloured fills are rule 6 compliant only if colour carries meaning; DashStatusPill's pulse dot is extra; customer side has no shared pill.

## 4. Customer vs dashboard (headline numbers)
| Class | Customer | Dashboard |
|---|---|---|
| raw `<button>` | 516 | 369 |
| raw `<input>` | 77 | 143 |
| `<select>` | 7 | 43 |
| box divs | 248 | 230 |
| badge spans | 40 | 43 |
| overlays (role=dialog) | 17 | 3 |
Dashboard dominates forms/selects/boxes; customer dominates buttons, chips, overlays. The dashboard has a parallel mini-kit (`DashboardUI.tsx`: DashStatusPill, DashPanel, DashStatCard, DashRow, DashQuickAction, DashButton) that duplicates Card/Row/Button/StatusPill and is used by 13 files (`grep -rl DashboardUI`), only DashStatusPill/DashPanel/DashRow have call sites.

## 5. Not verified
- Whether the 6-rule grey/ink targets apply to Checkbox (6px radius) and box borders (owner choice).
- Selected-state / dupe-report claims (stale 2026-09-23; counts above are independent).
- "Hand-made" class matches are heuristic; a manual sample of 5 per pattern was only done for the first hit ("known positive") each.
- `components-legacy/` may be partly unrouted; reachability not checked (would settle with an import graph).

## 6. Fix order (by call sites reached)
1. Radius tokens + `rounded-btn/pill`/`card` aliases (retarget `card` 16->20, `input` 16->12 in tailwind.config.js + globals.css): reaches ~136 named-token uses (rounded-card 96, rounded-input 39, panel 1) with no per-file change; the ~81 rounded-2xl, 123 rounded-[16px] and 688 arbitrary literals need per-file edits or a codemod. 
2. Grey page: `DashboardLayout.tsx:300/265` `bg-s-bg-sunken` -> white (+ 5 customer pages): one edit, all 49 dashboard pages.
3. Button (new, replaces DashButton): 885 raw buttons (233 ink, 214 grey, 346 pill-radiused) - largest visible gain.
4. Box/Card (retarget `components/ui/card.tsx`, `DashPanel`): 478 hand-made boxes + border-vs-fill policy.
5. IconButton (+38 close): 85 square buttons + 32 close buttons, one grey recipe.
6. Chip/ChipGroup (merge TabPill + PillToggle): 57 + 58 hand-made, ~23 primitive uses.
7. Input: globals.css base already covers 220 inputs; only change fill/border (one rule).
8. Sheet/Dialog: unify radius and fold in ~16 bypassing overlays.
9. ListGroup+Row, StatusPill, Switch/Checkbox/Stepper: smaller reach (<=173 / 83 / 14).
