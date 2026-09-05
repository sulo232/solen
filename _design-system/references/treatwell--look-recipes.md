<!-- exists-check: net-new vs airbnb--look-recipe.md, fresha--venue-page.md, fresha--profile.md, fresha--empty-states.md, airbnb--empty-states.md, airbnb--home-mobile.md, airbnb--profile-list.md, quizlet--login.md, because none of those capture Treatwell; this is the first Treatwell reference file in the repo. -->

# Treatwell, look-level recipes

## Identity

- Brand: Treatwell
- Platform: web, mobile viewport (390x844, deviceScaleFactor 3, Playwright Chromium, iPhone 13 emulation, locale de-CH)
- Domain reached: treatwell.ch (the /de/ path redirects to the bare domain and serves German content; the .de fallback was not needed)
- Pages captured live: home, search results (extras coiffeur in Kanton Basel-Stadt), one venue page (Miracle Hair Salon, Bottmingen)
- Pages NOT reachable live (login-gated, no test account, Prohibited-Actions rule bars creating one): booking confirmation, appointments list, profile/account, empty appointments
- Mobbin coverage checked for the login-gated pages: Treatwell is not indexed on Mobbin under iOS or web (three separate queries, "Treatwell app my appointments list screen", "Treatwell booking confirmed screen...", bare "Treatwell", all three returned zero Treatwell screens, only unrelated apps). So the login-gated recipes are listed under Not Reachable below, not invented.
- Capture date: 2026-09-05
- Method per value: every hex, px, and font value in this file was read with `getComputedStyle` and `getBoundingClientRect` inside the live page via Playwright, tier "measured", unless a line is explicitly marked tier "expect" (there are none in this file, since the login-gated pages could not be reached at all rather than reached through a still)
- Screenshots: the raw captures live in this run's scratch directory (see the closing note), not committed to the repo

## Philosophy (what the look is doing, from the numbers)

Treatwell reads as a text-forward, low-ornament catalogue rather than a photo-forward lifestyle app: cards on the search grid carry only a 1px hairline border (`#E6E8ED`) and a 4px radius, no shadow, so the layout leans on borders and whitespace, not elevation. Colour is used sparingly and functionally: navy ink (`#071948`) carries every heading and price, a muted slate (`#36456B`) carries every secondary line (meta, location, duration), and the three "loud" colours (amber star `#FFCB4D`, coral outline button `#FF6668`, teal verified-badge `#098E9D`) each own exactly one job and never bleed into body text. The one blue in the whole system (`#1859F1`) is reserved for the single primary search CTA, not for links, which pushes against Solen's own "blue is a small link accent" rule (see Conflicts). Type is doing the hierarchy work that colour is not: a single 64px, tight-tracked number (the aggregate rating) is the loudest thing on the venue page, while the rest of the ladder stays inside 11 to 20px, so weight and size, not colour, mark the one loud moment per screen. The overall impression is a spreadsheet-calm catalogue that trusts borders, one accent colour per role, and a single oversized number, rather than photography, to feel premium.

## Measured

### Pill / chip (filter row, search results)

- Text: "Sortieren nach" / "Beliebiger Preis" / "Salons"
- Background: `#FFFFFF`
- Text colour: `#071948`
- Border: `1px solid #B5BAC8`
- Radius: `9999px` (true pill)
- Height: `42px`
- Padding: `8px 12px`
- Font: `14px / 400`, letter-spacing normal
- Box-shadow: none
- Contrast (text on white): 16.9:1 (ink `#071948`), passes AA/AAA easily

### Category nav (home header, "COIFFEUR / NÄGEL / HAARENTFERNUNG / KOSMETIK")

- Not a pill, bare uppercase text on white, no fill, no border
- Font: `11px / 400`, `letter-spacing: 1px`, `text-transform: uppercase`
- Colour: `#36456B` (slate, not ink)
- Row height (hit area): `32px`

### Badge (verified review badge, venue page)

- Text: "Verifizierte Bewertung"
- Text colour: `#071948`, font `14px / 700`
- Icon (checkmark) colour: `#098E9D` (teal), separate from the text colour
- No fill, no border, sits inline next to the reviewer name row

### Primary button (home search CTA, "Auf Treatwell finden")

- Background: `#1859F1` (blue, not ink)
- Text colour: `#FFFFFF`
- Radius: `4px`
- Height: `48px`
- Padding: `12px`
- Font: `14px / 400` (not bold)
- Box-shadow: none
- Contrast (white on `#1859F1`): 5.6:1, passes AA for normal text

### Secondary / per-row button (service row "Auswählen")

- Style: outline, not filled
- Border: `2px solid #FF6668` (coral), radius `4px`
- Background: `#FFFFFF`
- Text colour: `#FF6668`
- Height: `32px`, padding `4px 12px`
- Font: `14px / 400`
- Contrast (coral text on white): 2.9:1, fails WCAG AA for text (this is a real Treatwell floor-violation on their own site, not a Solen number; noted for the record, not for import)

### Type ladder (sizes and weights actually used, across all three pages)

| size | weight | letter-spacing | used for |
|---|---|---|---|
| 64px | 700 | -4.5px | venue aggregate-rating number (the one big anchor) |
| 20px | 700 | normal | venue name (h1), home section title ("Angesagt auf Socials") |
| 18px | 700 | normal | venue sub-section title ("Beliebte Services") |
| 16px | 400 | normal | body: review count, address/location, service duration, "Details anzeigen", opening-hours rows |
| 14px | 400 / 700 | normal | filter pills, breadcrumb, reviewer name (400); verified badge text (700) |
| 11px | 400 | 1px | category nav eyebrow (uppercase) |

Six distinct sizes and two weights (400/700) across the whole site. This is wider than Solen's own <=4-size ceiling; the port map below narrows it to Solen's ladder rather than importing all six.

### Spacing

- Page horizontal margin: `16px` (cards, section titles) to `24px` (the home search form sits in a card inset from `x:40`, i.e. 24px inside the 16px page margin)
- Hero-to-next-section gap (home, search form bottom to "Angesagt auf Socials" title): `265px` (this includes the full-bleed orange hero band, not a bare whitespace gap)
- Filter-pill row: pills sit edge to edge with roughly `16px` horizontal gaps (x:16, 178, 312 for three pills approx 127-145px wide)
- Search-results card stack: cards are full-bleed minus the 16-17px page margin on each side (measured card width 356-358px in a 390px viewport)

### Card (search-result venue card)

- Border: `1px solid #E6E8ED`
- Radius: `4px`
- Box-shadow: none (flat, border-only elevation)
- Background: `#FFFFFF`
- Photo aspect ratio: `1.5:1` (measured 356x237, landscape, full card width, flush top corners)
- Photo has a carousel with dot indicators (multiple images per venue)
- Anatomy inside the card, top to bottom: photo carousel -> venue name (20px/700, ink) -> rating row (star + "4.9" amber, 16px/700 + review count "1644 Bewertungen" 16px/400 slate) -> location line (16px/400 slate) -> "Auf Karte anzeigen" map link (16px/700, ink, NOT blue)

### Colour provenance (every non-grey colour, and its one job)

| hex | rgb | used for |
|---|---|---|
| `#1859F1` | 24,89,241 | the ONE primary CTA fill (home search button) |
| `#FFCB4D` | 255,203,77 | star icon + rating number, everywhere ratings appear |
| `#FF6668` | 255,102,104 | per-service outline "Auswählen" button only |
| `#098E9D` | 9,142,157 | verified-review checkmark icon only |
| `#071948` | 7,25,72 | ink: headings, prices, names, primary body text |
| `#36456B` | 54,69,107 | slate: secondary/meta text (location, duration, nav eyebrow) |
| `#1A253D` | 26,37,61 | reviewer name text (a third, slightly different near-ink) |
| `#838CA3` | 131,140,163 | disabled/closed state text (e.g. "Montag Geschlossen") |
| `#E6E8ED` | 230,232,237 | card hairline border |
| `#B5BAC8` | 181,186,200 | filter-pill border |
| `#59637A` | 89,99,122 | home search-input border |

Green and orange/navy dots also appear (opening-hours day dots: green for open days, grey for closed) but were not resolved to an exact hex within budget; the open/closed distinction is carried by TEXT colour (`#071948` open vs `#838CA3` closed) more than by the dot, which is the load-bearing signal.

### Status / confirmation treatment

NOT REACHABLE live or via Mobbin (see Identity). The only confirmation-adjacent thing measured live is the verified-review badge (green-teal check, see Badge above) and the salon "Top Rated" award roundels (navy circle, white text, gold star glyph for the star years) seen at the foot of the venue page under "Salon Awards". No booking-confirmation screen, appointment status pill, or "your appointment is confirmed" treatment was captured; do not assume Treatwell's confirmation screen looks like any competitor's without a real capture.

### Empty state

NOT REACHABLE (same reason). No empty-appointments or empty-search state was seen on any of the three pages captured (the Basel coiffeur search returned a populated result).

## Port map (Treatwell value -> Solen equivalent)

| Treatwell | value | Solen equivalent | note |
|---|---|---|---|
| Primary CTA fill | `#1859F1` blue | `bg-s-ink #0A0A0A` | do NOT port; Solen's locked contract keeps the one commit button ink, not blue (see Conflicts) |
| Ink / heading text | `#071948` | `s-ink #0A0A0A` | same JOB (primary text), different literal value; keep Solen's own ink, this is a philosophy match not a hex match |
| Slate / secondary text | `#36456B` | `s-ink-2 #6B6B6B` | same job (meta/secondary), Solen's token is cooler/lighter; keep Solen's token |
| Card border | `#E6E8ED` | `border-s-border #E4E4E7` | near-identical hex and identical job (hairline card boundary), portable as-is |
| Filter-pill border | `#B5BAC8` | n/a, Solen's filter pill has no border in the selected state and a hairline in the unselected state | Solen's filter pills are `bg-s-bg-sunken` fill when selected per LOCKFILE, not an outlined pill; do not port TW's outline-pill treatment |
| Card radius | `4px` | Solen individual-entity-card radius `16px` | do NOT port; Solen's radius is locked far larger (see Conflicts) |
| Pill/button radius | `9999px` full pill | Solen button/chip radius `16px` (a chosen corner, not a capsule) | do NOT port; Solen explicitly rejected the full-capsule shape (LOCKFILE, 2026-08-16 "elongating this pill" rejection) |
| Star colour | `#FFCB4D` | `star #FFC32B` | close but not identical; keep Solen's own locked star hex, do not overwrite with TW's shade |
| Verified/teal badge | `#098E9D` | `success #16A34A` | different hue family entirely (teal vs green); Solen's success token stays green per LOCKFILE, do not import teal |
| Coral outline button | `#FF6668` | `error #DC2626` or `heart #FF3366` | closest role match is neither exactly; this is a UNIQUE role (a low-emphasis secondary CTA) Solen does not have a named token for, flag as a gap rather than force-mapping it |
| Big rating number | `64px/700`, letter-spacing `-4.5px` | Solen display anchor `>=28px` floor (FLOORS LAW 6) | the RATIO (anchor far larger than body) is the portable idea, not the literal 64px; Solen's anchor floor is 28px minimum, and Solen's own emphasis-budget ceiling (<=30% of text at weight >=600) should still gate how loud this gets |
| Type ladder (6 sizes, 2 weights) | 64/20/18/16/14/11 | Solen ceiling: <=4 distinct sizes, <=2 weights per screen | do NOT port the full 6-size ladder to any one Solen screen; pick at most 4 of these per screen to stay inside the locked ceiling |
| Section title | `18-20px/700` | Solen section-H2 `clamp(18px,2vw,20)` | near-exact match, portable as-is |
| Card photo aspect | `1.5:1` landscape | Solen SalonCard photo, no single locked ratio found in this pass | portable as a reference ratio for a landscape card variant; Solen's existing SalonCard grammar should be checked before adopting |
| Fonts | `TreatwellSansWeb, Verdana, Geneva, Arial, Helvetica, sans-serif` | Inter Tight (display) + Inter (body) | do NOT port; Solen's font lock (taste rule 8) stays Inter Tight/Inter, never a third-party proprietary face |

## Conflicts

- CONFLICT [CTA colour]: reference says the one primary commit button ("Auf Treatwell finden") is filled blue `#1859F1`. Solen lock says the one commit button stays ink `#0A0A0A` (taste rule 3, LOCKFILE design contract). Owner call: keep Solen's ink CTA; this is a locked axis, not open for a single reference to move.
- CONFLICT [card radius]: reference cards use a near-square `4px` radius with a flat hairline border. Solen's individual-entity-card radius is locked at `16px` (LOCKFILE radius row). Owner call: keep Solen's 16px; the 4px is noted as Treatwell's own choice, not a value to import.
- CONFLICT [pill shape]: reference filter pills are a true capsule (`radius:9999px`) with a visible `1px` border in every state. Solen's button/chip radius is locked at `16px` specifically BECAUSE a true capsule was rejected on 2026-08-16 (owner: "you're really elongating this pill, so it looks like it has a sharp corner"). Owner call: keep Solen's 16px chosen-corner pill; do not reintroduce the capsule shape from this reference.
- CONFLICT [link colour]: reference's "Details anzeigen" and "Auf Karte anzeigen" links render in bold ink (`#071948`, weight 700), never in blue, even though the site does have a blue in its palette. Solen's rule reserves blue `#276EF1` for exactly this kind of small clickable text (taste rule 3). Owner call: this is a difference in philosophy, not a bug on either side; Solen's blue-link rule stays as locked, Treatwell's bold-ink-link approach is not grounds to change it without an explicit owner decision.
- CONFLICT [verified/teal hue]: reference uses a teal (`#098E9D`) for its verified-badge icon, a hue Solen's semantic palette does not have a slot for (Solen's success is green `#16A34A`, no teal token exists). Owner call: no action needed unless a "verified" concept is added to Solen; if it is, decide then whether it reuses green or introduces teal.
- CONFLICT [secondary-button contrast]: reference's own coral outline button (`#FF6668` text on white) measures 2.9:1 contrast, failing WCAG AA text (4.5:1 floor). This is Treatwell's own accessibility gap, not something to import; Solen's statutory-floor tier (precedence chain tier 2, WCAG AA) already forbids reproducing this regardless of how the reference looks.
- CONFLICT [type ladder width]: reference uses 6 distinct text sizes across the pages captured (64/20/18/16/14/11px). Solen's floor caps any one screen at <=4 sizes and <=2 weights (NEVER-AGAIN floor 2, FLOORS LAW 7). Owner call: none of Treatwell's sizes need porting 1:1; if this reference informs a Solen screen, select at most 4 of the six sizes for that screen.

---

Raw screenshots and computed-style JSON dumps for this capture live in the run's scratch directory (`refs/treatwell/`, filenames `01-home-*`, `02-location-suggest.png`, `02-treatment-suggest.png`, `03-search-results-*`, `04-venue-*`, `data-*.json`), not committed to the repo; re-run the capture if a future session needs the raw assets rather than the distilled numbers above.
