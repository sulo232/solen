"use client";

interface Testimonial {
  quote: string;
  name: string;
  city: string;
  rating: number;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote: "Endlich eine App wo ich alle Salons vergleichen kann!",
    name: "Mira S.",
    city: "Basel",
    rating: 5,
  },
  {
    quote: "Ich habe meinen Lieblingssalon durch Solen gefunden.",
    name: "Anna K.",
    city: "Zürich",
    rating: 5,
  },
  {
    quote: "Super einfach zu buchen, immer aktuelle Verfügbarkeit.",
    name: "Lisa M.",
    city: "Bern",
    rating: 5,
  },
  {
    quote: "Die beste Salon-Plattform der Schweiz!",
    name: "Julia T.",
    city: "Basel",
    rating: 5,
  },
  {
    quote: "Termine buchen war noch nie so schnell und unkompliziert.",
    name: "Sophie R.",
    city: "Luzern",
    rating: 5,
  },
  {
    quote: "Preise vergleichen, Bewertungen lesen, direkt buchen — alles in einer App.",
    name: "Nina W.",
    city: "Zürich",
    rating: 5,
  },
  {
    quote: "Meine Kollegin hat mir Solen empfohlen — jetzt benutze ich nichts anderes mehr.",
    name: "Elena P.",
    city: "Winterthur",
    rating: 5,
  },
  {
    quote: "Sogar Last-Minute Angebote mit Rabatt gefunden. Mega!",
    name: "Lea F.",
    city: "Basel",
    rating: 5,
  },
];

export default function TestimonialCarousel() {
  return (
    <section className="px-5 md:px-6 lg:px-10 xl:px-20 py-12 border-t border-s-ink/[0.08]">
      <h2 className="font-heading font-semibold text-[22px] text-s-ink mb-8 text-center">
        Was unsere Nutzer sagen
      </h2>

      <div className="overflow-hidden">
        <div className="flex gap-6 testimonial-scroll">
          {[...TESTIMONIALS, ...TESTIMONIALS].map((testimonial, idx) => (
            <div
              key={idx}
              className="flex-shrink-0 w-[300px] bg-white border border-s-ink/[0.08] rounded-[16px] p-6"
            >
              <p className="font-body text-[15px] text-s-ink mb-4 leading-relaxed">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-body font-semibold text-[14px] text-s-ink">
                    {testimonial.name}
                  </p>
                  <p className="font-body text-[13px] text-[#6A6A6A]">
                    {testimonial.city}
                  </p>
                </div>
                <div className="flex gap-0.5">
                  {Array(testimonial.rating).fill(null).map((_, i) => (
                    <span key={i} className="text-[#E8624A]">★</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
