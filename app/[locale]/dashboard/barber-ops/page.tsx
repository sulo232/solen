"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import BarberLeaderboard from "@/components/dashboard/barber/BarberLeaderboard";
import ChairManager from "@/components/dashboard/barber/ChairManager";
import SmartReminderConfig from "@/components/dashboard/barber/SmartReminderConfig";
import WalkinAnalytics from "@/components/dashboard/barber/WalkinAnalytics";
import WalkinQueue from "@/components/barber/WalkinQueue";
import Spinner from "@/components/ui/Spinner";

export default function BarberOpsPage() {
  const [salonId, setSalonId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSalon = async () => {
      try {
        const res = await fetch("/api/dashboard/clients?category=barbershop");
        if (res.ok) {
          const data = await res.json();
          setSalonId(data.salon_id ?? "");
        }
      } catch {
        // Error
      }
      setLoading(false);
    };
    fetchSalon();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12"><Spinner /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="font-heading text-xl font-bold text-s-ink dark:text-s-dm-text">
          Barbershop Operations
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChairManager salonId={salonId} />
          <WalkinAnalytics salonId={salonId} />
        </div>

        <WalkinQueue salonId={salonId} />
        <SmartReminderConfig salonId={salonId} />
        <BarberLeaderboard salonId={salonId} />
      </div>
    </DashboardLayout>
  );
}
