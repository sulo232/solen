#!/usr/bin/env python3
"""mockup-depicts-gate.py , every feature a mockup DRAWS must trace to something real.

WHY THIS EXISTS (owner, 2026-07-15, after the same failure "over and over and over"):
  "you don't check what actually exists and doesn't. you're just pissing me off always."

The hole it closes: `pre-build-exists-check.sh` only proves that `npm run exists` was RUN
before creating a mockup. It never checks that the features the mockup actually DRAWS are
real. So `npm run exists dashboard` was run (gate satisfied), and then a walk-in "Waiting
list + Check in" panel was drawn on the universal operator home , a flow that does not
exist (real walk-in is barbershop-only and PAY-FIRST: pay -> number -> show up), while the
graveyard already bans queue-join / wait-time widgets. Running the check and then drawing
fiction is exactly the failure mode.

A pure keyword match on the graveyard is NOT enough and this gate does not pretend it is:
the drawn copy said "Waiting 8 min" while the graveyard says "wait-time-on-pay". No regex
bridges that. So the load-bearing arm is the MANIFEST: you must enumerate what you draw and
cite where each thing lives. If you cannot cite it, you are inventing it.

TWO ARMS (PreToolUse on Write|Edit to public/_mockups/**):
  ARM 1 GRAVEYARD  , the mockup's VISIBLE copy contains a distinctive multi-token keyword
                     from _design-system/REMOVED.md -> BLOCK (re-proposing a killed thing).
  ARM 2 DEPICTS    , the mockup must carry a `Depicts:` manifest, one line per feature
                     surface it draws, each tracing to a real path/route OR an explicit
                     `NET-NEW:` declaration -> otherwise BLOCK.

Override (you have genuinely traced every surface another way):
  echo "<reason>" > .claude/depicts-skip.flag     (non-blank reason on line 1, 15-min TTL)
"""
import json
import os
import re
import sys
import time

HTML_EXT = (".html", ".htm")


def visible_copy(html: str) -> str:
    """User-visible text only: no comments, no <style>/<script>, no tags, no attributes."""
    html = re.sub(r"<!--.*?-->", " ", html, flags=re.S)
    html = re.sub(r"<style\b.*?</style>", " ", html, flags=re.S | re.I)
    html = re.sub(r"<script\b.*?</script>", " ", html, flags=re.S | re.I)
    html = re.sub(r"<svg\b.*?</svg>", " ", html, flags=re.S | re.I)
    html = re.sub(r"<[^>]+>", " ", html)
    return re.sub(r"\s+", " ", html).lower()


def norm(s: str) -> str:
    """Lowercase, separators -> single space, so 'wait-time' and 'wait time' both match."""
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9]+", " ", s.lower())).strip()


def graveyard_phrases(removed_md: str):
    """Distinctive phrases from REMOVED.md keyword fields.

    Only multi-token (hyphenated) keywords are used. Single generic words like 'compare',
    'packages' or 'queue' are DELIBERATELY skipped: the live dashboard legitimately ships a
    Pakete/bundles page and a queue tracker, so matching them would cry wolf and get this
    gate waved off, which is how the other gates died.
    """
    out = []
    for line in removed_md.splitlines():
        line = line.strip()
        if not line.startswith("- ") or "|" in line[:2]:
            continue
        body = line[2:]
        if "|" not in body:
            continue
        kw_field, rest = body.split("|", 1)
        what = rest.split("|")[0].strip()
        for tok in kw_field.split():
            if tok.count("-") >= 1 and len(tok) >= 8:
                phrase = norm(tok)
                if len(phrase.split()) >= 2:
                    out.append((phrase, what, tok))
    return out


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        sys.exit(0)

    tool = payload.get("tool_name") or ""
    if tool not in ("Write", "Edit", "MultiEdit"):
        sys.exit(0)

    ti = payload.get("tool_input") or {}
    path = ti.get("file_path") or ""
    if "public/_mockups/" not in path.replace("\\", "/"):
        sys.exit(0)
    if not path.lower().endswith(HTML_EXT):
        sys.exit(0)

    project = os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()

    # Acknowledged override: non-blank reason, 15-min TTL.
    flag = os.path.join(project, ".claude", "depicts-skip.flag")
    if os.path.isfile(flag):
        age = time.time() - os.path.getmtime(flag)
        try:
            reason = open(flag).readline().strip()
        except Exception:
            reason = ""
        if age < 900 and reason:
            sys.exit(0)

    # The content being written. For Edit we only see the fragment, so the manifest arm is
    # skipped for Edits (the file already passed it on create); the graveyard arm still runs.
    content = ti.get("content") or ti.get("new_string") or ""
    if not content.strip():
        sys.exit(0)
    is_full_write = tool == "Write" and bool(ti.get("content"))

    problems = []

    # ---- ARM 1: graveyard vs VISIBLE copy -------------------------------------------
    removed_path = os.path.join(project, "_design-system", "REMOVED.md")
    if os.path.isfile(removed_path):
        try:
            phrases = graveyard_phrases(open(removed_path, encoding="utf-8").read())
        except Exception:
            phrases = []
        copy = norm(visible_copy(content))
        for phrase, what, raw in phrases:
            if phrase and phrase in copy:
                problems.append(
                    "GRAVEYARD: the mockup's visible copy contains %r, which is on the\n"
                    "  REMOVED list: %s\n"
                    "  You are re-proposing something the owner deleted on purpose." % (raw, what[:150])
                )

    # ---- ARM 2: the Depicts manifest ------------------------------------------------
    if is_full_write:
        depicts = re.findall(r"Depicts:\s*(.+)", content)
        if not depicts:
            problems.append(
                "NO `Depicts:` MANIFEST. Every feature this mockup DRAWS must be traced to\n"
                "  something real BEFORE you draw it. Add one `Depicts:` line per surface in\n"
                "  the file's HTML comment, each tracing to a real path/route, e.g.\n"
                "    Depicts: today's appointments -> app/[locale]/dashboard/page.tsx (bookings fetch)\n"
                "    Depicts: walk-in queue -> app/[locale]/dashboard/barber-ops/page.tsx (BARBERSHOP ONLY, pay-first)\n"
                "    Depicts: chair cards -> NET-NEW: no per-chair live view exists today\n"
                "  A surface you cannot trace is a surface you are INVENTING. Run\n"
                "  `npm run exists <feature>` for each one first."
            )
        else:
            for d in depicts:
                d = d.strip()
                traced = ("->" in d or "→" in d)
                has_ref = bool(
                    re.search(r"(app/|components|lib/|api/|\.tsx|\.ts\b|/dashboard|NET-NEW|table\b)", d, re.I)
                )
                if not traced or not has_ref:
                    problems.append(
                        "UNTRACED `Depicts:` line: %r\n"
                        "  Each must be `<surface> -> <real path/route>` or `<surface> -> NET-NEW: <why>`." % d[:120]
                    )

    if problems:
        sys.stderr.write(
            "MOCKUP-DEPICTS GATE (owner 2026-07-15: 'you don't check what actually exists "
            "and doesn't', flagged as recurring):\n\n"
            + "\n\n".join("  " + p for p in problems)
            + "\n\nThe existing exists-gate only proves you RAN the check. This one asks what you "
            "actually DREW.\nDrawing a feature that does not exist (or has a different real shape) "
            "is the #1 way these\nmockups get rejected.\n"
            "Override (only if every surface is genuinely traced another way):\n"
            "  echo \"<reason>\" > .claude/depicts-skip.flag   (15-min TTL, non-blank reason)\n"
        )
        sys.exit(2)

    sys.exit(0)


if __name__ == "__main__":
    main()
