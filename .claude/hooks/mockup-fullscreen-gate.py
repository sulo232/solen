#!/usr/bin/env python3
"""
MOCKUP-FULLSCREEN GATE (owner 2026-07-18: "its not full screen ... harden gaye for mockup").

A mockup opened on the owner's PHONE must FILL the screen, not render as a tiny centered device
frame floating in whitespace. This blocks the not-full-screen anti-pattern in a mockup .html Write:
  - a fixed-width small frame (.phone / .frame / .device / .screen with width: 300-460px) that is
    CENTERED (margin: 0 auto), AND
  - the body has notable padding (>= 28px), AND
  - there is NO full-screen signal (100vh/100dvh, width:100% / 100vw on the surface, or a @media
    max-width rule making the frame full width).

Full-screen mockups (fill the viewport, minimal/no body padding, 100% width surface, or a mobile
media query that drops the frame) PASS. Deliverable comparisons should fill the screen and use a
toggle/swipe, never two tiny frames side by side.

Fires only on Write/Edit of an .html under public/_mockups/. Skip valve: touch ~/.claude/mockup-fullscreen-skip.flag
"""
import sys, os, json, re, time

def out(msg):
    sys.stderr.write(msg + "\n"); sys.exit(2)

def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)
    ti = data.get("tool_input") or {}
    fp = ti.get("file_path") or ""
    if "/_mockups/" not in fp or not fp.endswith(".html"):
        sys.exit(0)
    # skip valve
    flag = os.path.expanduser("~/.claude/mockup-fullscreen-skip.flag")
    if os.path.exists(flag) and (time.time() - os.path.getmtime(flag) < 300):
        sys.exit(0)
    content = ti.get("content")
    if content is None:  # Edit: only have new_string; check it if present
        content = ti.get("new_string") or ""
    css = content.lower()

    # full-screen signals , any one of these = this fills the viewport, pass
    fullscreen_signals = [
        "100vh", "100dvh", "100svh",           # viewport-height surface
        "min-height:100%", "min-height: 100%",
        "height:100%", "height: 100%",         # html,body{height:100%}
    ]
    has_fs = any(s in css for s in fullscreen_signals)
    # a mobile media query that removes/overrides the frame width also counts
    if re.search(r"@media[^{]*max-width[^{]*\{[^}]*width\s*:\s*100(%|vw)", css):
        has_fs = True
    # a surface set to full width
    if re.search(r"\.(screen|surface|app|afwrap|stage|pane)\b[^}]*width\s*:\s*(100%|100vw)", css):
        has_fs = True

    # anti-pattern: a small fixed-width frame centered with margin:0 auto
    frame = re.search(r"\.(phone|frame|device|card-frame)\b[^}]*width\s*:\s*(2[89]\d|3\d\d|4[0-5]\d)px", css)
    centered = ("margin:0 auto" in css) or ("margin: 0 auto" in css)
    # body padding value (first number)
    bodypad = 0
    m = re.search(r"body\s*\{[^}]*padding\s*:\s*(\d+)px", css)
    if m:
        bodypad = int(m.group(1))

    if frame and centered and bodypad >= 28 and not has_fs:
        fw = frame.group(2) if frame else "?"
        out(
            "MOCKUP-FULLSCREEN GATE (owner 2026-07-18 'its not full screen, harden gaye'): this mockup renders as a\n"
            f"SMALL centered device frame (fixed width ~{fw}px, margin:0 auto) inside a padded page (body padding {bodypad}px),\n"
            "so on the owner's PHONE it shows tiny with whitespace around it , not full screen.\n"
            "FIX: make the mockup FILL the viewport:\n"
            "  - html,body with height:100% and margin:0 , no big body padding.\n"
            "  - the screen surface fills width 100 percent (cap with max-width for desktop, full-bleed on mobile),\n"
            "    fixed top bar / bottom bar via position:fixed, content scrolls.\n"
            "  - for a before/after: ONE full-screen view with a Before/After TOGGLE or swipe, never two tiny frames\n"
            "    side by side (the owner cannot see those on mobile).\n"
            "Reference: public/_mockups/liftup-services-fs/ (full-screen with a toggle). Skip once: touch ~/.claude/mockup-fullscreen-skip.flag"
        )
    sys.exit(0)

if __name__ == "__main__":
    main()
