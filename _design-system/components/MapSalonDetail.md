<!-- exists-check: net-new component doc (per the new-component rule) , no existing components/*.md covers the map sheet's salon mode; reuses SalonResultCard variant="feed" for structure. -->

# MapSalonDetail

**Layer 2** (interaction , the map bottom sheet's SALON mode). File: `app/[locale]/_components/search/MapSalonDetail.tsx`.

The single-salon content the map bottom sheet morphs to when a pin (MapView `onSelect`) or a list card (`SalonResultCard variant="feed"` `onSelect`) is tapped in `SearchTemplate`'s `mobileView==="map"` overlay. Council-approved model (2026-07-02, `/dev/map-behavior`): ONE sheet, LIST to SALON, tap focuses (no double-tap), drag up = full, drag down / "Alle Salons" = back.

## API
`<MapSalonDetail salon locale onBack full isSaved? onToggleFavorite? />`
- `salon` , one entry of SearchTemplate's `salons` (name, slug, average_rating, cover_photo_url, gallery_urls, address, city, quartier, categories, services, avg_price, review_count, distance_meters).
- `full` , `false` = MEDIUM detent (top 3 services); `true` = FULL detent (all services).
- `onBack` , clears the selection (back to the LIST).

## Grounding / rules
- REUSES the `feed`-card visual language (aspect-[3/2] photo, CardName, star, "distance, address", "category, N reviews", `rounded-xl bg-s-bg-sunken` service rows, blue "View store"). Does NOT hand-author a divergent card (owner-rejected; see DRIFT_LEDGER + no-invented-ui-gate).
- REAL fields only , NO opening hours / amenity chips / review snippet (those were illustrative in the mockup; the data does not exist). Parked with a TODO until a data source lands.
- "View store" + every service row to `/{locale}/salon/{slug}` (the one navigation off-ramp). Selected/active = gray, no focus rings, no em-dash, min 12px, Lucide icons.

## Use for / Don't reuse for
- **Use:** the map sheet's focused-salon state only.
- **Don't:** the results list (use `SalonResultCard variant="feed"`); the full PDP (use `SalonDetailV3`).
