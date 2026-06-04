import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile, unlink, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

async function deleteUpload(filePath: string) {
  if (!filePath || !filePath.startsWith("/uploads/")) return;
  try {
    await unlink(path.join(process.cwd(), "public", filePath));
  } catch {}
}

// POST — upload a new file, optionally delete old one
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const oldPath = formData.get("oldPath") as string | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  // Delete previous file first
  if (oldPath) await deleteUpload(oldPath);

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  if (!existsSync(uploadsDir)) await mkdir(uploadsDir, { recursive: true });

  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadsDir, filename), buffer);

  return NextResponse.json({ url: `/uploads/${filename}` });
}

// DELETE — delete a file only
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { filePath } = await req.json() as { filePath: string };
  await deleteUpload(filePath);
  return NextResponse.json({ ok: true });
}
