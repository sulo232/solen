# Solen.ch

Swiss beauty + wellness booking marketplace. Next.js App Router + Supabase + Stripe. Deploy: **Netlify** (auto from `main`). Cron via GitHub Actions (`.github/workflows/cron-jobs.yml`). i18n: de / en / fr / it.

---

## 🗺️ Before you BUILD, MOCK, or REDESIGN anything — check what already exists (V3-D440, 2026-06-02)

Run **`npm run exists <keyword>`** BEFORE creating any page / endpoint / component / migration / lib util. A hit → REUSE or EXTEND. Empty → safe to build new. Read `_inventory/STATUS.md` on a hit (partial / deprecated flags). DB tables+columns come from the LIVE snapshot (`_inventory/_db-snapshot.json`), NOT migration files. Full inventory: `_inventory/SURFACE.md`. Hook-enforced: PreToolUse blocks new `page.tsx`/`route.ts`/migration until `exists` ran this turn (override: `touch .claude/exists-skip.flag`).

---

## 🏁 Finish the job — do NOT report-and-wait (V3-D444, 2026-06-07)

Given a multi-step task or a list, **finish it.** Do not stop after each step to report and wait for "ok" — that wastes the user's turns and is a top recurring complaint. Keep going until the work is actually done, THEN report once.

Pause mid-task ONLY for (the **dependency test**):
- a **BLOCKING** decision only the user can make: a real fork that is a *dependency of the remaining work*, so continuing would mean building on a guess (the #1 failure mode), or
- a **design / taste choice that needs a MOCKUP** for the user to react to, or
- a destructive op, a credential, or an irreversible external side-effect.

**Park non-blocking decisions, do NOT stop for them.** If a decision affects only the current item's polish or a later *independent* task, PARK it: append it under the "Unplanned additions" / parked section of `_plans/ACTIVE.md`, keep going on the rest, and SURFACE every parked decision in your closing report. Only a decision that BLOCKS the next task is a hard stop.

Everything else (mechanical edits, sweeps, enforcement wiring, verification, applying an already-decided spec) = keep going to completion. **"ok" / "continue" / "go" means finish the list, not do one item.**

---

## 🎯 Taste rules: the 10 I most often get wrong (V3-D441, 2026-06-07)

**Why this block exists:** SOURCE.md + LOCKFILE hold the full system, but they're 80KB+ and I don't re-read them before a small edit, so I drift. These ten are what my own correction history shows I break most. They live HERE because in-context beats buried. The machine-checkable ones (hex, retired tokens, dead clicks, arbitrary color, durations) are now **enforced** by a PreToolUse gate (`.claude/hooks/pre-edit-drift-gate.sh`) that BLOCKS the edit; the taste ones still need judgment every time.

1. **No fabricated data.** Never render a number / status not wired to a live source: no "Frei in 15 Min", fake ratings, fake counts. Omit the element and flag it for wiring. A fake value is worse than a dot, it's a lie the user trusts.
   **SEEDING THE DATABASE IS NOT FABRICATION, IT IS THE FIX** (owner 2026-08-02), and it is the expected move whenever a real section renders empty for lack of rows. The line is the SOURCE, not who typed the values: a row the UI reads through its normal query is a live source, whoever inserted it. What stays banned is a value with NO source, hardcoded into a component or invented in JSX. **This rule may never again be cited as a reason NOT to seed.** Seed first, then check the section renders. (History: CLAUDE_HISTORY.md)
2. **No decorative artifacts.** No separator / status dots (`•`, colored pips), no redundant filler ("· Walk-in", repeating the price already shown above the CTA). Every element carries information or it gets deleted. And when two adjacent bits already differ by colour or weight (e.g. green "Geöffnet" + ink "bis 19:00"), that contrast IS the separator, do NOT add a `·` between them too.
3. **80 / 17 surfaces+ink; blue is SPARSE (small clickable bits ONLY).** ~80% neutral surfaces (white + COOL sunken `#F4F4F5`, no warm cream), ~17% ink (`#0A0A0A` + greys + hairlines + photos). Blue `s-accent #276EF1` goes ONLY on small clickable accents: **text links** ("Buchung verwalten", "Mehr lesen"), **small buttons / chips**, **small tappable metadata** (review counts "(54)"). NOT on big CTAs, NOT on see-all **arrows** (those stay ink/black), NOT on secondary buttons (neutral outline), NOT on body/labels/prices/headings/eyebrows. Clickability on structure is signalled by AFFORDANCE (chevron / underline-on-hover / weight / icon), not colour. The one primary/commit CTA stays ink (`bg-s-ink`). **LOCKED 2026-06-10.** This is a deliberate MINORITY position: Apple, Material, Carbon, Atlassian and Airbnb all put the brand colour ON the primary button, and only Fresha matches us. (History: CLAUDE_HISTORY.md) Selected/active states stay blue ONLY for the calendar date/slot fill. FILTERS ARE NEUTRAL, NOT BLUE: pill / chip / sort segment / price slider / filter button, selected = `bg-s-bg-sunken` gray fill + `text-s-ink` + semibold, no blue, no focus ring (owner 2026-06-29, reconfirmed 2026-07-01; supersedes the V3-D450 blue-filter-pill).
4. **Semantic color is independent of the interactive-blue accent. CONTRAST BOUNDS ADDED 2026-07-28, computed twice independently (mine and a research lens, identical to 2dp).** Every semantic hue has a legal ROLE and an illegal one, and the rule never said so, which is the actual defect. Against white / against the sunken tray `#F4F4F5`: star `#FFC32B` **1.60 / 1.46**, warning `#F1AE27` **1.94 / 1.77**, success `#16A34A` **3.30 / 3.00**, heart `#FF3366` **3.55 / 3.23**, accent `#276EF1` **4.58 / 4.17**, error `#DC2626` **4.83 / 4.39**. So: star and warning FAIL even the 3:1 graphical floor, they need a stroke or a darker companion when they must carry meaning alone. Success and heart are legal as ICONS, never as body text. Accent blue and error red pass on white and **FAIL AA text on the sunken tray**, which our own Edge-Visibility floor promotes as the default list surface, so neither may be body text on sunken. Measured live: 7 elements carry blue-on-sunken, 72 sites use green as text. WCAG AA is tier 2 statutory in the precedence chain, above taste at tier 5.** Elements with universal meaning keep their hue: star `#FFC32B`, success/confirmation = **normal green `#16A34A`** disc + white check (NOT deep `#15803D` — dark green rejected 2026-06-10; inline status chips may stay pale-green), availability green, error red, save-heart `#FF3366`. Blue is a small clickable accent only (links / small buttons / review counts) — NOT prices, NOT big CTAs; prices stay ink/grey. Don't monochrome a semantic element to ink to "stay on brand."
5. **No muted focal fills + coherent emphasis.** Never use a dark `.text` token (`#906309`, `#9A3412`) as a FOCAL fill, it reads muddy. Focal = a vivid `.DEFAULT` token or surcharge orange `#EA580C` on a light tint bg. Surcharge is orange, not blue. And emphasis (weight or colour) maps to a WHOLE meaningful unit, never an orphan sub-token: bolding/colouring just the "65" but not the "from / CHF" reads as a glitch, not a decision. A card may carry two ink elements (name + price) only if the NAME is larger, so size, not colour, marks the anchor (V3-D442, amends A13).
6. **Refined pastel, never screamy.** Inline status chips/badges = pastel `.bg` + ink text + saturated icon (Stripe / Vercel restraint), not a saturated solid block. The success/confirmation disc = **normal green `#16A34A`** + white check (NOT deep `#15803D`, NOT a pale tint).
7. **Elevation is earned by the background, not the button.** One primary commit → ink fill; a control over a photo → frosted glass (`FROST_GLASS`, `lib/frost-glass.ts`); a calm control on white / stone → FLAT, no shadow. White + shadow on a calm surface is the banned grey-haze.
8. **Fonts:** Inter Tight (display / headings) + Inter (body) + Inter Tight tabular for codes (`font-variant-numeric: tabular-nums`, LOCKFILE §13.4; JetBrains Mono RETIRED V3-D470 2026-06-10, owner: "the W-047 font is different"). **Never Geist.**
9. **Ground in the system; don't invent.** Pull size / affordance / selected-state from a LOCKED component (avatar size from SalonTeam, selected = ink-border). Don't eyeball or invent hex / sizes / copy. "Too heavy / too small" = refine the existing affordance, don't replace it. When a value isn't locked, ASK, don't fill from memory.
10. **No em-dashes; emoji chat-only.** No `—` / `–` anywhere in UI copy, code, comments, or commits (use period / comma / colon / parentheses / spaced hyphen). Emoji + playful tone live in chat replies only, never in shipped code or files.

Full system lives in `_design-system/SOURCE.md` (canonical) + `LOCKFILE.md` (frozen literals); on an aesthetic conflict, LOCKFILE wins. Screen-by-screen taste decisions elicited with the founder are logged in `_design-system/TASTE_LOG.md` (read it before design work on a covered surface, so a settled call is never re-litigated).

---

## 🚫 NEVER-AGAIN design floors (owner 2026-07-21 "make it so these never happen again")

The recurring look-mistakes the owner keeps catching AFTER they ship. These are MEASURED floors, not vibes. Run the check (getBoundingClientRect / computed styles / the gate) on EVERY UI you build or mock, BEFORE you ship, not after. The design-verifier grades against these; two are also wired gates.

1. **WEB = ONE LIGHT THEME. No dark mode, ever.** No `prefers-color-scheme:dark` / `data-theme="dark"` / dark-mode CSS in any web file (mockup, analysis page, component, globals). It renders BLACK; rejected twice (2026-07-16, 2026-07-21). `tailwind.config.js` darkMode removed Q62. **GATE: `~/.claude/hooks/white-only-web-gate.py`** (self-tested 5/5). iOS (`solen-mobile`) keeps dark mode; web never.
2. **≤ 4 distinct font sizes AND ≤ 2 distinct weights on one screen** (size floor 3). Measure with getBoundingClientRect on the RENDERED page. The /profile split shipped with **6** sizes (22/16/15/14/13/12) and read busy with no anchor. Collapse redundant sizes. (The weight half was missing from this line until 2026-07-27; it has always been law in LOCKFILE §12 , "≤4 distinct sizes and ≤2 weights" , and the type-budget gate has always enforced both, so a screen at 4 sizes / 4 weights was never actually compliant.)
3. **Empty states = ONE vertically-centred unit** (icon + message + CTA together, message→CTA gap ≤ 24px). NO floating CTA with a big trapped gap below it: **trapped dead space below the primary action must be < 30% of the viewport**. The payment empty state shipped with the CTA at 54% down and **46% dead space** below + an 80px message-gap. Centre the cluster.
3b. **Dense-screen mirror of floor 3 (hierarchy-density-06, added 2026-07-27).** Floor 3 bounds dead space when a screen is too SPARSE; the identical failure exists in the opposite direction once a screen is dense: a screen that correctly hits every density-floor minimum (services >= 6, reviews >= 3) but stacks all of it above the commit button with no sticky bar has a buried CTA. On any screen with a single primary commit action (Buchen, Bezahlen, Weiter), the action must be reachable via a sticky/fixed bottom bar OR must appear within roughly one additional viewport height of scroll from the point all required inputs are satisfied, regardless of how much content precedes it. A sticky-CTA component already exists per-surface (`SalonMobileBookBar` for the PDP, the booking-flow running-summary bar per `RESTRAINT_TEST.md`); this floor generalizes the requirement to EVERY commit-bearing screen, not just those two.
4. **No muted focal.** An empty-state / focal icon is a clean ink or a vivid `.DEFAULT` token, NEVER a washed-out gray disc or a dark `.text`-token fill (taste rule 5). The payment icon shipped as a gray-disc blob.

5. **A reference is MEASURED, never eyeballed.** When a mockup is built from a reference screenshot (IMG_xxxx, "like the reference"), run pixel-spec-auto (`extract.py`); if it fails on borderless cards, PIL pixel-sample the reference directly, then MATCH the measured px/pt (avatar, tile w:h ratio, gutter, font sizes), and cite them in a `measured:` note. The profile shipped with a 40px avatar (measured 26pt), square tiles (measured 1.15:1), 160px suggestion tiles (measured 114pt) , all eyeballed. **GATE: `~/.claude/hooks/reference-measure-gate.py`** (blocks a reference-derived mockup with no measured sizes; self-tested 5/5).

Enforcement chain: (a) the static ones (1, 5) are wired gates; (b) 2-4, 3b are render-time, so the design-verifier MUST run on every customer UI and grade against these numbers (3b = measure scroll distance from last required input to the CTA, not easily a static gate since it depends on content volume at render time), and skipping design-verify without rendering is banned (design-verify-gate proof-of-looking); (c) YOUR own pre-ship measured self-check is the first line. A UI that trips any of these is not shippable.

---

## 🌊 FLOORS LAW (owner-approved 2026-07-21, from UNFINISHED_AUDIT_2026-07-21)

The audited root cause of "compliant but unfinished": this system had only CEILINGS (never "too much") and no FLOORS (never "too little"), so the compliance-optimal screen was the emptiest one. These floors are CO-EQUAL with the 10 taste rules. Restraint without a life source is a FAIL, not a style. Full audit + evidence: `_design-system/research/UNFINISHED_AUDIT_2026-07-21.md`.

1. **The finished-screen pass (all 6 = Pass before any customer screen/mockup ships):** (a) a photographic focal is present; (b) exactly ONE element is clearly the biggest; (c) at least one tabular/real number; (d) at least one semantic-color moment; (e) no dead-grey zone; (f) worst-case content holds (hierarchy-density-08, LOCKFILE §17.5 item 6): the longest real/plausible salon name, a full-length review, and a maximally long service name must not break the two-ink-anchor card rule, the >=28px display anchor, or truncate load-bearing copy. This is NOT the generic verifier-loop's optional "long content (only when in scope)" bullet, it is a hard gate item here. A mockup carries a `floors:` note answering all six.
2. **Imagery presence floor , SATISFIED BY CONTENT, NEVER BY DECORATION (clarified 2026-07-25 after a THIRD owner rejection).** Owner verbatim: *"no other company has just image hard coded baked into a random area... what we need to do is SHOW OFF THE STORES THAT WE HAVE, not just some random image."* This floor is a CONTENT-DENSITY rule wearing a percentage. It is met by surfacing more real salon content higher up (more cards, bigger cards, the real feed earlier), and it is NEVER met by adding a hero photo, a banner, or any image whose src is baked into a component. A static image on a Solen surface is decoration, and decoration is rejected by name. Gate: `~/.claude/hooks/no-decorative-image-gate.py` blocks a hardcoded `src`; data-driven `src` passes. Original wording: every customer browse/discovery/PDP viewport at 390x844 (corrected 2026-07-25, was 375x812 , reconciled to match the LOCKFILE EMPHASIS BUDGET measurement viewport and what `check-geometry.mjs`'s FLOORS pass actually renders at) carries roughly >= 1/3 photographic area; the photo is the largest element of every SalonCard. A photo-first surface NEVER renders a bare grey box , a missing photo gets the spec'd fallback (sunken bg + category icon + initial), never slot-omission. Mockups pull real seeded photography; a zero-imagery customer mockup auto-fails. Exempt BY NAME: forms, checkout payment step, legal, receipts.
3. **Density floor (the populated state is the design target):** spec + mock at IDEAL density from SEED data (seed = real wired data, satisfies no-fabrication): PDP gallery >= 5 photos, reviews >= 3 visible, services >= 6 rows, home feed >= 4 sections; a populated list/grid first viewport shows >= 4 content units mobile / >= 6 desktop plus a visibly cropped next item (the scroll promise); a card renders its FULL info stack whenever the data exists , omission is legal only for null data, never for minimalism. Loading/empty/error DERIVE from the populated layout, not the reverse. Boundary: dead-affordance + no-fabrication bind production and current-state mockups; a TARGET-state mockup renders full seeded content + a one-line footer naming what is not yet wired. **RICH-DATA CEILING (hierarchy-density-03, paired with the floor above):** once real content passes roughly 3x these numbers (80+ services, 100+ reviews, 40+ gallery photos, the shape a mature salon reaches post-launch, not a seed fixture), never render the full set inline uncapped , group services by duration/category tier, cap reviews to most-recent-plus-a-star-distribution beyond 12 visible, cap an inline gallery grid at 12 photos behind a lightbox for the rest. A wall of 300 undifferentiated reviews is exactly as much a wireframe-signal as an empty screen, just via the opposite mechanism.
4. **Edge-visibility + warmth floor:** every elevated container needs a perceivable boundary against its ACTUAL background , (a) sit on `s-bg-sunken`, (b) flush photo edge, or (c) on white keep the hairline OR step to elevation-2; a white card with only a 4% shadow on white is invalid. Grouped/list/panel content on white with no photo anchor REQUIRES the sunken tray; alternate gray and white down a page for rhythm. Cool chrome is legal only when photography OR a semantic-color moment shares the viewport , zero warm/chromatic pixels outside pure chrome = the dead-grey FAIL.
5. **Deletion names what it keeps:** any rule that deletes an element (copy economy, divider ladder, de-label) must state what the screen KEEPS; the deletion is legal only if the surviving cue passes a measured floor (between-group gap >= 2x in-group gap, or a full weight/size/color step). Every NEW ceiling rule added to this system must name its floor or state none exists.
6. **Display anchor:** every customer screen carries one display anchor >= 28px unless the photograph is the focal. Card emphasis = the V3-D442 two-anchor rule: name (larger, 600) + price (600, tabular); rating value ink-2 beside the yellow star; card titles are s-ink, not grey. Tertiary grey #9CA3AF (s-chart-2) is CHART-ONLY (secondary/tertiary data-vis rows, per LOCKFILE §1), never text of any kind (accessibility-05, 2026-07-27: computed contrast is 2.54:1 on white / 2.31:1 on `s-bg-sunken`, below WCAG 1.4.3 even at the large-text 3:1 floor, so no font size makes it legal for prose). Chevrons, placeholders, timestamps, and hints use `s-ink-2` (#6B6B6B, 5.33:1 on white / 4.85:1 on `s-bg-sunken`, both AA) instead , that is the one token this system authorizes for non-load-bearing text, and it stays forbidden on load-bearing copy same as before.

8. **THE SAME THING LOOKS THE SAME EVERYWHERE (added 2026-07-29, and it is the rule this system never had).** Grep the floors above and every one scopes itself to ONE screen: "per screen" x5, "per customer screen" x3, "on one screen" x2, "per surface" x2, "every customer screen", "the RENDERED first viewport". A search for a rule binding one screen to ANOTHER returns nothing. That is the hole. **A screen can pass every rule in this document and still not match any other screen, because consistency is a RELATIONSHIP and this system had no vocabulary for relationships.** Measured proof, the same salon rendered on two live surfaces the same minute: on `/de` it is one photo at a 5/4 ratio, 22px radius, name 14px/500, price shown; on `/de/profile` it is a three-photo collage at 195/131, a different radius, no price. Two different objects for one entity, and both surfaces pass every floor. THE RULE: an entity that appears on more than one screen renders through the SAME component with the same anatomy. If two screens need different densities, that is a documented VARIANT of one component, never a second implementation.

9. **SCREENS ARE COMPOSED, NOT DRAWN (added 2026-07-29).** Nothing in this document, or in COMPONENT_REGISTRY.md, ever says a screen must be BUILT FROM the components we own. The registry governs creating a NEW component; the exists-check protocol fires on new routes, pages and migrations. Neither fires on re-implementing an existing component inline, which is where the drift actually lives. Measured 2026-07-29: NINE files hand-build their own salon card, SEVEN use the real `SalonCard`; `ProfileTabs.tsx` imports two system components and hand-writes the rest. THE RULE: if the registry owns it, compose it. Hand-drawn UI in a page or feature file is a defect regardless of how good it looks, because a copy inherits none of the system's decisions and then drifts alone. Enforced by `~/.claude/hooks/use-the-registered-component-gate.py`.

10. **EVERY ELEMENT MUST BELONG TO THE SCREEN'S JOB (added 2026-07-29).** The floors say what must be PRESENT (imagery, an anchor, density, a trust breakdown). Nothing asks whether an element has any business being there at all. Taste rule 2 is close but it targets DECORATION, not misplacement. The case: the owner asked why his own profile has a search bar. It has one because a search bar was easy to add, not because anyone searches their own saved list. THE RULE: name the screen's job in one sentence, then justify every element against it. An element that serves a different screen's job is cut, however well built it is.

7. **EMPHASIS BUDGET (added 2026-07-25, from the measured flatness diagnosis).** The system had a size CEILING (<=4 sizes) but no RANGE FLOOR, so every element landed in the same middle band and the screens read flat/beta. Measured on the live PDP on 2026-07-25: 86% of visible text was weight >=600 and the largest text was 1.57x the body. **RE-MEASURED 2026-07-28 and BOTH numbers are now stale: the same PDP renders 17.6% at weight >=600 (16 of 91 elements) and its anchor is 30px at 1.88x body, clearing both floors.** The page was fixed after the rule was written. Keep the rule, it is a ceiling and ceilings stay useful once you are under them, but do NOT repeat "our PDP is at 86%" as a current fact, and do not "fix" an anchor that already passes. Calibration from the reference, measured the same day: Airbnb's PDP is 3.1% at weight >=600 (7 of 388) and carries its emphasis at weight 500, so the real target sits far below 30 rather than just under it. Floors, per customer screen, measured on the RENDERED first viewport:
   (a) **at most ~30% of visible text may be weight >= 600.** Emphasis is a signal; when most text carries it, it stops encoding anything (Nielsen: emphasize everything, nothing gets focus). **PROVENANCE, corrected 2026-07-28: the 30% is a HOUSE NUMBER with no external citation.** The qualitative principle is real and sourced (NN/g, "Prioritize: Good Content Bubbles to the Top"), the threshold is not. It was chosen because the PDP measured at 86% and any number materially below that stops the bleeding. Worth naming bluntly: RESEARCH_METHOD R5 had already debunked the sibling claim ("5 to 10% of a page should be bold") as having no study behind it, and this block then minted a different unsourced number for the same underlying idea. Keep the gate, it does real work, but never cite the 30% as evidence.
   (b) **the screen's anchor must be >= 1.8x its body size.** A 1.5x step reads as a rendering wobble, not a hierarchy. **PROVENANCE, corrected 2026-07-28: this is not an independent law, it is the 28px anchor in floor 6 restated over this product's 16px body (28/16 = 1.75, rounded).** The 28px itself IS convergent (Apple Title 1 = 28pt, Material Headline Medium = 28sp, two competing platform systems landing on the identical number for the same tier), so the ratio is grounded, just derived rather than discovered. Named classic modular ratios nearby: 1.618 golden, 1.778 minor seventh, 1.875 major seventh. This pairs with the >=28px display anchor in floor 6, which sets the absolute, while this sets the RATIO.
   (c) **size variety is not range:** breaking the 4-size ceiling while every size sits within ~6px is the worst case, it costs consistency and buys no hierarchy. Count sizes AND measure the spread.
   Diagnosis + evidence: `_design-system/research/FLATNESS_DIAGNOSIS_2026-07-25.md`. Rationale for the whole block: restraint is spent SELECTIVELY so one thing can be loud; applied uniformly it produces a wireframe.

8. **Trust floor for commit actions (hierarchy-density-05, LOCKFILE §17.6).** Any screen carrying a paid commit action (a Bezahlen/pay button, a booking confirmation) passes a separate Pass/Fail gate before the finished-screen pass matters at all: (a) the total price is broken down (base + surcharge + VAT where applicable); (b) the cancellation/refund term renders in the DOM above the commit button, not merely defined in a labels/i18n object; (c) who the user is booking with (salon/stylist name, not just a category) is visible above the commit action. Case that shipped without it and was fixed 2026-07-27: `app/[locale]/walk-in-pay/page.tsx` defined `cancelPolicy` in all four locale objects with zero JSX render sites.

---

## 🔒 Design contract — LOCKED (V3-D443, council-stamped 2026-06-07)

Frozen single-values. Do NOT re-open any row without the owner saying so by name. Visual rulebook: `public/solen-styleguide.html`. Full axes + sweep status: `_design-system/archive/CONSISTENCY_AUDIT.md`.

| axis | locked |
|---|---|
| selected / active | calm GRAY fill: `bg-s-bg-sunken` (#F4F4F5) + `text-s-ink` + semibold over a WHITE unselected; menu/list options add a check. The TabPill treatment, used for every pill/chip/option (owner 2026-06-29, light depth; SUPERSEDES ink-fill V3-D421 AND blue-border V3-D450). NEVER black/ink fill on a selected state (gate `no-black-selected`). Exceptions (four, all named): the ONE commit button stays ink; booking date/slot stays blue; the avatar `SelectedCheckBadge` stays ink for photo contrast (parked); the BOOKING services-step category pills are ink-fill (owner override 2026-07-19, "i want the category pills yk on the top to be black bit gray when selected", `selected-ok:` on the line , those are custom pills, not the shared TabPill, so nothing else moves). **CONTENT TABS (owner 2026-07-21): title + 2px ink underline , active = 600 ink + underline, inactive = 400 ink-2, no fill. Tabs navigate content views; pills/chips select options , that's the split.** |
| mockup base | **`public/_mockups/_BASE.md` is LAW for every mockup (owner 2026-07-21)**: 402 device constant (ref-px/3), full-bleed no fake phone, fonts by WORD WIDTH never glyph height, full-coverage box diff, `-webkit-text-size-adjust:100%`, `100dvh`, safe-area on fixed bars, REAL self-hosted photos (`_mockups/_assets/salon-photos`), no remote deps; final judge = PIL diff of the owner's phone screenshot vs the reference. Gates: mockup-base, no-fake-phone, width-calibration+full-diff, type-budget. |
| link | text links = blue `s-accent` #276EF1 (small clickable bit), hover underline. **See-all arrows = ink/black; big CTAs = ink; secondary buttons = neutral outline.** Blue is SPARSE — links, small buttons/chips, review counts "(54)" only (LOCKED 2026-06-10 restraint, supersedes "use blue a lot"; ref Apple/Airbnb/Fresha). |
| shadow / depth | ONE surface table (2026-07-21, supersedes the trio's "sparingly"/"both fine"): SalonCard = photo + `shadow-whisper` + NO border · grouped list card = whisper · PDP/booking sidebar card = hairline only · tile on a gray tray = white, no shadow · overlays/sheets/dropdowns = `elevation-2/3` · a card carrying elevation DROPS its border, never both. Over-photo = frost; sticky bar = gradient fade. Edge-visibility floor applies (FLOORS LAW 4). |
| text size | name **14** · meta **12** · section-H2 **clamp(18px,2vw,20)** · body **14** · CTA **15** (never ≤13 on a button) · eyebrow **11** · PLUS the display floor (2026-07-21): one display anchor **>= 28** per customer screen unless the photograph is the focal (FLOORS LAW 6). **i18n (copy-i18n-09, 2026-07-27):** a fixed-height single-line control (`h-11` button/pill/icon-button row below) does not get width relief from Rule 35's fluid-container fix; verify the LONGEST of the four locale strings (French/German both commonly run 15-35% longer than English, `_rules/I18N_ROUTING.md` Rule 35) against the button's max width before shipping a new CTA copy key, either it wraps to two lines by design or it's measured to fit. |
| imagery | (owner-approved 2026-07-21) browse/discovery/PDP viewports ~>= 1/3 photographic at 390x844 (corrected 2026-07-25, was 375x812 , now matches LOCKFILE EMPHASIS BUDGET + `check-geometry.mjs`); photo = the largest element of every SalonCard; NEVER a bare grey box (fallback = sunken + category icon + initial); mockups use real seeded photos. Exempt: forms, checkout payment, legal, receipts. |
| density floor | (owner-approved 2026-07-21) populated state = the design target, from SEED data: PDP gallery >= 5, reviews >= 3, services >= 6, home >= 4 sections; list/grid first viewport >= 4 units mobile / 6 desktop + a cropped next item; full card info stack whenever data exists. **Richness ceiling (hierarchy-density-03):** above ~3x floor (80+ services, 100+ reviews, 40+ photos), group/cap, never render uncapped inline. **Sparse-but-real (hierarchy-density-04, SOURCE.md §10.0a):** a real thin salon (below floor, non-fabricated) waives the count floors but keeps no-fabrication + the missing-photo fallback + a one-line honest sub-state per below-floor section. |
| hierarchy | name leads by SIZE; price bold-ink but smaller than name; rating = yellow star; filler (category·city·distance) greys out |
| availability | **plain ink text — NO green pill** (owner call, do not re-add) |
| radius | form/summary card **16** (`rounded-card`, `shadow-elevation-1`, and the `-1` is load-bearing: `shadow-elevation` is not a real class and Tailwind resolves it to nothing silently) · **grouped LIST-card 24** (`rounded-[24px]`+`shadow-whisper`, CATEGORY members in one card: salon services/products/bundles/staff/dashboard) · **individual entity-card 16** (`rounded-card`+border, flat, gap-separated, ONE card per DISTINCT entity , a stylist/person, a salon; `SalonResultCard` grammar; NOT a group card , owner 2026-07-19 "stylists are individual not groups") · button/chip pill · input **12** (corrected 2026-07-17, see below) · sheet **28** · image flush(0) |
| spacing | 4-pt scale only; card pad `p-4`/`p-3`; page `max-w-[1280px]` (PDP 1180) |
| wrap | name truncate · meta truncate · title wrap · body line-clamp · price/rating nowrap |
| icon-button | `h-11 w-11` |
| hairline | `border-s-border` = **`#E4E4E7`** (cool neutral, v2 rule 4; reverses warm V3-D447 #E0DDDB; one token, every divider) |
| states | loading = `<Skeleton>` (shape matches the final layout, NOT a bare spinner) · empty = `<EmptyState>` **with the reference-grounded anatomy (owner 2026-07-21 "get references more"): PROMISE headline 18/600 (never a bare status label) + GESTURE subline + a filled ink CTA to the filling action + a 3D category icon (`/icons/categories/`) or ghost-preview , NEVER a grey Lucide disc; on the sunken tray inside a living page. 12-app evidence: `_design-system/research/TASTE_EMPTY_STATES.md`** · error = `<ErrorState>` (inline) / `ErrorFallback` (route). All exist + locked in COMPONENT_REGISTRY — USE them, don't hand-roll. |
| focus | Input = **white fill + a 1px `#E4E4E7` resting line, and tapping it changes NOTHING visible**. Height 48, radius **12**. Buttons and links keep the global 2px ink `outline`. No halo, ever, and `no-focus-ring-gate` refuses one. Cost he accepted: no visible focus indicator, which WCAG 2.4.7 asks for; the smallest fix is the line darkening to `s-ink-2` instead of jumping to black, available if he wants it. (History: CLAUDE_HISTORY.md) |
| disabled | `opacity-50 cursor-not-allowed` (e.g. the commit button before a slot is picked) |
| touch target | interactive controls ≥ 44px (`h-11`), the a11y floor |
| filter pill | selected = `bg-s-bg-sunken` + `text-s-ink` + semibold (calm gray, never blue-border, never black); unselected = white + hairline, hover deepens text (owner 2026-06-29, supersedes V3-D450) |
| category tag | neutral — `bg-s-bg-sunken` + `text-s-ink-2`, NO per-category colour (incl. the on-photo eyebrow → `text-white`); owner picked B, V3-D449 |
| date / time | ONE `DateTimePicker` primitive — `dateLayout` strip (booking) \| calendar (search); booking + search share it. NO bespoke date UI (V3-D445) |
| nav | sub-page nav is single — the global `Breadcrumb` is excluded on `/{city}/{category}` (SearchTemplate owns it). No stacked home+back (V3-D449) |
| sticky CTA | (hierarchy-density-06) every screen with a single primary commit action reaches it via a sticky/fixed bottom bar OR within ~1 viewport-height scroll of the last required input, regardless of content volume above it, the dense-screen mirror of NEVER-AGAIN floor 3. Existing per-surface implementations: `SalonMobileBookBar` (PDP), the booking running-summary bar (`RESTRAINT_TEST.md`). |
| theme | **WEB = SINGLE LIGHT THEME, no dark mode** (`tailwind.config.js` darkMode removed 2026-05-02 Q62; Taste Lab "5 no dark mode"). NEVER put `prefers-color-scheme:dark` / `data-theme="dark"` / dark-mode CSS in ANY web file (mockup, analysis page, component, globals) — it renders BLACK and the owner rejected it twice (2026-07-16, 2026-07-21 "only white for web"). Gate: `~/.claude/hooks/white-only-web-gate.py` (built + self-tested; wire on Write/Edit when settings is writable). iOS (`solen-mobile`) keeps dark mode — this is web-only. |

**States are componentised + locked** (above) — USE them, don't hand-roll. Drift-checker: A2/A3=INFO; A1/A15/A17 comment-aware; token-equivalent hexes whitelisted; `drift-ok` respected.

---

## 🎨 Design system

**Before design/UI work: `_design-system/SOURCE.md`** (22-section canonical: tokens, motion, spacing, components, voice, a11y). On conflict, **`_design-system/LOCKFILE.md`** wins (frozen literal values; subagents read as immutable, only orchestrator writes).

**SOURCE OF TRUTH = AIRBNB (owner 2026-08-12, verbatim: "airbnb te is source of truth", answering a question that named this exact collision and quoted the rule it replaces).** This SUPERSEDES the dual-axis rule that stood here, which read: *"STRUCTURE = Fresha source-of-truth (via `fresha-section-capture`). AESTHETIC = Uber via LOCKFILE §1.5/§2.5/§11/§6."* Fresha is no longer the structural authority; Airbnb is, on both axes, and `AESTHETIC = Uber` falls with it wherever the two disagree.

What did NOT move, because he did not move it and a taste source cannot outrank a floor: the statutory tier (WCAG AA, nFADP/GDPR, PBV total-price), the FLOORS LAW minimums, no dark mode on web, no fabricated data, and any dated TASTE_LOG decision he made by name. When Airbnb collides with one of those, it is surfaced as a conflict, not applied , the same treatment `_design-system/references/AIRBNB_SYSTEM_VS_OURS.md` already gives its seven.

**MOCKUP FIRST STILL BINDS, and he restated it in the same breath: "no apply mockups i told u".** Airbnb being the reference changes WHAT is proposed, never that it is proposed before it is built.

Capture method, settled by him earlier and unchanged: the live site in mobile view is primary (*"go acc into the airbnb website and in mobile view acc analyze"*), stills secondary, `Skill(reference-lock)` fires on any named brand reference. Prior work to extend rather than redo: eight documents under `_design-system/references/` plus `AIRBNB_PROFILE_PRINCIPLES.md`. Full decision tree + anti-patterns: `_design-system/LOCKFILE.md` §10.0-§10.8.

**`fresha-section-capture` skill fires FIRST** for any Fresha-clone rebuild (live DOM → SPEC.md). Mission lock: exact Fresha anatomy; only exceptions are Solen primitives + tokens + fonts + `bg-s-ink` CTA discipline.

**Component registry:** `_design-system/COMPONENT_REGISTRY.md` — read BEFORE building any component. New shared component = write `_design-system/components/<Name>.md` + registry entry in the same turn. Layer 1/2/3 mandatory. No `if category === 'X'` branches (rule B5).

**Ship gates:** `_design-system/SENIOR_SCORECARD.md` (5/5 Pass required, customer screens) · `_design-system/WORK_TYPES.md` (6 types, pick before scoping) · `_design-system/WAVE_PLAN.md` (living roadmap W9-W17).

**Other references:** `_design-system/CONTROL_ELEVATION.md` (elevation decision tree: primary→ink, over-photo→frost, calm→flat; read before any button/stepper styling) · `_design-system/MOTION.md` (principles + remaining-work list; read before motion work) · `_design-system/PROCESS.md` (how design work is scoped, briefed and graded; replaced the 240-line brief template on 2026-08-08, which pointed at a deleted worktree and told the verifier to bless a focus ring that three armed gates refuse) · `/solen-drift-check` skill (static drift → `_design-system/_drift-report.md`).

Per-component rules: `_design-system/components/<Name>.md`. Open questions: `_design-system/QUESTIONS.md`. Taste decisions: `_design-system/TASTE_LOG.md` (read before design on a covered surface).

**MAY YOU DECIDE IT YOURSELF? `_design-system/TASTE_AUTHORITY.md` answers that, and every subagent brief on a visual question must name it.** The four documents above say what is ALLOWED. None of them ever says what is YOURS, so with two legal values and no rule the default was always to ask him, which is exactly how a 13px versus 14px question reached the founder. Owner 2026-08-21, verbatim: *"why would you need my opinion for these small stuff? ... I cannot fucking understand with thirteen pixel, fourteen pixel ... we need to have like a file actually ... My taste is right to like actually make decisions."* TASTE_AUTHORITY holds a seven-step test returning DECIDE, SHOW, ASK or PARK, an indifference band read off the LOCKFILE §12 scale (one adjacent step, since his own system already ships both sides of every pair at two widths), the defaults per area with his dated words behind each, and the short absolute list that is never decided without him. It NARROWS TASTE_LOG M18, it does not cancel it: mockup-first still binds on anything he could tell apart.

---

## 🖼️ Mockup FIRST (visual changes) — ALWAYS

Before applying, building, or committing ANY visual / design change: **show the user a mockup/preview FIRST, get approval, THEN touch real code.** Never apply-then-show. (User rule, 2026-06-09, after a long run of rejected attempts.)

1. The mockup MUST be a **copy of the REAL page/component** with ONLY the proposed change applied — capture the real route (Playwright), modify the real DOM/component uncommitted, show before/after. NEVER a from-scratch HTML redraw (they diverge → "this doesn't look like the homepage").
2. **Treatment-only:** change ONLY the proposed thing (shadow / bg / radius / spacing). Never touch structure, layout, copy, icons, or content in a design mockup. Structure stays; only the treatment changes.
3. Approve → THEN edit the real component + commit. Memory: `feedback_mockup_first_always`.
4. **SCOPE MATCHES THE ASK, + ENGLISH.** **AMENDED 2026-08-15, owner verbatim: "Can you stop using templates? Like, that's like this, like, a weird fucking top bar. It's just so hard to navigate, and I cannot understand. I can't even see a difference. Stop, like, doing this, like, a whole page mock up. Make you, like, one section of it. If we're talking about one, like, element or, like, one section, the fuck. Like, remove the gate or anything that's making you do this shit so annoying."**
   **THE RULE NOW: the mockup's scope matches what is being decided.** One section or one element under discussion means show THAT, at its real size, with the variants STACKED so they can be compared in one glance. A whole-page mockup is for a whole-page decision (a new route, a re-ordered feed, chrome). The switcher-plus-iframe template is banned for single-section work: it costs a tap and a memory to compare two things that could have been side by side, which is exactly why he said "I can't even see a difference".
   **What did NOT change**, because he did not change it: the mockup is still a copy of the REAL thing with real data and real tokens, never a from-scratch redraw, and it is still treatment-only. The 2026-07-13 rejections that produced the old wording were about ISOLATED OUT-OF-CONTEXT A/B PANELS of a component nobody could place; a full-size section rendered with real data is not that.
   **STALE CLAIM CORRECTED in the same edit:** this line used to say the whole-page requirement was "hook-enforced" by `mockup-english-gate.py` and that the gate "requires `Mockup-scope: whole-page`". It does not and never did. That gate only blocks hardcoded German. Nothing was enforcing whole-page; the format was coming from this line alone.
   **Hardcoded mockup copy is ALWAYS ENGLISH** (owner 2026-07-01). Real components rendering German via i18n are exempt; give review links at /en/ so the page reads English. Enforced by the GLOBAL `~/.claude/hooks/mockup-english-gate.py`, which blocks hardcoded German in a mockup file and does nothing else. (History, including the superseded whole-page wording and which copy of that gate is armed: CLAUDE_HISTORY.md)

---

## ⚡ Binary triggers — specific inputs fire specific tools FIRST (no eyeballing)

**Enforced mechanically** by `.claude/hooks/user-prompt-binary-triggers.sh`. This table is the canonical copy; the memory entry (`feedback_binary_triggers`) points here.

| Input arrives | FIRST tool call of the turn — before ANY edit or opinion |
|---|---|
| Reference image attached / pointed at ("ss folder", IMG_xxxx, "screenshot") | `python3 ~/.claude/skills/pixel-spec-auto/scripts/extract.py <image> <outdir>` → implement against spec.md. If detection fails (borderless UI), PIL pixel-sample the measurements directly. Escalate to `screenshot-spec` if still missing elements. |
| `<launch-selected-element>` XML pasted | `preview_eval` → `getBoundingClientRect()` + `getComputedStyle` on the element, its container, and siblings. Report NUMBERS, then one fix. |
| Measurement-complaint words: "overlap", "clipped", "off", "not like the ss/picture", "unbalanced", "different heights", "not 1:1", "compare", "still wrong" | Measure live UI (`preview_eval` rects) AND the reference (PIL) BEFORE editing. Confirmation-bias warning: do NOT pattern-match to recently-changed elements. |
| Brand-named structure rebuild ("like Fresha('s) X" , he still names Fresha sometimes) | `fresha-section-capture` (live URL) or pixel-measure the provided screenshots. ~~STRUCTURE=Fresha / AESTHETIC=Uber-LOCKFILE (§ dual-axis above)~~ , **CORRECTED 2026-08-17: that clause contradicted this same file 44 lines above, which records his dated 2026-08-12 decision ("airbnb te is source of truth") replacing Fresha-for-structure / Uber-for-aesthetic on BOTH axes. Capture whatever brand HE names in the message , the capture-don't-guess rule is what fires here , and grade the result against AIRBNB as the source of truth, plus the floors, which no taste source outranks.** |
| ANY other brand/visual reference named ("this animation from Airbnb", "web Uber Eats", "like Stripe's hover"), or a liked ASPECT of a shared image/recording ("I like how the structure / aesthetic / motion / shadow / shader is") | `Skill(reference-lock)` → resolve brand+platform+surface, classify the aspect, CAPTURE the real thing (record-interaction.mjs video + animations.json / Mobbin / ffmpeg frames of a recording), write `_design-system/references/<brand>--<surface>.md` with a Philosophy section, arm the active-ref lock. NEVER build a named reference from training memory. Enforced globally by the `reference` category in `~/.claude/hooks/fable-skill-trigger.py`. |
| Any visual just changed (screenshot taken / mockup ported) | `gemini-visual-check` (image vs reference) before claiming a match. |
| Owner criticizes a look WITHOUT naming the cause ("this is bad", "looks bad", "ugly", "off", "busy", "unbalanced", "doesnt look right", "sieht schlecht aus") | `Skill(solen-taste-diagnosis)` FIRST: measured walk (squint, hierarchy counts, typography floors, grouping tree, contrast math) against RATIONALE.md + research/TASTE_*.md floors; report NAMED violations with numbers, THEN propose the fix. Never guess-and-apply on a look complaint. |

**Detection = fire.** No interpreting first, no "let me look at the code first", no rationalizing that the case is different. The asymmetry: measuring costs ~30s; eyeballing wrong costs 3-5 correction turns and trust.

---

## 🪶 Copy economy (owner rules, 2026-06-11) — how MUCH to write

> **HOW to write lives in `_design-system/COPY_LAW.md`** (owner 2026-07-29: *"research everything and
> make a whole principle about, like, when you're writing something, how to do it"*). Read it before
> writing any user-facing string in any of the four locales. It owns: **register , formal `Sie` (de),
> `Lei` (it), `vous` (fr)**, sentence shape, warmth-inside-formal, punctuation, numbers/dates/money,
> the shape of each string type, translation mechanics, and which rules are gates vs judgment. This
> block below is unchanged and still governs LENGTH; COPY_LAW **extends** it, replaces nothing in it.
> (Pointer added 2026-08-03 by the weekly law pass: the writing law had no route from the file that
> is always in context, which is the same wrong-tier failure the 07-27 pass named.)

1. **Drop words the context already says.** A button inside the reviews list is "Mehr laden", never "Weitere Bewertungen laden" — the user knows they're reviews. Same family: "Zum Kalender hinzufügen" → "Kalender hinzufügen"; a "Kopieren" label next to a copy icon → icon-only. Test: delete each word; if the meaning survives in place, the word was padding.
2. **Long text truncates with a blue "Mehr lesen".** Reviews/descriptions clamp (~150 chars / 3 lines) with an inline `text-s-accent` "Mehr lesen" that expands in place (Fresha pattern). Never render a wall of text; never a grey/underlined read-more.
3. **Action verbosity ladder:** icon-only when the icon is unambiguous next to its object (copy, flag/report, share) — keep `aria-label`; icon+label when the action is rarer (Wegbeschreibung); label-only for commitments (Buchen, Bezahlen). One primary commit phrasing per screen.
4. **No redundant tags/badges/meta.** A tag must add a decision-relevant fact not already on the row. Banned examples (owner, 2026-06-11): language tags ("DE / EN") on a barber row at checkout, a policy line repeated twice on one screen, decorative chips. Test: remove the tag — if the user loses nothing, it was noise.
5. **These rules bind MOCKUPS too** (`public/_mockups/**`). A mockup that breaks them gets rejected just like real UI. Mockup-specific banned list (all owner-rejected at least once):
   - tracked-uppercase labels/eyebrows (`text-transform:uppercase` + letter-spacing) — use normal-case 13px semibold
   - hand-drawn inline SVG glyph paths — Lucide icons only (memory `feedback_actual_icons_lucide`)
   - placeholder junk in the status bar (`●●●`) — use the kit's signal/wifi/battery glyphs
   - bare X close — the design system close is a 38px circled X (border, white bg)
   - fake/false claims (payment timing, saved cards that don't exist, invented counts) — same no-fabrication rule as production

---

## 🪦 Exists-check protocol (anti-duplication, council 2026-06-12)

The #1 post-compression failure: proposing/rebuilding what already exists or was deliberately removed.
Three layers, all live:

1. **`npm run exists <keyword>`** — live scan over routes, APIs, components, lib, DB, **page-inline
   sections**, and the **🪦 graveyard** (`_design-system/REMOVED.md`: owner-deleted/rejected things;
   a hit there = do not re-propose without an explicit owner yes). Run it BEFORE proposing anything.
2. **`_design-system/REMOVED.md`** — when the owner deletes/rejects a feature, ADD A LINE in the same turn: `npm run removed -- "<keywords>" "<what>" "<why>" "<record>"`. Hook-enforced: UserPromptSubmit fires on rejection words; `pre-commit-graveyard.sh` blocks commits that delete routes without a REMOVED.md line (override: `touch .claude/graveyard-skip.flag`).
3. **Hook-enforced**: new routes/APIs/migrations/mockups block unless `npm run exists` ran this turn,
   and every NEW mockup file must contain an `Exists-check:` line naming what the target surface
   already renders + any REMOVED hits + the one thing that's actually new.

## 🔍 MISSING THINGS: say it, find out WHY, then fix (owner 2026-08-14, session-wide)

**Owner, verbatim:** *"no tell me if feutures or stuffs are missing and the stuff u talked abt
search reason why its not there and then fix accordingly and this process i want sessionwide make
it a principle and also activate not jat silent turn off of ths principle"*

When something turns out to be ABSENT (a feature, a column, a table, a route, a component, a file,
a check), three steps in this order, every time, no exceptions:

1. **SAY IT.** Name the missing thing plainly, in the reply, in his words. Not in a plan file he
   will not open. A missing thing he does not hear about is the same as one that was never found.
2. **FIND OUT WHY IT IS MISSING.** Never restore something before knowing why it left. The reasons
   this project actually produces, in the order worth checking:
   - **Deliberately killed.** `_design-system/REMOVED.md` (the graveyard) and dated
     `_design-system/TASTE_LOG.md` entries. A hit here means DO NOT restore it without his yes.
   - **Superseded.** Something else now does its job. `npm run exists <keyword>` and its synonyms.
   - **Never landed.** Built on a branch that was never merged. `git log --all -- <path>` shows the
     commit and the branch it is stranded on.
   - **Half-landed.** The code shipped and its migration did not, or the reverse. This is the
     dangerous one because the product looks complete and silently does not work.
   - **Blocked.** A gate, a permission, or a missing credential stopped it, and nobody said so.
3. **FIX ACCORDINGLY, and "accordingly" means the fix follows the reason.** Killed on purpose:
   leave it and say so. Superseded: point at the replacement. Never landed: bring it across.
   Half-landed: land the other half. Blocked: name the blocker.

**WHY THIS EXISTS, the case that produced it, 2026-08-14.** 40 branches with about 1,800 commits
were sitting unmerged, and an audit against the live database found four migrations whose objects
do not exist. One of them adds `bookings.consumed_at`, and without it the one-click confirm/cancel
link in an email has **no replay protection at all**: verified on the shipped route, which contains
no single-use check of any kind. The feature was not cancelled and it was not superseded. It was
written, reviewed, and stranded on a branch nobody merged. Nothing in this system said so.

**ACTIVE, not a silent default, and CORRECTED 2026-08-24 so the claim matches what runs.** It is
live as rule 1 of the before-you-write note (`~/.claude/hooks/reply-shape-preflight.py`, verbatim:
"MISSING NEEDS A REASON. If you call something missing, absent, or never landed, say WHY"), which
arrives BEFORE the reply is written, so acting on it costs him nothing.

~~This line used to say `~/.claude/hooks/missing-needs-a-reason-gate.py` (Stop) enforced it.~~ That
file exists, its 11 checks pass, and it is registered in NO settings file and dispatched by no
aggregator, verified 2026-08-24 against a control of three hooks known to be armed. So the sentence
was claiming an enforcement that has never run once. It is left unarmed deliberately, for a reason
worth keeping: it has no `stop_hook_active` guard, so it can refuse the same turn repeatedly, which
is the exact behaviour that made a session unusable on 2026-08-23. A refusal at Stop also arrives
after the message is already written, so the most it can ever produce is a second message. The
principle he asked for is enforced; the file named here was not the thing enforcing it.

---

## 🎭 NO DECORATION: a thing that looks finished and is wired to nothing (owner 2026-08-19)

**Owner, verbatim:** *"when you build something, you keep making these decorations or, like,
unfinished stuff, right, even though I thought it actually finishes loop. Finish it as a loop. But,
you know, it's like the requirement, like, at the end. It's gonna cause more harm than good, right,
because you're being too lazy."*

**MEASURED THE SAME DAY, with a control run first on keys known to be rendered: 1,716 of the 5,849
copy keys in `messages/en.json`, 29 percent, have a name that appears in NO source file** under
`app/`, `components/`, `components-legacy/` or `lib/`. Written, reviewed, translated into four
languages, and shown on no screen. 87 of them are in `refundFlow`, which had just been translated
into three languages that same day, so roughly 261 translations were produced for text nobody can
ever see.

**Two of those were PROMISES**, which is what makes this worse than waste: `reportWindowNote` ("You
can report up to 14 days after your appointment") and `respondsBy` ("Salon responds by {date}") were
both written and both rendered nowhere. The refund screens told a customer a deadline existed while
nothing measured it, enforced it, or displayed it.

**THE RULE.** A feature is not done when its pieces exist. It is done when the last one is
connected. Specifically, and these are the shapes this project actually produces:
- Copy written but rendered nowhere. A string in `messages/*.json` with no render site is not a
  half-built feature, it is a finished-LOOKING one, which is worse, because nothing will ever tell
  you it is missing.
- A deadline printed but never computed, enforced or acted on. If a screen names a date, something
  must own that date.
- A column, table or flag that exists and nothing reads. Consent toggles are the dangerous member of
  this family: the user is told they turned something off while a separate sender keeps going.
- A control that renders and does nothing (the existing dead-affordance rule).

**Why it is worse than leaving it out:** an absent feature is visibly absent and gets built. A
decorated one is invisibly absent, passes every review, and is discovered by a customer.

**THE CLOSE CONDITION, and this is the half he was naming.** The loop is not finished when the
build agents return. It is finished when the LAST MILE is proven: the thing renders, the guard
refuses something, the job runs. Take one real end-to-end path and drive it. "The code is there" is
the exact claim this rule exists to refuse.

**Enforced, not advice:** `~/.claude/hooks/i18n-write-gate.py` refuses a copy key added with nothing
rendering it (`f888f11`). Scope is deliberately narrow: only keys being added right now. The 1,716
already present are grandfathered, because a check that refused 29 percent of existing copy would be
switched off within a day. `scripts/check-i18n-parity.mjs` does NOT cover this and never did: it
compares the four locale key sets against each other, so a key present in all four and rendered in
zero files passes clean.

---

## 🚨 Surgical edits only

1. Never rewrite a whole file — change only the lines that cause the reported bug.
2. Match the exact scope of the request — padding fix = padding class, nothing else.
3. Read before editing — find the exact lines, confirm match, then change.
4. Never `npm run build` unless asked — dev runs on port 3000.
5. `git diff` after each fix — verify only the intended thing changed.

---

## 🕳️ Silent no-ops — phantom columns, dead filters, convention mismatches

This project's #1 silent failure mode: a control / column / filter that LOOKS wired but does nothing. PostgREST swallows a `.select()` on a non-existent column (returns null, not an error); a filter param can be set + counted in the UI yet never applied server-side; a helper can key off the wrong convention and return a constant (e.g. `isOpenNow` read long day-names while all data is short-keyed → "open now" returned empty everywhere, fixed 2026-06-05).

- **Prove behavior, not existence.** A filter must DISCRIMINATE (return a correct subset), not just render or return 200. A column must appear in the LIVE snapshot (`npm run exists <column>`), not merely in a TS type.
- **Computed filters** (open-now, distance — anything not expressible as a PostgREST predicate) resolve matching IDs first, then `.in("id", ids)` BEFORE `.range()`; never client-side over one page (breaks count/pagination). Reference: `app/api/salons/route.ts`.
- `opening_hours` is SHORT-day-keyed (`mon`…`sun`). Full pitfalls + patterns: `_rules/LESSONS_LEARNED.md`.
- **Consent / notification-preference flags are a silent-no-op category too, not just filters.** A toggle like `profiles.notification_sms` that saves correctly but has zero read sites in the code path that actually sends is worse than a dead filter: the user was told "you turned this off" while a separate sender keeps contacting them anyway. Caught twice independently on 2026-07-07 (`sms-reminders` and `barber-smart-reminders` crons sent SMS with no preference check at all; fixed ethics-psychology-02). Any new consent/preference toggle needs the same discriminate-the-behavior proof as a filter: find every real send path for that channel and confirm it reads the exact column.

---

## 📂 User's screenshot folder

The user saves all their phone screenshots, AI-generated illustrations, and reference images to:

**`/Users/sulo/solen/screenshots/`**

(Note: this is OUTSIDE the project at `~/solen/screenshots/` — separate from in-project `_audits/screenshots/` which Claude uses for Playwright captures.)

When the user says "I pasted in the screenshot folder", "see the screenshot folder", or refers to images they shared but the inline-attached images aren't a file you can process — look here FIRST. Filenames are usually `IMG_XXXX.png` (phone) or UUID-named `.png` (Mac screenshots / Nano Banana outputs).

---

## ⚡ Terminal autonomy

- ✅ npm/npx, git status/add/commit/diff/log, tsc checks, file ops — **commit OFTEN + autonomously, don't ask** (each verified chunk = its own commit)
- ✅ Verify owner/auth-gated surfaces yourself — `GET /api/dev/login?to=<path>` (dev-only) mints a seed test-owner session; never hand-wave "auth-gated, can't check"
- ❌ `git push` — NEVER auto-push, and don't even mention pushing (the owner pushes manually). Also ask first: `git push --force`, `reset --hard`, DB data deletion, `.env.local` edits

---

## Workflow rules

- **Functional rules** live in `_rules/*` (code safety, structural, i18n, security, db, lessons learned). Read the relevant one before related work.
- **Incomplete features** → append to `_tasks/INCOMPLETE_FEATURES.md` (file:line · blocker · next steps). **Never delete entries.**
- **Error handling** → never `.catch(() => {})`. Always `console.error("[Component] description:", err)`. Auth flows: log + redirect to login. Payment flows: log + user-visible error + retry.

## Precedence chain (when two rules or docs disagree, 2026-07-03)

Walk top down; higher wins. Latest DATED owner decision wins; "supersedes X" kills X everywhere, even where X still appears verbatim in an older doc or memory.

1. The owner's live, literal, latest ask (a live rejection outranks an earlier approval)
2. **STATUTORY AND SAFETY FLOORS** (added 2026-07-27). A named legal or safety minimum is not a
   taste axis and cannot be outranked by one. Members, and this list is closed until the owner
   extends it: WCAG 2.2 level A and AA on any published customer surface; Swiss nFADP and, for EU
   data subjects, GDPR, in particular consent and the special-category handling that allergy and
   treatment notes fall under; the Swiss Price Indication Ordinance (PBV) total-price rule; and
   anything the Terms of Service represent to a user as true.
   **Why this tier exists, the case that created it:** the owner rejected focus rings three times
   on looks, and the estate implemented that as `outline: none` on every link, button and tabbable
   element sitewide, with no substitute. A taste rejection had silently deleted WCAG 2.4.7, and
   nothing in the chain could catch it because there was no tier that said a statutory floor
   outranks a taste preference. Same shape as the A3-photo-lock versus FLOORS-LAW-2 collision:
   two owner decisions, no arbitration rule.
   **How it resolves, and it is not "the law wins, ignore the owner":** when a taste decision and a
   floor collide, you do NOT silently override the taste call and you do NOT silently drop the
   floor. You SURFACE the collision, name both sides with dates, and propose the treatment that
   satisfies the floor while honouring the taste intent. The focus case: the owner objected to the
   RING, not to keyboard users knowing where they are, so the answer is a non-ring focus treatment,
   shown for approval, not a restored ring and not nothing.
3. Hooks and gates (a deny message is an instruction, not an obstacle)
4. _design-system/LOCKFILE.md frozen literals
5. This file's pinned blocks (taste rules, design contract, binary triggers, exists protocol)
6. _design-system/TASTE_LOG.md dated decisions, then _design-system/TASTE_AUTHORITY.md (2026-08-21), which sits directly BELOW the log on purpose: it only ever routes a question to DECIDE / SHOW / ASK / PARK and cites the log for every value, so a dated entry always wins over it
7. Memory feedback files
8. Global ~/.claude/CLAUDE.md rules, together with the ~/.claude system docs it points to (LAW_SYSTEM.md, LOOP_SYSTEM.md, MODEL_ROUTING.md, REPORT_SYSTEM.md, REGRESSION_SYSTEM.md, CONTEXT_SYSTEM.md, FABLE_DNA.md) , same tier, the doctrine layer for cross-project behavior
9. Generic checklists (uiux-audit) and legacy _rules/* (anything palette, Figma, Vercel, or push flavored there is history) (_rules cleaned 2026-07-07; if push/Vercel/Figma/palette-flavored text ever resurfaces there, it is history, never law)

Full reasoning procedure: the fable-reasoning skill, section 6.
