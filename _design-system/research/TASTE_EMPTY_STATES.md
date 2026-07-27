# TASTE_EMPTY_STATES , the reference-grounded empty-state law (2026-07-21)

<!-- exists-check: net-new vs TASTE_HIERARCHY/GROUPING/TYPOGRAPHY/DASHBOARDS/CHECKOUT because none of
those cover the empty-state SURFACE; UNFINISHED_AUDIT names the gap (states specced, populated/empty
QUALITY unspecced) and this file fills the empty-state half with fresh Mobbin references, same
per-surface pattern as TASTE_CHECKOUT/TASTE_DASHBOARDS. -->

Owner (verbatim): "the empty states thats what i mean w taste and design files not being good, get
references more." The old law said `empty = <EmptyState>` and the component was a grey Lucide disc +
status label + subline , the generic SaaS ritual. 12 real empty states from finished apps were
captured on Mobbin the same hour; the anatomy below is what they ALL share and ours lacked.

## The references (all viewable)

| app | headline | visual | CTA | link |
|---|---|---|---|---|
| Pinterest (the owner's ref brand) | "You haven't saved any Pins... yet" | doodle illustration | red pill "Explore Pins" | [screen](https://mobbin.com/screens/ff7cf79a-ce28-4dd9-bc19-d1278befad72) |
| Booking.com | "Save what you like for later" | playful hotel-card illustration | blue pill + text-link | [screen](https://mobbin.com/screens/b8d55456-eadf-4676-bf49-d499052aa115) |
| Skyscanner | "Anything you save will be stowed here" | illustrated disc | full-width pill "Start searching" | [screen](https://mobbin.com/screens/01d01a3b-bf60-48ae-b21d-0827e37eda6f) |
| OpenTable | "Nothing saved just yet" | brand-red illustration | red pill "Find a restaurant" | [screen](https://mobbin.com/screens/30875928-c58f-4a84-894c-17ec717f4587) |
| DoorDash | "You don't have any saved stores" | heart illustration + 2 benefit bullets | pill "Browse Stores" | [screen](https://mobbin.com/screens/09262761-f4b2-4a92-b8e0-7ad8e2a6352c) |
| Peerspace | "No boards yet" | GHOST-PREVIEW faded rows of future content | ink pill "Start exploring" | [screen](https://mobbin.com/screens/f1d85c53-e6d2-4fad-9791-a47827f076b2) |
| Rent the Runway | "Have to wear it?" | pure type, no illustration | black pill | [screen](https://mobbin.com/screens/0dbd81e5-a118-4ca9-b082-2dadde7070ef) |
| Careem | "Looks a little empty here" | character illustration | full-width pill | [screen](https://mobbin.com/screens/743f2d8c-04e1-43d7-ac7c-791c435f0f76) |
| Realtor.com | copy + big pill only | none | pill "Search homes" | [screen](https://mobbin.com/screens/d64557f5-7949-4f8d-9da4-b0c1b7d6b9f5) |
| Lex | "No saved posts" | mascot in a white card | green pill "Go to feed" | [screen](https://mobbin.com/screens/15181740-6713-4946-b348-777d27483d2f) |
| Hollister | "You have no saved styles." | outline heart | outlined pill | [screen](https://mobbin.com/screens/2753ec87-defe-4b17-bf92-c564e47fd76d) |
| Moda Operandi | "You have no favorites... yet!" | serif type-led | black pill "Sign in" | [screen](https://mobbin.com/screens/432ab7b7-40c9-4476-9ae0-655141362b2b) |

## The shared anatomy (what EVERY finished one has, and ours lacked)

1. **A PROMISE headline, not a status label** , bold, warm, benefit- or tease-phrased ("Anything you
   save will be stowed here", "Have to wear it?", "...yet"). Never a cold state report alone.
2. **A GESTURE subline** , teaches the exact action that fills the screen ("Tap the heart to...").
3. **A REAL primary CTA** , a filled pill routing to discovery/search. Present in 11/12. Not optional.
4. **A visual with intent** , a brand illustration (7/12), a ghost-preview of the future content
   (Peerspace), or confident pure type (3/12). ZERO of the twelve use a washed grey icon-in-a-disc.
5. **Generous vertical centering inside a living page** (nav/search/content around it).

## The Solen empty-state law (supersedes the bare `<EmptyState>` disc ritual)

- Headline 18/600 ink, promise/tease-phrased, "...noch" warmth allowed ("Dein erster Termin wartet").
- Subline 14/400 grey naming the gesture ("Tippe das Herz auf einem Salon").
- One filled ink pill CTA to the filling action (Salons entdecken -> /search) , or a 14/600 ink
  text-action when the page already carries a primary commit.
- Visual: the sanctioned 3D category icon set (`/icons/categories/*.png`, LOCKFILE 13.7 zone , scissors/
  nails/spa/clippers by surface) at ~56-72px, OR the Peerspace ghost-preview (2-3 faded skeleton shapes
  of the future content). NEVER a grey Lucide disc, never a washed icon.
- Sits on the sunken tray (radius 16) inside a living page; discovery content below keeps the viewport
  alive (FLOORS 4/5 still bind).
- German copy passes the same promise/gesture test; no bare "Keine X vorhanden".
