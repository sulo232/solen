# Email escaping checker

Generated: 2026-08-23T15:42:46.124Z
Files scanned: 1  Files missing: none

Static source scan (no browser, no type-checker) for a typed value (a salon name, a service
name, a customer name, and the other names in TYPED_VALUES in scripts/check-email-escaping.mjs)
interpolated raw into an HTML line of a lib/email.ts template, with escapeHtml() not applied.
See the file header of scripts/check-email-escaping.mjs for the full rule and why a subject
line, a plain-text body, a date, a price, and a url are never flagged.

Total raw findings: 0

Fix shape: wrap the flagged value in the escapeHtml() already defined at the top of
lib/email.ts, e.g. `${vars.salon}` becomes `${escapeHtml(vars.salon)}`. Do NOT wrap a
subject field, a text (plain-text) field, a date, a price, or a url: none of those are an
HTML render context, and escaping a subject line breaks the recipient's inbox display
instead of protecting it.

---
No raw typed-value interpolations found.
