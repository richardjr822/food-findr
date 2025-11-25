import clientPromise from "../mongodb";
import { ObjectId } from "mongodb";

export type RecipeShare = {
  _id?: ObjectId;
  token: string;
  recipeId: string;
  userId: string; // email for this app
  createdAt: Date;
  updatedAt: Date;
  expireAt: Date; // TTL
  lastMethod?: "copy" | "webshare";
  count?: number;
};

let ensured = false;
async function ensureIndexes() {
  if (ensured) return;
  const client = await clientPromise;
  const db = client.db();
  await db.collection<RecipeShare>("recipe_shares").createIndex({ token: 1 }, { unique: true, name: "uniq_token" });
  await db.collection<RecipeShare>("recipe_shares").createIndex({ userId: 1, recipeId: 1 }, { unique: true, name: "uniq_user_recipe" });
  await db.collection<RecipeShare>("recipe_shares").createIndex({ expireAt: 1 }, { expireAfterSeconds: 0, name: "ttl_expireAt" });
  ensured = true;
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function randToken(len = 22) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  const arr = new Uint32Array(len);
  if (typeof crypto !== "undefined" && (crypto as any).getRandomValues) {
    (crypto as any).getRandomValues(arr);
  } else {
    for (let i = 0; i < len; i++) arr[i] = Math.floor(Math.random() * 0xffffffff);
  }
  for (let i = 0; i < len; i++) s += alphabet[arr[i] % alphabet.length];
  return s;
}

export async function getOrCreateShare(userId: string, recipeId: string, days = 30) {
  await ensureIndexes();
  const client = await clientPromise;
  const db = client.db();
  const now = new Date();
  const expireAt = addDays(now, Math.max(1, days));
  const existing = await db.collection<RecipeShare>("recipe_shares").findOne({ userId, recipeId });
  if (existing) return existing;
  const token = randToken();
  const doc: RecipeShare = {
    token,
    recipeId,
    userId,
    createdAt: now,
    updatedAt: now,
    expireAt,
    count: 0,
  };
  await db.collection<RecipeShare>("recipe_shares").insertOne(doc as any);
  return doc;
}

export async function bumpShare(token: string, method?: "copy" | "webshare") {
  await ensureIndexes();
  const client = await clientPromise;
  const db = client.db();
  const now = new Date();
  await db.collection<RecipeShare>("recipe_shares").updateOne(
    { token },
    { $inc: { count: 1 }, $set: { updatedAt: now, ...(method ? { lastMethod: method } : {}) } }
  );
}

export async function getShareByToken(token: string) {
  await ensureIndexes();
  const client = await clientPromise;
  const db = client.db();
  return db.collection<RecipeShare>("recipe_shares").findOne({ token });
}
