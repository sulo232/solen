<!-- exists-check: net-new reference-capture doc. Closest existing = components/discovery/PriceRangeBadge.tsx (a price-badge UI component, NOT a map-marker reference) and _rules/SOLEN_PATTERNS.md (general patterns). No existing map-marker reference doc; this is a reference-lock capture spec for the Nearby map. -->
# Reference , Nearby map + venue markers (captured 2026-07-14)

Owner asked "get references" for the homepage `In der Nähe` map (Nearby.tsx). Captured REAL map screens from Mobbin (not memory), focused on marketplace / venue-discovery apps closest to Solen.

## Captured screens (Mobbin, iOS)
| App | Marker pattern | Tile style | Link |
|---|---|---|---|
| Airbnb | WHITE price pills ("$226", selected = black) + clustering | light Google, muted green/blue | [stays map](https://mobbin.com/screens/689a6ffa-5897-40eb-ac71-1a276d290c36) · [NYC](https://mobbin.com/screens/24072f6f-71d3-47f1-92e3-3b63bf4b1b43) |
| Tock | blue circle + fork-knife ICON (selected = purple pin) | Apple, colored | [restaurants map](https://mobbin.com/screens/a1e7bbac-0f07-4110-bf67-9fafa1d80a02) |
| Hypelist | circular PHOTO thumbnails + count badges (2/3/21) | Apple, colored | [places map](https://mobbin.com/screens/92b7402e-b3ba-44b9-a1da-de1d8b0fc598) |
| Zomato | green RATING badges (star + 4.1) + heatmap glow | DARK map | [dining map](https://mobbin.com/screens/ea36db62-ef78-443f-8767-a31e3d9c73b9) |
| Bolt | scooter icon + count clusters (7/18/5) | light Google | [scooters map](https://mobbin.com/screens/ae1b2d62-e867-451c-897d-4f0cfbfca291) |
| Zocdoc | numbered count badges | Apple | [doctors map](https://mobbin.com/screens/0470a0c1-653f-48ff-a159-b71acac4b35b) |
| Uber | car icons + blue user-dot | light Google | [ride map](https://mobbin.com/screens/f5b88c6a-a0c9-4c0f-9947-37342acf8dbb) |
| Lime | green circle + scooter icon | light OR dark | [light](https://mobbin.com/screens/44b4774d-4d45-4685-af79-3f692876fdcc) · [dark](https://mobbin.com/screens/6764fadc-959a-49ef-ab26-6cc0424f9a9e) |

## Philosophy (max 6 lines)
1. The TILES are near-universal: light native base (Google/Apple), muted green parks, blue water, thin gray roads. Our custom minimal style already matches this , tiles are solved.
2. The MARKER is the brand/decision moment, not the tiles. Each app puts its key decision fact IN the marker: Airbnb = price, Zomato = rating, Tock/Bolt/Lime/Uber = category icon, Hypelist = photo.
3. Marketplace apps (Airbnb) use PRICE PILLS , the number that drives the tap. Solen is a booking marketplace with real prices (ab X CHF), so price pills are the natural fit.
4. Dense areas ALWAYS cluster into a count badge (Airbnb/Bolt/Zocdoc). We already cluster.
5. Selected marker = inverted/emphasised (Airbnb black, Tock purple pin).
6. Plain dots (what Solen has now) are the weakest option , no app uses bare dots; they all carry info.

## Marker options for Solen (tiles stay as-is)
- A. PRICE PILLS ("ab 35 CHF") white pill + clustering , Airbnb marketplace fit, uses real price data. RECOMMENDED.
- B. Category-icon circle (scissors / nail / spa in a circle) , Tock/Lime look.
- C. Rating badge (gold star + 4.9) , Zomato look, uses real ratings.
- D. Circular photo thumbnail , Hypelist premium look.
Clustering (count badge) stays under all four for density.

## Status
Captured only. NOT applied to the mockup , awaiting owner pick (A/B/C/D). Env note: git commit + tunnel sandbox-revoked this session; this file is on disk, commit owed.
