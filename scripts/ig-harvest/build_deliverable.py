#!/usr/bin/env python3
"""
Stage 6 - build the owner deliverables from a finished analysis:
  1. a detailed markdown principles doc
  2. a served visual page (cards + a representative frame per reel)

Usage:
  python3 build_deliverable.py <data_dir> <username>

Reads <data_dir>/synthesis.json + per_video.json (written from the extraction
workflow journal). Profile-agnostic so the next profile is the same command.
"""
import os, sys, json, shutil, glob, html

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))


def pick_frame(data, code):
    """Representative frame: prefer a mid-video scene cut over the first frame."""
    fr = sorted(glob.glob(os.path.join(data, "frames", code, "*.jpg")))
    if not fr:
        return None
    return fr[len(fr) // 2] if len(fr) > 2 else fr[0]


def esc(s):
    return html.escape(s or "")


def main():
    data, user = sys.argv[1], sys.argv[2]
    synth = json.load(open(os.path.join(data, "synthesis.json")))
    per_video = json.load(open(os.path.join(data, "per_video.json")))
    by_code = {p["shortcode"]: p for p in per_video}

    out_dir = os.path.join(REPO, "public", "_mockups", f"ig-principles-{user}")
    frames_dir = os.path.join(out_dir, "frames")
    os.makedirs(frames_dir, exist_ok=True)

    # copy one representative frame per analysed reel (self-hosted, no CDN)
    for code in by_code:
        src = pick_frame(data, code)
        if src:
            shutil.copy(src, os.path.join(frames_dir, f"{code}.jpg"))

    groups = synth.get("groups", [])
    total = sum(len(g["principles"]) for g in groups)

    # ---------- 1. markdown doc ----------
    md = [f"# Design principles from @{user} (Instagram)", ""]
    md.append(synth.get("intro", "").strip())
    md.append("")
    md.append(f"**{total} distinct principles** across {len(groups)} domains, extracted from "
              f"{len(by_code)} videos. Every principle was read off the actual video frames "
              f"(sampled with ffmpeg) plus the post caption, never from memory. Each entry links "
              f"its source reel(s).")
    md.append("")
    md.append("> Scope note: this is the first batch (the 12 most recent reels). The full "
              "116-video harvest continues; Instagram rate-limits anonymous access by IP, so it "
              "runs slowly in the background. New principles get appended here.")
    md.append("")
    for g in groups:
        md.append(f"## {g['domain'].replace('-', ' ').title()}")
        md.append("")
        for p in g["principles"]:
            md.append(f"### {p['title']}")
            md.append("")
            md.append(f"**In one line:** {p['summary']}")
            md.append("")
            md.append(p["detail"])
            md.append("")
            if p.get("how_to_apply"):
                md.append(f"**How to apply:** {p['how_to_apply']}")
                md.append("")
            if p.get("evidence"):
                md.append(f"**Evidence shown in the video:** {p['evidence']}")
                md.append("")
            if p.get("solen_relevance"):
                md.append(f"**Relevance to Solen:** {p['solen_relevance']}")
                md.append("")
            srcs = " · ".join(f"[{c}](https://www.instagram.com/reel/{c}/)"
                              for c in p.get("source_shortcodes", []))
            md.append(f"*Source: {srcs}*")
            md.append("")
    doc_path = os.path.join(REPO, "_design-system", "research",
                            f"IG_{user.upper()}_PRINCIPLES.md")
    os.makedirs(os.path.dirname(doc_path), exist_ok=True)
    open(doc_path, "w").write("\n".join(md))

    # ---------- 2. visual page ----------
    cards = []
    for g in groups:
        cards.append(f'<h2 class="domain">{esc(g["domain"].replace("-", " "))}</h2>')
        for p in g["principles"]:
            codes = p.get("source_shortcodes", [])
            img = ""
            for c in codes:
                if os.path.exists(os.path.join(frames_dir, f"{c}.jpg")):
                    img = (f'<img class="shot" src="frames/{c}.jpg" alt="frame from reel {c}" '
                           f'loading="lazy">')
                    break
            links = " ".join(
                f'<a class="src" href="https://www.instagram.com/reel/{c}/" target="_blank" '
                f'rel="noopener">{c}</a>' for c in codes)
            rows = []
            if p.get("how_to_apply"):
                rows.append(f'<div class="row"><span class="lbl">How to apply</span>'
                            f'<p>{esc(p["how_to_apply"])}</p></div>')
            if p.get("evidence"):
                rows.append(f'<div class="row"><span class="lbl">Evidence in the video</span>'
                            f'<p>{esc(p["evidence"])}</p></div>')
            if p.get("solen_relevance"):
                rows.append(f'<div class="row solen"><span class="lbl">For Solen</span>'
                            f'<p>{esc(p["solen_relevance"])}</p></div>')
            cards.append(f"""
<article class="card">
  <div class="media">{img}</div>
  <div class="body">
    <h3>{esc(p['title'])}</h3>
    <p class="summary">{esc(p['summary'])}</p>
    <p class="detail">{esc(p['detail'])}</p>
    {''.join(rows)}
    <div class="srcs">{links}</div>
  </div>
</article>""")

    page = f"""<!-- Exists-check: `npm run exists principles` + `npm run exists designparser` = 0 matches;
     no existing surface renders harvested Instagram design principles, and REMOVED.md has no hit.
     Net-new = this read-only knowledge page for the @{user} harvest. Not product UI. -->
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Design principles from @{esc(user)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root {{
    --ink:#0A0A0A; --ink2:#52525B; --ink3:#71717A;
    --bg:#FFFFFF; --sunken:#F4F4F5; --border:#E4E4E7; --accent:#276EF1;
  }}
  * {{ box-sizing:border-box; margin:0; padding:0; }}
  body {{ font-family:Inter,system-ui,sans-serif; color:var(--ink); background:var(--bg);
         -webkit-font-smoothing:antialiased; }}
  .wrap {{ max-width:1180px; margin:0 auto; padding:32px 20px 80px; }}
  header {{ padding:24px 0 8px; }}
  h1 {{ font-family:'Inter Tight',sans-serif; font-size:clamp(26px,4vw,38px); font-weight:700;
        letter-spacing:-0.02em; }}
  .lede {{ color:var(--ink2); font-size:15px; line-height:1.6; margin-top:10px; max-width:70ch; }}
  .stats {{ display:flex; gap:8px; flex-wrap:wrap; margin-top:18px; }}
  .stat {{ background:var(--sunken); border-radius:999px; padding:7px 14px; font-size:13px;
           font-weight:600; }}
  .note {{ margin-top:18px; padding:14px 16px; background:var(--sunken); border-radius:16px;
           font-size:13px; color:var(--ink2); line-height:1.6; max-width:80ch; }}
  h2.domain {{ font-family:'Inter Tight',sans-serif; font-size:clamp(18px,2vw,20px);
        font-weight:600; margin:44px 0 14px; text-transform:capitalize;
        border-top:1px solid var(--border); padding-top:22px; }}
  .card {{ display:grid; grid-template-columns:220px 1fr; gap:20px; border:1px solid var(--border);
           border-radius:16px; padding:16px; margin-bottom:14px; align-items:start; }}
  .media {{ background:var(--sunken); border-radius:12px; overflow:hidden; aspect-ratio:9/16;
            display:flex; align-items:center; justify-content:center; }}
  .shot {{ width:100%; height:100%; object-fit:cover; display:block; }}
  h3 {{ font-family:'Inter Tight',sans-serif; font-size:18px; font-weight:600;
        letter-spacing:-0.01em; }}
  .summary {{ font-size:14px; font-weight:600; margin-top:8px; line-height:1.55; }}
  .detail {{ font-size:14px; color:var(--ink2); line-height:1.65; margin-top:10px; }}
  .row {{ margin-top:12px; padding-top:12px; border-top:1px solid var(--border); }}
  .row p {{ font-size:13px; color:var(--ink2); line-height:1.6; margin-top:4px; }}
  .lbl {{ font-size:11px; font-weight:600; color:var(--ink3); }}
  .row.solen {{ background:var(--sunken); border-radius:12px; padding:12px; border-top:none; }}
  .srcs {{ margin-top:14px; display:flex; gap:8px; flex-wrap:wrap; }}
  a.src {{ font-size:12px; color:var(--accent); text-decoration:none; font-weight:500; }}
  a.src:hover {{ text-decoration:underline; }}
  @media (max-width:720px) {{
    .card {{ grid-template-columns:1fr; }}
    .media {{ aspect-ratio:16/9; }}
  }}
  @media (prefers-color-scheme:dark) {{
    :root {{ --ink:#FAFAFA; --ink2:#A1A1AA; --ink3:#8B8B93; --bg:#0A0A0A;
             --sunken:#18181B; --border:#27272A; }}
  }}
</style>
</head>
<body>
<div class="wrap">
  <header>
    <h1>Design principles from @{esc(user)}</h1>
    <p class="lede">{esc(synth.get('intro',''))}</p>
    <div class="stats">
      <span class="stat">{total} distinct principles</span>
      <span class="stat">{len(groups)} domains</span>
      <span class="stat">{len(by_code)} videos analysed</span>
    </div>
    <p class="note">Every principle here was read off the real video frames (sampled with ffmpeg)
      plus the post caption, never from memory. Each card links its source reel so you can check it.
      This is batch one, the 12 most recent reels. The full 116-video harvest is still running:
      Instagram rate-limits anonymous access by IP, so it grinds slowly in the background and new
      principles get appended.</p>
  </header>
  {''.join(cards)}
</div>
</body>
</html>"""
    open(os.path.join(out_dir, "index.html"), "w").write(page)
    print(f"WROTE {doc_path}")
    print(f"WROTE {os.path.join(out_dir,'index.html')} ({total} principles, {len(by_code)} frames)")


if __name__ == "__main__":
    main()
