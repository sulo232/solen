# Card, and List / table rows

## Card

- **Reviewed:** 75 posts. High relevance (63): 11, 18, 30, 50, 62, 65, 68, 72, 78, 81, 87, 104, 123, 157, 159, 221, 241, 246, 267, 276, 278, 279, 282, 285, 287, 292, 306, 325, 336, 346, 356, 369, 381, 404, 414, 432, 439, 444, 468, 475, 482, 498, 508, 514, 522, 533, 543, 544, 551, 560, 569, 582, 589, 614, 625, 628, 636, 638, 642, 648, 666, 679, 681. Medium relevance sampled for review-card and dashboard-panel coverage (12): 127, 244, 289, 317, 341, 395, 413, 496, 532, 535, 547, 651.

### Recurring patterns (most common first)

**1. Photo-bleed listing card.** Photo fills the top of the card edge to edge, no inner padding around it, and the card's own corner radius is shared with the photo's top corners. Title and one grey meta line sit below the photo on a plain background, price or a stat usually trailing right, a small round heart/save chip overlaid on the photo top-right. About 20-22px corner on the photo, card itself has no visible border, sometimes a very light shadow. Seen in about 14 of the 75 reviewed posts: real-estate listings (404, 666), destination/venue cards (648, 638, 642), an interior-design hero card (68), and grocery/product cards (395, 475). All concept mockups, none shipped.

**2. Stat / KPI mini-card grid.** Two or four small white cards in a grid, each with a small icon top-left, a label next to or under it, one large bold number, and a short status line underneath (a coloured dot plus a percentage or a word like "Live Engaging"). About 8 posts: 11, 159, 285, 356, 496, 533, 681, 645(not opened, text-only). 159 is the cleanest single example: icon, label, big number, a coloured status line, and a "See in details" link. All concept.

**3. Grouped onboarding/checklist card.** One title line with a fraction ("1/5 steps completed" or "2/8 Completed"), a thin progress bar or ring, then a list of steps each with a checkmark or empty circle, sometimes a CTA row at the bottom. Seen in 127, 163/292 (same card design posted twice), 378, 651. 4 distinct posts, all concept. This is the pattern Solen's own dashboard already builds almost exactly (see below), so it is a strong validation rather than a new idea.

**4. Review / testimonial card.** A big decorative quote glyph or oversized quotation mark near the top, the review text, a star rating, then the reviewer's photo and name at the bottom. Seen in 317 and 547 only (2 posts, thin sample, low confidence on this one specific card). Both concept, both web-landing testimonial sections rather than in-app reviews.

**5. Rich profile/provider card.** Portrait photo across roughly the top 55% of the card, name with a verified badge, one line of bio text, a row of 2-3 small stats (rating, earnings, rate), then a full-width button with an icon ("Get In Touch"), with a bookmark/save icon in a corner. One clear example (276, an A/B "which is better" comparison post), concept.

**6. Bold/gradient milestone card.** Dark or saturated gradient background used to mark a special or upsell moment: an identity-verification card (157, real, shipped Airbnb), an upgrade-plan card with a "78% people upgraded" social-proof tag (267), a loyalty-points card (87), a dark achievement/rank card (444). 4-5 posts. Flagged below as a locked-value conflict, not something to copy as-is.

### Solen today

From `sys/b5-cards.jpg` and `sys/groups.json`, Solen currently has 11 different card/box recipes in production, harvested from 14 real routes:

- `r22, bg #F4F4F5, no border, no shadow` — 38 uses (home, salon). Pure photo tile, no text inside it; used as the salon/service photo.
- `r16, bg #F4F4F5, no border, no shadow` — 37 uses (search, rewards, inspo). Same idea, smaller radius, carries a heart icon overlay.
- `r16, bg #FFF, 1px #E4E4E7 border, no shadow` — 19 uses (home, rewards, dash-home, dash-settings). This is the review card: avatar+name+category on top, stars+date next line, quote text below, no decorative quote glyph.
- `r20, bg #FFF, 1px #E4E4E7 border, no shadow` — 9 uses (dash-home). The stat cards: "Revenue / CHF 0 / 0%" style, 2x2 grid, no colour-coded delta visible and no "see details" link.
- `r24, bg #FFF, 1px #E4E4E7 border, no shadow` — 7 uses (salon, booking). The grouped service-picker card (title+chevron, duration, price, hairline divider between two services inside one bordered box).
- `r14, bg #FFF, 1px #E4E4E7 border, no shadow` — 5 uses (rewards). Perk rows, each its own separate bordered card (not grouped with hairlines).
- `r13, bg #FFF, 1px #E4E4E7 border, no shadow` — 4 uses (home). The "Free now" salon card: text only, no photo.
- `r40, bg #FFF, 1px #E4E4E7 border, no shadow` — 2 uses (search bar shell).
- Three one-off variants (r16 grey+border, r16 transparent+border, r16 white+no border, r12 white+border+soft shadow) each used exactly once, on different routes (home, salon, dash-home).

Where they disagree: seven different corner radii (12, 13, 14, 16, 20, 22, 24) are in production for what is conceptually one component, three different fill treatments (grey fill / white / transparent), and only one of the eleven variants (the dash-home "Waiting for approval" card) actually uses the locked box recipe (20px + soft shadow, no outline) as written; everything else substitutes a 1px border with no shadow instead. The photo tile and its caption text are also two separate elements today: the photo has its own boxed radius, but the title/category/price live as plain unboxed text below it, so a "salon card" is not really one component in the code, it is a photo tile plus nearby text.

### The differences that matter

| X does | Solen does | Why it matters |
|---|---|---|
| The whole listing (photo, title, meta, price) sits inside one bordered/shadowed card, read as one tappable object | The photo is its own boxed tile (r22, no border); title/category/price are plain text below with no shared boundary | The eye can't tell where the tappable card ends; it fights the point of having a locked box recipe in the first place |
| One card recipe reused everywhere it applies (X posts still vary by app, but each app is internally consistent) | Eleven different corner/fill/border combinations across 14 routes for the same conceptual component | Search feels like a different product from rewards, which feels different from dash-home, even though no single rule is broken |
| Dashboard stat cards commonly pair the big number with a coloured up/down line and a "see details" link (159 is the clean example) | Solen's stat cards show label and number only; delta reads as plain "0%" text with no colour and no link | Colour-coded deltas let an operator scan direction at a glance; a dead-end card with no link wastes the tap |
| Review/testimonial cards lead with the star rating and a decorative quote mark, identity at the bottom | Solen's review card leads with identity (avatar, name, category) and rating, quote text last | Different reading order for the same information; worth naming even though Solen's order is arguably the more useful one for a marketplace (rating first, not brand voice) |
| Milestone/reward cards use dark or saturated gradients to signal "this moment is special" | Locked values forbid dark mode and loud colour | A real, useful UX device that Solen cannot use as-is; needs an ink/light equivalent (see Conflicts) |

### Proposed Solen version

**Shared shell** (every card variant below): white `#FFFFFF` background, 20px corner, shadow `rgba(0,0,0,.02) 0 0 0 1px, rgba(0,0,0,.10) 0 8px 24px`, no separate outline. Taken directly from Solen's own locked box recipe, not from X. This replaces the mixed 1px-border-no-shadow substitute that 9 of the 11 current variants use.

**Salon card** (customer, listing): photo full-bleed across the top, corners matching the card's own 20px (from X pattern 1, 14 posts); round white/blur heart-save chip overlaid top-right (already exists on Solen's current photo tile, reused, not new); title 15-16px semibold ink, one line, truncated (matches Solen's current listing title weight); one grey meta line (category, neighbourhood); price or rating trailing right, bold. The change from today: photo and caption now sit inside one shared card boundary instead of a boxed photo plus unboxed text (own judgment, grounded in X pattern 1).
States: default; pressed (Solen's existing press treatment, not redefined here); saved (heart filled ink); "fully booked"/unavailable badge in the meta line if needed (own judgment).

**Service row** (customer, salon page and booking picker): keep as built today, no change proposed. Title+chevron, grey duration line, bold price, hairline divider inside one bordered container. It already matches the best-performing X pattern for this content shape (grouped hairline list, see List/table section) and is locked-value compliant.

**Booking card** (customer, upcoming/past appointments): icon or salon-photo circle left, service/salon name bold, date and time on a second grey line, price or status trailing right, grouped with hairline dividers inside one card per section header ("Upcoming" / "Past"). Grounded in X pattern seen at posts 306 and 285, adapted to Solen's existing "Top staff" row treatment for consistency (own judgment on the exact grouping, since Solen has no shipped "my bookings" list to compare against yet).

**Review card**: keep Solen's current anatomy (identity+rating first, quote last), it is already more scannable for a marketplace review than X's quote-first pattern. Optional: a small quote glyph as a light decorative accent is available from X pattern 4 if main wants it, but it is not required (own judgment, low confidence given only 2 reviewed examples).

**Dashboard stat card**: icon in a rounded square token (`#F4F4F5` background, matches the locked secondary-fill), label, large bold number, a coloured delta line (green up / red down, small dot plus percentage), and a "See details" link in the locked link-blue, bottom-right. Grounded in X pattern 2 (159, plus 7 more). This is the one place blue-as-link is appropriate under the locked palette. The 2x2 grid and card radius Solen already has stay as-is; the delta colour and the link are the proposed additions.

**Dashboard panel** (Today / Activity / Recommendations / Top staff, etc.): keep as built. Bold section title plus "View all" link at the top, hairline-divided rows or a centered empty state inside, already matches the best X grouped-panel pattern. No change proposed.

**States across all card variants**: default; pressed; selected (only where a card acts as a filter, rare for this component); disabled (rare); empty (centered icon + one grey line, already implemented well on dash-home, keep); loading (grey skeleton blocks, already used on search, keep).

### Best exemplars to show the owner

- 404 — `media/404-img0.jpg` — real-estate photo card: full-bleed photo, category badge, heart, title+location+price+specs row, all in one boundary.
- 666 — `media/666-img0.jpg` — same pattern, colour-toggle version, clean specs row with hairline separators.
- 159 — `media/159-img0.jpg` — the clearest stat-card anatomy: icon, label, number, coloured delta line, "See in details" link.
- 127 — `media/127-img0.jpg` — onboarding checklist card, near-identical to Solen's own dash-home setup card; good side-by-side validation piece.
- 547 — `media/547-img0.jpg` — testimonial card anatomy, useful contrast to Solen's current review card.
- 276 — `media/276-img0.jpg` — rich profile/provider card with photo, stats row and CTA; owner can react to the A/B framing directly.

### Do not adopt

- Dark and gradient milestone cards (157, 267, 87, 444): conflicts with light-only and calm-colour locks.
- The "Vibe code vs Revamp" comparison posts (544, 582): these are AI-generated before/after concept pairs with invented stat numbers, not evidence of a real product decision either side.
- Fabricated social-proof copy like "78% people upgraded" (267): Solen's own copy rules forbid fabricated claims; the card mechanic (highlighting a plan with a proof point) is fine, the fake number is not.
- Loud saturated gradient agent-marketplace cards (625): conflicts with calm-colour lock; keep the grid/category-pill structure if useful, drop the colour treatment.

### Conflicts with locked values

- Milestone/reward cards (157 Airbnb verification, 267 upgrade card, 87 loyalty points, 444 rank screen) rely on dark backgrounds or saturated gradients to read as "special." Solen's light-only and calm-colour locks rule this out as-is. If Solen wants a way to mark a milestone moment, it needs an ink-on-white equivalent; this is a real product question for main, not something to silently resolve.
- Everything else reviewed (stat-card colour deltas, status pills, avatar rows) is compatible with the locked palette; red/green semantic colour on a delta line is not "loud colour," it is the kind of single-purpose semantic use the design system already allows for stars, success and error elsewhere.

---

## List / table rows

- **Reviewed:** 33 posts. High relevance (26): 61, 98, 121, 163, 221, 241, 282, 285, 287, 292, 303, 306, 314, 356, 370, 399, 508, 533, 543, 551, 569, 589, 614, 628, 636, 681. Medium relevance sampled, all dual-tagged with component-card (7): 127, 244, 341, 496, 532, 535, 651.

### Recurring patterns (most common first)

**1. Grouped hairline settings/menu list.** A leading icon (or nothing), a bold label with an optional grey sub-line, and a trailing chevron, toggle or value, with a 1px hairline dividing each row from the next, all grouped inside one bordered container per section, and a small grey uppercase caption above each group. Seen in 98 (desktop security settings), 61 (native-style toggle rows), and 121 (a real, shipped X Settings screen, so this pattern is production-tested, not just a concept). This is also exactly what Solen's own dash-settings and dash-services pages already do (see below), which is a strong validation of the pattern rather than a new idea.

**2. Data table with status pills.** A header row of column labels (sometimes with a sort caret), an optional checkbox column for bulk selection, a coloured status pill per row instead of plain text (Fulfilled/Paid/In Transit, Published/Draft), avatar+name pairing when a row is about a person, right-aligned numeric or date columns, and a pagination footer. Seen in 282, 287, 508, 533, 356. 5 posts, all desktop dashboards, all concept mockups.

**3. Avatar list row.** A circular photo or initials avatar on the left, name and a role/meta line, a date or time, sometimes an inline action button pair (Approve/Decline). Seen in 306 (doctor appointments, Upcoming/Past grouped headers), 285 (upcoming meetings), 589 (leave requests with inline approve/decline), 163/292 (staff shift row). 4 distinct posts. Matches Solen's own "Top staff" panel row on dash-home closely.

**4. Status-pill-in-a-row.** A narrower pattern worth naming on its own: a coloured capsule showing state (not a toggle, not plain text) sitting at the end of an otherwise plain row. Seen in 370 (Published/Draft) and inside pattern 2's tables. Solen has no equivalent today; its only "state" indicator in a row is the toggle switch on dash-services.

**5. Plain stacked rows, no container or divider.** Label left, value right, just vertical spacing, no card boundary and no hairline. Seen in 287's invoice breakdown (subtotal/discount/shipping/tax). This is the lightest version of a "list," used for receipts/summaries rather than navigable rows.

### Solen today

- **dash-settings** (`pg-dash-settings-a.png`): rows grouped by grey uppercase section caption (PROFILE & APPEARANCE, BOOKINGS, OFFERS, etc.), each group inside one white, rounded, 1px-bordered container, rows are icon + bold label + trailing chevron, 1px `#E4E4E7` hairline between rows, roughly 64px row height. This matches recurring pattern 1 closely.
- **dash-services** (`pg-dash-services-a.png`): same grouped-hairline container, but a richer row: 6-dot drag handle left, title with an expand chevron, grey subtitle, a grey pill tag ("Coiffeur") + duration + bold price on the next line, then a toggle switch and a pencil/edit icon on the right. The toggle renders **blue**, the same blue the locked palette reserves for link text only.
- **profile** (`pg-profile-a.png`): rows grouped only by a plain grey section label (Account, Bookings, Wallet, Personal details), icon + bold label + grey sub-line + chevron, same conceptual row as dash-settings, but with **no bordered container and no hairline divider** between rows, just spacing.
- **salon page, service picker** (`pg-salon-a.png`, `pg-booking-services-a.png`): services grouped by category, inside one bordered card per category, hairline divider between the two services in each group. Matches pattern 1.
- **salon page, reviews**: individual review blocks (avatar+name+date, stars, text) stacked directly on the page background with hairline dividers between them, no card wrapper around each review and no wrapper around the whole list either.
- **dash-home panels** (`pg-dash-home-a.png`): "Top staff" panel uses an avatar-initial circle + name row with a hairline divider, matching pattern 3. "Today" and "Activity" panels show a centered empty state (icon + one grey line) when there is no data, which is a good reference for empty states generally.
- **dash-calendar** (`cal/now-dt-aug16.png`): booking blocks in the day grid are their own thing: small grey-filled rounded rectangles (roughly 6-8px corner, no border, no shadow), bold client name, grey service name, positioned by time and duration rather than stacked in a list. Not part of the settings-row family at all.

Where they disagree: the exact same conceptual row (icon, label, sub-line, chevron) is boxed with hairline dividers on dash-settings and dash-services, but bare with no container and no divider on profile, the customer-facing screen. A toggle inside a Solen list row currently uses the link-blue colour, which the locked palette says is reserved for link text only. And the grouped-list container itself uses a 1px border with no shadow, not the 20px + shadow box recipe that is Solen's stated default, which is the same drift noted under Card.

### The differences that matter

| X does | Solen does | Why it matters |
|---|---|---|
| Status shown as a coloured pill at the row's end (Fulfilled, Paid, Published, Draft) | Solen's only in-row state indicator is a toggle switch (dash-services); no status-pill pattern exists yet | Scanning a long list for state is much slower with a toggle's on/off position than with a coloured word |
| The same hairline-grouped-row recipe is used for every settings-like list in an app | Solen uses it on dash-settings and dash-services, but drops the container and the divider on the customer-facing profile page for the same row shape | The same component reads as two different components depending only on which surface it's on |
| Toggle switches use the app's ink/dark colour or a single reserved accent, never the link colour | dash-services' row toggle renders in link-blue | Overloads one colour with two meanings (tap this to navigate vs this is currently on) |
| Desktop tables pair a checkbox column with bulk actions only when bulk actions actually exist | Not applicable yet, Solen has no dashboard table today | Worth deciding before building one, so a table isn't built with a checkbox column nobody wires up |

### Proposed Solen version

**Grouped hairline row list** (settings rows, service rows, booking rows, staff rows): one container per logical group. Row: 56-64px minimum height (comfortably clears the 44px touch-target floor), 16px horizontal padding, an optional leading element (20-24px icon, or a 32-40px avatar/initials circle, or a drag handle), a bold 14-15px ink label, an optional 13px grey sub-line beneath it, and a trailing element (16px grey chevron, a toggle, a bold value, a status pill, or inline action buttons). A 1px `#E4E4E7` hairline divides each row from the next, omitted after the last row in a group. A small grey, uppercase, letter-spaced caption sits above each group when a screen has more than one. This is what Solen's dash-settings already builds; the proposal is to use the same recipe on profile too (own judgment, grounded in the fact that dash-settings and X pattern 1 both already agree on it), and to stop using link-blue for the toggle (grounded in the locked palette, not an estimate).

**Status pill**: a small capsule, 11-12px medium text, coloured fill matching its meaning (confirmed/green-family, pending/amber-family, cancelled/grey), placed at the row's trailing end in place of plain text. New to Solen, grounded in X pattern 2 and pattern 4 (own judgment on the exact three colours, since Solen's semantic-colour values for these specific states were not in the material reviewed here).

**Dashboard data table** (desktop only): header row of grey column captions, an optional sort caret, a checkbox column only where a bulk action exists, avatar+name pairing for person rows, right-aligned numeric/date columns, status shown via the pill above, and a pagination footer (page count + prev/next). Same hairline-divider-no-shadow recipe as the row list, just wider. Grounded in X pattern 2 (5 posts, all concept, all desktop). Own judgment: do not build this for phone width, only for the dashboard's desktop surface, since none of the 5 reviewed examples show a workable mobile version of a dense table.

**States**: default; hover (desktop table rows only, a subtle grey fill, own judgment, standard practice not shown clearly in any reviewed post); pressed/active row; selected (checkbox checked, row takes the locked `#F4F4F5` secondary fill, grounded in the locked palette); disabled row (greyed text, own judgment); empty (centered icon + one grey line, matches Solen's existing dash-home empty states, keep as-is).

### Best exemplars to show the owner

- 98 — `media/098-img0.jpg` — desktop settings rows, closest match to Solen's own dash-settings recipe.
- 508 — `media/508-img0.jpg` — full data table with status pills, checkbox column and pagination footer.
- 306 — `media/306-img0.jpg` — appointments list with avatar, date and price, grouped Upcoming/Past, directly relevant to a future "My Bookings" list.
- 370 — `media/370-img0.jpg` — Published/Draft status pill in a plain content row, the clearest single status-pill reference.
- 589 — `media/589-img0.jpg` — leave-request rows with inline Approve/Decline buttons, a good reference for an actionable row.
- 121 — `media/121-vid0.jpg` — real, shipped X Settings screen; proof the hairline-grouped recipe is production-tested, not just a concept mockup.

### Do not adopt

- Dark-mode dashboard tables (532, a logistics table on a near-black background): conflicts with light-only.
- Dense 5-6 column desktop tables (508) applied directly to a phone width: none of the reviewed table posts show a working mobile version; treat the table pattern as desktop-dashboard-only, not something to compress onto a 402px screen.
- Checkbox-heavy bulk-select tables (282, 533): only worth building if a specific Solen dashboard screen needs bulk actions; do not add a checkbox column as decoration.

### Conflicts with locked values

None found that are specific to X's list/table patterns. The one blue-toggle issue in this component is a pre-existing Solen-vs-itself inconsistency (noted above under "Solen today"), not something imported from X.
