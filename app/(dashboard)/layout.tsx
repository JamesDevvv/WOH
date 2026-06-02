import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { getAllowedModules } from "@/lib/permissions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const allowedModules = await getAllowedModules(session.user.role);

  return (
    <div className="flex h-screen overflow-hidden bg-[--muted]">
      <DashboardSidebar user={session.user} allowedModules={allowedModules} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <DashboardHeader user={session.user} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pt-[calc(3.5rem+1rem)] md:pt-6">
          {children}
        </main>
      </div>
    </div>
  );
}
