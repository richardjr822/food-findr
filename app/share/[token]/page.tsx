import { notFound } from "next/navigation";
import clientPromise from "@/lib/mongodb";
import { getShareByToken, bumpShare } from "@/lib/models/share";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

export default async function ShareRecipePage({ params }: { params: { token: string } }) {
  const token = params.token;
  const share = await getShareByToken(token);
  if (!share) return notFound();

  try {
    await bumpShare(token);
  } catch {}

  const client = await clientPromise;
  const db = client.db();
  let recipe = await db.collection("recipes").findOne({ _id: share.recipeId } as any);
  if (!recipe && ObjectId.isValid(share.recipeId)) {
    recipe = await db.collection("recipes").findOne({ _id: new ObjectId(share.recipeId) } as any);
  }
  if (!recipe) return notFound();

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
          <div className="text-xs text-neutral-600">Shared recipe</div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        <article className="bg-white rounded-2xl shadow-xl border border-neutral-200 overflow-hidden">
          <div className="p-6 sm:p-8 space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900">{recipe.title || "Shared Recipe"}</h1>
              {recipe.createdAt && (
                <p className="text-xs text-neutral-500 mt-1">{new Date(recipe.createdAt).toLocaleDateString()}</p>
              )}
            </div>

            {Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0 && (
              <section>
                <h2 className="text-sm sm:text-base font-bold text-neutral-900 mb-2">Ingredients</h2>
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
                <h2 className="text-sm sm:text-base font-bold text-neutral-900 mb-2">Instructions</h2>
                <ol className="space-y-2">
                  {recipe.instructions.map((step: string, idx: number) => (
                    <li key={idx} className="flex gap-2">
                      <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-emerald-500 text-white font-bold text-xs">
                        {idx + 1}
                      </span>
                      <p className="text-neutral-700 text-sm leading-relaxed pt-0.5">{step}</p>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {recipe.nutrition && (
              <section>
                <h2 className="text-sm sm:text-base font-bold text-neutral-900 mb-2">Nutrition</h2>
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

        <div className="text-center text-xs text-neutral-500 mt-6">
          View only. To create your own, try the generator.
          <a className="ml-1 underline text-emerald-700 hover:text-emerald-800" href="/try">Open /try</a>
        </div>
      </main>
    </div>
  );
}
