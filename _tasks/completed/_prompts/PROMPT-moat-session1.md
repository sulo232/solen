# Moat Session 1 — v5 Fixes + Chat Intelligence + CRM Tags

## Who You Are
You are Claude Code, Session 1 of 3 for the Solen Moat Features roadmap.
- **Session 1 (YOU):** Fix v5 gaps + build bug, then build chat intelligence + client CRM tags
- **Session 2 (RUNNING IN PARALLEL):** Solen Score + gold map pins, map enhancement, compare + off-peak
- **Session 3 (RUNNING IN PARALLEL):** Loyalty stamp UX, feature showcase, "Nur bei Solen" badges, accessibility

## ⚡ PARALLEL EXECUTION — ALL 3 SESSIONS RUN SIMULTANEOUSLY

### YOUR EXCLUSIVE FILES (ONLY YOU may modify these):
- `components/ChatWindow.tsx` — you add tabs, photo quoting, chips
- `components/chat/*` — ALL NEW files, you create
- `components/dashboard/ClientTags.tsx` — NEW, you create
- `app/api/chat-templates/route.ts` — NEW
- `app/api/chat/suggest/route.ts` — NEW
- `app/api/client-tags/route.ts` — NEW
- `app/[locale]/dashboard/settings/page.tsx` — you add payment mode + chat templates
- `app/[locale]/dashboard/bookings/page.tsx` — you add allergy banner + stamp info
- `app/[locale]/checkout/page.tsx` — you add Stripe fallback
- `app/api/conversations/[id]/price-offer/route.ts` — you add inspiration_photo_url
- Migrations: 054, 056, 057, 058

### DO NOT TOUCH (Session 2 owns these):
- `components/MapView.tsx`
- `components/CompareDrawer.tsx`
- `components/dashboard/SolenScoreCard.tsx`
- `app/api/admin/solen-score/`
- `app/[locale]/salon/[slug]/page.tsx`
- `vercel.json`
- Migration 059

### DO NOT TOUCH (Session 3 owns these):
- `components/SalonCard.tsx` — Session 3 adds ALL new props
- `components/loyalty/StampCard.tsx`
- `components/ui/SolenExclusiveBadge.tsx`
- `components/TutorialTour.tsx`
- `app/[locale]/warum-solen/page.tsx`
- `app/[locale]/profile/page.tsx` OR `app/[locale]/account/page.tsx`
- `app/globals.css` (focus rings + animations)
- `Header.tsx`, `BottomNav.tsx`, `FilterBar.tsx`, `BookingCalendar.tsx`, `CookieBanner.tsx` (aria-labels)

### GIT RULES FOR PARALLEL EXECUTION
1. **Work on branch:** `git checkout -b moat/session1`
2. Commit frequently (after each phase)
3. Do NOT push to `main` directly
4. Do NOT run `git pull` during work
5. When DONE: `git push origin moat/session1`
6. User will merge all 3 branches into main after all sessions finish

## Pre-Flight
1. `git checkout -b moat/session1` — CREATE YOUR BRANCH
2. Read `CLAUDE.md` fully — Sections 3, 5, 6, 10, 12
3. Read `UI_RULES.md` fully
4. Fix node_modules if needed: `rm -rf node_modules && npm install`
5. `npm run build` — MUST pass before you touch code
6. Note commit hash: `git rev-parse HEAD`

## 🚨 CRITICAL SAFETY RULES
1. NEVER modify files in DO NOT TOUCH sections above.
2. NEVER rebuild or restructure existing components. Only ADD.
3. NEVER delete files or code.
4. NEVER change the design system.
5. BEFORE EVERY commit: `npm run build` + `npx tsc --noEmit`
6. ONE COMMIT per phase.
7. If build fails 3x → stash, note in INCOMPLETE_FEATURES.md, move on.

---

## Phase FIX: v5 Gaps + Build Bug (~2h)

### ⚠️ RISK: MEDIUM
Touches dashboard settings (already modified by v5), checkout flow, and global styles.

### ✅ WHAT WE WANT
- Clean build passing without errors
- Missing migration 054 created (notification preferences expansion)
- Payment mode radio buttons visible and functional in dashboard settings
- Checkout gracefully handles missing Stripe keys

### ❌ WHAT WE DON'T WANT
- Don't restructure the dashboard settings page — ONLY ADD the payment mode section
- Don't add Stripe API calls if `STRIPE_SECRET_KEY` is not in env — show "Zahlung im Salon" fallback
- Don't touch SalonCard.tsx, globals.css, Header.tsx, BottomNav.tsx (Session 3 owns those)

### 🔧 BE CAREFUL
- Dashboard settings page (`app/[locale]/dashboard/settings/page.tsx`) was modified by v5 multiple times. READ THE ENTIRE FILE before touching it. Find where to add the payment mode section.
- The `notification_preferences` table already exists (from a previous migration). Your migration 054 should be `ALTER TABLE`, not `CREATE TABLE`. Check if columns already exist with `ADD COLUMN IF NOT EXISTS`.
- `globals.css` may already have focus styles — check before adding duplicates.

### Steps

#### FIX.1 — Fix Build
```bash
rm -rf node_modules
npm install
npm run build
```
If build still fails with Turbopack error:
```bash
rm -rf .next node_modules
npm install
npx next build
```
If STILL fails → check `next.config.js` or `next.config.mjs` for `experimental.turbo` setting. Try removing it temporarily.

✅ **DONE when:** `npm run build` exits with 0.

#### FIX.2 — Create Migration 054
1. Create file: `supabase/migrations/054_notification_prefs_expansion.sql`
2. Content:
```sql
-- Expand notification preferences with granular controls
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS messages_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS deals_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS new_salons_enabled boolean DEFAULT false;

COMMENT ON COLUMN notification_preferences.messages_enabled IS 'Receive email when new chat message arrives';
COMMENT ON COLUMN notification_preferences.deals_enabled IS 'Receive email about deals from favorited salons';
COMMENT ON COLUMN notification_preferences.new_salons_enabled IS 'Receive email when new salons open in your area';
```

✅ **DONE when:** Migration file exists with correct SQL.

#### FIX.3 — Wire Payment Mode UI in Dashboard Settings
1. Open `app/[locale]/dashboard/settings/page.tsx` — READ IT FULLY
2. Find where salon settings are displayed (probably a form with sections)
3. ADD a new section "Zahlungseinstellungen" with:
   - Label: "Zahlungsmodus"
   - 3 radio buttons:
     - `at_salon` (default): "Zahlung im Salon — Kunde zahlt vor Ort"
     - `deposit`: "Anzahlung — Kunde zahlt X% vorab online"
     - `prepay`: "Vorauszahlung — Kunde zahlt 100% vorab online"
   - If `deposit` selected → show a slider or number input: "Anzahlung in %" (range 5-100, default 20%)
   - A "Speichern" button that PATCHes `salons` table with `payment_mode` + `deposit_percent`
4. Style: use existing dashboard form styling. Teal radio buttons. Consistent spacing.
5. Load current values from `salons.payment_mode` and `salons.deposit_percent` (columns exist from migration 047)

✅ **DONE when:** Dashboard settings shows payment mode radio buttons and saves correctly.

#### FIX.4 — Graceful Stripe Fallback in Checkout
1. Find the checkout page/component: likely `app/[locale]/checkout/page.tsx`
2. READ IT FULLY
3. Check if it already handles missing Stripe keys
4. If not: wrap the Stripe payment form in a conditional:
   - If `process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` exists AND salon's `payment_mode !== 'at_salon'` → show Stripe form
   - Otherwise → show simple confirmation: "Zahlung beim Termin im Salon" with a checkmark icon
5. Don't break any existing Stripe logic — just add the fallback path

✅ **DONE when:** Checkout works without Stripe keys configured.

→ `git add . && git commit -m "moat-session1-fix: build fix + payment mode UI" && git push origin moat/session1`

---

## Phase M1: Chat Intelligence (~3h)

### ⚠️ RISK: MEDIUM
Modifies `ChatWindow.tsx` — the core communication component. This is a HIGH-VALUE feature.

### ✅ WHAT WE WANT
- Quick-reply template chips below message input on SALON SIDE ONLY
- AI-suggested reply banner above message input (uses Gemini via `GEMINI_API_KEY`)
- Photo-based quoting: customer sends photo → salon taps "📸 Angebot erstellen" → opens price offer form linked to that photo
- Photo gallery tab in chat header: "💬 Chat | 📸 Fotos" — grid of all shared photos

### ❌ WHAT WE DON'T WANT
- **DON'T rebuild ChatWindow.tsx from scratch** — it's a complex component. Only ADD child components.
- **DON'T call Gemini API on every keystroke** — only when a new customer message arrives and salon is viewing the chat
- **DON'T make AI suggestions mandatory** — it's a helpful hint, salon can ignore or dismiss
- **DON'T show quick-reply chips on customer side** — salon-only feature
- **DON'T slow down the chat** — no heavy API calls blocking message display
- If `GEMINI_API_KEY` not in env → skip AI suggestion entirely, don't show error

### 🔧 BE CAREFUL
- `ChatWindow.tsx` has complex state management (messages, typing indicators, read receipts). READ THE ENTIRE FILE before modifying. Understand the state flow.
- The price offers API already exists at `app/api/conversations/[id]/price-offer/route.ts`. Only ADD the `inspiration_photo_url` field to the request body and DB insert. Don't change existing fields.
- Photo messages: check how photos are currently rendered in ChatWindow. There's likely a message_type === 'image' or similar check. Add the "Angebot erstellen" button inside that conditional.
- For the gallery tab: don't unmount the chat when switching to gallery — use `display: none` toggle so chat scroll position is preserved.
- Template chips: the salon might have custom templates (DB) or just defaults. Fetch from DB first, fall back to hardcoded defaults if empty.

### Steps

#### M1.1 — Migration 056: Chat Templates Table
1. Create `supabase/migrations/056_chat_templates.sql`:
```sql
CREATE TABLE IF NOT EXISTS chat_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  text text NOT NULL,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- RLS: salon owner manages their own templates
ALTER TABLE chat_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "salon_owner_manage_templates" ON chat_templates
  FOR ALL USING (
    salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  );

CREATE INDEX idx_chat_templates_salon ON chat_templates(salon_id);
```

#### M1.2 — Migration 057: Photo Link on Price Offers
1. Create `supabase/migrations/057_price_offer_photo.sql`:
```sql
ALTER TABLE price_offers
  ADD COLUMN IF NOT EXISTS inspiration_photo_url text;

COMMENT ON COLUMN price_offers.inspiration_photo_url IS 'URL to customer photo that inspired this price offer';
```

#### M1.3 — API: Chat Templates CRUD
1. Create `app/api/chat-templates/route.ts`:
   - **GET**: `supabase.from('chat_templates').select('*').eq('salon_id', salonId).order('sort_order')` → return templates array
   - **POST**: body `{ text: string }` → insert new template with auto sort_order
   - **DELETE**: body `{ id: string }` → delete template by ID
   - Auth check: verify user is the salon owner
   - Rate limit: `generalLimiter`
   - Validate body with Zod: `z.object({ text: z.string().min(1).max(200) })`

2. Default templates if salon has none (return these as fallback in GET response):
```typescript
const DEFAULT_TEMPLATES = [
  "Ja, das machen wir! ✓",
  "Leider gerade ausgebucht 😔",
  "Gerne, schick mir ein Foto!",
  "Wir bestätigen deinen Termin!",
  "Preis auf Anfrage — welche Behandlung?"
];
```

#### M1.4 — API: Gemini AI Suggestion
1. Create `app/api/chat/suggest/route.ts`:
   - **POST** body: `{ customerMessage: string, salonName: string, salonServices: string[] }`
   - Check `process.env.GEMINI_API_KEY` — if missing, return `204 No Content` immediately
   - Call Gemini Flash API:
```typescript
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `Du bist ein freundlicher Assistent für den Salon "${salonName}". 
Der Salon bietet folgende Services an: ${salonServices.join(', ')}.
Ein Kunde hat folgende Nachricht geschrieben: "${customerMessage}"
Antworte kurz, freundlich und professionell auf Deutsch. Maximal 2 Sätze.`
        }]
      }]
    })
  }
);
```
   - Return: `{ suggestion: string }` or `204` if no key
   - Rate limit: max 20 requests/day per salon (use Upstash if available, otherwise simple in-memory counter)
   - Cache: don't re-suggest for the same customer message

#### M1.5 — Component: QuickReplyChips
1. Create `components/chat/QuickReplyChips.tsx`:
```
Props: {
  salonId: string;
  onSelectTemplate: (text: string) => void;  // inserts text into message input
}
```
2. Fetch templates from `/api/chat-templates?salon_id=X`
3. If empty → show DEFAULT_TEMPLATES
4. Render: horizontal scrollable container with teal pill buttons
   - Each chip: `px-3 py-1.5 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-sm whitespace-nowrap cursor-pointer hover:bg-teal-100 dark:hover:bg-teal-800/50 transition-colors`
5. On tap → call `onSelectTemplate(text)` — this fills the message input (editable before send)
6. Overflow: `overflow-x-auto flex gap-2 scrollbar-hide`

#### M1.6 — Component: AISuggestion
1. Create `components/chat/AISuggestion.tsx`:
```
Props: {
  conversationId: string;
  salonName: string;
  salonServices: string[];
  lastCustomerMessage: string | null;
  onAccept: (text: string) => void;
  visible: boolean;
}
```
2. When `lastCustomerMessage` changes → debounce 1s → fetch `/api/chat/suggest`
3. Show banner above message input:
   - Background: `bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3`
   - Text: "💡 Vorgeschlagene Antwort: [suggestion text]"
   - Two buttons: ✓ (accept → fills input) and ✗ (dismiss → hides banner)
4. If API returns 204 or fetch fails → don't show banner (hide quietly)
5. Loading state: show small spinner while fetching

#### M1.7 — Photo-Based Quoting
1. Open `ChatWindow.tsx` — find where photo/image messages are rendered
2. Look for condition like `message.message_type === 'image'` or similar
3. Inside that render block, ADD (salon side only):
```tsx
{isSalonOwner && (
  <button
    onClick={() => handleCreatePhotoOffer(message.content)}
    className="mt-1 text-xs text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
    aria-label="Angebot für dieses Foto erstellen"
  >
    📸 Angebot erstellen
  </button>
)}
```
4. `handleCreatePhotoOffer(photoUrl)` should:
   - Open the existing price offer modal/form
   - Pre-fill `inspiration_photo_url` with the photo URL
   - The price offer form submits to the existing API, now including the new field

5. Modify `app/api/conversations/[id]/price-offer/route.ts`:
   - In the POST handler: accept `inspiration_photo_url` in the request body (optional field)
   - Pass it to the Supabase insert
   - ⚠️ READ the existing route fully. Don't change any existing validation or fields.

6. In the price offer display card (where accepted/pending offers show in chat):
   - If `inspiration_photo_url` exists → show a small 40x40 thumbnail next to offer details

#### M1.8 — Photo Gallery Tab
1. Create `components/chat/PhotoGallery.tsx`:
```
Props: {
  conversationId: string;
}
```
2. Fetch all messages where `message_type === 'image'` for this conversation
3. Display as a responsive grid: `grid grid-cols-3 gap-2`
4. Each photo: thumbnail with rounded corners, click → fullscreen lightbox
   - Lightbox: `fixed inset-0 z-50 bg-black/80 flex items-center justify-center`
   - Close button top-right
   - If salon owner: "📸 Angebot erstellen" button in lightbox footer
5. Empty state: "📷 Noch keine Fotos geteilt" centered text

6. In `ChatWindow.tsx` — add tab bar at the top:
```tsx
<div className="flex border-b border-gray-200 dark:border-gray-700">
  <button
    onClick={() => setActiveTab('chat')}
    className={`flex-1 py-2 text-sm font-medium ${activeTab === 'chat' ? 'text-teal-600 border-b-2 border-teal-500' : 'text-gray-500'}`}
  >
    💬 Chat
  </button>
  <button
    onClick={() => setActiveTab('photos')}
    className={`flex-1 py-2 text-sm font-medium ${activeTab === 'photos' ? 'text-teal-600 border-b-2 border-teal-500' : 'text-gray-500'}`}
  >
    📸 Fotos
  </button>
</div>
```
- Use `display: none` toggle, NOT conditional rendering, to preserve chat scroll position

#### M1.9 — Dashboard Settings: Chat Templates
1. Open dashboard settings page
2. ADD a new section "Chat-Vorlagen":
   - List of current templates (from API) with delete (✗) button on each
   - Input field + "Hinzufügen" button to add new template
   - Max 10 templates per salon
   - Drag-to-reorder (or simple up/down arrows for sort_order)

→ `git add . && git commit -m "moat-phase1: chat intelligence (templates + AI + photo-quoting + gallery)" && git push`
→ Wait 60s → curl check → verify: open a chat, see template chips below input

---

## Phase M2: Client CRM Tags (~2h)

### ⚠️ RISK: LOW
New table + new component. Minimal modification of existing dashboard code.

### ✅ WHAT WE WANT
- Quick-tags on client notes: "⚠️ Keine Ammoniak", "⚠️ Empfindliche Haut", "⚠️ Latexallergie", "Mag Stille", "Mag Gespräch"
- Tags color-coded: RED for allergies (⚠️ danger), BLUE for preferences, GREY for notes
- ⚠️ RED WARNING BANNER on dashboard booking detail page when client has ANY allergy tags
- Small ⚠️ icon next to client name in the booking list table/grid

### ❌ WHAT WE DON'T WANT
- **Don't replace existing `client_notes` feature** — tags are ADDITIONAL to freeform text notes
- **Don't show allergy tags to CUSTOMERS** — this is private salon data
- **Don't make tags required** — they're optional quality-of-life helpers for salon owners
- **Don't show the tag management UI on the customer-facing profile page** — dashboard only

### 🔧 BE CAREFUL
- The client notes feature already exists (migration 040, `app/api/client-notes/route.ts`). Don't duplicate it. Tags are a SEPARATE feature that appears alongside notes.
- Dashboard booking detail page: find the exact file. It could be `app/[locale]/dashboard/bookings/page.tsx` with a modal, or a separate page. Grep for it.
- RLS policies: client_tags should only be visible to the salon that created them. NOT to the customer. NOT to other salons.

### Steps

#### M2.1 — Migration 058: Client Tags Table
1. Create `supabase/migrations/058_client_tags.sql`:
```sql
CREATE TABLE IF NOT EXISTS client_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tag text NOT NULL,
  tag_type text NOT NULL CHECK (tag_type IN ('allergy', 'preference', 'note')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(salon_id, customer_id, tag)
);

ALTER TABLE client_tags ENABLE ROW LEVEL SECURITY;

-- Salon owner can manage tags for their clients
CREATE POLICY "salon_owner_manage_client_tags" ON client_tags
  FOR ALL USING (
    salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  );

CREATE INDEX idx_client_tags_lookup ON client_tags(salon_id, customer_id);
CREATE INDEX idx_client_tags_allergy ON client_tags(salon_id, customer_id) WHERE tag_type = 'allergy';
```

#### M2.2 — API: Client Tags CRUD
1. Create `app/api/client-tags/route.ts`:
   - **GET**: `?salon_id=X&customer_id=Y` → return all tags for that client at that salon
   - **POST**: body `{ salon_id, customer_id, tag, tag_type }` → insert tag
   - **DELETE**: body `{ id }` → delete tag by ID
   - Auth: verify user is the salon owner
   - Validate: Zod schema with `tag_type` enum and `tag` string max 50 chars

#### M2.3 — Component: ClientTags
1. Create `components/dashboard/ClientTags.tsx`:
```
Props: {
  salonId: string;
  customerId: string;
  compact?: boolean;  // true = just show chips, false = show chips + add UI
}
```
2. Fetch tags from API on mount
3. Display as colored chips:
   - Allergy: `bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-300` with "⚠️" prefix
   - Preference: `bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-300`
   - Note: `bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-300`
4. Each chip has a ✗ delete button (on hover/tap)
5. If `compact === false`:
   - Show "Tag hinzufügen" button → dropdown with presets:
     - Allergies: "Keine Ammoniak", "Empfindliche Haut", "Latexallergie", "Schwanger", "Metallalergie"
     - Preferences: "Mag Stille", "Mag Gespräch", "Bevorzugt Fensterplatz", "Kommt immer 5min spät"
   - Plus custom text input with tag_type selector
6. All styling must work in dark mode

#### M2.4 — Booking Detail: Allergy Warning Banner
1. Find the dashboard booking detail view. Grep: `grep -rn "booking.*detail\|BookingDetail\|booking-detail" app/ components/ --include="*.tsx" | head -20`
2. At the TOP of the booking detail (before any other content), query client_tags:
```typescript
const { data: allergyTags } = await supabase
  .from('client_tags')
  .select('tag')
  .eq('salon_id', salonId)
  .eq('customer_id', booking.user_id)
  .eq('tag_type', 'allergy');
```
3. If any allergy tags exist → show warning banner:
```tsx
{allergyTags && allergyTags.length > 0 && (
  <div className="bg-red-50 dark:bg-red-950 border-l-4 border-red-500 p-4 mb-4 rounded-r-lg">
    <div className="flex items-center gap-2">
      <span className="text-red-600 text-lg">⚠️</span>
      <div>
        <p className="font-semibold text-red-800 dark:text-red-200">Achtung — Allergien</p>
        <p className="text-red-700 dark:text-red-300 text-sm">
          {allergyTags.map(t => t.tag).join(', ')}
        </p>
      </div>
    </div>
  </div>
)}
```

#### M2.5 — Booking List: Warning Icon
1. Find the dashboard booking list component/page
2. For each booking row, check if the customer has allergy tags (you can batch-query all customer IDs)
3. If customer has any allergy tags → show small `⚠️` icon next to customer name:
```tsx
<span className="text-red-500 text-xs ml-1" title="Allergien vorhanden">⚠️</span>
```
4. Don't fetch per-row — batch query all unique customer IDs from today's bookings, then create a Set of IDs with allergies

→ `git add . && git commit -m "moat-phase2: client CRM tags (allergy warnings + preference chips)" && git push`
→ Verify: open dashboard → booking detail → see allergy banner

---

## Post-Session 1
```bash
npm run build && npx tsc --noEmit
git push origin moat/session1
```

Tell the user: "Session 1 complete. Branch `moat/session1` pushed. Ready to merge."

You are DONE after Phase M2. Do NOT start other phases. Do NOT merge to main.
