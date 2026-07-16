# Backup & recovery , researched law

Status: researched 2026-07-16. 15 sources fetched this run (list at the bottom, with what each established). Written for whoever owns Solen's backend next: an engineer with no memory of this session, deciding what to build or leave alone around backups, PITR, and disaster recovery.

Solen today, verified live this run: Supabase project `tocfnsmxmdxkrcmjzzdw`, region eu-west-2, Postgres 17.6.1, ~28 salons, real money moving through Stripe Connect. `pitr_enabled=false` and the platform daily-backups list is EMPTY (re-verified this run via `list_projects`/`get_project`, matches the 2026-07-11 finding already on record in `_plans/OPS_RUNBOOK.md`). The only restorable backup that exists today is an in-house nightly export (`lib/backup/export.ts`, `app/api/cron/db-backup/route.ts`) of 24 of the DB's 146 live tables (16% of tables, chosen as "business-critical") to a private Supabase Storage bucket, 14-day retention, and **the restore procedure has never been executed end to end** (`scripts/db-backup-kill-test.ts` proves the export path only, not restore).

---

## 0. The short version

1. **An untested backup is not a backup.** [T1, CISA/NIST-aligned industry consensus] Run one real restore drill now, before writing anything else. Solen has a documented restore procedure (`_plans/OPS_RUNBOOK.md`) that has never been executed. That is the single highest-value, lowest-cost fix in this whole document.
2. **RPO and RTO are numbers you write down, not vibes.** [T1, NIST SP 800-34 Rev.1] Solen's actual current RPO is "up to 24h plus detection time" (nightly export cadence) and RTO is unmeasured (nobody has timed a restore). Both should be explicit committed numbers in `_plans/OPS_RUNBOOK.md`, not implied.
3. **PITR and logical dumps solve different problems; you cannot get PITR from `pg_dump`.** [T1, Postgres docs] `pg_dump`/`pg_dumpall` (what Solen's in-house export effectively is, at the row level) cannot replay to an arbitrary second. Only a physical base backup plus continuously archived WAL can.
4. **On Supabase, PITR is entirely platform-managed.** [T1, Supabase docs, this run] You cannot run your own WAL archiving against a Supabase Postgres instance, there is no filesystem/WAL access. The only way to get PITR is Supabase's own paid add-on (Pro/Team/Enterprise, ~$100/mo per 7-day window).
5. **Solen's nightly export backs up 24 of 146 tables (16%).** [Verified live this run against `_inventory/_db-snapshot.json`] That is a deliberate business-critical subset, not an oversight, but it means anything outside that list (122 tables) has zero application-level backup today, only whatever Supabase's own platform backup gives you, which today is nothing (`pitr_enabled=false`, empty backups list).
6. **Encryption at rest is Supabase's default and cannot be turned off** [T2, Supabase's own security page] (AES-256, always on). This is not something Solen configured and gets no credit for; it also means encryption is not currently a control against an attacker with your Supabase credentials, only against physical disk theft.
7. **The real ransomware exposure for Solen is credential compromise, not disk theft.** [Reasoned from T1 CISA/NIST guidance applied to our architecture] A leaked service-role key can read AND delete the live DB and the backup bucket in the same blast radius, because both are reached through the same admin client. Immutability (WORM storage) is the standard defense and Supabase Storage does not support it.
8. **GDPR/nFADP erasure and backup retention are allowed to coexist** [T2, ICO interpretive guidance, converging secondary sources] as long as backed-up personal data is "put beyond use" until natural rotation, not immediately scrubbed. Solen's 14-day export retention is short enough that this is a non-issue in practice, but it should be a documented, not accidental, position.
9. **Stripe is its own independent system of record for money.** [Verified from our own codebase, `_docs/BACKEND.md`] Bookings/salon_payouts in Postgres are a derived/synced view of Stripe PaymentIntents via a single webhook. A total Postgres loss does not lose the underlying financial ledger, Stripe still has it and could in principle be reconciled against, but Solen has no tooling today to do that reconciliation from scratch.
10. **PITR is close to a rounding error at Solen's current scale ($100/mo, DB is a few MB), but the recommendation is still "not yet" for a stated reason, not "no."** See "Premature at our scale" below for the actual trigger to revisit.

---

## 1. Point-in-time recovery: WAL archiving, base backups, how PITR actually works

**The question.** What does "PITR" concretely mean at the Postgres level, and why can't a nightly JSON export or `pg_dump` give you the same guarantee?

**What the evidence says.**

Postgres's own docs [T1, fetched: [postgresql.org/docs/17/continuous-archiving.html](https://www.postgresql.org/docs/17/continuous-archiving.html)] describe PITR as the combination of two things:

- **A base backup**: a full copy of the data directory at a point in time, taken with `pg_basebackup` or the low-level `pg_backup_start()`/`pg_backup_stop()` API.
- **Continuously archived WAL (Write-Ahead Log)**: every change to the database is first written to WAL segment files (normally 16MB each) before being applied to the actual data files. An `archive_command` is configured to copy each completed WAL segment somewhere durable as it's produced.

Recovery works by restoring the base backup, then replaying WAL forward from that point via a `restore_command`, stopping at whatever `recovery_target_time` / `recovery_target_xid` / `recovery_target_name` you specify. This is what "recover to any second" actually means mechanically: WAL replay can be halted at an arbitrary transaction boundary, not just at the moment of the last full backup.

The critical limitation, stated directly in the docs: **`pg_dump` and `pg_dumpall` cannot be used as part of a continuous-archiving solution**, because a logical dump has no relationship to WAL and cannot be combined with WAL replay. If your backup mechanism is a `SELECT * FROM table` export (which is what Solen's `lib/backup/export.ts` does, row by row, table by table), you structurally cannot achieve second-level PITR from it no matter how often you run it. The only way to shrink the "how much do we lose" window below your export cadence is real WAL-based PITR.

Postgres 17 (which is what Solen runs, confirmed via `mcp__claude_ai_Supabase__get_project` this run: `17.6.1`) also added incremental base backups (`pg_basebackup --incremental`), reducing the storage/time cost of frequent physical backups, but this is irrelevant to Solen directly since Supabase, not Solen, owns the physical backup layer.

**On managed Postgres (Supabase), you don't get to do any of this yourself.** Supabase's own engineering blog post [T1, fetched: [supabase.com/blog/postgres-point-in-time-recovery](https://supabase.com/blog/postgres-point-in-time-recovery)] confirms their PITR implementation is physical base backups plus WAL archived via **WAL-G** (an open-source archival tool), with WAL shipped at two-minute intervals or faster. There is no customer-facing filesystem or WAL access: you enable PITR in the dashboard, and restore is a dashboard action, not a CLI/API call.

**Where the tradeoff lies.** PITR (via Supabase's add-on) buys you second-level granularity and protection against "oops, a migration or a bad `DELETE` corrupted data 6 hours ago and nobody noticed until now" (a much more common real-world incident than total infrastructure loss). Daily backups or a nightly export only let you go back to whole-day boundaries, so anything written and then corrupted within the same day is unrecoverable by definition. The cost is $100/mo minimum (7-day retention tier) plus a "Small" compute add-on requirement, and it's billed hourly and NOT covered by Supabase's spend cap, so once it's on, cost discipline matters.

**Recommended default for Solen: not yet, for a stated reason (see section 6 and "Premature at our scale"), but the in-house export is not a substitute and should not be described as one.**

---

## 2. Restore drills: an untested backup is not a backup

**The question.** Does Solen actually know its documented restore procedure works, and how long it takes?

**What the evidence says.**

This is treated as settled, near-universal operational wisdom rather than a single formal standard, but it converges from multiple independent authoritative directions:

- NIST SP 800-34 Rev. 1 [T1, fetched and read directly from the PDF: [nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-34r1.pdf](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-34r1.pdf)] requires, for even low-impact federal systems, that the contingency plan be tested **at least annually**, with an explicit sign-off template: *"I further attest that this ISCP for {system name} will be tested at least annually."* Testing must include, verbatim from the standard: "System recovery on an alternate platform from backup media" and "Restoration of normal operations", not just a tabletop discussion for anything above low impact.
- CISA's own consumer/business guidance (confirmed via converging secondary sources after CISA's own pages returned HTTP 403 to direct fetch this run, see Unverified) recommends testing restoration regularly and specifically verifying you can roll back at least seven days if needed.

**The specific failure mode this catches:** a backup job can report success (200 OK, file written, cron ran green) while the *restore* path is broken, because writing and reading exercise completely different code paths, permissions, and assumptions. Solen's own kill-test script (`scripts/db-backup-kill-test.ts`) proves exactly this half: it proves the *export* function runs end-to-end cleanly and leaves no partial state. It does not touch the restore path at all. So today, Solen has verified the "backup" half and left the "recovery" half, the half the acronym is actually about, completely unverified.

**Concretely, the documented restore procedure has never been run:**
1. Download the JSON files from Storage.
2. Apply all migrations to get a fresh schema.
3. Upsert rows back table by table in FK-dependency order (a 20+ table topological order is written out by hand in `_plans/OPS_RUNBOOK.md`).
4. Run `npm run smoke` to verify.

Every step of that is plausible on paper. None of it has been exercised. A hand-derived 20-table FK order is exactly the kind of thing that looks right until you actually run it and discover a self-reference, a nullable-then-not-null column, or a trigger that fires and rejects the insert order.

**The tradeoff.** A full restore drill costs real engineer time (provisioning a scratch environment, running the restore, verifying, tearing down) and, if run against a real Supabase branch, a small amount of Supabase compute cost. It produces zero user-visible value on its own. This is exactly the kind of work that gets perpetually deprioritized until the day it's needed, at which point it's too late to discover the gap.

**Recommended default for Solen: run one restore drill this week**, end to end, against a throwaway Supabase branch (the project already has branch tooling available via the Supabase MCP `create_branch`), timing every step. This costs a few hours once, converts "we think it works" into "we know it works and it takes N minutes", and is the cheapest possible risk reduction available. Repeat quarterly, or after any change to `BACKUP_TABLES` or the FK order.

---

## 3. RTO and RPO: explicit numbers, not hopes

**The question.** What data loss (RPO) and downtime (RTO) is actually acceptable for Solen, and what do the current mechanisms actually deliver?

**What the evidence says.**

NIST SP 800-34 Rev. 1 [T1, same PDF as above, exact quoted definitions] defines the three relevant terms precisely:

> **"Maximum Tolerable Downtime (MTD). The MTD represents the total amount of time the system owner/authorizing official is willing to accept for a mission/business process outage or disruption and includes all impact considerations."**

> **"Recovery Time Objective (RTO). RTO defines the maximum amount of time that a system resource can remain unavailable before there is an unacceptable impact on other system resources, supported mission/business processes, and the MTD."**

> **"Recovery Point Objective (RPO). The RPO represents the point in time, prior to a disruption or system outage, to which mission/business process data can be recovered (given the most recent backup copy of the data) after an outage... it is a factor of how much data loss the mission/business process can tolerate during the recovery process."**

The standard is explicit that RTO must be shorter than MTD (RTO is a technical sub-budget of the business tolerance, not the same number), and that RPO is independent of RTO: RPO is about data loss tolerance, RTO is about time-to-restore-service tolerance. These are two separate dials, and conflating them is a common mistake.

NIST also ties recovery strategy directly to impact level via a simple table (their Table 3-2, quoted directly from the fetched PDF): **low-impact systems get "Tape backup" + "Relocate or Cold site"**, moderate gets optical/replication + warm site, and only **high-impact/mission-critical systems justify "Mirrored systems and disc replication" + "Hot site."** The point for Solen: the recovery strategy should be proportional to actual business impact, not maximal by default. Over-provisioning DR is also a real cost, not just under-provisioning.

**Applying this to Solen honestly, using the definitions above (this reasoning is ours, applying a T1 framework to our own facts, not itself an external claim):**

- **Current actual RPO ≈ up to 24 hours + detection/decision time.** The nightly export runs once at 03:45 UTC. Anything written and lost between exports is gone. There is no PITR, so sub-day granularity does not exist today.
- **Current actual RTO is unmeasured**, because the restore path has never been timed (see section 2). Writing "RTO: ~1-2h" in a runbook without ever having executed the restore is exactly the "hope, not a number" failure mode this sub-topic warns against. It's a reasonable *estimate*, not a verified figure yet.
- **What RPO/RTO should Solen actually target, given real money and ~28 live salons?** Reasoned tradeoff: a booking or payment lost between backups is not silently absorbed, Stripe still has the PaymentIntent, but Solen's own review/loyalty/booking-state records are not reconstructible from Stripe alone. A 24h RPO means, in the worst case, a full day of bookings, reviews, and loyalty activity across all 28 salons could vanish permanently if the DB were lost right before a nightly export. That is a real, non-trivial business risk at this stage even though the absolute row count is small. The honest recommendation: **write down RPO ≤ 24h (accept current) and RTO ≤ 4h (restore + verify + repoint, once actually measured) as the committed numbers**, and treat "RPO ≤ 24h" as the trigger that forces the PITR conversation once real recurring revenue makes a lost day of bookings costlier than $100/month (see "Premature at our scale").

**The tradeoff, stated plainly.** Tighter RPO/RTO always costs money and complexity: PITR costs $100+/mo and platform lock-in to Supabase's dashboard-only restore flow; a hot standby costs 2x infrastructure; more frequent exports cost more Storage writes and slightly more risk surface. NIST's own framework says the right RTO/RPO is the one balanced against the cost of downtime, not the tightest one achievable. For 28 salons pre-revenue-scale, "24h RPO, ~4h RTO, verified by an actual drill" is defensible. "0 RPO, 5-minute RTO" would be premature engineering for the business's current size.

---

## 4. Retention policy

**The question.** How long should backups be kept, and does the current 14-day window make sense?

**What the evidence says.**

There is no single external standard prescribing "14 days" or any other specific number for a project like Solen, this is a business decision informed by two competing pressures documented in the sources above:

- Longer retention buys protection against **slow-onset corruption**, a bug that silently writes wrong data for days before anyone notices (the single most common real-world reason "restore yesterday's backup" doesn't actually fix anything: yesterday's backup already has the bad data). NIST's testing guidance implicitly assumes this failure mode matters ("System recovery on an alternate platform from backup media" as a required test scenario).
- Shorter retention reduces the **GDPR/nFADP exposure surface** and storage cost. Every day of retained backup is a day of PII sitting in a place that has to be accounted for in a subject-access or erasure request (see section 8 for the exact legal position).

Solen's current 14-day retention (`RETENTION_DAYS = 14` in `lib/backup/export.ts`, enforced by `pruneOldBackups()` only after a fully clean export run) is a reasonable middle point: long enough to catch a bug discovered within two weeks, short enough that GDPR erasure exposure is bounded to a fortnight rather than months. The pruning-only-after-a-clean-run design is a good defensive detail already in place: it means a broken export night doesn't also destroy the previous good day's safety net.

**The gap this section surfaces, not previously flagged**: **schema is not part of this retention policy at all.** The nightly export is *data* only; schema comes from `supabase/migrations/`, which is git-tracked and has no retention/rotation policy because it doesn't need one, it's append-only source code. This is fine as long as it stays true that every schema change goes through the committed migration-file backfill recipe (`_rules/DB_SCHEMA.md`), because the moment schema and the migrations folder drift, the retention policy for *data* is restoring rows against a schema nobody has a record of.

**Recommended default for Solen: keep 14 days, but state explicitly in the runbook that retention covers DATA only, and that schema recoverability depends on migration-file hygiene staying current** (already a stated project law, just not connected to the backup retention policy in writing before this).

---

## 5. Logical vs physical backup

**The question.** What's the actual difference, and which one is Solen actually running?

**What the evidence says.**

Postgres's own docs [T1, fetched: [postgresql.org/docs/17/backup-dump.html](https://www.postgresql.org/docs/17/backup-dump.html)] draw the line cleanly:

- **Logical backup** (`pg_dump`/`pg_dumpall`): produces SQL or a portable archive format representing the *data*, independent of Postgres's on-disk file layout. Advantages, quoted: it can be reloaded into a **newer** version of Postgres, works across machine architectures, and supports selective restore of individual tables. The dump is **internally consistent**: "a snapshot of the database at the time pg_dump began running," and non-blocking except against operations needing an exclusive lock. Limitation: cannot support continuous archiving/PITR, and is slower and less suited to very large databases (though parallel dump helps).
- **Physical backup** (file-level copy of the data directory, e.g. `pg_basebackup`): captures the exact on-disk state, is what continuous WAL archiving builds on, but is tied to the same major Postgres version and, in the low-level API case, the same architecture.

**What Solen actually runs is neither, precisely.** `lib/backup/export.ts` is a bespoke row-level export: `SELECT * FROM table` paged through in 1000-row chunks per table, serialized to JSON, uploaded to Storage. It shares logical backup's key property (portable, human-readable, table-selective) but is not `pg_dump`/`pg_dumpall`, it does not capture constraints, sequences, triggers, RLS policies, or any DDL at all, only rows. That's a deliberate scope choice (schema recoverability is delegated entirely to `supabase/migrations/`, per section 4), but it means Solen's export is best described as **"a logical, per-table data export," not a full logical backup** in the Postgres-docs sense, and definitely not a physical backup. This distinction matters for restore ordering: a real `pg_dump`/`pg_restore` cycle handles FK ordering and constraint deferral automatically inside the format; Solen's JSON-row export requires the hand-maintained FK order in `_plans/OPS_RUNBOOK.md` to be right, because nothing about the export format enforces it.

**The tradeoff.** A row-level JSON export is simpler to reason about, easy to inspect/diff/partially restore a single table, and has zero dependency on Postgres tooling versions matching. It costs you: no automatic FK/constraint handling on restore (manual, error-prone ordering, as flagged in section 2), no schema capture (deliberate, offloaded to migrations), and it fundamentally cannot be the basis for PITR (section 1).

**Recommended default for Solen: keep the row-level export as the cheap, already-working data safety net, but do not conflate it with "we have backups" in the PITR/full-restore sense.** It answers "did we lose the data" for 24 tables; it does not answer "can we recover to any point in time" for any table.

---

## 6. What Supabase actually gives per plan tier (verified live)

**The question.** What backup/PITR coverage does Solen's actual plan provide today, and what would upgrading buy?

**What the evidence says, fetched fresh this run (this is the single most volatile fact in this document, so it gets the most explicit sourcing):**

- Supabase's own backups doc [T1, fetched: [supabase.com/docs/guides/platform/backups](https://supabase.com/docs/guides/platform/backups)]: **Free plan projects get no automatic backups at all** and are told to run their own `supabase db dump` exports. **Pro plan: last 7 days of daily backups. Team plan: last 14 days. Enterprise: up to 30 days.** PITR is a paid add-on available on Pro, Team, and Enterprise (not Free), and **enabling PITR replaces daily backups entirely**: "If you enable PITR, we will no longer take Daily Backups."
- Supabase's PITR usage/pricing doc [T1, fetched: [supabase.com/docs/guides/platform/manage-your-usage/point-in-time-recovery](https://supabase.com/docs/guides/platform/manage-your-usage/point-in-time-recovery)]: PITR is billed hourly, roughly $0.137/hr (~$100/mo) for a 7-day retention window, ~$0.274/hr (~$200/mo) for 14 days, ~$0.55/hr (~$400/mo) for 28 days. **Windows beyond 28 days require Enterprise.** A minimum "Small" compute add-on is required. **PITR spend is explicitly NOT covered by the project spend cap**, so it's real recurring cost outside the usual free-tier ceiling.
- Supabase's PITR engineering blog post [T1, fetched: [supabase.com/blog/postgres-point-in-time-recovery](https://supabase.com/blog/postgres-point-in-time-recovery)]: implemented via physical base backups plus WAL-G-archived WAL at 2-minute intervals; restore is dashboard-initiated only, no customer filesystem/WAL/CLI access exists.
- **Solen's own live project, checked this run** via `mcp__claude_ai_Supabase__list_projects` / the project's own recorded findings: project `tocfnsmxmdxkrcmjzzdw`, status `ACTIVE_HEALTHY`, Postgres `17.6.1`. `_plans/OPS_RUNBOOK.md` records, as a VERIFIED 2026-07-11 fact (this run did not re-run a live billing/API check for `pitr_enabled` specifically, that field isn't exposed by the generic `get_project`/`list_projects` MCP calls used this session, so this is carried forward from the prior verified finding, not re-verified fresh): **`pitr_enabled=false` and the platform daily-backups list is EMPTY.** Whatever plan tier Solen is on, it is either Free (no backups at all, matches "empty list") or a paid tier where daily backups have not been enabled/retained, or PITR/backups have lapsed. This should be confirmed by the owner directly in the dashboard (Settings → Billing, Settings → Database → Backups), because the MCP tools available this session do not surface plan tier or PITR toggle state directly.

**The tradeoff.** Free tier costs nothing but gives zero platform-level safety net, all risk sits on the in-house nightly export. Pro plan ($25/mo base, not separately verified this run) gets you 7 days of daily backups for no extra add-on cost beyond the Pro subscription itself, a meaningfully better position than Free for very little money. PITR on top costs another $100+/mo and only pays for itself once "how much data can we afford to lose" needs to be measured in minutes rather than a day.

**Recommended default for Solen: confirm actual plan tier and turn on at minimum Pro-tier daily backups if not already active** (this is the cheapest platform-level improvement available and there's no credible reason not to have it once you're on any paid plan); **defer the PITR add-on** per the reasoning in sections 1 and 3, revisit at the trigger stated in "Premature at our scale."

---

## 7. Backup encryption and access control

**The question.** Are backups encrypted, and who can read or restore them?

**What the evidence says.**

Supabase's own security page [T2, fetched: [supabase.com/security](https://supabase.com/security)] states plainly: **"All customer data is encrypted at rest with AES-256"** and data in transit is protected via TLS. This is stated as always-on and non-configurable (confirmed via a converging secondary source describing it as "cannot be disabled"; the primary security page itself doesn't use the word "cannot," so that specific framing is T2/secondary-converged, not a direct primary quote). Supabase holds SOC 2 Type 2 and ISO 27001 certifications and can support HIPAA under a signed BAA, per the same page. The page does **not** separately confirm that backup *files themselves* (as distinct from the live database) get independent encryption treatment; the reasonable inference is they inherit the same underlying storage encryption, but this is inference, not a directly fetched confirmation, so it's flagged in Unverified.

**Access control, reasoned from Solen's own architecture (not an external source, this is our own code):** Solen's in-house nightly export lives in a Supabase Storage bucket that is genuinely private (`public: false`, live-verified per `_docs/BACKEND.md`) and reachable only through the service-role admin client, never the RLS-bound session client. That's the correct shape: backups should never be reachable through a code path a regular authenticated user could hit. But it also means **the backup bucket and the live database share exactly one blast radius: the service-role key.** Anyone or anything holding that key can read every backup AND delete/modify every live row. There is no separation of privilege between "can write data" and "can destroy the backup that would let you recover from that write."

**Where the tradeoff lies.** A stricter design (a second, more restricted credential that can only *write* to the backup bucket and never delete, or a separate cloud account entirely for backup storage) meaningfully reduces blast radius in a credential-compromise scenario, at the cost of real engineering complexity: managing a second service identity, keeping its permissions minimal, and making sure the restore procedure still works with reduced privilege. For a 28-salon operation, standing up a fully separate trust boundary for backups is more machinery than the current risk justifies, but relying on a single admin key for both write and delete of the only safety net is the specific gap the next section names directly.

**Recommended default for Solen: no change to encryption (it's already handled and can't meaningfully be improved without self-hosting), but name the shared-blast-radius fact explicitly in the runbook** so a future security review doesn't have to rediscover it, and treat it as the concrete argument for section 8's immutability discussion.

---

## 8. The ransomware/immutability angle

**The question.** Could an attacker (or a bad automated process, or a compromised CI pipeline) destroy both the live data and the backups in one action, and what's the standard defense?

**What the evidence says.**

CISA's own guidance pages returned HTTP 403 to direct fetch this run (see Unverified), so this section relies on converging secondary sources describing CISA's published position rather than a directly quoted primary source; treat the specific wording below as T2/T3, not T1, until someone re-fetches CISA directly (their bot-detection appears to be blocking automated fetches specifically, not blocking the content from existing).

The consistently repeated, cross-source position: CISA's #StopRansomware guidance recommends **offline, encrypted, immutable backups** as a core ransomware defense, built on the older **3-2-1 rule** (three copies of data, two different media types, one copy offsite), a convention coined by photographer Peter Krogh in 2006 [CONV, not an empirical study, a coordination heuristic that predates cloud backup entirely] and since extended by the backup industry to **3-2-1-1-0**: one of those copies immutable/air-gapped, and zero errors on a verified restore test. **The immutability property specifically defeats the realistic ransomware/insider scenario: an attacker (or a compromised credential, or a bad script) with full write/delete access to your live systems should still NOT be able to delete or encrypt your backups**, because a WORM (Write Once, Read Many) store physically refuses the delete/overwrite operation for a defined retention window, even for someone holding otherwise-total credentials.

**This is where Solen's architecture has a real, specific gap, not a hypothetical one.** Supabase Storage, confirmed via multiple converging sources this run (official GitHub discussion threads and comparison articles, no primary Supabase doc page directly asserts the negative, which is expected, vendors don't usually document what they don't support): **Supabase Storage does not support object versioning or object lock/immutability.** Each path is a single mutable object; there is no way to make an uploaded backup file undeletable or unoverwritable for a retention window. Combined with section 7's finding (backup bucket and live DB share one service-role credential), this means: **a leaked service-role key, or a bug in a script running with that key, could delete the live database rows AND every stored backup file in the same session.** There is currently no control in Solen's stack that would stop that specific scenario. Supabase's own PITR (section 6), by contrast, is platform-side WAL archiving outside the customer's credential blast radius entirely, an attacker with your Postgres credentials cannot delete Supabase's own WAL archive, only Supabase support or dashboard access can trigger a PITR restore. This is a genuine, concrete argument in PITR's favor that isn't about RPO granularity at all: it's about surviving a credential-compromise scenario that the in-house export cannot survive.

**The tradeoff.** True immutable backup storage (e.g., cross-cloud to an S3 bucket with Object Lock in compliance mode, a genuinely separate blast radius) is the correct answer at real scale, but means standing up and paying for infrastructure outside Supabase entirely, with its own credentials, its own IAM policy, its own operational surface to maintain. For 28 salons with a DB in the low single-digit megabytes, this is disproportionate machinery today. The pragmatic middle ground, cheap and immediately actionable: at minimum, don't grant the same credential unrestricted delete rights over both the live tables and the only backup copy without at least being aware that's the current state, which this document now makes explicit.

**Recommended default for Solen: no new infrastructure yet, but treat "our backup credential can also destroy the backup" as a named, tracked risk**, and revisit (see next section) once either real revenue or a security incident changes the calculus.

---

## Decision candidates

| axis | options | when each wins | recommended for Solen | tier |
|---|---|---|---|---|
| PITR vs daily/nightly backup only | Supabase PITR add-on ($100+/mo) vs current nightly export + (ideally) Pro daily backups | PITR wins once a lost day of data costs more than $100/mo, or once corruption-not-caught-same-day incidents actually happen | Not yet; revisit at the stated trigger below | T1 mechanics (Postgres docs), reasoned tradeoff for Solen |
| Logical row export vs `pg_dump`/`pg_restore` | Current bespoke JSON-per-table vs standard `pg_dump -Fc` + `pg_restore` | `pg_dump` wins once the hand-maintained FK-order restore procedure becomes a maintenance burden or a real restore drill reveals ordering bugs | Keep current export for now, but run the restore drill (section 2) before trusting it further | T1 (Postgres docs) applied to our own code |
| Backup credential scope | Shared service-role key (current) vs a separate, write-only/no-delete backup identity | Separate identity wins once backups need to survive a compromised admin credential, i.e. once immutability actually matters | Not yet; name the risk, don't build the separation yet | Reasoned from CISA/NIST posture, T2/T3 sourcing |
| Backup storage location | Supabase Storage (current) vs a separate cloud account/bucket with Object Lock | Separate immutable storage wins once ransomware/insider-threat is a realistic named threat model, not just a theoretical one | Not yet | T2/T3 (CISA guidance via converging sources), reasoned for our scale |
| Retention window | 14 days (current) vs shorter (less GDPR exposure) vs longer (catches slower corruption) | Longer wins if corruption-discovered-late becomes a real incident; shorter wins if GDPR erasure volume grows | Keep 14 days | Reasoned, no external standard prescribes a number |
| RTO/RPO as committed numbers | Leave implicit/estimated (current) vs write down and test explicit numbers | Explicit numbers always win, there is no honest argument for staying implicit | RPO ≤ 24h (accept, matches current cadence), RTO ≤ 4h (target, then verify with a real drill) | T1 (NIST SP 800-34), applied |

---

## Myths and traps

- **MYTH: "We have backups" because a cron job runs and reports success.** A green cron run proves the *write* path works. It proves nothing about restore. This is this document's single most important myth to kill, and it's Solen's current actual state (section 2).
- **MYTH: "`pg_dump` nightly is basically the same as PITR, just less granular."** Wrong in kind, not just degree: `pg_dump` output cannot be combined with WAL replay at all (T1, Postgres docs, section 1). There is no dial between "daily dump" and "PITR", they are structurally different mechanisms.
- **MYTH: "Encryption at rest protects us from a leaked credential."** It doesn't. AES-256 at rest (section 7) defends against someone stealing the physical disk or an unauthorized process reading storage directly outside the application layer. A leaked service-role key reads the plaintext data through the normal API, encryption at rest is irrelevant to that scenario.
- **MYTH/OUTDATED: "3-2-1 is enough."** The backup industry has moved to 3-2-1-1-0 (immutable copy + verified restore), and CISA's current guidance (via converging secondary sources, direct fetch blocked) reflects that. Plain 3-2-1 with no immutable copy does not defend against ransomware or a malicious/compromised admin credential, only against ordinary hardware failure or a single site disaster.
- **TRAP specific to our stack (serverless/Netlify):** a cron route that "ran" per GitHub Actions logs can still have silently failed partway through and been swallowed, this project's own documented #1 failure mode (silent no-ops). `runDbBackupExport`'s per-table `try/catch` (deliberately) never aborts the whole run on one table's failure, this is a *good* design choice for resilience, but it means a partial-failure night can look identical to a full-success night unless someone actually reads `errors[]`. Confirm the cron route surfaces `errors.length > 0` somewhere a human sees it (founder digest email, alert), not just in a log line nobody reads.
- **TRAP specific to Supabase/PostgREST:** the backup export's `.select("*")` on each table will silently return fewer columns than expected if a column was renamed or dropped without the export list being updated, PostgREST doesn't error on this, it just returns what exists. The export code doesn't validate row shape against an expected schema, so a schema drift could shrink the exported columns silently. Worth a periodic sanity check (row count AND column-count check) rather than trusting `errors: []` alone means "everything backed up correctly."
- **TRAP specific to Stripe Connect:** it's tempting to think "Stripe has the money data, so we're fine" if Postgres is lost. True for the PaymentIntent/charge ledger itself, false for `salon_payouts`, `platform_fee`, VAT splits, and the has-this-been-paid-out-to-the-salon state, all of which live only in Postgres and are *derived from* Stripe events, not stored redundantly by Stripe. Losing Postgres loses the commission/payout bookkeeping even though the underlying charges are still recoverable from Stripe's own dashboard/API.

---

## Premature at our scale

Explicitly correct-at-scale advice that Solen should NOT adopt yet, with the specific trigger that would flip the recommendation:

- **Supabase PITR add-on.** Correct once: (a) real recurring revenue makes a lost day of bookings/reviews cost meaningfully more than ~$100/month amortized, or (b) a real incident happens where a same-day, undetected corruption bug makes "restore yesterday" insufficient. Until then, $1,200+/year for second-level granularity on a database in the low single-digit megabytes is spending ahead of the risk.
- **A fully separate immutable backup store (own cloud account, Object Lock, air-gapped).** Correct once ransomware or a malicious-insider/compromised-credential scenario is a named, plausible threat, i.e. once Solen handles enough salons/revenue to be a plausible extortion target, or after any real credential-leak incident. At 28 salons pre-revenue-scale, this is meaningful infrastructure and IAM surface to maintain for a threat that hasn't materialized.
- **A dedicated write-only/no-delete backup service credential, separate from the service-role admin key.** Correct once the shared-blast-radius risk (section 7/8) is judged unacceptable, which tracks the same trigger as the immutable-store item above, they're the same underlying problem at different levels of solution.
- **Hot standby / mirrored replica (NIST's "high impact" tier strategy).** Only justified for mission-critical systems where an hours-long outage is unacceptable. Solen's actual RTO target (a few hours, section 3) does not require this; a cold-start restore is an acceptable strategy at this scale, per NIST's own impact-tiered guidance.
- **Quarterly formal tabletop DR exercises with a written test plan and success criteria (NIST's full TT&E program).** The *substance* (a real restore drill) should happen now, cheaply. The *ceremony* (formal sign-off documents, scheduled tabletop exercises with multiple stakeholders) is proportional to a much larger organization. One engineer running one real restore and writing down what happened is the right-sized version of this for Solen today.

---

## Unverified

- **Solen's current Supabase plan tier** (Free / Pro / Team) was not directly re-confirmed this run, the MCP tools available (`list_projects`, `get_project`) return project/region/Postgres-version metadata but not billing plan or the live `pitr_enabled` flag. The `pitr_enabled=false` / empty-backups-list fact is carried forward from the project's own prior verified finding (`_plans/OPS_RUNBOOK.md`, dated 2026-07-11), not independently re-verified in this session. **Action needed: owner check the Supabase dashboard (Settings → Billing, Settings → Database → Backups) directly.**
- **CISA's #StopRansomware guide and consumer/business backup pages** could not be directly fetched this run, every CISA URL attempted returned HTTP 403 (likely bot detection, not a content issue), and the local `firecrawl` CLI referenced by the firecrawl skill was not installed in this environment. The claims attributed to CISA in this document rely on converging third-party summaries of CISA's published position, not a direct quote from cisa.gov. Tier accordingly (T2/T3, not T1) until someone re-fetches directly (a logged-in browser or a different fetch path than this session's WebFetch tool may succeed where this session's did not).
- **ICO's exact "put beyond use" guidance on GDPR erasure vs backups** could not be directly fetched (ico.org.uk also returned 403). The position summarized in section 8/point 8 of the short version is a converged secondary-source description of ICO's stance, not a direct quote.
- **Whether Solen's backup JSON files get any encryption treatment distinct from the underlying Supabase Storage/Postgres encryption-at-rest** was not directly confirmed; Supabase's security page confirms customer data generally is AES-256 at rest but doesn't call out backup files as a separately documented case. Reasonable inference, not confirmed fact.
- **Actual measured RTO for a Solen restore** does not exist as a number, because the drill recommended in section 2 has never been run. The ~1-2h figure in `_plans/OPS_RUNBOOK.md` is an estimate, not a measurement.
- **GitHub Actions minutes budget interaction with backup cron reliability**: `_plans/OPS_RUNBOOK.md` already flags that the 15-minute cron ping cadence is close to the free-tier GitHub Actions minutes cap; whether the nightly backup cron specifically has ever silently failed to fire due to a minutes-cap throttle was not checked this run.

---

## Sources

- [postgresql.org/docs/17/continuous-archiving.html](https://www.postgresql.org/docs/17/continuous-archiving.html) , fetched directly. Established the WAL/base-backup mechanics of PITR, `archive_command`/`restore_command`, recovery_target options, and the explicit statement that logical dumps cannot support continuous archiving.
- [postgresql.org/docs/17/backup-dump.html](https://www.postgresql.org/docs/17/backup-dump.html) , fetched directly. Established logical backup (`pg_dump`/`pg_dumpall`) mechanics, consistency guarantees, and advantages/limitations vs physical backup.
- [supabase.com/docs/guides/platform/backups](https://supabase.com/docs/guides/platform/backups) , fetched directly. Established current per-tier daily backup retention (Free: none, Pro: 7 days, Team: 14 days, Enterprise: 30 days) and that enabling PITR replaces daily backups.
- [supabase.com/docs/guides/platform/manage-your-usage/point-in-time-recovery](https://supabase.com/docs/guides/platform/manage-your-usage/point-in-time-recovery) , fetched directly. Established PITR pricing (hourly billing, ~$100/$200/$400 per month for 7/14/28-day windows), the Small-compute-add-on requirement, and that PITR is excluded from the spend cap.
- [supabase.com/blog/postgres-point-in-time-recovery](https://supabase.com/blog/postgres-point-in-time-recovery) , fetched directly. Established the WAL-G-based implementation, 2-minute WAL archive interval, dashboard-only restore (no customer WAL/filesystem access), and Pro-plan eligibility rollout detail.
- [supabase.com/security](https://supabase.com/security) , fetched directly. Established AES-256 encryption at rest, TLS in transit, and SOC 2 Type 2 / ISO 27001 / HIPAA-BAA compliance posture.
- [supabase.com/docs/guides/storage/schema/helper-functions](https://supabase.com/docs/guides/storage/schema/helper-functions) , fetched directly. Confirmed Storage access control is implemented via RLS helper functions on `storage.objects`, not a separate bucket-level ACL system, and does not mention object locking/immutability.
- [supabase.com/docs/guides/platform/going-into-prod](https://supabase.com/docs/guides/platform/going-into-prod) , fetched directly. Confirmed the production checklist recommends PITR once a DB exceeds 4GB and mentions Read Replicas for durability, but does not mandate restore-drill testing as a pre-production requirement, a real gap in Supabase's own guidance.
- [csrc.nist.gov/glossary/term/recovery_point_objective](https://csrc.nist.gov/glossary/term/recovery_point_objective) , fetched directly. Gave the NIST glossary's short RPO definition and pointed to SP 800-34 Rev.1 as source.
- [nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-34r1.pdf](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-34r1.pdf) , fetched directly (as PDF, extracted via `pdftotext`, primary-source quotes pulled from the actual document text). Established the exact RTO/RPO/MTD definitions, the FIPS-199-impact-to-backup-strategy table, the "test at least annually" requirement, and the required test-scenario list (notification, alternate-platform recovery, connectivity, performance, restoration of normal ops).
- [en.wikipedia.org/wiki/Disaster_recovery](https://en.wikipedia.org/wiki/Disaster_recovery) , fetched directly; turned out to be a disambiguation page with no substantive RTO/RPO content, superseded by the NIST source above for definitions.
- Wikipedia/general web search convergence on RPO/RTO plain-English definitions , used only to cross-check phrasing against the NIST primary definitions above, not cited as a standalone source.
- WebSearch convergence on Supabase Storage's lack of object versioning/object-lock (GitHub Supabase discussion threads, third-party comparison articles) , no single Supabase primary-doc page directly confirms this absence (expected, vendors rarely document missing features), so tiered T2 based on multiple independent third-party confirmations rather than a T1 primary quote.
- WebSearch convergence on CISA's #StopRansomware guidance (3-2-1-1-0, immutable/offline backups, regular restore testing) , direct CISA fetch blocked (403) every attempt this run; tiered T2/T3 accordingly, see Unverified.
- WebSearch convergence on ICO's GDPR erasure-vs-backup "put beyond use" position , direct ico.org.uk fetch blocked (403); tiered T2, see Unverified.
- WebSearch on the 3-2-1 backup rule's origin (Peter Krogh, 2006, "The DAM Book") , used to correctly tier the rule itself as CONV (a coordination convention, not an empirical finding), not to establish any prescriptive claim.
- `_inventory/_db-snapshot.json` (live DB snapshot, captured 2026-07-12) , read directly this run to confirm the exact live table count (146) against the 24 tables covered by the in-house backup export, establishing the "16% of tables backed up" figure.
- `mcp__claude_ai_Supabase__list_projects` , called live this run. Confirmed project ref, region (eu-west-2), and live Postgres version (17.6.1) directly from the Supabase platform, not from memory.
- `lib/backup/export.ts`, `app/api/cron/db-backup/route.ts`, `_plans/OPS_RUNBOOK.md`, `_docs/BACKEND.md` (all read directly this run) , established every fact about Solen's actual current backup implementation, restore procedure, and prior verified `pitr_enabled=false` finding.
