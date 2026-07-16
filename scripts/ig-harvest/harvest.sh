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
COOKIES="${2:-}"   # OPTIONAL. Anonymous works; IG just rate-limits by IP.
ROOT="$(cd "$(dirname "$0")" && pwd)"
OUT="$ROOT/data/$USER"
mkdir -p "$OUT/videos" "$OUT/frames" "$OUT/transcripts"

echo "== harvest $USER -> $OUT"

# Stage 1: enumerate (anonymous, patient+checkpointed; cookies passed only if given)
if [ ! -f "$OUT/manifest.json" ]; then
  python3 "$ROOT/enumerate.py" "$USER" "$OUT" ${COOKIES:+"$COOKIES"}
else
  echo "  manifest.json exists, skipping enumerate"
fi

# Stage 2: download (throttled). Signed CDN url from manifest; on expiry, re-resolve
# a fresh url via the anonymous media-info endpoint (patient IG client).
python3 - "$OUT" "$ROOT" <<'PY'
import json, os, sys, time, random, urllib.request, urllib.error
out, root = sys.argv[1], sys.argv[2]
sys.path.insert(0, root)
from enumerate import IG, best_video_url            # reuse the patient client
m = json.load(open(os.path.join(out, "manifest.json")))
vids = [p for p in m["posts"] if p["is_video"]]
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")
ig = IG(m["username"])

def fetch(url, dst):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=90) as r, open(dst, "wb") as f:
        f.write(r.read())
    return os.path.getsize(dst) > 10000

def fresh_url(pk):
    try:
        d = ig.get_json(f"https://www.instagram.com/api/v1/media/{pk}/info/")
        return best_video_url(d["items"][0])
    except Exception:
        return None

for i, p in enumerate(vids, 1):
    code = p["shortcode"]; dst = os.path.join(out, "videos", f"{code}.mp4")
    if os.path.exists(dst) and os.path.getsize(dst) > 10000:
        continue
    ok = False
    for url in (p.get("video_url"), fresh_url(p.get("pk"))):
        if not url:
            continue
        try:
            ok = fetch(url, dst);
            if ok: break
        except Exception as e:
            print(f"  [{i}/{len(vids)}] {code} try-fail: {e}", flush=True)
            time.sleep(random.uniform(4, 9))
    print(f"  [{i}/{len(vids)}] {code} {'OK' if ok else 'FAIL'}", flush=True)
    time.sleep(random.uniform(4, 10))         # per-item human pacing
    if i % 12 == 0:
        time.sleep(random.uniform(30, 60))    # batch pause
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

# Stage 4: transcribe via the project-local faster-whisper venv (standalone script)
WHISPER="$ROOT/.venv/bin/python"
if [ -x "$WHISPER" ] && "$WHISPER" -c "import faster_whisper" 2>/dev/null; then
  "$WHISPER" "$ROOT/transcribe.py" "$OUT" || echo "  (transcribe stage errored, non-fatal)"
else
  echo "  (faster-whisper venv not ready - run ./.venv/bin/python transcribe.py $OUT later)"
fi

echo "== done. manifest+videos+frames+transcripts under $OUT"
