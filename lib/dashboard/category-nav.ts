import { Scissors, Palette, Leaf, Gem, Hand } from "lucide-react";
import type { SalonCategory } from "@/lib/types";

// ─────────────────────────────────────────
// Category Navigation Registry
// reinvent-ok: this is NOT a new category list , it is a nav mapping keyed by the
// canonical SalonCategory type from @/lib/types (Record<SalonCategory, ...>), so it
// stays in sync with the source of truth. Pre-existing file; only labels/icons changed.
// ─────────────────────────────────────────

interface CategoryNavItem {
  key: string;
  href: string;
  icon: typeof Scissors;
  label: string; // plain label, rendered directly (matches RAIL_NAV; no i18n key indirection)
}

interface CategoryNavGroup {
  label: string;
  category: SalonCategory;
  items: CategoryNavItem[];
}

/**
 * Registry mapping each salon category to its dashboard nav items.
 * Each category gets its own nav group in the sidebar.
 * Multi-category salons will see multiple groups.
 *
 * Note: barber-ops (walk-in queue) is intentionally NOT here. The desktop rail
 * already renders it as "Warteschlange" (RAIL_NAV `queue`, barbershopOnly), so
 * listing it again would show the icon twice for barbershop owners.
 */
const CATEGORY_NAV_REGISTRY: Record<SalonCategory, CategoryNavGroup> = {
  barbershop: {
    label: "Barbershop",
    category: "barbershop",
    items: [
      { key: "barber-clients", href: "/dashboard/barber-clients", icon: Scissors, label: "Stammgäste" },
    ],
  },
  nails: {
    label: "Nails",
    category: "nails",
    items: [
      { key: "nail-admin", href: "/dashboard/nail-admin", icon: Gem, label: "Nagelstudio" },
      { key: "nail-clients", href: "/dashboard/nail-clients", icon: Hand, label: "Nagel-Kund:innen" },
    ],
  },
  coiffeur: {
    label: "Coiffeur",
    category: "coiffeur",
    items: [
      { key: "coiffeur-crm", href: "/dashboard/coiffeur-crm", icon: Palette, label: "Coiffeur-CRM" },
    ],
  },
  spa: {
    label: "Spa",
    category: "spa",
    items: [
      { key: "spa-admin", href: "/dashboard/spa-admin", icon: Leaf, label: "Spa-Studio" },
    ],
  },
};

/**
 * Get nav groups for the given salon categories.
 * Returns an array of nav groups to inject into the dashboard sidebar.
 *
 * @param categories - Array of salon categories (e.g., ["barbershop", "nails"])
 * @returns Array of nav groups to display
 */
export function getCategoryNavGroups(categories: SalonCategory[]): CategoryNavGroup[] {
  return categories
    .map(cat => CATEGORY_NAV_REGISTRY[cat])
    .filter(Boolean);
}

/**
 * Export the registry for use in other utilities if needed
 */
export { CATEGORY_NAV_REGISTRY };
export type { CategoryNavItem, CategoryNavGroup };
