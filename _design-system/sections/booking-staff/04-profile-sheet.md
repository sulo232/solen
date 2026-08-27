<!-- exists-check: extends _design-system/sections/booking-staff/CORPUS.md (components section) and
     documents an overlay that was NOT opened during the measurement run, so every number here is
     from source and says so. `npm run exists "staff step"` returns StaffStep.tsx and
     ServicesStaffStep.tsx; StaffProfileSheet itself composes the registered Sheet, Avatar and
     RatingStars primitives and the existing StaffReviewsSheet rather than adding an overlay. -->

# Stylist profile sheet (read only) , section spec

**Reference:** none. **This overlay was not measured.** It is closed at rest and `reachedBy.notMeasured` in `_design-system/sections/_measured/booking-staff.json` records that it was never opened. Every value below is read from source on 2026-08-27 and is labelled as such.
**Component:** `components-legacy/booking/StaffProfileSheet.tsx` (158 lines), opened from `StaffStep.tsx:173-182`, closed via `setViewStaffId(null)`
**Layer:** 1 chrome plus layer 3 semantic (the rating stars)

## Layout

```
+---------------------------------------------------------------+  Sheet, height="full"
|  Jonas                                                  ( X )  |  SheetHeader
+---------------------------------------------------------------+
|                        [ 88px avatar ]                         |
|                            Jonas                               |  19px / 700
|                          Herrenschnitt                         |  14px ink-2, specialty
|                        * * * * *  4.6 (16)                     |  RatingStars compact lg
|                    bio paragraph, centred                      |  14px ink-2
+-------------------------- hairline ---------------------------+
|  Bewertungen                                                   |  16px / 700
|  [avatar] Name                                                 |  14px / 600
|           27. August 2026                                      |  12px ink-2
|  * * * * *                                                     |  RatingStars five md
|  comment                                                       |  14px ink-2
|  ... up to 3                                                   |
|  [        Alle ansehen        ]                                |  outline pill, only if > 3
+---------------------------------------------------------------+
```

## Measured

Nothing. The sheet was never opened in the measured run. Source-declared values, for whoever measures it next:

| item | source value | line |
|---|---|---|
| container | `Sheet` primitive, `height="full"` | `:86` |
| header | `SheetHeader title={staff.name} onClose` | `:87` |
| avatar | `Avatar size={88}` | `:90` |
| name | `text-[19px] font-bold` Inter Tight | `:91` |
| specialty | `text-[14px] text-s-ink-2` | `:92` |
| rating | `RatingStars mode="compact" size="lg"` | `:94` |
| bio | `text-[14px] leading-relaxed text-s-ink-2` | `:97` |
| reviews heading | `text-[16px] font-bold` Inter Tight | `:102` |
| reviewer name | `text-[14px] font-semibold` | `:118` |
| review date | `text-[12px] text-s-ink-2` | `:119` |
| per-review stars | `RatingStars mode="five" size="md"` | `:123` |
| "Alle ansehen" | `rounded-full border border-s-border py-3 text-[14px] font-semibold` | `:134-138` |

## Tokens

Every class in the file is copied from the already-shipped `StaffProfilePage` hero and review-card blocks and from `StaffReviewsSheet`, by the file's own `mockup-ok` note (`:23-27`). No new size, colour or spacing is introduced here.

## Interaction

- Opens on "Profil ansehen" in a row, which calls `stopPropagation` first so the row's own selection never fires.
- **Selection only, by an explicit owner boundary.** The sheet renders no services, no "Buchen" link and no stylist-select CTA. B7 removed the whole profile path, the owner asked twice for it back, and B19 restored the read-only half only. `:29-37` records the reasoning in place: viewing a stylist mid-booking is fine, picking a different service from inside the flow would silently diverge from the cart.
- Reviews are fetched from `/api/staff/[id]/profile`, the endpoint `StaffProfilePage` already uses. Header content comes off the `staff` prop the picker already holds, so the header never waits on the network.
- Three reviews preview, then `StaffReviewsSheet` for the full sorted and filtered browse.

## Against the floors

Not gradeable. Nothing was rendered, and grading a floor against source-declared classes is exactly the confusion these files exist to avoid. Two things are checkable without rendering:

- **FLOORS LAW 9, composed from the registry: PASS.** `Sheet`, `SheetHeader`, `SheetBody`, `Avatar`, `RatingStars`, `Spinner` and `StaffReviewsSheet` are all imported, none re-implemented. This is the flow's cleanest example of composition.
- **Four hardcoded German strings** sit outside the translation layer in a file whose other copy goes through `useTranslations('booking.staffStep')`: "Bewertungen" (`:102`), "Noch keine Bewertungen." (`:107`), "Solen-Kund:in" as the anonymous-reviewer fallback (`:114`) and "Alle ansehen" (`:138`). In en, fr and it all four render German. A fifth locale defect sits beside them: the review date is formatted `locale === 'en' ? 'en-US' : 'de-DE'` (`:77-82`), so French and Italian get German date formatting. Read from source, not rendered, and not fixed here.

## Empty state

- **No reviews:** "Noch keine Bewertungen." at `text-[14px] italic text-s-ink-2` (`:107`). Italic body copy is not a treatment the design contract names anywhere else.
- **Loading:** a centred `Spinner size="sm"` (`:104`), not a skeleton. The locked states row asks for `<Skeleton>` whose shape matches the final layout, and a bare spinner is the thing it names as the wrong answer. Source, not rendered.
- **No bio, no specialty, no rating:** each is conditionally omitted, so a thin stylist degrades to an avatar, a name and an empty reviews block.

## Provenance

- B7, owner 2026-07-09 , no service picking from inside the booking flow
- B19, owner 2026-07-09, asked twice , the read-only profile restored, `StaffProfileSheet` rather than `StaffProfilePage`
