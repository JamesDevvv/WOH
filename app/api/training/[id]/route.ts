import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();
    const { instrument, skillLevel, progress, trainer, notes, memberId } = body;

    const record = await prisma.training.update({
      where: { id },
      data: {
        ...(memberId && { memberId }),
        ...(instrument && { instrument }),
        ...(skillLevel && { skillLevel }),
        ...(progress !== undefined && { progress: Math.min(100, Math.max(0, Number(progress))) }),
        ...(trainer !== undefined && { trainer: trainer || null }),
        ...(notes !== undefined && { notes: notes || null }),
      },
      include: { member: { select: { id: true, name: true } } },
    });

    return NextResponse.json(record);
  } catch (err) {
    console.error("Training PATCH error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    await prisma.training.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Training DELETE error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
