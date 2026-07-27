## PART 1 — What exists in this repo

### 1.1 The gap is already a filed, named, BLOCKED finding

This is not a new discovery. The 2026-07-26 principles research already found it and it is the single item the loop could not close:

`_plans/PRINCIPLES_LOOP.md:181`
```
- [ ] `observability-9` **BLOCKED** BLOCKED ON AN OWNER DECISION: verified genuinely absent,
  `find . -iname '*postmortem*'` returns zero files repo-wide and OPS_RUNBOOK.md has no such
  section. Writing incident-response and postmortem discipline is a decision about how YOU want
  to run an incident, not a code change I can make for you.
  , [medium/M] No per-critical-flow incident runbook and no postmortem discipline exists anywhere
```

Full finding with its own absence proof: `_design-system/research/missing-principles-2026-07-26/observability.json`, id `observability-9`. Its proposed home was "`_plans/OPS_RUNBOOK.md` (new 'Incident playbooks' section, 3 entries); a new `_plans/POSTMORTEMS/` directory with a one-page template."

I re-verified the absence today: `find . -iname "*postmortem*"` outside `node_modules`/`.next` returns zero files. `_rules/` has 21 files, none is an incident file. `grep -ni "postmortem\|incident"` inside `_plans/OPS_RUNBOOK.md` returns zero hits.

**So the owner's "we need whole principle for that" is the unblocking of `observability-9`.** Rule 12 applies: extend `_plans/OPS_RUNBOOK.md` and `_backend-system/LAW.md` §14, do not start a parallel ops doc.

### 1.2 `_plans/OPS_RUNBOOK.md` (73 lines) — what it covers and does not

Covers: monitoring wiring, backups + a full FK-ordered restore procedure, nFADP retention, a cost table, open owner decisions, security maintenance, a "what to add next" list.

Does **not** cover, at all:
- Any symptom-to-diagnosis path. Nothing answers "a salon says a booking never confirmed, where do I look first."
- Severity. The words severity/SEV/P0 appear nowhere in the repo's ops docs.
- Roles, or the idea that during an incident you are doing two different jobs.
- Postmortems, blameless or otherwise.
- Rollback. That gap was closed separately on 2026-07-26 in `_rules/RELEASE.md:14-43`, and `OPS_RUNBOOK.md` does not link to it.

### 1.3 Monitoring: four channels, all email, nothing pages

| Channel | File | What it does |
|---|---|---|
| `reportError(scope, err, ctx)` | `lib/error-report.ts:43-79` | always `console.error`; PostHog `captureServerException`; then throttled `alertAdmin` |
| `alertAdmin(subject, details)` | `lib/alert-admin.ts:36-60` | Resend email to `ADMIN_EMAIL`. Best-effort, never throws, no-ops silently if `ADMIN_EMAIL` unset |
| GitHub Actions red run | `.github/workflows/cron-jobs.yml:66-73` | curls `https://solen.ch/api/health` every 15 min, 3 attempts, `exit 1` on non-200. GitHub emails the owner |
| Founder daily digest | `app/api/cron/daily-digest/route.ts`, 05:15 UTC | bookings created/completed, cron failures, cron heartbeat, pending reviews, 7-day booking failure-rate SLI |

**Answer to "does anything PAGE a human": no.** Verified: `grep -rn "ADMIN_PHONE\|adminSms" lib` returns nothing; `lib/sms.ts` exports only `sendSMS` and its three callers (`app/api/bookings/resend-access/route.ts:11`, `app/api/cron/barber-smart-reminders/route.ts:6`, `app/api/cron/sms-reminders/route.ts:5`) are all customer-facing. No ntfy/Pushover/Telegram/PagerDuty anywhere. Sentry was removed on purpose (`lib/error-report.ts:3-6`, `_plans/OPS_RUNBOOK.md:52` "Sentry: parked owner option; email alerting shipped instead").

Two consequences worth naming:
- **Worst-case blind window is ~24h** for anything that only shows up in the digest. The 15-min health check narrows that only for total-site-down.
- The `reportError` throttle is an in-memory `Map` (`lib/error-report.ts:16-21` documents this), so it is per function instance, not global.

What *is* solid, and is recent:
- `lib/cron-heartbeat.ts:26-60` — `EXPECTED_CRON_INTERVALS_MS` maps 22 cron names to their real intervals read off the workflow file, and the digest flags any cron with no `cron_runs` row within 2x its interval. Written after five straight missed Actions runs reported as "0 cron failures."
- `app/api/stripe/webhook/route.ts:43-45` and `:71-72` — both top-level rejection branches now call `reportError` (`stripe-webhook-signature`, `stripe-webhook-claim`). That was `observability-2` and it is closed.
- `app/api/health/route.ts` + `lib/health.ts` — three probes (DB HEAD count on `cities`, Redis PING, prod env completeness), 2s timeouts, 200/503.
- `app/api/cron/reconcile/route.ts` — the money safety net. Daily, read-only, compares Stripe charges/refunds over ~48h against `bookings` / `retail_purchases` / `gift_cards` and emails mismatches. It never auto-fixes.

### 1.4 The genuinely critical flows, by route file

Derived from where money and commitments actually move, not from a wish list:

| Flow | Route file | Notes |
|---|---|---|
| Booking creation | `app/api/bookings/route.ts:117` (POST) | 689 lines. Flag-gated `bookings` at line 118. Only calls `reportError` at `:614`, for the confirmation email, **not** for a booking-create failure |
| Payment intent | `app/api/stripe/booking-pay-intent/route.ts:37` | 744 lines. Redeems/restores user credits with `FOR UPDATE` + `UNIQUE(credit_id, booking_id)` |
| Stripe webhook | `app/api/stripe/webhook/route.ts` | 994 lines. Atomic idempotency claim into `processed_webhook_events` (PK on `event_id`, 23505 = duplicate no-op), claim released on handler throw so Stripe retries |
| Reconciliation | `app/api/cron/reconcile/route.ts` | 433 lines, daily |
| Payout release | `app/api/cron/release-payments/route.ts`, `release-deposits/route.ts` | every 6h |
| Pre-charge | `app/api/cron/pre-charge/route.ts` | hourly |
| Availability / slots | `app/api/slots/route.ts` (209 lines), `app/api/slots/next-available/route.ts`, `app/api/availability/[salon_id]/route.ts`, cron `generate-slots` daily 02:00 UTC | a silently-empty slots response looks identical to "fully booked" |
| Auth | `app/api/auth/login/route.ts`, `signup`, `callback`, `verify-otp`, `verify-phone/{send,check}` | |
| Walk-in pay → queue | `app/api/walkin/pay-intent/route.ts:17`, `app/api/bookings/walk-in/route.ts` | payment gates the queue number, so a payment failure here is a customer standing in a shop |

### 1.5 Rollback capability: better than the runbook implies

**Netlify.** Documented at `_rules/RELEASE.md:16-26`: Deploys → pick last known-good → **Publish deploy**. Atomic immutable builds, no commit, live in under a minute. This is the single fastest mitigation available and `OPS_RUNBOOK.md` does not mention it.

**Feature flags can kill a flow without a deploy.** This is real and underused. `lib/feature-flags.ts`, admin UI at `app/[locale]/dashboard/feature-flags-admin/page.tsx`, API `app/api/admin/feature-flags/route.ts` (admin-role gated, rate-limited, writes an audit event at `:60`). 150 `checkFeatureEnabled(...)` call sites. Blast radius per key, measured:

```
38 discovery · 29 barber_features · 25 nail_features · 20 bookings · 9 reviews
 8 payments · 6 spa_features · 5 visual_editor · 1 each: vouchers, upcharge_requests,
 registration, referral, last_minute, dispute_reporting
```

`maintenance_mode` short-circuits **all 150** with a 503 (`lib/feature-flags.ts:89-93`). Propagation is bounded by `FLAG_TTL_MS = 30 * 1000`, so a toggle reaches every warm instance within 30s.

Four caveats the owner needs to know before relying on this at 9pm:

1. **The flag read fails OPEN.** `lib/feature-flags.ts:103-106`: `catch { return null }`, plus a missing row defaults to enabled at `:83`. If Supabase is the thing that is broken, the kill switch does not fire. It protects against a bad deploy, not against a DB outage.
2. **`maintenance_mode` is not in `middleware.ts`.** Verified: `grep -n "maintenance" middleware.ts` returns nothing. Pages still render; only API mutations 503. A customer sees a working-looking site that errors on submit.
3. **The Stripe webhook is deliberately not flag-gated** (`grep -n "checkFeatureEnabled" app/api/stripe/webhook/route.ts` → zero hits). This is correct and must stay correct: killing `payments` stops *new* charges while already-in-flight events keep being processed.
4. Turning off `payments` does **not** stop Stripe from delivering events for charges already created.

**Migrations do not roll back.** `_rules/RELEASE.md:34-38`: never write a down migration, fix forward, restore from backup for a genuine disaster. And `_plans/OPS_RUNBOOK.md:18`: PITR is off and the Supabase platform backup list is **empty**; the only restorable backup is the in-house nightly JSON export to the private `db-backups` bucket (`app/api/cron/db-backup/route.ts`, 03:45 UTC, 24 tables, 14-day retention). RPO 24h, RTO 1-2h.

---

## PART 2 — External practice

### 2.1 Google SRE incident management: the roles

Google's IMAG defines three delegable roles plus a fourth support role ([Google SRE, Managing Incidents](https://sre.google/sre-book/managing-incidents/)):

- **Incident Command** — "holds the high-level state about the incident. They structure the incident response task force."
- **Operational Work** — "responds to the incident by applying operational tools to the task." Per Google's [Incident Management Guide](https://sre.google/resources/practices-and-processes/incident-management-guide/), the Ops Lead **should be the only role modifying the system**.
- **Communication** — "public face of the incident response task force," issues periodic stakeholder updates and owns the incident document.
- **Planning** — longer-term support: filing bugs, ordering dinner.

The four structural elements: Recursive Separation of Responsibilities, A Recognized Command Post, Live Incident State Document, Clear Live Handoff. Handoff is explicit and verbal: "You're now the incident commander, okay?" with acknowledgment.

Declare an incident if **any** of: you need a second team; the outage is customer-visible; it is unsolved after an hour of concentrated analysis.

Best practices list: Prioritize (stop the bleeding, restore service, preserve the evidence), Prepare, Trust, Introspect (monitor your own emotional state), Consider alternatives, Practice, Change it around.

**Why separation matters for one person.** The IC "holds all roles that are not delegated yet." The rationale Google gives is behavioural, not organisational: you cannot focus on investigation while people interrupt you every five minutes for an update. For a solo founder the interrupter is not a person, it is your own brain switching between "what is broken" and "what do I tell the salon." Naming the two jobs and doing them in fixed alternation (fix for 15 minutes, then write one update, then fix) is the whole of the value that survives at team size one. The other survivor is **Introspect**: SRE explicitly instructs the IC to watch for the responder becoming ineffective, and at team size one there is nobody else to notice.

### 2.2 Severity levels: what actually distinguishes them

**PagerDuty** ([response.pagerduty.com/before/severity_levels](https://response.pagerduty.com/before/severity_levels/)) — five levels, and the operative rule is stated first: **when uncertain, treat it as the higher one**, do not debate severity during a live incident.

- SEV-1: "Critical issue that warrants public notification and liaison with executive teams."
- SEV-2: "Critical system issue actively impacting many customers' ability to use the product."
- SEV-3: "Stability or minor customer-impacting issues that require immediate attention from service owners."
- SEV-4: "Minor issues requiring action, but not affecting customer ability to use the product."
- SEV-5: "Cosmetic issues or bugs, not affecting customer ability to use the product."

**Industry-common SEV1/2/3** (as summarised by [FireHydrant](https://firehydrant.com/blog/getting-started-with-severity-levels/) and [Rootly](https://rootly.com/blog/practical-guide-to-sre-incident-severity-levels)):
- SEV1: no customer can use most of the product; data corruption or loss has occurred or will occur; revenue loss happening or imminent.
- SEV2: primary functionality severely impacted and unusable; **no workaround**; data may display wrong but is not lost.
- SEV3: some (not all) customers get intermittent errors, or cannot use the product in obscure ways.

**What actually distinguishes the levels, across all three sources — three axes, in this order:**
1. **Is data or money irrecoverably wrong?** Data loss/corruption is SEV1 on its own, independent of how many users are affected. This is the axis that most homegrown severity tables forget.
2. **Does a workaround exist?** SEV2's defining clause is "there is no workaround." SEV3's is that one exists or the impact is intermittent.
3. **Breadth of impact.** All customers vs many vs some. Notably this is the *last* discriminator, not the first.

A fourth, procedural: severity determines *who gets woken and who gets told*, not how bad you feel. PagerDuty attaches a response action to each level (page an IC + public notification; major incident response; high-urgency team page; low-urgency page; a JIRA ticket).

### 2.3 Blameless postmortems: useful vs theatre

From [Google SRE, Postmortem Culture](https://sre.google/sre-book/postmortem-culture/):

**Triggers (write one if any apply):** user-visible downtime or degradation beyond a threshold; **data loss of any kind**; on-call engineer intervention such as a release rollback or traffic rerouting; resolution time above a threshold; **a monitoring failure, which usually implies the incident was discovered manually**. Any stakeholder may also request one.

That last trigger is the sharpest one for Solen: if you found out about a problem because a salon told you rather than because the digest told you, that alone earns a postmortem, because the monitoring gap is the finding.

**Blameless means:** "focus on identifying the contributing causes of the incident without indicting any individual or team for bad or inappropriate behavior," assuming everyone acted with good intentions on the information available at the time. The counterfactual test: replace "X should have known" with "what made it reasonable to do X at the time."

**What separates useful from theatre:**
- **Theatre**: a narrative with no action item, or action items with no owner and no date. Every source converges on this. Google's postmortem standard includes "corrective action items with owners and due dates"; [incident.io](https://incident.io/blog/sre-incident-postmortem-best-practices) and [oneuptime](https://oneuptime.com/blog/post/2026-01-30-sre-postmortem-templates/view) both make "every action item has an owner and a due date" the publish gate.
- **Theatre**: one giant "rewrite the backend" action item. Google's own counterfactual example calls this out by name.
- **Useful**: action items split into **mitigative** (fixes this specific gap) and **preventative** (addresses the class of failure), tracked where you actually look, and reviewed.

**Minimum fields a template must have** (union across the sources): title + date + severity; a one-paragraph summary; impact (who, how many, how long, in money or bookings where possible); a timestamped timeline including *when you found out* and *how*; root cause / contributing causes; **what went well**; **where we got lucky**; and action items each with owner + due date + mitigative-or-preventative label.

"Where we got lucky" is the field that converts a near-miss into a fix rather than relief.

### 2.4 Time to mitigate beats time to fix

The distinction ([Microsoft Azure Well-Architected: Incident Management](https://learn.microsoft.com/en-us/azure/well-architected/design-guides/incident-management)): **Time to Mitigate** = detect + engage + stop the impact. **Time to Resolve** = all of that plus diagnose, repair properly, and ensure non-recurrence. They are separate metrics and you optimise the first one during the incident.

[incident.io's lifecycle guide](https://incident.io/guide/response/the-lifecycle-of-an-incident) states it operationally: "Your goal is now to stop the immediate pain: defer clean-up to a less pressured time," and "Rollback to a known good version, even if you think you can write a fix really quickly, you can always do that after you've rolled back, when there is less urgency," and "options that are quick to apply should be taken first, even if you suspect it may only partially fix the problem."

Google's version is the first item of its Best Practices list: **"Prioritize: stop the bleeding, restore service, and preserve the evidence for root-causing."**

**What this means operationally, in order:**
1. If impact started around the time you deployed, assume the deploy did it. Roll back. Do not read the diff first.
2. Take partial mitigations. Half the customers working beats all of them broken while you think.
3. Preserve evidence *before* you mitigate where mitigation destroys it (copy the log lines, screenshot the Stripe event, note the request id). This is the one thing that is genuinely in tension with speed and it is why SRE names it explicitly in the same sentence.
4. Only after impact stops do you diagnose. A forward-fix written under time pressure is how a SEV2 becomes a SEV1.

### 2.5 One-person and very small teams — the literature is thin, and I should say so plainly

**Honest assessment:** essentially all substantive incident-management writing assumes a rota. Google SRE, PagerDuty's response docs, and Atlassian's handbook all presuppose multiple humans. What comes back on a solo-founder search is almost entirely vendor content marketing (Rootly has six near-duplicate pages on "SRE incident management for startups"), which is generic and mostly restates the enterprise material with the word "startup" inserted. I did not find a rigorous primary source aimed at a single-operator production system. Treat this section as reasoned adaptation, not established practice.

What the small-team writing does converge on, and what I judge actually transfers:

- **Do not copy a bureaucratic plan.** [Rootly](https://rootly.com/blog/incident-management-for-start-ups-best-practices-to-get-started): "a simple, clear process that everyone understands is far more effective than a perfect one that no one follows." At n=1, the process must survive being read at 9pm on a Saturday by a tired person. Anything longer than one screen will not be read.
- **Keep the roles as a mental gear-shift, drop them as job titles.** The value that survives is: at any moment, know whether you are Commanding (deciding), Operating (typing), or Communicating. Do not do two at once.
- **Runbooks are the highest-leverage artifact for a small team**, because there is no colleague to ask. Start with the most critical alerts and grow the library.
- **Automate the chores** (channel creation, timeline capture) because at n=1 cognitive energy is the scarce resource, not headcount.

Three things I would add that the literature does not, because they are specific to n=1:
- **The single point of failure is the human.** A rota exists so the system survives one person being asleep, on a plane, or at a wedding. A solo founder cannot fix this with process; the only real answers are to reduce the number of things that need a human at 3am (idempotent retries, reconciliation, fail-safe defaults), and to accept a stated response-time floor honestly rather than pretend to 24/7.
- **Write the timeline as you go, in one file, not after.** With no comms lead, the timeline is the only thing that survives the adrenaline. It is also 80% of the postmortem.
- **The postmortem discipline matters *more* at n=1, not less.** With a team, knowledge partially survives in other people's heads. Alone, an unwritten postmortem is gone by the next incident. This is the same conclusion the project's own retro reached in a different domain (`reference_retro_2026_07.md`, "gates work, advice doesn't").

### 2.6 Payment-specific: what a marketplace must do

**Stripe's documented mechanics** ([Stripe webhooks](https://docs.stripe.com/webhooks), [processing undelivered events](https://docs.stripe.com/webhooks/process-undelivered-events)):

- **Retries:** live mode, exponential backoff, **up to 3 days**. Sandbox: 3 attempts within a few hours.
- **Critical trap:** if your endpoint is **disabled or deleted** at the moment Stripe attempts a retry, Stripe makes **no future retry attempts for that event**. Disabling the endpoint during an incident permanently drops in-flight events. Returning 5xx keeps the 3-day retry alive. This is the single most expensive thing to get wrong at 9pm.
- **At-least-once delivery.** An endpoint "might occasionally receive the same event more than once." Dedupe on `event.id`; for the rare case of two distinct event objects for the same change, dedupe on `data.object.id` + `event.type`.
- **No ordering guarantee.** Handlers must not depend on arrival order.
- **Manual replay windows:** Dashboard "Resend" up to **15 days**; `stripe events resend <id> --webhook-endpoint=<ep>` up to **30 days**; `GET /v1/events` returns events from the **last 30 days**.
- **The recovery query:** `GET /v1/events` with `delivery_success=false`, `types[]=...`, and `ending_before=<an event id from before the endpoint went down>`, paginating to get chronological order.
- **Manual resend does not cancel automatic retry.** So a manual replay can collide with Stripe's own retry; your handler must return 200 for an already-processed event to stop the retry loop.

**The layered model** that the practitioner writing converges on: retries handle minutes of failure, replay handles hours, reconciliation handles everything else. Use all three.

**How Solen already stands against this:**

| Requirement | Solen status |
|---|---|
| Idempotent by `event.id` | ✅ `processed_webhook_events` with `event_id` as PRIMARY KEY, atomic insert-claim, 23505 = duplicate no-op (`app/api/stripe/webhook/route.ts:61-74`) |
| Claim released on handler failure so Stripe retries | ✅ documented and implemented at `:76-79` |
| Rejection paths alert a human | ✅ `reportError` on both sig-verify and claim-error (`:43-45`, `:71-72`) |
| Daily reconciliation vs Stripe | ✅ `app/api/cron/reconcile/route.ts`, read-only, emails mismatches, never auto-fixes |
| Coverage gaps in reconciliation | ⚠️ walk-in charges, salon gift-vouchers, and discount-voucher purchases are explicitly skipped (documented in the route header). Those classes are unreconciled by design |
| A replay/recovery script ready in advance | ❌ **does not exist.** `grep -rn "delivery_success\|events.list" app lib scripts` returns nothing. The consistent advice is: write it on day one, not at 2am |

---

## PART 3 — Proposed principle

Two artifacts, deliberately small. Everything below is a proposal; nothing is written.

### 3.1 Where it goes (rule 12: extend, do not duplicate)

- **`_plans/OPS_RUNBOOK.md`** gains one new section, "Incident response," placed first. This unblocks `observability-9` in the place that finding itself named.
- **`_plans/POSTMORTEMS/`** with `_TEMPLATE.md`, also as named by that finding.
- **`_backend-system/LAW.md` §14** gains one row so the LAW table stops implying alert routing is settled when the paging half is not built.
- Cross-link `_rules/RELEASE.md:14-43` from the new section rather than restating the Netlify steps.

### 3.2 The principle, as it would read

> **Incident response principle.** When something is broken in production, you are doing two jobs and only one at a time: **deciding** (what is the severity, what do I press) and **doing** (typing the fix). Stop the bleeding before you understand it. Write down what happened while it is happening, not after. Anything that reached a customer, cost money, or that you learned about from a human instead of from the digest gets one page written within 48 hours, and every action item in it has your name and a date.

### 3.3 Severity, named against Solen's actual flows

Three levels. Rule zero, borrowed verbatim from PagerDuty because it is the one that saves time: **if you are unsure between two levels, it is the higher one. Do not debate severity during an incident.**

**SEV1 — money or data is wrong. Act now, whatever time it is.**
Triggers, by name:
- A customer was charged and no booking exists, or a booking exists and no charge does. Signal: `reconcile` cron mismatch email, or a `stripe-webhook-signature` / `stripe-webhook-claim` alert from `app/api/stripe/webhook/route.ts:43,71` repeating.
- Stripe webhook delivery failing for more than ~1 hour (rotated `STRIPE_WEBHOOK_SECRET` is the named cause; the Apple secret rotation risk is already tracked, so rotation is a known event here).
- `/api/health` returning 503 on two consecutive 15-minute checks, or DB unreachable.
- Any data loss or corruption, at any scale. One row counts.
- A walk-in customer paid and got no queue number (`app/api/walkin/pay-intent/route.ts`, `app/api/bookings/walk-in/route.ts`), because that person is physically standing in a shop.

**SEV2 — a core flow is broken, no money at risk, no workaround.**
- Booking creation failing (`app/api/bookings/route.ts:117`).
- Slots empty or wrong platform-wide (`app/api/slots/route.ts`, `generate-slots` cron). This is the silent one: an empty slots response is indistinguishable from "fully booked."
- Login/signup broken (`app/api/auth/login/route.ts`, `signup`, `verify-otp`).
- Site up but unusable.

**SEV3 — degraded, or a workaround exists.**
- One salon's data wrong; emails or SMS delayed; a single cron missed (the digest's heartbeat section catches this); a page renders badly.
- Handle in normal working hours. Still gets a line in the worklog; only gets a postmortem if it recurs.

### 3.4 The 9pm ladder (this is the part that has to fit on one screen)

```
1. WRITE THE CLOCK. Open a scratch file. First line: time + what you saw + how you found out.
   Keep appending. This is the postmortem later.

2. SEVERITY. Money/data wrong = SEV1. Core flow dead, no workaround = SEV2. Else SEV3.
   Unsure = the higher one.

3. STOP THE BLEEDING, in this order. Do not diagnose first.
   a. Did you deploy in the last hour? Netlify -> Deploys -> last good -> Publish deploy.
      (_rules/RELEASE.md:14-26). Under a minute. No commit needed.
   b. Not a deploy? Kill the flow with a flag: /dashboard/feature-flags-admin
      payments (8 routes) | bookings (20 routes) | maintenance_mode (all 150)
      Live within 30s (lib/feature-flags.ts FLAG_TTL_MS).
      KNOW THIS: the flag read fails OPEN. If Supabase is down, the switch does nothing.
      KNOW THIS: maintenance_mode does not gate pages, only API mutations.
   c. NEVER disable the Stripe webhook endpoint. If it is disabled when Stripe retries,
      those events are gone forever. Let it return 5xx; Stripe retries for 3 days.

4. SNAPSHOT BEFORE YOU CLEAN. Copy the request id, the Stripe event id, the error text.
   Netlify function logs age out in 24h-7d.

5. CHECK IT STOPPED. /api/health, then the actual flow in a browser.

6. ONLY NOW diagnose.

7. MONEY CHECK before you close a SEV1: run reconcile, compare Stripe to the DB for the
   whole window. Replay missed events with GET /v1/events?delivery_success=false
   &ending_before=<last good event id>. 30-day window. Handlers are idempotent
   (processed_webhook_events), so replay is safe.

8. Within 48h: _plans/POSTMORTEMS/YYYY-MM-DD-<slug>.md
```

### 3.5 Postmortem template fields

Required to exist; each is one to three lines, not an essay:

`Title / date / severity` · `Summary (one paragraph)` · `Impact (who, how many, how long, CHF if any)` · `Detection: how did I find out, and how long after it started` · `Timeline (from the scratch file)` · `Contributing causes (plural, blameless: what made this reasonable at the time)` · `What went well` · `Where I got lucky` · `Action items, each with owner + date + [MITIGATIVE] or [PREVENTATIVE]`

Trigger to write one, adapted from Google's list to a pre-launch solo estate:
- Any SEV1 or SEV2.
- Any data loss, at any scale.
- **Any incident you learned about from a human rather than from the digest, a red Actions run, or an alert email.** That gap is itself the finding.
- Any incident where a rollback or a flag flip was needed.
- The third recurrence of the same SEV3.

Not a postmortem: a routine cron retry the digest already surfaces.

### 3.6 The honest gaps this principle does not close

Named so they are decisions, not omissions:

1. **Nothing pages.** The fastest automated signal is a 15-minute health check that emails via GitHub; everything else is a 05:15 UTC digest. A SEV1 that starts at 6pm Friday and does not take the site down is invisible until Saturday morning. A written principle cannot fix that.
2. **No customer communication path exists.** No status page, no salon broadcast, no template. The Comms role has no channel to speak into.
3. **The Stripe replay script does not exist.** Step 7 above is currently a hand-written curl at 9pm.
4. **Backups are 24h RPO with no PITR** (`_plans/OPS_RUNBOOK.md:18`), so "restore" for a SEV1 data incident means losing up to a day.
5. `app/api/bookings/route.ts` does not `reportError` on a booking-creation failure, only on the confirmation email at `:614`. A SEV2 booking outage surfaces only via the 7-day failure-rate SLI in the next morning's digest.

### 3.7 Decisions only the owner can make

1. **Does anything page, and what does it cost?** Options, cheapest first: a free ntfy/Pushover topic that `alertAdmin` also posts to (roughly an afternoon, no account cost); UptimeRobot with SMS on `/api/health` (already the standing recommendation at `_plans/OPS_RUNBOOK.md:9`, needs an account signup); a real paging service (overkill today). **My recommendation: the ntfy/Pushover push, wired as a second sink inside `lib/alert-admin.ts`, gated to SEV1-class scopes only.** It is the only option that is agent-buildable end to end and it turns a 24h blind window into minutes. But it is a spend/notification-habit decision and it means your phone can wake you, which is exactly the thing you may not want.
2. **When does the severity clock start?** Solen is pre-launch with seed data (`project_prelaunch_no_real_customers.md`). Today nothing is genuinely SEV1 because no real customer can be harmed. The principle should state a launch date or a condition ("from the first real paid booking") after which these definitions bind, otherwise it is theatre from day one.
3. **What is the honest response-time floor?** "I respond to SEV1 within X" where X is a number you will actually hit alone. Everything downstream (whether a status page is needed, whether the digest cadence is enough) follows from that number. I cannot pick it.
4. **Who tells the salons, through what channel?** This is the Comms half and it does not exist. Even a two-line WhatsApp template and a decision on who gets told at which severity would close it.
5. **Build the Stripe replay script now, or on first incident?** The consistent external advice is "write it on day one." Cost is a few hours. Against that: pre-launch there is nothing to replay.
6. **Should the postmortem trigger be enforced or behavioural?** `observability-9` itself proposed "checklist / behavioral rule," but this estate's own retro concluded gates work and advice does not. A Stop-gate that refuses to close a session that mentions a production incident with no `_plans/POSTMORTEMS/` file is buildable. Whether that is proportionate at n=1 is a taste call.

Files most relevant to whoever writes this: `/Users/sulo/Documents/solen/.claude/worktrees/quirky-ellis-ef5559/_plans/OPS_RUNBOOK.md`, `/Users/sulo/Documents/solen/.claude/worktrees/quirky-ellis-ef5559/_rules/RELEASE.md`, `/Users/sulo/Documents/solen/.claude/worktrees/quirky-ellis-ef5559/_backend-system/LAW.md` (§14 Observability, lines 351-368), `/Users/sulo/Documents/solen/.claude/worktrees/quirky-ellis-ef5559/lib/feature-flags.ts`, `/Users/sulo/Documents/solen/.claude/worktrees/quirky-ellis-ef5559/lib/error-report.ts`, `/Users/sulo/Documents/solen/.claude/worktrees/quirky-ellis-ef5559/app/api/stripe/webhook/route.ts`, `/Users/sulo/Documents/solen/.claude/worktrees/quirky-ellis-ef5559/_design-system/research/missing-principles-2026-07-26/observability.json`.

**Sources:** [Google SRE, Managing Incidents](https://sre.google/sre-book/managing-incidents/) · [Google SRE Incident Management Guide](https://sre.google/resources/practices-and-processes/incident-management-guide/) · [Google SRE, Postmortem Culture](https://sre.google/sre-book/postmortem-culture/) · [PagerDuty Severity Levels](https://response.pagerduty.com/before/severity_levels/) · [FireHydrant, Getting started with severity levels](https://firehydrant.com/blog/getting-started-with-severity-levels/) · [Rootly, Practical guide to SRE incident severity levels](https://rootly.com/blog/practical-guide-to-sre-incident-severity-levels) · [incident.io, The lifecycle of an incident](https://incident.io/guide/response/the-lifecycle-of-an-incident) · [incident.io, SRE incident postmortem best practices](https://incident.io/blog/sre-incident-postmortem-best-practices) · [Microsoft Azure Well-Architected, Incident Management](https://learn.microsoft.com/en-us/azure/well-architected/design-guides/incident-management) · [Stripe, Webhooks](https://docs.stripe.com/webhooks) · [Stripe, Process undelivered events](https://docs.stripe.com/webhooks/process-undelivered-events) · [Rootly, Incident management for start-ups](https://rootly.com/blog/incident-management-for-start-ups-best-practices-to-get-started) · [oneuptime, How to build postmortem templates](https://oneuptime.com/blog/post/2026-01-30-sre-postmortem-templates/view)