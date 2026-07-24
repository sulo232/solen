#!/usr/bin/env python3
"""Render _backend-system/*.md into served, readable pages under public/_mockups/backend-law/.

The owner is a visual non-coder: a markdown file in the repo is a system artifact,
not a deliverable. This turns the law layer into something you can open on a phone.

Minimal markdown subset on purpose (no deps): headings, tables, fenced code,
lists, blockquotes, links, bold, inline code. That covers what the research
agents actually emit.
"""
import html
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "_backend-system"
OUT = ROOT / "public" / "_mockups" / "backend-law"

TOPICS = [
    ("data-modeling", "Data modeling & storage"),
    ("transactions-concurrency", "Transactions & concurrency"),
    ("migrations", "Migrations"),
    ("backup-recovery", "Backup & recovery"),
    ("authn", "AuthN"),
    ("authz", "AuthZ"),
    ("api-design", "API design"),
    ("security", "Security"),
    ("rate-limiting", "Rate limiting & abuse"),
    ("file-storage", "File & object storage"),
    ("jobs-async", "Background jobs & async"),
    ("webhooks", "Webhooks"),
    ("caching", "Caching"),
    ("observability", "Observability"),
    ("reliability", "Reliability"),
]

TIER_RE = re.compile(r"\b(T1|T2|T3|CONV|MYTH)\b")


def inline(t: str) -> str:
    t = html.escape(t)
    t = re.sub(r"`([^`]+)`", r"<code>\1</code>", t)
    t = re.sub(r"\[([^\]]+)\]\((https?://[^)]+)\)", r'<a href="\2" target="_blank" rel="noopener">\1</a>', t)
    t = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", t)
    # bare urls -> links
    t = re.sub(r'(?<!["\'>=])(https?://[^\s<)\]]+)', r'<a href="\1" target="_blank" rel="noopener">\1</a>', t)
    t = TIER_RE.sub(lambda m: f'<span class="tier t-{m.group(1).lower()}">{m.group(1)}</span>', t)
    return t


def md_to_html(md: str) -> str:
    out, i = [], 0
    lines = md.split("\n")
    while i < len(lines):
        ln = lines[i]
        if ln.startswith("```"):
            i += 1
            buf = []
            while i < len(lines) and not lines[i].startswith("```"):
                buf.append(html.escape(lines[i]))
                i += 1
            i += 1
            out.append("<pre><code>" + "\n".join(buf) + "</code></pre>")
            continue
        if ln.startswith("|") and i + 1 < len(lines) and re.match(r"^\|[\s:|-]+\|$", lines[i + 1]):
            head = [c.strip() for c in ln.strip("|").split("|")]
            i += 2
            rows = []
            while i < len(lines) and lines[i].startswith("|"):
                rows.append([c.strip() for c in lines[i].strip("|").split("|")])
                i += 1
            th = "".join(f"<th>{inline(c)}</th>" for c in head)
            tb = "".join("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in r) + "</tr>" for r in rows)
            out.append(f'<div class="tw"><table><thead><tr>{th}</tr></thead><tbody>{tb}</tbody></table></div>')
            continue
        m = re.match(r"^(#{1,6})\s+(.*)$", ln)
        if m:
            lv = len(m.group(1))
            txt = m.group(2)
            aid = re.sub(r"[^a-z0-9]+", "-", txt.lower()).strip("-")[:60]
            out.append(f'<h{lv} id="{aid}">{inline(txt)}</h{lv}>')
            i += 1
            continue
        if re.match(r"^\s*[-*]\s+", ln):
            buf = []
            while i < len(lines) and re.match(r"^\s*[-*]\s+", lines[i]):
                buf.append("<li>" + inline(re.sub(r"^\s*[-*]\s+", "", lines[i])) + "</li>")
                i += 1
            out.append("<ul>" + "".join(buf) + "</ul>")
            continue
        if re.match(r"^\s*\d+\.\s+", ln):
            buf = []
            while i < len(lines) and re.match(r"^\s*\d+\.\s+", lines[i]):
                buf.append("<li>" + inline(re.sub(r"^\s*\d+\.\s+", "", lines[i])) + "</li>")
                i += 1
            out.append("<ol>" + "".join(buf) + "</ol>")
            continue
        if ln.startswith(">"):
            buf = []
            while i < len(lines) and lines[i].startswith(">"):
                buf.append(inline(lines[i].lstrip("> ")))
                i += 1
            out.append("<blockquote>" + "<br>".join(buf) + "</blockquote>")
            continue
        if ln.strip() == "---":
            out.append("<hr>")
            i += 1
            continue
        if ln.strip():
            buf = []
            while i < len(lines) and lines[i].strip() and not re.match(r"^(#{1,6}\s|\||```|>|\s*[-*]\s|\s*\d+\.\s|---$)", lines[i]):
                buf.append(lines[i])
                i += 1
            out.append("<p>" + inline(" ".join(buf)) + "</p>")
            continue
        i += 1
    return "\n".join(out)


CSS = """
*{box-sizing:border-box}
body{margin:0;background:#F4F4F5;color:#0A0A0A;font:15px/1.65 -apple-system,BlinkMacSystemFont,"Inter",system-ui,sans-serif;-webkit-text-size-adjust:100%}
a{color:#276EF1}
.wrap{max-width:860px;margin:0 auto;padding:24px 20px 96px}
.top{position:sticky;top:0;background:rgba(244,244,245,.92);backdrop-filter:blur(12px);border-bottom:1px solid #E4E4E7;z-index:9}
.top .wrap{padding:14px 20px}
.back{font-size:14px;font-weight:600;color:#0A0A0A;text-decoration:none}
h1{font-size:clamp(24px,4vw,32px);line-height:1.2;letter-spacing:-.02em;margin:24px 0 8px}
h2{font-size:clamp(18px,2vw,20px);letter-spacing:-.01em;margin:36px 0 10px;padding-top:18px;border-top:1px solid #E4E4E7}
h3{font-size:16px;margin:24px 0 8px}
h4,h5,h6{font-size:14px;margin:18px 0 6px}
p{margin:10px 0}
code{background:#fff;border:1px solid #E4E4E7;border-radius:6px;padding:1px 5px;font:12.5px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;word-break:break-word}
pre{background:#0A0A0A;color:#F4F4F5;border-radius:16px;padding:16px;overflow-x:auto;margin:14px 0}
pre code{background:none;border:0;color:inherit;padding:0;font-size:12.5px}
.tw{overflow-x:auto;margin:14px 0;border:1px solid #E4E4E7;border-radius:16px;background:#fff}
table{border-collapse:collapse;width:100%;font-size:13px}
th,td{text-align:left;padding:10px 12px;border-bottom:1px solid #E4E4E7;vertical-align:top}
th{font-weight:600;background:#FAFAFA;white-space:nowrap}
tr:last-child td{border-bottom:0}
blockquote{margin:14px 0;padding:12px 16px;background:#fff;border-left:3px solid #0A0A0A;border-radius:0 12px 12px 0}
ul,ol{margin:10px 0;padding-left:22px}
li{margin:5px 0}
hr{border:0;border-top:1px solid #E4E4E7;margin:28px 0}
.tier{display:inline-block;font-size:10.5px;font-weight:700;letter-spacing:.02em;padding:1px 6px;border-radius:999px;vertical-align:1px}
.t-t1{background:#DCFCE7;color:#14532D}
.t-t2{background:#DBEAFE;color:#1E3A8A}
.t-t3{background:#FEF3C7;color:#78350F}
.t-conv{background:#F4F4F5;color:#3F3F46;border:1px solid #E4E4E7}
.t-myth{background:#FEE2E2;color:#7F1D1D}
.card{display:block;background:#fff;border:1px solid #E4E4E7;border-radius:16px;padding:16px;margin:10px 0;text-decoration:none;color:inherit;transition:transform .15s}
.card:active{transform:scale(.99)}
.card .n{font-size:12px;color:#71717A}
.card .t{font-size:16px;font-weight:600;margin:2px 0 4px;letter-spacing:-.01em}
.card .m{font-size:12.5px;color:#71717A}
.lead{font-size:16px;color:#3F3F46;margin:12px 0 24px}
.pill{display:inline-block;font-size:11px;font-weight:600;padding:3px 9px;border-radius:999px;background:#fff;border:1px solid #E4E4E7;margin:0 4px 4px 0}
.warn{background:#FEE2E2;border:1px solid #FCA5A5;border-radius:16px;padding:16px;margin:16px 0}
.warn b{color:#7F1D1D}
"""


def page(title: str, body: str, back=True) -> str:
    nav = '<div class="top"><div class="wrap"><a class="back" href="./index.html">&larr; Backend law</a></div></div>' if back else ""
    return f"""<!doctype html><html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{html.escape(title)}</title><style>{CSS}</style></head>
<body>{nav}<div class="wrap">{body}</div></body></html>"""


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    built = []
    for slug, title in TOPICS:
        rf = SRC / "research" / f"{slug}.md"
        af = SRC / "audit" / f"{slug}.md"
        if not rf.exists():
            continue
        body = md_to_html(rf.read_text())
        if af.exists():
            body += '<h2 id="solen-audit">Does Solen actually do this?</h2>' + md_to_html(af.read_text())
            audited = True
        else:
            body += '<h2>Does Solen actually do this?</h2><p><em>The audit for this topic is still running. It lands in <code>_backend-system/audit/' + slug + '.md</code>.</em></p>'
            audited = False
        (OUT / f"{slug}.html").write_text(page(title, body))
        n_src = len(re.findall(r"https?://", rf.read_text()))
        n_lines = len(rf.read_text().split("\n"))
        built.append((slug, title, n_lines, n_src, audited))

    cards = ""
    for i, (slug, title, n_lines, n_src, audited) in enumerate(built, 1):
        mark = "audit done" if audited else "audit running"
        cards += (f'<a class="card" href="./{slug}.html"><div class="n">{i}</div>'
                  f'<div class="t">{html.escape(title)}</div>'
                  f'<div class="m">{n_lines} lines &middot; {n_src} cited sources &middot; {mark}</div></a>')

    idx_body = f"""
<h1>Backend law</h1>
<p class="lead">The backend half of the taste bible. Fifteen topics, researched from primary sources only, then audited against what Solen actually does. Built because a fresh session could read every line of how our backend works and still had to invent what to decide.</p>
<div>
<span class="pill">15 topics</span><span class="pill">{sum(b[3] for b in built)} cited sources</span><span class="pill">{sum(b[2] for b in built)} lines</span>
</div>

<div class="warn">
<p><b>One live finding needs your call.</b> The migrations audit found that salon amenities are generated by a hash function and shown to real customers. Verified on production: all 20 active salons still match the hash exactly for <code>wheelchair_accessible</code> and <code>lgbtq_friendly</code>, so no salon has ever set them. Seven currently claim wheelchair access. A customer filtering for an accessible salon gets a coin flip.</p>
<p>Details and the three options are in <a href="./migrations.html#solen-audit">Migrations &rarr; Does Solen actually do this?</a></p>
</div>

<h2>How to read a tier</h2>
<p>Every claim carries one, so you can tell a standard from someone's blog post.</p>
<p><span class="tier t-t1">T1</span> a formal standard: an RFC, NIST, OWASP, the Postgres docs.
<span class="tier t-t2">T2</span> one strong source, or two independents agreeing.
<span class="tier t-t3">T3</span> directional only: a vendor blog or a single benchmark. Check it on our own data before trusting the number.
<span class="tier t-conv">CONV</span> a convention. Useful, but not a truth.
<span class="tier t-myth">MYTH</span> debunked. Never cite it again.</p>

<h2>The topics</h2>
{cards}

<h2>Scale caveat</h2>
<p>Solen runs about 28 salons. Most published backend advice is written for companies a thousand times bigger. Every file has a "premature at our scale" section naming what we should <em>not</em> build yet and what would change that. Adopting big-company machinery early is its own failure, not caution.</p>
"""
    (OUT / "index.html").write_text(page("Backend law", idx_body, back=False))
    print(f"built {len(built)} topic pages + index -> {OUT}")
    for slug, title, n_lines, n_src, audited in built:
        print(f"  {slug:28} {n_lines:4} lines {n_src:3} sources  audit={'yes' if audited else 'pending'}")


if __name__ == "__main__":
    main()
