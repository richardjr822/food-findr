import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();

    const docs = await db
      .collection("recipes")
      .find({ userId: session.user.email })
      .sort({ createdAt: -1 })
      .limit(30)
      .project({ title: 1, image: 1, time: 1, createdAt: 1 })
      .toArray();

    const recipes = docs.map((d: any) => ({
      id: String(d._id),
      recipe_id: String(d._id),
      title: d.title || "Untitled Recipe",
      image_url: d.image || null,
      cooking_time: d.time || null,
      saved_at: d.createdAt ? new Date(d.createdAt).toISOString() : null,
    }));

    return NextResponse.json(
      { recipes },
      { headers: { "Cache-Control": "no-store, private", Vary: "Cookie" } }
    );
  } catch (error: any) {
    return NextResponse.json({ recipes: [], error: error.message }, { status: 500 });
  }
}