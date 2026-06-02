import { auth } from "@/lib/auth";
import { requireModuleAccess } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { LessonsClient } from "@/components/dashboard/LessonsClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Lessons" };

export default async function LessonsPage() {
  const session = await auth();
  await requireModuleAccess(session, "lessons");
  const [lessons, members] = await Promise.all([
    prisma.lesson.findMany({ orderBy: { order: "asc" } }),
    prisma.member.findMany({
      orderBy: { name: "asc" },
      include: {
        status: true,
        memberGroups: { include: { group: true } },
        leader: { select: { id: true, name: true } },
        _count: { select: { memberLessons: true } },
      },
    }),
  ]);

  const transformedMembers = members.map((m) => ({
    ...m,
    groups: m.memberGroups.map((mg) => mg.group),
    lessonCount: m._count.memberLessons,
  }));

  return (
    <LessonsClient
      initialLessons={lessons}
      members={transformedMembers}
    />
  );
}
