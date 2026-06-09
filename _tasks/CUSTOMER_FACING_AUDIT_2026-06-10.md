# Customer-Facing Audit + Findings , 2026-06-10

**How this was made.** 8 read-only subagents fanned across every customer surface (home/search, salon PDP,
booking flow, walk-in, account, auth+commerce, global chrome/states), spot-verified against live code + the
running dev server. 65 raw findings → **13 restraint fixes (APPLIED this pass)** + **25 functional bugs (reported
here, not yet fixed)** + **9 gaps needing a new screen/mockup**. Look-redo direction lives in `RESTRAINT_TEST.md`
(llm-council). Severity: 12 high · 14 medium · 22 low.

**Locked design rule (CANON §0):** clickability = AFFORDANCE not colour; blue = small clickable bits only
(links / small buttons / review counts); ink = structure + secondary; surfaces white + cool grey #F4F4F5;
green = availability + success (normal #16A34A); no fabricated data; no decorative dots.

---

## 🔴 P0 , fix first (data corruption / money / dead terminal steps)

1. **Every booking is stored 1-2h WRONG (timezone).** `components-legacy/booking/PayConfirmStep.tsx:150-151` builds
   `starts_at = new Date(\`${'$'}{dateStr}T${'$'}{selectedTime}:00Z\`)`. The slot is local CH "HH:MM" but the `Z`
   forces UTC, so 14:00 CH is stored as 14:00 UTC = **16:00 CH**. Near midnight the **date rolls**. The confirmation
   screen, the .ics calendar file, AND the salon's schedule are all wrong for **every** booking. (Companion:
   `DateTimeStep.tsx:89` derives the slot-fetch date with `toISOString().split('T')[0]` , also UTC-shifted , even
   though a tz-safe `ymd()` helper exists in the same file. Fixes are separate: the write + the fetch.)
   **Fix:** build the Date from local parts (or the existing `ymd()` helper), drop the `Z`.
2. **Every paid voucher purchase dead-ends on a 404.** `app/[locale]/vouchers/page.tsx:56` + `vouchers/buy/page.tsx:54`
   set Stripe `return_url` to `/{locale}/vouchers/success`, but **no `vouchers/success` route exists**. After a
   successful charge Stripe redirects the customer to Not Found. (See mockup #2.)
3. **Voucher confirm never runs (success path is dead code).** `vouchers/page.tsx:46-64` calls `stripe.confirmPayment`
   WITHOUT `redirect:'if_required'`, so on success Stripe always does a full-page redirect and the `onSuccess`
   callback never fires , `handlePaymentSuccess` (which POSTs `/api/vouchers/confirm` to finalize the voucher) is
   dead. Gift-card + packages forms correctly use `redirect:'if_required'`. **Fix:** add `redirect:'if_required'`.
4. **Gift-card recipient emailed BEFORE payment.** `app/api/gift-cards/purchase/route.ts:77-93` sends the "Du hast eine
   Geschenkkarte erhalten" email immediately after the PaymentIntent is *created* (card row `is_active:false`,
   activated only by the webhook). If the buyer abandons at Stripe, the recipient still gets an email with a
   redeemable-looking code for a card that was never paid for. **Fix:** send from the webhook on payment success.

## 🟠 HIGH

5. **Dead notification Bell, site-wide.** `_components/layout/Header.tsx:691-707` , the mobile Bell renders on every
   non-category route with an empty `// TODO: open notifications panel` onClick. Dead control for every customer.
   (See mockup #4.)
6. **profile/stamps → 404 for guests.** `profile/stamps/page.tsx:77` redirects unauth users to `/{locale}/auth/sign-in`
   , that route doesn't exist (auth has login/register/reset-password/signup); every other profile page uses `/auth/login`.
7. **profile/referral guest dead-end.** `profile/referral/page.tsx:52-58` , `/api/referral` 401s for guests; on 401
   the page renders a bare "Bitte melde dich an…" with NO login link/button/redirect. User stranded.
8. **Walk-in "you're in the queue" pill is frozen.** `walk-in-pay/page.tsx:414-422` , the "X vor dir ~Y Min" status is
   set once and never re-polled in-app; the live view is a separate `/queue/[token]` page only reachable by scanning
   the QR on another device. The core promise ("we'll tell you when you're up") has no in-app live surface. (Mockup #3.)
9. **Fabricated "14 Salons in der Nähe".** `_components/homepage/Nearby.tsx:182` , hardcoded count + the whole Nearby
   section is invented demo data (fake salons/distances/next-slots), not wired to geolocation. **Violates your
   no-fabricated-data rule.** (See "Fabricated data" section.)

## 🟡 MEDIUM

10. **Wrong-date slot fetch.** `DateTimeStep.tsx:89` , `toISOString()` UTC-shift fetches slots for the previous day on
    CH evening times (the `?start=`-seeded path). Use the file's `ymd()` helper.
11. **Walk-in pages render broken (undefined tokens).** `walk-in-join/page.tsx:128,158,181,201` + `queue/[token]/page.tsx:226`
    use `s-ink-1` / `s-ink-4` / `s-ink-5` , these don't exist (only s-ink/-2/-3). Hairlines, card fills, info blocks,
    the Cancelled card all render transparent/missing , text floating on bare white.
12. **Orphaned `walk-in-join` route.** Nothing links to it (intentionally bypassed per a comment in SalonResultCard),
    but `/de/walk-in-join` still returns 200 , a stray/old link lands users on a dead-end, untranslated, token-broken screen.
13. **Fake language switcher.** `MobileMenu.tsx:322-328` , the "Sprache" row (Globe + label) has `href=/{locale}` (its
    own homepage). Tapping never changes language; the real switcher is the footer. (Mockup #5.)
14. **Always-on / never-shown buy rows.** `SalonSidebar.tsx:97-98` + `SalonBuy.tsx` , `hasGiftCards=true` (gift-card row
    on EVERY salon regardless), `hasPackages=false` (packages can never show even for salons that sell them).
15. **Wallet tile copy lies.** `profile/page.tsx:118` , the Wallet tile says "Geschenkkarten & Gutscheine" but links
    only to `/profile/gift-cards`; vouchers live at the separate, unlinked `/profile/vouchers`.
16. **Recently-Viewed renders fiction as fact.** `RecentlyViewed.tsx:50-60,95-101` , real salon name/slug but invented
    addresses, per-category prices (coiffeur 80/barber 50/nails 45/spa 95), and fake availability ("14:30, 15:00", "Heute 16:00").
17. **Recently-Viewed broken links.** `RecentlyViewed.tsx:162` , "Im Profil →" → `/profile/recently-viewed` (soft 404);
    "Alle entdecken" → `/search?sort=top-rated` (invalid sort, silently dropped); both omit the `/{locale}` prefix. (Mockup #9.)

## ⚪ LOW

18. `profile/referral/page.tsx:28-30` , `shareUrl` hardcoded to `/de`; en/fr/it users share a link forcing recipients into German.
19. `Footer.tsx:36,38` , "Für Salons" + "Partner werden" both link to the same `/partner` (duplicate filler nav).
20. `SalonHero.tsx:104-109` , mobile Share calls `navigator.share()` with no clipboard fallback (silent dead click on unsupported browsers); the other two share buttons fall back correctly.
21. `SalonBreadcrumb.tsx:26-31` , `catLabel` only maps 4 categories; massage/wellness/new cats fall through to `capitalize(slug)` + link to a maybe-nonexistent route.
22. `auth/register/page.tsx:195` , "Anmelden" link is a bare `<a href="/auth/login">` (no locale prefix; full reload on non-default locales).
23. `DateTimeStep.tsx:244-253` , WaitlistModal gets only `services[0]`; a multi-service cart joins the waitlist for one service, the rest dropped silently.
24. `queue/[token]/page.tsx:240` , cancel button label becomes literal "…" with no spinner/localized word.
25. `_components/search/SearchResults.tsx` , dead code (no import sites; `/search` uses SearchTemplate). Stale emerald/cream comments. Maintenance trap , delete.

---

## ✅ Restraint fixes APPLIED this pass (the roll)

13 locked-rule fixes applied via subagents: Entdecken demo-card gradients → neutral; EmptyState green-halo+blue-icon →
cool/ink + drop uppercase; EmptyStateFTU blue eyebrow → ink; ErrorFallback yellow icon → red; DateTimeStep
`selectedTone` accent → ink (selected date/slots fill ink, not blue); SearchOverlay blue day-card → ink; PayConfirmStep
blue deposit/prepay prices → ink; reset-password legacy sweep (green glow + warm shadow + glass dropped, mismatch
message → red); referral + gift-card warm shadow → neutral elevation; WaitlistModal blue chips → neutral;
booking/lookup decorative bullet dot removed.

---

## 🎨 Mockups needed (9 gaps , see the `public/_mockups/` set)

1. **Account hub for orphaned pages** , 5 fully-built account pages have NO nav entry anywhere (reachable only by URL):
   `/profile/vouchers`, `/profile/packages`, `/profile/intake-forms`, `/account/messages`, `/account/saved`. The only
   nav reference is in a dead file (`components-legacy/ProfilePage.tsx`). Needs a hub: Wallet → gift-cards + vouchers +
   packages, a Messages row, and a decision on `account/saved` (looks like it duplicates `profile/favorites` , consolidate).
2. **Voucher purchase success screen** , `vouchers/success/page.tsx` (doesn't exist; every paid voucher 404s). SuccessMark
   + voucher code + add-to-wallet / back-to-profile, reading `?payment_intent` , mirror the gift-card SuccessMark pattern.
3. **In-app live queue status** on the paid walk-in screen , a primary "Live-Status ansehen" link to `/queue/{token}` OR
   an inline self-polling live pill.
4. **Notifications panel** (or gate the Bell) , real panel/route + data source, or extend the hide-gate until it exists.
5. **Language picker** behind the Sprache row , a DE/EN/FR/IT sheet that swaps the locale segment.
6. **Walk-in error states** , a "Ticket nicht gefunden" state for the tip deep-link (currently opens a tip form on a
   generic fallback recipient for invalid/expired tokens), + a non-destructive inline AlertBanner for the walk-in-pay 409
   "pay at counter" case (currently swaps the whole page to a full-screen error, discarding the booking summary).
7. **Money-moving self-cancel confirm sheet** , `queue/[token]` self-cancel (triggers refund/hold-release) is gated only
   by native `window.confirm` , needs an in-app sheet stating the refund terms, matching the walk-in-pay cancel pattern.
8. **Empty-service-list state** for the booking flow , a salon with zero active services renders an empty body + disabled
   Weiter + CHF 0 with no explanation. Needs an empty state + a route guard.
9. **recently-viewed destination** , product decision: build `/profile/recently-viewed` (+ empty state) or repoint the link.

**Plus the council-driven redesigns (RESTRAINT_TEST.md):** PDP full-bleed hero (photo as the page top, not a thumbnail
widget), the date/time picker with a per-day density bar (busy-ness in ink, no colour), confirmation-as-a-moment (big
animated SuccessMark + 4-line when/where/who/what), reviews-distribution (star histogram + most-mentioned phrases),
service grouping (Express/Classic/Signature), stylist cards surfaced on the PDP.

---

## ⚠️ Fabricated data (your standing rule , flagged, not auto-changed)

These render invented values as fact to customers (you've flagged this repeatedly): Nearby "14 Salons" + invented
salons/distances/slots (`Nearby.tsx`), Recently-Viewed/"Top auf Solen" invented addresses + prices + availability
(`RecentlyViewed.tsx`). Recommend wiring to a real proximity/recent source or omitting the fabricated fields + flagging
the element, never shipping fake values. (Listed as bugs #9, #16 above.)

---

## Recommended fix order
P0 (1-4) immediately , they corrupt bookings + dead-end paid flows + email unpaid codes. Then HIGH (5-9), then the
mockup gaps (each needs a design pass), then MEDIUM/LOW as a sweep. The restraint fixes are already in.
