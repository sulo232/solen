# Typographic Hierarchy: Operational Delta Findings
> CITATION FIX 2026-07-25 (from `TASTE_RANGE.md`): the 30-50% size-jump figure was cited to
> `visual-hierarchy-ux-definition`, which contains no percentage. The real source is
> `why-does-a-design-look-good-part2`. Also note 30-50% means 1.3x-1.5x, so a 1.57x ratio PASSES it.


## Findings (ordered by usefulness)

1. **Cap the level count at 2-3, not more.** "Limit yourself to three levels of headings. Two is better." More than three confuses readers because the eye can no longer hold the ranking in memory. [source: https://practicaltypography.com/headings.html] T2/CONV

2. **UI screens cap at 2-3 type sizes total, same number as headings.** "Use no more than 3 sizes small, medium, and large" to signal importance in a page's information architecture; suggested web ranges run roughly 14-16px body, 18-22px subheader, up to 32px header. [source: https://www.nngroup.com/articles/visual-hierarchy-ux-definition/] T1

3. **When a level must read as "more important," jump size by a lot, not a little.** To make one component read as dominant, "make this component 30-50% larger than other components." A 1-2px bump does not register as a hierarchy signal, it reads as a rendering glitch. [source: https://www.nngroup.com/articles/why-does-a-design-look-good-part2/] T2

4. **Contrast in running-prose headings works the opposite way: modest size jumps, spacing does the real work.** In continuous-text documents (not UI screens), increment heading size only slightly over body (e.g. 12pt body to 12.5-13pt heading) because "the best way to emphasize a heading is by putting space above and below, because it's both subtle and effective." Context matters: UI hierarchy leans on size delta, document hierarchy leans on space + weight. [source: https://practicaltypography.com/headings.html] CONV

5. **Space-before must exceed space-after on every heading, always.** "You'll probably want the space below to be smaller than the space above so the heading is visually closer to the text it introduces." Equal or inverted spacing makes the heading float between two blocks instead of visibly owning the one below it. Space alone can carry emphasis "without adding a single mark to the page." [source: https://practicaltypography.com/space-above-and-below.html] T2/CONV

6. **Named failure pattern, competing bolds / stacked emphasis:** "Writers often attempt to make headings visually distinct with injudicious combinations of bold or italic, underlining, point size, all caps, and first-line indents. But if everything is emphasized, then nothing is emphasized." Diagnose any heading style that stacks 3+ differentiators (bold + caps + color + underline) as this failure. [source: https://practicaltypography.com/headings.html] CONV

7. **Bold and italic are mutually exclusive, never both on the same element ("rule #1"), and both should be used "as little as possible."** For sans-serif UI type specifically, skip italic entirely and use bold as the only weight-based emphasis tool, since sans italics don't carry enough visual distinction. [source: https://practicaltypography.com/bold-or-italic.html] CONV

8. **Named failure pattern, ALL-CAPS misuse:** caps are legibility-neutral (even faster) for a single glanceable word or a short label in isolation, but degrade legibility and cause letter confusion once applied to multi-word phrases or full sentences that get actually read rather than glanced at. Diagnostic: if a heading is a complete sentence or runs past ~3-4 words, caps is the wrong tool. [source: https://www.nngroup.com/articles/glanceable-fonts/] T1
   Corroborating rule: "If your headings are full sentences, then they're too long for caps." [source: https://practicaltypography.com/headings.html] CONV

9. **Named failure pattern, centered long text:** centering is fine for a short title or a business-card-length line, never for a paragraph or body block, because ragged left edges force the eye to re-locate the start of every line ("both edges of the text block are uneven"). [source: https://practicaltypography.com/centered-text.html] T2/CONV

10. **Underlining is a deprecated emphasis device in professional typesetting**, reserved historically for typewriter-era text that couldn't render italics; on-screen it now reads as "this is a hyperlink," so applying it to a heading or emphasized phrase collides with the link affordance. [source: https://en.wikipedia.org/wiki/Emphasis_(typography)] T2

11. **A screen's heading/list nesting should use at most two levels of visual indent even if there are more heading levels underneath**, because deeper indent ladders read as "random and messy" rather than as a clear hierarchy. [source: https://practicaltypography.com/headings.html] CONV

12. **Named external convention for a bounded, role-based type system:** Material Design 3 organizes all type into exactly 5 named roles (Display, Headline, Title, Body, Label), each with 3 sizes, for a ceiling of 15 styles system-wide, not per screen. Display/Headline are reserved for short, important, editorial-weight text; Body is optimized for legibility at small sizes carrying "the majority of information on the screen." This is evidence that a hierarchy system should assign each level a *purpose* (what kind of content lives there), not just a size number. [source: https://material-web.dev/theming/typography/] CONV

13. **Color differentiates hierarchy only as a supplement, never as the sole signal**, and the working palette for hierarchy purposes should itself stay small (roughly 2 primary + 2 secondary colors) or the hierarchy collapses: "if everything is contrasted, then nothing stands out." [source: https://www.nngroup.com/articles/visual-hierarchy-ux-definition/] T2

## Diagnostic checklist

1. **Symptom: screen feels like a wall of same-weight text, nothing pops.** Measure: count distinct type sizes actually in use on the screen. Violation if 1 (no hierarchy) or if >3 (over-differentiation). Target 2-3. [source: https://www.nngroup.com/articles/visual-hierarchy-ux-definition/]

2. **Symptom: the "important" element doesn't read as important even though it's technically bigger.** Measure: compute the % size delta between it and the next level down. Violation if delta is under ~30%. Fix: jump the size, don't nudge it. [source: https://www.nngroup.com/articles/visual-hierarchy-ux-definition/]

3. **Symptom: a heading/label looks noisy or "trying too hard."** Check: count how many differentiators are stacked on it (bold + caps + color + underline + larger size). Violation if 3 or more stack simultaneously, named pattern "if everything is emphasized, nothing is emphasized." Fix: pick one, at most two, differentiators per level. [source: https://practicaltypography.com/headings.html]

4. **Symptom: a heading is in bold AND italic at once.** Violation: breaks the mutual-exclusivity rule (bold OR italic, never both). On sans-serif UI type, italic should not appear at all as an emphasis device. [source: https://practicaltypography.com/bold-or-italic.html]

5. **Symptom: an ALL-CAPS label is hard to scan or is a full sentence.** Check: word count of the capped string. Violation if it's a full sentence or a multi-word phrase meant to be read (not glanced at once). Caps is only safe for a single short label/word. [source: https://www.nngroup.com/articles/glanceable-fonts/]

6. **Symptom: a heading feels disconnected from the content below it, or ambiguously grouped with the block above.** Measure: compare the pixel gap above the heading vs below it. Violation if space-below >= space-above (should always be smaller-below so the heading visually attaches to what follows). [source: https://practicaltypography.com/space-above-and-below.html]

7. **Symptom: a block of body copy or a multi-line description is center-aligned.** Violation: centering used on running text rather than a short title/label. Check line count: >1-2 lines of prose should never be centered. [source: https://practicaltypography.com/centered-text.html]

8. **Symptom: a heading or emphasized phrase is underlined.** Violation: underline is a deprecated emphasis device that now collides with link affordance; substitute bold, size, or spacing instead. [source: https://en.wikipedia.org/wiki/Emphasis_(typography)]

9. **Symptom: a nested list/settings tree has 3+ distinct indent depths.** Violation: exceeds the two-level indent ceiling and will read as disorganized regardless of how many logical heading levels exist underneath. Collapse to at most two visual indent steps. [source: https://practicaltypography.com/headings.html]

10. **Symptom: hierarchy is carried entirely by hue (e.g., blue = important, grey = not) with no size/weight backup.** Violation: color used as the sole hierarchy signal, and/or more than ~4 colors doing hierarchy work at once (dilutes contrast, "if everything is contrasted, nothing stands out"). Every color-coded level needs a redundant size or weight cue. [source: https://www.nngroup.com/articles/visual-hierarchy-ux-definition/]
