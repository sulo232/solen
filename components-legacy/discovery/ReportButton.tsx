"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Flag, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Radio,
  RadioGroup,
  Textarea,
} from "@/app/[locale]/_components/primitives";
import Spinner from "@/components-legacy/ui/Spinner";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { REPORT_REASONS, REPORT_TARGET_TYPES, type ReportReason, type ReportTargetType } from "@/lib/content-reports";

/**
 * Generic content-report trigger. Reused across every reportable surface (owner ask
 * 2026-07-25, "reuse the component, don't fork it"):
 *   - discovery item / comment (`item` | `comment`, the two ORIGINAL types this
 *     component shipped with; their endpoints, /api/discovery/items/[id]/report and
 *     /api/discovery/comments/[id]/report, don't exist yet, so these two paths are left
 *     exactly as they were, unused today, out of scope for this pass)
 *   - a review (PDP reviews section, full reviews page): `type="review"`
 *   - a salon (PDP header): `type="salon"`
 * `review`/`salon` post to the real, already-existing POST /api/reports, which inserts
 * into `content_reports` (target_type CHECK constraint: salon | review | user, see
 * lib/content-reports.ts, the single source for the report taxonomy). That table feeds
 * the admin queue at /dashboard/reports.
 *
 * `variant` controls ONLY the trigger's chrome, ground in whichever surface it sits on
 * (never a new visual invented): `subtle` is this component's original small opacity
 * icon (discovery card footer, untouched). `row` matches the full reviews page's own
 * existing per-row Flag icon-button chrome exactly (h-11 w-11, no border, hover-sunken
 * fill). `header` matches SalonHeader's white bordered Share-button circle exactly.
 * `frost` matches SalonHero's frosted-glass over-photo Share button exactly, including
 * its focus-visible:outline (2px solid ink outline, the LOCKED "buttons/links" focus
 * treatment per the design contract, not a soft glow halo).
 */
interface ReportButtonProps {
  type: "item" | "comment" | ReportTargetType;
  targetId: string;
  variant?: "subtle" | "row" | "header" | "frost";
}

const VARIANT_CLASS: Record<NonNullable<ReportButtonProps["variant"]>, string> = {
  subtle: "text-s-ink/20 hover:text-s-ink transition-colors ml-auto",
  row: "grid h-11 w-11 shrink-0 place-items-center rounded-full text-s-ink-2 transition-colors duration-150 hover:bg-s-bg-sunken hover:text-s-ink-2",
  header: "grid h-11 w-11 place-items-center rounded-full border border-s-border bg-white transition-transform hover:scale-105 active:scale-95 active:duration-[80ms] active:ease-glide",
  // focus-visible:outline below is a solid 2px ink outline (LOCKFILE focus row:
  // "buttons/links: the global 2px ink outline"), copied verbatim from HeartButton.tsx.
  frost: "group grid h-11 w-11 place-items-center bg-transparent focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2 focus-visible:rounded-full",
};

// `as const satisfies` (not a plain `Record<K, string>` annotation) keeps each value's
// LITERAL type instead of widening to `string`, so `tReport(REASON_LABEL_KEY[r])` narrows
// to next-intl's typed MessageKeys union. Matches the working pattern already used by
// app/[locale]/dashboard/bookings/page.tsx's STATUS_LABEL_KEYS.
const REASON_LABEL_KEY = {
  inappropriate: "reasonInappropriate",
  spam: "reasonSpam",
  fake: "reasonFake",
  ip_violation: "reasonIpViolation",
  harassment: "reasonHarassment",
  other: "reasonOther",
} as const satisfies Record<ReportReason, string>;

const TARGET_TYPE_LABEL_KEY = {
  salon: "targetTypeSalon",
  review: "targetTypeReview",
  user: "targetTypeUser",
  photo: "targetTypePhoto",
} as const satisfies Record<ReportTargetType, string>;

export default function ReportButton({ type, targetId, variant = "subtle" }: ReportButtonProps) {
  const t = useTranslations("discover") as any;
  const tReport = useTranslations("report");
  const pathname = usePathname();
  const [reported, setReported] = useState(false);

  // Modal state, only relevant for the real content_reports flow (review/salon).
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | "">("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);

  const isGenericTarget = (REPORT_TARGET_TYPES as readonly string[]).includes(type);

  // Original item/comment behavior: untouched (matches the component's shipped
  // behavior byte-for-byte; both endpoints are not wired yet, out of scope here).
  const handleLegacyReport = async () => {
    if (reported) return;
    const legacyReason = prompt(t("report"));
    if (!legacyReason) return;
    try {
      const endpoint = type === "item"
        ? `/api/discovery/items/${targetId}/report`
        : `/api/discovery/comments/${targetId}/report`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: legacyReason }),
      });
      if (!res.ok) return;
      setReported(true);
    } catch {
      // Silent, matches the component's original behavior for these two legacy paths.
    }
  };

  const openReportModal = async () => {
    if (reported) return;
    // Logged-out interception, same pattern as HeartButton.tsx: bounce to login
    // carrying the current path so the report can complete after sign-in.
    const supabase = createBrowserSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      const locale = pathname?.split("/")[1] || "de";
      const redirect = encodeURIComponent(pathname || `/${locale}`);
      window.location.href = `/${locale}/auth/login?redirect=${redirect}`;
      return;
    }
    setReason("");
    setDetails("");
    setError(false);
    setOpen(true);
  };

  const submitReport = async () => {
    if (!reason) return;
    setSubmitting(true);
    setError(false);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: type,
          targetId,
          reason,
          details: details.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setOpen(false);
      setReported(true);
    } catch (err) {
      console.error("[ReportButton] submit failed:", err);
      setError(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (reported) {
    if (variant === "subtle") {
      return <span className="text-[12px] text-s-ink/30">{t("reported")}</span>;
    }
    return (
      <span
        aria-label={tReport("alreadyReported")}
        title={tReport("alreadyReported")}
        className={`${VARIANT_CLASS[variant]} cursor-default opacity-50`}
      >
        <Check size={variant === "header" ? 18 : 15} strokeWidth={2.1} aria-hidden />
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={isGenericTarget ? openReportModal : handleLegacyReport}
        aria-label={isGenericTarget ? tReport("action") : t("report")}
        title={isGenericTarget ? tReport("action") : t("report")}
        className={VARIANT_CLASS[variant]}
      >
        {variant === "frost" ? (
          <span aria-hidden className="grid h-[38px] w-[38px] place-items-center rounded-full bg-white/80 backdrop-blur-sm border border-white/40 transition-transform duration-200 ease-glide group-hover:scale-110 group-active:scale-[0.97] group-active:duration-[80ms]">
            <Flag size={18} strokeWidth={1.9} stroke="var(--color-heading)" aria-hidden />
          </span>
        ) : (
          <Flag size={variant === "header" ? 18 : variant === "row" ? 15 : 10} strokeWidth={variant === "subtle" ? undefined : 2.1} aria-hidden />
        )}
      </button>

      {isGenericTarget && (
        <Modal isOpen={open} onOpenChange={setOpen} size="sm" aria-label={tReport("modalTitle", { target: tReport(TARGET_TYPE_LABEL_KEY[type as ReportTargetType]) })}>
          <ModalHeader
            title={tReport("modalTitle", { target: tReport(TARGET_TYPE_LABEL_KEY[type as ReportTargetType]) })}
            onClose={() => setOpen(false)}
          />
          <ModalBody>
            <p className="text-[13px] font-semibold text-s-ink-2 mb-2">{tReport("reasonLabel")}</p>
            <RadioGroup>
              {REPORT_REASONS.map((r) => (
                <Radio key={r} name="report-reason" value={r} checked={reason === r} onChange={() => setReason(r)}>
                  {tReport(REASON_LABEL_KEY[r])}
                </Radio>
              ))}
            </RadioGroup>
            <div className="mt-4">
              <Textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder={tReport("detailsPlaceholder")}
                rows={2}
                aria-label={tReport("detailsLabel")}
              />
            </div>
            {error && <p className="mt-2 text-[13px] text-s-error">{tReport("error")}</p>}
          </ModalBody>
          <ModalFooter>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 py-2.5 rounded-full border border-s-border text-sm text-s-ink-2 hover:bg-s-bg-sunken transition-colors"
            >
              {tReport("cancel")}
            </button>
            <button
              type="button"
              onClick={submitReport}
              disabled={!reason || submitting}
              className="flex-1 py-2.5 rounded-full bg-s-ink text-white text-sm font-medium hover:bg-black disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            >
              {submitting && <Spinner size="sm" invert />}
              {submitting ? tReport("submitting") : tReport("submit")}
            </button>
          </ModalFooter>
        </Modal>
      )}
    </>
  );
}
