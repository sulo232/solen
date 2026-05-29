#!/usr/bin/env python3
"""
Solen drift-check — design-system audit.

Reads token canon from _design-system/SOURCE.md (via constants here, kept in
sync manually). Scans .tsx/.css/.ts files for drift from canonical tokens +
Clickable Surface Contract violations. Logs everything; never halts.

Run from project root:
    python3 .claude/skills/solen-drift-check/scripts/check.py
    python3 .claude/skills/solen-drift-check/scripts/check.py --strict-only
    python3 .claude/skills/solen-drift-check/scripts/check.py --out report.md

Exit code is always 0. The report's `findings_count > 0` is the action signal.
"""

from __future__ import annotations

import argparse
import datetime as dt
import fnmatch
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable


# ─────────────────────────────────────────────────────────────────────────────
# Canon — keep in sync with _design-system/SOURCE.md §2, §3, §6
# ─────────────────────────────────────────────────────────────────────────────

# A1: Hardcoded hex allowlist — values that are intentionally hardcoded.
# Most colors should come from Tailwind tokens; these are the exceptions
# (signal colors, brand chrome that doesn't have a token yet, etc.).
ALLOWED_HEX = {
    "#FFC32B",  # star yellow — universal signal, see Q1
    "#FF3366",  # heart pink — universal --heart-active signal, V3-D103
    "#FFFFFF",  # white — fine inline
    "#FFF",     # white shorthand
    "#000000",  # near-pure black — flagged by humans not by checker
    "#000",
    "#D3D3D3",  # Fresha-exact input hairline (V3-D90 measured)
    "#FAD2DA",  # discount badge bg (V3-D85-semantic warm-collapse)
    "#FFF1E6",  # urgent badge bg (V3-D173 warm-amber)
    "#D1F0DC",  # availability mint bg (V3-D126 saturation bump)
    "#9A3412",  # urgent badge text (V3-D173 burnt-sienna)
    "#15803D",  # availability badge text (V3-D126 deep green)
    "#16A34A",  # s-brand DEFAULT — should be tokenized but appears in some inline glassStyle
    "#0A0A0A",  # s-ink — same caveat
    # NOTE: SaveHeart category-color identity tokens (FeaturedStylists line 75-80)
    # are intentionally inline since they're a 4-cat palette not used elsewhere.
    "#FFE8D8", "#E0703D",  # coiffeur
    "#EAE0D0", "#2A1F18",  # barbershop
    "#D4DDC8", "#A04A22",  # nails
    "#D4F2E0", "#0F6F44",  # spa
    # Category card colors (SalonCard cardCategoryColors V3-D100)
    "#E9DFC8", "#142F4A",
    "#E58840",
    "#F0C25A",
}

# A4: Canonical easings — names allowed in Tailwind classes (`ease-{name}`).
# Anything else (e.g. `ease-out-strong`) is retired.
CANONICAL_EASINGS = {
    "snap",
    "spring",
    "glide",
    "thud",
    # Tailwind built-ins — also fine
    "linear",
    "in",
    "out",
    "in-out",
}

# A4 (cont'd): Retired easings — explicitly flagged with reason.
RETIRED_EASINGS = {
    "out-strong",
    "out-warm",
    "out-back",
    "in-subtle",
    "spring-bounce",
    "drawer",
    "in-out-strong",
}

# A3: Canonical durations — Tailwind classes (`duration-{n}`) or arbitrary
# values (`duration-[Nms]`). Anything else is drift.
CANONICAL_DURATIONS_MS = {80, 150, 200, 250, 300, 500}

# A5: Retired-but-defined color tokens — defined in tailwind.config.js
# for back-compat with un-rebuilt routes, but new code using them = drift.
RETIRED_TOKENS = {
    "s-coral",
    "s-cream",
    "s-butter",
    "s-sage",
    "s-wasabi",
    "s-droplet",
    "s-pop",
    "s-cool",
    # Atmosphere family
    "s-atm-warm",
    "s-atm-cool",
    "s-atm-base",
    # Category family
    "s-cat-coiffeur",
    "s-cat-barbershop",
    "s-cat-nails",
    "s-cat-spa",
    # V3-D221 (2026-05-26, overnight Q33 resolution): s-accent family REMOVED
    # from RETIRED. V3-D204 made `s-accent` the LIVE Solen brand accent
    # (royal blue #276EF1). The previous list flagged every legitimate Layer 2
    # brand-accent use as drift — 7+ false positives on /business alone. The
    # gold-accent semantic these tokens used to carry is dead; the new
    # blue-accent semantic is alive and should not be flagged.
    # Old entries (kept commented for archeology):
    #   "s-accent", "s-accent-mid", "s-accent-deep", "s-accent-pale", "s-accent-subtle",
}

# Default scan globs — what to look at.
DEFAULT_SCAN_GLOBS = [
    "app/**/*.tsx",
    "app/**/*.ts",
    "app/**/*.css",
]

# Exclusion paths — never scan these.
EXCLUDE_GLOBS = [
    "**/node_modules/**",
    "**/.next/**",
    "**/dist/**",
    "**/_audits/**",
    "**/.claude/**",
]


# ─────────────────────────────────────────────────────────────────────────────
# Finding dataclass
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class Finding:
    file: str
    line: int
    rule: str
    snippet: str
    recommendation: str

    def render(self) -> str:
        return (
            f"### `{self.file}:{self.line}` — **{self.rule}**\n\n"
            f"```\n{self.snippet.strip()}\n```\n\n"
            f"_{self.recommendation}_\n"
        )


# ─────────────────────────────────────────────────────────────────────────────
# Rules
# ─────────────────────────────────────────────────────────────────────────────

# A1 — Hardcoded hex
HEX_RE = re.compile(r"#[0-9A-Fa-f]{6}\b|#[0-9A-Fa-f]{3}\b")

# A2 — Arbitrary Tailwind values like text-[18px], bg-[#XXX], rounded-[22px]
ARBITRARY_TW_RE = re.compile(r"\b(?:text|bg|border|rounded|p|m|w|h|gap|leading|tracking)-\[[^\]]+\]")

# A3 — Tailwind duration. Captures duration-{N} or duration-[Nms].
DURATION_TW_NUM_RE = re.compile(r"\bduration-(\d+)\b")
DURATION_TW_ARB_RE = re.compile(r"\bduration-\[(\d+)ms\]")

# A4 — Tailwind easing class.
EASING_TW_RE = re.compile(r"\bease-([a-z][\w-]*)\b")

# A5 — Retired tokens — match by token name as Tailwind class fragments.
def retired_token_re(tok: str) -> re.Pattern:
    # Token can appear as `bg-<token>`, `text-<token>`, `border-<token>`, `from-<token>`, etc.
    return re.compile(rf"\b(?:bg|text|border|fill|stroke|from|to|via|ring|outline)-{re.escape(tok)}\b")

# A7-A11 — Type Role Registry + Imagery Pattern Registry (V3-D330, INFORMATIONAL)
# These are NEW rules added 2026-05-28 per LOCKFILE §1.5 / §2.5 / §11.
# All five run in INFORMATIONAL mode for phase 1 — log to _pending-migration.md,
# do NOT break strict scope. Flip to STRICT in phase 3 when sweep complete.

# A7 — uppercase outside an enumerated role
# Per §2.5: only `Eyebrow` (text-[11-12px] tracking-[0.08em]) and `Tag/Status`
# (text-[10-12px] tracking-[0.06-0.08em]) may use `uppercase`. Everything else = drift.
UPPERCASE_RE = re.compile(r"\buppercase\b")

# A8 — letter-spacing outside canonical set
# Per §2.5 canonical tracking: -0.02, -0.015, -0.01, -0.005, 0, 0.06, 0.08
# (and the equivalent dotless forms). Anything else = drift.
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

# A9 — text-s-accent outside allowed roles (§1.5)
# Allowed: focus-visible ring, Spinner arc, form-input focus border.
# Forbidden: text-s-accent on eyebrow/link/dot/hero-span/decorative-icon.
ACCENT_TEXT_RE = re.compile(r"\btext-s-accent\b")
ACCENT_BG_RE   = re.compile(r"\bbg-s-accent(?:-pale)?\b")
# Whitelist patterns — these lines are allowed accent applications.
ACCENT_ALLOWED_HINTS = (
    "focus-visible",
    "focus:",
    "Spinner",
    "spinner",
    "outline-s-accent",  # outline ring
    "ring-s-accent",     # focus ring
    "border-s-accent",   # input focus border (paired with focus: usually)
)

# A10 — non-zero border-radius on <img> elements (§11 non-negotiable rule)
# Match: `<img ... className="... rounded-..."` or `rounded-` near an `<img`.
# Heuristic: any line with `<img` AND a `rounded-` Tailwind class.
IMG_TAG_RE = re.compile(r"<img\b")
ROUNDED_RE = re.compile(r"\brounded(?:-(?:none|sm|md|lg|xl|2xl|3xl|full|btn|chip|pill|\[[^\]]+\]))?\b")

# A11 — non-canonical aspect-ratio on images (§11)
# Per §11 canonical set: aspect-square, aspect-[3/2], aspect-video (16/9),
# aspect-[21/9], aspect-[4/3]. Anything else = drift.
ASPECT_TW_RE = re.compile(r"\baspect-(?:\[([^\]]+)\]|(square|video|auto))\b")
CANONICAL_ASPECTS = {
    "square", "video", "auto",  # Tailwind named
    "3/2", "21/9", "4/3", "16/9",  # arbitrary canonical
}

# A12 — eyebrow decoration dots (V3-D331, 2026-05-28)
# Per §2.5 Eyebrow decoration policy: forbidden patterns are
#   (a) inline <span ...rounded-full bg-s-*></span> as decoration prefix
#   (b) before:rounded-full before:bg-s-* pseudo-element dot
# Heuristic: any line containing one of these dot signatures is flagged.
# Semantic uses (separator dots, status indicators, count badges, icon
# containers) are exempted by additional context tokens on the same line:
# h-1/w-1 (small separator dots), animate-pulse (typing indicator),
# place-items-center (icon container), counter text inside the span.
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

# A13 — card text hierarchy (V3-D346, 2026-05-28).
# Per LOCKFILE §2.5 rule A13: inside a card/list-item, exactly ONE ink anchor
# (the name = font-medium); all meta recedes to font-normal text-s-ink-2.
# font-bold (700) is reserved for Hero H1 ONLY (clamp(28,7vw,64)px).
# Static proxy (a line-scanner can't count anchors-per-card structurally, so we
# flag the reliable signal): `font-bold` paired with EITHER a small explicit
# pixel size (<22px = not hero) OR a meta ink color (s-ink-2 / s-ink-3, which
# should never be bold). Hero (font-bold + text-[clamp(...)] + text-s-ink) is
# not matched. Full "one anchor per card" stays runtime-verified via the
# getComputedStyle audit documented in the rule.
FONT_BOLD_RE = re.compile(r"\bfont-bold\b")
SMALL_TEXT_PX_RE = re.compile(r"\btext-\[(\d+)px\]")
META_INK_RE = re.compile(r"\btext-s-ink-[23]\b")

# B1 — Empty onClick handlers
EMPTY_ONCLICK_RE = re.compile(r"onClick=\{\(\)\s*=>\s*\{\s*\}\}")

# B2 — Dead hrefs
DEAD_HREF_RE = re.compile(r'href=\{?[\'"]#?[\'"]\}?')

# A6 — Emoji-block Unicode (V3-D203 no-emoji rule). Catches the common emoji blocks
# but explicitly excludes Unicode geometric shapes which ARE allowed as typography
# (· middot, → arrow, ● circle, ★ text star).
EMOJI_RE = re.compile(
    r"[\U0001F300-\U0001F9FF\U0001F600-\U0001F64F\U0001F680-\U0001F6FF\U0001FA00-\U0001FAFF\U00002700-\U000027BF\U00002B50]"
)

# B5 — Category-specific branches (V3-D205 universal-components rule).
# Catches: if (category === 'coiffeur'), category == "barber", etc.
CATEGORY_BRANCH_RE = re.compile(
    r"category\s*===?\s*[\'\"](?:coiffeur|barbershop|barber|nails|spa|massage)[\'\"]",
    re.IGNORECASE,
)


# ─────────────────────────────────────────────────────────────────────────────
# Scanner
# ─────────────────────────────────────────────────────────────────────────────

def file_matches_any(path: Path, globs: Iterable[str], root: Path | None = None) -> bool:
    """Match against the path RELATIVE to root, not absolute.

    Absolute paths break exclusion globs like `**/.claude/**` when the project
    itself lives inside a `.claude/worktrees/...` directory (the worktree's
    absolute path contains `.claude/` even though the project root doesn't).
    """
    if root is not None:
        try:
            rel = path.relative_to(root)
            spath = str(rel)
        except ValueError:
            spath = str(path)
    else:
        spath = str(path)
    return any(fnmatch.fnmatch(spath, g) for g in globs)


def list_files(root: Path) -> list[Path]:
    files: list[Path] = []
    for g in DEFAULT_SCAN_GLOBS:
        files.extend(root.glob(g))
    # Dedupe + filter excluded — relative to root so .claude/worktrees/ in
    # absolute path doesn't trip the **/.claude/** exclusion.
    seen = set()
    out = []
    for f in files:
        if f in seen:
            continue
        seen.add(f)
        if file_matches_any(f, EXCLUDE_GLOBS, root):
            continue
        out.append(f)
    return sorted(out)


def scan_file(path: Path, root: Path | None = None) -> list[Finding]:
    findings: list[Finding] = []
    try:
        text = path.read_text(encoding="utf-8")
    except (UnicodeDecodeError, FileNotFoundError):
        return findings

    if root is not None:
        try:
            rel = str(path.relative_to(root))
        except ValueError:
            rel = str(path)
    else:
        rel = str(path)

    for ln_no, line in enumerate(text.splitlines(), start=1):
        # A1 — hardcoded hex
        for m in HEX_RE.finditer(line):
            hex_val = m.group(0).upper()
            # Normalize 3-digit shorthand to 6 for compare? Keep both forms in allowlist.
            if hex_val.upper() not in {h.upper() for h in ALLOWED_HEX}:
                findings.append(Finding(
                    file=rel, line=ln_no, rule="A1: hardcoded hex",
                    snippet=line,
                    recommendation=f"Use a Tailwind token for `{hex_val}` if one exists; add to ALLOWED_HEX in check.py if intentionally inline.",
                ))

        # A2 — arbitrary Tailwind values
        for m in ARBITRARY_TW_RE.finditer(line):
            cls = m.group(0)
            # Heuristic: filter known-deliberate arbitrary values that have a SOURCE.md
            # rationale. duration-[80ms] is allowed (active-press feedback).
            if cls.startswith("duration-["):
                continue  # handled by A3 specifically
            findings.append(Finding(
                file=rel, line=ln_no, rule="A2: arbitrary Tailwind value",
                snippet=line,
                recommendation=f"`{cls}` — prefer a tokenized class. If intentional, add a V3-D{{n}} comment explaining why.",
            ))

        # A3 — non-canonical durations
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
                    file=rel, line=ln_no, rule="A3: non-canonical duration (arbitrary)",
                    snippet=line,
                    recommendation=f"`duration-[{n}ms]` not in canon {sorted(CANONICAL_DURATIONS_MS)}. 80ms is allowed for active-press; everything else needs justification.",
                ))

        # A4 — non-canonical easings
        for m in EASING_TW_RE.finditer(line):
            name = m.group(1)
            if name in RETIRED_EASINGS:
                findings.append(Finding(
                    file=rel, line=ln_no, rule="A4: retired easing",
                    snippet=line,
                    recommendation=f"`ease-{name}` is retired. Migrate to canonical: snap/spring/glide/thud. See QUESTIONS.md#q2.",
                ))
            elif name not in CANONICAL_EASINGS:
                findings.append(Finding(
                    file=rel, line=ln_no, rule="A4: unknown easing",
                    snippet=line,
                    recommendation=f"`ease-{name}` is not in canon or retired list. Either canonize in SOURCE.md §6 or replace.",
                ))

        # A5 — retired-but-defined tokens
        for tok in RETIRED_TOKENS:
            if retired_token_re(tok).search(line):
                findings.append(Finding(
                    file=rel, line=ln_no, rule="A5: retired token usage",
                    snippet=line,
                    recommendation=f"`{tok}` is retired-but-defined (back-compat only). See SOURCE.md §2.2 + QUESTIONS.md#q3.",
                ))

        # B1 — dead onClick
        if EMPTY_ONCLICK_RE.search(line):
            findings.append(Finding(
                file=rel, line=ln_no, rule="B1: dead click",
                snippet=line,
                recommendation="`onClick={() => {}}` is a Clickable Surface Contract violation. Apply option D (Coming Soon affordance) or A/B/C. See SOURCE.md §11.",
            ))

        # B2 — dead href
        if DEAD_HREF_RE.search(line):
            findings.append(Finding(
                file=rel, line=ln_no, rule="B2: dead href",
                snippet=line,
                recommendation="`href=\"\"` or `href=\"#\"` is a Clickable Surface Contract violation. See SOURCE.md §11.",
            ))

        # A6 — emoji ban (V3-D203). Skip the .py/.md/.html files that document the
        # rule itself (the docstring lists example emojis as banned).
        if not rel.endswith((".md", ".py")) and EMOJI_RE.search(line):
            findings.append(Finding(
                file=rel, line=ln_no, rule="A6: emoji in code",
                snippet=line,
                recommendation="Emoji are banned in code/UI per V3-D203. Use lucide icons instead. Unicode geometric shapes (·, →, ●, ★) are allowed.",
            ))

        # B5 — universal-components rule (V3-D205). Catches category-specific branches.
        if CATEGORY_BRANCH_RE.search(line):
            findings.append(Finding(
                file=rel, line=ln_no, rule="B5: category-specific branch",
                snippet=line,
                recommendation="Universal-components rule (V3-D205): no `if category === 'X'` branches. Parameterize via data or use a generic prop. Same component renders for every category.",
            ))

        # ─────────────────────────────────────────────────────────────
        # V3-D330 (2026-05-28) Phase 1 — INFORMATIONAL rules A7-A11.
        # All flagged as `INFO:` prefix so the report renderer can route them
        # to _pending-migration.md instead of failing strict scope. These
        # become STRICT in Phase 3 after the sweep clears the queue.
        # ─────────────────────────────────────────────────────────────

        # A7 — uppercase outside Eyebrow / Tag/Status roles.
        # Heuristic: any `uppercase` Tailwind class is logged. The Phase 2
        # sweep classifies each instance into Eyebrow / Tag/Status / drift.
        # We don't try to auto-classify here — too many false positives. The
        # `_pending-migration.md` becomes the authoritative todo list.
        if UPPERCASE_RE.search(line):
            findings.append(Finding(
                file=rel, line=ln_no, rule="INFO A7: uppercase usage",
                snippet=line,
                recommendation="Per LOCKFILE §2.5: only Eyebrow (max 1/surface) and Tag/Status roles allow uppercase. If this is neither, drop uppercase + use Body/CTA/Meta role recipe. If this IS Eyebrow or Tag/Status, audit tracking value against canonical 0.06/0.08em.",
            ))

        # A8 — non-canonical letter-spacing.
        for m in TRACKING_TW_RE.finditer(line):
            val = m.group(1)
            if val not in CANONICAL_TRACKING_EM:
                findings.append(Finding(
                    file=rel, line=ln_no, rule="INFO A8: non-canonical tracking",
                    snippet=line,
                    recommendation=f"`tracking-[{val}em]` not in canonical set {sorted(CANONICAL_TRACKING_EM)}. Per LOCKFILE §2.5, valid values are -0.02 / -0.015 / -0.01 / -0.005 / 0 / 0.06 / 0.08. Pick nearest canonical.",
                ))

        # A9 — text-s-accent / bg-s-accent outside allowed contexts.
        # Allowed contexts (per §1.5): focus-visible ring, Spinner arc, form-input focus border.
        # Heuristic: line contains text-s-accent OR bg-s-accent-pale,
        # but does NOT contain any ACCENT_ALLOWED_HINTS substring.
        if ACCENT_TEXT_RE.search(line) or ACCENT_BG_RE.search(line):
            if not any(hint in line for hint in ACCENT_ALLOWED_HINTS):
                findings.append(Finding(
                    file=rel, line=ln_no, rule="INFO A9: accent outside allowed roles",
                    snippet=line,
                    recommendation="Per LOCKFILE §1.5: `s-accent` is restricted to :focus-visible rings, <Spinner> arcs, and form-input focus borders. Decorative uses → swap to s-ink-3 (eyebrow), s-ink underline (link), s-ink (hero span), or s-success (completion). See §1.5 sweep table.",
                ))

        # A10 — rounded radius on <img> tags.
        if IMG_TAG_RE.search(line) and ROUNDED_RE.search(line):
            # Skip rounded-none — that's the intentional override.
            if "rounded-none" not in line:
                findings.append(Finding(
                    file=rel, line=ln_no, rule="INFO A10: rounded image",
                    snippet=line,
                    recommendation="Per LOCKFILE §11 non-negotiable: all images use border-radius 0 (flush rectangles). Sole exception: Avatar primitive. Drop `rounded-*` or add `rounded-none`.",
                ))

        # A11 — non-canonical aspect-ratio.
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

        # A12 — eyebrow decoration dots (V3-D331).
        # Inline span + pseudo-element variants both flagged unless an exempt
        # context hint is present on the same line.
        is_exempt = any(hint in line for hint in DECORATION_DOT_EXEMPT_HINTS)
        if not is_exempt:
            if DECORATION_DOT_INLINE_RE.search(line):
                findings.append(Finding(
                    file=rel, line=ln_no, rule="INFO A12: eyebrow decoration dot",
                    snippet=line,
                    recommendation="Per LOCKFILE §2.5 Eyebrow decoration policy (V3-D331): no leading dot, no leading icon on eyebrows. Drop the `<span ...rounded-full bg-s-*></span>` decoration prefix. If this dot is semantic (separator / status / count badge / icon container), justify with V3-D{n} comment + add `h-1 w-1` / `animate-pulse` / `place-items-center` context hint.",
                ))
            if DECORATION_DOT_PSEUDO_RE.search(line):
                findings.append(Finding(
                    file=rel, line=ln_no, rule="INFO A12: eyebrow pseudo-dot",
                    snippet=line,
                    recommendation="Per LOCKFILE §2.5 Eyebrow decoration policy (V3-D331): drop the `before:rounded-full before:bg-s-*` pseudo-element decoration. Eyebrow is plain text only.",
                ))

        # A13 — card text hierarchy: font-bold outside Hero (V3-D346).
        # font-bold on small (<22px) text OR on meta ink (s-ink-2/3) = over-bold
        # card meta. Hero clamp sizes + text-s-ink anchors are not matched.
        if FONT_BOLD_RE.search(line):
            px = SMALL_TEXT_PX_RE.search(line)
            small_bold = bool(px and int(px.group(1)) < 22)
            meta_bold = bool(META_INK_RE.search(line))
            if small_bold or meta_bold:
                findings.append(Finding(
                    file=rel, line=ln_no, rule="INFO A13: font-bold on non-hero/meta text",
                    snippet=line,
                    recommendation="Per LOCKFILE §2.5 rule A13 (card text hierarchy, V3-D346): font-bold (700) is reserved for Hero H1. Card/list-item names use font-medium (500) as the single ink anchor; meta uses font-normal text-s-ink-2. Drop font-bold -> font-medium (if this is the name) or font-normal text-s-ink-2 (if this is meta). Or use the <CardName>/<CardMeta> primitives.",
                ))

    return findings


# ─────────────────────────────────────────────────────────────────────────────
# Migration scope
# ─────────────────────────────────────────────────────────────────────────────

def load_strict_globs(root: Path) -> list[str]:
    p = root / "_design-system" / "_rebuilt_routes.json"
    if not p.exists():
        return []
    try:
        data = json.loads(p.read_text(encoding="utf-8"))
        return data.get("strict_globs", []) or []
    except Exception as e:
        print(f"WARN: could not parse {p}: {e}", file=sys.stderr)
        return []


def _escape_brackets(glob: str) -> str:
    """Escape literal `[` and `]` in path globs so fnmatch doesn't treat them
    as character classes. Next.js paths like `app/[locale]/...` contain literal
    brackets that must be matched verbatim, not interpreted as charset `[locale]`
    meaning "any of l/o/c/a/e."""
    return glob.replace("[", "[[]").replace("]", "[]]").replace("[[[]]", "[[]")


def split_scope(files: list[Path], strict_globs: list[str], root: Path) -> tuple[list[Path], list[Path]]:
    if not strict_globs:
        return [], files
    escaped = [_escape_brackets(g) for g in strict_globs]
    strict: list[Path] = []
    info: list[Path] = []
    for f in files:
        try:
            rel = str(f.relative_to(root))
        except ValueError:
            rel = str(f)
        if any(fnmatch.fnmatch(rel, g) for g in escaped):
            strict.append(f)
        else:
            info.append(f)
    return strict, info


# ─────────────────────────────────────────────────────────────────────────────
# Report builders
# ─────────────────────────────────────────────────────────────────────────────

def _is_info_rule(finding: Finding) -> bool:
    """V3-D330: A7-A11 rules are tagged with 'INFO ' prefix and route to
    pending-migration even when their file is in strict scope. Phase 3 flips
    them to STRICT by removing the prefix in the Finding constructor."""
    return finding.rule.startswith("INFO ")


def render_report(
    strict_files: list[Path],
    strict_findings: list[Finding],
    info_files: list[Path],
    info_findings: list[Finding],
    strict_only: bool,
) -> str:
    today = dt.date.today().isoformat()
    lines: list[str] = []
    lines.append(f"# Solen Drift Report — {today}\n")
    lines.append(
        "_Generated by `.claude/skills/solen-drift-check/scripts/check.py`. "
        "Logger, not gate — exit code is always 0._\n"
    )

    # V3-D330: split strict findings — A7-A11 (INFO-prefixed) get demoted to
    # informational scope even when their file is in strict_globs. The strict
    # report stays clean for hard breakages (A1-A6 / B1-B5) during phase 1.
    strict_hard = [f for f in strict_findings if not _is_info_rule(f)]
    strict_info = [f for f in strict_findings if _is_info_rule(f)]

    # Summary
    lines.append("## Summary\n")
    lines.append(f"- **Strict scope:** {len(strict_files)} files scanned, **{len(strict_hard)}** hard findings (A1-A6 / B1-B5).")
    if strict_info:
        lines.append(f"- **Strict scope informational (V3-D330 phase 1):** {len(strict_info)} findings for A7-A11 (logged to pending-migration).")
    if not strict_only:
        lines.append(f"- **Informational scope:** {len(info_files)} files scanned, **{len(info_findings)}** findings (legacy code).")
    lines.append("")
    if not strict_files:
        lines.append("> Strict allowlist is empty. Add file globs to `_design-system/_rebuilt_routes.json` "
                     "`strict_globs` array as routes pass drift-check clean.\n")

    # Strict findings (hard breakages only — A7-A11 informational excluded)
    lines.append("## Findings — strict scope (hard breakages only)\n")
    if not strict_hard:
        lines.append("_No hard findings in strict scope._\n")
    else:
        # Group by file
        by_file: dict[str, list[Finding]] = {}
        for f in strict_hard:
            by_file.setdefault(f.file, []).append(f)
        for filename in sorted(by_file.keys()):
            lines.append(f"\n### `{filename}` ({len(by_file[filename])} findings)\n")
            for finding in by_file[filename]:
                lines.append(finding.render())

    # Strict-clean (only count files with HARD findings against)
    lines.append("\n## Files passing clean (strict scope, hard breakages)\n")
    flagged = {f.file for f in strict_hard}
    clean_files = [str(p) for p in strict_files if str(p) not in flagged]
    if clean_files:
        for f in sorted(clean_files):
            lines.append(f"- `{f}`")
    else:
        lines.append("_None._")

    return "\n".join(lines) + "\n"


def render_pending(info_files: list[Path], info_findings: list[Finding]) -> str:
    today = dt.date.today().isoformat()
    lines: list[str] = []
    lines.append(f"# Pending Migration — {today}\n")
    lines.append(
        "_Findings in files NOT yet added to `_design-system/_rebuilt_routes.json`. "
        "These are informational only — fix as routes are migrated. Generated by drift-check._\n"
    )
    lines.append(f"\n**Scope:** {len(info_files)} files, **{len(info_findings)}** findings.\n")

    if not info_findings:
        lines.append("_No findings in informational scope._\n")
        return "\n".join(lines) + "\n"

    # Top-N file count summary
    file_counts: dict[str, int] = {}
    for f in info_findings:
        file_counts[f.file] = file_counts.get(f.file, 0) + 1
    top = sorted(file_counts.items(), key=lambda kv: kv[1], reverse=True)[:10]
    lines.append("\n## Top 10 files by finding count\n")
    for fname, n in top:
        lines.append(f"- `{fname}` — {n} findings")

    lines.append("\n## All findings\n")
    by_file: dict[str, list[Finding]] = {}
    for f in info_findings:
        by_file.setdefault(f.file, []).append(f)
    for filename in sorted(by_file.keys()):
        lines.append(f"\n### `{filename}` ({len(by_file[filename])})\n")
        for finding in by_file[filename]:
            lines.append(finding.render())

    return "\n".join(lines) + "\n"


# ─────────────────────────────────────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────────────────────────────────────

def main() -> int:
    parser = argparse.ArgumentParser(description="Solen drift-check")
    parser.add_argument("--strict-only", action="store_true",
                        help="Only scan files in _rebuilt_routes.json. Skip legacy informational pass.")
    parser.add_argument("--out", default="_design-system/_drift-report.md",
                        help="Output path for strict report (default: _design-system/_drift-report.md)")
    parser.add_argument("--pending-out", default="_design-system/_pending-migration.md",
                        help="Output path for informational pending-migration report")
    parser.add_argument("--root", default=".", help="Project root (default: cwd)")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    strict_globs = load_strict_globs(root)

    all_files = list_files(root)
    strict_files, info_files = split_scope(all_files, strict_globs, root)

    # If --strict-only AND no strict files, scan all under strict rules.
    # Otherwise informational pass shows the legacy drift surface.
    if args.strict_only:
        info_files = []

    strict_findings: list[Finding] = []
    for f in strict_files:
        strict_findings.extend(scan_file(f, root))

    info_findings: list[Finding] = []
    if not args.strict_only:
        for f in info_files:
            info_findings.extend(scan_file(f, root))

    # V3-D330: fold A7-A11 strict-INFO findings into the pending report.
    # They originate from strict-scope files but are phase-1 informational, so
    # they belong on the migration queue alongside legacy findings.
    strict_info_findings = [f for f in strict_findings if _is_info_rule(f)]
    pending_findings = list(info_findings) + strict_info_findings
    pending_files_set = set(info_files)
    if strict_info_findings:
        # Add the strict files that had INFO findings to the pending file set
        # so the report's "Top N files" panel includes them.
        for f in strict_files:
            try:
                rel = str(f.relative_to(root))
            except ValueError:
                rel = str(f)
            if any(finding.file == rel for finding in strict_info_findings):
                pending_files_set.add(f)
    pending_files = sorted(pending_files_set)

    # Write reports
    out_path = root / args.out
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(
        render_report(strict_files, strict_findings, info_files, info_findings, args.strict_only),
        encoding="utf-8",
    )
    strict_hard_count = sum(1 for f in strict_findings if not _is_info_rule(f))
    strict_info_count = len(strict_info_findings)
    print(f"Wrote {out_path} — strict hard: {strict_hard_count} in {len(strict_files)} files; phase-1 INFO (A7-A11): {strict_info_count}.")

    # Always write pending — V3-D330 strict-INFO needs it even in --strict-only mode.
    if pending_findings or info_files:
        pending_path = root / args.pending_out
        pending_path.parent.mkdir(parents=True, exist_ok=True)
        pending_path.write_text(
            render_pending(pending_files, pending_findings),
            encoding="utf-8",
        )
        print(f"Wrote {pending_path} — pending total: {len(pending_findings)} findings in {len(pending_files)} files.")

    # Always exit 0 — logger, not gate.
    return 0


if __name__ == "__main__":
    sys.exit(main())
