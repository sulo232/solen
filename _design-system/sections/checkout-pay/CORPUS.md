<!-- exists-check: net-new vs _design-system/RESEARCH_METHOD.md, _design-system/sections/salon-detail/*.md,
     _design-system/sections/confirmation/CORPUS.md and _design-system/sections/saved/CORPUS.md.
     RESEARCH_METHOD.md is the closest neighbour and is complementary: it states HOW research is
     conducted and tiered (R1 lenses, R2 claim tiers, R3 "could not verify" is a result, R5 debunk
     unsourced numbers); this file is one APPLICATION of that method to one screen archetype. The
     salon-detail specs are per-section component specs for an already-built screen, not corpus
     research. confirmation/CORPUS.md is the POST-commit screen and explicitly excluded 9 pre-commit
     checkout screens (Fresha x4, Airbnb x5) from its count as "a different job"; this file owns that
     pre-commit surface, so the two are adjacent and non-overlapping by the sibling's own boundary.
     saved/CORPUS.md is a different archetype entirely. Grepped lib/salon-detail.ts,
     _inventory/SURFACE.md, _tasks/rebuild-specs/salon-detail.md and docs/roadmaps/03-salon-detail-page.md:
     all salon-detail, none is checkout. No checkout corpus exists in this estate. -->

# Checkout / payment , screen-archetype corpus

**Screen:** the surface where a customer reviews what they are buying, chooses how to pay, and commits.
**Solen surfaces this maps to:** `app/[locale]/walk-in-pay/page.tsx` (live) and the Bezahlen step of `app/[locale]/salon/[slug]/booking/page.tsx`.
**Method:** Mobbin sweep, 16 searches (11 iOS, 5 web), `mode: deep`, varied phrasing, several naming specific apps, `exclude_screen_ids` used to reach past repeats. Every returned image was opened and read. Nothing here is described from brand memory; where I could not see a thing, this file says so.
**Layer:** research input. Not a component spec. Governs no literal; LOCKFILE still wins.
**Workstream:** `_plans/SCREEN_RESEARCH.md` A7. **Date:** 2026-07-29

---

## 0. Sample

The 16 searches returned **201 result slots**, of which **194 were unique screens across 105 unique apps**. Seven were repeats across searches (Instacart, Vestiaire Collective, Shop, Kiwi.com, Fresha, Alan, WHOOP each surfaced twice).

Not all 194 are checkout screens. I coded the corpus by hand:

| bucket | screens | note |
|---|---|---|
| **Checkout compositions coded for anatomy** | **86** | 52 iOS + 34 web. Qualifies when enough of the surface is in frame to read its top-to-bottom order. |
| Payment-method pickers (sheets, modals) | ~25 | Counted apart, because they are a component and not a screen. |
| Processing / success / error states | 14 | Used only in the motion section. |
| Adjacent screens the searches surfaced | remainder | Carts, appointment-detail and confirmation screens, plus 10 Stripe **dashboard** screens. Only 2 of the 12 Stripe results were the real hosted checkout; the rest were merchant configuration UI. |

Of the 86 coded screens, **34 are booking-domain** (appointment, reservation, travel, service booking) rather than retail. Solen is a booking product, so most verdicts weight to that 34, and every count below names whether it was counted over the 52 iOS, the 86, or the 34.

Percentages are not used; the raw fraction is.

**This is a curated sample, not a census.** Mobbin returns at most 30 screens per call and its library is editorially selected. Two apps the owner named, **Booksy** and **Treatwell**, returned **zero** screens across searches that named them directly. **SimplyBook.me, Vagaro, StyleSeat, Squire, Mindbody, Calendly and OpenTable** also returned nothing. (This independently reproduces the R3 case already recorded in `RESEARCH_METHOD.md`: Booksy and Treatwell are not in Mobbin. Their checkout anatomy is therefore **uncharacterised, not inferred**.) **Fresha, Airbnb, Resy, Uber, Revolut and Stripe did return**, and Fresha returned on both iOS and web, which matters more than the misses because Fresha is the structural source of truth for this estate.

---

## 1. Dominant anatomy

The dominant mobile order, over the **52 iOS checkout compositions**:

```
1  Title bar            "Checkout" / "Review and confirm" / "Confirm and pay"   (back left, X right)
2  WHAT you are buying  entity card or item rows          (photo/avatar in booking apps)
3  WHEN                 date + time rows                  (booking apps only)
4  HOW you pay          payment-method row -> opens a sheet
5  DISCOUNT             promo row, usually collapsed
6  PRICE LADDER         label/value rows, right-aligned, ending in a bolded Total
7  TRUST                cancellation / refund / security line
8  COMMIT               full-width or sticky, bottom edge
9  LEGAL                fine print, most often BELOW the button
```

Frequencies, each over a stated denominator:

- **46 of the 52** put the commit control at the bottom edge, sticky or as the last element. The 6 that do not: [Faire Wholesale](https://mobbin.com/screens/4cc98343-5fc9-43be-95fc-f0afefe1976d) puts "Place order" inline mid-page with delivery and payment details *below* it; [Airbnb's experience screen](https://mobbin.com/screens/e9da847d-3b16-4b23-a21c-d750ea9dbf06) uses a floating pink "Review" pill mid-scroll; [Zocdoc](https://mobbin.com/screens/6f5ba34b-01e6-4337-a79f-30e2fd4febbf) has no commit on that step; on DICK'S, Vrbo and Glovo the button was out of frame (a limit of the screenshot, not a finding about the app).
- **44 of the 52** show a multi-line label/value price ladder. **6** show only a single total: [TikTok](https://mobbin.com/screens/20e9ba46-7be1-4c85-82c8-ddc61c212aa0), [Woolworths](https://mobbin.com/screens/aee69116-d990-4051-b553-3c5719dcf70e), [Shangri-La Circle](https://mobbin.com/screens/99912dfe-e8b4-455a-ac65-6dd910a54998), [Careem's booking sheet](https://mobbin.com/screens/749054a9-b32a-4475-b298-ab31eecb8743), [Uber Eats' cart](https://mobbin.com/screens/2307b55d-35c1-4a2e-a1ab-9bb136e407e0), and [Airbnb's "Review and continue"](https://mobbin.com/screens/7860fa67-72b3-42d0-8092-c0ac9fe7dcf7), which hides the ladder behind a "Details" button. **2** show no price at all: [Resy](https://mobbin.com/screens/3dc5d30c-7c9d-49a6-bf38-eff3c26757be) and [Zocdoc](https://mobbin.com/screens/6f5ba34b-01e6-4337-a79f-30e2fd4febbf).
- **21 of the 52** carry a promo or discount affordance. Of those 21: **14 collapse it** to a disclosure row or text link; **4 render an always-open input** ([Farfetch inside Klarna](https://mobbin.com/screens/fb9a4f96-9d4d-4c0e-ad3c-703a88f6a3c5), [Vestiaire Collective](https://mobbin.com/screens/dde6b788-6b71-45af-a04b-62cb6b8dce7a), [Natural AI](https://mobbin.com/screens/be276b77-8cff-4e3d-a6eb-0d4e552d1ae4), [Fresha](https://mobbin.com/screens/16a12447-7a3a-463a-a1a1-05dfaa242d8a)); **3 show the applied state as a removable chip** ([Shake Shack](https://mobbin.com/screens/8436f0e1-741f-4178-a39e-ae04b5cb121c), [Preply](https://mobbin.com/screens/75309af8-175e-4564-bd83-f3b8a14c7bba), [Airtasker](https://mobbin.com/screens/d3470e16-6065-460d-8caa-359e5ca0ede7)).
- Over the **34 booking-domain** screens: **22 render a cancellation, refund or deposit term as visible text on the checkout surface itself**, across 12 apps (Airbnb, Fresha, Alan, Peerspace, Resy, Preply, Tripadvisor, Airtasker, Viator, Shangri-La Circle, Square Appointments, Time2book). **11 do not** (Marriott Bonvoy, Careem, CRED, KakaoTalk, Trip.com, Open, Skillshare, Care.com, Walmart auto service, Vrbo, Zocdoc). On 1 the relevant area was scrolled out of frame.
- Over the same 34: **16 carry a photo or avatar** of the person or place being booked. Fresha carries a salon thumbnail on both [iOS](https://mobbin.com/screens/0ef6b0b2-ed22-4c29-bb2c-74719882f58f) and [web](https://mobbin.com/screens/f2d209cf-f76d-4efd-b50e-845928c1cf7e); [Alan](https://mobbin.com/screens/9d51db29-b746-455b-837b-e85767403b33) and [Zocdoc](https://mobbin.com/screens/6f5ba34b-01e6-4337-a79f-30e2fd4febbf) carry a practitioner headshot; Airbnb carries the listing photo.
- **Only 2 of the 52** carry a number at display scale (my read of the screenshots, roughly 28px+): [Trip.com](https://mobbin.com/screens/b8906037-b207-4a9a-9a8c-6937ee7913fe) renders `US$385.60` as the hero, and [Shangri-La Circle](https://mobbin.com/screens/99912dfe-e8b4-455a-ac65-6dd910a54998) renders `Total Charges ≈ USD 234.06` the same way. **Checkout is the one archetype in this sweep that does not use a display anchor.** Marked as an inference from apparent size, not a measurement, and taken up in section 3.

### The three closest references, described from the screenshots

**[Fresha iOS, "Review and confirm"](https://mobbin.com/screens/0ef6b0b2-ed22-4c29-bb2c-74719882f58f)** , back arrow left, X right. A venue card: small rounded-square photo, name "Creation beauty & Nail lounge", `5.0` with five filled stars and `(83)`, then a truncated address. A calendar-icon row `Sat, 21 Sept 2024`. A clock-icon row `12:15-1:45 pm (1 hour 30 mins duration)`. A service line `Jet Plasma / 1 hour 30 mins` with the price right-aligned. Hairline. Then three stacked rows: `Total` in bold ink, `Pay now` in **green**, `Pay at venue` in grey , one amount split three ways by when it is due. Then `Discount code` as an H2 with an open input and a separate outlined `Apply`. Then `Payment method` as an H2 with a bordered square tile holding a storefront glyph and the label "Pay at venue". Sticky bottom bar: left, the amount in bold over `1 service · 1 hour 30 mins` in grey; right, a **black `Confirm`** that is not full width.

**[Fresha web, "Review and confirm"](https://mobbin.com/screens/f2d209cf-f76d-4efd-b50e-845928c1cf7e)** , breadcrumb `Services > Professional > Time > Confirm`, H1 "Review and confirm". Left column: card fields, `Pay securely with` plus brand marks, then `Deposit policy` ("Lyna's Beauty Salon requires US$2,50 deposit to be paid upfront."), `Additional terms and conditions`, `Booking notes` textarea. Right column: one bordered card carrying salon thumbnail, name, rating with count, address, date row, time row, service row with the staff name, hairline, the same `Total / Pay now / Pay at venue` triple, then a **full-width black Confirm inside the card**. Note the split: the deposit policy is on the left, the commit is on the right, and they are not adjacent.

**[Airbnb, "Confirm and pay"](https://mobbin.com/screens/a28898c6-3abf-48d9-8d2d-7cdd41662620)** , centered title, X right. A bordered card per decision: an optional upsell with a checkbox, `Payment method` with the Mastercard mark and a chevron, a row of accepted-brand marks below it, `Coupons` as a bordered "Enter a coupon" row with a chevron. Then `Price details` as plain rows on white with no card. `Total USD`, with USD underlined. Then the pink gradient full-width pill, and **the legal paragraph sits below the button**, not above it.

---

## 2. Pattern table

| # | Pattern | Frequency | Evidence | Verdict for Solen |
|---|---|---|---|---|
| 1 | **Commit pinned to the bottom edge, full-width or sticky** | 46 of 52 iOS | [Fresha](https://mobbin.com/screens/0ef6b0b2-ed22-4c29-bb2c-74719882f58f), [Airbnb](https://mobbin.com/screens/a28898c6-3abf-48d9-8d2d-7cdd41662620), [Uber](https://mobbin.com/screens/9f25c2f7-4995-49d0-93fc-5626c17d55e9), [Etsy](https://mobbin.com/screens/91730c30-03ab-4f5a-83d0-4feeecb5ba4b), [CVS](https://mobbin.com/screens/f7156b43-9f33-4890-bc39-78566c5d6588), [Keeta](https://mobbin.com/screens/92158f1d-d5a4-4d5d-a079-89026e276b71) | **Adopt.** Already law here (hierarchy-density-06). The corpus is near-unanimous, so this is the format, not a preference. |
| 2 | **Price ladder: label left, value right, tabular, one bolded Total** | 44 of 52 iOS | [Shipt](https://mobbin.com/screens/cf12e15c-5fee-4749-a51e-9a2a5ef3ced5), [Wonder](https://mobbin.com/screens/b0cd1246-5cf1-40ef-bd51-b5b5d2751c83), [Warby Parker](https://mobbin.com/screens/a3c573d8-ba3f-4077-938f-b930a92b05d4), [Vestiaire](https://mobbin.com/screens/dde6b788-6b71-45af-a04b-62cb6b8dce7a) | **Adopt.** Already how `walk-in-pay` renders. Keep `tabular-nums` on every value; the corpus is consistent that only the Total row steps in weight. |
| 3 | **Payment method as a disclosure row that opens a sheet, not an inline form** | ~25 sheets observed; the row appears on the majority of the 52 | [Careem](https://mobbin.com/screens/4d525d6e-1aef-4c37-963c-0c8b6cc72816), [Snoonu](https://mobbin.com/screens/6ab48c90-ecb8-4f30-bc57-b694ad33c98b), [Blue Bottle](https://mobbin.com/screens/722ab927-374a-44d5-a4ce-a33024a33117), [Turo](https://mobbin.com/screens/414cdde1-f202-45fe-a416-71b14b9e7ed8), [Glovo](https://mobbin.com/screens/23cacc5e-278a-4e08-9a2f-4be290e3fc52) | **Adopt for the returning user, keep inline for the first.** Solen renders Stripe `PaymentElement` inline with `layout: "tabs"` (`components-legacy/barber/WalkInPaymentForm.tsx:81`). Right for a first-time payer, wrong for a repeat one: a saved card should collapse to a one-line row with a chevron. |
| 4 | **Promo entry collapsed to a row, expanded on tap** | 14 of the 21 that have one | [Uber](https://mobbin.com/screens/9f25c2f7-4995-49d0-93fc-5626c17d55e9) ("Add promo code" with a tag glyph), [SSENSE](https://mobbin.com/screens/2a45189b-b25f-40c7-92da-dd3f38e13a85), [Instacart](https://mobbin.com/screens/ef9b3d21-2e6e-42d8-b2cf-aa589a56082c), [Wonder](https://mobbin.com/screens/b0cd1246-5cf1-40ef-bd51-b5b5d2751c83) | **Adopt the collapsed row, and name the conflict.** Our structural reference **Fresha does the opposite**: an always-open input with a separate Apply. The majority collapses because an empty open field reads as an unfinished task on a commit screen. Recommend the row; Fresha parity is a live fork for the owner, not a defect. |
| 5 | **Applied discount = removable chip + a green negative line in the ladder** | 3 chip states; green negative lines in Instacart, Vestiaire, Etsy, Keeta, Shipt | [Shake Shack](https://mobbin.com/screens/8436f0e1-741f-4178-a39e-ae04b5cb121c), [Preply](https://mobbin.com/screens/75309af8-175e-4564-bd83-f3b8a14c7bba), [Shopify](https://mobbin.com/screens/ba5465d9-56a9-4058-b4c3-3b67b7cb6182), [adidas web](https://mobbin.com/screens/c20b50dc-0fbe-4edd-b7ac-d123ae7a2957) | **Adopt.** Solen has promo codes as a core feature and no checkout affordance for them. Needs all three states: empty row, applied chip with remove, inline invalid. Green on the negative amount is legal under taste rule 4 (short token, not body prose), but not on the sunken tray, where `#16A34A` measures 3.00:1. |
| 6 | **Info "ⓘ" beside every fee or tax line** | at least 12 apps | [Instacart](https://mobbin.com/screens/ef9b3d21-2e6e-42d8-b2cf-aa589a56082c), [Uber](https://mobbin.com/screens/9f25c2f7-4995-49d0-93fc-5626c17d55e9), [Keeta](https://mobbin.com/screens/92158f1d-d5a4-4d5d-a079-89026e276b71), [7-Eleven](https://mobbin.com/screens/d83d2195-a290-416b-a524-927da987ae3e), [Peerspace](https://mobbin.com/screens/c346f17d-5d0b-48c7-90b8-04972ec8fe59), [Airtasker](https://mobbin.com/screens/d3470e16-6065-460d-8caa-359e5ca0ede7) | **Adopt.** Solen renders `inkl. 8.1% MwSt` with no explanation affordance. Tap-to-explain on VAT and on any surcharge is the cheapest trust move on the screen, and it serves the PBV total-price obligation better than a bare label. |
| 7 | **Cancellation / refund term as visible text on the checkout surface** | 22 of the 34 booking screens, 12 apps | [Resy](https://mobbin.com/screens/3dc5d30c-7c9d-49a6-bf38-eff3c26757be) (full prose), [Fresha](https://mobbin.com/screens/b9ae2648-6ffb-4444-a0c1-d86d0852bcd5), [Preply](https://mobbin.com/screens/75309af8-175e-4564-bd83-f3b8a14c7bba), [Airbnb](https://mobbin.com/screens/992ccadf-13af-4938-a38d-61257ef03143), [Viator](https://mobbin.com/screens/73871cbb-f425-4ba2-b2e4-3e53fecd55da) | **Adopt, already done, worth upgrading.** `walk-in-pay/page.tsx:553` renders `l.cancelPolicy` at `text-[12px] font-medium text-s-ink-2`. That is the quiet end of the observed range; Preply and Viator pair the line with a green check so it reads as a benefit, not fine print. Mockup first. |
| 8 | **Cancellation policy as a horizontal timeline** | 1 of 34 | [Square Appointments](https://mobbin.com/screens/eeadd93e-20e3-45e2-8685-780e69ab8202): a track with a "Cancel before Dec 31" pill, an ⊗ marker, `Today` at one end and `Appointment` at the other | **Adapt. Best single idea in the corpus, and a bet, not a convergence claim** (n=1). It turns an unread sentence into a picture of the deadline, and Solen's walk-in rule ("free until you're called") is exactly the time-bounded shape it renders well. Mockup before building. |
| 9 | **"Pay now" vs "Pay at venue" as separate ladder rows** | Fresha only, both platforms | [Fresha iOS](https://mobbin.com/screens/16a12447-7a3a-463a-a1a1-05dfaa242d8a), [Fresha web](https://mobbin.com/screens/1f95a596-cc30-4467-8cde-013944cc6fe2). Cousins: [Airbnb's "Choose when to pay"](https://mobbin.com/screens/7860fa67-72b3-42d0-8092-c0ac9fe7dcf7) radio, [Time2book's "Pay in person / My memberships"](https://mobbin.com/screens/ca0a9daf-e4c1-4de4-9052-b12fb6578c74) segmented control | **Adopt when deposits ship.** Solen already has a pay-at-counter path (`payAtCounter`, `blockedCounterBody`). Fresha's three-row treatment (Total, due now, due at venue) is more honest than one number, and it is the one place a deposit does not read as a surprise. |
| 10 | **Amount baked into the commit button label** | 13 apps | [7-Eleven](https://mobbin.com/screens/d83d2195-a290-416b-a524-927da987ae3e) `Pay $7.82`, [Wonder](https://mobbin.com/screens/b0cd1246-5cf1-40ef-bd51-b5b5d2751c83) (`Place order`, a dash, then `$17.59`), [CHOPT](https://mobbin.com/screens/ad62f62c-f060-4927-ab58-be71fd25cd1b) `PLACE ORDER · $12.71`, [Alan](https://mobbin.com/screens/9d51db29-b746-455b-837b-e85767403b33) `Pay €70 by card`, [Kiwi.com](https://mobbin.com/screens/d453328c-5a3b-4c83-b63d-4703d9d5b74f) `Pay $155.01` | **Adapt, do not adopt verbatim.** It removes all doubt about what the press charges. But `Bezahlen CHF 45.00` is long in German and longer in French, and copy-i18n-09 says a fixed-height `h-11` control gets no width relief from the fluid-container fix. Either measure the longest of four locales against the button, or use pattern 11. |
| 11 | **Split sticky bar: amount left, button right** | 11 apps | [Fresha](https://mobbin.com/screens/0ef6b0b2-ed22-4c29-bb2c-74719882f58f), [Keeta](https://mobbin.com/screens/92158f1d-d5a4-4d5d-a079-89026e276b71), [CRED](https://mobbin.com/screens/c64dd8d1-e7be-4c92-9e1f-f18e08ede656), [Careem](https://mobbin.com/screens/749054a9-b32a-4475-b298-ab31eecb8743), [CVS](https://mobbin.com/screens/f7156b43-9f33-4890-bc39-78566c5d6588), [TikTok](https://mobbin.com/screens/20e9ba46-7be1-4c85-82c8-ddc61c212aa0) | **Adopt.** Solves pattern 10's i18n problem and matches the structural reference. Fresha's left slot carries the amount over a grey `1 service · 1 hour 30 mins`, which is a real second fact, not filler. |
| 12 | **Struck-through original beside the discounted price, same row** | 7 apps | [Instacart](https://mobbin.com/screens/ef9b3d21-2e6e-42d8-b2cf-aa589a56082c), [Keeta](https://mobbin.com/screens/92158f1d-d5a4-4d5d-a079-89026e276b71), [Swiggy](https://mobbin.com/screens/32dea3fd-160f-4b19-8544-d75ebe347dcc), [talabat](https://mobbin.com/screens/b4833d76-a52b-45d7-b345-244b637757f5), [CRED](https://mobbin.com/screens/c64dd8d1-e7be-4c92-9e1f-f18e08ede656) | **Adopt only with a genuine prior price.** Swiss price-indication rules and the no-fabrication rule both bite: a struck price must be one that was actually charged, never an invented anchor. |
| 13 | **Savings celebrated in a tinted strip near the commit** | 8 apps | [Instacart](https://mobbin.com/screens/ef9b3d21-2e6e-42d8-b2cf-aa589a56082c) (green card, "You're saving $15.73"), [Wonder](https://mobbin.com/screens/b0cd1246-5cf1-40ef-bd51-b5b5d2751c83) (yellow), [Keeta](https://mobbin.com/screens/92158f1d-d5a4-4d5d-a079-89026e276b71), [talabat](https://mobbin.com/screens/b4833d76-a52b-45d7-b345-244b637757f5), [Wolt](https://mobbin.com/screens/bb74c446-45af-400e-886d-d19219c98620) | **Reject as shipped, adapt the idea.** In 6 of the 8 the strip is an upsell ("Try Wonder+", "Save with talabat pro"), a marketing interruption one tap from a commit. If Solen shows a saving it belongs in the ladder as a calm negative line (pattern 5), not a coloured banner. |
| 14 | **Tip chips on the checkout screen** | 12 apps, all delivery or rideshare | [Wonder](https://mobbin.com/screens/b0cd1246-5cf1-40ef-bd51-b5b5d2751c83), [Uber Eats](https://mobbin.com/screens/0266db21-22ac-4b21-a042-902b58b4c5ae), [foodpanda](https://mobbin.com/screens/bedb858c-8068-40f3-b0d9-e73852232e03), [Careem](https://mobbin.com/screens/2341f605-8a63-46df-a92a-ba3203cdfcbe), [Wolt](https://mobbin.com/screens/bb74c446-45af-400e-886d-d19219c98620) | **Reject at checkout.** **Zero of the 34 booking-domain screens tip before the service.** Every occurrence is delivery or a completed ride. Tipping before a haircut is asking to pay for work not yet done. Solen's `app/[locale]/tip/[bookingId]` is the correct placement: after. |
| 15 | **Countdown / hold timer at the top** | 4 apps | [Trip.com](https://mobbin.com/screens/b8906037-b207-4a9a-9a8c-6937ee7913fe) `Complete payment within 00:29:10`, [GOAT](https://mobbin.com/screens/1f6c0b86-a6f9-43d0-a952-55ecbe6ced65) `Items reserved for 09:28 min`, [Square](https://mobbin.com/screens/eeadd93e-20e3-45e2-8685-780e69ab8202) `Appointment held for 968:19`, [TikTok](https://mobbin.com/screens/20e9ba46-7be1-4c85-82c8-ddc61c212aa0) | **Adapt, only if the hold is real.** A slot hold on a booking product is a genuine fact and Square proves the pattern belongs in appointments. It becomes manufactured urgency the instant the timer does not map to an actual reservation, which the ethics lines in `_design-system/PSYCHOLOGY.md` forbid. |
| 16 | **Legal fine print BELOW the commit button** | 8 apps | [Airbnb](https://mobbin.com/screens/a28898c6-3abf-48d9-8d2d-7cdd41662620), [Etsy](https://mobbin.com/screens/91730c30-03ab-4f5a-83d0-4feeecb5ba4b), [Peerspace](https://mobbin.com/screens/c346f17d-5d0b-48c7-90b8-04972ec8fe59) | **Adopt, with the distinction that matters.** It keeps the ladder-to-commit path unbroken. But *legal boilerplate* goes below and the *cancellation term* goes above: Fresha, Preply and Viator all keep cancellation above the button and push only terms-of-service beneath it. hierarchy-density-05 already requires the above-button placement. |
| 17 | **Two-column web: decisions left, summary rail right** | 26 of the 34 web screens | [Fresha web](https://mobbin.com/screens/f2d209cf-f76d-4efd-b50e-845928c1cf7e), [Stripe](https://mobbin.com/screens/07221111-e256-461b-8b22-b379df80819e), [Shopify](https://mobbin.com/screens/ba5465d9-56a9-4058-b4c3-3b67b7cb6182), [Squarespace](https://mobbin.com/screens/47e2026b-89c3-4008-8ba7-957e3480c852), [Kiwi.com](https://mobbin.com/screens/d453328c-5a3b-4c83-b63d-4703d9d5b74f), [Square](https://mobbin.com/screens/eeadd93e-20e3-45e2-8685-780e69ab8202) | **Adopt for desktop.** The PDP already runs a sticky right rail (`SalonSidebar`), so this is composition under FLOORS LAW 9, not a new pattern. The rail is the natural home for salon thumbnail, date, service and Total. |
| 18 | **Commit button at the TOP of the summary rail on web** | 2 of 34 | [Walmart](https://mobbin.com/screens/3835c6cd-ac42-42d2-af07-509c71e64a79), [Etsy](https://mobbin.com/screens/41cc91ea-9005-4a4f-b6a8-72ad6dd99a69) | **Reject.** Puts "Place order" physically above the numbers it charges. The other 24 put it after the Total. Walmart also stacks a promo accordion *under* the button, so the price can still change after the user has read the CTA. |
| 19 | **Ticket / perforated edge on the totals block** | 1 of 52 | [Keeta](https://mobbin.com/screens/92158f1d-d5a4-4d5d-a079-89026e276b71), zigzag top and bottom on a sunken tray | **Reject.** Decoration standing in for a receipt metaphor; taste rule 2 deletes elements carrying no information. Our sunken tray already does the separating. |
| 20 | **Numbered or ticked step headers inside the checkout** | 9 apps | [Vestiaire](https://mobbin.com/screens/dde6b788-6b71-45af-a04b-62cb6b8dce7a) (`1. Shipping`, `2. Payment`), [Everyday Rewards](https://mobbin.com/screens/c4175632-d781-401f-9495-6b9d8f1cfb7a), [Dialpad](https://mobbin.com/screens/7463d56b-1c51-42dc-978c-e2d91a718d84) (green ticks), [Farfetch](https://mobbin.com/screens/fb9a4f96-9d4d-4c0e-ad3c-703a88f6a3c5), [Viator](https://mobbin.com/screens/73871cbb-f425-4ba2-b2e4-3e53fecd55da) | **Reject for walk-in, already met in the booking flow.** Numbering a single screen is noise. The multi-step booking flow already carries the icon-stepper. |

---

## 3. Grid

- **Mobile is one column. No exceptions in the 52.** Edge padding reads as roughly 16px throughout; Fresha, Airbnb and Uber all sit in that band. (Apparent from the screenshots, not measured.)
- **Two structural dialects, and they do not mix.** Airbnb, Etsy, CVS and eBay put every decision inside a **bordered or elevated card**. Uber, Fresha iOS and Shipt use **hairline-separated sections on a flat surface with no cards at all**. Solen's `walk-in-pay` uses the card dialect (three stacked `rounded-2xl bg-white` blocks with a two-layer shadow). Internally consistent, so leave it, but note the Edge-Visibility floor: white cards on a white page need the sunken tray or the hairline to survive, and every card-dialect app in the corpus sits its cards on a tinted page.
- **The value column is right-aligned and never wraps.** All 44 ladder screens do this. Long labels truncate; amounts do not.
- **Section rhythm on mobile is a hairline plus a small gap, not a big one.** Fresha separates `Discount code`, `Payment method` and `Notes` with H2s and whitespace only; Uber uses a single hairline above the ladder and nothing else.
- **Web is two columns at desktop, 26 of the 34.** Left column reads as roughly 55 to 65 percent, rail takes the remainder. The rail is a bordered card in Fresha, Squarespace, Babbel and Care.com; a tinted panel in Quicken and Stripe. **Fresha's version, a bordered white card with the Confirm button inside it, is closest to Solen's `rounded-card` plus hairline vocabulary.**
- **The rail is sticky in Kiwi.com and Walmart, static in Fresha and Squarespace.** Sticky is the safer default for Solen: the booking summary is the thing the user is checking against while they fill the form.

---

## 4. Type

- **Section headers are a small bold H2, not a display size.** Airbnb's `Price details`, `Payment method`, `Coupons` and Fresha's `Discount code`, `Payment method`, `Notes` all read at the same weight and size. Uber is the outlier: its `Payment` header is the largest text on that screen.
- **Only the Total row steps up.** In the 44 ladder screens label and value share a size; the Total row gains weight and sometimes a couple of points of size. Solen matches: `l.total` at `text-[15px] font-semibold`, the amount at `text-[22px] font-semibold tabular-nums`.
- **Tabular figures are effectively universal** in the value column. Solen already applies `tabular-nums` on every amount.
- **Distinct-size count is low.** On the Fresha, Airbnb and Uber screens I count roughly 4 sizes each: title, section header, body/label, small grey meta. Checkout sits inside Solen's <= 4 ceiling without effort, because the screen has little content variety to begin with.
- **All-caps tracked labels appear in 7 apps** (SSENSE, adidas iOS, Wonder, CHOPT, CAVA, Everyday Rewards, Burger King). **Reject:** the copy rules ban tracked uppercase eyebrows by name. Use 13px semibold normal-case, which is what Fresha and Airbnb already do.
- **The display-anchor finding is the one real conflict.** FLOORS LAW 6 wants one anchor >= 28px per customer screen; only 2 of 52 checkout screens in the field carry one, and the floor's photograph exemption does not apply. Reading: checkout is legitimately anchor-light because its job is verification, not seduction. **Recommendation: promote the Total to the anchor rather than inventing a headline.** Trip.com and Shangri-La both show a large total reads fine, and it is the one number on the screen that deserves to be the biggest thing. That satisfies the floor with an element that is already load-bearing instead of adding decoration.

---

## 5. Motion

**Honest limit: Mobbin returns still frames.** I saw no animation. What follows is the set of *states* observed across 14 processing screens and 8 error or disabled states, plus what they imply. Nothing below is a claim about duration or easing.

- **In-button loading is the most common commit feedback.** [adidas iOS](https://mobbin.com/screens/d65c0f9c-10e9-4ac5-a430-2671bf718e70) shows `Loading...` inside the black bar; [Vestiaire](https://mobbin.com/screens/dde6b788-6b71-45af-a04b-62cb6b8dce7a) greys the button and drops a spinner into it; **[Fresha](https://mobbin.com/screens/6adda4de-df96-456e-a827-35387d328a1a) replaces the `Confirm` label with `• • •` inside the same black button shape**, keeping the geometry stable. That is the treatment to copy: no layout shift, no takeover.
- **Full-screen takeover is the second dialect and it is heavier.** [Warby Parker](https://mobbin.com/screens/a3c573d8-ba3f-4077-938f-b930a92b05d4) fades the entire checkout to a pale wash behind a centered ring. [UNIQLO](https://mobbin.com/screens/539dd47d-42d5-486e-8ffe-0c1fee1ef2b9), [Shop](https://mobbin.com/screens/221e7a47-c3e6-468e-8888-dcb59dc3e7dd), [SKIMS](https://mobbin.com/screens/2ccd91a8-d30d-4769-8cc7-9f71d5e25e52) and [H&M](https://mobbin.com/screens/88507333-9208-45fa-b5f4-0bdb7ea36d5d) go to a bare screen with a spinner and a "do not close this page" line; H&M even states a duration ("up to 60 seconds").
- **Illustrated waits exist and are a taste fork.** [Honest Greens](https://mobbin.com/screens/186da5fa-6f04-486b-9164-2854429cf081) draws a card terminal with a green check on its display; [Glovo](https://mobbin.com/screens/2137c5b6-0b35-4327-aae2-a58aaa1e10a8) draws a terminal and a card. **Reject:** the icon rules here are Lucide-only, no hand-drawn SVG.
- **The success state worth stealing** is [Apple Wallet](https://mobbin.com/screens/25fc692d-19a1-4de4-a63f-b0a6ecca0bd6): a green ring swept most of the way round to a check, `You Paid US$12.94` as the headline, one explanatory sentence, an ink `Done`. The ring reads as the progress that just completed rather than as decoration, and it aligns with the locked success disc (`#16A34A` plus white check). Coordinate with `_design-system/sections/confirmation/CORPUS.md`, which owns everything after the commit.
- **Promo-code errors are inline and red, never a modal.** [Juicebox](https://mobbin.com/screens/b277cdd3-e5ef-4628-a337-0c8ef923a4e7) borders the input red with `This code is invalid.` beneath; [Givingli](https://mobbin.com/screens/8054d887-5702-4a62-8e5e-b95426acb645) puts `This promo code is not valid` under the field and greys Apply; [Felt](https://mobbin.com/screens/67df3510-506f-4084-a147-7501b8135bc7) borders several fields at once with per-field messages. The outlier is [Hers](https://mobbin.com/screens/d5ed5116-0727-4fbb-98e5-caf060191d13), a pale-pink dismissible toast at the bottom of the page: further from the field, and worse.
- **Disabled-until-valid is standard on the commit.** Observed on Woolworths, Hims, Babbel, Mixpanel, Airtasker and Warby Parker. Solen already does this (`disabled:opacity-50`), matching the locked disabled row.

**Recommendation:** in-button loading in Fresha's shape-stable form, inline field errors, no full-screen takeover, no illustrated wait, Apple Wallet's ring for the success moment.

---

## 6. Components

Run `npm run exists <kw>` before building any of these; the notes below are what I found by reading, not a substitute for that check.

| Need | Corpus form | Solen status |
|---|---|---|
| **Price ladder row** (label left, value right, tabular, optional ⓘ) | Universal | Hand-built inline in `walk-in-pay/page.tsx`. **Registry candidate.** Needed again on the booking Bezahlen step, the receipt, and the dashboard payout view; FLOORS LAW 9 says the same thing must not be drawn twice. |
| **Total row** (hairline above, weight step, largest amount) | Universal | Hand-built inline. Same component, a `variant="total"`. |
| **Payment-method disclosure row + picker sheet** | ~25 sheets observed | Absent from the checkout path; Stripe `PaymentElement` renders inline instead. `app/[locale]/profile/settings/payment` and `_components/profile/PaymentMethods.tsx` exist , check those first, this is likely extend-not-build. |
| **Promo code field with applied / invalid states** | 21 screens | **Missing from checkout entirely**, despite promo codes being a core feature. Needs empty row, applied chip with remove, inline invalid message. |
| **Cancellation term block** | 22 booking screens | Present as one 12px grey line (`walk-in-pay/page.tsx:553`). Upgrade candidate: a labelled row, optionally a green check (Preply, Viator), optionally the Square timeline. |
| **Provider identity card** (photo, name, rating, address) | 16 of 34 booking screens | **Already strong.** `walk-in-pay` renders a 44px salon photo at radius 12, address with a MapPin, a 44px round barber avatar with role, star and a blue review count. Matches Fresha's treatment closely. |
| **Sticky commit bar** | 46 of 52 | Exists for the `?demo` path only (`mt-auto` block with a top shadow). The real Stripe path renders its pay button inline inside the scrolling card (`components-legacy/barber/WalkInPaymentForm.tsx:83`, an `h-[52px] w-full rounded-btn bg-s-ink` button). **hierarchy-density-06 risk:** on a long or error-laden form the commit scrolls away. |
| **Security / trust line under the CTA** | Widespread | Present: `Lock` glyph plus "Sichere Zahlung über Stripe". Time2book's "Payments are secure and encrypted" and Stripe's "SSL ENCRYPTED PAYMENT" are the same move. Keep. |

---

## 7. Where Solen differs, and whether that is a defect or a choice

Read against the live code on 2026-07-29, not from memory.

**Deliberate and correct, keep:**
1. **Ink commit button.** Fresha's Confirm is black on both platforms; Uber's is black, Etsy's near-black. Airbnb's is Rausch. `bg-s-ink` is not a minority position on this archetype.
2. **Provider identity above the price.** Only 16 of 34 booking screens do this at all, and the ones that do feel like a booking rather than a transaction.
3. **VAT broken out as its own ladder line.** The PBV total-price rule makes this non-optional and the corpus supports it.
4. **No pre-service tip.** Zero booking-domain screens tip before the work. The separate `tip/[bookingId]` route is the right structure.
5. **Total at 22px rather than 28px+.** The field agrees (2 of 52), so this is convergence, not laziness. It still collides with a Solen floor, see item 10.

**Genuine gaps:**
6. **No promo affordance at checkout.** 21 of 52 corpus screens have one; promo codes are a named core Solen feature; the checkout has no entry point. Clearest single gap.
7. **No saved-card row.** Stripe `PaymentElement` re-presents a form to a returning payer where the corpus shows one line and a chevron.
8. **The production pay button is not sticky.** Only the `?demo` path gets the bottom-anchored CTA.
9. **No explanation affordance on fees.** 12 apps put a ⓘ on tax and fee lines; Solen states the VAT and stops.

**Open collision, owner's call, not mine:**
10. **FLOORS LAW 6 (display anchor >= 28px) versus measured field behaviour.** The floor is a Solen rule dated 2026-07-21; the corpus evidence is that checkout is the archetype that does not use display anchors. Two ways to honour both, both needing a mockup: promote the Total to >= 28px (Trip.com and Shangri-La precedent), or write a named checkout exemption into the floor the way imagery already exempts "forms, checkout payment step, legal, receipts". **I recommend promoting the Total**, because an exemption weakens a floor and a large total weakens nothing.

---

## 8. Provenance

- Workstream `_plans/SCREEN_RESEARCH.md` A7, owner ask 2026-07-29.
- Sample: 16 Mobbin searches, 194 unique screens, 105 apps, 86 coded as checkout compositions, 34 of those booking-domain. Curated sample, not a census. Booksy, Treatwell, SimplyBook.me, Vagaro, StyleSeat, Squire, Mindbody, Calendly and OpenTable returned nothing and are recorded as uncharacterised.
- Method conforms to `_design-system/RESEARCH_METHOD.md` R3 (a named gap is a first-class result) and R2 (inferences about apparent font size are marked as inferences, not measurements).
- Solen-side claims read from `app/[locale]/walk-in-pay/page.tsx` and `components-legacy/barber/WalkInPaymentForm.tsx`.
- Binds against: hierarchy-density-05 (trust floor for commit actions), hierarchy-density-06 (sticky CTA), FLOORS LAW 6 (display anchor), FLOORS LAW 9 (compose, do not redraw), copy-i18n-09 (fixed-height control width), taste rules 2, 3 and 4.
