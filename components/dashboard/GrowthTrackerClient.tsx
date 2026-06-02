"use client";

import { useState, useTransition, useMemo } from "react";
import { Plus, Search, Filter, Download, Pencil, Trash2, X, Eye, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MemberFormDialog } from "@/components/dashboard/MemberFormDialog";
import { createMember, updateMember, deleteMember } from "@/lib/actions/members";
import { getMemberLessons } from "@/lib/actions/lessons";
import { exportToCSV, formatRelativeDate, getInitials } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { MemberWithRelations, MemberLessonWithDetails } from "@/types";

interface Props {
  initialMembers: MemberWithRelations[];
  statuses: { id: string; name: string; color: string }[];
  groups: { id: string; name: string; color: string }[];
}

export function GrowthTrackerClient({ initialMembers, statuses, groups }: Props) {
  const [members, setMembers] = useState(initialMembers);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMember, setEditMember] = useState<MemberWithRelations | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  // Lesson progress panel
  const [progressMember, setProgressMember] = useState<MemberWithRelations | null>(null);
  const [memberLessons, setMemberLessons] = useState<MemberLessonWithDetails[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(false);

  async function openProgress(m: MemberWithRelations) {
    setProgressMember(m);
    setLoadingLessons(true);
    try {
      const data = await getMemberLessons(m.id);
      setMemberLessons(data as MemberLessonWithDetails[]);
    } finally {
      setLoadingLessons(false);
    }
  }

  const filtered = useMemo(() => {
    return members.filter((m) => {
      const matchSearch =
        !search ||
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.contact?.includes(search) ||
        m.invitedBy?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || m.statusId === statusFilter;
      const matchGroup = groupFilter === "all" || m.groups.some((g) => g.id === groupFilter);
      return matchSearch && matchStatus && matchGroup;
    });
  }, [members, search, statusFilter, groupFilter]);

  function openAdd() {
    setEditMember(null);
    setDialogOpen(true);
  }

  function openEdit(m: MemberWithRelations) {
    setEditMember(m);
    setDialogOpen(true);
  }

  function handleExport() {
    exportToCSV(
      members.map((m) => ({
        Name: m.name,
        Contact: m.contact ?? "",
        Email: m.email ?? "",
        Status: m.status.name,
        Groups: m.groups.map(g => g.name).join(", ") || "None",
        "Invited By": m.invitedBy ?? "",
        Notes: m.notes ?? "",
        "Last Interaction": m.lastInteraction
          ? new Date(m.lastInteraction).toLocaleDateString()
          : "",
        "Date Added": new Date(m.createdAt).toLocaleDateString(),
      })),
      "members-export"
    );
  }

  async function handleSave(data: Record<string, string | string[]>) {
    startTransition(async () => {
      try {
        if (editMember) {
          const result = await updateMember(editMember.id, data);
          if (result.success) {
            const groupIds = Array.isArray(data.groupIds) ? data.groupIds : [];
            const memberGroups = groupIds.map((id) => groups.find((g) => g.id === id)!).filter(Boolean);
            const leaderMember = typeof data.leaderId === "string" && data.leaderId
              ? members.find((m) => m.id === data.leaderId) ?? null
              : null;
            
            setMembers((prev) =>
              prev.map((m) =>
                m.id === editMember.id
                  ? {
                      ...m,
                      ...(typeof data.name === 'string' && { name: data.name }),
                      ...(typeof data.contact === 'string' && { contact: data.contact }),
                      ...(typeof data.email === 'string' && { email: data.email }),
                      ...(typeof data.address === 'string' && { address: data.address }),
                      ...(typeof data.invitedBy === 'string' && { invitedBy: data.invitedBy }),
                      ...(typeof data.birthdate === 'string' && { birthdate: new Date(data.birthdate) }),
                      ...(typeof data.notes === 'string' && { notes: data.notes }),
                      ...(typeof data.leaderId === 'string' && { leaderId: data.leaderId || null }),
                      status: statuses.find((s) => s.id === data.statusId) ?? m.status,
                      groups: memberGroups,
                      leader: leaderMember ? { id: leaderMember.id, name: leaderMember.name } : null,
                    }
                  : m
              )
            );
            toast({ title: "Member updated", variant: "default" });
          }
        } else {
          const memberData = {
            name: String(data.name),
            statusId: String(data.statusId),
            contact: typeof data.contact === 'string' ? data.contact : undefined,
            email: typeof data.email === 'string' ? data.email : undefined,
            address: typeof data.address === 'string' ? data.address : undefined,
            invitedBy: typeof data.invitedBy === 'string' ? data.invitedBy : undefined,
            leaderId: typeof data.leaderId === 'string' && data.leaderId ? data.leaderId : undefined,
            groupIds: Array.isArray(data.groupIds) ? data.groupIds : undefined,
            notes: typeof data.notes === 'string' ? data.notes : undefined,
            birthdate: typeof data.birthdate === 'string' ? data.birthdate : undefined,
            age: typeof data.age === 'string' ? parseInt(data.age, 10) : undefined,
            ageBracket: ['C1', 'C2', 'C3'].includes(String(data.ageBracket)) ? (data.ageBracket as 'C1' | 'C2' | 'C3') : undefined,
          };
          const result = await createMember(memberData as Parameters<typeof createMember>[0]);
          if (result.success) {
            const groupIds = Array.isArray(data.groupIds) ? data.groupIds : [];
            const memberGroups = groupIds.map((id) => groups.find((g) => g.id === id)!).filter(Boolean);
            const leaderMember = typeof data.leaderId === "string" && data.leaderId
              ? members.find((m) => m.id === data.leaderId) ?? null
              : null;
            
            const newMember: MemberWithRelations = {
              ...result.member,
              age: result.member.age,
              ageBracket: result.member.ageBracket,
              leaderId: typeof data.leaderId === "string" ? data.leaderId || null : null,
              status: statuses.find((s) => s.id === data.statusId)!,
              groups: memberGroups,
              leader: leaderMember ? { id: leaderMember.id, name: leaderMember.name } : null,
            };
            setMembers((prev) => [newMember, ...prev]);
            toast({ title: "Member added", variant: "default" });
          }
        }
        setDialogOpen(false);
      } catch {
        toast({ title: "Error saving member", variant: "destructive" } as Parameters<typeof toast>[0]);
      }
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this member? This cannot be undone.")) return;
    startTransition(async () => {
      try {
        await deleteMember(id);
        setMembers((prev) => prev.filter((m) => m.id !== id));
        toast({ title: "Member deleted", variant: "default" });
      } catch {
        toast({ title: "Error deleting member", variant: "destructive" } as Parameters<typeof toast>[0]);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Growth Tracker</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track and manage your congregation members
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add Member
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {statuses.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={groupFilter} onValueChange={setGroupFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Groups</SelectItem>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <p className="text-sm text-muted-foreground self-center">
              {filtered.length} of {members.length} members
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Members</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No members found</p>
              <p className="text-sm mt-1">Try adjusting your filters or add a new member.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted">
                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Member</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Contact</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Group</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Leader</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Invited By</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Last Seen</th>
                    <th className="text-right px-6 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[--border]">
                  {filtered.map((m) => (
                    <tr key={m.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-semibold">
                              {getInitials(m.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{m.name}</p>
                            {m.email && (
                              <p className="text-xs text-muted-foreground">{m.email}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {m.contact ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className="text-xs"
                          style={{
                            backgroundColor: m.status.color + "20",
                            color: m.status.color,
                            border: `1px solid ${m.status.color}40`,
                          }}
                        >
                          {m.status.name}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {m.groups.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {m.groups.map((g) => (
                              <span
                                key={g.id}
                                className="px-2 py-0.5 rounded-full text-xs font-medium"
                                style={{
                                  backgroundColor: g.color + "20",
                                  color: g.color,
                                }}
                              >
                                {g.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-sm">
                        {m.leader ? (
                          <span className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-[#1A3D63] shrink-0" />
                            {m.leader.name}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {m.invitedBy ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {m.lastInteraction
                          ? formatRelativeDate(m.lastInteraction)
                          : formatRelativeDate(m.createdAt)}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-[#4A7FA7] hover:text-[#1A3D63]"
                            onClick={() => openProgress(m)}
                            title="View lesson progress"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(m)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(m.id)}
                            disabled={isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <MemberFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        statuses={statuses}
        groups={groups}
        members={members}
        member={editMember ?? undefined}
        onSave={handleSave}
        isPending={isPending}
      />

      {/* Lesson Progress Drawer */}
      {progressMember && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setProgressMember(null)}>
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 mb-4 sm:mb-0 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div>
                <p className="font-semibold text-[#0A1931]">{progressMember.name}</p>
                <p className="text-xs text-muted-foreground">Lesson Progress</p>
              </div>
              <button onClick={() => setProgressMember(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto px-2 py-2">
              {loadingLessons ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : memberLessons.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No lessons completed yet.</p>
              ) : (
                memberLessons.map((ml, i) => (
                  <div key={ml.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-green-50 mb-1.5">
                    <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-green-800 truncate">{ml.lesson.title}</p>
                    </div>
                    <span className="text-xs text-green-600 shrink-0">
                      {new Date(ml.completedAt).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="px-5 py-3 border-t bg-slate-50 text-sm text-muted-foreground text-center">
              {memberLessons.length} lesson{memberLessons.length !== 1 ? "s" : ""} completed
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Users({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
