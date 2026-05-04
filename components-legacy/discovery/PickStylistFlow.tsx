"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronRight, Star } from "lucide-react";
import StaffPortfolio from "./StaffPortfolio";

interface StaffMember {
  id: string;
  name: string;
  avatar_url: string | null;
  specialties: string[];
}

interface PickStylistFlowProps {
  salonId: string;
  salonSlug: string;
  locale: string;
  onSelect: (staffId: string | null) => void;
}

const LABELS: Record<string, { title: string; any: string; viewWork: string }> = {
  de: { title: "Wähle deinen Stylisten", any: "Egal wer", viewWork: "Portfolio ansehen" },
  en: { title: "Pick your stylist", any: "Anyone", viewWork: "View portfolio" },
  fr: { title: "Choisissez votre styliste", any: "N'importe qui", viewWork: "Voir le portfolio" },
  it: { title: "Scegli il tuo stilista", any: "Chiunque", viewWork: "Vedi portfolio" },
};

export default function PickStylistFlow({ salonId, salonSlug, locale, onSelect }: PickStylistFlowProps) {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const labels = LABELS[locale] ?? LABELS.de;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/salons/${salonSlug}/staff`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          if (!cancelled) setStaff(data.staff ?? data.data ?? []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [salonSlug]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 rounded-[16px] bg-s-ink/5 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-base font-heading text-s-ink mb-3">{labels.title}</h3>

      <div className="space-y-2">
        {/* "Anyone" option */}
        <button
          onClick={() => onSelect(null)}
          className="w-full flex items-center gap-3 p-3 rounded-[16px] bg-[--raised] border border-s-ink/5 hover:border-s-coral/30 transition-colors duration-150 text-left"
        >
          <div className="w-10 h-10 rounded-full bg-s-ink/5 flex items-center justify-center text-s-ink/30">
            <Star size={16} />
          </div>
          <span className="flex-1 text-sm font-medium text-s-ink">{labels.any}</span>
          <ChevronRight size={16} className="text-s-ink/20" />
        </button>

        {/* Staff members */}
        {staff.map((member) => (
          <div key={member.id}>
            <button
              onClick={() => setExpanded(expanded === member.id ? null : member.id)}
              className="w-full flex items-center gap-3 p-3 rounded-[16px] bg-[--raised] border border-s-ink/5 hover:border-s-coral/30 transition-colors duration-150 text-left"
            >
              <div className="w-10 h-10 rounded-full bg-s-ink/5 overflow-hidden shrink-0">
                {member.avatar_url ? (
                  <Image src={member.avatar_url} alt={member.name} width={40} height={40} className="object-cover w-full h-full" />
                ) : (
                  <div className="flex items-center justify-center h-full text-sm font-medium text-s-ink/30">
                    {member.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-s-ink truncate">{member.name}</p>
                {member.specialties.length > 0 && (
                  <p className="text-xs text-s-ink/40 truncate">{member.specialties.join(", ")}</p>
                )}
              </div>
              <ChevronRight size={16} className={`text-s-ink/20 transition-transform ${expanded === member.id ? "rotate-90" : ""}`} />
            </button>

            {expanded === member.id && (
              <div className="mt-2 ml-4">
                <StaffPortfolio
                  staff={member}
                  salonId={salonId}
                  onBookWith={(staffId) => onSelect(staffId)}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
