import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

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

    const pipeline = [
      { $match: { userId, hasSuccessfulGeneration: true } },
      { $sort: { updatedAt: -1 } },
      { $group: { _id: "$id", doc: { $first: "$$ROOT" } } },
      { $replaceRoot: { newRoot: "$doc" } },
      { $sort: { updatedAt: -1 } },
      { $project: { _id: 0, id: 1, title: 1, updatedAt: 1, preview: 1, lastRecipeTitle: 1, messageCount: 1 } },
      { $skip: (page - 1) * pageSize },
      { $limit: pageSize },
    ];

    const [items, totalRes] = await Promise.all([
      db.collection("threads").aggregate(pipeline).toArray(),
      db.collection("threads").aggregate([{ $match: { userId, hasSuccessfulGeneration: true } }, { $group: { _id: "$id" } }, { $count: "total" }]).toArray(),
    ]);
    const total = totalRes[0]?.total || 0;

    return NextResponse.json({ page, pageSize, total, items });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to fetch threads" }, { status: 500 });
  }
}