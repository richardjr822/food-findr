import clientPromise from "../mongodb";
import type { Db } from "mongodb";

export interface ThreadMessage {
  id: string;
  role: "user" | "model";
  content?: string;
  recipeId?: string | null;
  saved?: boolean;
  createdAt: Date;
  recipeSnapshot?: {
    title: string;
    ingredients: string[];
    instructions: string[];
    nutrition?: {
      calories?: number;
      protein?: number;
      carbs?: number;
      fat?: number;
    };
  };
}

export interface Thread {
  id: string;
  userId: string;
  title: string;
  preview?: string;        // short conversation snippet
  updatedAt: Date;
  createdAt: Date;
  messages: ThreadMessage[];
}

// Helper to derive title + preview
function deriveTitleAndPreview(messages: ThreadMessage[]): { title: string; preview: string } {
  if (!messages.length) return { title: "New Recipe", preview: "Empty conversation" };
  const lastModel = [...messages].reverse().find(m => m.role === "model" && (m.recipeSnapshot?.title || m.content));
  const lastUser = [...messages].reverse().find(m => m.role === "user" && m.content);
  const title =
    lastModel?.recipeSnapshot?.title?.slice(0, 60) ||
    lastModel?.content?.slice(0, 60) ||
    lastUser?.content?.slice(0, 60) ||
    "New Recipe";
  const previewSource = lastModel || lastUser;
  let preview = previewSource?.content || lastModel?.recipeSnapshot?.title || title;
  preview = preview.replace(/\s+/g, " ").trim().slice(0, 120);
  return { title, preview };
}

export async function getThreads(userId: string, limit = 50): Promise<Thread[]> {
  const client = await clientPromise;
  const db = client.db();
  return db
    .collection<Thread>("threads")
    .find({ userId })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .toArray();
}

export function getThreadsCollection(db: Db) {
  return db.collection<Thread>("threads");
}

// Adjust upsertThread so it never creates an empty thread if no messages exist
export async function upsertThread(userId: string, threadId: string, title: string) {
  const client = await clientPromise;
  const db = client.db();
  const existing = await db.collection<Thread>("threads").findOne({ id: threadId, userId });
  if (!existing) {
    // Do nothing; creation happens with first appendMessage
    return;
  }
  await db.collection<Thread>("threads").updateOne(
    { id: threadId, userId },
    { $set: { title: title || existing.title, updatedAt: new Date() } }
  );
}

export async function replaceMessages(userId: string, threadId: string, messages: ThreadMessage[]) {
  const client = await clientPromise;
  const db = client.db();
  const { title, preview } = deriveTitleAndPreview(messages);
  await db.collection<Thread>("threads").updateOne(
    { id: threadId, userId },
    { $set: { messages, title, preview, updatedAt: new Date() } }
  );
}

export async function appendMessage(userId: string, threadId: string, message: ThreadMessage) {
  const client = await clientPromise;
  const db = client.db();
  const coll = db.collection<Thread>("threads");

  const thread = await coll.findOne({ id: threadId, userId });
  const messages = thread ? [...thread.messages, message] : [message];
  const { title, preview } = deriveTitleAndPreview(messages);

  if (thread) {
    // Update existing: push message and set metadata
    await coll.updateOne(
      { id: threadId, userId },
      {
        $push: { messages: message },
        $set: { updatedAt: new Date(), title, preview },
      }
    );
  } else {
    // Create new: set messages only via setOnInsert to avoid conflict with $push on upsert
    await coll.updateOne(
      { id: threadId, userId },
      {
        $setOnInsert: {
          id: threadId,
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
          messages: [message],
          title,
          preview,
        },
      },
      { upsert: true }
    );
  }
}

export async function toggleMessageSaved(userId: string, threadId: string, messageId: string, saved: boolean, recipeId?: string | null) {
  const client = await clientPromise;
  const db = client.db();
  await db.collection<Thread>("threads").updateOne(
    { id: threadId, userId, "messages.id": messageId },
    {
      $set: {
        "messages.$.saved": saved,
        "messages.$.recipeId": recipeId ?? null,
      },
    }
  );
}