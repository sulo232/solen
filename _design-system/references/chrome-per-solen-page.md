<!-- exists-check: extends _design-system/references/chrome-by-page-type.md (the captured Airbnb and
     Uber Eats behaviour) by applying it to our own routes. That file records what THEY do; this one
     is the list of what OURS should carry. Route list taken from app/[locale]/**/page.tsx, not from
     memory. -->

# What the top bar should carry, page by page, on Solen

Owner asked for the list after the capture. The rule applied here is the one both references agree
on: **a screen where someone is doing one job carries no chrome at all**, and a detail page carries
a way back and the thing you are looking at, never a notification count.

Three kinds only. If a page does not obviously fit, it is BROWSE.

## 1. BROWSE , keeps the full bar

Where someone is choosing what to do next. Search, menu, account, notifications all belong here.

    /                      home
    /search                search
    /[city]                city
    /[city]/[category]     category
    /coiffeur /barbershop /spa /nails    category landings
    /behandlungen/...      treatment landings
    /inspo  /inspo/nails   the feed
    /termine               my appointments
    /account               profile hub
    /vouchers              voucher list

## 2. DETAIL , back arrow plus the name of the thing. NO bell, NO hamburger

You arrived here from a browse page and there is one way out.

    /salon/[slug]                     salon page
    /salon/[slug]/reviews             reviews          <- carries a bell today, wrong
    /salon/[slug]/team                team
    /salon/[slug]/staff/[staffId]     one stylist
    /brand/[slug]                     brand
    /inspo/[id]                       one look
    /inspo/board/[id]                 one board
    /inspo/saved/[id]                 one saved board
    /help/[slug]                      one help article
    /blog                             articles

## 3. TASK , no bar at all. One X, and the action lives at the bottom

One job in progress. Uber Eats replaces the entire bar with an X here; Airbnb hands the bottom bar
to the commit button. Both remove everything else.

    /salon/[slug]/booking      the booking steps
    /walk-in-join              joining the queue
    /walk-in-pay               paying for a walk-in
    /walk-in-tip/[token]       tipping
    /tip/[bookingId]           tipping
    /confirmation              after booking
    /bookings/[id]/refund      asking for a refund
    /bookings/[id]/report      reporting a problem
    /bookings/[id]/upcharge    approving an upcharge
    /auth/login /auth/register /auth/signup /auth/reset-password
    /booking/lookup  /booking/resend-link  /staff-invite
    /vouchers/buy              buying a voucher
    /salon/[slug]/gift-card    buying a gift card

## Legal and marketing pages

    /agb /impressum /datenschutz /terms /tos /legal/* /sicherheit
    /ueber-uns /warum-solen /karriere /kontakt /business /fuer-salons /help

Airbnb gives these NO bar and lets the title be the first line of the page. That is the cheaper and
better answer than the full menu they carry now, but it is a taste call and it is his.

## What is wrong today, in one line

Every one of these carries the same global bar with a notification bell, including the task screens
and the detail pages. The bar is one component used everywhere, so the page type never enters into
it, which is why the reviews page ended up with a bell, a hamburger and two back arrows at once.

## Needs him

- **Which model for the booking steps:** no chrome at all (Uber Eats treats a multi-step job as a
  task) or a back arrow (Airbnb treats it as depth). Both beat the full bar we ship.
- **Legal and marketing pages:** bare like Airbnb, or keep the menu because someone landing there
  cold has no other way to navigate.
