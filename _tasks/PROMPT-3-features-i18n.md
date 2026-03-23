# 🧩 PROMPT 3 of 3: Features + i18n + Final Docs

> **Read `CLAUDE.md` (Section 12: Rules 15-19) and `UI_RULES.md` BEFORE starting.**
> **Prerequisite:** Prompts 1 and 2 must be complete.
> Verify:
> ```bash
> grep -Ern "teal|bg-gray-|shadow-teal" components/ app/ --include="*.tsx" | grep -v "node_modules\|s-coral\|s-ink\|//" | wc -l
> # Should be 0 or near 0
> ```

---

## ⚠️ WCAG CONTRAST RULE

`text-s-coral` ONLY for large text (≥18px bold / ≥24px), icons, badges, buttons.
For body text on cream: use `text-s-coral-text` (`#7A2415`).

---

## 🚦 Risk Assessment

| Phase | Risk | Could Break | Prevention |
|---|---|---|---|
| 9 (stamp card) | 🟢 SAFE | Nothing — new UI | Check StampCard exists |
| 10 (compare) | 🟡 MED | SalonCard parents | Optional props + defaults |
| 11 (tutorial) | 🟢 SAFE | Nothing | localStorage guard |
| 12 (weather) | 🟡 MED | Homepage if no API key | Graceful hide |
| 12.5 (admin) | 🟡 MED | Dashboard imports | Verify imports |
| 13 (API debug) | 🔴 HIGH | Response format | Check consumers first |
| 14 (i18n) | 🟡 MED | Text if key missing | Fallback strings |

---

## 🤖 PHASE 9 — Stamp Card (45 min)

### 9.1 — Check if StampCard exists

```bash
ls components/loyalty/StampCard.tsx 2>/dev/null || echo "CREATE IT"
```

### 9.2 — Create/update

#### [NEW] `components/loyalty/StampCard.tsx` (if missing)

2×5 grid of circles. Filled: `bg-s-coral` + `<Check />`. Empty: `bg-s-bg-sunken dark:bg-s-dm-surface` + dashed border. Progress bar. Reward text. Full dark mode.

✅ DO: Lucide `Check` icon for filled stamps
❌ DON'T: Emoji ⭐ or ✓

### 9.3 — Wire to ProfilePage

#### [MODIFY] `components/ProfilePage.tsx`

```tsx
import StampCard from "@/components/loyalty/StampCard";
// After user info card:
<StampCard currentStamps={stampCount ?? 0} totalStamps={10} reward="10% auf deine nächste Buchung" />
```

### 9.4 — Backend

Check if `GET /api/profile` returns `stamp_count` or booking count. If not, add it.
Logic: `stamp_count` = total completed bookings mod 10. After 10, reset to 0.

```bash
npm run build
git add -A && git commit -m "prompt 3 phase 9: stamp card on profile" && git push
git tag polish-ph9 && git push origin polish-ph9
```

---

## 🤖 PHASE 10 — Compare Toggle (1 hour)

### 10.1 — SalonCard compare button

#### [MODIFY] `components/SalonCard.tsx`

Add OPTIONAL props (must not break existing parents):
```tsx
showCompare?: boolean;       // default false
compareSelected?: boolean;
onCompareToggle?: (id: string) => void;
```

Compare button (lucide `Scale`) next to favorite:
```tsx
{showCompare && (
  <button onClick={(e) => { e.preventDefault(); onCompareToggle?.(salon.id); }}
    className={cn("absolute top-2 right-12 z-10 w-8 h-8 rounded-full ...",
      compareSelected ? "bg-s-coral text-white" : "bg-white/70 dark:bg-s-dm-surface/70 text-s-ink/40"
    )}><Scale size={14} /></button>
)}
```

Ring when selected: `ring-2 ring-s-coral`

✅ DO: ALL new props OPTIONAL with defaults
❌ DON'T: Make `onCompareToggle` required

### 10.2 — CompareDrawer animation

#### [MODIFY] `components/CompareDrawer.tsx`

Dark mode tokens + framer-motion slide-up.

### 10.3 — Wire compare in CategoryPage and HomePage

Add `useState<Set<string>>` for compare (max 3). Pass props to SalonCards. Render `<CompareBar>` when `set.size > 0`.

```bash
npm run build
git add -A && git commit -m "prompt 3 phase 10: compare toggle on salon cards" && git push
git tag polish-ph10 && git push origin polish-ph10
```

---

## 🤖 PHASE 11 — Tutorial Tour (30 min)

#### [MODIFY] `components/TutorialTour.tsx`

Verify element IDs exist: `#tour-search` (SearchBar), `#tour-categories` (HomePage grid), `#tour-messages` (Header icon). Add IDs if missing.

Auto-trigger (in TutorialTour or HomePage):
```tsx
useEffect(() => {
  if (typeof window === "undefined") return;
  if (localStorage.getItem("solen_tour_done")) return;
  const timer = setTimeout(() => { startTour(); localStorage.setItem("solen_tour_done", "true"); }, 2000);
  return () => clearTimeout(timer);
}, []);
```

```bash
npm run build
git add -A && git commit -m "prompt 3 phase 11: tutorial tour auto-trigger" && git push
git tag polish-ph11 && git push origin polish-ph11
```

---

## 🤖 PHASE 12 — Weather Banner (45 min)

#### [NEW] `app/api/weather/route.ts`

```typescript
export async function GET() {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "No key" }, { status: 503 });
  const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=Basel,CH&appid=${apiKey}&units=metric&lang=de`, { next: { revalidate: 1800 } });
  const data = await res.json();
  return NextResponse.json({ temp: Math.round(data.main.temp), condition: data.weather[0].main, description: data.weather[0].description });
}
```

#### [MODIFY] `components/WeatherBanner.tsx`

Wire to API. Conditions:
- Hot+sunny: "Perfektes Wetter für einen Salon-Besuch!"
- Rain: "Regentag? Perfekt für Spa & Massage"
- Cold: "Kalt — wärm dich bei Wellness auf!"

✅ DO: Hide banner if API errors
❌ DON'T: Show loading spinner for weather

```bash
npm run build
git add -A && git commit -m "prompt 3 phase 12: weather banner API" && git push
git tag polish-ph12 && git push origin polish-ph12
```

---

## 🤖 PHASE 12.5 — Admin Quartier Image Override (30 min)

#### [NEW] `app/[locale]/dashboard/quartier-images/page.tsx`

Admin page: list quartiers → dropdown to select salon OR upload custom image. Save to `content` table (key: `quartier_image_{name}`).

#### [NEW] `app/api/salons/quartier-admin/route.ts`

POST: save admin override (requires admin auth).

Update `quartier-featured/route.ts` to check admin override first.

```bash
npm run build
git add -A && git commit -m "prompt 3 phase 12.5: admin quartier image override" && git push
```

---

## 🤖 PHASE 13 — API Debugging (1 hour)

#### [MODIFY] `app/api/salons/route.ts`
#### [MODIFY] `app/api/directory/route.ts`
#### [MODIFY] `app/api/content/route.ts`
#### [MODIFY] `app/api/categories/route.ts`

For EACH:
1. Add try/catch + `console.error`
2. Add env var checks with early exit
3. Verify table names match CLAUDE.md Section 6
4. Test: `curl http://localhost:3000/api/salons?category=coiffeur`

✅ DO: Wrap logic in try/catch
❌ DON'T: Change response format — grep for consumers first:
```bash
grep -rn "api/salons\|api/categories\|api/directory\|api/content" components/ --include="*.tsx" | head -20
```

```bash
npm run build
git add -A && git commit -m "prompt 3 phase 13: API debugging + error handling" && git push
git tag polish-ph13 && git push origin polish-ph13
```

---

## 🤖 PHASE 14 — Full i18n (8-10 hours)

### 14.0 — i18n Infrastructure Check (30 min)

1. Verify `next-intl` is configured correctly in `i18n.ts` and middleware
2. Verify `messages/de.json`, `messages/en.json`, `messages/fr.json`, `messages/it.json` exist
3. Check which keys exist in `de.json` — this is the source of truth
4. Verify `useTranslations()` works in Header.tsx (it already uses it)

### Strategy
- Use `useTranslations()` from `next-intl` in every component
- `messages/de.json` = source of truth
- Nested keys: `home.hero.title`, `category.labels.coiffeur`

### 14.1 — HomePage (2h)
Replace ALL hardcoded German:
- "Beauty. Basel." → `t("hero.title")`
- "Willkommen {name}" → `t("hero.welcome", { name })`
- "Entdecken" → `t("sections.categories")`
- "Beliebte Salons" → `t("sections.featured")`
- "Noch keine Salons" → `t("sections.empty")`
- "Neue Salons" → `t("sections.new")`
- "Last-Minute Angebote" → `t("sections.lastminute")`
- "Wieder buchen?" → `t("sections.rebook")`
- "Quartiere in Basel" → `t("sections.quartiers")`
- "Bald hier" → `t("quartiers.soon")`
- ALL button texts, CTA texts, section headers

### 14.2 — CategoryPage (1h)
Replace `categoryLabels` object + all UI text.

### 14.3 — FilterBar + SearchBar (45min)
"Heute verfügbar", "Preis", "Filter löschen", "Beliebteste", etc.

### 14.4 — BookingCalendar (1.5h)
~30 strings: "Morgens", "Nachmittags", "Termin bestätigen", etc.

### 14.5 — ChatWindow (1h)
"Noch keine Nachrichten", "Nachricht schreiben…", "Angebot erstellen"

### 14.6 — ProfilePage + Auth + CancelModal (1h)
Settings labels, "Termin stornieren", SignIn.tsx L87/89/106/108/126/200/208

### 14.7 — Remaining (1h)
Footer, Breadcrumb ("Home" → FR "Accueil"), CookieBanner, BookingSuccess, LastMinuteCard, SalonCard (badge/stamp text), WeatherBanner, salon detail page (tabs, info labels, review section)

### 14.8 — Populate ALL locale files

#### [MODIFY] `messages/de.json` — All keys (source of truth)
#### [MODIFY] `messages/en.json` — English translations
#### [MODIFY] `messages/fr.json` — French translations
#### [MODIFY] `messages/it.json` — Italian translations

### 14.9 — Verification

```bash
# Remaining hardcoded German
grep -rn '"Buchen\|"Termin\|"Salon\|"Filtern\|"Kategorie\|"Startseite\|"Zurück' components/ --include="*.tsx" | grep -v "t(\|messages/" | head -20

# Key parity
node -e "
  const de=require('./messages/de.json'), en=require('./messages/en.json'), fr=require('./messages/fr.json');
  const flat=(o,p='')=>Object.entries(o).flatMap(([k,v])=>typeof v==='object'?flat(v,p+k+'.'):p+k);
  const dK=flat(de),eK=flat(en),fK=flat(fr);
  console.log('DE:',dK.length,'Missing EN:',dK.filter(k=>!eK.includes(k)).length,'Missing FR:',dK.filter(k=>!fK.includes(k)).length);
"
```

```bash
npm run build
git add -A && git commit -m "prompt 3 phase 14: full i18n DE/EN/FR/IT" && git push
git tag v3-i18n && git push origin v3-i18n
```

---

## 🤖 PHASE 15 — Final Verification + Docs (30 min)

### Full sweep (MANDATORY — Rule 19)

```bash
# Rebrand leftovers
grep -Ern "bg-mesh-teal|shadow-teal-glow|accent-teal|from-coral/" components/ app/ --include="*.tsx"
# Old dark tokens
grep -Ercn "dark:bg-dm-|dark:text-dm-" components/ app/ --include="*.tsx"
# Cold grays
grep -Ercn "bg-gray-|border-gray-|text-gray-" components/ app/ --include="*.tsx" | wc -l
# Hardcoded links
grep -rn '"/de/' components/ app/ --include="*.tsx" | grep -v "messages/\|redirect"
# Emoji
grep -Ern "🎉|⭐|👤|🔵|⚪|🔘" components/ app/ --include="*.tsx"
# window.prompt/alert
grep -rn "window\.prompt\|window\.alert" components/ --include="*.tsx"
# CancelModal dups
grep -rn "function CancelModal" components/ app/ --include="*.tsx"
```

#### [MODIFY] `CLAUDE.md` — Update Section 3.5 features
#### [MODIFY] `_tasks/INCOMPLETE_FEATURES.md` — Mark done: stamp card, compare, tutorial, weather, i18n

```bash
npm run build
git add -A && git commit -m "prompt 3 phase 15: final docs + verification" && git push
git tag v3-ui-polish && git push origin v3-ui-polish
```

---

## 📊 Summary

| Prompt | Phases | Time |
|---|---|---|
| **1** | 1-4.5 (cleanup, dark mode, grays, security) | ~5.5h |
| **2** | 5-8 (header, hover, homepage, buttons) | ~4.5h |
| **3** | 9-15 (features, API debug, i18n, docs) | ~14h |
| **Total** | | **~24h** |
