# Design Language v2 — Reconciliation Record (2026-06-09)

**What this is.** The audit trail for the v2 design-language pivot. The owner approved v2 from the mockup
`public/_mockups/design-language-v2.html` + verbatim criticism, then asked to **fix every contradiction in the design
rules + memory BEFORE implementing**, so the drift-checker and future sessions don't revert v2 back to the old "blue-ban."
This file records the 7 rules, every doc/memory edit made, the decisions taken, and what's deferred to implementation.

**Precedence reminder:** `CANON.md` + actual code > `LOCKFILE.md` > `SOURCE.md` (prose). The v2 spec is installed at
`CANON.md §0` (read-first); everything else was reconciled to match.

---

## The 7 v2 rules (canonical)

1. **BLUE = INTERACTIVITY.** `s-accent #276EF1` is used GENEROUSLY on anything tappable: text links, see-all/view-all,
   active tab/segmented states, secondary & ghost buttons, tappable row affordances, inline action labels
   (Buchen / Wegbeschreibung / Verwalten), interactive icon tints (icon IS the tap target), plus the system states it
   always had (focus rings, Spinner, input focus). **No pixel budget.** REVERSES the old "blue only on focus/spinner/form."
2. **BLUE STAYS OFF NON-INTERACTIVE TEXT** (guardrail vs "vibrating blue text"). Body, labels, prices, headings, eyebrows,
   decoration stay ink/grey. Blue marks INTERACTION, never EMPHASIS. Eyebrows = `text-s-ink-3`, no dot.
3. **ONE INK COMMIT BUTTON PER SCREEN** (unchanged). Primary commit CTA = `s-ink #0A0A0A` fill / white text. Never two
   ink primaries, never a blue-FILLED primary. Every other action leans blue (blue-ghost OR plain blue link). Scoped
   exception V3-D426: outcome/status-screen CTA inherits the screen's semantic colour.
4. **WHITE-FIRST SURFACES; WARM CREAM DROPPED.** Default = white `#FFFFFF`; subtle fill = COOL grey `#F4F4F5`
   (`s-bg-sunken`), NOT warm cream. Reverses the V3-D460 warming (sunken #F8F5F2, border #E8E4DF → cool #F4F4F5 / #E4E4E7).
5. **NO DARK SURFACES ANYWHERE.** The dark walk-in/queue panel and any dark surface are dropped. Every customer surface
   is light. (Sole survivor: the queue-display kiosk/TV page, a deliberate full-screen kiosk pattern.)
6. **SUCCESS = SOLID GREEN + WHITE ICON.** ⚠️ **SUPERSEDED 2026-06-10 (V3-D470): the deep `#15803D` was REVERTED to normal `s-success #16A34A`** (owner: normal green, not deep). The rest of this rule stands — the FOCAL moment is a solid-green disc + WHITE check, confident not pale, just at #16A34A. (Historical record kept below as written 2026-06-09.) The success/confirmation FOCAL moment = ~~deep `s-success.deep #15803D`~~ `s-success #16A34A`
   disc + WHITE check, confident not pale. Overrides "refined pastel" FOR THE FOCAL MOMENT ONLY. Inline status chips /
   badges / low-emphasis toasts MAY keep the pastel pattern — that is the explicit boundary. Other semantics UNCHANGED:
   star `#FFC32B`, error `#D32F2F` (`s-error`; closed-status red = `#DC2626` / `s-closed`), warning `#F1AE27`, save `#FF3366`.
7. **MOTION EVERYWHERE.** Staggered rise-in on load (opacity 0→1 + ~10px rise, ~0.55s, staggered), success ring-pulse +
   disc spring-pop + check stroke-draw (SuccessMark), card hover-lift, blue-link hover-underline, button press-scale(.97).
   Prior "motion restraint / motion-is-DONE" loosened. Restraint now applies to STATIC depth (shadow weight) only.
   Always respect `prefers-reduced-motion`.

**Icon-tint boundary (deterministic).** An icon is blue ONLY when the icon itself is the tap target (icon-only button /
standalone tappable glyph). A decorative icon inside a tappable row/card stays ink — the ROW is the tap target.

---

## Decisions taken (the 8 open questions)

| # | Question | Decision | Rationale |
|---|---|---|---|
| 1 | Cool sunken target value | **#F4F4F5** | The approved-mockup value; resolves the "front-run" ambiguity by committing the docs to it. |
| 2 | Deep-green success token | **ADD `s-success.deep #15803D`** (additive) | Focal disc goes deep; inline chips keep #16A34A + pale #E8F5E9. No mass darkening. |
| 3 | Cool border value | **#E4E4E7** | Pairs with cool #F4F4F5; reverses warm #E8E4DF. |
| 4 | Warm shadow tint | **KEEP** (untouched) | CANON §7 explicit owner decision; sub-perceptual at 0.03–0.12 alpha; out of v2 scope. |
| 5 | CLAUDE.md link-lock ("link = ink") | **Flipped to blue** | Owner's verbatim "use blue a lot for links/clickable stuff" IS the by-name unlock the LOCKED table requires. |
| 6 | Drift-checker A9/A14 re-scope | **DONE this pass** | A9 whitelist + guidance rescoped to v2 (blue on interactive whitelisted; flags blue-on-non-interactive-text only). A14 needs NO change , the blue-ghost recipe has no shadow, so it never triggers A14's white+shadow condition. |
| 7 | Icon-tint boundary | **Tap-target test** | Deterministic; matches the mockup; checkable by A9. |
| 8 | SuccessMark doc | **Authored** `components/SuccessMark.md` + registry updated | Required by the "new component → doc + registry" rule; the clean home for the chip-vs-focal + motion spec. |

**Error-hex correction (critic catch):** the v2 success rule originally said error `#DC2626`, but the locked `s-error` is
`#D32F2F` (`#DC2626` is `s-closed`). All v2 statements + the `project_palette_b_w_pivot` memory now use `#D32F2F` for error.

---

## Docs reconciled (this pass)

- **CANON.md** — §2 accent rule flipped (keystone) + §0 "Design Language v2" block inserted; §1 tokens (sunken #F4F4F5,
  border #E4E4E7, added `s-success.deep #15803D`); §6 staff badge `(breaks §2)` citation removed.
- **LOCKFILE.md** — §0 hard-rule 2, §1 accent heading + `s-accent.DEFAULT` note (hex → #276EF1), §1 success rows,
  §1.5 rationale + §1.5.0 color model (4 spots) + ALLOWED/FORBIDDEN tables, §2.5 tab-label + migration-link row,
  §3.5 surface hue, §4 Book-CTA motion, §5 toast/focal boundary.
- **SOURCE.md** — §1 layer-law row + BOTH decision trees (§1 line-91 + §14.0) + budget cell + CANON callout + info row,
  §2.1 accent (intro/DEFAULT/where-to-use) + reserved-blue (two spots) + sunken/border, §2.5 toast-success boundary,
  §3 underline-ban exception, §6.4 link, §20 locked-decisions (emerald + 80/17/3 + reserved rows), §21.5 Fresha-drop.
- **CONTROL_ELEVATION.md** — rule 5 "No blue" → "blue = interactivity" + new **(E) blue-ghost** decision step + compressed line.
- **SENIOR_SCORECARD.md** — Color dim rewritten to fail BOTH dead-grey AND vibrating-blue; "Checked by" A9 note.
- **MOTION.md** — Council-color-model + scorecard-record bullets marked superseded; "Motion is DONE" re-opened to v2 rule 7.
- **CLAUDE.md (MAIN)** — taste items 3/4/6, the 🔒 LOCKED `link` row, the three-layer header + refined-pastel start-here bullet.
- **_tasks/SOLEN_DESIGN.md** — supersede banner + 80/17/3 accent line + sunken/border + s-success (added .deep) + s-star (→yellow).
- **_rules/SOLEN_PATTERNS.md** — HISTORICAL banner over the Earthen-Wellness substrate section.
- **_rules/SOLEN_UI.md** — top-of-file palette-superseded banner + §5b 60/30/10 "cap is non-interactive only" note.

## Memory reconciled

- **feedback_90_10_color_rule.md** — frontmatter (description + current_accent), 80% surfaces line, the 3%-accent body
  bullet block, "count it" line, CAN/SHOULD-NOT reframe, star→yellow + success-focal.
- **project_palette_b_w_pivot.md** — description, "small-footprint" line → interactivity, semantic-exceptions (heart→#FF3366,
  error stays #D32F2F), "#1638C4" → #276EF1.
- **feedback_layer3_semantic_colors.md** — description, price=blue → price=ink, success-focal, "3% budget" → "not budgeted".
- **feedback_no_muted_focal_colors.md** — added success-FOCAL deep-green bullet.
- **feedback_no_decorative_artifacts.md** — clarified it's STATIC decoration only; v2 rule 7 wants more motion.
- **MEMORY.md** — index lines updated for all 5 of the above.

---

## Deferred to v2 implementation (NOT done in this rules pass)

These are CODE changes; the docs above state them as the target and acknowledge "pending" so docs stay self-consistent.

1. **Token value sync (step 1 of build).** `tailwind.config.js` + `app/globals.css`: `s-bg.sunken` #F8F5F2 → **#F4F4F5**,
   `s-border` #E8E4DF → **#E4E4E7** (+ the `--color-border` CSS var #E0DDDB), and **ADD `s-success.deep #15803D`**
   (value already exists in code as `s-brand.mid`). Then point `SuccessMark` disc at `bg-s-success-deep`.
2. ~~Drift-checker A9/A14 re-scope~~ **DONE this pass** (not deferred): A9's `ACCENT_ALLOWED_HINTS` now whitelists
   interactivity markers (href / <a / <Link / onClick / role="tab / aria-selected / cursor-pointer / hover:underline /
   active: / Buchen/Wegbeschreibung/Verwalten) and its guidance flags blue on non-interactive text + a blue-filled primary
   only. A14 needed NO change , the blue-ghost recipe has no shadow, so it never trips A14's white+shadow rule.
3. **Build the v2 surfaces** — the 4 approved redesigns (reset-password, account-messages, city-landing, empty-states) +
   roll v2 across the app (blue on interactive affordances, white-first, deep success, motion).
4. **Delete `public/_mockups/`** once the real builds land.

When each lands, update this file + flip the relevant "pending" note.
