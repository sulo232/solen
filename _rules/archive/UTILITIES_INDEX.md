# UTILITIES_INDEX

Canonical inventory of reusable primitives in `components/ui/`, `lib/`, and shared `app/[locale]/_components/`. Updated when a new primitive lands — never let this drift, otherwise duplicates grow.

Per CLAUDE.md "🔍 Duplicate functions" rule: **grep this file first** before creating any new utility, hook, schema, or canonical component.

---

## UI primitives (`components/ui/`)

| Primitive | File | When to use |
|---|---|---|
| **AnimatedTestimonials** | `components/ui/animated-testimonials.tsx` | Aceternity-style testimonial carousel — photo stack with peek rotation, name/designation/quote on the right, word-by-word blur-in animation. Used by `ArtistOfTheMonth` homepage section. |
| **Breadcrumb** | `components/ui/breadcrumb.tsx` | Navigation hierarchy indicator. shadcn-ui pattern adapted to Solen V3 tokens (Hanken Grotesk body, s-ink-2 secondary text, s-brand focus ring). Composition: `Breadcrumb > BreadcrumbList > BreadcrumbItem > BreadcrumbLink \| BreadcrumbPage`. Use `BreadcrumbSeparator` between items and `BreadcrumbEllipsis` to collapse long trails. |
| **Card** | `components/ui/card.tsx` | Generic content wrapper. shadcn-ui pattern adapted to Solen tokens (rounded-card 16px, V3-D72 unified shadow `0 6px 24px rgba(0,0,0,0.06)`, s-bg.surface white bg). Composition: `Card > CardHeader (CardTitle + CardDescription) > CardContent > CardFooter`. All parts optional. Use anywhere `SalonCard` is too domain-specific. |

### Breadcrumb canonical usage

This is the locked pattern for breadcrumbs across the app — any breadcrumb anywhere uses this composition exactly:

```tsx
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { HouseIcon } from "lucide-react";

export function ExampleBreadcrumb() {
  return (
    <Card className="p-2">
      <CardContent className="px-1 py-0">
        <Breadcrumb>
          <BreadcrumbList className="gap-1.5 sm:gap-1.5">
            <BreadcrumbItem>
              <BreadcrumbLink href="#" className="flex items-center gap-1.5">
                <HouseIcon className="size-4" aria-hidden="true" />
                Home
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Salons</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-semibold">
                Salon Maria
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </CardContent>
    </Card>
  );
}
```

**Rules for any breadcrumb in the app:**

1. Always wrap in a `<Card>` with `p-2` and `<CardContent>` with `px-1 py-0` — gives the trail a contained surface that floats on the page.
2. First item gets a leading icon (e.g. `HouseIcon`) sized via `className="size-4"` with `aria-hidden="true"`.
3. Last item is `<BreadcrumbPage>` (the current page) with `className="font-semibold"` — non-clickable, marked as `aria-current="page"` automatically.
4. Intermediate items are `<BreadcrumbLink>` with `href` — they're real links.
5. `<BreadcrumbSeparator />` between every pair; defaults to a chevron-right icon.
6. Use `<BreadcrumbEllipsis />` to collapse middle items when the trail is too long for mobile (>3 items on small screens).

**Where to use:** salon detail page header, search results breadcrumbs, account settings nav, any page deep in the hierarchy. Do NOT use on the homepage (top-level) or on app-shell screens (auth flow).

---

## Shared homepage components (`app/[locale]/_components/homepage/`)

| Component | File | When to use |
|---|---|---|
| **SalonCard** | `SalonCard.tsx` | Salon listing — photo + name + address · city + nextSlot · CHF + ★ rating. Used in every horizontal feed row. |
| **HeartButton** | `HeartButton.tsx` | Floating save heart with V3-D72 glass + V3-D73 44px touch target + V2-D43 pop animation. |
| **SectionHeader / Section / SectionFrame / ScrollRow / FeedZone** | `SectionHeader.tsx` | Section wrapper system — Section gives mx-auto + max-w + padding. SectionFrame gives overflow-hidden + scroll-row bleed padding. SectionTitle gives h2 + optional arrow chip + see-more link. ScrollRow is the horizontal scroll container. FeedZone is the rising-panel that holds all feed sections. |
| **JoinUsCard** | (private in `BentoBusiness.tsx`) | Full-screen-modal expand pattern for high-stakes CTAs. Reference impl for any "click to reveal large form" interaction. |
| **BentoCard** | (private in `BentoBusiness.tsx`) | Cursor-tilt + scroll-fade-up + animated visual card. Reference impl for any Apple-style interactive feature card. |

---

## lib/ utilities

| Utility | File | Purpose |
|---|---|---|
| `cn` | `lib/utils.ts` | Tailwind class merger (clsx + tailwind-merge). Use whenever combining static + conditional classes. |
| `getSessionUser` | `lib/supabase.ts` | Server-component-safe session reader. Always use this — never read session in client components directly. |

---

**Discipline:** when adding a new primitive, add the row HERE in the same commit. When removing, delete the row. When renaming, update.

CLAUDE.md memory rule active: "stale index = AI grows duplicates again → enforcement decays."
