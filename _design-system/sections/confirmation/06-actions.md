<!-- exists-check: extends _design-system/sections/confirmation/CORPUS.md pattern 4 (add to calendar,
     19 of 49), pattern 5 (manage reachable, 26 of 49), pattern 9 (a filled primary exists in 16 of
     49 and only 4 are ink) and pattern 13 (actions as rows rather than buttons). `npm run exists
     confirmation` returns 10 hits; RescheduleSheet and CancelBookingSheet already exist and are
     composed, not rebuilt. -->

# Actions (calendar, directions, cancel) , section spec

**Reference:** `_design-system/sections/_measured/confirmation.json`, `bandAnatomy.actions` and `.globalChrome.overlapAtRest` · `CORPUS.md` patterns 4, 5, 9, 13
**Component:** `components-legacy/booking/BookingConfirmation.tsx:571-600`
**Layer:** 1 chrome, with layer 3 semantic on the cancel row

## Layout

```
y=806  +-------------------------------------------------+  362 x 52, ink pill
       |        (cal 17)  Kalender hinzufügen            |  15 / 600 white
       +-------------------------------------------------+
y=858        10px gap
y=868  +-------------------------------------------------+  362 x 50, white + hairline
       |        (pin 17)  Wegbeschreibung                |  15 / 600 ink
       +-------------------------------------------------+
y=918
       (Termin stornieren, red text, only when cancellable)
```

Two full-width stacked buttons, both centred icon-plus-label, then an optional bare red text row.

## Measured

| item | value |
|---|---|
| primary | [20, 806, 362, 52], radius 99, background `rgb(10, 10, 10)`, white 15px / 600, icon `Calendar` size 17 at [113, 824] |
| secondary | [20, 868, 362, 50], radius 99, background `rgb(255, 255, 255)`, border 1px `rgb(228, 228, 231)`, ink 15px / 600, icon `MapPin` size 17 at [122, 885] |
| gap | 10px, measured as 868 minus 858 |
| tertiary | **not rendered.** The red cancel row needs `canCancel` |
| primary entrance | `confirm-rise`, `animation-delay: 0.68s`, the last thing on the screen to arrive |

**The global bottom tab bar covers the top half of the primary button at rest.** Measured, and it is an overlap rather than a clearance: at scrollY 0 the fixed tab bar occupies viewport 774 to 832 at `z-index: 700`, and this button occupies 806 to 858. The two bands overlap by **26px** and the bar paints over the button. 311px of scroll is available (document 1155 against an 844 viewport), so the button clears the bar once scrolled. It is a first-paint condition, not a permanent one, and the primary action of the screen is half hidden when the screen first appears.

## Tokens

- Primary: `celebrate-rise mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-btn bg-s-ink font-body text-[15px] font-semibold text-white`, hover `brightness-[0.94]`, active `scale-[0.98]`
- Secondary: `mt-2.5 flex h-[50px] w-full items-center justify-center gap-2 rounded-btn border border-s-border bg-s-bg-surface font-body text-[15px] font-semibold text-s-ink`
- Tertiary: `mt-1 flex h-11 w-full items-center justify-center text-[15px] font-semibold text-s-error`, no fill, no border
- Both buttons are 15px / 600 with a 17px icon, so the only difference between the two tiers is the fill

## Interaction

- **Kalender hinzufügen builds an `.ics` in the browser** and triggers a download: it assembles `BEGIN:VCALENDAR` with `DTSTART`, `DTEND`, `SUMMARY`, `DESCRIPTION` and `LOCATION`, wraps it in a `Blob`, and clicks a synthetic anchor named `solen-{reference}.ics` (`:355-378`). No network call, no calendar API, no permissions prompt.
- **Wegbeschreibung** opens `https://www.google.com/maps/search/?api=1&query={salon name} {address}` in a new tab, with `rel="noopener noreferrer"`.
- **Termin stornieren** opens `CancelBookingSheet`; confirming posts to `/api/bookings/{id}/cancel` with the page's locale threaded through so a guest cancel still gets its email in language, then raises a toast, flips the local `cancelledNow` state and calls `router.refresh()`.

## Against the floors

- **Touch target: PASS.** 52 and 50, and the cancel row is `h-11`.
- **Locked radius: PASS**, `rounded-btn` measures 99 on both.
- **One primary commit, ink: PASS**, and it is the corpus's own minority position. 16 of 49 corpus screens carry a filled primary at all and only 4 of those are ink. The sharp citation is Airbnb, which uses Rausch red for the pre-commit "Confirm and pay" and **black for the post-commit "Next"**, switching to ink at exactly the moment Solen's rule says to.
- **Elevation is earned by the background: PASS.** Both controls are flat on a calm surface, no shadow. The contract's banned case is white plus a shadow on a calm surface, and neither button does it.
- **Semantic colour: PASS.** The destructive action is red text with no fill and no border, which is the restrained version the corpus's better half uses.
- **Dead affordance: PASS.** The cancel row renders only when a cancel can actually succeed, mirroring `BookingCard.tsx`'s own gate.
- **FLOORS LAW 3, the empty-state and dead-space floor: not applicable**, this screen is dense.
- **First-paint overlap: FAIL against no named floor, and worth recording anyway.** No rule in the system says a global fixed element must not cover a screen's primary action, because FLOORS LAW 3b is about a commit being reachable and this one is reachable, just painted over. The measured 26px is the finding.
- **CORPUS pattern 4: ADOPTED, at a weight the corpus does not endorse.** 19 of 49 carry add-to-calendar, and only Square Go and Grab give it primary weight; most demote it to a row or a link. Solen makes it the one ink button on the screen. The corpus explicitly leaves that as a taste call rather than settling it.
- **CORPUS pattern 13: NOT ADOPTED for the actions.** The corpus recommends letting the action rows use the icon-plus-label-plus-sublabel row shape that `04` already has, since it scales past four actions where a button stack does not, and since the sublabel can carry real information (the address, the venue name). Solen stacks two buttons. With two actions the stack is fine; the corpus's point is about the third and fourth.

## Intentional deviations

- **Destructive action hidden one level down**, opened from a bare red text row rather than given a top-level slot beside the primary. That is what Fresha, Airbnb and Tock do, and the corpus recommends it by name over Best Buy's three-icon row.
- **No "check your email" line.** The corpus counts 16 of 49, and rejects it for a logged-in path under copy economy: the record is in the app. For a guest it matters, and Solen ships something stronger than a sentence, the copyable access link in `08`.

## Empty state

- **The cancel row: NOT MEASURABLE in this database.** `canCancel` requires `isUpcoming`, and **zero of the 998 seeded bookings has a `starts_at` in the future.** The render site at `:592` is real JSX with a real gate; no data reaches it. Same root cause as the missing reschedule affordance in `04`.
- **Cancelled booking:** `isCancelledNow` suppresses both cancel and reschedule, and the headline turns red. Not measured.
- **Guest before the cookie exchange resolves:** `canManage` is false until the silent `guest-lookup` exchange succeeds, so the cancel row is absent for the first moments of a guest's visit by design, rather than appearing and then failing to authorize.

## Provenance

- `CORPUS.md` pattern 9 , the ink primary, with Airbnb switching to black at exactly this step
- `CORPUS.md` pattern 5 , destructive actions one level down, Fresha's shape rather than Best Buy's
- Checklist item 9 , `canManage` waits on the guest cookie exchange so the sheets never appear before the cookie that authorizes them
- A9-email-locale , the page's locale is threaded through the cancel call so a guest cancel email is in language
