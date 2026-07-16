#!/usr/bin/env bash
# IG design-principles harvester - profile-agnostic, rerunnable.
# Loop usage (owner sends more profiles): ./harvest.sh <username> [cookies.txt]
#
# Stages (each idempotent, skips work already on disk):
#   1 enumerate  -> <out>/manifest.json      (needs logged-in cookies)
#   2 download   -> <out>/videos/<code>.mp4  (throttled, human-paced)
#   3 frames     -> <out>/frames/<code>/*.jpg
#   4 transcribe -> <out>/transcripts/<code>.txt
# Stage 5 (per-video principle extraction) + stage 6 (compile doc) are driven
# by Claude via the Workflow tool, reading this dir's manifest + frames + transcripts.
set -euo pipefail

USER="${1:?usage: harvest.sh <username> [cookies.txt]}"
COOKIES="${2:-/Users/sulo/solen/screenshots/instagram-cookies.txt}"
ROOT="$(cd "$(dirname "$0")" && pwd)"
OUT="$ROOT/data/$USER"
mkdir -p "$OUT/videos" "$OUT/frames" "$OUT/transcripts"

echo "== harvest $USER -> $OUT"
[ -f "$COOKIES" ] || { echo "no cookie file at $COOKIES"; exit 2; }
grep -q sessionid "$COOKIES" || { echo "FATAL: $COOKIES has no sessionid (not logged in)"; exit 2; }

# Stage 1: enumerate
if [ ! -f "$OUT/manifest.json" ]; then
  python3 "$ROOT/enumerate.py" "$USER" "$COOKIES" "$OUT"
else
  echo "  manifest.json exists, skipping enumerate"
fi

# Stage 2: download (throttled). Prefer signed CDN url from manifest; fall back to yt-dlp.
python3 - "$OUT" "$COOKIES" <<'PY'
import json, os, sys, time, random, subprocess, urllib.request
out, cookies = sys.argv[1], sys.argv[2]
m = json.load(open(os.path.join(out, "manifest.json")))
vids = [p for p in m["posts"] if p["is_video"]]
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")
for i, p in enumerate(vids, 1):
    code = p["shortcode"]; dst = os.path.join(out, "videos", f"{code}.mp4")
    if os.path.exists(dst) and os.path.getsize(dst) > 10000:
        continue
    url = p.get("video_url")
    ok = False
    if url:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=60) as r, open(dst, "wb") as f:
                f.write(r.read())
            ok = os.path.getsize(dst) > 10000
        except Exception as e:
            print(f"  [{i}/{len(vids)}] {code} cdn-fail: {e}")
    if not ok:  # signed url may have expired between enumerate and now -> yt-dlp
        subprocess.run(["yt-dlp", "--no-update", "--cookies", cookies,
                        "-o", dst, "--max-filesize", "80M",
                        f"https://www.instagram.com/reel/{code}/"], check=False)
        ok = os.path.exists(dst) and os.path.getsize(dst) > 10000
    print(f"  [{i}/{len(vids)}] {code} {'OK' if ok else 'FAIL'}")
    time.sleep(random.uniform(3, 8))          # per-item human pacing
    if i % 15 == 0:
        time.sleep(random.uniform(25, 45))    # batch pause every 15
PY

# Stage 3: frames (1 fps + scene cuts, capped ~24 frames/video)
for v in "$OUT"/videos/*.mp4; do
  [ -e "$v" ] || continue
  code="$(basename "$v" .mp4)"; fdir="$OUT/frames/$code"
  [ -d "$fdir" ] && [ -n "$(ls -A "$fdir" 2>/dev/null)" ] && continue
  mkdir -p "$fdir"
  ffmpeg -nostdin -loglevel error -i "$v" \
    -vf "select='eq(n\,0)+gt(scene\,0.30)',scale=640:-1" -vsync vfr \
    -frames:v 24 "$fdir/f_%02d.jpg" || true
  # guarantee at least evenly-spaced frames if scene detect yielded too few
  n=$(ls "$fdir" 2>/dev/null | wc -l | tr -d ' ')
  if [ "${n:-0}" -lt 4 ]; then
    ffmpeg -nostdin -loglevel error -i "$v" -vf "fps=1/2,scale=640:-1" \
      -frames:v 12 "$fdir/g_%02d.jpg" || true
  fi
  echo "  frames $code: $(ls "$fdir" | wc -l | tr -d ' ')"
done

# Stage 4: transcribe (mlx-whisper if present, else skip w/ a note)
WHISPER="$HOME/.venvs/ig-harvest/bin/python"
for v in "$OUT"/videos/*.mp4; do
  [ -e "$v" ] || continue
  code="$(basename "$v" .mp4)"; tx="$OUT/transcripts/$code.txt"
  [ -f "$tx" ] && continue
  if [ -x "$WHISPER" ] && "$WHISPER" -c "import mlx_whisper" 2>/dev/null; then
    "$WHISPER" -m mlx_whisper.transcribe --model mlx-community/whisper-small-mlx \
      "$v" --output-dir "$OUT/transcripts" --output-name "$code" 2>/dev/null \
      || echo "(transcribe failed)" > "$tx"
  else
    echo "(no whisper installed - transcript pending)" > "$tx"
  fi
done

echo "== done. manifest+videos+frames+transcripts under $OUT"
