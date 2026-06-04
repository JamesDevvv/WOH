import Link from "next/link";
import Image from "next/image";
import { Navigation } from "lucide-react";

interface Props {
  heroBg: string;
}

export function HeroSection({ heroBg }: Props) {
  return (
    <section className="relative h-screen max-h-screen flex items-center justify-center overflow-hidden pt-14">
      {/* Background photo */}
      <div className="absolute inset-0">
        <Image
          src={heroBg}
          alt="Hero background"
          fill
          className="object-cover object-center"
          priority
          unoptimized={heroBg.startsWith("http")}
        />
      </div>
      <div className="absolute inset-0 bg-[#0A1931]/70" />

      <div className="relative z-10 text-center text-white px-4 max-w-2xl mx-auto flex flex-col items-center">
        <div className="w-24 h-24 rounded-full overflow-hidden shadow-2xl mb-8 ring-4 ring-[#B3CFE5]/30">
          <Image src="/images/WOH-logo.png" alt="Word of Hope logo" width={96} height={96} className="object-cover w-full h-full" />
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
          Word Of Hope Sta. Clara
        </h1>

        <p className="text-lg text-slate-300 mb-8">
          A place of faith, hope, and community
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="#about"
            className="px-6 py-3 rounded-md bg-[#4A7FA7] hover:bg-[#1A3D63] text-white font-semibold text-sm shadow-lg transition-colors"
          >
            Join Us This Sunday
          </Link>
          <a
            href="#contact"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-md border border-[#B3CFE5]/50 text-[#B3CFE5] hover:bg-[#1A3D63]/60 font-semibold text-sm transition-colors"
          >
            <Navigation className="h-4 w-4" />
            Get Directions
          </a>
        </div>
      </div>
    </section>
  );
}
