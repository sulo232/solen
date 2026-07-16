#!/usr/bin/env python3
"""
Stage 4 - TRANSCRIBE (standalone, decoupled from harvest.sh so it can run
against already-downloaded videos with the project-local venv).

Usage:
  ./.venv/bin/python transcribe.py <data_dir>   # e.g. data/designparser

Transcribes every data_dir/videos/*.mp4 whose transcript is missing, into
data_dir/transcripts/<code>.txt. Idempotent + resumable. Uses faster-whisper
(CPU int8, "small" model) with a writable model cache under the venv dir.
"""
import os, sys, glob

def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    data = sys.argv[1]
    vdir = os.path.join(data, "videos")
    tdir = os.path.join(data, "transcripts")
    os.makedirs(tdir, exist_ok=True)
    vids = sorted(glob.glob(os.path.join(vdir, "*.mp4")))
    todo = [v for v in vids if not os.path.exists(
        os.path.join(tdir, os.path.splitext(os.path.basename(v))[0] + ".txt"))]
    print(f"{len(vids)} videos, {len(todo)} to transcribe", flush=True)
    if not todo:
        return
    # keep the HF/model cache inside the writable venv dir
    here = os.path.dirname(os.path.abspath(__file__))
    cache = os.path.join(here, ".venv", "models")
    os.makedirs(cache, exist_ok=True)
    os.environ.setdefault("HF_HOME", cache)
    os.environ.setdefault("XDG_CACHE_HOME", cache)
    from faster_whisper import WhisperModel
    model = WhisperModel("small", device="cpu", compute_type="int8",
                         download_root=cache)
    for i, v in enumerate(todo, 1):
        code = os.path.splitext(os.path.basename(v))[0]
        out = os.path.join(tdir, code + ".txt")
        try:
            segments, info = model.transcribe(v, vad_filter=True)
            text = " ".join(s.text.strip() for s in segments).strip()
            with open(out, "w") as f:
                f.write(text if text else "(no speech detected)")
            print(f"  [{i}/{len(todo)}] {code} {len(text)} chars ({info.language})", flush=True)
        except Exception as e:
            with open(out, "w") as f:
                f.write(f"(transcribe failed: {e})")
            print(f"  [{i}/{len(todo)}] {code} FAILED: {e}", flush=True)


if __name__ == "__main__":
    main()
