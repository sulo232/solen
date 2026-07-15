# Taste rationale ROUND 2: reference-driven expansion (owner 2026-07-16)

Owner message (dictated): fix + commit; expand RATIONALE.md with the og round-1 digest + a round-2 digest from another AI; give an opinion on it; capture ~30 X reference links with the ss/spec pipeline (never eyeball); run opus sub-agents for more ideas; build mockups that apply the references to real Solen surfaces WITH the liked-aspect forks named (because "u might grasp the wrong part of the refference"); think how to integrate and show it in the mockups.

## Atomic boxes

- [x] Fix the parked calendar range copy ("13. bis 19. Juli" per approved panel) , verified: commit 06ea0b14b, line 857
- [x] Fix the empty staff-name fallback after "Mitarbeiter:" , verified: commit 06ea0b14b, existing calendarPage.anyStaff key reused, all 4 locales confirmed present
- [ ] Download all 30 X references (fxtwitter API, media + manifest, failures logged)
  - [ ] verify count fetched vs 30, log every failure by name
- [ ] Run the spec-extraction (pixel-spec-auto extract.py) over the captured stills
- [ ] Analysis agents read every reference (waves of 4 max, structured output: what it shows, candidate liked-aspects as FORKS, Solen surface it could apply to)
- [ ] Opus sub-agents (judgment-class, 2 judges) on "what else belongs in the rationale/taste layer" on top of round 1 + round 2 + the references
- [ ] My own opinion on the round-2 digest delivered to the owner (with at least one concrete failure mode, no yes-manning)
- [ ] Expand RATIONALE.md with round-2 material, no duplication:
  - [ ] Domain 0: epistemic stance (Polanyi lossy externalization, Hume true-judge, repertory grid as the Taste Lab mechanism; COMPACT, not an essay)
  - [ ] Domain: cognition + signifiers (Norman signifiers, gulfs, cognitive load, information scent, progressive disclosure, memory effects with replication flags, ego depletion DEAD)
  - [ ] Domain: depth/light/materiality (light-from-above prior, key+ambient two-layer mapping to our elevation stacks, positive-polarity advantage T1, flat-design signifier cost NN/g 22/25 numbers, translucency legibility caveat)
  - [ ] Domain 2 extension: token architecture (3-tier, Radix 12-step job map, semantic naming, i18n hue boundary note)
  - [ ] Domain: states + feedback mechanics (focus-visible distinction, disabled-button argument vs our opacity-50 lock = TENSION for probe, validation timing, skeleton nuance flag, progress-bar perception Harrison 2010, labor illusion cross-ref to PSYCHOLOGY.md)
  - [ ] Domain: forms (top-aligned labels + Penzo caveat + Das null replication, single column, autocomplete/inputmode, placeholder-as-label ban mechanics)
  - [ ] Domain: icons (24/20 grid + keylines, optical volume, icon+label NN/g, ISO 9186 flag)
  - [ ] Domain: data display (Cleveland-McGill ranking + Heer-Bostock replication, bars-start-at-zero / line-truncation rule, data-ink, table alignment mechanics, zebra-striping marginal flag)
  - [ ] Domain 4 extension: typographic craft (punctuation incl. the DELIBERATE em-dash-ban departure, widows/text-wrap, font-display/CLS, variable-font opsz/GRAD, system-stack tradeoff)
  - [ ] Domain: composition vocabulary + Swiss style heritage (rule-of-thirds folklore flag)
  - [ ] Domain: voice/tone mechanics (NN/g 4 dimensions, voice-constant-tone-variable, no-dead-ends, Aaker; cross-ref LOCKFILE brand voice)
  - [ ] Domain: ethics as taste (Brignull taxonomy, DSA Art. 25, CPRA; cross-ref PSYCHOLOGY.md hard lines, no duplication)
  - [ ] Domain 9 extension: sourced expansion buckets (W3C/IBM by string length), Swiss 1'000 grouping mechanic (locale-native via de-CH), RTL/CJK boundary notes
  - [ ] Folklore table additions: 10,000-hour rule, 3-click rule, 8-second attention span, rule of thirds, ego depletion, Doherty dramatization already present
  - [ ] Entry template: add the BOUNDARY/reversal-condition field (round-2's four-part test)
- [ ] Build the reference mockup page (public/_mockups/taste-refs/) , per-theme probes: reference still + named fork branches (A/B what you might have liked) + the treatment applied to a COPY of the real Solen surface; resurrection-gate signatures respected
- [ ] TASTE_LOG + WORKLOG entries, plan boxes ticked, commits per verified chunk
- [ ] Close with clickable tunnel links (mockup page + anything else visual)

## Parked / boundaries
- Web dark mode stays graveyarded (exists-check hit); positive-polarity mechanics recorded for MOBILE dark mode only.
- Merge chip task_c132841a, payment capture chip task_400fe4c2, R1/R2/R4 post-merge: unchanged, owner-gated.
- Round-2 digest figures the digest itself flags as needing primary-source checks stay flagged "assume (digest)" in RATIONALE.md, not asserted.
