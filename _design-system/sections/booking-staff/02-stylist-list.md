<!-- exists-check: extends _design-system/sections/booking-staff/CORPUS.md (read in full first), whose
     pattern table and Solen-gap section cover this exact list and explicitly leave the type census
     to a rendered measurement. `npm run exists "staff step"` returns StaffStep.tsx plus one
     graveyard entry (SalonServicesSheet, unrelated). No per-section spec existed for this band. -->

# Stylist list (Egal + one card per stylist) , section spec

**Reference:** `_design-system/sections/_measured/booking-staff.json`, `bandAnatomy.list`, `.rows`, `.avatars`, `.checkBadge`, plus band index 0's text roles · `CORPUS.md` patterns 1, 2, 5 and the Solen-gap section
**Component:** `components-legacy/booking/StaffStep.tsx:102-189` (the list) · `:97-100` (`rowCls`) · `:230-236` (`CheckBadge`) · `app/[locale]/_components/primitives/Avatar`
**Layer:** 2 (the accent link inside the row) over layer 1 surfaces

## Layout

```
y=64  ul, flex column, gap 10, padding-top 4
      +--------------------------------------------------+  370 x 90   SUNKEN, selected
      | (Users)   Keine Präferenz                  (v)   |  radius 16
      |  56px     Maximale Verfügbarkeit           24px  |
      +--------------------------------------------------+
y=168 +--------------------------------------------------+  370 x 125  white
      | [photo]   Jonas                                  |  radius 16
      |  56px     DE / EN / FR                           |  hairline
      |           * 4.6 (16)                             |
      |           Profil ansehen                         |  12px accent
      +--------------------------------------------------+
y=303 ... Marco, same box
y=438 ... Tim, same box
y=563 list ends
```

One card per stylist, gap separated. Row pitch is 135 (125 card + 10 gap), measured.

## Measured

| item | value |
|---|---|
| list box | [16, 64, 370, 499], `gap 10px`, `padding-top 4px` |
| Egal row | [16, 68, 370, 90], radius 16, background `rgb(244, 244, 245)`, border 1px `rgb(228, 228, 231)`, padding 16, inner gap 14, shadow none |
| stylist rows | [16, 168], [16, 303], [16, 438], each 370 x 125, radius 16, background `rgb(255, 255, 255)`, same border, padding and gap |
| avatars | 56 x 56 at x 33, radius 9999, 3 of them, real `images.unsplash.com` sources |
| check badge | [345, 101, 24, 24], radius 9999, background `rgb(10, 10, 10)`, count 1 |
| name, selected | 15px / 600 / Inter Tight / ink / count 1 / "Keine Präferenz" |
| name, unselected | 15px / 500 / Inter Tight / ink / count 3 / "Jonas" |
| subtitle | 13px / 400 / Inter / `rgb(107, 107, 107)` / line-height 19.5 / count 4 |
| rating | 12px / 400 / Inter / `rgb(107, 107, 107)` / count 3 / "4.6 ( 16 )" |
| profile link | 12px / 500 / Inter / `rgb(39, 110, 241)` / line-height 18 / count 3 / "Profil ansehen" |
| imagery in the band | 3 images, 9408 px total (3 x 56 x 56) |

Derived, with the arithmetic: **avatar x 33** is row left 16 + 1px border + 16px padding. **Row pitch 135** is the measured 125 card plus the measured 10px `gap-2.5`.

Two things the numbers say that the source does not:

- **The ALL-CAPS language subtitle is uppercase in the STRING, not in CSS.** The measured `textTransform` on that role is `none`; `StaffStep.tsx:132` calls `l.toUpperCase()`. Anything that greps for `uppercase` classes to police the tracked-caps ban will not find this one.
- **The count 4 on the 13px role** is one "Maximale Verfügbarkeit" plus three language lines, so every row in this run has a subtitle. That is data luck, not a guarantee: see the empty state.

## Tokens

- Row: `rounded-card border border-s-border p-4`, active `bg-s-bg-sunken`, inactive `bg-white` (`StaffStep.tsx:97-100`). Radius 16 with a hairline and no shadow is the locked **individual entity-card** literal, the `SalonResultCard` grammar, owner 2026-07-19 ("stylists are individual not groups").
- Selected = calm gray fill plus semibold plus one static check. Never an ink fill.
- `CheckBadge` = `h-6 w-6 rounded-full bg-s-ink text-white` with `Check size={13} strokeWidth={2.75}`.
- Egal glyph = `Users size={22} strokeWidth={2.2}` in a 56px white circle, so the pinned-first row keeps the same left column as a portrait without faking one.
- Profile link = `text-[12px] font-medium text-s-accent hover:underline`, the locked small-clickable-text treatment.
- Star = `fill-s-star` `#FFC32B` (`:164`). Source, not measured: `scripts/measure-sections.mjs:214` skips SVG.

## Interaction

- The whole row selects. It is a `div role="button" tabIndex={0}` with an `onKeyDown` for Enter and Space, not a `<button>`, because the profile link inside it is a real nested button and button-in-button is invalid HTML (`:136-150`).
- `aria-pressed` carries the state. Selection writes `selectedStaffId` to the booking context and nothing else; no navigation, no fetch.
- "Profil ansehen" calls `stopPropagation` first, so it never selects the row it sits in, then opens `StaffProfileSheet` (see `04`).
- **"Egal" is pre-selected on arrival** because `selectedStaffId` defaults to `'any'` in `lib/booking-context.tsx`, so the commit button in `03` is never disabled on this step.
- The list is filtered before it renders: only staff mapped to **every** selected service survive, and staff with no mappings at all count as can-do-all (`:81-86`). If that filter empties the list it falls back to the full `staffList`.

## Against the floors

- **Touch target (>= 44px): PASS on the rows, FAIL on the nested link.** Rows measure 90 and 125 tall. "Profil ansehen" carries no padding (`mt-1 block text-[12px]`), so its hit box is its line box, and the measured line-height is 18px. That is 26px under the floor, derived from the measured line-height rather than from its own rect, which the JSON does not carry.
- **Selected state (locked contract): PASS.** Measured fill `rgb(244, 244, 245)` = `#F4F4F5` = `s-bg-sunken`, with ink text. The `no-black-selected` rule holds.
- **Radius and hairline (locked): PASS.** 16 and `#E4E4E7`, both exact.
- **Edge visibility (FLOORS LAW 4): PASS by option (c).** White cards keep the hairline on a white body.
- **Distinct sizes in this band: 3** (15, 13, 12). The band is not the ceiling problem; the screen is (see the README).
- **Bold share in this band: 1 of 14 elements at weight >= 600 = 7.1%.** Well inside the 30% ceiling, and it is the right one: the single selected name.
- **FLOORS LAW 1 (d), a semantic-colour moment: PASS, source-confirmed only.** The `#FFC32B` star renders in each rating row; SVG is skipped by the measurement script, so no rendered pixel of it is in the record.
- **FLOORS LAW 2, imagery: EXEMPT, and it carries photography anyway.** A picker is a form surface, which the floor exempts by name. It still renders 3 real data-driven avatars, 9408 px, 2.8% of the 402x844 viewport. The exemption is why that is not a fail.
- **FLOORS LAW 9, composed from the registry: MIXED.** `Avatar` is composed. The row itself is hand-built here while its own comment names `SalonResultCard` as the grammar it matches, so the grammar is copied rather than imported.

## Intentional deviations

- **Rows, not a grid, and no per-stylist next-available time.** Direction B, owner-picked 2026-07-09 from `/dev/stylist-directions`. The corpus majority for information-dense pickers agrees; Fresha does not. Dated owner call, it stands.
- **The language subtitle was deliberately removed and then deliberately restored.** Dropped 2026-07-09 under copy rule 4 (a tag must add a decision-relevant fact), restored 2026-07-24 against Fresha reference IMG_6696 because the owner wants languages to be a stylist's subtitle app-wide. The file records the reversal in place rather than hiding it. Two rules are in tension here and the newer dated call wins: copy rule 4 bans language tags at checkout by name, and the mockup list bans tracked uppercase. Known, not rediscovered.
- **No availability copy of any kind.** There is no per-staff next-slot endpoint, so a time here would be fabricated data.
- **One quiet static check, no spring.** B4: an already-selected row must not re-announce itself on every re-render.

## Empty state

- **Zero staff or one staff: this step does not render at all.** `hasStaffStep = staffList.length > 1` (`BookingWizard.tsx:124`), and `ServicesStaffStep` auto-assigns the single stylist, so nothing downstream is left unset.
- **No stylist can do every selected service:** `capable` empties and the list falls back to the whole `staffList` (`:86`). The user is then shown people who cannot perform the cart. Measured salon had 3 capable of 3, so this branch did not render.
- **A stylist with no `languages`:** the subtitle element is simply absent (`:159`), degrading the row to name plus rating. The corpus calls a name-only row legal for a filter rail and not for a commit step. Not measured, no such row in this data.

## Provenance

- Direction B, owner-picked 2026-07-09 , rich tap-rows, whole row taps, Egal pinned first, defects B4 to B7 fixed
- B19, owner 2026-07-09 asked twice , the read-only "Profil ansehen" path restored without a services tab
- Owner 2026-07-19 , each stylist is its own individual entity card, not a member row in a group card
- Owner 2026-07-24 , the language subtitle restored against Fresha IMG_6696
- Locked selected-state contract (design contract table) , gray fill, never ink
