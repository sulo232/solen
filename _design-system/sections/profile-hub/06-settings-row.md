# Einstellungen row, the one unlabelled group

**Reference:** no screenshot. Measured live: `_measured/profile-hub.json`. **No band record of its own**, same reason as 03.
**Component:** `app/[locale]/_components/profile/AccountHub.tsx:213-219`
**Layer:** 1 chrome. Row anatomy is the shared block in `03-bookings-group.md`.

## Layout

```
                                                (no group label)
  [Settings]     Einstellungen                  15.5/500, no subline
                                          [>]
   RowCard className="mt-[26px]"
```

One row, `/{locale}/profile/settings`. This is the only group on the screen with **no
`GroupLabel`**: the `mt-[26px]` that a label would normally carry is moved onto the `RowCard`
itself, so the vertical rhythm matches the other three groups while the eyebrow count stays at
four.

## Measured (390x844, signed in)
- 1 of the 7 elements in the **15.5px / 500 / Inter Tight** label role
- No subline, so it contributes nothing to the 13px role
- No group label, so it contributes nothing to the 12px/600 role
- Nothing else. No card, no image, no shadow.

## Tokens
Identical to 03.

## Interaction
- Navigates to `/{locale}/profile/settings`, which owns "Solen Konto", language, notifications, privacy and account deletion.

## Intentional deviations
- The mockup's "Nachrichten" row is not wired. Customer messaging is off (owner 2026-06-13) and both routes that mention it are dead redirects back to this same page, so the row is left out (AccountHub.tsx:209-212).
- The subline was dropped: "Sprache, Mitteilungen, Datenschutz" only listed what settings contains (owner 2026-08-05, copy economy rule 1).

## Empty state
None. The row is static.

## Against the floors
- Contributes **0 elements** to the weight >= 600 count. It is the only band on the screen that adds nothing to the **33.33% FAIL**.
- Renders 1 of the seven distinct sizes (15.5), not uniquely.
- **15.5px off-scale**: see `03-bookings-group.md`.
- Imagery 0.
- **Against the ladder** (the benchmark ladder is `/de/salon/cuts-and-culture` measured 2026-08-27: anchor 30px over a 14px body, ratio 2.14x, 5 distinct sizes, 30% of visible text at weight >= 600, 3 elevation steps, 34.66% photographic. The owner chose "same ladder everywhere", so it is this screen's target too.) This band moves none of the six ladder numbers. It is the only band on the screen that does not.

## Provenance
- Owner 2026-08-02, grouped-row hub
- Owner 2026-06-13, customer messaging off
- Owner 2026-08-05, sublines that restate the label are dropped
