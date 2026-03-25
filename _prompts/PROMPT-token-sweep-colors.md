# Color Palette Token Sweep — Claude Code Execution Prompt

## Instructions

1. **Read these files FIRST before any code changes:**
   - `CLAUDE.md` (all rules, especially Section 10 + Section 13)
   - `_rules/UI_RULES.md` (design system rules, particularly Section 20 on Banned Tokens)
   - `_roadmaps/roadmap-token-sweep-colors.md` (the full execution roadmap)

2. **Execute both phases** from `_roadmaps/roadmap-token-sweep-colors.md` in order.

3. **After EVERY phase:**
   - Run the custom `grep` commands specified in the roadmap to verify no banned hex codes remain.
   - `npm run build` — MUST pass before committing.
   - `git add [specific files]` — only stage files from that phase.
   - `git commit -m "phase N: [description]"` — one commit per phase.
   - `git push origin main`
   - Verify the Vercel deployment didn't fail.

4. **Critical rules:**
   - **DO NOT** use any of the Banned Tokens: `#00A19C`, `#F59E0B`, `#6B7280`, `#0F0F0F`, `#1A1A1A`, `#2D2D2D`, `#E5E7EB`.
   - All primary CTAs (like "Partner werden") must use `bg-s-coral text-white`.
   - Dark mode backgrounds must use warm variants like `bg-s-dm-bg` or `bg-s-dm-surface`, NEVER cold ones like `bg-[#0F0F0F]`.
   - All yellow elements (Stars/Badges) must use the official `s-yellow` tokens.
   - Use `border-s-ink/10` and `text-s-ink/50` for subtle/muted boundaries and texts.
   
5. **File lock:** Check `.agent-lock.json` before working to ensure no other agents are modifying the same paths. Add your lock if clear.

## Phase Summary

| Phase | Goal | Key Action |
|---|---|---|
| 1.1 | Teal & Wrong Orange Replacements | Fix "Partner werden" and other occurrences of Teal/Orange to `s-coral`/`s-amber`. |
| 1.2 | Footer & Dark Background Compliance | Replace cold dark `#0F0F0F`/`#1A1A1A` with warm dark mode tokens (`bg-s-dm-surface`). |
| 1.3 | Unify Warning and Rating Yellows | Standardize `#F59E0B` to use the official V3 `s-yellow` scheme. |
| 1.4 | Unify Muted Text & Borders | Convert `#6B7280` and `#E5E7EB` to `text-s-ink/50` and `border-s-ink/10`. |
| 2   | Verification & Certification | Run the grep string from Master Lint to guarantee zero violations, then build and push. |

## Start

Begin with Phase 1.1. Open `_roadmaps/roadmap-token-sweep-colors.md` and read the Phase 1.1 instructions now.
