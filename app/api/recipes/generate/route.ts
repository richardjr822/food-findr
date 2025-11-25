import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { appendMessage } from "@/lib/models/thread";
import { requireUser } from "@/lib/session";
import { logRecipeActivity } from "@/lib/activity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RecipeResponse = {
  title: string;
  image?: string;
  time?: string;
  servings?: string | number;
  difficulty?: string;
  ingredients: string[];
  instructions: string[];
  nutrition: {
    calories: number | string;
    protein: string | number;
    carbs: string | number;
    fat: number | string;
  };
};

type Msg = { role: "user" | "model"; content: string };

function isClearlyOutOfScope(text: string) {
  const s = (text || "").toLowerCase();
  if (!s.trim()) return true;

  // Obvious non-food domains
  const blocked = [
    "build a website",
    "code",
    "program",
    "programming",
    "javascript",
    "typescript",
    "python",
    "java",
    "c++",
    "c#",
    "react",
    "next.js",
    "node",
    "deploy",
    "vercel",
    "docker",
    "kubernetes",
    "terminal",
    "bash",
    "powershell",
    "github",
    "git",
    "sql",
    "database",
    "weather",
    "travel",
    "flight",
    "hotel",
    "itinerary",
    "tourist",
    "movie",
    "film",
    "series",
    "tv show",
    "game",
    "gaming",
    "cheat",
    "sports bet",
    "betting",
    "odds",
    "stock",
    "stocks",
    "trading",
    "crypto",
    "bitcoin",
    "ethereum",
    "nft",
    "essay",
    "email",
    "poem",
    "story",
    "novel",
    "lyrics",
    "song",
    "speech",
    "script",
    "math",
    "algebra",
    "geometry",
    "calculus",
    "proof",
    "equation",
    "medicine",
    "diagnose",
    "medical advice",
    "legal",
    "lawyer",
    "tax advice",
  ];
  if (blocked.some((k) => s.includes(k))) return true;

  // Positive food signals
  const foodHints = [
    "recipe",
    "ingredients",
    "cook",
    "cooking",
    "bake",
    "baking",
    "grill",
    "fry",
    "saute",
    "sauté",
    "meal",
    "dish",
    "serve",
    "nutrition",
    "calories",
    "protein",
    "carbs",
    "fat",
    "diet",
    "cuisine",
    "marinate",
    "simmer",
    "boil",
    "roast",
    "season",
    "pan",
    "oven",
    "skillet",
    "sauce",
    "garnish",
    "prep",
    "servings",
  ];
  const hasFoodSignal = foodHints.some((k) => s.includes(k));
  return !hasFoodSignal;
}

function normalizeList(list: any[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const it of Array.isArray(list) ? list : []) {
    const s = String(it || "").trim();
    if (!s) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

function normalizeInstructions(list: any[]): string[] {
  const cleaned = normalizeList(list).map((s) =>
    s
      .replace(/^\s*step\s*\d+[:.)-]?\s*/i, "")
      .replace(/^\s*\d+[:.)-]\s*/, "")
      .trim()
  );
  return cleaned;
}

function postProcessRecipe(recipe: RecipeResponse): RecipeResponse {
  return {
    ...recipe,
    title: String(recipe.title || "AI-Generated Recipe").trim(),
    ingredients: normalizeList(recipe.ingredients || []),
    instructions: normalizeInstructions(recipe.instructions || []),
    nutrition: recipe.nutrition || { calories: 0, protein: 0, carbs: 0, fat: 0 },
  };
}

function buildPrompt({
  userText,
  mealType,
  diet,
  ingredientsList,
  userFreeform,
}: {
  userText: string;
  mealType?: string;
  diet?: string[];
  ingredientsList?: string[];
  userFreeform?: string;
}) {
  const meal = mealType ? `Meal type: ${mealType}.` : "Meal type: any.";

  const dietary =
    diet && diet.length
      ? `Dietary restrictions: ${diet.join(", ")}.`
      : "No strict dietary restrictions.";

  // Default cuisine rule (Filipino by default, but user overrides)
  const cuisineRule =
    `Cuisine handling: If the user specifies a cuisine, strictly follow it. ` +
    `If no cuisine is specified, prefer Filipino or Filipino‑inspired. Do not force Filipino when another cuisine is requested.`;

  // Scope guard: food-only and structured failure mode
  const scopeGuard =
    `Scope: Only handle topics related to food, cooking, recipes, or nutrition. ` +
    `If the user request is outside this scope, respond with strict JSON: {"error":"OUT_OF_SCOPE","reason":string} and nothing else.`;

  const ingredientsBlock = ingredientsList && ingredientsList.length
    ? `User ingredients (use primarily, avoid inventing uncommon items): ${ingredientsList.join(", ")}.`
    : "";

  const freeformBlock = userFreeform && userFreeform.trim()
    ? `Additional context from user: ${userFreeform.trim()}`
    : "";

  return `
You are a culinary and nutrition assistant. Create ONE complete recipe using the user's inputs.

${scopeGuard}
${cuisineRule}
Respect dietary restrictions strictly. Prefer pantry staples (oil, salt, pepper, common spices). Avoid uncommon items.

${ingredientsBlock}
${freeformBlock}

Respond ONLY with strict JSON. No markdown, no commentary, no code fences.

JSON schema:
{
  "title": string,
  "image": string,
  "time": string,
  "servings": string | number,
  "difficulty": "Easy" | "Medium" | "Hard",
  "ingredients": string[],
  "instructions": string[],
  "nutrition": {
    "calories": number | string,
    "protein": string | number,
    "carbs": string | number,
    "fat": string | number
  }
}

User inputs:
Free-form prompt: ${userText}
${meal}
${dietary}

Constraints:
- Stay within food/cooking/recipe/nutrition scope only.
- Use user's inputs primarily; add only minimal staples if needed.
- Ensure the recipe fits the dietary rules.
- Estimate nutrition per serving.
- Keep measurements consistent (metric or US, not mixed).
- Title should be catchy but specific.
- Ingredients must be concrete (avoid vague terms like "some"), and 8-20 items.
- Instructions must be step-by-step, 6-16 steps, no leading numbering like "Step 1:" (just the text).
`;
}

function safeParseJson(text: string) {
  let m = text.match(/```json\s*([\s\S]*?)```/i);
  if (!m) m = text.match(/```\s*([\s\S]*?)```/);
  const candidate = (m ? m[1] : text).trim();

  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  const core = start !== -1 && end !== -1 ? candidate.slice(start, end + 1) : candidate;

  return JSON.parse(core);
}

function extractNumber(raw: any): number | undefined {
  if (raw == null) return undefined;
  if (typeof raw === "number" && isFinite(raw)) return raw;
  const s = String(raw).toLowerCase().trim();
  if (!s || s === "—" || s === "-" || s === "n/a") return undefined;
  const match = s.match(/(\d+(\.\d+)?)/);
  return match ? Number(match[1]) : undefined;
}

function coerceRecipe(obj: any): RecipeResponse {
  const fallback =
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&auto=format&fit=crop&q=60";
  return {
    title: String(obj?.title ?? "AI-Generated Recipe"),
    image: String(obj?.image || fallback),
    time: obj?.time ? String(obj.time) : "30 mins",
    servings: obj?.servings ?? "4",
    difficulty: obj?.difficulty ? String(obj.difficulty) : "Medium",
    ingredients: Array.isArray(obj?.ingredients) ? obj.ingredients.map(String) : [],
    instructions: Array.isArray(obj?.instructions) ? obj.instructions.map(String) : [],
    nutrition: {
      calories: obj?.nutrition?.calories,
      protein: obj?.nutrition?.protein,
      carbs: obj?.nutrition?.carbs,
      fat: obj?.nutrition?.fat,
    },
  };
}

async function callAI(_: any) {
  return {
    title: "Sample Generated Recipe",
    ingredients: ["Ingredient A", "Ingredient B"],
    instructions: ["Step 1", "Step 2"],
    nutrition: { calories: 420, protein: 25, carbs: 50, fat: 15 },
  };
}

export async function POST(req: NextRequest) {
  const send = (data: any, status = 200) =>
    NextResponse.json(data, {
      status,
      headers: { "Cache-Control": "no-store" },
    });

  try {
    const auth = await requireUser();
    if (auth instanceof NextResponse) return auth; // 401
    const userId = auth.email;

    const body = await req.json();
    const { threadId } = body;

    const userMsg: string = String(body?.userMsg ?? "").trim();
    const rawPrompt: string = String(body?.rawPrompt ?? "").trim();
    const ingredientsList: string[] = Array.isArray(body?.ingredientsList)
      ? body.ingredientsList.map((s: any) => String(s || "").trim()).filter(Boolean).slice(0, 40)
      : [];
    const ingredientsFallback: string = String(body?.ingredients ?? "").trim();
    const mealType = body?.mealType ? String(body.mealType) : "";
    const diet = Array.isArray(body?.diet) ? body.diet.map(String) : [];

    const history: Msg[] = Array.isArray(body?.history)
      ? body.history
          .map((m: any): Msg => ({
            role: m?.role === "model" ? "model" : "user",
            content: String(m?.content ?? "").slice(0, 4000),
          }))
          .filter((m: Msg) => m.content)
          .slice(-12)
      : [];

    const structuredParts = [
      ingredientsList.length ? `Ingredients: ${ingredientsList.join(", ")}` : "",
      mealType ? `Meal type: ${mealType}` : "",
      rawPrompt ? `Notes: ${rawPrompt}` : "",
    ].filter(Boolean);
    const structured = structuredParts.join(" | ");
    const userText = userMsg || structured || ingredientsFallback;

    // Food-only pre-check (fast heuristic)
    if (isClearlyOutOfScope(userText)) {
      // Optionally record the user message only (no model reply)
      const userMessageId = `m_${Date.now()}_u`;
      await appendMessage(userId, threadId, {
        id: userMessageId,
        role: "user",
        content: userText || "(empty)",
        createdAt: new Date(),
      });
      return send({ error: "Request is outside recipe scope." }, 422);
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return send({ error: "Missing GEMINI_API_KEY." }, 500);

    const modelId = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelId });

    // Convert prior turns to Gemini chat history
    const chat = model.startChat({
      history: history.map((m) => ({
        role: m.role,
        parts: [{ text: m.content }],
      })),
    });

    const userPrompt = buildPrompt({ userText, mealType, diet, ingredientsList, userFreeform: rawPrompt });
    const result = await chat.sendMessage(userPrompt);
    let text = result.response.text();

    let parsed: RecipeResponse | { error?: string; reason?: string };
    try {
      parsed = coerceRecipe(safeParseJson(text));
    } catch {
      const strict = userPrompt + "\nReturn STRICT JSON only (no code fences or prose).";
      const retry = await chat.sendMessage(strict);
      text = retry.response.text();
      parsed = safeParseJson(text);
      // If still not recipe-shaped, coerce if possible
      if (!(parsed as any)?.error) {
        parsed = coerceRecipe(parsed);
      }
    }

    // Handle explicit OUT_OF_SCOPE from the model
    if ((parsed as any)?.error === "OUT_OF_SCOPE") {
      const reason = (parsed as any)?.reason || "Outside recipe scope.";
      const userMessageId = `m_${Date.now()}_u`;
      await appendMessage(userId, threadId, {
        id: userMessageId,
        role: "user",
        content: userText || "(empty)",
        createdAt: new Date(),
      });
      return send({ error: "Request is outside recipe scope.", reason }, 422);
    }

    let recipe = postProcessRecipe(parsed as RecipeResponse);

    // Attempt a repair pass if incomplete
    if (!recipe.title || !recipe.ingredients?.length || !recipe.instructions?.length) {
      const repairPrompt = `${userPrompt}\nThe previous JSON was incomplete. Return STRICT JSON only per schema with non-empty title, 8-20 ingredients, 6-16 instructions, and nutrition numbers.`;
      try {
        const repair = await chat.sendMessage(repairPrompt);
        const repaired = coerceRecipe(safeParseJson(repair.response.text()));
        recipe = postProcessRecipe(repaired);
      } catch {}
    }

    // If user provided ingredients and coverage is too low, request a targeted fix once
    if (ingredientsList.length) {
      const lower = new Set(recipe.ingredients.map((i) => i.toLowerCase()));
      const covered = ingredientsList.filter((i) => lower.has(String(i).toLowerCase())).length;
      const minRequired = Math.min(ingredientsList.length, Math.max(1, Math.ceil(ingredientsList.length * 0.6)));
      if (covered < minRequired) {
        const enforcePrompt = `${userPrompt}\nEnsure the recipe USES these user ingredients prominently: ${ingredientsList.join(", ")}. Return STRICT JSON only.`;
        try {
          const fix = await chat.sendMessage(enforcePrompt);
          const fixed = coerceRecipe(safeParseJson(fix.response.text()));
          recipe = postProcessRecipe(fixed);
        } catch {}
      }
    }

    if (!recipe.title || !recipe.ingredients?.length || !recipe.instructions?.length) {
      return send({ error: "Model returned incomplete data. Please try again." }, 502);
    }

    // Append user message
    const userMessageId = `m_${Date.now()}_u`;
    await appendMessage(userId, threadId, {
      id: userMessageId,
      role: "user",
      content: userText || "(empty)",
      createdAt: new Date(),
    });

    // Normalize nutrition to numbers where possible
    const nutritionNumbers = {
      calories: extractNumber(recipe.nutrition?.calories) ?? 0,
      protein: extractNumber(recipe.nutrition?.protein) ?? 0,
      carbs: extractNumber(recipe.nutrition?.carbs) ?? 0,
      fat: extractNumber(recipe.nutrition?.fat) ?? 0,
    };

    // Append model message ONCE (remove duplicate append)
    const modelMessageId = `m_${Date.now()}_m`;
    await appendMessage(userId, threadId, {
      id: modelMessageId,
      role: "model",
      content: recipe.title,
      createdAt: new Date(),
      saved: false,
      recipeSnapshot: {
        title: recipe.title,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        nutrition: nutritionNumbers,
      },
    });

    // Log activity (30-day TTL)
    try {
      await logRecipeActivity(auth.userId, {
        type: "generated_recipe",
        title: recipe.title,
        threadId,
        metadata: { nutrition: nutritionNumbers },
      });
    } catch {}

    // Return normalized payload
    return send({
      messageId: modelMessageId,
      title: recipe.title,
      image: recipe.image,
      time: recipe.time,
      servings: recipe.servings,
      difficulty: recipe.difficulty,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      nutrition: nutritionNumbers,
    }, 200);
  } catch (err: any) {
    const detail = process.env.NODE_ENV !== "production" ? String(err?.message || err) : undefined;
    console.error("Gemini generate error:", err);
    return NextResponse.json({ error: "Failed to generate recipe.", detail }, { status: 500 });
  }
}