# Consistency Audit (V3-D442, 2026-06-07)

> **SWEEP STATUS (2026-06-07), applied + verified on real pages:**
> - Card shadows -> `shadow-elevation-2/3` (salon-card family).
> - ~152 flat hairlines `border-s-ink/{op}` -> `border-s-border` (on-photo / rings / hover variants intentionally skipped + logged).
> - 19 star raw `#FFC32B` -> `fill-s-star`. 15 raw `red-*` -> `s-error`.
> - Booking date/time -> grouped grid + blue selected. Status dot removed. PDP gradient-fade book bar.
> - **Green availability pill: REVERSED (V3-D443) — owner rejected it; card availability = plain ink text. Do NOT re-add.**
> - Gate extended: blocks net-new raw palette colours (A15) + decorative accent dots (A16).
> - tsc clean. Busiest pages (results / home / PDP) verified no regression.
>
> **Remaining (minor / deferred):** logged ambiguous skips (a few destructive-red fills, control rings); booking+search date-component consolidation; pay + confirmation screens (now inherit the locked rules).

Cross-codebase scan for design INCONSISTENCY: where the same situation gets a
different treatment. Two read-only audit agents scanned
`app/[locale]/_components/**` (99 files) + `components-legacy/**` (271 files)
along metric axes (radius, type-size, spacing, widths, icon size) and treatment
axes (accent/ink, semantic colour, shadow, circles/dots, borders, price).

**Headline:** the design system already HAS the rules. The drift is (a) the same
value written two ways (a token vs an arbitrary `[Npx]`), and (b) the same role
approximated at a dozen values / opacities. About 90% has a clear canonical and
just needs applying + ENFORCING. Only TWO things are genuine conflicts that need
a human call. (This vindicates the council's original point: the gap is
enforcement, not undecided taste.)

---

## A. Clear canonical, apply + enforce (no decision needed)

| Axis | Canonical | Worst outliers to fix |
|---|---|---|
| **Hairlines** | `border-s-border` (#E4E4E7, corrected 2026-07-10 — was stale #E7E5E4, matches SOURCE.md:211's live token) | ~480 `border-s-ink/{5,10,[0.06],[0.08]...}` callsites running parallel to 201 canonical uses. The single most-duplicated treatment in the app. Plus 4 raw-hex borders (#F0EDE8 / #E0E5DD ghosts in WhySolen). |
| **Star** | `s-star` token | raw `fill="#FFC32B"` in ~28 files (SalonCard:540, SalonResultCard:223/289/367, SalonHeader:84, SalonReviews). Token bypassed almost everywhere. |
| **Card photo radius** | `rounded-card` (16) | 16 / 18 / 22 mix. `SalonResultCard.tsx` uses ALL THREE (:213=16, :278=18, :356=22); homepage SalonCard:464=22. Kill 18 + 22. |
| **`rounded-[13px]` phantom** | `rounded-input`(16) / `rounded-btn` | 18 uses in Header:517/687, SearchBar:342/641, SearchOverlay (×9), WalkInBand. Not on the scale at all. |
| **`rounded-[12px]` blocks** | `rounded-card` / `rounded-2xl` (16) | 169 uses for content blocks / option-cards / inputs (SalonServices:80, PayConfirmStep:321, ProfilePage:1032). |
| **CTA label size** | 15px | 9 / 10 / 11 / 12 / 13px micro-labels on `bg-s-ink` / `bg-s-accent` buttons (~55 are <=11px). The pre-V3-D330 "cheap CTA" pattern the registry was meant to kill. |
| **Icon-button wrapper** | `h-11 w-11` (44px, a11y min) | h-7 / h-8 / h-9 / h-10 / h-12 + [34/38/42px]. Header mixes h-10 and h-11 on adjacent buttons. |
| **Card name size** | bake 14 into `<CardName>` | 13 / 14 / 15 across the card families. The primitive bakes weight + colour but NOT size, and only 3 files use it. |
| **Page container** | `max-w-[1280px]` | 1200 / 1120 / 1240 drift (keep 1180 = PDP family, 1400 = /business). |
| **Card / control shadows** | `shadow-elevation-2/3` | ~90 arbitrary `shadow-[...]`. SalonResultCard alone has 3 photo shadows (list `0_8px_20px`, grid `0_20px_40px`). Coloured-shadow ghosts (green WhySolen:129, blue WalkInBand:100, teal Header:637). |
| **Error colour** | `s-error` token | 50+ raw `red-*` in booking / profile / ui (parallel to ~180 `s-error`). |
| **Decorative dots** | delete (banned, taste rule #2 / LOCKFILE §11) | accent dots before section labels: SearchResults:208, Entdecken:245, DateTimeStep:312 (waitlist), BentoBusiness:160-168. |
| **Section-H2 size** | `clamp(18px,2vw,20)` | 18 / 19 / 21 / 22 / 24 hardcoded. SOURCE.md says clamp->23, LOCKFILE says clamp->20; LOCKFILE wins on aesthetic (dual-axis rule), so 20. Fix SOURCE.md too. |
| **Notation** | prefer the token, not arbitrary `[Npx]` | radius 16 = `rounded-card` / `rounded-2xl` / `rounded-[16px]`; size 14 = `text-sm` / `text-[14px]`. Pick one NOTATION per value or it re-drifts. |

---

## B. Genuine conflicts, NEED A CALL (not guessing these)

### B1. Selected / active-state colour: blue vs ink vs grey  ~~[RESOLVED 2026-06-07: BLUE]~~

> **SUPERSEDED (owner 2026-06-29, gate `no-black-selected`; LOCKFILE §13.1 point 3, line 1215):** every
> selected state EXCEPT calendar date + time slot (filter pill, chip, active tab, radio, menu/list
> option, segmented control) moved to calm GRAY fill (`bg-s-bg-sunken` #F4F4F5 + `text-s-ink` + semibold
> over a white unselected, the TabPill treatment) — NEVER blue-border, NEVER black/ink. Quote: _"EVERY
> OTHER selected state (filter pill, chip, menu/list option, segmented control) = calm GRAY fill…
> NEVER black/ink."_ The booking-flow calendar date + time slot are the one still-blue EXCEPTION
> (design contract, CLAUDE.md "selected/active" row: "booking date/slot stays blue"); the ONE primary
> commit button stays ink. The 2026-06-07 decision below is now READ NARROWLY: it still governs the
> date/time-slot exception, not "active tab, radio" generally (those are gray per the 2026-06-29 rule).

**DECISION (historical, 2026-06-07 — narrowed by the 2026-06-29 supersession above):** selected / active single-choice = **blue `s-accent`** (calendar date, time slot, active tab, radio); **ink only for the one primary commit button.** Owner: "both b".
The biggest one. The code has **5 dialects** of "selected" (ink fill, accent
fill, blue wash, grey fill, ink-border) and **3 docs disagree** (COMPONENT_REGISTRY
= grey TabPill, LOCKFILE §1.5 = ink, inline V3-D421k = blue for search filters).
Concretely: the **same selected date is INK on the booking calendar but BLUE on
the search calendar**; the booking time-slot is ink.

**My recommendation:** one rule keyed on control TYPE, not surface:
- Active / selected single-choice = **blue `s-accent`** (calendar date, time
  slot, radio, active tab). Blue is the active accent in the B&W system + what
  you leaned toward in round 3.
- The ONE primary commit button = **ink `bg-s-ink`** (Book / Pay).
- Low-emphasis multi-filters (search chips) = blue-tint wash (already there).

Collapses all 5 dialects + fixes the calendar flip.
**Decision: blue-for-selected (rec) / ink-for-selected / keep search-blue vs booking-ink?**

### B2. Card price weight: bold-ink vs grey (your round-1 pick vs rule A13)  [RESOLVED 2026-06-07: BOLD-INK, anchor by size]
**DECISION:** keep the **bold-ink price**; the salon NAME stays larger so it remains the anchor. Amend A13 to "anchor by SIZE; name + price may both be ink if the name is larger." Owner: "both b".
Round 1 you picked **bold-ink price number**. LOCKFILE rule A13 says a card has
exactly ONE ink anchor (the name) and the price recedes to grey. The code already
splits: `SalonResultCard:304,322` bolds the price (your pick) while `SalonServices`
was explicitly fixed the OTHER way (grey) per A13 (V3-D346). Same role, opposite
treatment, and it's your fresh decision vs the written rule.

**My recommendation:** keep the bold-ink price (people scan price) and resolve
"one anchor" by SIZE not colour: name = bigger (15) medium-ink = primary anchor;
price = smaller (13) semibold-ink = secondary. Both ink, hierarchy via size.
Amend A13 to "anchor by size; name + price may both be ink if the name is larger."
**Decision: keep bold-ink price (rec, amend A13) / price goes grey (obey A13, revert round 1)?**

---

## C. Minor / flag only (low stakes)
- Legacy shadow-alias names (`shadow-card` / `warm-*` / `v5-*`) all map to
  elevation-1/2/3: 7 names for 3 values. Safe to collapse, churn-vs-tidy call.
- Icon-circle wrapper has no locked size (proposing h-11 above).
- Inline `·` separators where BOTH bits are the same grey weight: the no-dot rule
  only bites when colour / weight already differ. Same-grey bits legitimately need
  a divider, so a `·` is fine there. Keep per-case.

---

## D. Enforcement (so it does not re-drift), extend check.py
A one-time sweep returns in a month without a gate. Add drift-checker rules.
**DONE (V3-D442, live + tested in the PreToolUse gate): A15 raw Tailwind palette
colour (`bg-red-500` etc.) -> semantic token; A16 decorative accent dot.** Still to add:
- Flag `border-s-ink/[0-9.]+` + raw-hex borders -> "use border-s-border".
- Flag raw `#FFC32B` / `#FF3366` / `#16A34A` in className/style -> "use the s-star / heart / s-success token".
- Flag arbitrary `rounded-[Npx]` / `text-[Npx]` / `shadow-[...]` where a token exists -> "use the token".
- Flag `text-[<=13px]` on `bg-s-ink` / `bg-s-accent` -> "CTA label = 15px".
- Once B1 is decided, flag the wrong selected-state colour on single-select controls.
The gate already blocks raw hex + retired tokens; these extend it.

---

## E. Remediation sequence
1. Settle B1 + B2 (owner).
2. Encode the canonicals into check.py (enforce) + reconcile the SOURCE / LOCKFILE
   doc conflicts (section-H2 size, selected-state).
3. Sweep, prioritised by traffic: hairlines -> star token -> card radius / shadow ->
   CTA label -> selected-state -> decorative dots. Component-first (fix the
   primitive, adopt everywhere), not file-by-file.

Raw agent findings (full file:line tables) preserved in the session transcript.
