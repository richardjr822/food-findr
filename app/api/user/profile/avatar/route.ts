import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import clientPromise from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { logEvent } from "@/lib/log";
import { ObjectId } from "mongodb";
import crypto from "crypto";
import { put } from "@vercel/blob";

export const runtime = "nodejs";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth; // 401
  const { userId, email } = auth;

  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const mime = file.type || "";
    const ext = ALLOWED_TYPES[mime];
    if (!ext) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
    }

    const filename = `${Date.now()}_${crypto.randomBytes(8).toString("hex")}.${ext}`;
    const blobPath = `uploads/avatars/${userId}/${filename}`;
    const blob = await put(blobPath, file, { access: "public", contentType: mime });
    const relUrl = blob.url;

    // Update user document
    const client = await clientPromise;
    const db = client.db();
    await db
      .collection<User>("users")
      .updateOne({ _id: new ObjectId(userId) as any }, { $set: { profilePic: relUrl, "profile.profilePicture": relUrl, updatedAt: new Date() } });

    await logEvent("info", "avatar_upload_success", { userId, email, mime, size: file.size, url: relUrl });

    return NextResponse.json({ ok: true, url: relUrl });
  } catch (err: any) {
    await logEvent("error", "avatar_upload_error", { userId, email, message: err?.message || String(err) });
    return NextResponse.json({ error: "Failed to upload avatar" }, { status: 500 });
  }
}
