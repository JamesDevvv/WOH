"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Pencil, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/ui/ImageUpload";
import Image from "next/image";
import { Loader2 } from "lucide-react";

interface GalleryItem {
  id: string;
  imageUrl: string;
  caption: string | null;
  category: string;
  order: number;
}

const emptyForm = { imageUrl: "", caption: "", category: "General", order: "0" };

export function GalleryCMS({ initialGallery }: { initialGallery: GalleryItem[] }) {
  const [gallery, setGallery] = useState(initialGallery);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<GalleryItem | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [form, setForm] = useState(emptyForm);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(g: GalleryItem) {
    setEditing(g);
    setForm({ imageUrl: g.imageUrl, caption: g.caption ?? "", category: g.category, order: String(g.order) });
    setOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const method = editing ? "PATCH" : "POST";
        const url = editing ? `/api/cms/gallery/${editing.id}` : "/api/cms/gallery";

        // If editing and imageUrl changed, old file is already deleted by ImageUpload
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, order: parseInt(form.order) }),
        });
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        if (editing) {
          setGallery((p) => p.map((g) => g.id === editing.id ? data : g));
          toast({ title: "Photo updated" });
        } else {
          setGallery((p) => [...p, data]);
          toast({ title: "Photo added" });
        }
        setOpen(false);
      } catch {
        toast({ title: "Error saving photo", variant: "destructive" } as Parameters<typeof toast>[0]);
      }
    });
  }

  function handleDelete(item: GalleryItem) {
    if (!confirm("Delete this photo?")) return;
    startTransition(async () => {
      try {
        await fetch(`/api/cms/gallery/${item.id}`, { method: "DELETE" });
        // Delete the file from disk
        if (item.imageUrl?.startsWith("/uploads/")) {
          await fetch("/api/upload", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filePath: item.imageUrl }),
          });
        }
        setGallery((p) => p.filter((g) => g.id !== item.id));
        toast({ title: "Photo deleted" });
      } catch {
        toast({ title: "Error", variant: "destructive" } as Parameters<typeof toast>[0]);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{gallery.length} photos</p>
        <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4" /> Add Photo</Button>
      </div>

      {gallery.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No photos yet.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {gallery.map((g) => (
            <div key={g.id} className="relative group rounded-2xl overflow-hidden bg-slate-100 aspect-square">
              {g.imageUrl ? (
                <Image src={g.imageUrl} alt={g.caption ?? "Gallery"} fill className="object-cover" unoptimized />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-slate-300" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                <p className="text-white text-xs text-center line-clamp-2">{g.caption ?? g.category}</p>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(g)} className="p-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDelete(g)} className="p-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600" disabled={isPending}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Photo" : "Add Photo"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Photo *</Label>
              <ImageUpload
                value={form.imageUrl}
                onChange={(url) => setForm((p) => ({ ...p, imageUrl: url }))}
                aspectRatio="square"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Caption</Label>
                <Input value={form.caption} onChange={(e) => setForm((p) => ({ ...p, caption: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Input value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Display Order</Label>
              <Input type="number" value={form.order} onChange={(e) => setForm((p) => ({ ...p, order: e.target.value }))} min="0" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending || !form.imageUrl}>
                {isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : editing ? "Save Changes" : "Add Photo"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
