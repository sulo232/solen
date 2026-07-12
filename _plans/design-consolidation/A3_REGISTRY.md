# A3 — Component Registry Audit (registry-vs-code truth)

Read-only audit. Scope: `_design-system/COMPONENT_REGISTRY.md`, `_design-system/components/*.md` (36 docs), `app/[locale]/_components/{primitives,search,salon,homepage,business,layout,landings,dashboard,profile}/`, `components-legacy/{booking,ui,loyalty,staff}/`.

---

## 1. PHANTOM PATHS

Checked every `File:` path in all 36 `_design-system/components/*.md` docs plus every `File` column in `COMPONENT_REGISTRY.md`'s tables (Glob/existence check on each).

**Result: 1 confirmed phantom, all 55 others resolve.**

| Doc / row | Claimed path | Reality |
|---|---|---|
| `_design-system/components/StatusPill.md:3` (`**File:** [app/[locale]/_components/salon/StatusPill.tsx]`) AND `COMPONENT_REGISTRY.md:52` (`**StatusPill** \| \`salon/StatusPill.tsx\` \| ... \| locked`) | `app/[locale]/_components/salon/StatusPill.tsx` | **File does not exist.** Verified via Glob — no `StatusPill.tsx` anywhere in the repo (`find . -iname "StatusPill.tsx"` → zero hits outside the two doc mentions). It was replaced by `app/[locale]/_components/salon/StatusInline.tsx` (confirmed exists, imported by `SalonHeader.tsx` and `SalonSidebar.tsx`). `StatusInline.tsx:5` literally says in its own header comment: "Replaces StatusPill in surfaces where the pill chrome... is too heavy." `SalonSidebar.tsx:39` and `SalonHeader.tsx:34` also reference the replacement in comments. The dashboard's `DashStatusPill` (`dashboard/DashboardUI.tsx`) is unrelated and correctly documented elsewhere — only the salon open/closed `StatusPill` is phantom. |

Secondary stale cross-references (not path claims themselves, but docs that still point AT the dead `StatusPill` as if it's a live component to use):
- `_design-system/components/SuccessMark.md:13` — "Don't reuse for... a static 'done/complete' status chip (use `StatusPill` or a plain `Check`)"
- `_design-system/components/CardText.md:39` — "semantic status (use `StatusPill`...)"

**Fix:** rewrite `StatusPill.md` as `StatusInline.md` (or retitle in place) pointing at `salon/StatusInline.tsx`, update the registry row's File column, and update the two stale cross-references above to point at `StatusInline`.

---

## 2. DOC-vs-LOCKFILE literals

Spot-checked hex/px/token literals in all 36 docs against `_design-system/LOCKFILE.md` and the CLAUDE.md design-contract table. Most docs are accurate and correctly cite provenance/history as history (e.g. `SalonCard.md`, `Skeleton.md`, `SearchBar.md`, `HeartButton.md`, `ProgressStepper.md`, `SuccessMark.md` all correctly frame retired values as retired). Four real violations found, two of them severe:

### 2a. Toast.md — describes a fully retired recipe (SEVERE)

`_design-system/components/Toast.md` (entire "Visual signature" §103-134, "Position" §118-121, dot-colors table §122-131) documents the **V3-D195 recipe**: `bg-s-ink` (#0A0A0A) dark pill, white text, top-of-viewport position, 10px colored dot as the only signal.

The actual shipped code, `app/[locale]/_components/primitives/Toast.tsx:190-212`, was rebuilt under **V3-D462 (2026-06-13)** to the Chime/Google-Photos recipe:
```
Toast.tsx:197-204   TOAST_PILL = "rounded-[16px] ... bg-white border border-s-border text-s-ink"
Toast.tsx:207-213   toneBadge = circle-badge per tone (tint bg + saturated glyph), NOT a plain dot
Toast.tsx:237       "bottom-[max(1rem,...)]"  ← bottom-docked, not top
```
The code's own comment at line 193-196 states: "V3-D462: owner-locked to the Chime/Google-Photos recipe — a CLEAN LIGHT pill... docked at the BOTTOM. Replaces the pastel-whole-pill tints." This matches user memory `project_toast_recipe_locked.md` ("toast LOCKED to Chime recipe: light pill + green-check badge + bottom + blue action") — confirming the doc, not the code, is what's wrong. **`Toast.md` was never updated after V3-D462 and documents a dead recipe wholesale.**

### 2b. FilterSheet.md — documents banned black-fill selected state

`_design-system/components/FilterSheet.md:25-27`: "Active chips use the ink fill (`bg-s-ink text-white`), inactive use white + `s-border` hairline."

This directly contradicts the LOCKED design-contract row: *"selected / active | calm GRAY fill: `bg-s-bg-sunken` ... NEVER black/ink fill on a selected state (gate `no-black-selected`)"* and the filter-pill row specifically: *"selected = `bg-s-bg-sunken` + `text-s-ink` + semibold (calm gray, never blue-border, never black)."*

The actual code, `app/[locale]/_components/search/FilterSheet.tsx:374-379`, is correct and matches the lock:
```tsx
active
  // Owner (2026-07-02, approved mockup /dev/filter-refine): selected = calm GRAY sunken,
  ? "border border-transparent bg-s-bg-sunken text-s-ink font-semibold"
  : "border border-s-border bg-white text-s-ink hover:bg-s-bg-sunken",
```
So the doc describes the pre-2026-07-02 ink-fill recipe that the code has since abandoned. Doc is stale by ~5 days relative to the owner-approved fix.

### 2c. BackButton — 40×40, below the locked 44px touch-target floor

`COMPONENT_REGISTRY.md:42` and `_design-system/components/BackButton.md:13` both state: "Both: 40×40 round, centred 18px `ArrowLeft`..." The code agrees — `app/[locale]/_components/primitives/BackButton.tsx:35`: `"grid h-10 w-10 place-items-center rounded-full..."` (40px = `h-10 w-10`).

This is doc+code in agreement with each other, but both contradict two rows of the LOCKED design contract: *"icon-button | `h-11 w-11`"* and *"touch target | interactive controls ≥ 44px (`h-11`), the a11y floor."* This is a genuine, three-way-consistent (registry + doc + code) violation of the 44px floor, not just a documentation drift — the shipped button is 4px under the accessibility minimum.

### 2d. SectionMeta eyebrow — code drifts from both doc and LOCKFILE (code-side, doc is correct)

`_design-system/components/SectionTitle.md:50` states "11-12px" for the eyebrow, which correctly matches `LOCKFILE.md:229,251` (`text-[11px] md:text-[12px]`, responsive). But the actual code, `app/[locale]/_components/homepage/SectionHeader.tsx:66`, renders a flat `text-[13px]` with no responsive breakpoint — neither 11 nor 12. The doc is right; the code has drifted. Flagged here because it means the doc *cannot* be used to verify the live surface (a reader trusting SectionTitle.md would report the eyebrow correctly, then find the live page doesn't match).

### 2e. Bonus — SearchOverlay contradicts registry's own claim + the locked DateTimePicker rule

`COMPONENT_REGISTRY.md:103` (SearchOverlay row) states: "Zeit drill-in via `DateTimePicker` single-date + period chips." This is false. `app/[locale]/_components/search/SearchOverlay.tsx` has **zero** references to `DateTimePicker` (`grep -n "DateTimePicker" SearchOverlay.tsx` → no hits) and instead hand-builds its own calendar: local `isoDate`/`dateLabel`/`zeitPeriod`/`dateScrollRef`/`dateTab` state plus inline month-grid math (`SearchOverlay.tsx:74-75`: `new Date(y, m, 1).getDay()`, `new Date(y, m + 1, 0).getDate()` — literal calendar-generation code). This directly violates the LOCKED contract row: *"date / time | ONE `DateTimePicker` primitive... NO bespoke date UI (V3-D445)."* Not just a doc inaccuracy — a live LOCKFILE violation in shipped code, mis-described as compliant by the registry itself.

---

## 3. UNDOCUMENTED SHARED PRIMITIVES

`app/[locale]/_components/primitives/` has 28 files; only 12 have a registry row + doc (`Avatar, BackButton, CardText [CardName/CardMeta], ComingSoon, PriceFrom, RatingStars, Skeleton, SkeletonCard, SuccessMark, TabPill, Toast`, plus `DateTimePicker` which has a doc but no registry row — see below). The rest are undocumented. Import counts below exclude the file's own definition and `app/[locale]/dev/primitives/page.tsx` (the internal showcase page).

| Component | Path | Real call-sites (grep evidence) | Registry row? | Doc? |
|---|---|---|---|---|
| **Modal** | `primitives/Modal.tsx` | 8 real: `dashboard/all-salons`, `dashboard/calendar`, `dashboard/all-users`, `dashboard/bookings`, `dashboard/badge-manager`, `dashboard/review-moderation`, `dashboard/staff`, `dashboard/services` (all `page.tsx`) + `search/FilterSheet.tsx`; also used internally by `primitives/Sheet.tsx` and `primitives/CookieConsent.tsx` | No | No |
| **Sheet** | `primitives/Sheet.tsx` | 3 real: `salon/SalonTeam.tsx`, `primitives/DateTimePicker.tsx`, `dashboard/bookings/page.tsx` (+3 dev-only pages) | No | No |
| **Switch** | `primitives/Switch.tsx` | 5 real: `dashboard/cities-admin/page.tsx`, `dashboard/bundles/page.tsx`, `profile/settings/SettingsForm.tsx`, `layout/CityTopBar.tsx`, `primitives/CookieConsent.tsx` | No | No |
| **FieldLabel** | `primitives/FieldLabel.tsx` | 6: `profile/settings/BeautyProfileForm.tsx`, `profile/settings/SettingsForm.tsx` (real callers) + `TextInput.tsx`, `Radio.tsx`, `Select.tsx`, `Textarea.tsx` (internal composition) | No | No |
| **CookieConsent** (exports `CookieConsentProvider`) | `primitives/CookieConsent.tsx` | 1 (root-mounted once, `app/[locale]/layout.tsx:26,60`) — same architectural class as `OfflineBanner`/`Toaster` (both documented) | No | No |
| **WelcomeToast** | `primitives/WelcomeToast.tsx` | 1 (root-mounted once, `app/[locale]/layout.tsx:12,137`) — same class as `OfflineBanner` (documented) | No | No |
| **Logo** | `primitives/Logo.tsx` | 1 (`layout/Header.tsx`) — the site logo, high-visibility despite low fan-out | No | No |
| **TextInput** | `primitives/TextInput.tsx` | 1 real (`profile/settings/SettingsForm.tsx`) | No | No |
| **PillToggle** | `primitives/PillToggle.tsx` | 1 real (`search/FilterSheet.tsx`) + internal use by `Radio.tsx`/`Checkbox.tsx` | No | No |
| **Checkbox** | `primitives/Checkbox.tsx` | 0 real external (only used inside `PillToggle.tsx`) | No | No |
| **Radio** | `primitives/Radio.tsx` | 0 real external | No | No |
| **Select** | `primitives/Select.tsx` | 0 real external | No | No |
| **Textarea** | `primitives/Textarea.tsx` | 0 real external | No | No |
| **FieldHelper** | `primitives/FieldHelper.tsx` | 0 real external (used inside `TextInput.tsx`) | No | No |
| **SkipLink** | `primitives/SkipLink.tsx` | 0 real external — worth flagging separately: an a11y skip-link that's apparently never mounted in production layout is a functional gap, not just a doc gap | No | No |
| **DateTimePicker** | `primitives/DateTimePicker.tsx` | 1 real (`homepage/SearchBar.tsx`) — **has a doc** (`components/DateTimePicker.md`) **but no registry row** (checked: zero `**DateTimePicker**` row hits in `COMPONENT_REGISTRY.md`) | **No** | **Yes** |

Outside `primitives/`, one component clears the 3+-import bar with no row/doc:

| Component | Path | Real call-sites | Registry row? | Doc? |
|---|---|---|---|---|
| **SalonBundles** | `salon/SalonBundles.tsx` | 3: `dashboard/bundles/page.tsx`, `salon/SalonDetailV3.tsx`, `dev/bundle-builder/page.tsx` | No | No |

Below the 3+ bar but directly relevant to Finding 1 (the StatusPill phantom): **StatusInline** (`salon/StatusInline.tsx`) has exactly 2 real callers (`SalonHeader.tsx`, `SalonSidebar.tsx`) — the literal replacement for the phantom `StatusPill`, itself undocumented.

Note on method: several homepage-section names (`Nearby`, `RecentlyViewed`, `Reviews`, `Hero`, `Entdecken`) initially looked over the 3+ bar under a loose `\bname\b` grep, but on precise import-line inspection every one of those resolved to a single real caller (`app/[locale]/page.tsx`) — the earlier matches were German/English UI-copy strings and comments, not imports. Excluded to avoid a false positive; noted here so a future pass doesn't need to re-derive this.

---

## 4. STALE STATUS TEXT

Checked every registry row whose status text makes a migration/adoption claim, against real import counts.

| Row | Registry status text | Reality (grep evidence) | Verdict |
|---|---|---|---|
| **Avatar** (`COMPONENT_REGISTRY.md:40`) | "new, 2026-06-08, **not yet migrated into call-sites**" | 4 real production call-sites: `profile/page.tsx`, `salon/SalonReviews.tsx:183`, `salon/SalonTeam.tsx:182`, `reviews/_components/MarketplaceReviewsList.tsx`, plus `components-legacy/staff/StaffProfilePage.tsx:247,424` (5 total) | **STALE.** Fully migrated; status text should read "locked" or similar. |
| **PriceFrom** (`COMPONENT_REGISTRY.md:41`) | "new, 2026-06-08, **not yet migrated into call-sites**" | 3 real call-sites: `salon/SalonServices.tsx`, `search/MapSalonDetail.tsx`, `search/SalonResultCard.tsx` — matches the doc's own "Collapses 3 'ab X CHF' spellings inside SalonResultCard alone + SalonServices" provenance claim | **STALE.** Migrated to its originally-targeted call-sites (though 2 *other* files still hand-roll "ab CHF" — see §5 below). |
| **BackButton** (`COMPONENT_REGISTRY.md:42`) | "new, 2026-06-08, **not yet migrated into call-sites**" | 1 of 4 originally-flagged hand-rolled sites migrated (`SalonHero.tsx:104`); 1 site's back button was deleted outright (`Breadcrumb.tsx`, per V3-D461 comment — mobile back button removed as redundant, not migrated); 2 sites still hand-roll (`SalonStickyTabNav.tsx:185`, `components-legacy/booking/BookingWizard.tsx:186,201`) | **Mostly accurate**, not stale — genuinely partial. Minor undercount (1 site is done) but the headline claim ("not yet migrated") is still substantially true. |

Also checked (spot-check, not stale): **SkeletonCard** ("new (2026-06-08)") — 5 real callers (`app/[locale]/loading.tsx`, `search/loading.tsx`, `coiffeur/loading.tsx`, `behandlungen/[...slug]/TreatmentsClient.tsx`, `behandlungen/[...slug]/page.tsx`); status text doesn't claim non-adoption so not contradicted, just under-advertised as still "new."

---

## 5. CONSOLIDATION-PRIMITIVES VERIFICATION (CONTRADICTIONS.md §4, claimed executed 2026-06-08)

Verified each of the 6 claims against current code.

### RatingStars — CONSOLIDATED (for originally-flagged sites), 2 new leftover duplicates found
- Exists: `primitives/RatingStars.tsx`. Confirmed.
- All 6 originally-flagged hand-rolled sites checked and now import `RatingStars`: `homepage/SalonCard.tsx:575`, `search/SalonResultCard.tsx:284,324,390,511,554,622`, `salon/SalonHeader.tsx:96`, `salon/SalonReviews.tsx:195`. `components-legacy/booking/StaffPicker.tsx` (the 6th flagged site) no longer exists at all — file was removed.
- **Leftover hand-rolled `#FFC32B` star, NOT via RatingStars:** `components-legacy/discovery/CardSignals.tsx:36` — `<Star size={11} fill="#FFC32B" stroke="none" aria-hidden />`, a real React component that could use `RatingStars` but doesn't.
- `components-legacy/MapView.tsx:304` also hand-rolls a raw SVG polygon star with `#FFC32B`, but it's inside an HTML-string template (likely a Leaflet marker popup) — plausibly a real technical constraint (can't mount a React component inside a map-library popup string) rather than an oversight; flagged for awareness, lower confidence than CardSignals.
- **Verdict: PARTIAL** — original scope done, 1-2 new leftovers outside original scope.

### Avatar — CONSOLIDATED
- Exists: `primitives/Avatar.tsx`, owns canonical `avatarColor()` (line 22).
- All 5 originally-flagged sites confirmed migrated: `salon/SalonReviews.tsx:183`, `salon/SalonTeam.tsx:182`, `components-legacy/staff/StaffProfilePage.tsx:247,424`. `StaffPicker.tsx` and `StaffListSheet.tsx` (2 of the 5 flagged files) no longer exist — removed.
- `avatarColor` outside `Avatar.tsx`: only `salon/_shared.ts:304`, which is a pure re-export (`export { avatarColor } from "../primitives/Avatar"` — a documented back-compat shim, not a duplicate definition) and `primitives/index.ts` (barrel re-export).
- `homepage/SalonCard.tsx:40-52` has its own hardcoded category-tile color map (`cardCategoryColors`) that is *conceptually* similar (B&W ink-on-stone) but is a fixed per-category constant, not a per-name hash like `avatarColor()` — different domain (salon-photo fallback vs. person-avatar), not a true duplicate.
- **Verdict: CONSOLIDATED.**

### PriceFrom — PARTIAL
- Exists: `primitives/PriceFrom.tsx`. Confirmed 3 real call-sites (§4 above), matching its originally-flagged scope (`SalonResultCard.tsx`, `SalonServices.tsx`).
- **2 confirmed leftover "ab CHF" duplicates NOT using PriceFrom:**
  - `components-legacy/discovery/DetailPage.tsx:409` — `<span className="font-heading text-[14.5px] font-bold ...">ab CHF {s.priceFrom}</span>`, fully hand-rolled.
  - `search/CategoryHeroCarousel.tsx:150-159` — hand-builds `` `${pick(FROM, locale)} ${price} CHF` `` in a plain `<div>`; the surrounding comment even says "per the PriceFrom primitive (CONTRADICTIONS.md §4)" while not actually importing or using it.
- `homepage/SalonCard.tsx:599` renders `CHF {priceFromCHF}` (no "ab" prefix, different variant/pattern) — a third spelling, lower-confidence match since it lacks the "ab" label PriceFrom renders.
- **Verdict: PARTIAL** — original 2 flagged files done; 2 newer leftovers exist elsewhere, one of which explicitly name-checks PriceFrom in a comment without using it.

### BackButton — PARTIAL (see §4 detail above)
- Exists: `primitives/BackButton.tsx`. 1 of 4 flagged sites migrated (`SalonHero.tsx`), 1 site's back button removed entirely (`Breadcrumb.tsx`, V3-D461), 2 sites remain hand-rolled: `salon/SalonStickyTabNav.tsx:185` (raw `<ArrowLeft>`), `components-legacy/booking/BookingWizard.tsx:186,201` (2 raw `<ArrowLeft>` instances).
- **Verdict: PARTIAL.**

### "Two Skeletons" — CONSOLIDATED (functionally), legacy file orphaned not deleted
- `components-legacy/ui/Skeleton.tsx` still physically exists on disk.
- Checked all real importers: zero. `primitives/SkeletonCard.tsx:3` imports `Skeleton` from `./Skeleton` (i.e. the canonical `primitives/Skeleton.tsx`, same directory) — the only match on "components-legacy/ui/Skeleton" text was a comment (line 11) referencing history, not a live import.
- **Verdict: CONSOLIDATED in behavior**, but the dead legacy file itself was never deleted — a small cleanup item (`components-legacy/ui/Skeleton.tsx` can be removed).

### "Two Toasts" — CONSOLIDATED, legacy file already deleted
- `components-legacy/ui/Toast.tsx` **does not exist** — confirmed removed.
- `app/[locale]/layout.tsx:11` imports `Toaster` from `./_components/primitives/Toast` (canonical); a comment at line 6-9 explicitly states "the legacy ToastProvider (components-legacy/ui/Toast) has been retired."
- **Verdict: CONSOLIDATED**, fully clean (best-executed of the six §4 items).

---

## Registry fix list

**Phantom path fix (Finding 1):**
- `COMPONENT_REGISTRY.md:52` — change File column from `salon/StatusPill.tsx` → `salon/StatusInline.tsx`. Status text also needs updating; the component's shape changed materially (dot+pill → inline split-color text), not just a rename.
- `_design-system/components/StatusPill.md` — retitle/rewrite as `StatusInline.md` (or add a redirect note) pointing at `app/[locale]/_components/salon/StatusInline.tsx`. Current doc's visual-signature section (dot + pill chrome) no longer matches the shipped component (inline text, no chrome) — this needs a real rewrite, not just a path swap.
- `_design-system/components/SuccessMark.md:13` — replace "use `StatusPill`" with "use `StatusInline`" (or `DashStatusPill` depending on intended context).
- `_design-system/components/CardText.md:39` — replace "use `StatusPill`" with "use `StatusInline`".

**Doc-vs-LOCKFILE literal fixes (Finding 2):**
- `_design-system/components/Toast.md` — full rewrite of the "Visual signature" (§103-134) and "Position" sections to match the shipped V3-D462 Chime recipe: white pill (`bg-white border border-s-border`), circle tint-badge icon (not a plain dot), bottom-docked position, `rounded-[16px]`. Old text: "Background: `bg-s-ink` (#0A0A0A)... top-of-viewport." New text should describe: white pill + circle badge + bottom-docked, per `Toast.tsx:190-213`.
- `_design-system/components/FilterSheet.md:25-27` — old text: "Active chips use the ink fill (`bg-s-ink text-white`)". New text: "Active chips use the calm gray fill (`bg-s-bg-sunken text-s-ink font-semibold`), inactive use white + `s-border` hairline (owner 2026-07-02, approved mockup `/dev/filter-refine`)." Match `FilterSheet.tsx:374-379`.
- `COMPONENT_REGISTRY.md:42` + `_design-system/components/BackButton.md:13` — either (a) bump `BackButton.tsx` from `h-10 w-10` (40px) to `h-11 w-11` (44px) to satisfy the locked icon-button/touch-target floor, or (b) if the owner explicitly wants a 40px exception here, add that exception to the LOCKFILE icon-button row the same way `SelectedCheckBadge` and the `HeartButton` `SaveHeart` 32px variant are already documented as named exceptions. Currently it's an undocumented, silent violation — needs one or the other, not silence.
- `app/[locale]/_components/homepage/SectionHeader.tsx:66` — code fix (not doc): change `text-[13px]` to `text-[11px] md:text-[12px]` to match both the doc (`SectionTitle.md:50`) and `LOCKFILE.md:229,251`.
- `COMPONENT_REGISTRY.md:103` (SearchOverlay row) — remove the false claim "Zeit drill-in via `DateTimePicker`"; either rewrite `SearchOverlay.tsx`'s date/period step to actually use the shared `DateTimePicker` primitive (closing the live V3-D445 violation), or if there's a deliberate reason SearchOverlay needs its own calendar, document that exception explicitly in both the registry row and `SearchOverlay.md`.

**Missing docs to add (Finding 3) — component name, path, real import count:**
- `Modal` — `app/[locale]/_components/primitives/Modal.tsx` — 8 real call-sites + 2 internal
- `Sheet` — `app/[locale]/_components/primitives/Sheet.tsx` — 3 real call-sites
- `Switch` — `app/[locale]/_components/primitives/Switch.tsx` — 5 real call-sites
- `FieldLabel` — `app/[locale]/_components/primitives/FieldLabel.tsx` — 2 real + 4 internal
- `CookieConsent` (`CookieConsentProvider`) — `app/[locale]/_components/primitives/CookieConsent.tsx` — 1 root-mount (register alongside OfflineBanner/Toaster's "mounted once in layout.tsx" pattern)
- `WelcomeToast` — `app/[locale]/_components/primitives/WelcomeToast.tsx` — 1 root-mount
- `Logo` — `app/[locale]/_components/primitives/Logo.tsx` — 1 call-site (Header)
- `SalonBundles` — `app/[locale]/_components/salon/SalonBundles.tsx` — 3 real call-sites
- `TextInput`, `PillToggle`, `Checkbox`, `Radio`, `Select`, `Textarea`, `FieldHelper`, `SkipLink` — all in `primitives/`, lower import counts (0-1 real external each), still qualify for a doc under the registry's own "every `.tsx` in `{primitives,salon,homepage,layout}/*.tsx` needs an entry" drift-checker rule (`COMPONENT_REGISTRY.md:173-175`)
- `StatusInline` — `app/[locale]/_components/salon/StatusInline.tsx` — 2 real call-sites (this is also the Finding-1 fix, listed again here since it needs a *new* doc, not just a path correction, given the visual recipe changed)

**Registry row to ADD (currently has a doc but no row):**
- `DateTimePicker` — `app/[locale]/_components/primitives/DateTimePicker.tsx` — doc exists (`components/DateTimePicker.md`), 1 confirmed real call-site (`homepage/SearchBar.tsx`); should be a Primitives-table row given its LOCKED status per the design contract ("ONE `DateTimePicker` primitive").

**Status text to correct (Finding 4):**
- `COMPONENT_REGISTRY.md:40` (Avatar) — "not yet migrated into call-sites" → "locked" (5 real call-sites)
- `COMPONENT_REGISTRY.md:41` (PriceFrom) — "not yet migrated into call-sites" → "locked" (3 real call-sites at its originally-scoped sites; note the 2 outstanding leftovers elsewhere as a separate cleanup item, not as blocking the status change)

**Leftover hand-rolled duplicates to sweep (Finding 5, not previously tracked):**
- `components-legacy/discovery/CardSignals.tsx:36` — hand-rolled star, should use `RatingStars`
- `components-legacy/discovery/DetailPage.tsx:409` — hand-rolled "ab CHF" price, should use `PriceFrom`
- `search/CategoryHeroCarousel.tsx:150-159` — hand-rolled "ab CHF" price (comment already references PriceFrom), should use `PriceFrom`
- `salon/SalonStickyTabNav.tsx:185` — hand-rolled back button, should use `BackButton variant="flat"`
- `components-legacy/booking/BookingWizard.tsx:186,201` — 2 hand-rolled back buttons, should use `BackButton`
- `components-legacy/ui/Skeleton.tsx` — dead file, zero real importers, safe to delete (Toast's legacy twin was already deleted; Skeleton's wasn't)
