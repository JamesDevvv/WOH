"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

async function requireAuth() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  return session;
}

export async function getOrCreateAttendanceQR(date: string, serviceType: string) {
  await requireAuth();

  const existing = await prisma.attendanceQR.findFirst({
    where: { date, serviceType },
    orderBy: { createdAt: "desc" },
  });
  if (existing) return { qr: existing };

  const qr = await prisma.attendanceQR.create({
    data: { date, serviceType },
  });
  return { qr };
}

export async function toggleAttendanceQR(id: string, isActive: boolean) {
  await requireAuth();
  const qr = await prisma.attendanceQR.update({
    where: { id },
    data: { isActive },
  });
  return { qr };
}
