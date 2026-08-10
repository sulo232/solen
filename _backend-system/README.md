# `_backend-system/` , the backend law layer

<!-- exists-check 2026-07-16: net-new. `npm run exists backend` = 18 hits, all graveyard entries + 2 RPCs, zero law-layer hit. This folder duplicates nothing: `_docs/BACKEND.md` is DESCRIPTIVE (how our systems currently work, file:line grounded), the `_rules/*` files are partial undated fragments at precedence tier 8, and the nine `_plans/*_BACKEND_AUDIT.md` files are dated findings, not principles. The only net-new thing here is the PRESCRIPTIVE layer: what a backend decision SHOULD be, why, and whether we follow it. -->

**Why this exists (owner, 2026-07-16):** "we have a taste bible for the front end, maybe make one for the back end, because it keeps making stuff up when I open a new session."

That is a precise diagnosis. A fresh session opening this repo can learn *how our plumbing works* from `_docs/BACKEND.md`, but nothing anywhere tells it what to **decide**. So it decides from training memory, which is how you get an invented error shape, a re-litigated primary-key choice, a fabricated rate-limit policy, or a "best practice" that was current three years ago. This folder is the answer: the decisions, frozen, dated, and sourced.

## The layer map (mirrors `_design-system/` one-for-one)

| Frontend (taste) | Backend (this folder) | Holds |
|---|---|---|
| `_design-system/SOURCE.md` | **`_docs/BACKEND.md`** (not here, already existed) | HOW it works today, descriptive, file:line grounded |
| `_design-system/LOCKFILE.md` | **`LAW.md`** | The frozen WHAT. One locked row per axis. Do not reopen a row without the owner saying so by name. |
| `_design-system/RATIONALE.md` | **`RATIONALE.md`** | The WHY. Forces, tradeoffs, the mechanic, the source, the evidence tier. Never a lever to reopen a lock. |
| `_design-system/research/*.md` | **`research/<slug>.md`** | The 15 deep primary-sourced research files behind the law |
| (`_plans/*_AUDIT.md`) | **`AUDIT_2026-07-16.md`** + `audit/<slug>.md` | Solen today vs each law: MATCH / PARTIAL / GAP / UNKNOWN, with evidence and a ranked recommendation |
| `_design-system/QUESTIONS.md` | **`QUESTIONS.md`** | The forks only the owner can settle |

## The 16 topics (owner's original 15, plus `privacy-data-protection` added 2026-07-27 per privacy-compliance-01: the owner's own diagnosis for why this folder exists, "it keeps making stuff up when I open a new session," applied with full force to privacy and had no topic file at all)

`data-modeling` · `transactions-concurrency` · `migrations` · `backup-recovery` · `authn` · `authz` · `api-design` · `security` · `rate-limiting` · `file-storage` · `jobs-async` · `webhooks` · `caching` · `observability` · `reliability` · `privacy-data-protection`

## Evidence tiers (same vocabulary as `_design-system/RATIONALE.md` section 0)

| Tier | Meaning |
|---|---|
| **T1** | Formal standard or replicated consensus: an RFC, NIST SP 800-63B, OWASP Top 10, official Postgres/Stripe docs, a peer-reviewed paper |
| **T2** | One strong source, or two independent sources converging |
| **T3** | Directional only: vendor blog, single benchmark, popularized claim with a defensible core. Verify on our own data before trusting the magnitude. |
| **CONV** | A named convention: a coordination device with a domain of validity, not an empirical truth |
| **MYTH** | Debunked, stale, or fabricated. Named explicitly so nobody cites it again. |

A rule with no source is folklore. A rule with no stated cost is a slogan. Both are banned here.

## How to use this in a new session

1. Read `LAW.md`. It is short by design and it is the answer to "what do we do about X".
2. Need the reasoning, or want to argue with a rule? `RATIONALE.md`, then `research/<topic>.md`.
3. Need to know whether we actually FOLLOW the rule today? `AUDIT_2026-07-16.md`.
4. Need to know how the existing system is wired? `_docs/BACKEND.md`. That doc and this folder are complements, not rivals: it says what IS, this says what SHOULD BE.

## Precedence

This folder slots into the project precedence chain at the same tier as the CLAUDE.md pinned blocks for backend matters: **owner's live ask > hooks/gates > `LAW.md` frozen rows > this folder's rationale > `_rules/*` legacy fragments**. Where `LAW.md` and an old `_rules/*` line disagree, `LAW.md` wins and the `_rules` line is history. Where `LAW.md` and the live owner disagree, the owner wins and the row gets re-dated.

**Scale caveat, load-bearing:** Solen runs ~28 salons. Most published backend advice is written for companies three orders of magnitude larger. Every research file carries a "Premature at our scale" section naming what we should NOT adopt yet and the trigger that would change that. Adopting big-company machinery early is itself a failure mode, not caution.
