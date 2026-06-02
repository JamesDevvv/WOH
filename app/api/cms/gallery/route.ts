import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireAdminApi } from "@/lib/permissions";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  const authError = requireAdminApi(session);
  if (authError) return authError;
  const gallery = await db.gallery.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(gallery);
}
export async function POST(req: Request) {
  const session = await auth();
  const authError = requireAdminApi(session);
  if (authError) return authError;
  const body = await req.json();
  if (!body.imageUrl) {
    return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });
  }
  const photo = await db.gallery.create({
    data: {
      imageUrl: body.imageUrl,
      caption: body.caption ?? null,
      category: body.category ?? "General",
      order: body.order ?? 0,
    },
  });
  return NextResponse.json(photo, { status: 201 });
}
