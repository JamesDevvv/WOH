import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { memberId, instrument, skillLevel, progress, trainer, notes } = body;

    if (!memberId || !instrument) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const record = await prisma.training.create({
      data: {
        memberId,
        instrument,
        skillLevel: skillLevel ?? "BEGINNER",
        progress: Math.min(100, Math.max(0, Number(progress) || 0)),
        trainer: trainer || null,
        notes: notes || null,
      },
      include: { member: { select: { id: true, name: true } } },
    });

    return NextResponse.json(record);
  } catch (err) {
    console.error("Training POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const records = await prisma.training.findMany({
    orderBy: { createdAt: "desc" },
    include: { member: { select: { id: true, name: true } } },
  });

  return NextResponse.json(records);
}
