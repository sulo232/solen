# Calendar / time picker, corner radius family, depth / shadow / surface

Research against the owner's 729 saved X posts, compared with Solen today and with Solen's new calendar mockup at `/Users/sulo/Documents/solen/public/_research/calendar/index.html` (screenshots `scratchpad/cal/mk-ph.png`, `scratchpad/cal/mk-dt.png`).

Exists-check: this is read-only research, not a new surface. The calendar mockup already exists at the path above; the comparison below is against that mockup plus the live dashboard calendar (`app` route behind `dash-calendar`) and Solen's existing card/button system (`_design-system` boards).

---

## Calendar / Time picker

**Reviewed:** 34 posts (i = 13, 18, 37, 43, 47, 65, 78, 84, 152, 163, 232, 241, 259, 296, 314, 325, 334, 336, 355, 363, 392, 543, 560, 562, 576, 589, 591, 603, 621, 636, 640, 645, 675, 701). Of these, only 2 are confirmed shipped products: i=621 (real Airbnb date picker) and i=640 (real iOS Reminders sheet). Everything else is a concept/portfolio shot. Several posts in this tag group are not really calendar UI at all (i=18 trip card, i=43/47 dashboard widget grids, i=259/314 health apps) and add little; they are noted but not counted as strong evidence.

### Recurring patterns (most common first)

**1. Day strip, a row of 7 days with one selected — about 8 posts (13, 37, 152, 259, 355, 363, 560, 645).**
Weekday label small caps, about 10-11px, muted grey, sits above a bold date number, about 15-17px. Selected day is most often a solid filled shape: a circle or pill, about 32-40px, ink or brand-color fill with white text (13, 37, 355, 560, 645). A minority use an outline ring only with no fill (259, 363). A "has activity" dot under the date appears in only about a third of these (152, 259, 560); it is not a default, so do not assume Solen needs one on every day cell. Concept only, no shipped example.

**2. Month grid, single date selected — 5 posts (65, 241, 543, 636, 701).**
Cell shape splits between circle (65) and rounded square, about 6-8px (241, 701). Today or selected is a solid dark fill (black square in 241, dark teal square in 701). i=701 pairs each bookable date with a small dot below the number, purpose-built for an availability flow, closest analogue to a Solen booking step. i=543 is a one-off: it puts an amount directly inside each day cell (green income, red expense) instead of a dot, a finance-app idiom, not reusable for bookings.

**3. Month grid with a date range (two endpoints plus a connecting fill) — 4 posts (84, 314, 334, 621), 1 shipped (621, Airbnb).**
Consistent anatomy: a solid-color circle at each endpoint, about 32-36px, and a lighter tint of the same hue filling every cell between the two dates so the whole run reads as one continuous pill shape, not separate circles. Weekday header abbreviated to one letter. i=84 and i=334 add quick-duration pills under the grid ("Weekend", "3 nights", "1 week"). i=621, the one real example, pairs this with flexible-date pills ("Exact dates", "+/-1 day", "+/-2 days") that drive a live result count ("3 homes available"), a genuinely reusable idea, not decoration.

**4. Capsule/pill chip for selectable options (time slots, flexible dates, quick filters, segmented periods) — seen in 701, 621, 640, 591, 675.**
Shape is a fully rounded capsule everywhere. Default state is a thin outline or light fill with dark text; selected state is a solid dark fill with white text. i=701 shows 6 time slots as pills in a 3-per-row grid, about 44px tall, roughly 16-20px side padding, about 8-10px gap, selected = solid dark teal. This is the cleanest literal match for "pick an appointment time."

**5. Multi-column weekly booking/schedule grid, day columns times hourly rows — 4 posts (13, 78, 232, 336; 232 and 336 are the same image reposted).**
Gridlines are consistently thin and low-contrast: 1px, faint grey, on both light and dark backgrounds; nobody uses a heavy grid line. Two competing block styles: full saturated color fill with no border (13, vivid pastel blocks per category; 78, glossy sticky-note colors) versus a light pastel tint card with a small colored icon or dot accent (232/336, calmer, closer to Solen's own "no loud colour" rule). i=13 is the only post that shows an explicit empty-slot affordance: a dashed-outline rounded box with a centered "+" in unbooked hourly cells. i=78 is the only clean current-time indicator: a thin red line across the grid with a small red time pill anchored at the edge.

**6. Compact mini-calendar plus agenda-list widget for a dashboard card — 4 posts (65, 241, 560, 576).**
i=560 is the cleanest: a one-week date row directly above two upcoming-meeting rows with attendee photos, shown in matching light and dark variants. Useful reference for a Solen "today's bookings" dashboard module, not the full calendar page.

**7. One-offs worth naming.** i=163: a repeat-schedule toggle ("Is repeating" + weekly day pills Mo-Su) for staff scheduling, plus a full-screen closure alert with an accept slider, relevant to Solen's own staff/closure settings rather than the calendar grid itself. i=392: a usage heatmap calendar (colored dot intensity per day) instead of a grid, an alternate idiom worth knowing exists but not fitting a booking calendar. i=591: time-value dropdown fields ("Look At", "Unlock From") styled as pills, relevant to any inline time picker input, not a grid.

### Solen today

- **Live dashboard calendar, phone** (`cal/now-ph-aug16.png`): grey page background, a date header with prev/next chevron circles, a Day/Week/Month segmented pill, a day strip of plain circles (selected = solid black fill + white text + white dot underneath, unselected = no fill, no border), and appointments shown as a **plain list**, not a grid: time range, bold name, service, staff name as three stacked text lines with no card, no fill, no color coding at all. Bottom action bar: solid ink "Slot" pill plus two outline pills ("Walk-in", "Plan").
- **Live dashboard calendar, desktop** (`cal/now-dt-aug16.png`): an actual grid, staff columns times hourly rows, thin hairline gridlines, but every appointment block is the **same flat light grey fill** (`#F4F4F5`-family), no color coding by staff or service, no left accent bar, no border, corners about 8-10px, no current-time indicator, empty cells are simply blank with no "add" affordance.
- **New calendar mockup** (`cal/index.html`, `mk-ph.png`, `mk-dt.png`): white page, one white card holding the whole grid at 20px corner radius plus Solen's locked shadow, no border. Day strip is a true pill (radius 9999) with the selected day solid ink + white text + dot, matching the strongest X pattern above almost exactly. Appointment blocks use a **per-staff pastel tint** (amber, green, lavender) with a 3px colored left accent bar, corner radius 12px, bold client name plus a lighter service line. Empty bookable slots are a **dashed outline box with a centered grey "+" circle**, which matches i=13's pattern closely. Revenue summary ("CHF 373 / 13 appointments") sits above the grid. Desktop adds a sidebar icon rail where each nav icon is a 14px rounded square, not a pill.
- **Customer time-slot step** (`sys/pg-booking-time-a.png`): date strip of rounded-square day cards (not circles, not full pill, radius looks about 16-18px), selected = solid blue fill; time slots below are full pill buttons (radius 9999) grouped under "Morning"/"Afternoon" labels, selected = solid blue fill with white text, unselected = white with a thin outline. This already matches the strongest X time-slot pattern (i=701) closely.
- **Where Solen disagrees with itself:** the live dashboard calendar (grey page, flat uniform grey blocks, list view on phone / plain grid on desktop) and the new mockup (white page, colour-coded pastel blocks, dashed empty-slot, revenue header) are two different systems for the same screen. The customer time-slot step uses blue as its selected colour; the calendar mockup and the rest of Solen's locked system use ink black as the selected colour. That is a real colour mismatch between two live-feeling booking surfaces.

### The differences that matter

| X does | Solen does | Why it matters |
|---|---|---|
| Appointment blocks are colour-coded (per staff or per category), full saturated fill or pastel tint plus accent bar | Live dashboard: every block is identical flat grey, zero colour differentiation | A staff member scanning a busy day cannot tell whose booking is whose at a glance today; colour coding is the single biggest calendar upgrade the X evidence supports |
| Empty bookable slots get an explicit affordance (dashed box + "+") | Live dashboard: empty cells are blank, no invitation to book | Staff have to guess where they can click to add a walk-in; the new mockup already fixes this, matching i=13 |
| Selected day in a day strip is a solid filled shape (circle or pill) with the number and a dot | Solen's live calendar and new mockup already do this | No gap, this is already right, keep it |
| Time-slot pickers are full pill buttons in a grid, solid fill when selected | Solen's booking-time step already does this, but with blue as the selected colour | The rest of Solen's locked system reserves blue for link text only and uses ink for selection; this one screen is the outlier |
| Current-time indicator (thin red/accent line across the grid) shown in the one clean schedule-app example (i=78) | Neither the live calendar nor the new mockup shows a current-time line | A small, cheap addition that every professional scheduling tool this size eventually adds; worth a note even though not requested |
| Range pickers connect two solid endpoint circles with a lighter tint fill between them, read as one continuous pill | Not present in Solen (the calendar here is single-day selection, not a range) | Not a gap today, but worth keeping this exact pattern in mind if Solen ever needs a multi-day blocked-dates or vacation picker for staff |

### Proposed Solen version

Anatomy for the owner-facing calendar (phone and desktop), all values taken from the new mockup unless marked otherwise:

- **Page:** white, not grey (from the mockup; also matches the depth/shadow finding below that most good designs separate with shadow on a white or light page, not with a different grey fill).
- **Grid card:** one white container, 20px corner radius, Solen's locked shadow (`rgba(0,0,0,.02) 0 0 0 1px, rgba(0,0,0,.10) 0 8px 24px`), no border. From the mockup, matches Solen's own locked value.
- **Day strip:** pill shape (radius 9999), selected = ink fill, white text, small dot under the date. From the mockup, matches the strongest X pattern (own judgment: keep, do not change).
- **Appointment block:** 12px corner, per-staff or per-category pastel tint fill, 3px colored left accent bar, bold client name + lighter service line. From the mockup, named pattern 5 above (i=232/336 style, calmer than i=13's saturated fill, which fits Solen's "no loud colour" rule better).
- **Empty slot:** dashed 1.5px outline box, centered grey circular "+" affordance. From the mockup, matches pattern named at i=13.
- **Time-slot picker (customer flow):** pill buttons in a grid, unselected = white with thin outline, selected = solid fill. From Solen's existing booking-time page. Own judgment: change the selected fill from blue to ink, to match the rest of the locked system (blue is reserved for link text only).
- **Current-time indicator:** own judgment, not in either Solen surface today, add a thin 1px ink or accent line across the grid at the current hour, following i=78. Mark this as new, not yet approved.
- **Disabled/unavailable day or slot:** own judgment (no clean X example measured this precisely): muted grey text, no fill, not clickable, consistent with Solen's existing disabled-button treatment elsewhere in the system.
- **Range/multi-day picker (if ever needed):** own judgment, held in reserve, not built now: solid endpoint circles connected by a lighter tint of the same hue, following i=84/i=621, only if a future feature (vacation blocking, multi-day packages) needs it.

### Best exemplars to show the owner

- i=13, `media/013-img0.jpg` — richest weekly booking grid: revenue header, colour-coded blocks, dashed empty-slot affordance. Best single reference for the full owner-calendar direction.
- i=621, `media/621-vid0.jpg` — the one shipped example (Airbnb): date-range shading plus flexible-date pills tied to a live count. Matches the project's Airbnb-look direction directly.
- i=701, `media/701-img2.jpg` — purpose-built booking-availability screen: dot-marked dates, solid selected square, pill-grid time slots. Closest functional twin to Solen's own time-selection step.
- i=78, `media/078-vid0.jpg` — cleanest current-time indicator inside a polished week-grid calendar app.
- i=560, `media/560-img0.jpg` — cleanest compact mini-week-card plus agenda-list widget, shown in light and dark, good reference for a dashboard "today's bookings" module.
- i=232, `media/232-img0.jpg` — calmer pastel-tint-plus-icon block style, closer to Solen's own "no loud colour" rule than i=13's saturated fill.

### Do not adopt

- Full saturated, highly vivid block colours (i=13, i=78) conflict with Solen's calm-colour rule; use the softer pastel-tint-plus-accent-bar version instead (already the mockup's choice).
- Dark-mode calendar variants (i=163, i=336, i=576's surrounding UI) do not apply, Solen is light-only.
- Fake/placeholder data and pure concept flourishes (glossy 3D icons in i=163, decorative gradients in i=334's modal header) are not real product decisions, skip them.
- The financial-calendar idiom of writing amounts directly inside day cells (i=543) does not fit an appointment calendar.

### Conflicts with locked values

- None found in the proposed version above; every element maps to an existing locked value (20px card corner + shadow, ink selection colour, pill controls) except the blue-selected time slot on the live booking-time page, which is already a live disagreement with the locked "blue for link text only" rule and should go back to main as a decision, not silently changed here.

---

## Corner radius family

**Reviewed:** 54 posts, all design=true and tagged shape-radius, all high relevance (32) plus all medium relevance sampled for this task (22): i = 17, 22, 28, 30, 82, 267, 273, 274, 276, 277, 278, 279, 280, 287, 289, 292, 293, 298, 304, 311, 318, 323, 325, 326, 332, 334, 346, 350, 352, 362, 369, 370, 374, 375, 377, 381, 395, 399, 404, 516, 521, 525, 534, 539, 561, 562, 587, 621, 651, 668, 688, 701, 706, 713. Several of these overlap with the calendar and depth/shadow sets and were cross-read once.

### Recurring patterns (most common first)

**1. A small 2-3 step radius scale per screen, reused consistently, about 30 of the 46 posts.**
Typical shape: a large outer container (card, sheet, modal, hero photo) at roughly 16-28px, most often clustering 16-24px; smaller nested rounded-rect elements (secondary chips, small tiles, utility icon buttons) at roughly 8-16px when they are not full round; and fully round pills (radius effectively 9999, i.e. height divided by two) for anything actionable: buttons, segmented controls, filter chips, badges, avatars, steppers, search bars. Examples: i=267 (sheet about 20-24px containing a card about 16px containing pill buttons and badges), i=516 (modal about 24-28px, photo about 16px, link field about 12px, pill CTA), i=404 (property card and its photo share one radius, segmented toggle and search bar are full pill), i=346 (hero card, pill CTA, pill category chips, exactly two radii used on the whole screen).

**2. Nested radius is usually smaller than its parent, by roughly a third to a half, not a fixed ratio.**
i=516 steps 24 to 16 to 12, each step roughly 65-70% of the one before. i=267 steps a similar way. This is a trend, not a rule some designs keep the photo's corner identical to its card's corner when the photo bleeds to the card edge (i=404, i=375, i=289), reading as one continuous shape instead of a visibly smaller nested one. Both choices appear often enough that either is defensible; the difference is whether the photo is inset (padding around it, smaller radius reads correctly) or bleeds to the edge (matching radius reads correctly).

**3. Pill (fully round) is the default for anything you can press or select, not for containers.**
Buttons (primary and most secondary), segmented controls and tabs, filter/interest chips, status badges, search bars, quantity steppers, avatars, and standalone icon-only circular buttons are pill or full circle in the large majority of posts reviewed (roughly 35 of 46). Rounded-rectangle is kept for cards, sheets, modals, photos, and, notably, for **vertical nav-rail icons**: i=587 shows a sidebar's icon buttons as small rounded squares, about 10-12px, not pills, the one clear counter-example to "everything actionable is a pill." Small utility icon buttons inside a toolbar (i=362, edit/regenerate/duplicate icons) are also rounded-square rather than circular, seemingly reserved for secondary, lower-emphasis actions, while the primary control on the same screen (the play button) is a full circle.

**4. A minority of screens, especially real B2B/SaaS admin tools, use one small uniform radius throughout instead of a scale.**
i=287 (a real e-commerce order-detail admin) and i=525 use a flat, utilitarian radius around 6-10px everywhere, with little or no pill use and no visible nesting logic. This reads as a genuinely different, more work-tool aesthetic than the consumer-app pattern above, and is not what Solen should copy (Solen is closer to the consumer/marketplace end of this spectrum).

**5. Squircle or illustrated icon tiles occasionally replace a plain circle for a decorative badge, about 4 posts (278, 350, 688).**
i=278 uses hexagon-shaped achievement badges instead of circles or squares, the one true shape exception found. i=350 mixes 3D illustrated squircle tiles (piggy bank, gift) with plain circular action buttons on the same screen, using the shape difference to separate "illustration" from "control." i=688 nests a small rounded-square icon badge inside an otherwise fully pill button.

**6. A "commit" or "pay" button sometimes deliberately sits one step short of full pill, even on a screen where every other control is full pill, i=701.**
On the same booking-availability screen where the time slots and menu chips are full pill, the "Proceed to Pay" button is a medium rounded-rect, about 14-16px, not a capsule. This reads as a small deliberate weight difference: a payment/commit action looking more "final" and less like a filter chip. This is one post, not a repeated pattern (nothing else in the 46 reviewed showed the same trick), but it is a directly relevant, evidence-based data point for Solen's own open question about whether the approved payment-lift screen's capsule CTA should be a named exception to the general lock: this X example argues the opposite direction, a payment CTA reading as a rounded-rect step short of full pill, not full pill itself. Flagged for main to weigh, not a recommendation either way.

**7. Desktop tool panels are more likely to keep primary CTA buttons as a rounded-rect (about 8-12px) instead of a pill, even when the rest of the mobile-consumer set favours pill.** i=287 (order-detail admin), i=311, i=334 (AlignUI calendar modal), i=277. About 5-6 posts, concentrated in SaaS/admin-feeling screens rather than consumer apps. Worth knowing if Solen's own dashboard (a work tool, not a consumer surface) ever wants a deliberately different, flatter button language than the customer-facing app.

### Solen today

From `sys/groups.json` and `sys/b5-cards.jpg` (13 measured card variants across 14 real Solen routes):

- **Card corner radius has 8 distinct values in live use for the same "card" role, with no established scale:** 22px grey-fill no-border (38 instances, home/salon), 16px grey-fill no-border (37 instances, search/rewards/inspo), 16px white-with-border (19 instances, home/rewards/dash-home/dash-settings/dash-services/dash-clients), 20px white-with-border (9 instances, dash-home), 24px white-with-border (7 instances, salon/booking), 14px white-with-border (5 instances, rewards), 13px white-with-border (4 instances, home), 40px white-with-border (2 instances, home/search), plus one-off 16px/12px variants.
- **Buttons** show a similar spread: 16px rounded-rect (most primary buttons, "Hochsteck", "Styling"), full pill/radius 99 (day-strip buttons on dash-calendar, some secondary buttons), 13px, 40px, and one button at 0px (a flat notification row).
- **The new calendar mockup** uses a clean 3-step scale: grid card 20px, appointment blocks 12px, everything actionable (pills, icon buttons, FAB) full round, and the desktop nav rail icons at 14px rounded square, not a pill, which independently matches the exact pattern i=587 shows for vertical nav rails.
- **Disagreement:** the live product's card radius (8 different values) is the single messiest number in Solen's whole visual system based on this data. The new calendar mockup, by contrast, already behaves like the best X examples: a small reused scale (20 / 12 / full-round) rather than a grab-bag of sizes.

### The differences that matter

| X does | Solen does | Why it matters |
|---|---|---|
| A screen reuses 2-3 radii on purpose (large container, small nested chip, full-round action) | Solen's live cards alone use 8 different radii (12, 13, 14, 16, 20, 22, 24, 40) for the same role, no visible scale | This is the most measurable inconsistency in Solen's current UI; a user moving between home, salon, rewards, and dashboard sees a different card shape everywhere, which reads as unpolished even if no single card looks wrong on its own |
| Nested radius shrinks toward the center, or matches exactly when a photo bleeds to the card edge | Solen's photo cards (22px, 16px, 24px variants) don't follow a visible nesting logic relative to their inner content | Fixing this is mostly a matter of picking one scale and applying it, not inventing new geometry |
| Vertical nav-rail icons are small rounded squares, not pills (i=587) | The new calendar mockup's desktop rail already does this (14px) | No gap, already correct, keep it |
| Anything pressable defaults to a full pill | Solen's locked system already mandates pill buttons and chips | No gap, already correct, keep it |
| A flat single small radius (6-10px) with no pill use marks a "work tool" rather than a consumer marketplace feel | Solen mixes both: some admin-feeling dashboard cards near 13-16px sit next to consumer-feeling 22-24px cards | Worth knowing which parts of Solen should feel like a fast tool (dashboard tables, settings) versus which should feel soft and consumer-grade (booking, discovery), so the radius choice can follow that intent rather than being accidental |

### Proposed Solen version

Own judgment, grounded in the patterns above and in Solen's own locked 20px box value:

- **Radius scale, 3 steps plus pill:** large container (card, sheet, modal, photo) = **20px**, matching Solen's own locked box value and the mockup. Small nested element (chip, secondary tile, small badge that is not a pill) = **12px**, taken from the calendar mockup's own appointment-block choice, reused as the system's "small" step. Anything pressable or selectable (buttons, chips, segmented controls, avatars, icon buttons, badges) = **full pill (9999)**, matching Solen's existing lock.
- **Nesting rule:** when a photo or inner panel is inset with visible padding, give it the smaller step (12px) or drop one step from its parent; when a photo bleeds to the card's own edge with no padding, match the card's radius exactly (20px) so the shape reads as continuous. Own judgment, following pattern 2 above.
- **Vertical nav rail icons:** small rounded square, about 12-14px, not a pill. Taken from the calendar mockup (14px) and independently confirmed by i=587.
- **States:** selected pill = ink fill + white text (already locked); disabled pill = same shape, lighter grey fill, muted text, own judgment, no new radius; empty state containers keep the same 20px/12px scale, only the fill or border changes, not the shape.
- **What to retire:** the 13px, 14px, 22px, 24px, and 40px card variants currently in live use should fold into the 20px step unless a specific one has a deliberate reason to differ (own judgment, flag for main to confirm before removing any specific instance).

### Best exemplars to show the owner

- i=516, `media/516-img0.jpg` — clearest 4-step nesting (modal, photo, field, pill) in one screen, easy to point at and count.
- i=404, `media/404-img0.jpg` — card and its bled photo share one radius, segmented toggle and search bar are full pill; the cleanest 2-radius system in the set.
- i=346, `media/346-img0.jpg` — hero card, pill CTA, pill category chips, exactly two radii used on the whole screen, closest to Solen's own home page anatomy.
- i=587, `media/587-img0.jpg` — the clearest evidence for rounded-square (not pill) vertical nav icons, directly validates the calendar mockup's desktop rail.
- i=267, `media/267-img0.jpg` — sheet, inner card, pill badges and CTA, a second clean 3-step example.
- i=278, `media/278-img0.jpg` — the one real shape exception (hexagon badges), useful to show as a "do not adopt, here is why it stands out" example.
- i=701, `media/701-img3.jpg` — the "Proceed to Pay" button sitting one step short of full pill on an otherwise all-pill screen; show this specifically next to the open payment-CTA radius question below.

### Do not adopt

- The single flat 6-10px radius with no pill use (i=287, i=525) reads as a generic B2B tool, not Solen's consumer/marketplace feel; do not apply it to customer-facing screens.
- Hexagon or other novel polygon badges (i=278) are a one-off flourish, not a system, skip.
- Squircle 3D illustrated tiles (i=350) are decorative and tied to that product's illustration style, not something to copy wholesale.

### Conflicts with locked values

- None in the container/nesting proposal above. The only genuine open item this research touches is Solen's own recorded open question about the approved payment-lift screen's capsule CTA (is it a named exception to the general lock, or does the lock govern it). This research did not resolve that question and was not asked to; it did surface one directly relevant data point (pattern 6 above, i=701): on the one X screen that shows a payment/commit button next to fully-pill filter controls, the payment button is a medium rounded-rect, not a capsule, meaning it reads as more "final" by being less round than the rest of the screen, not by being more round. That argues against a capsule-as-payment-signal reading. This is a single example, not a repeated pattern, so it should inform the owner's decision, not settle it.

---

## Depth / Shadow / Surface

**Reviewed:** 53 posts across two tags. Depth-shadow, design=true, all 27 reviewed (i = 11, 14, 205, 228, 234, 237, 262, 272, 275, 277, 285, 299, 309, 313, 347, 358, 369, 516, 521, 532, 534, 539, 560, 562, 575, 690, 706). Glass-blur, design=true, all 26 reviewed (i = 17, 31, 64, 92, 106, 107, 124, 128, 130, 136, 151, 157, 161, 169, 206, 315, 323, 347, 354, 527, 573, 574, 633, 654, 687, 708). Of these 53, only about 12 show a full screen with a clear, judgeable page-versus-card relationship; the rest are single-component close-ups (a button, a pill, an icon, a toggle) or cards floating over a photo/gradient rather than a flat page, and cannot answer the surface question honestly, so they are excluded from the tally below rather than force-fit into a bucket.

### The surface question, answered directly

Across the 12 posts that could actually be judged: **grey page with white card (A) and white page with shadow-separated card (B) are roughly equally common, and white page with a grey/tinted fill instead of a shadow (C) is rare.**

- **A, grey/tinted page + white card, shadow does the separating: 7 of 12** — i=237 (`media/237-img1.jpg`, sidebar plus a white "Complete setup" progress card), i=277 (`media/277-img0.jpg`), i=313 (`media/313-vid0.jpg`), i=516 (`media/516-img0.jpg`), i=562 (`media/562-vid0.jpg`), i=017 (`media/017-img1.jpg`), i=228 (`media/228-img0.jpg`).
- **B, white page + white/near-white card, separated mainly by shadow: 4 of 12** — i=11 (`media/011-img0.jpg`), i=521 (`media/521-img0.jpg`), i=560 (`media/560-img0.jpg`, the softest, most restrained shadow found in the whole set), i=690 (`media/690-vid0.jpg`).
- **C, white page + a grey/tinted fill card, no real shadow doing the work: 1 of 12** — i=285 (`media/285-img0.jpg`), which uses pastel gradient tints instead of a shadow, and hairline row borders inside the card instead of a shadow.

In short: **shadow, not a flat grey fill, is how good designs separate a card from its page, whether the page itself is grey (A) or white (B).** A grey page is not required for a card to read clearly; a white page with a soft shadow works just as often in this evidence. Giving a card a different flat colour with no shadow (C) is the least common and weakest-looking option of the three.

### Recurring patterns beyond the A/B/C split

**Shadow layering, single soft wide blur, low opacity, dominates.** All 7 of the clean A examples and all 4 B examples use one diffuse shadow, never a stacked "tight contact shadow plus wide ambient shadow" combination. Darkness reads as light grey, never black or heavy. i=560 is the extreme, its shadow is nearly imperceptible, the card reads mostly from its own rounded edge. The one 2-layer exception found is a small scroll-to-top button (i=161), not a card, combining a coloured glow with a crisp neutral shadow underneath.

**Borders are used for a narrower job than page separation: marking a selected row, or dividing rows inside an already-shadowed card, not lifting a card off the page.** i=017 gives only the selected payment row a border while the other rows rely on the card's outer shadow alone. i=285's status table uses hairline row dividers with no shadow at all. No post in this set used a hairline border as the primary device to separate an entire card from its page the way Solen's current live cards do (see below).

**Glass/blur is used sparingly, on one hero element, almost never as a whole-screen material, and is trending lighter even in Apple's own product.** i=64 (real Apple Liquid Glass "Edit" pill) and i=323 (a frosted nav pill) are both light, restrained, single-element uses. i=573 is directly useful evidence: it shows Apple's own Control Center blur getting visibly lighter from iOS 26.5 to iOS 27 beta, real proof that even Apple is pulling blur intensity back, not pushing it further. i=157 (real Airbnb identity card) is not blur-based at all, it is a saturated pink-purple gradient card; structurally useful (a "verified" trust card), but its loud colour conflicts with Solen's calm-colour rule, adopt the card idea, not the palette.

### Solen today

- Solen's own live card inventory (`sys/groups.json`) shows **sh:none on 12 of 13 measured card variants** almost every real card in the product today is separated from its page by a **1px hairline border** (`rgb(228,228,231)`, Solen's locked `#E4E4E7`), not a shadow. Only one measured card (an "inspo" card, 1 instance) carries an actual shadow, `rgba(0,0,0,.098) 0 5.9px 19.6px`.
- Page fill on the live product mixes grey-fill cards with no border (22px and 16px radius, 75 combined instances, the single most common card style today) and white cards with a border (the remaining ~55 instances). This means Solen today runs **pattern C most of the time on grey-fill cards, and a border-only version of B on white cards** neither of which is the dominant, best-looking pattern in the X evidence.
- The new calendar mockup uses Solen's locked shadow recipe correctly: white page, white card, `rgba(0,0,0,.02) 0 0 0 1px, rgba(0,0,0,.10) 0 8px 24px`, no border. This is pattern B, and it matches the strongest, most consistent evidence above.
- No glass/blur material is used anywhere in Solen today or in the new mockup. Solen's locked values do not currently address this either way.

### The differences that matter

| X does | Solen does | Why it matters |
|---|---|---|
| Shadow is the primary way a card is separated from its page (11 of 12 judgeable posts) | 12 of 13 measured live card variants use a hairline border instead of a shadow, and only one carries a real shadow | This is a direct conflict with Solen's own locked value ("boxes... soft shadow... no outline"); the live product mostly does the opposite of its own written rule today |
| A grey/tinted fill with no shadow is the least common, weakest pattern (1 of 12) | A large share of Solen's live cards (75 of ~130 measured instances) are grey-fill cards with neither border nor shadow | Solen's most common current card treatment is the pattern the X evidence favours least |
| Shadows are single-layer, soft, wide, and light in intensity, never heavy or theatrical | Solen's locked shadow recipe is already soft and light (`.10` opacity, no dark heavy layer) | No gap, Solen's written rule already matches the best X pattern, the live product just is not using it consistently |
| Glass/blur, where used at all, sits on one hero element and is trending lighter even at Apple | Not used anywhere in Solen | No gap, nothing to fix; worth knowing this is a legitimate "do not need" rather than a missed opportunity |
| Borders mark a selected state or divide rows inside a shadowed card, not the whole card's separation from the page | Solen uses borders as the main separation technique for most cards | Confirms the fix is not "add borders," it is "replace the border-only cards with Solen's own existing locked shadow recipe" |

### Proposed Solen version

Everything below is already inside Solen's own locked values; the proposal is to apply them consistently, not to invent anything new.

- **Page:** white. Either a white or a light grey page is supported by the X evidence (A and B are roughly equal), but white keeps Solen consistent with its own "white page" lock and with the new calendar mockup, so stay white. Taken from Solen's own lock.
- **Card:** white fill, 20px corner (per the radius section above), Solen's own locked shadow `rgba(0,0,0,.02) 0 0 0 1px, rgba(0,0,0,.10) 0 8px 24px`, no separate hairline border on top of it. Taken from Solen's own lock, and matches pattern B (i=560, i=011, i=521).
- **Where a hairline is still useful:** inside a card, to separate rows or mark a selected item, not to hold up the whole card. Own judgment, following i=017 and i=285's internal row dividers.
- **Grey-fill cards (the current 22px/16px grey, no-border, no-shadow style used 75+ times today):** own judgment, replace with the white-plus-shadow recipe above wherever the card sits directly on the white page; a grey fill only makes sense as a genuinely different, lower-emphasis surface (for example, a disabled state or a secondary inset panel inside a white card), not as Solen's default card treatment.
- **Glass/blur:** own judgment, do not add. No pattern in the X evidence or in Solen's locked values calls for it, and the one useful piece of evidence found (i=573) shows the industry pulling back from heavier blur, not toward it.

### Best exemplars to show the owner

- i=560, `media/560-img0.jpg` and `media/560-img1.jpg` — white-on-white schedule card, the softest shadow in the whole set, shown in light and dark, directly comparable to a Solen dashboard card.
- i=237, `media/237-img1.jpg` — light grey page, white "Complete setup" progress card, soft shadow, maps directly to a Solen owner-onboarding card.
- i=017, `media/017-img1.jpg` — light page, white payment rows, soft shadow, border only on the selected row, close precedent for a Solen checkout or payment-method list.
- i=011, `media/011-img0.jpg` — white page, white stat cards, soft shadow, one restrained accent colour, good precedent for a Solen dashboard stat row.
- i=521, `media/521-img0.jpg` — pale near-white page, soft shadow, single green accent, minimal copy.
- i=573, `media/573-vid0.jpg` — not a card example, but the clearest evidence that blur/heaviness should trend lighter, worth showing to settle the "do we ever want glass" question.

### Do not adopt

- Dark-mode surfaces (i=206's real Revolut glass tab bar, i=532, i=534, i=539, and the dark half of several light/dark pairs) do not apply, Solen is light-only.
- Loud gradient "glass" buttons (i=107, iridescent "Thinking..." pill) are novelty/concept work, not a real product, and conflict with calm colour.
- Cards floating over a busy photo or gradient background rather than a flat page (i=157, i=262, i=275, i=347, i=354, i=358) are a different design problem (overlay legibility) than Solen's flat-page card system, and should not be used as evidence for page-versus-card colour.
- The grey/tinted-fill-instead-of-shadow pattern (C, i=285) is the weakest and rarest pattern found; do not expand Solen's current heavy use of it.

### Conflicts with locked values

- None in the proposal itself. The one real conflict this research surfaced is internal to Solen, not with the X evidence: Solen's written lock says cards get "soft shadow... no outline," but most of Solen's live cards today use a hairline outline and no shadow, the opposite of the written rule. This is flagged for main to decide how to close (mockup-first, page by page), not changed here.

---

## Return summary

Output written to `/private/tmp/claude-501/-Users-sulo-Documents-solen/f0a1afd0-7074-4b42-a21b-511dc0e732cd/scratchpad/xcomp/calendar-radius-surface.md`.

**Three biggest differences found:**
1. Solen's live calendar appointment blocks are all identical flat grey with zero colour differentiation, while the X evidence strongly favours colour- or tint-coded blocks; the new calendar mockup already fixes this and should be treated as the reference to finish, not redesign further.
2. Solen's live card corner radius is the messiest number in the system, 8 different values (12-40px) doing the same job with no scale, against an X pattern of a small reused 2-3 step scale; the new mockup's own 20px/12px/pill choices already match that pattern and can become the system-wide scale.
3. Solen's written lock says cards use a soft shadow with no outline, but most of Solen's live cards actually use a hairline border and no shadow, the reverse of both the written rule and the dominant X pattern (shadow, not a flat/bordered fill, is how good designs separate card from page).

**Could not settle:** the live product's Day/Week/Month segmented control on the phone calendar was not clearly legible in the screenshot to compare against X's segmented-pill pattern; and whether Solen's customer time-slot step should change its selected colour from blue to ink is flagged above as a locked-value conflict for main to decide, not resolved here.