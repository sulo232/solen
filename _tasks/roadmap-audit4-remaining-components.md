---
description: Phase 4 roadmap to resolve stubbed dashboard features, dead states, and major i18n regressions identified in round3_audit.md.
---

# Roadmap: Stub Features & i18n Remediation (Audit 4)

This roadmap resolves the findings in `round3_audit.md`. It addresses dead UI tabs (Notes/Tags in the Nail dashboard), hardcoded states like 'due clients' remaining empty, and comprehensive i18n extraction for 7 heavily German-hardcoded components.

## BREAKAGE RISK ASSESSMENT

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🟡 MEDIUM | Client Note Deletion | Ensure optimistic UI for adding/removing tags properly handles database network failures, preventing desynced state. |
| Phase 2 | 🟢 SAFE | Station Utilization | Safely handle cases where the real-time utilization API returns `null` or 0 by defaulting the progress bar to 0% as it currently is. |
| Phase 3 | 🟡 MEDIUM | Review Form Submission | If Zod schemas in `ReviewForm.tsx` rely on hardcoded German strings for validation matching, migrating to i18n could break submission. Test validation carefully. |
| Phase 4 | 🟢 SAFE | Admin i18n | Standard string replacement; completely safe as long as variables (like `{n} Stempel`) are passed correctly to `next-intl`. |
| Phase 5 | 🟢 SAFE | Documentation | Pure markdown updates. |

---

## 🤖 CLAUDE CODE PHASES

### Phase 1: Nail Client Tab & Infill Reminders (Dead UI)
The `NailClientTab` has Notes and Tags tabs that are pure visual stubs. `InfillReminderConfig` declares due clients but never fetches them.

**Files:**
- `[MODIFY]` `components/dashboard/nail/NailClientTab.tsx`
- `[NEW]` `app/api/dashboard/clients/[id]/tags/route.ts`
- `[NEW]` `app/api/dashboard/clients/[id]/notes/route.ts`
- `[MODIFY]` `components/dashboard/nail/InfillReminderConfig.tsx`
- `[NEW]` `app/api/dashboard/nail/infill-due/route.ts`

> ⚠️ **BE CAREFUL**:
> - **What could go wrong:** Changing client states must perfectly align with the `clients` table schema. Ensure we check if `tags` or `notes` columns exist, or if they need a cross-reference table.
> - **Common mistakes:** Fetching notes every time the tab switches instead of fetching once per client profile load.
> - **Edge cases:** Infill reminders should only calculate clients who had a nail service > 3 weeks ago but haven't booked a follow-up.

**✅ DO:**
```tsx
// Using SWR for the notes to prevent over-fetching
const { data: notes, mutate } = useSWR(`/api/dashboard/clients/${clientId}/notes`, fetcher);
```

**❌ DON'T:**
```tsx
// Raw fetching on every render
useEffect(() => { fetchNotes() }, [activeTab])
```

**Verification Steps:**
- Run: `git commit -m "feat: Implement backend connect for Nail Client Notes, Tags, and Infill Reminders"`
- Test: Open the Nail Dashboard > Clients. Add a tag and note to a client, refresh the page, and verify they persist.

---

### Phase 2: Station Utilization Integration
`StationManager.tsx` has utilization progress bars hardcoded to 0%.

**Files:**
- `[MODIFY]` `components/dashboard/nail/StationManager.tsx`
- `[NEW]` `app/api/dashboard/nail/stations/utilization/route.ts`

> ⚠️ **BE CAREFUL**:
> - **What could go wrong:** Calculating overlapping bookings in SQL to determine "current" utilization can be highly complex and cause DB bottlenecks.
> - **Common mistakes:** Not accounting for timezone offsets when comparing current time against the booking start/end times.

**✅ DO:**
```typescript
// Query based on current UTC time overlapping booking boundaries
const now = new Date().toISOString();
// SQL: WHERE start_time <= now AND end_time >= now
```

**Verification Steps:**
- Run: `git commit -m "feat: Connect station utilization bars to live booking data"`
- Test: Create a mock booking for *right now* at Station 1. Verify the utilization bar jumps from 0% to the corresponding percentage.

---

### Phase 3: Customer-Facing i18n Migration (High Priority)
`ReviewForm.tsx` (11 strings), `CityPage.tsx`, and `StaffPortfolio` force non-German speakers to see German UI during critical conversion flows.

**Files:**
- `[MODIFY]` `components/reviews/ReviewForm.tsx`
- `[MODIFY]` `components/CityPage.tsx` (or respective path)
- `[MODIFY]` `components/StaffPortfolio.tsx`
- `[MODIFY]` `messages/de.json`
- `[MODIFY]` `messages/en.json`
- `[MODIFY]` `messages/fr.json`
- `[MODIFY]` `messages/it.json`

> ⚠️ **BE CAREFUL**:
> - **What could go wrong:** Forms might submit raw translated strings as data payload (e.g., rating category names) instead of standard EN enum keys.
> - **Common mistakes:** Forgetting to pass the `{cityName}` and `{name}` variables to the `t()` function.

**✅ DO:**
```tsx
{t('bookWith', { name: staffData.name })}
```

**❌ DON'T:**
```tsx
Bei {staffData.name} buchen
```

**Verification Steps:**
- Run: `git commit -m "fix: Extract hardcoded German from ReviewForm, CityPage, and StaffPortfolio to next-intl"`
- Test: Open a salon review modal in `/fr` and verify every string (including "Detailbewertung") is in French.

---

### Phase 4: Admin i18n Migration
Extract 42 combined hardcoded German strings from AI Art Generator, Loyalty, Chair Manager, and Walk-in Analytics.

**Files:**
- `[MODIFY]` `components/dashboard/LoyaltyConfig.tsx`
- `[MODIFY]` `components/dashboard/ChairManager.tsx`
- `[MODIFY]` `components/dashboard/WalkinAnalytics.tsx`
- `[MODIFY]` `components/dashboard/nail/AiArtGenerator.tsx`
- `[MODIFY]` `messages/de.json`, `en.json`, `fr.json`, `it.json`

> ⚠️ **BE CAREFUL**:
> - **Common mistakes:** Breaking the AI generation prompt structure. If the AI generator expects "Stiletto" as an EN prompt parameter, do not send the translated UI label to the backend logic. Separate UI label from API payload.

**✅ DO:**
```tsx
// Send exactly what the AI API expects, translate only the UI
<button onClick={() => generate('Square')}>
  {t('shapes.square')}
</button>
```

**❌ DON'T:**
```tsx
// Translating the prompt payload itself
<button onClick={() => generate(t('shapes.square'))}> 
```

**Verification Steps:**
- Run: `git commit -m "fix: Migrate 4 remaining dashboard components to next-intl"`
- Test: Build the application to ensure no TypeScript errors from missing JSON translation keys.

---

### Phase 5: Documentation Update
Ensure all new `dashboard` API routes are registered.

**Files:**
- `[MODIFY]` `CLAUDE.md`

> ⚠️ **BE CAREFUL**:
- Do not overwrite other agents' documentation updates. Pull first if working on a shared branch.

**Verification Steps:**
- Run: `git commit -m "docs: Map Audit 4 API routes to CLAUDE.md"`

---

## DEPENDENCY ORDERING TABLE

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Nail Client Notes & Infill | Nothing |
| Phase 2 | 🤖 | Station Utilization | Phase 1 (for dashboard safety) |
| Phase 3 | 🤖 | Customer-Facing i18n | Nothing |
| Phase 4 | 🤖 | Admin-Facing i18n | Nothing |
| Phase 5 | 🤖 | Update CLAUDE.md | Phases 1-2 |
