import clientPromise from "../mongodb";

export interface RecipeDoc {
  _id: string;               // Mongo _id as string
  userId: string;
  messageId: string;
  title: string;
  ingredients: string[];
  instructions: string[];
  nutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  createdAt: Date;
}

export async function createRecipe(doc: RecipeDoc) {
  const client = await clientPromise;
  const db = client.db();
  await db.collection<RecipeDoc>("recipes").insertOne(doc);
}

export async function deleteRecipeByMessage(userId: string, messageId: string) {
  const client = await clientPromise;
  const db = client.db();
  await db.collection<RecipeDoc>("recipes").deleteOne({ userId, messageId });
}

export async function getRecipeByMessage(userId: string, messageId: string) {
  const client = await clientPromise;
  const db = client.db();
  return db.collection<RecipeDoc>("recipes").findOne({ userId, messageId });
}