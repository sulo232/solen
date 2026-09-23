# Buttons, Pills/Chips/Tabs, Icons: X research vs Solen today

Method note: for Solen "today" values I used the measured boards at `scratchpad/sys/b1-main-buttons.jpg`, `b2-secondary-buttons.jpg`, `b3-chips.jpg`, `b4-icon-buttons.jpg`, the raw numbers in `scratchpad/sys/groups.json`, and full-page screenshots `pg-home-a.png`, `pg-salon-a.png`, `pg-search-a.png`, `pg-rewards-a.png`, `pg-dash-services-a.png`, `pg-dash-calendar-a.png`. All values below are either read straight off those measured boards or, where marked "about", estimated by eye from an X still.

---

## Button

**Reviewed:** 60 posts.
High relevance (35): 17, 22, 28, 30, 50, 62, 82, 98, 123, 233, 243, 246, 267, 276, 279, 285, 334, 346, 369, 399, 404, 414, 432, 439, 475, 482, 498, 516, 525, 621, 628, 648, 679, 681, 688.
Medium relevance (25): 46, 53, 56, 64, 69, 107, 131, 156, 161, 172, 192, 201, 228, 264, 274, 300, 395, 436, 443, 556, 573, 593, 663, 699, 713.

### Recurring patterns (most common first)

1. **Full-width ink capsule primary CTA.** Black/dark fill, bold white centered label, fully round corner, no border, flat or barely-there shadow, 48-56px tall, spans the content width. Seen in 12+ of the 60 reviewed: 17, 30, 123 (blue variant), 233, 267, 279, 395, 432, 475, 516, 628 (blue variant), 713. All shipped-looking product mocks, none flagged `realProduct` but visually production quality. This is the single dominant pattern.

2. **Equal-width two-button pair for a binary decision**, both capsules, same height, sitting side by side: one filled (primary), one outlined or grey (secondary/dismiss). Examples: 50 (Use another card / Try again, dark mode), 69 (Not now / Add limit order, green). 2 clean examples, both concept.

3. **Small pill with a colored circular icon badge leading a bold label**, on a light or white pill (not full-width): 22 (Pay/Request), 300 (Reject/Approve). 2 examples, both concept, but a distinctive and legible sub-pattern worth naming separately from a plain text pill.

4. **Bare circular icon button with the label below it** (not beside it), used for a 3-across wallet-style action row (Buy/Send/Swap, Top Up/Scan/Transfer): 172, 274, 593. 3 examples, all concept, all finance apps, all the same anatomy: plain white or light-grey circle, no border, icon centered, 11-13px grey label centered below.

5. **Stacked full-width primary + secondary buttons**, same width, vertical, for auth/onboarding screens (Create account over Login, Submit over Cancel): 233, 279. 2 examples.

6. **Small grey (light) capsule secondary button**, text-only or icon+text, no border: 131 (Notify Me), 156 (Learn More), 699 (Update). 3 examples. This is the pattern closest to what Solen already has.

7. **Floating action button (FAB).** Solid circle, ink or brand color, single glyph ("+"), bottom-right corner of the screen, real shadow separating it from content: 53, 56 (both black, clean), 228 (orange gradient, concept only). 3 examples.

8. **Icon-in-rounded-square badge leading a full-width dark CTA**: 688 ("Book a call", orange badge on black pill). 1 strong example.

9. **Small non-interactive metadata/status pill riding on a card**, distinct from a clickable button but always nearby one: "Best Seller", "9 left", "Exclusive Bonus", "78% people upgraded", "Current plan". Seen in 267, 395, 443, 713.

### Solen today

From `b1-main-buttons.jpg` (9 live variants of the "black main button"):
- Heights 40-52px, corners either "round" (full capsule) or a fixed 12px, text 13-16px at weight 500 or 600, all black fill / white text / no border.
- Disagreement: every instance is a full capsule except "Add" on dash-services, which uses a 12px corner square-ish button. One button in the set ("Continue" on booking) is shown in a disabled grey-on-grey state.

From `b2-secondary-buttons.jpg` (9 live variants of "secondary button"):
- Three different fills for the same job: clear/transparent with border, white with border, grey with no border.
- Five different corner values across the 9: 0, 12, 13, 14, and round.
- Heights 42-54px, text 12-14px at weight 400 to 600.
- This is Solen's least consistent button family today.

From `b4-icon-buttons.jpg` (9 live variants of "icon button"):
- Back button alone ships in 3 different looks: round white no border, round white with border, round frosted-glass with border.
- The menu/hamburger button next to it is a rounded square, not a circle, breaking the shape family.
- Sizes 36-48px. One entry in this board is actually a toggle switch, not a button.
- FAB pattern exists once, on inspo ("New Post"): 48px black round with a "+".

From `pg-salon-a.png` and `pg-dash-services-a.png`: "Book" pill buttons are white with a border (44h, round); "Book appointment" is the full ink capsule; small pills like "View all" are grey fill, no border, no shadow.

### The differences that matter

| X does | Solen does | Why it matters |
|---|---|---|
| One primary button shape used everywhere (full ink capsule, one height, one weight) | 9 different corner/height/weight combinations for the "same" black button across 8 routes | The eye reads inconsistent corners and weights as unfinished, even when no single screen looks wrong alone |
| Secondary button = one look (grey fill or white+border, picked once) | 3 different fills and 5 different corners for secondary buttons | This is the most scattered family Solen has; it needs to converge to one before anything else |
| Two-button pairs are equal width, same capsule family, differ only by fill | Solen has no clear "confirm/dismiss pair" pattern yet (the closest is Slot/Walk-in/Plan on dash-calendar, which is 3 buttons of different visual weight, not a pair) | A booking-flow "Try again / Use another card" style choice will come up (declined payment, cancel confirmation) and Solen has nothing to reuse |
| Icon buttons are one shape (always circle) with one look | Icon buttons ship in 3 looks for "Back" alone, plus a rounded square for "menu" | Circle vs rounded-square next to each other on the same screen reads as sloppy, not intentional |
| FAB is a clean solid circle with a shadow, nothing else on the screen competes with it | FAB exists once (inspo "New Post"), unclear if it is meant to be a reusable pattern | Worth deciding now whether Solen wants a FAB pattern (e.g. dashboard quick actions) before it gets invented ad hoc later |

### Proposed Solen version

**Primary button** (own judgment, values taken from Solen's own most-repeated real instance): 52px tall, fully round (capsule, per lock), ink #0A0A0A fill, white text 15px/600 (matches the already-locked 15px CTA label size), no border, no shadow beyond the standard box shadow rule, full width when it is the only action on a screen. Disabled: grey #F4F4F5 fill, grey text (already shipping on Solen's booking "Continue" button, keep it).

**Two-button pair** (pattern 2, X): for confirm/dismiss modals (declined payment, delete confirmation, cancel booking). Equal-width capsules, 48px, side by side, gap 8-12px. Primary = ink fill. Secondary = white fill, 1px hairline border #E4E4E7, ink text. This is new for Solen; nothing today plays this role.

**Secondary button** (own judgment, picking the single cleanest of Solen's 3 existing looks): white fill, 1px hairline border #E4E4E7, ink text, 44px, capsule. Retire the clear/transparent-with-border and grey-no-border variants; keep grey #F4F4F5-fill-no-border only for the lowest-emphasis case (a "View all" style link-button), matching pattern 6 (131, 156, 699) and Solen's own "View all" pill.

**Tertiary / text link**: no fill, no border, blue #276EF1 only when it behaves like a hyperlink (per lock), otherwise ink text with no color change, used for Skip/Reset/Cancel-as-text (pattern from 123's "Skip", 621's "Reset").

**Icon button**: 44px circle (meets the 44px minimum touch target lock), white fill, 1px hairline border, always a circle regardless of what sits next to it (own judgment: drop the rounded-square "menu" exception and the frosted-glass variant, keep one consistent shape).

**FAB** (pattern 7, X): 56px circle, ink fill, white icon, bottom-right with safe-area margin, the one place Solen is allowed a real shadow since it floats over content, not on a flat surface.

**States:** default (as above) / pressed (per Motion-22, not redefined here) / disabled (grey fill #F4F4F5, grey text, already shipping) / empty (not applicable to buttons).

### Best exemplars to show the owner
- 62 — `media/062-img0.jpg` — full ink capsule CTA + selected category pill with icon, clean real-quality mock.
- 233 — `media/233-img0.jpg` — stacked primary/secondary capsule pair for auth.
- 69 — `media/069-img0.jpg` — equal two-button pill pair inside a modal.
- 688 — `media/688-vid0.jpg` — icon-badge-in-pill CTA.
- 53 — `media/053-vid0.jpg` — clean black FAB.
- 439 — `media/439-img0.jpg` — selected filter pill next to a small inline CTA pill, in context.

### Do not adopt
- Dark mode screens throughout (50, 107, 556, etc.) — Solen is light-mode only.
- Glossy/iridescent gradient button fills (107 "Thinking...", 161's gradient calendar icon) — conflicts with "calm colour, no loud colour."
- Liquid-glass translucent buttons (64) — not a Solen material.
- Loud non-ink button colors used as a general pattern (22's green/blue, 300's red/green) — fine as inspiration for the icon-badge sub-pattern, not as a fill color for Solen's actual button.

### Conflicts with locked values
- 46's full red "Delete Account" pill is a genuine open question, not a conflict to silently resolve: Solen has no locked destructive-button color. Flag for the owner: does a destructive action ever get a filled-red button, or does it stay ink-fill with a text-only warning above it? Nothing here overrides that; it needs a decision.

---

## Pill / chip / tab

**Reviewed:** 35 posts.
High relevance (23): 23, 61, 68, 84, 87, 104, 221, 273, 292, 323, 370, 514, 533, 534, 546, 621, 625, 642, 648, 666, 668, 701, 706.
Medium relevance (12): 27, 70, 91, 109, 167, 212, 299, 316, 604, 611, 640, 680.

### Recurring patterns (most common first)

1. **Filter/category chip, selected = full ink fill + white text (icon included).** Unselected = white fill, thin border or no border, ink text. Seen repeatedly: 62, 70, 404 (fact chips, no), 439, 546, 625, 646, and the real shipped Apple Fitness+ nav (23, `realProduct: true`). This is the single most common selected-state treatment across the reviewed set, real and concept alike, and it is exactly what Solen's locked value already says to do.

2. **Segmented control with a white pill floating inside a light-grey track**, used for 2-4 equal options (Day/Week/Month, Summary/Itinerary, Programs/Nutrition/Check-ins/Progress): 104, 267, 316, 604. The white segment carries a small shadow to lift it off the track.

3. **Segmented control where the selected half fills the whole track edge-to-edge** (true binary toggle, e.g. Buy/Rent, Free/Premium): 299, 404, 666. No visible track once selected; the fill goes right to the corner.

4. **Underline tab** for filtering a list or table: black text + underline for selected, grey text with no underline or background for the rest, used specifically in data-heavy contexts (a reviews list, a client table, a sales dashboard period switch): 414, 533, 611. Three separate real-looking dashboards all reach for this instead of a pill when the job is "filter a table," never for browsing categories.

5. **Outline-selected chip** (the opposite of pattern 1): unselected = plain fill, no border; selected = white fill with a visible black/ink border. Real Airbnb date-flexibility pills (621, `realProduct: true`) and an interests picker (273) both do this.

6. **Booking-specific date/time-slot grid**: calendar dates with a small availability dot, selected date = solid dark filled rounded square; time slots below in a 3-column grid, unselected = white with thin border, selected = dark fill + white text (701). This is a near-exact template for Solen's own booking-time page.

7. **Glassmorphic pill-shaped bottom nav**, the whole tab bar is one floating rounded capsule and the active tab gets a white (or tinted) pill highlight behind just that icon: 61, 68, 87, 323. Real and concept mixed, this is a distinct structural pattern from a flat tab bar, seen often enough to name but not to casually retrofit.

8. **Small compact utility chips** (native iOS sheet style): grey fill, no border, icon or short label, ~28-32px, used for secondary options inside a form (Keep open / No List / date): 640, real Apple product.

### Solen today

From `b3-chips.jpg` (9 live variants):
- Corners: either fixed 16px or fully round, two families for what should be one.
- Heights 37-44px.
- Four different "selected" treatments show up across the 9 crops: an ink-fill crop that is cut off in the harvest (7x on salon), a blue-tint fill with blue text (dash-services "All", `rgba(39,110,241,0.1)` bg), a plain grey fill (dash-clients "All5"), and most of the actual service-filter chips on the salon page show no selected state at all in the harvest, just a white bordered look for every option.

From `pg-dash-services-a.png` (live): the "All" filter chip is selected with a light blue tint fill and blue text, not ink fill.

From `pg-dash-calendar-a.png` (live): the day-of-week picker (Mon 21 ... Sun 27) shows the selected day ("Wed 23") only by bolding the text. No fill change, no border change. This is the weakest selected-state signal Solen has anywhere.

From `pg-home-a.png` / `pg-search-a.png` (live): the category row (All / Hair Salon / Barbershop) shows its "selected" state as a small ink-filled circle behind just the icon, inside an otherwise white-bordered pill. The pill itself never fills ink.

From `pg-dash-calendar-a.png`: the Day/Week/Month control already uses the white-pill-in-grey-track pattern (pattern 2), correctly.

### The differences that matter

| X does | Solen does | Why it matters |
|---|---|---|
| One selected-chip look used consistently: ink fill, white text (pattern 1) | Three different selected looks depending on which page you're on: blue tint (dash-services), bold-text-only with no fill (dash-calendar days), and an ink circle around just the icon (home/search categories) | Solen's own locked value already says "selected pill = ink fill + white text." The app disagrees with its own lock in at least two places today |
| Segmented controls (Day/Week/Month-style) use a floating white pill in a grey track | Solen's Day/Week/Month control on dash-calendar already does this correctly | No gap here, worth confirming as the standard rather than changing it |
| Booking-style date/time pickers show clear filled selected states for both the date and the time slot (701) | Solen's dash-calendar day picker shows no fill for the selected day at all | This is the clearest, most fixable gap: a real booking flow (dash-calendar, booking-time) should look like 701, not like today's bold-text-only day picker |
| Underline tabs are reserved for filtering a table or list, pills are reserved for browsing categories | Solen doesn't yet distinguish the two; both jobs currently use similar bordered chips | Giving each job its own component (pill for browse, underline for table-filter) is a small, well-evidenced fix that avoids inventing anything new |

### Proposed Solen version

**Filter/category chip** (pattern 1, the dominant pattern, and already Solen's own lock): default = white fill, 1px hairline border #E4E4E7, ink text, icon leading when the row uses icons, 40-44px tall, fully round. Selected = ink #0A0A0A fill, white text, icon (if present) turns white too. Retire the blue-tint dashboard version and the icon-only-badge version; there should be exactly one selected look everywhere, per Solen's own lock.

**Segmented control (2-4 equal options)**: light-grey #F4F4F5 track, fully round or matching the page's corner rhythm, 44-56px tall; selected = white floating pill with a soft shadow inside the track (pattern 2, already correct on dash-calendar's Day/Week/Month — keep it, extend it to any new multi-way toggle).

**Binary edge-to-edge toggle** (pattern 3): reserved only for a true two-way branch with no third option (e.g. a hypothetical Buy/Rent-style split). Selected half fills ink, unselected half stays white/grey text, no visible seam. Own judgment: use sparingly, the segmented-track version above should be the default even for 2 options unless the two choices are truly opposite/exclusive.

**Underline tab** (pattern 4, taken directly from 414/533/611): black text + 2px black underline for selected, grey text for the rest, no background at all. Use this specifically for filtering a list or table (bookings list, client list, reviews), never for browsing categories or services.

**Booking date/time pills** (pattern 6, near-exact template from 701): fixes the concrete gap above. Calendar dates keep Solen's existing availability-dot convention but the selected date becomes a solid ink-filled rounded square (not bold-text-only). Time/day pills in a grid: unselected white + hairline border, selected ink fill + white text.

**States:** default (bordered white) / selected (ink fill white text) / disabled (grey fill #F4F4F5, grey text — sourced from 546's disabled "Continue" pill, same rule as the button component) / empty (not applicable to a chip itself, but an empty filter result should say so in the content area below it, out of scope here).

### Best exemplars to show the owner
- 23 — `media/023-vid0.jpg` — real Apple Fitness+ pill tab bar, ink-fill-selected at its cleanest.
- 668 — `media/668-img0.jpg` — real Apple Maps default browse pills (unselected state, white, no border, icon leading).
- 546 — `media/546-img0.jpg` — selected vs unselected chip side by side, plus a disabled CTA pill.
- 701 — `media/701-img0.jpg` — booking date/time-slot pills, the direct template for Solen's booking flow.
- 316 — `media/316-vid0.jpg` — segmented tab, white pill floating in a grey track.
- 370 — `media/370-img0.jpg` — equal-width segmented value pills (service charge selector), useful if Solen ever needs a numeric-choice pill row.

### Do not adopt
- Glassmorphic floating-capsule bottom nav (61, 68, 87, 323) — a real, recurring pattern, but restructuring Solen's flat bottom tab bar into a floating pill is a bigger structural change than this component pass covers. Worth a separate, explicitly scoped decision later, not a silent adoption here.
- Rainbow multicolor emoji chip picker (273, 546) — the chip anatomy itself (pattern 1/5) is reusable, the loud multicolor emoji treatment is not; any Solen version should use Lucide icons per lock, not emoji.
- Neumorphic glowing "pebble" segmented control (706) — too skeuomorphic/glassy for Solen's flat surfaces.

### Conflicts with locked values
- None new. The dashboard's blue-tint selected chip and the icon-only-badge selected pattern are not really "X conflicts with Solen's lock," they are Solen conflicting with its own already-locked value ("selected pill = ink fill + white text"). This should be treated as a bug to converge, not a new decision to make.

---

## Icon treatment

**Reviewed:** 25 posts.
High relevance (11): 28, 153, 185, 237, 278, 282, 587, 625, 642, 668, 706.
Medium relevance (14): 96, 108, 116, 132, 134, 154, 195, 229, 271, 333, 379, 539, 591, 619.

### Recurring patterns (most common first)

1. **Colored filled circle icon badge leading a list row**, used for transaction/action rows (Buy, Convert, Send, Deposit; Add Money, Withdrawal, Interest Earned): white icon inside a solid semantic-colored circle (blue, orange, green, grey), ~40-48px, label + description to the right. Seen in 229, 539, and echoed by Solen's own rewards perk rows (grey circle, no color) and the salon "Team" avatars. This is the most repeated icon treatment in the whole reviewed set.

2. **Bare stroke icon, no background**, used inline beside text in nav rows, settings rows, sidebars: 237 (before state), 282, 591, 619. Stroke weight is even and geometric, about 1.75-2px at typical UI sizes, matching Lucide's own default (directly shown in 271's Lucide-vs-Hugeicons comparison).

3. **Filled solid icon, no background, no circle**, used for compact system-style icon grids and native chrome (bell, wifi, heart, star): 134, 154 (real Apple SF Symbols). Distinct from pattern 2: same "bare" placement, but the glyph itself is filled rather than outlined.

4. **Icon-in-circle for a standalone tap target with no adjacent label** (back, share, favorite/heart, close, options "..."): 185 (route-picker pins), 278 (back/options), matches Solen's own existing back/menu/favorite buttons.

5. **Filled vs outline used specifically to mark a toggled/done state**: an empty outline circle for "not done" next to a solid green filled circle+check for "done" (153); an unchecked outline circle vs a checked filled green circle in a checklist (already seen in the pill component's post 292); a heart that is outline when un-favorited (116) and, on other posts, solid/colored once favorited. This is the same convention Solen already uses for its star ratings (filled gold vs outline grey) and its bottom tab bar (ink filled icon selected, grey outline unselected).

6. **Small active-state highlight behind just the icon**, not the whole row: a white or light rounded-square/circle sitting directly behind one icon in a 2-3 icon toggle group (list/kanban view switch, weather/transport picker): 282, 706. This is a smaller-scale cousin of pattern 4, used specifically for view-mode toggles.

7. **Small rounded-square brand/app logo badge**, ~20-28px, used in integration or provider lists (Slack, Crunchbase, Clearbit): 132, 619.

### Solen today

From `b4-icon-buttons.jpg`: bare circle icons (back, menu) at 36-44px, mostly white fill with inconsistent border treatment (see Button section above for the full list of 3 different "Back" looks).

From `pg-home-a.png` / `pg-search-a.png`: bottom tab bar uses bare icons, no background, no circle: selected tab = ink filled icon + ink label, unselected = grey outline icon + grey label. Favorite heart = white circle background, outline heart icon, no color until favorited (not visible in the static shot whether it fills red on favorite). Star ratings = filled gold star icons, one outline star when the rating isn't a whole number (4.2 shows 4 filled + 1 outline).

From `pg-salon-a.png`: back/share/favorite = bare icon in a plain white circle, no color, no border shown. Team avatars are photo circles, not icon badges. Review star row = same filled/outline star convention.

From `pg-rewards-a.png`: perk rows use a plain grey icon inside a light grey circle (#F4F4F5-style), bare stroke icon, no color coding by perk type. Tier progress track uses a filled ink circle with a checkmark for the completed tier and empty outline circles (medal, crown) for locked tiers, matching pattern 5 exactly.

From `pg-dash-services-a.png`: row icons (drag handle, edit pencil, chevron) are all bare stroke, no circle, no color, consistent ~18-20px weight.

### The differences that matter

| X does | Solen does | Why it matters |
|---|---|---|
| Colored circle icon badges are used deliberately to color-code a row by type (blue=deposit, orange=convert, green=send) | Solen's rewards perk-row icons are all the same grey, uncoded | Not wrong, just a missed opportunity: Solen's dashboard activity/transaction-style lists (bookings, notifications) could use this same color-by-type convention if the owner wants faster scanning, without adding any new color outside what's already semantic |
| Filled-vs-outline is used consistently as the one signal for "done/selected" vs "not done/unselected" | Solen already does exactly this for stars and the bottom tab bar, but perk-lock icons and favorite hearts don't obviously follow the same rule everywhere | Worth confirming this is applied consistently as new icon work is added, not a redesign, just a rule to keep enforcing |
| Icon-in-circle is reserved for standalone tap targets with no label next to them (back, share, close) | Solen already does this correctly for back/share/favorite | No gap, confirms current practice is right |
| Stroke weight is even and consistent everywhere, matching Lucide's own default geometry | Solen is already locked to Lucide only | No gap, this is really just external confirmation that the Lucide-only lock is the right call and doesn't need a heavier or more custom-drawn treatment to look competitive |

### Proposed Solen version

**Bare stroke icon** (pattern 2/3): Lucide only (locked), 1.75-2px stroke, 16px inline with dense text, 20px as the default UI icon size in rows and buttons, 24-28px for a section-header or category-style icon. No background, sits directly beside its label.

**Icon-in-circle**: reserved for two jobs only, per pattern 1 and pattern 4 combined (own judgment on the boundary, values taken from Solen's own existing back/share/favorite buttons): (a) a standalone tap target with no adjacent label, 36-44px, white or light-grey circle, ink icon, matching what Solen already does for back/share/favorite; (b) a semantic color-coded row badge where the circle's color itself carries meaning (transaction type, category), 40-48px, white icon on a solid semantic color, taken directly from pattern 1 (229, 539). Do not use icon-in-circle for a plain decorative icon with a label already next to it; use bare instead.

**Filled vs outline for selected/toggled state** (pattern 5, already Solen's own practice): outline = default/unselected/not-done; filled (and, where the icon is inherently colored like a heart or star, colored) = selected/done/active. Applies to favorites, checklist items, ratings, and the bottom tab bar. This is a confirmation of Solen's current rule, stated explicitly so new icon work doesn't drift from it.

**Small active-highlight for a 2-3 icon toggle group** (pattern 6): a light rounded-square or circle sitting behind just the active icon inside a compact segmented icon row (e.g. a list/kanban view switch). Own judgment: use sparingly, only for genuine view-mode toggles, not as a general selected-icon treatment (that job belongs to pattern 5).

**States:** default (bare or in-circle per the rule above) / selected-or-done (filled, colored where the icon has an inherent color) / disabled (grey, reduced-opacity icon, no change in shape) / empty (not applicable to an icon itself).

### Best exemplars to show the owner
- 271 — `media/271-img0.jpg` — Lucide vs Hugeicons side by side, grounds the stroke-weight and shape choice Solen has already locked.
- 539 — `media/539-img0.jpg` — colored icon-in-circle menu rows, the clearest version of pattern 1.
- 153 — `media/153-vid0.jpg` — outline vs filled state pair (not done / done), the clearest version of pattern 5.
- 154 — `media/154-vid0.jpg` — real Apple SF Symbols bare filled icon grid, pattern 3 at its cleanest.
- 229 — `media/229-vid0.jpg` — colored circle icon transaction rows, a second strong example of pattern 1 in a finance context close to Solen's dashboard.
- 185 — `media/185-img0.jpg` — icon-in-circle (bare) next to an inline bare icon on the same screen, showing the boundary between the two uses.

### Do not adopt
- 3D custom mascot/gradient icons (195's piggy bank, 228's glow) — conflicts with Lucide-only.
- Hand-drawn or blob character icons (118, 151) — same reason.
- Glossy app-icon-style badges (527) — decorative app-icon treatment, not a UI icon system.
- The richer, more custom-detailed "after" sidebar icons in 237 — genuinely nicer than the plain "before" set, but it is a bespoke icon set, not Lucide, so it directly conflicts with the lock; shown here only as evidence that plain Lucide is a deliberate constraint being kept, not an oversight.

### Conflicts with locked values
- None beyond the Lucide-only lock already covered above under "do not adopt." No X pattern reviewed here asked Solen to break a floor, a color rule, or a sizing rule; the only real tension is custom/bespoke icon sets vs the Lucide-only lock, and the recommendation is to keep the lock.
