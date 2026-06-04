"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, Calendar, Eye, EyeOff, Loader2 } from "lucide-react";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Event {
  id: string;
  title: string;
  date: Date;
  description: string | null;
  image: string | null;
  category: string;
  location: string | null;
  published: boolean;
}

export function EventsCMS({ initialEvents }: { initialEvents: Event[] }) {
  const [events, setEvents] = useState(initialEvents);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Event | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const [form, setForm] = useState({
    title: "", date: "", description: "", image: "",
    category: "General", location: "", published: false,
  });

  function openAdd() {
    setEditing(null);
    setForm({ title: "", date: "", description: "", image: "", category: "General", location: "", published: false });
    setOpen(true);
  }

  function openEdit(e: Event) {
    setEditing(e);
    setForm({
      title: e.title,
      date: new Date(e.date).toISOString().split("T")[0],
      description: e.description ?? "",
      image: e.image ?? "",
      category: e.category,
      location: e.location ?? "",
      published: e.published,
    });
    setOpen(true);
  }

  function setF(key: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const method = editing ? "PATCH" : "POST";
        const url = editing ? `/api/cms/events/${editing.id}` : "/api/cms/events";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });

        if (!res.ok) throw new Error("Failed");
        const data = await res.json();

        if (editing) {
          setEvents((prev) => prev.map((ev) => ev.id === editing.id ? data : ev));
          toast({ title: "Event updated" });
        } else {
          setEvents((prev) => [data, ...prev]);
          toast({ title: "Event created" });
        }
        setOpen(false);
      } catch {
        toast({ title: "Error saving event", variant: "destructive" } as Parameters<typeof toast>[0]);
      }
    });
  }

  function handleDelete(ev: Event) {
    if (!confirm("Delete this event?")) return;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/cms/events/${ev.id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed");
        if (ev.image?.startsWith("/uploads/")) {
          await fetch("/api/upload", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ filePath: ev.image }) });
        }
        setEvents((prev) => prev.filter((e) => e.id !== ev.id));
        toast({ title: "Event deleted" });
      } catch {
        toast({ title: "Error deleting event", variant: "destructive" } as Parameters<typeof toast>[0]);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{events.length} events</p>
        <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4" /> Add Event</Button>
      </div>

      {events.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No events yet.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {events.map((ev) => (
            <Card key={ev.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                  <Calendar className="h-5 w-5 text-blue-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-medium truncate">{ev.title}</p>
                    <Badge variant={ev.published ? "success" : "secondary"} className="text-xs shrink-0">
                      {ev.published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(ev.date)} {ev.location ? `• ${ev.location}` : ""}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(ev)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost" size="icon"
                    className="h-8 w-8 text-red-500 hover:bg-red-50"
                    onClick={() => handleDelete(ev)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Event" : "Add Event"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setF("title", e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Date *</Label>
                <Input type="datetime-local" value={form.date} onChange={(e) => setF("date", e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Input value={form.category} onChange={(e) => setF("category", e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Input value={form.location} onChange={(e) => setF("location", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Event Photo</Label>
              <ImageUpload value={form.image} onChange={(url) => setF("image", url)} aspectRatio="video" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setF("description", e.target.value)} rows={3} />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setF("published", !form.published)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.published ? "bg-blue-600" : "bg-slate-200"}`}
              >
                <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${form.published ? "translate-x-6" : "translate-x-1"}`} />
              </button>
              <Label>Published</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
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
