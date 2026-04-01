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
];

export default function TestimonialCarousel() {
  return (
    <section className="px-5 md:px-6 lg:px-10 xl:px-20 py-12 border-t border-[#EBEBEB]">
      <h2 className="font-heading font-semibold text-[22px] text-[#222222] mb-8 text-center">
        Was unsere Nutzer sagen
      </h2>

      <div className="overflow-hidden">
        <div className="flex gap-6 animate-scroll">
          {[...TESTIMONIALS, ...TESTIMONIALS].map((testimonial, idx) => (
            <div
              key={idx}
              className="flex-shrink-0 w-[300px] bg-white border border-[#EBEBEB] rounded-[16px] p-6"
            >
              <p className="font-body text-[15px] text-[#222222] mb-4 leading-relaxed">
                "{testimonial.quote}"
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-body font-semibold text-[14px] text-[#222222]">
                    {testimonial.name}
                  </p>
                  <p className="font-body text-[13px] text-[#6A6A6A]">
                    {testimonial.city}
                  </p>
                </div>
                <div className="flex gap-0.5">
                  {Array(testimonial.rating).fill(null).map((_, i) => (
                    <span key={i} className="text-s-coral">★</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}
