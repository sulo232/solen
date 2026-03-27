# R-CD7: Shared Visual Diagram Framework

> **Wave 5** — Cross-category infrastructure. Depends on category dashboards being functional (R-CD2 through R-CD6).
> **Zone**: 4 (Structured) — ZERO glass, ZERO blobs, ZERO Bebas Neue, 12px MAX radius.
> **Note**: This roadmap follows `ROADMAP_RULES.md` strict formatting.

---

## R1: BREAKAGE RISK ASSESSMENT

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1: Shared SVG framework | 🟢 SAFE | New lib, additive | — |
| Phase 2: Head Diagram | 🟡 MEDIUM | Mobile rendering | Test SVG in constrained container (max-w-[300px]). |
| Phase 3: Body Diagram | 🟡 MEDIUM | Mobile rendering | Same constraint. |
| Phase 4: Face Diagram | 🟡 MEDIUM | Mobile rendering | Same constraint. |
| Phase 5: Hand Diagram | 🟡 MEDIUM | Mobile rendering | Same constraint. |
| Phase 6: Integration | 🟡 MEDIUM | Existing components replaced | EXTEND — do NOT replace. Leave text-based selectors as fallback. |

---

## R2: SEPARATE MANUAL VS CODE PHASES

**🧑 MANUAL PHASES**
- Phase 0: Source or commission SVG artwork for head, body, face, and hand diagrams. These MUST be clean, minimal line-art SVGs — not stock illustrations. SVGs must be semantically structured (each zone = named `<path>`) for click targeting.

**🤖 CLAUDE CODE PHASES**
- Phase 1: Shared Interactive Zone Framework
- Phase 2: Head Diagram (barbershop fade zones)
- Phase 3: Body Diagram (spa tension areas, waxing zones)
- Phase 4: Face Diagram (makeup chart zones)
- Phase 5: Hand Diagram (nail design zones)
- Phase 6: Integration with existing components
- Phase 7: Smoke Test

---

## Phase 1: Shared Interactive Zone Framework

#### Files
- `[NEW]` `lib/diagrams/interactive-zone.ts`
- `[NEW]` `components/shared/InteractiveZoneDiagram.tsx`

#### Instructions
1. Generic framework for rendering click-to-select SVG zone diagrams.
2. Framework accepts: SVG source, zone definition map (zone ID → label + path ID), selection state.
3. Selected zones fill with configurable colour at configurable opacity.
4. Callback: `onZoneSelect(zoneId: string, selected: boolean)`.
5. Multi-select support.
6. Tooltip on hover showing zone name (CSS-only, no JS tooltip library).
7. Responsive: fits within `max-w-[300px] lg:max-w-[400px]` container, aspect-ratio preserved.

#### Type definitions:
```tsx
interface ZoneDefinition {
  id: string;
  labelKey: string;     // i18n key
  pathId: string;       // SVG <path> or <g> id
  defaultColor?: string;
}

interface InteractiveZoneDiagramProps {
  svgSource: string;           // SVG markup string or URL
  zones: ZoneDefinition[];
  selectedZones: string[];     // zone IDs
  onZoneSelect: (zoneId: string, selected: boolean) => void;
  fillColor?: string;          // default selection colour
  fillOpacity?: number;        // default 0.3
  className?: string;
}
```

> ⚠️ **BE CAREFUL**:
> - SVG accessibility: add `role="img"`, `aria-label`, and `title` elements.
> - Zone 4: NO animation on zone selection. Use `transition-opacity duration-150` only.
> - SVG paths must have programmatic IDs (not auto-generated Figma IDs).
> - The SVG must be inlined (not `<img>`) to support CSS fill targeting.

#### Verification
```bash
git add lib/diagrams/ components/shared/InteractiveZoneDiagram.tsx && git commit -m "R-CD7-P1: InteractiveZoneDiagram — shared click-to-select SVG zone framework"
npm run build
```

---

## Phase 2: Head Diagram (Barbershop)

#### Files
- `[NEW]` `public/diagrams/head-zones.svg`
- `[NEW]` `components/dashboard/barber/HeadDiagram.tsx`

#### Instructions
1. Top-down + side-view of head with zones: top, left side, right side, back, neckline, temples.
2. Each zone is a separate `<path>` with semantic ID.
3. On zone click: show guard size dropdown.
4. Darker fill = shorter guard (opacity mapping: skin=0.9, 0.5guard=0.7, 1guard=0.5, 2guard=0.3, etc.).
5. Wraps `InteractiveZoneDiagram` from Phase 1.
6. Integrates with `FadeBlueprint.tsx` from R-CD3 — replaces the text-based guard selection.

> ⚠️ **BE CAREFUL**:
> - This EXTENDS `FadeBlueprint.tsx` from R-CD3 — add the diagram as an optional visual mode, keep text-based selection as fallback.
> - SVG must be hand-crafted or sourced — cannot auto-generate a head diagram.

#### Verification
```bash
git add public/diagrams/ components/dashboard/barber/HeadDiagram.tsx && git commit -m "R-CD7-P2: HeadDiagram — SVG head zones for fade blueprint"
npm run build
```

---

## Phase 3: Body Diagram (Spa + Waxing)

#### Files
- `[NEW]` `public/diagrams/body-zones.svg`
- `[NEW]` `components/shared/BodyDiagram.tsx`

#### Instructions
1. Simplified body outline (front + back view) with zones: head, neck, shoulders, upper arms, lower arms, hands, chest, stomach, upper back, lower back, glutes, upper legs, lower legs, feet.
2. SHARED between spa (tension area marking) and waxing (zone selection).
3. Spa usage: click to mark tension/pain areas with severity (colour intensity).
4. Waxing usage: click to select treatment zones.
5. Both use the same `InteractiveZoneDiagram` wrapper.

> ⚠️ **BE CAREFUL**:
> - This is a visual ENHANCEMENT — existing text-based zone selectors remain as fallback.
> - SVG body must be gender-neutral and respectful.

#### Verification
```bash
git add public/diagrams/ components/shared/BodyDiagram.tsx && git commit -m "R-CD7-P3: BodyDiagram — SVG body zones for spa + waxing"
npm run build
```

---

## Phase 4: Face Diagram (Makeup)

#### Files
- `[NEW]` `public/diagrams/face-zones.svg`
- `[NEW]` `components/shared/FaceDiagram.tsx`

#### Instructions
1. Front-facing face diagram with zones: forehead, temples, cheekbones, jawline, nose bridge, chin, eyelids, under-eye, lips.
2. Used by makeup `FaceChartBuilder` for zone-based technique selection.
3. Click zone → dropdown: highlight, contour, blush, bronzer, shimmer.
4. Zone fill colour matches technique (gold=highlight, brown=contour, pink=blush, bronze=bronzer, silver=shimmer).

> ⚠️ **BE CAREFUL**: Face diagram must be stylized/abstract — NOT photorealistic. Think line-art beauty illustration.

#### Verification
```bash
git add public/diagrams/ components/shared/FaceDiagram.tsx && git commit -m "R-CD7-P4: FaceDiagram — SVG face zones for makeup chart"
npm run build
```

---

## Phase 5: Hand Diagram (Nails)

#### Files
- `[NEW]` `public/diagrams/hand-zones.svg`
- `[NEW]` `components/shared/HandDiagram.tsx`

#### Instructions
1. Hand diagram (palm-up and palm-down views) with individual finger zones.
2. Click each nail zone to assign: shape, length, design, accent nail flag.
3. Used by nail dashboard for per-finger design specification.
4. Accent nails get a highlight ring.

> ⚠️ **BE CAREFUL**: Each finger needs TWO zones (nail + finger body) — nail zone is clickable, finger is context-only.

#### Verification
```bash
git add public/diagrams/ components/shared/HandDiagram.tsx && git commit -m "R-CD7-P5: HandDiagram — SVG hand/nail zones for nail design specs"
npm run build
```

---

## Phase 6: Integration with Category Dashboards

#### Files
- `[MODIFY]` `components/dashboard/barber/FadeBlueprint.tsx` (add HeadDiagram toggle)
- `[MODIFY]` `components/dashboard/waxing/BodyZoneSelector.tsx` (add BodyDiagram toggle)
- `[MODIFY]` `components/dashboard/makeup/FaceChartBuilder.tsx` (add FaceDiagram toggle)
- `[MODIFY]` `components/dashboard/spa/WellnessJournal.tsx` (add BodyDiagram for tension marking)

#### Instructions
1. Add a "Visual Mode" toggle button to each component.
2. When toggled ON, show the SVG diagram. When OFF, show the text-based selector (original).
3. Both modes sync: selecting in diagram updates text list, and vice versa.
4. Default: text mode. Visual mode is opt-in.

> ⚠️ **BE CAREFUL**:
> - This is additive — existing text-based selectors must remain functional.
> - Visual mode requires diagrams to be manually sourced (Phase 0).
> - If SVG assets don't exist yet, show a "Diagrams coming soon" placeholder instead of breaking.

#### Verification
```bash
npm run build
npx tsc --noEmit

# Verify shared framework:
ls lib/diagrams/interactive-zone.ts
ls components/shared/InteractiveZoneDiagram.tsx
ls components/shared/BodyDiagram.tsx
ls components/shared/FaceDiagram.tsx
ls components/shared/HandDiagram.tsx

# Verify no Zone 4 violations:
grep -rn "backdrop-blur\|glass\|font-display\|animate-" components/shared/*Diagram.tsx lib/diagrams/
# Expected: 0 results

# Verify diagrams are imported:
grep -rn "HeadDiagram\|BodyDiagram\|FaceDiagram\|HandDiagram" components/dashboard/ --include="*.tsx"
```

---

## R6: DEPENDENCY ORDERING TABLE

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 0 | 🧑 | Source SVG assets | Nothing |
| Phase 1 | 🤖 | Interactive Zone framework | Nothing |
| Phase 2 | 🤖 | HeadDiagram | Phase 0, Phase 1 |
| Phase 3 | 🤖 | BodyDiagram | Phase 0, Phase 1 |
| Phase 4 | 🤖 | FaceDiagram | Phase 0, Phase 1 |
| Phase 5 | 🤖 | HandDiagram | Phase 0, Phase 1 |
| Phase 6 | 🤖 | Integration | Phase 2-5, R-CD2 through R-CD6 |

---

## R8: CLAUDE.md UPDATES

After execution, update:
- `_docs/category-system-map.md` §3.2 — add `lib/diagrams/`, `components/shared/*Diagram.tsx`, `public/diagrams/`
- `CLAUDE.md` Section 3.2 (Directory Tree) — add `lib/diagrams/` and `public/diagrams/`
