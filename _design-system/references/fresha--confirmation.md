# Fresha booking confirmation screen

Exists-check: net-new. No `fresha--confirmation.md` or similar Fresha-confirmation capture exists
under `_design-system/references/`. Checked and ruled out as the wrong target: `continue-and-recently-viewed--home.md`
(a different surface, home not confirmation), `lib/cancellation-policy.ts` and
`lib/email-preview-samples.ts` (implementation code, not a design reference doc), `app/[locale]/booking-action/page.tsx`
(a live booking-action route, not a Fresha capture), `_roadmaps/roadmap-ui-brand-identity.md` and
`_tasks/archive/SOLEN_BRAND_OVERVIEW.md` (brand-identity planning docs, not a per-surface anatomy
capture). This file extends the existing Fresha capture family in `public/_pixel-refs/fresha/*`
(booking-services, pdp-bottom, staff-profile, homepage-hero) with the one surface none of those
folders cover: the post-booking confirmation screen.

## Identity

- Brand: Fresha. Surfaces: iOS app (customer) + Fresha web dashboard (business "Appointments" view,
  the closest web analog to a customer confirmation screen; Fresha's web CUSTOMER checkout confirms
  via the same account's "Appointments" list, not a distinct full-page receipt route).
- Method: Mobbin MCP only. No live fresha.com capture attempted this pass (see "not captured" note
  in the return to the orchestrator). Every value below is a Mobbin screen I looked at, tagged
  verified, expect, or assume.
- Capture date: 2026-09-05.
- Primary sources:
  - iOS, top of screen (hero photo, Confirmed pill, date headline, action rows):
    https://mobbin.com/screens/2a9d16da-ae0a-47c0-befe-38f4786731cc (verified, viewed image)
  - iOS, same screen scrolled further (Overview, Forms, Cancellation policy, booking ref):
    https://mobbin.com/screens/48b3b2e7-2f86-4e75-b2bc-581efa025e1d (verified, viewed image; that
    this stitches onto the SAME screen as the row above is tag expect, the row anatomy in each
    image is independently verified)
  - iOS, "Add to calendar" tap result (modal sheet): https://mobbin.com/screens/b44ffb02-d47f-49c2-a2bc-bf76bce720e0 (verified)
  - Web, business "Appointments" split view showing the booked appointment's detail panel:
    https://mobbin.com/screens/4955a804-19fb-42ff-82bc-b65b924fddb1 (verified, viewed image)
  - Web, same detail panel scrolled to Overview/Total/deposit paid/cancellation policy/booking ref:
    https://mobbin.com/screens/f0e0bac9-e382-46c7-b193-87b616d15c49 (content verified, I saw this
    exact image inline while paging the "Booking an appointment" flow; the id-to-image position
    pairing itself is tag expect, since Mobbin's flow tool samples images and does not guarantee a
    1:1 index match against its own screen_id list)
  - Web, merchant-side "New appointment" email template preview (Fresha's confirmation EMAIL copy,
    tone reference only, not the on-screen confirmation):
    https://mobbin.com/screens/830644ed-86a7-42e4-b815-cb00abb372ec (verified)

## Philosophy

Fresha treats "confirmed" as a receipt, not a celebration screen: no confetti, no big animated
checkmark, no "Yay!" copy. The photo + pill + date headline establish WHAT was booked in one
glance, then every row below is an ACTION or a FACT, never decoration. Nothing is sticky and there
is no primary CTA anywhere on the screen, because the job here is confirming and informing, not
selling a next action. One recurring accent tint colors every action-row icon identically no matter
what the action is, so the color reads as "this row is tappable," not as per-row meaning.

## Measured (ordered element list, iOS, top to bottom)

1. Photo hero, full-bleed width, back arrow top-left in a white circle (verified). Share/heart icons
   top-right and a "1/10" photo-count pill appear in this capture too, but both are carried over
   from the venue-gallery component rather than confirmation-specific chrome (tag: assume they are
   not confirmation-specific).
2. Status pill: rounded, filled PALE LAVENDER background, small checkmark-in-circle icon + "Confirmed"
   text in deep purple ink, sits alone with margin above and below (verified).
3. Date/time headline: large bold sans, wraps to two lines ("Tue, Sep 24, 2024 at / 10:00 AM"),
   the biggest text on the screen (verified).
4. Duration subtext directly under the headline, small and grey, e.g. "1 hr, 30 min duration" (verified).
5. Action-row list, each row = round icon disc (single lavender/purple tint, about 40px) + bold row
   title + grey subtitle, hairline divider between rows, tappable though no chevron is drawn:
   - "Add to calendar" / "Set yourself a reminder" -> opens a modal sheet with "Google calendar" /
     "Other calendar" as two full-width outlined buttons (verified, screen b44ffb02).
   - "Getting there" / the venue's full street address (verified).
   - "Manage appointment" / "Reschedule or cancel your appointment" (verified).
   - "Venue details" / the venue name (verified).
6. Scrolling further, same screen (verified via 48b3b2e7): "Overview" heading, one row per booked
   item (service name + duration/package meta left, price right), then a bold "Total" row.
7. "Forms" heading: a completed consent-form row (icon + form name + truncated date + a pale-green
   "Completed" status pill + chevron) (verified).
8. "Cancellation policy" heading + one plain paragraph, e.g. "Please avoid cancelling within
   72 hours of your appointment time" with the number bolded (verified).
9. "Booking ref: E8D70974" as the last line, small grey, no card around it (verified).
10. Nothing is sticky. No primary CTA renders anywhere on this screen (verified, both captures).

## Measured (web business-side variant; expect close to, not proven identical to, the customer view)

Split view: appointments list on the left (Upcoming / Waitlist groups, small photo+text cards),
detail panel on the right for the selected appointment: hero photo, "Confirmed" pill, date/time
headline, the SAME four action rows (Add to calendar, Getting there, Manage appointment, Venue
details), then Overview/Total, then (scrolled) "Deposit paid with Mastercard ****4320" + "Left to
pay at store $7.50" + Cancellation policy + Booking ref (verified, content seen). This is the
MERCHANT's own view of a booking they took, not proven pixel-identical to what a Fresha CUSTOMER
sees on fresha.com after booking, which I did not reach this pass (tag: assume the customer-facing
web receipt is close to this).

## Port map (Fresha element -> Solen file)

- Whole screen -> `app/[locale]/confirmation/page.tsx` (server component; already selects
  `salons(name, address, cover_photo_url)`, `services(name, duration_minutes, price)`,
  `staff_members(name)`, plus VAT breakdown) feeding
  `components-legacy/booking/BookingConfirmation.tsx` (671 lines).
- Fresha's "Confirmed" pill -> BookingConfirmation.tsx already renders a status word (its own
  code comment: "green 'confirmed' text when it is actually 'paid'"), currently TEXT, not a filled
  pill. See Conflicts.
- Photo hero -> BookingConfirmation.tsx around line 401, `<div className="relative h-[240px] w-full ...">`,
  already renders `salonCoverUrl` as a 240px cover photo. Placement already matches Fresha's.
- Add to calendar / Getting there / Manage appointment / Venue details rows -> NOT currently present
  as a four-row icon list. BookingConfirmation.tsx instead opens `RescheduleSheet.tsx` /
  `CancelBookingSheet.tsx` from a plain date row and a quiet red text row (its own comments, lines
  55-59). This grouped action-row block is the clearest NEW anatomy Fresha suggests porting.
- Overview / service + price / Total -> BookingConfirmation.tsx already carries `servicePrice`,
  `pricePaid`, `priceLabel`, `durationMinutes` as props; needs a matching "Overview" list treatment.
- Cancellation policy paragraph -> not currently rendered on this screen. `lib/cancellation-policy.ts`
  exists in the repo (found during the exists-check above) and is the likely source to read the
  policy text from rather than inventing new copy.
- Booking ref -> `referenceCode` prop already exists and is passed in.
- Forms / consent-status row -> no Solen analog found in this pass; out of scope for this timebox.

## Conflicts (Fresha placement vs a Solen lock)

- CONFLICT [status pill fill]: Fresha's "Confirmed" indicator is a FILLED pale-lavender pill with a
  brand-tinted icon. Solen's design contract (`CLAUDE.md`, "Design contract - LOCKED" table,
  `availability` row) says "plain ink text, NO green pill" for status indicators, and taste rule 3
  reserves the accent color for small clickable text/chips, not a filled status badge. Owner call:
  keep BookingConfirmation.tsx's existing TEXT-based status, or adopt a Fresha-style filled pill
  here specifically (mockup first, per this repo's mockup-first law, before touching real code).
- CONFLICT [icon-disc tint]: Fresha tints every action-row icon disc the same brand-purple
  regardless of the action. Solen's category-tag row (design contract) requires "neutral, no
  per-category colour," and blue is reserved for SMALL CLICKABLE text/chips, not decorative icon
  fills across four rows. Owner call: render these icon discs neutral (`bg-s-bg-sunken` + ink icon),
  or accept the row itself as a legitimate "small clickable accent" exception.
- No conflict on stickiness: Fresha's confirmation carries no bottom CTA, so Solen's sticky-CTA
  floor (hierarchy-density-06) does not apply here, since that floor is scoped to screens with a
  single primary commit action and this is a post-purchase receipt.
