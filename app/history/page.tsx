"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/sidebar";
import {
  HiOutlineClock,
  HiOutlineMagnifyingGlass,
  HiOutlineXMark,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineExclamationTriangle,
  HiOutlineSparkles,
  HiOutlineCalendar,
  HiOutlineFunnel,
  HiOutlineTag,
  HiOutlineChatBubbleLeftRight,
} from "react-icons/hi2";

type ThreadLite = {
  id: string;
  title: string;
  preview?: string | null;
  updatedAt: string;
  messageCount?: number;
  lastRecipe?: string | null;
};

type SortOption = "newest" | "oldest" | "title";
type TimeFilter = "all" | "today" | "week" | "month" | "older";

export default function HistoryPage() {
  const router = useRouter();
  const [threads, setThreads] = useState<ThreadLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [showFilters, setShowFilters] = useState(false);

  function goToConversation(id: string) {
    router.push(`/generate?thread=${id}`);
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        // Fetch ALL recorded successful threads (server already excludes unsuccessful)
        const res = await fetch("/api/threads/history?page=1&pageSize=200", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch history");
        const payload = await res.json();

        const raw: any[] = Array.isArray(payload) ? payload : payload.threads || payload.items || [];
        const map = new Map<string, ThreadLite>();
        for (const t of raw) {
          const item: ThreadLite = {
            id: String(t.id),
            title: String(t.title ?? "Untitled"),
            preview: typeof t.preview === "string" ? t.preview : null,
            updatedAt: t.updatedAt || new Date().toISOString(),
            messageCount: Number(t.messageCount ?? 0),
            lastRecipe: t.lastRecipeTitle ?? t.lastRecipe ?? null,
          };
          if (!map.has(item.id)) map.set(item.id, item);
        }
        setThreads(Array.from(map.values()));
      } catch (e: any) {
        setError(e.message || "Error loading history");
        setThreads([]); // keep threads iterable
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function getTimeCategory(dateStr: string): TimeFilter {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "older";
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "today";
    if (diffDays <= 7) return "week";
    if (diffDays <= 30) return "month";
    return "older";
  }

  const filteredAndSortedThreads = useMemo(() => {
    const list = Array.isArray(threads) ? threads : [];
    let filtered = [...list];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.preview || "").toLowerCase().includes(q) ||
          (t.lastRecipe || "").toLowerCase().includes(q)
      );
    }

    if (timeFilter !== "all") {
      filtered = filtered.filter((t) => getTimeCategory(t.updatedAt) === timeFilter);
    }

    filtered.sort((a, b) => {
      if (sortBy === "newest") return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      if (sortBy === "oldest") return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      return a.title.localeCompare(b.title);
    });

    return filtered;
  }, [threads, searchQuery, sortBy, timeFilter]);

  const grouped = useMemo(() => {
    const groups: Record<TimeFilter, ThreadLite[]> = { today: [], week: [], month: [], older: [], all: [] };
    filteredAndSortedThreads.forEach((t) => {
      groups[getTimeCategory(t.updatedAt)].push(t);
    });
    return groups;
  }, [filteredAndSortedThreads]);

  const hasActiveFilters = !!(searchQuery || sortBy !== "newest" || timeFilter !== "all");

  return (
    <div className="flex h-screen overflow-hidden relative bg-gradient-to-br from-emerald-50/30 via-white to-teal-50/20">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2310b981' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      
      <Sidebar />

      <main className="flex-1 h-full overflow-y-auto relative z-10">
        <div className="h-full w-full px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center justify-center h-9 w-9 sm:h-11 sm:w-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg flex-shrink-0">
                <HiOutlineClock className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl lg:text-2xl font-bold text-neutral-900 tracking-tight truncate">
                  Recipe History
                </h1>
                <p className="text-neutral-600 text-[10px] sm:text-xs">
                  {filteredAndSortedThreads.length} {filteredAndSortedThreads.length === 1 ? "conversation" : "conversations"}
                  {hasActiveFilters && " (filtered)"}
                </p>
              </div>
            </div>

            {/* Filter Toggle Button (Mobile) */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="sm:hidden flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border-2 border-neutral-200 bg-white text-neutral-700 font-semibold text-xs hover:border-emerald-300 transition"
            >
              <HiOutlineFunnel className="h-3.5 w-3.5" />
              Filters
            </button>
          </div>

          {/* Search & Filters */}
          <div className={`mb-4 sm:mb-6 space-y-3 sm:space-y-4 ${showFilters ? 'block' : 'hidden sm:block'}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              {/* Search */}
              <div className="relative lg:col-span-2">
                <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-9 sm:pr-10 py-2 sm:py-2.5 rounded-xl border-2 border-neutral-200 bg-white text-xs sm:text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-neutral-100 transition"
                    aria-label="Clear search"
                  >
                    <HiOutlineXMark className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-neutral-400" />
                  </button>
                )}
              </div>

              {/* Sort */}
              <div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full px-3 py-2 sm:py-2.5 rounded-xl border-2 border-neutral-200 bg-white text-xs sm:text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 transition"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="title">A-Z (Title)</option>
                </select>
              </div>

              {/* Time filter */}
              <div>
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
                  className="w-full px-3 py-2 sm:py-2.5 rounded-xl border-2 border-neutral-200 bg-white text-xs sm:text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 transition"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="older">Older</option>
                </select>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-3 sm:px-4 py-2">
                <span className="text-xs sm:text-sm text-emerald-700 font-medium">Filters active</span>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSortBy("newest");
                    setTimeFilter("all");
                  }}
                  className="text-xs sm:text-sm text-emerald-700 font-semibold hover:text-emerald-800 underline transition"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-12 sm:py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
                <span className="text-xs sm:text-sm text-neutral-500 font-medium">Loading history...</span>
              </div>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="bg-rose-50 border-2 border-rose-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-rose-700 text-center font-semibold shadow-lg">
              <div className="flex items-center justify-center gap-2">
                <HiOutlineExclamationTriangle className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                <span className="text-sm sm:text-base">{error}</span>
              </div>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && threads.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[250px] sm:minh-[400px] bg-gradient-to-br from-emerald-50/50 to-white rounded-2xl sm:rounded-3xl border-2 border-dashed border-emerald-200 p-6 sm:p-8">
              <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center mb-3 sm:mb-4">
                <HiOutlineClock className="h-7 w-7 sm:h-8 sm:w-8 text-emerald-600" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-neutral-700 mb-1 sm:mb-2 text-center">
                No conversation history yet
              </h3>
              <p className="text-xs sm:text-sm text-neutral-500 text-center max-w-xs">
                Start generating recipes to see your conversations here!
              </p>
            </div>
          )}

          {/* Groups */}
          {!loading && !error && filteredAndSortedThreads.length > 0 && (
            <div className="space-y-6 sm:space-y-8">
              {(["today", "week", "month", "older"] as TimeFilter[]).map((key) => {
                const group = grouped[key];
                if (!group || group.length === 0) return null;

                const label =
                  key === "today" ? "Today" : key === "week" ? "This Week" : key === "month" ? "This Month" : "Older";

                return (
                  <div key={key} className="space-y-3 sm:space-y-4">
                    <div className="flex items-center gap-2 px-1">
                      <HiOutlineCalendar className="h-4 w-4 text-emerald-600" />
                      <h2 className="text-sm sm:text-base font-bold text-neutral-700">{label}</h2>
                      <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                        {group.length}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                      {group.map((thread) => (
                        <div
                          key={thread.id}
                          className="bg-white rounded-xl sm:rounded-2xl shadow-lg border-2 border-neutral-200 overflow-hidden hover:shadow-xl hover:border-emerald-300 transition-all group cursor-pointer"
                          onClick={() => goToConversation(thread.id)}
                        >
                          <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                            <div className="pb-2 border-b-2 border-emerald-100">
                              <h3 className="text-sm sm:text-base font-bold tracking-tight text-neutral-900 group-hover:text-emerald-700 transition line-clamp-2 mb-1">
                                {thread.title}
                              </h3>
                              {thread.preview && (
                                <p className="text-[10px] sm:text-xs text-neutral-600 line-clamp-2">{thread.preview}</p>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-neutral-600">
                                <HiOutlineChatBubbleLeftRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-500 flex-shrink-0" />
                                <span className="font-semibold">{thread.messageCount || 0} msgs</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-neutral-600">
                                <HiOutlineSparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-500 flex-shrink-0" />
                                <span className="font-semibold truncate">{thread.lastRecipe || "Recipe"}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                              <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-neutral-400">
                                <HiOutlineClock className="h-3 w-3" />
                                {new Date(thread.updatedAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                              <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-emerald-600 font-semibold group-hover:text-emerald-700">
                                <HiOutlineArrowTopRightOnSquare className="h-3 w-3" />
                                Continue
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}