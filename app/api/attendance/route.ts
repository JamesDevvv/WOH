import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { memberIds, date, serviceType, groupId } = body;

    if (!Array.isArray(memberIds) || !date || !serviceType) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const validIds = memberIds.filter((id): id is string => typeof id === "string");

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Delete existing records for this date + serviceType to avoid duplicates
    await prisma.attendance.deleteMany({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
        serviceType,
      },
    });

    await prisma.attendance.createMany({
      data: validIds.map((memberId: string) => ({
        memberId,
        date: new Date(date),
        serviceType,
        groupId: groupId ?? null,
      })),
    });

    return NextResponse.json({ success: true, count: validIds.length });
  } catch (err) {
    console.error("Attendance API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");

  if (!date) {
    return NextResponse.json({ error: "Date required" }, { status: 400 });
  }

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const records = await prisma.attendance.findMany({
    where: { date: { gte: startOfDay, lte: endOfDay } },
    include: { member: { select: { id: true, name: true } } },
  });

  return NextResponse.json(records);
}
