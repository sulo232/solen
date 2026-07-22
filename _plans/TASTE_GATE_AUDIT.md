# TASTE_GATE_AUDIT , do the law files/gates themselves cause issues? (2026-07-21)

Owner: "what should we change in taste or design files n gates... we had so many issues and maybe causes
could lay there too; i like this title and underneath line when selected; dont change design/taste rules
without asking me; make me a mockup of this page with our taste and design rules applied."

- [x] Audit the taste/design files + gates for root causes of this session's failures
  - [x] collect the false positives that burned rounds this session (content-gate German-in-comments,
        resurrection-gate comment/var matches, contract-hue emoji-entity-as-hex, measure-first flag TTL)
  - [x] identify law gaps that let failures through (no on-phone base until today; type budget only
        gated in _mockups, not app code)
  - [x] OWNER DECIDED (2026-07-21): fix all 4 , APPLIED + self-tested block+pass (content-gate ignores
        multi-line HTML + trailing // comments; resurrection strips comments so signatures match RENDERED
        markup; hue scan skips HTML entities; measure-flag TTL 20 -> 60 min)
- [x] Title+underline selected treatment (owner likes it)
  - [x] check the conflict: design contract row "selected/active" locks calm-gray TabPill for every
        pill/chip/option; an ink underline TAB is a different affordance class, needs an owner-named yes
  - [x] OWNER DECIDED (2026-07-21): sanctioned for ALL content tabs , TASTE_LOG dated entry +
        CLAUDE.md contract row amended (tabs = ink underline; pills/chips stay TabPill gray)
- [x] _BASE blessed as LAW (TASTE_LOG entry + CLAUDE.md "mockup base" row); app-code fidelity gates
      QUEUED (approved) for when the real profile build starts
- [x] design-law-integrity-gate.py (owner 2026-07-21 "find duplication or contradiction before adding,
      auto-flag"): PreToolUse on every law-file write , blocks additions that duplicate an existing rule
      (token-overlap matcher) or contradict a pinned axis value (radius/px/hex/weight extraction);
      passes on `supersedes <name>` / `extends <name>` / `law-check-ok`. Self-tested 5/5, wired.
- [x] design-law-improve scheduled task (owner: "keep improving taste and design file even outside this
      session"): every Monday 10:00 , harvest the week's dated decisions into law, contradiction +
      duplication + staleness scans, safe fixes auto-committed, owner-decision list + max-5 proposed
      upgrades written to _plans/LAW_IMPROVE_<date>.md. Runs in future sessions independent of this one.
- [x] Mockup: this page WITH Solen taste + design rules applied (public/_mockups/pinterest-ref-solen/)
  - [x] type budget 4 sizes/2 weights, Inter-Tight stack, German product copy, 44px touch floor,
        16px page margin, filter-pill law, no fabricated data, no bare stars, real photos, _BASE rules
- [x] Registered in _plans/ACTIVE.md (row 18 updated)
