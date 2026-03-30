# Barbershop Sub-Site Roadmap (`/barbershop`)

> **Note**: This roadmap follows `ROADMAP_RULES.md` strict formatting. 

## R1: BREAKAGE RISK ASSESSMENT

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1: URL State | 🟡 MEDIUM | Hydration mismatch / Infinite re-renders | Wrap the `BarbershopAboveGrid` in `<Suspense>` if using `useSearchParams` to prevent de-optimizing the route. |
| Phase 2: Design Sync | 🟢 SAFE | Visual regressions | Use exact V3 design tokens (`rounded-btn`, `shadow-warm-xl`, `rounded-card`). |
| Phase 3: Walk-in UX | 🟡 MEDIUM | Supabase realtime subscription | Ensure `WalkinQueue` properly cleans up channel subscriptions on unmount. Apply `tabular-nums` carefully to text nodes only. |

---

## R2: SEPARATE MANUAL VS CODE PHASES

**🧑 MANUAL PHASES**
- Verify translations for any new Walk-in teaser elements across target locales.

**🤖 CLAUDE CODE PHASES**
- Phase 1: Feature — URL Sync for 3-Tier Filters
- Phase 2: Design — V3 Enforcement on BarbershopSections
- Phase 3: Feature & Design — WalkinQueue realtime UX upgrade
- Phase 4: Post-Execution Smoke Test

---

## Phase 1: Feature — URL Sync for Filters

The Fade-Typ, Haartyp, and Stil pills use local React state. Upgrading to URL-driven state for shareability and deep-linking.

#### Exact Files
- `[MODIFY]` `components/barber/BarbershopSections.tsx`

#### Instructions
1. Import `useRouter`, `usePathname`, `useSearchParams` from `next/navigation`.
2. Replace `useState` for `fadeIdx`, `textureIdx`, `styleIdx` with reads from `searchParams`.
3. Wrap `BarbershopAboveGrid` safely in `<Suspense>` at the page level.

#### DO / DON'T Examples
✅ **DO**
```tsx
const searchParams = useSearchParams();
const activeFade = searchParams.get("fade");
// Use router.push to set the param
```

❌ **DON'T**
```tsx
// Don't use local state for deep-linked discovery features
const [fadeIdx, setFadeIdx] = useState<number | null>(null);
```

> ⚠️ **BE CAREFUL**: Barbershop has THREE independent filter rows. Ensure changing one filter doesn't accidentally wipe out the URL parameters for the other two. Use a stable `createQueryString` utility.

---

## Phase 2: Design — V3 Enforcement

#### Exact Files
- `[MODIFY]` `components/barber/BarbershopSections.tsx`

#### Instructions
1. **Eyebrow Labels**: Change the `label` prop rendering in `<FilterPills>` to `text-[11px] tracking-[0.2em] uppercase text-s-amber font-heading font-bold`.
2. **Buttons**: Change the Walk-ins link from `rounded-button` to `rounded-btn`.
3. **Card Hovers**: Change "Unsere Barber" cards from `hover:-translate-y-1` and `hover:shadow-warm-md` to V3 strict `hover:-translate-y-[5px] hover:shadow-warm-xl`.
4. **Section Titles**: Upgrade `Unsere Barber` from `text-xl` to `text-[clamp(26px,3.5vw,44px)] tracking-[-0.02em]`.

#### DO / DON'T Examples
✅ **DO**
```tsx
<div className="hover:-translate-y-[5px] hover:shadow-warm-xl transition-all duration-250">
```

❌ **DON'T**
```tsx
<div className="hover:-translate-y-1 hover:shadow-warm-md"> // Banned values
```

---

## Phase 3: Feature & Design — WalkinQueue Realtime UX

#### Exact Files
- `[MODIFY]` `components/barber/WalkinQueue.tsx`
- `[MODIFY]` `components/barber/BarbershopSections.tsx`

#### Instructions
1. **Walk-in Teaser**: In `BarbershopSections.tsx`, make the Walk-in teaser a tier-2 glassmorphism card (Barbershop is Zone 2). Add a pulsing green (`s-sage`) dot next to the "Walk-ins" text to imply live status.
2. **Queue Entries**: In `WalkinQueue.tsx`, replace `rounded-button` on queue entries with `rounded-card` (20px).
3. **Queue Action Buttons**: Replace `rounded-button` with `rounded-btn` (99px pill) for the check/cancel action buttons.
4. **Tabular Nums**: Apply the `data-text` class to the estimated wait time (`~X Min.`) to use `DM Sans tabular-nums` to prevent the UI from jittering when numbers change.

> ⚠️ **BE CAREFUL**: Do not break the Realtime subscription logic inside `WalkinQueue.tsx`. Only modify the Tailwind classes rendering the UI.

---

## R6: DEPENDENCY ORDERING TABLE

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | URL Sync Filters | Nothing |
| Phase 2 | 🤖 | Design Updates (Sections) | Nothing |
| Phase 3 | 🤖 | Walk-in Queue UX | Nothing |
| Phase 4 | 🤖 | Smoke Test | All phases |
