"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
  return session;
}

const ServiceTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  icon: z.string().optional(),
  order: z.number().int().optional(),
});

// Get all service types
export async function getServiceTypes() {
  return prisma.serviceType.findMany({
    orderBy: { order: "asc" },
  });
}

// Create service type
export async function createServiceType(
  data: z.infer<typeof ServiceTypeSchema>
) {
  await requireAdmin();
  const parsed = ServiceTypeSchema.parse(data);

  const serviceType = await prisma.serviceType.create({
    data: {
      name: parsed.name,
      icon: parsed.icon || null,
      order: parsed.order ?? 0,
    },
  });

  revalidatePath("/settings");
  return { success: true, serviceType };
}

// Update service type
export async function updateServiceType(
  id: string,
  data: Partial<z.infer<typeof ServiceTypeSchema>>
) {
  await requireAdmin();

  const serviceType = await prisma.serviceType.update({
    where: { id },
    data: {
      name: data.name,
      icon: data.icon,
      order: data.order,
    },
  });

  revalidatePath("/settings");
  return { success: true, serviceType };
}

// Delete service type
export async function deleteServiceType(id: string) {
  await requireAdmin();

  await prisma.serviceType.delete({ where: { id } });

  revalidatePath("/settings");
  return { success: true };
}
