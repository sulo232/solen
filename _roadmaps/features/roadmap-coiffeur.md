# Coiffeur Sub-Site Roadmap (`/coiffeur`)

> **Note**: This roadmap follows `ROADMAP_RULES.md` strict formatting. 

## R1: BREAKAGE RISK ASSESSMENT

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1: URL State | 🟡 MEDIUM | Hydration mismatch / Infinite re-renders | Use Next.js `useRouter` and `useSearchParams` carefully. Ensure Suspense boundary wraps the filter component if reading searchParams. |
| Phase 2: Design Sync | 🟢 SAFE | Visual regressions | Use exact V3 design tokens (`rounded-btn`, `shadow-warm-xl`). |
| Phase 3: AI Match | 🟡 MEDIUM | Z-index overlap | Ensure Modal/Sheet uses correct z-index (`z-50`) and `<Overlay>` uses `backdrop-blur-glass`. |

---

## R2: SEPARATE MANUAL VS CODE PHASES

**🧑 MANUAL PHASES**
- Verify translations for new "AI Match" strings in `messages/de.json`, `en.json`, etc.

**🤖 CLAUDE CODE PHASES**
- Phase 1: Feature — URL Sync for Filters
- Phase 2: Design — V3 Enforcement on CoiffeurSections
- Phase 3: Feature — Interactive AI Form Modal
- Phase 4: Post-Execution Smoke Test

---

## Phase 1: Feature — URL Sync for Filters

The hair type pills currently use local React state (`activeIdx`). We will upgrade this to URL-driven state so filters are shareable and preserve state on reload.

#### Exact Files
- `[MODIFY]` `components/coiffeur/CoiffeurSections.tsx`

#### Instructions
1. Import `useRouter`, `usePathname`, `useSearchParams` from `next/navigation`.
2. Replace local `useState` for active hair type with a read from `searchParams.get('hairType')`.
3. Wrap `CoiffeurAboveGrid` in a `<Suspense>` boundary in its parent, or handle the `useSearchParams` properly to avoid de-optimizing the entire route from static rendering.
4. Update `TRENDING_STYLES` links from `/${locale}/discover` to `/${locale}/discover?q=[style]`.

#### DO / DON'T Examples
✅ **DO**
```tsx
const searchParams = useSearchParams();
const activeType = searchParams.get("hairType");
const createQueryString = useCallback((name: string, value: string) => { /* logic */ }, [searchParams]);
<button onClick={() => router.push(`${pathname}?${createQueryString("hairType", type)}`)}>
```

❌ **DON'T**
```tsx
// Don't use local state for layout-level filters that should persist
const [activeType, setActiveType] = useState<string | null>(null);
```

> ⚠️ **BE CAREFUL**: Using `useSearchParams` without a `<Suspense>` boundary in a `page.tsx` that includes this component can force client-side rendering for the whole page. Ensure `CoiffeurAboveGrid` relies on client-side hooks safely.

#### Verification
- `npm run build` passes.
- Clicking a pill adds `?hairType=Lockig` to the URL without a hard reload.

---

## Phase 2: Design — V3 Enforcement

#### Exact Files
- `[MODIFY]` `components/coiffeur/CoiffeurSections.tsx`

#### Instructions
1. **Eyebrow Label**: Change `Haartyp` element to `text-[11px] tracking-[0.2em] uppercase text-s-amber font-heading font-bold`.
2. **Pills**: Ensure active pill uses `shadow-warm-sm`. Inactive hover uses `hover:border-s-coral` safely.
3. **Card Radius**: Change `rounded-card` to explicitly expect 20px (per V3).
4. **Card Hovers**: Change trending card `hover:-translate-y-0.5` to `hover:-translate-y-[5px]`, and `hover:shadow-warm-md` to `hover:shadow-warm-xl`.
5. **Section Titles**: Change `Trending in Basel` from `text-xl` to `text-[clamp(26px,3.5vw,44px)] tracking-[-0.02em]`.
6. **Buttons**: Change KI button from `rounded-button` (banned) to `rounded-btn`.

#### DO / DON'T Examples
✅ **DO**
```tsx
<div className="hover:-translate-y-[5px] hover:shadow-warm-xl transition-all duration-250">
```

❌ **DON'T**
```tsx
<div className="hover:-translate-y-0.5 hover:shadow-md"> // Banned tokens/values
```

> ⚠️ **BE CAREFUL**: Do not use generic string replacement. Make sure to ONLY target components in `CoiffeurSections.tsx`.

#### Verification
- Grep `rounded-button` in `components/coiffeur/CoiffeurSections.tsx` returns 0 results.

---

## Phase 3: Feature — Interactive AI Form Modal

#### Exact Files
- `[NEW]` `components/coiffeur/AiMatcherModal.tsx`
- `[MODIFY]` `components/coiffeur/CoiffeurSections.tsx`

#### Instructions
1. Instead of linking to `?ai=true`, create a client-side `<AiMatcherModal>` with `backdrop-blur-glass` overlay.
2. Build a highly animated 3-step question flow.
3. Use `--ease` bezier for smooth transitions.

> ⚠️ **BE CAREFUL**: This feature requires rigorous z-index planning. Ensure modal is `z-[500]` to sit above the scrolling layout.

#### Verification
- Test button click opens the modal instantly.

---

## R6: DEPENDENCY ORDERING TABLE

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | URL Sync Features | Nothing |
| Phase 2 | 🤖 | Design Updates | Phase 1 |
| Phase 3 | 🤖 | AI Matcher modal | Phase 2 |
| Phase 4 | 🤖 | Smoke Test | All phases |

---

## R8: FINAL UPDATES TO CLAUDE.md
*(No updates to CLAUDE.md required for this component-level upgrade).*
