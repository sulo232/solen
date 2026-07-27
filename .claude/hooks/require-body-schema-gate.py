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
call with no validateBody/safeParse/.parse( anywhere in the resulting file content.
EXEMPT: files whose only json() call is inside a GET handler (GET has no body to
validate); files that already have a schema call (adding a second req.json() call
elsewhere in the same file does not re-trigger this, since the check is file-wide).
Override (rare, justified): touch .claude/body-schema-skip.flag (5 min TTL).

House rules: fail OPEN on any parse/IO error; reason on stderr + exit 2 to block.
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
        return False
    has_validation = bool(
        re.search(r"\bvalidateBody\s*\(", text)
        or re.search(r"\.safeParse\s*\(", text)
        or re.search(r"\.parse\s*\(", text)
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


try:
    main()
except Exception:
    sys.exit(0)  # fail open, never wedge a turn on a hook bug (matches every sibling gate)
