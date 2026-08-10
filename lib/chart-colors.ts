// lib/chart-colors.ts
//
// color-tokens-08: LOCKFILE.md's Chart-grey section states a color-derivation
// FORMULA in prose ("when a dashboard chart needs >2 distinct series, derive
// hues in OKLCH from s-accent: fixed lightness+chroma, hue stepped +25-30 per
// series") with no code anywhere implementing it. A rule that requires manual
// OKLCH math with no helper function does not get followed; the next chart
// just reaches for arbitrary Tailwind palette colors (exactly what drift rule
// A15 exists to forbid). This file is the reference implementation.
//
// OKLab/OKLCH conversion per Bjorn Ottosson (2020), the standard public
// formulas behind the CSS Color 4 oklch() function.

type Oklch = { l: number; c: number; h: number }; // h in degrees [0, 360)

function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function linearToSrgb(c: number): number {
  const clamped = Math.min(Math.max(c, 0), 1);
  return clamped <= 0.0031308
    ? clamped * 12.92
    : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
}

function hexToLinearRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = parseInt(full, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return [srgbToLinear(r / 255), srgbToLinear(g / 255), srgbToLinear(b / 255)];
}

/** hex (sRGB) -> OKLCH. */
export function hexToOklch(hex: string): Oklch {
  const [r, g, b] = hexToLinearRgb(hex);

  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const bLab = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

  const c = Math.sqrt(a * a + bLab * bLab);
  let h = (Math.atan2(bLab, a) * 180) / Math.PI;
  if (h < 0) h += 360;

  return { l: L, c, h };
}

/** OKLCH -> hex (sRGB, gamut-clamped). */
export function oklchToHex({ l: L, c, h }: Oklch): string {
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const bLab = c * Math.sin(hRad);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * bLab;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * bLab;
  const s_ = L - 0.0894841775 * a - 1.291485548 * bLab;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const rLin = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bLin = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  const r = Math.round(linearToSrgb(rLin) * 255);
  const g = Math.round(linearToSrgb(gLin) * 255);
  const b = Math.round(linearToSrgb(bLin) * 255);

  const toHex = (n: number) => Math.min(255, Math.max(0, n)).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

const S_ACCENT_HEX = "#276EF1";
const DEFAULT_HUE_STEP = 27.5; // midpoint of LOCKFILE's "+25-30 per series"

/**
 * Perceptually-even multi-series chart palette, per LOCKFILE.md's Chart-grey
 * section: derive hues in OKLCH from s-accent, fixed lightness + chroma, hue
 * stepped ~27.5deg per series. Use ONLY when a dashboard chart needs >2
 * DISTINCT series (not hierarchy) -- customer surfaces and 2-series charts
 * keep the discrete s-ink/s-chart-2/s-chart-3 grey scale instead.
 */
export function chartSeriesColors(count: number, hueStep: number = DEFAULT_HUE_STEP): string[] {
  if (count <= 0) return [];
  const base = hexToOklch(S_ACCENT_HEX);
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    const h = (base.h + i * hueStep) % 360;
    colors.push(oklchToHex({ l: base.l, c: base.c, h }));
  }
  return colors;
}

// ---------------------------------------------------------------------------
// Self-test (run: node --loader ts-node/esm lib/chart-colors.ts, or import
// runSelfTest() from a test file). Verifies round-trip conversion accuracy
// and prints the worked example LOCKFILE.md references.
// ---------------------------------------------------------------------------

export function runSelfTest(): boolean {
  let ok = true;

  // Round-trip: hex -> OKLCH -> hex should reproduce the original within
  // sRGB rounding tolerance for a handful of known Solen tokens.
  const roundTripCases = ["#276EF1", "#0A0A0A", "#16A34A", "#DC2626", "#FFFFFF"];
  for (const hex of roundTripCases) {
    const oklch = hexToOklch(hex);
    const back = oklchToHex(oklch);
    const pass = back === hex;
    console.log(`${pass ? "PASS" : "FAIL"}  round-trip ${hex} -> OKLCH(${oklch.l.toFixed(3)}, ${oklch.c.toFixed(3)}, ${oklch.h.toFixed(1)}) -> ${back}`);
    if (!pass) ok = false;
  }

  // Worked example: a 4-series chart derived from s-accent.
  const series = chartSeriesColors(4);
  console.log(`\ns-accent (${S_ACCENT_HEX}) 4-series derivation, hue step ${DEFAULT_HUE_STEP}deg:`);
  series.forEach((hex, i) => console.log(`  series ${i + 1}: ${hex}`));

  // The derived series should all share L and C with s-accent (fixed
  // lightness+chroma, per LOCKFILE), varying only in hue.
  const baseOklch = hexToOklch(S_ACCENT_HEX);
  for (let i = 0; i < series.length; i++) {
    const derived = hexToOklch(series[i]);
    const lMatch = Math.abs(derived.l - baseOklch.l) < 0.01;
    const cMatch = Math.abs(derived.c - baseOklch.c) < 0.03; // gamut clamping can shift chroma slightly
    console.log(`${lMatch && cMatch ? "PASS" : "FAIL"}  series ${i + 1} keeps L/C close to s-accent (L diff ${Math.abs(derived.l - baseOklch.l).toFixed(4)}, C diff ${Math.abs(derived.c - baseOklch.c).toFixed(4)})`);
    if (!lMatch || !cMatch) ok = false;
  }

  console.log(`\n${ok ? "ALL PASS" : "SOME FAILED"}`);
  return ok;
}

// Allow `node --experimental-strip-types lib/chart-colors.ts` (or a ts-node
// runner) to self-test directly.
if (typeof require !== "undefined" && require.main === module) {
  const passed = runSelfTest();
  process.exitCode = passed ? 0 : 1;
}
