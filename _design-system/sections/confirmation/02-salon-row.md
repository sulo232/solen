<!-- exists-check: extends _design-system/sections/confirmation/CORPUS.md dominant-anatomy slot 3
     ("who + what", present in nearly all 49 screens) and its anchor table, where the entity name is
     the display anchor in 6 of 49. `npm run exists confirmation` returns 10 hits; this band is part
     of BookingConfirmation.tsx and nothing new is proposed. -->

# Salon row (name, address, chevron) , section spec

**Reference:** `_design-system/sections/_measured/confirmation.json`, `bandAnatomy.salonRow` · `CORPUS.md` dominant anatomy slot 3 and the anchor table
**Component:** `components-legacy/booking/BookingConfirmation.tsx:427-443`
**Layer:** 1 (chrome)

## Layout

```
y=340  +-------------------------------------------------+
       | Blade & Stone                              >    |  17 / 700 Inter Tight
       | (pin) Feldbergstrasse 82, Basel                 |  12.5 ink-2
       +-------------------------------------------------+
y=394
```

Directly under the photograph, inside the 20px page gutter, one tappable row.

## Measured

| item | value |
|---|---|
| row | `A` element, [20, 340, 362, 54] |
| name | [20, 344, 337, 26], 17px / 700 / Inter Tight / `rgb(10, 10, 10)`, letter-spacing -0.17px, line-height 25.5 |
| address | [36, 372, 153, 19], 12.5px / 400 / Inter / `rgb(107, 107, 107)` |
| pin icon | [20, 375, 12, 12], `rgb(107, 107, 107)`, Lucide `MapPin` size 12 |
| chevron | [365, 359, 17, 17], `rgb(107, 107, 107)`, Lucide `ChevronRight` size 17 |

The name box is 337 wide inside a 362 row, leaving 25 for the chevron and its gap. It truncates rather than wrapping.

## Tokens

- Row: `mt-4 flex items-center gap-2 py-1 focus-visible:bg-s-bg-sunken focus-visible:outline-none`
- Name: `truncate font-display text-[17px] font-bold tracking-[-0.01em] text-s-ink`
- Address: `mt-0.5 flex items-center gap-1 text-[12.5px] text-s-ink-2` with a truncating span
- Affordance: a grey chevron, not a colour. Clickability on structure is signalled by affordance, which is the locked rule.

## Interaction

- The whole row is a `Link` to `/{locale}/salon/{slug}`. It leaves the confirmation.
- **Its focus state is a sunken background rather than the global 2px ink outline** (`focus-visible:bg-s-bg-sunken focus-visible:outline-none`). That is a third focus vocabulary in the product, after the global ink outline on links and buttons and the deliberately invisible input focus. It is at least visible, which the input's is not.

## Against the floors

- **Touch target: PASS at 54px** for the row. The tap target is the whole row, not the 17px chevron.
- **Display anchor (FLOORS LAW 6): not this band's job, and it is the second largest text on the screen.** 17px, behind the 29px price and level with nothing else. On the corpus's anchor table the entity name is the anchor in 6 of 49 apps; here it is third.
- **Contrast: PASS** on both elements. Ink on white, and `#6B6B6B` at 5.33:1.
- **`s-ink-2` on non-load-bearing text: PASS.** The address and both glyphs use `#6B6B6B`, which is the one grey the system authorises for secondary text. The banned `#9CA3AF` appears nowhere on this screen.
- **Copy economy: PASS.** Name, address, chevron. No category tag, no distance, no rating, none of which the customer needs after committing.
- **FLOORS LAW 10, every element belongs to the screen's job: PASS.** The screen's job is "you are booked, here is what and when and where". A tap through to the salon is how a customer gets the phone number and the opening hours.

## Intentional deviations

- **The salon name sits below the photograph, never on it.** Fresha reverses it out over a full-bleed hero. Solen keeps the photo clean, which is why `01` needs no gradient scrim and why the name can be ink on white at full contrast.
- **17px rather than a display size.** The name is not the anchor here because the headline directly below it (`03`) is, at 24px, and the money card below that is larger still at 29px. Three descending tiers in three consecutive bands, in the order 17, 24, 29, which is the reverse of the reading order.

## Empty state

- **No `salonAddress`:** the second line and its pin are dropped together (`:435`), leaving a single-line row. Not measured.
- The salon name has no empty branch. A confirmation always has a salon.

## Provenance

- `CORPUS.md` dominant anatomy slot 3 , provider identity is present in nearly every screen in the corpus
- Design contract, link treatment , affordance on structure, colour reserved for small clickable text
