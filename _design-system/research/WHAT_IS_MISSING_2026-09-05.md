<!-- exists-check: EXTENDS `_design-system/research/WHAT_IS_MISSING_2026-09-04.md` (read in full first, the
     day before this one, same question from the owner). That file answered "no floor is missing, three
     formulas are missing" from six live screens. This file re-runs the question with round 1 as the
     evidence (30 built directions, 10 of them picked, all of which passed the law and a critic and were
     still called ass), and it does something 09-04 did not do at all: it greps the value a builder TYPES
     against the value a reader READS. Nothing here restates 09-04's three formulas as new; the verdict
     below says which of them survived. Also read before writing: DESIGN_FILES_AUDIT.md and WHY_UNFINISHED.md
     from this run's scratch, LOCKFILE §1/§2/§2.5/§3/§13/§17, PRINCIPLES.md headings, TASTE_AUTHORITY.md,
     TASTE_LOG 2026-08-16 and 2026-09-05, REMOVED.md, CLAUDE.md's pinned blocks. -->

# What is missing on the front end (owner 2026-09-05: "maybe we're missing principles, maybe we're missing design files")

His two sentences that produced this file, both dictated 2026-09-05:

> "there's gonna be now multiple pill shades, pill contrast or, like, typography, all of those. So
> maybe we look into that and actually fix up. Like, I told you, search out what we're missing, on
> the front end, maybe we're missing principles, maybe we're missing design files."

and, on the 30 round-1 directions:

> "the direction is good, but itself, it looks ass."

**Method.** Every number below was produced in this run by the command or file named beside it.
Values are tiered: **verified** = I ran the command or read the line this run; **cited** = measured in
a named companion file from this same run (`ROUND1_LOOK_TABLE.md`, `WHY_UNFINISHED.md`,
`DESIGN_FILES_AUDIT.md`, the three `*--look-recipes.md` captures) and not re-measured by me;
**not checked** = written as exactly that, never softened into a guess. Contrast figures come from
`scratchpad/r2/contrast.py` and `contrast2.py`, WCAG 2.x relative-luminance, written and run this run.

---

## The verdict on the 2026-09-04 answer, in three lines

1. **Formula 1 (one type ramp, integers only) stands, and it got worse, not better, in one day.**
   That file counted 463 uses of 32 off-ramp sizes. Re-counted this run over `app/`,
   `components-legacy/` and `components/`: 12.5px x174, 13.5px x126, 14.5px x41, 17px x52, 19px x16.
   Those same five sizes totalled 392 on 09-04 and total **409** today, across **108 files** carrying
   at least one half-pixel size (`grep -rn 'text-\[Npx\]'`, verified). Nothing was swept; more was added.
   Corroborated by the project's own detector, re-run this session: `node scripts/detect-type-scale-outliers.mjs`
   prints **493 off-scale usages, 32 distinct values, 158 files touched**, against the 463 / 32 / 143 that
   file recorded on 09-04 (verified, one command, its own output). Thirty more uses and fifteen more files
   in a single day. Two independent counts, same direction. (Running it rewrites
   `_design-system/_type-scale-report.md`, which is why that file is modified in this run's diff.)
2. **Formula 2 (a cross-screen sameness check) stands and is still at zero.**
   `grep -c 'cross-screen\|crossScreen\|sameness' scripts/check-geometry.mjs` returns **0** (verified).
   The homepage `SalonCard.tsx` is **585** lines today against the 578 that file recorded, and
   `components-legacy/SalonCard.tsx` is still **394** (`wc -l`, verified). The duplicate did not close
   and the canonical one grew. **But its first named fix is now graveyarded, and anyone executing that
   formula walks straight into it.** 09-04 named three implementations of the salon card and proposed one
   component with registry variants. The third of the three was the hand-built card in `WalkInBand.tsx`,
   and `REMOVED.md:141` records him rejecting exactly that unification the same day, verbatim: *"it doesnt
   make any sense. Why are you telling me about that again? No. No. Stop trying to do that. Okay? And keep
   the current."* The entry closes "Do not re-propose unifying it with SalonCard" (verified, read this run).
   So the CHECK is still missing and still worth building; the FIX it was going to recommend first is a
   dated no. What survives is the two SalonCard files, which he has never ruled on.
3. **Formula 3 (a first-paint time floor) is NOT CHECKED this run** (no timed cold load was taken), so
   this file neither confirms nor retires it. **What 09-04 missed is not a fourth formula.** It graded
   our screens against our own written ceilings, found we pass, and concluded "apply the rules that
   exist". It never asked whether the rule a builder TYPES agrees with the rule a reader READS. It does
   not: `rounded-btn` resolves to 99px in `tailwind.config.js:288` while the dated lock says 16px, and
   **359 files-worth of call sites** type that token. Thirty rule-passing mockups are made of exactly
   that gap, and no amount of new principle closes it.

---

## The gap list

One row per gap. "09-04?" says whether the 2026-09-04 answer already named it.

### G1. The radius a builder types is not the radius the lock says, and four of five sources still say capsule

| | |
|---|---|
| **The number** | `tailwind.config.js:288` `btn: "99px"` and `:287` `pill: "9999px"` (verified). Against `CLAUDE.md:134`, the dated 2026-08-16 owner correction: `rounded-[16px]`, "NOT a capsule", "SUPERSEDES the pill value this row carried since V3-D443". Four other sources still say capsule: `_design-system/LOCKFILE.md:578-579`, `_design-system/SOURCE.md:446-447`, `public/solen-styleguide.html:38,40,41,148`, and `_design-system/TASTE_AUTHORITY.md:153` ("input 12, form/summary card 16, grouped list card 24, sheet 28, **pill 99**"). Live call sites, counted this run over `app/` + `components-legacy/` + `components/`: `rounded-btn` **359**, `rounded-pill` **299**, `rounded-[16px]` **212** (verified). Consequence, cited from `DESIGN_FILES_AUDIT.md` section 4: this was the single most repeated critic FAIL in round 1, hit independently by three builders who could not see each other's work (press-motion, confirmation, search-results). |
| **Belongs in** | `tailwind.config.js` (change the token values, not the prose), plus `_design-system/LOCKFILE.md` §3 Border radius table, `_design-system/SOURCE.md` radius table, `_design-system/TASTE_AUTHORITY.md` §2, and `public/solen-styleguide.html`, **all in one commit**. Existing files, all five. No new file. |
| **09-04?** | No. |

### G2. The 2026-09-02 chip-corner rejection has no entry, and the one sentence that mentions it parses both ways

| | |
|---|---|
| **The number** | `_design-system/TASTE_LOG.md:1266` is the ONLY occurrence in the repo: "the 16px chip corner he rejected on sight 2026-09-02". `grep -rn "chip corner" _design-system/` returns **1** hit, that line; `grep -rn "rejected on sight" _design-system/` returns **2**, that line and an unrelated 2026-07-16 mockup entry at `REMOVED.md:73` (verified). The sentence sits inside a list of decisions that STAND, so it reads either as "he rejected the 16px corner" or as "16px is the corner he arrived at by rejecting the capsule on sight". No verbatim, no replacement value, no `Mxx`/`Bxx` entry. Every other dated decision in that file carries all three. |
| **Belongs in** | `_design-system/TASTE_LOG.md`, as a dated entry in the same format as every other one. Until it exists, G1 cannot be resolved in either direction, because nobody knows which shape the newest owner word points at. |
| **09-04?** | No. |

### G3. `rounded-input` resolves to 16px while three documents say 12px

| | |
|---|---|
| **The number** | `tailwind.config.js:289` `input: "16px"` (verified) against `_design-system/LOCKFILE.md:580` "`input` 12px ... Owner kept shipped 12 over 16, 2026-06-08", `_design-system/SOURCE.md`'s radius table "`rounded-input` 12px ... corrected here 2026-07-12", and `CLAUDE.md:140` "Height 48, radius **12**". **37** live uses of `rounded-input` (verified). So a control the owner personally settled on 2026-06-08 renders at the value he rejected, on every one of those 37 sites. |
| **Belongs in** | No token change; the LOCKFILE gets a note, and the token rename is a suggestion (S15, see below). |
| **09-04?** | No. Neither did `DESIGN_FILES_AUDIT.md`. New this run. |

**CORRECTED 2026-09-06, measured:** the 37 sites are not native inputs. A native `<input>`, `<textarea>`
or `<select>` gets its radius from a separate, unconditional rule in `app/globals.css`: the selector
starting at line 434 (`input:not([type="checkbox"])...`, ten `:not()` clauses, plus textarea and
select) sets `border-radius: 12px` at line 441, with no reference to `rounded-input` at all. Tailwind
3.4 compiles `@layer` to plain CSS with no real cascade layers, so that ten-clause selector
out-specifies the single `.rounded-input` utility class wherever both could apply. Grepping the 37 live
`rounded-input` call sites under `app/`, `components/`, `components-legacy/`, `lib/` (list:
`scratchpad/r2/rounded-input-sites.txt`) finds zero on an `<input>`, `<textarea>` or `<select>`: 24 are
`<div>`, one `<span>`, one `<motion.*>`, one `<img>`, the rest sit inside className strings on
wrappers. A section mockup built to check this live, `/en/dev/directions-0905-r2/input-radius`, renders
both its rows at 358x56, radius 12px, border 1px solid `rgb(228,228,231)`, white, 16/400, zero console
errors. So the gap was a token-naming defect, not a rendered one: every real input already matches the
three documents and the owner's 2026-06-08 call. `rounded-input` is a misnamed second 16px radius token
that has never once reached an input. Changing its value to 12 would move all 37 non-input elements
(wrappers, avatars, photo thumbnails, modal shells) and would change no field's rendered radius at all.
~~The fix is one line in `tailwind.config.js`.~~

### G4. `elevation-2` is defined twice with two different values, and the LOCKFILE asserts an equality the config does not hold

| | |
|---|---|
| **The number** | `_design-system/LOCKFILE.md:678` states `elevation-2 (= warm-md = card-hover = surface)` = `0 4px 12px rgba(50,47,44,0.08), 0 2px 4px rgba(50,47,44,0.04)`. `tailwind.config.js:313` defines `"elevation-2": "0 2px 8px rgba(50,47,44,0.09)"`, a single-layer shadow, while `:295` `card-hover` and `:296` `surface` keep the two-layer value (verified). Same for elevation-3 (`:314` `0 6px 16px rgba(50,47,44,0.12)` versus the LOCKFILE's two-layer row). So the aliases the LOCKFILE names as identical are not identical, and `elevation-2` is the token our own depth table (`§17.2`) tells builders to reach for. |
| **Belongs in** | `_design-system/LOCKFILE.md` §3 Box shadow table (record the real config values and drop the false `=` chain). |
| **09-04?** | No. **And this run corrects `DESIGN_FILES_AUDIT.md` on the neighbouring claim:** that audit reported the warm `rgba(50,47,44,...)` shadow bases as a contradiction against `shadow-whisper`'s cool `rgba(10,10,10,...)`. They are not in contradiction. `LOCKFILE.md:685` says so in its own words: *"Warm tint is intentional ... shadow tokens stay warm-tinted `rgba(50,47,44, …)` even though surfaces/hairlines went COOL ... Don't 'fix' shadows to cool grey."* The warm elevation tokens and the cool whisper token are both deliberate and both locked. The real defect is the value mismatch above, not the tint. |

### G5. The status badge he asked us to reuse fails WCAG AA on three of its five states, and breaks a taste rule that already exists

| | |
|---|---|
| **The number** | `components-legacy/booking/BookingCard.tsx:84-90` sets `{bg: 'bg-s-<token>/10', fg: 'text-s-<token>'}` and `:137-139` renders `rounded-pill px-2.5 py-1 text-[12px] font-semibold`. Computed this run (`scratchpad/r2/contrast.py`, the alpha blended over white exactly as it renders): **confirmed** #16A34A on #E8F6ED = **2.96:1**; **pending** #F1AE27 on #FEF7E9 = **1.82:1**; **cancelled** #DC2626 on #FCE9E9 = **4.13:1**; completed #6B6B6B on #F3F3F3 = 4.80:1. WCAG AA for 12px text is 4.5:1, so three of five fail, and pending fails even the 3:1 graphical floor. This is not a missing rule: `CLAUDE.md` taste rule 6 already specifies the recipe as *"pastel `.bg` + ink text + saturated icon"*, and taste rule 4 already says *"Success and heart are legal as ICONS, never as body text"*. The shipped component renders coloured text and **no icon at all**. Route: `app/[locale]/profile/bookings/page.tsx` via `components-legacy/booking/BookingsList.tsx:6`. The same recipe string `bg-s-success/10` appears **14** times across `app/` + `components-legacy/` (`grep -rn "bg-s-success/10" app/ components-legacy/ | wc -l`, verified this run). **The pattern is wider than that one component, and it is already on a shipped customer screen.** A regex for the whole family (a `bg-s-{success,warning,error,urgency,open}` fill followed on the same line by a `text-s-{...}` of the same family, `.tsx`/`.ts` files only) returns **89 matches across 46 files** (`grep -rPn 'bg-s-(success|warning|error|urgency|open)[^"'"'"' ]*.*text-s-\1' app/ components-legacy/ --include="*.tsx" --include="*.ts"`, verified this run); narrowing to the ones that also carry an explicit `text-[Npx]`, so they are certainly text and not an icon disc, returns **23 across 21 files** (both counted this run, `grep -rEn` over `app/` + `components-legacy/`). And measured live in the browser this run at 390x844, the discount pill on `/en/salon/muse-beauty-studio` renders fill `rgb(232,245,233)` (`#E8F5E9`) with text `rgb(22,163,74)` at 13px/500 in a 58x28 box, radius 9999: **2.93:1**. So the failure ships today on the salon page, not only behind the bookings login. |
| **Belongs in** | The component (`BookingCard.tsx:84-90`), and `_design-system/LOCKFILE.md` §13.3's badge taxonomy, which specifies badges but does not carry the measured contrast of its own recipe. Ink text at 17.76:1 on the same fill satisfies both the rule and the floor without touching the fill. |
| **09-04?** | No. |

### G6. `s-success` and `s-error` have no `.text` companion; `s-warning` has had one since 2026-06-02

| | |
|---|---|
| **The number** | `_design-system/LOCKFILE.md` §1 Semantic UI table: `s-warning` carries `.DEFAULT` `#F1AE27`, `.bg` `#FDF6E7` and `.text` `#B45309`, with a rule beside it (V3-D424) saying *"focal/hero = the vivid `DEFAULT` token; small-text-on-pale = the dark `.text` token"*. `s-success` and `s-error` carry `.DEFAULT` and `.bg` only (verified). Measured this run: `#B45309` on the warning pale fill = **4.71:1** (passes AA); `#15803D` on the success pale fill = **4.50:1** (exactly the AA floor); `#16A34A` on it = 2.96:1. So the family that has the companion passes and the two that do not, fail. This is a half-landed fix, not an unknown: the rule was written for all three families and the tokens were minted for one. |
| **Belongs in** | `_design-system/LOCKFILE.md` §1 Semantic UI table. It mints a value, so it is an **ASK** under TASTE_AUTHORITY §4 item 6, and `#15803D` specifically was rejected by name on 2026-06-10 for a DIFFERENT job (the focal disc), which the V3-D424 rule already distinguishes. |
| **09-04?** | No. |

### G7. The canonical badge table names a component deleted 20 days before, and dead in code

| | |
|---|---|
| **The number** | `_design-system/LOCKFILE.md:1665` (§13.3, dated 2026-06-10) points the "Status (open/closed/pending)" row at `StatusPill`. `_design-system/components/StatusPill.md:1-8` says DELETED 2026-06-30, superseded by `StatusInline.tsx`; `REMOVED.md:46` records the deletion. Cited from `DESIGN_FILES_AUDIT.md` section 3: zero live import sites for `StatusPill`, three for `StatusInline` (`SalonDetailV3.tsx`, `SalonSidebar.tsx`, `SalonHeader.tsx`). |
| **Belongs in** | `_design-system/LOCKFILE.md` §13.3, one row. |
| **09-04?** | No (`DESIGN_FILES_AUDIT.md` named it this run). |

### G8. No rule says the MIDDLE of the type ramp must be populated, and that is the shape our screens actually fail

| | |
|---|---|
| **The number** | Cited from `WHY_UNFINISHED.md` (this run, 390x844 folds): confirmation C renders 12px x14, 14 x4, 15 x2, 16 x1, **28 x1** with **nothing between 16 and 28**; payment-step A the same 12px hole; empty-states B the same. The references populate it: Airbnb listing 26 then **18 x3** then 16 x7 and 14 x13; Airbnb home 28 then **18 x2** then 14 x10; Fresha venue 28 then **19 x2** then 16 x12. Their anchor-to-second-tier drop is 8, 10 and 9px; ours on the three commit screens is 12px with one text run under it. `LOCKFILE.md` §2.5 counts sizes and caps them at 4; `research/TASTE_RANGE.md` measures spread. Neither measures whether the ramp has a hole in it. |
| **Belongs in** | `_design-system/LOCKFILE.md` §2.5, beside the per-screen budget that currently only counts. Not a new file: the budget rule is already there and this is the second half of it. |
| **09-04?** | Partly. It named the missing SCALE ("a permission list, not a scale"). It did not name the missing SHAPE, and the shape is what the round-1 folds fail. |

### G9. No file says anything about what is INSIDE a photograph

| | |
|---|---|
| **The number** | Cited from `WHY_UNFINISHED.md` section 3, with its own control: the six seeded Unsplash photos measure mean HSV saturation 0.193, 0.248, 0.157, 0.221, 0.430 and **0.000**. The zero one, `photo-1560066984`, is greyscale, computed `filter` is `none`, and it renders in the fold of **five of the ten** picked directions. bookings-list A is 57.0% photographic and **0.0%** coloured; Airbnb listing is 44.4% and 32.5%. `CLAUDE.md` FLOORS LAW 2 and `LOCKFILE.md` §17.1 both specify photographic AREA and the missing-photo fallback, and neither says a word about the content of the photograph. |
| **Belongs in** | `_design-system/LOCKFILE.md` §11 (Imagery Pattern Registry, its existing "Sourcing policy" subsection). Fixing the asset itself is a seed change, which `CLAUDE.md` taste rule 1 names as the expected move, not fabrication. |
| **09-04?** | No. |

### G10. The border-and-shadow rule exists and nothing counts boxes at render time

| | |
|---|---|
| **The number** | Cited from `WHY_UNFINISHED.md` section 4: elements carrying a border AND a shadow at once, in the fold, across the direction pages: payment-step A **6**, search-results A 3, empty-states C 3, confirmation C 1, press-motion A 1, profile C 1, **15 in total**. Across all five live reference folds the total is **1** (Airbnb home). Bordered elements in the fold: payment-step A 13, empty-states C 12, search-results A 11 against Airbnb listing 3, Fresha venue 4, Fresha search 4. `LOCKFILE.md` §17.2 states the rule in its own words: *"a card carrying elevation drops its border, never both."* `scripts/check-geometry.mjs` renders a FLOORS pass and does not count either. |
| **Belongs in** | `scripts/check-geometry.mjs` (the FLOORS pass), with the numeric ceiling recorded in `_design-system/LOCKFILE.md` §17.2 beside the prose rule it already carries. |
| **09-04?** | No. |

### G11. Every `/dev` page is stripped of the product chrome, so a direction is judged on a screen the product does not have

| | |
|---|---|
| **The number** | `app/[locale]/_components/layout/HideInBooking.tsx:60`: `if (/\/dev(\/|$)/.test(pathname)) return null;` and its own comment two lines above, *"The header, the bottom nav and the consent bar all belong to the PRODUCT. A /dev preview page..."* (verified). So Header, `BottomNav` and the consent bar are removed from every direction page. Measured, cited from `WHY_UNFINISHED.md`: fixed or sticky blocks intersecting the fold, all ten direction folds **0** (payment-step A carries 1, its own sticky bar); live `/en` **2**; Airbnb home 3; Fresha search 2. `BottomNav.tsx` is real, mounted at `app/[locale]/layout.tsx:170`, `md:hidden fixed inset-x-0 bottom-0`, and its own header comment records the height as **125px total** (verified). Round 1 therefore composed eight screens for a phone viewport 125px taller than the one a customer gets, and the switcher strip put 44px of scaffolding back in its place. |
| **Belongs in** | `_design-system/PROCESS.md` (how design work is scoped and graded). Not a design-law file: nothing about the look is wrong, the instrument is. |
| **09-04?** | No. |

### G12. Three sources give a phone CTA label two different sizes

| | |
|---|---|
| **The number** | `CLAUDE.md:129` design contract: "CTA **15** (never <=13 on a button)". `_design-system/LOCKFILE.md` §2 Scale table, CTA row: mobile **14px**, desktop 15px. `_design-system/LOCKFILE.md` §2.5 role registry, Primary CTA and Secondary CTA rows: **15px** flat, no phone column (verified). Round 1 rendered 15px/500 on every primary button measured (cited, `ROUND1_LOOK_TABLE.md`), so the shipped answer matches two of the three sources. This is the same shape as the meta 12-vs-13 contradiction that was closed on 2026-09-04 (`LOCKFILE.md:393-397`), on a role that pass did not touch. |
| **Belongs in** | `_design-system/LOCKFILE.md` §2's Scale table (give the CTA row the same phone/desktop reconciliation the Core ramp got on 2026-09-04). |
| **09-04?** | No. That pass reconciled meta and eyebrow and stopped there. |

### G13. Our heaviest weight is 500 by a live CSS rule, and no file records what carries the anchor instead

| | |
|---|---|
| **The number** | `app/globals.css:269`: `main :is(.font-semibold, .font-bold) { font-weight: 500; }`, with `[data-surface="dashboard"]` restored to 600 on the next selector (verified). Cited from `WHY_UNFINISHED.md`: characters at weight >= 600 in the fold measure **0.0%** on eight of the ten picked directions and on the live salon page, against Airbnb home 9.4%, Airbnb listing 5.5%, Fresha venue 8.2%, Fresha search 17.5%. The internal control is in the same run: profile A and profile B render the same content, A tops out at 500 with 0.0%, B reaches 700 with 14.4% by setting `fontWeight` inline at `profile/_vb/AccountHubAirbnb.tsx:191,270` with the comment *"inline style beats the sitewide font-bold->500 clamp"*. Six such inline bypasses exist across the directions folder. **This is a dated owner decision (2026-08-15, option C), not a defect.** The gap is that the row records the trade and nothing states what carries the anchor once weight cannot, so builders reach for an inline bypass. |
| **Belongs in** | `_design-system/LOCKFILE.md` §2 Weight scale, beside the existing row. |
| **09-04?** | No. |

### G14. The type fix cannot be executed by a subagent, because the ceiling it needs is on the open list

| | |
|---|---|
| **The number** | `_design-system/TASTE_AUTHORITY.md:279-281`, section 5 ("OPEN, AND NOT YOURS TO CLOSE"): "**B37 (2026-08-16), the size-count contradiction.** Our own written rules disagree: one place demands 6 to 7 distinct sizes, another caps a screen at 4. He named this as a cause of the clutter he was complaining about and left it open ... Until he closes it, the enforced 4-size and 2-weight ceiling is the working default everywhere." Measured against that ceiling, cited from `WHY_UNFINISHED.md`: Airbnb home renders 6 distinct sizes, Airbnb listing 5, Fresha venue 5, Treatwell 6 across its site. Four of the five reference folds break our working default. |
| **Belongs in** | Nothing to write. It is a question for him, and it is already logged as one. Recorded here so nobody executes 09-04's formula 1 and reports it as done. |
| **09-04?** | No. Its fix order item 2 named the two values that needed his word (meta 12 vs 13, eyebrow 11 vs 12); both were closed the same day at `LOCKFILE.md:393-397`. B37 is a different and larger question and it is still open. |

### G15. The one file `CLAUDE.md` calls "the contract the whole app holds to" is hand-typed and stale

| | |
|---|---|
| **The number** | Cited from `DESIGN_FILES_AUDIT.md` section 1: `public/solen-styleguide.html` is 168 lines of hand-authored HTML, nothing generates it from `tailwind.config.js` or `LOCKFILE.md`, and it is stale on radius (`:34-36`, `:148` render buttons and the "Button / chip" demo box at `border-radius:999px`, against `CLAUDE.md:134`'s 16px). Verified this run: those line numbers and values are as reported. |
| **Belongs in** | Either a generator script that emits it from `tailwind.config.js` + `LOCKFILE.md`, or `CLAUDE.md` drops the claim that the drift gate holds to it. |
| **09-04?** | No. |

---

## What is NOT missing, so nobody writes a rule that exists

Every line here was checked this run. Writing any of these again is duplication, and rule 12 refuses it.

- **No floor is missing.** 09-04's headline finding stands and this run strengthens it: measured against
  our own written floors, the references FAIL six of them (cited, `WHY_UNFINISHED.md`, "Where our own law
  pushes away from the reference"): Airbnb home uses 4 weights and 6 sizes, Airbnb listing's anchor is
  26px, Fresha venue's anchor ratio is 1.75, Fresha search's is 1.14, four of five folds miss the 1/3
  imagery floor, and Airbnb's own Past-trips empty state sits at 42% dead space. Our ceilings are all
  satisfied and the screens still lose. A new floor is not the lever.
- **The spacing ladder exists and is tabulated.** `LOCKFILE.md` §3 "Spacing rhythm": Section 32px, Card
  12px, Group 16px, plus the named HOME-FEED EXCEPTION at roughly 24px (verified). **This corrects
  `DESIGN_FILES_AUDIT.md` section 5**, which listed "a single, sourced customer-screen gap ladder table"
  as having no home; it has one, at that section, dated 2026-06-11 and owner-approved. What is missing is
  a check that counts the rendered gaps against it (confirmation C's fold renders nine distinct band
  gaps, cited from `WHY_UNFINISHED.md`), which is the same instrument gap as G10, not a second one.
- **The warm shadow tint is deliberate.** `LOCKFILE.md:685` says so by name and tells you not to "fix" it.
  See G4: the real defect is a value mismatch, not the tint.
- **The phone page margin IS locked, and the code obeys it.** `LOCKFILE.md` §7 "Container widths", the
  Page-outer row: mobile padding `px-4`, i.e. 16px each side (verified, read this run). Measured live at
  390x844 the same run, taking the modal left edge of every visible block wider than 200px: `/en` renders
  34 elements at x=16 and `/en/salon/muse-beauty-studio` renders 89 at x=16, with the only other cluster
  at x=0 (the full-bleed rails). Airbnb runs 24 and Fresha 20, so we are the tightest of the three, but
  that is a taste question with a dated home, not a hole. **This corrects `_plans/R2_LOOK_SYSTEMS.md`'s
  own A6 row**, which said the page margin was "not locked as a single number in LOCKFILE §7 as far as
  this run checked"; that row is fixed in the same pass.
- **The ink FILL is `#1C1C1F`, not `#0A0A0A`, and that is his dated decision, not drift.** `LOCKFILE.md:41`
  (`s-ink-soft`, owner-picked 2026-08-15 off `/dev/pill-ceramic`) makes `#1C1C1F` "THE INK FILL. Every
  filled-black surface", `app/globals.css:230-232` implements it as a one-line `.bg-s-ink` override, and
  `tailwind.config.js:205` defines the token. `#0A0A0A` stays the TEXT ink, by his explicit carve-out.
  Measured this run on `/en/dev/directions-0905-r2/salon-book-button`, the ink Book button computes
  `rgb(28,28,31)`. So round 1's four screens at `#1C1C1F` were right and press-motion A's `#0A0A0A`
  button was the outlier, which is the reverse of how `ROUND1_LOOK_TABLE.md` inconsistency 2 reads at a
  glance. Nothing to write; recorded because two round-2 planning rows had it backwards.
- **The container test exists.** `LOCKFILE.md` §3 "THE CONTAINER TEST" (owner 2026-07-28), three earned
  cases, plus "Never both" and the measured 24px divider inset. `PRINCIPLES.md` section 4 carries the box
  budget. Both were read this run.
- **The empty-state anatomy is locked and both references validate it.** `CLAUDE.md` design contract
  "states" row plus `research/TASTE_EMPTY_STATES.md`; `fresha--look-recipes.md`'s own Conflicts section
  closes with the finding that Fresha's empty state (vivid icon, headline, subline, CTA) validates
  Solen's existing spec with no change needed.
- **A customer bottom nav is approved AND built.** `REMOVED.md:124` records the 2026-08-10 reversal in his
  own words; `BottomNav.tsx` exists and is mounted at `layout.tsx:170`. Do not re-propose it and do not
  re-graveyard it. What is true is G11: it does not render on `/dev`.
- **The badge taxonomy exists** (`LOCKFILE.md` §13.3). Its Status row is stale (G7); the table is not missing.
- **`MOTION.md` is current and internally consistent** (cited, `DESIGN_FILES_AUDIT.md` section 2). The
  round-1 motion problem was a stale task brief paraphrasing it, not the file.
- **The press recipe for round 2 is settled**, and it is direction A, measured at
  `press-motion/_va/PressPillA.tsx:129-134` and `PressSheetA.tsx:92-108`. It is transcribed into
  `_plans/R2_LOOK_SYSTEMS.md` Part A and does not need re-deriving.
- **Seeding is not fabrication.** `CLAUDE.md` taste rule 1 says so in capitals and adds "This rule may
  never again be cited as a reason NOT to seed." G9's fix is a seed swap.

---

## The one-sentence answer, for the reply and not only for this file

Nothing is missing from the law; what is missing is that **the value a builder types and the value the
law states are different values**, in at least four rendered places measured this run (radius 99 vs 16,
elevation-2 two ways, CTA 14 vs 15, and a status badge whose own shipped colours break the taste rule
that describes it) plus one naming defect (a token called input that no input renders), and no check
compares the two, so thirty mockups obeyed the tokens, passed every gate, and landed on the wrong side
of the law.
