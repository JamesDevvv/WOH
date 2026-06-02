import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { UserRole } from "@prisma/client";

// PATCH /api/accounts/[id] — update role
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { role } = await req.json() as { role: UserRole };

  const validRoles: UserRole[] = ["ADMIN", "LEADER", "VOLUNTEER", "PENDING"];
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const user = await db.user.update({
    where: { id },
    data: { role },
    select: { id: true, name: true, email: true, image: true, role: true, createdAt: true },
  });

  return NextResponse.json(user);
}

// DELETE /api/accounts/[id] — revoke access
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  // Prevent self-deletion
  if (session.user.id === id) {
    return NextResponse.json({ error: "Cannot remove your own account" }, { status: 400 });
  }

  await db.user.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
}
