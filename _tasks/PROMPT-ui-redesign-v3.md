# UI Redesign v3 — Claude Code Execution Prompt

## Instructions

1. **Read these files FIRST before any code changes:**
   - `CLAUDE.md` (all rules, especially Section 10 + Section 12)
   - `UI_RULES.md` (design system rules)
   - `_tasks/roadmap-ui-redesign-v3.md` (the full roadmap with BE CAREFUL blocks and DO/DON'T examples)

2. **Execute all 13 phases** from `_tasks/roadmap-ui-redesign-v3.md` in order.

3. **After EVERY phase:**
   - `npm run build` — MUST pass before committing
   - `git add [specific files]` — only stage files from that phase
   - `git commit -m "phase N: [description]"` — one commit per phase
   - `git push origin main`
   - **RE-READ `_tasks/roadmap-ui-redesign-v3.md`** for the next phase — do NOT rely on memory. Check the BE CAREFUL blocks and DO/DON'T examples for each phase before starting it.
   - Verify the Vercel deployment didn't fail

4. **Critical pre-checks:**
   - Ensure `lib/utils.ts` exists with the `cn()` function (clsx + tailwind-merge). If it doesn't, create it — ALL 21st.dev components need it.
   - Add shadcn CSS variables to `app/globals.css` in Phase 2 (--primary, --muted, --accent, etc.) — needed by 21st.dev components in phases 2, 8, 11, 12.
   - `usehooks-ts` is needed for Phase 8 (ExpandableTabs). Install it BEFORE creating the component.
   - Phase 12 needs `react-aria-components`, `@internationalized/date`, `class-variance-authority`. Install BEFORE coding.

5. **Key rules:**
   - All new SalonCard props MUST be optional (Phase 3) — SalonCard is imported in 10+ files
   - BottomNav (Phase 8) MUST check `pathname.includes('/dashboard')` and return null — dashboard has its own nav
   - Do NOT delete `Spinner.tsx` (Phase 6) — only replace full-page spinners with Skeleton
   - Phase 11 sidebar: preserve ALL existing auth guards, nav items, isActive logic, mobile bottom nav, unread counts
   - Phase 12: only replace the DATE SELECTION in BookingCalendar — keep time slots and booking logic

6. **Color sweep (Phase 1):** Update `#4ECDC4` in dashboard files too, but SKIP email HTML templates (they need hardcoded hex).

7. **If a build fails:** Fix it before moving to the next phase. Never skip a broken build.

8. **File lock:** Clear the stale `claude-code-homepage-overhaul` lock in `.agent-lock.json` and claim all files from the roadmap.

## Phase Summary

| Phase | Goal | Key Files |
|---|---|---|
| 1 | Color `#4ECDC4` → `#38B2AC` | `tailwind.config.js`, `HomePage.tsx`, `FilterBar.tsx` |
| 2 | Hero + SearchBar + InteractiveHoverButton | `[NEW] SearchBar.tsx`, `[NEW] interactive-hover-button.tsx` |
| 3 | Responsive salon cards + badges | `SalonCard.tsx`, `lib/types.ts` |
| 4 | Last-minute upgrade | `HomePage.tsx` |
| 5 | Social proof + trust badges | `[NEW] SocialProofStrip.tsx`, `[NEW] TrustBadges.tsx` |
| 6 | Skeleton loading | `[NEW] Skeleton.tsx` |
| 7 | Line art empty states | `EmptyState.tsx`, `[NEW] SVGs` |
| 8 | ExpandableTabs bottom nav + CTA | `[NEW] expandable-tabs.tsx`, `[NEW] BottomNav.tsx` |
| 9 | Pull-to-refresh + animations | `HomePage.tsx` |
| 10 | Update CLAUDE.md + UI_RULES.md | docs only |
| 11 | Dashboard animated sidebar | `[NEW] sidebar.tsx`, `DashboardLayout.tsx` |
| 12 | DateRangePicker | `[NEW] 6 ui components`, `BookingCalendar.tsx` |
| 13 | Final CLAUDE.md update | docs only |

## Start

Begin with Phase 1. Read `_tasks/roadmap-ui-redesign-v3.md` Phase 1 section now.
