# solen.ch Discovery Platform — v2 + v3 Roadmap

> **Prerequisite**: v1 (`_tasks/roadmap-discovery.md`) must be fully deployed first.
> v2 depends on TikTok Login Kit approval. v3 depends on Content Posting API + Data Portability API.

---

## Overview

| Version | What | Depends On | Cost |
|---|---|---|---|
| **v2** | TikTok Login, Creator badges, Social booking intel | TikTok Login Kit approval (2-4 weeks) | $0 |
| **v3a** | Auto-sync salon TikTok, Stylist portfolios, Post-booking prompt | TikTok Content Posting API approval | $0 |
| **v3b** | Taste profile, Smart defaults, "You might like" AI recs | TikTok Data Portability API (strictest) | $0 |

---

## R1: BREAKAGE RISK ASSESSMENT

| Phase | Risk | Could Break | Prevention |
|---|---|---|---|
| Manual 1 | 🟢 SAFE | Nothing | TikTok dev portal only |
| v2 Phase 1 | 🟢 SAFE | Nothing | New lib files, new API routes |
| v2 Phase 2 | 🟡 MEDIUM | Auth flow | Adding TikTok as auth provider. Test login/register flow thoroughly. |
| v2 Phase 3 | 🟢 SAFE | Nothing | New components only |
| v3a Phase 1 | 🟡 MEDIUM | Salon dashboard | Adding TikTok sync settings to salon settings page |
| v3b Phase 1 | 🟢 SAFE | Nothing | New lib + API routes only |

---

# 🧑 MANUAL STEPS

### Manual 1 — TikTok Login Kit ✅ Already in v1 Roadmap Step 5

If you already submitted from v1 Step 5, check your email for approval. Once approved:

1. Go to [developers.tiktok.com](https://developers.tiktok.com/) → your app `solen-ch`
2. Click your app → **"Login Kit"** should show **"Approved"** (green)
3. Copy **Client Key** and **Client Secret** from the top of the app dashboard
4. Go to Vercel → Settings → Environment Variables
5. Add for **Production + Preview + Development**:
   - `TIKTOK_CLIENT_KEY` = (your Client Key)
   - `TIKTOK_CLIENT_SECRET` = (your Client Secret)

### Manual 2 — TikTok Content Posting API (For v3a)

> Only do this when you're ready for v3a.

1. Go to [developers.tiktok.com](https://developers.tiktok.com/) → your app `solen-ch`
2. Click **"Add products"** in the left sidebar
3. Find **"Content Posting API"** → click **"Add"**
4. Fill in the use case form:
   - Use case: `Salons share their latest work (with permission) from their TikTok to their solen.ch profile`
   - Content type: **Video**
   - User consent: **Yes — users explicitly connect their TikTok in salon settings**
5. Click **"Submit for review"**
6. Wait for approval email (can take 2-6 weeks)
7. No new env vars needed — uses the same Client Key/Secret

### Manual 3 — TikTok Data Portability API (For v3b)

> This has the **strictest approval**. May not be available for all app types.

1. Go to [developers.tiktok.com](https://developers.tiktok.com/) → your app `solen-ch`
2. Click **"Add products"** → find **"Data Portability API"**
3. If it's available for your app type, click **"Add"**
4. Fill in the use case form:
   - Use case: `Import user's liked TikTok videos to build personalized hairstyle/beauty recommendations`
   - Data types requested: **Liked videos** only
   - User consent: **Yes — explicit opt-in with GDPR explanation**
5. Click **"Submit for review"**
6. If approved, no new env vars needed — same Client Key/Secret
7. If not available or rejected → v3b features cannot be built (that's ok, they're nice-to-have)

---

# 🤖 v2 — TikTok Login + Creator Features

> **Start ONLY after**: TikTok Login Kit is approved + v1 is fully deployed.
> Execute: **v2P1 → v2P2 → v2P3**

---

## v2 Phase 1 — TikTok Auth Library

### [NEW] `lib/tiktok-auth.ts`
TikTok OAuth 2.0 flow. Uses Login Kit.

```typescript
// ✅ DO — Server-side only, use auth code flow
const TIKTOK_AUTH_URL = "https://www.tiktok.com/v2/auth/authorize/";
const TIKTOK_TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";

export function getTikTokAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY!,
    scope: "user.info.basic,user.info.profile",
    response_type: "code",
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/tiktok/callback`,
    state,
  });
  return `${TIKTOK_AUTH_URL}?${params}`;
}

export async function exchangeTikTokCode(code: string) {
  const res = await fetch(TIKTOK_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY!,
      client_secret: process.env.TIKTOK_CLIENT_SECRET!,
      code,
      grant_type: "authorization_code",
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/tiktok/callback`,
    }),
  });
  return res.json(); // { access_token, open_id, expires_in }
}

export async function getTikTokUserInfo(accessToken: string) {
  const res = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url,follower_count,following_count,bio_description", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.json();
}

// ❌ DON'T — Expose client_secret to the browser
// ❌ DON'T — Skip state parameter (CSRF vulnerability)
```

### [NEW] `app/api/auth/tiktok/route.ts`
GET: Generate auth URL → redirect user to TikTok login.

```typescript
export async function GET(req: NextRequest) {
  const state = crypto.randomUUID(); // CSRF protection
  // Store state in httpOnly cookie for verification in callback
  const authUrl = getTikTokAuthUrl(state);
  const res = NextResponse.redirect(authUrl);
  res.cookies.set("tiktok_state", state, { httpOnly: true, maxAge: 600, sameSite: "lax" });
  return res;
}
```

### [NEW] `app/api/auth/tiktok/callback/route.ts`
GET: Callback from TikTok. Exchange code → get user info → create/link Supabase account.

```typescript
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")!;
  const state = req.nextUrl.searchParams.get("state")!;
  const savedState = req.cookies.get("tiktok_state")?.value;

  // Verify CSRF
  if (state !== savedState) return NextResponse.redirect("/auth/login?error=csrf");

  // Exchange code for token
  const tokenData = await exchangeTikTokCode(code);
  const userInfo = await getTikTokUserInfo(tokenData.data.access_token);

  const admin = createAdminSupabaseClient();

  // Check if TikTok already linked to a profile
  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("tiktok_open_id", userInfo.data.user.open_id)
    .single();

  if (existing) {
    // Login existing user — create Supabase session
    // ...sign in with custom token or magic link...
  } else {
    // Create new user with TikTok data
    // ...create auth user + profile with tiktok_* fields...
  }

  return NextResponse.redirect("/de/discover");
}
```

### [NEW] `supabase/migrations/068_tiktok_auth.sql`

```sql
-- Add TikTok fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tiktok_open_id TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tiktok_display_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tiktok_avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tiktok_follower_count INT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tiktok_access_token TEXT;  -- encrypted
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tiktok_linked_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_creator BOOLEAN DEFAULT false;

-- Creator badge: auto-set when follower_count >= 10000
CREATE INDEX idx_profiles_tiktok ON profiles (tiktok_open_id) WHERE tiktok_open_id IS NOT NULL;
```

### [MODIFY] `lib/types.ts`
```typescript
// Add to Profile interface:
  tiktok_open_id: string | null;
  tiktok_display_name: string | null;
  tiktok_avatar_url: string | null;
  tiktok_follower_count: number;
  tiktok_linked_at: string | null;
  is_creator: boolean;
```

### [MODIFY] `lib/feature-flags.ts`
```typescript
// Add to FeatureKey:
| "tiktok_login"
```

### [MODIFY] `lib/validations.ts`
```typescript
// Add to updateProfileSchema (before .strict()):
  tiktok_open_id: z.string().optional().nullable(),
```

**Verification:**
```bash
pnpm run build
git add -A && git commit -m "v2 phase 1: tiktok auth library + callback routes + migration 068"
git push origin main
```

> ⚠️ **BE CAREFUL**:
> - `TIKTOK_CLIENT_SECRET` is server-only — NEVER expose in `NEXT_PUBLIC_*` vars
> - State parameter = CSRF protection — verify in callback
> - `tiktok_access_token` should be encrypted at rest in DB
> - Use `getSession()` not `getUser()` (CLAUDE.md Rule 25)
> - Create migration 068 — verify `ls supabase/migrations/068*` returns nothing first

---

## v2 Phase 2 — "Continue with TikTok" Auth Button

### [MODIFY] `app/[locale]/auth/login/page.tsx`
Add TikTok login button below existing Google OAuth button:

```typescript
// ✅ DO — Add alongside existing buttons, don't replace them
<button onClick={() => window.location.href = "/api/auth/tiktok"} className="...">
  <TikTokIcon className="w-5 h-5" />  {/* custom SVG, not lucide */}
  Continue with TikTok
</button>

// ❌ DON'T — Replace existing Google/Email auth options
```

### [MODIFY] `app/[locale]/auth/register/page.tsx`
Same TikTok button added to registration form. Pre-fills display_name and avatar from TikTok.

### [NEW] `components/ui/TikTokIcon.tsx`
Custom SVG icon matching TikTok brand guidelines (black music note on white, official logo).

### [NEW] `components/auth/TikTokLinkButton.tsx`
For existing users: "Link your TikTok" button in profile settings. Triggers same OAuth flow, links to existing account instead of creating new one.

**Verification:**
```bash
pnpm run build
git add -A && git commit -m "v2 phase 2: continue with tiktok auth button on login + register"
git push origin main
# Test: click TikTok button → redirected to TikTok → back to solen → logged in
```

> ⚠️ **BE CAREFUL**:
> - READ existing login/register pages FIRST — add button, don't rebuild
> - TikTok brand guidelines: use their official logo, not a generic icon
> - Feature flag: `checkFeatureEnabled("tiktok_login")` — if Login Kit not approved yet, hide button
> - Keep Google + Email auth as primary — TikTok is additional, not replacement

---

## v2 Phase 3 — Creator Badge + Social Booking Intel

### [NEW] `components/discovery/CreatorBadge.tsx`
Purple badge with TikTok icon + "Creator" label. Shows on:
- Discovery grid cards (if poster is a creator)
- Profile page
- Booking confirmation (salon sees it)

Criteria: `tiktok_follower_count >= 10000` → `is_creator = true`

```typescript
// ✅ DO — Use follower count from DB (cached from last TikTok login)
{profile.is_creator && <CreatorBadge followers={profile.tiktok_follower_count} />}

// ❌ DON'T — Fetch follower count from TikTok API on every render
```

### [NEW] `app/api/auth/tiktok/refresh/route.ts`
Cron (weekly): refresh `tiktok_follower_count` for linked accounts. Update `is_creator` flag.

### [MODIFY] Dashboard booking view
When salon views a booking, show: "This client has X TikTok followers" if `tiktok_follower_count > 0`. Purple "Creator" badge if `is_creator`. Salon can prioritize or offer influencer perks.

```typescript
// In booking detail (salon dashboard):
{booking.user.tiktok_follower_count > 0 && (
  <div className="flex items-center gap-2 text-sm text-s-ink/60">
    <TikTokIcon className="w-4 h-4" />
    {formatNumber(booking.user.tiktok_follower_count)} followers
    {booking.user.is_creator && <CreatorBadge size="sm" />}
  </div>
)}
```

### [NEW] `components/discovery/SocialProof.tsx`
"3 of your TikTok mutuals booked at this salon" — requires friends list scope (very restricted, may not be approved).

**Implementation note**: This feature depends on TikTok's friends list OAuth scope, which is heavily restricted. If not approved, skip this component. Add to `_tasks/INCOMPLETE_FEATURES.md` with note: "Blocked on TikTok friends list scope approval."

**Verification:**
```bash
pnpm run build
git add -A && git commit -m "v2 phase 3: creator badges + social booking intel + follower refresh"
git push origin main
```

> ⚠️ **BE CAREFUL**:
> - Cache follower counts — don't hit TikTok API per page load
> - Refresh weekly via cron, not real-time
> - Friends list scope is very restricted — may be rejected. SocialProof component is optional.
> - `is_creator` threshold = 10,000 followers (hardcoded, consider making configurable later)

---

# 🤖 v3a — Creator Economy (Content Posting API)

> **Start ONLY after**: TikTok Content Posting API is approved.
> Execute: **v3aP1 → v3aP2**

---

## v3a Phase 1 — Salon TikTok Auto-Sync

### [NEW] `lib/tiktok-content.ts`
TikTok Content Posting API client. Fetches salon's recent TikToks. Maps to discovery items.

```typescript
export async function fetchSalonTikToks(accessToken: string, cursor?: string) {
  const res = await fetch("https://open.tiktokapis.com/v2/video/list/?fields=id,title,cover_image_url,embed_link,create_time,like_count,view_count", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ max_count: 20, cursor }),
  });
  return res.json();
}
```

### [NEW] `supabase/migrations/069_tiktok_sync.sql`

```sql
-- Salon TikTok sync settings
ALTER TABLE salons ADD COLUMN IF NOT EXISTS tiktok_sync_enabled BOOLEAN DEFAULT false;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS tiktok_access_token TEXT;  -- encrypted
ALTER TABLE salons ADD COLUMN IF NOT EXISTS tiktok_last_sync_at TIMESTAMPTZ;

-- Staff TikTok links
ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS tiktok_url TEXT;
ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS tiktok_open_id TEXT;
```

### [NEW] `app/api/admin/discovery/tiktok-sync/route.ts`
Cron (daily): for each salon with `tiktok_sync_enabled`, fetch new TikToks → AI categorize → auto-publish to discovery grid under that salon's name.

### [MODIFY] `app/[locale]/dashboard/settings/page.tsx`
READ first. ADD "TikTok Integration" section:
- "Connect TikTok" button → OAuth flow → saves `tiktok_access_token` to salon
- Toggle: "Auto-sync new TikToks to Discovery"
- Last sync timestamp
- "Sync now" button for manual trigger

**Verification:**
```bash
pnpm run build
git add -A && git commit -m "v3a phase 1: salon tiktok auto-sync + settings toggle"
git push origin main
```

> ⚠️ **BE CAREFUL**:
> - Encrypt `tiktok_access_token` at rest
> - Daily sync cron: max 20 TikToks per salon per sync
> - Each auto-synced TikTok still goes through content flagging
> - READ dashboard settings page FIRST — add section, don't rebuild (CLAUDE.md Rule 8)

---

## v3a Phase 2 — Stylist Portfolios + Post-Booking Prompt

### [MODIFY] Staff member profile display
Each stylist can link their personal TikTok. Their TikTok videos appear on their portfolio page.

### [NEW] `components/discovery/PostBookingTikTokPrompt.tsx`
After a completed appointment, show modal: "Share your new look on TikTok!" with:
- Pre-filled caption: `Just got my hair done at @[salon_name] on solen.ch 💇 #solen #[category] #basel`
- "Open TikTok" button → deep link to TikTok camera with pre-filled caption
- "Maybe later" dismiss button
- Only shows once per booking (tracked in `bookings.tiktok_prompt_shown`)

### [NEW] `supabase/migrations/070_post_booking.sql`
```sql
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS tiktok_prompt_shown BOOLEAN DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS tiktok_post_url TEXT;  -- if user shares the URL back
```

**Verification:**
```bash
pnpm run build
git add -A && git commit -m "v3a phase 2: stylist portfolios + post-booking tiktok prompt"
git push origin main
```

> ⚠️ **BE CAREFUL**:
> - Post-booking prompt: show ONCE per booking only
> - TikTok deep link format: `https://www.tiktok.com/upload?caption=...`
> - "Maybe later" must dismiss permanently for that booking
> - Don't be too aggressive — this is a suggestion, not a requirement

---

# 🤖 v3b — Data Intelligence (Data Portability API)

> **Start ONLY after**: TikTok Data Portability API is approved.
> **May not be available** — this is the strictest TikTok API. If rejected, skip v3b entirely.

---

## v3b Phase 1 — Taste Profile + Smart Recommendations

### [NEW] `lib/tiktok-data.ts`
Imports user's liked TikToks. AI analyzes beauty content → builds preference profile.

```typescript
export async function importLikedTikToks(accessToken: string) {
  const res = await fetch("https://open.tiktokapis.com/v2/user/liked_videos/?fields=id,title,cover_image_url,video_description", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  // Filter for beauty content only (AI classification)
  return data.data.videos.filter(v => isBeautyContent(v));
}

export async function buildTasteProfile(videos: TikTokVideo[]): Promise<TasteProfile> {
  // Gemini analyzes patterns across liked videos:
  // - Most liked hair type (curly vs straight)
  // - Color preferences (natural vs bold)
  // - Style patterns (short vs long, classic vs trendy)
  // Returns weighted preference map
}
```

### [NEW] `supabase/migrations/071_taste_profile.sql`

```sql
CREATE TABLE taste_profiles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  preferred_categories TEXT[] DEFAULT '{}',
  preferred_textures TEXT[] DEFAULT '{}',
  preferred_styles TEXT[] DEFAULT '{}',
  preferred_colors TEXT[] DEFAULT '{}',
  style_adventurousness FLOAT DEFAULT 0.5,  -- 0 = classic, 1 = trendy
  analyzed_video_count INT DEFAULT 0,
  last_analyzed_at TIMESTAMPTZ,
  raw_analysis JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE taste_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "taste_own" ON taste_profiles FOR ALL USING (auth.uid() = user_id);
```

### [NEW] `app/api/discovery/taste-profile/route.ts`
POST: Import liked TikToks → analyze → build profile. Auth required. Rate: 1 per day.
GET: Return current taste profile.

### [NEW] `components/discovery/TasteProfileCard.tsx`
Shows on profile page: "Based on 47 beauty TikToks you've liked:" — texture breakdown, style preferences, color affinity. Fun visual cards.

### [MODIFY] `lib/discovery-algorithm.ts`
If user has taste profile → boost items matching their preferences (up to 30% weight). Replaces generic "trending" fallback for new users.

### [MODIFY] `app/[locale]/discover/page.tsx`
Add "For You" pill alongside category pills. "For You" = personalized feed using taste profile. If no taste profile → "Import TikTok Likes" CTA.

### [NEW] `components/discovery/TasteProfileImportCTA.tsx`
Banner on Discover page: "Import your TikTok likes for personalized style recommendations" → button → OAuth → import → build profile → refresh feed.

GDPR: Full explanation of what data is imported and why. "We only look at beauty-related TikToks. Your data is stored privately and can be deleted anytime."

**Verification:**
```bash
pnpm run build
git add -A && git commit -m "v3b phase 1: taste profiles from tiktok likes + smart recommendations"
git push origin main
```

> ⚠️ **BE CAREFUL**:
> - GDPR: User must explicitly opt-in. Show clear explanation. "Delete my taste profile" button required.
> - Filter beauty content only — don't analyze non-beauty TikToks
> - Rate limit: 1 import per day per user (TikTok API limits)
> - `taste_profiles.raw_analysis` stores Gemini output — useful for debugging
> - If Data Portability API is not approved, add to `_tasks/INCOMPLETE_FEATURES.md` and skip

---

## R6: DEPENDENCY ORDER

| Step | Type | What | Depends On |
|---|---|---|---|
| Manual 1 | 🧑 | TikTok Login Kit env vars | Login Kit approved |
| v2P1 | 🤖 | Auth library + migration 068 | Manual 1 + v1 complete |
| v2P2 | 🤖 | TikTok login button | v2P1 |
| v2P3 | 🤖 | Creator badges + social intel | v2P2 |
| Manual 2 | 🧑 | Content Posting API submission | v2 complete |
| v3aP1 | 🤖 | Salon TikTok auto-sync | Manual 2 approved |
| v3aP2 | 🤖 | Stylist portfolios + post-booking | v3aP1 |
| Manual 3 | 🧑 | Data Portability API submission | v2 complete |
| v3bP1 | 🤖 | Taste profiles + smart recs | Manual 3 approved |

---

## Final Phase — Update CLAUDE.md

After all v2/v3 phases, update CLAUDE.md:
- Section 6: add `taste_profiles` table, `tiktok_*` columns on profiles/salons/staff
- Section 3.5: add "25. TikTok Login", "26. Creator Badges", "27. TikTok Auto-Sync", "28. Taste Profiles"
- Section 11: reference TikTok auth rate limiters
- `.env.example`: add `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`
