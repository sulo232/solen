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
- [x] THE CALENDAR HE SAID WAS EMPTY ON MOBBIN, FOUND `verified:` I read the screen image myself in
      the Mobbin flow result, flow id 249c7fed-31a7-461a-983c-e33caa562064 named "Calendar",
      https://mobbin.com/flows/249c7fed-31a7-461a-983c-e33caa562064 . It is there under the Airbnb
      iOS "Calendar" flow: a month grid with a PRICE under every single date, day letters across
      the top, a listing switcher with a calendar icon and a gear at the top, "1 promotion" as a
      per-month link, and months stacking and scrolling continuously into the next.

## His answers, 2026-08-21
- [x] TABS `verified:` his own answer text, quoted below verbatim from the AskUserQuestion result
      this session. Leaning calendar-led but with a Today as well, because a salon is not a rental.
      Verbatim: "im thinking of 3 but w today too yk cz its more salon but idk can u acc use sub
      agents councils". So the shape is HIS to confirm and he asked for a council to work it out.
- [x] WHO `verified:` his own answer text this session. The owner picks what each individual staff
      member can see. Verbatim: "can select owner
      can select what staff sees specific staffs sees yk". Note this is PER PERSON and configurable,
      not two fixed roles, which is more than the per-staff permissions already in the database.
- [x] FLOWS `verified:` his multi-select returned all four options: the five tabs and the Menu, a
      day in the calendar, taking a booking by phone, and the empty first day.

## The work
- [x] M1 COUNCIL DONE, four proposals judged. Verdict in full at the bottom of this file.
- [x] M1b COUNCIL ON THE TAB SHAPE DONE `verified:` its verdict is the section "The council's verdict,
      2026-08-21" further down this same file, which names four tabs, says where the terminal goes,
      and works the salon day out in taps. It was: COUNCIL on the tab shape, because he asked for one by name. What are the tabs for a SALON
      rather than a rental, does Today survive beside a calendar, and what happens to the other 46
      sections.
- [x] CORRECTION 2026-08-21 `verified:` commit f84a6a4d4, and the gate fix is live at
      `~/.claude/hooks/no-opus-subagent-gate.py:326` (the "THIRD FIX" block). Graded this turn on
      four payloads: a model-less workflow build stage BLOCKS, the exact script that spent the
      tokens BLOCKS, a genuine judgment stage still ALLOWS, and its own suite passes 4/4.
      His words: "Why are you using Opus five as a subagents. I told you only counsel
      and also why are you building with only one or two sub agents? It's gonna take so fucking
      long." · Both true and both mine. WHY OPUS: standalone `coder` dispatches were already sonnet
      by their own frontmatter, but every `agent()` inside a WORKFLOW inherits the session model,
      which is Opus 5, and I never passed one. WHY IT WAS NOT CAUGHT: `no-opus-subagent-gate.py`
      has an arm for exactly this and it did not fire, because my build stage interpolated
      `${verdict}` (it is handed the council's decision to build from) and `verdict` is one of its
      judgment markers, so the stage exempted itself by quoting its own input. Proven
      discriminating: the real script is ALLOWED as written and DENIED with that one variable
      renamed and nothing else touched. Gate fixed to strip interpolations before the judgment
      read, graded on four cases plus its own suite, including one it must still allow.
      WHY ONE BUILDER: no good reason. The concurrent-builder rule already permits a fan-out when
      each owns disjoint files; I simply never wrote the briefs that way. The single Opus builder
      ran 25 minutes without writing a line and was stopped. Four sonnet builders now run in
      parallel, one flow each, none of them touching git.
- [ ] M2 MOCKUP, the five tabs and the Menu.
- [ ] M3 MOCKUP, a day in the calendar, following their month grid with a number under every date.
- [ ] M4 MOCKUP, taking a booking by phone, end to end.
- [ ] M5 MOCKUP, the empty first day for a salon that just signed up.
- [x] M6a THE FOUNDATION ALREADY EXISTS, AND IT IS DECORATIVE `verified:` `lib/types.ts:158-160`
      carries `can_edit_schedule`, `can_view_own_bookings` and `can_manage_portfolio` on
      `StaffMember`, created by `supabase/migrations/069_megabuild_staff.sql`, and
      `app/[locale]/dashboard/staff/page.tsx:77-79` reads them into a form while lines 113-115
      write them back. So an owner can already set three per-person switches today.
      AND NOTHING CHECKS THEM. Grepped `app/api/` and `lib/` for all three names: zero hits outside
      the type file and that one form. They are saved and never read by anything that decides what
      a person may do. That is this project's named number one failure, a control that looks wired
      and does nothing, and it is the same shape as the notification toggles caught on 2026-07-07.
      So his ask is not new construction: it is finishing something half-built, then widening it.
- [ ] M6b The per-staff visibility picker proper. EXTEND the three existing columns rather than
      inventing a table, per the exists-check protocol. Two halves: make the three that exist
      actually gate something, then add what the tab shape needs (which tabs a person sees at all,
      whether they see money, whether they see other stylists' columns or only their own).
      Design first, and it is not in the four flows he picked, so it does not block the mockups.
- [x] ANSWERED 2026-08-21 `verified:` commit 77a6795a4, and the walk-in cost was checked in the code
      rather than asserted: `app/[locale]/dev/terminal/loadTerminalData.ts:76-79` and its
      `barber_walkin_queue` select at line 163 carry `joined_at`, `started_at`, `position` and
      `estimated_wait_minutes` with no start time, while `app/[locale]/dashboard/calendar/page.tsx:468`
      reads `/api/slots`. His words: "those arent at all good n terminal i thought we gnna ditch that sh it
      wont work bro n calender is superior". THE CALENDAR IS THE PRODUCT. The terminal is ditched as
      a separate thing and there is no Today tab. This is the second time he has said it: he already
      picked option 3 ("im thinking of 3"), the council argued him down to Heute-first, and I built
      the council's answer over his stated lean. That is the error, and the standing rule says his
      literal call outranks a council recommendation.
      THE ONE COST, verified rather than asserted, and it needs solving rather than arguing:
      `barber_walkin_queue` carries `joined_at`, `started_at`, `position` and
      `estimated_wait_minutes` and NO start time, while the calendar reads `availability_slots`
      through `/api/slots`. So a walk-in has no time to sit at on a calendar until somebody puts
      them in a chair. Ditching the terminal without answering that leaves walk-ins nowhere. It is
      solvable inside the calendar (a standing area above the grid for people with no time yet) and
      that is the thing to design, not a reason to keep two apps.
- [x] SETTLED BY HIM 2026-08-25, was PARKED 2026-08-21 · Does the dashboard land on Heute or on the
      Kalender? · HE ANSWERED, verbatim: "those arent at all good n terminal i thought we gnna ditch
      that sh it wont work bro n calender is superior". So the CALENDAR leads and the terminal is
      ditched. The four-lens council had argued Heute first and the first build followed the council
      over his stated lean, which is precedence chain tier 1 losing to tier 8 and is the mistake
      logged in commit 77a6795a4. His literal call stands. Nothing here is reopened.
- [ ] M7 Hand over the four mockups on one link and get his read before any real dashboard code
      changes. He asked for the mockups FIRST so he can see whether I understood.

## Where it stands, 2026-08-26
- [x] THE PAGE STEPS THROUGH ANY SCREEN NOW `verified:` commit 065b5e6ba. `page.tsx` used to
      hardcode the stepper to the Tabs flow and pan the other three sideways as a strip. It now
      reads a `FRAMES` export off whichever flow module is selected, so a flow gains the stepper the
      moment it exports one. Measured on the rendered page at 390x844: `scrollWidth` 390 against a
      390 viewport, no sideways scroll, "Frame 1 of 3" present.
- [x] THE CAPTION ON HIS SCREEN CONTRADICTED THE REPLY `verified:` commit 90c2e074b. The Calendar
      caption read "element count (46 to 19)" while I had told him 111 to 41. Re-measured live on
      the rendered frame with the same method both numbers came from: total 41, of which 19 SPAN,
      9 P, 8 DIV, 4 BUTTON, 1 H1. So 41 is right and the caption was the builder counting a
      different container. Caption now quotes the measured pair.
- [ ] THREE BUILDERS RUNNING, one file each, dispatched 2026-08-26: `_flow-calendar.tsx`,
      `_flow-phone.tsx`, `_flow-empty.tsx`. Each adds the `FRAMES` export plus an `{ index }` prop
      and cuts to 45 elements or fewer per frame, measured on the rendered frame. The
      `no-concurrent-coders-same-repo-gate` was escaped deliberately and the reason written to its
      flag: the three files are disjoint, every brief forbids git outright (which is the collision
      that gate exists to stop), and `feedback_no_parallel_agents_frontend` was superseded
      2026-08-07. Awaiting their reports, then a design-critic pass, then commits.
- [ ] THE CHECK-IN TAP HAS NO HOME. Cutting the Tabs flow from 111 to 41 removed the per-row tap
      that marks a customer as arrived. In a real shop that is the single most repeated action of
      the day, so this is a genuine functionality loss and not a tidy-up. It needs a place on either
      the calendar day view or the standing strip before any of this ships. Not yet designed.


---

## The council's verdict, 2026-08-21

## 1. THE RECOMMENDED SHAPE

**Four tabs, left to right: Heute, Kalender, Kund:innen, Menü. You land on Heute.**

**Heute** is today's page of the book, in time order, painted with people instead of inventory. Who is in a chair, who is waiting and how long, the next appointments each with a one tap "angekommen", anything sitting on a yes or a no, and one live line for what the day has taken so far. It never draws a grid, and it never shows an empty slot as if it were an event. On the first day of a brand new salon it holds the setup steps instead, which is what Airbnb's own Today actually holds when a host has nothing booked.

**Kalender** is every day that is not today. Months stacking and scrolling into each other with no paging and a number under every date, and tapping a date opens that day as blocks of time so you can block it, open it or drop an appointment into it. Today's cell links across to Heute. It does not draw today a second time.

**Kund:innen** is one person at a time: their visits, their notes, their colour formula or allergy or intake form, their number, and a button to book them again.

**Menü** is everything else, as plain rows with a line icon and a chevron on bare canvas, in two labelled groups, with the account rows and a black log out button at the bottom.

Both Heute and Kalender carry one black Add that is pre filled by where you are standing: on Heute it opens a walk in, on Kalender it opens an appointment on the day you are looking at. Airbnb's bar has no reason to do this because a host almost never creates a booking. A salon creates most of its own.

Where the pieces came from: the four tab count and Kund:innen where Airbnb puts Listings is in proposals 2 and 3 both. The single best idea in the whole batch is proposal 3's, that Kalender holds every day that is not today and today's cell links across rather than redrawing, because that is the only formulation that kills the "two tabs look like the same screen" problem instead of promising to police it. Proposal 1 supplied the correction that the number under every date has to be a count and not a price, since a salon's price lives on the service. Proposal 4 supplied the reason Heute cannot just be the calendar's current day, and I checked it: `app/[locale]/dashboard/calendar/page.tsx` line 750 paints every available slot with a green background and a green label, so a quiet morning renders as a column of green "Frei" rows. Free time is painted louder than a booking. The pre filled Add is proposal 3's alone.

Where I depart from all four: none of them made Heute the day itself. Proposals 1 and 4 both restrict Heute to exceptions only, which makes it thin on a coiffeur day and hands the actual day back to the calendar. Making Heute the day in time order is what lets his option 3 survive, because today genuinely is the current day of the book, it is just painted with people.

## 2. WHY, FROM THE SALON DAY

Count a real day for a two chair shop: twelve people arrive, three ring up asking for Thursday, two walk in, four get looked up at the chair, one gets moved, and once at the end you check the money. Every single customer arrives, and only some of them ring, so the action that repeats most is "this person is here now", which is a Heute action, while the action that repeats a few times is "where does this caller fit", which is a Kalender action. Landing on Heute costs about four extra taps a day and landing on Kalender costs about fifteen, and the reason is not that a calendar matters less, it is that a calendar is a surface you arrive at with an intent while Heute answers a question just by being looked at.

## 3. WHERE THE TERMINAL GOES

It stays its own full screen route on its own address, it does not become a tab, and it graduates out of the dev segment. Decided, not hedged.

It cannot be a tab because its own rulebook says it is never opened, it is already open, and it carries its own floating bar with four views. Putting it inside a bottom bar puts a bar under a bar, which is the exact thing that document bans. It is also a different device and a different posture: a tablet standing at the counter read from a metre away, versus a phone in a pocket for twenty seconds.

Heute is its phone sized variant, reading the same data through the same loader, `app/[locale]/dev/terminal/loadTerminalData.ts`, as a documented variant and not a second implementation. A walk in must not be two different objects on two screens.

One thing to say plainly rather than file: the terminal does not ship. `middleware.ts` line 72 gates `/terminal` on NODE_ENV not being production, and `app/terminal/page.tsx` calls notFound outside dev. I checked why before proposing to move it: it is not in the graveyard and nothing has superseded it, it was built as a prototype and never graduated. So the fix follows the reason, it needs a real route before any shop can leave it open, and that is a separate item from this tab shape.

Take proposal 3's skin call, though, because it is right and it is a decision worth making now: the terminal's white canvas, bare rows, no blue and one black commit is the newer operator law, and the four tabs should migrate to that rather than the terminal being repainted grey to match the older console. If both skins sit in one bottom bar, the older one loses.

## 4. THE MENU

There are 48 folders under `app/[locale]/dashboard/`. They sort into three piles with nothing left over except one I refuse to guess at.

**GESCHÄFT**, the same job as their HOSTING: Buchungen (bookings), Einnahmen (earnings), Berichte (analytics), Team (staff), Leistungen (services), Pakete (bundles), Produkte (products), Bewertungen (reviews), Galerie (gallery), Beiträge (discovery-posts), Marketing, Treueprogramm (loyalty), Rückerstattungen (refunds), Mehrbelastung (upcharge), Warteschlangen-Anzeige (queue-display), Terminal once it graduates. Then the category rows, shown only to a shop of that category the way the nav already filters them: barber-ops, barber-clients, nail-admin, nail-clients, spa-admin, coiffeur-crm.

**KONTO**, the same job as their ACCOUNT: Einstellungen (settings), Verifizierung (verification), Einrichtung (setup, which disappears once the shop goes live), Hilfe, Salon-Seite ansehen (our version of their "Switch to traveling" pill), and Abmelden as a black filled button at the bottom.

**PLATFORM ADMIN, a salon must never see these.** Nineteen are already listed together as ADMIN_NAV in `components-legacy/dashboard/DashboardLayout.tsx` lines 38 to 57, so this is read off the code: approvals, all-salons, all-users, revenue, commission-admin, platform-analytics, ai-limits-admin, badge-manager, content-editor, review-moderation, reports, segments, editor, discovery-admin, homepage-admin, cities-admin, salon-of-month-admin, feature-flags-admin, admin-sandbox. Add **cases**, and note the defect: it is flagged `adminOnly: true` and is sitting in the salon facing rail in the Abrechnung group on the same line.

**DEAD, one:** messages, turned off 2026-06-13, a redirect. No row and no tab.

**Unclassified, one:** help-editor appears in no navigation list at all. I did not classify it and I am not going to guess.

Two traps for whoever sorts these. First, "revenue" is platform money and "earnings" is the salon's own money, and those two names are the pair most likely to get swapped. Second, the word admin in a folder name sorts nothing: nail-admin and spa-admin are salon screens for one category, and "editor" is platform only.

**Three salon sections are currently unreachable, and this is the real work in the menu.** `earnings`, `products` and `queue-display` have zero references anywhere in app, components-legacy or lib. I ran the same grep against two paths I knew were linked as a control: dashboard/calendar returns ten hits and dashboard/bundles returns two, so the grep works and the zeros are real. A shop cannot currently reach the screen that tells it how much money it made. None of the three is in the graveyard and none has been superseded, they simply never got a nav entry when the nav was written, so the fix is a menu row. Einnahmen should be the row this menu earns its keep with, anchored the way Airbnb anchors Earnings, on a sentence carrying the live number and showing zero honestly rather than hiding.

**And two links in the staff nav point at nothing.** STAFF_NAV points at `/dashboard/my-breaks` and `/dashboard/my-portfolio` and neither folder exists. I checked why before saying it: neither is in the graveyard, and `git log --all` for both paths returns nothing while the same query on an existing path returns commits, so they were never built on any branch. But the tables did land: `staff_breaks` and `staff_portfolio_images` are both in the live snapshot, and the portfolio one already has twelve rows. So this is half landed, the data shipped and the screens did not, which means the fix is to build the two screens rather than to reroute the links.

## 5. THE PER STAFF VISIBILITY PICKER

The owner opens Team, taps a person, and sees the same four tabs and the same menu rows they saw a minute ago, each with a toggle, grouped exactly the way the menu is grouped, plus one line at the top saying what that person will land on when they log in. This does not need a new system and it must not get one: the live column snapshot shows `staff_members` already carries both `access_role` and `permissions`, and `staff_invites` carries the identical pair, so per person storage exists today. It is close to dormant, though. `permissions` is written by `app/api/staff/[id]/route.ts` and returned by `app/api/staff/route.ts`, but I found exactly one place that enforces it, `app/api/staff/my-schedule/route.ts` line 75, where the vocabulary is a string list with two values in use, `edit_own_schedule` and `manage_all`. So the work is to grow that vocabulary to one string per toggle and enforce it server side on every route, never by hiding a row, because hiding a row in a menu is not access control. One thing to fix on the way past: `lib/types.ts` lines 158 to 160 declare `can_edit_schedule`, `can_view_own_bookings` and `can_manage_portfolio`, and none of those three is in the live column list for `staff_members`, so any code trusting that type is reading fields that are not there.

## 6. THE STRONGEST ARGUMENT AGAINST THIS

**He leaned calendar led and I am landing somewhere else, so I will say it plainly: I am recommending Heute first, against his lean.** His shape survives in substance, since today really is the current day of the book, but the landing tab is not what he leaned toward and he should know that before he reads the rest.

The argument against me is a single assumption doing all the work. My tap count only wins because I assumed arrivals get marked on the phone. If a shop has the terminal on the counter, every one of those twelve arrivals moves off the phone, the gap collapses from roughly fifteen against four to roughly four against four, and calendar first wins outright, because the phone calls stay on the phone no matter what is sitting at the counter. So my recommendation is really a bet that most Swiss salons on this product are small enough that the phone is the till, and I did not measure that.

The second cost is a rule somebody will break later. In my shape Heute is the appointments, so the drift risk runs the other way from what the other proposals feared: the danger is that Kalender grows its own today view, and it already has one, a Tag view that is the default on mobile at line 432 of the calendar page. Kalender's today cell has to be a link and never a render, and the first time somebody makes it draw the day instead, there are two screens for one Monday and nobody knows which is true.

What would change my mind, and it is measurable rather than arguable: take one real week of seeded data and count how many bookings a salon creates by phone against how many arrivals get marked from a phone rather than from the counter. If arrivals from a phone come in under about a third of appointments, land on Kalender instead and change nothing else in this shape. The tab order, the four tabs, the today cell link, the menu sort and the terminal decision all hold either way.
