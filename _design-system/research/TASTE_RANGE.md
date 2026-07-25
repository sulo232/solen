<!-- exists-check: `npm run exists taste_range` = 0 hits, `npm run exists "contrast range"` = 0 hits. Net-new
     vs the existing set: TASTE_HIERARCHY.md covers SCAN PATTERNS (F-shape, layer-cake, spotted) and
     TASTE_TYPOGRAPHY.md covers LEVEL COUNT and heading craft. Neither answers "how much separation does a
     level need, and what does the evidence actually say about spending emphasis". RATIONALE.md section 2
     already holds preattentive attributes and section 8 the aesthetic-usability effect , this file EXTENDS
     both with the sources and the honest contested state, and backlinks rather than restating. The one
     genuinely new thing here is the EXTERNAL EVIDENCE TIER for research/FLATNESS_DIAGNOSIS_2026-07-25.md,
     whose numbers were ours alone. Box R1 of _plans/RANGE_LAW.md. -->

# Contrast Range: what separates a designed screen from a wireframe

Evidence tiers use the RATIONALE.md section 0 vocabulary: **T1** replicated / meta-analytic / formal standard ·
**T2** one strong study or converging independent sources · **T3** directional (single study, vendor data) ·
**CONV** named convention, useful default, no empirical claim · **SPEC** a documented platform design-system
specification (evidence that a mature system encodes the thing, not evidence that it works).

## Summary of what the research actually supports

The research supports the MECHANISM behind the flatness finding and almost none of its numbers. Emphasis works
because it is rare: a target carrying a visual property no other element carries is found in parallel in under
250ms, while a target whose properties are shared with the field drops out of parallel search into slow serial
search (T1, preattentive processing). That is why "86% of text at weight 600" is a real defect and not a taste
preference, and it is a stronger argument than the practitioner slogan we have been citing. Misplaced emphasis
is also measurably harmful, not merely wasted (T2, reading-comprehension experiments). Photography anchors
attention only when it is large and carries task information; small decorative imagery is ignored and measurably
raises cognitive load, so the imagery floor is defensible for salon photos and indefensible for mood banners.
Depth is treated as a multi-step channel by both Material and Apple, and removing visual signifiers has a
measured cost (+22% time, +25% fixations, 71 participants). Finally, and most important for framing: a screen
that looks unfinished is NOT measurably harder to use (prototype fidelity does not change how many usability
issues surface). What it costs is CREDIBILITY, which is where the evidence for polish actually lives. So the
flatness work should be argued as a trust investment, never as a usability one. Our own literals (30% weight
share, 1.8x anchor ratio, 33% imagery, 2 elevation steps, 28px anchor) have no external backing and one of them,
the 1.8x ratio, is stricter than the only citable practitioner number and would fail our own PDP for a reason the
source does not support.

---

## Findings (ordered by usefulness)

1. **Emphasis is a signal only while it is UNIQUE, and this is mechanism, not taste.** "A unique visual property
   in the target allows it to 'pop out' of a display." Tasks completable on large multi-element displays in
   "less than 200 to 250 milliseconds" count as preattentive. But: "A target made up of a combination of
   non-unique features (a conjunction target) normally cannot be detected preattentively... Viewers must perform
   a time-consuming serial search through the displays." **Implication for Solen:** at 86% weight-600 on the PDP,
   weight 600 is a property of the FIELD, not of the anchor. The anchor becomes a conjunction target (600 AND
   larger AND first), which is exactly the case the literature says leaves parallel search. This is the honest
   root of the owner's "nothing special": the screen has no pop-out. Cite THIS, not the slogan in finding 3.
   [source: https://www.csc2.ncsu.edu/faculty/healey/PP/] [extended version: Healey & Enns, IEEE TVCG 18(7),
   2012, https://pubmed.ncbi.nlm.nih.gov/21788672/] T1

2. **Secondary variation MASKS the primary signal, and the fix is stated as an assignment rule.** Feature
   hierarchies are documented (luminance-on-hue, hue-on-form, hue-on-texture): random variation in the stronger
   feature destroys detection of a boundary in the weaker one, not the reverse. The operational conclusion, in
   the source's own words: "the most important data attributes (as defined by the viewer) should be displayed
   with the most salient visual features, if possible. The data-feature mapping should avoid situations where the
   display of secondary data values masks the information the viewer wants to see." **Implication for Solen:**
   this is the precise argument against nine clustered type sizes on home. Sizes that encode nothing are
   distractor variation on the size channel, and they mask the one size difference that was supposed to mean
   something. The rule is not "fewer sizes because tidy", it is "every remaining size step must encode a real
   rank, and the top rank must get the strongest channel."
   [source: https://www.csc2.ncsu.edu/faculty/healey/PP/] T1/T2

3. **"If you emphasize everything, nothing gets focus" is real and citable, but it is a GUIDELINE, not a
   measurement.** Verbatim from Nielsen's homepage guideline set, alongside "Keep the number of core tasks small
   (1-4) and the area around them clear." Butterick states the same law for type: "use bold and italic as little
   as possible" and "But if everything is emphasized, then nothing is emphasized." Tufte's smallest-effective-
   difference is the same idea from the other side: "Make all visual distinctions as subtle as possible, but
   still clear and effective" (Visual Explanations, p. 73). **Implication for Solen:** note the second half of
   Tufte's sentence. Our system quoted the "as subtle as possible" half and dropped "but still clear and
   effective", which is precisely the ceilings-without-floors failure the 2026-07-21 audit named. No number
   attaches to any of these. Label them CONV wherever they appear in LOCKFILE or CLAUDE.md.
   [source: https://www.nngroup.com/articles/113-design-guidelines-homepage-usability/]
   [source: https://practicaltypography.com/bold-or-italic.html]
   [source: https://boxesandarrows.com/three-lessons-from-tufte-special-deliverable-6/] CONV

4. **Emphasis placed on the wrong things measurably LOWERS comprehension, which is stronger than "it is
   wasted".** In a 90-participant experiment, comprehension accuracy was 82.59% (SD 10.16) with appropriate
   highlighting versus 75.39% (SD 9.97) with inappropriate highlighting, F(2,87) = 3.59, p < .03, partial eta2 =
   .08. Two honest nuances that cut against overclaiming: appropriate highlighting did NOT significantly beat NO
   highlighting (M = 80.00), and the harm from inappropriate highlighting disappeared when readers actively
   re-highlighted. The prior finding they build on is Silvers & Kreiner (1997), Reading Research and Instruction
   36, 217-223. **BOUNDARY:** this is prose comprehension under study conditions, not UI scanning. It is the
   closest MEASURED analogue to emphasis dilution and it should be cited as an analogue, not as a UI result.
   **Implication for Solen:** the defensible claim is "emphasis that does not discriminate important from trivial
   is a cost, not a neutral", which is enough to justify a weight budget existing. It is not enough to justify
   any particular percentage.
   [source: https://files.eric.ed.gov/fulltext/EJ926361.pdf , Gier, Kreiner, Hudnell, Montoya & Herring (2011),
   Journal of College Reading and Learning 41(2)] T2

5. **The "30-50% larger" figure is real, is NN/g, and our own docs cite it to the WRONG URL , and it does not
   support our 1.8x floor.** Verbatim: "Make this component 30-50% larger than other components", in the "Scale
   to create hierarchy" passage. `TASTE_TYPOGRAPHY.md` item 3 and its checklist item 2 both attribute this to
   `nngroup.com/articles/visual-hierarchy-ux-definition/`; I fetched that page and it contains NO percentage at
   all (it gives "no more than 3 sizes", "14px to 16px for the body copy, 18px to 22px for the subheader, and up
   to 32px for the header", "limit how many elements are big to a maximum of 2"). **Implication for Solen:** two
   corrections. (a) Fix the citation in TASTE_TYPOGRAPHY.md. (b) 30-50% means 1.3x to 1.5x. Our measured PDP
   anchor at **1.57x body PASSES that bar**, so FLATNESS_DIAGNOSIS_2026-07-25.md's line "a dominating level needs
   a 30-50% jump; 1.57x is one step, not a hierarchy" misreads its own source: 1.57x IS a 57% jump. The
   defensible half of that PDP row is the ABSOLUTE size (22px max against a 28px floor) and the 86% weight share,
   not the ratio. See NOT-SUPPORTED item 2.
   [source: https://www.nngroup.com/articles/why-does-a-design-look-good-part2/]
   [source: https://www.nngroup.com/articles/visual-hierarchy-ux-definition/] CONV

6. **Weber's law forecloses deriving any of our ratios from detectability.** Discrimination thresholds are a
   constant proportion of stimulus magnitude (dI / I = k). The Weber fraction commonly quoted for visual length
   discrimination is 0.02, i.e. a 2% change. **UNVERIFIED AT PRIMARY SOURCE:** that constant comes from a
   secondary compilation, not a paper I could open, and I found no Weber fraction measured for on-screen type
   size specifically. **Implication for Solen:** the direction of the argument survives regardless of the exact
   constant. The eye detects size differences far smaller than 30%, so 30-50% and 1.8x are NOT perceptual
   thresholds. They are conventions about reading as INTENTIONAL and CATEGORICAL inside a cluttered scene. Stop
   defending our ratios as perception. Defend them as coordination devices, which RATIONALE.md section 0 already
   says a CONV legitimately is.
   [source: https://www.mathematicalpsychology.com/Webers_Law , citing Weber 1834; Gescheider 1997; Laming
   1986] T1 for the law, unverified for the constant

7. **Photographs anchor attention only when they are large and carry task information. Small thumbnails LOSE to
   the text beside them.** NN/g eyetracking: users scrutinise "photos of products and real people (as opposed to
   stock photos of models)" and ignore "big feel-good images that are purely decorative". But the same article
   reports that on a full Amazon page "only 18% of the viewing time was spent on the photos, while 82% was spent
   on the text. On average, for each product, the thumbnail got 0.9 fixations, whereas the description got 4.4
   fixations", while an enlarged product photo drew 12 fixations. **Implication for Solen:** this SHARPENS
   FLOORS LAW 2 rather than merely confirming it. Salon photography is the product for a beauty marketplace, so
   the floor is justified in kind. But the floor must be spent on FEW LARGE informational photos, never on a grid
   of small thumbs and never on a mood banner. A 33% imagery share reached with small decorative tiles would
   satisfy our gate and fail this evidence.
   [source: https://www.nngroup.com/articles/photos-as-web-content/] T2 (NN/g eyetracking, participant count not
   stated in the article)

8. **Counter-evidence on imagery, both halves worth carrying.** (a) Task-irrelevant decorative pictures
   "increased the cognitive load as revealed by the EEG alpha frequency band power" while they "did neither
   affect behavioral performance nor subjective ratings of emotional-motivational factors" (32 participants, EEG
   plus eye-tracking). So decorative imagery is a measured cost with no measured benefit on that task. (b)
   "Users almost never look at anything that looks like an advertisement, whether or not it's actually an ad",
   and the blindness generalises to non-ad content sitting in ad-shaped slots. **Implication for Solen:** an
   image added purely to hit a percentage is not neutral. And a promo-shaped hero on home is at risk of being
   skipped by shape alone, independent of its content.
   [source: https://pmc.ncbi.nlm.nih.gov/articles/PMC11142986/ , Scharinger (2024), Psychological Research] T2
   [source: https://www.nngroup.com/articles/banner-blindness-original-eyetracking/] T1

9. **Depth is specified as a multi-STEP channel by both platform systems, and weak visual signifiers carry a
   measured cost.** Material: "Shadows provide important visual cues about objects' depth and directional
   movement. They are the only visual cue indicating the amount of separation between surfaces", with distinct
   dp values assigned per component role (card resting 2, app bar 4, FAB resting 6, menu 8, nav drawer 16, dialog
   24). Apple: "A material is a visual effect that creates a sense of depth, layering, and hierarchy between
   foreground and background elements", and iOS ships "four standard materials , ultra-thin, thin, regular
   (default), and thick". The measured half: an NN/g eyetracking study with 71 participants found weak-signifier
   (flat) versions cost "22% more time" and "25% more fixations" than strong-signifier versions, with the
   mechanism being uncertainty, "they don't feel confident that it is what they want, so they keep looking around
   the page". **Implication for Solen:** a two-step elevation minimum is a reasonable convention with real
   company. Note the honest gap in NOT-SUPPORTED item 4: nobody has published "one shadow value is a failure".
   [source: https://m1.material.io/material-design/elevation-shadows.html] SPEC
   [source: https://developer.apple.com/design/human-interface-guidelines/materials] SPEC
   [source: https://www.nngroup.com/articles/flat-ui-less-attention-cause-uncertainty/] T2

10. **Visual polish moves perceived CREDIBILITY, and this is the best-supported half of "it looks like a beta".**
    Stanford Web Credibility Project, 2,684 participants: "Nearly half of all consumers (or 46.1%) in the study
    assessed the credibility of sites based in part on the appeal of the overall visual design of a site", with
    the share varying by vertical (finance 54.6%, search 52.6%, travel 50.5%, e-commerce 46.2%, health 41.8%,
    news 39.6%, nonprofit 39.4%). **Caveats stated honestly:** it is one large study from 2002, it codes what
    people SAY drives credibility from open-ended comments rather than measuring behaviour, it predates the
    mobile web entirely, and I found no replication. Treat 46.1% as directional, not as a live number to quote at
    stakeholders. The companion theory paper (Prominence-Interpretation) is the mechanism half.
    **Implication for Solen:** "beta" is a credibility word. Credibility is where the evidence for polish is
    strongest, and it is the honest frame for this whole workstream.
    [source: https://en.wikipedia.org/wiki/Stanford_Web_Credibility_Project]
    [source: https://credibility.stanford.edu/pdf/Stanford-MakovskyWebCredStudy2002-prelim.pdf]
    [source: https://credibility.stanford.edu/pdf/p-iTheory_Fogg_Oct02.pdf] T2

11. **Visual-appeal judgments form in about 50ms and are stable, but that is a claim about JUDGMENT SPEED, not
    about conversion.** Lindgaard et al. (2006) found visual-appeal ratings at 50ms exposure correlated highly
    with ratings at 500ms and across repeated phases. **BOUNDARY:** the study measures rating consistency of
    appeal, nothing downstream. Anyone extending "50ms" into a revenue claim has left the source.
    [source: https://www.semanticscholar.org/paper/Attention-web-designers:-You-have-50-milliseconds-a-Lindgaard-Fernandes/f9715b117c57d4e7064afe1c1cb95d5bf4cc1831
    , Behaviour & Information Technology 25(2), 115-126] T2

12. **The aesthetic-usability effect is CONTESTED. Do not lean on it.** Sonderegger & Sauer (2010), 60
    adolescents on a simulated mobile phone: "participants using the highly appealing phone rated their appliance
    as being more usable" and "the visual appearance of the phone had a positive effect on performance, leading
    to reduced task completion times". Tuch et al. (2012), 80 participants across four versions of one online
    shop: "aesthetics does not affect perceived usability. In contrast, usability has an effect on post-use
    perceived aesthetics", i.e. a reversal to "what is usable is beautiful". RATIONALE.md section 8 already
    records the Kurosu & Kashimura r ~ 0.589 original and the 2023 CHI processing-fluency nuance; this is the
    same fault line, still open. **Implication for Solen:** do NOT argue that fixing flatness will make Solen
    easier to use. That claim has strong evidence on both sides and would be exactly the kind of laundering this
    file exists to prevent. Argue credibility (finding 10) and scan efficiency (findings 1, 2, 9).
    [source: https://pubmed.ncbi.nlm.nih.gov/19892317/ , Applied Ergonomics 41(3), 403-410]
    [source: https://www.semanticscholar.org/paper/Is-beautiful-really-usable-Toward-understanding-the-Tuch-Roth/4189eac6d7104e00323f78a8897167d50c815c80
    , Computers in Human Behavior 28(5), 1596-1607] T2 both, opposite directions

13. **"Looks unfinished" is not a usability defect, and this is the honest bound on the whole exercise.** Walker,
    Takayama & Landay (2002) compared low-fidelity (sketched) and high-fidelity (HTML) web prototypes in both
    paper and computer media: low- and high-fidelity prototypes surfaced the same NUMBER of usability issues, and
    results were independent of medium; the TYPE of issue differed by fidelity, not the count.
    **Implication for Solen:** a wireframe-looking screen is not measurably harder to use. This means (a) the
    flatness fix must be judged on credibility and preference, not on a task-time test, and (b) nobody should
    expect `check:floors` compliance to move a usability metric. Setting that expectation correctly now is worth
    more than a stronger-sounding claim.
    [source: https://www.leilatakayama.org/downloads/Takayama.Prototypes_HFES2002_prepress.pdf , HFES Annual
    Meeting Proceedings 46, 661-665] T2

14. **The squint test is a real named method with zero measured validation.** NN/g hosts it as a technique;
    popular attribution is to Luke Wroblewski. I found no study validating it as a predictor of anything.
    **Implication for Solen:** keep using it, it is nearly free, and keep it labelled CONV. It is a way to
    generate a hypothesis about the anchor, not evidence that the anchor works.
    [source: https://www.nngroup.com/videos/squint-test/] CONV

15. **Commerce lists need at least three product images, per vendor research.** Baymard: "2 images were often
    not enough for most users to get sufficient visual information about the product", with at least 3 thumbnails
    recommended in lists and 5-15 for apparel and accessories. **Caveat:** Baymard is vendor research; the
    testing is large-scale and moderated but the full methodology is not public, so this is T3 not T2.
    **Implication for Solen:** it is converging support for the density floor's "PDP gallery >= 5", from an
    independent direction. It is not a source for any of our other density numbers.
    [source: https://baymard.com/blog/secondary-hover-information] T3

---

## WHAT THE RESEARCH DOES NOT SUPPORT

Every one of our EMPHASIS BUDGET literals is in here. That is the finding, not a footnote: the numbers are
house conventions and should be labelled CONV, not presented as research-derived.

1. **No published threshold for the SHARE of text that may be bold.** I searched typographic, readability, and
   HCI literature. The bold research that exists is about STROKE WEIGHT (font grade, e.g. the CHI 2023 grade
   study), a different question entirely. Our **30%** cap has no external source. The nearest measured support is
   finding 4, which establishes only a direction (mis-targeted emphasis costs comprehension), not a fraction.
   Recommendation: keep the cap, relabel it CONV in LOCKFILE, and note it was derived from our own measured 86%
   as "clearly too high" rather than from a published threshold.

2. **No source for a 1.8x anchor-to-body ratio, and the only citable practitioner number is LOWER.** NN/g says
   30-50% (1.3x-1.5x). Our floor is 1.8x, which is stricter than the only number anyone published, and it fails
   our own PDP at 1.57x for a reason the source does not support (1.57x clears 30-50%). Recommendation: either
   drop the ratio floor to ~1.5x to match the citable number and rely on the 28px absolute anchor to carry the
   rest, or keep 1.8x explicitly as a house CONV with the NN/g figure recorded beside it as the external
   comparison. Do NOT keep citing "30-50%" as the justification for 1.8x, because it is not one.

3. **No source for "roughly 1/3 photographic area".** I searched for imagery-share, image-to-text ratio, and
   above-the-fold imagery guidance. Nothing measured exists. The **33%** floor is a house number. Findings 7 and
   8 justify LARGE INFORMATIONAL photography being present and prominent; they do not justify a percentage, and
   they actively warn that a percentage reached with small or decorative imagery is worse than nothing.

4. **No source for "one shadow value is a failure mode".** Material and Apple both ship multi-step depth systems
   (finding 9, SPEC), and NN/g measured a cost for weak signifiers generally (T2), but no one has published that
   N=1 elevation step specifically fails. Our **2 elevation steps** minimum is a reasonable convention with
   strong company. It is not a measured floor.

5. **No source for the 28px display anchor.** NN/g's only related figure is "up to 32px for the header" offered
   as a range, which is compatible with 28px but is not a floor and is not derived. House CONV.

6. **No validated ranking of contrast channels.** Nothing gives a numeric ordering of size vs weight vs colour
   vs position vs isolation. Already recorded in TASTE_HIERARCHY.md; re-confirmed here. The only sourced
   statement is relative: the element with the highest contrast TO ITS SURROUNDINGS wins, plus the specific
   documented feature-hierarchy pairs in finding 2 (luminance over hue, hue over form, hue over texture). Do not
   claim "size beats weight."

7. **No evidence that a COUNT of chromatic colours is a floor.** FLATNESS_DIAGNOSIS counted 2 on home and 3 on
   PDP and read it as a symptom. Hue is preattentive (T1) and semantic colour carries meaning, but no source
   states a minimum number of hues a screen needs. If a chroma floor is wanted, it has to be argued from FLOORS
   LAW 1's "at least one semantic-color moment", which is a presence rule, not a count.

8. **The Z-pattern remains unverified.** Carried forward from TASTE_HIERARCHY.md; nothing new found.

9. **Fowler & Barker (1974) is cited second-hand.** Full citation confirmed from an open-access paper's
   reference list: "Fowler, R. L., Barker, A. A. (1974). Effectiveness of highlighting for retention of text
   material. Journal of Applied Psychology, 59, 358-364." Search summaries claim it found that the MORE text
   subjects highlighted the worse they performed; I could not open the paper, and the open-access source I could
   read (finding 4) characterises it differently, as showing that readers benefit most "when they were confident
   that the highlighting discriminated between important material and trivia". **Do not cite the
   "more-highlighting-is-worse" version of this study anywhere until someone reads the 1974 paper.** Use finding
   4's measured numbers instead.

10. **Sources I could not open, listed so nobody assumes they were read:** the Healey & Enns TVCG 2012 PDF
    (binary parse failure; the author's HTML version at csc2.ncsu.edu was read instead and is what is quoted),
    the Yue/Storm/Kornell/Bjork highlighting paper (403), the ScienceDirect and Sage full texts for Tuch 2012,
    Dunlosky 2013 and Lindgaard 2006 (publisher paywalls; abstracts and indexed records were read instead), and
    the M3 elevation overview page (JavaScript-rendered; the Material 1 elevation spec was read instead, so the
    dp table quoted is the M1 table).

---

## Mapping: finding to the Solen floor it justifies

| Solen literal | Verdict | Basis |
|---|---|---|
| FLOORS LAW 7a, weight-600 share <= 30% | **Rule justified, number not.** Keep, relabel CONV | Findings 1 (T1 mechanism), 3 (CONV), 4 (T2 analogue). No published share threshold exists (NOT-SUPPORTED 1). |
| FLOORS LAW 7b, anchor >= 1.8x body | **CHANGE PROPOSED.** Either drop to ~1.5x or keep 1.8x explicitly as house CONV | Finding 5. The only citable number is 30-50% = 1.3-1.5x, and our measured 1.57x PDP clears it. The diagnosis line about 1.57x misreads its source and should be corrected in FLATNESS_DIAGNOSIS_2026-07-25.md. |
| FLOORS LAW 7c, size variety is not range | **Justified.** Keep | Finding 2 is the exact argument: unranked size variation is distractor variation on the size channel and masks the one step that was meant to mean something. This is the best-grounded item in the whole EMPHASIS BUDGET. |
| FLOORS LAW 6, display anchor >= 28px | Keep as CONV | NOT-SUPPORTED 5. NN/g's "up to 32px for the header" is compatible, not derivational. |
| FLOORS LAW 2, imagery >= ~33% | **Rule justified, number not, and the rule needs a QUALITY clause** | Findings 7 and 8. Add: the share must be carried by LARGE photography that is the content (salon, work, room). A share reached with small tiles or a mood banner satisfies the gate and fails the evidence, and decorative imagery is a measured cost (T2). |
| FLOORS LAW 3, density (gallery >= 5, reviews >= 3, services >= 6) | Gallery >= 5 has independent support | Finding 15 (T3 vendor). The other three numbers remain house CONV. |
| FLOORS LAW 1, finished-screen pass (b) "exactly ONE element is clearly the biggest" | **Justified, and it is the single best-grounded rule we have** | Findings 1 and 2. Also matches NN/g's "limit how many elements are big to a maximum of 2". |
| FLOORS LAW 1 (d), "at least one semantic-color moment" | Justified as a PRESENCE rule only | Hue is preattentive (T1). No source supports a colour COUNT (NOT-SUPPORTED 7). |
| LOCKFILE EMPHASIS BUDGET, >= 2 elevation steps | Keep as CONV with strong company | Finding 9. Material and Apple both ship multi-step depth; weak signifiers cost +22% time / +25% fixations (T2). No source says one step fails (NOT-SUPPORTED 4). |
| The framing of the whole workstream | **CHANGE PROPOSED** | Finding 13. Do not claim the flatness fix improves usability; fidelity does not change how many usability issues surface. Claim credibility (finding 10) and scan efficiency (findings 1, 2, 9). Finding 12 means the aesthetic-usability effect must not be used as support at all. |
| TASTE_TYPOGRAPHY.md item 3 + checklist item 2 | **CITATION BUG, fix it** | Finding 5. The "30-50%" quote is attributed to `visual-hierarchy-ux-definition`, which contains no percentage. Correct URL: `nngroup.com/articles/why-does-a-design-look-good-part2/`. |
