"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

/**
 * FooterGate: hides the site marketing footer on focused/terminal flows, mirroring
 * Breadcrumb.tsx's own EXCLUDED-list pattern (client component, usePathname, exact-prefix match).
 *
 * Was previously a bare children-wrapper that only dropped `/booking` (never actually mounted
 * anywhere, HideInBooking already covers `/booking` unconditionally at layout.tsx). Repurposed
 * (not duplicated, see CLAUDE.md's exists-check protocol) to own the Footer render itself, so it
 * can gate on `locale` + pathname the same way Breadcrumb does, and to add `/confirmation`: that
 * screen is terminal (a receipt, not a browsing surface, see BookingConfirmation.tsx's own
 * docstring) and the marketing footer stacking below its sticky CTAs is off-pattern, same
 * rationale as the booking flow. `/booking` stays listed too (redundant with HideInBooking, but
 * Breadcrumb's own EXCLUDED array keeps that same redundant entry, so this matches precedent).
 */
const EXCLUDED = ["/booking", "/confirmation"];

export default function FooterGate({ locale }: { locale: string }) {
  const pathname = usePathname() ?? "/";
  const withoutLocale = pathname.replace(`/${locale}`, "") || "/";
  if (EXCLUDED.some((prefix) => withoutLocale.startsWith(prefix))) return null;
  return <Footer locale={locale} />;
}
