> 🛑 **GLOBAL DIRECTIVE: DO NOT PUSH TO PRODUCTION (NO `# 🛑 STOP: DO NOT PUSH (Wait for user approval)`)**
> **DO NOT RUN `# 🛑 STOP: DO NOT PUSH (Wait for user approval)` OR DEPLOY UNLESS EXPLICITLY INSTRUCTED BY THE USER.**
> 1. Everything must be built, tested, and validated on `localhost` FIRST.
> 2. Even if a roadmap says "# 🛑 STOP: DO NOT PUSH (Wait for user approval)" at the end of a step, **IGNORE IT**. Replace any implied pushes with just running a local `npm run build` or `npx tsc --noEmit`.
> 3. Only push when the user explicitly confirms "everything is good and push".
> 4. This rule applies to ALL agents (Claude, Cursor, Gemini, etc.).

# Roadmap: Search Flow Redesign

> **Status**: Ready for Execution
> **Spec Reference**: `docs/superpowers/specs/2026-03-30-search-flow-redesign.md`

This roadmap provides exact, step-by-step instructions to refactor `GuidedSearch.tsx` into a 3-step Airbnb-style bottom sheet, matching the new design spec. 

---

## 🚨 BREAKAGE RISK ASSESSMENT

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🟢 SAFE | Nothing | Purely adding JSON keys |
| Phase 2 | 🟡 MEDIUM | Search Modal Layout | Do not alter `isOpen` logic or body scroll lock |
| Phase 3 | 🔴 HIGH | Search Navigation | Do not modify the `navigate()` function |

---

## 🤖 CLAUDE CODE PHASES

### Phase 1: i18n Dictionary Updates

**Goal**: Add the new translation keys required for the 3-step search flow.

**Target Files**:
- `[MODIFY]` `messages/de.json`
- `[MODIFY]` `messages/en.json`
- `[MODIFY]` `messages/fr.json`
- `[MODIFY]` `messages/it.json`

**Instructions**:
Under the `home.guidedSearch` namespace in all 4 files, add the following keys. (Translate the values appropriately for fr/en/it, but KEEP THE EXACT KEYS):

```json
"steps.what.title": "Was suchst du?",
"steps.what.allServices": "Egal / Alle Services",
"steps.what.backToCategories": "← Alle Kategorien",
"steps.what.skipLabel": "Überspringen",
"collapsed.change": "Ändern",
"trigger.what": "Was",
"trigger.whatPlaceholder": "Coiffeur, Nails…",
"trigger.where": "Wo",
"trigger.when": "Wann",
"trigger.whenDefault": "Flexibel",
"steps.date.time.any": "Egal",
"steps.date.time.morning": "Morgens",
"steps.date.time.afternoon": "Nachmittags",
"steps.date.time.evening": "Abends"
```

> ⚠️ **BE CAREFUL**:
> - Do NOT delete existing keys in the `home.guidedSearch` namespace (like `reset` or `openCta`); they are still used.
> - Ensure valid JSON syntax (watch for trailing commas).

**Verification**:
```bash
git add messages/
git commit -m "feat(i18n): add keys for search flow redesign"
```

---

### Phase 2: Refactor Trigger Pill (Desktop/Mobile)

**Goal**: Replace the single unified search bar with the new 3-segment (Was · Wo · Wann) trigger pill.

**Target File**:
- `[MODIFY]` `components/ui/GuidedSearch.tsx`

**Instructions**:
Find the Trigger Pill JSX (currently around line ~284 under `TRIGGER PILL`).
Replace it with three segments (Was, Wo, Wann) separated by a 1px vertical divider. 

✅ **DO**:
```tsx
<button onClick={() => open(1)} className="flex-1 flex flex-col justify-center px-4 py-2 ...">
  <span className="text-[9px] font-heading font-bold uppercase tracking-[.07em]">
    {t("trigger.what")}
  </span>
  <span className="text-[12px] font-body truncate">
    {wasLabel ?? t("trigger.whatPlaceholder")}
  </span>
</button>
{/* Divider */}
<div className="w-px h-6 bg-s-ink/10 dark:bg-white/10 shrink-0" aria-hidden="true" />
```

❌ **DON'T**:
```tsx
// DO NOT use grid for the trigger pill segments. Use flex-1 as shown above.
<div className="grid grid-cols-3">...</div>
```

> ⚠️ **BE CAREFUL**:
> - The Search Button (magnifying glass) MUST remain inside the pill on the far right.
> - Do not alter the `open()` function or `AnimatePresence` wrapper.
> - Ensure `box-shadow` matches spec: `box-shadow: 0 2px 12px rgba(0,0,0,.10), 0 1px 4px rgba(0,0,0,.04)`.

**Verification**:
```bash
git add components/ui/GuidedSearch.tsx
git commit -m "refactor(search): implement 3-segment trigger pill"
```

---

### Phase 3: Update Sheet Steps (Was → Wo → Wann)

**Goal**: Modify the bottom sheet content to convert Step 1 into a vertical list and add collapsed rows.

**Target File**:
- `[MODIFY]` `components/ui/GuidedSearch.tsx`

**Instructions**:
1. **Collapsed Rows**: In the scrollable content area, add collapsed row previews for "Was" and "Wo" if the user is on Step 2 or 3. Include an "Ändern" (Change) button. 
2. **Step 1 (Was)**: Remove the current 3-column icon grid. Replace it with a vertical list with `row bg s-coral/[0.06]` on selected state, stroke `s-coral` icons. The first option MUST be "Egal / Alle Services".
3. **Step 3 (Wann)**: Hook up `timeKey` selection to the time-of-day pills so their selected state highlights properly.

✅ **DO**:
```tsx
{/* Step 1 Vertical Row */}
<button className="w-full flex items-center text-left py-[14px] px-6 border-b border-[#F5F5F5]">
   <div className="w-10 h-10 rounded-[12px] bg-[#F5F0EB]"><CatIcon /></div>
   <div>Category Name</div>
</button>
```

❌ **DON'T**:
```tsx
// DO NOT touch the underlying navigation logic.
// Leave the navigate() function entirely alone.
```

> ⚠️ **BE CAREFUL**:
> - Zone Constraint: This is a strict Modal/Sheet zone. Do not introduce glassmorphic blurs inside the sheet.
> - Do NOT delete the `navigate()` function or modify the query param logic.
> - Ensure the "Wann" pills map to the new translation keys added in Phase 1.

**Verification**:
```bash
git add components/ui/GuidedSearch.tsx
git commit -m "refactor(search): replace icon grid with vertical list and 3-step flow"
```

---

### Phase 4: Final Verification & CLAUDE.md Update

**Goal**: Execute a full check and document changes.

**Target Files**:
- `[MODIFY]` `CLAUDE.md`
- `[MODIFY]` `_roadmaps/roadmap-search-flow-redesign.md`

**Instructions**:
1. Run `npm run lint` and `npm run typecheck` to ensure no errors were introduced in `GuidedSearch.tsx`.
2. Update `CLAUDE.md` to note that mobile bottom sheets now use `88svh` max-height with Spring iOS curve (`easing: [0.32, 0.72, 0, 1]`) instead of linear transitions for mobile modals.
3. Move `_roadmaps/roadmap-search-flow-redesign.md` to `_tasks/completed/roadmap-search-flow-redesign.md`.

**Verification**:
```bash
mv _roadmaps/roadmap-search-flow-redesign.md _tasks/completed/
git add .
git commit -m "chore(docs): mark search flow redesign complete and update CLAUDE.md"
```

---

## 📋 DEPENDENCY ORDERING

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | i18n JSON | Nothing |
| Phase 2 | 🤖 | Trigger Pill | Phase 1 |
| Phase 3 | 🤖 | Content List Refactor | Phase 2 |
| Phase 4 | 🤖 | Verification & Docs | Phase 3 |
