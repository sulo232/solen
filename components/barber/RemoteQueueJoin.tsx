"use client";

import { useState } from "react";
import { Users, CheckCircle, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";

interface RemoteQueueJoinProps {
  salonId: string;
  staff?: { id: string; name: string }[];
  services?: { id: string; name_de: string }[];
}

interface RemoteQueueResult {
  success: boolean;
  position?: number;
  estimated_wait_minutes?: number;
  tracking_token?: string;
  error?: string;
}

export default function RemoteQueueJoin({ salonId, staff, services }: RemoteQueueJoinProps) {
  const t = useTranslations("barber.queue") as any;
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredBarberId, setPreferredBarberId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<RemoteQueueResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/walkin/queue/remote-join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salon_id: salonId,
          customer_name: name.trim(),
          customer_phone: phone.trim() || undefined,
          preferred_barber_id: preferredBarberId || undefined,
          service_id: serviceId || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({
          success: true,
          position: data.position,
          estimated_wait_minutes: data.estimated_wait_minutes,
          tracking_token: data.tracking_token,
        });
      } else {
        setResult({ success: false, error: data.error ?? t("error") });
      }
    } catch {
      setResult({ success: false, error: t("networkError") });
    } finally {
      setSubmitting(false);
    }
  };

  if (result?.success) {
    return (
      <div className="rounded-[16px] bg-s-sage/10 border border-s-sage/20 p-5 text-center">
        <CheckCircle size={32} className="text-s-sage mx-auto mb-3" />
        <h4 className="font-heading text-base font-bold text-s-ink mb-1">
          {t("joinedSuccess")}
        </h4>
        <p className="text-sm text-s-ink/70 mb-3">
          {t("position")} <strong>{result.position}</strong> · {t("estimatedWait")}{" "}
          <strong>~{result.estimated_wait_minutes} {t("minutes")}</strong>
        </p>
        <p className="text-xs text-s-ink/50">
          {t("trackingCode")}: <code className="font-mono">{result.tracking_token}</code>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {result?.error && (
        <div className="flex items-center gap-2 text-sm text-s-error bg-s-error-bg rounded-input px-3 py-2">
          <AlertCircle size={16} />
          {result.error}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-s-ink/70 mb-1">
          {t("nameLabel")} *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={100}
          className="w-full rounded-input border border-s-ink/10 bg-white px-3 py-2 text-sm text-s-ink focus:outline-none focus:ring-2 focus:ring-s-coral/15 focus:border-s-coral transition-[border-color,box-shadow] duration-150"
          placeholder={t("namePlaceholder")}
          aria-label={t("nameLabel")}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-s-ink/70 mb-1">
          {t("phoneLabel")}
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          maxLength={20}
          className="w-full rounded-input border border-s-ink/10 bg-white px-3 py-2 text-sm text-s-ink focus:outline-none focus:ring-2 focus:ring-s-coral/15 focus:border-s-coral transition-[border-color,box-shadow] duration-150"
          placeholder={t("phonePlaceholder")}
          aria-label={t("phoneLabel")}
        />
      </div>

      {staff && staff.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-s-ink/70 mb-1">
            {t("preferredBarberLabel")}
          </label>
          <select
            value={preferredBarberId}
            onChange={(e) => setPreferredBarberId(e.target.value)}
            className="w-full rounded-input border border-s-ink/10 bg-white px-3 py-2 text-sm text-s-ink focus:outline-none focus:ring-2 focus:ring-s-coral/15 focus:border-s-coral transition-[border-color,box-shadow] duration-150"
            aria-label={t("preferredBarberLabel")}
          >
            <option value="">{t("noFavorite")}</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}

      {services && services.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-s-ink/70 mb-1">
            {t("serviceLabel")}
          </label>
          <select
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            className="w-full rounded-input border border-s-ink/10 bg-white px-3 py-2 text-sm text-s-ink focus:outline-none focus:ring-2 focus:ring-s-coral/15 focus:border-s-coral transition-[border-color,box-shadow] duration-150"
            aria-label={t("serviceLabel")}
          >
            <option value="">{t("pleaseSelect")}</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.name_de}</option>
            ))}
          </select>
        </div>
      )}

      <button
        type="submit"
        disabled={!name.trim() || submitting}
        className="w-full flex items-center justify-center gap-2 rounded-pill active:scale-[0.97] bg-s-coral text-white font-heading font-bold uppercase tracking-[.04em] py-2.5 text-xs hover:brightness-[1.06] disabled:opacity-50 disabled:cursor-not-allowed transition-[transform,filter] duration-150 shadow-elevation-2"
        aria-label={t("joinNow")}
      >
        <Users size={16} />
        {submitting ? t("joining") : t("joinNow")}
      </button>
    </form>
  );
}
