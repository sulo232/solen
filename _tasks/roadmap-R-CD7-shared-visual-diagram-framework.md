# R-CD7: Shared Visual Diagram Framework

> **Wave 5** — Cross-category infrastructure. Depends on category dashboards being functional (R-CD2 through R-CD6).
> **Zone**: 4 (Structured) — ZERO glass, ZERO blobs, ZERO Bebas Neue, 12px MAX radius. Syne 700 + DM Sans only.

---

## R10: PRE-SCAN RESULTS

| Scan | Command | Result |
|---|---|---|
| Existing SVG assets | `find public/ -name "*.svg"` | Check if any diagram SVGs already exist |
| Existing diagram code | `grep -rn "diagram\|Diagram" components/ lib/` | Verify no existing diagram framework |
| FadeBlueprint reference | `grep -rn "SVG\|svg" components/dashboard/barber/FadeBlueprint.tsx` | Check how R-CD3 implemented the inline head SVG |
| BodyZoneSelector reference | `cat components/dashboard/waxing/BodyZoneSelector.tsx` | Check R-CD5's zone selector for integration points |
| FaceChartBuilder reference | `cat components/dashboard/makeup/FaceChartBuilder.tsx` | Check R-CD6's face chart for integration points |
| WellnessJournal reference | `cat components/dashboard/spa/WellnessJournal.tsx` | Check R-CD4's tension area display for integration points |

---

## R1: BREAKAGE RISK ASSESSMENT

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 0: SVG sourcing | 🟢 SAFE | Manual phase | — |
| Phase 1: Shared SVG framework | 🟢 SAFE | New lib, additive | — |
| Phase 2: Head Diagram | 🟡 MEDIUM | Mobile SVG rendering | Test in `max-w-[300px]` container. |
| Phase 3: Body Diagram | 🟡 MEDIUM | Mobile SVG rendering | Same constraint. |
| Phase 4: Face Diagram | 🟡 MEDIUM | Mobile SVG rendering | Same constraint. |
| Phase 5: Hand Diagram | 🟡 MEDIUM | Mobile SVG rendering | Same constraint. |
| Phase 6: Integration | 🔴 HIGH | Existing text-based selectors replaced | EXTEND — do NOT replace. Leave text-based selectors as fallback. Affected files: `FadeBlueprint.tsx`, `BodyZoneSelector.tsx`, `FaceChartBuilder.tsx`, `WellnessJournal.tsx`. |

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

## Phase 0: Source SVG Assets (MANUAL)

> **Zone 4 constraints**: SVGs must use clean line-art style. No decorative fills, no gradients, no shadows. Stroke-only or minimal fill in Zone 4 warm-ink palette.

#### Instructions
1. Source or create 4 SVG diagrams: head (top-down + side), body (front + back), face (front), hand (palm-up + palm-down).
2. Requirements for each SVG:
   - Clean, minimal line-art style (no photorealism)
   - Each clickable zone must be a separate `<path>` or `<g>` element
   - Semantic IDs on every zone element (e.g., `id="zone-top"`, `id="zone-left-side"`)
   - Consistent viewBox (200×200 or 300×300 recommended)
   - Stroke-only styling in the SVG source — fill is applied dynamically
   - Gender-neutral body diagrams

> ⚠️ **BE CAREFUL**:
> - SVG IDs MUST be human-authored semantic names, NOT auto-generated Figma/Illustrator IDs (e.g., `path_1`, `Group_2`).
> - Body diagram must be respectful and gender-neutral.
> - Test each SVG in a browser at 200×200px to verify legibility.

---

## Phase 1: Shared Interactive Zone Framework

> **Zone 4 constraints**: This is Zone 4. Selected zones use `transition-opacity duration-150` only. No motion library. No animate-classes. CSS-only tooltips (no JS tooltip library).

#### Files
- `[NEW]` `lib/diagrams/interactive-zone.ts`
- `[NEW]` `components/shared/InteractiveZoneDiagram.tsx`

#### Instructions
1. Generic framework for rendering click-to-select SVG zone diagrams.
2. Framework accepts: SVG source, zone definition map, selection state.
3. Selected zones fill with configurable colour at configurable opacity.
4. Callback: `onZoneSelect(zoneId: string, selected: boolean)`.
5. Multi-select support.
6. CSS-only tooltip on hover showing zone name.
7. Responsive: fits within `max-w-[300px] lg:max-w-[400px]` container.

#### ✅ DO / ❌ DON'T Examples

✅ **DO**
```tsx
interface ZoneDefinition {
  id: string;
  labelKey: string;
  pathId: string;
  defaultColor?: string;
}

interface InteractiveZoneDiagramProps {
  svgSource: string;
  zones: ZoneDefinition[];
  selectedZones: string[];
  onZoneSelect: (zoneId: string, selected: boolean) => void;
  fillColor?: string;
  fillOpacity?: number;
  className?: string;
}

export function InteractiveZoneDiagram({
  svgSource,
  zones,
  selectedZones,
  onZoneSelect,
  fillColor = "var(--s-coral)",
  fillOpacity = 0.3,
  className,
}: InteractiveZoneDiagramProps) {
  return (
    <div className={`max-w-[300px] lg:max-w-[400px] aspect-square mx-auto ${className}`}>
      <svg
        role="img"
        aria-label="Interactive zone diagram"
        viewBox="0 0 200 200"
        className="w-full h-full"
        dangerouslySetInnerHTML={{ __html: svgSource }}
      />
    </div>
  );
}
```

❌ **DON'T**
```tsx
// WRONG — using <img> tag (can't style individual paths)
<img src="/diagrams/head.svg" />
// WRONG — JS tooltip library
import { Tooltip } from "@radix-ui/react-tooltip";
// WRONG — animation on selection
<motion.path animate={{ fill: color }} />
```

> ⚠️ **BE CAREFUL**:
> - SVG accessibility: add `role="img"`, `aria-label`, and `<title>` elements.
> - Zone 4: NO animation on zone selection. Use `transition-opacity duration-150` only.
> - SVG paths must have programmatic IDs (not auto-generated Figma IDs).
> - The SVG must be inlined (not `<img>`) to support CSS fill targeting.
> - `dangerouslySetInnerHTML` requires sanitized SVG source — validate SVGs are trusted.

#### Verification
```bash
npm run build
npx tsc --noEmit
grep -rn "backdrop-blur\|glass\|font-display\|animate-\|motion" lib/diagrams/ components/shared/InteractiveZoneDiagram.tsx
# Expected: 0 results
git add lib/diagrams/ components/shared/InteractiveZoneDiagram.tsx && git commit -m "R-CD7-P1: InteractiveZoneDiagram — shared click-to-select SVG zone framework"
```

---

## Phase 2: Head Diagram (Barbershop)

> **Zone 4 constraints**: This is Zone 4. SVG container: `rounded-[12px] border border-s-ink/[0.06]`. Opacity gradient for guard sizes. No animation.

#### Files
- `[NEW]` `public/diagrams/head-zones.svg`
- `[NEW]` `components/dashboard/barber/HeadDiagram.tsx`

#### Instructions
1. Top-down + side-view of head with zones: top, left side, right side, back, neckline, temples.
2. Each zone is a separate `<path>` with semantic ID.
3. On zone click: show guard size dropdown.
4. Darker fill = shorter guard (opacity mapping: skin=0.9, 0.5guard=0.7, 1guard=0.5, etc.).
5. Wraps `InteractiveZoneDiagram` from Phase 1.
6. Integrates with `FadeBlueprint.tsx` from R-CD3 — as optional visual mode.

#### ✅ DO / ❌ DON'T Examples

✅ **DO**
```tsx
import InteractiveZoneDiagram from "@/components/shared/InteractiveZoneDiagram";

const HEAD_ZONES: ZoneDefinition[] = [
  { id: "top", labelKey: "head.top", pathId: "zone-top" },
  { id: "left_side", labelKey: "head.left_side", pathId: "zone-left-side" },
  { id: "right_side", labelKey: "head.right_side", pathId: "zone-right-side" },
  { id: "back", labelKey: "head.back", pathId: "zone-back" },
  { id: "neckline", labelKey: "head.neckline", pathId: "zone-neckline" },
];

<InteractiveZoneDiagram
  svgSource={headSvg}
  zones={HEAD_ZONES}
  selectedZones={selectedZones}
  onZoneSelect={handleZoneSelect}
  fillColor="var(--s-coral)"
/>
```

❌ **DON'T**
```tsx
// WRONG — REPLACING FadeBlueprint, should EXTEND
// Delete FadeBlueprint.tsx and replace with HeadDiagram // NO!
// WRONG — animation on SVG paths
<motion.path d={zone.d} animate={{ fill: newColor }} />
```

> ⚠️ **BE CAREFUL**:
> - This EXTENDS `FadeBlueprint.tsx` from R-CD3 — add the diagram as an optional visual mode, keep text-based selection as fallback.
> - SVG must be hand-crafted or sourced (Phase 0) — cannot auto-generate a head diagram.
> - SVG file goes in `public/diagrams/` for static serving.

#### Verification
```bash
npm run build
ls public/diagrams/head-zones.svg
grep -rn "animate-\|motion\|backdrop-blur" components/dashboard/barber/HeadDiagram.tsx
# Expected: 0 results
git add public/diagrams/ components/dashboard/barber/HeadDiagram.tsx && git commit -m "R-CD7-P2: HeadDiagram — SVG head zones for fade blueprint"
```

---

## Phase 3: Body Diagram (Spa + Waxing)

> **Zone 4 constraints**: This is Zone 4. Same SVG constraints as Head Diagram. Container: `rounded-[12px]`. No animation.

#### Files
- `[NEW]` `public/diagrams/body-zones.svg`
- `[NEW]` `components/shared/BodyDiagram.tsx`

#### Instructions
1. Simplified body outline (front + back view) with zones.
2. SHARED between spa (tension area marking) and waxing (zone selection).
3. Spa: click to mark tension/pain areas with severity (colour intensity).
4. Waxing: click to select treatment zones.
5. Both use `InteractiveZoneDiagram` wrapper.

#### ✅ DO / ❌ DON'T Examples

✅ **DO**
```tsx
const BODY_ZONES: ZoneDefinition[] = [
  { id: "neck", labelKey: "body.neck", pathId: "zone-neck" },
  { id: "shoulders", labelKey: "body.shoulders", pathId: "zone-shoulders" },
  { id: "upper_back", labelKey: "body.upper_back", pathId: "zone-upper-back" },
  { id: "lower_back", labelKey: "body.lower_back", pathId: "zone-lower-back" },
  { id: "full_legs", labelKey: "body.full_legs", pathId: "zone-full-legs" },
  // ...
];

// Spa mode: severity-based opacity
<InteractiveZoneDiagram
  svgSource={bodySvg}
  zones={BODY_ZONES}
  selectedZones={tensionAreas}
  onZoneSelect={handleTensionSelect}
  fillColor="var(--s-error)"
  fillOpacity={0.4}
/>

// Waxing mode: toggle selection
<InteractiveZoneDiagram
  svgSource={bodySvg}
  zones={BODY_ZONES}
  selectedZones={selectedZones}
  onZoneSelect={handleWaxingSelect}
  fillColor="var(--s-coral)"
/>
```

❌ **DON'T**
```tsx
// WRONG — replacing the text-based selectors
// Delete BodyZoneSelector.tsx // NO! Keep as fallback!
// WRONG — gender-specific body illustration
```

> ⚠️ **BE CAREFUL**:
> - This is a visual ENHANCEMENT — existing text-based zone selectors remain as fallback.
> - SVG body must be gender-neutral and respectful.
> - Same SVG serves two categories (spa + waxing) with different fill colours.

#### Verification
```bash
npm run build
ls public/diagrams/body-zones.svg
grep -rn "animate-\|motion\|backdrop-blur" components/shared/BodyDiagram.tsx
# Expected: 0 results
git add public/diagrams/ components/shared/BodyDiagram.tsx && git commit -m "R-CD7-P3: BodyDiagram — SVG body zones for spa + waxing"
```

---

## Phase 4: Face Diagram (Makeup)

> **Zone 4 constraints**: This is Zone 4. Zone fills use technique-specific colours (gold=highlight, brown=contour, etc.) at 0.3 opacity. No animation.

#### Files
- `[NEW]` `public/diagrams/face-zones.svg`
- `[NEW]` `components/shared/FaceDiagram.tsx`

#### Instructions
1. Front-facing face diagram with zones: forehead, temples, cheekbones, jawline, nose bridge, chin, eyelids, under-eye, lips.
2. Click zone → dropdown: highlight, contour, blush, bronzer, shimmer.
3. Zone fill colour matches technique.
4. Wraps `InteractiveZoneDiagram`.

#### ✅ DO / ❌ DON'T Examples

✅ **DO**
```tsx
const TECHNIQUE_COLORS: Record<string, string> = {
  highlight: "#FFD700",     // gold
  contour: "#8B4513",       // brown
  blush: "#FF69B4",         // pink
  bronzer: "#CD853F",       // bronze
  shimmer: "#C0C0C0",       // silver
};

// Dynamic fill based on selected technique per zone
<InteractiveZoneDiagram
  svgSource={faceSvg}
  zones={FACE_ZONES}
  selectedZones={Object.keys(zoneSelections)}
  onZoneSelect={handleZoneClick}
/>
```

❌ **DON'T**
```tsx
// WRONG — photorealistic face illustration
// WRONG — replacing FaceChartBuilder (keep text-based as fallback)
// WRONG — animated zone transitions
```

> ⚠️ **BE CAREFUL**:
> - Face diagram must be stylized/abstract — NOT photorealistic. Think line-art beauty illustration.
> - Technique colours are decorative only — they supplement, not replace, the text-based technique labels.

#### Verification
```bash
npm run build
ls public/diagrams/face-zones.svg
grep -rn "animate-\|motion\|backdrop-blur" components/shared/FaceDiagram.tsx
# Expected: 0 results
git add public/diagrams/ components/shared/FaceDiagram.tsx && git commit -m "R-CD7-P4: FaceDiagram — SVG face zones for makeup chart"
```

---

## Phase 5: Hand Diagram (Nails)

> **Zone 4 constraints**: This is Zone 4. Accent nail highlight uses `ring-2 ring-s-coral`. No animation.

#### Files
- `[NEW]` `public/diagrams/hand-zones.svg`
- `[NEW]` `components/shared/HandDiagram.tsx`

#### Instructions
1. Hand diagram (palm-up and palm-down views) with individual finger zones.
2. Click each nail zone to assign: shape, length, design, accent nail flag.
3. Accent nails get a highlight ring.

#### ✅ DO / ❌ DON'T Examples

✅ **DO**
```tsx
const HAND_ZONES: ZoneDefinition[] = [
  { id: "thumb_nail", labelKey: "hand.thumb", pathId: "zone-thumb-nail" },
  { id: "index_nail", labelKey: "hand.index", pathId: "zone-index-nail" },
  { id: "middle_nail", labelKey: "hand.middle", pathId: "zone-middle-nail" },
  { id: "ring_nail", labelKey: "hand.ring", pathId: "zone-ring-nail" },
  { id: "pinky_nail", labelKey: "hand.pinky", pathId: "zone-pinky-nail" },
];

// Accent nail: special fill
<InteractiveZoneDiagram
  svgSource={handSvg}
  zones={HAND_ZONES}
  selectedZones={accentNails}
  onZoneSelect={handleNailSelect}
  fillColor="var(--s-coral)"
  fillOpacity={0.4}
/>
```

❌ **DON'T**
```tsx
// WRONG — animation on nail selection
<motion.circle animate={{ r: isAccent ? 8 : 6 }} />
```

> ⚠️ **BE CAREFUL**:
> - Each finger needs TWO zones (nail + finger body) in the SVG — nail zone is clickable, finger is context-only.
> - Left and right hand variants may be needed for per-finger specificity.

#### Verification
```bash
npm run build
ls public/diagrams/hand-zones.svg
grep -rn "animate-\|motion\|backdrop-blur" components/shared/HandDiagram.tsx
# Expected: 0 results
git add public/diagrams/ components/shared/HandDiagram.tsx && git commit -m "R-CD7-P5: HandDiagram — SVG hand/nail zones for nail design specs"
```

---

## Phase 6: Integration with Category Dashboards

> **Zone 4 constraints**: This is Zone 4. "Visual Mode" toggle uses `rounded-[8px]`, `border border-s-ink/[0.06]`. Active: `bg-s-coral/[0.06] text-s-coral`.

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

#### ✅ DO / ❌ DON'T Examples

✅ **DO**
```tsx
const [visualMode, setVisualMode] = useState(false);

<button onClick={() => setVisualMode(!visualMode)}
  className={`rounded-[8px] border px-3 py-1.5 text-[10px] font-heading font-semibold transition-colors duration-150 ${
    visualMode
      ? "border-s-coral bg-s-coral/[0.06] text-s-coral"
      : "border-s-ink/[0.06] dark:border-s-dm-text/[0.06] text-s-ink/40 dark:text-s-dm-text/40"
  }`}>
  {t(visualMode ? "text_mode" : "visual_mode")}
</button>

{visualMode ? (
  <HeadDiagram zones={selectedZones} onZoneSelect={handleSelect} />
) : (
  /* existing text-based selector */
  <TextBasedGuardSelector zones={selectedZones} onZoneSelect={handleSelect} />
)}
```

❌ **DON'T**
```tsx
// WRONG — replacing the text-based selector entirely
// WRONG — animated mode switch
<motion.div key={visualMode ? "visual" : "text"} animate={{ opacity: 1 }} initial={{ opacity: 0 }}>
```

> ⚠️ **BE CAREFUL**:
> - This is additive — existing text-based selectors must remain functional.
> - Visual mode requires SVG assets from Phase 0 to exist. If they don't, show a "Diagrams coming soon" placeholder.
> - Read EACH component file FULLY before modifying. Keep ALL existing code.
> - Files at risk: `FadeBlueprint.tsx`, `BodyZoneSelector.tsx`, `FaceChartBuilder.tsx`, `WellnessJournal.tsx` — all have been written by previous roadmaps.

#### Verification
```bash
npm run build
npx tsc --noEmit

# Verify toggle exists in each file:
grep -rn "visualMode\|visual_mode" components/dashboard/barber/FadeBlueprint.tsx components/dashboard/waxing/BodyZoneSelector.tsx components/dashboard/makeup/FaceChartBuilder.tsx components/dashboard/spa/WellnessJournal.tsx

# Verify no Zone 4 violations:
grep -rn "backdrop-blur\|glass\|font-display\|animate-\|motion" \
  components/dashboard/barber/FadeBlueprint.tsx \
  components/dashboard/waxing/BodyZoneSelector.tsx \
  components/dashboard/makeup/FaceChartBuilder.tsx \
  components/dashboard/spa/WellnessJournal.tsx
# Expected: 0 results

git add components/dashboard/ && git commit -m "R-CD7-P6: add Visual Mode toggle to fade, waxing, makeup, spa components"
```

---

## Phase 7: Smoke Test

> **Zone 4 constraints**: Verification phase.

#### Files
- No file changes.

#### ✅ DO / ❌ DON'T Examples

✅ **DO**
```bash
# Full verification suite
npm run build && npx tsc --noEmit

# Verify all new files:
ls lib/diagrams/interactive-zone.ts
ls components/shared/InteractiveZoneDiagram.tsx
ls components/shared/BodyDiagram.tsx
ls components/shared/FaceDiagram.tsx
ls components/shared/HandDiagram.tsx

# Verify SVG assets:
ls public/diagrams/head-zones.svg
ls public/diagrams/body-zones.svg
ls public/diagrams/face-zones.svg
ls public/diagrams/hand-zones.svg
```

❌ **DON'T**
```bash
# WRONG — skipping the tsc check
# WRONG — not verifying SVG assets exist
```

> ⚠️ **BE CAREFUL**:
> - ALL SVG files must exist in `public/diagrams/` (from Phase 0 manual step).
> - If SVGs are missing, the components should show "coming soon" fallback (verified in Phase 6).
> - Run Zone 4 compliance check across ALL new and modified files.

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

# Verify SVG assets:
ls public/diagrams/head-zones.svg public/diagrams/body-zones.svg public/diagrams/face-zones.svg public/diagrams/hand-zones.svg

# Verify no Zone 4 violations across ALL new files:
grep -rn "backdrop-blur\|glass\|font-display\|Bebas\|rounded-xl\|rounded-2xl\|shadow-lg\|shadow-xl\|animate-\|motion" \
  components/shared/*Diagram.tsx \
  lib/diagrams/ \
  components/dashboard/barber/HeadDiagram.tsx
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
| Phase 7 | 🤖 | Smoke Test | All phases |

---

## R8: CLAUDE.md UPDATES

After execution, update:
- `CLAUDE.md` Section 3.2 (Directory Tree) — add `lib/diagrams/`, `components/shared/*Diagram.tsx`, `public/diagrams/`
- `_docs/category-system-map.md` §3.2 — add shared diagram framework as cross-category infrastructure
- `_docs/category-system-map.md` §4.1-4.6 — note which categories use which diagrams
