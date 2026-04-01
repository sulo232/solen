> 🛑 **GLOBAL DIRECTIVE: DO NOT PUSH TO PRODUCTION (NO `# 🛑 STOP: DO NOT PUSH (Wait for user approval)`)**
> **DO NOT RUN `# 🛑 STOP: DO NOT PUSH (Wait for user approval)` OR DEPLOY UNLESS EXPLICITLY INSTRUCTED BY THE USER.**
> 1. Everything must be built, tested, and validated on `localhost` FIRST.
> 2. Even if a roadmap says "# 🛑 STOP: DO NOT PUSH (Wait for user approval)" at the end of a step, **IGNORE IT**. Replace any implied pushes with just running a local `npm run build` or `npx tsc --noEmit`.
> 3. Only push when the user explicitly confirms "everything is good and push".
> 4. This rule applies to ALL agents (Claude, Cursor, Gemini, etc.).

# Roadmap: Salon Detail Page i18n + Polish
> **Priority**: 🟡 P1 — Run AFTER or IN PARALLEL with roadmap-critical-fixes (no file conflicts)
> **Parallelism**: SAFE to run alongside roadmap-critical-fixes and roadmap-empty-states. Does NOT touch: middleware.ts, TerminePage.tsx, HomePage.tsx, SalonCard.tsx.
> **Estimated Time**: ~45 minutes
> **File Lock**: `app/[locale]/salon/[slug]/page.tsx`, `app/[locale]/compare/ComparePageClient.tsx`

## BREAKAGE RISK ASSESSMENT

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🟢 SAFE | Nothing | Adding translation keys only |
| Phase 2 | 🔴 HIGH | Salon detail page completely | Verify every string is mapped BEFORE deploying |
| Phase 3 | 🟡 MEDIUM | Compare page text | Small file, simple strings |
| Phase 4 | 🟢 SAFE | Nothing | Adding i18n keys to `warum-solen` |

---

## 🤖 Phase 1: Add Translation Keys to All 4 Locale Files

**Goal**: Add ALL the translation keys needed BEFORE touching any component code. This way if the component migration has a bug, at least the keys exist.

**Files**:
- [MODIFY] `messages/de.json` — Add `"salonDetail"` and `"compare"` sections
- [MODIFY] `messages/en.json` — Same
- [MODIFY] `messages/fr.json` — Same
- [MODIFY] `messages/it.json` — Same

### Keys to add for `salonDetail`:

```json
"salonDetail": {
  "notFound": "Salon nicht gefunden",
  "notFoundMessage": "Dieser Salon wurde möglicherweise entfernt oder umbenannt.",
  "viewAllSalons": "Alle Salons ansehen",
  "open": "Geöffnet",
  "closed": "Geschlossen",
  "openingHours": "Öffnungszeiten",
  "todayPrefix": "Heute",
  "remaining": "verbleibend",
  "offPeakDiscount": "Off-Peak: {percent}% Rabatt",
  "offPeakToday": "Heute {start}–{end} Uhr",
  "aboutUs": "Über uns",
  "salonInfo": "Saloninfo",
  "atmosphere": "Atmosphäre",
  "expertise": "Expertise",
  "products": "Produkte",
  "publicTransport": "ÖV-Anbindung",
  "team": "Team",
  "photos": "Fotos",
  "portfolio": "Portfolio",
  "location": "Standort",
  "info": "Info",
  "services": "Angebot",
  "reviews": "Bewertungen",
  "book": "Buchen",
  "viewAllDesigns": "Alle Designs ansehen",
  "previousPhoto": "Vorheriges Foto",
  "nextPhoto": "Nächstes Foto",
  "photoOf": "Foto {current} / {total}",
  "flagReview": "Bewertung melden",
  "flagReasonPlaceholder": "Bitte beschreibe deinen Grund (min. 5 Zeichen)…",
  "flagSubmit": "Melden",
  "flagCancel": "Abbrechen",
  "flagSuccess": "Gemeldet",
  "flagError": "Fehler",
  "writeReview": "Bewertung schreiben",
  "showMoreReviews": "Weitere Bewertungen laden",
  "sortNewest": "Neueste",
  "sortHighest": "Beste",
  "sortLowest": "Schlechteste",
  "giftCard": "Gutschein",
  "packages": "Pakete",
  "noGallery": "Noch keine Fotos",
  "staffWith": "mit",
  "serviceDuration": "{minutes} Min.",
  "bookNow": "Jetzt buchen",
  "closeSheet": "Schliessen",
  "sun": "Sonntag",
  "mon": "Montag",
  "tue": "Dienstag",
  "wed": "Mittwoch",
  "thu": "Donnerstag",
  "fri": "Freitag",
  "sat": "Samstag"
}
```

For `en.json`:
```json
"salonDetail": {
  "notFound": "Salon not found",
  "notFoundMessage": "This salon may have been removed or renamed.",
  "viewAllSalons": "View all salons",
  "open": "Open",
  "closed": "Closed",
  "openingHours": "Opening Hours",
  "todayPrefix": "Today",
  "remaining": "remaining",
  "offPeakDiscount": "Off-Peak: {percent}% off",
  "offPeakToday": "Today {start}–{end}",
  "aboutUs": "About Us",
  "salonInfo": "Salon Info",
  "atmosphere": "Atmosphere",
  "expertise": "Expertise",
  "products": "Products",
  "publicTransport": "Public Transport",
  "team": "Team",
  "photos": "Photos",
  "portfolio": "Portfolio",
  "location": "Location",
  "info": "Info",
  "services": "Services",
  "reviews": "Reviews",
  "book": "Book",
  "viewAllDesigns": "View all designs",
  "previousPhoto": "Previous photo",
  "nextPhoto": "Next photo",
  "photoOf": "Photo {current} / {total}",
  "flagReview": "Report review",
  "flagReasonPlaceholder": "Please describe your reason (min. 5 characters)…",
  "flagSubmit": "Report",
  "flagCancel": "Cancel",
  "flagSuccess": "Reported",
  "flagError": "Error",
  "writeReview": "Write a review",
  "showMoreReviews": "Load more reviews",
  "sortNewest": "Newest",
  "sortHighest": "Best",
  "sortLowest": "Worst",
  "giftCard": "Gift Card",
  "packages": "Packages",
  "noGallery": "No photos yet",
  "staffWith": "with",
  "serviceDuration": "{minutes} min.",
  "bookNow": "Book now",
  "closeSheet": "Close",
  "sun": "Sunday",
  "mon": "Monday",
  "tue": "Tuesday",
  "wed": "Wednesday",
  "thu": "Thursday",
  "fri": "Friday",
  "sat": "Saturday"
}
```

For `fr.json`:
```json
"salonDetail": {
  "notFound": "Salon introuvable",
  "notFoundMessage": "Ce salon a peut-être été supprimé ou renommé.",
  "viewAllSalons": "Voir tous les salons",
  "open": "Ouvert",
  "closed": "Fermé",
  "openingHours": "Horaires d'ouverture",
  "todayPrefix": "Aujourd'hui",
  "remaining": "restant",
  "offPeakDiscount": "Hors pointe : {percent}% de remise",
  "offPeakToday": "Aujourd'hui {start}–{end}",
  "aboutUs": "À propos",
  "salonInfo": "Infos salon",
  "atmosphere": "Atmosphère",
  "expertise": "Expertise",
  "products": "Produits",
  "publicTransport": "Transports publics",
  "team": "Équipe",
  "photos": "Photos",
  "portfolio": "Portfolio",
  "location": "Emplacement",
  "info": "Info",
  "services": "Services",
  "reviews": "Avis",
  "book": "Réserver",
  "viewAllDesigns": "Voir tous les designs",
  "previousPhoto": "Photo précédente",
  "nextPhoto": "Photo suivante",
  "photoOf": "Photo {current} / {total}",
  "flagReview": "Signaler l'avis",
  "flagReasonPlaceholder": "Décrivez votre raison (min. 5 caractères)…",
  "flagSubmit": "Signaler",
  "flagCancel": "Annuler",
  "flagSuccess": "Signalé",
  "flagError": "Erreur",
  "writeReview": "Écrire un avis",
  "showMoreReviews": "Charger plus d'avis",
  "sortNewest": "Plus récents",
  "sortHighest": "Meilleurs",
  "sortLowest": "Moins bien notés",
  "giftCard": "Carte cadeau",
  "packages": "Forfaits",
  "noGallery": "Pas encore de photos",
  "staffWith": "avec",
  "serviceDuration": "{minutes} min.",
  "bookNow": "Réserver",
  "closeSheet": "Fermer",
  "sun": "Dimanche",
  "mon": "Lundi",
  "tue": "Mardi",
  "wed": "Mercredi",
  "thu": "Jeudi",
  "fri": "Vendredi",
  "sat": "Samedi"
}
```

For `it.json`:
```json
"salonDetail": {
  "notFound": "Salone non trovato",
  "notFoundMessage": "Questo salone potrebbe essere stato rimosso o rinominato.",
  "viewAllSalons": "Vedi tutti i saloni",
  "open": "Aperto",
  "closed": "Chiuso",
  "openingHours": "Orari di apertura",
  "todayPrefix": "Oggi",
  "remaining": "rimanente",
  "offPeakDiscount": "Fuori punta: {percent}% di sconto",
  "offPeakToday": "Oggi {start}–{end}",
  "aboutUs": "Chi siamo",
  "salonInfo": "Info salone",
  "atmosphere": "Atmosfera",
  "expertise": "Competenza",
  "products": "Prodotti",
  "publicTransport": "Trasporto pubblico",
  "team": "Team",
  "photos": "Foto",
  "portfolio": "Portfolio",
  "location": "Posizione",
  "info": "Info",
  "services": "Servizi",
  "reviews": "Recensioni",
  "book": "Prenota",
  "viewAllDesigns": "Vedi tutti i design",
  "previousPhoto": "Foto precedente",
  "nextPhoto": "Foto successiva",
  "photoOf": "Foto {current} / {total}",
  "flagReview": "Segnala recensione",
  "flagReasonPlaceholder": "Descrivi il motivo (min. 5 caratteri)…",
  "flagSubmit": "Segnala",
  "flagCancel": "Annulla",
  "flagSuccess": "Segnalato",
  "flagError": "Errore",
  "writeReview": "Scrivi una recensione",
  "showMoreReviews": "Carica altre recensioni",
  "sortNewest": "Più recenti",
  "sortHighest": "Migliori",
  "sortLowest": "Peggiori",
  "giftCard": "Carta regalo",
  "packages": "Pacchetti",
  "noGallery": "Nessuna foto ancora",
  "staffWith": "con",
  "serviceDuration": "{minutes} min.",
  "bookNow": "Prenota ora",
  "closeSheet": "Chiudi",
  "sun": "Domenica",
  "mon": "Lunedì",
  "tue": "Martedì",
  "wed": "Mercoledì",
  "thu": "Giovedì",
  "fri": "Venerdì",
  "sat": "Sabato"
}
```

```bash
git add messages/
git commit -m "feat: add salonDetail and compare i18n keys to all 4 locales"
```

> ⚠️ **BE CAREFUL**:
> - JSON files MUST be valid JSON — run `node -e "JSON.parse(require('fs').readFileSync('messages/de.json'))"` to verify each one
> - Do NOT modify existing keys — only ADD new sections
> - Keys must be at the TOP LEVEL of the JSON object (not nested inside another existing key)

---

## 🤖 Phase 2: Migrate Salon Detail Page to i18n

**Goal**: Replace every hardcoded German string in `app/[locale]/salon/[slug]/page.tsx` with `t()` calls from `useTranslations("salonDetail")`.

**Files**:
- [MODIFY] `app/[locale]/salon/[slug]/page.tsx` — Full i18n migration

**Step-by-step**:

1. Add import at top of file:
```tsx
import { useTranslations } from "next-intl";
```

2. Inside `SalonProfilePage()`, add after the existing hooks:
```tsx
const t = useTranslations("salonDetail");
```

3. Replace the `TABS` array (currently at line ~257-265) with:
```tsx
const TABS = [
  { key: "angebot", label: t("services") },
  { key: "bewertungen", label: t("reviews") },
  { key: "team", label: t("team") },
  { key: "fotos", label: t("photos") },
  { key: "portfolio", label: t("portfolio") },
  { key: "standort", label: t("location") },
  { key: "info", label: t("info") },
];
```
**IMPORTANT**: Since `TABS` uses `t()`, it MUST be moved INSIDE the component body (after `useTranslations`), not outside as a module-level const.

4. Replace the `DAYS_DE` / `DAYS_EN` arrays with:
```tsx
const DAYS = [t("sun"), t("mon"), t("tue"), t("wed"), t("thu"), t("fri"), t("sat")];
```
And replace all references to `DAYS_DE[i]` / `DAYS_EN[i]` with just `DAYS[i]`, and remove the `locale === "de" ? DAYS_DE[i] : DAYS_EN[i]` ternary.

5. Replace these hardcoded strings (search-and-replace each one):

| Line(s) | Current | Replace With |
|---|---|---|
| ~239 | `"Off-Peak: ${slot.discount_percent}% Rabatt"` | `t("offPeakDiscount", { percent: slot.discount_percent })` |
| ~242 | `"Heute ${slot.start_time}–${slot.end_time} Uhr"` | `t("offPeakToday", { start: slot.start_time, end: slot.end_time })` |
| ~247 | `"verbleibend"` | `t("remaining")` |
| ~258-264 | Tab labels (TABS array) | Already handled above |
| ~374 | `"Salon nicht gefunden"` | `t("notFound")` |
| ~376 | `"Dieser Salon wurde möglicherweise..."` | `t("notFoundMessage")` |
| ~381 | `"Alle Salons ansehen"` | `t("viewAllSalons")` |
| ~505 | `"Vorheriges Foto"` | `t("previousPhoto")` |
| ~514 | `"Nächstes Foto"` | `t("nextPhoto")` |
| ~548-551 | `"Geöffnet"` / `"Geschlossen"` | `t("open")` / `t("closed")` |
| ~634 | `"Über uns"` | `t("aboutUs")` |
| ~651 | `"Öffnungszeiten"` | `t("openingHours")` |
| ~661 | `"Heute:"` | `t("todayPrefix") + ":"` |
| ~678 | `"Geschlossen"` (in hours) | `t("closed")` |
| ~699 | `"Geschlossen"` (desktop hours) | `t("closed")` |
| ~712 | `"Saloninfo"` | `t("salonInfo")` |
| ~726 | `"Atmosphäre"` | `t("atmosphere")` |
| ~742 | `"Expertise"` | `t("expertise")` |
| ~758 | `"Produkte"` | `t("products")` |
| ~774 | `"ÖV-Anbindung"` | `t("publicTransport")` |
| ~786 | `"Team"` heading | `t("team")` |
| ~154 | `"Alle Designs ansehen"` | `t("viewAllDesigns")` |
| ~160 | `"Buchen"` (NailArtistPreviewCard) | `t("book")` |

**IMPORTANT**: The `OffPeakCountdown` and `NailArtistPreviewCard` are sub-components defined BEFORE the main component. They need their own `useTranslations("salonDetail")` hook since they're separate components. Add `const t = useTranslations("salonDetail");` at the top of each sub-component.

✅ DO:
```tsx
function NailArtistPreviewCard({ member, locale, onBook }: { ... }) {
  const t = useTranslations("salonDetail");
  // ...
  <Link ...>{t("viewAllDesigns")}</Link>
  <button ...>{t("book")}</button>
}
```

❌ DON'T:
```tsx
// DON'T pass `t` as a prop — use the hook in each component
// DON'T use template literals for translated strings — use t() with params
```

**Verification**:
1. Switch to English locale and visit any salon page — all labels should be in English
2. Switch to French locale — should be French
3. Open the Network tab — no errors should fire
4. Run `npx tsc --noEmit` — should pass

```bash
git add app/[locale]/salon/[slug]/page.tsx
git commit -m "feat: full i18n migration of salon detail page — 40+ strings extracted"
```

> ⚠️ **BE CAREFUL**:
> - This file is 67KB and 1252 lines — DO NOT try to rewrite the whole file. Use targeted search-and-replace.
> - `TABS` must move INSIDE the component since it now uses `t()`.
> - Sub-components (`OffPeakCountdown`, `NailArtistPreviewCard`) need their OWN `useTranslations` hook
> - The `Stars` component does NOT need i18n — it's icon-only
> - Do NOT touch the `JsonLd` component — schema markup should stay in English
> - Make sure to handle the `{photoIndex + 1} / {photos.length}` counter — this uses interpolation
> - After migration, grep for any remaining hardcoded German: `grep -n "Geschlossen\|Geöffnet\|Buchen\|Über uns" app/[locale]/salon/[slug]/page.tsx`

---

## 🤖 Phase 3: Migrate Compare Page to i18n

**Files**:
- [MODIFY] `app/[locale]/compare/ComparePageClient.tsx`

**Goal**: Replace all 12 `{/* TODO i18n */}` markers with actual `t()` calls.

Add `import { useTranslations } from "next-intl";` and `const t = useTranslations("compare");` inside the component.

Add `"compare"` keys to all 4 locale files:

For `de.json`:
```json
"compare": {
  "back": "Zurück",
  "title": "Salons vergleichen",
  "salonCount": "{count} Salons",
  "loading": "Salons werden geladen…",
  "errorTitle": "Fehler beim Laden",
  "errorMessage": "Die Salondetails konnten nicht geladen werden. Bitte versuche es erneut.",
  "noSelectionTitle": "Keine Salons ausgewählt",
  "noSelectionMessage": "Wähle bis zu 4 Salons auf der Entdecken-Seite aus, um sie hier direkt zu vergleichen.",
  "notFoundTitle": "Salons nicht gefunden",
  "notFoundMessage": "Die verlinkten Salons konnten nicht gefunden werden. Möglicherweise sind sie nicht mehr aktiv.",
  "discover": "Salons entdecken",
  "recommendation": "Empfehlung",
  "bookNow": "Jetzt buchen",
  "bookLabel": "Buchen",
  "hint": "Die Empfehlung basiert auf Bewertungen, Anzahl Rezensionen und Preisen.",
  "rating": "Bewertung",
  "reviewCount": "Anzahl Bewertungen",
  "cheapestService": "Günstigster Service",
  "todayHours": "Öffnungszeiten heute",
  "distance": "Entfernung",
  "closed": "Geschlossen"
}
```

Similar entries for EN/FR/IT (translate each).

Then replace each `{/* TODO i18n */}` block with the corresponding `t()` call. Also fix `getTodayHours` to use `t("closed")` instead of hardcoded "Geschlossen", and the row labels to use `t()`.

```bash
git add app/[locale]/compare/ messages/
git commit -m "feat: full i18n migration of compare page — 12 TODO markers resolved"
```

> ⚠️ **BE CAREFUL**:
> - The `buildRows` function is defined outside the component. Move the row labels into it as params passed from the component, OR restructure to call `t()` inside the component.
> - `getTodayHours` returns "Geschlossen" — this needs the `t` function too. Pass locale-aware label from the component.

---

## 🤖 Phase 4: Clean Up warum-solen Hardcoded German

**Files**:
- [MODIFY] `app/[locale]/warum-solen/page.tsx` — Replace ~20 hardcoded German strings with i18n

The `warum-solen` page has strings like "Stammle Stempel bei jedem Besuch!", "Sammle Stempel, bekomm Belohnungen", and "Entdecke Basels beste Salons". These should all be translated.

Add a `"whySolen"` key to all 4 locale files with every string, then use `useTranslations("whySolen")` in the page component.

```bash
git add app/[locale]/warum-solen/ messages/
git commit -m "feat: i18n migration of warum-solen marketing page"
```

> ⚠️ **BE CAREFUL**:
> - The page uses `MockChat`, `MockCompare`, `MockMap` — these are decorative components with hardcoded chat messages. ALSO translate those chat bubble strings.
> - Do NOT change the page layout or remove any sections

---

## 🔍 SELF-CHECK PROTOCOL

After ALL phases, run:

```bash
# 1. No remaining hardcoded German in migrated files
grep -c "Geschlossen\|Geöffnet\|Buchen\|Über uns\|Bewertungen\|Öffnungszeiten" app/[locale]/salon/[slug]/page.tsx
# Expected: 0

grep -c "TODO i18n" app/[locale]/compare/ComparePageClient.tsx
# Expected: 0

# 2. Valid JSON
node -e "JSON.parse(require('fs').readFileSync('messages/de.json'))" && echo "de OK"
node -e "JSON.parse(require('fs').readFileSync('messages/en.json'))" && echo "en OK"
node -e "JSON.parse(require('fs').readFileSync('messages/fr.json'))" && echo "fr OK"
node -e "JSON.parse(require('fs').readFileSync('messages/it.json'))" && echo "it OK"

# 3. TypeScript
npx tsc --noEmit 2>&1 | tail -5

# 4. Build
npm run build 2>&1 | tail -10
```

If ANY check fails, fix before pushing.

---

## DEPENDENCY ORDERING

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Add i18n keys | Nothing |
| Phase 2 | 🤖 | Salon page migration | Phase 1 |
| Phase 3 | 🤖 | Compare page migration | Phase 1 |
| Phase 4 | 🤖 | Warum-solen migration | Phase 1 |
