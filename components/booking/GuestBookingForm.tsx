"use client";

import { useState } from "react";
import { User, Phone, Mail } from "lucide-react";
import { usePostHog } from "posthog-js/react";

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
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+41");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const posthog = usePostHog();

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2) e.name = "Name ist erforderlich (min. 2 Zeichen)";
    if (!/^\+41[0-9]{9}$/.test(phone.replace(/\s/g, ""))) e.phone = "Gültige Schweizer Nummer (+41XXXXXXXXX)";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Ungültige E-Mail";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    posthog?.capture("booking_initiated", { type: "guest" });
    onSubmit({ name: name.trim(), phone: phone.replace(/\s/g, ""), email: email.trim() });
  };

  return (
    <div className="rounded-card border border-s-ink/5 dark:border-white/5 bg-s-bg-surface dark:bg-s-dm-surface p-4 space-y-3">
      <p className="text-sm font-medium text-s-ink dark:text-s-dm-text">Gastbuchung — deine Daten</p>

      <div>
        <label className="flex items-center gap-2 text-xs text-s-ink/50 dark:text-s-dm-text/50 mb-1">
          <User size={12} /> Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Vor- und Nachname"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "guest-name-error" : undefined}
          className="w-full px-3 py-2 rounded-btn border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-surface text-sm text-s-ink dark:text-s-dm-text outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20 transition-colors"
        />
        {errors.name && <p id="guest-name-error" role="alert" className="text-xs text-s-coral mt-0.5">{errors.name}</p>}
      </div>

      <div>
        <label className="flex items-center gap-2 text-xs text-s-ink/50 dark:text-s-dm-text/50 mb-1">
          <Phone size={12} /> Telefon *
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+41791234567"
          aria-invalid={!!errors.phone}
          aria-describedby={errors.phone ? "guest-phone-error" : undefined}
          className="w-full px-3 py-2 rounded-btn border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-surface text-sm text-s-ink dark:text-s-dm-text outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20 transition-colors"
        />
        {errors.phone && <p id="guest-phone-error" role="alert" className="text-xs text-s-coral mt-0.5">{errors.phone}</p>}
      </div>

      <div>
        <label className="flex items-center gap-2 text-xs text-s-ink/50 dark:text-s-dm-text/50 mb-1">
          <Mail size={12} /> E-Mail (optional)
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="deine@email.ch"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "guest-email-error" : undefined}
          className="w-full px-3 py-2 rounded-btn border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-surface text-sm text-s-ink dark:text-s-dm-text outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20 transition-colors"
        />
        {errors.email && <p id="guest-email-error" role="alert" className="text-xs text-s-coral mt-0.5">{errors.email}</p>}
      </div>

      <p className="text-[10px] text-s-ink/60 dark:text-s-dm-text/60 text-center px-2 mt-4 mb-2">
        * Die angezeigte Verfügbarkeit ist möglicherweise nicht in Echtzeit auf dem neuesten Stand. Der Salon bestätigt deinen Termin nach der Anfrage.
      </p>

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full py-2.5 rounded-btn active:scale-[0.98] bg-s-coral text-white text-sm font-medium hover:bg-s-coral/90 transition-all disabled:opacity-50"
      >
        Weiter zur Zahlung
      </button>
    </div>
  );
}
