import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import clientPromise from "@/lib/mongodb";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = (searchParams.get("token") || "").trim();
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";

  if (!token || token.length < 10) {
    return NextResponse.json({ valid: false, reason: "invalid" }, { status: 400 });
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const client = await clientPromise;
  const db = client.db();
  const rec = await db.collection("password_reset_tokens").findOne({ tokenHash });

  if (!rec) {
    await db.collection("password_reset_logs").insertOne({
      event: "validate_invalid",
      tokenHash,
      ip,
      userAgent,
      createdAt: new Date(),
    });
    return NextResponse.json({ valid: false, reason: "invalid" }, { status: 400 });
  }

  if (rec.usedAt) {
    await db.collection("password_reset_logs").insertOne({
      event: "validate_used",
      tokenHash,
      ip,
      userAgent,
      createdAt: new Date(),
    });
    return NextResponse.json({ valid: false, reason: "used" }, { status: 409 });
  }

  if (new Date(rec.expiresAt).getTime() < Date.now()) {
    await db.collection("password_reset_logs").insertOne({
      event: "validate_expired",
      tokenHash,
      ip,
      userAgent,
      createdAt: new Date(),
    });
    return NextResponse.json({ valid: false, reason: "expired" }, { status: 410 });
  }

  await db.collection("password_reset_logs").insertOne({
    event: "validate_ok",
    tokenHash,
    ip,
    userAgent,
    createdAt: new Date(),
  });

  return NextResponse.json({ valid: true });
}
