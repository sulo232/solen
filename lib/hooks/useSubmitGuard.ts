"use client";

import { useCallback, useRef } from "react";

/**
 * Synchronous ref-based mutex for a non-idempotent write (create booking, create
 * payment intent, submit a review, delete an account). A React state flag
 * (`disabled={loading}`) alone does not guard a fast double-click/double-tap: it
 * depends on a re-render landing before the second click fires, which is not
 * guaranteed. `tryEnter()` is checked and set synchronously BEFORE the async call
 * starts, closing that race (states-forms-05, LOCKFILE.md §14.8).
 *
 * Reference pattern this generalizes: `chargeRef` in
 * components-legacy/booking/PayConfirmStep.tsx:111-112,217.
 *
 * @example
 * const guard = useSubmitGuard();
 * const handleSubmit = async () => {
 *   if (!guard.tryEnter()) return; // a submit is already in flight, drop the duplicate
 *   try {
 *     await fetch("/api/...", { method: "POST" });
 *   } finally {
 *     guard.release();
 *   }
 * };
 */
export function useSubmitGuard() {
  const inFlight = useRef(false);

  const tryEnter = useCallback(() => {
    if (inFlight.current) return false;
    inFlight.current = true;
    return true;
  }, []);

  const release = useCallback(() => {
    inFlight.current = false;
  }, []);

  return { tryEnter, release };
}
