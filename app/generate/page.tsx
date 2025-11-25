"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { 
  HiOutlineSparkles, 
  HiOutlineBookmark, 
  HiBookmark, 
  HiOutlineClock,
  HiOutlineBuildingStorefront,
  HiOutlineTag,
  HiOutlineShoppingCart,
  HiOutlineClipboardDocumentList,
  HiOutlineChartBar,
  HiOutlineExclamationTriangle,
  HiOutlineXMark,
  HiChevronDown,
  HiChevronUp
} from "react-icons/hi2";
import Sidebar from "@/components/sidebar";
import ShareMenu from "@/components/share-menu";
import Feedback from "@/components/feedback";

const MEAL_TYPES = [
  { label: "Breakfast", value: "breakfast", icon: "🌅" },
  { label: "Lunch", value: "lunch", icon: "☀️" },
  { label: "Dinner", value: "dinner", icon: "🌙" },
  { label: "Snack", value: "snack", icon: "🍿" },
  { label: "Dessert", value: "dessert", icon: "🍰" },
];

type ChatMsg = {
  id: string;
  role: "user" | "model";
  content?: string;
  recipe?: {
    title: string;
    ingredients: string[];
    instructions: string[];
    nutrition?: {
      calories?: number;
      protein?: number;
      carbs?: number;
      fat?: number;
    };
  };
  recipeSnapshot?: {
    title: string;
    ingredients: string[];
    instructions: string[];
    nutrition?: {
      calories?: number;
      protein?: number;
      carbs?: number;
      fat?: number;
    };
  };
  saved?: boolean;
  recipeId?: string | null;
  createdAt?: string;
};

type Thread = {
  id: string;
  title: string;
  messages: ChatMsg[];
  updatedAt?: string;
};

function dedupeById<T extends { id: string }>(arr: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of arr) {
    if (!item?.id || seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

function GenerateRecipeContent() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [history, setHistory] = useState<{ role: "user" | "model"; content: string }[]>([]);

  const [manualPrompt, setManualPrompt] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [mealType, setMealType] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(true);
  const [expandedRecipes, setExpandedRecipes] = useState<Set<string>>(new Set());
  const [sharingFor, setSharingFor] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const loadSeq = useRef(0);

  // Load ingredients (ignore AbortError)
  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/ingredients", { signal: ctrl.signal });
        if (!res.ok) throw new Error("Failed to fetch ingredients");
        const data = await res.json();
        setIngredients(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setIngredients([]);
      }
    })();
    return () => ctrl.abort();
  }, []);

  // SINGLE loader: load a specific thread from URL or load recent threads
  useEffect(() => {
    const ctrl = new AbortController();
    const seq = ++loadSeq.current;
    setError("");

    (async () => {
      try {
        const urlId = searchParams.get("thread");
        if (!urlId) {
          const res = await fetch("/api/threads", { cache: "no-store", signal: ctrl.signal });
          if (!res.ok) throw new Error("Failed to load threads");
          const data = await res.json();
          if (loadSeq.current !== seq || ctrl.signal.aborted) return;

          const list = Array.isArray(data) ? data : data?.threads || [];
          if (list.length) {
            const first = list[0];
            setActiveThreadId(first.id);
            const msgs: ChatMsg[] = (first.messages || []).map(normalizeMessage);
            const deduped: ChatMsg[] = dedupeById<ChatMsg>(msgs);
            setMessages(deduped);
            rebuildHistory(deduped);
          } else {
            setActiveThreadId(`t_${Date.now()}`);
            setMessages([]);
            setHistory([]);
          }
          return;
        }

        const res = await fetch(`/api/threads/${encodeURIComponent(urlId)}`, { cache: "no-store", signal: ctrl.signal });
        if (loadSeq.current !== seq || ctrl.signal.aborted) return;

        if (res.status === 404) {
          setActiveThreadId(urlId);
          setMessages([]);
          setHistory([]);
          return;
        }
        if (!res.ok) throw new Error("Failed to load thread");

        const data = await res.json();
        setActiveThreadId(data.id || urlId);
        const msgs: ChatMsg[] = (((data.messages as any[]) || []).map(normalizeMessage)) as ChatMsg[];
        const deduped: ChatMsg[] = dedupeById<ChatMsg>(msgs);
        setMessages(deduped);
        rebuildHistory(deduped);
      } catch (e: any) {
        if (e?.name === "AbortError" || ctrl.signal.aborted) return;
        setError(e?.message || "Failed loading thread");
      }
    })();

    return () => ctrl.abort();
  }, [searchParams]);

  // Persist thread changes (debounced)
  useEffect(() => {
    if (!activeThreadId || messages.length === 0) return;
    const timeout = setTimeout(() => {
      fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeThreadId,
          title:
            messages.findLast?.(m => m.role === "model" && m.recipe?.title)?.recipe?.title ||
            messages.findLast?.(m => m.role === "user")?.content?.slice(0, 60) ||
            "New Recipe",
          messages: messages.map(m => ({
            id: m.id,
            role: m.role,
            content: m.content,
            saved: !!m.saved,
            recipeId: m.recipeId ?? null,
            createdAt: m.createdAt || new Date().toISOString(),
            recipeSnapshot: m.recipe
              ? {
                  title: m.recipe.title,
                  ingredients: m.recipe.ingredients || [],
                  instructions: m.recipe.instructions || [],
                  nutrition: m.recipe.nutrition || {},
                }
              : undefined,
          })),
        }),
      })
        .then(() => {
          window.dispatchEvent(new CustomEvent("threadsUpdated"));
        })
        .catch(() => {});
    }, 500);
    return () => clearTimeout(timeout);
  }, [messages, activeThreadId]);

  function normalizeMessage(m: any): ChatMsg {
    const snap = m.recipeSnapshot || m.recipe;
    let recipe: ChatMsg["recipe"] | undefined;
    if (snap) {
      recipe = {
        title: snap.title || "Untitled Recipe",
        ingredients: Array.isArray(snap.ingredients) ? snap.ingredients : [],
        instructions: Array.isArray(snap.instructions) ? snap.instructions : [],
        nutrition: snap.nutrition || {},
      };
    }
    return {
      id: m.id,
      role: m.role,
      content: m.content,
      recipe,
      recipeSnapshot: snap,
      saved: !!m.saved,
      recipeId: m.recipeId ?? null,
      createdAt: m.createdAt || new Date().toISOString(),
    };
  }

  function rebuildHistory(msgs: ChatMsg[]) {
    const compact = msgs
      .map(m =>
        m.role === "user"
          ? { role: "user" as const, content: m.content || "" }
          : m.recipe
          ? {
              role: "model" as const,
              content: `Generated recipe: ${m.recipe.title}. Key ingredients: ${(m.recipe.ingredients || [])
                .slice(0, 6)
                .join(", ")}`,
            }
          : m.content
          ? { role: "model" as const, content: m.content }
          : null
      )
      .filter(Boolean) as { role: "user" | "model"; content: string }[];
    setHistory(compact.slice(-12));
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    let combined: string[] = [];
    if (manualPrompt.trim()) {
      combined = [
        ...selectedIngredients,
        ...manualPrompt
          .split(",")
          .map(s => s.trim())
          .filter(Boolean),
      ];
    } else {
      combined = [...selectedIngredients];
    }
    combined = Array.from(new Set(combined));

    const userMsg = [
      combined.length ? `Ingredients: ${combined.join(", ")}` : "",
      mealType ? `Meal: ${mealType}` : "",
    ]
      .filter(Boolean)
      .join(" • ");

    if (userMsg) {
      const userId = `m_${Date.now()}_u`;
      const userMessage: ChatMsg = { id: userId, role: "user", content: userMsg, createdAt: new Date().toISOString() };
      setMessages(prev => {
        const next = dedupeById([...prev, userMessage]);
        rebuildHistory(next);
        return next;
      });
    }

    try {
      const res = await fetch("/api/recipes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId: activeThreadId, userMsg, history }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Generation failed");

      const modelMsg: ChatMsg = {
        id: data.messageId,
        role: "model",
        recipe: {
          title: data.title,
          ingredients: Array.isArray(data.ingredients) ? data.ingredients : [],
          instructions: Array.isArray(data.instructions) ? data.instructions : [],
          nutrition: data.nutrition || {},
        },
        recipeSnapshot: {
          title: data.title,
          ingredients: data.ingredients,
          instructions: data.instructions,
          nutrition: data.nutrition,
        },
        saved: false,
        createdAt: new Date().toISOString(),
      };

      setMessages(prev => {
        const next = dedupeById([...prev, modelMsg]);
        rebuildHistory(next);
        return next;
      });

      setManualPrompt("");
      setSelectedIngredients([]);
      setMealType("");
      
      // Hide form on mobile after generation
      if (window.innerWidth < 1024) {
        setShowForm(false);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleSave(messageId: string) {
    const msg = messages.find(m => m.id === messageId);
    if (!msg || msg.role !== "model" || !msg.recipe) return;
    const isSaved = !!msg.saved;
    if (!activeThreadId) return;

    try {
      if (isSaved) {
        await fetch(`/api/recipes/save?threadId=${activeThreadId}&messageId=${messageId}`, {
          method: "DELETE",
        });
        setMessages(prev => prev.map(m => (m.id === messageId ? { ...m, saved: false, recipeId: null } : m)));
      } else {
        const res = await fetch("/api/recipes/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            threadId: activeThreadId,
            messageId,
            title: msg.recipe.title,
            ingredients: msg.recipe.ingredients,
            instructions: msg.recipe.instructions,
            nutrition: msg.recipe.nutrition,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to save");
        setMessages(prev => prev.map(m => (m.id === messageId ? { ...m, saved: true, recipeId: data.id } : m)));
      }
    } catch {
      // ignore UI error for now
    }
  }

  function toggleRecipeExpansion(id: string) {
    setExpandedRecipes(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
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
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center justify-center h-9 w-9 sm:h-11 sm:w-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg flex-shrink-0">
                <HiOutlineSparkles className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl lg:text-2xl font-bold text-neutral-900 tracking-tight">
                  AI Recipe Generator
                </h1>
                <p className="text-neutral-600 text-[10px] sm:text-xs hidden sm:block">
                  Generate smart, personalized recipes instantly!
                </p>
              </div>
            </div>

            {/* Mobile Form Toggle */}
            <button
              onClick={() => setShowForm(!showForm)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold shadow-md hover:bg-emerald-700 transition"
            >
              <HiOutlineSparkles className="h-3.5 w-3.5" />
              <span>{showForm ? 'Hide' : 'New Recipe'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
            {/* Left Column - Form */}
            <div className={`lg:col-span-2 ${showForm ? 'block' : 'hidden lg:block'}`}>
              <div className="sticky top-3 sm:top-4">
                <form
                  className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border border-emerald-100 p-3 sm:p-4 lg:p-5 space-y-3 sm:space-y-4"
                  onSubmit={handleGenerate}
                >
                  {/* Recipe Prompt */}
                  <div>
                    <label className="flex items-center gap-1.5 font-bold text-neutral-900 mb-1.5 sm:mb-2 text-xs sm:text-sm">
                      <HiOutlineSparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600" />
                      Recipe Prompt
                    </label>
                    <textarea
                      className="w-full rounded-lg sm:rounded-xl border-2 border-neutral-200 bg-white px-2.5 sm:px-3 py-2 text-xs sm:text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition resize-none"
                      rows={2}
                      placeholder="e.g. chicken, broccoli, rice"
                      value={manualPrompt}
                      onChange={e => setManualPrompt(e.target.value)}
                    />
                  </div>

                  {/* Available Ingredients */}
                  <div>
                    <label className="flex items-center gap-1.5 font-bold text-neutral-900 mb-1.5 sm:mb-2 text-xs sm:text-sm">
                      <HiOutlineBuildingStorefront className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600" />
                      <span className="truncate">Available Ingredients</span>
                      {selectedIngredients.length > 0 && (
                        <span className="ml-auto text-[10px] sm:text-xs bg-emerald-100 text-emerald-700 px-1.5 sm:px-2 py-0.5 rounded-full font-semibold">
                          {selectedIngredients.length}
                        </span>
                      )}
                    </label>
                    <div className="flex flex-wrap gap-1.5 max-h-32 sm:max-h-40 overflow-y-auto p-1">
                      {ingredients.length === 0 && (
                        <span className="text-neutral-400 text-[10px] sm:text-xs">No ingredients found.</span>
                      )}
                      {ingredients.map((ingredient: any) => {
                        const key = ingredient.id || ingredient.name;
                        const name = ingredient.name || ingredient;
                        const isSelected = selectedIngredients.includes(name);
                        return (
                          <button
                            type="button"
                            key={key}
                            onClick={() =>
                              setSelectedIngredients(prev =>
                                prev.includes(name)
                                  ? prev.filter(i => i !== name)
                                  : [...prev, name]
                              )
                            }
                            className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border-2 text-[10px] sm:text-xs font-semibold transition-all ${
                              isSelected
                                ? "bg-emerald-500 border-emerald-600 text-white shadow-md scale-105"
                                : "bg-white border-neutral-200 text-neutral-700 hover:border-emerald-300 hover:bg-emerald-50"
                            }`}
                          >
                            {name}
                          </button>
                        );
                      })}
                    </div>
                    {selectedIngredients.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedIngredients([])}
                        className="mt-2 text-[10px] sm:text-xs text-emerald-600 hover:text-emerald-700 font-semibold underline"
                      >
                        Clear all ({selectedIngredients.length})
                      </button>
                    )}
                  </div>

                  {/* Meal Type */}
                  <div>
                    <label className="flex items-center gap-1.5 font-bold text-neutral-900 mb-1.5 sm:mb-2 text-xs sm:text-sm">
                      <HiOutlineTag className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600" />
                      Meal Type *
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 sm:gap-2">
                      {MEAL_TYPES.map(type => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setMealType(type.value)}
                          className={`flex flex-col items-center justify-center gap-0.5 sm:gap-1 p-1.5 sm:p-2 rounded-lg border-2 transition-all ${
                            mealType === type.value
                              ? "bg-emerald-500 border-emerald-600 shadow-lg scale-105"
                              : "bg-white border-neutral-200 hover:border-emerald-300"
                          }`}
                        >
                          <span className="text-base sm:text-lg">{type.icon}</span>
                          <span className={`text-[9px] sm:text-[10px] font-bold ${
                            mealType === type.value ? "text-white" : "text-neutral-800"
                          }`}>
                            {type.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Generate Button */}
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-white font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:from-neutral-400 disabled:to-neutral-500"
                    disabled={loading || !mealType}
                  >
                    <HiOutlineSparkles className="h-4 w-4" />
                    {loading ? "Generating..." : "Generate Recipe"}
                  </button>

                  {/* Quick Info */}
                  {!mealType && (
                    <p className="text-[10px] sm:text-xs text-neutral-500 text-center">
                      Select a meal type to continue
                    </p>
                  )}
                </form>
              </div>
            </div>

            {/* Right Column - Messages */}
            <div className={`lg:col-span-3 space-y-3 sm:space-y-4 ${!showForm ? 'block' : 'hidden lg:block'}`}>
              {error && (
                <div className="bg-rose-50 border-2 border-rose-200 rounded-xl p-3 sm:p-4 text-rose-700 text-center font-semibold shadow-lg animate-in slide-in-from-top">
                  <div className="flex items-center justify-center gap-2">
                    <HiOutlineExclamationTriangle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">{error}</span>
                  </div>
                </div>
              )}

              {!loading && !error && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center min-h-[250px] sm:min-h-[350px] bg-gradient-to-br from-emerald-50/50 to-white rounded-2xl border-2 border-dashed border-emerald-200 p-6 sm:p-8">
                  <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center mb-3 sm:mb-4">
                    <HiOutlineSparkles className="h-7 w-7 sm:h-8 sm:w-8 text-emerald-600" />
                  </div>
                  <div className="text-sm sm:text-base font-bold text-neutral-700 text-center mb-1">
                    Ready to create magic? ✨
                  </div>
                  <div className="text-xs sm:text-sm text-neutral-500 text-center max-w-xs">
                    Select your ingredients and meal type, then generate your perfect recipe!
                  </div>
                </div>
              )}

              {loading && (
                <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-emerald-50 rounded-xl border border-emerald-200 shadow-sm animate-pulse">
                  <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-emerald-300 animate-spin border-4 border-emerald-100 border-t-emerald-600" />
                  <div className="text-emerald-700 text-xs sm:text-sm font-semibold">Creating your recipe…</div>
                </div>
              )}

              <div className="space-y-3 sm:space-y-4">
                {messages.map(m =>
                  m.role === "user" ? (
                    <div key={m.id} className="flex justify-end animate-in slide-in-from-right">
                      {(() => {
                        const ingMatch = m.content?.match(/Ingredients:\s*([^|•]+)/i);
                        const mealMatch = m.content?.match(/Meal(?: type)?:\s*([^|•]+)/i);
                        const ings = (ingMatch?.[1] || "")
                          .split(",")
                          .map(s => s.trim())
                          .filter(Boolean);
                        const meal = mealMatch?.[1]?.trim();
                        return (
                          <div className="max-w-[90%] sm:max-w-[80%] rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-3 sm:px-4 py-2.5 sm:py-3 shadow-lg space-y-2">
                            {/* Meal Type Section */}
                            {meal && (
                              <div className="flex items-center gap-1.5 pb-2 border-b border-white/20">
                                <HiOutlineTag className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                                <span className="text-xs sm:text-sm font-bold">
                                  {meal.charAt(0).toUpperCase() + meal.slice(1)}
                                </span>
                              </div>
                            )}
                            
                            {/* Ingredients Section */}
                            {ings.length > 0 && (
                              <div>
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <HiOutlineShoppingCart className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0 opacity-80" />
                                  <span className="text-[10px] sm:text-xs font-semibold opacity-90">
                                    Using {ings.length} {ings.length === 1 ? 'ingredient' : 'ingredients'}:
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {ings.map((ingredient, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center px-2 sm:px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-semibold bg-white/15 border border-white/20 backdrop-blur-sm hover:bg-white/25 transition"
                                    >
                                      {ingredient}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Fallback if no parsed content */}
                            {!meal && ings.length === 0 && (
                              <div className="text-xs sm:text-sm">
                                {m.content}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div
                      key={m.id}
                      className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-neutral-200 overflow-hidden hover:shadow-2xl transition-all animate-in slide-in-from-left"
                    >
                      <div className="p-3 sm:p-4 lg:p-5 space-y-3 sm:space-y-4">
                        {/* Recipe Header */}
                        <div className="flex items-start justify-between gap-2 sm:gap-3 pb-2 sm:pb-3 border-b-2 border-emerald-100">
                          <div className="flex-1 min-w-0">
                            <h2 className="text-base sm:text-lg lg:text-xl font-bold tracking-tight text-neutral-900 line-clamp-2">
                              {m.recipe?.title || m.content || "Generated Recipe"}
                            </h2>
                            {m.createdAt && (
                              <p className="text-[10px] sm:text-xs text-neutral-500 mt-1">
                                {new Date(m.createdAt).toLocaleTimeString('en-US', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => toggleSave(m.id)}
                              aria-pressed={!!m.saved}
                              className={`inline-flex items-center gap-1 sm:gap-1.5 rounded-lg border-2 px-2 sm:px-2.5 py-1.5 text-[10px] sm:text-xs font-bold transition-all flex-shrink-0 ${
                                m.saved
                                  ? "border-emerald-600 bg-emerald-600 text-white shadow-md scale-105"
                                  : "border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                              }`}
                            >
                              {m.saved ? (
                                <HiBookmark className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              ) : (
                                <HiOutlineBookmark className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              )}
                              <span className="hidden sm:inline">{m.saved ? "Saved" : "Save"}</span>
                            </button>
                            {m.saved && m.recipeId && (
                              <button
                                type="button"
                                onClick={() => setSharingFor(sharingFor === m.id ? null : m.id)}
                                className="inline-flex items-center gap-1.5 rounded-lg border-2 border-neutral-200 px-2.5 py-1.5 text-[10px] sm:text-xs font-bold text-neutral-700 hover:border-emerald-300 hover:bg-emerald-50"
                              >
                                Share
                              </button>
                            )}
                          </div>
                        </div>

                        {m.recipe && Array.isArray(m.recipe.ingredients) ? (
                          <>
                            {/* Nutrition - Moved to top for prominence */}
                            {m.recipe.nutrition && (
                              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg sm:rounded-xl p-2.5 sm:p-3 border border-emerald-100">
                                <h3 className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-neutral-900 mb-2">
                                  <HiOutlineChartBar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600" />
                                  Nutrition Facts
                                </h3>
                                <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                                  <div className="bg-white rounded-lg p-1.5 sm:p-2 text-center border border-amber-100">
                                    <div className="text-xs sm:text-sm lg:text-base font-bold text-amber-700">
                                      {m.recipe.nutrition.calories ?? "—"}
                                    </div>
                                    <div className="text-[8px] sm:text-[9px] font-semibold text-neutral-600 uppercase">
                                      Cal
                                    </div>
                                  </div>
                                  <div className="bg-white rounded-lg p-1.5 sm:p-2 text-center border border-rose-100">
                                    <div className="text-xs sm:text-sm lg:text-base font-bold text-rose-700">
                                      {m.recipe.nutrition.protein ?? "—"}g
                                    </div>
                                    <div className="text-[8px] sm:text-[9px] font-semibold text-neutral-600 uppercase">
                                      Protein
                                    </div>
                                  </div>
                                  <div className="bg-white rounded-lg p-1.5 sm:p-2 text-center border border-blue-100">
                                    <div className="text-xs sm:text-sm lg:text-base font-bold text-blue-700">
                                      {m.recipe.nutrition.carbs ?? "—"}g
                                    </div>
                                    <div className="text-[8px] sm:text-[9px] font-semibold text-neutral-600 uppercase">
                                      Carbs
                                    </div>
                                  </div>
                                  <div className="bg-white rounded-lg p-1.5 sm:p-2 text-center border border-emerald-100">
                                    <div className="text-xs sm:text-sm lg:text-base font-bold text-emerald-700">
                                      {m.recipe.nutrition.fat ?? "—"}g
                                    </div>
                                    <div className="text-[8px] sm:text-[9px] font-semibold text-neutral-600 uppercase">
                                      Fat
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Collapsible Content on Mobile */}
                            <div className={`space-y-3 sm:space-y-4 ${expandedRecipes.has(m.id) ? 'block' : 'hidden sm:block'}`}>
                              {/* Ingredients */}
                              <div>
                                <h3 className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-neutral-900 mb-2">
                                  <HiOutlineShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600" />
                                  Ingredients
                                  <span className="ml-auto text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
                                    {m.recipe.ingredients.length}
                                  </span>
                                </h3>
                                <ul className="grid grid-cols-1 gap-1 sm:gap-1.5">
                                  {m.recipe.ingredients.map((item, idx) => (
                                    <li
                                      key={idx}
                                      className="flex items-center gap-2 bg-neutral-50 rounded-lg px-2 sm:px-2.5 py-1.5 border border-neutral-200 text-[11px] sm:text-xs"
                                    >
                                      <span className="h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                                      <span className="text-neutral-800">{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* Instructions */}
                              <div>
                                <h3 className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-neutral-900 mb-2">
                                  <HiOutlineClipboardDocumentList className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600" />
                                  Instructions
                                  <span className="ml-auto text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                                    {m.recipe.instructions.length} steps
                                  </span>
                                </h3>
                                <ol className="space-y-2 sm:space-y-2.5">
                                  {Array.isArray(m.recipe.instructions) &&
                                    m.recipe.instructions.map((step, idx) => (
                                      <li key={idx} className="flex gap-2">
                                        <span className="flex-shrink-0 flex items-center justify-center h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-emerald-500 text-white font-bold text-[10px] sm:text-xs">
                                          {idx + 1}
                                        </span>
                                        <p className="text-neutral-700 text-[11px] sm:text-xs leading-relaxed pt-0.5">
                                          {step}
                                        </p>
                                      </li>
                                    ))}
                                </ol>
                              </div>
                            </div>

                            {/* Show More/Less Button (Mobile Only) */}
                            <button
                              onClick={() => toggleRecipeExpansion(m.id)}
                              className="sm:hidden w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition"
                            >
                              {expandedRecipes.has(m.id) ? (
                                <>
                                  <span>Show Less</span>
                                  <HiChevronUp className="h-4 w-4" />
                                </>
                              ) : (
                                <>
                                  <span>Show Full Recipe</span>
                                  <HiChevronDown className="h-4 w-4" />
                                </>
                              )}
                            </button>
                          </>
                        ) : (
                          <div className="text-xs sm:text-sm text-neutral-500 text-center py-6 sm:py-8">
                            Recipe details unavailable – generate a new one.
                          </div>
                        )}
                        {m.saved && m.recipeId && sharingFor === m.id && (
                          <div className="px-2">
                            <ShareMenu recipeId={m.recipeId} onClose={() => setSharingFor(null)} />
                          </div>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function GenerateRecipePage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
      </div>
    }>
      <GenerateRecipeContent />
    </Suspense>
  );
}