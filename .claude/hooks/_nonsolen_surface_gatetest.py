import json, subprocess, os
ROOT="/Users/sulo/Documents/solen"
GATES={"fullscreen":".claude/hooks/mockup-fullscreen-gate.py","diagnosis":".claude/hooks/mockup-diagnosis-gate.py"}
OUTSIDE="/Users/sulo/Documents/claude-statusbar/src/extension.ts"

# A: a NON-SOLEN mockup , cites a real file outside the repo. Must PASS both.
non_solen = f"""<!doctype html><html><head><title>x</title>
<!-- Grounded-in: {OUTSIDE} -->
</head><body><div class="panel">no iframe, no Diagnosis line</div></body></html>"""

# B: an ordinary SOLEN mockup , no Grounded-in at all. Must still BLOCK both.
solen_bad = """<!doctype html><html><head><title>x</title></head>
<body><div class="panel">no iframe, no Diagnosis line</div></body></html>"""

# C: claims non-Solen with an INVENTED path. Must still BLOCK both (fails closed).
faked = """<!doctype html><html><head><title>x</title>
<!-- Grounded-in: /Users/sulo/nope/ghost.ts -->
</head><body><div class="panel">no iframe, no Diagnosis line</div></body></html>"""

# D: cites a path INSIDE the repo. Must still BLOCK both.
inside = f"""<!doctype html><html><head><title>x</title>
<!-- Grounded-in: {ROOT}/package.json -->
</head><body><div class="panel">no iframe, no Diagnosis line</div></body></html>"""

cases=[("non-Solen, real outside path",non_solen,0),
       ("plain Solen mockup",solen_bad,2),
       ("faked: invented outside path",faked,2),
       ("path inside the repo",inside,2)]
fails=0
for gname,gpath in GATES.items():
    for name,content,want in cases:
        payload=json.dumps({"tool_name":"Write","tool_input":{
            "file_path":f"{ROOT}/public/_mockups/selftest/index.html","content":content}})
        r=subprocess.run(["python3",gpath],input=payload,capture_output=True,text=True,
                         env={**os.environ,"CLAUDE_PROJECT_DIR":ROOT})
        ok = (r.returncode==0) if want==0 else (r.returncode!=0)
        if not ok: fails+=1
        print(f"{'ok  ' if ok else 'FAIL'} [{gname}] {name}: exit={r.returncode} want={'pass' if want==0 else 'block'}")
print(f"\n{len(cases)*len(GATES)-fails}/{len(cases)*len(GATES)} passed")
raise SystemExit(1 if fails else 0)
