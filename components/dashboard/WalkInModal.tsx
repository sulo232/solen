"use client";

import { useState } from "react";
import { X, Phone, User, Send } from "lucide-react";
import Spinner from "@/components/ui/Spinner";

interface WalkInModalProps {
  salonId: string;
  services: { id: string; name: string }[];
  staff: { id: string; name: string }[];
  onClose: () => void;
  onCreated: () => void;
}

export default function WalkInModal({ salonId, services, staff, onClose, onCreated }: WalkInModalProps) {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("+41");
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [staffId, setStaffId] = useState(staff[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        throw new Error(data.error ?? "Fehler");
      }
      onCreated();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-s-ink/40 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="bg-white dark:bg-s-dm-surface rounded-card shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <h3 className="font-heading font-bold text-base text-s-ink dark:text-s-dm-text">Walk-in hinzufügen</h3>
          <button onClick={onClose}><X size={18} className="text-s-ink/30 dark:text-s-dm-text/30" /></button>
        </div>

        <div className="space-y-3 mb-5">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">
              <User size={12} /> Kundenname *
            </label>
            <input value={customerName} onChange={e => setCustomerName(e.target.value)}
              className="w-full px-3 py-2 rounded-button border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-bg text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral" />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">
              <Phone size={12} /> Telefon *
            </label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="+41791234567"
              className="w-full px-3 py-2 rounded-button border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-bg text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral" />
          </div>
          <div>
            <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">Service *</label>
            <select value={serviceId} onChange={e => setServiceId(e.target.value)}
              className="w-full px-3 py-2 rounded-button border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-bg text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral">
              {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">Stylist</label>
            <select value={staffId} onChange={e => setStaffId(e.target.value)}
              className="w-full px-3 py-2 rounded-button border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-bg text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral">
              {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        {error && <p className="text-xs text-s-coral mb-3">{error}</p>}

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-button border border-s-ink/10 dark:border-white/10 text-sm text-s-ink/60 dark:text-s-dm-text/60">Abbrechen</button>
          <button onClick={handleCreate} disabled={!customerName.trim() || !serviceId || loading}
            className="flex-1 py-2.5 rounded-button bg-s-coral text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Spinner size="sm" invert />}<Send size={14} /> Erstellen & SMS
          </button>
        </div>
      </div>
    </div>
  );
}
