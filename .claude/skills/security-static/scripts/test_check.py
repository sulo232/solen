#!/usr/bin/env python3
"""Isolated fixture tests for the private report-only scanner."""
from __future__ import annotations

import hashlib
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
CHECK = HERE / "check.py"


CASES = {
    "S1_PLAINTEXT_TOKEN": (
        ("app/api/x/route.ts", 'admin.from("tickets").insert({ reset_token: rawToken });'),
        ("app/api/x/route.ts", 'admin.from("tickets").insert({ reset_token_hash: hashToken(rawToken) });'),
        ("app/ui.ts", 'const display_token = publicCode;'),
    ),
    "S2_TOKEN_IN_QUERY": (
        ("app/api/x/route.ts", 'url.searchParams.set("reset_token", token);'),
        ("app/api/x/route.ts", 'fetch(url, { headers: { Authorization: `Bearer ${token}` } });'),
        ("app/map.ts", 'const url = new URL("https://api.mapbox.com"); url.searchParams.set("access_token", token);'),
    ),
    "S3_GEMINI_QUERY_KEY": (
        ("app/ai.ts", 'const u="https://generativelanguage.googleapis.com/v1"; url.searchParams.set("key", apiKey);'),
        ("app/ai.ts", 'fetch("https://generativelanguage.googleapis.com/v1", {headers:{"x-goog-api-key":apiKey}});'),
        ("app/other.ts", 'url.searchParams.set("key", value);'),
    ),
    "S4_SERVER_SESSION": (
        ("app/api/x/route.ts", 'export async function GET(){ return supabase.auth.getSession(); }'),
        ("app/api/x/route.ts", 'export async function GET(){ return supabase.auth.getUser(); }'),
        ("components/Session.tsx", 'useEffect(()=>{ supabase.auth.getSession(); },[]);'),
    ),
    "S5_RLS_PUBLIC_ADMIN": (
        ("supabase/migrations/001.sql", 'ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;'),
        ("supabase/migrations/001.sql", 'ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;'),
        ("fixtures/example.ts", 'const name = "NEXT_PUBLIC_SERVICE_ROLE_KEY";'),
    ),
    "S6_BODY_SCHEMA": (
        ("app/api/x/route.ts", 'export async function POST(req){ const body=await req.json(); return Response.json(body); }'),
        ("app/api/x/route.ts", 'export async function POST(req){ const body=await req.json(); const parsed=schema.safeParse(body); return Response.json(parsed); }'),
        ("app/api/x/route.ts", 'export async function GET(req){ const body=await req.json(); return Response.json(body); }'),
    ),
    "S7_AI_UNTRUSTED_PROMPT": (
        ("app/api/ai/route.ts", 'const prompt = `Follow policy and answer ${body.text}`;'),
        ("app/api/ai/route.ts", 'const system = "Follow policy"; const userContent = body.text;'),
        ("app/api/ai/route.ts", 'const prompt = `Use locale ${CONFIG_LOCALE}`;'),
    ),
    "S8_SERVICE_ROLE_OWNERSHIP": (
        ("app/api/admin/route.ts", 'const admin=createAdminClient(); const id=body.user_id; admin.from("x").update({status:"x"}).eq("id",id);'),
        ("app/api/admin/route.ts", 'const admin=createAdminClient(); const id=body.user_id; admin.from("x").update({status:"x"}).eq("user_id",user.id).eq("id",id);'),
        ("app/api/webhook/route.ts", 'verifySignature(req); const admin=createAdminClient(); const id=body.user_id; admin.from("x").update({status:"x"}).eq("id",id);'),
    ),
    "S9_STORAGE_OWNERSHIP": (
        ("app/api/files/route.ts", 'const admin=createAdminClient(); const id=body.user_id; admin.storage.from("x").upload(body.path,file);'),
        ("app/api/files/route.ts", 'const admin=createAdminClient(); const id=body.user_id; assertOwnership(id); admin.storage.from("x").upload(`${user.id}/${id}`,file);'),
        ("app/api/webhook/route.ts", 'verifySignature(req); const admin=createAdminClient(); const id=body.user_id; admin.storage.from("x").upload("fixed/file",file);'),
    ),
    "S10_MONEY_AUTH": (
        ("app/api/payment/route.ts", 'admin.from("payments").update({ amount: body.amount }).eq("id",body.id);'),
        ("app/api/payment/route.ts", 'const {data:user}=await auth.getUser(); admin.from("payments").update({ amount: body.amount }).eq("user_id",user.id);'),
        ("app/api/stripe/webhook/route.ts", 'const event=constructEvent(body,sig); admin.from("payments").update({ amount: event.amount });'),
    ),
    "S11_MONEY_CAS": (
        ("app/api/x/route.ts", 'db.from("bookings").update({ status: "paid" }).eq("id",id);'),
        ("app/api/x/route.ts", 'db.from("bookings").update({ status: "paid" }).eq("id",id).eq("status","pending").select("id").maybeSingle();'),
        ("app/api/x/route.ts", 'db.from("events").upsert({ status: "seen" }, { onConflict: "event_id" });'),
    ),
    "S12_POSTGREST_FILTER": (
        ("app/api/x/route.ts", 'db.from("x").select("id").or(`name.ilike.%${query}%`);'),
        ("app/api/x/route.ts", 'db.from("x").select("id").eq("kind", parsedKind);'),
        ("app/api/x/route.ts", 'db.from("x").select("id").ilike("name", "%fixed%");'),
    ),
    "S13_PHANTOM_COLUMN": (
        ("app/api/x/route.ts", 'db.from("bookings").select("id, phantom");'),
        ("app/api/x/route.ts", 'db.from("bookings").select("id, status");'),
        ("app/api/x/route.ts", 'db.rpc("dynamic_view", args);'),
    ),
    "S14_SENSITIVE_SELECT_STAR": (
        ("app/api/x/route.ts", 'db.from("bookings").select("*");'),
        ("app/api/x/route.ts", 'db.from("bookings").select("id, status");'),
        ("app/api/allowed/route.ts", 'db.from("bookings").select("*");'),
    ),
    "S15_MIGRATION_FABRICATION": (
        ("supabase/migrations/001.sql", 'update salons set wheelchair_accessible=(abs(hashtext(id::text)) % 2 = 0);'),
        ("supabase/migrations/001.sql", 'alter table salons add column wheelchair_accessible boolean;'),
        ("supabase/migrations/seed_test.sql", 'update salons_test set wheelchair_accessible=(abs(hashtext(id::text)) % 2 = 0);'),
    ),
    "S16_LEGAL_PRICE": (
        ("messages/de.json", '{"price":"ab CHF 45"}'),
        ("messages/de.json", '{"price":"Kurzhaar CHF 45 / Langhaar CHF 55"}'),
        ("app/_mockups/demo.ts", 'const price="ab CHF 45";'),
    ),
    "P1_WORKFLOW_INJECTION": (
        (".github/workflows/test.yml", 'steps:\n - run: echo "${{ github.event.issue.title }}"'),
        (".github/workflows/test.yml", 'env:\n  TITLE: ${{ github.event.issue.title }}\nsteps:\n - run: echo "$TITLE"'),
        (".github/workflows/test.yml", 'steps:\n - run: echo "constant"'),
    ),
    "P2_CODE_EXECUTION": (
        ("scripts/run.mjs", 'exec(`convert ${userInput}`);'),
        ("scripts/run.mjs", 'execFile("convert", [userInput], callback);'),
        ("scripts/run.mjs", 'execSync("git status --short");'),
    ),
    "P3_HTML_SINK": (
        ("components/Html.tsx", '<div dangerouslySetInnerHTML={{__html: body.html}} />'),
        ("components/Html.tsx", '<div>{body.text}</div>'),
        ("components/Seo.tsx", '<script dangerouslySetInnerHTML={{__html: safeJsonLd(data)}} />'),
    ),
    "P4_PYTHON_DESERIALIZATION": (
        ("scripts/load.py", 'value = pickle.loads(request.data)'),
        ("scripts/load.py", 'value = json.loads(request.data)'),
        ("scripts/load.py", 'value = torch.load(path, weights_only=True)'),
    ),
    "P5_SHELL_EXECUTION": (
        ("scripts/run.py", 'subprocess.run(f"ls {user_input}", shell=True)'),
        ("scripts/run.py", 'subprocess.run(["ls", user_input], check=True)'),
        ("scripts/run.py", 'subprocess.run("git status", shell=False)'),
    ),
    "P6_PYTHON_YAML": (
        ("scripts/load.py", 'value = yaml.load(user_text)'),
        ("scripts/load.py", 'value = yaml.safe_load(user_text); Schema.model_validate(value)'),
        ("scripts/check.mjs", 'const doc = yaml.load(readFileSync(path, "utf8"));'),
    ),
    "P7_WEAK_CRYPTO_TLS": (
        ("lib/crypto.ts", 'const c = crypto.createCipher("aes-256-cbc", key);'),
        ("lib/crypto.ts", 'const c = crypto.createCipheriv("aes-256-gcm", key, iv);'),
        ("fixtures/crypto.test.ts", 'const old = crypto.createCipher("aes-256-cbc", key);'),
    ),
    "P8_UNSAFE_XML": (
        ("scripts/xml.py", 'root = ET.fromstring(request.data)'),
        ("scripts/xml.py", 'from defusedxml import ElementTree as ET\nroot = ET.fromstring(request.data)'),
        ("scripts/xml.py", 'root = ET.fromstring(TRUSTED_LOCAL_FIXTURE)'),
    ),
    "P9_EXTERNAL_SCRIPT_SRI": (
        ("public/page.html", '<script src="https://cdn.example/x.js"></script>'),
        ("public/page.html", '<script src="https://cdn.example/x.js" integrity="sha384-x" crossorigin="anonymous"></script>'),
        ("public/_archive/page.html", '<script src="https://cdn.example/x.js"></script>'),
    )
}

EXCEPTION_REMAINS_A_CANDIDATE = {"P2_CODE_EXECUTION", "P8_UNSAFE_XML"}

PLUGIN_IDENTITY_POSITIVES = [
    ("github_actions_workflow", "P1_WORKFLOW_INJECTION", ".github/workflows/p.yml", 'steps:\n - run: echo "${{ github.event.comment.body }}"'),
    ("child_process_exec", "P2_CODE_EXECUTION", "scripts/a.mjs", 'child_process.exec(`x ${input}`);'),
    ("new_function_injection", "P2_CODE_EXECUTION", "scripts/b.mjs", 'new Function(`return ${input}`);'),
    ("eval_injection", "P2_CODE_EXECUTION", "scripts/c.mjs", 'eval(input);'),
    ("react_dangerously_set_html", "P3_HTML_SINK", "components/a.tsx", '<div dangerouslySetInnerHTML={{__html: input}} />'),
    ("document_write_xss", "P3_HTML_SINK", "public/a.js", 'document.write(input);'),
    ("innerHTML_xss", "P3_HTML_SINK", "public/b.js", 'node.innerHTML = input;'),
    ("pickle_deserialization", "P4_PYTHON_DESERIALIZATION", "scripts/a.py", 'pickle.load(stream)'),
    ("os_system_injection", "P5_SHELL_EXECUTION", "scripts/b.py", 'os.system(command)'),
    ("python_subprocess_shell", "P5_SHELL_EXECUTION", "scripts/c.py", 'subprocess.Popen(command, shell=True)'),
    ("go_exec_shell_injection", "P5_SHELL_EXECUTION", "cmd/a.go", 'exec.Command("bash", "-c", input)'),
    ("unsafe_yaml_load", "P6_PYTHON_YAML", "scripts/d.py", 'yaml.load(input)'),
    ("node_createcipher_no_iv", "P7_WEAK_CRYPTO_TLS", "lib/a.ts", 'crypto.createCipher("aes-256-cbc", key)'),
    ("aes_ecb_mode", "P7_WEAK_CRYPTO_TLS", "scripts/e.py", 'cipher = AES.new(key, AES.MODE_ECB)'),
    ("tls_verification_disabled", "P7_WEAK_CRYPTO_TLS", "lib/b.ts", 'fetch(url, { rejectUnauthorized: false })'),
    ("marshal_loads", "P4_PYTHON_DESERIALIZATION", "scripts/f.py", 'marshal.loads(input)'),
    ("shelve_open", "P4_PYTHON_DESERIALIZATION", "scripts/g.py", 'shelve.open(user_path)'),
    ("xml_unsafe_parse", "P8_UNSAFE_XML", "scripts/h.py", 'ET.fromstring(input)'),
    ("pickle_variants_load", "P4_PYTHON_DESERIALIZATION", "scripts/i.py", 'cloudpickle.loads(input)'),
    ("outerHTML_xss", "P3_HTML_SINK", "public/c.js", 'node.outerHTML = input;'),
    ("insertAdjacentHTML_xss", "P3_HTML_SINK", "public/d.js", 'node.insertAdjacentHTML("beforeend", input);'),
    ("script_src_without_sri", "P9_EXTERNAL_SCRIPT_SRI", "public/a.html", '<script src="https://cdn.example/a.js"></script>'),
    ("torch_unsafe_load", "P4_PYTHON_DESERIALIZATION", "scripts/j.py", 'torch.load(user_path)'),
    ("yaml_unsafe_load_variants", "P6_PYTHON_YAML", "scripts/k.py", 'yaml.unsafe_load(input)'),
    ("pickle_wrapper_load", "P4_PYTHON_DESERIALIZATION", "scripts/l.py", 'joblib.load(user_path)'),
]


def run(root: Path, rel: str, content: str, extra: list[str] | None = None) -> tuple[int, dict]:
    target = root / rel
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")
    cmd = [sys.executable, str(CHECK), "--root", str(root), "--file", rel]
    if extra:
        cmd.extend(extra)
    env = {"PATH": os.environ.get("PATH", ""), "PYTHONDONTWRITEBYTECODE": "1"}
    p = subprocess.run(cmd, text=True, capture_output=True, env=env, timeout=10)
    if p.stderr:
        raise AssertionError(f"unexpected stderr: {p.stderr}")
    return p.returncode, json.loads(p.stdout)


def ids(result: dict) -> set[str]:
    return {x["id"] for x in result.get("findings", [])}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(64 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main(freeze_evidence: bool = False) -> int:
    results = []
    failures = []
    with tempfile.TemporaryDirectory(prefix="security-static-") as tmp:
        root = Path(tmp)
        (root / "schema.json").write_text(json.dumps({"columns":{"bookings":["id","status"]}}))
        (root / "allow.json").write_text(json.dumps(["app/api/allowed/route.ts"]))
        common = ["--schema-snapshot", "schema.json", "--schema-max-age-hours", "1", "--select-star-allowlist", "allow.json"]
        for rule_id, triplet in CASES.items():
            for kind, (rel, content) in zip(("bad", "good", "exception"), triplet):
                code, result = run(root, rel, content, common)
                present = rule_id in ids(result)
                expected = kind == "bad" or (kind == "exception" and rule_id in EXCEPTION_REMAINS_A_CANDIDATE)
                ok = code == 0 and present == expected and result.get("partialResults") is None
                record = {"id": rule_id, "case": kind, "ok": ok, "exitCode": code,
                          "observedIds": sorted(ids(result)), "status": result.get("status")}
                results.append(record)
                if not ok:
                    failures.append(record)

        for source_name, expected_id, rel, content in PLUGIN_IDENTITY_POSITIVES:
            code, result = run(root, rel, content, common)
            ok = code == 0 and expected_id in ids(result)
            record = {"id":"PLUGIN_IDENTITY", "sourceRule":source_name, "expectedId":expected_id,
                      "ok":ok, "exitCode":code, "observedIds":sorted(ids(result))}
            results.append(record)
            if not ok: failures.append(record)

        # Input/population and all-or-error controls.
        d = root / "population"
        d.mkdir()
        (d / "a.ts").write_text("const a=1")
        (d / "note.txt").write_text("unsupported")
        cmd = [sys.executable, str(CHECK), "--root", str(root), "--file", "population", "--file", "population/a.ts"]
        p = subprocess.run(cmd, text=True, capture_output=True, env={"PATH":os.environ.get("PATH", ""), "PYTHONDONTWRITEBYTECODE":"1"})
        data = json.loads(p.stdout)
        pop_ok = (p.returncode == 0 and data["population"]["uniqueSupportedFiles"] == 1 and
                  data["population"]["duplicateSelections"] == 1 and data["population"]["unsupportedEntryCount"] == 1)
        results.append({"id":"I1_POPULATION", "ok":pop_ok, "result":data["population"]})
        if not pop_ok: failures.append(results[-1])

        bad = root / "bad.ts"
        bad.write_bytes(b"\xff\xfe")
        p = subprocess.run([sys.executable, str(CHECK), "--root", str(root), "--file", "bad.ts"], text=True, capture_output=True,
                           env={"PATH":os.environ.get("PATH", ""), "PYTHONDONTWRITEBYTECODE":"1"})
        data = json.loads(p.stdout)
        error_ok = p.returncode == 2 and data == {"error":data["error"], "findings":[], "partialResults":False, "status":"error"}
        results.append({"id":"I2_ALL_OR_ERROR", "ok":error_ok, "exitCode":p.returncode, "result":data})
        if not error_ok: failures.append(results[-1])

        p = subprocess.run([sys.executable, str(CHECK), "--root", str(root), "--file", "population/note.txt"], text=True, capture_output=True,
                           env={"PATH":os.environ.get("PATH", ""), "PYTHONDONTWRITEBYTECODE":"1"})
        data = json.loads(p.stdout)
        unsupported_ok = p.returncode == 2 and data["status"] == "error" and not data["findings"]
        results.append({"id":"I3_EXPLICIT_UNSUPPORTED", "ok":unsupported_ok, "exitCode":p.returncode})
        if not unsupported_ok: failures.append(results[-1])

        code, no_schema = run(root, "app/api/schema/route.ts", 'db.from("bookings").select("id, missing");')
        schema_ok = code == 0 and any(x["id"] == "S13_PHANTOM_COLUMN" for x in no_schema["unverified"])
        results.append({"id":"I4_ABSENT_SCHEMA_UNVERIFIED", "ok":schema_ok, "unverified":no_schema["unverified"]})
        if not schema_ok: failures.append(results[-1])

        old = dt_path = root / "old-schema.json"
        old.write_text(json.dumps({"columns":{"bookings":["id"]}}))
        os.utime(dt_path, (1, 1))
        code, stale = run(root, "app/api/stale/route.ts", 'db.from("bookings").select("id, missing");',
                          ["--schema-snapshot", "old-schema.json", "--schema-max-age-hours", "1"])
        stale_ok = code == 0 and stale["status"] == "review_required" and any("exceeds threshold" in x["reason"] for x in stale["unverified"])
        results.append({"id":"I5_STALE_SCHEMA_UNVERIFIED", "ok":stale_ok, "unverified":stale["unverified"]})
        if not stale_ok: failures.append(results[-1])

        with tempfile.TemporaryDirectory(prefix="security-static-outside-") as outside:
            outside_file = Path(outside) / "x.ts"
            outside_file.write_text("const x=1")
            p = subprocess.run([sys.executable, str(CHECK), "--root", str(root), "--file", str(outside_file)], text=True, capture_output=True,
                               env={"PATH":os.environ.get("PATH", ""), "PYTHONDONTWRITEBYTECODE":"1"})
            data = json.loads(p.stdout)
            outside_ok = p.returncode == 2 and data["status"] == "error" and not data["findings"]
            results.append({"id":"I6_ROOT_CONFINEMENT", "ok":outside_ok, "exitCode":p.returncode})
            if not outside_ok: failures.append(results[-1])

        p = subprocess.run([sys.executable, str(CHECK)], text=True, capture_output=True,
                           env={"PATH":os.environ.get("PATH", ""), "PYTHONDONTWRITEBYTECODE":"1"})
        data = json.loads(p.stdout)
        args_ok = p.returncode == 2 and data["status"] == "error" and not data["findings"] and not p.stderr
        results.append({"id":"I7_ARGUMENT_ERROR_JSON", "ok":args_ok, "exitCode":p.returncode})
        if not args_ok: failures.append(results[-1])

        # Exact acceptance discriminators and their legitimate exception controls.
        secret_marker = "SYNTHETIC_SECRET_42"
        code, secret_line = run(
            root,
            "app/api/evidence/route.ts",
            f'const marker="{secret_marker}"; url.searchParams.set("reset_token", token);',
            common,
        )
        serialized_secret_line = json.dumps(secret_line, sort_keys=True)
        token_findings = [item for item in secret_line.get("findings", []) if item["id"] == "S2_TOKEN_IN_QUERY"]
        evidence_ok = (
            code == 0
            and len(token_findings) == 1
            and secret_marker not in serialized_secret_line
            and token_findings[0]["evidence"].startswith("S2_TOKEN_IN_QUERY syntax match at line 1, column ")
        )
        results.append({"id":"I8_SECRET_SAFE_EVIDENCE", "ok":evidence_ok, "exitCode":code,
                        "findingCount":len(token_findings), "evidence":token_findings[0]["evidence"] if token_findings else None,
                        "markerAbsentFromCompleteJson":secret_marker not in serialized_secret_line})
        if not evidence_ok: failures.append(results[-1])

        code, mapbox_mixed = run(
            root,
            "app/api/mapbox-mixed/route.ts",
            'const mapboxDocs="mapbox"; const target=new URL("https://other.example/"); target.searchParams.set("access_token", token);',
            common,
        )
        mapbox_mixed_ok = code == 0 and "S2_TOKEN_IN_QUERY" in ids(mapbox_mixed)
        results.append({"id":"I9_MAPBOX_MIXED_REAL_CANDIDATE", "ok":mapbox_mixed_ok, "exitCode":code,
                        "observedIds":sorted(ids(mapbox_mixed))})
        if not mapbox_mixed_ok: failures.append(results[-1])

        code, mapbox_bound = run(
            root,
            "app/api/mapbox-bound/route.ts",
            'const url = new URL("https://api.mapbox.com"); url.searchParams.set("access_token", token);',
            common,
        )
        mapbox_bound_ok = code == 0 and "S2_TOKEN_IN_QUERY" not in ids(mapbox_bound)
        results.append({"id":"I10_MAPBOX_BOUND_EXCEPTION", "ok":mapbox_bound_ok, "exitCode":code,
                        "observedIds":sorted(ids(mapbox_bound))})
        if not mapbox_bound_ok: failures.append(results[-1])

        code, jsonld_mixed = run(
            root,
            "components/JsonLdMixed.tsx",
            'const structured=safeJsonLd(data); <div dangerouslySetInnerHTML={{__html: body.html}} />',
            common,
        )
        jsonld_mixed_ok = code == 0 and "P3_HTML_SINK" in ids(jsonld_mixed)
        results.append({"id":"I11_JSONLD_MIXED_REAL_CANDIDATE", "ok":jsonld_mixed_ok, "exitCode":code,
                        "observedIds":sorted(ids(jsonld_mixed))})
        if not jsonld_mixed_ok: failures.append(results[-1])

        code, jsonld_bound = run(
            root,
            "components/JsonLdBound.tsx",
            '<script dangerouslySetInnerHTML={{__html: safeJsonLd(data)}} />',
            common,
        )
        jsonld_bound_ok = code == 0 and "P3_HTML_SINK" not in ids(jsonld_bound)
        results.append({"id":"I12_JSONLD_BOUND_EXCEPTION", "ok":jsonld_bound_ok, "exitCode":code,
                        "observedIds":sorted(ids(jsonld_bound))})
        if not jsonld_bound_ok: failures.append(results[-1])

        code, testimonials = run(
            root,
            "supabase/migrations/20260907_testimonials_backfill.sql",
            "update salons set biography=md5(id::text);",
            common,
        )
        testimonials_ok = code == 0 and "S15_MIGRATION_FABRICATION" in ids(testimonials)
        results.append({"id":"I13_TESTIMONIALS_PRODUCTION_CANDIDATE", "ok":testimonials_ok, "exitCode":code,
                        "observedIds":sorted(ids(testimonials))})
        if not testimonials_ok: failures.append(results[-1])

        code, seed_test = run(
            root,
            "supabase/migrations/seed_test.sql",
            "update salons_test set biography=md5(id::text);",
            common,
        )
        seed_test_ok = code == 0 and "S15_MIGRATION_FABRICATION" not in ids(seed_test)
        results.append({"id":"I14_SEED_TEST_BOUND_EXCEPTION", "ok":seed_test_ok, "exitCode":code,
                        "observedIds":sorted(ids(seed_test))})
        if not seed_test_ok: failures.append(results[-1])

        linked_root = root / "symlink-population"
        selected = linked_root / "selected"
        linked = linked_root / "linked"
        selected.mkdir(parents=True)
        linked.mkdir(parents=True)
        (linked / "unsafe.ts").write_text('url.searchParams.set("reset_token", token);', encoding="utf-8")
        (selected / "linked-dir").symlink_to(Path("../linked"), target_is_directory=True)
        cmd = [sys.executable, str(CHECK), "--root", str(root), "--file", "symlink-population/selected"]
        p = subprocess.run(cmd, text=True, capture_output=True,
                           env={"PATH":os.environ.get("PATH", ""), "PYTHONDONTWRITEBYTECODE":"1"})
        symlink_population = json.loads(p.stdout)
        symlink_rel = "symlink-population/selected/linked-dir"
        symlink_ok = (
            p.returncode == 0
            and symlink_population["population"]["discoveredEntries"] == 1
            and symlink_population["population"]["unsupportedEntryCount"] == 1
            and symlink_population["population"]["unsupportedEntries"] == [symlink_rel]
            and symlink_population["population"]["uniqueSupportedFiles"] == 0
            and symlink_population["scannedFiles"] == []
            and symlink_population["findingCount"] == 0
        )
        results.append({"id":"I15_DIRECTORY_SYMLINK_POPULATION", "ok":symlink_ok, "exitCode":p.returncode,
                        "population":symlink_population.get("population"), "scannedFiles":symlink_population.get("scannedFiles")})
        if not symlink_ok: failures.append(results[-1])

        cmd = [sys.executable, str(CHECK), "--root", str(root), "--file", "symlink-population/linked"]
        p = subprocess.run(cmd, text=True, capture_output=True,
                           env={"PATH":os.environ.get("PATH", ""), "PYTHONDONTWRITEBYTECODE":"1"})
        regular_population = json.loads(p.stdout)
        regular_ok = (
            p.returncode == 0
            and regular_population["population"]["discoveredEntries"] == 1
            and regular_population["population"]["unsupportedEntryCount"] == 0
            and regular_population["population"]["uniqueSupportedFiles"] == 1
            and regular_population["scannedFiles"] == ["symlink-population/linked/unsafe.ts"]
            and "S2_TOKEN_IN_QUERY" in ids(regular_population)
        )
        results.append({"id":"I16_REGULAR_DIRECTORY_POPULATION", "ok":regular_ok, "exitCode":p.returncode,
                        "population":regular_population.get("population"), "scannedFiles":regular_population.get("scannedFiles"),
                        "observedIds":sorted(ids(regular_population))})
        if not regular_ok: failures.append(results[-1])

    output = {"status":"ok" if not failures else "failed", "controlCount":len(results),
              "failedCount":len(failures), "failures":failures, "controls":results}
    rendered = json.dumps(output, indent=2, sort_keys=True) + "\n"
    if freeze_evidence:
        candidate_root = HERE.parent
        results_path = candidate_root / "fixture-results.acceptance-repair.json"
        results_path.write_text(rendered, encoding="utf-8")
        artifacts = {
            "check": CHECK,
            "tests": Path(__file__).resolve(),
            "ruleMapping": candidate_root / "rule-mapping.json",
            "rawResults": results_path,
        }
        hashes = {
            name: {"path": str(path), "sha256": sha256(path)}
            for name, path in artifacts.items()
        }
        (candidate_root / "acceptance-repair-hashes.json").write_text(
            json.dumps({"artifacts": hashes}, indent=2, sort_keys=True) + "\n",
            encoding="utf-8",
        )
    print(rendered, end="")
    return 0 if not failures else 1


if __name__ == "__main__":
    raise SystemExit(main(freeze_evidence="--freeze-evidence" in sys.argv[1:]))
