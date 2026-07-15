# Dashboard & data-dense layout — sourced findings (delta only)

All findings below are dashboard-specific operational rules or diagnosis procedures not already covered in RATIONALE.md (which owns Gestalt basics, Fitts/Hick, preattentive pop-out theory, WCAG math, modular scales, 45-75ch measure, 8pt grid, optical alignment, corner curvature, motion thresholds, aesthetic-usability/fluency/MAYA).

## Findings, ordered by usefulness

1. **Chart-type decision rule.** Start from "what is the one finding," then pick: bar chart for categorical comparison, line chart with point markers for trends over time, scatter for two continuous variables. Never pie, donut, gauge, treemap, or 3D for dashboard metrics, they force angle/area/volume judgments people get wrong. [source: https://www.nngroup.com/articles/choosing-chart-types/] T1 (converges with the preattentive-encoding finding below)

2. **Preattentive basis for the chart rule.** Length and 2D position are judged accurately without focused attention; area, angle, and color are not, and color also fails ~8% of men (colorblindness). This is WHY bar/line/scatter outperform pie/gauge/3D on a dashboard specifically, not a restatement of general pop-out theory. [source: https://www.nngroup.com/articles/dashboards-preattentive/] T1

3. **Table vs. chart threshold.** Use a table when the task is comparing several attributes across a SMALL set of items (compensatory decision-making). Do not use a table when items aren't mutually exclusive, are simple/cheap/interchangeable, are one-off and incomparable, or the set exceeds roughly 5-7, filter first instead. [source: https://www.nngroup.com/articles/comparison-tables/] T2

4. **Data-ink ratio (Tufte, via NN/g).** Every mark that isn't data must earn its place: cut 3D effects, decorative gradients/shadows/textures, gridlines that duplicate visible labels, default chart-library chrome, and legends (replace with direct end-of-series labeling). Keep gridlines/axis marks only when the viewer must ESTIMATE a value or judge a range, not when exact labels are already shown. [source: https://www.nngroup.com/articles/clutter-charts/] T2

5. **Progressive disclosure depth cap: 2 levels.** Designs that go past two disclosure levels measurably lose usability, users get lost navigating between levels. If the domain genuinely needs a third level, treat that as a signal to simplify the underlying model, not to add a level. [source: https://www.nngroup.com/articles/progressive-disclosure/] T2

6. **Progressive disclosure split rule.** What's on the primary screen must be decided from usage frequency data (analytics, task frequency, field studies), not guesswork or "we have the field so let's show it." Primary = frequently needed; secondary = rare only. [source: https://www.nngroup.com/articles/progressive-disclosure/] T2

7. **Named failure: "data seems random and unfocused."** Showing every available metric because it's technically available, rather than because it's decision-relevant, is a documented dashboard anti-pattern from practice; an unfiltered dashboard reads to users as if everything shown must matter, which destabilizes trust in what actually is important. [source: https://www.pencilandpaper.io/articles/ux-pattern-analysis-data-dashboards] CONV (named practitioner pattern, not a controlled study)

8. **Named failure: "comparisons and baselines lacking."** A raw KPI number with no adjacent landmark (target, prior period, benchmark average) reads as inert data rather than actionable information; the fix is pairing every headline number with a comparison point. [source: https://www.pencilandpaper.io/articles/ux-pattern-analysis-data-dashboards] CONV

9. **Content dispersion (density too LOW, the mirror failure of a cluttered wall of tiles).** Spreading related figures across tabs, accordions, or a long scroll forces the viewer to hold values in working memory while navigating, weakens the mental model of the whole, and is specifically read by users as the product "hiding information," lowering trust, not a neutral information-architecture tradeoff. [source: https://www.nngroup.com/articles/content-dispersion/] T2

10. **Peer-reviewed placement finding, dashboard-specific (not general web F-pattern).** A controlled 2-experiment eye-tracking study (N=42, N=40) found significantly better task performance and lower perceived complexity when the single core/primary chart sits left-center on the horizontal axis with secondary widgets in partial symmetry around it, versus other placements. Single study, treat magnitude as directional and verify on our own dashboard before treating as law. [source: Zhang, Zhang, Jiang & Ge, "The Effects of Layout Order on Interface Complexity," Sensors 24(18):5966, 2024, https://pmc.ncbi.nlm.nih.gov/articles/PMC11435723/] T2

11. **Lawn-mower scan pattern for dense tables/KPI grids.** A well-structured dense table gets scanned in an efficient, systematic left-right-left sweep. This breaks into scattered re-checking (the discriminating symptom of a badly structured dense screen) when: the table runs long without a sticky/frozen header, jargon or acronyms are undefined, cells sit empty or hold placeholder content, or content repeats identically across columns. [source: https://www.nngroup.com/articles/lawn-mower-pattern/] T2

12. **Column self-sufficiency rule (keeps the lawn-mower pattern intact).** A cell must be interpretable without forcing the eye back to the row label. Group same-type rows together (all yes/no clustered), and span a value that's identical across every column into one merged cell instead of repeating it in each column. [source: https://www.nngroup.com/articles/lawn-mower-pattern/] T2

13. **Data-table 4-task model.** A dense table exists to (a) find records matching criteria, (b) compare across records, (c) view/edit a single record, (d) act on records. Each task has its own structural rule: first column = human-readable identifier, not an internal ID; column order = importance, with related fields adjacent; frozen header row/column on scroll; inline row actions limited to one or two labeled operations, more goes in a menu. [source: https://www.nngroup.com/articles/data-tables/] T2

14. **Density/whitespace inverse rule.** Increasing a component's own density (tighter row height, tighter cell padding in tables/lists/forms) must be paired with LARGER margins and gutters around that block, not smaller. Density at the component level and whitespace at the layout level move in opposite directions. Density gains apply to tables, long forms, and lists; do not densify focused-task controls (date pickers, alerts, single inputs), where extra room reduces error rather than adding throughput. [source: Material Design, via Una Kravets/Google Design, https://medium.com/google-design/using-material-density-on-the-web-59d85f1918f0] CONV (named system, not an experiment)

15. **Salience-by-subtraction, measured on an actual dashboard audit.** NN/g's own review found that removing a decorative icon sitting next to a KPI number made the number itself read as more visually prominent, an icon competing with a number for attention is a decoration-over-data cost, not a wayfinding gain. [source: https://www.nngroup.com/articles/complex-application-design/] T2

16. **Reduce-clutter-without-reducing-capability mechanic.** For a genuinely complex operator panel, move advanced or rare parameters behind a related checkbox/toggle (staged disclosure inside the form) rather than deleting the capability outright or cramming it into the default view. [source: https://www.nngroup.com/articles/complex-application-design/] T2

17. **Named failure: unequal-weight tiles as no-hierarchy.** Practitioner naming for "wall of equal tiles": when every KPI card is sized identically, area conveys no importance ranking and nothing draws the eye first; fix is deliberate size asymmetry (one hero tile larger, secondary tiles smaller) so tile area itself encodes rank, layered on top of, not instead of, type hierarchy. [source: https://www.pencilandpaper.io/articles/ux-pattern-analysis-data-dashboards] CONV

18. **Peer-reviewed composition-pattern catalog exists for dashboards specifically.** "Dashboard Design Patterns" (Bach, Freeman, Abdul-Rahman, Turkay, Khan, Nguyen, Fan, Chen), IEEE VIS/TVCG 2023, catalogs component patterns (data/meta-information, visual encodings, interactions) and composition patterns (screenspace usage, structure, layout, color) specifically for dashboards, useful as a primary reference to check any new dashboard layout against rather than inventing structure ad hoc. [source: https://dashboarddesignpatterns.github.io/] T2 (peer-reviewed pattern collection)

## Diagnostic checklist: symptom -> measure/check -> named violation

1. **Symptom:** a fresh viewer can't say what mattered most on the dashboard. **Check:** run a 5-second test, flash the screen, ask what the single most important number was. **Violation if it fails:** no salience hierarchy (finding 17), test method per [source: https://www.nngroup.com/videos/5-second-usability-test/] T2.

2. **Symptom:** every KPI card looks the same size and weight. **Check:** count distinct tile sizes/emphasis levels used to encode rank; if one size does all the ranking work, that's the failure. **Violation:** wall-of-equal-tiles, no-hierarchy (finding 17).

3. **Symptom:** numbers feel meaningless, "so what" reaction. **Check:** for each headline KPI, is a comparison point (target, prior period, benchmark) within one line of it? **Violation if missing:** comparisons-and-baselines-lacking (finding 8).

4. **Symptom:** the screen "feels busy" even though the underlying data is legitimate. **Check:** for every visual element ask "does removing this lose information a decision depends on?" **Violation if not:** chartjunk / low data-ink ratio (finding 4).

5. **Symptom:** a dense table or KPI grid is hard to scan, eyes visibly jump around instead of sweeping rows. **Check:** trace the scan path row by row; does it stay systematic or fragment into re-checking? **Violation:** broken lawn-mower pattern, check for missing sticky header, undefined jargon, placeholder cells, or redundant repeated columns (findings 11-12).

6. **Symptom:** pie, donut, gauge, or 3D charts appear anywhere on an operator dashboard. **Check:** is the underlying task "judge or compare a magnitude"? **Violation if yes:** preattentive mismatch, angle/area/volume encoding used for a task that needs length/position (findings 1-2), swap to bar/line.

7. **Symptom:** an operator has to click through 3 or more nested screens/tabs to reach a related number. **Check:** count disclosure levels from the dashboard home to that number. **Violation if >2:** progressive-disclosure depth failure (finding 5).

8. **Symptom:** the dashboard surfaces every field the database happens to have. **Check:** for each metric, would removing it change any operator decision? **Violation if not:** data-seems-random-and-unfocused (finding 7).

9. **Symptom:** two numbers a decision depends on live on different tabs/screens, forcing the operator to hold one in memory while checking the other. **Check:** can both be seen without navigating away? **Violation if not:** content dispersion (finding 9).

10. **Symptom:** a densified table/list looks cramped and the surrounding page feels tight rather than calmer. **Check:** did the margins/gutters AROUND the block grow when the row density inside it increased, per the inverse rule? **Violation if margins stayed flat or shrank:** density/whitespace inverse rule broken (finding 14); the existing 44px touch floor in the design contract stays fixed regardless.

## Sources fetched (primary pages read, not just search snippets)

- [nngroup.com/articles/dashboards-preattentive](https://www.nngroup.com/articles/dashboards-preattentive/)
- [nngroup.com/articles/complex-application-design](https://www.nngroup.com/articles/complex-application-design/)
- [nngroup.com/articles/progressive-disclosure](https://www.nngroup.com/articles/progressive-disclosure/)
- [nngroup.com/articles/choosing-chart-types](https://www.nngroup.com/articles/choosing-chart-types/)
- [nngroup.com/articles/data-tables](https://www.nngroup.com/articles/data-tables/)
- [nngroup.com/articles/comparison-tables](https://www.nngroup.com/articles/comparison-tables/)
- [nngroup.com/articles/clutter-charts](https://www.nngroup.com/articles/clutter-charts/)
- [nngroup.com/articles/lawn-mower-pattern](https://www.nngroup.com/articles/lawn-mower-pattern/)
- [nngroup.com/articles/content-dispersion](https://www.nngroup.com/articles/content-dispersion/)
- [pmc.ncbi.nlm.nih.gov/articles/PMC11435723 (Zhang et al., Sensors 2024)](https://pmc.ncbi.nlm.nih.gov/articles/PMC11435723/)
- [dashboarddesignpatterns.github.io (Bach et al., IEEE VIS/TVCG 2023)](https://dashboarddesignpatterns.github.io/)
- [pencilandpaper.io/articles/ux-pattern-analysis-data-dashboards](https://www.pencilandpaper.io/articles/ux-pattern-analysis-data-dashboards)
- [medium.com/google-design/using-material-density-on-the-web (Una Kravets, official Google Design blog)](https://medium.com/google-design/using-material-density-on-the-web-59d85f1918f0)

Dropped without a fetched source: the m3.material.io density page and m2 data-tables spec page rendered as client-side apps with no body text reachable via fetch, so their exact dp/px numbers (56dp header row etc.) were only ever seen in a search snippet, not confirmed against the live page, and were excluded per rule 1.