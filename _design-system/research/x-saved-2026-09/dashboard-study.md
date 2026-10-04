# Dashboard study: owner's saved references vs today's Solen dashboard

Date: 2026-10-04. Scope: every dashboard page except the calendar (home overview, services, clients, settings).

Exists-check: target surfaces are the existing dashboard pages shown in `site-preview/shots/dash-home.jpg`, `dash-services.jpg`, `dash-clients.jpg`, `dash-settings.jpg`. This file is research only; nothing here is approved design. Every visible change still needs a mockup and owner approval.

## How this was done

- Source set: all 95 items in `tags.json` with `design: true` and `surface == "dashboard"`, joined to `ledger.json` media. 192 images (duplicates ending in " 2.jpg" skipped). All 192 opened and looked at (as 2x2 contact sheets at native size). None failed to open.
- Also skimmed 6 non-dashboard items that show desktop admin UI: `media/058-img0.jpg`, `media/025-img0.jpg`, `media/256-vid0.jpg`, `media/611-img0.jpg`, `media/658-img0.jpg`, `media/697-img0.jpg`.
- Also looked at: `public/_research/calendar/ref.jpg` (HelloDottaa), `public/_research/calendar/index.html` (approved calendar direction; its CSS tokens are quoted below), and the five `site-preview/shots/dash-*.jpg` screenshots.
- Counts in section A are my own hand tally of what each image shows (coded per item, 95 items, one count per item, not per image). They are judgments, not machine counts.
- Every source image is only 640 px wide, and most show a whole 1280 to 1440 px app shrunk to about 500 to 560 px (about 2.6x smaller). All pixel values for references are **estimated** by scaling against known elements (sidebar width, 13 to 14 px body text, avatar sizes). Treat them as plus or minus 2 px for text and plus or minus 4 px for spacing.
- Not usable as dashboard evidence: `media/198-img0.jpg` (illustration of eggs), `media/478-img2..img7.jpg` (AI composer and icon fragments), `media/109-img2.jpg`, `media/109-img3.jpg` (mobile app), `media/078-vid0.jpg`, `media/232-vid0.jpg`, `media/336-vid0.jpg` (calendar, out of scope). Several frames are too small to read text: `media/308-img1..img7.jpg`, `media/356-img2.jpg`, `media/418-img2.jpg`, `media/558-img0.jpg`, `media/634-img*.jpg`.

## A. Recurring patterns, ranked by frequency

Tally (items out of 95): KPI or stat row 37; tinted status pill 25; data table 22; delta vs previous period on a KPI 20; chart with 3 or more hues 17; filter chip or tab row above a list 14; chart in one hue (plus grey) 13; key/value detail list 11; blue or purple primary button 11; greeting or date header 10; ink (black) primary button 9; dark theme 8; setup checklist 4; live activity feed 4; photo or painting backdrop behind the app 4; ranked list with bars 3.

### A1. Page anatomy (seen in about 40 full-page frames)
The dominant layout, top to bottom:
1. Page header: title left (estimated 18 to 24 px, semibold) with a one-line grey subline (13 to 14 px), actions right (date range chip, secondary button, one dark or blue primary). Examples: `media/198-vid0.jpg`, `media/634-img1.jpg`, `media/660-img0.jpg`, `media/563-img0.jpg`, `media/458-img0.jpg`.
2. On home pages, a greeting plus date or "items need your attention" line (10 items): `media/356-img0.jpg` ("Good morning, May", "5 items need your attention"), `media/597-img0.jpg` (date plus "5 task completed", "8 collaborators" chips), `media/187-vid0.jpg`, `media/576-img0.jpg`, `media/685-img2.jpg`.
3. KPI row of 3 to 5 equal cells directly under the header (37 items).
4. Main grid: a wide left column (chart or table, about 2/3) and a narrow right column (list, schedule, or detail, about 1/3). Examples: `media/356-img1.jpg`, `media/458-img0.jpg`, `media/533-img0.jpg`, `media/576-img0.jpg`, `media/477-img1.jpg`.
5. A table or list at the bottom ("Recent orders", "Recent transactions").
6. On list pages, a right-hand detail panel for the selected row: `media/508-img0.jpg` (order list plus order detail), `media/477-img0.jpg` (contact plus company panels), `media/520-img0.jpg`.

### A2. KPI and stat cards (37 items)
- Number is the loudest thing on the card. Estimated number size 20 to 28 px semibold against a 12 to 13 px grey label, ratio about 1.7 to 2.2. Examples: `media/159-img0.jpg`, `media/424-img0.jpg` ("82%" with "+2.1% vs last week"), `media/478-img0.jpg` ("$1,631,241"), `media/563-img0.jpg` ("$93.4K"), `media/307-img0.jpg` ("186 hours", unit in grey at about 60% of number size).
- Label sits above the number (about 30 of 37). Icon, when present, is a small 28 to 36 px tile at top-left.
- Delta (20 items) is a short line under or beside the number: arrow plus percent in green or red plus grey "vs last week". Examples: `media/458-img0.jpg`, `media/252-vid0.jpg`, `media/418-img0.jpg`, `media/608-vid0.jpg`, `media/660-img0.jpg`.
- Two layouts. (a) Separate cards per KPI: `media/159-img0.jpg`, `media/533-img0.jpg`, `media/311-img0.jpg`. (b) The calmer one: all KPIs in **one** card split by thin vertical dividers: `media/252-vid0.jpg`, `media/458-img0.jpg`, `media/496-img0.jpg`, `media/477-img1.jpg`, `media/583-img0.jpg`.
- Sparklines inside the KPI cell: `media/608-vid0.jpg` (2-column phone grid), `media/641-vid0.jpg`, `media/623-img1.jpg`.
- Secondary context line in grey: "11 invoices · 3 in drafts" (`media/563-img0.jpg`), "+342 new today" (`media/356-img0.jpg`), "47 / 64" fractions (`media/356-img1.jpg`, `media/605-img0.jpg`).
- Footer link row "See in details →" or "View details →": `media/159-img0.jpg`, `media/211-img0.jpg`, `media/576-img0.jpg`.

### A3. Tables and lists (22 tables, plus about 15 lists)
- Row height: estimated 44 to 56 px for calm tables (`media/563-img0.jpg`, `media/198-vid0.jpg`, `media/477-img5.jpg`, `media/626-img0.jpg`); 28 to 36 px for dense ones (`media/351-img0.jpg`, `media/308-img0.jpg`, `media/594-img0.jpg`).
- Lines: horizontal hairlines only, no vertical lines, no zebra stripes (about 20 of 22). Header row in 12 to 13 px grey, sentence case or small caps.
- Avatars 24 to 40 px: real photos (`media/282-img1.jpg`, `media/109-img0.jpg`, `media/477-img7.jpg`) or a pale neutral initial circle (`media/307-img2.jpg` "JR"). Logos sit in small rounded tiles (`media/626-img0.jpg`, `media/356-img3.jpg`).
- Two-line name cell: name 13 to 15 px ink plus email or sub-info 12 to 13 px grey (`media/563-img0.jpg`, `media/282-img1.jpg`, `media/626-img0.jpg`).
- Status in a small tinted pill (25 items): pale tint background plus same-hue text, about 20 to 24 px tall. Examples: `media/287-img0.jpg` (Fulfilled green, Paid blue, In Transit yellow), `media/477-img5.jpg` (Scheduled, Upcoming, Confirmed, Cancelled), `media/356-img3.jpg` (Success, Pending, Failed), `media/198-vid0.jpg`.
- Numbers right-aligned with tabular figures (`media/356-img3.jpg`, `media/477-img7.jpg`, `media/543-img1.jpg`).
- Grouping by a header row with a count or subtotal: by date (`media/543-img2.jpg`, `media/356-img3.jpg` "Yesterday", "Last month"), by status (`media/505-img0.jpg` "To Do 3", "In Progress 3").
- Selection and hover: full-width pale fill on the row (`media/003-vid0.jpg`, `media/508-img0.jpg` pale blue selected row, `media/282-img1.jpg` checkbox).
- Above the table: a filter chip row and a search field (14 items): `media/563-img0.jpg` ("Filters 2", "Amount ≥ $9,000 ×", "Status Open"), `media/533-img0.jpg` (Upcoming, All, Canceled), `media/508-img0.jpg`, `media/634-img1.jpg`.
- Count beside the title: "All users 145" (`media/282-img1.jpg`), "Active Blockers 5" (`media/307-img3.jpg`).
- Pagination footer "Showing 1-10 of 51" (`media/533-img0.jpg`, `media/594-img0.jpg`, `media/198-vid0.jpg`).

### A4. Forms and settings (9 items tagged, about 6 real settings screens)
- Two-pane layout: a settings sub-navigation on the left (grouped, small group labels, about 36 to 44 px rows, selected item as a filled pill) and a content pane on the right. Examples: `media/098-img0.jpg`, `media/098-img1.jpg`, `media/058-img0.jpg`, `media/568-img0.jpg`, `media/634-img6.jpg`.
- Each row: title 14 to 15 px ink, one-line description 13 px grey under it, control on the right (outline "Enable" or "Update" button, toggle, or value). Hairline between rows. Example: `media/098-img2.jpg`, `media/058-img0.jpg`.
- Destructive action last, red text only (`media/098-img0.jpg` "Delete account", `media/634-img7.jpg` "Danger Zone").
- Key/value cards for read-only facts: label left grey, value right ink (`media/588-img0.jpg`, `media/626-img3.jpg`, `media/132-img0.jpg`, `media/474-img0.jpg`).
- Form fields: label above field, field filled pale grey, buttons "Cancel" (plain) and "Save changes" (dark) bottom-right (`media/634-img6.jpg`, `media/025-img0.jpg`).
- Toggles: dark ink when on in the calmer sets (`media/025-img0.jpg`, `media/098-img2.jpg`); green or blue in others (`media/163-vid0.jpg`, `media/571-vid0.jpg`).

### A5. Charts (33 items tagged)
- Bar charts dominate (about 20), then line or area (about 12), then donut (about 5).
- 17 items use 3 or more hues; these are the weakest-looking ones (`media/181-img0.jpg`, `media/473-img0.jpg`, `media/542-img0.jpg`, `media/583-img0.jpg`, `media/303-img0.jpg`).
- 13 items use one hue plus grey and look the most premium:
  - all bars pale grey with only the current period highlighted: `media/478-img0.jpg` (one orange bar among outlined grey bars), `media/697-img0.jpg`;
  - one hue at two strengths (this period vs last): `media/418-img1.jpg`, `media/270-img0.jpg`;
  - one-hue dot-matrix heatmap: `media/252-vid0.jpg`, `media/588-img0.jpg`;
  - grey or ink monochrome bars: `media/558-img0.jpg`, `media/535-img1.jpg` (thin ink bars in a ranked list).
- Gridlines: absent or very faint dashed (about 25 of 33). Axis labels 11 to 12 px grey. Tooltip is a small white or dark card with the exact value.

### A6. Colour use
- Calm references use one accent at most, and colour appears only in status pills, deltas (green or red), and a single chart highlight. Page, cards and text are black, white and greys. Examples: `media/563-img0.jpg` (only colour: the red overdue amount and a green chip), `media/098-img0.jpg` (only colour: red destructive text), `media/588-img0.jpg`, `media/626-img0.jpg`, `media/477-img5.jpg`.
- Primary buttons: blue or purple in 11 items, ink black in 9 (`media/198-vid0.jpg`, `media/341-img0.jpg`, `media/463-img2.jpg`, `media/535-img2.jpg`, `media/588-img0.jpg`, `media/597-img0.jpg`, `media/634-img1.jpg`, `media/660-img0.jpg`). The ink-button sets are the more premium-looking ones.
- Selected sidebar item in ink black: `media/477-img0.jpg` (CloseCRM). This matches Solen's ink selected state.

### A7. Type scale (estimated)
Calm references use 4 to 5 sizes: page title 20 to 24, card title 15 to 18, body and row text 13 to 15, label and meta 12 to 13, axis 11. KPI numbers 20 to 28. Weights: 600 for titles and numbers, 500 for row names, 400 for the rest. Examples: `media/098-img1.jpg`, `media/563-img0.jpg`, `media/424-img0.jpg`, `media/588-img0.jpg`. Weak references mix 7 or more sizes, plus serif or italic display type (`media/483-img0.jpg`, `media/458-img0.jpg` title).

### A8. Spacing rhythm (estimated)
8 px base. Card inner padding 16 to 24 (most 20). Gap between cards 16 to 24. Section gap 32 to 40. Label-to-value gap 4 to 8. Examples: `media/159-img0.jpg`, `media/424-img0.jpg`, `media/634-img1.jpg`, `media/660-img0.jpg`.

### A9. Card radius, shadow, border
Card radius estimated 12 to 20 px (calm sets 14 to 20). About 80% of light references separate cards with a 1 px hairline and little or no shadow. Soft shadow appears only on floating things (popovers, the setup card in `media/378-img0.jpg`, the profile card in `media/626-img1.jpg`). Inner tiles are grey-filled with no border (`media/311-img0.jpg` "Submissions 245", `media/463-img2.jpg` Value / Payment / Items strip, `media/198-vid0.jpg` stat tiles).

### A10. Empty states
Rarely shown in the references. When shown, the card keeps its structure and shows placeholder values ("--/--" in `media/634-img5.jpg`) or a dashed "Add new" tile (`media/356-img3.jpg`, `media/477-img6.jpg` "Create Custom Report"). No reference stacks several "No data yet" cards.

### A11. Icons
Thin outline icons at 16 to 20 px, monochrome grey or ink in the calm sets (`media/098-img1.jpg`, `media/248-img1.jpg`, `media/474-img0.jpg`, `media/626-img0.jpg`). Coloured filled icon tiles appear in the louder sets (`media/285-img0.jpg`, `media/576-img0.jpg`, `media/597-img0.jpg`).

### A12. Setup and onboarding (4 items)
A compact progress card instead of a full checklist on the page: `media/237-img1.jpg` (sidebar card "20% Complete setup · Create business profile"), `media/378-img0.jpg` (collapsible "Getting started 2/5", done rows with green check, next row numbered with chevron), `media/127-img0.jpg` ("1/5 steps completed"), `media/163-vid0.jpg` ("2/8 Completed").

## B. What the strongest references share (and the weak ones lack)

Strongest 15 (my judgment): `media/098-img0.jpg`, `media/563-img0.jpg`, `media/198-vid0.jpg`, `media/634-img1.jpg`, `media/159-img0.jpg`, `media/424-img0.jpg`, `media/252-vid0.jpg`, `media/478-img0.jpg`, `media/535-img1.jpg`, `media/356-img0.jpg`, `media/356-img1.jpg`, `media/477-img5.jpg`, `media/508-img0.jpg`, `media/588-img0.jpg`, `media/626-img0.jpg`.

What they have in common:
1. **Only greys plus one meaning colour.** Colour appears only in a status pill, a delta, or one highlighted bar. `media/563-img0.jpg` colours one number red because it is overdue; nothing else is coloured.
2. **The number is the hero, the label is quiet.** Large semibold number, small grey label, no icon competing (`media/424-img0.jpg`, `media/478-img0.jpg`, `media/159-img0.jpg`).
3. **Four or five text sizes, used the same way everywhere.** Row names all one size, meta all one size.
4. **Hairlines, not boxes inside boxes.** One white card holds several cells separated by 1 px lines (`media/252-vid0.jpg`, `media/458-img0.jpg` KPI strips). No card-in-card chrome with its own header bar and divider.
5. **Aligned columns and right-aligned tabular numbers** (`media/477-img5.jpg`, `media/356-img3.jpg`).
6. **Every element earns its place.** No repeated tag that is the same on every row; status pills only where status varies.
7. **Ink primary, plain secondary.** One dark button per screen; everything else is grey or outline (`media/198-vid0.jpg`, `media/588-img0.jpg`, `media/634-img1.jpg`).
8. **Generous, even whitespace** at a steady 8 px rhythm: 20 px card padding, 16 to 24 px gaps.

What the weak ones do instead (`media/181-img0.jpg`, `media/473-img0.jpg`, `media/542-img0.jpg`, `media/583-img0.jpg`, `media/623-img0.jpg`, `media/483-img0.jpg`, `media/532-img0.jpg`, `media/665-vid0.jpg`): rainbow charts, gradient buttons, coloured icon tiles on every card, photo or painted backdrops, dark themes, and 6 or more text sizes.

## C. Page by page

All proposals use only data the salon dashboard already shows or stores: bookings, revenue, services (name, category, duration, price, active), clients (visits, last visit, spend, segment), staff, working and opening hours, reviews or rating, setup steps, cancellations. Items marked "derived" are computed from that data and need confirming against the schema before use. Sizes are given for phone (402 px, the width of the screenshots) and desktop (1024 px and up, beside the locked sidebar rail).

### C1. Home overview (`dash-home.jpg`)

Problems seen in today's screenshot:
- Grey page background behind white cards (left "Today" frame).
- The 7-row setup checklist is the first thing on the page, with a yellow "Setup" label (colour without meaning), a blue progress bar, and struck-through done rows that still take full height.
- Title stack "Wednesday, 23 September" on two lines above "Overview"; the date wraps.
- Four KPI cards each show "0" and "0%". A 0% delta from zero says nothing, and the period is not labelled.
- "Rating" shows only a dash and a star, no value.
- The "Revenue, Last 7 days" card is about 180 px of empty space.
- Four stacked empty cards: "No appointments today", "No recent activity", "No data yet", plus Top staff. Each card has its own header row and divider line, which doubles the chrome.
- Estimated 7 or more text sizes (about 28, 17 to 18, 15, 14, 13, 12, 11).
- Top staff avatars in saturated blue, pink and green (colour without meaning).
- The Recommendations card (19% of appointments fall through, 6 of 32) is the most useful content but sits fifth.

Proposed anatomy (top to bottom). Sources: `media/356-img0.jpg`, `media/597-img0.jpg`, `media/252-vid0.jpg`, `media/458-img0.jpg`, `media/478-img0.jpg`, `media/535-img1.jpg`, `media/307-img2.jpg`, `media/378-img0.jpg`.
1. **Header** (from 356-img0, 597-img0). H1 "Overview" or a greeting with the user's name, 24 px Inter Tight 600. One grey line, 13 to 15 px: "Wednesday, 23 September · 9 appointments today" (count from bookings). Right side, or a full-width row on phone: ink pill "New appointment", 44 px.
2. **Needs attention** (from 356-img0 "Urgent action queue", 378-img0, 237-img1). Shown only when something exists. One 20 px-radius card, max 3 rows of 56 px:
   - setup row: segmented progress "4 of 7" plus "Next: Payments" plus chevron (replaces the 7-row checklist);
   - "Payments not connected" (from settings);
   - the cancellation insight "19% of appointments fall through · 6 of 32 in 8 weeks" with a link to cancellation rules.
   When nothing is pending, the card disappears.
3. **KPI strip** (from 252-vid0, 458-img0, 477-img1). One card. Desktop: 4 cells split by vertical hairlines. Phone: 2x2 split by a cross of hairlines.
   - Cells: Revenue (CHF), Appointments, New clients, Rating.
   - Each cell: label 13 px grey, number 24 px Inter Tight 600 tabular, then a 13 px delta line ("+12% vs last week", green or red), or a grey "No data last week" when the prior period is zero.
   - Period control above the strip, right: grey pill segmented control "Today / 7 days / 30 days" (from `media/463-img0.jpg`).
   - Rating star in its semantic amber.
4. **Main grid**, desktop 2/3 + 1/3, phone stacked:
   - **Today** (from `media/356-img1.jpg` "Today's delivery schedule", `media/576-img0.jpg`): rows of 56 px. Time "09:00" 15 px tabular semibold | client name 15 px plus "Skin Fade · Nina" 13 px grey | status pill only if not plain confirmed. The staff dot uses that staff member's calendar tint (see D9). Footer link "Open calendar". Empty: one line "No appointments today" inside the same card, 64 px tall, not a separate empty card.
   - **Revenue, last 7 days** (from 478-img0): total 24 px plus delta; 7 bars about 8 px radius, filled #E4E4E7, today's bar ink #0A0A0A; no gridlines; axis 11 px grey. Chart height about 140 px.
5. **Second row**, desktop 1/2 + 1/2:
   - **Top services** (from 535-img1, 303-img0): ranked rows of 48 px. Name 15 px | bookings count 13 px grey | CHF right, tabular | a 4 px ink bar on a #F4F4F5 track showing share. Max 5 rows.
   - **Staff** (from 307-img2 "Team Capacity"): rows of 56 px. Avatar 32 | name 15 px | "18 of 32 h booked" 13 px grey (derived: booked minutes vs working hours) | 4 px bar in the staff member's calendar tint.
6. **Activity** (from `media/310-vid0.jpg`, `media/418-img2.jpg`): 5 rows of 44 px, an 8 px dot plus one sentence plus a relative time on the right. Hide the card when empty.

### C2. Services (`dash-services.jpg`)

Problems seen:
- Blue toggles on every row. "On" is the normal state, so blue here carries no meaning; it also conflicts with blue being reserved for links.
- The selected "All" chip is pale blue; the other chips are outlined, a third style.
- The grey "Barbershop" pill repeats on all 11 rows and adds no information (Copy economy rule 4).
- Second-language subtitle repeats the name when it is the same ("Skin Fade / Skin Fade").
- Each row carries 4 controls (drag handle, expand chevron, toggle, pencil). Estimated row pitch is about 93 css px, so 11 services need about 2 phone screens.
- "Show templates" is a full-width disclosure that looks like an input field.
- "CSV import" outline button and "Add" ink button differ in height in today's frame.

Proposed anatomy. Sources: `media/563-img0.jpg`, `media/198-vid0.jpg`, `media/634-img1.jpg`, `media/505-img0.jpg`, `media/508-img0.jpg`, `media/311-img0.jpg`.
1. **Header**: H1 "Services" 24 px plus a grey count pill "11" (from `media/282-img1.jpg`). Right: grey pill "Import CSV" (#F4F4F5, 44 px) and ink pill "Add service" (44 px). Phone: actions on the same row, icon-only plus aria-label for import if width is short.
2. **Toolbar**: search field (#F4F4F5 fill, fully round, 44 px, about 320 px wide on desktop, full width on phone). Chips "All 11", "Barbershop 11", "Inactive 0": ink fill when selected, grey #F4F4F5 otherwise. Templates move out of the page body into the "Add service" flow or the empty state. This is a placement change to an existing feature and needs owner approval.
3. **Grouped list** (from 505-img0 grouped tables, 543-img2 group headers): group header "Barbershop · 11" 15 px semibold with 24 px above. The repeated category pill is dropped because the header already says it.
   - Desktop columns: name 15 px medium, with a second-language name 13 px grey only when different | duration "45 min" tabular | price "CHF 68" right-aligned tabular | "Bookable" toggle (ink when on, #E4E4E7 track when off) | overflow menu. Row 56 px, hairline between rows, hover fill #FAFAFA, drag handle shown on hover only.
   - Phone: row 64 px; name 15 px with "45 min · CHF 68" 13 px grey under it; toggle on the right. Tap the row to edit.
4. **Edit**: desktop opens a right-side panel about 400 px wide (from `media/508-img0.jpg`); phone opens a full-screen sheet. Fields as today.
5. **Optional per-service stats** (from `media/311-img0.jpg` inset tiles): bookings last 30 days and revenue in grey inset tiles inside the edit panel only. Derived; confirm first.

### C3. Clients (`dash-clients.jpg`)

Problems seen:
- All 5 clients carry a red "Gefährdet" pill. When every row is red, the colour stops signalling anything.
- Avatars use saturated green, blue and pink gradients (colour without meaning).
- The segment chip row overflows: "Regu" is cut off at 402 px. Chips with "0" counts (VIP 0, New 0, Regular 0) take space.
- Fixture names "attacker-test-1780500252", "User", "SULO A1" make the page look broken. This is a data and fixture issue, not design, but it affects the owner's judgment.
- Each row is about 92 css px for 2 lines (estimated).
- The "Client records & CRM" subtitle is jargon and repeats the title.

Proposed anatomy. Sources: `media/198-vid0.jpg`, `media/563-img0.jpg`, `media/477-img0.jpg`, `media/474-img0.jpg`, `media/520-img0.jpg`, `media/282-img1.jpg`.
1. **Header**: H1 "Clients" plus grey count "5". Keep only the actions that exist today; none are visible in the screenshot.
2. **Segment tiles** (from `media/198-vid0.jpg` stat tiles): on desktop, 4 grey #F4F4F5 inset tiles in one row (VIP, At risk, New, Regular), each with label 13 px and number 24 px. Tapping a tile filters; the selected tile gets an ink outline. On phone, keep chips: ink selected, horizontally scrollable with a fade at the edge, and hide zero-count chips except "All".
3. **Search**: #F4F4F5, fully round, 44 px.
4. **Table** (from 563-img0, 477-img5):
   - Desktop columns: avatar 32 (neutral #F4F4F5 circle, ink initials) | name 15 px medium plus phone or email 13 px grey | visits (tabular) | last visit (TT.MM.YYYY) | total spent "CHF 209" right-aligned | status.
   - Status is shown as an 8 px dot plus 13 px text ("At risk" in the semantic red or amber), not a filled pill, so a column of five stays calm. It is omitted for "Regular".
   - Row 56 px.
   - Phone: row 64 px; name plus "4 visits · last 04.06.2026" 13 px grey; CHF right; status dot after the name.
5. **Client detail** (from `media/508-img0.jpg`, `media/520-img0.jpg`, `media/474-img0.jpg`, `media/477-img0.jpg`): right panel about 400 px on desktop, full page on phone.
   - Header: avatar 48, name 18 px, segment text.
   - Key/value block: label 13 px grey in a 120 px column, value 15 px ink. Fields: phone, email, first visit, visits, total spent, average per visit (derived), no-shows (if stored).
   - "Visit history" list: date | service | staff | CHF, rows 48 px.
   - Notes, including allergy or treatment notes, which are special-category data under GDPR and nFADP (statutory floor). Do not surface them in list rows.

### C4. Settings (`dash-settings.jpg`)

Problems seen:
- Today's frame uses UPPERCASE letter-spaced group labels. The copy rule asks for normal case 13 px semibold.
- Spacing proximity is inverted. Estimated from the screenshot: a group label sits about 18 px below the previous card but about 37 px above its own card, so each label reads as belonging to the group above.
- Every row label is about 17 px semibold, so 13 rows all shout at the same volume.
- Rows have no description or current value, so "Off-peak" or "Commission" gives no hint of what is set.
- One-row groups ("Offers") each get a full card plus label.
- "Not connected" on Payments is the only state shown and is grey, though it is the one item that needs action.

Proposed anatomy. Sources: `media/098-img0.jpg`, `media/098-img1.jpg`, `media/058-img0.jpg`, `media/634-img6.jpg`, `media/588-img0.jpg`, `media/132-img0.jpg`.
1. **Desktop two-pane** (from 098 and 058):
   - Left settings sub-navigation about 240 px wide, inside the page and separate from the locked main sidebar. Group labels 13 px semibold grey in normal case: Salon, Bookings, Offers, Absence, Finances, Communication. Items 44 px with a Lucide 18 px icon and 15 px label; selected item as a #F4F4F5 fully-round pill with ink text.
   - Right pane max about 640 px. Section title 20 to 24 px plus one grey 14 px sentence. Rows 56 to 64 px: title 15 px medium plus a 13 px grey description or current value, control on the right (ink toggle, grey pill "Edit", or the value text). Hairlines between rows. One 20 px-radius card per section.
2. **Phone** keeps the grouped list but fixes the proximity: 32 px above a group label, 8 px between the label and its card. Row 56 px: icon 20 + title 15 px medium (not semibold 17) + current value 13 px grey on the right where the setting has one (for example the VAT rate or the cancellation window from existing settings) + chevron. Merge one-row groups into neighbours only with owner approval, since that changes the information structure.
3. **Payments state**: "Not connected" as an 8 px amber dot plus 13 px text. It also appears in the home "Needs attention" card.
4. **Detail pages** use the key/value pattern from `media/132-img0.jpg` ("Connected" pill plus a details table) for Payments and Verification. Destructive actions sit last in red text.

## D. Conflicts with the fixed Solen constraints, and how to keep each reference's intent

1. **Grey canvas with white cards** (`media/159-img0.jpg`, `media/533-img0.jpg`, `media/311-img0.jpg`, `media/252-vid0.jpg` warm grey). Solen needs a white page. Keep the separation by giving top-level cards the approved calendar shadow token (`rgba(0,0,0,.02) 0 0 0 1px, rgba(0,0,0,.10) 0 8px 24px`, from `public/_research/calendar/index.html`), and use #F4F4F5 only for inset tiles. Risk: many stacked cards with a 24 px-blur shadow may read heavier than the references' hairlines. Test one card style against a hairline-only variant, changing one variable at a time.
2. **Blue, purple or gradient primary buttons** (`media/285-img0.jpg`, `media/311-img0.jpg`, `media/282-img3.jpg`, `media/508-img0.jpg`, `media/685-img2.jpg`). Use ink #0A0A0A fully-round pills. The ink-button references (`media/198-vid0.jpg`, `media/588-img0.jpg`, `media/634-img1.jpg`) show the same hierarchy works.
3. **Blue selected chips and blue toggles** (`media/109-img0.jpg`, today's Solen services page). Selected state is ink.
4. **Multi-hue charts** (`media/181-img0.jpg`, `media/473-img0.jpg`, `media/542-img0.jpg`, `media/583-img0.jpg`, `media/533-img1.jpg`). Use grey bars plus one ink highlight (intent of `media/478-img0.jpg`), or two strengths of one grey (`media/418-img1.jpg`). A donut is replaced by a ranked list with bars (`media/535-img1.jpg`).
5. **Coloured category tags** (`media/307-img1.jpg`: Growth, Core, Research, Sales). Category is not a status, so use grey #F4F4F5 chips with ink text. Tinted pills stay only for status (confirmed, cancelled, no-show, at risk).
6. **Radius 8 to 14 px on cards and rectangular buttons** (most references). Cards and boxes 20 px; buttons and chips fully round; inner tiles can stay smaller (for example 12 px, as the calendar events use), pending the open radius decision in project instructions. Do not change existing radii while that is open.
7. **Dense 28 to 36 px table rows** (`media/351-img0.jpg`, `media/308-img0.jpg`). Minimum 44 px touch targets; use 56 px rows on desktop and 64 px on phone, as proposed above.
8. **UPPERCASE and monospace labels** (`media/098-img1.jpg` "ACCOUNT", `media/463-img1.jpg` "DELIVERING TO", `media/378-img1.jpg`, `media/025-img0.jpg`). Use normal-case 13 px semibold labels in Inter and Inter tabular figures for numbers.
9. **Coloured icon tiles on KPI cards** (`media/285-img0.jpg`, `media/576-img0.jpg`, `media/443-img0.jpg`). Use a #F4F4F5 tile with an ink Lucide icon, or no icon (`media/424-img0.jpg` has none and looks strongest). One colour use that does carry meaning: staff identity. The approved calendar already gives each staff member a muted tint (sage #EEF4EC / #7FA37A, lavender #F1EEF8 / #9383C4, sand #F7F0E4 / #C29A5B, from `public/_research/calendar/index.html`). Reusing those tints for staff dots and staff bars on home keeps the calendar and home consistent. This needs owner confirmation that staff tint counts as meaning.
10. **Photo, painted or dark backdrops** (`media/532-img0.jpg`, `media/594-img0.jpg`, `media/543-img0.jpg`, `media/665-vid0.jpg`, `media/689-vid0.jpg`). These are presentation, not product. Light-only white page. HelloDottaa (`public/_research/calendar/ref.jpg`) is dark too; the approved calendar already moved it to white.
11. **Greeting with emoji, serif or italic type** (`media/483-img0.jpg`, `media/458-img0.jpg`, `media/623-img0.jpg`). Use Inter Tight 600 with no emoji.
12. **Blue "View all" and "See details" links**. Blue is allowed for link text by the Solen rule, but today's dashboard uses ink. Whether section links become blue is a visible choice for the owner and is not decided here.
13. **Click focus rings and hover-only affordances.** References show hover fills and drag handles on hover. Keep the hover fill and ink keyboard focus ring, with no ring on click. Drag handles must also be reachable by keyboard and touch (for example a reorder mode), not only on hover.

## Limits and what would settle them

- All reference pixel values are estimates from 640 px images; none were measured on a live product. Capturing the named live products (CloseCRM, Meridian or Attio-style CRM) with the `reference-lock` procedure would settle exact values if the owner names one as the target.
- Today's dashboard was seen only in phone-width screenshots (402 px). Desktop layout, hover and focus states, and real non-zero data were not seen. A measured capture of `/en/dashboard*` at 1280 px with real fixture data would settle the desktop problems.
- Derived metrics (staff booked hours, average per visit, per-service 30-day counts) and the no-show field need checking in `_inventory/_db-columns.json` before a mockup uses them.
- The frequency counts in section A are my own hand tally, one count per item. Another reviewer could code borderline items differently by about plus or minus 3.
