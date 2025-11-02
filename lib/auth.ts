import clientPromise from "./mongodb";
import { User } from "./models/User";
import { ObjectId } from "mongodb";
import bcrypt from "@node-rs/bcrypt";

/**
 * Find a user by email.
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  const client = await clientPromise;
  const db = client.db();
  return db.collection<User>("users").findOne({ email });
}

/**
 * Create a new user.
 */
export async function createUser(user: Omit<User, "_id" | "createdAt" | "updatedAt"> & { password: string }): Promise<User> {
  const client = await clientPromise;
  const db = client.db();
  const now = new Date();
  const passwordHash = await bcrypt.hash(user.password, 10);
  const newUser: User = {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    passwordHash,
    provider: user.provider || "credentials",
    googleId: user.googleId,
    createdAt: now,
    updatedAt: now,
  };
  const result = await db.collection<User>("users").insertOne(newUser);
  return { ...newUser, _id: result.insertedId };
}

/**
 * Validate user credentials.
 */
export async function validateUser(email: string, password: string): Promise<User | null> {
  const user = await findUserByEmail(email);
  if (!user || !user.passwordHash) return null;
  const isValid = await bcrypt.compare(password, user.passwordHash);
  return isValid ? user : null;
}