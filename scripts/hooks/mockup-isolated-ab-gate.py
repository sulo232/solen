#!/usr/bin/env python3
"""
mockup-isolated-ab-gate.py  (PreToolUse: Write | Edit)

Owner rejections (repeat pattern):
  - 2026-07-08 (REMOVED.md:56): "per-finding before/after panels are not the mockup model wanted."
    The /dev/audit-fixes before/after per-finding route was graveyarded; replaced by full-page
    copy-of-real-page mockups + the dev FLOW harness (/dev/flows).
  - 2026-07-13 (DRIFT_LEDGER): "decision mockups built as isolated A/B component panels (owner:
    makes no sense)."
  - 2026-07-23: an isolated mini-PDP A/B panel again ("makes no scence based on visual, i told you
    a full page pdp page mockup"). No gate caught it. This gate is the fix.

The banned model: ONE mockup file stacking MANY isolated "Current vs Proposed" (or "Before/After")
comparison panels, each a small out-of-context component. The wanted model: a FULL-PAGE copy of the
real page/screen with the proposed treatment applied (a single Current/Proposed TOGGLE on the whole
page is fine), or the /dev/flows harness for flow review.

Heuristic: >= 3 distinct Current/Proposed (or Before/After) comparison pairs in one mockup .html =
the per-finding panel model -> BLOCK. A single-toggle full-page mockup has 1 pair and passes.

Exit 0 = allow. Exit 2 = block. Escape (genuinely a legit multi-toggle page): touch ~/.claude/mockup-ab-skip.flag
Self-test: pipe {"tool_input":{"file_path":"x.html","content":"..."}} on stdin.
"""
import json, sys, re, os


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)

    flag = os.path.expanduser("~/.claude/mockup-ab-skip.flag")
    if os.path.exists(flag):
        try:
            os.remove(flag)
        except Exception:
            pass
        sys.exit(0)

    ti = data.get("tool_input", {}) or {}
    path = (ti.get("file_path") or "").lower()
    content = ti.get("content") or ti.get("new_string") or ""
    if not path.endswith((".html", ".htm")):
        sys.exit(0)
    # only mockup files
    if "mockup" not in path and "_mockups" not in path:
        sys.exit(0)

    # Count only VISIBLE text: strip <style>, <script>, and HTML comments so a single-toggle
    # page's CSS selectors ([data-rhythm="proposed"]) and JS (r==='current') don't read as panels.
    visible = re.sub(r"<style\b[^>]*>.*?</style>", " ", content, flags=re.S | re.I)
    visible = re.sub(r"<script\b[^>]*>.*?</script>", " ", visible, flags=re.S | re.I)
    visible = re.sub(r"<!--.*?-->", " ", visible, flags=re.S)
    low = visible.lower()

    # Count comparison-label occurrences. "proposed"/"current" are the decision-mockup vocabulary;
    # >before</ >after< as short pill labels are the other tell.
    n_current = len(re.findall(r"\bcurrent\b", low))
    n_proposed = len(re.findall(r"\bproposed\b", low))
    n_before = len(re.findall(r">\s*before\s*<", low))
    n_after = len(re.findall(r">\s*after\s*<", low))

    pairs = min(n_current, n_proposed) + min(n_before, n_after)

    # >= 3 comparison pairs in one file = the isolated per-finding panel model.
    if pairs >= 3:
        sys.stderr.write(
            "MOCKUP ISOLATED-A/B GATE (owner rejected this model 3x: 2026-07-08 REMOVED.md:56, "
            "2026-07-13 DRIFT_LEDGER, 2026-07-23): this mockup stacks {n} isolated Current/Proposed "
            "comparison panels. 'Per-finding before/after panels are not the mockup model wanted.' "
            "Rebuild as a FULL-PAGE copy of the real page/screen with the proposed treatment applied "
            "(one whole-page Current/Proposed TOGGLE is fine), or use the /dev/flows harness for a "
            "flow. Genuine multi-toggle page: touch ~/.claude/mockup-ab-skip.flag\n".format(n=pairs)
        )
        sys.exit(2)
    sys.exit(0)


if __name__ == "__main__":
    main()
