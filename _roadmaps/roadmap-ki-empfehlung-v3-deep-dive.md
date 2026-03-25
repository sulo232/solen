# AI Recommendation (KI Empfehlung) Enhancement Roadmap (V3)

> **Context**: Enhancing the AI Recommendation ("KI Empfehlung") section to include real tracking signals (history, views, location), context-aware explainability ("Warum?"), and replacing generic components with V3-compliant premium UI.

## Risk Assessment

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1.x (Backend) | 🟡 MEDIUM | Existing searches if shared `types` are mutated | Isolate logic in new API route `app/api/recommendations/route.ts` and new util files. |
| Phase 2.x (Frontend) | 🟡 MEDIUM | Zone 1/2 UI Rules, i18n builds | Test translation keys in all 4 locales. Use `Skeleton` instead of custom shimmers. |

## 🤖 CLAUDE CODE PHASES

### Phase 1.1: Backend Structure & Localization Preparation
Prepare the foundation for localized, AI-driven recommendations.

- **[MODIFY]** `messages/de.json`, `en.json`, `fr.json`, `it.json`
  - Add translation keys under a `"recommendations"` group:
    - `for_you`: "✦ Für dich" / "✦ For You"
    - `why`: "Warum?" / "Why?"
    - `refresh`: "Neue Empfehlungen laden ↻" / "Refresh Recommendations ↻"
- **[NEW]** `lib/ai/recommendations.ts`
  - Create utility to fetch baseline signals: user location (from Vercel headers `x-vercel-ip-city`), time of day, and day of week.

> ⚠️ **BE CAREFUL**:
> - Do not break JSON structure in translation files.
> - Avoid hardcoded text across the new files.

### Phase 1.2: AI Engine Strategy & Gemini Integration
Implement the retrieval and scoring mechanism using Gemini 2.0 Flash.

- **[NEW]** `app/api/recommendations/route.ts`
  - Combine signals: user booking history, stated preferences (CRM tags server-side), and last 5 viewed salons (from client `localStorage` parsed via request body).
  - Query DB for candidate salons (e.g., using pgvector search if applicable, or fallback to matching local salons based on categories booked).
  - Pass candidates + context to Gemini API to rank top 3-4 and generate `reason_text`.
  - **CRITICAL**: The Gemini prompt MUST receive the user's `locale` to return the `reason_text` in the correct translation.
  - Apply the **Cold Start** fallback: If no history exists, use the location signal + trending salons in Basel.

✅ **DO**:
```typescript
// app/api/recommendations/route.ts
const systemPrompt = `You are Solen's AI engine. Rank these salons and provide a 1-sentence reason... OUTPUT IN LANGUAGE: ${locale}`;
```

❌ **DON'T**:
```typescript
// DON'T assume German
const systemPrompt = `Gib einen Grund an, warum...`;
```

> ⚠️ **BE CAREFUL**:
> - Enforce strict JSON output from Gemini via Structured Outputs to avoid parsing errors.
> - Gemini hallucination risk: Prompt must explicitly state: "Only use the provided user history. Do not invent visits."

### Phase 2.1: KI Section UI (V3 Identity)
Create the dedicated premium container for the KI section.

- **[NEW]** `components/discovery/KISection.tsx` (or `components/recommendations/KISection.tsx`)
  - Container must use `bg-s-coral-subtle` or `bg-s-sand-subtle` gradient to achieve the "distinct visual identity".
  - Pass `{zone={1}}` to ensure appropriate padding and background.
  - Implement the "✦ Für dich" translation.

✅ **DO**:
```tsx
<section className="py-12 bg-gradient-to-b from-s-coral-subtle/40 to-s-bg-base">
  <h2 className="font-heading text-s-ink text-2xl">{t('recommendations.for_you')}</h2>
</section>
```

❌ **DON'T**:
```tsx
<section className="bg-gradient-to-b from-slate-100 to-gray-50">
  {/* Cold colors are BANNED. */}
</section>
```

> ⚠️ **BE CAREFUL**:
> - Zone 1 Rules apply: warm colors only, no generic Tailwind grays.

### Phase 2.2: Context-Aware Card & Shimmer
Integrate the "Warum?" tooltip and standard loading state.

- **[MODIFY]** `components/SalonCard.tsx` (or build wrapper `RecommendationCard.tsx`)
  - Add optional `aiReason` prop.
  - If present, show a small `lucide-react` Sparkles icon which, on hover, shows the tooltip (`shadow-warm-md`, `rounded-card`).
- **[MODIFY]** `components/discovery/KISection.tsx`
  - Implement loading state using existing `<Skeleton variant="card" />` in a grid. NO custom animated shimmers.

✅ **DO**:
```tsx
{isLoading ? (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <Skeleton variant="card" />
    <Skeleton variant="card" />
  </div>
) : ... }
```

❌ **DON'T**:
```tsx
<div className="animate-pulse bg-gray-200 rounded-2xl ..." />
```

> ⚠️ **BE CAREFUL**:
> - Never morph or scale the SalonCard on hover differently than standard (no `scale-105`).
> - The tooltip must not clip outside the viewport on mobile (use `radix-ui/react-tooltip` or similar robust positioning).

### Phase 2.3: Refresh Mechanic & A/B Test Hook
Implement the manual engine re-trigger and event tracking.

- **[MODIFY]** `components/discovery/KISection.tsx`
  - Add the "Refresh ↻" button using `text-s-ink-secondary hover:text-s-coral` interaction.
  - On click, invalidate the query (if using React Query) or re-fetch `/api/recommendations?refresh=true`.
- **[MODIFY]** `components/SalonCard.tsx` / `KISection.tsx`
  - Integrate `posthog.capture('ki_card_clicked', { salonId, isKiRecommendation: true })` for the click-through rate comparison.

> ⚠️ **BE CAREFUL**:
> - Prevent spamming the Refresh button. Add a 500ms `disabled` state or throttle.

---

## 🧑 MANUAL PHASES

### Phase M1: Verify Environment
1. Log into Vercel and check `GEMINI_API_KEY` is set for all environments.
2. Verify PostHog configuration is tracking custom events accurately.

---

## Execution Order

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1.1 | 🤖 | Translation Keys & Logic Stubs | None |
| Phase 1.2 | 🤖 | AI API Engine & Gemini integration | Phase 1.1 |
| Phase M1  | 🧑 | Verify Keys | Phase 1.2 |
| Phase 2.1 | 🤖 | UI Section setup (`KISection.tsx`) | Phase 1.x |
| Phase 2.2 | 🤖 | `SalonCard` Tooltip & Shimmer | Phase 2.1 |
| Phase 2.3 | 🤖 | Refresh Hook & PostHog Analytics | Phase 2.2 |
| Final     | 🤖 | Update `CLAUDE.md` with new `lib/ai/` files if applicable | Phase 2.3 |

**Post-Execution Verification Commands:**
```bash
# Verify no hardcoded German keys were missed
grep -rn "Für dich\|Warum?\|Neue Empfehlungen" app/ components/ --include="*.tsx"

# Verify no cold colors sneaked in
grep -rn "from-slate\|from-gray\|bg-gray" components/discovery/KISection.tsx

# Verify no custom pulse animations
grep -rn "animate-pulse" components/discovery/KISection.tsx
```
