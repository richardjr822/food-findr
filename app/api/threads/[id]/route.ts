import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const auth = await requireUser();
    if (auth instanceof NextResponse) return auth; // 401
    const userId = auth.email;

    const client = await clientPromise;
    const db = client.db();

    const doc = await db.collection("threads").findOne(
      { userId, id: String(id) },
      {
        projection: {
          _id: 0,
          id: 1,
          title: 1,
          messages: 1,
          updatedAt: 1,
          hasSuccessfulGeneration: 1,
          lastRecipeTitle: 1,
          preview: 1,
          messageCount: 1,
        },
      }
    );
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(doc);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}