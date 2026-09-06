"use client";

// exists-check: net-new. `npm run exists kit` found no existing provider/context of this shape;
// the closest thing in the repo is React context used per-feature (e.g. booking flow state),
// never a design-system-level "which look system is active" context.
//
// Depicts: which look system a mockup belongs to -> NET-NEW: no per-mockup system-context
// provider exists today; this is pure plumbing over the real decision, which lives in
// systems.ts's SYSTEMS map.
//
// Grounded-in: app/[locale]/dev/directions-0905-r2/_kit/systems.ts (the SYSTEMS map this
// provider hands down through context; this file adds no new design decisions of its own, only
// the plumbing to read one). Plain React context, no external state library: one string in
// context, one hook to read it, so every kit component can ask "which system am I in" without
// threading a prop through every layer of a mockup.

import * as React from "react";
import { SYSTEMS, type SystemKey, type SystemEntry } from "./systems";

const KitSystemContext = React.createContext<SystemKey>("lift");

export interface KitProviderProps {
  /** The look system this mockup belongs to. A mockup belongs to exactly one (R2_LOOK_SYSTEMS.md,
   * "How to read this"): "lift", "rule" or "tray". */
  system: SystemKey;
  children: React.ReactNode;
}

/** Wrap a mockup's tree in this once, at the top, so every kit component underneath reads the
 * active system via useSystem(). A mockup never passes `system` to each component individually. */
export function KitProvider({ system, children }: KitProviderProps) {
  return <KitSystemContext.Provider value={system}>{children}</KitSystemContext.Provider>;
}

/** Returns the active system's full entry (definition, deltas, discriminator). Call this from
 * inside a <KitProvider>; falls back to "lift" outside one so a component never crashes, but a
 * fallback firing means a mockup forgot to wrap its tree. */
export function useSystem(): SystemEntry {
  const key = React.useContext(KitSystemContext);
  return SYSTEMS[key];
}

/** Returns just the active system's key, for the rare case a component needs the string rather
 * than the full entry (e.g. a data attribute for a critic to grep). */
export function useSystemKey(): SystemKey {
  return React.useContext(KitSystemContext);
}
