# IG design-principles harvest (owner ask 2026-07-16)

Owner: watch EVERY video of given Instagram profiles, extract the design principle(s) each teaches, compile ONE detailed principles document. More profiles will follow (loopable pipeline). First profile: https://www.instagram.com/designparser (user id 78062220233, 116 posts, all videos, public).

## THE BLOCKER (concrete, owner-owned): logged-in cookies
The cookies the owner pasted (csrftoken, datr, ig_did, mid) are PRE-LOGIN cookies.
They lack `sessionid` + `ds_user_id`. Empirically re-tested this turn: video
download still returns Instagram's "empty media response" error (verified: yt-dlp
run with `--cookies instagram-cookies.txt` on reel DavIo74DaTK, same failure as
anonymous). Need a re-export done WHILE SIGNED IN to instagram.com.
Nothing downstream (enumerate 116 / download / frames / transcribe / analyze /
compile / deliver) can run until that file has `sessionid`. This is a credential
only the owner can provide => a legitimate hard stop, not a checkpoint.

## Feasibility findings (2026-07-16, verified this session)
- verified: profile is public, 116 posts all videos, full captions readable anon
  (curl web_profile_info 200, 12 edges w/ captions dumped, count=116).
- verified: anonymous pagination BROKEN (GraphQL query_hash e769aa13 -> "Incorrect
  Query" / status fail) and anonymous + pre-login-cookie video download BLOCKED
  (yt-dlp "empty media response" on reel DavIo74DaTK, both runs).
- verified: pasted cookie file has NO sessionid/ds_user_id (grep returned nothing).
- Tools present: yt-dlp 2026.03.17, ffmpeg 8.1. whisper NOT yet installed (deferred
  to stage 4; venv step documented in README).

## Batch checkboxes (atomized)
### Answered / built this turn
- [x] Probe anonymous access (profile JSON / pagination / video download / embed) `verified: curl web_profile_info=200 count=116; GraphQL page2="Incorrect Query"; yt-dlp reel=empty media response`
- [x] Report feasibility + exactly what's needed to owner `verified: prior turn message + this file`
- [x] Re-test the owner's pasted cookies empirically (not from memory) `verified: harvest.sh guard exit 2 "no sessionid"; yt-dlp --cookies still empty-media-response`
- [x] Build enumerate stage (full 116 pagination) `verified: scripts/ig-harvest/enumerate.py:1 (private feed api, sessionid guard, manifest.json)`
- [x] Build download stage (throttled, human-paced) `verified: scripts/ig-harvest/harvest.sh:32 (3-8s/item + 25-45s every 15, CDN-then-yt-dlp fallback)`
- [x] Build frames stage (ffmpeg scene + interval sampling) `verified: scripts/ig-harvest/harvest.sh:57 (scene>0.30 + fps fallback, cap 24)`
- [x] Loopify: rerunnable per-profile pipeline `verified: scripts/ig-harvest/harvest.sh:1 (./harvest.sh <username>), README.md, idempotent resumable stages`
- [x] Self-test the sessionid guard (build-then-integrate law) `verified: ran harvest.sh w/ pre-login cookies -> exit 2, clean reject, no crash`

### BLOCKED on the cookie file above (concrete named blocker, cannot proceed)
- [ ] Enumerate all 116 posts into manifest.json  BLOCKED: needs sessionid (enumerate.py:load_cookies aborts without it)
- [ ] Download all videos throttled  BLOCKED: needs sessionid (media response empty otherwise, verified)
- [ ] Extract frames per video  BLOCKED: depends on downloaded videos
- [ ] Transcribe audio (install mlx-whisper in ~/.venvs/ig-harvest, then run)  BLOCKED: depends on downloaded videos
- [ ] Per-video principle extraction (frames + transcript + caption) via Workflow subagents (sonnet, delegate-media-read law)  BLOCKED: depends on frames+transcripts
- [ ] Compile the single detailed principles document (dedupe, group by theme, per-video source links)  BLOCKED: depends on extraction
- [ ] Deliver as served visual page (Wrong/Right + plain English) with tunnel link  BLOCKED: depends on compiled doc
- [ ] Deliver the doc file alongside  BLOCKED: depends on compiled doc

## Parked / notes
- Owner will send more profiles after this one; harvest.sh is profile-agnostic (one arg).
- Honest scope flag given to owner: 116 videos != 116 distinct principles; expect ~40-70 deduped principles with multiple video sources each (owner can override to strict 1-per-video).
- Account-safety pacing built into stage 2; stop on any rate-limit/checkpoint, stages resume.
- Whisper venv install failed once this turn (exit 127); deferred, not on the critical path (captions+frames carry most principles). Re-do per README when stage 4 runs.
