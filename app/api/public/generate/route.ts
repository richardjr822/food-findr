import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
  const foodHints = [
    "recipe","ingredients","cook","cooking","bake","baking","grill","fry","saute","sauté","meal","dish","serve",
    "nutrition","calories","protein","carbs","fat","diet","cuisine","marinate","simmer","boil","roast","season",
    "pan","oven","skillet","sauce","garnish","prep","servings",
    // Common meal types to allow bare selections
    "breakfast","lunch","dinner","snack","dessert"
  ];
  const hasFoodSignal = foodHints.some(k => s.includes(k));
  return !hasFoodSignal;
}

function buildPrompt({ userText, mealType, diet }: { userText: string; mealType?: string; diet?: string[]; }) {
  const meal = mealType ? `Meal type: ${mealType}.` : "Meal type: any.";
  const dietary = diet && diet.length ? `Dietary restrictions: ${diet.join(", ")}.` : "No strict dietary restrictions.";
  const cuisineRule = `Cuisine handling: If the user specifies a cuisine, strictly follow it. If no cuisine is specified, prefer Filipino or Filipino‑inspired.`;
  const scopeGuard = `Scope: Only handle topics related to food, cooking, recipes, or nutrition. If the user request is outside this scope, respond with strict JSON: {"error":"OUT_OF_SCOPE","reason":string}.`;
  return `
You are a culinary and nutrition assistant. Create ONE complete recipe using the user's free-form prompt.

${scopeGuard}
${cuisineRule}
Respect dietary restrictions strictly. Prefer pantry staples.

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
  const fallback = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&auto=format&fit=crop&q=60";
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

export async function POST(req: NextRequest) {
  const send = (data: any, status = 200) =>
    NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });

  try {
    const body = await req.json();
    const userMsg: string = String(body?.userMsg ?? "").trim();
    const mealType = body?.mealType ? String(body.mealType) : "";
    const diet: string[] = Array.isArray(body?.diet) ? body.diet.map(String) : [];

    const userText = userMsg || mealType || "recipe";
    if (isClearlyOutOfScope(userText)) {
      return send({ error: "Request is outside recipe scope." }, 422);
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return send({ error: "Missing GEMINI_API_KEY." }, 500);

    const modelId = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelId });

    const userPrompt = buildPrompt({ userText, mealType, diet });
    const result = await model.generateContent(userPrompt);
    let text = result.response.text();

    let parsed: RecipeResponse | { error?: string; reason?: string };
    try {
      parsed = coerceRecipe(safeParseJson(text));
    } catch {
      const strict = userPrompt + "\nReturn STRICT JSON only (no code fences or prose).";
      const retry = await model.generateContent(strict);
      text = retry.response.text();
      parsed = safeParseJson(text);
      if (!(parsed as any)?.error) parsed = coerceRecipe(parsed);
    }

    if ((parsed as any)?.error === "OUT_OF_SCOPE") {
      const reason = (parsed as any)?.reason || "Outside recipe scope.";
      return send({ error: "Request is outside recipe scope.", reason }, 422);
    }

    const recipe = parsed as RecipeResponse;
    if (!recipe.title || !recipe.ingredients?.length || !recipe.instructions?.length) {
      return send({ error: "Model returned incomplete data. Please try again." }, 502);
    }

    const nutritionNumbers = {
      calories: extractNumber(recipe.nutrition?.calories) ?? 0,
      protein: extractNumber(recipe.nutrition?.protein) ?? 0,
      carbs: extractNumber(recipe.nutrition?.carbs) ?? 0,
      fat: extractNumber(recipe.nutrition?.fat) ?? 0,
    };

    return send({
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
    console.error("Public generate error:", err);
    return NextResponse.json({ error: "Failed to generate recipe.", detail }, { status: 500 });
  }
}
