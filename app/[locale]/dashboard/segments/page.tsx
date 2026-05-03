"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Zap, DollarSign, AlertTriangle, UserPlus, Heart, Users,
  ChevronDown, ChevronUp, Mail,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import { containerVariants, itemVariants } from "@/lib/animations";

const ICON_MAP: Record<string, LucideIcon> = {
  Zap, DollarSign, AlertTriangle, UserPlus, Heart, Users,
};

interface Segment {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  member_count: number;
}

interface Member {
  user_id: string;
  display_name: string | null;
  email?: string;
}

export default function SegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [members, setMembers] = useState<Record<string, Member[]>>({});
  const [membersLoading, setMembersLoading] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/segments")
      .then((r) => r.json())
      .then((d) => setSegments(d.segments ?? []))
      .catch(() => setSegments([]))
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = useCallback(async (segmentId: string) => {
    if (expanded === segmentId) {
      setExpanded(null);
      return;
    }
    setExpanded(segmentId);

    if (!members[segmentId]) {
      setMembersLoading(segmentId);
      try {
        const res = await fetch(`/api/admin/segments/${segmentId}/members`);
        const data = await res.json();
        setMembers((prev) => ({ ...prev, [segmentId]: data.members ?? [] }));
      } catch {
        setMembers((prev) => ({ ...prev, [segmentId]: [] }));
      } finally {
        setMembersLoading(null);
      }
    }
  }, [expanded, members]);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-heading text-2xl text-s-ink">Kundensegmente</h1>
        <p className="text-sm text-s-ink/40 mt-0.5">Automatisch berechnete Kundengruppen</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : segments.length === 0 ? (
        <EmptyState icon={Users} title="Keine Segmente" message="Segmente werden automatisch berechnet." />
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {segments.map((seg) => {
            const Icon = ICON_MAP[seg.icon] ?? Users;
            const isExpanded = expanded === seg.id;

            return (
              <motion.div
                key={seg.id}
                variants={itemVariants}
                className="bg-white rounded-[12px] border border-s-ink/5 shadow-warm-md overflow-hidden"
              >
                {/* Header */}
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-10 h-10 rounded-[8px] flex items-center justify-center"
                      style={{ backgroundColor: seg.color + "15", color: seg.color }}
                    >
                      <Icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading text-sm text-s-ink truncate">{seg.name}</h3>
                      <p className="text-xs text-s-ink/40">{seg.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <span className="text-2xl font-heading data-text" style={{ color: seg.color }}>
                      {seg.member_count}
                    </span>
                    <span className="text-xs text-s-ink/30">Mitglieder</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t border-s-ink/5 px-4 py-2.5 flex items-center gap-2">
                  <button
                    onClick={() => toggleExpand(seg.id)}
                    className="inline-flex items-center gap-1 text-xs text-s-ink/50 hover:text-s-coral transition-colors"
                  >
                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    {isExpanded ? "Ausblenden" : "Mitglieder"}
                  </button>
                  <button className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-btn border border-s-ink/10 text-xs text-s-ink/50 hover:border-s-coral hover:text-s-coral transition-colors">
                    <Mail size={11} />
                    E-Mail senden
                  </button>
                </div>

                {/* Expanded members */}
                {isExpanded && (
                  <div className="border-t border-s-ink/5 px-4 py-3 max-h-48 overflow-y-auto">
                    {membersLoading === seg.id ? (
                      <div className="flex justify-center py-4"><Spinner size="sm" /></div>
                    ) : (members[seg.id] ?? []).length === 0 ? (
                      <p className="text-xs text-s-ink/30 text-center py-2">Keine Mitglieder</p>
                    ) : (
                      <div className="space-y-1.5">
                        {(members[seg.id] ?? []).map((m) => (
                          <div key={m.user_id} className="flex items-center gap-2 text-xs">
                            <div className="w-6 h-6 rounded-full bg-s-bg-sunken flex items-center justify-center text-[10px] font-bold text-s-ink/40">
                              {(m.display_name ?? "?")[0]}
                            </div>
                            <span className="text-s-ink/70">{m.display_name ?? "Anonym"}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </DashboardLayout>
  );
}
