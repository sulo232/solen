// lib/csp-report.ts
//
// Pure parsing for the CSP violation report endpoint (app/api/csp-report/route.ts). No I/O, no
// Next imports, so this file can be unit tested without a server. It exists to make the
// Report-Only CSP rollout runnable: the header ships with no report-uri/report-to today, so it
// collects zero reports (see netlify.toml). This turns whatever a browser sends into a flat,
// boring shape the route can hand to record_csp_violation.

export type NormalizedCspReport = {
  directive: string;
  blockedUri: string;
  disposition: string | null;
};

type RawCspReportObject = Record<string, unknown>;

// A directive with no value is useless (nothing to act on), so this treats "" the same as
// absent for the DIRECTIVE fields only.
function firstString(obj: RawCspReportObject, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return null;
}

// Same lookup, but "" is a VALID value, not "field absent". Used for blocked-uri/blockedURL:
// some browsers send "" there for inline script/style violations, and that is a real, common
// report (our 'unsafe-inline' policy makes it the most common one), dropping it here would
// reproduce the "reports go to nobody" bug this endpoint exists to fix. Returns null only when
// the key is genuinely missing or not a string, never when it is present and empty.
function firstStringOrEmpty(obj: RawCspReportObject, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string") return value;
  }
  return null;
}

// Normalizes a single report-uri style object: { "csp-report": { ... } } or the bare inner
// object itself, kebab-case fields.
function fromCspReportObject(inner: RawCspReportObject): NormalizedCspReport | null {
  const directive = firstString(inner, "effective-directive", "violated-directive");
  const blockedUri = firstStringOrEmpty(inner, "blocked-uri");
  if (!directive || blockedUri === null) return null;
  const disposition = firstString(inner, "disposition");
  return { directive, blockedUri, disposition };
}

// Normalizes a single report-to style entry: { type, body: { ... } }, camelCase fields inside
// body. Entries whose type is not "csp-violation" (e.g. "deprecation") are not CSP reports at
// all, other report types can share the same endpoint, so those are dropped by the caller.
function fromReportToEntry(entry: RawCspReportObject): NormalizedCspReport | null {
  const body = entry["body"];
  if (typeof body !== "object" || body === null) return null;
  const inner = body as RawCspReportObject;
  const directive = firstString(inner, "effectiveDirective", "violatedDirective");
  const blockedUri = firstStringOrEmpty(inner, "blockedURL", "blockedUri");
  if (!directive || blockedUri === null) return null;
  const disposition = firstString(inner, "disposition");
  return { directive, blockedUri, disposition };
}

/**
 * Parse either wire format into a flat list. Returns [] for anything unrecognised. Never throws.
 *
 * report-uri sends Content-Type: application/csp-report, body { "csp-report": { ...kebab } }.
 * report-to sends Content-Type: application/reports+json, body an ARRAY of
 * { type, body: { ...camelCase } }, only type "csp-violation" entries are CSP reports.
 *
 * The content-type is the primary dispatch, but a missing/unknown content-type falls back to
 * sniffing the parsed shape (object with a "csp-report" key, or an array) rather than dropping
 * the report, browsers are not always consistent about the header.
 */
export function normalizeCspReports(contentType: string | null, rawBody: string): NormalizedCspReport[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return [];
  }

  const type = (contentType ?? "").toLowerCase();
  const looksLikeCspReportObject =
    typeof parsed === "object" && parsed !== null && !Array.isArray(parsed) && "csp-report" in (parsed as RawCspReportObject);
  const looksLikeReportToArray = Array.isArray(parsed);

  // Missing or unrecognised content-type: sniff the parsed shape instead of dropping the
  // report, browsers are not always consistent about what they send for this header.
  const useCspReportShape = type.includes("application/csp-report") || (!type.includes("application/reports+json") && looksLikeCspReportObject);
  const useReportToShape = type.includes("application/reports+json") || (!type.includes("application/csp-report") && looksLikeReportToArray);

  if (useCspReportShape) {
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return [];
    const inner = (parsed as RawCspReportObject)["csp-report"];
    if (typeof inner !== "object" || inner === null) return [];
    const report = fromCspReportObject(inner as RawCspReportObject);
    return report ? [report] : [];
  }

  if (useReportToShape) {
    if (!Array.isArray(parsed)) return [];
    const reports: NormalizedCspReport[] = [];
    for (const entry of parsed) {
      if (typeof entry !== "object" || entry === null) continue;
      const record = entry as RawCspReportObject;
      if (record["type"] !== "csp-violation") continue;
      const report = fromReportToEntry(record);
      if (report) reports.push(report);
    }
    return reports;
  }

  return [];
}

// CSP keyword-source values a browser can report AS the blocked-uri itself, not a URL (CSP3
// keyword-source grammar). This is a CLOSED allowlist on purpose: every value in it is a real,
// known keyword, so anything NOT in this set is either a parseable URL or attacker-influenced
// garbage, never a legitimate keyword this list forgot. "" is included because some browsers
// send it as blocked-uri for inline script/style violations, which is why fromCspReportObject /
// fromReportToEntry above now let "" survive parsing instead of dropping the whole report.
const CSP_KEYWORDS = new Set([
  "inline",
  "eval",
  "self",
  "data",
  "blob",
  "filesystem",
  "about",
  "wasm-eval",
  "wasm-unsafe-eval",
]);

// Applied to a parsed URL's origin too, not just the old raw-string fallback: a crafted
// multi-thousand-char host would otherwise round-trip straight into the table unbounded, since
// new URL().origin does not cap length on its own.
const MAX_ORIGIN_LENGTH = 100;

// Shared bucket for anything that is neither a recognised CSP keyword nor a parseable absolute
// URL. This is a public unauthenticated POST endpoint, so this branch is attacker-influenced and
// has UNBOUNDED cardinality (an attacker can send infinitely many distinct garbage strings). It
// must collapse to ONE fixed value, not round-trip the raw input, or the violations table gets
// one row per distinct piece of garbage rather than staying bounded.
const UNPARSEABLE_SENTINEL = "(unparseable)";

// Readable stand-in for an empty blocked-uri, see CSP_KEYWORDS comment above for why "" arrives
// here at all.
const EMPTY_SENTINEL = "(empty)";

/**
 * Collapse a blocked-uri to the thing you would actually allowlist: an origin, not a path or
 * query string, never the raw attacker-influenced input. This is the boundedness mechanism for
 * the violations table: a recognised CSP keyword passes through unchanged, a parseable absolute
 * URL collapses to its length-capped origin, and everything else (attacker garbage, malformed
 * input) collapses to the single UNPARSEABLE_SENTINEL rather than one row per distinct string.
 * Never throws.
 */
export function toBlockedOrigin(blockedUri: string): string {
  const trimmed = blockedUri.trim();
  if (trimmed === "") return EMPTY_SENTINEL;
  const lower = trimmed.toLowerCase();
  if (CSP_KEYWORDS.has(lower)) return lower;
  try {
    return new URL(trimmed).origin.slice(0, MAX_ORIGIN_LENGTH);
  } catch {
    return UNPARSEABLE_SENTINEL;
  }
}

// Prefixes used by browser extensions and internal browser pages to inject scripts/styles into
// the page. These trip the CSP because of something running in the USER's browser, not because
// of anything our site did, so they are noise that would otherwise drown the real signal.
const IGNORABLE_PREFIXES = [
  "chrome-extension:",
  "moz-extension:",
  "safari-extension:",
  "safari-web-extension:",
  "ms-browser-extension:",
  "webkit-masked-url:",
  "resource:",
  "chrome:",
  "about:",
];

/** True for reports caused by the user's own browser extensions / internal pages, not by our site. */
export function isIgnorableSource(blockedUri: string): boolean {
  const lower = blockedUri.toLowerCase();
  return IGNORABLE_PREFIXES.some((prefix) => lower.startsWith(prefix));
}
