# Abmelden, the sign-out form

**Reference:** no screenshot. Measured live: `_measured/profile-hub.json`, band index 4 (a `<form>`, which is a landmark tag, so this one DID open its own band).
**Component:** `app/[locale]/_components/profile/AccountHub.tsx:221-229`
**Layer:** 1 chrome

## Layout

```
              [icon 17]  Abmelden               15.5/500 Inter, s-error red
                         centred, mt-30
```

A real `<form action="/api/auth/logout" method="post">`, so it works with client JS off. Same
pattern as the sign-out row on `/profile/settings`.

## Measured (390x844, signed in, band index 4)
- Band box: **top 892, left 20, width 350, height 26**
- Surface: `background rgba(0, 0, 0, 0)`, `padding 0px`, `border-radius 0px`
- One text role: **15.5px / weight 500 / Inter / `rgb(220, 38, 38)`**, line-height 23.25, letter-spacing `normal`, count 1, sample `"Abmelden"`
- `imagery.imageCount` 0, `cards` empty

Two measured facts worth keeping separate from the label role in files 03 to 06, because they read
as the same size and are not the same role:
1. **Family differs.** The row labels are Inter Tight (`font-heading`); this button has no `font-heading` class, so it renders **Inter** at the same 15.5px.
2. **Letter-spacing differs.** Row labels carry `tracking-[-0.01em]`, measured -0.155px. This one measures `normal`.

- **Position: top 892 on an 844-tall viewport.** The sign-out sits below the first viewport, and also below the bottom tab bar, whose band is measured at top 774 to 832. Reaching it requires a scroll on a document measured at `documentHeight` 1038.

## Tokens
- `text-[15.5px] font-medium text-s-error`, `#DC2626`
- Icon `LogOut size={17} strokeWidth={1.9}`, inheriting the same red
- `active:opacity-60` press feedback, no fill, no border, no card

## Interaction
- Submits a POST to `/api/auth/logout`. No confirmation step.

## Intentional deviations
- Sign-out is a text link, not a bordered destructive button. It is the only red on the screen, so the colour carries the whole signal.
- The size was moved from 15px to 15.5px deliberately, to match the row label and hold the four-size type budget (AccountHub.tsx:224 inline comment). That trade bought one fewer distinct size and paid for it with a second element on an off-scale value.

## Empty state
None.

## Against the floors
- **17px icon**: `LogOut size={17}` is not one of the row glyph sizes (22) or the chevron (18), so the screen renders three distinct icon sizes. There is no icon-size floor in the FLOORS LAW block; recorded because it is measurable and it is drift from the same-thing-looks-the-same rule (FLOORS LAW 8).
- **15.5px off-scale**, this band's 1 element on top of the row labels' 7. Full record in `03-bookings-group.md`.
- Contributes **0 elements** to the weight >= 600 count.
- **`#DC2626` on white measures 4.83:1** (CLAUDE.md taste rule 4 contrast table), which clears WCAG AA for normal text on this band's white background. It is 4.39:1 on `s-bg-sunken`, which would not clear AA; this band does not sit on sunken.
- Imagery 0.
- **Against the ladder** (the benchmark ladder is `/de/salon/cuts-and-culture` measured 2026-08-27: anchor 30px over a 14px body, ratio 2.14x, 5 distinct sizes, 30% of visible text at weight >= 600, 3 elevation steps, 34.66% photographic. The owner chose "same ladder everywhere", so it is this screen's target too.) One element at an off-scale size, 0 bold, no tier of its own, no elevation, no image. The one ladder row it does touch is placement: the ladder screen reaches its commit action through a sticky bar (`SalonMobileBookBar`), and this screen's only action sits at y 892 on an 844-tall viewport, below the fold and below the fixed tab bar. Sign-out is a deliberately cold action, so being hard to reach is arguably correct here; it is still the one place the two screens disagree about where an action lives.

## Provenance
- Owner 2026-08-02, grouped-row hub; sign-out pattern lifted from `/profile/settings/page.tsx`
