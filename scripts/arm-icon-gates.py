#!/usr/bin/env python3
"""Arm the seven gates built during the animated-icon workstream. Run outside the sandbox."""
import json, shutil, os
p = os.path.expanduser("~/.claude/settings.json")
shutil.copy(p, p + ".bak")
d = json.load(open(p))
gates = ["sample-dont-pick-colour-gate", "no-unrequested-removal-gate",
         "animation-full-clip-verify-gate", "repeat-fix-simplify-gate",
         "no-invented-visual-motif-gate", "always-give-link-gate",
         "no-regression-by-fix-gate"]
stop = d.setdefault("hooks", {}).setdefault("Stop", [])
have = json.dumps(stop)
new = [{"type": "command", "command": f"python3 $HOME/.claude/hooks/{g}.py"}
       for g in gates if g not in have]
if new:
    stop.append({"hooks": new})
json.dump(d, open(p, "w"), indent=2)
print(f"armed {len(new)} gate(s); backup at {p}.bak")
