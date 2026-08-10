#!/usr/bin/env python3
"""Build the Missing Principles deliverable page from the per-domain findings JSON."""
import json, glob, os, html, sys, re

SRC = "/private/tmp/claude-501/-Users-sulo-Documents-solen--claude-worktrees-quirky-ellis-ef5559/57967b14-3150-443c-a086-24ec109168b4/scratchpad/principles"
OUT = sys.argv[1] if len(sys.argv) > 1 else "/tmp/missing-principles.html"
RANKED = sys.argv[2] if len(sys.argv) > 2 else None  # optional judged-ranking json

AREAS = [
    ("design", "Design and the look", [
        ("color-tokens", "Colour and tokens"),
        ("typography", "Typography"),
        ("layout-geometry", "Layout, spacing, geometry"),
        ("hierarchy-density", "Hierarchy, density, the floors"),
        ("motion", "Motion and feedback"),
        ("states-forms", "States, forms, errors"),
        ("imagery-icons", "Photos and icons"),
        ("ia-navigation", "Navigation and structure"),
        ("responsive-desktop", "Responsive and desktop"),
    ]),
    ("people", "People, words and fairness", [
        ("accessibility", "Accessibility"),
        ("copy-i18n", "Copy and the four languages"),
        ("ethics-psychology", "Persuasion ethics"),
        ("marketplace-trust", "Marketplace trust and safety"),
    ]),
    ("backend", "Backend, security and data", [
        ("authz-rls", "Auth, roles, RLS"),
        ("input-abuse", "Input, injection, abuse"),
        ("secrets-webhooks", "Secrets and webhooks"),
        ("data-money", "Data, migrations, money"),
        ("api-contracts", "API contracts"),
        ("performance", "Performance"),
        ("observability", "Observability and ops"),
        ("privacy-compliance", "Privacy and Swiss law"),
    ]),
    ("engineering", "Engineering and delivery", [
        ("testing-release", "Testing and release"),
        ("frontend-architecture", "Frontend architecture"),
        ("seo-comms", "Search, email, notifications"),
    ]),
    ("meta", "How I work for you", [
        ("agent-output", "How I report to you"),
        ("orchestrator-output", "How I report to you, my own list"),
        ("law-system-meta", "The rule system itself"),
    ]),
]

SEV_ORDER = {"critical": 0, "high": 1, "medium": 2, "low": 3}

# Hand-written by the orchestrator from its OWN live checks this session (live Supabase reads,
# the rendered pages, git, gh, the estate health check). Every number here was measured, not
# reported by a research agent. These lead the page because burying them would be the mistake.
HIGHLIGHTS = [
    ("Your test and lint CI has never run once, and it is not a settings problem",
     "Four workflow files (quality, db-migrate, invariants, inventory-freshness) exist on your machine and none of them is on GitHub. The remote repo contains exactly one workflow file, cron-jobs.yml, so GitHub has never had a typecheck, lint, unit, e2e or visual job to run. Those jobs have produced zero results, ever. Separately, even if they were pushed, the e2e job requires STRIPE_SECRET_KEY, which is not in the repo secrets, and the job is written to skip its whole body and still report green.",
     "gh api repos/sulo232/solen/contents/.github/workflows returns one file. gh run list --workflow=quality.yml returns HTTP 404, not found on the default branch."),
    ("The one workflow that does run is failing",
     "The five most recent scheduled runs of Solen cron jobs all failed, in 5 to 7 seconds each, which is the signature of a failure before any real work starts. Nothing alerts on it. The newest failure is 2026-07-20.",
     "gh run list --limit 5. I could not read the failure log itself: the retry hit a local TLS certificate error, so the cause is not verified."),
    ("The GitHub repo is 66 days and 1,603 commits behind your machine",
     "origin/main last moved on 2026-05-21. Local main is at 2026-07-26. Everything built since May exists only on this laptop, which is also why the CI files never reached GitHub.",
     "git log -1 origin/main, git rev-list --count origin/main..main."),
    ("Your design floors are enforced on mockups and never on the shipped page",
     "Measured live at 390x844: the home page carries 4.4 percent photographic area and the Basel city page carries 0.0 percent, against your own floor of roughly 33 percent. The Basel page has zero images of any kind on a 9,325px page. The salon detail page, the one that got a dedicated design workstream, passes at 34.7 percent. Quality tracks attention, not enforcement.",
     "getBoundingClientRect over every img, video and background-image in the first viewport, on the running dev server."),
    ("There is no salon photography in the database at all",
     "salon_photos has 0 rows for 28 salons. 20 salons do have a cover_photo_url, and every one of them is a remote Unsplash stock URL, two of them the same photo on different salons. The imagery floor cannot be met by design work while the content does not exist.",
     "Live SQL against the production Supabase project."),
    ("Nothing on the site shows a keyboard user where they are",
     "globals.css sets outline:none on every link, button, role=button, tabindex and summary, for all devices. That was your call about the look, and the code comment says so honestly. What is missing is the replacement: no non-ring focus treatment was ever mandated, so keyboard and switch users get nothing.",
     "app/globals.css:387-393, read in full."),
    ("Every page tells browsers and screen readers it is German",
     "app/layout.tsx hardcodes html lang=de and sits above the locale segment, so /en/basel serves English copy with lang=de. The skip link is stuck in German on all four languages for the same reason.",
     "Loaded /en/basel and read document.documentElement.lang. WCAG 3.1.1, Level A."),
    ("A salon owner can inject script into your pages through their own salon name",
     "The breadcrumb JSON-LD embeds the salon name with JSON.stringify inside dangerouslySetInnerHTML and never escapes the less-than character. A name containing a closing script tag executes. There is no Content-Security-Policy header to catch it.",
     "app/[locale]/salon/[slug]/layout.tsx:128-138, read in full; netlify.toml has six security headers and no CSP."),
    ("You are storing health data with ordinary account consent",
     "Allergies, sensitivity logs and wellness notes are special-category personal data under nFADP Article 5 and GDPR Article 9. There are 62 personal-data columns across 37 tables, and zero consent, retention or data-request tables. Only 12 columns in the entire 150-table schema have any expiry or deletion field.",
     "Live SQL over information_schema against the production project."),
    ("A gate your rulebook says is protecting you has never been switched on",
     "CLAUDE.md states that no-decorative-image-gate.py blocks a hardcoded image src. It is not wired into either settings file, so it has never run. You rejected decorative hero imagery three times; the gate written to stop the fourth is asleep. Five more gates are in the same state.",
     "system-health-check.py --report, plus grepping both settings files for each gate name."),
    ("Two things your Terms of Service promise, the code does not do",
     "Phone verification: the SMS check returns success and nothing is ever written. There is no phone_verified column on salons at all, so the promise has no storage. Strikes and suspensions: lib/strikes.ts writes to account_warnings at three places, tagged in its own comments as implementing ToS 3.3 and 4.4, and nothing anywhere reads that table. The consequence the Terms promise cannot fire.",
     "Read both route files in full, then queried information_schema for any column matching verif on salons, then grepped app and lib for every use of account_warnings."),
    ("A migration would invent wheelchair access for every salon if it ever replayed",
     "20260530_seed_salon_amenities.sql sets nine amenity booleans, including wheelchair_accessible, lgbtq_friendly and woman_owned, from a hash of the salon id. Its own header calls them cosmetic facets. The live database shows zero salons with any of them true, so it is not live. It is a landmine: any restore or fresh environment would fabricate accessibility and identity claims about real businesses.",
     "Read the migration in full, then counted the flags live: 20 active salons, 0 true on every one of them."),
    ("Two of the eighteen critical findings were wrong, and that is the point",
     "Two separate agents reported migration-file state as live state, at critical severity. Live queries disproved both. I am reporting that rather than quietly dropping them, because it is the single clearest evidence for a rule this estate does not have: the migrations folder is a history, not a description of the database, and every audit must say which question it answered.",
     "pg_policies for the reviews table, and the amenity flag counts, both queried live."),
    ("There is only one database, and your laptop has the master key to it",
     "Supabase lists exactly one project for this account, and .env.local points at that same project and carries its service-role key, which bypasses every RLS policy. So local development, seed scripts, the 21 kill-test scripts and production are all the same live database. There is no staging. This is the finding that makes several others worse: the amenity-fabricating migration, the untested restore, and every experiment run against real rows.",
     "MCP list_projects returns one project (tocfnsmxmdxkrcmjzzdw). grep of .env.local shows the same host and a SERVICE_ROLE key present."),
    ("Twenty-five workstreams are marked ACTIVE, for one person",
     "_plans/ACTIVE.md holds 55 rows: 25 ACTIVE, 7 PAUSED, 19 DONE. Twelve row numbers are duplicated, so several workstreams cannot even be referred to unambiguously. The index was built to stop work being forgotten and has become a place work goes to be forgotten in.",
     "Counted directly in _plans/ACTIVE.md: grep for the status markers and for duplicate leading row numbers."),
    ("1,686 commits sit on 40 branches that were never merged",
     "Two systems your memory records as SHIPPED live only there: the consistency dashboard (npm run consistency, which does not exist on main) and the Aurora dashboard skin. main itself has 2,416 commits, so roughly 41 percent as much work again is stranded.",
     "git branch --no-merged main, then git rev-list --count per branch."),
]


def esc(s):
    return html.escape(str(s or "").strip())


def clean(s):
    # the estate bans em-dashes; strip any that slipped through an agent
    return re.sub(r"\s*[—–]\s*", ", ", str(s or ""))


def load():
    data = {}
    for f in sorted(glob.glob(os.path.join(SRC, "*.json"))):
        if os.path.basename(f).startswith("_"):
            continue
        try:
            d = json.load(open(f))
        except Exception as e:
            print("SKIP", f, e, file=sys.stderr)
            continue
        key = d.get("domain") or os.path.basename(f)[:-5]
        data[key] = d
    return data


def main():
    data = load()
    all_titles = {k: dict(t)[k] if False else None for k in data}

    # flatten
    items = []
    for area_key, area_title, domains in AREAS:
        for dkey, dtitle in domains:
            d = data.get(dkey)
            if not d:
                continue
            for f in d.get("findings", []):
                f = dict(f)
                f["_area"] = area_key
                f["_area_title"] = area_title
                f["_domain"] = dkey
                f["_domain_title"] = dtitle
                items.append(f)

    total = len(items)
    crit = sum(1 for i in items if i.get("severity") == "critical")
    high = sum(1 for i in items if i.get("severity") == "high")
    med = sum(1 for i in items if i.get("severity") == "medium")
    low = sum(1 for i in items if i.get("severity") == "low")
    verified = sum(1 for i in items if i.get("confidence") == "verified")

    missing = [dkey for _, _, ds in AREAS for dkey, _ in ds if dkey not in data]

    parts = []
    parts.append(f"""<!doctype html>
<!--
  Missing Principles, built {esc(os.environ.get('BUILD_STAMP','2026-07-26'))}.
  Source of every card: {SRC}/<domain>.json, written by 26 read-only research agents.
  Exists-check: this page duplicates no existing surface. public/_mockups/taste-book/index.html
  renders SETTLED design rules as wrong/right pairs; this page renders MISSING rules as a
  ranked gap list across design, backend, security, privacy, delivery and agent behaviour.
  Single light theme, no dark mode (web law). Four font sizes, two weights.
-->
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>The Missing Principles</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;600&family=Inter:wght@400;600&display=swap">
<style>
  :root {{
    --ink:#0A0A0A; --ink2:#6B6B6B; --ink3:#9CA3AF;
    --border:#E4E4E7; --sunken:#F4F4F5; --white:#FFFFFF;
    --accent:#276EF1;
    --crit:#B91C1C; --crit-bg:#FEE2E2;
    --high:#C2410C; --high-bg:#FFEDD5;
    --med:#3F3F46;  --med-bg:#F4F4F5;
    --low:#6B6B6B;  --low-bg:#FAFAFA;
    --ok:#16A34A;   --ok-bg:#E8F5E9;
    --whisper:0 1px 2px rgba(10,10,10,.04), 0 2px 8px rgba(10,10,10,.05);
  }}
  * {{ box-sizing:border-box; }}
  html,body {{ margin:0; background:var(--white); overflow-x:hidden; }}
  body {{ color:var(--ink); font-family:'Inter',system-ui,-apple-system,sans-serif;
         font-size:15px; line-height:1.55; -webkit-font-smoothing:antialiased;
         -webkit-text-size-adjust:100%; }}
  h1,h2,h3 {{ font-family:'Inter Tight',system-ui,sans-serif; margin:0; letter-spacing:-.02em; font-weight:600; }}
  h1 {{ font-size:28px; line-height:1.2; }}
  h2 {{ font-size:15px; }}
  h3 {{ font-size:15px; }}
  p {{ margin:0; }}
  a {{ color:var(--accent); text-decoration:none; }}
  a:hover {{ text-decoration:underline; }}
  .wrap {{ max-width:900px; margin:0 auto; padding:28px 18px 80px; }}

  .lede {{ color:var(--ink2); margin-top:10px; max-width:660px; }}

  .stats {{ display:flex; flex-wrap:wrap; gap:8px; margin-top:20px; }}
  .stat {{ background:var(--sunken); border-radius:12px; padding:10px 14px; min-width:96px; }}
  .stat b {{ display:block; font-family:'Inter Tight',sans-serif; font-size:28px; font-weight:600;
             font-variant-numeric:tabular-nums; line-height:1.1; }}
  .stat span {{ font-size:13px; color:var(--ink2); }}

  .controls {{ position:sticky; top:0; z-index:5; background:var(--white);
               border-bottom:1px solid var(--border); padding:12px 0 12px; margin-top:24px;
               display:flex; flex-wrap:wrap; gap:8px; align-items:center; }}
  .filter {{ font-family:inherit; font-size:13px; font-weight:600; color:var(--ink);
             background:var(--white); border:1px solid var(--border); border-radius:999px;
             padding:7px 14px; cursor:pointer; }}
  .filter[aria-pressed="true"] {{ background:var(--sunken); border-color:var(--sunken); }}
  .count {{ font-size:13px; color:var(--ink2); margin-left:auto; font-variant-numeric:tabular-nums; }}

  .area {{ margin-top:40px; }}
  .area > h2 {{ padding-bottom:10px; border-bottom:1px solid var(--border); }}
  .area-note {{ font-size:13px; color:var(--ink2); margin-top:8px; }}

  .group {{ margin-top:24px; }}
  .group-head {{ display:flex; align-items:baseline; gap:8px; }}
  .group-head h3 {{ font-size:15px; }}
  .group-head .n {{ font-size:13px; color:var(--ink3); font-variant-numeric:tabular-nums; }}

  .card {{ border:1px solid var(--border); border-radius:16px; padding:16px; margin-top:12px;
           background:var(--white); }}
  .card.crit {{ border-left:3px solid var(--crit); }}
  .card.high {{ border-left:3px solid var(--high); }}

  .card-head {{ display:flex; gap:8px; align-items:flex-start; flex-wrap:wrap; }}
  .chip {{ display:inline-flex; align-items:center; font-size:11px; font-weight:600;
           border-radius:999px; padding:3px 9px; white-space:nowrap; }}
  .chip.crit {{ background:var(--crit-bg); color:var(--crit); }}
  .chip.high {{ background:var(--high-bg); color:var(--high); }}
  .chip.medium {{ background:var(--med-bg); color:var(--med); }}
  .chip.low {{ background:var(--low-bg); color:var(--low); border:1px solid var(--border); }}
  .chip.ok {{ background:var(--ok-bg); color:var(--ok); }}
  .chip.plain {{ background:var(--sunken); color:var(--ink2); }}

  .card-title {{ font-weight:600; flex:1 1 300px; min-width:0; }}
  .idtag {{ font-size:11px; color:var(--ink3); font-variant-numeric:tabular-nums; }}

  .law {{ background:var(--sunken); border-radius:12px; padding:12px 14px; margin-top:12px; }}
  .law .k {{ font-size:11px; font-weight:600; color:var(--ink2); display:block; margin-bottom:4px; }}

  .rows {{ margin-top:12px; }}
  .row {{ display:flex; gap:10px; padding:8px 0; border-top:1px solid var(--border); font-size:13px; }}
  .row:first-child {{ border-top:0; padding-top:0; }}
  .row .k {{ flex:0 0 104px; color:var(--ink2); font-weight:600; }}
  .row .v {{ flex:1 1 auto; min-width:0; color:var(--ink); overflow-wrap:anywhere; }}
  .row .v code {{ font-family:'Inter Tight',sans-serif; font-variant-numeric:tabular-nums;
                  background:var(--sunken); border-radius:6px; padding:1px 5px; }}

  .jump {{ display:flex; flex-wrap:wrap; gap:6px 14px; padding:10px 0 4px; margin-bottom:4px; }}
  .jump a {{ font-size:13px; font-weight:600; color:var(--accent); }}
  .area {{ scroll-margin-top:64px; }}

  .lead-card {{ border-left:3px solid var(--crit); }}
  .lead-body {{ margin-top:10px; }}
  .verdict {{ background:var(--sunken); border-radius:16px; padding:16px; margin-top:12px; }}
  .verdict .k {{ font-size:11px; font-weight:600; color:var(--ink2); display:block; margin-bottom:6px; }}
  .oli {{ padding:10px 0; border-top:1px solid var(--border); font-size:13px; }}
  .oli:first-of-type {{ border-top:0; }}
  .oli b {{ font-weight:600; }}
  .oli .m {{ color:var(--ink2); display:block; margin-top:2px; }}

  .foot {{ margin-top:56px; padding-top:16px; border-top:1px solid var(--border);
           font-size:13px; color:var(--ink2); }}
  @media (max-width:560px) {{
    .row {{ flex-direction:column; gap:2px; }}
    .row .k {{ flex:none; }}
  }}
</style>
</head>
<body>
<div class="wrap">

  <h1>The Missing Principles</h1>
  <p class="lede">Everything the Solen rulebook does not yet say, found by reading the whole estate
  and then attacking it. Each card is a rule you can paste, the reason it exists, and the proof the
  gap is real in your code today. Nothing here repeats a rule you already have.</p>

  <div class="stats">
    <div class="stat"><b>{total}</b><span>principles missing</span></div>
    <div class="stat"><b>{crit}</b><span>critical</span></div>
    <div class="stat"><b>{high}</b><span>high</span></div>
    <div class="stat"><b>{med + low}</b><span>medium and low</span></div>
    <div class="stat"><b>{verified}</b><span>proven in code</span></div>
  </div>

  <div class="controls">
    <button class="filter" data-sev="all" aria-pressed="true">All</button>
    <button class="filter" data-sev="critical" aria-pressed="false">Critical</button>
    <button class="filter" data-sev="high" aria-pressed="false">High</button>
    <button class="filter" data-sev="medium" aria-pressed="false">Medium</button>
    <button class="filter" data-sev="low" aria-pressed="false">Low</button>
    <span class="count" id="count">{total} shown</span>
  </div>

  <nav class="jump">
    <a href="#lead">Read this first</a>
    <a href="#corrections">What the research got wrong</a>
    <a href="#design">Design</a>
    <a href="#people">People and fairness</a>
    <a href="#backend">Backend and security</a>
    <a href="#engineering">Engineering</a>
    <a href="#meta">How I work</a>
    <a href="#panel">The three judges</a>
  </nav>
""")

    # ---- Highlights: measured by the orchestrator, not by a research agent ----
    parts.append("""
  <section class="area lead" id="lead" data-area="lead">
    <h2>If you read nothing else</h2>
    <p class="area-note">Sixteen things I checked myself this session, against the live database, the
    rendered pages, git and GitHub. Not agent claims: measurements, with the command that produced
    them. Nothing here has hurt a customer, because there are none yet. All of it would, once live.</p>
""")
    for i, (title, body, proof) in enumerate(HIGHLIGHTS, 1):
        parts.append(f"""    <article class="card lead-card">
      <div class="card-head"><span class="chip crit">measured</span>
        <span class="card-title">{esc(clean(title))}</span><span class="idtag">{i:02d}</span></div>
      <p class="lead-body">{esc(clean(body))}</p>
      <div class="rows"><div class="row"><span class="k">How I know</span><span class="v">{esc(clean(proof))}</span></div></div>
    </article>
""")
    parts.append("  </section>\n")

    # ---- Calibration: where the research was wrong ----
    CORRECTIONS = [
        ("A critical RLS hole on reviews", "authz-rls-01",
         "The agent read two migrations and found that a permissive UPDATE policy is never dropped, because a later migration drops a different policy name. Both migration files say exactly that.",
         "I queried pg_policies on the live database. The reviews table has four policies and all of them are correctly scoped. The permissive one does not exist live. Real finding underneath: the migration folder and the live policy set have diverged and nothing reconciles them."),
        ("Fabricated wheelchair access on live salons", "data-money-03",
         "A migration sets nine amenity booleans, including wheelchair_accessible and lgbtq_friendly, from a hash of the salon id, on every active salon.",
         "The migration is real and I read it in full. The live counts are zero on every one of those flags across all 20 active salons, so it was never applied or was reverted. It is a landmine for any restore or fresh environment, not a live defect."),
        ("Emails accept a locale and silently ignore it", "seo-comms-04",
         "Stated as: the builders take a locale argument and never use it, so everything sends in German.",
         "All 27 builders in lib/email.ts do use the locale. The cause is one level out: of 35 sendEmail call sites, exactly one passes a locale variable and five hardcode the string de, so the symptom is real and the mechanism named was wrong. The corrected rule belongs on the call site, not the builder."),
    ]
    parts.append("""
  <section class="area" id="corrections" data-area="corrections">
    <h2>Three things the research got wrong</h2>
    <p class="area-note">Out of 21 critical findings, three had a wrong mechanism or claimed a
    file-level truth was a live truth. All three were caught by checking the running system rather
    than the file the agent cited. They are here rather than quietly deleted, because they are the
    clearest evidence for a rule this estate does not have: the migrations folder is a history, not
    a description of the database, and every audit must say which of those two questions it answered.</p>
""")
    for title, fid, claimed, actual in CORRECTIONS:
        parts.append(f"""    <article class="card">
      <div class="card-head"><span class="chip plain">corrected</span>
        <span class="card-title">{esc(clean(title))}</span><span class="idtag">{esc(fid)}</span></div>
      <div class="rows">
        <div class="row"><span class="k">Claimed</span><span class="v">{esc(clean(claimed))}</span></div>
        <div class="row"><span class="k">Actually</span><span class="v">{esc(clean(actual))}</span></div>
      </div>
    </article>
""")
    parts.append("  </section>\n")

    # ---- Judgment panel ----
    def jload(name):
        p = os.path.join(SRC, name)
        try:
            return json.load(open(p))
        except Exception:
            return None

    j1, j2, j3 = jload("_judge1-rank.json"), jload("_judge2-cull.json"), jload("_judge3-gaps.json")

    if j1 or j2 or j3:
        parts.append('\n  <section class="area" id="panel" data-area="panel">\n    <h2>What three independent judges said</h2>\n    <p class="area-note">The list above was then read by three separate judgment passes that had not seen each other: one ranking what to do first, one attacking the list to cut what is wrong or already covered, one hunting for what a 26-topic sweep structurally cannot see.</p>\n')

    if j1:
        parts.append(f'\n    <div class="group"><div class="group-head"><h3>Judge 1, what to do first</h3><span class="n">{len(j1.get("do_now", []))}</span></div>\n')
        parts.append(f'      <div class="verdict"><span class="k">Verdict</span>{esc(clean(j1.get("verdict_summary")))}</div>\n')
        parts.append('      <article class="card"><div class="card-head"><span class="chip crit">do now</span><span class="card-title">In this order</span></div>\n')
        for it in j1.get("do_now", []):
            parts.append(f'        <div class="oli"><b>{esc(clean(it.get("title")))}</b> <span class="idtag">{esc(it.get("id"))}</span><span class="m">{esc(clean(it.get("why_first")))} Cost: {esc(it.get("effort"))}. If skipped: {esc(clean(it.get("damage_if_skipped")))}</span></div>\n')
        parts.append('      </article>\n')
        if j1.get("do_next"):
            parts.append('      <article class="card"><div class="card-head"><span class="chip high">do next</span><span class="card-title">Before launch, not this week</span></div>\n')
            for it in j1["do_next"]:
                parts.append(f'        <div class="oli"><b>{esc(clean(it.get("title")))}</b> <span class="idtag">{esc(it.get("id"))}</span><span class="m">{esc(clean(it.get("why")))}</span></div>\n')
            parts.append('      </article>\n')
        if j1.get("defer_with_trigger"):
            parts.append('      <article class="card"><div class="card-head"><span class="chip medium">not yet</span><span class="card-title">Correct, but premature at 28 salons. Each names the number that makes it due.</span></div>\n')
            for it in j1["defer_with_trigger"]:
                parts.append(f'        <div class="oli"><b>{esc(clean(it.get("title")))}</b> <span class="idtag">{esc(it.get("id"))}</span><span class="m">Due when: {esc(clean(it.get("trigger")))}</span></div>\n')
            parts.append('      </article>\n')
        parts.append("    </div>\n")

    if j2:
        parts.append(f'\n    <div class="group"><div class="group-head"><h3>Judge 2, the adversarial cull</h3><span class="n">{len(j2.get("cut", []))} cut</span></div>\n')
        parts.append(f'      <div class="verdict"><span class="k">Verdict</span>{esc(clean(j2.get("verdict_summary")))}</div>\n')
        parts.append(f'      <div class="verdict"><span class="k">What happens if you adopt all of it</span>{esc(clean(j2.get("bloat_risk")))}</div>\n')
        if j2.get("cut"):
            parts.append('      <article class="card"><div class="card-head"><span class="chip low">cut</span><span class="card-title">Wrong, already covered, or already rejected by you</span></div>\n')
            for it in j2["cut"]:
                parts.append(f'        <div class="oli"><b>{esc(it.get("id"))}</b><span class="m">{esc(clean(it.get("reason")))} Proof: {esc(clean(it.get("proof")))}</span></div>\n')
            parts.append('      </article>\n')
        if j2.get("downgrade"):
            parts.append('      <article class="card"><div class="card-head"><span class="chip low">overstated</span><span class="card-title">Real, but not as severe as claimed</span></div>\n')
            for it in j2["downgrade"]:
                parts.append(f'        <div class="oli"><b>{esc(it.get("id"))}</b> {esc(it.get("claimed"))} to {esc(it.get("correct"))}<span class="m">{esc(clean(it.get("why")))}</span></div>\n')
            parts.append('      </article>\n')
        if j2.get("merge"):
            parts.append('      <article class="card"><div class="card-head"><span class="chip plain">merge</span><span class="card-title">One principle wearing several hats</span></div>\n')
            for it in j2["merge"]:
                parts.append(f'        <div class="oli"><b>{esc(", ".join(it.get("ids", [])))}</b><span class="m">{esc(clean(it.get("merged_principle")))}</span></div>\n')
            parts.append('      </article>\n')
        parts.append("    </div>\n")

    if j3:
        nn = j3.get("net_new_principles", [])
        parts.append(f'\n    <div class="group"><div class="group-head"><h3>Judge 3, what the sweep could not see</h3><span class="n">{len(nn)} net new</span></div>\n')
        parts.append(f'      <div class="verdict"><span class="k">Verdict</span>{esc(clean(j3.get("verdict_summary")))}</div>\n')
        if j3.get("structural_blind_spots"):
            parts.append('      <article class="card"><div class="card-head"><span class="chip plain">blind spots</span><span class="card-title">Why a 26-topic sweep misses these by construction</span></div>\n')
            for it in j3["structural_blind_spots"]:
                parts.append(f'        <div class="oli"><b>{esc(clean(it.get("blind_spot")))}</b><span class="m">{esc(clean(it.get("why_missed")))}</span></div>\n')
            parts.append('      </article>\n')
        for f in sorted(nn, key=lambda x: SEV_ORDER.get(x.get("severity", "low"), 9)):
            sev = f.get("severity", "low")
            cls = "crit" if sev == "critical" else ("high" if sev == "high" else "")
            parts.append(f"""      <article class="card {cls}" data-sev="{esc(sev)}">
        <div class="card-head"><span class="chip {esc(sev)}">{esc(sev)}</span>
          <span class="card-title">{esc(clean(f.get('title')))}</span><span class="idtag">{esc(f.get('id'))}</span></div>
        <div class="law"><span class="k">The rule to add</span>{esc(clean(f.get('principle')))}</div>
        <div class="rows">
          <div class="row"><span class="k">Why</span><span class="v">{esc(clean(f.get('why')))}</span></div>
          <div class="row"><span class="k">Proof</span><span class="v">{esc(clean(f.get('local_evidence')))}</span></div>
          <div class="row"><span class="k">Lives in</span><span class="v">{esc(clean(f.get('where_it_should_live')))}</span></div>
          <div class="row"><span class="k">Enforced by</span><span class="v">{esc(clean(f.get('enforcement')))}</span></div>
        </div>
      </article>
""")
        parts.append("    </div>\n")

    if j1 or j2 or j3:
        parts.append("  </section>\n")

    for area_key, area_title, domains in AREAS:
        area_items = [i for i in items if i["_area"] == area_key]
        if not area_items:
            continue
        parts.append(f'\n  <section class="area" id="{esc(area_key)}" data-area="{esc(area_key)}">\n    <h2>{esc(area_title)}</h2>\n    <p class="area-note">{len(area_items)} missing principles across {len([1 for dk,_ in domains if any(i["_domain"]==dk for i in area_items)])} topics.</p>\n')
        for dkey, dtitle in domains:
            ditems = [i for i in area_items if i["_domain"] == dkey]
            if not ditems:
                continue
            ditems.sort(key=lambda x: SEV_ORDER.get(x.get("severity", "low"), 9))
            parts.append(f'\n    <div class="group">\n      <div class="group-head"><h3>{esc(dtitle)}</h3><span class="n">{len(ditems)}</span></div>\n')
            for f in ditems:
                sev = f.get("severity", "low")
                cls = "crit" if sev == "critical" else ("high" if sev == "high" else "")
                parts.append(f"""      <article class="card {cls}" data-sev="{esc(sev)}">
        <div class="card-head">
          <span class="chip {esc(sev)}">{esc(sev)}</span>
          <span class="card-title">{esc(clean(f.get('title')))}</span>
          <span class="idtag">{esc(f.get('id'))}</span>
        </div>
        <div class="law"><span class="k">The rule to add</span>{esc(clean(f.get('principle')))}</div>
        <div class="rows">
          <div class="row"><span class="k">Why</span><span class="v">{esc(clean(f.get('why')))}</span></div>
          <div class="row"><span class="k">Proof</span><span class="v">{esc(clean(f.get('local_evidence')))}</span></div>
          <div class="row"><span class="k">Already there</span><span class="v">{esc(clean(f.get('existing_coverage')))}</span></div>
          <div class="row"><span class="k">Outside ref</span><span class="v">{esc(clean(f.get('outside_reference')))}</span></div>
          <div class="row"><span class="k">Lives in</span><span class="v">{esc(clean(f.get('where_it_should_live')))}</span></div>
          <div class="row"><span class="k">Enforced by</span><span class="v">{esc(clean(f.get('enforcement')))}</span></div>
          <div class="row"><span class="k">Cost</span><span class="v">{esc(f.get('effort'))} effort, evidence tier {esc(f.get('confidence'))}</span></div>
        </div>
      </article>
""")
            parts.append("    </div>\n")
        parts.append("  </section>\n")

    missing_note = ""
    if missing:
        missing_note = "<br>Topics that returned nothing this run: " + esc(", ".join(missing)) + "."

    parts.append(f"""
  <div class="foot">
    Built from {len(data)} research passes over the whole estate: _design-system, _rules, _docs,
    _backend-system, both CLAUDE.md files, 164 enforcement hooks, and the live code.
    Every card names what it searched before claiming the gap.{missing_note}
  </div>

</div>
<script>
  var btns = document.querySelectorAll('.filter');
  var cards = document.querySelectorAll('.card');
  var countEl = document.getElementById('count');
  function apply(sev) {{
    var shown = 0;
    cards.forEach(function (c) {{
      var on = (sev === 'all') || (c.dataset.sev === sev);
      c.style.display = on ? '' : 'none';
      if (on) shown++;
    }});
    document.querySelectorAll('.group').forEach(function (g) {{
      var any = Array.prototype.some.call(g.querySelectorAll('.card'), function (c) {{ return c.style.display !== 'none'; }});
      g.style.display = any ? '' : 'none';
    }});
    document.querySelectorAll('.area').forEach(function (a) {{
      var any = Array.prototype.some.call(a.querySelectorAll('.card'), function (c) {{ return c.style.display !== 'none'; }});
      a.style.display = any ? '' : 'none';
    }});
    countEl.textContent = shown + ' shown';
  }}
  btns.forEach(function (b) {{
    b.addEventListener('click', function () {{
      btns.forEach(function (o) {{ o.setAttribute('aria-pressed', String(o === b)); }});
      apply(b.dataset.sev);
    }});
  }});
</script>
</body>
</html>
""")

    open(OUT, "w").write("".join(parts))
    print(f"WROTE {OUT}")
    print(f"total={total} critical={crit} high={high} medium={med} low={low} verified={verified}")
    print(f"domains loaded={len(data)} missing={missing}")


if __name__ == "__main__":
    main()
