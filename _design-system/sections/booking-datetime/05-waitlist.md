<!-- exists-check: extends _design-system/sections/booking-datetime/CORPUS.md section 4 (the recovery
     row) and _design-system/sections/booking-staff/CORPUS.md Solen-gap item 1, which names this
     exact block as the fully-booked dead end. `npm run exists "date time step"` returns
     DateTimeStep.tsx; WaitlistModal.tsx already exists and is composed, not rebuilt. -->

# Waitlist recovery (quiet link, or the full card) , section spec

**Reference:** `_design-system/sections/_measured/booking-datetime.json`, `bandAnatomy.waitlistLink`, with the caveat below · `booking-staff/CORPUS.md` Solen-gap item 1
**Component:** `components-legacy/booking/DateTimeStep.tsx:229-259`, opening `components-legacy/booking/WaitlistModal.tsx`
**Layer:** 1 (chrome). Neither variant uses the accent.

## Layout

Two mutually exclusive shapes, chosen by whether the picked day has any free slot.

```
NORMAL DAY, one quiet centred line:

        Kein passender Termin? Auf die Warteliste          13.5 / 600 ink-2


FULLY BOOKED DAY, the full card takes the answer position:

  +-----------------------------------------------------+  radius 16, hairline
  |  <title>                                            |  15 / 700
  |  <body copy>                                        |  13 / 400 ink-2
  |  [            Auf die Warteliste            ]       |  full-width ink pill
  +-----------------------------------------------------+
```

## Measured

| item | value |
|---|---|
| link text | "Kein passender Termin? Auf die Warteliste" |
| link type | 13.5px / 600 / Inter / `rgb(107, 107, 107)` / line-height 20.25 / count 1 |
| link box | [63, 529, 277, 20] |

**One caveat, and it is a real one.** That rect is the **landing state** position, before a date is picked. It appears twice in the JSON, once under `bandAnatomy.waitlistLink` and once under `landingStateBeforeADateIsPicked.waitlistLink`, with identical numbers, and geometry rules out both being right: in the populated state the slot card occupies y 338 to 675, so a link at y 529 would be inside it. **The populated-state position of this link was not measured.** From source it sits `mt-5` below the card, which puts it near y 695, but that is arithmetic, not a measurement, and it is recorded here as such. Its width, height and type are unaffected: the same element in both states.

The centring is measured: x 63 with width 277 gives a centre of 201.5, exactly half of 402.

**The full card was not measured at all.** This run's day had 18 free slots, so the card never mounted. Its source-declared sizes, 15px for the title and 13px for the body, are the two sizes `CORPUS.md` section 9 item 4 listed in the step's font-size census that do not appear in the rendered set. That is the explanation for the discrepancy: the corpus counted the fully-booked variant, which does not render on a normal day.

## Tokens

- Link: `font-body text-[13.5px] font-semibold text-s-ink-2`, hover to `text-s-ink`, inside `<p className="mt-5 text-center">`
- Card: `mt-5 rounded-2xl border border-s-border bg-[--raised] p-4`
- Card title: `font-heading text-[15px] font-bold text-s-ink`
- Card body: `text-[13px] leading-snug text-s-ink-2`
- Card CTA: `w-full rounded-btn bg-s-ink py-3 font-heading text-sm font-semibold text-white`
- Error line, shared with the rest of the step: `mt-4 text-center text-sm text-s-error`

## Interaction

- **Logged out:** the tap does not open anything. It pushes `/{locale}/auth/login?redirect={pathname}` (`:49-52`).
- **No date picked:** the tap sets the inline error `tDate('selectDate')` instead of opening the modal. This is a named dead-click fix, owner 2026-06-12: without it the button silently did nothing, because the modal needs a day.
- **Otherwise:** `WaitlistModal` opens with the salon, the salon name, the first cart service, the picked date and the selected stylist.
- The variant switch is `formData.selectedDate && !isLoadingSlots && slots.filter(available).length === 0 && !slotsError` (`:233`). All four clauses, so a loading day and an errored day both keep the quiet link.

## Against the floors

- **Touch target (>= 44px): FAIL.** The quiet link measures 20px tall with no padding around it, 24px under the floor. It is a bare `<button>` inside a centred paragraph.
- **One primary per screen: PASS, and this is the reason the variant switch exists.** The card carries an ink CTA, which would be a second commit-weight control beside `Weiter`. It only appears when the day is fully booked, at which point it IS the answer and `Weiter` cannot fire anyway. Owner 2026-06-12: the old always-on ink card competed with `Weiter`.
- **Locked radius: PASS.** `rounded-2xl` is 16, the card literal.
- **Dead affordance: PASS, by a dated fix.** Both no-date and logged-out paths now do something visible instead of nothing.
- **Sparse blue: PASS.** A text link that is deliberately ink-2 rather than accent, because it is a fallback and not the path the screen wants.
- **The fully-booked dead end (`booking-staff/CORPUS.md` gap item 1): still open.** Fresha offers three exits at this moment and the missing one is "check all professionals", which undoes the stylist choice. Solen offers the waitlist and nothing else. The stylist pill in `02` is one tap away and does exactly that job, but it is at the top of the screen and is not offered here, where the user is stuck. Recorded, not fixed.

## Intentional deviations

- **The recovery is a whisper by default.** Grey, small, centred, semibold. The corpus's recovery rows are usually a bordered row or a link; nothing in the corpus makes it loud on a normal day either.
- **`bg-[--raised]` rather than a token class**, on the card and on the bottom bar of this same file, where the sibling steps use `bg-white`. Measured consequence, in `06`: this step's bottom bar renders at 95% white while the staff step's renders opaque.

## Empty state

This block IS the empty state of `04`. It has no empty state of its own. It renders in every condition, in one of its two shapes.

## Provenance

- Owner 2026-06-12 , the two-shape restructure: full card only when the day is genuinely empty, one quiet line otherwise
- Owner 2026-06-12 , the dead-click fix: no date means an inline error, not silence
