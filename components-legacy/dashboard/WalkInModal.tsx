"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { X, Phone, User, Send } from "lucide-react";
import Spinner from "@/components-legacy/ui/Spinner";

interface WalkInModalProps {
  salonId: string;
  services: { id: string; name: string }[];
  staff: { id: string; name: string }[];
  onClose: () => void;
  onCreated: () => void;
}

export default function WalkInModal({ salonId, services, staff, onClose, onCreated }: WalkInModalProps) {
  const t = useTranslations("dashboard.walkin_modal") as any;
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("+41");
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [staffId, setStaffId] = useState(staff[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleCreate = async () => {
    if (!customerName.trim() || !phone || !serviceId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings/walk-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salon_id: salonId,
          customer_name: customerName.trim(),
          customer_phone: phone.replace(/\s/g, ""),
          service_id: serviceId,
          staff_member_id: staffId || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? t("error"));
      }
      onCreated();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-s-ink/40 backdrop-blur-[6px] px-4" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="walkin-modal-title">
      <div className="bg-white rounded-[16px] shadow-surface w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <h3 id="walkin-modal-title" className="font-heading text-base text-s-ink">{t("title")}</h3>
          <button onClick={onClose} aria-label={t("close")} className="p-2 rounded-pill hover:bg-s-ink/5:bg-white/5 transition-colors duration-150"><X size={18} className="text-s-ink/40" /></button>
        </div>

        <div className="space-y-3 mb-5">
          <div>
            <label htmlFor="walkin-name" className="flex items-center gap-1.5 text-xs font-medium text-s-ink/50 mb-1">
              <User size={12} /> {t("name")} *
            </label>
            <input id="walkin-name" value={customerName} onChange={e => setCustomerName(e.target.value)}
              className="w-full px-3 py-2 rounded-input border border-s-ink/10 bg-white text-sm text-s-ink focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20" />
          </div>
          <div>
            <label htmlFor="walkin-phone" className="flex items-center gap-1.5 text-xs font-medium text-s-ink/50 mb-1">
              <Phone size={12} /> {t("phone")} *
            </label>
            <input id="walkin-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="+41791234567"
              className="w-full px-3 py-2 rounded-input border border-s-ink/10 bg-white text-sm text-s-ink focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20" />
          </div>
          <div>
            <label htmlFor="walkin-service" className="block text-xs font-medium text-s-ink/50 mb-1">{t("service")} *</label>
            <select id="walkin-service" value={serviceId} onChange={e => setServiceId(e.target.value)}
              className="w-full px-3 py-2 rounded-input border border-s-ink/10 bg-white text-sm text-s-ink focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20">
              {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="walkin-staff" className="block text-xs font-medium text-s-ink/50 mb-1">{t("stylist")}</label>
            <select id="walkin-staff" value={staffId} onChange={e => setStaffId(e.target.value)}
              className="w-full px-3 py-2 rounded-input border border-s-ink/10 bg-white text-sm text-s-ink focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20">
              {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        {error && <p className="text-xs text-s-coral mb-3">{error}</p>}

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-pill border border-s-ink/10 text-sm text-s-ink/60 hover:border-s-coral/40 hover:text-s-coral active:scale-[0.97] transition-[transform,border-color,color] duration-150">{t("cancel")}</button>
          <button onClick={handleCreate} disabled={!customerName.trim() || !serviceId || loading}
            className="flex-1 py-2.5 rounded-pill active:scale-[0.97] bg-s-coral text-white text-[11px] font-heading uppercase tracking-[.06em] hover:brightness-[1.06] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-[transform,filter] duration-150 shadow-elevation-2">
            {loading && <Spinner size="sm" invert />}<Send size={14} /> {t("create")}
          </button>
        </div>
      </div>
    </div>
  );
}
