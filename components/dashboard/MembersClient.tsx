"use client";

import { useState, useTransition, useMemo } from "react";
import {
  Plus, Search, Pencil, Trash2, Users, ExternalLink,
  ChevronUp, ChevronDown, Filter, X, Upload,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { MemberFormDialog } from "@/components/dashboard/MemberFormDialog";
import { MemberBatchUploadDialog } from "@/components/dashboard/MemberBatchUploadDialog";
import { useToast } from "@/hooks/use-toast";
import { createMember, updateMember, deleteMember } from "@/lib/actions/members";
import { getInitials } from "@/lib/utils";
import type { MemberWithRelations } from "@/types";

interface Props {
  initialMembers: MemberWithRelations[];
  statuses: { id: string; name: string; color: string }[];
  groups: { id: string; name: string; color: string }[];
}

type SortKey = "name" | "createdAt" | "status";

export function MembersClient({ initialMembers, statuses, groups }: Props) {
  const { toast } = useToast();
  const [members, setMembers] = useState(initialMembers);
  const [isPending, startTransition] = useTransition();

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [batchUploadOpen, setBatchUploadOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<MemberWithRelations | undefined>(undefined);

  // Filters
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterGroup, setFilterGroup] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortAsc, setSortAsc] = useState(false);

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function openAdd() {
    setEditingMember(undefined);
    setDialogOpen(true);
  }

  function openEdit(m: MemberWithRelations) {
    setEditingMember(m);
    setDialogOpen(true);
  }

  async function handleSave(data: Record<string, string | string[]>) {
    startTransition(async () => {
      try {
        if (editingMember) {
          const r = await updateMember(editingMember.id, data);
          if (r.success) {
            const memberGroups = Array.isArray(data.groupIds) 
              ? data.groupIds.map((id) => groups.find((g) => g.id === id)!).filter(Boolean)
              : [];
            const leaderMember = typeof data.leaderId === "string" && data.leaderId
              ? members.find((m) => m.id === data.leaderId) ?? null : null;
            const updated: MemberWithRelations = {
              ...editingMember,
              ...r.member,
              status: statuses.find((s) => s.id === data.statusId) ?? editingMember.status,
              groups: memberGroups,
              leader: leaderMember ? { id: leaderMember.id, name: leaderMember.name } : null,
            };
            setMembers((p) => p.map((m) => m.id === editingMember.id ? updated : m));
            toast({ title: "Member updated" });
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
            age: typeof data.age === 'string' && data.age ? parseInt(data.age, 10) : undefined,
            ageBracket: ['C1', 'C2', 'C3'].includes(String(data.ageBracket)) ? (data.ageBracket as 'C1' | 'C2' | 'C3') : undefined,
          };
          const r = await createMember(memberData as Parameters<typeof createMember>[0]);
          if (r.success) {
            const memberGroups = Array.isArray(data.groupIds)
              ? data.groupIds.map((id) => groups.find((g) => g.id === id)!).filter(Boolean)
              : [];
            const leaderMember = typeof data.leaderId === "string" && data.leaderId
              ? members.find((m) => m.id === data.leaderId) ?? null : null;
            const created: MemberWithRelations = {
              ...r.member,
              status: statuses.find((s) => s.id === data.statusId)!,
              groups: memberGroups,
              leader: leaderMember ? { id: leaderMember.id, name: leaderMember.name } : null,
            };
            setMembers((p) => [created, ...p]);
            toast({ title: "Member added" });
          }
        }
        setDialogOpen(false);
      } catch {
        toast({ title: "Error saving member", variant: "destructive" } as Parameters<typeof toast>[0]);
      }
    });
  }

  function confirmDelete(id: string) {
    setDeleteId(id);
  }

  function handleDelete() {
    if (!deleteId) return;
    startTransition(async () => {
      try {
        await deleteMember(deleteId);
        setMembers((p) => p.filter((m) => m.id !== deleteId));
        toast({ title: "Member deleted" });
      } catch {
        toast({ title: "Error deleting member", variant: "destructive" } as Parameters<typeof toast>[0]);
      } finally {
        setDeleteId(null);
      }
    });
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((p) => !p);
    else { setSortKey(key); setSortAsc(true); }
  }

  const filtered = useMemo(() => {
    let list = [...members];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          (m.email ?? "").toLowerCase().includes(q) ||
          (m.contact ?? "").includes(q)
      );
    }
    if (filterStatus !== "all") list = list.filter((m) => m.statusId === filterStatus);
    if (filterGroup !== "all") list = list.filter((m) => m.groups.some((g) => g.id === filterGroup));
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "createdAt") cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      else if (sortKey === "status") cmp = a.status.name.localeCompare(b.status.name);
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [members, search, filterStatus, filterGroup, sortKey, sortAsc]);

  const hasFilters = search || filterStatus !== "all" || filterGroup !== "all";

  function clearFilters() {
    setSearch("");
    setFilterStatus("all");
    setFilterGroup("all");
  }

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k
      ? (sortAsc ? <ChevronUp className="h-3 w-3 inline ml-1" /> : <ChevronDown className="h-3 w-3 inline ml-1" />)
      : null;

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Members", value: members.length, color: "#1A3D63" },
          { label: "Filtered Results", value: filtered.length, color: "#4A7FA7" },
          { label: "Statuses", value: statuses.length, color: "#8b5cf6" },
          { label: "Groups", value: groups.length, color: "#10b981" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-1 flex-wrap gap-2 items-center">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search members..."
              className="pl-8 w-56"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40 h-9 text-sm">
              <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {statuses.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full inline-block" style={{ background: s.color }} />
                    {s.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterGroup} onValueChange={setFilterGroup}>
            <SelectTrigger className="w-44 h-9 text-sm">
              <Users className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              {groups.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full inline-block" style={{ background: g.color }} />
                    {g.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs gap-1 text-muted-foreground">
              <X className="h-3.5 w-3.5" /> Clear
            </Button>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <Button size="sm" onClick={() => setBatchUploadOpen(true)} variant="outline" className="gap-1.5">
            <Upload className="h-4 w-4" /> Batch Upload
          </Button>
          <Button size="sm" onClick={openAdd} className="bg-[#1A3D63] hover:bg-[#0A1931] text-white gap-1.5">
            <Plus className="h-4 w-4" /> Add Member
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <CardContent className="py-16 text-center text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No members found</p>
            <p className="text-xs mt-1">{hasFilters ? "Try adjusting your filters" : "Add your first member to get started"}</p>
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F6FAFD] border-b">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    <button onClick={() => toggleSort("name")} className="flex items-center hover:text-[#0A1931]">
                      Member <SortIcon k="name" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Facebook</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    <button onClick={() => toggleSort("status")} className="flex items-center hover:text-[#0A1931]">
                      Status <SortIcon k="status" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Group</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">
                    <button onClick={() => toggleSort("createdAt")} className="flex items-center hover:text-[#0A1931]">
                      Added <SortIcon k="createdAt" />
                    </button>
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, i) => (
                  <tr key={m.id} className={`border-b last:border-0 hover:bg-slate-50/60 transition-colors ${i % 2 === 0 ? "" : "bg-slate-50/30"}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback className="text-xs font-semibold bg-[#B3CFE5] text-[#1A3D63]">
                            {getInitials(m.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-[#0A1931]">{m.name}</p>
                          {m.contact && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 md:hidden">
                              {m.contact}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="space-y-0.5">
                        {m.contact && (
                          <p className="text-xs text-muted-foreground">{m.contact}</p>
                        )}
                        {m.email && (
                          <a
                            href={m.email.startsWith("http") ? m.email : `https://${m.email}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs flex items-center gap-1 text-[#4A7FA7] hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" /> View Profile
                          </a>
                        )}
                        {!m.contact && !m.email && <span className="text-xs text-slate-300">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className="text-xs font-medium border"
                        style={{
                          background: m.status.color + "22",
                          color: m.status.color,
                          borderColor: m.status.color + "44",
                        }}
                      >
                        {m.status.name}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {m.groups.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {m.groups.map((g) => (
                            <span key={g.id} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <span className="h-2 w-2 rounded-full shrink-0" style={{ background: g.color }} />
                              {g.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-300 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-xs text-muted-foreground">
                      {new Date(m.createdAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost" size="icon"
                          className="h-7 w-7 text-slate-400 hover:text-[#1A3D63]"
                          onClick={() => openEdit(m)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => confirmDelete(m.id)}
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
      </Card>

      {/* Add / Edit dialog */}
      <MemberFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        statuses={statuses}
        groups={groups}
        members={members}
        member={editingMember}
        onSave={handleSave}
        isPending={isPending}
      />

      {/* Batch upload dialog */}
      <MemberBatchUploadDialog
        open={batchUploadOpen}
        onOpenChange={setBatchUploadOpen}
        defaultStatusId={statuses[0]?.id || ""}
      />

      {/* Delete confirm dialog */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4 space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="font-semibold text-[#0A1931]">Delete Member</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  This will permanently delete{" "}
                  <span className="font-medium text-[#0A1931]">
                    {members.find((m) => m.id === deleteId)?.name}
                  </span>{" "}
                  and all their attendance records.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setDeleteId(null)}>Cancel</Button>
              <Button
                size="sm"
                className="bg-red-500 hover:bg-red-600 text-white"
                onClick={handleDelete}
                disabled={isPending}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
