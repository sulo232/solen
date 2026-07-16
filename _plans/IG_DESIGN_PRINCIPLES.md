# IG design-principles harvest (owner ask 2026-07-16)

Owner: watch EVERY video of given Instagram profiles, extract the design principle(s) each teaches, compile ONE detailed principles document. More profiles will follow (loopable pipeline). First profile: https://www.instagram.com/designparser (user id 78062220233, 116 posts, all videos, public).

## NO LOGIN NEEDED (owner said "I dont wanna log in", 2026-07-16) - CORRECTED
Earlier "download blocked" was true ONLY for yt-dlp's extraction path. The direct
private feed API (`/api/v1/feed/user/{id}/`) answers ANONYMOUSLY with a bootstrapped
csrftoken + app-id, returning items WITH video_versions whose CDN urls also download
anonymously. verified 2026-07-16:
  - anon video download OK: reel DavIo74DaTK -> valid 28.67s MP4, 667KB (ffprobe).
  - anon pagination OK: feed API page 1+2 returned items + next_max_id + more=True.
Owner needs to do NOTHING. Only catch: Instagram RATE-LIMITS anonymous feed calls by
IP (401 after a burst; web_profile_info stays 200). So the harvest is PATIENT +
checkpointed (escalating 30->300s cooldowns, per-page checkpoint, resumable) and runs
in the BACKGROUND across rate windows. This is a transient wait, not an owner blocker.

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

### Pipeline rebuilt for ANONYMOUS operation (no login) + whisper ready
- [x] Rewire enumerate to anonymous (bootstrap csrf + app-id, no cookie needed) `verified: scripts/ig-harvest/enumerate.py:20 IG client, resolve_user_id anon`
- [x] Make it throttle-resilient (wait out IP rate-limit, don't give up) `verified: enumerate.py:56 get_json deadline 90min, unlimited 401 retries, session refresh`
- [x] Checkpoint enumeration (resume across rate windows) `verified: enumerate.py:96 _enum_ckpt.json per-page save + resume`
- [x] Download re-resolves expired CDN urls via media-info endpoint `verified: harvest.sh:35 fresh_url(pk) fallback`
- [x] Install transcriber (faster-whisper, project-local venv, sandbox-writable) `verified: ./.venv/bin/python -> faster_whisper 1.2.1 OK; transcribe.py:1`
- [x] Wire stage 4 to the project venv `verified: harvest.sh:75 $ROOT/.venv/bin/python transcribe.py`
- [x] Build the analysis-input assembler (caption+transcript+frame paths per video) `verified: build_analysis_input.py:1`

### IN PROGRESS via tracked background harvest b8mf3xzyp (NOT owner-blocked; a transient rate-limit wait)
- [ ] Enumerate all 116 posts into manifest.json  RUNNING: b8mf3xzyp, patiently waiting out IP throttle (got count=116; feed API 401 cooling down, resumes on window reset)
- [ ] Download all videos throttled  QUEUED: harvest.sh stage 2 after enumerate
- [ ] Extract frames per video  QUEUED: harvest.sh stage 3 (ffmpeg scene+interval)
- [ ] Transcribe audio  QUEUED: harvest.sh stage 4 (whisper ready)
- [ ] Per-video principle extraction (frames+transcript+caption) via Workflow subagents (sonnet, delegate-media-read law)  QUEUED: run on resume once media lands, args from build_analysis_input.py
- [ ] Compile the single detailed principles document (dedupe, group by theme, per-video source links)  QUEUED: synthesis stage of the analysis workflow
- [ ] Deliver as served visual page (Wrong/Right + plain English) with tunnel link  QUEUED: after doc compiled
- [ ] Deliver the doc file alongside  QUEUED: after doc compiled

## Parked / notes
- Owner said "I dont wanna log in" -> pipeline is fully anonymous now; owner does nothing.
- Cost of anonymous: IG rate-limits by IP, so the harvest is slow (patient cooldowns). My own feasibility testing burned the budget, so it starts hot; resumes as the window clears. Runs in background, resumable, no data lost on interruption.
- Owner will send more profiles; harvest.sh is profile-agnostic (`./harvest.sh <username>`).
- Honest scope flag given to owner: 116 videos != 116 distinct principles; expect ~40-70 deduped principles with multiple video sources each (owner can override to strict 1-per-video).
