#!/usr/bin/env node
// scripts/mcp/site-tester/index.mjs
//
// MCP server entry point (stdio transport). Registers two tools that
// drive a real headless Chromium (via Playwright) to smoke-test a site:
//   check_route  - load one URL, report status/console/screenshot
//   test_site    - crawl a site, click every interactive element, report
//                  a structured pass/fail per element
//
// All browser logic lives in crawl.mjs (kept free of MCP SDK imports so
// it can be unit-tested directly). This file only wires tool schemas to
// crawl.mjs and starts the stdio transport.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { checkRoute, testSite } from "./crawl.mjs";

const server = new McpServer({
  name: "site-tester",
  version: "1.0.0",
});

server.registerTool(
  "check_route",
  {
    title: "Check route",
    description:
      "Load one URL headless in Chromium and report whether it rendered ok: HTTP status, console errors, failed requests, rendered text, and a screenshot path.",
    inputSchema: {
      url: z.string().url().describe("Absolute URL to load, e.g. http://localhost:3000/de"),
      viewport: z
        .enum(["desktop", "mobile"])
        .optional()
        .default("desktop")
        .describe("Viewport preset to render at"),
    },
  },
  async ({ url, viewport }) => {
    try {
      const result = await checkRoute({ url, viewport });
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (err) {
      console.error(`[site-tester] check_route tool failed for ${url}:`, err);
      return {
        isError: true,
        content: [
          { type: "text", text: `check_route failed: ${err.message || String(err)}` },
        ],
      };
    }
  }
);

server.registerTool(
  "test_site",
  {
    title: "Test site",
    description:
      "Load a URL, enumerate interactive elements (buttons, links, inputs, selects, textareas), and click/fill each one safely, catching errors. Optionally crawls same-origin links breadth-first up to maxPages. Returns a structured per-element and per-page pass/fail report, capped at maxElements per page with capping reported explicitly (never silently truncated).",
    inputSchema: {
      url: z.string().url().describe("Absolute URL to start the crawl from"),
      maxPages: z
        .number()
        .int()
        .positive()
        .optional()
        .default(1)
        .describe("Max number of pages to crawl (breadth-first over same-origin links) when > 1"),
      sameOriginOnly: z
        .boolean()
        .optional()
        .default(true)
        .describe("Only follow/navigate same-origin links; cross-origin links are skipped and reported"),
      viewport: z
        .enum(["desktop", "mobile"])
        .optional()
        .default("desktop")
        .describe("Viewport preset to render at"),
      maxElements: z
        .number()
        .int()
        .positive()
        .optional()
        .default(50)
        .describe("Max interactive elements to test per page"),
    },
  },
  async ({ url, maxPages, sameOriginOnly, viewport, maxElements }) => {
    try {
      const result = await testSite({ url, maxPages, sameOriginOnly, viewport, maxElements });
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (err) {
      console.error(`[site-tester] test_site tool failed for ${url}:`, err);
      return {
        isError: true,
        content: [
          { type: "text", text: `test_site failed: ${err.message || String(err)}` },
        ],
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[site-tester] MCP server connected over stdio");
}

main().catch((err) => {
  console.error("[site-tester] fatal error starting server:", err);
  process.exit(1);
});
