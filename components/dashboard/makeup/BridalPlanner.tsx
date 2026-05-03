"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { CalendarHeart, Plus, ChevronRight, Link as LinkIcon, X } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import ClientSelectorDropdown from "@/components/shared/ClientSelectorDropdown";

const STAGES = [
  { key: "trial_pending", labelKey: "stage.trial_pending" },
  { key: "trial_done", labelKey: "stage.trial_done" },
  { key: "look_approved", labelKey: "stage.look_approved" },
  { key: "day_of_scheduled", labelKey: "stage.day_of" },
  { key: "completed", labelKey: "stage.completed" },
] as const;

interface BridalWorkflow {
  id: string;
  client_id: string;
  event_date: string;
  event_type: string;
  trial_booking_id: string | null;
  final_booking_id: string | null;
  inspiration_urls: string[] | null;
  approved_look_photo_url: string | null;
  notes: string | null;
  status: string;
  created_at: string;
}

export default function BridalPlanner({ salonId }: { salonId: string }) {
  const t = useTranslations("dashboardMakeup") as any;
  const [workflows, setWorkflows] = useState<BridalWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [advancing, setAdvancing] = useState<string | null>(null);

  // Form state
  const [clientId, setClientId] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventType, setEventType] = useState("bridal");
  const [inspoUrl, setInspoUrl] = useState("");
  const [inspoUrls, setInspoUrls] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetch(`/api/dashboard/makeup/bridal?salon_id=${salonId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.data) setWorkflows(d.data); })
      .catch((err) => console.error("[BridalPlanner] failed to load bridal workflows:", err))
      .finally(() => setLoading(false));
  }, [salonId]);

  const addInspoUrl = () => {
    if (!inspoUrl.trim()) return;
    setInspoUrls((prev) => [...prev, inspoUrl.trim()]);
    setInspoUrl("");
  };

  const handleCreate = async () => {
    if (!clientId || !eventDate) return;
    setSaving(true);
    try {
      const res = await fetch("/api/dashboard/makeup/bridal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salon_id: salonId,
          client_id: clientId,
          event_date: eventDate,
          event_type: eventType,
          inspiration_urls: inspoUrls.length > 0 ? inspoUrls : undefined,
          notes: notes || undefined,
        }),
      });
      if (res.ok) {
        const d = await res.json();
        if (d.data) setWorkflows((prev) => [...prev, d.data]);
        setShowForm(false);
        setClientId("");
        setEventDate("");
        setEventType("bridal");
        setInspoUrls([]);
        setNotes("");
      }
    } finally {
      setSaving(false);
    }
  };

  const advanceStage = async (workflow: BridalWorkflow) => {
    const currentIdx = STAGES.findIndex((s) => s.key === workflow.status);
    if (currentIdx < 0 || currentIdx >= STAGES.length - 1) return;
    const nextStatus = STAGES[currentIdx + 1].key;

    setAdvancing(workflow.id);
    try {
      const res = await fetch("/api/dashboard/makeup/bridal", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: workflow.id, status: nextStatus }),
      });
      if (res.ok) {
        const d = await res.json();
        if (d.data) {
          setWorkflows((prev) => prev.map((w) => w.id === workflow.id ? d.data : w));
        }
      }
    } finally {
      setAdvancing(null);
    }
  };

  if (loading) return <div className="flex justify-center py-6"><Spinner /></div>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarHeart size={16} className="text-s-coral" />
          <h3 className="font-heading font-semibold text-sm text-s-ink">
            {t("bridal_title")}
          </h3>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 px-3 py-1.5 min-h-[44px] rounded-pill text-[11px] font-heading font-bold uppercase tracking-[.06em] bg-s-coral text-white hover:brightness-[1.06] active:scale-[0.97] shadow-elevation-2 transition-[transform,filter] duration-150"
          aria-label={t("bridal_new")}
        >
          <Plus size={12} />
          {t("bridal_new")}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="rounded-[12px] border border-s-ink/[0.06] p-4 bg-[--raised] space-y-3">
          <div className="bg-s-bg-sunken rounded-[8px]">
            <ClientSelectorDropdown 
              salonId={salonId}
              value={clientId || null} 
              onChange={(id) => setClientId(id || "")} 
              placeholder={t("bridal_client_id")} 
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="px-3 py-2 rounded-[8px] border border-s-ink/[0.10] bg-transparent text-xs text-s-ink"
              aria-label={t("bridal_event_date")}
            />
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="px-3 py-2 rounded-[8px] border border-s-ink/[0.10] bg-transparent text-xs text-s-ink"
              aria-label={t("bridal_event_type")}
            >
              <option value="bridal">{t("event_type.bridal")}</option>
              <option value="prom">{t("event_type.prom")}</option>
              <option value="gala">{t("event_type.gala")}</option>
              <option value="photoshoot">{t("event_type.photoshoot")}</option>
            </select>
          </div>

          {/* Inspiration URLs */}
          <div className="space-y-2">
            <p className="text-[10px] font-heading font-bold uppercase tracking-[.10em] text-s-ink/40">
              {t("bridal_inspo")}
            </p>
            <div className="flex gap-2">
              <input
                value={inspoUrl}
                onChange={(e) => setInspoUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addInspoUrl(); } }}
                placeholder="https://..."
                className="flex-1 px-3 py-2 rounded-[8px] border border-s-ink/[0.10] bg-transparent text-xs text-s-ink"
                aria-label={t("bridal_inspo")}
              />
              <button
                onClick={addInspoUrl}
                className="px-3 py-2 rounded-[8px] bg-s-ink/[0.04] text-xs text-s-ink"
                aria-label={t("add")}
              >
                <Plus size={12} />
              </button>
            </div>
            {inspoUrls.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {inspoUrls.map((url, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-[8px] bg-s-ink/[0.04] text-[10px] text-s-ink/60 max-w-[200px] truncate">
                    <LinkIcon size={9} className="shrink-0" />
                    {url}
                    <button onClick={() => setInspoUrls((prev) => prev.filter((_, j) => j !== i))} aria-label={t("remove")}>
                      <X size={9} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder={t("notes")}
            className="w-full px-3 py-2 rounded-[8px] border border-s-ink/[0.10] bg-transparent text-xs text-s-ink resize-none"
            aria-label={t("notes")}
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={saving || !clientId || !eventDate}
              className="px-4 py-2 min-h-[44px] rounded-pill bg-s-coral text-white text-[11px] font-heading font-bold uppercase tracking-[.06em] hover:brightness-[1.06] active:scale-[0.97] shadow-elevation-2 transition-[transform,filter] duration-150 disabled:opacity-40"
              aria-label={saving ? t("saving") : t("save")}
            >
              {saving ? t("saving") : t("save")}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-[8px] text-xs text-s-ink/50"
              aria-label={t("cancel")}
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      )}

      {/* Workflow list */}
      {workflows.length > 0 ? (
        <div className="space-y-3">
          {workflows.map((wf) => {
            const currentStageIndex = STAGES.findIndex((s) => s.key === wf.status);
            const isCompleted = wf.status === "completed";

            return (
              <div
                key={wf.id}
                className="rounded-[12px] border border-s-ink/[0.06] p-4 bg-[--raised]"
              >
                {/* Event info */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-[10px] font-heading font-bold uppercase tracking-[.10em] text-s-ink/40">
                      {t(`event_type.${wf.event_type}` as any)}
                    </span>
                    <p className="text-sm font-heading font-semibold text-s-ink">
                      {new Date(wf.event_date).toLocaleDateString()}
                    </p>
                  </div>
                  {!isCompleted && (
                    <button
                      onClick={() => advanceStage(wf)}
                      disabled={advancing === wf.id}
                      className="flex items-center gap-1 px-3 py-1.5 min-h-[44px] rounded-pill text-[10px] font-heading font-bold uppercase tracking-[.06em] border border-s-coral/30 text-s-coral hover:bg-s-coral/[0.04] active:scale-[0.97] transition-[transform,border-color,color] duration-150 disabled:opacity-40"
                      aria-label={t("bridal_advance")}
                    >
                      {advancing === wf.id ? <Spinner /> : (
                        <>
                          {t("bridal_advance")}
                          <ChevronRight size={12} />
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Stage progress dots — overflow-x-auto on mobile */}
                <div className="flex items-center gap-2 mb-3 overflow-x-auto">
                  {STAGES.map((stage, i) => {
                    const isDone = i < currentStageIndex;
                    const isCurrent = i === currentStageIndex;
                    return (
                      <div key={stage.key} className="flex items-center gap-2 shrink-0">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            isDone ? "bg-s-sage" : isCurrent ? "bg-s-coral" : "bg-s-ink/10"
                          }`}
                        />
                        <span
                          className={`text-[10px] font-heading font-semibold whitespace-nowrap ${
                            isCurrent ? "text-s-coral" : "text-s-ink/30"
                          }`}
                        >
                          {t(stage.labelKey)}
                        </span>
                        {i < STAGES.length - 1 && (
                          <div className="w-4 h-px bg-s-ink/10" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Inspiration links */}
                {wf.inspiration_urls && wf.inspiration_urls.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {wf.inspiration_urls.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-[4px] bg-s-blue/[0.06] text-s-blue"
                      >
                        <LinkIcon size={8} />
                        {t("bridal_inspo")} {i + 1}
                      </a>
                    ))}
                  </div>
                )}

                {wf.notes && (
                  <p className="text-[10px] text-s-ink/50 mt-1">{wf.notes}</p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        !showForm && (
          <p className="text-center text-xs text-s-ink/30 py-6">
            {t("bridal_empty")}
          </p>
        )
      )}
    </div>
  );
}
