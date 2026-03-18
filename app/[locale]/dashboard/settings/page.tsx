"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, Check, Plus, Trash2, Pencil, X, CreditCard, ExternalLink, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ExpandableTabs from "@/components/ui/ExpandableTabs";
import SalonCard from "@/components/SalonCard";
import Spinner from "@/components/ui/Spinner";
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
              className={["w-9 text-center text-xs font-medium py-1.5 rounded-button transition-colors",
                h ? "bg-teal text-white" : "bg-gray-100 text-dark/40"].join(" ")}>
              {DAYS_LABEL[i]}
            </button>
            {h ? (
              <>
                <input type="time" value={h.open} onChange={(e) => update(key, "open", e.target.value)}
                  className="px-2 py-1 rounded-button border border-gray-200 text-xs focus:outline-none focus:border-teal" />
                <span className="text-xs text-dark/30">–</span>
                <input type="time" value={h.close} onChange={(e) => update(key, "close", e.target.value)}
                  className="px-2 py-1 rounded-button border border-gray-200 text-xs focus:outline-none focus:border-teal" />
              </>
            ) : <span className="text-xs text-dark/30">Geschlossen</span>}
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
  const [form, setForm] = useState({
    name: salon.name,
    description_de: salon.description_de ?? "",
    description_en: salon.description_en ?? "",
    phone: salon.phone ?? "",
    instagram_url: salon.instagram_url ?? "",
    cover_photo_url: salon.cover_photo_url ?? "",
    opening_hours: salon.opening_hours ?? {},
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
        <label className="block text-xs font-medium text-dark/50 mb-1">Salon-Name *</label>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full px-3 py-2.5 rounded-button border border-gray-200 text-sm focus:outline-none focus:border-teal" />
      </div>
      <div>
        <label className="block text-xs font-medium text-dark/50 mb-1">Cover-Foto URL</label>
        <input value={form.cover_photo_url} onChange={(e) => setForm({ ...form, cover_photo_url: e.target.value })}
          className="w-full px-3 py-2.5 rounded-button border border-gray-200 text-sm focus:outline-none focus:border-teal" />
      </div>
      <div>
        <label className="block text-xs font-medium text-dark/50 mb-1">Beschreibung DE</label>
        <textarea value={form.description_de} onChange={(e) => setForm({ ...form, description_de: e.target.value })}
          rows={3} maxLength={500}
          className="w-full px-3 py-2 rounded-button border border-gray-200 text-sm focus:outline-none focus:border-teal resize-none" />
      </div>
      <div>
        <label className="block text-xs font-medium text-dark/50 mb-1">Beschreibung EN</label>
        <textarea value={form.description_en} onChange={(e) => setForm({ ...form, description_en: e.target.value })}
          rows={2} maxLength={500}
          className="w-full px-3 py-2 rounded-button border border-gray-200 text-sm focus:outline-none focus:border-teal resize-none" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-dark/50 mb-1">Telefon</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full px-3 py-2 rounded-button border border-gray-200 text-sm focus:outline-none focus:border-teal" />
        </div>
        <div>
          <label className="block text-xs font-medium text-dark/50 mb-1">Instagram</label>
          <input value={form.instagram_url} onChange={(e) => setForm({ ...form, instagram_url: e.target.value })}
            className="w-full px-3 py-2 rounded-button border border-gray-200 text-sm focus:outline-none focus:border-teal" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-dark/50 mb-2">Öffnungszeiten</label>
        <HoursEditor hours={form.opening_hours} onChange={(h) => setForm({ ...form, opening_hours: h })} />
      </div>
      <div>
        <p className="text-xs font-medium text-dark/50 mb-2">So sieht dein Salon für Kunden aus</p>
        <SalonCard salon={{ ...salon, ...form } as Salon} variant="compact" />
      </div>
      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={saving}
          className="px-5 py-2.5 rounded-button bg-teal text-white text-sm font-medium disabled:opacity-50 flex items-center gap-2">
          {saving && <Spinner size="sm" invert />}Speichern
        </button>
        {saved && <span className="text-sm text-teal">Gespeichert ✓</span>}
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
          <p className="text-sm font-medium text-dark">Last-Minute aktivieren</p>
          <p className="text-xs text-dark/40 mt-0.5">Freie Slots werden automatisch mit Rabatt angezeigt.</p>
        </div>
        <button onClick={() => setEnabled(!enabled)}
          className={["w-11 h-6 rounded-full transition-colors relative", enabled ? "bg-teal" : "bg-gray-200"].join(" ")}>
          <span className={["absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform",
            enabled ? "translate-x-5.5" : "translate-x-0.5"].join(" ")} />
        </button>
      </div>
      {enabled && (
        <>
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs font-medium text-dark/50">Rabatt</label>
              <span className="text-sm font-bold text-teal font-data">{discount}%</span>
            </div>
            <input type="range" min={5} max={50} step={5} value={discount}
              onChange={(e) => setDiscount(+e.target.value)} className="w-full accent-teal" />
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs font-medium text-dark/50">Zeitfenster</label>
              <span className="text-sm font-bold text-teal font-data">{windowH}h</span>
            </div>
            <input type="range" min={2} max={24} step={1} value={windowH}
              onChange={(e) => setWindowH(+e.target.value)} className="w-full accent-teal" />
          </div>
        </>
      )}
      <button onClick={handleSave} disabled={saving}
        className="px-5 py-2.5 rounded-button bg-teal text-white text-sm font-medium disabled:opacity-50 flex items-center gap-2">
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
        <div key={i} className="flex items-center gap-2 bg-white border border-gray-200 rounded-card px-3 py-2.5">
          {editing === i ? (
            <>
              <input value={editValue} onChange={(e) => setEditValue(e.target.value)}
                className="flex-1 text-sm focus:outline-none" autoFocus />
              <button onClick={() => { const a = [...replies]; a[i] = editValue; save(a); setEditing(null); }} className="text-teal"><Check size={14} /></button>
              <button onClick={() => setEditing(null)} className="text-dark/30"><X size={14} /></button>
            </>
          ) : (
            <>
              <p className="flex-1 text-sm text-dark">{r}</p>
              <button onClick={() => { setEditing(i); setEditValue(r); }} className="text-dark/30 hover:text-teal"><Pencil size={13} /></button>
              <button onClick={() => save(replies.filter((_, j) => j !== i))} className="text-dark/30 hover:text-coral"><Trash2 size={13} /></button>
            </>
          )}
        </div>
      ))}
      <div className="flex gap-2">
        <input value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="Neue Vorlage…"
          className="flex-1 px-3 py-2 rounded-button border border-gray-200 text-sm focus:outline-none focus:border-teal" />
        <button onClick={() => { if (newValue.trim()) { save([...replies, newValue.trim()]); setNewValue(""); } }}
          className="px-3 py-2 rounded-button bg-teal text-white text-sm"><Plus size={14} /></button>
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
      <p className="text-xs text-dark/50 dark:text-white/50">
        SMS-Erinnerungen werden automatisch an Kunden gesendet, um No-Shows zu reduzieren.
      </p>

      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" checked={reminder24h} onChange={(e) => setReminder24h(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-teal focus:ring-teal" />
        <div>
          <span className="text-sm font-medium text-dark dark:text-white">24 Stunden vorher</span>
          <p className="text-xs text-dark/40 dark:text-white/40">Kunden erhalten eine SMS 24h vor dem Termin</p>
        </div>
      </label>

      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" checked={reminder1h} onChange={(e) => setReminder1h(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-teal focus:ring-teal" />
        <div>
          <span className="text-sm font-medium text-dark dark:text-white">1 Stunde vorher</span>
          <p className="text-xs text-dark/40 dark:text-white/40">Kunden erhalten eine SMS 1h vor dem Termin</p>
        </div>
      </label>

      <div className="pt-2">
        <button onClick={handleSave} disabled={saving}
          className="px-4 py-2 bg-teal text-white text-sm font-medium rounded-button hover:bg-teal/90 transition-colors disabled:opacity-50">
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
      ? `Stornierung innerhalb von ${freeHours}h vor dem Termin kostet CHF ${feeValue.toFixed(2)}.`
      : `Stornierung innerhalb von ${freeHours}h vor dem Termin kostet ${feeValue}% des Buchungspreises.`;

  return (
    <div className="py-4 max-w-md space-y-6">
      {/* Fee type cards */}
      <div>
        <label className="block text-xs font-medium text-dark/50 mb-2">Stornogebühr-Typ</label>
        <div className="grid grid-cols-3 gap-2">
          {feeOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setFeeType(opt.id)}
              className={[
                "rounded-card border p-3 text-left transition-colors",
                feeType === opt.id
                  ? "border-teal bg-teal/5"
                  : "border-gray-200 hover:border-gray-300",
              ].join(" ")}
            >
              <p className={["text-sm font-medium", feeType === opt.id ? "text-teal" : "text-dark"].join(" ")}>
                {opt.label}
              </p>
              <p className="text-[10px] text-dark/40 mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Fee value input */}
      {feeType !== "free" && (
        <div>
          <label className="block text-xs font-medium text-dark/50 mb-1">
            {feeType === "flat" ? "Betrag (CHF)" : "Prozentsatz (%)"}
          </label>
          <input
            type="number"
            min={0}
            max={feeType === "percentage" ? 100 : 500}
            step={feeType === "percentage" ? 5 : 1}
            value={feeValue}
            onChange={(e) => setFeeValue(Math.max(0, Number(e.target.value)))}
            className="w-full px-3 py-2.5 rounded-button border border-gray-200 text-sm font-data focus:outline-none focus:border-teal"
          />
        </div>
      )}

      {/* Free cancel window */}
      <div>
        <label className="block text-xs font-medium text-dark/50 mb-1">Kostenlose Stornierung bis</label>
        <select
          value={freeHours}
          onChange={(e) => setFreeHours(Number(e.target.value))}
          className="w-full px-3 py-2.5 rounded-button border border-gray-200 text-sm focus:outline-none focus:border-teal"
        >
          {CANCEL_HOURS_OPTIONS.map((h) => (
            <option key={h} value={h}>{h} Stunden vor dem Termin</option>
          ))}
        </select>
      </div>

      {/* Preview */}
      <div className="bg-gray-50 rounded-card px-4 py-3">
        <p className="text-[10px] font-bold text-dark/30 uppercase tracking-widest mb-1">Vorschau für Kunden</p>
        <p className="text-sm text-dark/70">{previewText}</p>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={saving}
          className="px-5 py-2.5 rounded-button bg-teal text-white text-sm font-medium disabled:opacity-50 flex items-center gap-2">
          {saving && <Spinner size="sm" invert />}Speichern
        </button>
        {saved && <span className="text-sm text-teal">Gespeichert ✓</span>}
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
        <div className="bg-coral/5 border border-coral/20 rounded-card px-4 py-3 flex items-start gap-3">
          <AlertTriangle size={16} className="text-coral shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-dark">Dein Salon hat {warnings}/3 Warnungen.</p>
            <button onClick={handleVerify} disabled={confirming}
              className="mt-2 px-3 py-1.5 rounded-button bg-coral text-white text-xs font-medium flex items-center gap-2">
              {confirming && <Spinner size="sm" invert />}Jetzt bestätigen
            </button>
          </div>
        </div>
      )}
      {!salon.is_active && (
        <div className="bg-red-50 border border-red-200 rounded-card px-4 py-3">
          <p className="text-sm font-medium text-red-600">Dein Salon wurde eingefroren.</p>
          <p className="text-xs text-red-400 mt-1">Kontaktiere support@solen.ch.</p>
        </div>
      )}
      <div className="bg-gray-50 rounded-card px-4 py-3 text-sm text-dark/60 space-y-1">
        <p><span className="font-medium">Letzte Verifizierung:</span> {salon.last_verified_at ? new Date(salon.last_verified_at).toLocaleDateString("de-CH") : "–"}</p>
        <p><span className="font-medium">Stornierungsrichtlinie:</span> Kunden können bis 24h vor dem Termin stornieren.</p>
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

function PaymentsTab({ salon, onSave }: { salon: Salon; onSave: (d: Partial<Salon>) => Promise<void> }) {
  const [connectStatus, setConnectStatus] = useState<"loading" | "not_connected" | "pending" | "connected">("loading");
  const [enabled, setEnabled] = useState((salon as Salon & { accepts_online_payment?: boolean }).accepts_online_payment ?? false);
  const [deposit, setDeposit] = useState((salon as Salon & { no_show_deposit_amount?: number }).no_show_deposit_amount ?? 20);
  const [saving, setSaving] = useState(false);
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
      accepts_online_payment: enabled,
      no_show_deposit_amount: deposit,
    } as Partial<Salon>);
    setSaving(false);
  };

  const statusPill = {
    loading: <span className="px-2 py-0.5 rounded-pill text-xs bg-gray-100 text-dark/40">Lädt...</span>,
    not_connected: <span className="px-2 py-0.5 rounded-pill text-xs bg-gray-100 text-dark/50">Nicht verbunden</span>,
    pending: <span className="px-2 py-0.5 rounded-pill text-xs bg-amber-100 text-amber-700">Ausstehend</span>,
    connected: <span className="px-2 py-0.5 rounded-pill text-xs bg-teal/10 text-teal font-medium">Verbunden ✓</span>,
  }[connectStatus];

  return (
    <div className="py-4 max-w-md space-y-6">
      {/* Marketing card */}
      <div className="rounded-card bg-teal/5 border border-teal/20 p-4">
        <p className="text-sm font-semibold text-teal mb-1">🛡️ Schütze dich vor No-Shows</p>
        <p className="text-xs text-dark/60 leading-relaxed">
          Kunden hinterlegen eine Kaution beim Buchen. Erscheinen sie nicht, behältst du die Kaution.
          Du erhältst Buchungen von seriösen Kunden.
        </p>
      </div>

      {/* Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-dark">Online-Zahlung akzeptieren</p>
          <p className="text-xs text-dark/40 mt-0.5">Kunden zahlen eine Kaution beim Buchen.</p>
        </div>
        <button
          onClick={() => setEnabled(!enabled)}
          className={["w-11 h-6 rounded-full transition-colors relative", enabled ? "bg-teal" : "bg-gray-200"].join(" ")}
        >
          <span className={["absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform",
            enabled ? "translate-x-5.5" : "translate-x-0.5"].join(" ")} />
        </button>
      </div>

      {enabled && (
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-xs font-medium text-dark/50">Kaution bei No-Show</label>
            <span className="text-sm font-bold text-teal font-data">CHF {deposit}</span>
          </div>
          <input
            type="range" min={5} max={100} step={5} value={deposit}
            onChange={(e) => setDeposit(+e.target.value)}
            className="w-full accent-teal"
          />
          <div className="flex justify-between text-xs text-dark/30 mt-1">
            <span>CHF 5</span><span>CHF 100</span>
          </div>
        </div>
      )}

      {/* Stripe Connect */}
      <div className="border border-gray-200 rounded-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-dark/40" />
            <p className="text-sm font-medium text-dark">Bankkonto verknüpfen</p>
          </div>
          {statusPill}
        </div>
        <p className="text-xs text-dark/50">
          Stripe Connect überweist Zahlungen direkt auf dein Konto. Benötigt einmalige Verifizierung.
        </p>
        {connectStatus !== "connected" && (
          <button
            onClick={handleConnect}
            disabled={connectLoading || connectStatus === "loading"}
            className="flex items-center gap-2 px-4 py-2 rounded-button border border-gray-200 text-sm text-dark hover:border-teal transition-colors disabled:opacity-50"
          >
            {connectLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
            Bankkonto verknüpfen
          </button>
        )}
      </div>

      <p className="text-xs text-dark/30">
        Solen erhebt 1 % Servicegebühr auf Online-Zahlungen (gesetzlich vorgeschriebene Transparenz).
      </p>

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-5 py-2.5 rounded-button bg-teal text-white text-sm font-medium disabled:opacity-50 flex items-center gap-2"
      >
        {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        Speichern
      </button>
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
        <div className="fixed inset-0 z-40 bg-red-50/90 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white border border-red-200 rounded-card p-8 text-center max-w-sm shadow-xl">
            <AlertTriangle size={32} className="text-red-500 mx-auto mb-3" />
            <h2 className="font-heading font-bold text-lg text-dark mb-2">Salon eingefroren</h2>
            <p className="text-sm text-dark/60">Kontaktiere support@solen.ch für weitere Informationen.</p>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-teal text-white px-4 py-2.5 rounded-pill shadow-lg text-sm font-medium">
          {toast}
        </div>
      )}

      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl text-dark">Einstellungen</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : !salon ? (
        <div className="text-center py-12 text-dark/30 text-sm">Salon nicht gefunden</div>
      ) : (
        <div className="bg-white rounded-card shadow-card">
          <ExpandableTabs
            defaultTab="profile"
            tabs={[
              { id: "profile", label: "Profil", content: <ProfileTab salon={salon} onSave={handleSave} /> },
              { id: "lastminute", label: "Last-Minute", content: <LastMinuteTab salon={salon} onSave={handleSave} /> },
              { id: "payments", label: "Zahlungen", content: <PaymentsTab salon={salon} onSave={handleSave} /> },
              { id: "quickreplies", label: "Schnellantworten", content: <QuickRepliesTab /> },
              { id: "verification", label: "Verifizierung", content: <VerificationTab salon={salon} /> },
              { id: "sms", label: "SMS-Erinnerungen", content: <SmsRemindersTab salon={salon} onSave={handleSave} /> },
              { id: "cancellation", label: "Stornierung", content: <CancellationTab salon={salon} onSave={handleSave} /> },
            ]}
          />
        </div>
      )}
    </DashboardLayout>
  );
}
