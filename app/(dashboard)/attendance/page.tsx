import { auth } from "@/lib/auth";
import { requireModuleAccess } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { AttendanceClient } from "@/components/dashboard/AttendanceClient";
import { getAttendanceSessions } from "@/lib/actions/attendance";
import { getServiceTypes } from "@/lib/actions/service-types";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Attendance" };

export default async function AttendancePage() {
  const session = await auth();
  await requireModuleAccess(session, "attendance");
  const [members, groups, statuses, sessions, serviceTypes] = await Promise.all([
    prisma.member.findMany({
      orderBy: { name: "asc" },
      include: {
        memberGroups: { include: { group: { select: { id: true } } } },
      },
    }),
    prisma.group.findMany({ orderBy: { name: "asc" } }),
    prisma.status.findMany({ orderBy: { order: "asc" } }),
    getAttendanceSessions(),
    getServiceTypes(),
  ]);

  // Transform members: use first group if multiple, or null
  const transformedMembers = members.map((m) => ({
    id: m.id,
    name: m.name,
    groupId: m.memberGroups[0]?.group.id ?? null,
  }));

  return (
    <AttendanceClient
      members={transformedMembers}
      groups={groups}
      statuses={statuses}
      sessions={sessions}
      serviceTypes={serviceTypes}
    />
  );
}
