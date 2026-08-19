#!/usr/bin/env python3
"""PreToolUse gate: block server-side supabase.auth.getSession() for identity/authz.

getSession() reads the session straight from the client-supplied cookie and does
NOT verify the JWT signature (confirmed vs @supabase/auth-js: _isValidSession only
checks that the token keys EXIST, never their values). An attacker can forge a
cookie with any user.id. For any server-side identity or authorization decision
use supabase.auth.getUser() (verifies the JWT against the Supabase Auth server,
returns a null user on failure so it fails CLOSED). The whole backend was migrated
off getSession() on 2026-07-10 (commit 9783e5711); this gate stops it coming back.

Fires on Write|Edit to app/**/*.ts(x) or lib/**/*.ts(x) that introduces
`auth.getSession()`. EXEMPT: client components ("use client" at the top of the
file) reading their own session for UI state , that is not a security boundary.
Override (rare, justified): touch .claude/getsession-skip.flag  (5 min TTL).

House rules: fail OPEN on any parse/IO error; reason on stderr + exit 2 to block.

FIXED 2026-08-19 (stress pass, reproduced defect): a surgical two-edit rename
(`getUser()` -> `getSession()` on one Edit, `{ user }` -> `{ session }` on a
second) never puts the literal substring `auth.getSession()` inside either
edit's own `new_string`, because the `auth.` prefix stays in unchanged
surrounding text. Fixed by reconstructing the touched line against the
file's real on-disk content before checking (see `_reconstruct_edit_text`).
Also fixed: the scope check matched `/app/` or `/lib/` ANYWHERE in the path,
so it blocked ordinary work in solen-mobile/lib/** and any node_modules/**
package that happens to ship a folder named app or lib; it is now anchored
to the actual project root (see `_in_project_app_or_lib`). Also fixed: a
multi-line `/* ... */` block comment whose interior lines don't each start
with `*` was read as real code and wrongly blocked (see `_has_real_getsession`).
"""
import json
import os
import re
import sys
import time

# ---------------------------------------------------------------------------
# SELF-TEST (added 2026-08-19 by the armed-but-untested stress pass; this
# hook had no --selftest before). Drives the gate end to end with real
# subprocess calls against fixture files on disk, so the Edit-reconstruction
# fix (which reads the file's current content) is actually exercised, not
# just the pure regex.
#   python3 no-getsession-authz-gate.py --selftest
# ---------------------------------------------------------------------------
if "--selftest" in sys.argv:
    import subprocess
    import tempfile

    _HOOK = os.path.abspath(__file__)

    def _run(tool, file_path, **kw):
        ti = {"file_path": file_path}
        ti.update(kw)
        payload = {"tool_name": tool, "tool_input": ti}
        env = dict(os.environ)
        env["CLAUDE_PROJECT_DIR"] = _PROJ
        proc = subprocess.run([sys.executable, _HOOK], input=json.dumps(payload),
                              text=True, capture_output=True, env=env)
        return proc.returncode == 2

    _tmp = tempfile.mkdtemp(prefix="getsession-selftest-")
    _PROJ = _tmp
    os.makedirs(os.path.join(_tmp, "lib", "auth"), exist_ok=True)
    os.makedirs(os.path.join(_tmp, "app", "api", "profile"), exist_ok=True)

    _REQUIRE_TS = os.path.join(_tmp, "lib", "auth", "require.ts")
    with open(_REQUIRE_TS, "w") as f:
        f.write(
            "export async function requireAuth(supabase) {\n"
            "  const { data: { user } } = await supabase.auth.getUser();\n"
            "  return user;\n"
            "}\n"
        )

    _ROUTE_TS = os.path.join(_tmp, "app", "api", "profile", "route.ts")
    with open(_ROUTE_TS, "w") as f:
        f.write("export async function GET() {\n  return Response.json({});\n}\n")

    _CLIENT_TSX = os.path.join(_tmp, "app", "api", "profile", "widget.tsx")
    with open(_CLIENT_TSX, "w") as f:
        f.write('"use client";\nexport function Widget() { return null; }\n')

    _cases = []

    # 1. KNOWN-ANSWER CONTROL: a direct getSession() call in new_string -> BLOCK
    _cases.append((
        "1  direct getSession() call in new_string -> BLOCK", True,
        lambda: _run("Edit", _ROUTE_TS, old_string="return Response.json({});",
                     new_string="const { data: { session } } = await supabase.auth.getSession(); return Response.json({ session });")))

    # 2. THE REPRODUCED DEFECT, step A: renaming just the call name recombines
    #    with the UNCHANGED `auth.` prefix already on disk -> must now BLOCK.
    _cases.append((
        "2  surgical rename step A (getUser()->getSession()) -> BLOCK", True,
        lambda: _run("Edit", _REQUIRE_TS, old_string="getUser()", new_string="getSession()")))

    # 3. Step B alone, against the UNCHANGED file (getUser() still on disk) ->
    #    correctly stays pass, because applying only this edit does not
    #    introduce a real getSession() call.
    _cases.append((
        "3  surgical rename step B alone, file still says getUser() -> pass", False,
        lambda: _run("Edit", _REQUIRE_TS, old_string="{ user }", new_string="{ session }")))

    # 4. THE FULL ATTACK, applied in real order: step A actually lands on disk
    #    (since it's the file's true current content after a real Edit call),
    #    then step B runs against that new content -> must BLOCK, because the
    #    file already reads getSession() before step B's own edit is applied.
    _attacked_ts = os.path.join(_tmp, "lib", "auth", "attacked.ts")
    with open(_attacked_ts, "w") as f:
        f.write(
            "export async function requireAuth(supabase) {\n"
            "  const { data: { user } } = await supabase.auth.getSession();\n"
            "  return user;\n"
            "}\n"
        )
    _cases.append((
        "4  step B run against a file that ALREADY says getSession() -> BLOCK", True,
        lambda: _run("Edit", _attacked_ts, old_string="{ user }", new_string="{ session }")))

    # 5. SCOPE DEFECT: a sibling project's lib/ (solen-mobile-shaped path) is
    #    OUTSIDE this project root -> must pass regardless of content.
    _sibling = os.path.join(os.path.dirname(_tmp), "sibling-mobile-" + os.path.basename(_tmp), "lib")
    os.makedirs(_sibling, exist_ok=True)
    _sibling_ts = os.path.join(_sibling, "auth.ts")
    _cases.append((
        "5  scope: a different project's lib/ path -> pass", False,
        lambda: _run("Write", _sibling_ts,
                     content="const { data: { session } } = await supabase.auth.getSession();")))

    # 6. SCOPE DEFECT: node_modules inside THIS project root, with its own
    #    nested lib/ folder -> must pass (not this codebase's app/ or lib/).
    _nm = os.path.join(_tmp, "node_modules", "@supabase", "auth-js", "lib")
    os.makedirs(_nm, exist_ok=True)
    _nm_ts = os.path.join(_nm, "GoTrueClient.ts")
    _cases.append((
        "6  scope: node_modules/**/lib/** inside project root -> pass", False,
        lambda: _run("Write", _nm_ts,
                     content="const { data: { session } } = await supabase.auth.getSession();")))

    # 7. COMMENT DEFECT: a multi-line /* ... */ block whose interior lines
    #    have no leading * is documentation, not code -> must pass.
    _cases.append((
        "7  multi-line block comment (no leading *) -> pass", False,
        lambda: _run("Edit", _ROUTE_TS, old_string="return Response.json({});",
                     new_string="/*\ndo not use supabase.auth.getSession() here, insecure\n*/\nreturn Response.json({});")))

    # 8. NEGATIVE: genuinely correct work, an unrelated edit to the same
    #    server file that never mentions getSession -> must pass.
    _cases.append((
        "8  unrelated edit, no getSession anywhere -> pass", False,
        lambda: _run("Edit", _ROUTE_TS, old_string="Response.json({})",
                     new_string="Response.json({ ok: true })")))

    # 9. NEGATIVE: the existing // line-comment exemption still holds.
    _cases.append((
        "9  single-line // comment mentioning getSession -> pass", False,
        lambda: _run("Edit", _ROUTE_TS, old_string="return Response.json({});",
                     new_string="// never call supabase.auth.getSession() here\nreturn Response.json({});")))

    # 10. NEGATIVE: the "use client" exemption still holds for a real call.
    _cases.append((
        "10 \"use client\" component reading its own session -> pass", False,
        lambda: _run("Edit", _CLIENT_TSX, old_string="return null;",
                     new_string="const { data: { session } } = await supabase.auth.getSession(); return session;")))

    _ok = _bad = 0
    for _name, _expect, _fn in _cases:
        _got = _fn()
        _good = _got == _expect
        _ok += _good
        _bad += (not _good)
        print(("  PASS  " if _good else "  FAIL  ") + _name
              + ("" if _good else "   expected block=%s got block=%s" % (_expect, _got)))
    print("\n%d/%d passed" % (_ok, _ok + _bad))
    sys.exit(1 if _bad else 0)


def _project_root():
    return os.path.abspath(os.environ.get("CLAUDE_PROJECT_DIR", "") or os.getcwd())


def _in_project_app_or_lib(fp):
    """Anchor the app/ and lib/ scope to the ACTUAL project root instead of
    matching those two path segments anywhere on the filesystem (this used
    to also catch solen-mobile/lib/**, node_modules/**/lib/**, and any other
    checkout that merely has a folder named app or lib)."""
    proj = _project_root()
    abs_fp = fp if os.path.isabs(fp) else os.path.abspath(os.path.join(proj, fp))
    try:
        rel = os.path.relpath(abs_fp, proj)
    except ValueError:
        return False
    if rel.startswith(".."):
        return False
    return bool(re.match(r"(app|lib)/", rel))


def _reconstruct_edit_text(fp, old_string, new_string, replace_all):
    """An Edit's new_string alone misses a surgical rename: renaming
    `getUser` -> `getSession` in isolation never contains the substring
    `auth.getSession()`, because the `auth.` prefix was already sitting in
    the UNCHANGED surrounding text on that line. Read the file's current
    on-disk content and reconstruct what the edit actually produces (just
    the touched line for a normal Edit, the whole file for replace_all) so
    that recombination is visible to the check below. Falls back to
    new_string alone (the prior behavior) whenever the file can't be read or
    old_string isn't found there, so this only ADDS coverage, never removes
    any case the gate already caught."""
    try:
        with open(fp, "r", encoding="utf-8", errors="ignore") as f:
            current = f.read()
    except OSError:
        return new_string
    if not old_string or old_string not in current:
        return new_string
    if replace_all:
        return current.replace(old_string, new_string)
    # old_string can textually occur more than once (a doc comment mentioning
    # the same call above the real code line, for example, as in this repo's
    # own lib/auth/require.ts). Which occurrence the real Edit tool targets
    # is not reliably the first textual match, so reconstruct EVERY
    # occurrence's resulting line and let the caller inspect them all. This
    # only widens what gets INSPECTED, never what counts as a real call.
    pieces = []
    start = 0
    while True:
        idx = current.find(old_string, start)
        if idx == -1:
            break
        end_idx = idx + len(old_string)
        line_start = current.rfind("\n", 0, idx) + 1
        line_end = current.find("\n", end_idx)
        if line_end == -1:
            line_end = len(current)
        pieces.append(current[line_start:idx] + new_string + current[end_idx:line_end])
        start = end_idx
    return "\n".join(pieces) if pieces else new_string


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

    # Only server-side surfaces where getSession() is an authz footgun.
    if not re.search(r"\.tsx?$", fp):
        sys.exit(0)
    if not _in_project_app_or_lib(fp):
        sys.exit(0)

    if tool == "Write":
        new_text = ti.get("content", "") or ""
    elif tool == "Edit":
        old_string = ti.get("old_string", "") or ""
        new_string = ti.get("new_string", "") or ""
        new_text = _reconstruct_edit_text(fp, old_string, new_string, bool(ti.get("replace_all")))
    else:
        sys.exit(0)

    # A real (non-comment) getSession call is the trigger; a mention in a //
    # or * line-comment, or inside a /* ... */ block comment (with or
    # without a leading * on each interior line), is fine.
    def _has_real_getsession(text):
        in_block_comment = False
        for raw_line in text.splitlines():
            line = raw_line.lstrip()
            if in_block_comment:
                if "*/" in line:
                    in_block_comment = False
                    line = line.split("*/", 1)[1].lstrip()
                else:
                    continue
            if line.startswith("/*") and "*/" not in line:
                in_block_comment = True
                continue
            if "auth.getSession()" in line:
                if not (line.startswith("//") or line.startswith("*") or line.startswith("/*")):
                    return True
        return False

    if not _has_real_getsession(new_text):
        sys.exit(0)

    # Override flag (5 min TTL).
    proj = os.environ.get("CLAUDE_PROJECT_DIR", ".")
    for flag in (
        os.path.join(proj, ".claude", "getsession-skip.flag"),
        os.path.join(".claude", "getsession-skip.flag"),
    ):
        try:
            if time.time() - os.path.getmtime(flag) < 300:
                sys.exit(0)
        except OSError:
            pass

    # Client components legitimately read their own session for UI state.
    head = ""
    if tool == "Write":
        head = new_text[:250]
    else:
        try:
            with open(fp, "r", encoding="utf-8", errors="ignore") as f:
                head = f.read(250)
        except OSError:
            head = ""
    if '"use client"' in head or "'use client'" in head:
        sys.exit(0)

    msg = (
        "BLOCKED: supabase.auth.getSession() reads the client-supplied cookie WITHOUT verifying "
        "the JWT signature (a forged cookie can set any user.id). For any server-side identity or "
        "authorization decision, use supabase.auth.getUser() instead (it verifies the JWT against "
        "the Supabase Auth server and returns a null user on failure, so it fails closed). "
        "Shared helpers already do this: lib/auth/require.ts requireAuth()/requireAdmin() and "
        "lib/supabase.ts getSessionUser(). The whole backend was migrated off getSession() on "
        "2026-07-10 (commit 9783e5711). "
        "Exempt: client components (\"use client\") reading their own session for UI state. "
        "Override (rare, justified): touch .claude/getsession-skip.flag"
    )
    print(msg, file=sys.stderr)
    sys.exit(2)


try:
    main()
except Exception:
    sys.exit(0)  # fail open , never wedge a turn on a hook bug (matches every sibling gate)
