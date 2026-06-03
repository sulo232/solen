"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { Clock, Check, Scissors, AlertCircle, RefreshCw } from "lucide-react";
import Spinner from "@/components-legacy/ui/Spinner";
import TipSheet from "@/app/[locale]/_components/tips/TipSheet";

// Mirrors the public GET /api/walkin/queue/status?token= response.
interface QueueStatus {
  id: string;
  customerName: string; // the ticket code, e.g. "A01"
  position: number;
  status: "waiting" | "in_chair" | "completed" | "no_show" | "cancelled";
  estimatedWaitMinutes: number;
  aheadCount: number;
  joinedAt: string;
  calledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  recipientName?: string | null;
  recipientPhoto?: string | null;
  recipientRating?: number | null;
  recipientReviewCount?: number | null;
  serviceName?: string | null;
  salonName?: string | null;
}

type Copy = Record<string, string>;
const COPY: Record<string, Copy> = {
  de: { yourNumber: "Deine Nummer", inQueue: "Du bist in der Schlange", ahead: "vor dir", waitSuffix: "Min Wartezeit", soon: "Gleich bist du dran", youreUp: "Du bist dran!", goToChair: "Geh zum Stuhl", done: "Fertig — danke!", doneSub: "Wir hoffen, es hat dir gefallen", cancelled: "Storniert", cancelledSub: "Dieses Ticket ist nicht mehr aktiv", noShow: "Nummer verpasst", noShowSub: "Diese Nummer wurde aufgerufen, aber niemand war da", notFound: "Ticket nicht gefunden", notFoundSub: "Dieser Link ist ungültig oder abgelaufen", autoUpdate: "Aktualisiert sich automatisch", refresh: "Aktualisieren", home: "Zur Startseite", cancel: "Stornieren", cancelConfirm: "Stornieren und Erstattung erhalten?", tip: "Trinkgeld geben" },
  en: { yourNumber: "Your number", inQueue: "You're in the queue", ahead: "ahead of you", waitSuffix: "min wait", soon: "You're up soon", youreUp: "You're up!", goToChair: "Head to the chair", done: "All done — thanks!", doneSub: "Hope you loved it", cancelled: "Cancelled", cancelledSub: "This ticket is no longer active", noShow: "Number missed", noShowSub: "This number was called but no one was there", notFound: "Ticket not found", notFoundSub: "This link is invalid or expired", autoUpdate: "Updates automatically", refresh: "Refresh", home: "Go home", cancel: "Cancel", cancelConfirm: "Cancel and get a refund?", tip: "Leave a tip" },
  fr: { yourNumber: "Votre numéro", inQueue: "Vous êtes dans la file", ahead: "devant vous", waitSuffix: "min d'attente", soon: "Bientôt à vous", youreUp: "À vous !", goToChair: "Rendez-vous au fauteuil", done: "Terminé — merci !", doneSub: "On espère que ça vous a plu", cancelled: "Annulé", cancelledSub: "Ce ticket n'est plus actif", noShow: "Numéro manqué", noShowSub: "Ce numéro a été appelé mais personne n'était là", notFound: "Ticket introuvable", notFoundSub: "Ce lien est invalide ou expiré", autoUpdate: "Mise à jour automatique", refresh: "Actualiser", home: "Accueil", cancel: "Annuler", cancelConfirm: "Annuler et être remboursé ?", tip: "Laisser un pourboire" },
  it: { yourNumber: "Il tuo numero", inQueue: "Sei in coda", ahead: "prima di te", waitSuffix: "min di attesa", soon: "Presto tocca a te", youreUp: "Tocca a te!", goToChair: "Vai alla poltrona", done: "Fatto — grazie!", doneSub: "Speriamo ti sia piaciuto", cancelled: "Annullato", cancelledSub: "Questo ticket non è più attivo", noShow: "Numero saltato", noShowSub: "Questo numero è stato chiamato ma non c'era nessuno", notFound: "Ticket non trovato", notFoundSub: "Questo link non è valido o è scaduto", autoUpdate: "Si aggiorna automaticamente", refresh: "Aggiorna", home: "Home", cancel: "Annulla", cancelConfirm: "Annullare e ricevere il rimborso?", tip: "Lascia una mancia" },
};

export default function QueueTrackingPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token;
  const locale = useLocale();
  const l = COPY[locale] ?? COPY.de;

  const [data, setData] = useState<QueueStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);
  const dataRef = useRef<QueueStatus | null>(null);
  useEffect(() => { dataRef.current = data; }, [data]);

  const fetchStatus = useCallback(async () => {
    if (!token) return;
    setRefreshing(true);
    try {
      const res = await fetch(`/api/walkin/queue/status?token=${encodeURIComponent(token)}`, { cache: "no-store" });
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (!res.ok) throw new Error(`status ${res.status}`);
      const json = (await res.json()) as QueueStatus;
      setData(json);
      setNotFound(false);
    } catch (e) {
      console.error("[queue-track] status fetch failed:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  // Adaptive, visibility-aware polling — feels near-live without hammering the API:
  // faster when you're near the front, PAUSED when the tab is hidden, instant refetch
  // when you return, and it stops once the visit is terminal. (True websocket realtime
  // would need a sanitized broadcast channel — postgres_changes leaks tracking tokens.)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const isTerminal = (s?: string) => s === "completed" || s === "cancelled" || s === "no_show";

    const schedule = () => {
      if (timer) clearTimeout(timer);
      const s = dataRef.current?.status;
      if (isTerminal(s) || (typeof document !== "undefined" && document.hidden)) return;
      const ahead = dataRef.current?.aheadCount ?? 99;
      const delay = s === "in_chair" ? 10000 : ahead <= 1 ? 8000 : ahead <= 4 ? 15000 : 25000;
      timer = setTimeout(async () => { await fetchStatus(); schedule(); }, delay);
    };

    const onVisibility = () => {
      if (document.hidden) { if (timer) { clearTimeout(timer); timer = null; } }
      else { fetchStatus().then(schedule); } // came back → refresh immediately, resume
    };

    fetchStatus().then(schedule);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [fetchStatus]);

  // Customer self-cancel (only allowed while still waiting) — the DELETE endpoint
  // releases the card hold / refunds, then we flip the UI to the cancelled state.
  const handleCancel = async () => {
    if (!data || !token || cancelling) return;
    if (!window.confirm(l.cancelConfirm)) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/walkin/queue/${data.id}?token=${encodeURIComponent(token)}`, { method: "DELETE" });
      if (res.ok) {
        setData((prev) => (prev ? { ...prev, status: "cancelled" } : prev));
      } else {
        const j = await res.json().catch(() => null);
        console.error("[queue-track] cancel failed:", j?.error);
      }
    } catch (e) {
      console.error("[queue-track] cancel error:", e);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Spinner size="md" />
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
        <AlertCircle size={40} className="mb-4 text-s-ink-3" />
        <h1 className="font-heading text-[20px] font-bold text-s-ink">{l.notFound}</h1>
        <p className="mt-1.5 text-[14px] text-s-ink-2">{l.notFoundSub}</p>
        <Link href={`/${locale}`} className="mt-6 rounded-btn bg-s-ink px-5 py-2.5 font-heading text-[14px] font-semibold text-white">
          {l.home}
        </Link>
      </div>
    );
  }

  const isWaiting = data.status === "waiting";
  const isUp = data.status === "in_chair";
  const isDone = data.status === "completed";
  const isCancelled = data.status === "cancelled";
  const isNoShow = data.status === "no_show";
  const almost = isWaiting && data.aheadCount <= 1;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10">
        {/* Ticket number */}
        <p className="text-[12px] font-semibold uppercase tracking-[1px] text-s-ink-3">{l.yourNumber}</p>
        <div
          className={`mt-2 font-heading text-[88px] font-bold leading-none tracking-[-.03em] tabular-nums ${
            isUp ? "text-s-success" : isCancelled || isNoShow ? "text-s-ink-3" : "text-s-ink"
          }`}
        >
          {data.customerName}
        </div>

        {/* Status block */}
        <div className="mt-8 w-full max-w-sm">
          {isWaiting && (
            <div className="rounded-2xl border border-s-ink/[0.08] bg-white p-5 text-center shadow-[0_1px_2px_rgba(20,18,16,.04),0_8px_24px_rgba(20,18,16,.05)]">
              <div className="flex items-center justify-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-s-success opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-s-success" />
                </span>
                <span className="font-heading text-[16px] font-semibold text-s-ink">
                  {almost ? l.soon : l.inQueue}
                </span>
              </div>
              <div className="mt-4 flex items-stretch justify-center divide-x divide-s-ink/[0.08]">
                <div className="px-6">
                  <div className="font-heading text-[28px] font-bold tabular-nums text-s-ink">{data.aheadCount}</div>
                  <div className="mt-0.5 text-[12px] text-s-ink-2">{l.ahead}</div>
                </div>
                <div className="px-6">
                  <div className="flex items-center justify-center gap-1 font-heading text-[28px] font-bold tabular-nums text-s-ink">
                    <Clock size={18} className="text-s-ink-3" />~{data.estimatedWaitMinutes}
                  </div>
                  <div className="mt-0.5 text-[12px] text-s-ink-2">{l.waitSuffix}</div>
                </div>
              </div>
            </div>
          )}

          {isUp && (
            <div className="rounded-2xl bg-s-success/[0.08] p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-s-success">
                <Scissors size={22} className="text-white" />
              </div>
              <h2 className="mt-3 font-heading text-[22px] font-bold text-s-success">{l.youreUp}</h2>
              <p className="mt-1 text-[14px] text-s-ink-2">{l.goToChair}</p>
            </div>
          )}

          {isDone && (
            <div>
              <div className="rounded-2xl bg-s-success/[0.08] p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-s-success">
                  <Check size={24} className="text-white" />
                </div>
                <h2 className="mt-3 font-heading text-[20px] font-bold text-s-ink">{l.done}</h2>
                <p className="mt-1 text-[14px] text-s-ink-2">{l.doneSub}</p>
              </div>
              {/* Tip entry — appears AFTER the cut. Blue tip action (matches the shared TipFlow). */}
              <button
                type="button"
                onClick={() => setTipOpen(true)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-btn bg-s-accent py-3.5 font-heading text-[14px] font-semibold text-white transition-[transform,filter] hover:brightness-[1.06] active:scale-[0.98]"
              >
                {l.tip}
              </button>
            </div>
          )}

          {(isCancelled || isNoShow) && (
            <div className="rounded-2xl bg-s-ink-1 p-6 text-center">
              <h2 className="font-heading text-[18px] font-bold text-s-ink">{isCancelled ? l.cancelled : l.noShow}</h2>
              <p className="mt-1 text-[14px] text-s-ink-2">{isCancelled ? l.cancelledSub : l.noShowSub}</p>
            </div>
          )}
        </div>

        {/* Cancel — only while still waiting (DELETE rejects once in the chair) */}
        {isWaiting && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="mt-6 text-[13px] font-medium text-s-ink-3 underline underline-offset-2 transition-colors hover:text-s-error disabled:opacity-50"
          >
            {cancelling ? "…" : l.cancel}
          </button>
        )}

        {/* Auto-refresh footer (only while the visit is live) */}
        {(isWaiting || isUp) && (
          <button
            onClick={fetchStatus}
            className="mt-5 flex items-center gap-1.5 text-[12px] font-medium text-s-ink-3 transition-colors hover:text-s-ink-2"
          >
            <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
            {l.autoUpdate}
          </button>
        )}
      </div>

      {data && (
        <TipSheet
          open={tipOpen}
          onClose={() => setTipOpen(false)}
          recipientName={data.recipientName || (locale === "en" ? "your stylist" : locale === "fr" ? "votre coiffeur" : locale === "it" ? "il tuo parrucchiere" : "dein Coiffeur")}
          recipientPhoto={data.recipientPhoto}
          recipientRating={data.recipientRating}
          recipientReviewCount={data.recipientReviewCount}
          contextLine={[data.serviceName, data.salonName].filter(Boolean).join(" · ") || undefined}
          locale={locale}
          createIntent={(amount) =>
            fetch("/api/walkin/tip", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token, amount }),
            }).then((r) => r.json())
          }
        />
      )}
    </div>
  );
}
