# A4 — Code-vs-Law Drift Census

Read-only census. Corresponds to `_plans/DESIGN_CONSOLIDATION.md` item A4. No code was edited to produce this
file; `check.py` was NOT edited (Task Part 3 constraint).

Scope for Part 2 (classes a-j): `app/[locale]/_components/**` (126 .tsx/.ts files) + `components-legacy/**`
(189 .tsx/.ts files) = 315 files. `public/_mockups/**` and `node_modules` excluded per instructions.

---

## 1 — Drift-checker run (fresh vs committed report)

**Invocation** (from `.claude/skills/solen-drift-check/SKILL.md`, report mode, not gate mode):

```bash
python3 .claude/skills/solen-drift-check/scripts/check.py [--strict-only] [--out REPORT.md]
```

Default output path: `_design-system/_drift-report.md` (committed, dated 2026-06-12). Fresh run written to
the scratchpad and diffed against the committed copy.

### Summary comparison

| | Committed (2026-06-12) | Fresh (2026-07-12) | Delta |
|---|---|---|---|
| Strict scope files scanned | 93 | 94 | +1 |
| Strict scope hard findings (A1-A6/B1-B5) | 30 | 46 | **+16** |
| Strict-scope INFO (A7-A11, phase-1) | 1,272 | 2,032 | **+760 (+60%)** |
| Informational scope files scanned | 787 | 797 | +10 |
| Informational scope findings (legacy) | 6,021 | 10,986 | **+4,965 (+82%)** |

The informational/legacy-scope finding count nearly **doubled** in the month since the committed report.
This is new code outpacing cleanup, not the checker getting stricter — no rules were removed in that window
(rules were only added: A15-A21, C1-C3, C6-C7 all postdate 2026-06-12, which also explains part of the
count growth independent of raw code drift).

### Strict-scope hard findings: by rule

| Rule | Committed | Fresh |
|---|---|---|
| A21 tracked-uppercase eyebrow | 23 | 18 |
| A1 hardcoded hex | 1 | 5 |
| A17 opacity hairline | 4 | 4 |
| A20 middle-dot separator | 0 | 3 |
| A19 sub-12px text | 1 | 2 |
| B5 category-specific branch | 1 | 1 |
| C2 hardcoded URL | 0 | 6 |

(C2 rule did not exist, or these files did not exist, at the 2026-06-12 snapshot.)

### File-level diff, deduped by file+rule (line-shift noise removed)

**Genuinely new** (not present 2026-06-12):
- `app/[locale]/_components/homepage/SalonCard.tsx:48-51` — **A1 hardcoded hex, 4x**: `"#F5F5F4"` used as the
  category-icon background for coiffeur/barbershop/nails/spa. This is the **wrong/transposed** sunken-grey
  value — LOCKFILE's real `s-bg-sunken` is `#F4F4F5` (§1, line 44); `#F5F5F4` was removed from
  `check.py` `ALLOWED_HEX` on 2026-07-11 specifically because it's the transposed/incorrect value (see
  Part 3, D2). SalonCard.tsx never got the memo — it's the one place in the codebase still writing the
  wrong hex, on the most-viewed customer card.
- `app/[locale]/_components/business/MarketplaceVisual.tsx:75-76` — A19 (11px text, below 12px floor) + A20
  (`·` separator) — new component, born already violating two banned-copy/type rules.
- `app/[locale]/business/page.tsx:72,191,237,242` — new/expanded page: 1 hardcoded solen.ch URL (C2), 1
  tracked-uppercase eyebrow (A21), 2 middle-dot separators (A20).
- `app/[locale]/{barbershop,coiffeur,nails,spa}/page.tsx:47,63` and `{privacy,terms}/page.tsx:11,12` — 6 new
  pages, each with 2x C2 (hardcoded `https://solen.ch/...` in `metadata.alternates.canonical` /
  `languages` / JSON-LD `url`). Copy-pasted boilerplate, not a design-system violation in the visual sense,
  but a real hardcoded-domain smell (breaks staging/preview canonical tags). Low severity, mechanical fix
  (env-driven base URL).
- `app/[locale]/salon/[slug]/barber/[barberSlug]/page.tsx:241` — A19 sub-12px text (new route; the old
  `gift-card/page.tsx:238` A19 finding it "replaces" in the diff is coincidental, not a fix — see below).

**Resolved since 2026-06-12** (net file+rule drops):
- `app/[locale]/dev/new-primitives/page.tsx` — A21 count 8 → 5 (3 eyebrows fixed; dev-only page, not
  customer-facing, low stakes either way).
- `app/[locale]/vouchers/buy/page.tsx` (3x A21) and `app/[locale]/salon/[slug]/gift-card/page.tsx` (1x A19)
  — **not a design fix.** Both pages were replaced with a one-line `redirect()` stub
  (`vouchers/buy/page.tsx:1-14`, comment: "HIDDEN from customers (owner, 2026-06-14)... reversible"). The
  gift-card/vouchers feature was shelved product-side; the drift findings disappeared because the markup
  disappeared, not because anyone swept it.

**Net read:** of the ~16 net-new hard findings, exactly zero come from a regression in previously-clean
code — they're either brand-new components/pages built after 2026-06-12 (which is expected drift velocity,
not decay) or a real bug (the `#F5F5F4`/`#F4F4F5` transposition landing in SalonCard.tsx, see Part 3 tie-in).
The "resolved" findings are almost entirely a feature being hidden, not a token sweep.

---

## 2 — Census by class (classes the checker does NOT catch)

Regexes and exact counts below; "worst 5 files" ranked by hit count, line numbers cited. REGRESSION =
`_design-system/CONTRADICTIONS.md` (EXECUTED 2026-06-08) explicitly claimed this class fixed and it is
provably not. KNOWN DEBT = CONTRADICTIONS.md never claimed this class fixed, or explicitly deferred it.

### a. Secondary-text drift — `text-s-ink/(50|55|60|65)`

**Total: 5 hits, 2 files.** CONTRADICTIONS.md §2 called this "~420 legacy hits, the biggest" contradiction
class. Now down to 5. **This class was genuinely swept.**

- `components-legacy/ui/ScrollableFilterRow.tsx:105,114,128` (3)
- `components-legacy/salon/ServiceCategoryFilter.tsx:39,51` (2)

**Verdict: CONFIRMED FIXED** (99%+ reduction from the audited baseline). The 5 residual hits are
concentrated in exactly the 2 files that also still carry classes b and j below — these two files were
missed by whatever swept everything else, not evidence the sweep failed generally.

### b. Hairline drift — `border-s-ink/NN`, `border-black/NN`, hardcoded border hex

**Total: 69 `border-s-ink/[N]` hits + 2 real hardcoded border hex** (2 more are explicitly `drift-ok`
owner-approved exceptions, excluded). `border-black/*` — 0 hits (fully clean). CONTRADICTIONS.md §2 called
this "~30 hits" and claimed it fixed.

Worst 5 files (`border-s-ink/N`):
- `components-legacy/staff/StaffProfilePage.tsx:287,352,362,440` (4)
- `components-legacy/nail/InspoBoard.tsx:111,119,154,204` (4)
- `components-legacy/dashboard/nail/NailClientTab.tsx:50,166,239` (3)
- `components-legacy/dashboard/nail/DynamicPricingConfig.tsx:142,152,213` (3)
- `components-legacy/dashboard/ClientPhotosTab.tsx:110,121,139` (3)

Hardcoded border hex (real, non-exempt):
- `app/[locale]/_components/homepage/WhySolen.tsx:160` — `border-[#F0EDE8]`
- `components-legacy/dashboard/barber/LiveQueuePanel.tsx:153` — `border-[#BBE3C6]`

Exempt (owner `drift-ok` comment, not counted as violation): `components-legacy/discovery/ProgressiveFilter.tsx:138,176` (`border-[#D7D7DB]`).

Note: `StaffProfilePage.tsx` is one of the three files CONTRADICTIONS.md explicitly cites as fixed for a
**different** class (§0 dead hover / §2 fill-s-amber, both confirmed clean — see class d and j). It was
fixed for those two things and never touched for hairline.

**Verdict: REGRESSION.** 69 >> the ~30 baseline CONTRADICTIONS.md said existed before the "done" sweep. The
class was not swept; either the original count was undercounted or it grew back. Either way the "done"
claim doesn't hold.

### c. Sunken-surface drift — `bg-s-ink/[0.02–0.10]` used as calm surface

**Total: 93 hits across 48 files.** True scrims (backdrop overlays at `/40`–`/80`, exempt) checked
separately: **31 hits**, e.g. modal/sheet backdrops — sampled and confirmed legitimate (full-screen dim
layers, not card/chip surfaces). CONTRADICTIONS.md §2 claimed this fixed ("keep ink-opacity only for true
scrims").

Worst 5 files (all in the 0.02-0.10 calm-surface range, confirmed by sampling — icon bubbles, chip
backgrounds, hover washes, none are scrims):
- `components-legacy/editor/EditPanel.tsx:241,257,409,416,443` (5)
- `components-legacy/onboarding/steps/PaymentsStep.tsx:66,91,121,140` (4)
- `components-legacy/nail/HandChart.tsx:114,115,145,146` (4)
- `components-legacy/discovery/PostFromDiscover.tsx:199,206,242,258` (4)
- `components-legacy/discovery/DiscoveryAdmin.tsx:42,201,397,398` (4)

**Verdict: REGRESSION.** Widespread across 48 files, none of which are the files CONTRADICTIONS.md's §2
cited as examples (`layout/Header.tsx`, `MobileMenu.tsx`, `homepage/SearchBar.tsx` — spot-checked, all 3
now clean of this pattern). Reads as: the cited examples got fixed, the class as a whole did not.

### d. Star drift — `fill-s-amber`, raw `#FFC32B` outside token def, raw star polygon SVGs

**Total: 0 real violations.**
- `fill-s-amber`: 0 hits anywhere in scope.
- Raw `#FFC32B`: 14 hits, all either (1) comments/docstrings referencing the token value, or (2) `fill="#FFC32B"`
  on a `<Star>`/inline-SVG element — this is the **token-equivalent exemption** (`ALLOWED_HEX`, check.py:39,
  V3-D446: fill= contexts can't reach a Tailwind class, so the exact hex IS the token). Not drift by the
  project's own rule.
- Raw star polygon SVG: 1 hit, `components-legacy/MapView.tsx:304` — a hand-built `<polygon>` star inside a
  Leaflet marker icon string. Leaflet markers require a raw HTML string (can't render a React `<Star>`
  component into a Leaflet DivIcon), so this is a technical necessity, not a drift violation of the
  "real Lucide icons only" rule. Flagged as informational, not a violation.

**Verdict: CONFIRMED FIXED.** CONTRADICTIONS.md §2's 3-way star inconsistency (fill-s-star vs fill-s-amber
vs raw hex) is fully resolved.

### e. Radius drift — `rounded-[Npx]` arbitrary vs locked set {16 card/input, 28 sheet, 22 result-card photo, pill}

**Total: 413 instances, 18 distinct N values.**

| N (px) | Count | Has a named token already? |
|---|---|---|
| 12 | 139 | No (closest: `input`=16) |
| 16 | 86 | **Yes** — `rounded-card` / `rounded-panel` / `rounded-input` all = 16px |
| 8 | 59 | No |
| 14 | 25 | No |
| 10 | 24 | No |
| 24 | 18 | No (`card-lg` = 20px, close but not equal) |
| 13 | 12 | No |
| 20 | 10 | **Yes** — `rounded-card-lg` = 20px |
| 6 | 7 | No |
| 18 | 7 | No |
| 9 | 6 | No |
| 22 | 6 | No named token, but this IS the locked result-card-photo value (see below) |
| 4 | 5 | No |
| 28 | 3 | **Yes** — `rounded-sheet` = 28px |
| 11 | 3 | No |
| 40, 2, 15 | 1 each | No |

`rounded-[22px]` (6 hits, `SalonCard.tsx:490`, `SalonResultCard.tsx:314,379,611`, `CategoryHeroCarousel.tsx:101`)
is the **correct, locked** result-card-photo radius per the CLAUDE.md contract table — flagged by the
regex but not a real violation; no `rounded-photo` token exists so the bracket form is currently the only
way to express it. Not counted as drift below.

Worst 5 files (all N values combined):
- `components-legacy/dashboard/spa/WellnessJournal.tsx:128,160,196,217,234,250,255,263,284,298,307,326,331,375` (14)
- `components-legacy/discovery/DiscoveryAdmin.tsx:31,40,174,179,189,223,237,265,316,323,335,412` (12)
- `components-legacy/dashboard/spa/RoomManager.tsx:143,162,176,194,212,226,243,260,279,284,315,322` (12)
- `components-legacy/dashboard/barber/FadeBlueprint.tsx:141,150,162,191,230,239,269,294,316,332,352,361` (12)
- `components-legacy/refund/RefundCaseView.tsx:73,75,77,439,447,463,550,745,781,790` (10)

**Named-primitive regression (worse than the census-average finding):** CONTRADICTIONS.md §3 specifically
named `primitives/TextInput.tsx`, `Select.tsx`, `Textarea.tsx` as `rounded-[12px]` vs the LOCKFILE `input`
token (16px), recommending "one token (`rounded-input`)". Re-checked directly:
- `primitives/TextInput.tsx:22` — still `rounded-[12px]`
- `primitives/Select.tsx:19` — still `rounded-[12px]`
- `primitives/Textarea.tsx:17` — still `rounded-[12px]`

All three shared input primitives are unchanged since the audit. Every text field, select, and textarea in
the product still renders at 12px radius against a 16px contract. `primitives/Sheet.tsx:38` (the other §3
citation, `rounded-t-[28px]`) is correct — confirmed as already-matching at audit time and still matching.

**Verdict: REGRESSION**, and the worst one in this census: the specific example CONTRADICTIONS.md gave
(shared form-input primitives) was never touched, meaning the drift isn't confined to legacy leaf
components — it's baked into 3 primitives that every form in the app inherits from.

### f. Shadow drift — raw `box-shadow`/`boxShadow` rgba vs `shadow-elevation-*` tokens

**Total: 83** (16 inline `style={{ boxShadow: "..." }}` + 67 `shadow-[...]` arbitrary Tailwind classes).

Inline `boxShadow:` worst files:
- `app/[locale]/_components/homepage/SalonCard.tsx:194,213,216,222,228,232` (6) — a full set of
  category-tag style objects (`amberStyle`, `angebotStyle`, `urgentStyle`, `greenStyle`, `tealStyle`), each
  hand-rolling `rgba(26, 28, 25, 0.04)` instead of `shadow-elevation-1`.
- `app/[locale]/_components/homepage/BentoBusiness.tsx` (2)
- `components-legacy/ui/interactive-hover-button.tsx`, `GlassModal.tsx`, `shared/ClientSelectorDropdown.tsx`,
  `loyalty/StampCard.tsx`, `discovery/LikeButton.tsx`, `ReviewForm.tsx` (1 each)

`shadow-[...]` arbitrary worst files:
- `app/[locale]/_components/layout/MobileMenu.tsx:197,214,252,254,304,374,376,463,465` (9)
- `app/[locale]/_components/search/SearchTemplate.tsx:791,1241,1480,1850,2011,2178` (6)
- `app/[locale]/_components/layout/Header.tsx:299,508,510,711,740` (6)
- `app/[locale]/_components/homepage/WhySolen.tsx:100,129,158,200` (5, +1 more not line-cited)
- `app/[locale]/_components/homepage/BentoBusiness.tsx` (4)

CONTRADICTIONS.md §3 cited `SalonServices.tsx:203` and `SalonOtherLocations.tsx:67` by name. Re-checked
directly: **both files now have zero `boxShadow`/`shadow-[` hits** — genuinely fixed.

**Verdict: MIXED — REGRESSION on the class as a whole, the two named examples are CONFIRMED FIXED.** The
audit fixed exactly the 2 files it named and nothing else; `SalonCard.tsx`'s 6 inline shadow objects and the
`MobileMenu`/`Header`/`SearchTemplate` shell-chrome shadows (own-brand, high-traffic files, never named in
the audit) were untouched. Not previously flagged, so the shell-chrome portion is KNOWN DEBT rather than
regression; the `SalonCard.tsx` portion is new-since-2026-06-12 (see Part 1).

### g. Press-scale spread — `active:scale-[0.9x]`

**Total: 146 bracket-form hits across 7 distinct values, + 24 numeric-form hits across 3 distinct values
(170 combined).** Contract: 0.97 tappables / 0.98 full-width CTAs.

| Value | Count |
|---|---|
| `active:scale-[0.97]` | 93 |
| `active:scale-[0.98]` | 29 |
| `active:scale-[0.94]` | 10 |
| `active:scale-[0.985]` | 5 |
| `active:scale-[0.92]` | 5 |
| `active:scale-[0.99]` | 3 |
| `active:scale-[0.95]` | 1 |
| `active:scale-95` (numeric) | 16 |
| `active:scale-90` (numeric) | 4 |
| `active:scale-100` (numeric, i.e. no press feedback) | 4 |

CONTRADICTIONS.md §1 named this exact contradiction verbatim: "**Pressed `active:scale`** — 6 depths
(0.97×41, 0.98×13, 0.99×6, 0.94×4, 0.95×2, 0.92×2). → 0.97 tappables / 0.98 full-width CTAs." A month later
the spread has not collapsed — it grew (0.97 41→93, 0.98 13→29, and a **7th value** appeared, `0.985`,
plus the numeric-suffix forms which weren't even in the original count).

Worst off-canon files (values other than 0.97/0.98):
- `components-legacy/discovery/DetailPage.tsx:239,255,265,285,298` (5x `active:scale-95`)
- `components-legacy/refund/ReportRefundEntry.tsx:85,87` (2x `0.985` + 2x `100`, stacked on the same 2 lines)
- `components-legacy/refund/UpchargeApproveView.tsx:88,529`
- `components-legacy/discovery/TikTokPlayer.tsx:146,158,170` (3x `active:scale-95`)

**Verdict: REGRESSION.** Named, quantified, and given an explicit collapse rule in the audit; the spread
is wider now than when it was documented as a problem.

### h. Disabled-opacity spread — `opacity-30/40/50`

**Total: 96** (`opacity-50`: 77, `opacity-40`: 12, `opacity-30`: 7). Contract (CLAUDE.md design table):
`opacity-50 cursor-not-allowed`.

CONTRADICTIONS.md §1 named this too: "**Disabled opacity** — `opacity-50` (`TextInput.tsx:30`) vs
`opacity-40` (`Switch/Checkbox/Radio/PillToggle`) vs `opacity-30` (`DateTimePicker.tsx:468`,
`SalonVenuesNearby.tsx:115`). → one (`opacity-40` or `text-s-ink-disabled`)." Re-checked the 4 named
primitives directly:

- `primitives/TextInput.tsx:32` — `disabled:opacity-50` (matches the current CLAUDE.md contract)
- `primitives/Radio.tsx:39` — `opacity-40` (**still disagrees**)
- `primitives/Switch.tsx:85` — `opacity-40` (**still disagrees**)
- `primitives/Checkbox.tsx:57` — `opacity-40` (**still disagrees**)
- `primitives/PillToggle.tsx:71` — `opacity-40` (**still disagrees**)
- `primitives/DateTimePicker.tsx:394,408,469,584` — mix of `opacity-30` and `opacity-40` (**still disagrees**,
  and internally inconsistent with itself)
- `app/[locale]/_components/salon/SalonVenuesNearby.tsx:151,160` — `disabled:opacity-30` (**still disagrees**)

Every primitive named in the audit is byte-for-byte unchanged.

**Verdict: REGRESSION, unresolved at the exact cited lines.** This is a shared-primitive-level
inconsistency: five sibling form controls (`TextInput`, `Radio`, `Switch`, `Checkbox`, `PillToggle`) render
three different disabled treatments, and none of the three matches CLAUDE.md's own locked value cleanly
except `TextInput`.

### i. Type-size drift on locked slots

Card names locked at 14px; buttons must be ≥14px (contract bans ≤13 on CTAs); eyebrows at 11px.

**Name-slot violations (concrete, not the raw text-[13/15px] grep noise):** the shared `CardName` primitive
(`app/[locale]/_components/primitives/CardText.tsx:39-40`) does **not** set a font-size — it only applies
`font-body text-s-ink font-medium` and defers size entirely to the caller's `className`. Two of its three
call sites override it to **15px**, not the locked 14px:
- `app/[locale]/_components/search/SalonResultCard.tsx:280,319` — `<CardName as="h3" className="... text-[15px] ...">`.
  This is the primary search-result card, the single highest-traffic customer surface in the product.
- `components-legacy/SalonCard.tsx:263` — `text-[15px]` on the salon name `h3` (legacy dead-code card, lower
  priority — check whether this file is still routed to before prioritizing).

Raw `text-[13px]` / `text-[15px]` totals in scope (includes meta/body/CTA text, not just names):
210 / 161 respectively. Worst files: `booking/PayConfirmStep.tsx` (12+7), `booking/BookingConfirmation.tsx`
(11), `search/SalonResultCard.tsx` (11 at 13px, all `<CardMeta>` — meta is contract-locked at 12px, so these
are ALSO drift, just a different slot than "name"), `staff/StaffProfilePage.tsx` (8 at 15px).

**Eyebrow-pattern violations** (`text-[10|12|13px]` + `uppercase`, tracked): 167 hits. Sampled the worst 5 —
`FormulaBook.tsx` (18), `ConsultationNotes.tsx` (14), `WellnessJournal.tsx` (11), `RoomManager.tsx` (9),
`discovery/InlinePrefsPanel.tsx` (7) — **all 5 are operator-dashboard files**
(`components-legacy/dashboard/**`). The A21 "tracked-uppercase eyebrows are banned" rule is explicitly
scoped to **customer surfaces** (owner 2026-06-11); LOCKFILE §12 gives the operator dashboard its own
vibrant, separate skin. These are very likely NOT violations of the customer-facing rule — flagged here for
completeness but almost certainly false positives against the wrong rule scope. A true customer-surface
eyebrow census would need to exclude `dashboard/**` explicitly, which this grep didn't.

**Verdict: NOT covered by CONTRADICTIONS.md 2026-06-08** (it audited state/color/spacing/duplication, not
type scale on locked slots as its own axis) — **KNOWN DEBT**, newly documented here, not a regression. The
`CardName` finding is the highest-value item in this whole census: one 2-line primitive fix
(`CardText.tsx:40`, add `text-[14px]` to the base className) would correct the name slot on every card in
the app that uses the shared primitive, plus the 2 explicit overrides need their `text-[15px]` removed.

### j. Dead hover fragments — malformed `hover:X:Y` double-pseudo

**Total: ~20 confirmed instances** (excluding 4 false positives caught by the same regex: `hover:before:*`
and `hover:md:*`, which are legitimate Tailwind pseudo-element/responsive chains, and `hover:[stroke-dashoffset:0]`,
a legitimate arbitrary-property class).

CONTRADICTIONS.md §0 — labeled **"🔴 ACTUAL BUGS (broken, not just inconsistent) — fix first"** — named this
exact bug class with exact file:line citations: `booking/BookingCard.tsx:200,215,224`
(`hover:bg-s-ink/[0.06]:bg-white/[0.08]`), `ui/ScrollableFilterRow.tsx:105,128`
(`hover:text-s-accent:text-s-accent`), `ui/GuidedSearch.tsx:366,383,400,615,641,660,769,776,793`,
`ui/ReportContentButton.tsx:62`.

Re-verified each citation directly:
- **`BookingCard.tsx`** — **fixed.** No `hover:X:Y` pattern remains anywhere in the file.
- **`GuidedSearch.tsx`** — **file deleted entirely** (component removed from the codebase). Not in
  `_design-system/REMOVED.md` though — a graveyard-protocol gap, separate from this census's scope.
- **`ScrollableFilterRow.tsx:105,128`** — **NOT fixed.** Byte-for-byte the same
  `hover:text-s-accent:text-s-accent` fragment cited in the audit is still there, at the same two lines,
  over a month later. This is the audit's own flagship "fix first" example and it was never touched.

Fresh instances of the same bug class, not in the original citation list:
- `components-legacy/ui/LanguageSwitcher.tsx:156` — `hover:bg-s-bg-surface:bg-white/5`
- `components-legacy/ui/CategoryTree.tsx:106` — same pattern
- `components-legacy/shared/ClientSelectorDropdown.tsx:102` — `hover:bg-s-ink/5:bg-white/5`
- `components-legacy/search/SearchCriteriaChips.tsx:60` — `hover:bg-s-ink/10:bg-white/10`
- `components-legacy/salon/ServiceCategoryFilter.tsx:39,51` — `hover:border-s-ink/20:border-white/20`
- `components-legacy/nail/HandChart.tsx:115,146` — `hover:bg-s-ink/5:bg-white/5`
- `components-legacy/discovery/DiscoveryAdmin.tsx:240`, `dashboard/spa/RoomManager.tsx:322`,
  `dashboard/nail/DynamicPricingConfig.tsx:224`, `dashboard/PromoManager.tsx:210,241`,
  `dashboard/NotificationCenter.tsx:95`, `dashboard/CommandPalette.tsx:118`, `coiffeur/AiMatcherModal.tsx:145`,
  `chat/ClientTags.tsx:128`, `onboarding/steps/PaymentsStep.tsx:92` (1 each)

The pattern is consistent across every hit: it's a `dark:` variant class that was search-and-replaced
(dark-mode removal) into `hover:X:Y`, leaving the tail fragment orphaned and syntactically inert — Tailwind
silently drops the whole class, so the hover state does nothing. Same root cause the audit diagnosed, just
never actually cleaned up outside 1 of the 4 named files.

**Verdict: REGRESSION**, and the clearest one in the census: this is the single class the audit called an
"actual bug" (not a style inconsistency) and put at the top of its fix list, with 2 of 4 named files still
broken (`ScrollableFilterRow.tsx` untouched, `ReportContentButton.tsx` not re-checked here but same
pattern-family risk) and ~16 more instances elsewhere never caught.

### components-legacy/** sweep reality check (BookingCard.tsx, GuidedSearch.tsx, StaffProfilePage.tsx)

Directly answering the task's question — did the "185 files" token sweep CONTRADICTIONS.md claims actually
happen:

| File | Cited for | Current state |
|---|---|---|
| `booking/BookingCard.tsx` | §0 dead hover (:200,215,224), §2 secondary text (:181), §2 hairline (:113), §2 card-meta (:167) | **All 4 fixed** — uses `text-s-ink-2`, `border-s-border`, no dead hover classes. |
| `ui/GuidedSearch.tsx` | §0 dead hover (9 lines), §0 token-as-literal-string, §1 pill states | **File deleted.** Can't regress a file that doesn't exist. |
| `staff/StaffProfilePage.tsx` | §2 rating star `fill-s-amber` (:389,420), §1 icon-circle hover `hover:bg-s-ink/[0.06]` (:207) | **Both fixed** — no `fill-s-amber`, no raw ink-hover; uses `hover:bg-s-bg-sunken`. **But** carries 4 fresh `border-s-ink/NN` hairline hits (class b) never named in the audit. |

**Conclusion: the sweep was real but narrow.** It appears to have targeted the exact lines the audit named
(3 for 3 on the specific citations checked), not the classes as a general pattern across the codebase. Every
class census above (b, c, e, f, g, h, j) found the same violation type alive and well in dozens of OTHER
files within the same directories the audit said were swept. The "185 files" in the CONTRADICTIONS.md status
line may be accurate for whatever specific diff landed 2026-06-08, but it did not clear the classes — only
the named instances.

---

## 3 — Gate divergences (5 claims from `_plans/SELF_AUDIT_2026-07-11.md` §7)

Each verified against current `check.py` (this file was NOT edited) and current `_design-system/LOCKFILE.md`.

### D1 — `s-pop` blocked though un-retired

- **Claim:** `check.py:115` lists `s-pop` in `RETIRED_TOKENS` (blocks legitimate use); LOCKFILE §1 line 107
  un-retired it (V3-D424, 2026-06-02).
- **Current check.py:115**: `# s-pop removed 2026-07-11: LOCKFILE un-retired it (V3-D424); a live
  urgency-badge token, not drift.` — `s-pop` is **not** in the `RETIRED_TOKENS` set (checked the full
  literal, lines 108-134).
- **Current LOCKFILE.md:107**: `~~s-pop~~ — UN-RETIRED V3-D424 (2026-06-02)...`
- **Verdict: STALE.** Already fixed, same day the self-audit was written (2026-07-11) or immediately after.
  No action needed.

### D2 — transposed sunken hex

- **Claim:** `check.py:69` allowlisted `#F5F5F4` labeled "s-bg-sunken"; the correct `#F4F4F5` was absent
  from `ALLOWED_HEX`.
- **Current check.py:69**: `"#F4F4F5",  # s-bg-sunken / s-bg-active (was transposed #F5F5F4; fixed
  2026-07-11 , real value per LOCKFILE/CLAUDE.md)`. `#F5F5F4` does not appear anywhere in `ALLOWED_HEX`
  (checked the full literal).
- **Current LOCKFILE.md:44**: `s-bg.sunken` = `#F4F4F5`.
- **Verdict: STALE.** Already fixed 2026-07-11. **Cross-reference to Part 1/Part 2:** the fix is correct in
  the checker, but `SalonCard.tsx:48-51` (new-since-2026-06-12 code) still writes the wrong `#F5F5F4` value
  inline — that's the live consequence of this exact bug, now caught by the checker's own A1 rule since the
  fix landed. The gate-level fix is done; the code-level fallout is not (see Part 1).

### D3 — duration 100ms allowed, not in LOCKFILE canon

- **Claim:** `check.py:104` canon = `{80,100,150,200,250,300,500}` (comment cites V3-D450); LOCKFILE §4
  canon = `80/150/200/250/300/500` only.
- **Current check.py:104**: unchanged — `CANONICAL_DURATIONS_MS = {80, 100, 150, 200, 250, 300, 500}  #
  V3-D450: +100 (standard short transition)`.
- **Current LOCKFILE.md:575**: `80ms / 150ms / 200ms / 250ms / 300ms / 500ms` — still no 100ms.
- **Cross-check:** grepped every `_design-system/*.md` and `CLAUDE.md` for `V3-D450` — it is cited 6 times,
  all about the filter-pill blue-border-vs-fill decision (and once for a BentoBusiness gradient color). **No
  V3-D450 decision about durations exists anywhere in the docs.** The comment's citation appears to be
  mislabeled/confabulated — there's no paper trail for an owner-approved 100ms addition.
- **Verdict: CONFIRMED**, still a live divergence. Minimal fix: remove `100` from
  `CANONICAL_DURATIONS_MS` at `check.py:104` (old: `{80, 100, 150, 200, 250, 300, 500}` → new: `{80, 150,
  200, 250, 300, 500}`), since no decision record backs the addition. If an owner decision for 100ms does
  exist outside the docs searched, the alternative fix is adding `100ms` to LOCKFILE.md:575 instead —
  this needs the owner's call, not a unilateral pick (per SELF_AUDIT's own P2 flag).

### D4 — `#15803D` still allowlisted

- **Claim:** `check.py:50` allowlists `#15803D` ("availability badge text (V3-D126 deep green)"); LOCKFILE
  §1 line 70 says deep green REVERTED 2026-06-10, all success green = `#16A34A`.
- **Current check.py:50**: unchanged — `"#15803D",  # availability badge text (V3-D126 deep green)`.
- **Current LOCKFILE.md** (universal-color table, success row): `Success FOCAL (confirm / paid / done-step)
  | s-success.DEFAULT | #16A34A | ... Deep #15803D REVERTED 2026-06-10 (owner: normal green, not deep) ,
  focal + inline now share #16A34A.`
- **Verdict: CONFIRMED**, still a live divergence — the allowlist keeps a dead hex alive nine months(sic,
  weeks) after the owner explicitly reverted it. Minimal fix: delete line 50 from `ALLOWED_HEX` entirely
  (old: `"#15803D",  # availability badge text (V3-D126 deep green)` → removed). Should be paired with a
  grep for any remaining `#15803D` literal in app code before deletion, so the gate starts flagging any
  live usage instead of silently permitting it.

### D5 — `#9A3412` allowlisted, unregistered

- **Claim:** `check.py:49` allowlists `#9A3412` ("urgent badge text V3-D173"); no such token exists in
  LOCKFILE §1.
- **Current check.py:49**: unchanged — `"#9A3412",  # urgent badge text (V3-D173 burnt-sienna)`.
- **Current LOCKFILE.md §1** (lines 30-118, the color-token section): searched exhaustively — the only
  urgency-family tokens registered are `s-urgency.DEFAULT/.bg/.border` = `#C2410C` / `#FFF1E6` /
  `rgba(194,65,12,0.22)` (line 76), and `s-warning.text` = `#B45309` (line 72, "de-muddied from #906309
  V3-D424"). `#9A3412` does not appear in §1.
- **One nuance the original claim missed:** `#9A3412` DOES appear once elsewhere in LOCKFILE.md, at line
  1166 (§11, an illustrative aside: *"LOCKFILE has `s-urgency #9A3412` as urgency amber"*) — but that's
  itself a stale/inconsistent reference (§11 predates or wasn't updated alongside §1's `#C2410C`
  registration) and is not inside the canonical token table. It doesn't rescue the claim.
- **Verdict: CONFIRMED**, still a live divergence, and there's a second latent bug riding along with it:
  LOCKFILE.md itself is internally inconsistent about what `#9A3412` even means (§11 vs §1 disagree).
  Minimal fix: delete line 49 from `ALLOWED_HEX` (same pattern as D4), and separately flag the §11:1166
  stale reference for whoever next touches LOCKFILE.md's Imagery Pattern Registry section (out of scope to
  fix here — LOCKFILE edits need the owner by name).

### Divergence summary

| # | Verdict | Action |
|---|---|---|
| D1 (s-pop) | STALE | none, already fixed |
| D2 (transposed hex) | STALE | none, already fixed; but see SalonCard.tsx fallout in Part 1/2 |
| D3 (100ms) | CONFIRMED | owner call needed: drop from check.py OR add to LOCKFILE §4 |
| D4 (#15803D) | CONFIRMED | 1-line delete from check.py:50 |
| D5 (#9A3412) | CONFIRMED | 1-line delete from check.py:49; LOCKFILE §11:1166 stale ref flagged separately |

---

## 4 — Priority ranking (user-visible impact × count)

Ranked by (a) whether the surface is customer-facing and high-traffic, (b) whether the fix is a
single-point primitive fix (high leverage) vs many scattered call sites, (c) count.

1. **`primitives/TextInput.tsx` / `Select.tsx` / `Textarea.tsx` radius (class e).** Every form field in the
   product (booking, onboarding, checkout, search, dashboard) renders at `rounded-[12px]` against a locked
   16px contract. Single-point primitive fix, 3 files, ~3 lines, fixes every instance app-wide. Named and
   never touched since the audit.
2. **`CardName` primitive name-slot size (class i).** `SalonResultCard.tsx` is the primary search-result
   card — the single highest-traffic surface in the product renders salon names at 15px against a locked
   14px. One-line primitive default fix (`CardText.tsx:40`) plus 2 explicit-override removals.
3. **Disabled-opacity spread across form primitives (class h).** `Radio`/`Switch`/`Checkbox`/`PillToggle`
   vs `TextInput` vs `DateTimePicker` render three different disabled treatments. 5 shared primitives, ~7
   lines total, high leverage, named and never touched.
4. **Dead hover fragments (class j).** The audit's own "actual bug, fix first" item, confirmed still live
   at the exact cited `ScrollableFilterRow.tsx` lines plus ~16 more instances. Silent hover-state failures
   are invisible until a user notices a control feels unresponsive — worth a mechanical regex-based sweep
   (`hover:X:Y` → `hover:X`) across all ~20 hits in one pass.
5. **`SalonCard.tsx` wrong hex (`#F5F5F4` vs `#F4F4F5`, Part 1/3 cross-reference).** 4 lines, one file,
   customer-facing (category icon backgrounds on every salon card), now caught live by the checker's own
   A1 rule since the D2 gate fix landed 2026-07-11 — this is the one item in the census that's both
   high-visibility AND already flagged by tooling, so it's the cheapest fix to verify (checker will confirm
   green after the 4-line edit).
6. **Press-scale spread (class g).** Cosmetic/feel-only (button press feedback), not a correctness bug, but
   170 instances across 7+8 distinct values is a lot of inconsistent micro-motion. Lower visual stakes than
   1-4, but the largest raw count and an explicit audit citation.
7. **Sunken-surface (class c) and hairline (class b) legacy drift.** 93 + 69 hits respectively, spread
   across 48+ dashboard/legacy files. High count, but concentrated in operator-dashboard and long-tail
   legacy screens (lower traffic than customer PDP/search/booking). Worth a scripted sweep (the pattern is
   mechanical: `bg-s-ink/[0.0N]` → `bg-s-bg-sunken`, `border-s-ink/N` → `border-s-border`) rather than
   hand-fixing.
8. **Shadow drift (class f) shell-chrome portion.** `MobileMenu.tsx`, `Header.tsx`, `SearchTemplate.tsx` —
   high-traffic (every page), but shadows are a subtler visual defect than radius/type-size; users are
   unlikely to consciously notice a shadow using an arbitrary value vs a token unless the two read visually
   different (need a side-by-side check before assuming these need fixing rather than being deliberate).
9. **Radius arbitrary-value cleanup, operator-dashboard files (class e, remainder).** `WellnessJournal.tsx`,
   `RoomManager.tsx`, `FadeBlueprint.tsx`, `DiscoveryAdmin.tsx` — largest raw counts (12-14 each) but lowest
   traffic (operator-only, and LOCKFILE §12 gives the dashboard a separate vibrant skin with looser rules
   to begin with — some of this may be intentional dashboard styling, not drift; needs a dashboard-scoped
   review before treating as equivalent to customer-surface radius drift).
10. **Gate-file fixes (D3/D4/D5).** Cheap (1-3 lines each, in `check.py` only) but low user-visible impact
    on their own — they affect what the *checker* flags, not what renders. Worth doing regardless since
    they're nearly free, but they don't move any of items 1-9 forward by themselves.
11. **C2 hardcoded solen.ch URLs on new pages (Part 1).** 6 pages × 2 lines, mechanical env-var swap, zero
    visual impact, only matters for staging/preview canonical-tag correctness.

**Not prioritized (informational only, no fix needed):** class a (already swept), class d (already swept),
`MapView.tsx` star polygon (technical necessity), `rounded-[22px]` result-card-photo hits (already correct,
just missing a named token), operator-dashboard eyebrow hits within class i (likely wrong-rule-scope false
positives, need dashboard-scoped exclusion before re-running).
