"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { X, Phone, User, Send } from "lucide-react";
import Spinner from "@/components/ui/Spinner";

const labels = {
  de: { title: "Walk-in hinzufügen", name: "Kundenname", phone: "Telefon", service: "Service", stylist: "Stylist", cancel: "Abbrechen", create: "Erstellen & SMS", error: "Fehler" },
  en: { title: "Add Walk-in", name: "Customer name", phone: "Phone", service: "Service", stylist: "Stylist", cancel: "Cancel", create: "Create & SMS", error: "Error" },
  fr: { title: "Ajouter un walk-in", name: "Nom du client", phone: "Téléphone", service: "Service", stylist: "Styliste", cancel: "Annuler", create: "Créer & SMS", error: "Erreur" },
  it: { title: "Aggiungi walk-in", name: "Nome del cliente", phone: "Telefono", service: "Servizio", stylist: "Stilista", cancel: "Annulla", create: "Crea & SMS", error: "Errore" },
};

interface WalkInModalProps {
  salonId: string;
  services: { id: string; name: string }[];
  staff: { id: string; name: string }[];
  onClose: () => void;
  onCreated: () => void;
}

export default function WalkInModal({ salonId, services, staff, onClose, onCreated }: WalkInModalProps) {
  const locale = useLocale();
  const l = labels[locale as keyof typeof labels] ?? labels.de;
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
        throw new Error(data.error ?? l.error);
      }
      onCreated();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : l.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-s-ink/40 backdrop-blur-lg px-4" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="walkin-modal-title">
      <div className="bg-white/90 dark:bg-s-dm-surface/95 backdrop-blur-xl rounded-card shadow-glass w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <h3 id="walkin-modal-title" className="font-heading font-bold text-base text-s-ink dark:text-s-dm-text">{l.title}</h3>
          <button onClick={onClose} aria-label="Close"><X size={18} className="text-s-ink/30 dark:text-s-dm-text/30" /></button>
        </div>

        <div className="space-y-3 mb-5">
          <div>
            <label htmlFor="walkin-name" className="flex items-center gap-1.5 text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">
              <User size={12} /> {l.name} *
            </label>
            <input id="walkin-name" value={customerName} onChange={e => setCustomerName(e.target.value)}
              className="w-full px-3 py-2 rounded-input border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-bg text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20" />
          </div>
          <div>
            <label htmlFor="walkin-phone" className="flex items-center gap-1.5 text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">
              <Phone size={12} /> {l.phone} *
            </label>
            <input id="walkin-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="+41791234567"
              className="w-full px-3 py-2 rounded-input border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-bg text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20" />
          </div>
          <div>
            <label htmlFor="walkin-service" className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">{l.service} *</label>
            <select id="walkin-service" value={serviceId} onChange={e => setServiceId(e.target.value)}
              className="w-full px-3 py-2 rounded-input border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-bg text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20">
              {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="walkin-staff" className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">{l.stylist}</label>
            <select id="walkin-staff" value={staffId} onChange={e => setStaffId(e.target.value)}
              className="w-full px-3 py-2 rounded-input border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-bg text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20">
              {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        {error && <p className="text-xs text-s-coral mb-3">{error}</p>}

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-btn border border-s-ink/10 dark:border-white/10 text-sm text-s-ink/60 dark:text-s-dm-text/60">{l.cancel}</button>
          <button onClick={handleCreate} disabled={!customerName.trim() || !serviceId || loading}
            className="flex-1 py-2.5 rounded-btn active:scale-[0.98] bg-s-coral text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
            {loading && <Spinner size="sm" invert />}<Send size={14} /> {l.create}
          </button>
        </div>
      </div>
    </div>
  );
}
