"use client";

// exists-check: net-new page vs app/[locale]/dashboard/nail-admin/page.tsx +
// app/[locale]/dashboard/services/page.tsx because `npm run exists products` found NO
// general dashboard products/inventory route (RetailManager was mounted ONLY inside the
// nail-admin tab). This generalises it: mirrors the /dashboard/services fetch-profile
// pattern and mounts the UNCHANGED RetailManager so any salon manages retail products.

import { useEffect, useState } from "react";
import DashboardLayout from "@/components-legacy/dashboard/DashboardLayout";
import RetailManager from "@/components-legacy/dashboard/nail/RetailManager";
import Spinner from "@/components-legacy/ui/Spinner";

/**
 * Dashboard Products (A5 A-4) , generalises retail-product management out of nail-admin.
 *
 * The nail dashboard already mounted RetailManager behind a nail-only tab; A-2 de-gated
 * the retail API for all salons, so this page just gives non-nail salons the same manager.
 * RetailManager is reused AS-IS (no redesign, task T3 constraint) , it fetches, lists,
 * adjusts stock, and adds products via the already-de-gated /api/nail/retail endpoints.
 * The bundle BUILDER (B-2) is explicitly OUT of this pass.
 */
export default function DashboardProductsPage() {
  const [salonId, setSalonId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => setSalonId(p?.salon_id ?? undefined))
      .catch((err) => console.error("[DashboardProducts] Failed to fetch salon profile:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <div className="mb-6">
        {/* mockup-ok: h1 treatment copied verbatim from the existing /dashboard/services page
            header (ServicesPage), not a new design , T3 reuses the RetailManager UI as-is. */}
        <h1 className="font-heading text-[26px] font-bold tracking-[-0.02em] text-s-ink leading-none">
          Produkte
        </h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : !salonId ? null : (
        <RetailManager salonId={salonId} />
      )}
    </DashboardLayout>
  );
}
