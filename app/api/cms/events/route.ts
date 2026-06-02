import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireAdminApi } from "@/lib/permissions";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  const authError = requireAdminApi(session);
  if (authError) return authError;
  const events = await db.event.findMany({ orderBy: { date: "asc" } });
  return NextResponse.json(events);
}

export async function POST(req: Request) {
  const session = await auth();
  const authError = requireAdminApi(session);
  if (authError) return authError;
  const body = await req.json();
  if (!body.title || !body.date) {
    return NextResponse.json({ error: "title and date are required" }, { status: 400 });
  }
  const event = await db.event.create({
    data: {
      title: body.title,
      description: body.description ?? null,
      date: new Date(body.date),
      location: body.location ?? null,
      image: body.image ?? null,
      category: body.category ?? "General",
      published: body.published ?? false,
    },
  });
  return NextResponse.json(event, { status: 201 });
}
