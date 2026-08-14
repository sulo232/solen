<!-- exists-check: net-new vs FilterSheet.md (search filter sheet, not a checkout) + DashboardUI.md (console primitives, no checkout surface). `npm run exists checkout` -> only the endpoint + the home's inline panel existed; this documents the shared sheet that replaces that inline panel. -->

# CheckoutSheet, in-person POS for a booking

**File:** `app/[locale]/_components/dashboard/CheckoutSheet.tsx`
**Layer:** 1 (chrome) + 3 (inline `s-error` on failure)
**Provenance:** Full-POS build (2026-06-24), extends the existing booking checkout (`POST /api/bookings/[id]/checkout`, already paid + tip) into a sheet that also sells RETAIL line items, and surfaces it off the calendar appointment ("tap appointment -> kassieren"). Replaces the home's old inline cash-checkout panel so there is ONE checkout UI across home + calendar.

## Purpose

The single dashboard checkout surface. Shows the booking's service (read-only), an optional retail picker (qty steppers, rendered ONLY when the salon has sellable products), a tip input, and a live total. The ink commit button POSTs `{ tip, retail_items }` to `/api/bookings/[id]/checkout`; the server looks every product price up (never trusts a client price), folds the retail total into `paid_amount`, writes one `retail_sales` row per item WITH `booking_id`, decrements stock, and records the tip in `tips`.

## API

```
<CheckoutSheet
  bookingId         // required, booking being settled
  salonId           // required, drives the retail-product lookup
  serviceName?      // display; sheet resolves from the booking GET if omitted
  customerName?     // display; sheet resolves from the booking GET if omitted
  servicePriceChf?  // service price in CHF; if omitted the sheet fetches the booking
  onClose           // dismiss without settling
  onDone            // called after a successful POST (caller closes + refreshes)
/>
```

## Money convention (critical)

- `nail_retail_products.price` is integer **Rappen** (validation `nailRetailProductSchema`; the manager `* 100` on input, `/ 100` on display). The sheet divides by 100 for the CHF retail display.
- Service price + tip are **CHF**. The total shown is CHF and equals what the server charges: `paid_amount = toRappen(serviceCHF) + retailRappen` (tip is a separate `tips` row, not part of `paid_amount`).

## Do / Don't

- **Do** use this as the ONE dashboard checkout (home next-up "Kassieren" + calendar tap-appointment). **Don't** rebuild a per-surface checkout panel.
- **Do** render the retail picker only when `products.length > 0` (service + tip only otherwise). **Don't** show an empty picker.
- **Don't** send a price from the client, the server is the source of truth.
- **Don't** add category branches; the picker reads the salon's products regardless of category (V3-D205).

## Related

- [[COMPONENT_REGISTRY]], Dashboard section
- `app/api/bookings/[id]/checkout/route.ts` (the endpoint this commits to)
- `app/api/salon/retail/route.ts` (retail-product list)
- LOCKFILE §1 (tokens), §3 (radius/shadow), §6 (copy)
