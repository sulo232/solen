# Solen Design — Current Truth

> Living doc. Updated 2026-05-25 (V3-D139). When project CLAUDE.md says "see `_tasks/SOLEN_DESIGN.md`" — this is the file.

---

## The 80 / 17 / 3 Rule (THE rule)

Every screen should resolve to roughly:

- **80% neutral** — pure white `#FFFFFF` + off-white `#F5F5F4` surface variation. Page bg, card bg, modal bg, empty space.
- **17% ink** — black `#0A0A0A` text, grey `#6B6B6B` secondary text, hairlines `#E7E5E4`, icons, photos. Type is its own band — it carries visual weight, it is not "neutral."
- **3% accent** — forest emerald `#16A34A`. Reserved for CTA + logo dot + active-state + heart-saved fill + single data-highlight. Count the pixels. If accent fills more than ~3% of the rendered viewport, audit and strip.

Pinterest, Airbnb, Stripe all look "premium" because they **earn** attention by RESERVING color. When accent appears, it MEANS something.

---

## Tokens — V3-D139 (2026-05-25)

### Accent (3% band — forest emerald)
| Use | Hex | WCAG vs white |
|---|---|---|
| `s-brand` (DEFAULT, CTA + logo dot) | `#16A34A` | 3.6:1 (passes AA Large) |
| `s-brand-mid` (`:hover`) | `#15803D` | — |
| `s-brand-deep` (`:active` / pressed) | `#14532D` | — |
| `s-brand-pale` (hover wash, rare) | `#DCFCE7` | — |
| `s-brand-subtle` (focus glow) | `#F0FDF4` | — |

**Text on accent:** Black `#0A0A0A` is safest (5.8:1, AA Normal). White (`text-white`) is acceptable for large bold CTAs (3.6:1, AA Large only) — fails for small/regular text. Default to black, escalate to white only when the CTA is large + bold.

### Ink (17% band)
| Use | Hex |
|---|---|
| Primary text + headings (`s-ink`) | `#0A0A0A` |
| Secondary text (`s-ink-2`, `s-ink.secondary`) | `#6B6B6B` |
| Tertiary text (`s-ink-3`) | `#6B6B6B` (collapsed onto secondary) |
| Disabled text | `#C5C8C4` |

### Surfaces (80% band)
| Use | Hex |
|---|---|
| Page bg (`--bg`, `--base`) | `#FFFFFF` |
| Card / modal bg (`s-bg.surface`, `.raised`) | `#FFFFFF` |
| Sunken / hover-bg / input-active (`s-bg.sunken`) | `#F5F5F4` |
| Hairline / border (`s-border`, `--color-border`) | `#E7E5E4` |

### Semantic (off-budget — they are signals, not branding)
| Token | Hex | Use |
|---|---|---|
| `s-love` | `#CC4A60` | heart-saved fill, sale chips |
| `s-success` | `#16A34A` | success state (note: same hue as accent — distinguish by context) |
| `s-warning` | `#F59E0B` | warnings |
| `s-error` | `#D32F2F` | errors |
| `s-star` | `#1A1A1A` | rating stars (ink, never yellow — V3-D95) |

---

## Lineage (recent decisions)

- **V3-D139 (2026-05-25)** — accent reset to forest emerald `#16A34A` per user. Darker / more "premium-craft" than V3-D138 spotify green. 80/17/3 rule formally documented here.
- **V3-D138 (2026-05-25)** — substrate reset white, accent swapped to spotify green `#1DB954` (replaced V3-D138 in same day — too bright).
- **V3-D123–137 (2026-05-23–25)** — apricot sun era `#E86A3C`. Killed because orange + busy homepage felt cheap.
- **V3-D107–121 (2026-05-22–24)** — Little Amps colorway, then amber `#E8A93D`. Killed (too school-bus yellow / construction).
- **V3-D75–106 (2026-05-18–23)** — emerald `#1F5C42`, warm pearl substrate, FeatureBento explorations.

---

## What CAN be accent (the canonical 3%)

- Primary CTAs: "Solen durchsuchen", "Werde Partner", "Anmelden", "Termin buchen"
- Logo wordmark dot
- Active period tab outline (W / M / J in Analytics)
- The +trend arrow + trend percentage in Analytics
- Footer wordmark accent
- Single data highlight in a graph (peak bar, trend arrow) — never every bar

## What MUST NOT be accent (audit + strip)

- Sent chat bubbles (use neutral grey fill, ink text)
- Calendar slot tints (neutral grey)
- Decorative dots / accent bars that don't lead anywhere
- Hover washes on inactive items (use neutral grey hover, not accent-tint)
- Random check icons / info badges that aren't action-triggering
- Section header underlines / accent bars (neutral hairline is enough)
