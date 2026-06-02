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
  const testimonial = await db.testimonial.update({
    where: { id },
    data: {
      name: body.name,
      message: body.message,
      image: body.image ?? null,
      published: body.published,
    },
  });
  return NextResponse.json(testimonial);
}

export async function DELETE(_: Request, { params }: Params) {
  const session = await auth();
  const authError = requireAdminApi(session);
  if (authError) return authError;
  const { id } = await params;
  await db.testimonial.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
