#!/usr/bin/env python3
"""
mockup-real-photos-gate.py  (PreToolUse: Write | Edit)

Owner 2026-07-22 (verbatim): "not some fake mockups u made, acc mockups that looks like real
components, harden the gate cz u always become lazy w mockups."

The lazy pattern: building a product-surface mockup as a from-scratch redraw where every photo is
faked with a CSS gradient or a single-letter-in-a-box avatar, instead of the real captured
components/photos. This gate BLOCKS that: a mockup that clearly depicts a Solen product surface
(salon cards, booking, prices) must carry REAL imagery (a real <img src>, a background-image url,
or a data-URI photo), not only placeholders.

Exit 0 = allow. Exit 2 = block. Escape (genuinely photoless surface): touch ~/.claude/mockup-photos-skip.flag
Self-test: pipe {"tool_input":{"file_path":"x.html","content":"..."}} on stdin.
"""
import json, sys, re, os


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)
    # per-incident escape flag
    flag = os.path.expanduser("~/.claude/mockup-photos-skip.flag")
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
    low = content.lower()

    # Only enforce on mockups that DEPICT a real product surface (salon cards / booking / prices).
    product = re.search(r"ab chf|saloncard|salonresultcard|termin buchen|bezahlen chf|empfohlen f", low)
    if not product:
        sys.exit(0)

    # Real imagery present? (real <img src>, background-image url, or data-URI photo)
    if re.search(r"<img\b[^>]*\bsrc\s*=", low) or re.search(r"background-image\s*:\s*url\(", low) \
       or re.search(r'src\s*=\s*["\']data:image', low):
        sys.exit(0)

    # Lazy tells: gradients used as photo fills and/or single-letter avatar placeholders.
    gradients = len(re.findall(r"linear-gradient\(", low))
    letter_avatars = len(re.findall(r">\s*[A-Z]\s*<\s*/\s*(div|span)>", content))
    if gradients >= 2 or letter_avatars >= 2:
        sys.stderr.write(
            "MOCKUP-REAL-PHOTOS GATE (owner 2026-07-22, anti-lazy-mockup): this product mockup fakes "
            "ALL imagery with placeholders (CSS gradients / single-letter avatars) and has zero real "
            "photos. That is the from-scratch redraw the owner rejects. Ground it in the REAL rendered "
            "components: capture the real surface (screenshot) or use real <img src> / background-image "
            "url / data-URI photos. Escape only if the surface is genuinely photoless: "
            "touch ~/.claude/mockup-photos-skip.flag\n"
        )
        sys.exit(2)
    sys.exit(0)


if __name__ == "__main__":
    main()
