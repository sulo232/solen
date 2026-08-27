# Zero state, one line and one ink pill

**Reference:** none. **Not in this capture**: the page was still loading, so this band never
rendered and it is unknown whether the account has zero saves. Every number below is a source
literal read on 2026-08-27.
**Component:** `app/[locale]/inspo/saved/page.tsx:86-96`, hand-written inline in the page file.
**Layer:** 1 chrome plus the one commit action.

## Layout

```
  68  (header row above)
  84  Tippe bei einem Look auf das Herz, um ihn      14/400 s-ink-2, max-w-xs
      hier zu speichern.
      (mt-5, 20px)
      +----------+
      |  Inspo   |                                   h-11 pill, bg-s-ink, 15/700 white
      +----------+
```

`mt-4 px-4`, left aligned, top aligned. The block sits directly under the header row and everything
below it is empty page.

## Measured

**Not measured.** Source literals, verified for this file:

| element | literal | line |
|---|---|---|
| wrapper | `mt-4 px-4` | 86 |
| line | `max-w-xs text-[14px] leading-relaxed text-s-ink-2` | 87 |
| copy | "Tippe bei einem Look auf das Herz, um ihn hier zu speichern." | 88 |
| button | `mt-5 inline-flex h-11 items-center rounded-full bg-s-ink px-6 font-heading text-[15px] font-bold text-white transition-transform duration-150 active:scale-[0.98]` | 92 |
| button copy | "Inspo" | 94 |

## Tokens

- Line `s-ink-2` `#6B6B6B` at 14px, which is 5.33:1 on white, AA
- Button `bg-s-ink`, the one commit action on the screen, which is the locked treatment for a
  primary CTA
- Button height `h-11`, 44px, clearing the touch-target floor that the screen's own back tile misses

## Interaction

- Button: `router.push('/{locale}/inspo')`, the same destination as the back tile, so the empty
  screen offers two controls that do the same thing.

## Intentional deviations

- **It is hand-drawn, and the registry owns two components for this job.** `EmptyState` is the
  locked primitive and `EmptyStateDiscovery` is the registered richer one whose registry row names
  "profile list empties (favorites/stamps/looks)" as its use case. This screen uses neither; it
  writes a paragraph and a button in the page file. That is FLOORS LAW 9 in its exact form: hand-
  drawn UI in a page file for a thing the registry owns. Its sibling saved screen composes
  `EmptyStateDiscovery` for the identical job, which makes it FLOORS LAW 8 as well.
- **The copy is informal.** "Tippe" is the du form; `COPY_LAW.md` sets formal `Sie` for German and
  `EmptyStateDiscovery` on the sibling screen says "Tippen Sie auf das Herz". Two saved screens, two
  registers, one product.
- **The copy is hardcoded German**, not a translation key, so the other three locales render German.
- **The whole block is a deliberate minimum.** The comment at lines 79 to 85 records why: this
  screen used to be a heading and one line of text with no control at all, so the only way out was
  the bottom bar. E1 on 2026-08-11 added the button, and the comment is explicit that no new copy
  and no new value was introduced.

## Empty state

This IS the empty state. It has no sub-states: the button always renders and its destination is
fixed.

## Against the floors

- **Empty-state anatomy: FAIL on three of the four parts.** The design contract asks for a PROMISE
  headline at 18/600, a GESTURE subline, a filled ink CTA and a 3D category icon or ghost preview,
  on the sunken tray inside a living page. This block has the subline and the CTA. It has **no
  headline at all**, no icon, no imagery and no tray. The screen's 22px title sits above it and is
  a page title rather than a promise.
- **Imagery: FAIL.** Zero photographic content, on the product's most photographic screen. FLOORS
  LAW 2 exempts forms, checkout, legal and receipts by name; an empty state is not on that list. The
  sibling's zero state carries a 220px real photo and a six-tile rail from live data, so the product
  already owns the pattern and the query that feeds it (`favorites/page.tsx:68-74` runs its
  top-rated query only when the list is empty).
- **Dead space: FAIL.** The floor asks an empty state to be one vertically centred unit with the
  message-to-CTA gap at 24px or less and less than 30% of the viewport trapped below the primary
  action. This block is top aligned at roughly y = 84 with a 20px gap, so on a 844 viewport more
  than 80% of the screen below the button is empty. The gap passes; the centring and the dead-space
  bound do not.
- **Touch target: PASS**, `h-11` is 44px.
- **Type: 15 and 14**, both on the locked scale, and both absent from the populated screen, which
  authors only 22 and 12. So the empty and populated states of one screen share no text size.

## Provenance

- E1 2026-08-11, the empty state gained a way out; before that it had no control at all
- Owner 2026-06-23, boards ditched, which is why there is nothing to create here, only somewhere to
  go
- Design contract states row, the empty-state anatomy this block is graded against
- 12-app evidence behind that anatomy: `_design-system/research/TASTE_EMPTY_STATES.md`
