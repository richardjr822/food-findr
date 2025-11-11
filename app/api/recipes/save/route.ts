import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

// mark/unmark a message as saved
async function toggleMessageSaved(userId: string, threadId: string, messageId: string, saved: boolean, recipeId: string | null) {
  const client = await clientPromise;
  const db = client.db();
  await db.collection("threads").updateOne(
    { userId, id: String(threadId), "messages.id": messageId },
    { $set: { "messages.$.saved": saved, "messages.$.recipeId": recipeId } }
  );
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.email;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { threadId, messageId, title, ingredients, instructions, nutrition } = body || {};
    if (!threadId || !messageId) {
      return NextResponse.json({ error: "Missing threadId or messageId" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const thread = await db.collection("threads").findOne({ userId, id: String(threadId) }, { projection: { messages: 1 } });
    if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 });

    const msg = (thread.messages || []).find((m: any) => m.id === messageId);
    const hasRecipe =
      msg &&
      msg.role === "model" &&
      msg.recipeSnapshot &&
      (msg.recipeSnapshot.title ||
        (Array.isArray(msg.recipeSnapshot.ingredients) && msg.recipeSnapshot.ingredients.length > 0) ||
        (Array.isArray(msg.recipeSnapshot.instructions) && msg.recipeSnapshot.instructions.length > 0));
    if (!hasRecipe) return NextResponse.json({ error: "Message has no successful generation" }, { status: 400 });

    const recTitle = String(title || msg.recipeSnapshot.title || "Untitled Recipe");
    const recIngredients = Array.isArray(ingredients) ? ingredients : msg.recipeSnapshot.ingredients || [];
    const recInstructions = Array.isArray(instructions) ? instructions : msg.recipeSnapshot.instructions || [];
    const recNutrition = typeof nutrition === "object" && nutrition !== null ? nutrition : msg.recipeSnapshot.nutrition || {};

    const recipeId = new ObjectId().toHexString();
    await db.collection("recipes").updateOne(
      { userId, messageId },
      {
        $setOnInsert: {
          _id: recipeId,
          userId,
          messageId,
          title: recTitle,
          ingredients: recIngredients,
          instructions: recInstructions,
          nutrition: recNutrition,
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    await toggleMessageSaved(userId, threadId, messageId, true, recipeId);
    return NextResponse.json({ id: recipeId, ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to save recipe" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.email;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const threadId = searchParams.get("threadId");
    const messageId = searchParams.get("messageId");
    if (!threadId || !messageId) {
      return NextResponse.json({ error: "Missing threadId/messageId" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    await db.collection("recipes").deleteMany({ userId, messageId });
    await toggleMessageSaved(userId, threadId, messageId, false, null);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete recipe" }, { status: 500 });
  }
}