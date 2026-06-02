"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface Activity {
  id: string;
  title: string;
  schedule: string;
  description: string | null;
  icon: string | null;
  category: string;
  order: number;
}

export function ActivitiesCMS({ initialActivities }: { initialActivities: Activity[] }) {
  const [activities, setActivities] = useState(initialActivities);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Activity | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const [form, setForm] = useState({ title: "", schedule: "", description: "", icon: "Star", category: "General", order: "0" });

  function openAdd() { setEditing(null); setForm({ title: "", schedule: "", description: "", icon: "Star", category: "General", order: String(activities.length) }); setOpen(true); }
  function openEdit(a: Activity) { setEditing(a); setForm({ title: a.title, schedule: a.schedule, description: a.description ?? "", icon: a.icon ?? "Star", category: a.category, order: String(a.order) }); setOpen(true); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const method = editing ? "PATCH" : "POST";
        const url = editing ? `/api/cms/activities/${editing.id}` : "/api/cms/activities";
        const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, order: parseInt(form.order) }) });
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        if (editing) { setActivities((p) => p.map((a) => a.id === editing.id ? data : a)); toast({ title: "Activity updated" }); }
        else { setActivities((p) => [...p, data]); toast({ title: "Activity created" }); }
        setOpen(false);
      } catch { toast({ title: "Error saving", variant: "destructive" } as Parameters<typeof toast>[0]); }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this activity?")) return;
    startTransition(async () => {
      try {
        await fetch(`/api/cms/activities/${id}`, { method: "DELETE" });
        setActivities((p) => p.filter((a) => a.id !== id));
        toast({ title: "Activity deleted" });
      } catch { toast({ title: "Error deleting", variant: "destructive" } as Parameters<typeof toast>[0]); }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{activities.length} activities</p>
        <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4" /> Add Activity</Button>
      </div>

      {activities.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No activities yet.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {activities.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0 text-lg">{a.icon ?? "⭐"}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.schedule}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(a)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => handleDelete(a.id)} disabled={isPending}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Activity" : "Add Activity"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5"><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Schedule *</Label><Input value={form.schedule} onChange={(e) => setForm((p) => ({ ...p, schedule: e.target.value }))} placeholder="Every Sunday, 9AM" required /></div>
              <div className="space-y-1.5"><Label>Icon (emoji)</Label><Input value={form.icon ?? ""} onChange={(e) => setForm((p) => ({ ...p, icon: e.target.value }))} placeholder="🎵" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Category</Label><Input value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Order</Label><Input type="number" value={form.order} onChange={(e) => setForm((p) => ({ ...p, order: e.target.value }))} /></div>
            </div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>{isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
