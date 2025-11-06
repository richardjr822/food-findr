"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HiOutlineSparkles,
  HiOutlinePlus,
  HiOutlineMagnifyingGlass,
  HiOutlineBars3,
  HiOutlineChevronLeft,
  HiOutlineCog6Tooth,
  HiOutlineArrowRightOnRectangle,
  HiOutlineUserCircle,
  HiOutlineHome,
  HiOutlineBookmark,
  HiOutlineClock,
  HiOutlineChartBar,
} from "react-icons/hi2";
import { useSession, signOut } from "next-auth/react";

// Navigation items
const navItems = [
  { id: "dashboard", label: "Dashboard", icon: HiOutlineHome, href: "/dashboard" },
  { id: "generate", label: "Generate Recipe", icon: HiOutlineSparkles, href: "/generate" },
  { id: "ingredients", label: "Available Ingredients", icon: HiOutlinePlus, href: "/ingredients" }, // <-- Added
  { id: "saved", label: "Saved Recipes", icon: HiOutlineBookmark, href: "/saved" },
  { id: "history", label: "History", icon: HiOutlineClock, href: "/history" },
];

// Sample chat history data
const sampleChats = [
  { id: "1", title: "Chicken Pasta Recipe", timestamp: "2 hours ago" },
  { id: "2", title: "Vegan Breakfast Ideas", timestamp: "Yesterday" },
  { id: "3", title: "Quick Dinner", timestamp: "2 days ago" },
  { id: "4", title: "Healthy Snacks", timestamp: "3 days ago" },
  { id: "5", title: "Dessert Recipes", timestamp: "1 week ago" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);
  const [chats, setChats] = useState(sampleChats);
  const [activeId, setActiveId] = useState<string | null>(chats[0]?.id ?? null);
  const [userMenu, setUserMenu] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [search, setSearch] = useState("");

  // Fetch real user data from NextAuth session
  const { data: session } = useSession();
  const realUser = session?.user;

  // Filter chats based on search input
  const filteredChats = chats.filter((chat) =>
    chat.title.toLowerCase().includes(search.toLowerCase())
  );

  // Close user menu when clicking outside
  const userMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setUserMenu(false);
      }
    }
    if (userMenu) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [userMenu]);

  // Close logout modal when clicking outside
  const logoutModalRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        logoutModalRef.current &&
        !logoutModalRef.current.contains(e.target as Node)
      ) {
        setShowLogout(false);
      }
    }
    if (showLogout) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showLogout]);

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
          fixed z-40 inset-y-0 left-0
          flex flex-col
          bg-gradient-to-b from-white to-neutral-50 text-neutral-900 font-sans
          w-72
          transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:static md:translate-x-0 md:w-72
          h-screen
          max-h-screen
          border-r border-neutral-200
        `}
        aria-label="Sidebar"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 shadow-md group-hover:shadow-lg transition-shadow">
              <HiOutlineSparkles className="w-6 h-6 text-emerald-700" />
            </span>
            <div>
              <span className="font-bold text-xl tracking-tight text-neutral-900">FoodFindr</span>
              <span className="block text-xs text-neutral-500 font-medium">AI Recipe Generator</span>
            </div>
          </Link>
          <button
            className="md:hidden text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 p-1.5 rounded-lg transition"
            aria-label="Close sidebar"
            onClick={() => setOpen(false)}
          >
            <HiOutlineChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* New Recipe Button */}
        <div className="px-4 pt-4 pb-2">
          <Link
            href="/generate"
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold rounded-xl px-4 py-3 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 w-full"
          >
            <HiOutlinePlus className="w-5 h-5" />
            New Recipe
          </Link>
        </div>

        {/* Navigation */}
        <nav className="px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl
                  transition-all font-semibold text-sm
                  ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100"
                      : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="mx-4 my-2 border-t border-neutral-200"></div>

        {/* Search chats */}
        <div className="px-4 mb-3">
          <div className="relative">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search recipes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-neutral-200 rounded-xl pl-9 pr-3 py-2.5 text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition"
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="flex-1 overflow-y-auto px-3">
          <div className="flex items-center gap-2 px-3 mb-2">
            <HiOutlineClock className="w-4 h-4 text-neutral-400" />
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Recent Activity
            </span>
          </div>
          <ul className="space-y-1">
            {filteredChats.length === 0 ? (
              <li className="px-3 py-8 text-center">
                <HiOutlineChartBar className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                <span className="block text-sm text-neutral-400">No recent activity</span>
              </li>
            ) : (
              filteredChats.map((chat) => (
                <li key={chat.id}>
                  <button
                    className={`
                      w-full flex items-start gap-3 px-3 py-2.5 rounded-xl
                      transition-all text-left group
                      ${
                        activeId === chat.id
                          ? "bg-emerald-50 border border-emerald-100"
                          : "hover:bg-neutral-100"
                      }
                    `}
                    onClick={() => setActiveId(chat.id)}
                  >
                    <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-neutral-100 to-neutral-200 flex-shrink-0 mt-0.5">
                      <span className="text-sm">🍳</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${
                        activeId === chat.id ? "text-emerald-700" : "text-neutral-900 group-hover:text-emerald-600"
                      }`}>
                        {chat.title}
                      </p>
                      <p className="text-xs text-neutral-500">{chat.timestamp}</p>
                    </div>
                  </button>
                </li>
              ))
            )
            }
          </ul>
        </div>

        {/* Footer: User section */}
        <div className="relative px-4 py-4 border-t border-neutral-200 bg-white/80 backdrop-blur">
          <div ref={userMenuRef}>
            <button
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-100 transition-all group"
              onClick={() => setUserMenu((v) => !v)}
              aria-haspopup="true"
              aria-expanded={userMenu}
            >
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex-shrink-0 shadow-sm">
                <span className="text-emerald-700 font-bold text-sm">
                  {realUser?.name?.charAt(0)?.toUpperCase() || "U"}
                </span>
              </div>
              <div className="flex-1 text-left min-w-0">
                <span className="block font-bold text-sm text-neutral-900 truncate">
                  {realUser?.name || "User"}
                </span>
                <span className="block text-xs text-neutral-500 truncate">
                  {realUser?.email || "user@email.com"}
                </span>
              </div>
              <HiOutlineChevronLeft className={`w-4 h-4 text-neutral-400 transition-transform ${userMenu ? "rotate-90" : "-rotate-90"}`} />
            </button>

            {/* User menu dropdown */}
            {userMenu && (
              <div className="absolute left-4 right-4 bottom-16 bg-white border border-neutral-200 rounded-xl shadow-2xl py-2 z-50 animate-fade-in">
                <button
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition"
                  onClick={() => {
                    setUserMenu(false);
                    // Navigate to settings
                  }}
                >
                  <HiOutlineCog6Tooth className="w-5 h-5" />
                  Settings
                </button>
                <div className="my-1 border-t border-neutral-100"></div>
                <button
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition"
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
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
          aria-label="Sidebar overlay"
        />
      )}

      {/* Logout confirmation modal */}
      {showLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div
            ref={logoutModalRef}
            className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 animate-scale-in"
          >
            <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-rose-100 mx-auto mb-4">
              <HiOutlineArrowRightOnRectangle className="w-7 h-7 text-rose-600" />
            </div>
            <h3 className="text-xl font-bold text-neutral-900 text-center mb-2">
              Log out of FoodFindr?
            </h3>
            <p className="text-neutral-600 text-sm text-center mb-6">
              You can always log back in at any time.
            </p>
            <div className="flex gap-3">
              <button
                className="flex-1 py-3 rounded-xl bg-neutral-100 text-neutral-700 font-bold hover:bg-neutral-200 transition"
                onClick={() => setShowLogout(false)}
              >
                Cancel
              </button>
              <button
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 text-white font-bold hover:from-rose-700 hover:to-rose-800 transition shadow-lg hover:shadow-xl"
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