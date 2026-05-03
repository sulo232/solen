"use client";

import { useState } from "react";
import { User, Phone, Mail } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { useTranslations } from "next-intl";

export interface GuestInfo {
  name: string;
  phone: string;
  email: string;
}

interface GuestBookingFormProps {
  onSubmit: (info: GuestInfo) => void;
  submitting?: boolean;
}

export default function GuestBookingForm({ onSubmit, submitting }: GuestBookingFormProps) {
  const t = useTranslations("guestBookingForm") as any;
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+41");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const posthog = usePostHog();

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2) e.name = t("nameError");
    if (!/^\+41[0-9]{9}$/.test(phone.replace(/\s/g, ""))) e.phone = t("phoneError");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = t("emailError");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    posthog?.capture("booking_initiated", { type: "guest" });
    onSubmit({ name: name.trim(), phone: phone.replace(/\s/g, ""), email: email.trim() });
  };

  return (
    <div className="rounded-[12px] border border-s-ink/[0.06] bg-[--raised] p-5 space-y-4"
      style={{ boxShadow: "0 1px 2px rgba(26,18,9,.05)" }}>
      <div>
        <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-ink/40">
          {t("title")}
        </p>
        <p className="font-heading font-semibold text-sm text-s-ink mt-0.5">{t("subtitle")}</p>
      </div>

      <div>
        <label className="block text-[9px] font-heading font-bold uppercase tracking-[.14em] text-s-ink/40 mb-1.5">
          <User size={10} className="inline mr-1" /> {t("nameLabel")} *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("namePlaceholder")}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "guest-name-error" : undefined}
          className="w-full px-3.5 py-3 rounded-[10px] border border-s-ink/[0.08] bg-white text-sm font-body text-s-ink placeholder:text-s-ink/30 focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/15 transition-colors"
        />
        {errors.name && <p id="guest-name-error" role="alert" className="text-xs text-s-coral mt-0.5">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-[9px] font-heading font-bold uppercase tracking-[.14em] text-s-ink/40 mb-1.5">
          <Phone size={10} className="inline mr-1" /> {t("phoneLabel")} *
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={t("phonePlaceholder")}
          aria-invalid={!!errors.phone}
          aria-describedby={errors.phone ? "guest-phone-error" : undefined}
          className="w-full px-3.5 py-3 rounded-[10px] border border-s-ink/[0.08] bg-white text-sm font-body text-s-ink placeholder:text-s-ink/30 focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/15 transition-colors"
        />
        {errors.phone && <p id="guest-phone-error" role="alert" className="text-xs text-s-coral mt-0.5">{errors.phone}</p>}
      </div>

      <div>
        <label className="block text-[9px] font-heading font-bold uppercase tracking-[.14em] text-s-ink/40 mb-1.5">
          <Mail size={10} className="inline mr-1" /> {t("emailLabel")}
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("emailPlaceholder")}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "guest-email-error" : undefined}
          className="w-full px-3.5 py-3 rounded-[10px] border border-s-ink/[0.08] bg-white text-sm font-body text-s-ink placeholder:text-s-ink/30 focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/15 transition-colors"
        />
        {errors.email && <p id="guest-email-error" role="alert" className="text-xs text-s-coral mt-0.5">{errors.email}</p>}
      </div>

      <p className="text-[10px] text-s-ink/60 text-center px-2 mt-4 mb-2">
        {t("disclaimer")}
      </p>

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full py-4 rounded-pill bg-s-coral shadow-elevation-2 text-white text-xs font-heading font-bold uppercase tracking-[.04em] active:scale-[0.97] hover:brightness-[1.06] transition-[transform,filter] duration-150 disabled:opacity-50"
      >
        {t("submit")}
      </button>
    </div>
  );
}
