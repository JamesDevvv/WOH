"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "#activities", label: "Activities" },
  { href: "#about", label: "About" },
  { href: "/login", label: "Admin" },
  { href: "#contact", label: "Contact" },
];

export function PublicNav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A1931] shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-lg shrink-0">
            <Image
              src="/images/WOH-logo.png"
              alt="Word of Hope logo"
              width={36}
              height={36}
              className="rounded-full"
            />
            <span className="text-white hidden sm:block">Word of Hope</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-7">
            {navLinks.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="text-sm text-[#B3CFE5] hover:text-white font-medium transition-colors"
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden md:inline-flex items-center px-4 py-2 rounded-md bg-[#4A7FA7] hover:bg-[#1A3D63] text-white text-sm font-semibold shadow transition-colors"
            >
              Staff Login
            </Link>
            <button
              className="md:hidden p-2 rounded-lg hover:bg-[#1A3D63] transition-colors text-white"
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden border-t border-[#1A3D63] bg-[#0A1931] px-4 py-4 space-y-2">
          {navLinks.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block py-2 text-sm text-[#B3CFE5] hover:text-white font-medium"
            >
              {l.label}
            </a>
          ))}
          <Link
            href="/login"
              className="block mt-2 text-center px-4 py-2 rounded-md bg-[#4A7FA7] text-white text-sm font-semibold"
          >
            Staff Login
          </Link>
        </div>
      )}
    </nav>
  );
}
