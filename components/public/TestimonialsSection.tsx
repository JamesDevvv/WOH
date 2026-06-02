interface Testimonial {
  id: string;
  name: string;
  message: string;
  image: string | null;
}

export function TestimonialsSection({
  testimonials,
}: {
  testimonials: Testimonial[];
}) {
  const defaults: Testimonial[] = [
    { id: "1", name: "Maria Santos", message: "Finding Word of Hope has been a blessing. The community here has helped me grow in my faith and find purpose.", image: null },
    { id: "2", name: "Julie Cruz", message: "The youth ministry here has been transformative for my teenage daughter. She's found great friends who mentor her.", image: null },
    { id: "3", name: "Bruno Myers", message: "I have never felt so welcoming and genuine from anyone. This church feels like family!", image: null },
  ];

  const display = testimonials.length > 0 ? testimonials.slice(0, 3) : defaults;

  return (
    <section id="testimonials" className="py-20 bg-[#F6FAFD]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#0A1931] mb-3">Testimonials</h2>
          <p className="text-[#4A7FA7] text-sm">What our members say</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {display.map((t) => (
            <div
              key={t.id}
              className="p-6 rounded-xl bg-white border border-[#B3CFE5]/40 shadow-sm flex flex-col justify-between"
            >
              <p className="text-sm text-[#1A3D63] leading-relaxed mb-6">
                &ldquo;{t.message}&rdquo;
              </p>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#0A1931] text-sm">{t.name}</span>
                <button className="text-xs text-[#4A7FA7] hover:text-[#1A3D63] font-medium transition-colors">
                  Show More
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

