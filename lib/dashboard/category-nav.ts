import { Scissors, Armchair, Palette, Sparkles, Leaf, Zap } from "lucide-react";
import type { SalonCategory } from "@/lib/types";

// ─────────────────────────────────────────
// Category Navigation Registry
// ─────────────────────────────────────────

interface CategoryNavItem {
  key: string;
  href: string;
  icon: typeof Scissors;
  labelKey: string; // i18n key
}

interface CategoryNavGroup {
  labelKey: string;
  category: SalonCategory;
  items: CategoryNavItem[];
}

/**
 * Registry mapping each salon category to its dashboard nav items.
 * Each category gets its own nav group in the sidebar.
 * Multi-category salons will see multiple groups.
 */
const CATEGORY_NAV_REGISTRY: Record<SalonCategory, CategoryNavGroup> = {
  barbershop: {
    labelKey: "dashboard.nav.barber_tools",
    category: "barbershop",
    items: [
      { key: "barber-ops", href: "/dashboard/barber-ops", icon: Armchair, labelKey: "dashboard.nav.barber_ops" },
      { key: "barber-clients", href: "/dashboard/barber-clients", icon: Scissors, labelKey: "dashboard.nav.barber_clients" },
    ],
  },
  nails: {
    labelKey: "dashboard.nav.nail_tools",
    category: "nails",
    items: [
      { key: "nail-admin", href: "/dashboard/nail-admin", icon: Sparkles, labelKey: "dashboard.nav.nail_admin" },
      { key: "nail-clients", href: "/dashboard/nail-clients", icon: Sparkles, labelKey: "dashboard.nav.nail_clients" },
    ],
  },
  coiffeur: {
    labelKey: "dashboard.nav.coiffeur_tools",
    category: "coiffeur",
    items: [
      { key: "coiffeur-crm", href: "/dashboard/coiffeur-crm", icon: Palette, labelKey: "dashboard.nav.coiffeur_crm" },
    ],
  },
  spa: {
    labelKey: "dashboard.nav.spa_tools",
    category: "spa",
    items: [
      { key: "spa-admin", href: "/dashboard/spa-admin", icon: Leaf, labelKey: "dashboard.nav.spa_admin" },
    ],
  },
  makeup: {
    labelKey: "dashboard.nav.makeup_tools",
    category: "makeup",
    items: [
      { key: "makeup-admin", href: "/dashboard/makeup-admin", icon: Palette, labelKey: "dashboard.nav.makeup_admin" },
    ],
  },
  waxing: {
    labelKey: "dashboard.nav.waxing_tools",
    category: "waxing",
    items: [
      { key: "waxing-admin", href: "/dashboard/waxing-admin", icon: Zap, labelKey: "dashboard.nav.waxing_admin" },
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
