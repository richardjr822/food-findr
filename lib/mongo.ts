import clientPromise from "./mongodb";
import type { Db } from "mongodb";

export async function getMongoDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db(); // uses the default DB from your URI
}