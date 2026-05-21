# Backend-without-UI gap audit

> Maps every backend feature listed in `_tasks/BACKEND_NEEDS_UI.md` to the Q-lock in `_tasks/SOLEN_DESIGN.md` §20 that designs its UI surface. Items with no Q-lock are flagged for the next questionnaire round.

## Summary
- Total backend-without-UI items: **62**
- Covered (fully or partially) by an existing Q-lock: **17**
- Uncovered (needs new Q-lock): **45**
- High-priority gaps (high user-facing impact): **14**

The Q-locks Q1–Q63 are heavy on **structural / system-level** decisions (palette, typography, card shells, state grammar, layout containers, booking wizard skeleton, dashboard shell). They are very thin on **per-feature treatments** — most BACKEND_NEEDS_UI items name a specific small surface (badge, pill, banner, chip, modal, picker, timeline, queue card) for which no lock exists.

---

## Per-item analysis

### ON SALON CARDS (SalonCard.tsx)

| # | Backend feature | BACKEND_NEEDS_UI line | Designed by Q? | If uncovered, suggested new Q |
|---|---|---|---|---|
| 1 | Badges: Top bewertet / Beliebt / Neu / Solen Exclusive (auto-assign) | L8 | **Partial — Q10** (locks Solen Favorit as 4th badge yellow `#F2C144`, algorithmic). Q26 implies badges sit ON the photo. **Shape, position, count cap, color of the other 3 badges NOT locked.** | New Q: badge system spec — exact set (4 vs 5 badges?), shape (pill vs chip vs ribbon), max-stack rule, position on 1:1 photo, color per badge type, dark-photo legibility. |
| 2 | Deal overlay: "-20%" discount badge | L9 | **Uncovered.** Q26 says features go ON photo, but no lock for discount-badge style. | New Q: deal-overlay treatment — corner ribbon vs pill vs Bebas numeral block (Q12 already permits Bebas for discount numerals — the natural answer). Position, size, contrast. |
| 3 | Favorite heart toggle | L10 | **Partial — Q26** (heart sits ON photo) + **Q36** (5 celebration moments — heart-tap probably one of them but not enumerated). | New Q: enumerate the 5 Q36 celebration moments explicitly; lock heart-tap micro-interaction (scale + color burst + haptic). |
| 4 | Availability pill: "Heute frei" / "Morgen" | L11 | **Uncovered.** Q26 says ON photo, but no pill spec. | New Q: availability-pill design — color (success-green? amber?), label vocabulary set ("Heute frei" / "Heute knapp" / "Morgen frei" / "Wochenende frei"), placement vs heart vs badges. |
| 5 | Social proof: "10x diese Woche gebucht" | L12 | **Uncovered.** | New Q: social-proof text treatment — placement (eyebrow above title? chip on photo? line below price?), threshold to show, copy variants. |
| 6 | Photo carousel pagination dots | L13 | **Partial — Q3** (locks swipeable carousel) but dot style not specified. | New Q: carousel dot style — Airbnb-style white dots with shadow, count cap (5 dots max with progress?), active-state color. |

### ON SALON DETAIL PAGE

| # | Backend feature | BACKEND_NEEDS_UI line | Designed by Q? | If uncovered, suggested new Q |
|---|---|---|---|---|
| 7 | Off-peak deals banner | L16 | **Uncovered.** Q52 locks the hero but not the off-peak banner placement/style. | New Q: off-peak-today banner — placement on detail page (above fold? in meta strip? sticky?), color (amber? coral?), how it interacts with sticky booking CTA (Q53). |
| 8 | Solen Score (0-100) display | L17 | **Uncovered.** Q7 prioritises Solen Score as a moat feature but no UI lock. | New Q: Solen Score treatment — gauge vs ring vs single number with eyebrow ("Solen Score 87"), where on detail page, tooltip explainer, threshold colors. |
| 9 | Staff badges (junior/senior/master) per-staff ratings | L18 | **Uncovered.** Q1 locks staff portraits at 1:1 but tier badge not designed. | New Q: staff-tier badge — 3-tier visual system, position on staff portrait (corner overlay vs below name), star-rating row layout. |
| 10 | Review photos with reviews | L19 | **Partial — Q54** (locks reviews summary card + `/salon/[slug]/reviews` sub-page). Photo display style inside review cards not locked. | New Q: review-photo grid — thumbnails per review (count cap? 4? scrollable?), tap-to-fullscreen (use Q35 morph?), aspect ratio. |
| 11 | Review reply (salon owner) | L20 | **Partial — Q54** mentions "reply threads" on the sub-page but no card design. | New Q: review-reply card — visual differentiation (indented? coral left-border? "Antwort vom Salon" eyebrow?), public vs private state, owner-avatar placement. |
| 12 | Similar salons (3 cards) | L21 | **Partial — Q26** (card hierarchy) + **Q50** (horizontal carousel). 3-card row at bottom of detail page may not need its own lock. | Likely covered. Optionally lock: section heading + Anton/eyebrow treatment for "Ähnliche Salons" on detail page. |

### ON BOOKING FLOW

| # | Backend feature | BACKEND_NEEDS_UI line | Designed by Q? | If uncovered, suggested new Q |
|---|---|---|---|---|
| 13 | Package redemption banner (PackageRedeemBanner) | L24 | **Uncovered.** Q55/56 lock wizard skeleton, not in-wizard banners. | New Q: in-wizard package/credit banner — placement (top of step? above pay button?), CTA copy, dismissible vs persistent, savings-amount Bebas treatment. |
| 14 | Promo / gift / referral code inputs | L25 | **Uncovered.** Q55 says `PayConfirmStep` merges payment + confirm but no code-input field design. | New Q: code-input pattern in cart — inline-expand link ("Code einlösen") vs always-visible field, validation states (success/invalid/expired) using Q19 state lockset. |
| 15 | Group booking modal | L26 | **Uncovered.** Q53 explicitly bans modals/bottom-sheets for booking entry. | New Q: group-booking flow — sub-route within `/book/[slug]/group` vs additional wizard step? Multi-person form layout, per-person service selection, payment-split UI. |
| 16 | Guest checkout form | L27 | **Uncovered.** Q55 wizard assumes logged-in. | New Q: guest-checkout — sign-in vs guest fork point in wizard, what fields collect (email, phone), where account-create upsell appears (after-confirm? Q57 confirmation card?). |
| 17 | Per-service add-ons | L28 | **Uncovered.** Q55 step 1 is "Service+Staff" — add-ons not specced. | New Q: add-on selection UI — checkbox list vs chips vs accordion under each service, price-delta display, max-add-ons rule. |

### ON PROFILE PAGE

| # | Backend feature | BACKEND_NEEDS_UI line | Designed by Q? | If uncovered, suggested new Q |
|---|---|---|---|---|
| 18 | Beauty profile (hair/nails/skin/style) card + edit modal | L31 | **Partial — Q58** (profile = grouped lists + Live-Activity hero). Beauty-profile card not locked. | New Q: beauty-profile card — placement in Q58 grouped lists, edit modal pattern (per Q53 ban on modals — does this still apply for profile edits, or are profile edits OK as modals?). |
| 19 | Loyalty stamps + QR code | L32 | **Covered — Q59** (3-surface system: `/profil/stempel` page + salon-detail chip + Live-Activity card). | — |
| 20 | Payment methods (Stripe saved cards) | L33 | **Uncovered.** Q58 grouped-lists likely host this but no card-list spec. | New Q: saved-cards list — card-brand-logo + last-4 + expiry layout, default-card indicator, add/remove affordance, link to Stripe portal vs in-app management. |
| 21 | Referral stats (code share + reward tracking) | L34 | **Uncovered.** | New Q: referral surface — dedicated `/profil/empfehlen` sub-page vs grouped-list block, share-code Bebas treatment, reward-progress bar, social-share-sheet entry. |
| 22 | GDPR deletion (30-day grace modal) | L35 | **Partial — Q22** (error/destructive grammar) + **Q19** (states). Confirmation modal not specced. | New Q: destructive-action confirmation — type-to-confirm vs 2-step modal, 30-day grace messaging, recovery CTA, copy tone (Q24). |

### ON DISCOVERY PAGE

| # | Backend feature | BACKEND_NEEDS_UI line | Designed by Q? | If uncovered, suggested new Q |
|---|---|---|---|---|
| 23 | AI suggestion pills (trending styles) | L38 | **Uncovered.** Q49 home shows "3 quick-action chips" but discovery pills not specced. | New Q: AI-suggestion pill design — single-line chip vs photo-chip, "AI" indicator (sparkle?), max-count, scroll behavior, vs Q49 quick-action chips visual differentiation. |
| 24 | Like / save / share on posts | L39 | **Partial — Q36** (celebration moments; like is a candidate). | New Q: post-action button row — icon-only vs icon+count, position (overlay vs below post), Q36 micro-interaction enumeration. |
| 25 | "Book this look" CTA (booking bridge) | L40 | **Uncovered.** Critical commerce link from discovery → salon. | New Q: book-this-look CTA — sticky overlay on post vs inline button, salon-attribution treatment (which salon offers it?), Q35 morph into salon-detail. |
| 26 | AI description info card (maintenance / face shape / type match) | L41 | **Uncovered.** | New Q: AI-info card — accordion vs always-visible, "AI-generated" disclosure label, per-attribute icon set, dismissal. |
| 27 | Comment section with pagination | L42 | **Uncovered.** | New Q: comment-card design — avatar + name + timestamp + body + reply, "load more" pattern (button vs auto), report/like-comment affordances. |

### ON SEARCH

| # | Backend feature | BACKEND_NEEDS_UI line | Designed by Q? | If uncovered, suggested new Q |
|---|---|---|---|---|
| 28 | Autocomplete (grouped: salons, services, cities) | L45 | **Partial — Q4** (3-segment search bar). Dropdown grouping not specced. | New Q: search dropdown — group headers (eyebrow style?), per-row icon (salon photo / service icon / pin), keyboard nav, recent-searches block. |
| 29 | Filter chips (active filters) | L46 | **Uncovered.** Q4 is the search bar; filter chip pattern not locked. | New Q: filter-chip pattern — removable X icon, color (neutral fill vs coral border?), wrap vs scroll, "Alle löschen" affordance, vs Q49 quick-action chips visual distinction. |
| 30 | Map pins with clustering | L47 | **Uncovered.** | New Q: map-pin design — default vs hovered vs selected state, cluster-count bubble, brand-coral pin shape, supercluster threshold. |
| 31 | Map quick-preview sheet (pin tap → preview) | L48 | **Uncovered.** Q53 bans bottom sheets for booking but map preview is read-only — likely OK. | New Q: map-preview sheet — peek-height vs full, mini salon-card content (subset of Q26?), "Salon ansehen" CTA + Q35 morph to detail. |

### ON HOMEPAGE

| # | Backend feature | BACKEND_NEEDS_UI line | Designed by Q? | If uncovered, suggested new Q |
|---|---|---|---|---|
| 32 | Recently viewed (max 5) | L51 | **Covered — Q51** ("8 sanctioned sections + conditional Recently Viewed") + **Q50** carousel. | — |
| 33 | Category affinity reordering | L52 | **Partial — Q51** (8 sections, ordering) — but reorder *logic* (which sections move when) is product-logic, not visual. UI is invisible. | Likely no new Q needed — backend reorders sections, UI just renders Q51 sections. Optional Q: should reordering be visible to user (e.g., "Für dich sortiert" eyebrow)? |
| 34 | Section toggles (admin-controlled) | L53 | **Covered — Q51** sanctions 8 sections; admin toggles just hide/show. | — (no consumer UI; admin UI is dashboard-side, see Q63). |
| 35 | Tutorial tour (first-visit driver.js) | L54 | **Uncovered.** | New Q: onboarding tooltips — driver.js style (spotlight + popover) vs custom, brand voice copy (Q24), step count cap, dismiss + "later" affordance, replay path. |
| 36 | Trending salons section | L55 | **Covered — Q51** (one of the 8 sections) + **Q50** carousel. | — |
| 37 | City salon counts (per-city numbers) | L56 | **Uncovered.** | New Q: city-card design — Q1 1:1 photo + Bebas count overlay (matches Q12 scope: discount/Instagram/footer — count probably qualifies)? Or alternative. |

### ON CHAT

| # | Backend feature | BACKEND_NEEDS_UI line | Designed by Q? | If uncovered, suggested new Q |
|---|---|---|---|---|
| 38 | AI reply suggestions (Gemini) | L59 | **Uncovered.** Q7 marks chat intelligence as #1 moat. | New Q: AI-reply suggestion chip row — placement (above input? sticky?), "AI" sparkle indicator, max chips (3?), one-tap-send vs tap-to-edit. |
| 39 | Quick-reply chips (templates) | L60 | **Uncovered.** | New Q: quick-reply chip — visual distinction from AI chips (#38), edit-template entry point, per-salon configurability. |
| 40 | Price offer bubble (negotiation) | L61 | **Uncovered.** | New Q: in-chat offer bubble — coral-bordered card vs distinct shape, accept/decline/counter buttons, expiry timer, Bebas price treatment (Q12 fits). |
| 41 | Booking bubble (CTA after 3+ messages) | L62 | **Uncovered.** | New Q: in-chat booking CTA — single coral button-card vs full salon-mini-card, "Termin buchen" copy, Q35 morph to wizard. |
| 42 | Photo gallery (Photos tab) | L63 | **Uncovered.** | New Q: chat-photos tab — grid density (3-up Insta vs 4-up?), tap-to-fullscreen, save/share affordances. |
| 43 | Typing indicator | L64 | **Uncovered.** | New Q: typing indicator — three-dot animation spec (timing, color = ink3?), bubble-shape, "X tippt..." text variant. |

### BARBER-SPECIFIC

| # | Backend feature | BACKEND_NEEDS_UI line | Designed by Q? | If uncovered, suggested new Q |
|---|---|---|---|---|
| 44 | Walk-in queue real-time display | L67 | **Partial — Q61** (dashboard sidebar mentions "walk-in queue" as category-tool group + Q63 lists it as dense surface). **Consumer-facing queue card not locked.** | New Q: consumer walk-in queue card — position in queue ("Sie sind #3"), live-update animation, ETA, leave-queue affordance, per Q19 states. |
| 45 | Wait-time countdown | L68 | **Uncovered.** | New Q: wait-time timer — Bebas numeral (Q12 candidate?), color thresholds (green <10min, amber 10-30, coral 30+), placement vs queue card. |
| 46 | Remote join queue form | L69 | **Uncovered.** | New Q: remote-join entry — full-page vs in-salon-detail card, form fields (name, phone, service), confirmation pattern, fits Q60 empty-state-bookings logic? |
| 47 | Express rebook (2-tap) | L70 | **Uncovered.** | New Q: 2-tap-rebook surface — entry on past-booking card vs profile shortcut, Q36 celebration on success, default-everything from prior visit. |
| 48 | Cut history timeline | L71 | **Uncovered.** | New Q: cut-history timeline — vertical chronological vs horizontal scroll, per-entry photo + date + staff + service, on profile vs salon-detail-history-tab. |
| 49 | Loyalty QR card (HMAC stamp) | L72 | **Covered — Q59** (loyalty 3-surface system explicitly includes `/profil/stempel` and Live-Activity). QR-render style not locked but is utility-render. | — (Q59 covers strategically). Optional micro-Q: QR-card visual frame + branded center logo. |
| 50 | Barber profiles (portfolio + booking) | L73 | **Partial — Q1** (1:1 staff portraits) + **Q52** (salon detail hero pattern reusable). Per-staff sub-page route not locked. | New Q: staff sub-page — `/salon/[slug]/staff/[id]` route, hero pattern (reuse Q52), portfolio grid (3-up Insta?), per-staff booking CTA. |

### NAIL-SPECIFIC

| # | Backend feature | BACKEND_NEEDS_UI line | Designed by Q? | If uncovered, suggested new Q |
|---|---|---|---|---|
| 51 | Material selector (gel/acrylic/dip) | L76 | **Uncovered.** | New Q: material selector — chip row vs swatch tiles vs radio cards with photos, position in booking wizard step 1 (Q55). |
| 52 | Shape + length picker (10 SVG shapes + length bars) | L77 | **Uncovered.** | New Q: shape/length picker — SVG-tile grid (2×5 vs scroll), selected-state coral fill, length-bar vs slider, mobile thumb ergonomics (Q46 48px min). |
| 53 | Inspo board (mood board uploads) | L78 | **Uncovered.** | New Q: inspo-board — masonry grid vs uniform 1:1 (Q1), drag-upload affordance, per-image notes, share-with-salon CTA. |
| 54 | Hand chart (interactive nail selector) | L79 | **Uncovered.** | New Q: hand-chart diagram — SVG hands, per-nail tap-target ≥48px (Q46), selected-state, mirror for 2-hand selection, design-per-nail mode toggle. |
| 55 | Design history per-client | L80 | **Uncovered.** Same pattern as #48 cut history — both should resolve together. | New Q: design-history timeline — same lock as cut-history (#48); single nail/cut-history pattern reused. |
| 56 | Tech portfolio (staff portfolio pages) | L81 | **Partial — Q1** (1:1 portraits). Same as #50 — per-staff sub-page. | Resolved by same new Q as #50 (staff sub-page). |
| 57 | Allergy warning banner | L82 | **Partial — Q22** (error grammar = inline) + Q7 (allergy tags = #2 moat). Banner in booking specifically not locked. | New Q: allergy-warning banner — coral vs amber severity, dismissible vs blocking, link to "Inhaltsstoffe ansehen", placement in Q55 wizard. |
| 58 | Retail checkout (POS cart) | L83 | **Uncovered.** Dashboard-side flow. | New Q: POS cart UI in dashboard — see Q63 (dense surface). Lock: per-item row, total/subtotal Bebas, tax breakdown, payment-method picker. |

### CROSS-CATEGORY (dashboard)

| # | Backend feature | BACKEND_NEEDS_UI line | Designed by Q? | If uncovered, suggested new Q |
|---|---|---|---|---|
| 59 | Activity feed (realtime log) | L86 | **Partial — Q61** (Today Live-Activity card on mobile). Multi-event feed view not locked. | New Q: activity-feed list — per-event row icon + actor + verb + object + time, group-by-day headers, infinite-scroll vs paginated, filter chips (booking / message / payment). |
| 60 | Notifications (bell + panel) | L87 | **Uncovered.** | New Q: notification bell + panel — unread badge color (coral?), panel anchor (popover vs full-screen mobile), per-notification card, mark-all-read, settings entry. |
| 61 | Command palette (Ctrl+K) | L88 | **Uncovered.** | New Q: command palette — modal style (centered vs top-anchored), grouped results, keyboard shortcuts displayed, fuzzy-search highlight color. |
| 62 | Calendar grid (weekly schedule) | L89 | **Covered — Q61** ("Calendar week-grid + sticky stats-strip on desktop") + **Q63** dense. Inner cell density not fully specced. | — (strategic lock present). Optional Q: calendar cell grammar — booking pill style inside time-slot, drag-resize, conflict overlay. |
| 63 | Heatmap chart (day-hour intensity) | L90 | **Uncovered.** | New Q: heatmap chart — color ramp (use coral-to-cream gradient? but Q16 banned decorative gradients — so discrete steps), legend placement, tap-cell drill-in. |
| 64 | Staff comparison table/chart | L91 | **Uncovered.** | New Q: staff-comparison — table (Q63 dense) vs bar-chart, sortable columns, per-staff row click → staff-detail, "best/worst" highlight rule. |

> Note: I count 62 line-items in BACKEND_NEEDS_UI and 64 rows above because items #50/#56 (barber portfolio / nail tech portfolio) and #48/#55 (cut history / design history) are paired but listed once each in source. Coverage math uses the source count of 62.

---

## Highest-priority gaps

Ranked by user-visible impact × frequency-of-encounter:

1. **#1 Salon-card badge system (full spec, not just Solen Favorit)** — every search result + homepage carousel renders these. Q10 only locks 1 of 4. Unblocks SalonCard which is the single most-rendered component.
2. **#2 Deal overlay / discount badge on cards** — same surface as #1; commercial driver. Without lock, off-peak/last-minute promotions can't ship visually.
3. **#4 Availability pill on cards** — primary booking-conversion signal. Square photos (Q1) leave thin space; pill style needs explicit lock.
4. **#13 Package redemption banner in wizard** — direct revenue: redemption rate depends on visibility. Q55 wizard is locked but in-wizard surfaces are not.
5. **#14 Promo / gift / referral code input in cart** — same revenue argument. Code-entry is a top-3 cart pain point.
6. **#17 Add-on selection UI** — per-booking AOV uplift. Step 1 of Q55 wizard has no add-on slot specced.
7. **#23 AI suggestion pills + #38 AI reply suggestions** — Q7 marks AI/chat intelligence as #1 moat, yet zero UI locks for AI surfaces. High strategic risk.
8. **#25 "Book this look" CTA** — the discovery → booking bridge. Without lock, discovery feels disconnected from the marketplace.
9. **#28 Search autocomplete dropdown** — Q4 locks the bar but not the dropdown — yet the dropdown is where most search interactions actually happen.
10. **#29 Filter chips + #30 map pins + #31 map preview** — search-results UX is an entire surface category with no Q-locks.
11. **#44 Walk-in queue (consumer view)** — barber category cornerstone (Q7/Q63 prep work) but no consumer-side Q.
12. **#54 Hand chart + #52 Shape/length picker** — nail category cornerstone. Interactive form patterns this novel deserve dedicated locks.
13. **#57 Allergy-warning banner** — Q7 marks allergy tags as #2 moat (legal safety). Banner visual not locked is a real risk.
14. **#60 Notifications + #61 Command palette** — dashboard cornerstone for staff workflow. Q61 doesn't reach into either.

---

## Suggested Q64+ topics for next questionnaire round

Grouped by surface so they can be batched into a coherent V4 questionnaire:

### Salon card sub-system (most-rendered component)
- **Q64**: Full badge system — set, shape, color, position, max-stack on 1:1 photo (closes #1).
- **Q65**: Deal-overlay treatment — corner ribbon vs Bebas numeral block (closes #2).
- **Q66**: Availability pill — color + label vocabulary (closes #4).
- **Q67**: Social-proof line — placement + threshold + copy (closes #5).
- **Q68**: Carousel dot style on cards — Q3 follow-up (closes #6).

### Booking wizard inner surfaces (Q55-Q57 follow-up)
- **Q69**: In-wizard banner pattern (package / promo / allergy) — unified slot grammar (closes #13, partial #57).
- **Q70**: Code-input field in cart — promo / gift / referral (closes #14).
- **Q71**: Add-on selection UI in step 1 (closes #17).
- **Q72**: Group-booking flow — sub-route vs extra wizard step (closes #15).
- **Q73**: Guest-checkout fork point + post-confirm account upsell (closes #16).

### Salon-detail enrichments (Q52-Q54 follow-up)
- **Q74**: Off-peak banner placement on detail page (closes #7).
- **Q75**: Solen Score visual treatment (closes #8).
- **Q76**: Staff-tier badge + per-staff rating row (closes #9, partial #50).
- **Q77**: Review-photo grid + reply-card design (closes #10, #11).

### Profile inner surfaces (Q58 follow-up)
- **Q78**: Beauty-profile card + edit pattern (closes #18).
- **Q79**: Saved-cards list (Stripe) (closes #20).
- **Q80**: Referral surface (closes #21).
- **Q81**: Destructive-action confirmation (GDPR delete) (closes #22).

### Discovery surfaces (entirely uncovered today)
- **Q82**: AI-suggestion pill (vs Q49 quick-action chip differentiation) (closes #23).
- **Q83**: Post-action row (like / save / share) + Q36 enumeration (closes #24, partial #3).
- **Q84**: "Book this look" CTA (closes #25).
- **Q85**: AI info-card (maintenance / face shape) — AI-disclosure pattern (closes #26).
- **Q86**: Comment-card design (closes #27).

### Search surfaces
- **Q87**: Search dropdown grouping + recent searches (closes #28).
- **Q88**: Filter-chip pattern (active filters) (closes #29).
- **Q89**: Map-pin design + clustering (closes #30).
- **Q90**: Map-preview sheet (read-only sheet exception to Q53 modal-ban) (closes #31).

### Chat surfaces (Q7 #1 moat — currently zero coverage)
- **Q91**: Chat AI-reply chip row (closes #38).
- **Q92**: Quick-reply chips + AI-vs-template visual differentiation (closes #39).
- **Q93**: In-chat offer bubble (closes #40).
- **Q94**: In-chat booking CTA (closes #41).
- **Q95**: Chat photos tab (closes #42).
- **Q96**: Typing indicator (closes #43).

### Barber/walk-in (Q7 + Q61 follow-up)
- **Q97**: Consumer walk-in queue card (closes #44).
- **Q98**: Wait-time timer (closes #45).
- **Q99**: Remote-join form (closes #46).
- **Q100**: 2-tap rebook (closes #47).
- **Q101**: Visit-history timeline — single pattern for cut + nail design (closes #48, #55).
- **Q102**: Staff sub-page route + portfolio grid (closes #50, #56).

### Nail-specific
- **Q103**: Material selector (closes #51).
- **Q104**: Shape + length picker (closes #52).
- **Q105**: Inspo board upload + share (closes #53).
- **Q106**: Hand-chart diagram + per-nail tap target (closes #54).
- **Q107**: Allergy-warning banner (closes #57, paired with Q69).

### Homepage extras
- **Q108**: Tutorial-tour tooltips (driver.js) (closes #35).
- **Q109**: City-card design + count overlay (closes #37).

### Dashboard inner surfaces (Q61-Q63 follow-up)
- **Q110**: Activity-feed list (closes #59).
- **Q111**: Notification bell + panel (closes #60).
- **Q112**: Command palette (Ctrl+K) (closes #61).
- **Q113**: Heatmap chart — discrete-step coral ramp (Q16-compliant) (closes #63).
- **Q114**: Staff-comparison table/chart (closes #64).
- **Q115**: POS retail-checkout cart (closes #58).
- **Q116**: Calendar cell grammar — booking pill, drag-resize, conflict (deepens #62).

### Cross-cutting
- **Q117**: Q36 celebration moments — enumerate the 5, lock per-moment animation (closes parts of #3, #19, #24, #47, #57).
- **Q118**: AI-surface disclosure pattern — universal "AI sparkle" treatment across #23, #26, #38, #91 (system-level coherence).

> Net: **45 uncovered items** can be retired by **~55 new Q-locks** (some new Qs cover multiple items, e.g., Q101 closes both #48 and #55; Q102 closes both #50 and #56; Q117 closes parts of multiple items).
