# Wallet group, saved card + vouchers

**Reference:** no screenshot. Measured live: `_measured/profile-hub.json`. **No band record of its own**, same reason as 03: a `<p>` label over a plain `<div>`. Its roles are inside the `main` band.
**Component:** `app/[locale]/_components/profile/AccountHub.tsx:167-172`
**Layer:** 1 chrome. Row anatomy is the shared block in `03-bookings-group.md`.

## Layout

```
  Wallet                                        12/600 s-ink-2
  [Wallet icon]  Wallet                         15.5/500
                 Endet auf 4242                 13/400   or  the empty subline
                                          [>]
  [Ticket icon]  Gutscheine                     15.5/500
                 Keine aktiven Gutscheine       13/400
                                          [>]
```

Two rows: `/{locale}/profile/settings/payment` and `/{locale}/profile/vouchers`. Icons
`Wallet` and `TicketPercent`, 22px, ink.

## Measured (390x844, signed in)
Per-row geometry is **not measured**. Contributions to the screen's measured roles:
- 2 of the 7 elements in the **15.5px / 500 / Inter Tight** label role
- 2 of the 5 elements in the **13px / 400 / `rgb(107, 107, 107)`** subline role
- 1 of the 4 elements in the **12px / 600 / `rgb(107, 107, 107)`** group-label role
- No card record, no image, no shadow

## Tokens
Identical to 03. No accent, no semantic colour. The wallet subline carries no brand mark and no masked digits.

## Interaction
- Both rows navigate. Nothing is editable in place.

## Intentional deviations
- The saved-card subline reads `"{payEndsIn} {last4}"`, the exact phrase `PaymentMethods.tsx` already uses on the full list, not the mockup's `"Visa oo4242"` middot mask. The mask is a decorative separator, banned by taste rule 2, and the real phrase already existed (AccountHub.tsx header comment, deviation 4).
- Wallet data comes from a direct server-side Stripe `paymentMethods.list` call rather than an internal HTTP round trip, and is skipped entirely when `profiles.stripe_customer_id` is null (`profile/page.tsx:108-116`).

## Empty state
Both rows persist and swap their subline: `walletRowEmptySub` when no card is saved, one card
renders `payEndsIn + last4`, more than one renders `walletCardsCount`; `couponsRowEmptySub` when
the active voucher count is 0 (AccountHub.tsx:116-126). No fabricated count is ever shown.

## Against the floors
- Contributes **1 element** (the group label) to the **33.33% weight >= 600 FAIL**.
- Renders 3 of the seven distinct sizes (15.5, 13, 12), none of them uniquely.
- **15.5px off-scale**: see the full record in `03-bookings-group.md`.
- Imagery 0, and this group has no image slot. A card brand mark would be one; none is rendered.
- **Against the ladder** (the benchmark ladder is `/de/salon/cuts-and-culture` measured 2026-08-27: anchor 30px over a 14px body, ratio 2.14x, 5 distinct sizes, 30% of visible text at weight >= 600, 3 elevation steps, 34.66% photographic. The owner chose "same ladder everywhere", so it is this screen's target too.) This group adds 2 rows at the shared anatomy and 1 bold element, and moves no other ladder row: no new tier, no elevation step, no photographic area. A card-brand mark on the Wallet subline would be the one thing here that could add image area, and none is rendered.

## Provenance
- Owner 2026-08-02, grouped-row hub
- Taste rule 2, decorative separators banned, killed the middot mask
