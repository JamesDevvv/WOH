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
  const event = await db.event.update({
    where: { id },
    data: {
      title: body.title,
      description: body.description ?? null,
      date: body.date ? new Date(body.date) : undefined,
      location: body.location ?? null,
      image: body.image ?? null,
      category: body.category ?? "General",
      published: body.published,
    },
  });
  return NextResponse.json(event);
}

export async function DELETE(_: Request, { params }: Params) {
  const session = await auth();
  const authError = requireAdminApi(session);
  if (authError) return authError;
  const { id } = await params;
  await db.event.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
