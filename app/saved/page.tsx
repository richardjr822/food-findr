"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Sidebar from "@/components/sidebar";
import { toast } from "sonner";
import { 
  HiOutlineBookmark, 
  HiTrash, 
  HiOutlineShoppingCart,
  HiOutlineClipboardDocumentList,
  HiOutlineChartBar,
  HiOutlineMagnifyingGlass,
  HiOutlineFunnel,
  HiOutlineXMark,
  HiOutlineExclamationTriangle,
  HiOutlineClock,
  HiOutlineCalendar,
  HiOutlineEye,
  HiChevronDown,
  HiChevronUp,
  HiOutlineSparkles
} from "react-icons/hi2";
import Feedback from "@/components/feedback";

type SavedRecipe = {
  _id: string;
  title: string;
  ingredients: string[];
  instructions: string[];
  nutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  messageId: string;
  createdAt: string;
};

type SortOption = "newest" | "oldest" | "title";
type CalorieFilter = "all" | "low" | "medium" | "high";

export default function SavedRecipesPage() {
  const [recipes, setRecipes] = useState<SavedRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [calorieFilter, setCalorieFilter] = useState<CalorieFilter>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Modal State
  const [selectedRecipe, setSelectedRecipe] = useState<SavedRecipe | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    ingredients: true,
    instructions: true,
    nutrition: true
  });
  const modalRef = useRef<HTMLDivElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);

  async function fetchRecipes() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/recipes?page=1&pageSize=200", { cache: "no-store" });
      if (res.status === 401) {
        setError("Unauthorized");
        toast.error("Please sign in to view saved recipes");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch saved recipes.");
      const data = await res.json();
      setRecipes(Array.isArray(data) ? data : data.recipes || []);
    } catch (err: any) {
      setError(err.message || "Error loading recipes.");
      toast.error("Failed to load recipes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRecipes();
  }, []);

  async function confirmDelete() {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/recipes?id=${encodeURIComponent(deleteId)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete recipe.");
      setRecipes(prev => prev.filter(r => r._id !== deleteId));
      if (selectedRecipe?._id === deleteId) {
        closeModal();
      }
      toast.success("Recipe deleted successfully");
    } catch (err: any) {
      toast.error(err.message || "Error deleting recipe");
    } finally {
      setDeleteId(null);
    }
  }

  function openModal(recipe: SavedRecipe) {
    setSelectedRecipe(recipe);
    setShowModal(true);
    setExpandedSections({ ingredients: true, instructions: true, nutrition: true });
  }

  function closeModal() {
    setShowModal(false);
    setTimeout(() => setSelectedRecipe(null), 200);
  }

  // Close modal on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (showModal && modalRef.current && !modalRef.current.contains(e.target as Node)) {
        closeModal();
      }
    }
    if (showModal) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showModal]);

  // Filter and Sort Logic
  const filteredAndSortedRecipes = useMemo(() => {
    let filtered = [...recipes];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(recipe =>
        recipe.title.toLowerCase().includes(query) ||
        recipe.ingredients.some(ing => ing.toLowerCase().includes(query))
      );
    }

    // Calorie filter
    if (calorieFilter !== "all") {
      filtered = filtered.filter(recipe => {
        const cal = recipe.nutrition?.calories || 0;
        if (calorieFilter === "low") return cal > 0 && cal < 400;
        if (calorieFilter === "medium") return cal >= 400 && cal < 700;
        if (calorieFilter === "high") return cal >= 700;
        return true;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return filtered;
  }, [recipes, searchQuery, sortBy, calorieFilter]);

  const hasActiveFilters = searchQuery || calorieFilter !== "all" || sortBy !== "newest";

  function toggleSection(section: keyof typeof expandedSections) {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  }

  return (
    <div className="flex h-screen overflow-hidden relative bg-white">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1600&q=80&auto=format&fit=crop')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.08,
          filter: "brightness(1)",
        }}
      />
      
      <Sidebar />

      <main className="flex-1 h-full overflow-y-auto relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-5 sm:mb-7">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-11 w-11 sm:h-12 sm:w-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg flex-shrink-0">
                <HiOutlineBookmark className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-neutral-900 tracking-tight">
                  Saved Recipes
                </h1>
                <p className="text-neutral-600 text-xs sm:text-sm">
                  {recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'} saved
                </p>
              </div>
            </div>

            {/* Filter Toggle Button (Mobile) */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-sm font-semibold transition-all active:scale-95 shadow-sm hover:shadow min-h-[44px]"
            >
              <HiOutlineFunnel className="h-4 w-4" />
              <span>Filters</span>
              {showFilters ? <HiChevronUp className="h-4 w-4" /> : <HiChevronDown className="h-4 w-4" />}
            </button>
          </div>

          {/* Search & Filters - Collapsible */}
          {showFilters && (
            <div className="mb-6 bg-white rounded-xl sm:rounded-2xl border-2 border-neutral-200 p-4 sm:p-5 shadow-lg animate-in slide-in-from-top duration-200 space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-neutral-900 mb-2">
                  <HiOutlineMagnifyingGlass className="h-4 w-4 text-amber-600" />
                  Search
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by title or ingredient..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 text-sm sm:text-base border-2 border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all min-h-[48px] bg-neutral-50 focus:bg-white"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-neutral-200 transition"
                      aria-label="Clear search"
                    >
                      <HiOutlineXMark className="h-4 w-4 text-neutral-500" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-neutral-900 mb-2">
                    <HiOutlineClock className="h-4 w-4 text-amber-600" />
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as SortOption)}
                    className="w-full px-4 py-3 text-sm sm:text-base border-2 border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all bg-neutral-50 focus:bg-white min-h-[48px]"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="title">A-Z (Title)</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-neutral-900 mb-2">
                    <HiOutlineChartBar className="h-4 w-4 text-amber-600" />
                    Calories
                  </label>
                  <select
                    value={calorieFilter}
                    onChange={e => setCalorieFilter(e.target.value as CalorieFilter)}
                    className="w-full px-4 py-3 text-sm sm:text-base border-2 border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all bg-neutral-50 focus:bg-white min-h-[48px]"
                  >
                    <option value="all">All Calories</option>
                    <option value="low">Low (&lt;400 cal)</option>
                    <option value="medium">Medium (400-700)</option>
                    <option value="high">High (700+ cal)</option>
                  </select>
                </div>
              </div>

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSortBy('newest');
                      setCalorieFilter('all');
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg transition-all active:scale-95"
                  >
                    <HiOutlineXMark className="h-4 w-4" />
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Active Filters Indicator */}
          {!showFilters && hasActiveFilters && (
            <div className="mb-4 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <HiOutlineFunnel className="h-4 w-4" />
              <span className="font-semibold">Filters active</span>
              <button
                onClick={() => setShowFilters(true)}
                className="ml-auto text-amber-600 hover:text-amber-800 underline font-medium"
              >
                View
              </button>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-rose-50 rounded-xl border-2 border-rose-200 p-4 mb-6 animate-in slide-in-from-top duration-200">
              <div className="flex items-center gap-2 text-rose-700">
                <HiOutlineExclamationTriangle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm font-semibold">{error}</span>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12 sm:py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
                <span className="text-xs sm:text-sm text-neutral-500 font-medium">Loading recipes...</span>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && recipes.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[250px] sm:min-h-[400px] bg-gradient-to-br from-emerald-50/50 to-white rounded-2xl sm:rounded-3xl border-2 border-dashed border-emerald-200 p-6 sm:p-8">
              <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center mb-3 sm:mb-4">
                <HiOutlineBookmark className="h-7 w-7 sm:h-8 sm:w-8 text-emerald-600" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-neutral-700 mb-1 sm:mb-2 text-center">
                No saved recipes yet
              </h3>
              <p className="text-xs sm:text-sm text-neutral-500 text-center max-w-xs">
                Save recipes from the Generate page to see them here!
              </p>
            </div>
          )}

          {/* No Results State */}
          {!loading && !error && recipes.length > 0 && filteredAndSortedRecipes.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[250px] sm:min-h-[400px] bg-gradient-to-br from-neutral-50 to-white rounded-2xl sm:rounded-3xl border-2 border-dashed border-neutral-200 p-6 sm:p-8">
              <HiOutlineMagnifyingGlass className="h-12 w-12 sm:h-16 sm:w-16 text-neutral-300 mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-bold text-neutral-400 mb-1 sm:mb-2 text-center">
                No recipes found
              </h3>
              <p className="text-xs sm:text-sm text-neutral-500 text-center max-w-xs">
                Try adjusting your search or filters
              </p>
            </div>
          )}

          {/* Recipe Grid */}
          {!loading && !error && filteredAndSortedRecipes.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {filteredAndSortedRecipes.map(recipe => (
                <div
                  key={recipe._id}
                  className="bg-white rounded-xl sm:rounded-2xl shadow-lg border-2 border-neutral-200 overflow-hidden hover:shadow-xl hover:border-emerald-300 transition-all group cursor-pointer"
                  onClick={() => openModal(recipe)}
                >
                  <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                    {/* Title + Actions */}
                    <div className="flex items-start justify-between gap-2 pb-2 border-b-2 border-emerald-100">
                      <h2 className="text-sm sm:text-base font-bold tracking-tight text-neutral-900 group-hover:text-emerald-700 transition flex-1 line-clamp-2">
                        {recipe.title}
                      </h2>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(recipe._id);
                        }}
                        className="flex-shrink-0 p-1.5 rounded-lg border-2 border-rose-200 text-rose-600 hover:bg-rose-50 transition"
                        title="Delete recipe"
                      >
                        <HiTrash className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      </button>
                    </div>

                    {/* Quick Info */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-neutral-600">
                        <HiOutlineShoppingCart className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-500 flex-shrink-0" />
                        <span className="font-semibold">{recipe.ingredients.length} items</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-neutral-600">
                        <HiOutlineClipboardDocumentList className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-500 flex-shrink-0" />
                        <span className="font-semibold">{recipe.instructions.length} steps</span>
                      </div>
                    </div>

                    {/* Preview Ingredients */}
                    <div className="bg-gradient-to-br from-emerald-50/50 to-white rounded-lg p-2 border border-emerald-100">
                      <div className="flex flex-wrap gap-1">
                        {recipe.ingredients.slice(0, 3).map((item, idx) => (
                          <span
                            key={idx}
                            className="text-[9px] sm:text-[10px] font-semibold text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-emerald-200 line-clamp-1"
                          >
                            {item.split(' ').slice(-2).join(' ')}
                          </span>
                        ))}
                        {recipe.ingredients.length > 3 && (
                          <span className="text-[9px] sm:text-[10px] font-semibold text-neutral-500 bg-neutral-50 px-1.5 py-0.5 rounded border border-neutral-200">
                            +{recipe.ingredients.length - 3}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Nutrition */}
                    {recipe.nutrition && (
                      <div className="grid grid-cols-4 gap-1.5">
                        <div className="bg-gradient-to-br from-amber-50 to-white rounded-lg p-1.5 border-2 border-amber-200 text-center">
                          <div className="text-[10px] sm:text-xs font-bold text-amber-700">
                            {recipe.nutrition.calories ?? "—"}
                          </div>
                          <div className="text-[8px] font-semibold text-neutral-600 uppercase">
                            Cal
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-50 to-white rounded-lg p-1.5 border-2 border-emerald-200 text-center">
                          <div className="text-[10px] sm:text-xs font-bold text-emerald-700">
                            {recipe.nutrition.protein ?? "—"}g
                          </div>
                          <div className="text-[8px] font-semibold text-neutral-600 uppercase">
                            Pro
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-white rounded-lg p-1.5 border-2 border-blue-200 text-center">
                          <div className="text-[10px] sm:text-xs font-bold text-blue-700">
                            {recipe.nutrition.carbs ?? "—"}g
                          </div>
                          <div className="text-[8px] font-semibold text-neutral-600 uppercase">
                            Carb
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-teal-50 to-white rounded-lg p-1.5 border-2 border-teal-200 text-center">
                          <div className="text-[10px] sm:text-xs font-bold text-teal-700">
                            {recipe.nutrition.fat ?? "—"}g
                          </div>
                          <div className="text-[8px] font-semibold text-neutral-600 uppercase">
                            Fat
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                      <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-neutral-400">
                        <HiOutlineCalendar className="h-3 w-3" />
                        {new Date(recipe.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric"
                        })}
                      </div>
                      <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-emerald-600 font-semibold group-hover:text-emerald-700">
                        <HiOutlineEye className="h-3 w-3" />
                        View Recipe
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-3">Delete Recipe?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this recipe? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors font-semibold shadow-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recipe Detail Modal */}
      {showModal && selectedRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
          <div
            ref={modalRef}
            className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200"
          >
            {/* Modal Header */}
            <div className="flex-shrink-0 bg-gradient-to-br from-emerald-500 to-teal-600 text-white px-4 sm:px-6 py-3 sm:py-4 border-b border-emerald-400 shadow-lg rounded-t-2xl sm:rounded-t-3xl">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-2xl font-bold tracking-tight line-clamp-2">
                    {selectedRecipe.title}
                  </h2>
                  <div className="flex items-center gap-3 mt-2 text-xs sm:text-sm text-emerald-100">
                    <span className="flex items-center gap-1">
                      <HiOutlineCalendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      {new Date(selectedRecipe.createdAt).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={closeModal}
                    className="flex-shrink-0 p-2 rounded-lg hover:bg-white/20 transition"
                    aria-label="Close"
                  >
                    <HiOutlineXMark className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Body (scrollable) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
              {/* Nutrition Overview */}
              {selectedRecipe.nutrition && (
                <div>
                  <button
                    onClick={() => toggleSection('nutrition')}
                    className="w-full flex items-center justify-between gap-2 mb-3 group"
                  >
                    <h3 className="flex items-center gap-2 font-bold text-sm sm:text-base text-neutral-900">
                      <HiOutlineChartBar className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                      Nutrition Facts
                    </h3>
                    {expandedSections.nutrition ? (
                      <HiChevronUp className="h-5 w-5 text-neutral-400 group-hover:text-emerald-600 transition" />
                    ) : (
                      <HiChevronDown className="h-5 w-5 text-neutral-400 group-hover:text-emerald-600 transition" />
                    )}
                  </button>
                  {expandedSections.nutrition && (
                    <div className="grid grid-cols-4 gap-2 sm:gap-3 animate-in slide-in-from-top duration-300">
                      <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-3 sm:p-4 border-2 border-amber-200 text-center shadow-sm">
                        <div className="text-xl sm:text-2xl font-bold text-amber-700">
                          {selectedRecipe.nutrition.calories ?? "—"}
                        </div>
                        <div className="text-[10px] sm:text-xs font-semibold text-amber-600 uppercase mt-1">
                          Calories
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-3 sm:p-4 border-2 border-emerald-200 text-center shadow-sm">
                        <div className="text-xl sm:text-2xl font-bold text-emerald-700">
                          {selectedRecipe.nutrition.protein ?? "—"}g
                        </div>
                        <div className="text-[10px] sm:text-xs font-semibold text-emerald-600 uppercase mt-1">
                          Protein
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 sm:p-4 border-2 border-blue-200 text-center shadow-sm">
                        <div className="text-xl sm:text-2xl font-bold text-blue-700">
                          {selectedRecipe.nutrition.carbs ?? "—"}g
                        </div>
                        <div className="text-[10px] sm:text-xs font-semibold text-blue-600 uppercase mt-1">
                          Carbs
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-3 sm:p-4 border-2 border-teal-200 text-center shadow-sm">
                        <div className="text-xl sm:text-2xl font-bold text-teal-700">
                          {selectedRecipe.nutrition.fat ?? "—"}g
                        </div>
                        <div className="text-[10px] sm:text-xs font-semibold text-teal-600 uppercase mt-1">
                          Fat
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Ingredients Section */}
              <div>
                <button
                  onClick={() => toggleSection('ingredients')}
                  className="w-full flex items-center justify-between gap-2 mb-3 group"
                >
                  <h3 className="flex items-center gap-2 font-bold text-sm sm:text-base text-neutral-900">
                    <HiOutlineShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                    Ingredients
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                      {selectedRecipe.ingredients.length}
                    </span>
                  </h3>
                  {expandedSections.ingredients ? (
                    <HiChevronUp className="h-5 w-5 text-neutral-400 group-hover:text-emerald-600 transition" />
                  ) : (
                    <HiChevronDown className="h-5 w-5 text-neutral-400 group-hover:text-emerald-600 transition" />
                  )}
                </button>
                {expandedSections.ingredients && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in slide-in-from-top duration-300">
                    {selectedRecipe.ingredients.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 bg-neutral-50 rounded-lg px-3 py-2 border border-neutral-200 hover:border-emerald-200 hover:bg-emerald-50/30 transition"
                      >
                        <span className="flex-shrink-0 flex items-center justify-center h-5 w-5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px] mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="text-xs sm:text-sm text-neutral-800 leading-relaxed">
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Instructions Section */}
              <div>
                <button
                  onClick={() => toggleSection('instructions')}
                  className="w-full flex items-center justify-between gap-2 mb-3 group"
                >
                  <h3 className="flex items-center gap-2 font-bold text-sm sm:text-base text-neutral-900">
                    <HiOutlineClipboardDocumentList className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                    Instructions
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      {selectedRecipe.instructions.length} steps
                    </span>
                  </h3>
                  {expandedSections.instructions ? (
                    <HiChevronUp className="h-5 w-5 text-neutral-400 group-hover:text-emerald-600 transition" />
                  ) : (
                    <HiChevronDown className="h-5 w-5 text-neutral-400 group-hover:text-emerald-600 transition" />
                  )}
                </button>
                {expandedSections.instructions && (
                  <ol className="space-y-3 animate-in slide-in-from-top duration-300">
                    {selectedRecipe.instructions.map((step, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span className="flex-shrink-0 flex items-center justify-center h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-xs sm:text-sm shadow-md">
                          {idx + 1}
                        </span>
                        <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed pt-1">
                          {step}
                        </p>
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              <div ref={feedbackRef} className="pt-2">
                <Feedback recipeId={selectedRecipe._id} />
              </div>
            </div>

            {/* Modal Footer (sticky, outside scroll) */}
            <div className="flex-shrink-0 bg-gradient-to-t from-neutral-50 to-white border-t-2 border-neutral-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3 rounded-b-2xl sm:rounded-b-3xl">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs sm:text-sm shadow-lg hover:shadow-xl transition hover:-translate-y-0.5"
                >
                  Rate / Review
                </button>
                <button
                  onClick={() => {
                    setDeleteId(selectedRecipe._id);
                    closeModal();
                  }}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-rose-50 border-2 border-rose-200 text-rose-700 font-bold text-xs sm:text-sm hover:bg-rose-100 transition"
                >
                  <HiTrash className="h-4 w-4" />
                  Delete Recipe
                </button>
              </div>
              <button
                onClick={closeModal}
                className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs sm:text-sm shadow-lg hover:shadow-xl transition hover:-translate-y-0.5"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}