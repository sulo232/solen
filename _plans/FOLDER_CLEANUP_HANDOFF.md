# HANDOFF , the two "solen" folders + safe cleanup plan

**Created:** 2026-07-24. **Why:** owner confused by two `solen` folders; wants the old one renamed + everything clean, WITHOUT losing any principle/design/taste files, hooks, or gates. Context got heavy, so this file carries the full picture to a fresh session. Self-contained: a new session can act on this without re-investigating.

---

## TL;DR for the owner
- Your real project is **`/Users/sulo/Documents/solen`** (git, updated daily). Use only this.
- **`/Users/sulo/solen`** is an old, non-git, pre-Next.js copy from 2026-04-30, PLUS your live `screenshots/` folder.
- **Verified: NONE of your design/taste/principle/hooks/gates work is in the old folder.** It is 100% safe from renaming the old folder. Nothing valuable gets lost.
- The only care needed: the old folder holds your **screenshots** (679MB, actively used) which several configs point to. Move those to a stable home first, then the old code can be renamed/removed.

---

## VERIFIED FACTS (measured 2026-07-24, not guessed)

### The real project , `/Users/sulo/Documents/solen`
- Git repo, branch `main`, last commit `b2ec1af72` (2026-07-22, "law(meta): design-law integrity gate"). ~20GB.
- `_design-system/` = **130 files** (SOURCE.md, LOCKFILE.md, TASTE_LOG.md, 50+ component specs, principle/taste docs). Newest 2026-07-21.
- Project hooks/gates: `.claude/hooks/` = **28 files**.
- All recent taste/principle/law work is git-tracked here (commits: the pairs book, THE 50 principle canon, the like/dislike walk, design-law integrity gate, etc.).

### The global layer , `/Users/sulo/.claude/` (OUTSIDE both solen folders)
- Global hooks/gates: `~/.claude/hooks/` = **144 files**. These are NOT inside either solen folder. Renaming `~/solen` cannot touch them.
- Global settings: `~/.claude/settings.json`.

### The old copy , `/Users/sulo/solen`
- **NOT a git repo** (no `.git`). ~1.5GB. Code last edited **2026-04-30**.
- Contains a `src/` = the old **Vite/React SPA** version of Solen (pre-Next.js rewrite). Dead/superseded.
- Has its own `CLAUDE.md` + `.claude/settings.json` + `.claude/launch.json` (empty `worktrees/`). **This is the trap**: launching Claude from here loads the old config and acts like the real project.
- **Confirmed ZERO valuable work here:** no `_design-system/`, no `.claude/hooks/`, no taste/principle/LOCKFILE/RATIONALE files anywhere.
- Has its own `.env.local` (secrets) , verify it matches new before any deletion.

### What is UNIQUE to old `~/solen` (not in the new project)
| item | size | verdict |
|---|---|---|
| `screenshots/` | 679 MB | **KEEP , actively used** (newest 2026-07-23). Owner's phone screenshots + feedback notes. |
| `_prompts/` | 376 KB | old build-session prompts. Rescue (harmless history). |
| `braids-tiktok-links.txt` | 8 KB | unique small data file. Rescue. |
| `src/` | 600 KB | old Vite app. Dead. |
| sentry configs, `vercel.json`, old `tsconfig.*`/`eslint.config.js` | tiny | old setup, superseded. |

### Everything that REFERENCES the old path `/Users/sulo/solen` (what a naive rename breaks)
1. `~/.claude/settings.json` line 18: `"/Users/sulo/solen/screenshots"` , NEEDED (screenshots access).
2. `~/.claude/settings.json` line 19: `"/Users/sulo/solen"` , **too broad**; whitelists the whole dead folder for writing. This is the "a session could write to the dead folder" hole.
3. `~/Documents/solen/CLAUDE.md` line 207: documents the screenshots path `/Users/sulo/solen/screenshots/`.
4. `~/Documents/solen/CLAUDE.md` line 209: note that screenshots live outside the project.

(A session works in ONE folder = the one it's launched from. It never edits "both" at once. The real risks are only #2 above and the old folder's own CLAUDE.md trap.)

---

## THE PLAN (atomic , do in order)

### Phase A , SAFE + reversible
- [ ] A1. Rescue the two tiny unique files into the new repo: copy `~/solen/_prompts/` and `~/solen/braids-tiktok-links.txt` into `~/Documents/solen/_archive/from-old-solen/`. (Additive copy, destroys nothing.)
  - **BLOCKED from a sandboxed worktree session (measured 2026-07-24):** `mkdir` under `~/Documents/solen/_archive/` returns `Operation not permitted` (SANDBOX_RUNTIME=1). Bash writes there are sandbox-denied from this worktree. RUN THIS FROM A NORMAL session opened directly in `~/Documents/solen` (where `cp` works). NOT URGENT: the files are safe sitting in `~/solen` and are only a prerequisite for the destructive Phase D, which is owner-gated anyway.
- [x] A2. **DONE (verified 2026-07-24):** key-diff of old vs new `.env.local` came back EMPTY , the new `.env.local` already contains every key the old one has. Nothing secret is unique to the old folder.

### Phase B , screenshots relocation (BLOCKED on owner decision B0)
- [ ] B0. **DECISION (owner):** where should screenshots permanently live? Options:
  - (A) new stable home outside any project, e.g. `~/solen-screenshots/` (recommended , cleanest separation).
  - (B) inside the project, e.g. `~/Documents/solen/_screenshots/`.
  - (C) leave them at `~/solen/screenshots` and DON'T rename the parent (then only neutralize the trap + tighten whitelist).
- [ ] B1. Move `~/solen/screenshots/` to the chosen home.
- [ ] B2. Update the reference in `~/.claude/settings.json` line 18 to the new path.
- [ ] B3. Update `~/Documents/solen/CLAUDE.md` lines 207+209 to the new path.
- [ ] B4. Update the memory file `feedback_...`/CLAUDE.md screenshot-folder mentions if any.

### Phase C , tighten the whitelist (config change; likely needs owner / update-config skill)
- [ ] C1. In `~/.claude/settings.json`, remove line 19 `"/Users/sulo/solen"` (keep only the screenshots path). Closes the "could write to dead folder" hole.
  - **MEASURED BLOCKED (2026-07-24):** write-probe (`open(...,'a')`) on `~/.claude/settings.json` raised `PermissionError: Operation not permitted` under SANDBOX_RUNTIME=1. A sandboxed Claude session CANNOT apply this edit. Owner applies it by hand, or via the `update-config` skill / an interactive non-sandboxed session.

### Phase D , retire the old code folder (DESTRUCTIVE , explicit owner ok per step)
- [ ] D1. After A+B+C, rename `~/solen` -> `~/solen-OLD-vite-DELETE-ok` (reversible) OR neutralize its `CLAUDE.md` + `.claude/` so it can never be mistaken for the project.
- [ ] D2. (Optional, frees ~1.5GB, IRREVERSIBLE) delete the old folder once the owner confirms nothing unique remains. Needs explicit "yes delete".

---

## OWNER DECISIONS OUTSTANDING (the only real blockers)
1. **B0 , screenshots' permanent home** (A `~/solen-screenshots/`, B in-project, or C leave + don't rename). Everything downstream depends on this.
2. **D , rename vs delete** the old code folder (rename = safe/reversible; delete = frees space, irreversible).
3. **C1 settings edit** likely can't be applied from a sandboxed session (`~/.claude/settings.json` is write-denied) , owner applies, or via `update-config` skill.

## HARD CONSTRAINT (owner, verbatim intent)
Do NOT lose or waste the principle/design/taste files, hooks, or gates. , **Already proven safe:** all of that lives in `~/Documents/solen` (130 design files, 28 project hooks) + `~/.claude/hooks` (144 global hooks). The old `~/solen` has none of it. Renaming/removing the old folder cannot touch any of it.
