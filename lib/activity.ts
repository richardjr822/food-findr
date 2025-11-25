import { ObjectId } from "mongodb";
import clientPromise from "./mongodb";

export type UserSession = {
  _id?: ObjectId;
  userId: ObjectId;
  startAt: Date;
  endAt?: Date | null;
  durationMs?: number;
  expireAt: Date; // TTL anchor
  createdAt: Date;
  updatedAt: Date;
};

export type RecipeActivity = {
  _id?: ObjectId;
  userId: ObjectId;
  type: "generated_recipe" | string;
  title?: string;
  recipeId?: string;
  threadId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  expireAt: Date;
};

let ensured = false;
async function ensureIndexes() {
  if (ensured) return;
  const client = await clientPromise;
  const db = client.db();
  try {
    // TTL indexes
    await db.collection<UserSession>("user_sessions").createIndex({ expireAt: 1 }, { expireAfterSeconds: 0, name: "ttl_expireAt" });
    await db.collection<UserSession>("user_sessions").createIndex({ userId: 1, startAt: -1 }, { name: "user_start_idx" });
    await db.collection<RecipeActivity>("user_activity").createIndex({ expireAt: 1 }, { expireAfterSeconds: 0, name: "ttl_expireAt" });
    await db.collection<RecipeActivity>("user_activity").createIndex({ userId: 1, createdAt: -1 }, { name: "user_created_idx" });
  } catch (e) {
    // ignore
  }
  ensured = true;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export async function startSession(userIdStr: string): Promise<string> {
  await ensureIndexes();
  const client = await clientPromise;
  const db = client.db();
  const now = new Date();
  const userId = new ObjectId(userIdStr);
  const doc: UserSession = {
    userId,
    startAt: now,
    endAt: null,
    durationMs: 0,
    expireAt: addDays(now, 30),
    createdAt: now,
    updatedAt: now,
  };
  const res = await db.collection<UserSession>("user_sessions").insertOne(doc as any);
  return res.insertedId.toString();
}

export async function endSession(userIdStr: string, sessionId?: string | null): Promise<boolean> {
  await ensureIndexes();
  const client = await clientPromise;
  const db = client.db();
  const userId = new ObjectId(userIdStr);
  const now = new Date();
  let filter: any = { userId, endAt: null };
  if (sessionId) {
    try {
      filter = { userId, _id: new ObjectId(sessionId) };
    } catch {}
  }
  const existing = await db.collection<UserSession>("user_sessions").findOne(filter, { sort: { startAt: -1 } });
  if (!existing) return false;
  const durationMs = Math.max(0, now.getTime() - new Date(existing.startAt).getTime());
  const update = {
    $set: { endAt: now, durationMs, updatedAt: now },
    $setOnInsert: { expireAt: addDays(now, 30) },
  };
  await db.collection<UserSession>("user_sessions").updateOne({ _id: existing._id }, update, { upsert: false });
  return true;
}

export async function listUserSessions(userIdStr: string, opts?: { from?: Date; to?: Date; limit?: number }) {
  await ensureIndexes();
  const client = await clientPromise;
  const db = client.db();
  const userId = new ObjectId(userIdStr);
  const query: any = { userId };
  if (opts?.from || opts?.to) {
    query.startAt = {};
    if (opts.from) query.startAt.$gte = opts.from;
    if (opts.to) query.startAt.$lte = opts.to;
  }
  const lim = Math.min(Math.max(opts?.limit ?? 50, 1), 500);
  const items = await db
    .collection<UserSession>("user_sessions")
    .find(query)
    .sort({ startAt: -1 })
    .limit(lim)
    .toArray();
  return items.map((s) => ({
    _id: s._id?.toString(),
    startAt: s.startAt,
    endAt: s.endAt ?? null,
    durationMs: s.durationMs ?? (s.endAt ? new Date(s.endAt).getTime() - new Date(s.startAt).getTime() : null),
  }));
}

export async function logRecipeActivity(userIdStr: string, payload: Omit<RecipeActivity, "_id" | "userId" | "createdAt" | "expireAt">) {
  await ensureIndexes();
  const client = await clientPromise;
  const db = client.db();
  const now = new Date();
  const userId = new ObjectId(userIdStr);
  const doc: RecipeActivity = {
    userId,
    type: payload.type || "generated_recipe",
    title: payload.title,
    recipeId: payload.recipeId,
    threadId: payload.threadId,
    metadata: payload.metadata,
    createdAt: now,
    expireAt: addDays(now, 30),
  };
  await db.collection<RecipeActivity>("user_activity").insertOne(doc as any);
}

export async function listUserActivity(userIdStr: string, opts?: { from?: Date; to?: Date; limit?: number }) {
  await ensureIndexes();
  const client = await clientPromise;
  const db = client.db();
  const userId = new ObjectId(userIdStr);
  const query: any = { userId };
  if (opts?.from || opts?.to) {
    query.createdAt = {};
    if (opts.from) query.createdAt.$gte = opts.from;
    if (opts.to) query.createdAt.$lte = opts.to;
  }
  const lim = Math.min(Math.max(opts?.limit ?? 50, 1), 500);
  const items = await db
    .collection<RecipeActivity>("user_activity")
    .find(query)
    .sort({ createdAt: -1 })
    .limit(lim)
    .toArray();
  return items.map((a) => ({ ...a, _id: a._id?.toString() }));
}
