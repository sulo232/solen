#!/usr/bin/env python3
"""
Stage 5 prep - assemble the per-video analysis input for the principle-extraction
Workflow. Run AFTER harvest.sh has produced videos/frames/transcripts.

Usage:
  python3 build_analysis_input.py <data_dir>   # e.g. data/designparser

Writes <data_dir>/analysis_input.json: one entry per downloaded video with its
caption, transcript, and the on-disk frame paths. The orchestrator reads this,
passes it as Workflow `args`, and each subagent Reads the frames + transcript to
extract the principle(s) the video teaches.
"""
import os, sys, json, glob


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    data = sys.argv[1]
    manifest = json.load(open(os.path.join(data, "manifest.json")))
    by_code = {p["shortcode"]: p for p in manifest["posts"]}
    entries = []
    for v in sorted(glob.glob(os.path.join(data, "videos", "*.mp4"))):
        code = os.path.splitext(os.path.basename(v))[0]
        p = by_code.get(code, {})
        frames = sorted(glob.glob(os.path.join(data, "frames", code, "*.jpg")))
        tpath = os.path.join(data, "transcripts", code + ".txt")
        transcript = ""
        if os.path.exists(tpath):
            transcript = open(tpath).read().strip()
        entries.append({
            "shortcode": code,
            "url": f"https://www.instagram.com/reel/{code}/",
            "caption": p.get("caption", ""),
            "transcript": transcript,
            "frame_paths": frames,
            "taken_at": p.get("taken_at"),
            "view_count": p.get("view_count"),
        })
    out = os.path.join(data, "analysis_input.json")
    json.dump(entries, open(out, "w"), indent=2, ensure_ascii=False)
    nf = sum(len(e["frame_paths"]) for e in entries)
    nt = sum(1 for e in entries if e["transcript"] and not e["transcript"].startswith("("))
    print(f"WROTE {out}: {len(entries)} videos, {nf} frames, {nt} real transcripts")


if __name__ == "__main__":
    main()
