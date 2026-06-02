import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";

type Permission = { view: boolean; create: boolean; edit: boolean; delete: boolean };

const DEFAULT_MODULES = [
  "dashboard",
  "members",
  "growth-tracker",
  "lessons",
  "attendance",
  "training",
  "cms",
  "accounts",
  "settings",
];

const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, Record<string, Permission>> = {
  ADMIN: Object.fromEntries(DEFAULT_MODULES.map((module) => [module, { view: true, create: true, edit: true, delete: true }])) as Record<string, Permission>,
  LEADER: {
    dashboard: { view: true, create: false, edit: false, delete: false },
    members: { view: true, create: true, edit: true, delete: false },
    "growth-tracker": { view: true, create: false, edit: false, delete: false },
    lessons: { view: true, create: false, edit: false, delete: false },
    attendance: { view: true, create: true, edit: true, delete: true },
    training: { view: true, create: true, edit: true, delete: true },
    cms: { view: true, create: false, edit: false, delete: false },
    accounts: { view: false, create: false, edit: false, delete: false },
    settings: { view: false, create: false, edit: false, delete: false },
  },
  VOLUNTEER: {
    dashboard: { view: true, create: false, edit: false, delete: false },
    members: { view: true, create: false, edit: false, delete: false },
    "growth-tracker": { view: false, create: false, edit: false, delete: false },
    lessons: { view: false, create: false, edit: false, delete: false },
    attendance: { view: true, create: false, edit: false, delete: false },
    training: { view: false, create: false, edit: false, delete: false },
    cms: { view: false, create: false, edit: false, delete: false },
    accounts: { view: false, create: false, edit: false, delete: false },
    settings: { view: false, create: false, edit: false, delete: false },
  },
  PENDING: Object.fromEntries(DEFAULT_MODULES.map((module) => [module, { view: false, create: false, edit: false, delete: false }])) as Record<string, Permission>,
};

async function ensurePermissions(role: UserRole) {
  const existing = await prisma.rolePermission.findMany({ where: { role } });
  if (existing.length > 0) return;

  const permissions = DEFAULT_ROLE_PERMISSIONS[role];
  await prisma.rolePermission.createMany({
    data: Object.entries(permissions).map(([module, perms]) => ({
      role,
      module,
      view: perms.view,
      create: perms.create,
      edit: perms.edit,
      delete: perms.delete,
    })),
    skipDuplicates: true,
  });
}

export async function getAllowedModules(role: UserRole) {
  await ensurePermissions(role);
  const permissions = await prisma.rolePermission.findMany({ where: { role } });
  return permissions.filter((item) => item.view).map((item) => item.module);
}

export async function hasModuleAccess(session: Session | null, module: string) {
  if (!session) return false;
  const allowed = await getAllowedModules(session.user.role);
  return allowed.includes(module);
}

export function requireAdmin(session: Session | null) {
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");
  return session;
}

export function requireAdminApi(session: Session | null) {
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return null;
}

export async function requireModuleAccess(session: Session | null, module: string) {
  if (!session) redirect("/login");
  if (!(await hasModuleAccess(session, module))) redirect("/dashboard");
  return session;
}
