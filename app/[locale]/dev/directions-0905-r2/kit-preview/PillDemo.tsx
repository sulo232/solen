"use client";

// exists-check: net-new. Part of the kit's own preview harness (see page.tsx's header comment);
// a tiny client island so the async server page above it can stay a server component while
// still demonstrating Pill's active/inactive toggle.

// reinvent-ok: OPTIONS below are placeholder labels for a component-preview harness (proving
// Pill's active/inactive toggle renders correctly), not a reconstruction of the real
// discovery/search category system (lib/discovery-categories.ts DISCOVERY_CATEGORIES). Pulling
// that list in would require next-intl translation plumbing this isolated kit-test file has no
// reason to carry, and the labels here are never shown as if they were live category data.

// Depicts: a pill row with one active option -> app/[locale]/dev/directions-0905-r2/_kit/Pill.tsx (this kit file, under test)

// Grounded-in: app/[locale]/dev/directions-0905-r2/_kit/Pill.tsx (the component being previewed).

import * as React from "react";
import { Pill } from "../_kit/Pill";

const OPTIONS = ["Option A", "Option B", "Option C", "Option D"];

export function PillDemo() {
  const [activeIndex, setActiveIndex] = React.useState(0);
  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map((label, i) => (
        <Pill key={label} active={activeIndex === i} onClick={() => setActiveIndex(i)}>
          {label}
        </Pill>
      ))}
    </div>
  );
}
