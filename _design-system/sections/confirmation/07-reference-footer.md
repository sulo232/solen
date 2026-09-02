<!-- exists-check: extends _design-system/sections/confirmation/CORPUS.md pattern 7 (a booking
     reference is shown, 14 of 49, buried at the bottom in 4 including Fresha and Airbnb), which
     records Solen's position as already correct and says it should not change. `npm run exists
     confirmation` returns 10 hits. -->

# Reference code and manage link (footer) , section spec

**Reference:** `_design-system/sections/_measured/confirmation.json`, `bandAnatomy.referenceRow` · `CORPUS.md` pattern 7
**Component:** `components-legacy/booking/BookingConfirmation.tsx:629-644`
**Layer:** 2 (the accent link)

## Layout

```
       ------------------------- hairline -------------------
y=942  SOL-U4AQ6                      Buchung verwalten  >
       13 / 600 mono ink-2            13 / 600 accent
y=979
```

One row, space between, under a rule. The last thing on the screen.

## Measured

| item | value |
|---|---|
| row | [20, 942, 362, 37] |
| code | "SOL-U4AQ6", [20, 959, 72, 20], 13px / 600 / Inter Tight, `font-variant-numeric: tabular-nums`, `rgb(107, 107, 107)` |
| manage link | "Buchung verwalten", [243, 959, 139, 20], 13px / 600, `rgb(39, 110, 241)`, href `/de/booking/lookup` |
| chevron | [367, 962, 15, 15], `rgb(39, 110, 241)`, Lucide `ChevronRight` size 15 |

**The code renders in Inter Tight, not in a monospace face, and that is deliberate rather than a leftover.** The class is `font-mono-code`, and the measured `fontFamily` on that text role is Inter Tight with `tabular-nums` on, so the figures column-align from the OpenType feature rather than from a monospace font. The class kept its name and changed its implementation: `app/globals.css:227-232` records the swap in place, and `tailwind.config.js:238` repeats it ("Codes render Inter Tight tabular via .font-mono-code"). That is the locked rule for codes, V3-D470 2026-06-10, owner: "the W-047 font is different", JetBrains Mono retired.

## Tokens

- Row: `mt-6 flex items-center justify-between gap-3 border-t border-s-border pt-4 text-[13px]`
- Code: `font-mono-code text-s-ink-2`
- Link: `inline-flex items-center gap-0.5 font-semibold text-s-accent`, hover `opacity-80`
- Fallback code: `SOL-•••••`, rendered when `referenceCode` is absent

## Interaction

- **The link's destination differs by who is looking.** `manageHref` is the guest's own access link when `isGuest && accessLink`, otherwise `/{locale}/booking/lookup` (`:241`). Measured here: the logged-in path.
- The code is not tappable and not copyable. The guest access link in `08` has a copy button; this does not.

## Against the floors

- **Touch target: FAIL.** The link measures 139 x 20 with no padding, 24px under the floor. It is the third unpadded text link measured in this pass.
- **Sparse blue: PASS.** Accent on a small clickable text link, which is the locked treatment.
- **Contrast: PASS.** `#276EF1` at 4.58:1 on white for the link, `#6B6B6B` at 5.33:1 for the code. Both clear AA at 13px.
- **`s-ink-2` on non-load-bearing text: PASS.** A reference code is a lookup value, and the banned `#9CA3AF` is not used.
- **Locked font for codes: PASS**, Inter Tight with tabular figures. See the class-name note above.
- **Copy economy: PASS.** Two elements, both load-bearing, no label on the code and no explanation under it.
- **CORPUS pattern 7: MATCHED, deliberately.** 14 of 49 corpus screens show a reference; 7 put it at the top because a human will ask for it (restaurants, hotels, airlines) and 4 bury it at the bottom because the app IS the record (Fresha, Airbnb, Viator, Zomato). Solen buries it, in grey, in a footer, exactly like Fresha's "Booking ref: E8D70974". The corpus states this should not change.
- **FLOORS LAW 10, every element belongs to the screen's job: PASS.** A code a support agent can be quoted, and a route back into the booking. Both belong to a receipt.

## Intentional deviations

- **The code is not copyable**, where the guest access link beside it is. A customer reading a code to a salon over the phone does not need a clipboard; a customer pasting a URL does.
- **No VAT number line in the measured state.** `:640-644` renders one, centred, at 13px, when `showVat && salonVatNumber`. That needs a paid booking at a VAT-registered salon, which does not exist in this data.

## Empty state

- **No `referenceCode`:** the code position renders `SOL-•••••`, a masked placeholder rather than an empty slot. Not measured, this booking has `SOL-U4AQ6`.
- **Guest:** the link points at the access URL instead of the lookup route, and `08` renders above this row.

## Provenance

- `CORPUS.md` pattern 7 , the buried reference matches Fresha and Airbnb and should not move
- LOCKFILE §13.4 / V3-D470, 2026-06-10 , codes are Inter Tight tabular, JetBrains Mono retired
