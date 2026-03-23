# Feature Roadmap v4 — Claude Code Execution Prompt

## Instructions

1. **Read these files FIRST before any code changes:**
   - `CLAUDE.md` — all rules, especially Section 10 + Section 12
   - `UI_RULES.md` — design system rules
   - `_tasks/roadmap-features-v4.md` — the FULL roadmap with DO/DON'T blocks and caution notes

2. **Execute all 14 phases** from `_tasks/roadmap-features-v4.md` in order shown in the Execution Order table.

3. **After EVERY sub-phase (e.g., 1.1, 1.2, 1.3):**
   - `npm run build` — MUST pass
   - `npx tsc --noEmit` — zero type errors
   - `git add [only files from this sub-phase]`
   - `git commit -m "phase N.X: [description]"`
   - `git push origin main`
   - **RE-READ `_tasks/roadmap-features-v4.md`** for the next sub-phase — do NOT rely on memory
   - Check Vercel deployment

4. **For DB migrations:**
   - Write migration SQL files to `supabase/migrations/032_*.sql` etc.
   - Include RLS policies on every new table
   - Include `ENABLE ROW LEVEL SECURITY` on every new table
   - Do NOT run migrations — just create the files. User will apply manually.

5. **Critical rules:**
   - All new props MUST be optional (unless stated otherwise)
   - All new pages MUST have German UI text (this is a German-Swiss platform)
   - Never delete existing functionality — only add or enhance
   - Every new feature MUST have its UI entry point (button, page, or nav item) in the SAME phase
   - Every new component MUST use Tailwind classes from `tailwind.config.js`
   - Use `lucide-react` for ALL icons — no emoji icons in production UI

6. **If a build fails:** Fix it before moving on. Never skip a broken build.

7. **If you're unsure about a decision:** Check the roadmap's DO/DON'T blocks. If still unsure, ask the user.

8. **After ALL 14 phases:**
   - Open browser, check every new page visually
   - Run `npx lighthouse https://www.solen.ch/de/ --output=json` (perf > 70, a11y > 90)
   - Test: anon → login → customer profile → salon dashboard → admin panel
   - Test: book single service → book multi-service → guest checkout → success confetti
   - Test: chat → send image → price offer → accept → upcharge → dispute
   - Fix minor UI bugs immediately
   - Major issues → STOP and ask user

## Start

Read `_tasks/roadmap-features-v4.md` Phase 1 section now. Begin with sub-phase 1.1 (Auth Guards).
