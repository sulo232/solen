# Walk-in — what the salon dashboard must expose

The customer-facing walk-in flow is built. Several behaviours can't be guessed — they
need per-salon settings the **dashboard** must let owners configure. Until these exist,
the customer side falls back to safe defaults (noted per item).

## 1. Max walk-ins / queue capacity  ← drives the status dot colour
- **Field:** `max_walkin_queue` (int, nullable) on `salons`.
- **Why:** the status dot should go **green → orange when busy**, but "busy" is per-salon.
  A 1-chair barber is full at 3 ahead; a 6-chair shop isn't busy until ~15.
- **Logic (already wired in the panel):** `ahead >= max_walkin_queue` → orange "Stark gefragt".
  `null` (unset) → always green (no cap). So nothing turns orange until a salon sets a number.
- **Default:** null (green).

## 2. Accepting walk-ins right now
- **Field:** `accepts_walkins` (bool) + optionally separate walk-in hours, OR derive from
  `opening_hours` + an "accepting now" manual toggle (barber can pause the queue).
- **Why:** don't let a customer pay-to-join when the shop is closed / has paused walk-ins.
- **Default today:** treated as open (the panel shows "Walk-ins offen"). Needs the real guard.

## 3. Cancellation policy  (ties to tasks #16 / #17)
- **Fields:** `walkin_cancel_free_minutes` (int) and/or `walkin_cancel_fee` (amount).
- **Why:** drives whether a cancel fully releases the hold or charges a fee.
- **Default today:** cancel-while-waiting always releases the full hold (no fee).

## 4. No-show policy
- **Field:** `walkin_no_show_charge` (bool / amount).
- **Why:** the `queue/[id]` PATCH leaves the hold on `no_show` (intentionally) so policy decides
  whether to capture (charge the no-show) or release. Needs the dashboard switch.
- **Default today:** hold left untouched (auto-expires ~7 days = effectively released).

## 5. Service-time seed (optional, quality)
- **Field:** `avg_service_minutes` override per salon (or per service).
- **Why:** the ETA uses an EWMA of recent completed visits; before there are 3+, it falls back
  to a flat 30 min. An owner-set seed gives a better first-day estimate.

## Salon-side queue management (dashboard owns this)
- Live queue list with **call / now-serving / done / no-show** controls → these call
  `PATCH /api/walkin/queue/[id]` (already built: `completed` captures payment, `cancelled`
  releases the hold). The dashboard just needs the buttons + the live list.

## Nice-to-have / open
- SMS "you're up" — needs phone capture on join + a sender (Twilio etc.).
- Per-barber walk-in capacity (preferred-barber queues).
- Max-wait cap — stop accepting new walk-ins once wait > X min.
