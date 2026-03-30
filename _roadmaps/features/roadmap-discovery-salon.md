# Discovery & Salon Profile Roadmap (`/discover` & `/salon`)

> **Note**: This roadmap follows `ROADMAP_RULES.md` strict formatting. 

## R1: BREAKAGE RISK ASSESSMENT

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1: Zone 2 Glass & Motion | 🟢 SAFE | Gallery interaction | Updating the gallery carousel buttons to V3 explicit glass tokens is purely cosmetic. |
| Phase 2: Design Token Sweep | 🟡 MEDIUM | Card layout alignment | Replacing `rounded-button` on interactive elements like `NailArtistPreviewCard` requires checking internal padding. |
| Phase 3: Typographic Clamp | 🟢 SAFE | Headline wrapping | Ensure long salon names break correctly when using `clamp()`. |

---

## R2: SEPARATE MANUAL VS CODE PHASES

**🧑 MANUAL PHASES**
- Verify the masonry grid layout after migrating the infinite scroll spinner to the global primitive.

**🤖 CLAUDE CODE PHASES**
- Phase 1: Design — Enforce Core V3 Tokens (Pills & Clamps)
- Phase 2: Design — Lift Card Hovers to V3 Physics
- Phase 3: Feature — Component Primitives Unification
- Phase 4: Post-Execution Smoke Test

---

## Phase 1: Design — Enforce Core V3 Tokens

The Discovery and Salon Profiles are **Zone 2: Hybrid**. Light glassmorphism is permitted for floating navs and overlays, but primary interactive elements must strictly adhere to the V3 rules.

#### Exact Files
- `[MODIFY]` `app/[locale]/salon/[slug]/page.tsx`
- `[MODIFY]` `app/[locale]/discover/page.tsx`

#### Instructions
1. **Typography Clamps:** Replace `text-2xl sm:text-3xl` on the Salon H1 and Discovery H1 with `text-[clamp(28px,4vw,44px)] leading-[1.1] tracking-[-0.02em]`.
2. **Primary CTAs:** Search for `<button>` and `<Link>` acting as primary booking actions (like inside `NailArtistPreviewCard`). Upgrade them from `rounded-button` (8px) to `rounded-btn` (99px).
3. **Card Imagery:** Search for image containers using `rounded-button` (e.g. Portfolio previews in `NailArtistPreviewCard`). Upgrade them to `rounded-[12px]`.

#### DO / DON'T Examples
✅ **DO**
```tsx
<h1 className="font-heading font-bold text-[clamp(28px,4vw,44px)] leading-[1.1] text-s-ink">
```

❌ **DON'T**
```tsx
<h1 className="font-heading font-bold text-2xl sm:text-3xl text-s-ink"> // BANNED
```

---

## Phase 2: Design — Lift Card Hovers to V3 Physics

V3 Rule 4 dictates that hover physics on cards must translate vertically by exactly `-5px` with a `shadow-warm-xl` diffusion.

#### Exact Files
- `[MODIFY]` `app/[locale]/salon/[slug]/page.tsx`

#### Instructions
1. Find the Barber Card Links (`<Link href="..." className="rounded-card ...">`).
2. Replace `hover:shadow-card` with the strict V3 hover physics: `hover:-translate-y-[5px] hover:shadow-warm-xl transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]`.

---

## Phase 3: Feature — Component Primitives Unification

The Discovery page manually implements a loading spinner for infinite scroll instead of using the global unified `<Spinner>` component.

#### Exact Files
- `[MODIFY]` `app/[locale]/discover/page.tsx`

#### Instructions
1. Replace the manually coded spinner (`<div className="w-6 h-6 border-2 border-s-coral border-t-transparent rounded-full animate-spin" />`) with `<Spinner size="md" />`.
2. Ensure `import Spinner from "@/components/ui/Spinner";` is present.

---

## R6: DEPENDENCY ORDERING TABLE

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Core V3 Tokens (Pills & Clamps) | Nothing |
| Phase 2 | 🤖 | V3 Hover Physics | Phase 1 |
| Phase 3 | 🤖 | Primitive Unification | Phase 2 |
| Phase 4 | 🤖 | Smoke Test | All phases |
