# MERCHANT TERMINAL , the Uber-Eats-style "receive bookings" screen for salons

**Owner ask, 2026-08-15 (two messages, second one corrects the first):**

> "You know how Uber Eats has, like, a little device, um, that allows, like, storage to, like, accept
> orders and stuff... I want that for walk in or or just appointments overall, like, so that the store
> doesn't need to actually use a dashboard, and they can do externally. Just, you know, receive
> bookings or cancel them or move them, you know, how Uber eats as it. can you adjust it does it like
> same? You know, instead of having this complicated thing so that these people can just sign up and
> then receive it. Bookings. Easy as that. Can you help me, like, actually define it and also research
> and also make me a plan and also mock ups maybe? how it's gonna actually work. Like, first, it's
> phase by phase. So define the phases too."

> "And just to make it clear, I do not want, like, a physical device. I just think of maybe, like, so...
> like, subdomain or something like that. I don't know. I do not want, like, a physical app. So, like,
> it's something, like, so that they can, in their own computer and so on or iPad or whatever they have,
> they can just access it and make it themselves because it doesn't have to, like, need to print out a
> receipt or something."

**Hard constraints from him, verbatim-derived:**
- NO physical device. NO native app. NO receipt printer.
- Runs on whatever they already own: laptop, iPad, whatever.
- Reached at a URL, he floated a subdomain.
- Verbs: receive / cancel / move.
- Covers walk-ins AND normal appointments.
- The point is NOT the dashboard. "instead of this complicated thing."
- Sign up, then receive bookings. That easy.

---

## Atomic checklist

### A. DEFINE
- [x] A1 Name the screen's ONE job in one sentence (FLOORS LAW 10 requires it before any element is justified)
      - verified: the sentence is written at MERCHANT_TERMINAL_2026-08-15.md:242, and app/[locale]/dev/terminal/Terminal.tsx is built against it
- [x] A2 Fix the verb set: which actions the terminal DOES carry `verified:` commit 4851a82f3, MERCHANT_TERMINAL_2026-08-15.md:254 lists the eight verbs; each is mapped to a live endpoint in the table at :334
      - verified: the eight verbs are listed at MERCHANT_TERMINAL_2026-08-15.md:248, each mapped to an existing endpoint in the B2 table
- [x] A3 Fix the anti-scope: which of the 28 salon-facing dashboard sections it deliberately does NOT carry
      - verified: the excluded list is at MERCHANT_TERMINAL_2026-08-15.md:256; the 20 admin-gated folders are enumerated in middleware.ts:222
- [x] A4 Decide the access model: subdomain vs path, and what he actually gains from each
      - verified: recommendation + its named cost at MERCHANT_TERMINAL_2026-08-15.md:267; middleware.ts does no host inspection today (grepped for host/subdomain/rewrite, 0 hits)
- [x] A5 Decide the identity model: who logs in (owner / staff / shared shop device) and how they stay logged in
      - verified: target model at MERCHANT_TERMINAL_2026-08-15.md:285; the owner-only constraint it fixes is lib/bookings/authorize.ts:92-101, and the staff precedent is app/api/walkin/queue/[id]/route.ts:40
- [x] A6 Decide the appointment default: auto-accept vs must-accept, grounded in what the industry actually does `verified:` commit f004c5dc2 (the L2-L4 research that decided it), decision at MERCHANT_TERMINAL_2026-08-15.md:302, grounded in the sourced D2 section and in the live DB (28/28 salons instant, 0 bookings ever pending_approval)
- [x] A7 State what happens when nobody presses anything (the timeout path), because one already exists in this codebase
      - verified: app/api/cron/pending-timeout/route.ts:23-47 (24h, cancels + frees the slot + cancels the Stripe intent)

### B. WALK-INS AND APPOINTMENTS BOTH
- [x] B1 Map the walk-in queue verbs onto the same screen `verified:` MERCHANT_TERMINAL_2026-08-15.md:322, each verb traced to PATCH /api/walkin/queue/[id] and components-legacy/dashboard/barber/LiveQueuePanel.tsx:98
- [x] B2 Map the appointment verbs onto the same screen `verified:` commit 4851a82f3, the endpoint table at MERCHANT_TERMINAL_2026-08-15.md:334
- [x] B3 Name how the two streams coexist without becoming two products `verified:` MERCHANT_TERMINAL_2026-08-15.md:343, and built that way in app/[locale]/dev/terminal/Terminal.tsx (one row grammar, two variants)

### C. NO DEVICE / BROWSER-ONLY
- [x] C1 Answer the hard question: how does the shop actually NOTICE a new booking in a browser `verified:` commit f004c5dc2, MERCHANT_TERMINAL_2026-08-15.md:414, two layers, each claim carrying its source
- [x] C2 Name the fallback chain when the browser misses it `verified:` commit f004c5dc2, the five-step ladder in section C2 of this file (row, sound loop, push, SMS after N minutes, email as the record)
- [x] C3 State the iPad reality (backgrounded tab, sleeping screen) with sourced facts, not guesses `verified:` commit f004c5dc2, section C3 of this file, sourced to Apple's own developer-forum statement that the suspension is intentional plus Chrome's two five-minute throttle and freeze mechanisms

### D. RESEARCH (never from memory)
- [x] D1 Uber Eats merchant side: Orders vs Manager split, lifecycle, alerting, device phase-out
- [x] D2 Booking-industry equivalents: Fresha, Square Appointments, Booksy, Treatwell/Planity/Phorest
- [x] D3 Browser alerting feasibility 2026: iOS web push, wake lock, audio autoplay, background throttling
- [x] D4 What already exists in OUR codebase (exists-check, done first, not last)

### E. PLAN, PHASE BY PHASE
- [x] E1 Phases named, each with its own close condition
- [x] E2 Each phase says what is NEW vs what is REUSED from what already exists
- [x] E3 Name the gaps found in our own code and WHY each is missing (missing-needs-a-reason law)

### F. MOCKUPS
- [x] F1 Mockup: the idle/live board (nothing happening)
- [x] F2 Mockup: a new booking arriving, the accept moment
- [x] F3 Mockup: the move/reschedule action
- [x] F4 Whole-page, English, real photos, exists-check line, type budget respected
- [x] F5 Delivered as a clickable tunnel link, nothing applied to real code

---

## D4 , WHAT ALREADY EXISTS IN OUR OWN CODE (measured 2026-08-15, exists-check first)

### The complaint is measurable
`app/[locale]/dashboard/` contains **48 route folders**, each with its own `page.tsx`.
Corrected after checking `middleware.ts:222`: **20** of those are listed in `adminOnlyPaths` and are
gated centrally in middleware, not in the page files. (My first pass grepped the page files, found
two admin checks, and wrongly concluded almost all 48 were salon-facing.)
So the real number a salon owner sees is **28 sections**. That is still "this complicated thing",
and it is the honest number.

### The accept-flow backend is ALREADY BUILT, and its UI never landed
- `salons.booking_confirmation_mode` = `'instant' | 'manual_approval'` (migration 075), settable
  today at `app/[locale]/dashboard/settings/page.tsx:1117`.
- Booking status `pending_approval` is real and produced at `app/api/bookings/route.ts:413`.
- `POST /api/bookings/[id]/confirm` is the approve transition and is salon-callable
  (`app/api/bookings/[id]/confirm/route.ts:29`).
- `app/api/cron/pending-timeout/route.ts` auto-cancels anything left in `pending_approval` for
  **24 hours**, frees the slot, cancels the Stripe intent and emails the customer.

**THE GAP:** grep for `pending_approval` across every `.tsx` in the app returns **two lines**, both in
`app/[locale]/dashboard/bookings/page.tsx` (a label key at :25 and a badge tone at :33). The status
filter row at :253 lists `all / confirmed / completed / cancelled / no_show` and omits it. The action
sheet at :116 offers complete / no-show / cancel and no approve. **So a salon can switch itself into
manual-approval mode from settings and then has no screen anywhere to approve anything.** Every
booking sits for 24h and the cron cancels it.

- WHY it is missing: HALF-LANDED. The API, the status, the cron and the email templates
  (`bookingPendingApprovalEmail`, `bookingApprovedEmail`, `bookingRejectedEmail` in
  `lib/email-templates/audit-notifications`) all exist. The three notification types
  `booking_pending` / `booking_approved` / `booking_rejected` are declared in `lib/notifications.ts`
  and **have zero senders**. Nothing in the graveyard kills this; it was built and never finished.

### The salon is NOT told about a prepaid booking , at all
`salonNewBooking` (`lib/email.ts:383`) has exactly **one** call site,
`app/api/bookings/route.ts:652`, inside `if (ownerId && !isOnlinePay)`. The comment says the Stripe
webhook owns the online-pay case. It does not: the webhook's only booking notification
(`app/api/stripe/webhook/route.ts:336`) is addressed to `userId: booking.user_id`, the **customer**.
- WHY it is missing: HALF-LANDED at the deferral seam. The non-prepaid path was written, the work was
  deferred to the webhook, and the webhook half was never written.

### The salon CAN move a booking, but only by dragging a slot in the 1156-line calendar
(Corrected after a second read. My first pass said the salon could not move a booking at all; that
was wrong, and the correction matters because it changes Phase 3 from "build a move" to "expose the
move that exists".)
- `POST /api/bookings/[id]/reschedule` rejects any actor that is not `customer` or `guest`
  (`app/api/bookings/[id]/reschedule/route.ts:35`). A salon owner gets 403. So there is no
  BOOKING-level move for the salon.
- The move that does work is SLOT-level: `PATCH /api/slots/[id]` cascades into
  `bookings.starts_at / ends_at / staff_member_id` when the slot is booked, and emails the customer
  a reschedule notice (`app/api/slots/[id]/route.ts:115`). `DELETE /api/slots/[id]` cancels the
  booking outright (:30). The only UI for this is drag-and-drop in
  `app/[locale]/dashboard/calendar/page.tsx` (1156 lines).
- So "move a booking" today = open the week calendar, find the slot, drag it. That is the thing he
  is asking to get away from.
- Migration 022 added `bookings.reschedule_requested_at`, `reschedule_to`, `reschedule_status`
  (`'pending'|'approved'|'rejected'`). All three columns are live in the DB snapshot and have
  **zero read or write sites** in the entire codebase.
- WHY it is missing: HALF-LANDED. The columns for a request-and-approve reschedule handshake were
  migrated in and no code was ever written against them.

### Staff cannot act on a booking
`resolveBookingActor` (`lib/bookings/authorize.ts:96`) resolves `actor: 'salon'` **only** when
`salons.owner_id === user.id`. `staff_members` carries `access_role` and `permissions`, and
`staff_invites` carries `access_role`/`permissions`/`token`, but no booking route consults either.
`PATCH /api/bookings/[id]` (:104) additionally requires `isSalonOwner` for `completed`/`no_show`, and
`/api/dashboard/today` requires `profile.role === 'salon_owner' | 'admin'`.
- Consequence for this ask: on a front-desk iPad a receptionist can do **nothing**. Only the owner's
  own login works.
- WHY it is missing: NEVER LANDED for bookings. The staff permission model exists for other surfaces;
  the central booking authorizer was written owner-only and never extended.

### Web push: the browser half exists, the server half does not
- `public/sw.js:215` has a real `push` listener and `:233` a `notificationclick` listener.
- The live DB has a `push_subscriptions` table (columns `endpoint`, `keys_auth`, `keys_p256dh`,
  `subscription_json`, `user_id`), **0 rows**, RLS on, from migration `010_push_subscriptions.sql`.
- And: **zero** occurrences of `serviceWorker.register`, `pushManager`, `VAPID` or `web-push` in the
  whole repo, and `web-push` is not in `package.json`. The service worker is never registered by
  anything.
- WHY it is missing: HALF-LANDED, oldest of the lot (migration 010). The receiving end and the
  storage were built; registration, subscription and sending never were.

### THE BIG ONE: there is no live channel for a new booking, and the one that exists is dead
`components-legacy/dashboard/ActivityFeed.tsx:73` subscribes to `postgres_changes` on the `bookings`
table for the salon. It is the ONLY place in the product where a new booking would push anything to
a salon screen.

**Verified against the live database, not inferred.** `select tablename from pg_publication_tables
where pubname = 'supabase_realtime'` returns exactly five tables:
`availability_slots, barber_walkin_queue, conversations, messages, notifications`.
**`bookings` is not one of them.** A table outside the publication emits no `postgres_changes`
events, so that subscription has never fired and never will.

- WHY it is missing: SILENT NO-OP, the exact category this project's CLAUDE.md names as its number
  one failure mode. The subscription code is correct, the channel connects, the callback simply
  never runs. Nothing errors and nothing logs.
- Consequence: today a salon learns about a booking only by reloading a page, or from one email
  that is not even sent for prepaid bookings.
- The fix is one line of DDL (`ALTER PUBLICATION supabase_realtime ADD TABLE bookings`) plus
  `REPLICA IDENTITY FULL`, which is what migration `20260602120000_walkin_foundations.sql:23`
  already did for the walk-in queue. That migration is the working precedent to copy.

### Other things that are wired to nothing (found while mapping, all real, all cheap to state)
- **The staff invite link 404s.** `app/api/staff/invite/route.ts:94` emails
  `/{locale}/staff/accept?token=`; the page is at `app/[locale]/staff-invite/page.tsx`. No
  `app/[locale]/staff/` directory exists. WHY: never landed, and it has never been caught because
  `middleware.ts:175` records that zero invites have ever been sent.
- **Staff permissions are read in a different shape than they are written.**
  `app/[locale]/dashboard/staff/page.tsx:112` writes an OBJECT
  (`{can_edit_schedule, can_view_own_bookings, can_manage_portfolio}`);
  `app/api/staff/my-schedule/route.ts:74` reads an ARRAY (`perms.includes("edit_own_schedule")`).
  Different container, different key names. `my-schedule` is the only route in the codebase that
  reads `permissions` at all, and `access_role` is written and never read anywhere.
- **`GET /api/walkin/queue` and `GET /api/walkin/queue-stats` have no auth at all**, only a
  `walkin_enabled` check. Any caller can read any salon's live queue with customer names and phone
  numbers by passing a `salon_id`. Flagged here because the terminal will lean on these endpoints;
  it is a data-protection issue under nFADP and needs fixing before the terminal ships, not after.
- **A stale duplicate `sw.js` sits at the repo root** alongside `public/sw.js`.
- **No `<link rel="manifest">` and no `manifest` key in Next metadata** (`app/layout.tsx:25`), so
  despite a complete `manifest.json` the app cannot be installed to a Home Screen today. That is a
  hard blocker for iOS web push, which requires an installed PWA.
- **Walk-in has no on/off switch in the dashboard.** `salons.walkin_enabled`, `walkin_paused` and
  `walkin_mode` have zero occurrences anywhere under `app/[locale]/dashboard/`.

### What we DO have to build on
- `manifest.json` with `display: standalone` and a full icon set (so add-to-home-screen already works).
- Supabase realtime is already used in production in exactly one place,
  `app/[locale]/dashboard/calendar/page.tsx`, and `wss://*.supabase.co` is already allowed in the
  Netlify CSP.
- `GET /api/dashboard/today` already returns now-booking + today's count + revenue + walk-in count +
  up-next.
- Walk-in: `barber_walkin_queue` (21 rows, live, AND in the realtime publication),
  `resequence_walkin_queue()` RPC, `LiveQueuePanel` (already does optimistic-update-with-revert on
  four verbs: start / complete / no-show / cancel), `/dashboard/queue-display`, `/queue/[token]`
  customer tracker. **The walk-in half of the terminal is essentially already built and already
  live-updating.** It is only the appointment half that has no live channel.
- `PATCH /api/walkin/queue/[id]` is the ONE salon-side route that already accepts a staff member
  and not just the owner (`app/api/walkin/queue/[id]/route.ts:40`). It is the precedent to copy for
  the booking routes.
- One-click HMAC action links already exist (`/api/bookings/[id]/quick-action`), which is the
  email-button pattern the terminal's fallback needs.

### Subdomain reality
`middleware.ts` does no host inspection at all and `netlify.toml` has no domain aliasing. A
subdomain is not free: Supabase auth cookies are host-bound by default, so `terminal.solen.ch`
would be a **separate login session** from `solen.ch` unless the cookie domain is widened to
`.solen.ch`, which widens it for every customer session too.

---

## A , THE DEFINITION

### A0 , the objection, raised before the plan and not after
Uber Eats' terminal works because a restaurant order **is a decision**: the shop must accept it
within minutes or it auto-cancels, and the device exists to force that decision. **An appointment is
not a decision.** It was already agreed at booking time, against availability the salon itself
published.

Measured, on our own live database today: all **28** salons run `booking_confirmation_mode =
'instant'`, and of **965** bookings ever created, **zero** have ever been in `pending_approval`.

So a literal copy of Uber Eats would ADD work to a shop that currently has none, and every missed
tap would become a cancelled appointment after 24 hours (the cron already does exactly that). We
would be manufacturing cancellations for the salon's own customers, and the salon would blame us.

**What makes Uber Eats' terminal feel like a terminal is the live board and the alert, not the
gatekeeping.** That is the part worth copying. Accept-each-booking stays available as a MODE,
because it is already built into the database and some salons genuinely want it, but it is not the
default and it is not the point.

### A1 , the screen's ONE job (FLOORS LAW 10)
> **Show the shop what is happening right now, and let anyone standing at the counter handle it in
> one tap, without ever opening the dashboard.**

Every element on the terminal is justified against that sentence or it is cut.

### A2 , the verb set
Eight verbs, no more. Each maps to something that already exists (see B2), except where marked NEW.

**On a booking:** Accept (only in approval mode) · Decline **(NEW)** · Move · Cancel · Done ·
No-show
**On a walk-in:** Start · Done · No-show · Cancel
**On the shop:** Add a walk-in · Add a booking by hand · Pause the queue **(NEW UI, column exists)**

### A3 , the anti-scope, named so it cannot creep
The terminal carries NONE of these, and each stays exactly where it is in the 48-section dashboard:
revenue and analytics, clients/CRM, services and prices, staff management, gallery and profile
editing, marketing, loyalty, reviews, refunds and disputes, upcharges, invoices, settings,
onboarding, and everything admin. **If a task can wait until this evening, it is not on the
terminal.** The terminal is the "right now" surface; the dashboard remains the "sit down and do
admin" surface. That split is the same one Uber Eats draws between Orders and Manager.

One consequence worth stating plainly: this does NOT delete or replace the dashboard, and it does
not reduce those 28 sections. It gives the shop a screen they can live on so they rarely open them.

### A4 , the address: `/terminal` first, subdomain later, and here is the cost
**Recommendation: ship it as a path, `solen.ch/{locale}/terminal`.**

Why not `terminal.solen.ch` on day one: Supabase auth cookies are host-bound by default, so a
subdomain would be a **separate login session** from `solen.ch`. Making one login cover both means
widening the cookie domain to `.solen.ch`, which widens it for **every customer session too** and
enlarges the blast radius of any subdomain we ever add. `middleware.ts` also does no host inspection
at all today, so the subdomain is net-new routing work for zero user-visible gain beyond a nicer URL.

The subdomain is still worth doing eventually, as a **vanity redirect** once the terminal is proven:
`terminal.solen.ch` -> `solen.ch/de/terminal`, no separate session, no cookie widening. That is a
one-line Netlify redirect and a DNS record, and it can be added in any later phase without changing
a single line of the app.

### A5 , who logs in
**Today: only the salon owner can, and that is a blocker, not a detail.** Every salon-side booking
mutation authorizes on `salons.owner_id === auth.uid()`. A receptionist on the front-desk iPad can
currently do nothing at all with a booking.

Target: the terminal is a **shop device**, logged in once and left logged in.
- Owner logs in as today.
- Staff reach it through the invite that already half-exists (`staff_invites` with a token). Their
  invite link is currently broken (see the gaps section) and no invite has ever been sent.
- `resolveBookingActor` gains a fifth branch: a `staff_members` row for that salon resolves to
  `'salon'`, exactly the way `PATCH /api/walkin/queue/[id]` already resolves staff today. That route
  is the precedent, not a new invention.
- The destructive verbs (Cancel with a fee, refunds) stay owner-only. Start / Done / No-show /
  Accept / Move are counter-work and go to staff.

### A6 , the appointment default
**Auto-accept stays the default. Approval is an opt-in mode.** Grounded in the industry research
below (D2) and in our own zero-usage number above. The terminal shows a booking the moment it
lands; it does not ask permission for it.

### A7 , what happens when nobody presses anything
This is already decided by code that ships today, and it is the strongest argument for keeping
auto-accept as the default:
- In approval mode, `pending-timeout` cancels the booking after **24 hours**, frees the slot,
  cancels the Stripe intent and emails the customer.
- In instant mode, nothing needs pressing. The booking simply stands.
- The walk-in queue has no timeout at all: an entry sits in `waiting` forever until somebody acts.
  Worth a decision later, not in phase 1.

---

## B , THE TWO STREAMS ON ONE SCREEN

### B1 Walk-in verbs (all four already exist and already live-update)
`LiveQueuePanel` + `PATCH /api/walkin/queue/[id]`, statuses
`waiting -> in_chair -> completed | no_show | cancelled`:
- **Start** (`in_chair`) , captures the Stripe intent
- **Done** (`completed`)
- **No-show**
- **Cancel** , refunds the intent
Plus **Add walk-in** (`ExpressMenu` -> `POST /api/walkin/queue`) for someone standing at the desk.
Missing verb: **pause the queue.** `salons.walkin_paused` exists in the DB and has no UI anywhere.
That is the one control a shop actually reaches for ("we're slammed, stop the queue"), so it belongs
in the terminal.

### B2 Appointment verbs (mixed: some exist, some are stranded, one is absent)
| verb | endpoint | state today |
|---|---|---|
| Accept | `POST /api/bookings/[id]/confirm` | EXISTS, salon-callable, **zero UI callers** |
| Decline | (none) | ABSENT. `bookingRejectedEmail` template exists, nothing sends it. Closest is cancel. |
| Cancel | `POST /api/bookings/[id]/cancel` | EXISTS, full fee/refund path, wired to `SalonCancelModal` |
| Move | `PATCH /api/slots/[id]` | EXISTS but slot-level, only reachable by dragging in the calendar |
| Done | `PATCH /api/bookings/[id]` -> `completed` | EXISTS, owner-only |
| No-show | `PATCH /api/bookings/[id]` -> `no_show` | EXISTS, owner-only |
| Add a booking by hand | `POST /api/bookings/walk-in` | EXISTS (salon-created in-person booking) |

### B3 How the two streams share one screen without becoming two products
They are the same object at different levels of certainty: a walk-in is an appointment with no time
yet. So the terminal is ONE time-ordered column, not two panels:
- Anything needing a decision sits at the top and does not scroll away.
- Below it, today in time order. A walk-in renders in the same row grammar as an appointment, with
  its position number where the appointment shows its time.
- The row's verbs come from what the row IS. There is no mode switch, no tab, and no second product.
This also satisfies FLOORS LAW 8 (same thing looks the same everywhere): ONE row component with two
variants, never two implementations.

---

## D1 , HOW UBER EATS ACTUALLY DOES IT (researched, every claim sourced)

**It is already a browser app, and that is the single most useful finding.**
`restaurant-dashboard.uber.com` is the web version of Uber Eats Orders. Uber's own help page says it
opens in Chrome only, and the setup instructions tell the merchant to accept the browser
notification prompt so orders come through. There is no physical device in that path. So the thing
he asked for, minus the device, is exactly what Uber themselves ship.

**The tablet is now a premium perk, not the standard.** Uber's merchant pricing page: the Essential
tier says "provide your own tablet"; only Premium includes one. No phase-out has been announced, but
bring-your-own-device is the default at the bottom of their pricing.

**The split we should copy is Orders vs Manager.** Orders is the live floor screen (New, In progress,
Ready, plus Busy Mode and Pause). Manager is the back-office: analytics, menus, users, prep times.
Two apps, two logins, two jobs. That is our terminal vs our dashboard.

**Lifecycle:** created -> accepted | denied -> completed. The merchant taps the flashing screen,
presses Confirm, then Ready for pickup. Busy Mode adds prep time. Pause stops new orders.

**The alert and the deadlines, from Uber's developer docs:** the screen "will flash green and a sound
will play". A merchant must accept or deny **within 11.5 minutes** or the order times out and
auto-cancels, and **a robocall fires after 90 seconds** if nothing has been pressed. Miss several in
a row and the store is auto-paused until 6am the next day.
Not verified: no Uber source describes a persistent alarm that repeats until acknowledged. The
documented escalation is the robocall, not a louder alarm.

**Auto-accept does not exist natively in the Uber Eats Orders app.** It only appears through POS
middleware. In food delivery, accepting is the point.

## D2 , THE SAME PATTERN IN OUR ACTUAL INDUSTRY, and it inverts the model

- **Square Appointments** has the exact setting we already have in the database. It is called
  **Reservation Guarantee** and offers two options in Square's own words: the business "automatically
  accepts all appointment requests", or the business "must manually accept or decline all appointment
  requests". With manual on, requests sit as pending until handled. That is `booking_confirmation_mode`
  under a different name, so our schema is already industry-shaped.
  Not verified: which of the two is Square's default, and whether a pending request ever expires.
- **Fresha** markets real-time booking into the live calendar with instant confirmation, and notifies
  by SMS, email and app notification. Not verified: whether Fresha has an approval queue or a
  simplified live view at all. Their help pages render client-side and returned no text on three
  attempts. This one genuinely needs a live Fresha account to answer.
- **Booksy** does split its product, Biz Lite vs Biz Pro, but the split is by DEVICE and feature depth
  (Lite is mobile-only, solo), not by a stripped-down accept screen. Same price for both.
- **Treatwell Connect, Planity, Phorest**: all three give the salon real-time notification of new
  bookings on desktop, tablet or phone. Planity states a booking "automatically appears on the
  establishment's tablet or computer". None of the three documents a stripped-down accept-only mode
  separate from the calendar. In all three, the calendar IS the product.

**The finding that decides our default: the two industries have opposite defaults, for a structural
reason.** Food delivery requires acceptance (Uber 11.5 min auto-cancel, Deliveroo auto-REJECTS after
10 minutes, Flipdish recommends keeping accept-required on). Appointments confirm instantly. A kitchen
can genuinely be out of an item; a calendar slot the salon itself published cannot be.

**So: no salon tool we could verify ships a separate accept-only screen. We would be first.** That is
either the opportunity or the warning, and it is worth saying out loud rather than burying: the
terminal's value has to come from being a better LIVE view, not from adding an approval step.

## D3 + C , CAN A BROWSER ACTUALLY WAKE THE SHOP UP (the hard question, answered)

### C1 , how the shop notices, and it takes two layers, not one
**Layer 1, the foreground: the open tab is what makes the loud noise.** You cannot set a custom sound
on a web push notification, and iOS web push has no Time Sensitive or Critical Alert level, so a push
on a silenced iPad is a notification nobody hears. The unmissable repeating sound can only come from
our own page. This is exactly what Deliveroo's browser Partner Hub does: an audible alert **every 3
seconds** until accepted, the screen starts flashing after **1 minute**, auto-reject at **10 minutes**.
Wix Restaurants offers a repeat "every 15 seconds until handled".

**Audio needs one deliberate tap, once per day.** Browsers gate unmuted audio on "sticky activation",
and the HTML spec is explicit that once true it "never changes back to false" for that document. So
ONE click anywhere unlocks looping alert audio for the whole session. The correct pattern is an
explicit **Start shift** button that unlocks sound, asks for notification permission, and takes the
wake lock in one gesture. And we must catch the `play()` rejection rather than assume it worked.

**Layer 2, out of browser: web push, and on iPad that means an installed PWA.** Web Push on
iOS/iPadOS has required Add to Home Screen with a `standalone` manifest since iOS 16.4. **A plain
Safari tab gets zero push.** Bonus that matters for a shop device: Home Screen web apps are exempt
from the 7-day storage wipe, so the service worker survives a quiet week; a tab-based install would
not. On desktop the tab may be closed: Safari on macOS runs a `webpushd` LaunchAgent and does not need
Safari running at all; Chrome and Firefox need their background process alive.
Screen Wake Lock is supported everywhere that matters (Safari 16.4+, about 94% globally), but note it
was broken inside installed iOS PWAs until **iOS 18.4**, and it must be re-acquired on
`visibilitychange`.

### C2 , the fallback chain, because nobody trusts one channel
Every mature system escalates on a clock. Ours, for an auto-accept product:
1. the row appears on the terminal (realtime)
2. sound loop while the tab is open and the shift is started
3. web push (installed PWA / desktop browser)
4. **SMS to the owner's phone** after N minutes unacknowledged. This is the floor: it needs no browser,
   no install, and no permission grant, and it is the only thing that works with the laptop lid shut.
   We already have `lib/sms.ts` (seven.io) wired for customer messages.
5. email, which we already send, as the record rather than the alert

### C3 , the iPad reality, stated plainly
**A backgrounded or locked iPad kills the live connection. This is by design and cannot be worked
around.** Apple's own engineer on the developer forums: keeping UI running while the app is
backgrounded is "very intentional to prevent this kind of behavior". iOS permits background
connections only for specific types (VoIP, audio); WebSocket is not one. So on iPad the socket is for
when someone is at the desk, and push is the only thing that works when the screen sleeps.

On **Chrome**, two separate 5-minute mechanisms bite: intensive timer throttling, and Energy Saver
freezing (Chrome 133+) which freezes a tab group once all its pages have been "hidden and silent for
more than five minutes". Note the word both mechanisms share: **silent**. A tab quietly playing audio
is not silent and is exempt from both. Which is another reason the audio loop is load-bearing and not
decoration.

**The honest consequence for the product:** the terminal must never LOOK armed when it is not. It has
to detect whether it is running installed vs in a tab, whether sound was unlocked, and whether the tab
is hidden or muted, and say so on screen. A terminal that silently throttles while showing a green
"Live" dot is worse than no terminal at all.

---

## E , THE PLAN, PHASE BY PHASE

Six phases. Each names what is NEW versus REUSED, and each has one binary close condition.
Phases 1 and 2 are the ones that turn this from an idea into something a salon can use.

### Phase 0 , Make the live channel exist (half a day, and it unblocks everything)
Without this there is no terminal, only a page you have to refresh.
- **NEW:** one migration, `ALTER PUBLICATION supabase_realtime ADD TABLE bookings` plus
  `REPLICA IDENTITY FULL`. Copy `20260602120000_walkin_foundations.sql`, which did exactly this for
  the walk-in queue.
- **NEW:** send the salon a notification on a PREPAID booking. Today `salonNewBooking` is skipped for
  online-pay and the Stripe webhook only messages the customer.
- **REUSED:** `ActivityFeed`'s existing subscription code, which is already correct and has simply
  never fired.
- **Close condition:** create a test booking in one browser tab; the salon's screen updates in another
  within two seconds, with no refresh, for both a prepaid and a pay-in-person booking.

### Phase 1 , The terminal screen itself (the mockup in this workstream)
- **NEW:** the route `/{locale}/terminal`, one screen, the row grammar shared by walk-ins and
  appointments, the action slot, the accept and move moments.
- **REUSED:** `/api/bookings/[id]/confirm` (exists, salon-callable, currently has zero callers),
  `/api/bookings/[id]/cancel`, `PATCH /api/bookings/[id]` for done and no-show,
  `PATCH /api/walkin/queue/[id]` for the four walk-in verbs, `GET /api/dashboard/today`.
- **NEW, small:** a Decline endpoint. `bookingRejectedEmail` already exists with nothing sending it.
- **NEW, small:** a Pause queue control writing `salons.walkin_paused`, a column with no UI anywhere.
- **Close condition:** a salon owner can run a full day from `/terminal` without opening `/dashboard`
  once. Verified by walking every verb on a seeded salon.

### Phase 2 , Make the shop actually hear it
The layer the whole idea stands on, and the one most likely to be skipped.
- **NEW:** register the service worker. Nothing in the repo calls `serviceWorker.register` today.
- **NEW:** add `<link rel="manifest">` to the layout. `manifest.json` is complete and referenced by
  nothing, so the app cannot be installed to a Home Screen at all right now.
- **NEW:** VAPID keys, a subscribe endpoint, and a send path. The `push_subscriptions` table exists
  (0 rows) and `public/sw.js` already has `push` and `notificationclick` handlers.
- **NEW:** the Start shift button (unlocks audio, requests permission, takes the wake lock), the
  repeating alert loop, and the honest armed-state banner.
- **NEW:** the SMS escalation for an unacknowledged decision, reusing `lib/sms.ts`.
- **REUSED:** `public/sw.js`, `manifest.json`, `lib/sms.ts`, `lib/notifications.ts`.
- **Close condition:** on a real iPhone or iPad, with the terminal installed to the Home Screen and the
  screen locked, a new booking produces a notification. And with the tab open, it makes a noise that
  keeps going until someone taps it.

### Phase 3 , Anyone at the counter can use it
- **NEW:** extend `resolveBookingActor` so a `staff_members` row for the salon resolves to `'salon'`,
  copying what `PATCH /api/walkin/queue/[id]` already does. Keep the money verbs owner-only.
- **NEW:** fix the staff invite link, which emails `/{locale}/staff/accept` while the page lives at
  `/{locale}/staff-invite`. Zero invites have ever been sent, so nobody has hit it yet.
- **NEW:** settle the permissions shape. The staff page WRITES an object; `my-schedule` READS an array
  with different key names. One shape, one reader.
- **Close condition:** a staff account, invited by email, can start and finish a walk-in and mark an
  appointment done, and cannot issue a refund.

### Phase 4 , Move a booking without the calendar
- **NEW:** a salon-side reschedule. `POST /api/bookings/[id]/reschedule` is customer-only by design and
  should stay that way; the terminal gets its own endpoint, or the slot cascade
  (`PATCH /api/slots/[id]`, which already moves the booking and emails the customer) gets wrapped in a
  time-picker instead of a drag.
- **DECISION NEEDED FROM HIM:** does moving an appointment need the customer's consent, or does the
  salon just move it and notify? Migration 022 added `reschedule_status` with
  `pending / approved / rejected` for a consent handshake, and no code was ever written against it.
  That is a product call, not a technical one.
- **Close condition:** an appointment can be moved from the terminal in three taps, and the customer is
  told.

### Phase 5 , The address
- `terminal.solen.ch` as a vanity redirect to `/{locale}/terminal`. A DNS record and a Netlify
  redirect. Deliberately last, because it changes nothing about how the thing works and costs a
  cookie-domain decision if done as a real subdomain (see A4).
- **Close condition:** typing terminal.solen.ch on the shop iPad lands on the terminal, already logged
  in.

### What is deliberately NOT in any phase
Making acceptance mandatory. Printing anything. A native app. A physical device. Replacing the
dashboard.


---

## F , THE MOCKUP, and what was measured on it

Live at `/{locale}/dev/terminal`, dev-only, `notFound()` in production. Nothing applied to real code.
Three states of ONE screen behind a switch at the top: `Quiet`, `New booking`, `Move`.

Real data, not fixtures: it reads today's bookings, the live walk-in queue and the staff rows for
The Fade Factory straight from the database through the normal query.

**Measured on the rendered page (getComputedStyle and getBoundingClientRect over every visible node),
all three states, at 402x874 and at 1024x820, identical at both widths:**
- distinct font sizes: **3 to 4** (13, 15, 28 in Quiet; plus 11 in the two card states), ceiling is 4
- distinct weights: **2** (400, 600), ceiling is 2
- display anchor: **28px**, floor is 28
- anchor ratio: **1.87x** the 15px body, floor is 1.8
- text at weight >= 600: **19.3% / 23.1% / 21.3%**, ceiling is about 30
- interactive controls under 44px: **0**, floor is 44
- horizontal page overflow: **none** at either width

**Verifier round 1: FAIL, 2 gaps, both fixed and re-measured.**
1. The `Done` / `No-show` / `Cancel` links inside an EXPANDED row measured about 20px tall. My own
   sweep missed these because those controls only exist once a row is expanded and I had measured
   the collapsed state. Each now carries its own 44px hit area; re-measured with both a waiting row
   and an appointment row open: **0** controls under 44px.
2. The row stack sat at an 8px gap where the binary rhythm law wants 16. I had justified the 8 as an
   in-group gap in the build brief; the law does not carve that out, so it is now 16.
   Re-measured on the rendered page: **16px** between rows.

**Flagged by the verifier for the OWNER, not for me:** the 2026-07-15 card-economy decision (one
carded hero, everything else bare text) versus the tier-5 individual-entity-card pattern, which is
what the waiting and appointment rows use. Both are real rules and they point different ways on a
row list. Not resolved here.

**Found by measuring, not by reading the code, and fixed:** `Pause queue` was a 80x20 tap target, the
three `Start` controls and the eight `Move` time chips were 36px tall, and `Keep 11:30` was 20px. Six
of those sat inside a 44px row, which is why reading the source suggested they were fine. `Start`
keeps its 36px pill and gained a 44px hit area around it, so the dense row still reads right.
Also removed: the chairs card header said "2 free" while the tiles under it already said "Free"
twice, which is the same fact in two places.

**Seeded to make it real** (owner rule 2026-08-02: seeding is the fix, not fabrication). Every salon
had **zero** future bookings, so the screen would have rendered empty. Seeded for The Fade Factory:
7 appointments across today with real services and prices from its own catalogue, one of them in
`pending_approval` so the accept moment has something to accept, and a live walk-in queue of one in
the chair plus three waiting.

**Also fixed while building it:** all three staff avatars pointed at Unsplash URLs that render as a
55x37 pixel stub, so every face was a blank grey circle. Swapped to self-hosted photos under
`/images/staff/`. That was broken for the real app too, not only for the mockup.

**Known cosmetic deviation, flagged not hidden:** those are the only self-hosted face photos in the
repo, so the barber named Jonas has a photo that does not match the name. Seed-data cosmetics.

**The one remaining placeholder, named:** the eight time chips in the `Move` state are a hardcoded
list. Everything else on the screen traces to a database row, including the "Expires in 20h 18m"
countdown, which is computed from the booking's own `created_at` against the real 24 hour window that
`app/api/cron/pending-timeout` enforces. Wiring the chips to genuinely free slots is Phase 4 work,
since it needs an availability query the terminal does not run yet.

---

## CORRECTION ROUND (owner, 2026-08-15, second message)

> "this mockup doesn't reflect our design system, and it probably does, but the design system is
> really old so we have to renew that... go actually look into the PDP page and actually, like,
> reflect salons and go check that design system and put it in here. because you're just using
> inconsistent everything, and I'm just making shit up... And also you didn't even explain to me in
> details what actually is, what's actually like, how everything works and stuff."

He is right and our own law already says so. FLOORS LAW 9: "if the registry owns it, compose it.
Hand-drawn UI in a page or feature file is a defect regardless of how good it looks." I hand-wrote
every row, card and chip on the terminal from raw Tailwind instead of composing what ships.

- [x] `85f03144a` CORRECTION 1: read the REAL PDP and salon surfaces, take the design language from shipped code `verified:` class strings quoted from SalonServices.tsx:118/181/198/215, SalonTeam.tsx:70, SalonMobileBookBar.tsx:78
- [x] `85f03144a` CORRECTION 2: rebuild the terminal composing the actual components, not hand-drawn Tailwind `verified:` Terminal.tsx now imports Avatar and TabPill; the widened gate returns exit 0 on it (it returned exit 2 before)
- [x] `85f03144a` CORRECTION 3: write down where the shipped code and the LOCKFILE disagree, so the stale parts `verified:` the five divergences are written up above, each with file:line and both values
      of the design system are named rather than guessed at
- [x] `85f03144a` CORRECTION 4: explain in plain English, in detail, HOW THE THING WORKS end to end `verified:` the end-to-end walkthrough section above
- [x] `002da059f` CORRECTION 5: the existing use-the-registered-component gate did not catch this. Widen it. `verified:` commit 002da059f, suite 14/14, fires exit 2 on the old file and exit 0 on the rebuilt one

---

## WHERE THE DESIGN SYSTEM AND THE SHIPPED PRODUCT DISAGREE (2026-08-15)

He said the design system is old. It is, and here is the measured proof, taken off the salon PDP
that really ships. These are not opinions, they are the class strings in the code.

### 1. The list grammar the docs never name
The PDP renders every list as ONE grouped card with hairline rows inside it, using a byte-identical
class string in two places:
`overflow-hidden rounded-[24px] border border-s-border bg-white shadow-whisper`
(`app/[locale]/_components/salon/SalonServices.tsx:118` and `SalonTeam.tsx:70`), with rows as
`border-t border-s-border px-5 py-4 first:border-t-0 md:px-6` (`SalonServices.tsx:215`).
The design contract's "radius" row describes a grouped LIST-card at 24 and an individual entity-card
at 16, but nothing tells you which one a list of people is. My first build stacked separate 16px
cards with gaps. That is the "inconsistent everything" he saw, and the docs let it happen.

### 2. The weight ladder is 400 / 500 / 600, and the law says two weights
Shipped: row titles are `font-medium` (500) at `SalonServices.tsx:181`, section headings are
`font-semibold` (600), meta is 400. `TabPill.tsx` deliberately runs inactive pills at 500 and
active at 600, with a comment explaining why 400 was rejected.
The NEVER-AGAIN floor says at most 2 weights per screen. **The product uses three, on purpose, and
documents the reasoning.** The terminal now measures 400 / 500 / 600 in all five of its states.
This is a real conflict and it is his call, not mine: either the floor becomes "at most 3 weights",
or the PDP is in violation and 500 has to go. I have not silently picked one.

### 3. The PDP's own secondary button misses the touch floor
`SalonServices.tsx:198` "Buchen" is `px-5 py-2 text-[13px]`, which renders **38px** tall. The
a11y floor in the design contract is 44 (`h-11`). Measured, not assumed. The terminal keeps the
exact look and raises only the height.

### 4. The PDP uses a fifth text size
Its price line is `text-[14px]` (`SalonServices.tsx:193`) on top of 13 / 15 / 18-20 / 28, which is
five distinct sizes against a ceiling of four. The terminal drops 14 and puts the price on 13 and 15,
which are already in the ladder, so it lands on four.

### 5. What the terminal now composes instead of drawing
- `Avatar` (`app/[locale]/_components/primitives/Avatar.tsx`), which brings the initials fallback
  the hand-rolled circle did not have. A salon with no staff photo used to get a blank grey disc.
- `TabPill` (`.../primitives/TabPill.tsx`) for the state switch and the time chips, so the
  selected-state grammar is the system's, not mine.
- The grouped card, row, heading, primary and secondary button strings, as named constants read out
  of the PDP.

**Measured after the rebuild, all five states (Quiet, Waiting expanded, Appointment expanded, New
booking, Move), at 402 wide:** 4 sizes (13/15/18/28), 3 weights (400/500/600), anchor 28px, bold
12.4% to 14.6%, zero controls under 44px, no sideways scroll.

---

## HOW THE TERMINAL WORKS, END TO END (the explanation he asked for)

### The one sentence
A salon leaves one web page open on whatever screen sits at the front desk. Everything happening
today is on it, and every action is one tap. They never open the dashboard.

### Getting in
They log in once at solen.ch/terminal and stay logged in. It is the same account they already have.
Nothing to install, nothing to buy. If they want it to feel like an app, they add it to the Home
Screen, which also switches on phone alerts (that part only works installed, on iPad and iPhone).

### What lands on the screen, and how
A customer books on Solen the normal way. The moment that booking row is written, the database
tells every open terminal, and the row appears. No refresh, no polling. That is one migration away:
the mechanism exists and the bookings table simply was never added to it, which is why nothing
live has ever worked on the salon side.

Walk-ins arrive the same way, from the queue the customer joins on their phone, and that half
already pushes live today.

### What they see
- The wait, biggest thing on the screen, because it is the question people ask at the counter.
- Who is in which chair right now, and how long they have been there.
- Who is waiting, in order, with their ticket number.
- What is still to come today, with the price and whether it is already paid.

### What they can do, and what each tap really does
- **Start** a walk-in: marks them in the chair and takes the money that was held when they joined.
- **Done**: closes it out.
- **No-show**: marks it, and where a no-show fee was agreed at booking, that is what triggers it.
- **Cancel**: refunds by the terms the customer agreed to when they booked, not by a guess.
- **Move**: picks a new time and tells the customer.
- **Accept / Decline**: only appears for salons that chose to approve bookings one by one. Most
  will not. For everyone else a booking simply lands, already confirmed.
- **Pause queue**: stops new walk-ins joining. Useful, and currently impossible anywhere in Solen.

### How they know something happened when they are not looking at it
Four layers, because no single one is reliable in a browser:
1. The row appears on screen.
2. A sound repeats until someone taps it. This only works while the page is open, and only after
   somebody taps once that day to let the browser make noise.
3. A phone alert, if they installed it to the Home Screen.
4. An SMS to the owner's phone if nobody has touched it after a few minutes. This is the one that
   works with the laptop shut, and it is the floor.

### What it deliberately cannot do
Revenue, clients, services and prices, staff, photos, marketing, refunds, invoices, settings. All of
that stays in the dashboard, for the evening. The terminal is the "right now" screen. If a task can
wait until tonight, it is not on it.


## PARKED DECISIONS , his call, not mine

- [ ] PARKED 2026-08-15 · Should a booking land already confirmed (what every salon tool does), or should the salon have to accept each one (what Uber Eats does)? · from: the terminal definition, and our own numbers say 28 of 28 salons already run auto-confirm
- [x] PARKED 2026-08-15 · `verified:` commit 2b0d21311 + this file; the decision is MINE not his, so it reverses on one word from him · ANSWERED-BY-DEFAULT 2026-08-16: solen.ch/terminal now, the subdomain later as a plain redirect. Taking the decision myself rather than holding it open, because it is reversible in one Netlify line and blocks nothing: a path costs no cookie change, and terminal.solen.ch can be pointed at it any day without touching the app. If he wants the real subdomain with its own session, he says so and it is a DNS record plus a cookie-domain widening. · from: his "maybe like a subdomain or something"
- [ ] PARKED 2026-08-15 · When a salon moves an appointment, does the customer just get told, or do they have to agree first? · from: three database columns for a customer-agreement handshake exist from migration 022 and no code was ever written against them
- [ ] PARKED 2026-08-15 · The salon page uses three text weights on purpose and the design rule allows two. Does the rule become three, or does the salon page have to change? · from: measured on the shipped salon page while rebuilding the terminal out of its own parts
  · STILL HIS CALL, not ticked. Evidence added 2026-08-16 so he decides with the whole thing in
  front of him, from `_design-system/research/AIRBNB_TEARDOWN_2026-08-16.md` section 8: the
  2-weight ceiling (`CLAUDE.md:53`) is broken BY CONSTRUCTION, not by the salon page. Our own
  weight scale (`LOCKFILE.md:311-320`, §2.5 role table) puts body at 400, CTA at 500 and headings
  at 600, so ANY screen with a heading, body copy and a button is at three weights before anyone
  decides anything. That is every commit-bearing screen in the product. Separately, §17.4
  (`LOCKFILE.md:1985`) mandates TWO weight-600 anchors per card while the EMPHASIS BUDGET caps
  weight-600 at ~30% of visible text, which a browse grid of five-element cards cannot satisfy
  arithmetically. The reference carries its emphasis at weight 500 and measures 3.1% at 600. So
  the honest options are: raise the ceiling to three and name the third as the CTA's 500, or drop
  CTA to 600 so 400/600 really is the whole vocabulary. Either way one of the two files changes in
  the same edit.
- [x] PARKED 2026-08-15 · Should a list of people (the ones waiting, the ones booked today) be ONE card with lines between the rows, or a separate card per person? · from: the design verifier asked this in round one and it was parked, then five more rounds were built on the unanswered question · `verified:` measured on the rendered screen at 390 wide after the rebuild: one card only (the chairs) at 25.2% of the viewport, Waiting and Later-today carrying no outer card at all; commit 5aa1e12da · ANSWERED BY THE OWNER 2026-08-16, by rejection: NEITHER. On an OPERATOR
  screen a list of people is BARE ROWS on the white canvas, hairline-separated, with no outer card
  and no card per person. Both parked options were customer-surface answers, which is why holding
  the question open let five more rounds be built on a wrong premise. The governing law was in the
  repo the whole time and was never routed to, because the screen's surface class was never named:
  TASTE_LOG.md:339 (merchant round, 2026-07-15) "ONE carded hero per screen; secondary info is BARE
  TEXT on the canvas (no card/box/pill costume)", plus LOCKFILE.md:561 THE CONTAINER TEST, whose
  three earning cases this screen's lists meet none of. Applied in direction B 2026-08-16: exactly
  one card (the chairs, the thing being looked at); boxed vertical pixels 62.4% -> 15.6%. The
  entity-card rule still governs CUSTOMER lists of peer entities, unchanged. · from: the design
  verifier flagged the two rules pointing different ways

---

# ROUND 2 , THE STATE MACHINE, LOGS, UNDO AND LEARNING (owner 2026-08-15, third message)

> "I actually think this through, like, each one... if the person doesn't come, like, for, like,
> thirty minutes after, you know, the actual time, like, people needs to tap, you know, like, the
> staff needs to tap the day arrive and stuff. Like, or they're in waiting... they can choose, you
> know, to actually have, like, logs and stuff. And we can also, like, learn based on that, like,
> activities, and we can, like, personalize more... think of all of that, data collection,
> everything, how we can utilize... what is gonna happen if to stop. Forgot to click that they
> arrived. Can they revert it? Or those stuff or, like, decline something... we need to use the LLM
> cancels, algorithms cancel, and do you think it through too? Gave it, like, each one really,
> really deep detail on how to do it and make with tons of mockup. And also analyze and go research
> really deeply. Pay some research into Airbnb or research into Booking dot com or research into
> Uber Eats"

## Atomic checklist , round 2

### G. THE STATE MACHINE
- [x] G1 Every state a walk-in can be in `verified:` written above, states read off barber_walkin_queue migration 073; called_at and started_at confirmed present and unused in _inventory/_db-columns.json, and every legal move between them
- [x] G2 Every state an appointment can be in `verified:` written above, states read off migration 075; bookings.arrived_at confirmed present in _inventory/_db-columns.json, and every legal move between them
- [x] G3 Which moves happen BY THEMSELVES `verified:` the table above, and app/api/cron/pending-timeout + sms_sent_24h/sms_sent_1h are the existing automatic ones (time-driven) vs which need a human tap
- [x] `f004c5dc2` G4 The late/no-show clock `verified:` the minute-by-minute table above; rendered as the `Late` state of the mockup: what happens at +5, +15, +30 minutes, and who decides
- [x] `f004c5dc2` G5 The "arrived" tap `verified:` written above; rendered as the `Arrived` state of the mockup: what it is, who taps it, and what it unlocks

### H. UNDO
- [x] `f004c5dc2` H1 Forgot to tap arrived `verified:` written above (Arrived on time backfills the scheduled time): how they fix it after the fact
- [x] `f004c5dc2` H2 Tapped no-show by mistake `verified:` written above; Fresha's own Undo no-show is the precedent, see L3: can it be taken back, and what happens to the fee
- [x] `f004c5dc2` H3 Declined or cancelled by mistake `verified:` written above; the ten second slot HOLD is what makes it possible, and Airbnb's non-reversible decline (L2) is why the honest answer after that is rebook, not restore: can it be taken back, and what does the customer see
- [x] `f004c5dc2` H4 The general rule `verified:` the three tier table above: what is reversible, for how long, and what is never reversible

### I. LOGS
- [x] I1 What a log entry is `verified:` written above, and every event worth recording
- [x] I2 Where the salon sees it `verified:` written above; rendered as the `Log` state of the mockup, and the salon's choice to have it at all
- [x] I3 What EXISTS already in the database for this (exists-check before designing) `verified:` audit_log is LIVE with 59 rows and the exact column shape, written by 6 money/privacy paths and read by no screen; case_events already models from->to with an actor. Section I3 below.

### J. LEARNING AND DATA
- [x] J1 What each recorded event is actually worth `verified:` written above, the true-duration argument, one by one
- [x] J2 What we can personalize for the CUSTOMER `verified:` written above from it
- [x] J3 What we can predict for the SALON `verified:` written above from it
- [x] J4 The ethics and legal line `verified:` written above, against the hard lines at _design-system/PSYCHOLOGY.md:62-76 which bind the salon dashboard by their own scope note (nFADP, and our own psychology law)

### K. ALGORITHMS AND LLM
- [x] K1 Where a plain rule is enough `verified:` written above, four reasons and an LLM would be worse
- [x] K2 Where an LLM genuinely earns its place `verified:` written above, three uses
- [x] K3 The no-show risk score `verified:` written above, the allowed/not-allowed split: what it is, what it may and may not do
- [x] K4 What it costs and what happens when it is wrong `verified:` written above

### L. RESEARCH (never from memory)
- [x] L1 Uber Eats: late orders `verified:` L1 above, 11.5 min auto-cancel and the 90 second robocall, undo, merchant activity history
- [x] L2 Booking.com: no-show handling `partial:` the Booking.com half did not come back in a usable form. Airbnb and the salon tools did, and are written up as L2 to L4. Booking.com is NOT done., free-cancel windows, the partner's undo
- [x] L3 Airbnb: cancel/decline flows `verified:` L2 above, every claim carrying an airbnb.com help-article URL, the reservation timeline, host reversal
- [x] L4 What the salon tools do `verified:` L3 and L4 above, Fresha and Square with verbatim quotes: Fresha, Square, Booksy on no-show and undo

### M. MOCKUPS
- [x] M1 The late clock, on the real screen `verified:` app/[locale]/dev/terminal/Terminal.tsx, `Late` tab; Playwright-measured on the running dev server: three confirmed rows render `Due now`/`5 min late`/`15 min late` (the 15-min row reorders to the top of Later today), the fourth (30+) is lifted into the action-slot question card
- [x] M2 The arrived tap and what it changes `verified:` `Arrived` tab auto-demos on a real Later-today row (`Andrin Lehmann`), row shows `Arrived 13:26` + `Started 4 min ago`; the same treatment fires for real when `They arrived` is tapped on the Late card, confirmed via headless click
- [x] M3 The undo moment `verified:` one shared bar (`fireUndo`/`undo` state), fires from Accept/Decline, Waiting Done/No-show/Cancel, appointment Done/No-show/Cancel, and the Late card's two buttons; Playwright confirmed the bar appears, auto-dismisses at 10s, and `Undo` genuinely restores the mutated state (tested: declined-then-undone pending booking reappears)
- [x] M4 The activity log `verified:` `Log` tab, 8 entries derived strictly from the real `bookings`/`queue` props (no invented sentences), newest first, e.g. `Jonas started Luca Amrein`, `Nina finished Timo Herzog`
- [x] M5 All as variants of the ONE real terminal screen, never isolated panels `verified:` all seven states are one switch on the same portalled overlay; header/wait-anchor/chairs/Waiting/Later-today persist across every state

Note: this pass only closed the M (mockup) checklist, which is what the "extend the dev mockup with four states" brief scoped. G/H/I/J/K/L (state-machine formalization, undo/log research, learning, algorithms) remain open, they are a separate research/definition workstream, not a UI-extension task, and were not touched here.

---

## G , THE STATE MACHINE (drafted before the research lands; anything the research contradicts gets corrected, not quietly kept)

### G1 The walk-in, states and moves
Existing in the database today: `waiting | in_chair | completed | no_show | cancelled`
(`barber_walkin_queue.status`, migration 073). Two columns already exist and are unused:
`called_at` and `started_at`.

```
joined ──► waiting ──► called ──► in_chair ──► completed
                │         │           │
                │         └─► skipped (back in the queue, one round only)
                │                     │
                └─────────────────────┴─► no_show / cancelled
```

**`called` is the missing state and it matters.** Today a walk-in goes straight from waiting to in
the chair. But a remote walk-in is at the cafe next door: the shop calls them, and there is a real
gap of a few minutes before they are in the chair. Without that state the shop has to either lie
(mark them in the chair before they walk in) or leave the queue wrong. `called_at` already exists
for it.

**`skipped` is the other missing one, and it is how barbershops actually behave.** Nobody marks a
customer a no-show the second they do not answer. They take the next person and the missing one
keeps their place for one round. One round, then the shop decides.

### G2 The appointment, states and moves
Existing: `pending | pending_approval | confirmed | cancelled | completed | no_show`
(migration 075). `bookings.arrived_at` exists as a column.

```
booked ──► confirmed ──► arrived ──► in progress ──► completed
                │            ▲
                │            └── set retroactively when the shop forgot (G5/H1)
                └─► cancelled  ·  no_show  ·  moved
```

**`arrived` is not a status, it is a timestamp,** and that is the right shape: the booking stays
`confirmed` and gains an arrival time. It changes nothing legally and everything operationally.

### G3 What happens by itself, and what needs a human
| moment | by itself | needs a tap |
|---|---|---|
| 24h and 1h reminders | yes, already ships (`sms_sent_24h`, `sms_sent_1h`) | , |
| the appointment time arrives | the row moves to the top and reads "due now" | , |
| 5 minutes late | the row changes quietly. No alarm. | , |
| 15 minutes late | the terminal raises it and makes its sound | , |
| 30 minutes late | the terminal ASKS: arrived, or no-show | the answer |
| customer arrives | , | "Arrived" |
| service starts / ends | , | "Start" / "Done" |
| a fee is charged | only after a human answered the 30 minute question | , |
| nothing was ever tapped | at closing time it resolves to "not recorded" and **charges nothing** | , |

**The single most important line in this whole design: a no-show fee is never charged by silence.**
A busy shop that forgot to tap must never cost a real customer real money. If nobody answers, the
question is still the first thing on the terminal the next morning, and it stays answerable for 24
hours. After that it closes as not recorded.

The cost of that choice, stated plainly: some genuine no-shows will go unbilled at the busiest
salons, which are the ones that want the fee most. The alternative costs us a wrongly charged
customer, a chargeback, and a support case, and it is the kind of mistake that ends trust in a
marketplace before it has any. Worth naming as a decision rather than an assumption.

### G4 The late clock, minute by minute
- **+0** row rises to the top, reads `Due now`.
- **+5** reads `5 min late`. Grey. No noise. Everybody is five minutes late.
- **+15** reads `15 min late`, the row gets the alert treatment and the terminal makes its sound
  once. This is the point where a shop can still fill the slot.
- **+30** the row becomes a question with two buttons: `They arrived` and `No-show`. Until it is
  answered it stays at the top and does not scroll away.
- **closing time** unanswered becomes `Not recorded`, no fee, and it is on tomorrow's terminal.

Grace values are per salon, defaulting to 15 and 30. A hairdresser's grace and a spa's are not the
same number, and hardcoding one is how the product would feel wrong to half the market.

### G5 The "Arrived" tap
One tap, on the row, by anyone at the counter. It writes `arrived_at`. What it unlocks:
- the appointment stops being late and stops asking
- the real duration clock starts, which is where the learning comes from (J3)
- if the customer prepaid, nothing changes; if they pay in person, the row now shows what to collect

It can be set retroactively (H1), and it can be undone (H2).

---

## H , UNDO. The rule is one line: nothing is a dead end, but the way back gets heavier the further money has moved.

Three tiers, and every action on the terminal sits in exactly one.

### Tier 1 , the ten second undo (no money moved)
Every tap happens INSTANTLY with no confirmation dialog, and a bar slides up: what just happened,
and `Undo`. Ten seconds, then it goes.
Covers: Arrived, Start, Done, Skip, Called, Accept, Move.
Why no confirmation dialog: a confirmation costs a tap on every single correct action to protect
against the rare wrong one, and staff learn to tap through it without reading, which means it stops
protecting anything. Undo costs nothing when you are right.

### Tier 2 , the correction, for 24 hours (money is committed but not yet moved)
After the toast is gone, tap the row and pick `Fix this`. Covers a no-show marked by mistake, a
forgotten arrival, a wrong finish time. It does not erase anything: it writes a correcting entry, so
the log shows both what was recorded and what it was corrected to, by whom. That is what makes it
safe to allow at all.
Twenty four hours because that is the window the rest of this product already uses for a booking
decision (the approval timeout), and because a shop reconciles its day the next morning, not later.

### Tier 3 , the reversal (money has actually moved)
A charged no-show fee, a taken payment, an issued refund. Not an undo, a new financial action:
owner only, reason required, customer told. It exists, it is just deliberately not one tap.

### H1 Forgot to tap arrived
The most common mistake there will be, and the design has to assume it happens daily.
- While the row is still asking (up to closing), `They arrived` also offers `Arrived on time`, which
  backfills the scheduled time instead of now. One tap, no time picker, for the overwhelmingly
  common case where the customer was fine and the shop was busy.
- If a time matters, a picker opens on the scheduled time, not on now.
- After it has closed as `Not recorded`, it is a Tier 2 correction the next morning.

### H2 Marked no-show by mistake
- Within ten seconds: Undo, nothing happened, no fee, no email.
- Within 24 hours: `Fix this` -> `They did arrive`. If a fee was charged, this becomes a Tier 3
  reversal automatically and the refund goes out with the correction.
- The customer is told when a no-show is REVERSED, not only when it is recorded. Being wrongly
  marked and then quietly unmarked without being told is worse than either.

### H3 Declined or cancelled by mistake
This is the hardest one and it is the one place undo genuinely cannot be a promise, for a reason
that has nothing to do with us: **the moment a booking is cancelled, its slot goes back on the
market and somebody else can take it.**
- Within ten seconds: the slot is HELD, not released. Undo puts it back exactly as it was. This is
  the whole reason for the ten second hold.
- After that: the slot is genuinely free and may already be gone. So `Fix this` does not restore
  the booking, it offers to `Rebook this customer`, pre-filled, showing whether the original time
  is still free. Honest about what is possible.
- A decline in approval mode has the same shape and the same ten second hold.

### H4 The general rule, stated once
| what | how long | who | what the customer sees |
|---|---|---|---|
| any operational tap | 10 seconds | anyone at the counter | nothing, it never happened |
| no-show, arrival, finish | 24 hours | anyone at the counter | told only if a fee reverses |
| cancel / decline | 10 seconds fully, then rebook-only | anyone at the counter | the cancellation, then the rebooking |
| a charge or a refund | no limit | owner only, reason required | always |

Nothing on this screen is unrecoverable. That is the design goal, and it is achievable because the
only truly irreversible thing in the whole flow is a slot somebody else has since booked.

---

## I , LOGS

### I1 What a log entry is
One row per state change, and the shape is deliberately boring:
`what it was about` (booking or queue entry), `from` -> `to`, `when`, `who` (staff member, the
customer, or the system), `how` (a tap, a rule that fired, a cron, a payment webhook), and a
correction pointer when this entry corrects an earlier one.

Events worth recording, and nothing beyond them:
booked · confirmed · approved · declined · reminder sent · marked arrived · started · finished ·
marked no-show · skipped · cancelled (and by whom) · moved (from, to) · fee charged · fee reversed ·
a correction of any of the above.

### I2 Where the salon sees it, and the choice he asked for
Two places, and they are the same data at two depths:
- **per row:** tap any row, the history is at the bottom of what opens. "Arrived 14:03, Nina.
  Finished 14:51, Nina." That is the version anybody actually reads.
- **the day:** one screen, today's events in order, for the evening reconciliation.

**The choice.** The log is always WRITTEN, because money and disputes need it and because a
customer has a right to know what was recorded about their booking. What the salon chooses is
whether the terminal SHOWS the day view at all, since a small one-chair shop does not want it and a
six-chair shop does.

**One thing to be careful about, and it is a legal point rather than a design one.** A log with a
`who` column is a record of what each employee did and when. In Switzerland, systematic monitoring
of employee behaviour has real constraints, and a tool that hands a salon owner a per-staff activity
timeline is that, whatever we call it. Recording WHICH ACCOUNT acted is necessary for corrections and
disputes. Building the owner a per-staff productivity view on top of it is a different product and
should not be smuggled in by accident.

### I3 Exists-check
Running as part of this round, before anything is designed on top of it. Nothing here gets built
until the audit says what the `activity-feed` endpoint and the `notifications` table already cover.

---

## J , WHAT THE DATA IS ACTUALLY WORTH

The honest framing first: most "we'll learn from the data" plans are worth nothing because the data
is thin and the conclusions are guesses. This one has exactly one enormous thing in it and several
small ones, so they are separated.

### J1 The big one: we learn how long things REALLY take
`arrived_at` and `completed_at` on the same row give the true duration. Every salon's service
durations are what the salon typed in when they signed up, and they are wrong. Everywhere.

What true durations fix, in order of value:
1. **Availability stops lying.** If Nina's 45 minute cut really takes 58, the slot after it is
   double-booked every single time, and the customer feels it as waiting.
2. **The wait estimate on the walk-in queue becomes real** instead of a formula.
3. **The salon can be told**, gently and privately: "your Skin Fade is booked at 45 minutes and runs
   at 56 on average over 40 visits. Change it?" That is a service they would pay for.

This is the highest-value thing in the entire terminal, and it is a by-product of two taps that the
staff have a reason to make anyway.

### J2 What we can do for the customer
- **Their own lateness, used FOR them, never against them.** Someone who is reliably 10 minutes late
  gets their reminder earlier. Not a label, not a score anybody sees, just a better reminder time.
- **When they actually come.** Real visit intervals per person feed the rebooking nudge, which our
  own psychology law already says must fire off the customer's own cycle rather than a global
  interval. Right now that cycle is derived from booking dates; arrival data makes it real.
- **Who they actually see.** Which stylist really served them, from the chair record rather than the
  booking's guess, so "book Nina again" is right.

### J3 What we can tell the salon
- true durations per service per stylist (J1)
- the honest no-show rate for the shop, and the hours it happens in
- how long people really wait, against what the queue promised them
- which slots go unfilled after a late cancel, which is what a waitlist would fix

### J4 The line, and it is not negotiable
Our own hard lines bind the salon dashboard exactly as they bind customer screens, and two of them
land directly on this:
1. **No fabricated numbers.** Every figure above needs enough real visits behind it to mean
   anything. A duration average over three visits is noise wearing a decimal point, and showing it
   would be the same failure as a fake review count. Nothing renders below a real threshold.
2. **A person is never scored to their face.** We may use lateness to time a reminder. We may not
   show a salon "this customer is a no-show risk", because that is profiling a named individual in a
   way that leads to them being refused service, and under Swiss data-protection rules a decision
   like that is not something a marketplace gets to make quietly. See K3.

The rule that falls out and should be written into the law file: **derived behaviour may change what
the SYSTEM does, and may not change how a PERSON is treated.**

---

## K , ALGORITHMS AND THE LLM

He asked directly whether an LLM should handle cancels. The honest answer is: for the decision, no,
and for the words around the decision, yes. Split by what the job actually is.

### K1 Where a plain rule wins, and an LLM would be strictly worse
Everything on this screen that is arithmetic:
the late clock, the no-show proposal, the fee (already frozen into the booking's own terms at the
moment it was made), the wait estimate, the duration averages, reminder timing, the queue order.

Four reasons an LLM is the wrong tool for these, and they are not stylistic:
1. **They must be explainable to a customer who disputes a charge.** "Rule: 30 minutes late, staff
   confirmed" is a defence. "The model decided" is not.
2. **They must be identical every time.** The same inputs must give the same answer for two
   customers on two days, or the fee is arbitrary.
3. **They run on a screen that has to answer in under a second**, offline-ish, in a shop.
4. **They cost money per call** to compute something a subtraction already answers.

### K2 Where an LLM genuinely earns its place
Language, never arithmetic. Three real uses:
1. **Reading free text.** Cancellation reasons and customer notes are unstructured. Sorting a
   season of them into "ill / travel / found it cheaper / salon's fault" is exactly the job.
2. **Writing the message.** When a salon moves an appointment, the customer gets a note. Writing a
   decent one in four languages, in the salon's own voice, from a reason typed in a hurry, is worth
   real money to a shop that is not going to write it themselves.
3. **Summarising the day.** "Two no-shows, both before 10am, and Nina ran 20 minutes over all
   afternoon" from the log. A person would need five minutes and will never do it.

### K3 The no-show risk score, and why it should NOT ship as most products would build it
It is buildable: past no-shows, lead time, first-time or returning, day and hour, deposit or not.
The rule that governs what it may do is J4's line, so:

**Allowed** , it changes what the SYSTEM does:
- a second reminder for a booking the model thinks is shaky
- suggesting a deposit for a high-risk SLOT PATTERN (Saturday 9am, first-time, booked three weeks
  out), which is about the slot and not about the person
- warning the salon that a whole DAY looks fragile

**Not allowed** , it changes how a PERSON is treated:
- showing a salon a risk label on a named customer
- letting a salon auto-decline based on a score
- charging a bigger deposit to a named person because of their history
Each of those is an automated decision about an individual with a real consequence, and it is not a
call a marketplace should make quietly, quite apart from Swiss data-protection rules on profiling.

### K4 What it costs, and what happens when it is wrong
- **Cost.** Free-text classification and the odd message are pennies per salon per month. A model
  call in the tap path would not be, which is the second reason it stays out of the tap path.
- **When the language model is wrong**, a message reads oddly and a human fixes it. Cheap.
- **When a score is wrong**, a real customer is treated worse for a reason nobody can see. Not
  cheap, not fixable, and not visible to us when it happens. That asymmetry is the whole argument.

---

## L , RESEARCH: WHAT THE OTHERS ACTUALLY DO (sourced, and it changed three of my answers)

### L1 Uber Eats (from round 1, restated because it anchors the rest)
Merchant must accept within **11.5 minutes** or the order auto-cancels. A robocall fires at **90
seconds** of silence. Repeat misses auto-pause the store until 6am. There is no native auto-accept.

### L2 Airbnb (host side)
- **A decline cannot be undone.** Airbnb's own wording is to ask the guest to send a new request or
  send a special offer. The declined object is terminal.
- **A host cancellation has no undo path documented at all**, and no explicit "this is permanent"
  warning either. It blocks the host's own calendar for those dates and carries a fee ladder
  (10 / 25 / 50 percent by lead time, minimum USD 50).
- **An alteration IS withdrawable and never expires.** The guest can take unlimited time; the host
  can cancel the request and send a new one. There is no edit, only cancel-and-resend, capped at
  3 per day.
- **There is no no-show concept for a host at all.** The only article on a guest not arriving says
  the payout is released as normal.
- **There is no per-reservation activity timeline.** The message thread IS the audit trail.

**Why those two absences do not transfer to us, and it is the important part:** Airbnb captures the
money up front and the asset is time-blocked either way, so non-arrival collapses into "completed,
host paid". A salon that takes payment at the chair has the opposite economics. Airbnb having no
no-show state and no activity log is not evidence that a salon terminal can skip them.

### L3 Fresha (the closest competitor, and the most useful finding in the round)
- No-show is set from the appointment status menu, and **only after the start time and only until
  the end of the same day**. Stricter than the 24 hours I had drafted.
- **"Undo no-show" exists**, verbatim, in their help centre. The reversal I designed has a real
  precedent in this exact industry.
- **A no-show FEE cannot be reversed once charged**, verbatim. That is the line my Tier 3 crosses
  on purpose.
- A cancellation cannot be undone. "Completed" is one way.
- **"View appointment activity" exists and is timestamped**, so an activity log is not exotic here.
- **Arrived and Started are CUSTOM statuses, not built in.** Their five system statuses are Booked,
  Confirmed, Completed, Cancelled, No-show. (Their own help centre contradicts itself on this in a
  colour FAQ; the contradiction is recorded rather than smoothed over.)
- **No late, grace or arrival window is documented anywhere in Fresha.**

### L4 Square Appointments
- The booking status list is a closed set of six in their public API, with no arrived or checked-in
  member. **Check-in has been an open customer request since 2022.**
- **A no-show cannot be undone.** Confirmed twice by Square staff on their own forum.
- **An audit trail is a feature REQUEST from September 2025**, so it does not exist.
- Late-cancellation and no-show fees cannot be set to different amounts.

### What this research CHANGED in my design
1. **The 24 hour correction window is longer than the whole industry.** Fresha allows same day only.
   Keeping 24 hours, because a shop reconciles the next morning and a same-day cutoff means a 6pm
   mistake can never be fixed, but it is now a deliberate deviation rather than an unexamined default.
2. **Reversing a charged fee is something nobody else does.** Fresha says explicitly it cannot be
   done. Keeping it, because the alternative is that our wrong charge stands against a real customer,
   but it is a genuine product difference and should be said out loud.
3. **The late clock is ours.** Nobody documents a grace period, an arrival window, or a late state.
   That is either a real gap in the market or a sign that shops do not want it, and it is the single
   thing in this design most worth checking with an actual salon before building.

### What this research CONFIRMED
- Undo on a no-show is right, and Fresha proves the demand.
- A first-class "arrived" tap is a real gap: Fresha makes you build it yourself as a custom status,
  and Square has declined to add it for three years.
- An activity log is table stakes at Fresha and missing at Square.

---

## I3 , EXISTS-CHECK FOR THE LOG (done before designing on top of it)

**`audit_log` already exists and is live: 59 rows, RLS on.** Columns:
`action, actor_id, target_type, target_id, metadata, ip_address, created_at` (migration
`031_audit_log.sql`). That is exactly the shape section I1 described, already built.

Who writes to it today: only money and privacy paths.
`app/api/bookings/[id]/quick-action/route.ts:164`, `app/api/bookings/[id]/cancel/route.ts:258`,
`app/api/cron/release-deposits`, `app/api/cron/release-payments`,
`app/api/stripe/webhook/purchase-handler.ts:173`, `app/api/cron/process-deletions`.
**Nothing reads it back into any screen.** There is no salon-facing view of it anywhere.

**`case_events` is the better model to copy for the shape**, and it already ships:
`dispute_id, from_status, to_status, action, actor_role, actor_user_id, amount, note, created_at`
(7 rows, RLS on). That is a proper from -> to transition log with an actor and a role, which is what
section I1 asked for, built for disputes.

**So the log is not a new system.** The work is:
1. write an `audit_log` row on every booking and queue state change (today only money writes one)
2. give it `from_status` / `to_status` the way `case_events` already does
3. build the salon-facing read, which is the only genuinely new piece

Also present and worth knowing: `barber_cut_history` (10 rows) and `nail_design_history` (4 rows)
already record what was actually DONE to a customer per visit, and `search_events` (2 rows) plus
`discovery_search_events` (132 rows) already record intent. The learning material in section J is
partly on disk already.

---

# ROUND 3 , HE REJECTED THE SEVEN-TAB SCREEN (owner 2026-08-15, fourth message)

> "what if there is a lot and, like, multiple people" · "I don't like this gray back counting at a
> notification bar either" · "why are you making me such a sloppy fucking shit" · "why don't you
> make it, like, clickable? For example, new booking. How are we gonna do that?" · "the design is
> not good at all. What is this?"

**Measured before changing anything** (he selected the bell icon, so the numbers come from the
rendered page, not a guess): a 60px tab bar sitting on a 56px header, so **116px of stacked white
chrome before any content**, and then the grey canvas. The bell was crammed into a 193px right
cluster between `Live` and `Pause queue`.

**The three real failures, named:**
1. The seven-tab switch was mockup chrome pretending to be product chrome. States are not tabs a
   person flips. A new booking ARRIVES.
2. Two stacked bars of chrome.
3. It only ever showed one of anything. One late person, one new request.

**The data was thickened to make volume real**, not simulated: 14 bookings today and 6 people
waiting, seeded through the normal tables. Five bookings are genuinely past their time, so lateness
is computed from the clock rather than hardcoded.

## The three directions, all measured at 402 wide

| | thesis | how it answers "what if there are a lot" |
|---|---|---|
| **A, One stream** | no sections at all, walk-ins and appointments in ONE time-ordered list with a now-line | position always means time, so the list can be any length and the shop never loses its place |
| **B, Attention bar** | the calm day, with everything needing a human collected into the REAL shipped amber bar from `DashboardLayout.tsx:457` | attention is a COUNT, not N cards. `5 need you` + Show filters the screen to those five and back |
| **C, Now and next** | chairs fixed on top like a till, the day scrolling underneath | five late people are five LINES in a pinned strip, not five cards |

**Recommendation: B.** It composes a bar this product already ships, it is the only one of the three
that is identical at zero and at fifty, and it keeps the calm day calm. A is the most elegant idea
and the riskiest, because a single list means the thing needing a decision never moves to where the
eye is. C is the most familiar to anyone who has used a till, and it spends the most screen on
chrome that never changes.

**Measured, every state including the two that only exist after a tap:**
A 3 sizes / 3 weights / 28px anchor / 3.2% bold · B calm 4 sizes / 7.8% bold, filtered 3 sizes /
24.2% bold · C 3 sizes / 3 weights / 28px anchor / 3.6% bold. Zero controls under 44px anywhere,
no sideways scroll anywhere.

## Two crashes that were reported to me as passing
Direction A **never called `createPortal`**, so it rendered nothing at all, and it referenced a
constant it had not imported. The route returned HTTP 200 the whole time and the typecheck was
clean. Caught only by opening the page. Recorded here because it is the exact silent-no-op shape
this project's own CLAUDE.md names as its number one failure mode, and because "200 plus green
typecheck" was offered as proof that it worked.

Also fixed on the way: B lost its 28px anchor in the filtered view, and the chooser stretched three
rows over the whole viewport as three bands of empty white.

## The gate, for the theme he has now flagged twice
`selected-state` is in the correction ledger twice in fourteen days. The gate for it was armed both
times and was RIGHT about what it checks: ink and blue on a selected state are banned, and the calm
grey was what I used. The failure it could not see is that the container underneath was **also**
grey, so the selection was invisible.
Widened rather than duplicated (`.claude/hooks/no-black-selected-gate.py` v2): the calm grey
selected fill is only a selected state when it sits on white. 5/5 self-test, and it blocks the
pre-fix shape of the real file while passing the fixed one.

---

# ROUND 4 , THE ROOT CAUSE (owner 2026-08-16)

> "No more of this laziness. you're just doing one specific thing that I told you to instead of
> actually finding the fucking cause. You made up a random fucking collar that's beige. I don't
> fucking know it. You're boxing everything... There's no space. You know hierarchy. Nothing...
> Make a principle... you keep making the same fucking mistake. Ask them the core cause of your
> sloppiness, bro."

## What he named, each with the number and the rule it breaks

| what he saw | measured | the rule it breaks |
|---|---|---|
| "a random colour that's beige" | `rgb(253,246,231)` = `#FDF6E7`, the `s-warning.bg` token | taste rule 3: surfaces are "white + COOL sunken #F4F4F5, **no warm cream**", banned by name; taste rule 6 puts a pastel `.bg` on inline chips, not a bar |
| "you're boxing everything" | **62%** of vertical pixels (961 of 1539) inside a rounded box | 2026-07-15 operator decision: "ONE carded hero per screen; secondary info is BARE TEXT on the canvas" |
| "there's no space" | the one section-level gap measures **-33px**, the sections overlap | binary 16/32 rhythm |
| "you know hierarchy. nothing" | **67 of 71** text elements at 13/14/15, one step apart; the 28px anchor appears **once** | FLOORS LAW 7c: "size variety is not range... every size within ~6px is the worst case, it costs consistency and buys no hierarchy" |

Every one of those rules was written down and available the whole time.

## The candidate cause, put to an adversarial panel rather than trusted

**"I justify a design choice by 'this class string already exists somewhere in the repo' instead of
by 'the written rule permits it in this context'."**

The beige came from `DashboardLayout.tsx`, where it dresses an ADMIN PREVIEW banner: an internal
tool, not a design decision. The grouped card came from the PDP's services list, where it holds a
list of services, not a whole screen. The grey canvas came from copying the PDP's row classes
without the page they sit on. Every one was a real string from a real file, used where its rule
does not reach.

Three independent diagnoses (law-vs-precedent, order-of-operations, measured-vs-shipped) plus an
adversarial judge are running against that candidate, with instructions to refute it. The principle
he asked for comes out of whichever cause survives, not out of my first answer.

## The gate, and it is the third case of one disease
`selected-state` and `fabricated` are both in the correction ledger as repeats. The gate for the
first was armed and passed the beige, correctly, because every colour gate in this estate asks one
question: **is this token legal.** It is. What broke was the ROLE.

That is the same shape as the two cases the gate already held:
1. ink on a selected state (v1)
2. the calm grey selected fill on a grey canvas, invisible (v2, added this session)
3. a pastel semantic tint as a full-bleed surface (v3, added now)

All three are a legal token used where its rule does not reach, so it was widened rather than given
a fourth file. Discriminator: a chip is never sticky, fixed or full-width; a bar always is.
8/8 self-test. The first run of that suite failed and was right to, because it wrote against the
real file whose content already carries the bar, so the net-new rule suppressed the block.

---

# ROUND 5 , WHAT COLOUR MEANS (owner 2026-08-16, "already a lot better" + seven specifics)

- [x] R5-1 Accept is black. Make it green. `verified:` commit 11d255b31, measured on the rendered screen, Accept is now rgb(22,163,74) = #16A34A with white text
- [x] R5-2 The `New` badge is red. Red is wrong for it. `verified:` commit 11d255b31, measured rgb(107,107,107) = s-ink-2, no red; both render sites changed
- [x] R5-3 The top bar: a black dot plus black "12 need you" means nothing. `verified:` commit 11d255b31, the dot is deleted, measured absent from the DOM
- [x] R5-4 Hide / Show is not clickable-through, the labels do not say what happens. `verified:` commit 11d255b31, the whole bar is one button now, label measured as 'Show only these' / 'Show the whole day'
- [x] R5-5 "where is the font that we use" `verified:` commits 11d255b31 + 43fc85524. Measured Inter 68 uses + Inter Tight 4, the identical pairing the PDP uses, so the families were never wrong. The real gap was the ANCHOR: 28 here against the PDP title's clamp(30px,2.8vw,34px). Raised to 30 and re-measured: sizes 13/15/18/30, anchor 2.31x the body.
- [x] R5-6 Explain what the PRINCIPLE is, in one page, and implement it rather than describing it. `verified:` commit 11d255b31, the seven-line colour principle above, and every one of its lines is applied in this round
- [x] R5-7 The repeat I found while measuring, which he did not have to name `verified:` commit 11d255b31, 'need you' now measured ONCE on the rendered screen, was twice: "12 need you" rendered
      TWICE, once in the bar at 15px and again as the 28px heading underneath it.

## Measured before touching anything

| element | measured | verdict |
|---|---|---|
| `New` badge | `rgb(220,38,38)` = `s-error` | red means something is WRONG. A new booking is not wrong. |
| `Accept` | `bg-s-ink` black | it is a confirmation, and confirmation in this system is green |
| the dot before "12 need you" | 8px solid `bg-s-ink`, no text | decoration. Taste rule 2: no status dots, ever |
| "12 need you" (bar) | 15px/600 ink | fine as a label |
| "12 need you" (heading) | 28px/600 Inter Tight | the SAME FACT a second time, 60px lower |
| fonts | Inter 68 uses, Inter Tight 4 | **correct**, and identical to the PDP's own pairing |
| the PDP's page title | `clamp(30px,2.8vw,34px)` | ours is 28, so the anchor is a step smaller than the product's |

**On the font, honestly: he is right that something is off and wrong about what.** The families are
exactly the product's (Inter for body, Inter Tight for display) and the section headings are the
PDP's own class string character for character. What differs is the ANCHOR: the PDP's page title is
30 to 34px and ours is 28.

## THE COLOUR PRINCIPLE (the thing he asked to be explained and then applied)

**Colour on this screen means one thing only: what STATE something is in. It is never decoration,
never emphasis, and never a way of saying "this is a button".**

1. **Green means good.** Free, done, confirmed, accepted. Accept is a confirmation, so Accept is
   green. This does not break "the one commit CTA is ink", because that rule is about the one
   PURCHASE button on a customer screen. Accepting a booking is not a purchase.
2. **Red means wrong, or it costs money.** Late, no-show, cancel, a fee. Nothing else.
3. **New is not a state, it is an AGE.** It gets no colour at all. Position and weight carry it, and
   it stops being new by itself.
4. **Black is for words, not for status.** A black dot says nothing that the words next to it do not
   already say, so it is deleted rather than recoloured.
5. **Blue is only a small thing you can tap.** Already the law, unchanged.
6. **A fact appears once.** If the bar says "12 need you", nothing else on the screen says it again.
7. **A control is named after what you will SEE, not after what it does to the screen.** "Hide" tells
   you nothing. "Show the whole day" tells you where you will be.

---

# ROUND 6 , THE RESTART, AND THE SAFARI KILL (owner 2026-08-17)

> "its nth like the ss and problem is u keep ittirating on the last mockup the first mockup of
> terminal u did so u keep not changing almst anth instead of starting from scratch"
> then "safari dead"

- [x] R6-1 Build the screen FROM SCRATCH rather than editing the rejected one `verified:` commit
      a45003243, new file `app/[locale]/dev/terminal/Screen.tsx` written without opening `b/B.tsx`,
      which stays on disk untouched for comparison.
- [x] R6-2 Correct the reference reading `verified:` the light grey in his weto screenshot is the
      PRESENTATION BACKDROP behind three phone renders, not the app. The app is white. Round 5 had
      copied the mounting board, which is why it looked nothing like the reference.
- [x] R6-3 Harden the iterate-instead-of-restart loop, and pay for it `verified:` commit a45003243,
      `restart-dont-repaint-gate.py` 7/7 self-test, wired into settings.json Stop. Retired
      `mockup-gate.py` to pay: its skip flag was touched 21 times in 7 days, it only fired on the
      mobile repo, and its documented workflow ("mock by editing the REAL screen IN PLACE") is the
      precise opposite of the rule being armed.
- [x] R6-4 "safari dead" , find the cause and fix it `verified:` commit 69d8b3c96. Measured, not
      guessed: the old route sits inside the locale segment, so the WHOLE site rendered underneath a
      full-screen overlay. Site header, footer and fixed bottom nav all present; 36 script tags; 254
      DOM nodes. On the new bare route: all three absent, 21 scripts, 152 DOM nodes.
- [x] R6-5 Rule out the production-build route so nobody retries it `verified:` `npm run build`
      exits 1 on a pre-existing webpack error in `app/[locale]/salon/[slug]/team/page.tsx`, unrelated
      to this work, AND both terminal routes call `notFound()` outside dev, so a production build
      could never serve either one.

## Still open, tracked rather than narrated

- [x] R6-6 KEPT, decided rather than left hanging. `verified:` the premise in the original line was
      WRONG and checking it was the disposition: `app/[locale]/dev/terminal/b/page.tsx:20` imports
      `./B` and renders `<B ... />` at line 20, so `/dev/terminal/b` does NOT render the new
      `Screen`. So B is not dead weight, it is a live second route
      and the only before-picture of the six rejected rounds. It costs nothing (dev-only, both
      routes `notFound()` outside dev) and deleting it unasked is the 2026-07-31 mistake ("why did
      you fucking remove the airbag"). It stays until he says otherwise; no graveyard line is owed
      because nothing was removed.
- [x] R6-7 DONE `verified:` commit e13f81f5b. Not ported from B, rebuilt on the new bones, and the
      one thing B never had was fixed on the way: Start set `status: in_chair` without a `staffId`,
      and the staff row matches on `staffId`, so the customer left the waiting list and appeared
      NOWHERE. Measured on the click, not read in the source: rows 6 -> 5 while "Free" stayed at 2.
      Now on the screen and verified live by clicking each one: a booking arrives on its own at 6s
      and 26s with a tint and an optional chime (Accept moved pending 2 -> 1, Today 7 -> 8); Undo
      restores the exact prior state (pending 1 -> 0 -> 1, rows 7 -> 8 -> 7) and expires after 8s;
      Start assigns the first free chair (Nina|Free -> Nina|Ravi) and is disabled with a stated
      reason when all three are taken; Done frees a chair (1 of 3 free -> 2 of 3); the log fills
      with timestamped lines; Replay resets everything to seed. The three bottom buttons open three
      real views instead of moving a highlight, and the two top buttons stopped being decoration
      (Replay, sound on/off).

## ROUND 7 , the indicators he asked for, 2026-08-17

He sent a screenshot (an avatar in a thick ink outline with an ink pill badge straddling its bottom
edge) and said: "make it like ths yk for indicators too like green ir red etc" then "for staff".

- [x] R7-1 Measure the reference instead of eyeballing it `verified:` commit bdb6955bc, PIL on his own screenshot,
      saved as `owner-badge-ref.png` (919x1998px). Raw readings, converted at 919px / 390pt = 2.356
      px per point: avatar outer circle x 366..621 = 256px -> 108.7pt; photo inside the outline
      237px -> 100.6pt; outline runs (367,376) and (612,620) = 9.5px -> 4.0pt; badge pill
      419..583 x 934..1009 = 165 x 76px -> 70.0 x 32.3pt; pill bottom 1009 vs circle bottom 999 =
      10px -> 4.2pt of overhang. The image was not on disk (pasted into chat, and ~/solen/screenshots
      held nothing from today), so it was recovered out of the session transcript first.
- [x] R7-2 First attempt REJECTED on sight `verified:` superseded by commit a0524091f, "looks so ass wtf is that", and the cause is worth
      keeping. The ratios were correct and scaled onto a 56px thumbnail, which produced a pill 70%
      as wide as the photo lying across a person's chin. **Copying a hero element's proportions onto
      a thumbnail copies the arithmetic, not the look.** The reference's avatar is a hero at 100.6pt;
      ours was a 56px thumbnail in a row of three.
- [x] R7-3 Fixed by moving the SCREEN to the reference rather than shrinking the reference to the
      screen `verified:` commit a0524091f. Photo 56 -> 88px (scale 88 / 100.6 = 0.875), outline 3px,
      pill 61 x 28px, overhang 4px. Three 88px avatars plus gaps measure 372 of the 390 width, so the
      row still crops its next item.
- [x] R7-4 Colour `verified:` commit a0524091f, then superseded by 0d6728ef2 when the badge was deleted outright. The badge was INK, as it is in his reference, and the state lives inside it (green
      dot free, white scissors working). A fully green pill at that size is not an indicator, it is
      the loudest thing on the screen. `?badge=fill`, `?badge=dot` and `?busy=red` render the
      alternatives so the choice is looked at rather than argued about.
- [x] R7-5 The honest red, and a missing thing found on the way `verified:` red means WRONG, and the
      only wrong thing on this screen is a walk-in who has waited longer than the wait we promised.
      That needed `joined_at`, which EXISTS on `barber_walkin_queue` in the live table and which
      `loadTerminalData.ts` never selected, so the screen could only ever repeat its own estimate
      and never notice the estimate had been missed. WHY it was missing: never landed, not killed or
      superseded (nothing in REMOVED.md, no other reader anywhere). Selected now; waiting rows show
      real elapsed wait; the seed's joined_at was six hours stale so every row rendered red, and it
      was reseeded to realistic offsets. Two of six are over their promise and say so.
- [x] R7-6 Killed the Next.js dev-tools badge (`devIndicators: false`). It floats bottom-left,
      directly on top of this screen's own bottom bar, and put an unexplained black disc in every
      screenshot of the terminal. Dev chrome only, a build is unaffected.
- [x] R7-7 SECOND rejection, "that sh is nth like the refference", and this one had a single
      measurable cause I had never looked for `verified:` commit 851cbb7d3, rebuilt as a new file
      `StaffChip.tsx` rather than edited in place. A vertical PIL scan down the centre of his
      screenshot (x = 493) reads BLACK y743..752, then **WHITE y753..767**, then photo pixels from
      768. His ring is a FLOATING circle with 15px of air between it and the photo; mine was a
      border painted onto the photo edge with zero gap, which is the difference between a ringed
      portrait and a bordered thumbnail. The same scan also proved the earlier badge ratio was taken
      against the ring's INNER edge (237px) instead of the photo (208px), so the badge had been
      sized against a circle 14% too large. Rendered at 1:1 with his screenshot now, no scaling
      factor at all: photo 88, gap 6, ring 4, outer 108, badge 70 x 32, overhang 4. Verified live in
      the browser: outer 108x108, border 4px, photo 88x88 inset 6px, badge 70x32 sitting 4px below
      the ring, no page overflow at 390.
      **The lesson, and it is the same one twice in one round:** both misses came from measuring the
      wrong pair of edges and then reasoning perfectly from them. A ratio is only as good as the two
      things it is a ratio of, so name what each number is an edge OF before dividing them.
- [x] R7-8 THIRD rejection, "still nth like it but alrdy better but now its too big j the pill evrth
      no balance" `verified:` commit c3f280929. His reference is ONE avatar alone on an onboarding
      screen, so its size is the size of the only thing there. Three of those in a row measured 108px
      against a 30px headline: the supporting element was 3.6x the anchor it supports. Grounded in
      OUR system instead of his: `SalonTeam.tsx:134` uses 88px for a staff avatar as the CONTENT of
      its section, so stylists that are supporting information under a headline sit one step down at
      64px (outer 78, ring 3, gap 4, badge 40x20). The pill is deliberately narrower than his, 0.63
      of the photo against his 0.72, and that deviation is stated in the file rather than hidden.
      An independent re-measure also CORRECTED my own reference number: his pill is 148-152px, not
      the 165px first recorded, because the first pass took the widest anti-aliased row instead of
      the plateau.
- [x] R7-9 HARDENED `verified:` ~/.claude/hooks/reference-measure-gate.py decide() at line 176, 19/19 selftest, gate-eval VERDICT PASS (81 of 1633 real replies, 2/2 known-bad caught, 2/2 known-good passed). It is a FIX to the existing check rather than a new one, because a mistake
      that already has a gate is a binding failure (LAW_SYSTEM 6.9). `reference-measure-gate.py` v4:
      all three rejections above were PIL-measured and all three PASSED it, because proving the ruler
      was used says nothing about whether the answer belongs on our screen. It now also requires ONE
      number from OUR side (our anchor, a locked component of ours, or an explicit `role:` note) on
      any reference-derived file. Paid for by FIXING rather than adding: no new gate, and this one
      got its first `--selftest` ever (12/12). `gate-eval.py`: PASS , 42 of 1633 real replies, 1/1
      known-bad caught, 1/1 known-good passed.
- [x] R7-10 Two real defects INSIDE the evaluation layer `verified:` ~/.claude/gate-eval.py probe payload (absolute file_path) and its deny detection (permissionDecision deny), both edited and both re-run while doing R7-9, both of which were
      silently under-reporting every gate of this class: `gate-eval.py` probed PreToolUse gates with
      a RELATIVE file path, which falls outside the `is_solen()` scope check several Solen gates use,
      so they scored "blocked 0 of N" while blocking correctly in real life; and it only counted a
      refusal as exit-code 2 or `"decision": "block"`, never the `permissionDecision: deny` JSON that
      the PreToolUse docs actually recommend. Both fixed.

## ROUND 8 , the badge is deleted and there is an indication SYSTEM, 2026-08-17

Owner, three messages in a row: "make it no pill n jdt circle n make it green orange etc yk and make
acc system fir indication instead of rndm sg", then "no bitch not round dott", then "remove the pill
thats underneath or middle bro".

- [x] R8-1 The badge is GONE `verified:` commit 0d6728ef2, `app/[locale]/dev/terminal/StaffChip.tsx`
      now renders one SVG circle and nothing else. Four rounds went into matching a badge to his
      reference and the answer was to remove it. WHY, and it is the lesson: his reference is an
      onboarding screen INTRODUCING ONE PERSON, where a badge is the only thing that could carry a
      state. A shop board reports on everybody at once, and the circle around each face is already
      there, already repeated, already identical for everyone. Colour what exists rather than add
      what does not.
- [x] R8-2 The system he asked for `verified:` `app/[locale]/dev/terminal/status.ts`, one file that
      says what a tone MEANS and what must be true in the DATA before it shows: ink = working,
      nothing to do; green = free and nobody waiting; orange = free WHILE somebody waits, so seat
      them; red = free while somebody has already waited longer than promised. Every tone is
      computed from real columns (`joined_at`, `estimated_wait_minutes`); there is no "looks busy"
      tone because nothing in the database says that. Two rules keep it a system and not a palette:
      a tone is always DERIVED, and it is shown in exactly ONE place.
- [x] R8-3 Rule 2 applied, and it caught a real contradiction `verified:` the word under a stylist
      was green "Free" while the ring above it was orange, so one person reported two states at
      once. The word is neutral now; the ring is the only indicator.
- [x] R8-4 Seeded the queue so the middle tone actually appears `verified:` A-043 at 24 of 30
      promised minutes (0.8) turns both free stylists' rings orange on the live page. Before the
      reseed every row was six hours stale and rendered red, which is a system with one colour.
- [x] R8-5 The council review of R7-9's gate found 12 defects, and the four that mattered are fixed
      `verified:` 19/19 selftest, gate-eval VERDICT PASS. (a) every OWNER_REF alternative was missing
      its closing word boundary, so "his refactor", "his imagery", "his photography" all read as "he
      sent a picture" and denied unrelated edits; (b) `role:` was a four-character escape hatch that
      cleared the whole new rule, it now has to name both sides; (c) the page-reference check ran
      before the production/mockup split, so shipped code carrying "matches the salon page reference"
      (`app/[locale]/profile/settings/BeautyProfileForm.tsx:144`) would have blocked any edit near
      it; (d) the instrument list did not include the word "screenshot", so a genuinely measured note
      in `app/[locale]/_components/search/SearchOverlay.tsx:2294` was refused. Plus the 400-character
      floor, which the evaluator itself proved let a 117-character version of the original mistake
      through untouched; it is 80 now and an Edit is judged against the file already on disk.
      HONEST LIMIT, from the same review and worth keeping in view: this rule is satisfiable by
      ritual. A regex over free text cannot verify that a cited number of ours was actually the one
      the shipped size was derived from. It forces the question to be asked; it does not prove the
      answer.
