#!/usr/bin/env python3
"""PreToolUse gate: block a new/edited mutating route that reads req.json() with no
zod validation anywhere in the file (input-abuse-07).

_rules/SECURITY_RULES.md Rule S4/S5 says every mutating route (POST/PATCH/PUT/DELETE)
validates its parsed body with a zod schema before reading any field. A route that
calls req.json()/request.json() and does neither validateBody(schema, body) from
lib/validations.ts NOR a raw schema.parse()/schema.safeParse() call anywhere in the
file is exactly the failure class research found on 22% of mutating routes: a
hand-rolled inline check (`if (!code || typeof code !== "string")`) that has to be
correctly re-derived by hand at every call site instead of being enforced once.

Fires on Write|Edit to app/api/**/route.ts that introduces a req.json()/request.json()
call (or a hand-rolled JSON.parse(await req.text())) with no real zod-shaped validation
anywhere in the resulting file content.
EXEMPT: files whose only json() call is inside a GET handler (GET has no body to
validate); files that already have a schema call (adding a second req.json() call
elsewhere in the same file does not re-trigger this, since the check is file-wide).
Override (rare, justified): touch .claude/body-schema-skip.flag (5 min TTL).

House rules: fail OPEN on any parse/IO error; reason on stderr + exit 2 to block.

2026-08-18 audit (real payloads driven through the gate) found two misses:
  - The validation check was a BARE `.parse(`, so `JSON.parse(` and `Date.parse(` anywhere in
    the file disarmed it, whether or not the route had any real schema validation at all. FIVE
    real routes (app/api/translate, app/api/discovery/generate-description,
    app/api/admin/generate-roadmap, app/api/admin/discovery/smart-import,
    app/api/stripe/booking-pay-intent) call both req.json() and JSON.parse and all five happen to
    also have real validateBody/safeParse, so nothing shipped broken, but a future route with
    ONLY a stray JSON.parse (e.g. parsing an AI response) and no schema would have passed
    silently. Now excludes `.parse(` calls whose receiver is literally `JSON` or `Date`.
  - `JSON.parse(await req.text())` , reading the raw body via req.text() and hand-parsing it,
    the exact shape app/api/salon-draft/route.ts:56 uses (with real validation) , was invisible
    because the gate only looked for req.json()/request.json(), never req.text(). Now also
    treated as a body-read call when both req.text()/request.text() and JSON.parse( appear.
"""
import json
import os
import re
import sys
import time


def _strip_get_handler_json_calls(text):
    """Remove the body of any `export async function GET(...)` block before scanning
    for req.json(), since a GET handler reading a body is not this gate's concern
    (GET requests conventionally carry no body; several routes in this codebase
    still probe req.json() defensively inside GET but that is not a validation gap).
    This is a best-effort textual strip, not a real parser, matching the other gates'
    grep-level precision (a hard block would need real taint analysis).
    """
    pattern = re.compile(
        r"export\s+async\s+function\s+GET\s*\([^)]*\)\s*(?::\s*[^{]+)?\{",
    )
    out = []
    i = 0
    for m in pattern.finditer(text):
        out.append(text[i:m.start()])
        depth = 1
        j = m.end()
        while j < len(text) and depth > 0:
            if text[j] == "{":
                depth += 1
            elif text[j] == "}":
                depth -= 1
            j += 1
        i = j
    out.append(text[i:])
    return "".join(out)


def _has_unvalidated_json_call(text):
    scanned = _strip_get_handler_json_calls(text)
    has_json_call = bool(re.search(r"\b(req|request)\.json\s*\(", scanned))
    if not has_json_call:
        # JSON.parse(await req.text()) reads the mutating body exactly like req.json() does,
        # just through a different pair of calls (2026-08-18 audit, real shape at
        # app/api/salon-draft/route.ts:56). Only counts when BOTH appear: req.text() alone is
        # legitimate (e.g. a raw webhook signature check) and must not trip this on its own.
        has_json_call = bool(
            re.search(r"\b(req|request)\.text\s*\(", scanned)
            and re.search(r"\bJSON\.parse\s*\(", scanned)
        )
    if not has_json_call:
        return False
    has_validation = bool(
        re.search(r"\bvalidateBody\s*\(", text)
        or re.search(r"\.safeParse\s*\(", text)
        # a real schema parse, not JSON.parse(...)/Date.parse(...) (2026-08-18: a bare `.parse(`
        # let ANY JSON.parse/Date.parse call anywhere in the file count as "validated").
        or re.search(r"(?<!JSON)(?<!Date)\.parse\s*\(", text)
    )
    return not has_validation


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)  # fail open

    tool = data.get("tool_name", "")
    ti = data.get("tool_input", {}) or {}
    fp = ti.get("file_path", "") or ""
    if not fp:
        sys.exit(0)

    # Only app/api/**/route.ts files.
    if not re.search(r"(^|/)app/api/.*route\.ts$", fp):
        sys.exit(0)

    if tool == "Write":
        new_text = ti.get("content", "") or ""
    elif tool == "Edit":
        # The gate needs the WHOLE resulting file (a schema import may live far from
        # the edited lines), so reconstruct: read the file, apply the edit textually.
        old_string = ti.get("old_string", "")
        new_string = ti.get("new_string", "")
        try:
            with open(fp, "r", encoding="utf-8", errors="ignore") as f:
                current = f.read()
        except OSError:
            sys.exit(0)  # new file via Edit is not a real case; fail open
        if old_string and old_string in current:
            new_text = current.replace(old_string, new_string, 1)
        else:
            new_text = current + "\n" + new_string
    else:
        sys.exit(0)

    if not _has_unvalidated_json_call(new_text):
        sys.exit(0)

    # Override flag (5 min TTL).
    proj = os.environ.get("CLAUDE_PROJECT_DIR", ".")
    for flag in (
        os.path.join(proj, ".claude", "body-schema-skip.flag"),
        os.path.join(".claude", "body-schema-skip.flag"),
    ):
        try:
            if time.time() - os.path.getmtime(flag) < 300:
                sys.exit(0)
        except OSError:
            pass

    msg = (
        "BLOCKED: this route calls req.json()/request.json() with no zod validation "
        "anywhere in the file (input-abuse-07, _rules/SECURITY_RULES.md Rule S4/S5). "
        "Add a schema to lib/validations.ts and call validateBody(schema, body) before "
        "reading any field, matching every other mutating route in app/api/**. "
        "An inline check (if (!field || typeof field !== \"string\")) is not an "
        "acceptable substitute: it has to be correctly re-derived by hand at every "
        "call site instead of being enforced once. "
        "Override (rare, justified): touch .claude/body-schema-skip.flag"
    )
    print(msg, file=sys.stderr)
    sys.exit(2)


def _selftest():
    cases = [
        # (file content, should_block, label)
        ('export async function POST(req) {\n  const body = await req.json();\n  return Response.json(body);\n}',
         True, "req.json() with zero validation"),
        ('export async function POST(req) {\n  const body = await req.json();\n  const parsed = JSON.parse(aiText);\n  return Response.json(parsed);\n}',
         True, "req.json() + a stray JSON.parse( elsewhere , must NOT count as validation"),
        ('export async function POST(req) {\n  const body = await req.json();\n  const validated = schema.parse(body);\n  return Response.json(validated);\n}',
         False, "req.json() + a real schema.parse( is validated"),
        ('export async function POST(req) {\n  const body = await req.json();\n  const { data } = validateBody(mySchema, body);\n  return Response.json(data);\n}',
         False, "req.json() + validateBody("),
        ('export async function POST(req) {\n  const body = await req.json();\n  const parsed = mySchema.safeParse(body);\n  return Response.json(parsed);\n}',
         False, "req.json() + .safeParse("),
        ('export async function GET(req) {\n  const body = await req.json();\n  return Response.json(body);\n}',
         False, "GET handler , no body to validate"),
        ('export async function POST(req) {\n  const raw = await req.text();\n  const body = JSON.parse(raw);\n  return Response.json(body);\n}',
         True, "req.text() + JSON.parse(raw) with zero validation (the second miss)"),
        ('export async function PUT(req) {\n  const raw = await req.text();\n  const body = putSchema.parse(JSON.parse(raw));\n  return Response.json(body);\n}',
         False, "real salon-draft shape: req.text() + JSON.parse wrapped in schema.parse("),
        ('export async function POST(req) {\n  const raw = await req.text();\n  const event = stripe.webhooks.constructEvent(raw, sig, secret);\n  return Response.json({ ok: true });\n}',
         False, "req.text() with no JSON.parse at all (real stripe webhook shape) , must not trip the new check"),
        ('export async function POST(req) {\n  const rawBody = await req.text();\n  const reports = normalizeCspReports(ct, rawBody);\n  return new Response(null, { status: 204 });\n}',
         False, "req.text() delegated to a lib parser, no local JSON.parse (real csp-report shape)"),
    ]
    failed = 0
    for content, should_block, label in cases:
        blocked = _has_unvalidated_json_call(content)
        ok = blocked == should_block
        print(("PASS" if ok else "FAIL") + f": {label} -> blocked={blocked} want={should_block}")
        if not ok:
            failed += 1
    print(f"\n{len(cases) - failed}/{len(cases)} passed")
    return 1 if failed else 0


if __name__ == "__main__" and "--selftest" in sys.argv:
    sys.exit(_selftest())

try:
    main()
except Exception:
    sys.exit(0)  # fail open, never wedge a turn on a hook bug (matches every sibling gate)
