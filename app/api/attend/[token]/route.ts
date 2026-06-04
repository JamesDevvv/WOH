import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const qr = await prisma.attendanceQR.findUnique({ where: { token } });
  if (!qr) return NextResponse.json({ error: "Invalid QR code" }, { status: 404 });
  if (!qr.isActive) return NextResponse.json({ error: "This QR code is no longer active" }, { status: 410 });
  if (qr.expiresAt && new Date() > qr.expiresAt)
    return NextResponse.json({ error: "This QR code has expired" }, { status: 410 });

  const [members, statuses] = await Promise.all([
    prisma.member.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.status.findMany({ orderBy: { order: "asc" }, select: { id: true, name: true } }),
  ]);

  return NextResponse.json({ session: { date: qr.date, serviceType: qr.serviceType }, members, statuses });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const qr = await prisma.attendanceQR.findUnique({ where: { token } });
  if (!qr) return NextResponse.json({ error: "Invalid QR code" }, { status: 404 });
  if (!qr.isActive) return NextResponse.json({ error: "This QR code is no longer active" }, { status: 410 });

  const body = await req.json();

  // ── Register new member + check in ──────────────────────────────────────────
  if (body.action === "register") {
    const { name, contact, age, ageBracket, address, statusId } = body as {
      name: string;
      contact?: string;
      age?: number;
      ageBracket?: string;
      address: string;
      statusId: string;
    };

    if (!name?.trim() || !address?.trim() || !statusId)
      return NextResponse.json({ error: "Name, address, and status are required" }, { status: 400 });

    const member = await prisma.member.create({
      data: {
        name: name.trim(),
        contact: contact?.trim() || null,
        age: age || null,
        ageBracket: (ageBracket as "C1" | "C2" | "C3") || null,
        address: address.trim(),
        statusId,
        lastInteraction: new Date(),
      },
    });

    await prisma.attendance.create({
      data: {
        memberId: member.id,
        date: new Date(qr.date + "T00:00:00"),
        serviceType: qr.serviceType,
      },
    });

    return NextResponse.json({ success: true, memberName: member.name, memberId: member.id, registered: true });
  }

  // ── Existing member check in ─────────────────────────────────────────────────
  const { memberId } = body as { memberId: string };
  if (!memberId) return NextResponse.json({ error: "memberId required" }, { status: 400 });

  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  const startOfDay = new Date(qr.date + "T00:00:00");
  const endOfDay = new Date(qr.date + "T23:59:59.999");

  const existing = await prisma.attendance.findFirst({
    where: { memberId, date: { gte: startOfDay, lte: endOfDay }, serviceType: qr.serviceType },
  });

  if (existing) {
    return NextResponse.json({ alreadyMarked: true, memberName: member.name });
  }

  await prisma.attendance.create({
    data: { memberId, date: new Date(qr.date + "T00:00:00"), serviceType: qr.serviceType },
  });

  return NextResponse.json({ success: true, memberName: member.name });
}
