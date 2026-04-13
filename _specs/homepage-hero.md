# Spec: Homepage Hero — Desktop
> **Source:** Figma node `64:5109` "Revised Hero — Desktop 1200" — extracted 2026-04-12
> **File:** `cInKwtgkD8TjUSSLDT40eF`
> **Approved:** Yes — this is the revised version of the hero, supersedes all prior code
> **Implement in:** `components/ui/HomepageHero.tsx`

---

## Frame
- Width: 1200px (responsive via px/vw — see breakpoints below)
- Height: 580px at 1200px viewport
- Background: `linear-gradient(135deg, rgba(245,240,235,1) 0%, rgba(255,247,245,1) 30%, rgba(255,255,255,1) 80%)`
  - ⚠️ NOT a radial gradient. NOT white. NOT `#FDFAF6` flat. Exactly this linear gradient.
- Padding left: 80px (desktop), 40px (tablet ≤768px), 20px (mobile ≤375px)
- Padding top: clears sticky header (64px header + 36px gap = 100px from top of page)

---

## Headline
- Font: `Bebas Neue` (font-display class)
- Weight: 400
- Size: 72px at 1200px — use `clamp(48px, 6vw, 72px)`
- Line-height: 1em (tight — words stack with no gap)
- Letter-spacing: 1% (0.01em)
- Alignment: left

### Line 1 — "DEIN NÄCHSTER"
- Color: `#1A120A` (s-ink)
- Position: y=100 from frame top

### Line 2 — "TERMIN" (coral accent)
- Color: `#E8634A` ← use this exact value, NOT `#E8624A`, NOT `#E8735A`
- Position: y=172 from frame top (72px below line 1)

### Line 3 — "WARTET"
- Color: `#1A120A` (s-ink)
- Position: y=244 from frame top (72px below line 2)

---

## Subtitle
- Text: `Finde und buche die besten Salons in deiner Stadt — sofort und ohne Telefon.`
- Font: DM Sans 400
- Size: 18px
- Line-height: 1.556em
- Color: `rgba(26, 18, 10, 0.55)`
- Max-width: 380px
- Position: y=340 from frame top (96px gap below headline)

---

## Search Bar
- Position: y=420 from frame top (80px below subtitle)
- Width: 560px (desktop), 100% (≤768px)
- Height: 56px
- Background: `#FFFFFF`
- Border: 1.5px solid `rgba(26, 18, 10, 0.08)`
- Border-radius: 99px (fully rounded pill)
- Shadow: `0px 2px 12px 0px rgba(26, 18, 10, 0.06), 0px 8px 32px 0px rgba(26, 18, 10, 0.04)`

### Search Icon (left)
- Circle, 20×20px
- Position: x=20, y=18 inside bar
- Stroke: `rgba(26, 18, 10, 0.35)`, 1.8px

### Placeholder Text
- Content: `Was suchst du?  ·  Basel  ·  Heute`
- Position: x=52, y=19 inside bar
- Font: DM Sans 400, 15px
- Color: `rgba(26, 18, 10, 0.40)`

### Search CTA Button
- Text: "Suchen"
- Position: x=464, y=8 inside bar (right-aligned)
- Size: 88×40px
- Background: `#E8634A`
- Border-radius: 99px
- Font: DM Sans 600, 14px
- Color: `#FFFFFF`
- Active state: `scale(0.97)`, 100ms

---

## Trust Signal
- Position: y=498 from frame top (78px below search bar)
- Text: `★ 4.8 Bewertung  ·  2'400+ Reviews  ·  Kostenlos buchen`
- Font: DM Sans 500, 14px
- Color: `rgba(26, 18, 10, 0.50)`
- Star: inline, filled coral `#E8634A`

---

## Breakpoints
| Viewport | Padding X | Headline size | Search bar width |
|---|---|---|---|
| ≥1200px | 80px | 72px | 560px |
| 768–1199px | 40px | `clamp(48px, 5.5vw, 64px)` | 100% |
| ≤767px | 20px | `clamp(40px, 11vw, 56px)` | 100% |

---

## Animations (from Design Identity canvas specs)
- Headline lines: stagger in from `opacity:0, y:20` → `opacity:1, y:0`
  - Line 1: delay 0ms, duration 400ms
  - Line 2: delay 100ms, duration 400ms
  - Line 3: delay 200ms, duration 400ms
  - Easing: `cubic-bezier(0.23, 1, 0.32, 1)`
- Subtitle: delay 350ms, duration 400ms, same easing
- Search bar: delay 450ms, duration 300ms, same easing
- Trust signal: delay 550ms, duration 300ms, same easing

---

## What NOT to do
- ❌ Do NOT use `#FFFFFF` flat white background
- ❌ Do NOT use radial gradient
- ❌ Do NOT use `clamp(56px, 7.5vw, 88px)` — Figma says 72px max
- ❌ Do NOT add a 3-segment search bar — this is a single pill
- ❌ Do NOT change anything outside HomepageHero.tsx
- ❌ Do NOT add features not in this spec
