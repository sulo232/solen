<!-- exists-check: extends _design-system/sections/confirmation/CORPUS.md (the cross-app research half,
     80 screens across 49 apps, read in full before writing) and applies the shape of
     _design-system/sections/salon-detail/README.md, as _design-system/sections/booking-service/
     already does for booking step 1. Net-new vs scripts/measure-sections.mjs and
     _plans/DESIGN_CONSISTENCY_2026-08-27.md item S4. `npm run exists confirmation` returns 10 hits:
     this route, BookingConfirmation.tsx, a dev report-flow component, salons.booking_confirmation_mode,
     two email builders in lib/email.ts and two page-inline sections. No per-section spec existed. -->

# /[locale]/confirmation section docs

Per-section specs for the booking confirmation screen. Each file follows the same shape as `_design-system/sections/salon-detail/*.md`: Reference, Component, Layer, Layout with an ASCII sketch, Measured, Tokens, Interaction, **Against the floors**, Intentional deviations, Empty state, Provenance.

Route: `/de/confirmation?booking_id=28b93837-e515-4066-87f2-f75a1150652a` (`app/[locale]/confirmation/page.tsx`, rendering `BookingConfirmation`). Measured live at 402x844, settled, HTTP 200, no redirect, `documentHeight` 1155.

## How this screen was reached, and what was NOT written to do it

**`/de/confirmation` with no parameters is not this screen.** It calls `notFound()` at `page.tsx:45` and renders an error state headed "Diese Seite wurde abgeschnitten." The page needs a `booking_id`, and the row behind it has to be readable by whoever is asking.

- **An existing seeded booking was used. Nothing was created and nothing was written.** It was found with a read-only service-role SELECT from a throwaway script in the scratchpad, never in the repo. Of the 998 seeded bookings it is the most recent that is status `confirmed`, has a `user_id` (so the RLS cookie path can read it without an access token), has a `staff_member_id` (so the stylist row renders) and carries a `reference_code`.
- **The booking:** `SOL-U4AQ6`, Blade & Stone in Basel, "Bart trimmen" at CHF 28 for 20 minutes with Deniz Yilmaz, `starts_at` 15:40 Europe/Zurich on the day of measurement, status `confirmed`, `payment_status` `none`, no payment intent, null VAT rate.
- **The auth path was the COOKIE path, not the guest-token path.** One navigation did both jobs: `GET /api/dev/login?email=verify-auth-rollout-test%40proton.me&to=/de/confirmation?booking_id=...`, which mints a magic link for the booking's owner, writes the session cookies onto its own 307 and redirects to the target. The RLS policy `bookings_select_own` then authorizes the read. `guest_bookings` holds 0 rows in this database.
- **It was verified to be the real screen and not the error state** before measuring: `document.title` and the `h1` both read "Termin bestätigt!", where the error state's heading is "Diese Seite wurde abgeschnitten."
- **The viewport was re-confirmed after the navigation:** `innerWidth` 402, `innerHeight` 844, `devicePixelRatio` 2, `scrollY` 0.

## States that could not be measured, and why

Not omissions. Each is gated on data that does not exist anywhere in this database, and the pass was read only, so producing any of them would have meant writing a booking.

| state | why it is unreachable | what it suppresses |
|---|---|---|
| **an upcoming booking** | **0 of 998 seeded bookings has a `starts_at` in the future**, checked against now with one query | `isUpcoming` is false on every reachable confirmation, so the red cancel row (`06`) and the reschedule chevron (`04`) can never render. Both are real render sites with real gates and no data |
| **a paid booking** | `payment_status` is `none` here, and only 11 of 998 rows carry a `payment_intent_id` | the green headline (`03`), the `bg-s-success-bg` paid pill with its check (`05`) and the `totalInclVat` label |
| **a split payment** | **exactly 1 of 998 rows has `remaining_at_salon` set** | the deposit-plus-remainder shape of the money card, which attaches the 29px number to the remainder rather than the total |
| **the VAT line** | `showVat` needs `isPaid` and a non-zero rate; this row's `vat_rate` is null and **0 of 28 salons has `vat_registered = true`** | the `totalInclVat` label and the centred VAT-number line in `07` |
| **the guest variant** | this booking has a `user_id`, so `isGuest` is false | the whole access-link card (`08`), and the guest destination of the manage link |

**The most consequential one is the first.** Two affordances that this screen is supposed to own, cancel and reschedule, cannot be seen on any confirmation reachable from this seed. That is a seed-data condition, not a code defect, and it means the screen's manage story has never been measured.

## Sections (document order)

| # | File | Section | Component |
|---|---|---|---|
| 1 | `01-hero.md` | Full-bleed 240px cover photo, frosted help control | `booking/BookingConfirmation.tsx:400-423` |
| 2 | `02-salon-row.md` | Salon name, address, chevron to the salon page | `:427-443` |
| 3 | `03-headline.md` | The affirmation `h1` | `:449-456` |
| 4 | `04-detail-card.md` | When, what, who | `:459-527` |
| 5 | `05-price-card.md` | Gesamtpreis and the 29px amount | `:530-568` |
| 6 | `06-actions.md` | Calendar primary, directions secondary, cancel tertiary | `:571-600` |
| 7 | `07-reference-footer.md` | Reference code and the manage link | `:629-644` |
| 8 | `08-guest-access-link.md` | Guest re-entry card (not rendered in this state) | `:603-627` |

Band map at 402x844, from the JSON:

```
 y    0  +-------------------------------------------+
       0 |  global sticky header, 402 x 84, chrome   |
      84 |  01  hero photo        402 x 240, bleed   |
     324 |                                           |
     340 |  02  salon row         362 x 54           |
     418 |  03  headline          362 x 28           |
     466 |  04  detail card       362 x 228          |
     694 |                                           |
     709 |  05  price card        362 x 77           |
     786 |                                           |
     806 |  06  primary CTA       362 x 52           |
     868 |  06  secondary CTA     362 x 50           |
     942 |  07  reference row     362 x 37           |
    1155 +-------------------------------------------+
         |  global bottom tab bar [12, 774, 378, 58], z 700,
         |  overlapping the primary CTA by 26px at rest
```

## Folded elements, and the chrome this screen does not own

Per the brief, wrappers and the all-containing landmark are folded into their parent rather than given a band of their own:

- **Band index 1 of the JSON is `main`, the whole document.** Its text roles and card list are the source for every band the script did not keep separately. It gets no file.
- **Three nested containers hold everything and none gets a band:** the layout's `main.isolate` [0, 84, 402, 1015], `div.min-h-[100dvh] bg-s-bg-surface` [0, 84, 402, 959], and the page's own `main.mx-auto w-full max-w-[440px] pb-16` [0, 84, 402, 959]. The third is what caps the content at 440px and gives every band its 20px gutter through the `px-5` inside it.
- **Folded with no band of their own:** the `div.px-5` content column, the two `celebrate-rise` animation wrappers that are also the cards themselves, and the two sheets (`RescheduleSheet`, `CancelBookingSheet`) that render closed.
- **Two of the five bands the script found are global chrome, not this screen's content.** Band 0 is the sticky global header (402 x 84, transparent, carrying a back arrow at [16, 20, 44, 44], a bell at [290, 22, 40, 40] and a menu at [342, 20, 44, 44]) and band 4 is the global bottom tab bar (378 x 58 pill at [12, 774], `rgba(255, 255, 255, 0.8)`, four items: Suchen, Inspo, Gespeichert, Profil, 12px labels, 24px icons). **Both are counted in the screen-level totals below**, because `extractSections` walks `document.body`. The per-section files treat them as chrome and neither gets a numbered file.

**One measured consequence of that chrome, recorded in `06`:** the tab bar occupies viewport 774 to 832 at `z-index: 700` while the primary "Kalender hinzufügen" button occupies 806 to 858, so **the bar paints over the button's top 26px at first paint.** 311px of scroll is available and the button clears once scrolled. Measured, not judged.

**Four icon controls sit in the top 120px of this screen:** back, bell and menu in the global header, plus the help circle inside the hero. The back was deliberately removed from the hero under V3-D461 ("one up-affordance, never both"); the other three were not part of that decision.

## The screen against the owner's target ladder

| axis | target (salon page) | confirmation, measured | delta |
|---|---|---|---|
| display anchor | 30px | **29px** (the price) | **1px under, and it clears the 28px floor** |
| body | 14px | 14.5px primary lines, 12.5px secondaries | half a pixel off |
| anchor to body ratio | 2.14x | **2.0x** (29 / 14.5) | 0.14 under, **and it clears the 1.8x floor** |
| distinct sizes | 5, four in the densest cluster | **8 visible** (29, 24, 17, 15, 14.5, 13, 12.5, 12) | 3 more, but with a real spread: 29 to 12 |
| bold share (weight >= 600) | 30% | **47.83%** (11 of 23), or 57.9% counting only this screen's own 19 elements | 18 to 28 points over |
| elevation levels | 3 | **1 measured shadow tier** (`shadow-elevation-2` on both cards), plus frost on the hero control and a translucent global tab bar | 1 to 2 under |
| what carries emphasis | size and colour, at weight 500 | **size**: a genuine 29 / 24 / 17 / 14.5 ladder, all at 600 or 700 | closest of the four screens |

**This is the only screen of the four that clears the display-anchor floor and the anchor-ratio floor.** It is also the only one with a photographic focal and the only one whose type has a real range rather than a 4px huddle. Its remaining problems are the bold share and the fact that nothing on it is weight 500: the ramp is 400 or 600 with no middle.

## Screen-level measured numbers

| item | value |
|---|---|
| viewport | 402 x 844, settled, HTTP 200, no redirect |
| document height | 1155, so 311px of scroll |
| distinct sizes | 9 rendered (29, 24, 17, 16, 15, 14.5, 13, 12.5, 12); **8 visible**, the 16px being the 1x1 sr-only skip link |
| distinct weights | 3 (700, 600, 400). No 500 |
| text elements | 23, of which 11 are weight >= 600 = **47.83%**. Four of the 23 are the global tab bar's labels; excluding them the screen's own share is 11 of 19 = 57.9% |
| colours | ink `#0A0A0A`, ink-2 `#6B6B6B`, white, accent `#276EF1`, hairline `#E4E4E7` |
| imagery | 1 image, 96480 px, the salon cover, **28.4% of the first viewport** |
| cards | 4 signatures: two `shadow-elevation-2` cards at radius 16, one ink pill, one outlined pill |

Screen-level floor results:

- **Display anchor (FLOORS LAW 6, >= 28px): PASS at 29px.** The only screen in this pass that clears it.
- **Anchor ratio (EMPHASIS BUDGET b, >= 1.8x): PASS at 2.0x.**
- **FLOORS LAW 1, the finished-screen pass: 5 of 6, with one unmeasured.** (a) a photographic focal, PASS. (b) exactly one element is clearly the biggest, PASS, the 29px price. (c) at least one tabular real number, PASS, the price and the reference code. (d) at least one semantic-colour moment, **FAIL in the measured state**: the only chromatic pixels are the accent blue on the manage link, and every semantic branch on this screen (green paid pill, green headline, red cancel, green copy tick) is gated on data that does not exist in this seed. (e) no dead-grey zone, PASS. (f) worst-case content, NOT MEASURED.
- **Bold share (EMPHASIS BUDGET a): FAIL at 47.83%.**
- **Size ceiling (<= 4) and weight ceiling (<= 2): FAIL, 8 visible sizes and 3 weights.**
- **Imagery (FLOORS LAW 2): EXEMPT by name (receipts), and it renders 28.4% anyway**, from a data-driven `src`.
- **FLOORS LAW 4, edge visibility: PASS.** Both cards carry a hairline and elevation on a light body. The contract's surface table says a card carrying elevation drops its border and never both; measured, both cards have both.
- **Locked radius: PASS on everything measured** (16 on both cards, 99 on both buttons). One source-only FAIL: the guest card's copy button is `rounded-[9px]`, a value the locked table does not contain.
- **Touch targets: two FAILs, both unpadded text links.** "Buchung verwalten" at 139 x 20, and the guest card's link row (not rendered). Buttons at 52, 50 and 44 all pass.
- **Sparse blue: PASS.** One accent element on the whole screen, the manage link, plus its chevron.
- **`s-ink-2` on non-load-bearing text: PASS.** The banned `#9CA3AF` appears nowhere.
- **FLOORS LAW 8, the same thing looks the same everywhere: FAIL against the pay step.** The same three booking facts render one tap earlier at 15px / 600 primary with 13px ink-2 secondary in a `shadow-elevation-1` card with 44px icon slots, and here at 14.5 / 600 with 12.5 ink-2 in a `shadow-elevation-2` card with 18px icons.
- **FLOORS LAW 9, composed from the registry: MIXED, and the corpus's claim needs one correction.** `Avatar`, `Image`, `RescheduleSheet`, `CancelBookingSheet` and the toast are composed. **`SuccessMark` is not.** The corpus says grep finds exactly one consumer of that primitive, a dev route; **grep on 2026-08-27 finds two**, `app/[locale]/_components/tips/TipFlow.tsx:170` (a real customer surface) and the dev route. So the primitive is not orphaned. It is still absent from the one screen whose entire job is confirming, which is the live question rather than the retire-or-compose one the corpus posed.
- **Trust floor (hierarchy-density-05): does not bind here.** It gates a screen carrying a paid commit action, and this screen commits nothing. **The corpus's own gap item 1 is the sharper point and it is confirmed:** no cancellation or refund term renders anywhere on this screen. All 11 measured text roles were enumerated and none is a policy line. Nothing in the floors binds it, which is exactly how the hole survived, and 15 of 49 corpus screens state the term, including every single app that takes real money with a real penalty.

## Corpus questions this measurement answers

| corpus claim | measured |
|---|---|
| Solen-gap 2: "the declared display anchor is 24px and the total is 29px... I did not render the page, so I have not confirmed these declared sizes paint as declared" | Both paint as declared: `h1` 24, price 29. The screen's anchor is the price, and the date and time is the fourth tier at 14.5 |
| Solen-gap 1: no cancellation policy renders | Confirmed. 11 text roles enumerated, no policy line among them |
| Solen-gap 3: status is carried by headline colour | Confirmed from the rendered colour rule. The measured state is ink; the green branch never rendered because no reachable booking is paid |
| Solen-gap 4: `SuccessMark` is built, animated and unused here | Confirmed absent from this screen. **The "exactly one consumer" half is now wrong**: there are two, and one is a real customer surface |
| pattern 10: a green check glyph as the success mark | Absent. All 16 SVGs on the page were enumerated and accounted for: 3 header, 1 help, 2 salon row, 2 detail icons, 2 button icons, 1 manage chevron, 4 tab bar, 1 hidden X |
| pattern 12: a separate celebration interstitial | Not present. There is one screen, not two |
| motion: "the success-moment vocabulary in this category is a check and a rise" | Only the rise is wired. `confirm-rise` at 0.42s `cubic-bezier(0.16, 1, 0.3, 1)`, and the delays are worth naming: the two cards carry 0s, the `h1` carries 0.2s and the primary button 0.68s, **so the headline lands after the content it is meant to introduce** |

## Not yet measured

1. **Every state in the table at the top of this file**: upcoming, paid, split payment, VAT, guest.
2. **The cancelled branch**, its red headline and the suppression of both manage affordances.
3. **The no-photo branch**, which drops the hero entirely and takes imagery to zero.
4. **The reschedule and cancel sheets**, both closed at rest.
5. **The help control inside the hero**, whose box was not read.
6. **Every hover, press and `focus-visible` state**, including the salon row's sunken focus background.
7. **The `.ics` download**, which is a synthetic anchor click and produces no visible UI.
8. **Desktop.** The content column caps at 440px, so desktop is this layout centred in white space, unmeasured.
9. **Worst-case content (FLOORS LAW 1 item f)**, the longest salon and service names against the truncating 17px and 14.5px lines, and the French and Italian strings against both fixed-height buttons.
10. **The stylist initials disc.** Measured as having no background and no radius; the cause was not investigated.

## Reference set

- `_design-system/sections/_measured/confirmation.json` , the live measurement, including the enumerated SVG census, the entrance-motion delays, the tab-bar overlap and the five unreachable states
- `_design-system/sections/confirmation/CORPUS.md` , 80 screens across 49 apps, 107 opened, whose gap section is confirmed on three of four items above
- `_design-system/sections/checkout-pay/` , the screen one tap earlier, which renders the same three facts through a different type ramp
- `app/[locale]/confirmation/page.tsx` , the server read, its two auth paths and the `notFound()` at `:45`
- `app/[locale]/_components/primitives/SuccessMark.tsx` , built, animated, and composed by `TipFlow` rather than by this screen

## Locked decisions affecting this route

- **V3-D461** , one up-affordance on a deep page, never both, which is why the hero has no back control
- **V3-D470 / LOCKFILE §13.4, 2026-06-10** , codes render Inter Tight tabular, JetBrains Mono retired
- **Taste rule 3 / V3-D192-fix** , the one primary commit stays ink, which the corpus supports here by citing Airbnb's own switch to black at this exact step
- **Design contract, semantic colour** , normal green `#16A34A`, never the rejected deep `#15803D`
- **FLOORS LAW 2, 2026-07-25 clarification** , imagery is satisfied by real content, never by a baked-in decorative `src`
- **`app/globals.css:510-525`** , the `confirm-*` motion set with a `prefers-reduced-motion` block that lands on the final state
