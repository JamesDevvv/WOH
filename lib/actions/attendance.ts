"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function requireAuth() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  return session;
}

export async function markAttendance(
  memberIds: string[],
  date: string,
  serviceType: string,
  groupId?: string
) {
  await requireAuth();

  // Upsert attendance for each member on this date+serviceType
  const records = await prisma.$transaction(
    memberIds.map((memberId) =>
      prisma.attendance.upsert({
        where: {
          // We need a unique field — create a composite or just create
          id: "placeholder", // will not match
        },
        update: {},
        create: {
          memberId,
          date: new Date(date),
          serviceType,
          groupId: groupId || null,
        },
      })
    )
  );

  // Simpler approach: just create
  await prisma.attendance.createMany({
    data: memberIds.map((memberId) => ({
      memberId,
      date: new Date(date),
      serviceType,
      groupId: groupId || null,
    })),
    skipDuplicates: false,
  });

  revalidatePath("/attendance");
  return { success: true };
}

export async function getAttendanceForDate(date: string, serviceType?: string) {
  await requireAuth();

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const records = await prisma.attendance.findMany({
    where: {
      date: { gte: startOfDay, lte: endOfDay },
      ...(serviceType ? { serviceType } : {}),
    },
    include: { member: true, group: true },
    orderBy: { createdAt: "desc" },
  });

  return records;
}

export async function deleteAttendanceRecord(id: string) {
  await requireAuth();

  await prisma.attendance.delete({ where: { id } });

  revalidatePath("/attendance");
  return { success: true };
}

export async function updateAttendance(
  date: string,
  serviceType: string,
  memberIds: string[]
) {
  await requireAuth();

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Delete existing records for this date+serviceType
  await prisma.attendance.deleteMany({
    where: {
      date: { gte: startOfDay, lte: endOfDay },
      serviceType,
    },
  });

  // Create new records
  if (memberIds.length > 0) {
    await prisma.attendance.createMany({
      data: memberIds.map((memberId) => ({
        memberId,
        date: new Date(date),
        serviceType,
      })),
    });
  }

  revalidatePath("/attendance");
  return { success: true };
}

export async function getAttendanceSessions() {
  await requireAuth();

  const grouped = await prisma.attendance.groupBy({
    by: ["date", "serviceType"],
    _count: { id: true },
    orderBy: [{ date: "desc" }],
    take: 100,
  });

  return grouped.map((g) => ({
    date: g.date.toISOString().split("T")[0],
    serviceType: g.serviceType,
    count: g._count.id,
  }));
}

export async function getAttendanceSummary() {
  await requireAuth();

  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get all attendance in last 30 days grouped by date
  const records = await prisma.attendance.findMany({
    where: { date: { gte: thirtyDaysAgo } },
    orderBy: { date: "asc" },
    include: { member: true },
  });

  // Group by date
  const byDate = records.reduce(
    (acc, r) => {
      const key = r.date.toISOString().split("T")[0];
      if (!acc[key]) acc[key] = 0;
      acc[key]++;
      return acc;
    },
    {} as Record<string, number>
  );

  return { byDate, total: records.length };
}
