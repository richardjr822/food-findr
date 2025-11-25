import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import bcrypt from "@node-rs/bcrypt";

export const runtime = "nodejs";

const ResetSchema = z.object({
  token: z.string().trim().min(10),
  newPassword: z
    .string()
    .trim()
    .min(8)
    .max(128)
    .regex(/(?=.*[0-9!@#$%^&*()_+\-={}\[\]:";'<>?,./])/, "Password must contain at least one number or symbol."),
}).strict();

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";

  let parsed: z.infer<typeof ResetSchema>;
  try {
    const body = await req.json();
    const p = ResetSchema.safeParse(body);
    if (!p.success) {
      return NextResponse.json({ error: "Invalid request", reason: "invalid" }, { status: 400 });
    }
    parsed = p.data;
  } catch {
    return NextResponse.json({ error: "Invalid request", reason: "invalid" }, { status: 400 });
  }

  const tokenHash = crypto.createHash("sha256").update(parsed.token).digest("hex");

  const client = await clientPromise;
  const db = client.db();

  const rec = await db.collection("password_reset_tokens").findOne({ tokenHash });
  if (!rec) {
    await db.collection("password_reset_logs").insertOne({ event: "apply_invalid", tokenHash, ip, userAgent, createdAt: new Date() });
    return NextResponse.json({ error: "Invalid token", reason: "invalid" }, { status: 400 });
  }

  if (rec.usedAt) {
    await db.collection("password_reset_logs").insertOne({ event: "apply_used", tokenHash, ip, userAgent, createdAt: new Date() });
    return NextResponse.json({ error: "Token already used", reason: "used" }, { status: 409 });
  }

  if (new Date(rec.expiresAt).getTime() < Date.now()) {
    await db.collection("password_reset_logs").insertOne({ event: "apply_expired", tokenHash, ip, userAgent, createdAt: new Date() });
    return NextResponse.json({ error: "Token expired", reason: "expired" }, { status: 410 });
  }

  const userId = rec.userId as ObjectId;
  const passwordHash = await bcrypt.hash(parsed.newPassword, 10);

  await db.collection("users").updateOne({ _id: userId as any }, { $set: { passwordHash, updatedAt: new Date() } });

  await db.collection("password_reset_tokens").updateOne(
    { tokenHash },
    { $set: { usedAt: new Date(), usedByIp: ip, usedUserAgent: userAgent } }
  );

  await db.collection("password_reset_logs").insertOne({ event: "apply_ok", tokenHash, ip, userAgent, createdAt: new Date() });

  return NextResponse.json({ ok: true });
}
