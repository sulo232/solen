"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, Check, Plus, Trash2, Pencil, X, CreditCard, ExternalLink, Loader2, Palmtree, Globe, Facebook, Tag, Store, ShieldCheck, CalendarCheck, XCircle, Moon, Plane, CalendarX, Percent, Receipt, MessageSquare, Smartphone, ChevronRight, Eye, type LucideIcon } from "lucide-react";
import type { SalonCategory } from "@/lib/types";
import { DashStatusPill } from "@/app/[locale]/_components/dashboard/DashboardUI";

// ─────────────────────────────────────────
// Category options shared across Settings
// ─────────────────────────────────────────

import { CATEGORY_OPTIONS } from "@/lib/constants/categories";
import DashboardLayout from "@/components-legacy/dashboard/DashboardLayout";
import OffPeakManager from "@/components-legacy/dashboard/OffPeakManager";
import ExpandableTabs from "@/components-legacy/ui/ExpandableTabs";
import SalonCard from "@/components-legacy/SalonCard";
import Spinner from "@/components-legacy/ui/Spinner";
import { useLocale, useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/format-currency";
import { resolveSwissLocale } from "@/lib/format";
import type { Salon } from "@/lib/types";
import { parseDate, today, getLocalTimeZone } from "@internationalized/date";
import { DateTimePickerRange, type DateRangeValue } from "@/app/[locale]/_components/primitives/DateTimePicker";

// ─────────────────────────────────────────
// Opening hours editor
// ─────────────────────────────────────────

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAYS_LABEL = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

function HoursEditor({ hours, onChange }: {
  hours: Record<string, { open: string; close: string } | null>;
  onChange: (h: typeof hours) => void;
}) {
  const t = useTranslations("dashboard.settings");
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
              // selected-ok: dashboard vibrant skin (LOCKFILE §12.2/§12.4), s-coral retired, s-accent is the locked selected-day fill
              className={["w-9 text-center text-xs font-medium py-1.5 rounded-btn transition-[colors,transform] active:scale-[0.97] active:duration-[80ms] active:ease-glide",
                h ? "bg-s-accent text-white" : "bg-s-bg-sunken text-s-ink/40"].join(" ")}>
              {DAYS_LABEL[i]}
            </button>
            {h ? (
              <>
                <input type="time" value={h.open} onChange={(e) => update(key, "open", e.target.value)}
                  className="px-2 py-1 text-xs focus:outline-none" /> {/* mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17) */}
                <span className="text-xs text-s-ink/30">–</span>
                <input type="time" value={h.close} onChange={(e) => update(key, "close", e.target.value)}
                  className="px-2 py-1 text-xs focus:outline-none" /> {/* mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17) */}
              </>
            ) : <span className="text-xs text-s-ink/30">{t("closed")}</span>}
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
  const t = useTranslations("dashboard.settings");
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
        <label className="block text-xs font-medium text-s-ink-2 mb-1">{t("salonNameLabel")}</label>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full px-3 py-2.5 text-sm" /> {/* mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17) */}
      </div>

      {/* ── Category selector ── */}
      <div>
        <label className="block text-xs font-medium text-s-ink-2 mb-2">
          {t("categoriesLabel")}
          <span className="ml-1 text-s-ink/30 font-normal">{t("categoriesHint")}</span>
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
                  "flex items-center gap-1.5 px-3 py-2 rounded-pill border text-[12px] font-heading uppercase tracking-[.06em] transition-[colors,transform] active:scale-[0.97] active:duration-[80ms] active:ease-glide",
                  active
                    ? "bg-s-accent-bright text-white border-s-accent-bright"
                    : "border-s-ink/[0.08] text-s-ink-2 hover:border-s-accent-bright/50",
                ].join(" ")}
              >
                {/* mockup-ok: emoji deletion only, matches the repo-wide "no emoji in shipped code" rule (CLAUDE.md rule 10); ported from reviewed commit 7f7dd32dd */}
                {opt.label}
                {active && <Check size={10} className="ml-0.5" />}
              </button>
            );
          })}
        </div>
        {form.categories.length === 0 && (
          <p className="text-xs text-s-error mt-1">{t("categoriesRequired")}</p>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-s-ink-2 mb-1">{t("coverPhotoLabel")}</label>
        <input value={form.cover_photo_url} onChange={(e) => setForm({ ...form, cover_photo_url: e.target.value })}
          className="w-full px-3 py-2.5 text-sm" /> {/* mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17) */}
      </div>
      <div>
        <label className="block text-xs font-medium text-s-ink-2 mb-1">{t("descriptionDeLabel")}</label>
        <textarea value={form.description_de} onChange={(e) => setForm({ ...form, description_de: e.target.value })}
          rows={3} maxLength={500}
          className="w-full prose-measure px-3 py-2 text-sm resize-none" /> {/* mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17) */}
      </div>
      <div>
        <label className="block text-xs font-medium text-s-ink-2 mb-1">{t("descriptionEnLabel")}</label>
        <textarea value={form.description_en} onChange={(e) => setForm({ ...form, description_en: e.target.value })}
          rows={2} maxLength={500}
          className="w-full prose-measure px-3 py-2 text-sm resize-none" /> {/* mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17) */}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-s-ink-2 mb-1">{t("phoneLabel")}</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full px-3 py-2 text-sm" /> {/* mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17) */}
        </div>
        <div>
          <label className="block text-xs font-medium text-s-ink-2 mb-1">{t("instagramLabel")}</label>
          <input value={form.instagram_url} onChange={(e) => setForm({ ...form, instagram_url: e.target.value })}
            placeholder="https://instagram.com/..."
            className="w-full px-3 py-2 text-sm" /> {/* mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17) */}
        </div>
        <div>
          <label className="block text-xs font-medium text-s-ink-2 mb-1">{t("facebookLabel")}</label>
          <input value={form.facebook_url} onChange={(e) => setForm({ ...form, facebook_url: e.target.value })}
            placeholder="https://facebook.com/..."
            className="w-full px-3 py-2 text-sm" /> {/* mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17) */}
        </div>
        <div>
          <label className="block text-xs font-medium text-s-ink-2 mb-1">{t("tiktokLabel")}</label>
          <input value={form.tiktok_url} onChange={(e) => setForm({ ...form, tiktok_url: e.target.value })}
            placeholder="https://tiktok.com/@..."
            className="w-full px-3 py-2 text-sm" /> {/* mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17) */}
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-s-ink-2 mb-1">{t("websiteLabel")}</label>
        <input value={form.website_url} onChange={(e) => setForm({ ...form, website_url: e.target.value })}
          placeholder="https://..."
          className="w-full px-3 py-2 text-sm" /> {/* mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17) */}
      </div>
      <div>
        <label className="block text-xs font-medium text-s-ink-2 mb-2">{t("openingHoursLabel")}</label>
        <HoursEditor hours={form.opening_hours} onChange={(h) => setForm({ ...form, opening_hours: h })} />
      </div>
      {/* Top Pick Toggle */}
      <div className="border-t border-s-ink/5 pt-4 mt-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={form.is_top_pick} onChange={(e) => setForm({ ...form, is_top_pick: e.target.checked })}
            className="w-5 h-5 rounded border-s-border accent-s-ink focus:ring-offset-0" />
          <div>
            <span className="block text-sm font-medium text-s-ink">{t("topPickTitle")}</span>
            <span className="block text-xs text-s-ink-2">{t("topPickDesc")}</span>
          </div>
        </label>
      </div>
      <div>
        <p className="text-xs font-medium text-s-ink-2 mb-2">{t("customerPreviewLabel")}</p>
        <SalonCard salon={{ ...salon, ...form } as Salon} variant="compact" />
      </div>
      <div className="space-y-2">
        <button onClick={handleSave} disabled={saving || form.categories.length === 0}
          className="w-full min-h-[44px] rounded-btn bg-s-ink text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
          {saving && <Spinner size="sm" invert />}{t("save")}
        </button>
        {saved && <span className="block text-center text-sm text-s-success">{t("saved")}</span>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Last-Minute Tab
// ─────────────────────────────────────────

function LastMinuteTab({ salon, onSave }: { salon: Salon; onSave: (d: Partial<Salon>) => Promise<void> }) {
  const t = useTranslations("dashboard.settings");
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
          <p className="text-sm font-medium text-s-ink">{t("offersEnableTitle")}</p>
          <p className="text-xs text-s-ink/40 mt-0.5">{t("offersEnableDesc")}</p>
        </div>
        <button onClick={() => setEnabled(!enabled)}
          className={["w-11 h-6 rounded-full transition-colors relative", enabled ? "bg-s-accent" : "bg-s-sand"].join(" ")}>
          <span className={["absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-elevation-1 transition-transform",
            enabled ? "translate-x-5.5" : "translate-x-0.5"].join(" ")} />
        </button>
      </div>
      {enabled && (
        <>
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs font-medium text-s-ink-2">{t("discountLabel")}</label>
              <span className="text-sm font-bold text-s-coral data-text">{discount}%</span>
            </div>
            <input type="range" min={5} max={50} step={5} value={discount}
              onChange={(e) => setDiscount(+e.target.value)} className="w-full accent-s-coral" />
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs font-medium text-s-ink-2">{t("timeWindowLabel")}</label>
              <span className="text-sm font-bold text-s-coral data-text">{windowH}h</span>
            </div>
            <input type="range" min={2} max={24} step={1} value={windowH}
              onChange={(e) => setWindowH(+e.target.value)} className="w-full accent-s-coral" />
          </div>
        </>
      )}
      <button onClick={handleSave} disabled={saving}
        className="px-5 py-2.5 rounded-btn bg-s-accent text-white text-sm font-medium disabled:opacity-50 flex items-center gap-2">
        {saving && <Spinner size="sm" invert />}{t("save")}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────
// Quick Reply Templates Tab
// ─────────────────────────────────────────

function QuickRepliesTab() {
  const t = useTranslations("dashboard.settings");
  const DEFAULT_REPLIES = [t("quickReplyDefault1"), t("quickReplyDefault2"), t("quickReplyDefault3")];
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
        <div key={i} className="flex items-center gap-2 bg-white border border-s-border rounded-[12px] px-3 py-2.5">
          {editing === i ? (
            <>
              {/* mockup-ok: !important prevents a look change, not a new one. The wrapper div
                  owns the visible chrome (bg-white border rounded-[12px] px-3 py-2.5); this
                  input must stay invisible AND compact inside it, or the widened base input
                  law (globals.css, 2026-07-17, sets min-height:48px/padding:16px/bg #F4F4F5
                  too, not just fill/border/radius) paints a second box AND balloons the row.
                  !text-sm (not the wrapper-siblings' 13.5px) so this edit field matches the
                  <p className="flex-1 text-sm text-s-ink"> below it does not resize the row
                  when toggling edit mode (V3-D-input-fill-2026-07-17). */}
              <input value={editValue} onChange={(e) => setEditValue(e.target.value)}
                className="flex-1 !border-0 !bg-transparent !min-h-0 !px-0 !text-sm focus:outline-none" autoFocus />
              <button onClick={() => { const a = [...replies]; a[i] = editValue; save(a); setEditing(null); }} aria-label={t("save")} className="text-s-coral"><Check size={14} strokeWidth={1.6} /></button>
              <button onClick={() => setEditing(null)} aria-label={t("cancel")} className="text-s-ink/30"><X size={14} strokeWidth={1.6} /></button>
            </>
          ) : (
            <>
              <p className="flex-1 text-sm text-s-ink">{r}</p>
              <button onClick={() => { setEditing(i); setEditValue(r); }} aria-label={t("edit")} className="text-s-ink/30 hover:text-s-coral"><Pencil size={13} /></button>
              <button onClick={() => save(replies.filter((_, j) => j !== i))} aria-label={t("delete")} className="text-s-ink/30 hover:text-s-coral"><Trash2 size={13} /></button>
            </>
          )}
        </div>
      ))}
      <div className="flex gap-2">
        <input value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder={t("newTemplatePlaceholder")}
          className="flex-1 px-3 py-2 text-sm focus:outline-none" /> {/* mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17) */}
        <button onClick={() => { if (newValue.trim()) { save([...replies, newValue.trim()]); setNewValue(""); } }}
          className="px-3 py-2 rounded-btn bg-s-accent text-white text-sm"><Plus size={14} strokeWidth={1.6} /></button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// SMS Reminders Tab
// ─────────────────────────────────────────

function SmsRemindersTab({ salon, onSave }: { salon: Salon; onSave: (d: Partial<Salon>) => Promise<void> }) {
  const t = useTranslations("dashboard.settings");
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
      <p className="text-xs text-s-ink-2">
        {t("smsIntro")}
      </p>

      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" checked={reminder24h} onChange={(e) => setReminder24h(e.target.checked)}
          className="w-4 h-4 rounded border-s-border text-s-coral focus:ring-s-coral" />
        <div>
          <span className="text-sm font-medium text-s-ink">{t("sms24hTitle")}</span>
          <p className="text-xs text-s-ink/40">{t("sms24hDesc")}</p>
        </div>
      </label>

      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" checked={reminder1h} onChange={(e) => setReminder1h(e.target.checked)}
          className="w-4 h-4 rounded border-s-border text-s-coral focus:ring-s-coral" />
        <div>
          <span className="text-sm font-medium text-s-ink">{t("sms1hTitle")}</span>
          <p className="text-xs text-s-ink/40">{t("sms1hDesc")}</p>
        </div>
      </label>

      <div className="pt-2">
        <button onClick={handleSave} disabled={saving}
          className="px-4 py-2 bg-s-accent text-white text-sm font-medium rounded-btn hover:brightness-[1.06] transition-[colors,transform] active:scale-[0.97] active:duration-[80ms] active:ease-glide disabled:opacity-50">
          {saving ? t("saving") : saved ? t("saved") : t("save")}
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
  const t = useTranslations("dashboard.settings");
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
    { id: "free", label: t("cancelFeeFreeLabel"), desc: t("cancelFeeFreeDesc") },
    { id: "flat", label: t("feeFlatLabel"), desc: t("feeFlatDesc") },
    { id: "percentage", label: t("feePercentLabel"), desc: t("feePercentDesc") },
  ];

  const previewText = feeType === "free"
    ? t("cancelPreviewFree", { hours: freeHours })
    : feeType === "flat"
      ? t("cancelPreviewFlat", { hours: freeHours, amount: formatCurrency(feeValue, locale) })
      : t("cancelPreviewPercent", { hours: freeHours, percent: feeValue });

  return (
    <div className="py-4 max-w-md space-y-6">
      {/* Fee type option-cards */}
      <div>
        <label className="block text-xs font-medium text-s-ink-2 mb-2">{t("cancelFeeTypeLabel")}</label>
        <div className="space-y-2">
          {feeOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setFeeType(opt.id)}
              className={[
                "w-full min-h-[44px] rounded-[12px] border p-3.5 text-left transition-[colors,transform] active:scale-[0.98] active:duration-[80ms] active:ease-glide flex items-center gap-3",
                feeType === opt.id
                  ? "border-s-accent-bright bg-s-accent-bright/10"
                  : "border-s-border hover:border-s-border",
              ].join(" ")}
            >
              <div className={[
                "w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0",
                feeType === opt.id ? "border-s-accent-bright" : "border-s-border"
              ].join(" ")}>
                {feeType === opt.id && <div className="w-2 h-2 rounded-full bg-s-accent-bright" />}
              </div>
              <div>
                <p className={["text-sm font-medium", feeType === opt.id ? "text-s-accent-bright" : "text-s-ink"].join(" ")}>
                  {opt.label}
                </p>
                <p className="text-[12px] text-s-ink-2 mt-0.5">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Fee value input */}
      {feeType !== "free" && (
        <div>
          <label className="block text-xs font-medium text-s-ink-2 mb-1">
            {feeType === "flat" ? t("amountChfLabel") : t("percentInputLabel")}
          </label>
          <input
            type="number"
            min={0}
            max={feeType === "percentage" ? 100 : 500}
            step={feeType === "percentage" ? 5 : 1}
            value={feeValue}
            onChange={(e) => setFeeValue(Math.max(0, Number(e.target.value)))}
            className="w-full px-3 py-2.5 text-sm data-text" // mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17)
          />
        </div>
      )}

      {/* Free cancel window — hairline value-row */}
      <div>
        <label className="block text-xs font-medium text-s-ink-2 mb-1">{t("freeCancelUntilLabel")}</label>
        <select
          value={freeHours}
          onChange={(e) => setFreeHours(Number(e.target.value))}
          className="w-full px-3 py-2.5 text-sm" // mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17)
        >
          {CANCEL_HOURS_OPTIONS.map((h) => (
            <option key={h} value={h}>{t("hoursBeforeAppointment", { hours: h })}</option>
          ))}
        </select>
      </div>

      {/* Guest preview */}
      <div className="flex items-start gap-2 bg-s-bg-sunken rounded-[12px] px-3.5 py-3">
        <Eye size={15} strokeWidth={1.9} className="text-s-ink-2 shrink-0 mt-0.5" />
        <p className="text-xs text-s-ink-2 leading-relaxed">
          <span className="font-semibold text-s-ink">{t("customersSee")}</span> {previewText}
        </p>
      </div>

      {/* Save — full-width ink (the one primary commit) */}
      <div className="space-y-2">
        <button onClick={handleSave} disabled={saving}
          className="w-full py-3 rounded-btn bg-s-ink text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
          {saving && <Spinner size="sm" invert />}{t("save")}
        </button>
        {saved && <span className="block text-center text-sm text-s-success">{t("saved")}</span>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// VAT / MWST registration Tab
// ─────────────────────────────────────────

function VatRegistrationTab({ salon, onSave }: { salon: Salon; onSave: (d: Partial<Salon>) => Promise<void> }) {
  const t = useTranslations("dashboard.settings");
  const locale = useLocale();
  const ext = salon as Salon & { vat_registered?: boolean; vat_number?: string | null; vat_rate?: number | null };
  const rate = ext.vat_rate;
  const vatRateLabel = typeof rate === "number" && Number.isFinite(rate) && rate >= 0
    ? new Intl.NumberFormat(resolveSwissLocale(locale), { maximumFractionDigits: 20 }).format(rate)
    : null;
  const [registered, setRegistered] = useState<boolean>(ext.vat_registered ?? false);
  const [vatNumber, setVatNumber] = useState(ext.vat_number ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // Not registered ⇒ clear the UID (a Kleinunternehmen carries none). Registered ⇒ trim,
    // empty becomes null. vat_rate stays server-default (8.1%) — not owner-editable.
    await onSave({
      vat_registered: registered,
      vat_number: registered ? (vatNumber.trim() || null) : null,
    } as Partial<Salon>);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const options: { id: boolean; label: string; desc: string }[] = [
    { id: true, label: t("vatRegisteredLabel"), desc: vatRateLabel === null ? "" : t("vatRegisteredDesc", { rate: vatRateLabel }) },
    { id: false, label: t("vatSmallBusinessLabel"), desc: t("vatSmallBusinessDesc") },
  ];

  const previewText = registered
    ? (vatRateLabel === null ? "" : t("vatPreviewRegistered", { rate: vatRateLabel }))
    : t("vatPreviewSmallBusiness");

  return (
    <div className="py-4 max-w-md space-y-6">
      {/* Registration status cards */}
      <div>
        <label className="block text-xs font-medium text-s-ink-2 mb-2">{t("vatStatusLabel")}</label>
        <div className="grid grid-cols-2 gap-2">
          {options.map((opt) => (
            <button
              key={String(opt.id)}
              type="button"
              onClick={() => setRegistered(opt.id)}
              className={[
                "rounded-[12px] border p-3 text-left transition-[colors,transform] active:scale-[0.97] active:duration-[80ms] active:ease-glide",
                registered === opt.id
                  ? "border-s-coral bg-s-coral/5"
                  : "border-s-border hover:border-s-border",
              ].join(" ")}
            >
              <p className={["text-sm font-medium", registered === opt.id ? "text-s-coral" : "text-s-ink"].join(" ")}>
                {opt.label}
              </p>
              <p className="text-[12px] text-s-ink/40 mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* VAT number input (only when registered) */}
      {registered && (
        <div>
          <label className="block text-xs font-medium text-s-ink-2 mb-1">{t("vatNumberLabel")}</label>
          <input
            type="text"
            value={vatNumber}
            onChange={(e) => setVatNumber(e.target.value)}
            placeholder="CHE-123.456.789 MWST"
            className="w-full px-3 py-2.5 text-sm data-text focus:outline-none" // mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17)
          />
          <p className="text-[12px] text-s-ink/40 mt-1">{t("vatNumberHint")}</p>
        </div>
      )}

      {/* Preview */}
      <div className="bg-s-bg-surface rounded-[12px] px-4 py-3">
        <p className="text-[12px] font-bold text-s-ink/30 uppercase tracking-widest mb-1">{t("customerPreviewHeader")}</p>
        <p className="text-sm text-s-ink/70">{previewText}</p>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={saving}
          className="px-5 py-2.5 rounded-btn bg-s-accent text-white text-sm font-medium disabled:opacity-50 flex items-center gap-2">
          {saving && <Spinner size="sm" invert />}{t("save")}
        </button>
        {saved && <span className="text-sm text-s-coral">{t("saved")}</span>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Verification Tab (Phase 11)
// ─────────────────────────────────────────

function VerificationTab({ salon }: { salon: Salon }) {
  const t = useTranslations("dashboard.settings");
  const locale = useLocale();
  const [confirming, setConfirming] = useState(false);

  const handleVerify = async () => {
    setConfirming(true);
    try { await fetch(`/api/salons/verify?salon_id=${salon.id}`, { method: "POST" }); }
    // V3-D334 (overnight T2): error handling per CLAUDE.md.
    catch (err) { console.error("[Settings] verification request failed:", err); } finally { setConfirming(false); }
  };

  const warnings = salon.verification_warnings ?? 0;

  return (
    <div className="py-4 max-w-md space-y-4">
      {warnings > 0 && (
        <div className="bg-s-coral/5 border border-s-coral/20 rounded-[12px] px-4 py-3 flex items-start gap-3">
          <AlertTriangle size={16} strokeWidth={1.9} className="text-s-coral shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-s-ink">{t("salonWarnings", { count: warnings })}</p>
            <button onClick={handleVerify} disabled={confirming}
              className="mt-2 px-3 py-1.5 rounded-btn bg-s-accent text-white text-xs font-medium flex items-center gap-2">
              {confirming && <Spinner size="sm" invert />}{t("confirmNow")}
            </button>
          </div>
        </div>
      )}
      {(salon as any).frozen_at && (
        <div className="bg-s-error-bg border border-s-error/20 rounded-[12px] px-4 py-3">
          <p className="text-sm font-medium text-s-error">{t("salonFrozen")}</p>
          <p className="text-xs text-s-error/70 mt-1">{t("contactSupport")}</p>
        </div>
      )}
      <div className="bg-s-bg-surface rounded-[12px] px-4 py-3 text-sm text-s-ink-2 space-y-1">
        <p><span className="font-medium">{t("lastVerification")}</span> {salon.last_verified_at ? new Date(salon.last_verified_at).toLocaleDateString(resolveSwissLocale(locale)) : "–"}</p> {/* em-dash-ok: pre-existing "no data" placeholder, not new copy */}
        <p><span className="font-medium">{t("cancellationPolicyLabel")}</span> {t("cancellationPolicyValue")}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Vacation Mode Tab
// ─────────────────────────────────────────

function VacationTab({ salon, onSave }: { salon: Salon; onSave: (d: Partial<Salon>) => Promise<void> }) {
  const t = useTranslations("dashboard.settings");
  const locale = useLocale();
  const ext = salon as Salon & { vacation_start?: string | null; vacation_end?: string | null };
  const [start, setStart] = useState(ext.vacation_start ?? "");
  const [end, setEnd] = useState(ext.vacation_end ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isActive = !!start && !!end && new Date(end) >= new Date();

  // ig6 (2026-07-16): DateTimePickerRange owns the calendar UI; start/end stay the
  // same ISO-string state (unchanged save payload + shape), just bridged to CalendarDate.
  // safeParseDate guards against a legacy/malformed stored value throwing on render
  // (the old bare <input type="date"> just silently blanked out instead of crashing).
  const safeParseDate = (iso: string) => {
    try {
      return parseDate(iso);
    } catch {
      return null;
    }
  };
  const rangeValue: DateRangeValue = {
    start: start ? safeParseDate(start) : null,
    end: end ? safeParseDate(end) : null,
  };
  const handleRangeChange = (range: DateRangeValue) => {
    setStart(range.start ? range.start.toString() : "");
    setEnd(range.end ? range.end.toString() : "");
  };

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
          <Palmtree size={18} strokeWidth={1.9} className="text-s-coral" />
        </div>
        <div>
          <p className="text-sm font-medium text-s-ink">{t("vacationModeTitle")}</p>
          <p className="text-xs text-s-ink/40">{t("vacationModeDesc")}</p>
        </div>
      </div>

      {isActive && (
        <div className="bg-s-amber-subtle border border-s-amber/20 rounded-[12px] px-4 py-3 flex items-center gap-3">
          <Palmtree size={16} strokeWidth={1.9} className="text-s-star shrink-0" />
          <p className="text-sm text-s-star-text">
            {t("vacationActive", { start: new Date(start).toLocaleDateString(resolveSwissLocale(locale)), end: new Date(end).toLocaleDateString(resolveSwissLocale(locale)) })}
          </p>
        </div>
      )}

      {/* mockup-ok: ig6, owner-approved TASTE_LOG.md 2026-07-16 "IG-principles round 1". Two bare date inputs replaced by the DateTimePicker range variant. */}
      <DateTimePickerRange
        value={rangeValue}
        onChange={handleRangeChange}
        minDate={today(getLocalTimeZone())}
        labels={{ to: t("toLabel").toLowerCase() }}
      />

      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={saving}
          className="px-5 py-2.5 rounded-btn bg-s-accent text-white text-sm font-medium disabled:opacity-50 flex items-center gap-2">
          {saving && <Spinner size="sm" invert />}{t("save")}
        </button>
        {(start || end) && (
          <button onClick={handleClear} disabled={saving}
            className="px-4 py-2.5 rounded-btn border border-s-border text-sm text-s-ink-2 hover:border-s-coral hover:text-s-coral transition-[colors,transform] active:scale-[0.97] active:duration-[80ms] active:ease-glide">
            {t("deactivate")}
          </button>
        )}
        {saved && <span className="text-sm text-s-coral">{t("saved")}</span>}
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
type NoShowFeeType = "free" | "flat" | "percentage";

function PaymentsTab({ salon, onSave }: { salon: Salon; onSave: (d: Partial<Salon>) => Promise<void> }) {
  const locale = useLocale();
  const t = useTranslations("dashboard.settings");
  const ext = salon as Salon & { payment_mode?: PaymentMode; deposit_percent?: number; no_show_fee_type?: NoShowFeeType; no_show_fee_value?: number };
  const [connectStatus, setConnectStatus] = useState<"loading" | "not_connected" | "pending" | "connected">("loading");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(ext.payment_mode ?? "at_salon");
  const [depositPercent, setDepositPercent] = useState(ext.deposit_percent ?? 20);
  // No-show fee — writes no_show_fee_type/value (the columns the no-show charging cron + walk-in
  // path actually read). Replaced the old cancellation_hours/late_cancel_fee_percent sliders that
  // duplicated the Stornierung tab + wrote dead columns.
  const [noShowFeeType, setNoShowFeeType] = useState<NoShowFeeType>(ext.no_show_fee_type ?? "free");
  const [noShowFeeValue, setNoShowFeeValue] = useState(ext.no_show_fee_value ?? 0);
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
      no_show_fee_type: noShowFeeType,
      no_show_fee_value: noShowFeeType === "free" ? 0 : noShowFeeValue,
    } as Partial<Salon>);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const statusPill = {
    loading: <span className="px-2 py-0.5 rounded-pill text-xs bg-s-bg-sunken text-s-ink/40">{t("statusLoading")}</span>,
    not_connected: <span className="px-2 py-0.5 rounded-pill text-xs bg-s-bg-sunken text-s-ink-2">{t("statusNotConnected")}</span>,
    pending: <span className="px-2 py-0.5 rounded-pill text-xs bg-s-amber-subtle text-s-star-text">{t("statusPending")}</span>,
    connected: <span className="px-2 py-0.5 rounded-pill text-xs bg-s-success/10 text-s-success font-medium">{t("statusConnected")}</span>,
  }[connectStatus];

  const modeOptions: { id: PaymentMode; label: string; desc: string }[] = [
    { id: "at_salon", label: t("paymentModeAtSalonLabel"), desc: t("paymentModeAtSalonDesc") },
    { id: "deposit", label: t("paymentModeDepositLabel"), desc: t("paymentModeDepositDesc") },
    { id: "prepay", label: t("paymentModePrepayLabel"), desc: t("paymentModePrepayDesc") },
  ];

  return (
    <div className="py-4 max-w-md space-y-6">
      {/* Stripe Connect — always visible */}
      <div className="border border-s-border rounded-[12px] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-s-ink/40" />
            <p className="text-sm font-medium text-s-ink">{t("linkBankAccount")}</p>
          </div>
          {statusPill}
        </div>
        <p className="text-xs text-s-ink-2">
          {t("stripeConnectDesc")}
        </p>
        {connectStatus !== "connected" && (
          <button
            onClick={handleConnect}
            disabled={connectLoading || connectStatus === "loading"}
            className="flex items-center gap-2 px-4 py-2.5 rounded-btn bg-s-ink text-white text-sm font-medium hover:brightness-[1.06] transition-[colors,transform] active:scale-[0.97] active:duration-[80ms] active:ease-glide disabled:opacity-50"
          >
            {connectLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
            {connectStatus === "pending" ? t("continueVerification") : t("linkNow")}
          </button>
        )}
        {connectStatus === "connected" && (
          <p className="text-xs text-s-success font-medium flex items-center gap-1">
            {t("bankAccountLinked")}
          </p>
        )}
      </div>

      {/* Marketing card */}
      <div className="rounded-[12px] bg-s-accent-bright/[0.06] border border-s-accent-bright/20 p-4">
        <p className="text-sm font-semibold text-s-accent-bright mb-1">{t("choosePaymentModeTitle")}</p>
        <p className="text-xs text-s-ink-2 leading-relaxed">
          {t("choosePaymentModeDesc")}
        </p>
      </div>

      {/* Payment mode radio cards */}
      <div>
        <label className="block text-xs font-medium text-s-ink-2 mb-2">{t("paymentModeLabel")}</label>
        <div className="space-y-2">
          {modeOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setPaymentMode(opt.id)}
              className={[
                "w-full min-h-[44px] rounded-[12px] border p-3.5 text-left transition-[colors,transform] active:scale-[0.98] active:duration-[80ms] active:ease-glide flex items-center gap-3",
                paymentMode === opt.id ? "border-s-accent-bright bg-s-accent-bright/[0.06]" : "border-s-border hover:border-s-border",
              ].join(" ")}
            >
              <div className={[
                "w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0",
                paymentMode === opt.id ? "border-s-accent-bright" : "border-s-border"
              ].join(" ")}>
                {paymentMode === opt.id && <div className="w-2 h-2 rounded-full bg-s-accent-bright" />}
              </div>
              <div>
                <p className={["text-sm font-medium", paymentMode === opt.id ? "text-s-accent-bright" : "text-s-ink"].join(" ")}>
                  {opt.label}
                </p>
                <p className="text-[12px] text-s-ink-2 mt-0.5">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Deposit percent slider */}
      {paymentMode === "deposit" && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-s-ink-2">{t("depositLabel")}</label>
            <span className="text-sm font-semibold text-s-ink data-text bg-s-bg-sunken rounded-full px-2.5 py-0.5">{depositPercent}%</span>
          </div>
          <input
            type="range" min={5} max={50} step={5} value={depositPercent}
            onChange={(e) => setDepositPercent(+e.target.value)}
            className="w-full accent-s-ink"
          />
          <div className="flex justify-between text-xs text-s-ink/30 mt-1">
            <span>5%</span><span>50%</span>
          </div>
          <p className="text-xs text-s-ink/40 mt-2">
            {t("depositExample", { total: formatCurrency(100, locale), online: formatCurrency(depositPercent, locale), atSalon: formatCurrency(100 - depositPercent, locale) })}
          </p>
        </div>
      )}

      {/* No-show fee — only when a card is on file (deposit/prepay). Charging options light up
          orange (surcharge = money-out); "Keine" stays calm green. Writes no_show_fee_type/value. */}
      {paymentMode !== "at_salon" && (
        <div className="border-t border-s-ink/5 pt-4 space-y-2">
          <p className="text-xs font-medium text-s-ink-2 mb-1">{t("noShowFeeLabel")}</p>

          {([
            { id: "free", label: t("noShowFreeLabel"), desc: t("noShowFreeDesc") },
            { id: "flat", label: t("feeFlatLabel"), desc: t("feeFlatDesc") },
            { id: "percentage", label: t("feePercentLabel"), desc: t("feePercentDesc") },
          ] as { id: NoShowFeeType; label: string; desc: string }[]).map((opt) => {
            const selected = noShowFeeType === opt.id;
            const charging = selected && opt.id !== "free";
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setNoShowFeeType(opt.id)}
                className={[
                  "w-full min-h-[44px] rounded-[12px] border p-3.5 text-left transition-[colors,transform] active:scale-[0.98] active:duration-[80ms] active:ease-glide flex items-center gap-3",
                  charging ? "border-s-surcharge bg-s-surcharge-bg"
                    : selected ? "border-s-accent-bright bg-s-accent-bright/10"
                    : "border-s-border hover:border-s-border",
                ].join(" ")}
              >
                <div className={[
                  "w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0",
                  charging ? "border-s-surcharge" : selected ? "border-s-accent-bright" : "border-s-border",
                ].join(" ")}>
                  {selected && <div className={["w-2 h-2 rounded-full", charging ? "bg-s-surcharge" : "bg-s-accent-bright"].join(" ")} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={["text-sm font-medium", charging ? "text-s-surcharge" : selected ? "text-s-accent-bright" : "text-s-ink"].join(" ")}>{opt.label}</p>
                  <p className="text-[12px] text-s-ink-2 mt-0.5">{opt.desc}</p>
                </div>
                {charging && (
                  <span className="text-sm font-bold text-s-surcharge data-text shrink-0">
                    {opt.id === "flat" ? `CHF ${noShowFeeValue}` : `${noShowFeeValue}%`}
                  </span>
                )}
              </button>
            );
          })}

          {noShowFeeType !== "free" && (
            <div className="flex items-center justify-between rounded-[12px] border border-s-surcharge-bg bg-s-surcharge-bg px-3.5 py-2.5">
              <label className="text-xs font-medium text-s-ink-2">
                {noShowFeeType === "flat" ? t("amountChfLabel") : t("percentInputLabel")}
              </label>
              <input
                type="number"
                min={0}
                max={noShowFeeType === "percentage" ? 100 : 500}
                value={noShowFeeValue}
                onChange={(e) => setNoShowFeeValue(Math.max(0, Math.min(noShowFeeType === "percentage" ? 100 : 500, Number(e.target.value))))}
                className="w-20 text-right text-lg font-bold text-s-surcharge data-text focus:outline-none" // mockup-ok: dead-class removal only, type=number already caught by the unmodified base rule before this change too (V3-D-input-fill-2026-07-17)
              />
            </div>
          )}

          <div className={[
            "flex items-start gap-2 rounded-[12px] px-3.5 py-3 mt-1",
            noShowFeeType === "free" ? "bg-s-success-bg" : "bg-s-surcharge-bg",
          ].join(" ")}>
            {noShowFeeType === "free"
              ? <ShieldCheck size={15} strokeWidth={1.9} className="text-s-success shrink-0 mt-0.5" />
              : <AlertTriangle size={15} strokeWidth={1.9} className="text-s-surcharge shrink-0 mt-0.5" />}
            <p className="text-xs leading-relaxed text-s-ink/80">
              <span className="font-semibold text-s-ink">{t("customersSee")}</span>{" "}
              {noShowFeeType === "free"
                ? t("noShowPreviewFree")
                : noShowFeeType === "flat"
                  ? t.rich("noShowPreviewFlat", { amount: noShowFeeValue, b: (c) => <span className="font-semibold text-s-surcharge">{c}</span> })
                  : t.rich("noShowPreviewPercent", { percent: noShowFeeValue, b: (c) => <span className="font-semibold text-s-surcharge">{c}</span> })}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full min-h-[44px] rounded-btn bg-s-ink text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {t("save")}
        </button>
        {saved && <span className="block text-center text-sm text-s-success">{t("saved")}</span>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Closures / Holidays Tab
// ─────────────────────────────────────────

function ClosuresTab({ salon }: { salon: Salon }) {
  const t = useTranslations("dashboard.settings");
  const locale = useLocale();
  const [closures, setClosures] = useState<{ id: string; date: string; reason: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    fetch(`/api/salon/closures?salon_id=${salon.id}`)
      .then((r) => r.json())
      .then((d) => setClosures(d.closures ?? d.items ?? []))
      .catch((err) => console.error("[DashboardSettings] failed to fetch salon closures:", err))
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
      <p className="text-xs text-s-ink-2">{t("closuresIntro")}</p>
      <div className="flex gap-2">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
          className="flex-1 px-3 py-2 text-sm focus:outline-none" /> {/* mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17) */}
        <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t("reasonPlaceholder")}
          className="flex-1 px-3 py-2 text-sm focus:outline-none" /> {/* mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17) */}
        <button onClick={addClosure} disabled={!date}
          className="px-3 py-2 rounded-btn bg-s-accent text-white text-sm disabled:opacity-50">
          <Plus size={14} strokeWidth={1.6} />
        </button>
      </div>
      {closures.length === 0 ? (
        <p className="text-xs text-s-ink/30 text-center py-4">{t("noClosures")}</p>
      ) : (
        <div className="space-y-1">
          {closures.map((c) => (
            <div key={c.id} className="flex items-center justify-between py-2 px-3 bg-s-bg-surface/50 rounded-btn border border-s-ink/5">
              <div>
                <span className="text-sm data-text text-s-ink">{new Date(c.date).toLocaleDateString(resolveSwissLocale(locale))}</span>
                {c.reason && <span className="text-xs text-s-ink/40 ml-2">{c.reason}</span>}
              </div>
              <button onClick={() => removeClosure(c.id)} className="text-s-ink/30 hover:text-s-coral transition-colors">
                <Trash2 size={14} strokeWidth={1.6} />
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
  const t = useTranslations("dashboard.settings");
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

  const confirmOptions: { id: "instant" | "manual_approval"; label: string; desc?: string }[] = [
    { id: "instant", label: t("confirmInstantLabel"), desc: t("confirmInstantDesc") },
    { id: "manual_approval", label: t("confirmManualLabel"), desc: t("confirmManualDesc") },
  ];
  const methodOptions: { id: string; label: string; desc?: string }[] = [
    { id: "manual", label: t("methodManualLabel") },
    { id: "round_robin", label: t("methodRoundRobinLabel"), desc: t("methodRoundRobinDesc") },
    { id: "least_busy", label: t("methodLeastBusyLabel") },
  ];

  return (
    <div className="py-4 max-w-md space-y-6">
      {/* Buchungsbestätigung — option-cards */}
      <div>
        <label className="block text-xs font-medium text-s-ink-2 mb-2">{t("bookingConfirmationLabel")}</label>
        <div className="space-y-2">
          {confirmOptions.map((opt) => (
            <button key={opt.id} type="button" onClick={() => setConfirmMode(opt.id)}
              className={[
                "w-full min-h-[44px] rounded-[12px] border p-3.5 text-left transition-[colors,transform] active:scale-[0.98] active:duration-[80ms] active:ease-glide flex items-center gap-3",
                confirmMode === opt.id ? "border-s-accent-bright bg-s-accent-bright/10" : "border-s-border hover:border-s-border",
              ].join(" ")}>
              <div className={["w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0", confirmMode === opt.id ? "border-s-accent-bright" : "border-s-border"].join(" ")}>
                {confirmMode === opt.id && <div className="w-2 h-2 rounded-full bg-s-accent-bright" />}
              </div>
              <div>
                <p className={["text-sm font-medium", confirmMode === opt.id ? "text-s-accent-bright" : "text-s-ink"].join(" ")}>{opt.label}</p>
                {opt.desc && <p className="text-[12px] text-s-ink-2 mt-0.5">{opt.desc}</p>}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Termin-Zuweisung — option-cards */}
      <div>
        <label className="block text-xs font-medium text-s-ink-2 mb-2">{t("appointmentAssignmentLabel")}</label>
        <div className="space-y-2">
          {methodOptions.map((opt) => (
            <button key={opt.id} type="button" onClick={() => setMethod(opt.id)}
              className={[
                "w-full min-h-[44px] rounded-[12px] border p-3.5 text-left transition-[colors,transform] active:scale-[0.98] active:duration-[80ms] active:ease-glide flex items-center gap-3",
                method === opt.id ? "border-s-accent-bright bg-s-accent-bright/10" : "border-s-border hover:border-s-border",
              ].join(" ")}>
              <div className={["w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0", method === opt.id ? "border-s-accent-bright" : "border-s-border"].join(" ")}>
                {method === opt.id && <div className="w-2 h-2 rounded-full bg-s-accent-bright" />}
              </div>
              <div>
                <p className={["text-sm font-medium", method === opt.id ? "text-s-accent-bright" : "text-s-ink"].join(" ")}>{opt.label}</p>
                {opt.desc && <p className="text-[12px] text-s-ink-2 mt-0.5">{opt.desc}</p>}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Daily limit — hairline value-row with toggle */}
      <div className="rounded-[16px] border border-s-border">
        <div className="flex items-center justify-between gap-3 px-3.5 py-3">
          <span className="text-sm text-s-ink">{t("dailyLimitPerStylist")}</span>
          <div className="flex items-center gap-3">
            {limitEnabled && (
              // mockup-ok: dead-class removal only, type=number already caught before this change (V3-D-input-fill-2026-07-17)
              <input type="number" min={1} max={50} value={limit}
                onChange={(e) => setLimit(+e.target.value)}
                className="w-14 px-2 py-1 text-sm data-text text-right" />
            )}
            <button type="button" role="switch" aria-checked={limitEnabled} aria-label={t("dailyLimitToggleAria")}
              onClick={() => setLimitEnabled(!limitEnabled)}
              className={["w-[38px] h-[23px] rounded-full relative transition-colors shrink-0", limitEnabled ? "bg-s-accent-bright" : "bg-s-border"].join(" ")}>
              <span className={["absolute top-[2.5px] left-[2.5px] w-[18px] h-[18px] rounded-full bg-white shadow transition-transform", limitEnabled ? "translate-x-[14.5px]" : "translate-x-0"].join(" ")} />
            </button>
          </div>
        </div>
      </div>

      {/* Save — full-width ink */}
      <div className="space-y-2">
        <button onClick={handleSave} disabled={saving}
          className="w-full py-3 rounded-btn bg-s-ink text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}{t("save")}
        </button>
        {saved && <span className="block text-center text-sm text-s-success">{t("saved")}</span>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Team Commission Tab
// ─────────────────────────────────────────

function CommissionTab({ salon }: { salon: Salon }) {
  const t = useTranslations("dashboard.settings");
  const [staff, setStaff] = useState<{ id: string; name: string; commission_rate: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    fetch(`/api/staff?salon_id=${salon.id}`)
      .then((r) => r.json())
      .then((d) => {
        const members = d.staff ?? d.items ?? [];
        setStaff(members.map((s: any) => ({ id: s.id, name: s.name, commission_rate: s.commission_rate ?? 0 })));
      })
      .catch((err) => console.error("[DashboardSettings] failed to fetch staff for commission:", err))
      .finally(() => setLoading(false));
  }, [salon.id]);

  const updateCommission = async (id: string, rate: number) => {
    setSaving(id);
    setSaveError("");
    try {
      const res = await fetch(`/api/staff/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commission_rate: rate }),
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        console.error("[DashboardSettings] commission save failed:", res.status, detail);
        setSaveError(t("saveFailed"));
        return;
      }
      setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, commission_rate: rate } : s)));
    } catch (err) {
      console.error("[DashboardSettings] commission save error:", err);
      setSaveError(t("saveFailed"));
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <div className="py-6 flex justify-center"><Spinner size="md" /></div>;
  if (staff.length === 0) return <p className="text-xs text-s-ink/30 text-center py-6">{t("noTeam")}</p>;

  return (
    <div className="py-4 max-w-md space-y-3">
      <p className="text-xs text-s-ink-2">{t("commissionIntro")}</p>
      {saveError && <p className="text-xs text-s-error">{saveError}</p>}
      {staff.map((s) => (
        <div key={s.id} className="flex items-center gap-3 py-2 border-b border-s-ink/5 last:border-0">
          <span className="text-sm font-medium text-s-ink flex-1">{s.name}</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={100}
              step={5}
              value={s.commission_rate}
              onChange={(e) => {
                const v = Math.min(100, Math.max(0, +e.target.value));
                setStaff((prev) => prev.map((st) => (st.id === s.id ? { ...st, commission_rate: v } : st)));
              }}
              className="w-16 px-2 py-1.5 text-sm data-text text-right focus:outline-none" // mockup-ok: dead-class removal only, type=number already caught before this change (V3-D-input-fill-2026-07-17)
            />
            <span className="text-xs text-s-ink/40">%</span>
            <button
              onClick={() => updateCommission(s.id, s.commission_rate)}
              disabled={saving === s.id}
              className="px-2 py-1 rounded-btn bg-s-coral/10 text-s-coral text-xs font-medium hover:bg-s-coral/20 transition-[colors,transform] active:scale-[0.97] active:duration-[80ms] active:ease-glide disabled:opacity-50"
            >
              {saving === s.id ? "..." : "OK"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────
// Mobile settings index (lg:hidden) — drives the SAME active-tab state
// the desktop ExpandableTabs bar uses. Angebote (the Last-Minute mechanism,
// rebranded — /angebote is the customer page) is now included here too so it's
// reachable on mobile (V3 parity fix; was previously omitted).
// ─────────────────────────────────────────

type IndexRow = {
  tabId: string;
  icon: LucideIcon;
  label: string;
  pill?: { tone: "success" | "warning" | "neutral"; label: string };
};

function MobileSettingsIndex({
  salon,
  onSelect,
}: {
  salon: Salon;
  onSelect: (tabId: string) => void;
}) {
  const t = useTranslations("dashboard.settings");
  // Glance-status pills derived from live state.
  const verificationWarnings = salon.verification_warnings ?? 0;
  const verificationPill =
    verificationWarnings > 0
      ? ({ tone: "warning", label: t("statusPending") } as const)
      : undefined;

  const [paymentsPill, setPaymentsPill] = useState<IndexRow["pill"]>(undefined);
  useEffect(() => {
    fetch("/api/stripe/connect/status")
      .then((r) => r.json())
      .then((d) =>
        setPaymentsPill(
          d.status === "connected"
            ? { tone: "success", label: t("pillConnected") }
            : { tone: "neutral", label: t("pillNotConnected") },
        ),
      )
      .catch((err) => {
        console.error("[DashboardSettings] mobile index stripe status failed:", err);
        setPaymentsPill({ tone: "neutral", label: t("pillNotConnected") });
      });
  }, []);

  const groups: { label: string; rows: IndexRow[] }[] = [
    {
      label: t("groupProfile"),
      rows: [
        { tabId: "profile", icon: Store, label: t("rowProfileHours") },
        { tabId: "verification", icon: ShieldCheck, label: t("tabVerification"), pill: verificationPill },
      ],
    },
    {
      label: t("groupBookings"),
      rows: [
        { tabId: "scheduling", icon: CalendarCheck, label: t("tabScheduling") },
        { tabId: "cancellation", icon: XCircle, label: t("tabCancellation") },
        { tabId: "offpeak", icon: Moon, label: t("tabOffpeak") },
      ],
    },
    {
      label: t("groupOffers"),
      rows: [
        { tabId: "lastminute", icon: Tag, label: t("tabOffers") },
      ],
    },
    {
      label: t("groupAbsence"),
      rows: [
        { tabId: "vacation", icon: Plane, label: t("tabVacation") },
        { tabId: "closures", icon: CalendarX, label: t("tabClosures") },
      ],
    },
    {
      label: t("groupFinance"),
      rows: [
        { tabId: "payments", icon: CreditCard, label: t("tabPayments"), pill: paymentsPill },
        { tabId: "commission", icon: Percent, label: t("tabCommission") },
        { tabId: "vat", icon: Receipt, label: t("tabVat") },
      ],
    },
    {
      label: t("groupCommunication"),
      rows: [
        { tabId: "quickreplies", icon: MessageSquare, label: t("tabQuickReplies") },
        { tabId: "sms", icon: Smartphone, label: t("tabSms") },
      ],
    },
  ];

  return (
    <div>
      {groups.map((group) => (
        <div key={group.label}>
          <p className="text-[12px] font-bold uppercase tracking-[0.09em] text-s-ink-2 mt-4 mb-2 first:mt-0">
            {group.label}
          </p>
          <div className="rounded-[16px] border border-s-border bg-white overflow-hidden">
            {group.rows.map((row) => {
              const Icon = row.icon;
              return (
                <button
                  key={row.tabId}
                  type="button"
                  onClick={() => onSelect(row.tabId)}
                  className="w-full flex items-center gap-3 px-3.5 py-3 border-b border-s-border last:border-b-0 text-left"
                >
                  <Icon size={19} className="text-s-ink shrink-0" />
                  <span className="flex-1 font-heading font-semibold text-[14.5px] text-s-ink">{row.label}</span>
                  {row.pill && <DashStatusPill tone={row.pill.tone}>{row.pill.label}</DashStatusPill>}
                  <ChevronRight size={18} strokeWidth={1.9} className="text-s-ink-2 shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SettingsPage() {
  const t = useTranslations("dashboard.settings");
  const params = useSearchParams() ?? new URLSearchParams();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [loading, setLoading] = useState(true);
  // Lifted active-tab state — the desktop ExpandableTabs bar AND the mobile
  // index both drive this single setter. "profile" is the default panel.
  // `?tab=<id>` deep-links a panel, so a link that says "check your cancellation rules"
  // lands on those rules instead of on Profil. An unknown id falls back below, where the
  // tab list is the single source of valid ids (no second list to drift).
  const [activeTab, setActiveTab] = useState(params.get("tab") ?? "profile");
  // On mobile, a row tap reveals its panel; this gates the index-vs-panel view. A deep
  // link opens straight into the panel rather than the index.
  const [mobilePanelOpen, setMobilePanelOpen] = useState(params.get("tab") != null);
  const [toast, setToast] = useState(params.get("verified") === "1" ? t("verifiedToast") : "");

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((p) => {
        // A staff member has no salon_id (owners only); fall back to staff_salon_id, the
        // same pattern DashboardLayout.tsx uses to resolve the working salon for staff.
        const sid = p?.salon_id ?? p?.staff_salon_id ?? null;
        if (sid) return fetch(`/api/salons/${sid}`).then((r) => r.json());
        return null;
      })
      .then((d) => { if (d) setSalon(d); })
      .catch((err) => console.error("[DashboardSettings] failed to fetch salon profile:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (updates: Partial<Salon>) => {
    if (!salon) return;
    try {
      const res = await fetch(`/api/salons/${salon.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        console.error("[DashboardSettings] salon save failed:", res.status, detail);
        setToast(t("saveFailed"));
        return;
      }
      // Only reflect the change locally once the server actually accepted it (was unconditional,
      // which masked silent no-op saves as success).
      setSalon((prev) => prev ? { ...prev, ...updates } : prev);
    } catch (err) {
      console.error("[DashboardSettings] salon save error:", err);
      setToast(t("saveNetworkError"));
    }
  };

  return (
    <DashboardLayout>
      {salon && (salon as any).frozen_at && (
        <div className="fixed inset-0 z-40 bg-s-error-bg/90 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white border border-s-error/20 rounded-[12px] p-8 text-center max-w-sm shadow-warm-lg">
            <AlertTriangle size={32} className="text-s-error mx-auto mb-3" />
            <h2 className="font-heading text-lg text-s-ink mb-2">{t("salonFrozenTitle")}</h2>
            {(salon as any).frozen_reason && (
              <p className="text-sm text-s-ink/80 mb-2 bg-s-error-bg rounded-btn px-3 py-2">{(salon as any).frozen_reason}</p>
            )}
            {(salon as any).warning_count > 0 && (
              <p className="text-xs text-s-error/70 mb-2">{t("warningsReceived", { count: (salon as any).warning_count })}</p>
            )}
            <p className="text-sm text-s-ink-2">{t("contactSupportInfo")}</p>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-s-accent text-white px-4 py-2.5 rounded-pill shadow-elevation-3 text-sm font-medium">
          {toast}
        </div>
      )}

      {loading ? (
        <>
          <div className="mb-6">
            <h1 className="font-heading text-2xl lg:text-2xl text-s-ink">{t("pageTitle")}</h1>
          </div>
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        </>
      ) : !salon ? (
        <>
          <div className="mb-6">
            <h1 className="font-heading text-2xl text-s-ink">{t("pageTitle")}</h1>
          </div>
          <div className="text-center py-12 text-s-ink/30 text-sm">{t("salonNotFound")}</div>
        </>
      ) : (
        (() => {
          const tabs = [
            { id: "profile", label: t("tabProfile"), content: <ProfileTab salon={salon} onSave={handleSave} /> },
            { id: "lastminute", label: t("tabOffers"), content: <LastMinuteTab salon={salon} onSave={handleSave} /> },
            { id: "payments", label: t("tabPayments"), content: <PaymentsTab salon={salon} onSave={handleSave} /> },
            { id: "quickreplies", label: t("tabQuickReplies"), content: <QuickRepliesTab /> },
            { id: "verification", label: t("tabVerification"), content: <VerificationTab salon={salon} /> },
            { id: "vacation", label: t("tabVacation"), content: <VacationTab salon={salon} onSave={handleSave} /> },
            { id: "sms", label: t("tabSms"), content: <SmsRemindersTab salon={salon} onSave={handleSave} /> },
            { id: "cancellation", label: t("tabCancellation"), content: <CancellationTab salon={salon} onSave={handleSave} /> },
            { id: "closures", label: t("tabClosures"), content: <ClosuresTab salon={salon} /> },
            { id: "scheduling", label: t("tabScheduling"), content: <SchedulingTab salon={salon} onSave={handleSave} /> },
            { id: "commission", label: t("tabCommission"), content: <CommissionTab salon={salon} /> },
            { id: "vat", label: t("tabVat"), content: <VatRegistrationTab salon={salon} onSave={handleSave} /> },
            { id: "offpeak", label: t("tabOffpeak"), content: <OffPeakManager salonId={salon.id} /> },
          ];
          // An unrecognised ?tab= value (stale link, typo) falls back to the first panel
          // rather than rendering an empty card.
          const activeEntry = tabs.find((t) => t.id === activeTab) ?? tabs[0];
          const activeLabel = activeEntry.label;
          return (
            <>
              {/* ── Mobile (lg:hidden): grouped-card index → tap a row → that panel ── */}
              <div className="lg:hidden">
                {!mobilePanelOpen ? (
                  <>
                    <div className="mb-2">
                      <h1 className="font-heading text-[26px] font-bold tracking-[-0.02em] text-s-ink leading-none">{t("pageTitle")}</h1>
                    </div>
                    <MobileSettingsIndex
                      salon={salon}
                      onSelect={(tabId) => { setActiveTab(tabId); setMobilePanelOpen(true); }}
                    />
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setMobilePanelOpen(false)}
                      className="inline-flex items-center gap-1.5 text-[14px] font-heading font-semibold text-s-ink mb-3"
                    >
                      <ChevronRight size={18} strokeWidth={1.9} className="rotate-180" />
                      {t("pageTitle")}
                    </button>
                    <h2 className="font-heading text-[22px] font-bold tracking-[-0.02em] text-s-ink leading-none mb-2">{activeLabel}</h2>
                    <div className="bg-white rounded-[16px] border border-s-border overflow-hidden px-1">
                      {activeEntry.content}
                    </div>
                  </>
                )}
              </div>

              {/* ── Desktop (lg+): unchanged ExpandableTabs bar + panels ── */}
              <div className="hidden lg:block">
                <div className="mb-6">
                  <h1 className="font-heading text-2xl text-s-ink">{t("pageTitle")}</h1>
                </div>
                <div className="bg-white rounded-[12px] shadow-warm-md">
                  <ExpandableTabs
                    activeTab={activeEntry.id}
                    onTabChange={setActiveTab}
                    tabs={tabs}
                  />
                </div>
              </div>
            </>
          );
        })()
      )}
    </DashboardLayout>
  );
}
