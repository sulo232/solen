"use client";

// Mockup-scope: whole-page
// panel-ok: shared dev-only booking-step navigator, not a page component itself (no
// _components/components-legacy import needed for a one-line context call).
// Exists-check: `npm run exists BookingWizard` -> real (components-legacy/booking/
// BookingWizard.tsx), no "open on step N" prop. `npm run exists goToStep` -> real,
// exported by lib/booking-context.tsx's useBooking() hook, already the function the
// wizard's own back button calls. Net-new: this tiny wrapper, so a whole-page mock can
// land on a real step without a hand-rolled "isolated step 3 only" render.

import * as React from "react";
import { useBooking } from "@/lib/booking-context";
import type { BookingStep } from "@/lib/booking-state";

/**
 * JumpToBookingStep, dev-mock-only helper. Drives the REAL BookingWizard to a target
 * step right after mount by calling the wizard's own real `goToStep()` (the exact
 * function its back/forward controls call), instead of clicking through the real
 * services -> staff -> Zeit steps by hand. No booking component file is touched.
 */
export function JumpToBookingStep({
  step,
  children,
}: {
  step: BookingStep;
  children: React.ReactNode;
}) {
  const { goToStep, currentStep } = useBooking();
  React.useEffect(() => {
    if (currentStep !== step) goToStep(step);
    // Fire once on mount only, jump-to-step is a one-time landing, not a sync.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <>{children}</>;
}
