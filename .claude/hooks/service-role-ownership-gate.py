#!/usr/bin/env python3
"""service-role-ownership-gate: PreToolUse (Write only), BLOCKING.

Backend audit ground truth: createAdminSupabaseClient() (lib/supabase.ts:78)
uses the service-role key, which has Postgres BYPASSRLS. RLS does not apply
underneath it, so every ownership decision at its ~238 app/api/ call sites is
hand-rolled with zero backstop. Three separate audit waves found this class
(IDOR / OWASP API1): CRM client routes accepting an arbitrary `client_id`,
barber-leaderboard, walkin-analytics, cross-salon walkin/queue PATCH , around
20 vulnerable routes total.

The canonical ownership helpers live in lib/auth/require.ts: requireAuth,
requireAdmin, requireSalonOwner, requireRole.

ROUND 2 FIX (reviewer proof, 2026-07-16): the original Edit|Write|MultiEdit
scope ran against all 234 real call sites and fired on 80 (34%), every single
one a false positive in four shapes: (1) an inline `profiles.role !== "admin"`
check instead of the named helper, (2) ownership expressed as a plain JS
comparison after a joined select (`salonOwner !== user.id`), (3) an HMAC/token
verification scheme invisible to the old signal set, (4) legitimately public
data with no ownership concept at all. The SAME reviewer also wrote a
textbook IDOR route (admin client + `searchParams.get("salon_id")` piped
straight into `.eq("salon_id", ...)`, zero auth) and the old gate ALLOWED it,
because the old `OWNERSHIP_EQ` heuristic only checked that the literal
`.eq("salon_id"|...)` string appeared ANYWHERE in the content , it never
verified the bound value traced back to the caller's own identity instead of
the request. That presence-only check legitimized the exact bug it was
meant to catch, so it has been REMOVED (see below).

Two structural fixes:

1. Scope narrowed to Write only (new files), matching the house precedent
   at ~/.claude/hooks/no-unauth-money-route.py. There are 238 existing call
   sites; re-litigating every one of them on every Edit is what produced the
   34% false-positive rate. A brand-new route is graded clean; an existing
   one is no longer re-graded on every touch.

2. The auth-signal recognizer is widened to match the ACTUAL shapes found in
   the false-positive corpus (read, not guessed, from app/api/admin/cities/
   route.ts, app/api/admin/commission/route.ts, app/api/admin/revenue/
   route.ts, app/api/bookings/[id]/refund/route.ts, app/api/bookings/[id]/
   quick-action/route.ts):
     - ROLE_CHECK: an inline `<x>.role !== "admin"` / `"admin" !== <x>.role`
       comparison (category 1: the inline admin check).
     - OWNERSHIP_COMPARISON: a JS `!==`/`===` comparison against
       `user.id` / `session.user.id` (category 2: ownership as a JS
       comparison after a joined select, e.g. `salonOwner !== user.id`).
     - createHmac( / timingSafeEqual( added to AUTH_SIGNAL (category 3:
       HMAC/token-based authorization, e.g. quick-action's
       verifyActionToken()).
   Verification against the FULL 234-file corpus (not just the 5 files named
   above) surfaced a further, very common real shape not covered by the
   reviewer's 4 categories: `getActiveSalon(supabase|admin, user.id, ...)`
   (lib/active-salon.ts) and `clientBelongsToSalon(admin, salon.id,
   customerId)` (lib/verify-salon-client.ts) are the actual, pervasive
   ownership-resolution helpers used across app/api/clients/[id]/*,
   app/api/salon/*, app/api/dashboard/* etc, NOT the named requireSalonOwner
   from lib/auth/require.ts the original gate looked for. Both added to
   AUTH_SIGNAL. `verifyAccessToken(` (lib/bookings/guest-access.ts, a
   SHA-256-hash token check with an anti-timing-oracle sentinel branch) is
   the same HMAC/token-verification class as quick-action's
   verifyActionToken(), also added. Same for `findQueueEntryByToken(`
   (lib/walkin/authz.ts): the guest walk-in tip/review routes gate purely on
   the queue tracking token, no session at all, by design.
   A second very common real shape: a query scoped to the CALLER's OWN id,
   `.eq(<any column>, user.id)` / `.eq(<any column>, session.user.id)` / a
   variable assigned directly from one of those (e.g. `const userId =
   user?.id; ... .eq("customer_id", userId)`). This is unambiguously safe
   regardless of column name, because the bound value is the session's own
   identity, not anything client-suppliable, so it cannot express an IDOR
   no matter what it is compared against. Implemented as `has_self_scoped_
   query()` below (a small Python check, not a single regex, because it has
   to resolve a variable back to its assignment first).
   NOT added: bare `auth.getUser(`/`auth.getSession(` as a blanket signal.
   The house's own no-unauth-money-route.py treats that as sufficient for
   its narrower question ("is there ANY auth at all"), but this gate's
   question is OWNERSHIP, not mere authentication -- almost every one of
   the 234 files calls auth.getUser() somewhere, so treating it alone as
   authorization would neuter this gate exactly the way createServer
   SupabaseClient alone once neutered it (see the sibling gate's own FIXED
   note). An authenticated-but-not-owner caller is precisely the CRM
   client_id / barber-leaderboard bug class this gate exists to catch.
   Category 4 (legitimately public data, no ownership concept at all , e.g.
   app/api/discovery/boards/[id]/route.ts, app/api/analytics/track-view/
   route.ts) has NO reliable syntactic signal that distinguishes it from a
   route that is missing a required ownership check; that distinction is a
   business-logic judgment call, not a pattern. Rather than invent a broad
   pattern that would reopen the false-negative hole (a heuristic loose
   enough to wave those two files through would also wave through routes
   that genuinely need a check), those routes are left to the
   `ownership-ok:` escape hatch. This is a deliberate MISS-over-false-
   positive choice; the Write-only scope means it only matters for a
   brand-new route shaped like these two, and the escape hatch exists
   exactly for that case. Against the full 234-file corpus, category 4 (a
   public salon/barber/brand/queue/telemetry/marketplace-purchase lookup or
   write with no privacy-owned resource involved) accounts for the entire
   remaining residual under a Write-SIMULATED stress test (32 files); it is
   NOT a residual in real operation, because the Write-only scope means none
   of these 234 existing files are re-graded on the Edits that actually touch
   them day to day.
   `/api/dev/` is also exempted (app/api/dev/login/route.ts): hard-404'd
   outside NODE_ENV=development, matching no-unauth-money-route.py's own
   exemption.

The old `OWNERSHIP_EQ` presence-only heuristic (".eq(\"salon_id\"|...)`
appears anywhere") is REMOVED, not tightened: reliably tracing whether an
ARBITRARY bound value is server-derived vs. client-supplied cannot be done
with a regex without either (a) staying loose enough to keep allowing the
reviewer's reproduced IDOR, or (b) getting complex enough to become its own
source of false positives/negatives. The one narrow case that IS reliable
(the bound value literally traces to the caller's own `user.id`) is kept as
`has_self_scoped_query()` above; anything looser is a MISS, per the fix
brief's explicit permission to prefer a miss over a false positive.

DENIES a Write of a NEW app/api/**/route.ts whose content satisfies ALL:
  (a) calls createAdminSupabaseClient(
  (b) reads a CLIENT-SUPPLIED identifier: a route param (`params.` /
      `await params`), `searchParams.get(`, or a field off `await req.json()`
      / `await request.json()`
  (c) has NO authorization signal anywhere in the content: none of
      requireAuth / requireAdmin / requireSalonOwner / requireRole /
      resolveBookingActor / CRON_SECRET / stripe-signature / createHmac /
      timingSafeEqual / getActiveSalon / clientBelongsToSalon /
      verifyAccessToken / findQueueEntryByToken, no inline
      `.role !== "admin"` check, no JS ownership comparison against
      `user.id` / `session.user.id`, and no query scoped to the caller's
      own id.

All three are required (AND, not OR).

Escape hatch: put `ownership-ok:` (case-insensitive) anywhere in the added
content if the route genuinely needs no ownership check (e.g. a public,
non-sensitive lookup).

Fail-open on any internal error, matching the house pattern
(no-select-star-sensitive.py, money-update-cas-gate.py)."""
import json, re, sys

FIRE_PATH = re.compile(r"app/api/.+/route\.ts$")
ESCAPE = re.compile(r"ownership-ok\s*:", re.I)

ADMIN_CLIENT = re.compile(r"createAdminSupabaseClient\(")
CLIENT_SUPPLIED = re.compile(
    r"(await\s+params\b|\bparams\s*\.|searchParams\s*\.\s*get\(|"
    r"await\s+req(?:uest)?\s*\.\s*json\(\))"
)
# 2026-08-19 stress-test fix: split into FUNCTION_SIGNAL (must actually be CALLED, `name(`)
# and STRING_SIGNAL (the two non-call constants), and both are now matched against
# comment-stripped content (see strip_comments below). The old single AUTH_SIGNAL matched the
# bare WORD anywhere in the raw content, so a comment like `// TODO: add requireAuth check`
# satisfied it with zero real auth call in the route. Reproduced live 2026-08-19 (hook-probe):
# a route with createAdminSupabaseClient() + a searchParams-sourced id + only a comment
# mentioning requireAuth passed clean, the same IDOR shape this gate exists to catch.
# GATE_LAW failure shape 3 ("the stand-down that costs nothing to satisfy"). ESCAPE stays on
# the raw content because `ownership-ok:` is meant to live in a comment.
#
# 2026-08-19, same pass, second real regression found by the full-corpus sweep required by
# GATE_LAW step 5: `getActiveSalon<{ id: string }>(supabase, user.id, "id")` and
# `findQueueEntryByToken<{...}>(` -- a TypeScript generic type-argument list between the name
# and the call parens -- are the ACTUAL, common shapes at 14 real call sites (grepped, not
# guessed: app/api/bookings/walk-in, clients/[id]/nail-preferences, dashboard/clients,
# dashboard/spa/rooms, nail-discovery/publish, salon/{bundles,chairs,dynamic-pricing,loyalty,
# retail,stations}, walkin/{queue/status,review,tip}), all real safe ownership-scoped calls
# the plain `name\s*\(` pattern above does not match. `(?:<[^<>]*>)?` accepts one level of
# generic (this codebase's real usage: `<{ id: string }>`, no nested angle brackets); a more
# exotic nested generic just fails to match here, same MISS-over-false-positive tradeoff this
# file already states throughout, not a new one.
FUNCTION_SIGNAL = re.compile(
    r"\b(requireAuth|requireAdmin|requireSalonOwner|requireRole|resolveBookingActor|"
    r"createHmac|timingSafeEqual|getActiveSalon|clientBelongsToSalon|verifyAccessToken|"
    r"findQueueEntryByToken)\s*(?:<[^<>]*>)?\s*\("
)
STRING_SIGNAL = re.compile(r"\b(CRON_SECRET|stripe-signature)\b")
# Category 1 (2026-07-16 fix): the inline admin check used ~35+ times instead
# of the named requireAdmin() helper -- `profile?.role !== "admin"`.
ROLE_CHECK = re.compile(
    r"\.\s*role\s*(?:!==|===)\s*[\"']admin[\"']|[\"']admin[\"']\s*(?:!==|===)\s*[\w.?]*\.\s*role"
)
# Category 2 (2026-07-16 fix): ownership expressed as a plain JS comparison
# after a joined select -- `salonOwner !== user.id` / `!== session.user.id`.
OWNERSHIP_COMPARISON = re.compile(
    r"(?:!==|===)\s*(?:session\s*\.\s*)?user\??\s*\.\s*id\b"
    r"|\b(?:session\s*\.\s*)?user\??\s*\.\s*id\s*(?:!==|===)"
)
# Corpus-verification fix (2026-07-16): a query scoped to the CALLER'S OWN
# id (`.eq(<any column>, user.id)` or a variable assigned straight from
# user.id/session.user.id, e.g. `const userId = user?.id`) is unambiguously
# safe no matter what column it filters, because the bound value cannot be
# client-supplied. Narrow on purpose: only a DIRECT `user.id`/`session.user.id`
# expression, or a variable whose ENTIRE initializer is that expression,
# counts -- anything else (a client param, a joined-table field, a computed
# expression) is left alone, so this cannot be used to wave through the
# reviewer's IDOR shape (`.eq("salon_id", salonId)` where `salonId` comes
# from `searchParams.get(...)`).
SELF_ID_EXPR = r"(?:session\s*\.\s*)?user\??\s*\.\s*id"
SELF_ID_ONLY = re.compile(r"^" + SELF_ID_EXPR + r"$")
SELF_ID_VAR_ASSIGN = re.compile(
    r"\b(?:const|let|var)\s+(\w+)\s*(?::[^=]+)?=\s*" + SELF_ID_EXPR + r"\b"
)
EQ_CALL = re.compile(r"\.eq\(\s*[\"']\w+[\"']\s*,\s*([\w.$?]+)\s*\)")
# One extra hop: a locally-defined helper (e.g. `async function requireUser() { ... return
# user?.id ?? null; }`, seen in app/api/discovery/collections/[id]/route.ts and its items/
# sub-route) that wraps the same user.id read. Only counts if the FUNCTION is DEFINED in
# this same content and a user.id/session.user.id reference appears in a window right after
# its opening brace (window, not brace-matching, because a destructured `{ data: { user } }`
# inside the body defeats a naive "stop at the first `}`" body capture) -- an imported
# helper from another file does not satisfy this (correctly conservative: an import alone
# proves nothing about what the helper actually checks).
LOCAL_FN_START = re.compile(r"(?:async\s+)?function\s+(\w+)\s*\([^)]*\)\s*\{")
LOCAL_FN_WINDOW = 250
VAR_FROM_CALL = re.compile(
    r"\b(?:const|let|var)\s+(\w+)\s*(?::[^=]+)?=\s*(?:await\s+)?(\w+)\s*\("
)


def strip_comments(s):
    """House approximation, not a full JS/TS tokenizer: strips /* */ and // comments so a
    signal name can no longer satisfy this gate by merely being mentioned in a comment (see
    FUNCTION_SIGNAL note above). Does not special-case `//` inside a string/URL literal on the
    same line as a real signal call -- accepted, because that only makes the gate MORE likely
    to ask for an explicit auth call elsewhere in the file, never less strict."""
    s = re.sub(r"/\*.*?\*/", "", s, flags=re.S)
    s = re.sub(r"//[^\n]*", "", s)
    return s


def local_self_id_fn_names(content):
    names = set()
    for m in LOCAL_FN_START.finditer(content):
        window = content[m.end():m.end() + LOCAL_FN_WINDOW]
        if re.search(SELF_ID_EXPR, window):
            names.add(m.group(1))
    return names


def self_scoped_vars(content):
    self_vars = set(SELF_ID_VAR_ASSIGN.findall(content))
    local_self_id_fns = local_self_id_fn_names(content)
    for varname, fnname in VAR_FROM_CALL.findall(content):
        if fnname in local_self_id_fns:
            self_vars.add(varname)
    return self_vars


def has_self_scoped_query(content):
    self_vars = self_scoped_vars(content)
    for m in EQ_CALL.finditer(content):
        val = m.group(1).strip()
        if SELF_ID_ONLY.match(val) or val in self_vars:
            return True
    return False


# 2026-08-19 stress-test fix: app/api/stripe/booking-pay-intent/route.ts is real, shipped
# ownership-checking code this gate would have blocked if rewritten from scratch (proven via
# hook-probe Write-simulation) -- `const userId = user?.id ?? null; ... if (!userId ||
# userId !== booking.user_id) return 403`. `userId` IS a self-scoped var per SELF_ID_VAR_ASSIGN
# (assigned straight from `user?.id`), but the OLD OWNERSHIP_COMPARISON regex only recognized
# a comparison against the literal text `user.id`/`session.user.id`, not a comparison against
# a variable that traces back to it, and EQ_CALL only covers `.eq()` calls, not a plain JS `if`
# comparison. Same reasoning as has_self_scoped_query: once one side of a `!==`/`===` is
# PROVABLY the caller's own verified identity (a direct `user.id`/`session.user.id` expression,
# or a var whose entire initializer is exactly that), the comparison is safe no matter what the
# other side is, because the anchor side cannot be attacker-controlled. This does not verify the
# comparison's result actually GATES access (no control-flow tracing) -- same accepted
# MISS-over-false-positive tradeoff already stated for OWNERSHIP_COMPARISON and EQ_CALL above,
# not a new relaxation.
COMPARISON = re.compile(r"([\w.$?\[\]]+)\s*(?:!==|===)\s*([\w.$?\[\]]+)")


def has_self_scoped_comparison(content):
    self_vars = self_scoped_vars(content)
    for m in COMPARISON.finditer(content):
        for side in (m.group(1).strip(), m.group(2).strip()):
            if SELF_ID_ONLY.match(side) or side in self_vars:
                return True
    return False


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
    2026-08-19 stress-test pass: BAD/GOOD are the original pair; SNEAKY_COMMENT reproduces the
    comment-only-mention bypass found live that day (GATE_LAW failure shape 3) and must now
    DENY; SELF_SCOPED reproduces the has_self_scoped_query() legitimate pattern and must ALLOW."""
    import subprocess

    HERE = __file__
    BAD = (
        'import { createAdminSupabaseClient } from "@/lib/supabase/admin";\n'
        "export async function GET(req) {\n"
        "  const supabase = createAdminSupabaseClient();\n"
        '  const clientId = req.nextUrl.searchParams.get("client_id");\n'
        '  const { data } = await supabase.from("clients").select("*").eq("id", clientId);\n'
        "  return Response.json(data);\n"
        "}"
    )
    GOOD = (
        'import { createAdminSupabaseClient } from "@/lib/supabase/admin";\n'
        'import { requireAuth } from "@/lib/auth/require";\n'
        "export async function GET(req) {\n"
        "  const user = await requireAuth(req);\n"
        "  const supabase = createAdminSupabaseClient();\n"
        '  const clientId = req.nextUrl.searchParams.get("client_id");\n'
        '  const { data } = await supabase.from("clients").select("*").eq("owner_id", user.id).eq("id", clientId);\n'
        "  return Response.json(data);\n"
        "}"
    )
    SNEAKY_COMMENT = (
        "// TODO: add requireAuth check later\n"
        'import { createAdminSupabaseClient } from "@/lib/supabase/admin";\n'
        "export async function GET(req) {\n"
        "  const supabase = createAdminSupabaseClient();\n"
        '  const clientId = req.nextUrl.searchParams.get("client_id");\n'
        '  const { data } = await supabase.from("clients").select("*").eq("id", clientId);\n'
        "  return Response.json(data);\n"
        "}"
    )
    SELF_SCOPED = (
        'import { createAdminSupabaseClient } from "@/lib/supabase/admin";\n'
        "export async function GET(req) {\n"
        "  const { data: { user } } = await supabaseSession.auth.getUser();\n"
        "  const supabase = createAdminSupabaseClient();\n"
        '  const bookingId = req.nextUrl.searchParams.get("booking_id");\n'
        '  const { data } = await supabase.from("bookings").select("*").eq("user_id", user.id);\n'
        "  return Response.json(data);\n"
        "}"
    )
    ESCAPE_HATCH = (
        "// ownership-ok: public salon lookup, no ownership concept\n"
        'import { createAdminSupabaseClient } from "@/lib/supabase/admin";\n'
        "export async function GET(req) {\n"
        "  const supabase = createAdminSupabaseClient();\n"
        '  const id = req.nextUrl.searchParams.get("id");\n'
        '  const { data } = await supabase.from("salons").select("*").eq("id", id);\n'
        "  return Response.json(data);\n"
        "}"
    )
    # Reproduces app/api/bookings/walk-in/route.ts's real shape (14 real files use this):
    # createAdminSupabaseClient() + a client-supplied id, ownership resolved via
    # `getActiveSalon<{ id: string }>(...)` -- a TypeScript generic argument between the name
    # and the call parens. Must ALLOW.
    GENERIC_CALL = (
        'import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase";\n'
        'import { getActiveSalon } from "@/lib/active-salon";\n'
        "export async function POST(req) {\n"
        "  const supabase = await createServerSupabaseClient();\n"
        "  const { data: { user } } = await supabase.auth.getUser();\n"
        '  const salon = await getActiveSalon<{ id: string }>(supabase, user.id, "id");\n'
        "  const admin = createAdminSupabaseClient();\n"
        '  const staffId = req.nextUrl.searchParams.get("staff_id");\n'
        '  const { data } = await admin.from("staff").select("*").eq("id", staffId).eq("salon_id", salon.id);\n'
        "  return Response.json(data);\n"
        "}"
    )
    # Reproduces app/api/stripe/booking-pay-intent/route.ts's real shape: ownership is a plain
    # JS comparison between a self-scoped var and a DIFFERENTLY NAMED field on another object
    # (`userId !== booking.user_id`), not the literal `user.id` text OWNERSHIP_COMPARISON alone
    # recognizes. Must ALLOW.
    SELF_SCOPED_COMPARISON = (
        'import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase";\n'
        "export async function POST(req) {\n"
        "  const supabase = await createServerSupabaseClient();\n"
        "  const { data: { user } } = await supabase.auth.getUser();\n"
        "  const userId = user?.id ?? null;\n"
        "  const admin = createAdminSupabaseClient();\n"
        '  const bookingId = (await req.json()).booking_id;\n'
        '  const { data: booking } = await admin.from("bookings").select("*").eq("id", bookingId).single();\n'
        "  if (!userId || userId !== booking.user_id) {\n"
        '    return Response.json({ error: "Not authorized" }, { status: 403 });\n'
        "  }\n"
        "  return Response.json(booking);\n"
        "}"
    )

    cases = [
        ("BAD (no auth, client id)", "Write", "app/api/probe-bad2/route.ts", BAD, "deny"),
        ("GOOD (requireAuth called)", "Write", "app/api/probe-good2/route.ts", GOOD, "allow"),
        ("SNEAKY_COMMENT (mention, not a call)", "Write", "app/api/probe-sneaky2/route.ts",
         SNEAKY_COMMENT, "deny"),
        ("SELF_SCOPED (.eq scoped to user.id)", "Write", "app/api/probe-selfscoped2/route.ts",
         SELF_SCOPED, "allow"),
        ("ESCAPE_HATCH (ownership-ok: in comment)", "Write", "app/api/probe-escape2/route.ts",
         ESCAPE_HATCH, "allow"),
        ("wrong tool (Edit, scope check)", "Edit", "app/api/probe-bad2/route.ts", BAD, "allow"),
        ("dev-only route exempt", "Write", "app/api/dev/probe/route.ts", BAD, "allow"),
        ("GENERIC_CALL (getActiveSalon<{...}>()", "Write", "app/api/probe-generic/route.ts",
         GENERIC_CALL, "allow"),
        ("SELF_SCOPED_COMPARISON (userId !== booking.user_id)", "Write",
         "app/api/probe-selfcompare/route.ts", SELF_SCOPED_COMPARISON, "allow"),
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
    if not FIRE_PATH.search(path):
        allow()
    # dev-only routes are hard-404'd outside NODE_ENV=development (see app/api/dev/login/
    # route.ts), so they are never a live IDOR surface. Matches the house convention already
    # established in no-unauth-money-route.py.
    if "/api/dev/" in path:
        allow()

    content = str(ti.get("content") or "")
    if not content:
        allow()

    if ESCAPE.search(content):
        allow()

    code = strip_comments(content)

    if (ADMIN_CLIENT.search(code)
            and CLIENT_SUPPLIED.search(code)
            and not FUNCTION_SIGNAL.search(code)
            and not STRING_SIGNAL.search(code)
            and not ROLE_CHECK.search(code)
            and not OWNERSHIP_COMPARISON.search(code)
            and not has_self_scoped_query(code)
            and not has_self_scoped_comparison(code)):
        deny(
            "BLOCKED (service-role IDOR risk): this new route calls createAdminSupabaseClient() "
            "(service-role key, BYPASSES RLS entirely) AND reads a client-supplied identifier "
            "(a route param / searchParams / a req.json() field), but has NO authorization "
            "signal anywhere in the content: no requireAuth/requireAdmin/requireSalonOwner/"
            "requireRole/resolveBookingActor/getActiveSalon/clientBelongsToSalon/"
            "verifyAccessToken check, no CRON_SECRET/stripe-signature/HMAC verification, no "
            "inline `.role !== \"admin\"` check, no ownership comparison against "
            "`user.id`/`session.user.id`, and no query scoped to the caller's own id. Because "
            "RLS does not apply under the "
            "service-role key, this is a direct IDOR: any authenticated (or unauthenticated) "
            "caller can pass ANY id and read/write someone else's row. Three separate audit "
            "waves found this exact class (CRM routes taking an arbitrary client_id, "
            "barber-leaderboard, walkin-analytics, cross-salon walkin/queue PATCH), roughly 20 "
            "routes. Use a helper from lib/auth/require.ts (requireAuth / requireAdmin / "
            "requireSalonOwner / requireRole), or constrain the query to the caller's own "
            "salon/user before the admin client touches the row. If this route genuinely needs "
            "no ownership check, add `ownership-ok:` anywhere in the new content."
        )
    allow()
except Exception:
    allow()
