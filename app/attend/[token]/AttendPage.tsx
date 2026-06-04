"use client";

import { useState, useTransition, useEffect } from "react";

interface Member { id: string; name: string; }
interface Status { id: string; name: string; }
interface SessionInfo { date: string; serviceType: string; }

interface Props { token: string; }

const AGE_BRACKETS = ["C1", "C2", "C3"] as const;

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-PH", {
    month: "long", day: "numeric", year: "numeric", weekday: "long",
  });
}

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export function AttendPage({ token }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);

  // Search
  const [search, setSearch] = useState("");

  // Confirm existing member
  const [selected, setSelected] = useState<Member | null>(null);
  const [confirming, setConfirming] = useState(false);

  // Register new member
  const [showRegister, setShowRegister] = useState(false);
  const [form, setForm] = useState({
    name: "", contact: "", age: "", ageBracket: "", address: "",
  });

  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ type: "success" | "duplicate"; name: string; registered?: boolean; newMember?: Member } | null>(null);

  useEffect(() => {
    fetch(`/api/attend/${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) { setError(data.error ?? "Something went wrong"); return; }
        setSession(data.session);
        setMembers(data.members);
        setStatuses(data.statuses ?? []);
      })
      .catch(() => setError("Failed to load. Please check your connection."))
      .finally(() => setLoading(false));
  }, [token]);

  function handleSelect(member: Member) {
    setSelected(member);
    setConfirming(true);
  }

  function handleConfirm() {
    if (!selected) return;
    startTransition(async () => {
      const res = await fetch(`/api/attend/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: selected.id }),
      });
      const data = await res.json();
      if (data.alreadyMarked) setResult({ type: "duplicate", name: data.memberName });
      else if (data.success) setResult({ type: "success", name: data.memberName });
      else setError(data.error ?? "Failed to record attendance.");
      setConfirming(false);
    });
  }

  function handleRegister() {
    if (!form.name.trim() || !form.address.trim()) return;
    const defaultStatusId = statuses[0]?.id ?? "";
    if (!defaultStatusId) return;

    startTransition(async () => {
      const res = await fetch(`/api/attend/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register",
          name: form.name,
          contact: form.contact || undefined,
          age: form.age ? parseInt(form.age) : undefined,
          ageBracket: form.ageBracket || undefined,
          address: form.address,
          statusId: defaultStatusId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const newMember: Member = { id: data.memberId, name: data.memberName };
        setMembers((prev) =>
          [...prev, newMember].sort((a, b) => a.name.localeCompare(b.name))
        );
        setResult({ type: "success", name: data.memberName, registered: true, newMember });
      } else {
        setError(data.error ?? "Failed to register.");
      }
    });
  }

  const filtered = members.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm">Loading session…</p>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-sm w-full bg-white rounded-2xl shadow-sm border border-red-100 p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 110 18A9 9 0 0112 3z" />
            </svg>
          </div>
          <p className="font-semibold text-slate-800">{error}</p>
        </div>
      </div>
    );
  }

  // ── Success / Already checked in ──────────────────────────────────────────
  if (result) {
    const isSuccess = result.type === "success";
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-sm w-full bg-white rounded-2xl shadow-sm border p-8 text-center space-y-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${isSuccess ? "bg-green-100" : "bg-blue-100"}`}>
            {isSuccess ? (
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 3a9 9 0 110 18A9 9 0 0112 3z" />
              </svg>
            )}
          </div>
          <div>
            <p className="text-lg font-bold text-slate-800">
              {isSuccess ? (result.registered ? "Welcome to the Church!" : "Attendance Recorded!") : "Already Checked In"}
            </p>
            <p className="text-slate-500 mt-1 text-sm">
              {isSuccess
                ? result.registered
                  ? `Hi ${result.name}! You've been registered and your attendance for ${session?.serviceType} has been recorded.`
                  : `Welcome, ${result.name}! Your attendance for ${session?.serviceType} has been recorded.`
                : `${result.name}, you're already marked present for this session.`}
            </p>
          </div>
          {session && <p className="text-xs text-slate-400">{fmtDate(session.date)}</p>}
          <button
            onClick={() => {
              setResult(null);
              setSelected(null);
              setSearch(result?.newMember?.name ?? "");
              setShowRegister(false);
              setForm({ name: "", contact: "", age: "", ageBracket: "", address: "" });
            }}
            className="text-sm text-blue-600 hover:underline"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  // ── Confirm existing member ────────────────────────────────────────────────
  if (confirming && selected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-sm w-full bg-white rounded-2xl shadow-sm border p-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto text-xl font-bold text-blue-600">
            {getInitials(selected.name)}
          </div>
          <div>
            <p className="text-slate-500 text-sm">Confirm attendance for</p>
            <p className="text-xl font-bold text-slate-800 mt-1">{selected.name}</p>
            {session && <p className="text-sm text-slate-500 mt-1">{session.serviceType} · {fmtDate(session.date)}</p>}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setConfirming(false); setSelected(null); }}
              disabled={isPending}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isPending}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isPending && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {isPending ? "Saving…" : "Confirm"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Register form ──────────────────────────────────────────────────────────
  if (showRegister) {
    const canSubmit = form.name.trim() && form.address.trim() && !isPending;
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="max-w-md mx-auto space-y-5">
          {/* Header */}
          <div className="bg-white rounded-2xl border shadow-sm p-5 text-center">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest">Word of Hope Sta. Clara</p>
            <h1 className="text-lg font-bold text-slate-800 mt-1">Register & Check In</h1>
            {session && <p className="text-xs text-slate-500 mt-0.5">{session.serviceType} · {fmtDate(session.date)}</p>}
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl border shadow-sm p-5 space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Juan dela Cruz"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Facebook Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Facebook Name <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="Your Facebook name"
                value={form.contact}
                onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Age + Age Bracket */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Age <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="number"
                  placeholder="e.g. 22"
                  min={1}
                  max={120}
                  value={form.age}
                  onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Age Bracket <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <select
                  value={form.ageBracket}
                  onChange={(e) => setForm((f) => ({ ...f, ageBracket: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">—</option>
                  {AGE_BRACKETS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Barangay, Municipality, Province"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowRegister(false)}
              disabled={isPending}
              className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors text-sm"
            >
              Back
            </button>
            <button
              onClick={handleRegister}
              disabled={!canSubmit}
              className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm flex items-center justify-center gap-2"
            >
              {isPending && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {isPending ? "Registering…" : "Register & Check In"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main search view ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="max-w-md mx-auto space-y-5">
        {/* Header */}
        <div className="bg-white rounded-2xl border shadow-sm p-5 text-center">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest">Word of Hope Sta. Clara</p>
          <h1 className="text-xl font-bold text-slate-800 mt-1">{session?.serviceType}</h1>
          {session && <p className="text-sm text-slate-500 mt-0.5">{fmtDate(session.date)}</p>}
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl border shadow-sm p-4">
          <p className="text-sm font-medium text-slate-700 mb-3">Search your name to record attendance</p>
          <div className="relative">
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Type your name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>
        </div>

        {/* Results */}
        {search.length > 0 && (
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            {filtered.length === 0 ? (
              <div className="p-6 text-center space-y-3">
                <p className="text-sm text-slate-500">No member found matching <span className="font-medium">&quot;{search}&quot;</span></p>
                <button
                  onClick={() => { setShowRegister(true); setForm((f) => ({ ...f, name: search })); }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Register & Check In
                </button>
              </div>
            ) : (
              <>
                <div className="divide-y divide-slate-100">
                  {filtered.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => handleSelect(m)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left"
                    >
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600 shrink-0">
                        {getInitials(m.name)}
                      </div>
                      <span className="text-sm font-medium text-slate-800">{m.name}</span>
                    </button>
                  ))}
                </div>
                {/* Can't find name option */}
                <div className="border-t border-slate-100 px-4 py-3 text-center">
                  <p className="text-xs text-slate-400 mb-2">Hindi mo makita ang pangalan mo?</p>
                  <button
                    onClick={() => { setShowRegister(true); setForm((f) => ({ ...f, name: search })); }}
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    Register & Check In
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {search.length === 0 && (
          <p className="text-center text-xs text-slate-400">{members.length} members registered</p>
        )}
      </div>

      {/* Floating add button */}
      <button
        onClick={() => { setShowRegister(true); setForm({ name: "", contact: "", age: "", ageBracket: "", address: "" }); }}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center"
        title="Register new member"
      >
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
}
