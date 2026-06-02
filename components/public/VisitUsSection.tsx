"use client";

import { MapPin, ExternalLink } from "lucide-react";

export function VisitUsSection() {
  return (
    <section id="contact" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#0A1931] mb-3">Visit Us</h2>
          <p className="text-[#4A7FA7] text-sm">We&apos;d love to meet you</p>
        </div>

        <div className="max-w-lg mx-auto">
          {/* Map placeholder + contact info */}
          <div>
            {/* Map */}
            <div className="rounded-xl overflow-hidden h-56 mb-6 shadow-inner">
              <iframe
                src="https://maps.google.com/maps?q=14.823255,120.953802&z=17&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Word of Hope location"
              />
            </div>

            {/* Contact details */}
            <ul className="space-y-3 text-sm text-[#1A3D63]">
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#B3CFE5]/30 flex items-center justify-center shrink-0">
                  <MapPin className="h-4 w-4 text-[#4A7FA7]" />
                </div>
                <span className="mt-1">By Pass Rd., in front of Baliwag, beside 7/11, Santa Clara, Santa Maria, Philippines, 3022</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#B3CFE5]/30 flex items-center justify-center shrink-0">
                  <ExternalLink className="h-4 w-4 text-[#4A7FA7]" />
                </div>
                <a
                  href="https://www.facebook.com/WOHSTACLARA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#4A7FA7] transition-colors"
                >
                  facebook.com/WOHSTACLARA
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
