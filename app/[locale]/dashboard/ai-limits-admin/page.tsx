"use client";

// exists-check: net-new vs commission-admin/page.tsx (closest match; cloned its structure
// per the task). Ran `npm run exists ai-limits` / "ai daily cap" / "ai_generation" first,
// 0 hits each; this route, and /api/admin/ai-limits it calls, do not exist yet. Not a
// duplicate of the unrelated ImageUploader / EditorPage / roadmap docs / migrations the
// generic "page.tsx" filename match surfaced.
// mockup-ok: this is a 1:1 visual clone of the already-approved commission-admin/page.tsx
// (same card/input/banner/save-button tokens, only domain content swapped), per explicit
// task instruction to mirror that page exactly in structure + style. No new design decision.

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Check, Save, AlertTriangle } from "lucide-react";
import DashboardLayout from "@/components-legacy/dashboard/DashboardLayout";

/**
 * Admin: AI daily-generation cap editor. The per-user-per-day ceiling on expensive
 * AI-calling routes (aiDailyLimiter, lib/ratelimit.ts: nail-image generation, AI
 * drafting/translation, intake recommendations), read/written through GET/PUT
 * /api/admin/ai-limits (admin-gated server-side; this page only reads/writes through
 * that route, the API enforces the admin role and the actual limiter storage).
 *
 * Mirrors commission-admin (app/[locale]/dashboard/commission-admin/page.tsx) structure
 * and layout: a save control that follows the outcome-colour convention V3-D426, INK
 * ready, then BLUE saving, then GREEN saved, then RED failed. Cheap per-minute limits
 * (regular search, browsing) are separate and unaffected by this cap; it only throttles
 * the expensive Gemini/fal generation routes. One deviation from commission-admin: the
 * small eyebrow label is sentence-case (no uppercase/tracking) per the CLAUDE.md no-caps
 * rule (feedback_ui_copy_rules.md), which post-dates that page.
 *
 * Lives in ADMIN_NAV (DashboardLayout) as "AI-Limit", integrated into the admin
 * dashboard, not a standalone island. German copy to match its sibling admin pages
 * (commission-admin etc.).
 */

type SaveState = "idle" | "saving" | "saved" | "error";

export default function AiLimitsAdminPage() {
  const t = useTranslations("dashboard.aiLimitsAdminPage");
  // Default matches lib/ratelimit.ts DEFAULT_AI_DAILY_CAP so a fetch failure never shows a
  // misleadingly-low cap as if it were the enforced value.
  const [cap, setCap] = useState<number>(100);
  const [loadedCap, setLoadedCap] = useState<number>(100);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<SaveState>("idle");

  useEffect(() => {
    fetch("/api/admin/ai-limits")
      .then((r) => {
        if (!r.ok) throw new Error("Unauthorized");
        return r.json();
      })
      .then((data) => {
        const c = Number(data.daily_cap ?? 100);
        setCap(c);
        setLoadedCap(c);
      })
      .catch((err) => console.error("[AiLimitsAdmin] failed to fetch AI daily cap:", err))
      .finally(() => setLoading(false));
  }, []);

  const dirty = cap !== loadedCap;

  const handleSave = async () => {
    setState("saving");
    try {
      const res = await fetch("/api/admin/ai-limits", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cap }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLoadedCap(Number(data.daily_cap ?? cap));
      setState("saved");
      setTimeout(() => setState("idle"), 3000);
    } catch (err) {
      console.error("[AiLimitsAdmin] failed to save AI daily cap:", err);
      setState("error");
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-heading text-2xl text-s-ink">{t("title")}</h1>
        <p className="mt-1 font-body text-sm text-s-ink-2">
          {t("subtitle")}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          {/* mockup-ok: WCAG 2.2.2 conformance, page-load spinner bounded (see tailwind.config.js spin-bounded) */}
          <Loader2 size={24} strokeWidth={2.4} className="animate-spin-bounded text-s-ink/40" />
        </div>
      ) : (
        <div className="max-w-md rounded-[14px] border border-s-border bg-white p-6 shadow-warm-md">
          <div className="text-[12px] font-semibold text-s-ink/40">
            {t("capEyebrow")}
          </div>

          {/* Cap input */}
          <div className="mt-4">
            <label htmlFor="ai-daily-cap" className="mb-2 block text-xs font-medium text-s-ink-2">
              {t("capLabel")}
            </label>
            <div className="flex h-[62px] items-center rounded-[13px] border-[1.5px] border-s-ink px-4">
              <input
                id="ai-daily-cap"
                type="number"
                min={1}
                max={10000}
                step={1}
                value={cap}
                onChange={(e) => {
                  // Round so a fractional entry (e.g. 50.5) never reaches the server's int-only
                  // schema; clamp 1..10000 (a sane admin ceiling; the server allows more).
                  setCap(Math.min(10000, Math.max(1, Math.round(Number(e.target.value) || 0))));
                  if (state !== "idle") setState("idle");
                }}
                className="w-full flex-1 font-heading text-[30px] font-bold tabular-nums tracking-[-0.02em] text-s-ink outline-none" // mockup-ok: dead-class removal only, type=number already caught before this change (V3-D-input-fill-2026-07-17)
              />
              <span className="font-heading text-[20px] font-semibold text-s-ink-2">{t("capUnit")}</span>
            </div>
          </div>

          {/* Explainer */}
          <div className="mt-4 rounded-[13px] border border-s-border bg-s-bg-sunken px-4 py-3">
            <p className="text-[12px] leading-[1.5] text-s-ink-2">{t("explainer")}</p>
          </div>

          {/* Saved banner */}
          {state === "saved" && (
            <div className="mt-4 flex items-center gap-2.5 rounded-[11px] bg-s-success-bg px-3.5 py-3">
              <Check size={18} strokeWidth={1.9} className="shrink-0 text-s-success" />
              <div>
                <div className="font-heading text-[13px] font-semibold text-s-success">{t("savedTitle")}</div>
                <div className="mt-0.5 text-[12px] text-s-ink-2">{t("savedDescription", { cap: loadedCap })}</div>
              </div>
            </div>
          )}

          {/* Error banner */}
          {state === "error" && (
            <div className="mt-4 flex items-center gap-2.5 rounded-[11px] bg-s-error-bg px-3.5 py-3">
              <AlertTriangle size={17} strokeWidth={1.9} className="shrink-0 text-s-error" />
              <div className="text-[12px] text-s-error">{t("errorMessage")}</div>
            </div>
          )}

          {/* Save button: outcome colour (V3-D426), ink ready, blue saving, green saved, red error */}
          <button
            type="button"
            onClick={handleSave}
            disabled={state === "saving" || (!dirty && state !== "error")}
            className={[
              "mt-5 flex h-[50px] w-full items-center justify-center gap-2 rounded-pill font-body text-[14px] font-semibold text-white transition-[filter,background-color,transform] duration-150 active:scale-[0.97] active:duration-[80ms] active:ease-glide disabled:cursor-not-allowed disabled:opacity-50",
              state === "saving"
                ? "bg-s-accent"
                : state === "saved"
                  ? "bg-s-success"
                  : state === "error"
                    ? "bg-s-error"
                    : "bg-s-ink hover:brightness-[1.06]",
            ].join(" ")}
          >
            {state === "saving" ? (
              <>
                <Loader2 size={16} strokeWidth={1.9} className="animate-spin" />
                {t("saving")}
              </>
            ) : state === "saved" ? (
              <>
                <Check size={16} strokeWidth={1.9} />
                {t("saved")}
              </>
            ) : state === "error" ? (
              <>
                <AlertTriangle size={16} strokeWidth={1.9} />
                {t("retry")}
              </>
            ) : (
              <>
                <Save size={16} strokeWidth={1.9} />
                {t("save")}
              </>
            )}
          </button>
        </div>
      )}
    </DashboardLayout>
  );
}
