import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireAdminApi } from "@/lib/permissions";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  const authError = requireAdminApi(session);
  if (authError) return authError;
  const activities = await db.activity.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(activities);
}

export async function POST(req: Request) {
  const session = await auth();
  const authError = requireAdminApi(session);
  if (authError) return authError;
  const body = await req.json();
  if (!body.title || !body.schedule) {
    return NextResponse.json({ error: "title and schedule are required" }, { status: 400 });
  }
  const activity = await db.activity.create({
    data: {
      title: body.title,
      schedule: body.schedule,
      description: body.description ?? null,
      icon: body.icon ?? null,
      category: body.category ?? "General",
      order: body.order ?? 0,
    },
  });
  return NextResponse.json(activity, { status: 201 });
}
