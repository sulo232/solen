'use client';

import React, { useState, useEffect } from "react";
import { ExpandableTabs } from "../../components/ui/ExpandableTabs";
import { Spinner } from "../../components/ui/Spinner";
import { Calendar, RotateCcw, X, AlertTriangle } from "lucide-react";
import type { Booking, UserPreferences } from "../../lib/types";

interface AccountPageProps {
  locale?: string;
}

function CancellationModal({ booking, onClose, onConfirm }: { booking: Booking; onClose: () => void; onConfirm: (id: string, reason: string) => void }) {
  const [reason, setReason] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center px-4">
      <div className="bg-white rounded-t-2xl sm:rounded-card w-full max-w-sm p-6">
        <h3 className="font-heading font-semibold text-dark text-base mb-2">Termin stornieren?</h3>
        <p className="text-sm text-gray-500 mb-4">
          Möchtest du <strong>{booking.service.name}</strong> bei <strong>{booking.salon.name}</strong> wirklich stornieren?
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Grund (optional)"
          rows={3}
          className="w-full border border-gray-200 rounded-btn px-3 py-2 text-sm mb-4 resize-none focus:outline-none focus:border-teal"
        />
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-btn border border-gray-200 text-sm text-dark hover:bg-gray-50"
          >
            Abbrechen
          </button>
          <button
            onClick={async () => { setIsConfirming(true); await onConfirm(booking.id, reason); }}
            disabled={isConfirming}
            className="flex-1 py-2.5 rounded-btn bg-coral text-white text-sm font-semibold hover:bg-coral/90 disabled:opacity-60"
          >
            {isConfirming ? "..." : "Ja, stornieren"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AccountPage({ locale = "de" }: AccountPageProps) {
  const [activeTab, setActiveTab] = useState("termine");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancelModalBooking, setCancelModalBooking] = useState<Booking | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/bookings").then((r) => r.json()),
      fetch("/api/profile/preferences").then((r) => r.json()),
    ])
      .then(([bookingsData, prefsData]: [Booking[], UserPreferences]) => {
        setBookings(bookingsData ?? []);
        setPreferences(prefsData);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const handleCancel = async (bookingId: string, reason: string) => {
    await fetch(`/api/bookings/${bookingId}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    setBookings((prev) => prev.map((b) => b.id === bookingId ? { ...b, status: "cancelled" } : b));
    setCancelModalBooking(null);
  };

  const upcomingBookings = bookings.filter((b) => b.status === "confirmed" && new Date(b.slot_datetime) > new Date());
  const pastBookings = bookings.filter((b) => b.status === "completed");

  const canCancel = (booking: Booking) => {
    return new Date(booking.cancel_deadline) > new Date();
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex justify-center mb-6">
          <ExpandableTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Termine */}
        {activeTab === "termine" && (
          <div>
            <h2 className="font-heading font-semibold text-dark text-lg mb-4">Meine Termine</h2>
            {isLoading ? (
              <div className="flex justify-center py-8"><Spinner size={24} /></div>
            ) : (
              <>
                {upcomingBookings.length > 0 && (
                  <div className="mb-6">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Bevorstehend</p>
                    <div className="flex flex-col gap-3">
                      {upcomingBookings.map((booking) => (
                        <div key={booking.id} className="bg-white rounded-card shadow-card p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-heading font-semibold text-dark text-sm">{booking.salon.name}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{booking.service.name}</p>
                              <div className="flex items-center gap-1 mt-2 text-xs text-gray-600">
                                <Calendar size={12} className="text-teal" />
                                <span className="font-data">
                                  {new Date(booking.slot_datetime).toLocaleDateString("de-CH", {
                                    weekday: "short", day: "numeric", month: "short"
                                  })}
                                  {" · "}
                                  {new Date(booking.slot_datetime).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })} Uhr
                                </span>
                              </div>
                            </div>
                            <span className="font-data font-bold text-sm text-dark">CHF {booking.service.price}</span>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <a
                              href={`/${locale}/salon/${booking.salon.slug}?service=${booking.service_id}&staff=${booking.staff_member_id ?? ""}`}
                              className="flex-1 text-center py-2 text-xs font-semibold text-teal border border-teal rounded-btn hover:bg-teal/5 flex items-center justify-center gap-1"
                            >
                              <RotateCcw size={12} /> Nochmal buchen
                            </a>
                            {canCancel(booking) ? (
                              <button
                                onClick={() => setCancelModalBooking(booking)}
                                className="flex-1 text-center py-2 text-xs font-semibold text-coral border border-coral/30 rounded-btn hover:bg-coral/5"
                              >
                                Stornieren
                              </button>
                            ) : (
                              <span
                                title="Stornierung nicht mehr möglich (weniger als 24h vor Termin)"
                                className="flex-1 text-center py-2 text-xs text-gray-300 border border-gray-100 rounded-btn cursor-not-allowed flex items-center justify-center gap-1"
                              >
                                <AlertTriangle size={11} /> Stornieren
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {pastBookings.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Vergangen</p>
                    <div className="flex flex-col gap-3">
                      {pastBookings.map((booking) => (
                        <div key={booking.id} className="bg-white rounded-card p-4 opacity-70">
                          <div className="flex justify-between">
                            <div>
                              <p className="font-medium text-sm text-dark">{booking.salon.name}</p>
                              <p className="text-xs text-gray-500">{booking.service.name}</p>
                            </div>
                            <a
                              href={`/${locale}/salon/${booking.salon.slug}?service=${booking.service_id}`}
                              className="text-xs text-teal font-medium hover:underline flex items-center gap-1"
                            >
                              <RotateCcw size={11} /> Nochmal
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {bookings.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <Calendar size={40} className="mx-auto mb-3 text-gray-200" />
                    <p className="text-sm">Noch keine Termine gebucht.</p>
                    <a href={`/${locale}/coiffeur`} className="text-teal text-sm font-medium hover:underline mt-2 inline-block">
                      Salon finden →
                    </a>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Favoriten */}
        {activeTab === "favoriten" && (
          <div className="text-center py-12 text-gray-400 text-sm">
            <p>Deine Favoriten erscheinen hier.</p>
          </div>
        )}

        {/* Nachrichten */}
        {activeTab === "nachrichten" && (
          <div>
            <a href={`/${locale}/account/messages`} className="text-teal text-sm hover:underline">
              Nachrichten öffnen →
            </a>
          </div>
        )}

        {/* Profil */}
        {activeTab === "profil" && (
          <div>
            <a href={`/${locale}/account/profil`} className="text-teal text-sm hover:underline">
              Profil bearbeiten →
            </a>
          </div>
        )}
      </div>

      {/* Cancellation modal */}
      {cancelModalBooking && (
        <CancellationModal
          booking={cancelModalBooking}
          onClose={() => setCancelModalBooking(null)}
          onConfirm={handleCancel}
        />
      )}
    </div>
  );
}
