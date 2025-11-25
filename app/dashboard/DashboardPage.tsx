"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { 
  HiOutlineClock, 
  HiOutlineBookmark, 
  HiOutlineSparkles, 
  HiOutlineArrowRight,
  HiOutlineChatBubbleLeftEllipsis,
  HiOutlineBookOpen
} from "react-icons/hi2";
import Sidebar from "@/components/sidebar";

// Types
interface RecentSearch {
  id: string;
  title: string;
  preview?: string;
  created_at: string;
}

interface SavedRecipe {
  id: string;
  recipe_id: string;
  title: string;
  image_url: string;
  cooking_time: string;
  saved_at: string;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [loadingSearches, setLoadingSearches] = useState(true);
  const [loadingRecipes, setLoadingRecipes] = useState(true);

  useEffect(() => {
    if (session?.user) {
      fetchRecentSearches();
      fetchSavedRecipes();
    }
  }, [session]);

  async function fetchRecentSearches() {
    try {
      const res = await fetch("/api/dashboard/recent-searches");
      if (res.ok) {
        const data = await res.json();
        setRecentSearches(data.searches || []);
      }
    } catch (error) {
      console.error("Failed to fetch recent searches:", error);
    } finally {
      setLoadingSearches(false);
    }
  }

  async function fetchSavedRecipes() {
    try {
      const res = await fetch("/api/dashboard/saved-recipes");
      if (res.ok) {
        const data = await res.json();
        setSavedRecipes(data.recipes || []);
      }
    } catch (error) {
      console.error("Failed to fetch saved recipes:", error);
    } finally {
      setLoadingRecipes(false);
    }
  }

  const firstName = session?.user?.name?.split(" ")[0] || "there";

  return (
    <div className="flex h-screen overflow-hidden relative bg-white">
      {/* Background image with overlay */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1600&q=80&auto=format&fit=crop')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.08,
        }}
      />

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 h-full overflow-y-auto relative z-10">
        <div className="h-full w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 sm:mb-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
              <div className="flex items-center justify-center h-12 w-12 sm:h-16 sm:w-16 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-100 via-emerald-200 to-emerald-100 shadow-lg ring-2 ring-emerald-50">
                <HiOutlineSparkles className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-700" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-neutral-900 tracking-tight mb-1">
                  Welcome back,{" "}
                  <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{firstName}!</span>
                </h1>
                <p className="text-neutral-600 text-sm sm:text-base lg:text-lg">
                  Here's what you've been cooking up lately
                </p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-gradient-to-br from-emerald-50 to-white rounded-xl sm:rounded-2xl border-2 border-emerald-100 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <HiOutlineSparkles className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                  <span className="text-xs sm:text-sm font-semibold text-emerald-700">Generated</span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-neutral-900">{recentSearches.length}</div>
                <div className="text-[10px] sm:text-xs text-neutral-500 mt-1">Total recipes</div>
              </div>
              
              <div className="bg-gradient-to-br from-amber-50 to-white rounded-xl sm:rounded-2xl border-2 border-amber-100 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <HiOutlineBookmark className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                  <span className="text-xs sm:text-sm font-semibold text-amber-700">Saved</span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-neutral-900">{savedRecipes.length}</div>
                <div className="text-[10px] sm:text-xs text-neutral-500 mt-1">Favorites</div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl sm:rounded-2xl border-2 border-blue-100 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <HiOutlineClock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  <span className="text-xs sm:text-sm font-semibold text-blue-700">Recent</span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-neutral-900">{recentSearches.slice(0, 6).length}</div>
                <div className="text-[10px] sm:text-xs text-neutral-500 mt-1">This week</div>
              </div>
              
              <div className="bg-gradient-to-br from-rose-50 to-white rounded-xl sm:rounded-2xl border-2 border-rose-100 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <HiOutlineBookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-rose-600" />
                  <span className="text-xs sm:text-sm font-semibold text-rose-700">Collection</span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-neutral-900">{savedRecipes.slice(0, 8).length}</div>
                <div className="text-[10px] sm:text-xs text-neutral-500 mt-1">Top picks</div>
              </div>
            </div>
          </div>

          {/* Recent Activity Section */}
          <section className="mb-12 sm:mb-16" aria-labelledby="recent-activity-heading">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-6 sm:mb-8">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-sm">
                  <HiOutlineClock className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-700" />
                </div>
                <h2 id="recent-activity-heading" className="text-xl sm:text-2xl font-bold text-neutral-900">
                  Recent Activity
                </h2>
              </div>
              {recentSearches.length > 0 && (
                <Link
                  href="/history"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition-all group active:scale-95"
                >
                  View All
                  <HiOutlineArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
            </div>

            {loadingSearches ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 sm:h-28 bg-gradient-to-br from-neutral-100 to-neutral-50 rounded-xl sm:rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : recentSearches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-6 bg-gradient-to-br from-emerald-50/50 via-white to-neutral-50 rounded-2xl sm:rounded-3xl border-2 border-dashed border-emerald-200 shadow-sm">
                <div className="flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 mb-4 shadow-sm">
                  <HiOutlineClock className="h-7 w-7 sm:h-8 sm:w-8 text-emerald-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-neutral-900 mb-2">No recent activity yet</h3>
                <p className="text-sm sm:text-base text-neutral-600 mb-6 text-center max-w-sm">
                  Start discovering delicious recipes by generating your first AI-powered meal.
                </p>
                <Link
                  href="/generate"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-sm sm:text-base text-white font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 active:scale-95 min-h-[48px]"
                >
                  <HiOutlineSparkles className="h-5 w-5" />
                  Generate Recipe
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {recentSearches.slice(0, 6).map((search) => (
                  <Link
                    key={search.id}
                    href={`/generate?thread=${search.id}`}
                    className="group flex items-start gap-3 sm:gap-4 p-4 sm:p-6 bg-white rounded-xl sm:rounded-2xl border-2 border-neutral-200 hover:border-emerald-300 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-center h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-emerald-50 via-emerald-100 to-emerald-50 flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
                      <HiOutlineChatBubbleLeftEllipsis className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm sm:text-base text-neutral-900 truncate group-hover:text-emerald-700 transition-colors mb-1">
                        {search.title}
                      </p>
                      {search.preview && (
                        <p className="text-xs sm:text-sm text-neutral-500 line-clamp-2 mb-2">
                          {search.preview}
                        </p>
                      )}
                      <p className="text-[10px] sm:text-xs text-neutral-400 font-medium">
                        {search.created_at
                          ? new Date(search.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : ""}
                      </p>
                    </div>
                    <HiOutlineArrowRight className="h-5 w-5 text-neutral-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Saved Recipes Section */}
          <section aria-labelledby="saved-recipes-heading">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-11 w-11 rounded-2xl bg-gradient-to-br from-rose-50 to-rose-100 shadow">
                  <HiOutlineBookmark className="h-6 w-6 text-rose-700" />
                </div>
                <h2 id="saved-recipes-heading" className="text-2xl font-bold text-neutral-900">
                  Saved Recipes
                </h2>
              </div>
              {savedRecipes.length > 0 && (
                <Link
                  href="/saved"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-rose-700 hover:text-rose-800 transition group"
                >
                  View All
                  <HiOutlineArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
            </div>

            {loadingRecipes ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-36 bg-neutral-100 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : savedRecipes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 bg-gradient-to-br from-rose-50 to-white rounded-3xl border border-neutral-200 shadow">
                <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-rose-100 mb-4">
                  <HiOutlineBookmark className="h-8 w-8 text-rose-700" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">No saved recipes yet</h3>
                <p className="text-neutral-600 mb-6 text-center max-w-sm">
                  Save your favorite recipes to quickly access them anytime.
                </p>
                <Link
                  href="/generate"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-3 text-white font-semibold shadow-lg hover:shadow-xl transition hover:-translate-y-0.5"
                >
                  <HiOutlineSparkles className="h-5 w-5" />
                  Find Recipes
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {savedRecipes.slice(0, 8).map((recipe) => (
                  <Link
                    key={recipe.id}
                    href={`/recipe/${recipe.recipe_id}`}
                    className="group bg-white rounded-2xl border border-neutral-200 overflow-hidden hover:border-rose-200 shadow hover:shadow-xl transition hover:-translate-y-1 p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-rose-50 to-rose-100 flex-shrink-0">
                        <HiOutlineBookOpen className="h-6 w-6 text-rose-700" />
                      </div>
                      <div className="text-xs text-neutral-400">
                        {recipe.saved_at
                          ? new Date(recipe.saved_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })
                          : ""}
                      </div>
                    </div>
                    <h3 className="font-bold text-lg text-neutral-900 mb-3 line-clamp-2 group-hover:text-rose-700 transition-colors">
                      {recipe.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <HiOutlineClock className="h-4 w-4" />
                      <span>{recipe.cooking_time || "30 mins"}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}