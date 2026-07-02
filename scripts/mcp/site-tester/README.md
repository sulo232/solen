# site-tester MCP server

A local (stdio) MCP server that drives a real headless Chromium browser
(via the `playwright` package, already a project dependency) to smoke-test
a website: load a route and check it rendered clean, or crawl a site and
click every interactive element to catch broken buttons/links/forms.

Not registered anywhere automatically. This README documents how to run
it standalone and how to register it with Claude Code, but the repo's
`.mcp.json` / global config is left untouched.

## What it is

- `crawl.mjs`: the browser-automation engine. Pure functions, no MCP SDK
  imports, so it can be unit-tested directly with plain `node`.
- `index.mjs`: the MCP server entry point (`#!/usr/bin/env node`). Wraps
  `crawl.mjs` in two MCP tools and serves them over stdio via
  `@modelcontextprotocol/sdk`.
- `selftest.mjs`: a standalone self-test (fixture HTTP server + assertions
  against `crawl.mjs`). Run with plain `node`, no MCP client needed.

## Tools

### `check_route`

Loads one URL headless and reports whether it rendered cleanly.

Input: `{ url: string, viewport?: "desktop" | "mobile" }` (viewport defaults
to `"desktop"`).

Output (JSON, as the tool's text content):

```json
{
  "url": "http://localhost:3000/de",
  "httpStatus": 200,
  "ok": true,
  "renderedText": true,
  "consoleErrors": [],
  "failedRequests": [],
  "title": "Solen",
  "screenshotPath": "/tmp/site-tester-screenshots/check-<uuid>.png"
}
```

`ok` is true only when: HTTP status < 400, zero console errors, and the
page rendered visible text.

### `test_site`

Loads a URL, finds every interactive element
(`button, a[href], [role=button], input, select, textarea, [onclick]`),
and exercises each one safely (click / fill), catching errors instead of
letting one bad element abort the run.

Element testing is HERMETIC: the page is enumerated once, then each
interactive element is tested from its own fresh page load. Every non-link
element reloads the page-under-test and re-finds that one element by a
stable selector before acting on it, so one element's click (a form
submit, a `location.href` handler, anything that navigates the current
page) can never invalidate or mis-attribute the test of another element.
Same-origin `<a href>` links are opened in a separate fresh page instead of
reloading the page-under-test, so a broken destination cannot derail the
rest of the run either. Cost: up to `maxElements` page loads per page,
which is the deliberate tradeoff for correctness in a capped smoke test.

Input:
```
{
  url: string,
  maxPages?: number = 1,        // BFS same-origin links when > 1
  sameOriginOnly?: boolean = true,
  viewport?: "desktop" | "mobile" = "desktop",
  maxElements?: number = 50     // per page; capping is reported, never silent
}
```

Output shape:

```json
{
  "startUrl": "http://localhost:3000/",
  "pagesTested": [
    {
      "url": "http://localhost:3000/",
      "elements": [
        { "index": 0, "tag": "a", "label": "Suche", "selector": "#nav-search",
          "href": "/de/search", "action": "navigate", "result": "pass",
          "navigatedTo": "http://localhost:3000/de/search", "httpStatus": 200 },
        { "index": 1, "tag": "button", "label": "Menu", "selector": "button:nth-of-type(1)",
          "action": "click", "result": "fail", "error": "..." },
        { "index": 2, "tag": "button", "label": "Accept", "selector": "#accept-cookies",
          "action": "click-navigated", "result": "pass",
          "navigatedTo": "http://localhost:3000/de/next", "httpStatus": 200 }
      ],
      "elementsFound": 12,
      "elementsTested": 12,
      "capped": false,
      "consoleErrors": [],
      "failedRequests": []
    }
  ],
  "summary": { "pass": 11, "fail": 1, "capped": false }
}
```

`action` values: `"click"` / `"fill"` / `"select"` (acted, did not navigate),
`"navigate"` (an `<a href>` was opened in a fresh page), `"click-navigated"`
(a non-link element's click navigated the page-under-test itself, e.g. a
form submit or a `location.href` handler), `"skip"` (cross-origin link with
`sameOriginOnly=true`, or the element was not visible on its fresh reload),
`"not_found"` (the element's selector did not resolve on a fresh reload,
`result` is always `"fail"` in this case, never a silent pass). A known,
documented limitation: an element that only appears after some OTHER
element's interaction (not on a fresh load of the page-under-test) will be
reported `action:"not_found"`, since every element is tested from an
independent fresh load by design.

## Run it standalone (no MCP client)

```bash
# self-test (fixture server + assertions, exits non-zero on failure)
node scripts/mcp/site-tester/selftest.mjs

# start the MCP server directly, talk JSON-RPC over stdin/stdout
node scripts/mcp/site-tester/index.mjs
```

## Install

Already installed in this repo's `package.json`:

```bash
npm i @modelcontextprotocol/sdk
```

Reuses the existing `playwright` (falls back to `playwright-core` if the
former is unavailable) and the existing Chromium browser binary the repo
already has cached. If Chromium is missing:

```bash
npx playwright install chromium
```

## Register with Claude Code

Not wired up automatically. Two ways to add it, pick one.

### Option A: `.mcp.json` entry (project-scoped, checked in)

Add this entry under `mcpServers` in the project's `.mcp.json` (create the
file if it does not exist):

```json
{
  "mcpServers": {
    "site-tester": {
      "command": "node",
      "args": [
        "scripts/mcp/site-tester/index.mjs"
      ]
    }
  }
}
```

Paths in `.mcp.json` are resolved relative to the project root, so this
works as long as Claude Code is launched from (or configured with) the
repo root as its working directory.

### Option B: `claude mcp add` (local/user-scoped, not checked in)

```bash
claude mcp add site-tester -- node scripts/mcp/site-tester/index.mjs
```

Run from the repo root so the relative script path resolves. Use
`claude mcp add --scope user site-tester -- node /absolute/path/to/scripts/mcp/site-tester/index.mjs`
for a machine-wide registration with an absolute path instead.

## Notes / constraints

- ESM only, zero MCP SDK imports in `crawl.mjs` (kept for testability).
- Every browser instance is closed in a `finally` block; a per-page timeout
  (15s) prevents a hung page from wedging the server.
- `maxElements` capping and `sameOriginOnly` skips are always reported in
  the result, never silently dropped.
- No second browser stack: only `playwright` / `playwright-core`
  (Chromium), matching the existing `@playwright/test` dependency used by
  `npm run test:visual`.
