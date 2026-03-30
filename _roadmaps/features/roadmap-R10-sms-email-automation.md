# R10: SMS & Email Automation (Cron Jobs)

> **Wave 2** — Depends on Manual Steps 1, 2, 4 (seven.io, Resend, Vercel cron plan).
> **Note**: This roadmap follows `ROADMAP_RULES.md` strict formatting.

## R1: BREAKAGE RISK ASSESSMENT

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1: SMS provider lib | 🟢 SAFE | New file, no existing code touched | Unit-test the wrapper before integration. |
| Phase 2: Booking reminders cron | 🟡 MEDIUM | Could spam SMS if query logic wrong | Add safeguards: `sent_reminder_24h` / `sent_reminder_1h` boolean columns. Never re-send. |
| Phase 3: Review prompt emails | 🟡 MEDIUM | Could email about cancelled bookings | Filter: only `status = 'completed'` bookings. Check `reviews` table for existing review. |
| Phase 4: Barber visit-cycle | 🟡 MEDIUM | Could trigger for non-barber salons | Filter: only salons with `category = 'barbershop'`. |

---

## R2: SEPARATE MANUAL VS CODE PHASES

**🧑 MANUAL PHASES**
- Manual Step 1: seven.io API key is NOT YET SET — build all SMS code with graceful skip (`if (!process.env.SEVEN_IO_API_KEY) return;`)
- Manual Step 2: Resend API key is in Vercel env vars ✅
- Manual Step 4: Vercel Pro plan confirmed for cron support ✅

> ⚠️ **IMPORTANT**: Phone/SMS provider is not yet configured. All SMS-sending code MUST check for the env var and skip gracefully if missing. Log a warning but do NOT throw errors. The UI should still render correctly — just no actual SMS gets sent until the key is added later.

**🤖 CLAUDE CODE PHASES**
- Phase 1: SMS provider wrapper (`lib/sms.ts`)
- Phase 2: Booking reminders cron (24h + 1h SMS)
- Phase 3: Review prompt email cron (24h after completion)
- Phase 4: Barber visit-cycle reminder cron
- Phase 5: Post-Execution Smoke Test

---

## Phase 1: SMS Provider Wrapper

#### Files
- `[NEW]` `lib/sms.ts`

#### Instructions
1. Create a thin wrapper around seven.io HTTP API:
```typescript
export async function sendSMS(to: string, message: string): Promise<boolean> {
  if (!process.env.SEVEN_IO_API_KEY) {
    console.warn('[SMS] SEVEN_IO_API_KEY not set — skipping');
    return false;
  }
  const response = await fetch('https://gateway.seven.io/api/sms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': process.env.SEVEN_IO_API_KEY,
    },
    body: JSON.stringify({
      to,
      text: message,
      from: 'solen.ch',
    }),
  });
  return response.ok;
}
```
2. Add input validation: Swiss phone numbers must start with `+41`.
3. Add rate limiting: max 3 SMS per phone number per day.

---

## Phase 2: Booking Reminder Cron (24h + 1h)

#### Files
- `[NEW]` `app/api/cron/sms-reminders/route.ts`
- `[MODIFY]` `vercel.json` — add cron schedule

#### Instructions
1. Create cron route that runs every 30 minutes.
2. Query bookings where:
   - `status = 'confirmed'`
   - `start_time` is between 23.5h–24.5h from now (24h reminder) OR 0.5h–1.5h from now (1h reminder)
   - `sent_reminder_24h = false` or `sent_reminder_1h = false`
3. For each booking, send SMS via `lib/sms.ts`:
   - 24h: `"Erinnerung: Morgen um {time} bei {salon_name}. Adresse: {address}"`
   - 1h: `"In 1 Stunde: Termin bei {salon_name} um {time}."`
4. Mark `sent_reminder_24h` / `sent_reminder_1h` = true after sending.
5. Respect per-salon SMS toggle: check `salons.sms_reminders_enabled` column.
6. Add Vercel cron entry: `{ "path": "/api/cron/sms-reminders", "schedule": "*/30 * * * *" }`
7. Protect route with `CRON_SECRET` header validation.

> ⚠️ **BE CAREFUL**: If `sent_reminder_24h` / `sent_reminder_1h` columns don't exist on the `bookings` table, create a migration FIRST.

---

## Phase 3: Review Prompt Email Cron

> ⚠️ **PRE-EXISTING CODE**: `app/api/cron/review-prompt/route.ts` ALREADY EXISTS. Check it first — may only need modifications, not a new file.

#### Files
- `[MODIFY]` `app/api/cron/review-prompt/route.ts` (already exists — improve, don't recreate)

#### Instructions
1. Create cron route that runs every hour.
2. Query bookings where:
   - `status = 'completed'`
   - `end_time` is between 23h–25h ago (24h window)
   - No existing review in `reviews` table for this `booking_id`
   - `review_prompt_sent = false`
3. Send email via Resend:
   - Subject: `"Wie war dein Termin bei {salon_name}?"`
   - Body: HTML email with rating stars + link to `/{locale}/salon/{slug}?review=true`
   - Use existing email templates from `lib/email-templates/` if available
4. Mark `review_prompt_sent = true`.
5. Add Vercel cron: `{ "path": "/api/cron/review-prompts", "schedule": "0 * * * *" }`

---

## Phase 4: Barber Visit-Cycle Reminders

> ⚠️ **PRE-EXISTING CODE**: `app/api/dashboard/barber-reminders/route.ts` and `app/api/dashboard/barber-reminders/send/route.ts` ALREADY EXIST. Check them first.

#### Files
- `[MODIFY]` `app/api/dashboard/barber-reminders/route.ts` (already exists)
- `[MODIFY]` `app/api/dashboard/barber-reminders/send/route.ts` (already exists)
- `[NEW]` `components/dashboard/barber/SmartReminders.tsx` (if not already existing)
- `[MODIFY]` `app/[locale]/dashboard/barber-ops/page.tsx`

#### Instructions
1. Use existing `lib/barber/visit-cycle-algorithm.ts` (NOT `visit-cycle.ts` — correct filename!) to detect overdue clients.
2. Cron runs daily at 10:00 AM: `{ "path": "/api/cron/barber-reminders", "schedule": "0 10 * * *" }`
3. Query: barber salons → clients with `barber_cut_history` → calculate if overdue → send SMS.
4. SMS: `"Hey {name}, dein letzter Besuch bei {salon} war vor {X} Wochen. Buch deinen nächsten Termin: {link}"`
5. Dashboard component `SmartReminders.tsx`: table of overdue clients grouped by barber with manual "Erinnerung senden" button.
6. Add SmartReminders to `barber-ops/page.tsx` as a new tab/section.

---

## Phase 5: Smoke Test

#### Verification
```bash
npm run build
npx tsc --noEmit
# Verify cron entries:
grep -n "cron" vercel.json
# Should show 3 cron entries (sms-reminders, review-prompts, barber-reminders)
# Verify routes exist:
ls app/api/cron/sms-reminders/route.ts
ls app/api/cron/review-prompts/route.ts
ls app/api/cron/barber-reminders/route.ts
```

---

## R6: DEPENDENCY ORDERING TABLE

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | SMS wrapper lib | Manual Steps 1 |
| Phase 2 | 🤖 | Booking reminders cron | Phase 1 + Manual Step 4 |
| Phase 3 | 🤖 | Review prompt emails | Manual Steps 2, 4 |
| Phase 4 | 🤖 | Barber reminders | Phase 1 |
| Phase 5 | 🤖 | Smoke Test | All phases |
