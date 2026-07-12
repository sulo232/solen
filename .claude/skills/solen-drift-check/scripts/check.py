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
    "#1E54B7",  # s-accent-deep hover step (DS-6, single-point rule in globals.css)
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
    # V3-D446: token-EQUIVALENT values. These ARE the design tokens; they legitimately
    # appear inline in SVG fills (fill="#FFC32B"), inline style={{}} objects, and colour-data
    # structures where a Tailwind class can't reach. A2 (now INFO) still nudges the class-context
    # form (bg-[#0A0A0A]) toward the token. Non-token hex stays HARD.
    "#6B6B6B",  # s-ink-2 / s-ink-3
    "#E7E5E4",  # empty-star fill + avatar palette step (was s-border before V3-D447)
    "#F4F4F5",  # s-bg-sunken / s-bg-active (was transposed #F5F5F4; fixed 2026-07-11 , real value per LOCKFILE/CLAUDE.md)
    "#276EF1",  # s-accent (royal blue)
    "#D6D3D1",  # stone-300 (avatar initial palette step)
    "#A8A29E",  # stone-400 (avatar initial palette step)
    # V3-D450: BentoBusiness BAR_GRADIENT — provisional brand-blue gradient, exact colour TBD (V3-D219).
    "#1638C4", "#B8C4F0",
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
CANONICAL_DURATIONS_MS = {80, 100, 150, 200, 250, 300, 500}  # V3-D450: +100 (standard short transition)

# A5: Retired-but-defined color tokens — defined in tailwind.config.js
# for back-compat with un-rebuilt routes, but new code using them = drift.
RETIRED_TOKENS = {
    "s-coral",
    "s-cream",
    "s-butter",
    "s-sage",
    "s-wasabi",
    "s-droplet",
    # s-pop removed 2026-07-11: LOCKFILE un-retired it (V3-D424); a live urgency-badge token, not drift.
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
    # V3-D420: most shared components live in components-legacy/; scan it so
    # control-elevation (A14) + the other rules cover it. INFO rules stay non-blocking.
    "components-legacy/**/*.tsx",
    "components/**/*.tsx",
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

# A19 — sub-12px text. LOCKFILE §2.5 + SENIOR_SCORECARD dim 4: "nothing below 12px (legibility)".
# A clean, low-false-positive static check (unlike a per-file size COUNT, which is noisy and best
# measured on the rendered DOM by the verifier). Catches text-[11px] / text-[10.5px] / text-[9px].
# HARD as of 2026-06-09: the app-wide sweep floored all 826 instances (text-[Npx] N<12 -> text-[12px],
# commit e97d6906f), so the gate now blocks net-new sub-12px. Does NOT catch the ≤4-sizes budget — that
# is a DOM measurement (see SENIOR_SCORECARD.md "How to use").
SUB12_TEXT_RE = re.compile(r"\btext-\[(\d+(?:\.\d+)?)px\]")

# A20 — middle-dot separator (V3-D462, 2026-06-09). The owner has rejected separator dots many times
# ("stop using dots, use a line"). The middle-dot `·` (U+00B7) is FORBIDDEN as a SEPARATOR — use
# <MetaDot /> (a no-glyph gap) or an em-space. HARD as of 2026-06-09 (separator sweep done).
# Comment-stripped so doc prose isn't flagged. Matches the SEPARATOR pattern only (whitespace-adjacent
# ` · `), NOT a lone `"·"` glyph used as a fallback avatar initial (Header/profile/salonInitials) —
# that is content, not a separator, and stays allowed.
MIDDLE_DOT_RE = re.compile(r"\s·|·\s")

# A3 — Tailwind duration. Captures duration-{N} or duration-[Nms].
DURATION_TW_NUM_RE = re.compile(r"\bduration-(\d+)\b")
DURATION_TW_ARB_RE = re.compile(r"\bduration-\[(\d+)ms\]")

# A4 — Tailwind easing class.
EASING_TW_RE = re.compile(r"\bease-([a-z][\w-]*)\b")

# A5 — Retired tokens — match by token name as Tailwind class fragments.
def retired_token_re(tok: str) -> re.Pattern:
    # Token can appear as `bg-<token>`, `text-<token>`, `border-<token>`, `from-<token>`, etc.
    return re.compile(rf"\b(?:bg|text|border|fill|stroke|from|to|via|ring|outline)-{re.escape(tok)}\b")

# A15 — raw Tailwind palette colour (V3-D442, CONSISTENCY_AUDIT). In a fully
# tokenised app a raw palette class (bg-red-500, text-green-700, border-gray-200,
# ...) is drift: use a semantic token (s-error / s-success / s-warning / s-accent
# / s-ink / s-bg-*). The audit found 50+ raw `red-*` parallel to ~180 `s-error`.
RAW_PALETTE_RE = re.compile(
    r"\b(?:bg|text|border|ring|fill|stroke|from|to|via|outline|decoration|divide|placeholder|caret)-"
    r"(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|"
    r"slate|gray|grey|zinc|neutral|stone)-(?:50|100|200|300|400|500|600|700|800|900|950)\b"
)

# A16 — decorative accent dot (V3-D442). A tiny `rounded-full bg-s-accent` span is a
# banned decorative dot (taste rule #2 / LOCKFILE §11). Green `bg-s-success` status
# dots ARE allowed (they carry meaning), so this matches `bg-s-accent` + a tiny size
# specifically. Checked via three substrings on the line (class order varies).
A16_DOT_SIZE_RE = re.compile(r"\b[hw]-(?:1|1\.5|2)\b|\b[hw]-\[[2-8]px\]")

# A17 — opacity hairline (V3-D443, CONSISTENCY_AUDIT). The opacity-modulated ink
# border (`border-s-ink/10`, `border-s-ink/[0.06]`, ...) is the single most-
# duplicated drift (~480 sites) and A2 misses it (the bracket sits after `/`, not
# `-`). Canonical chrome hairline = `border-s-border`. The lookbehind skips
# variant-prefixed forms (`hover:`/`focus:`/`md:` border-s-ink, intentional);
# the on-photo / over-ink exemption is applied in scan_text.
HAIRLINE_OPACITY_RE = re.compile(r"(?<!:)\bborder-s-ink/(?:[0-9.]+|\[[0-9.]+\])")

# A18 — flip-flop guard (V3-D443). The green availability PILL was removed by the
# owner; card availability = plain ink text. Catch its re-introduction: a
# green-pill bg co-occurring with an availability / time signal (Clock, HH:MM,
# heute/morgen/Frei, nextSlot). A plain green success icon/banner (no time signal)
# is unaffected. This is the one "don't re-open a locked decision" guard wired as
# a gate rule instead of a doc.
A18_AVAIL_SIGNAL_RE = re.compile(r"<Clock|\b\d{1,2}:\d{2}\b|heute|morgen|Frei in|nextSlot", re.IGNORECASE)

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

# A9 — text-s-accent on NON-INTERACTIVE text (Design Language v2, 2026-06-09)
# v2 rule 1: BLUE = INTERACTIVITY. s-accent is now ALLOWED (and expected) on any tappable
# affordance — links, see-all/view-all, active tabs/segments, secondary & ghost buttons,
# tappable rows, inline action labels, interactive icon tints — plus the system states it
# always had (focus ring, Spinner, form-input focus). v2 rule 2: it stays OFF non-interactive
# text (eyebrows, body, prices, headings) and never FILLS a primary CTA.
# This check now only nudges (INFO) when blue appears with NO sign of interactivity on the line.
ACCENT_TEXT_RE = re.compile(r"\btext-s-accent\b")
ACCENT_BG_RE   = re.compile(r"\bbg-s-accent(?:-pale)?\b")
# Whitelist — lines showing ANY of these are interactive (or system-feedback) → allowed under v2.
ACCENT_ALLOWED_HINTS = (
    "focus-visible",
    "focus:",
    "Spinner",
    "spinner",
    "outline-s-accent",   # outline ring
    "ring-s-accent",      # focus ring
    "border-s-accent",    # input focus border / blue-ghost secondary button
    # v2-era interactivity markers, kept as FP-suppressors for this INFO rule (NOT law):
    # under LOCKFILE §1.5 v3 blue on a tab/selected/tappable thing is only correct if it
    # reads as a hyperlink (or is the locked booking date/slot exception). The BLOCKING
    # enforcement for blue selected-states lives in no-black-selected-gate; tightening
    # this list needs a live FP count first (parked, design-governance audit 2026-07-10).
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

# A21 — tracked-uppercase eyebrow (banned on customer surfaces, owner 2026-06-11;
# the WalkInBand one was the last live instance).
A21_EYEBROW_RE = re.compile(r'uppercase[^"\']*tracking-\[0\.1|tracking-\[0\.1[^"\']*uppercase')

# B5 — Category-specific branches (V3-D205 universal-components rule).
# Catches: if (category === 'coiffeur'), category == "barber", etc.
CATEGORY_BRANCH_RE = re.compile(
    r"category\s*===?\s*[\'\"](?:coiffeur|barbershop|barber|nails|spa|massage)[\'\"]",
    re.IGNORECASE,
)

# A14 — control elevation (V3-D420 / CONTROL_ELEVATION.md). A control SHAPE
# (rounded-full / rounded-btn / rounded-pill) carrying bg-white(/NN) + a box-shadow,
# NOT over a photo (no backdrop-blur / absolute / inset-0 / object-cover hint),
# = the banned "elevated white on a calm surface" drift. INFO + heuristic: over-photo
# controls and rounded-2xl/3xl card surfaces are intentionally NOT matched.
A14_BG_WHITE_RE = re.compile(r"\bbg-white(?:/\d+)?\b")
A14_SHADOW_RE = re.compile(
    r"\bshadow-(?:elevation-[123]|card|card-hover|surface|surface-hover|"
    r"warm-(?:xs|sm|md|lg|xl|float)|v5-[\w-]+|pressed|\[)"
)
A14_CONTROL_SHAPE_RE = re.compile(r"\brounded-(?:full|btn|pill)\b")
A14_OVER_IMAGE_RE = re.compile(r"\b(?:backdrop-blur|absolute|inset-0|object-cover)\b|FROST_GLASS")


# ─────────────────────────────────────────────────────────────────────────────
# C1-C7 - anti-hardcode family (2026-06-28). Secrets, URLs, UUIDs, magic numbers,
# untranslated copy, absolute fs paths, money literals. C1 HARD-blocks ON PRESENCE
# (a pre-existing secret still blocks, special-cased in run_gate_stdin); C2/C3/C6/C7
# block NET-NEW; C4/C5 + the soft variants are WARN (INFO-prefixed, never gate).
# D1-D6 - anti-bloat family. All WARN (INFO-prefixed): console noise, dead commented
# code, overlong/duplicated functions, redundant comments, bare TODO markers.
# ─────────────────────────────────────────────────────────────────────────────

# C1 - secret/credential literals. Each is a (name, compiled-regex) pair. The
# `service_role` word is handled separately (bare = WARN, next-to `=`/`eyJ` = BLOCK).
C1_STRIPE_RE = re.compile(r"\b(?:sk|pk|rk)_(?:live|test)_[0-9A-Za-z]{8,}")
# JWT / Supabase anon|service key: three base64url segments, the first two each
# starting with `eyJ` (header + payload).
C1_JWT_RE = re.compile(r"\beyJ[0-9A-Za-z_-]{10,}\.eyJ[0-9A-Za-z_-]{10,}\.[0-9A-Za-z_-]{10,}")
C1_ANTHROPIC_RE = re.compile(r"\bsk-(?:ant|proj)-[0-9A-Za-z_-]{8,}")
C1_GOOGLE_API_RE = re.compile(r"\bAIza[0-9A-Za-z_-]{35}\b")
# Generic: a credential-named key assigned a quoted literal >= 12 chars.
C1_GENERIC_RE = re.compile(
    r"\b(?:api_key|apikey|secret|token|password|passwd|private_key|access_key|"
    r"secret_key|client_secret|auth_token)\b"
    r"\s*[:=]\s*[\"'`]([^\"'`]{12,})[\"'`]",
    re.IGNORECASE,
)
C1_SERVICE_ROLE_RE = re.compile(r"\bservice_role\b")
# Lines that legitimately carry long base64-ish / opaque strings that are NOT
# secrets: inline SVG path data, data: URIs, XML namespaces, SRI integrity hashes.
C1_SKIP_LINE_RE = re.compile(r'\bd="|\bdata:|\bxmlns|\bintegrity=')
# Files exempt from the generic-secret heuristic noise (lockfiles / message bundles
# / SVG assets handled per-rule below).
C1_LOCKFILE_NAMES = ("package-lock.json", "pnpm-lock.yaml", "yarn.lock", "bun.lockb")

# C2 - environment/secret-bearing URLs. Supabase project URL, the solen.ch
# production domain, and any localhost:PORT hardcode BLOCK net-new; any other
# quoted http(s):// literal is WARN.
C2_SUPABASE_URL_RE = re.compile(r"https?://[a-z0-9]{8,}\.supabase\.(?:co|in|net)\b", re.IGNORECASE)
C2_SOLEN_URL_RE = re.compile(r"https?://(?:[a-z0-9-]+\.)*solen\.ch\b", re.IGNORECASE)
C2_LOCALHOST_RE = re.compile(r"https?://(?:localhost|127\.0\.0\.1):\d{2,5}\b")
C2_ANY_URL_RE = re.compile(r"[\"'`](https?://[^\"'`\s]+)[\"'`]")
# Allowlist substrings - these http(s) literals are spec/standards refs, not env.
C2_ALLOW_HINTS = ("schema.org", "www.w3.org", "ogp.me", "googleapis.com/css")

# C3 - hardcoded v4 UUID literal (e.g. a pinned salon/user id in source).
C3_UUID_RE = re.compile(
    r"\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}\b"
)

# C4 - magic numbers (WARN, heavily filtered). A bare numeric literal that is not
# a CSS/Tailwind value, not an array index, not a known-safe constant.
C4_NUMBER_RE = re.compile(r"(?<![\w.#%\[-])(\d{2,})(?![\w.%px])")
C4_KNOWN_SAFE = {0, 1, 2, -1, 100, 1000, 24, 60, 7, 12, 30, 365}
# Lines that are CSS/Tailwind/style and should be skipped wholesale for C4.
C4_SKIP_LINE_RE = re.compile(
    r"-\[|rounded|\bgap-|\bp-|\bpx-|\bpy-|\bpt-|\bpb-|\bpl-|\bpr-|\bm-|\bmx-|\bmy-|"
    r"\bz-|\bw-|\bh-|\brgba?\(|cubic-bezier|px\b|%|translate|rotate|scale|opacity-|"
    r"duration-|delay-|tracking-|leading-"
)
# HTTP status codes are fine in API routes.
C4_HTTP_STATUS = {200, 201, 202, 204, 301, 302, 304, 400, 401, 403, 404, 405, 409, 410, 422, 429, 500, 502, 503}

# C5 - untranslated JSX copy (next-intl). A JSX text node or a display-prop string
# literal holding a human phrase that is not wrapped in {t(...)}.
C5_JSX_TEXT_RE = re.compile(r">\s*([A-Za-z][A-Za-z .,!?'’\-]{3,})\s*<")
C5_DISPLAY_PROP_RE = re.compile(
    r'\b(?:title|label|placeholder|alt|aria-label)\s*=\s*"([A-Za-z][A-Za-z .,!?\'’\-]{3,})"'
)
C5_BRAND_ALLOW = {"solen", "stripe", "supabase", "google", "apple"}

# C6 - absolute filesystem path literal embedded in app source.
C6_FS_PATH_RE = re.compile(
    r"[\"'`](?:/Users/|/home/|[A-Za-z]:\\\\|[A-Za-z]:/|/private/tmp/|/var/folders/)[^\"'`]+[\"'`]"
)

# C7 - money: a fee/commission/tax field assigned a numeric literal.
C7_MONEY_RE = re.compile(
    r"\b(commission|platform_fee|fee|vat|mwst|tax|discount|rate)\b"
    r"\s*[:=]\s*(-?\d+(?:\.\d+)?)",
    re.IGNORECASE,
)
# CHF display literal -> WARN.
C7_CHF_RE = re.compile(r"\bCHF\s*\d|\b\d+(?:\.\d{2})?\s*CHF\b")
# VAT special note (project defers the 8.1% VAT; keys off bookings.platform_fee).
C7_VAT_RE = re.compile(r"\b0\.081\b|\b8\.1\s*%")

# D1 - console noise (console.error / console.warn are ALLOWED per project rule).
D1_CONSOLE_RE = re.compile(r"\bconsole\.(log|debug|dir|trace)\b|\bdebugger\b")

# D2 - commented-out code block: a `//`-prefixed line that looks like code (ends
# in `;`/`{`/`}`/`)` or contains an assignment/keyword). Only flagged in runs >= 3.
D2_CODE_COMMENT_RE = re.compile(
    r"^\s*//\s*(?:const |let |var |function |return |if\s*\(|for\s*\(|while\s*\(|"
    r"import |export |await |[A-Za-z_$][\w$.]*\s*=|[A-Za-z_$][\w$.]*\([^)]*\)\s*;?\s*$|"
    r".*[;{}]\s*$)"
)
D2_JSDOC_EXAMPLE_RE = re.compile(r"@example")

# D5 - redundant comment: `// set/get/return/loop through <noun>`.
D5_REDUNDANT_RE = re.compile(
    r"^\s*//\s*(set|get|return|loop through|loop over|increment|decrement)\s+\w+",
    re.IGNORECASE,
)

# D6 - bare TODO/FIXME/XXX/HACK without a ticket reference.
D6_TODO_RE = re.compile(r"\b(TODO|FIXME|XXX|HACK)\b")
D6_TICKET_RE = re.compile(r"#\d|SOL-\d|V3-D\d|https?://")


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
    try:
        text = path.read_text(encoding="utf-8")
    except (UnicodeDecodeError, FileNotFoundError):
        return []

    if root is not None:
        try:
            rel = str(path.relative_to(root))
        except ValueError:
            rel = str(path)
    else:
        rel = str(path)

    return scan_text(text, rel, respect_inline_skip=True)  # V3-D450: report respects drift-ok (acknowledged exceptions drop from hard)


def _code_only(line: str, in_block: bool) -> tuple[str, bool]:
    """Return (line with // and /* */ comments blanked, still-in-block-comment).

    Used ONLY to suppress A1 hex-in-comment false positives (V3-D446): a hex inside a
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


# ── C/D path-scope helpers ──────────────────────────────────────────────────
# These keep the per-line C/D logic readable; each answers "does rule X apply to
# this file?" based ONLY on the relative path (cheap, no content).

def _rel_basename(rel: str) -> str:
    return rel.rsplit("/", 1)[-1]


def _is_test_file(rel: str) -> bool:
    base = _rel_basename(rel)
    return (
        ".test." in base or ".spec." in base or ".stories." in base
        or "/__tests__/" in rel or rel.startswith("__tests__/")
    )


def _c1_jwt_exempt(rel: str) -> bool:
    """JWT pattern (C1) is exempt in test/spec files only."""
    base = _rel_basename(rel)
    return (
        ".test." in base or ".spec." in base
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


def _is_api_route(rel: str) -> bool:
    return rel.startswith("app/api/")


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


def _compute_d3_lines(lines: list[str]) -> set[int]:
    """Start-line of every function body longer than 80 lines whose body contains
    control flow (if/for/while/switch). Brace-depth tracked from the declaration."""
    flagged: set[int] = set()
    decl_re = re.compile(
        r"\b(?:function\s+[A-Za-z_$][\w$]*\s*\(|"
        r"(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*=\s*(?:async\s+)?\([^)]*\)\s*=>|"
        r"(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*=\s*(?:async\s+)?function\b|"
        r"[A-Za-z_$][\w$]*\s*\([^)]*\)\s*\{)"
    )
    control_re = re.compile(r"\b(?:if|for|while|switch)\s*\(")
    n = len(lines)
    i = 0
    while i < n:
        line = lines[i]
        if decl_re.search(line) and "{" in line:
            # Walk braces from the first '{' on the declaration line.
            depth = 0
            started = False
            j = i
            has_control = False
            while j < n:
                for ch in lines[j]:
                    if ch == "{":
                        depth += 1
                        started = True
                    elif ch == "}":
                        depth -= 1
                if j > i and control_re.search(lines[j]):
                    has_control = True
                if started and depth <= 0:
                    break
                j += 1
            body_len = j - i + 1
            if body_len > 80 and has_control:
                flagged.add(i + 1)
            i = j + 1
            continue
        i += 1
    return flagged


def _compute_d4_lines(lines: list[str]) -> set[int]:
    """Start-line of the SECOND occurrence of any duplicated 6-line window of
    non-trivial code (D4). Trivial lines (blank, lone brace, import) are skipped
    when forming the window so cosmetic repetition isn't flagged."""
    flagged: set[int] = set()

    def _nontrivial(s: str) -> bool:
        t = s.strip()
        if len(t) < 4:
            return False
        if t in ("{", "}", "{}", "})", "});", "()", "([", "])"):
            return False
        if t.startswith(("import ", "export ", "//", "/*", "*", "*/")):
            return False
        return True

    idxs = [i for i, s in enumerate(lines) if _nontrivial(s)]
    seen: dict[str, int] = {}
    win = 6
    for k in range(len(idxs) - win + 1):
        window_idxs = idxs[k:k + win]
        # require the window to be reasonably contiguous (no giant gap)
        if window_idxs[-1] - window_idxs[0] > win * 3:
            continue
        key = "\n".join(lines[wi].strip() for wi in window_idxs)
        if key in seen:
            flagged.add(window_idxs[0] + 1)
        else:
            seen[key] = window_idxs[0]
    return flagged


def scan_text(text: str, rel: str, respect_inline_skip: bool = False) -> list[Finding]:
    """Scan raw text as one virtual file `rel`.

    Used by scan_file (a path on disk) AND by the PreToolUse drift gate, which
    scans the *incoming* Edit/Write content (a string, not yet on disk) so it
    can block net-new drift before it lands.

    respect_inline_skip: when True, any line containing `drift-ok` is skipped,
    the gate's per-line escape hatch for intentional, justified exceptions. The
    full-report path leaves this False so the report still surfaces everything.
    """
    findings: list[Finding] = []
    in_block_comment = False
    all_lines = text.splitlines()
    # Multi-line D-family pre-passes (D2/D3/D4 need cross-line context). Skipped
    # for *.md (D2 prose) below per-line; D3/D4 only fire on app-ish source lines.
    is_md = rel.endswith(".md")
    d2_lines = set() if is_md else _compute_d2_lines(all_lines)
    d3_lines = _compute_d3_lines(all_lines)
    d4_lines = _compute_d4_lines(all_lines)
    for ln_no, line in enumerate(all_lines, start=1):
        # Comment-strip for A1 hex detection only (V3-D446): a hex inside a // or /* */
        # (incl. JSX {/* */}) comment is documentation, not drift. Every other rule keeps
        # the raw line — the no-emoji-in-comments rule (A6) is deliberate.
        code_line, in_block_comment = _code_only(line, in_block_comment)
        if respect_inline_skip and "drift-ok" in line:
            continue
        # A1 — hardcoded hex (comment-stripped: only real, non-comment hex is drift)
        for m in HEX_RE.finditer(code_line):
            hex_val = m.group(0).upper()
            # Normalize 3-digit shorthand to 6 for compare? Keep both forms in allowlist.
            if hex_val.upper() not in {h.upper() for h in ALLOWED_HEX}:
                findings.append(Finding(
                    file=rel, line=ln_no, rule="A1: hardcoded hex",
                    snippet=line,
                    recommendation=f"Use a Tailwind token for `{hex_val}` if one exists; add to ALLOWED_HEX in check.py if intentionally inline.",
                ))

        # A2 — arbitrary Tailwind values. INFORMATIONAL (V3-D446): arbitrary SIZES / radii
        # (text-[15px], rounded-[12px], w-[320px]) are LOCKFILE-sanctioned, so flagging them
        # HARD contradicted our own contract (983 of 1084 "strict hard" findings were this one
        # rule). Arbitrary COLORS (bg-[#hex]) stay HARD via A1 (hardcoded hex) + A15, so there
        # is no real-drift gap. Kept as INFO so it still nudges toward tokens in pending-migration.
        for m in ARBITRARY_TW_RE.finditer(line):
            cls = m.group(0)
            # Heuristic: filter known-deliberate arbitrary values that have a SOURCE.md
            # rationale. duration-[80ms] is allowed (active-press feedback).
            if cls.startswith("duration-["):
                continue  # handled by A3 specifically
            findings.append(Finding(
                file=rel, line=ln_no, rule="INFO A2: arbitrary Tailwind value",
                snippet=line,
                recommendation=f"`{cls}` — prefer a tokenized class. If intentional, add a V3-D{{n}} comment explaining why.",
            ))

        # A19 — sub-12px text (HARD as of 2026-06-09; app-wide sweep done, 826 instances floored). "nothing below 12px" per LOCKFILE §2.5 / SENIOR_SCORECARD dim 4.
        for m in SUB12_TEXT_RE.finditer(line):
            px = float(m.group(1))
            if px < 12:
                findings.append(Finding(
                    file=rel, line=ln_no, rule="A19: sub-12px text",
                    snippet=line,
                    recommendation=f"`text-[{m.group(1)}px]` is below the 12px legibility floor (LOCKFILE §2.5). Use the Meta role (12-13px) or larger.",
                ))

        # A20 — middle-dot separator (HARD as of 2026-06-09; separator sweep done). Owner: "stop using dots, use a line."
        if MIDDLE_DOT_RE.search(code_line):
            findings.append(Finding(
                file=rel, line=ln_no, rule="A20: middle-dot separator",
                snippet=line,
                recommendation="Middle-dot `·` is forbidden as a separator (LOCKFILE §2.5 A12, V3-D463). NO separator glyph — use <MetaDot /> (a no-glyph gap) or an em-space (U+2003). Not a `·`, not a `|`.",
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
        # INFORMATIONAL (V3-D450): arbitrary durations (duration-[Xms]) are hand-tuned motion
        # (usually paired with a custom cubic-bezier), not drift — same reasoning as A2 sizes.
        # The nudge toward canonical stays as INFO. Non-arbitrary duration-N (above) stays HARD.
        for m in DURATION_TW_ARB_RE.finditer(line):
            n = int(m.group(1))
            if n not in CANONICAL_DURATIONS_MS:
                findings.append(Finding(
                    file=rel, line=ln_no, rule="INFO A3: non-canonical duration (arbitrary)",
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

        # A15 — raw Tailwind palette colour (HARD; gate blocks net-new). V3-D442.
        # comment-stripped (V3-D446): a palette class named in a comment is documentation.
        for m in RAW_PALETTE_RE.finditer(code_line):
            findings.append(Finding(
                file=rel, line=ln_no, rule="A15: raw Tailwind palette colour",
                snippet=line,
                recommendation=f"`{m.group(0)}` is a raw Tailwind palette colour. Use a semantic token: s-error / s-success / s-warning / s-accent / s-ink / s-bg-* (CONSISTENCY_AUDIT V3-D442).",
            ))

        # A16 — decorative accent dot (HARD; gate blocks net-new). V3-D442.
        if "rounded-full" in line and "bg-s-accent" in line and A16_DOT_SIZE_RE.search(line):
            findings.append(Finding(
                file=rel, line=ln_no, rule="A16: decorative accent dot",
                snippet=line,
                recommendation="A tiny `rounded-full bg-s-accent` span is a banned decorative dot (taste rule #2). Delete it. If it carries live status, a green `bg-s-success` dot is the allowed pattern.",
            ))

        # A17 — opacity hairline -> border-s-border (HARD; gate blocks net-new). V3-D443.
        # Skip on-photo / over-ink borders (a darker border is legitimate there).
        if (HAIRLINE_OPACITY_RE.search(code_line)  # comment-stripped (V3-D446)
                and not A14_OVER_IMAGE_RE.search(line)
                and "text-white" not in line
                and "bg-s-ink" not in line
                and "bg-black" not in line):
            findings.append(Finding(
                file=rel, line=ln_no, rule="A17: opacity hairline (use border-s-border)",
                snippet=line,
                recommendation="Chrome hairlines use `border-s-border` (#E7E5E4). `border-s-ink/{op}` is the most-duplicated drift; reserve it ONLY for a border over a photo / ink surface (CONSISTENCY_AUDIT V3-D443). If this IS over a photo, add `drift-ok`.",
            ))

        # A18 — flip-flop guard: re-added green availability pill (HARD; net-new). V3-D443.
        if "bg-s-success-bg" in line and A18_AVAIL_SIGNAL_RE.search(line):
            findings.append(Finding(
                file=rel, line=ln_no, rule="A18: green availability pill (removed, do not re-add)",
                snippet=line,
                recommendation="The green availability pill was REMOVED by the owner (V3-D443). Card availability = plain ink text (Clock + time in text-s-ink). Do not re-add a green pill.",
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

        # A21 — tracked-uppercase eyebrow (owner ban, 2026-06-11).
        if A21_EYEBROW_RE.search(line):
            findings.append(Finding(
                file=rel, line=ln_no, rule="A21: tracked-uppercase eyebrow",
                snippet=line,
                recommendation="Tracked-uppercase eyebrows are banned on customer surfaces (owner 2026-06-11; LOCKFILE 2.5 eyebrow policy superseded). The H2 + a normal-case sub carries the section.",
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
        # LAW = LOCKFILE §1.5 v3 (2026-06-11, supersedes v2 "generous" + the folded CANON §0):
        # blue is the HYPERLINK color, not the clickability color. Allowed: hyperlink-reading text
        # (review counts, inline body links, Mehr lesen, Passwort vergessen, Ändern jump-links)
        # + system states (focus ring / Spinner / input focus / §13.2 stepper discs).
        # See-all / active tabs / secondary+ghost buttons / icon tints = INK with affordance.
        # Heuristic: line contains text-s-accent OR bg-s-accent-pale,
        # but does NOT contain any ACCENT_ALLOWED_HINTS substring.
        if ACCENT_TEXT_RE.search(line) or ACCENT_BG_RE.search(line):
            if not any(hint in line for hint in ACCENT_ALLOWED_HINTS):
                findings.append(Finding(
                    file=rel, line=ln_no, rule="INFO A9: blue outside the hyperlink scope (v3)",
                    snippet=line,
                    recommendation="LOCKFILE §1.5 v3 (2026-06-11): blue `s-accent` is the HYPERLINK color — CORRECT only on text that reads as an <a href> inside prose (review counts \"(12)\", inline body links, Mehr lesen, the one Passwort vergessen, checkout Ändern jump-links) plus locked system states (focus ring / Spinner / input focus / §13.2 stepper discs). WRONG on see-all / active tabs / secondary & ghost buttons / icon tints (→ INK + affordance: chevron / weight / position), on NON-interactive text — eyebrows, body, prices, headings (→ ink/grey) — and as a FILLED primary CTA (→ bg-s-ink). Squint test: ~3 blue strings max per viewport, 0-1 on forms.",
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

        # A14 — control elevation (INFO, V3-D420). White + shadow on a control
        # shape that is NOT over a photo = grey-haze drift; calm controls go flat.
        if (A14_CONTROL_SHAPE_RE.search(line)
                and A14_BG_WHITE_RE.search(line)
                and A14_SHADOW_RE.search(line)
                and not A14_OVER_IMAGE_RE.search(line)):
            findings.append(Finding(
                file=rel, line=ln_no, rule="INFO A14: elevated-white control on a calm surface",
                snippet=line,
                recommendation="Per CONTROL_ELEVATION.md (V3-D420): white+shadow is reserved for glass-over-photo (FROST_GLASS, lib/frost-glass.ts) and the one ink CTA. A calm control on white / s-bg-sunken casts NO shadow: text -> bg-s-bg-sunken no shadow; icon-only -> bg-white border-s-border no shadow. If this control IS over a photo, ignore (the line scanner can't see the background).",
            ))

        # ─────────────────────────────────────────────────────────────
        # C1-C7 - anti-hardcode family (2026-06-28).
        # ─────────────────────────────────────────────────────────────

        # C1 - secrets. HARD-BLOCK ON PRESENCE (special-cased in run_gate_stdin so a
        # pre-existing secret still blocks). Skips *.svg / lockfiles / messages/*.json
        # entirely, and per-line skips SVG path data / data: URIs / xmlns / integrity.
        c1_base = _rel_basename(rel)
        c1_file_skip = (
            rel.endswith(".svg")
            or c1_base in C1_LOCKFILE_NAMES
            or (rel.startswith("messages/") and rel.endswith(".json"))
            or ("/messages/" in rel and rel.endswith(".json"))
        )
        if not c1_file_skip and not C1_SKIP_LINE_RE.search(line):
            secret_hit = None
            if C1_STRIPE_RE.search(line):
                secret_hit = "Stripe key"
            elif not _c1_jwt_exempt(rel) and C1_JWT_RE.search(line):
                secret_hit = "JWT / Supabase key"
            elif C1_ANTHROPIC_RE.search(line):
                secret_hit = "Anthropic key"
            elif C1_GOOGLE_API_RE.search(line):
                secret_hit = "Google API key"
            elif C1_GENERIC_RE.search(line):
                secret_hit = "generic credential literal"
            if secret_hit:
                findings.append(Finding(
                    file=rel, line=ln_no, rule="C1: secret/credential literal",
                    snippet=line,
                    recommendation=f"A {secret_hit} is committed in source. Move it to an env var (process.env.X) and rotate the exposed value. Never hardcode credentials.",
                ))
            elif C1_SERVICE_ROLE_RE.search(line):
                # service_role next to `=` / `eyJ` -> BLOCK; bare word -> WARN.
                if "=" in line or "eyJ" in line:
                    findings.append(Finding(
                        file=rel, line=ln_no, rule="C1: service_role key assignment",
                        snippet=line,
                        recommendation="A service_role key bypasses RLS. Never assign it in source; read SUPABASE_SERVICE_ROLE_KEY from env and keep it server-only.",
                    ))
                else:
                    findings.append(Finding(
                        file=rel, line=ln_no, rule="INFO C1: service_role mention",
                        snippet=line,
                        recommendation="`service_role` mentioned. Confirm this is not embedding the service-role key; it must come from a server-only env var.",
                    ))

        # C2 - env/secret-bearing URLs. Supabase project URL / solen.ch / localhost:PORT
        # BLOCK net-new; other quoted http(s):// -> WARN. Allowlist + *.svg skip.
        if not rel.endswith(".svg"):
            c2_localhost_skip = (
                _is_test_file(rel) or rel.startswith("scripts/") or "/scripts/" in rel
            )
            if C2_SUPABASE_URL_RE.search(line):
                findings.append(Finding(
                    file=rel, line=ln_no, rule="C2: hardcoded Supabase project URL",
                    snippet=line,
                    recommendation="The Supabase project URL must come from NEXT_PUBLIC_SUPABASE_URL, not a hardcoded literal (it differs per environment).",
                ))
            elif C2_SOLEN_URL_RE.search(line):
                findings.append(Finding(
                    file=rel, line=ln_no, rule="C2: hardcoded solen.ch URL",
                    snippet=line,
                    recommendation="Use a relative path or the env-driven base URL (NEXT_PUBLIC_SITE_URL) instead of hardcoding the solen.ch production domain.",
                ))
            elif C2_LOCALHOST_RE.search(line) and not c2_localhost_skip:
                findings.append(Finding(
                    file=rel, line=ln_no, rule="C2: hardcoded localhost:PORT",
                    snippet=line,
                    recommendation="A hardcoded localhost:PORT breaks in every non-local environment. Use an env-driven base URL.",
                ))
            else:
                for m in C2_ANY_URL_RE.finditer(line):
                    url = m.group(1)
                    if any(h in url for h in C2_ALLOW_HINTS):
                        continue
                    findings.append(Finding(
                        file=rel, line=ln_no, rule="INFO C2: hardcoded URL",
                        snippet=line,
                        recommendation=f"`{url}` is a hardcoded URL. Confirm it should not be env-driven or a relative path.",
                    ))
                    break

        # C3 - hardcoded v4 UUID literal. BLOCK net-new in app/components/lib source.
        if _is_app_source(rel) and not _c3_exempt(rel) and C3_UUID_RE.search(code_line):
            findings.append(Finding(
                file=rel, line=ln_no, rule="C3: hardcoded UUID literal",
                snippet=line,
                recommendation="A hardcoded v4 UUID in source is a pinned id (salon/user/row). Pass it as data / param / fixture, not a literal in application code.",
            ))

        # C4 - magic numbers (WARN only, heavily filtered).
        if not C4_SKIP_LINE_RE.search(line):
            c4_api = _is_api_route(rel)
            for m in C4_NUMBER_RE.finditer(line):
                start = m.start(1)
                # array index `[N]` -> skip
                if start > 0 and line[start - 1] == "[":
                    continue
                try:
                    val = int(m.group(1))
                except ValueError:
                    continue
                if val in C4_KNOWN_SAFE:
                    continue
                if c4_api and val in C4_HTTP_STATUS:
                    continue
                findings.append(Finding(
                    file=rel, line=ln_no, rule="INFO C4: magic number",
                    snippet=line,
                    recommendation=f"`{val}` is an unexplained literal. Extract it to a named constant or add a comment so its meaning is self-evident.",
                ))
                break

        # C5 - untranslated JSX copy (next-intl). WARN, .tsx only.
        if not _c5_exempt_file(rel) and "{t(" not in line and "{t." not in line:
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
                # single PascalCase word (likely a component / identifier)
                if " " not in p and p[:1].isupper() and p.isalnum() and not p.islower():
                    return False
                return True

            c5_done = False
            for m in C5_JSX_TEXT_RE.finditer(line):
                if _c5_flag(m.group(1)):
                    findings.append(Finding(
                        file=rel, line=ln_no, rule="INFO C5: untranslated JSX copy",
                        snippet=line,
                        recommendation=f"`{m.group(1).strip()}` looks like user-facing copy not wrapped in next-intl `{{t('...')}}`. Move it to messages/*.json and render via t().",
                    ))
                    c5_done = True
                    break
            if not c5_done:
                for m in C5_DISPLAY_PROP_RE.finditer(line):
                    if _c5_flag(m.group(1)):
                        findings.append(Finding(
                            file=rel, line=ln_no, rule="INFO C5: untranslated display prop",
                            snippet=line,
                            recommendation=f"`{m.group(1)}` is a hardcoded display string. Wrap it with next-intl `t('...')` and add the key to messages/*.json.",
                        ))
                        break

        # C6 - absolute filesystem path literal. BLOCK net-new in app source;
        # scripts/** and .claude/** are exempt (tooling legitimately uses them).
        c6_exempt = rel.startswith("scripts/") or "/scripts/" in rel or rel.startswith(".claude/") or "/.claude/" in rel
        if _is_app_source(rel) and not c6_exempt and C6_FS_PATH_RE.search(code_line):
            findings.append(Finding(
                file=rel, line=ln_no, rule="C6: absolute filesystem path literal",
                snippet=line,
                recommendation="An absolute machine path (/Users, /home, drive-letter, /private/tmp, /var/folders) will not exist in production. Use a relative path, an env var, or path.join from a known root.",
            ))

        # C7 - money literals. fee/commission/tax = numeric -> BLOCK net-new
        # (RHS 0/1 allowed); CHF display literal -> WARN; VAT 0.081 / 8.1% note.
        m_money = C7_MONEY_RE.search(line)
        if m_money:
            try:
                rhs = float(m_money.group(2))
            except ValueError:
                rhs = None
            if rhs is not None and rhs not in (0.0, 1.0):
                vat_note = ""
                if C7_VAT_RE.search(line):
                    vat_note = " NOTE: the project DEFERS the 8.1% VAT on the platform fee (project_commission_vat_deferred) and keys off bookings.platform_fee; do not hardcode 0.081 / 8.1%."
                findings.append(Finding(
                    file=rel, line=ln_no, rule="C7: hardcoded money/fee literal",
                    snippet=line,
                    recommendation=f"`{m_money.group(1)} = {m_money.group(2)}` hardcodes a money rule. Source fees/commission/tax from config or the DB (bookings.platform_fee), not a literal.{vat_note}",
                ))
        elif C7_CHF_RE.search(code_line):
            findings.append(Finding(
                file=rel, line=ln_no, rule="INFO C7: CHF amount literal",
                snippet=line,
                recommendation="A CHF amount literal in source is usually data, not code. Confirm it should not come from the DB / config (price, fee, discount).",
            ))

        # ─────────────────────────────────────────────────────────────
        # D1-D6 - anti-bloat family (2026-06-28). All WARN (INFO-prefixed).
        # ─────────────────────────────────────────────────────────────

        # D1 - console noise. console.error / console.warn are ALLOWED (project rule).
        if D1_CONSOLE_RE.search(code_line):
            findings.append(Finding(
                file=rel, line=ln_no, rule="INFO D1: console/debugger statement",
                snippet=line,
                recommendation="Remove console.log/debug/dir/trace + debugger before shipping. For real error logging use console.error / console.warn (the project-allowed forms).",
            ))

        # D2 - commented-out code block (>= 3 consecutive code-shaped // lines).
        if ln_no in d2_lines:
            findings.append(Finding(
                file=rel, line=ln_no, rule="INFO D2: commented-out code block",
                snippet=line,
                recommendation="Commented-out code rots and confuses readers. Delete it (git history keeps it). Keep only explanatory prose comments.",
            ))

        # D3 - overlong added function (> 80 lines with branching).
        if ln_no in d3_lines:
            findings.append(Finding(
                file=rel, line=ln_no, rule="INFO D3: overlong function",
                snippet=line,
                recommendation="This function exceeds 80 lines and contains branching. Consider extracting helpers so each unit does one thing.",
            ))

        # D4 - duplicated block (>= 6 non-trivial lines repeated).
        if ln_no in d4_lines:
            findings.append(Finding(
                file=rel, line=ln_no, rule="INFO D4: duplicated code block",
                snippet=line,
                recommendation="This 6+ line block duplicates an earlier one. Extract a shared helper instead of copy-pasting.",
            ))

        # D5 - redundant comment (// set/get/return/loop through + noun).
        if D5_REDUNDANT_RE.match(line):
            findings.append(Finding(
                file=rel, line=ln_no, rule="INFO D5: redundant comment",
                snippet=line,
                recommendation="This comment restates what the next line of code already says. Delete it or replace with a comment that explains WHY, not WHAT.",
            ))

        # D6 - bare TODO/FIXME/XXX/HACK without a ticket reference.
        if not rel.endswith(".md") and D6_TODO_RE.search(code_line) and not D6_TICKET_RE.search(line):
            findings.append(Finding(
                file=rel, line=ln_no, rule="INFO D6: bare TODO/FIXME marker",
                snippet=line,
                recommendation="A TODO/FIXME/XXX/HACK without a ticket reference (#123, SOL-123, V3-D{n}, or a URL) gets lost. Add a tracking reference or resolve it now.",
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
# PreToolUse drift gate (V3-D441, 2026-06-07)
# ─────────────────────────────────────────────────────────────────────────────

def run_gate_stdin() -> int:
    """Read `{file_path, new, old?}` JSON from stdin; gate on NET-NEW drift.

    Blocks (exit 2) only when the incoming `new` content introduces a HARD
    finding (A1-A6 / B1-B5) that was NOT already present in `old`. This is
    deliberate: strict scope already carries ~1k legacy hard findings, so a
    whole-file gate would block every edit. Net-new means "you only get stopped
    for drift you are adding right now" — the part that is actually fixable in
    the moment, and the part the agent keeps re-introducing.

    INFO rules (A7-A14 — typographic / elevation nuance still mid-sweep) NEVER
    gate; they stay in the logged report. Fail-OPEN on any error: a gate crash
    must never brick editing.
    """
    try:
        payload = json.loads(sys.stdin.read() or "{}")
    except Exception as e:  # fail-open on any malformed input
        print(f"drift-gate: unreadable stdin ({e}); allowing.", file=sys.stderr)
        return 0
    if not isinstance(payload, dict):  # `null` / list / scalar → fail-open
        return 0
    rel = payload.get("file_path") or "<stdin>"
    new = payload.get("new") or ""
    old = payload.get("old") or ""
    if not new.strip():
        return 0

    new_hard = [f for f in scan_text(new, rel, respect_inline_skip=True) if not _is_info_rule(f)]
    if not new_hard:
        return 0
    old_hard = (
        [f for f in scan_text(old, rel, respect_inline_skip=True) if not _is_info_rule(f)]
        if old else []
    )
    # C1 secrets BLOCK ON PRESENCE (bypass the net-new diff): a credential is a
    # leak whether or not the edit introduced it, so any C1 hit in `new` always
    # counts as over-budget even if `old` already carried it.
    secret_rules = {f.rule for f in new_hard if f.rule.startswith("C1:")}

    # Net-new is computed per RULE by count, not by exact line text: editing the
    # text around a pre-existing violation must NOT re-trigger the gate (the line
    # snippet changes even though the drift is unchanged). Block only when `new`
    # carries MORE instances of a rule than `old` did.
    def _counts(items: list[Finding]) -> dict[str, int]:
        c: dict[str, int] = {}
        for f in items:
            c[f.rule] = c.get(f.rule, 0) + 1
        return c

    new_counts = _counts(new_hard)
    old_counts = _counts(old_hard)
    over_rules = {r for r, n in new_counts.items() if n > old_counts.get(r, 0)}
    over_rules |= secret_rules  # secrets always block, even pre-existing
    if not over_rules:
        return 0
    delta = sum(
        new_counts[r] if r in secret_rules else (new_counts[r] - old_counts.get(r, 0))
        for r in over_rules
    )

    # Dedup display by (rule, snippet) so the same offending line isn't repeated.
    seen: set[tuple[str, str]] = set()
    examples: list[Finding] = []
    for f in new_hard:
        if f.rule not in over_rules:
            continue
        key = (f.rule, f.snippet.strip())
        if key in seen:
            continue
        seen.add(key)
        examples.append(f)

    print("", file=sys.stderr)
    print(f"DRIFT GATE: blocked {delta} new design-system violation(s) in {rel}:", file=sys.stderr)
    for f in examples[:12]:
        print(f"  - {f.rule}", file=sys.stderr)
        print(f"      {f.snippet.strip()[:160]}", file=sys.stderr)
        print(f"      fix: {f.recommendation}", file=sys.stderr)
    if len(examples) > 12:
        print(f"  ...and {len(examples) - 12} more.", file=sys.stderr)
    print("", file=sys.stderr)
    print("Resolve by using the canonical token. If the value is genuinely intentional,", file=sys.stderr)
    print("add `drift-ok: <reason>` on the same line. To bypass for this turn:", file=sys.stderr)
    print("  touch .claude/drift-gate-skip.flag   (30-min TTL)", file=sys.stderr)
    return 2


# ─────────────────────────────────────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────────────────────────────────────

def main() -> int:
    parser = argparse.ArgumentParser(description="Solen drift-check")
    parser.add_argument("--gate-stdin", action="store_true",
                        help="Read {file_path,new,old} JSON from stdin; exit 2 on NET-NEW hard drift "
                             "(PreToolUse gate). The default report flow is unchanged and still exits 0.")
    parser.add_argument("--strict-only", action="store_true",
                        help="Only scan files in _rebuilt_routes.json. Skip legacy informational pass.")
    parser.add_argument("--out", default="_design-system/_drift-report.md",
                        help="Output path for strict report (default: _design-system/_drift-report.md)")
    parser.add_argument("--pending-out", default="_design-system/_pending-migration.md",
                        help="Output path for informational pending-migration report")
    parser.add_argument("--root", default=".", help="Project root (default: cwd)")
    args = parser.parse_args()

    # Gate mode short-circuits the report flow entirely (reads stdin, exits 2 on
    # net-new hard drift). Everything below is the unchanged logger path.
    if args.gate_stdin:
        return run_gate_stdin()

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
