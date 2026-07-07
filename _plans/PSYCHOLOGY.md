# PSYCHOLOGY , UX-psychology research -> full audit -> design-system integration -> skill + hook

Started 2026-07-07. Owner ask (dictated): watch the uxpeak video ("The UX Psychology Behind Apps People Can't Stop Using", youtu.be/2TlIg3VokY8), then run research fleets (tens of Sonnet 5 / Haiku subagents per topic, internet research, one topic at a time) on: UI/UX user psychology, conversion, retention, business impact, plus the topics the video raises. Then a full audit of Solen against the findings. Then integrate with the design system (examples the owner gave: motion/animation speed, what we show, preselection). Also create a new skill + hook wiring ("a basis to improve off"), sibling to the fable-* skills.

## Atomic checkboxes

- [x] 1a video: metadata fetched (yt-dlp; uxpeak, 11:34, uploaded 2026-07-02)
- [x] 1b video: transcript extracted (auto-captions flattened, ~2115 words)
- [x] 1c video: 87 frames extracted (1 per 8s, 640px)
- [x] 1d video: analysis brief written (_design-system/research/VIDEO_UXPEAK_PSYCHOLOGY.md; transcript + all 87 frames read by delegated subagents; claim-check fleet dispatched)
- [x] 2a fleet: UI/UX user psychology DONE (20/20 researchers, 147 findings)
  - [x] 2a-i 20 researchers dispatched
  - [x] 2a-ii synthesis returned
  - [x] 2a-iii folded into _design-system/research/PSYCH_PSYCHOLOGY.md
- NOTE 2026-07-07: run wf_7d6fab6f-13a hit a server-side rate-limit storm mid-run (conversion 17-20, all retention, all business researchers failed with "server temporarily limiting"). Resuming same script with resumeFromRunId after cooldown; psychology + conversion 1-16 are cache hits. The empty-input business "synthesis" stub from the broken run is discarded.
- [x] 2b fleet: conversion DONE (20/20 researchers after resume, 147 findings)
  - [x] 2b-i 20 researchers dispatched
  - [x] 2b-ii synthesis returned
  - [x] 2b-iii folded into _design-system/research/PSYCH_CONVERSION.md
- [x] 2c fleet: retention DONE (20/20 researchers after resume, 143 findings)
  - [x] 2c-i 20 researchers dispatched
  - [x] 2c-ii synthesis returned
  - [x] 2c-iii folded into _design-system/research/PSYCH_RETENTION.md
- [x] 2d fleet: business impact DONE (20/20 researchers after resume, 149 findings)
  - [x] 2d-i 20 researchers dispatched
  - [x] 2d-ii synthesis returned
  - [x] 2d-iii folded into _design-system/research/PSYCH_BUSINESS_IMPACT.md
- [x] 2e fleet: video claim-check DONE (workflow wf_541a76c3-5d5)
  - [x] 2e-i 8 claim-checkers dispatched
  - [x] 2e-ii verdicts returned (1 refuted, 7 partially-supported with corrections)
  - [x] 2e-iii claim-check table filled in VIDEO_UXPEAK_PSYCHOLOGY.md
- [x] 2f research compendium written to _design-system/research/ (5 files: 4 topics + video brief; 586 raw findings total)
- [ ] 3a audit: per-surface psychology audit (home, search+map, salon PDP, booking flow, checkout/payment, auth/onboarding, Inspo, profile/loyalty, reviews, confirmation/queue, empty/error/loading states)
- [ ] 3b audit findings verified (file:line spot-check pass, separate verifier)
- [ ] 3c audit doc written to _audits/2026-07-07-psychology-audit.md
- [ ] 4a canonical _design-system/PSYCHOLOGY.md (principles -> Solen laws, cross-linked to LOCKFILE / SOURCE / MOTION / TASTE_LOG)
- [ ] 4b prioritized change list (motion timing, defaults/preselection, what we show) , visual changes queued as MOCKUP-FIRST candidates, NOT applied in this workstream
- [ ] 5a new skill (sibling of fable-*) holding the psychology basis
- [ ] 5b hook wiring so it auto-fires on design / conversion / retention work
- [ ] 5c-i hook self-test: one should-fire input passes
- [ ] 5c-ii hook self-test: one should-NOT-fire input stays silent
- [ ] 5d-i global CLAUDE.md rule-14 list gains the new skill
- [ ] 5d-ii memory entry written + MEMORY.md index line
- [ ] 6 commits per verified chunk; close by re-reading the original message

## Constraints honored
- Researcher/synthesis subagents: sonnet/haiku only (no opus, gate-enforced). Fan-out in waves of max 4 concurrent (rate-limit law in fable-execution).
- Exists-check ran 2026-07-07: "psychology" 0 hits, "conversion"/"retention" only unrelated DB column/function. No prior psych system to extend , this is net-new, integrating INTO the existing design-system docs.
- Visual changes stay mockup-first; this workstream produces the evidence base + candidates, not applied UI edits.

## Parked / notes
- /watch skill does not exist in this session (autopilot hook fired it; "Unknown command"). Done manually via yt-dlp + delegated frame/transcript reader. Candidate: build a real watch skill later.
