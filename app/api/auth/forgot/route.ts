import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { z } from "zod";
import clientPromise from "@/lib/mongodb";
import { findUserByEmail } from "@/lib/auth";
import { ObjectId } from "mongodb";

export const runtime = "nodejs";

const EmailSchema = z.object({ email: z.string().trim().email() }).strict();

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const origin = url.origin;
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";

  let parsed: z.infer<typeof EmailSchema> | null = null;
  try {
    const body = await req.json();
    const res = EmailSchema.safeParse(body);
    if (!res.success) {
      return NextResponse.json({ ok: true });
    }
    parsed = res.data;
  } catch {
    return NextResponse.json({ ok: true });
  }

  const email = parsed.email.toLowerCase();

  try {
    const dbClient = await clientPromise;
    const db = dbClient.db();

    const user = await findUserByEmail(email);

    await db.collection("password_reset_logs").insertOne({
      event: "request",
      email,
      exists: !!user,
      ip,
      userAgent,
      createdAt: new Date(),
    });

    if (!user) {
      return NextResponse.json({ ok: true });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

    const rawId = (user as any)._id;
    const userId = typeof rawId === "string" ? new ObjectId(rawId) : rawId;

    await db.collection("password_reset_tokens").insertOne({
      userId,
      email,
      tokenHash,
      expiresAt,
      usedAt: null,
      createdAt: new Date(),
      ip,
      userAgent,
    });

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const resetUrl = `${origin}/auth/reset/${token}`;

    await transporter.sendMail({
      from: `"FoodFindr" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Reset your FoodFindr password",
      text: `Click the link to reset your password: ${resetUrl}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f6f8fa; padding: 32px;">
          <div style="max-width: 480px; margin: auto; background: #fff; border-radius: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); padding: 32px 24px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="display: inline-block; background: linear-gradient(135deg,#d1fae5,#fff); border-radius: 16px; padding: 16px;">
                <img src="https://img.icons8.com/color/48/000000/meal.png" alt="FoodFindr" width="40" height="40" />
              </span>
            </div>
            <h2 style="color: #065f46; text-align: center; margin-bottom: 8px;">Reset your password</h2>
            <p style="color: #374151; text-align: center; margin-bottom: 24px;">
              Click the button below to reset your password. This link will expire in 1 hour.
            </p>
            <div style="text-align: center;">
              <a href="${resetUrl}" style="display: inline-block; background: #047857; color: white; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600;">Reset Password</a>
            </div>
            <p style="color: #6b7280; text-align: center; font-size: 0.95rem; margin-top: 24px;">
              If you did not request this, you can safely ignore this email.
            </p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    try {
      const dbClient = await clientPromise;
      const db = dbClient.db();
      await db.collection("password_reset_logs").insertOne({
        event: "request_error",
        email,
        error: (error as Error)?.message || String(error),
        ip,
        userAgent,
        createdAt: new Date(),
      });
    } catch {}
  }

  return NextResponse.json({ ok: true });
}
