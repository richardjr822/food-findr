import clientPromise from "../mongodb";

export interface User {
  _id?: string;  // made optional to resolve TS2741
  firstName?: string;
  lastName?: string;
  email: string;
  passwordHash?: string;
  createdAt: Date;
  updatedAt?: Date;
  provider?: "credentials" | "google";
  googleId?: string;
}

export async function ensureUser(userId: string, email?: string) {
  const client = await clientPromise;
  const db = client.db();
  await db.collection<User>("users").updateOne(
    { _id: userId },
    {
      $setOnInsert: {
        _id: userId,
        email: email || "",
        createdAt: new Date(),
      },
      $set: { updatedAt: new Date() },
    },
    { upsert: true }
  );
}