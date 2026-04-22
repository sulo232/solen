# Claude Design — Research Report

> Compiled 2026-04-21 from Anthropic's official announcement, the Claude Help Center, and secondary press coverage. Every factual claim below is footnoted to a source in §9. Where public information is missing or contradictory, the fact is marked **[unverified]** and listed in §8.

---

## 1. What Claude Design IS

Claude Design is an **Anthropic Labs product** launched 17 April 2026 at `claude.ai/design`, powered by **Claude Opus 4.7** (Anthropic's vision-capable frontier model). It is a specialised visual workspace — distinct from Claude Chat and Claude Code — where a user describes a design in natural language and Claude produces an interactive, editable output (prototypes, wireframes, slide decks, one-pagers, marketing collateral, code-powered prototypes). Refinement happens on-canvas via chat, inline comments, direct text edits, and slider "knobs" for spacing/color/layout. It is positioned for **founders, PMs, and engineers without a design background** who need to go from idea → shareable visual quickly, with a clean handoff path to Claude Code for implementation or Canva for further editing. [1][2][3]

---

## 2. How it works — input / output model

**Accepted inputs:**
- Text prompts [1]
- Image / screenshot uploads (existing designs, competitor products, inspiration) [2]
- Documents: DOCX, PPTX, XLSX [1]
- Web capture tool (elements from live websites) [1]
- A linked **code repository** — Claude reads components, architecture, and styling patterns to build an internal design system [2][3]
- Claude reads your codebase + design files **during onboarding** to extract colors, typography, components, and apply them to every subsequent project [1][3]

**Outputs / exports:**
- Live interactive canvas inside claude.ai/design
- Shareable org-scoped URL (view, comment, or edit access) [1]
- **PDF**, **PPTX**, **standalone HTML**, **ZIP** [1][2]
- **Canva** export (becomes fully editable/collaborative there) [3]
- **Claude Code handoff bundle** — a one-click package the user passes to Claude Code (local agent or web) for production code generation [1][2]

Claude Design **does not output a Figma file**; interop with Figma is not listed in the official sources. **[unverified]**

**Distinct from Chat / Code:**
- vs. **Claude Chat** — Chat is a general text conversation; Claude Design has a persistent design canvas, a project-wide design system memory, inline comments, and on-canvas adjustment controls. [1]
- vs. **Claude Code** — Code writes and edits a real repo in your terminal / IDE. Claude Design stops at a visual artefact plus a handoff bundle; implementation is explicitly delegated to Claude Code. [1]

---

## 3. GitHub + upload mechanics (critical for Solen)

This is the section with the **thinnest official documentation** — most answers below are partial.

- **How linking works:** You "link a code repository so Claude understands your existing components, architecture, and styling patterns." [2]
- **What it reads:** Help Center says the link lets Claude understand "components, architecture, and styling patterns" but **does not enumerate which file types or paths it actually ingests**. **[unverified]**
- **Scope control:** Official guidance is "very large repositories may cause performance issues; linking **subdirectories is recommended**." [2] — so the integration is path-scopable.
- **Re-fetch vs cache:** Not documented publicly. **[unverified]**
- **Upload-vs-GitHub conflict priority:** Not documented publicly. **[unverified]**
- **Design system extraction:** During onboarding Claude scans your codebase + design files and locks in **colors, typography, and components** as a project design system that auto-applies to new designs — the mechanism most relevant to Solen. [1][3]

Practical read: treat the GitHub link like a context snapshot, scope it to the folder containing your design tokens + a representative component folder (not the whole monorepo), and expect to re-prompt tokens if results drift.

---

## 4. Iteration + memory model

- **Conversational, like Chat** — yes; refinement is multi-turn. [1]
- **Two refinement surfaces:** (a) chat for broad structural / aesthetic shifts, (b) inline comments on specific elements for targeted tweaks, plus direct text editing and "adjustment knobs" (spacing, color, layout sliders). [1][2]
- **Variations / branching:** Officially recommended pattern is "Save what we have and try a completely different approach" — i.e. manual fork-by-save rather than a built-in version tree. [2]
- **Project-level memory:** The onboarding-extracted design system **does persist across designs within a project/org**. [1][3]
- **Session-to-session chat memory:** **[unverified]** — the Help Center does not state whether prior conversation context carries over between sessions.
- **Iterating on live code from a GitHub link:** The link informs design generation, but Claude Design does not write back to the repo. The write path is: Claude Design → handoff bundle → Claude Code → repo. [1]

---

## 5. Limitations (quantified where possible)

**Access:**
- Research preview, gradual rollout from 17 April 2026. [1]
- **Pro, Max, Team, Enterprise only.** Free tier excluded. [1][4]
- Enterprise: **off by default**, admin must enable. [2][4]

**Quota:**
- Claude Design has its **own weekly allowance**, separate from Chat and Claude Code quotas — it does not share the pool. [4]
- Numeric weekly allowance per tier is **not published**; tiers are described qualitatively (Pro = one-off use, Max 5x = semi-regular PM/engineer mock-ups, Max 20x = power designers). [4] **[unverified — exact numbers]**
- **One quantified datum:** Enterprise usage-based customers get a one-time credit of "approximately 20 typical prompts" per seat, expiring 17 July 2026. [4]
- Extra usage is purchasable as an add-on. [1][4]

**File-size / upload limits:** Not published. **[unverified]**

**Documented rough edges (from the Help Center troubleshooting):**
- Inline comments occasionally disappear before processing
- "Compact layout" mode can trigger save errors
- Large codebases cause lag → link subdirectories
- Some chat errors require opening a new tab to recover [2]

**What it does not do well / pitfalls:**
- Very large repo context degrades results (performance, drift) [2]
- Vague aesthetic feedback ("make it cleaner") performs worse than precise ("tighten spacing to 8 px", "use token `coral-500`") [2]
- No native Figma write-back. **[unverified]** for Figma read.

---

## 6. Best practices for design-system-heavy projects (like Solen)

Synthesised from Help Center guidance [2] and the announcement [1]:

1. **Link a subdirectory, not the monorepo.** For Solen, point at something like `components/ui/` + the Tailwind config + `_tasks/SOLEN_DESIGN.md` rather than the full repo.
2. **Prime with the design doc.** Upload `SOLEN_DESIGN.md` and `public/solen-coral.html` on the first message — these are your declarative tokens + living reference.
3. **Reference tokens by name** (`coral #E8624A`, "Bebas Neue", "1:1 square cover") in prompts. Vague prompts let Claude invent new tokens.
4. **First message = system + one concrete task.** "Here is our design system (file). Produce variation A of the salon card using *only* these tokens, 1:1 cover, Bebas Neue H1." Avoid open-ended "design our homepage."
5. **Iterate in two modes:** chat for layout restructuring, inline comments for token-level fixes.
6. **Fork before risky changes:** "save and try a different approach" — there is no version tree. [2]
7. **Handoff, don't copy-paste code.** Use the Claude Code handoff bundle so tokens round-trip into real components. [1]
8. **Resume sessions by re-uploading the design doc.** Session memory persistence is unverified, so treat each new session as cold; the project-level design system extracted at onboarding is the one thing you can rely on carrying over. [1][3]
9. **Google Fonts (Bebas Neue / Syne / DM Sans):** Claude Design can render HTML exports, so Google Fonts load via standard `<link>`. Whether it actively loads custom fonts in the canvas preview is **[unverified]**.
10. **When to use which tool:**
    - **Claude Design** → new visual directions, PM-facing mock-ups, slide decks, pre-implementation exploration.
    - **Claude Code** → actually editing the Next.js repo (Solen's existing workflow).
    - **Figma** → if a human designer is in the loop or the Figma file (`cInKwtgkD8TjUSSLDT40eF`) is authoritative. Claude Design does not replace Figma round-trip today.

---

## 7. Pricing / quota model

| Tier | Claude Design access | Notes |
|---|---|---|
| **Free** | No [1][4] | Excluded from research preview |
| **Pro** | Yes [1] | "Quick explorations, one-off use" [4] |
| **Max 5x** ($100/mo) | Yes [1] | "Semi-regular use — PMs and engineers producing regular mock-ups" [4] |
| **Max 20x** ($200/mo) | Yes [1] | "Power use — designers and creatives" [4] |
| **Team** | Yes [1] | Standard / Premium seat types [4] |
| **Enterprise** | Yes, **off by default** [2][4] | Admin must enable; usage-based seats get ~20-prompt one-time credit expiring 2026-07-17 [4] |

- Claude Design usage is **separately metered** from Chat and Claude Code — it does **not** share the same weekly cap. [4]
- Weekly allowance resets every 7 days. [4]
- Beta rate limits, subject to change. [4]
- Numeric allowances per tier not publicly disclosed. **[unverified]**

---

## 8. Unknowns flagged

The following questions have no public, verifiable answer as of 2026-04-21:

1. Exact file types ingested when a GitHub repo is linked (only "components, architecture, styling patterns" stated)
2. Whether linked GitHub is re-fetched per session or cached
3. Conflict-resolution priority between uploaded files and linked GitHub
4. Upload file-size limits
5. Max iterations per session
6. Whether conversational context persists across sessions (project design system does; chat history persistence is not documented)
7. Numeric weekly quota per tier (Pro, Max 5x, Max 20x, Team, Enterprise)
8. Figma file import/export support
9. Whether custom Google Fonts render live in the canvas preview
10. Responsive preview capabilities (mobile vs desktop breakpoints) — not explicitly documented
11. How React hooks / Next.js patterns are represented in outputs (HTML export is confirmed; framework-idiomatic code output is not)
12. Rate-limit numbers beyond the qualitative tier descriptions

Recommend verifying 1, 2, 6, 7, 10 directly inside claude.ai/design before committing a workflow.

---

## 9. Sources

[1] Anthropic — *Introducing Claude Design by Anthropic Labs* (announcement): https://www.anthropic.com/news/claude-design-anthropic-labs
[2] Claude Help Center — *Get started with Claude Design*: https://support.claude.com/en/articles/14604416-get-started-with-claude-design
[3] TechCrunch — *Anthropic launches Claude Design, a new product for creating quick visuals* (2026-04-17): https://techcrunch.com/2026/04/17/anthropic-launches-claude-design-a-new-product-for-creating-quick-visuals/
[4] Claude Help Center — *Claude Design subscription usage and pricing*: https://support.claude.com/en/articles/14667344-claude-design-subscription-usage-and-pricing
[5] VentureBeat — *Anthropic just launched Claude Design*: https://venturebeat.com/technology/anthropic-just-launched-claude-design-an-ai-tool-that-turns-prompts-into-prototypes-and-challenges-figma
