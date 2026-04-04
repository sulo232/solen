# R4: i18n Sweep & Accessibility Compliance

> **Scope**: 80 issues | **Files**: ~60 components + 4 locale files
> **Conflicts**: Touches translation keys (messages/*.json) — no other roadmap touches these
> **Agent session**: Separate Claude Code window

---

## Phase 4.1: Find ALL Hardcoded Strings

**Goal**: Definitive list of every hardcoded user-facing string in the codebase.

**Steps**:
1. Run comprehensive grep for German text patterns:
```bash
grep -rn '"Jetzt\|"Buchen\|"Fehler\|"Speichern\|"Schliessen\|"Laden\|"Erfolg\|"Suchen\|"Überall\|"Entdecken\|"Nächster\|"Wählen\|"Morgen\|"Heute\|"Geschlossen\|"Geöffnet\|"Anonym\|"Kategorie\|"Beliebte\|"Nägel\|"Haarschnitt\|"Teile\|"ab \|"Mehr\|"Weniger\|"Zurück\|"Weiter' components/ app/ --include="*.tsx"
```
2. Also grep for English hardcoded strings:
```bash
grep -rn '"Show all\|"Load more\|"Cancel\|"Save\|"Delete\|"Edit\|"Close\|"Search\|"Submit\|"Back\|"Next\|"Skip\|"Done\|"Error\|"Success' components/ app/ --include="*.tsx"
```
3. Filter out strings that are already inside `t('...')` or `tNav('...')` calls
4. Create a spreadsheet of: file | line | hardcoded string | suggested translation key

**Expected count**: 50-80 hardcoded strings across the codebase.

---

## Phase 4.2: Add Translation Keys to All 4 Locale Files

**Goal**: Every hardcoded string gets a proper translation key in de.json, en.json, fr.json, it.json.

**Key naming convention**: `namespace.context.action`
- `booking.wizard.back` → "Zurück" / "Back" / "Retour" / "Indietro"
- `salon.sidebar.bookNow` → "Jetzt buchen" / "Book now" / "Réserver" / "Prenota"
- `common.error` → "Fehler" / "Error" / "Erreur" / "Errore"

**Batch 1 — Common/shared strings** (add to `common` namespace):
| Key | DE | EN | FR | IT |
|---|---|---|---|---|
| `common.error` | Fehler | Error | Erreur | Errore |
| `common.save` | Speichern | Save | Enregistrer | Salva |
| `common.cancel` | Abbrechen | Cancel | Annuler | Annulla |
| `common.close` | Schliessen | Close | Fermer | Chiudi |
| `common.back` | Zurück | Back | Retour | Indietro |
| `common.next` | Weiter | Next | Suivant | Avanti |
| `common.search` | Suchen | Search | Rechercher | Cerca |
| `common.loadMore` | Mehr laden | Load more | Charger plus | Carica altro |
| `common.showAll` | Alle anzeigen | Show all | Tout afficher | Mostra tutto |
| `common.today` | Heute | Today | Aujourd'hui | Oggi |
| `common.tomorrow` | Morgen | Tomorrow | Demain | Domani |
| `common.everywhere` | Überall | Everywhere | Partout | Ovunque |
| `common.anonymous` | Anonym | Anonymous | Anonyme | Anonimo |
| `common.new` | Neu | New | Nouveau | Nuovo |
| `common.from` | ab | from | dès | da |
| `common.choose` | Wählen | Choose | Choisir | Scegliere |

**Batch 2 — Salon-specific strings** (add to `salon` or `salonDetail` namespace):
| Key | DE | EN | FR | IT |
|---|---|---|---|---|
| `salon.bookNow` | Jetzt buchen | Book now | Réserver | Prenota ora |
| `salon.openNow` | Jetzt geöffnet | Open now | Ouvert | Aperto ora |
| `salon.closed` | Geschlossen | Closed | Fermé | Chiuso |
| `salon.nextAppointment` | Nächster Termin | Next appointment | Prochain rendez-vous | Prossimo appuntamento |
| `salon.chooseCategory` | Kategorie wählen | Choose category | Choisir une catégorie | Scegli categoria |
| `salon.allPhotos` | Alle Fotos anzeigen | Show all photos | Voir toutes les photos | Mostra tutte le foto |

**Batch 3 — Dashboard strings** (add to `dashboard` namespace):
| Key | DE | EN | FR | IT |
|---|---|---|---|---|
| `dashboard.saveError` | Fehler beim Speichern | Error saving | Erreur de sauvegarde | Errore nel salvataggio |
| `dashboard.aiError` | Fehler bei der Empfehlung | Recommendation error | Erreur de recommandation | Errore nella raccomandazione |

**Batch 4 — Staff/Barber strings** (add to `staff` namespace):
All hardcoded German in StaffSection.tsx, BookingSidebar.tsx, MobileBookingBar.tsx

**Steps per batch**:
1. Add keys to `messages/de.json`
2. Add keys to `messages/en.json`
3. Add keys to `messages/fr.json`
4. Add keys to `messages/it.json`
5. Verify JSON is valid: `node -e "JSON.parse(require('fs').readFileSync('messages/de.json'))"`

**Verification**: All 4 JSON files parse without errors.

---

## Phase 4.3: Replace Hardcoded Strings in Components

**Goal**: Every component uses `useTranslations()` or `getTranslations()`.

**Steps per component**:
1. If component doesn't have `useTranslations` → add import + initialization
2. Replace each hardcoded string with `t('key')` call
3. For components that use `useTranslations('x') as any` → keep the `as any` for now (type fix is separate)
4. For strings in `aria-label` attributes → also use `t('key')`

**Priority files** (user-facing, most visible):
1. `components/layout/Header.tsx` — `aria-label="Suchen"`, emoji tab labels
2. `components/salon/SalonSidebar.tsx` — "Jetzt buchen", "Jetzt geöffnet", "Geschlossen"
3. `components/salon/BookingSidebar.tsx` — All hardcoded German
4. `components/salon/MobileBookingBar.tsx` — "Buchen", "ab"
5. `components/salon/StaffSection.tsx` — "Nächster Termin", "Wählen"
6. `components/salon/SalonOpeningHours.tsx` — Day names, "Geschlossen"
7. `components/ui/AirbnbSearchBar.tsx` — "Kategorie wählen", locale-conditional strings
8. `components/ui/GuidedSearch.tsx` — TRENDING_SEARCHES, step labels
9. `components/BookingCalendar.tsx` — "Fehler" error fallbacks
10. `components/dashboard/LastMinuteManager.tsx` — "Fehler beim Speichern"
11. `components/dashboard/IntakeFormTab.tsx` — "Fehler bei der AI-Empfehlung"
12. `components/ui/BottomSheet.tsx` — `aria-label="Schliessen"`
13. All remaining files from Phase 4.1 output

**Verification per file**: `grep -n '"[A-ZÄÖÜ][a-zäöü]' $FILE` returns only strings inside `t()` calls or data arrays.

---

## Phase 4.4: ARIA Labels on All Interactive Elements

**Goal**: Every button, link, and interactive element has an accessible label.

**Fixes**:
1. **All icon-only buttons** — Must have `aria-label={t('...')}`:
   - Heart/favorite buttons → `aria-label={t('toggleFavorite')}`
   - Close buttons → `aria-label={t('common.close')}`
   - Menu buttons → `aria-label={t('openMenu')}`
   - Arrow buttons → `aria-label={t('previous')}` / `aria-label={t('next')}`
   - Share buttons → `aria-label={t('share')}`
   
2. **Form inputs** — Must have `aria-label` or associated `<label>`:
   - Search inputs → `aria-label={t('common.search')}`
   - Filter inputs → `aria-label={t('filterBy', { name })}`
   
3. **Dynamic content** — Must have `aria-live` regions:
   - Toast container → `aria-live="polite" aria-atomic="true"`
   - Booking step changes → `aria-live="polite"`
   - Search result counts → `aria-live="polite"`
   
4. **State announcements** — Must use `aria-expanded`, `aria-pressed`, `aria-selected`:
   - Dropdown toggles → `aria-expanded={isOpen}`
   - Filter pills → `aria-pressed={isActive}`
   - Tab items → `aria-selected={isActive}`
   - Favorite hearts → `aria-pressed={isFavorited}`

5. **Landmarks** — Verify semantic HTML:
   - Header → `<header role="banner">`
   - Main content → `<main role="main">`
   - Footer → `<footer role="contentinfo">`
   - Navigation → `<nav role="navigation">`
   - Search → `role="search"` on search containers

**Verification**: Run `npx axe-core` or Lighthouse accessibility audit. Score ≥ 90.

---

## Phase 4.5: Text Contrast Verification

**Goal**: All text meets WCAG AA (4.5:1) or AAA (7:1) contrast ratios.

**Known failures to fix**:
1. `text-s-ink/30` on white → ~2.5:1 (FAIL) → bump to `text-s-ink/50` minimum
2. `text-s-ink/40` on white → ~3.5:1 (FAIL AA for small text) → bump to `text-s-ink/50`
3. `text-[#6A6A6A]` on white → ~4.5:1 (borderline) → replace with `text-s-ink/55`
4. Placeholder text `text-s-ink/35` → bump to `text-s-ink/45`
5. Footer `text-white/55` on `#2C2825` → verify contrast, bump if needed
6. Filter pill white text on coral → verify 3:1 minimum for large text, 4.5:1 for small
7. Toast 12px text → bump to 13px minimum if contrast is tight

**Steps per fix**:
1. Calculate contrast ratio using: foreground color / background color
2. For `s-ink` (#1A1209) at X% opacity on white (#FFFFFF):
   - 30% → effective #B5B0AA → 2.3:1 FAIL
   - 40% → effective #9C9690 → 3.3:1 FAIL (small text)
   - 50% → effective #8D8879 → 4.5:1 PASS AA
   - 60% → effective #716B61 → 5.8:1 PASS AAA
3. Replace all failing opacity values

**Verification**: Lighthouse accessibility score ≥ 90. Zero contrast warnings.

---

## Phase 4.6: Locale-Aware Routing Check

**Goal**: No hardcoded `/de/` paths. All links use next-intl routing.

**Steps**:
1. `grep -rn 'href="/de/' components/ app/ --include="*.tsx"` — should return 0
2. `grep -rn 'href="/en/' components/ app/ --include="*.tsx"` — should return 0
3. `grep -rn 'push.*"/de/' components/ app/ --include="*.tsx"` — should return 0
4. All internal links should use `/${locale}/path` or next-intl `Link` component
5. Verify LanguageSwitcher triggers `router.refresh()` alongside `router.push()`

**Verification**: Switch language from DE to EN. ALL text changes. No mixed-language pages. No broken links.

---

## Commit Strategy

- **4.1**: No commit (research only)
- **4.2**: `"i18n: add 50+ translation keys to all 4 locale files (de/en/fr/it)"`
- **4.3**: `"i18n: replace all hardcoded strings with translation calls"` (one commit per 10 files)
- **4.4**: `"a11y: add ARIA labels to all interactive elements"`
- **4.5**: `"a11y: fix text contrast ratios to WCAG AA minimum"`
- **4.6**: `"i18n: verify locale-aware routing, fix hardcoded paths"`
