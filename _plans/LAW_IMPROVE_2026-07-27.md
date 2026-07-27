# DESIGN-LAW IMPROVEMENT PASS , 2026-07-27

Weekly run (owner-mandated 2026-07-21: "keep improving taste and design file as we go even outside this
session"). Corpus: CLAUDE.md pinned design blocks, LOCKFILE, SOURCE, TASTE_LOG, RATIONALE,
REJECTED_TREATMENTS.json, public/_mockups/_BASE.md, research/PRINCIPLES_50.md, MOTION.md,
COMPONENT_REGISTRY.md.

Window: 2026-07-19 to 2026-07-27 (281 commits).
Counts: **harvested 10 · contradictions 5 open · duplications 3 · safe fixes 12 · owner decisions 5.**

The headline: the law did not drift because anyone wrote a wrong rule this week. It drifted because
**decisions got recorded in the wrong TIER** (an owner override living only in TASTE_LOG, which outranks
nothing) and because **four files the law cites by name were never on main at all** , they were committed
on a worktree branch that never merged, so three live mockups have been rendering broken images and the
FLOORS LAW has been citing evidence that was not there.

---

## 0. HARVEST , the week's dated owner decisions, and whether the law knew

| # | Decision | Owner, verbatim | Was it in the law? | Record |
|---|---|---|---|---|
| H1 | The book label follows the JOB, not the surface. `Jetzt buchen` retired into `Termin buchen`; list row `Buchen`, picker `Auswählen`, walk-in queue `Anstehen`. | "we have so many variations of it, like book... we need consistencies and we don't have that." | **NO , and worse: LOCKFILE §6 still told new work to PREFER the retired label.** Fixed, S1. | 62f14b274, 07-25 |
| H2 | Review dates are day-month-year, no weekday, no time. | "I don't like how the dates, it's so detailed, how many hours and what weekday it is... we need just, like, the sixth June twenty twenty six" | **NO , no law file mentions a date format at all.** Recorded, S2. | a7f0c92e1, 07-25 |
| H3 | Photo-grid overflow is a small bottom-right frost badge on the ninth tile, not a full-tile black scrim. | "when there's more than nine, that it says plus how many are left on the last picture, on the right down" | Half , COMPONENT_REGISTRY says "+N overlay on last tile", which does not distinguish badge from scrim. Recorded, S2. | a7f0c92e1, 07-25 |
| H4 | THE SPEED LAW: three tiers chosen by the JOB (press 80-100ms · snap 150ms · reveal 250-300ms; >300ms is full-screen only). | "ok approved" | Yes, MOTION.md. Absent from TASTE_LOG. Recorded, S2. | 2ae07fc45, 07-25 |
| H5 | The enter recipe retimes 420ms -> 280ms, blur kept. | picked 280ms with the blur intact, off demo 7's three live columns | Yes, MOTION.md. Absent from TASTE_LOG. Recorded, S2. | dbaf2aa65 + ca3c569d0, 07-26 |
| H6 | Map basemap reads LIGHT: labels and POI ON, light-grey buildings, white land. Reverses both earlier rounds of the same day. | reference image IMG_6693 | Yes, LOCKFILE §13, supersession named. Absent from TASTE_LOG. Recorded, S2. | 5fa0ae51e, 07-24 |
| H7 | Speed is decided by a visual the owner FEELS, never by a question. | "I'm not really sure about the speed because I'm not used to that... So don't ask me about that one. SHOW ME A VISUAL so I can visualize." | **NO , lived only in a plan file.** Recorded, S2. | MOTION_LAW.md N8, 07-25 |
| H8 | SwiftUI is an IDEA SOURCE, not a target. | "we're not gonna use SwiftUI itself, but we're gonna have ideas, and we can copy a few stuff" | **NO , lived only in a plan file.** Recorded, S2. | MOTION_LAW.md N8, 07-25 |
| H9 | Do not touch the homepage imagery; make mockups instead. | "abt the imagery part dont touch anth if u got idea make mockups" | Honoured in the work (0563a251b mocks, 64ff63334 reverts the live change). No law change needed. | 07-25 |
| H10 | Turn the flatness finding into researched principles AND gates, then apply. | "we need this research evrth like our alrdy existing principles evrth and researchs and yk make then principle and gates evrth" -> "ok now go apply evrth" | Yes: EMPHASIS BUDGET, TASTE_RANGE.md, `npm run gate:floors`. Apply phase A1-A3 still open. | 753e32794, 07-25 |

**Not previously in any law file: 4 (H2, H7, H8, half of H3). Actively contradicted by the law: 1 (H1).**

---

## (a) SAFE FIXES APPLIED , 12, each its own commit

Every one of these applies a supersession that **already existed in writing**, restores a file that
**already existed in git**, or records a dated decision the owner **already made**. No locked value was
changed, no ceiling or floor loosened, nothing deleted.

| # | Commit | What was wrong | What landed |
|---|---|---|---|
| S1 | `a39a6fae1` | LOCKFILE §6 pinned `"Jetzt buchen"` to the PDP/sidebar and said "prefer Jetzt buchen on new work" , a label the owner retired and graveyarded on 07-25. A builder reading the LOCKFILE would reintroduce it. | The four job-based labels written in; old rows struck through, not deleted. |
| S2 | `62c0b3388` | TASTE_LOG stopped at 2026-07-24/25 while six dated owner decisions had shipped. | All six recorded, each POINTING at its owning file rather than restating numbers, plus the two process decisions (H7, H8) that had no home at all. |
| S3 | `a36dd5bbb` | LOCKFILE §17.1 measured the imagery floor at **375x812** while its own EMPHASIS BUDGET block 32 lines below said **390x844**, and `check-geometry.mjs` pins the FLOORS pass to 390x844. A percentage-of-viewport floor with two viewports. | §17.1 corrected to 390x844, correction dated, floor value untouched. |
| S4 | `538f35bc1` | CLAUDE.md floor 2 said "≤4 distinct font sizes" and silently dropped the **≤2 weights** half that LOCKFILE §12 and the type-budget gate both enforce. The dropped half was the one in context during builds. | Weight ceiling restored to the summary, with the date it was missing. |
| S5 | `475b405e1` | `research/PRINCIPLES_50.md`, the owner-ordered 50-principle canon, was stranded on unmerged branch `claude/taste-rationale-frameworks-37390c`. The served mockup on main names it in its own header. | Restored verbatim. Checked first: no superseded numbers in it. |
| S6 | `6fc6ce7cd` | The FLOORS LAW reinstated `#9CA3AF` (`s-chart-2`) as the tertiary TEXT grey, but LOCKFILE's colour table , where anyone looks a token up , still called it a chart row only. Combined with `s-ink-3` being collapsed, the reinstated grey looked like an invented token. | Text role documented in the token row, restriction ("non-load-bearing only") carried verbatim. |
| S7 | `75350752c` | CLAUDE.md cites `UNFINISHED_AUDIT_2026-07-21.md` and `TASTE_EMPTY_STATES.md` by name as the evidence for the FLOORS LAW and the empty-state anatomy. **Neither was on main.** Same stranded branch. | Both restored. The audit gets a dated header flagging the one number in it since superseded (375x812). |
| S8 | `6639be66b` | `_BASE.md` is LAW for every mockup and says to use `/_mockups/_assets/salon-photos/pNN.jpg`. The folder held only a README claiming the photos existed. **floors-law, pinterest-ref-copy and pinterest-ref-solen have been rendering broken images.** | 944K of photos restored from `deeaf2829`. |
| S9 | `8a81a5f58` | LOCKFILE rule A13 says a card has "exactly ONE ink anchor", §17.4 of the same file says TWO. 1150 lines apart, flatly opposed, and A13 is the detailed table-driven one a drift rule follows. CLAUDE.md already said "amends A13"; LOCKFILE never did. | Amendment recorded on A13, naming what survives (filler recedes) and what does not (the price must no longer). |
| S10 | `3e1ba09b7` | The owner's 2026-07-19 black booking-pill override lived ONLY in TASTE_LOG, which outranks nothing. LOCKFILE and the CLAUDE.md contract row both still said "NEVER black/ink" with three exceptions, so a reviewer would revert the owner's own shipped pill as drift. | Fourth exception named in both, scoped to those custom pills, explicitly not reopening ink-fill elsewhere. |
| S11 | `6f0d39206` | RATIONALE states the type ceiling twice with different numbers: "~3 type sizes" (line ~75) and "four or fewer" (line ~351). The ~3 line routes to `solen-taste-diagnosis`, the skill that runs when the owner says a screen looks bad , so it would report a false violation on a compliant screen. | The ~3 marked as this research's preference; the pass/fail number named as ≤4 sizes / ≤2 weights. |
| S12 | `1e6752d40` | COMPONENT_REGISTRY told anyone populating the CategoryBrowseRails to "see `scripts/seed-coiffeur-rails.ts`". Deleted 2026-07-11 in `89ee34e64`, and that sweep skipped REMOVED.md, so the pointer died silently while the component stayed live. | Pointer corrected, deleting commit named. |

---

## (b) OWNER DECISIONS NEEDED , 5

Contradictions with **no written supersession**. I did not touch any of these: each pins a locked value
and needs your call, not mine.

**D1. A card's press-scale: `.985` or `.97`?**
LOCKFILE §3.5, the table headed "State matrix (ENFORCED)", says a Card pressed is `scale(.985)`.
SOURCE.md §6.4, headed "THE LOCKED RULES... non-negotiable", says `active:scale-[0.97]` for a photo card
and `0.98` for a list row. Both are dated **the same day**, 2026-06-09, with no cross-reference.
Measured on the live estate right now: **222 elements use `0.97`, 6 use `0.985`**, and MOTION.md's
2026-07-26 press measurement says `0.985` moves an edge **2.69px, the most of any rung, "which does look
like drift"**. MOTION.md itself already says this "needs an owner call". The catch is that LOCKFILE is
the highest-precedence doc, so as written the law blesses the value its own measurement calls drift.
*The question:* normalise the 6 stragglers to `0.98` and correct the LOCKFILE table, or keep `.985` as a
sanctioned rung for full-width CTAs?

**D2. Meta text on a card: 12px or 13/14px?**
CLAUDE.md contract row: "name **14** · meta **12**". SOURCE.md §336 agrees at 12. LOCKFILE §236 says
"Body small (meta rows, secondary) | 13px | 14px". LOCKFILE outranks both and stands alone. Meta text is
on every card on every browse surface, so this is a visible difference at scale.
*The question:* is card meta 12, or is LOCKFILE's 13/14 the real one and the other two stale?

**D3. Is blue allowed on small BUTTONS, or only on hyperlink-reading text?**
CLAUDE.md (dated 2026-06-10): blue goes on "text links, **small buttons / chips**, small tappable
metadata". LOCKFILE §1 (dated 2026-06-11, one day later): "BLUE = THE HYPERLINK COLOR... Lands ONLY on
text that reads as an `<a href>` inside prose... secondary buttons = INK." LOCKFILE both outranks and
postdates, but it names "v2 generous" as what it supersedes, never CLAUDE.md's phrase, and CLAUDE.md's
line carries its own "LOCKED 2026-06-10, RESTRAINT" stamp. Both agree filters and secondary buttons are
not blue, so the only daylight is "small buttons".
*The question:* delete "small buttons" from CLAUDE.md's blue list, or keep it as a real carve-out?

**D4. `rounded-input` still resolves to 16px in code, while every law file says 12.**
This one is unanimous in the LAW , CLAUDE.md, LOCKFILE, SOURCE and TASTE_LOG all say 12, and the
contract row even says "this row had drifted". The drift is in the TOKENS: `tailwind.config.js` has
`input: "16px"` and `globals.css` has `--radius-input: 16px`. Production renders correctly only because
a hardcoded `border-radius: 12px` in `@layer base` wins on specificity for real `<input>` elements. **36
places use `rounded-input`** and get 16. Not a law contradiction, so out of scope for this pass, but it
is a live trap: the next component that uses the token ships the wrong radius.
*The question:* want me to flip both tokens to 12 and re-verify the 36 usages? It is a code change, so
it goes through the loop, not this pass.

**D5. Branch `claude/taste-rationale-frameworks-37390c` is holding real work hostage.**
Three of this pass's twelve fixes (S5, S7, S8) were restores from that one unmerged branch, and I only
found them because two law files and one gate cited the missing files by name. I restored exactly what
was cited and nothing else, so whatever else is on that branch is still stranded.
*The question:* want a targeted merge/audit pass on it, or should it be abandoned deliberately?

---

## (c) PROPOSED UPGRADES , 5, in the THE 50 format. PROPOSED, added to no law file.

Each is sourced from this week's actual work, not from general design advice.

**51. The band, not the number** , a ladder of values is legitimate only when the rungs encode one
constant perceived effect; otherwise they are three numbers someone picked.
*Solen:* the press ladder (0.94 icon / 0.97 CTA / 0.98 row) measures as a ~1.1-1.6px constant edge
movement, because edge travel is `size × (1 − scale) / 2` and each rung sits on a different-sized
control. So a new control's scale is DERIVED from its width, not chosen, and "just use 0.97 everywhere"
is provably wrong: 0.66px on a 44px icon is below noticing, 5.9px on a full-width row reads as squashing.
Source: 788a5f883, measured across 162 live elements. **This is also what makes D1 answerable.**

**52. A label follows the JOB, not the surface** , name a control by the action it performs, never by
where it sits, or one job grows five names.
*Solen:* page-level commit = `Termin buchen`, list row = `Buchen` (the heading already supplies the
noun), picker row = `Auswählen`, walk-in queue = `Anstehen` (joining a queue is genuinely a different
action). Source: owner 2026-07-25, 62f14b274.

**53. Speed is felt, never described** , never ask anyone to pick a duration from a number; build the
side-by-side and let them pick the one that feels right.
*Solen:* 420 vs 280 was decided off three live columns, after the owner said "don't ask me about that
one. SHOW ME A VISUAL so I can visualize". Generalises past speed: for any axis the owner cannot name in
the abstract (weight, easing, blur, radius), building the comparison IS the question.
Source: dbaf2aa65 + MOTION_LAW.md N8.

**54. A comparison must survive its own outcome** , when a demo's variants import the constant the demo
exists to decide, applying the decision silently collapses the comparison and destroys the record of
what was compared.
*Solen:* demo 7's column A imported `ENTER_DURATION`, so shipping 280ms would have made A and B
identical. Column A is now pinned to a literal `0.42` marked superseded. Rule: **every losing variant in
a decision surface is pinned to a literal and labelled with its outcome.** Source: dbaf2aa65.

**55. A percentage floor names its viewport** , a rule stated as "X% of the screen" is meaningless
without the exact box it is measured in, because a taller viewport changes the answer.
*Solen:* the imagery floor is ~1/3 measured at **390x844**, and it sat at 375x812 in LOCKFILE §17.1
while its own sibling section, added the same day, said 390x844. Generalises: every floor expressed as a
ratio, share or percentage carries its measurement viewport in the same sentence as the number.
Source: this pass, S3.

---

## Method note

Three read-only audit agents ran the contradiction, duplication and staleness sweeps in parallel over a
~450KB corpus; every finding they returned was re-verified against the file and against live code before
anything was committed. Two of their findings did not survive that check and are not in this report. The
`0.985` usage counts, the `rounded-input` usage count and every restored file were measured, not
recalled.
