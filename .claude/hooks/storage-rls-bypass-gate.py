#!/usr/bin/env python3
"""storage-rls-bypass-gate: PreToolUse (Write only), BLOCKING.

Backend audit ground truth: 4 separate audit waves found Storage bugs of
this exact shape , cross-tenant deletion via `salons/[slug]/gallery` DELETE,
`chat-media` + `discovery-images` buckets open to any authenticated user,
`formula-photo` writing before its ownership gate, and `review-photos` with
zero INSERT policy silently swallowing uploads while the route still
returned a fake `200 {success:true}`.

A service-role Storage call (`.storage.from(...).upload(...)` /
`.remove(...)` made through the admin client) BYPASSES Storage RLS the same
way createAdminSupabaseClient() bypasses table RLS, so an unguarded write
against a client-supplied path is a cross-tenant write or delete.

ROUND 2 FIX (reviewer proof, 2026-07-16): the original Edit|Write|MultiEdit,
app/api/**/route.ts-or-lib/**/*.ts scope ran against all 11 real files with
`.storage.from(...)` and fired on 5 (45%), all false positives, the same
AUTH_SIGNAL defect found in service-role-ownership-gate.py:
  - 3 admin routes using the inline `profiles.role !== "admin"` pattern
    instead of the named requireAdmin() helper (app/api/admin/discovery/
    staging/route.ts, app/api/admin/discovery/upload/route.ts,
    app/api/admin/reviews/[id]/route.ts).
  - 1 public content proxy with no ownership concept
    (app/api/discovery/thumb/[id]/route.ts).
  - 1 lib helper (lib/backup/export.ts) whose CALLER owns the auth check --
    a storage-writing lib helper can never contain the auth signal that
    lives one file away in its route.ts caller, so `lib/**` was structurally
    condemned to always misfire here. `lib/**` is REMOVED from this gate's
    scope entirely; it now only covers app/api/**/route.ts, where the auth
    check for a route actually lives.

Two structural fixes, mirroring service-role-ownership-gate.py:

1. Scope narrowed to Write only (new files), matching the house precedent
   at ~/.claude/hooks/no-unauth-money-route.py.
2. The auth-signal recognizer is shared/mirrored with
   service-role-ownership-gate.py: ROLE_CHECK (inline `.role !== "admin"`)
   and OWNERSHIP_COMPARISON (`!== user.id` / `!== session.user.id`) added,
   plus createHmac(/timingSafeEqual(/getActiveSalon(/clientBelongsToSalon(/
   verifyAccessToken(/findQueueEntryByToken( added to AUTH_SIGNAL (the same
   ownership-resolution and token-verification helpers found empirically
   across the sibling gate's full 234-file corpus run -- app/api/clients/
   [id]/photos/route.ts here needed getActiveSalon(/clientBelongsToSalon(
   specifically, its Storage write is gated on `clientBelongsToSalon(admin,
   salon.id, customerId)` after `getActiveSalon(supabase, user.id, "id")`,
   not the named requireSalonOwner()).

Residual, named honestly (not pattern-matched away): app/api/discovery/
thumb/[id]/route.ts persists a public, non-sensitive TikTok-thumbnail cache
to the `discovery-images` bucket with no ownership concept at all -- the
same "legitimately public data" class as service-role-ownership-gate.py's
category 4. There is no reliable syntactic signal to distinguish that from
a route that is missing a required ownership check on a sensitive write, so
it is left to the `storage-ok:` escape hatch rather than pattern-matched
away (a MISS-over-false-positive choice, same reasoning as the sibling
gate). The Write-only scope means this only matters if the file were ever
rewritten from scratch; today it is edited, not written, so the scope
change alone removes it from the operational false-positive count.

DENIES a Write of a NEW app/api/**/route.ts whose content has ALL of:
  (a) `.storage.from(` followed, within a reasonable window, by
      `.upload(` or `.remove(`
  (b) also calls createAdminSupabaseClient( somewhere in the same content
  (c) NO authorization signal , same signal set as service-role-ownership-
      gate.py: requireAuth / requireAdmin / requireSalonOwner / requireRole
      / resolveBookingActor / CRON_SECRET / stripe-signature / createHmac /
      timingSafeEqual / getActiveSalon / clientBelongsToSalon /
      verifyAccessToken / findQueueEntryByToken, an inline
      `.role !== "admin"` check, or a JS ownership comparison against
      `user.id` / `session.user.id`. (No self-scoped-`.eq()` check here --
      unlike the sibling gate this one isn't keyed on a client-supplied
      identifier at all, so that heuristic doesn't apply.)

Escape hatch: put `storage-ok:` (case-insensitive) anywhere in the added
content if the write is genuinely safe (e.g. a public, non-sensitive
bucket, or ownership already proven upstream of this content).

Fail-open on any internal error, matching the house pattern
(no-select-star-sensitive.py, money-update-cas-gate.py)."""
import json, re, sys

FIRE_PATH = re.compile(r"app/api/.+/route\.ts$")
ESCAPE = re.compile(r"storage-ok\s*:", re.I)

STORAGE_FROM = re.compile(r"\.storage\s*\.\s*from\(")
STORAGE_WRITE = re.compile(r"\.\s*(upload|remove)\(")
ADMIN_CLIENT = re.compile(r"createAdminSupabaseClient\(")
# 2026-08-19 stress-test fix: split into FUNCTION_SIGNAL (must actually be CALLED, `name(`)
# and STRING_SIGNAL (the two non-call constants). The old single AUTH_SIGNAL matched the bare
# WORD anywhere, so `// TODO: add requireAuth check` in a comment satisfied it with zero real
# auth. Reproduced live 2026-08-19 (hook-probe): a route with createAdminSupabaseClient() +
# .storage.from(...).upload( + only a comment mentioning requireAuth passed clean. GATE_LAW
# failure shape 3 ("the stand-down that costs nothing to satisfy"). Both signals are now
# matched against comment-stripped content (see strip_comments below); ESCAPE stays on the
# raw content because `storage-ok:` is meant to live in a comment.
# 2026-08-19: `\s*(?:<[^<>]*>)?\s*\(` (not plain `\s*\(`) because the sibling
# service-role-ownership-gate.py's full-corpus sweep the same day found 14 real files calling
# these with a TypeScript generic type-argument between the name and the parens
# (`getActiveSalon<{ id: string }>(...)`, `findQueueEntryByToken<{...}>(...)`), which the
# plain pattern does not match. Mirrored here defensively for the same identifier list even
# though this gate's own 5-file corpus didn't happen to hit it.
FUNCTION_SIGNAL = re.compile(
    r"\b(requireAuth|requireAdmin|requireSalonOwner|requireRole|resolveBookingActor|"
    r"createHmac|timingSafeEqual|getActiveSalon|clientBelongsToSalon|verifyAccessToken|"
    r"findQueueEntryByToken)\s*(?:<[^<>]*>)?\s*\("
)
STRING_SIGNAL = re.compile(r"\b(CRON_SECRET|stripe-signature)\b")
ROLE_CHECK = re.compile(
    r"\.\s*role\s*(?:!==|===)\s*[\"']admin[\"']|[\"']admin[\"']\s*(?:!==|===)\s*[\w.?]*\.\s*role"
)
OWNERSHIP_COMPARISON = re.compile(
    r"(?:!==|===)\s*(?:session\s*\.\s*)?user\??\s*\.\s*id\b"
    r"|\b(?:session\s*\.\s*)?user\??\s*\.\s*id\s*(?:!==|===)"
)
# 2026-08-19 stress-test fix: app/api/profile/avatar/route.ts is real, safe, shipped code that
# this gate would have blocked if it were ever rewritten from scratch (proven via hook-probe
# Write-simulation) -- it authenticates with the plain `supabase.auth.getUser()` + `if (!user)`
# idiom (not one of the named helpers above) and derives the storage path directly from the
# verified session's own id (`` `${user.id}/...` ``), never from client input. That idiom
# recurs at app/api/profile/export/route.ts, app/api/conversations/route.ts and
# app/api/cron/process-deletions/route.ts (grepped, not guessed), so it is a real house pattern,
# not a one-off. Recognized narrowly: BOTH the real Supabase auth call AND the storage path
# built directly from `user.id`/`session.user.id` must be present -- a bare `auth.getUser()`
# alone (with no self-scoped path) still does NOT satisfy this gate, because authenticated-but-
# not-owner-scoped is exactly the bypass class this gate exists to catch.
SUPABASE_USER_CALL = re.compile(r"auth\s*\.\s*getUser\(|auth\s*\.\s*getSession\(")
SELF_SCOPED_PATH = re.compile(r"\$\{(?:session\s*\.\s*)?user\??\s*\.\s*id\}")

WINDOW = 400


def strip_comments(s):
    """House approximation, not a full JS/TS tokenizer: strips /* */ and // comments so a
    signal name can no longer satisfy this gate by merely being mentioned in a comment (see
    FUNCTION_SIGNAL note above). Does not special-case `//` inside a string/URL literal on the
    same line as a real signal call -- accepted, because that only makes the gate MORE likely
    to ask for an explicit auth call elsewhere in the file, never less strict."""
    s = re.sub(r"/\*.*?\*/", "", s, flags=re.S)
    s = re.sub(r"//[^\n]*", "", s)
    return s


def allow():
    sys.exit(0)


def deny(msg):
    print(json.dumps({"hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "deny",
        "permissionDecisionReason": msg,
    }}))
    sys.exit(0)


def _selftest():
    """Drives THIS file as a real subprocess (same wire format the harness uses), not the
    functions in-process, so the self-test cannot drift from what actually runs at PreToolUse.
    2026-08-19 stress-test pass cases: BAD/GOOD are the original pair; SNEAKY_COMMENT reproduces
    the comment-only-mention bypass found live that day (GATE_LAW failure shape 3) and must now
    DENY; SELF_SCOPED_PATH reproduces the app/api/profile/avatar/route.ts false positive found
    the same day (Write-simulated against the real file) and must now ALLOW."""
    import subprocess

    HERE = __file__
    BAD = (
        'import { createAdminSupabaseClient } from "@/lib/supabase/admin";\n'
        "export async function POST(req) {\n"
        "  const supabase = createAdminSupabaseClient();\n"
        '  const path = req.nextUrl.searchParams.get("path");\n'
        '  const { data } = await supabase.storage.from("gallery").upload(path, file);\n'
        "  return Response.json({ success: true });\n"
        "}"
    )
    GOOD = (
        'import { createAdminSupabaseClient } from "@/lib/supabase/admin";\n'
        'import { requireAuth } from "@/lib/auth/require";\n'
        "export async function POST(req) {\n"
        "  const user = await requireAuth(req);\n"
        "  const supabase = createAdminSupabaseClient();\n"
        "  const path = `salons/${user.id}/gallery/${file.name}`;\n"
        '  const { data } = await supabase.storage.from("gallery").upload(path, file);\n'
        "  return Response.json({ success: true });\n"
        "}"
    )
    SNEAKY_COMMENT = (
        "// TODO: add requireAuth check\n"
        'import { createAdminSupabaseClient } from "@/lib/supabase/admin";\n'
        "export async function POST(req) {\n"
        "  const supabase = createAdminSupabaseClient();\n"
        '  const path = req.nextUrl.searchParams.get("path");\n'
        '  const { data } = await supabase.storage.from("gallery").upload(path, file);\n'
        "  return Response.json({ success: true });\n"
        "}"
    )
    SELF_SCOPED = (
        'import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase";\n'
        "export async function POST(req) {\n"
        "  const supabase = await createServerSupabaseClient();\n"
        "  const { data: { user } } = await supabase.auth.getUser();\n"
        '  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });\n'
        "  const admin = createAdminSupabaseClient();\n"
        "  const path = `${user.id}/${Date.now()}.png`;\n"
        '  const { data } = await admin.storage.from("avatars").upload(path, file);\n'
        "  return Response.json({ url: data });\n"
        "}"
    )
    ESCAPE_HATCH = (
        "// storage-ok: public non-sensitive cache, no ownership concept\n"
        'import { createAdminSupabaseClient } from "@/lib/supabase/admin";\n'
        "export async function GET(req) {\n"
        "  const supabase = createAdminSupabaseClient();\n"
        '  const { data } = await supabase.storage.from("cache").upload("x", file);\n'
        "  return Response.json({ url: data });\n"
        "}"
    )
    GENERIC_CALL = (
        'import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase";\n'
        'import { getActiveSalon } from "@/lib/active-salon";\n'
        "export async function POST(req) {\n"
        "  const supabase = await createServerSupabaseClient();\n"
        "  const { data: { user } } = await supabase.auth.getUser();\n"
        '  const salon = await getActiveSalon<{ id: string }>(supabase, user.id, "id");\n'
        "  const admin = createAdminSupabaseClient();\n"
        "  const path = `salons/${salon.id}/gallery/${file.name}`;\n"
        '  const { data } = await admin.storage.from("gallery").upload(path, file);\n'
        "  return Response.json({ url: data });\n"
        "}"
    )

    cases = [
        ("BAD (no auth at all)", "Write", "app/api/probe-bad/route.ts", BAD, "deny"),
        ("GOOD (requireAuth called)", "Write", "app/api/probe-good/route.ts", GOOD, "allow"),
        ("SNEAKY_COMMENT (mention, not a call)", "Write", "app/api/probe-sneaky/route.ts",
         SNEAKY_COMMENT, "deny"),
        ("SELF_SCOPED_PATH (avatar idiom)", "Write", "app/api/probe-selfscoped/route.ts",
         SELF_SCOPED, "allow"),
        ("ESCAPE_HATCH (storage-ok: in comment)", "Write", "app/api/probe-escape/route.ts",
         ESCAPE_HATCH, "allow"),
        ("wrong tool (Edit, scope check)", "Edit", "app/api/probe-bad/route.ts", BAD, "allow"),
        ("GENERIC_CALL (getActiveSalon<{...}>()", "Write", "app/api/probe-generic/route.ts",
         GENERIC_CALL, "allow"),
    ]

    failures = []
    for label, tool, relpath, content, expect in cases:
        payload = {
            "session_id": "selftest", "transcript_path": "/dev/null", "cwd": "/tmp",
            "hook_event_name": "PreToolUse", "permission_mode": "bypassPermissions",
            "tool_name": tool,
            "tool_input": {"file_path": "/Users/sulo/Documents/solen/" + relpath, "content": content},
        }
        proc = subprocess.run(["python3", HERE], input=json.dumps(payload),
                               capture_output=True, text=True, timeout=10)
        out = proc.stdout.strip()
        denied = out.startswith("{") and '"deny"' in out
        got = "deny" if denied else "allow"
        ok = got == expect
        status = "PASS" if ok else "FAIL"
        print(f"[{status}] {label}: expected {expect}, got {got}")
        if not ok:
            failures.append(label)

    if failures:
        print(f"\n{len(failures)}/{len(cases)} cases FAILED: {failures}")
        sys.exit(1)
    print(f"\nAll {len(cases)} cases PASSED.")
    sys.exit(0)


if len(sys.argv) > 1 and sys.argv[1] == "--selftest":
    _selftest()

try:
    data = json.load(sys.stdin)
except Exception:
    allow()

try:
    if (data.get("tool_name") or "") != "Write":
        allow()

    ti = data.get("tool_input") or {}
    path = str(ti.get("file_path") or "")
    if not FIRE_PATH.search(path) or path.endswith(".d.ts"):
        allow()

    content = str(ti.get("content") or "")
    if not content:
        allow()

    if ESCAPE.search(content):
        allow()

    code = strip_comments(content)

    if not ADMIN_CLIENT.search(code):
        allow()
    if (FUNCTION_SIGNAL.search(code) or STRING_SIGNAL.search(code)
            or ROLE_CHECK.search(code) or OWNERSHIP_COMPARISON.search(code)
            or (SUPABASE_USER_CALL.search(code) and SELF_SCOPED_PATH.search(code))):
        allow()

    hit = None
    for m in STORAGE_FROM.finditer(code):
        window = code[m.end():m.end() + WINDOW]
        wm = STORAGE_WRITE.search(window)
        if wm:
            hit = wm.group(1)
            break

    if hit:
        deny(
            f"BLOCKED (service-role Storage bypass): a `.storage.from(...).{hit}(...)` write "
            "sits alongside createAdminSupabaseClient( in this new route, with NO authorization "
            "signal (no requireAuth/requireAdmin/requireSalonOwner/requireRole/"
            "resolveBookingActor check, no CRON_SECRET/stripe-signature/HMAC verification, no "
            "inline `.role !== \"admin\"` check, no ownership comparison against "
            "`user.id`/`session.user.id`). A service-role Storage write BYPASSES Storage RLS the "
            "same way the service-role table client bypasses row RLS, so a client-supplied path "
            "here is a cross-tenant write or delete. Four separate audit waves found this exact "
            "class: cross-tenant deletion via `salons/[slug]/gallery` DELETE, `chat-media`/"
            "`discovery-images` open to any authenticated user, `formula-photo` writing before "
            "its ownership gate, and `review-photos` with zero INSERT policy silently swallowing "
            "uploads while the route still returned a fake `200 {success:true}`. Gate ownership "
            "BEFORE the storage call, and prove the object actually landed by checking the "
            "returned error (a 200 status is not proof , review-photos returned success for "
            "months while writing nothing). If this write is genuinely safe, add `storage-ok:` "
            "anywhere in the new content."
        )
    allow()
except Exception:
    allow()
