"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { HiOutlineClock, HiOutlineBookmark, HiOutlineSparkles, HiOutlineArrowRight } from "react-icons/hi2";
import Sidebar from "@/components/sidebar";

// Types
interface RecentSearch {
  id: string;
  search_term: string;
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
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-neutral-50 via-white to-emerald-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 h-full overflow-y-auto">
        <div className="h-full w-full px-4 sm:px-8 py-8 sm:py-12">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center justify-center h-14 w-14 rounded-3xl bg-gradient-to-br from-emerald-100 to-emerald-200 shadow-lg">
                <HiOutlineSparkles className="h-7 w-7 text-emerald-700" />
              </div>
              <div>
                <h1 className="text-4xl sm:text-5xl font-extrabold text-neutral-900 tracking-tight mb-1">
                  Welcome back,{" "}
                  <span className="text-emerald-700">{firstName}!</span>
                </h1>
                <p className="text-neutral-600 text-lg sm:text-xl">
                  Here’s what you’ve been cooking up lately
                </p>
              </div>
            </div>
          </div>

          {/* Recent Searches Section */}
          <section className="mb-16" aria-labelledby="recent-searches-heading">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-11 w-11 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 shadow">
                  <HiOutlineClock className="h-6 w-6 text-emerald-700" />
                </div>
                <h2 id="recent-searches-heading" className="text-2xl font-bold text-neutral-900">
                  Recent Searches
                </h2>
              </div>
              {recentSearches.length > 0 && (
                <Link
                  href="/history"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition group"
                >
                  View All
                  <HiOutlineArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
            </div>

            {loadingSearches ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-neutral-100 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : recentSearches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 bg-gradient-to-br from-neutral-50 to-white rounded-3xl border border-neutral-200 shadow">
                <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-neutral-100 mb-4">
                  <HiOutlineClock className="h-8 w-8 text-neutral-400" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">No recent searches yet</h3>
                <p className="text-neutral-600 mb-6 text-center max-w-sm">
                  Start discovering delicious recipes by searching for ingredients you have on hand.
                </p>
                <Link
                  href="/generate"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-3 text-white font-semibold shadow-lg hover:shadow-xl transition hover:-translate-y-0.5"
                >
                  <HiOutlineSparkles className="h-5 w-5" />
                  Generate Recipe
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentSearches.slice(0, 6).map((search) => (
                  <Link
                    key={search.id}
                    href={`/generate?q=${encodeURIComponent(search.search_term)}`}
                    className="group flex items-center gap-4 p-6 bg-white rounded-2xl border border-neutral-200 hover:border-emerald-200 shadow hover:shadow-lg transition hover:-translate-y-1"
                  >
                    <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex-shrink-0">
                      <span className="text-2xl">🔍</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-neutral-900 truncate group-hover:text-emerald-700 transition-colors">
                        {search.search_term}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {new Date(search.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <HiOutlineArrowRight className="h-5 w-5 text-neutral-400 group-hover:text-emerald-700 group-hover:translate-x-1 transition flex-shrink-0" />
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
                  href="/favorites"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition group"
                >
                  View All
                  <HiOutlineArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
            </div>

            {loadingRecipes ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-80 bg-neutral-100 rounded-2xl animate-pulse" />
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {savedRecipes.slice(0, 8).map((recipe) => (
                  <Link
                    key={recipe.id}
                    href={`/recipe/${recipe.recipe_id}`}
                    className="group bg-white rounded-2xl border border-neutral-200 overflow-hidden hover:border-emerald-200 shadow hover:shadow-xl transition hover:-translate-y-1"
                  >
                    <div className="relative h-48 w-full bg-neutral-100">
                      <Image
                        src={recipe.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400"}
                        alt={recipe.title}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute top-3 right-3 flex items-center justify-center h-8 w-8 rounded-full bg-white/90 backdrop-blur-sm shadow">
                        <HiOutlineBookmark className="h-4 w-4 text-rose-700" />
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-lg text-neutral-900 mb-2 line-clamp-2 group-hover:text-emerald-700 transition-colors">
                        {recipe.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <HiOutlineClock className="h-4 w-4" />
                        <span>{recipe.cooking_time || "30 mins"}</span>
                      </div>
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