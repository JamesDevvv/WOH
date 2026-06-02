"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, Loader2, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface Testimonial {
  id: string;
  name: string;
  message: string;
  image: string | null;
  published: boolean;
}

export function TestimonialsCMS({ initialTestimonials }: { initialTestimonials: Testimonial[] }) {
  const [items, setItems] = useState(initialTestimonials);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", message: "", image: "", published: true });

  function openAdd() { setEditing(null); setForm({ name: "", message: "", image: "", published: true }); setOpen(true); }
  function openEdit(t: Testimonial) { setEditing(t); setForm({ name: t.name, message: t.message, image: t.image ?? "", published: t.published }); setOpen(true); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const method = editing ? "PATCH" : "POST";
        const url = editing ? `/api/cms/testimonials/${editing.id}` : "/api/cms/testimonials";
        const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        if (editing) { setItems((p) => p.map((t) => t.id === editing.id ? data : t)); toast({ title: "Updated" }); }
        else { setItems((p) => [data, ...p]); toast({ title: "Added" }); }
        setOpen(false);
      } catch { toast({ title: "Error", variant: "destructive" } as Parameters<typeof toast>[0]); }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this testimonial?")) return;
    startTransition(async () => {
      try {
        await fetch(`/api/cms/testimonials/${id}`, { method: "DELETE" });
        setItems((p) => p.filter((t) => t.id !== id));
        toast({ title: "Deleted" });
      } catch { toast({ title: "Error", variant: "destructive" } as Parameters<typeof toast>[0]); }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{items.length} testimonials</p>
        <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4" /> Add Testimonial</Button>
      </div>

      {items.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No testimonials yet.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map((t) => (
            <Card key={t.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <Quote className="h-4 w-4 text-blue-400" />
                    <p className="font-medium">{t.name}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant={t.published ? "success" : "secondary"} className="text-xs">{t.published ? "Live" : "Hidden"}</Badge>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(t)}><Pencil className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-50" onClick={() => handleDelete(t.id)} disabled={isPending}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3">&ldquo;{t.message}&rdquo;</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Testimonial" : "Add Testimonial"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required /></div>
            <div className="space-y-1.5"><Label>Message *</Label><Textarea value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} rows={4} required /></div>
            <div className="space-y-1.5"><Label>Photo URL</Label><Input value={form.image} onChange={(e) => setForm((p) => ({ ...p, image: e.target.value }))} placeholder="https://..." /></div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setForm((p) => ({ ...p, published: !p.published }))} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.published ? "bg-blue-600" : "bg-slate-200"}`}>
                <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${form.published ? "translate-x-6" : "translate-x-1"}`} />
              </button>
              <Label>Published</Label>
            </div>
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
