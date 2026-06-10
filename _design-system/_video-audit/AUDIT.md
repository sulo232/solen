# THE BIG AUDIT — 8 design videos vs the Solen design system

> Phase 1 deliverable (see PLAN.md). Each claim: what the video says (with timestamp), what Solen has
> today, the gap, and a verdict — **ADOPT** (new rule) / **ADAPT** (fits with changes) / **ALREADY-HAVE**
> (codified; maybe enforce harder) / **REJECT** (conflicts with locked Solen rules or our platform).
> Locked context: B&W chrome, sparse blue #276EF1, ink CTAs, Inter Tight/Inter, no dark mode, website
> (no bottom nav, no haptics), Fresha structure × Uber aesthetic.

---

## V1 — "Every UI/UX Concept Explained in Under 10 Minutes" (EcbgbKtOELY, 9:23)

### V1.1 Signifiers & affordances (0:08–0:42)
**Claim:** UI should explain itself with zero instructions: a container around items = "these are related";
a container around one = "selected"; greyed text = "inactive". Good UI is full of signifiers — button press
states, highlighted active nav items, hover states, tooltips.
**Solen today:** Affordance-not-color is locked (CANON §0: clickability = chevron/underline/weight). Selected
= ink-border language (locked). active:scale press on CTAs exists.
**Gap:** (a) Hover states are inconsistent on desktop (cards/links/rows differ per page); (b) tooltips
basically unused; (c) press feedback exists on big CTAs but not uniformly on rows/pills/icon buttons.
**Verdict:** ALREADY-HAVE the principle; **ADOPT an interaction-states matrix** (see V1.9) to enforce it.

### V1.2 Visual hierarchy: size/position/color contrast (0:47–2:01)
**Claim:** A card without hierarchy is a spreadsheet. Tools: size, position, color. Image at top = pop of
color + scanability ("just like Uber"). Most-important thing big/bold/top. Price top-right *and colored*
(he uses blue) so it draws the eye. Icons + alignment can SAY things (from→to) without words. Contrast
(big-vs-small, colorful-vs-not) IS the hierarchy.
**Solen today:** One-focal rule exists (SCORECARD Emphasis). Rich-not-bland is a locked memory (photos
wanted). BUT our locked rule says **prices stay INK** and blue is sparse-clickable-only.
**Gap/conflict:** His "price in blue" directly conflicts with our lock (blue ≠ data, blue = clickable).
Verdict on that sub-claim: **REJECT** (our blue-means-tappable semantics is stricter and self-consistent —
coloring a non-tappable price would poison it). But the underlying claim — every card needs ONE
differentiated element, and images whenever possible — is **ADOPT-harder**: several Solen cards
(profile rows, dashboard tiles, list items) still read as same-size same-weight "spreadsheets".
**Verdict:** ADAPT — keep ink prices; enforce "one differentiated element per card" + "icons+layout replace
words" (e.g. queue position, from→to time ranges).

### V1.3 Grids are guidelines; whitespace is the real law (2:05–3:15)
**Claim:** 12-col grids and 8pt are guidelines, not laws. What matters: whitespace ("letting things
breathe"), a steady inter-item rhythm (~32px between section-level items), and *grouping* related elements
closer (proximity = hierarchy). 4pt grid is good because everything halves cleanly → consistency.
**Solen today:** 8pt grid in SOURCE §Structure. No codified **section rhythm** value.
**Gap:** Spacing rhythm varies per page (known owner complaint — "inconsistent everywhere"). No named
spacing scale for: between-sections / between-cards / inside-card groups.
**Verdict:** **ADOPT** — codify a 3-tier spacing rhythm (e.g. section 32–40px / card-gap 12px / in-card
group 16px, exact values to be locked from our best existing pages) and sweep to it in Phase 4/5.

### V1.4 Typography (3:17–4:21)
**Claim:** One sans family is enough, ever. "Pro hack": on large text, letter-spacing −2…−3% and
line-height 110–120% instantly looks professional. ≤6 font sizes on marketing pages; on dense
dashboards nothing above ~24px.
**Solen today:** Inter Tight (display) + Inter (body) — two families but one super-family, fine. Heading
tracking −0.01/−0.02em ≈ −1…−2% exists in places; SCORECARD Type says ≤4 sizes ≤2 weights per screen.
**Gap:** (a) tracking/line-height for display text not pinned as a single recipe (drifts per page);
(b) no per-surface max-size rule (owner dashboard uses 28px+ headers in spots).
**Verdict:** **ADAPT** — lock a display-type recipe (tracking −2%, leading 110–120% for ≥22px text) in
LOCKFILE §type roles; add "dashboard surfaces cap at 24px" as a soft rule.

### V1.5 Color: one primary + ramps + semantic (4:57–5:44)
**Claim:** Start with ONE primary (brand) color; lighten for backgrounds, darken for text = the start of a
color ramp (what big companies use for chips/states/charts). "Let the color find you" — announcement bar,
focus state, a green "New" chip. Semantic colors: blue=trust, red=danger, yellow=warning, green=success.
Color for purpose, never decoration.
**Solen today:** This IS our system: Layer 2 single accent, saturation contract (.DEFAULT + .bg/.pale
pairs), Layer 3 semantic table, no-decorative-color rule.
**Gap:** None structural. Minor: our token pairs are 2-step ramps; charts (dashboard analytics) have no
locked ramp.
**Verdict:** ALREADY-HAVE. Optional small ADOPT: a 3-step chart ramp derived from s-accent for dashboard
analytics only.

### V1.6 Dark mode (5:48–6:16)
**Claim:** Dark-mode card/border/saturation adjustments.
**Verdict:** **REJECT — out of scope.** Solen has no dark mode (owner-stated constraint 2026-06-11).

### V1.7 Shadows (6:21–6:49)
**Claim:** Most shadows are too strong — lower opacity, raise blur. Cards need LESS shadow; floating
content (popovers/sheets) needs MORE. Inner+outer shadows can make tactile raised buttons. Litmus test:
"if the shadow is the first thing you notice, you're using it wrong."
**Solen today:** elevation-1/2 tokens + CONTROL_ELEVATION (elevation earned by background). Grey-haze
drift is already a named anti-pattern.
**Gap:** No codified elevation TIER for overlays (sheet/popover/dropdown) vs cards; some sheets ship with
card-level shadows.
**Verdict:** **ADAPT** — add an overlay-elevation tier (elevation-3) to LOCKFILE + CONTROL_ELEVATION;
keep card shadows at current soft values.

### V1.8 Icon sizing + ghost buttons + button padding (6:54–7:27)
**Claim:** Most icons are TOO LARGE. Rule: icon size = the text's line-height (e.g. 15px/24px text → 24px
icon max, usually line-height-matched), then tighten the gap. Sidebar items = ghost buttons (no bg until
hover). Standalone button padding: horizontal padding ≈ 2× vertical.
**Solen today:** LOCKFILE §12 fixed icon sizes for steppers/badges. But general inline-icon-next-to-text
sizing is NOT codified — and "icon sizes are so inconsistent" is a literal owner complaint (2026-06-10).
**Gap:** No icon-to-text pairing table (13px text → ? icon; 15px → ?; list-row leading icon → ?).
**Verdict:** **ADOPT** — codify an icon-size pairing table + ghost-button hover recipe (we already use
ghost rows; name it) + check our button padding ratio against 2:1 (h-pad:v-pad).

### V1.9 Interaction states: every element, every state (7:31–8:04)
**Claim:** Every button needs ≥4 states (default/hover/active-pressed/disabled, often +loading w/ spinner).
Inputs need focus, error (red border + message), sometimes warning. Loading on fetch, success on complete.
"When a user does anything, there should be a response."
**Solen today:** FormFieldError exists; focus = blue ring (locked); CTA disabled styles ad-hoc; loading
states inconsistent (some buttons just freeze); success via SuccessMark on some flows only.
**Gap:** BIG one. No per-component state matrix; many controls lack disabled/loading/pressed definitions.
This is exactly the owner's Phase-4 "every single state" demand.
**Verdict:** **ADOPT** — add a STATES section to LOCKFILE: the 5-state matrix (default/hover/pressed/
disabled/loading) required for every interactive component; mockups in Phase 4 must show the matrix.

### V1.10 Micro-interactions (8:08–8:32)
**Claim:** States alone aren't enough — confirm outcomes. Copy button: hover/press feedback ≠ proof it
copied; a chip sliding up ("Copied") is. Range from practical to playful.
**Solen today:** Motion v2 wants more motion (rise-in, spring-pop, hover-lift, press-scale). Toast exists.
**Gap:** Outcome-confirmation micro-patterns aren't enumerated (copy, save, add-to-cart, favorite).
**Verdict:** **ADAPT** — extend MOTION doc with an "outcome confirmations" list mapped to our existing
primitives (Toast/SuccessMark/heart-pop).

### V1.11 Image overlays: gradient scrims, not full washes (8:37–9:04)
**Claim:** Don't slap a full-screen dark overlay on photos — it kills the image. Use a linear gradient that
keeps the photo visible and converges into a text-readable area; optionally add progressive blur on top of
the gradient for a modern look.
**Solen today:** Salon PDP hero + category cards put text over photos; scrim recipe is per-component
(FROST_GLASS exists for controls, not for text-on-photo).
**Gap:** No locked text-on-photo scrim recipe.
**Verdict:** **ADOPT** — lock ONE scrim recipe (gradient direction/stops, when progressive blur is allowed)
in LOCKFILE; sweep heroes/cards to it.

---

## V2 — "Why the 60-30-10 Rule is RUINING Your UI Designs" (66oOi9OLMCw, 6:37)

### V2.1 60-30-10 is for interiors, not product UI (0:00–0:27)
**Claim:** Product design ≠ 60-30-10. Real products: Vercel ≈ 90% neutral / 8% counter-neutral / 2% accent
(and the accent is sometimes absent). He proposes FOUR layers: neutral foundation → functional accent →
semantic communication → theming.
**Solen today:** Our 80/17/3 + Layer 1/2/3 model is literally this (minus theming).
**Verdict:** ALREADY-HAVE — strong outside validation of the existing model. No change.

### V2.2 Neutral foundation inventory (0:27–2:11)
**Claim:** Backgrounds: ~98–100% white is fine. A product needs ~4 background layers + 1–2 strokes +
3 text variants. App frame/sidebar = slightly darker anchor (Mercury tints theirs 2% blue). Cards on a
washed-out bg: do NOT reach for a thin black border — use a ~85%-white (light grey) stroke that defines
the edge without overpowering. Text: darkest headings ~11% white; body 15–20%; subtext 30–40%.
**Solen today:** bg white + s-bg-sunken #F4F4F5; border #E8E6E4 (≈91% white — in his range); text trio
s-ink/s-ink-2/s-ink-3 = exactly his 3 variants. Our ink #0A0A0A is darker than his 11% (#1C1C1C) — that's
the locked Uber aesthetic, keep.
**Gap:** We never NAMED the neutral inventory as a closed set ("4 bg + 2 stroke + 3 text, no more"). Ad-hoc
neutrals (one-off rgba()s, arbitrary grey opacities) still appear in code — that's the real drift source.
**Verdict:** **ADOPT** — write the closed neutral inventory into LOCKFILE §1 (every grey must be one of the
named ones; drift-checker rule).

### V2.3 Button importance = darkness ladder (1:45–1:58)
**Claim:** "The more important a button is, the darker it is" — ghost → light-grey (90–95% white) →
black w/ white text. Most multi-purpose buttons sit in the light-grey middle.
**Solen today:** CONTROL_ELEVATION A/B/C is this exact ladder (flat sunken / white-bordered / ink).
**Verdict:** ALREADY-HAVE — but adopt the FRAMING ("importance = darkness") as the one-line explainer in
CONTROL_ELEVATION; it's crisper than our current phrasing for choosing between B and C.

### V2.4 Accent as a RAMP, not one color (2:11–2:34)
**Claim:** Never think single accent color — think scale. Main = 500/600, **hover = one step darker
(700)**, links can ride 400/500.
**Solen today:** s-accent #276EF1 + s-accent-pale. **No hover step exists** — blue links/chips have no
defined hover/pressed darkening (desktop hover is undefined for most blue elements).
**Gap:** Real. Hover on blue links today = nothing or opacity hacks.
**Verdict:** **ADOPT** — add `s-accent-deep` (one ramp step darker, exact hex TBD via OKLCH from #276EF1)
for hover/pressed on blue interactive text/chips. Small, surgical, fixes an inconsistency class.

### V2.5 Dark mode palette stretching (3:25–4:27) → **REJECT** (no dark mode, owner constraint).

### V2.6 Semantic layer breaks the system (4:33–4:57)
**Claim:** Color = meaning. Destructive actions are red even if your brand is purple ("design sin"
otherwise). Vercel: B&W brand, yet build status is green/red/amber.
**Solen today:** Layer 3 universal-colors table is exactly this.
**Verdict:** ALREADY-HAVE.

### V2.7 Charts need a perceptually-even spectrum (4:57–5:38)
**Claim:** Neutral charts are "super lame"; a single-brand-ramp chart reads too-similar. Use OKLCH (fixed
lightness+chroma, hue +25–30 steps) for perceptually-equal multi-series colors.
**Solen today:** Dashboard charts (WalkinAnalytics, revenue) are mostly mono/token-colored. Customer side
has almost no charts.
**Verdict:** **ADAPT (dashboard-only)** — define a small OKLCH-derived 4–5 hue chart ramp for the owner
dashboard. Customer surfaces unaffected.

### V2.8 Theming via OKLCH neutral-tinting (5:40–6:14) → **REJECT** — we don't theme; single brand look.


## V3 — "The DEFINITIVE process to present UIs like a pro" (7cTdCu8HMgM, 6:35)

This one is about PRESENTING designs (portfolio shots, client decks), not designing products. Most of it
doesn't belong in a product design system → **REJECT for the system**, but three bits are worth keeping
as PROCESS rules for how mockups get presented to the owner:

### V3.1 Present in realistic context; goal = confidence, not wow (4:09–4:46)
Client presentations should show the design in its real context (device frame, realistic content) so the
client can judge the actual product. → Matches our locked mockup-first rule (copy of the REAL page, real
phone frame, no fake data). **ALREADY-HAVE** — validation of the existing mockup discipline.

### V3.2 Don't describe, SHOW — prototype the motion (5:47–6:13)
Static images can't communicate polish; hidden interactions (swipes, modal entrances, delete sequences)
should be shown working. → **ADAPT (process):** decision mockups for MOTION rules should be animated HTML
(CSS keyframes in the mockup), not static frames + prose.

### V3.3 "Small details sell the entire experience" (5:29–5:36)
Stated about AI mockup scenes, but it's the owner's own "small details matter" directive verbatim.
**ALREADY-HAVE** (as ethos) — Phase 4's every-state mockups are the enforcement.

---

## V4 — "4 UI Design Hacks to KILL boring designs" (SfX43uIubj4, 6:44)

Theme: "modern" has decayed into corporate sterile mush; deliberate playfulness brings designs to life.
This video is the strongest tension-test against Solen's restraint locks — handled claim by claim:

### V4.1 Empty ≠ clearer: context elements communicate the product (0:24–1:13)
**Claim:** Stripping a busy hero doesn't clarify, it deadens. Money/invoice/crypto imagery around the
headline tells you what the product is before you read a word. Decorative-but-meaningful elements
(doodles, product imagery, "twinkles") = context, not clutter — IF text keeps generous breathing room.
**Solen today:** No-decorative-artifacts ban (static dots/pips/filler) + rich-not-bland memory (photos,
profiles, semantic color WANTED). The two already encode "decoration with meaning = yes, junk = no".
**Gap:** Our EMPTY STATES, 404, error pages and onboarding moments are exactly where we're currently
sterile (plain text + maybe one icon). Product chrome shouldn't take doodles (premium Swiss positioning,
owner rejected sparkles), but the "dead zones" can carry personality.
**Verdict:** **ADAPT (scoped)** — personality allowed/encouraged in: empty states, 404/error pages,
success moments, onboarding. NOT in booking/checkout/queue chrome. Needs an owner-approved illustration
language first (mockup question: photo-led vs line-illustration vs typographic).

### V4.2 Off-grid elements must trail toward the focal center (1:30–1:55)
**Claim:** When elements break the grid, arrange them to aim the eye at the center; intensity trails off
with distance from the focal point.
**Verdict:** ADAPT as a one-liner under the Emphasis dimension (only relevant on hero/marketing surfaces).

### V4.3 Pick the vibe deliberately: playful ↔ professional knob (1:55–2:17)
**Claim:** Every site sits on a playfulness spectrum (crypto-blobs ↔ corporate). Choose the position
consciously; everything (imagery, motion, copy) should sit at the SAME position.
**Solen today:** Position is chosen (premium Swiss, Uber restraint, warmth from photography) but never
WRITTEN as a vibe statement.
**Verdict:** **ADOPT** — write the one-paragraph vibe statement into SOURCE §1 (e.g. "premium-warm,
photography carries the emotion; playfulness only in dead zones; never corporate-sterile, never cute").

### V4.4 Motion entrances for hero elements; parallax for depth (2:50–4:05)
**Claim:** Decorative/hero elements deserve characterful entrances (rotate-pop, fly-in + slow bob) instead
of robotic fades; margin elements + subtle scroll parallax = lifelike depth without heavy backgrounds.
**Solen today:** Motion v2 ("treat UI like a movie", rise-in, spring-pop) already points this way; V3-D464
slide+fade on booking steps.
**Verdict:** **ADAPT** — extend MOTION doc with entrance recipes (pop-rotate for badges/marks, fly-in for
hero imagery, stagger for card grids) + permit subtle parallax on home/category heroes only. No
scrolljacking (V5 agrees).

### V4.5 Text storytelling animations (4:08–5:05)
**Claim:** Animate the message itself (word morphs into progress bar, dollar signs bounce in) — Apple Mac
mini style. Draws attention because it moves.
**Verdict:** **REJECT for product UI** (booking funnel focus > theater); allowable someday on the logged-out
home hero as a single staged reveal — park it.

### V4.6 Friendly human copy beats corporate jargon (5:31–5:47)
**Claim:** "We sweat the details" > "we take pride in our attention to detail". Basecamp-style natural
language everywhere.
**Solen today:** Du-form + copy-economy rules exist; voice section in SOURCE.
**Verdict:** ALREADY-HAVE in principle; **ADAPT** — add 2–3 before/after German examples to the voice
section so the register is testable.

### V4.7 404/error pages are the sanctioned playground (5:55–6:23)
**Claim:** 404s are THE place for personality (user doesn't belong there anyway) — quizzes, characters,
gags.
**Solen today:** Default Next 404 / unstyled. A real gap.
**Verdict:** **ADOPT** — design a Solen 404 + error page with brand personality (scoped by V4.1's rule).

---

## V5 — "How to think like a GENIUS UI/UX designer" (HE4rLEQpiXY, 5:31)

### V5.1 Start from user intent, not aesthetics (0:10–1:25)
**Claim:** Genius designers design the user's intent (search → augment with destination/travelers/dates),
then ask of every addition: "does this do anything extra for the user?" Multiple intents (searcher vs
browser) → serve both (search bar + browsable listings + filters).
**Solen today:** Fresha-structure lock effectively encodes this (their IA is intent-tested at scale).
**Verdict:** ALREADY-HAVE via the Fresha axis; keep as the WHY behind structure-lock.

### V5.2 Respect 30 years of layout conventions (1:31–2:10)
**Claim:** Info flows top→bottom, left→right; nav at top; CTAs eye-catching + findable. Uniqueness comes
from micro-interactions and features, NOT from relocating structure.
**Verdict:** ALREADY-HAVE (Fresha structure axis + one-ink-CTA rule). Validation.

### V5.3 Content-first: scannable specifics + imperfect-content structure (2:41–3:32)
**Claim:** (a) List cards carry only what's needed to SCAN: location, rating, price — details live one
click deeper. (b) Design for imperfect content: long names → truncate; icons over bright photos → give
them a contrast circle.
**Solen today:** (a) matches our card anatomy. (b) hero icons have frost-glass discs ✓ but list-card
hearts sit bare on photos in places; truncation ad-hoc (some names wrap 3 lines).
**Gap:** No "imperfect content" rule: max-lines per text role, photo-overlay icons always on a disc.
**Verdict:** **ADOPT** — add a content-resilience rule to LOCKFILE (truncation lines per role + overlay
icons always backed) and include long-content states in Phase 4 mockups.

### V5.4 Animations must add clarity or function (3:32–4:28)
**Claim:** Decorative-only animation is noise (his old portfolio). Good: menu consolidation animating in,
search collapsing to icon, progressive disclosure. **Load-more beats infinite scroll** (control + footer
reachable). Buttons almost always get a small animation; scrolljacking ≈ never.
**Solen today:** "Mehr laden" already shipped (validation!); motion v2 wants buttons alive.
**Verdict:** ALREADY-HAVE mostly; fold "every button gets a micro-response" into the V1.9 states matrix.

### V5.5 A design system is a shared language; break it with intention (4:28–5:14)
**Claim:** Lean teams need lightweight systems; the PROCESS of defining rules is the value; breaking the
system must be deliberate, never accidental.
**Verdict:** ALREADY-HAVE (LOCKFILE philosophy + documented-deviations practice). Validation.

---

## V6 — "7 UI/UX mistakes that SCREAM you're a beginner" (AH_ugxmLeUM, 7:17)

### V6.1 Flow gaps: missing search/skip/hidden states (0:23–1:05)
**Claim:** Preset-option screens need a search/"other" escape hatch AND a skip; the most-missed elements:
nav links, hidden states, hover/micro feedback.
**Solen today:** New hair step HAS skip ✓. But e.g. allergy-style preset pickers (hair pills) have no
"other" free-text — the Notiz field covers it. Some flows still dead-end (no skip on some onboarding).
**Verdict:** **ADAPT** — flow-audit checklist item: every optional step skippable, every preset list has
an escape hatch, every async transition has feedback.

### V6.2 Effects overuse: gradients + harsh shadows (1:06–1:54)
**Claim:** Two-hue gradients = amateur; single-hue if any; usually none. Default drop shadows too harsh —
recolor to light grey, raise blur, or remove. Less visual noise = better design.
**Verdict:** ALREADY-HAVE (B&W chrome, grey-haze ban, elevation tokens). Validation.

### V6.3 Spacing too tight; mobile needs more than you think (1:54–2:45)
**Claim:** Beginner UIs are packed; increase vertical spacing so content groups naturally, especially
mobile.
**Verdict:** Folds into V1.3's **ADOPT** (3-tier spacing rhythm).

### V6.4 Component inconsistency: radii + twin-controls styled differently (2:47–3:33)
**Claim:** Mixed corner radii + identical-purpose controls (back/skip) styled differently = instant
amateur. Fix: ONE radius for all small components; styles for colors, variables for measurements,
components for UI.
**Solen today:** Radius tokens exist (rounded-card 18 / btn 14 / 12 chips) but real pages mix 10/12/14/16/
18/full ad-hoc; twin-control drift is real (e.g. multiple back-button styles existed until the recent
sweep; "Ändern" link styles still vary).
**Verdict:** **ADOPT** — lock the radius scale as a CLOSED set in LOCKFILE §3 (every rounded corner must
be one of: card/btn/chip/pill-full/input — exact px confirmed from shipped code) + drift-checker rule;
"twin controls = same component" rule.

### V6.5 Icons: presence, one library, label ladder, zone consistency (3:33–4:55)
**Claim:** Cards without icons force reading → slower browsing. Mismatched fill/stroke/style = amateur;
use one library with consistent stroke. Famous icons (house/bookmark/user) need no label; unusual ones
need a tooltip/label. Different icon styles CAN coexist if in visually separate zones.
**Solen today:** Lucide-only is locked; icon/label ladder is in CLAUDE.md copy rules; stroke width mostly
1.9–2.
**Gap:** Stroke width + size pairing not pinned (combines with V1.8's table).
**Verdict:** Fold into V1.8 **ADOPT** (icon table: size pairing + strokeWidth standard + ladder).

### V6.6 Redundant elements (4:55–5:30)
**Claim:** Kill arrows that duplicate swipe, decorative strokes, "stuff everywhere".
**Verdict:** ALREADY-HAVE (delete-test, no-decorative-artifacts). Validation.

### V6.7 Interactive feedback on slow transitions (5:30–6:20)
**Claim:** Button → next screen lag with zero feedback looks broken; grey-out on press, spinner if long;
saving should both fill the icon AND badge the destination tab (system-level feedback).
**Verdict:** Folds into V1.9 **ADOPT** (states matrix + outcome confirmations). The "badge the
destination" idea maps to our heart→Favoriten and cart→pill moments.

### V6.8 Charts: legible beats pretty (6:22–6:58)
**Claim:** Dribbble charts (no axis, rounded bar tops, 16 bars for 7 days) are unreadable; simple charts
convey more.
**Verdict:** **ADAPT (dashboard-only)** — chart legibility rule: visible axis labels, flat bar tops, bar
count = data count. Pairs with V2.7's OKLCH ramp.


## V7 — "The 8 UI/UX Cheat Codes for INSTANTLY Better Designs" (c1TvOcKdBVE, 8:06)

### V7.1 Kerning on large text (0:21–1:07)
**Claim:** Above ~70–80px, default letter-spacing falls apart; −2…−4% fixes it. (Same family as V1.4.)
**Solen today:** We rarely exceed 40px; our display recipe (V1.4 ADAPT) covers it.
**Verdict:** Fold into V1.4 — one display-type recipe with a size-graded tracking note.

### V7.2 Nested corner radii (1:08–2:30)
**Claim:** A rounded element INSIDE a rounded container must use a smaller radius: inner = outer − gap
(30px outer, 10px gap → 20px inner). Otherwise corner distance visibly bulges. Pills are exempt.
iOS corner smoothing (squircle) is a subtle pro upgrade.
**Solen today:** NOT codified anywhere — and we nest constantly (thumbnails in cards, chips in cards,
inputs in sheets). Spot-checks show violations (e.g. 12px thumb inside 18px card with 16px padding =
should be ~2–6px… we ship 12px).
**Verdict:** **ADOPT** — add the nested-radius formula to LOCKFILE §3 radius section. High-leverage
"small detail" exactly in the owner's spirit. (Squircle smoothing: REJECT — CSS can't do it cleanly;
not worth hacks.)

### V7.3 HSB-derived surface palette (3:00–4:28)
**Claim:** Build derived surfaces from a base by +20 saturation / −10 brightness steps, shifting hue
toward blue for darker variants (hue-shifted ramps).
**Solen today:** Saturation contract handles our ramp needs; neutrals are locked cool-grey.
**Verdict:** ALREADY-HAVE equivalents; no change (OKLCH approach from V2.7 is the better tool anyway).

### V7.4 Card layout: kill labels, group, rank, icon the details (4:28–5:25)
**Claim:** "Label: value" spreadsheet cards are lame. Drop labels (good UI implies them), group like
items (name+location stacked; price+rating right-aligned), rank by importance, put details in one
icon-led row, keep labels ONLY where genuinely ambiguous (check-in vs check-out).
**Solen today:** Our salon cards do this ✓ but several surfaces don't: profile rows, dashboard booking
rows, voucher/package cards still carry "Label: value" pairs.
**Verdict:** **ADOPT** — codify the card-anatomy recipe (group → rank → de-label → icon details row)
as the universal card grammar; Phase 4 sweeps the offenders.

### V7.5 Lose the lines (5:25–6:05)
**Claim:** Dividers are usually redundant; whitespace separates better. Tight tables → alternating row
tint, not lines. "The fewer elements to get your point across, the better."
**Solen today:** Mixed: recent reviews redesign removed dividers ✓; many lists still use border-t rows
(e.g. PayConfirm summary rows use hairlines deliberately).
**Gap:** No rule for WHEN hairline vs whitespace vs alternating tint.
**Verdict:** **ADOPT** — divider decision rule: whitespace first; hairline only when rows are dense
multi-line clusters (receipt-style); alternating tint only for true tables (dashboard).

### V7.6 Spacing: 4/8 grid + round big sizes (6:05–6:45)
**Claim:** 8px base for small elements; for large dimensions round to clean 5/10s — "120 vs 128 doesn't
matter".
**Verdict:** Folds into V1.3 spacing-rhythm ADOPT.

### V7.7 Tinted (non-pure) backgrounds (6:47–7:28)
**Claim:** Use a very light tint of your accent as the page background instead of pure white/black
(GitHub's near-navy, Tailwind 50-value trick) to fold brand color into the design.
**Solen today:** Surfaces are LOCKED white + cool grey #F4F4F5 (owner explicitly killed cream 2026-06-10;
Uber aesthetic).
**Verdict:** **REJECT for global surfaces** (direct conflict with a fresh owner lock). Existing
s-accent-pale stays for small semantic/selected surfaces only.

### V7.8 Dark-mode layered depth (7:28–7:52) → **REJECT** (no dark mode).

---

## V8 — "Master the 3 Types of CRAZY Mobile UI Swipe Interactions" (14h1VnkQvIc, 5:53)

Platform reality check first: Solen is a mobile WEBSITE. No haptics, no native gesture system; swipe
support = what the browser gives us. Several of these are native-app theater → filtered hard.

### V8.1 Easing is the soul of motion: never linear (0:29–1:00)
**Claim:** Open up the easing curve, add momentum/bounce; easing communicates tone (snappy vs springy
vs smooth). Almost never linear.
**Solen today:** §4 glide curve [0.16,1,0.3,1] + spring-pop already locked.
**Verdict:** ALREADY-HAVE. Validation of motion v2.

### V8.2 Carousels: momentum + live indicators (0:29–1:22)
**Claim:** Horizontal card swiping beats vertical stacking on phones; add position indicators that react
fluidly ("magnetic" dots) rather than dead highlights.
**Solen today:** Horizontal scrollers exist (photos, categories) with scroll-snap; NO position indicators
anywhere.
**Verdict:** **ADAPT** — add a minimal indicator recipe for image galleries only (PDP hero gallery,
review photos): small dots, active dot stretched, CSS scroll-driven where possible. No 3D ring/horizon
effects (V8's skew theater) — REJECT, off-brand.

### V8.3 Duality: every gesture has a visible-button twin (1:42–2:06)
**Claim:** Swipes are fast for the initiated; ALWAYS provide a button path for the same action (Gmail:
swipe-to-delete AND tap→delete).
**Solen today:** Few gestures exist; where sheets dismiss by tap-outside we also have the circled X ✓.
**Verdict:** **ADOPT** as a one-line accessibility rule: no gesture-only actions, ever (also a11y/
desktop-web requirement).

### V8.4 Between-page continuity: shared-element expansion (2:50–4:13)
**Claim:** Page transitions where the tapped card EXPANDS into the next screen (image zooms into the new
hero) feel seamless; motion follows the swipe/tap direction; content fades up+in after.
**Solen today:** V3-D464 slide+fade exists between booking steps; route changes are hard cuts.
**Verdict:** **ADAPT (flagship moment, one place):** salon-card → PDP transition via the View Transitions
API (Next.js supports it; progressive enhancement, zero JS cost where unsupported). This is the single
highest-impact "app-like" upgrade available to a website. Everything else stays slide/fade.

### V8.5 Sheet physics: swipe-down dismiss + background response (4:48–5:11)
**Claim:** Bottom sheets should dismiss by swipe-down (with button fallback); the background subtly
zooms/shifts back when a sheet opens and reverses on close.
**Solen today:** Sheets exist (sort sheet, language sheet) — tap-outside + X dismiss; NO drag handle/
drag-to-dismiss; background is statically dimmed.
**Verdict:** **ADOPT** — drag-to-dismiss + grabber handle on all bottom sheets (standard web-app
pattern, expected on mobile). Background zoom-back: ADAPT as optional subtle scale(0.98) — mock it up,
owner judges.

### V8.6 Slide-to-confirm for irreversible actions (5:11–5:32)
**Claim:** For high-impact actions (send email, buy crypto), a slider beats a button because it can't be
fat-fingered.
**Solen today:** Pay CTA is a button (Stripe flow); destructive confirms use dialogs.
**Verdict:** **REJECT** — web slider widgets are clumsy + poor a11y; our confirm-dialog pattern covers
the safety need. Not worth the friction.


---

# SYNTHESIS — the consolidated change list

56 minutes of video boil down to **12 adoptable changes**, 3 outright validations, and 6 rejections.
Numbered as DS-1…DS-12; mockups in Phase 2 carry these IDs.

## A. New rules to ADOPT (gaps the system genuinely has)

| ID | Rule | From | Where it lands |
|----|------|------|----------------|
| **DS-1** | **Interaction-states matrix** — every interactive component defines default / hover / pressed / disabled / loading; every async action shows feedback; outcome confirmations (toast/fill/badge-the-destination) enumerated | V1.9, V1.10, V6.7, V5.4 | LOCKFILE new §13 + Phase-4 mockups |
| **DS-2** | **Icon system table** — icon size paired to text size (icon ≈ text line-height, never bigger), strokeWidth standard, label ladder (famous icon = no label; unusual = label/tooltip), zone consistency | V1.8, V6.5 | LOCKFILE §12 extension |
| **DS-3** | **Closed neutral inventory** — the ONLY greys: 2 backgrounds + 2 strokes + 3 text inks; ad-hoc rgba/grey = drift | V2.2 | LOCKFILE §1 + drift-checker |
| **DS-4** | **Radius scale lock + nested-radius formula** — closed radius set (card/btn/input/chip/pill); inner radius = outer − gap when nested; twin controls = same component | V6.4, V7.2 | LOCKFILE §3 + drift-checker |
| **DS-5** | **3-tier spacing rhythm** — one locked value each for: between sections / between cards / inside-card groups; mobile gets MORE air, not less | V1.3, V6.3, V7.6 | LOCKFILE §3 / SOURCE §5 |
| **DS-6** | **Accent hover step** — `s-accent-deep` (one ramp step darker than #276EF1) for hover/pressed on blue links/chips; blue stays sparse, but alive | V2.4 | tokens + LOCKFILE §1.5 |
| **DS-7** | **Card grammar** — group like items → rank by importance → drop "Label:" pairs (UI implies) → one icon-led details row → labels only where ambiguous; every card has ONE differentiated element; images whenever honest | V7.4, V1.2 | SOURCE §14 pattern |
| **DS-8** | **Divider decision rule** — whitespace first; hairlines only for dense receipt-style clusters; alternating tint only in true tables | V7.5 | SOURCE §14 |
| **DS-9** | **Content-resilience rule** — max-lines + truncation per text role; icons over photos always on a backed disc; long-content states are mandatory in mockups | V5.3 | LOCKFILE + Phase-4 checklist |
| **DS-10** | **Text-on-photo scrim recipe** — one locked gradient recipe (+ progressive-blur variant), no flat full washes | V1.11 | LOCKFILE §11 imagery |
| **DS-11** | **Sheet physics** — all bottom sheets get grabber + drag-to-dismiss (+ button twin); no gesture-only actions anywhere; optional background scale-back (mockup decides) | V8.5, V8.3 | components/Sheet.md + MOTION |
| **DS-12** | **Personality zones** — 404 / error / empty states / success moments are the sanctioned playground (within brand); product chrome stays restrained; vibe statement written down | V4.1, V4.3, V4.7 | SOURCE §1 voice+vibe |

## B. ADAPT (smaller, scoped)
- **DS-A1** Display-type recipe: tracking −2%, line-height 110–120% for text ≥22px; dashboard caps at 24px (V1.4, V7.1).
- **DS-A2** Overlay elevation tier (sheets/popovers above cards) in CONTROL_ELEVATION (V1.7).
- **DS-A3** Dashboard-only chart rules: OKLCH 4-hue ramp + legibility (axis, flat tops, bar=datum) (V2.7, V6.8).
- **DS-A4** Motion entrance recipes + gallery position-indicators + ONE shared-element flagship (salon card → PDP via View Transitions) (V4.4, V8.2, V8.4).
- **DS-A5** Voice examples: 2–3 before/after German pairs ("human, not corporate") (V4.6).
- **DS-A6** Flow-audit checklist: every optional step skippable, preset lists get an escape hatch (V6.1).

## C. Validated as-is (no change — the videos AGREE with our locks)
- 80/17/3 + Layer 1/2/3 model ≈ his "four layers" (V2.1) ✓
- Button importance = darkness ladder ≈ CONTROL_ELEVATION ✓ (adopt the phrasing only)
- Restraint set: no two-hue gradients, soft shadows, delete-test, load-more>infinite, Fresha-structure conventions, semantic color discipline ✓

## D. REJECTED (and why — so we never relitigate)
1. Dark mode anything (V1.6, V2.5, V7.8) — Solen has no dark mode. Owner constraint.
2. Blue/colored PRICES (V1.2) — blue means tappable here; data stays ink. Owner lock 2026-06-10.
3. Tinted global backgrounds (V7.7) — surfaces locked white + cool grey; cream killed 2026-06-10.
4. Text-storytelling hero animations (V4.5) — funnel focus; parked for a future logged-out hero.
5. 3D ring/horizon swipe theater (V8.2) — native-app demo candy, off-brand for premium Swiss web.
6. Slide-to-confirm (V8.6) — poor web a11y; confirm dialogs already cover it.
7. Bottom nav bar / haptics — not in the videos as claims we adopted, but restating: WE ARE A WEBSITE. Never.

