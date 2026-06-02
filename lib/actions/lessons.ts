"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ─── Helpers ──────────────────────────────────────────────────────────────

async function requireAuth() {
  const { auth } = await import("@/lib/auth");
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return session;
}

// ─── Lesson CRUD ──────────────────────────────────────────────────────────

const LessonSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  order: z.number().int().default(0),
});

export async function getLessons() {
  return prisma.lesson.findMany({ orderBy: { order: "asc" } });
}

export async function createLesson(data: z.infer<typeof LessonSchema>) {
  await requireAuth();
  const parsed = LessonSchema.parse(data);
  const lesson = await prisma.lesson.create({ data: parsed });
  revalidatePath("/lessons");
  return { success: true, lesson };
}

export async function updateLesson(id: string, data: Partial<z.infer<typeof LessonSchema>>) {
  await requireAuth();
  const lesson = await prisma.lesson.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description || null }),
      ...(data.order !== undefined && { order: data.order }),
    },
  });
  revalidatePath("/lessons");
  return { success: true, lesson };
}

export async function deleteLesson(id: string) {
  await requireAuth();
  await prisma.lesson.delete({ where: { id } });
  revalidatePath("/lessons");
  return { success: true };
}

// ─── Member Lesson Progress ────────────────────────────────────────────────

export async function getMemberLessons(memberId: string) {
  return prisma.memberLesson.findMany({
    where: { memberId },
    include: { lesson: true },
    orderBy: { lesson: { order: "asc" } },
  });
}

export async function toggleMemberLesson(memberId: string, lessonId: string) {
  await requireAuth();
  const existing = await prisma.memberLesson.findUnique({
    where: { memberId_lessonId: { memberId, lessonId } },
  });

  if (existing) {
    await prisma.memberLesson.delete({ where: { id: existing.id } });
    return { completed: false };
  } else {
    await prisma.memberLesson.create({
      data: { memberId, lessonId, completedAt: new Date() },
    });
    // Update lastInteraction on member
    await prisma.member.update({
      where: { id: memberId },
      data: { lastInteraction: new Date() },
    });
    return { completed: true };
  }
}
