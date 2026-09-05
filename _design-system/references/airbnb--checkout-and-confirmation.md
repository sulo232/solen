<!-- exists-check: net-new vs airbnb--listing-page.md (this session), airbnb--reviews.md,
     airbnb--home-mobile.md, airbnb--profile-list.md, AIRBNB_SYSTEM_VS_OURS.md because none of them
     opens the booking/checkout flow or the post-booking confirmation screen. `_inventory/` was not
     grepped (this is a competitor-reference capture, not a Solen surface). Reuses no prior file;
     the confirmation half was captured fresh via Mobbin stills since it is auth-walled live. -->

# Airbnb, mobile web checkout and confirmation

REF: airbnb / web-mobile + ios / checkout-and-confirmation / live-DOM + Mobbin stills

## Identity

- **Brand / platform / surface:** Airbnb, the "Confirm and pay" checkout step (web, mobile
  viewport, logged out, goes as far as an anonymous guest can) and the post-booking confirmation
  screen (iOS app, via Mobbin, since confirmation requires an authenticated booking and cannot be
  reached logged out).
- **Source, checkout:** tapped "Reserve" from the listing at
  `https://www.airbnb.com/rooms/1617434888964259732`, landed on
  `https://www.airbnb.com/book/stays/1617434888964259732?...`, page title "Confirm and pay",
  labeled "Step 1 of 2" in-page.
- **Source, confirmation:** Mobbin, Airbnb iOS, screens returned by
  `mcp__mobbin__search_screens` query "Airbnb reservation confirmed screen with booking details
  and host info", platform ios. Cited screens:
  [confirmed](https://mobbin.com/screens/5072ddf8-8a38-4737-813e-e1ccb6ad452f),
  [reservation details / cancelled state](https://mobbin.com/screens/bdb60e52-6dbe-4a94-9dd2-7bfaf2a6f33c),
  [pending](https://mobbin.com/screens/e41ad7e2-c5b7-4a35-9683-6ee4b0a654c2),
  [trip / discover experiences](https://mobbin.com/screens/1e9e8e06-9b27-4ac5-8ea4-b6da24875fdb),
  [check-in info / wifi / rules](https://mobbin.com/screens/25dd3338-ae57-4a06-ae0a-5ea10e847004).
- **Viewport (checkout):** 390x844, deviceScaleFactor 3, iPhone Safari user agent, locale en-US.
- **Date:** 2026-09-05.
- **Method:** checkout measured via repo Playwright (`getComputedStyle` + `getBoundingClientRect`
  on live DOM); confirmation read directly off the Mobbin still images (visual description only,
  no computed styles available for someone else's app screen; every number below from that source
  is tagged accordingly, not measured). No login, no payment method entered, no card number typed
  anywhere, no commit tapped.

## Philosophy

Checkout drops almost all of Airbnb's personality: it is a plain white form page, ink text, one
line of trust copy (free cancellation) placed directly above the price, and a payment-choice radio
group with no persuasion styling. Confirmation swings the other way entirely: a warm cream
background appears (the ONLY warm surface anywhere in this whole capture), a large centered
two-line headline does the emotional work ("Your reservation is confirmed!"), and the same white
trip-summary card from checkout reappears as a receipt. The commit buttons on both screens
("Next", "Got it") are a plain black pill, never colored, unlike the listing page's Reserve button.

## Measured, checkout ("Confirm and pay", Step 1 of 2)

| element | value | tag |
|---|---|---|
| trip summary content order (top to bottom) | listing name + 5.0 rating with review count, "Change" link, Dates row + "Change" link, Guests row, Details / Total price, Free cancellation line, "Choose when to pay" radio group, Next | verified (DOM text order) |
| "Total price" label | 14px / 600, `rgb(34,34,34)`, `margin: 0 0 4px` | verified |
| price value line ("Fr. 419.10 including taxes") | 14px / 400, `rgb(34,34,34)` | verified |
| cancellation line ("Free cancellation / Cancel before [date] for a full refund. Full policy") | 14px / 400, block height 58px for the two-line message | verified |
| payment-option radio labels ("Pay Fr. X now" / "Pay part now, part later" / "Pay over time with Klarna") | 16px / 400, `rgb(34,34,34)`, each row ~24-60px depending on line count | verified |
| radio input (circle) | 22 x 22px, `border-radius: 50%`, unselected = `box-shadow: rgb(140,140,140) 0 0 0 1px inset`, selected = `box-shadow: rgb(34,34,34) 0 0 0 2px inset` (no fill color change, just a thicker dark ring) | verified |
| **primary "Next" button** | radius **12px** (rounded rectangle, NOT a pill), fill **`rgb(34,34,34)`** solid ink (no gradient here, unlike the listing's Reserve pill), text white 14px/500, `padding: 11px 20px`, height **40px**, full-width (342px inside the 390 viewport, 24px side margins) | verified |
| step indicator ("Step 1 of 2") | present in DOM, 16px/400, but renders visually compact/near-invisible at this breakpoint (measured box collapsed to 1x1, likely an sr-only or icon-replaced treatment at mobile width) | verified box only, visual treatment not confirmed |
| body / UI font | `"Airbnb Cereal VF", Circular, -apple-system, "system-ui", Roboto, "Helvetica Neue", sans-serif` | verified |
| page background | white | verified |

## Measured, confirmation (Mobbin stills, iOS, no computed styles available)

| element | value | tag |
|---|---|---|
| screen background, "confirmed" and "pending" states | warm cream/off-white (visually distinct from every other screen in this capture, which are all pure white) | assume (read off the still image, not sampled with PIL; close to the family of warm off-whites, exact hex not extracted) |
| headline ("Your reservation is confirmed!" / "Your reservation is pending") | large, bold, centered, two lines, roughly 26-28px by proportion to the image width | assume (proportion estimate from the still, not a computed style) |
| trip-summary receipt card | white rounded card, photo at top (rounded corners matching the card), then title, date/time, guest count, "Paid $X.XX USD" | verified (visually, from the still) |
| primary button ("Next" / "Got it") | full-width black pill/rounded-rect, white text, sits near the bottom above the home indicator, matches the checkout "Next" button's ink-black family | assume (visual match, not pixel-sampled against the checkout button) |
| reservation-details screen (post-confirmation, viewed later) | white background (not cream), photo card at top with a status pill ("Cancelled") overlaid top-left, then plain-text grouped sections separated by full-width dividers: "Reservation details" / "Confirmation code" / "Cancellation policy", no card containers around these text groups | verified (visually) |
| "Message Host" row | icon + label + chevron, plain list row, no card | verified (visually) |
| status pill overlay on photo ("Cancelled") | white pill, dark text, sits inset top-left over the photo | verified (visually) |

## Not measured

- No computed-style access to the confirmation screen at all (Mobbin stills only); every number in
  that section is a visual read, not a measurement. If Airbnb's confirmation is ever priority for a
  pixel-exact port, it needs a real device or an authenticated web session, neither available here.
- The checkout page's actual payment fields (card entry) never rendered for an anonymous session;
  Airbnb defers auth/payment collection past what an unauthenticated guest can reach, so the input
  recipe requested (text field styling) was not capturable at all on this pass. The three inputs
  captured were the payment-option radio circles, not text inputs.
- Whether the cream confirmation background is a fixed hex or a themed token was not resolved.

## Port map

| Airbnb value | Our token / value | inside our lock? |
|---|---|---|
| "Total price" label 14/600 | Matches our body 14px + our 600 weight tier | Fits without a new token. |
| Next button: ink black, radius 12, h 40 | Close to our `bg-s-ink` CTA; our button radius is locked 16px not 12 | Small delta, same family as our lock (ink fill, no gradient). |
| Trust line above commit ("Free cancellation... Full policy") placed directly above payment choice | Matches our own Trust floor requirement (hierarchy-density-05: cancellation term must render above the commit button) | Already required by our own floors law, Airbnb validates the pattern, no conflict. |
| Radio selection = thicker ring, no fill change | Our selected states use a calm gray fill (`bg-s-bg-sunken`) per the design contract's "selected / active" row | Different mechanism (ring vs fill); not a conflict since radios are not covered by that fill rule, but worth naming as an alternate legal pattern if a future radio component is built. |
| Confirmation background = warm cream | Web is a single light theme, and taste rule 3 already bans warm cream by name ("~80% neutral surfaces, no warm cream") | Direct conflict, see below. |
| Confirmation headline centered, large, emotional copy | Matches our own booking-confirmation intent; no locked literal blocks a large centered confirmation headline | No conflict, compatible direction. |
| Status pill overlay on a photo ("Cancelled") | Compatible with our category-tag / badge treatment (neutral bg + ink text, no per-category color) | No conflict if kept neutral (white pill, dark text, as measured), would conflict if colorized. |

## Conflicts

- **CONFLICT [background warmth]: Airbnb's confirmed/pending screens use a warm cream background,
  the one warm surface anywhere in this whole capture. Solen's taste rule 3 explicitly bans warm
  cream ("no warm cream" is named directly in the 80/17 surfaces rule), and the design contract's
  merchant-terminal history records an owner rejection of exactly this kind of beige
  ("You made up a random fucking collar that's beige").** This is the single clearest place Airbnb's
  look and Solen's lock disagree. Owner call: keep it white per our lock (the confirmation still
  reads calm and "confirmed" without the cream, per Airbnb's own reservation-details screen which is
  plain white), or take the emotional-peak cream as a deliberate, named exception for one moment
  (peak-end effect, `fable-psychology`) the way FLOORS LAW already carves narrow named exceptions.
- **CONFLICT [radius]: Next/Got it button radius 12px against Solen's locked button radius 16px.**
  Minor, same direction as the listing-page Reserve-button conflict but smaller stakes since both
  are rounded-rects, not a capsule-vs-square dispute.
