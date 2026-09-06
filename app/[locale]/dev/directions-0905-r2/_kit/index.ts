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
