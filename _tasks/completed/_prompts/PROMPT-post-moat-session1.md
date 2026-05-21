# 🔧 Post-MOAT Session 1: Registration Overhaul + Auth Overhaul

> **Agent Role:** Registration & Auth Agent
> **Estimated Time:** ~10h
> **Branch:** `main` (direct push)

---

## ⚠️ MULTI-AGENT SAFETY — READ FIRST

**You are running in PARALLEL with 2 other Claude Code sessions.**

### YOUR EXCLUSIVE FILE OWNERSHIP:
```
✅ YOU OWN (only you may edit):
  app/[locale]/onboarding/salon/page.tsx
  app/api/salons/route.ts
  app/api/translate/route.ts          [NEW]
  app/api/auth/login/route.ts
  app/api/auth/signup/route.ts        [NEW]
  app/api/auth/verify-otp/route.ts    [NEW]
  app/[locale]/login/page.tsx (or wherever login page lives)
  app/[locale]/signup/page.tsx (or wherever signup page lives)
  lib/service-templates.ts            [NEW]
  lib/registration-validation.ts      [NEW]
  components/ui/ImageUploader.tsx      [NEW]
```

### ❌ DO NOT TOUCH (owned by other sessions):
```
Session 2 owns:
  components/HomePage.tsx
  components/layout/Footer.tsx
  components/layout/BottomNav.tsx
  components/ChatWindow.tsx
  components/SalonCard.tsx
  tailwind.config.js
  lib/animations.ts

Session 3 owns:
  app/[locale]/dashboard/* (all dashboard pages)
  app/[locale]/salon/[slug]/page.tsx
  app/[locale]/bookings/*/page.tsx
  app/api/bookings/*.ts
  app/api/cron/*.ts (all cron routes)
  lib/google-calendar.ts
  lib/email-templates/*.ts
```

### SHARED FILES (coordinate via .agent-lock.json):
```
⚠️ LOCK BEFORE EDITING:
  supabase/migrations/*  — Use next available migration number
  package.json           — Lock, add deps, unlock immediately
  components/index.ts    — Lock, add exports, unlock immediately
```

### BEFORE YOU START:
1. Read `CLAUDE.md` completely
2. Read `.agent-lock.json` — check for conflicts
3. Add your lock entries for your files
4. Post in `.agent-comms.md`: "Session 1 starting: Registration Overhaul. Owns: onboarding/salon/page.tsx, api/salons, api/translate, lib/service-templates, lib/registration-validation, ImageUploader"

### AFTER EACH SUB-PHASE:
1. `npm run build` (MUST pass)
2. `git add [only your files]`
3. `git commit -m "post-moat-s1-X.Y: [desc]"`
4. `git push origin main`
5. Release locks on shared files
6. Post summary in `.agent-comms.md`

---

## Phase 1.1: AI-Powered Service Templates (~2h) 🔴

**Goal:** Pre-built service packages by salon category. Click to add, edit price, done.

### What We Want:
- When salon selects category (e.g., "Barbershop"), service step shows **pre-built templates**
- Templates organized by category, 8-10 per category, covering all 6 categories
- Each template: name_de, name_en, name_fr, name_it, duration, default price
- Salon clicks "Hinzufügen" → template becomes editable service in their list
- "Eigener Service erstellen" button for manual add still exists
- Templates are STATIC data in `lib/service-templates.ts` (NOT Gemini API calls)

### What We DON'T Want:
- ❌ Calling Gemini API on every registration (too slow, unreliable)
- ❌ Forcing a salon to use templates (manual add must always work)
- ❌ Templates without default prices
- ❌ Templates for categories the salon didn't select

### Files:
- **[NEW]** `lib/service-templates.ts` — all template data
- **[MODIFY]** `app/[locale]/onboarding/salon/page.tsx` — service step UI

### Implementation:

#### [NEW] `lib/service-templates.ts`
```typescript
export interface ServiceTemplate {
  name_de: string;
  name_en: string;
  name_fr: string;
  name_it: string;
  duration: number; // minutes
  price: number;    // CHF
  category: string;
}

export const serviceTemplates: Record<string, ServiceTemplate[]> = {
  barbershop: [
    { name_de: "Herrenschnitt", name_en: "Men's Haircut", name_fr: "Coupe homme", name_it: "Taglio uomo", duration: 30, price: 40, category: "barbershop" },
    { name_de: "Bart Trim", name_en: "Beard Trim", name_fr: "Taille de barbe", name_it: "Rifinitura barba", duration: 15, price: 20, category: "barbershop" },
    { name_de: "Fade + Bart Kombi", name_en: "Fade + Beard Combo", name_fr: "Dégradé + barbe", name_it: "Sfumatura + barba", duration: 45, price: 55, category: "barbershop" },
    { name_de: "Heisses Handtuch Rasur", name_en: "Hot Towel Shave", name_fr: "Rasage serviette chaude", name_it: "Rasatura asciugamano caldo", duration: 30, price: 45, category: "barbershop" },
    { name_de: "Kopf rasieren", name_en: "Head Shave", name_fr: "Rasage crâne", name_it: "Rasatura testa", duration: 20, price: 30, category: "barbershop" },
    { name_de: "Augenbrauen zupfen", name_en: "Eyebrow Grooming", name_fr: "Épilation sourcils", name_it: "Sistemazione sopracciglia", duration: 10, price: 15, category: "barbershop" },
    { name_de: "Kinder Haarschnitt", name_en: "Kids Haircut", name_fr: "Coupe enfant", name_it: "Taglio bambino", duration: 20, price: 25, category: "barbershop" },
    { name_de: "Waschen + Schneiden + Styling", name_en: "Wash + Cut + Style", name_fr: "Shampooing + coupe + coiffage", name_it: "Lavaggio + taglio + styling", duration: 45, price: 55, category: "barbershop" },
  ],
  coiffeur: [
    { name_de: "Waschen, Schneiden, Föhnen (Damen)", name_en: "Wash, Cut, Blow-Dry (Women)", name_fr: "Shampooing, coupe, brushing (femmes)", name_it: "Lavaggio, taglio, piega (donna)", duration: 60, price: 85, category: "coiffeur" },
    { name_de: "Waschen, Schneiden, Föhnen (Herren)", name_en: "Wash, Cut, Blow-Dry (Men)", name_fr: "Shampooing, coupe, brushing (hommes)", name_it: "Lavaggio, taglio, piega (uomo)", duration: 30, price: 45, category: "coiffeur" },
    { name_de: "Balayage", name_en: "Balayage", name_fr: "Balayage", name_it: "Balayage", duration: 120, price: 180, category: "coiffeur" },
    { name_de: "Strähnen (Folien)", name_en: "Highlights (Foils)", name_fr: "Mèches (papier)", name_it: "Colpi di sole (carta stagnola)", duration: 90, price: 150, category: "coiffeur" },
    { name_de: "Komplett Färbung", name_en: "Full Color", name_fr: "Coloration complète", name_it: "Colorazione completa", duration: 90, price: 120, category: "coiffeur" },
    { name_de: "Olaplex Behandlung", name_en: "Olaplex Treatment", name_fr: "Traitement Olaplex", name_it: "Trattamento Olaplex", duration: 30, price: 50, category: "coiffeur" },
    { name_de: "Hochsteckfrisur", name_en: "Updo / Special Occasion", name_fr: "Chignon / occasion spéciale", name_it: "Acconciatura / occasione speciale", duration: 60, price: 90, category: "coiffeur" },
    { name_de: "Kinderhaarschnitt", name_en: "Kids Haircut", name_fr: "Coupe enfant", name_it: "Taglio bambino", duration: 30, price: 35, category: "coiffeur" },
  ],
  nails: [
    { name_de: "Maniküre Klassisch", name_en: "Classic Manicure", name_fr: "Manucure classique", name_it: "Manicure classica", duration: 30, price: 40, category: "nails" },
    { name_de: "Maniküre mit Gel", name_en: "Gel Manicure", name_fr: "Manucure gel", name_it: "Manicure gel", duration: 45, price: 55, category: "nails" },
    { name_de: "Pediküre Klassisch", name_en: "Classic Pedicure", name_fr: "Pédicure classique", name_it: "Pedicure classica", duration: 45, price: 50, category: "nails" },
    { name_de: "Acryl Nagelverlängerung", name_en: "Acrylic Nail Extensions", name_fr: "Extensions ongles acrylique", name_it: "Estensioni unghie acrilico", duration: 90, price: 90, category: "nails" },
    { name_de: "Gel Auffüllung", name_en: "Gel Refill", name_fr: "Remplissage gel", name_it: "Ricostruzione gel", duration: 60, price: 65, category: "nails" },
    { name_de: "Nail Art (pro Nagel)", name_en: "Nail Art (per nail)", name_fr: "Nail art (par ongle)", name_it: "Nail art (per unghia)", duration: 10, price: 8, category: "nails" },
    { name_de: "Shellac Entfernung", name_en: "Shellac Removal", name_fr: "Retrait Shellac", name_it: "Rimozione Shellac", duration: 15, price: 15, category: "nails" },
    { name_de: "Mani + Pedi Kombi", name_en: "Mani + Pedi Combo", name_fr: "Manucure + pédicure combo", name_it: "Manicure + pedicure combo", duration: 75, price: 80, category: "nails" },
  ],
  spa: [
    { name_de: "Gesichtsbehandlung Klassisch", name_en: "Classic Facial", name_fr: "Soin du visage classique", name_it: "Trattamento viso classico", duration: 60, price: 90, category: "spa" },
    { name_de: "Rückenmassage", name_en: "Back Massage", name_fr: "Massage du dos", name_it: "Massaggio schiena", duration: 30, price: 60, category: "spa" },
    { name_de: "Ganzkörpermassage", name_en: "Full Body Massage", name_fr: "Massage complet", name_it: "Massaggio completo", duration: 60, price: 100, category: "spa" },
    { name_de: "Hot Stone Massage", name_en: "Hot Stone Massage", name_fr: "Massage pierres chaudes", name_it: "Massaggio pietre calde", duration: 60, price: 110, category: "spa" },
    { name_de: "Microneedling", name_en: "Microneedling", name_fr: "Microneedling", name_it: "Microneedling", duration: 45, price: 120, category: "spa" },
    { name_de: "Chemisches Peeling", name_en: "Chemical Peel", name_fr: "Peeling chimique", name_it: "Peeling chimico", duration: 30, price: 80, category: "spa" },
    { name_de: "Anti-Aging Behandlung", name_en: "Anti-Aging Treatment", name_fr: "Traitement anti-âge", name_it: "Trattamento anti-età", duration: 75, price: 140, category: "spa" },
    { name_de: "Lymphdrainage", name_en: "Lymphatic Drainage", name_fr: "Drainage lymphatique", name_it: "Drenaggio linfatico", duration: 60, price: 95, category: "spa" },
  ],
  makeup: [
    { name_de: "Tages-Makeup", name_en: "Day Makeup", name_fr: "Maquillage jour", name_it: "Trucco giorno", duration: 30, price: 50, category: "makeup" },
    { name_de: "Abend-Makeup", name_en: "Evening Makeup", name_fr: "Maquillage soirée", name_it: "Trucco sera", duration: 45, price: 70, category: "makeup" },
    { name_de: "Braut-Makeup", name_en: "Bridal Makeup", name_fr: "Maquillage mariée", name_it: "Trucco sposa", duration: 90, price: 180, category: "makeup" },
    { name_de: "Wimpernverlängerung", name_en: "Lash Extensions", name_fr: "Extensions cils", name_it: "Estensioni ciglia", duration: 90, price: 150, category: "makeup" },
    { name_de: "Wimpern Lifting", name_en: "Lash Lift", name_fr: "Rehaussement cils", name_it: "Laminazione ciglia", duration: 45, price: 65, category: "makeup" },
    { name_de: "Augenbrauen Microblading", name_en: "Eyebrow Microblading", name_fr: "Microblading sourcils", name_it: "Microblading sopracciglia", duration: 120, price: 350, category: "makeup" },
    { name_de: "Makeup Beratung", name_en: "Makeup Consultation", name_fr: "Consultation maquillage", name_it: "Consulenza trucco", duration: 30, price: 40, category: "makeup" },
    { name_de: "Wimpern Auffüllung", name_en: "Lash Refill", name_fr: "Remplissage cils", name_it: "Ricostruzione ciglia", duration: 60, price: 80, category: "makeup" },
  ],
  waxing: [
    { name_de: "Beine komplett", name_en: "Full Legs", name_fr: "Jambes complètes", name_it: "Gambe intere", duration: 30, price: 50, category: "waxing" },
    { name_de: "Bikinizone", name_en: "Bikini Line", name_fr: "Maillot classique", name_it: "Inguine classico", duration: 15, price: 25, category: "waxing" },
    { name_de: "Brazilian Waxing", name_en: "Brazilian Wax", name_fr: "Épilation brésilienne", name_it: "Ceretta brasiliana", duration: 30, price: 45, category: "waxing" },
    { name_de: "Achseln", name_en: "Underarms", name_fr: "Aisselles", name_it: "Ascelle", duration: 10, price: 15, category: "waxing" },
    { name_de: "Oberlippe", name_en: "Upper Lip", name_fr: "Lèvre supérieure", name_it: "Labbro superiore", duration: 10, price: 12, category: "waxing" },
    { name_de: "Rücken (Herren)", name_en: "Back (Men)", name_fr: "Dos (hommes)", name_it: "Schiena (uomini)", duration: 30, price: 45, category: "waxing" },
    { name_de: "Ganzkörper Paket", name_en: "Full Body Package", name_fr: "Forfait corps entier", name_it: "Pacchetto corpo intero", duration: 90, price: 140, category: "waxing" },
    { name_de: "Augenbrauen Waxing", name_en: "Eyebrow Wax", name_fr: "Épilation sourcils", name_it: "Ceretta sopracciglia", duration: 10, price: 15, category: "waxing" },
  ],
};
```

#### UI Design for Service Step:
- Show templates for the salon's selected categories in a 2-column grid (1 col mobile)
- Each template card: name_de (bold), duration in pill badge, price in Space Grotesk CHF format
- Green "+" IconButton on each card → adds to "Deine Services" list below
- Added services: editable inline (name, duration dropdown, price input), with ✏️ and 🗑️ buttons
- "Eigener Service erstellen" button at the bottom opens a clean form modal
- Duration dropdown options: 10, 15, 20, 30, 45, 60, 75, 90, 120, 150, 180 minutes

**DO:**
```tsx
// Showing templates filtered by salon categories
const selectedCategories = salonData.categories; // e.g., ["barbershop", "coiffeur"]
const availableTemplates = selectedCategories.flatMap(cat => serviceTemplates[cat] || []);
```

**DON'T:**
```tsx
// ❌ Showing ALL templates regardless of category
const allTemplates = Object.values(serviceTemplates).flat();
```

---

## Phase 1.2: Cover Photo Upload UX (~1h) 🔴

**Goal:** Replace URL text input with proper file picker.

### What We Want:
- Cover photo step shows a camera/gallery button (NOT a URL input)
- Tapping opens file dialog (desktop) or camera/gallery (mobile)
- Image preview immediately after selection
- Upload to Supabase Storage `salon-photos` bucket with progress bar
- Gallery photos (up to 5) also use file picker

### What We DON'T Want:
- ❌ URL text input (current broken behavior)
- ❌ Upload without preview (user must see before saving)
- ❌ No upload progress indicator
- ❌ Accepting non-image files (only jpeg/png/webp)

### Files:
- **[NEW]** `components/ui/ImageUploader.tsx`
- **[MODIFY]** `app/[locale]/onboarding/salon/page.tsx` — photo step

### Component:
```tsx
// ImageUploader.tsx — reusable image upload component
interface ImageUploaderProps {
  bucket: string;          // e.g., "salon-photos"
  onUpload: (url: string) => void;
  maxSizeMB?: number;      // default 5
  label?: string;
  currentImageUrl?: string; // for preview of existing image
}
// Renders: upload area with drag-and-drop zone, camera icon button, progress bar, preview
```

---

## Phase 1.3: Field Validation (~1h) 🟡

**Goal:** All required fields actually validate before allowing "Weiter".

### Files:
- **[NEW]** `lib/registration-validation.ts`
- **[MODIFY]** `app/[locale]/onboarding/salon/page.tsx`

### Zod Schemas:
```typescript
// lib/registration-validation.ts
import { z } from "zod";

export const step1Schema = z.object({
  name: z.string().min(2, "Name muss mindestens 2 Zeichen haben").max(100),
  email: z.string().email("Ungültige E-Mail-Adresse"),
  categories: z.array(z.string()).min(1, "Wähle mindestens eine Kategorie"),
});

export const step2Schema = z.object({
  address: z.string().min(5, "Adresse ist zu kurz"),
  postal_code: z.string().regex(/^\d{4}$/, "PLZ muss 4 Ziffern haben (z.B. 4001)"),
  city: z.string().min(2),
  quartier: z.string().min(1, "Wähle ein Quartier"),
});

export const step3Schema = z.object({
  services: z.array(z.object({
    name_de: z.string().min(2),
    duration: z.number().min(5).max(480),
    price: z.number().min(0),
  })).min(1, "Füge mindestens einen Service hinzu"),
});

export const step5Schema = z.object({
  description_de: z.string().min(20, "Beschreibung muss mindestens 20 Zeichen haben").max(500),
  cover_photo_url: z.string().url("Bitte lade ein Titelbild hoch"),
});
```

### UI:
- "Weiter" button grey/disabled until current step's schema validates
- Inline red error messages below each field (not alerts/popups)
- Live validation on blur (not on every keystroke)

---

## Phase 1.4: Auto-Translate Service Names (~1h) 🟡

**Goal:** Salon enters German service name → EN/FR/IT auto-filled via Gemini.

### Files:
- **[NEW]** `app/api/translate/route.ts`
- **[MODIFY]** `app/[locale]/onboarding/salon/page.tsx` — service name fields

### API Route:
```typescript
// POST /api/translate
// Body: { text: "Waschen, Schneiden, Föhnen", from: "de", to: ["en", "fr", "it"] }
// Response: { translations: { en: "Wash, Cut, Blow-Dry", fr: "Shampooing, coupe, brushing", it: "Lavaggio, taglio, piega" } }

// Uses Gemini 2.0 Flash:
const prompt = `Translate this salon/beauty service name. Return ONLY a JSON object with translations, no extra text.
Input (${from}): "${text}"
Output format: { "en": "...", "fr": "...", "it": "..." }`;
```

### UX:
- On blur of name_de input → debounce 500ms → call /api/translate → fill EN/FR/IT
- Show "🤖 Automatisch übersetzt" label in grey below auto-filled fields
- Salon can manually edit any translation
- If Gemini fails → leave blank (don't block registration)

---

## Phase 1.5: Break/Lunch Time in Availability (~1h) 🟡

**Goal:** Salons can define break times within their business hours.

### What We Want:
- Per-day: "Pause hinzufügen" button below business hours row
- Quick-add presets: "Mittagspause (12:00–13:00)" button
- Break row: start time picker → end time picker → 🗑️ remove button
- Multiple breaks per day allowed
- Breaks create gaps in generated availability slots

### What We DON'T Want:
- ❌ Breaks overlapping business hours start/end
- ❌ Break end before break start
- ❌ Generated slots during break times

### Files:
- **[MODIFY]** `app/[locale]/onboarding/salon/page.tsx` — availability step
- **[MODIFY]** `app/api/salons/route.ts` — slot generation excludes break times

---

## Phase 1.6: Simplify Staff Adding (~1h) 🟡

**Goal:** Clean card-based staff UX with pre-built role suggestions.

### What We Want:
- Pre-built role chips based on category: for Barbershop → "Barbier", "Junior Barbier"; for Coiffeur → "Stylist:in", "Colorist:in"
- Staff card: name + optional photo + role chip selector + specialties (chip selectors, NOT text input)
- "Nur ich" button for solo owners → creates single staff = owner
- Add multiple staff without page reload

### Files:
- **[MODIFY]** `app/[locale]/onboarding/salon/page.tsx` — staff step

---

## Phase 1.7: Email Required + Email Fix (~1h) 🟡

**Goal:** Registration requires email. Fix "already registered" blocking issue.

### What We Want:
- Step 1 requires valid email
- If user is Google OAuth → email pre-filled from auth
- If email already exists as customer → allow, upgrade role to salon_owner
- Don't create duplicate auth accounts

### Files:
- **[MODIFY]** `app/[locale]/onboarding/salon/page.tsx` — step 1
- **[MODIFY]** `app/api/salons/route.ts` — handle email + role upgrade

---

## Phase 1.8: Auth Overhaul — Password Login + OTP Verification (~2h) 🔴

**Goal:** Replace magic link auth with email+password. Add 6-digit OTP verification code on sign-up and sensitive actions. Emails from `noreply@solen.ch`.

> **RISK: 🔴 HIGH** — This changes the core auth flow. Test thoroughly. Don't break Google OAuth.

### Current State:
- `app/api/auth/login/route.ts` uses: Google OAuth + `signInWithOtp()` (magic link)
- No password-based auth exists
- No sign-up route exists (users just do magic link → auto-create)
- Resend is already configured with `noreply@solen.ch` as sender in `lib/booking-email.ts`

### What We Want:

#### A) Email + Password Sign-Up
- New sign-up page/flow: email + password (min 8 chars, one uppercase, one number)
- On submit → `supabase.auth.signUp({ email, password })` → sends 6-digit OTP verification code to email
- User enters 6-digit code → `supabase.auth.verifyOtp({ email, token, type: 'signup' })`
- After verification → redirect to onboarding (customer) or homepage
- All verification emails come from `noreply@solen.ch` (configure in Supabase Dashboard → Auth → SMTP)

#### B) Email + Password Login
- Replace magic link with: `supabase.auth.signInWithPassword({ email, password })`
- Keep Google OAuth as primary option (large button), email+password as secondary
- "Passwort vergessen?" link → `supabase.auth.resetPasswordForEmail({ email })` → sends reset link
- After login → check if email is verified, if not → ask for OTP code

#### C) OTP Verification on Sensitive Actions
- Changing email: requires OTP confirmation
- Deleting account: requires OTP or password re-entry
- Salon registration completion: verify email first if not already verified

### What We DON'T Want:
- ❌ Breaking Google OAuth (keep it as-is, primary method)
- ❌ Magic links (remove `signInWithOtp` from login)
- ❌ Unverified email accounts completing registration
- ❌ Weak passwords (enforce min 8 chars, 1 uppercase, 1 number)
- ❌ Sending emails from `onboarding@supabase.io` (must be `noreply@solen.ch`)

### Files:
- **[MODIFY]** `app/api/auth/login/route.ts` — replace magic link with password login
- **[NEW]** `app/api/auth/signup/route.ts` — email+password sign-up with OTP
- **[NEW]** `app/api/auth/verify-otp/route.ts` — verify 6-digit code
- **[MODIFY]** Login page (find in `app/[locale]/login/` or `src/spa_pages/auth/`) — new UI: email, password, verify code

### Login Page UI Design:
```
┌─────────────────────────────┐
│    [Solen Logo]              │
│                              │
│  ┌──────────────────────────┐│
│  │ 🔵 Mit Google anmelden   ││  ← Large, primary
│  └──────────────────────────┘│
│                              │
│  ────── oder ──────          │
│                              │
│  E-Mail: [_______________]   │
│  Passwort: [_____________]   │
│                              │
│  [     Anmelden      ]       │  ← Teal button
│                              │
│  Passwort vergessen?         │  ← Link
│                              │
│  Noch kein Konto?            │
│  [  Registrieren  ]          │  ← Link to signup
│                              │
│  (Glassmorphism card)        │
└─────────────────────────────┘
```

### Sign-Up Page UI Design:
```
┌─────────────────────────────┐
│    [Solen Logo]              │
│    Konto erstellen           │
│                              │
│  ┌──────────────────────────┐│
│  │ 🔵 Mit Google anmelden   ││
│  └──────────────────────────┘│
│                              │
│  ────── oder ──────          │
│                              │
│  E-Mail: [_______________]   │
│  Passwort: [_____________]   │
│  Passwort bestätigen: [___]  │
│                              │
│  [   Registrieren    ]       │
│                              │
│  → sends OTP → shows:       │
│                              │
│  Bestätigungscode:           │
│  [ _ ] [ _ ] [ _ ] [ _ ] [ _ ] [ _ ]  ← 6 boxes
│                              │
│  "Code an xyz@mail.com gesendet" │
│  [  Bestätigen  ]            │
│                              │
│  Bereits registriert?        │
│  [  Anmelden  ]              │
└─────────────────────────────┘
```

### Implementation:
```typescript
// app/api/auth/signup/route.ts
export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  // Validate
  const passwordSchema = z.string()
    .min(8, "Mindestens 8 Zeichen")
    .regex(/[A-Z]/, "Mindestens ein Grossbuchstabe")
    .regex(/[0-9]/, "Mindestens eine Zahl");

  // Sign up → triggers Supabase to send OTP code
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Supabase sends verification email via configured SMTP (noreply@solen.ch)
      emailRedirectTo: `${origin}/api/auth/callback`,
    },
  });
  // Return success → frontend shows OTP input
}

// app/api/auth/verify-otp/route.ts
export async function POST(req: NextRequest) {
  const { email, token } = await req.json();
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'signup',
  });
  // On success → user is verified, redirect to appropriate page
}

// app/api/auth/login/route.ts (MODIFIED)
export async function POST(req: NextRequest) {
  // Google OAuth — KEEP AS-IS
  if (body.provider === "google") { /* ... same ... */ }

  // Email + Password — REPLACE magic link
  if (body.email && body.password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });
    if (error) return NextResponse.json({ message: error.message }, { status: 400 });
    return NextResponse.json({ session: data.session });
  }

  // Password reset
  if (body.email && body.resetPassword) {
    await supabase.auth.resetPasswordForEmail(body.email, {
      redirectTo: `${origin}/de/reset-password`,
    });
    return NextResponse.json({ message: "Reset link sent" });
  }
}
```

### ⚠️ MANUAL STEP (User will do separately):
Configure Supabase SMTP so emails come from `noreply@solen.ch`:
- Supabase Dashboard → Auth → SMTP Settings → Enable custom SMTP
- Use Resend SMTP: `smtp.resend.com`, port 465
- Username: `resend`
- Password: Resend API key
- Sender: `noreply@solen.ch`

> Claude Code should NOT try to configure SMTP. Just build the code. The manual SMTP config is in `MANUAL-setup-checklist.md`.

---

## Verify All Phase 1:
```bash
# Registration test:
# 1. Start salon registration with "Barbershop" category
# 2. Verify: AI templates appear (Herrenschnitt, Bart Trim, etc.)
# 3. Click "+" on 3 templates → they appear in service list, editable
# 4. Add 1 custom service manually → works
# 5. Upload cover photo from device → preview shows, uploaded to Supabase
# 6. Try "Weiter" with empty Pflichtfeld fields → blocked, red errors shown
# 7. Enter German service name → EN/FR/IT auto-translated
# 8. Set business hours 09:00-18:00 → add lunch break 12:00-13:00
# 9. Check generated slots → no slots during 12:00-13:00
# 10. Add staff member "Nur ich" → solo mode works
# 11. Complete registration → salon pending in admin

# Auth test:
# 12. Visit /login → see Google button + email/password form
# 13. Click "Registrieren" → signup page with email/password
# 14. Sign up → get 6-digit code in email
# 15. Enter code → verified, redirected
# 16. Log out → log in with email + password → works
# 17. Google OAuth still works (CRITICAL — don't break this)
# 18. "Passwort vergessen?" → sends reset link
npm run build && git push origin main
```

**POST in `.agent-comms.md` when done:**
```
## Session 1 Complete
- Registration overhaul: AI templates, photo upload, validation, auto-translate, breaks, staff UX, email fix
- Auth overhaul: password login replaces magic link, 6-digit OTP verification, signup flow
- Google OAuth preserved (unchanged)
- Files modified: onboarding/salon/page.tsx, api/salons/route.ts, api/auth/login/route.ts
- Files created: lib/service-templates.ts, lib/registration-validation.ts, components/ui/ImageUploader.tsx, api/auth/signup/route.ts, api/auth/verify-otp/route.ts
- No DB migrations (auth handled by Supabase built-in)
- Build passes ✅
```
