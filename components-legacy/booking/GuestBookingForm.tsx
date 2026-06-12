"use client";

import { formatSwissPhoneInput } from "@/lib/format-phone";
import {
  useState,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from "react";
import { User, Phone, Mail, AlertCircle } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export interface GuestInfo {
  name: string;
  phone: string;
  email: string;
}

/** Imperative handle so the parent's single "Pay & confirm" CTA can force-validate
 *  + surface field errors on press (the mockup has no in-form submit button). */
export interface GuestBookingFormHandle {
  /** Validate now, render any errors, and return the valid GuestInfo or null. */
  validate: () => GuestInfo | null;
}

interface GuestBookingFormProps {
  /**
   * Lifts the guest contact up LIVE: a valid GuestInfo while the three fields pass,
   * null while incomplete/invalid. The parent gates its booking POST on a non-null value.
   * Matches the single-CTA review-and-confirm mockup (no separate "continue" button).
   */
  onChange: (info: GuestInfo | null) => void;
}

/**
 * GuestBookingForm — logged-out variant of booking Step 4 (Review & confirm).
 *
 * Rebuilt to `public/solen-refund-guest-booking-form.html` (V3, 2026-06-01):
 *   - sentence-case 13px labels w/ leading lucide icon (was 9px uppercase tracking-.18em)
 *   - locked `+41` country chip + separate phone input (regex can't be broken by spacing)
 *   - rounded-input 16px on `s-border` hairline; focus = `s-accent` border + `s-accent-pale`
 *     glow (the ONLY blue moment here, §1.5 functional-only)
 *   - error state = `s-error` (the old build wrongly used `text-s-accent` for errors)
 *   - email optional, validated only when filled
 *
 * Contract: validation regex + GuestInfo shape unchanged from the original orphaned form.
 * It posts via the parent (PayConfirmStep) to POST /api/bookings { guest_name, guest_phone,
 * guest_email }.
 */
const GuestBookingForm = forwardRef<GuestBookingFormHandle, GuestBookingFormProps>(
  function GuestBookingForm({ onChange }, ref) {
    const t = useTranslations("guestBookingForm") as any;
    const [name, setName] = useState("");
    // National part only — the "+41" prefix lives in the country chip and is prepended
    // before validation/submit, so a user can't break the regex with the prefix.
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const posthog = usePostHog();

    /** Pure validator. Returns the error map + the normalized GuestInfo when clean. */
    const compute = useCallback(
      (n: string, p: string, e: string): { errs: Record<string, string>; info: GuestInfo | null } => {
        const errs: Record<string, string> = {};
        const fullPhone = `+41${p.replace(/\s/g, "")}`;
        if (!n.trim() || n.trim().length < 2) errs.name = t("nameError");
        if (!/^\+41[0-9]{9}$/.test(fullPhone)) errs.phone = t("phoneError");
        if (e && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim())) errs.email = t("emailError");
        const valid = Object.keys(errs).length === 0;
        return {
          errs,
          info: valid ? { name: n.trim(), phone: fullPhone, email: e.trim() } : null,
        };
      },
      [t],
    );

    /** Recompute on every keystroke + lift the result up. Only SHOW an error for a field
     *  that already has one (don't yell at a half-typed field), but always lift validity. */
    const sync = useCallback(
      (n: string, p: string, e: string) => {
        const { errs, info } = compute(n, p, e);
        setErrors((prev) => {
          const next: Record<string, string> = {};
          // Keep only errors for fields the user has already been warned about, and clear
          // them once the field becomes valid.
          for (const key of Object.keys(prev)) {
            if (errs[key]) next[key] = errs[key];
          }
          return next;
        });
        onChange(info);
      },
      [compute, onChange],
    );

    useImperativeHandle(
      ref,
      () => ({
        validate: () => {
          const { errs, info } = compute(name, phone, email);
          setErrors(errs);
          if (info) posthog?.capture("booking_initiated", { type: "guest" });
          return info;
        },
      }),
      [compute, name, phone, email, posthog],
    );

    const inputBase = cn(
      "w-full px-3.5 py-3 rounded-input border bg-s-bg-surface",
      "font-body text-[15px] text-s-ink placeholder:text-s-ink-3",
      "transition-[border-color,box-shadow] duration-150 ease-snap appearance-none",
      "focus:outline-none focus:border-s-accent focus:ring-2 focus:ring-s-accent-pale",
    );
    const errInput = "border-s-error focus:border-s-error focus:ring-s-error-bg";

    return (
      <div className="space-y-4">
        {/* Name — required */}
        <div>
          <label
            htmlFor="guest-name"
            className="flex items-center gap-1.5 text-[13px] font-medium text-s-ink mb-[7px]"
          >
            <User size={14} className="text-s-ink-2" aria-hidden />
            {t("nameLabel")}
          </label>
          <input
            id="guest-name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(ev) => {
              setName(ev.target.value);
              sync(ev.target.value, phone, email);
            }}
            placeholder={t("namePlaceholder")}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "guest-name-error" : undefined}
            className={cn(inputBase, "border-s-border", errors.name && errInput)}
          />
          {errors.name && (
            <p
              id="guest-name-error"
              role="alert"
              className="flex items-center gap-1.5 text-[12.5px] text-s-error mt-1.5"
            >
              <AlertCircle size={13} aria-hidden />
              {errors.name}
            </p>
          )}
        </div>

        {/* Phone — required, +41 chip prefix */}
        <div>
          <label
            htmlFor="guest-phone"
            className="flex items-center gap-1.5 text-[13px] font-medium text-s-ink mb-[7px]"
          >
            <Phone size={14} className="text-s-ink-2" aria-hidden />
            {t("phoneLabel")}
          </label>
          <div className="flex gap-2">
            <span
              className="flex items-center shrink-0 px-3.5 rounded-input border border-s-border bg-s-bg-sunken text-[14px] font-medium text-s-ink"
              aria-hidden
            >
              +41
            </span>
            <input
              id="guest-phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              value={phone}
              onChange={(ev) => {
                setPhone(formatSwissPhoneInput(ev.target.value));
                sync(name, ev.target.value, email);
              }}
              placeholder={t("phonePlaceholder")}
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? "guest-phone-error" : "guest-phone-hint"}
              className={cn(inputBase, "flex-1", "border-s-border", errors.phone && errInput)}
            />
          </div>
          {errors.phone ? (
            <p
              id="guest-phone-error"
              role="alert"
              className="flex items-center gap-1.5 text-[12.5px] text-s-error mt-1.5"
            >
              <AlertCircle size={13} aria-hidden />
              {errors.phone}
            </p>
          ) : (
            <p id="guest-phone-hint" className="text-[12px] text-s-ink-3 mt-1.5">
              {t("phoneHint")}
            </p>
          )}
        </div>

        {/* Email — optional */}
        <div>
          <label
            htmlFor="guest-email"
            className="flex items-center gap-1.5 text-[13px] font-medium text-s-ink mb-[7px]"
          >
            <Mail size={14} className="text-s-ink-2" aria-hidden />
            {t("emailLabel")}
            <span className="font-normal text-s-ink-3 text-[12px]">| {t("optional")}</span>
          </label>
          <input
            id="guest-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(ev) => {
              setEmail(ev.target.value);
              sync(name, phone, ev.target.value);
            }}
            placeholder={t("emailPlaceholder")}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "guest-email-error" : "guest-email-hint"}
            className={cn(inputBase, "border-s-border", errors.email && errInput)}
          />
          {errors.email ? (
            <p
              id="guest-email-error"
              role="alert"
              className="flex items-center gap-1.5 text-[12.5px] text-s-error mt-1.5"
            >
              <AlertCircle size={13} aria-hidden />
              {errors.email}
            </p>
          ) : (
            <p id="guest-email-hint" className="text-[12px] text-s-ink-3 mt-1.5">
              {t("emailHint")}
            </p>
          )}
        </div>
      </div>
    );
  },
);

export default GuestBookingForm;
