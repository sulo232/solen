"use client";

// exists-check: net-new vs supabase/migrations/20260614000000_discovery_items_i18n_script_products.sql
// (exists-guard keyword match on "flow"; that migration is unrelated DB schema, not a UI component).
// This is the dev-only toolbar for app/[locale]/dev/flows/layout.tsx, see FLOW_HARNESS.md.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, RotateCcw } from "lucide-react";

/**
 * FlowBar: dev-only fixed toolbar mounted from app/[locale]/dev/flows/layout.tsx.
 * "All flows" returns to the hub; "Restart" refreshes the current route (server
 * data + client state) so a walked flow resets. Only ever rendered under
 * /dev/flows/*, so it never bleeds into real product chrome.
 */
export default function FlowBar({ locale }: { locale: string }) {
  const router = useRouter();

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-between gap-3 border-t border-s-border bg-white px-4 py-2.5"
      style={{ paddingBottom: "max(10px, env(safe-area-inset-bottom))" }}
    >
      <Link
        href={`/${locale}/dev/flows`}
        className="flex items-center gap-1.5 text-[13px] font-semibold text-s-accent hover:underline"
      >
        <ArrowLeft size={15} strokeWidth={2.2} aria-hidden />
        All flows
      </Link>
      <span className="text-[12px] text-s-ink-2">dev flow harness</span>
      <button
        type="button"
        onClick={() => router.refresh()}
        className="flex items-center gap-1.5 text-[13px] font-semibold text-s-accent hover:underline"
      >
        <RotateCcw size={15} strokeWidth={2.2} aria-hidden />
        Restart
      </button>
    </div>
  );
}
