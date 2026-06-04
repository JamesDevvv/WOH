import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  const rows = await prisma.$queryRaw<{ key: string; value: string }[]>`SELECT key, value FROM site_settings`;
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;
  return NextResponse.json(map);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { key: string; value: string };
  if (!body.key) return NextResponse.json({ error: "key required" }, { status: 400 });

  await prisma.$executeRaw`
    INSERT INTO site_settings (key, value, "updatedAt")
    VALUES (${body.key}, ${body.value}, NOW())
    ON CONFLICT (key) DO UPDATE SET value = ${body.value}, "updatedAt" = NOW()
  `;

  return NextResponse.json({ key: body.key, value: body.value });
}
