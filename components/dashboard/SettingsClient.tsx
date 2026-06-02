"use client";

import { useState, useTransition } from "react";
import {
  Plus, Pencil, Trash2, Loader2, Shield, Users,
  BookOpen, BarChart2, Image as ImageIcon, Settings, ClipboardList,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  createStatus, updateStatus, deleteStatus,
  createGroup, updateGroup, deleteGroup,
} from "@/lib/actions/members";
import { saveRoleSettings } from "@/lib/actions/roles";
import { ServiceTypesCMS } from "@/components/dashboard/ServiceTypesCMS";

// ─── Types ───────────────────────────────────────────────────────────────────

interface StatusItem { id: string; name: string; color: string | null; }
interface GroupItem  { id: string; name: string; color: string | null; }
interface ServiceTypeItem { id: string; name: string; icon?: string | null; order: number; }

type Permission  = { view: boolean; create: boolean; edit: boolean; delete: boolean };
type Permissions = Record<string, Permission>;

interface Role {
  id: "ADMIN" | "LEADER" | "VOLUNTEER" | "PENDING";
  name: string;
  description: string;
  permissions: Permissions;
}

// ─── Modules & Defaults ──────────────────────────────────────────────────────

const MODULES = [
  { id: "members",        label: "Members",        icon: Users },
  { id: "attendance",     label: "Attendance",      icon: ClipboardList },
  { id: "training",       label: "Training",        icon: BookOpen },
  { id: "growth-tracker", label: "Growth Tracker",  icon: BarChart2 },
  { id: "cms",            label: "Content (CMS)",   icon: ImageIcon },
  { id: "settings",       label: "Settings",        icon: Settings },
];

const ALL_ON:   Permission = { view: true,  create: true,  edit: true,  delete: true  };
const VIEW_ONLY: Permission = { view: true,  create: false, edit: false, delete: false };


// ─── Component ───────────────────────────────────────────────────────────────

export function SettingsClient({
  initialStatuses,
  initialGroups,
  initialServiceTypes = [],
  initialRoles,
}: {
  initialStatuses: StatusItem[];
  initialGroups: GroupItem[];
  initialServiceTypes?: ServiceTypeItem[];
  initialRoles: Role[];
}) {
  const { toast } = useToast();
  const [statuses, setStatuses] = useState(initialStatuses);
  const [groups,   setGroups]   = useState(initialGroups);
  const [isPending, startTransition] = useTransition();

  // ── Status dialog ──
  const [statusDialog,   setStatusDialog]   = useState(false);
  const [editingStatus,  setEditingStatus]  = useState<StatusItem | null>(null);
  const [statusForm,     setStatusForm]     = useState({ name: "", color: "#3b82f6" });

  // ── Group dialog ──
  const [groupDialog,   setGroupDialog]  = useState(false);
  const [editingGroup,  setEditingGroup] = useState<GroupItem | null>(null);
  const [groupForm,     setGroupForm]    = useState({ name: "", color: "#3b82f6" });

  // ── Roles (localStorage) ──
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [selectedRole, setSelectedRole] = useState<Role["id"]>(initialRoles[0]?.id ?? "ADMIN");
  const [roleDialog, setRoleDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleForm, setRoleForm] = useState({ name: "", description: "" });

  function saveRoles(updated: Role[]) {
    setRoles(updated);
    startTransition(async () => {
      try {
        await saveRoleSettings(updated);
        toast({ title: "Permissions saved" });
      } catch {
        toast({ title: "Unable to save role settings", variant: "destructive" });
      }
    });
  }

  // ─── Status Handlers ─────────────────────────────────────────────────────

  function openAddStatus() { setEditingStatus(null); setStatusForm({ name: "", color: "#3b82f6" }); setStatusDialog(true); }
  function openEditStatus(s: StatusItem) { setEditingStatus(s); setStatusForm({ name: s.name, color: s.color ?? "#3b82f6" }); setStatusDialog(true); }

  function handleSaveStatus(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        if (editingStatus) {
          const r = await updateStatus(editingStatus.id, statusForm.name, statusForm.color);
          if (r.success && r.status) { setStatuses((p) => p.map((s) => s.id === editingStatus.id ? r.status! : s)); toast({ title: "Status updated" }); }
        } else {
          const r = await createStatus(statusForm.name, statusForm.color);
          if (r.success && r.status) { setStatuses((p) => [...p, r.status!]); toast({ title: "Status created" }); }
        }
        setStatusDialog(false);
      } catch { toast({ title: "Error", variant: "destructive" } as Parameters<typeof toast>[0]); }
    });
  }

  function handleDeleteStatus(id: string) {
    if (!confirm("Delete this status?")) return;
    startTransition(async () => {
      try {
        await deleteStatus(id);
        setStatuses((p) => p.filter((s) => s.id !== id));
        toast({ title: "Deleted" });
      } catch { toast({ title: "Error", variant: "destructive" } as Parameters<typeof toast>[0]); }
    });
  }

  // ─── Group Handlers ───────────────────────────────────────────────────────

  function openAddGroup() { setEditingGroup(null); setGroupForm({ name: "", color: "#3b82f6" }); setGroupDialog(true); }
  function openEditGroup(g: GroupItem) { setEditingGroup(g); setGroupForm({ name: g.name, color: g.color ?? "#3b82f6" }); setGroupDialog(true); }

  function handleSaveGroup(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        if (editingGroup) {
          const r = await updateGroup(editingGroup.id, groupForm.name, groupForm.color);
          if (r.success && r.group) { setGroups((p) => p.map((g) => g.id === editingGroup.id ? r.group! : g)); toast({ title: "Group updated" }); }
        } else {
          const r = await createGroup(groupForm.name, groupForm.color);
          if (r.success && r.group) { setGroups((p) => [...p, r.group!]); toast({ title: "Group created" }); }
        }
        setGroupDialog(false);
      } catch { toast({ title: "Error", variant: "destructive" } as Parameters<typeof toast>[0]); }
    });
  }

  function handleDeleteGroup(id: string) {
    if (!confirm("Delete this group?")) return;
    startTransition(async () => {
      try {
        await deleteGroup(id);
        setGroups((p) => p.filter((g) => g.id !== id));
        toast({ title: "Deleted" });
      } catch { toast({ title: "Error", variant: "destructive" } as Parameters<typeof toast>[0]); }
    });
  }

  // ─── Role Handlers ────────────────────────────────────────────────────────

  function openEditRole(r: Role) {
    setEditingRole(r);
    setRoleForm({ name: r.name, description: r.description });
    setRoleDialog(true);
  }

  function handleSaveRole(e: React.FormEvent) {
    e.preventDefault();
    if (!editingRole) return;

    const updated = roles.map((r) =>
      r.id === editingRole.id ? { ...r, ...roleForm } : r
    );
    saveRoles(updated);
    toast({ title: "Role updated" });
    setRoleDialog(false);
  }


  function togglePermission(roleId: string, moduleId: string, key: keyof Permission) {
    const updated = roles.map((r) => {
      if (r.id !== roleId) return r;
      const current = r.permissions[moduleId] ?? { view: false, create: false, edit: false, delete: false };
      const next = { ...current, [key]: !current[key] };
      // If disabling view, disable all others too
      if (key === "view" && !next.view) { next.create = false; next.edit = false; next.delete = false; }
      // If enabling create/edit/delete, auto-enable view
      if ((key === "create" || key === "edit" || key === "delete") && next[key]) { next.view = true; }
      return { ...r, permissions: { ...r.permissions, [moduleId]: next } };
    });
    saveRoles(updated);
  }

  function toggleAllForModule(roleId: string, moduleId: string, on: boolean) {
    const updated = roles.map((r) => {
      if (r.id !== roleId) return r;
      return { ...r, permissions: { ...r.permissions, [moduleId]: { view: on, create: on, edit: on, delete: on } } };
    });
    saveRoles(updated);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const itemRow = (name: string, color: string | null, onEdit: () => void, onDelete: () => void) => (
    <div key={name} className="flex items-center justify-between py-2.5 border-b last:border-0">
      <div className="flex items-center gap-2.5">
        <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: color ?? "#3b82f6" }} />
        <span className="text-sm font-medium">{name}</span>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-[#1A3D63]" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={onDelete} disabled={isPending}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );

  const activeRole = roles.find((r) => r.id === selectedRole);

  const permBadge = (p: Permission) => {
    const count = [p.view, p.create, p.edit, p.delete].filter(Boolean).length;
    if (count === 4) return <Badge className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200">Full Access</Badge>;
    if (count === 0) return <Badge className="text-xs bg-slate-100 text-slate-500 border-slate-200">No Access</Badge>;
    if (count === 1 && p.view) return <Badge className="text-xs bg-blue-50 text-blue-600 border-blue-200">View Only</Badge>;
    return <Badge className="text-xs bg-amber-50 text-amber-700 border-amber-200">Partial</Badge>;
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <Tabs defaultValue="general" className="space-y-6">
      <TabsList className="gap-1">
        <TabsTrigger value="general" className="gap-2"><Settings className="h-4 w-4" /> General</TabsTrigger>
        <TabsTrigger value="roles"   className="gap-2"><Shield   className="h-4 w-4" /> Roles & Permissions</TabsTrigger>
      </TabsList>

      {/* ── GENERAL TAB ── */}
      <TabsContent value="general">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
              <div>
                <CardTitle className="text-base">Member Statuses</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">{statuses.length} statuses defined</p>
              </div>
              <Button size="sm" variant="outline" onClick={openAddStatus} className="gap-1">
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </CardHeader>
            <CardContent className="pt-3">
              {statuses.length === 0
                ? <p className="text-sm text-muted-foreground py-4 text-center">No statuses yet.</p>
                : statuses.map((s) => itemRow(s.name, s.color, () => openEditStatus(s), () => handleDeleteStatus(s.id)))
              }
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
              <div>
                <CardTitle className="text-base">Groups / Ministries</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">{groups.length} groups defined</p>
              </div>
              <Button size="sm" variant="outline" onClick={openAddGroup} className="gap-1">
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </CardHeader>
            <CardContent className="pt-3">
              {groups.length === 0
                ? <p className="text-sm text-muted-foreground py-4 text-center">No groups yet.</p>
                : groups.map((g) => itemRow(g.name, g.color, () => openEditGroup(g), () => handleDeleteGroup(g.id)))
              }
            </CardContent>
          </Card>

          <ServiceTypesCMS serviceTypes={initialServiceTypes} />
        </div>
      </TabsContent>

      {/* ── ROLES TAB ── */}
      <TabsContent value="roles">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">

          {/* Role list */}
          <Card className="h-fit">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Roles</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              {roles.map((r) => (
                <div
                  key={r.id}
                  onClick={() => setSelectedRole(r.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl mb-1 transition-colors flex items-center justify-between group cursor-pointer ${
                    selectedRole === r.id
                      ? "bg-[#1A3D63] text-white"
                      : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div>
                    <p className={`text-sm font-medium ${selectedRole === r.id ? "text-white" : "text-[#0A1931]"}`}>{r.name}</p>
                    <p className={`text-xs mt-0.5 line-clamp-1 ${selectedRole === r.id ? "text-blue-200" : "text-muted-foreground"}`}>{r.description}</p>
                  </div>
                  <div className={`flex gap-1 opacity-0 group-hover:opacity-100 ${selectedRole === r.id ? "opacity-100" : ""}`}>
                    <button
                      onClick={(e) => { e.stopPropagation(); openEditRole(r); }}
                      className={`p-1 rounded hover:bg-white/20 ${selectedRole === r.id ? "text-blue-200" : "text-slate-400"}`}
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Permissions matrix */}
          {activeRole ? (
            <Card>
              <CardHeader className="pb-3 border-b">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Shield className="h-4 w-4 text-[#4A7FA7]" />
                      {activeRole.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-0.5">{activeRole.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b">
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground w-48">Module</th>
                        <th className="text-center px-3 py-3 font-medium text-muted-foreground">View</th>
                        <th className="text-center px-3 py-3 font-medium text-muted-foreground">Create</th>
                        <th className="text-center px-3 py-3 font-medium text-muted-foreground">Edit</th>
                        <th className="text-center px-3 py-3 font-medium text-muted-foreground">Delete</th>
                        <th className="text-center px-3 py-3 font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MODULES.map((mod, i) => {
                        const Icon = mod.icon;
                        const p = activeRole.permissions[mod.id] ?? { view: false, create: false, edit: false, delete: false };
                        const allOn = p.view && p.create && p.edit && p.delete;
                        return (
                          <tr key={mod.id} className={`border-b last:border-0 ${i % 2 === 0 ? "" : "bg-slate-50/50"}`}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="h-7 w-7 rounded-lg bg-[#F6FAFD] border border-[#B3CFE5] flex items-center justify-center flex-shrink-0">
                                  <Icon className="h-3.5 w-3.5 text-[#4A7FA7]" />
                                </div>
                                <span className="font-medium text-[#0A1931]">{mod.label}</span>
                              </div>
                            </td>
                            {(["view", "create", "edit", "delete"] as (keyof Permission)[]).map((key) => (
                              <td key={key} className="text-center px-3 py-3">
                                <button
                                  onClick={() => togglePermission(activeRole.id, mod.id, key)}
                                  className={`h-5 w-5 rounded border-2 flex items-center justify-center mx-auto transition-colors ${
                                    p[key]
                                      ? "bg-[#1A3D63] border-[#1A3D63]"
                                      : "bg-white border-slate-300 hover:border-[#4A7FA7]"
                                  }`}
                                >
                                  {p[key] && (
                                    <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  )}
                                </button>
                              </td>
                            ))}
                            <td className="text-center px-3 py-3">
                              <div className="flex flex-col items-center gap-1">
                                {permBadge(p)}
                                <button
                                  onClick={() => toggleAllForModule(activeRole.id, mod.id, !allOn)}
                                  className="text-xs text-[#4A7FA7] hover:underline"
                                >
                                  {allOn ? "Revoke all" : "Grant all"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="flex items-center justify-center py-16">
              <p className="text-sm text-muted-foreground">Select a role to manage permissions.</p>
            </Card>
          )}
        </div>
      </TabsContent>

      {/* ── Status Dialog ── */}
      <Dialog open={statusDialog} onOpenChange={setStatusDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingStatus ? "Edit Status" : "Add Status"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveStatus} className="space-y-4">
            <div className="space-y-1.5"><Label>Name *</Label><Input value={statusForm.name} onChange={(e) => setStatusForm((p) => ({ ...p, name: e.target.value }))} required /></div>
            <div className="space-y-1.5">
              <Label>Color</Label>
              <div className="flex gap-3 items-center">
                <input type="color" value={statusForm.color} onChange={(e) => setStatusForm((p) => ({ ...p, color: e.target.value }))} className="h-9 w-16 rounded border cursor-pointer" />
                <Badge style={{ background: statusForm.color }}>{statusForm.name || "Preview"}</Badge>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setStatusDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Group Dialog ── */}
      <Dialog open={groupDialog} onOpenChange={setGroupDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingGroup ? "Edit Group" : "Add Group"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveGroup} className="space-y-4">
            <div className="space-y-1.5"><Label>Name *</Label><Input value={groupForm.name} onChange={(e) => setGroupForm((p) => ({ ...p, name: e.target.value }))} required /></div>
            <div className="space-y-1.5">
              <Label>Color</Label>
              <div className="flex gap-3 items-center">
                <input type="color" value={groupForm.color} onChange={(e) => setGroupForm((p) => ({ ...p, color: e.target.value }))} className="h-9 w-16 rounded border cursor-pointer" />
                <Badge style={{ background: groupForm.color }}>{groupForm.name || "Preview"}</Badge>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setGroupDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Role Dialog ── */}
      <Dialog open={roleDialog} onOpenChange={setRoleDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Role</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveRole} className="space-y-4">
            <div className="space-y-1.5"><Label>Role Name *</Label><Input value={roleForm.name} onChange={(e) => setRoleForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Youth Leader" required /></div>
            <div className="space-y-1.5"><Label>Description</Label><Input value={roleForm.description} onChange={(e) => setRoleForm((p) => ({ ...p, description: e.target.value }))} placeholder="Brief description of this role" /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRoleDialog(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}
