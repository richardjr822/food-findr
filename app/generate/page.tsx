"use client";

import { useState, useEffect } from "react";
import { HiOutlineSparkles } from "react-icons/hi2";
import Sidebar from "@/components/sidebar";

const MEAL_TYPES = [
  { label: "Breakfast", value: "breakfast", icon: "🌅" },
  { label: "Lunch", value: "lunch", icon: "☀️" },
  { label: "Dinner", value: "dinner", icon: "🌙" },
  { label: "Snack", value: "snack", icon: "🍿" },
  { label: "Dessert", value: "dessert", icon: "🍰" },
];

export default function GenerateRecipePage() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [manualPrompt, setManualPrompt] = useState("");
  const [mealType, setMealType] = useState("");
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState<any>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState<{ role: "user" | "model"; content: string }[]>([]);

  // NEW: conversation messages (persisted) — keep prior recipes and user turns
  type ChatMsg = { id: string; role: "user" | "model"; content?: string; recipe?: any };
  const [messages, setMessages] = useState<ChatMsg[]>([]);

  // Load/save chat history to keep the prompt continuous
  useEffect(() => {
    const stored = localStorage.getItem("generateChat");
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch {}
    }
    // NEW: load message thread (conversation)
    const storedMsgs = localStorage.getItem("generateMessages");
    if (storedMsgs) {
      try {
        setMessages(JSON.parse(storedMsgs));
      } catch {}
    }
  }, []);
  useEffect(() => {
    localStorage.setItem("generateChat", JSON.stringify(history.slice(-12))); // keep last 12 turns
  }, [history]);
  useEffect(() => {
    localStorage.setItem("generateMessages", JSON.stringify(messages.slice(-20))); // keep last 20 bubbles
  }, [messages]);

  // Fetch user's available ingredients
  useEffect(() => {
    async function fetchIngredients() {
      try {
        const res = await fetch("/api/ingredients");
        if (!res.ok) throw new Error("Failed to fetch ingredients");
        const data = await res.json();
        setIngredients(data.map((i: any) => i.name));
      } catch (err: any) {
        setError("Failed to load your ingredients.");
      }
    }
    fetchIngredients();
  }, []);

  // Save recipe locally (simple localStorage "savedRecipes")
  function handleSaveRecipe(r: any) {
    try {
      const key = "savedRecipes";
      const list = JSON.parse(localStorage.getItem(key) || "[]");
      const exists = Array.isArray(list) && list.some((x: any) => x?.title === r?.title);
      if (!exists) {
        const item = { ...r, savedAt: new Date().toISOString() };
        localStorage.setItem(key, JSON.stringify([item, ...list].slice(0, 50)));
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch {
      // ignore
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    // IMPORTANT: keep prior conversation; do not clear
    setSaved(false);

    // Combine manual prompt and selected ingredients
    let combinedIngredients: string[] = [];
    if (manualPrompt.trim()) {
      combinedIngredients = [
        ...selectedIngredients,
        ...manualPrompt
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s),
      ];
    } else {
      combinedIngredients = [...selectedIngredients];
    }
    combinedIngredients = Array.from(new Set(combinedIngredients));

    // Build a concise user message (no duplicate "spicy" at start)
    const userMsg = [
      combinedIngredients.length ? `Ingredients: ${combinedIngredients.join(", ")}` : "",
      mealType ? `Meal: ${mealType}` : "",
    ]
      .filter(Boolean)
      .join(" • ");

    // Append user message to conversation UI immediately
    if (userMsg) {
      const id = `u_${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id, role: "user", content: userMsg },
      ]);
    }

    try {
      const res = await fetch("/api/recipes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredients: combinedIngredients.join(", "),
          mealType,
          history: [
            ...history.slice(-12),
            ...(userMsg ? [{ role: "user" as const, content: userMsg }] : []),
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to generate recipe.");

      // Keep last recipe for convenience (optional)
      setRecipe(data);

      // Append model recipe to conversation UI
      const id = `m_${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id, role: "model", recipe: data },
      ]);

      // Append compact model turn for context
      setHistory((prev) => [
        ...prev.slice(-12),
        ...(userMsg ? [{ role: "user" as const, content: userMsg }] : []),
        {
          role: "model" as const,
          content: `Generated recipe: ${data.title}. Key ingredients: ${
            Array.isArray(data.ingredients) ? data.ingredients.slice(0, 6).join(", ") : ""
          }`,
        },
      ]);

      setManualPrompt("");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden relative bg-white">
      {/* Subtle background food image, but keep white accent */}
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
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 h-full overflow-y-auto relative z-10">
        <div className="h-full w-full px-8 py-8">
          {/* Compact Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 shadow flex-shrink-0">
              <HiOutlineSparkles className="h-6 w-6 text-emerald-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
                AI-Powered Recipe Generator
              </h1>
              <p className="text-neutral-600 text-sm">
                Let AI cook for you — generate smart, personalized recipes from what you already have!
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100%-8rem)]">
            {/* Left Column: Form container */}
            <div className="overflow-y-auto">
              <form
                className="bg-white rounded-3xl shadow-lg border border-neutral-200 p-6 space-y-6 mb-8"
                onSubmit={handleGenerate}
              >
                {/* Manual Prompt */}
                <div>
                  <label className="block font-bold text-neutral-900 mb-2 text-base">
                    Recipe prompt (comma separated)
                  </label>
                  <textarea
                    className="w-full rounded-xl border-2 border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 transition resize-none"
                    rows={2}
                    placeholder="e.g. chicken, broccoli, rice"
                    value={manualPrompt}
                    onChange={(e) => setManualPrompt(e.target.value)}
                  />
                </div>

                {/* Available Ingredients */}
                <div>
                  <label className="flex items-center gap-2 font-bold text-neutral-900 mb-2 text-base">
                    <span className="text-xl">🥘</span>
                    Select from your available ingredients
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ingredients.length === 0 && (
                      <span className="text-neutral-400 text-sm">No ingredients found.</span>
                    )}
                    {ingredients.map((name) => (
                      <button
                        type="button"
                        key={name}
                        onClick={() =>
                          setSelectedIngredients((prev) =>
                            prev.includes(name)
                              ? prev.filter((i) => i !== name)
                              : [...prev, name]
                          )
                        }
                        className={`px-3 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                          selectedIngredients.includes(name)
                            ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow"
                            : "bg-white border-neutral-200 text-neutral-700 hover:border-emerald-200"
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Meal Type Selection */}
                <div>
                  <label className="flex items-center gap-2 font-bold text-neutral-900 mb-2 text-base">
                    <span className="text-xl">🍽️</span>
                    Meal Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {MEAL_TYPES.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setMealType(type.value)}
                        className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl border-2 transition-all ${
                          mealType === type.value
                            ? "bg-emerald-50 border-emerald-500 shadow"
                            : "bg-white border-neutral-200 hover:border-emerald-200"
                        }`}
                      >
                        <span className="text-2xl">{type.icon}</span>
                        <span className="text-xs font-semibold text-neutral-800">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4 text-white font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={
                    loading ||
                    (manualPrompt.trim().length === 0 && selectedIngredients.length === 0) ||
                    !mealType
                  }
                >
                  <HiOutlineSparkles className="h-5 w-5" />
                  {loading ? "Generating..." : "Generate Recipe"}
                </button>
              </form>
            </div>

            {/* Right Column: Results */}
            <div className="overflow-y-auto">
              {/* Error State */}
              {error && (
                <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-4 text-rose-700 text-center font-semibold shadow">
                  <span className="text-xl mr-2">⚠️</span>
                  {error}
                </div>
              )}

              {/* Empty State */}
              {!loading && !error && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full bg-neutral-50 rounded-3xl border border-neutral-200 p-8">
                  <HiOutlineSparkles className="h-12 w-12 text-neutral-300 mb-3" />
                  <div className="text-base font-semibold text-neutral-400 text-center">Start a conversation</div>
                  <div className="text-xs text-neutral-500 mt-1 text-center">Ask follow-ups and generate multiple recipes without losing the previous ones.</div>
                </div>
              )}

              {/* Loading bubble */}
              {loading && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-8 rounded-full bg-emerald-100 animate-pulse" />
                  <div className="text-neutral-500 text-sm">Generating…</div>
                </div>
              )}

              {/* Conversation thread */}
              <div className="space-y-6">
                {messages.map((m) =>
                  m.role === "user" ? (
                    <div key={m.id} className="flex justify-end">
                      {(() => {
                        const ingMatch = m.content?.match(/Ingredients:\s*([^|•]+)/i);
                        const mealMatch = m.content?.match(/Meal(?: type)?:\s*([^|•]+)/i);
                        const ings = (ingMatch?.[1] || "")
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean);
                        const meal = mealMatch?.[1]?.trim();

                        return (
                          <div className="max-w-[85%] rounded-2xl bg-emerald-600 text-white text-sm px-4 py-3 shadow">
                            <div className="flex flex-wrap gap-1.5">
                              {meal && (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-white/15 border border-white/20">
                                  🍽️ {meal.charAt(0).toUpperCase() + meal.slice(1)}
                                </span>
                              )}
                              {ings.map((i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-white/10 border border-white/20"
                                >
                                  {i}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div
                      key={m.id}
                      className="bg-white rounded-3xl shadow-xl border border-neutral-200 overflow-hidden"
                    >
                      <div className="p-6 space-y-6">
                        {/* Title + Save */}
                        <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
                            {m.recipe?.title ?? "Generated Recipe"}
                          </h2>
                          <button
                            type="button"
                            onClick={() => handleSaveRecipe(m.recipe)}
                            className="inline-flex items-center gap-2 rounded-lg border-2 border-emerald-600 text-emerald-700 px-3 py-1.5 text-sm font-bold hover:bg-emerald-50 transition disabled:opacity-60"
                          >
                            {saved ? "Saved!" : "Save"}
                          </button>
                        </div>

                        {/* Ingredients */}
                        <div>
                          <h3 className="flex items-center gap-2 font-bold text-lg text-neutral-900 mb-3">
                            <span className="text-xl">🛒</span>
                            Ingredients
                          </h3>
                          <ul className="grid grid-cols-1 gap-2">
                            {m.recipe?.ingredients?.map((item: string, idx: number) => (
                              <li
                                key={idx}
                                className="flex items-center gap-2 bg-neutral-50 rounded-lg px-3 py-2 border border-neutral-200 text-sm"
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                                <span className="text-neutral-800">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Instructions */}
                        <div>
                          <h3 className="flex items-center gap-2 font-bold text-lg text-neutral-900 mb-3">
                            <span className="text-xl">👨‍🍳</span>
                            Instructions
                          </h3>
                          <ol className="space-y-3">
                            {m.recipe?.instructions?.map((step: string, idx: number) => (
                              <li key={idx} className="flex gap-3">
                                <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs">
                                  {idx + 1}
                                </span>
                                <p className="text-neutral-700 text-sm leading-relaxed pt-0.5">{step}</p>
                              </li>
                            ))}
                          </ol>
                        </div>

                        {/* Nutrition */}
                        <div>
                          <h3 className="flex items-center gap-2 font-bold text-lg text-neutral-900 mb-3">
                            <span className="text-xl">📊</span>
                            Nutrition
                          </h3>
                          <div className="grid grid-cols-4 gap-3">
                            <div className="bg-gradient-to-br from-amber-50 to-white rounded-xl p-3 border border-amber-100">
                              <div className="text-xl font-bold text-amber-700">
                                {m.recipe?.nutrition?.calories ?? "—"}
                              </div>
                              <div className="text-[10px] font-semibold text-neutral-600 uppercase">Cal</div>
                            </div>
                            <div className="bg-gradient-to-br from-rose-50 to-white rounded-xl p-3 border border-rose-100">
                              <div className="text-xl font-bold text-rose-700">
                                {m.recipe?.nutrition?.protein ?? "—"}
                              </div>
                              <div className="text-[10px] font-semibold text-neutral-600 uppercase">Pro</div>
                            </div>
                            <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-3 border border-blue-100">
                              <div className="text-xl font-bold text-blue-700">
                                {m.recipe?.nutrition?.carbs ?? "—"}
                              </div>
                              <div className="text-[10px] font-semibold text-neutral-600 uppercase">Carb</div>
                            </div>
                            <div className="bg-gradient-to-br from-emerald-50 to-white rounded-xl p-3 border border-emerald-100">
                              <div className="text-xl font-bold text-emerald-700">
                                {m.recipe?.nutrition?.fat ?? "—"}
                              </div>
                              <div className="text-[10px] font-semibold text-neutral-600 uppercase">Fat</div>
                            </div>
                          </div>
                        </div>
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