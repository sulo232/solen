# Customer-facing fix progress (live tracker)

Source: `CUSTOMER_FACING_AUDIT_2026-06-10.md`. Tick as we go. Commit refs in parens.
Started working the HIGH bucket 2026-06-10.

## ✅ Done
- [x] **P0 #1** booking timezone (`00a31644a`)
- [x] **P0 #4** gift-card email-before-pay + never-activated (`dcf7345c9`)
- [x] **P0 #2+#3** voucher 404 + dead confirm + never-finalized + dead email (`53d491ba0`, `a54a495bd`)
- [x] **MED #10** wrong-date slot fetch — folded into the timezone commit (`00a31644a`)
- [x] **Mockup gap #2** voucher success — solved inline (no separate route)
- [x] **Mockup gap #3** in-app live queue status — `/queue/[token]` tracker (earlier session)

## 🟠 HIGH
- [x] **#5** Dead notification Bell removed site-wide (`fdf99b183`)
- [x] **#6** `profile/stamps` guest redirect → canonical `/auth/login` (`fdf99b183`)
- [x] **#7** `profile/referral` guest dead-end → Anmelden CTA (`fdf99b183`)
- [x] **#8** RESOLVED via the de-dup below — walk-in-pay no longer shows a frozen status
  view; after payment it redirects to the single live `/queue/[token]` tracker (`068a4e5ca`).
- [ ] **#9** ⏸️ DECISION — fabricated "14 Salons in der Nähe" (`Nearby.tsx`). No real
  geolocation backend. Options: (a) remove the section, (b) wire to real proximity
  (feature), (c) empty/skeleton state. Visible homepage change → needs sign-off.

## 🟡 MEDIUM — open
- [x] **#11** walk-in undefined tokens — moot: queue is v2, walk-in-join now redirects (`49e5a8ec7`)
- [x] **#12** orphaned `walk-in-join` → redirects to home (`49e5a8ec7`)
- [ ] **#13** fake language switcher in MobileMenu (→ mockup gap #5 language picker)
- [ ] **#14** always-on/never-shown buy rows (`hasGiftCards=true`, `hasPackages=false`)
- [x] **#15** wallet tile copy → "Geschenkkarten" (honest; 4 locales) (`49e5a8ec7`)
- [ ] **#16** Recently-Viewed invented addresses/prices/availability — LEAVE (fabricated-data, per #9 owner call)
- [x] **#17** Recently-Viewed links → valid locale-prefixed /search (`49e5a8ec7`)

## ⚪ LOW
- [x] #18 referral shareUrl → /{locale} (`49e5a8ec7`)
- [ ] #19 duplicate Footer nav (`/partner` ×2)
- [x] #20 SalonHero share → clipboard fallback (`0a4eb6d74`)
- [x] #21 breadcrumb href gated to real category routes, else /search (`0a4eb6d74`)
- [x] #22 register "Anmelden" → locale-prefixed Link (`49e5a8ec7`)
- [ ] #23 waitlist drops multi-service
- [x] #24 cancel button literal "…" — moot: old text-link cancel replaced by the red ✕ icon (`5c7675c68`)
- [x] #25 dead `SearchResults.tsx` deleted (`49e5a8ec7`)

## 🎨 Mockup gaps — need a new screen (pause for mockup)
- [ ] #1 account hub for 5 orphaned pages
- [ ] #4 notifications panel (or just keep the bell gated from #5)
- [ ] #5 language picker sheet
- [ ] #6 walk-in error states
- [ ] #7 money-moving self-cancel confirm sheet
- [ ] #8 empty-service-list state
- [ ] #9 recently-viewed destination

## 🔁 DUPLICATION — RESOLVED (`068a4e5ca`, 2026-06-10)
queue/[token] is now the SINGLE "in queue" surface. walk-in-pay is payment-only and
redirects there on payment success; its old frozen in-queue view + ALL QR were deleted
(−269 lines). No QR anywhere in walk-in (QR still fine for stamps/loyalty). Stripe test-card
e2e still owner-verifiable. Original (stale) finding below for history:

## 🔁 DUPLICATION flagged (2026-06-10, owner caught it)
The walk-in "you're in the queue" screen exists TWICE, two designs:
- `app/[locale]/walk-in-pay/page.tsx` **paid state** — static (set-once), big DEINE NUMMER,
  dot stepper (Bezahlt/Warten/Bald/Stuhl), QR (salon-scan), receipt. Its status is FROZEN
  = audit #8.
- `app/[locale]/queue/[token]/page.tsx` — v2 LIVE tracker (rebuilt this session), icon
  stepper (Bezahlt/In der Schlange/Fast dran/Dran), while-you-wait, tip-on-done. Polls.
- Overlap: number, position, stepper, barber, salon, cancel — rendered in both.
- Unique to walk-in-pay: the payment step + the scannable QR. Unique to queue: live polling.
- The uncommitted "Live-Status ansehen" tile (walk-in-pay) is a band-aid over this; its
  fate depends on the consolidation decision below. NOT committed.
- DECISION PENDING: consolidate. Recommended (A): queue/[token] = the single "in queue"
  surface; walk-in-pay → pay + slim paid confirmation (number + QR + receipt) that links to
  the tracker; drop walk-in-pay's frozen stepper+pill (fixes #8). Needs the QR ported to
  queue/[token]. Mockup + sign-off required.

## 🏗️ Walk-in operator gap (option A — not picked)
- [ ] owner control: enable / pause / pay-mode (backend exists, no UI)
- [ ] busy dot: `max_walkin_queue` column never added
- [ ] daily ticket reset
