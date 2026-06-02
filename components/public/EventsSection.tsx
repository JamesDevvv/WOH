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

const defaultEvents: Event[] = [
  { id: "1", title: "Worship Night", date: new Date("2026-05-01"), description: "An evening of powerful worship and thanksgiving. All are welcome to join us in celebration.", image: null, category: "Worship", location: "Main Sanctuary" },
  { id: "2", title: "Youth Camp", date: new Date("2026-05-10"), description: "Three days of fun, fellowship, and spiritual growth for our youth at Camp Sinai.", image: null, category: "Youth", location: "Camp Sinai" },
  { id: "3", title: "Community Outreach", date: new Date("2026-05-17"), description: "We serve our local community through food distribution and prayer.", image: null, category: "Outreach", location: "Sta. Clara Barangay" },
];

export function EventsSection({ events }: { events: Event[] }) {
  const display = events.length > 0 ? events.slice(0, 3) : defaultEvents;

  return (
    <section id="events" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#0A1931] mb-3">Upcoming Events</h2>
          <p className="text-[#4A7FA7] text-sm">Mark your calendar and join us</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {display.map((event) => (
            <div
              key={event.id}
              className="rounded-xl overflow-hidden border border-[#B3CFE5]/40 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Image */}
              <div className="relative h-44 bg-slate-200">
                {event.image ? (
                  <Image src={event.image} alt={event.title} fill className="object-cover" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#B3CFE5] to-[#4A7FA7] flex items-center justify-center">
                    <Calendar className="h-10 w-10 text-white/60" />
                  </div>
                )}
                {/* Date badge */}
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
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

