"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Loader2,
  CheckSquare,
  Square,
  CalendarCheck,
  Users,
  ArrowLeft,
  UserPlus,
  Plus,
  Calendar,
  TrendingUp,
  Eye,
  ClipboardList,
  Pencil,
} from "lucide-react";
import { getInitials } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { createMember } from "@/lib/actions/members";
import { getAttendanceForDate, updateAttendance } from "@/lib/actions/attendance";

const SERVICE_BADGE: Record<string, { bg: string; text: string }> = {
  "Main Service":    { bg: "bg-blue-100",   text: "text-blue-700"   },
  "Sunday Service":  { bg: "bg-indigo-100", text: "text-indigo-700" },
  "Prayer Night":    { bg: "bg-purple-100", text: "text-purple-700" },
  "Youth Service":   { bg: "bg-green-100",  text: "text-green-700"  },
  "Bible Study":     { bg: "bg-amber-100",  text: "text-amber-700"  },
  "Special Event":   { bg: "bg-rose-100",   text: "text-rose-700"   },
};

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
function fmtDay(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-PH", { weekday: "long" });
}
function fmtShortMonth(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-PH", { month: "short" });
}

interface Member {
  id: string;
  name: string;
  groupId: string | null;
}

interface Session {
  date: string;
  serviceType: string;
  count: number;
}

interface ServiceType {
  id: string;
  name: string;
  order: number;
}

interface AttRecord {
  memberId: string;
  member: { id: string; name: string };
  groupId: string | null;
}

interface Props {
  members: Member[];
  groups: { id: string; name: string; color: string }[];
  statuses: { id: string; name: string; color: string }[];
  sessions: Session[];
  serviceTypes: ServiceType[];
}

export function AttendanceClient({
  members: initialMembers,
  groups,
  statuses,
  sessions: initialSessions,
  serviceTypes,
}: Props) {
  const today = new Date().toISOString().split("T")[0];

  // â”€â”€ Views â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [view, setView] = useState<"home" | "marking" | "detail">("home");

  // â”€â”€ Sessions list â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [sessions, setSessions] = useState<Session[]>(initialSessions);

  // â”€â”€ New session dialog â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [setupOpen, setSetupOpen] = useState(false);
  const [date, setDate] = useState(today);
  const [serviceType, setServiceType] = useState(serviceTypes[0]?.name || "Main Service");

  // â”€â”€ Marking state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [allMembers, setAllMembers] = useState<Member[]>(initialMembers);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");

  // â”€â”€ Walk-in â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [walkInForm, setWalkInForm] = useState({
    name: "",
    contact: "",
    address: "",
    statusId: statuses[0]?.id ?? "",
  });
  const [walkInPending, startWalkInTransition] = useTransition();

  // â”€â”€ Detail view â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [detailSession, setDetailSession] = useState<Session | null>(null);
  const [detailRecords, setDetailRecords] = useState<AttRecord[]>([]);
  const [detailSearch, setDetailSearch] = useState("");
  const [detailPending, startDetailTransition] = useTransition();
  const [isEditingDetail, setIsEditingDetail] = useState(false);
  const [editingIds, setEditingIds] = useState<Set<string>>(new Set());
  const [editSavePending, startEditSaveTransition] = useTransition();

  // â”€â”€ Save â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [savePending, startSaveTransition] = useTransition();
  const { toast } = useToast();

  // â”€â”€ Computed â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const currentMonthKey = today.slice(0, 7);
  const thisMonthCount = sessions.filter((s) => s.date.startsWith(currentMonthKey)).length;
  const avgAttendance =
    sessions.length > 0
      ? Math.round(sessions.reduce((a, s) => a + s.count, 0) / sessions.length)
      : 0;
  const lastSession = sessions[0] ?? null;

  const filtered = allMembers.filter((m) => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());
    const matchGroup = groupFilter === "all" || m.groupId === groupFilter;
    return matchSearch && matchGroup;
  });

  // â”€â”€ Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function beginAttendance() {
    setSetupOpen(false);
    setSelectedIds(new Set());
    setSearch("");
    setGroupFilter("all");
    setView("marking");
  }

  function openDetail(session: Session) {
    setDetailSession(session);
    setDetailRecords([]);
    setDetailSearch("");
    setView("detail");
    setIsEditingDetail(false);
    setEditingIds(new Set());
    startDetailTransition(async () => {
      const records = await getAttendanceForDate(session.date, session.serviceType);
      setDetailRecords(records as unknown as AttRecord[]);
      setEditingIds(new Set((records as unknown as AttRecord[]).map((r) => r.memberId)));
    });
  }

  function toggleEditDetail(id: string) {
    setEditingIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function saveEditDetail() {
    if (!detailSession) return;
    startEditSaveTransition(async () => {
      try {
        const result = await updateAttendance(
          detailSession.date,
          detailSession.serviceType,
          Array.from(editingIds)
        );
        if (result.success) {
          setSessions((prev) =>
            prev.map((s) =>
              s.date === detailSession.date && s.serviceType === detailSession.serviceType
                ? { ...s, count: editingIds.size }
                : s
            )
          );
          setDetailRecords(
            allMembers
              .filter((m) => editingIds.has(m.id))
              .map((m) => ({
                memberId: m.id,
                member: { id: m.id, name: m.name },
                groupId: m.groupId,
              }))
          );
          setIsEditingDetail(false);
          toast({ title: `Attendance updated: ${editingIds.size} members marked present` });
        }
      } catch {
        toast({
          title: "Error updating attendance",
          variant: "destructive",
        } as Parameters<typeof toast>[0]);
      }
    });
  }

  function handleAddWalkIn() {
    startWalkInTransition(async () => {
      try {
        const result = await createMember({
          name: walkInForm.name.trim(),
          contact: walkInForm.contact.trim() || undefined,
          address: walkInForm.address.trim(),
          statusId: walkInForm.statusId,
        });
        if (result.success && result.member) {
          const newMember: Member = {
            id: result.member.id,
            name: result.member.name,
            groupId: null,
          };
          setAllMembers((prev) =>
            [...prev, newMember].sort((a, b) => a.name.localeCompare(b.name))
          );
          setSelectedIds((prev) => new Set([...prev, result.member.id]));
          setWalkInOpen(false);
          setWalkInForm({ name: "", contact: "", address: "", statusId: statuses[0]?.id ?? "" });
          toast({ title: `${result.member.name} added and marked present` });
        }
      } catch {
        toast({
          title: "Failed to add member",
          variant: "destructive",
        } as Parameters<typeof toast>[0]);
      }
    });
  }

  function saveAttendance() {
    startSaveTransition(async () => {
      try {
        const res = await fetch("/api/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            memberIds: Array.from(selectedIds),
            date,
            serviceType,
            groupId: groupFilter !== "all" ? groupFilter : undefined,
          }),
        });
        if (!res.ok) throw new Error("Failed");

        setSessions((prev) => {
          const idx = prev.findIndex(
            (s) => s.date === date && s.serviceType === serviceType
          );
          const updated: Session = { date, serviceType, count: selectedIds.size };
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = updated;
            return next;
          }
          return [updated, ...prev].sort((a, b) => b.date.localeCompare(a.date));
        });

        toast({
          title: "Attendance saved!",
          description: `${selectedIds.size} members marked for ${serviceType}`,
        });
        setView("home");
      } catch {
        toast({
          title: "Error saving attendance",
          variant: "destructive",
        } as Parameters<typeof toast>[0]);
      }
    });
  }

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // HOME VIEW
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  if (view === "home") {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Attendance</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Track and manage service attendance records
            </p>
          </div>
          <Button onClick={() => setSetupOpen(true)} className="shrink-0">
            <Plus className="h-4 w-4" />
            New Session
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                <ClipboardList className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none">{sessions.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Sessions</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                <Calendar className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none">{thisMonthCount}</p>
                <p className="text-xs text-muted-foreground mt-1">This Month</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none">{avgAttendance || "N/A"}</p>
                <p className="text-xs text-muted-foreground mt-1">Avg Attendance</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                <CalendarCheck className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none">
                  {lastSession
                    ? fmtDay(lastSession.date).slice(0, 3) + " " + lastSession.date.slice(8)
                    : "N/A"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Last Session</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sessions list */}
        <Card>
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Sessions History
            </CardTitle>
            <span className="text-xs text-muted-foreground">{sessions.length} session{sessions.length !== 1 ? "s" : ""}</span>
          </CardHeader>
          <CardContent className="p-0">
            {sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                  <CalendarCheck className="h-7 w-7 opacity-40" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-foreground">No sessions yet</p>
                  <p className="text-sm mt-0.5">Start by recording a new attendance session</p>
                </div>
                <Button variant="outline" onClick={() => setSetupOpen(true)} className="mt-1">
                  <Plus className="h-4 w-4" /> New Session
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-[--border]">
                {sessions.map((s, i) => {
                  const badge = SERVICE_BADGE[s.serviceType] ?? { bg: "bg-gray-100", text: "text-gray-700" };
                  return (
                    <div
                      key={`${s.date}-${s.serviceType}-${i}`}
                      className="flex items-center gap-4 px-6 py-4 hover:bg-muted/40 transition-colors"
                    >
                      {/* Date block */}
                      <div className="w-11 shrink-0 text-center">
                        <p className="text-xl font-bold leading-none">{s.date.slice(8)}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 uppercase tracking-wide">
                          {fmtShortMonth(s.date)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {s.date.slice(0, 4)}
                        </p>
                      </div>

                      <div className="w-px h-10 bg-border shrink-0" />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}
                          >
                            {s.serviceType}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {fmtDay(s.date)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{fmtDate(s.date)}</p>
                      </div>

                      {/* Count */}
                      <div className="text-right shrink-0 hidden sm:block mr-2">
                        <p className="text-lg font-bold">{s.count}</p>
                        <p className="text-xs text-muted-foreground">present</p>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDetail(s)}
                        className="shrink-0 gap-1.5"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* New Session Dialog */}
        <Dialog open={setupOpen} onOpenChange={setSetupOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarCheck className="h-4 w-4" />
                New Attendance Session
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Service Type</Label>
                <Select value={serviceType} onValueChange={setServiceType}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceTypes.map((s) => (
                      <SelectItem key={s.id} value={s.name}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSetupOpen(false)}>
                Cancel
              </Button>
              <Button onClick={beginAttendance}>
                <Users className="h-4 w-4" />
                Begin Attendance
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // MARKING VIEW
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  if (view === "marking") {
    const badge = SERVICE_BADGE[serviceType] ?? { bg: "bg-gray-100", text: "text-gray-700" };
    const rate =
      allMembers.length > 0
        ? Math.round((selectedIds.size / allMembers.length) * 100)
        : 0;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView("home")}
              className="gap-1 -ml-2 mb-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground">{serviceType}</h1>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${badge.bg} ${badge.text}`}>
                {serviceType}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {fmtDay(date)},{" "}
              {new Date(date + "T00:00:00").toLocaleDateString("en-PH", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <Button onClick={saveAttendance} disabled={savePending} size="lg">
            {savePending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <CalendarCheck className="h-4 w-4" /> Save ({selectedIds.size})
              </>
            )}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{allMembers.length}</p>
                <p className="text-xs text-muted-foreground">Total Members</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
                <CheckSquare className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{selectedIds.size}</p>
                <p className="text-xs text-muted-foreground">Marked Present</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
                <Square className="h-4 w-4 text-red-500" />
              </div>
              <div>
                <p className="text-xl font-bold">{allMembers.length - selectedIds.size}</p>
                <p className="text-xs text-muted-foreground">Absent</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{rate}%</p>
                <p className="text-xs text-muted-foreground">Attendance Rate</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="space-y-1.5 flex-1 min-w-40">
                <Label>Search</Label>
                <Input
                  placeholder="Search member…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Group</Label>
                <Select value={groupFilter} onValueChange={setGroupFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Groups</SelectItem>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedIds(new Set(filtered.map((m) => m.id)))}
              >
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedIds(new Set())}>
                Clear
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setWalkInOpen(true)}
                className="gap-1.5 border-dashed"
              >
                <UserPlus className="h-4 w-4" />
                Add Walk-in
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Member grid */}
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {filtered.length} member{filtered.length !== 1 ? "s" : ""}
              {search || groupFilter !== "all" ? " (filtered)" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 mt-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-0">
              {filtered.map((m) => {
                const isPresent = selectedIds.has(m.id);
                const group = groups.find((g) => g.id === m.groupId);
                return (
                  <button
                    key={m.id}
                    onClick={() => toggle(m.id)}
                    className={`flex items-center gap-3 px-4 py-3 border-b border-r border-border text-left transition-colors ${
                      isPresent ? "bg-green-50" : "hover:bg-muted/50"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                        isPresent
                          ? "bg-green-500 border-green-500 text-white"
                          : "border-border"
                      }`}
                    >
                      {isPresent && (
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback
                        className={`text-xs font-semibold ${
                          isPresent
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {getInitials(m.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-medium truncate ${
                          isPresent ? "text-green-800" : ""
                        }`}
                      >
                        {m.name}
                      </p>
                      {group && (
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-full"
                          style={{
                            backgroundColor: group.color + "20",
                            color: group.color,
                          }}
                        >
                          {group.name}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <div className="col-span-3 p-10 text-center text-muted-foreground">
                  No members found
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Save bottom */}
        <div className="flex justify-end">
          <Button onClick={saveAttendance} disabled={savePending} size="lg">
            {savePending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <CalendarCheck className="h-4 w-4" /> Save Attendance ({selectedIds.size})
              </>
            )}
          </Button>
        </div>

        {/* Walk-in Dialog */}
        <Dialog open={walkInOpen} onOpenChange={setWalkInOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Add Walk-in Member
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="Full name"
                  value={walkInForm.name}
                  onChange={(e) => setWalkInForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Contact</Label>
                <Input
                  placeholder="Phone number (optional)"
                  value={walkInForm.contact}
                  onChange={(e) =>
                    setWalkInForm((f) => ({ ...f, contact: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>
                  Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="Barangay, Municipality, Province"
                  value={walkInForm.address}
                  onChange={(e) =>
                    setWalkInForm((f) => ({ ...f, address: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>
                  Status <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={walkInForm.statusId}
                  onValueChange={(v) => setWalkInForm((f) => ({ ...f, statusId: v }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setWalkInOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddWalkIn}
                disabled={
                  walkInPending || !walkInForm.name.trim() || !walkInForm.address.trim() || !walkInForm.statusId
                }
              >
                {walkInPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Add & Mark Present
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // DETAIL VIEW
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  if (view === "detail" && detailSession) {
    const badge =
      SERVICE_BADGE[detailSession.serviceType] ?? { bg: "bg-gray-100", text: "text-gray-700" };
    const attendedIds = isEditingDetail
      ? editingIds
      : new Set(detailRecords.map((r) => r.memberId));

    const searchedMembers = detailSearch
      ? allMembers.filter((m) =>
          m.name.toLowerCase().includes(detailSearch.toLowerCase())
        )
      : allMembers;

    const presentMembers = searchedMembers.filter((m) => attendedIds.has(m.id));
    const absentMembers = searchedMembers.filter((m) => !attendedIds.has(m.id));
    const rate =
      allMembers.length > 0
        ? Math.round(((isEditingDetail ? editingIds.size : detailRecords.length) / allMembers.length) * 100)
        : 0;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView("home")}
            className="gap-1 -ml-2 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sessions
          </Button>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-foreground">
                  {detailSession.serviceType}
                </h1>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${badge.bg} ${badge.text}`}
                >
                  {detailSession.serviceType}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {fmtDay(detailSession.date)}, {fmtDate(detailSession.date)}
              </p>
            </div>
            <div className="flex gap-2">
              {isEditingDetail ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditingDetail(false);
                      setEditingIds(new Set(detailRecords.map((r) => r.memberId)));
                    }}
                    disabled={editSavePending}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={saveEditDetail}
                    disabled={editSavePending}
                  >
                    {editSavePending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setIsEditingDetail(true)}
                  className="gap-1.5"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
                <CheckSquare className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xl font-bold">
                  {detailPending ? "…" : (isEditingDetail ? editingIds.size : detailRecords.length)}
                </p>
                <p className="text-xs text-muted-foreground">Present</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
                <Square className="h-4 w-4 text-red-500" />
              </div>
              <div>
                <p className="text-xl font-bold">
                  {detailPending ? "…" : (allMembers.length - (isEditingDetail ? editingIds.size : detailRecords.length))}
                </p>
                <p className="text-xs text-muted-foreground">Absent</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{allMembers.length}</p>
                <p className="text-xs text-muted-foreground">Total Members</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{detailPending ? "…" : `${rate}%`}</p>
                <p className="text-xs text-muted-foreground">Attendance Rate</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="max-w-xs">
          <Input
            placeholder="Search member…"
            value={detailSearch}
            onChange={(e) => setDetailSearch(e.target.value)}
          />
        </div>

        {/* Present */}
        <Card>
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-green-600" />
              Present
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              {detailPending ? "…" : `${presentMembers.length} member${presentMembers.length !== 1 ? "s" : ""}`}
            </span>
          </CardHeader>
          <CardContent className="p-0">
            {detailPending ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : presentMembers.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No present members{detailSearch ? " matching search" : ""}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-0">
                {presentMembers.map((m) => {
                  const group = groups.find((g) => g.id === m.groupId);
                  const isEditable = isEditingDetail && editingIds.has(m.id);
                  return (
                    <button
                      key={m.id}
                      onClick={() => isEditingDetail && toggleEditDetail(m.id)}
                      disabled={!isEditingDetail}
                      className={`flex items-center gap-3 px-4 py-3 border-b border-r border-border bg-green-50 transition-colors ${
                        isEditingDetail ? "cursor-pointer hover:bg-green-100" : ""
                      }`}
                    >
                      <div className="w-5 h-5 rounded-md bg-green-500 flex items-center justify-center shrink-0">
                        <svg
                          className="h-3 w-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="text-xs font-semibold bg-green-100 text-green-700">
                          {getInitials(m.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 text-left">
                        <p className="text-sm font-medium truncate text-green-800">{m.name}</p>
                        {group && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded-full"
                            style={{ backgroundColor: group.color + "20", color: group.color }}
                          >
                            {group.name}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Absent */}
        {!detailPending && absentMembers.length > 0 && (
          <Card>
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2 text-muted-foreground">
                <Square className="h-4 w-4" />
                Absent
              </CardTitle>
              <span className="text-sm text-muted-foreground">
                {absentMembers.length} member{absentMembers.length !== 1 ? "s" : ""}
              </span>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-0">
                {absentMembers.map((m) => {
                  const group = groups.find((g) => g.id === m.groupId);
                  const isSelected = editingIds.has(m.id);
                  return (
                    <button
                      key={m.id}
                      onClick={() => isEditingDetail && toggleEditDetail(m.id)}
                      disabled={!isEditingDetail}
                      className={`flex items-center gap-3 px-4 py-3 border-b border-r border-border transition-colors ${
                        isSelected && isEditingDetail
                          ? "bg-green-50"
                          : isEditingDetail
                            ? "hover:bg-muted/50 cursor-pointer"
                            : ""
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                        isSelected && isEditingDetail
                          ? "bg-green-500 border-green-500 text-white"
                          : "border-border"
                      }`}>
                        {isSelected && isEditingDetail && (
                          <svg
                            className="h-3 w-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="text-xs font-semibold bg-muted text-muted-foreground">
                          {getInitials(m.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 text-left">
                        <p className={`text-sm font-medium truncate ${
                          isSelected && isEditingDetail ? "text-green-800" : "text-muted-foreground"
                        }`}>
                          {m.name}
                        </p>
                        {group && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded-full"
                            style={{ backgroundColor: group.color + "20", color: group.color }}
                          >
                            {group.name}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return null;
}
