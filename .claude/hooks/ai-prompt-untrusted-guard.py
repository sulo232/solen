#!/usr/bin/env python3
"""ai-prompt-untrusted-guard , PreToolUse(Write|Edit|MultiEdit) reminder (2026-07-14).

Owner asked to HARDEN the AI prompt-injection class ("so this won't happen again") after the
Part-D audit found customer text spliced raw into a Gemini prompt. The structural fix is the
shared helper lib/ai/untrusted.ts wrapUntrustedInput(); this hook keeps it enforced: whenever a
file that calls Gemini/an LLM is written or edited without routing text through wrapUntrustedInput,
it injects a reminder. It is a REMINDER, not a hard block, because static analysis cannot prove a
given interpolation is user-controlled (a hard block would false-positive on prompts built only
from server constants). Once per file per session.

Fires when the NEW content introduces an LLM-call marker (generateContent / generativelanguage /
@google/generative-ai / GoogleGenerativeAI / fal image gen) and neither the new content nor the
on-disk file already references wrapUntrustedInput. stdout JSON additionalContext is injected.
"""
import hashlib
import json
import os
import re
import sys

STATE_DIR = os.path.expanduser("~/.claude/state")
LLM_MARKER = re.compile(r"generateContent|generativelanguage\.googleapis|@google/generative-ai|GoogleGenerativeAI|fal\.subscribe|fal\.run|@fal-ai")
HELPER = "wrapUntrustedInput"


def new_text_for(tool, ti):
    """The added text this guard reads, per tool. None means "not a tool we watch"."""
    if tool == "Write":
        return ti.get("content", "") or ""
    if tool == "Edit":
        return ti.get("new_string", "") or ""
    if tool == "MultiEdit":
        return " ".join((e or {}).get("new_string", "") for e in (ti.get("edits") or []))
    return None


def should_remind(tool, fp, new_text, disk_text=""):
    """True when this edit earns the reminder. The whole decision, minus the once-per-file
    marker, which is session bookkeeping rather than a judgement.

    Extracted 2026-08-24 so the self-test drives the SHIPPED decision rather than a copy of
    it. Every condition below is the one main() already applied, in the same order.
    """
    if not fp or not re.search(r"\.tsx?$", fp):
        return False
    f = fp.replace("\\", "/")
    if not re.search(r"(^|/)(app|lib)/", f):
        return False
    if f.endswith("lib/ai/untrusted.ts"):        # the helper file itself is exempt
        return False
    if new_text is None:
        return False
    if not LLM_MARKER.search(new_text):
        return False
    if HELPER in new_text:
        return False
    # The helper might already be used elsewhere in the current file (pre-edit): don't nag then.
    if HELPER in (disk_text or ""):
        return False
    return True


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)

    tool = data.get("tool_name", "")
    ti = data.get("tool_input", {}) or {}
    fp = ti.get("file_path", "") or ""
    new_text = new_text_for(tool, ti)

    disk_text = ""
    try:
        with open(fp, "r", encoding="utf-8", errors="ignore") as fh:
            disk_text = fh.read()
    except OSError:
        pass

    if not should_remind(tool, fp, new_text, disk_text):
        sys.exit(0)

    sid = (data.get("session_id") or "nosid")[:12]
    key = hashlib.md5(fp.encode()).hexdigest()[:10]
    marker = os.path.join(STATE_DIR, f".aiguard-{sid}-{key}")
    try:
        os.makedirs(STATE_DIR, exist_ok=True)
        if os.path.exists(marker):
            sys.exit(0)
        open(marker, "w").close()
    except Exception:
        pass

    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "additionalContext": (
                "AI PROMPT-INJECTION GUARD (.claude/hooks/ai-prompt-untrusted-guard.py): this file "
                "calls an LLM (Gemini/fal) but does not use wrapUntrustedInput. Any user-controlled "
                "text (request body, DB values a user set, DOM element_text, uploaded content) that "
                "goes into the prompt MUST be wrapped with wrapUntrustedInput(label, value) from "
                "lib/ai/untrusted.ts, so injected text is fenced as untrusted DATA and cannot act as "
                "instructions. If every input here is a server-side constant, ignore this."
            ),
        }
    }))
    sys.exit(0)


SOLEN = "/Users/sulo/Documents/solen"


def selftest():
    """Added 2026-08-24. This guard was armed with no test behind it since it was written.

    Cases are drawn from the repo's real LLM call sites. As of today twelve files call an
    LLM and ten of them route text through wrapUntrustedInput; the two that do not are
    app/api/admin/generate-roadmap/route.ts and lib/ai-vision.ts, and both appear below.
    """
    wrapped_route = (
        'import { GoogleGenerativeAI } from "@google/generative-ai";\n'
        'import { wrapUntrustedInput } from "@/lib/ai/untrusted";\n'
        'const prompt = `Empfiehl:\n${wrapUntrustedInput("Kundenfragebogen", intake_summary)}`;\n'
        'const result = await model.generateContent(prompt);\n')
    raw_route = (
        'import { GoogleGenerativeAI } from "@google/generative-ai";\n'
        'const genAI = new GoogleGenerativeAI(apiKey);\n'
        'const prompt = `Schreibe eine Beschreibung fuer: ${body.salonName}`;\n'
        'const result = await model.generateContent(prompt);\n')

    cases = [
        # ---- must REMIND ------------------------------------------------------
        ("real shape of app/api/services/suggest/route.ts before it was wrapped: a Gemini "
         "call splicing a request-body value straight into the prompt",
         "Write", f"{SOLEN}/app/api/services/suggest/route.ts", raw_route, "", True),
        ("real lib/ai-vision.ts, an LLM call site that still has no wrapper",
         "Write", f"{SOLEN}/lib/ai-vision.ts",
         'const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models");\n',
         "", True),
        ("real app/api/admin/generate-roadmap/route.ts, the other unwrapped call site",
         "Edit", f"{SOLEN}/app/api/admin/generate-roadmap/route.ts",
         'const result = await model.generateContent(roadmapPrompt);\n', "", True),
        ("a fal image generation call added to an app route",
         "Edit", f"{SOLEN}/app/api/inspo/render/route.ts",
         'const out = await fal.subscribe("fal-ai/flux", { input: { prompt: userText } });\n',
         "", True),
        ("a MultiEdit whose SECOND edit is the one adding the LLM call",
         "MultiEdit", f"{SOLEN}/app/api/ai/new/route.ts", None, "", True),

        # ---- must stay QUIET on ordinary good work ---------------------------
        ("real app/api/ai/recommend/route.ts:57, which DOES wrap the customer questionnaire",
         "Write", f"{SOLEN}/app/api/ai/recommend/route.ts", wrapped_route, "", False),
        ("an edit to a file that already imports the wrapper on disk",
         "Edit", f"{SOLEN}/app/api/ai/recommend/route.ts",
         'const result = await model.generateContent(prompt);\n',
         'import { wrapUntrustedInput } from "@/lib/ai/untrusted";\n', False),
        ("real app/api/waitlist/route.ts, an ordinary API route with no LLM anywhere in it",
         "Write", f"{SOLEN}/app/api/waitlist/route.ts",
         'const { data: { user } } = await supabase.auth.getUser();\n'
         'if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });\n',
         "", False),
        ("real app/[locale]/_components/homepage/SalonCard.tsx, a plain UI component",
         "Edit", f"{SOLEN}/app/[locale]/_components/homepage/SalonCard.tsx",
         '<PriceFrom amount={salon.avg_price} label={fromLabel} emphasis />\n', "", False),
        ("the helper file lib/ai/untrusted.ts itself is exempt",
         "Write", f"{SOLEN}/lib/ai/untrusted.ts",
         'export function wrapUntrustedInput(label: string, value: string) {\n'
         '  return `<<<${label}>>>\\n${value}\\n<<<end>>>`;\n}\n', "", False),
        ("a .sql migration is not a file this guard reads",
         "Write", f"{SOLEN}/supabase/migrations/20260901_x.sql",
         "alter table salons add column ai_summary text;\n", "", False),
        ("a script outside app/ and lib/ is out of scope",
         "Write", f"{SOLEN}/scripts/generate-copy.ts",
         'const result = await model.generateContent(prompt);\n', "", False),
        ("a Read is not a tool this guard watches",
         "Read", f"{SOLEN}/app/api/ai/recommend/route.ts", None, "", False),

        # ---- GAPS found by this suite, recorded, NOT fixed -------------------
        ("GAP 1: naming the helper in a COMMENT silences the reminder, because the check is a "
         "plain substring test on the added text",
         "Edit", f"{SOLEN}/app/api/ai/new/route.ts",
         '// TODO: switch this to wrapUntrustedInput one day\n'
         'const result = await model.generateContent(`Bewerte: ${body.review}`);\n', "", False),
        ("GAP 2: a file that wraps ONE input and splices another raw gets no reminder, because "
         "the on-disk check asks only whether the helper appears anywhere in the file",
         "Edit", f"{SOLEN}/app/api/ai/recommend/route.ts",
         'const p2 = `Fasse zusammen: ${body.freeText}`;\n'
         'const r2 = await model.generateContent(p2);\n',
         'import { wrapUntrustedInput } from "@/lib/ai/untrusted";\n', False),
        ("GAP 3: adding a raw user interpolation to an EXISTING generateContent call carries no "
         "LLM marker in the added text, so nothing fires",
         "Edit", f"{SOLEN}/app/api/admin/generate-roadmap/route.ts",
         'const roadmapPrompt = `Plane: ${body.userNotes}`;\n', "", False),
    ]
    ok = 0
    for name, tool, fp, new_text, disk, expect in cases:
        if tool == "MultiEdit" and new_text is None:
            nt = new_text_for("MultiEdit", {"edits": [
                {"new_string": 'import { z } from "zod";'},
                {"new_string": 'const r = await model.generateContent(prompt);'}]})
        elif tool == "Read":
            nt = new_text_for("Read", {})
        else:
            nt = new_text
        got = should_remind(tool, fp, nt, disk)
        good = got == expect
        ok += good
        print(f"  {'PASS' if good else 'FAIL'}  {name}  (reminded={got}, expected={expect})")
    print(f"\n{ok}/{len(cases)} passed")
    return 0 if ok == len(cases) else 1


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        sys.exit(selftest())
    try:
        main()
    except Exception:
        sys.exit(0)
