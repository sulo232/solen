// performance-02: the one performance budget the design system already locked
// (LCP <= 2.5s, LOCKFILE.md) turned into a machine-checked number instead of a
// manual per-wave Lighthouse pass. Runs against a real `next build` + `next
// start` (same shape as the `visual`/`motion` CI jobs) for a small named set of
// representative, real-data routes: home, a city/category browse page, and the
// sanctioned test-salon PDP.
//
// Real INP cannot be measured in a lab run (it needs field interaction data),
// so this asserts Lighthouse's own closest lab proxy, Total Blocking Time,
// per web.dev's own guidance on approximating INP without field data. CLS and
// LCP are asserted directly, they ARE lab-measurable.
//
//   Run locally: npx lhci autorun (after `npm run build && npx next start -p 3001`)
//   CI: the `lighthouse` job in .github/workflows/quality.yml (secrets-gated,
//   same skip-green pattern as the `visual`/`motion` jobs).
module.exports = {
  ci: {
    collect: {
      url: [
        "http://localhost:3001/de",
        "http://localhost:3001/de/basel/coiffeur",
        "http://localhost:3001/de/salon/testsalon-7a2dd244",
      ],
      numberOfRuns: 1,
      settings: {
        // Mobile is the stricter, more representative target (LOCKFILE's own
        // "iOS Safari is the strictest perf budget" note); Lighthouse CI
        // defaults to a mobile-emulated throttled run already.
        onlyCategories: ["performance"],
      },
    },
    assert: {
      assertions: {
        "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
        // INP lab proxy (see file header comment).
        "total-blocking-time": ["error", { maxNumericValue: 500 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: "./.lighthouseci",
    },
  },
};
