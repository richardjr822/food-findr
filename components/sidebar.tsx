"use client";
import { useState, useRef, useEffect } from "react";
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlinePlus,
  HiOutlineMagnifyingGlass,
  HiOutlineBars3,
  HiOutlineChevronLeft,
  HiOutlineCog6Tooth,
  HiOutlineArrowRightOnRectangle,
  HiOutlineUserCircle,
} from "react-icons/hi2";
import { useSession } from "next-auth/react";

// Sample chat history data
const sampleChats = [
  { id: "1", title: "Sample 1" },
  { id: "2", title: "Sample 2" },
  { id: "3", title: "Sample 3" },
  { id: "4", title: "Sample 4" },
  { id: "5", title: "Sample 5" },
];

// Simulate fetching user data
const user = {
  name: "Artri Toshi",
  email: "artri.toshi@email.com",
  initials: "AT",
  plan: "Free",
};

export default function Sidebar() {
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

  function handleNewChat() {
    const newChat = {
      id: Date.now().toString(),
      title: `Sample ${chats.length + 1}`,
    };
    setChats([newChat, ...chats].slice(0, 5));
    setActiveId(newChat.id);
  }

  function handleLogout() {
    setShowLogout(false);
    // Call your logout API to clear the cookie, then redirect
    fetch("/api/auth/logout", { method: "POST" })
      .then(() => {
        window.location.href = "/auth/login";
      });
  }

  return (
    <>
      {/* Mobile toggle button */}
      <button
        className="fixed top-4 left-4 z-40 md:hidden bg-white text-neutral-800 p-2 rounded-lg shadow-lg border border-neutral-200 cursor-pointer"
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
          bg-white text-neutral-900 font-sans
          w-64
          transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:static md:translate-x-0 md:w-64
          h-screen
          max-h-screen
          shadow-lg border-r border-neutral-200
        `}
        aria-label="Sidebar"
      >
        {/* Collapse button */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 bg-white/90 backdrop-blur">
          <span className="font-bold text-lg tracking-tight flex items-center gap-2 text-neutral-800">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-neutral-100 to-white shadow ring-1 ring-neutral-100">
              <HiOutlineChatBubbleLeftRight className="w-6 h-6 text-emerald-700" />
            </span>
            FoodFindr AI
          </span>
          <button
            className="md:hidden text-neutral-400 hover:text-neutral-700 transition cursor-pointer"
            aria-label="Close sidebar"
            onClick={() => setOpen(false)}
          >
            <HiOutlineChevronLeft className="w-6 h-6" />
          </button>
        </div>
        {/* New Chat Button */}
        <button
          className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg px-4 py-2 mx-4 mt-4 mb-2 transition-colors shadow cursor-pointer"
          onClick={handleNewChat}
        >
          <HiOutlinePlus className="w-5 h-5" />
          New Chat
        </button>
        {/* Search chats */}
        <div className="flex items-center gap-2 px-4 mt-2 mb-2">
          <HiOutlineMagnifyingGlass className="w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search chats"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-neutral-100 rounded-md px-3 py-1.5 text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          />
        </div>
        {/* Chat History */}
        <div className="px-4 mt-4 mb-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
          History
        </div>
        <nav className="flex-1 px-2">
          <ul className="space-y-1">
            {filteredChats.length === 0 ? (
              <li>
                <span className="block px-3 py-2 text-neutral-400 text-sm">
                  No chats found
                </span>
              </li>
            ) : (
              filteredChats.map((chat) => (
                <li key={chat.id}>
                  <button
                    className={`
                      w-full flex items-center px-3 py-2 rounded-lg
                      transition-colors
                      text-sm font-medium
                      cursor-pointer
                      ${
                        activeId === chat.id
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-100 shadow"
                          : "hover:bg-neutral-100 text-neutral-800"
                      }
                    `}
                    onClick={() => setActiveId(chat.id)}
                  >
                    <span className="truncate">{chat.title}</span>
                  </button>
                </li>
              ))
            )
            }
          </ul>
        </nav>
        {/* Footer: User section */}
        <div className="relative px-4 py-3 border-t border-neutral-100 bg-white/90 backdrop-blur">
          <div ref={userMenuRef}>
            <button
              className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
              onClick={() => setUserMenu((v) => !v)}
              aria-haspopup="true"
              aria-expanded={userMenu}
            >
              <span className="flex items-center justify-center h-8 w-8 rounded-full bg-emerald-100 text-emerald-700">
                <HiOutlineUserCircle className="w-6 h-6" />
              </span>
              <span className="flex-1 text-left">
                <span className="block font-semibold text-neutral-900 leading-tight">
                  {realUser?.name || user.name}
                </span>
                <span className="block text-xs text-neutral-500">
                  {realUser?.email || user.email}
                </span>
              </span>
              <HiOutlineUserCircle className="w-5 h-5 text-neutral-400" />
            </button>
            {/* User menu dropdown */}
            {userMenu && (
              <div className="absolute left-0 right-0 bottom-14 bg-white border border-neutral-200 rounded-lg shadow-lg py-2 z-50 animate-fade-in">
                <button
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-neutral-800 hover:bg-neutral-100 cursor-pointer"
                  onClick={() => {
                    setUserMenu(false);
                    // Open settings modal or page
                    alert("Settings clicked!");
                  }}
                >
                  <HiOutlineCog6Tooth className="w-5 h-5" />
                  Settings
                </button>
                <button
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                  onClick={() => {
                    setUserMenu(false);
                    setShowLogout(true);
                  }}
                >
                  <HiOutlineArrowRightOnRectangle className="w-5 h-5" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/20 md:hidden"
          onClick={() => setOpen(false)}
          aria-label="Sidebar overlay"
        />
      )}
      {/* Logout confirmation modal */}
      {showLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div
            ref={logoutModalRef}
            className="bg-white rounded-xl shadow-xl p-6 max-w-xs w-full flex flex-col items-center"
          >
            <div className="mb-4 text-lg font-semibold text-neutral-900">
              Log out?
            </div>
            <div className="mb-6 text-neutral-600 text-sm text-center">
              Are you sure you want to log out?
            </div>
            <div className="flex gap-3 w-full">
              <button
                className="flex-1 py-2 rounded-lg bg-neutral-100 text-neutral-700 font-semibold hover:bg-neutral-200 transition cursor-pointer"
                onClick={() => setShowLogout(false)}
              >
                Cancel
              </button>
              <button
                className="flex-1 py-2 rounded-lg bg-emerald-700 text-white font-semibold hover:bg-emerald-800 transition cursor-pointer"
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