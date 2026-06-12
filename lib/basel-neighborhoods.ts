// Basel neighborhood shortnames — local slang/shortened versions
export const BASEL_NEIGHBORHOODS: Record<string, string> = {
  "4001": "Altstadt",
  "4051": "Altstadt",
  "4052": "Bachletten",
  "4053": "Gundeli",
  "4054": "Bruderholz",
  "4055": "St. Johann",
  "4056": "Iselin",
  "4057": "Matthäus",
  "4058": "Wettstein",
  "4059": "Neubad",
  "4125": "Riehen",
  "4102": "Binningen",
  "4132": "Muttenz",
  "4142": "Münchenstein",
  "4144": "Arlesheim",
  "4153": "Reinach",
  "4123": "Allschwil",
  "4127": "Birsfelden",
};

export function getNeighborhood(zipCode?: string | null): string {
  if (!zipCode) return "Basel";
  return BASEL_NEIGHBORHOODS[zipCode] || zipCode;
}

// Quartier comes from the DB as a raw slug (e.g. `st_johann`, `grossbasel`).
// Display format: underscores → spaces, title-case, "st" → "St." (matches the
// canonical labels above). Hoisted from FeaturedSalonCarousel — the same raw
// slug leaked on SalonCard meta, the PDP chips, and the breadcrumb.
export function formatQuartier(q?: string | null): string {
  if (!q) return "";
  const cleaned = q.replace(/_/g, " ").trim();
  return cleaned
    .split(/\s+/)
    .map((word) => {
      if (word.toLowerCase() === "st") return "St.";
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}
