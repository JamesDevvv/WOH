import { auth } from "@/lib/auth";
import { requireModuleAccess } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { TrainingClient } from "@/components/dashboard/TrainingClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Training Tracker" };

export default async function TrainingPage() {
  const session = await auth();
  await requireModuleAccess(session, "training");
  const [training, members] = await Promise.all([
    prisma.training.findMany({
      orderBy: { createdAt: "desc" },
      include: { member: { select: { id: true, name: true } } },
    }),
    prisma.member.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return <TrainingClient initialTraining={training} members={members} />;
}
