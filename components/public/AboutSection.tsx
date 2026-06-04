import Image from "next/image";

interface Props { heroBg?: string; }

const pillars = [
  {
    color: "bg-amber-400",
    title: "Our Mission",
    description:
      "To share the transforming love of Jesus Christ, build a community rooted in faith, hope, and service to others.",
  },
  {
    color: "bg-blue-500",
    title: "Our Vision",
    description:
      "A thriving church where everyone discovers their purpose, grows in their faith, and makes a significant impact in the world.",
  },
  {
    color: "bg-slate-800",
    title: "Our Values",
    description:
      "Love, authenticity, community, excellence, and service guide everything we do in honor of God and others.",
  },
];

export function AboutSection({ heroBg }: Props) {
  return (
    <section id="about" className="py-20 bg-[#F6FAFD]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: text */}
          <div>
            <h2 className="text-3xl font-bold text-[#0A1931] mb-8">About Us</h2>
            <div className="space-y-6">
              {pillars.map((p) => (
                <div key={p.title} className="flex gap-4">
                  <div className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${p.color}`} />
                  <div>
                    <h3 className="font-semibold text-[#0A1931] mb-1">{p.title}</h3>
                    <p className="text-sm text-[#4A7FA7] leading-relaxed">{p.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: photo */}
          <div className="relative h-80 lg:h-96 rounded-2xl overflow-hidden shadow-lg">
            <Image
              src={heroBg ?? "/images/about-congregation.jpg"}
              alt="Word of Hope congregation"
              fill
              className="object-cover"
              priority
              unoptimized={!!(heroBg && heroBg.startsWith("http"))}
            />
            {/* fallback gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0A1931]/70 to-[#1A3D63]/50 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-16 h-16 rounded-full bg-[#4A7FA7] flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <span className="text-white font-extrabold text-xl">WH</span>
                </div>
                <p className="font-semibold text-lg">Word of Hope</p>
                <p className="text-sm text-white/80">Sta. Clara, Bulacan</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

