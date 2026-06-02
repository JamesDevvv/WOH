import { auth } from "@/lib/auth";
import { requireModuleAccess } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { GrowthTrackerClient } from "@/components/dashboard/GrowthTrackerClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Growth Tracker" };

export default async function GrowthTrackerPage() {
  const session = await auth();
  await requireModuleAccess(session, "growth-tracker");
  const [members, statuses, groups] = await Promise.all([
    prisma.member.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        status: true,
        memberGroups: { include: { group: true } },
        leader: { select: { id: true, name: true } },
        _count: { select: { memberLessons: true } },
      },
    }),
    prisma.status.findMany({ orderBy: { order: "asc" } }),
    prisma.group.findMany({ orderBy: { name: "asc" } }),
  ]);

  // Transform members to match MemberWithRelations type
  const transformedMembers = members.map((m) => ({
    ...m,
    groups: m.memberGroups.map((mg) => mg.group),
    lessonCount: m._count.memberLessons,
  }));

  return (
    <GrowthTrackerClient
      initialMembers={transformedMembers}
      statuses={statuses}
      groups={groups}
    />
  );
}
