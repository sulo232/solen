# Video brief: "The UX Psychology Behind Apps People Can't Stop Using" (uxpeak, 2026-07-02)

<!-- exists-check: net-new vs _tasks/archive/CLAUDE_DESIGN_RESEARCH.md and _roadmaps/roadmap-premium-design.md because those are retired design-research/roadmap docs; no psychology research doc exists (npm run exists psychology = 0 hits 2026-07-07). This starts the _design-system/research/ evidence base for workstream 11 (PSYCHOLOGY). -->

Source: youtu.be/2TlIg3VokY8 (11:34, watched 2026-07-07 via yt-dlp transcript + 87 frames at 8s intervals, frames read by delegated subagents). This file records what the VIDEO claims; verification status of each numeric claim lives in the claim-check section at the bottom (filled by the claim-verification fleet). Do not treat a video claim as law until it carries a verified mark.

Overall philosophy (intro/outro, near-verbatim): most apps fail not because they look bad but because they ignore how people actually think. Users do not make logical decisions: defaults feel like recommendations, the first number sets the anchor, a gift creates a debt, building something makes it yours, and progress (even a fake head start) creates real momentum.

## The 6 principles, each with the video's before/after

### 1. Smart defaults (decision fatigue)
- Claim: every empty field is a decision; stacked decisions cause abandonment. 70-90% of users never change default values; a good default reads as a recommendation ("this is what most people pick"). User's job shifts from "fill out from scratch" to "scan and adjust".
- Cited: Columbia University jam study, 24 flavors -> 3% purchase vs 6 flavors -> 30%.
- BEFORE: "Book a Table" form, five empty fields (DATE, TIME, GUESTS, SEATING, OCCASION), grey disabled button "Search Available Tables". Frame text: "Blank = Friction".
- AFTER: same form pre-filled: DATE "Tomorrow, Fri 25 Mar", TIME as "POPULAR TIMES" chips (6:00 / 6:30 / 7:00 selected / 7:30) + "View All Times", GUESTS stepper "2", SEATING "Indoor" preselected; button becomes "Search 12 Available Tables" (live result count in the CTA).
- Lever: pre-select the most common choice for every field; put the live result count on the CTA.

### 2. Goal gradient / endowed progress (never start at 0%)
- Claim: the closer people feel to finishing, the faster they move; you choose where the starting line is. Reframe account creation as step one already done.
- Cited: Columbia car-wash loyalty study: 8 empty stamps vs 10 stamps with 2 pre-filled; same effort, the endowed group completed at nearly double the rate. LinkedIn profile-strength meter "never at zero" (frames show LinkedIn's BEGINNER / INTERMEDIATE / ALL-STAR profile-level cards: "You're 2 steps away from reaching this level").
- BEFORE: "Profile Setup", "Your Progress 0% Complete", empty fields.
- AFTER: header "You're doing great!", progress "20%" with momentum icons, 5-step indicator with "Sign up" already checked (Profile, Photo, Verify, Done ahead).
- Lever: count something already done; show a stepper with step 1 pre-checked.

### 3. Reciprocity (value before signup)
- Claim: asking for signup before delivering any value is holding results hostage; give a genuinely useful partial result first, then ask to SAVE it. "The signup never feels like a wall because the user already got something worth coming back for."
- Cited: Robert Cialdini (Influence): reciprocity as the most powerful persuasion driver; free samples increase purchases "up to 2,000%" (Costco storefront + "FREE SAMPLES" tag in frames). Examples: Costco samples, Spotify 30-day premium, Notion full product before pay.
- BEFORE: "Website Analyzer": user runs scan, results blurred behind a lock, "Sign up to unlock" + email/password + "Create Account".
- AFTER: real partial report free (score 72/100, "3 Critical Issues", "5 Warnings", "8 Passed"), then "Want the full 50-page report? Save your results" + button "Save My Report - Free".
- Lever: deliver the useful partial result first; the auth ask becomes "save your result", not "unlock".

### 4. IKEA effect + endowment effect (let them build before signup)
- Claim: people value what they helped build (and merely feeling ownership is enough); a signup page with nothing of "theirs" on it is effortless to abandon.
- Cited: Norton, Mochon, Ariely, Journal of Consumer Psychology 2012 (IKEA effect).
- BEFORE: "Create Your Workspace": Email, Password, "Sign Up" button (frame commentary bubble: "Where?").
- AFTER: "Design Your Profile": name, title, location chip ("San Francisco", "5 years exp"), color palette picker, card style picker ("Soft" selected of Soft/Dark/Minimal); the button says "Continue", not "Sign up". Duolingo example: language, goal checklist, first lesson completed before the signup screen ever appears; contacts permission asked only after that investment.
- Lever: move one real customization/building step BEFORE the auth ask; label the commit button "Continue".

### 5. Loss aversion / status quo bias (frame the loss, not the gain)
- Claim: losses weigh about twice as much as equivalent gains (Kahneman); "upgrade now / maybe later" pitches the weak motivator. Show what the user stands to LOSE by inaction.
- BEFORE: storage app upsell: nice icon, feature list, "Upgrade now" + easy escape hatch "Maybe later".
- AFTER: names the user's actual at-risk items with a countdown; frame f_042 variant: "Don't lose tonight's work" + "YOUR PROGRESS (Unsaved)" listing "The anchor effect 8/10", "Streak started Day 1", "XP earned +40"; dismiss reads "I'll risk it".
- Lever: name the user's own concrete at-risk items in the decision moment; make the dismiss copy own the consequence.
- NOTE: the video's most dark-pattern-adjacent principle; any Solen adoption must pass the no-fabrication rule and the reactance/ethics bar (only ever true, user-owned items, never invented urgency).

### 6. Anchoring / contrast effect (control the previous number)
- Claim: the brain evaluates every number relative to what it saw immediately before. Same $50/month protection feels expensive alone ($600/yr mental math) and trivial directly under a $1,899 laptop with the label "Just 2.6%".
- Cited examples: $90 Wagyu making the $40 salmon reasonable; real-estate agents showing an overpriced house first.
- BEFORE: protection plan on its own page, $50/month, "No thanks".
- AFTER: "Order Review" screen, MacBook Pro 14" $1,899 on top, "RECOMMENDED FOR YOU" protection card below: "$49/month, Just 2.6%", blue "Add" button.
- Lever: never show an add-on price in isolation; attach it to the larger committed price and express it as a relative label.

## Apps/products shown in frames
LinkedIn (profile-strength levels), Duolingo (pre-signup onboarding + post-investment contacts permission), Mobbin (sponsor; also a "Believe" app onboarding card), WeTransfer Pro (signup wall example), Forest (onboarding example), Spotify / Notion / Costco (named in narration), Vercel pricing page (inside the uxpeak+ sponsor segment), a Bolt-style ride list and a fitness "Generate template" screen (smart-defaults examples, "Most common" preselected).

## Claim-check (verified 2026-07-07 by an 8-agent skeptic fleet, one claim each; verdicts below are what WE may cite)

1. **Jam study (3% vs 30%) , PARTIALLY SUPPORTED.** The 2000 Iyengar/Lepper numbers are real (3% vs ~31% of stoppers), but choice overload is NOT a general law: Scheibehenne et al. 2010 meta-analysis (50 experiments) found a mean effect of ~zero and the jam study failed direct replication. Overload appears only under moderators: high complexity, no clearly-best option, time pressure, novice choosers. Cite the moderators, never the headline percentages. [Meta-analysis](https://academic.oup.com/jcr/article-abstract/37/3/409/1827647)
2. **"70-90% never change defaults" , PARTIALLY SUPPORTED, number unsourced.** Real anchors: Spool/UIE 2011 informal Word-settings survey (>95% changed nothing; non-peer-reviewed) and Johnson/Goldstein Science 2003 organ-donation defaults (42% opt-in vs ~80% opt-out). Default inertia is directionally strong but the 70-90% figure has no verified source and users DO override defaults they care about (browser choice-screen data). Use as directional support for sane defaults only. [Spool](https://archive.uie.com/brainsparks/2011/09/14/do-users-change-their-settings/)
3. **Car-wash endowed progress (~2x) , PARTIALLY SUPPORTED.** Nunes & Dreze 2006 (one car wash, n=300): 19% vs 34% redemption = ~1.8x. Mechanism corroborated by Kivetz et al. 2006 (n=948 coffee cards, faster completion near goal), but the 19/34 numbers were never independently replicated. Treat as a real mechanism with unguaranteed effect size. [Paper](https://academic.oup.com/jcr/article-abstract/32/4/504/1787425)
4. **Free samples "+2,000%" , REFUTED.** No traceable source. Real documented lifts: ~71% (beer) to ~600% (pizza) same-day in Costco/CDS campaign data; PromoWorks/Knowledge Networks 2009: +475% same-day for new products decaying to +57-74% at 20 weeks. Cite qualitatively: sampling reliably lifts short-term purchases, magnitude category-dependent. Never write 2,000%. [Journal of Retailing coverage](https://www.sciencedaily.com/releases/2017/11/171127105952.htm)
5. **Loss aversion "2x" , PARTIALLY SUPPORTED.** The 2.25 lambda came from 25 grad students (TK 1992, median). Best modern meta-analysis (Brown et al., 607 estimates): pooled ~1.955, but method-clean reanalyses get as low as 1.31, and the effect weakens or disappears at small stakes (under ~USD 20-40). Use loss-framing directionally, never as a fixed multiplier, and not for trivial-stakes copy. [Meta-analysis](https://economics.appstate.edu/sites/default/files/loss_aversion_meta-analysis_1.pdf)
6. **IKEA effect (Norton/Mochon/Ariely 2012) , PARTIALLY SUPPORTED.** Citation correct; famous "63%"/"5x" retellings are relative ratios on sub-dollar items (boxes $0.48 vs $0.78, n=52; origami $0.05 vs $0.23, n=106). Meta-analytic effect d~0.57 across 55 studies; requires successful COMPLETION, and people still prefer buying pre-assembled. Real but moderate; design implication (invest-then-own onboarding) stands with tempered expectations. [Paper](https://www.hbs.edu/ris/Publication%20Files/11-091.pdf)
7. **Duolingo delayed signup , PARTIALLY SUPPORTED, single self-reported case.** The "+20% DAU" traces to one 2017 First Round interview with Gina Gotthilf (plus "+8.2%" for the soft-wall button change); no methodology, no external audit; every blog repeats the same interview. Treat as a directional pattern to A/B on our own funnel, never as a transferable percentage. [Interview](https://review.firstround.com/the-tenets-of-a-b-testing-from-duolingos-master-growth-hacker/)
8. **Relative add-on price framing ("just 2.6%") , PARTIALLY SUPPORTED with a backfire edge.** "2.6%" itself is an invented example. Real base: partitioned-pricing literature (Greenleaf et al. 2016 review; Morwitz et al. 1998; Sheng/Bao/Pan 2007): percentage framing raises attach-rate ONLY when the add-on is genuinely a small fraction and feels fair; it backfires on trust when the charge is large, obscured, or the seller is low-trust. If used: keep the absolute price visible next to the relative label. [Review](https://marketing.wharton.upenn.edu/wp-content/uploads/2024/05/Morwitz-Vicki-Wroe-Alderson-PAPER-JCP-2016.pdf)

Net: the video's six MECHANISMS are all real; four of its seven headline numbers are inflated, unsourced, or boundary-conditioned. Our design law must encode the mechanisms + boundary conditions, not the YouTube numbers.
