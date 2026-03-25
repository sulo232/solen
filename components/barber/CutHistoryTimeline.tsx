"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Scissors, Calendar, RefreshCw } from "lucide-react";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";

interface CutEntry {
  id: string;
  staff_member_id: string;
  staff_name: string;
  shape: string | null;
  length_setting: string | null;
  fade_type: string | null;
  top_style: string | null;
  beard_style: string | null;
  lineup: boolean;
  photos: string[];
  notes: string | null;
  created_at: string;
  service_name: string;
}

interface CutHistoryTimelineProps {
  clientId: string;
  salonId: string;
  onRepeat?: (cut: CutEntry) => void;
}

export default function CutHistoryTimeline({ clientId, salonId, onRepeat }: CutHistoryTimelineProps) {
  const [cuts, setCuts] = useState<CutEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCuts = async () => {
      try {
        const res = await fetch(`/api/clients/${clientId}/cut-history?salon_id=${salonId}`);
        if (res.ok) {
          const data = await res.json();
          setCuts(data.history ?? []);
        }
      } catch {
        // Error loading
      }
      setLoading(false);
    };
    fetchCuts();
  }, [clientId, salonId]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3 items-start">
            <Skeleton className="w-8 h-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-full rounded-btn" />
              <div className="flex gap-1.5">
                <Skeleton className="h-5 w-14 rounded-pill" />
                <Skeleton className="h-5 w-14 rounded-pill" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (cuts.length === 0) {
    return (
      <EmptyState
        icon={Scissors}
        title="Noch keine Schnitte erfasst"
        message="Schnitte werden nach dem ersten Termin angezeigt."
        className="py-6"
      />
    );
  }

  return (
    <div className="space-y-4">
      {cuts.map((cut) => {
        const specs = [
          cut.fade_type && `Fade: ${cut.fade_type}`,
          cut.top_style && `Top: ${cut.top_style}`,
          cut.length_setting && `Guard: #${cut.length_setting}`,
          cut.beard_style && `Bart: ${cut.beard_style}`,
          cut.lineup && "Lineup ✓",
        ].filter(Boolean);

        return (
          <div
            key={cut.id}
            className="rounded-[16px] bg-white dark:bg-s-dm-surface border border-s-ink/5 dark:border-s-dm-text/10 p-4"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2 text-sm text-s-ink dark:text-s-dm-text">
                  <Calendar size={14} className="text-s-ink/40 dark:text-s-dm-text/40" />
                  {new Date(cut.created_at).toLocaleDateString("de-CH", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
                <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50 mt-0.5">
                  {cut.service_name} · bei {cut.staff_name}
                </p>
              </div>
              {onRepeat && (
                <button
                  onClick={() => onRepeat(cut)}
                  className="flex items-center gap-1 text-xs text-s-coral hover:brightness-[1.06] transition-colors"
                >
                  <RefreshCw size={12} />
                  Wiederholen
                </button>
              )}
            </div>

            {/* Cut spec badges */}
            {specs.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {specs.map((spec, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-0.5 rounded-pill bg-s-bg-surface dark:bg-s-dm-bg text-s-ink/70 dark:text-s-dm-text/70"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            )}

            {/* Photos */}
            {cut.photos.length > 0 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide mt-2">
                {cut.photos.map((url, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-btn overflow-hidden shrink-0">
                    <Image src={url} alt="Cut photo" fill className="object-cover" sizes="80px" />
                  </div>
                ))}
              </div>
            )}

            {/* Notes */}
            {cut.notes && (
              <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50 mt-2 italic">{cut.notes}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
