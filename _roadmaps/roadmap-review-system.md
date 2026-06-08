# Review System — Roadmap

> **Purpose**: Fix 2 critical bugs and close 2 missing features to make the Review System fully functional and T&S-compliant.
>
> **Generated**: 2026-03-23 | **Topic**: REVIEW SYSTEM
> **Audit Source**: `_tasks/roadmap-full-platform-audit.md` — Topic 7

---

## R1: BREAKAGE RISK ASSESSMENT

| Phase | Risk | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🟡 MEDIUM | Salon page review render section | Read file fully before editing; match exact surrounding code |
| Phase 2 | 🟢 SAFE | Nothing (addition only) | New SQL after insert; error is caught, returns 200 regardless |
| Phase 3 | 🟢 SAFE | Nothing (new files + 1 button) | New component + new route + small salon page addition |
| Phase 4 | 🟢 SAFE | Nothing (new files + 1 button) | New route + small dashboard page addition |

---

## Phase A: AUDIT CHECKLIST

| Item | Status | File |
|---|---|---|
| `reviews` table (7 migrations) | ✅ EXISTS | `supabase/migrations/001–051_review*.sql` |
| `review_replies` table | ✅ EXISTS | migration 041 |
| `review_photos` table | ✅ EXISTS | migration 051 |
| `POST /api/reviews` | ✅ EXISTS | `app/api/reviews/route.ts` |
| `GET /api/reviews/featured` | ✅ EXISTS | `app/api/reviews/featured/route.ts` |
| `GET /api/reviews/salon/[salon_id]` | ✅ EXISTS | `app/api/reviews/salon/[salon_id]/route.ts` |
| `POST /api/reviews/reply` | ✅ EXISTS | `app/api/reviews/reply/route.ts` |
| `PATCH /api/reviews/[id]/respond` | ✅ EXISTS | `app/api/reviews/[id]/respond/route.ts` |
| `GET/PATCH/DELETE /api/admin/reviews/[id]` | ✅ EXISTS | `app/api/admin/reviews/[id]/route.ts` |
| `GET /api/cron/review-prompt` | ✅ EXISTS | `app/api/cron/review-prompt/route.ts` |
| `ReviewCarousel` (homepage) | ✅ EXISTS | `components/ReviewCarousel.tsx` |
| `ReviewBreakdown` (salon page) | ✅ EXISTS | `components/ReviewBreakdown.tsx` |
| Salon owner dashboard `/dashboard/reviews` | ✅ EXISTS | `app/[locale]/dashboard/reviews/page.tsx` |
| Admin moderation `/dashboard/review-moderation` | ✅ EXISTS | `app/[locale]/dashboard/review-moderation/page.tsx` |
| **`ReviewForm` component** | ❌ MISSING | — |
| **`GET /api/reviews/eligibility`** | ❌ MISSING | — |
| **`POST /api/reviews/[id]/flag`** | ❌ MISSING | — |
| **Average rating update after insert** | ❌ MISSING | not in `app/api/reviews/route.ts` |
| **Salon response visible on public page** | ❌ BUG | page shows `review_replies` only, ignores `salon_response` |

---

## Phase B: GAP ANALYSIS

### 🔴 Bug 1 — Salon Responses Invisible
- `/dashboard/reviews/page.tsx` calls `PATCH /api/reviews/[id]/respond` → writes `reviews.salon_response`
- Salon page at L847 only renders `rev.review_replies[0].reply_text`
- Result: **every salon owner reply is silently hidden from customers**

### 🔴 Bug 2 — Average Rating Never Updates
- `POST /api/reviews` inserts review but does NOT update `salons.average_rating` or `salons.review_count`
- Rating shown on salon cards/pages stays stale forever

### 🔴 Gap 3 — No Customer Review Submission Form
- Cron sends email with "Jetzt bewerten" linking to `solen.ch/de/salon/[slug]#bewertungen`
- Salon page has NO "Bewertung schreiben" button, NO form
- **The entire review collection loop is broken**

### 🟡 Gap 4 — No Salon Owner "Flag Review" Button (T&S §7.2)
- T&S §7.2: *"Salonpartner können Bewertungen zur Moderation melden"*
- `/dashboard/reviews/page.tsx` only shows "Antwort schreiben" — no "Melden" option

---

## 🤖 CLAUDE CODE PHASES

---

### Phase 1 — Fix Salon Response Display [MODIFY 1 file]

**File**: `app/[locale]/salon/[slug]/page.tsx` [MODIFY]

**Problem**: Line ~847 only renders `rev.review_replies`. The `reviews.salon_response` field (written by dashboard) is never displayed.

**Fix**: Normalise both mechanisms — show `review_replies[0]` if present, else fall back to `rev.salon_response`.

```typescript
// ✅ DO — check both reply mechanisms
{(() => {
  const reply = rev.review_replies && rev.review_replies.length > 0 && rev.review_replies[0].is_public
    ? rev.review_replies[0].reply_text
    : (rev as any).salon_response ?? null;
  if (!reply) return null;
  return (
    <div className="mt-3 pl-4 border-l-2 border-s-coral/30">
      <p className="text-xs text-s-coral font-medium flex items-center gap-1 mb-1">
        <ShieldCheck className="w-3 h-3" />Salon hat geantwortet
      </p>
      <p className="text-xs text-s-ink/60 dark:text-s-dm-text/60">{reply}</p>
    </div>
  );
})()}
```

```typescript
// ❌ DON'T — only show review_replies (misses dashboard responses)
{rev.review_replies && rev.review_replies.length > 0 && rev.review_replies[0].is_public && (
  ...
)}
```

> ⚠️ **BE CAREFUL**:
> - The existing block is at L847 — replace the entire conditional, do not add a second block
> - Do not change anything else in the reviews render loop
> - Verify `salon_response` is in the salon data shape (it comes from `SELECT *` on reviews, so it's present)

**Verification**: `git commit -m "phase 1: fix salon response display — show salon_response on public salon page"`

---

### Phase 2 — Fix Average Rating Update After Review [MODIFY 1 file]

**File**: `app/api/reviews/route.ts` [MODIFY]

**Problem**: After inserting a review, `salons.average_rating` and `salons.review_count` are never recalculated.

**Fix**: After successful insert, run an aggregate query and update the salon.

```typescript
// ✅ DO — recalculate after insert
if (data) {
  const admin = createAdminSupabaseClient();
  const { data: stats } = await admin
    .from("reviews")
    .select("rating")
    .eq("salon_id", booking.salon_id)
    .eq("is_hidden", false);

  if (stats && stats.length > 0) {
    const avg = stats.reduce((sum, r) => sum + r.rating, 0) / stats.length;
    await admin
      .from("salons")
      .update({
        average_rating: Math.round(avg * 10) / 10,
        review_count: stats.length,
      })
      .eq("id", booking.salon_id);
  }
}
```

```typescript
// ❌ DON'T — leave salons.average_rating stale (never updates)
return NextResponse.json({ data }, { status: 201 });
// (no recalculation)
```

> ⚠️ **BE CAREFUL**:
> - Import `createAdminSupabaseClient` — already imported in the file
> - Place BEFORE the final `return NextResponse.json` statement
> - Rating recalculation error should NOT block the 201 response — wrap in try/catch
> - Only count reviews where `is_hidden = false`

**Verification**: `git commit -m "phase 2: recalculate salon average_rating and review_count after review insert"`

---

### Phase 3 — Customer Review Submission [NEW 2 files, MODIFY 1 file]

#### 3a. New eligibility endpoint

**File**: `app/api/reviews/eligibility/route.ts` [NEW]

Full security stack. Returns `{ eligible: boolean, booking_id: string | null }`.

Logic:
1. Auth required
2. Get `salon_id` from query param
3. Find any `completed` booking by this user at this salon that has no existing review
4. If found → `{ eligible: true, booking_id: "..." }`
5. If not → `{ eligible: false, booking_id: null }`

```typescript
// ✅ DO
const { data: booking } = await supabase
  .from("bookings")
  .select("id")
  .eq("user_id", user.id)
  .eq("salon_id", salon_id)
  .eq("status", "completed")
  .not("id", "in", `(SELECT booking_id FROM reviews WHERE booking_id IS NOT NULL)`)
  .limit(1)
  .maybeSingle();
```

```typescript
// ❌ DON'T — call getUser() (times out on Vercel Edge per Rule 25)
const { data: { user } } = await supabase.auth.getUser();
```

> ⚠️ **BE CAREFUL**:
> - Use `getSession()` not `getUser()` (Rule 25)
> - `runtime = "edge"` — no Node.js APIs
> - Gracefully return `{ eligible: false }` if user is not logged in (no 401 — just not eligible)

#### 3b. ReviewForm component

**File**: `components/ReviewForm.tsx` [NEW]

Props:
```typescript
interface ReviewFormProps {
  salonId: string;
  bookingId: string;
  staffMembers?: { id: string; name: string }[];
  onSuccess: () => void;
  onClose: () => void;
}
```

UI elements (all using design tokens):
- Backdrop overlay: `fixed inset-0 z-50 bg-s-ink/40 backdrop-blur-sm`
- Modal: `bg-white dark:bg-s-dm-surface rounded-card shadow-warm-lg max-w-md w-full p-6`
- Star row: 5 clickable `Star` lucide icons, filled `fill-s-amber text-s-amber` when selected
- Comment `<textarea>` — `rounded-button border border-s-ink/10`, max 500 chars, char counter
- Optional: staff member `<select>` if `staffMembers.length > 0`
- Submit button: coral, disabled when `rating === 0`
- Calls `POST /api/reviews` with `{ booking_id, rating, comment, staff_member_id? }`

```typescript
// ✅ DO — use design tokens
<div className="fixed inset-0 z-50 flex items-center justify-center bg-s-ink/40 backdrop-blur-sm px-4">
  <div className="bg-white dark:bg-s-dm-surface rounded-card shadow-warm-lg w-full max-w-md p-6">
```

```typescript
// ❌ DON'T — use generic shadows or radii
<div className="shadow-xl rounded-2xl">
```

> ⚠️ **BE CAREFUL**:
> - `"use client"` directive required
> - Do NOT import Header or any layout components
> - Star rating is 1–5; default is 0 (none selected) — submit disabled until a star is clicked
> - On success: call `onSuccess()` then `onClose()`
> - No photo upload in v1 — keep it simple

#### 3c. Salon page integration

**File**: `app/[locale]/salon/[slug]/page.tsx` [MODIFY]

Add near the top of existing state declarations:
```typescript
const [eligibility, setEligibility] = useState<{ eligible: boolean; booking_id: string | null }>({ eligible: false, booking_id: null });
const [showReviewForm, setShowReviewForm] = useState(false);
```

Add eligibility fetch in useEffect (after salon loads):
```typescript
if (salon?.id) {
  fetch(`/api/reviews/eligibility?salon_id=${salon.id}`)
    .then(r => r.json())
    .then(d => setEligibility(d))
    .catch(() => {});
}
```

Add in review section (after the `<ReviewBreakdown>` or near the section header):
```typescript
{eligibility.eligible && eligibility.booking_id && (
  <button
    onClick={() => setShowReviewForm(true)}
    className="mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-button bg-s-coral text-white text-sm font-medium hover:bg-s-coral-hover transition-colors"
  >
    <Star size={14} />
    Bewertung schreiben
  </button>
)}
{showReviewForm && eligibility.booking_id && (
  <ReviewForm
    salonId={salon.id}
    bookingId={eligibility.booking_id}
    staffMembers={salon.staff_members ?? []}
    onSuccess={() => { setEligibility({ eligible: false, booking_id: null }); window.location.reload(); }}
    onClose={() => setShowReviewForm(false)}
  />
)}
```

> ⚠️ **BE CAREFUL**:
> - Import `ReviewForm` from `@/components/ReviewForm` — verify file exists before importing
> - Import `Star` from `lucide-react` — already imported on this page
> - Eligibility fetch runs client-side only; server doesn't need to know
> - Do NOT add Header, BottomNav, or any layout component (Rule 27)

**Verification**: `git commit -m "phase 3: add ReviewForm + eligibility endpoint + review submission button on salon page"`

---

### Phase 4 — Salon Owner Flag Button (T&S §7.2) [NEW 1 file, MODIFY 2 files]

#### 4a. Add `flagReviewSchema` to validations

**File**: `lib/validations.ts` [MODIFY]

```typescript
// ✅ ADD (near other review schemas)
export const flagReviewSchema = z.object({
  flag_reason: z.string().min(5, "Mindestens 5 Zeichen").max(200, "Maximal 200 Zeichen"),
});
```

#### 4b. New flag endpoint

**File**: `app/api/reviews/[id]/flag/route.ts` [NEW]

```typescript
// ✅ DO — salon owner only, sets is_flagged + flag_reason
// POST /api/reviews/[id]/flag
// Auth + ban check + rate limit + verify caller owns the salon the review belongs to
// Updates: is_flagged = true, flag_reason = body.flag_reason
```

Security: same pattern as `app/api/reviews/reply/route.ts` (verify salon ownership before acting).

```typescript
// ❌ DON'T — allow any authenticated user to flag
if (!user) return 401; // ← this alone is not enough
// Must also verify user owns the salon the review is for
```

#### 4c. "Melden" button in salon owner dashboard

**File**: `app/[locale]/dashboard/reviews/page.tsx` [MODIFY]

Add to the `Review` interface:
```typescript
is_flagged: boolean;
```

Add state:
```typescript
const [flagging, setFlagging] = useState<string | null>(null);
const [flagReason, setFlagReason] = useState("");
```

Add below the "Antwort schreiben" button (only when review is not already flagged):
```typescript
{!r.is_flagged && (
  flagging === r.id ? (
    <div className="mt-2 flex gap-2 items-center">
      <input
        type="text"
        placeholder="Grund melden (min. 5 Zeichen)..."
        maxLength={200}
        value={flagReason}
        onChange={(e) => setFlagReason(e.target.value)}
        className="flex-1 px-3 py-1.5 rounded-button border border-s-ink/10 dark:border-white/10 text-xs bg-white dark:bg-s-dm-surface text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral"
      />
      <button onClick={() => handleFlag(r.id)} disabled={flagReason.trim().length < 5}
        className="px-3 py-1.5 rounded-button bg-s-coral text-white text-xs font-medium disabled:opacity-50">
        Senden
      </button>
      <button onClick={() => { setFlagging(null); setFlagReason(""); }}
        className="px-3 py-1.5 rounded-button border border-s-ink/10 text-xs text-s-ink/50">
        Abbrechen
      </button>
    </div>
  ) : (
    <button onClick={() => setFlagging(r.id)}
      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-button border border-s-ink/10 dark:border-white/10 text-s-ink/50 dark:text-s-dm-text/50 text-xs font-medium hover:border-s-coral hover:text-s-coral transition-colors mt-2">
      <Flag size={12} />
      Melden
    </button>
  )
)}
{r.is_flagged && (
  <span className="text-[10px] text-s-coral font-medium mt-2 inline-block">✓ Gemeldet — wird geprüft</span>
)}
```

Add `handleFlag` function:
```typescript
const handleFlag = async (reviewId: string) => {
  if (flagReason.trim().length < 5) return;
  await fetch(`/api/reviews/${reviewId}/flag`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ flag_reason: flagReason }),
  });
  setFlagging(null);
  setFlagReason("");
  fetchReviews();
};
```

Import `Flag` from `lucide-react`.

> ⚠️ **BE CAREFUL**:
> - Import `Flag` from `lucide-react` — add to existing import line
> - The existing `Review` interface is local to the file — add `is_flagged: boolean` to it
> - Don't modify DashboardLayout or any other component

**Verification**: `git commit -m "phase 4: add salon owner flag button + POST /api/reviews/[id]/flag (T&S §7.2)"`

---

## 🧑 MANUAL PHASES

None. All changes are pure code.

---

## R6: DEPENDENCY ORDERING TABLE

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Fix salon response display | Nothing |
| Phase 2 | 🤖 | Fix avg rating update | Nothing |
| Phase 3a | 🤖 | `GET /api/reviews/eligibility` | Nothing |
| Phase 3b | 🤖 | `ReviewForm` component | Nothing |
| Phase 3c | 🤖 | Salon page button | Phase 3a + 3b must be done first |
| Phase 4a | 🤖 | `flagReviewSchema` in validations.ts | Nothing |
| Phase 4b | 🤖 | `POST /api/reviews/[id]/flag` route | Phase 4a |
| Phase 4c | 🤖 | Salon dashboard "Melden" button | Phase 4b |
| Final | 🤖 | `npm run build` + `git push` | All above |

---

## R7: FINAL VERIFICATION

```bash
# 1. Build must pass
npm run build

# 2. No TypeScript errors
npx tsc --noEmit

# 3. No banned tokens introduced
grep -Ern "shadow-sm[^a]|shadow-md|rounded-lg|rounded-full|bg-gray-|text-gray-" components/ReviewForm.tsx app/[locale]/dashboard/reviews/page.tsx | head -5

# 4. Verify dead code check
grep -rn "ReviewForm" app/ components/ --include="*.tsx" | wc -l
# Must be > 1 (defined + imported on salon page)

# 5. Push and check Vercel
git push origin main
# Wait 60s → check https://vercel.com/sulo232s-projects/solen/deployments
curl -s -o /dev/null -w "%{http_code}" https://www.solen.ch/de/
# Must return 200 or 307
```

---

## R8: CLAUDE.md UPDATES (Final Phase)

No new tables, utility files, or environment variables are introduced. No CLAUDE.md updates required.
