import { Metadata } from "next";
import { prisma } from "@/lib/db";
import { PublicNav } from "@/components/public/PublicNav";
import { HeroSection } from "@/components/public/HeroSection";
import { ActivitiesSection } from "@/components/public/ActivitiesSection";
import { EventsSection } from "@/components/public/EventsSection";
import { GallerySection } from "@/components/public/GallerySection";
import { TestimonialsSection } from "@/components/public/TestimonialsSection";
import { AboutSection } from "@/components/public/AboutSection";
import { VisitUsSection } from "@/components/public/VisitUsSection";
import { PublicFooter } from "@/components/public/PublicFooter";

export const metadata: Metadata = {
  title: "Word of Hope Sta. Clara",
  description:
    "Word of Hope Sta. Clara — A vibrant church community growing together in faith, love, and hope.",
};

async function getPublicData() {
  const [activities, events, gallery, testimonials] = await Promise.all([
    prisma.activity.findMany({ orderBy: { order: "asc" }, take: 6 }),
    prisma.event.findMany({
      where: { published: true, date: { gte: new Date() } },
      orderBy: { date: "asc" },
      take: 4,
    }),
    prisma.gallery.findMany({ orderBy: { order: "asc" }, take: 9 }),
    prisma.testimonial.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
  ]);
  return { activities, events, gallery, testimonials };
}

export default async function HomePage() {
  const { activities, events, gallery, testimonials } = await getPublicData();

  return (
    <main className="flex flex-col min-h-screen">
      <PublicNav />
      <HeroSection />
      <ActivitiesSection activities={activities} />
      <AboutSection />
      <EventsSection events={events} />
      <GallerySection gallery={gallery} />
      <TestimonialsSection testimonials={testimonials} />
      <VisitUsSection />
      <PublicFooter />
    </main>
  );
}
