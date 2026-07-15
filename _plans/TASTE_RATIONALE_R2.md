# Taste rationale ROUND 2: reference-driven expansion (owner 2026-07-16)

Owner message (dictated): fix + commit; expand RATIONALE.md with the og round-1 digest + a round-2 digest from another AI; give an opinion on it; capture ~30 X reference links with the ss/spec pipeline (never eyeball); run opus sub-agents for more ideas; build mockups that apply the references to real Solen surfaces WITH the liked-aspect forks named (because "u might grasp the wrong part of the refference"); think how to integrate and show it in the mockups.

## Atomic boxes

- [x] Fix the parked calendar range copy ("13. bis 19. Juli" per approved panel) , verified: commit 06ea0b14b, line 857
- [x] Fix the empty staff-name fallback after "Mitarbeiter:" , verified: commit 06ea0b14b, existing calendarPage.anyStaff key reused, all 4 locales confirmed present
- [x] Download all 30 X references , verified: 30/30 in manifest.json after curl retry pass (6 urllib IncompleteReads retried OK), 19 videos got 3 ffmpeg frames each
  - [x] count check , verified: public/_mockups/_assets/taste-refs/manifest.json "fetched": 30, "failed": [] (commit 733888b74)
- [x] Spec-extraction ran over all primary stills , verified: 31 outdirs; tier-1 card detection failed on every borderless portfolio render (expected per the trigger table), tier-2 inline PIL sampling by the analysis agents took over
- [x] Analysis agents read every reference , verified: 4 sonnet agents (one wave of 4), 30/30 refs with SHOWS/MEASURED/FORKS/SOLEN-MAP blocks + syntheses, persisted to research/TASTE_REFS_2026-07.md
- [x] Opus judges ran (2, generative lens + diagnostic lens) , verified: converged verdicts (stack is analytic-not-generative; floors are prose-not-computed), 9+10 ranked gaps recorded as RATIONALE.md section 28, kill-lists honored in the integration
- [x] Opinion delivered , verified: closing message of 2026-07-16 + the kill-list recorded in RATIONALE.md status header (commit 676c5553c) (kept: systems layers; cut: RTL/CJK, deep data-viz, ISO 9186; named failure mode: doc bloat, countered by the gates-over-prose build order)
- [x] Expand RATIONALE.md with round-2 material, no duplication , verified: commit with sections 16-28, all sub-items below in that diff:
  - [x] Domain 0: epistemic stance (Polanyi lossy externalization, Hume true-judge, repertory grid as the Taste Lab mechanism; COMPACT, not an essay) , verified: commit 676c5553c
  - [x] Domain: cognition + signifiers (Norman signifiers, gulfs, cognitive load, information scent, progressive disclosure, memory effects with replication flags, ego depletion DEAD) , verified: commit 676c5553c
  - [x] Domain: depth/light/materiality (light-from-above prior, key+ambient two-layer mapping to our elevation stacks, positive-polarity advantage T1, flat-design signifier cost NN/g 22/25 numbers, translucency legibility caveat) , verified: commit 676c5553c
  - [x] Domain 2 extension: token architecture (3-tier, Radix 12-step job map, semantic naming, i18n hue boundary note) , verified: commit 676c5553c
  - [x] Domain: states + feedback mechanics (focus-visible distinction, disabled-button argument vs our opacity-50 lock = TENSION for probe, validation timing, skeleton nuance flag, progress-bar perception Harrison 2010, labor illusion cross-ref to PSYCHOLOGY.md) , verified: commit 676c5553c
  - [x] Domain: forms (top-aligned labels + Penzo caveat + Das null replication, single column, autocomplete/inputmode, placeholder-as-label ban mechanics) , verified: commit 676c5553c
  - [x] Domain: icons (24/20 grid + keylines, optical volume, icon+label NN/g, ISO 9186 flag) , verified: commit 676c5553c
  - [x] Domain: data display (Cleveland-McGill ranking + Heer-Bostock replication, bars-start-at-zero / line-truncation rule, data-ink, table alignment mechanics, zebra-striping marginal flag) , verified: commit 676c5553c
  - [x] Domain 4 extension: typographic craft (punctuation incl. the DELIBERATE em-dash-ban departure, widows/text-wrap, font-display/CLS, variable-font opsz/GRAD, system-stack tradeoff) , verified: commit 676c5553c
  - [x] Domain: composition vocabulary + Swiss style heritage (rule-of-thirds folklore flag) , verified: commit 676c5553c
  - [x] Domain: voice/tone mechanics (NN/g 4 dimensions, voice-constant-tone-variable, no-dead-ends, Aaker; cross-ref LOCKFILE brand voice) , verified: commit 676c5553c
  - [x] Domain: ethics as taste (Brignull taxonomy, DSA Art. 25, CPRA; cross-ref PSYCHOLOGY.md hard lines, no duplication) , verified: commit 676c5553c
  - [x] Domain 9 extension: sourced expansion buckets (W3C/IBM by string length), Swiss 1'000 grouping mechanic (locale-native via de-CH), RTL/CJK boundary notes , verified: commit 676c5553c
  - [x] Folklore table additions: 10,000-hour rule, 3-click rule, 8-second attention span, rule of thirds, ego depletion, Doherty dramatization already present , verified: commit 676c5553c
  - [x] Entry template: add the BOUNDARY/reversal-condition field (round-2's four-part test) , verified: commit 676c5553c
- [x] Build the reference mockup page , verified: public/_mockups/taste-refs/index.html committed, rendered proof 31/31 images + 17 probes + 5 conflict cards (public/_mockups/taste-refs/) , per-theme probes: reference still + named fork branches (A/B what you might have liked) + the treatment applied to a COPY of the real Solen surface; resurrection-gate signatures respected
- [x] WORKLOG entry + plan boxes ticked + per-chunk commits (TASTE_LOG waits for the owner's picks, elicitation is open, no settled decision to log yet)
- [x] Closed with clickable tunnel links (probe page + rationale summary in the final message)

## Parked / boundaries
- Web dark mode stays graveyarded (exists-check hit); positive-polarity mechanics recorded for MOBILE dark mode only.
- Merge chip task_c132841a, payment capture chip task_400fe4c2, R1/R2/R4 post-merge: unchanged, owner-gated.
- Round-2 digest figures the digest itself flags as needing primary-source checks stay flagged "assume (digest)" in RATIONALE.md, not asserted.
