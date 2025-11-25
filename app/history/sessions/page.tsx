"use client";
import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/sidebar";
import { HiOutlineClock, HiOutlineInformationCircle, HiOutlineFunnel, HiOutlineCalendarDays } from "react-icons/hi2";

type SessionItem = {
  _id?: string;
  startAt: string | Date;
  endAt?: string | null;
  durationMs?: number | null;
};

function fmtDate(d: string | Date) {
  const dt = new Date(d);
  return dt.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function fmtDuration(ms?: number | null) {
  if (!ms || ms < 0) return "—";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

export default function SessionsHistoryPage() {
  const [items, setItems] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [limit, setLimit] = useState(50);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.set("limit", String(limit));
      if (from) params.set("from", new Date(from).toISOString());
      if (to) params.set("to", new Date(to).toISOString());
      const res = await fetch(`/api/activity/sessions?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load");
      const list: any[] = Array.isArray(data) ? data : data.items || [];
      setItems(list);
    } catch (e: any) {
      setError(e?.message || "Failed to load sessions");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalDuration = useMemo(() => {
    return items.reduce((acc, it) => acc + (it.durationMs || 0), 0);
  }, [items]);

  return (
    <div className="flex h-screen overflow-hidden relative bg-gradient-to-br from-emerald-50/30 via-white to-teal-50/20">
      <Sidebar />
      <main className="flex-1 h-full overflow-y-auto relative z-10">
        <div className="h-full w-full px-3 sm:px-6 lg:px-10 py-4 sm:py-6 lg:py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
                <HiOutlineClock className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-neutral-900">Session History</h1>
                <p className="text-xs text-neutral-600">Showing your recent sessions within the last 30 days.</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-3 sm:p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <HiOutlineFunnel className="h-4 w-4 text-neutral-400" />
              <span className="text-xs font-semibold text-neutral-600">Filters</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              <label className="sm:col-span-2 text-xs text-neutral-600 flex items-center gap-2">
                <HiOutlineCalendarDays className="h-4 w-4 text-neutral-400" />
                <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="flex-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm" />
              </label>
              <label className="sm:col-span-2 text-xs text-neutral-600 flex items-center gap-2">
                <HiOutlineCalendarDays className="h-4 w-4 text-neutral-400" />
                <input type="date" value={to} onChange={e => setTo(e.target.value)} className="flex-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm" />
              </label>
              <div className="flex items-center gap-2">
                <select value={limit} onChange={e => setLimit(Number(e.target.value))} className="border border-neutral-200 rounded-lg px-2 py-2 text-sm">
                  {[25,50,100,200].map(n => <option key={n} value={n}>{n} rows</option>)}
                </select>
                <button onClick={load} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700">Apply</button>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-3 sm:p-4 mb-4 flex items-center gap-3 text-sm text-neutral-700">
            <HiOutlineInformationCircle className="h-5 w-5 text-emerald-600" />
            <span>Total time in sessions: <strong>{fmtDuration(totalDuration)}</strong> across {items.length} sessions</span>
          </div>

          {/* Table */}
          <div className="bg-white border border-neutral-200 rounded-2xl overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="text-left px-4 py-3">Start</th>
                  <th className="text-left px-4 py-3">End</th>
                  <th className="text-left px-4 py-3">Duration</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-4 py-6 text-neutral-400" colSpan={3}>Loading...</td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td className="px-4 py-6 text-rose-600" colSpan={3}>{error}</td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-neutral-500" colSpan={3}>No sessions found</td>
                  </tr>
                ) : (
                  items.map((s, idx) => {
                    const start = fmtDate(s.startAt);
                    const end = s.endAt ? fmtDate(s.endAt) : "In progress";
                    const dur = s.endAt ? fmtDuration(s.durationMs ?? 0) : "—";
                    return (
                      <tr key={(s._id || idx) + "_row"} className="border-t border-neutral-100">
                        <td className="px-4 py-3 text-neutral-800">{start}</td>
                        <td className="px-4 py-3 text-neutral-700">{end}</td>
                        <td className="px-4 py-3 text-neutral-800">{dur}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-[11px] text-neutral-500">Data older than 30 days is automatically deleted and cannot be recovered.</p>
        </div>
      </main>
    </div>
  );
}
