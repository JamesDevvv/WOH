import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { SettingsClient } from "@/components/dashboard/SettingsClient";
import { getServiceTypes } from "@/lib/actions/service-types";
import { getRoleSettings } from "@/lib/actions/roles";

export default async function SettingsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const [statuses, groups, serviceTypes, roles] = await Promise.all([
    db.status.findMany({ orderBy: { name: "asc" } }),
    db.group.findMany({ orderBy: { name: "asc" } }),
    getServiceTypes(),
    getRoleSettings(),
  ]);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage member statuses, groups, service types, and role permissions</p>
      </div>
      <SettingsClient initialStatuses={statuses} initialGroups={groups} initialServiceTypes={serviceTypes} initialRoles={roles} />
    </div>
  );
}
