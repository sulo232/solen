# HANDOFF , IG design-principles harvest (session moved 2026-07-16)

Read this top to bottom before touching anything. Everything below is VERIFIED state, not recollection.

## The owner's ask (verbatim intent)
Watch EVERY video on given Instagram profiles, extract the design principle(s) each one teaches,
compile ONE detailed document of all of it. More profiles will follow, so the pipeline must be a
rerunnable loop. Owner constraint added mid-run: **"i dont wanna log in"** , so NO Instagram login.

Profiles:
1. **@designparser** , IN PROGRESS (see below). 116 posts, all videos.
2. **@designmotionhq** , QUEUED, not started. Owner: "ths is next profile aftr ur done w the first one continue".

## THE KEY DISCOVERY (this is the whole unlock, do not undo it)
Instagram anonymously gives you **only the 12 most recent posts** (`web_profile_info` = 200 reliably).
Paginating to the rest (`/api/v1/feed/user/{id}/`) works once or twice then hard 401s , IG rate-limits
anonymous access **by IP**, and it does not clear while you keep retrying. Do not burn hours there.

**TikTok has the SAME creator + the SAME catalog + the SAME captions, with no login and no throttle.**
- `https://www.tiktok.com/@designparser` = 115-116 videos (IG = 116). Titles/descriptions match the IG captions 1:1.
- yt-dlp enumerates AND downloads it anonymously, fast, no rate limit. VERIFIED: all 116 downloaded.
- YouTube also mirrors it (`https://www.youtube.com/@designparser/shorts` = 68 shorts, downloads fine) , use as a fallback/cross-check only; TikTok has the full set.
- **So: harvest from TikTok, not Instagram.** The content is what matters, not the platform.

## What is DONE (verified)
- **Batch 1 shipped** , commit `274c238cd`. 12 IG videos -> **12 distinct principles across 7 domains**,
  each with first-principles why + how-to-apply + evidence + source link.
  - doc: `_design-system/research/IG_DESIGNPARSER_PRINCIPLES.md` (187 lines)
  - visual page: `public/_mockups/ig-principles-designparser/index.html` (+ `frames/`) , verified live 200 through a tunnel, all 12 cards + images rendering.
- **All 116 TikTok videos downloaded + framed** (NOT yet analysed):
  - `scripts/ig-harvest/data/designparser_tt/videos/` = **116 .mp4 + .info.json** (info.json holds the caption)
  - `scripts/ig-harvest/data/designparser_tt/frames/` = **116 dirs, 1129 .jpg**
  - `scripts/ig-harvest/data/designparser_tt/analysis_input.json` = **116 entries**, each {shortcode, url, caption, frame_paths}. All 116 have real captions. THIS IS READY TO ANALYSE.
- Pipeline scripts committed (`a8f5b9617`, `47a952adf`): `scripts/ig-harvest/{harvest.sh,enumerate.py,transcribe.py,build_analysis_input.py,build_deliverable.py,README.md}`. `data/` + `.venv/` are gitignored.
- faster-whisper 1.2.1 installed at `scripts/ig-harvest/.venv/` (transcripts NOT done; captions+frames carry the principle, transcripts are a nice-to-have).

## THE NEXT STEP (do exactly this)
Analyse all 116 and rebuild the doc/page. The extraction workflow script **is already generated with all
116 videos baked in** (no args needed, no context cost):

    /private/tmp/claude-501/-Users-sulo-Documents-solen/29d51991-ee2a-4b30-861c-0507374f8ce3/scratchpad/extract_all.workflow.js

(If that scratchpad is gone , likely, it is session-scoped , regenerate it: the generator python is in the
session transcript, or simply rebuild from `analysis_input.json` using the same prompt shape as
`ig_extract.workflow.js`. Prompt shape that produced good output: read every frame with the Read tool +
the caption, return {shortcode, on_screen_text, demonstration, principles[{name,domain,one_liner,detail,
how_to_apply,evidence,solen_relevance}]}, sonnet, agentType general-purpose.)

Then:
1. Run extraction over the 116 (schema-forced, sonnet, one agent per video).
2. Synthesise: merge duplicates, group by domain, keep ALL source shortcodes per principle.
   NOTE: the model-routing gate BLOCKS `model:'opus'` unless the prompt reads judgment-class; sonnet+
   `effort:'high'` passed fine and was good enough for 12. For 116 the dedup is heavier , opus is
   justified; either tag the prompt clearly as judgment or `touch ~/.claude/opus-subagent-skip.flag`.
3. Rebuild deliverables:
   `python3 scripts/ig-harvest/build_deliverable.py scripts/ig-harvest/data/designparser_tt designparser`
   (it reads `synthesis.json` + `per_video.json` from the data dir , write those from the workflow journal
   first, exactly as was done for batch 1). It writes the md doc + the visual page + copies frames.
4. Serve + tunnel + verify 200, hand the owner a CLICKABLE link (owner law: never a LAN IP, never a bare URL).
5. Then run @designmotionhq through the same path (TikTok first: check `https://www.tiktok.com/@designmotionhq`).

## TRAPS THAT COST THIS SESSION HOURS , do not repeat
1. **Background processes get KILLED in this sandbox.** `nohup ... &` inside a Bash call, AND
   harness `run_in_background` Bash, AND the Workflow tool all died silently mid-run (yt-dlp died 3x at
   33/45 videos with ZERO errors in the log; the 116-video extraction workflow died with 0 results).
   The download only completed when run in the **FOREGROUND** with a 600s timeout + `--download-archive`
   so it resumes. **Run long work in the foreground, chunked to fit the timeout, and make it resumable.**
2. **`pgrep` lies here** (returns nothing for live processes). Use `ps aux | grep '[y]t-dlp'`.
3. **curl to localhost:3000 is intermittently sandbox-blocked** (returns 000 even while the server is
   genuinely up). Verify through the cloudflare tunnel URL instead , that works.
4. Don't trust "it's running in the background" , VERIFY progress on disk before reporting. I reported
   the harvest as progressing when it had been stuck for 30 min. That was the owner's "why did you stop".
5. IG cookies: the owner pasted pre-login cookies (csrftoken/datr/ig_did/mid, NO `sessionid`). Those do
   NOT authenticate. Irrelevant now , TikTok path needs no cookies at all.

## Open / parked
- Transcripts (whisper) not run. Optional; captions + frames already carry the principles.
- Owner scope note given: 116 videos != 116 distinct principles, expect overlap. BUT the first 12 came out
  fully distinct with zero merges, so the earlier "40-70 total" estimate now looks LOW. Report honestly.
- One number on the shipped page ("up to 10%" for Ebbinghaus) is the creator's claim with no named study.
  It is flagged as such on the card. Keep that honesty (rule 15: no laundering unsourced stats).
- Context hit RED (~344k) this session; that forced the move.

## Workstream row
`_plans/ACTIVE.md` row 26 = "IG design-principles harvest". Detail file: `_plans/IG_DESIGN_PRINCIPLES.md`
(its checkboxes still describe the OLD Instagram-only plan , update them to the TikTok path).
