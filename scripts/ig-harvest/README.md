# ig-harvest

Profile-agnostic pipeline that turns an Instagram creator's videos into a
design-principles document. Built for the owner's "watch every video, extract
the principle each teaches, compile one detailed doc" ask (2026-07-16), and
made rerunnable because more profiles follow.

## What it needs (the one blocker)
A **logged-in** Instagram cookie export in Netscape format containing
`sessionid` + `ds_user_id`. Instagram killed anonymous pagination and anonymous
media responses, so the pre-login cookies (csrftoken/datr/ig_did/mid) are not
enough. Export with the "Get cookies.txt LOCALLY" browser extension while
signed in to instagram.com, save to
`/Users/sulo/solen/screenshots/instagram-cookies.txt`.

The harness `grep`s for `sessionid` and refuses to run without it (proven exit 2).

## Run
```
./harvest.sh <username> [cookies.txt]        # e.g. ./harvest.sh designparser
```
Every stage is idempotent and skips work already on disk, so a rate-limit
interruption is safe to resume by just re-running.

## Stages
1. **enumerate.py** - paginate `/api/v1/feed/user/{id}/` -> `data/<user>/manifest.json`
   (shortcode, caption, signed video url, counts, taken_at).
2. **download** - fetch each video (signed CDN url first, yt-dlp+cookies fallback),
   throttled 3-8s per item + a 25-45s pause every 15 to protect the account.
3. **frames** - ffmpeg scene-cut + interval sampling, ~24 frames/video, 640px wide.
4. **transcribe** - mlx-whisper (`~/.venvs/ig-harvest`) -> `transcripts/<code>.txt`.
5. **extract** (Claude/Workflow) - per video: frames + transcript + caption ->
   the design principle(s) it teaches.
6. **compile** (Claude/Workflow) - dedupe + group by theme -> one detailed doc
   + served visual page.

## Stage-4 setup (transcription)
```
python3 -m venv ~/.venvs/ig-harvest
~/.venvs/ig-harvest/bin/pip install mlx-whisper
```
Without it, stage 4 writes a "transcript pending" note and the rest still runs
(captions + frames alone already carry most principles for this creator).

## Account safety
Human pacing is built in. On any rate-limit / checkpoint response the operator
should stop and re-auth rather than hammer the session; stages are resumable.
