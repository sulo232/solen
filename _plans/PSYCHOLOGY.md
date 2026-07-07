# PSYCHOLOGY , UX-psychology research -> full audit -> design-system integration -> skill + hook

Started 2026-07-07. Owner ask (dictated): watch the uxpeak video ("The UX Psychology Behind Apps People Can't Stop Using", youtu.be/2TlIg3VokY8), then run research fleets (tens of Sonnet 5 / Haiku subagents per topic, internet research, one topic at a time) on: UI/UX user psychology, conversion, retention, business impact, plus the topics the video raises. Then a full audit of Solen against the findings. Then integrate with the design system (examples the owner gave: motion/animation speed, what we show, preselection). Also create a new skill + hook wiring ("a basis to improve off"), sibling to the fable-* skills.

## Atomic checkboxes

- [x] 1a video: metadata fetched (yt-dlp; uxpeak, 11:34, uploaded 2026-07-02)
- [x] 1b video: transcript extracted (auto-captions flattened, ~2115 words)
- [x] 1c video: 87 frames extracted (1 per 8s, 640px)
- [ ] 1d video: delegated sonnet analysis brief (principles + before/afters + research subtopics)
- [ ] 2a fleet: UI/UX user psychology (20 researchers + synthesis)
- [ ] 2b fleet: conversion (20 researchers + synthesis)
- [ ] 2c fleet: retention (20 researchers + synthesis)
- [ ] 2d fleet: business impact (20 researchers + synthesis)
- [ ] 2e fleet: video-raised subtopics (researchers + synthesis)
- [ ] 2f research compendium written to _design-system/research/
- [ ] 3a audit: per-surface psychology audit (home, search+map, salon PDP, booking flow, checkout/payment, auth/onboarding, Inspo, profile/loyalty, reviews, confirmation/queue, empty/error/loading states)
- [ ] 3b audit findings verified (file:line spot-check pass, separate verifier)
- [ ] 3c audit doc written to _audits/2026-07-07-psychology-audit.md
- [ ] 4a canonical _design-system/PSYCHOLOGY.md (principles -> Solen laws, cross-linked to LOCKFILE / SOURCE / MOTION / TASTE_LOG)
- [ ] 4b prioritized change list (motion timing, defaults/preselection, what we show) , visual changes queued as MOCKUP-FIRST candidates, NOT applied in this workstream
- [ ] 5a new skill (sibling of fable-*) holding the psychology basis
- [ ] 5b hook wiring so it auto-fires on design / conversion / retention work
- [ ] 5c self-test the hook: one should-fire input + one should-not (rule 12.5)
- [ ] 5d rule-14 / autopilot listing updated + memory entry
- [ ] 6 commits per verified chunk; close by re-reading the original message

## Constraints honored
- Researcher/synthesis subagents: sonnet/haiku only (no opus, gate-enforced). Fan-out in waves of max 4 concurrent (rate-limit law in fable-execution).
- Exists-check ran 2026-07-07: "psychology" 0 hits, "conversion"/"retention" only unrelated DB column/function. No prior psych system to extend , this is net-new, integrating INTO the existing design-system docs.
- Visual changes stay mockup-first; this workstream produces the evidence base + candidates, not applied UI edits.

## Parked / notes
- /watch skill does not exist in this session (autopilot hook fired it; "Unknown command"). Done manually via yt-dlp + delegated frame/transcript reader. Candidate: build a real watch skill later.
