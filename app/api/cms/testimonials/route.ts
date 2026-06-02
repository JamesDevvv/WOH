import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireAdminApi } from "@/lib/permissions";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  const authError = requireAdminApi(session);
  if (authError) return authError;
  const testimonials = await db.testimonial.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(testimonials);
}

export async function POST(req: Request) {
  const session = await auth();
  const authError = requireAdminApi(session);
  if (authError) return authError;
  const body = await req.json();
  const testimonial = await db.testimonial.create({
    data: {
      name: body.name,
      message: body.message,
      image: body.image ?? null,
      published: body.published ?? false,
    },
  });
  return NextResponse.json(testimonial, { status: 201 });
}
