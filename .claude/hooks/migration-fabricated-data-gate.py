#!/usr/bin/env python3
"""migration-fabricated-data-gate: PreToolUse (Edit|Write|MultiEdit), BLOCKING.

Backend audit ground truth: supabase/migrations/20260530_seed_salon_amenities.sql
(lines 11-21) sets nine amenity booleans on the LIVE `salons` table from
`abs(hashtext(id || salt)) % 100 < N`. Verified on prod 2026-07-16: all 20
active salons still exactly equal the hash output, so 7 salons currently
claim wheelchair access and 8 claim LGBTQ+ welcome purely as a function of
their UUID, not a real fact anyone reported. These render to real customers
at app/[locale]/_components/salon/SalonAdditionalInfo.tsx:54-62 and as live
search filter facets. The existing scripts/hooks/fabricated-value-gate.py
only scans .tsx, so the migration surface (the actual source of this
specific fabrication) is uncovered.

DENIES an Edit/Write/MultiEdit under supabase/migrations/**/*.sql whose
ADDED content has an INSERT/UPDATE statement present AND a value expression
that uses a non-deterministic or hash-derived source to synthesize a
value: `hashtext(` / `random()` / `md5(` combined with a modulo (`%`), or
`gen_random_uuid()` used inside a `%` or comparison operator to synthesize
a boolean/enum/number. `gen_random_uuid()` used plainly as a PRIMARY KEY
default is legitimate and never fires (no modulo/comparison follows it on
the same clause).

Escape hatch: put `seed-ok:` (case-insensitive) anywhere in the added
content if this is a deliberate `is_test = true` fixture row or otherwise
genuinely fine.

Fail-open on any internal error, matching the house pattern
(no-select-star-sensitive.py, money-update-cas-gate.py).

2026-08-18 audit (real payloads driven through the gate) found two misses:
  - `random() < 0.35` fabricates a boolean directly off a probability threshold and needs no
    modulo at all, so HASH_MOD (which requires a `%`) never saw it. This is the MOST natural way
    to write this bug, more natural than the modulo form the gate was built around. Added a
    dedicated random()-vs-threshold check.
  - The hash-to-modulo window was a fixed 80 characters between the hash call and the `%`. The
    real migration's own salts are short ('wheel', 'transit'), but nothing stops a longer salt
    expression (a descriptive string, a concatenation of several columns) from pushing the `%`
    past char 80, defeating detection on the exact same fabrication shape. Widened to 300.
"""
import json, re, sys

FIRE_PATH = re.compile(r"supabase/migrations/.+\.sql$")
ESCAPE = re.compile(r"seed-ok\s*:", re.I)

STATEMENT = re.compile(r"\b(insert|update)\b", re.I)
HASH_MOD = re.compile(r"\b(hashtext|random|md5)\s*\(.{0,300}?%\s*\d", re.I | re.S)
UUID_SYNTH = re.compile(r"gen_random_uuid\(\)[^;,\n]{0,40}[%<>]")
# random() compared straight against a probability threshold, no modulo needed at all
# (`random() < 0.35`, `random() > 0.7`) , 2026-08-18, the natural way to fabricate a boolean.
RANDOM_THRESHOLD = re.compile(r"\brandom\s*\(\s*\)\s*[<>]=?\s*\d", re.I)


def allow():
    sys.exit(0)


def deny(msg):
    print(json.dumps({"hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "deny",
        "permissionDecisionReason": msg,
    }}))
    sys.exit(0)


def find_hit(content):
    """The fabricated-data match in content, or None. Pure (no I/O); shared by the live gate
    and --selftest so they exercise the exact same decision path."""
    if ESCAPE.search(content):
        return None
    if not STATEMENT.search(content):
        return None
    m = HASH_MOD.search(content)
    if m:
        return f"`{m.group(0)[:60]}`"
    m = UUID_SYNTH.search(content)
    if m:
        return f"`{m.group(0)[:60]}`"
    m = RANDOM_THRESHOLD.search(content)
    if m:
        return f"`{m.group(0)[:60]}`"
    return None


def _selftest():
    cases = [
        # (content, should_block, label)
        ("update salons set wheelchair_accessible = abs(hashtext(id::text || 'wheel')) % 100 < 45;",
         True, "real ground-truth shape: hashtext + modulo, short salt"),
        (
            "update salons set kid_friendly = abs(hashtext(id::text || "
            "'a-much-longer-descriptive-salt-string-used-to-push-well-past-the-old-eighty-char-window')) "
            "% 100 < 40;",
            True, "hash-to-modulo window widened: a longer salt must still be caught",
        ),
        ("update salons set kid_friendly = random() < 0.35;", True, "random() vs threshold, no modulo at all"),
        ("update salons set pet_friendly = random() > 0.7;", True, "random() vs threshold, > direction"),
        ("insert into t (id) values (gen_random_uuid());", False, "gen_random_uuid() as a plain PK default"),
        ("update salons set featured = (gen_random_uuid()::text < 'm');", True, "gen_random_uuid() used in a comparison to synthesize a value"),
        ("update salons set is_active = true where id = '1';", False, "an ordinary UPDATE, no fabrication source"),
        ("update salons set kid_friendly = random() < 0.35; -- seed-ok: deliberate demo fixture",
         False, "escape hatch present"),
        ("alter table salons add column foo text; -- no insert/update statement at all",
         False, "no INSERT/UPDATE present"),
    ]
    failed = 0
    for content, should_block, label in cases:
        hit = find_hit(content)
        blocked = bool(hit)
        ok = blocked == should_block
        print(("PASS" if ok else "FAIL") + f": {label} -> blocked={blocked} want={should_block}")
        if not ok:
            failed += 1
    print(f"\n{len(cases) - failed}/{len(cases)} passed")
    return 1 if failed else 0


if __name__ == "__main__" and "--selftest" in sys.argv:
    sys.exit(_selftest())

try:
    data = json.load(sys.stdin)
except Exception:
    allow()

try:
    ti = data.get("tool_input") or {}
    path = str(ti.get("file_path") or "")
    if not FIRE_PATH.search(path):
        allow()

    content = ti.get("content")
    if content is None:
        content = ti.get("new_string")
    if content is None:
        edits = ti.get("edits")
        if isinstance(edits, list):
            content = "\n".join(str(e.get("new_string") or "") for e in edits if isinstance(e, dict))
    content = str(content or "")
    if not content:
        allow()

    hit = find_hit(content)

    if hit:
        deny(
            f"BLOCKED (fabricated data in a migration): this INSERT/UPDATE derives a column "
            f"value from a hash/random/uuid source combined with a modulo or comparison ({hit}), "
            "the exact shape of supabase/migrations/20260530_seed_salon_amenities.sql, which sets "
            "wheelchair_accessible / lgbtq_friendly / kid_friendly and 6 other amenity booleans "
            "from `abs(hashtext(id || salt)) % 100 < N`. Verified on prod 2026-07-16: all 20 "
            "active salons still exactly equal that hash output, so today 7 salons claim "
            "wheelchair access and 8 claim LGBTQ+ welcome purely as a function of their UUID. "
            "This writes a fabricated value into a column real customers read at "
            "SalonAdditionalInfo.tsx and as a live search filter facet: a value not wired to a "
            "real source is a lie the user trusts, and for accessibility/identity claims this is "
            "real-world harm and plausibly Swiss legal exposure. Seed only `is_test = true` rows, "
            "or leave the column NULL until a real owner self-reports. If this genuinely is a "
            "test fixture or otherwise fine, add `seed-ok:` anywhere in the new content."
        )
    allow()
except Exception:
    allow()
