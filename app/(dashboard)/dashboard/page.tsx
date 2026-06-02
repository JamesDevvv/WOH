import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  Users,
  CalendarCheck,
  Calendar,
  Music2,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatRelativeDate, getInitials } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

async function getDashboardStats() {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(now);
  monthAgo.setDate(monthAgo.getDate() - 30);
  const twoMonthsAgo = new Date(now);
  twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60);

  const [
    totalMembers,
    attendanceThisWeek,
    upcomingEvents,
    activeTrainees,
    membersThisMonth,
    membersLastMonth,
    recentMembers,
    groupStats,
    statusStats,
  ] = await Promise.all([
    prisma.member.count(),
    prisma.attendance.count({ where: { date: { gte: weekAgo } } }),
    prisma.event.count({ where: { published: true, date: { gte: now } } }),
    prisma.training.count(),
    prisma.member.count({ where: { createdAt: { gte: monthAgo } } }),
    prisma.member.count({ where: { createdAt: { gte: twoMonthsAgo, lt: monthAgo } } }),
    prisma.member.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        status: true,
        memberGroups: { include: { group: true } },
      },
    }),
    prisma.group.findMany({
      include: { _count: { select: { memberGroups: true } } },
    }),
    prisma.status.findMany({
      include: { _count: { select: { members: true } } },
    }),
  ]);

  const growthPercent =
    membersLastMonth > 0
      ? Math.round(((membersThisMonth - membersLastMonth) / membersLastMonth) * 100)
      : membersThisMonth > 0
      ? 100
      : 0;

  // Transform recent members
  const transformedRecentMembers = recentMembers.map((m) => ({
    ...m,
    groups: m.memberGroups.map((mg) => mg.group),
  }));

  return {
    totalMembers,
    attendanceThisWeek,
    upcomingEvents,
    activeTrainees,
    growthPercent,
    recentMembers: transformedRecentMembers,
    groupStats,
    statusStats,
  };
}

export default async function DashboardPage() {
  const session = await auth();
  const stats = await getDashboardStats();

  const statCards = [
    {
      label: "Total Members",
      value: stats.totalMembers,
      icon: Users,
      color: "text-blue-700",
      bg: "bg-blue-100",
      sub: `+${stats.growthPercent}% this month`,
    },
    {
      label: "Attendance This Week",
      value: stats.attendanceThisWeek,
      icon: CalendarCheck,
      color: "text-green-700",
      bg: "bg-green-100",
      sub: "Across all services",
    },
    {
      label: "Upcoming Events",
      value: stats.upcomingEvents,
      icon: Calendar,
      color: "text-amber-700",
      bg: "bg-amber-100",
      sub: "Published events",
    },
    {
      label: "Active Trainees",
      value: stats.activeTrainees,
      icon: Music2,
      color: "text-purple-700",
      bg: "bg-purple-100",
      sub: "In training program",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-[--foreground]">
          Welcome back, {session?.user?.name?.split(" ")[0] ?? "Friend"} 👋
        </h1>
        <p className="text-[--muted-foreground] text-sm mt-1">
          Here&apos;s what&apos;s happening at Word of Hope today.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-[--muted-foreground]">{s.label}</p>
                    <p className="text-3xl font-bold mt-1">{s.value}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <p className="text-xs text-[--muted-foreground]">{s.sub}</p>
                    </div>
                  </div>
                  <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${s.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Members */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Recently Added Members</CardTitle>
            <a href="/growth-tracker" className="text-xs text-blue-700 hover:underline">View all</a>
          </CardHeader>
          <CardContent className="p-0">
            {stats.recentMembers.length === 0 ? (
              <div className="px-6 pb-6 text-sm text-[--muted-foreground]">
                No members yet. Add your first member in the Growth Tracker.
              </div>
            ) : (
              <div className="divide-y divide-[--border]">
                {stats.recentMembers.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 px-6 py-3">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-semibold">
                        {getInitials(m.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.name}</p>
                      <p className="text-xs text-[--muted-foreground]">
                        {m.groups.length > 0 ? m.groups.map(g => g.name).join(", ") : "No group"} • {formatRelativeDate(m.createdAt)}
                      </p>
                    </div>
                    <Badge
                      className="text-xs shrink-0"
                      style={{
                        backgroundColor: m.status.color + "20",
                        color: m.status.color,
                        borderColor: m.status.color + "30",
                      }}
                    >
                      {m.status.name}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Group Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Group Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.groupStats.length === 0 ? (
              <p className="text-sm text-[--muted-foreground]">No groups configured yet.</p>
            ) : (
              stats.groupStats.map((g) => (
                <div key={g.id} className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: g.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="truncate">{g.name}</span>
                      <span className="text-[--muted-foreground] shrink-0 ml-2">
                        {g._count.memberGroups}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-[--secondary] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width:
                            stats.totalMembers > 0
                              ? `${(g._count.memberGroups / stats.totalMembers) * 100}%`
                              : "0%",
                          backgroundColor: g.color,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Member Status Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.statusStats.length === 0 ? (
            <p className="text-sm text-[--muted-foreground]">No statuses configured yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {stats.statusStats.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-col items-center p-4 rounded-2xl border border-[--border]"
                  style={{ borderColor: s.color + "40" }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold mb-2"
                    style={{ backgroundColor: s.color + "20", color: s.color }}
                  >
                    {s._count.members}
                  </div>
                  <p className="text-xs text-[--muted-foreground] text-center">{s.name}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
