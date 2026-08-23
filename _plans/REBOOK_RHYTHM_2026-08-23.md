# The repeat-booking prompt, and a mockup for the text-size mismatch (2026-08-23)

Owner, dictated: *"The hierarchy, like, text says and everything, there's so much, like, mismatch of
design system. So make me a mock up for that. And, also, on the new thing, I want to add, like, an...
if you book somewhere, right, and then I also want, like, a prompt to, like, would you like to book
it again, like, every month or every few weeks, you know, like, depending on their schedule? ...
I wanted to look like a little bit of like this, but, like, make it, like, more automatic ... think
of it and how it should look like, research onto how other websites does it ... I mean apps"*
Reference: https://x.com/insporadesign/status/2091528207962947664

## The asks

- [ ] 1. STILL OPEN: a mockup for the text-size and hierarchy mismatch. Not built this turn, and
      said plainly rather than quietly folded in: the repeat-booking ask was the bigger one and got
      the turn. The measurements it would be built from already exist (the seven-screen table in
      _plans/DESIGN_UNIFY_2026-08-23.md).
- [x] 2. The prompt · verified live over the tunnel at /en/dev/rhythm: a card headed "Want this
      again?" appears in the place a confirmation would
- [x] 3. Their rhythm, not ours · verified: four choices, 3 / 4 / 6 / 8 weeks, one row, and the
      badge reads back what they chose. Today's job assumes 28 days for everyone
- [x] 4. Automatic · verified: tapping 4 weeks filled in 20. Sep, 18. Okt and 15. Nov at 14:30,
      the actual appointments that would be held, rather than a reminder to go and book. The
      "Once it is on" tab shows the state afterwards, where the message before each one is a heads
      up with a way out
- [x] 5. The look from his clip · verified against frame 70 by eye: one tap sets everything, the
      chosen chip carries a pale fill of its own colour, only one is ever active, and a live badge
      sits top right. Ours uses our own colours, not his hexes, because a colour here has to clear
      our contrast floors
- [ ] 6. STILL OPEN: research how other apps do it. NOT done, and not guessed at either. Naming
      what Fresha or Booksy do from memory would be a rumour, and the rule here is that a claim
      about the outside world carries a checkable source or it does not get made.

## WHAT ALREADY EXISTS, so none of this gets rebuilt

`npm run exists rebook` returns 11 live matches. Half of his ask is already here:

- `app/api/cron/rebooking-nudge/route.ts` , a DAILY job that emails anyone whose last booking
  finished 28 or more days ago. Read it: the 28 days is hardcoded and identical for every customer.
- `app/api/bookings/express-rebook/route.ts` and `.../confirm/route.ts` , one-tap repeat of a
  previous booking.
- `bookings.is_express_rebook`, `bookings.rebooked_from_id`, `notification_preferences.rebooking_enabled`.
- `rebookingNudge` in `lib/email.ts`.

GRAVEYARD, checked before proposing anything: a one-tap "rebook your last cut" component was
DELETED 2026-07-11 for having zero importers and predating the current walk-in flow. So the UI was
removed on purpose; the plumbing behind it was not.

**So the net-new part is exactly what he asked for and no more:** the customer picks their own
rhythm at the moment of booking, and it repeats without them being asked again. Today the system
guesses 28 days for everyone and can only send an email.

## THE REFERENCE, read frame by frame from the clip (39s, 78 frames)

A trip date picker. The mechanic worth taking is the shortcut chip row: "Weekend", "3 nights",
"1 week", "2 weeks", "Clear".

- One tap on a chip sets the whole range at once. Verified on frame 70 with my own eyes: the
  "2 weeks" chip carries a pale violet fill, Sep 4 and Sep 18 are solid violet circles, the days
  between are one continuous pale violet capsule, and a badge top right reads "14 nights".
- Each duration has its OWN colour: weekend amber, 3 nights green, 1 week blue, 2 weeks violet.
- Only one chip is ever active.
- The count badge and the field text cross-fade when they change, caught double-exposed on four
  separate frames, so the numbers never hard-cut.
- Hovering a day previews the whole range and the live count before any click.
- Clicking a day earlier than the start swaps the two ends instead of erroring.

WHAT THE CLIP CANNOT SHOW, and is therefore not copied: easing curves, anything under half a
second, and whether the clear is a fade or a cut.

## What this changes, in one line

Today: a job guesses 28 days for everyone and sends an email asking them to go and book.
This: they pick their own number once, at the moment they book, and the appointments exist.
