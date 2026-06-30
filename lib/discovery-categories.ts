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
