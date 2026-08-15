# Home sections, one by one (2026-08-15)

Owner, verbatim:

> No. Like, put, like, a search icon. You can do that, but don't do, like, how you did it before.
> You know? That looks so weird. And, also, uh, well, let's fix up the font and the spacing on this
> part. You know, the text and stuff because it kinda looks weird. Like, it's not balanced, and,
> like, we can add, like, stuff like... it looks empty. You know? And after that, let's improve the
> design on the popular looks because it doesn't make any sense. Maybe we can remove the fine yurn
> inspiration. Like, we know we can... maybe we can place a name popular looks with finer
> inspirations. You know? like, some... something like that. Like, give me, like, a lot of options.
> Like, like, maybe, like, I don't know, like, tons of it. On a walk in section two, let's improve.
> On a review section, we can improve a little bit too. Let's come on by one and improve. Yeah.

He said "one by one", so the order below is his order.

## A. The search icon, without the box

- [x] **A1. Icon back, container gone.** verified live: 26px lucide-search, colour #6B6B6B, no
      background (`rgba(0,0,0,0)`), no sunken box in the card. What he objected to was the 87x70
      sunken rectangle standing in for a photo, not the glyph. commit d89dafdee.

## B. The card font and spacing: "not balanced ... it looks empty"

- [x] **B1. Root cause measured before any edit.** verified: measured live before the edit, 4 of 5 meta values at 12px/400/#6B6B6B. Four of the FIVE meta values rendered
      identically at 12px / weight 400 / #6B6B6B: the rating, the category, the city AND the price.
      The card carried one ink element and then a flat grey block. That is the "empty" he meant: not
      missing content, missing CONTRAST.
- [x] **B2. The price becomes the second anchor.** verified: commit d89dafdee, SalonCard.tsx PriceFrom `emphasis` + text-s-ink. 12px/400 grey -> 12px/600 ink. Not a new
      opinion: the locked hierarchy row already reads "price bold-ink but smaller than name", and
      V3-D442's two-anchor rule wants name + price as the two ink elements with the NAME larger, so
      size stays the anchor marker at 14 against 12. verified live: ink elements on the card are now
      exactly [name, price], distinct treatments 2 -> 3. commit d89dafdee.
- [x] **B3. Used the primitive's own API, not a class hack.** verified: commit d89dafdee; primitives/PriceFrom.tsx:31 is the emphasis branch. The first attempt set classes on the
      `CardMeta` parent, which is the hand-drawing FLOORS LAW 9 bans, and it lost the colour anyway
      because `PriceFrom` renders its own inner span. `PriceFrom` already had an `emphasis` prop for
      exactly this case. verified: SalonCard.tsx passes `emphasis` + `className="text-s-ink"`.

### Still open on B

- [ ] **B4. "We can add, like, stuff" is not yet answered.** Fixing the contrast fixed the balance,
      but he also asked to ADD something to the card. Candidates that are real data and not
      decoration, each needs a source check before it goes in a mockup: distance from the visitor
      (needs geolocation, already used by Nearby), next free slot (the availability query the
      booking flow already runs), a discount pill (the existing pale-green -X% slot per
      project_card_badges), open-now state (isOpenNow already exists and is short-day-keyed).
      Nothing goes on the card without a live source, per taste rule 1.

## C. Popular looks: "doesn't make any sense", and he wants MANY options

- [x] **C1. They are the SAME QUERY rendered twice.** verified: usePopularLooks.ts header + Entdecken.tsx:112, and 8 of 8 shared ids measured live. verified live on /en: "Popular looks" and "Find your inspiration." share 8 of 8 image ids in the same order. Both call `/api/discovery/feed?category=hair`: usePopularLooks.ts by its own header, Entdecken.tsx:112. That is why it "doesn't make any sense", and it is the same defect as the two "Zuletzt angesehen" rows removed earlier today, one thing wearing two shapes on one screen. His instinct to merge them is right.
- [x] **C2. Seven directions, one page, switchable, injected onto the real homepage.** verified: commit e848dd9c7. verified live: 8 real looks loaded from the same endpoint, both shipped sections hidden while a direction shows (visibleLooksHeadings = 1), direction 2 renders 4 tiles at 324x405 (ratio 0.80) and direction 4 renders 8 at 173x231 (0.75). Previously read: He asked for "a lot of options ... tons of it", so this is not
      the usual three. Distinct DIRECTIONS, not one layout with tweaks, side by side and clickable
      on one page, built from the real components.
- [x] **C3. Recommendation: direction 3, the rail.** verified at 390: d1 82x82 (1.00), d3 168x210 (0.80), d5 358x246 (1.45), d7 76x76; every heading at left 16, no sideways overflow. It is the only one that uses the grammar every other row on this page already uses, which is the thing FLOORS LAW 8 keeps asking for and the thing that went wrong with the recently-viewed row for nine rounds. Direction 4 (masonry) is the interesting second, because the Inspo north-star is Pinterest and this is the one place a non-card shape is earned.

## D. Walk-in section

- [x] **D1. Walk-in analysed on the customer-job angle. Six ideas back, and three of them are BUGS, not design.**
  The three that are defects, each measured against live data:
  1. **Both exits leave walk-in.** Every chip links to `/salon/{slug}` with NO param, and `?walkin=1`
     already works: `SalonDetailV3.tsx:92` reads it and flips the mode. `WalkInBand.tsx:122` just
     never passes it, so tapping a walk-in chip lands you in APPOINTMENT mode. The "All walk-ins"
     button goes to `/barbershop` with no walk-in filter, which means it currently reads as "all
     barbershops", and walk-in stopped being barbershop-only in Phase 2.
  2. **`walkin_paused` is enforced on 3 write paths and 0 read paths.** A salon that paused its line
     still advertises a live wait and a queue count on the homepage. `isOpenNow` exists at
     `lib/salon-hours.ts:90` and `/api/walkin/nearby` never calls it either, so closed shops show too.
  3. **The queue never empties, so every number in the section is a ghost.** `/api/walkin/queue`
     returns four rows still `status: "waiting"` with `joined_at` of 2026-06-03, 2026-06-03,
     2026-06-13 and 2026-07-01. Today is 2026-08-15. That residue is what drives the live "4 ahead
     of you" and the 70 to 98 minute waits. None of the 28 cron routes touches `barber_walkin_queue`.
  Also found: `POST /api/walkin/queue/remote-join` is shipped and has ZERO client callers.

## E. Reviews section

- [x] **E1. Reviews analysed on the trust-and-evidence angle. Six ideas back, and the top two are defects.**
  1. **Six cards render where ten are asked for.** `api/reviews/featured/route.ts` applies `.limit(10)`
     in the query and THEN filters inactive salons in JS, so four rows are dropped after the limit.
  2. **`reviews.verifiedBooking` exists in all four locale files and has ZERO render sites.** The only
     mention in code is a comment at `SalonReviews.tsx:268` describing behaviour never built. Same
     class as the walk-in cancelPolicy case CLAUDE.md already names. 12 of 32 eligible reviews carry
     a `booking_id` with `status='completed'` and a resolvable service name, so the badge is real.
  3. **The evidence is unreadable on /en**: the comments are German rows and this surface makes no
     translate call, though `/api/reviews/translate` is live and the PDP already uses it.
  4. `route.ts:39` does `comment.slice(0, 120)` server-side with no ellipsis, so one review is
     already cut mid-word and that becomes constant with real reviews.
  Supply is the honest limit: only 3 visible salons have any commented review, and 18 salons with
  reviews have zero text. `review_photos` has 0 rows, `salon_response` 0, `review_replies` just 2.


## An eighth direction was built and dropped, and the gate that caught it cited the wrong rule

It was a cover card with the look name over the photo. The resurrection gate called it a full-bleed
revival. That citation is WRONG and worth correcting in the record: `TASTE_LOG.md` 2026-07-16
(night) says "Full-bleed as a direction | STANDING, not disbanded", owner verbatim "ok all of it no
disban the full bleed thing", which supersedes the earlier same-day denial the gate quotes.

The REAL hit is in that same entry: "FB4b gradient finish | NOT adopted". Direction 8 used a
linear-gradient scrim to hold white text over the photo, and that is the treatment he did not take.
So it is dropped on the gradient, not on full-bleed, and a cover direction without a gradient is
still open if he wants one.

- [ ] **C4. Optional: a cover direction WITHOUT a gradient**, if he wants the look name over the
      photo. Needs a different contrast device than FB4b's gradient, so it is a real design question
      rather than a rebuild, and it waits for him to say whether the cover idea interests him at all.
