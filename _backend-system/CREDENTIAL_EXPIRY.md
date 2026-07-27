# Credential expiry table

secrets-webhooks-03: every credential with a known or foreseeable expiry lives
HERE, in a machine-readable table, not only in a memory file or a paragraph of
prose. `scripts/check-credential-expiry.mjs` parses this exact table shape and
runs monthly via `.github/workflows/credential-expiry-check.yml`, opening a
GitHub issue when a row is within 30 days of expiry (and again inside 7 days).
A credential's expiry date must never live solely in a chat memory file with
no automated trigger.

Add a row here the moment you learn a credential has a hard or foreseeable
expiry. Table columns are fixed; the checker script depends on this exact
shape (`| Credential | Expiry (ISO) | Re-mint command | Owner |`).

| Credential | Expiry (ISO) | Re-mint command | Owner |
|---|---|---|---|
| Apple Sign-in client secret (`APPLE_CLIENT_SECRET`, Supabase Auth > Providers > Apple) | 2026-12-30 | `node scripts/mint-apple-secret.mjs <p8-file> 54C4J53STX ch.solen.web TCW6MHM3UW`, then paste the output into Supabase Dashboard > Authentication > Providers > Apple > Secret Key | founder |

## Why this table and not just the memory file

The Apple client-secret JWT expiry (2026-12-30) previously lived only in a
Claude Code memory file (`project_money_features_shipped.md`) and a prose
sentence in `_docs/BACKEND.md` line 98, both requiring a human to remember to
check them. Neither is a system that surfaces the deadline on its own the way
a build failure or a lint error would. This table plus the monthly workflow
closes that gap for THIS credential and any future one added here.

## What does NOT belong here

Credentials with no foreseeable expiry (Stripe/Supabase/Resend live API keys,
`CRON_SECRET`, the HMAC secrets) do not get a row: they never expire on their
own, they only need periodic ROTATION, which is a separate cadence documented
in `_backend-system/LAW.md` section 8 (secrets storage row), not a hard
deadline. A row here is only for a credential that WILL stop working on a
known date regardless of whether anyone rotates it.
