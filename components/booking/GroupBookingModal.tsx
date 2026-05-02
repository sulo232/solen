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
  const tg = useTranslations("groupBooking") as any;
  const locale = useLocale();
  const [eventType, setEventType] = useState("other");
  const [organizerName, setOrganizerName] = useState("");
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
    if (!organizerName.trim() || members.some(m => !m.name.trim())) {
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
          event_type: eventType,
          organizer_name: organizerName.trim(),
          group_size: members.length,
          member_slots: members.map(() => slotId),
          members: members.map(m => ({
            name: m.name.trim(),
            service_id: m.service_id,
          })),
        }),
      });
      if (!res.ok) {
        let msg = tg("error_generic");
        try { const data = await res.json(); msg = data.message ?? data.error ?? msg; } catch { /* non-JSON error */ }
        throw new Error(msg);
      }
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : tg("booking_failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-60 flex items-center justify-center bg-s-ink/40 backdrop-blur-[6px]" onClick={onClose}>
      <div className="bg-[--raised] rounded-[16px] p-6 mx-4 max-w-lg w-full shadow-surface max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-s-coral" />
            <h3 className="font-heading font-bold text-s-ink">{tg("title")}</h3>
          </div>
          <button onClick={onClose} aria-label={tc("close")} className="p-2 rounded-pill hover:bg-s-ink/5:bg-white/5 transition-colors duration-150">
            <X size={18} className="text-s-ink/40" />
          </button>
        </div>

        {/* Organizer name */}
        <div className="mb-4">
          <label className="text-xs text-s-ink/50 mb-1 block">{tg("organizer_name_label")}</label>
          <input
            type="text"
            value={organizerName}
            onChange={e => setOrganizerName(e.target.value)}
            placeholder={tg("organizer_name_label")}
            className="w-full px-3 py-2 rounded-btn border border-s-ink/10 bg-s-bg-surface text-sm text-s-ink outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20"
          />
        </div>

        {/* Event type */}
        <div className="mb-4">
          <label className="text-xs text-s-ink/50 mb-1 block">{tg("event_type_label")}</label>
          <select
            value={eventType}
            onChange={e => setEventType(e.target.value)}
            className="w-full px-3 py-2 rounded-btn border border-s-ink/10 bg-[--raised] text-sm text-s-ink outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20"
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
              <span className="text-xs text-s-ink/30 w-5 shrink-0">{i + 1}.</span>
              <input
                type="text"
                value={m.name}
                onChange={e => updateMember(i, "name", e.target.value)}
                placeholder={tg("name_placeholder")}
                className="flex-1 px-2 py-1.5 rounded-btn border border-s-ink/10 bg-s-bg-surface text-sm text-s-ink outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20"
              />
              <select
                value={m.service_id}
                onChange={e => updateMember(i, "service_id", e.target.value)}
                className="w-32 px-2 py-1.5 rounded-btn border border-s-ink/10 bg-s-bg-surface text-xs text-s-ink outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20"
              >
                {services.map(s => (
                  <option key={s.id} value={s.id}>{locale === "en" ? s.name_en : s.name_de}</option>
                ))}
              </select>
              <button onClick={() => removeMember(i)} disabled={members.length <= 2} aria-label={tg("remove_person")} className="p-1 text-s-ink/20 hover:text-s-coral disabled:opacity-30 transition-colors duration-150">
                <Minus size={14} />
              </button>
            </div>
          ))}
        </div>

        {members.length < 20 && (
          <button onClick={addMember} className="flex items-center gap-1 text-xs text-s-coral hover:text-s-coral/80 mb-4 transition-colors duration-150">
            <Plus size={12} /> {tg("add_person")}
          </button>
        )}

        {/* Total */}
        <div className="flex justify-between items-center border-t border-s-ink/5 pt-3 mb-4">
          <span className="text-sm text-s-ink/60">{tg("people_count", { count: members.length })}</span>
          <span className="data-text font-bold text-lg text-s-coral">{formatCurrency(totalPrice, locale)}</span>
        </div>

        {error && <p className="text-xs text-s-coral mb-3">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3 rounded-pill active:scale-[0.97] bg-s-coral text-white text-[11px] font-heading font-bold uppercase tracking-[.06em] hover:brightness-[1.06] transition-[transform,filter] duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-coral-glow"
        >
          {submitting && <Spinner size="sm" invert />}
          {tg("book_group")}
        </button>
      </div>
    </div>
  );
}
