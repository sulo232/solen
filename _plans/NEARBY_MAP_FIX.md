# NEARBY MAP FIX (owner iteration 2026-07-14)

The homepage "In der Nähe" teaser is a FAKE map (CSS grid + 3 hardcoded pins + hardcoded "14"). Owner wants it real + modern + minimalist. Layout A (map between two card rows) approved earlier; iterating on the MAP look + pin now.

## Owner asks (2026-07-14, dictation round 4)
- [ ] N1. Still not modern -> make the map more modern.
- [ ] N2. Pin = INK DOT (owner "prrly ink dot"). Drop the teardrop.
- [ ] N3. "blur" , AMBIGUOUS. Interpreting as: keep the frosted-glass (blur) count chip. FLAG for confirm if they meant blur on the map/dots.
- [ ] N4. REMOVE the "Karte öffnen" CTA from the map teaser.
- [ ] N5. Modern = MINIMALISTIC.
- [ ] N6. Tiles = normal/COLORED, NOT white/beige (reject the light/beige base).
- [ ] N7. KEEP the green (parks) + the river (Rhine blue).
- [ ] N8. REMOVE the highways / road clutter ("remove the highway n sh").

## Net of N5-N8 = a CUSTOM minimal Mapbox style
Colored land + water (blue) + parks (green), NO roads/highways/labels. Not a Mapbox default. Two build paths:
- (a) Mapbox Styles API: create a minimal style server-side -> static image (fits the existing SalonLocation static pattern). Needs styles:write scope (pk. public token probably CANNOT).
- (b) mapbox-gl (already a dep) client-side with an inline minimal style JSON + custom dot markers. Works with the pk read token. This is also the real production path.

## Rejected already (do not re-show)
- light/grey monochrome; streets full-colour (too loud); outdoors; navigation (traffic colours); default Mapbox teardrop pin; blue pins; the "Karte öffnen" button.

## CORRECTION (2026-07-14, owner "i told you i want roads and nrml tiles white thn ths")
I MISREAD round 4 and built an abstract no-road blob. The correct read:
- KEEP roads (remove ONLY the loud highway/motorway emphasis, not all streets).
- Normal WHITE/light tiles (light-v11 base), NOT the custom colour-block land.
- KEEP green parks + blue river.
Fix built: base = light-v11 (white tiles + roads + labels), recolour water->blue + parks->green on load, dim motorway, ink dots, no Karte öffnen. light-v11 alone = "monochrome" (grey river, invisible parks); the recolour is what makes it white-with-roads AND green+river.
Repeating pattern: misreading a multi-constraint taste dictation and building before confirming. Not cleanly gate-able (judgment); mitigation = when a dictation contradicts an earlier one, show the LITERAL normal-case first, not an invented interpretation.

## Status
- Real data: 20 active Basel salons with lat/lng (Supabase). Real count = 20 (the "14" was fabricated).
- Approved: layout A (map between Top-auf-Solen and nearby cards). Pin leaning ink dot.
- OPEN: the minimal custom map style (this round).
