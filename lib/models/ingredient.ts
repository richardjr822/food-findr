import type { Db, Collection, WithId } from "mongodb";

export type Ingredient = {
  userId: string;
  name: string;
  quantity?: string;
  unit?: string;
  category?: string;
  createdAt: Date;
};

export type IngredientDoc = WithId<Ingredient>;

export function getIngredientsCollection(db: Db): Collection<Ingredient> {
  return db.collection<Ingredient>("ingredients");
}

export async function ensureIngredientIndexes(db: Db) {
  const col = getIngredientsCollection(db);
  await col.createIndex({ userId: 1, name: 1 }, { unique: false });
  await col.createIndex({ userId: 1, createdAt: -1 });
}