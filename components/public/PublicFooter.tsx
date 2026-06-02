import Link from "next/link";
import Image from "next/image";

const quickLinks = [
  { href: "/", label: "Home" },
  { href: "#about", label: "About" },
  { href: "/login", label: "Admin" },
  { href: "#events", label: "Events" },
  { href: "#contact", label: "Contact" },
];

const ministries = [
  { href: "#", label: "Apply" },
  { href: "#events", label: "Events" },
  { href: "#activities", label: "Children" },
  { href: "#activities", label: "Youth" },
  { href: "/login", label: "Staff Portal" },
];

export function PublicFooter() {
  return (
    <footer className="bg-[#0A1931] text-[#B3CFE5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-full overflow-hidden shadow">
                <Image src="/images/WOH-logo.png" alt="Word of Hope logo" width={36} height={36} className="object-cover w-full h-full" />
              </div>
              <span className="font-bold text-white text-base">Word Of Hope</span>
            </div>
            <p className="text-sm leading-relaxed">
              Building a community of faith, hope, and love.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white text-sm mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Ministries */}
          <div>
            <h3 className="font-semibold text-white text-sm mb-4">Ministries</h3>
            <ul className="space-y-2">
              {ministries.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-white text-sm mb-4">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li>By Pass Rd., in front of Baliwag, beside 7/11, Santa Clara, Santa Maria, Philippines, 3022</li>
              <li>
                <a
                  href="https://www.facebook.com/WOHSTACLARA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  facebook.com/WOHSTACLARA
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#1A3D63] mt-12 pt-6 text-center text-xs text-[#B3CFE5]/60">
          © {new Date().getFullYear()} Word of Hope Sta. Clara. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

