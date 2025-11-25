import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { requireUser } from "@/lib/session";
import { getMyFeedback, upsertFeedback, listFeedback } from "@/lib/models/feedback";
import { ObjectId, type Document, type Collection, type Filter } from "mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clampRating(n: any) {
  const x = Number(n);
  if (!Number.isFinite(x)) return undefined;
  return Math.min(5, Math.max(1, Math.round(x)));
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireUser();
    if (auth instanceof NextResponse) return auth; // 401
    const { id } = await params;
    const recipeId = String(id);
    const client = await clientPromise;
    const db = client.db();
    const coll = db.collection("recipes") as Collection<Document>;
    const orFilters: Filter<Document>[] = [{ _id: recipeId, userId: auth.email } as any];
    if (ObjectId.isValid(recipeId)) orFilters.unshift({ _id: new ObjectId(recipeId), userId: auth.email } as any);
    const owned = await coll.findOne({ $or: orFilters } as Filter<Document>);
    if (!owned) return NextResponse.json({ error: "Recipe not found" }, { status: 404 });

    const { deleteMyFeedback } = await import("@/lib/models/feedback");
    const ok = await deleteMyFeedback(recipeId, auth.email);
    return NextResponse.json({ ok });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to delete feedback" }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth; // 401
  const { id } = await params;
  const recipeId = String(id);

  const all = req.nextUrl.searchParams.get("all");
  if (all) {
    // Ensure recipe belongs to user
    const client = await clientPromise;
    const db = client.db();
    const coll = db.collection("recipes") as Collection<Document>;
    const orFilters: Filter<Document>[] = [{ _id: recipeId, userId: auth.email } as any];
    if (ObjectId.isValid(recipeId)) orFilters.unshift({ _id: new ObjectId(recipeId), userId: auth.email } as any);
    const owned = await coll.findOne({ $or: orFilters } as Filter<Document>);
    if (!owned) return NextResponse.json({ error: "Recipe not found" }, { status: 404 });

    const items = await listFeedback(recipeId, 50);
    const ratings = items.map((i: any) => (typeof i.rating === "number" ? i.rating : null)).filter((v: any) => v != null) as number[];
    const count = ratings.length;
    const avg = count ? ratings.reduce((a, b) => a + b, 0) / count : 0;
    return NextResponse.json({ items, stats: { avg, count } });
  }

  const my = await getMyFeedback(recipeId, auth.email);
  return NextResponse.json({ feedback: my || null });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireUser();
    if (auth instanceof NextResponse) return auth; // 401
    const { id } = await params;
    const recipeId = String(id);
    const body = await req.json().catch(() => ({}));

    const type = body?.type === "detailed" ? "detailed" : "quick";
    const rating = clampRating(body?.rating);
    const comment = typeof body?.comment === "string" ? body.comment.trim() : undefined;

    if (type === "quick") {
      if (rating == null) return NextResponse.json({ error: "Rating is required" }, { status: 400 });
    } else {
      if (!comment || comment.length < 2) return NextResponse.json({ error: "Comment is too short" }, { status: 400 });
      if (comment.length > 1000) return NextResponse.json({ error: "Comment too long" }, { status: 400 });
    }

    // Ensure recipe belongs to the current user (recipes are private per user in this app)
    const client = await clientPromise;
    const db = client.db();
    const coll = db.collection("recipes") as Collection<Document>;
    const orFilters: Filter<Document>[] = [{ _id: recipeId, userId: auth.email } as any];
    if (ObjectId.isValid(recipeId)) orFilters.unshift({ _id: new ObjectId(recipeId), userId: auth.email } as any);
    const recipe = await coll.findOne({ $or: orFilters } as Filter<Document>);
    if (!recipe) return NextResponse.json({ error: "Recipe not found" }, { status: 404 });

    // Minimal anti-spam: cooldown 5s between updates
    const existing = await getMyFeedback(recipeId, auth.email);
    if (existing?.updatedAt) {
      const diff = Date.now() - new Date(existing.updatedAt).getTime();
      if (diff < 5000) return NextResponse.json({ error: "Please wait before updating again" }, { status: 429 });
    }

    await upsertFeedback({
      recipeId,
      userId: auth.email,
      ownerId: auth.userId,
      displayName: undefined,
      rating: rating ?? undefined,
      comment,
      type,
    });

    const fresh = await getMyFeedback(recipeId, auth.email);
    return NextResponse.json({ ok: true, feedback: fresh });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to submit feedback" }, { status: 500 });
  }
}
