// exists-check: net-new. Researched 2026-06-21 (4-agent sweep) — no existing hair-DNA / persona
// derivation exists anywhere; this is the gap the dup-check flagged ("need a lib/persona/deriv.ts").
// Builds ON real data (do NOT duplicate): bookings (completed, non-refunded), loyalty_status
// (visits/tier — already computed by recompute_loyalty_status RPC), client_formulas (shade_code,
// developer_volume), and the onboarding selections in profiles.customer_preferences.persona.
//
// PURE + deterministic: takes already-fetched rows + selections, returns the Hair DNA. No DB/auth
// here (the API route fetches + calls this), so it is unit-testable and reusable web + mobile.

export type PersonaSelection = {
  gender?: string | null;
  color?: string | null;   // brown | blonde | copper | balayage | black
  shape?: string | null;
  goal?: string | null;    // lighter | maintain | repair | switch
  bleach?: string | null;  // recent | past | never
  cadence?: string | null; // weeks | monthly | seasonal
};

export type BookingLite = {
  starts_at: string;                 // ISO
  status?: string | null;
  refunded_amount?: number | null;   // >0 => exclude
  price_paid?: number | null;
  category?: string | null;          // services.category
  staff_member_id?: string | null;
  extras_bleaching?: boolean | null;
};

export type FormulaLite = {
  shade_code?: string | null;        // e.g. "8/1", "7/0"
  developer_volume?: string | null;  // e.g. "6%", "20 vol"
  created_at?: string | null;
};

export type LoyaltyLite = { visits?: number | null; tier?: string | null } | null;

export type HairDna = {
  colorIdentity: { label: string; warmCool: "cool" | "warm" | "neutral" | null; source: "formula" | "selection" | "unknown" };
  lightener: { level: "virgin" | "light" | "medium" | "heavy"; vol: number | null };
  rhythm: { avgDays: number | null; label: string; dueDateISO: string | null; overdue: boolean };
  serviceMix: { dominant: string | null; breakdown: Record<string, number> };
  stylist: { dominantId: string | null; loyalty: "devoted" | "regular" | "explorer" | "unknown"; share: number | null };
  vibe: string | null;
  visits: number;
  confidence: "seed" | "emerging" | "established"; // how much real history backs it
  tagline: string;
};

const COLOR_LABEL: Record<string, string> = { brown: "Brunette", blonde: "Cool blonde", copper: "Copper", balayage: "Balayage", black: "Jet black" };
const COLOR_WARMCOOL: Record<string, "cool" | "warm" | "neutral"> = { brown: "neutral", blonde: "cool", copper: "warm", balayage: "cool", black: "neutral" };
const VIBE: Record<string, string> = { lighter: "on a lightening journey", maintain: "low-maintenance", repair: "repair-focused", switch: "loves a change" };
const CADENCE_SEED_DAYS: Record<string, number> = { weeks: 42, monthly: 56, seasonal: 112 };

const day = 86_400_000;

function completed(bookings: BookingLite[]): BookingLite[] {
  return bookings
    .filter((b) => (b.status ?? "completed") === "completed" && (b.refunded_amount ?? 0) <= 0 && !!b.starts_at)
    .sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at));
}

// Wella/L'Oréal "level/tone" — tone digit after the slash: 1,2,8,9 cool · 3,4,5,6 warm · 0,7 neutral.
function shadeWarmCool(shade?: string | null): "cool" | "warm" | "neutral" | null {
  if (!shade) return null;
  const m = shade.match(/\d+\s*[\/.]\s*(\d)/);
  if (!m) return null;
  const tone = +m[1];
  if ([1, 2, 8, 9].includes(tone)) return "cool";
  if ([3, 4, 5, 6].includes(tone)) return "warm";
  return "neutral";
}

// developer_volume is freeform TEXT ("6%", "20 vol", "30"). Normalise to vol (10/20/30/40).
// % notation (<=12) maps 3%→10, 6%→20, 9%→30, 12%→40; otherwise it's already a vol number.
function parseVol(dev?: string | null): number | null {
  if (!dev) return null;
  const m = dev.match(/(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  const isPercent = dev.includes("%") || n <= 12;
  return isPercent ? Math.round((n / 12) * 40) : Math.round(n);
}

export function deriveHairDna(input: {
  selection?: PersonaSelection;
  bookings?: BookingLite[];
  formulas?: FormulaLite[];
  loyalty?: LoyaltyLite;
  now?: Date;
}): HairDna {
  const sel = input.selection ?? {};
  const bk = completed(input.bookings ?? []);
  const formulas = (input.formulas ?? []).slice().sort((a, b) => +new Date(b.created_at ?? 0) - +new Date(a.created_at ?? 0));
  const now = input.now ?? new Date();
  const visits = input.loyalty?.visits ?? bk.length;

  // ---- colour identity (latest real formula wins; else selection) ----
  const latestShade = formulas.find((f) => f.shade_code)?.shade_code ?? null;
  const fromFormula = shadeWarmCool(latestShade);
  let colorIdentity: HairDna["colorIdentity"];
  if (fromFormula && latestShade) {
    colorIdentity = { label: sel.color ? COLOR_LABEL[sel.color] ?? "Custom" : `Shade ${latestShade}`, warmCool: fromFormula, source: "formula" };
  } else if (sel.color) {
    colorIdentity = { label: COLOR_LABEL[sel.color] ?? "Custom", warmCool: COLOR_WARMCOOL[sel.color] ?? null, source: "selection" };
  } else {
    colorIdentity = { label: "Not set", warmCool: null, source: "unknown" };
  }

  // ---- lightener intensity (max developer vol + bleach frequency + selection) ----
  const vols = formulas.map((f) => parseVol(f.developer_volume)).filter((v): v is number => v != null);
  const maxVol = vols.length ? Math.max(...vols) : null;
  const bleachCount = bk.filter((b) => b.extras_bleaching).length;
  let level: HairDna["lightener"]["level"] = "virgin";
  if (sel.bleach === "recent" || bleachCount >= 2 || (maxVol ?? 0) >= 40) level = "heavy";
  else if (sel.bleach === "past" || bleachCount === 1 || (maxVol ?? 0) >= 30) level = "medium";
  else if ((maxVol ?? 0) >= 20) level = "light";
  else level = sel.bleach === "never" ? "virgin" : "virgin";

  // ---- rhythm (median gap of completed visits; else selection seed) ----
  let avgDays: number | null = null;
  if (bk.length >= 2) {
    const gaps: number[] = [];
    for (let i = 1; i < bk.length; i++) gaps.push((+new Date(bk[i].starts_at) - +new Date(bk[i - 1].starts_at)) / day);
    gaps.sort((a, b) => a - b);
    avgDays = Math.round(gaps[Math.floor(gaps.length / 2)]);
  } else if (sel.cadence) {
    avgDays = CADENCE_SEED_DAYS[sel.cadence] ?? null;
  }
  const lastVisit = bk.length ? new Date(bk[bk.length - 1].starts_at) : null;
  const dueDate = lastVisit && avgDays ? new Date(+lastVisit + avgDays * day) : null;
  const rhythmLabel = avgDays == null ? "Rhythm forming" : avgDays <= 49 ? `~${Math.round(avgDays / 7)}-week rhythm` : avgDays <= 75 ? "~Monthly" : "Seasonal";

  // ---- service mix ----
  const breakdown: Record<string, number> = {};
  for (const b of bk) if (b.category) breakdown[b.category] = (breakdown[b.category] ?? 0) + 1;
  const dominant = Object.entries(breakdown).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // ---- stylist loyalty ----
  const byStylist: Record<string, number> = {};
  for (const b of bk) if (b.staff_member_id) byStylist[b.staff_member_id] = (byStylist[b.staff_member_id] ?? 0) + 1;
  const top = Object.entries(byStylist).sort((a, b) => b[1] - a[1])[0] ?? null;
  const stylistVisits = Object.values(byStylist).reduce((s, n) => s + n, 0);
  const share = top && stylistVisits ? top[1] / stylistVisits : null;
  let loyalty: HairDna["stylist"]["loyalty"] = "unknown";
  if (stylistVisits >= 3 && share != null) loyalty = share >= 0.8 ? "devoted" : share >= 0.5 ? "regular" : "explorer";

  const vibe = sel.goal ? VIBE[sel.goal] ?? null : null;
  const confidence: HairDna["confidence"] = bk.length >= 4 ? "established" : bk.length >= 2 ? "emerging" : "seed";

  // ---- one-line characterisation ----
  const bits = [colorIdentity.label !== "Not set" ? colorIdentity.label : null, vibe].filter(Boolean);
  const tail = avgDays ? ` — ${rhythmLabel.replace("~", "~")}` : "";
  const tagline = (bits.join(", ") || "Your hair profile") + tail + (rhythm_overdue(dueDate, now) ? " · due now" : "");

  return {
    colorIdentity,
    lightener: { level, vol: maxVol },
    rhythm: { avgDays, label: rhythmLabel, dueDateISO: dueDate ? dueDate.toISOString() : null, overdue: rhythm_overdue(dueDate, now) },
    serviceMix: { dominant, breakdown },
    stylist: { dominantId: top?.[0] ?? null, loyalty, share },
    vibe,
    visits,
    confidence,
    tagline,
  };
}

function rhythm_overdue(due: Date | null, now: Date): boolean {
  return !!due && +now > +due;
}
