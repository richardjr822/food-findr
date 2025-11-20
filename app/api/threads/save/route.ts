import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { requireUser } from "@/lib/session";
import { getThreadsCollection } from "@/lib/models/thread";

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth; // 401
  const { userId } = auth;
  const client = await clientPromise;
  const db = client.db();

  const { id, title, messages } = await req.json();
  const updatedAt = new Date();

  await getThreadsCollection(db).updateOne(
    { id, userId },
    {
      $set: { title, messages, updatedAt },
      $setOnInsert: { id, userId, createdAt: new Date(), messages: messages ?? [] },
    },
    { upsert: true }
  );

  return NextResponse.json({ success: true });
}