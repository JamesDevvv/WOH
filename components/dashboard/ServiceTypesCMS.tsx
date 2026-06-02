"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  createServiceType,
  updateServiceType,
  deleteServiceType,
} from "@/lib/actions/service-types";

interface ServiceType {
  id: string;
  name: string;
  icon?: string | null;
  order: number;
}

interface Props {
  serviceTypes: ServiceType[];
}

export function ServiceTypesCMS({ serviceTypes: initialServiceTypes }: Props) {
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>(initialServiceTypes);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", icon: "" });
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  function openAdd() {
    setEditingId(null);
    setForm({ name: "", icon: "" });
    setOpenDialog(true);
  }

  function openEdit(st: ServiceType) {
    setEditingId(st.id);
    setForm({ name: st.name, icon: st.icon ?? "" });
    setOpenDialog(true);
  }

  function handleSave() {
    if (!form.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" } as Parameters<typeof toast>[0]);
      return;
    }

    startTransition(async () => {
      try {
        if (editingId) {
          const result = await updateServiceType(editingId, {
            name: form.name.trim(),
            icon: form.icon.trim() || undefined,
          });
          if (result.success) {
            setServiceTypes((prev) =>
              prev.map((st) => (st.id === editingId ? result.serviceType : st))
            );
            toast({ title: "Service type updated" });
          }
        } else {
          const result = await createServiceType({
            name: form.name.trim(),
            icon: form.icon.trim() || undefined,
          });
          if (result.success) {
            setServiceTypes((prev) => [...prev, result.serviceType].sort((a, b) => a.order - b.order));
            toast({ title: "Service type created" });
          }
        }
        setOpenDialog(false);
      } catch (err) {
        toast({
          title: "Error saving service type",
          variant: "destructive",
        } as Parameters<typeof toast>[0]);
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this service type?")) return;
    startTransition(async () => {
      try {
        const result = await deleteServiceType(id);
        if (result.success) {
          setServiceTypes((prev) => prev.filter((st) => st.id !== id));
          toast({ title: "Service type deleted" });
        }
      } catch {
        toast({
          title: "Error deleting service type",
          variant: "destructive",
        } as Parameters<typeof toast>[0]);
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-3 border-b">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Service Types
        </CardTitle>
        <Button
          size="sm"
          variant="outline"
          onClick={openAdd}
          className="gap-1 h-7 text-xs"
          disabled={isPending}
        >
          <Plus className="h-3 w-3" /> New
        </Button>
      </CardHeader>
      <CardContent className="p-4">
        {serviceTypes.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No service types yet</p>
        ) : (
          <div className="space-y-2">
            {serviceTypes.map((st) => (
              <div
                key={st.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{st.name}</p>
                  {st.icon && <p className="text-xs text-muted-foreground mt-0.5">{st.icon}</p>}
                </div>
                <div className="flex gap-2 ml-3 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(st)}
                    disabled={isPending}
                    className="h-7 w-7 p-0"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(st.id)}
                    disabled={isPending}
                    className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Service Type" : "Add Service Type"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input
                placeholder="e.g., Main Service, Prayer Night"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Icon (optional)</Label>
              <Input
                placeholder="e.g., 🎵 or icon name"
                value={form.icon}
                onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingId ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
