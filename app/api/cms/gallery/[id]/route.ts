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
  const photo = await db.gallery.update({
    where: { id },
    data: {
      imageUrl: body.imageUrl,
      caption: body.caption ?? null,
      category: body.category ?? "General",
      order: body.order ?? 0,
    },
  });
  return NextResponse.json(photo);
}

export async function DELETE(_: Request, { params }: Params) {
  const session = await auth();
  const authError = requireAdminApi(session);
  if (authError) return authError;
  const { id } = await params;
  await db.gallery.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
