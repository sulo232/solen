---
description: Phase 1 roadmap for resolving backend connectivity and hardcoded data issues identified in the initial Solen platform audit.
---

# Roadmp: Backend Connectivity Remediation (Audit 1)

This roadmap resolves the 🟡 Partially Connected and 🔴 Frontend-Only components identified in the first sweep of the `solen_platform_audit.md`.

## BREAKAGE RISK ASSESSMENT

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🟡 MEDIUM | Marketing layout shifting | Always provide fallback numbers if the metrics API fails |
| Phase 2 | 🟡 MEDIUM | Conversion tracking | Do not conditionally render the entire page wrapper in `BookingSuccess`, only the dynamic text strings |
| Phase 3 | 🟢 SAFE | Nothing | Pure feature addition for B2B leads |
| Phase 4 | 🟢 SAFE | Nothing | Documentation updates |

---

## 🤖 CLAUDE CODE PHASES

### Phase 1: Global Marketing Components (SocialProofStrip)
Resolves hardcoded "+500 Salons" by fetching real aggregate metrics from Supabase.

**Files:**
- `[MODIFY]` `components/marketing/SocialProofStrip.tsx`
- `[NEW]` `app/api/metrics/global/route.ts`

> ⚠️ **BE CAREFUL**:
> - **What could go wrong:** The global metrics API could fail or time out, resulting in empty/broken text on the homepage.
> - **Common mistakes:** Forgetting to handle the `catch` block and crashing the whole component.
> - **Edge cases:** Supabase aggregation queries can be slow. Ensure the endpoint uses Next.js fetch caching matching `revalidate: 86400` (24 hours).
> - **UI Constraints:** This is Zone 1/2. Keep typography strict.

**✅ DO:**
```tsx
// Always provide a fallback
function SocialProofStrip() {
  const [metrics, setMetrics] = useState({ salons: 500, bookings: 10000 });
  // ... fetch with try/catch
}
```

**❌ DON'T:**
```tsx
// Never assume the API will succeed without a fallback
const data = await fetch('/api/metrics').then(res => res.json());
```

**Verification Steps:**
- Run: `git commit -m "feat: Connect SocialProofStrip to real Supabase metrics with fallback"`
- Test: Build the project and load the homepage. The numbers should render properly. Verify the new API route returns a 200 via curl or browser.

---

### Phase 2: Booking Success Dynamic Data & i18n
Resolves hardcoded German success text and hardcoded "10 CHF" referral text in the booking confirmation step.

**Files:**
- `[MODIFY]` `components/booking/BookingSuccess.tsx`
- `[MODIFY]` `messages/de.json`
- `[MODIFY]` `messages/en.json`
- `[MODIFY]` `messages/fr.json`
- `[MODIFY]` `messages/it.json`

> ⚠️ **BE CAREFUL**:
> - **What could go wrong:** Removing the outer structure might break external pixel tracking that relies on DOM elements.
> - **Common mistakes:** Translating the text but leaving the "CHF 10" hardcoded. Fetch the actual referral reward config or use the proper placeholder.
> - **Edge cases:** Ensure the booking details props (time/date/service) are safely validated before rendering to prevent undefined crashes.

**✅ DO:**
```tsx
const t = useTranslations('booking.success');
<p>{t('referralReward', { amount: dynamicAmount })}</p>
```

**❌ DON'T:**
```tsx
<p>Du erhältst 10 CHF für jede Empfehlung!</p>
```

**Verification Steps:**
- Run: `git commit -m "fix: i18n and dynamic referral data in BookingSuccess"`
- Test: Manually visit the booking success route in all locale prefixes (`/en`, `/de`, `/fr`) to ensure translations load without crashing.

---

### Phase 3: B2B Partner Lead Capture
Resolves the static `/partner` page by creating a functional lead capture form that writes to Supabase.

**Files:**
- `[MODIFY]` `app/[locale]/partner/page.tsx`
- `[NEW]` `components/partner/PartnerSignupForm.tsx`
- `[NEW]` `app/api/partner/leads/route.ts`

> ⚠️ **BE CAREFUL**:
> - **What could go wrong:** The insert to Supabase could violate RLS policies if not careful.
> - **Common mistakes:** Not using standard error states for when the user submits an already registered email.
> - **Edge cases:** The form must handle standard input validation (Zod) before dispatching the POST request.

**✅ DO:**
```tsx
// Use Zod for validation before submit
const leadSchema = z.object({ email: z.string().email(), salon_name: z.string() });
```

**❌ DON'T:**
```tsx
// Blindly sending to the API
const submit = () => fetch('/api/leads', { method: 'POST', body: JSON.stringify(data) });
```

**Verification Steps:**
- Run: `git commit -m "feat: implement Partner lead capture form and API"`
- Test: Submit a test lead via the UI and verify it appears in the Supabase `partner_leads` table (if it exists, or verify the endpoint logic returns 200).

---

### Phase 4: Final Updates & Documentation
Update the project documentation to register the new global metrics and lead API endpoints.

**Files:**
- `[MODIFY]` `CLAUDE.md`

> ⚠️ **BE CAREFUL**:
> - **What could go wrong:** Messing up the markdown table structure in CLAUDE.md.
> - **Common mistakes:** Adding the API to the wrong category in the directory tree.

**✅ DO:**
Add the `api/metrics/global` route definitively under the API folder section.

**❌ DON'T:**
Delete other structural elements of CLAUDE.md.

**Verification Steps:**
- Run: `git commit -m "docs: update CLAUDE.md with new metrics and partner API routes"`

---

## DEPENDENCY ORDERING TABLE

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | SocialProofStrip dynamic metrics | Nothing |
| Phase 2 | 🤖 | BookingSuccess dynamic data & i18n | Nothing |
| Phase 3 | 🤖 | Partner Lead Capture | Nothing |
| Phase 4 | 🤖 | CLAUDE.md Updates | Phase 1 & 3 |
