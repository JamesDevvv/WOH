import { Calendar } from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";

interface Event {
  id: string;
  title: string;
  date: Date;
  description: string | null;
  image: string | null;
  category: string;
  location: string | null;
}

export function EventsSection({ events }: { events: Event[] }) {
  return (
    <section id="events" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#0A1931] mb-3">Upcoming Events</h2>
          <p className="text-[#4A7FA7] text-sm">Mark your calendar and join us</p>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-12 text-[#4A7FA7]">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No upcoming events at the moment. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {events.map((event) => (
              <div
                key={event.id}
                className="rounded-xl overflow-hidden border border-[#B3CFE5]/40 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Image */}
                <div className="relative h-44 bg-slate-200">
                  {event.image ? (
                    <Image src={event.image} alt={event.title} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#B3CFE5] to-[#4A7FA7] flex items-center justify-center">
                      <Calendar className="h-10 w-10 text-white/60" />
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3">
                    <span className="px-2.5 py-1 rounded text-xs font-semibold bg-[#4A7FA7] text-white shadow">
                      {format(new Date(event.date), "MMM d yyyy")}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="font-semibold text-[#0A1931] mb-2">{event.title}</h3>
                  {event.description && (
                    <p className="text-sm text-[#4A7FA7] leading-relaxed line-clamp-3">
                      {event.description}
                    </p>
                  )}
                  {event.location && (
                    <p className="text-xs text-[#4A7FA7]/70 mt-2">📍 {event.location}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
