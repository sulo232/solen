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
- [x] A2 Fix the verb set: which actions the terminal DOES carry
- [x] A3 Fix the anti-scope: which of the 48 existing dashboard sections it deliberately does NOT carry
- [x] A4 Decide the access model: subdomain vs path, and what he actually gains from each
- [x] A5 Decide the identity model: who logs in (owner / staff / shared shop device) and how they stay logged in
- [x] A6 Decide the appointment default: auto-accept vs must-accept, grounded in what the industry actually does
- [x] A7 State what happens when nobody presses anything (the timeout path), because one already exists in this codebase

### B. WALK-INS AND APPOINTMENTS BOTH
- [x] B1 Map the walk-in queue verbs onto the same screen
- [x] B2 Map the appointment verbs onto the same screen
- [x] B3 Name how the two streams coexist without becoming two products

### C. NO DEVICE / BROWSER-ONLY
- [x] C1 Answer the hard question: how does the shop actually NOTICE a new booking in a browser
- [x] C2 Name the fallback chain when the browser misses it
- [x] C3 State the iPad reality (backgrounded tab, sleeping screen) with sourced facts, not guesses

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
`app/[locale]/dashboard/` contains **48 route folders**, each with its own `page.tsx`. Only two of
them gate on the admin role, so this is not "mostly platform admin". A salon owner who wants to see
today's bookings lands in a product with 48 sections. That IS "this complicated thing".

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
not reduce those 48 sections. It gives the shop a screen they can live on so they rarely open them.

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

**Measured on the rendered page (getComputedStyle over every visible text node), all three states, at
402x874 and at 1024x820:**
- distinct font sizes: **4** (11, 13, 15, 28), ceiling is 4
- distinct weights: **2** (400, 600), ceiling is 2
- display anchor: **28px**, floor is 28
- anchor ratio: **1.87x** the 15px body, floor is 1.8
- text at weight >= 600: **19.1% to 22.9%**, ceiling is about 30
- horizontal page overflow: **none** at either width

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
