#!/usr/bin/env bash
# scripts/capture/encode-alpha-icon.sh , turn a transparent PNG frame sequence into the exact
# two files Airbnb serves for a search-bar icon (measured in
# _design-system/references/airbnb--animated-icons.md):
#   <name>.webm  VP9 with alpha_mode=1 in the container
#   <name>.mov   HEVC with alpha, for Safari
#
# Usage: encode-alpha-icon.sh <framesDir> <outDir> <name> [fps]
set -euo pipefail

FRAMES="${1:?usage: encode-alpha-icon.sh <framesDir> <outDir> <name> [fps]}"
OUT="${2:?missing outDir}"
NAME="${3:?missing name}"
FPS="${4:-30}"

if [ ! -d "$FRAMES" ]; then echo "REFUSED: frames dir not found: $FRAMES" >&2; exit 1; fi
COUNT=$(ls "$FRAMES"/*.png 2>/dev/null | wc -l | tr -d ' ')
if [ "$COUNT" -lt 2 ]; then echo "REFUSED: need at least 2 PNG frames, found $COUNT in $FRAMES" >&2; exit 1; fi
mkdir -p "$OUT"

# VP9 with a real alpha plane. yuva420p is what puts alpha_mode=1 in the WebM container, which is
# the single thing that makes the icon sit on any background without a matte box.
ffmpeg -hide_banner -loglevel error -y \
  -framerate "$FPS" -i "$FRAMES/%03d.png" \
  -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 30 -row-mt 1 -an \
  "$OUT/$NAME.webm"

# APNG for Safari. Measured on 2026-07-31: hevc_videotoolbox refuses the alpha session on this Mac
# (error -12908 across four flag combinations), and ffmpeg here is built without libwebp, so animated
# WebP is not available either. APNG is the one format that carries real alpha, keeps the frame
# timings, plays in Safari and iOS as well as Chrome and Firefox, and needs no extra install. It costs
# about 3.5x the WebM in bytes, which is the honest price of Safari support today.
python3 - "$FRAMES" "$OUT/$NAME.apng" "$FPS" <<'PYEOF'
import sys, glob, os
from PIL import Image
frames_dir, out, fps = sys.argv[1], sys.argv[2], float(sys.argv[3])
fs = sorted(glob.glob(os.path.join(frames_dir, "*.png")))
ims = [Image.open(f).convert("RGBA").quantize(colors=96, method=Image.FASTOCTREE).convert("RGBA") for f in fs]
ims[0].save(out, save_all=True, append_images=ims[1:], duration=1000.0/fps, loop=1, disposal=2, format="PNG")
im = Image.open(out)
total = 0
for i in range(im.n_frames):
    im.seek(i); total += im.info.get("duration", 0)
print(f"{os.path.basename(out)}  frames={im.n_frames} total={round(total)}ms size={os.path.getsize(out)}")
PYEOF

# HEVC with alpha for Safari. Needs the platform videotoolbox encoder; skipped, not faked, if absent.
if ffmpeg -hide_banner -encoders 2>/dev/null | grep -q hevc_videotoolbox; then
  ffmpeg -hide_banner -loglevel error -y \
    -framerate "$FPS" -i "$FRAMES/%03d.png" \
    -c:v hevc_videotoolbox -allow_sw 1 -alpha_quality 0.9 -pix_fmt bgra -tag:v hvc1 -q:v 60 -an \
    "$OUT/$NAME.mov" \
    || echo "note: the Safari .mov encode failed on this machine; the webm still carries the alpha"
else
  echo "note: hevc_videotoolbox not available, skipped the Safari .mov (the webm still has alpha)"
fi

# Prove it rather than assume it: read the alpha flag and the geometry back out of the file.
ALPHA=$(ffprobe -v error -show_streams -of json "$OUT/$NAME.webm" | python3 -c "import json,sys; print((json.load(sys.stdin)['streams'][0].get('tags') or {}).get('alpha_mode','MISSING'))")
GEOM=$(ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,width,height,r_frame_rate -show_entries format=duration,size -of default=noprint_wrappers=1 "$OUT/$NAME.webm" | tr '\n' ' ')
echo "$NAME.webm  alpha_mode=$ALPHA  $GEOM"
if [ "$ALPHA" != "1" ]; then
  echo "REFUSED: the encode produced NO alpha channel (alpha_mode=$ALPHA). Do not ship this file." >&2
  exit 1
fi
[ -f "$OUT/$NAME.mov" ] && ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,width,height,nb_frames -of default=noprint_wrappers=1 "$OUT/$NAME.mov" | tr '\n' ' ' && echo ""
exit 0
