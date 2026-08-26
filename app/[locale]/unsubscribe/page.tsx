"use client";

// exists-check: net-new. npm run exists unsubscribe returned 0 matches before this file;
// this is the confirmation page for POST /api/unsubscribe (app/api/unsubscribe/route.ts),
// the target of the link lib/email.ts's salonOutreachInvitation footer has always promised
// (seo-comms-08, 2026-07-27). A confirm-click page (not a bare one-click GET) so an email
// client's link-prefetch/security scanner can't silently trigger a real unsubscribe by
// just following the link.
//
// mockup-ok (all classes below): net-new, non-customer-facing (B2B outreach-lead) utility
// page, no bespoke visual design, every class is an already-LOCKED token reused verbatim
// from an approved surface (bg-white/text-s-ink/text-s-ink-2 from
// app/[locale]/impressum/page.tsx, the bg-s-ink white-text commit-button recipe used
// system-wide per the design contract). Same "forms/legal/receipts" utility-page
// exemption spirit as the imagery floor. Not a design choice needing owner sign-off.

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

export default function UnsubscribePage() {
  const t = useTranslations("unsubscribe");
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const token = searchParams.get("t") ?? "";
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  async function handleConfirm() {
    setState("loading");
    try {
      const res = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token }),
      });
      if (!res.ok) throw new Error("unsubscribe failed");
      setState("done");
    } catch (err) {
      console.error("[unsubscribe] request failed:", err);
      setState("error");
    }
  }

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center py-16">
        {!isValidEmail ? (
          <>
            <h1 className="font-display text-2xl font-semibold text-s-ink mb-3">{t("title")}</h1>
            <p className="text-sm text-s-ink-2">{t("invalidEmail")}</p>
          </>
        ) : state === "done" ? (
          <>
            <h1 className="font-display text-2xl font-semibold text-s-ink mb-3">{t("confirmedTitle")}</h1>
            <p className="text-sm text-s-ink-2">{t("confirmedDescription", { email })}</p>
          </>
        ) : state === "error" ? (
          <>
            <h1 className="font-display text-2xl font-semibold text-s-ink mb-3">{t("title")}</h1>
            <p className="text-sm text-s-ink-2">{t("errorDescription")}</p>
          </>
        ) : (
          <>
            <h1 className="font-display text-2xl font-semibold text-s-ink mb-3">{t("title")}</h1>
            <p className="text-sm text-s-ink-2 mb-8">{t("description", { email })}</p>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={state === "loading"}
              className="h-11 px-6 rounded-btn bg-s-ink text-white text-[15px] font-medium disabled:opacity-50"
            >
              {t("confirmButton")}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
