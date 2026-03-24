# Roadmap R15: Homepage Improvements

> **Scope:** `components/HomePage.tsx`, `components/layout/Footer.tsx`, `components/ui/HomeSearchBar.tsx`
> **Design System:** V3 (Glass + Apple Shadows + Carpet Identity) — read `_rules/UI_RULES.md` fully before starting.
> **Full spec:** See `_roadmaps/roadmap-homepage-improvements.md` for the complete 8-phase breakdown with DO/DON'T examples.

---

## Pre-read Requirements

1. Read `CLAUDE.md` fully
2. Read `_rules/UI_RULES.md` fully
3. Read `_roadmaps/roadmap-homepage-improvements.md` fully — it contains the detailed implementation spec

---

## Phase 1: Hero Section Rework

> **Goal:** Transform hero from generic placeholder into a brand moment.

#### Files
- `[MODIFY]` `components/HomePage.tsx`

#### Instructions
1. Add amber eyebrow label `VON BASEL, FÜR BASEL` above hero H1 (Syne 700, 11px, uppercase, tracking .20em, `text-s-amber`)
2. Fix hero H1 typography: `letterSpacing: 0.01em`, `fontSize: clamp(64px, 9vw, 130px)` per UI_RULES §18
3. Update subtitle copy: Anonymous → `"Dein nächster Termin in Basel — buche Coiffeur, Nails, Spa & mehr."`
4. Fix padding: `py-16 sm:py-24` (8pt grid)

#### Verification
```bash
npm run build
```

---

## Phase 2: Admin Homepage Section Toggle

> **Goal:** Admin-controlled section visibility via `platform_settings`.

#### Files
- `[NEW]` `app/api/admin/homepage-sections/route.ts`
- `[NEW]` `app/api/homepage-sections/route.ts`
- `[MODIFY]` `components/HomePage.tsx`

#### Instructions
1. Follow `app/api/admin/social-proof/route.ts` pattern exactly — same auth, same table, same response format.
2. Key: `"homepage_sections"` in `platform_settings`
3. Public GET route (no auth) returns section config
4. Wrap each section in visibility check: `{sections.quartier && <QuartierSection />}`
5. Default all to `true` if API fails

#### Verification
```bash
npm run build
```

---

## Phase 3: Fix UI Rule Violations

#### Files
- `[MODIFY]` `components/HomePage.tsx`

#### Instructions
1. Partner CTA: `rounded-blob-a blob-interactive` → `rounded-btn` (blobs = decorative only per §39)
2. Salon card hover: `hover:scale-[1.02]` → `hover:-translate-y-[5px] hover:shadow-card-hover` on all instances
3. "Nochmal buchen" button: `rounded-button` → `rounded-btn`

#### Verification
```bash
grep -rn "rounded-blob-a\|blob-interactive\|hover:scale-\[1.02\]\|rounded-button" components/HomePage.tsx
# Must return 0 results
npm run build
```

---

## Phase 4: Smart Section Visibility

#### Files
- `[MODIFY]` `components/HomePage.tsx`

#### Instructions
1. Quartier section: only render if `Object.values(quartierCounts).some(c => c > 0)`
2. Near You: only show if `nearbySalons.length > 0` or user explicitly clicked "Standort verwenden"
3. ReviewCarousel: return `null` internally if empty

---

## Phase 5: Category Tiles Upgrade

#### Files
- `[MODIFY]` `components/HomePage.tsx`

#### Instructions
1. Each category gets brand-colour background (coral for Coiffeur, ink for Barbershop, plum for Nails, etc.)
2. Labels: `font-display` (Bebas Neue) at 22px uppercase — permitted exception per UI_RULES §18 row 5
3. Hover: `hover:scale-[1.03] hover:-rotate-1` (category tiles specifically use scale per §4 Tier 3)
4. Add section eyebrow `KATEGORIEN` + heading `Was suchst du?`
5. Remove "Entdecken" subtitle from each tile

---

## Phase 6: Footer Rework

#### Files
- `[MODIFY]` `components/layout/Footer.tsx`

#### Instructions
1. Add full-width brand banner: `SO.LEN` in Bebas Neue at `clamp(44px, 6vw, 80px)` + `Von Basel, für Basel.`
2. Rewrite "Für Salons" heading to du-form with warm CTA
3. Increase bottom wordmark to `text-5xl sm:text-6xl`
4. Add coral accent to section headers: `tracking-[.20em]` per UI_RULES
5. Add "nDSG-konform" trust signal near legal links

---

## Phase 7: Date Locale Fix

#### Files
- `[MODIFY]` `components/ui/HomeSearchBar.tsx`
- `[MODIFY]` `components/ui/date-picker.tsx`

#### Instructions
1. Pass `locale="de-CH"` from `useLocale()` to the calendar component
2. Dates should display as `dd.mm.yyyy` not `mm/dd/yyyy`

---

## Phase 8: Documentation

- Update `CLAUDE.md` Section 3.5 to mention admin homepage section toggle
- Move this roadmap to `_tasks/completed/` when done

---

## Execution Order

| Phase | Depends On |
|---|---|
| 1, 2, 3, 5, 6, 7 | Independent — any order |
| 4 | Phase 2 |
| 8 | All above |
