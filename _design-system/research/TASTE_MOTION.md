<!-- exists-check: `npm run exists taste_motion` = 0 hits. `npm run exists motion` = the /dev/motion + /dev/motion-recipe
     + /dev/scroll-motion demo routes, `useEnterMotion`/`useStepSwapMotion`, `lib/animations.ts`, and one REMOVED hit
     (team-wave, killed 2026-07-19) , all CODE, no research doc. Net-new vs the existing docs, and deliberately
     EXTENDS rather than duplicates: `_design-system/MOTION.md` holds the house LAW (enter recipe, motion-22 vocabulary,
     the SPEED LAW added 2026-07-25) but cites no external source; `RATIONALE.md` section 7 (motion + timing) and
     section 18 (depth, light, materiality) hold a one-paragraph SUMMARY of the mechanics and already record the 420ms
     enter recipe as a documented departure; `_plans/MOTION_LAW.md` holds this session's live captures.
     What is genuinely new here: (a) Miller 1968 read at the PRIMARY source, which changes what the 0.1s number is
     actually about, (b) the SPEED LAW's two-tier split tested against five independent design systems, (c) the
     measured helps/hurts literature with real statistics and its real boundaries, (d) the WCAG 1.4.11 finding that a
     drop shadow does not count as a contrast boundary, (e) a survey of how many elevation steps shipped systems
     actually carry, and (f) the NOT-SUPPORTED register for MOTION.md's own literals. Backlinks throughout, restates
     none of it. Box N3 + N4 of `_plans/MOTION_LAW.md`. -->

# Motion and Shadow: what the evidence actually supports

Evidence tiers use the RATIONALE.md section 0 vocabulary: **T1** replicated / meta-analytic / formal standard ·
**T2** one strong study or converging independent sources · **T3** directional (single study, vendor data) ·
**CONV** named convention, useful default, no empirical claim · **SPEC** a documented platform design-system
specification (evidence that a mature system encodes the thing, not evidence that it works).

Two extra labels this file needs. **PRIMARY** marks a source I opened and read myself (PDF extracted locally, or a
page that returned real body text), as opposed to a page read through a rendering proxy because it is a JavaScript
SPA , the proxied ones are named as such in the finding. **UNRESOLVED** marks a question where two sources I could
reach disagree and I did not settle it.

---

## Summary of what the research actually supports

The single most useful thing the literature does is name the JOB each duration serves, which is exactly the axis the
2026-07-25 captures landed on independently. Miller 1968, read at the primary source rather than through Nielsen's
retelling, does not say "0.1 second is fast." It says the acknowledgement that a control was physically activated
must arrive within 0.1 second, and it says nothing of the kind about anything else on the screen. That is our press
tier, with a 1968 citation and a stated psychological reason, and it is the only number in the SPEED LAW with a named
primary source behind it. The rest of our ladder is convention, and it is GOOD convention: five design systems built
by independent teams (Material, IBM Carbon, Atlassian, Microsoft Fluent, GitLab) all specify the same shape, a fast
tier for in-place feedback and a slower tier for elements that travel, with duration scaled to distance and size.
That convergence is the strongest available support for the SPEED LAW's snap-versus-reveal split, and it is still
convention: nobody has run a controlled experiment on preferred UI transition duration, and NN/g's own 100-500ms
guidance cites two practitioner books and one attention-capture study, not a duration study. On where motion HELPS,
the honest picture is narrow. Animation measurably helps a user reconstruct where things are (Bederson & Boltman
1999, p = .001, with no time penalty and no effect on anything else they measured) and measurably improves reading a
change between two related states (Heer & Robertson 2007, two controlled experiments). It measurably HURTS when it
replaces a static presentation the user could have compared at leisure (Brehmer et al. 2019, 96 participants, up to
2.8x longer), and the definitive review of animation-for-comprehension (Tversky, Morrison & Betrancourt 2002) found
the evidence "not encouraging" and traced apparent wins to unfair comparisons. Those authors do bless one use by
name , "real time changes and reorientations in time and space" , which is precisely what a sheet or a step swap is,
while noting it is rarely tested. So the defensible claim for Solen motion is continuity and acknowledgement, never
comprehension. On the harm side there is real law, not taste: WCAG 2.2.2 (Level A) and 2.3.1 (Level A) are binding,
2.3.3 (AAA) is not, and the vestibular trigger class is specifically named (scaling or panning LARGE objects,
spinning, parallax, peripheral horizontal movement) rather than "motion" generally. On shadow, the strongest finding
is one we did not have: WCAG's own Understanding document says a drop shadow is subsumed into whichever adjacent
colour is closer in luminance, so a shadow does not satisfy the 3:1 non-text contrast requirement. That turns
FLOORS LAW 4's edge-visibility rule from a house preference into an accessibility argument. Finally, the honest
negative: our own 420ms ENTER RECIPE sits above the ceiling every system we can cite gives for anything that is not
a full-screen transition, and no source supports blur as an entrance property.

---

## Findings (ordered by usefulness)

### Duration

1. **Miller's 0.1 second is about ACKNOWLEDGING AN INPUT, not about speed in general, and reading the primary source
   changes what our press tier is defending.** Verbatim from the paper, section "Topic 1. Response to control
   activation": "This is the indication of action given, ordinarily, by the movement of a key, switch or other
   control member that signals it has been physically activated... This response should be immediate and perceived
   as a part of the mechanical action induced by the operator. **Time delay: No more than 0.1 second.**" For visual
   feedback of a keystroke he allows "no more than 0.1 to 0.2 seconds". Note what the number is NOT attached to:
   Miller's limit for a meaningful reply in a conversation is **two seconds**, not one ("For good communication with
   humans, response delays of more than two seconds should follow only a condition of task closure"). **Implication
   for Solen:** the press tier (80-100ms, MOTION.md THE SPEED LAW) is the one row of our ladder that maps onto a
   named threshold from a named source, and the mapping is exact , press feedback IS "response to control
   activation". Defend the press tier this way. Do not stretch the same citation over snap or reveal; Miller says
   nothing about those.
   [source PDF read locally: https://yusufarslan.net/sites/yusufarslan.net/files/upload/content/Miller1968.pdf]
   [record: https://dblp.org/rec/conf/afips/Miller68.html , Miller, R. B. (1968), AFIPS Fall Joint Computer
   Conference vol. 33, 267-277, DOI 10.1145/1476589.1476628; the ACM page 403s to non-browser clients]
   T3/CONV PRIMARY , the paper is an argued design synthesis with a psychological rationale and explicit "estimates",
   not a controlled experiment. It is authoritative as the ORIGIN of the number, not as a measurement of it.

2. **The famous 0.1 / 1 / 10 triple is Nielsen's synthesis of two papers, and the middle number is not Miller's.**
   Verbatim: "0.1 second is about the limit for having the user feel that the system is reacting instantaneously";
   "1.0 second is about the limit for the user's flow of thought to stay uninterrupted, even though the user will
   notice the delay"; "10 seconds is about the limit for keeping the user's attention focused on the dialogue." And
   the credit line, verbatim: "The basic advice regarding response times has been about the same for thirty years
   [Miller 1968; Card et al. 1991]." **Implication for Solen:** cite it as "Nielsen 1993, after Miller 1968 and Card
   et al. 1991", never as "research shows". RATIONALE.md section 7 line 163 currently compresses this to "(Miller
   1968, Nielsen 1993)", which is fine, but anyone quoting the 1-second figure to Miller is wrong. Second-order
   point: none of the three limits is about ANIMATION duration at all. They are about system RESPONSE latency. Using
   them to justify an animation length is a category slide, and our docs should stop doing it.
   [source: https://www.nngroup.com/articles/response-times-3-important-limits/ , published 1993-01-01]
   [Card, S. K., Robertson, G. G. & Mackinlay, J. D. (1991), CHI '91, DOI 10.1145/108844.108874 , citation confirmed
   at index level only, full text not read] T2 for the synthesis, PRIMARY only for the Miller half (finding 1).

3. **THE CRUX, answered: duration scaled to distance and size, with a fast tier for in-place change and a slower
   tier for travel, is specified by five independent design systems , and by none of them as a measurement.** This
   is the claim the 2026-07-25 captures pointed at, so it gets the full evidence:
   - Material (v1): "**Use longer durations when objects need to travel large distances or have dramatic changes in
     surface area.**" Numbers: mobile transitions "typically occur over 300ms"; "elements entering the screen occur
     over 225ms"; "elements leaving the screen occur over 195ms"; full-screen "375ms"; and a ceiling, "**transitions
     that exceed 400ms may feel too slow**". Tablet ~+30%, wearables ~-30%, desktop 150-200ms.
     [source: https://m1.material.io/motion/duration-easing.html] SPEC PRIMARY
   - Material (v2): "Transitions that cover small areas of the screen have shorter durations than those that traverse
     larger areas", quantified as small elements (icons, selection controls) ~100ms, medium (bottom sheets, chips)
     250ms expanding / 200ms collapsing, large (full-screen) 300ms expanding / 250ms collapsing.
     [source: https://m2.material.io/design/motion/speed.html , JS SPA, read via a rendering proxy] SPEC
   - Atlassian, the cleanest statement of the split in words: "**Fast micro-interactions: Used for hover and press
     states. Short durations ensure the interface feels immediately responsive and polished.**" versus "**Spatial
     transitions: Used for elements entering, exiting, or moving on screen (e.g. Modals, Panels). Longer durations
     help users track spatial changes.**" And the rule: "**Keep small elements (hover states, micro-interactions)
     fast and understated. Allow larger elements (like Panel or Modal entrances) more time and expression.**"
     [source: https://atlassian.design/foundations/motion , read via a rendering proxy] SPEC
   - IBM Carbon ships the split as two NAMED systems with their own curves: "productive motion creates a sense of
     efficiency and responsiveness, while remaining subtle and out of the way" (microinteractions, button states,
     dropdowns) versus "expressive motion delivers enthusiastic, vibrant, and highly visible movement" for "opening
     a new page, clicking the primary action button". Its duration tokens: fast-01 **70ms**, fast-02 110ms,
     moderate-01 **150ms**, moderate-02 240ms, slow-01 **400ms**, slow-02 700ms.
     [source: https://carbondesignsystem.com/elements/motion/overview/] SPEC
   - GitLab: "**the greater the distance traveled and the more complex the animated object, the longer the animation
     duration should be**", with 100ms list-item hover, 200ms interactive hover/focus, 500ms action feedback, 600ms
     position changes. [source: https://design.gitlab.com/product-foundations/animation-fundamentals/] SPEC
   **Implication for Solen:** the SPEED LAW's three tiers are the industry's shape, and the shape is convergent
   across five teams who did not copy each other's numbers. Defend the SPLIT as strong convention. Do NOT defend the
   specific values 80 / 150 / 250-300 as anything but our own captures plus this convention band, and see
   NOT-SUPPORTED item 1. Note also that our snap tier at 150ms sits exactly on Carbon's moderate-01 and inside
   Material's desktop band, and our reveal tier at 250-300ms sits exactly on Material v2's medium-to-large rows. The
   ladder is well placed; it is just not measured.
   CONV, five converging independent SPEC sources, zero measured studies.

4. **Motion the user triggers repeatedly gets the fastest tier that still reads. Three independent sources state it,
   one with a number.** Atlassian: "**If someone will trigger this motion dozens of times a day, keep it under
   150ms**", and "List item hover, 50ms". NN/g: "**The more frequent the animation, the more subtle and shorter
   you'll want it to be.**" Apple HIG: "**In apps, generally avoid adding motion to UI interactions that occur
   frequently.**" **Implication for Solen:** MOTION.md THE SPEED LAW hard rule 5 already says this; it now has three
   named sources and a 150ms number that matches our snap tier exactly. The rule bites hardest on the filter chips,
   the tab switches, and the service-row selection in the booking flow, which a single booking hits many times.
   [source: https://atlassian.design/foundations/motion , via proxy]
   [source: https://www.nngroup.com/articles/animation-duration/]
   [source: https://developer.apple.com/design/human-interface-guidelines/motion , JS SPA, read via a headless
   render] CONV, three converging sources, no measurement.

5. **Apple specifies motion with no numbers at all, and that is itself a finding.** The HIG motion page gives
   principles , "Beautiful, fluid motions bring the interface to life, conveying status, providing feedback and
   instruction"; "**Add motion purposefully, supporting the experience without overshadowing it. Don't add motion for
   the sake of adding motion. Gratuitous or excessive animation can distract people and may make them feel
   disconnected or physically uncomfortable**"; "Aim for brevity and precision in feedback animations"; "Make motion
   optional... it's essential to avoid using it as the only way to communicate important information." No
   millisecond value appears. **Implication for Solen:** if the house wants a numeric ladder (it does, because a gate
   can only check numbers), the numbers come from Material / Carbon / Atlassian and from our own captures, not from
   Apple. Apple contributes the RESTRAINT clauses, and "avoid motion on frequent interactions" is the one that most
   directly threatens our 420ms ENTER RECIPE on list content.
   [source: https://developer.apple.com/design/human-interface-guidelines/motion , via headless render] SPEC.

### Where motion helps

6. **Animation measurably helps a user reconstruct WHERE things are, and that is the narrowest, best-supported
   pro-motion result.** Bederson & Boltman (1999), IEEE InfoVis '99: "**We found that animation improves users'
   ability to reconstruct the information space, with no penalty on task performance time.**" The statistics:
   "a statistically significant improvement in both the unweighted count (F1,19 = 16.165, p=.001) and the weighted
   count (F1,19 = 16.816, p=.001)" on the reconstruction task, and , stated honestly , "no significant difference in
   any of the other tasks or subjective [measures]". **Implication for Solen:** this is the citation for the sheet,
   the container transform, and the booking step swap: motion that shows a user where a thing went. It is NOT a
   citation for entrance animations on a list, because nothing is travelling and nothing needs reconstructing. Note
   the honest shape of the result: one win, no penalty, no effect on anything else. Motion bought orientation, not
   speed and not satisfaction.
   [source PDF: https://www.cs.umd.edu/hcil/jazz/learn/papers/CS-TR-3964.pdf] T2

7. **Animated transitions measurably improve reading a change between two related states.** Heer & Robertson (2007),
   IEEE InfoVis / TVCG: "Two controlled experiments were conducted to assess the efficacy of various transition
   types, finding that **animated transitions can significantly improve graphical perception**", with per-chart
   ANOVAs reported (e.g. scatter plot F(2,286) = 257.82, p < 0.001). The same paper's own caveat, which is the more
   useful half for us: "**animation is a double-edged sword... Animations that are too slow may prove boring or
   degrade task times, while those that are too fast may result in increased errors.**" **Implication for Solen:**
   this is the strongest measured support for the reveal tier existing at all, and it comes with its own two-sided
   speed warning that maps onto the tier ladder rather than onto "fast = polished". BOUNDARY: the task was reading
   quantities off statistical graphics. Solen has no such surface. Cite it for the MECHANISM (a transition that
   preserves object identity across a state change is read more accurately than a cut), not as a result about salon
   cards.
   [source PDF: https://idl.cs.washington.edu/files/2007-AnimatedTransitions-InfoVis.pdf]
   [record: https://pubmed.ncbi.nlm.nih.gov/17968070/] T2

8. **Motion captures attention involuntarily, which is simultaneously the reason it works and the reason it is
   dangerous.** Pratt, Radulescu, Guo & Abrams (2010), Psychological Science 21(11), six experiments: "Targets
   involving objects that underwent animate motion were responded to more quickly than targets involving objects
   that underwent inanimate motion", with the effect traced to perceived animacy rather than visual uniqueness. NN/g
   states the design consequence: "**The big advantage (and also drawback) of UI motion is that it attracts user
   attention... we are sensitive and prone to be distracted by any type of motion (meaningful or not). That's why
   motion in user interfaces can easily become annoying: it's hard to stop attending to it, and, if irrelevant to
   the task at hand, it can substantially degrade the user experience.**" **Implication for Solen:** any LOOPING or
   ambient animation on a screen that also carries a task is spending the user's attention on something that is not
   the task. In our motion-22 vocabulary that names three: `.animate-breathe` on an empty-state icon, the
   `animate-ping` live-status twin dot, and skeleton shimmer, all of which repeat until something else happens. Each
   needs a reason to exist while a form or a booking step is on screen, or it should stop after its first cycle.
   [source: https://pubmed.ncbi.nlm.nih.gov/20974713/]
   [source: https://www.nngroup.com/articles/animation-purpose-ux/ , Laubheimer, 2020] T2 for the study, CONV for
   the design consequence.

9. **Material names three functional roles, and they are worth adopting as vocabulary because they force the "which
   job" question the SPEED LAW is built on.** Verbatim: "Motion design **informs** users by highlighting
   relationships between elements, action availability, and action outcomes." · "Motion **focuses** attention on
   what's important, without creating unnecessary distraction." · "Motion **expresses** [celebrates] moments in user
   journeys, adds character to common interactions, and can express a brand's style." Plus, on continuity: "Motion
   helps orient users by showing how elements in a transition are related." **Implication for Solen:** map our own
   vocabulary onto these three and any motion that maps onto none of them is decoration and gets deleted. Press
   feedback = inform. Sheet, step swap, container transform = inform (continuity). SuccessMark and `.celebrate-rise`
   = express, and by Material's own framing express is the tier you spend rarely. Note the honest tier: this is a
   design system asserting a taxonomy, not evidence that motion does these things.
   [source: https://m2.material.io/design/motion/understanding-motion.html , via proxy] SPEC

10. **The 1993 primary source for slow-in / slow-out AND for motion blur in a UI exists, and its stated reason for
    blur is comprehensibility at speed.** Chang & Ungar, UIST '93: "User interfaces are often based on static
    presentations, a model ill suited for conveying change. Consequently, events on the screen frequently startle and
    confuse users." On the two techniques: "**Use of cartoon-style motion blur allows Self objects to move quickly
    and still maintain their comprehensibility**", and "Anticipating motion with a small contrary motion and
    **pacing the middle of transitions faster than the endpoints results in smoother and clearer movements**."
    **Implication for Solen:** our ENTER RECIPE's blur was locked for a perceptual reason the owner discovered
    empirically (an opacity-only fade was invisible to them, MOTION.md line 42-44). It turns out there is a named
    1993 precedent, and its stated reason is the SAME one, with one important difference in direction: blur is what
    lets motion be FAST and still read. That is an argument for keeping the blur while questioning the 420ms, not
    for keeping both. BOUNDARY, stated honestly: Chang & Ungar is a systems paper demonstrating techniques in the
    Self environment, not a controlled experiment, and their motion blur is applied to an object TRAVELLING at speed,
    not to an object resolving in place. See NOT-SUPPORTED item 4.
    [source: https://bibliography.selflanguage.org/animation.html , Chang, B.-W. & Ungar, D. (1993), UIST '93,
    45-55, DOI 10.1145/168642.168647] T3/CONV

11. **Motion can buy PERCEIVED speed even when it buys no real speed.** Harrison, Yeo & Hudson (2010), CHI 2010, on
    progress-bar animation: "we measured the effect of this particular progress bar design and showed that it
    **reduces the perceived duration among our participants by 11%**." **Implication for Solen:** this is the one
    citable case where motion's payoff is the FEELING rather than the function, and it is bounded to waiting states.
    It supports investing motion design in the booking-confirmation wait and the payment-processing wait, which is
    where Solen makes the user wait on someone else's system. It does not generalise to entrances.
    [source PDF: https://www.chrisharrison.net/projects/progressbars2/ProgressBarsHarrison.pdf] T2

### Where motion hurts

12. **The definitive review of animation-for-comprehension found the evidence "not encouraging", and traced apparent
    wins to unfair comparisons. This is the strongest negative in the whole file.** Tversky, Morrison & Betrancourt
    (2002), Int. J. Human-Computer Studies 57(4), 247-262, verbatim from the abstract: "**Yet the research on the
    efficacy of animated over static graphics is not encouraging. In cases where animated graphics seem superior to
    static ones, scrutiny reveals lack of equivalence between animated and static graphics in content or procedures;
    the animated graphics convey more information or involve interactivity.**" Their diagnosis is the Apprehension
    Principle: "**Animations are often too complex or too fast to be accurately perceived.**" Now the part that
    matters most for us, verbatim from their own CAVEATS section: "**The work analyzed here is work on the role of
    animations teaching complex systems, mechanical, biological, computational. The conclusions are restricted to
    those situations.**" And, in the same paragraph, the use they DO bless: "**At this point then, the most promising
    uses of animation seem to be to convey real-time changes and reorientations in time and space**", while noting
    such uses are "rarely tested in highly controlled experiments" and have "perhaps passed the test of time".
    **Implication for Solen:** two rules fall out. (a) Never justify a Solen animation on the grounds that it helps
    the user UNDERSTAND something. That claim has a large negative literature. (b) The one blessed use , real-time
    reorientation in time and space , is exactly what a sheet, a step swap, and a container transform do, so our
    continuity motion is on the right side of this paper, on the authors' own say-so, with the honest footnote that
    they call it untested rather than proven.
    [source PDF read locally: https://studio.courseware.epfl.ch/assets/courseware/v1/b4165ba2e4c9c5d3c8f48b67e2a65462/asset-v1:EPFL+DEMO+2020+type@asset+block/https___web.cs.dal.ca__sbrooks_csci4166-6406_seminars_readings_Tversky_AnimationFacilitate_IJHCS02.pdf]
    T1/T2 PRIMARY , a review of a literature, not a single experiment.

13. **Animation measurably slows a comparison task when it replaces something the user could have read at leisure.**
    Brehmer, Lee, Isenberg & Choe (2019), IEEE TVCG / VIS 2019, 96 crowdworker participants on mobile phones:
    "**We found that those using a small multiples design consistently completed tasks in less time, albeit with
    slightly less confidence than those using an animated design.**" The magnitude, verbatim from the paper: "this
    task can take up to **2.8 times longer** to complete in the Animation condition than in the Multiples condition",
    with later tasks narrowing to 1.9x and 1.7x , i.e. the penalty shrinks with practice. **Implication for Solen:**
    the failure mode named here is animation used as a SUBSTITUTE for showing things at once. In our system the
    closest live risk is any carousel or auto-advancing sequence that replaces a scannable list, and the PDP gallery
    if it ever auto-advances. Motion that hides state behind time is a measured cost. Note the confidence inversion
    too: the animation users were slower AND more confident, which is exactly the pattern that makes this failure
    survive user feedback.
    [source: https://arxiv.org/abs/1907.03919] T2

14. **Two WCAG criteria that bind motion are Level A, and we are more exposed to them than to the famous one.**
    - **SC 2.2.2 Pause, Stop, Hide, Level A:** "For any moving, blinking or scrolling information that (1) starts
      automatically, (2) lasts more than five seconds, and (3) is presented in parallel with other content, there is
      a mechanism for the user to pause, stop, or hide it unless the movement, blinking, or scrolling is part of an
      activity where it is essential."
      [source: https://www.w3.org/WAI/WCAG21/Understanding/pause-stop-hide.html]
    - **SC 2.3.1 Three Flashes or Below Threshold, Level A:** "Web pages do not contain anything that flashes more
      than three times in any one second period, or the flash is below the general flash and red flash thresholds."
      [source: https://www.w3.org/WAI/WCAG21/Understanding/three-flashes-or-below-threshold.html]
    - **SC 2.3.3 Animation from Interactions, Level AAA** (the one usually quoted): "Motion animation triggered by
      interaction can be disabled, unless the animation is essential to the functionality or the information being
      conveyed." Its Intent section is where the vestibular language lives: "if scrolling a page causes elements to
      move (other than the essential movement associated with scrolling) it can trigger vestibular disorders", and
      "The impact of animation on people with vestibular disorders can be quite severe. Triggered reactions include
      nausea, migraine headaches, and potentially needing bed rest to recover."
      [source: https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html]
    **Implication for Solen:** 2.3.3 is AAA, so it is aspiration; 2.2.2 is Level A and it is the one with teeth. Our
    exposure is every LOOPING animation that starts by itself and runs beside content: skeleton shimmer on a slow
    endpoint, `animate-ping` on a live status dot, `.animate-breathe` on an empty-state icon. Under five seconds each
    of these is fine; a slow API turns a shimmer into a Level A failure without anyone changing a line of code. The
    correct fix is a cap (stop the loop, or swap to a static state, after a bounded number of cycles), not a
    discussion. Note also that `prefers-reduced-motion` does not discharge 2.2.2: the criterion asks for a mechanism
    for the user, and most users never set that flag.
    T1 , normative standards text.

15. **The vestibular trigger class is SPECIFIC and named, and "all motion" is not it.** James Craig, WebKit,
    2017-05-15, the post that shipped `prefers-reduced-motion`: scaling and zooming ("Visual scaling or zooming
    animations give the illusion that the viewer is moving forward or backward in physical space"), spinning
    ("Effects that use spiraling or spinning movements can cause some people with vestibular disorders to lose their
    balance or vertical orientation"), parallax and multi-speed movement, 2D planes moved in 3D space, and peripheral
    motion ("Horizontal movement in the peripheral field of vision can cause disorientation or queasiness"). The
    guidance is REPLACE, not delete: "**Even if your site uses motion in a purely decorative sense, only remove the
    animations you know to be vestibular triggers**", and "Consider serving an alternate, simpler animation, or
    display another visual indicator to convey the intended meaning". MDN says the same with an example that swaps a
    scaling `pulse` for an opacity `dissolve`, and names the class as "animations such as **scaling or panning large
    objects**". **Implication for Solen:** our reduced-motion handling (MOTION.md: base state is the FINAL state, the
    animation only adds the entrance) is MORE conservative than these sources require, which is defensible but should
    be recorded as a choice rather than as what the spec demands. More useful: the trigger list tells us what to
    actually avoid at full strength , a full-screen scale or zoom, a parallax hero, a spinning loader as a page-level
    element, and horizontal motion at the screen edges. Our ENTER RECIPE's scale 0.96 to 1 on a card is a small scale
    on a small object, which is not the described trigger; a page-level scale would be.
    [source: https://webkit.org/blog/7551/responsive-design-for-motion/]
    [source: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion] T2 , authoritative
    practitioner sources (the feature's author and MDN), not a clinical study.

16. **The prevalence figure everyone quotes is real, has a named source, and does not mean what it is usually used to
    mean.** Agrawal, Carey, Della Santina, Schubert & Minor (2009), Archives of Internal Medicine 169(10), 938-944:
    "**From 2001 through 2004, 35.4% of US adults aged 40 years and older (69 million Americans) had vestibular
    dysfunction.**" NHANES 2001-2004, n = 5086, measured with the modified Romberg Test of Standing Balance. WebKit's
    "as many as 69 million people in the United States alone" is this number. **Implication for Solen:** it is
    citable, and the boundary must travel with it every time. This measures balance-test vestibular dysfunction in
    US adults aged 40+, not sensitivity to on-screen animation, and it is a US sample. Never write "35% of users get
    motion sick from your animations". The defensible sentence is: the population with vestibular dysfunction is
    large enough that a trigger-class animation will reach some of them, which is why the trigger list in finding 15
    is the operational thing, not the percentage.
    [source: https://pubmed.ncbi.nlm.nih.gov/19468085/] T1 for the epidemiology, MISAPPLIED whenever used as a
    UI-motion-sensitivity rate.

### Easing

17. **Enter and exit take different curves, and the clearest stated REASON comes from Microsoft, not from Material.**
    Material v1 ships the set with values: standard `cubic-bezier(0.4, 0.0, 0.2, 1)` for property changes;
    deceleration `cubic-bezier(0.0, 0.0, 0.2, 1)` for elements entering; acceleration `cubic-bezier(0.4, 0.0, 1, 1)`
    for elements exiting; sharp `cubic-bezier(0.4, 0.0, 0.6, 1)` for reversible exits , and the asymmetry shows in
    its durations too (enter 225ms, exit 195ms). The reasoning I could actually find quoted is Microsoft's, on its
    two curves: entering, "**The resulting feel is that the object traveled from a long distance away and entered at
    an extreme velocity**" (so it needs heavy deceleration to stop believably); exiting, "**The resulting feel is
    that the object is trying its hardest to get out of the user's way and make room for new content to come in.**"
    Atlassian encodes the same split by name: `ease-out bold` `cubic-bezier(0, 0.4, 0, 1)` , "Elements arrive quickly
    and decelerate to a stop"; `ease-in practical` `cubic-bezier(0.6, 0, 0.8, 0.6)` , "Starts slowly and accelerates
    away. Best for exit transitions where elements get out of the way." **Implication for Solen:** we already own the
    right SHAPES , `glide` (0.16, 1, 0.3, 1) is a strong decelerate and is correctly used for entrances; `thud`
    (0.7, 0, 0.84, 0) is an accelerate; `snap` (0.4, 0, 0.2, 1) is literally Material's standard curve. What we do
    NOT have is an ASSIGNMENT RULE by direction. `thud` is documented as "press-down feel" only, when its shape is
    exactly the exit curve every system specifies. The gap is naming, not tokens: add "exits use `thud`" and the
    vocabulary is complete without a new value. RATIONALE.md section 7 line 167 already states the semantics; this
    finding adds the sourced values and the missing exit assignment.
    [source: https://m1.material.io/motion/duration-easing.html]
    [source: https://learn.microsoft.com/en-us/windows/apps/design/motion/timing-and-easing]
    [source: https://atlassian.design/foundations/motion , via proxy] SPEC, converging.

18. **What a spring BUYS conceptually is interruptibility and velocity handoff, not a curve shape , and that is the
    part worth copying.** SwiftUI's own documentation on its spring animations: "**When mixed with other spring() or
    interactiveSpring() animations on the same property, each animation replaces its successor while preserving
    velocity from one animation to the next**", with the named presets `.smooth`, `.snappy`, `.bouncy` and the
    parameter vocabulary `response` / `dampingFraction` / `bounce` / `blendDuration`. The framing quote is from
    Apple's own engineer at WWDC18 session 803 (Designing Fluid Interfaces): "**I haven't used the word duration. We
    actually like to avoid using duration when we're describing elastic behaviors, because it reinforces this concept
    of constant dynamic change**", alongside "Allow for constant redirection and interruption. This one's big" and
    "The system is preserving all your energy and momentum, and gracefully transferring it into the interface."
    **Implication for Solen, split by platform:**
    - The IDEA that transfers to web: a motion the user can interrupt without being made to wait is a different
      quality from a fast motion. MOTION.md THE SPEED LAW hard rule 4 already says "interruptible"; this is the
      source for WHY it matters more than the duration number, and it is the honest answer to "our product feels
      static" that is not "make everything faster".
    - The IDEA that transfers to gestures: LOCKFILE section 16.5 already locks gesture-driven elements to a spring
      seeded with the finger's velocity. That rule is the correct reading of this material and needs no change.
    - What does NOT transfer to CSS: `linear()` can approximate a spring's SHAPE ("allows the approximation of
      complex animations and transitions by interpolating linearly between the specified points"), but it is a
      precomputed static curve. Nothing in the CSS documentation I fetched provides velocity carry-over on
      interruption. So on the web, spring SHAPE is available in CSS, spring PHYSICS is only available in the JS layer
      (framer-motion, which Solen already uses). See NOT-SUPPORTED item 8 for the honest limit of that claim.
    [source: https://developer.apple.com/documentation/swiftui/animation]
    [source: https://asciiwwdc.com/2018/sessions/803]
    [source: https://developer.mozilla.org/en-US/docs/Web/CSS/easing-function/linear] SPEC + named practitioner
    statement; iOS-native for the physics, web for the idea.

### Shadow and elevation

19. **A shadow's job, in the only system that ever defined it, is to encode SEPARATION , which makes any shadow that
    encodes no z-relationship decoration by definition.** Material v1: "**Shadows provide important visual cues about
    objects' depth and directional movement.**" and "**They are the only visual cue indicating the amount of
    separation between surfaces.**" Material v2 adds the quantitative half: "**Both a shadow's size and amount of
    softness or diffusion express the degree of distance between two surfaces.**" **Implication for Solen:** this
    gives the shadow audit a single binary question: what is this element above? Our shipped counts are
    `shadow-elevation` 176 uses, `shadow-elevation-2` 110, `shadow-whisper` 41, `shadow-elevation-3` 31,
    `shadow-float` 6, plus `shadow-sm` 24 and `shadow-md` 4 leaking in from Tailwind defaults. The locked surface
    table in CLAUDE.md already assigns a shadow per role, which is the right structure; the 28 default-Tailwind uses
    are the ones that answer no question and should be swept.
    [source: https://m1.material.io/material-design/elevation-shadows.html]
    [source: https://m2.material.io/design/environment/elevation.html , via proxy] SPEC

20. **WCAG explicitly does NOT count a drop shadow as a contrast boundary, and this is the strongest external
    backing FLOORS LAW 4 has ever had.** SC 1.4.11 Non-text Contrast (Level AA) requires: "The visual presentation of
    the following have a contrast ratio of at least 3:1 against adjacent color(s): User Interface Components...
    Graphical Objects". And the Understanding document is explicit about shadows: "**a 3D drop-shadow on an input, or
    a dark border line between contrasting backgrounds is considered to be subsumed into the color closest in
    brightness (perceived luminance)**". **Implication for Solen:** FLOORS LAW 4 says a white card carrying only a 4%
    shadow on white is invalid, and until now that was a house aesthetic call. It is also, where the container is a
    user-interface component, an AA accessibility argument: the shadow does not count, so the boundary must come from
    the sunken tray, a flush photo edge, or the hairline , which is exactly the (a)/(b)/(c) menu the floor already
    offers. BOUNDARY, stated honestly: 1.4.11 covers user-interface components and graphical objects needed to
    understand content. A purely decorative container is arguably out of scope, and the criterion is about the 3:1
    ratio rather than about shadows as such. The defensible sentence is "a shadow cannot be the thing that satisfies
    1.4.11", not "every shadowed card fails WCAG".
    [source: https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html] T1 , normative + its Understanding
    document.

21. **Weak visual signifiers cost measured time and measured looking.** NN/g eyetracking, 71 participants: "On
    average participants spent **22% more time** (i.e., slower task performance) looking at the pages with weak
    signifiers", and "people had **25% more fixations** on the pages with weak signifiers", with the mechanism given
    as uncertainty. This is already recorded in `TASTE_RANGE.md` finding 9; carried here only because it is the one
    measured number on the depth side and re-verified this session (all three figures confirmed exactly, no drift).
    [source: https://www.nngroup.com/articles/flat-ui-less-attention-cause-uncertainty/] T2

22. **Shadow as a depth cue is real vision science, and it comes with a direction constraint.** Kersten, Mamassian &
    Knill (1997), Perception 26(2), 171-192, DOI 10.1068/p260171: "Phenomenally strong visual illusions are described
    in which **the motion of an object's cast shadow determines the perceived 3-D trajectory of the object**... The
    results support the hypothesis that the human visual system incorporates a **stationary light-source
    constraint** in the perceptual processing of spatial layout of scenes." The light-position prior is separately
    documented ("the light is located above their head and slightly to the left"). **Implication for Solen:** the
    operational consequence is consistency, not quantity. One light, one direction, every shadow offset downward.
    Our tokens are all positive-y, so we already comply; the rule to write down is that a shadow may never be offset
    upward or sideways to "look designed", because that reads as a second light source and the scene stops cohering.
    RATIONALE.md section 18 already holds the light-from-above prior and the pressed-state inset consequence; this
    adds the cast-shadow-determines-trajectory result and its direction constraint.
    [source: https://pubmed.ncbi.nlm.nih.gov/9274752/] T1

23. **How many elevation steps a system needs has no measured answer, and the convergent convention is 4 to 6.**
    What shipped systems actually carry: Material v1 and v2, roughly **11** distinct dp values (1, 2, 3, 4, 6, 8, 9,
    12, 16, 24) assigned per component; Material v3 collapsed this to **6 named levels (0-5)** at 0 / 1 / 3 / 6 / 8 /
    12 dp, and added tonal surface fill as an alternative to shadow entirely ("Elevation can be depicted using
    shadows or other visual cues, such as surface fills with a tone difference"); Atlassian, **4** (Sunken, Default,
    Raised, Overlay); Microsoft Fluent 2, **6** shadow tokens; Shopify Polaris, **6**. None of them states a reason
    for its number. **Implication for Solen:** we ship **4** distinct values in real use (`whisper`, `elevation-1` /
    `float`, `elevation-2`, `elevation-3`), which sits at the bottom of the convention band and is fine. The actual
    problem in `tailwind.config.js` is not the count but the ~14 legacy aliases (`card`, `surface`, `warm-*`,
    `v5-*`) that map onto those same four values under different names , that is a naming-drift surface, and it is
    how a fifth de-facto level gets born. Also worth carrying: M3's move to tonal fill is a documented precedent for
    Solen's own gray-tray-instead-of-shadow habit (FLOORS LAW 4 option a).
    [source: https://m3.material.io/styles/elevation/tokens , via proxy]
    [source: https://atlassian.design/foundations/elevation , via proxy]
    [source: https://fluent2.microsoft.design/elevation , via proxy]
    [source: https://polaris.shopify.com/design/depth/shadow-tokens , via proxy] CONV, five converging SPEC sources,
    zero measurement. See NOT-SUPPORTED item 6.

24. **Apple's answer to depth is material, not shadow , and that answer needs a busy backdrop to work.** HIG:
    "**Materials help visually separate foreground elements, such as text and controls, from background elements,
    such as content and solid colors**", and "By allowing color to pass through from background to foreground, a
    material establishes visual hierarchy to help people more easily retain a sense of place." The current guidance
    extends this to Liquid Glass: "Use standard materials and effects , such as blur, vibrancy, and blending modes ,
    to convey a sense of structure in the content beneath Liquid Glass." **Implication for Solen:** our `FROST_GLASS`
    over-photo control is the same move and is already law in CLAUDE.md's surface table. The BOUNDARY is the useful
    part: translucency encodes depth only when there is something varied behind it. On Solen's white surfaces, blur
    conveys nothing, so the boundary must come from the sunken tray or the hairline. That is why the surface table
    is right to make frost conditional on "over a photo" rather than a general elevation tool. RATIONALE.md section
    18's translucency-discipline paragraph already records the contrast risk; this adds the "needs a backdrop"
    condition.
    [source: https://developer.apple.com/design/human-interface-guidelines/materials , JS SPA, via proxy] SPEC

25. **Never ANIMATE a box-shadow.** web.dev, on paint cost: "**drawing a drop-shadow on a DOM element involves a
    multi-pass operation with splines and other sorts of nasty things, as opposed to opacity which should be easier
    to render**", with the further note that the cost is combination-dependent, "it's not just the box-shadow
    property itself, but rather that specific value permutation" (box-shadow plus border-radius being worse together
    than either alone predicts). **Implication for Solen:** this converges with MOTION.md THE SPEED LAW hard rule 2
    ("never animate width, height or top") from a different direction and extends it: a hover-lift that transitions
    `box-shadow` repaints on every frame. The cheap form is a pre-rendered shadow layer whose `opacity` is animated,
    with `transform: translateY()` doing the lift. Our `transitionProperty` config already defines
    `shadow-transform` and `colors-shadow` groups, which is exactly the pattern to stop using on hover-heavy
    surfaces like the salon card grid. BOUNDARY: this source is qualitative practitioner engineering, with no
    benchmark numbers , see NOT-SUPPORTED item 7.
    [source: https://web.dev/articles/css-paint-times] T3/CONV

---

## WHAT THE RESEARCH DOES NOT SUPPORT

The pattern here is the same one `TASTE_RANGE.md` found for the EMPHASIS BUDGET: the SHAPE of our motion law is
well-supported and every LITERAL in it is ours. That is the finding, not a footnote.

1. **No measured study on optimal or preferred UI animation duration exists.** Three independent searches this
   session (mine and two research agents) found none. The closest thing to a citable range is NN/g's "In general,
   the duration of most animations should be in the range of 100-500 ms, depending on complexity and on how far the
   element is traveling", and that article's only academic citation is Pratt et al. 2010, which is about attention
   capture by moving stimuli, not about duration preference; its other two references are practitioner books (Head
   2016, Saffer 2014). **Consequence:** MOTION.md THE SPEED LAW's 80-100 / 150 / 250-300 values are our own live
   captures plus a five-system convention band. Label them CONV, not research-derived. They are well placed inside
   that band, which is the honest and sufficient defence.
   [source: https://www.nngroup.com/articles/animation-duration/]

2. **No evidence supports "fast equals polished", and our own captures are the counterexample.** The 2026-07-25
   measurement found X uniformly at 150ms and Airbnb tiered at 300/250/100, which cannot both be the polished speed.
   The SPEED LAW already draws the right conclusion (speed follows the job). Recording it here so that nobody
   re-derives "make everything faster" from the X capture alone, which is the error that capture nearly caused.

3. **No source supports the ENTER RECIPE's 420ms for a card entrance, and every source we can cite puts it over the
   line.** Material v1: "transitions that exceed 400ms may feel too slow"; Material v2's largest tier is 300ms;
   Carbon's slow-01 at 400ms is described for "large expansion" and important notifications; Atlassian says keep a
   frequently-triggered motion under 150ms; Apple says avoid motion on frequent interactions entirely. A card
   entrance is neither full-screen nor rare. **This contradicts a LOCKED rule** (MOTION.md line 28, owner-approved
   2026-07-09), and RATIONALE.md line 165 already carries it as a DOCUMENTED DEPARTURE with an honest tradeoff. Per
   this file's own standing (RATIONALE.md's rule: a mechanic that argues against a lock is a QUESTIONS.md entry, not
   a change), the correct move is to surface it, not to edit it. The specific question worth putting to the owner:
   the 420ms was approved to fix an entrance the owner could not PERCEIVE, and finding 10 says blur is what buys
   perceptibility at speed , so is 420ms buying anything the blur is not already buying at 250-300ms? That is a
   side-by-side the owner can feel, in the same form as `/de/dev/motion`, not a question to answer in prose.

4. **No source supports blur as a property of an element RESOLVING IN PLACE.** Chang & Ungar 1993 is the nearest
   precedent and it is adjacent, not identical: their motion blur is applied to an object TRAVELLING fast, and its
   stated purpose is comprehensibility at speed. Our 8px blur on a card that scales 0.96 to 1 is a different
   mechanism (a focus-pull, not a smear). It is a house CONV that works for a reason the owner verified empirically,
   and it should be labelled as one. Do not cite Disney or Chang & Ungar as its justification.

5. **No claim about how X's or Airbnb's NATIVE apps animate is supportable, and one tempting inference from the
   captures must not be drawn.** What we have is computed CSS `transitionDuration` and `transitionTimingFunction`
   read off their MOBILE WEB pages in a 390x844 Playwright viewport, plus the owner's own 60fps screen recording of
   X. That is what the captures license and nothing more. In particular: x.com's `cubic-bezier(0.4, ...)` shares a
   first parameter with Material's standard curve `cubic-bezier(0.4, 0, 0.2, 1)`, and airbnb.com's
   `cubic-bezier(0.2, ...)` shares one with Material 3's standard `cubic-bezier(0.2, 0, 0, 1)`. **That is a
   coincidence of one number and is NOT evidence that either product uses Material.** Do not write it down as one.
   Any future competitor motion claim needs an owner recording, a Mobbin artifact, or a named public engineering
   post, per the premortem in `_plans/MOTION_LAW.md`.

6. **No measured answer exists for how many elevation levels a system needs.** Every number in finding 23 is a
   design decision published without a rationale. Our four is defensible as convention with company; it is not a
   floor and it is not derived. This also re-confirms `TASTE_RANGE.md` NOT-SUPPORTED item 4 ("no source for one
   shadow value being a failure mode") from a wider survey.

7. **No benchmark numbers for box-shadow cost were found.** The web.dev source is qualitative. Practitioner blogs
   repeat figures with no methodology; none was verified, so none is cited. "Do not animate box-shadow" is sound
   engineering advice with a citable qualitative source, not a measured cost.

8. **CSS velocity preservation on interruption is argued from an ABSENCE, not from a positive source.** CSS
   transitions restart from the current computed value, so they retarget rather than snap; but no page fetched this
   session documents CSS or the Web Animations API carrying VELOCITY across an interruption the way SwiftUI's
   documentation explicitly does. Treat "CSS cannot preserve velocity" as UNVERIFIED-BY-ABSENCE. It matches how
   framer-motion markets its own spring layer, but that is a vendor's framing, not a spec statement.

9. **Material 3's current motion model is UNRESOLVED here.** Two M3 pages read through a rendering proxy in the same
   session gave different pictures: one publishes a duration-token ladder (short1-4 = 50/100/150/200ms, medium1-4 =
   250/300/350/400ms, long1-4 = 450-600ms, extra-long1-4 = 700-1000ms) with easing tokens, the other describes an
   opinionated physics-based spring scheme. Both may be true simultaneously; I did not reconcile them and nobody
   should cite "M3 is spring-based now" off this file.

10. **IBM Carbon's own numbers disagree between two of its pages.** The current Carbon site gives the fast-01 70ms /
    moderate-01 150ms / slow-01 400ms token set; an older IBM Design Language page gives 100ms productive / 150ms
    expressive with different cubic-beziers. Cite the current site; do not merge the two sets, and do not cite a
    third bezier set that surfaced only in search snippets.

11. **"Disney's 12 principles of UI animation" as a law has no study behind it.** The citable primary source is a
    1993 systems paper (Chang & Ungar) demonstrating a handful of the techniques in one environment. The popular
    twelve-principles listicles are folklore, and the parts of the twelve that get quoted at UI (squash and stretch,
    exaggeration, appeal) have no UI evidence at all. Cite Chang & Ungar for slow-in/slow-out, anticipation, and
    motion blur; cite nothing for the rest.

12. **The vestibular prevalence figure is not a UI-motion-sensitivity rate** (finding 16). It is repeated here
    because it is the single most likely number in this file to get laundered into a persuasion stat.

13. **The 0.1 / 1 / 10 limits are about SYSTEM RESPONSE LATENCY, not animation length** (finding 2). Using them to
    set an animation duration is a category slide, and it is one our own docs are one step away from making.

14. **Sources I could not open, listed so nobody assumes they were read:** the ACM Digital Library pages for Miller
    1968, Card et al. 1991 and Chang & Ungar 1993 (403 to non-browser clients; the Miller PDF was read from a
    university mirror and the Chang & Ungar abstract from the Self bibliography); the ScienceDirect full text for
    Tversky 2002 (the paper itself was read from an open PDF mirror); the WWDC23 "Animate with springs" session
    (session confirmed real, no fetchable transcript found , cite nothing from it); Ant Design's and Salesforce
    Lightning's motion token pages; and the Journal of Consumer Research paper on animation speed and perceived
    waiting time (paywalled, not read, not cited). Every m2/m3.material.io, atlassian.design, fluent2, polaris and
    developer.apple.com page in this file is a JavaScript SPA and was read through a rendering proxy or a headless
    render, never by direct fetch , flagged inline as such.

---

## Mapping: finding to a concrete recommendation

Platform column: **web** = implementable in Solen's Next.js + Tailwind + framer-motion stack today · **iOS** =
`solen-mobile` only · **both**.

| Finding | Recommendation | Platform |
|---|---|---|
| 1, Miller's 0.1s is input acknowledgement | Keep the press tier at 80-100ms and defend it with Miller 1968 by name. It is the only tier with a primary source, and the source is about exactly that job. | both |
| 2, the triple is Nielsen's synthesis | Fix the citation form wherever it appears: "Nielsen 1993, after Miller 1968 and Card et al. 1991". Stop using response-latency limits to justify animation lengths. | doc |
| 3, distance/size scaling, five systems | Keep the three-tier SPEED LAW. Record it in MOTION.md as CONV backed by five converging design systems plus our own captures, never as measured. Add the missing operational sentence: pick the tier by how far the element travels, not by which component it is. | both |
| 4, repeated motion gets the fast tier | Keep hard rule 5, and attach the number: anything the user triggers many times in one session stays at or under 150ms. Audit the booking-flow chips, filter pills and content tabs against it. | both |
| 5, Apple gives no numbers | Take restraint clauses from Apple, numbers from Material/Carbon/Atlassian and our captures. Do not go looking for an Apple millisecond value; there isn't one. | doc |
| 6, animation aids spatial reconstruction | Spend reveal-tier motion on things that TRAVEL and need to be located afterwards: sheet, container transform, booking step swap, map-to-list morph. This is the citation for those and only those. | both |
| 7, animated transitions aid reading a change | Keep the reveal tier. Carry Heer & Robertson's own two-sided warning ("too slow may degrade task times, too fast may result in increased errors") as the reason the tier has a floor as well as a ceiling. | both |
| 8, motion captures attention involuntarily | Cap every LOOPING animation: shimmer, `animate-ping`, `.animate-breathe` stop or degrade to a static state after a bounded number of cycles, and never loop beside an active form or booking step. | web (audit `globals.css` motion-22 utilities) |
| 9, Material's three roles | Adopt inform / focus / express as the classification question in the design-verifier: a motion that maps to none of the three is decoration and gets deleted. | doc + gate |
| 10, motion blur buys speed | Use the blur to go FASTER, not to go longer. Concretely: this is the argument for testing the ENTER RECIPE at 250-300ms with the blur kept, as a side-by-side. | web |
| 11, motion cuts perceived wait 11% | Invest motion design in the two places Solen makes the user wait on an external system: payment processing and booking confirmation. Not in entrances. | both |
| 12, Tversky, animation does not aid comprehension | Never justify a Solen animation as "it helps the user understand". Justify continuity and acknowledgement only. Add this sentence to the design-verifier's motion check. | doc + gate |
| 13, animation as a substitute is 2.8x slower | Never replace a scannable set with a timed sequence. No auto-advancing PDP gallery, no auto-rotating home carousel. If a REMOVED entry does not already cover this, it should. | web |
| 14, WCAG 2.2.2 is Level A | Any auto-starting looping motion that can run past five seconds beside other content needs a cap or a stop. Skeleton shimmer on a slow endpoint is the live exposure. Fix with a cycle cap, not a discussion. | both |
| 15, the named vestibular trigger class | Ban at full strength: page-level scale or zoom, parallax heroes, spinning page-level loaders, horizontal motion at the screen edges. Small-object scale (our 0.96) is not in the class. Record our reduced-motion handling as more conservative than required, by choice. | both |
| 16, 35.4% prevalence | Citable with its boundary attached, every time. Never as a UI-motion-sensitivity rate. Candidate for the RATIONALE.md section 12 folklore table's neighbours. | doc |
| 17, enter/exit asymmetry | Add the missing assignment rule to MOTION.md: entrances `glide`, in-place `snap`, **exits `thud`**, earned moments `spring`. No new token needed , `thud` already has the exit shape and is currently documented for press only. | web (tokens exist) |
| 18, springs buy interruptibility | Web: keep hard rule 4 (interruptible) and treat it as a bigger lever than the duration number; real spring physics stays in the framer-motion layer, not CSS. CSS `linear()` can carry a spring's shape but not its physics. | web for the idea, **iOS-only** for native SwiftUI springs |
| 19, a shadow encodes separation | Sweep the 28 default-Tailwind `shadow-sm`/`shadow-md` uses onto the locked surface table. Every remaining shadow must answer "above what?". | web |
| 20, WCAG 1.4.11 does not count a shadow | Upgrade FLOORS LAW 4 from house preference to a sourced rule: the boundary must come from the sunken tray, a flush photo edge, or the hairline, because the shadow does not count toward 3:1. Keep the honest boundary (this is about the ratio, not a blanket "shadowed cards fail"). | both |
| 21, weak signifiers cost 22% time | Already carried in `TASTE_RANGE.md` finding 9. No new action; re-verified this session with no drift. | , |
| 22, one light, one direction | Write the direction constraint down: shadows are offset downward, never upward or sideways. We already comply; the rule prevents a future "designed" inversion. | both |
| 23, 4-6 elevation steps is convention | Keep four. The action item is the ~14 legacy aliases in `tailwind.config.js` mapping onto those four under other names, which is how a fifth level gets born. | web |
| 24, Apple's material needs a backdrop | Keep `FROST_GLASS` conditional on "over a photo". Never use blur as a general elevation tool on white. | both |
| 25, box-shadow paint cost | Stop transitioning `box-shadow` on hover-heavy surfaces (the salon card grid). Animate the opacity of a shadow layer plus a `translateY` transform instead. | web |
