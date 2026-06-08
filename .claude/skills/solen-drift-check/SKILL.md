---
name: solen-drift-check
description: Audits Solen frontend code for drift from the locked design system. Catches hardcoded hex colors, arbitrary Tailwind values, non-canonical durations/easings, retired-but-defined token usage, and dead-click contract violations (onClick={() => {}}, href="#", buttons without handlers). Logs everything to a structured markdown report and never halts in report mode; the `--gate-stdin` gate mode (V3-D441) blocks net-new drift in a PreToolUse hook. Respects `_design-system/_rebuilt_routes.json` so legacy un-rebuilt routes don't drown signal.
---

# Solen Drift Check

This skill audits the codebase against the canonical design system in
[`_design-system/SOURCE.md`](../../../_design-system/SOURCE.md). The default report mode is a
**logger, not a gate**: it produces a structured report and exits 0 even when drift is found, and
the human reviewer decides what to act on. The ONE exception is `--gate-stdin` mode (V3-D441), the
PreToolUse drift gate (`.claude/hooks/pre-edit-drift-gate.sh`), which reads an incoming Edit/Write
diff and exits 2 to BLOCK net-new hard drift before it lands. See "Gate mode" below.

## When to invoke

- User asks for a "drift check" / "design system audit" / "what's drifting from SOURCE.md"
- After completing a route rebuild — verify the new code is clean against SOURCE
- Before adding a route to `_design-system/_rebuilt_routes.json` (enforcement allowlist)
- As pre-flight before a refactor pass on legacy code

## Don't invoke when

- User asks for a runtime check of dead clicks (e.g. "does this button actually work?") — that's
  Playwright territory, not static analysis. This skill can catch `onClick={() => {}}` but
  cannot catch `salonId={salon?.id}` passing undefined at runtime.
- User wants TypeScript checking — `tsc --noEmit` is the right tool.
- User wants linting — ESLint covers what this skill explicitly does NOT (code quality,
  hooks rules, etc.).

## What it catches

### Category A — Token drift

| Rule | What it flags |
|---|---|
| **A1**: Hardcoded hex outside SOURCE.md allowlist | `#16A34A`, `#FFC32B`, etc. in tsx/css when the token name should be used |
| **A2**: Arbitrary Tailwind values | `text-[18px]`, `bg-[#16A34A]`, `rounded-[22px]` when a token exists |
| **A3**: Non-canonical durations | `duration-[120ms]` or `duration-100` when SOURCE.md canon is 80/150/200/250/300/500 |
| **A4**: Non-canonical easings | `ease-out-strong`, `ease-out-warm` etc. — only canonical 4 allowed (`snap`/`spring`/`glide`/`thud`) |
| **A5**: Retired-but-defined token usage | `s-coral`, `s-cream`, `s-cat-*`, etc. — defined for back-compat, but new code is drift |

### Category B — Clickable Surface Contract violations

| Rule | What it flags |
|---|---|
| **B1**: Dead handlers | `onClick={() => {}}` , `onClick={()=>{}}` |
| **B2**: Dead hrefs | `href=""`, `href="#"`, `href={'#'}` |
| **B3**: 404 routes | `<Link href="/foo">` where `/foo` has no `page.tsx` |
| **B4**: Buttonless buttons | `<button>` with no `onClick`, no `type`, not inside a `<form>` |

### Category C — Migration coexistence

The checker respects `_design-system/_rebuilt_routes.json` (allowlist of file globs).

- Files matched by the allowlist get **strict** scrutiny — all A + B rules apply, drift counts.
- Files NOT matched get **informational** scrutiny — same rules run, but findings go to a
  separate `pending-migration.md` so they don't drown the active signal.

## What it explicitly DOESN'T catch (drop-claims)

- **Data-aware dead clicks** — `salonId={salon?.id}` where `salon` is `null` at runtime.
  Static analysis cannot determine runtime null-ness. Playwright probe covers this separately.
- **Visual / pixel drift** — the screenshot is the ground truth for visual check, not this skill.
- **i18n hardcoded strings** — flagged by the AST is fragile (false positives on legitimate
  hardcoded text like `"%"` or `"·"`). Use a regex sweep separately.

## Invocation

### Report mode (default, logger)

```bash
python3 .claude/skills/solen-drift-check/scripts/check.py [--strict-only] [--out REPORT.md]
```

- `--strict-only` only scans files in `_design-system/_rebuilt_routes.json`. Skip legacy.
- `--out REPORT.md` writes the report to the given path. Defaults to `_design-system/_drift-report.md`.

Report-mode exit code is **always 0**, even with findings. The presence of `findings_count > 0`
in the report is the signal to act, not the exit code.

### Gate mode (`--gate-stdin`, blocking, V3-D441)

```bash
echo '{"file_path":"app/x.tsx","new":"<incoming content>","old":"<prior content>"}' \
  | python3 .claude/skills/solen-drift-check/scripts/check.py --gate-stdin
```

Reads JSON `{file_path, new, old?}` from stdin and exits **2** when `new` introduces a NET-NEW hard
finding (A1-A6 / B1-B5) versus `old`, else **0**. Net-new is per-rule by count, so editing around
pre-existing drift never trips it (strict scope already carries ~1k legacy findings). INFO rules
(A7-A14) never gate. Lines containing `drift-ok` are skipped (per-line escape hatch).

This mode powers the PreToolUse hook `.claude/hooks/pre-edit-drift-gate.sh`, which runs the gate on
every Edit/Write to a design-surface file (`app|components|components-legacy` `*.tsx`/`*.css`) and
blocks the tool when it would add drift. Bypass: a `drift-ok:` line comment, `touch
.claude/drift-gate-skip.flag` (30-min TTL), or `export SOLEN_DRIFT_GATE=0`. Fail-open on any error.

## Output structure

```markdown
# Drift Report — {date}

## Summary
- Strict scope: N files scanned, X findings
- Informational scope: M files scanned, Y findings (logged to pending-migration.md)

## Findings (strict scope)
### file:line — RULE_ID
Snippet of offending code.
Recommendation: ...

## Files passing clean
- path/to/file.tsx
- path/to/other.tsx
```

## Maintenance

When SOURCE.md changes (new canonical token, new retired token, etc.):

1. Update the relevant constant block in `scripts/check.py` (`LIVE_TOKENS`, `RETIRED_TOKENS`,
   `CANONICAL_DURATIONS`, `CANONICAL_EASINGS`).
2. Re-run the checker on a known-clean file (e.g. `app/[locale]/_components/homepage/SalonCard.tsx`)
   to confirm no false positives from the update.
3. Bump the SOURCE.md `Last updated` line for traceability.

## Architecture notes

- **Pure Python**, stdlib only (`re`, `pathlib`, `json`, `argparse`). No deps, no AST parsing.
- **Regex-based**, not AST-based. Trade-off: fast + simple, but can't catch JSX-aware patterns
  (e.g. `<button>{children}</button>` without onClick is harder than `<button>foo</button>`).
- Run from project root. Reads relative paths.
- Output is markdown — `_design-system/_drift-report.md` is gitignored (or should be).

## See also

- [SOURCE.md](../../../_design-system/SOURCE.md) — canonical token list
- [QUESTIONS.md Q2 / Q3](../../../_design-system/QUESTIONS.md) — pending decisions for retired
  tokens (when to delete from config)
- [QUESTIONS.md Q8](../../../_design-system/QUESTIONS.md#q8) — migration policy
