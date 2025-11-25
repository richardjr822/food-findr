import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { requireUser } from "@/lib/session";
import { getOrCreateShare } from "@/lib/models/share";
import { ObjectId, type Collection, type Document, type Filter } from "mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  const share = await getOrCreateShare(auth.email, recipeId, 30);
  const base = process.env.NEXT_PUBLIC_APP_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`;
  const url = `${base}/share/${encodeURIComponent(share.token)}`;
  return NextResponse.json({ token: share.token, url });
}
