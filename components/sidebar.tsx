"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  HiOutlineSparkles,
  HiOutlinePlus,
  HiOutlineMagnifyingGlass,
  HiOutlineBars3,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineCog6Tooth,
  HiOutlineArrowRightOnRectangle,
  HiOutlineClock,
  HiOutlineChartBar,
  HiOutlineHome,
  HiOutlineBookmark,
} from "react-icons/hi2";
import { useSession, signOut } from "next-auth/react";

// Navigation items
const navItems = [
  { id: "dashboard", label: "Dashboard", icon: HiOutlineHome, href: "/dashboard" },
  { id: "generate", label: "Generate Recipe", icon: HiOutlineSparkles, href: "/generate" },
  { id: "ingredients", label: "Available Ingredients", icon: HiOutlinePlus, href: "/ingredients" },
  { id: "saved", label: "Saved Recipes", icon: HiOutlineBookmark, href: "/saved" },
  { id: "history", label: "History", icon: HiOutlineClock, href: "/history" },
];

type RecentItem = { id: string; title: string; updatedAt: string; preview?: string | null; lastRecipeTitle?: string | null };

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [threads, setThreads] = useState<RecentItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [userMenu, setUserMenu] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const { data: session } = useSession();
  const realUser = session?.user;

  const filteredChats = threads.filter((chat) =>
    chat.title.toLowerCase().includes(search.toLowerCase())
  );

  const displayedChats = search.trim() ? filteredChats : threads.slice(0, 20);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const logoutModalRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenu(false);
      }
    }
    if (userMenu) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [userMenu]);

  // Close logout modal when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (logoutModalRef.current && !logoutModalRef.current.contains(e.target as Node)) {
        setShowLogout(false);
      }
    }
    if (showLogout) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showLogout]);

  // Fetch threads from server
  async function fetchThreads() {
    try {
      setError("");
      const res = await fetch("/api/threads/recent?limit=20", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed recent");
      const data = await res.json();
      const list: any[] = Array.isArray(data) ? data : data.items || [];
      const map = new Map<string, RecentItem>();
      for (const t of list) {
        const item: RecentItem = {
          id: String(t.id),
          title: t.title || "Untitled",
          updatedAt: t.updatedAt || new Date().toISOString(),
          preview: t.preview ?? null,
          lastRecipeTitle: t.lastRecipeTitle ?? null,
        };
        if (!map.has(item.id)) map.set(item.id, item);
      }
      setThreads(Array.from(map.values()));
    } catch (e: any) {
      setError(e.message);
      setThreads([]);
    }
  }

  // Load threads on mount
  useEffect(() => {
    fetchThreads();
    const interval = setInterval(fetchThreads, 5000);
    return () => clearInterval(interval);
  }, []);

  // Listen for custom event from Generate page when threads change
  useEffect(() => {
    const refresh = () => fetchThreads();
    window.addEventListener("threadsUpdated", refresh as EventListener);
    return () => window.removeEventListener("threadsUpdated", refresh as EventListener);
  }, []);

  // Create a brand-new thread
  async function handleNewRecipeClick(e: React.MouseEvent) {
    e.preventDefault();
    const id = `t_${Date.now()}`;
    setActiveId(id);
    window.dispatchEvent(new CustomEvent("threadCreated", { detail: { id } }));
    router.push(`/generate?thread=${id}`);
  }

  // Open existing thread
  function openThread(id: string) {
    setActiveId(id);
    window.dispatchEvent(new CustomEvent("threadSelected", { detail: { id } }));
    router.push(`/generate?thread=${id}`);
  }

  function handleLogout() {
    setShowLogout(false);
    signOut({ callbackUrl: "/auth/login" });
  }

  return (
    <>
      {/* Mobile toggle button */}
      <button
        className="fixed top-4 left-4 z-40 md:hidden bg-white text-neutral-800 p-2 rounded-xl shadow-lg border border-neutral-200 hover:bg-neutral-50 transition"
        aria-label="Open sidebar"
        onClick={() => setOpen(true)}
        style={{ display: open ? "none" : "block" }}
      >
        <HiOutlineBars3 className="w-6 h-6" />
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed z-40 inset-y-0 left-0 flex flex-col
          bg-gradient-to-b from-white via-neutral-50/50 to-white text-neutral-900 font-sans
          transition-all duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:static md:translate-x-0
          ${collapsed ? "md:w-20" : "md:w-80"}
          w-80 h-screen max-h-screen
          border-r border-neutral-200 shadow-xl md:shadow-none
        `}
        aria-label="Sidebar"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-neutral-200 bg-white/80 backdrop-blur-sm">
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 via-emerald-200 to-emerald-100 shadow-md group-hover:shadow-lg transition-all group-hover:scale-105">
                <HiOutlineSparkles className="w-6 h-6 text-emerald-700" />
              </span>
              <div>
                <span className="font-bold text-xl tracking-tight text-neutral-900 bg-gradient-to-r from-emerald-700 to-emerald-600 bg-clip-text text-transparent">
                  FoodFindr
                </span>
                <span className="block text-xs text-neutral-500 font-medium">AI Recipe Generator</span>
              </div>
            </Link>
          )}
          
          {collapsed && (
            <Link href="/dashboard" className="flex items-center justify-center mx-auto group">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 via-emerald-200 to-emerald-100 shadow-md group-hover:shadow-lg transition-all group-hover:scale-105">
                <HiOutlineSparkles className="w-6 h-6 text-emerald-700" />
              </span>
            </Link>
          )}

          <div className="flex items-center gap-2">
            <button
              className="hidden md:block text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 p-2 rounded-lg transition"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? (
                <HiOutlineChevronRight className="w-5 h-5" />
              ) : (
                <HiOutlineChevronLeft className="w-5 h-5" />
              )}
            </button>
            <button
              className="md:hidden text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 p-2 rounded-lg transition"
              aria-label="Close sidebar"
              onClick={() => setOpen(false)}
            >
              <HiOutlineChevronLeft className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* New Recipe Button */}
        <div className={`px-4 pt-5 pb-3 ${collapsed ? "px-3" : ""}`}>
          <a
            href="/generate"
            onClick={handleNewRecipeClick}
            className={`flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 w-full ${
              collapsed ? "px-3 py-3" : "px-4 py-3.5"
            }`}
            title={collapsed ? "New Recipe" : undefined}
          >
            <HiOutlinePlus className="w-5 h-5" />
            {!collapsed && "New Recipe"}
          </a>
        </div>

        {/* Navigation */}
        <nav className={`px-3 py-3 space-y-1 ${collapsed ? "px-2" : ""}`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`
                  flex items-center gap-3 rounded-xl
                  transition-all font-semibold text-sm
                  ${collapsed ? "justify-center px-3 py-3" : "px-4 py-3"}
                  ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100"
                      : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
                  }
                `}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {!collapsed && (
          <>
            {/* Divider */}
            <div className="mx-4 my-3 border-t border-neutral-200"></div>

            {/* Search chats */}
            <div className="px-4 mb-3">
              <div className="relative">
                <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search recipes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white border border-neutral-200 rounded-xl pl-10 pr-3 py-2.5 text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition"
                />
              </div>
            </div>

            {/* Recent Activity */}
            <div className="flex-1 overflow-y-auto px-3">
              <div className="flex items-center gap-2 px-3 mb-3">
                <HiOutlineClock className="w-4 h-4 text-neutral-400" />
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  Recent Activity
                </span>
              </div>
              <ul className="space-y-1.5">
                {displayedChats.length === 0 ? (
                  <li className="px-3 py-10 text-center">
                    <HiOutlineChartBar className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                    <span className="block text-sm text-neutral-400 font-medium">
                      {search.trim() ? "No recipes match your search" : "No recent activity"}
                    </span>
                  </li>
                ) : (
                  displayedChats.map((t) => (
                    <li key={t.id}>
                      <button
                        className={`
                          w-full flex items-start gap-3 px-3 py-3 rounded-xl
                          transition-all text-left group
                          ${
                            activeId === t.id
                              ? "bg-emerald-50 border border-emerald-200 shadow-sm"
                              : "hover:bg-neutral-100"
                          }
                        `}
                        onClick={() => openThread(t.id)}
                      >
                        <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-gradient-to-br from-neutral-100 to-neutral-200 flex-shrink-0 shadow-sm">
                          <span className="text-base">🍳</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-semibold truncate mb-1 ${
                              activeId === t.id
                                ? "text-emerald-700"
                                : "text-neutral-900 group-hover:text-emerald-600"
                            }`}
                          >
                            {t.title}
                          </p>
                          {t.preview && (
                            <p className="text-xs text-neutral-500 line-clamp-1 mb-1">
                              {t.preview}
                            </p>
                          )}
                          <p className="text-[10px] text-neutral-400">
                            {new Date(t.updatedAt).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))
                )
                }
              </ul>
            </div>
          </>
        )}

        {/* Footer: User section */}
        <div className="relative px-4 py-4 border-t border-neutral-200 bg-white/90 backdrop-blur-sm">
          <div ref={userMenuRef}>
            <button
              className={`w-full flex items-center gap-3 rounded-xl hover:bg-neutral-100 transition-all group ${
                collapsed ? "justify-center px-3 py-3" : "px-3 py-3"
              }`}
              onClick={() => setUserMenu((v) => !v)}
              aria-haspopup="true"
              aria-expanded={userMenu}
              title={collapsed ? realUser?.name || "User" : undefined}
            >
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex-shrink-0 shadow-md">
                <span className="text-emerald-700 font-bold text-base">
                  {realUser?.name?.charAt(0)?.toUpperCase() || "U"}
                </span>
              </div>
              {!collapsed && (
                <>
                  <div className="flex-1 text-left min-w-0">
                    <span className="block font-bold text-sm text-neutral-900 truncate">
                      {realUser?.name || "User"}
                    </span>
                    <span className="block text-xs text-neutral-500 truncate">
                      {realUser?.email || "user@email.com"}
                    </span>
                  </div>
                  <HiOutlineChevronLeft
                    className={`w-4 h-4 text-neutral-400 transition-transform ${
                      userMenu ? "rotate-90" : "-rotate-90"
                    }`}
                  />
                </>
              )}
            </button>

            {userMenu && !collapsed && (
              <div className="absolute left-4 right-4 bottom-20 bg-white border border-neutral-200 rounded-xl shadow-2xl py-2 z-50 animate-fade-in">
                <button
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition rounded-lg"
                  onClick={() => setUserMenu(false)}
                >
                  <HiOutlineCog6Tooth className="w-5 h-5" />
                  Settings
                </button>
                <div className="my-1 border-t border-neutral-100"></div>
                <button
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition rounded-lg"
                  onClick={() => {
                    setUserMenu(false);
                    setShowLogout(true);
                  }}
                >
                  <HiOutlineArrowRightOnRectangle className="w-5 h-5" />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
          aria-label="Sidebar overlay"
        />
      )}

      {/* Logout confirmation modal */}
      {showLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div
            ref={logoutModalRef}
            className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 animate-scale-in"
          >
            <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-rose-100 mx-auto mb-5">
              <HiOutlineArrowRightOnRectangle className="w-8 h-8 text-rose-600" />
            </div>
            <h3 className="text-2xl font-bold text-neutral-900 text-center mb-2">
              Log out of FoodFindr?
            </h3>
            <p className="text-neutral-600 text-sm text-center mb-8">
              You can always log back in at any time.
            </p>
            <div className="flex gap-3">
              <button
                className="flex-1 py-3.5 rounded-xl bg-neutral-100 text-neutral-700 font-bold hover:bg-neutral-200 transition"
                onClick={() => setShowLogout(false)}
              >
                Cancel
              </button>
              <button
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 text-white font-bold hover:from-rose-700 hover:to-rose-800 transition shadow-lg hover:shadow-xl"
                onClick={handleLogout}
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}