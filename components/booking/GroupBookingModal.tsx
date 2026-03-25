"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { Users, X, Plus, Minus } from "lucide-react";
import { formatCurrency } from "@/lib/format-currency";
import Spinner from "@/components/ui/Spinner";

interface Service {
  id: string;
  name_de: string;
  name_en: string;
  price: number;
  duration_minutes: number;
}

interface GroupMember {
  name: string;
  service_id: string;
}

const EVENT_TYPES = [
  { value: "wedding", label_de: "Hochzeit", label_en: "Wedding" },
  { value: "birthday", label_de: "Geburtstag", label_en: "Birthday" },
  { value: "corporate", label_de: "Firma", label_en: "Corporate" },
  { value: "other", label_de: "Andere", label_en: "Other" },
];

interface GroupBookingModalProps {
  salonId: string;
  slotId: string;
  services: Service[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function GroupBookingModal({ salonId, slotId, services, onClose, onSuccess }: GroupBookingModalProps) {
  const tc = useTranslations("common");
  const locale = useLocale();
  const [eventType, setEventType] = useState("other");
  const [members, setMembers] = useState<GroupMember[]>([
    { name: "", service_id: services[0]?.id ?? "" },
    { name: "", service_id: services[0]?.id ?? "" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Escape key to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const addMember = () => {
    if (members.length >= 20) return;
    setMembers([...members, { name: "", service_id: services[0]?.id ?? "" }]);
  };

  const removeMember = (i: number) => {
    if (members.length <= 2) return;
    setMembers(members.filter((_, idx) => idx !== i));
  };

  const updateMember = (i: number, field: keyof GroupMember, value: string) => {
    setMembers(members.map((m, idx) => idx === i ? { ...m, [field]: value } : m));
  };

  const totalPrice = members.reduce((sum, m) => {
    const svc = services.find(s => s.id === m.service_id);
    return sum + (svc?.price ?? 0);
  }, 0);

  const handleSubmit = async () => {
    if (members.some(m => !m.name.trim())) {
      setError(tc("pleaseFill"));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings/group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salon_id: salonId,
          slot_id: slotId,
          event_type: eventType,
          members: members.map(m => ({
            guest_name: m.name.trim(),
            service_id: m.service_id,
          })),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message ?? data.error ?? "Fehler");
      }
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Buchung fehlgeschlagen");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-s-ink/40 backdrop-blur-lg" onClick={onClose}>
      <div className="bg-white dark:bg-s-dm-surface rounded-card p-6 mx-4 max-w-lg w-full shadow-glass max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-s-coral" />
            <h3 className="font-heading font-bold text-s-ink dark:text-s-dm-text">Gruppenbuchung</h3>
          </div>
          <button onClick={onClose} aria-label="Schliessen" className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-btn hover:bg-s-ink/5 dark:hover:bg-white/5 transition-colors">
            <X size={18} className="text-s-ink/40 dark:text-s-dm-text/40" />
          </button>
        </div>

        {/* Event type */}
        <div className="mb-4">
          <label className="text-xs text-s-ink/50 dark:text-s-dm-text/50 mb-1 block">Anlass</label>
          <select
            value={eventType}
            onChange={e => setEventType(e.target.value)}
            className="w-full px-3 py-2 rounded-btn border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-bg text-sm text-s-ink dark:text-s-dm-text outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20"
          >
            {EVENT_TYPES.map(t => (
              <option key={t.value} value={t.value}>{locale === "en" ? t.label_en : t.label_de}</option>
            ))}
          </select>
        </div>

        {/* Members */}
        <div className="space-y-3 mb-4">
          {members.map((m, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-s-ink/30 dark:text-s-dm-text/30 w-5 shrink-0">{i + 1}.</span>
              <input
                type="text"
                value={m.name}
                onChange={e => updateMember(i, "name", e.target.value)}
                placeholder="Name"
                className="flex-1 px-2 py-1.5 rounded-btn border border-s-ink/10 dark:border-white/10 bg-s-bg-surface dark:bg-s-dm-bg text-sm text-s-ink dark:text-s-dm-text outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20"
              />
              <select
                value={m.service_id}
                onChange={e => updateMember(i, "service_id", e.target.value)}
                className="w-32 px-2 py-1.5 rounded-btn border border-s-ink/10 dark:border-white/10 bg-s-bg-surface dark:bg-s-dm-bg text-xs text-s-ink dark:text-s-dm-text outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20"
              >
                {services.map(s => (
                  <option key={s.id} value={s.id}>{locale === "en" ? s.name_en : s.name_de}</option>
                ))}
              </select>
              <button onClick={() => removeMember(i)} disabled={members.length <= 2} className="p-1 text-s-ink/20 hover:text-s-coral disabled:opacity-30 transition-colors">
                <Minus size={14} />
              </button>
            </div>
          ))}
        </div>

        {members.length < 20 && (
          <button onClick={addMember} className="flex items-center gap-1 text-xs text-s-coral hover:text-s-coral/80 mb-4 transition-colors">
            <Plus size={12} /> Person hinzufügen
          </button>
        )}

        {/* Total */}
        <div className="flex justify-between items-center border-t border-s-ink/5 dark:border-white/5 pt-3 mb-4">
          <span className="text-sm text-s-ink/60 dark:text-s-dm-text/60">{members.length} Personen</span>
          <span className="data-text font-bold text-lg text-s-coral">{formatCurrency(totalPrice, locale)}</span>
        </div>

        {error && <p className="text-xs text-s-coral mb-3">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3 rounded-btn active:scale-[0.98] bg-s-coral text-white font-semibold text-sm hover:bg-s-coral/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting && <Spinner size="sm" invert />}
          Gruppe buchen
        </button>
      </div>
    </div>
  );
}
