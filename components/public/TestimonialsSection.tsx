import Image from "next/image";

interface Testimonial {
  id: string;
  name: string;
  message: string;
  image: string | null;
}

export function TestimonialsSection({ testimonials }: { testimonials: Testimonial[] }) {
  if (testimonials.length === 0) return null;

  return (
    <section id="testimonials" className="py-20 bg-[#F6FAFD]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#0A1931] mb-3">Testimonials</h2>
          <p className="text-[#4A7FA7] text-sm">What our members say</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="p-6 rounded-xl bg-white border border-[#B3CFE5]/40 shadow-sm flex flex-col"
            >
              {t.image && (
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden bg-slate-200 shrink-0">
                    <Image src={t.image} alt={t.name} fill className="object-cover" unoptimized />
                  </div>
                  <span className="font-semibold text-[#0A1931] text-sm">{t.name}</span>
                </div>
              )}
              <p className="text-sm text-[#1A3D63] leading-relaxed flex-1">
                &ldquo;{t.message}&rdquo;
              </p>
              {!t.image && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <span className="font-semibold text-[#0A1931] text-sm">{t.name}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
