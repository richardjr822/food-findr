import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

type Msg = {
  id: string;
  role: "user" | "model";
  content?: string;
  saved?: boolean;
  recipeId?: string | null;
  createdAt?: string;
  recipeSnapshot?: {
    title?: string;
    ingredients?: string[];
    instructions?: string[];
    nutrition?: Record<string, any>;
  };
};

export async function GET(req: NextRequest) {
  try {
    const auth = await requireUser();
    if (auth instanceof NextResponse) return auth; // 401
    const userId = auth.email;

    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") || 50)));

    const client = await clientPromise;
    const db = client.db();

    const [items, total] = await Promise.all([
      db
        .collection("threads")
        .find({ userId })
        .project({
          _id: 0,
          id: 1,
          title: 1,
          updatedAt: 1,
          preview: 1,
          lastRecipeTitle: 1,
          messageCount: 1,
          hasSuccessfulGeneration: 1,
        })
        .sort({ updatedAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .toArray(),
      db.collection("threads").countDocuments({ userId }),
    ]);

    return NextResponse.json({ page, pageSize, total, items });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to fetch threads" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser();
    if (auth instanceof NextResponse) return auth; // 401
    const userId = auth.email;

    const body = await req.json();
    const id = String(body?.id || "").trim();
    const title = String(body?.title || "Untitled").trim();
    const messages: unknown[] = Array.isArray(body?.messages) ? body.messages : [];
    if (!id) return NextResponse.json({ error: "Missing thread id" }, { status: 400 });

    const MAX_MSG = 200;
    const safeMessages: Msg[] = messages.slice(-MAX_MSG).map((m: any): Msg => ({
      id: String(m?.id || `m_${Date.now()}`),
      role: m?.role === "model" ? "model" : "user",
      content: typeof m?.content === "string" ? m.content : undefined,
      saved: !!m?.saved,
      recipeId: m?.recipeId ?? null,
      createdAt: typeof m?.createdAt === "string" ? m.createdAt : new Date().toISOString(),
      recipeSnapshot:
        m?.role === "model" && m?.recipeSnapshot
          ? {
              title: m.recipeSnapshot.title,
              ingredients: Array.isArray(m.recipeSnapshot.ingredients) ? m.recipeSnapshot.ingredients : undefined,
              instructions: Array.isArray(m.recipeSnapshot.instructions) ? m.recipeSnapshot.instructions : undefined,
              nutrition: typeof m.recipeSnapshot.nutrition === "object" ? m.recipeSnapshot.nutrition : undefined,
            }
          : undefined,
    }));

    const lastModelWithRecipe = [...safeMessages]
      .reverse()
      .find(
        (m) =>
          m.role === "model" &&
          m.recipeSnapshot &&
          (m.recipeSnapshot.title ||
            (m.recipeSnapshot.ingredients && m.recipeSnapshot.ingredients.length > 0) ||
            (m.recipeSnapshot.instructions && m.recipeSnapshot.instructions.length > 0))
      );
    const hasSuccessfulGeneration = !!lastModelWithRecipe;
    const lastRecipeTitle = lastModelWithRecipe?.recipeSnapshot?.title || null;
    const lastUserText =
      [...safeMessages].reverse().find((m) => m.role === "user" && m.content)?.content || "";

    const doc = {
      userId,
      id,
      title,
      messages: safeMessages,
      updatedAt: new Date(),
      preview: lastUserText ? lastUserText.slice(0, 140) : null,
      hasSuccessfulGeneration,
      lastRecipeTitle,
      messageCount: safeMessages.length,
    };

    const client = await clientPromise;
    const db = client.db();
    await db.collection("threads").updateOne(
      { userId, id },
      { $set: doc, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );

    return NextResponse.json({ ok: true, hasSuccessfulGeneration, lastRecipeTitle });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to save thread" }, { status: 500 });
  }
}