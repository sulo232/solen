'use client';

import React, { useState, useEffect, lazy, Suspense } from "react";
import { MapPin, Phone, Star, Clock, Instagram, ChevronDown, ChevronUp } from "lucide-react";
import { BookingCalendar } from "../components/BookingCalendar";
import { Spinner } from "../components/ui/Spinner";
import type { Salon, StaffMember, Service, Review } from "../lib/types";

interface SalonProfilePageProps {
  slug: string;
  preSelectedServiceId?: string;
  preSelectedSlotId?: string;
  locale?: string;
}

export function SalonProfilePage({ slug, preSelectedServiceId, preSelectedSlotId, locale = "de" }: SalonProfilePageProps) {
  const [salon, setSalon] = useState<Salon | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState(preSelectedServiceId);
  const [selectedStaffId, setSelectedStaffId] = useState<string | undefined>();
  const [activePhoto, setActivePhoto] = useState(0);
  const [hoursOpen, setHoursOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [bookedId, setBookedId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/salons/${slug}`).then((r) => r.json()),
      fetch(`/api/salons/${slug}/staff`).then((r) => r.json()),
      fetch(`/api/salons/${slug}/services`).then((r) => r.json()),
    ])
      .then(([salonData, staffData, servicesData]: [Salon, StaffMember[], Service[]]) => {
        setSalon(salonData);
        setStaff(staffData ?? []);
        setServices(servicesData ?? []);
        document.title = `${salonData.name} | Termin buchen | solen.ch`;
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));

    fetch(`/api/reviews/salon/${slug}?limit=10`)
      .then((r) => r.json())
      .then((data: Review[]) => setReviews(data ?? []))
      .catch(() => {});
  }, [slug]);

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen"><Spinner size={40} /></div>;
  }

  if (!salon) {
    return <div className="text-center py-20 text-gray-400">Salon nicht gefunden.</div>;
  }

  const initials = salon.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const photos = salon.photos?.length ? salon.photos : salon.cover_photo_url ? [salon.cover_photo_url] : [];
  const groupedServices: Record<string, Service[]> = {};
  services.forEach((s) => {
    if (!groupedServices[s.category]) groupedServices[s.category] = [];
    groupedServices[s.category].push(s);
  });

  const ratingBreakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length,
    pct: reviews.length ? Math.round((reviews.filter((r) => Math.round(r.rating) === star).length / reviews.length) * 100) : 0,
  }));

  if (bookedId) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-teal/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✓</span>
          </div>
          <h2 className="font-heading font-bold text-2xl text-dark mb-2">Termin bestätigt!</h2>
          <p className="text-gray-500 text-sm mb-4">Buchungs-ID: {bookedId}</p>
          <a href={`/${locale}/account`} className="text-teal font-medium hover:underline">
            Meine Termine anzeigen →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Photo gallery */}
      <div className="relative h-56 md:h-80 bg-gradient-to-br from-teal/20 to-teal/5 overflow-hidden">
        {photos.length > 0 ? (
          <>
            <img
              src={photos[activePhoto]}
              alt={salon.name}
              className="w-full h-full object-cover"
            />
            {photos.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActivePhoto(i)}
                    className={`w-2 h-2 rounded-full transition-colors ${i === activePhoto ? "bg-white" : "bg-white/50"}`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-heading font-bold text-5xl text-teal/40">{initials}</span>
          </div>
        )}
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-4 pb-16">
        {/* Info header */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-3">
            <h1 className="font-heading font-bold text-2xl text-dark">{salon.name}</h1>
            {salon.instagram && (
              <a href={`https://instagram.com/${salon.instagram}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-dark">
                <Instagram size={20} />
              </a>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-2">
            <div className="flex items-center gap-1">
              <Star size={14} className="text-amber-400 fill-amber-400" />
              <span className="font-data font-bold text-sm text-dark">{salon.rating.toFixed(1)}</span>
              <span className="text-xs text-gray-400">({salon.review_count} Bewertungen)</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin size={12} className="text-teal" />
              <a href={`https://maps.google.com/search/${encodeURIComponent(salon.address)}`} target="_blank" rel="noopener noreferrer" className="hover:text-teal">
                {salon.quartier} · {salon.address}
              </a>
            </div>
          </div>

          {/* Category pills */}
          <div className="flex gap-2 mt-2 flex-wrap">
            {salon.categories.map((cat) => (
              <span key={cat} className="text-xs bg-teal/10 text-teal px-2.5 py-1 rounded-pill font-medium capitalize">
                {cat}
              </span>
            ))}
          </div>

          {/* Phone */}
          {salon.phone && (
            <div className="mt-2">
              <a href={`tel:${salon.phone}`} className="flex items-center gap-1.5 text-sm text-teal hover:underline">
                <Phone size={14} /> {salon.phone}
              </a>
            </div>
          )}

          {/* Opening hours accordion */}
          {salon.opening_hours && (
            <div className="mt-3">
              <button
                onClick={() => setHoursOpen((v) => !v)}
                className="flex items-center gap-1.5 text-sm font-medium text-dark"
              >
                <Clock size={14} className="text-teal" />
                Öffnungszeiten
                {hoursOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {hoursOpen && (
                <div className="mt-2 text-xs text-gray-600 space-y-1 pl-5">
                  {Object.entries(salon.opening_hours).map(([day, hours]) => (
                    <div key={day} className="flex justify-between">
                      <span className="font-medium">{day}</span>
                      <span>{hours ? `${hours.open} – ${hours.close}` : "Geschlossen"}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Staff section */}
        {staff.length > 0 && (
          <section className="mb-6">
            <h2 className="font-heading font-semibold text-dark text-base mb-3">Unser Team</h2>
            <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1">
              <button
                onClick={() => setSelectedStaffId(undefined)}
                className={`flex-shrink-0 flex flex-col items-center gap-1.5 p-3 rounded-card border transition-colors ${!selectedStaffId ? "border-teal bg-teal/5" : "border-gray-200 hover:border-teal/50"}`}
              >
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500">Kein Wunsch</div>
              </button>
              {staff.map((member) => (
                <button
                  key={member.id}
                  onClick={() => setSelectedStaffId(member.id)}
                  className={`flex-shrink-0 flex flex-col items-center gap-1.5 p-3 rounded-card border transition-colors ${selectedStaffId === member.id ? "border-teal bg-teal/5" : "border-gray-200 hover:border-teal/50"}`}
                >
                  {member.photo_url ? (
                    <img src={member.photo_url} alt={member.name} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-teal/20 flex items-center justify-center font-bold text-teal">
                      {member.name[0]}
                    </div>
                  )}
                  <span className="text-xs font-medium text-dark">{member.name}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Services */}
        {Object.keys(groupedServices).length > 0 && (
          <section className="mb-6">
            <h2 className="font-heading font-semibold text-dark text-base mb-3">Services</h2>
            {Object.entries(groupedServices).map(([category, catServices]) => (
              <div key={category} className="mb-4">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2 capitalize">{category}</p>
                <div className="flex flex-col divide-y divide-gray-50">
                  {catServices.map((service) => (
                    <div key={service.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-medium text-dark">{service.name}</p>
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-pill font-data mt-0.5 inline-block">
                          {service.duration_minutes} Min.
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-data font-semibold text-sm text-dark">CHF {service.price}</span>
                        <button
                          onClick={() => {
                            setSelectedServiceId(service.id);
                            document.getElementById("booking-calendar")?.scrollIntoView({ behavior: "smooth" });
                          }}
                          className="px-3 py-1.5 bg-teal text-white text-xs font-semibold rounded-btn hover:bg-teal/90 transition-colors"
                        >
                          Buchen
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Booking Calendar */}
        <section id="booking-calendar" className="mb-6 scroll-mt-20">
          <h2 className="font-heading font-semibold text-dark text-base mb-3">Termin buchen</h2>
          <BookingCalendar
            salonId={salon.id}
            serviceId={selectedServiceId}
            staffMemberId={selectedStaffId}
            slotId={preSelectedSlotId}
            salonSlug={salon.slug}
            onBooked={(id) => setBookedId(id)}
          />
        </section>

        {/* Reviews */}
        {reviews.length > 0 && (
          <section className="mb-6">
            <h2 className="font-heading font-semibold text-dark text-base mb-4">Bewertungen</h2>
            <div className="mb-4">
              {ratingBreakdown.map(({ star, count, pct }) => (
                <div key={star} className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-data text-gray-500 w-4">{star}</span>
                  <span className="text-xs text-amber-400">★</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-gray-400 w-5 text-right">{count}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-4">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-50 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-full bg-teal/20 flex items-center justify-center text-teal font-bold text-sm">
                      {review.display_name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-dark">{review.display_name}</p>
                      <div className="flex">
                        {Array.from({ length: 5 }, (_, i) => (
                          <span key={i} className={`text-xs ${i < review.rating ? "text-amber-400" : "text-gray-200"}`}>★</span>
                        ))}
                      </div>
                    </div>
                    <span className="ml-auto text-xs text-gray-400">
                      {new Date(review.created_at).toLocaleDateString("de-CH")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{review.text}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Mini map placeholder */}
        <section>
          <div className="h-32 bg-teal/5 rounded-card flex items-center justify-center text-sm text-gray-400">
            Standort: {salon.address}
            <a
              href={`https://maps.google.com/search/${encodeURIComponent(salon.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 text-teal underline"
            >
              In Google Maps öffnen
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
