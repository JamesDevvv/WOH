"use client";

import { useState, useTransition } from "react";
import {
  Plus, Pencil, Trash2, BookOpen, Users, GripVertical,
  Check, X, Loader2, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  createLesson,
  updateLesson,
  deleteLesson,
  getMemberLessons,
  toggleMemberLesson,
} from "@/lib/actions/lessons";
import { getInitials } from "@/lib/utils";
import type { Lesson, MemberWithRelations, MemberLessonWithDetails } from "@/types";

interface Props {
  initialLessons: Lesson[];
  members: MemberWithRelations[];
}

export function LessonsClient({ initialLessons, members }: Props) {
  const { toast } = useToast();
  const [lessons, setLessons] = useState(initialLessons);
  const [isPending, startTransition] = useTransition();

  // Lesson form dialog
  const [lessonDialog, setLessonDialog] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [lessonForm, setLessonForm] = useState({ title: "", description: "", order: "0" });

  // Member progress dialog
  const [progressDialog, setProgressDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberWithRelations | null>(null);
  const [memberLessons, setMemberLessons] = useState<MemberLessonWithDetails[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(false);

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function openAddLesson() {
    setEditingLesson(null);
    setLessonForm({ title: "", description: "", order: String(lessons.length) });
    setLessonDialog(true);
  }

  function openEditLesson(l: Lesson) {
    setEditingLesson(l);
    setLessonForm({ title: l.title, description: l.description ?? "", order: String(l.order) });
    setLessonDialog(true);
  }

  async function handleSaveLesson(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const payload = {
          title: lessonForm.title,
          description: lessonForm.description || undefined,
          order: parseInt(lessonForm.order) || 0,
        };
        if (editingLesson) {
          const r = await updateLesson(editingLesson.id, payload);
          if (r.success) {
            setLessons((p) => p.map((l) => l.id === editingLesson.id ? { ...l, ...r.lesson } : l));
            toast({ title: "Lesson updated" });
          }
        } else {
          const r = await createLesson(payload);
          if (r.success) {
            setLessons((p) => [...p, r.lesson]);
            toast({ title: "Lesson created" });
          }
        }
        setLessonDialog(false);
      } catch {
        toast({ title: "Error saving lesson", variant: "destructive" } as Parameters<typeof toast>[0]);
      }
    });
  }

  function handleDeleteLesson() {
    if (!deleteId) return;
    startTransition(async () => {
      try {
        await deleteLesson(deleteId);
        setLessons((p) => p.filter((l) => l.id !== deleteId));
        toast({ title: "Lesson deleted" });
      } catch {
        toast({ title: "Error deleting lesson", variant: "destructive" } as Parameters<typeof toast>[0]);
      } finally {
        setDeleteId(null);
      }
    });
  }

  async function openMemberProgress(m: MemberWithRelations) {
    setSelectedMember(m);
    setProgressDialog(true);
    setLoadingProgress(true);
    try {
      const data = await getMemberLessons(m.id);
      setMemberLessons(data as MemberLessonWithDetails[]);
    } finally {
      setLoadingProgress(false);
    }
  }

  async function handleToggleLesson(lessonId: string) {
    if (!selectedMember) return;
    startTransition(async () => {
      try {
        const result = await toggleMemberLesson(selectedMember.id, lessonId);
        if (result.completed) {
          const completedLesson = lessons.find((l) => l.id === lessonId)!;
          setMemberLessons((p) => [
            ...p,
            {
              id: crypto.randomUUID(),
              memberId: selectedMember.id,
              lessonId,
              completedAt: new Date(),
              notes: null,
              lesson: completedLesson,
            },
          ]);
        } else {
          setMemberLessons((p) => p.filter((ml) => ml.lessonId !== lessonId));
        }
      } catch {
        toast({ title: "Error updating lesson", variant: "destructive" } as Parameters<typeof toast>[0]);
      }
    });
  }

  const completedIds = new Set(memberLessons.map((ml) => ml.lessonId));
  const sortedLessons = [...lessons].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lessons</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage lesson modules and track member progress
          </p>
        </div>
        <Button size="sm" onClick={openAddLesson} className="bg-[#1A3D63] hover:bg-[#0A1931] text-white gap-1.5 shrink-0">
          <Plus className="h-4 w-4" /> Add Lesson
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lesson Library */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-[#1A3D63]" />
              Lesson Library
              <Badge variant="secondary" className="ml-auto">{lessons.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {sortedLessons.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground px-4">
                <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No lessons yet</p>
                <p className="text-sm mt-1">Add your first lesson to get started.</p>
              </div>
            ) : (
              <div className="divide-y">
                {sortedLessons.map((lesson, i) => (
                  <div key={lesson.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/60 transition-colors">
                    <GripVertical className="h-4 w-4 text-slate-300 shrink-0" />
                    <div className="h-7 w-7 rounded-full bg-[#1A3D63]/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-[#1A3D63]">{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-[#0A1931] truncate">{lesson.title}</p>
                      {lesson.description && (
                        <p className="text-xs text-muted-foreground truncate">{lesson.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost" size="icon"
                        className="h-7 w-7 text-slate-400 hover:text-[#1A3D63]"
                        onClick={() => openEditLesson(lesson)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => setDeleteId(lesson.id)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Member Progress */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-[#1A3D63]" />
              Member Progress
              <Badge variant="secondary" className="ml-auto">{members.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {members.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium text-sm">No members found</p>
              </div>
            ) : (
              <div className="divide-y">
                {members.map((m) => {
                  const completedCount = m.lessonCount ?? 0;
                  const totalLessons = lessons.length;
                  const pct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
                  return (
                    <div key={m.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/60 transition-colors">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="text-xs font-semibold bg-[#B3CFE5] text-[#1A3D63]">
                          {getInitials(m.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-[#0A1931]">{m.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#1A3D63] rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {completedCount}/{totalLessons}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost" size="icon"
                        className="h-7 w-7 text-slate-400 hover:text-[#1A3D63] shrink-0"
                        onClick={() => openMemberProgress(m)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Lesson Dialog */}
      <Dialog open={lessonDialog} onOpenChange={setLessonDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingLesson ? "Edit Lesson" : "Add New Lesson"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveLesson} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="lesson-title">Title *</Label>
              <Input
                id="lesson-title"
                value={lessonForm.title}
                onChange={(e) => setLessonForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Who is Jesus?"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lesson-desc">Description <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
              <Textarea
                id="lesson-desc"
                value={lessonForm.description}
                onChange={(e) => setLessonForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Brief description of this lesson..."
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lesson-order">Order</Label>
              <Input
                id="lesson-order"
                type="number"
                min={0}
                value={lessonForm.order}
                onChange={(e) => setLessonForm((p) => ({ ...p, order: e.target.value }))}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setLessonDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending} className="bg-[#1A3D63] hover:bg-[#0A1931] text-white">
                {isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Saving…</> : editingLesson ? "Save Changes" : "Add Lesson"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Member Lesson Progress Dialog */}
      <Dialog open={progressDialog} onOpenChange={setProgressDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs font-semibold bg-[#B3CFE5] text-[#1A3D63]">
                  {selectedMember ? getInitials(selectedMember.name) : ""}
                </AvatarFallback>
              </Avatar>
              {selectedMember?.name} — Lesson Progress
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-1">
            {loadingProgress ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : sortedLessons.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No lessons created yet.</p>
            ) : (
              sortedLessons.map((lesson, i) => {
                const done = completedIds.has(lesson.id);
                return (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => handleToggleLesson(lesson.id)}
                    disabled={isPending}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                      done ? "bg-green-50 hover:bg-green-100" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      done ? "bg-green-500 border-green-500" : "border-slate-300"
                    }`}>
                      {done && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm font-medium ${done ? "text-green-700" : "text-slate-700"}`}>
                        {i + 1}. {lesson.title}
                      </span>
                      {lesson.description && (
                        <p className="text-xs text-muted-foreground truncate">{lesson.description}</p>
                      )}
                    </div>
                    {done && (
                      <span className="text-xs text-green-600 shrink-0">Done</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
          {!loadingProgress && sortedLessons.length > 0 && (
            <div className="pt-2 border-t text-sm text-muted-foreground text-center">
              {completedIds.size} of {sortedLessons.length} lessons completed
              {sortedLessons.length > 0 && (
                <span className="ml-1">({Math.round((completedIds.size / sortedLessons.length) * 100)}%)</span>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4 space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="font-semibold text-[#0A1931]">Delete Lesson</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  This will remove the lesson and all member progress records for it.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setDeleteId(null)}>Cancel</Button>
              <Button
                size="sm"
                className="bg-red-500 hover:bg-red-600 text-white"
                onClick={handleDeleteLesson}
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
