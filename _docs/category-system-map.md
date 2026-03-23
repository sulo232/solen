# 🗺️ Solen.ch — Multi-Category System Architecture Map

> **Every AI agent MUST read this file before building category-specific features.**
> Referenced from CLAUDE.md. Describes how solen.ch categories share base infrastructure and where they diverge.

---

## 1. Category Registry

| Category ID | Label (DE) | Label (EN) | Icon | Calendar Color | Status |
|---|---|---|---|---|---|
| `coiffeur` | Coiffeur | Hair Salon | `Scissors` | `#E8624A` (coral) | ✅ Live |
| `barbershop` | Barbershop | Barbershop | `Scissors` | `#E8624A` (coral) | ✅ Live |
| `nails` | Nagelstudio | Nail Salon | `Sparkles` | `#6BA3C8` (blue) | ✅ Live |
| `spa` | Spa & Wellness | Spa & Wellness | `Leaf` | `#7BA688` (sage) | 📋 Planned |
| `makeup` | Makeup | Makeup | `Palette` | `#D4870A` (amber) | 📋 Planned |
| `waxing` | Waxing | Waxing | `Zap` | `#F2C144` (yellow) | 📋 Planned |

Type definition: `lib/types.ts` → `SalonCategory`

---

## 2. Shared Base Layer (ALL categories inherit)

Every category uses these systems without modification:

### 2.1 Core Booking Engine
- Tables: `bookings`, `availability_slots`, `services`, `service_addons`, `staff_members`
- Routes: `api/bookings/`, `api/stripe/`, `api/bookings/walk-in/`
- Components: `BookingCalendar`, `BookingSuccess`, `ServiceCart`
- Crons: `generate-slots`, `auto-complete`, `release-payments`, `pre-charge`

### 2.2 Payments & Commerce
- Stripe Connect (destination charges, platform fee from `platform_settings`)
- Gift cards (`gift_cards`), tips (`tips`), packages (`service_packages`)
- Walk-in SMS payments (seven.io + HMAC tokens)
- Cancellation policy (`lib/cancellation-policy.ts`)

### 2.3 Staff System
- Invites (`staff_invites`), schedules (`staff_schedules`), breaks, time-off
- Permission levels: `can_edit_schedule`, `can_view_own_bookings`, `can_manage_portfolio`
- Portfolio images (`staff_portfolio_images`)
- Staff-service mapping (`staff_services`)

### 2.4 Client CRM
- Notes (`client_notes`), tags (`client_tags`), photos (`client_photos`)
- Intake forms (`intake_forms` + `lib/intake-templates.ts`)
- Favorites, loyalty cards, referrals

### 2.5 Communications
- SMS reminders (24h/1h via seven.io)
- Email templates (`lib/email.ts`, 4 locales)
- DM chat with media upload, price offers

### 2.6 Analytics & Marketing
- Revenue, heatmap, staff comparison, acquisition tracking
- Off-peak discounts (`off_peak_slots`)
- Marketing dashboard (packages, gift cards, referrals)

### 2.7 Discovery Platform
- Tables: `discovery_items`, `discovery_likes`, `discovery_saves`, `discovery_comments`
- Route: `/discover` with category filter
- Already supports `nail_shape`, `nail_style` fields on `DiscoveryItem`

### 2.8 Smart Search
- Tables: `search_embeddings`
- Routes: `api/search/smart`, `api/search/suggest`, `api/search/detect-category`
- Components: `HomeSearchBar`, `SearchAutocomplete` (enhanced)
- Category-scoped: searches within current category, suggests cross-category when wrong match
- Date-based availability: `FilterBar` date picker, `api/salons` `?date=` param, grey-out UX on `SalonCard`

---

## 3. Category-Specific Extension Pattern

> **Architecture rule**: Category features are ADDITIVE layers on the shared base. They NEVER replace or fork base systems.

### 3.1 Extension Points

Each category can extend the base at these points:

| Extension Point | How | Example |
|---|---|---|
| **Intake Questionnaire** | Add template in `lib/intake-templates.ts` | `nail_consultation: [...]` |
| **Service Templates** | Add category in `lib/service-templates.ts` | `nails: [...]` |
| **Client Profile Extension** | New table `{category}_client_preferences` | Nail shape, material, allergies |
| **Design/Visit History** | New table `{category}_design_history` | Per-visit structured record |
| **Discovery Filters** | Category-specific filter UI on `/discover` | Shape, style, material filters |
| **Tech Portfolio Metadata** | Extend `staff_portfolio_images` with tags | `nail_style`, `nail_shape` tags |
| **Booking Flow Customization** | Category-aware steps in `BookingCalendar` | Material selector, inspo upload |
| **Resource/Station Management** | New table `{category}_stations` | Station count, equipment limits |
| **Pricing Extensions** | `staff_services.price_override` | Tier pricing per tech×service |
| **Automated Reminders** | Service-level `reminder_cycle_days` | Infill reminders every 14 days |
| **CRM Dashboard Tab** | New dashboard page in `app/[locale]/dashboard/` | Nail client history page |

### 3.2 File/Folder Convention

```
Category-specific code follows this namespace pattern:

lib/
├── intake-templates.ts          # ALL categories' intake forms (shared file)
├── service-templates.ts         # ALL categories' default services (shared file)
├── nail/                        # Nail-specific lib code
│   ├── types.ts                 # Nail-specific types
│   ├── station-availability.ts  # Station limit checker
│   ├── infill-calculator.ts     # Infill cycle logic
│   └── design-history.ts        # History helpers
├── barber/                      # Barber-specific lib code
│   ├── visit-cycle-algorithm.ts # Smart visit frequency calculator
│   ├── wait-time-calculator.ts  # Walk-in wait time estimator
│   ├── chair-availability.ts    # Chair limit checker
│   └── loyalty-qr.ts            # QR token generation/verification
├── hair/                        # Hair-specific lib code (existing)
│   ├── hair-algorithm.ts
│   ├── hair-moderation.ts
│   └── fal.ts

components/
├── hair/                        # Hair Discovery components (existing)
│   ├── DiscoveryGrid.tsx
│   ├── HairCard.tsx
│   └── AngleScrubber.tsx
├── nail/                        # Nail-specific components
│   ├── TechPortfolio.tsx
│   ├── NailDesignCard.tsx
│   ├── MaterialSelector.tsx
│   ├── ShapeLengthPicker.tsx
│   ├── InspoUploader.tsx
│   ├── InspoBoard.tsx
│   └── DesignHistoryTimeline.tsx
├── barber/                      # Barber-specific components
│   ├── WalkinQueue.tsx
│   ├── WaitTimeDisplay.tsx
│   ├── RemoteQueueJoin.tsx
│   ├── ExpressRebook.tsx
│   ├── CutHistoryTimeline.tsx
│   ├── LoyaltyCard.tsx
│   └── LoyaltyCardList.tsx
├── dashboard/
│   ├── nail/                    # Nail dashboard components
│   │   ├── NailClientTab.tsx
│   │   ├── StationManager.tsx
│   │   └── InfillReminderConfig.tsx
│   ├── barber/                  # Barber dashboard components
│   │   ├── BarberLeaderboard.tsx
│   │   ├── ChairManager.tsx
│   │   ├── SmartReminderConfig.tsx
│   │   └── LoyaltyConfig.tsx

app/[locale]/
├── discover/
│   ├── page.tsx                 # Main discovery (all categories)
│   └── nails/
│       └── page.tsx             # Nail-specific discovery section
├── salon/[slug]/
│   └── barber/[barberSlug]/
│       └── page.tsx             # Individual barber profile page
├── dashboard/
│   ├── nail-clients/
│   │   └── page.tsx             # Nail CRM dashboard
│   ├── barber-clients/
│   │   └── page.tsx             # Barber CRM dashboard
│   └── loyalty/
│       └── page.tsx             # Loyalty stamp dashboard
```

### 3.3 Database Naming Convention

Category-specific tables use the prefix: `nail_`, `hair_`, `spa_`, etc.

```
nail_design_history      — per-visit design records
nail_client_preferences  — saved client prefs (shape, material, allergies)
nail_stations            — station/equipment config
nail_inspo_images        — inspiration photo uploads
nail_style_categories    — style enum (french, chrome, ombre, 3d, etc.)

barber_walkin_queue       — real-time walk-in queue entries
barber_cut_history        — per-visit cut preference records
barber_loyalty_programs   — per-salon punch card config
barber_loyalty_cards      — per-client-per-salon stamp tracking
barber_loyalty_history    — completed/redeemed card archive
barber_chairs             — chair count + buffer config

hair_salon_posts         — (existing) salon hair photos
hairstyles               — (existing) AI-generated hairstyle catalog
hair_angle_images        — (existing) 360° views
```

### 3.4 How to Add a New Category

When building features for a new category (e.g., spa, waxing):

1. **Check this map** — see what the base already provides
2. **Don't duplicate base** — if booking/payments/CRM handles it, don't rebuild
3. **Use the extension points** (§3.1) — add intake templates, service templates, discovery filters
4. **Follow the naming convention** (§3.2, §3.3) — `lib/{category}/`, `components/{category}/`, `{category}_` tables
5. **Create a roadmap** — `_tasks/roadmap-{category}.md` following CLAUDE.md R1-R10 standards
6. **Update this map** — add the category's specific features to §4

---

## 4. Category-Specific Features

### 4.1 💇 Hair / Coiffeur

**Roadmap**: `_tasks/roadmap-hair-discovery.md`

| Feature | Tables | Routes | Components |
|---|---|---|---|
| AI 360° Discovery | `hairstyles`, `hair_angle_images`, `hair_generated` | `api/hair/feed`, `api/admin/hair/generate-360` | `DiscoveryGrid`, `AngleScrubber`, `HairCard` |
| Color Formulas | `client_formulas` | `api/clients/[id]/formulas` | `FormulaTab` |
| Hair Profile | `profiles.hair_gender`, `.hair_texture`, `.hair_length`, `.face_shape` | — | Profile page section |
| Salon/User Posts | `hair_salon_posts`, `hair_user_posts` | `api/hair/salon-post`, `api/hair/user-post` | Content Studio |
| Social (likes/saves/comments) | `hair_likes`, `hair_saves`, `hair_collections`, `hair_comments` | `api/hair/like`, `api/hair/save`, `api/hair/comments` | `LikeButton`, `SaveButton`, `CommentSection` |
| Product Recs | `hair_products`, `hair_product_recommendations` | — | `ProductPills` |
| Interaction Signals | `hair_interactions` | `api/hair/interactions` | Fire-and-forget |

### 4.2 💅 Nails

**Roadmap**: `_tasks/roadmap-nails.md`

| Feature | Tables | Routes | Components |
|---|---|---|---|
| Tech Portfolio | `staff_portfolio_images` (extended) | `api/nail-tech/[id]/portfolio` | `TechPortfolio`, `NailDesignCard` |
| Design History | `nail_design_history` | `api/clients/[id]/nail-history` | `DesignHistoryTimeline` |
| Inspo System | `nail_inspo_images`, `nail_inspo_boards` | `api/bookings/[id]/inspo`, `api/clients/[id]/inspo-board` | `InspoUploader`, `InspoBoard` |
| Material Selection | (booking flow) | — | `MaterialSelector`, `ShapeLengthPicker` |
| Station Management | `nail_stations` | `api/salon/stations` | `StationManager` |
| Tier Pricing | `staff_services.price_override` | — | Booking flow price display |
| Infill Reminders | `services.reminder_cycle_days` | `api/cron/infill-reminders` | `InfillReminderConfig` |
| Allergy Tracking | `nail_client_preferences.allergies` | `api/clients/[id]/nail-preferences` | Allergy warning badges |
| Nail Discovery | `discovery_items` (filtered) | `api/discover/nails` | Nail masonry grid |
| Dynamic Pricing | `nail_dynamic_pricing_rules` | `api/salon/dynamic-pricing` | Peak/off-peak settings |
| BNPL | (Stripe integration) | — | Checkout option |
| AI Nail Art | (fal.ai) | `api/admin/nail/generate` | Admin content studio |
| Retail POS | `nail_retail_products` | `api/salon/retail` | `RetailCheckout` |

### 4.3 🧖 Spa (Planned)

| Feature | Priority | Notes |
|---|---|---|
| Treatment room management | P0 | Room count limiting (like nail stations) |
| Health condition intake | P0 | Extended spa questionnaire |
| Pressure preferences per client | P1 | Stored preference, shown to therapist |
| Post-treatment care instructions | P1 | Auto-sent after appointment |
| Contraindication warnings | P0 | Medical conditions that block certain treatments |

### 4.4 💄 Makeup (Planned)

| Feature | Priority | Notes |
|---|---|---|
| Occasion-based discovery | P1 | Filter by wedding/party/editorial/daily |
| Skin type matching | P1 | Foundation shade + skin concerns |
| Reference photo system | P0 | Same as nail inspo uploads |
| Product recommendations | P1 | "Products used" list per booking |

### 4.5 🪒 Waxing (Planned)

| Feature | Priority | Notes |
|---|---|---|
| Treatment area selector | P0 | Visual body map for area selection |
| Skin sensitivity intake | P0 | Medication check (retinol, etc.) |
| Sun exposure warnings | P1 | Auto-warn if recent sun exposure noted |
| Growth cycle reminders | P1 | Like nail infill reminders but 4-6 week cycle |

### 4.6 💈 Barbershop

**Roadmap**: `_tasks/roadmap-barber.md`

| Feature | Tables | Routes | Components |
|---|---|---|---|
| Walk-In Queue | `barber_walkin_queue` | `api/walkin/queue`, `api/walkin/queue/[id]`, `api/walkin/queue/remote-join`, `api/walkin/queue/status` | `WalkinQueue`, `WaitTimeDisplay`, `RemoteQueueJoin` |
| Cut Preference History | `barber_cut_history` | `api/clients/[id]/cut-history`, `api/clients/[id]/repeat-last-cut` | `CutHistoryTimeline` |
| Express Rebook | `bookings.is_express_rebook`, `.rebooked_from_id` | `api/bookings/express-rebook`, `api/bookings/express-rebook/confirm` | `ExpressRebook` |
| Smart Reminders | (calculated via `visit-cycle-algorithm.ts`) | `api/cron/barber-smart-reminders` | `SmartReminderConfig` |
| Barber Profiles | `staff_members.slug`, `.cover_photo_url`, `.accent_color` | `api/barber/[slug]`, `api/barber/[slug]/portfolio` | Profile page at `/salon/{slug}/barber/{barberSlug}` |
| Digital Loyalty Cards | `barber_loyalty_programs`, `barber_loyalty_cards`, `barber_loyalty_history` | `api/salon/loyalty`, `api/loyalty/cards`, `api/loyalty/stamp`, `api/loyalty/redeem`, `api/loyalty/qr/[cardId]` | `LoyaltyCard`, `LoyaltyCardList`, `LoyaltyConfig`, stamp page |
| Chair Management | `barber_chairs` | `api/salon/chairs` | `ChairManager` |
| Barber Leaderboard | (analytics queries) | — | `BarberLeaderboard` |
| Barber Portfolio | `staff_portfolio_images` (extended: `barber_style`, `fade_type`, `is_before_after`) | `api/barber/[slug]/portfolio` | Portfolio grid with fade/style filters |
| Walk-In Analytics | (analytics queries) | — | Walk-in vs appointment ratio, conversion, wait times |

---

## 5. Cross-Category Interaction Rules

1. **A salon can have multiple categories** — `salons.categories` is an array (`SalonCategory[]`)
2. **Services belong to one category** — `services.category` is a single enum value
3. **Staff can serve multiple categories** — mapped via `staff_services` junction
4. **Discovery is filterable by category** — existing category filter on `/discover`
5. **Intake forms are category-specific** — template key maps to category (e.g., `nail_consultation`)
6. **Client history spans all categories** — `client_notes`, `client_tags`, `client_photos` are category-agnostic
7. **Category-specific history is separate** — `nail_design_history`, `client_formulas` are category-scoped tables
8. **Analytics aggregate across categories** — revenue, heatmap, retention are category-agnostic. Add-on conversion rates can be filtered by category

---

## 6. When to Extend vs Create New

| Scenario | Action |
|---|---|
| Adding a new service type for an existing category | Add to `lib/service-templates.ts` |
| Adding category-specific client data | New table: `{category}_client_preferences` |
| Adding category-specific booking flow step | Category-aware conditional in `BookingCalendar` |
| Adding category-specific discovery filters | Extend filter UI, use existing `discovery_items` fields |
| Adding entirely new discovery system (like Hair AI) | New tables with `{category}_` prefix |
| Adding category-specific dashboard page | New page: `app/[locale]/dashboard/{category}-*/page.tsx` |
| Adding category-specific reminders | Extend `services` with `reminder_cycle_days`, add cron |
