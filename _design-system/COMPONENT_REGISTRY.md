# Solen Component Registry

**Purpose.** Single source of truth for every shared component in Solen. **Every agent reads this BEFORE building anything.** If a component you need is here, use it. Don't recreate.

**How to add.** When you build a new shared component, append to the relevant section. Include: name, file path, Layer, public API summary, "use for / don't reuse for" line, status. Same turn as the .tsx + .md files (CLAUDE.md rule).

**Three component classes:**
- **Primitives** (`app/[locale]/_components/primitives/*`) — generic, used across the entire app
- **Salon** (`app/[locale]/_components/salon/*`) — colocated to salon-detail surfaces
- **Homepage** (`app/[locale]/_components/homepage/*`) — homepage-specific
- **Layout** (`app/[locale]/_components/layout/*`) — Header, Footer, MobileMenu, CityTopBar

**Status:**
- `locked` — built + reviewed + in production use
- `wip` — built but visual not yet verified
- `proposed` — claimed by an agent, not yet built (so other agents don't duplicate)

**Universal-components rule (V3-D205).** Every component must render correctly for any salon category (Coiffeur / Barber / Nails / Spa / Massage) without `if category === 'X'` branches. Drift-checker rule B5 flags violations. Parameterize via data, not switches.

---

## Primitives (cross-route)

| Component | File | Layer | API | Use for / Don't reuse for | Status |
|---|---|---|---|---|---|
| **Toast** | `primitives/Toast.tsx` | 3 (semantic UI) | `toast.success(msg)` / `.error(opts)` / `.warning()` / `.info()`. Pastel bg + ink text + saturated lucide icon. Auto-dismiss 4s. Max 3 visible. | **Use:** confirmation, error, info, warning notifications. **Don't:** loading spinners (use Skeleton) or modal dialogs (use Modal). | locked |
| **Toaster** | `primitives/Toast.tsx` (named export) | 3 | Portal mounted in `layout.tsx`. Renders the toast stack. | **Use:** mounted once at root. **Don't:** mount multiple. | locked |
| **Skeleton** | `primitives/Skeleton.tsx` | 1 (chrome) | `<Skeleton width? height? rounded? aspect? />`. Shimmer gradient via `animate-shimmer` keyframe. Respects `prefers-reduced-motion`. | **Use:** loading placeholders matching final layout. **Don't:** use as a permanent neutral surface — that's `bg-s-bg-sunken`. | locked |
| **ComingSoon** | `primitives/ComingSoon.tsx` | 1 (chrome wrapper) | `<ComingSoon label toastTitle? toastDescription?>{<button>}</ComingSoon>`. Wraps a child with opacity-50 + cursor-not-allowed + toast on click + aria-label suffix " — bald verfügbar". | **Use:** any clickable surface that's not yet wired. **Don't:** disabled states (those are `disabled` prop). | locked |
| **TabPill** | `primitives/TabPill.tsx` | 1 (chrome — navigation/filter affordance) | `<TabPill active onClick size? variant?>{children}</TabPill>`. `variant: outline \| ghost`. `size: sm (32px) \| md (40px)`. Active = ink-fill, inactive = white + hairline. | **Use:** filter chips, segment controls, category selectors. **Don't:** semantic state pills (use StatusPill) or top-nav tabs (use TopNavTab when built — different underline-active pattern). | locked |
| **CardName** | `primitives/CardText.tsx` | 1 (chrome — typography) | `<CardName as? className?>{name}</CardName>`. Bakes the single ink anchor recipe `text-s-ink font-medium` (500). `className` = LAYOUT only (size / truncate / leading) — never weight/color (cn is clsx, no merge). | **Use:** the ONE name/title per card or list-item (salon, stylist, service, review, package). **Don't:** section headings (h2 600) or CTAs. | locked |
| **CardMeta** | `primitives/CardText.tsx` | 1 (chrome — typography) | `<CardMeta as? className?>{meta}</CardMeta>`. Bakes recessive meta recipe `text-s-ink-2 font-normal` (400). `className` = LAYOUT only. | **Use:** all secondary card meta (rating, distance, time, price, duration, count, address). **Don't:** the name anchor (use CardName) or semantic status (use StatusPill). | locked |

---

## Salon (colocated to `/salon/[slug]`)

| Component | File | Layer | API | Use for / Don't reuse for | Status |
|---|---|---|---|---|---|
| **StatusPill** | `salon/StatusPill.tsx` | 3 (semantic UI) | `<StatusPill isOpen label size? showDot?>`. Open → `text-s-success` + green dot. Closed → `text-s-ink-2` + grey dot. Universal "open/closed" convention. | **Use:** any open/closed indicator (header, sidebar, hours table). **Don't:** other binary states like active/inactive — use TabPill. | locked |
| **MetaDot** | `salon/MetaDot.tsx` | 1 (chrome — typographic separator) | `<MetaDot />`. The `·` bullet between meta-row segments. Inline, `text-s-ink-3`, aria-hidden. | **Use:** any inline meta-row separator. **Don't:** as decorative ornament — it's a typographic separator only. | locked |
| **SalonCard** | `homepage/SalonCard.tsx` | 1 chrome + hosts Layer-3 children (HeartButton, star rating) | `<SalonCard slug name rating photoUrl? category? availability? curation? variant? />`. Photo + 3-row text below. Used across homepage feeds, /favoriten. | **Use:** homepage feeds + horizontal scrollers. **Don't:** salon-detail page; category/search results list (use SalonResultCard). | locked |
| **SalonResultCard** | `search/SalonResultCard.tsx` | 1 chrome + Layer-3 children (HeartButton, star) | `<SalonResultCard slug name locale rating? reviewCount? photoUrl? category? city? distanceMeters? priceFromCHF? featured? />`. V3-D350 clean Airbnb card for the 2-col grid: rounded ~1:1 photo (`rounded-card`, §11 exception) + Heart + optional "Beliebt" badge, then name + ★rating + grey meta line (`city · distance`; category dropped on category routes per V3-D370) + `ab X CHF` + a **next-available slot pill** (V3-D371 "booking-intent", Clock + ink, graceful-hides without data). NO inline service ROWS (full list stays on the PDP). Built on CardName/CardMeta (A13). 3 shapes, same family: `variant="card"` full-width 1-col landscape = **DEFAULT** (V3-D372, the results-page list); `variant="grid"` 2-col square via `?layout=grid`; `variant="list"` photo-left rows via `?layout=list` (map split). | **Use:** category/search results (SearchTemplate; default = 1-col card list). **Don't:** homepage feeds (use SalonCard) or the PDP. | wip |
| **HeartButton** | `homepage/HeartButton.tsx` | 3 (semantic UI — save signal) | `<HeartButton isSaved? salonName className? salonId? />`. Pink fill (`#FF3366`) saved, ink stroke unsaved. 44px hit area, 32px visible glass circle. | **Use:** any save-this-salon interaction. **Don't:** other toggle states — heart is specifically for "saved/favorited". | locked |
| **SalonDetailV3** | `salon/SalonDetailV3.tsx` | 1 (orchestrator) | Self-contained. Fetches `/api/salons/[slug]`, manages Lightbox state, composes the page. Mounted via `?v3=1` query gate on `app/[locale]/salon/[slug]/page.tsx`. | **Use:** salon-detail route only (mounted by route wrapper). **Don't:** elsewhere — it's a page orchestrator, not a reusable section. | locked |
| **SalonBreadcrumb** | `salon/SalonBreadcrumb.tsx` | 1 (chrome) | `<SalonBreadcrumb salon locale>`. Desktop-only nav crumbs (Home › Category › City › Name). | **Use:** salon-detail desktop header strip. **Don't:** mobile — hidden by `md:block`. | locked |
| **SalonHero** | `salon/SalonHero.tsx` | 1 chrome + hosts Layer-3 HeartButton | `<SalonHero salon onOpenLightbox>`. Mobile: full-bleed `aspect-[4/3]` cover w overlay icons (ArrowLeft / Share / HeartButton). Desktop: 1/2/3-photo Fresha-style gallery (`aspect-[16/7] rounded-3xl`). | **Use:** salon-detail hero only. **Don't:** other photo galleries — patterns differ (no aspect, no overlay icons). | locked |
| **SalonHeader** | `salon/SalonHeader.tsx` | 1 chrome + Layer 2 category eyebrow + Layer 3 StatusPill | `<SalonHeader salon>`. H1 (Inter Tight 800 clamp 28-44px) + category eyebrow (V3-D206 royal-blue uppercase) + meta row (star/rating/StatusPill/address) + Featured + Last-Minute pills + desktop Share/Heart cluster. | **Use:** salon-detail title block. **Don't:** elsewhere — owns the page H1. | locked |
| **SalonStickyTabNav** | `salon/SalonStickyTabNav.tsx` | 1 (chrome — navigation) | `<SalonStickyTabNav availableSections scrollAnchorRef>`. Fixed-top `z-[60]` (V3-D206 — above site header). Fades in past 200px scroll. IntersectionObserver scroll-spy. Underline-active tab pattern. German labels via `TAB_SECTIONS`. | **Use:** salon-detail only. **Don't:** as a generic tab primitive (use TabPill). | locked |
| **SalonServices** | `salon/SalonServices.tsx` | 1 chrome + Layer 2 category chips (via TabPill) | `<SalonServices services locale slug salon>`. Filter chips (TabPill) + first 5 services as divider rows (mobile) or bordered cards (desktop). "Alle ansehen" opens SalonServicesSheet. | **Use:** salon-detail Services section. **Don't:** standalone service lists — needs the sheet context. | locked |
| **SalonServicesSheet** | `salon/SalonServicesSheet.tsx` | 1 chrome (full-screen overlay) | `<SalonServicesSheet salon locale open onClose>`. Full-screen booking-step-1 sheet w sticky chip bar + service rows + cart sidebar (desktop) + continue CTA. | **Use:** SalonServices "Alle ansehen" trigger. **Don't:** other sheet patterns — this one is booking-flow-shaped. | locked |
| **SalonTeam** | `salon/SalonTeam.tsx` | 1 chrome + Layer 3 rating badge | `<SalonTeam staff salonAverageRating>`. Horizontal carousel of staff avatars (88px mobile / 112px desktop) w floating yellow star+rating badge bottom-left of each. | **Use:** salon-detail Team section. **Don't:** elsewhere — vertical card grids use different staff component. | locked |
| **SalonReviews** | `salon/SalonReviews.tsx` | 1 chrome + Layer 3 star ratings + Layer 3 avatar tones | `<SalonReviews average count reviews>`. Summary stars (yellow filled / grey empty) + 2-col grid of cards w initial avatars (B&W palette) + "Alle ansehen" expander. | **Use:** salon-detail Reviews section. **Don't:** review pages that need pagination — this is in-place expand. | locked |
| **SalonPortfolio** | `salon/SalonPortfolio.tsx` | 1 (chrome — image grid) | `<SalonPortfolio urls onOpen>`. Uniform 3-col square grid, 9 visible max, "+N" overlay on last tile when there are more photos. Click → lightbox. | **Use:** salon-detail portfolio. **Don't:** non-square photo galleries. | locked |
| **SalonBuy** | `salon/SalonBuy.tsx` | 1 (chrome) | `<SalonBuy locale slug salonName variant?>`. `variant=standalone` (full card) or `variant=sidebar` (compact row). Both link to `/{locale}/salon/{slug}/gift-card`. | **Use:** salon-detail gift-card promo. **Don't:** other commerce CTAs — single-purpose. | locked |
| **SalonAbout** | `salon/SalonAbout.tsx` | 1 (chrome) | `<SalonAbout salon>`. About paragraph(s) + Map placeholder w rating chip + address row + Wegbeschreibung link. Map activates when `NEXT_PUBLIC_MAPBOX_TOKEN` lands (deferred). | **Use:** salon-detail About section. **Don't:** standalone map — placeholder is wired to a specific spec. | locked |
| **SalonOpeningTimes** | `salon/SalonOpeningTimes.tsx` | 1 chrome + Layer 3 open/closed dot (V3-D197 semantic) | `<SalonOpeningTimes hours>`. 7-day list w green `s-success` dot for open / grey `s-ink-3/40` dot for closed. Today's row bold. | **Use:** salon-detail hours section. **Don't:** compact inline "open now" status (use StatusPill). | locked |
| **SalonAdditionalInfo** | `salon/SalonAdditionalInfo.tsx` | 1 (chrome) | `<SalonAdditionalInfo salon>`. Vertical checklist of 12 amenity flags w lucide icons + labels. Hides when no flags true. | **Use:** salon-detail amenities. **Don't:** filter UIs — this is a display-only list. | locked |
| **SalonContact** | `salon/SalonContact.tsx` | 1 (chrome) | `<SalonContact salon>`. Mobile-only (`lg:hidden`) phone / website / Instagram rows. Desktop has these in SalonSidebar. Returns null when no contact present. | **Use:** salon-detail mobile contact rows. **Don't:** desktop sidebar — duplicate render. | locked |
| **SalonLoyalty** | `salon/SalonLoyalty.tsx` | 1 (chrome) | `<SalonLoyalty />`. 4 Treueprogramm pillar cards (Punkte / Belohnungen / Stufen / Freund:in einladen). Click → expand inline description. | **Use:** salon-detail loyalty section. **Don't:** elsewhere — Solen-specific loyalty content. | locked |
| **SalonOtherLocations** | `salon/SalonOtherLocations.tsx` | 1 (chrome) | `<SalonOtherLocations siblings locale>`. 1 sibling → full-width card; 2+ → horizontal carousel. Each: photo + name + star rating + address + category eyebrow. | **Use:** chain-salon "Andere Standorte". **Don't:** other carousels — has specific Fresha-style content. | locked |
| **SalonVenuesNearby** | `salon/SalonVenuesNearby.tsx` | 1 (chrome) | `<SalonVenuesNearby cat excludeId locale>`. Horizontal carousel of same-category salons. Fetches `/api/salons/by-category`. Desktop arrow buttons. | **Use:** salon-detail "In der Nähe". **Don't:** city-page nearby lists — different scope. | locked |
| **SalonSidebar** | `salon/SalonSidebar.tsx` | 1 chrome + Layer 2 Featured pill + Layer 3 StatusPill | `<SalonSidebar salon locale>`. Desktop-only sticky right rail. Collapsed (just Book CTA) → expanded (name+rating+Featured+status+hours+address+contact+Buy) on scroll. | **Use:** salon-detail desktop right rail. **Don't:** mobile (uses SalonMobileBookBar). | locked |
| **SalonMobileBookBar** | `salon/SalonMobileBookBar.tsx` | 1 (chrome) | `<SalonMobileBookBar locale slug>`. Fixed-bottom mobile (`lg:hidden`) "Termin buchen" pill. Solid white bg + ink CTA. | **Use:** salon-detail mobile sticky CTA. **Don't:** other pages — copy is salon-specific. | locked |
| **SalonAppCta** | `salon/SalonAppCta.tsx` | 1 (chrome) | `<SalonAppCta locale slug city quartier>`. Bottom-of-page "Verwöhne dich" h2 + chip-link row (city / quartier / category links) + repeated Book CTA. | **Use:** salon-detail bottom marketing block. **Don't:** other bottom CTAs — has specific Fresha-style chip+CTA layout. | locked |
| **SalonLightbox** | `salon/SalonLightbox.tsx` | 1 (chrome — full-screen modal) | `<SalonLightbox photos open startIndex onClose>`. Full-screen photo carousel modal w prev/next + counter + close button. ESC closes. | **Use:** SalonHero + SalonPortfolio onOpen. **Don't:** other lightboxes — specific to salon photos. | locked |

---

## Layout / Section composition

| Component | File | Layer | API | Use for / Don't reuse for | Status |
|---|---|---|---|---|---|
| **Section** | `homepage/SectionHeader.tsx` (named) | 1 (chrome) | `<Section className?>{children}</Section>`. Outer wrapper, mb-2 md:mb-4. Used for homepage feed rows. | **Use:** homepage section-row composition. **Don't:** salon-detail sections (they're managed by SalonDetailV3 orchestrator). | locked |
| **SectionFrame** | `homepage/SectionHeader.tsx` (named) | 1 (chrome) | `<SectionFrame>{children}</SectionFrame>`. Padding + overflow-clip for ScrollRow bleed. | **Use:** wrap a SectionTitle + ScrollRow. **Don't:** standalone frame for arbitrary content. | locked |
| **SectionTitle** | `homepage/SectionHeader.tsx` (named) | 1 chrome + Layer 2 brand accent on chevron→arrow link | `<SectionTitle title link? scrollRef? />`. H2 + optional link + desktop scroll arrows. | **Use:** any section heading on homepage. **Don't:** salon-detail page sections (different h2 pattern). | locked |
| **SectionMeta** | `homepage/SectionHeader.tsx` (named) | 2 (brand accent — eyebrow + bullet) | `<SectionMeta eyebrow />`. Renders the small uppercase blue-accent eyebrow above section title. | **Use:** homepage section eyebrows. **Don't:** elsewhere (single role). | locked |
| **ScrollRow** | `homepage/SectionHeader.tsx` (named, forwardRef) | 1 (chrome) | `<ScrollRow ref?>{children}</ScrollRow>`. Horizontal scroll-snap row. | **Use:** horizontal card feeds. **Don't:** vertical lists. | locked |
| **FeedZone** | `homepage/SectionHeader.tsx` (named) | 1 (chrome) | `<FeedZone>{children}</FeedZone>`. Rising-panel container with rounded-top + upward shadow. | **Use:** the homepage's content area below the hero. **Don't:** nested or per-section. | locked |
| **SearchBar** | `homepage/SearchBar.tsx` | 1 (chrome) | Self-contained — no public props. Dynamic-Island morph search with Service / Stadt / Zeit segments. | **Use:** the hero search. **Don't:** secondary search surfaces — use a different input pattern. | locked |
| **LoadingStates** | `_design-system/components/LoadingStates.md` (doc only — not a component) | Grammar doc | N/A — describes patterns. Skeleton (loading), empty state, error state, optimistic UI rules. | **Use:** reference when building async surfaces. **Don't:** import — it's documentation. | locked |

---

## Search / category routes (colocated to `_components/search/`)

| Component | File | Layer | API | Use for / Don't reuse for | Status |
|---|---|---|---|---|---|
| **SearchTemplate** | `_components/search/SearchTemplate.tsx` | 1 (chrome) | `<SearchTemplate locale serviceFilter? cityFilter? breadcrumb? hero? aboveSlot? belowSlot? />`. Unified Fresha-clone result list. V3-D351 chrome = category-pill row + search bar (map icon inside) + filter-chip row (selected sort left, ink fill) + round `SlidersHorizontal` button → FilterSheet + "Fuer dich" round-icon row. Used by `/search`, `/coiffeur`, `/barbershop`, `/nails`, `/spa`, etc. Universal-components rule (V3-D205) — no category branches; pills + Fuer-dich driven by config maps. | **Use:** any filterable salon-result list route. **Don't:** salon-detail PDP (use `SalonDetailV3`), discovery feeds (use Entdecken pattern). | locked V3-D230 |
| **FilterSheet** | `_components/search/FilterSheet.tsx` | 1 (chrome) | `<FilterSheet isOpen onClose resultCount labels sortOptions sort onSortChange openNow instantBookable walkIn deals onToggleBoolean minRating onMinRatingChange onReset />`. Controlled, STATELESS filter sheet behind SearchTemplate's round filter button. Groups: Sortieren (segmented) / Verfuegbarkeit (chips) / Bewertung (chips). Every control writes the SAME URL params as SearchTemplate's chip row (single source of truth). Reuses the `Sheet` primitive (mobile) + `Modal` (desktop) via `useResponsiveOverlay`. Only API-supported params wired (Preis + distance omitted). | **Use:** SearchTemplate filter button only. **Don't:** other sheets (use `Sheet` directly); don't give it local filter state (URL params are the source of truth). | wip V3-D351 |
| **CategoryBrowseRails** | `_components/search/CategoryBrowseRails.tsx` | 1 (chrome — composes locked homepage rail primitives, no new tokens) | `<CategoryBrowseRails salons locale category />`. SIX horizontal rails (Top auf Solen · Angebote · In der Nähe · Bald frei · Für Männer · Coloration) shown ABOVE the results grid in browse mode only. Each rail = filtered/sorted view of the same `salons` array; a `<Rail>` sub-component self-hides any slice with < 2 salons. Reuses homepage `Section`/`ScrollRow`/`SalonCard` (identical cards). Gated by `BROWSE_RAILS && activeCategory && activeFilterCount === 0 && q.length === 0`. Founder's Airbnb rails idea (V3-D366 → trimmed to 1 V3-D367 → re-expanded to 6 V3-D368). Data-dependent: rails need discounts/slots(with service_id)/men+color services to populate (see `scripts/seed-coiffeur-rails.ts`). STRUCTURE = Solen precedent (Fresha has no rails-on-category); AESTHETIC inherited. Universal (V3-D205). | **Use:** browse-mode rail block on category routes (via `BROWSE_RAILS` gate). **Don't:** homepage feeds (use `SalonCard` directly), `/search` Alle, filtered/searched states (grid owns those), PDP. | locked V3-D368 |

---

## Landings (colocated to `_components/landings/`)

| Component | File | Layer | API | Use for / Don't reuse for | Status |
|---|---|---|---|---|---|
| **CategoryHero** | `_components/landings/CategoryHero.tsx` | 1 (chrome — split-hero composition) | `<CategoryHero category />` where `category: "coiffeur" \| "barbershop" \| "nails" \| "spa" \| "makeup" \| "waxing"`. Server component. LOCKFILE §11 Pattern 1 (split-hero: text LEFT, photo RIGHT, `aspect-[3/2]`, `rounded-none`, no overlay). Universal-components rule (V3-D205) — props-driven, no per-category branches. Reads i18n from `categoryHero.<category>.{title,subtitle}` in messages/{de,en,fr,it}.json. Photos from `lib/category-photos.ts` (Unsplash placeholders — T6 photo strategy deferred). | **Use:** the 6 category landing routes (`/coiffeur`, `/barbershop`, `/nails`, `/spa`, `/makeup`, `/waxing`). **Don't:** `/search` results, salon PDPs (use `SalonHero`), Solen-originals, B2B pages. | locked V3-D340 |

---

## Business (colocated to `/business`)

| Component | File | Layer | API | Use for / Don't reuse for | Status |
|---|---|---|---|---|---|
| **BentoCard** | `_components/business/BentoCard.tsx` | 1 (chrome) | `<BentoCard title description visual className?>`. Generic 1-of-4 feature tile in a bento grid. Title + body copy + custom visual slot. 3D-tilt hover comes from caller. | **Use:** feature-x4 grids on B2B / marketing landings. **Don't:** salon listings (use SalonCard), reviews, dashboard widgets. | locked V3-D220 |
| **Step** | `_components/business/Step.tsx` | 2 (brand accent — `s-accent/30` numeral is THE blue moment on /business) | `<Step n title copy>`. Numbered card for "how it works" / process callouts. Bg `s-bg-sunken`, royal-blue 30% numeral, ink h3, body. | **Use:** 3-step process / explanation. **Don't:** feature grids (use BentoCard), long numbered lists. | locked V3-D220 |
| **FAQItem** | `_components/business/FAQItem.tsx` | 1 (chrome — neutral surface) | `<FAQItem q a defaultOpen?>`. Native `<details><summary>` accordion. Free a11y (keyboard + ARIA). Chevron rotates 180° on open. | **Use:** FAQ lists (5-20 items). **Don't:** tooltips, modal disclosures, long-form prose. | locked V3-D220 |
| **MarketplaceVisual** | `_components/business/MarketplaceVisual.tsx` | 1 (chrome — pure decorative) | No props — parameterless. Hardcoded 3 faux salon cards stacked for "we're a marketplace" hero block. | **Use:** "marketplace pitch" / "listing preview" sections only. **Don't:** real salon listings (use SalonCard), interactive previews. | locked V3-D220 |

---

## Proposed (claimed but not yet built)

When you start building a NEW component, post here FIRST so parallel agents don't duplicate. Move to the appropriate section above when locked.

_(none currently — registry just initialized 2026-05-26)_

---

## How agents use this

1. **Step 1 of every agent brief is to print this file's contents.** If you can't recite the existing components, you're about to recreate something.
2. **Before creating a NEW component:** check above. Use existing if it fits. If close-but-not-quite, EXTEND the existing component (add a variant) instead of forking.
3. **If a genuine new component is needed:** add a row to "Proposed" first, then build, then move to the appropriate locked section. All in the same turn as writing the `.tsx` + `_design-system/components/<Name>.md`.
4. **The .md doc is mandatory** (per CLAUDE.md rule). Must include: Purpose, Layer (1/2/3 from §14.0 decision tree), Public API, Visual signature, Motion, Do/Don't, Edge cases, Provenance, Related.
5. **The `Reference:` line is mandatory** in section-level .md docs (e.g., `_design-system/sections/<route>/<section>.md`) — point at the Fresha screenshot you measured against.

---

## Locked decisions that affect registry

- **V3-D197** — three-layer color system (Chrome / Brand-Accent / Semantic-UI). Decision tree in §14.0 of SOURCE.md.
- **V3-D199** — saturation contract. Every color token defines `.DEFAULT` (L 36-60%, S 65-92%) + `.bg`/`.pale` (L 93-96%) together. V3-D204 widened upper L bound to 60% for modern brand blues.
- **V3-D203** — no emoji ever in code/files/UI. Lucide icons only.
- **V3-D204** — accent flipped to `#276EF1` (was `#1638C4`).
- **V3-D205** — universal-components rule. No category-specific branches.
- **V3-D206** — salon-detail audit: (a) SalonStickyTabNav bumped `z-30 → z-[60]` so it sits above the site header (which was eclipsing it); (b) SalonHeader gained a category eyebrow under the H1, Layer 2 brand-accent royal blue, matching Fresha's "Nägel" / "Coiffeur" label pattern.

---

## Drift-checker membership rule (V3-D205)

The drift-checker (`/solen-drift-check`) verifies that every `.tsx` file matching `app/[locale]/_components/{primitives,salon,homepage,layout}/*.tsx` has a corresponding entry in this registry. Missing entry → drift flag. Forces the registry to stay accurate.
