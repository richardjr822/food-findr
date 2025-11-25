"use client";

import { useState } from "react";

export default function PublicTryPage() {
  const [manualPrompt, setManualPrompt] = useState("");
  const [mealType, setMealType] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recipe, setRecipe] = useState<any | null>(null);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setRecipe(null);
    try {
      const res = await fetch("/api/public/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userMsg: manualPrompt, mealType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Generation failed");
      setRecipe(data);
    } catch (e: any) {
      setError(e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 via-white to-neutral-50">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-neutral-200/50 shadow-sm">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-sm">
              <svg className="h-6 w-6 text-emerald-700" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M3 11c0 4 3 7 9 7s9-3 9-7" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 10c1-2 3-3 5-3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15 6c1 1 1 3 0 4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 4c.6 0 1.6.7 2 1.4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <span className="font-bold text-xl tracking-tight text-neutral-800">FoodFindr</span>
          </a>
          <div className="text-xs text-neutral-600">Public generator</div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8 grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <form onSubmit={handleGenerate} className="bg-white rounded-2xl shadow-xl border border-neutral-200 p-5 space-y-4">
            <div>
              <label className="block text-sm font-bold text-neutral-900 mb-1">Recipe Prompt</label>
              <textarea
                className="w-full rounded-lg border-2 border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                rows={3}
                placeholder="e.g. chicken, broccoli, rice"
                value={manualPrompt}
                onChange={e => setManualPrompt(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-neutral-900 mb-1">Meal Type</label>
              <div className="grid grid-cols-3 gap-2">
                {["breakfast","lunch","dinner","snack","dessert"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setMealType(type)}
                    className={`px-3 py-2 rounded-lg border-2 text-sm font-semibold transition-all ${
                      mealType === type ? "bg-emerald-500 border-emerald-600 text-white" : "bg-white border-neutral-200 text-neutral-800 hover:border-emerald-300"
                    }`}
                  >
                    {type.charAt(0).toUpperCase()+type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !mealType}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-sm text-white font-bold shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              {loading ? "Generating..." : "Generate Recipe"}
            </button>

            {error && (
              <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded px-3 py-2">{error}</div>
            )}

            <p className="text-[11px] text-neutral-500">This public demo does not save or share recipes.</p>
          </form>
        </div>

        <div className="lg:col-span-3">
          {!recipe && (
            <div className="flex items-center justify-center min-h-[240px] bg-gradient-to-br from-emerald-50/50 to-white rounded-2xl border-2 border-dashed border-emerald-200 p-6">
              <div className="text-neutral-600 text-sm">Generate a recipe to see it here.</div>
            </div>
          )}

          {recipe && (
            <article className="bg-white rounded-2xl shadow-xl border border-neutral-200 overflow-hidden">
              <div className="p-6 space-y-5">
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900">{recipe.title}</h1>
                </div>

                {Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0 && (
                  <section>
                    <h2 className="text-base font-bold text-neutral-900 mb-2">Ingredients</h2>
                    <ul className="grid grid-cols-1 gap-1.5">
                      {recipe.ingredients.map((item: string, idx: number) => (
                        <li key={idx} className="flex items-center gap-2 bg-neutral-50 rounded-lg px-3 py-2 border border-neutral-200 text-sm">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <span className="text-neutral-800">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {Array.isArray(recipe.instructions) && recipe.instructions.length > 0 && (
                  <section>
                    <h2 className="text-base font-bold text-neutral-900 mb-2">Instructions</h2>
                    <ol className="space-y-2">
                      {recipe.instructions.map((step: string, idx: number) => (
                        <li key={idx} className="flex gap-2">
                          <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-emerald-500 text-white font-bold text-xs">{idx + 1}</span>
                          <p className="text-neutral-700 text-sm leading-relaxed pt-0.5">{step}</p>
                        </li>
                      ))}
                    </ol>
                  </section>
                )}

                {recipe.nutrition && (
                  <section>
                    <h2 className="text-base font-bold text-neutral-900 mb-2">Nutrition</h2>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="bg-neutral-50 rounded-lg p-2 text-center border border-neutral-200">
                        <div className="text-sm font-bold text-amber-700">{recipe.nutrition.calories ?? "—"}</div>
                        <div className="text-[10px] font-semibold text-neutral-600 uppercase">Cal</div>
                      </div>
                      <div className="bg-neutral-50 rounded-lg p-2 text-center border border-neutral-200">
                        <div className="text-sm font-bold text-rose-700">{recipe.nutrition.protein ?? "—"}g</div>
                        <div className="text-[10px] font-semibold text-neutral-600 uppercase">Protein</div>
                      </div>
                      <div className="bg-neutral-50 rounded-lg p-2 text-center border border-neutral-200">
                        <div className="text-sm font-bold text-blue-700">{recipe.nutrition.carbs ?? "—"}g</div>
                        <div className="text-[10px] font-semibold text-neutral-600 uppercase">Carbs</div>
                      </div>
                      <div className="bg-neutral-50 rounded-lg p-2 text-center border border-neutral-200">
                        <div className="text-sm font-bold text-emerald-700">{recipe.nutrition.fat ?? "—"}g</div>
                        <div className="text-[10px] font-semibold text-neutral-600 uppercase">Fat</div>
                      </div>
                    </div>
                  </section>
                )}
              </div>
            </article>
          )}
        </div>
      </main>
    </div>
  );
}
