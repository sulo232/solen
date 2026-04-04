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
3. Verify the fix makes sense by re-reading the changed file
4. If confident → move to next item. If uncertain → ask user to screenshot
5. Ask for a screenshot every **3–4 changes max**, or whenever a section feels done
6. Update this file after each session

**Ask user for screenshot when:**
- A section feels complete and you want to confirm before moving on
- You made a structural change (not just a color/size tweak)
- You're uncertain whether a fix helped or hurt

**Don't ask for screenshot when:**
- Fixing a known wrong value (e.g., wrong font size number)
- Removing a class that's clearly wrong (e.g., `hidden md:block`)
- Adding a missing CSS property you can verify by reading the vision HTML

---

## Section Status

Last updated: 2026-04-04 (session 2)

| Section | Target (vision) | Current status | Known gaps |
|---------|----------------|----------------|------------|
| **Hero background** | White + 3 radial gradients (coral 7%, gold 5%, blue 4%) | ✅ Fixed — hardcoded in HomepageHero.tsx | — |
| **Hero headline** | 3 lines: "DEIN NÄCHSTER" / coral "TERMIN" / "WARTET", 108px max | ✅ Fixed — clamp(64px,9vw,108px), 3-line structure | — |
| **Hero search bar** | 3-segment pill (Was/Wo/Wann), always visible | ✅ Fixed — removed `hidden md:block` | May still look different from vision's clean pill |
| **Hero chips** | Small pills below search, hover coral | ✅ Implemented | — |
| **Hero trust signal** | Stars · reviews · free, subtle | ✅ Implemented | — |
| **Last Minute strip** | Coral gradient bg, badge + scrollable cards | ✅ Implemented | Only shows when real data exists |
| **Carousel sections** | Horizontal scroll, Airbnb-style 4:5 cards, 200px wide | ⚠️ Unknown | Need screenshot to compare card design |
| **Trust stats** | Between carousel 1 and 2, 3 white cards with coral icon wrap | ✅ Fixed position | — |
| **Discover section** | Inspo cards, 3:4 ratio, dark scrim overlay | ⚠️ Unknown | Need screenshot |
| **Browse by City** | Dark #100602 bg, Bebas Neue 76px city names, hover interactions | ✅ Implemented | — |
| **Testimonials** | #FDFAF6 bg, 3-col grid, SVG stars, avatar initials | ✅ Implemented | — |
| **Partner CTA** | Dark #1A0806 gradient, Bebas Neue 56px title, frosted stat cards | ✅ Fixed title font | — |
| **Header** | 56px, frosted glass, "SOLEN" logo, "Salon eintragen" pill | ✅ Fixed — frosted glass rgba(255,255,255,.82) + backdrop-blur | CategoryStickyRow is dead import only, category icons are main nav |
| **Discover section header** | Coral eyebrow + bold title + view-all link | ✅ Fixed — eyebrow added matching vision pattern | — |
| **Footer** | Dark #2C2825 background | ✅ Fixed — was bg-s-dm-bg (#151009), now #2C2825 | — |
| **Overall spacing** | Generous padding, airy | ✅ Looks correct | Hero: pt-14 pb-12 = 56px/48px matches vision |

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
