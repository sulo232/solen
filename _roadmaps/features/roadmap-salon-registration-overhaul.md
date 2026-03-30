# Roadmap: Salon Registration Sub-Site — Complete Overhaul

> **Created**: 2026-03-24
> **Topic**: Full bug-fix + design overhaul for `/onboarding/salon` wizard + `/auth/register` salon path
> **Protocol**: R1–R10 compliant (per `_rules/ROADMAP_RULES.md`)
> **Zone**: Zone 3 (Clean Functional) — per `UI_RULES.md` §Zone 3: signup/onboarding pages = NO blobs, NO grain, NO glass (except nav), NO Bebas Neue (except logo), ZERO idle animation.

> **⚠️ CONFLICT NOTE**: `_tasks/roadmap-progressive-onboarding.md` Phase 1 proposes tearing down the 7-step wizard into a 3-step flow. This roadmap keeps the 7-step wizard but fixes and beautifies it. **Decide which approach to follow before executing.** Both cannot run simultaneously on the same file.

---

## ⚠️ BREAKAGE RISK TABLE (R1)

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| 1.1 ImageUploader error handling | 🟢 SAFE | Nothing | Only adds error display + auth check — existing upload logic untouched |
| 1.2 Submit error handling | 🟢 SAFE | Nothing | Only replaces `catch { /* ignore */ }` with error toast — same API call |
| 1.3 Gallery empty-slot fix | 🟡 MEDIUM | Gallery state shape | `gallery_urls` array format changes from `["", ""]` to `["url1"]` — test that Step 7 review still reads `gallery_urls` correctly |
| 2.1 Auth guard on onboarding page | 🔴 HIGH | **Entire onboarding flow** | Users currently reach `/onboarding/salon` from register page without an account. Adding a guard WILL block unregistered users. Must ensure register → create account → redirect → onboarding flow is seamless. Test in incognito. |
| 2.2 Draft persistence API | 🟢 SAFE | Nothing | New route + new table — no existing code touched |
| 3.1–3.4 Design overhaul (layout) | 🟡 MEDIUM | Visual regression | StepContainer class changes affect all 7 steps. Test every step on mobile (375px) + desktop (1280px). Verify dark mode. |
| 4.1–4.5 Component redesign | 🟡 MEDIUM | Form behavior | Opening hours, service form, staff form rebuilt — existing state shape (`ProfileData`, `ServiceDraft`, `StaffDraft`) must NOT change. Only JSX/class changes. |
| 5.1–5.3 Review + completion redesign | 🟢 SAFE | Nothing | Step 7 is read-only preview + celebration overlay — visual changes only |
| 6.1–6.3 Polish + accessibility | 🟢 SAFE | Nothing | CSS animations + ARIA labels — no logic changes |
| 7 CLAUDE.md update | 🟢 SAFE | Nothing | Documentation only |

---

## R10 PRE-SCAN RESULTS

### Files that will be modified
| File | Lines | What changes |
|---|---|---|
| `app/[locale]/onboarding/salon/page.tsx` | 1513 | All 7 step components + main wizard + StepContainer |
| `components/ui/ImageUploader.tsx` | 178 | Error handling + auth check + visual upgrade |
| `app/[locale]/auth/register/page.tsx` | 639 | Salon path: ensure account creation before redirect |
| `lib/registration-validation.ts` | 66 | Step 2 validation: make `cover_photo_url` optional during early steps |

### Files that will be created
| File | Purpose |
|---|---|
| `app/api/salon-draft/route.ts` | GET/PUT — save/restore wizard draft for authenticated users |
| `supabase/migrations/079_salon_drafts.sql` | `salon_drafts` table for DB-backed wizard persistence |

### Existing patterns verified
- `POST /api/salons` (line 163): requires `session?.user` — **confirms auth is mandatory**
- `ImageUploader` uploads to `salon-photos` bucket via `createBrowserSupabaseClient()` — **requires authenticated Supabase client for RLS**
- `handleSubmit` (line 1361–1385): `catch { /* ignore */ }` — **confirmed silent error swallowing**
- Step 2 `canProceed` (line 1354): `return !!profile.cover_photo_url` — **blocks entire wizard if upload fails**
- Phone OTP: calls `/api/auth/verify-phone/send` + `/check` — **working, don't touch**
- Service templates: `lib/service-templates.ts` — **working, don't touch**
- Auto-translate: calls `/api/translate` — **working, don't touch**

### No INCOMPLETE_FEATURES.md exists — nothing to cross-reference.

---

## 🤖 CLAUDE CODE PHASES

---

### Phase 1: Fix Critical Bugs (P0)

**Goal**: Fix image upload failures, silent submit errors, and gallery state bug. Zero visual changes — pure logic fixes.

---

**1.1 — Fix ImageUploader auth + error feedback** `[MODIFY] components/ui/ImageUploader.tsx`

READ THIS FILE FULLY FIRST (178 lines). The component uploads to Supabase Storage via `createBrowserSupabaseClient()`. If the user has no active Supabase session, the upload silently fails (RLS blocks it) and the error message says "Upload fehlgeschlagen" but doesn't explain WHY.

**Changes:**
1. Before uploading, check `supabase.auth.getSession()`. If no session, show: "Bitte melde dich zuerst an, um Bilder hochzuladen."
2. On `uploadError`, display the actual Supabase error message (not just generic text).
3. Add a "Nochmal versuchen" retry button on error state.

```typescript
// ✅ DO — check auth before upload attempt
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  setError("Bitte melde dich zuerst an, um Bilder hochzuladen.");
  return;
}
```

```typescript
// ❌ DON'T — upload without auth check (current behavior)
const { error: uploadError } = await supabase.storage
  .from(bucket)
  .upload(filePath, file, { cacheControl: "3600", upsert: false });
// If RLS blocks this, uploadError.message is cryptic
```

> ⚠️ **BE CAREFUL**:
> - Do NOT change the `handleFile`, `handleDrop`, or `handleChange` function signatures — other components depend on these.
> - Do NOT change the `bucket` prop behavior — `salon-photos` must still be passed from the parent.
> - The retry button should re-trigger `handleFile(lastFile)` — store the last attempted file in a ref.
> - VERIFY: After this change, navigate to `/onboarding/salon` Step 2 in incognito → upload should show the auth error, not silently fail.

Verification:
```bash
npm run build
git commit -m "phase 1.1: fix ImageUploader auth check + error feedback"
```

---

**1.2 — Fix silent submit error** `[MODIFY] app/[locale]/onboarding/salon/page.tsx`

READ the `handleSubmit` function (lines 1361–1385). Currently:
```typescript
// ❌ CURRENT — errors swallowed silently
} catch { /* ignore */ } finally {
  setSubmitting(false);
}
```

**Changes:**
1. Replace `catch { /* ignore */ }` with proper error handling.
2. Add a `submitError` state variable.
3. Display error banner above the submit button on Step 7.
4. Check `res.ok` before calling `setDone(true)`.

```typescript
// ✅ DO — handle errors visibly
const [submitError, setSubmitError] = useState<string | null>(null);

const handleSubmit = async () => {
  setSubmitting(true);
  setSubmitError(null);
  try {
    const res = await fetch("/api/salons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ /* existing payload */ }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setSubmitError(data.message || `Fehler beim Erstellen (${res.status})`);
      return;
    }
    sessionStorage.removeItem("solen_wizard");
    setDone(true);
    setTimeout(() => router.push(`/${locale}/dashboard?onboarded=1`), 2200);
  } catch (err) {
    setSubmitError("Netzwerkfehler — bitte prüfe deine Verbindung und versuche es erneut.");
  } finally {
    setSubmitting(false);
  }
};
```

```typescript
// ❌ DON'T — swallow errors
} catch { /* ignore */ }
```

Display error in Step 7 review, above the submit CTA:
```tsx
{submitError && (
  <div className="bg-s-error-bg border border-s-error/20 rounded-card p-4 mb-4 text-sm text-s-error">
    {submitError}
  </div>
)}
```

> ⚠️ **BE CAREFUL**:
> - Do NOT change the request payload shape — `POST /api/salons` expects the exact fields currently sent.
> - Do NOT change `setDone(true)` behavior — only call it after confirmed `res.ok`.
> - The error banner must use `bg-s-error-bg` + `text-s-error` (not `bg-red-100` — banned token per Rule 20).
> - VERIFY: Disconnect network → try submit → error message must appear. Reconnect → retry → must succeed.

Verification:
```bash
npm run build
git commit -m "phase 1.2: fix silent submit error — show error banner on failure"
```

---

**1.3 — Fix gallery empty-slot bug** `[MODIFY] app/[locale]/onboarding/salon/page.tsx`

READ the Step2 component (lines 300–494). The `addGallery` function (line 333) pushes `""` into `gallery_urls`:
```typescript
// ❌ CURRENT — pushes empty string, confusing state
const addGallery = () => {
  if (data.gallery_urls.length >= 5) return;
  onChange({ ...data, gallery_urls: [...data.gallery_urls, ""] });
};
```

**Problem**: When `gallery_urls` contains `""`, it renders an `ImageUploader` in its slot. But if upload succeeds, it replaces `""` at index `i` — this is correct. However, the empty string is counted in `.length`, so the "5 max" limit counts empty slots. And `gallery_urls.filter(Boolean)` is called at submit time (line 209 in `route.ts`), losing the ordering.

**Fix**: Keep the current approach but add visual clarity. The empty string approach works — the real bug is that the "+" button should not appear if 5 slots exist (including empty ones). Add a counter showing "3/5 hochgeladen":

```typescript
// ✅ DO — show clear count
<p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 mt-1">
  {data.gallery_urls.filter(Boolean).length}/5 Bilder hochgeladen
</p>
```

> ⚠️ **BE CAREFUL**:
> - Do NOT change the `gallery_urls` array shape — keeping `""` entries is fine, `route.ts` line 209 already filters them out with `.filter(Boolean)`.
> - Do NOT change the 5-image limit.
> - VERIFY: Add 3 gallery slots → upload 2 images → counter shows "2/5". Remove 1 → shows "1/5".

Verification:
```bash
npm run build
git commit -m "phase 1.3: fix gallery count display + clarify empty slots"
```

---

### Phase 2: Auth Flow + Draft Persistence

**Goal**: Ensure users have an authenticated session before reaching the onboarding wizard. Add DB-backed draft saving so progress survives browser close.

---

**2.1 — Auth guard on onboarding page** `[MODIFY] app/[locale]/onboarding/salon/page.tsx`

READ the existing `useEffect` for email pre-fill (lines 1338–1347). It checks `session` but does NOT redirect if missing.

**Changes:**
1. On mount, check for active Supabase session.
2. If no session → redirect to `/${locale}/auth/register?intent=salon`.
3. Show a loading skeleton while checking.

```typescript
// ✅ DO — guard with redirect
const [authChecked, setAuthChecked] = useState(false);

useEffect(() => {
  const sb = createBrowserSupabaseClient();
  sb.auth.getSession().then(({ data: { session } }) => {
    if (!session) {
      router.replace(`/${locale}/auth/register?intent=salon`);
      return;
    }
    if (session.user?.email && !basics.email) {
      setBasics((prev) => ({ ...prev, email: session.user!.email! }));
    }
    setAuthChecked(true);
  });
}, []);

if (!authChecked) return <div className="min-h-screen bg-s-bg-base dark:bg-s-dm-bg flex items-center justify-center"><Spinner /></div>;
```

```typescript
// ❌ DON'T — let unauthenticated users access the wizard
// (current behavior: no guard, uploads fail silently)
```

**2.1b — Update register page intent handling** `[MODIFY] app/[locale]/auth/register/page.tsx`

READ the `handleSalonChoice` function (line 546–548). Currently it just redirects immediately without account creation:
```typescript
// ❌ CURRENT — skips account creation
const handleSalonChoice = () => {
  router.push(`/${locale}/onboarding/salon`);
};
```

**Fix**: Instead of immediate redirect, move to the `StepRegister` form (step 0), but set a flag so that after email verification, the user is redirected to `/onboarding/salon` instead of the customer onboarding:

```typescript
// ✅ DO — create account first, THEN redirect to salon onboarding
const [salonIntent, setSalonIntent] = useState(false);

const handleSalonChoice = () => {
  setSalonIntent(true);
  goTo(0); // Show the StepRegister form
};

// In StepRegister success handler, check salonIntent:
// if (salonIntent) router.push(`/${locale}/onboarding/salon`);
// else goTo(1); // continue to customer onboarding
```

Also read `intent=salon` from URL params on mount:
```typescript
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  if (params.get("intent") === "salon") {
    setSalonIntent(true);
    goTo(0);
  }
}, []);
```

> ⚠️ **BE CAREFUL**:
> - The register page's `StepRegister` component (lines 77–192) calls `POST /api/auth/signup`. This creates the Supabase user. Do NOT modify this API call.
> - The `Mail` icon is imported but may cause a build error — verify it's in the lucide-react import list (line 9–26). It's NOT currently imported. Add `Mail` to the import.
> - After account creation, the user must confirm their email before the Supabase session activates. The onboarding page guard (2.1) will bounce them back to register if email isn't confirmed yet. This is correct behavior.
> - Do NOT touch the customer onboarding steps (Step1, Step2, Step3 for customers) — only modify the salon intent routing.
> - VERIFY: In incognito → /auth/register → "Salon-Inhaber" → must show email/password form → on signup → redirect to /onboarding/salon.

Verification:
```bash
npm run build
git commit -m "phase 2.1: auth guard on salon onboarding + register intent flow"
```

---

**2.2 — Draft persistence API** `[NEW] supabase/migrations/079_salon_drafts.sql`

```sql
CREATE TABLE IF NOT EXISTS public.salon_drafts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  draft_data jsonb NOT NULL DEFAULT '{}',
  current_step int DEFAULT 1,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.salon_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "salon_drafts_own" ON public.salon_drafts
  FOR ALL USING (user_id = auth.uid());
```

`[NEW] app/api/salon-draft/route.ts`

- `GET`: Returns the authenticated user's draft (or `null` if none exists).
- `PUT`: Upserts the draft with `{ draft_data: jsonb, current_step: int }`.
- Full security stack: auth → ban check → rate limit (generalLimiter) → zod validation.
- Max `draft_data` size: 50KB (reject larger payloads).

```typescript
// ✅ DO — upsert pattern
const { error } = await admin
  .from("salon_drafts")
  .upsert({ user_id: user.id, draft_data: body.draft_data, current_step: body.current_step, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
```

```typescript
// ❌ DON'T — separate insert/update logic (race conditions)
```

`[MODIFY] app/[locale]/onboarding/salon/page.tsx` — In the sessionStorage restore `useEffect` (lines 1312–1327), add DB draft fetch:

```typescript
// ✅ DO — try DB first, fall back to sessionStorage
useEffect(() => {
  const loadDraft = async () => {
    try {
      const res = await fetch("/api/salon-draft");
      if (res.ok) {
        const { draft } = await res.json();
        if (draft?.draft_data) {
          const d = draft.draft_data;
          if (d.basics) setBasics(d.basics);
          if (d.profile) setProfile(d.profile);
          // ... same pattern for all fields
          if (draft.current_step) setStep(draft.current_step);
          setHydrated(true);
          return;
        }
      }
    } catch { /* fall through to sessionStorage */ }
    // existing sessionStorage restore logic
  };
  loadDraft();
}, []);
```

Auto-save to DB on step change (debounced):
```typescript
// Save to DB every time step changes (debounced 2s)
useEffect(() => {
  if (!hydrated || !authChecked) return;
  const timer = setTimeout(() => {
    fetch("/api/salon-draft", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        draft_data: { basics, profile, services, staffList, avail, lm },
        current_step: step,
      }),
    }).catch(() => {}); // fire-and-forget
  }, 2000);
  return () => clearTimeout(timer);
}, [hydrated, authChecked, step, basics, profile, services, staffList, avail, lm]);
```

> ⚠️ **BE CAREFUL**:
> - The `salon_drafts` table uses `UNIQUE` on `user_id` — one draft per user. Upsert on conflict.
> - `draft_data` is `jsonb` — must be valid JSON. The wizard state is already JSON-serializable (no functions, no React elements).
> - Do NOT delete the sessionStorage logic — keep it as a fallback for unauthenticated state (shouldn't happen with the guard, but defense in depth).
> - After successful salon creation (`handleSubmit`), delete the draft: `fetch("/api/salon-draft", { method: "DELETE" })` — add DELETE handler to the route.
> - The migration must be run in Supabase SQL Editor before deploying Phase 2.2.

Verification:
```bash
npm run build
git commit -m "phase 2.2: DB-backed draft persistence for salon onboarding wizard"
```

---

### Phase 3: Design Overhaul — Layout & Chrome

**Goal**: Upgrade the page shell, progress bar, step containers, and bottom nav to Zone 3 premium styling. NO blobs, NO grain, NO glass (except nav) — per UI_RULES.md Zone 3.

---

**3.1 — Page background + header** `[MODIFY] app/[locale]/onboarding/salon/page.tsx`

READ the current page wrapper (lines 1387–1389):
```tsx
// ❌ CURRENT — minimal gradient, no visual depth
<div className="min-h-screen bg-gradient-to-br from-s-coral/5 via-white to-s-coral/5 dark:from-s-dm-bg dark:via-s-dm-bg dark:to-s-dm-bg pb-36">
```

Replace with Zone 3 compliant background:
```tsx
// ✅ DO — clean cream base (Zone 3 = NO blobs, NO grain)
<div className="min-h-screen bg-s-bg-base dark:bg-s-dm-bg pb-36">
  {/* Subtle warm radial gradient for depth — NOT a blob */}
  <div className="fixed inset-0 -z-10 pointer-events-none" aria-hidden>
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-radial from-s-coral/[0.04] to-transparent rounded-pill" />
  </div>
```

```tsx
// ❌ DON'T — use BlobBackground (Zone 3 forbids blobs)
<BlobBackground zone={2}> // WRONG — onboarding is Zone 3
```

> ⚠️ **BE CAREFUL**:
> - Zone 3 rules (UI_RULES.md §Zone 3): NO blobs, NO grain, NO glass (except nav), NO Bebas Neue (except logo), ZERO idle animation.
> - The header logo "solen.ch" is already Bebas Neue-sized (line 1436) — this is the nav logo exception, it's fine.
> - Do NOT add `<BlobBackground>` — it's tempting but violates Zone 3.
> - All spacing must follow 8-point grid: `p-4`, `p-6`, `p-8` — NEVER `p-5`, `p-7`.

---

**3.2 — Labeled progress bar** `[MODIFY] app/[locale]/onboarding/salon/page.tsx`

READ the current progress bar (lines 1440–1451). Replace the unlabeled segments with a labeled stepper:

```tsx
// ✅ DO — labeled steps with icons
const STEP_META = [
  { icon: Building2, label: t("progress.basics") },
  { icon: Image, label: t("progress.profile") },
  { icon: Scissors, label: t("progress.services") },
  { icon: Users, label: t("progress.team") },
  { icon: Clock, label: t("progress.hours") },
  { icon: Sparkles, label: t("progress.extras") },
  { icon: Eye, label: t("progress.review") },
];
```

Add new icons to the import: `Image, Scissors, Users, Sparkles, Eye` (from `lucide-react`). `Building2`, `Clock` are already imported.

Show current step label + time estimate:
```tsx
<p className="text-xs text-s-ink/50 dark:text-s-dm-text/50 font-body mt-2 text-center">
  {STEP_META[step - 1]?.label} · ca. {Math.max(1, TOTAL_STEPS - step)} Min. übrig
</p>
```

> ⚠️ **BE CAREFUL**:
> - Add translations for `progress.basics` etc. to ALL 4 locale files: `messages/de.json`, `messages/en.json`, `messages/fr.json`, `messages/it.json` under a new `salonRegistration.progress` key.
> - The `Image` icon from lucide-react may conflict with Next.js `Image` component. Use `import { Image as ImageIcon }` to avoid collision.
> - Do NOT remove the segment progress bar entirely — keep it, but ADD labels below.

Verification:
```bash
npm run build
git commit -m "phase 3: design overhaul — Zone 3 layout, labeled progress, step containers"
```

---

### Phase 4: Design Overhaul — Form Components

**Goal**: Upgrade all form components within the 7 steps to premium Zone 3 styling. Focus on: larger inputs, better OpeningHours UX, staff avatar upload, service cards.

---

**4.1 — Enhanced form inputs** `[MODIFY] app/[locale]/onboarding/salon/page.tsx`

All `<input>` elements in Steps 1–6 currently use `py-2.5` (10px) — upgrade to `py-3` (12px) for better touch targets. Replace `rounded-button` (banned token) with `rounded-input` (12px):

```tsx
// ✅ DO — use design token radii and larger padding
className="w-full px-4 py-3 rounded-input border border-s-ink/5 dark:border-white/5 text-sm text-s-ink dark:text-s-dm-text bg-white dark:bg-s-dm-surface focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/10 transition-all shadow-warm-sm"
```

```tsx
// ❌ DON'T — use banned tokens
className="... rounded-button border-s-ink/10 ..." // rounded-button is BANNED (Rule 20)
```

**4.2 — Opening hours "Copy to all" shortcut** `[MODIFY] app/[locale]/onboarding/salon/page.tsx`

In the Step2 opening hours section (lines 450–490), add a "Mo-Fr kopieren" button that copies Monday's hours to Tue–Fri:

```tsx
// ✅ DO — add after the day list
<button type="button" onClick={() => {
  const mon = data.opening_hours.mon;
  if (!mon) return;
  const updated = { ...data.opening_hours };
  for (const key of ["tue", "wed", "thu", "fri"]) updated[key] = { ...mon };
  onChange({ ...data, opening_hours: updated });
}} className="text-xs text-s-coral hover:underline mt-2">
  Mo → Di–Fr kopieren
</button>
```

**4.3 — Staff avatar upload** `[MODIFY] app/[locale]/onboarding/salon/page.tsx`

In Step4 (lines 829–958), the `avatar_url` field exists in `StaffDraft` but is never used in the form. Add an `<ImageUploader>` for staff photos:

```tsx
// ✅ DO — add avatar upload in staff form
<div>
  <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">Foto (optional)</label>
  <ImageUploader
    bucket="salon-photos"
    label="Foto"
    maxSizeMB={2}
    currentImageUrl={draft.avatar_url || undefined}
    onUpload={(url) => setDraft({ ...draft, avatar_url: url })}
  />
</div>
```

> ⚠️ **BE CAREFUL**:
> - `rounded-button` appears ~30 times in this file. Replace ALL occurrences with `rounded-input` (for inputs/selects) or `rounded-btn` (for buttons). This is a bulk find-replace — do it carefully.
> - Do NOT change the data types of `BasicsData`, `ProfileData`, `ServiceDraft`, `StaffDraft`, or `LMData` — only change JSX/class names.
> - The "Copy to all" button must check if Monday is null (closed) — don't copy null.
> - Staff `ImageUploader` uses the same `salon-photos` bucket — this is fine, uploads go to `uploads/` subfolder.

Verification:
```bash
npm run build
git commit -m "phase 4: form component upgrades — inputs, opening hours copy, staff avatars"
```

---

### Phase 5: Review Step + Celebration Redesign

**Goal**: Make Step 7 (Review) more informative and the completion screen more delightful.

---

**5.1 — Enhanced review step** `[MODIFY] app/[locale]/onboarding/salon/page.tsx`

READ Step7 (lines 1156–1243). Add:
1. A completeness checklist showing what's done vs missing:
```tsx
const checks = [
  { done: !!basics.name, label: "Salon-Name" },
  { done: !!profile.cover_photo_url, label: "Titelbild" },
  { done: profile.gallery_urls.filter(Boolean).length >= 1, label: "Galerie (mind. 1 Bild)" },
  { done: !!profile.description_de, label: "Beschreibung" },
  { done: services.length >= 1, label: "Services" },
  { done: staffList.length >= 1, label: "Team" },
  { done: !!profile.instagram_url, label: "Instagram (optional)", optional: true },
];
```

2. Show missing optional items as amber warnings (not blocking).

**5.2 — Enhanced celebration** `[MODIFY] app/[locale]/onboarding/salon/page.tsx`

READ the celebration overlay (lines 1390–1429). Add a step-by-step recap:
```tsx
<div className="space-y-2 mt-4 w-full">
  <p className="text-xs font-heading font-semibold text-s-ink dark:text-s-dm-text">Was du eingerichtet hast:</p>
  <div className="text-xs text-s-ink/60 dark:text-s-dm-text/60 space-y-1">
    <p>✓ Salon erstellt: {basics.name}</p>
    <p>✓ {services.length} Service{services.length !== 1 ? "s" : ""}</p>
    <p>✓ {staffList.length} Teammitglied{staffList.length !== 1 ? "er" : ""}</p>
  </div>
</div>
```

> ⚠️ **BE CAREFUL**:
> - Do NOT use confetti animation — UI_RULES.md §20 explicitly says "No Confetti" for booking success. While this is onboarding (not booking), keep consistent: use the existing `PartyPopper` icon animation instead.
> - The emoji checkmarks (✓) are acceptable here as they're text content, not UI icons. But if you prefer, use `<Check size={12} className="text-s-sage inline" />` from lucide-react.
> - Do NOT remove the existing Stripe Connect CTA in the celebration — it's critical for payment setup.

Verification:
```bash
npm run build
git commit -m "phase 5: enhanced review checklist + celebration recap"
```

---

### Phase 6: Polish + Accessibility

**Goal**: Add micro-interactions, mobile responsiveness fixes, and ARIA labels.

---

**6.1 — Mobile fixes** `[MODIFY] app/[locale]/onboarding/salon/page.tsx`

- Opening hours: Stack time inputs vertically on screens < 400px using `flex-col` + responsive `sm:flex-row` (already partially done on line 456, but break rows at line 1037 overflow).
- Service form: Reduce grid from `grid-cols-3` (line 743) to `grid-cols-1 sm:grid-cols-3` for the category/duration/price row.
- All buttons: ensure minimum 44px touch target height (`min-h-[44px]`).

**6.2 — ARIA + focus management** `[MODIFY] app/[locale]/onboarding/salon/page.tsx`

- Add `aria-label` to the progress bar: already done (line 1441).
- Add `role="form"` to each StepContainer.
- On step transition, focus the first input of the new step using `useRef` + `useEffect`.
- Add `aria-live="polite"` to the step error display area.

**6.3 — Micro-animations** `[MODIFY] app/[locale]/onboarding/salon/page.tsx`

Zone 3 allows ZERO idle animation but interaction animations are fine per UI_RULES.md §4 Tier 3:
- Button active: `active:translate-y-[1px] active:shadow-pressed` on the Weiter/Zurück buttons.
- Category pill: `transition-all duration-150` already present — add `active:scale-[0.97]`.

> ⚠️ **BE CAREFUL**:
> - Zone 3 = ZERO idle animation. Do NOT add floating elements, pulsing badges, or auto-playing transitions.
> - Interaction animations (hover, active, focus) ARE allowed in Zone 3.
> - The `slideSwitch` step transition animation is acceptable — it's user-triggered, not idle.

Verification:
```bash
npm run build
git commit -m "phase 6: mobile fixes + ARIA accessibility + interaction micro-animations"
```

---

### Phase 7: CLAUDE.md + Documentation Update (R8)

`[MODIFY] CLAUDE.md`

Update **Section 6 (Schema Table)** — add:

| Table | Key Columns | Notes |
|---|---|---|
| `salon_drafts` | `id`, `user_id` (UNIQUE), `draft_data` (jsonb), `current_step`, `updated_at` | Wizard draft persistence. One draft per user. Auto-deleted on salon creation. |

Update **Section 3.5 (Key Features)** — update entry for salon onboarding to note:
- DB-backed draft persistence
- Auth-gated wizard flow
- Premium Zone 3 design

`[MODIFY] lib/types.ts` — Add:
```typescript
export interface SalonDraft {
  id: string;
  user_id: string;
  draft_data: Record<string, unknown>;
  current_step: number;
  updated_at: string;
}
```

Verification:
```bash
npm run build
git commit -m "phase 7: CLAUDE.md schema update + SalonDraft type"
```

---

## 🧑 MANUAL PHASES

### Manual A: Run Migration 079 (BEFORE Phase 2.2 deploy)

**Supabase Dashboard → SQL Editor:**
1. Paste contents of `supabase/migrations/079_salon_drafts.sql`
2. Execute
3. Verify: `SELECT * FROM salon_drafts LIMIT 1;` should return empty result (no error)

### Manual B: Verify salon-photos Bucket RLS

**Supabase Dashboard → Storage → salon-photos → Policies:**
1. Ensure there's an INSERT policy allowing authenticated users: `auth.uid() IS NOT NULL`
2. If missing, add: `CREATE POLICY "salon_photos_auth_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'salon-photos' AND auth.uid() IS NOT NULL);`

> ⚠️ If the bucket policies don't allow authenticated inserts, image upload will fail even after Phase 1.1 auth check fix.

---

## DEPENDENCY ORDERING TABLE (R6)

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1.1 | 🤖 | ImageUploader auth + error fix | Nothing |
| Phase 1.2 | 🤖 | Submit error handling fix | Nothing |
| Phase 1.3 | 🤖 | Gallery count display fix | Nothing |
| Phase 2.1 | 🤖 | Auth guard + register intent flow | Phase 1.1 (ImageUploader fix) |
| Manual A | 🧑 | Run migration 079 | Before Phase 2.2 deploy |
| Manual B | 🧑 | Verify salon-photos bucket | Before Phase 1.1 deploy |
| Phase 2.2 | 🤖 | Draft persistence API + DB | Manual A done |
| Phase 3 | 🤖 | Layout + progress bar + StepContainer | Phase 1 (all bug fixes) |
| Phase 4 | 🤖 | Form component upgrades | Phase 3 (new container styling) |
| Phase 5 | 🤖 | Review + celebration redesign | Phase 4 (components upgraded) |
| Phase 6 | 🤖 | Polish + accessibility | Phase 5 |
| Phase 7 | 🤖 | CLAUDE.md + types update | All phases done |

---

## POST-EXECUTION SMOKE TEST (Rule 29)

After ALL phases:

1. `npm run build` — 0 errors
2. `npx tsc --noEmit` — 0 errors
3. No dead components: `grep -rn "SalonDraft" lib/ app/ --include="*.ts*"` returns ≥2 results
4. No missing types: `npx tsc --noEmit 2>&1 | grep "has no exported member"` = 0 results
5. No banned tokens introduced: run Rule 20 grep on modified files
6. No duplicate layout elements: onboarding page must NOT import Header/BottomNav
7. **Auth guard test**: Navigate to `/onboarding/salon` in incognito → must redirect to `/auth/register?intent=salon`
8. **Register intent test**: At `/auth/register`, click "Salon-Inhaber" → must show registration form → on signup → redirect to `/onboarding/salon`
9. **Image upload test**: Log in → navigate to Step 2 → upload JPEG → must show preview + progress bar → URL stored in state
10. **Submit error test**: Complete all 7 steps → disconnect network → click "Salon erstellen" → must show error banner
11. **Draft persistence test**: Fill Steps 1–3 → close tab → reopen `/onboarding/salon` → state restored from DB
12. **Gallery test**: Add 3 gallery slots → upload 2 → counter shows "2/5"
13. **Mobile test**: 375px viewport → all forms usable, no horizontal overflow, 44px touch targets
14. **Translations test**: `grep -rn "progress\." messages/de.json` returns step labels
15. **Premium audit**: No `rounded-button`, `shadow-sm`, `bg-red-*` in modified files

---
---

## APPENDIX A: BANNED TOKEN VIOLATION INVENTORY

> This is the complete list of every design-system violation in the onboarding page, scanned via `grep -n`. Every single one must be fixed during Phases 3–4.

### A1: `rounded-button` → replace per element type (41 occurrences)

**Rule**: `rounded-button` is a BANNED token (UI_RULES.md §16). Replace with:
- `rounded-input` (12px) — for `<input>`, `<select>`, `<textarea>` elements
- `rounded-btn` (99px pill) — for `<button>` elements
- `rounded-card` (20px) — for card containers

| Line | Element Type | Current | Replace With | Context |
|---|---|---|---|---|
| 154 | `<input>` (salon name) | `rounded-button` | `rounded-input` | Step 1 — name field |
| 166 | `<input>` (email) | `rounded-button` | `rounded-input` | Step 1 — email field |
| 199 | `<select>` (quartier) | `rounded-button` | `rounded-input` | Step 1 — quartier dropdown |
| 231 | `<input>` (phone) | `rounded-button` | `rounded-input` | Step 1 — phone input |
| 235 | `<div>` (verified badge) | `rounded-button` | `rounded-pill` | Step 1 — "Verifiziert" badge |
| 243 | `<button>` (send OTP) | `rounded-button` | `rounded-btn` | Step 1 — "Verifizieren" CTA |
| 261 | `<input>` (OTP code) | `rounded-button` | `rounded-input` | Step 1 — OTP code entry |
| 267 | `<button>` (check OTP) | `rounded-button` | `rounded-btn` | Step 1 — "Code prüfen" |
| 404 | `<textarea>` (desc DE) | `rounded-button` | `rounded-input` | Step 2 — German description |
| 415 | `<textarea>` (desc EN) | `rounded-button` | `rounded-input` | Step 2 — English description |
| 424 | `<input>` (Instagram) | `rounded-button` | `rounded-input` | Step 2 — Instagram URL |
| 435 | `<input>` (website) | `rounded-button` | `rounded-input` | Step 2 — website URL |
| 445 | `<input>` (TikTok) | `rounded-button` | `rounded-input` | Step 2 — TikTok URL |
| 461 | `<button>` (day toggle) | `rounded-button` | `rounded-btn` | Step 2 — opening hours day |
| 473 | `<input type="time">` | `rounded-button` | `rounded-input` | Step 2 — open time |
| 480 | `<input type="time">` | `rounded-button` | `rounded-input` | Step 2 — close time |
| 705 | `<input>` (service name) | `rounded-button` | `rounded-input` | Step 3 — custom service name |
| 715 | `<input>` (service desc) | `rounded-button` | `rounded-input` | Step 3 — service description |
| 723 | `<input>` (service desc EN) | `rounded-button` | `rounded-input` | Step 3 — service desc EN |
| 731 | `<input>` (service desc FR) | `rounded-button` | `rounded-input` | Step 3 — service desc FR |
| 749 | `<select>` (duration) | `rounded-button` | `rounded-input` | Step 3 — duration dropdown |
| 762 | `<select>` (category) | `rounded-button` | `rounded-input` | Step 3 — service category |
| 776 | `<input>` (price) | `rounded-button` | `rounded-input` | Step 3 — price field |
| 782 | `<button>` (cancel) | `rounded-button` | `rounded-btn` | Step 3 — "Abbrechen" |
| 784 | `<button>` (add) | `rounded-button` | `rounded-btn` | Step 3 — "Hinzufügen" |
| 888 | `<input>` (staff name) | `rounded-button` | `rounded-input` | Step 4 — staff name |
| 938 | `<button>` (cancel) | `rounded-button` | `rounded-btn` | Step 4 — "Abbrechen" |
| 940 | `<button>` (add) | `rounded-button` | `rounded-btn` | Step 4 — "Hinzufügen" |
| 951 | `<button>` (solo) | `rounded-button` | `rounded-btn` | Step 4 — "Nur ich" |
| 1013 | `<button>` (day toggle) | `rounded-button` | `rounded-btn` | Step 5 — availability day |
| 1021 | `<input type="time">` | `rounded-button` | `rounded-input` | Step 5 — start time |
| 1025 | `<input type="time">` | `rounded-button` | `rounded-input` | Step 5 — end time |
| 1041 | `<input type="time">` | `rounded-button` | `rounded-input` | Step 5 — break start |
| 1045 | `<input type="time">` | `rounded-button` | `rounded-input` | Step 5 — break end |
| 1221 | `<button>` (edit basics) | `rounded-button` | `rounded-btn` | Step 7 — review edit |
| 1224 | `<button>` (edit profile) | `rounded-button` | `rounded-btn` | Step 7 — review edit |
| 1227 | `<button>` (edit services) | `rounded-button` | `rounded-btn` | Step 7 — review edit |
| 1230 | `<button>` (edit team) | `rounded-button` | `rounded-btn` | Step 7 — review edit |
| 1233 | `<button>` (edit hours) | `rounded-button` | `rounded-btn` | Step 7 — review edit |
| 1236 | `<button>` (edit extras) | `rounded-button` | `rounded-btn` | Step 7 — review edit |
| 1484 | `<button>` (back) | `rounded-button` | `rounded-btn` | Nav — "Zurück" |
| 1494 | `<button>` (next) | `rounded-button` | `rounded-btn` | Nav — "Weiter" |

### A2: `green-*` → replace with semantic tokens (2 occurrences)

| Line | Current | Replace With | Context |
|---|---|---|---|
| 231 | `border-green-500/50 text-green-700 dark:text-green-400` | `border-s-sage/50 text-s-sage-text dark:text-s-sage` | Phone input — verified state border+text |
| 235 | `bg-green-500/10 text-green-600 dark:text-green-400` | `bg-s-sage-subtle text-s-sage-text dark:text-s-sage` | "Verifiziert" badge background+text |

### A3: `rounded-full` → replace with `rounded-pill` (3 occurrences)

| Line | Current | Replace With | Context |
|---|---|---|---|
| 365 | `rounded-full` (gallery remove btn) | `rounded-pill` | Gallery image delete button |
| 1088 | `rounded-full` (toggle track) | `rounded-pill` | Last-minute toggle switch track |
| 1089 | `rounded-full` (toggle knob) | `rounded-pill` | Last-minute toggle switch knob |

### A4: Missing `dark:` pairs audit

The `StepContainer` (line 55) uses `bg-white/70` — needs `dark:bg-s-dm-surface/80` ✅ (already has it).
The celebration overlay (line 1395) uses `bg-white/90` — needs dark pair. Currently has `dark:bg-s-dm-bg/90` ✅.
Toggle knob (line 1089) uses `bg-white` — this is a toggle knob, so per Rule 21 it's exempt ✅.

**Result**: No missing dark mode pairs found — ✅ clean.

### A5: `backdrop-blur-glass` usage in StepContainer (line 55)

The `StepContainer` uses `backdrop-blur-glass` which is a glass effect. Per UI_RULES.md Zone 3: "Glass: NONE (except nav pill)." This is a **Zone violation** — the StepContainer should NOT use glass blur in Zone 3.

**Fix**: Remove `backdrop-blur-glass` from StepContainer. Replace with solid `bg-white dark:bg-s-dm-surface` + `shadow-warm-md`.

```diff
- bg-white/70 dark:bg-s-dm-surface/80 backdrop-blur-glass
+ bg-white dark:bg-s-dm-surface
```

---

## APPENDIX B: FULL BEFORE→AFTER DIFFS

### B1: StepContainer redesign (line 52–63)

```diff
 function StepContainer({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
   return (
     <div className="max-w-xl mx-auto">
-      <div className="bg-white/70 dark:bg-s-dm-surface/80 backdrop-blur-glass rounded-card border border-s-ink/5 dark:border-white/5 shadow-warm-md p-6 sm:p-8">
+      <div className="bg-white dark:bg-s-dm-surface rounded-card border border-s-ink/5 dark:border-white/5 shadow-warm-md p-6 sm:p-8">
         <h2 className="font-heading font-bold text-2xl text-s-ink dark:text-s-dm-text mb-1">{title}</h2>
         {subtitle && <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50 mb-6">{subtitle}</p>}
         {!subtitle && <div className="mb-6" />}
         {children}
       </div>
     </div>
   );
 }
```

### B2: Input fields standard pattern (applies to lines 154, 166, 424, 435, 445, 705, 715, 723, 731, 776, 888)

```diff
- className="w-full px-3 py-2.5 rounded-button border border-s-ink/10 dark:border-white/10 text-sm text-s-ink dark:text-s-dm-text bg-white dark:bg-s-dm-raised focus:outline-none focus:border-s-coral"
+ className="w-full px-4 py-3 rounded-input border border-s-ink/5 dark:border-white/5 text-sm text-s-ink dark:text-s-dm-text bg-white dark:bg-s-dm-raised focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/10 transition-all shadow-warm-sm"
```

**What changed and why:**
- `px-3` → `px-4` — 8pt grid (16px padding)
- `py-2.5` → `py-3` — 8pt grid (12px padddng, larger touch target)
- `rounded-button` → `rounded-input` — design token fix (12px radius)
- `border-s-ink/10` → `border-s-ink/5` — thinner border (premium §19e)
- Added `focus:ring-2 focus:ring-s-coral/10` — soft focus glow
- Added `transition-all` — smooth focus state
- Added `shadow-warm-sm` — subtle input depth

### B3: Textarea pattern (applies to lines 404, 415)

```diff
- className="w-full px-3 py-2 rounded-button border border-s-ink/10 dark:border-white/10 text-sm text-s-ink dark:text-s-dm-text bg-white dark:bg-s-dm-raised focus:outline-none focus:border-s-coral resize-none"
+ className="w-full px-4 py-3 rounded-input border border-s-ink/5 dark:border-white/5 text-sm text-s-ink dark:text-s-dm-text bg-white dark:bg-s-dm-raised focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/10 transition-all shadow-warm-sm resize-none"
```

### B4: Select pattern (applies to lines 199, 749, 762)

```diff
- className={`w-full px-3 py-2.5 rounded-button border text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral bg-white dark:bg-s-dm-raised ${errors.quartier ? "border-s-coral" : "border-s-ink/10 dark:border-white/10"}`}
+ className={`w-full px-4 py-3 rounded-input border text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/10 bg-white dark:bg-s-dm-raised shadow-warm-sm transition-all ${errors.quartier ? "border-s-coral" : "border-s-ink/5 dark:border-white/5"}`}
```

### B5: Time input pattern (applies to lines 473, 480, 1021, 1025)

```diff
- className="px-2 py-1 rounded-button border border-s-ink/10 dark:border-white/10 text-xs text-s-ink dark:text-s-dm-text bg-white dark:bg-s-dm-raised focus:outline-none focus:border-s-coral"
+ className="px-2 py-1.5 rounded-input border border-s-ink/5 dark:border-white/5 text-xs text-s-ink dark:text-s-dm-text bg-white dark:bg-s-dm-raised focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/10 transition-all min-w-[80px]"
```

**Note**: `py-1` → `py-1.5` for slightly larger touch target. Added `min-w-[80px]` to prevent time inputs from collapsing on mobile.

### B6: Break time input pattern (applies to lines 1041, 1045)

```diff
- className="px-1.5 py-0.5 rounded-button border border-s-coral/30 text-xs text-s-ink dark:text-s-dm-text bg-white dark:bg-s-dm-raised focus:outline-none focus:border-s-coral"
+ className="px-2 py-1.5 rounded-input border border-s-coral/30 text-xs text-s-ink dark:text-s-dm-text bg-white dark:bg-s-dm-raised focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/10 transition-all min-w-[80px]"
```

### B7: Primary button pattern (applies to lines 243, 784, 940, 1494)

```diff
- className="px-4 py-2.5 rounded-button bg-s-coral text-white text-sm font-medium disabled:opacity-50 hover:bg-s-coral/90 transition-colors"
+ className="px-6 py-3 rounded-btn bg-s-coral text-white text-sm font-heading font-semibold uppercase tracking-wider disabled:opacity-40 disabled:pointer-events-none hover:bg-s-coral-hover active:translate-y-[1px] active:shadow-pressed transition-all shadow-coral-glow hover:shadow-coral-glow-hover"
```

**What changed and why:**
- `px-4` → `px-6` — wider padding (24px, premium feel)
- `py-2.5` → `py-3` — taller (12px, 44px+ touch target)
- `rounded-button` → `rounded-btn` — pill shape (99px)
- `font-medium` → `font-heading font-semibold uppercase tracking-wider` — button label spec per UI_RULES.md §31
- `disabled:opacity-50` → `disabled:opacity-40 disabled:pointer-events-none` — per §31
- Added `active:translate-y-[1px] active:shadow-pressed` — pressed state per §31
- Added `shadow-coral-glow hover:shadow-coral-glow-hover` — coral CTA glow per §31
- `hover:bg-s-coral/90` → `hover:bg-s-coral-hover` — use design variable

### B8: Secondary/outline button pattern (applies to lines 782, 938, 951, 1484)

```diff
- className="px-4 py-2 rounded-button border border-s-ink/10 dark:border-white/10 text-sm text-s-ink/60 dark:text-s-dm-text/60"
+ className="px-4 py-3 rounded-btn border border-s-ink/5 dark:border-white/5 text-sm font-heading font-semibold uppercase tracking-wider text-s-ink/60 dark:text-s-dm-text/60 hover:bg-s-ink hover:text-s-bg-base dark:hover:bg-white dark:hover:text-s-ink active:translate-y-[1px] active:shadow-pressed transition-all shadow-xs"
```

### B9: Step 7 review edit buttons (applies to lines 1221–1236)

```diff
- className="p-3 text-left rounded-button border border-s-ink/5 dark:border-white/5 hover:border-s-coral hover:bg-s-coral/5 transition-colors text-sm text-s-ink dark:text-s-dm-text bg-white dark:bg-s-dm-raised flex justify-between items-center group"
+ className="p-4 text-left rounded-btn border border-s-ink/5 dark:border-white/5 hover:border-s-coral hover:bg-s-coral/5 transition-all text-sm font-heading text-s-ink dark:text-s-dm-text bg-white dark:bg-s-dm-raised flex justify-between items-center group active:translate-y-[1px] shadow-xs hover:shadow-warm-sm"
```

### B10: Phone verified state (lines 231, 235)

```diff
- className={`flex-1 px-3 py-2.5 rounded-button border text-sm focus:outline-none focus:border-s-coral bg-white dark:bg-s-dm-raised ${data.phone_verified ? "border-green-500/50 text-green-700 dark:text-green-400" : errors.phone_verified || errors.phone ? "border-s-coral text-s-ink dark:text-s-dm-text" : "border-s-ink/10 dark:border-white/10 text-s-ink dark:text-s-dm-text"}`}
+ className={`flex-1 px-4 py-3 rounded-input border text-sm focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/10 bg-white dark:bg-s-dm-raised transition-all shadow-warm-sm ${data.phone_verified ? "border-s-sage/50 text-s-sage-text dark:text-s-sage" : errors.phone_verified || errors.phone ? "border-s-coral text-s-ink dark:text-s-dm-text" : "border-s-ink/5 dark:border-white/5 text-s-ink dark:text-s-dm-text"}`}
```

```diff
- <div className="flex items-center justify-center px-4 bg-green-500/10 text-green-600 dark:text-green-400 rounded-button text-sm font-medium">
+ <div className="flex items-center justify-center px-4 bg-s-sage-subtle text-s-sage-text dark:text-s-sage rounded-pill text-sm font-medium">
```

### B11: Gallery remove button (line 365)

```diff
- className="absolute top-1 right-1 p-1 rounded-full bg-white/90 dark:bg-s-dm-raised/90 text-s-ink/60 dark:text-s-dm-text/60 hover:text-s-coral"
+ className="absolute top-1 right-1 p-1 rounded-pill bg-white/90 dark:bg-s-dm-raised/90 text-s-ink/60 dark:text-s-dm-text/60 hover:text-s-coral transition-colors"
```

### B12: Last-minute toggle (lines 1088–1089)

```diff
- className={["w-11 h-6 rounded-full transition-colors relative",
+ className={["w-11 h-6 rounded-pill transition-colors relative",
```

```diff
- className={["absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform",
+ className={["absolute top-0.5 w-5 h-5 rounded-pill bg-white shadow-warm-sm transition-transform",
```

**Note**: The toggle knob `bg-white` without `dark:` is exempt per Rule 21 (toggle knob exception). Also fixed `shadow-sm` → `shadow-warm-sm`.

---

## APPENDIX C: TRANSLATION KEYS TO ADD

Add these to **all 4 locale files**: `messages/de.json`, `messages/en.json`, `messages/fr.json`, `messages/it.json`.

Under `salonRegistration.progress`:

```json
{
  "salonRegistration": {
    "progress": {
      "basics": "Grundlagen",
      "profile": "Profil",
      "services": "Services",
      "team": "Team",
      "hours": "Zeiten",
      "extras": "Extras",
      "review": "Überprüfung"
    }
  }
}
```

| Key | DE | EN | FR | IT |
|---|---|---|---|---|
| `progress.basics` | Grundlagen | Basics | Informations | Base |
| `progress.profile` | Profil | Profile | Profil | Profilo |
| `progress.services` | Services | Services | Services | Servizi |
| `progress.team` | Team | Team | Équipe | Team |
| `progress.hours` | Zeiten | Hours | Horaires | Orari |
| `progress.extras` | Extras | Extras | Extras | Extra |
| `progress.review` | Überprüfung | Review | Vérification | Revisione |

---

## APPENDIX D: EDGE CASE TEST MATRIX

| # | Scenario | Expected Behavior | Phase |
|---|---|---|---|
| E1 | User navigates to `/onboarding/salon` without auth | Redirect to `/auth/register?intent=salon` | 2.1 |
| E2 | User navigates to `/onboarding/salon` with expired session | Redirect to `/auth/register?intent=salon` | 2.1 |
| E3 | User clicks "Salon-Inhaber" on register page | Shows email/password form, NOT immediate redirect | 2.1b |
| E4 | After registration, email not yet confirmed | Supabase session exists but email unverified — wizard should still work (registration confirms session) | 2.1 |
| E5 | Upload image > 5MB | Error: "Datei zu gross (max. 5 MB)" shown immediately, no upload attempt | 1.1 |
| E6 | Upload non-image file (PDF) | Error: "Nur JPEG, PNG oder WebP erlaubt." shown immediately | 1.1 |
| E7 | Upload image with no Supabase session | Error: "Bitte melde dich zuerst an, um Bilder hochzuladen." | 1.1 |
| E8 | Upload image with valid session but `salon-photos` bucket missing | Error: Shows actual Supabase error (e.g., "Bucket not found") | 1.1 |
| E9 | Submit salon with network disconnected | Error banner: "Netzwerkfehler — bitte prüfe deine Verbindung..." | 1.2 |
| E10 | Submit salon when server returns 400 (validation error) | Error banner with server message (e.g., "Name muss mindestens 2 Zeichen haben") | 1.2 |
| E11 | Submit salon when server returns 500 | Error banner: "Fehler beim Erstellen (500)" | 1.2 |
| E12 | Submit salon when server returns 401 (session expired mid-wizard) | Error banner: "Fehler beim Erstellen (401)" — user should re-login | 1.2 |
| E13 | Add 5 gallery slots, upload only 3 | Counter shows "3/5 Bilder hochgeladen". Submit sends `gallery_urls: ["url1", "", "url2", "", "url3"]` which gets filtered to `["url1", "url2", "url3"]` by `route.ts` line 209 | 1.3 |
| E14 | Fill steps 1–3 → close browser → reopen `/onboarding/salon` | Data restored from DB draft (if authenticated) or lost (if sessionStorage cleared). With Phase 2.2: always restored from DB. | 2.2 |
| E15 | Two tabs open on same wizard | Both tabs write to same `salon_drafts` row (UPSERT on `user_id`). Last write wins. This is acceptable — single-user flow. | 2.2 |
| E16 | Complete salon creation → try to access draft API | Draft should be deleted. `GET /api/salon-draft` returns `null`. | 2.2 |
| E17 | Mobile viewport 375px — Step 2 opening hours | Time inputs stack vertically with `flex-col`. Day buttons remain visible. No horizontal overflow. | 6.1 |
| E18 | Mobile viewport 375px — Step 3 service form | Price/duration/category grid goes `grid-cols-1` on mobile, stacked vertically. | 6.1 |
| E19 | Step 5 availability — toggle all days off | Validation error: "Mindestens 1 aktiver Tag erforderlich" (step5Schema line 43) | Existing |
| E20 | Step 7 review — click "Basics" edit button → make change → click "Weiter" | Should return to Step 7 (reviewToReview flag, line 1267–1271) | Existing |
| E21 | `prefers-reduced-motion: reduce` | All step transition animations (slideSwitch) should be instant. No visible motion. | 6.2 |
| E22 | Keyboard navigation — Step 1 | Tab through all fields in order: name → email → categories → quartier → address → phone → TOS → Weiter button. Focus ring visible on each. | 6.2 |
| E23 | "Mo → Di–Fr kopieren" with Monday closed (null) | Button should be a no-op (early return if `!mon`). No crash. | 4.2 |
| E24 | Step 2 — description_de empty + click "Weiter" | Validation error from step2Schema: "Beschreibung muss mindestens 20 Zeichen haben" shown inline | Existing |

---

## APPENDIX E: NEW IMPORTS REQUIRED

Add to the import block (line 7) in `app/[locale]/onboarding/salon/page.tsx`:

```diff
- import { Check, Plus, Trash2, ChevronRight, ChevronLeft, PartyPopper, Clock, Pencil, Loader2, Eye, ExternalLink, Star, MapPin } from "lucide-react";
+ import { Check, Plus, Trash2, ChevronRight, ChevronLeft, PartyPopper, Clock, Pencil, Loader2, Eye, ExternalLink, Star, MapPin, Building2, Scissors, Users, Sparkles, Image as ImageIcon } from "lucide-react";
```

**Note**: `Image` is renamed to `ImageIcon` to avoid collision with Next.js `Image` component (though it's not currently imported in this file, this is preventive). `Clock` and `Eye` are already imported.

---

## APPENDIX F: FILES TOUCHED PER PHASE (EXACT)

| Phase | Files Modified | Files Created | Lines Changed (est.) |
|---|---|---|---|
| 1.1 | `components/ui/ImageUploader.tsx` | — | ~30 |
| 1.2 | `app/[locale]/onboarding/salon/page.tsx` | — | ~20 |
| 1.3 | `app/[locale]/onboarding/salon/page.tsx` | — | ~5 |
| 2.1 | `app/[locale]/onboarding/salon/page.tsx`, `app/[locale]/auth/register/page.tsx` | — | ~40 |
| 2.2 | `app/[locale]/onboarding/salon/page.tsx` | `app/api/salon-draft/route.ts`, `supabase/migrations/079_salon_drafts.sql` | ~120 |
| 3 | `app/[locale]/onboarding/salon/page.tsx`, `messages/de.json`, `messages/en.json`, `messages/fr.json`, `messages/it.json` | — | ~80 |
| 4 | `app/[locale]/onboarding/salon/page.tsx` | — | ~120 (41 class replacements + opening hours copy + staff avatar) |
| 5 | `app/[locale]/onboarding/salon/page.tsx` | — | ~60 |
| 6 | `app/[locale]/onboarding/salon/page.tsx` | — | ~40 |
| 7 | `CLAUDE.md`, `lib/types.ts` | — | ~15 |
| **TOTAL** | **7 unique files** | **2 new files** | **~530 lines** |
