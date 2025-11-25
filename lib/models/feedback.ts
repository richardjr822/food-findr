import clientPromise from "../mongodb";
import { ObjectId } from "mongodb";

export type RecipeFeedbackDoc = {
  _id?: ObjectId;
  recipeId: string; // recipes._id string
  userId: string; // we use email for consistency across existing collections
  ownerId?: string; // optional: next-auth user id (ObjectId string)
  displayName?: string; // snapshot of user display name
  rating?: number; // 1..5
  comment?: string; // detailed review
  type: "quick" | "detailed";
  createdAt: Date;
  updatedAt: Date;
};

let ensured = false;
async function ensureIndexes() {
  if (ensured) return;
  const client = await clientPromise;
  const db = client.db();
  try {
    await db.collection<RecipeFeedbackDoc>("recipe_feedback").createIndex({ recipeId: 1, createdAt: -1 }, { name: "recipe_created" });
    await db.collection<RecipeFeedbackDoc>("recipe_feedback").createIndex({ recipeId: 1, userId: 1 }, { name: "uniq_recipe_user", unique: true });
  } catch {}
  ensured = true;
}

export async function upsertFeedback(doc: {
  recipeId: string;
  userId: string;
  ownerId?: string;
  displayName?: string;
  rating?: number;
  comment?: string;
  type: "quick" | "detailed";
}) {
  await ensureIndexes();
  const client = await clientPromise;
  const db = client.db();
  const now = new Date();
  await db.collection<RecipeFeedbackDoc>("recipe_feedback").updateOne(
    { recipeId: doc.recipeId, userId: doc.userId },
    {
      $set: {
        ownerId: doc.ownerId,
        displayName: doc.displayName,
        rating: typeof doc.rating === "number" ? doc.rating : undefined,
        comment: typeof doc.comment === "string" ? doc.comment : undefined,
        type: doc.type,
        updatedAt: now,
      },
      $setOnInsert: { recipeId: doc.recipeId, userId: doc.userId, createdAt: now },
    },
    { upsert: true }
  );
}

export async function listFeedback(recipeId: string, limit = 50) {
  await ensureIndexes();
  const client = await clientPromise;
  const db = client.db();
  const items = await db
    .collection<RecipeFeedbackDoc>("recipe_feedback")
    .find({ recipeId })
    .sort({ createdAt: -1 })
    .limit(Math.max(1, Math.min(200, limit)))
    .toArray();
  return items.map((d) => ({ ...d, _id: d._id?.toString() }));
}

export async function getMyFeedback(recipeId: string, userId: string) {
  await ensureIndexes();
  const client = await clientPromise;
  const db = client.db();
  const d = await db.collection<RecipeFeedbackDoc>("recipe_feedback").findOne({ recipeId, userId });
  return d ? { ...d, _id: d._id?.toString() } : null;
}

export async function deleteMyFeedback(recipeId: string, userId: string) {
  await ensureIndexes();
  const client = await clientPromise;
  const db = client.db();
  const res = await db.collection<RecipeFeedbackDoc>("recipe_feedback").deleteOne({ recipeId, userId });
  return res.deletedCount > 0;
}
