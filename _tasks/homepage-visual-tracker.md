# Homepage Visual Tracker

> **HOW TO USE THIS FILE**
> 
> Before touching any homepage component, read this file.
> After every visual change session, update the status table.
> Drop screenshots into `_tasks/screenshots/` and reference them here.
> 
> **Target reference**: `.superpowers/brainstorm/22806-1775308737/content/homepage-vision.html`
> Run it at http://localhost:49642/ to compare live.

---

## Tight Loop Protocol (MANDATORY for homepage visual work)

Instead of roadmaps, use this loop:

1. Pick the **single most broken thing** visible in the current screenshot
2. Fix only that one thing (one component, one CSS property if possible)
3. Verify the fix by running Playwright: `npx playwright test --update-snapshots --project=desktop`
4. Read the baseline PNG yourself (`e2e/visual/baselines/...`) to confirm the fix visually
5. Every **3–4 changes**, compare Figma screenshot to Playwright screenshot and show the user both
6. Update this file after each session

**Use Playwright for verification (NOT user screenshots):**
- Run `npx playwright test --update-snapshots` after fixes to capture new state
- Read the PNG baselines with the Read tool — you can see images
- Compare to Figma screenshots (`get_screenshot`) for design accuracy
- Only ask the user for their opinion on design direction, not for screenshots

---

## Section Status

Last updated: 2026-04-13 (conflict resolution)

> **Authority:** `_rules/DESIGN_SPEC.md` is the source of truth. "Vision" targets below have been reconciled with DESIGN_SPEC locked decisions.

| Section | Target (DESIGN_SPEC) | Current status | Known gaps |
|---------|----------------|----------------|------------|
| **Hero background** | `#FAFAF8` (clean, no gradients — DESIGN_SPEC §4) | ⚠️ CONFLICT — code has radial gradients, spec says no gradients | Need to remove gradient, set solid `#FAFAF8` |
| **Hero headline** | **KILLED** — search bar IS the hero, no Bebas headline (DESIGN_SPEC locked decision) | ⚠️ CONFLICT — code has 108px Bebas "DEIN NÄCHSTER TERMIN WARTET" | Remove Bebas headline, center search bar as visual anchor |
| **Hero search bar** | 3-segment pill (Was/Wo/Wann), centered, prominent | ✅ Fixed — removed `hidden md:block` | May still look different from DESIGN_SPEC's clean pill |
| **Hero chips** | Small pills below search, hover coral | ✅ Implemented | — |
| **Hero trust signal** | Stars · reviews · free, subtle line below search | ✅ Implemented | — |
| **Last Minute strip** | Coral gradient bg, badge + scrollable cards | ✅ Implemented | Only shows when real data exists |
| **Carousel sections** | Horizontal scroll, 4:3 cards (DESIGN_SPEC §3.1), fluid `minmax(260px,1fr)` | ⚠️ Unknown | Need screenshot to compare card design |
| **Trust stats banner** | **KILLED** per DESIGN_SPEC §4 line 296 — "hide until 500+ salons" | ⚠️ CONFLICT — marked "fixed" in previous session but spec says killed | Remove or hide behind feature flag |
| **"So funktioniert's"** | **KILLED** per DESIGN_SPEC §4 line 296 | ✅ Dead import, not rendered | Clean up dead import |
| **Discover section** | **KILLED** per DESIGN_SPEC §4 line 296 — "cards ARE the discovery" | ⚠️ Unknown — may still be imported | Clean up dead import if present |
| **"Mehr Kategorien" button** | **KILLED** per DESIGN_SPEC §4 line 296 | ⚠️ Unknown | Verify removed from JSX |
| **Browse by City** | Dark warm bg, Bebas Neue 48px city names (DESIGN_SPEC §2.2) | ✅ Implemented | — |
| **Testimonials** | Only if 3+ real reviews exist (DESIGN_SPEC §4) | ✅ Implemented | — |
| **Header** | 64px, `#FAFAF8`, glass on scroll (DESIGN_SPEC §3.4) | ✅ Fixed — frosted glass + backdrop-blur | — |
| **Footer** | Dark #2C2825 background | ✅ Fixed | — |
| **Overall spacing** | Generous padding, airy | ✅ Looks correct | — |

---

## Screenshots Log

Drop screenshots here with date and notes:

```
_tasks/screenshots/YYYY-MM-DD-description.png
```

*(No screenshots yet — add them here as you iterate)*

---

## Known Issues (from last session — 2026-04-04)

1. **Dark mode still in localStorage** — user needs to open console and run:
   `localStorage.removeItem('solen_theme'); location.reload()`
   
2. **CategoryStickyRow** — may be appearing on homepage when it shouldn't. Check Header.tsx.

3. **AirbnbSearchBar on mobile** — removed `hidden md:block` but the component may look crowded at narrow widths. Verify visually.

4. **Hero section padding-top** — no explicit offset for the sticky header (56px). Hero content may start behind header.

---

## Vision Reference — Section Order

```
Header (sticky, 56px, frosted glass)
├── Hero (white + 3 gradients, centered, 56px top padding)
├── Last Minute Strip (coral gradient bg)
├── Carousel: Coiffeur
├── ── Trust Stats (3 white cards)
├── Carousel: Nails
├── [Divider]
├── Discover Section
├── City Section (dark #100602)
├── Testimonials (#FDFAF6)
└── Partner CTA (dark #1A0806 gradient)
```
