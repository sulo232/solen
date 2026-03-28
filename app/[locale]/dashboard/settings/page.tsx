"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, Check, Plus, Trash2, Pencil, X, CreditCard, ExternalLink, Loader2, Palmtree, Globe, Facebook, Tag } from "lucide-react";
import type { SalonCategory } from "@/lib/types";

// ─────────────────────────────────────────
// Category options shared across Settings
// ─────────────────────────────────────────

import { CATEGORY_OPTIONS } from "@/lib/constants/categories";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import OffPeakManager from "@/components/dashboard/OffPeakManager";
import ExpandableTabs from "@/components/ui/ExpandableTabs";
import SalonCard from "@/components/SalonCard";
import Spinner from "@/components/ui/Spinner";
import { useLocale } from "next-intl";
import { formatCurrency } from "@/lib/format-currency";
import type { Salon } from "@/lib/types";

// ─────────────────────────────────────────
// Opening hours editor
// ─────────────────────────────────────────

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAYS_LABEL = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

function HoursEditor({ hours, onChange }: {
  hours: Record<string, { open: string; close: string } | null>;
  onChange: (h: typeof hours) => void;
}) {
  const toggle = (key: string) => {
    const curr = hours[key];
    onChange({ ...hours, [key]: curr ? null : { open: "09:00", close: "18:00" } });
  };
  const update = (key: string, field: "open" | "close", val: string) => {
    const curr = hours[key];
    if (!curr) return;
    onChange({ ...hours, [key]: { ...curr, [field]: val } });
  };
  return (
    <div className="space-y-2">
      {DAY_KEYS.map((key, i) => {
        const h = hours[key];
        return (
          <div key={key} className="flex items-center gap-3">
            <button type="button" onClick={() => toggle(key)}
              className={["w-9 text-center text-xs font-medium py-1.5 rounded-btn transition-colors",
                h ? "bg-s-coral text-white" : "bg-s-bg-sunken text-s-ink/40"].join(" ")}>
              {DAYS_LABEL[i]}
            </button>
            {h ? (
              <>
                <input type="time" value={h.open} onChange={(e) => update(key, "open", e.target.value)}
                  className="px-2 py-1 rounded-btn border border-s-ink/10 text-xs focus:outline-none focus:border-s-coral" />
                <span className="text-xs text-s-ink/30">–</span>
                <input type="time" value={h.close} onChange={(e) => update(key, "close", e.target.value)}
                  className="px-2 py-1 rounded-btn border border-s-ink/10 text-xs focus:outline-none focus:border-s-coral" />
              </>
            ) : <span className="text-xs text-s-ink/30">Geschlossen</span>}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────
// Profile Tab
// ─────────────────────────────────────────

function ProfileTab({ salon, onSave }: { salon: Salon; onSave: (d: Partial<Salon>) => Promise<void> }) {
  const ext = salon as Salon & { facebook_url?: string; tiktok_url?: string; website_url?: string };
  const salonExt = salon as Salon & { categories?: string[] };
  const [form, setForm] = useState({
    name: salon.name,
    description_de: salon.description_de ?? "",
    description_en: salon.description_en ?? "",
    phone: salon.phone ?? "",
    instagram_url: salon.instagram_url ?? "",
    facebook_url: ext.facebook_url ?? "",
    tiktok_url: ext.tiktok_url ?? "",
    website_url: ext.website_url ?? "",
    cover_photo_url: salon.cover_photo_url ?? "",
    opening_hours: salon.opening_hours ?? {},
    is_top_pick: salon.is_top_pick ?? false,
    categories: (salonExt.categories ?? []) as SalonCategory[],
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggleCategory = (cat: SalonCategory) =>
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat],
    }));

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="py-4 space-y-4 max-w-xl">
      <div>
        <label className="block text-xs font-medium text-s-ink/50 mb-1">Salon-Name *</label>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full px-3 py-2.5 rounded-btn border border-s-ink/10 text-sm focus:outline-none focus:border-s-coral" />
      </div>

      {/* ── Category selector ── */}
      <div>
        <label className="block text-xs font-medium text-s-ink/50 mb-2">
          Kategorien
          <span className="ml-1 text-s-ink/30 font-normal">(mehrere wählbar)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_OPTIONS.map((opt) => {
            const active = form.categories.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleCategory(opt.value)}
                className={[
                  "flex items-center gap-1.5 px-3 py-2 rounded-pill border text-[11px] font-heading font-bold uppercase tracking-[.06em] transition-colors active:scale-[0.98]",
                  active
                    ? "bg-s-coral text-white border-s-coral"
                    : "border-s-ink/[0.08] dark:border-white/[0.08] text-s-ink/55 dark:text-s-dm-text/55 hover:border-s-coral/50",
                ].join(" ")}
                style={active ? { boxShadow: "0 2px 4px rgba(232,98,74,.28), 0 4px 12px rgba(232,98,74,.16)" } : undefined}
              >
                <span className="text-[13px] leading-none">{opt.emoji}</span>
                {opt.label}
                {active && <Check size={10} className="ml-0.5" />}
              </button>
            );
          })}
        </div>
        {form.categories.length === 0 && (
          <p className="text-xs text-s-coral mt-1">Bitte mindestens eine Kategorie auswählen.</p>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-s-ink/50 mb-1">Cover-Foto URL</label>
        <input value={form.cover_photo_url} onChange={(e) => setForm({ ...form, cover_photo_url: e.target.value })}
          className="w-full px-3 py-2.5 rounded-btn border border-s-ink/10 text-sm focus:outline-none focus:border-s-coral" />
      </div>
      <div>
        <label className="block text-xs font-medium text-s-ink/50 mb-1">Beschreibung DE</label>
        <textarea value={form.description_de} onChange={(e) => setForm({ ...form, description_de: e.target.value })}
          rows={3} maxLength={500}
          className="w-full px-3 py-2 rounded-btn border border-s-ink/10 text-sm focus:outline-none focus:border-s-coral resize-none" />
      </div>
      <div>
        <label className="block text-xs font-medium text-s-ink/50 mb-1">Beschreibung EN</label>
        <textarea value={form.description_en} onChange={(e) => setForm({ ...form, description_en: e.target.value })}
          rows={2} maxLength={500}
          className="w-full px-3 py-2 rounded-btn border border-s-ink/10 text-sm focus:outline-none focus:border-s-coral resize-none" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-s-ink/50 mb-1">Telefon</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full px-3 py-2 rounded-btn border border-s-ink/10 text-sm focus:outline-none focus:border-s-coral" />
        </div>
        <div>
          <label className="block text-xs font-medium text-s-ink/50 mb-1">Instagram</label>
          <input value={form.instagram_url} onChange={(e) => setForm({ ...form, instagram_url: e.target.value })}
            placeholder="https://instagram.com/..."
            className="w-full px-3 py-2 rounded-btn border border-s-ink/10 text-sm focus:outline-none focus:border-s-coral" />
        </div>
        <div>
          <label className="block text-xs font-medium text-s-ink/50 mb-1">Facebook</label>
          <input value={form.facebook_url} onChange={(e) => setForm({ ...form, facebook_url: e.target.value })}
            placeholder="https://facebook.com/..."
            className="w-full px-3 py-2 rounded-btn border border-s-ink/10 text-sm focus:outline-none focus:border-s-coral" />
        </div>
        <div>
          <label className="block text-xs font-medium text-s-ink/50 mb-1">TikTok</label>
          <input value={form.tiktok_url} onChange={(e) => setForm({ ...form, tiktok_url: e.target.value })}
            placeholder="https://tiktok.com/@..."
            className="w-full px-3 py-2 rounded-btn border border-s-ink/10 text-sm focus:outline-none focus:border-s-coral" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-s-ink/50 mb-1">Website</label>
        <input value={form.website_url} onChange={(e) => setForm({ ...form, website_url: e.target.value })}
          placeholder="https://..."
          className="w-full px-3 py-2 rounded-btn border border-s-ink/10 text-sm focus:outline-none focus:border-s-coral" />
      </div>
      <div>
        <label className="block text-xs font-medium text-s-ink/50 mb-2">Öffnungszeiten</label>
        <HoursEditor hours={form.opening_hours} onChange={(h) => setForm({ ...form, opening_hours: h })} />
      </div>
      {/* Top Pick Toggle */}
      <div className="border-t border-s-ink/5 pt-4 mt-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={form.is_top_pick} onChange={(e) => setForm({ ...form, is_top_pick: e.target.checked })}
            className="w-5 h-5 rounded border-s-ink/20 text-s-coral focus:ring-s-coral focus:ring-offset-0" />
          <div>
            <span className="block text-sm font-medium text-s-ink">Solen Top Pick</span>
            <span className="block text-xs text-s-ink/50">Zeigt einen "Solen Top Pick" Badge auf deiner Salon-Karte</span>
          </div>
        </label>
      </div>
      {/* Structured info fields */}
      <div className="border-t border-s-ink/5 pt-4 mt-4">
        <p className="text-xs font-medium text-s-ink/50 mb-3">Salondetails (für Kunden sichtbar)</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] text-s-ink/40 mb-1">Atmosphäre</label>
            <input placeholder="z.B. Modern, Gemütlich"
              className="w-full px-3 py-2 rounded-btn border border-s-ink/10 text-sm focus:outline-none focus:border-s-coral" />
          </div>
          <div>
            <label className="block text-[10px] text-s-ink/40 mb-1">Expertise</label>
            <input placeholder="z.B. Balayage, Locken"
              className="w-full px-3 py-2 rounded-btn border border-s-ink/10 text-sm focus:outline-none focus:border-s-coral" />
          </div>
          <div>
            <label className="block text-[10px] text-s-ink/40 mb-1">Produkte</label>
            <input placeholder="z.B. Olaplex, Kérastase"
              className="w-full px-3 py-2 rounded-btn border border-s-ink/10 text-sm focus:outline-none focus:border-s-coral" />
          </div>
          <div>
            <label className="block text-[10px] text-s-ink/40 mb-1">Anfahrt</label>
            <input placeholder="z.B. Tram 8, Parkplätze"
              className="w-full px-3 py-2 rounded-btn border border-s-ink/10 text-sm focus:outline-none focus:border-s-coral" />
          </div>
        </div>
        <div className="mt-3">
          <button type="button" disabled
            className="px-3 py-1.5 rounded-btn border border-s-coral/30 text-s-coral text-xs font-medium opacity-60 cursor-not-allowed"
            title="Kommt bald">
            Vorschlag generieren (Kommt bald)
          </button>
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-s-ink/50 mb-2">So sieht dein Salon für Kunden aus</p>
        <SalonCard salon={{ ...salon, ...form } as Salon} variant="compact" />
      </div>
      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={saving || form.categories.length === 0}
          className="px-5 py-2.5 rounded-btn bg-s-coral text-white text-sm font-medium disabled:opacity-50 flex items-center gap-2">
          {saving && <Spinner size="sm" invert />}Speichern
        </button>
        {saved && <span className="text-sm text-s-coral">Gespeichert ✓</span>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Last-Minute Tab
// ─────────────────────────────────────────

function LastMinuteTab({ salon, onSave }: { salon: Salon; onSave: (d: Partial<Salon>) => Promise<void> }) {
  const [enabled, setEnabled] = useState((salon.last_minute_discount_percent ?? 0) > 0);
  const [discount, setDiscount] = useState(salon.last_minute_discount_percent ?? 10);
  const [windowH, setWindowH] = useState(salon.last_minute_window_hours ?? 6);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({ last_minute_discount_percent: enabled ? discount : 0, last_minute_window_hours: enabled ? windowH : 0 });
    setSaving(false);
  };

  return (
    <div className="py-4 max-w-sm space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-s-ink">Last-Minute aktivieren</p>
          <p className="text-xs text-s-ink/40 mt-0.5">Freie Slots werden automatisch mit Rabatt angezeigt.</p>
        </div>
        <button onClick={() => setEnabled(!enabled)}
          className={["w-11 h-6 rounded-full transition-colors relative", enabled ? "bg-s-coral" : "bg-s-sand"].join(" ")}>
          <span className={["absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform",
            enabled ? "translate-x-5.5" : "translate-x-0.5"].join(" ")} />
        </button>
      </div>
      {enabled && (
        <>
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs font-medium text-s-ink/50">Rabatt</label>
              <span className="text-sm font-bold text-s-coral data-text">{discount}%</span>
            </div>
            <input type="range" min={5} max={50} step={5} value={discount}
              onChange={(e) => setDiscount(+e.target.value)} className="w-full accent-s-coral" />
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs font-medium text-s-ink/50">Zeitfenster</label>
              <span className="text-sm font-bold text-s-coral data-text">{windowH}h</span>
            </div>
            <input type="range" min={2} max={24} step={1} value={windowH}
              onChange={(e) => setWindowH(+e.target.value)} className="w-full accent-s-coral" />
          </div>
        </>
      )}
      <button onClick={handleSave} disabled={saving}
        className="px-5 py-2.5 rounded-btn bg-s-coral text-white text-sm font-medium disabled:opacity-50 flex items-center gap-2">
        {saving && <Spinner size="sm" invert />}Speichern
      </button>
    </div>
  );
}

// ─────────────────────────────────────────
// Quick Reply Templates Tab
// ─────────────────────────────────────────

const DEFAULT_REPLIES = ["Vielen Dank für Ihre Nachricht!", "Ihr Termin wurde bestätigt.", "Leider sind wir ausgebucht."];

function QuickRepliesTab() {
  const [replies, setReplies] = useState<string[]>(() => {
    if (typeof localStorage !== "undefined") {
      try { return JSON.parse(localStorage.getItem("solen_quick_replies") ?? "null") ?? DEFAULT_REPLIES; }
      catch { return DEFAULT_REPLIES; }
    }
    return DEFAULT_REPLIES;
  });
  const [editing, setEditing] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [newValue, setNewValue] = useState("");

  const save = (arr: string[]) => {
    setReplies(arr);
    if (typeof localStorage !== "undefined") localStorage.setItem("solen_quick_replies", JSON.stringify(arr));
  };

  return (
    <div className="py-4 max-w-md space-y-2">
      {replies.map((r, i) => (
        <div key={i} className="flex items-center gap-2 bg-white border border-s-ink/10 rounded-[12px] px-3 py-2.5">
          {editing === i ? (
            <>
              <input value={editValue} onChange={(e) => setEditValue(e.target.value)}
                className="flex-1 text-sm focus:outline-none" autoFocus />
              <button onClick={() => { const a = [...replies]; a[i] = editValue; save(a); setEditing(null); }} className="text-s-coral"><Check size={14} /></button>
              <button onClick={() => setEditing(null)} className="text-s-ink/30"><X size={14} /></button>
            </>
          ) : (
            <>
              <p className="flex-1 text-sm text-s-ink">{r}</p>
              <button onClick={() => { setEditing(i); setEditValue(r); }} className="text-s-ink/30 hover:text-s-coral"><Pencil size={13} /></button>
              <button onClick={() => save(replies.filter((_, j) => j !== i))} className="text-s-ink/30 hover:text-s-coral"><Trash2 size={13} /></button>
            </>
          )}
        </div>
      ))}
      <div className="flex gap-2">
        <input value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="Neue Vorlage…"
          className="flex-1 px-3 py-2 rounded-btn border border-s-ink/10 text-sm focus:outline-none focus:border-s-coral" />
        <button onClick={() => { if (newValue.trim()) { save([...replies, newValue.trim()]); setNewValue(""); } }}
          className="px-3 py-2 rounded-btn bg-s-coral text-white text-sm"><Plus size={14} /></button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// SMS Reminders Tab
// ─────────────────────────────────────────

function SmsRemindersTab({ salon, onSave }: { salon: Salon; onSave: (d: Partial<Salon>) => Promise<void> }) {
  const ext = salon as Salon & { sms_reminder_24h?: boolean; sms_reminder_1h?: boolean };
  const [reminder24h, setReminder24h] = useState(ext.sms_reminder_24h ?? true);
  const [reminder1h, setReminder1h] = useState(ext.sms_reminder_1h ?? true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({ sms_reminder_24h: reminder24h, sms_reminder_1h: reminder1h } as any);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-5 space-y-5">
      <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50">
        SMS-Erinnerungen werden automatisch an Kunden gesendet, um No-Shows zu reduzieren.
      </p>

      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" checked={reminder24h} onChange={(e) => setReminder24h(e.target.checked)}
          className="w-4 h-4 rounded border-s-ink/20 text-s-coral focus:ring-s-coral" />
        <div>
          <span className="text-sm font-medium text-s-ink dark:text-s-dm-text">24 Stunden vorher</span>
          <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40">Kunden erhalten eine SMS 24h vor dem Termin</p>
        </div>
      </label>

      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" checked={reminder1h} onChange={(e) => setReminder1h(e.target.checked)}
          className="w-4 h-4 rounded border-s-ink/20 text-s-coral focus:ring-s-coral" />
        <div>
          <span className="text-sm font-medium text-s-ink dark:text-s-dm-text">1 Stunde vorher</span>
          <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40">Kunden erhalten eine SMS 1h vor dem Termin</p>
        </div>
      </label>

      <div className="pt-2">
        <button onClick={handleSave} disabled={saving}
          className="px-4 py-2 bg-s-coral text-white text-sm font-medium rounded-btn hover:brightness-[1.06] transition-colors disabled:opacity-50">
          {saving ? "Speichern…" : saved ? "Gespeichert ✓" : "Speichern"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Cancellation Tab
// ─────────────────────────────────────────

const CANCEL_HOURS_OPTIONS = [6, 12, 24, 48, 72] as const;
type FeeType = "free" | "flat" | "percentage";

function CancellationTab({ salon, onSave }: { salon: Salon; onSave: (d: Partial<Salon>) => Promise<void> }) {
  const locale = useLocale();
  const ext = salon as Salon & { cancellation_fee_type?: FeeType; cancellation_fee_value?: number; free_cancel_hours?: number };
  const [feeType, setFeeType] = useState<FeeType>(ext.cancellation_fee_type ?? "free");
  const [feeValue, setFeeValue] = useState(ext.cancellation_fee_value ?? 0);
  const [freeHours, setFreeHours] = useState(ext.free_cancel_hours ?? 24);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      cancellation_fee_type: feeType,
      cancellation_fee_value: feeType === "free" ? 0 : feeValue,
      free_cancel_hours: freeHours,
    } as Partial<Salon>);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const feeOptions: { id: FeeType; label: string; desc: string }[] = [
    { id: "free", label: "Kostenlos", desc: "Keine Stornogebühr" },
    { id: "flat", label: "Pauschale", desc: "Fester Betrag in CHF" },
    { id: "percentage", label: "Prozentual", desc: "% des Buchungspreises" },
  ];

  const previewText = feeType === "free"
    ? `Kunden können bis ${freeHours}h vor dem Termin kostenlos stornieren.`
    : feeType === "flat"
      ? `Stornierung innerhalb von ${freeHours}h vor dem Termin kostet ${formatCurrency(feeValue, locale)}.`
      : `Stornierung innerhalb von ${freeHours}h vor dem Termin kostet ${feeValue}% des Buchungspreises.`;

  return (
    <div className="py-4 max-w-md space-y-6">
      {/* Fee type cards */}
      <div>
        <label className="block text-xs font-medium text-s-ink/50 mb-2">Stornogebühr-Typ</label>
        <div className="grid grid-cols-3 gap-2">
          {feeOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setFeeType(opt.id)}
              className={[
                "rounded-[12px] border p-3 text-left transition-colors",
                feeType === opt.id
                  ? "border-s-coral bg-s-coral/5"
                  : "border-s-ink/10 hover:border-s-ink/20",
              ].join(" ")}
            >
              <p className={["text-sm font-medium", feeType === opt.id ? "text-s-coral" : "text-s-ink"].join(" ")}>
                {opt.label}
              </p>
              <p className="text-[10px] text-s-ink/40 mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Fee value input */}
      {feeType !== "free" && (
        <div>
          <label className="block text-xs font-medium text-s-ink/50 mb-1">
            {feeType === "flat" ? "Betrag (CHF)" : "Prozentsatz (%)"}
          </label>
          <input
            type="number"
            min={0}
            max={feeType === "percentage" ? 100 : 500}
            step={feeType === "percentage" ? 5 : 1}
            value={feeValue}
            onChange={(e) => setFeeValue(Math.max(0, Number(e.target.value)))}
            className="w-full px-3 py-2.5 rounded-btn border border-s-ink/10 text-sm data-text focus:outline-none focus:border-s-coral"
          />
        </div>
      )}

      {/* Free cancel window */}
      <div>
        <label className="block text-xs font-medium text-s-ink/50 mb-1">Kostenlose Stornierung bis</label>
        <select
          value={freeHours}
          onChange={(e) => setFreeHours(Number(e.target.value))}
          className="w-full px-3 py-2.5 rounded-btn border border-s-ink/10 text-sm focus:outline-none focus:border-s-coral"
        >
          {CANCEL_HOURS_OPTIONS.map((h) => (
            <option key={h} value={h}>{h} Stunden vor dem Termin</option>
          ))}
        </select>
      </div>

      {/* Preview */}
      <div className="bg-s-bg-surface rounded-[12px] px-4 py-3">
        <p className="text-[10px] font-bold text-s-ink/30 uppercase tracking-widest mb-1">Vorschau für Kunden</p>
        <p className="text-sm text-s-ink/70">{previewText}</p>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={saving}
          className="px-5 py-2.5 rounded-btn bg-s-coral text-white text-sm font-medium disabled:opacity-50 flex items-center gap-2">
          {saving && <Spinner size="sm" invert />}Speichern
        </button>
        {saved && <span className="text-sm text-s-coral">Gespeichert ✓</span>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Verification Tab (Phase 11)
// ─────────────────────────────────────────

function VerificationTab({ salon }: { salon: Salon }) {
  const [confirming, setConfirming] = useState(false);

  const handleVerify = async () => {
    setConfirming(true);
    try { await fetch(`/api/salons/verify?salon_id=${salon.id}`, { method: "POST" }); }
    catch { /* ignore */ } finally { setConfirming(false); }
  };

  const warnings = salon.verification_warnings ?? 0;

  return (
    <div className="py-4 max-w-md space-y-4">
      {warnings > 0 && (
        <div className="bg-s-coral/5 border border-s-coral/20 rounded-[12px] px-4 py-3 flex items-start gap-3">
          <AlertTriangle size={16} className="text-s-coral shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-s-ink">Dein Salon hat {warnings}/3 Warnungen.</p>
            <button onClick={handleVerify} disabled={confirming}
              className="mt-2 px-3 py-1.5 rounded-btn bg-s-coral text-white text-xs font-medium flex items-center gap-2">
              {confirming && <Spinner size="sm" invert />}Jetzt bestätigen
            </button>
          </div>
        </div>
      )}
      {!salon.is_active && (
        <div className="bg-s-error-bg border border-s-error/20 rounded-[12px] px-4 py-3">
          <p className="text-sm font-medium text-s-error">Dein Salon wurde eingefroren.</p>
          <p className="text-xs text-s-error/70 mt-1">Kontaktiere support@solen.ch.</p>
        </div>
      )}
      <div className="bg-s-bg-surface rounded-[12px] px-4 py-3 text-sm text-s-ink/60 space-y-1">
        <p><span className="font-medium">Letzte Verifizierung:</span> {salon.last_verified_at ? new Date(salon.last_verified_at).toLocaleDateString("de-CH") : "–"}</p>
        <p><span className="font-medium">Stornierungsrichtlinie:</span> Kunden können bis 24h vor dem Termin stornieren.</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Vacation Mode Tab
// ─────────────────────────────────────────

function VacationTab({ salon, onSave }: { salon: Salon; onSave: (d: Partial<Salon>) => Promise<void> }) {
  const ext = salon as Salon & { vacation_start?: string | null; vacation_end?: string | null };
  const [start, setStart] = useState(ext.vacation_start ?? "");
  const [end, setEnd] = useState(ext.vacation_end ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isActive = !!start && !!end && new Date(end) >= new Date();
  const todayStr = new Date().toISOString().split("T")[0];

  const handleSave = async () => {
    setSaving(true);
    await onSave({ vacation_start: start || null, vacation_end: end || null } as any);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = async () => {
    setSaving(true);
    setStart("");
    setEnd("");
    await onSave({ vacation_start: null, vacation_end: null } as any);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="py-4 max-w-sm space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-btn bg-s-coral/5 flex items-center justify-center">
          <Palmtree size={18} className="text-s-coral" />
        </div>
        <div>
          <p className="text-sm font-medium text-s-ink">Ferienmodus</p>
          <p className="text-xs text-s-ink/40">Während der Ferien werden keine Buchungen angenommen.</p>
        </div>
      </div>

      {isActive && (
        <div className="bg-s-amber-subtle border border-s-amber/20 rounded-[12px] px-4 py-3 flex items-center gap-3">
          <Palmtree size={16} className="text-s-amber shrink-0" />
          <p className="text-sm text-s-amber-text">
            Ferienmodus aktiv: {new Date(start).toLocaleDateString("de-CH")} – {new Date(end).toLocaleDateString("de-CH")}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-s-ink/50 mb-1">Von</label>
          <input type="date" value={start} min={todayStr}
            onChange={(e) => setStart(e.target.value)}
            className="w-full px-3 py-2.5 rounded-btn border border-s-ink/10 text-sm focus:outline-none focus:border-s-coral" />
        </div>
        <div>
          <label className="block text-xs font-medium text-s-ink/50 mb-1">Bis</label>
          <input type="date" value={end} min={start || todayStr}
            onChange={(e) => setEnd(e.target.value)}
            className="w-full px-3 py-2.5 rounded-btn border border-s-ink/10 text-sm focus:outline-none focus:border-s-coral" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={saving}
          className="px-5 py-2.5 rounded-btn bg-s-coral text-white text-sm font-medium disabled:opacity-50 flex items-center gap-2">
          {saving && <Spinner size="sm" invert />}Speichern
        </button>
        {(start || end) && (
          <button onClick={handleClear} disabled={saving}
            className="px-4 py-2.5 rounded-btn border border-s-ink/10 text-sm text-s-ink/50 hover:border-s-coral hover:text-s-coral transition-colors">
            Deaktivieren
          </button>
        )}
        {saved && <span className="text-sm text-s-coral">Gespeichert ✓</span>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Page
// ─────────────────────────────────────────

// ─────────────────────────────────────────
// Payments Tab
// ─────────────────────────────────────────

type PaymentMode = "at_salon" | "deposit" | "prepay";

function PaymentsTab({ salon, onSave }: { salon: Salon; onSave: (d: Partial<Salon>) => Promise<void> }) {
  const locale = useLocale();
  const ext = salon as Salon & { payment_mode?: PaymentMode; deposit_percent?: number; cancellation_hours?: number; late_cancel_fee_percent?: number };
  const [connectStatus, setConnectStatus] = useState<"loading" | "not_connected" | "pending" | "connected">("loading");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(ext.payment_mode ?? "at_salon");
  const [depositPercent, setDepositPercent] = useState(ext.deposit_percent ?? 20);
  const [cancellationHours, setCancellationHours] = useState(ext.cancellation_hours ?? 24);
  const [lateCancelFee, setLateCancelFee] = useState(ext.late_cancel_fee_percent ?? 50);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);

  useEffect(() => {
    fetch("/api/stripe/connect/status")
      .then((r) => r.json())
      .then((d) => setConnectStatus(d.status ?? "not_connected"))
      .catch(() => setConnectStatus("not_connected"));
  }, []);

  const handleConnect = async () => {
    setConnectLoading(true);
    try {
      const res = await fetch("/api/stripe/connect/create-account", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setConnectLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      payment_mode: paymentMode,
      deposit_percent: depositPercent,
      cancellation_hours: cancellationHours,
      late_cancel_fee_percent: lateCancelFee,
    } as Partial<Salon>);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const statusPill = {
    loading: <span className="px-2 py-0.5 rounded-pill text-xs bg-s-bg-sunken text-s-ink/40">Lädt...</span>,
    not_connected: <span className="px-2 py-0.5 rounded-pill text-xs bg-s-bg-sunken text-s-ink/50">Nicht verbunden</span>,
    pending: <span className="px-2 py-0.5 rounded-pill text-xs bg-s-amber-subtle text-s-amber-text">Ausstehend</span>,
    connected: <span className="px-2 py-0.5 rounded-pill text-xs bg-s-coral/10 text-s-coral font-medium">Verbunden ✓</span>,
  }[connectStatus];

  const modeOptions: { id: PaymentMode; label: string; desc: string }[] = [
    { id: "at_salon", label: "Zahlung im Salon", desc: "Keine Online-Zahlung, Kunden zahlen vor Ort" },
    { id: "deposit", label: "Anzahlung", desc: "Kunden zahlen X% online, Rest im Salon" },
    { id: "prepay", label: "Vorauszahlung", desc: "Kunden zahlen den vollen Betrag online" },
  ];

  return (
    <div className="py-4 max-w-md space-y-6">
      {/* Stripe Connect — always visible */}
      <div className="border border-s-ink/10 rounded-[12px] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-s-ink/40" />
            <p className="text-sm font-medium text-s-ink dark:text-s-dm-text">Bankkonto verknüpfen</p>
          </div>
          {statusPill}
        </div>
        <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50">
          Stripe Connect überweist Zahlungen direkt auf dein Konto. Benötigt einmalige Verifizierung.
        </p>
        {connectStatus !== "connected" && (
          <button
            onClick={handleConnect}
            disabled={connectLoading || connectStatus === "loading"}
            className="flex items-center gap-2 px-4 py-2.5 rounded-btn bg-s-coral text-white text-sm font-medium hover:brightness-[1.06] transition-colors disabled:opacity-50"
          >
            {connectLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
            {connectStatus === "pending" ? "Verifizierung fortsetzen" : "Jetzt verknüpfen"}
          </button>
        )}
        {connectStatus === "connected" && (
          <p className="text-xs text-[#4CAF6F] font-medium flex items-center gap-1">
            ✓ Dein Bankkonto ist verknüpft — Auszahlungen erfolgen automatisch.
          </p>
        )}
      </div>

      {/* Marketing card */}
      <div className="rounded-[12px] bg-s-coral/5 border border-s-coral/20 p-4">
        <p className="text-sm font-semibold text-s-coral mb-1">Zahlungsmodus wählen</p>
        <p className="text-xs text-s-ink/60 leading-relaxed">
          Wähle, wie deine Kunden bezahlen. Anzahlung oder Vorauszahlung schützt vor No-Shows.
        </p>
      </div>

      {/* Payment mode radio cards */}
      <div>
        <label className="block text-xs font-medium text-s-ink/50 mb-2">Zahlungsmodus</label>
        <div className="space-y-2">
          {modeOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setPaymentMode(opt.id)}
              className={[
                "w-full rounded-[12px] border p-3.5 text-left transition-colors flex items-center gap-3",
                paymentMode === opt.id ? "border-s-coral bg-s-coral/5" : "border-s-ink/10 hover:border-s-ink/20",
              ].join(" ")}
            >
              <div className={[
                "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
                paymentMode === opt.id ? "border-s-coral" : "border-s-ink/20"
              ].join(" ")}>
                {paymentMode === opt.id && <div className="w-2 h-2 rounded-full bg-s-coral" />}
              </div>
              <div>
                <p className={["text-sm font-medium", paymentMode === opt.id ? "text-s-coral" : "text-s-ink"].join(" ")}>
                  {opt.label}
                </p>
                <p className="text-[11px] text-s-ink/40 mt-0.5">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Deposit percent slider */}
      {paymentMode === "deposit" && (
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-xs font-medium text-s-ink/50">Anzahlung</label>
            <span className="text-sm font-bold text-s-coral data-text">{depositPercent}%</span>
          </div>
          <input
            type="range" min={5} max={50} step={5} value={depositPercent}
            onChange={(e) => setDepositPercent(+e.target.value)}
            className="w-full accent-s-coral"
          />
          <div className="flex justify-between text-xs text-s-ink/30 mt-1">
            <span>5%</span><span>50%</span>
          </div>
          <p className="text-xs text-s-ink/40 mt-2">
            Bei einer Buchung von {formatCurrency(100, locale)} zahlt der Kunde {formatCurrency(depositPercent, locale)} online und {formatCurrency(100 - depositPercent, locale)} im Salon.
          </p>
        </div>
      )}

      {/* No-show protection settings */}
      {paymentMode !== "at_salon" && (
        <div className="border-t border-s-ink/5 pt-4 space-y-4">
          <p className="text-xs font-medium text-s-ink/50">No-Show-Schutz</p>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs text-s-ink/50">Kostenlose Stornierung bis</label>
              <span className="text-sm font-bold text-s-ink data-text">{cancellationHours}h vorher</span>
            </div>
            <input
              type="range" min={2} max={72} step={2} value={cancellationHours}
              onChange={(e) => setCancellationHours(+e.target.value)}
              className="w-full accent-s-coral"
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs text-s-ink/50">Gebühr bei verspäteter Stornierung</label>
              <span className="text-sm font-bold text-s-coral data-text">{lateCancelFee}%</span>
            </div>
            <input
              type="range" min={0} max={100} step={10} value={lateCancelFee}
              onChange={(e) => setLateCancelFee(+e.target.value)}
              className="w-full accent-coral"
            />
            <p className="text-xs text-s-ink/40 mt-1">
              Wird automatisch bei Stornierung innerhalb der Frist belastet.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-btn bg-s-coral text-white text-sm font-medium disabled:opacity-50 flex items-center gap-2"
        >
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Speichern
        </button>
        {saved && <span className="text-sm text-s-coral">Gespeichert ✓</span>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Closures / Holidays Tab
// ─────────────────────────────────────────

function ClosuresTab({ salon }: { salon: Salon }) {
  const [closures, setClosures] = useState<{ id: string; date: string; reason: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    fetch(`/api/salon/closures?salon_id=${salon.id}`)
      .then((r) => r.json())
      .then((d) => setClosures(d.closures ?? d.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [salon.id]);

  const addClosure = async () => {
    if (!date) return;
    const res = await fetch("/api/salon/closures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ salon_id: salon.id, date, reason }),
    });
    if (res.ok) {
      const c = await res.json();
      setClosures((prev) => [...prev, c]);
      setDate("");
      setReason("");
    }
  };

  const removeClosure = async (id: string) => {
    await fetch(`/api/salon/closures/${id}`, { method: "DELETE" });
    setClosures((prev) => prev.filter((c) => c.id !== id));
  };

  if (loading) return <div className="py-6 flex justify-center"><Spinner size="md" /></div>;

  return (
    <div className="py-4 max-w-md space-y-4">
      <p className="text-xs text-s-ink/50">Tage, an denen Ihr Salon geschlossen ist (Feiertage, Betriebsferien etc.)</p>
      <div className="flex gap-2">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
          className="flex-1 px-3 py-2 rounded-btn border border-s-ink/10 text-sm focus:outline-none focus:border-s-coral" />
        <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Grund (optional)"
          className="flex-1 px-3 py-2 rounded-btn border border-s-ink/10 text-sm focus:outline-none focus:border-s-coral" />
        <button onClick={addClosure} disabled={!date}
          className="px-3 py-2 rounded-btn bg-s-coral text-white text-sm disabled:opacity-50">
          <Plus size={14} />
        </button>
      </div>
      {closures.length === 0 ? (
        <p className="text-xs text-s-ink/30 text-center py-4">Keine Schließtage eingetragen</p>
      ) : (
        <div className="space-y-1">
          {closures.map((c) => (
            <div key={c.id} className="flex items-center justify-between py-2 px-3 bg-s-bg-surface/50 rounded-btn border border-s-ink/5">
              <div>
                <span className="text-sm data-text text-s-ink">{new Date(c.date).toLocaleDateString("de-CH")}</span>
                {c.reason && <span className="text-xs text-s-ink/40 ml-2">{c.reason}</span>}
              </div>
              <button onClick={() => removeClosure(c.id)} className="text-s-ink/30 hover:text-s-coral transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// Scheduling / Terminvergabe Tab
// ─────────────────────────────────────────

function SchedulingTab({ salon, onSave }: { salon: Salon; onSave: (d: Partial<Salon>) => Promise<void> }) {
  const ext = salon as Salon & { auto_assign_method?: string; daily_limit_enabled?: boolean; daily_limit?: number; booking_confirmation_mode?: "instant" | "manual_approval" };
  const [method, setMethod] = useState(ext.auto_assign_method ?? "manual");
  const [limitEnabled, setLimitEnabled] = useState(ext.daily_limit_enabled ?? false);
  const [limit, setLimit] = useState(ext.daily_limit ?? 20);
  const [confirmMode, setConfirmMode] = useState<"instant" | "manual_approval">(ext.booking_confirmation_mode ?? "instant");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({ auto_assign_method: method, daily_limit_enabled: limitEnabled, daily_limit: limit, booking_confirmation_mode: confirmMode } as any);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="py-4 max-w-md space-y-5">
      <div>
        <label className="block text-xs font-medium text-s-ink/50 mb-2">Buchungsbestätigung</label>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { id: "instant", label: "Sofortige Bestätigung", desc: "Autom. bestätigt" },
            { id: "manual_approval", label: "Manuelle Freigabe", desc: "Sie bestätigen" },
          ].map((opt) => (
            <button key={opt.id} type="button" onClick={() => setConfirmMode(opt.id as any)}
              className={["rounded-[12px] border p-3 text-left transition-colors",
                confirmMode === opt.id ? "border-s-coral bg-s-coral/5" : "border-s-ink/10 hover:border-s-ink/20"].join(" ")}>
              <p className={["text-sm font-medium", confirmMode === opt.id ? "text-s-coral" : "text-s-ink"].join(" ")}>{opt.label}</p>
              <p className="text-[10px] text-s-ink/40 mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-s-ink/50 mb-2">Termin-Zuweisung</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: "manual", label: "Manuell", desc: "Sie weisen selbst zu" },
            { id: "round_robin", label: "Reihum", desc: "Gleichmäßig verteilt" },
            { id: "least_busy", label: "Wenigster", desc: "Am wenigsten ausgelastet" },
          ].map((opt) => (
            <button key={opt.id} type="button" onClick={() => setMethod(opt.id)}
              className={["rounded-[12px] border p-3 text-left transition-colors",
                method === opt.id ? "border-s-coral bg-s-coral/5" : "border-s-ink/10 hover:border-s-ink/20"].join(" ")}>
              <p className={["text-sm font-medium", method === opt.id ? "text-s-coral" : "text-s-ink"].join(" ")}>{opt.label}</p>
              <p className="text-[10px] text-s-ink/40 mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setLimitEnabled(!limitEnabled)}
          className={limitEnabled ? "text-s-coral" : "text-s-ink/30"}>
          {limitEnabled ? <Check size={18} /> : <X size={18} />}
        </button>
        <div className="flex-1">
          <p className="text-sm text-s-ink">Tägliches Limit pro Stylist</p>
          {limitEnabled && (
            <input type="number" min={1} max={50} value={limit}
              onChange={(e) => setLimit(+e.target.value)}
              className="mt-1 w-24 px-2 py-1.5 rounded-btn border border-s-ink/10 text-sm data-text focus:outline-none focus:border-s-coral" />
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={saving}
          className="px-5 py-2.5 rounded-btn bg-s-coral text-white text-sm font-medium disabled:opacity-50 flex items-center gap-2">
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Speichern
        </button>
        {saved && <span className="text-sm text-s-coral">Gespeichert ✓</span>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Team Commission Tab
// ─────────────────────────────────────────

function CommissionTab({ salon }: { salon: Salon }) {
  const [staff, setStaff] = useState<{ id: string; name: string; commission_pct: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/staff?salon_id=${salon.id}`)
      .then((r) => r.json())
      .then((d) => {
        const members = d.staff ?? d.items ?? [];
        setStaff(members.map((s: any) => ({ id: s.id, name: s.name, commission_pct: s.commission_pct ?? 0 })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [salon.id]);

  const updateCommission = async (id: string, pct: number) => {
    setSaving(id);
    await fetch(`/api/staff/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commission_pct: pct }),
    });
    setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, commission_pct: pct } : s)));
    setSaving(null);
  };

  if (loading) return <div className="py-6 flex justify-center"><Spinner size="md" /></div>;
  if (staff.length === 0) return <p className="text-xs text-s-ink/30 text-center py-6">Kein Team eingerichtet</p>;

  return (
    <div className="py-4 max-w-md space-y-3">
      <p className="text-xs text-s-ink/50">Legen Sie den Provisionssatz (%) für jeden Stylisten fest.</p>
      {staff.map((s) => (
        <div key={s.id} className="flex items-center gap-3 py-2 border-b border-s-ink/5 last:border-0">
          <span className="text-sm font-medium text-s-ink flex-1">{s.name}</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={100}
              step={5}
              value={s.commission_pct}
              onChange={(e) => {
                const v = Math.min(100, Math.max(0, +e.target.value));
                setStaff((prev) => prev.map((st) => (st.id === s.id ? { ...st, commission_pct: v } : st)));
              }}
              className="w-16 px-2 py-1.5 rounded-btn border border-s-ink/10 text-sm data-text text-right focus:outline-none focus:border-s-coral"
            />
            <span className="text-xs text-s-ink/40">%</span>
            <button
              onClick={() => updateCommission(s.id, s.commission_pct)}
              disabled={saving === s.id}
              className="px-2 py-1 rounded-btn bg-s-coral/10 text-s-coral text-xs font-medium hover:bg-s-coral/20 transition-colors disabled:opacity-50"
            >
              {saving === s.id ? "..." : "OK"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SettingsPage() {
  const params = useSearchParams();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(params.get("verified") === "1" ? "Verifizierung erfolgreich! ✓" : "");

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((p) => {
        if (p?.salon_id) return fetch(`/api/salons/${p.salon_id}`).then((r) => r.json());
        return null;
      })
      .then((d) => { if (d) setSalon(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (updates: Partial<Salon>) => {
    if (!salon) return;
    await fetch(`/api/salons/${salon.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates),
    });
    setSalon((prev) => prev ? { ...prev, ...updates } : prev);
  };

  return (
    <DashboardLayout>
      {salon && !salon.is_active && (
        <div className="fixed inset-0 z-40 bg-s-error-bg/90 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white border border-s-error/20 rounded-[12px] p-8 text-center max-w-sm shadow-warm-lg">
            <AlertTriangle size={32} className="text-s-error mx-auto mb-3" />
            <h2 className="font-heading font-bold text-lg text-s-ink mb-2">Salon eingefroren</h2>
            {(salon as any).frozen_reason && (
              <p className="text-sm text-s-ink/80 mb-2 bg-s-error-bg rounded-btn px-3 py-2">{(salon as any).frozen_reason}</p>
            )}
            {(salon as any).warning_count > 0 && (
              <p className="text-xs text-s-error/70 mb-2">{(salon as any).warning_count}/3 Warnungen erhalten</p>
            )}
            <p className="text-sm text-s-ink/60">Kontaktiere support@solen.ch für weitere Informationen.</p>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-s-coral text-white px-4 py-2.5 rounded-pill shadow-lg text-sm font-medium">
          {toast}
        </div>
      )}

      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl text-s-ink">Einstellungen</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : !salon ? (
        <div className="text-center py-12 text-s-ink/30 text-sm">Salon nicht gefunden</div>
      ) : (
        <div className="bg-white rounded-[12px] shadow-warm-md">
          <ExpandableTabs
            defaultTab="profile"
            tabs={[
              { id: "profile", label: "Profil", content: <ProfileTab salon={salon} onSave={handleSave} /> },
              { id: "lastminute", label: "Last-Minute", content: <LastMinuteTab salon={salon} onSave={handleSave} /> },
              { id: "payments", label: "Zahlungen", content: <PaymentsTab salon={salon} onSave={handleSave} /> },
              { id: "quickreplies", label: "Schnellantworten", content: <QuickRepliesTab /> },
              { id: "verification", label: "Verifizierung", content: <VerificationTab salon={salon} /> },
              { id: "vacation", label: "Ferien", content: <VacationTab salon={salon} onSave={handleSave} /> },
              { id: "sms", label: "SMS-Erinnerungen", content: <SmsRemindersTab salon={salon} onSave={handleSave} /> },
              { id: "cancellation", label: "Stornierung", content: <CancellationTab salon={salon} onSave={handleSave} /> },
              { id: "closures", label: "Feiertage", content: <ClosuresTab salon={salon} /> },
              { id: "scheduling", label: "Terminvergabe", content: <SchedulingTab salon={salon} onSave={handleSave} /> },
              { id: "commission", label: "Provision", content: <CommissionTab salon={salon} /> },
              { id: "offpeak", label: "Nebenzeiten", content: <OffPeakManager salonId={salon.id} /> },
            ]}
          />
        </div>
      )}
    </DashboardLayout>
  );
}
