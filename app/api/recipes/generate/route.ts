import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

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

function buildPrompt({
  ingredients,
  mealType,
  diet,
}: {
  ingredients: string;
  mealType?: string;
  diet?: string[];
}) {
  const meal = mealType ? `Meal type: ${mealType}.` : "Meal type: any.";
  const dietary =
    diet && diet.length
      ? `Dietary restrictions: ${diet.join(", ")}.`
      : "No strict dietary restrictions.";

  // Default to Filipino cuisine emphasis unless user specifies otherwise
  const cuisineBias = `Default cuisine preference: Filipino (Philippines). If the user didn't specify a cuisine, make the recipe Filipino or Filipino-inspired. If they specify a different cuisine, follow that instead.`;

  return `
You are a culinary and nutrition assistant. Create ONE complete recipe using the user's free-form prompt and/or ingredients.
${cuisineBias}
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
Free-form prompt/ingredients: ${ingredients}
${meal}
${dietary}

Constraints:
- Use user's inputs primarily; add only minimal staples if needed.
- Ensure the recipe fits the dietary rules.
- Estimate nutrition per serving.
- Keep measurements consistent (metric or US, not mixed).
- Title should be catchy but specific.
- If you cannot fully comply, adapt the recipe to fit the restrictions.
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
      calories: obj?.nutrition?.calories ?? "—",
      protein: obj?.nutrition?.protein ?? "—",
      carbs: obj?.nutrition?.carbs ?? "—",
      fat: obj?.nutrition?.fat ?? "—",
    },
  };
}

export async function POST(req: NextRequest) {
  const send = (data: any, status = 200) =>
    NextResponse.json(data, {
      status,
      headers: { "Cache-Control": "no-store" },
    });

  try {
    const body = await req.json().catch(() => ({}));
    const ingredients = String(body?.ingredients ?? "").trim();
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

    if (!ingredients && !history.length) {
      return send({ error: "Prompt/ingredients are required." }, 400);
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

    const userPrompt = buildPrompt({ ingredients, mealType, diet });
    const result = await chat.sendMessage(userPrompt);
    let text = result.response.text();

    let parsed: RecipeResponse;
    try {
      parsed = coerceRecipe(safeParseJson(text));
    } catch {
      const strict = userPrompt + "\nReturn STRICT JSON only (no code fences or prose).";
      const retry = await chat.sendMessage(strict);
      text = retry.response.text();
      parsed = coerceRecipe(safeParseJson(text));
    }

    if (!parsed.title || !parsed.ingredients?.length || !parsed.instructions?.length) {
      return send({ error: "Model returned incomplete data. Please try again." }, 502);
    }

    return send(parsed, 200);
  } catch (err: any) {
    const detail = process.env.NODE_ENV !== "production" ? String(err?.message || err) : undefined;
    console.error("Gemini generate error:", err);
    return NextResponse.json({ error: "Failed to generate recipe.", detail }, { status: 500 });
  }
}