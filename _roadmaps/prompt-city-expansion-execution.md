# City Expansion — Claude Code Prompts

## Which can run at the same time?

```
Phase 0 (alone, first)
     ↓
Phase 1 + Phase 2 (same time, different files)
     ↓
Phase 3 (alone, touches HomePage)
     ↓
Phase 4-5 (alone, last)
```

---

## Phase 0 — Infrastructure

```text
Read CLAUDE.md and _rules/UI_RULES.md in full.
Execute _roadmaps/roadmap-city-expansion-phase0-infrastructure.md.
Run the SQL migrations on Supabase first (Steps 1, 2, 4).
Then do the TypeScript steps (3, 5).
npm run build after every step. Git commit per step as specified.
Run the Smoke Test at the bottom when done.
```

---

## Phase 1 — City Selector

```text
Read CLAUDE.md and _rules/UI_RULES.md in full.
Execute _roadmaps/roadmap-city-expansion-phase1-city-selector.md.
Follow the Pre-Commit Checklist (CLAUDE.md §G) on every new component.
npm run build after every step. Git commit per step as specified.
Run the Smoke Test at the bottom when done.
```

---

## Phase 2 — URL Routing

```text
Read CLAUDE.md and _rules/UI_RULES.md in full.
Execute _roadmaps/roadmap-city-expansion-phase2-url-routing.md.
Pay attention to route conflicts — [city] is at the same level as existing routes.
Follow the Pre-Commit Checklist (CLAUDE.md §G) on CityPage.tsx.
If Phase 1 is running at the same time, skip Step 5 (it touches HomePage).
npm run build after every step. Git commit per step as specified.
Run the Smoke Test at the bottom when done.
```

---

## Phase 3 — Landing Page Redesign

```text
Read CLAUDE.md and _rules/UI_RULES.md in full.
Execute _roadmaps/roadmap-city-expansion-phase3-landing-page.md.
This is 9 steps. Step 2 (search bar) is highest risk — keep all existing search logic intact.
Follow the Pre-Commit Checklist (CLAUDE.md §G) on every file.
npm run build after every step. Git commit per step as specified.
Run the Smoke Test at the bottom when done.
```

---

## Phase 4-5 — City Pages + API + i18n

```text
Read CLAUDE.md and _rules/UI_RULES.md in full.
Execute _roadmaps/roadmap-city-expansion-phase4-5-pages-api-i18n.md.
API changes must be backward compatible — ?city= param is optional.
Ensure all 4 locale files have every new translation key.
npm run build after every step. Git commit per step as specified.
Run the FINAL Smoke Test (23 checks) at the bottom when done.
```
