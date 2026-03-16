"use client";

// Phase 4 — BookingCalendar
// Full implementation in roadmap Phase 4 (Salon Profile & BookingCalendar).
// This stub renders a placeholder so imports from CategoryPage and other consumers don't break.

import Spinner from "@/components/ui/Spinner";

interface BookingCalendarProps {
  salonId: string;
  serviceId?: string;
  staffMemberId?: string;
  slotId?: string;
}

export default function BookingCalendar(_props: BookingCalendarProps) {
  return (
    <div className="rounded-card border border-gray-100 bg-white p-6 flex flex-col items-center justify-center gap-3 min-h-[320px]">
      <Spinner size="lg" />
      <p className="text-sm text-dark/40">Buchungskalender wird geladen…</p>
      <p className="text-xs text-dark/25">(Phase 4 — noch nicht implementiert)</p>
    </div>
  );
}
