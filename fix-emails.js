// fix-emails.js — Add missing `it` locale entries to email template files
// Strategy: find all `{ de: ..., en: ..., fr: ... }` pattern locale objects
// and add `it: <copy of fr>` to each.

const fs = require("fs");
const path = require("path");

const files = [
  "lib/email.ts",
  "lib/email-templates/booking-notifications.ts",
  "lib/email-templates/welcome-series.ts",
  "lib/email-templates/salon-onboarding.ts",
];

for (const rel of files) {
  const filepath = path.resolve(__dirname, rel);
  if (!fs.existsSync(filepath)) {
    console.log("SKIP (not found):", rel);
    continue;
  }

  let content = fs.readFileSync(filepath, "utf8");
  const lines = content.split("\n");
  const output = [];
  let added = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    output.push(line);

    // Match lines like:  `    fr: `...`,` or `    fr: "...",`
    // We look for a line starting with whitespace + "fr:" that ends with a comma
    // AND the next non-empty line does NOT start with "it:"
    const frMatch = line.match(/^(\s+)fr:\s*/);
    if (frMatch) {
      const indent = frMatch[1];
      // Check if next meaningful line already has "it:"
      let nextIdx = i + 1;
      while (nextIdx < lines.length && lines[nextIdx].trim() === "") nextIdx++;
      const nextLine = nextIdx < lines.length ? lines[nextIdx] : "";
      
      if (!nextLine.match(/^\s+it:\s*/)) {
        // Extract the fr value by taking everything after "fr: "
        const frValueMatch = line.match(/^\s+fr:\s*(.*)/);
        if (frValueMatch) {
          let frValue = frValueMatch[1];
          // Ensure it ends with comma
          if (!frValue.endsWith(",")) {
            frValue = frValue + ",";
          }
          output.push(indent + "it: " + frValue);
          added++;
        }
      }
    }

    // Also handle inline objects like: { de: "", en: "", fr: "" }
    // These are single-line objects that need `it` added
    if (line.includes("{ de:") && line.includes("fr:") && !line.includes("it:")) {
      // Remove the last pushed line and fix it
      output.pop();
      const fixed = line.replace(
        /(\bfr:\s*(?:`[^`]*`|"[^"]*"))\s*\}/g,
        "$1, it: $1 }".replace("it: $1", function() {
          // Actually, let's just do a simpler replacement
          return "it: \"\"";
        })
      );
      // Simpler approach: just before the closing }, insert it: ""
      const fixedLine = line.replace(/\s*\}\s*$/, (m) => {
        return ", it: \"\"" + m;
      }).replace(/\s*\}\s*;?\s*$/, (m) => {
        return m; // already handled
      });
      output.push(fixedLine);
      // Actually this is getting complicated. Let me handle inline objects differently.
    }
  }

  fs.writeFileSync(filepath, output.join("\n"), "utf8");
  console.log("Patched:", rel, "(" + added + " it: entries added)");
}

console.log("Done!");
