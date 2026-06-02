import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ScrollRestoration } from "@/components/ScrollRestoration";

export const metadata: Metadata = {
  title: {
    default: "Word of Hope Sta. Clara",
    template: "%s | Word of Hope Sta. Clara",
  },
  description:
    "Word of Hope Sta. Clara — Growing together in faith, love, and community.",
  keywords: ["church", "Word of Hope", "Sta. Clara", "Christian", "community"],
  icons: {
    icon: "/images/WOH-logo.png",
    apple: "/images/WOH-logo.png",
  },
  openGraph: {
    title: "Word of Hope Sta. Clara",
    description: "Growing together in faith, love, and community.",
    type: "website",
    locale: "en_PH",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[--background] text-[--foreground]">
        <ScrollRestoration />
        {children}
        <Toaster />
      </body>
    </html>
  );
}

