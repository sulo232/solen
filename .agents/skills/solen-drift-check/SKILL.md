---
name: solen-drift-check
description: Run an explicitly targeted, report-only static scan for Solen token, clickable-surface, hardcode, and debug candidates. Use for named files or directories; use full-estate mode only for an explicit audit.
---
# Solen drift check
Use this scanner to produce review candidates from explicit task targets. It reports only, does not contact a network service, and writes only when `--out` explicitly names a report path.

Run `scripts/check.py` from this skill directory with `--root <project-root>` and one or more `--target <file-or-directory>` paths. Use `--full-estate` only when the user explicitly requests an estate audit. `--out <path>` must name a new file within the root whose parent already exists; existing files and symlinks are refused. Otherwise the report goes to stdout. An unsupported explicit file refuses. Unsupported descendants of an explicit directory are skipped and counted. Invalid, unreadable, or out-of-root targets refuse without output writes.

The scanner reports candidates, never a broad clean claim. A1 through A26 cover token, type, imagery, interaction, and design-surface syntax, including informational A2, A3, and A7 through A14 plus both A23 checks. B1, B2, and B5 cover empty handlers, dead hrefs, and category-specific branches. C/D run only on runtime application TS/TSX code and exclude generated, test, mock, story, seed, fixture, tooling, and mockup paths. C2 is limited to Supabase project hosts, `solen.ch`, and `localhost:PORT`; C3 is v4 UUIDs only; C5 is same-line JSX/display props and a local translation fragment does not suppress another literal on that line; C6 is machine-local paths; C7 is narrow monetary fields or CHF; D1 preserves `console.error` and `console.warn`; D2 needs three code-shaped comments.

Review findings with the applicable current design owner, `council-hardcode`, or `fable-backend`. Static absence does not establish runtime behavior, rendered fidelity, localization, portability, security, or clean coverage.
