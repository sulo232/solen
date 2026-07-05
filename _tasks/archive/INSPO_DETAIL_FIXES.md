<!-- exists-check: net-new plan doc. No existing Inspo-detail fix plan in _tasks/ (closest is the discovery audit under _design-system/_discovery-audit/, which is design not this bug/feature batch). -->
# Inspo detail + booking fixes , phased plan (2026-06-23)

Built autonomously from the 5-agent research sweep (`wf_555e4d19`). Each phase = one shipping unit, committed separately. Grounded in what EXISTS (no rebuilds).

## Findings that reframe the punch list
- **"Wrong images / wrong names"** = `PROOF_SALON_ITEMS` (3 hardcoded picsum items with fake salon names, prepended to the "Alle" feed). Real content exists now → remove them.
- **"See all salons / book jumps home"** = the routes (`/coiffeur`, `/nails`, `/spa`, `/salon/[slug]/booking`) are REAL pages (return 200). The jump-home was the pre-content state. Lashes/brows fall back to `coiffeur` (wrong) , map to `spa`.
- **"Similar broken"** = the API works; was broken because stock images weren't whitelisted (fixed).
- **"No Gemini explanation"** = `ensureAIData` skips items that already have a `style_name` (stock looks have one) → never analyzed. AND the prompt is 100% hair-centric (no nail/lash/brow specs). There IS a `/api/admin/discovery/backfill` route to re-run.
- **Book ↔ service** = booking already accepts `?service=<id>`; services table has NO style-granular names (generic "Haarschnitt"), so matching is fuzzy. `?note=` (cut instruction) already seeds.
- **"Search this look"** = `moreLikeThis` already links to `/inspo?search=<style>`; tags are static (not clickable). Infra fully exists.

## Phases
1. **Data + routing (no AI):** remove `PROOF_SALON_ITEMS`; map lashes/brows → `spa` (inspo/[id] + BookCTA); store Pexels `author_url`; graceful null-author.
2. **Search-from-look:** make detail tags clickable → search; surface the existing search link better.
3. **AI category-aware specs (the big one):** refactor `VISION_PROMPT` → per-category prompts (hair/beard/nails/lashes/brows); pass category to the analyze fns; backfill the catalogue via the existing backfill route.
4. **Book ↔ service match:** fuzzy-match look `style_name` → a salon service; pass `?service=` when matched, else keep `?note=`.
5. **Verify:** screenshots + endpoint tests across categories.

Category toggle (tap selected → Alle) already shipped (`89b1e1a9d`).
