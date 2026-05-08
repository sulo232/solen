# Backend Features That Need UI in Redesign

> **Purpose**: These features have working backend (API routes, DB tables, logic) but need proper UI design during the redesign. When we reach the page/component that houses each feature, we design UI for it — don't skip.

---

## ON SALON CARDS (SalonCard.tsx)
- [ ] **Badges**: "Top bewertet", "Beliebt", "Neu", "Solen Exclusive" — backend auto-assigns via `/api/admin/badges/auto-assign`. Need badge design (shape, color, position on card)
- [ ] **Deal overlay**: "-20%" discount badge — backend from `/api/salon/last-minute-settings`. Need overlay design
- [ ] **Favorite heart**: Toggle via `/api/profile/favorites`. Need heart style + animation
- [ ] **Availability pill**: "Heute frei" / "Morgen" — backend from slot data. Need pill design
- [ ] **Social proof**: "10x diese Woche gebucht" — backend tracks. Need text treatment
- [ ] **Photo dots**: Carousel pagination — need dot style

## ON SALON DETAIL PAGE
- [ ] **Off-peak deals**: Today's discounts from `/api/salons/[slug]/off-peak-today`. Need banner/badge
- [ ] **Solen Score**: Quality score 0-100 from `/api/analytics/solen-score`. Need display treatment
- [ ] **Staff badges**: Per-staff ratings, tier badges (junior/senior/master). Need badge design
- [ ] **Review photos**: Customer-uploaded photos with reviews. Need photo display
- [ ] **Review reply**: Salon owner responses (public/private). Need reply card design
- [ ] **Similar salons**: 3 related salons from `/api/salons/similar`. Need card layout

## ON BOOKING FLOW
- [ ] **Package redemption**: PackageRedeemBanner when user has credits. Need banner design
- [ ] **Promo/gift/referral codes**: Input fields in ServiceCart. Need input design
- [ ] **Group booking**: Multi-person modal. Need form design
- [ ] **Guest checkout**: No-account form. Need form design
- [ ] **Add-ons**: Per-service add-ons from `/api/services/[id]/addons`. Need selection UI

## ON PROFILE PAGE
- [ ] **Beauty profile**: Hair/nails/skin/style preferences. Need card + edit modal design
- [ ] **Loyalty stamps**: Progress tracking + QR code. Need stamp card design
- [ ] **Payment methods**: Stripe saved cards. Need card list design
- [ ] **Referral stats**: Code sharing + reward tracking. Need stats display
- [ ] **GDPR deletion**: 30-day grace period modal. Need confirmation design

## ON DISCOVERY PAGE
- [ ] **AI suggestion pills**: Trending style pills. Need pill design
- [ ] **Like/save/share**: Social interactions on posts. Need button designs
- [ ] **Booking bridge**: "Book this look" CTA → salon. Need CTA design
- [ ] **AI description**: Maintenance level, face shapes, type match. Need info card
- [ ] **Comment section**: Comments with pagination. Need comment card design

## ON SEARCH
- [ ] **Autocomplete**: Grouped suggestions (salons, services, cities). Need dropdown design
- [ ] **Filter chips**: Active filters as removable pills. Need chip design
- [ ] **Map pins**: Salon markers with clustering. Need pin design
- [ ] **Quick preview**: Map pin tap → salon preview sheet. Need sheet design

## ON HOMEPAGE
- [ ] **Recently viewed**: localStorage-tracked, max 5. Need card carousel design
- [ ] **Category affinity**: Reorders sections based on user preference. Need section ordering logic
- [ ] **Section toggles**: Admin-controlled via `/api/homepage-sections`. Need to respect toggles
- [ ] **Tutorial tour**: First-visit tooltips (driver.js). Need tooltip design
- [ ] **Trending salons**: From `/api/salons/trending`. Need section design
- [ ] **City salon counts**: Per-city numbers. Need city card design

## ON CHAT
- [ ] **AI reply suggestions**: Gemini-generated for salon owners. Need suggestion chip design
- [ ] **Quick reply chips**: Template replies. Need chip design
- [ ] **Price offers**: In-chat negotiation. Need offer bubble design
- [ ] **Booking bubble**: CTA after 3+ messages. Need bubble design
- [ ] **Photo gallery**: Photos tab in chat. Need gallery design
- [ ] **Typing indicator**: Three-dot animation. Need animation design

## BARBER-SPECIFIC
- [ ] **Walk-in queue**: Real-time status display. Need queue card design
- [ ] **Wait time**: Countdown display. Need timer design
- [ ] **Remote join**: Join queue remotely. Need form design
- [ ] **Express rebook**: 2-tap rebook flow. Need quick-action design
- [ ] **Cut history timeline**: Chronological visits. Need timeline design
- [ ] **Loyalty QR card**: HMAC-signed stamp card. Need card + QR design
- [ ] **Barber profiles**: Portfolio + booking. Need profile page design

## NAIL-SPECIFIC
- [ ] **Material selector**: Gel/acrylic/dip. Need visual selector
- [ ] **Shape + length picker**: 10 SVG shapes + length bars. Need picker design
- [ ] **Inspo board**: Mood board with uploads. Need board design
- [ ] **Hand chart**: Interactive nail selection. Need diagram design
- [ ] **Design history**: Per-client timeline. Need timeline design
- [ ] **Tech portfolio**: Staff portfolio pages. Need gallery design
- [ ] **Allergy warning**: Banner in booking flow. Need warning design
- [ ] **Retail checkout**: POS cart. Need cart design

## CROSS-CATEGORY (dashboard)
- [ ] **Activity feed**: Realtime activity log. Need feed design
- [ ] **Notifications**: Bell + panel. Need notification design
- [ ] **Command palette**: Ctrl+K search. Need palette design
- [ ] **Calendar grid**: Weekly schedule. Need grid design
- [ ] **Heatmap chart**: Day-hour booking intensity. Need heatmap design
- [ ] **Staff comparison**: Performance table/chart. Need table design

---

## DECISIONS ALREADY MADE
- **Dark mode**: KILLED. No ThemeToggle, no ThemeScript, no dark: variants
- **Blobs**: KILLED. No blob backgrounds
- **Old coral identity**: KILLED. New palette: navy, teal, peach, #FFFCFB
