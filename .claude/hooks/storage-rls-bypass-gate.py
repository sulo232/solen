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
AUTH_SIGNAL = re.compile(
    r"\b(requireAuth|requireAdmin|requireSalonOwner|requireRole|resolveBookingActor|"
    r"CRON_SECRET|stripe-signature|createHmac|timingSafeEqual|getActiveSalon|"
    r"clientBelongsToSalon|verifyAccessToken|findQueueEntryByToken)\b"
)
ROLE_CHECK = re.compile(
    r"\.\s*role\s*(?:!==|===)\s*[\"']admin[\"']|[\"']admin[\"']\s*(?:!==|===)\s*[\w.?]*\.\s*role"
)
OWNERSHIP_COMPARISON = re.compile(
    r"(?:!==|===)\s*(?:session\s*\.\s*)?user\??\s*\.\s*id\b"
    r"|\b(?:session\s*\.\s*)?user\??\s*\.\s*id\s*(?:!==|===)"
)

WINDOW = 400


def allow():
    sys.exit(0)


def deny(msg):
    print(json.dumps({"hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "deny",
        "permissionDecisionReason": msg,
    }}))
    sys.exit(0)


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

    if not ADMIN_CLIENT.search(content):
        allow()
    if AUTH_SIGNAL.search(content) or ROLE_CHECK.search(content) or OWNERSHIP_COMPARISON.search(content):
        allow()

    hit = None
    for m in STORAGE_FROM.finditer(content):
        window = content[m.end():m.end() + WINDOW]
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
