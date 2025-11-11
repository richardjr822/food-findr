import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.email;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") || 10)));

    const client = await clientPromise;
    const db = client.db();
    const items = await db
      .collection("threads")
      .aggregate([
        { $match: { userId, hasSuccessfulGeneration: true } },
        { $sort: { updatedAt: -1 } },
        { $group: { _id: "$id", doc: { $first: "$$ROOT" } } },
        { $replaceRoot: { newRoot: "$doc" } },
        {
          $project: {
            _id: 0,
            id: 1,
            title: 1,
            updatedAt: 1,
            preview: 1,
            lastRecipeTitle: 1,
            messageCount: 1,
          },
        },
        { $limit: limit },
      ])
      .toArray();

    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to fetch recent" }, { status: 500 });
  }
}