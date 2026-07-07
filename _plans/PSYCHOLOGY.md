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
- [x] 3a audit: per-surface psychology audit DONE (workflow wf_2563f4ec-42b, resumed past a session-limit stall; 12/12 surfaces, 116 raw findings)
- [x] 3b audit findings verified DONE (separate read-only verifier pass, all 12 surfaces; 113 kept as confirmed/wrong-line, 3 dropped as not-real/duplicate-of-law)
- [x] 3c audit doc written to _design-system/research/PSYCH_AUDIT_2026-07-07.md (rerouted from gitignored _audits/; committed). 20 high-severity items.
- [x] 4a canonical _design-system/PSYCHOLOGY.md WRITTEN + committed 3c43d9623 (15 evidence-tiered laws, hard lines, myth table, improve loop; cross-links to LOCKFILE/SOURCE/MOTION/TASTE_LOG semantics stated in header)
- [x] 4b prioritized change list DONE: _design-system/research/AUDIT_CHANGELIST_2026-07-07.md (77 actionable: 40 [code], 37 [mockup-first]), grouped by the owner's three lenses (what-we-show / defaults+preselection / motion-timing) + rest. NOTHING applied , queued only, visual items stay mockup-first.
- [x] 5a new skill: ~/.claude/skills/fable-psychology/SKILL.md (router over _design-system/PSYCHOLOGY.md; registered, visible in skill list)
- [x] 5b hook wiring: `psychology` category added to fable-skill-trigger.py (keywords: conversion/retention/churn/engagement/loyalty/defaults/urgency/social proof/notifications/... EN+DE)
- [x] 5c-i hook self-test PASS: "improve retention on the confirmation screen so people rebook" fires fable-psychology (+frontend)
- [x] 5c-ii hook self-test PASS: "rename the README heading and correct the typo" stays fully silent
- [x] 5d-i global CLAUDE.md rule 14 updated (five skills, new bullet)
- [x] 5d-ii memory: project_psychology_system.md written, project_fable_skills.md updated to five, MEMORY.md index line added
- [x] 6 commits per verified chunk (plan/video/claim-check/4 compendia/PSYCHOLOGY.md/skill+hook/audit+changelist); closed by re-reading the original dictated message.

## Enforcement follow-on (2026-07-07, owner: "AIs take suggestions but wont do it acc or forget as contexts pack up")
Turned the checkable laws from advice into runtime enforcement, because docs/skills get forgotten as context packs (proven: the audit found the SAME bare-rating miss on 5 surfaces despite law 6 being written down).
- [x] E1 gate `.claude/hooks/pre-edit-psychology-gate.py` , PreToolUse Edit/Write/MultiEdit, BLOCKS net-new law-6 (rating without count) + law-9 (hardcoded count literal like "14 Salons"). Net-new only, scoped to app/components tsx, fail-open, `psych-ok:`/skip-flag escapes.
- [x] E2 self-tested 13 cases before wiring (rule 12.5): P1a/P1b/P2 block + pass, net-new allow (size change on already-bare), 14->15 allow, .ts scope, mockup scope, escape, decorative-star, singular "1 Salon", multiline, MultiEdit, malformed-JSON fail-open, skip-flag. All correct.
- [x] E3 registered in .claude/settings.json (Edit + Write + MultiEdit).
- [x] E4 loop-reviewer.md (global) gained a standing psychology lens for the UN-gateable judgment laws (peak-end, never-start-at-zero, guest-first, comparability, effort-over-delight, loss-framing), conditional on _design-system/PSYCHOLOGY.md existing.
- [x] E5 documented: PSYCHOLOGY.md Enforcement section, fable-psychology skill, memory project_psychology_system.md.

## Constraints honored
- Researcher/synthesis subagents: sonnet/haiku only (no opus, gate-enforced). Fan-out in waves of max 4 concurrent (rate-limit law in fable-execution).
- Exists-check ran 2026-07-07: "psychology" 0 hits, "conversion"/"retention" only unrelated DB column/function. No prior psych system to extend , this is net-new, integrating INTO the existing design-system docs.
- Visual changes stay mockup-first; this workstream produces the evidence base + candidates, not applied UI edits.

## Parked / notes
- /watch skill does not exist in this session (autopilot hook fired it; "Unknown command"). Done manually via yt-dlp + delegated frame/transcript reader. Candidate: build a real watch skill later.
