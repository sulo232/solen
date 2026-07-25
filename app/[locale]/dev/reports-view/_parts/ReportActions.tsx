"use client";

// exists-check: net-new vs primitives/Textarea.tsx + primitives/FieldLabel.tsx (both REUSED
// here, not duplicated, see imports below) and components-legacy/dashboard/*Modal.tsx (each
// dashboard page hand-rolls its own confirm modal per COMPONENT_REGISTRY.md's Modal row; this
// is a smaller inline confirm-row, not a modal, and lives under the reports-view scope fence).

import * as React from "react";
import { AlertTriangle, Check, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { FieldLabel } from "@/app/[locale]/_components/primitives/FieldLabel";
import { Textarea } from "@/app/[locale]/_components/primitives/Textarea";

const BTN_BASE =
  "inline-flex h-11 shrink-0 items-center gap-1.5 rounded-btn px-4 text-[15px] font-medium transition-colors";

interface ReportActionsProps {
  reportId: string;
  notes: string;
  onDismiss: () => void;
  onMarkReviewing: () => void;
  onHide: () => void;
  onNotesChange: (value: string) => void;
  className?: string;
}

/**
 * The shared admin-note field + action row (Dismiss / Mark reviewing / Hide content), used by
 * all three directions so the action semantics stay identical and only the surrounding layout
 * changes. "Hide content" is the destructive action: solid s-error fill + semibold (heavier
 * than Dismiss's plain ghost text) AND a one-tap confirm step, two distinct signals, never the
 * same weight as Dismiss, without inventing a colour outside the semantic error token.
 */
export function ReportActions({
  reportId,
  notes,
  onDismiss,
  onMarkReviewing,
  onHide,
  onNotesChange,
  className,
}: ReportActionsProps) {
  const [confirmArmed, setConfirmArmed] = React.useState(false);

  return (
    <div className={className}>
      <FieldLabel htmlFor={`notes-${reportId}`} optional>
        Admin note
      </FieldLabel>
      <Textarea
        id={`notes-${reportId}`}
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        placeholder="Internal note, not visible to the reporter or the reported user."
        className="mt-1.5"
        rows={2}
      />

      {!confirmArmed && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" onClick={onDismiss} className={cn(BTN_BASE, "text-s-ink-2 hover:bg-s-bg-sunken hover:text-s-ink")}>
            Dismiss
          </button>
          <button
            type="button"
            onClick={onMarkReviewing}
            className={cn(BTN_BASE, "border border-s-border bg-white text-s-ink hover:bg-s-bg-sunken")}
          >
            <Eye size={16} strokeWidth={2} aria-hidden />
            Mark reviewing
          </button>
          <button
            type="button"
            onClick={() => setConfirmArmed(true)}
            className={cn(BTN_BASE, "bg-s-error font-semibold text-white hover:bg-s-error/90")}
          >
            <EyeOff size={16} strokeWidth={2} aria-hidden />
            Hide content
          </button>
        </div>
      )}

      {confirmArmed && (
        <div className="mt-3 rounded-card border border-s-error/30 bg-s-error/5 p-3">
          <p className="flex items-start gap-1.5 text-[12px] font-semibold text-s-error">
            <AlertTriangle size={14} strokeWidth={2} className="mt-px shrink-0" aria-hidden />
            Hide this content? Customers will no longer see it.
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setConfirmArmed(false)}
              className={cn(BTN_BASE, "text-s-ink-2 hover:bg-white hover:text-s-ink")}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onHide();
                setConfirmArmed(false);
              }}
              className={cn(BTN_BASE, "bg-s-error font-semibold text-white hover:bg-s-error/90")}
            >
              <Check size={16} strokeWidth={2} aria-hidden />
              Yes, hide it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
