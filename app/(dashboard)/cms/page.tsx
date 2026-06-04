import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/permissions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventsCMS } from "@/components/dashboard/cms/EventsCMS";
import { ActivitiesCMS } from "@/components/dashboard/cms/ActivitiesCMS";
import { GalleryCMS } from "@/components/dashboard/cms/GalleryCMS";
import { TestimonialsCMS } from "@/components/dashboard/cms/TestimonialsCMS";
import { HeroCMS } from "@/components/dashboard/cms/HeroCMS";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "CMS" };

export default async function CMSPage() {
  const session = await auth();
  requireAdmin(session);

  const [events, activities, gallery, testimonials, heroBgRaw] = await Promise.all([
    prisma.event.findMany({ orderBy: { date: "desc" } }),
    prisma.activity.findMany({ orderBy: { order: "asc" } }),
    prisma.gallery.findMany({ orderBy: { order: "asc" } }),
    prisma.testimonial.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.$queryRaw<{ value: string }[]>`SELECT value FROM site_settings WHERE key = 'hero_bg' LIMIT 1`.catch(() => []),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[--foreground]">Content Management</h1>
        <p className="text-sm text-[--muted-foreground] mt-1">
          Manage public-facing content for the church website
        </p>
      </div>

      <Tabs defaultValue="events" className="w-full">
        <TabsList className="grid grid-cols-5 w-full sm:w-auto sm:inline-grid">
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
          <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
          <TabsTrigger value="website">Website</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="mt-6">
          <EventsCMS initialEvents={events} />
        </TabsContent>
        <TabsContent value="activities" className="mt-6">
          <ActivitiesCMS initialActivities={activities} />
        </TabsContent>
        <TabsContent value="gallery" className="mt-6">
          <GalleryCMS initialGallery={gallery} />
        </TabsContent>
        <TabsContent value="testimonials" className="mt-6">
          <TestimonialsCMS initialTestimonials={testimonials} />
        </TabsContent>
        <TabsContent value="website" className="mt-6">
          <HeroCMS initialHeroBg={(heroBgRaw as { value: string }[])[0]?.value ?? null} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
