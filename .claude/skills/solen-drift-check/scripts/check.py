"""Explicit-target, report-only Solen static drift candidate scanner."""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path



ALLOWED_HEX = {
    "#1E54B7",  # s-accent-deep hover step (DS-6, single-point rule in globals.css)
    "#FFC32B",  # star yellow — universal signal, see Q1
    "#FF3366",  # heart pink, universal --heart-active signal
    "#FFFFFF",  # white — fine inline
    "#FFF",     # white shorthand
    "#000000",  # near-pure black — flagged by humans not by checker
    "#000",
    "#D3D3D3",  # Fresha-exact input hairline
    "#FAD2DA",  # discount badge background
    "#FFF1E6",  # urgent badge background
    "#D1F0DC",  # availability mint background
    "#16A34A",  # s-brand DEFAULT — should be tokenized but appears in some inline glassStyle
    "#0A0A0A",  # s-ink — same caveat
    "#FFE8D8", "#E0703D",  # coiffeur
    "#EAE0D0", "#2A1F18",  # barbershop
    "#D4DDC8", "#A04A22",  # nails
    "#D4F2E0", "#0F6F44",  # spa
    "#E9DFC8", "#142F4A",
    "#E58840",
    "#F0C25A",
    "#6B6B6B",  # s-ink-2 / s-ink-3
    "#E7E5E4",  # avatar initial palette and dashboard chart grid; not s-border (#E4E4E7)
    "#F4F4F5",  # s-bg-sunken / s-bg-active per LOCKFILE
    "#276EF1",  # s-accent (royal blue)
    "#D6D3D1",  # stone-300 (avatar initial palette step)
    "#A8A29E",  # stone-400 (avatar initial palette step)
    "#1638C4", "#B8C4F0",
}

CANONICAL_EASINGS = {
    "snap",
    "spring",
    "glide",
    "thud",
    "linear",
    "in",
    "out",
    "in-out",
}

RETIRED_EASINGS = {
    "out-strong",
    "out-warm",
    "out-back",
    "in-subtle",
    "spring-bounce",
    "drawer",
    "in-out-strong",
}

CANONICAL_DURATIONS_MS = {80, 100, 150, 200, 250, 300, 500}  # LOCKFILE §4, including Switch/Sheet press and reduced-motion values

RETIRED_TOKENS = {
    "s-coral",
    "s-cream",
    "s-butter",
    "s-sage",
    "s-wasabi",
    "s-droplet",
    "s-cool",
    "s-amber",
    "s-blue",
    "s-plum",
    "s-sand",
    "s-amber-subtle",
    "s-ink-3",
    "s-ink-secondary",
    "s-ink-tertiary",
    "s-atm-cream",
    "s-atm-terra",
    "s-atm-sage",
    "s-atm-bone",
    "s-atm-butter",
    "s-cat-coiffeur",
    "s-cat-barbershop",
    "s-cat-nails",
    "s-cat-spa",
    "s-cat-coiffeur-text",
    "s-cat-barbershop-text",
    "s-cat-nails-text",
    "s-cat-spa-text",
    "s-chart-1",
    "s-amber-text",
}


@dataclass
class Finding:
    file: str
    line: int
    rule: str
    snippet: str
    recommendation: str


HEX_RE = re.compile(r"#[0-9A-Fa-f]{6}\b|#[0-9A-Fa-f]{3}\b")

ARBITRARY_TW_RE = re.compile(r"\b(?:text|bg|border|rounded|p|m|w|h|gap|leading|tracking)-\[[^\]]+\]")

SUB12_TEXT_RE = re.compile(r"\btext-\[(\d+(?:\.\d+)?)px\]")

MIDDLE_DOT_RE = re.compile(r"\s·|·\s")

DURATION_TW_NUM_RE = re.compile(r"\bduration-(\d+)\b")
DURATION_TW_ARB_RE = re.compile(r"\bduration-\[(\d+)ms\]")

EASING_TW_RE = re.compile(r"\bease-([a-z][\w-]*)\b")

def retired_token_re(tok: str) -> re.Pattern:
    return re.compile(rf"\b(?:bg|text|border|fill|stroke|from|to|via|ring|outline)-{re.escape(tok)}\b")

RAW_PALETTE_RE = re.compile(
    r"\b(?:bg|text|border|ring|fill|stroke|from|to|via|outline|decoration|divide|placeholder|caret)-"
    r"(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|"
    r"slate|gray|grey|zinc|neutral|stone)-(?:50|100|200|300|400|500|600|700|800|900|950)\b"
)

A16_DOT_SIZE_RE = re.compile(r"\b[hw]-(?:1|1\.5|2)\b|\b[hw]-\[[2-8]px\]")

ICON_TILE_SIZE_RE = re.compile(r"\bw-(?:1[6-9]|2[0-9]|3[0-9])\b[^\n]{0,40}\bh-(?:1[6-9]|2[0-9]|3[0-9])\b|"
                               r"\bh-(?:1[6-9]|2[0-9]|3[0-9])\b[^\n]{0,40}\bw-(?:1[6-9]|2[0-9]|3[0-9])\b")
ICON_TILE_INTERACTIVE_RE = re.compile(r"<button|onClick|aria-label|role=|\bhover:|\bactive:|cursor-pointer")
ICON_TILE_GREY_RE = re.compile(r"\bbg-s-bg-sunken\b|\bbg-gray-(?:50|100|200)\b|\bbg-\[#F4F4F5\]", re.IGNORECASE)
ICON_TILE_ROUND_RE = re.compile(r"\brounded-(?:full|xl|2xl|3xl|\[\d+px\])")

ICON_BANNED_GLYPH_RE = re.compile(r"<\s*(?:Sparkles|Zap)\b|\bIcon:\s*(?:Sparkles|Zap)\b")

HAIRLINE_OPACITY_RE = re.compile(r"(?<!:)\bborder-s-ink/(?:[0-9.]+|\[[0-9.]+\])")

A18_AVAIL_SIGNAL_RE = re.compile(r"<Clock|\b\d{1,2}:\d{2}\b|heute|morgen|Frei in|nextSlot", re.IGNORECASE)

UNGATED_HOVER_REVEAL_RE = re.compile(r"(?<!md:)\bopacity-0\b[^\"]*\bgroup-hover(?:/[\w-]+)?:opacity-100\b")
A23_FUNCTIONAL_MARKER_RE = re.compile(r"<button\b|onClick=|role=[\"']button[\"']", re.IGNORECASE)

FONT_FAMILY_BAN_RE = re.compile(r"font-family\s*:\s*['\"]?(monospace|Geist|JetBrains Mono)\b", re.IGNORECASE)

FONT_WEIGHT_BAN_RE = re.compile(r"\bfont-(?:extrabold|black)\b|\bfont-\[(?:800|900)\]\b")

LEADING_TW_RE = re.compile(r"\bleading-\[([0-9.]+)\]")
CANONICAL_LEADING = {
    "1.0", "1", "1.05", "1.1", "1.15", "1.2", "1.25", "1.3", "1.4", "1.55",
}


UPPERCASE_RE = re.compile(r"\buppercase\b")

TRACKING_TW_RE = re.compile(r"\btracking-\[(-?[\.0-9]+)em\]")
CANONICAL_TRACKING_EM = {
    "-0.02", "-.02",
    "-0.015", "-.015",
    "-0.01", "-.01",
    "-0.005", "-.005",
    "0",
    "0.06", ".06",
    "0.08", ".08",
}

ACCENT_TEXT_RE = re.compile(r"\btext-s-accent\b")
ACCENT_BG_RE   = re.compile(r"\bbg-s-accent(?:-pale)?\b")
ACCENT_ALLOWED_HINTS = (
    "focus-visible",
    "focus:",
    "Spinner",
    "spinner",
    "outline-s-accent",   # outline ring
    "ring-s-accent",      # focus ring
    "border-s-accent",    # input focus border / blue-ghost secondary button
    "href",               # a link
    "<a ",
    "<Link",
    "onClick",
    "onPress",
    'role="tab',
    "role='tab",
    "aria-current",
    "aria-selected",
    "data-active",
    "data-state",
    "cursor-pointer",
    "hover:underline",    # blue-link hover-underline (v2 rule 7)
    "hover:text-s-accent",
    "active:",
    "Buchen", "Wegbeschreibung", "Verwalten",  # inline action labels
)

IMG_TAG_RE = re.compile(r"<img\b")
ROUNDED_RE = re.compile(r"\brounded(?:-(?:none|sm|md|lg|xl|2xl|3xl|full|btn|chip|pill|\[[^\]]+\]))?\b")

ASPECT_TW_RE = re.compile(r"\baspect-(?:\[([^\]]+)\]|(square|video|auto))\b")
CANONICAL_ASPECTS = {
    "square", "video", "auto",  # Tailwind named
    "3/2", "21/9", "4/3", "16/9",  # arbitrary canonical
}

DECORATION_DOT_INLINE_RE = re.compile(
    r"<span[^>]*\bh-\[5px\][^>]*\bw-\[5px\][^>]*\brounded-full\b[^>]*\bbg-s-"
)
DECORATION_DOT_PSEUDO_RE = re.compile(
    r"\bbefore:.*\brounded-full\b.*\bbefore:bg-s-"
)
DECORATION_DOT_EXEMPT_HINTS = (
    "h-1 w-1",         # tiny separator dots in trust strips
    "animate-pulse",   # typing indicator
    "place-items-center",  # icon container
    "items-center justify-center",  # likely counter/badge
)

FONT_BOLD_RE = re.compile(r"\bfont-bold\b")
SMALL_TEXT_PX_RE = re.compile(r"\btext-\[(\d+)px\]")
META_INK_RE = re.compile(r"\btext-s-ink-[23]\b")

EMPTY_ONCLICK_RE = re.compile(r"onClick=\{\(\)\s*=>\s*\{\s*\}\}")

DEAD_HREF_RE = re.compile(r'href=\{?[\'"]#?[\'"]\}?')

EMOJI_RE = re.compile(
    r"[\U0001F300-\U0001F9FF\U0001F600-\U0001F64F\U0001F680-\U0001F6FF\U0001FA00-\U0001FAFF\U00002700-\U000027BF\U00002B50]"
)

A21_EYEBROW_RE = re.compile(r'uppercase[^"\']*tracking-\[0\.1|tracking-\[0\.1[^"\']*uppercase')

CATEGORY_BRANCH_RE = re.compile(
    r"category\s*===?\s*[\'\"](?:coiffeur|barbershop|barber|nails|spa|massage)[\'\"]",
    re.IGNORECASE,
)

A14_BG_WHITE_RE = re.compile(r"\bbg-white(?:/\d+)?\b")
A14_SHADOW_RE = re.compile(
    r"\bshadow-(?:elevation-[123]|card|card-hover|surface|surface-hover|"
    r"warm-(?:xs|sm|md|lg|xl|float)|v5-[\w-]+|pressed|\[)"
)
A14_CONTROL_SHAPE_RE = re.compile(r"\brounded-(?:full|btn|pill)\b")
A14_OVER_IMAGE_RE = re.compile(r"\b(?:backdrop-blur|absolute|inset-0|object-cover)\b|FROST_GLASS")



C2_SUPABASE_URL_RE = re.compile(r"https?://[a-z0-9]{8,}\.supabase\.(?:co|in|net)\b", re.IGNORECASE)
C2_SOLEN_URL_RE = re.compile(r"https?://(?:[a-z0-9-]+\.)*solen\.ch\b", re.IGNORECASE)
C2_LOCALHOST_RE = re.compile(r"https?://(?:localhost|127\.0\.0\.1):\d{2,5}\b")

C3_UUID_RE = re.compile(
    r"\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}\b"
)

C5_JSX_TEXT_RE = re.compile(r">\s*([A-Za-z][A-Za-z .,!?'’\-]{3,})\s*<")
C5_DISPLAY_PROP_RE = re.compile(
    r'\b(?:title|label|placeholder|alt|aria-label)\s*=\s*"([A-Za-z][A-Za-z .,!?\'’\-]{3,})"'
)
C5_BRAND_ALLOW = {"solen", "stripe", "supabase", "google", "apple"}

C6_FS_PATH_RE = re.compile(
    r"[\"'`](?:/Users/|/home/|[A-Za-z]:\\\\|[A-Za-z]:/|/private/tmp/|/var/folders/)[^\"'`]+[\"'`]"
)

C7_MONEY_RE = re.compile(
    r"\b(commission|platform_fee|fee|vat|mwst|tax|discount|price|amount|total|surcharge)\b"
    r"\s*[:=]\s*(-?\d+(?:\.\d+)?)",
    re.IGNORECASE,
)
C7_CHF_RE = re.compile(r"\bCHF\s*\d|\b\d+(?:\.\d{2})?\s*CHF\b")
C7_VAT_RE = re.compile(r"\b0\.081\b|\b8\.1\s*%")

D1_CONSOLE_RE = re.compile(r"\bconsole\.(log|debug|dir|trace)\b|\bdebugger\b")

D2_CODE_COMMENT_RE = re.compile(
    r"^\s*//\s*(?:const |let |var |function |return |if\s*\(|for\s*\(|while\s*\(|"
    r"import |export |await |[A-Za-z_$][\w$.]*\s*=|[A-Za-z_$][\w$.]*\([^)]*\)\s*;?\s*$|"
    r".*[;{}]\s*$)"
)
D2_JSDOC_EXAMPLE_RE = re.compile(r"@example")




def _code_only(line: str, in_block: bool) -> tuple[str, bool]:
    """Return (line with // and /* */ comments blanked, still-in-block-comment).

    Used only to suppress A1 hex-in-comment false positives: a hex inside a
    code comment is documentation, not drift. JSX `{/* ... */}` is covered because it
    contains the `/* ... */` markers. Conservative: does not parse string literals, so a
    `//` inside a string truncates the rest of that line for hex purposes — acceptable,
    since a string-embedded hex placed after a `//` is vanishingly rare.
    """
    out: list[str] = []
    i, n = 0, len(line)
    while i < n:
        if in_block:
            end = line.find("*/", i)
            if end == -1:
                i = n
            else:
                in_block = False
                i = end + 2
        else:
            slash = line.find("//", i)
            block = line.find("/*", i)
            if slash != -1 and (block == -1 or slash < block):
                out.append(line[i:slash])
                i = n
            elif block != -1:
                out.append(line[i:block])
                in_block = True
                i = block + 2
            else:
                out.append(line[i:])
                i = n
    return "".join(out), in_block



def _rel_basename(rel: str) -> str:
    return rel.rsplit("/", 1)[-1]


def _is_test_file(rel: str) -> bool:
    base = _rel_basename(rel)
    return (
        ".test." in base or ".spec." in base or ".stories." in base
        or "/__tests__/" in rel or rel.startswith("__tests__/")
    )


def _is_app_source(rel: str) -> bool:
    """app/** + components*/** + lib/** TS/TSX source (C3 / C6 / C7 net-new scope)."""
    if not (rel.startswith("app/") or rel.startswith("components") or rel.startswith("lib/")):
        return False
    return rel.endswith((".ts", ".tsx"))


def _c3_exempt(rel: str) -> bool:
    base = _rel_basename(rel)
    return (
        _is_test_file(rel)
        or "seed" in base.lower()
        or "fixture" in rel.lower() or "mock" in rel.lower()
        or "supabase/migrations" in rel
        or rel.startswith("_inventory") or "/_inventory/" in rel
    )


def _c5_exempt_file(rel: str) -> bool:
    return (
        not rel.endswith(".tsx")
        or rel.startswith("messages/") or "/messages/" in rel
        or ".stories." in _rel_basename(rel)
        or ".test." in _rel_basename(rel)
        or rel.startswith("public/_mockups/") or "/public/_mockups/" in rel
        or rel.startswith("_design-system/") or "/_design-system/" in rel
    )


def _compute_d2_lines(lines: list[str]) -> set[int]:
    """1-based line numbers that are part of a >=3-consecutive commented-out-code
    run (D2). JSDoc @example lines and pure prose `//` comments do not count."""
    flagged: set[int] = set()
    run: list[int] = []
    for i, raw in enumerate(lines, start=1):
        is_code_comment = bool(D2_CODE_COMMENT_RE.match(raw)) and not D2_JSDOC_EXAMPLE_RE.search(raw)
        if is_code_comment:
            run.append(i)
        else:
            if len(run) >= 3:
                flagged.update(run)
            run = []
    if len(run) >= 3:
        flagged.update(run)
    return flagged


def scan_text(text: str, rel: str) -> list[Finding]:
    """Scan one already-read virtual file."""
    findings: list[Finding] = []
    in_block_comment = False
    all_lines = text.splitlines()
    is_md = rel.endswith(".md")
    d2_lines = set() if is_md else _compute_d2_lines(all_lines)
    for ln_no, line in enumerate(all_lines, start=1):
        code_line, in_block_comment = _code_only(line, in_block_comment)
        for m in HEX_RE.finditer(code_line):
            hex_val = m.group(0).upper()
            if hex_val.upper() not in {h.upper() for h in ALLOWED_HEX}:
                findings.append(Finding(
                    file=rel, line=ln_no, rule="A1: hardcoded hex",
                    snippet=line,
                    recommendation=f"Use a Tailwind token for `{hex_val}` if one exists; add to ALLOWED_HEX in check.py if intentionally inline.",
                ))

        for m in ARBITRARY_TW_RE.finditer(line):
            cls = m.group(0)
            if cls.startswith("duration-["):
                continue  # handled by A3 specifically
            findings.append(Finding(
                file=rel, line=ln_no, rule="INFO A2: arbitrary Tailwind value",
                snippet=line,
                recommendation=f"`{cls}`: prefer a tokenized class. If intentional, document the reason at the owning call site.",
            ))

        for m in SUB12_TEXT_RE.finditer(line):
            px = float(m.group(1))
            if px < 12:
                findings.append(Finding(
                    file=rel, line=ln_no, rule="A19: sub-12px text",
                    snippet=line,
                    recommendation=f"`text-[{m.group(1)}px]` is below the 12px legibility floor (LOCKFILE §2.5). Use the Meta role (12-13px) or larger.",
                ))

        if MIDDLE_DOT_RE.search(code_line):
            findings.append(Finding(
                file=rel, line=ln_no, rule="A20: middle-dot separator",
                snippet=line,
                recommendation="Middle-dot `·` is forbidden as a separator (LOCKFILE §2.5 A12). Use <MetaDot /> (a no-glyph gap) or an em-space (U+2003), not `·` or `|`.",
            ))

        if FONT_FAMILY_BAN_RE.search(line):
            findings.append(Finding(
                file=rel, line=ln_no, rule="A24: banned font-family",
                snippet=line,
                recommendation="Per LOCKFILE §13.4: codes are NOT a monospace. Use Inter Tight 600-700 + font-variant-numeric:tabular-nums (the .num recipe), or the app font stack for prose. Geist and JetBrains Mono are separately retired.",
            ))

        if FONT_WEIGHT_BAN_RE.search(line):
            findings.append(Finding(
                file=rel, line=ln_no, rule="A22: banned font-weight (800/900)",
                snippet=line,
                recommendation="Per LOCKFILE §2: NEVER 800/extrabold or 900/black (\"clumsy\"). app/layout.tsx's Inter Tight weight array only loads 400-700, so this class either renders wrong (browser falls back to 700) or is a no-op. Use font-bold (700).",
            ))

        for m in DURATION_TW_NUM_RE.finditer(line):
            n = int(m.group(1))
            if n not in CANONICAL_DURATIONS_MS:
                findings.append(Finding(
                    file=rel, line=ln_no, rule="A3: non-canonical duration",
                    snippet=line,
                    recommendation=f"`duration-{n}` not in canon {sorted(CANONICAL_DURATIONS_MS)}. Use nearest canonical or document.",
                ))
        for m in DURATION_TW_ARB_RE.finditer(line):
            n = int(m.group(1))
            if n not in CANONICAL_DURATIONS_MS:
                findings.append(Finding(
                    file=rel, line=ln_no, rule="INFO A3: non-canonical duration (arbitrary)",
                    snippet=line,
                    recommendation=f"`duration-[{n}ms]` not in canon {sorted(CANONICAL_DURATIONS_MS)}. 80ms is allowed for active-press; everything else needs justification.",
                ))

        for m in EASING_TW_RE.finditer(line):
            name = m.group(1)
            if name in RETIRED_EASINGS:
                findings.append(Finding(
                    file=rel, line=ln_no, rule="A4: retired easing",
                    snippet=line,
                    recommendation=f"`ease-{name}` is outside the current set. Replace it with snap, spring, glide, or thud.",
                ))
            elif name not in CANONICAL_EASINGS:
                findings.append(Finding(
                    file=rel, line=ln_no, rule="A4: unknown easing",
                    snippet=line,
                    recommendation=f"`ease-{name}` is not in canon or retired list. Either canonize in SOURCE.md §6 or replace.",
                ))

        for tok in RETIRED_TOKENS:
            if retired_token_re(tok).search(line):
                findings.append(Finding(
                    file=rel, line=ln_no, rule="A5: retired token usage",
                    snippet=line,
                    recommendation=f"`{tok}` is outside the current token set. Use the applicable token from SOURCE.md §2.2.",
                ))

        for m in RAW_PALETTE_RE.finditer(code_line):
            findings.append(Finding(
                file=rel, line=ln_no, rule="A15: raw Tailwind palette colour",
                snippet=line,
                recommendation=f"`{m.group(0)}` is a raw Tailwind palette colour. Use the applicable semantic token: s-error, s-success, s-warning, s-accent, s-ink, or s-bg-*.",
            ))

        if (ICON_TILE_GREY_RE.search(line) and ICON_TILE_ROUND_RE.search(line)
                and ICON_TILE_SIZE_RE.search(line)
                and not ICON_TILE_INTERACTIVE_RE.search(line)
                and ("items-center" in line or "place-items-center" in line)):
            findings.append(Finding(
                file=rel, line=ln_no, rule="A25: grey tile behind an icon",
                snippet=line,
                recommendation="No grey box behind a glyph. Let the icon sit on the page at a larger size, or use the real category art in /icons/categories/. The states policy also excludes a grey Lucide disc.",
            ))

        if ICON_BANNED_GLYPH_RE.search(line):
            findings.append(Finding(
                file=rel, line=ln_no, rule="A26: banned icon glyph (sparkles/zap)",
                snippet=line,
                recommendation="Sparkles and zap are banned by LOCKFILE 1598. Pick a glyph that names the meaning: a clock for something coming, a check for a confirmation, or a bell for a reminder.",
            ))

        if "rounded-full" in line and "bg-s-accent" in line and A16_DOT_SIZE_RE.search(line):
            findings.append(Finding(
                file=rel, line=ln_no, rule="A16: decorative accent dot",
                snippet=line,
                recommendation="A tiny `rounded-full bg-s-accent` span is a banned decorative dot (taste rule #2). Delete it. If it carries live status, a green `bg-s-success` dot is the allowed pattern.",
            ))

        if (HAIRLINE_OPACITY_RE.search(code_line)  # comment-stripped for A1 parity
                and not A14_OVER_IMAGE_RE.search(line)
                and "text-white" not in line
                and "bg-s-ink" not in line
                and "bg-black" not in line):
            findings.append(Finding(
                file=rel, line=ln_no, rule="A17: opacity hairline (use border-s-border)",
                snippet=line,
                recommendation="Chrome hairlines use `border-s-border`. Reserve opacity-modulated ink borders for a border over a photo or ink surface.",
            ))

        if "bg-s-success-bg" in line and A18_AVAIL_SIGNAL_RE.search(line):
            findings.append(Finding(
                file=rel, line=ln_no, rule="A18: green availability pill (removed, do not re-add)",
                snippet=line,
                recommendation="Card availability uses plain ink text: Clock plus time in text-s-ink. Do not add a green availability pill.",
            ))

        if UNGATED_HOVER_REVEAL_RE.search(code_line):
            window_start = max(0, ln_no - 3)
            window_end = min(len(all_lines), ln_no + 1)
            window_text = "\n".join(all_lines[window_start:window_end])
            if A23_FUNCTIONAL_MARKER_RE.search(window_text):
                findings.append(Finding(
                    file=rel, line=ln_no, rule="A23: ungated functional hover-reveal (unreachable on touch)",
                    snippet=line,
                    recommendation="A hover-only functional control is unreachable on touch. Make it visible by default below the pointer-gated breakpoint.",
                ))

        if EMPTY_ONCLICK_RE.search(line):
            findings.append(Finding(
                file=rel, line=ln_no, rule="B1: dead click",
                snippet=line,
                recommendation="`onClick={() => {}}` is a Clickable Surface Contract violation. Apply option D (Coming Soon affordance) or A/B/C. See SOURCE.md §11.",
            ))

        if DEAD_HREF_RE.search(line):
            findings.append(Finding(
                file=rel, line=ln_no, rule="B2: dead href",
                snippet=line,
                recommendation="`href=\"\"` or `href=\"#\"` is a Clickable Surface Contract violation. See SOURCE.md §11.",
            ))

        if not rel.endswith((".md", ".py")) and EMOJI_RE.search(line):
            findings.append(Finding(
                file=rel, line=ln_no, rule="A6: emoji in code",
                snippet=line,
                recommendation="Emoji are banned in code and UI. Use Lucide icons instead. Unicode geometric shapes (·, →, ●, ★) remain allowed.",
            ))

        if A21_EYEBROW_RE.search(line):
            findings.append(Finding(
                file=rel, line=ln_no, rule="A21: tracked-uppercase eyebrow",
                snippet=line,
                recommendation="Tracked-uppercase eyebrows are banned on customer surfaces. The H2 plus a normal-case subheading carries the section.",
            ))

        if CATEGORY_BRANCH_RE.search(line):
            findings.append(Finding(
                file=rel, line=ln_no, rule="B5: category-specific branch",
                snippet=line,
                recommendation="Universal components do not branch on `if category === 'X'`. Parameterize via data or use a generic prop so the same component renders every category.",
            ))


        if UPPERCASE_RE.search(line):
            findings.append(Finding(
                file=rel, line=ln_no, rule="INFO A7: uppercase usage",
                snippet=line,
                recommendation="Per LOCKFILE §2.5: only Eyebrow (max 1/surface) and Tag/Status roles allow uppercase. If this is neither, drop uppercase + use Body/CTA/Meta role recipe. If this IS Eyebrow or Tag/Status, audit tracking value against canonical 0.06/0.08em.",
            ))

        for m in TRACKING_TW_RE.finditer(line):
            val = m.group(1)
            if val not in CANONICAL_TRACKING_EM:
                findings.append(Finding(
                    file=rel, line=ln_no, rule="INFO A8: non-canonical tracking",
                    snippet=line,
                    recommendation=f"`tracking-[{val}em]` not in canonical set {sorted(CANONICAL_TRACKING_EM)}. Per LOCKFILE §2.5, valid values are -0.02 / -0.015 / -0.01 / -0.005 / 0 / 0.06 / 0.08. Pick nearest canonical.",
                ))

        if ACCENT_TEXT_RE.search(line) or ACCENT_BG_RE.search(line):
            if not any(hint in line for hint in ACCENT_ALLOWED_HINTS):
                findings.append(Finding(
                    file=rel, line=ln_no, rule="INFO A9: blue outside the hyperlink scope (v3)",
                    snippet=line,
                    recommendation="LOCKFILE §1.5 makes blue `s-accent` the hyperlink color. It belongs on prose links and locked system states such as focus, loading, input focus, and stepper discs. It does not belong on see-all controls, active tabs, secondary buttons, icon tints, non-interactive text, or a filled primary CTA. Keep blue sparse: roughly three strings per viewport and zero or one on forms.",
                ))

        if IMG_TAG_RE.search(line) and ROUNDED_RE.search(line):
            if "rounded-none" not in line:
                findings.append(Finding(
                    file=rel, line=ln_no, rule="INFO A10: rounded image",
                    snippet=line,
                    recommendation="Per LOCKFILE §11 non-negotiable: all images use border-radius 0 (flush rectangles). Sole exception: Avatar primitive. Drop `rounded-*` or add `rounded-none`.",
                ))

        for m in ASPECT_TW_RE.finditer(line):
            arb = m.group(1)  # value inside aspect-[...]
            named = m.group(2)  # tailwind named (square/video/auto)
            val = arb or named
            if val not in CANONICAL_ASPECTS:
                findings.append(Finding(
                    file=rel, line=ln_no, rule="INFO A11: non-canonical aspect ratio",
                    snippet=line,
                    recommendation=f"`aspect-{val}` not in canonical set {sorted(CANONICAL_ASPECTS)}. Per LOCKFILE §11: use aspect-square (1:1), aspect-[3/2], aspect-video (16/9), aspect-[21/9], or aspect-[4/3].",
                ))

        is_exempt = any(hint in line for hint in DECORATION_DOT_EXEMPT_HINTS)
        if not is_exempt:
            if DECORATION_DOT_INLINE_RE.search(line):
                findings.append(Finding(
                    file=rel, line=ln_no, rule="INFO A12: eyebrow decoration dot",
                    snippet=line,
                    recommendation="LOCKFILE §2.5 allows no leading dot or icon on eyebrows. Drop the `<span ...rounded-full bg-s-*></span>` prefix. If the dot is semantic, use the applicable separator, status, count-badge, or icon-container pattern and document its role.",
                ))
            if DECORATION_DOT_PSEUDO_RE.search(line):
                findings.append(Finding(
                    file=rel, line=ln_no, rule="INFO A12: eyebrow pseudo-dot",
                    snippet=line,
                    recommendation="LOCKFILE §2.5 makes eyebrows plain text. Drop the `before:rounded-full before:bg-s-*` pseudo-element decoration.",
                ))

        if FONT_BOLD_RE.search(line):
            px = SMALL_TEXT_PX_RE.search(line)
            small_bold = bool(px and int(px.group(1)) < 22)
            meta_bold = bool(META_INK_RE.search(line))
            if small_bold or meta_bold:
                findings.append(Finding(
                    file=rel, line=ln_no, rule="INFO A13: font-bold on non-hero/meta text",
                    snippet=line,
                    recommendation="LOCKFILE §2.5 reserves font-bold (700) for Hero H1. Card and list-item names use font-medium (500) as the single ink anchor; meta uses font-normal text-s-ink-2. Use the matching role or the <CardName>/<CardMeta> primitives.",
                ))

        if (A14_CONTROL_SHAPE_RE.search(line)
                and A14_BG_WHITE_RE.search(line)
                and A14_SHADOW_RE.search(line)
                and not A14_OVER_IMAGE_RE.search(line)):
            findings.append(Finding(
                file=rel, line=ln_no, rule="INFO A14: elevated-white control on a calm surface",
                snippet=line,
                recommendation="CONTROL_ELEVATION.md reserves white plus shadow for glass over a photo (FROST_GLASS, lib/frost-glass.ts) and the one ink CTA. A calm control on white or s-bg-sunken casts no shadow. If this control is over a photo, review the finding with that context because the line scanner cannot see the background.",
            ))

        for m in LEADING_TW_RE.finditer(line):
            val = m.group(1)
            if val not in CANONICAL_LEADING:
                findings.append(Finding(
                    file=rel, line=ln_no, rule="INFO A23: non-canonical line-height",
                    snippet=line,
                    recommendation=f"`leading-[{val}]` not in canonical set {sorted(CANONICAL_LEADING)}. Per LOCKFILE §2 Scale table, pick the nearest canonical role line-height.",
                ))


        if not rel.endswith(".svg"):
            c2_localhost_skip = (
                _is_test_file(rel) or rel.startswith("scripts/") or "/scripts/" in rel
            )
            if C2_SUPABASE_URL_RE.search(line):
                findings.append(Finding(
                    file=rel, line=ln_no, rule="C2: Supabase project URL candidate",
                    snippet=line,
                    recommendation="Deployment-coupling candidate: inspect whether this project URL belongs in current environment configuration.",
                ))
            elif C2_SOLEN_URL_RE.search(line):
                findings.append(Finding(
                    file=rel, line=ln_no, rule="C2: solen.ch URL candidate",
                    snippet=line,
                    recommendation="Deployment-coupling candidate: inspect whether this production host is intentional or belongs in current configuration.",
                ))
            elif C2_LOCALHOST_RE.search(line) and not c2_localhost_skip:
                findings.append(Finding(
                    file=rel, line=ln_no, rule="C2: localhost URL candidate",
                    snippet=line,
                    recommendation="Deployment-coupling candidate: inspect whether this local host is limited to an appropriate runtime boundary.",
                ))

        if _is_app_source(rel) and not _c3_exempt(rel) and C3_UUID_RE.search(code_line):
            findings.append(Finding(
                file=rel, line=ln_no, rule="C3: v4 UUID literal candidate",
                snippet=line,
                recommendation="v4-shaped literal candidate: inspect the call site to determine whether it pins an entity; this pattern alone does not establish ownership.",
            ))

        if not _c5_exempt_file(rel):
            def _c5_flag(phrase: str) -> bool:
                p = phrase.strip()
                letters = sum(c.isalpha() for c in p)
                if letters < 4 and " " not in p:
                    return False
                low = p.lower()
                if low in C5_BRAND_ALLOW:
                    return False
                if p.isupper():  # all-caps token (e.g. CSS / DE / EN)
                    return False
                if " " not in p and p[:1].isupper() and p.isalnum() and not p.islower():
                    return False
                return True

            c5_done = False
            for m in C5_JSX_TEXT_RE.finditer(line):
                if _c5_flag(m.group(1)):
                    findings.append(Finding(
                        file=rel, line=ln_no, rule="C5: JSX display-copy candidate",
                        snippet=line,
                            recommendation=f"Display-copy candidate: inspect the surrounding translation path; this same-line pattern does not establish localization coverage.",
                    ))
                    c5_done = True
                    break
            if not c5_done:
                for m in C5_DISPLAY_PROP_RE.finditer(line):
                    if _c5_flag(m.group(1)):
                        findings.append(Finding(
                            file=rel, line=ln_no, rule="C5: display-prop copy candidate",
                            snippet=line,
                            recommendation="Display-prop candidate: inspect the surrounding translation path; this same-line pattern does not establish localization coverage.",
                        ))
                        break

        c6_exempt = rel.startswith("scripts/") or "/scripts/" in rel or rel.startswith(".claude/") or "/.claude/" in rel
        if _is_app_source(rel) and not c6_exempt and C6_FS_PATH_RE.search(code_line):
            findings.append(Finding(
                file=rel, line=ln_no, rule="C6: machine-local path candidate",
                snippet=line,
                recommendation="Portability candidate: assess whether this machine-local path can run in the intended environment.",
            ))

        m_money = C7_MONEY_RE.search(line)
        if m_money:
            try:
                rhs = float(m_money.group(2))
            except ValueError:
                rhs = None
            if rhs is not None:
                vat_note = ""
                if C7_VAT_RE.search(line):
                    vat_note = " NOTE: the project DEFERS the 8.1% VAT on the platform fee (project_commission_vat_deferred) and keys off bookings.platform_fee; do not hardcode 0.081 / 8.1%."
                findings.append(Finding(
                    file=rel, line=ln_no, rule="C7: monetary literal candidate",
                    snippet=line,
                    recommendation=f"Monetary-rule candidate: have the applicable money owner assess `{m_money.group(1)} = {m_money.group(2)}` against data or configuration.{vat_note}",
                ))
        elif C7_CHF_RE.search(code_line):
            findings.append(Finding(
                file=rel, line=ln_no, rule="C7: CHF display candidate",
                snippet=line,
                recommendation="Monetary-display candidate: have the applicable money owner assess whether this CHF value belongs in data or configuration.",
            ))


        if D1_CONSOLE_RE.search(code_line):
            findings.append(Finding(
                file=rel, line=ln_no, rule="D1: debug statement candidate",
                snippet=line,
                recommendation="Remove console.log/debug/dir/trace + debugger before shipping. For real error logging use console.error / console.warn (the project-allowed forms).",
            ))

        if ln_no in d2_lines:
            findings.append(Finding(
                file=rel, line=ln_no, rule="D2: commented-code candidate",
                snippet=line,
                recommendation="Dead-code candidate: establish whether this is obsolete code or a documentation example before deleting it.",
            ))



    return findings





SUPPORTED_SUFFIXES = {".ts", ".tsx", ".css"}


def _normal_rel(path: Path, root: Path) -> str:
    return path.resolve(strict=True).relative_to(root).as_posix()


def _selection_excluded(rel: str) -> bool:
    """Exclude generated, dependency, audit, and inactive support descendants."""
    parts = rel.lower().split("/")
    base = parts[-1]
    return (
        any(part in {"node_modules", ".next", "dist", "_audits", ".claude", "generated", "__generated__"} for part in parts[:-1])
        or base.endswith((".generated.ts", ".generated.tsx", ".generated.css"))
    )


def _is_cd_excluded(rel: str) -> bool:
    parts = rel.lower().split("/")
    base = parts[-1]
    if any(part in {"test", "tests", "__tests__", "fixtures", "fixture", "mocks", "mock", "mockups", "stories", "story", "seed", "seeds", "scripts", "tooling", "generated", "__generated__"} for part in parts[:-1]):
        return True
    return (
        ".test." in base or ".spec." in base or ".stories." in base
        or ".mock." in base or ".fixture." in base or ".generated." in base
        or base.startswith("seed-")
        or rel.startswith("public/_mockups/") or "/public/_mockups/" in rel
    )


def _is_runtime_cd_source(rel: str) -> bool:
    return (
        rel.endswith((".ts", ".tsx"))
        and (rel.startswith("app/") or rel.startswith("components/") or rel.startswith("components-legacy/") or rel.startswith("lib/"))
        and not _is_cd_excluded(rel)
    )


def _keep_current_cd(finding: Finding, rel: str) -> bool:
    if not (finding.rule.startswith("C") or finding.rule.startswith("D")):
        return True
    if not _is_runtime_cd_source(rel):
        return False
    if finding.rule.startswith("C5:"):
        return rel.endswith(".tsx")
    return finding.rule.startswith(("C2:", "C3:", "C6:", "C7:", "D1:", "D2:"))


def scan_selected(text: str, rel: str) -> list[Finding]:
    return [finding for finding in scan_text(text, rel) if _keep_current_cd(finding, rel)]


def resolve_selected(root: Path, raw: Path) -> Path:
    candidate = raw.resolve(strict=True)
    try:
        candidate.relative_to(root)
    except ValueError as exc:
        raise ValueError(f"selected path resolves outside root: {raw}") from exc
    if not candidate.is_file() or candidate.suffix not in SUPPORTED_SUFFIXES:
        raise ValueError(f"unsupported selected file: {raw}")
    return candidate


def select_paths(root: Path, targets: list[str], full_estate: bool) -> tuple[list[Path], int, int]:
    raw_paths: list[Path] = []
    if full_estate:
        raw_paths = [path for path in root.rglob("*") if path.is_file()]
    else:
        for value in targets:
            raw = Path(value)
            if not raw.is_absolute():
                raw = root / raw
            try:
                selected = raw.resolve(strict=True)
            except FileNotFoundError as exc:
                raise ValueError(f"unreadable target: {value}") from exc
            try:
                selected.relative_to(root)
            except ValueError as exc:
                raise ValueError(f"target resolves outside root: {value}") from exc
            if selected.is_file():
                if selected.suffix not in SUPPORTED_SUFFIXES:
                    raise ValueError(f"unsupported explicit target: {value}")
                raw_paths.append(selected)
            elif selected.is_dir():
                raw_paths.extend(path for path in selected.rglob("*") if path.is_file())
            else:
                raise ValueError(f"unreadable target: {value}")
    resolved: set[Path] = set()
    classified: set[Path] = set()
    excluded = 0
    unsupported = 0
    for path in raw_paths:
        resolved_path = path.resolve(strict=True)
        try:
            rel = resolved_path.relative_to(root).as_posix()
        except ValueError as exc:
            raise ValueError(f"selected descendant resolves outside root: {path}") from exc
        if resolved_path in classified:
            continue
        classified.add(resolved_path)
        if _selection_excluded(rel):
            excluded += 1
            continue
        if resolved_path.suffix not in SUPPORTED_SUFFIXES:
            unsupported += 1
            continue
        resolved.add(resolve_selected(root, resolved_path))
    if not resolved:
        raise ValueError("target contains no supported files")
    return sorted(resolved), excluded, unsupported


def build_report(findings: list[Finding], inspected: int, cd_excluded: int, selection_excluded: int, unsupported: int) -> str:
    lines = [
        "# Solen targeted drift candidates",
        "",
        f"Inspected files: {inspected}. C/D excluded by scope: {cd_excluded}. Selection exclusions: {selection_excluded}. Unsupported descendants skipped: {unsupported}. Read errors: 0.",
        "Findings are candidates for review. This report does not claim clean coverage.",
        "",
    ]
    if not findings:
        return "\n".join(lines + ["No candidates from these predicates.", ""])
    for finding in findings:
        lines.extend([f"## {finding.file}:{finding.line} - {finding.rule}", "```", finding.snippet, "```", finding.recommendation, ""])
    return "\n".join(lines)


def write_new_report(root: Path, output: str, input_paths: list[Path], content: str) -> None:
    out = Path(output)
    if not out.is_absolute():
        out = root / out
    parent = out.parent.resolve(strict=True)
    destination = parent / out.name
    try:
        destination.relative_to(root)
    except ValueError as exc:
        raise ValueError("output resolves outside root") from exc
    if destination.exists() or destination.is_symlink():
        raise ValueError("output already exists; refusing to truncate or alias an existing file")
    if destination in input_paths:
        raise ValueError("output collides with an input")
    import os
    flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL
    descriptor = os.open(destination, flags, 0o600)
    with os.fdopen(descriptor, "w", encoding="utf-8") as handle:
        handle.write(content)


def main() -> int:
    parser = argparse.ArgumentParser(description="Solen explicit-target drift candidate scanner")
    parser.add_argument("--root", required=True, help="Declared project root")
    parser.add_argument("--target", action="append", default=[], help="File or directory inside root")
    parser.add_argument("--full-estate", action="store_true", help="Explicitly inspect supported files below root")
    parser.add_argument("--out", help="New report path inside root; must not already exist")
    args = parser.parse_args()
    try:
        root = Path(args.root).resolve(strict=True)
        if not root.is_dir():
            raise ValueError("root is not a directory")
        if args.full_estate and args.target:
            raise ValueError("--full-estate cannot be combined with --target")
        if not args.full_estate and not args.target:
            raise ValueError("supply --target or explicitly request --full-estate")
        paths, selection_excluded, unsupported = select_paths(root, args.target, args.full_estate)
        loaded: list[tuple[Path, str, str]] = []
        for path in paths:
            rel = _normal_rel(path, root)
            loaded.append((path, rel, path.read_text(encoding="utf-8")))
        findings: list[Finding] = []
        excluded = 0
        for _, rel, text in loaded:
            if not _is_runtime_cd_source(rel):
                excluded += 1
            findings.extend(scan_selected(text, rel))
        report = build_report(findings, len(loaded), excluded, selection_excluded, unsupported)
        if args.out:
            write_new_report(root, args.out, paths, report)
        else:
            sys.stdout.write(report)
        return 0
    except (OSError, UnicodeDecodeError, ValueError) as exc:
        print(f"refused: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
