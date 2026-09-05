// exists-check: net-new vs BookingCard.tsx's own inline `getServiceName` closure (read in
// full before writing this), which is not exported/importable, only inline JSX-adjacent
// code inside a 'use client' component. Extracted as a pure function so this direction's
// hero card and timeline rows can share one derivation instead of re-deriving inline
// twice more.
import type { SeedBookingRow } from "./getBookingsC";

export function serviceName(service: SeedBookingRow["service"], locale: string): string {
  if (!service) return "-";
  const key = `name_${locale}` as keyof typeof service;
  const value = service[key] as string | undefined;
  return value || service.name_de || service.name_en || "-";
}
