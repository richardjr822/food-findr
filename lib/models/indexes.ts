import clientPromise from "../mongodb";

export async function ensureIndexes() {
  const client = await clientPromise;
  const db = client.db();
  await db.collection("threads").createIndex({ userId: 1, updatedAt: -1 });
  await db.collection("recipes").createIndex({ userId: 1, createdAt: -1 });
  await db.collection("recipes").createIndex({ userId: 1, messageId: 1 }, { unique: true });
}