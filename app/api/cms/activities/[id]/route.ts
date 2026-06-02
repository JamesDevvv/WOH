import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireAdminApi } from "@/lib/permissions";
import { db } from "@/lib/db";

interface Params { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Params) {
  const session = await auth();
  const authError = requireAdminApi(session);
  if (authError) return authError;
  const { id } = await params;
  const body = await req.json();
  const activity = await db.activity.update({
    where: { id },
    data: {
      title: body.title,
      description: body.description ?? null,
      icon: body.icon ?? null,
      schedule: body.schedule,
      category: body.category ?? "General",
      order: body.order,
    },
  });
  return NextResponse.json(activity);
}

export async function DELETE(_: Request, { params }: Params) {
  const session = await auth();
  const authError = requireAdminApi(session);
  if (authError) return authError;
  const { id } = await params;
  await db.activity.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
