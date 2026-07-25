#!/usr/bin/env python3
"""_nonsolen_surface.py , shared helper: is this mockup for a surface OUTSIDE this repo?

WHY THIS EXISTS (2026-07-25, after the cc-statusbar-panel mockup cost ~12 blocked
Write attempts):
  The mockup gate chain encodes assumptions that are true of every Solen product
  surface and false of anything else: that there is a live route to <iframe> as
  the BEFORE pane, and that LOCKFILE has a row to diff the design against. A
  mockup for a VS Code extension panel has neither. It has no URL at all, and
  LOCKFILE says nothing about a webview. Those gates fired correctly by their own
  logic and wrongly in substance, and the only way through was skip flags, which
  is how a gate stops meaning anything (see the unfinished-batch ledger: one flag
  armed 25 times).

  So this is NOT a new escape hatch. It is a narrower, self-declaring, and
  FALSIFIABLE statement of scope: a mockup may exempt itself from the two
  Solen-route-shaped requirements only by naming, in `Grounded-in:` lines, real
  files that exist on disk outside this repository. You cannot claim it by
  writing a sentence; you claim it by citing code that is demonstrably somewhere
  else. Everything else in the chain (exists-check, Depicts, palette, Lucide
  icons, copy rules, type budget, measurement) still applies in full, because
  none of those depend on the surface being a Solen route.

WHAT IT DOES NOT COVER:
  A Solen mockup with no Grounded-in line, or one whose paths point inside the
  repo, or one citing a path that does not exist. All three return False, so the
  gates behave exactly as before. The path-must-exist check is the load-bearing
  part: it makes an invented citation fail closed.
"""
import os
import re

# `Grounded-in: /abs/path.ts` , the same marker mockup-grounding-gate.sh already reads.
GROUNDED_RE = re.compile(r"Grounded-in:\s*([^\s<>|]+)", re.IGNORECASE)


def grounded_paths(content: str):
    """Every path cited on a Grounded-in line, in order, stripped of trailing punctuation."""
    return [m.group(1).rstrip(".,;") for m in GROUNDED_RE.finditer(content)]


def is_non_solen_surface(content: str, project_root: str):
    """(True, reason) when this mockup provably targets a surface outside this repo.

    Requires ALL of:
      1. at least one Grounded-in path,
      2. every one of them absolute and resolving outside project_root,
      3. every one of them actually existing on disk.

    Condition 3 is what keeps this honest: a made-up path outside the repo fails,
    so the exemption cannot be claimed by assertion, only by citation. Returns
    (False, reason) otherwise, with the reason naming which condition failed so a
    caller can put it in the block message.
    """
    paths = grounded_paths(content)
    if not paths:
        return False, "no Grounded-in line"

    root = os.path.realpath(project_root)
    outside = []
    for raw in paths:
        p = os.path.realpath(os.path.expanduser(raw))
        if p == root or p.startswith(root + os.sep):
            return False, f"Grounded-in path is inside this repo: {raw}"
        if not os.path.exists(p):
            return False, f"Grounded-in path does not exist: {raw}"
        outside.append(p)

    return True, f"{len(outside)} Grounded-in path(s), all real and all outside {root}"


if __name__ == "__main__":
    # Self-test. Run directly: python3 .claude/hooks/_nonsolen_surface.py
    root = os.path.realpath(os.path.join(os.path.dirname(__file__), "..", ".."))
    real_outside = "/Users/sulo/Documents/claude-statusbar/src/extension.ts"
    inside = os.path.join(root, "package.json")

    cases = [
        ("no marker at all", "<!-- just a mockup -->", False),
        ("path inside the repo", f"<!-- Grounded-in: {inside} -->", False),
        ("path that does not exist", "<!-- Grounded-in: /Users/sulo/nope/ghost.ts -->", False),
        ("one real path outside", f"<!-- Grounded-in: {real_outside} -->", True),
        (
            "two real paths outside",
            f"<!-- Grounded-in: {real_outside} -->\n<!-- Grounded-in: {real_outside} -->",
            True,
        ),
        (
            "mixed inside and outside fails closed",
            f"<!-- Grounded-in: {real_outside} -->\n<!-- Grounded-in: {inside} -->",
            False,
        ),
        (
            "real outside plus an invented one fails closed",
            f"<!-- Grounded-in: {real_outside} -->\n<!-- Grounded-in: /Users/sulo/nope/ghost.ts -->",
            False,
        ),
    ]

    failures = 0
    for name, content, want in cases:
        got, reason = is_non_solen_surface(content, root)
        ok = got is want
        if not ok:
            failures += 1
        print(f"{'ok  ' if ok else 'FAIL'} {name}: got={got} want={want} ({reason})")

    print(f"\n{len(cases) - failures}/{len(cases)} passed")
    raise SystemExit(1 if failures else 0)
