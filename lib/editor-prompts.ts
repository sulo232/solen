// NO fs import — static strings only. Works in serverless / edge runtime (Netlify).

// Component index — update this when adding/removing major components
// This is a static snapshot. To keep it current, regenerate via:
//   ls components/**/*.tsx | sed 's/^/components\//' | sort
const COMPONENT_INDEX = `Available components:
components/BookingCalendar.tsx
components/BookingSuccess.tsx
components/CategoryHero.tsx
components/CategoryPage.tsx
components/ChatWindow.tsx
components/CompareBar.tsx
components/CompareDrawer.tsx
components/FilterBar.tsx
components/HomePage.tsx
components/LastMinuteCard.tsx
components/MapView.tsx
components/NearbySalons.tsx
components/ProfilePage.tsx
components/QuartierTile.tsx
components/RecentlyViewed.tsx
components/RecommendedSalons.tsx
components/ReviewBreakdown.tsx
components/ReviewCarousel.tsx
components/SalonCard.tsx
components/ServiceTile.tsx
components/StaffPortfolio.tsx
components/TerminePage.tsx
components/TutorialTour.tsx
components/WaitlistModal.tsx
components/WeatherBanner.tsx
components/auth/
components/chat/
components/dashboard/DashboardLayout.tsx
components/dashboard/MiniSparkline.tsx
components/dashboard/PromoManager.tsx
components/dashboard/SolenScoreCard.tsx
components/editor/ (this feature)
components/layout/
components/loyalty/
components/ui/Spinner.tsx
components/ui/sidebar.tsx
components/ui/Skeleton.tsx
components/ui/SearchBar.tsx`;

// Key schema tables — extracted from CLAUDE.md Section 6
const SCHEMA_CONTEXT = `Key Supabase tables:
- salons: id, owner_id, name, slug, categories[], quartier, is_active, average_rating, solen_score
- services: id, salon_id, name_de, name_en, category, duration_minutes, price, is_active
- bookings: id, user_id, salon_id, service_id, starts_at, ends_at, price_paid, status
- profiles: id, display_name, avatar_url, role (customer/salon_owner/admin), onboarding_completed
- conversations/messages: DM chat system
- feature_requests: admin visual editor requests (this feature)

Pages:
- app/[locale]/page.tsx → HomePage.tsx (main landing)
- app/[locale]/coiffeur|barbershop|nagelstudio|... → CategoryPage.tsx
- app/[locale]/salon/[slug] → salon detail
- app/[locale]/dashboard/ → salon owner dashboard (DashboardLayout.tsx)
- app/[locale]/dashboard/editor/ → this visual editor (admin-only)`;

export function buildRoadmapSystemPrompt(): string {
  return `You are a senior full-stack engineer working on solen.ch, a Next.js App Router beauty & wellness booking platform for Basel, Switzerland.

## Tech Stack
Next.js 15 App Router, TypeScript, Tailwind CSS, Supabase (PostgreSQL + Auth + Storage), Stripe, lucide-react icons, framer-motion, next-intl (de/en/fr/it).

## ${SCHEMA_CONTEXT}

## ${COMPONENT_INDEX}

## Roadmap Creation Rules (MANDATORY — CLAUDE.md Section 12)
You MUST follow ALL these standards:
- R1: Start with a breakage risk assessment table
- R2: Separate manual (🧑) vs code (🤖) phases
- R3: End EVERY phase with a "⚠️ BE CAREFUL" block listing what could go wrong
- R4: Include ✅ DO / ❌ DON'T code examples for every code phase
- R5: Use [NEW]/[MODIFY]/[DELETE] tags with full relative file paths from project root
- R6: End with a dependency ordering table
- R7: Include verification steps per phase (exact git commit command + npm run build)
- R8: Final phase updates CLAUDE.md if introducing new patterns/tables/env vars

## Security Rules (MANDATORY — every API route)
Every API route MUST include ALL 6 layers in order:
1. Feature flag check: checkFeatureEnabled()
2. Auth: getSession()
3. Ban check: checkUserBanned()
4. Role check: profile.role check
5. Rate limit: applyRateLimit()
6. Input validation: validateBody() with zod schema

## Design System Tokens (NEVER deviate)
- Primary: coral #E8735A (class: s-coral)
- Accent: amber #D4870A (s-amber), blue #6BA3C8 (s-blue)
- Text: ink #1A1209 (s-ink), dark mode: #F5EEE4 (s-dm-text)
- Backgrounds: cream #FAF6EF (s-bg-base), white (cards), dark #151009 (s-dm-bg)
- Fonts: Bebas Neue (display ≥40px), Syne (headings), DM Sans (body)
- Radii: rounded-card (12px), rounded-pill (9999px), rounded-btn (8px)
- Icons: lucide-react ONLY. No emoji in UI.

## Banned Tokens (NEVER use in any .tsx file)
text-dark, bg-dark, bg-black, bg-gray-*, text-gray-*, border-gray-*, rounded-lg/md/xl/2xl/3xl, dark:text-white (use dark:text-s-dm-text)

Generate a complete, actionable roadmap that Claude Code can execute without guesswork. Include exact file paths and code diffs.`;
}

export function buildRoadmapUserPrompt(request: {
  page_url: string;
  element_selector?: string;
  element_tag?: string;
  element_text?: string;
  component_hint?: string;
  description: string;
  priority: string;
}): string {
  return `Generate a roadmap for this change request:

**Page**: ${request.page_url}
**Element**: <${request.element_tag || "unknown"}> at selector: "${request.element_selector || "unknown"}"
**Component (best guess)**: ${request.component_hint || "Unknown — check the component list above to identify the right file based on the page URL"}
**Visible text on element**: "${request.element_text || "N/A"}"

**What the admin wants changed**:
"${request.description}"

**Priority**: ${request.priority}

Generate a complete roadmap in markdown format. Include exact file paths, code diffs, and verification steps.`;
}
