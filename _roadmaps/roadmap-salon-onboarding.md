# Roadmap: Salon Onboarding & Management
## T&S Compliance + Missing Features

> **Created**: 2026-03-23
> **Topic**: Salon Onboarding & Management (solen-terms-of-service.md compliance)
> **Protocol**: Full Platform Audit (`_tasks/roadmap-full-platform-audit.md`)

---

## ⚠️ BREAKAGE RISK TABLE (R1)

| Phase | Risk | Could Break | Prevention |
|---|---|---|---|
| 1.1 DB migration | 🟢 SAFE | Nothing | New column, DEFAULT 'instant' — all existing salons unaffected |
| 1.2 Booking engine | 🟡 MEDIUM | Auto-confirm flow | Default to 'instant' — existing behavior unchanged unless salon opts in |
| 1.3 Settings UI | 🟢 SAFE | Nothing | New toggle only, no existing form logic touched |
| 2.1 account_actions migration | 🟢 SAFE | Nothing | New table only |
| 2.2–2.3 Admin warn/freeze | 🟢 SAFE | Nothing | New routes (don't exist yet) |
| 3.1 Solen score penalty | 🟡 MEDIUM | Salon rankings | Only affects warned/frozen salons — healthy salons unaffected |
| 4.1–4.2 Frozen banner | 🟢 SAFE | Nothing | Read-only UI, no logic changes |
| 5.1–5.4 Documents | 🟢 SAFE | Nothing | New table + new page + new API |
| 6.1–6.4 Reports | 🟢 SAFE | Nothing | New table + new component |
| 7 CLAUDE.md update | 🟢 SAFE | Nothing | Documentation only |

---

## AUDIT SUMMARY

### ✅ EXISTS (fully implemented)

- `services` table + full CRUD UI at `/dashboard/services` — name, price CHF, duration, category, photos, buffer time
- `staff_members` table + invite flow + per-staff permissions (`/dashboard/staff`)
- `payment_mode` on `salons` (`prepay` | `deposit` | `at_salon`) — full payment flow
- `cancellation_hours`, `late_cancel_fee_percent` on salons
- `warning_count`, `frozen_at`, `frozen_reason` on `salons` (migration 063)
- `solen_score` + `solen_tier` on salons for search ranking
- `/api/admin/salons/[id]/approve` and `/api/admin/salons/[id]/reject` routes
- `/api/admin/solen-score/recalculate/route.ts` — solen score computation
- Settings page with Hours editor, payment mode, cancellation policy (5 existing tabs)
- Service photo upload (calls `/api/services/photos`)

### ⚠️ PARTIAL (exists but incomplete)

- **Warning system**: `warning_count` counter exists (migration 063), but no `account_actions` audit trail — violates T&S §6.6 tiered system accountability (no record of WHO warned, WHEN, WHY)
- **Search demotion**: `solen_score` exists but recalculation cron does NOT apply any penalty based on `warning_count` — demotion from T&S §6.6 step 2 never actually happens
- **Photo moderation**: Photo upload works but zero "Report Content" mechanism anywhere — violates T&S §6.5
- **Frozen salon UI**: `frozen_at` column exists but only checked in settings page — no visible dashboard-level warning banner

### ❌ MISSING (does not exist at all)

- `booking_confirmation_mode` (`instant` | `manual_approval`) on `salons` — T&S §3.1 CRITICAL. ALL bookings currently auto-confirm with no salon choice.
- Booking engine does NOT check any confirmation mode — no pending-until-approved flow
- `/api/admin/salons/[id]/warn` route — DOES NOT EXIST
- `/api/admin/salons/[id]/freeze` route — DOES NOT EXIST
- `account_actions` audit table — no history of tiered enforcement actions
- `salon_documents` table + upload API — T&S §2.4 requires right to request certifications
- `/dashboard/verification` page — 404s currently
- `content_reports` table + report button UI

---

## 🤖 CLAUDE CODE PHASES

---

### Phase 1: Booking Confirmation Mode (T&S §3.1) 🔴 CRITICAL

**T&S says** (§3.1): "Sofortige Bestätigung" = auto-confirmed once payment succeeds. "Bestätigung durch den Salon" = stays pending until salon confirms. This is a hard T&S commitment — salons must be able to choose their confirmation mode.

---

**1.1 — Migration 075** `[NEW] supabase/migrations/075_booking_confirmation_mode.sql`

```sql
-- T&S §3.1: booking confirmation mode per salon
ALTER TABLE salons ADD COLUMN IF NOT EXISTS booking_confirmation_mode text
  DEFAULT 'instant'
  CHECK (booking_confirmation_mode IN ('instant', 'manual_approval'));

-- Add pending_approval as valid booking status
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check CHECK (
  status IN ('pending', 'pending_approval', 'confirmed', 'cancelled', 'completed', 'no_show')
);

COMMENT ON COLUMN salons.booking_confirmation_mode IS
  'T&S §3.1: instant = auto-confirm on payment success, manual_approval = stays pending_approval until salon confirms';
```

> ⚠️ **BE CAREFUL**: DEFAULT MUST be 'instant'. This preserves all existing salons' behavior. The bookings status constraint only ADDS 'pending_approval' — it does not remove existing status values. Read the existing constraint name before dropping.

✅ DO: `DEFAULT 'instant'` — all existing salons auto-confirm (unchanged)
❌ DON'T: `DEFAULT 'manual_approval'` — would silently break every existing salon's booking flow

---

**1.2 — Booking engine** `[MODIFY] app/api/bookings/route.ts`

READ THIS FILE FULLY FIRST. In the POST handler, fetch `booking_confirmation_mode` from the salon record and use it to set the booking status:

```typescript
// ✅ CORRECT — after fetching salon data
const confirmMode = salon.booking_confirmation_mode ?? 'instant';
const bookingStatus = confirmMode === 'instant' ? 'confirmed' : 'pending_approval';
// Use bookingStatus when inserting booking row
```

```typescript
// ❌ WRONG — hardcoded, breaks manual_approval salons
status: 'confirmed'
```

---

**1.3 — Settings UI toggle** `[MODIFY] app/[locale]/dashboard/settings/page.tsx`

READ THIS FILE FULLY FIRST. In the "Allgemein" tab (first tab), add a new setting row "Buchungsbestätigung" after the existing general fields:

- Toggle: "Sofortige Bestätigung" ↔ "Manuelle Freigabe"
- Sub-label: "Buchungen werden automatisch bestätigt" vs "Sie müssen jede Buchung manuell freigeben"
- Saves via PATCH to `/api/salons/mine` with `{ booking_confirmation_mode: value }`
- Use existing `ToggleLeft` / `ToggleRight` icons (already imported in this file)

---

**1.4 — Types update** `[MODIFY] lib/types.ts`

```typescript
// Add to Salon interface:
booking_confirmation_mode?: 'instant' | 'manual_approval';

// Add to booking status type (wherever it's defined):
// 'pending_approval' alongside existing values
```

Verification:
```bash
npm run build
# Navigate to /dashboard/settings — toggle must appear and save
```

Commit: `git commit -m "phase 1: booking_confirmation_mode — T&S §3.1 compliance"`

---

### Phase 2: Admin Warn + Freeze Routes + Account Actions Audit (T&S §6.6)

**T&S says** (§6.6): "Warning → Demotion → Suspension → Removal" tiered system with solen.ch retaining "final discretion". Requires a proper audit trail.

---

**2.1 — Migration 076** `[NEW] supabase/migrations/076_account_actions.sql`

```sql
CREATE TABLE IF NOT EXISTS public.account_actions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id uuid REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
  action_type text NOT NULL CHECK (action_type IN (
    'warning', 'demotion', 'suspension', 'removal', 'reinstatement'
  )),
  reason text NOT NULL,
  admin_id uuid REFERENCES profiles(id) NOT NULL,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.account_actions ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY "account_actions_admin_all" ON public.account_actions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Salon owner: read their own action history
CREATE POLICY "account_actions_salon_read" ON public.account_actions
  FOR SELECT USING (
    salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  );
```

---

**2.2 — Admin warn route** `[NEW] app/api/admin/salons/[id]/warn/route.ts`

Full security stack (CLAUDE.md Rule S1): auth → admin role check → rate limit → zod validation.

```typescript
// POST body: { reason: string }
// Action:
// 1. Increment salons.warning_count by 1
// 2. If warning_count reaches 3, set frozen_at = now(), frozen_reason = reason
// 3. INSERT into account_actions: { salon_id, action_type: 'warning', reason, admin_id }
// 4. logAuditEvent({ actor_id, action: 'warn_salon', target_type: 'salon', target_id: id })
// Returns: { success: true, warning_count: newCount }
```

✅ DO: Check admin role from DB (`profiles.role === 'admin'`) — never trust JWT claim alone (Rule S6)
❌ DON'T: Trust `req.headers.get('x-role')` or skip the admin check

---

**2.3 — Admin freeze route** `[NEW] app/api/admin/salons/[id]/freeze/route.ts`

```typescript
// POST body: { reason: string }
// Action:
// 1. SET salons.frozen_at = now(), salons.frozen_reason = reason
// 2. INSERT into account_actions: { salon_id, action_type: 'suspension', reason, admin_id }
// 3. logAuditEvent({ actor_id, action: 'freeze_salon', target_type: 'salon', target_id: id })
// Returns: { success: true }
```

---

**2.4 — Types update** `[MODIFY] lib/types.ts`

```typescript
export interface AccountAction {
  id: string;
  salon_id: string;
  action_type: 'warning' | 'demotion' | 'suspension' | 'removal' | 'reinstatement';
  reason: string;
  admin_id: string;
  resolved_at: string | null;
  created_at: string;
}
```

> ⚠️ **BE CAREFUL**: Both routes are NEW (they don't exist yet). Model them after the existing `approve` route at `app/api/admin/salons/[id]/approve/route.ts` — read that file first as a template for the security stack pattern.

Commit: `git commit -m "phase 2: admin warn+freeze routes + account_actions audit — T&S §6.6"`

---

### Phase 3: Search Demotion (T&S §6.6 Step 2)

**T&S says** (§6.6): "Herabstufung — reduzierte Sichtbarkeit in den Suchergebnissen" is step 2 of the tiered system. This must actually happen.

---

**3.1 — Update solen score cron** `[MODIFY] app/api/admin/solen-score/recalculate/route.ts`

READ THIS FILE FULLY FIRST. After the base score is computed (do NOT change how the base score is calculated), apply a penalty multiplier:

```typescript
// ✅ CORRECT — add AFTER base score computation, not inside it
let penaltyMultiplier = 1.0;
if (salon.frozen_at) {
  penaltyMultiplier = 0; // frozen = not visible in discovery (T&S §6.6 step 3)
} else if ((salon.warning_count ?? 0) >= 2) {
  penaltyMultiplier = 0.65; // 2+ warnings = significant demotion (T&S §6.6 step 2)
} else if ((salon.warning_count ?? 0) >= 1) {
  penaltyMultiplier = 0.85; // 1 warning = mild demotion (T&S §6.6 step 1)
}
const finalScore = Math.round(rawScore * penaltyMultiplier);
// Use finalScore (not rawScore) for the DB update
```

```typescript
// ❌ WRONG — don't change the base scoring algorithm
// Don't restructure or rewrite the computation — only add the multiplier at the end
```

> ⚠️ **BE CAREFUL**: Only modify the final assignment step. The base scoring logic (reviews, response rate, completion rate, etc.) must stay exactly as-is. A frozen salon's `solen_score` goes to 0, making them invisible in discovery and search ranking.

Commit: `git commit -m "phase 3: search demotion penalty for warned/frozen salons — T&S §6.6"`

---

### Phase 4: Frozen Salon Dashboard Banner

**4.1 — FrozenSalonBanner component** `[NEW] components/dashboard/FrozenSalonBanner.tsx`

```tsx
// Props: { salon: Salon }
// Only renders when salon.frozen_at is not null
// Content:
//   - AlertTriangle icon (from lucide-react)
//   - "Ihr Salon-Konto wurde eingefroren" heading (font-heading)
//   - salon.frozen_reason text
//   - "Bitte kontaktieren Sie support@solen.ch zur Klärung"
// Styling: bg-s-error-bg border border-s-error/20 rounded-card p-4 mb-6
// NOT blocking — full navigation still available
```

✅ DO: Use `bg-s-error-bg border-s-error/20` for error styling
❌ DON'T: Use `bg-red-100 border-red-300` (banned tokens per CLAUDE.md Rule 20)

---

**4.2 — Mount in DashboardLayout** `[MODIFY] components/dashboard/DashboardLayout.tsx`

READ THIS FILE FULLY FIRST. Find where the main content area begins (after the sidebar). Import and render `<FrozenSalonBanner salon={salon} />` at the top of the `<main>` content area. The salon data should already be fetched in this component.

> ⚠️ **BE CAREFUL**: Do NOT lock users out of dashboard navigation. The banner is informational only. Frozen salon owners must still be able to access messages and settings to contact support and appeal.

Commit: `git commit -m "phase 4: frozen salon warning banner in dashboard"`

---

### Phase 5: Certification / Document Upload (T&S §2.4 + §6.2)

**T&S says** (§2.4): "solen.ch reserves the right to request additional documentation at any time, including commercial register entries, trade licenses, professional certifications, or proof of address." (§6.2): "Salon Partners are strongly encouraged to hold relevant professional certifications."

---

**5.1 — Migration 077** `[NEW] supabase/migrations/077_salon_documents.sql`

```sql
CREATE TABLE IF NOT EXISTS public.salon_documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id uuid REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
  document_type text NOT NULL CHECK (document_type IN (
    'trade_license', 'professional_cert', 'hygiene_cert',
    'id_proof', 'address_proof', 'other'
  )),
  file_url text NOT NULL,
  file_name text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note text,
  uploaded_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES profiles(id)
);

ALTER TABLE public.salon_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "salon_documents_owner_all" ON public.salon_documents
  FOR ALL USING (
    salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  );

CREATE POLICY "salon_documents_admin_all" ON public.salon_documents
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

---

**5.2 — Document upload API** `[NEW] app/api/salon/documents/route.ts`

- `GET`: returns all documents for the authenticated salon owner
- `POST` (multipart/form-data): uploads file to Supabase Storage `salon-documents` bucket (private), inserts DB row
- `DELETE` (`?id=<doc_id>`): deletes own document (owner check enforced)
- Full security stack: auth → ban check → rate limit (generalLimiter) → zod validation
- File validation: max 10MB, accept PDF/JPG/PNG only

---

**5.3 — Verification page** `[NEW] app/[locale]/dashboard/verification/page.tsx`

Uses `DashboardLayout` (import from `@/components/dashboard/DashboardLayout`). Do NOT import Header or BottomNav (Rule 27).

Page content:
- Heading: "Dokumente & Verifizierung"
- Explainer: "Optional, aber empfohlen — solen.ch kann jederzeit Nachweise anfordern (AGB §2.4)"
- Upload form: document type dropdown + file input (PDF/JPG/PNG, max 10MB) + "Hochladen" button
- Document list: shows `file_name`, `document_type` label, `status` badge (pending=grey, approved=`s-sage`, rejected=`s-error`)
- Empty state: "Noch keine Dokumente hochgeladen. Laden Sie optionale Nachweise hoch."
- Calls GET `/api/salon/documents` on load, POST on upload

---

**5.4 — Types update** `[MODIFY] lib/types.ts`

```typescript
export interface SalonDocument {
  id: string;
  salon_id: string;
  document_type: 'trade_license' | 'professional_cert' | 'hygiene_cert' | 'id_proof' | 'address_proof' | 'other';
  file_url: string;
  file_name: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_note: string | null;
  uploaded_at: string;
}
```

---

**5.5 — Sidebar nav link** `[MODIFY] components/dashboard/Sidebar.tsx`

READ THIS FILE FULLY FIRST. Add a "Verifizierung" nav item to the OWNER section (not STAFF section) with `ShieldCheck` icon from lucide-react, pointing to `/{locale}/dashboard/verification`.

> ⚠️ **BE CAREFUL**: The verification page must NOT render Header/BottomNav. The `salon-documents` Supabase Storage bucket must be created manually BEFORE deploying (see Manual A below).

Commit: `git commit -m "phase 5: salon_documents upload + verification page — T&S §2.4"`

---

### Phase 6: Content Report Button (T&S §6.5)

**T&S says** (§6.5): No stock photos, no misleading images, no minors, no nudity, no discriminatory content. "solen.ch reserves the right to remove content that violates these guidelines without prior notice." At minimum: a report button.

---

**6.1 — Migration 078** `[NEW] supabase/migrations/078_content_reports.sql`

```sql
CREATE TABLE IF NOT EXISTS public.content_reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id uuid REFERENCES profiles(id),
  content_type text NOT NULL CHECK (content_type IN (
    'service_photo', 'salon_photo', 'review', 'discovery_item'
  )),
  content_id text NOT NULL,
  reason text NOT NULL CHECK (reason IN (
    'stock_photo', 'misleading', 'minors', 'nudity', 'discriminatory', 'other'
  )),
  details text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can submit a report
CREATE POLICY "content_reports_insert_auth" ON public.content_reports
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Admin: full access for moderation
CREATE POLICY "content_reports_admin_all" ON public.content_reports
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

---

**6.2 — Report API route** `[NEW] app/api/content-report/route.ts`

- `POST`: validates body `{ content_type, content_id, reason, details? }` via zod schema
- Auth required + rate-limited (max 10 reports per user per hour via `generalLimiter`)
- Returns `{ success: true }`

---

**6.3 — ReportContentButton component** `[NEW] components/ui/ReportContentButton.tsx`

Small `Flag` icon button (from lucide-react). On click, opens a compact modal:
- Radio group: Stockfoto / Irreführend / Minderjährige / Nacktheit / Diskriminierend / Sonstiges
- Optional textarea for details (max 200 chars)
- Submit → POST `/api/content-report`
- On success: close modal + button turns into a grey "Gemeldet" label
- Styling: `text-s-ink/30 hover:text-s-error transition-colors` on the flag icon

Props: `contentType: 'service_photo' | 'salon_photo' | 'review' | 'discovery_item'`, `contentId: string`

✅ DO: Use `bg-s-error-bg` for the submitted state
❌ DON'T: Use `bg-red-100` (banned token per CLAUDE.md Rule 20)

---

**6.4 — Mount on service photos** `[MODIFY] app/[locale]/dashboard/services/page.tsx`

READ THIS FILE FULLY FIRST. The service photo thumbnails are inside `ServiceModal` (around lines 148–177). On each existing photo `<div>`, add `<ReportContentButton>` as an absolute-positioned overlay:

```tsx
// ✅ CORRECT — overlay on each photo thumbnail
<div key={i} className="relative w-16 h-16 rounded-button overflow-hidden border border-s-ink/10 group">
  <img src={url} alt="" className="w-full h-full object-cover" />
  {/* existing remove button stays */}
  <div className="absolute bottom-0.5 left-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
    <ReportContentButton contentType="service_photo" contentId={url} />
  </div>
</div>
```

> ⚠️ **BE CAREFUL**: The photo upload logic (lines ~160–176) must NOT be touched. Only add the ReportContentButton overlay to each existing photo div. Do not restructure ServiceModal.

Commit: `git commit -m "phase 6: content report button — T&S §6.5"`

---

### Phase 7: CLAUDE.md Schema Update (R8)

`[MODIFY] CLAUDE.md`

Update **Section 6 (Schema Table)** to add:

| Table | Key Columns | Notes |
|---|---|---|
| `account_actions` | `id`, `salon_id`, `action_type`, `reason`, `admin_id`, `resolved_at`, `created_at` | Tiered enforcement audit trail. action_type: warning/demotion/suspension/removal/reinstatement. Admin-write, salon-read-own. |
| `salon_documents` | `id`, `salon_id`, `document_type`, `file_url`, `file_name`, `status`, `admin_note`, `uploaded_at` | Certification/license uploads. status: pending/approved/rejected. Stored in private `salon-documents` bucket. |
| `content_reports` | `id`, `reporter_id`, `content_type`, `content_id`, `reason`, `details`, `status`, `created_at` | Content violations. Authenticated users can insert. Admin manages. |

Update `salons` row to note `booking_confirmation_mode` column (instant/manual_approval).

Update **Section 3.5 (Key Features)** — add entries for booking confirmation mode and document upload.

Commit: `git commit -m "phase 7: CLAUDE.md schema update"`

---

## 🧑 MANUAL PHASES

### Manual A: Create Supabase Storage Bucket (BEFORE Phase 5.2 deploy)

**Supabase Dashboard → Storage → New bucket:**
- Name: `salon-documents`
- Public: **OFF** (private — documents are sensitive legal/ID files)
- File size limit: `10` MB
- Allowed MIME types: `application/pdf, image/jpeg, image/png, image/webp`

> ⚠️ If this bucket doesn't exist before deploying Phase 5.2, document uploads will return 500 errors.

### Manual B: Run Migrations in Supabase SQL Editor

After each SQL file is created locally, apply them to the live database via **Supabase Dashboard → SQL Editor**:

1. `075_booking_confirmation_mode.sql`
2. `076_account_actions.sql`
3. `077_salon_documents.sql`
4. `078_content_reports.sql`

Run in this order. Each one is independent and can be run separately.

---

## DEPENDENCY ORDERING TABLE (R6)

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1.1 | 🤖 | Migration 075 — booking_confirmation_mode | Nothing |
| Phase 1.2–1.4 | 🤖 | Booking engine + settings toggle + types | Migration 075 applied |
| Phase 2.1 | 🤖 | Migration 076 — account_actions | Nothing |
| Phase 2.2–2.4 | 🤖 | Admin warn/freeze routes + types | Migration 076 applied |
| Phase 3.1 | 🤖 | Solen score penalty multiplier | Nothing (file exists) |
| Phase 4.1–4.2 | 🤖 | Frozen banner component + layout mount | Nothing (columns exist) |
| Manual A | 🧑 | Create `salon-documents` bucket | Before Phase 5.2 deploy |
| Phase 5.1 | 🤖 | Migration 077 — salon_documents | Nothing |
| Phase 5.2–5.5 | 🤖 | Document API + page + sidebar link + types | Migration 077 applied + Manual A done |
| Phase 6.1 | 🤖 | Migration 078 — content_reports | Nothing |
| Phase 6.2–6.4 | 🤖 | Report API + component + mount on photos | Migration 078 applied |
| Phase 7 | 🤖 | CLAUDE.md update | All phases done |

---

## POST-EXECUTION SMOKE TEST (Rule 29)

After ALL phases:

1. `npm run build` — 0 errors
2. `npx tsc --noEmit` — 0 errors
3. No dead components: every new `.tsx` imported at least once
4. `npx tsc --noEmit 2>&1 | grep "has no exported member"` = 0 results
5. **Booking mode test**: Set salon to `manual_approval` → create booking → status must be `pending_approval` not `confirmed`
6. **Admin warn test**: POST `/api/admin/salons/[id]/warn` → `account_actions` row inserted + `warning_count` incremented
7. **Frozen banner test**: Set `frozen_at = now()` on test salon → dashboard shows `FrozenSalonBanner`
8. **Document upload test**: Upload PDF → file in `salon-documents` bucket + row in `salon_documents` table
9. **Report button test**: Click Flag icon on service photo → POST to `/api/content-report` → row in `content_reports`
10. **Solen score test**: Run recalculate cron → salon with `warning_count=2` gets ~65% of raw score
11. **No duplicate layout elements**: Verification page must NOT render its own Header/BottomNav
12. **Sidebar link**: `/dashboard/verification` in Sidebar must not appear for staff roles (OWNER only)
