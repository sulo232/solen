# Claude Code Execution Prompt for Filter Pills Roadmap

Please verify the following prompt looks good and paste it into Claude Code:

```text
Follow the multi-agent coordination protocol in `CLAUDE.md`. Create a lock in `.agent-lock.json` and note your intent in `.agent-comms.md`.

Execute `_roadmaps/roadmap-filter-pills-A-infrastructure.md`.
Read the entire file first, especially the `UI_RULES.md` references. Pay extremely close attention to the `> ⚠️ BE CAREFUL:` blocks and the `✅ DO / ❌ DON'T` examples.

Execute the phases STRICTLY one by one.
For Phase 1 through 6, you must run `npm run build` and `npx tsc --noEmit` after EVERY phase.
Do not proceed to the next phase until the build passes.
Make a git commit exactly as specified in the roadmap at the end of every phase.

Do NOT run Roadmap B yet. Wait for my confirmation after Roadmap A is fully committed and deployed.
```

**Once Roadmap A is verified and deployed, use this prompt for Roadmap B:**

```text
Follow the multi-agent coordination protocol in `CLAUDE.md`. Create a lock in `.agent-lock.json` and note your intent in `.agent-comms.md`.

Execute `_roadmaps/roadmap-filter-pills-B-integration.md`.
Read the entire file first. You MUST verify the `zone` prop is correct for every page you touch according to the instructions.

Execute the phases STRICTLY one by one.
You must run `npm run build` after EVERY phase. Do not skip this step under any circumstances.
If the build fails, stop and fix it before committing.
Make a git commit exactly as specified in the roadmap at the end of every phase.

When ALL phases are done, list out the 4 verification curl tests specified in the Final Smoke Test section to prove success.
```
