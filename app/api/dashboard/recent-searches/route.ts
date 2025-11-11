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

    // Latest 5 non-empty threads for this user
    const threads = await db
      .collection("threads")
      .find({ userId: session.user.email, messages: { $exists: true, $ne: [] } })
      .sort({ updatedAt: -1 })
      .limit(5)
      .project({ _id: 0, id: 1, title: 1, preview: 1, updatedAt: 1 })
      .toArray();

    const searches = threads.map((t: any) => ({
      id: t.id,
      title: t.title || "New Recipe",
      preview: t.preview || "",
      created_at: t.updatedAt ? new Date(t.updatedAt).toISOString() : "",
    }));

    return NextResponse.json(
      { searches },
      { headers: { "Cache-Control": "no-store, private", Vary: "Cookie" } }
    );
  } catch (error: any) {
    return NextResponse.json({ searches: [], error: error.message }, { status: 500 });
  }
}