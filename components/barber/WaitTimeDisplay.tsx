"use client";

import { useEffect, useState } from "react";
import { Clock, Users } from "lucide-react";

interface WaitTimeDisplayProps {
  salonId: string;
}

export default function WaitTimeDisplay({ salonId }: WaitTimeDisplayProps) {
  const [waitData, setWaitData] = useState<{
    queue_length: number;
    estimated_wait_minutes: number;
  } | null>(null);

  useEffect(() => {
    const fetchWait = async () => {
      try {
        const res = await fetch(`/api/walkin/queue?salon_id=${salonId}`);
        if (res.ok) {
          const data = await res.json();
          const waiting = (data.queue ?? []).filter(
            (q: { status: string }) => q.status === "waiting"
          );
          const totalWait = waiting.reduce(
            (sum: number, q: { estimated_wait_minutes: number | null }) =>
              sum + (q.estimated_wait_minutes ?? 0),
            0
          );
          setWaitData({
            queue_length: waiting.length,
            estimated_wait_minutes: totalWait,
          });
        }
      } catch {
        // Silently fail for public display
      }
    };

    fetchWait();
    const interval = setInterval(fetchWait, 30_000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [salonId]);

  if (!waitData) return null;

  return (
    <div className="flex items-center gap-3 rounded-btn bg-s-bg-surface dark:bg-s-dm-surface px-4 py-3 border border-s-ink/10 dark:border-s-dm-text/10">
      <Clock size={18} className="text-s-coral shrink-0" />
      <div className="text-sm text-s-ink dark:text-s-dm-text">
        <span className="font-medium">
          Aktuelle Wartezeit: ~{waitData.estimated_wait_minutes} Min.
        </span>
        <span className="text-s-ink/50 dark:text-s-dm-text/50 ml-2 inline-flex items-center gap-1">
          <Users size={14} />
          {waitData.queue_length} {waitData.queue_length === 1 ? "Person" : "Personen"} wartend
        </span>
      </div>
    </div>
  );
}
