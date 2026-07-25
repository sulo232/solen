#!/usr/bin/env python3
"""mockup-fullscreen-gate.py , every page mockup must be a FULL-SCREEN, live BEFORE/AFTER of the REAL page.

WHY THIS EXISTS (owner, 2026-07-19, flagged as recurring , "i told you ALWAYS ... why do u keep
forgetting harden the gate"):
  The owner's mockup format is the liftup-*-fs pattern (2026-07-18): a mockup is a FULL-SCREEN preview
  of the real account/app page, with a Before/After toggle where BEFORE is a LIVE <iframe> of the real
  route and AFTER is the same page full-screen with ONLY the proposed change applied. Abstract, floating
  "Direction A / Direction B" comparison panels on a gray background are NOT that , they are the banned
  "from-scratch redraw" (project CLAUDE.md Mockup-FIRST rule: "NEVER a from-scratch HTML redraw ... capture
  the real route, modify the real DOM/component, show before/after"). Advice kept getting forgotten under
  task focus, so it becomes a gate.

WHAT IT REQUIRES (PreToolUse on full Write of public/_mockups/**/*.html, page mockups only):
  1. a live BEFORE  , an `<iframe ...>` of the real route (the actual current screen), and
  2. a Before/After toggle  , the words before AND after present as switch labels, and
  3. full-screen chrome  , `overflow:hidden` on the body OR a `position:fixed` shell (fills the viewport).
  Missing any -> BLOCK. The abstract A/B-panel format fails all three, which is the point.

EXEMPT (not page mockups): the gallery / link-index files (a `MOCKS`/link list, or 'gallery' in the path).

Override (a genuine exception , e.g. a net-new surface with no real page to iframe, owner-approved):
  echo "<reason>" > .claude/fullscreen-skip.flag     (non-blank reason on line 1, 15-min TTL)
"""
import json
import os
import re
import sys
import time

HTML_EXT = (".html", ".htm")

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try:
    from _nonsolen_surface import is_non_solen_surface
except Exception:  # helper missing or broken: fail CLOSED, keep gating as before
    def is_non_solen_surface(content, project_root):
        return False, "helper unavailable"


def _non_solen(content: str, project_root: str) -> bool:
    ok, _reason = is_non_solen_surface(content, project_root)
    return ok


def is_index(path: str, content: str) -> bool:
    """The gallery / link-index is not a page mockup: exempt it."""
    base = os.path.basename(os.path.dirname(path.replace("\\", "/"))).lower()
    if "gallery" in base or "gallery" in os.path.basename(path).lower():
        return True
    # A link index enumerates other mockups via a MOCKS array / a list of /_mockups/ links.
    if re.search(r"\bMOCKS\s*=", content) or content.count("/_mockups/") >= 3:
        return True
    return False


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        sys.exit(0)

    tool = payload.get("tool_name") or ""
    if tool not in ("Write", "Edit", "MultiEdit"):
        sys.exit(0)

    ti = payload.get("tool_input") or {}
    path = (ti.get("file_path") or "").replace("\\", "/")
    if "public/_mockups/" not in path or not path.lower().endswith(HTML_EXT):
        sys.exit(0)

    # Only a full Write carries the whole file (format is set at create-time). Edit fragments can't be
    # judged for full-page structure, so let the create-time gate own it.
    content = ti.get("content") or ""
    if tool != "Write" or not content.strip():
        sys.exit(0)

    project = os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()

    flag = os.path.join(project, ".claude", "fullscreen-skip.flag")
    if os.path.isfile(flag):
        try:
            reason = open(flag).readline().strip()
        except Exception:
            reason = ""
        if (time.time() - os.path.getmtime(flag)) < 900 and reason:
            sys.exit(0)

    if is_index(path, content):
        sys.exit(0)

    # A surface outside this repo has no route to iframe, so this gate's whole
    # premise is absent. Exempt it ONLY when the mockup cites real files that
    # exist outside the repo, which cannot be faked by assertion. See
    # _nonsolen_surface.py for why this exists instead of another skip flag.
    if _non_solen(content, project):
        sys.exit(0)

    lc = content.lower()
    iframe_count = lc.count("<iframe")
    has_iframe = iframe_count >= 1
    has_two_iframes = iframe_count >= 2
    # the AFTER must INJECT the change onto the real page + highlight it, not hand-draw a sparse copy
    has_injection = ("applychange" in lc) or ("data-sweep" in lc) or ("contentdocument" in lc)
    has_toggle = ("before" in lc) and ("after" in lc)
    has_fullscreen = ("overflow:hidden" in lc.replace(" ", "")) or ("position:fixed" in lc.replace(" ", ""))

    missing = []
    if not has_iframe:
        missing.append(
            "NO live BEFORE. Add an `<iframe src=\"<real route>\">` of the actual current screen as the\n"
            "  BEFORE pane (e.g. the real /de/profile or /de/dashboard route). A hand-drawn 'current' panel\n"
            "  is a from-scratch redraw, which is exactly what the owner rejects."
        )
    elif not (has_two_iframes and has_injection):
        missing.append(
            "AFTER IS A HAND-DRAWN REDRAW (owner 2026-07-19: 'these before after does not make any sense ...\n"
            "  you only made ONE section of the page, i dont even know where it is'). Both BEFORE and AFTER must\n"
            "  be a live <iframe> of the SAME real route (2 iframes). The AFTER pane applies the change by\n"
            "  INJECTING it onto the real page: poll contentDocument, run applyChange(doc) to edit + set\n"
            "  data-sweep-done + outline the changed element + add an 'After:' label + scrollIntoView. So the\n"
            "  AFTER is the FULL real page with the change highlighted in place, NOT a sparse hand-built copy with\n"
            "  placeholder blocks or fake data. Copy the mechanism from public/_mockups/sweep-salon-sections/index.html."
        )
    if not has_toggle:
        missing.append(
            "NO Before/After toggle. Add a segmented control with a `Before` and an `After` button that\n"
            "  swaps the live iframe for the full-screen AFTER (the liftup-*-fs pattern)."
        )
    if not has_fullscreen:
        missing.append(
            "NOT FULL-SCREEN. The mockup must fill the viewport like the real app screen: `overflow:hidden`\n"
            "  on the body + a fixed top bar + a fixed stage, not floating cards on a gray page."
        )

    if missing:
        abstract = ("direction a" in lc and "direction b" in lc)
        head = (
            "MOCKUP-FULLSCREEN GATE (owner 2026-07-19, recurring: 'ALWAYS a fullscreen preview of an\n"
            "account page + before/after ... why do u keep forgetting'):\n\n"
        )
        if abstract:
            head += (
                "  This is the ABSTRACT 'Direction A / Direction B' comparison-panel format. That is the\n"
                "  banned from-scratch redraw. Rebuild it as a FULL-SCREEN before/after of the real page.\n\n"
            )
        body = "\n\n".join("  " + m for m in missing)
        tail = (
            "\n\nThe format is the liftup-*-fs pattern: `<!-- Base: capture live --><!-- Scale: full-page -->`,\n"
            "a fixed top bar with a Before/After segmented toggle, BEFORE = a live <iframe> of the real route,\n"
            "AFTER = the same page full-screen with ONLY the proposed change applied. Copy the structure from\n"
            "public/_mockups/liftup-home-fs/index.html.\n"
            "Override (genuine net-new surface with no real page to iframe):\n"
            "  echo \"<reason>\" > .claude/fullscreen-skip.flag   (15-min TTL, non-blank reason)\n"
        )
        sys.stderr.write(head + body + tail)
        sys.exit(2)

    sys.exit(0)


def selftest():
    """python3 mockup-fullscreen-gate.py --selftest"""
    def check(content, path="public/_mockups/x/index.html"):
        payload = {"tool_name": "Write", "tool_input": {"file_path": path, "content": content}}
        import subprocess
        p = subprocess.run(
            [sys.executable, os.path.abspath(__file__)],
            input=json.dumps(payload), capture_output=True, text=True,
        )
        return p.returncode

    bad = (
        "<!doctype html><body style='background:#F4F4F5'>"
        "<div class='panel'><div class='plabel'>Direction A , gray fill</div></div>"
        "<div class='panel'><div class='plabel'>Direction B , current</div></div></body>"
    )
    handdrawn = (  # 1 iframe BEFORE + a hand-drawn AFTER = the sparse-redraw the owner rejected
        "<!doctype html><!-- Base: capture live --><!-- Scale: full-page -->"
        "<body style='overflow:hidden'><div class='seg'><button class='on'>Before</button>"
        "<button>After</button></div><div class='stage'>"
        "<div class='pane'><iframe src='/de/profile'></iframe></div>"
        "<div class='pane hidden'><div class='after'><div class='card'>hand drawn</div></div></div></div></body>"
    )
    good = (  # 2 iframes (before + after same route) + injected change (applyChange)
        "<!doctype html><!-- Base: capture live --><!-- Scale: full-page -->"
        "<body style='overflow:hidden'><div class='seg'><button class='on'>Before</button>"
        "<button>After</button></div><div class='stage'>"
        "<div class='pane'><iframe src='/de/profile'></iframe></div>"
        "<div class='pane hidden'><iframe id='afterFrame' src='/de/profile'></iframe></div></div>"
        "<script>function applyChange(doc){doc.querySelector('h2').setAttribute('data-sweep-done','1')}</script></body>"
    )
    index = "<!doctype html><body><script>var MOCKS=[{slug:'a'},{slug:'b'}]</script></body>"

    r_bad = check(bad)
    r_hand = check(handdrawn)
    r_good = check(good)
    r_index = check(index, "public/_mockups/sweep-gallery/index.html")
    ok = (r_bad == 2) and (r_hand == 2) and (r_good == 0) and (r_index == 0)
    print(f"abstract A/B panel     : {'BLOCK' if r_bad == 2 else 'MISS(' + str(r_bad) + ')'}")
    print(f"1-iframe hand-drawn After: {'BLOCK' if r_hand == 2 else 'MISS(' + str(r_hand) + ')'}")
    print(f"2-iframe injected After : {'PASS' if r_good == 0 else 'FALSE-BLOCK(' + str(r_good) + ')'}")
    print(f"gallery index          : {'PASS(exempt)' if r_index == 0 else 'FALSE-BLOCK(' + str(r_index) + ')'}")
    print("SELFTEST", "OK" if ok else "FAILED")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        selftest()
    main()
