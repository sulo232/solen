"use client";

import { useState } from "react";
import { Users, CheckCircle, AlertCircle } from "lucide-react";

interface RemoteQueueJoinProps {
  salonId: string;
  staff?: { id: string; name: string }[];
  services?: { id: string; name_de: string }[];
}

export default function RemoteQueueJoin({ salonId, staff, services }: RemoteQueueJoinProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredBarberId, setPreferredBarberId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    position?: number;
    estimated_wait_minutes?: number;
    tracking_token?: string;
    error?: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/walkin/queue/remote-join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salon_id: salonId,
          customer_name: name.trim(),
          customer_phone: phone.trim() || undefined,
          preferred_barber_id: preferredBarberId || undefined,
          service_id: serviceId || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({
          success: true,
          position: data.position,
          estimated_wait_minutes: data.estimated_wait_minutes,
          tracking_token: data.tracking_token,
        });
      } else {
        setResult({ success: false, error: data.error ?? "Fehler aufgetreten" });
      }
    } catch {
      setResult({ success: false, error: "Netzwerkfehler" });
    } finally {
      setSubmitting(false);
    }
  };

  if (result?.success) {
    return (
      <div className="rounded-[16px] bg-s-sage/10 dark:bg-s-sage/20 border border-s-sage/20 p-5 text-center">
        <CheckCircle size={32} className="text-s-sage mx-auto mb-3" />
        <h4 className="font-heading text-base font-bold text-s-ink dark:text-s-dm-text mb-1">
          Du bist angestellt!
        </h4>
        <p className="text-sm text-s-ink/70 dark:text-s-dm-text/70 mb-3">
          Position <strong>{result.position}</strong> · Geschätzte Wartezeit:{" "}
          <strong>~{result.estimated_wait_minutes} Min.</strong>
        </p>
        <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50">
          Tracking-Code: <code className="font-mono">{result.tracking_token}</code>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {result?.error && (
        <div className="flex items-center gap-2 text-sm text-s-error bg-s-error-bg dark:bg-s-error/10 rounded-btn px-3 py-2">
          <AlertCircle size={16} />
          {result.error}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-s-ink/70 dark:text-s-dm-text/70 mb-1">
          Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={100}
          className="w-full rounded-btn border border-s-ink/10 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-surface px-3 py-2 text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:ring-2 focus:ring-s-coral/30"
          placeholder="Dein Name"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-s-ink/70 dark:text-s-dm-text/70 mb-1">
          Telefon (optional)
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          maxLength={20}
          className="w-full rounded-btn border border-s-ink/10 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-surface px-3 py-2 text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:ring-2 focus:ring-s-coral/30"
          placeholder="+41 79 ..."
        />
      </div>

      {staff && staff.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-s-ink/70 dark:text-s-dm-text/70 mb-1">
            Bevorzugter Barber (optional)
          </label>
          <select
            value={preferredBarberId}
            onChange={(e) => setPreferredBarberId(e.target.value)}
            className="w-full rounded-btn border border-s-ink/10 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-surface px-3 py-2 text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:ring-2 focus:ring-s-coral/30"
          >
            <option value="">Kein Favorit</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}

      {services && services.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-s-ink/70 dark:text-s-dm-text/70 mb-1">
            Service (optional)
          </label>
          <select
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            className="w-full rounded-btn border border-s-ink/10 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-surface px-3 py-2 text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:ring-2 focus:ring-s-coral/30"
          >
            <option value="">Bitte wählen</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.name_de}</option>
            ))}
          </select>
        </div>
      )}

      <button
        type="submit"
        disabled={!name.trim() || submitting}
        <Users size={16} />
        {submitting ? "Wird angemeldet..." : "Jetzt anstellen"}
      </button>
    </form>
  );
}
