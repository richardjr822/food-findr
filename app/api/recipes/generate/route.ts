import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { appendMessage } from "@/lib/models/thread";

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
    "build a website","code","program","programming","javascript","typescript","python","java","c++","c#","react","next.js","node",
    "deploy","vercel","docker","kubernetes","terminal","bash","powershell","github","git","sql","database",
    "weather","travel","flight","hotel","itinerary","tourist",
    "movie","film","series","tv show","game","gaming","cheat",
    "sports bet","betting","odds",
    "stock","stocks","trading","crypto","bitcoin","ethereum","nft",
    "essay","email","poem","story","novel","lyrics","song","speech","script",
    "math","algebra","geometry","calculus","proof","equation",
    "medicine","diagnose","medical advice","legal","lawyer","tax advice"
  ];
  if (blocked.some(k => s.includes(k))) return true;

  // Positive food signals
  const foodHints = [
    "recipe","ingredients","cook","cooking","bake","baking","grill","fry","saute","sauté","meal","dish","serve",
    "nutrition","calories","protein","carbs","fat","diet","cuisine","marinate","simmer","boil","roast","season",
    "pan","oven","skillet","sauce","garnish","prep","servings"
  ];
  const hasFoodSignal = foodHints.some(k => s.includes(k));
  return !hasFoodSignal;
}

function buildPrompt({
  userText,
  mealType,
  diet,
}: {
  userText: string;
  mealType?: string;
  diet?: string[];
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

  return `
You are a culinary and nutrition assistant. Create ONE complete recipe using the user's free-form prompt.

${scopeGuard}
${cuisineRule}
Respect dietary restrictions strictly. Prefer pantry staples (oil, salt, pepper, common spices). Avoid uncommon items.

Respond ONLY with strict JSON. No markdown, no commentary.

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
    const session = await getServerSession(authOptions);
    const userId = session?.user?.email;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { threadId } = body;

    const userMsg: string = String(body?.userMsg ?? "").trim();
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

    const userText = userMsg || ingredientsFallback;

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

    const userPrompt = buildPrompt({ userText, mealType, diet });
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

    const recipe = parsed as RecipeResponse;

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