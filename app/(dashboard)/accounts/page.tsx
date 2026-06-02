import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { AccountsClient } from "@/components/dashboard/AccountsClient";

export default async function AccountsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const users = await db.user.findMany({
    select: { id: true, name: true, email: true, image: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // Serialize dates for client
  const serialized = users.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Accounts</h1>
        <p className="text-sm text-muted-foreground">
          Manage who can access the staff portal and their roles
        </p>
      </div>
      <AccountsClient initialUsers={serialized} currentUserId={session.user.id} />
    </div>
  );
}
