# Navigation, Input/form, Sheet/modal: X research vs Solen today

Method note: for Navigation and Input/form, all "high" relevance posts were reviewed plus a large sample of "medium" (72 of 79 non-low posts for Navigation, 61 of 76 non-low posts for Input/form), well past the 25-post minimum. For Sheet/modal only 16 design-tagged posts exist in total, so all 16 (high, medium, and low) were reviewed. Images were read directly, not inferred from the `shows` text field. Solen-today values come from the measured boards (`sys/groups.json`, `sys/b3-chips.jpg`) where a value was actually measured, and from direct inspection of the listed page screenshots where it was not; the latter are marked "about."

---

## Navigation

- **Reviewed:** 72 posts. High (32, all): 23, 35, 72, 87, 89, 98, 121, 232, 237, 248, 252, 270, 278, 282, 287, 303, 306, 323, 325, 336, 346, 356, 381, 404, 522, 534, 551, 587, 614, 638, 666, 679. Medium (40 of 47): 0, 39, 40, 73, 97, 113, 120, 122, 147, 149, 164, 168, 173, 181, 187, 193, 198, 203, 206, 212, 217, 218, 225, 244, 255, 257, 259, 302, 308, 329, 532, 540, 594, 595, 618, 620, 626, 660, 672, 685.

### Recurring patterns

**Bottom tab bar**

1. Floating rounded pill, detached from the screen edge, drop shadow. The bar is a fully-rounded rectangle floating about 12-20px above the bottom edge (not edge to edge), white or frosted fill, soft shadow lifting it off the page. Active tab = filled dark pill containing icon plus label; inactive tabs = icon only, grey, no label. Shown in 6 of the posts reviewed, all concept: 278 (Home/Calendar/Trophy/Profile), 306 (Home/Bookings/Messages/Profile, dark green active capsule), 346 (same idea), 618 (same bar plus a raised circular blue FAB breaking the top edge), 325 (icon-only row in a frosted pill, no labels at all, active = solid orange icon chip).
2. Edge-to-edge flat bar, label always visible on every tab (not just the active one). Full-width, flush at the bottom, white or dark bg, 4-5 items. Shown in 5 posts, 2 of them real shipped products: 089 and 206 (Revolut, dark bar, white active icon+label vs dimmed grey inactive icon+label, both labels always showing), 217 and 259 (Home/My Care/Store/Support/Account, blue active).
3. Reduced 3-item bar for simpler apps, plain icon+label, no pill container, generous spacing. 551 (Circle Ride: Search/Trips/Account, blue active), 212 (Tasks/Chat/Library, concept).
4. Center-raised FAB breaking the bar at a tab slot. 618, a circular blue button elevated above the row line.
5. Icon-only row, no bar chrome at all, active shown only by a small colour chip behind the icon. 620.

**Top bar / header**

1. Dashboard chrome: logo/workspace switcher left, search center, avatar+bell right, flat, no shadow, about 56-64px tall. Near universal across the SaaS dashboard posts reviewed (20+), all concept: 270 (Beacon), 282, 532 (SwiftFreight, dark), 660 (FlowAI), 237, 248.
2. Flat greeting header on mobile home screens: avatar top-left, bold "Hi/Good morning, [Name]" under it, bell top-right, no bar container at all. 259, 217, and the "Good evening, David" real-estate set (381, 666, 679). All concept.
3. Segmented pill switcher used as the entire top-level nav (no tab bar at all): a row of pills under the title, active = solid fill + white text, inactive = white/light + grey text. 023 (Apple Fitness+, "For You/Explore/Plans/Library", black active pill about 28px tall, real shipped product), 381/666/679 (Buy/Rent two-segment, dark green active).
4. Rounded search bar functioning as the header itself, about 44-48px tall, with a separate circular filter icon button beside it. 121 (real shipped product), 532, 660.
5. Bare chevron plus centered title, no button chrome at all, reads OS-native. 173 (Safari-style "History"), 087 (Instagram: chevron+name+bell+kebab inline).

**Sidebar**

1. Light/white collapsible sidebar with a workspace switcher, a search field, and grouped nav under small grey section captions. About 220-260px wide, active item = a light grey or white rounded-rect pill behind the row (no border or a very thin one), icon+label always shown, rows about 36-40px tall. Shown in 8+ posts, all concept: 237, 248 (shopwrk), 98 (Beacon), 181 (Courtney Hariq), 532 (Meridian Labs, with a nested/expandable group and the active sub-item rendered as a white card floating over the grey group background, a distinct treatment).
2. Dark/charcoal sidebar with a solid saturated colour block (blue in the example) as the active state, white text, plain grey (not caps) section labels, a promo card pinned above the account row. 594 (SwiftFreight). Concept.
3. Narrow icon-rail, about 180px, icons+labels stacked with generous spacing, no visible grouping, ends in an avatar+org+chevron row. 232 (Agents/Inbox/Team/Inventory/Services/Automations), 270 (Beacon, ends in a dark-mode toggle + logout).
4. A floating "complete setup" progress card pinned just above the account row: small ring progress indicator, two-line label, trailing chevron. 232, one clear instance, worth flagging as a reusable onboarding-nudge idea rather than a base sidebar requirement.

**Back control**

1. Ghost/outline circle floating on a photo, about 36-40px, semi-transparent white with a black chevron, often paired with a matching circular share/heart button on the other side. 072 (Kyoto travel card).
2. Bare chevron, no circle, no fill, sitting inline with the title at the same baseline, reads OS-native. 173, 087.
3. Close (X) plus a drag handle, used specifically when the screen is a sheet/modal rather than a page: circular X top-left, grey handle bar centered at the very top, share icon top-right. 638.
4. Dashboards almost never show a literal back control at all; navigation runs through the sidebar and, occasionally, a breadcrumb or a sidebar-collapse chevron (282). This held across every dashboard post reviewed.

Evidence weighting: the realProduct:true examples in this set cluster almost entirely in the top-bar and bottom-tab-bar findings (Apple Fitness+, Revolut, Circle Ride, a real-estate/explore app). Sidebar and back-control patterns are overwhelmingly concept/Dribbble work, so treat those two as directional reference, not shipped-product proof.

### Solen today

- **Bottom tab bar (customer, phone):** white floating pill, about 16px margin from the screen edge, fully round ends. 4 items: Search, Inspo, Saved, Profile. Active = ink icon + bold ink label; inactive = grey icon only, no label. Seen on `pg-home-a.png`, `pg-search-a.png`, `pg-rewards-a.png`. A floating ink "Map" pill sits just above the bar on the search page, same floating-pill idea.
- **Top bar, home/search:** none. The page starts directly with the search field, no logo, no title, no back control.
- **Top bar, secondary pages (profile, rewards):** back circle, white, no border, 44px, chevron-left, next to a bold left-aligned title. Right side: bell (grey icon, blue badge count) + hamburger/menu icon in a white circle, 44px, no border but 16px corner (not round, unlike the back circle). Measured: `icon-button-5-profile` 44h r99 white bg no border; `icon-button-6-profile` 44h r16 white bg no border. Seen on `pg-profile-a.png`, `pg-rewards-a.png`.
- **Top bar, salon detail (photo hero):** back button floats over the photo with a glass/blur treatment: `rgba(255,255,255,.8)` bg, faint white border, drop shadow. Share and heart-save icons float on the same row in the same glass-circle style. Measured: `icon-button-3-salon` 44h r99 bg rgba(255,255,255,.8) bd rgba(255,255,255,.6) sh y.
- **Back button, booking flow (full-screen modal):** outlined circle, white bg, 1px `#E4E4E7` border, 40px, chevron-left, paired with a bare X glyph (no circle, no fill) on the opposite side and a centered bold title. Measured: `icon-button-4-salon` 44h r99 white bg WITH border. Seen on `pg-booking-services-a.png`, `pg-booking-time-a.png`.
- **Sidebar (desktop dashboard):** real captured example, `cal/now-dt-aug16.png`. Collapsed icon-only rail, about 64px wide, white bg, hairline right border, plain line icons stacked vertically, no labels in this state, ends in a back arrow and a round "T" avatar chip.
- **Sidebar (mobile dashboard "top bar"):** not a real sidebar, a hamburger icon (3 lines, no circle) top-left presumably opens a drawer, salon name + chevron selector centered, search + bell icons right. Identical across `pg-dash-home-a.png`, `pg-dash-calendar-a.png`, `pg-dash-settings-a.png`, `pg-dash-services-a.png`.

**Where Solen disagrees with itself:** three different back-button treatments exist today (plain white circle no border on profile/rewards/notifications/appointments; white circle WITH a hairline border on the booking flow; glass/blur floating circle with a shadow on the salon photo hero), and the menu/hamburger icon button uses a 16px corner while the back circle next to it uses a fully round corner on the same header.

### The differences that matter

| X does | Solen does | Why it matters |
|---|---|---|
| Reserves circle/glass chrome around the back control for photo overlays (072); uses a bare chevron with no chrome on flat white pages (173, 087) | Puts a circle around "Back" everywhere, including flat white pages (profile, rewards), and uses three different circle styles across routes | The eye reads Solen's back button as heavier than it needs to be on plain pages, and the inconsistency (bordered vs borderless vs glass) reads as three different products stitched together |
| Bottom tab bar labels are either always-on for every tab (Revolut, real product) or always-off for every tab (floating pill concepts) | Shows the label only on the active tab, icon-only on the rest | This is a legitimate, deliberate choice already in Solen's shipped floating-pill pattern; flagging it only because X shows both options exist, not because either is wrong |
| Common mobile-home header pattern is a personal greeting ("Hi, Melanie") over an avatar, no bar container | Solen's home has no header at all, straight into search | A difference the eye notices (colder, more transactional first impression), but it is a psychology/personalization question, not a structural nav gap; flag for `fable-psychology`, do not fold into this component's proposal |
| Segmented pill switcher is commonly the entire top-level nav on a page (Apple Fitness+, 023) | Solen's home category row (All/Hair Salon/Barbershop) already does this | Confirms Solen's existing pattern matches a real shipped precedent; no change needed |
| Sidebar active state is a light grey or white pill behind the row, never a hard-saturated colour block, in the light-sidebar posts (237, 248, 98, 181) | Solen's collapsed rail doesn't show label rows at all yet (only icon-only captured) | Can't fully compare; Solen's expanded/peek sidebar state (per existing product decision) should use a grey pill for the active row, not blue or a hard colour, to stay inside the calm-colour lock |

### Proposed Solen version

**Bottom tab bar (customer):** keep as is: floating ink-on-white pill, about 16px margin, fully round, active = ink icon + bold ink label, inactive = grey icon only. This already matches the strongest, most-repeated X pattern (floating pill, 6 posts). No change proposed.

**Back control, states:**
- Default (flat white page): white circle, 44px, 1px `#E4E4E7` border (Solen's own existing hairline-border value, already used in the booking flow). Own judgment: standardize on this one variant and drop the borderless version currently on profile/rewards/notifications, to remove the three-way inconsistency. Corner should be fully round (r99) to match the back circle everywhere, including the adjacent menu button (currently r16, should also become r99 or drop its box entirely).
- Photo-hero page (salon detail): keep the existing glass/blur circle (`rgba(255,255,255,.8)` bg, white border, shadow). Grounded both in Solen's own existing value and in X's ghost-circle-on-photo pattern (072).
- Pressed: darken the fill slightly (existing Solen press convention), no new value needed.
- Disabled: not applicable, back is always available when shown.

**Top bar, secondary pages:** keep title left-aligned bold next to the back circle, bell + menu icon right. Own judgment: make the menu icon button match the back circle's corner treatment (fully round) for a single consistent "circle button" vocabulary across the header, instead of mixing r99 and r16.

**Sidebar:** keep the existing 64px icon-only collapsed rail (already matches X's minimal icon-rail pattern, 232, 270). For the expanded/peek state, use Solen's grey `#F4F4F5` fill as the active-row pill behind icon+label (grounded in the locked grey secondary-fill value and in the light-sidebar X pattern, 8+ posts), never a hard colour block. Do not adopt X's dark/charcoal sidebar with a blue active block (594); that breaks the calm-colour and blue-for-links-only locks.

**Top bar, home/search:** keep as is (no header, straight into search). A personalized greeting header is an interesting idea from X (259, 217, 381/666/679) but it's a content/psychology decision, not proposed here; park it for `fable-psychology` to evaluate separately.

### Best exemplars to show the owner

- 072, `media/072-img0.jpg`: ghost-circle back button on a photo hero, the exact idea Solen's salon page already half-does; useful for confirming the glass-circle treatment.
- 278, `media/278-img1.jpg`: floating pill bottom tab bar, active = filled dark pill with icon+label, closest match to Solen's own tab bar.
- 237, `media/237-img0.jpg`: light sidebar with grey-pill active row and grouped section captions, the cleanest reference for Solen's expanded sidebar state.
- 023, `media/023-vid0.jpg`: Apple Fitness+ segmented pill switcher, real shipped product, confirms Solen's home category row is on the right track.
- 173, `media/173-vid0.jpg`: bare chevron with no button chrome on a flat page, the reference for simplifying Solen's flat-page back button.
- 089, `media/089-vid0.jpg`: Revolut bottom bar, real shipped product, shows the always-on-label alternative for comparison.

### Do not adopt

- Dark/charcoal sidebar fills and any dark-mode chrome (594 and others): Solen is light-mode only.
- Loud gradient or saturated-colour active states in dashboards (several concept posts use bright brand colours as fills): conflicts with the calm-colour lock.
- Fake data/metrics shown purely to sell the concept shot (most dashboard posts): not evidence of a real pattern, only of a mockup convention.

### Conflicts with locked values

- X's dark/charcoal sidebar with a solid blue active block (594) conflicts with both the calm-colour lock and the "blue only for link text" lock. Reported, not adopted.
- X's dark-mode toggle variants (149) conflict with the light-mode-only lock. Reported, not adopted.

---

## Input / form

- **Reviewed:** 61 posts. High (31, all): 17, 28, 61, 62, 68, 81, 163, 185, 233, 243, 279, 334, 370, 374, 399, 404, 468, 475, 482, 498, 514, 522, 525, 561, 589, 628, 636, 642, 648, 666, 668. Medium (30 of 45): 4, 69, 88, 100, 101, 105, 111, 149, 164, 192, 239, 253, 258, 298, 308, 328, 332, 333, 343, 351, 420, 448, 467, 537, 570, 630, 640, 661, 680, 691.

Only 4 of the 61 reviewed posts are shipped real products (Apple Podcasts 81, Apple Maps 668, plus two low-tier AI-chat-input close-ups not reviewed here). Everything else is concept/Dribbble work or a Figma mockup photographed off a screen; treat counts below as concept-design consensus, not shipped-product proof, except where a post is marked real.

### Recurring patterns

**Search field / bar** (the single strongest, most consistent pattern in the whole set)

1. Full-width pill, light fill, icon-left magnifier. Fully round (radius = half height), about 44-48px tall, light grey or cream fill, no border, magnifier icon about 16-18px inset 14-16px from the left, grey placeholder. Shown in 9 of the ~15 search-bar posts reviewed: 062 ("Search for a services"), 404 and 666 ("Search home location...", real-estate, filter icon right), 468 ("Search cities or experiences"), 642 (plain "Search"), 333 (command palette). Concept, except:
2. Real-product reference: Apple. 081 (Podcasts, dark pill, centered placeholder, real shipped product) and 668 (Apple Maps: pill with a mic icon plus a circular X clear button on the right, and a row of small icon+label category pills directly under it, e.g. "Breakfast," "Cafes," "Groceries," real shipped product). This is the one measured real-product exemplar for search plus quick-filter chips together.
3. Dark or gradient "AI prompt" variant, same pill shape, sparkle icon right instead of a filter icon, larger question-style placeholder. 068 (DreamSpace, dark navy pill), 239 ("Ask me anything...").
4. Search paired with a separate square filter/sliders icon button beside the pill, rather than an icon inside it. 062, 404, 666.

**Text field**

1. Label-above, filled-light field, no border. Small grey label (about 11-13px) directly above a rounded-rect field, about 44-52px tall, very light grey fill, no visible border, about 16px horizontal padding, dark value text. Shown in 8+ posts: 192, 467, 328, 420, 589, 561 (card form, bold value text), 069.
2. Thin-border variant, same label-above layout but a 1px light grey border instead of a filled bg, corners about 8-10px. 253, 467, 298.
3. Focus state: only one post shows it explicitly, 185, a full blue/indigo ring around the whole pill plus a visible cursor. Under-evidenced; most posts show fields empty/placeholder-only.
4. "(Optional)" appended in parenthetical grey text right after the label. 399.

**Select / dropdown**

1. Field-styled dropdown, looks identical to a text field (label above, same fill/border style) but with a trailing chevron-down and the current value shown as plain text, not a placeholder look. 069 ("Expiration"), 253/233 ("Category"), 185 ("Date," with a calendar icon left and chevron right).
2. Compact paired dropdown beside an input, just value+chevron, no visible border, same height as its neighbour field, grouped by spacing. 537 ("Editor" next to an invite email field).
3. Expanded list-as-overlay: options render in-flow with a checkmark on the active row and a light highlight band, not a popover. 467 ("Basic/Intermediate/Professionals").
Count: 5 posts, all concept.

**Toggle / switch**

1. iOS-standard pill track, about 50x30px, white circular thumb, green fill when on, grey/light-grey track when off. By far the dominant look: 061 ("Daily reminder," bright green on), 163 ("Is repeating," green on), 253 ("RSVP Required," grey off), 561 ("Default payment method," grey off).
2. Dark-mode lime variant of the same shape. 149.
3. A component-demo shows the thumb mid-drag with squash-and-stretch motion, captioned "Plain / Stretch." 100.
4. Slide-to-confirm as a toggle-adjacent pattern for an important/destructive choice, not a settings switch. 163 ("→ Accept").
Count: 6 posts, all concept. Green, never blue, is the "on" colour across every example.

**Checkbox**

Rare in this corpus; most selection UI uses toggles or radio circles instead. Only one clean example: 334 (Event Calendar modal, "Open to all departments," small ~16px square, blue fill with a white checkmark when checked, sitting left of its label). A checklist-style green circular checkmark badge appears once (279, "Service Includes") but reads as a checklist, not a form checkbox. Do not generalize a "checkbox anatomy" beyond post 334; the sample is one post.

**Stepper (quantity +/-)**

1. Pill stepper, minus and plus as flat icon buttons at each end of a rounded-full pill, bold number centered, about 130-150px wide, about 44px tall. 374 (explicit demo: "Click adds one" vs "Hold to accelerate"), 475 (product quantity stepper, smaller, about 90px, beside "Add to Cart").
2. A hybrid drag/stepper control for a party-size input, ambiguous between a tap stepper and a slider. 370 ("5 PEOPLE").
3. A ruler/tick amount slider with quick-amount pill shortcuts, for money entry rather than a discrete count. 399 (Send Money).
Count: 3 clear stepper posts, all concept.

**Form layout / labels / OTP**

1. Standard stacked form: small grey label above each field, about 6-8px gap, about 16-20px gap between field groups, a full-width dark pill CTA at the bottom, a secondary blue text link below it. Recurs across 192, 233 (Livio, four flows use it), 328, 420, 589, 332, 101.
2. Step/progress indicator: a dot row or "Step X of Y" text in the header next to the Continue CTA. 192, 111, 680, 467.
3. Two-column paired fields for related short values, rather than always stacking. 467, 334.
4. All-caps section subheads dividing a long form into named groups. 253, 420, 233.
5. OTP, two competing treatments, both concept: discrete boxed digits (about 40-48px boxes, light grey fill, highlighted most-recent digit), 243 and 514 (3 posts total, the more common of the two); a single continuous digit row on a gradient background that morphs into a pill success button, 525 (1 post, with visible morph motion). "Sent to [phone] / Wrong number? Edit" caption above the code and "Resend code" below repeat identically in 243 and 525.

### Solen today

- **Search field, customer (home/search):** full pill, white fill, 1px `#E4E4E7` border, about 44-50px tall, magnifier icon left, grey placeholder "Search." Seen on `pg-home-a.png`, `pg-search-a.png`.
- **Search field, dashboard (dash-services):** "Search service..." grey-filled pill, about 44px tall, magnifier icon left. Seen on `pg-dash-services-a.png`. A different fill treatment (grey vs white) than the customer search field, for the same control.
- **Text field, marketing email capture (footer, multiple pages):** white pill, about 50px tall, 1px `#E4E4E7` border, placeholder only (no label above it), trailing circular ink submit button with an arrow icon inset in the field. Measured: 50h r12 bg white bd 1 `#E4E4E7`. Seen on `pg-search-a.png`, `pg-rewards-a.png` footers.
- **Select/dropdown, staff filter (dash-calendar):** white pill, about 44px tall, "All" label left + chevron-down right, 1px border. Also on the real desktop calendar, `cal/now-dt-aug16.png`.
- **Select/dropdown, "Show templates" (dash-services):** rounded-rect, corners about 16-20px (not a pill), label left + chevron-down right, 1px border. A different corner radius than the staff-filter dropdown for the same control type.
- **Segmented tabs / chips, measured directly in `sys/b3-chips.jpg`:** "9 versions... four selected looks: black, grey, blue tint, grey with border" across salon, inspo, booking, dash-services, dash-clients. Heights range 37-44px, corners either 16px or fully round, inconsistently. Concretely: booking flow category tabs (Farbe/Hochsteck/...) are 44px, round, selected = ink fill + white text (matches the lock); salon page service tabs (All/Hochsteck/...) are 44px, 16px corner, selected = grey `#F4F4F5` fill + ink text (does not match the lock); dash-services/dash-clients filter chips (All/Coiffeur/Inactive) are 37px, round, selected = light blue tint fill + blue text (breaks the lock outright, using blue as a fill colour); inspo chips are 40px, 16px corner, no selected state captured.
- **Date/time picker (booking-time):** date chips and time-slot chips both use a solid BLUE fill + white text for the selected state (not ink). Seen on `pg-booking-time-a.png`.
- **Toggle/switch (dash-services, service active/inactive):** standard track, about 44px wide, solid BLUE fill when on, white knob offset right. Seen on `pg-dash-services-a.png`.
- **Checkbox:** not present in any of the provided Solen screenshots.
- **Stepper (quantity +/-):** not present. The closest control is the "+" add-service button on booking-services (a circular add-to-cart action, not a quantity increment).
- **Form layout (dashboard settings list):** grouped white rows inside a rounded card per section, small grey uppercase section label above each group, row = icon + bold label + chevron-right, hairline divider between rows. No visible text-input fields on this particular screen.
- **Booking flow footer:** sticky bar with running total ("CHF 0," item count, duration) left and an ink pill "Continue" right (booking-services), or a single full-width ink pill "Continue" (booking-time).

**Where Solen disagrees with itself:** the single biggest issue is colour. Solen's own locked rule is "selected pill = ink fill + white text" and "blue #276EF1 only for link text," but the shipped product currently uses blue as a *fill* colour for the selected/on state in three separate places: the dash-services/dash-clients filter chip, the booking date/time picker chips, and the dash-services toggle switch. On top of that, the salon-page service tabs use a fourth selected treatment (grey fill, ink text) that matches neither ink-fill nor the lock's intent. Corner radius is also split between 16px and fully round across otherwise-identical chip/select controls, and the search field switches between white fill (customer) and grey fill (dashboard) for the same control.

### The differences that matter

| X does | Solen does | Why it matters |
|---|---|---|
| iOS-standard toggles are consistently green for "on," never blue, across every toggle post reviewed (6 posts) | Uses solid blue for "on" | Solen's blue is reserved for links by its own lock; a blue toggle reads as a hyperlink or as arbitrary brand colour, not as a clear on/off state, and it does not even match X's own convention |
| Selected/active chip state is consistently a solid dark fill with white text in the highest-count concept and real examples (023 Apple Fitness+, most tab-switcher posts) | Has four different selected looks across shipped routes: ink fill, grey fill, and blue-tint fill, at two different corner radii | This is the single most visible inconsistency an owner would notice scrolling between screens; X's own concept work is more disciplined about one selected look than Solen's shipped code currently is |
| Search bars are dominated by a light-grey filled pill with no border (9 of the posts reviewed) | Uses a white bordered pill on customer pages and a grey filled pill on dashboard pages for the same control | Two different fill/border treatments for the identical control type across the two halves of the product |
| Dropdowns are styled to look like their neighbouring text fields (same fill, same border, just add a chevron) | Uses a fully round pill for one dropdown (staff filter) and a 16-20px-corner rounded rect for another (Show templates) | The corner-radius mismatch is a small thing the eye still catches when the two controls sit on nearby screens |
| Checkboxes are rare and, in the one clear example, blue-filled | Has no checkbox anywhere in the captured surfaces | Not urgent, but if Solen adds one, X's own dominant colour logic elsewhere argues against copying blue here too |

### Proposed Solen version

**Search field (customer and dashboard, one control):** grey `#F4F4F5` filled pill, no border, fully round, about 48px tall (Solen's own measured value), magnifier icon left about 16px inset. Value taken from the X pattern (light-grey filled pill, 9 posts) and grounded in Solen's own locked grey secondary-fill colour, so it needs no new colour. Retire the white-bordered customer variant and the separate grey dashboard variant in favour of this one.

**Text field:** keep white fill + 1px `#E4E4E7` border (Solen's existing hairline system, already locked) rather than switching to X's filled-no-border look, since Solen's border-first convention is already used consistently elsewhere (cards, chips) and changing it here alone would create a new inconsistency. Own judgment. Add a small grey label above the field (about 12-13px, sentence case) wherever a field needs one, taken from X's dominant label-above pattern (8+ posts); Solen's current marketing email field, which has no label, is a low-stakes exception that can stay placeholder-only.

**Select / dropdown:** one shape only, fully round pill, label left + chevron-down right, 1px `#E4E4E7` border, about 44px tall. Taken directly from Solen's own existing staff-filter dropdown value; retire the 16-20px-corner "Show templates" variant.

**Toggle / switch, states:**
- On: ink `#0A0A0A` fill, white circular knob. Own judgment, grounded by analogy to the locked "selected pill = ink fill + white text" rule; deliberately not X's green (green is not in Solen's calm palette) and not Solen's current blue (breaks the lock).
- Off: grey `#F4F4F5` track, white knob, thin hairline edge on the knob for definition against the light track.
- Disabled: same shapes at reduced opacity (about 40%), no colour change.
Track size about 50x30px, taken from the X measurement (061, 163).

**Checkbox:** small square, about 18-20px, 1px `#E4E4E7` border when unchecked, ink `#0A0A0A` fill + white check when checked, corner about 4-6px. Own judgment; the one X example (334) is thin evidence and used blue, which is deliberately not carried over.

**Stepper:** rounded-full white pill, minus/number/plus, about 44px tall, about 130-150px wide, 1px `#E4E4E7` border matching Solen's other pill controls. Taken from the X pattern (374, 475); Solen has no existing stepper to anchor to, so the sizing is own judgment grounded in the touch-target lock (44px minimum).

**Segmented tabs / chips (the fix that matters most):** one anatomy everywhere. Unselected: white fill, 1px `#E4E4E7` border, ink text. Selected: ink `#0A0A0A` fill, white text. Always fully round (r99), about 40-44px tall. This is not a new value, it is Solen's own already-locked rule, applied consistently for the first time across salon tabs, dash filter chips, and the booking date/time picker (which currently use grey-fill or blue-fill for selected instead).

**Form layout:** keep the stacked label-above-field layout and the sticky full-width ink pill CTA at the bottom; both already match Solen's booking flow and the dominant X pattern. No change proposed. OTP/code sign-in is out of scope: the September 6 decision keeps code sign-in as it is.

### Best exemplars to show the owner

- 668, `media/668-img0.jpg`: Apple Maps search pill with quick-filter category pills underneath, real shipped product, the clearest reference for a unified grey search field plus chip row.
- 061, `media/061-img0.jpg`: iOS-standard toggle, green on / grey off, the shape reference (colour intentionally not carried over).
- 023, `media/023-vid0.jpg`: Apple Fitness+ segmented pill switcher, real shipped product, the reference for one consistent ink-fill selected state.
- 374, `media/374-vid0.jpg`: pill quantity stepper with tap vs hold-to-accelerate states.
- 192, `media/192-img0.jpg`: label-above stacked form with a step-dot header and a full-width CTA, the clearest form-layout reference.
- 334, `media/334-img0.jpg`: the one checkbox example, shape reference only (colour not carried over).

### Do not adopt

- Dark-mode lime toggle (149): Solen is light-mode only.
- Gradient/AI-prompt search bar styling (068, 239): conflicts with the calm-colour lock and isn't relevant to a booking search.
- Blue checkbox fill (334): conflicts with the blue-for-links-only lock.
- Command-palette (Cmd+K) style search-as-form entry (308, 333, 351): a desktop power-user pattern, not relevant to Solen's mobile-first booking flows.
- Pure concept dashboards with fabricated metrics used only to sell the shot: not evidence of a real form pattern.

### Conflicts with locked values

- X's dominant toggle colour (green) is not itself adoptable, since Solen's locked palette has no green; flagged so the proposed ink toggle isn't mistaken for a literal copy of X.
- The one X checkbox example uses blue fill, which conflicts with "blue only for link text"; not adopted.
- Dark-mode variants throughout the corpus conflict with the light-mode-only lock; not adopted.

---

## Sheet / modal

- **Reviewed:** 16 posts (all design-tagged posts for this component; fewer than the usual 25-post minimum, so all were read, including low relevance). High (6): 126, 174, 205, 267, 279, 516. Medium (8): 166, 235, 253, 263, 517, 537, 640, 661. Low (2): 230, 592.

### Recurring patterns

**Bottom sheet**

1. Top-corners-only radius, height driven by content, and either a drag handle OR an X close button, rarely both. Shown in 6 of 16 posts:
 - 279 ("Deep Clean Service"): top corners only, radius about 20-24px, small grey pill handle about 36x4px centered about 8px below the top edge, X close in a light-grey circle top-right (about 28px), sheet covers about 65-70% of the screen, ink full-width pill CTA ("Book Service") pinned at the bottom. Concept, but directly relevant to Solen's own domain (a service detail sheet).
 - 253 ("Send Party Invite"): same handle+X combo, radius about 20-24px, sheet nearly full-screen (about 85-90%), a pill segmented toggle under the header, two stacked buttons at the bottom (dark "Send Invites," outline "Cancel"). Concept.
 - 640 (iOS "New Reminder"), the one real shipped product in this set: top corners only, radius about 16-20px, NO drag handle at all, relies on text links ("Cancel" top-left, bold "Create" top-right), tight height just enough for the fields, sits directly above the keyboard.
 - 661 (two sheets in one post): "Confirm Transaction," radius about 24-28px, X top-right circle, no handle, dashed "ticket stub" divider, ink pill "Confirm" at the bottom; and a travel paywall, radius about 28-32px (the largest seen), X top-left, tall (about 85%), pricing cards, gradient CTA. Both concept.
 - 263 ("Skip This Day?"): radius about 24-28px, X top-LEFT (the one outlier on close position), no handle, short sheet (about 30-35%), a red "Slide to Skip" drag-to-confirm slider instead of a normal button.

Handle bar appears in 2 of 6 (279, 253). X-close with no handle appears in 4 of 6 (640, both 661 sheets, 263). No post shows both a handle and an X together.

**Center dialog / modal**

Floats with visible margin on all sides, all four corners rounded, X top-right, no handle. Shown in 4 posts:
- 267 ("Manage subscription"): radius about 20-24px, X top-right in a light circle, floats over a blurred/grey backdrop, a second screen adds a pill segmented Annual/Monthly tab.
- 516 ("Your invite is created"): radius about 24-28px, X top-right circle, image/gradient header block, ink full-width capsule CTA inside the card.
- 537 ("Invite members," desktop web): radius about 12-16px, X top-right, no handle (expected on desktop), pill tabs, a member list with role dropdowns, a footer seat-usage bar.
- 517 (desktop knowledge-base card): radius about 12-16px, no visible close control, anchored mid-screen rather than truly centered.

**Close control**

- X-in-circle, top-right: the dominant pattern, 5 of 16 posts (267, 516, 537, 661, 166).
- X-in-circle, top-left: only 2 posts (263, the 661 paywall sheet), both taller/scrollable sheets, suggesting left placement correlates loosely with longer content rather than being a stable rule.
- Text-link close ("Cancel") instead of an icon: 253 (paired with the primary action at the bottom), 640 (top-left "Cancel" text paired with "Create").
- Slide-to-confirm as the dismiss/commit mechanism for a destructive choice: 263's red "Slide to Skip."
- Native iOS system sheet, no close icon at all: 235, three full-width stacked text buttons separated by hairlines double as the choice/dismiss mechanism.

**Drag handle**

Only 2 of 16 posts (279, 253) show an actual grey pill handle, about 36x4px, centered, about 6-10px below the top edge. The one real shipped example (640) has none, and neither do the desktop dialogs (517, 537). In this sample the handle is a mobile-only, inconsistent convention, not a rule.

**Background dim / scale treatment**

205 is an explicit designer side-by-side, "Scale + Dim" (the background phone content shrinks slightly inward with a dark overlay) versus "Dim Only" (background stays full scale, same dark overlay), presented as two techniques rather than a right/wrong pair. Most other posts use a blurred-plus-dimmed background rather than a flat scrim (661, 640, 537, 592); a few use plain dim/grey with no blur (267, 516, 235, the last being the native iOS system scrim). Only 205 treats scale as a variable at all; every other example holds the background at 100% scale.

### Solen today

No true partial-height bottom sheet is present in any of the provided Solen screenshots for these routes. The closest analogue is the booking flow (`pg-booking-services-a.png`, `pg-booking-time-a.png`): a full-screen (100% height) route with a modal-style header (bordered back circle left, bold centered title, bare X glyph right, no circle around the X) and a sticky footer action bar. It behaves like a modal in that it has a close X, but it is laid out as a full page, not a sheet with a handle or partial height. No drag handle and no center dialog/confirmation popup appear anywhere in the provided captures.

**Where Solen disagrees with itself:** nothing to compare internally, since there is only one modal-like pattern captured (the full-screen booking flow). The gap is an absence, not an inconsistency: Solen has no lighter-weight sheet or dialog component for anything short of a full route change.

### The differences that matter

| X does | Solen does | Why it matters |
|---|---|---|
| Uses a genuine bottom sheet (partial height, top-corners-only) for exactly this kind of screen, a service-detail-and-book flow (279, "Deep Clean Service") | Sends the whole booking flow to a full-screen route | Solen has no lightweight way to preview or confirm something without a full navigation change; a quick "view this service" or "confirm this change" always costs a full page |
| Circles the close (X) button in a light grey fill in the majority of sheet/dialog posts (5 of 16) | Uses a bare X glyph with no circle or fill on the booking flow's close control | A circled X reads as a clearly tappable 44px target; a bare glyph is easy to miss and harder to hit precisely |
| Drag handles are optional and inconsistent even in this corpus (2 of 16, and the one shipped example has none) | N/A, no sheet exists yet | Confirms Solen doesn't need to treat a handle as mandatory when building a sheet component |
| Backgrounds behind a sheet or dialog are usually blurred plus dimmed | N/A, the booking flow is a full page with no backdrop to dim | If Solen adds a real sheet, it will need to decide a dim/scrim treatment it currently has no precedent for |

### Proposed Solen version

**Bottom sheet (new component), states:**
- Default: white bg, top corners only, 20px radius (Solen's own locked box-corner value, reused directly, not a new number), soft shadow per Solen's existing box-shadow lock (no deep shadow), content-driven height capped around 85% of the viewport. Close = X inside a light grey `#F4F4F5` circle, about 28-32px, top-right (taken from the dominant X pattern, 5 of 16 posts, and a clearer 44px-adjacent tap target than Solen's current bare X). Drag handle: optional, own judgment to omit it by default since the evidence for it is thin and mixed (2 of 16, the one real example has none) and Solen has no existing handle convention to anchor to; can be added later if user testing shows people expect to swipe it away.
- Background: flat dark dim (no blur), since blur/glass is not currently in Solen's locked surface vocabulary and introducing it here alone would add a new material without a locked precedent. Own judgment, informed by the X posts that also use plain dim with no blur (267, 516, 235).
- Footer: sticky full-width ink pill CTA, reusing Solen's existing booking-flow footer pattern exactly.
- Selected/pressed states inside the sheet: reuse the segmented-tab and button anatomy proposed in the Input/form section above (ink fill for selected, not grey or blue).

**Full-screen route (existing, keep):** continue using it for heavier multi-step flows like booking-services and booking-time; this is a legitimate, distinct format from a sheet and should not be collapsed into one. Own judgment addition: replace the current bare X glyph in these headers with the same circled-X treatment proposed for the new bottom sheet, so close controls look and behave the same everywhere in the product.

**Center dialog (new component), for short single-decision confirmations (for example, "Cancel this booking?"):** reuse Solen's existing card anatomy exactly, 20px corners, soft shadow, no outline (the locked box style), floating with margin on all sides, X-in-circle top-right close (same as the sheet), ink pill CTA. This needs no new values; it is Solen's own card style applied to a new context, grounded in the X dialog pattern (267, 516, 537, 517), which itself is mostly just a floating card with a close button.

### Best exemplars to show the owner

- 279, `media/279-img0.jpg`: bottom sheet for a service-detail-and-book flow, the closest real-world match to what Solen would use a sheet for.
- 640, `media/640-vid0.jpg`: the one real shipped bottom sheet in the set (iOS Reminders), evidence that a handle is not required.
- 267, `media/267-img0.jpg`: center dialog with X-in-circle close, the cleanest reference for the proposed confirmation dialog.
- 661, `media/661-img0.jpg`: bottom sheet with X-in-circle close and a sticky ink pill CTA, close to the proposed footer treatment.
- 205, `media/205-vid0.jpg`: the explicit scale-vs-dim comparison, useful to show the owner the option Solen is choosing not to take (scale) and why (no blur/scale precedent yet).

### Do not adopt

- Gradient CTA button inside the travel paywall sheet (661): conflicts with Solen's ink-CTA-discipline and no-loud-colour locks.
- Native iOS system-sheet three-stacked-buttons pattern (235): OS-chrome, not a custom component Solen should imitate.
- Fake success states and invented data (516's "Your invite is created," 279's fabricated service pricing): concept dressing, not a real pattern to copy literally.
- The two low-relevance outliers (230, a button on empty canvas with no sheet geometry at all; 592, a portfolio lightbox with an oddly placed bottom-center X): neither shows a usable sheet/modal pattern; excluded from the anatomy above.

### Conflicts with locked values

- The travel paywall sheet's orange gradient CTA (661) conflicts with the no-loud-colour and ink-CTA locks; reported, not adopted.
- No other X pattern in this set conflicts with a locked value; the corpus is otherwise light-background, flat-colour, and consistent with Solen's existing surface language.
