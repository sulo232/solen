Exists-check, per-section pointer to the deeper surface capture: home = `fresha--home.md`; search
results = `fresha--search-results.md`; venue page = `fresha--venue-page.md`; confirmation =
`fresha--confirmation.md`; bookings list = `fresha--bookings-list.md`; payment step =
`fresha--payment-step.md`; profile = `fresha--profile.md`; empty states = `fresha--empty-states.md`.
(A ninth sibling, `fresha--booking-flow.md`, covers the services/staff/date/time steps before the
payment step and is not one of this file's eight sections, but is cited below wherever a look
value overlaps it.) Each of those files owns page ANATOMY (section order, component shape, dropdown
and tab behavior) for its surface; this file never repeats that narrative, it only adds the
computed-style numbers (hex, px, radius, box-shadow, font-weight) those files defer.

Exists-check: net-new vs `fresha--home.md`, `fresha--venue-page.md`, `fresha--profile.md`,
`fresha--booking-flow.md` (all read in full before writing this file). Those four capture PAGE
ANATOMY (section order, component shape, dropdown/tab behavior), mostly via Mobbin desktop-width
stills, and explicitly defer pixel-level values to other specs. This file's job is different: exact
LOOK-LEVEL RECIPES (hex, px, radius, computed box-shadow, font-weight) read live with Playwright
`getComputedStyle`/`getBoundingClientRect` at the TRUE 390x844 mobile-web viewport (not desktop-width
Mobbin stills), organized as reusable recipes (pill, badge, primary/secondary button, type ladder,
spacing, card, colour provenance, status treatment, empty state) with a value-by-value Solen port
map and named conflicts against locked Solen values, per this task's brief. It does not re-derive
section order or component anatomy already covered by the four files above; where they overlap
(venue header, service rows, Team, Reviews) this file adds the missing computed pixel values rather
than repeating the anatomy narrative.

# Fresha, look-level recipes

## Identity

- Brand: Fresha
- Platform: web (mobile viewport), captured live at 390x844, deviceScaleFactor 3, iPhone Safari user agent, locale de-CH
- Pages reached live: home (fresha.com/de), search results for "hair" in Basel (fresha.com/de/search?query=hair&location=basel), one venue page (Joliz Aeschen, Basel, fresha.com/de/a/joliz-aeschen-basel-aeschenvorstadt-55-fcwoikwa)
- Pages reached via Mobbin (behind login, iOS app, tier expect): appointment confirmed detail screen, post-booking confirmation moment, appointments list (upcoming + past), empty appointments, profile hub, my-profile edit screen, home feed
- Capture date: 2026-09-05
- Method per value: values from the three live pages are tier "verified", read with Playwright `getComputedStyle` and `getBoundingClientRect` (script paths and JSON dumps live in the session scratchpad, not in this repo). A handful of colors were cross-checked by PIL pixel-sampling the same screenshots, marked "verified (pixel-sampled)". Values from Mobbin stills are tier "expect" (read off a still image, not computed), marked explicitly below.
- Screenshots: full-page PNGs of all three live pages plus header/services/reviews crops were captured to the session scratchpad (`refs/fresha/`), not committed to this repo.

## Philosophy

Ink-black (`#0D0D0D`) is the only saturated color doing structural work (button fills, active states, headings); the one non-neutral hue is a violet accent (`#6950F3`) reserved for links, avatar initials, and status pills, never for prices or CTAs. Buttons carry a two-tier hierarchy by fill AND size, not just color: the one primary commit action per screen is solid ink-fill at 48px, every repeated inline action (per-service "Buchen") is an outline pill at 36px, so the eye reads size before it reads anything else. Cards use a near-invisible 1px inset hairline instead of elevation; the page is otherwise flat white with a single decorative pastel gradient behind the home hero and nowhere else. Gray text (`#767676`) carries all secondary information (address, meta, inactive tab); black is reserved for the load-bearing name, price, and rating. Every control (pill, chip, book button) converges on one radius family: full capsule (`radius: 999px`), never a fixed corner radius, at every size.

## Measured

### Pill / chip

| element | box | radius | fill | text | border/shadow | tier |
|---|---|---|---|---|---|---|
| Home search widget (query-builder card) | 350x264, x=20 | 16px | `#FFFFFF` | 16px/400 `#0D0D0D` label | none | verified |
| Search-results collapsed search bar | 350x64, x=20 | 999px | `#FFFFFF` | 16px/600 `#0D0D0D` | none | verified |
| Map icon button (search results) | 48x48 | 999px (circle) | transparent | icon only | none | verified |
| Category pill, selected (venue "Waxing") | 79x36 | 999px | `#0D0D0D` | 14px/500 `#FFFFFF` | none | verified |
| Category pill, unselected (venue "Wimpern") | 91x36 | 999px | transparent | 14px/500 `#0D0D0D` | `inset 0 0 0 1px rgba(19,19,19,0.1)` | verified |
| "Best in Class" chip (overlaid on card photo) | text box 74x16 | pill (visual) | white pill (visual, not computed) | 13px/600 `#0D0D0D` | none observed | text verified, fill expect (visual only) |

### Badge

| element | detail | tier |
|---|---|---|
| Rating star icon (search cards, venue header) | pixel-sampled `#FFC00A` (255,192,10) | verified (pixel-sampled) |
| Team-member rating pill (over avatar, reviews section) | small white pill, star + bold number, drop shadow, positioned bottom-center over a 96x96 circular avatar | expect (visual, not computed) |
| "Confirmed" status pill (Mobbin, appointment detail) | solid violet/purple pill, white check-circle icon, white bold text, sits above the date/time block | expect (Mobbin still) |
| "Action required" status pill (Mobbin, appointment detail) | solid amber/gold pill, warning icon, black text | expect (Mobbin still) |

### Primary button

Main "Jetzt buchen" (sticky/header book button), fill layer measured directly:

- box: 134x48 (width content-driven, height fixed)
- radius: 999px (full capsule)
- background: `rgb(13,13,13)` = `#0D0D0D`
- text: 16px / weight 600, color `#FFFFFF`
- padding: `0 19px`
- border: none; a `::before` pseudo-element carries `box-shadow: #FFFFFF 0 0 0 2px, #0D0D0D 0 0 0 4px` (a focus-ring construction, resting-state visibility not confirmed)
- tier: verified

### Secondary button

Per-service "Buchen" (service-row book button), fill layer measured directly:

- box: 80x36
- radius: 999px (full capsule, same family as primary)
- background: `#FFFFFF`
- border: `1px solid rgb(211,211,211)` = `#D3D3D3`
- text: 14px / weight 500, color `#0D0D0D`
- padding: `0 15px`
- tier: verified

Same recipe reused for "Alle anzeigen" (full-width "show all services" button, 350x48) and "Kaufen" (gift-card buy button): white fill, thin gray outline, ink text, capsule radius. Owner's literal ask was to match Solen's service-row Book button to its main Book button; on Fresha itself these are NOT the same treatment, they differ in both fill (solid vs outline) and height (48 vs 36), only the radius family matches. See Conflicts.

### Type ladder

| role | size / weight | color | tier |
|---|---|---|---|
| Hero H1 (home) | 40px / 700 | `#0D0D0D` | verified |
| Venue name (H1) | 28px / 600 | `#0D0D0D` | verified |
| Section H2 (home: "Empfohlen", "Trending", etc.) | 22px / 600 | `#0D0D0D` | verified |
| Card name (search/home location card) | 16px / 600 | `#0D0D0D` | verified |
| Service row name ("Oberkörper") | 16px / 500 | `#0D0D0D` | verified |
| Category/eyebrow line (venue "Schönheitssalon") | 16px / 400 | `#767676` | verified |
| Body / meta (address, category+review-count line, duration) | 14px / 400 | `#767676` | verified |
| Price ("ab 30 CHF") | 14px / 600 | `#0D0D0D` | verified |
| Rating value (venue header) | 16px / 600 | `#0D0D0D` | verified |
| Rating value (card, inline) | 14px / 600 | `#0D0D0D` | verified |
| Primary button text | 16px / 600 | `#FFFFFF` | verified |
| Secondary button text | 14px / 500 | `#0D0D0D` | verified |
| Filter/date tab (active) | 16px / 400 | `#0D0D0D` | verified |
| Filter/date tab (inactive) | 16px / 400 | `#767676` | verified |
| Chip text (category pill) | 14px / 500 | white or `#0D0D0D` | verified |
| "Best in Class" chip | 13px / 600 | `#0D0D0D` | verified |

That is 6 distinct sizes (40, 28, 22, 16, 14, 13) and 4 distinct weights (400, 500, 600, 700) on the venue page alone. See Conflicts: this exceeds Solen's own ceiling.

### Spacing

- Page horizontal margin: 20px both sides at 390px viewport (search pill, cards, venue content all start at x=20), measured, verified.
- Home carousel card gap: 20px between cards (card at x=22, next at x=278, card width 236) -> 278-22-236=20, verified.
- Home section-to-section: heading tops at y=894, 1271, 1605 (roughly 330-380px including the section's card row), verified from raw y-coordinates, not a clean single constant since row heights vary.
- Service-card stack: card height ~106px per row (verified), visual gap between stacked white service cards ~16px (screenshot-read, expect).
- Venue header block: name at y=327 (h=36), category line at y=365 (38px gap from name bottom), rating row at y=399 (also ~12px gap), address pill at y=449 (~28px gap) - all verified.

### Card

| element | detail | tier |
|---|---|---|
| Search/home location-card photo | 236x157 (ratio ~1.5:1, close to 3:2), radius 16px on the image container | verified |
| Service list-item card | white bg, radius 16px, `box-shadow: inset 0 0 0 1px #E5E5E5` (simulated hairline, not a real border), padding 16px, no drop shadow | verified |
| Team avatar | circle, 96x96, radius 999px | verified |
| Review avatar (initials, e.g. "CM") | circle, background `rgb(240,240,255)` = `#F0F0FF`, initials text `rgb(105,80,243)` = `#6950F3`, bold | verified (pixel-sampled + computed) |
| Hero gradient (home, decorative only) | pastel violet `#D5D3FF` top-left fading toward near-white pink at bottom-right | verified (pixel-sampled) |

### Colour provenance

| hex | role | where seen | tier |
|---|---|---|---|
| `#0D0D0D` | primary text, primary-button fill, active tab/pill fill, all headings | everywhere | verified |
| `#767676` | secondary/meta text: address, category+review line, inactive tab, duration | cards, venue header, service rows | verified |
| `#E5E5E5` | hairline simulated via inset box-shadow on cards | service list cards | verified |
| `#D3D3D3` | secondary-button border | "Buchen" outline pill | verified |
| `#FFC00A` | rating star icon | cards, venue header | verified (pixel-sampled) |
| `#B7570B` | "Geschlossen" (closed) open-status text and its clock icon | venue header | verified |
| `#6950F3` | the one brand accent: text links ("Mehr erfahren", "Alle anzeigen"), avatar-initials text, (expect) "Confirmed" status pill | venue About, Team, Reviews sections, Mobbin appointment screens | verified (live) / expect (Mobbin) |
| `#F0F0FF` | pale-violet tint, avatar background for initials | review cards | verified (pixel-sampled) |
| `#D5D3FF` -> near-white | hero gradient, purely decorative | home hero only | verified (pixel-sampled) |
| amber/gold (no hex sampled) | "Action required" status pill | Mobbin appointment detail | expect (Mobbin, not pixel-sampled) |
| pastel green (no hex sampled) | "Completed" form-status chip | Mobbin appointment detail (Forms section) | expect (Mobbin, not pixel-sampled) |

### Status / confirmation treatment (Mobbin, tier expect throughout this subsection)

- "Confirmed": solid violet/purple pill, white check-circle icon, white bold text, positioned directly above the date/time block on the appointment-detail screen. Visually consistent with the live-measured `#6950F3` accent.
- "Action required": solid amber/gold pill, warning icon, black text, same position as "Confirmed" (the two are mutually exclusive states of the same slot).
- Post-booking confirmation moment: a distinct, separate full-screen transient state, not the appointment-detail page. Full-bleed purple-to-blue gradient background, a white serif/display "Appointment confirmed" headline plus a centered white checkmark icon, no other chrome (no header, no button visible in the captured still).
- Appointment-detail page structure: photo header (back-arrow overlay), status pill, big date/time (24-28px bold black, expect), duration in gray beneath it, then a flat icon+label+sublabel+chevron list (Add to calendar / Getting there / Manage appointment / Venue details), hairline-separated with no card boxes. Below that: an Overview section (service name, duration, price, Total), a Forms section with a pastel-green "Completed" status chip, then a Cancellation-policy paragraph and a booking reference, both rendered directly on the page (not hidden in a details/i18n object).
- Appointments list: upcoming = map-preview photo (rounded top corners) over a white lower half (venue name bold, date/time line, duration+price+service line, two buttons side by side: "Get directions" outline pill + a square icon-only calendar button). Past = compact row: small square thumbnail + name + date + a "Book again" outline pill button, no map.

### Empty state (Mobbin, tier expect)

Centered vertical cluster, upper-middle of the screen (not full center, generous whitespace below): a vivid gradient violet calendar/notebook icon (not a flat gray disc), bold headline "No appointments", a gray one-line subtext ("Your upcoming and past appointments will appear when you book"), then an outline-pill CTA ("Search salons"). Icon-to-message and message-to-CTA gaps read tight and consistent, no floating CTA far below the cluster.

### Profile hub (Mobbin, tier expect)

- Header: bold "Profile" title (~28px, black), left-aligned, a back arrow above it.
- Identity block: a bordered white rounded card containing a circular avatar (pale-violet background + violet-colored initials), the name in bold black, and a gray "Edit profile" subline underneath.
- Menu list: flat black line icons (no icon-chip background) + label + trailing chevron, hairline-separated rows on plain white, no card grouping around the list.
- Footer utility row: "English" and "Support", each a small icon+text pair in the violet accent color (small clickable accent, same sparse-accent role Solen already reserves for its own blue).

## Port map

| Fresha value | Solen equivalent | notes |
|---|---|---|
| ink `#0D0D0D` | ink `#0A0A0A` | effectively identical, no change needed |
| accent violet `#6950F3` | accent blue `#276EF1` | different hue for the same "small clickable accent" role, see Conflicts |
| secondary text `#767676` | `s-ink-2` `#6B6B6B` | close match, same role (meta, chevrons, inactive state) |
| card hairline `#E5E5E5` (inset shadow) | hairline `#E4E4E7` | near-identical value, keep Solen's own token rather than importing a new one |
| secondary-button border `#D3D3D3` | hairline `#E4E4E7` | Fresha's border is a shade darker; port to Solen's own locked hairline, do not add a new gray |
| star `#FFC00A` | star `#FFC32B` | near match, keep Solen's own locked value |
| "Geschlossen" amber-brown `#B7570B` open-status text | (no port) | Solen's own dated lock is plain ink text, no colored status text at all, see Conflicts |
| avatar tint `#F0F0FF` | `s-bg-sunken` `#F4F4F5` (neutral) | Solen has no violet-tint token; port the ROLE (soft avatar background) onto Solen's own neutral sunken tray, not a new violet tint |
| primary button: solid fill, 48px, radius 999 | Solen: solid ink fill, radius 16 (locked, not a capsule) | fill/size concept ports; the capsule radius does not, see Conflicts |
| secondary button: outline, 36px, radius 999 | Solen: h-11 (44px) minimum touch target, radius 16 | the 36px height and the capsule radius both fail Solen's own locks, see Conflicts |
| card photo radius 16, list-card radius 16 | Solen entity-card radius 16 / grouped-list-card radius 24 | direct, clean match, no conflict |
| type ladder (40/28/22/16/14/13, 4 weights) | Solen ceiling: <=4 sizes, <=2 weights per screen | Fresha's own ladder exceeds Solen's ceiling, compress when porting structure, see Conflicts |
| status pill (solid violet/amber fill + icon) | Solen: plain ink text, no pill, no green pill (owner lock) | direct contradiction, see Conflicts |
| empty-state vivid gradient icon + headline + subline + CTA | Solen's own locked EmptyState anatomy (icon + PROMISE headline + GESTURE subline + CTA) | validates Solen's existing lock, no change needed |
| "Alle anzeigen" as a violet TEXT link | Solen: see-all arrows stay ink, only text links get accent color | ports cleanly IF Solen's equivalent affordance is a text label; conflicts if Solen's spec calls for an arrow instead, see Conflicts |
| category pill selected = solid ink-black fill | Solen: selected = calm gray `bg-s-bg-sunken` fill (locked), ink-fill only for the named booking-services-step exception | conflicts on every screen except that one named exception, see Conflicts |
| category pill unselected = transparent + 10%-opacity inset border | Solen: unselected = white + hairline border | close match, easy port |
| search bar (search-results page): capsule radius 999, height 64 | Solen input radius 12 (locked) | neither Solen's 16px button radius nor its 12px input radius is a capsule, see Conflicts |

## Conflicts

CONFLICT [accent hue]: reference uses violet `#6950F3` as its one brand accent (links, avatar initials, status pills). Solen's locked accent is blue `#276EF1`. Owner call: keep Solen's own locked blue: taste rule 9 ("don't invent hex when not locked") and the design contract both name `#276EF1` explicitly, and no dated TASTE_LOG entry authorizes a violet accent.

CONFLICT [button radius]: reference's primary AND secondary book buttons are both true capsules (`radius: 999px`, radius = half the height at every width). Solen's LOCKFILE explicitly retired the capsule radius for buttons/chips on 2026-08-16 ("you're really elongating this pill... it looks like it has a sharp corner", owner verbatim) in favor of a fixed 16px corner at every width. Owner call: Fresha's whole button visual language rests on a shape the owner already rejected by name; a literal port would reopen a settled call.

CONFLICT [service-row button height]: reference's secondary "Buchen" button is 36px tall. Solen's own touch-target floor locks every interactive control to >=44px (`h-11`). Owner call: the 36px height cannot be ported as-is regardless of the radius decision.

CONFLICT [book-button unification]: the owner's literal ask was to match Solen's service-row Book button to its main Book button. On Fresha itself, the two are deliberately NOT the same: main = solid ink fill at 48px, service-row = white outline at 36px, only the radius family matches. Owner call: decide whether "match" means copying Fresha's two-tier fill-and-size hierarchy (and picking Solen's own radius/height rules over Fresha's), or literally unifying both buttons to one shared treatment, which is a stronger claim than anything Fresha itself does.

CONFLICT [status pill]: reference shows "Confirmed" as a solid violet pill and "Action required" as a solid amber pill, both with icon + white/black text. Solen's own dated lock for availability/status is plain ink text with NO pill ("owner call, do not re-add"). Owner call: this is a direct, named contradiction, not a gap; a literal port would reopen that lock.

CONFLICT [status color reuses the brand accent]: Fresha's "Confirmed" pill uses its own brand accent color (violet) for a semantic/status role. Solen's own taste rule 4 states semantic color must stay independent of the interactive-accent color specifically so this does not happen. Owner call: even if a status pill were approved, it should not borrow Solen's blue accent for the "confirmed" semantic meaning; Solen's own `#16A34A` success green is the more consistent choice.

CONFLICT [type budget]: the venue page alone renders 6 distinct font sizes and 4 distinct weights. Solen's own ceiling is <=4 sizes and <=2 weights per screen (NEVER-AGAIN floor 2, wired gate). Owner call: Fresha's structure cannot be ported 1:1 on typography; sizes must be collapsed to fit Solen's ceiling when the anatomy is adapted.

CONFLICT [selected-pill fill]: Fresha's venue-page service-category pill, when selected, is solid ink-black fill with white text. Solen's LOCKFILE locks every selected/active pill state to a calm gray fill (`bg-s-bg-sunken` + ink text), with exactly four named exceptions (the commit button, the booking date/slot, the avatar selected-check badge, and the booking-services-step category pills specifically). Owner call: this recipe is legal ONLY if it is being ported onto that one named exception; on any other pill (venue-page category tabs, search filters, etc.) it directly violates the `no-black-selected` gate.

CONFLICT [search-bar shape]: the collapsed search bar on Fresha's search-results page is a 64px-tall, radius-999 capsule. Solen's LOCKFILE input radius is 12px (a rounded rectangle, not a capsule), and its button radius is 16px; neither matches a full capsule. Owner call: if this bar is ported as a "search trigger" control it needs a radius decision (12 as an input, 16 as a button-like trigger, or a new named exception), since 999 fits neither existing token.

CONFLICT ["Geschlossen" colored status text]: Fresha renders the open/closed line as colored text (amber-brown for closed) with a matching icon. Solen's own dated lock for availability is plain ink text with no color and no pill. Owner call: do not port the color, keep Solen's own plain-ink treatment.

No conflict found on: card radius (16px matches exactly), card hairline treatment (near-identical hex and role), the two-tier button-hierarchy CONCEPT (size and fill differentiate primary from repeated actions, which is compatible with Solen's own single-ink-CTA rule once the capsule and height issues above are resolved), the empty-state anatomy (Fresha's vivid icon plus headline plus subline plus CTA validates Solen's own already-locked EmptyState spec), and the star-icon hue (both systems land near the same gold).
