# Onboarding Flow Remediation Roadmap

This roadmap addresses all critical issues reported in the Solen dashbaord Setup Checklist (Einrichtung). It aims to fix the routing, data integration (pre-filling name and category), UI elements (breaks in opening hours, image upload, Prepay enforced), AI integrations (Gemini service templating, auto-translation for English), and backend logic (team invites during inactive state).

## R1: BREAKAGE RISK ASSESSMENT

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1: DB & API Adjustments | 🟡 MEDIUM | Registration flow, Staff Invites | Ensure `salons` insert correctly maps B2B name/category. Do not modify basic staff invite token auth, only the `is_active` check. |
| Phase 2: Setup Components UI Updates | 🟡 MEDIUM | Existing onboarding progress | Double check `PATCH /api/salons/[id]` still saves partial profiles correctly. |
| Phase 3: AI Integrations | 🟢 SAFE | Nothing | Add new API routes separately without altering core logic. |

---

## 🤖 CLAUDE CODE PHASES

### Phase 1: Database & Core API Fixes
We will fix the immediate backend blockers that prevent users from progressing through the setup.

1. **Remove `is_active` constraint for Team Invites**
   - **File:** `app/api/staff/invite/route.ts` `[MODIFY]`
   - Remove `.eq("is_active", true)` from the salon ownership check. The owner needs to invite team members *during* the onboarding before the salon goes live.

2. **Sync Registration Data to Salon Row**
   - **File:** `app/api/auth/register/route.ts` `[MODIFY]` (or the respective auth webhook handler capturing registrations)
   - Ensure the `b2b_name` and `category` from the sign-up form are properly passed to the `salons` table insert so they are available in `SalonProfile` step.

> ⚠️ **BE CAREFUL**:
> - We are relaxing the `is_active` check *only* for staff invites by the owner. It should still verify the `owner_id`.
> - Check that `app/api/auth/register/route.ts` (or equivalent) actually handles B2B metadata correctly.
> - **VERIFICATION:** Attempt to invite a staff member on an unactivated salon. Expect 201 Created. Run `git commit -m "fix(api): allow staff invites during onboarding"`.

✅ **DO:**
```typescript
  const { data: salon } = await supabase
    .from("salons")
    .select("id, name")
    .eq("owner_id", user.id)
    .single(); // Removed .eq("is_active", true)
```

❌ **DON'T:**
```typescript
  const { data: salon } = await supabase
    .from("salons") // Missing owner check!
    .single();
```

---

### Phase 2: Onboarding UI Components Fixes
We will systematically go through the setup steps and implement the requested UX changes.

1. **Setup Wizard Routing & Checklist Component**
   - **File:** `components/onboarding/SetupWizard.tsx` `[MODIFY]`
   - Pass `goTo` down as a render prop to children so the final `GoLiveStep` can trigger navigation.
   - **File:** `components/onboarding/steps/GoLiveStep.tsx` `[MODIFY]`
   - Make the checklist interactive. Clicking an uncompleted item should call `goTo(index)` to jump to that step.

2. **Opening Hours Break Times**
   - **File:** `components/onboarding/steps/OpeningHoursStep.tsx` `[MODIFY]`
   - Add optional `break_start` and `break_end` strings to the state configuration for each day. Update JSON payload handling appropriately.

3. **Salon Profile Image Upload & Refactoring**
   - **File:** `components/onboarding/steps/SalonProfileStep.tsx` `[MODIFY]`
   - Replace the `cover_photo_url` standard text input with a `SupabaseImageUpload` or standard file input + generic Storage upload function.
   - Remove `description_en` input. Instead, the PATCH endpoint should auto-translate the DE text.
   - Add a subtitle letting the user know the English description will be generated automatically.

4. **Payments Enforcement**
   - **File:** `components/onboarding/steps/PaymentsStep.tsx` `[MODIFY]`
   - Remove `at_salon` and `deposit` options. Set component state to strictly use `prepay`.
   - Update error states around Stripe Connect if it fails or gets blocked by browser pop-ups (e.g., wrap in a `try/catch` with a `toast.error`).

> ⚠️ **BE CAREFUL**:
> - This is Zone 3 (Dashboard Onboarding). Make sure form fields still look like standard V3 inputs.
> - For image upload, ensure it saves to the correct Supabase storage bucket (e.g., `salons`).
> - Do not break `SetupWizard` animation states when adding the `goTo` prop.
> - **VERIFICATION:** Test all setup screens. They must render without errors. Run `git commit -m "feat(ui): update onboarding steps configuration"`.

---

### Phase 3: AI Integrations (Auto-Translate & Suggestions)
We will add Gemini features to assist the salon owner.

1. **English Auto-translation on Profile Save**
   - **File:** `app/api/salons/[id]/route.ts` `[MODIFY]`
   - Update the `PATCH` handler. If `description_de` is provided and changed, use the `@google/genai` (or configured LLM provider) to generate an English translation and save it alongside to `description_en`.

2. **Gemini Service Suggestions Endpoint**
   - **File:** `app/api/services/suggestions/route.ts` `[NEW]`
   - Create a fast API route returning 5 standard localized service templates based on the salon's category.
   
3. **Display Suggestions in Services Step**
   - **File:** `components/onboarding/steps/ServicesStep.tsx` `[MODIFY]`
   - Fetch the new suggestions route on load.
   - Show them as pre-filled chips the user can click to instantly add (e.g., "Add: Women's Haircut — 60 min — 80 CHF").

> ⚠️ **BE CAREFUL**:
> - Make sure the AI call doesn't slow down the profile save significantly. Return early or background the task if possible, but blocking is acceptable during initial setup.
> - Handle empty categories gracefully for the suggestions.
> - **VERIFICATION:** Save a DE description and check DB for EN equivalent. Run `git commit -m "feat(ai): integrate auto-translate and service templates"`.

---

## 🧑 MANUAL PHASES

### Manual A: Stripe Configuration Verification
1. Login to the Stripe Dashboard.
2. Verify that your platform integration correctly generates account links.
3. If clicking "Bankkonto verknüpfen" fails in production, confirm that the live Stripe secret keys are configured in Vercel.

---

## DEPENDENCY ORDERING TABLE

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Database & Core API Fixes | Nothing |
| Phase 2 | 🤖 | Onboarding UI Components Fixes | Phase 1 |
| Phase 3 | 🤖 | AI Integrations | Phase 2 |
| Manual A | 🧑 | Stripe Configuration Verification | Nothing |

---
