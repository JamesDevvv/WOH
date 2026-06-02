"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ─── Validation Schemas ────────────────────────────────────────────────────

const MemberSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contact: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().min(1, "Address is required"),
  invitedBy: z.string().optional(),
  statusId: z.string().optional(),
  leaderId: z.string().optional(),
  groupIds: z.array(z.string()).optional(),
  notes: z.string().optional(),
  birthdate: z.string().optional(),
  age: z.coerce.number().optional(),
  ageBracket: z.enum(["C1", "C2", "C3"]).optional(),
});

export interface BatchUploadRow {
  rowNumber: number;
  name: string;
  contact?: string;
  email?: string;
  address?: string;
  invitedBy?: string;
  statusId: string;
  leaderId?: string;
  groupIds?: string[];
  notes?: string;
  birthdate?: string;
  age?: number;
  ageBracket?: "C1" | "C2" | "C3";
  error?: string;
}

export interface BatchUploadResult {
  success: boolean;
  total: number;
  created: number;
  skipped: number;
  errors: Array<{ rowNumber: number; message: string }>;
}

// ─── Member Actions ────────────────────────────────────────────────────────

export async function createMember(data: z.infer<typeof MemberSchema>) {
  await requireAuth();
  const parsed = MemberSchema.parse(data);
  const { groupIds, ...memberData } = parsed;

  // Validate statusId is provided
  if (!memberData.statusId) {
    throw new Error("Status is required");
  }

  const member = await prisma.member.create({
    data: {
      name: memberData.name,
      contact: memberData.contact || null,
      email: memberData.email || null,
      address: memberData.address || null,
      invitedBy: memberData.invitedBy || null,
      statusId: memberData.statusId,
      leaderId: memberData.leaderId || null,
      notes: memberData.notes || null,
      birthdate: memberData.birthdate ? new Date(memberData.birthdate) : null,
      age: memberData.age || null,
      ageBracket: memberData.ageBracket || null,
      lastInteraction: new Date(),
    },
  });

  // Create member-group associations
  if (groupIds && groupIds.length > 0) {
    await prisma.memberGroup.createMany({
      data: groupIds.map((groupId) => ({
        memberId: member.id,
        groupId,
      })),
    });
  }

  revalidatePath("/growth-tracker");
  revalidatePath("/dashboard");
  return { success: true, member };
}

export async function updateMember(
  id: string,
  data: Partial<z.infer<typeof MemberSchema>>
) {
  await requireAuth();
  const { groupIds, ...memberData } = data;

  const member = await prisma.member.update({
    where: { id },
    data: {
      ...(memberData.name && { name: memberData.name }),
      ...(memberData.contact !== undefined && { contact: memberData.contact || null }),
      ...(memberData.email !== undefined && { email: memberData.email || null }),
      ...(memberData.address !== undefined && { address: memberData.address || null }),
      ...(memberData.invitedBy !== undefined && { invitedBy: memberData.invitedBy || null }),
      ...(memberData.statusId && { statusId: memberData.statusId }),
      ...(memberData.leaderId !== undefined && { leaderId: memberData.leaderId || null }),
      ...(memberData.notes !== undefined && { notes: memberData.notes || null }),
      ...(memberData.birthdate !== undefined && {
        birthdate: memberData.birthdate ? new Date(memberData.birthdate) : null,
      }),
      ...(memberData.age !== undefined && { age: memberData.age || null }),
      ...(memberData.ageBracket !== undefined && { ageBracket: memberData.ageBracket || null }),
      lastInteraction: new Date(),
    },
  });

  // Update member-group associations if groupIds provided
  if (groupIds !== undefined) {
    // Delete existing associations
    await prisma.memberGroup.deleteMany({
      where: { memberId: id },
    });

    // Create new associations
    if (groupIds.length > 0) {
      await prisma.memberGroup.createMany({
        data: groupIds.map((groupId) => ({
          memberId: id,
          groupId,
        })),
      });
    }
  }

  revalidatePath("/growth-tracker");
  return { success: true, member };
}

export async function deleteMember(id: string) {
  await requireAuth();

  await prisma.member.delete({ where: { id } });

  revalidatePath("/growth-tracker");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function batchUploadMembers(
  data: BatchUploadRow[],
  defaultStatusId: string
): Promise<BatchUploadResult> {
  await requireAuth();

  const errors: Array<{ rowNumber: number; message: string }> = [];
  let created = 0;
  let skipped = 0;

  for (const row of data) {
    try {
      // Validate required fields: name and address
      if (!row.name || !row.name.trim()) {
        errors.push({ rowNumber: row.rowNumber, message: "Name is required" });
        skipped++;
        continue;
      }

      if (!row.address || !row.address.trim()) {
        errors.push({ rowNumber: row.rowNumber, message: "Address is required" });
        skipped++;
        continue;
      }

      const statusId = row.statusId || defaultStatusId;

      // Verify status exists
      const statusExists = await prisma.status.findUnique({
        where: { id: statusId },
      });

      if (!statusExists) {
        errors.push({
          rowNumber: row.rowNumber,
          message: `Status with ID "${statusId}" not found`,
        });
        skipped++;
        continue;
      }

      // Verify leader exists if provided
      let leaderId: string | null = null;
      if (row.leaderId) {
        const leaderExists = await prisma.member.findUnique({
          where: { id: row.leaderId },
        });
        if (!leaderExists) {
          errors.push({
            rowNumber: row.rowNumber,
            message: `Leader with ID "${row.leaderId}" not found`,
          });
          skipped++;
          continue;
        }
        leaderId = row.leaderId;
      }

      // Verify groups exist if provided
      const groupIds: string[] = [];
      if (row.groupIds && row.groupIds.length > 0) {
        const groups = await prisma.group.findMany({
          where: { id: { in: row.groupIds } },
          select: { id: true },
        });

        const foundGroupIds = new Set(groups.map((g) => g.id));
        for (const gid of row.groupIds) {
          if (!foundGroupIds.has(gid)) {
            errors.push({
              rowNumber: row.rowNumber,
              message: `Group with ID "${gid}" not found`,
            });
            skipped++;
            continue;
          }
        }
        groupIds.push(...row.groupIds);
      }

      // Create member
      const member = await prisma.member.create({
        data: {
          name: row.name.trim(),
          contact: row.contact || null,
          email: row.email || null,
          address: row.address || null,
          invitedBy: row.invitedBy || null,
          statusId,
          leaderId,
          notes: row.notes || null,
          birthdate: row.birthdate ? new Date(row.birthdate) : null,
          age: row.age ? parseInt(String(row.age), 10) : null,
          ageBracket: row.ageBracket || null,
          lastInteraction: new Date(),
        },
      });

      // Create member-group associations
      if (groupIds.length > 0) {
        await prisma.memberGroup.createMany({
          data: groupIds.map((gid) => ({
            memberId: member.id,
            groupId: gid,
          })),
        });
      }

      created++;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      errors.push({ rowNumber: row.rowNumber, message: errorMsg });
      skipped++;
    }
  }

  revalidatePath("/growth-tracker");
  revalidatePath("/dashboard");
  revalidatePath("/members");

  return {
    success: errors.length === 0,
    total: data.length,
    created,
    skipped,
    errors,
  };
}

// ─── Status Actions ────────────────────────────────────────────────────────

export async function createStatus(name: string, color: string) {
  await requireAdmin();

  const status = await prisma.status.create({
    data: { name, color },
  });

  revalidatePath("/growth-tracker");
  revalidatePath("/cms/settings");
  return { success: true, status };
}

export async function updateStatus(id: string, name: string, color: string) {
  await requireAdmin();

  const status = await prisma.status.update({
    where: { id },
    data: { name, color },
  });

  revalidatePath("/growth-tracker");
  return { success: true, status };
}

export async function deleteStatus(id: string) {
  await requireAdmin();

  await prisma.status.delete({ where: { id } });

  revalidatePath("/growth-tracker");
  return { success: true };
}

// ─── Group Actions ─────────────────────────────────────────────────────────

export async function createGroup(name: string, color: string) {
  await requireAdmin();

  const group = await prisma.group.create({
    data: { name, color },
  });

  revalidatePath("/growth-tracker");
  revalidatePath("/cms/settings");
  return { success: true, group };
}

export async function updateGroup(id: string, name: string, color: string) {
  await requireAdmin();

  const group = await prisma.group.update({
    where: { id },
    data: { name, color },
  });

  revalidatePath("/growth-tracker");
  return { success: true, group };
}

export async function deleteGroup(id: string) {
  await requireAdmin();

  await prisma.group.delete({ where: { id } });

  revalidatePath("/growth-tracker");
  return { success: true };
}

// ─── Helpers ───────────────────────────────────────────────────────────────

async function requireAuth() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  return session;
}

async function requireAdmin() {
  const session = await requireAuth();
  if (session.user.role !== "ADMIN") throw new Error("Forbidden");
  return session;
}
