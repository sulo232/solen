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
