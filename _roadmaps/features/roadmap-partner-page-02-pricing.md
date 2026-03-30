# Partner Page — Topic 2: Pricing Section

> **Status**: 📋 ROADMAP READY (not yet executed)
> **Owner**: TBD
> **Depends on**: Topic 1 (hero is already rebuilt)
> **Part of**: Partner Page Overhaul (Topic 2 of 12)

---

## Summary

Add a pricing section to the partner page after the benefits. Two parts:
1. **Pricing card** — "Nur 1% Provision" with a feature checkmark list
2. **Competitor comparison chart** — CSS bar chart showing Solen (1%) vs Treatwell (~25-30%) vs Manual/Andere (~15-20%)

The 1% commission is the biggest differentiator. The visual chart makes it impossible to miss.

---

## Breakage Risk Assessment

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🟢 SAFE | Nothing | Only adds a new section between Benefits and CTA |
| Phase 2 | 🟢 SAFE | Nothing | Only adds i18n keys |
| Phase 3 | 🟢 SAFE | Nothing | Validation only |

---

## ⚠️ CROSS-TOPIC DEPENDENCY ANALYSIS

**This section goes between Benefits and CTA — it does NOT modify either.**

Topics 3-6 all add more sections to the same page. Placement order on the page after this topic:
1. Hero (Topic 1 ✅)
2. Benefits (existing)
3. **Pricing (this topic)**
4. CTA (existing)

Future topics will insert between Pricing and CTA, or after CTA. This section is self-contained.

**Recharts**: Already in the project (`package.json`), used in dashboard analytics. However, for a public landing page, a lightweight CSS-only bar chart is better — no JS bundle increase, instant render, SEO-friendly.

---

## Phase 1: Add Pricing Section to Partner Page 🤖

### 1.1 Section structure

[MODIFY] `app/[locale]/partner/page.tsx`

Insert a new section between the `{/* Benefits */}` section and the `{/* CTA */}` section.

**✅ DO — Use a CSS-only bar chart, design tokens, i18n:**
```tsx
{/* Pricing */}
<div className="py-16 bg-white dark:bg-s-dm-bg">
  <div className="max-w-5xl mx-auto px-4 sm:px-6">
    {/* Section header */}
    <div className="text-center mb-12">
      <h2 className="font-heading font-bold text-2xl sm:text-3xl text-s-ink dark:text-s-dm-text mb-3">
        {t("pricing_title")}
      </h2>
      <p className="text-s-ink/60 dark:text-s-dm-text/60 max-w-2xl mx-auto">
        {t("pricing_subtitle")}
      </p>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
      
      {/* Left — Pricing Card */}
      <div className="bg-white dark:bg-s-dm-surface border border-s-ink/5 dark:border-s-dm-text/10 rounded-card shadow-warm-md p-8 relative overflow-hidden">
        {/* Popular badge */}
        <div className="absolute top-4 right-4 bg-s-coral/10 text-s-coral text-xs font-body font-semibold px-3 py-1 rounded-pill">
          {t("pricing_badge")}
        </div>
        
        {/* Price */}
        <p className="text-sm font-body text-s-ink/50 dark:text-s-dm-text/50 mb-1">{t("pricing_label")}</p>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-heading font-bold text-4xl text-s-coral">1%</span>
          <span className="text-s-ink/50 dark:text-s-dm-text/50 text-sm">{t("pricing_per_booking")}</span>
        </div>
        <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 mb-6">{t("pricing_no_fixed")}</p>

        {/* Feature checklist */}
        <ul className="space-y-3">
          {[
            "pricing_feature_1",
            "pricing_feature_2",
            "pricing_feature_3",
            "pricing_feature_4",
            "pricing_feature_5",
            "pricing_feature_6",
            "pricing_feature_7",
            "pricing_feature_8",
          ].map((key) => (
            <li key={key} className="flex items-start gap-3">
              <Check className="w-4 h-4 text-s-sage mt-0.5 shrink-0" />
              <span className="text-sm text-s-ink/80 dark:text-s-dm-text/80">{t(key)}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Right — Competitor Comparison Chart */}
      <div className="bg-s-bg-surface dark:bg-s-dm-surface rounded-card p-8">
        <h3 className="font-heading font-semibold text-lg text-s-ink dark:text-s-dm-text mb-6">
          {t("compare_title")}
        </h3>

        {/* Bar chart — CSS only */}
        <div className="space-y-6">
          {/* Solen */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-body font-semibold text-s-coral">solen.ch</span>
              <span className="text-sm font-body font-bold text-s-coral">1%</span>
            </div>
            <div className="h-8 w-full bg-s-ink/5 dark:bg-s-dm-text/5 rounded-button overflow-hidden">
              <div
                className="h-full bg-s-coral rounded-button flex items-center justify-end pr-2 transition-all duration-1000"
                style={{ width: "3.3%" }}
              >
              </div>
            </div>
          </div>

          {/* Treatwell */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-body text-s-ink/60 dark:text-s-dm-text/60">{t("compare_treatwell")}</span>
              <span className="text-sm font-body font-bold text-s-ink/60 dark:text-s-dm-text/60">~30%</span>
            </div>
            <div className="h-8 w-full bg-s-ink/5 dark:bg-s-dm-text/5 rounded-button overflow-hidden">
              <div
                className="h-full bg-s-ink/20 dark:bg-s-dm-text/20 rounded-button transition-all duration-1000"
                style={{ width: "100%" }}
              >
              </div>
            </div>
          </div>

          {/* Andere Plattformen */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-body text-s-ink/60 dark:text-s-dm-text/60">{t("compare_others")}</span>
              <span className="text-sm font-body font-bold text-s-ink/60 dark:text-s-dm-text/60">15–25%</span>
            </div>
            <div className="h-8 w-full bg-s-ink/5 dark:bg-s-dm-text/5 rounded-button overflow-hidden">
              <div
                className="h-full bg-s-ink/15 dark:bg-s-dm-text/15 rounded-button transition-all duration-1000"
                style={{ width: "66%" }}
              >
              </div>
            </div>
          </div>
        </div>

        {/* Savings callout */}
        <div className="mt-8 p-4 bg-s-sage/10 rounded-card border border-s-sage/20">
          <p className="text-sm text-s-sage-text dark:text-s-sage font-body">
            <span className="font-semibold">{t("compare_savings_bold")}</span>{" "}
            {t("compare_savings_text")}
          </p>
        </div>
      </div>
    </div>
  </div>
</div>
```

### 1.2 New import needed

Add `Check` to the lucide-react import:
```diff
-import { Store, TrendingUp, Calendar, ArrowRight, Star } from "lucide-react";
+import { Store, TrendingUp, Calendar, ArrowRight, Star, Check } from "lucide-react";
```

**❌ DON'T — Avoid these patterns:**
```tsx
// ❌ DON'T: Use recharts for the bar chart — too heavy for a public landing page
import { BarChart } from "recharts";

// ❌ DON'T: Hardcoded text
<h2>Unsere Preise</h2>

// ❌ DON'T: shadow-lg, rounded-xl — banned tokens
<div className="shadow-lg rounded-xl" />

// ❌ DON'T: green-500 for checkmarks — use s-sage
<Check className="text-green-500" />

// ❌ DON'T: Negative comparison text about competitors by name in code
// Keep it factual — "~30%" not "Treatwell rips you off"
```

> ⚠️ **BE CAREFUL**:
> - The bar chart widths use inline `style` for percentages — this is the ONE acceptable `style={{}}` use case (dynamic values not achievable in Tailwind)
> - Solen's bar is 3.3% width (1/30 of the chart = tiny bar). This is intentional — the visual contrast between the tiny coral bar and the massive grey bars is the whole point
> - Do NOT use `min-w-` on the Solen bar — let it be genuinely small, that's the selling point
> - The comparison section mentions competitors generically ("Andere Plattformen"), not by name in the JSX — competitor names go in the i18n files so they can be localized/changed

---

## Phase 2: Add i18n Translation Keys 🤖

Add these keys inside the existing `"partner"` section in ALL 4 locale files:

### `messages/de.json` — add to `"partner"`:
```json
"pricing_title": "Transparent & Fair",
"pricing_subtitle": "Nur 1% Provision pro Buchung. Keine versteckten Kosten, keine Verträge, kein Risiko.",
"pricing_badge": "Bestes Angebot",
"pricing_label": "Provision pro Buchung",
"pricing_per_booking": "pro erfolgreiche Buchung",
"pricing_no_fixed": "Keine monatlichen Gebühren · Kein Vertrag · Jederzeit kündbar",
"pricing_feature_1": "Unbegrenztes Salon-Profil",
"pricing_feature_2": "Online-Buchungskalender",
"pricing_feature_3": "Dashboard & Analytics",
"pricing_feature_4": "Kundenverwaltung (CRM)",
"pricing_feature_5": "Last-Minute-Angebote veröffentlichen",
"pricing_feature_6": "Bewertungen & Antworten",
"pricing_feature_7": "Team-Verwaltung & Einladungen",
"pricing_feature_8": "SMS- & E-Mail-Erinnerungen",
"compare_title": "Vergleich: Was andere Plattformen kosten",
"compare_treatwell": "Treatwell & Co.",
"compare_others": "Andere Plattformen",
"compare_savings_bold": "Rechenbeispiel:",
"compare_savings_text": "Bei CHF 1'000 Monatsumsatz über Solen sparst du CHF 290 pro Monat gegenüber Treatwell."
```

### `messages/en.json` — add to `"partner"`:
```json
"pricing_title": "Transparent & Fair",
"pricing_subtitle": "Only 1% commission per booking. No hidden fees, no contracts, no risk.",
"pricing_badge": "Best deal",
"pricing_label": "Commission per booking",
"pricing_per_booking": "per successful booking",
"pricing_no_fixed": "No monthly fees · No contract · Cancel anytime",
"pricing_feature_1": "Unlimited salon profile",
"pricing_feature_2": "Online booking calendar",
"pricing_feature_3": "Dashboard & analytics",
"pricing_feature_4": "Client management (CRM)",
"pricing_feature_5": "Publish last-minute deals",
"pricing_feature_6": "Reviews & replies",
"pricing_feature_7": "Team management & invites",
"pricing_feature_8": "SMS & email reminders",
"compare_title": "How we compare to other platforms",
"compare_treatwell": "Treatwell & Co.",
"compare_others": "Other platforms",
"compare_savings_bold": "Example:",
"compare_savings_text": "With CHF 1,000 monthly revenue via Solen, you save CHF 290/month compared to Treatwell."
```

### `messages/fr.json` — add to `"partner"`:
```json
"pricing_title": "Transparent & Équitable",
"pricing_subtitle": "Seulement 1% de commission par réservation. Pas de frais cachés, pas de contrat, pas de risque.",
"pricing_badge": "Meilleure offre",
"pricing_label": "Commission par réservation",
"pricing_per_booking": "par réservation réussie",
"pricing_no_fixed": "Pas de frais mensuels · Pas de contrat · Résiliable à tout moment",
"pricing_feature_1": "Profil salon illimité",
"pricing_feature_2": "Calendrier de réservation en ligne",
"pricing_feature_3": "Tableau de bord & analytics",
"pricing_feature_4": "Gestion clients (CRM)",
"pricing_feature_5": "Publier des offres de dernière minute",
"pricing_feature_6": "Avis & réponses",
"pricing_feature_7": "Gestion d'équipe & invitations",
"pricing_feature_8": "Rappels SMS & e-mail",
"compare_title": "Comparaison avec les autres plateformes",
"compare_treatwell": "Treatwell & Co.",
"compare_others": "Autres plateformes",
"compare_savings_bold": "Exemple :",
"compare_savings_text": "Avec CHF 1'000 de chiffre d'affaires mensuel via Solen, vous économisez CHF 290/mois par rapport à Treatwell."
```

### `messages/it.json` — add to `"partner"`:
```json
"pricing_title": "Trasparente & Equo",
"pricing_subtitle": "Solo 1% di commissione per prenotazione. Nessun costo nascosto, nessun contratto, nessun rischio.",
"pricing_badge": "Miglior offerta",
"pricing_label": "Commissione per prenotazione",
"pricing_per_booking": "per prenotazione riuscita",
"pricing_no_fixed": "Nessun costo mensile · Nessun contratto · Cancellabile in qualsiasi momento",
"pricing_feature_1": "Profilo salone illimitato",
"pricing_feature_2": "Calendario prenotazioni online",
"pricing_feature_3": "Dashboard & analytics",
"pricing_feature_4": "Gestione clienti (CRM)",
"pricing_feature_5": "Pubblicare offerte last-minute",
"pricing_feature_6": "Recensioni & risposte",
"pricing_feature_7": "Gestione team & inviti",
"pricing_feature_8": "Promemoria SMS & e-mail",
"compare_title": "Confronto con le altre piattaforme",
"compare_treatwell": "Treatwell & Co.",
"compare_others": "Altre piattaforme",
"compare_savings_bold": "Esempio:",
"compare_savings_text": "Con CHF 1'000 di fatturato mensile tramite Solen, risparmi CHF 290/mese rispetto a Treatwell."
```

> ⚠️ **BE CAREFUL**:
> - Add these keys INSIDE the existing `"partner": { ... }` object, not as a NEW section
> - All 4 files must have identical keys
> - The savings calculation: CHF 1'000 × 30% (Treatwell) = CHF 300. CHF 1'000 × 1% (Solen) = CHF 10. Savings = CHF 290. This is correct.

---

## Phase 3: Validation 🤖

### 3.1 Banned token check
```bash
grep -Ern "shadow-sm[^a]|shadow-md|shadow-lg|rounded-lg|rounded-xl|rounded-2xl|text-green-|bg-green-" "app/[locale]/partner/page.tsx" | head -10
# Must return 0 results
```

### 3.2 Dark mode check
```bash
grep -n "bg-white" "app/[locale]/partner/page.tsx" | grep -v "dark:"
# Must return 0 results
```

### 3.3 Build
```bash
npm run build
```

### 3.4 Visual check
- Open `/de/partner` — scroll past benefits — pricing card + comparison chart visible
- Bar chart: Solen bar is tiny (coral), competitors are large (grey)
- Dark mode: card and chart backgrounds adapt
- Mobile: grid stacks (card on top, chart below)

---

## Files Changed

| Tag | File | What |
|---|---|---|
| [MODIFY] | `app/[locale]/partner/page.tsx` | Add pricing section between Benefits and CTA + import `Check` |
| [MODIFY] | `messages/de.json` | Add 17 pricing keys to `"partner"` |
| [MODIFY] | `messages/en.json` | Add 17 pricing keys to `"partner"` |
| [MODIFY] | `messages/fr.json` | Add 17 pricing keys to `"partner"` |
| [MODIFY] | `messages/it.json` | Add 17 pricing keys to `"partner"` |

---

## Dependency Ordering

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Add pricing section to partner page | Topic 1 complete (hero exists) |
| Phase 2 | 🤖 | Add i18n keys to all 4 locales | Phase 1 (code references keys) |
| Phase 3 | 🤖 | Validation | Phases 1-2 complete |

---

## Git Strategy

```bash
git add app/\[locale\]/partner/page.tsx messages/
git commit -m "partner page topic 2: pricing section with 1% commission card and competitor comparison chart"
```
