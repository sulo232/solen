// Discovery / Inspo category list. Lives in lib (NOT a "use client" component) so server
// routes (e.g. /api/discovery/category-meta) can import it without bundling client code.
// V3-D391: makeup + waxing dropped (owner: "we don't have makeup and waxing").
export interface CategoryTab {
  key: string;
  labelKey: string;
}

export const DISCOVERY_CATEGORIES: CategoryTab[] = [
  { key: "all", labelKey: "all" },
  { key: "hair", labelKey: "hair" },
  { key: "nails", labelKey: "nails" },
  { key: "lashes", labelKey: "lashes" },
  { key: "brows", labelKey: "brows" },
];

// Bridge from the discovery/Inspo taxonomy (discovery_items.category:
// hair|beard|nails|makeup|waxing|lashes|brows) to the marketplace taxonomy
// (services.category: coiffeur|nails|barbershop|spa). The two are NOT the same
// namespace, only "nails" happens to spell the same in both, so any route that
// joins a discovery category straight into services.category is a silent no-op
// for every other category. Fall back to "coiffeur" for a category with no
// direct marketplace equivalent (makeup, waxing).
export const DISCOVERY_TO_MARKETPLACE_CATEGORY: Record<string, string> = {
  hair: "coiffeur",
  beard: "barbershop",
  nails: "nails",
  lashes: "spa",
  brows: "spa",
};
