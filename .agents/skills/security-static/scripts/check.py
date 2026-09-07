#!/usr/bin/env python3
"""Bounded, report-only static security candidate scanner."""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Callable

SUPPORTED = {".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".py", ".pyi", ".go", ".sql", ".html", ".htm", ".yml", ".yaml", ".json"}
JS = {".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"}
PY = {".py", ".pyi"}
HTML = {".html", ".htm"}
MUTATING = re.compile(r"export\s+async\s+function\s+(POST|PUT|PATCH|DELETE)\b", re.I)
TOKEN_NAME = r"(?:access_token|tracking_token|invite_token|reset_token|verification_token|token|secret)"
SENSITIVE = {"profiles", "bookings", "reviews", "payments", "payment_intents", "booking_disputes", "barber_walkin_queue", "staff", "users"}
MONEY_COL = r"(?:amount|remaining_amount|payment_status|current_uses|balance|stamps|booked_by|is_active|status)"


@dataclass(frozen=True)
class Finding:
    rule_id: str
    path: str
    line: int
    message: str
    evidence: str
    confidence: str = "syntax_candidate"
    proof_limit: str = "Source syntax does not prove exploitability, authorization, dataflow, runtime behavior, or live database state."

    def as_dict(self) -> dict:
        return {"id": self.rule_id, "path": self.path, "line": self.line, "message": self.message,
                "evidence": self.evidence, "confidence": self.confidence, "proofLimit": self.proof_limit}


def line_of(text: str, pos: int) -> int:
    return text.count("\n", 0, pos) + 1


def structural_evidence(rule_id: str, text: str, match: re.Match) -> str:
    """Describe a match without copying arbitrary source text into output."""
    line = line_of(text, match.start())
    line_start = text.rfind("\n", 0, match.start()) + 1
    column = match.start() - line_start + 1
    end_line = line_of(text, max(match.start(), match.end() - 1))
    if end_line == line:
        return f"{rule_id} syntax match at line {line}, column {column}."
    return f"{rule_id} syntax match starts at line {line}, column {column}, and ends at line {end_line}."


def add(out: list[Finding], rule_id: str, rel: str, text: str, match: re.Match, message: str,
        confidence: str = "syntax_candidate", proof_limit: str | None = None) -> None:
    out.append(Finding(rule_id, rel, line_of(text, match.start()), message,
                       structural_evidence(rule_id, text, match),
                       confidence, proof_limit or Finding.__dataclass_fields__["proof_limit"].default))


def first(pattern: str, text: str, flags: int = 0) -> re.Match | None:
    return re.search(pattern, text, flags)


def is_mapbox_access_token_query(text: str, match: re.Match) -> bool:
    if "access_token" not in match.group(0).lower():
        return False
    receiver = match.groupdict().get("receiver")
    if receiver:
        prefix = text[max(0, match.start() - 600):match.start()]
        assignment = re.compile(
            rf"\b(?:const|let|var)\s+{re.escape(receiver)}\s*=\s*new\s+URL\s*\(\s*"
            r"(?P<quote>['\"])(?P<url>[^'\"]+)\1",
            re.I,
        )
        declarations = list(assignment.finditer(prefix))
        if declarations and re.search(r"^https?://(?:[^/]+\.)?mapbox\.com(?:/|$)", declarations[-1].group("url"), re.I):
            return True
    direct_url = re.compile(
        r"(?P<quote>['\"])(?P<url>https?://(?:[^/'\"]+\.)?mapbox\.com[^'\"]*"
        r"[?&]access_token=\$\{[^'\"]*)\1",
        re.I,
    )
    return any(candidate.start() <= match.start() < candidate.end() for candidate in direct_url.finditer(text))


def html_sink_has_bound_sanitizer(text: str, match: re.Match) -> bool:
    sink = text[match.start():match.start() + 500]
    sanitizer = r"(?:safeJsonLd|DOMPurify\.sanitize|sanitize)"
    sanitizer_patterns = (
        rf"^dangerouslySetInnerHTML\s*=\s*\{{\{{\s*__html\s*:\s*{sanitizer}\s*\(",
        rf"^document\.write\s*\(\s*{sanitizer}\s*\(",
        rf"^\.(?:innerHTML|outerHTML)\s*=\s*{sanitizer}\s*\(",
        rf"^\.insertAdjacentHTML\s*\(\s*[^,]+,\s*{sanitizer}\s*\(",
    )
    if any(re.search(pattern, sink, re.I) for pattern in sanitizer_patterns):
        return True
    return bool(re.search(r"^\.(?:innerHTML|outerHTML)\s*=\s*(?:STATIC_|[A-Z][A-Z0-9_]*)\b", sink))


def is_seed_or_test_migration(rel: str) -> bool:
    parts = [part.lower() for part in Path(rel).parts]
    scoped_directories = {"seed", "seeds", "test", "tests", "fixture", "fixtures", "demo", "demos"}
    if any(part in scoped_directories for part in parts[:-1]):
        return True
    filename_tokens = set(re.split(r"[^a-z0-9]+", Path(parts[-1]).stem))
    return bool(filename_tokens & scoped_directories)


def scan_solen(rel: str, path: Path, text: str, context: dict) -> list[Finding]:
    out: list[Finding] = []
    suffix = path.suffix.lower()
    lowrel = rel.lower()
    scoped_rel = f"/{lowrel}"
    docs_or_fixture = any(x in scoped_rel for x in ("/fixtures/", "/__tests__/", ".test.", ".spec.", "/archive/", "/_archive/"))

    if suffix in JS:
        raw_token = first(rf"\b{TOKEN_NAME}\b\s*:\s*(?!null\b|undefined\b|[^,\n]*(?:hash|digest|encrypt))(?:raw\w*|\w*token\w*|crypto\.randomBytes)", text, re.I)
        if raw_token and re.search(r"\.(?:insert|update|upsert)\s*\(", text):
            add(out, "S1_PLAINTEXT_TOKEN", rel, text, raw_token, "Possible raw capability token persisted in a database write.")

        token_query = first(
            rf"(?:[?&]{TOKEN_NAME}=\$\{{|(?:(?P<receiver>[A-Za-z_$][\w$]*)\.)?"
            rf"\w*[Pp]arams\.set\(\s*['\"]{TOKEN_NAME}['\"]\s*,)",
            text,
            re.I,
        )
        mapbox = bool(token_query and is_mapbox_access_token_query(text, token_query))
        if token_query and not mapbox:
            add(out, "S2_TOKEN_IN_QUERY", rel, text, token_query, "Possible secret or capability token placed in a URL query parameter.")

        gemini_host = first(r"generativelanguage\.googleapis\.com", text, re.I)
        gemini_query = first(r"(?:[?&]key=|\w*[Pp]arams\.set\(\s*['\"]key['\"]\s*,)", text, re.I)
        if gemini_host and gemini_query:
            add(out, "S3_GEMINI_QUERY_KEY", rel, text, gemini_query, "Gemini key appears in URL query syntax; use the x-goog-api-key header.")

        if ("app/api/" in lowrel or lowrel.endswith("route.ts")):
            gs = first(r"\.auth\.getSession\s*\(", text)
            if gs:
                add(out, "S4_SERVER_SESSION", rel, text, gs, "Server route uses getSession; verify identity with getUser before authorization.")

        public_admin = first(r"NEXT_PUBLIC_[A-Z0-9_]*(?:SERVICE_ROLE|ADMIN)[A-Z0-9_]*", text)
        if public_admin and not docs_or_fixture:
            add(out, "S5_RLS_PUBLIC_ADMIN", rel, text, public_admin, "Public environment variable name suggests an admin or service-role secret.")

        if MUTATING.search(text) and first(r"(?:req|request)\.(?:json|text)\s*\(", text):
            if not first(r"(?:\.safeParse\s*\(|\bschema\.parse\s*\(|\bvalidateBody\s*\()", text):
                body = first(r"(?:req|request)\.(?:json|text)\s*\(", text)
                add(out, "S6_BODY_SCHEMA", rel, text, body, "Mutating route reads a body without a recognized schema-validation call.")

        prompt = first(r"(?:system|prompt|instructions?)\s*[:=]\s*`[^`]*\$\{(?:body|input|query|request|user|row|data)\b", text, re.I | re.S)
        if prompt:
            add(out, "S7_AI_UNTRUSTED_PROMPT", rel, text, prompt, "Potential untrusted value interpolated into privileged AI prompt text.")

        admin = first(r"(?:service[_-]?role|createAdminClient|supabaseAdmin|adminClient)", text, re.I)
        write = first(r"\.(?:insert|update|upsert|delete)\s*\(", text)
        request_id = first(r"(?:body|params|searchParams|request|req)\b[^\n]{0,100}\b(?:id|salon_id|user_id|owner_id)\b", text, re.I)
        owner_proof = first(r"(?:\.eq\(\s*['\"](?:user_id|owner_id|salon_id)['\"]|assertOwn|verifyOwn|ownership|authorizedSalon)", text, re.I)
        webhook = first(r"(?:verifySignature|constructEvent|webhook.*signature)", text, re.I)
        if admin and write and request_id and not owner_proof and not webhook:
            add(out, "S8_SERVICE_ROLE_OWNERSHIP", rel, text, write, "Admin/service-role write with request-selected identity and no recognized ownership proof.")

        storage = first(r"\.storage\b[^\n]{0,300}\.(?:upload|update|remove|move|copy)\s*\(", text, re.I | re.S)
        derived_owner_path = first(r"(?:user\.id|salonId|ownerId)[^\n]{0,120}(?:path|bucket|file)|(?:path|bucket|file)[^\n]{0,120}(?:user\.id|salonId|ownerId)", text, re.I)
        if admin and storage and request_id and not (owner_proof or derived_owner_path or webhook):
            add(out, "S9_STORAGE_OWNERSHIP", rel, text, storage, "Admin storage mutation may use a request-selected path without ownership proof.")

        money_route = any(x in lowrel for x in ("payment", "refund", "tip", "booking", "stripe", "charge", "payout"))
        money_write = first(rf"\.(?:insert|update|upsert)\s*\([^)]*\b{MONEY_COL}\b\s*:", text, re.I | re.S)
        verified_actor = first(r"(?:auth\.getUser\s*\(|verifySignature|constructEvent|webhook.*signature)", text, re.I)
        if money_route and money_write and not verified_actor:
            add(out, "S10_MONEY_AUTH", rel, text, money_write, "Money/state route mutation has no recognized verified actor or signed-webhook proof.")

        for update in re.finditer(r"\.update\s*\((?P<body>[\s\S]{0,1200}?)\)(?P<chain>[\s\S]{0,500}?)(?:;|$)", text):
            body, chain = update.group("body"), update.group("chain")
            if re.search(rf"\b{MONEY_COL}\b\s*[:,}}]", body, re.I):
                has_prior = re.search(r"\.eq\s*\(\s*['\"](?:status|payment_status|version|updated_at|booked_by)['\"]", chain, re.I)
                observes = re.search(r"\.(?:select|maybeSingle|single)\s*\(", chain)
                if not (has_prior and observes):
                    add(out, "S11_MONEY_CAS", rel, text, update, "Money/state update lacks a recognized prior-state predicate and returned-row observation.")

        pg_filter = first(r"\.(?:or|like|ilike)\s*\([^)]*(?:\$\{|\+\s*(?:query|input|body|term|search)|(?:query|input|body|term|search)\s*\+)", text, re.I | re.S)
        if pg_filter:
            add(out, "S12_POSTGREST_FILTER", rel, text, pg_filter, "Possible untrusted interpolation into PostgREST filter syntax.")

        scan_selects(out, rel, text, context)

        bad_price = first(r"(?:\b(?:ab|from|d[eè]s|da)\s+(?:CHF\s*)?(?:\d|\{(?:price|amount|min(?:Price|Amount|Fee|Cost|Total))\})|<PriceFrom\b[^>]*\blabel\s*=\s*['\"](?:ab|from|d[eè]s|da)['\"])", text, re.I)
        price_scope = any(x in scoped_rel for x in ("/app/", "/components/", "/messages/"))
        price_exempt = any(x in scoped_rel for x in ("/_mockups/", "/dev/", "/scripts/", "/__tests__/")) or "pbv-ok:" in text
        if bad_price and price_scope and not price_exempt:
            add(out, "S16_LEGAL_PRICE", rel, text, bad_price, "Customer-facing from-price syntax needs current legal/localized treatment.")

    if suffix == ".sql" and "migration" in lowrel:
        rls = first(r"DISABLE\s+ROW\s+LEVEL\s+SECURITY", text, re.I)
        if rls:
            add(out, "S5_RLS_PUBLIC_ADMIN", rel, text, rls, "Migration disables row-level security.")
        fabrication = first(r"\b(?:update|insert\s+into)\s+([\w.]+)[\s\S]{0,1800}?\b(?:hashtext|md5|random|gen_random_uuid)\s*\(", text, re.I)
        seed_scope = is_seed_or_test_migration(rel)
        repair = bool(re.search(r"\bthen\s+null\b", text, re.I))
        advisory_only = "pg_advisory" in text and not re.search(r"\bset\b[\s\S]{0,500}\b(?:hashtext|md5|random|gen_random_uuid)\s*\(", text, re.I)
        if fabrication and not (seed_scope or repair or advisory_only):
            add(out, "S15_MIGRATION_FABRICATION", rel, text, fabrication, "Production migration appears to synthesize business-row values from random/hash/UUID data.")

    if suffix == ".json":
        bad_price = first(r"\b(?:ab|from|d[eè]s|da)\s+(?:CHF\s*)?(?:\d|\{(?:price|amount|min(?:Price|Amount|Fee|Cost|Total))\})", text, re.I)
        if bad_price and "/messages/" in scoped_rel:
            add(out, "S16_LEGAL_PRICE", rel, text, bad_price, "Localized from-price syntax needs current legal treatment.")
    return out


def scan_selects(out: list[Finding], rel: str, text: str, context: dict) -> None:
    columns = context.get("columns") or {}
    snapshot_state = context["schemaState"]
    allow = context.get("allowlist", set())
    for m in re.finditer(r"\.from\(\s*['\"](?P<table>[\w.]+)['\"]\s*\)[\s\S]{0,500}?\.select\(\s*(?P<q>[`'\"])(?P<select>[\s\S]{0,400}?)\2\s*\)", text):
        table, selection = m.group("table"), m.group("select")
        if (selection.strip() == "*" or re.search(r"\b\w+(?:![\w]+)?\(\s*\*\s*\)", selection)) and table in SENSITIVE and rel not in allow:
            add(out, "S14_SENSITIVE_SELECT_STAR", rel, text, m, f"Sensitive table `{table}` uses star selection and is not in the current allowlist.")
        literal_cols = [x.strip() for x in selection.split(",") if re.fullmatch(r"[A-Za-z_][\w]*", x.strip())]
        if literal_cols and table in columns:
            missing = [c for c in literal_cols if c not in columns[table]]
            if missing:
                add(out, "S13_PHANTOM_COLUMN", rel, text, m,
                    f"Columns absent from the provided `{table}` snapshot entry: {', '.join(missing)}.",
                    "snapshot_candidate",
                    f"Local schema snapshot state is `{snapshot_state}`; this does not prove live schema absence.")

    for m in re.finditer(r"\.from\(\s*['\"](?P<table>[\w.]+)['\"]\s*\)[\s\S]{0,300}?\.select\(\s*\)", text):
        if m.group("table") in SENSITIVE and rel not in allow:
            add(out, "S14_SENSITIVE_SELECT_STAR", rel, text, m, "Sensitive table uses bare select(), which defaults to all columns.")


def scan_plugin(rel: str, path: Path, text: str) -> list[Finding]:
    out: list[Finding] = []
    suffix = path.suffix.lower()
    lowrel = rel.lower()
    fixture = any(x in lowrel for x in ("/fixtures/", "/__tests__/", ".test.", ".spec.", "/archive/", "/_archive/"))

    if suffix in {".yml", ".yaml"} and ".github/workflows/" in f"/{lowrel}":
        direct = first(r"run\s*:[^\n]*(?:\$\{\{\s*github\.(?:event|head_ref)[^}]*\}\})", text, re.I)
        bad_ref = first(r"ref\s*:\s*[^\n]*\$\{\{\s*github\.(?:event\.client_payload|head_ref)", text, re.I)
        if direct:
            add(out, "P1_WORKFLOW_INJECTION", rel, text, direct, "Untrusted GitHub event expression is interpolated directly into a run command.")
        if bad_ref and not re.search(r"\^\[0-9\]\+\$|fromJSON\(|validate", text, re.I):
            add(out, "P1_WORKFLOW_INJECTION", rel, text, bad_ref, "Attacker-controlled ref expression has no recognized validation evidence.")

    if suffix in JS:
        code = first(r"(?:child_process\.exec|\bexecSync\s*\(|(?<![\w.])exec\s*\(|\bnew\s+Function\s*\(|(?<![\w.])eval\s*\()", text)
        if code:
            add(out, "P2_CODE_EXECUTION", rel, text, code, "Dynamic or shell code-execution sink requires input-provenance review.")

        html = first(r"dangerouslySetInnerHTML|document\.write\s*\(|\.(?:innerHTML|outerHTML)\s*=|\.insertAdjacentHTML\s*\(", text)
        safe_html = bool(html and html_sink_has_bound_sanitizer(text, html))
        if html and not safe_html:
            add(out, "P3_HTML_SINK", rel, text, html, "HTML-writing sink lacks nearby recognized sanitization or trusted-static evidence.")

        shell = first(r"subprocess\.(?:run|call|Popen|check_output|check_call)\([^\n]*shell\s*=\s*True", text)
        if shell:
            add(out, "P5_SHELL_EXECUTION", rel, text, shell, "Shell-enabled subprocess sink requires input-provenance review.")

    if suffix in PY:
        deser = first(r"(?:\bpickle\.(?:load|loads|Unpickler)\b|\b(?:cPickle|cloudpickle|dill)\.(?:load|loads)\s*\(|\bmarshal\.loads?\s*\(|\bshelve\.open\s*\(|\bjoblib\.load\s*\(|\b(?:pd|pandas)\.read_pickle\s*\(|\b(?:np|numpy)\.load\s*\([^\n)]*allow_pickle\s*=\s*True|\btorch\.load\s*\((?![^\n)]*weights_only\s*=\s*True))", text)
        if deser:
            add(out, "P4_PYTHON_DESERIALIZATION", rel, text, deser, "Unsafe-deserialization sink requires input-trust review.")
        shell = first(r"\bos\.system\s*\(|\bsubprocess\.(?:run|call|Popen|check_output|check_call)\([^\n]*shell\s*=\s*True|from\s+os\s+import\s+system", text)
        if shell:
            add(out, "P5_SHELL_EXECUTION", rel, text, shell, "Shell execution requires input-provenance review.")
        yaml = first(r"\byaml\.(?:load|unsafe_load)\s*\(", text)
        if yaml and not re.search(r"\byaml\.safe_load\s*\(", text):
            add(out, "P6_PYTHON_YAML", rel, text, yaml, "Python YAML loader may construct unsafe objects; use safe_load plus validation.")
        xml = first(r"\b(?:xml\.etree\.ElementTree|ElementTree|ET)\.(?:parse|fromstring|XML)\s*\(|\bminidom\.(?:parse|parseString)\s*\(|\bxml\.sax\.(?:parse|make_parser)\b", text)
        if xml and "defusedxml" not in text:
            add(out, "P8_UNSAFE_XML", rel, text, xml, "Standard-library XML parser requires input-trust review; prefer defusedxml for untrusted XML.")

    if suffix == ".go":
        shell = first(r"exec\.Command\(\s*['\"](?:sh|bash|/bin/sh|/bin/bash)['\"]", text)
        if shell:
            add(out, "P5_SHELL_EXECUTION", rel, text, shell, "Go command launches a shell interpreter; review all arguments as injection candidates.")

    weak = first(r"\bcrypto\.(?:createCipher|createDecipher)\b|\bAES\.MODE_ECB\b|\bmodes\.ECB\s*\(|['\"]aes-\d+-ecb['\"]|\bverify\s*=\s*False\b|rejectUnauthorized\s*:\s*false|InsecureSkipVerify\s*:\s*true|NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*['\"]?0|ssl\._create_unverified_context|check_hostname\s*=\s*False", text)
    if weak and not fixture:
        add(out, "P7_WEAK_CRYPTO_TLS", rel, text, weak, "Weak cryptography or disabled TLS verification syntax requires review.")

    if suffix in HTML:
        for script in re.finditer(r"<script\s+[^>]*src\s*=\s*['\"](?:https?:)?//[^'\"]+['\"][^>]*>", text, re.I):
            if not re.search(r"\bintegrity\s*=", script.group(0), re.I) and not fixture:
                add(out, "P9_EXTERNAL_SCRIPT_SRI", rel, text, script, "Remote script tag has no Subresource Integrity attribute.")
    return out


def resolve_targets(root: Path, requested: list[str], max_entries: int) -> tuple[list[Path], dict]:
    files: list[Path] = []
    unsupported: list[str] = []
    discovered = 0
    explicit_unsupported: list[str] = []
    for raw in requested:
        candidate = Path(raw)
        if not candidate.is_absolute():
            candidate = root / candidate
        if candidate.is_symlink():
            raise ValueError(f"symlink target is not allowed: {raw}")
        resolved = candidate.resolve(strict=True)
        if resolved != root and root not in resolved.parents:
            raise ValueError(f"target outside root: {raw}")
        if resolved.is_file():
            discovered += 1
            if discovered > max_entries:
                raise ValueError(f"target population exceeds --max-entries={max_entries}")
            if resolved.suffix.lower() not in SUPPORTED:
                explicit_unsupported.append(str(resolved.relative_to(root)))
            else:
                files.append(resolved)
        elif resolved.is_dir():
            for base, dirs, names in os.walk(resolved, followlinks=False):
                retained_dirs = []
                for name in sorted(dirs):
                    directory = Path(base) / name
                    if directory.is_symlink():
                        discovered += 1
                        if discovered > max_entries:
                            raise ValueError(f"target population exceeds --max-entries={max_entries}")
                        unsupported.append(str(directory.relative_to(root)))
                    else:
                        retained_dirs.append(name)
                dirs[:] = retained_dirs
                for name in sorted(names):
                    discovered += 1
                    if discovered > max_entries:
                        raise ValueError(f"target population exceeds --max-entries={max_entries}")
                    p = Path(base) / name
                    rel = str(p.relative_to(root))
                    if p.is_symlink() or p.suffix.lower() not in SUPPORTED:
                        unsupported.append(rel)
                    else:
                        files.append(p.resolve(strict=True))
        else:
            raise ValueError(f"target is neither file nor directory: {raw}")
    if explicit_unsupported:
        raise ValueError("explicit unsupported file(s): " + ", ".join(explicit_unsupported))
    unique = sorted(set(files), key=lambda p: str(p.relative_to(root)))
    return unique, {"requestedTargets": requested, "discoveredEntries": discovered,
                    "supportedSelections": len(files), "uniqueSupportedFiles": len(unique),
                    "duplicateSelections": len(files) - len(unique), "unsupportedEntries": unsupported,
                    "unsupportedEntryCount": len(unsupported)}


def load_context(args, root: Path) -> tuple[dict, list[dict]]:
    context: dict = {"columns": None, "allowlist": set(), "schemaState": "absent"}
    unverified: list[dict] = []
    if args.schema_max_age_hours is not None and not args.schema_snapshot:
        raise ValueError("--schema-max-age-hours requires --schema-snapshot")
    if args.schema_snapshot:
        p = (root / args.schema_snapshot).resolve() if not Path(args.schema_snapshot).is_absolute() else Path(args.schema_snapshot).resolve()
        if p != root and root not in p.parents:
            raise ValueError("schema snapshot outside root")
        raw = json.loads(p.read_text(encoding="utf-8"))
        columns = raw.get("columns") if isinstance(raw, dict) else None
        if not isinstance(columns, dict) or not all(isinstance(v, list) for v in columns.values()):
            raise ValueError("schema snapshot must contain an object-valued `columns` map of arrays")
        context["columns"] = {str(k): {str(x) for x in v} for k, v in columns.items()}
        if args.schema_max_age_hours is None:
            context["schemaState"] = "provided_freshness_unverified"
            unverified.append({"id":"S13_PHANTOM_COLUMN","reason":"schema snapshot provided without --schema-max-age-hours; freshness not evaluated"})
        else:
            age = max(0.0, (dt.datetime.now(dt.timezone.utc).timestamp() - p.stat().st_mtime) / 3600)
            context["schemaAgeHours"] = round(age, 3)
            if age > args.schema_max_age_hours:
                context["schemaState"] = "stale_by_filesystem_mtime"
                unverified.append({"id":"S13_PHANTOM_COLUMN","reason":f"schema snapshot age {age:.3f}h exceeds threshold {args.schema_max_age_hours}h"})
            else:
                context["schemaState"] = "mtime_within_caller_threshold"
                unverified.append({"id":"S13_PHANTOM_COLUMN","reason":"filesystem mtime is within caller threshold, but no live database comparison was performed"})
    else:
        unverified.append({"id":"S13_PHANTOM_COLUMN","reason":"no schema snapshot supplied"})
    if args.select_star_allowlist:
        p = (root / args.select_star_allowlist).resolve() if not Path(args.select_star_allowlist).is_absolute() else Path(args.select_star_allowlist).resolve()
        if p != root and root not in p.parents:
            raise ValueError("select-star allowlist outside root")
        raw = json.loads(p.read_text(encoding="utf-8"))
        if not isinstance(raw, list):
            raise ValueError("select-star allowlist must be an array")
        values = set()
        for item in raw:
            if isinstance(item, str):
                values.add(item)
            elif isinstance(item, dict) and isinstance(item.get("path"), str):
                values.add(item["path"])
            else:
                raise ValueError("select-star allowlist entries must be strings or objects with a string `path`")
        context["allowlist"] = values
    return context, unverified


class JsonArgumentParser(argparse.ArgumentParser):
    def error(self, message: str) -> None:
        raise ValueError(message)


def parse_args(argv: list[str]) -> argparse.Namespace:
    p = JsonArgumentParser(description=__doc__)
    p.add_argument("--root", required=True)
    p.add_argument("--file", action="append", required=True, dest="files")
    p.add_argument("--max-entries", type=int, default=2000)
    p.add_argument("--schema-snapshot")
    p.add_argument("--schema-max-age-hours", type=float)
    p.add_argument("--select-star-allowlist")
    return p.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    try:
        args = parse_args(argv or sys.argv[1:])
        root = Path(args.root).resolve(strict=True)
        if not root.is_dir() or args.max_entries < 1:
            raise ValueError("--root must be a directory and --max-entries must be positive")
        files, population = resolve_targets(root, args.files, args.max_entries)
        context, unverified = load_context(args, root)
        contents: list[tuple[str, Path, str]] = []
        for path in files:
            rel = str(path.relative_to(root))
            contents.append((rel, path, path.read_text(encoding="utf-8")))
        findings: list[Finding] = []
        for rel, path, source in contents:
            findings.extend(scan_solen(rel, path, source, context))
            findings.extend(scan_plugin(rel, path, source))
        findings.sort(key=lambda f: (f.path, f.line, f.rule_id, f.evidence))
        result = {"status":"review_required" if findings or unverified else "no_candidates",
                  "mode":"report_only", "root":str(root), "population":population,
                  "scannedFiles":[rel for rel, _, _ in contents], "findingCount":len(findings),
                  "findings":[f.as_dict() for f in findings], "unverified":unverified,
                  "limits":["No live database, runtime, authorization, exploitability, or dataflow proof was performed.",
                            "No finding blocks an edit; contextual security review owns disposition."]}
        print(json.dumps(result, indent=2, sort_keys=True))
        return 0
    except SystemExit:
        raise
    except Exception as exc:
        print(json.dumps({"status":"error", "error":str(exc), "findings":[], "partialResults":False}, sort_keys=True))
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
