"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Check, ChevronDown, X } from "lucide-react";
import type { MemberWithRelations } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statuses: { id: string; name: string; color: string }[];
  groups: { id: string; name: string; color: string }[];
  members?: { id: string; name: string }[];
  member?: MemberWithRelations;
  onSave: (data: Record<string, string | string[]>) => Promise<void>;
  isPending: boolean;
}

export function MemberFormDialog({
  open,
  onOpenChange,
  statuses,
  groups,
  members = [],
  member,
  onSave,
  isPending,
}: Props) {
  const [groupsOpen, setGroupsOpen] = useState(false);
  const groupsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (groupsRef.current && !groupsRef.current.contains(e.target as Node)) {
        setGroupsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [form, setForm] = useState({
    name: "",
    contact: "",
    email: "",
    address: "",
    invitedBy: "",
    statusId: "",
    leaderId: "",
    groupIds: [] as string[],
    notes: "",
    birthdate: "",
    age: "",
    ageBracket: "",
  });

  useEffect(() => {
    if (member) {
      setForm({
        name: member.name,
        contact: member.contact ?? "",
        email: member.email ?? "",
        address: member.address ?? "",
        invitedBy: member.invitedBy ?? "",
        statusId: member.statusId,
        leaderId: member.leaderId ?? "",
        groupIds: member.groups.map((g) => g.id),
        notes: member.notes ?? "",
        birthdate: member.birthdate
          ? new Date(member.birthdate).toISOString().split("T")[0]
          : "",
        age: (member as any).age ? String((member as any).age) : "",
        ageBracket: (member as any).ageBracket ?? "",
      });
    } else {
      setForm({
        name: "",
        contact: "",
        email: "",
        address: "",
        invitedBy: "",
        statusId: statuses[0]?.id ?? "",
        leaderId: "",
        groupIds: [],
        notes: "",
        birthdate: "",
        age: "",
        ageBracket: "",
      });
    }
  }, [member, open, statuses]);

  function set(key: string, value: string | string[]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleGroup(groupId: string) {
    setForm((prev) => ({
      ...prev,
      groupIds: prev.groupIds.includes(groupId)
        ? prev.groupIds.filter((id) => id !== groupId)
        : [...prev.groupIds, groupId],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSave(form);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{member ? "Edit Member" : "Add New Member"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Juan Dela Cruz"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contact">Facebook Name <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
              <Input
                id="contact"
                value={form.contact}
                onChange={(e) => set("contact", e.target.value)}
                placeholder="Juan Dela Cruz"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Facebook Link <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
              <Input
                id="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="https://facebook.com/..."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status">Status *</Label>
              <Select value={form.statusId} onValueChange={(v) => set("statusId", v)} required>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="leader">Leader <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
              <Select value={form.leaderId || "none"} onValueChange={(v) => set("leaderId", v === "none" ? "" : v)}>
                <SelectTrigger id="leader">
                  <SelectValue placeholder="Assign a leader" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No leader</SelectItem>
                  {members
                    .filter((m) => m.id !== member?.id)
                    .map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Groups</Label>
              <div className="relative" ref={groupsRef}>
                <button
                  type="button"
                  onClick={() => setGroupsOpen((p) => !p)}
                  className="w-full min-h-9 border rounded-md px-3 py-1.5 text-sm text-left flex flex-wrap gap-1.5 items-center bg-background hover:bg-slate-50 transition-colors"
                >
                  {form.groupIds.length === 0 ? (
                    <span className="text-muted-foreground flex-1">Select groups...</span>
                  ) : (
                    form.groupIds.map((id) => {
                      const g = groups.find((g) => g.id === id);
                      if (!g) return null;
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 text-xs"
                        >
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: g.color }} />
                          {g.name}
                          <span
                            role="button"
                            onClick={(e) => { e.stopPropagation(); toggleGroup(id); }}
                            className="ml-0.5 hover:text-red-500 cursor-pointer leading-none"
                          >
                            <X className="h-3 w-3" />
                          </span>
                        </span>
                      );
                    })
                  )}
                  <ChevronDown className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
                </button>
                {groupsOpen && (
                  <div className="absolute z-50 top-full left-0 w-full mt-1 bg-white border rounded-md shadow-lg py-1 max-h-52 overflow-auto">
                    {groups.length === 0 ? (
                      <p className="text-sm text-muted-foreground px-3 py-2">No groups available</p>
                    ) : (
                      groups.map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => toggleGroup(g.id)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-slate-50 text-left transition-colors"
                        >
                          <span
                            className={`h-4 w-4 border rounded flex items-center justify-center shrink-0 transition-colors ${
                              form.groupIds.includes(g.id)
                                ? "bg-[#1A3D63] border-[#1A3D63]"
                                : "border-slate-300"
                            }`}
                          >
                            {form.groupIds.includes(g.id) && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </span>
                          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: g.color }} />
                          {g.name}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="invitedBy">Invited By</Label>
              <Input
                id="invitedBy"
                value={form.invitedBy}
                onChange={(e) => set("invitedBy", e.target.value)}
                placeholder="Name of inviter"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="birthdate">Birthdate</Label>
              <Input
                id="birthdate"
                type="date"
                value={form.birthdate}
                onChange={(e) => set("birthdate", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="age">Age <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
              <Input
                id="age"
                type="number"
                min="0"
                max="120"
                value={form.age}
                onChange={(e) => set("age", e.target.value)}
                placeholder="e.g. 12"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ageBracket">Age Bracket <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
              <Select value={form.ageBracket} onValueChange={(v) => set("ageBracket", v)}>
                <SelectTrigger id="ageBracket">
                  <SelectValue placeholder="Select bracket" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="C1">C1 - Kids</SelectItem>
                  <SelectItem value="C2">C2 - Pre-Teen</SelectItem>
                  <SelectItem value="C3">C3 - Teen</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                placeholder="Barangay, Municipality, Province"
              />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Any additional notes about this member..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : member ? (
                "Save Changes"
              ) : (
                "Add Member"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
