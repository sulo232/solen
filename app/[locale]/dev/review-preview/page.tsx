"use client";

// exists-check: net-new dev harness (no match in `npm run exists`), sibling to the existing
// app/[locale]/dev/* preview pages. Portals components-legacy/ReviewForm.tsx to document.body
// so its fixed-overlay composites outside the page layout, for design verification only.
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ReviewForm from "@/components-legacy/ReviewForm";

/**
 * Dev-only render harness for the rebuilt stylist review form (direction A).
 * The real form is gated behind a completed unreviewed booking; this mounts it
 * with mock props to verify the design + motion. Not linked in nav.
 */
export default function ReviewFormPreviewPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(
    <ReviewForm
      salonId="preview"
      bookingId="preview"
      salonName="Cuts & Culture"
      salonSlug="cuts-culture"
      staffName="Jonas M."
      staffMemberId="preview"
      onSuccess={() => {}}
      onClose={() => {}}
    />,
    document.body,
  );
}
