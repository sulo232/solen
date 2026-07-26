# Workstream 42 , IMPLEMENT the missing principles (owner approved 2026-07-26)

**Owner ask, verbatim:** "ye approved and I'm gonna improve everything, and you can have pull
control over everything except, like, big design changes. Like, ask me about that, but the mock up
is approved that you made. And also, like, I want you to implement as much as possible. I don't
want these to be just ignored... I'm implementing, like, almost all of it. I didn't really read all
of it, but you can decide what should be included or not because you already know a little bit
what I think... But what I do NOT want you to do is say, oh, I'm gonna implement this later because
we're not in this scale here. Some shit like that, some bullshit. I don't want that."

**Standing authority granted:** full control on everything EXCEPT a big design change, which I ask
first. The SalonCard imagery mockup is APPROVED, so the photo change is not a fork any more.

**The banned move:** deferring on scale. "Premature at 28 salons" is dead as a reason in this
workstream. If something genuinely cannot be done here, it gets a NAMED blocker (a credential, an
owner decision, an external system), never a scale excuse. `scale-excuse-gate.py` is already wired
and enforces exactly this.

**This supersedes judge 2's absorption cap of 12 to 18 for this workstream.** That was advice given
without the owner in the room; the owner's live literal ask outranks it (precedence chain 1). Judge
2's cuts still stand for the items it proved WRONG, ALREADY COVERED or REJECTED, because those are
correctness findings, not appetite findings.

## Premortem (gate 3, run before any dispatch)

Top concrete risks:
1. **Agents break the build on real product code.** Mitigation: every batch runs `npx tsc --noEmit`
   before it reports done; loop-reviewer grades against a written checklist; one commit per fix so a
   bad one is revertible alone.
2. **CSP takes the site down** (Stripe, Mapbox, PostHog, Google fonts, Supabase). Mitigation:
   `Content-Security-Policy-Report-Only` ONLY. Never the enforcing header in this workstream.
3. **The SalonCard photo change gets reverted by a future session** reading the A3 lock comment.
   Mitigation: the comment itself is rewritten and a dated TASTE_LOG entry lands in the same commit.
4. **Touching 35 sendEmail call sites regresses booking mail.** Mitigation: change ONLY the locale
   argument, prove with a before/after grep count, tsc.
5. **A "fix" is a silent no-op** (the estate's own number one failure). Mitigation: every data-path
   item ships a discriminate proof, not a render proof.

Load-bearing unknowns and the cheapest probe:
- Does the dev server still compile after each batch? Probe: `npx tsc --noEmit`, run per batch.
- Does the CSP report-only header break anything? Probe: load 3 routes, read the console.
- Do the 20 cover_photo_url values actually render at card size? Probe: the rendered city page.

Explicitly OUT of scope: anything requiring the owner's own shell or credentials, anything on the
remote, and the enforcing CSP header.

## Batch A , correctness and safety, no design impact (I own these outright)

**DISPOSITION of every unticked A box: IN FLIGHT, not skipped.** They are executing right now in
workflow `wf_3a35e42b-1ac` (14 implementation agents across 4 waves, then a read-only reviewer).
Live evidence as of this write: agents last wrote at 23:57, commit `6c468d458` already landed A3,
and the harness auto-checkpoint `9ddc076a9` captured in-progress A1/A2/A10 work across
`app/layout.tsx`, `app/[locale]/layout.tsx`, `middleware.ts`, the four `messages/*.json` and
`lib/format.ts`. Each box gets ticked with its own commit sha and measured proof when its agent
returns; none is ticked from this narrative.

- [ ] A1. `<html lang>` reads the active locale instead of hardcoded `de`
- [ ] A2. The skip link stops being hardcoded German on en/fr/it
- [ ] A3. Viewport stops disabling pinch zoom (`userScalable:false`, `maximumScale:1` removed)
- [ ] A4. One shared JSON-LD escape helper, applied at every `dangerouslySetInnerHTML` JSON site
- [ ] A5. `Content-Security-Policy-Report-Only` added to netlify.toml with the real allowlist
- [ ] A6. `addressLocality` stops being hardcoded "Basel" for every salon
- [ ] A7. City x category pages: SEO head tags
  - [ ] A7a. `rel=canonical` emitted
  - [ ] A7b. `rel=alternate hreflang` emitted for all four locales
  - [ ] A7c. `hreflang="x-default"` emitted
- [ ] A8. Category FAQ copy stops being German-only under all four locales
- [ ] A9. Every `sendEmail` call site passes the recipient's locale instead of defaulting to `de`
- [ ] A10. `de-CH` literals route through `lib/format` (116 literals, 91 toLocale call sites)
- [ ] A11. Cron health alerts on a cron that NEVER RAN, not only one that ran and failed
- [ ] A12. Stripe webhook signature and claim failures reach the alert path, not only console.error
- [ ] A13. `account_warnings` gets a reader so the ToS strike consequence can fire
- [ ] A14. Phone verification persists, or the ToS claim is removed. No third option.
- [ ] A15. Uploads: magic-byte check, EXIF and GPS stripping, multipart CSRF defence
- [ ] A16. The amenity-fabrication migration is neutralised so a replay cannot invent wheelchair access
- [ ] A17. One money representation written as law, with the mixed columns named

## Batch B , the APPROVED design change (mockup signed off, no further asking)

**DISPOSITION: IN FLIGHT** in workflow `wf_222d14bb-84d` (one builder, then an independent verifier
that re-measures the rendered page rather than trusting the builder's numbers). Agent last wrote at
23:57. Not parallelised, because parallel agents on frontend work is banned in this estate.

- [ ] B1. SalonCard renders `cover_photo_url` in the 5:4 slot
- [ ] B2. The A3 lock comment is rewritten to record the 2026-07-26 supersession
- [ ] B3. `TASTE_LOG.md` gets the dated entry so no session reverts it
- [ ] B4. All-caps comes off the card name, the category pills and the city eyebrow
- [ ] B5. The city page's font sizes collapse from 6 to 4
- [ ] B6. Re-measure the rendered page against the floors and record the numbers

## Batch C , the law layer (process, not product)

- [x] C1. DONE, commit 47a34e84a. verified: `~/.claude/hooks/system-health-check.py:522` defines
      `check_law_claims()`, wired at `:591` (build_report), `:625` (total_violations), `:700`
      (print_full_report section 8), `:741` (worst_items) and `:757` (the SessionStart counts line).
      Live output, run this turn: `python3 ~/.claude/hooks/system-health-check.py --report` prints
      "8. LAW CLAIMS ... count: 0" now, and printed count 2 before the gates were armed, naming
      `~/Documents/solen/CLAUDE.md:67` and `~/Documents/solen/_design-system/REMOVED.md:99`.
      A law sentence that CLAIMS a hook enforces is now checked against the settings
      files. Built as invariant 8 inside `system-health-check.py` rather than a new hook, because
      LAW_SYSTEM section 6.2 says extend the existing gate rather than wire a second overlapping
      one, and invariant 1 already owns hook wiring. Only flags a line carrying a claim verb
      (gate / enforces / blocks / prevents / wired / armed), skips lines that are already honest
      ("not wired", "pending", "wire on Write/Edit when settings is writable"), and only for a hook
      that exists on disk. Found exactly the two real cases with zero false positives:
      CLAUDE.md:67 and REMOVED.md:99, both citing `no-decorative-image-gate.py`. Negative control
      5/5: white-only-web, reference-measure, cloudflare-link, link-verified and no-bash-handoff are
      all claimed in law AND wired, and none is flagged. Surfaces at SessionStart, ranked first in
      the worst-items line.
- [ ] C2. The migrations-are-history principle written where a session will meet it
- [ ] C3. `_backend-system/LAW.md` exists and freezes the decisions that already have a recommendation
- [ ] C4. The precedence chain gains a statutory and safety tier
- [ ] C5. `LAUNCH.md`: what must be true before the first real booking, and what becomes wrong that day
- [x] C6. DONE, commit 47a34e84a. verified: `grep -c` on `~/.claude/settings.json` returns 1 for
      each of the seven gate names; the four PreToolUse ones sit in the new
      `"matcher": "Write|Edit|MultiEdit"` group at `settings.json:1246`, the three Stop ones in the
      Stop group at `:487`. `~/.claude/hooks/SHELVED.txt:25` now carries `_nonsolen_surface.py` and
      `_nonsolen_surface_gatetest.py` with the reason. Live output, run this turn:
      "1. HOOK WIRING / orphaned hook files ...: 0" and "TOTAL VIOLATIONS: 9", against 9 orphans
      and 20 total before.
      All seven unwired gates armed, and the health check now reports ZERO orphans.
      Wired to their real events, read out of each file rather than guessed: PreToolUse on
      Write|Edit|MultiEdit for `no-decorative-image-gate`, `emphasis-budget-gate`, `no-italic-ui-gate`,
      `peer-list-ink-cta-gate`; Stop for `flag-instead-of-fix-gate`, `link-relevance-gate`,
      `paint-proof-gate`. Safety-tested before arming: each was run against this session's real
      transcript and all seven exited 0, so none false-blocks a normal turn. The two remaining
      "orphans" were not gates at all, `_nonsolen_surface.py` is a shared predicate imported by other
      project hooks and `_nonsolen_surface_gatetest.py` is its test harness, so they went into
      SHELVED.txt with that reason instead of being wired.
      Health check went 20 violations to 9: hook-wiring 9 to 0, law-claims 2 to 0. What is left is
      6 stale flags and 3 phantom strings, both report-only and both pre-existing.
      This also retires `wire-pending-gates.sh` and the arming script I wrote earlier: the sandbox
      cannot write these files from Bash, but the Edit and Write tools can, which is the thing I got
      wrong earlier in the session.

## Batch D , asks that need the OWNER, stated as concrete forks not vague punts

- [ ] D1. Focus indicator: you killed the ring three times. A keyboard user currently gets nothing.
      I will implement a NON-ring treatment and show it; you look and keep or kill it.
- [ ] D2. Salon photography is stock. Two salons share one image. Real photos are a content job
      only you can start.

## Unplanned additions

(none yet)
