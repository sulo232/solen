# Spec: Header — Revised Desktop
> **Source:** Figma node `66:5108` "Header — Revised" — extracted 2026-04-12
> **File:** `cInKwtgkD8TjUSSLDT40eF`
> **Approved:** Yes
> **Implement in:** `components/layout/Header.tsx`

---

## Frame
- Width: 1200px (full-width, sticky)
- Height: 64px
- Background: `rgba(255, 255, 255, 0.85)` — frosted glass, always
- Backdrop-filter: `blur(20px) saturate(1.4)`
- Shadow: `0px 1px 4px 0px rgba(0, 0, 0, 0.04)` — NOT `shadow-sm`, NOT `shadow-elevation-1`
- Position: sticky, top 0, z-index 50

---

## Logo — "SOLEN"
- Text: "SOLEN" (NOT "SOLEN.CH")
- Position: x=32 from left, y=20 (vertically centered in 64px)
- Font: Syne 700
- Size: 20px
- Line-height: 1.2em
- Letter-spacing: 8% (0.08em)
- Color: `#1A120A`

---

## Category Nav (center)
- Layout: row, centered, gap 32px
- Position: centered horizontally (x=388 at 1200px)
- Vertically centered: y=8 in 64px frame (so items at y=~20)

### Per Category Item
- Layout: column, center-aligned, gap 2px
- Circle icon: 22×22px circle
  - Active (Entdecken): fill `#E8634A`
  - Inactive: fill `rgba(232, 99, 74, 0.70)` (70% opacity coral)
- Label text: DM Sans, 11px
  - Active: weight 500, color `#1A120A`
  - Inactive: weight 400, color `rgba(26, 18, 10, 0.55)`
- Categories (in order): Entdecken, Coiffeur, Nägel, Barbershop, Makeup, Waxing
- Active state = current page category

---

## Right Actions
- Layout: row, gap 16px, right-aligned
- Position: x=1093 from left, y=16 (vertically centered)

### Language Switcher
- Text: "DE ▾"
- Font: DM Sans 500, 13px
- Color: `rgba(26, 18, 10, 0.55)`

### Avatar/Account Circle
- Size: 32×32px
- Background: `rgba(26, 18, 10, 0.08)`
- Border: 1px solid `rgba(26, 18, 10, 0.12)`
- Border-radius: 50%

---

## Mobile (≤767px)
- Logo stays left
- Category nav hides (replaced by bottom tab bar)
- Right side: avatar circle only (no language switcher on mobile)
- Height: 56px

---

## What NOT to do
- ❌ Do NOT use `shadow-sm` or `shadow-elevation-1` — use exact shadow value above
- ❌ Do NOT change the background transparency from 0.85
- ❌ Do NOT use lucide icons for the category nav circles — they are solid color circles (22px)
- ❌ Do NOT touch BottomTabBar.tsx (separate component, not in scope)
