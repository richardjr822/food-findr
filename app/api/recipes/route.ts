import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { requireUser } from "@/lib/session";
import { ObjectId } from "mongodb";
import type { Document, Filter, Collection } from "mongodb";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const auth = await requireUser();
    if (auth instanceof NextResponse) return auth; // 401
    const userId = auth.email;

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || 50)));
    const q = (searchParams.get("q") || "").trim();

    const client = await clientPromise;
    const db = client.db();

    const query: any = { userId };
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: "i" } },
        { ingredients: { $elemMatch: { $regex: q, $options: "i" } } },
      ];
    }

    const [recipes, total] = await Promise.all([
      db
        .collection("recipes")
        .find(query, { projection: { userId: 0 } })
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .toArray(),
      db.collection("recipes").countDocuments(query),
    ]);

    return NextResponse.json({ recipes, page, pageSize, total });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch recipes" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await requireUser();
    if (auth instanceof NextResponse) return auth; // 401
    const userId = auth.email;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id")?.trim();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const client = await clientPromise;
    const db = client.db();

    // Use a Document-typed collection to avoid _id strict typing issues
    const coll = db.collection("recipes") as Collection<Document>;

    // Support both ObjectId and string _id documents
    const orFilters: Filter<Document>[] = [{ _id: id, userId } as any];
    if (ObjectId.isValid(id)) {
      orFilters.unshift({ _id: new ObjectId(id), userId } as any);
    }

    const delResult = await coll.deleteOne({ $or: orFilters } as Filter<Document>);
    if (!delResult.deletedCount) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Clear saved flags in thread messages pointing to this recipe (recipeId stored as string)
    await db.collection("threads").updateMany(
      { userId, "messages.recipeId": id },
      { $set: { "messages.$[m].saved": false, "messages.$[m].recipeId": null } },
      { arrayFilters: [{ "m.recipeId": id }] }
    );

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete recipe" }, { status: 500 });
  }
}