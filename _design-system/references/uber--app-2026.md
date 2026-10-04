# Uber app, current (2026): measured spec

Owner direction, 2026-10-04: renew Solen's customer site and dashboard from the current Uber app (TASTE_LOG, same date). This file is the reference for that renewal.

**Sources**
- The owner's 11 iPhone screenshots, taken 2026-10-04, in `uber-app-2026-10/`:
  - `01-home`, `02-store`, `03-menu-category`, `04-option-sheet`, `05-item-sheet`, `06-cart`, `07-upsell`, `08-loading`, `09-checkout`, `10-addresses`.
  - Images are 1206x2622, which is 3x of 402x874 pt.
- Every value below was read pixel by pixel from those images with PIL. `pixel-spec-auto` exited 2 on all of them because it found no wide dark CTA, so the values were measured directly.
- Values marked **Base** come from Uber's open-source Base Web tokens (`github.com/uber/baseweb`). The researcher report is `_design-system/research/uber-current-design-2026-10.md`.
- Type sizes are fitted by word width to Inter, the font Solen uses, not by glyph height.

**Limits**
- These are static frames. Motion and press states are not measured here.
- The Base motion curves are listed only as a starting point.

## 1. The core idea: flat page, floating controls

The page is flat white. A shadow appears only on a thing that sits *above* the page, never to mark the edge of a group. Base's own rule says the same: shadow only when a component is above the main surface; use colour or borders for boundaries.

| Floats (has a shadow) | Measured on |
|---|---|
| The main search bar on home | `01` "Where to?": 1px #E0E0E0 edge plus a soft shadow below, fading over about 11pt |
| The bottom tab bar, a white pill hovering above content | `01`: #EAEAEA edge plus a soft shadow; the active tab is a #F6F6F6 capsule |
| Toasts | `01` "40% off Rides": a white pill, about 35pt tall, with a soft shadow |
| Circle buttons that sit on a photo | `05` close and share: white 44pt circles, shadow fading over about 8pt below; `02` the + on product photos |
| The selected tab of a segmented control | `02` Delivery/Pickup: a white tab lifted on a #F6F6F6 track |
| The sticky bottom action bar when content scrolls under it | `09`: a shadow fades upward over about 7pt above the bar |

| Stays flat | Measured on |
|---|---|
| Content cards and lists | `01` recents card: 1px #ECECEC border, no shadow; `02` fee card: 1px #F3F3F3 border, no shadow |
| Photo tiles | `02` product tiles: #FAFAFA fill, no border, no shadow |
| Chips, tags and filter pills | `02`: no shadow |
| Section breaks | A full-width grey band: `05` 4pt #F3F3F3; `09` 4pt #F6F6F6 |
| Primary buttons | `05` and `09`: flat ink, no shadow |

Proposed shadow for Solen's floating things, inferred from the measured fade lengths and Base `shadow500` (`0 2px 8px` at 16%), kept lighter:
- `0 0 0 1px rgba(0,0,0,.05), 0 4px 16px rgba(0,0,0,.08)` for bars and search.
- `0 2px 8px rgba(0,0,0,.14)` for small circles on photos.

## 2. Colour: grey and ink do the work, colour carries meaning

**Neutrals**

| Role | Value | Measured on |
|---|---|---|
| Page | #FFFFFF | all |
| Text, main | #111111 | titles, prices, icons |
| Text, secondary | #525252 | "Basel", "Choose 1", "Subtotal" |
| Text, tertiary | #6B6B6B | "Other fees", "Earliest arrival" |
| Control fill | #F6F6F6 | "Later" chip, unselected chips, icon tiles, arrow circles, segmented track, stepper, options panel, active tab capsule |
| Tag fill | #F3F3F3 with #5E5E5E text | "Popular", "Required" (the grey variant). Base gray50 is #F3F3F3 |
| Hairline inside cards | #ECECEC | recents card border and divider |
| Edge of a floating thing | #E0E0E0 to #EAEAEA | search bar, tab bar |
| Primary / selected | #111111 fill, white text | "Featured" chip, Add to cart, Next, the selected radio, the toggle knob |

**Meaning colours.** Each one comes as a pale tint with dark text, or as solid fill with white text.

| Meaning | Tint and text | Solid | Measured on |
|---|---|---|---|
| Social proof, positive | #EAF6ED / #166C3B; #E6FFE3 / #10723A | #098042 | "480+ people reordered", "Required ✓", "#1 most liked". Base green50 #EAF6ED, positive #0E8345 |
| Promo, price cut | | #D13B20 | "40%", "Promo" tags |
| Error, missing | text only, #CC2609 | | "Add payment method". Base negative #DE1135 |
| Membership | #FDF2DC tint with a 1px #E9DFCA edge | #9F6402 (Join button, "Uber One" text, the "Add delivery details" link) | Base yellow50 #FDF2DC, membership #9F6402 |
| Location, live | blue #276EF1 dot only | | "Current location" |

Pictures carry the rest of the colour. Photos and flat colour illustrations (`01` For-you circles, `08` loading) are what make the page feel colourful; the UI chrome itself stays grey and ink.

## 3. Corners

| Thing | Radius (pt) | Measured on |
|---|---|---|
| Primary button | 8 | `05` and `09`, 56pt tall: inset reaches 0 at about 7pt. Base button 8 |
| Grouped option panel | 8 | `05` options panel |
| Selected option card (2px ink border) | about 12 | `09` "Standard". Base card 12 |
| Content card, photo tile | about 16 | `01` recents card; `02` product tiles. Base sheet and dialog 16 |
| Tag | about 4 | `05` "Popular" and "Required". Base tag 4 |
| Search bar, chips, tab bar, toast, segmented control, circle buttons, stepper | fully round | all |

## 4. Type, as Inter sizes fitted by word width

| Role | Solen size | Measured |
|---|---|---|
| Item or page title | 24, weight 700 | `05` "Double Royal…": cap height 16.7pt |
| Section heading | 21, Inter Tight 700 | "For you" 19.7, "Get delivery on Uber Eats" 20.7, "Select Option" 21.7, "Delivery options" 21.2, "Payment" 20.8 |
| Search placeholder (hero) | 19, weight 500 | "Where to?" |
| Price on an item page | 20, weight 500 | "CHF 12.30" |
| Row title | 16, weight 500 | "Hagentalerstrasse 6" 16.2 |
| Secondary line | 15, weight 400, #525252 | "Rheinstrasse 23, Pratteln" 15.7, "Choose 1" 15.4 |
| Money rows | 16, weight 400; total 18, weight 700 | "CHF 21.90" 16.0, "Total" 18.4 |
| Tag | 13 to 14, weight 500 | |

## 5. Shapes and controls

| Control | Spec | Measured on |
|---|---|---|
| Primary button | 56pt tall, full width minus 16pt margins, #111111, radius 8, white label about 17 weight 500. A price can follow the label after a "•" | `05` "Add 1 to cart • CHF 21.90" |
| Secondary button | #F6F6F6 capsule, ink label | `06` "Add items", the stepper |
| Chips | 40 to 44pt capsules, #F6F6F6 or ink when selected, icon plus label | `02` |
| Selected option | 2px ink border, radius 12, white fill | `09` |
| Radio | black filled dot when selected | `05` |
| Toggle | grey track, ink knob, the knob lifted by a shadow | `09` |
| Tabs | ink label plus a thick ink underline (about 3pt); inactive labels grey | `01` Uber/Eats/Shops; `03` |
| Circle icon buttons | #F6F6F6, about 36 to 44pt, on white; white with a shadow on a photo | `01` arrows; `05` |
| Section bands | 4pt grey between major sections, full bleed; no box around each section | `05` and `09` |
| Rows | no box; a 1px #ECECEC divider inset under the text only where a card holds several rows | `01` recents |

## 6. Motion (Base tokens only, not measured)

| Use | Curve |
|---|---|
| Enter | `cubic-bezier(0.22,1,0.36,1)` |
| Exit | `cubic-bezier(0.64,0,0.78,0)` |
| Default | `cubic-bezier(0.83,0,0.17,1)` |

Durations start at 100ms.

## 7. What changes for Solen

This compares with the 2026-10-04 mockups, which are now superseded.
1. **Shadows move off content boxes.** Cards and lists go flat, using a 1px #ECECEC border or nothing. The shadow moves onto the floating things: the search bar, the bottom bar, the sticky Book bar, circles on photos and the segmented selected tab.
2. **Sections are split by 4pt grey bands**, not by boxes.
3. **Primary buttons become 8pt-radius rectangles, 56pt tall**, not capsules. Chips, search and circles stay round.
4. **Meaning colour returns**, used sparingly:
   - green tint for proof, only where real data backs it (a real "Popular" flag, real free cancellation terms, a real rating);
   - red for discounts;
   - amber for membership and loyalty (Solen Status);
   - blue only for the live location dot.
5. Greys move to #F6F6F6 (fills) and #ECECEC (hairlines), and ink to #111111.
