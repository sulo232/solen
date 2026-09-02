# Buchungen group, and the row anatomy every group below reuses

**Reference:** no screenshot. Measured live: `_measured/profile-hub.json`. This band has **no band record of its own**: `GroupLabel` is a `<p>` and `RowCard` is a plain `<div>`, so neither is a landmark tag nor a heading-leading element, and the section extractor did not open a band for it. Its text roles are carried inside the `main` band (index 1).
**Component:** `app/[locale]/_components/profile/AccountHub.tsx:161-165`, row anatomy at `Row()` lines 249-286, group label at `GroupLabel()` lines 234-236, group container at `RowCard()` lines 238-244
**Layer:** 1 chrome, hand-composed rows. No registered component is involved; `Row` is local to this file.

## Layout

```
  Buchungen                                     12/600 s-ink-2, mt-26 mb-2 px-1
  ---------------------------------------------
  [icon 22]  Buchungen                          15.5/500 Inter Tight
             am Fr, 5. September um 14:00       13/400 s-ink-2, truncate
                                          [>]   chevron 18
  ---------------------------------------------
   px-4, py-15, gap-14
```

One row. Destination `/{locale}/profile/bookings`. Icon `Calendar` from Lucide at 22px,
`strokeWidth 2.2`, bare on white with no tile behind it.

## The shared row anatomy (files 04, 05 and 06 reference this block)
- Row: `flex items-center gap-[14px] px-4 py-[15px]`, whole row is one `<Link>`, `active:scale-[0.99]`
- Icon slot: `h-[22px] w-[22px]`, glyph `size={22} strokeWidth={2.2}`, colour `text-s-ink`, no tile, no chromatic glyph
- Label: `font-heading text-[15.5px] font-medium tracking-[-0.01em] text-s-ink`
- Subline: `mt-0.5 text-[13px] text-s-ink-2`, truncates, rendered only when the row has live data to say
- Trailing: optional `end` node, then `ChevronRight size={18} strokeWidth={1.9} text-s-ink`
- Group container: `bg-white` only. No border, no radius, no divider. LOCKFILE.md:561-584 ("THE CONTAINER TEST", owner 2026-07-28) names an account hub as a surface that takes no container, and forbids a box and a per-row hairline together (CORRECTED 2026-08-27: this file previously cited 543-560, which is the section 3 radius table, not the container test) (owner 2026-08-03, "why the fuck is this still boxing?")
- Group label: `mb-2 mt-[26px] px-1 text-[12px] font-semibold text-s-ink-2`, sentence case

## Measured (390x844, signed in)
Per-row boxes are **not measured**: the JSON records no band for the groups, so there is no row
height, no icon rect and no chevron rect on disk. What is measured, from the `main` band's roles:
- Row label role: **15.5px / weight 500 / Inter Tight / `rgb(10, 10, 10)`**, line-height 23.25, letter-spacing -0.155px, **count 7**, sample `"Buchungen"`. Seven is every row on the screen, this one included.
- Subline role: **13px / weight 400 / Inter / `rgb(107, 107, 107)`**, line-height 19.5, **count 5**, sample `"Ihre Buchungen ansehen"`. The sample string is the empty-state subline, so the measured account had no upcoming booking at capture time.
- Group label role: **12px / weight 600 / Inter / `rgb(107, 107, 107)`**, line-height 18, count 4 across the screen (the "Konto" eyebrow plus this group label and the two below).

## Tokens
- `s-ink` `#0A0A0A` label and glyph, `s-ink-2` `#6B6B6B` subline and group label
- No accent, no semantic colour, no fill anywhere in the group

## Interaction
- Whole row navigates. `active:scale-[0.99]` press feedback, 150ms.
- The subline is data, not a control.

## Intentional deviations
- Row label weight is 500, not the approved mockup's 600. Built at 600 the screen measures about 65% of visible text at weight >= 600 (AccountHub.tsx header comment, deviation 3). 500 is the emphasis weight the target ladder uses.
- The icon tile from the mockup was deleted 2026-08-03: a 38x38 `bg-s-bg-sunken` square behind every glyph is the dead-grey zone FLOORS LAW 4 forbids, and the captured Airbnb reference carries a bare glyph.

## Empty state
The row itself never disappears. Its subline swaps: `nextAppointmentOn` when a confirmed or
pending future booking exists, `bookingsRowEmptySub` otherwise (AccountHub.tsx:110-114). The
measured capture shows the empty variant.

## Against the floors
- **15.5px is off the locked type scale.** `ALLOWED_PX` in `scripts/lib/type-scale-allowed.mjs` holds whole-number values only, and `isAllowedPx` requires an exact integer before it even checks membership, so a fractional size can never be allowed. Measured **count 7** at 15.5px in this role, sample string `"Buchungen"`, plus **1** more at 15.5px in the sign-out band (07, a different role: Inter, not Inter Tight, and `rgb(220, 38, 38)`), for **8 elements at a half-pixel size on one screen**. Re-running `node scripts/detect-type-scale-outliers.mjs` reports `text-[15.5px] (4 uses across 3 files)` including `AccountHub.tsx:224` and `AccountHub.tsx:279`; the committed `_design-system/_type-scale-report.md` names only 2 uses across 2 files and does not list `AccountHub.tsx`, so the committed report predates these two call sites. Recorded, not changed.
- This group's label contributes **1 element** to the screen's weight >= 600 count. The four 12px/600 labels together are the largest single contributor to the **33.33% FAIL**.
- **13px and 15.5px are two of the seven distinct sizes.** Neither is owned by this group alone; 03, 04, 05 and 06 all render both.
- Imagery: 0. This group has no image slot by design.
- **Against the ladder** (the benchmark ladder is `/de/salon/cuts-and-culture` measured 2026-08-27: anchor 30px over a 14px body, ratio 2.14x, 5 distinct sizes, 30% of visible text at weight >= 600, 3 elevation steps, 34.66% photographic. The owner chose "same ladder everywhere", so it is this screen's target too.) The row anatomy defined in this file contributes 3 of this screen's size tiers on its own (15.5, 13, 12) against a ladder total of 5 for a whole screen. It also carries **0 of the ladder's 3 elevation steps**, and that zero is LOCKED, not drift: LOCKFILE.md:578-580 names an account hub as a surface that gets no container. The ladder screen earns elevation from cards it is entitled to; this one is forbidden them.
- **A contradiction inside the rule this group obeys, recorded because it lands exactly here.** LOCKFILE.md:577 says a container-less group should "use whitespace and an inset hairline", and LOCKFILE.md:584 says that outside a container rows "may not" be hairline-divided. Both sentences are in the same block, seven lines apart, and an account hub is the surface named in between them. The shipped screen resolves it by rendering neither a container nor a divider. Recorded as a conflict in the law, not as a defect in the screen.

## Provenance
- Owner 2026-08-02, "konto hub better", grouped-row model replaces the tabbed hub
- Owner 2026-08-03, "why the fuck is this still boxing?", container dropped
- Owner 2026-08-03, "the icon sh remove" and "that weird gray and gray thingy", icon tile dropped
- Owner 2026-08-05, "icon should be abit bigger", glyph 19 to 22, sized off `airbnb--profile-list.md:52,83`
