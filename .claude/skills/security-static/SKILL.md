---
name: security-static
description: Scan explicitly selected source files for Solen security, data, and price-risk syntax and general code-execution, XSS, unsafe-deserialization, workflow-injection, crypto, TLS, XML, and external-script candidates. Use for a bounded report before security review, not to prove exploitability, authorization, live schema, or runtime safety.
---

# Security static scan

Run the scanner only on an explicit root and explicit file or directory targets. It reads source and writes one JSON document to stdout. It never edits the target, calls a model, queries a database, accesses the network, or blocks an edit.

```bash
python3 .claude/skills/security-static/scripts/check.py --root "$PWD" --file app/api/example/route.ts
python3 .claude/skills/security-static/scripts/check.py --root "$PWD" --file app/api --file supabase/migrations --schema-snapshot _inventory/_db-columns.json --schema-max-age-hours 24 --select-star-allowlist scripts/select-star-allowlist.json
```

Run those examples from the project root and replace the example targets with the actual changed paths. Treat every finding as a syntax or sink candidate. Inspect source, actor ownership, input provenance, sanitization, transaction behavior, current schema, and applicable exceptions before deciding severity. A clear report is not a security PASS.

The scanner rejects targets outside the root and explicit unsupported files. Directory traversal is bounded, does not follow symlinks, lists unsupported entries, normalizes duplicate targets, and reads all supported files before emitting findings. Any target/read/configuration error produces one error JSON document and no partial findings.

Schema comparison is local snapshot evidence only. With no snapshot, invalid snapshot, no freshness threshold, or an older filesystem mtime than the supplied threshold, `S13_PHANTOM_COLUMN` is explicitly unverified. Never present it as live database proof. The current select-star allowlist remains the exception owner for `S14_SENSITIVE_SELECT_STAR`.

Current exceptions include Mapbox public `access_token`, Gemini's `x-goog-api-key` header, `safeJsonLd`, reviewed static SVG, explicit seed/test migrations, fixed trusted commands/XML reported for contextual review, JavaScript `js-yaml`, and visible ink keyboard focus. The scanner has no focus-ring prohibition.

Use `.claude/skills/security-static/scripts/test_check.py` from the project root only when changing the scanner's isolated synthetic fixtures or behavior.
