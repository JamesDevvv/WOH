"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { UserRole } from "@prisma/client";

type Permission = { view: boolean; create: boolean; edit: boolean; delete: boolean };

export interface RoleSetting {
  id: UserRole;
  name: string;
  description: string;
  permissions: Record<string, Permission>;
}

const MODULES = [
  "members",
  "attendance",
  "training",
  "growth-tracker",
  "cms",
  "settings",
];

const DEFAULT_ROLES: RoleSetting[] = [
  {
    id: "ADMIN",
    name: "Admin",
    description: "Full access to all modules",
    permissions: Object.fromEntries(MODULES.map((module) => [module, { view: true, create: true, edit: true, delete: true }])),
  },
  {
    id: "LEADER",
    name: "Staff",
    description: "Can manage members, attendance, and training",
    permissions: {
      members: { view: true, create: true, edit: true, delete: false },
      attendance: { view: true, create: true, edit: true, delete: true },
      training: { view: true, create: true, edit: true, delete: true },
      "growth-tracker": { view: true, create: false, edit: false, delete: false },
      cms: { view: true, create: true, edit: true, delete: false },
      settings: { view: true, create: false, edit: false, delete: false },
    },
  },
  {
    id: "VOLUNTEER",
    name: "Volunteer",
    description: "View-only access",
    permissions: Object.fromEntries(MODULES.map((module) => [module, { view: true, create: false, edit: false, delete: false }])) as Record<string, Permission>,
  },
  {
    id: "PENDING",
    name: "Pending",
    description: "Pending approval",
    permissions: Object.fromEntries(MODULES.map((module) => [module, { view: false, create: false, edit: false, delete: false }])) as Record<string, Permission>,
  },
];

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }
  return session;
}

async function ensureDefaultRoleSettings() {
  const existingSettings = await prisma.roleSetting.findMany();
  const existingRoles = new Set(existingSettings.map((setting) => setting.role));
  await Promise.all(DEFAULT_ROLES.map(async (role) => {
    if (!existingRoles.has(role.id)) {
      await prisma.roleSetting.create({
        data: {
          role: role.id,
          name: role.name,
          description: role.description,
        },
      });
    }
  }));

  const existingPermissions = await prisma.rolePermission.findMany();
  const permissionKeys = new Set(existingPermissions.map((item) => `${item.role}:${item.module}`));
  await Promise.all(DEFAULT_ROLES.flatMap((role) =>
    Object.entries(role.permissions).map(([module, perms]) => {
      const key = `${role.id}:${module}`;
      if (!permissionKeys.has(key)) {
        return prisma.rolePermission.create({
          data: {
            role: role.id,
            module,
            view: perms.view,
            create: perms.create,
            edit: perms.edit,
            delete: perms.delete,
          },
        });
      }
      return Promise.resolve();
    })
  ));
}

export async function getRoleSettings() {
  await ensureDefaultRoleSettings();

  const [roles, permissions] = await Promise.all([
    prisma.roleSetting.findMany({ orderBy: { role: "asc" } }),
    prisma.rolePermission.findMany({ orderBy: [{ role: "asc" }, { module: "asc" }] }),
  ]);

  const permissionMap: Record<UserRole, Record<string, Permission>> = {
    ADMIN: {},
    LEADER: {},
    VOLUNTEER: {},
    PENDING: {},
  };

  permissions.forEach((item) => {
    permissionMap[item.role][item.module] = {
      view: item.view,
      create: item.create,
      edit: item.edit,
      delete: item.delete,
    };
  });

  return roles.map((role) => ({
    id: role.role,
    name: role.name,
    description: role.description ?? "",
    permissions: {
      ...Object.fromEntries(MODULES.map((module) => [module, permissionMap[role.role][module] ?? { view: false, create: false, edit: false, delete: false }])),
    },
  }));
}

export async function saveRoleSettings(roles: RoleSetting[]) {
  await requireAdmin();

  await Promise.all(roles.map(async (role) => {
    await prisma.roleSetting.upsert({
      where: { role: role.id },
      update: {
        name: role.name,
        description: role.description,
      },
      create: {
        role: role.id,
        name: role.name,
        description: role.description,
      },
    });

    await Promise.all(Object.entries(role.permissions).map(([module, perms]) =>
      prisma.rolePermission.upsert({
        where: { role_module_unique: { role: role.id, module } },
        update: {
          view: perms.view,
          create: perms.create,
          edit: perms.edit,
          delete: perms.delete,
        },
        create: {
          role: role.id,
          module,
          view: perms.view,
          create: perms.create,
          edit: perms.edit,
          delete: perms.delete,
        },
      })
    ));
  }));

  revalidatePath("/dashboard");
  revalidatePath("/cms/settings");
  return { success: true };
}
