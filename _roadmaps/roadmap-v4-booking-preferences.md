# Booking Preferences System

## 🔴 BREAKAGE RISK ASSESSMENT

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🟡 MEDIUM | DB migrations | Run `npx supabase db diff` carefully. `profiles` schema change must be compatible with existing records. |
| Phase 2 | 🔴 HIGH | Core Booking Flow | Adhere strictly to Zone 3 rules (No animations/No glass). |
| Phase 3 | 🟡 MEDIUM | i18n & Hydration | Translations must exist in all 4 locales. Missing translation breaks server rendering. |

---

## 🤖 CLAUDE CODE PHASES

### Phase 1: Database Schema & Type Updates
**Goal:** Add a `customer_preferences` JSONB column to the `profiles` table to store allergies, skin type, stylist gender, accessibility needs, language, and notes.

**Files to modify:**
- `[NEW]` `supabase/migrations/TIMESTAMP_add_customer_preferences.sql`
- `[MODIFY]` `lib/types.ts`
- `[MODIFY]` `lib/supabase.ts` (if relevant profile fetching exists)

**Steps:**
1. Create a Supabase migration to run:
   ```sql
   ALTER TABLE profiles ADD COLUMN customer_preferences JSONB DEFAULT '{}'::jsonb;
   ```
2. Update `lib/types.ts` to include the `CustomerPreferences` interface and map it to `profiles`.
3. Ensure Supabase CLI `db push` is executed.

> ⚠️ **BE CAREFUL**:
> - **DO NOT** mutate data types of existing columns. Only ADD `customer_preferences`.
> - **DO NOT** forget to update types. The entire feature relies on strict types.

✅ **DO:**
```typescript
export interface CustomerPreferences {
  allergies?: string;
  skinType?: string;
  stylistGender?: 'male' | 'female' | 'no-preference';
  accessibilityNeeds?: string;
  language?: string;
  notes?: string;
}
```

### Phase 2: Booking Flow Integration (Zone 3)
**Goal:** On first booking, prompt user to fill preferences ("Teile deine Präferenzen"). Auto-populate for new bookings. Show at booking confirmation.

**Files to modify:**
- `[MODIFY]` `app/[locale]/booking/page.tsx` (or equivalent booking wizard component)
- `[NEW]` `components/booking/CustomerPreferencesForm.tsx`

**Steps:**
1. Add a `CustomerPreferencesForm` step to the booking wizard.
2. Ensure the form captures: allergies, skin type, stylist gender, accessibility needs, language, and notes.
3. Automatically pre-fill the form with existing `customer_preferences` from `profiles`.
4. Render the preferences summary on the final booking confirmation card for the salon.

> ⚠️ **BE CAREFUL**:
> - **STRICT ZONE 3 COMPLIANCE:** The booking flow is strictly **Zone 3**. DO NOT use glassmorphism (Tier 1/2) here. DO NOT use sliding entry animations. 
> - **DO NOT** use default `rounded-lg` on inputs. Use `rounded-input` (12px) per UI_RULES.

✅ **DO:**
```tsx
// Using strict Zone 3 styling:
<div className="bg-s-bg-raised shadow-warm-lg rounded-card p-6">
  <input className="rounded-input border-s-ink/10..." />
</div>
```

### Phase 3: Profile Settings & Localization
**Goal:** Make preferences editable under "Meine Präferenzen" in the profile settings and strictly localize all Strings.

**Files to modify:**
- `[MODIFY]` `app/[locale]/profile/settings/page.tsx`
- `[NEW]` `components/profile/PreferencesSettingsForm.tsx`
- `[MODIFY]` `messages/de.json`, `en.json`, `fr.json`, `it.json`

**Steps:**
1. Add the settings form to the user profile layout.
2. Export and use the exact same form logic from the booking flow if possible, or build a dedicated Profile settings version.
3. **MANDATORY i18n**: Add keys like `booking.preferences.title`, `booking.preferences.allergies_label` to ALL locale JSON files.

> ⚠️ **BE CAREFUL**:
> - **DO NOT** hardcode "Teile deine Präferenzen" anywhere. Always use `t('preferences.title')`. Rule 37 from CLAUDE.md applies here.
> - **Verify** that saving preferences in the profile immediately updates the DB and future bookings.

✅ **DO:**
```tsx
const t = useTranslations('booking');
<h1>{t('preferences.title')}</h1> // Translation file handles "Teile deine Präferenzen"
```
❌ **DON'T:**
```tsx
<h1>Teile deine Präferenzen</h1> // FAILS RULE 33 (i18n)
```

---

## 📦 DEPENDENCY ORDERING

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Migration & DB Update | Nothing |
| Phase 2 | 🤖 | Booking Flow Integration | Phase 1 |
| Phase 3 | 🤖 | Settings & Localization | Phase 1 |

---

## 🛂 VERIFICATION STEPS
After execution, verify the following:
1. **Migration check**: Verify `profiles` table has `customer_preferences` JSONB column.
2. **Build check**: `npm run build` completes with 0 errors.
3. **Type check**: `npx tsc --noEmit` completes with 0 errors.
4. **Smoke test**: Book a service, ensure the preferences step appears.
5. **Localization test**: Switch language to EN, ensure the preferences form translates instantly.
6. **Zone rules check**: Ensure no elements use `backdrop-blur` or `shadow-teal` in the new booking step.
