# Roadmap: Profile Page Overhaul (V3 Concept)

> **Goal:** Completely overhaul the user profile page from a linear scrollable layout into the V3 concept design: gradient avatar ring, beauty profile card with categorized SVG pills, salon highlight circles, and a 4-tab system (Looks, Termine, Favoriten, Stempel).

## BEHAVIOR RULES
- Read `CLAUDE.md` (all sections, especially Rule 46) and `_rules/UI_RULES.md` before starting.
- All text MUST use `useTranslations()` — keys in all 4 locale files (de/en/fr/it).
- All glass/card backgrounds MUST use `var(--glass-*)` CSS vars — NO hardcoded `rgba(255,255,255,...)`.
- Dark mode support on EVERY element — use `dark:text-s-dm-text`, `dark:bg-s-dm-surface`, etc.
- Icons: use custom SVG components from `components/ui/beauty-icons.tsx` — NOT lucide for beauty-specific icons.
- `npm run build` after EVERY phase. Do not proceed if build fails.
- One `git commit` per phase.

---

## R1: Breakage Risk Assessment

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🟢 SAFE | Nothing — new files only | — |
| Phase 2 | 🟡 MEDIUM | Avatar display if gradient CSS wrong | Test with/without avatar_url |
| Phase 3 | 🟡 MEDIUM | Preferences display if JSONB structure mismatches | Check existing `customer_preferences` column format |
| Phase 4 | 🟡 MEDIUM | Bookings/favorites gone if tab state wiring wrong | Verify all Supabase queries still work |
| Phase 5 | 🟢 SAFE | Nothing — polish only | — |
| Phase 6 | 🟢 SAFE | Docs only | — |

---

## Existing Code to Preserve

The following subsections of `ProfilePage.tsx` are WORKING and well-built. **KEEP** them — refactor into the 4-tab layout:
- `CancelModal` (lines ~39-112) — keep as-is
- `BookingCard` (lines ~261-352) — keep as-is, moves into Termine tab
- `ReferralSection` (lines ~118-241) — keep but move into Settings or hide behind a "share" action
- `SettingsSection` (lines ~360-616) — keep, move into a settings modal or sub-page

The hero, section layout, and favorites rendering will be REPLACED by the new concept.

---

## 🤖 CLAUDE CODE PHASES

### Phase 1: Create SVG Icon Library + Types

**[NEW] `components/ui/beauty-icons.tsx`**

Create a client component exporting all beauty SVG icons from the concept. Group by category:

```typescript
// Hair texture: HairStraight, HairWavy, HairCurly, HairThick, HairFine, HairLong, HairShort, HairDry
// Nail shapes: NailAlmond, NailSquare, NailCoffin, NailStiletto, NailRound, NailGel
// Skin types: SkinNormal, SkinDry, SkinOily, SkinSensitive, SkinMixed
// Gender prefs: GenderFemale, GenderMale, GenderNeutral
// Style vibes: StyleMinimal, StyleNatural, StyleBold, StyleEdgy
```

Each icon: `width=20, height=20, viewBox="0 0 20 20"`, `stroke="currentColor"`, `strokeWidth="1.7-1.8"`.

Copy the SVG paths EXACTLY from the concept. Export as named React components.

**[MODIFY] `lib/types.ts`** — Add:
```typescript
export interface BeautyProfile {
  hair: { texture?: 'straight'|'wavy'|'curly'; thickness?: 'fine'|'thick'; length?: 'short'|'long'; condition?: 'dry'|'normal'; };
  nails: { shape?: 'almond'|'square'|'coffin'|'stiletto'|'round'; type?: 'gel'|'natural'|'acrylic'; length?: 'short'|'medium'|'long'; };
  skin: { type?: 'normal'|'dry'|'oily'|'sensitive'|'mixed'; };
  stylist: { gender?: 'female'|'male'|'no-preference'; };
  style: { vibe?: ('minimal'|'natural'|'bold'|'edgy')[]; };
}

export interface ProfileTabData {
  looks: { icon: string; bg: string; color: string }[];
  // bookings, favorites, loyalty are already typed
}
```

✅ DO: Use the concept's exact SVG path data — these are hand-crafted to read at 20x20.
❌ DON'T: Replace with lucide icons — hair/nail/skin icons don't exist in lucide.

**Add i18n keys** to all 4 locale files under namespace `profile.beauty`:
```json
{
  "profile": {
    "beauty": {
      "sectionTitle": "Beauty-Profil",     // EN: "Beauty Profile", FR: "Profil Beauté", IT: "Profilo Bellezza"
      "edit": "Bearbeiten",                 // EN: "Edit", FR: "Modifier", IT: "Modifica"
      "hair": "HAAR",                       // EN: "HAIR", FR: "CHEVEUX", IT: "CAPELLI"
      "nails": "NÄGEL",                     // EN: "NAILS", FR: "ONGLES", IT: "UNGHIE"
      "skin": "HAUT",                       // EN: "SKIN", FR: "PEAU", IT: "PELLE"
      "stylist": "STYLIST",                 // EN: "STYLIST", FR: "STYLISTE", IT: "STILISTA"
      "style": "STYLE",                     // EN: "STYLE", FR: "STYLE", IT: "STILE"
      "curly": "Lockig",                    // EN: "Curly", FR: "Bouclés", IT: "Ricci"
      "wavy": "Wellig",                     // EN: "Wavy", FR: "Ondulés", IT: "Ondulati"
      "straight": "Glatt",                  // EN: "Straight", FR: "Lisses", IT: "Lisci"
      "fine": "Fein",                       // EN: "Fine", FR: "Fins", IT: "Fini"
      "thick": "Dick",                      // EN: "Thick", FR: "Épais", IT: "Spessi"
      "long": "Lang",                       // EN: "Long", FR: "Longs", IT: "Lunghi"
      "short": "Kurz",                      // EN: "Short", FR: "Courts", IT: "Corti"
      "dry": "Trocken",                     // EN: "Dry", FR: "Secs", IT: "Secchi"
      "almond": "Mandel",                   // EN: "Almond", FR: "Amande", IT: "Mandorla"
      "square": "Eckig",                    // EN: "Square", FR: "Carré", IT: "Quadrato"
      "coffin": "Coffin",                   // EN: "Coffin", FR: "Cercueil", IT: "Bara"
      "stiletto": "Stiletto",               // EN: "Stiletto", FR: "Stiletto", IT: "Stiletto"
      "round": "Rund",                      // EN: "Round", FR: "Rond", IT: "Rotondo"
      "gel": "Gel",                          // EN: "Gel", FR: "Gel", IT: "Gel"
      "sensitive": "Empfindlich",           // EN: "Sensitive", FR: "Sensible", IT: "Sensibile"
      "mixed": "Mischhaut",                 // EN: "Combination", FR: "Mixte", IT: "Mista"
      "oily": "Fettig",                     // EN: "Oily", FR: "Grasse", IT: "Grassa"
      "normal": "Normal",                   // EN: "Normal", FR: "Normale", IT: "Normale"
      "female": "Weiblich",                 // EN: "Female", FR: "Féminin", IT: "Femminile"
      "male": "Männlich",                   // EN: "Male", FR: "Masculin", IT: "Maschile"
      "neutral": "Egal",                    // EN: "No preference", FR: "Indifférent", IT: "Indifferente"
      "minimal": "Minimalistisch",          // EN: "Minimalistic", FR: "Minimaliste", IT: "Minimalista"
      "natural": "Natural",                 // EN: "Natural", FR: "Naturel", IT: "Naturale"
      "bold": "Bold",                       // EN: "Bold", FR: "Audacieux", IT: "Audace"
      "edgy": "Edgy",                       // EN: "Edgy", FR: "Edgy", IT: "Tagliente"
      "addMore": "Hinzufügen"              // EN: "Add more", FR: "Ajouter", IT: "Aggiungi"
    }
  }
}
```

**Verification:** `npm run build`
**Commit:** `git commit -m "phase1: add beauty SVG icon library + types + i18n keys"`

> ⚠️ **BE CAREFUL**: `beauty-icons.tsx` must be `"use client"` since it renders SVG elements. Keep ALL icons in ONE file (not 20 separate files) — they share the same stroke styling and are always used together.

---

### Phase 2: Build Subcomponents

**[NEW] `components/profile/ProfileHero.tsx`** — Avatar with gradient ring, name (Bebas Neue), badge, action buttons
- Gradient ring: `linear-gradient(145deg, #C8614A 0%, #E8C49A 55%, #E8927A 100%)` — 2.5px padding ring
- Avatar: 86px circle, shows initial letter if no `avatar_url`, edit button at bottom-right
- Name: `font-display text-[30px] tracking-[.07em]` (Bebas Neue)
- Badge: `"✦ Nur bei Solen"` → `t('exclusiveBadge')`, beige pill
- Actions row: `[Profil bearbeiten] [Share] [♥]` — 3 buttons like concept

**[NEW] `components/profile/BeautyProfileCard.tsx`** — The 5-row beauty card
- Read from `profile.customer_preferences` JSONB (or `profile.beauty_profile` if exists)
- 5 rows: HAAR, NÄGEL, HAUT, STYLIST, STYLE
- Each row: label (9px uppercase tracking) + flex-wrap pills
- Pill anatomy: `rounded-full px-[11px] py-[5px] text-[12px]` with per-row background/text colour:
  | Row | Pill BG | Pill Text |
  |---|---|---|
  | HAAR | `#F5E6E0` | `#8B4A35` |
  | NÄGEL | `#E4EBF7` | `#3A5280` |
  | HAUT | `#E8F3E8` | `#3A6040` |
  | STYLIST | `#F5EEE0` | `#7A5A2A` |
  | STYLE | `#EEE8F5` | `#5A3A7A` |
- Each row has a `+` dashed pill to add more
- Card wrapper: `bg-[--raised] dark:bg-s-dm-surface rounded-[18px] p-4`
- Row dividers: `border-b border-s-sand dark:border-white/[0.06]`
- "Bearbeiten" link at top-right opens edit modal

**[NEW] `components/profile/SalonHighlights.tsx`** — Horizontal scroll of favourite salon circles
- 58px circle with category-coloured background + icon inside
- Label below: 10px, muted
- Last circle: dashed border `+` "Mehr"
- Data source: existing `favorites` array from Supabase

**[NEW] `components/profile/ProfileTabs.tsx`** — 4-tab controller
- Tabs: Looks (grid icon), Termine (calendar), Favoriten (heart), Stempel (star)
- Active tab: coral text + 2px coral bottom border
- Inactive: muted text
- Tab content rendered conditionally below

**[NEW] `components/profile/LooksGrid.tsx`** — 3-column grid of look squares
- Each cell: `aspect-square rounded-[10px]` with category bg colour + large icon
- Last cell: dashed border `+` "Hinzu"
- Data: reads from profile's saved looks (can be empty initially)

✅ DO:
```tsx
// Use design token CSS vars for card backgrounds:
className="bg-[--raised] dark:bg-s-dm-surface rounded-[18px] p-4"

// Use dark mode variants on ALL pill colours:
style={{
  background: isDark ? adjustForDark(row.bg) : row.bg,
  color: isDark ? adjustForDark(row.color) : row.color
}}
```

❌ DON'T:
```tsx
// Don't hardcode white backgrounds:
style={{ background: "#FDFAF8" }}  // ← BANNED, use var(--raised)

// Don't use entry animations (this is Zone 3 — functional profile):
<motion.div initial={{ opacity: 0 }} ...>  // ← BANNED in Zone 3
```

**Verification:** `npm run build`
**Commit:** `git commit -m "phase2: build profile subcomponents (hero, beauty card, highlights, tabs, grid)"`

> ⚠️ **BE CAREFUL**:
> - The beauty card row colours are CUSTOM per row — they don't map to existing V3 tokens. This is acceptable because they're semantic data-colours, not UI chrome. Document this in a comment.
> - Dark mode for pastel data colours: lighten slightly and reduce opacity in dark mode. Use `dark:` variants or CSS vars.
> - `BeautyProfileCard` reads from `customer_preferences` which is an existing JSONB column. The schema may not match the concept's beauty profile structure exactly — map what exists, leave empty pills for what doesn't.

---

### Phase 3: Beauty Profile Edit Modal

**[NEW] `components/profile/BeautyProfileEditModal.tsx`**

A full-screen mobile sheet (or modal on desktop) for editing beauty preferences:
- Uses `GlassModal` or `BottomSheet` wrapper
- One section per category (HAAR, NÄGEL, HAUT, STYLIST, STYLE)
- Multi-select pill grid for each category
- Toggle pills on/off
- Save button updates `customer_preferences` JSONB on `profiles` table
- All labels use `useTranslations('profile.beauty')`

**[MODIFY] `app/api/profile/route.ts`** (or create if not exists)
- PATCH endpoint to update `customer_preferences` column
- Zod validation for the `BeautyProfile` structure

✅ DO: Save the structured beauty profile as nested JSONB inside the existing `customer_preferences` column:
```json
{
  "beauty": {
    "hair": { "texture": "curly", "length": "long", "thickness": "fine", "condition": "dry" },
    "nails": { "shape": "almond", "length": "medium", "type": "gel" },
    "skin": { "type": "sensitive" },
    "stylist": { "gender": "female" },
    "style": { "vibes": ["natural", "minimal"] }
  },
  "allergies": "...",
  "skinType": "..."
}
```
❌ DON'T: Create a new Supabase table for beauty profiles — use the existing JSONB column.

**Verification:** Open profile, click "Bearbeiten" on beauty card, toggle pills, save, reload → pills persist.
**Commit:** `git commit -m "phase3: beauty profile edit modal with persistence"`

> ⚠️ **BE CAREFUL**: The current `SettingsSection` ALSO writes to `customer_preferences` (allergies, skinType, stylistGender). You MUST merge both structures, not overwrite. Read the existing value, spread in the new beauty data, then save.

---

### Phase 4: Assemble New ProfilePage

**[MODIFY] `components/ProfilePage.tsx`** — MAJOR REWRITE

Replace the linear section layout with the new component hierarchy:

```
ProfilePage (1014 lines → ~400 lines)
├── AuthGuard + data loading (keep existing useEffect)
├── <ProfileHero />
├── <BeautyProfileCard />
├── <SalonHighlights />
├── <ProfileTabs>
│   ├── tab="looks" → <LooksGrid />
│   ├── tab="termine" → <BookingCard /> list (keep existing)
│   ├── tab="favoriten" → favorites list (keep existing)
│   └── tab="stempel" → <StampCard /> list (keep existing)
│   />
└── <CancelModal /> (keep existing)
```

**Data flow:**
- ProfilePage does ALL Supabase fetching (keep existing `useEffect`)
- Pass data down as props to each subcomponent
- Tab state: `useState<'looks'|'termine'|'favoriten'|'stempel'>('looks')`

**What to REMOVE from ProfilePage:**
- Inline hero section (replaced by `<ProfileHero />`)
- Inline favorites section (moved into Favoriten tab)
- Inline settings section (moved to `/profile/settings` sub-page or triggered by hero settings button)
- ReferralSection (move to settings page)
- ProfileDiscoverySections (remove from profile — user said this is confusing)

**What to KEEP in ProfilePage:**
- Auth guard + redirect logic
- Supabase data fetching (bookings, favorites, loyalty)
- CancelModal
- BookingCard component
- handleSaveProfile, handleCancelled, removeFav callbacks

✅ DO:
```tsx
return (
  <div className="min-h-screen bg-[--base] dark:bg-s-dm-bg">
    <div className="max-w-md mx-auto px-5 pt-6 pb-28">
      <ProfileHero profile={profile} locale={locale} />
      <BeautyProfileCard profile={profile} onSave={handleSaveProfile} />
      <SalonHighlights favorites={favorites} locale={locale} />
      <ProfileTabs
        activeTab={tab}
        onTabChange={setTab}
        bookings={{ upcoming, past }}
        favorites={favorites}
        loyaltyCards={loyaltyCards}
        locale={locale}
        onCancel={setCancelTarget}
        onRemoveFav={removeFav}
      />
    </div>
    {cancelTarget && <CancelModal ... />}
  </div>
);
```

❌ DON'T:
```tsx
// Don't inline 800+ lines of JSX — use the subcomponents
// Don't use max-w-3xl — the concept is mobile-first (max-w-md / 390px)
// Don't remove BookingCard or CancelModal — they're already correct
```

**Verification:**
1. Navigate to `/de/profile` — see new layout
2. Switch tabs — all 4 work
3. Click "Bearbeiten" — beauty edit modal opens
4. Toggle a pill → save → reload → pill persists
5. Cancel a booking — CancelModal still works
6. Remove a favorite — heart toggle works
7. Dark mode toggle — all elements readable

**Commit:** `git commit -m "phase4: assemble new ProfilePage with component hierarchy"`

> ⚠️ **BE CAREFUL**:
> - `max-w-md` (28rem = 448px) is the correct max-width for the mobile-first concept. The current `max-w-3xl` is too wide.
> - The `SettingsSection` should NOT be inline on the profile page anymore. Either:
>   a. Link the hero gear icon to `/[locale]/profile/settings` (new page), or
>   b. Open it in a `GlassModal`
> - Don't forget to KEEP the loading skeleton — adapt it to the new layout shape.

---

### Phase 5: Polish + Dark Mode Pass

1. **Dark mode** — verify every subcomponent:
   - Beauty pill pastel colours: reduce saturation & brighten text in dark mode
   - Avatar gradient ring: works in both modes (it's a gradient, so fine)
   - Tab active indicator: coral works in both modes
   - Card backgrounds: `var(--glass-bg-card)` or `bg-[--raised] dark:bg-s-dm-surface`
   - Empty states: text visible in dark mode

2. **Loading skeleton** — update for new layout:
   - Avatar ring skeleton (86px circle)
   - Beauty card skeleton (5 rows of pill shapes)
   - Tab bar skeleton
   - Grid skeleton (3x2 squares)

3. **Responsive** — desktop view:
   - `max-w-md` centers on desktop with ample margin
   - No horizontal scroll issues
   - Grid cells don't stretch beyond 130px square

**Verification:** Toggle dark mode on profile page. All elements readable. `npm run build` passes.
**Commit:** `git commit -m "phase5: dark mode polish + loading skeletons"`

---

### Phase 6: Documentation + Cleanup

**[MODIFY] `CLAUDE.md`** Section 3.2 — Update directory tree:
```
components/profile/
├── ProfileHero.tsx
├── BeautyProfileCard.tsx
├── BeautyProfileEditModal.tsx
├── SalonHighlights.tsx
├── ProfileTabs.tsx
└── LooksGrid.tsx
components/ui/beauty-icons.tsx
```

**[MODIFY] `CLAUDE.md`** Section 3.3 — Add:
```
- **Profile Page**: Refactored into 6 subcomponents. Uses `customer_preferences` JSONB column for beauty profile data. Zone 3 (functional, no glass animations).
- **Beauty Icons**: Custom SVG icon library in `components/ui/beauty-icons.tsx` — 20+ hand-crafted icons for hair/nail/skin/style selections. NOT lucide (these don't exist in lucide).
```

Remove `ReferralSection` and `SettingsSection` from inline profile if migrated to sub-pages.

**Commit:** `git commit -m "phase6: update docs for profile overhaul"`

---

## R6: Dependency Ordering

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Icons + types + i18n | Nothing |
| Phase 2 | 🤖 | Subcomponents | Phase 1 |
| Phase 3 | 🤖 | Edit modal + API | Phase 1 + 2 |
| Phase 4 | 🤖 | Assemble ProfilePage | Phase 2 + 3 |
| Phase 5 | 🤖 | Dark mode + polish | Phase 4 |
| Phase 6 | 🤖 | Docs | Phase 5 |

---

## R8: Quick Reference

**Concept colours (NOT in V3 token set — semantic data colours, documented):**
| Row | Pill BG | Pill Text | Dot |
|---|---|---|---|
| HAAR | `#F5E6E0` | `#8B4A35` | `#C8614A` |
| NÄGEL | `#E4EBF7` | `#3A5280` | `#6B8CC8` |
| HAUT | `#E8F3E8` | `#3A6040` | `#6BAF78` |
| STYLIST | `#F5EEE0` | `#7A5A2A` | `#C8A45A` |
| STYLE | `#EEE8F5` | `#5A3A7A` | `#9B7EC8` |

**Layout specs (from concept):**
- Phone viewport: 390px
- Avatar ring: 86px outer, 2.5px gradient border, 34px letter, Bebas Neue
- Profile name: 30px Bebas Neue, tracking .07em
- Beauty card: 18px rounded, 16px padding
- Beauty pill: 12px text, 11px horizontal padding, 5px vertical, full-rounded
- Row label: 9px uppercase, .1em tracking
- Tab text: 12px, DM Sans
- Highlight circle: 58px diameter
- Looks grid: 3 columns, 2.5px gap, aspect-square, 10px rounded
