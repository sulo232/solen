# Solen — Design Contradictions (systematic audit, 2026-06-08)

The punch list of "one concept treated inconsistently across the app." Produced by a 4-axis
read-only audit (state / colour / spacing-radius-shadow / duplication) over the customer-facing
surface (`app/[locale]/_components/{search,salon,homepage,business,layout,primitives}` +
`components-legacy/{booking,ui,loyalty,staff}`). Each item: the conflict (real `file:line`) → the
single rule it should collapse to. Reference: the 🔒 contract in `CLAUDE.md` + `LOCKFILE.md`.

## Root cause (read this first)
**~70% of findings are one thing:** `components-legacy/` was written before the
`s-ink-2` / `s-border` / `s-bg-sunken` token convention and never got the sweep that
`app/[locale]/_components/` got. A scoped token-sweep of `components-legacy/{booking,ui,loyalty,staff}`
(`text-s-ink/{50–65}`→`text-s-ink-2`, `border-s-ink/{10–20}` + `border-black/{5–8}`→`border-s-border`,
`bg-s-ink/[0.02–0.10]`→`bg-s-bg-sunken`, `fill-s-amber`/`#FFC32B`→`fill-s-star`) clears the bulk.
The genuinely *new-code* contradictions are the smaller hand-fix list at the bottom.

---

## 🔴 0 · ACTUAL BUGS (broken, not just inconsistent) — fix first
- **Dead hover classes** (malformed dark-variant fragments → compile to nothing, hover silently missing): `components-legacy/booking/BookingCard.tsx:200,215,224` (`hover:bg-s-ink/[0.06]:bg-white/[0.08]`), `components-legacy/ui/ScrollableFilterRow.tsx:105,128` (`hover:text-s-accent:text-s-accent`), `components-legacy/ui/GuidedSearch.tsx:366,383,400,615,641,660,769,776,793`, `ui/ReportContentButton.tsx:62`. → strip the second `:…` fragment.
- **Killed token = invisible stars**: `fill-s-amber`/`s-amber` is permanently retired (LOCKFILE §1) yet used for rating stars in `components-legacy/booking/BookingCard.tsx:136`, `staff/StaffProfilePage.tsx:389,420`, `ui/QuickPreviewSheet.tsx:143`, `ServiceAutosuggest.tsx:224`, `SearchAutocomplete.tsx:262`, `StaffReviewsSheet.tsx:97,182`. → `fill-s-star`.
- **Token name as literal CSS string** (renders nothing): `components-legacy/ui/GuidedSearch.tsx:919–973` (`background: "s-ink"`, `border: "1.5px solid s-ink"`) + hardcoded hex step nodes `:495`. → real tokens / inline hex via vars.
- **Error state painted blue, not red**: `components-legacy/ui/AddressAutocomplete.tsx:49` error border = `border-s-accent` (blue). → `border-s-error` (universal-colour table: error = red).

## 1 · STATE treatments (same state, ≥2 looks)
- **Filter chip selected** — 3 fills: canonical `border-s-accent + text-s-accent`, NO fill (`search/SearchTemplate.tsx:1083`, V3-D450) vs ink fill `bg-s-ink text-white` (`ui/SubCategoryChips.tsx:50`, `FilterBar.tsx:101`, `ScrollableFilterRow.tsx:104,127`, `FilterDrawer.tsx:121`, `FilterBottomSheet.tsx:110`) vs blue-wash fill (`search/FilterSheet.tsx:236`). → blue border + blue text, no fill.
- **Pill hover (inactive)** — 4 ways: `hover:bg-s-bg-sunken` (`SearchTemplate.tsx:1084`) vs `hover:border-s-ink` (`FilterSheet.tsx:237`) vs `hover:border-s-ink/20 hover:text-s-ink/80` (`SubCategoryChips.tsx:51`) vs `hover:border-s-accent/40 hover:text-s-accent` (`ScrollableFilterRow.tsx:105`,`FilterBar.tsx:102`). → sink `bg-s-bg-sunken`.
- **Input focus** — single ink edge (`primitives/TextInput.tsx:28`,`Select.tsx:26`,`Textarea.tsx:26`) vs double accent ring (`booking/GuestBookingForm.tsx:115` `focus:ring-2 focus:ring-s-accent-pale`, `ui/AddressAutocomplete.tsx:49` `focus:ring-2`). → single ink edge; route legacy inputs through `TextInput`.
- **Selected list-row marker** — decorative leading dot (`ui/SortDropdown.tsx:128,132`) vs bg-tint + accent text, no dot (`ui/SearchAutocomplete.tsx:224,249,300`). → tint + accent text, NO dot (§0.11 bans pips).
- **Selected segmented control** — `bg-s-bg-sunken text-s-ink` (`primitives/TabPill.tsx:67`) vs `bg-s-ink text-white` (`primitives/PillToggle.tsx:69`) vs blue-wash (`FilterSheet.tsx:306`). + TabPill's comment "matches search filter selection" is now false. → one segmented-selected recipe.
- **Pressed `active:scale`** — 6 depths (`0.97`×41, `0.98`×13, `0.99`×6, `0.94`×4, `0.95`×2, `0.92`×2). → `0.97` tappables / `0.98` full-width CTAs.
- **Disabled opacity** — `opacity-50` (`TextInput.tsx:30`) vs `opacity-40` (`Switch/Checkbox/Radio/PillToggle`) vs `opacity-30` (`DateTimePicker.tsx:468`,`SalonVenuesNearby.tsx:115`). → one (`opacity-40` or `text-s-ink-disabled`).
- **Card/option hover** — `-translate-y-[3px] scale-[1.015] shadow-elevation-3` (`homepage/SalonCard.tsx:467`,`search/SalonResultCard.tsx:357`) vs only `shadow-elevation-2` (`business/BentoCard.tsx:84`) vs `-translate-y-[5px]` (`booking/BookingCard.tsx:127`). → one lift recipe (§4).
- **Icon-circle hover** — `hover:bg-s-bg-sunken` (×48) vs `hover:bg-s-ink/[0.06]` (×10, `booking/BookingExitButton.tsx:43,66`, `staff/StaffProfilePage.tsx:207`). → `bg-s-bg-sunken`.
- **Selected pill accent token** — `s-accent-bright` mixed with `s-accent` (`booking/WaitlistModal.tsx:154`) vs canonical `s-accent` (`SearchTemplate.tsx:1083`). → `s-accent`; never mix two blues in one control.
- **NON-contradiction (verified):** `DateTimePicker.selectedTone` (blue fill in search, ink in booking) is intentional + contract-correct. Leave it.

## 2 · COLOUR / TOKEN semantics (same role, ≥2 tokens)
- **Secondary text** (~420 legacy hits, the biggest): `text-s-ink-2` (new) vs `text-s-ink/{50,55,60,65}` (legacy `booking/BookingCard.tsx:181`, `PayConfirmStep.tsx:251`, `ServiceAutosuggest.tsx:139`…). → `text-s-ink-2`.
- **Hairline** (~30 hits): `border-s-border` vs `border-s-ink/10` (`booking/BookingCard.tsx:113`) vs `border-black/5`,`/[0.07]`,`/[0.08]` (`homepage/Hero.tsx:238`, `CategoryStack.tsx:89`, `layout/Header.tsx:296`, `homepage/WhySolen.tsx:158` `#E0E5DD`). → `border-s-border`.
- **Muted/inert surface**: `bg-s-bg-sunken` vs `bg-s-ink/[0.03–0.10]` (`layout/Header.tsx:171`, `MobileMenu.tsx:193`, `homepage/SearchBar.tsx:476`, `GuidedSearch.tsx:663`). → `bg-s-bg-sunken` (keep ink-opacity only for true scrims).
- **Rating star** (3-way): `fill-s-star` (new) vs `fill-s-amber` (dead) vs raw `#FFC32B` (`salon/SalonReviews.tsx:54`, `staff/StaffProfilePage.tsx:389,420`, `homepage/WalkInBand.tsx:73`). Empty star: raw `#E7E5E4` (stale border hex) → `fill-s-border`.
- **Tertiary text**: `s-ink-2` vs `s-ink-3` used interchangeably for sub-meta (`salon/SalonReviews.tsx:62`, `SalonServices.tsx:183`) — same hex `#6B6B6B`. → pick `text-s-ink-2`, retire `-3`.
- **Card-meta line / meta icons**: `text-s-ink-2` vs `text-s-ink/{50,60,65}` (`ui/FeaturedSalonCarousel.tsx:247`, `QuickPreviewSheet.tsx:151`, `booking/BookingCard.tsx:167`). → `text-s-ink-2`.
- **Disabled/placeholder text**: `/20`,`/30`,`/40` spread (`date-picker.tsx:93`, `DateTimePicker.tsx:316`, `PayConfirmStep.tsx:357`). → `text-s-ink-disabled`/`-3`.
- **Dismiss icon (X) colour**: `/30`,`/40`,`/60` (`ui/Toast.tsx:69`, `WaitlistModal.tsx:120`, `GlassModal.tsx:152`). → `text-s-ink-2` → `hover:text-s-ink`.

## 3 · SPACING / RADIUS / SHADOW (equivalent element, ≥2 values)
- **Salon result-card photo radius**: `rounded-[22px]` vs `[18px]` vs `[16px]` across one "card family" (`search/SalonResultCard.tsx:357,279,213`; homepage twin `:464`=22). → `rounded-[22px]`.
- **PDP section-card hover shadow**: `shadow-elevation-2` (`SalonLoyalty.tsx:72`) vs raw `rgba` (`SalonServices.tsx:203`, `SalonOtherLocations.tsx:67`). → `shadow-elevation-2`.
- **PDP section-card padding**: `p-5 md:p-6` vs `p-4 md:p-5` vs `p-6 md:p-7` (`SalonSidebar`, `SalonLoyalty`, `SalonServicesSheet.tsx:384`). → `p-5 md:p-6`.
- **Form input radius** (primitive contradicts spec): `rounded-[12px]` (`primitives/TextInput/Select/Textarea`) vs LOCKFILE `input`=16 vs `rounded-[13px]` (`SearchOverlay`, `SearchBar`). → one token (`rounded-input`).
- **Bottom-sheet top radius**: `rounded-t-[28px]` (`primitives/Sheet.tsx:38`, the token) vs `rounded-t-[20px]` (`SearchTemplate.tsx:1433`, `FilterBottomSheet.tsx:76`) vs `rounded-t-3xl` (`WaitlistModal`, `ServicesStaffStep`, `QuickPreviewSheet`). → `rounded-t-[28px]`.
- **Reviews container radius**: `rounded-3xl` (PDP `SalonReviews.tsx:41`) vs `rounded-2xl` (homepage `Reviews.tsx:172`). → `rounded-2xl`.
- **Receipt section radius**: `rounded-card-lg` vs `rounded-card` in one file (`booking/BookingConfirmation.tsx:213` vs `298,392,432`). → `rounded-card`.
- **Inner inset tile radius**: `rounded-[12px]` (many) vs `panel`=16. → `rounded-panel`.
- **Shadow token spelling**: `shadow-card` (`BookingConfirmation`) vs `shadow-elevation-1` (everywhere) — identical render, two names. → `shadow-elevation-1`.

## 4 · DUPLICATED patterns / MISSING shared primitives
- **`<RatingStars>` — DOES NOT EXIST**, hand-rolled ~14× (single ★+decimal) + 5× (0–5 multi-star, two as raw `<svg><polygon>`). Sites incl. `homepage/SalonCard.tsx:540`, `search/SalonResultCard.tsx:223,290,368`, `salon/SalonHeader.tsx:84`, `salon/SalonReviews.tsx:51,150`, `booking/StaffPicker.tsx:32`. → **create `<RatingStars value count? max? />`**, collapse all.
- **`<Avatar>` (photo-or-initial) — DOES NOT EXIST**, rebuilt 6+× (`salon/SalonReviews.tsx:113`, `SalonTeam.tsx:108`, `booking/StaffPicker.tsx:70`, `StaffListSheet.tsx:88`, `staff/StaffProfilePage.tsx:220`). → **create `<Avatar src name size />`** (owns `avatarColor()` in `salon/_shared.ts:236`).
- **Staff floating rating-badge** — byte-identical block copy-pasted 3× (`SalonTeam.tsx:123`, `StaffPicker`, `StaffListSheet.tsx:97`). → one `<StaffAvatar>`.
- **`<PriceFrom>` ("ab X CHF") — DOES NOT EXIST**, 3 ways inside `SalonResultCard.tsx` alone (`235,305,389`) + `SalonServices.tsx:187`. → `<PriceFrom amount label? />`.
- **`<BackButton>` (frosted ArrowLeft)** — hand-rolled per surface (`SalonHero.tsx:75`, `SalonStickyTabNav.tsx:185`, `BookingWizard.tsx:177`, `Breadcrumb.tsx:66`). → one `<BackButton variant=glass|flat>` (glass shares `FROST_GLASS`).
- **Two Skeletons**: `primitives/Skeleton.tsx` (canonical) vs `components-legacy/ui/Skeleton.tsx` (imported by ~10 `loading.tsx`). → delete legacy, repoint.
- **Two Toasts**: `primitives/Toast.tsx` (canonical) vs `components-legacy/ui/Toast.tsx` (imported by `layout.tsx`, auth pages). → consolidate to primitive.
- **Two Breadcrumbs**: `ui/Breadcrumb.tsx` (global) vs `salon/SalonBreadcrumb.tsx` (already collided — see its `:18` comment). → one primitive.
- **Two Lightboxes**: `salon/SalonLightbox.tsx` vs `ui/PhotoLightbox.tsx`. → one.
- **Filter-component graveyard**: `FilterBar`, `FilterDrawer` (×2), `FilterBottomSheet`, `ScrollableFilterRow`, `SortDropdown`, `SubCategoryChips`, `ExpandableTabs` beside canonical `search/FilterSheet.tsx`. → standardize on FilterSheet + TabPill.
- **Two EmptyState locals** beside the shared one: `search/SearchResults.tsx:382`, `SearchTemplate.tsx:1627`. → shared `<EmptyState>`.
- **Carousel arrows** re-implemented: homepage `SectionHeader.tsx:120` vs `salon/SalonVenuesNearby.tsx:80`, `SalonOtherLocations`. → reuse the homepage `ScrollArrow`.

---

## Recommended order of attack
1. **Bugs first** (§0) — dead hovers, invisible `s-amber` stars, literal `"s-ink"`, blue error. Small, high-impact, user-visible.
2. **Legacy token sweep** (§2 root cause) — one scripted pass over `components-legacy/{booking,ui,loyalty,staff}` mapping the opacity/black tokens → semantic tokens. Clears the bulk + the §1 hairline/star findings.
3. **State unification** (§1) — filter chips, pill hover, input focus, segmented-selected. New-code, hand-fix, locks the contract rows.
4. **Missing primitives** (§4) — build `<RatingStars>` + `<Avatar>` + `<PriceFrom>` + `<BackButton>`, then retire the duplicate Skeleton/Toast/Breadcrumb/Lightbox/filter-set.
5. **Spacing/radius/shadow** (§3) — the proportional pass; do last (cosmetic, lower blast radius).
</content>
