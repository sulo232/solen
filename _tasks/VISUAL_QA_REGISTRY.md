# Visual QA Registry — Solen.ch

> **What this file is:** Persistent log of visual findings. Lives in the repo so ANY agent or chat session can read it.
> **Who writes:** Antigravity (browser screenshots) + any agent that spots visual issues.
> **Who fixes:** Claude Code — reads this before touching listed components, marks fixes.

## Status: `[OPEN]` → `[FIXED]` (by CC) → `[VERIFIED]` (by Antigravity)

---

## HOW TO FIX — Claude Code Protocol

When you pick up an `[OPEN]` issue:
1. **Read the exact change** — it tells you exactly what file, what line, what to change
2. **Invoke the listed skill** with `@skill-name` before writing any code
3. **Make only the exact change listed** — do not touch anything else in the file
4. **Verify with `git diff`** before committing — if more than the target lines changed, revert the extras
5. **Change status to `[FIXED]`** and add the commit hash

**Skills available:**
- `@emil-design-eng` — animations, easing, interaction polish, spring physics
- `@design` — color, spacing, typography decisions
- `@review` — general UI quality review
- `@frontend-design` — component structure and layout

**Verification:** After 3-4 fixes, run `npx playwright test` to check for regressions against baselines.

> **Full systems catalog:** `_rules/SYSTEMS.md` — all tools, plugins, workflows and when to use each.

---

## Audit #1 — 2026-04-12 — Homepage Desktop (1280px) + Mobile (375px)

### [FIXED] Hero headline overlaps with sticky header
- **Page:** / (homepage)
- **Viewport:** 1280px
- **Severity:** 🔴 HIGH
- **Screenshot:** `_visual-qa/screenshots/2026-04-12_desktop_hero.png`
- **Skill:** `@design` (spacing/layout)
- **Detail:** The "DEIN NÄCHSTER TERMIN WARTET" headline starts directly behind the sticky header. The top of "DEIN" is cut off/overlapping with header content.
- **Exact change:**
  ```
  File: components/ui/HomepageHero.tsx line 41
  Before: className="px-5 md:px-10 lg:px-20 pt-20 pb-0 text-left"
  After:  className="px-5 md:px-10 lg:px-20 pt-36 pb-0 text-left"
  ONLY this line. Nothing else.
  ```

### [FIXED] Raw translation key visible: `home.instantBookable`
- **Page:** / (homepage)
- **Viewport:** 1280px + 375px
- **Severity:** 🔴 HIGH
- **Screenshot:** `_visual-qa/screenshots/2026-04-12_desktop_hero.png`
- **Skill:** none (data fix)
- **Detail:** Every category section subtitle shows: `Top bewertet · Sofort buchbar · home.instantBookable`. The third item is a raw i18n key.
- **Exact change:**
  ```
  File: components/ui/FeaturedSalonCarousel.tsx line 77
  Before: <span style={{ color: "rgba(26,18,9,0.55)" }}> · {t("instantBookable") || "Sofort buchbar"}</span>
  After:  [delete this line entirely]
  ONLY this line. Nothing else.
  ```

### [FIXED] Inspiration section — blank cards with no images
- **Page:** / (homepage)
- **Viewport:** 1280px
- **Severity:** 🟡 MEDIUM
- **Screenshot:** `_visual-qa/screenshots/2026-04-12_desktop_discover.png`
- **Skill:** `@review` (data/render check)
- **Detail:** "FINDE DEINE INSPIRATION" shows 5 blank cream cards. Demo items use `image` field but `ItemCard` reads `image_url`.
- **Exact change:**
  ```
  File: components/ui/DiscoverCarousel.tsx line 123
  Before: <ItemCard item={item as unknown as DiscoveryItem} isExpanded={isExpanded} />
  After:  <ItemCard item={{ ...item, image_url: item.image } as unknown as DiscoveryItem} isExpanded={isExpanded} />
  ONLY this line. Nothing else.
  ```
  > ⚠️ First verify: open `/lib/demo-data.ts` and confirm DEMO_DISCOVER_ITEMS items have an `image` field. If the field is named differently, adjust accordingly.

### [FIXED] Trust stats section — broken layout, 3 tiny gray rectangles
- **Page:** / (homepage)
- **Viewport:** 1280px
- **Severity:** 🟡 MEDIUM
- **Screenshot:** `_visual-qa/screenshots/2026-04-12_desktop_cards.png`
- **Skill:** `@design` (fallback state)
- **Detail:** 3 tiny skeleton rectangles show when `/api/metrics/global` is slow. Needs a 3s timeout fallback with sensible defaults.
- **Exact change:**
  ```
  File: components/TrustStatsBanner.tsx
  Add a second useEffect after the existing fetch useEffect:

  useEffect(() => {
    const timer = setTimeout(() => {
      setStats((prev) => prev ?? { salons: 150, reviews: 2400, bookings_all_time: 5000 });
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  Do NOT touch the existing fetch logic. Only add this new useEffect.
  ```

### [FIXED] Sticky search bar overlaps content while scrolling
- **Page:** / (homepage)
- **Viewport:** 1280px
- **Severity:** 🟡 MEDIUM
- **Screenshot:** `_visual-qa/screenshots/2026-04-12_desktop_cards.png`
- **Skill:** `@emil-design-eng` (layering + visual separation)
- **Detail:** Header uses `shadow-sm` (banned default Tailwind token). The frosted glass feels too thin when scrolled, allowing content bleedthrough.
- **Exact change:**
  ```
  File: components/layout/Header.tsx line 155
  Before: ? "border-b border-s-ink/[0.08] shadow-sm"
  After:  ? "border-b border-s-ink/[0.08] shadow-elevation-1"
  ONLY this class name. Nothing else.
  ```

### [FIXED] Salon cards — no rounded corners (0px border-radius)
- **Page:** / (homepage)
- **Viewport:** 1280px
- **Severity:** 🟢 LOW
- **Screenshot:** `_visual-qa/screenshots/2026-04-12_desktop_cards.png`
- **Skill:** `@design` (token compliance)
- **Detail:** Salon card images have sharp corners. Design system specifies `rounded-card` (16px).
- **Exact change:**
  ```
  File: components/SalonCard.tsx
  Find: rounded-[12px] (on the image container div)
  Replace: rounded-card
  If rounded-[12px] doesn't exist in this file, skip this fix and report back.
  ```

---

## What looks GOOD ✅

| Element | Notes |
|---|---|
| Header | Sticky, frosted glass rgba(255,255,255,0.82), correct backdrop-blur, z-50 |
| Category icons | All 6 render correctly with icons (Entdecken, Coiffeur, Nägel, Barbershop, Makeup, Waxing) |
| Background color | Warm cream throughout, no cold grays |
| Bebas Neue font | Hero headline using correct font + uppercase |
| "TERMIN" coral highlight | Correct coral color on the key word |
| Search bar | 3-segment pill (Was/Wo/Wann) with coral "Suchen" button — looks correct |
| Trust signal | "★ 4.8 Ø Bewertung · 2'400+ Bewertungen · Kostenlos buchen" renders correctly |
| Salon card content | Names, locations, prices ($$), ratings (4.7-4.9), badges ("Höchste Bewertung", "Beliebt") all render |
| Card hover effects | Lift + shadow on hover working — `@emil-design-eng` compliant (ease-out, sub-300ms) |
| "Mehr Kategorien entdecken" CTA | Clean pill button below Barbershop section |
| City section | Dark bg with "SALONS IN DEINER NÄHE" coral eyebrow, large white "BASEL" typography |
| Footer | Dark bg, correct column layout (Plattform, Für Salons, Rechtliches), DE/EN/FR/IT switcher |
| Mobile search pill | "Was · Wo · Wann" fits at 375px |
| Mobile bottom tab bar | 4 correct items with icons |

---

## Vision Reference — Homepage Section Order

```
Header (sticky, ~100px tall, frosted glass rgba(255,255,255,0.82))
├── Hero (warm cream bg, Bebas Neue, left-aligned, 1 coral accent word)
├── Last Minute Strip (coral gradient bg)
├── Carousel: Coiffeur
├── ── Trust Stats (3 white cards, coral icons)
├── Carousel: Nails
├── Discover Section ("FINDE DEINE INSPIRATION")
├── City Section (dark #100602, Bebas Neue city names)
├── Testimonials (#FDFAF6)
└── Partner CTA (dark #1A0806 gradient)
```

---

<!-- TEMPLATE A: Visual bug (from browser/screenshot)
### [OPEN] ComponentName — short description
- **Page:** /path
- **Viewport:** 375px / 768px / 1280px
- **Severity:** 🔴 HIGH / 🟡 MEDIUM / 🟢 LOW
- **Screenshot:** `_visual-qa/screenshots/YYYY-MM-DD_name.png`
- **Skill:** `@skill-name` (reason) or `none`
- **Detail:** What's wrong exactly
- **Exact change:**
  ```
  File: path/to/file.tsx line N
  Before: [exact code]
  After:  [exact replacement]
  ONLY this. Nothing else.
  ```
- **Fixed by:** [commit hash]
- **Verified:** [date]
-->

<!-- TEMPLATE B: Figma mismatch (from Figma ↔ Code sync)
### [OPEN] Section — Figma vs code mismatch
- **Figma node:** `nodeId` (use get_screenshot to view)
- **Code file:** `path/to/file.tsx:lineNumber`
- **Category:** color / spacing / typography / layout / interaction / content
- **Severity:** 🔴 HIGH / 🟡 MEDIUM / 🟢 LOW
- **Detail:** What Figma shows vs what code does
- **Figma value:** [exact value from Figma]
- **Code value:** [exact value in code]
- **Exact change:**
  ```
  File: path/to/file.tsx line N
  Before: [exact code]
  After:  [exact replacement]
  ```
- **Fixed by:** [commit hash]
- **Verified:** [date]
-->

<!-- SYSTEM REFERENCE: See _rules/FIGMA_CODE_SYNC.md for the full
     Figma ↔ Code comparison loop, section map, and checklist. -->
