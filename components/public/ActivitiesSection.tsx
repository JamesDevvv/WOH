import { Sun, Users, Baby, HandHeart, type LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Sun,
  Users,
  Baby,
  HandHeart,
};

interface Activity {
  id: string;
  title: string;
  schedule: string;
  description: string | null;
  icon: string | null;
}

export function ActivitiesSection({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) return null;

  return (
    <section id="activities" className="py-20 bg-[#F6FAFD]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#0A1931] mb-3">Our Activities</h2>
          <p className="text-[#4A7FA7] text-sm">Join us in worship and fellowship</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {activities.slice(0, 4).map((activity) => {
            const iconName = activity.icon ?? "Sun";
            const Icon = iconMap[iconName] ?? Sun;
            return (
              <div
                key={activity.id}
                className="p-6 rounded-xl bg-white border border-[#B3CFE5]/40 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-lg bg-[#B3CFE5]/30 flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-[#4A7FA7]" />
                </div>
                <h3 className="font-semibold text-[#0A1931] mb-1">{activity.title}</h3>
                <p className="text-xs text-[#1A3D63] font-medium mb-2">{activity.schedule}</p>
                {activity.description && (
                  <p className="text-sm text-[#4A7FA7] leading-relaxed">{activity.description}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

