# CONTRACTS.md — Dev 1 Handoff
> Single source of truth for the whole team. Devs 2 and 3 read this to know what's available.
> **Maintained by Dev 1. Updated after every change.**

---

## Supabase Project

| Setting | Value |
|---------|-------|
| URL | `https://tocfnsmxmdxkrcmjzzdw.supabase.co` |
| Anon key env var | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Service role env var | `SUPABASE_SERVICE_ROLE_KEY` |

---

## Database Tables

All tables are in the `public` schema. Import types from `lib/types.ts`.

### `profiles`
Extends `auth.users`. Auto-created on sign-up via trigger.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | = auth.users.id |
| `display_name` | text | NOT NULL |
| `avatar_url` | text | nullable |
| `bio` | text | max 500 chars |
| `hair_type` | text | `straight\|wavy\|curly\|coily\|unknown` |
| `age_group` | text | `child\|teenager\|adult\|senior` |
| `gender` | text | `male\|female\|non_binary\|prefer_not_to_say` |
| `is_first_visit_default` | boolean | default true; flips to false after first booking |
| `locale` | text | `de\|en`, default `de` |
| `role` | text | `customer\|salon_owner\|admin` |
| `onboarding_completed` | boolean | default false |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | auto-updated |

**RLS**: Own row full access. Public can SELECT `display_name`, `avatar_url`, `bio`.

---

### `salons`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `owner_id` | uuid FK→profiles | |
| `name` | text | NOT NULL |
| `slug` | text | UNIQUE, NOT NULL |
| `description_de` / `description_en` | text | nullable |
| `categories` | text[] | `{coiffeur,barbershop,nails,spa,makeup,waxing}` — filter: `WHERE 'barbershop' = ANY(categories)` |
| `quartier` | text | `grossbasel\|kleinbasel\|gundeli\|st_johann\|iselin\|bruderholz\|breite` |
| `address` | text | |
| `latitude` / `longitude` | numeric(10,7) | |
| `phone` | text | nullable |
| `instagram_url` | text | nullable |
| `cover_photo_url` | text | nullable |
| `gallery_urls` | text[] | default `{}` |
| `opening_hours` | jsonb | `{"mon":{"open":"09:00","close":"18:00"},...}` null=closed |
| `average_rating` | numeric(3,2) | auto-updated by trigger on reviews |
| `review_count` | integer | auto-updated by trigger |
| `is_active` | boolean | false = frozen |
| `last_verified_at` | timestamptz | |
| `verification_warnings` | integer | 0–3 |
| `last_minute_discount_percent` | integer | 0–100 |
| `last_minute_window_hours` | integer | default 6 |

**RLS**: Public SELECT where `is_active = true`. Owner can UPDATE own salon. Only admin can set `is_active`.

---

### `staff_members`

| Column | Type |
|--------|------|
| `id` | uuid PK |
| `salon_id` | uuid FK→salons CASCADE |
| `name` | text NOT NULL |
| `avatar_url` | text nullable |
| `specialties` | text[] |
| `is_active` | boolean |
| `created_at` | timestamptz |

---

### `services`

| Column | Type |
|--------|------|
| `id` | uuid PK |
| `salon_id` | uuid FK→salons CASCADE |
| `name_de` / `name_en` | text NOT NULL |
| `category` | text |
| `duration_minutes` | integer |
| `price` | numeric(8,2) |
| `description_de` / `description_en` | text nullable |
| `suitable_for` | text[] | `{child,teenager,adult,senior}` |
| `suitable_gender` | text[] | `{male,female,non_binary}` |
| `is_active` | boolean |

---

### `availability_slots`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `salon_id` | uuid FK | |
| `service_id` | uuid FK | |
| `staff_member_id` | uuid FK nullable | null = any staff |
| `starts_at` / `ends_at` | timestamptz | |
| `status` | text | `available\|booked\|blocked` |
| `price_override` | numeric(8,2) nullable | overrides service.price (Last-Minute) |
| `booked_by` | uuid FK→profiles nullable | |
| `booking_id` | uuid FK→bookings nullable | |

**Realtime enabled.** Subscribe to INSERT/UPDATE events for live availability.

---

### `bookings`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK→profiles | |
| `salon_id` | uuid FK | |
| `service_id` | uuid FK | |
| `staff_member_id` | uuid FK nullable | |
| `slot_id` | uuid FK | |
| `starts_at` / `ends_at` | timestamptz | |
| `price_paid` | numeric(8,2) | |
| `status` | text | `confirmed\|cancelled\|completed\|no_show` |
| `is_first_visit` | boolean | |
| `cancellation_reason` | text nullable | |
| `cancelled_at` | timestamptz nullable | |
| `is_recurring` | boolean | |
| `recurring_group_id` | uuid nullable | links recurring series |

---

### `recurring_booking_rules`

| Column | Type |
|--------|------|
| `id` | uuid PK |
| `user_id` / `salon_id` / `service_id` | uuid FK |
| `staff_member_id` | uuid FK nullable |
| `frequency` | text `weekly\|biweekly\|monthly\|custom` |
| `custom_interval_days` | integer nullable |
| `preferred_day` | text `mon..sun` nullable |
| `preferred_time` | time nullable |
| `next_booking_date` | date NOT NULL |
| `is_active` | boolean |

---

### `conversations`

| Column | Type |
|--------|------|
| `id` | uuid PK |
| `customer_id` | uuid FK→profiles |
| `salon_id` | uuid FK→salons |
| `last_message_at` | timestamptz nullable |
| `last_message_preview` | text nullable (first 100 chars) |
| `unread_count_customer` | integer |
| `unread_count_salon` | integer |

**Unique(customer_id, salon_id).** **Realtime enabled.**

---

### `messages`

| Column | Type |
|--------|------|
| `id` | uuid PK |
| `conversation_id` | uuid FK→conversations CASCADE |
| `sender_id` | uuid FK→profiles |
| `content` | text max 2000 |
| `message_type` | text `text\|image\|booking_link` |
| `image_url` | text nullable |
| `read_at` | timestamptz nullable |

**Realtime enabled.** Frontend subscribes to `INSERT WHERE conversation_id = X`.

---

### `reviews`

| Column | Type |
|--------|------|
| `id` | uuid PK |
| `salon_id` | uuid FK |
| `user_id` | uuid FK→profiles |
| `booking_id` | uuid FK UNIQUE (1 review per booking) |
| `staff_member_id` | uuid FK nullable |
| `rating` | smallint 1–5 |
| `comment` | text max 500 nullable |

Trigger auto-updates `salons.average_rating` and `salons.review_count`.

---

### `user_preferences`

| Column | Type |
|--------|------|
| `user_id` | uuid PK FK→profiles |
| `favorite_quartier_ids` | text[] |
| `favorite_service_slugs` | text[] |
| `quartier_visit_counts` | jsonb `{"gundeli":5}` |
| `last_booked_service` | text nullable |
| `booking_intervals` | jsonb |
| `dismissed_nudges` | jsonb |
| `view_preference` | text `list\|map` |

---

## Database Functions

### `get_last_minute_slots(p_category, p_quartier)`
Returns fully hydrated `LastMinuteSlot[]` as jsonb — used by `/api/salons/last-minute`.

```sql
SELECT get_last_minute_slots('coiffeur', 'gundeli');
```

---

## API Routes

All routes live in `app/api/`. Use the server Supabase client. Import types from `lib/types.ts`.

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/callback` | OAuth redirect handler |
| POST | `/api/auth/login` | Body: `{email}` or `{provider:"google"}` |
| POST | `/api/auth/logout` | Clears session, redirects |

### Salons & Discovery
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/salons` | List salons. Params: `category`, `quartier`, `min_rating`, `sort`, `page`, `limit` |
| GET | `/api/salons/[slug]` | Full salon profile with services, staff, reviews |
| GET | `/api/salons/search?q=` | Full-text search |
| GET | `/api/salons/last-minute` | Last-minute slots. Params: `category`, `quartier` |
| GET | `/api/salons/verify?token=` | Salon verification from email link |

### Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bookings` | Create booking. Body: `{slot_id, service_id, staff_member_id?, is_first_visit}` |
| GET | `/api/bookings` | List user bookings. Params: `status`, `page` |
| GET | `/api/bookings/[id]` | Single booking detail |
| POST | `/api/bookings/[id]/cancel` | Cancel booking. Body: `{reason?}` |
| POST | `/api/bookings/recurring` | Create recurring rule + first booking |
| DELETE | `/api/bookings/recurring/[id]` | Deactivate recurring rule |

### Availability
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/availability/[salon_id]` | Slots grouped by date. Params: `service_id`, `staff_member_id?`, `date_from`, `date_to` |
| POST | `/api/availability/manage` | Owner: create/block slots. Body: `{salon_id, slots:[...]}` |
| DELETE | `/api/availability/manage/[slot_id]` | Owner: remove slot (triggers cancellation if booked) |

### Chat / Messaging
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/conversations` | List user's conversations |
| POST | `/api/conversations` | Start/get conversation. Body: `{salon_id}` |
| GET | `/api/conversations/[id]/messages` | Messages paginated, marks as read |
| POST | `/api/conversations/[id]/messages` | Send message. Body: `{content, message_type?, image_url?}` |

### Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profile` | Current user profile |
| PATCH | `/api/profile` | Update profile fields |
| GET | `/api/profile/preferences` | User personalization preferences |

### Reviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reviews` | Submit review. Body: `{booking_id, rating, comment?, staff_member_id?}` |
| GET | `/api/reviews/salon/[salon_id]` | Public reviews for a salon |

---

## TypeScript Types

All types exported from `lib/types.ts`. Import like:

```ts
import type { Salon, Booking, LastMinuteSlot, PaginatedResponse } from "@/lib/types";
```

| Type | Description |
|------|-------------|
| `Profile` | User profile row |
| `Salon` | Salon row |
| `SalonCategory` | Union: `coiffeur\|barbershop\|nails\|spa\|makeup\|waxing` |
| `Quartier` | Union of 7 Basel quartiers |
| `StaffMember` | Staff row |
| `Service` | Service row |
| `AvailabilitySlot` | Slot row |
| `Booking` | Booking row |
| `BookingStatus` | Union: `confirmed\|cancelled\|completed\|no_show` |
| `RecurringBookingRule` | Recurring rule row |
| `RecurringFrequency` | Union: `weekly\|biweekly\|monthly\|custom` |
| `Conversation` | Conversation row |
| `Message` | Message row |
| `MessageType` | Union: `text\|image\|booking_link` |
| `Review` | Review row |
| `UserPreferences` | Preferences row |
| `LastMinuteSlot` | Slot + salon + service + discounted_price |
| `SalonProfile` | Salon + services + staff + reviews |
| `PaginatedResponse<T>` | `{items, total, page, limit}` |
| `ApiError` | `{message, code?}` |

---

## Edge Functions

Deployed to Supabase. Located in `supabase/functions/`.

| Function | Trigger | Description |
|----------|---------|-------------|
| `post-booking-preferences` | DB webhook on `bookings` INSERT | Updates `user_preferences` |
| `salon-verification` | pg_cron: 1st of month 08:00 UTC | Sends verification emails, freezes inactive salons |
| `recurring-booking-processor` | pg_cron: daily 00:01 UTC | Auto-creates recurring bookings |

---

## Shared Utilities

| File | Exports |
|------|---------|
| `lib/supabase.ts` | `createServerSupabaseClient()`, `createAdminSupabaseClient()`, `createBrowserSupabaseClient()` |
| `lib/types.ts` | All TypeScript types |
| `lib/utils.ts` | `slugify()`, `formatPrice()`, `formatDate()`, `formatTime()`, `advanceBookingDate()`, `isLastMinute()`, `calcLastMinutePrice()` |
| `lib/email.ts` | `sendEmail(template, to, data, locale?)` |
| `lib/seo.ts` | `generateSalonSchema(salon, locale?)`, `salonCanonicalUrl()`, `salonOpenGraph()` |

---

## i18n

- Locales: `de` (default), `en`
- Message files: `messages/de.json`, `messages/en.json`
- Config: `i18n.ts` (next-intl getRequestConfig)
- All locale keys defined in messages files — fill in actual strings in your UI work

---

## SEO Infrastructure

| File | Description |
|------|-------------|
| `app/sitemap.ts` | Dynamic sitemap — salons + all static pages both locales |
| `app/robots.ts` | Allows all crawlers, disallows `/api/` and `/dashboard/` |
| `lib/seo.ts` | `generateSalonSchema()` for JSON-LD embedding |

---

## Realtime Subscriptions

Tables with Realtime enabled:
- `availability_slots` — subscribe to slot changes for live booking UI
- `messages` — subscribe to `INSERT WHERE conversation_id = X` for live chat
- `conversations` — subscribe to unread count updates

Example (Dev 2 / Dev 3 usage):
```ts
const channel = supabase
  .channel("messages")
  .on("postgres_changes", {
    event: "INSERT",
    schema: "public",
    table: "messages",
    filter: `conversation_id=eq.${conversationId}`,
  }, (payload) => { /* handle new message */ })
  .subscribe();
```

---

## Git Milestones

| Tag | Milestone |
|-----|-----------|
| `v0.1-schema` | All 11 tables migrated |
| `v0.2-api` | All API routes working |
| `v0.3-functions` | All Edge Functions deployed |

---

*Last updated: 2026-03-15 — Dev 1*
