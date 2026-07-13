# FINISH-ALL push (owner "give me all of them", 2026-07-13)

Owner authorized resuming ALL remaining in-flight workstreams. Doable-now parts execute via background agents; browser-blocked (sandbox listen()) and sandbox-denied-write parts get flagged, not faked.

## Batch
- [ ] W9. Search-backend cleanup (#9): VERIFY SearchResults.tsx + /api/salons/search are truly dead (no live imports), then delete + add REMOVED.md graveyard lines. If either is still referenced, do NOT delete , report the reference. -> agent
- [ ] W19. Bundles + retail (#19, QUEUED): probe the live nail_retail_products constraint (out-of-band drift check), report its real shape, and PREPARE the additive migration + plan. STOP before applying any migration (owner-gated: never db push/reset; additive idempotent only). -> agent
- [ ] W13. Frontend audit (#13): apply the [code]-class honesty/a11y fixes that do NOT need a visual mockup (44px touch targets, remove any hardcoded/fake counts, dead-click/dead-route fixes, bare-star-without-count). The [mockup]-class VISUAL redesigns need a browser (sandbox-blocked) + owner sign-off -> PARK those with the list. Single frontend agent (no parallel-frontend). -> agent
- [ ] W17. Drift-gate patch (#17): the exact patch is already parked in DRIFT_GATE_PATCH_2026-07-11.md; target file .claude/skills/solen-drift-check/scripts/check.py is SANDBOX-DENIED in this worktree -> stays parked for a main-checkout session. Nothing to execute here.
- [ ] Z. Collect, verify each agent, commit writable, update ACTIVE rows, one report.

## Constraints carried into every brief
- No push. No em-dashes. English. Surgical.
- Route/file deletion -> verify dead first + REMOVED.md line (graveyard protocol).
- No prod DB migration applied autonomously (probe + prepare only).
- Sandbox: worktree .claude write-denied; dev server cannot bind (listen() EPERM) so no live render.
- Rule 18: if a "dead" file is actually live, or a plan premise is stale, STOP and report, do not force.
