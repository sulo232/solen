# Roadmap: Dispute Handling (Review System)

> **T&S Compliance**: This roadmap implements §13 of solen.ch's Terms of Service — the customer complaint channel and 30-day mediation window required before court proceedings.
>
> **⚠️ RUN MIGRATION FIRST** — Phase 0 must be applied in Supabase before executing any Phase 1+ code.

---

## R1: BREAKAGE RISK ASSESSMENT

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 0 — Migration | 🟢 SAFE | Nothing (new table only) | Run in Supabase SQL editor |
| Phase 1 — Customer API | 🟢 SAFE | Nothing (new routes only) | New file, no existing routes touched |
| Phase 2 — Salon response API | 🟢 SAFE | Nothing (new PATCH only) | Extends Phase 1's route file |
| Phase 3 — Admin API | 🟢 SAFE | Nothing (new dir) | New `booking-disputes/` dir, not touching `disputes/` |
| Phase 4 — Customer UI | 🟡 MEDIUM | Profile page if wrong import | Read profile page FIRST, use existing booking card pattern |
| Phase 5 — Salon dashboard UI | 🟡 MEDIUM | Dashboard bookings page | Read dashboard bookings page FIRST |
| Phase 6 — Admin UI | 🟡 MEDIUM | Admin panel | Read admin disputes page FIRST, don't replace existing `price_disputes` UI |
| Phase 7 — Emails | 🟢 SAFE | Nothing (additive only) | New email triggers, no existing routes modified |
| Phase 8 — CLAUDE.md update | 🟢 SAFE | Documentation only | Append only, never delete |

**Files at risk in Phase 4–6** — read before touching:
- `app/[locale]/profile/page.tsx` or bookings history page (wherever completed bookings render)
- `app/[locale]/dashboard/bookings/page.tsx`
- `app/[locale]/dashboard/admin/` (admin panel entry)

---

## IMPORTANT: What Already Exists (Do NOT Rebuild)

| What | File | What It Does |
|---|---|---|
| `price_disputes` table | `supabase/migrations/038_price_disputes.sql` | **Salon-initiated upcharge requests** — DO NOT touch |
| `/api/bookings/[id]/dispute/route.ts` | POST = salon creates upcharge | **Different flow** — DO NOT modify |
| `/api/admin/disputes/route.ts` | Admin resolves price disputes | **Different purpose** — DO NOT modify |
| `warnings` table | `supabase/migrations/063_warnings.sql` | Used by Phase 3 admin "warn" action |

**The new system is `booking_disputes` — a parallel, customer-initiated complaint system. Never merge into `price_disputes`.**

---

## SEPARATION 🤖 CODE vs 🧑 MANUAL

### 🧑 MANUAL (Required Before Running Code)
- Run migration 075 in Supabase SQL editor (Phase 0)
- Add `dispute_reporting` key to `feature_flags` table in Supabase (Phase 0)
- Add `RESEND_API_KEY` env var if not present (Phase 7, should already exist)

### 🤖 CLAUDE CODE PHASES (Pure code changes)
- Phases 1 through 8

---

## PHASE 0: DATABASE MIGRATION 🧑 MANUAL
> **Run this SQL in Supabase Dashboard → SQL Editor before ANY code phases.**

**File: `supabase/migrations/075_booking_disputes.sql` [NEW]**

```sql
-- Migration 075: Customer-initiated booking dispute system
-- T&S §13: "solen.ch provides a channel for reporting issues"
-- SEPARATE from price_disputes (salon upcharges). This is customer complaints.

CREATE TABLE IF NOT EXISTS public.booking_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  issue_type text NOT NULL CHECK (issue_type IN ('quality', 'no_show_by_salon', 'wrong_service', 'overcharge', 'other')),
  description text NOT NULL CHECK (char_length(description) >= 20 AND char_length(description) <= 1000),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'resolved', 'escalated')),
  salon_response text CHECK (salon_response IS NULL OR char_length(salon_response) <= 1000),
  salon_responded_at timestamptz,
  resolution text CHECK (resolution IS NULL OR char_length(resolution) <= 500),
  resolved_by uuid REFERENCES auth.users(id),
  resolved_at timestamptz,
  mediation_started_at timestamptz,
  mediation_deadline_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT one_complaint_per_booking UNIQUE (booking_id)
);

ALTER TABLE public.booking_disputes ENABLE ROW LEVEL SECURITY;

-- Customers can view and create disputes for their own bookings
CREATE POLICY "booking_disputes_select_reporter" ON public.booking_disputes
  FOR SELECT USING (reporter_id = auth.uid());

CREATE POLICY "booking_disputes_insert_reporter" ON public.booking_disputes
  FOR INSERT WITH CHECK (
    reporter_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_disputes.booking_id
      AND b.user_id = auth.uid()
      AND b.status = 'completed'
    )
  );

-- Salon owners can view and respond to disputes for their bookings
CREATE POLICY "booking_disputes_select_salon" ON public.booking_disputes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.salons s ON s.id = b.salon_id
      WHERE b.id = booking_disputes.booking_id AND s.owner_id = auth.uid()
    )
  );

CREATE POLICY "booking_disputes_update_salon" ON public.booking_disputes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.salons s ON s.id = b.salon_id
      WHERE b.id = booking_disputes.booking_id AND s.owner_id = auth.uid()
    )
  );

-- Admins can do everything
CREATE POLICY "booking_disputes_admin_all" ON public.booking_disputes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_booking_disputes_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_disputes_updated_at
  BEFORE UPDATE ON public.booking_disputes
  FOR EACH ROW EXECUTE FUNCTION update_booking_disputes_updated_at();

-- Feature flag for kill switch
INSERT INTO public.feature_flags (key, enabled, description, updated_by)
VALUES ('dispute_reporting', true, 'Customer-initiated dispute reporting system', 'migration')
ON CONFLICT (key) DO NOTHING;
```

> ⚠️ **BE CAREFUL**: Do NOT modify `price_disputes` table. This is a NEW table with a NEW name. Keep them 100% separate. If you accidentally add columns to `price_disputes` instead, that will break the existing salon upcharge flow.

**Verification after Phase 0:**
```bash
# In Supabase SQL editor:
SELECT table_name FROM information_schema.tables WHERE table_name = 'booking_disputes';
-- Must return 1 row
SELECT column_name FROM information_schema.columns WHERE table_name = 'booking_disputes';
-- Must list: id, booking_id, reporter_id, reported_id, issue_type, description, status, salon_response, salon_responded_at, resolution, resolved_by, resolved_at, mediation_started_at, mediation_deadline_at, created_at, updated_at
```

---

## PHASE 1: ADD TYPES + VALIDATION SCHEMAS 🤖

**Commit message:** `phase 1: add BookingDispute type + validation schemas`

### 1.1 Add type to `lib/types.ts` [MODIFY]

Add after the `AdjustmentStatus` type:

```typescript
// ✅ DO — add after existing AdjustmentStatus type
export type DisputeIssueType = 'quality' | 'no_show_by_salon' | 'wrong_service' | 'overcharge' | 'other';
export type DisputeStatus = 'open' | 'in_review' | 'resolved' | 'escalated';

export interface BookingDispute {
  id: string;
  booking_id: string;
  reporter_id: string;
  reported_id: string;
  issue_type: DisputeIssueType;
  description: string;
  status: DisputeStatus;
  salon_response?: string | null;
  salon_responded_at?: string | null;
  resolution?: string | null;
  resolved_by?: string | null;
  resolved_at?: string | null;
  mediation_started_at?: string | null;
  mediation_deadline_at?: string | null;
  created_at: string;
  updated_at: string;
}

// ❌ DON'T — don't add to price_disputes area or reuse AdjustmentStatus
```

### 1.2 Add Zod schemas to `lib/validations.ts` [MODIFY]

```typescript
// ✅ DO — add these schemas
export const reportDisputeSchema = z.object({
  issue_type: z.enum(['quality', 'no_show_by_salon', 'wrong_service', 'overcharge', 'other']),
  description: z.string().min(20, 'Description must be at least 20 characters').max(1000),
});

export const salonDisputeResponseSchema = z.object({
  salon_response: z.string().min(10, 'Response must be at least 10 characters').max(1000),
});

export const adminDisputeBookingActionSchema = z.object({
  dispute_id: z.string().uuid(),
  action: z.enum(['dismiss', 'warn_customer', 'warn_salon', 'escalate', 'resolve_with_note', 'refund']),
  resolution_note: z.string().max(500).optional(),
  refund_amount: z.number().int().positive().optional(), // in cents (Stripe)
});

// ❌ DON'T — don't modify or rename existing adminDisputeActionSchema (that's for price_disputes)
```

**Build check:** `npm run build` + `npx tsc --noEmit` — must pass before commit.

> ⚠️ **BE CAREFUL**: `lib/validations.ts` already has `adminDisputeActionSchema` for `price_disputes`. The NEW one is `adminDisputeBookingActionSchema`. Different name, different table, different fields. Do NOT overwrite the old one.

---

## PHASE 2: CUSTOMER-FACING API 🤖

**Commit message:** `phase 2: POST/GET /api/bookings/[id]/report`

**File: `app/api/bookings/[id]/report/route.ts` [NEW]**

```typescript
// ✅ DO — full security stack, new file, separate from /dispute/ route
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { validateBody, reportDisputeSchema, salonDisputeResponseSchema } from "@/lib/validations";

// GET — customer views their dispute for a booking
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: bookingId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: dispute } = await supabase
    .from("booking_disputes")
    .select("*")
    .eq("booking_id", bookingId)
    .eq("reporter_id", user.id)
    .single();

  return NextResponse.json({ dispute: dispute ?? null });
}

// POST — customer files a complaint
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: bookingId } = await params;

  const disabled = await checkFeatureEnabled("dispute_reporting");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data: validated, error: validationError } = validateBody(reportDisputeSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });

  // Verify booking belongs to user and is completed
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, user_id, salon_id, status, salons(owner_id)")
    .eq("id", bookingId)
    .eq("user_id", user.id)
    .single();

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (booking.status !== "completed") {
    return NextResponse.json({ error: "Can only report a problem on completed bookings" }, { status: 400 });
  }

  const salonOwnerId = (booking.salons as unknown as { owner_id: string })?.owner_id;

  const { data: dispute, error } = await supabase
    .from("booking_disputes")
    .insert({
      booking_id: bookingId,
      reporter_id: user.id,
      reported_id: salonOwnerId,
      issue_type: validated.issue_type,
      description: validated.description,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "A dispute has already been filed for this booking" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ dispute }, { status: 201 });
}

// PATCH — salon owner adds their response
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: bookingId } = await params;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const body = await req.json();
  const { data: validated, error: validationError } = validateBody(salonDisputeResponseSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });

  // Verify user is salon owner for this booking
  const { data: dispute } = await supabase
    .from("booking_disputes")
    .select("id, status, bookings(salon_id, salons(owner_id))")
    .eq("booking_id", bookingId)
    .single();

  if (!dispute) return NextResponse.json({ error: "No dispute found for this booking" }, { status: 404 });

  const booking = (dispute as any).bookings;
  const salonOwnerId = booking?.salons?.owner_id;
  if (salonOwnerId !== user.id) {
    return NextResponse.json({ error: "Only the salon owner can respond to this dispute" }, { status: 403 });
  }

  if (dispute.status !== "open") {
    return NextResponse.json({ error: "Can only respond to open disputes" }, { status: 400 });
  }

  const { error } = await supabase
    .from("booking_disputes")
    .update({
      salon_response: validated.salon_response,
      salon_responded_at: new Date().toISOString(),
      status: "in_review",
    })
    .eq("id", dispute.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ message: "Response submitted. Admin will review both sides." });
}
```

> ⚠️ **BE CAREFUL**: This is a NEW file at `/api/bookings/[id]/report/route.ts`. Do NOT modify `/api/bookings/[id]/dispute/route.ts` — that's the price adjustment system, completely separate.

**Verification:**
```bash
npm run build && npx tsc --noEmit
# Check new file exists:
ls -la app/api/bookings/\[id\]/report/route.ts
```

---

## PHASE 3: ADMIN API 🤖

**Commit message:** `phase 3: admin booking-disputes API`

**Files:**
- `app/api/admin/booking-disputes/route.ts` [NEW] — list all booking disputes
- `app/api/admin/booking-disputes/[id]/action/route.ts` [NEW] — perform admin actions

### `app/api/admin/booking-disputes/route.ts`

```typescript
// ✅ DO — separate from /api/admin/disputes/ (that's price_disputes)
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminSupabaseClient();
  const { data: disputes, error } = await admin
    .from("booking_disputes")
    .select(`
      *,
      bookings(id, starts_at, price_paid, salon_id, salons(name, slug)),
      reporter:profiles!reporter_id(display_name),
      reported:profiles!reported_id(display_name)
    `)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ disputes: disputes ?? [] });
}
```

### `app/api/admin/booking-disputes/[id]/action/route.ts`

```typescript
// ✅ DO — admin actions: dismiss / warn_customer / warn_salon / escalate / resolve_with_note
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, adminLimiter } from "@/lib/ratelimit";
import { logAuditEvent } from "@/lib/audit";
import { validateBody, adminDisputeBookingActionSchema } from "@/lib/validations";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: disputeId } = await params;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rateLimited = await applyRateLimit(adminLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data: validated, error: validationError } = validateBody(adminDisputeBookingActionSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });

  const admin = createAdminSupabaseClient();

  // Fetch dispute first
  const { data: dispute } = await admin
    .from("booking_disputes")
    .select("id, reporter_id, reported_id, status")
    .eq("id", disputeId)
    .single();
  if (!dispute) return NextResponse.json({ error: "Dispute not found" }, { status: 404 });

  const { action, resolution_note } = validated;

  if (action === "dismiss" || action === "resolve_with_note") {
    await admin.from("booking_disputes").update({
      status: "resolved",
      resolution: resolution_note ?? "Resolved by admin",
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
    }).eq("id", disputeId);

  } else if (action === "escalate") {
    const mediationStart = new Date();
    const mediationDeadline = new Date(mediationStart.getTime() + 30 * 24 * 60 * 60 * 1000);
    await admin.from("booking_disputes").update({
      status: "escalated",
      mediation_started_at: mediationStart.toISOString(),
      mediation_deadline_at: mediationDeadline.toISOString(),
    }).eq("id", disputeId);

  } else if (action === "refund") {
    // Admin-issued refund — bypasses salon owner check (admin privilege)
    // Existing /api/bookings/[id]/refund is salon-owner only, so we call Stripe directly here
    const { data: dispute } = await admin
      .from("booking_disputes")
      .select("booking_id")
      .eq("id", disputeId)
      .single();
    if (!dispute) return NextResponse.json({ error: "Dispute not found" }, { status: 404 });

    const { data: booking } = await admin
      .from("bookings")
      .select("id, paid_amount, price_paid, payment_intent_id, refunded_amount")
      .eq("id", dispute.booking_id)
      .single();

    if (!booking?.payment_intent_id) {
      return NextResponse.json({ error: "No Stripe payment to refund" }, { status: 400 });
    }

    const paidAmount = booking.paid_amount ?? booking.price_paid ?? 0;
    const alreadyRefunded = booking.refunded_amount ?? 0;
    const refundAmount = validated.refund_amount ?? (paidAmount - alreadyRefunded); // default: full remaining

    if (refundAmount > paidAmount - alreadyRefunded) {
      return NextResponse.json({ error: "Refund exceeds maximum refundable amount" }, { status: 400 });
    }

    const Stripe = require("stripe");
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-12-18.acacia" });
    try {
      await stripe.refunds.create({
        payment_intent: booking.payment_intent_id,
        amount: refundAmount,
        reason: "requested_by_customer",
      });
    } catch (stripeErr: any) {
      return NextResponse.json({ error: `Stripe refund failed: ${stripeErr.message}` }, { status: 500 });
    }

    const newTotal = alreadyRefunded + refundAmount;
    await admin.from("bookings").update({
      refunded_amount: newTotal,
      payment_status: newTotal >= paidAmount ? "refunded" : "partially_refunded",
    }).eq("id", dispute.booking_id);

    await admin.from("booking_disputes").update({
      status: "resolved",
      resolution: resolution_note ?? "Refund issued by admin",
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
    }).eq("id", disputeId);

  } else if (action === "warn_customer" || action === "warn_salon") {
    const targetId = action === "warn_customer" ? dispute.reporter_id : dispute.reported_id;
    // Insert into warnings table (migration 063)
    await admin.from("warnings").insert({
      user_id: targetId,
      issued_by: user.id,
      reason: resolution_note ?? `Issued from dispute #${disputeId}`,
      dispute_id: disputeId,
    }).select();
  }

  await logAuditEvent({
    actor_id: user.id,
    action: `booking_dispute_${action}`,
    target_type: "booking_dispute",
    target_id: disputeId,
    metadata: { action, resolution_note },
  });

  return NextResponse.json({ message: `Action '${action}' applied to dispute ${disputeId}` });
}
```

> ⚠️ **BE CAREFUL**:
> - The `warnings` table (migration 063) may have different column names — read `063_warnings.sql` first before inserting. If it doesn't have `dispute_id`, omit that field.
> - Do NOT create a Stripe refund in this roadmap. Refunds require the Stripe payment_intent_id from the booking — that's a follow-on feature. For now, `resolve_with_note` + a manual Stripe dashboard action suffices.
> - Admin path `/api/admin/booking-disputes/` is different from `/api/admin/disputes/` (price disputes). Both must coexist.

**Middleware check:** Add `/api/admin/booking-disputes` to `adminOnlyPaths` in `middleware.ts` if that pattern is enforced there. Read `middleware.ts` first.

**Verification:**
```bash
npm run build && npx tsc --noEmit
ls -la app/api/admin/booking-disputes/route.ts
ls -la app/api/admin/booking-disputes/\[id\]/action/route.ts
```

---

## PHASE 4: CUSTOMER UI — "Report a Problem" 🤖

**Commit message:** `phase 4: ReportProblemButton + modal on completed bookings`

**Files:**
- `components/disputes/ReportProblemButton.tsx` [NEW]
- `components/disputes/ReportProblemModal.tsx` [NEW]

### `components/disputes/ReportProblemModal.tsx`

```typescript
// ✅ DO — modal with 5 issue type pills + description textarea
// Uses: Lucide AlertTriangle icon, s-coral design tokens, rounded-card, shadow-warm-md
// Issue types: quality / no_show_by_salon / wrong_service / overcharge / other

// ❌ DON'T — don't use raw Tailwind colors (bg-red-*, shadow-lg, rounded-xl)
// ❌ DON'T — don't add <Header> or <BottomNav> — they are in the layout already
```

Design spec:
- Modal overlay: `bg-s-ink/50 backdrop-blur-sm`
- Container: `bg-white dark:bg-s-dm-surface rounded-card shadow-warm-lg p-8 max-w-lg`
- Title: Syne font, "Ein Problem melden" (de) / "Report a Problem" (en)
- Issue type pills: 5 horizontal pills in a flex-wrap row, selected = `bg-s-coral text-white`, unselected = `bg-s-bg-surface text-s-ink border border-s-ink/10`
  - Labels (de): Qualität / Salon erschien nicht / Falsche Leistung / Zu viel berechnet / Sonstiges
- Description: textarea `min-h-[100px] bg-[#EDE5D8] dark:bg-s-dm-surface/50 rounded-button p-4`
- Submit: `<InteractiveHoverButton>` with text "Melden"
- On success: show green confirmation, close modal

### Integration point

Read the profile/bookings history page first. Find where `booking.status === 'completed'` renders. Add `<ReportProblemButton bookingId={booking.id} />` after the booking card actions.

**Availability window:** Show immediately when `booking.status === 'completed'` — no grace period. T&S §13 sets no time restriction.

```typescript
// ✅ DO — add to existing completed booking card
import { ReportProblemButton } from "@/components/disputes/ReportProblemButton";
// Inside the map/render of completed bookings:
{booking.status === 'completed' && (
  <ReportProblemButton bookingId={booking.id} />
)}

// ❌ DON'T — don't rebuild the entire profile page or booking card
// ❌ DON'T — don't show button on non-completed bookings
```

> ⚠️ **BE CAREFUL**:
> - Read the actual profile/bookings page FIRST before adding the import. Find the exact component name and where completed bookings render.
> - The button must only appear when `booking.status === 'completed'`. It must not appear for `confirmed`, `cancelled`, or `no_show`.
> - After successfully filing, the button should change to "Gemeldet ✓" and become disabled (refetch dispute state).

**Verification:**
```bash
npm run build && npx tsc --noEmit
# Verify both files exist and are imported:
grep -rn "ReportProblemButton" app/ components/ --include="*.tsx" | wc -l
# Must be > 1 (definition + at least 1 usage)
```

---

## PHASE 5: SALON DASHBOARD — DISPUTE ALERT + RESPONSE 🤖

**Commit message:** `phase 5: salon dispute notification + response form in dashboard`

**Files:**
- `components/dashboard/DisputeNotification.tsx` [NEW]

Design: coral-tinted alert card — `bg-s-coral-subtle border border-s-coral/20 rounded-card p-6`
- Icon: Lucide `AlertTriangle` in `text-s-coral`
- Title: "Ein Kunde hat ein Problem gemeldet" (de)
- Shows: issue type badge + truncated description (first 100 chars)
- "Antworten" button opens inline textarea for salon response
- Submit calls `PATCH /api/bookings/[id]/report` with `salon_response`

Integration: Read `app/[locale]/dashboard/bookings/page.tsx` first. For each completed booking card, fetch `/api/bookings/[id]/report` (GET) and if dispute exists with `status === 'open'`, show `<DisputeNotification>`.

```typescript
// ✅ DO — additive, on top of existing booking card
// ❌ DON'T — don't rebuild the dashboard booking card or DashboardLayout
```

> ⚠️ **BE CAREFUL**: Fetching dispute status for every booking in a list will cause N+1 queries. Batch the check: fetch all `booking_disputes` for `reported_id = salonOwnerId` and `status = 'open'` in one query, then match by `booking_id` on the frontend.

---

## PHASE 6: ADMIN PANEL — DISPUTE REVIEW UI 🤖

**Commit message:** `phase 6: admin BookingDisputePanel UI`

**File: `components/admin/BookingDisputePanel.tsx` [NEW]**

Design spec:
- Two-column layout on desktop, stacked on mobile
- Left column: Customer complaint (issue type badge + description in `bg-s-bg-base rounded-card p-6`)
- Right column: Salon response (if `salon_response` present) OR "Awaiting salon response" placeholder
- Bottom action bar: 4 buttons — Dismiss / Warn Customer / Warn Salon / Escalate to Mediation
  - Dismiss: ghost button `text-s-ink/60`
  - Warn Customer / Warn Salon: `border border-s-amber text-s-amber-text` outline button
  - Escalate: `bg-s-coral text-white rounded-button` (with 30-day tooltip note)
- Status badge: `open` = amber pill, `in_review` = blue pill, `resolved` = green pill, `escalated` = coral pill

Integration: Read the admin panel page structure. Add a "Beschwerden" (Disputes/Complaints) tab that fetches from `GET /api/admin/booking-disputes/`. Existing "Preisstreitigkeiten" (Price Disputes) tab remains untouched.

```typescript
// ✅ DO — add a NEW tab/section alongside existing admin price disputes
// ❌ DON'T — don't replace or merge into the existing disputes UI
// ❌ DON'T — don't render Header/BottomNav (Rule 27)
```

> ⚠️ **BE CAREFUL**: "Escalate to Mediation" sets `mediation_deadline_at = now + 30 days`. Show this deadline prominently in the UI and explain it means both parties have 30 days to resolve before courts. This is required by T&S §13.2.

---

## PHASE 7: EMAIL NOTIFICATIONS 🤖

**Commit message:** `phase 7: dispute email notifications via Resend`

**Modify:** `app/api/bookings/[id]/report/route.ts` — add email send after successful INSERT
**Modify:** `app/api/admin/booking-disputes/[id]/action/route.ts` — add email after escalate action

### Trigger 1: Customer files dispute → email to salon owner
After the successful INSERT in POST handler:
```typescript
// After dispute insert succeeds:
await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    from: 'support@solen.ch',
    to: salonOwnerEmail,
    subject: 'Ein Kunde hat ein Problem mit einer Buchung gemeldet',
    html: `<p>Ein Kunde hat ein Problem mit Buchung #${bookingId} gemeldet.</p>
           <p><strong>Typ:</strong> ${validated.issue_type}</p>
           <p>Bitte loggen Sie sich in Ihr Dashboard ein, um zu antworten.</p>`,
  }),
});
```

### Trigger 2: Admin escalates → email to both parties
After escalate action in admin route:
- Email to reporter (customer): mediation started, deadline, contact support@solen.ch
- Email to reported (salon): mediation started, deadline, respond via platform or email

Template (plain HTML, bilingual DE/EN):
```
Betreff: Mediation für Buchungsbeschwerde gestartet (30-Tage-Frist)
Subject: Mediation Started for Booking Dispute (30-Day Window)

Your dispute has entered the 30-day mediation period (T&S §13.2).
If unresolved by [mediation_deadline_at], either party may proceed to court in Basel-Stadt.
Contact: support@solen.ch
```

> ⚠️ **BE CAREFUL**:
> - Fetch the salon owner's email via admin client (never expose emails client-side)
> - Email sends are fire-and-forget — wrap in try/catch so a Resend failure doesn't fail the dispute creation
> - Do NOT add a cron job for the 25-day reminder in this phase — note it in `INCOMPLETE_FEATURES.md` for Phase 8

---

## PHASE 8: DOCS UPDATE 🤖

**Commit message:** `phase 8: update CLAUDE.md + INCOMPLETE_FEATURES`

### 8.1 CLAUDE.md §6 — Add `booking_disputes` row [MODIFY]

Add this row to the schema table in CLAUDE.md §6:

```
| `booking_disputes` | `id`, `booking_id`, `reporter_id`, `reported_id`, `issue_type` (quality/no_show_by_salon/wrong_service/overcharge/other), `description`, `status` (open/in_review/resolved/escalated), `salon_response`, `salon_responded_at`, `resolution`, `resolved_by`, `resolved_at`, `mediation_started_at`, `mediation_deadline_at` | Customer-initiated complaints (T&S §13). SEPARATE from `price_disputes` (which is salon-initiated upcharges). RLS: customer SELECT/INSERT own, salon SELECT/UPDATE, admin ALL. |
```

### 8.2 INCOMPLETE_FEATURES.md — Note the 25-day cron reminder [MODIFY]

```markdown
## Dispute Mediation Reminder Cron (2026-03-23)
- **Feature:** Cron job that sends reminder email 25 days after `mediation_started_at`
- **File/Line:** `app/api/cron/dispute-mediation-reminder/route.ts` — not yet created
- **Blocker:** Phase 7 added email for day-0 escalation. The day-25 reminder cron is deferred.
- **Next Steps:** Create cron route that queries `booking_disputes` where `status = 'escalated'` AND `mediation_started_at < now() - 25 days` AND reminder not yet sent. Send email to both parties. Add `mediation_reminder_sent` boolean column (migration 076).
```

> ⚠️ **BE CAREFUL**: NEVER delete or overwrite `_tasks/INCOMPLETE_FEATURES.md`. APPEND ONLY.

---

## R6: DEPENDENCY ORDERING TABLE

| Step | Type | What | Depends On |
|---|---|---|---|
| 🧑 Manual A | MANUAL | Run migration 075 in Supabase | Nothing |
| Phase 1 | 🤖 CODE | Types + validation schemas | Manual A |
| Phase 2 | 🤖 CODE | Customer + salon API routes | Phase 1 |
| Phase 3 | 🤖 CODE | Admin API routes | Phase 1 |
| Phase 4 | 🤖 CODE | Customer UI (button + modal) | Phase 2 |
| Phase 5 | 🤖 CODE | Salon dashboard UI | Phase 2 |
| Phase 6 | 🤖 CODE | Admin panel UI | Phase 3 |
| Phase 7 | 🤖 CODE | Email notifications | Phase 2 + 3 |
| Phase 8 | 🤖 CODE | Docs update | All phases |

---

## R29: POST-EXECUTION SMOKE TEST

After all phases complete:
1. ✅ `npm run build` — 0 errors
2. ✅ `npx tsc --noEmit` — 0 type errors
3. ✅ No dead components: `grep -rn "ReportProblemButton\|DisputeNotification\|BookingDisputePanel" app/ components/ --include="*.tsx" | wc -l` → must be ≥ 2 per component
4. ✅ No missing types: `npx tsc --noEmit 2>&1 | grep "has no exported member"` → 0 results
5. ✅ No duplicate layout: `grep -rn "import.*Header\|import.*BottomNav" components/disputes/ components/admin/BookingDispute --include="*.tsx"` → 0 results
6. ✅ Feature flag exists: `SELECT enabled FROM feature_flags WHERE key = 'dispute_reporting'` → returns `true`
7. ✅ Middleware: verify `/api/admin/booking-disputes` is protected (admin-only)
8. ✅ Translations: if `t()` used, verify keys exist in `messages/de.json`, `messages/en.json`, `messages/fr.json`, `messages/it.json`
9. ✅ API smoke test: `POST /api/bookings/{completed-booking-id}/report` with valid body → 201
10. ✅ Vercel deploy green after final push

---

## T&S COMPLIANCE CHECKLIST

| T&S Clause | Requirement | Implemented By |
|---|---|---|
| §13.1 | Channel for reporting issues via platform | Phase 4 (Report button) + Phase 2 (API) |
| §13.1 | support@solen.ch email channel | Email notifications Phase 7 |
| §13.2 | 30-day mediation window before court | Phase 3 `escalate` action + `mediation_deadline_at` |
| §13.2 | Both parties must attempt mediation | Phase 7 escalation email to both parties |
| §6.6 | Tiered warnings for repeated complaints | Phase 3 `warn_salon` action → warnings table |
| §7.2 | Salon Partners may flag reviews | Existing (review moderation, unchanged) |
