# Claude Code Execution Prompt

```text
Please execute the roadmap located at `_roadmaps/roadmap-v3-typography-sweep.md`.

This is a High-Accuracy UI and Typography audit. You must follow the exact instructions in `CLAUDE.md` and complete every single Phase sequentially.

CRITICAL INSTRUCTIONS:
1. Start by reading `_rules/UI_RULES.md` specifically sections 6 (Layout Specifics) and 19f (Strict Font Scaling).
2. Follow the roadmap explicitly phase by phase. Do NOT combine the phases into one mega-commit. You must `git commit` at the end of every individual phase using the commit messages listed in the exact verification steps.
3. For Phase 1, ensure you use `grep` to accurately locate where inputs and body text styles are being overridden.
4. For Phase 3, pay aggressive attention to `object-cover` and `aspect-[3/2]` / `aspect-square`. The goal is to make all images crop cleanly exactly like a profile picture (pfp) instead of ever stretching.
5. At the end of every phase, run `npm run build` as mandated by Rule 4 in `CLAUDE.md`. If it fails, fix it before moving on.
6. When all 4 phases are complete, run the full Post-Execution Smoke Test at the bottom of the roadmap.

You may begin with Phase 1 now.
```
