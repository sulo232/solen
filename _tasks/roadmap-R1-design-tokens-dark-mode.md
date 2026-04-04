# R1: Design Token Consolidation & Dark Mode Fix

> **Scope**: 95 issues | **Files**: ~80 | **Conflicts**: None (tokens/globals only)
> **Agent**: Can run in parallel with all other roadmaps

---

## Phase 1.1: Audit & Map All Token Violations

**Goal**: Create a definitive list of every hardcoded color, shadow, radius, and font-size still in the codebase.

**Steps**:
1. Run `grep -rn '#[0-9a-fA-F]{6}' components/ app/ --include="*.tsx"` and save output
2. Run `grep -rn 'rgba(' components/ app/ --include="*.tsx"` for inline rgba values
3. Run `grep -rn 'shadow-\[' components/ app/ --include="*.tsx"` for custom shadows
4. Run `grep -rn 'rounded-\[' components/ app/ --include="*.tsx"` for custom radii (exclude `rounded-[16px]` which maps to `rounded-card`)
5. Run `grep -rn 'text-\[.*px\]' components/ app/ --include="*.tsx"` for custom font sizes
6. Categorize each hit into: color | shadow | radius | font-size | spacing
7. Map each hardcoded value to its design token equivalent:
   - `#222222` / `#1A1209` / `#1A1A1A` → `s-ink`
   - `#717171` / `#6A6A6A` / `#555555` / `#8A8178` → `s-ink/60`
   - `#EBEBEB` / `#E0E0E0` / `#CCCCCC` → `s-ink/[0.08]`
   - `#F0F0F0` / `#F5F5F5` → `s-bg-surface`
   - `#F7F7F7` / `#f7f7f7` → `s-bg-sunken`
   - `#E8624A` / `#E8735A` → `s-coral`
   - `#FF385C` → `s-coral` (retire Airbnb pink)
   - `#D4870A` → `s-amber`
   - `#2E5E3A` / `#2E7D32` / `#22CC71` / `#4CAF6F` → `s-sage`
   - `#D32F2F` → `s-error`
   - `#F2C144` → `s-yellow`
   - `#EDE8E2` / `#EDE5D8` → `s-bg-sunken`
   - `#F5F0EB` → `s-bg-base`
   - `#2C2825` → `s-dm-bg` (footer)
   - `#484848` → `s-ink/70`
   - `#9CA3AF` → `s-ink/40`

**Verification**: Zero grep results for unmapped hex values in components/

---

## Phase 1.2: Consolidate CSS Variables in globals.css

**Goal**: Ensure every design token has both light AND dark mode values.

**Steps**:
1. Read `app/globals.css` — find all `:root` and `.dark` / `[data-theme="dark"]` blocks
2. Verify these CSS variables exist in BOTH light and dark:
   - `--raised` (cards/modals): light `#FFFFFF`, dark `#1E1710`
   - `--base` (page bg): light `#FAF6EF`, dark `#151009`
   - `--glass-bg`: light `rgba(255,255,255,0.72)`, dark `rgba(30,23,16,0.72)`
   - `--glass-border`: light `rgba(26,18,9,0.08)`, dark `rgba(255,255,255,0.08)`
   - `--glass-shadow-inset`: appropriate for both
3. Add any missing dark mode CSS variables
4. Verify all `shadow-elevation-*` and `shadow-v5-*` tokens exist in `tailwind.config.js`
5. If missing, add them:
   - `shadow-elevation-1`: `0 1px 3px rgba(26,18,9,.06), 0 1px 2px rgba(26,18,9,.04)`
   - `shadow-elevation-2`: `0 2px 8px rgba(26,18,9,.08), 0 1px 3px rgba(26,18,9,.04)`
   - `shadow-elevation-3`: `0 4px 12px rgba(26,18,9,.06), 0 16px 40px rgba(26,18,9,.08)`
   - `shadow-v5-card`: layered rest shadow
   - `shadow-v5-card-hover`: layered hover shadow
   - `shadow-v5-float`: `0 8px 28px rgba(26,18,9,.15), 0 2px 8px rgba(26,18,9,.06)`
   - `shadow-coral-glow`: `0 2px 12px rgba(232,98,74,.25)`

**Verification**: `npm run build` passes. Visual check in dark mode — no white flashes.

---

## Phase 1.3: Migrate All Remaining Hardcoded Colors

**Goal**: Zero hardcoded hex colors in components/ and app/ (excluding globals.css, tailwind.config.js, and SVG fill values that are design tokens).

**Steps per file** (process ALL files from Phase 1.1 output):
1. Read the file
2. Replace each hardcoded value with its token from the Phase 1.1 mapping
3. For inline `style={{ color: "#xxx" }}` — convert to className with Tailwind token
4. For inline `style={{ background: "rgba(..." }}` — convert to CSS variable (`var(--glass-bg)`) or Tailwind class
5. For inline `boxShadow` — convert to shadow token class or CSS variable
6. Ensure every text color has a `dark:` variant: `text-s-ink dark:text-s-dm-text`
7. Ensure every background has a `dark:` variant: `bg-[--raised] dark:bg-s-dm-surface`

**Critical dark mode fixes** (these cause visible white flashes):
- `bg-white` → `bg-[--raised]` (cards, modals, dropdowns)
- `bg-[#F5F0EB]` → `bg-[--base]` (page backgrounds)
- `rgba(255,255,255,0.72)` → `var(--glass-bg)` (glass effects)
- `border-[#EBEBEB]` → `border-s-ink/[0.08] dark:border-white/[0.08]`
- `text-[#222222]` → `text-s-ink dark:text-s-dm-text`
- `shadow-[0_8px_28px_rgba(0,0,0,0.15)]` → `shadow-v5-float`

**Files to process (priority order)**:
1. `components/layout/Header.tsx` — visible on every page
2. `components/layout/Footer.tsx` — visible on every page
3. `components/layout/BottomTabBar.tsx` — visible on every mobile page
4. `components/SalonCard.tsx` — most repeated component
5. `components/ui/FeaturedSalonCarousel.tsx`
6. `components/ui/GuidedSearch.tsx`
7. `components/ui/AirbnbSearchBar.tsx`
8. `components/salon/*` — all salon detail components
9. `components/booking/*` — all booking components
10. `components/profile/*` — all profile components
11. `components/auth/*` — login/register
12. `components/discovery/*` — discover page
13. `components/barber/*` — barber components
14. `components/dashboard/*` — dashboard components
15. `app/[locale]/**/*.tsx` — all page files

**Verification per batch**: `npm run build` after every 5 files. `grep '#[0-9a-fA-F]{6}'` count should decrease.

---

## Phase 1.4: Fix All Shadow Inconsistencies

**Goal**: Every shadow in the codebase uses a V5 token. Zero `shadow-[...]` or inline `boxShadow` with raw rgba.

**Mapping**:
- `shadow-[0_1px_3px_rgba(...)]` / `shadow-[0_1px_4px_rgba(...)]` → `shadow-elevation-1`
- `shadow-[0_2px_8px_rgba(...)]` / `shadow-[0px_2px_16px_rgba(...)]` → `shadow-elevation-2`
- `shadow-[0_4px_12px_rgba(...)]` / `shadow-[0_6px_20px_rgba(...)]` → `shadow-elevation-3`
- `shadow-[0_8px_28px_rgba(...)]` / `shadow-[0_8px_32px_rgba(...)]` → `shadow-v5-float`
- `shadow-[0_20px_60px_rgba(...)]` → `shadow-v5-float`
- `shadow-[0_2px_6px_rgba(232,98,74,...)]` / `shadow-[0_2px_4px_rgba(232,98,74,...)]` → `shadow-coral-glow`
- Inline `boxShadow: "0 ..."` → move to Tailwind class or CSS variable

**Steps**:
1. Process each file with `shadow-[` or inline `boxShadow`
2. Replace with nearest V5 token
3. For card hover states: use `hover:shadow-elevation-3` consistently
4. For modals/overlays: use `shadow-v5-float`
5. For coral CTA glow: use `shadow-coral-glow`

**Verification**: `grep -rn 'shadow-\[' components/ app/ --include="*.tsx"` returns 0 results (excluding tailwind.config.js).

---

## Phase 1.5: Fix All Border Radius Inconsistencies

**Goal**: Every radius uses a design token. Zero `rounded-[Xpx]` arbitrary values.

**Mapping**:
- `rounded-[8px]` → `rounded-input` (12px — bump up, 8px is too small)
- `rounded-[10px]` → `rounded-input` (12px)
- `rounded-[12px]` → `rounded-input`
- `rounded-[14px]` → `rounded-card` (16px — close enough)
- `rounded-[16px]` → `rounded-card`
- `rounded-[20px]` → `rounded-card-lg`
- `rounded-[28px]` → define new `rounded-sheet` token (28px) for bottom sheets
- `rounded-[32px]` → `rounded-search` (99px — or define `rounded-sheet-lg`)

**Steps**:
1. Add `rounded-sheet: '28px'` to tailwind.config.js if not present
2. Process each file: replace arbitrary rounded values with tokens
3. Verify visual consistency — no jarring radius changes

**Verification**: `grep -rn 'rounded-\[' components/ --include="*.tsx"` returns only intentional exceptions (e.g., `rounded-full` equivalents).

---

## Phase 1.6: Font Size Standardization

**Goal**: Zero arbitrary `text-[Xpx]` values. Everything on Tailwind scale.

**Mapping**:
- `text-[9px]` → `text-[10px]` minimum (accessibility) or `text-xs` (12px)
- `text-[10px]` → `text-[10px]` (keep if eyebrow, but add `/* eyebrow-xs */` comment)
- `text-[11px]` → `text-xs` (12px)
- `text-[12px]` → `text-xs`
- `text-[13px]` → `text-sm` (14px)
- `text-[14px]` → `text-sm`
- `text-[15px]` → `text-base` (16px)
- `text-[17px]` → `text-lg` (18px)
- `text-[22px]` → `text-xl` (20px) or `text-2xl` (24px)
- `text-[28px]` → `text-3xl` (30px)
- `text-[34px]` → `text-4xl` (36px)
- `text-[40px]` → `text-5xl` (48px) — or define custom
- `text-[42px]` → `text-5xl`
- `text-[48px]` → `text-5xl`
- `text-[80px]` → `text-8xl` (96px) — or keep as hero display

**Exceptions allowed**: `clamp()` values for responsive hero text, `text-[10px]` for eyebrow labels.

**Verification**: `grep -rn "text-\[.*px\]" components/ --include="*.tsx"` returns only allowed exceptions.

---

## Phase 1.7: Final Dark Mode Sweep

**Goal**: Every component renders correctly in dark mode. No white surfaces, no invisible text, no broken glass effects.

**Steps**:
1. Search for `bg-white` without `dark:` → replace with `bg-[--raised] dark:bg-s-dm-surface`
2. Search for `text-s-ink` without `dark:` → add `dark:text-s-dm-text`
3. Search for `border-s-ink/` without `dark:` → add `dark:border-white/[0.08]`
4. Search for `bg-s-bg-surface` without `dark:` → add `dark:bg-s-dm-surface`
5. Search for `rgba(255,255,255` in inline styles → replace with `var(--glass-bg)`
6. Search for `rgba(0,0,0` in inline styles → ensure dark mode equivalents exist
7. Verify Footer dark bg `#2C2825` is replaced with `bg-s-dm-bg` or CSS variable
8. Verify BottomTabBar glass works in dark mode
9. Verify all Toast variants work in dark mode
10. Verify all modal/bottom-sheet backdrops work in dark mode

**Verification**: Toggle dark mode on localhost. Navigate every page. Zero white flashes. All text readable.

---

## Commit Strategy

- **1.1-1.2**: `"refactor: consolidate design tokens and add dark mode CSS variables"`
- **1.3**: One commit per 10 files: `"fix: migrate hardcoded colors to tokens (batch X/Y)"`
- **1.4**: `"fix: standardize all shadows to V5 elevation tokens"`
- **1.5**: `"fix: standardize all border radii to design tokens"`
- **1.6**: `"fix: standardize all font sizes to Tailwind scale"`
- **1.7**: `"fix: complete dark mode sweep — all components"`

## Breakage Risks

| Risk | Mitigation |
|---|---|
| Color token doesn't exist in Tailwind config | Verify config before using. Add if missing. |
| Dark mode variable undefined | Add to `:root` AND `.dark` in globals.css |
| Shadow token looks different than original | Compare visually on localhost before committing |
| Font size jump (13px → 14px) changes layout | Check line heights, container widths after change |
| `bg-[--raised]` not resolving | Ensure CSS variable defined in globals.css `:root` |
