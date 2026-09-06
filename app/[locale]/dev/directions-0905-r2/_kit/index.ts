// exists-check: net-new barrel file, no re-proposal. Re-exports the kit's own files only.

/**
 * index.ts - the kit's single import surface. A round-2 mockup does:
 *
 *   import { KitProvider, Pill, StatusBadge, PrimaryButton, SecondaryButton, TextLink, Card,
 *            SectionTitle, Meta, Price, TYPE_RAMP, SPACING, RADIUS, COLOR } from "../_kit";
 *
 * See README.md for the full usage rule.
 */

export * from "./tokens";
export * from "./systems";
export * from "./KitProvider";
export * from "./Pill";
export * from "./StatusBadge";
export * from "./PrimaryButton";
export * from "./SecondaryButton";
export * from "./TextLink";
export * from "./Card";
export * from "./SectionTitle";
export * from "./Meta";
export * from "./Price";
// ROUND 3 additions (_plans/R3_ONE_SYSTEM.md): candidates a/b/c live inside tokens.ts/systems.ts
// above (no new files needed for the value sheets themselves); these two are the new primitives
// Part 3 of ROOT_CAUSES.md names.
export * from "./TimingPill";
export * from "./DateLine";
