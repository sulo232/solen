"use client";

// exists-check: net-new dev harness (no match in `npm run exists`), sibling to the existing
// app/[locale]/dev/* preview pages. Portals components-legacy/ReviewForm.tsx to document.body
// so its fixed-overlay composites outside the page layout, for design verification only.
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import ReviewForm from "@/components-legacy/ReviewForm";

/**
 * Dev-only render harness for the review form.
 * Supports ?variant=salon (default: stylist) so both variants can be screenshotted.
 * Not linked in nav.
 *
 * Usage:
 *   /de/dev/review-preview           - stylist variant (direction A)
 *   /de/dev/review-preview?variant=salon - salon variant (direction B)
 */
export default function ReviewFormPreviewPage() {
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();
  const variantParam = searchParams.get("variant");
  const variant = variantParam === "salon" ? "salon" : "stylist";

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <ReviewForm
      salonId="preview"
      bookingId="preview"
      salonName="Cuts & Culture"
      salonSlug="cuts-culture"
      staffName={variant === "stylist" ? "Jonas M." : undefined}
      staffMemberId={variant === "stylist" ? "preview" : undefined}
      variant={variant}
      onSuccess={() => {}}
      onClose={() => {}}
    />,
    document.body,
  );
}
