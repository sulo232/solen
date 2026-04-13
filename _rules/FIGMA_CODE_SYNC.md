# Figma ↔ Code Sync System

> **Purpose:** Structured loop for comparing Figma designs to live code, logging mismatches, and fixing them one at a time.
> **Figma file:** `cInKwtgkD8TjUSSLDT40eF` ("Solen-DESIGN")
> **Every agent doing UI work MUST follow this system.**

---

## 1. The Loop (5 Steps — Repeat Per Section)

```
┌─────────────────────────────────────────────────────────┐
│  1. SCREENSHOT Figma section (get_screenshot)           │
│  2. READ the matching code file                         │
│  3. COMPARE — log mismatches to QA registry             │
│  4. FIX one mismatch at a time in code                  │
│  5. VERIFY with Playwright → compare baseline to Figma   │
│     every 3–4 fixes                                     │
│                                                         │
│  Then move to next section. Figma is source of truth.   │
└─────────────────────────────────────────────────────────┘
```

**Rules:**
- Figma wins. If code doesn't match Figma, the code is wrong.
- One fix at a time. No batching.
- No code changes without reading the file first.
- No pushing without user approval.

---

## 2. Homepage Section Map

Each section maps to a code file. To find the Figma node, use the discovery script below — don't hardcode node IDs.

| # | Section | Code File | Figma Landmark |
|---|---------|-----------|----------------|
| 1 | Header | `components/layout/Header.tsx` | Frame named `header.fixed` |
| 2 | Hero | `components/ui/HomepageHero.tsx` | Search bar IS the hero (DESIGN_SPEC change) |
| 2b | Hero (revised) | `components/ui/HomepageHero.tsx` | Section named `🔄 /de/ — Revised Top Section` |
| 3 | Search Bar | `components/ui/AirbnbSearchBar.tsx` | Frame named "Search Bar" inside hero |
| 4 | Coiffeur Carousel | `components/ui/FeaturedSalonCarousel.tsx` | Frame containing "Coiffeur" heading |
| ~~5~~ | ~~Trust Stats~~ | ~~`components/TrustStatsBanner.tsx`~~ | **KILLED per DESIGN_SPEC** |
| 6 | Nägel Carousel | `components/ui/FeaturedSalonCarousel.tsx` | Frame containing "Nägel" heading |
| 7 | Barbershop Carousel | `components/ui/FeaturedSalonCarousel.tsx` | Frame containing "Barbershop" heading |
| ~~8~~ | ~~"Mehr Kategorien" CTA~~ | ~~`components/HomePage.tsx:154-179`~~ | **KILLED per DESIGN_SPEC** |
| ~~9~~ | ~~So funktioniert's~~ | ~~`components/ui/HowItWorks.tsx`~~ | **KILLED per DESIGN_SPEC** |
| ~~10~~ | ~~Discover~~ | ~~`components/ui/DiscoverCarousel.tsx`~~ | **KILLED per DESIGN_SPEC** |
| 11 | City Selector | `components/BrowseByCitySection.tsx` | Frame containing "BASEL" + "ZÜRICH" text |
| 12 | Footer | `components/layout/Footer.tsx` | Frame named `footer` |
| 13 | Floating Nav Pill | `components/layout/FloatingNavPill.tsx` | Not in Figma (mobile only) |
| 14 | Cookie Banner | (cookie consent component) | Frame containing "Cookies" text |
| 15 | Salon Card | `components/SalonCard.tsx` | Instance named `Card / Salon` |

### Discovery Script

Run this `use_figma` script to get current node IDs for all homepage sections. Copy the returned IDs for `get_screenshot` or `get_design_context` calls.

```javascript
// Paste into use_figma — returns current node IDs for all homepage sections
const page = figma.root.children.find(p => p.name === "all the pages");
if (!page) return "Page 'all the pages' not found";
await figma.setCurrentPageAsync(page);
const deSection = page.children.find(n => n.name === "/de/");
if (!deSection) return "Section '/de/' not found";

function findSectionFrame(node) {
  let current = node;
  while (current && current.parent) {
    if (current.type === "FRAME" && current.width >= 800 && current.height >= 80) return current;
    current = current.parent;
  }
  return node;
}

const results = {};
function search(node) {
  if (!results.header && node.name === "header.fixed")
    results.header = { id: node.id, name: node.name };
  if (!results.footer && node.name === "footer")
    results.footer = { id: node.id, name: node.name };
  if (!results.searchBar && node.name === "Search Bar")
    results.searchBar = { id: node.id, name: node.name };
  if (!results.hero && node.name?.includes("Finde und buche") && node.type === "FRAME" && node.width >= 1000)
    results.hero = { id: node.id, name: node.name };
  if (!results.trustStats && node.name === "section" && node.type === "FRAME" && node.height > 100 && node.height < 200)
    results.trustStats = { id: node.id, name: node.name };
  if (!results.citySelector && node.name === "section.relative" && node.type === "FRAME" && node.width >= 1000)
    results.citySelector = { id: node.id, name: node.name };
  if (!results.cookieBanner && node.name === "div.fixed" && node.type === "FRAME" && node.height > 100 && node.height < 300)
    results.cookieBanner = { id: node.id, name: node.name };
  if (node.name === "div.mt-10" && node.type === "FRAME" && node.width > 1000) {
    let t = ""; const ft = (n) => { if (n.type === "TEXT" && !t) t = n.characters; if ("children" in n) n.children.forEach(ft); }; ft(node);
    if (!results.coiffeur && t.includes("Coiffeur")) results.coiffeur = { id: node.id, name: node.name };
    if (!results.nagel && t.includes("Nägel")) results.nagel = { id: node.id, name: node.name };
    if (!results.barbershop && t.includes("Barbershop")) results.barbershop = { id: node.id, name: node.name };
  }
  if (!results.mehrKategorien && node.type === "TEXT" && node.characters?.includes("Mehr Kategorien"))
    results.mehrKategorien = { id: findSectionFrame(node).id, name: findSectionFrame(node).name };
  if (!results.howItWorks && node.type === "TEXT" && node.characters?.includes("funktioniert")) {
    const s = findSectionFrame(node); if (s.height < 250) results.howItWorks = { id: s.id, name: s.name };
  }
  if (!results.discover && node.type === "TEXT" && node.characters?.includes("INSPIRATION")) {
    const s = findSectionFrame(node); if (s.height > 300 && s.height < 600) results.discover = { id: s.id, name: s.name };
  }
  if ("children" in node) node.children.forEach(search);
}
search(deSection);
return results;
```

**Usage:** Run this script once at the start of a sync session. Use the returned IDs for `get_screenshot(fileKey, nodeId)` calls. IDs are always fresh — no hardcoded values to break.

---

## 3. Comparison Checklist (Per Section)

When comparing a Figma section to its code file, check ALL of these:

### Visual Tokens
- [ ] **Background color** — matches Figma fill (use design tokens, not hex)
- [ ] **Text colors** — matches Figma text fills
- [ ] **Font family** — Bebas Neue / Syne / DM Sans matches Figma
- [ ] **Font size** — matches Figma text size (map to Tailwind scale)
- [ ] **Font weight** — matches Figma text weight
- [ ] **Line height** — matches Figma line height
- [ ] **Letter spacing** — matches Figma letter spacing

### Layout & Spacing
- [ ] **Padding** — matches Figma auto-layout padding
- [ ] **Gap** — matches Figma auto-layout gap
- [ ] **Width/max-width** — matches Figma frame constraints
- [ ] **Border radius** — uses correct design token (rounded-card, rounded-pill, etc.)
- [ ] **Alignment** — left/center/right matches Figma

### Components & Content
- [ ] **Section order** — matches Figma page flow
- [ ] **Text content** — matches Figma (and uses i18n keys, not hardcoded)
- [ ] **Icons** — correct icon from lucide-react or custom SVG
- [ ] **Images** — correct aspect ratio, object-fit
- [ ] **Shadows** — uses V5 shadow tokens

### Interactions (check against Animation Specs page)
- [ ] **Hover state** — matches Figma hover variant
- [ ] **Active/press** — scale(0.97) or scale(0.98) present
- [ ] **Easing** — cubic-bezier(0.23, 1, 0.32, 1) for enters
- [ ] **Duration** — within 100-300ms range for UI

---

## 4. How to Log Mismatches

Add findings to `_tasks/VISUAL_QA_REGISTRY.md` using this format:

```markdown
### [OPEN] Section — short description
- **Page:** / (homepage)
- **Viewport:** 1280px / 375px
- **Severity:** 🔴 HIGH / 🟡 MEDIUM / 🟢 LOW
- **Figma node:** `nodeId` (screenshot with get_screenshot)
- **Code file:** `path/to/file.tsx:lineNumber`
- **Skill:** `@skill-name` or `none`
- **Detail:** What doesn't match between Figma and code
- **Exact change:**
  ```
  File: path/to/file.tsx line N
  Before: [exact code]
  After:  [exact replacement]
  ```
```

**Severity guide:**
- 🔴 **HIGH** — Visible on page load, wrong color/layout, broken functionality
- 🟡 **MEDIUM** — Spacing off, wrong token, interaction missing
- 🟢 **LOW** — Minor polish, hover state, animation timing

---

## 5. Fix Protocol

1. Pick the highest-severity `[OPEN]` finding
2. Read the exact file and line
3. Make ONLY the change listed — nothing else
4. `git diff` to verify only target lines changed
5. Mark as `[FIXED]` in registry
6. After 3-4 fixes → run Playwright to verify: `npx playwright test --project=desktop`
7. If Playwright diffs show regressions → fix before continuing
8. Do NOT push until user says to

### Playwright Verification (automated screenshots)

After fixing visual issues, use Playwright instead of asking the user for screenshots:

```bash
# Check for regressions against baselines
npx playwright test

# If fixes are intentional changes, update baselines
npx playwright test --update-snapshots

# View diff report
npx playwright show-report e2e/visual/report
```

Config: `playwright.config.ts` | Tests: `e2e/visual/homepage.spec.ts` | Baselines: `e2e/visual/baselines/`

> **Full tool catalog:** See `_rules/SYSTEMS.md` for all available systems and when to use each.

---

## 6. Figma MCP Tools Quick Reference

| Tool | When to use |
|------|-------------|
| `get_screenshot(fileKey, nodeId)` | See what a Figma section looks like |
| `get_design_context(fileKey, nodeId)` | Pull code hints, tokens, component mappings |
| `get_metadata(fileKey, nodeId)` | Get node structure (IDs, names, positions, sizes) |
| `search_design_system(query, fileKey)` | Find existing components, variables, styles |
| `use_figma(fileKey, code)` | Create or modify designs in Figma (always load figma-use skill first) |

**Always pass `skillNames: "figma-use"` to `use_figma`.**

**File key:** `cInKwtgkD8TjUSSLDT40eF`

---

## 7. Design Identity Reference (from Figma page)

Pulled from `Design Identity` page (node `24:5108`):

### Colors
| Token | Hex | Usage |
|-------|-----|-------|
| s-coral | #E8735A | Primary CTA |
| s-amber | #D4870A | Accent warm |
| s-blue | #6BA3C8 | Basel Blue |
| s-ink | #1A1209 | Text / Ink |
| s-sage | #7BA688 | Trust green |
| s-sand | #C9A96E | Warm neutral |
| s-yellow | #F2C144 | Highlight |
| s-plum | #4A1E3C | Deep accent |

### Glass Tints
| Name | Usage |
|------|-------|
| Warm Beige (blur: 16px) | Header / Topbar |
| Coral Blush (blur: 20px) | Search backdrop |
| Frosted White (blur: 12px) | Category pills |
| Warm White (blur: 14px) | Floating cards |
| Soft Sand (blur: 10px) | Trust stats |
| Clean Frost (blur: 18px) | Bottom nav |

### Typography
| Style | Font |
|-------|------|
| Display | Bebas Neue |
| Heading | Syne 700 |
| Title | Syne 600 |
| Body | DM Sans 400 |
| Caption | DM Sans 400 |

### Animation Easing
| Name | Value | Usage |
|------|-------|-------|
| Enter | cubic-bezier(0.23, 1, 0.32, 1) | ease-out-strong |
| Exit | cubic-bezier(0.77, 0, 0.175, 1) | ease-in-out-strong |
| Drawer | cubic-bezier(0.32, 0.72, 0, 1) | sheets |

### Durations
| Name | Value | Usage |
|------|-------|-------|
| Instant | 100ms | button press feedback |
| Fast | 150ms | hover states, icon taps |
| Normal | 200ms | dropdowns, tooltips |
| Slow | 300ms | modals, sheets |
| Dramatic | 500ms | page reveals, marketing |

### Border Radii
| Token | Value |
|-------|-------|
| rounded-pill | 9999px |
| rounded-btn | 99px |
| rounded-card-lg | 20px |
| rounded-card | 16px |
| rounded-input | 12px |
| rounded-sheet | 28px |

### Frosted Glass Badges
| Type | Usage |
|------|-------|
| White Frost | Default · Neu · Beliebt |
| Coral Frost | Rating · Top bewertet |
| Sage Frost | Availability · Open now |
| Dark Frost | Heart button · Price overlay |
