"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, Music2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { getInitials } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { TrainingWithMember } from "@/types";

const INSTRUMENTS = [
  "Acoustic Guitar","Electric Guitar","Bass Guitar","Drums",
  "Keyboard / Piano","Vocals","Violin","Brass / Wind","Sound System","Other",
];

const SKILL_LEVELS = [
  { value: "BEGINNER", label: "Beginner", color: "bg-yellow-100 text-yellow-700" },
  { value: "INTERMEDIATE", label: "Intermediate", color: "bg-blue-100 text-blue-700" },
  { value: "ADVANCED", label: "Advanced", color: "bg-green-100 text-green-700" },
];

interface Props {
  initialTraining: TrainingWithMember[];
  members: { id: string; name: string }[];
}

export function TrainingClient({ initialTraining, members }: Props) {
  const [training, setTraining] = useState(initialTraining);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TrainingWithMember | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const [form, setForm] = useState({
    memberId: "",
    instrument: "",
    skillLevel: "BEGINNER",
    progress: "0",
    trainer: "",
    notes: "",
  });

  function openAdd() {
    setEditing(null);
    setForm({ memberId: "", instrument: "", skillLevel: "BEGINNER", progress: "0", trainer: "", notes: "" });
    setDialogOpen(true);
  }

  function openEdit(t: TrainingWithMember) {
    setEditing(t);
    setForm({
      memberId: t.memberId,
      instrument: t.instrument,
      skillLevel: t.skillLevel,
      progress: String(t.progress),
      trainer: t.trainer ?? "",
      notes: t.notes ?? "",
    });
    setDialogOpen(true);
  }

  function setF(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const method = editing ? "PATCH" : "POST";
        const url = editing
          ? `/api/training/${editing.id}`
          : "/api/training";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, progress: parseInt(form.progress) }),
        });

        if (!res.ok) throw new Error("Failed");
        const data = await res.json();

        const member = members.find((m) => m.id === form.memberId)!;
        const record: TrainingWithMember = {
          ...data,
          member,
        };

        if (editing) {
          setTraining((prev) => prev.map((t) => (t.id === editing.id ? record : t)));
          toast({ title: "Training record updated" });
        } else {
          setTraining((prev) => [record, ...prev]);
          toast({ title: "Training record added" });
        }

        setDialogOpen(false);
      } catch {
        toast({ title: "Error saving record", variant: "destructive" } as Parameters<typeof toast>[0]);
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this training record?")) return;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/training/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed");
        setTraining((prev) => prev.filter((t) => t.id !== id));
        toast({ title: "Record deleted" });
      } catch {
        toast({ title: "Error deleting record", variant: "destructive" } as Parameters<typeof toast>[0]);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Training Tracker</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track worship team training and skill progress
          </p>
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus className="h-4 w-4" /> Add Record
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {SKILL_LEVELS.map((sl) => {
          const count = training.filter((t) => t.skillLevel === sl.value).length;
          return (
            <Card key={sl.value}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`px-2.5 py-1 rounded-xl text-2xl font-bold ${sl.color}`}>
                  {count}
                </div>
                <p className="text-sm text-muted-foreground">{sl.label}s</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Training Cards Grid */}
      {training.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Music2 className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-40" />
            <p className="font-medium text-muted-foreground">No training records yet</p>
            <p className="text-sm text-muted-foreground mt-1">Add your first training record to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {training.map((t) => {
            const sl = SKILL_LEVELS.find((s) => s.value === t.skillLevel)!;
            return (
              <Card key={t.id} className="hover:card-shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-purple-100 text-purple-700 text-xs font-semibold">
                          {getInitials(t.member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{t.member.name}</p>
                        <p className="text-xs text-muted-foreground">{t.instrument}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(t)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(t.id)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sl.color}`}>
                        {sl.label}
                      </span>
                      {t.trainer && (
                        <span className="text-xs text-muted-foreground">
                          Trainer: {t.trainer}
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{t.progress}%</span>
                      </div>
                      <Progress value={t.progress} />
                    </div>

                    {t.notes && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{t.notes}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Training Record" : "Add Training Record"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Member *</Label>
              <Select value={form.memberId} onValueChange={(v) => setF("memberId", v)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Instrument *</Label>
                <Select value={form.instrument} onValueChange={(v) => setF("instrument", v)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {INSTRUMENTS.map((i) => (
                      <SelectItem key={i} value={i}>{i}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Skill Level</Label>
                <Select value={form.skillLevel} onValueChange={(v) => setF("skillLevel", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SKILL_LEVELS.map((sl) => (
                      <SelectItem key={sl.value} value={sl.value}>{sl.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Progress (0–100)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={form.progress}
                  onChange={(e) => setF("progress", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Trainer</Label>
                <Input
                  value={form.trainer}
                  onChange={(e) => setF("trainer", e.target.value)}
                  placeholder="Trainer name"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setF("notes", e.target.value)}
                placeholder="Progress notes..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
