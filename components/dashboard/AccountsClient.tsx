"use client";

import { useState, useTransition } from "react";
import {
  ShieldCheck, Trash2, Loader2, Mail, Crown, User, Users, UserPlus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import type { UserRole } from "@prisma/client";

interface AccountUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: UserRole;
  createdAt: string;
}

interface Props {
  initialUsers: AccountUser[];
  currentUserId: string;
}

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  ADMIN:     { label: "Admin",     color: "bg-red-100 text-red-700 border-red-200",     icon: Crown },
  LEADER:    { label: "Leader",    color: "bg-purple-100 text-purple-700 border-purple-200", icon: ShieldCheck },
  VOLUNTEER: { label: "Volunteer", color: "bg-blue-100 text-blue-700 border-blue-200",  icon: User },
  PENDING:   { label: "Pending",   color: "bg-amber-100 text-amber-700 border-amber-200", icon: UserPlus },
};

export function AccountsClient({ initialUsers, currentUserId }: Props) {
  const { toast } = useToast();
  const [users, setUsers] = useState<AccountUser[]>(initialUsers);
  const [isPending, startTransition] = useTransition();

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState<AccountUser | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function handleRoleChange(userId: string, role: UserRole) {
    startTransition(async () => {
      const res = await fetch(`/api/accounts/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      if (!res.ok) {
        toast({ title: "Failed to update role", variant: "destructive" });
        return;
      }

      const updated: AccountUser = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      toast({ title: `Role updated to ${ROLE_CONFIG[role].label}` });
    });
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);

    const res = await fetch(`/api/accounts/${deleteTarget.id}`, { method: "DELETE" });
    setDeleteLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast({ title: body.error ?? "Failed to remove account", variant: "destructive" });
      return;
    }

    setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
    setDeleteTarget(null);
    toast({ title: `Access revoked for ${deleteTarget.email}` });
  }

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {users.length} account{users.length !== 1 ? "s" : ""} with portal access
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {(["ADMIN", "LEADER", "VOLUNTEER", "PENDING"] as UserRole[]).map((role) => {
          const { label, icon: Icon, color } = ROLE_CONFIG[role];
          const count = users.filter((u) => u.role === role).length;
          return (
            <Card key={role}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg border ${color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground">{label}s</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Users table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Portal Accounts
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {users.map((user) => {
              const { label, color, icon: RoleIcon } = ROLE_CONFIG[user.role];
              const isSelf = user.id === currentUserId;
              return (
                <div key={user.id} className="flex items-center gap-4 px-6 py-4">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={user.image ?? undefined} />
                    <AvatarFallback className="text-xs bg-muted">
                      {(user.name ?? user.email).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {user.name ?? <span className="text-muted-foreground italic">No name</span>}
                      {isSelf && (
                        <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                      <Mail className="h-3 w-3 shrink-0" />
                      {user.email}
                    </p>
                  </div>

                  <Badge variant="outline" className={`gap-1 shrink-0 ${color}`}>
                    <RoleIcon className="h-3 w-3" />
                    {label}
                  </Badge>

                  <Select
                    value={user.role}
                    onValueChange={(val) => handleRoleChange(user.id, val as UserRole)}
                    disabled={isSelf || isPending}
                  >
                    <SelectTrigger className="w-32 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="LEADER">Leader</SelectItem>
                      <SelectItem value="VOLUNTEER">Volunteer</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    disabled={isSelf}
                    onClick={() => setDeleteTarget(user)}
                    title="Revoke access"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Revoke Access</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Remove <span className="font-medium text-foreground">{deleteTarget?.email}</span> from the portal?
            They will no longer be able to sign in.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Revoke Access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
