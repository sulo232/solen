# solen.ch — Visual Audit (Supplement)

Everything NOT covered in the existing audit (category strip, discover section, TikTok cards, spec gaps for those).
Covers: navigation, hero, search bar, trust badges, partner CTA, footer, subpages, legal pages, global patterns.

---

## 01 — Category Strip

### Problem 1 — Two separate category UIs stacked on top of each other
**Status:** Current — Wrong
There's a horizontal icon strip (Coiffeur/Barber/Nails/Spa) AND a "Was suchst du?" section below the hero — both doing the same job. Nobody needs to see categories twice. The strip sits above the hero content but the section is below it, creating redundancy and eating vertical space on an already information-dense mobile page.
**Fix:** One category UI only. On mobile the icon strip below the search bar is the canonical entry point. Delete the "Was suchst du?" section from the homepage entirely. The icon strip handles it.

### Problem 2 — Strip doesn't collapse or change when you scroll — it's static
**Status:** Current — Wrong
Airbnb's category strip starts with large icon + label tabs. When you scroll down past the hero, the strip collapses into a smaller, pill-shaped chip row that's more compact. The icon disappears, the label becomes a pill chip. This saves ~30px of vertical space during browsing and feels native and smart. Your strip does nothing — it stays the same size forever regardless of scroll position.
**Fix:** On scroll, when the user has scrolled more than ~100px, the strip transitions from icon+label tabs to text-only pill chips.

### Problem 3 — No filter button next to the strip
**Status:** Current — Incomplete
Airbnb has a small filter icon (sliders) at the right end of the category strip. Fresha has it too. This is where additional filters live — price range, rating, availability, distance. You don't have filters yet but the button should exist from day one so users know filtering is possible.
**Fix:** A 32×32px circle icon button with a filter/sliders icon at the right end of the strip, separated by a faint divider. Shows a filter sheet when tapped. Can be disabled/grayed out until filters are built.

### Problem 4 — Spa icon still wrong color
**Status:** Current — Incomplete
Coiffeur, Barber, Nails are all coral. Spa is grey/transparent. One wrong icon breaks the visual coherence of the entire row. At a glance it looks like Spa is disabled or sold out.
**Fix:** Every icon gets `stroke="#FF6B6B"` and `stroke-width="1.5"`, same size. Use the Lucide Droplets icon. One line of code.

#### Category strip spec table — two states:
- **Trigger:** Expanded = default, scrollY less than 80px. Collapsed = scrollY 80px or more.
- **Height:** Expanded = 64px. Collapsed = 44px.
- **Tab style:** Expanded = icon 22px + label 11px Syne. Collapsed = text-only pill chip, 10px Syne 700.
- **Active state:** Expanded = 2px ink underline on tab. Collapsed = ink fill + white text on chip.
- **Transition:** height 200ms ease on the container. Icon fades out with opacity 150ms separately.
- **Filter button:** Not shown when expanded. 32px circle at right end separated by divider when collapsed.
- **Background:** `rgba(255,255,255,0.94)` + `backdrop-filter blur(16px)` in both states.
- **Position:** `position sticky`, `top 60px`, `z-index 100` in both states.
- **Scroll inside strip:** `overflow-x auto`, `scrollbar-width none` in both states.

---

## 02 — Discover Section

### Problem 1 — "ENTDECKEN" eyebrow + "FINDE DEINE INSPIRATION" title + "Katalog öffnen →" button — three layers doing one job
**Status:** Current — Wrong
You have a small "ENTDECKEN" eyebrow label, then a massive "FINDE DEINE INSPIRATION" headline, then a full-width "Katalog öffnen →" button. That's three elements to communicate one thing: tap here to see inspiration content. It's cluttered and it repeats itself. The eyebrow and the headline are both saying "this is the discovery section" — one of them needs to go.
**Fix:** Pick one. Either big "ENTDECKEN" headline in Bebas Neue 48px + button below. Or "FINDE DEINE INSPIRATION" headline + button below. Not both. The eyebrow "ENTDECKEN" is redundant when the headline says the same thing in different words.

### Problem 2 — The button + the scroll row below it create conflicting CTAs
**Status:** High Priority
There's a "Katalog öffnen →" button AND then immediately below it the TikTok card row. The button says "go somewhere else" while the cards say "scroll here." Users don't know if they should tap the button or swipe the cards. These are competing actions for the same piece of content.
**Fix:** The cards ARE the discover content — they're not a preview of a catalogue somewhere else. Remove the button and let the cards be the entry point with a small "Alle ansehen →" link after the row. The section now has one job and one action.

#### Current state (wrong):
- "ENTDECKEN" eyebrow label
- "FINDE DEINE INSPIRATION" headline
- "Katalog öffnen →" full-width button
- TikTok cards row below the button
- Result: 4 UI elements, 2 conflicting CTAs, confused user

#### Fixed state (correct):
- "ENTDECKEN" in Bebas Neue 48px — one clear headline
- TikTok cards row immediately below — the content IS the preview
- "Alle ansehen →" small link right-aligned after the row
- No button competing with the cards
- Result: one clear job, one clear action

---

## 03 — TikTok Cards

**Keep — Thumbnail preview cards with photo + overlay is the correct pattern**
The card showing an actual photo from the TikTok video with a gradient overlay and label at the bottom is exactly right. This is how Pinterest, Instagram, and TikTok itself handles content previews. The photo is the content — it doesn't need to be a playing video to work. Keep the static thumbnail with a play button overlay.

### Problem 1 — Labels still showing truncated TikTok video titles
**Status:** Current — Wrong
"Voluminous L..." and "Voluminous B..." — both start with the same word and cut off before saying anything useful. The label is supposed to make the card feel curated. A truncated algorithmic video title makes it feel like a scraped database. It destroys the editorial discovery feeling that makes this section valuable.
**Fix:** Add a `custom_label` column to whatever table stores these videos. Write your own 2-word labels for each: "Beach Waves," "Lash Lift," "Curtain Bangs," "Sleek Blowout," "French Tips," "Hot Stone." Never show the raw TikTok title. This takes 10 minutes to add to the DB and 10 minutes to populate manually.

### Problem 2 — Card ratio is too tall, only 1.5 visible at once
**Status:** High Priority
The TikTok cards are very tall portrait rectangles. On mobile only 1.5 cards are visible at a time, meaning users don't immediately see there are more to scroll to. The partial card peek is too small to signal "swipe right." Fresha uses a shorter portrait ratio roughly 3:4 that shows 2.3 cards at once — you understand it scrolls immediately.
**Fix:** Card width 140px. Card height 186px (roughly 3:4 ratio). This shows 2.3 cards on a 390px wide mobile screen — enough to clearly signal horizontal scrollability. Add a right-edge fade gradient using `linear-gradient(to left, var(--wash), transparent)` on a pseudo-element on the parent to reinforce the scroll affordance.

### Problem 3 — No "Book this style" connection to booking flow
**Status:** High Priority
The whole point of the Discover section is: user sees a style they like → books a salon that can do it. Right now tapping a card goes to a video detail page but there's no connection back to salons. A user who loves "Beach Waves" should be able to tap and immediately see salons in Basel that offer that style, pre-filtered.
**Fix:** Each card stores a `linked_category` and optionally a `linked_service` column in Supabase. Below the card image, outside the gradient overlay, in a small white strip at the card bottom, render "In Basel buchen →" in coral, Syne 9px 700. Tapping navigates to `/de/suchen?kategorie=[linked_category]&service=[linked_service]&stadt=basel`, pre-filling the search with that card's category so the user lands directly on relevant salon results.

#### TikTok card full spec:
- **Card width:** 140px — shows 2.3 cards on a 390px screen
- **Card height:** 186px — 3:4 ratio
- **Border radius:** 12px
- **Image:** TikTok oEmbed thumbnail URL, object-fit cover
- **Overlay:** `linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%)`
- **Label:** Custom editorial label, 2 words max. Syne 11px 800 weight. White. Bottom-left of image.
- **Sub-label:** Category name (Hair / Beauty / Nails). DM Sans 10px. White at 60% opacity.
- **TikTok badge:** Top-left corner. "▶ TikTok" in a dark semi-transparent pill. 8px Syne 700.
- **Save button:** Top-right corner. Heart icon in a frosted circle. Taps toggle saved state.
- **Booking CTA:** Below the image, outside the overlay. "In Basel buchen →" coral, 9px Syne 700. Tapping pre-fills search with the card's linked category and service.
- **Right-edge fade:** Parent container gets an `::after` pseudo-element with width 48px, background `linear-gradient(to left, var(--wash), transparent)`, pointer-events none.
- **Scroll:** `overflow-x auto`, `scroll-snap-type x mandatory` on container. `scroll-snap-align start` on each card.

---

## 04 — Why the previous spec caused these problems

### Spec gap 1 — The category strip collapse was never specified
The previous search spec mentioned the category strip in passing but never specified the scroll-triggered collapse behavior. The spec said "sticky tab strip below the search bar" but gave no instruction about what happens when the user scrolls down. So devs kept it static — which is the obvious default when nothing else is specified. The collapse behavior is the whole UX value of the Airbnb pattern and it was never written down.
**What to tell devs:** use a `useScrollY` hook. When scrollY is greater than 80, add the class `.collapsed` to the strip. In CSS, `.collapsed .cat-tab` hides the icon with `opacity 0, height 0, overflow hidden`, and transforms the tab into a pill chip. Use `transition all 200ms ease` on the container height and the icon opacity separately.

### Spec gap 2 — The Discover section was never told what to delete
The previous audits said "the button looks disabled, fix it" and "labels are truncated, fix them" but never said "delete the eyebrow, delete the button, ONE headline only." So devs kept the eyebrow and the headline because both were in the existing code and neither spec said to remove them. Specs need to say what to delete as clearly as what to add.
**What to tell devs:** in the Discover section component, DELETE the eyebrow "ENTDECKEN" text element. DELETE the "Katalog öffnen →" button. The section now has exactly two things: a title row with "ENTDECKEN" left-aligned and "Alle →" right-aligned on the same flex row, then the TikTok card row directly below. Nothing else. Three lines of JSX deleted, zero added.

---

## 05 — Top Navigation Bar

### Problem 1 — Logo swap between homepage and subpages
**Status:** Current — Inconsistent
Homepage renders the full `logo.svg` wordmark. Category pages (e.g. `/de/coiffeur`) show "so.len" as plain text with a pipe separator and category name ("so.len | Coiffeur"). The Discover page shows "so.len" text with "solen discover" subtitle. The Partner page shows the full `logo.svg` again. Three different logo treatments across four page types. This destroys brand consistency — users don't know if they're on the same site.
**Fix:** One logo treatment everywhere. The `logo.svg` wordmark renders in the top-left on every page, always links to `/de`. No text substitutions, no pipe separators, no subtitles. The page title belongs in the page content area, not the nav.

### Problem 2 — Category strip in nav doubles as page navigation and global navigation
**Status:** Current — Confusing
The horizontal strip (Entdecken / Coiffeur / Barbershop / Nägel / Spa / Makeup / Waxing / Angebote) lives in the top nav bar on every page. On the homepage it acts as category shortcuts. On category pages it acts as tab switching between categories. On the Discover page it's still there but you're in a different context entirely. On the Partner page — a B2B page — it's still showing consumer categories. The strip doesn't know what job it's doing.
**Fix:** The category strip is a homepage-only element (sticky below search bar, as your existing audit specifies). On category listing pages, the active category is shown as a breadcrumb ("Startseite > Coiffeur") — already partially there on `/de/coiffeur`. On non-category pages (Discover, Partner, Compare, legal pages), the strip is DELETE — it doesn't belong. The nav bar on those pages is just: logo left, language toggle right, back arrow on mobile.

### Problem 3 — "Alle Städte" dropdown exists but does nothing useful
**Status:** Current — Placeholder
There's an "Alle Städte" element in the nav. The site currently only has content in Basel. Zürich and Bern links exist in the footer but lead to empty pages. Having a city selector that shows one real option and two dead links is worse than not having one at all — it signals that the product is hollow.
**Fix:** DELETE "Alle Städte" from the nav until at least two cities have live salon listings. When cities are real, it becomes a proper dropdown: city name left-aligned, salon count right-aligned in muted text, a checkmark on the active city. But not now.

### Problem 4 — No language toggle in the main nav
**Status:** Current — Buried
The footer has DE / EN / FR / IT links. But language switching is a global action that should live in the nav, not buried at the bottom. A French-speaking user in Basel who lands on the German homepage has no visible way to switch until they scroll to the absolute bottom of the page.
**Fix:** A small "DE" text pill in the nav, right side, before the profile icon. Tapping opens a bottom sheet with language options. DM Sans 12px 500 weight. Pill background transparent, border `1px #E0E0E0`, border-radius 999px, padding 4px 10px.

---

## 06 — Hero Section

### Problem 1 — "BEAUTY. BUCHEN." headline is two words that say nothing
**Status:** Current — Weak
"BEAUTY. BUCHEN." in Bebas Neue is visually strong but semantically empty. It's a statement, not a value proposition. Airbnb's hero says what you can DO: search a location and book. Fresha's hero says what you GET: "Book your next beauty appointment." Yours says two nouns. A new user who doesn't know solen.ch still doesn't know what it does after reading this.
**Fix:** Change to "BEAUTY & WELLNESS BUCHEN" or "DEIN NÄCHSTER TERMIN" — something that communicates the action. The subtitle "Coiffeur, Barber, Nails & Spa — buche jetzt in Basel" does the explaining, but the hero headline should pull its weight too.

### Problem 2 — Subtitle mixes categories with a CTA awkwardly
**Status:** Current — Minor
"Coiffeur, Barber, Nails & Spa — buche jetzt in Basel." The em dash connecting a category list with a CTA phrase reads like two different sentences got jammed together. "buche jetzt" is a call to action but it's buried in a subtitle.
**Fix:** Split them. Subtitle line 1: "Coiffeur, Barber, Nails & Spa in deiner Nähe." Subtitle line 2 or as part of the search bar: the CTA energy lives in the search interaction itself, not in subtitle text.

### Problem 3 — No hero image or visual context
**Status:** Current — Missing
The hero section is text-only. No salon photo, no illustration, no lifestyle image. Every successful booking platform uses a visual in the hero — Airbnb has a destination photo, Fresha has a salon interior photo, Treatwell has styled model photos. A text-only hero on a beauty platform feels like a landing page for a SaaS tool, not a consumer marketplace.
**Fix:** Background image behind the hero text. A warm, professional salon interior photo or a close-up of hands doing hair/nails work. Use a gradient overlay (`linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.5))`) to keep text legible. Image is `object-fit cover`, fills the hero container. This single change will make the page feel 10x more premium and alive.

#### Hero image spec:
- **Container:** full width, height 420px mobile / 520px desktop
- **Image:** `object-fit cover`, position center
- **Overlay:** `linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.55) 100%)`
- **Text color:** white (`#FFFFFF`) on top of the overlay
- **Fallback:** if no image loaded, `background-color #2A2A2A`

---

## 07 — Search Bar (Homepage)

### Problem 1 — Search fields look like a table, not a unified search bar
**Status:** Current — Wrong
The "Was" / "Wo" / "Wann" fields are stacked or separated in a way that feels like three independent form inputs, not one cohesive search bar. Airbnb's search bar is one unified pill — you tap into it, the whole thing expands, and you fill fields sequentially. Fresha has a single input that opens a guided flow. Yours feels like filling out a contact form.
**Fix:** One unified search bar container. White background, border-radius 999px (full pill), height 56px, border `1px #E0E0E0`. Inside: three sections separated by 1px vertical dividers (height 24px, color `#E5E5E5`). Each section shows placeholder text in DM Sans 14px `#999`. Tapping any section opens the guided search bottom sheet (as defined in your existing search spec). The bar itself is the trigger, not a form.

#### Search bar spec:
- **Container:** width 100% (max 480px), height 56px, border-radius 999px, background `#FFFFFF`, border `1px #E0E0E0`
- **Sections:** 3, separated by vertical 1px `#E5E5E5` dividers at 24px height, vertically centered
- **Section labels:** DM Sans 10px 700 `#999`, uppercase. "WAS" / "WO" / "WANN"
- **Section values:** DM Sans 14px 400 `#333`. Placeholder text: "Coiffeur, Nails…" / "Basel" / "Flexibel"
- **Tap behavior:** opens full-screen search bottom sheet
- **Shadow:** none at rest. On focus/tap: `box-shadow 0 4px 16px rgba(0,0,0,0.08)`
- **Search icon:** 20px Lucide Search icon in a 40px coral (`#FF6B6B`) circle at the right end of the bar

### Problem 2 — "Flexibel" as the date default communicates nothing
**Status:** Current — Minor
The date field shows "Flexibel" as its default. This is fine conceptually (user doesn't have a specific date) but visually it looks like the field is broken or hasn't loaded. Every other booking platform shows "Datum wählen" or "Heute" as the default because those communicate what the field IS.
**Fix:** Default text: "Heute" with a small calendar icon. When tapped, the date picker opens with "Flexibel" as an explicit option alongside specific dates.

---

## 08 — Trust Badges Row

### Problem 1 — Trust badges appear twice on the homepage
**Status:** Current — Redundant
"Kostenlose Stornierung bis 24h · Sichere Zahlung — Stripe verschlüsselt · Swiss Made — Entwickelt in Basel · TWINT · Kreditkarte · Bar" appears below the search bar AND again in the footer area. The same trust messaging shown twice on one page dilutes its impact and makes the page feel like it's padding itself.
**Fix:** Trust badges appear ONCE, below the search bar, as a single-line horizontal scroll of pills. DELETE the second instance near the footer.

### Problem 2 — Trust badges mix different types of information
**Status:** Current — Messy
"Kostenlose Stornierung" is a policy. "Stripe verschlüsselt" is a security feature. "Swiss Made" is a brand claim. "TWINT · Kreditkarte · Bar" is a payment methods list. These are four different categories of information rendered in one flat row with no visual hierarchy. The user's eye can't parse what's important.
**Fix:** Two groups, visually separated. Group 1 (trust): "Kostenlose Stornierung" / "Sichere Zahlung" / "Swiss Made" — these are pill chips with a small icon left-aligned. Group 2 (payment): TWINT, Visa, Mastercard, Apple Pay logos in a row — no text, just small 24px-height logos. Group 1 sits below the search bar. Group 2 sits only in the footer.

#### Trust badge spec:
- **Container:** single-line horizontal scroll, gap 8px, padding 0 16px
- **Pill:** background `#F5F0EB` (warm beige), border-radius 999px, padding 6px 12px
- **Icon:** 14px Lucide icon, stroke `#FF6B6B`, left of text
- **Text:** DM Sans 11px 500 `#5A5A5A`
- **Icons to use:** ShieldCheck for "Sichere Zahlung", Clock for "Kostenlose Stornierung", MapPin for "Swiss Made"
- **Overflow:** `overflow-x auto`, `scrollbar-width none`, `-webkit-overflow-scrolling touch`

---

## 09 — "Für Salons" Partner CTA Section (Homepage)

### Problem 1 — Commission rate conflict between homepage and partner page
**Status:** Current — CRITICAL
The homepage says "0% für Stammkunden. 15% auf Neubuchungen. Nie mehr." The partner page says "1% pro erfolgreiche Buchung" with a comparison chart showing solen.ch at 1% vs. Treatwell at ~30%. These are two completely different pricing models on the same site. A salon owner who reads both pages will think you're lying. This is not a visual bug — it's a trust-destroying content inconsistency.
**Fix:** Pick ONE pricing model and make it consistent everywhere. If it's 15% new / 0% returning (which is what your AGB drafts specify), then the partner page needs to be rewritten. If it's 1%, then the homepage needs to be rewritten. Both cannot coexist.

### Problem 2 — The section has no visual break from the content above
**Status:** Current — Blends in
The "Für Salons" section sits directly below the Discover section with no visual separation. It's a B2B pitch inside a B2C consumer page. On Airbnb, the "Become a Host" CTA is a completely distinct section with a different background color, a large photo, and clear visual separation. Yours blends into the page like just another content block.
**Fix:** Full-width background color change. Use a warm off-white (`#FAF7F4`) or a very light coral tint (`#FFF5F3`) background for the entire section. Add 48px padding top and bottom. A thin `1px` divider (`#E5E5E5`) at the top. The section title "Für Salons" gets an eyebrow label in DM Sans 10px 700 uppercase coral (`#FF6B6B`), then the headline below.

### Problem 3 — Bullet list is generic and uncompelling
**Status:** Current — Weak copy
"Keine monatlichen Gebühren / Live in 24 Stunden / Tausende Kunden in Basel" — "Tausende Kunden" is a claim you can't back up with zero salons and zero transactions. This is a lie and an informed salon owner will smell it immediately.
**Fix:** Replace with honest, specific value props: "Keine monatlichen Gebühren" (keep — this is true), "In 5 Minuten online" (more specific than "24 Stunden"), "0% Provision auf Stammkunden" (your actual differentiator). DELETE "Tausende Kunden in Basel" until you have traffic data to back it up.

---

## 10 — Footer

### Problem 1 — Footer is massive and repeats the entire site navigation
**Status:** Current — Too heavy
The footer has: Kategorien (6 links), Städte (3 links), Unternehmen (5 links), Für Salons (3 links), Sozial (1 link), Language toggle (4 options), trust badges (repeated), and legal text. That's ~22 links plus trust content in the footer of what is essentially a single-city pre-launch marketplace. The footer is bigger than most of the page sections.
**Fix:** Slim footer. Two rows max.
- **Row 1:** Logo left. Links: Impressum · AGB · Datenschutz · Hilfe. Language toggle right.
- **Row 2:** "© 2026 solen.ch" left. Social icon(s) right.
- **DELETE** category links (they're in the strip), DELETE city links (cities aren't live), DELETE "Für Salons" links (they have a dedicated `/partner` page), DELETE repeated trust badges.

### Problem 2 — "Von Basel, für die Schweiz" conflicts with previous "Von Basel, für Basel" and current city expansion status
**Status:** Current — Confusing
The footer says "Von Basel, für die Schweiz." But the homepage hero says "buche jetzt in Basel." The Zürich and Bern pages are empty. You're claiming Swiss-wide while every other element of the page says Basel-only. Pick one and commit until the other is real.
**Fix:** "Aus Basel. Für dich." — neutral, doesn't overclaim geography. Swap to "Die Schweizer Salon-Plattform" only when at least 3 cities have live listings.

### Problem 3 — Instagram is the only social link
**Status:** Current — Fine for now but spec the empty state
One social icon is fine at launch. But the "Sozial" section header with just one link looks sparse.
**Fix:** No section header. Just the Instagram icon (20px) in the footer row 2, right side. When you add TikTok later, it goes next to it.

---

## 11 — Category Listing Pages (/de/coiffeur, /de/barbershop, etc.)

### Problem 1 — Filter pills are not horizontally scrollable
**Status:** Current — Wrong
On `/de/coiffeur` the neighborhood pills (Grossbasel / Kleinbasel / Gundeli / St. Johann / Iselin / Bruderholz / Breite) wrap to multiple lines on narrow screens. Below that, additional filter pills (Preis / Heute / Morgen / date picker / 4+ / 4.5+ / Online-Zahlung / Nebenzeiten) also wrap. That's 2-3 rows of pills eating massive vertical space before any salon results appear.
**Fix:** One single-line horizontally scrollable row per filter group. Group 1: neighborhoods. Group 2: all other filters. Each row: `overflow-x auto`, `scrollbar-width none`, gap 8px, padding 0 16px. Right-edge fade gradient (48px wide, `linear-gradient` to left from page background to transparent) as scroll affordance.

### Problem 2 — Date picker shows "mm/dd/yyyy" — wrong locale
**Status:** Current — Bug
The date input placeholder shows "mm/dd/yyyy" which is the US date format. Switzerland uses dd.mm.yyyy. This is a small but glaring localization failure that makes the product feel unfinished. Salon owners especially will notice this.
**Fix:** Set the date input to locale "de-CH". Placeholder should be "TT.MM.JJJJ" or better: replace the native date input entirely with a custom date picker bottom sheet that shows a calendar grid (Mon-Sun header, Swiss week starts Monday).

### Problem 3 — "Nur bei Solen" and "Karte" buttons float at the bottom with no context
**Status:** Current — Orphaned
At the bottom of `/de/coiffeur` there's "Nur bei Solen" and "Karte" buttons. "Nur bei Solen" is a filter but it's not with the other filters — it's at the bottom of the page. "Karte" toggles a map view but the map is broken (missing lat/lng as you know). Two orphaned buttons at the bottom of an otherwise empty listing page.
**Fix:** "Nur bei Solen" moves into the filter pill row with the other filters. "Karte" becomes a floating action button (FAB) — 48px circle, bottom-right, 16px from edge, z-index 200, coral background, white map icon. Shows on scroll after first salon card is visible. Hidden when map is broken/no data. This is the Airbnb pattern.

### Problem 4 — No empty state
**Status:** Current — Missing
When there are zero salon results (which is the current state for most categories), the page just shows the filters and nothing else. No message, no illustration, no CTA. It looks broken.
**Fix:** Empty state component. Center of the content area: a 64px Lucide icon (Search for search pages, Scissors for Coiffeur, etc.) in `#CCC`, then "Noch keine Salons in dieser Kategorie" in DM Sans 16px 500 `#999`, then "Kennst du einen? Empfiehl ihn uns." as a small link in coral. This turns an empty page into a growth opportunity.

---

## 12 — Search Page (/de/search)

### Problem 1 — Completely empty page with only filter pills
**Status:** Current — Broken
`/de/search` shows filter pills (Verfügbar / Bewertung / Online-Zahlung / Nebenzeiten / Sortieren) and nothing else. No search input, no results, no empty state, no content. This is a core page — it's one of four tabs in the bottom nav — and it's blank.
**Fix:** Search page needs:
1. Search input at the top (same unified pill bar from homepage, but always expanded/active)
2. Recent searches section below (if user has search history, stored client-side)
3. Popular categories section (reuse the category icons from homepage)
4. Empty state when search returns no results ("Keine Ergebnisse für '[query]'. Versuch eine andere Kategorie.")
5. Results grid when salons exist

### Problem 2 — Filter pills don't match the category page filter pills
**Status:** Current — Inconsistent
Category page has: neighborhood filters, price, date, rating, payment, off-peak. Search page has: Verfügbar, Bewertung, Online-Zahlung, Nebenzeiten, Sortieren. Different filters, different order, different labels for similar concepts. A user going between these pages has to relearn the filter UI.
**Fix:** One unified filter pill set used on BOTH category pages and the search page. Exact same order, exact same labels, exact same styling. The only difference is category pages have an additional neighborhood row above the shared filters.

---

## 13 — Discover Page (/de/discover)

### Problem 1 — "solen discover" subtitle above the title is redundant
**Status:** Current — Wrong
The page shows "solen discover" in small text, then "Discover" as the H1, then "Dein nächster Look" as a subtitle. Three text elements doing one job — exact same problem as the homepage Discover section. "solen discover" is a brand label that means nothing to the user.
**Fix:** DELETE "solen discover" subtitle. Page title: "Entdecken" (not "Discover" — the site is in German). Subtitle: "Dein nächster Look" — keep. Two elements total.

### Problem 2 — Trending tags use emojis as icons
**Status:** Current — Unprofessional
"🎨Balayage ✂️Curtain Bangs 💅Gel Nails 💈Herrenschnitt 🧖Facial 👁️Wimpern 🌀Locken 👰Braut-Styling" — system emojis as icons in a professional beauty platform. Emojis render differently across Android/iOS/desktop, they're not color-controllable, and they make the page look like a WhatsApp chat, not a curated discovery experience.
**Fix:** Replace every emoji with a Lucide icon or your custom SVG icon set. Stroke color coral (`#FF6B6B`), `16px`, `stroke-width 1.5`. Examples: Balayage → Paintbrush, Curtain Bangs → Scissors, Gel Nails → Sparkles, Herrenschnitt → User, Facial → Droplets, Wimpern → Eye, Locken → RefreshCw, Braut-Styling → Heart. Consistent, brand-colored, cross-platform identical.

### Problem 3 — Gender and Texture filters exist but have no visible options
**Status:** Current — Placeholder
"Gender" and "Texture" appear as filter labels but the fetch returned no options under them. If these aren't functional yet, they shouldn't be visible — empty filters signal a broken product.
**Fix:** Hide Gender and Texture filter pills until they have at least 2 options each with content behind them. Add them back when the Discover feed has enough tagged content to make filtering useful.

### Problem 4 — Mixed language ("Discover" / "Filter" / English category labels)
**Status:** Current — Inconsistent
Page title says "Discover" (English). Filter labels say "Alle / Hair / Nails / Lashes / Brows / Makeup" (English). But the trending tags mix German ("Herrenschnitt", "Braut-Styling") with English ("Curtain Bangs", "Gel Nails"). The rest of the site is German. This page forgot which language it's in.
**Fix:** All German. "Entdecken" not "Discover." Filter labels: "Alle / Haare / Nägel / Wimpern / Augenbrauen / Makeup" (Makeup is fine in both languages). Trending tags: all German — "Balayage" (international term, fine), "Vorhangpony" not "Curtain Bangs", "Gel-Nägel" not "Gel Nails", etc.

---

## 14 — Last-Minute Page (/de/last-minute)

### Problem 1 — URL says /last-minute but nav link says "Angebote"
**Status:** Current — Inconsistent
The nav strip says "Angebote" linking to `/de/last-minute`. The page title says "Last-Minute Angebote." The breadcrumb says "Angebote." Three different labels. Pick one slug and one label.
**Fix:** URL: `/de/angebote` (German site = German URL). Nav label: "Angebote". Page title: "Angebote — Letzte freie Termine". Breadcrumb: "Angebote." One word, everywhere.

### Problem 2 — Sort dropdown renders as plain text
**Status:** Current — Looks broken
"Sortieren ▾" followed by options (Beliebteste / Preis / Nächste / Neueste / Nächster Termin) appear to render inline rather than as a proper dropdown. The ▾ character is a Unicode triangle, not a proper chevron icon.
**Fix:** Sortieren becomes a pill button that opens a bottom sheet. Pill style: DM Sans 13px 500, border `1px #E0E0E0`, border-radius 999px, padding 8px 14px. Chevron: Lucide ChevronDown 14px. Bottom sheet shows radio options, each 48px tap target height.

### Problem 3 — Category and price filters are mixed in one row
**Status:** Current — No hierarchy
"Coiffeur / Nails / Spa / Makeup / Waxing" and "< CHF 30 / < CHF 50 / < CHF 80 / < CHF 100" are all in one flat row. Categories and price ranges are different filter types but they're visually identical. Users can't tell which pills are categories vs. price caps.
**Fix:** Two rows. Row 1: category pills (same style as homepage strip). Row 2: price pills in a slightly different style — e.g., DM Sans with a small CHF icon prefix, or a different pill background tint.

### Problem 4 — No empty state
**Status:** Current — Missing
Same problem as category pages. No salons, no content, no message. Just filters floating over nothing.
**Fix:** Same empty state pattern as section 11 Problem 4. Icon: Clock (for last-minute). Text: "Aktuell keine Angebote verfügbar." Sub-text: "Schau später nochmal vorbei — neue Angebote werden täglich hinzugefügt."

---

## 15 — Compare Page (/de/compare)

### Problem 1 — Page exists in footer navigation but is useless without salons
**Status:** Current — Premature
The compare page shows "Keine Salons ausgewählt" with instructions to select salons from the Entdecken page. But there are no salons to select. The page exists, is linked from the footer, and does literally nothing. It adds a dead link to the navigation that makes the product feel hollow.
**Fix:** DELETE the `/de/compare` link from the footer entirely. The Compare feature is a post-launch feature that should only appear in the UI when a user has actively added 2+ salons to a comparison set. It does not need its own navigation entry.

---

## 16 — Legal Pages

### Problem 1 — AGB page is completely empty
**Status:** Current — CRITICAL / LEGAL
`/de/agb` renders the shell (nav, breadcrumb, tab bar) and zero content. No terms of service. No text at all. The footer links to this page, and the site claims "nDSG konform" in trust badges. An empty AGB page while claiming legal compliance is a direct contradiction.
**Fix:** Populate with the 15-section bilingual AGB you already drafted. This is not a visual issue — it's a legal exposure issue. Priority zero.

### Problem 2 — Datenschutz page is completely empty
**Status:** Current — CRITICAL / LEGAL
Same as AGB. `/de/datenschutz` renders a shell with no content. The site explicitly claims "nDSG konform" and "Schweizer Datenschutz" in multiple places. An empty privacy policy page while making these claims is a potential FADP Art. 19 violation and actively misleading.
**Fix:** Populate with a full Datenschutzerklärung covering: data controller info, types of data collected, legal basis (FADP Art. 31), Supabase/Stripe/Vercel as processors, data retention periods, user rights (access, deletion, export under DSG Art. 25-29), PostHog analytics disclosure, cookie policy. Priority zero alongside AGB.

### Problem 3 — Impressum still has placeholder brackets
**Status:** Current — CRITICAL / LEGAL
The Impressum shows "[Vollständiger Name]", "[Strasse Nr.], [PLZ] Basel", "[ausstehend]" for CHE number. These are literal placeholder strings visible to the public. Under Art. 3 UWG, the Impressum must contain actual identification information. Brackets are not identification.
**Fix:** Replace all brackets with real information. Your name, your address in Basel-Stadt, and either the CHE number or a note that HR registration is pending (which is legally acceptable for an Einzelunternehmen below the revenue threshold).

---

## 17 — Bottom Tab Bar (Mobile)

### Problem 1 — Four tabs but "Gespeichert" and "Profil" require login
**Status:** Current — Dead ends
The tab bar shows: Entdecken / Suchen / Gespeichert / Profil. Two of these four tabs (Gespeichert, Profil) require authentication. For a logged-out user — which is 100% of users right now — half the tab bar leads to login walls. This makes the bottom nav feel 50% broken on every page.
**Fix:** For logged-out users, tapping "Gespeichert" or "Profil" opens a login/signup bottom sheet — not a redirect to a login page. The sheet has: "Melde dich an, um Salons zu speichern" or "Melde dich an, um dein Profil zu sehen" as the headline, then email + Google + Apple login buttons. This is the Airbnb pattern — the tab always works, it just shows a login prompt when needed.

### Problem 2 — No active state differentiation
**Status:** Current — Unclear from markup
From the HTML it's not clear whether the active tab gets a different color. If all four tabs are the same color at all times, the user doesn't know which page they're on.
**Fix:** Active tab: icon + label in coral (`#FF6B6B`). Inactive tabs: icon + label in `#999`. Transition: color 150ms ease. Active indicator: a 4px wide dot below the icon, coral, border-radius 2px.

---

## 18 — Partner Page (/de/partner)

### Problem 1 — Fake testimonials with fake names
**Status:** Current — CRITICAL / TRUST
"Leila M., Inhaberin, Studio Bella Basel" / "Marco R., Barbershop-Besitzer, Kleinbasel" / "Sarah K., Nail Studio, Gundeldingen" — these are fabricated testimonials. There are zero salons on the platform and zero transactions. If a prospective salon partner Googles "Studio Bella Basel" and finds nothing, your credibility is destroyed instantly. Fake social proof is worse than no social proof.
**Fix:** DELETE all three testimonials. Replace the section with an honest value proposition: "Wir starten in Basel. Sei einer der ersten Salons auf Solen und profitiere von maximaler Sichtbarkeit bei null Risiko." First-mover advantage is a real value prop. Fake reviews are not.

### Problem 2 — "+47 Buchungen/Woche" and "4.8 Bewertung" stats are fabricated
**Status:** Current — CRITICAL / TRUST
The partner page shows "+47 Buchungen/Woche" and "4.8 Bewertung" overlaid on the mockup images. These numbers are made up — there are zero bookings. Under Swiss UWG (Unfair Competition Law), presenting fabricated performance metrics to attract business partners is potentially actionable.
**Fix:** DELETE both stat badges from the mockup images. If you want to show capability, use "Bis zu X Buchungen/Woche" framed as potential, not "achieved" stats. Or better: just show the dashboard UI without any fake numbers.

### Problem 3 — Feature list promises things that don't exist yet
**Status:** Current — Overclaiming
The features section promises: SMS- & E-Mail-Erinnerungen, Analytics, Last-Minute-Deals, Bewertungen, Team-Verwaltung, CRM, Walk-in-Warteschlange, Nail-Art-Portfolio, Material-Tracking, Raum-Verwaltung, Bridal-Packages, Zonen-basierte Preise. Most of these features are not built.
**Fix:** Add "Bald verfügbar" badges (DM Sans 9px, coral background, white text, border-radius 999px, padding 2px 8px) to features that aren't live. Be honest about what's ready now vs. what's on the roadmap. Features that ARE live: salon profile, basic booking, dashboard shell. Everything else gets the badge.

### Problem 4 — "DSGVO-konform" badge on the partner page
**Status:** Current — Wrong jurisdiction
The partner trust badges say "DSGVO-konform" (GDPR). You're a Swiss company targeting Swiss salons. The correct reference is nDSG/FADP (Swiss Federal Act on Data Protection), which the homepage already uses. DSGVO is the EU regulation. Using both interchangeably signals you don't know the difference.
**Fix:** Replace "DSGVO-konform" with "nDSG-konform" everywhere. The Swiss nDSG is aligned with GDPR but it's a different law and Swiss businesses operate under nDSG, not DSGVO, unless they process EU resident data.

---

## 19 — Global Visual Patterns

### Problem 1 — No skeleton loaders anywhere
**Status:** Current — Missing globally
No page on the site shows a loading state. When content is loading (or when content doesn't exist, which is the current state), the page just shows nothing. This makes every page feel broken. Airbnb shows animated skeleton cards while results load. Fresha shows pulsing placeholder blocks.
**Fix:** Skeleton loader component: rounded rectangles matching the shape of the content they're replacing (card skeleton = card-sized rounded rect, text skeleton = narrow rounded rect). Background: `#E8E4DF`. Animation: shimmer using `linear-gradient(90deg, #E8E4DF 25%, #F5F0EB 50%, #E8E4DF 75%)` with `background-size 200%` and `animation: shimmer 1.5s infinite ease-in-out`. Show 3-4 skeleton cards on listing pages during loading.

### Problem 2 — No consistent card component
**Status:** Current — Missing
Salon cards, TikTok cards, and category cards all appear to have different styling. There's no shared card pattern — different border-radius values, different shadow treatments (or lack thereof), different padding.
**Fix:** One base card component. Properties: background `#FFFFFF`, border-radius 12px, border `1px #F0ECE7` (warm grey, almost invisible), no box-shadow (per your existing rule), `overflow hidden`. All cards derive from this base. Image area: `border-radius 12px 12px 0 0`. Content area: `padding 12px`.

### Problem 3 — Inconsistent use of the warm beige background
**Status:** Current — Partial
Some sections appear to use the warm beige wash (`#F5F0EB`), others use pure white. The inconsistency breaks the "warm, inviting" visual identity. Airbnb and Fresha have a consistent background treatment that unifies the entire page.
**Fix:** Page background: `#F5F0EB` everywhere. Cards and interactive elements sit on `#FFFFFF`. The nav and tab bar use `rgba(255,255,255,0.94)` with `backdrop-filter blur(16px)`. This creates a clear "warm canvas, white interactive surfaces" visual hierarchy.

### Problem 4 — No toast/snackbar system for user feedback
**Status:** Current — Missing
There's no visible feedback pattern for actions like saving a salon, removing a saved item, or copying a link. Users perform actions and nothing confirms what happened.
**Fix:** Toast component. Position: fixed, bottom 80px (above tab bar), center. Style: background `#333`, color white, DM Sans 13px 500, border-radius 12px, padding 12px 20px. Animation: slide up + fade in 200ms ease-out, auto-dismiss after 3s with fade out 150ms. Used for: "Gespeichert", "Entfernt", "Link kopiert", error messages.

### Problem 5 — No scroll-to-top behavior
**Status:** Current — Missing
Long pages (homepage, partner page) don't offer a way to return to the top without manually scrolling. On mobile this is especially annoying.
**Fix:** Tapping the active tab bar icon scrolls to top (standard iOS/Android pattern). Additionally, the logo in the nav is always a scroll-to-top + navigate-home action.

---

## 20 — Typography & Spacing Audit

### Problem 1 — Inconsistent heading hierarchy
**Status:** Current — No system
The homepage uses "BEAUTY. BUCHEN." in what appears to be Bebas Neue, then "Was suchst du?" in a different weight, then "FINDE DEINE INSPIRATION" in another treatment, then "0% für Stammkunden..." in yet another. Four sections, four different heading treatments with no visible type scale.
**Fix:** Define a strict type scale:
- Page title (hero): Bebas Neue 48px, letter-spacing 2px, uppercase, `#333`
- Section title: Bebas Neue 32px, letter-spacing 1px, uppercase, `#333`
- Section subtitle: Syne 14px 600, `#666`
- Card title: DM Sans 14px 600, `#333`
- Card subtitle: DM Sans 12px 400, `#999`
- Body: DM Sans 14px 400, `#333`, line-height 1.5
- Caption: DM Sans 11px 400, `#999`

Every heading on every page must use one of these levels. No exceptions.

### Problem 2 — Section spacing is inconsistent
**Status:** Current — No system
The gap between sections varies randomly. Some sections feel crammed together, others have excessive whitespace.
**Fix:** Section spacing: 48px between sections on mobile, 64px on desktop. Inner padding: 16px horizontal on mobile, 24px on tablet, max-width 1200px centered on desktop. These values apply globally to every section on every page.

---

## Priority Summary

**P0 — Legal / Trust (fix before any visual work):**
- AGB page empty (section 16.1)
- Datenschutz page empty (section 16.2)
- Impressum has placeholders (section 16.3)
- Fake testimonials on partner page (section 18.1)
- Fake stats on partner page (section 18.2)
- Commission rate conflict 15% vs 1% (section 09.1)

**P1 — Core UX (fix this sprint):**
- Hero needs an image (section 06.3)
- Search bar needs to be a unified pill (section 07.1)
- Empty states on all listing pages (sections 11.4, 12.1, 14.4)
- Skeleton loaders (section 19.1)
- Tab bar login handling (section 17.1)

**P2 — Visual consistency (fix next sprint):**
- Logo treatment across pages (section 05.1)
- Category strip scoping (section 05.2)
- Discover page language cleanup (section 13.4)
- Consistent card component (section 19.2)
- Type scale enforcement (section 20.1)
- Section spacing system (section 20.2)
- Trust badge deduplication (section 08.1)
- Footer slimming (section 10.1)

**P3 — Polish (fix when core is solid):**
- Filter pill scrolling (section 11.1)
- Date locale fix (section 11.2)
- Map FAB button (section 11.3)
- Toast system (section 19.4)
- Scroll-to-top (section 19.5)
- Partner page feature badges (section 18.3)
- Trending tag icons replacing emojis (section 13.2)
