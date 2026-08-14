// tests/lib/csp-report.test.ts
//
// lib/csp-report.ts is the parsing layer for app/api/csp-report/route.ts, the endpoint that
// makes the Report-Only CSP rollout in netlify.toml runnable (it currently reports to nobody).
// Pure functions, no I/O, no mocks needed. Each test pins one specific behavior the endpoint
// depends on, so a refactor cannot quietly break the wire-format parsing or the origin
// collapsing that keeps csp_violation_reports bounded.

import { describe, it, expect } from "vitest";
import { normalizeCspReports, toBlockedOrigin, isIgnorableSource } from "@/lib/csp-report";

describe("normalizeCspReports: report-uri wire format (application/csp-report)", () => {
  // A real report-uri body: single object, kebab-case fields, wrapped in "csp-report". This is
  // the fallback path for browsers that do not support report-to.
  it("parses a genuine application/csp-report body into 1 report with directive + blocked uri", () => {
    const body = JSON.stringify({
      "csp-report": {
        "document-uri": "https://solen.ch/de",
        "violated-directive": "script-src",
        "effective-directive": "script-src",
        "blocked-uri": "https://evil.example.com/x.js",
        disposition: "report",
      },
    });
    const reports = normalizeCspReports("application/csp-report", body);
    expect(reports).toHaveLength(1);
    expect(reports[0].directive).toBe("script-src");
    expect(reports[0].blockedUri).toBe("https://evil.example.com/x.js");
    expect(reports[0].disposition).toBe("report");
  });

  // effective-directive is not always present, violated-directive is the documented fallback.
  it("falls back to violated-directive when effective-directive is absent", () => {
    const body = JSON.stringify({
      "csp-report": {
        "violated-directive": "img-src",
        "blocked-uri": "https://cdn.example.com/img.png",
      },
    });
    const reports = normalizeCspReports("application/csp-report", body);
    expect(reports).toHaveLength(1);
    expect(reports[0].directive).toBe("img-src");
  });
});

describe("normalizeCspReports: report-to wire format (application/reports+json)", () => {
  // A real report-to body: an array, camelCase fields nested under "body". This is the
  // successor format, browsers that support it ignore report-uri entirely.
  it("parses a genuine batch of 2 reports, camelCase mapped", () => {
    const body = JSON.stringify([
      {
        type: "csp-violation",
        age: 10,
        url: "https://solen.ch/de",
        body: {
          blockedURL: "https://evil.example.com/a.js",
          effectiveDirective: "script-src",
          disposition: "enforce",
          documentURL: "https://solen.ch/de",
        },
      },
      {
        type: "csp-violation",
        age: 12,
        url: "https://solen.ch/de",
        body: {
          blockedURL: "https://tracker.example.com/pixel.gif",
          effectiveDirective: "img-src",
          disposition: "report",
          documentURL: "https://solen.ch/de",
        },
      },
    ]);
    const reports = normalizeCspReports("application/reports+json", body);
    expect(reports).toHaveLength(2);
    expect(reports[0]).toEqual({ directive: "script-src", blockedUri: "https://evil.example.com/a.js", disposition: "enforce" });
    expect(reports[1]).toEqual({ directive: "img-src", blockedUri: "https://tracker.example.com/pixel.gif", disposition: "report" });
  });

  // report-to is a shared endpoint format, other report types (deprecation, intervention, ...)
  // can land here too. Anything that is not type "csp-violation" must be ignored, not
  // misparsed as a CSP report.
  it("ignores a non csp-violation entry (e.g. type: deprecation) in a reports+json batch", () => {
    const body = JSON.stringify([
      {
        type: "deprecation",
        body: { id: "someDeprecatedApi", message: "old API used" },
      },
      {
        type: "csp-violation",
        body: { blockedURL: "https://evil.example.com/a.js", effectiveDirective: "script-src" },
      },
    ]);
    const reports = normalizeCspReports("application/reports+json", body);
    expect(reports).toHaveLength(1);
    expect(reports[0].blockedUri).toBe("https://evil.example.com/a.js");
  });
});

describe("normalizeCspReports: malformed input", () => {
  // A browser sending a truncated/corrupt body must never crash the endpoint. This is the
  // first line the route checks before doing anything else with the payload.
  it("returns [] for malformed JSON and does not throw", () => {
    expect(() => normalizeCspReports("application/csp-report", "{not json")).not.toThrow();
    expect(normalizeCspReports("application/csp-report", "{not json")).toEqual([]);
  });
});

describe("normalizeCspReports: empty blocked-uri must survive, not be dropped (round 2 fix)", () => {
  // Round 1's firstString() treated "" as "field absent" and dropped the whole report. That is
  // exactly backwards: an empty blocked-uri is what browsers send for inline script/style
  // violations, the single most common thing our 'unsafe-inline' policy will report. Losing it
  // silently reproduces the "reports go to nobody" bug this endpoint exists to fix.
  it("keeps a report with blocked-uri: \"\" in the application/csp-report format (length 1, not [])", () => {
    const body = JSON.stringify({
      "csp-report": {
        "violated-directive": "script-src",
        "effective-directive": "script-src",
        "blocked-uri": "",
      },
    });
    const reports = normalizeCspReports("application/csp-report", body);
    expect(reports).toHaveLength(1);
    expect(reports[0].directive).toBe("script-src");
    expect(reports[0].blockedUri).toBe("");
  });

  it("keeps a report with blockedURL: \"\" in the application/reports+json format (length 1, not [])", () => {
    const body = JSON.stringify([
      {
        type: "csp-violation",
        body: { blockedURL: "", effectiveDirective: "style-src" },
      },
    ]);
    const reports = normalizeCspReports("application/reports+json", body);
    expect(reports).toHaveLength(1);
    expect(reports[0].directive).toBe("style-src");
    expect(reports[0].blockedUri).toBe("");
  });
});

describe("toBlockedOrigin: the boundedness mechanism", () => {
  // This is what actually keeps csp_violation_reports small: a path/query is collapsed away,
  // only the origin (the thing you would allowlist) survives.
  it("collapses a url with path + query to just its origin", () => {
    expect(toBlockedOrigin("https://cdn.x.com/a/b.png?sig=1")).toBe("https://cdn.x.com");
  });

  // "inline" is a real, known CSP keyword (in the closed CSP_KEYWORDS allowlist), it passes
  // through unchanged rather than falling into the unparseable bucket.
  it("passes a recognised CSP keyword through unchanged", () => {
    expect(toBlockedOrigin("inline")).toBe("inline");
  });

  // Round 1's catch-block fallback only lowercased + truncated the raw string, so it did not
  // collapse anything: two different pieces of attacker garbage produced two different rows.
  // The endpoint is a public unauthenticated POST, so this is the exact property that has to
  // hold for the table to stay bounded: unrecognised input must land in ONE shared bucket.
  it("collapses two DIFFERENT unparseable garbage strings to the SAME sentinel", () => {
    const a = toBlockedOrigin("garbage-token-aaaa?nonce=1111111111");
    const b = toBlockedOrigin("garbage-token-bbbb?nonce=2222222222");
    expect(a).toBe(b);
    expect(a).toBe("(unparseable)");
  });

  // An empty blocked-uri (see the normalizeCspReports describe block above for why "" now
  // survives parsing) needs its own readable value, distinct from both a keyword and the
  // unparseable bucket.
  it("maps an empty blocked-uri to a readable empty sentinel", () => {
    expect(toBlockedOrigin("")).toBe("(empty)");
  });

  // Round 1 had NO length cap on the success path at all, only the catch-block fallback was
  // capped. A crafted, absurdly long but syntactically valid URL would have round-tripped its
  // entire host straight into the table.
  it("caps a syntactically valid but absurdly long URL's origin, does not return it unbounded", () => {
    const hugeHost = "a".repeat(5000);
    const result = toBlockedOrigin(`https://${hugeHost}.com/x`);
    expect(result.length).toBeLessThanOrEqual(100);
    expect(result.length).not.toBe(new URL(`https://${hugeHost}.com/x`).origin.length);
  });

  // Boundary check on the 100-char origin cap: exactly at the limit is untouched, one char over
  // is truncated to exactly 100.
  it("origin length cap boundary: exactly 100 chars survives whole, 101 chars is truncated to 100", () => {
    const at100 = `https://${"b".repeat(88)}.com`; // origin length: 8 + 88 + 4 = 100
    const at101 = `https://${"b".repeat(89)}.com`; // origin length: 8 + 89 + 4 = 101
    expect(new URL(at100).origin).toHaveLength(100);
    expect(new URL(at101).origin).toHaveLength(101);
    expect(toBlockedOrigin(at100)).toBe(at100);
    expect(toBlockedOrigin(at101)).toHaveLength(100);
    expect(toBlockedOrigin(at101)).toBe(new URL(at101).origin.slice(0, 100));
  });
});

describe("isIgnorableSource: browser-extension noise", () => {
  // Extension-injected scripts trip the CSP because of the user's own browser, not our site,
  // this is what stops that noise from drowning the real signal.
  it("flags a chrome-extension:// uri as ignorable", () => {
    expect(isIgnorableSource("chrome-extension://abc/x.js")).toBe(true);
  });

  it("does not flag a normal https uri as ignorable", () => {
    expect(isIgnorableSource("https://evil.example.com/x.js")).toBe(false);
  });
});
