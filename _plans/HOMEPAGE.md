# HOMEPAGE , design pass (9-item owner feedback)

> Status: **ACTIVE** (2026-06-29). Mockup-first for new looks; auto-commit small consistency polishes.

## Items (owner's 9-point list)
1. [x] Hero copy , killed "Termin in 30 Sekunden" -> "Termine, sofort bestätigt." (`027c9c016`).
2. [x] Search-bar shadow reduced -> `elevation-2` (killed the mobile halo).
3. [x] Card shadow , single-layer `elevation-2`/`-3` (killed the double-line artifact).
4. [x] Icon flat-vs-shadowed , council confirmed flat chrome is COHERENT; kept flat.
5. [x] Home icon -> Solen logo on homepage (Header `isHome` branch) (`2be43681a`).
6. [~] Category-page cards , treatment ALREADY EXISTS (`SalonResultCard` via `SearchTemplate`: price=`avg_price` renders, next-slot wired via `with_slots=1`+`nextSlotLabel`). Swapped `Clock`->`Calendar` to match the homepage card. DONE except the next-slot is sparse (real availability), which is a data matter, not the card.
7. [x] **Walk-in section redesign + clarify** , DONE. `WalkInBand`: clarifier sub-line + direction **B/R1** (live-board, located): "Live" marker + green wait-RANGE hero ("35-49 Min" / "bis frei") + name+rating row + address + queue, each datum on its OWN line (NO middot, taste rule 2). Mockups: `walk-in-section-redesign.html` (A/B/C) + `walk-in-B-refined.html` (R1/R2/R3). Committed.
8. [x] Inspo preview , clean 9:16 tiles + top-left "TikTok" pill + creator·price caption from real feed (`2cedef343` + caption + CTA-alignment fix).
9. [x] Reviews block , REDESIGNED to direction **B (person-led)**: identity header (avatar 40px + name 14 semibold + salon link) on TOP, then stars + date, then quote. Keeps the earlier `elevation-2`/`-3` shadow + 14px quote. Mockup: `reviews-redesign.html`. STILL PARKED: relative date ("vor 2 Wo." , shown in the mockup) needs `Intl.RelativeTimeFormat`; live still shows the full date.

## PARKED (decide)
- **Inspo "ab CHF" i18n** (`Entdecken.tsx` ~368): German "ab" leaks on /en /fr /it; SalonCard uses bare "CHF X". Pick: drop "ab" (match SalonCard) / localize via existing `fromPrice` key / keep.
- **Reviews date** (`Reviews.tsx` ~146): full "11. Juni 2026" -> relative "vor 2 Wo." (needs `Intl.RelativeTimeFormat`). Owner said commit+move-on; optional.
- **Homepage FABRICATED next-slot times** (no-fab): Nearby/RecentlyViewed hardcode "Heute 15:30" (`Nearby.tsx:76`, `RecentlyViewed.tsx:55-57`). The honest fix behind item-6's next-slot gap is to make THESE real (or drop them), not to fake the category cards.

## REDESIGNS requested (owner 2026-06-29) , I'd DROPPED these; mockups pending
The small fixes done (item 6 = icon swap, item 9 = shadow+quote) were NOT what the owner wanted , they want FULLER REDESIGNS, delivered as mockups first.
- [x] **Walk-in SECTION redesign** , DONE. Owner picked B (live-board) -> refined to R1 (located) -> APPLIED to the real `WalkInBand` + committed. (Feed-card mockup `feed-card-redesign.html` was a mis-read of "cards" , parked, not the ask.)
- [x] **Reviews redesign** , owner picked **B (person-led)** -> applied to `Reviews.tsx` + committed. Mockup `reviews-redesign.html`. Only remaining: the relative-date helper (parked).
- Walk-in clarifier (item 7): committed with draft copy; owner to refine the wording.

## Reviews , WRITE path + system (off the 9-item list; owner 2026-06-29)
Owner expanded reviews from the homepage carousel into the write-path + a system design. VERIFIED state (go-check, not guessed):
- **Form modernization** (mockup DONE, not applied): `components-legacy/ReviewForm.tsx` -> bottom sheet, DS-compliant (cool shadow, ink-edge focus, sentence-case, circled-X, sheet/pill radii, fixed malformed `hover:bg-s-ink/5:bg-white/5`). Mockup `public/_mockups/review-form-redesign.html`. Same fields + same POST /api/reviews.
- **Attribute tags** (NEW capture): customer confirms the salon's amenities Google-Maps-style. Reuses the real 9-amenity set + Lucide icons from `SalonAdditionalInfo` (wheelchair/Accessibility, LGBTQ/Heart, woman-owned/Star, family/Home, pet/Dog, kid/Baby, wifi, transit/Bus, student/GraduationCap). The `reviews` table does NOT store attributes today -> net-new: a `review_attributes` capture + aggregate to confirm vs owner-claimed. Shown in the mockup.
- **Staff rating** in the form: uses existing `reviews.staff_member_id` (FK). Display has a known bug (per-staff ratings remap , already in BUG_HUNT FIX-clear). Shown in the mockup.
- **Backend already has TWO visit-gated review paths**: appointment (`/api/reviews`, completed booking) + walk-in (`/api/walkin/review`, completed walk-in visit, token-gated). Both write `reviews`; both carry `staff_member_id`.
- **PENDING OWNER FORK**: "review at store anytime" = the walk-in path (exists, gated) OR a truly UNGATED "rate without a visit" (NEW; breaks the visit-gated anti-fraud model , every review today is tied to a real completed visit). Awaiting owner: ungated vs keep-gated.
- **Dedup finding**: `app/[locale]/_components/salon/SalonReviews.tsx` (current-tree) is display-only + UNUSED (orphan); the live write flow is the legacy `components-legacy/SalonReviews.tsx` + `ReviewForm`. Consolidate into the current tree when applying.
