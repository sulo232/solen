<!-- batch: rebuild the salon-facing dashboard for a phone, following Airbnb's host app (owner 2026-08-21) -->
# Mobile dashboard, Airbnb host shape

His words: "you know how in Airbnb there's like menu and stuff or profile for the actual hosting?
And we need that. Can you make it so mobile dashboards improve and actually like the Airbnb? You
can use Mobbin a lot a lot and actually build it out fully. And the calendar screen on Mobbin is
empty, but go find. Don't just guess. What do you need from me before you start? I wanna as a loop.
And I want you to first make a mockup of a few flows so I can actually see that you understand."

## What the investigation settled BEFORE asking him anything
- [x] WHICH SURFACE `verified:` the iOS app at ~/Documents/solen-mobile is CUSTOMER ONLY. Its
      `src/app` holds salon, discover, bookings, booking, inspo, profile, queue, referral, tip,
      nail-tech, auth, and no host or dashboard directory exists anywhere in it. So "mobile
      dashboard" can only mean our WEB dashboard on a phone. Nothing to ask him.
- [x] HOW BIG `verified:` `app/[locale]/dashboard/` holds 51 entries against Airbnb's five tabs.
      The work is therefore mostly demotion, not drawing.
- [x] THE CALENDAR HE SAID WAS EMPTY ON MOBBIN, FOUND `verified:` it is there under the Airbnb
      iOS "Calendar" flow: a month grid with a PRICE under every single date, day letters across
      the top, a listing switcher with a calendar icon and a gear at the top, "1 promotion" as a
      per-month link, and months stacking and scrolling continuously into the next.

## His answers, 2026-08-21
- [x] TABS: leaning calendar-led but with a Today as well, because a salon is not a rental.
      Verbatim: "im thinking of 3 but w today too yk cz its more salon but idk can u acc use sub
      agents councils". So the shape is HIS to confirm and he asked for a council to work it out.
- [x] WHO: the owner picks what each individual staff member can see. Verbatim: "can select owner
      can select what staff sees specific staffs sees yk". Note this is PER PERSON and configurable,
      not two fixed roles, which is more than the per-staff permissions already in the database.
- [x] FLOWS: all four, he selected every one.

## The work
- [ ] M1 COUNCIL on the tab shape, because he asked for one by name. What are the tabs for a SALON
      rather than a rental, does Today survive beside a calendar, and what happens to the other 46
      sections.
- [ ] M2 MOCKUP, the five tabs and the Menu.
- [ ] M3 MOCKUP, a day in the calendar, following their month grid with a number under every date.
- [ ] M4 MOCKUP, taking a booking by phone, end to end.
- [ ] M5 MOCKUP, the empty first day for a salon that just signed up.
- [ ] M6 The per-staff visibility picker, owner-configurable per person. Design only at this stage,
      it is not in the four flows he picked.
- [ ] M7 Hand over the four mockups on one link and get his read before any real dashboard code
      changes. He asked for the mockups FIRST so he can see whether I understood.
