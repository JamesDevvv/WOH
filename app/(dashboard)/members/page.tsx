import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { MembersClient } from "@/components/dashboard/MembersClient";
import { requireModuleAccess } from "@/lib/permissions";
import type { Metadata } from "next";
import type { MemberWithRelations } from "@/types";

export const metadata: Metadata = { title: "Members" };

export default async function MembersPage() {
  const session = await auth();
  await requireModuleAccess(session, "members");

  const [members, statuses, groups] = await Promise.all([
    db.member.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        status: true,
        memberGroups: { include: { group: true } },
        leader: { select: { id: true, name: true } },
      },
    }),
    db.status.findMany({ orderBy: { name: "asc" } }),
    db.group.findMany({ orderBy: { name: "asc" } }),
  ]);

  // Transform members to match MemberWithRelations type
  const transformedMembers = members.map((m) => ({
    ...m,
    groups: m.memberGroups.map((mg) => mg.group),
  }));

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[#0A1931]">Members</h1>
        <p className="text-sm text-[--muted-foreground]">Manage church members and their information</p>
      </div>
      <MembersClient
        initialMembers={transformedMembers as MemberWithRelations[]}
        statuses={statuses}
        groups={groups}
      />
    </div>
  );
}
